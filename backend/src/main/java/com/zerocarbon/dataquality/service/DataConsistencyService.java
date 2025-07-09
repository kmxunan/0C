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
 * 数据一致性监控服务
 * 负责检查数据的一致性，包括跨表一致性、时间序列一致性、引用完整性等
 */
@Slf4j
@Service
public class DataConsistencyService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 一致性检查规则配置
    private static final Map<String, List<ConsistencyRule>> CONSISTENCY_RULES = new HashMap<>();
    
    static {
        initializeConsistencyRules();
    }

    /**
     * 一致性规则定义
     */
    public static class ConsistencyRule {
        private String ruleType; // cross_table, temporal, referential, logical
        private String description;
        private String sourceTable;
        private String targetTable;
        private String sourceField;
        private String targetField;
        private String condition;
        private double weight; // 规则权重
        
        public ConsistencyRule(String ruleType, String description, String sourceTable, 
                             String targetTable, String sourceField, String targetField, 
                             String condition, double weight) {
            this.ruleType = ruleType;
            this.description = description;
            this.sourceTable = sourceTable;
            this.targetTable = targetTable;
            this.sourceField = sourceField;
            this.targetField = targetField;
            this.condition = condition;
            this.weight = weight;
        }
        
        // Getters
        public String getRuleType() { return ruleType; }
        public String getDescription() { return description; }
        public String getSourceTable() { return sourceTable; }
        public String getTargetTable() { return targetTable; }
        public String getSourceField() { return sourceField; }
        public String getTargetField() { return targetField; }
        public String getCondition() { return condition; }
        public double getWeight() { return weight; }
    }

    /**
     * 初始化一致性检查规则
     */
    private static void initializeConsistencyRules() {
        // 能源消耗数据一致性规则
        List<ConsistencyRule> energyRules = new ArrayList<>();
        energyRules.add(new ConsistencyRule(
            "referential", "设备ID引用完整性", 
            "energy_consumption", "device_data", 
            "device_id", "device_id", 
            "EXISTS", 0.3
        ));
        energyRules.add(new ConsistencyRule(
            "temporal", "时间序列连续性", 
            "energy_consumption", "energy_consumption", 
            "timestamp", "timestamp", 
            "TIME_SERIES", 0.2
        ));
        energyRules.add(new ConsistencyRule(
            "logical", "能源值逻辑一致性", 
            "energy_consumption", "energy_consumption", 
            "energy_value", "energy_value", 
            "LOGICAL_RANGE", 0.3
        ));
        energyRules.add(new ConsistencyRule(
            "cross_table", "能源与碳排放数据一致性", 
            "energy_consumption", "carbon_emission", 
            "device_id,timestamp", "emission_source,timestamp", 
            "CORRELATION", 0.2
        ));
        CONSISTENCY_RULES.put("energy_consumption", energyRules);
        
        // 碳排放数据一致性规则
        List<ConsistencyRule> carbonRules = new ArrayList<>();
        carbonRules.add(new ConsistencyRule(
            "logical", "排放计算一致性", 
            "carbon_emission", "carbon_emission", 
            "emission_value,emission_factor", "calculated_emission", 
            "CALCULATION", 0.4
        ));
        carbonRules.add(new ConsistencyRule(
            "temporal", "排放数据时间一致性", 
            "carbon_emission", "carbon_emission", 
            "timestamp", "timestamp", 
            "TIME_SERIES", 0.3
        ));
        carbonRules.add(new ConsistencyRule(
            "cross_table", "排放源与设备一致性", 
            "carbon_emission", "device_data", 
            "emission_source", "device_id", 
            "MAPPING", 0.3
        ));
        CONSISTENCY_RULES.put("carbon_emission", carbonRules);
        
        // 设备数据一致性规则
        List<ConsistencyRule> deviceRules = new ArrayList<>();
        deviceRules.add(new ConsistencyRule(
            "logical", "设备状态逻辑一致性", 
            "device_data", "device_data", 
            "status,last_maintenance", "status", 
            "STATUS_LOGIC", 0.4
        ));
        deviceRules.add(new ConsistencyRule(
            "temporal", "设备状态变更一致性", 
            "device_data", "device_data", 
            "status,timestamp", "status,timestamp", 
            "STATUS_CHANGE", 0.3
        ));
        deviceRules.add(new ConsistencyRule(
            "referential", "设备位置引用一致性", 
            "device_data", "location_master", 
            "location", "location_id", 
            "EXISTS", 0.3
        ));
        CONSISTENCY_RULES.put("device_data", deviceRules);
        
        // 企业数据一致性规则
        List<ConsistencyRule> enterpriseRules = new ArrayList<>();
        enterpriseRules.add(new ConsistencyRule(
            "logical", "企业信息逻辑一致性", 
            "enterprise_data", "enterprise_data", 
            "registration_time,status", "status", 
            "ENTERPRISE_LOGIC", 0.5
        ));
        enterpriseRules.add(new ConsistencyRule(
            "cross_table", "企业与设备关联一致性", 
            "enterprise_data", "device_data", 
            "enterprise_id", "owner_id", 
            "OWNERSHIP", 0.5
        ));
        CONSISTENCY_RULES.put("enterprise_data", enterpriseRules);
    }

    /**
     * 检查数据一致性
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @return 一致性评分 (0.0-1.0)
     */
    public double checkConsistency(String dataSource, String tableName) {
        log.info("开始检查数据一致性: dataSource={}, tableName={}", dataSource, tableName);
        
        try {
            // 1. 获取表的总记录数
            long totalRecords = getTotalRecords(dataSource, tableName);
            if (totalRecords == 0) {
                log.warn("表 {} 没有数据记录", tableName);
                return 0.0;
            }
            
            // 2. 获取一致性检查规则
            List<ConsistencyRule> rules = getConsistencyRules(tableName);
            if (rules.isEmpty()) {
                log.info("表 {} 没有配置一致性规则，使用默认检查", tableName);
                return performDefaultConsistencyCheck(dataSource, tableName);
            }
            
            // 3. 执行各类一致性检查
            double totalWeightedScore = 0.0;
            double totalWeight = 0.0;
            Map<String, Double> ruleScores = new HashMap<>();
            
            for (ConsistencyRule rule : rules) {
                double ruleScore = executeConsistencyRule(dataSource, rule, totalRecords);
                ruleScores.put(rule.getDescription(), ruleScore);
                totalWeightedScore += ruleScore * rule.getWeight();
                totalWeight += rule.getWeight();
            }
            
            // 4. 计算加权平均一致性评分
            double finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0.0;
            
            // 5. 记录详细信息
            logConsistencyDetails(tableName, ruleScores, finalScore);
            
            return Math.round(finalScore * 10000.0) / 10000.0; // 保留4位小数
            
        } catch (Exception e) {
            log.error("数据一致性检查失败: dataSource={}, tableName={}", dataSource, tableName, e);
            return 0.0;
        }
    }

    /**
     * 执行单个一致性规则
     */
    private double executeConsistencyRule(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            switch (rule.getRuleType()) {
                case "referential":
                    return checkReferentialIntegrity(dataSource, rule, totalRecords);
                case "temporal":
                    return checkTemporalConsistency(dataSource, rule, totalRecords);
                case "logical":
                    return checkLogicalConsistency(dataSource, rule, totalRecords);
                case "cross_table":
                    return checkCrossTableConsistency(dataSource, rule, totalRecords);
                default:
                    log.warn("未知的一致性规则类型: {}", rule.getRuleType());
                    return 1.0;
            }
        } catch (Exception e) {
            log.error("执行一致性规则失败: {}", rule.getDescription(), e);
            return 0.0;
        }
    }

    /**
     * 检查引用完整性
     */
    private double checkReferentialIntegrity(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s s WHERE EXISTS (SELECT 1 FROM %s.%s t WHERE s.%s = t.%s)",
                dataSource, rule.getSourceTable(),
                dataSource, rule.getTargetTable(),
                rule.getSourceField(), rule.getTargetField()
            );
            
            Long validRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return validRecords != null ? (double) validRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("引用完整性检查失败: {}", rule.getDescription(), e);
            return 0.0;
        }
    }

    /**
     * 检查时间序列一致性
     */
    private double checkTemporalConsistency(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            if ("TIME_SERIES".equals(rule.getCondition())) {
                // 检查时间序列的连续性和合理性
                String sql = String.format(
                    "SELECT COUNT(*) FROM %s.%s WHERE %s IS NOT NULL AND %s <= NOW() AND %s >= DATE_SUB(NOW(), INTERVAL 10 YEAR)",
                    dataSource, rule.getSourceTable(),
                    rule.getSourceField(), rule.getSourceField(), rule.getSourceField()
                );
                
                Long validRecords = jdbcTemplate.queryForObject(sql, Long.class);
                double basicScore = validRecords != null ? (double) validRecords / totalRecords : 0.0;
                
                // 检查时间序列的间隔合理性
                double intervalScore = checkTimeIntervalConsistency(dataSource, rule);
                
                return (basicScore + intervalScore) / 2.0;
            }
            
            return 1.0;
            
        } catch (Exception e) {
            log.error("时间序列一致性检查失败: {}", rule.getDescription(), e);
            return 0.0;
        }
    }

    /**
     * 检查时间间隔一致性
     */
    private double checkTimeIntervalConsistency(String dataSource, ConsistencyRule rule) {
        try {
            // 检查相邻记录的时间间隔是否合理（假设应该是规律的间隔）
            String sql = String.format(
                "SELECT AVG(time_diff) as avg_interval, STDDEV(time_diff) as std_interval FROM (" +
                "SELECT TIMESTAMPDIFF(MINUTE, LAG(%s) OVER (ORDER BY %s), %s) as time_diff " +
                "FROM %s.%s WHERE %s IS NOT NULL" +
                ") t WHERE time_diff IS NOT NULL AND time_diff > 0",
                rule.getSourceField(), rule.getSourceField(), rule.getSourceField(),
                dataSource, rule.getSourceTable(), rule.getSourceField()
            );
            
            Map<String, Object> result = jdbcTemplate.queryForMap(sql);
            Double avgInterval = (Double) result.get("avg_interval");
            Double stdInterval = (Double) result.get("std_interval");
            
            if (avgInterval == null || stdInterval == null) {
                return 1.0;
            }
            
            // 如果标准差相对于平均值较小，说明间隔比较一致
            double coefficient = stdInterval / avgInterval;
            return Math.max(0.0, 1.0 - coefficient); // 变异系数越小，一致性越好
            
        } catch (Exception e) {
            log.error("时间间隔一致性检查失败", e);
            return 1.0;
        }
    }

    /**
     * 检查逻辑一致性
     */
    private double checkLogicalConsistency(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            String condition = rule.getCondition();
            
            switch (condition) {
                case "LOGICAL_RANGE":
                    return checkLogicalRange(dataSource, rule, totalRecords);
                case "CALCULATION":
                    return checkCalculationConsistency(dataSource, rule, totalRecords);
                case "STATUS_LOGIC":
                    return checkStatusLogic(dataSource, rule, totalRecords);
                case "ENTERPRISE_LOGIC":
                    return checkEnterpriseLogic(dataSource, rule, totalRecords);
                default:
                    return 1.0;
            }
            
        } catch (Exception e) {
            log.error("逻辑一致性检查失败: {}", rule.getDescription(), e);
            return 0.0;
        }
    }

    /**
     * 检查逻辑范围一致性
     */
    private double checkLogicalRange(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            // 检查能源值是否在逻辑合理范围内，并且相邻值变化不会过于剧烈
            String sql = String.format(
                "SELECT COUNT(*) FROM (" +
                "SELECT *, LAG(%s) OVER (PARTITION BY device_id ORDER BY timestamp) as prev_value " +
                "FROM %s.%s WHERE %s IS NOT NULL" +
                ") t WHERE %s >= 0 AND (%s IS NULL OR ABS(%s - %s) / %s <= 2.0)",
                rule.getSourceField(),
                dataSource, rule.getSourceTable(), rule.getSourceField(),
                rule.getSourceField(), "prev_value", rule.getSourceField(), "prev_value", "prev_value"
            );
            
            Long validRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return validRecords != null ? (double) validRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("逻辑范围检查失败", e);
            return 0.0;
        }
    }

    /**
     * 检查计算一致性
     */
    private double checkCalculationConsistency(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            // 检查排放值计算是否一致：emission_value * emission_factor ≈ calculated_emission
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE ABS(emission_value * emission_factor - calculated_emission) / calculated_emission <= 0.01",
                dataSource, rule.getSourceTable()
            );
            
            Long validRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return validRecords != null ? (double) validRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("计算一致性检查失败", e);
            return 0.0;
        }
    }

    /**
     * 检查状态逻辑一致性
     */
    private double checkStatusLogic(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            // 检查设备状态逻辑：维护中的设备不应该是在线状态
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE NOT (status = 'online' AND last_maintenance > DATE_SUB(NOW(), INTERVAL 1 DAY))",
                dataSource, rule.getSourceTable()
            );
            
            Long validRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return validRecords != null ? (double) validRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("状态逻辑检查失败", e);
            return 0.0;
        }
    }

    /**
     * 检查企业逻辑一致性
     */
    private double checkEnterpriseLogic(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            // 检查企业状态逻辑：注册时间应该早于当前时间，状态应该合理
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s WHERE registration_time <= NOW() AND status IN ('active', 'inactive', 'suspended')",
                dataSource, rule.getSourceTable()
            );
            
            Long validRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return validRecords != null ? (double) validRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("企业逻辑检查失败", e);
            return 0.0;
        }
    }

    /**
     * 检查跨表一致性
     */
    private double checkCrossTableConsistency(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            String condition = rule.getCondition();
            
            switch (condition) {
                case "CORRELATION":
                    return checkDataCorrelation(dataSource, rule, totalRecords);
                case "MAPPING":
                    return checkDataMapping(dataSource, rule, totalRecords);
                case "OWNERSHIP":
                    return checkOwnershipConsistency(dataSource, rule, totalRecords);
                default:
                    return 1.0;
            }
            
        } catch (Exception e) {
            log.error("跨表一致性检查失败: {}", rule.getDescription(), e);
            return 0.0;
        }
    }

    /**
     * 检查数据关联性
     */
    private double checkDataCorrelation(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            // 检查能源消耗和碳排放数据的时间关联性
            String[] sourceFields = rule.getSourceField().split(",");
            String[] targetFields = rule.getTargetField().split(",");
            
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s s WHERE EXISTS (" +
                "SELECT 1 FROM %s.%s t WHERE s.%s = t.%s AND ABS(TIMESTAMPDIFF(MINUTE, s.%s, t.%s)) <= 60" +
                ")",
                dataSource, rule.getSourceTable(),
                dataSource, rule.getTargetTable(),
                sourceFields[0], targetFields[0], sourceFields[1], targetFields[1]
            );
            
            Long correlatedRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return correlatedRecords != null ? (double) correlatedRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("数据关联性检查失败", e);
            return 0.0;
        }
    }

    /**
     * 检查数据映射一致性
     */
    private double checkDataMapping(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            // 检查排放源与设备的映射关系
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s s WHERE EXISTS (" +
                "SELECT 1 FROM %s.%s t WHERE s.%s = t.%s OR s.%s LIKE CONCAT('%%', t.%s, '%%')" +
                ")",
                dataSource, rule.getSourceTable(),
                dataSource, rule.getTargetTable(),
                rule.getSourceField(), rule.getTargetField(),
                rule.getSourceField(), rule.getTargetField()
            );
            
            Long mappedRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return mappedRecords != null ? (double) mappedRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("数据映射检查失败", e);
            return 0.0;
        }
    }

    /**
     * 检查所有权一致性
     */
    private double checkOwnershipConsistency(String dataSource, ConsistencyRule rule, long totalRecords) {
        try {
            // 检查企业与设备的所有权关系
            String sql = String.format(
                "SELECT COUNT(*) FROM %s.%s s WHERE EXISTS (" +
                "SELECT 1 FROM %s.%s t WHERE s.%s = t.%s" +
                ")",
                dataSource, rule.getSourceTable(),
                dataSource, rule.getTargetTable(),
                rule.getSourceField(), rule.getTargetField()
            );
            
            Long ownedRecords = jdbcTemplate.queryForObject(sql, Long.class);
            return ownedRecords != null ? (double) ownedRecords / totalRecords : 0.0;
            
        } catch (Exception e) {
            log.error("所有权一致性检查失败", e);
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
     * 获取一致性检查规则
     */
    private List<ConsistencyRule> getConsistencyRules(String tableName) {
        return CONSISTENCY_RULES.getOrDefault(tableName, new ArrayList<>());
    }

    /**
     * 默认一致性检查
     */
    private double performDefaultConsistencyCheck(String dataSource, String tableName) {
        try {
            // 简单的默认一致性检查：检查是否有重复记录
            String sql = String.format(
                "SELECT COUNT(DISTINCT *) as distinct_count, COUNT(*) as total_count FROM %s.%s",
                dataSource, tableName
            );
            
            Map<String, Object> result = jdbcTemplate.queryForMap(sql);
            Long distinctCount = ((Number) result.get("distinct_count")).longValue();
            Long totalCount = ((Number) result.get("total_count")).longValue();
            
            return totalCount > 0 ? (double) distinctCount / totalCount : 0.0;
            
        } catch (Exception e) {
            log.error("默认一致性检查失败", e);
            return 0.0;
        }
    }

    /**
     * 记录一致性检查详细信息
     */
    private void logConsistencyDetails(String tableName, Map<String, Double> ruleScores, double finalScore) {
        log.info("表 {} 一致性检查结果:", tableName);
        log.info("  最终一致性评分: {:.2%}", finalScore);
        
        for (Map.Entry<String, Double> entry : ruleScores.entrySet()) {
            String rule = entry.getKey();
            Double score = entry.getValue();
            String status = score >= 0.98 ? "优秀" : score >= 0.95 ? "良好" : score >= 0.90 ? "一般" : "较差";
            log.info("  规则 {}: {:.2%} ({})", rule, score, status);
        }
    }

    /**
     * 获取一致性检查详细报告
     */
    public Map<String, Object> getConsistencyReport(String dataSource, String tableName) {
        Map<String, Object> report = new HashMap<>();
        
        try {
            long totalRecords = getTotalRecords(dataSource, tableName);
            List<ConsistencyRule> rules = getConsistencyRules(tableName);
            
            Map<String, Object> ruleDetails = new HashMap<>();
            double totalWeightedScore = 0.0;
            double totalWeight = 0.0;
            
            for (ConsistencyRule rule : rules) {
                double ruleScore = executeConsistencyRule(dataSource, rule, totalRecords);
                long consistentRecords = (long) (ruleScore * totalRecords);
                long inconsistentRecords = totalRecords - consistentRecords;
                
                Map<String, Object> ruleInfo = new HashMap<>();
                ruleInfo.put("rule_type", rule.getRuleType());
                ruleInfo.put("description", rule.getDescription());
                ruleInfo.put("consistency_score", ruleScore);
                ruleInfo.put("weight", rule.getWeight());
                ruleInfo.put("total_records", totalRecords);
                ruleInfo.put("consistent_records", consistentRecords);
                ruleInfo.put("inconsistent_records", inconsistentRecords);
                ruleInfo.put("inconsistent_percentage", (double) inconsistentRecords / totalRecords);
                
                ruleDetails.put(rule.getDescription(), ruleInfo);
                totalWeightedScore += ruleScore * rule.getWeight();
                totalWeight += rule.getWeight();
            }
            
            double finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0.0;
            
            report.put("table_name", tableName);
            report.put("data_source", dataSource);
            report.put("total_records", totalRecords);
            report.put("overall_consistency", finalScore);
            report.put("rule_details", ruleDetails);
            report.put("check_time", new Date());
            
        } catch (Exception e) {
            log.error("生成一致性报告失败", e);
            report.put("error", e.getMessage());
        }
        
        return report;
    }

    /**
     * 添加或更新一致性规则
     */
    public void updateConsistencyRules(String tableName, List<ConsistencyRule> rules) {
        CONSISTENCY_RULES.put(tableName, new ArrayList<>(rules));
        log.info("更新表 {} 的一致性规则，共 {} 条规则", tableName, rules.size());
    }

    /**
     * 批量检查多个表的一致性
     */
    public Map<String, Double> batchCheckConsistency(String dataSource, List<String> tableNames) {
        Map<String, Double> results = new HashMap<>();
        
        for (String tableName : tableNames) {
            try {
                double score = checkConsistency(dataSource, tableName);
                results.put(tableName, score);
            } catch (Exception e) {
                log.error("批量检查表 {} 一致性失败", tableName, e);
                results.put(tableName, 0.0);
            }
        }
        
        return results;
    }

    /**
     * 获取一致性问题详情
     */
    public List<Map<String, Object>> getConsistencyIssues(String dataSource, String tableName) {
        List<Map<String, Object>> issues = new ArrayList<>();
        
        try {
            List<ConsistencyRule> rules = getConsistencyRules(tableName);
            
            for (ConsistencyRule rule : rules) {
                List<Map<String, Object>> ruleIssues = findRuleViolations(dataSource, rule);
                issues.addAll(ruleIssues);
            }
            
        } catch (Exception e) {
            log.error("获取一致性问题失败", e);
        }
        
        return issues;
    }

    /**
     * 查找规则违反情况
     */
    private List<Map<String, Object>> findRuleViolations(String dataSource, ConsistencyRule rule) {
        List<Map<String, Object>> violations = new ArrayList<>();
        
        try {
            // 根据规则类型构建查询违反记录的SQL
            String sql = buildViolationQuery(dataSource, rule);
            if (sql != null && !sql.isEmpty()) {
                List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
                
                for (Map<String, Object> result : results) {
                    Map<String, Object> violation = new HashMap<>(result);
                    violation.put("rule_description", rule.getDescription());
                    violation.put("rule_type", rule.getRuleType());
                    violation.put("severity", determineSeverity(rule));
                    violations.add(violation);
                }
            }
            
        } catch (Exception e) {
            log.error("查找规则违反情况失败: {}", rule.getDescription(), e);
        }
        
        return violations;
    }

    /**
     * 构建违反查询SQL
     */
    private String buildViolationQuery(String dataSource, ConsistencyRule rule) {
        switch (rule.getRuleType()) {
            case "referential":
                return String.format(
                    "SELECT s.* FROM %s.%s s WHERE NOT EXISTS (SELECT 1 FROM %s.%s t WHERE s.%s = t.%s) LIMIT 100",
                    dataSource, rule.getSourceTable(),
                    dataSource, rule.getTargetTable(),
                    rule.getSourceField(), rule.getTargetField()
                );
            case "logical":
                if ("LOGICAL_RANGE".equals(rule.getCondition())) {
                    return String.format(
                        "SELECT * FROM %s.%s WHERE %s < 0 OR %s > 1000000 LIMIT 100",
                        dataSource, rule.getSourceTable(),
                        rule.getSourceField(), rule.getSourceField()
                    );
                }
                break;
            default:
                return null;
        }
        return null;
    }

    /**
     * 确定违反严重程度
     */
    private String determineSeverity(ConsistencyRule rule) {
        if (rule.getWeight() >= 0.4) {
            return "HIGH";
        } else if (rule.getWeight() >= 0.2) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }
}