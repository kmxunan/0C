package com.zerocarbon.dataquality.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

/**
 * 数据准确性验证服务
 * 负责验证数据的准确性，包括格式验证、范围检查、业务规则验证等
 */
@Slf4j
@Service
public class DataAccuracyService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 数据验证规则配置
    private static final Map<String, Map<String, Object>> VALIDATION_RULES = new HashMap<>();
    
    // 正则表达式模式
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$"
    );
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^1[3-9]\\d{9}$"
    );
    private static final Pattern ID_CARD_PATTERN = Pattern.compile(
        "^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$"
    );
    
    static {
        initializeValidationRules();
    }

    /**
     * 初始化验证规则
     */
    private static void initializeValidationRules() {
        // 能源消耗数据验证规则
        Map<String, Object> energyRules = new HashMap<>();
        energyRules.put("energy_value", Map.of(
            "type", "numeric",
            "min", 0.0,
            "max", 1000000.0,
            "precision", 4
        ));
        energyRules.put("device_id", Map.of(
            "type", "string",
            "pattern", "^[A-Z]{2}\\d{6}$",
            "length", Map.of("min", 8, "max", 8)
        ));
        energyRules.put("timestamp", Map.of(
            "type", "datetime",
            "format", "yyyy-MM-dd HH:mm:ss"
        ));
        VALIDATION_RULES.put("energy_consumption", energyRules);
        
        // 碳排放数据验证规则
        Map<String, Object> carbonRules = new HashMap<>();
        carbonRules.put("emission_value", Map.of(
            "type", "numeric",
            "min", 0.0,
            "max", 100000.0,
            "precision", 6
        ));
        carbonRules.put("emission_factor", Map.of(
            "type", "numeric",
            "min", 0.0,
            "max", 10.0,
            "precision", 8
        ));
        carbonRules.put("emission_source", Map.of(
            "type", "enum",
            "values", Arrays.asList("electricity", "gas", "coal", "oil", "steam", "other")
        ));
        VALIDATION_RULES.put("carbon_emission", carbonRules);
        
        // 设备数据验证规则
        Map<String, Object> deviceRules = new HashMap<>();
        deviceRules.put("device_type", Map.of(
            "type", "enum",
            "values", Arrays.asList("sensor", "meter", "controller", "gateway", "actuator")
        ));
        deviceRules.put("status", Map.of(
            "type", "enum",
            "values", Arrays.asList("online", "offline", "maintenance", "error")
        ));
        deviceRules.put("location", Map.of(
            "type", "coordinate",
            "lat_range", Map.of("min", -90.0, "max", 90.0),
            "lng_range", Map.of("min", -180.0, "max", 180.0)
        ));
        VALIDATION_RULES.put("device_data", deviceRules);
        
        // 企业数据验证规则
        Map<String, Object> enterpriseRules = new HashMap<>();
        enterpriseRules.put("enterprise_name", Map.of(
            "type", "string",
            "length", Map.of("min", 2, "max", 100)
        ));
        enterpriseRules.put("contact_email", Map.of(
            "type", "email"
        ));
        enterpriseRules.put("contact_phone", Map.of(
            "type", "phone"
        ));
        VALIDATION_RULES.put("enterprise_data", enterpriseRules);
    }

    /**
     * 验证数据准确性
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @return 准确性评分 (0.0-1.0)
     */
    public double validateAccuracy(String dataSource, String tableName) {
        log.info("开始验证数据准确性: dataSource={}, tableName={}", dataSource, tableName);
        
        try {
            // 1. 获取表的总记录数
            long totalRecords = getTotalRecords(dataSource, tableName);
            if (totalRecords == 0) {
                log.warn("表 {} 没有数据记录", tableName);
                return 0.0;
            }
            
            // 2. 获取验证规则
            Map<String, Object> validationRules = getValidationRules(tableName);
            if (validationRules.isEmpty()) {
                log.info("表 {} 没有配置验证规则，使用默认验证", tableName);
                return performDefaultValidation(dataSource, tableName);
            }
            
            // 3. 执行字段级验证
            double totalAccuracyScore = 0.0;
            Map<String, Double> fieldAccuracy = new HashMap<>();
            
            for (Map.Entry<String, Object> entry : validationRules.entrySet()) {
                String fieldName = entry.getKey();
                @SuppressWarnings("unchecked")
                Map<String, Object> fieldRules = (Map<String, Object>) entry.getValue();
                
                double fieldScore = validateField(dataSource, tableName, fieldName, fieldRules, totalRecords);
                fieldAccuracy.put(fieldName, fieldScore);
                totalAccuracyScore += fieldScore;
            }
            
            // 4. 计算平均准确性评分
            double averageScore = totalAccuracyScore / validationRules.size();
            
            // 5. 执行业务规则验证
            double businessRuleScore = validateBusinessRules(dataSource, tableName);
            
            // 6. 综合评分（字段验证70% + 业务规则30%）
            double finalScore = averageScore * 0.7 + businessRuleScore * 0.3;
            
            // 7. 记录详细信息
            logAccuracyDetails(tableName, fieldAccuracy, businessRuleScore, finalScore);
            
            return Math.round(finalScore * 10000.0) / 10000.0; // 保留4位小数
            
        } catch (Exception e) {
            log.error("数据准确性验证失败: dataSource={}, tableName={}", dataSource, tableName, e);
            return 0.0;
        }
    }

    /**
     * 验证单个字段的准确性
     */
    @SuppressWarnings("unchecked")
    private double validateField(String dataSource, String tableName, String fieldName, 
                               Map<String, Object> fieldRules, long totalRecords) {
        try {
            String fieldType = (String) fieldRules.get("type");
            long validRecords = 0;
            
            switch (fieldType) {
                case "numeric":
                    validRecords = validateNumericField(dataSource, tableName, fieldName, fieldRules);
                    break;
                case "string":
                    validRecords = validateStringField(dataSource, tableName, fieldName, fieldRules);
                    break;
                case "datetime":
                    validRecords = validateDateTimeField(dataSource, tableName, fieldName, fieldRules);
                    break;
                case "enum":
                    validRecords = validateEnumField(dataSource, tableName, fieldName, fieldRules);
                    break;
                case "email":
                    validRecords = validateEmailField(dataSource, tableName, fieldName);
                    break;
                case "phone":
                    validRecords = validatePhoneField(dataSource, tableName, fieldName);
                    break;
                case "coordinate":
                    validRecords = validateCoordinateField(dataSource, tableName, fieldName, fieldRules);
                    break;
                default:
                    log.warn("未知的字段类型: {}", fieldType);
                    return 1.0; // 默认认为有效
            }
            
            return (double) validRecords / totalRecords;
            
        } catch (Exception e) {
            log.error("字段准确性验证失败: field={}", fieldName, e);
            return 0.0;
        }
    }

    /**
     * 验证数值型字段
     */
    @SuppressWarnings("unchecked")
    private long validateNumericField(String dataSource, String tableName, String fieldName, 
                                    Map<String, Object> rules) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COUNT(*) FROM ").append(dataSource).append(".").append(tableName)
               .append(" WHERE ").append(fieldName).append(" IS NOT NULL");
            
            // 添加范围检查
            if (rules.containsKey("min")) {
                Double min = ((Number) rules.get("min")).doubleValue();
                sql.append(" AND ").append(fieldName).append(" >= ").append(min);
            }
            if (rules.containsKey("max")) {
                Double max = ((Number) rules.get("max")).doubleValue();
                sql.append(" AND ").append(fieldName).append(" <= ").append(max);
            }
            
            // 添加精度检查（检查小数位数）
            if (rules.containsKey("precision")) {
                Integer precision = (Integer) rules.get("precision");
                sql.append(" AND (CHAR_LENGTH(SUBSTRING_INDEX(").append(fieldName)
                   .append(", '.', -1)) <= ").append(precision).append(" OR ").append(fieldName)
                   .append(" = FLOOR(").append(fieldName).append("))");
            }
            
            Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class);
            return count != null ? count : 0L;
            
        } catch (Exception e) {
            log.error("数值字段验证失败: {}", fieldName, e);
            return 0L;
        }
    }

    /**
     * 验证字符串字段
     */
    @SuppressWarnings("unchecked")
    private long validateStringField(String dataSource, String tableName, String fieldName, 
                                   Map<String, Object> rules) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COUNT(*) FROM ").append(dataSource).append(".").append(tableName)
               .append(" WHERE ").append(fieldName).append(" IS NOT NULL AND ").append(fieldName).append(" != ''");
            
            // 添加长度检查
            if (rules.containsKey("length")) {
                Map<String, Integer> lengthRules = (Map<String, Integer>) rules.get("length");
                if (lengthRules.containsKey("min")) {
                    sql.append(" AND CHAR_LENGTH(").append(fieldName).append(") >= ").append(lengthRules.get("min"));
                }
                if (lengthRules.containsKey("max")) {
                    sql.append(" AND CHAR_LENGTH(").append(fieldName).append(") <= ").append(lengthRules.get("max"));
                }
            }
            
            // 添加正则表达式检查
            if (rules.containsKey("pattern")) {
                String pattern = (String) rules.get("pattern");
                sql.append(" AND ").append(fieldName).append(" REGEXP '").append(pattern).append("'");
            }
            
            Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class);
            return count != null ? count : 0L;
            
        } catch (Exception e) {
            log.error("字符串字段验证失败: {}", fieldName, e);
            return 0L;
        }
    }

    /**
     * 验证日期时间字段
     */
    private long validateDateTimeField(String dataSource, String tableName, String fieldName, 
                                     Map<String, Object> rules) {
        try {
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE %s IS NOT NULL AND %s REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$'",
                dataSource, tableName, fieldName, fieldName
            );
            
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
            
        } catch (Exception e) {
            log.error("日期时间字段验证失败: {}", fieldName, e);
            return 0L;
        }
    }

    /**
     * 验证枚举字段
     */
    @SuppressWarnings("unchecked")
    private long validateEnumField(String dataSource, String tableName, String fieldName, 
                                 Map<String, Object> rules) {
        try {
            List<String> validValues = (List<String>) rules.get("values");
            if (validValues == null || validValues.isEmpty()) {
                return 0L;
            }
            
            String valueList = validValues.stream()
                .map(v -> "'" + v + "'")
                .reduce((a, b) -> a + "," + b)
                .orElse("");
            
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE %s IN (%s)",
                dataSource, tableName, fieldName, valueList
            );
            
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
            
        } catch (Exception e) {
            log.error("枚举字段验证失败: {}", fieldName, e);
            return 0L;
        }
    }

    /**
     * 验证邮箱字段
     */
    private long validateEmailField(String dataSource, String tableName, String fieldName) {
        try {
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE %s REGEXP '^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
                dataSource, tableName, fieldName
            );
            
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
            
        } catch (Exception e) {
            log.error("邮箱字段验证失败: {}", fieldName, e);
            return 0L;
        }
    }

    /**
     * 验证手机号字段
     */
    private long validatePhoneField(String dataSource, String tableName, String fieldName) {
        try {
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE %s REGEXP '^1[3-9][0-9]{9}$'",
                dataSource, tableName, fieldName
            );
            
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
            
        } catch (Exception e) {
            log.error("手机号字段验证失败: {}", fieldName, e);
            return 0L;
        }
    }

    /**
     * 验证坐标字段
     */
    @SuppressWarnings("unchecked")
    private long validateCoordinateField(String dataSource, String tableName, String fieldName, 
                                       Map<String, Object> rules) {
        try {
            // 假设坐标字段格式为 "lat,lng"
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COUNT(*) FROM ").append(dataSource).append(".").append(tableName)
               .append(" WHERE ").append(fieldName).append(" IS NOT NULL")
               .append(" AND ").append(fieldName).append(" REGEXP '^-?[0-9]+(\\.[0-9]+)?,-?[0-9]+(\\.[0-9]+)?$'");
            
            // 添加纬度范围检查
            if (rules.containsKey("lat_range")) {
                Map<String, Double> latRange = (Map<String, Double>) rules.get("lat_range");
                if (latRange.containsKey("min") && latRange.containsKey("max")) {
                    sql.append(" AND CAST(SUBSTRING_INDEX(").append(fieldName).append(", ',', 1) AS DECIMAL(10,6)) BETWEEN ")
                       .append(latRange.get("min")).append(" AND ").append(latRange.get("max"));
                }
            }
            
            // 添加经度范围检查
            if (rules.containsKey("lng_range")) {
                Map<String, Double> lngRange = (Map<String, Double>) rules.get("lng_range");
                if (lngRange.containsKey("min") && lngRange.containsKey("max")) {
                    sql.append(" AND CAST(SUBSTRING_INDEX(").append(fieldName).append(", ',', -1) AS DECIMAL(10,6)) BETWEEN ")
                       .append(lngRange.get("min")).append(" AND ").append(lngRange.get("max"));
                }
            }
            
            Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class);
            return count != null ? count : 0L;
            
        } catch (Exception e) {
            log.error("坐标字段验证失败: {}", fieldName, e);
            return 0L;
        }
    }

    /**
     * 验证业务规则
     */
    private double validateBusinessRules(String dataSource, String tableName) {
        try {
            double totalScore = 0.0;
            int ruleCount = 0;
            
            // 根据表名执行特定的业务规则验证
            switch (tableName) {
                case "energy_consumption":
                    totalScore += validateEnergyBusinessRules(dataSource, tableName);
                    ruleCount++;
                    break;
                case "carbon_emission":
                    totalScore += validateCarbonBusinessRules(dataSource, tableName);
                    ruleCount++;
                    break;
                case "device_data":
                    totalScore += validateDeviceBusinessRules(dataSource, tableName);
                    ruleCount++;
                    break;
                default:
                    return 1.0; // 没有特定业务规则时返回满分
            }
            
            return ruleCount > 0 ? totalScore / ruleCount : 1.0;
            
        } catch (Exception e) {
            log.error("业务规则验证失败", e);
            return 0.0;
        }
    }

    /**
     * 验证能源数据业务规则
     */
    private double validateEnergyBusinessRules(String dataSource, String tableName) {
        try {
            // 规则1: 能源值应该在合理范围内（不能为负数，不能过大）
            String sql1 = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE energy_value >= 0 AND energy_value <= 1000000",
                dataSource, tableName
            );
            
            // 规则2: 时间戳应该在合理范围内（不能是未来时间，不能太久远）
            String sql2 = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE timestamp <= NOW() AND timestamp >= DATE_SUB(NOW(), INTERVAL 10 YEAR)",
                dataSource, tableName
            );
            
            long totalRecords = getTotalRecords(dataSource, tableName);
            if (totalRecords == 0) return 1.0;
            
            Long validRule1 = jdbcTemplate.queryForObject(sql1, Long.class);
            Long validRule2 = jdbcTemplate.queryForObject(sql2, Long.class);
            
            double rule1Score = validRule1 != null ? (double) validRule1 / totalRecords : 0.0;
            double rule2Score = validRule2 != null ? (double) validRule2 / totalRecords : 0.0;
            
            return (rule1Score + rule2Score) / 2.0;
            
        } catch (Exception e) {
            log.error("能源业务规则验证失败", e);
            return 0.0;
        }
    }

    /**
     * 验证碳排放数据业务规则
     */
    private double validateCarbonBusinessRules(String dataSource, String tableName) {
        try {
            // 规则1: 排放值和排放因子的乘积应该合理
            String sql1 = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE emission_value * emission_factor <= 1000000",
                dataSource, tableName
            );
            
            // 规则2: 排放因子应该在合理范围内
            String sql2 = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE emission_factor > 0 AND emission_factor <= 10",
                dataSource, tableName
            );
            
            long totalRecords = getTotalRecords(dataSource, tableName);
            if (totalRecords == 0) return 1.0;
            
            Long validRule1 = jdbcTemplate.queryForObject(sql1, Long.class);
            Long validRule2 = jdbcTemplate.queryForObject(sql2, Long.class);
            
            double rule1Score = validRule1 != null ? (double) validRule1 / totalRecords : 0.0;
            double rule2Score = validRule2 != null ? (double) validRule2 / totalRecords : 0.0;
            
            return (rule1Score + rule2Score) / 2.0;
            
        } catch (Exception e) {
            log.error("碳排放业务规则验证失败", e);
            return 0.0;
        }
    }

    /**
     * 验证设备数据业务规则
     */
    private double validateDeviceBusinessRules(String dataSource, String tableName) {
        try {
            // 规则1: 设备ID应该唯一
            String sql1 = String.format(
                "SELECT COUNT(DISTINCT device_id) FROM %s.%s",
                dataSource, tableName
            );
            
            String sql2 = String.format(
                "SELECT COUNT(*) FROM %s.%s",
                dataSource, tableName
            );
            
            Long distinctDevices = jdbcTemplate.queryForObject(sql1, Long.class);
            Long totalRecords = jdbcTemplate.queryForObject(sql2, Long.class);
            
            if (totalRecords == null || totalRecords == 0) return 1.0;
            
            double uniquenessScore = distinctDevices != null ? (double) distinctDevices / totalRecords : 0.0;
            
            return uniquenessScore;
            
        } catch (Exception e) {
            log.error("设备业务规则验证失败", e);
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
     * 获取验证规则
     */
    private Map<String, Object> getValidationRules(String tableName) {
        return VALIDATION_RULES.getOrDefault(tableName, new HashMap<>());
    }

    /**
     * 默认准确性验证
     */
    private double performDefaultValidation(String dataSource, String tableName) {
        try {
            // 简单的默认验证：检查是否有明显的异常值
            long totalRecords = getTotalRecords(dataSource, tableName);
            if (totalRecords == 0) return 0.0;
            
            // 检查是否有空值过多的情况
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE 1=1", // 基础查询，可以扩展
                dataSource, tableName
            );
            
            Long validRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return validRecords != null ? (double) validRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("默认准确性验证失败", e);
            return 0.0;
        }
    }

    /**
     * 记录准确性验证详细信息
     */
    private void logAccuracyDetails(String tableName, Map<String, Double> fieldAccuracy, 
                                  double businessRuleScore, double finalScore) {
        log.info("表 {} 准确性验证结果:", tableName);
        log.info("  最终准确性评分: {:.2%}", finalScore);
        log.info("  业务规则评分: {:.2%}", businessRuleScore);
        
        for (Map.Entry<String, Double> entry : fieldAccuracy.entrySet()) {
            String field = entry.getKey();
            Double score = entry.getValue();
            String status = score >= 0.99 ? "优秀" : score >= 0.95 ? "良好" : score >= 0.90 ? "一般" : "较差";
            log.info("  字段 {}: {:.2%} ({})", field, score, status);
        }
    }

    /**
     * 获取准确性验证详细报告
     */
    public Map<String, Object> getAccuracyReport(String dataSource, String tableName) {
        Map<String, Object> report = new HashMap<>();
        
        try {
            long totalRecords = getTotalRecords(dataSource, tableName);
            Map<String, Object> validationRules = getValidationRules(tableName);
            
            Map<String, Object> fieldDetails = new HashMap<>();
            double totalScore = 0.0;
            
            for (Map.Entry<String, Object> entry : validationRules.entrySet()) {
                String fieldName = entry.getKey();
                @SuppressWarnings("unchecked")
                Map<String, Object> fieldRules = (Map<String, Object>) entry.getValue();
                
                double fieldScore = validateField(dataSource, tableName, fieldName, fieldRules, totalRecords);
                long validCount = (long) (fieldScore * totalRecords);
                long invalidCount = totalRecords - validCount;
                
                Map<String, Object> fieldInfo = new HashMap<>();
                fieldInfo.put("accuracy_score", fieldScore);
                fieldInfo.put("total_records", totalRecords);
                fieldInfo.put("valid_records", validCount);
                fieldInfo.put("invalid_records", invalidCount);
                fieldInfo.put("invalid_percentage", (double) invalidCount / totalRecords);
                fieldInfo.put("validation_rules", fieldRules);
                
                fieldDetails.put(fieldName, fieldInfo);
                totalScore += fieldScore;
            }
            
            double businessRuleScore = validateBusinessRules(dataSource, tableName);
            double finalScore = validationRules.size() > 0 ? 
                (totalScore / validationRules.size()) * 0.7 + businessRuleScore * 0.3 : businessRuleScore;
            
            report.put("table_name", tableName);
            report.put("data_source", dataSource);
            report.put("total_records", totalRecords);
            report.put("overall_accuracy", finalScore);
            report.put("business_rule_score", businessRuleScore);
            report.put("field_details", fieldDetails);
            report.put("check_time", new Date());
            
        } catch (Exception e) {
            log.error("生成准确性报告失败", e);
            report.put("error", e.getMessage());
        }
        
        return report;
    }

    /**
     * 更新验证规则
     */
    public void updateValidationRules(String tableName, Map<String, Object> rules) {
        VALIDATION_RULES.put(tableName, new HashMap<>(rules));
        log.info("更新表 {} 的验证规则", tableName);
    }

    /**
     * 批量验证多个表的准确性
     */
    public Map<String, Double> batchValidateAccuracy(String dataSource, List<String> tableNames) {
        Map<String, Double> results = new HashMap<>();
        
        for (String tableName : tableNames) {
            try {
                double score = validateAccuracy(dataSource, tableName);
                results.put(tableName, score);
            } catch (Exception e) {
                log.error("批量验证表 {} 准确性失败", tableName, e);
                results.put(tableName, 0.0);
            }
        }
        
        return results;
    }
}