package com.zerocarbon.security.aspect;

import com.zerocarbon.security.annotation.DataPermissionCheck;
import com.zerocarbon.security.service.DataPermissionService;
import com.zerocarbon.security.service.PermissionAuditService;
import com.zerocarbon.security.util.SecurityUtils;
import com.zerocarbon.security.exception.DataPermissionException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Collection;
import java.util.Map;

/**
 * 数据权限检查切面
 * 零碳园区数字孪生系统数据权限管理
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-06-01
 */
@Slf4j
@Aspect
@Component
@Order(1) // 确保在其他切面之前执行
@RequiredArgsConstructor
public class DataPermissionAspect {
    
    private final DataPermissionService dataPermissionService;
    private final PermissionAuditService auditService;
    
    /**
     * 拦截带有@DataPermissionCheck注解的方法
     */
    @Around("@annotation(dataPermissionCheck)")
    public Object checkDataPermission(ProceedingJoinPoint joinPoint, DataPermissionCheck dataPermissionCheck) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        // 获取当前用户信息
        Long currentUserId = SecurityUtils.getCurrentUserId();
        String currentUsername = SecurityUtils.getCurrentUsername();
        
        if (currentUserId == null) {
            log.warn("无法获取当前用户信息，数据权限检查失败");
            throw new DataPermissionException("用户未认证，无法进行数据权限检查");
        }
        
        // 获取方法信息
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Object[] args = joinPoint.getArgs();
        
