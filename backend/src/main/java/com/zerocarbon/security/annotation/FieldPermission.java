package com.zerocarbon.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 字段级权限控制注解
 * 用于标记需要进行字段级权限控制的实体字段
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-01-01
 */
@Target({ElementType.FIELD, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface FieldPermission {
    
    /**
     * 权限代码
     * 格式：resource:action，如 user:read、user:write
     */
    String value();
    
    /**
     * 字段名称（用于数据权限控制）
     */
    String fieldName() default "";
    
    /**
     * 表名称（用于数据权限控制）
     */
    String tableName() default "";
    
    /**
     * 是否允许脱敏显示
     * true: 无权限时显示脱敏数据
     * false: 无权限时不显示该字段
     */
    boolean allowMasking() default true;
    
    /**
     * 默认脱敏规则
     * 当用户无完整权限但允许脱敏时使用
     */
    String defaultMaskRule() default "***";
    
    /**
     * 权限检查失败时的错误消息
     */
    String message() default "无权限访问该字段";
}