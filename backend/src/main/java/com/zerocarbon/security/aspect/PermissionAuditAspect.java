package com.zerocarbon.security.aspect;

import com.zerocarbon.security.annotation.PermissionAudit;
import com.zerocarbon.security.entity.PermissionAuditLog;
import com.zerocarbon.security.service.PermissionAuditService;
import com.zerocarbon.security.util.SecurityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * 权限审计切面
 * 零碳园区数字孪生系统权限审计管理
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-01-01
 */
@Slf4j
@Aspect
@Component
@Order(2) // 在数据权限检查之后执行
@RequiredArgsConstructor
public class PermissionAuditAspect {
    
    private final PermissionAuditService auditService;
    private final ObjectMapper objectMapper;
    
    /**
     * 拦截带有@PermissionAudit注解的方法
     */
    @Around("@annotation(permissionAudit)")
    public Object auditPermissionOperation(ProceedingJoinPoint joinPoint, PermissionAudit permissionAudit) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        // 获取当前用户信息
        Long currentUserId = SecurityUtils.getCurrentUserId();
        String currentUsername = SecurityUtils.getCurrentUsername();
        
        // 获取方法信息
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Object[] args = joinPoint.getArgs();
        
        // 创建审计日志对象
        PermissionAuditLog auditLog = new PermissionAuditLog();
        auditLog.setUserId(currentUserId);
        auditLog.setUsername(currentUsername != null ? currentUsername : "anonymous");
        auditLog.setAuditType(permissionAudit.auditType());
        auditLog.setOperationDescription(buildOperationDescription(permissionAudit, method, args));
        auditLog.setResourceType(permissionAudit.resourceType());
        auditLog.setResourceId(extractResourceId(args));
        auditLog.setAuditLevel(permissionAudit.auditLevel());
        auditLog.setOperationTime(LocalDateTime.now());
        
        // 记录请求参数
        if (permissionAudit.recordRequestParams()) {
            auditLog.setRequestParams(serializeRequestParams(args, permissionAudit.recordSensitiveInfo()));
        }
        
        // 补充HTTP请求信息
        enrichWithHttpRequestInfo(auditLog);
        
        Object result = null;
        Throwable exception = null;
        
        try {
            // 执行原方法
            result = joinPoint.proceed();
            
            // 记录成功结果
            auditLog.setResult(PermissionAuditLog.OperationResult.SUCCESS);
            
            // 记录返回结果
            if (permissionAudit.recordReturnResult() && result != null) {
                auditLog.setResponseResult(serializeReturnResult(result, permissionAudit.recordSensitiveInfo()));
            }
            
        } catch (Throwable e) {
            exception = e;
            
            // 记录失败结果
            if (e instanceof SecurityException || e.getClass().getSimpleName().contains("Permission")) {
                auditLog.setResult(PermissionAuditLog.OperationResult.DENIED);
            } else {
                auditLog.setResult(PermissionAuditLog.OperationResult.ERROR);
            }
            
            auditLog.setFailureReason(e.getMessage());
            
            // 根据异常类型调整审计级别
            if (auditLog.getAuditLevel() == PermissionAuditLog.AuditLevel.INFO) {
                auditLog.setAuditLevel(PermissionAuditLog.AuditLevel.WARNING);
            }
        } finally {
            // 计算执行时长
            long executionTime = System.currentTimeMillis() - startTime;
            auditLog.setExecutionDuration(executionTime);
            
            // 异步记录审计日志
            auditService.recordAuditLogAsync(auditLog);
            
            log.debug("权限操作审计记录: 用户={}, 操作={}, 结果={}, 耗时={}ms", 
                     currentUsername, permissionAudit.auditType(), auditLog.getResult(), executionTime);
        }
        
        // 如果有异常，重新抛出
        if (exception != null) {
            throw exception;
        }
        
