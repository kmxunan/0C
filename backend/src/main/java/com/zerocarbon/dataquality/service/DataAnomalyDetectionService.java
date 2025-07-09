package com.zerocarbon.dataquality.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 数据异常检测服务
 * 负责检测数据中的异常值、模式异常、趋势异常等
 */
@Slf4j
@Service
public class DataAnomalyDetectionService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 异常检测配置
    private static final Map<String, AnomalyDetectionConfig> DETECTION_CONFIGS = new HashMap<>();
    
    static {
        initializeDetectionConfigs();
    }

    /**
     * 异常检测配置
     */
    public static class AnomalyDetectionConfig {
        private String tableName;
        private List<String> numericFields;
        private List<String> categoricalFields;
        private List<String> timeFields;
        private double outlierThreshold; // 异常值阈值（标准差倍数）
        private double trendThreshold; // 趋势异常阈值
        private int windowSize; // 滑动窗口大小
        private boolean enableSeasonalDetection; // 是否启用季节性检测
        
        public AnomalyDetectionConfig(String tableName, List<String> numericFields, 
                                    List<String> categoricalFields, List<String> timeFields,
                                    double outlierThreshold, double trendThreshold, 
                                    int windowSize, boolean enableSeasonalDetection) {
            this.tableName = tableName;
            this.numericFields = numericFields;
            this.categoricalFields = categoricalFields;
            this.timeFields = timeFields;
            this.outlierThreshold = outlierThreshold;
            this.trendThreshold = trendThreshold;
            this.windowSize = windowSize;
            this.enableSeasonalDetection = enableSeasonalDetection;
        }
        
        // Getters
        public String getTableName() { return tableName; }
        public List<String> getNumericFields() { return numericFields; }
        public List<String> getCategoricalFields() { return categoricalFields; }
        public List<String> getTimeFields() { return timeFields; }
        public double getOutlierThreshold() { return outlierThreshold; }
        public double getTrendThreshold() { return trendThreshold; }
        public int getWindowSize() { return windowSize; }
        public boolean isEnableSeasonalDetection() { return enableSeasonalDetection; }
    }

    /**
     * 异常检测结果
     */
    public static class AnomalyResult {
        private String anomalyType; // outlier, trend, pattern, seasonal
        private String fieldName;
        private Object anomalyValue;
        private Object expectedValue;
        private double anomalyScore; // 异常评分 (0.0-1.0)
        private double confidence; // 置信度 (0.0-1.0)
        private String description;
        private Map<String, Object> metadata;
        
        public AnomalyResult(String anomalyType, String fieldName, Object anomalyValue, 
                           Object expectedValue, double anomalyScore, double confidence, 
                           String description) {
            this.anomalyType = anomalyType;
            this.fieldName = fieldName;
            this.anomalyValue = anomalyValue;
            this.expectedValue = expectedValue;
            this.anomalyScore = anomalyScore;
            this.confidence = confidence;
            this.description = description;
            this.metadata = new HashMap<>();
        }
        
        // Getters and Setters
        public String getAnomalyType() { return anomalyType; }
        public String getFieldName() { return fieldName; }
        public Object getAnomalyValue() { return anomalyValue; }
        public Object getExpectedValue() { return expectedValue; }
        public double getAnomalyScore() { return anomalyScore; }
        public double getConfidence() { return confidence; }
        public String getDescription() { return description; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    /**
     * 初始化异常检测配置
     */
    private static void initializeDetectionConfigs() {
        // 能源消耗数据异常检测配置
        DETECTION_CONFIGS.put("energy_consumption", new AnomalyDetectionConfig(
            "energy_consumption",
            Arrays.asList("energy_value", "power_consumption", "efficiency_ratio"),
            Arrays.asList("device_type", "energy_type"),
            Arrays.asList("timestamp", "record_time"),
            3.0, 0.5, 24, true
        ));
        
        // 碳排放数据异常检测配置
        DETECTION_CONFIGS.put("carbon_emission", new AnomalyDetectionConfig(
            "carbon_emission",
            Arrays.asList("emission_value", "emission_factor", "calculated_emission"),
            Arrays.asList("emission_type", "emission_source"),
            Arrays.asList("timestamp", "measurement_time"),
            2.5, 0.4, 24, true
        ));
        
        // 设备数据异常检测配置
        DETECTION_CONFIGS.put("device_data", new AnomalyDetectionConfig(
            "device_data",
            Arrays.asList("temperature", "pressure", "vibration", "power_consumption"),
            Arrays.asList("status", "device_type", "location"),
            Arrays.asList("timestamp", "last_maintenance"),
            2.0, 0.3, 48, false
        ));
        
        // 企业数据异常检测配置
        DETECTION_CONFIGS.put("enterprise_data", new AnomalyDetectionConfig(
            "enterprise_data",
            Arrays.asList("annual_energy_consumption", "carbon_footprint", "efficiency_score"),
            Arrays.asList("industry_type", "size_category", "status"),
            Arrays.asList("registration_time", "last_update_time"),
            2.0, 0.6, 12, false
        ));
    }

    /**
     * 检测数据异常
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @return 异常检测结果列表
     */
    public List<AnomalyResult> detectAnomalies(String dataSource, String tableName) {
        log.info("开始检测数据异常: dataSource={}, tableName={}", dataSource, tableName);
        
        List<AnomalyResult> allAnomalies = new ArrayList<>();
        
        try {
            // 1. 获取异常检测配置
            AnomalyDetectionConfig config = getDetectionConfig(tableName);
            if (config == null) {
                log.info("表 {} 没有配置异常检测规则，使用默认检测", tableName);
                return performDefaultAnomalyDetection(dataSource, tableName);
            }
            
            // 2. 检测数值字段异常
            for (String field : config.getNumericFields()) {
                List<AnomalyResult> fieldAnomalies = detectNumericAnomalies(dataSource, tableName, field, config);
                allAnomalies.addAll(fieldAnomalies);
            }
            
            // 3. 检测分类字段异常
            for (String field : config.getCategoricalFields()) {
                List<AnomalyResult> fieldAnomalies = detectCategoricalAnomalies(dataSource, tableName, field, config);
                allAnomalies.addAll(fieldAnomalies);
            }
            
            // 4. 检测时间序列异常
            for (String field : config.getTimeFields()) {
                List<AnomalyResult> fieldAnomalies = detectTemporalAnomalies(dataSource, tableName, field, config);
                allAnomalies.addAll(fieldAnomalies);
            }
            
            // 5. 检测模式异常
            List<AnomalyResult> patternAnomalies = detectPatternAnomalies(dataSource, tableName, config);
            allAnomalies.addAll(patternAnomalies);
            
            // 6. 按异常评分排序
            allAnomalies.sort((a, b) -> Double.compare(b.getAnomalyScore(), a.getAnomalyScore()));
            
            log.info("表 {} 异常检测完成，发现 {} 个异常", tableName, allAnomalies.size());
            
        } catch (Exception e) {
            log.error("数据异常检测失败: dataSource={}, tableName={}", dataSource, tableName, e);
        }
        
        return allAnomalies;
    }

    /**
     * 检测数值字段异常
     */
    private List<AnomalyResult> detectNumericAnomalies(String dataSource, String tableName, 
                                                      String fieldName, AnomalyDetectionConfig config) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 1. 获取字段统计信息
            Map<String, Object> stats = getFieldStatistics(dataSource, tableName, fieldName);
            if (stats.isEmpty()) {
                return anomalies;
            }
            
            Double mean = (Double) stats.get("mean");
            Double stddev = (Double) stats.get("stddev");
            Double min = (Double) stats.get("min");
            Double max = (Double) stats.get("max");
            
            if (mean == null || stddev == null || stddev == 0) {
                return anomalies;
            }
            
            // 2. 检测离群值（基于Z-score）
            double threshold = config.getOutlierThreshold();
            double lowerBound = mean - threshold * stddev;
            double upperBound = mean + threshold * stddev;
            
            String outlierSql = String.format(
                "SELECT *, ABS((%s - %f) / %f) as z_score FROM %s.%s WHERE %s < %f OR %s > %f ORDER BY z_score DESC LIMIT 100",
                fieldName, mean, stddev, dataSource, tableName,
                fieldName, lowerBound, fieldName, upperBound
            );
            
            List<Map<String, Object>> outliers = jdbcTemplate.queryForList(outlierSql);
            
            for (Map<String, Object> outlier : outliers) {
                Double value = (Double) outlier.get(fieldName);
                Double zScore = (Double) outlier.get("z_score");
                
                if (value != null && zScore != null) {
                    double anomalyScore = Math.min(1.0, zScore / threshold);
                    double confidence = Math.min(0.95, 0.5 + anomalyScore * 0.45);
                    
                    String description = String.format(
                        "字段 %s 的值 %.2f 超出正常范围 [%.2f, %.2f]，Z-score: %.2f",
                        fieldName, value, lowerBound, upperBound, zScore
                    );
                    
                    AnomalyResult anomaly = new AnomalyResult(
                        "outlier", fieldName, value, mean, anomalyScore, confidence, description
                    );
                    
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("z_score", zScore);
                    metadata.put("mean", mean);
                    metadata.put("stddev", stddev);
                    metadata.put("threshold", threshold);
                    metadata.put("record_data", outlier);
                    anomaly.setMetadata(metadata);
                    
                    anomalies.add(anomaly);
                }
            }
            
            // 3. 检测趋势异常
            List<AnomalyResult> trendAnomalies = detectTrendAnomalies(dataSource, tableName, fieldName, config);
            anomalies.addAll(trendAnomalies);
            
        } catch (Exception e) {
            log.error("数值字段异常检测失败: {}.{}", tableName, fieldName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测趋势异常
     */
    private List<AnomalyResult> detectTrendAnomalies(String dataSource, String tableName, 
                                                    String fieldName, AnomalyDetectionConfig config) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 获取时间序列数据
            String timeField = config.getTimeFields().isEmpty() ? "timestamp" : config.getTimeFields().get(0);
            
            String sql = String.format(
                "SELECT %s, %s, " +
                "LAG(%s, 1) OVER (ORDER BY %s) as prev_value, " +
                "LAG(%s, 2) OVER (ORDER BY %s) as prev2_value, " +
                "AVG(%s) OVER (ORDER BY %s ROWS BETWEEN %d PRECEDING AND CURRENT ROW) as moving_avg " +
                "FROM %s.%s WHERE %s IS NOT NULL AND %s IS NOT NULL " +
                "ORDER BY %s DESC LIMIT 1000",
                timeField, fieldName, fieldName, timeField, fieldName, timeField,
                fieldName, timeField, config.getWindowSize(),
                dataSource, tableName, fieldName, timeField, timeField
            );
            
            List<Map<String, Object>> timeSeriesData = jdbcTemplate.queryForList(sql);
            
            for (Map<String, Object> record : timeSeriesData) {
                Double currentValue = (Double) record.get(fieldName);
                Double prevValue = (Double) record.get("prev_value");
                Double prev2Value = (Double) record.get("prev2_value");
                Double movingAvg = (Double) record.get("moving_avg");
                
                if (currentValue != null && prevValue != null && prev2Value != null && movingAvg != null) {
                    // 检测急剧变化
                    double changeRate = Math.abs(currentValue - prevValue) / Math.abs(prevValue + 0.001);
                    double trendChangeRate = Math.abs((currentValue - prevValue) - (prevValue - prev2Value)) / Math.abs(prevValue + 0.001);
                    
                    if (changeRate > config.getTrendThreshold() || trendChangeRate > config.getTrendThreshold()) {
                        double anomalyScore = Math.min(1.0, Math.max(changeRate, trendChangeRate) / config.getTrendThreshold());
                        double confidence = Math.min(0.9, 0.6 + anomalyScore * 0.3);
                        
                        String description = String.format(
                            "字段 %s 在时间点 %s 出现趋势异常，当前值: %.2f，前值: %.2f，变化率: %.2%%",
                            fieldName, record.get(timeField), currentValue, prevValue, changeRate * 100
                        );
                        
                        AnomalyResult anomaly = new AnomalyResult(
                            "trend", fieldName, currentValue, movingAvg, anomalyScore, confidence, description
                        );
                        
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put("change_rate", changeRate);
                        metadata.put("trend_change_rate", trendChangeRate);
                        metadata.put("moving_average", movingAvg);
                        metadata.put("timestamp", record.get(timeField));
                        anomaly.setMetadata(metadata);
                        
                        anomalies.add(anomaly);
                    }
                }
            }
            
        } catch (Exception e) {
            log.error("趋势异常检测失败: {}.{}", tableName, fieldName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测分类字段异常
     */
    private List<AnomalyResult> detectCategoricalAnomalies(String dataSource, String tableName, 
                                                          String fieldName, AnomalyDetectionConfig config) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 1. 获取分类值分布
            String sql = String.format(
                "SELECT %s, COUNT(*) as count, COUNT(*) * 100.0 / (SELECT COUNT(*) FROM %s.%s) as percentage " +
                "FROM %s.%s WHERE %s IS NOT NULL GROUP BY %s ORDER BY count DESC",
                fieldName, dataSource, tableName, dataSource, tableName, fieldName, fieldName
            );
            
            List<Map<String, Object>> distribution = jdbcTemplate.queryForList(sql);
            
            // 2. 检测异常分类值（出现频率极低的值）
            double totalRecords = distribution.stream().mapToDouble(r -> ((Number) r.get("count")).doubleValue()).sum();
            double avgPercentage = 100.0 / distribution.size();
            
            for (Map<String, Object> record : distribution) {
                String categoryValue = (String) record.get(fieldName);
                Double percentage = (Double) record.get("percentage");
                Long count = ((Number) record.get("count")).longValue();
                
                // 如果某个分类值的出现频率远低于平均值，可能是异常
                if (percentage != null && percentage < avgPercentage * 0.1 && count < 5) {
                    double anomalyScore = Math.min(1.0, (avgPercentage * 0.1 - percentage) / (avgPercentage * 0.1));
                    double confidence = Math.min(0.8, 0.5 + anomalyScore * 0.3);
                    
                    String description = String.format(
                        "字段 %s 的分类值 '%s' 出现频率异常低: %.2%% (仅 %d 次)，可能是数据录入错误",
                        fieldName, categoryValue, percentage, count
                    );
                    
                    AnomalyResult anomaly = new AnomalyResult(
                        "categorical", fieldName, categoryValue, "正常分类值", anomalyScore, confidence, description
                    );
                    
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("frequency", count);
                    metadata.put("percentage", percentage);
                    metadata.put("average_percentage", avgPercentage);
                    anomaly.setMetadata(metadata);
                    
                    anomalies.add(anomaly);
                }
            }
            
            // 3. 检测新出现的分类值
            List<AnomalyResult> newCategoryAnomalies = detectNewCategories(dataSource, tableName, fieldName);
            anomalies.addAll(newCategoryAnomalies);
            
        } catch (Exception e) {
            log.error("分类字段异常检测失败: {}.{}", tableName, fieldName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测新出现的分类值
     */
    private List<AnomalyResult> detectNewCategories(String dataSource, String tableName, String fieldName) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 检测最近7天内新出现的分类值
            String sql = String.format(
                "SELECT DISTINCT %s FROM %s.%s " +
                "WHERE created_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
                "AND %s NOT IN (" +
                "  SELECT DISTINCT %s FROM %s.%s " +
                "  WHERE created_time < DATE_SUB(NOW(), INTERVAL 7 DAY)" +
                ")",
                fieldName, dataSource, tableName, fieldName, fieldName, dataSource, tableName
            );
            
            List<Map<String, Object>> newCategories = jdbcTemplate.queryForList(sql);
            
            for (Map<String, Object> record : newCategories) {
                String newCategory = (String) record.get(fieldName);
                
                if (newCategory != null && !newCategory.trim().isEmpty()) {
                    AnomalyResult anomaly = new AnomalyResult(
                        "new_category", fieldName, newCategory, "已知分类值", 0.7, 0.6,
                        String.format("字段 %s 出现新的分类值: '%s'，需要验证是否合法", fieldName, newCategory)
                    );
                    
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("detection_period", "7 days");
                    metadata.put("category_value", newCategory);
                    anomaly.setMetadata(metadata);
                    
                    anomalies.add(anomaly);
                }
            }
            
        } catch (Exception e) {
            log.error("新分类值检测失败: {}.{}", tableName, fieldName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测时间字段异常
     */
    private List<AnomalyResult> detectTemporalAnomalies(String dataSource, String tableName, 
                                                       String fieldName, AnomalyDetectionConfig config) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 1. 检测未来时间
            String futureSql = String.format(
                "SELECT * FROM %s.%s WHERE %s > NOW() LIMIT 100",
                dataSource, tableName, fieldName
            );
            
            List<Map<String, Object>> futureRecords = jdbcTemplate.queryForList(futureSql);
            
            for (Map<String, Object> record : futureRecords) {
                Object timeValue = record.get(fieldName);
                
                AnomalyResult anomaly = new AnomalyResult(
                    "temporal", fieldName, timeValue, "当前时间或过去时间", 0.9, 0.95,
                    String.format("字段 %s 的时间值 %s 是未来时间，可能是数据录入错误", fieldName, timeValue)
                );
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("anomaly_type", "future_time");
                metadata.put("record_data", record);
                anomaly.setMetadata(metadata);
                
                anomalies.add(anomaly);
            }
            
            // 2. 检测过于久远的时间
            String oldSql = String.format(
                "SELECT * FROM %s.%s WHERE %s < DATE_SUB(NOW(), INTERVAL 10 YEAR) LIMIT 100",
                dataSource, tableName, fieldName
            );
            
            List<Map<String, Object>> oldRecords = jdbcTemplate.queryForList(oldSql);
            
            for (Map<String, Object> record : oldRecords) {
                Object timeValue = record.get(fieldName);
                
                AnomalyResult anomaly = new AnomalyResult(
                    "temporal", fieldName, timeValue, "合理的历史时间", 0.6, 0.7,
                    String.format("字段 %s 的时间值 %s 过于久远，可能需要验证", fieldName, timeValue)
                );
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("anomaly_type", "too_old");
                metadata.put("record_data", record);
                anomaly.setMetadata(metadata);
                
                anomalies.add(anomaly);
            }
            
            // 3. 检测时间间隔异常
            List<AnomalyResult> intervalAnomalies = detectTimeIntervalAnomalies(dataSource, tableName, fieldName);
            anomalies.addAll(intervalAnomalies);
            
        } catch (Exception e) {
            log.error("时间字段异常检测失败: {}.{}", tableName, fieldName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测时间间隔异常
     */
    private List<AnomalyResult> detectTimeIntervalAnomalies(String dataSource, String tableName, String fieldName) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            String sql = String.format(
                "SELECT *, " +
                "TIMESTAMPDIFF(MINUTE, LAG(%s) OVER (ORDER BY %s), %s) as interval_minutes " +
                "FROM %s.%s WHERE %s IS NOT NULL ORDER BY %s DESC LIMIT 1000",
                fieldName, fieldName, fieldName, dataSource, tableName, fieldName, fieldName
            );
            
            List<Map<String, Object>> records = jdbcTemplate.queryForList(sql);
            
            // 计算间隔的统计信息
            List<Integer> intervals = records.stream()
                .map(r -> (Integer) r.get("interval_minutes"))
                .filter(Objects::nonNull)
                .filter(i -> i > 0)
                .collect(Collectors.toList());
            
            if (intervals.size() < 10) {
                return anomalies; // 数据太少，无法检测
            }
            
            double avgInterval = intervals.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            double stdInterval = Math.sqrt(intervals.stream()
                .mapToDouble(i -> Math.pow(i - avgInterval, 2))
                .average().orElse(0.0));
            
            // 检测异常间隔
            for (Map<String, Object> record : records) {
                Integer intervalMinutes = (Integer) record.get("interval_minutes");
                
                if (intervalMinutes != null && intervalMinutes > 0) {
                    double zScore = Math.abs(intervalMinutes - avgInterval) / (stdInterval + 0.001);
                    
                    if (zScore > 3.0) { // 间隔异常
                        double anomalyScore = Math.min(1.0, zScore / 3.0);
                        double confidence = Math.min(0.9, 0.6 + anomalyScore * 0.3);
                        
                        String description = String.format(
                            "字段 %s 在时间点 %s 的间隔异常: %d 分钟 (平均: %.1f 分钟)",
                            fieldName, record.get(fieldName), intervalMinutes, avgInterval
                        );
                        
                        AnomalyResult anomaly = new AnomalyResult(
                            "interval", fieldName, intervalMinutes, avgInterval, anomalyScore, confidence, description
                        );
                        
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put("z_score", zScore);
                        metadata.put("average_interval", avgInterval);
                        metadata.put("std_interval", stdInterval);
                        metadata.put("record_data", record);
                        anomaly.setMetadata(metadata);
                        
                        anomalies.add(anomaly);
                    }
                }
            }
            
        } catch (Exception e) {
            log.error("时间间隔异常检测失败: {}.{}", tableName, fieldName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测模式异常
     */
    private List<AnomalyResult> detectPatternAnomalies(String dataSource, String tableName, 
                                                      AnomalyDetectionConfig config) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 1. 检测重复记录异常
            List<AnomalyResult> duplicateAnomalies = detectDuplicateRecords(dataSource, tableName);
            anomalies.addAll(duplicateAnomalies);
            
            // 2. 检测数据分布异常
            List<AnomalyResult> distributionAnomalies = detectDistributionAnomalies(dataSource, tableName, config);
            anomalies.addAll(distributionAnomalies);
            
            // 3. 检测关联异常
            List<AnomalyResult> correlationAnomalies = detectCorrelationAnomalies(dataSource, tableName, config);
            anomalies.addAll(correlationAnomalies);
            
        } catch (Exception e) {
            log.error("模式异常检测失败: {}", tableName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测重复记录
     */
    private List<AnomalyResult> detectDuplicateRecords(String dataSource, String tableName) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 检测完全重复的记录
            String sql = String.format(
                "SELECT *, COUNT(*) as duplicate_count FROM %s.%s " +
                "GROUP BY %s HAVING COUNT(*) > 1 LIMIT 100",
                dataSource, tableName,
                "CONCAT_WS('|', COALESCE(device_id, ''), COALESCE(timestamp, ''), COALESCE(energy_value, ''), COALESCE(status, ''))"
            );
            
            List<Map<String, Object>> duplicates = jdbcTemplate.queryForList(sql);
            
            for (Map<String, Object> record : duplicates) {
                Long duplicateCount = ((Number) record.get("duplicate_count")).longValue();
                
                if (duplicateCount > 1) {
                    double anomalyScore = Math.min(1.0, (duplicateCount - 1) / 10.0);
                    double confidence = 0.9;
                    
                    String description = String.format(
                        "发现 %d 条完全重复的记录，可能是数据导入错误",
                        duplicateCount
                    );
                    
                    AnomalyResult anomaly = new AnomalyResult(
                        "duplicate", "record", duplicateCount, 1, anomalyScore, confidence, description
                    );
                    
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("duplicate_count", duplicateCount);
                    metadata.put("sample_record", record);
                    anomaly.setMetadata(metadata);
                    
                    anomalies.add(anomaly);
                }
            }
            
        } catch (Exception e) {
            log.error("重复记录检测失败: {}", tableName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测数据分布异常
     */
    private List<AnomalyResult> detectDistributionAnomalies(String dataSource, String tableName, 
                                                           AnomalyDetectionConfig config) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            for (String field : config.getNumericFields()) {
                // 检测数据分布的偏斜度
                String sql = String.format(
                    "SELECT " +
                    "COUNT(*) as total_count, " +
                    "AVG(%s) as mean_value, " +
                    "STDDEV(%s) as std_value, " +
                    "MIN(%s) as min_value, " +
                    "MAX(%s) as max_value, " +
                    "COUNT(CASE WHEN %s = 0 THEN 1 END) as zero_count, " +
                    "COUNT(CASE WHEN %s IS NULL THEN 1 END) as null_count " +
                    "FROM %s.%s WHERE %s IS NOT NULL",
                    field, field, field, field, field, field, dataSource, tableName, field
                );
                
                Map<String, Object> stats = jdbcTemplate.queryForMap(sql);
                
                Long totalCount = ((Number) stats.get("total_count")).longValue();
                Long zeroCount = ((Number) stats.get("zero_count")).longValue();
                Long nullCount = ((Number) stats.get("null_count")).longValue();
                
                // 检测零值过多
                if (totalCount > 0 && zeroCount > totalCount * 0.5) {
                    double anomalyScore = (double) zeroCount / totalCount;
                    
                    AnomalyResult anomaly = new AnomalyResult(
                        "distribution", field, zeroCount, totalCount * 0.1, anomalyScore, 0.8,
                        String.format("字段 %s 零值过多: %d/%d (%.1%%)", field, zeroCount, totalCount, anomalyScore * 100)
                    );
                    
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("zero_count", zeroCount);
                    metadata.put("total_count", totalCount);
                    metadata.put("zero_percentage", anomalyScore);
                    anomaly.setMetadata(metadata);
                    
                    anomalies.add(anomaly);
                }
                
                // 检测空值过多
                if (totalCount > 0 && nullCount > totalCount * 0.3) {
                    double anomalyScore = (double) nullCount / (totalCount + nullCount);
                    
                    AnomalyResult anomaly = new AnomalyResult(
                        "distribution", field, nullCount, totalCount * 0.05, anomalyScore, 0.8,
                        String.format("字段 %s 空值过多: %d/%d (%.1%%)", field, nullCount, totalCount + nullCount, anomalyScore * 100)
                    );
                    
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("null_count", nullCount);
                    metadata.put("total_count", totalCount + nullCount);
                    metadata.put("null_percentage", anomalyScore);
                    anomaly.setMetadata(metadata);
                    
                    anomalies.add(anomaly);
                }
            }
            
        } catch (Exception e) {
            log.error("数据分布异常检测失败: {}", tableName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测关联异常
     */
    private List<AnomalyResult> detectCorrelationAnomalies(String dataSource, String tableName, 
                                                          AnomalyDetectionConfig config) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            List<String> numericFields = config.getNumericFields();
            
            // 检测数值字段之间的异常关联
            for (int i = 0; i < numericFields.size(); i++) {
                for (int j = i + 1; j < numericFields.size(); j++) {
                    String field1 = numericFields.get(i);
                    String field2 = numericFields.get(j);
                    
                    List<AnomalyResult> correlationAnomalies = detectFieldCorrelationAnomalies(
                        dataSource, tableName, field1, field2
                    );
                    anomalies.addAll(correlationAnomalies);
                }
            }
            
        } catch (Exception e) {
            log.error("关联异常检测失败: {}", tableName, e);
        }
        
        return anomalies;
    }

    /**
     * 检测字段关联异常
     */
    private List<AnomalyResult> detectFieldCorrelationAnomalies(String dataSource, String tableName, 
                                                               String field1, String field2) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 检测字段值的异常比例关系
            String sql = String.format(
                "SELECT *, " +
                "CASE WHEN %s != 0 THEN %s / %s ELSE NULL END as ratio " +
                "FROM %s.%s WHERE %s IS NOT NULL AND %s IS NOT NULL AND %s != 0 " +
                "ORDER BY ABS(ratio) DESC LIMIT 100",
                field2, field1, field2, dataSource, tableName, field1, field2, field2
            );
            
            List<Map<String, Object>> records = jdbcTemplate.queryForList(sql);
            
            if (records.size() < 10) {
                return anomalies;
            }
            
            // 计算比例的统计信息
            List<Double> ratios = records.stream()
                .map(r -> (Double) r.get("ratio"))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            
            double avgRatio = ratios.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double stdRatio = Math.sqrt(ratios.stream()
                .mapToDouble(r -> Math.pow(r - avgRatio, 2))
                .average().orElse(0.0));
            
            // 检测异常比例
            for (Map<String, Object> record : records) {
                Double ratio = (Double) record.get("ratio");
                
                if (ratio != null) {
                    double zScore = Math.abs(ratio - avgRatio) / (stdRatio + 0.001);
                    
                    if (zScore > 3.0) {
                        double anomalyScore = Math.min(1.0, zScore / 3.0);
                        double confidence = Math.min(0.8, 0.5 + anomalyScore * 0.3);
                        
                        String description = String.format(
                            "字段 %s 和 %s 的比例关系异常: %.2f (平均: %.2f)",
                            field1, field2, ratio, avgRatio
                        );
                        
                        AnomalyResult anomaly = new AnomalyResult(
                            "correlation", field1 + "/" + field2, ratio, avgRatio, anomalyScore, confidence, description
                        );
                        
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put("z_score", zScore);
                        metadata.put("average_ratio", avgRatio);
                        metadata.put("std_ratio", stdRatio);
                        metadata.put("field1", field1);
                        metadata.put("field2", field2);
                        metadata.put("record_data", record);
                        anomaly.setMetadata(metadata);
                        
                        anomalies.add(anomaly);
                    }
                }
            }
            
        } catch (Exception e) {
            log.error("字段关联异常检测失败: {}.{}/{}", tableName, field1, field2, e);
        }
        
        return anomalies;
    }

    /**
     * 获取字段统计信息
     */
    private Map<String, Object> getFieldStatistics(String dataSource, String tableName, String fieldName) {
        try {
            String sql = String.format(
                "SELECT " +
                "COUNT(*) as count, " +
                "AVG(%s) as mean, " +
                "STDDEV(%s) as stddev, " +
                "MIN(%s) as min, " +
                "MAX(%s) as max, " +
                "COUNT(DISTINCT %s) as distinct_count " +
                "FROM %s.%s WHERE %s IS NOT NULL",
                fieldName, fieldName, fieldName, fieldName, fieldName, dataSource, tableName, fieldName
            );
            
            return jdbcTemplate.queryForMap(sql);
            
        } catch (Exception e) {
            log.error("获取字段统计信息失败: {}.{}", tableName, fieldName, e);
            return new HashMap<>();
        }
    }

    /**
     * 获取异常检测配置
     */
    private AnomalyDetectionConfig getDetectionConfig(String tableName) {
        return DETECTION_CONFIGS.get(tableName);
    }

    /**
     * 默认异常检测
     */
    private List<AnomalyResult> performDefaultAnomalyDetection(String dataSource, String tableName) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        try {
            // 简单的默认异常检测：检查空值和重复值
            String sql = String.format(
                "SELECT " +
                "COUNT(*) as total_count, " +
                "COUNT(DISTINCT *) as distinct_count " +
                "FROM %s.%s",
                dataSource, tableName
            );
            
            Map<String, Object> result = jdbcTemplate.queryForMap(sql);
            Long totalCount = ((Number) result.get("total_count")).longValue();
            Long distinctCount = ((Number) result.get("distinct_count")).longValue();
            
            if (totalCount > distinctCount) {
                long duplicateCount = totalCount - distinctCount;
                double anomalyScore = (double) duplicateCount / totalCount;
                
                AnomalyResult anomaly = new AnomalyResult(
                    "duplicate", "record", duplicateCount, 0, anomalyScore, 0.7,
                    String.format("发现 %d 条重复记录", duplicateCount)
                );
                
                anomalies.add(anomaly);
            }
            
        } catch (Exception e) {
            log.error("默认异常检测失败: {}", tableName, e);
        }
        
        return anomalies;
    }

    /**
     * 更新异常检测配置
     */
    public void updateDetectionConfig(String tableName, AnomalyDetectionConfig config) {
        DETECTION_CONFIGS.put(tableName, config);
        log.info("更新表 {} 的异常检测配置", tableName);
    }

    /**
     * 批量检测多个表的异常
     */
    public Map<String, List<AnomalyResult>> batchDetectAnomalies(String dataSource, List<String> tableNames) {
        Map<String, List<AnomalyResult>> results = new HashMap<>();
        
        for (String tableName : tableNames) {
            try {
                List<AnomalyResult> anomalies = detectAnomalies(dataSource, tableName);
                results.put(tableName, anomalies);
            } catch (Exception e) {
                log.error("批量检测表 {} 异常失败", tableName, e);
                results.put(tableName, new ArrayList<>());
            }
        }
        
        return results;
    }

    /**
     * 获取异常统计信息
     */
    public Map<String, Object> getAnomalyStatistics(String dataSource, String tableName) {
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            List<AnomalyResult> anomalies = detectAnomalies(dataSource, tableName);
            
            // 按异常类型分组统计
            Map<String, Long> typeCount = anomalies.stream()
                .collect(Collectors.groupingBy(AnomalyResult::getAnomalyType, Collectors.counting()));
            
            // 按严重程度分组统计
            Map<String, Long> severityCount = anomalies.stream()
                .collect(Collectors.groupingBy(
                    a -> a.getAnomalyScore() >= 0.8 ? "HIGH" : a.getAnomalyScore() >= 0.5 ? "MEDIUM" : "LOW",
                    Collectors.counting()
                ));
            
            statistics.put("table_name", tableName);
            statistics.put("total_anomalies", anomalies.size());
            statistics.put("anomaly_types", typeCount);
            statistics.put("severity_distribution", severityCount);
            statistics.put("average_anomaly_score", 
                anomalies.stream().mapToDouble(AnomalyResult::getAnomalyScore).average().orElse(0.0));
            statistics.put("average_confidence", 
                anomalies.stream().mapToDouble(AnomalyResult::getConfidence).average().orElse(0.0));
            statistics.put("detection_time", new Date());
            
        } catch (Exception e) {
            log.error("获取异常统计信息失败", e);
            statistics.put("error", e.getMessage());
        }
        
        return statistics;
    }
}