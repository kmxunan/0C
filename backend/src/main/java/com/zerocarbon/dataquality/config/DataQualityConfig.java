package com.zerocarbon.dataquality.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据质量监控配置类
 * 用于零碳园区数字孪生系统中数据质量监控的参数配置
 * 
 * @author Zero Carbon System
 * @version 1.0
 * @since 2025
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "data-quality")
public class DataQualityConfig {
    
    /**
     * 数据完整性阈值 (0.0-1.0)
     */
    private double completenessThreshold = 0.95;
    
    /**
     * 数据准确性阈值 (0.0-1.0)
     */
    private double accuracyThreshold = 0.90;
    
    /**
     * 数据一致性阈值 (0.0-1.0)
     */
    private double consistencyThreshold = 0.85;
    
    /**
     * 数据及时性阈值 (0.0-1.0)
     */
    private double timelinessThreshold = 0.80;
    
    /**
     * 数据有效性阈值 (0.0-1.0)
     */
    private double validityThreshold = 0.90;
    
    /**
     * 数据唯一性阈值 (0.0-1.0)
     */
    private double uniquenessThreshold = 0.95;
    
    /**
     * 综合质量评分阈值 (0.0-1.0)
     */
    private double overallQualityThreshold = 0.85;
    
    /**
     * 质量等级配置
     */
    private QualityGradeConfig gradeConfig = new QualityGradeConfig();
    
    /**
     * 监控配置
     */
    private MonitoringConfig monitoring = new MonitoringConfig();
    
    /**
     * 告警配置
     */
    private AlertConfig alert = new AlertConfig();
    
    /**
     * 数据源配置
     */
    private Map<String, DataSourceConfig> dataSources = new HashMap<>();
    
    /**
     * 质量等级配置
     */
    @Data
    public static class QualityGradeConfig {
        /**
         * 优秀等级阈值
         */
        private double excellentThreshold = 0.95;
        
        /**
         * 良好等级阈值
         */
        private double goodThreshold = 0.85;
        
        /**
         * 一般等级阈值
         */
        private double fairThreshold = 0.70;
        
        /**
         * 较差等级阈值
         */
        private double poorThreshold = 0.50;
        
        /**
         * 获取质量等级
         */
        public String getQualityGrade(double score) {
            if (score >= excellentThreshold) {
                return "EXCELLENT";
            } else if (score >= goodThreshold) {
                return "GOOD";
            } else if (score >= fairThreshold) {
                return "FAIR";
            } else if (score >= poorThreshold) {
                return "POOR";
            } else {
                return "CRITICAL";
            }
        }
        
        /**
         * 获取质量等级描述
         */
        public String getQualityGradeDescription(String grade) {
            switch (grade) {
                case "EXCELLENT":
                    return "优秀";
                case "GOOD":
                    return "良好";
                case "FAIR":
                    return "一般";
                case "POOR":
                    return "较差";
                case "CRITICAL":
                    return "严重";
                default:
                    return "未知";
            }
        }
    }
    
    /**
     * 监控配置
     */
    @Data
    public static class MonitoringConfig {
        /**
         * 是否启用定时监控
         */
        private boolean enabled = true;
        
        /**
         * 默认监控间隔（分钟）
         */
        private int defaultIntervalMinutes = 60;
        
        /**
         * 最小监控间隔（分钟）
         */
        private int minIntervalMinutes = 5;
        
        /**
         * 最大监控间隔（分钟）
         */
        private int maxIntervalMinutes = 1440; // 24小时
        
        /**
         * 批量监控大小
         */
        private int batchSize = 10;
        
        /**
         * 监控超时时间（秒）
         */
        private int timeoutSeconds = 300;
        
        /**
         * 是否启用并行监控
         */
        private boolean parallelEnabled = true;
        
        /**
         * 并行线程数
         */
        private int parallelThreads = 4;
        
        /**
         * 历史数据保留天数
         */
        private int historyRetentionDays = 90;
    }
    
    /**
     * 告警配置
     */
    @Data
    public static class AlertConfig {
        /**
         * 是否启用告警
         */
        private boolean enabled = true;
        
        /**
         * 告警阈值
         */
        private double alertThreshold = 0.80;
        
        /**
         * 严重告警阈值
         */
        private double criticalThreshold = 0.60;
        
        /**
         * 告警通知方式
         */
        private List<String> notificationMethods = List.of("EMAIL", "SMS");
        
        /**
         * 告警接收人
         */
        private List<String> recipients = List.of();
        