        try {
            // 执行权限检查
            boolean hasPermission = performPermissionCheck(dataPermissionCheck, currentUserId, args, method);
            
            if (!hasPermission) {
                // 记录权限检查失败的审计日志
                auditService.recordDataAccessAudit(
                    currentUserId, currentUsername,
                    dataPermissionCheck.operation().name(),
                    dataPermissionCheck.tableName(),
                    extractResourceId(args),
                    false
                );
                
                // 根据失败处理策略决定如何处理
                return handlePermissionFailure(dataPermissionCheck, method);
            }
            
            // 执行原方法
            Object result = joinPoint.proceed();
            
            // 如果启用了自动脱敏，对返回结果进行脱敏处理
            if (dataPermissionCheck.enableAutoMasking()) {
                result = applyDataMasking(result, dataPermissionCheck, currentUserId);
            }
            
            // 记录成功的数据访问审计
            long executionTime = System.currentTimeMillis() - startTime;
            auditService.recordDataAccessAudit(
                currentUserId, currentUsername,
                dataPermissionCheck.operation().name(),
                dataPermissionCheck.tableName(),
                extractResourceId(args),
                true
            );
            
            log.debug("数据权限检查通过: 用户={}, 表={}, 操作={}, 耗时={}ms", 
                     currentUsername, dataPermissionCheck.tableName(), 
                     dataPermissionCheck.operation(), executionTime);
            
            return result;
            
        } catch (DataPermissionException e) {
            // 记录权限异常
            auditService.recordSecurityEventAudit(
                currentUserId, currentUsername,
                "DATA_PERMISSION_VIOLATION",
                String.format("数据权限检查失败: %s.%s - %s", 
                             method.getDeclaringClass().getSimpleName(), 
                             method.getName(), e.getMessage()),
                com.zerocarbon.security.entity.PermissionAuditLog.AuditLevel.WARNING
            );
            throw e;
        } catch (Exception e) {
            // 记录系统异常
            auditService.recordSecurityEventAudit(
                currentUserId, currentUsername,
                "DATA_PERMISSION_ERROR",
                String.format("数据权限检查异常: %s.%s - %s", 
                             method.getDeclaringClass().getSimpleName(), 
                             method.getName(), e.getMessage()),
                com.zerocarbon.security.entity.PermissionAuditLog.AuditLevel.ERROR
            );
            throw e;
        }
    }
    
    /**
     * 执行权限检查
     */
    private boolean performPermissionCheck(DataPermissionCheck annotation, Long userId, Object[] args, Method method) {
        try {
            // 检查表级权限
            boolean hasTablePermission = dataPermissionService.hasTablePermission(
                userId, annotation.tableName(), annotation.operation().name()
            );
            
            if (!hasTablePermission) {
                log.warn("用户 {} 没有表 {} 的 {} 权限", userId, annotation.tableName(), annotation.operation());
                return false;
            }
            
            // 检查字段级权限
            if (annotation.checkFields().length > 0) {
                for (String fieldName : annotation.checkFields()) {
                    boolean hasFieldPermission = dataPermissionService.hasFieldPermission(
                        userId, annotation.tableName(), fieldName, annotation.operation().name()
                    );
                    
                    if (!hasFieldPermission) {
                        log.warn("用户 {} 没有表 {} 字段 {} 的 {} 权限", 
                                userId, annotation.tableName(), fieldName, annotation.operation());
                        return false;
                    }
                }
            }
            
            // 检查行级权限（如果有资源ID）
            String resourceId = extractResourceId(args);
            if (resourceId != null && !resourceId.isEmpty()) {
                boolean hasRowPermission = dataPermissionService.hasRowPermission(
                    userId, annotation.tableName(), resourceId, annotation.operation().name()
                );
                
                if (!hasRowPermission) {
                    log.warn("用户 {} 没有表 {} 资源 {} 的 {} 权限", 
                            userId, annotation.tableName(), resourceId, annotation.operation());
                    return false;
                }
            }
            
            return true;
            
        } catch (Exception e) {
            log.error("权限检查过程中发生异常", e);
            return false;
        }
    }
    
    /**
     * 从方法参数中提取资源ID
     */
    private String extractResourceId(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        
        // 简单策略：取第一个非空参数作为资源ID
        for (Object arg : args) {
            if (arg != null) {
                if (arg instanceof String || arg instanceof Number) {
                    return arg.toString();
                }
                // 如果是复杂对象，尝试获取id字段
                try {
                    java.lang.reflect.Field idField = arg.getClass().getDeclaredField("id");
                    idField.setAccessible(true);
                    Object idValue = idField.get(arg);
                    if (idValue != null) {
                        return idValue.toString();
                    }
                } catch (Exception e) {
                    // 忽略异常，继续处理下一个参数
                }
            }
        }
        
        return null;
    }
    
    /**
     * 处理权限检查失败的情况
     */
    private Object handlePermissionFailure(DataPermissionCheck annotation, Method method) throws Throwable {
        switch (annotation.failureStrategy()) {
            case THROW_EXCEPTION:
                String message = annotation.customErrorMessage().isEmpty() ? 
                    String.format("没有访问表 %s 的权限", annotation.tableName()) : 
                    annotation.customErrorMessage();
                throw new DataPermissionException(message);
                
            case RETURN_EMPTY:
                // 根据返回类型返回空值
                Class<?> returnType = method.getReturnType();
                if (returnType == void.class || returnType == Void.class) {
                    return null;
                } else if (Collection.class.isAssignableFrom(returnType)) {
                    return java.util.Collections.emptyList();
                } else if (Map.class.isAssignableFrom(returnType)) {
                    return java.util.Collections.emptyMap();
                } else if (returnType.isArray()) {
                    return java.lang.reflect.Array.newInstance(returnType.getComponentType(), 0);
                } else {
                    return null;
                }
                
            case RETURN_MASKED:
                // 返回脱敏后的空对象或默认值
                return createMaskedResult(method.getReturnType());
                
            default:
                throw new DataPermissionException("未知的权限失败处理策略");
        }
    }
    
    /**
     * 创建脱敏结果
     */
    private Object createMaskedResult(Class<?> returnType) {
        if (returnType == String.class) {
            return "***";
        } else if (returnType == Integer.class || returnType == int.class) {
            return 0;
        } else if (returnType == Long.class || returnType == long.class) {
            return 0L;
        } else if (returnType == Double.class || returnType == double.class) {
            return 0.0;
        } else if (returnType == Boolean.class || returnType == boolean.class) {
            return false;
        } else if (Collection.class.isAssignableFrom(returnType)) {
            return java.util.Collections.emptyList();
        } else if (Map.class.isAssignableFrom(returnType)) {
            return java.util.Collections.emptyMap();
        } else {
            return null;
        }
    }
    
    /**
     * 对返回结果应用数据脱敏
     */
    private Object applyDataMasking(Object result, DataPermissionCheck annotation, Long userId) {
        if (result == null) {
            return null;
        }
        
        try {
            // 如果是集合，对每个元素进行脱敏
            if (result instanceof Collection) {
                Collection<?> collection = (Collection<?>) result;
                collection.forEach(item -> maskSensitiveFields(item, annotation, userId));
            } else {
                // 对单个对象进行脱敏
                maskSensitiveFields(result, annotation, userId);
            }
        } catch (Exception e) {
            log.error("数据脱敏处理失败", e);
        }
        
        return result;
    }
    
    /**
     * 对对象的敏感字段进行脱敏
     */
    private void maskSensitiveFields(Object obj, DataPermissionCheck annotation, Long userId) {
        if (obj == null) {
            return;
        }
        
        Class<?> clazz = obj.getClass();
        
        // 跳过基本类型
        if (clazz.isPrimitive() || clazz.getName().startsWith("java.")) {
            return;
        }
        
        // 检查需要脱敏的字段
        for (String fieldName : annotation.checkFields()) {
            try {
                java.lang.reflect.Field field = clazz.getDeclaredField(fieldName);
                field.setAccessible(true);
                
                // 检查用户是否有该字段的访问权限
                boolean hasPermission = dataPermissionService.hasFieldPermission(
                    userId, annotation.tableName(), fieldName, annotation.operation().name()
                );
                
                if (!hasPermission) {
                    Object fieldValue = field.get(obj);
                    if (fieldValue != null) {
                        // 应用脱敏规则
                        String maskedValue = dataPermissionService.maskFieldValue(
                            fieldValue.toString(), fieldName
                        );
                        field.set(obj, maskedValue);
                    }
                }
            } catch (Exception e) {
                log.warn("字段脱敏失败: {}.{}", clazz.getSimpleName(), fieldName, e);
            }
        }
    }
    
    /**
     * 检查方法是否需要数据权限检查
     */
    public boolean requiresPermissionCheck(Method method) {
        return method.isAnnotationPresent(DataPermissionCheck.class);
    }
    
    /**
     * 获取方法的权限检查配置
     */
    public DataPermissionCheck getPermissionCheckConfig(Method method) {
        return method.getAnnotation(DataPermissionCheck.class);
    }
}