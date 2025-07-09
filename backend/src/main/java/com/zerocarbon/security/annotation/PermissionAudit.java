package com.zerocarbon.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 权限审计注解
 * 用于标记需要进行权限审计的方法
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-06-01
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface PermissionAudit {
    
    /**
     * 审计操作类型
     */
    AuditType value() default AuditType.ACCESS;
    
    /**
     * 审计描述
     */
    String description() default "";
    
    /**
     * 资源类型
     */
    String resourceType() default "";
    
    /**
     * 是否记录请求参数
     */
    boolean logParams() default true;
    
    /**
     * 是否记录返回结果
     */
    boolean logResult() default false;
    
    /**
     * 是否记录敏感信息
     * false时会对敏感信息进行脱敏处理
     */
    boolean logSensitive() default false;
    
    /**
     * 审计级别
     */
    AuditLevel level() default AuditLevel.INFO;
    
    /**
     * 审计类型枚举
     */
    enum AuditType {
        ACCESS("访问审计"),
        PERMISSION_CHANGE("权限变更"),
        DATA_ACCESS("数据访问"),
        SECURITY_EVENT("安全事件"),
        LOGIN("登录审计"),
        LOGOUT("登出审计"),
        OPERATION("操作审计");
        
        private final String description;
        
        AuditType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 审计级别枚举
     */
    enum AuditLevel {
        DEBUG("调试"),
        INFO("信息"),
        WARN("警告"),
        ERROR("错误"),
        CRITICAL("严重");
        
        private final String description;
        
        AuditLevel(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}