package com.zerocarbon.security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 权限审计日志实体
 * 记录系统中所有权限相关的操作和访问日志
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-01-01
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "permission_audit_logs", indexes = {
    @Index(name = "idx_audit_user_id", columnList = "userId"),
    @Index(name = "idx_audit_operation_time", columnList = "operationTime"),
    @Index(name = "idx_audit_resource_type", columnList = "resourceType"),
    @Index(name = "idx_audit_audit_type", columnList = "auditType")
})
public class PermissionAuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 用户ID
     */
    @Column(nullable = false)
    private Long userId;
    
    /**
     * 用户名
     */
    @Column(length = 100)
    private String username;
    
    /**
     * 审计类型
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AuditType auditType;
    
    /**
     * 操作描述
     */
    @Column(length = 500)
    private String description;
    
    /**
     * 资源类型
     */
    @Column(length = 100)
    private String resourceType;
    
    /**
     * 资源ID
     */
    @Column(length = 100)
    private String resourceId;
    
    /**
     * 权限代码
     */
    @Column(length = 200)
    private String permissionCode;
    
    /**
     * 操作结果
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OperationResult result;
    
    /**
     * 失败原因
     */
    @Column(length = 1000)
    private String failureReason;
    
    /**
     * 请求IP地址
     */
    @Column(length = 45)
    private String ipAddress;
    
    /**
     * 用户代理
     */
    @Column(length = 500)
    private String userAgent;
    
    /**
     * 请求参数（JSON格式）
     */
    @Column(columnDefinition = "TEXT")
    private String requestParams;
    
    /**
     * 响应结果（JSON格式）
     */
    @Column(columnDefinition = "TEXT")
    private String responseResult;
    
    /**
     * 审计级别
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuditLevel auditLevel;
    
    /**
     * 操作时间
     */
    @Column(nullable = false)
    private LocalDateTime operationTime;
    
    /**
     * 会话ID
     */
    @Column(length = 100)
    private String sessionId;
    
    /**
     * 请求方法
     */
    @Column(length = 10)
    private String requestMethod;
    
    /**
     * 请求URL
     */
    @Column(length = 500)
    private String requestUrl;
    
    /**
     * 执行时长（毫秒）
     */
    private Long executionTime;
    
    /**
     * 审计类型枚举
     */
    public enum AuditType {
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
     * 操作结果枚举
     */
    public enum OperationResult {
        SUCCESS("成功"),
        FAILURE("失败"),
        DENIED("拒绝"),
        ERROR("错误");
        
        private final String description;
        
        OperationResult(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 审计级别枚举
     */
    public enum AuditLevel {
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
    
    /**
     * 创建审计日志的便捷方法
     */
    public static PermissionAuditLog createAuditLog(Long userId, String username, AuditType auditType, 
                                                   String description, OperationResult result) {
        return PermissionAuditLog.builder()
                .userId(userId)
                .username(username)
                .auditType(auditType)
                .description(description)
                .result(result)
                .auditLevel(AuditLevel.INFO)
                .operationTime(LocalDateTime.now())
                .build();
    }
    
    /**
     * 创建权限变更审计日志
     */
    public static PermissionAuditLog createPermissionChangeLog(Long userId, String username, 
                                                              String permissionCode, String description) {
        return PermissionAuditLog.builder()
                .userId(userId)
                .username(username)
                .auditType(AuditType.PERMISSION_CHANGE)
                .permissionCode(permissionCode)
                .description(description)
                .result(OperationResult.SUCCESS)
                .auditLevel(AuditLevel.INFO)
                .operationTime(LocalDateTime.now())
                .build();
    }
    
    /**
     * 创建数据访问审计日志
     */
    public static PermissionAuditLog createDataAccessLog(Long userId, String username, 
                                                        String resourceType, String resourceId, 
                                                        OperationResult result) {
        return PermissionAuditLog.builder()
                .userId(userId)
                .username(username)
                .auditType(AuditType.DATA_ACCESS)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .result(result)
                .auditLevel(AuditLevel.INFO)
                .operationTime(LocalDateTime.now())
                .build();
    }
}