        /**
         * 告警抑制时间（分钟）
         */
        private int suppressionMinutes = 30;
        
        /**
         * 最大告警次数
         */
        private int maxAlertCount = 5;
        
        /**
         * 告警重试间隔（分钟）
         */
        private int retryIntervalMinutes = 10;
    }
    
    /**
     * 数据源配置
     */
    @Data
    public static class DataSourceConfig {
        /**
         * 数据源名称
         */
        private String name;
        
        /**
         * 数据源类型
         */
        private String type;
        
        /**
         * 是否启用监控
         */
        private boolean monitoringEnabled = true;
        
        /**
         * 监控间隔（分钟）
         */
        private int intervalMinutes = 60;
        
        /**
         * 监控的表列表
         */
        private List<String> monitoredTables = List.of();
        
        /**
         * 排除的表列表
         */
        private List<String> excludedTables = List.of();
        
        /**
         * 自定义阈值
         */
        private Map<String, Double> customThresholds = new HashMap<>();
        
        /**
         * 业务规则配置
         */
        private Map<String, Object> businessRules = new HashMap<>();
    }
    
    /**
     * 权重配置
     */
    @Data
    public static class WeightConfig {
        /**
         * 完整性权重
         */
        private double completenessWeight = 0.25;
        
        /**
         * 准确性权重
         */
        private double accuracyWeight = 0.25;
        
        /**
         * 一致性权重
         */
        private double consistencyWeight = 0.20;
        
        /**
         * 及时性权重
         */
        private double timelinessWeight = 0.10;
        
        /**
         * 有效性权重
         */
        private double validityWeight = 0.15;
        
        /**
         * 唯一性权重
         */
        private double uniquenessWeight = 0.05;
        
        /**
         * 验证权重总和是否为1.0
         */
        public boolean isValidWeights() {
            double total = completenessWeight + accuracyWeight + consistencyWeight + 
                          timelinessWeight + validityWeight + uniquenessWeight;
            return Math.abs(total - 1.0) < 0.001;
        }
    }
    
    /**
     * 权重配置
     */
    private WeightConfig weights = new WeightConfig();
    
    /**
     * 获取数据源配置
     */
    public DataSourceConfig getDataSourceConfig(String dataSource) {
        return dataSources.getOrDefault(dataSource, new DataSourceConfig());
    }
    
    /**
     * 获取自定义阈值
     */
    public double getCustomThreshold(String dataSource, String metric, double defaultValue) {
        DataSourceConfig config = getDataSourceConfig(dataSource);
        return config.getCustomThresholds().getOrDefault(metric, defaultValue);
    }
    
    /**
     * 是否需要告警
     */
    public boolean shouldAlert(double score) {
        return alert.isEnabled() && score < alert.getAlertThreshold();
    }
    
    /**
     * 是否为严重告警
     */
    public boolean isCriticalAlert(double score) {
        return alert.isEnabled() && score < alert.getCriticalThreshold();
    }
    
    /**
     * 计算综合质量评分
     */
    public double calculateOverallScore(double completeness, double accuracy, double consistency,
                                       double timeliness, double validity, double uniqueness) {
        if (!weights.isValidWeights()) {
            throw new IllegalStateException("权重配置无效，总和必须为1.0");
        }
        
        return completeness * weights.getCompletenessWeight() +
               accuracy * weights.getAccuracyWeight() +
               consistency * weights.getConsistencyWeight() +
               timeliness * weights.getTimelinessWeight() +
               validity * weights.getValidityWeight() +
               uniqueness * weights.getUniquenessWeight();
    }
    
    /**
     * 获取质量等级
     */
    public String getQualityGrade(double score) {
        return gradeConfig.getQualityGrade(score);
    }
    
    /**
     * 获取质量等级描述
     */
    public String getQualityGradeDescription(double score) {
        String grade = getQualityGrade(score);
        return gradeConfig.getQualityGradeDescription(grade);
    }
    
    /**
     * 验证配置有效性
     */
    public boolean isValidConfig() {
        return completenessThreshold >= 0 && completenessThreshold <= 1 &&
               accuracyThreshold >= 0 && accuracyThreshold <= 1 &&
               consistencyThreshold >= 0 && consistencyThreshold <= 1 &&
               timelinessThreshold >= 0 && timelinessThreshold <= 1 &&
               validityThreshold >= 0 && validityThreshold <= 1 &&
               uniquenessThreshold >= 0 && uniquenessThreshold <= 1 &&
               overallQualityThreshold >= 0 && overallQualityThreshold <= 1 &&
               weights.isValidWeights();
    }
}