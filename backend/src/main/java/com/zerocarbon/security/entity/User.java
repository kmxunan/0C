package com.zerocarbon.security.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * 用户实体类
 * 零碳园区数字孪生系统用户管理
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 用户名（唯一）
     */
    @Column(unique = true, nullable = false, length = 50)
    private String username;
    
    /**
     * 密码（加密存储）
     */
    @Column(nullable = false)
    private String password;
    
    /**
     * 邮箱
     */
    @Column(unique = true, length = 100)
    private String email;
    
    /**
     * 手机号
     */
    @Column(length = 20)
    private String phone;
    
    /**
     * 真实姓名
     */
    @Column(length = 50)
    private String realName;
    
    /**
     * 部门
     */
    @Column(length = 100)
    private String department;
    
    /**
     * 职位
     */
    @Column(length = 50)
    private String position;
    
    /**
     * 用户状态（ACTIVE, INACTIVE, LOCKED, EXPIRED）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;
    
    /**
     * 账户是否启用
     */
    @Column(nullable = false)
    private Boolean enabled;
    
    /**
     * 账户是否未过期
     */
    @Column(nullable = false)
    private Boolean accountNonExpired;
    
    /**
     * 账户是否未锁定
     */
    @Column(nullable = false)
    private Boolean accountNonLocked;
    
    /**
     * 凭证是否未过期
     */
    @Column(nullable = false)
    private Boolean credentialsNonExpired;
    
    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginTime;
    
    /**
     * 最后登录IP
     */
    @Column(length = 50)
    private String lastLoginIp;
    
    /**
     * 登录失败次数
     */
    @Column(nullable = false)
    private Integer loginFailureCount;
    
    /**
     * 账户锁定时间
     */
    private LocalDateTime lockedTime;
    
    /**
     * 密码最后修改时间
     */
    private LocalDateTime passwordLastModified;
    
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
     * 用户角色关联
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;
    
    /**
     * 用户状态枚举
     */
    public enum UserStatus {
        ACTIVE("激活"),
        INACTIVE("未激活"),
        LOCKED("锁定"),
        EXPIRED("过期");
        
        private final String description;
        
        UserStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 检查用户是否有效
     */
    public boolean isValid() {
        return enabled && accountNonExpired && accountNonLocked && credentialsNonExpired;
    }
    
    /**
     * 检查是否需要修改密码
     */
    public boolean needsPasswordChange() {
        if (passwordLastModified == null) {
            return true;
        }
        // 密码90天过期
        return passwordLastModified.isBefore(LocalDateTime.now().minusDays(90));
    }
    
    /**
     * 检查账户是否被锁定
     */
    public boolean isAccountLocked() {
        if (lockedTime == null) {
            return false;
        }
        // 锁定30分钟后自动解锁
        return lockedTime.isAfter(LocalDateTime.now().minusMinutes(30));
    }
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        updatedTime = LocalDateTime.now();
        if (enabled == null) {
            enabled = true;
        }
        if (accountNonExpired == null) {
            accountNonExpired = true;
        }
        if (accountNonLocked == null) {
            accountNonLocked = true;
        }
        if (credentialsNonExpired == null) {
            credentialsNonExpired = true;
        }
        if (loginFailureCount == null) {
            loginFailureCount = 0;
        }
        if (status == null) {
            status = UserStatus.ACTIVE;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedTime = LocalDateTime.now();
    }
}