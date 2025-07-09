package com.zerocarbon.security.config;

import com.zerocarbon.security.aspect.DataPermissionAspect;
import com.zerocarbon.security.aspect.FieldPermissionAspect;
import com.zerocarbon.security.aspect.PermissionAuditAspect;
import com.zerocarbon.security.service.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 安全增强配置类
 * 配置数据安全加固相关的组件和服务
 */
@Configuration
@EnableAspectJAutoProxy
@EnableAsync
@EnableScheduling
public class SecurityEnhancementConfig {
    
    /**
     * 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // 使用强度为12的BCrypt
    }
    
    /**
     * 数据加密服务
     */
    @Bean
    public DataEncryptionService dataEncryptionService() {
        return new DataEncryptionService();
    }
    
    /**
     * 数据备份服务
     */
    @Bean
    @ConditionalOnProperty(name = "app.backup.enabled", havingValue = "true", matchIfMissing = true)
    public DataBackupService dataBackupService() {
        return new DataBackupService();
    }
    
    /**
     * 权限审计服务
     */
    @Bean
    public PermissionAuditService permissionAuditService() {
        return new PermissionAuditService();
    }
    
    /**
     * 字段权限切面
     */
    @Bean
    @ConditionalOnProperty(name = "app.security.field-permission.enabled", havingValue = "true", matchIfMissing = true)
    public FieldPermissionAspect fieldPermissionAspect() {
        return new FieldPermissionAspect();
    }
    
    /**
     * 数据权限切面
     */
    @Bean
    @ConditionalOnProperty(name = "app.security.data-permission.enabled", havingValue = "true", matchIfMissing = true)
    public DataPermissionAspect dataPermissionAspect() {
        return new DataPermissionAspect();
    }
    
    /**
     * 权限审计切面
     */
    @Bean
    @ConditionalOnProperty(name = "app.security.audit.enabled", havingValue = "true", matchIfMissing = true)
    public PermissionAuditAspect permissionAuditAspect() {
        return new PermissionAuditAspect();
    }
}