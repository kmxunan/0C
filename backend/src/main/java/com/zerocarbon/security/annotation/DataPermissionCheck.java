package com.zerocarbon.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 数据权限检查注解
 * 用于标记需要进行数据权限检查的方法
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-01-01
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DataPermissionCheck {
    
    /**
     * 数据表名
     */
    String tableName();
    
    /**
     * 操作类型
     */
    OperationType operation() default OperationType.READ;
    
    /**
     * 需要检查的字段列表
     * 空数组表示检查所有字段
     */
    String[] fields() default {};
    
    /**
     * 是否启用自动脱敏
     */
    boolean autoMasking() default true;
    
    /**
     * 权限检查失败时的处理策略
     */
    FailureStrategy onFailure() default FailureStrategy.THROW_EXCEPTION;
    
    /**
     * 自定义错误消息
     */
    String message() default "数据权限检查失败";
    
    /**
     * 操作类型枚举
     */
    enum OperationType {
        READ("读取"),
        WRITE("写入"),
        DELETE("删除"),
        UPDATE("更新");
        
        private final String description;
        
        OperationType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 失败处理策略枚举
     */
    enum FailureStrategy {
        THROW_EXCEPTION("抛出异常"),
        RETURN_NULL("返回空值"),
        RETURN_MASKED("返回脱敏数据"),
        LOG_AND_CONTINUE("记录日志并继续");
        
        private final String description;
        
        FailureStrategy(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}