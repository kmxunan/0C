package com.zerocarbon.security.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 数据权限实体类
 * 零碳园区数字孪生系统字段级权限控制
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "data_permissions")
public class DataPermission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 角色ID
     */
    @Column(nullable = false)
    private Long roleId;
    
    /**
     * 数据库表名
     */
    @Column(nullable = false, length = 100)
    private String tableName;
    
    /**
     * 字段名
     */
    @Column(nullable = false, length = 100)
    private String fieldName;
    
    /**
     * 权限类型（READ, WRITE, MASK, DENY）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DataPermissionType permissionType;
    
    /**
     * 数据过滤条件（SQL WHERE子句）
     */
    @Column(length = 1000)
    private String filterCondition;
    
    /**
     * 脱敏规则
     */
    @Column(length = 500)
    private String maskingRule;
    
    /**
     * 权限范围（ALL, DEPARTMENT, SELF）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DataScope scope;
    
    /**
     * 是否启用
     */
    @Column(nullable = false)
    private Boolean enabled;
    
    /**
     * 优先级（数值越大优先级越高）
     */
    @Column(nullable = false)
    private Integer priority;
    
    /**
     * 生效开始时间
     */
    private LocalDateTime effectiveStartTime;
    
    /**
     * 生效结束时间
     */
    private LocalDateTime effectiveEndTime;
    
    /**
     * 创建时间
     */
    @Column(nullable = false)
    private LocalDateTime createdTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedTime;
    
    /**
     * 创建者
     */
    @Column(length = 50)
    private String createdBy;
    
    /**
     * 更新者
     */
    @Column(length = 50)
    private String updatedBy;
    
    /**
     * 数据权限类型枚举
     */
    public enum DataPermissionType {
        READ("只读"),
        WRITE("读写"),
        MASK("脱敏"),
        DENY("拒绝");
        
        private final String description;
        
        DataPermissionType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 数据范围枚举
     */
    public enum DataScope {
        ALL("全部数据"),
        DEPARTMENT("部门数据"),
        SELF("个人数据"),
        CUSTOM("自定义数据");
        
        private final String description;
        
        DataScope(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 预定义脱敏规则
     */
    public static class MaskingRules {
        public static final String PHONE_MASK = "phone_mask"; // 手机号脱敏
        public static final String EMAIL_MASK = "email_mask"; // 邮箱脱敏
        public static final String ID_CARD_MASK = "id_card_mask"; // 身份证脱敏
        public static final String NAME_MASK = "name_mask"; // 姓名脱敏
        public static final String ADDRESS_MASK = "address_mask"; // 地址脱敏
        public static final String AMOUNT_MASK = "amount_mask"; // 金额脱敏
        public static final String PARTIAL_MASK = "partial_mask"; // 部分脱敏
        public static final String FULL_MASK = "full_mask"; // 完全脱敏
    }
    
    /**
     * 预定义敏感字段
     */
    public static class SensitiveFields {
        // 用户敏感字段
        public static final String USER_PASSWORD = "password";
        public static final String USER_PHONE = "phone";
        public static final String USER_EMAIL = "email";
        public static final String USER_ID_CARD = "id_card";
        
        // 设备敏感字段
        public static final String DEVICE_SECRET_KEY = "secret_key";
        public static final String DEVICE_ACCESS_TOKEN = "access_token";
        
        // 能源数据敏感字段
        public static final String ENERGY_COST = "cost";
        public static final String ENERGY_PRICE = "price";
        
        // 企业敏感字段
        public static final String COMPANY_TAX_NUMBER = "tax_number";
        public static final String COMPANY_BANK_ACCOUNT = "bank_account";
    }
    
    /**
     * 检查权限是否有效
     */
    public boolean isValid() {
        if (!enabled) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // 检查生效时间
        if (effectiveStartTime != null && now.isBefore(effectiveStartTime)) {
            return false;
        }
        
        if (effectiveEndTime != null && now.isAfter(effectiveEndTime)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 检查是否需要脱敏
     */
    public boolean needsMasking() {
        return permissionType == DataPermissionType.MASK && maskingRule != null;
    }
    
    /**
     * 检查是否拒绝访问
     */
    public boolean isDenied() {
        return permissionType == DataPermissionType.DENY;
    }
    
    /**
     * 检查是否只读
     */
    public boolean isReadOnly() {
        return permissionType == DataPermissionType.read;
    }
    
    /**
     * 检查是否可写
     */
    public boolean isWritable() {
        return permissionType == DataPermissionType.WRITE;
    }
    
    /**
     * 生成字段权限键
     */
    public String getPermissionKey() {
        return tableName + "." + fieldName;
    }
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        updatedTime = LocalDateTime.now();
        if (enabled == null) {
            enabled = true;
        }
        if (priority == null) {
            priority = 0;
        }
        if (scope == null) {
            scope = DataScope.SELF;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedTime = LocalDateTime.now();
    }
}