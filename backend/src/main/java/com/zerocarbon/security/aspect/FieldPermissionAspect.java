package com.zerocarbon.security.aspect;

import com.zerocarbon.security.annotation.FieldPermission;
import com.zerocarbon.security.service.DataPermissionService;
import com.zerocarbon.security.service.PermissionAuditService;
import com.zerocarbon.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 字段级权限控制切面
 * 零碳园区数字孪生系统字段权限管理
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-01-01
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class FieldPermissionAspect {
    
    private final DataPermissionService dataPermissionService;
    private final PermissionAuditService auditService;
    
    /**
     * 拦截返回结果，进行字段权限检查和数据脱敏
     */
    @Around("execution(* com.zerocarbon..*.*(..)) && @annotation(org.springframework.web.bind.annotation.GetMapping)")
    public Object handleFieldPermission(ProceedingJoinPoint joinPoint) throws Throwable {
        // 执行原方法
        Object result = joinPoint.proceed();
        
        if (result == null) {
            return result;
        }
        
        try {
            // 获取当前用户信息
            Long currentUserId = SecurityUtils.getCurrentUserId();
            String currentUsername = SecurityUtils.getCurrentUsername();
            
            if (currentUserId == null) {
                log.warn("无法获取当前用户信息，跳过字段权限检查");
                return result;
            }
            
            // 处理字段权限
            Object processedResult = processFieldPermissions(result, currentUserId, currentUsername);
            
            return processedResult;
            
        } catch (Exception e) {
            log.error("字段权限处理失败", e);
            // 记录安全事件
            auditService.recordSecurityEventAudit(
                SecurityUtils.getCurrentUserId(),
                SecurityUtils.getCurrentUsername(),
                "FIELD_PERMISSION_ERROR",
                "字段权限处理异常: " + e.getMessage(),
                com.zerocarbon.security.entity.PermissionAuditLog.AuditLevel.ERROR
            );
            return result;
        }
    }
    
    /**
     * 处理对象的字段权限
     */
    private Object processFieldPermissions(Object obj, Long userId, String username) {
        if (obj == null) {
            return null;
        }
        
        // 处理集合类型
        if (obj instanceof Collection) {
            Collection<?> collection = (Collection<?>) obj;
            collection.forEach(item -> processFieldPermissions(item, userId, username));
            return obj;
        }
        
        // 处理Map类型
        if (obj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) obj;
            map.values().forEach(value -> processFieldPermissions(value, userId, username));
            return obj;
        }
        
        // 处理普通对象
        Class<?> clazz = obj.getClass();
        
        // 跳过基本类型和包装类型
        if (clazz.isPrimitive() || clazz.getName().startsWith("java.")) {
            return obj;
        }
        
        // 检查类的字段
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            FieldPermission fieldPermission = field.getAnnotation(FieldPermission.class);
            if (fieldPermission != null) {
                processFieldWithPermission(obj, field, fieldPermission, userId, username);
            }
        }
        
        return obj;
    }
    
    /**
     * 处理带有权限注解的字段
     */
    private void processFieldWithPermission(Object obj, Field field, FieldPermission fieldPermission, 
                                           Long userId, String username) {
        try {
            field.setAccessible(true);
            Object fieldValue = field.get(obj);
            
            if (fieldValue == null) {
                return;
            }
            
            // 检查用户是否有该字段的访问权限
            boolean hasPermission = checkFieldPermission(userId, fieldPermission.permissionCode(), 
                                                        fieldPermission.tableName(), fieldPermission.fieldName());
            
            if (!hasPermission) {
                // 记录权限检查审计
                auditService.recordPermissionCheckAudit(
                    userId, username, fieldPermission.permissionCode(),
                    fieldPermission.tableName(), fieldPermission.fieldName(), false
                );
                
                // 如果允许脱敏显示，则进行数据脱敏
                if (fieldPermission.allowMaskedDisplay()) {
                    String maskedValue = applyDataMasking(fieldValue.toString(), fieldPermission.defaultMaskingRule());
                    field.set(obj, maskedValue);
                } else {
                    // 否则清空字段值
                    field.set(obj, null);
                }
            } else {
                // 记录成功的权限检查
                auditService.recordPermissionCheckAudit(
                    userId, username, fieldPermission.permissionCode(),
                    fieldPermission.tableName(), fieldPermission.fieldName(), true
                );
            }
            
        } catch (Exception e) {
            log.error("处理字段权限失败: {}.{}", obj.getClass().getSimpleName(), field.getName(), e);
        }
    }
    
    /**
     * 检查字段权限
     */
    private boolean checkFieldPermission(Long userId, String permissionCode, String tableName, String fieldName) {
        try {
            // 使用现有的数据权限服务检查权限
            return dataPermissionService.hasFieldPermission(userId, tableName, fieldName, permissionCode);
        } catch (Exception e) {
            log.error("检查字段权限失败: userId={}, permissionCode={}, table={}, field={}", 
                     userId, permissionCode, tableName, fieldName, e);
            // 权限检查失败时，默认拒绝访问
            return false;
        }
    }
    
    /**
     * 应用数据脱敏规则
     */
    private String applyDataMasking(String value, String maskingRule) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        
        try {
            switch (maskingRule.toUpperCase()) {
                case "PHONE":
                    // 手机号脱敏：138****1234
                    if (value.length() >= 11) {
                        return value.substring(0, 3) + "****" + value.substring(7);
                    }
                    break;
                    
                case "EMAIL":
                    // 邮箱脱敏：abc***@example.com
                    int atIndex = value.indexOf('@');
                    if (atIndex > 3) {
                        return value.substring(0, 3) + "***" + value.substring(atIndex);
                    }
                    break;
                    
                case "ID_CARD":
                    // 身份证脱敏：前4位和后4位保留
                    if (value.length() >= 8) {
                        return value.substring(0, 4) + "****" + value.substring(value.length() - 4);
                    }
                    break;
                    
                case "NAME":
                    // 姓名脱敏：保留第一个字符
                    if (value.length() > 1) {
                        return value.charAt(0) + "*".repeat(value.length() - 1);
                    }
                    break;
                    
                case "BANK_CARD":
                    // 银行卡脱敏：前4位和后4位保留
                    if (value.length() >= 8) {
                        return value.substring(0, 4) + " **** **** " + value.substring(value.length() - 4);
                    }
                    break;
                    
                case "ADDRESS":
                    // 地址脱敏：保留前6个字符
                    if (value.length() > 6) {
                        return value.substring(0, 6) + "***";
                    }
                    break;
                    
                case "PARTIAL":
                    // 部分脱敏：中间部分用*替换
                    int length = value.length();
                    if (length > 4) {
                        int keepStart = Math.min(2, length / 4);
                        int keepEnd = Math.min(2, length / 4);
                        return value.substring(0, keepStart) + 
                               "*".repeat(length - keepStart - keepEnd) + 
                               value.substring(length - keepEnd);
                    }
                    break;
                    
                case "FULL":
                    // 完全脱敏
                    return "*".repeat(value.length());
                    
                default:
                    // 默认脱敏规则：保留前2位和后2位
                    if (value.length() > 4) {
                        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
                    } else {
                        return "***";
                    }
            }
        } catch (Exception e) {
            log.error("数据脱敏失败: value={}, rule={}", value, maskingRule, e);
        }
        
        // 如果脱敏失败，返回默认脱敏结果
        return "***";
    }
    
    /**
     * 批量处理字段权限
     */
    public void batchProcessFieldPermissions(List<?> objects, Long userId, String username) {
        if (objects == null || objects.isEmpty()) {
            return;
        }
        
        objects.forEach(obj -> processFieldPermissions(obj, userId, username));
    }
    
    /**
     * 检查对象是否包含敏感字段
     */
    public boolean containsSensitiveFields(Object obj) {
        if (obj == null) {
            return false;
        }
        
        Class<?> clazz = obj.getClass();
        Field[] fields = clazz.getDeclaredFields();
        
        for (Field field : fields) {
            if (field.isAnnotationPresent(FieldPermission.class)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 获取对象的敏感字段列表
     */
    public List<String> getSensitiveFields(Class<?> clazz) {
        Field[] fields = clazz.getDeclaredFields();
        return java.util.Arrays.stream(fields)
                .filter(field -> field.isAnnotationPresent(FieldPermission.class))
                .map(Field::getName)
                .collect(java.util.stream.Collectors.toList());
    }
}