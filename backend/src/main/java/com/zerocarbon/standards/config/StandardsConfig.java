package com.zerocarbon.standards.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.List;
import java.util.Map;

/**
 * 标准管理配置类
 */
@Data
@Configuration
@EnableScheduling
@ConfigurationProperties(prefix = "zerocarbon.standards")
public class StandardsConfig {

    /**
     * 标准更新检查配置
     */
    private UpdateCheck updateCheck = new UpdateCheck();

    /**
     * 通知配置
     */
    private Notification notification = new Notification();

    /**
     * 外部数据源配置
     */
    private ExternalSources externalSources = new ExternalSources();

    /**
     * 验证配置
     */
    private Validation validation = new Validation();

    @Data
    public static class UpdateCheck {
        /**
         * 是否启用自动更新检查
         */
        private boolean enabled = true;

        /**
         * 检查间隔（小时）
         */
        private int intervalHours = 24;

        /**
         * 重试次数
         */
        private int retryCount = 3;

        /**
         * 重试间隔（分钟）
         */
        private int retryIntervalMinutes = 30;

        /**
         * 超时时间（秒）
         */
        private int timeoutSeconds = 60;
    }

    @Data
    public static class Notification {
        /**
         * 是否启用邮件通知
         */
        private boolean emailEnabled = true;

        /**
         * 是否启用系统通知
         */
        private boolean systemEnabled = true;

        /**
         * 通知接收者邮箱列表
         */
        private List<String> recipients;

        /**
         * 邮件模板配置
         */
        private Map<String, String> emailTemplates;
    }

    @Data
    public static class ExternalSources {
        /**
         * 国家标准数据源
         */
        private DataSource national = new DataSource();

        /**
         * 行业标准数据源
         */
        private DataSource industry = new DataSource();

        /**
         * 国际标准数据源
         */
        private DataSource international = new DataSource();

        @Data
        public static class DataSource {
            /**
             * 数据源URL
             */
            private String url;

            /**
             * API密钥
             */
            private String apiKey;

            /**
             * 用户名
             */
            private String username;

            /**
             * 密码
             */
            private String password;

            /**
             * 连接超时（秒）
             */
            private int connectTimeoutSeconds = 30;

            /**
             * 读取超时（秒）
             */
            private int readTimeoutSeconds = 60;

            /**
             * 是否启用
             */
            private boolean enabled = true;
        }
    }

    @Data
    public static class Validation {
        /**
         * 是否启用严格验证模式
         */
        private boolean strictMode = false;

        /**
         * 验证超时时间（秒）
         */
        private int timeoutSeconds = 30;

        /**
         * 最大验证项数量
         */
        private int maxValidationItems = 1000;

        /**
         * 验证结果缓存时间（分钟）
         */
        private int cacheMinutes = 60;

        /**
         * 自定义验证规则
         */
        private Map<String, Object> customRules;
    }

    /**
     * 获取国家标准更新URL
     */
    public String getNationalStandardsUrl() {
        return externalSources.getNational().getUrl();
    }

    /**
     * 获取行业标准更新URL
     */
    public String getIndustryStandardsUrl() {
        return externalSources.getIndustry().getUrl();
    }

    /**
     * 获取国际标准更新URL
     */
    public String getInternationalStandardsUrl() {
        return externalSources.getInternational().getUrl();
    }

    /**
     * 检查是否启用更新检查
     */
    public boolean isUpdateCheckEnabled() {
        return updateCheck.isEnabled();
    }

    /**
     * 检查是否启用邮件通知
     */
    public boolean isEmailNotificationEnabled() {
        return notification.isEmailEnabled();
    }

    /**
     * 检查是否启用系统通知
     */
    public boolean isSystemNotificationEnabled() {
        return notification.isSystemEnabled();
    }

    /**
     * 获取更新检查间隔（毫秒）
     */
    public long getUpdateCheckIntervalMs() {
        return updateCheck.getIntervalHours() * 60L * 60L * 1000L;
    }

    /**
     * 获取重试间隔（毫秒）
     */
    public long getRetryIntervalMs() {
        return updateCheck.getRetryIntervalMinutes() * 60L * 1000L;
    }
}