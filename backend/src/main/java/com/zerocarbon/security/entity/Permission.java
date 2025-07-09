package com.zerocarbon.security.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * 权限实体类
 * 零碳园区数字孪生系统细粒度权限管理
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "permissions")
public class Permission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 权限代码（唯一）
     */
    @Column(unique = true, nullable = false, length = 100)
    private String code;
    
    /**
     * 权限名称
     */
    @Column(nullable = false, length = 100)
    private String name;
    
    /**
     * 权限描述
     */
    @Column(length = 500)
    private String description;
    
    /**
     * 权限类型（MODULE, OPERATION, DATA, FIELD）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PermissionType type;
    
    /**
     * 权限分组
     */
    @Column(length = 50)
    private String group;
    
    /**
     * 资源标识
     */
    @Column(length = 100)
    private String resource;
    
    /**
     * 操作标识
     */
    @Column(length = 50)
    private String action;
    
    /**
     * 权限级别（数值越大权限越高）
     */
    @Column(nullable = false)
    private Integer level;
    
    /**
     * 是否启用
     */
    @Column(nullable = false)
    private Boolean enabled;
    
    /**
     * 是否为系统权限
     */
    @Column(nullable = false)
    private Boolean isSystem;
    
    /**
     * 父权限ID
     */
    @Column(name = "parent_id")
    private Long parentId;
    
    /**
     * 权限路径（用于层级权限）
     */
    @Column(length = 500)
    private String path;
    
    /**
     * 排序序号
     */
    @Column(nullable = false)
    private Integer sortOrder;
    
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
     * 角色权限关联
     */
    @ManyToMany(mappedBy = "permissions", fetch = FetchType.LAZY)
    private Set<Role> roles;
    
    /**
     * 权限类型枚举
     */
    public enum PermissionType {
        MODULE("模块权限"),
        OPERATION("操作权限"),
        DATA("数据权限"),
        FIELD("字段权限");
        
        private final String description;
        
        PermissionType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 预定义系统权限
     */
    public static class SystemPermissions {
        // 用户管理权限
        public static final String USER_CREATE = "user:create";
        public static final String USER_READ = "user:read";
        public static final String USER_UPDATE = "user:update";
        public static final String USER_DELETE = "user:delete";
        public static final String USER_RESET_PASSWORD = "user:reset_password";
        public static final String USER_LOCK = "user:lock";
        public static final String USER_UNLOCK = "user:unlock";
        
        // 角色管理权限
        public static final String ROLE_CREATE = "role:create";
        public static final String ROLE_READ = "role:read";
        public static final String ROLE_UPDATE = "role:update";
        public static final String ROLE_DELETE = "role:delete";
        public static final String ROLE_ASSIGN = "role:assign";
        
        // 权限管理权限
        public static final String PERMISSION_CREATE = "permission:create";
        public static final String PERMISSION_READ = "permission:read";
        public static final String PERMISSION_UPDATE = "permission:update";
        public static final String PERMISSION_DELETE = "permission:delete";
        public static final String PERMISSION_ASSIGN = "permission:assign";
        
        // 设备管理权限
        public static final String DEVICE_CREATE = "device:create";
        public static final String DEVICE_READ = "device:read";
        public static final String DEVICE_UPDATE = "device:update";
        public static final String DEVICE_DELETE = "device:delete";
        public static final String DEVICE_CONTROL = "device:control";
        public static final String DEVICE_MONITOR = "device:monitor";
        
        // 能源数据权限
        public static final String ENERGY_CREATE = "energy:create";
        public static final String ENERGY_READ = "energy:read";
        public static final String ENERGY_UPDATE = "energy:update";
        public static final String ENERGY_DELETE = "energy:delete";
        public static final String ENERGY_EXPORT = "energy:export";
        public static final String ENERGY_ANALYZE = "energy:analyze";
        
        // 碳排放权限
        public static final String CARBON_CREATE = "carbon:create";
        public static final String CARBON_READ = "carbon:read";
        public static final String CARBON_UPDATE = "carbon:update";
        public static final String CARBON_DELETE = "carbon:delete";
        public static final String CARBON_CALCULATE = "carbon:calculate";
        public static final String CARBON_REPORT = "carbon:report";
        
        // 数据质量权限
        public static final String DATA_QUALITY_READ = "data_quality:read";
        public static final String DATA_QUALITY_MONITOR = "data_quality:monitor";
        public static final String DATA_QUALITY_CONFIG = "data_quality:config";
        public static final String DATA_QUALITY_REPAIR = "data_quality:repair";
        
        // 系统管理权限
        public static final String SYSTEM_CONFIG = "system:config";
        public static final String SYSTEM_BACKUP = "system:backup";
        public static final String SYSTEM_RESTORE = "system:restore";
        public static final String SYSTEM_LOG = "system:log";
        public static final String SYSTEM_MONITOR = "system:monitor";
        
        // 报告权限
        public static final String REPORT_CREATE = "report:create";
        public static final String REPORT_READ = "report:read";
        public static final String REPORT_UPDATE = "report:update";
        public static final String REPORT_DELETE = "report:delete";
        public static final String REPORT_EXPORT = "report:export";
        public static final String REPORT_SCHEDULE = "report:schedule";
    }
    
    /**
     * 权限级别定义
     */
    public static class PermissionLevels {
        public static final int SYSTEM_LEVEL = 100;
        public static final int ADMIN_LEVEL = 90;
        public static final int MANAGER_LEVEL = 70;
        public static final int OPERATOR_LEVEL = 50;
        public static final int USER_LEVEL = 30;
        public static final int GUEST_LEVEL = 10;
    }
    
    /**
     * 检查权限是否有效
     */
    public boolean isValid() {
        return enabled != null && enabled;
    }
    
    /**
     * 检查是否为系统权限
     */
    public boolean isSystemPermission() {
        return isSystem != null && isSystem;
    }
    
    /**
     * 检查权限级别是否高于指定级别
     */
    public boolean hasHigherLevelThan(Integer targetLevel) {
        return level != null && targetLevel != null && level > targetLevel;
    }
    
    /**
     * 生成权限代码
     */
    public static String generateCode(String resource, String action) {
        return resource + ":" + action;
    }
    
    /**
     * 解析权限代码
     */
    public static String[] parseCode(String code) {
        if (code == null || !code.contains(":")) {
            return new String[]{code, ""};
        }
        return code.split(":", 2);
    }
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        updatedTime = LocalDateTime.now();
        if (enabled == null) {
            enabled = true;
        }
        if (isSystem == null) {
            isSystem = false;
        }
        if (level == null) {
            level = PermissionLevels.USER_LEVEL;
        }
        if (sortOrder == null) {
            sortOrder = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedTime = LocalDateTime.now();
    }
}