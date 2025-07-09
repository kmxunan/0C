package com.zerocarbon.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.Duration;
import java.util.Arrays;

/**
 * 缓存配置类
 * 配置应用程序的缓存策略
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2024
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Value("${spring.cache.caffeine.spec:maximumSize=1000,expireAfterWrite=30m}")
    private String cacheSpec;
    
    /**
     * 配置Caffeine缓存管理器
     */
    @Bean
    @Primary
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // 设置缓存名称
        cacheManager.setCacheNames(Arrays.asList(
                "users",           // 用户缓存
                "roles",           // 角色缓存
                "permissions",     // 权限缓存
                "dataPermissions", // 数据权限缓存
                "userRoles",       // 用户角色关系缓存
                "rolePermissions", // 角色权限关系缓存
                "userPermissions", // 用户权限缓存
                "loginAttempts",   // 登录尝试缓存
                "sessions",        // 会话缓存
                "tokens",          // 令牌缓存
                "systemConfig",    // 系统配置缓存
                "statistics"       // 统计信息缓存
        ));
        
        // 设置缓存配置
        cacheManager.setCaffeine(defaultCaffeineBuilder());
        
        // 允许空值缓存
        cacheManager.setAllowNullValues(false);
        
        return cacheManager;
    }
    
    /**
     * 默认Caffeine构建器
     */
    private Caffeine<Object, Object> defaultCaffeineBuilder() {
        return Caffeine.newBuilder()
                .maximumSize(1000)                    // 最大缓存条目数
                .expireAfterWrite(Duration.ofMinutes(30))  // 写入后30分钟过期
                .expireAfterAccess(Duration.ofMinutes(15)) // 访问后15分钟过期
                .recordStats();                       // 启用统计
    }
    
    /**
     * 用户缓存管理器
     */
    @Bean("userCacheManager")
    public CacheManager userCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("users", "userRoles", "userPermissions");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(Duration.ofMinutes(60))  // 用户信息缓存1小时
                .expireAfterAccess(Duration.ofMinutes(30))
                .recordStats());
        return cacheManager;
    }
    
    /**
     * 权限缓存管理器
     */
    @Bean("permissionCacheManager")
    public CacheManager permissionCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("permissions", "rolePermissions", "dataPermissions");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(2000)
                .expireAfterWrite(Duration.ofHours(2))     // 权限信息缓存2小时
                .expireAfterAccess(Duration.ofMinutes(60))
                .recordStats());
        return cacheManager;
    }
    
    /**
     * 会话缓存管理器
     */
    @Bean("sessionCacheManager")
    public CacheManager sessionCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("sessions", "tokens", "loginAttempts");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(10000)
                .expireAfterWrite(Duration.ofMinutes(120)) // 会话缓存2小时
                .expireAfterAccess(Duration.ofMinutes(30))
                .recordStats());
        return cacheManager;
    }
    
    /**
     * 系统配置缓存管理器
     */
    @Bean("systemCacheManager")
    public CacheManager systemCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("systemConfig", "statistics");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(100)
                .expireAfterWrite(Duration.ofHours(6))     // 系统配置缓存6小时
                .expireAfterAccess(Duration.ofHours(1))
                .recordStats());
        return cacheManager;
    }
}