        return result;
    }
    
    /**
     * 构建操作描述
     */
    private String buildOperationDescription(PermissionAudit annotation, Method method, Object[] args) {
        if (!annotation.description().isEmpty()) {
            return annotation.description();
        }
        
        // 默认描述：类名.方法名
        StringBuilder description = new StringBuilder();
        description.append(method.getDeclaringClass().getSimpleName())
                  .append(".")
                  .append(method.getName());
        
        // 添加参数信息（简化版）
        if (args != null && args.length > 0) {
            description.append("(");
            for (int i = 0; i < args.length; i++) {
                if (i > 0) description.append(", ");
                if (args[i] != null) {
                    description.append(args[i].getClass().getSimpleName());
                } else {
                    description.append("null");
                }
            }
            description.append(")");
        }
        
        return description.toString();
    }
    
    /**
     * 从方法参数中提取资源ID
     */
    private String extractResourceId(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        
        // 查找ID参数
        for (Object arg : args) {
            if (arg != null) {
                // 如果是基本类型或字符串，直接作为ID
                if (arg instanceof String || arg instanceof Number) {
                    return arg.toString();
                }
                
                // 如果是复杂对象，尝试获取id字段
                try {
                    java.lang.reflect.Field idField = findIdField(arg.getClass());
                    if (idField != null) {
                        idField.setAccessible(true);
                        Object idValue = idField.get(arg);
                        if (idValue != null) {
                            return idValue.toString();
                        }
                    }
                } catch (Exception e) {
                    // 忽略异常，继续处理下一个参数
                }
            }
        }
        
        return null;
    }
    
    /**
     * 查找ID字段
     */
    private java.lang.reflect.Field findIdField(Class<?> clazz) {
        // 常见的ID字段名
        String[] idFieldNames = {"id", "userId", "resourceId", "entityId", "primaryKey"};
        
        for (String fieldName : idFieldNames) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                // 继续查找下一个字段名
            }
        }
        
        // 查找带有@Id注解的字段
        for (java.lang.reflect.Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(jakarta.persistence.Id.class)) {
                return field;
            }
        }
        
        return null;
    }
    
    /**
     * 序列化请求参数
     */
    private String serializeRequestParams(Object[] args, boolean includeSensitive) {
        if (args == null || args.length == 0) {
            return null;
        }
        
        try {
            Map<String, Object> paramMap = new HashMap<>();
            for (int i = 0; i < args.length; i++) {
                Object arg = args[i];
                if (arg != null) {
                    if (includeSensitive) {
                        paramMap.put("param" + i, arg);
                    } else {
                        // 过滤敏感信息
                        paramMap.put("param" + i, filterSensitiveInfo(arg));
                    }
                }
            }
            
            return objectMapper.writeValueAsString(paramMap);
        } catch (Exception e) {
            log.warn("序列化请求参数失败", e);
            return "[序列化失败: " + e.getMessage() + "]";
        }
    }
    
    /**
     * 序列化返回结果
     */
    private String serializeReturnResult(Object result, boolean includeSensitive) {
        try {
            if (includeSensitive) {
                return objectMapper.writeValueAsString(result);
            } else {
                // 过滤敏感信息
                Object filteredResult = filterSensitiveInfo(result);
                return objectMapper.writeValueAsString(filteredResult);
            }
        } catch (Exception e) {
            log.warn("序列化返回结果失败", e);
            return "[序列化失败: " + e.getMessage() + "]";
        }
    }
    
    /**
     * 过滤敏感信息
     */
    private Object filterSensitiveInfo(Object obj) {
        if (obj == null) {
            return null;
        }
        
        // 基本类型直接返回
        if (obj.getClass().isPrimitive() || obj instanceof String || obj instanceof Number || obj instanceof Boolean) {
            return obj;
        }
        
        // 对于复杂对象，返回类型信息而不是具体内容
        if (obj instanceof java.util.Collection) {
            java.util.Collection<?> collection = (java.util.Collection<?>) obj;
            return String.format("[Collection: size=%d, type=%s]", collection.size(), obj.getClass().getSimpleName());
        }
        
        if (obj instanceof java.util.Map) {
            java.util.Map<?, ?> map = (java.util.Map<?, ?>) obj;
            return String.format("[Map: size=%d, type=%s]", map.size(), obj.getClass().getSimpleName());
        }
        
        // 其他对象返回类型信息
        return String.format("[Object: type=%s]", obj.getClass().getSimpleName());
    }
    
    /**
     * 补充HTTP请求信息
     */
    private void enrichWithHttpRequestInfo(PermissionAuditLog auditLog) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                // 设置请求方法和URL
                auditLog.setRequestMethod(request.getMethod());
                auditLog.setRequestUrl(request.getRequestURI());
                
                // 设置IP地址
                auditLog.setIpAddress(getClientIpAddress(request));
                
                // 设置用户代理
                auditLog.setUserAgent(request.getHeader("User-Agent"));
                
                // 设置会话ID
                if (request.getSession(false) != null) {
                    auditLog.setSessionId(request.getSession().getId());
                }
            }
        } catch (Exception e) {
            log.warn("补充HTTP请求信息失败", e);
        }
    }
    
    /**
     * 获取客户端真实IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR"
        };
        
        for (String headerName : headerNames) {
            String ip = request.getHeader(headerName);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // 多级代理的情况，取第一个IP
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * 检查方法是否需要权限审计
     */
    public boolean requiresAudit(Method method) {
        return method.isAnnotationPresent(PermissionAudit.class);
    }
    
    /**
     * 获取方法的审计配置
     */
    public PermissionAudit getAuditConfig(Method method) {
        return method.getAnnotation(PermissionAudit.class);
    }
    
    /**
     * 手动记录审计日志
     */
    public void recordManualAudit(PermissionAuditLog.AuditType auditType, String description, 
                                 String resourceType, String resourceId, 
                                 PermissionAuditLog.AuditLevel level) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        String currentUsername = SecurityUtils.getCurrentUsername();
        
        PermissionAuditLog auditLog = new PermissionAuditLog();
        auditLog.setUserId(currentUserId);
        auditLog.setUsername(currentUsername != null ? currentUsername : "system");
        auditLog.setAuditType(auditType);
        auditLog.setOperationDescription(description);
        auditLog.setResourceType(resourceType);
        auditLog.setResourceId(resourceId);
        auditLog.setAuditLevel(level);
        auditLog.setResult(PermissionAuditLog.OperationResult.SUCCESS);
        auditLog.setOperationTime(LocalDateTime.now());
        
        enrichWithHttpRequestInfo(auditLog);
        auditService.recordAuditLogAsync(auditLog);
    }
}