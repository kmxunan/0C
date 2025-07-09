package com.zerocarbon.security.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * 角色实体类
 * 零碳园区数字孪生系统角色管理
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "roles")
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 角色代码（唯一）
     */
    @Column(unique = true, nullable = false, length = 50)
    private String code;
    
    /**
     * 角色名称
     */
    @Column(nullable = false, length = 100)
    private String name;
    
    /**
     * 角色描述
     */
    @Column(length = 500)
    private String description;
    
    /**
     * 角色类型（SYSTEM, BUSINESS, CUSTOM）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType type;
    
    /**
     * 角色级别（数值越大权限越高）
     */
    @Column(nullable = false)
    private Integer level;
    
    /**
     * 是否启用
     */
    @Column(nullable = false)
    private Boolean enabled;
    
    /**
     * 是否为默认角色
     */
    @Column(nullable = false)
    private Boolean isDefault;
    
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
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions;
    
    /**
     * 用户角色关联
     */
    @ManyToMany(mappedBy = "roles", fetch = FetchType.LAZY)
    private Set<User> users;
    
    /**
     * 角色类型枚举
     */
    public enum RoleType {
        SYSTEM("系统角色"),
        BUSINESS("业务角色"),
        CUSTOM("自定义角色");
        
        private final String description;
        
        RoleType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 预定义系统角色
     */
    public static class SystemRoles {
        public static final String SUPER_ADMIN = "SUPER_ADMIN";
        public static final String ADMIN = "ADMIN";
        public static final String OPERATOR = "OPERATOR";
        public static final String USER = "USER";
        public static final String GUEST = "GUEST";
        
        // 业务角色
        public static final String ENERGY_MANAGER = "ENERGY_MANAGER";
        public static final String CARBON_ANALYST = "CARBON_ANALYST";
        public static final String DEVICE_MANAGER = "DEVICE_MANAGER";
        public static final String DATA_ANALYST = "DATA_ANALYST";
        public static final String REPORT_VIEWER = "REPORT_VIEWER";
    }
    
    /**
     * 角色级别定义
     */
    public static class RoleLevels {
        public static final int SUPER_ADMIN_LEVEL = 100;
        public static final int ADMIN_LEVEL = 90;
        public static final int OPERATOR_LEVEL = 70;
        public static final int USER_LEVEL = 50;
        public static final int GUEST_LEVEL = 10;
    }
    
    /**
     * 检查角色是否有效
     */
    public boolean isValid() {
        return enabled != null && enabled;
    }
    
    /**
     * 检查是否为系统角色
     */
    public boolean isSystemRole() {
        return type == RoleType.SYSTEM;
    }
    
    /**
     * 检查角色级别是否高于指定级别
     */
    public boolean hasHigherLevelThan(Integer targetLevel) {
        return level != null && targetLevel != null && level > targetLevel;
    }
    
    /**
     * 检查角色级别是否高于或等于指定级别
     */
    public boolean hasLevelOrHigher(Integer targetLevel) {
        return level != null && targetLevel != null && level >= targetLevel;
    }
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        updatedTime = LocalDateTime.now();
        if (enabled == null) {
            enabled = true;
        }
        if (isDefault == null) {
            isDefault = false;
        }
        if (type == null) {
            type = RoleType.CUSTOM;
        }
        if (level == null) {
            level = RoleLevels.USER_LEVEL;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedTime = LocalDateTime.now();
    }
}