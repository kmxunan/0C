package com.zerocarbon.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import java.util.Properties;

/**
 * 数据库配置类
 * 零碳园区数字孪生系统数据库配置
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.zerocarbon")
@EnableJpaAuditing
@EnableTransactionManagement
public class DatabaseConfig {
    
    /**
     * 主数据源配置
     */
    @Primary
    @Bean(name = "dataSource")
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }
    
    /**
     * JPA实体管理器工厂配置
     */
    @Primary
    @Bean(name = "entityManagerFactory")
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource());
        em.setPackagesToScan("com.zerocarbon");
        
        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);
        em.setJpaProperties(hibernateProperties());
        
        return em;
    }
    
    /**
     * 事务管理器配置
     */
    @Primary
    @Bean(name = "transactionManager")
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory);
        return transactionManager;
    }
    
    /**
     * Hibernate属性配置
     */
    private Properties hibernateProperties() {
        Properties properties = new Properties();
        
        // 数据库方言
        properties.setProperty("hibernate.dialect", "org.hibernate.dialect.MySQL8Dialect");
        
        // DDL策略 - 生产环境应设置为validate
        properties.setProperty("hibernate.hbm2ddl.auto", "update");
        
        // 显示SQL语句
        properties.setProperty("hibernate.show_sql", "true");
        
        // 格式化SQL语句
        properties.setProperty("hibernate.format_sql", "true");
        
        // 使用SQL注释
        properties.setProperty("hibernate.use_sql_comments", "true");
        
        // 物理命名策略
        properties.setProperty("hibernate.physical_naming_strategy", 
                "org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl");
        
        // 隐式命名策略
        properties.setProperty("hibernate.implicit_naming_strategy", 
                "org.hibernate.boot.model.naming.ImplicitNamingStrategyLegacyHbmImpl");
        
        // 连接池配置
        properties.setProperty("hibernate.connection.provider_class", 
                "org.hibernate.hikaricp.internal.HikariCPConnectionProvider");
        
        // HikariCP连接池配置
        properties.setProperty("hibernate.hikari.minimumIdle", "5");
        properties.setProperty("hibernate.hikari.maximumPoolSize", "20");
        properties.setProperty("hibernate.hikari.idleTimeout", "300000");
        properties.setProperty("hibernate.hikari.connectionTimeout", "30000");
        properties.setProperty("hibernate.hikari.maxLifetime", "1800000");
        properties.setProperty("hibernate.hikari.leakDetectionThreshold", "60000");
        
        // 二级缓存配置
        properties.setProperty("hibernate.cache.use_second_level_cache", "true");
        properties.setProperty("hibernate.cache.use_query_cache", "true");
        properties.setProperty("hibernate.cache.region.factory_class", 
                "org.hibernate.cache.jcache.JCacheRegionFactory");
        
        // 批处理配置
        properties.setProperty("hibernate.jdbc.batch_size", "25");
        properties.setProperty("hibernate.order_inserts", "true");
        properties.setProperty("hibernate.order_updates", "true");
        properties.setProperty("hibernate.jdbc.batch_versioned_data", "true");
        
        // 统计信息
        properties.setProperty("hibernate.generate_statistics", "false");
        
        // 时区配置
        properties.setProperty("hibernate.jdbc.time_zone", "Asia/Shanghai");
        
        // 字符集配置
        properties.setProperty("hibernate.connection.characterEncoding", "utf8mb4");
        properties.setProperty("hibernate.connection.useUnicode", "true");
        
        return properties;
    }
}