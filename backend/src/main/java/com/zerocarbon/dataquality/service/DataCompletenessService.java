package com.zerocarbon.dataquality.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 数据完整性检查服务
 * 负责检查数据的完整性，包括空值检查、必填字段验证等
 */
@Slf4j
@Service
public class DataCompletenessService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 完整性检查配置
    private static final Map<String, List<String>> REQUIRED_FIELDS = new HashMap<>();
    
    static {
        // 能源数据必填字段
        REQUIRED_FIELDS.put("energy_consumption", Arrays.asList(
            "device_id", "timestamp", "energy_value", "unit", "data_source"
        ));
        
        // 碳排放数据必填字段
        REQUIRED_FIELDS.put("carbon_emission", Arrays.asList(
            "emission_source", "timestamp", "emission_value", "emission_factor", "calculation_method"
        ));
        
        // 设备数据必填字段
        REQUIRED_FIELDS.put("device_data", Arrays.asList(
            "device_id", "device_type", "status", "timestamp", "location"
        ));
        
        // 企业数据必填字段
        REQUIRED_FIELDS.put("enterprise_data", Arrays.asList(
            "enterprise_id", "enterprise_name", "industry_type", "registration_time"
        ));
    }

    /**
     * 检查数据完整性
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @return 完整性评分 (0.0-1.0)
     */
    public double checkCompleteness(String dataSource, String tableName) {
        log.info("开始检查数据完整性: dataSource={}, tableName={}", dataSource, tableName);
        
        try {
            // 1. 获取表的总记录数
            long totalRecords = getTotalRecords(dataSource, tableName);
            if (totalRecords == 0) {
                log.warn("表 {} 没有数据记录", tableName);
                return 0.0;
            }
            
            // 2. 获取必填字段列表
            List<String> requiredFields = getRequiredFields(tableName);
            if (requiredFields.isEmpty()) {
                log.info("表 {} 没有配置必填字段，使用默认检查", tableName);
                return checkDefaultCompleteness(dataSource, tableName);
            }
            
            // 3. 检查每个必填字段的完整性
            double totalCompletenessScore = 0.0;
            Map<String, Double> fieldCompleteness = new HashMap<>();
            
            for (String field : requiredFields) {
                double fieldScore = checkFieldCompleteness(dataSource, tableName, field, totalRecords);
                fieldCompleteness.put(field, fieldScore);
                totalCompletenessScore += fieldScore;
            }
            
            // 4. 计算平均完整性评分
            double averageScore = totalCompletenessScore / requiredFields.size();
            
            // 5. 记录详细信息
            logCompletenessDetails(tableName, fieldCompleteness, averageScore);
            
            return Math.round(averageScore * 10000.0) / 10000.0; // 保留4位小数
            
        } catch (Exception e) {
            log.error("数据完整性检查失败: dataSource={}, tableName={}", dataSource, tableName, e);
            return 0.0;
        }
    }

    /**
     * 检查单个字段的完整性
     * @param dataSource 数据源
     * @param tableName 表名
     * @param fieldName 字段名
     * @param totalRecords 总记录数
     * @return 字段完整性评分
     */
    private double checkFieldCompleteness(String dataSource, String tableName, String fieldName, long totalRecords) {
        try {
            // 构建查询SQL，检查非空记录数
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE %s IS NOT NULL AND %s != '' AND TRIM(%s) != ''",
                dataSource, tableName, fieldName, fieldName, fieldName
            );
            
            Long nonNullRecords = jdbcTemplate.queryForObject(sql, Long.class);
            if (nonNullRecords == null) {
                nonNullRecords = 0L;
            }
            
            return (double) nonNullRecords / totalRecords;
            
        } catch (Exception e) {
            log.error("字段完整性检查失败: field={}", fieldName, e);
            return 0.0;
        }
    }

    /**
     * 获取表的总记录数
     */
    private long getTotalRecords(String dataSource, String tableName) {
        try {
            String sql = String.format("SELECT COUNT(*) FROM %s.%s", dataSource, tableName);
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            log.error("获取表记录数失败: {}.{}", dataSource, tableName, e);
            return 0L;
        }
    }

    /**
     * 获取表的必填字段列表
     */
    private List<String> getRequiredFields(String tableName) {
        return REQUIRED_FIELDS.getOrDefault(tableName, new ArrayList<>());
    }

    /**
     * 默认完整性检查（当没有配置必填字段时）
     */
    private double checkDefaultCompleteness(String dataSource, String tableName) {
        try {
            // 获取表的所有列
            String sql = String.format(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '%s' AND TABLE_NAME = '%s'",
                dataSource, tableName
            );
            
            List<String> columns = jdbcTemplate.queryForList(sql, String.class);
            if (columns.isEmpty()) {
                return 0.0;
            }
            
            long totalRecords = getTotalRecords(dataSource, tableName);
            double totalScore = 0.0;
            
            // 检查每列的完整性
            for (String column : columns) {
                double columnScore = checkFieldCompleteness(dataSource, tableName, column, totalRecords);
                totalScore += columnScore;
            }
            
            return totalScore / columns.size();
            
        } catch (Exception e) {
            log.error("默认完整性检查失败", e);
            return 0.0;
        }
    }

    /**
     * 记录完整性检查详细信息
     */
    private void logCompletenessDetails(String tableName, Map<String, Double> fieldCompleteness, double averageScore) {
        log.info("表 {} 完整性检查结果:", tableName);
        log.info("  平均完整性评分: {:.2%}", averageScore);
        
        for (Map.Entry<String, Double> entry : fieldCompleteness.entrySet()) {
            String field = entry.getKey();
            Double score = entry.getValue();
            String status = score >= 0.95 ? "优秀" : score >= 0.90 ? "良好" : score >= 0.80 ? "一般" : "较差";
            log.info("  字段 {}: {:.2%} ({})", field, score, status);
        }
    }

    /**
     * 获取完整性检查详细报告
     * @param dataSource 数据源
     * @param tableName 表名
     * @return 详细报告
     */
    public Map<String, Object> getCompletenessReport(String dataSource, String tableName) {
        Map<String, Object> report = new HashMap<>();
        
        try {
            long totalRecords = getTotalRecords(dataSource, tableName);
            List<String> requiredFields = getRequiredFields(tableName);
            
            Map<String, Object> fieldDetails = new HashMap<>();
            double totalScore = 0.0;
            
            for (String field : requiredFields) {
                double fieldScore = checkFieldCompleteness(dataSource, tableName, field, totalRecords);
                long nonNullCount = (long) (fieldScore * totalRecords);
                long nullCount = totalRecords - nonNullCount;
                
                Map<String, Object> fieldInfo = new HashMap<>();
                fieldInfo.put("completeness_score", fieldScore);
                fieldInfo.put("total_records", totalRecords);
                fieldInfo.put("non_null_records", nonNullCount);
                fieldInfo.put("null_records", nullCount);
                fieldInfo.put("null_percentage", (double) nullCount / totalRecords);
                
                fieldDetails.put(field, fieldInfo);
                totalScore += fieldScore;
            }
            
            report.put("table_name", tableName);
            report.put("data_source", dataSource);
            report.put("total_records", totalRecords);
            report.put("overall_completeness", totalScore / requiredFields.size());
            report.put("field_details", fieldDetails);
            report.put("check_time", new Date());
            
        } catch (Exception e) {
            log.error("生成完整性报告失败", e);
            report.put("error", e.getMessage());
        }
        
        return report;
    }

    /**
     * 添加或更新必填字段配置
     * @param tableName 表名
     * @param requiredFields 必填字段列表
     */
    public void updateRequiredFields(String tableName, List<String> requiredFields) {
        REQUIRED_FIELDS.put(tableName, new ArrayList<>(requiredFields));
        log.info("更新表 {} 的必填字段配置: {}", tableName, requiredFields);
    }

    /**
     * 批量检查多个表的完整性
     * @param dataSource 数据源
     * @param tableNames 表名列表
     * @return 完整性评分映射
     */
    public Map<String, Double> batchCheckCompleteness(String dataSource, List<String> tableNames) {
        Map<String, Double> results = new HashMap<>();
        
        for (String tableName : tableNames) {
            try {
                double score = checkCompleteness(dataSource, tableName);
                results.put(tableName, score);
            } catch (Exception e) {
                log.error("批量检查表 {} 完整性失败", tableName, e);
                results.put(tableName, 0.0);
            }
        }
        
        return results;
    }
}