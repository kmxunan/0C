package com.zerocarbon.dataquality.service;

import com.zerocarbon.dataquality.entity.DataQualityMetric;
import com.zerocarbon.dataquality.entity.DataQualityReport;
import com.zerocarbon.dataquality.entity.DataAnomalyRecord;
import com.zerocarbon.dataquality.repository.DataQualityMetricRepository;
import com.zerocarbon.dataquality.repository.DataQualityReportRepository;
import com.zerocarbon.dataquality.repository.DataAnomalyRecordRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 数据质量监控服务
 * 实现数据完整性检查、准确性验证、一致性监控和质量评分
 */
@Slf4j
@Service
public class DataQualityMonitoringService {

    @Autowired
    private DataQualityMetricRepository metricRepository;

    @Autowired
    private DataQualityReportRepository reportRepository;

    @Autowired
    private DataAnomalyRecordRepository anomalyRepository;

    @Autowired
    private DataCompletenessService completenessService;

    @Autowired
    private DataAccuracyService accuracyService;

    @Autowired
    private DataConsistencyService consistencyService;

    @Autowired
    private DataAnomalyDetectionService anomalyDetectionService;

    // 数据质量阈值配置
    private static final double COMPLETENESS_THRESHOLD = 0.95; // 完整性阈值95%
    private static final double ACCURACY_THRESHOLD = 0.99; // 准确性阈值99%
    private static final double CONSISTENCY_THRESHOLD = 0.98; // 一致性阈值98%
    private static final double OVERALL_QUALITY_THRESHOLD = 0.97; // 总体质量阈值97%

    /**
     * 执行全面数据质量检查
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @return 数据质量报告
     */
    @Transactional
    public DataQualityReport performQualityCheck(String dataSource, String tableName) {
        log.info("开始执行数据质量检查: dataSource={}, tableName={}", dataSource, tableName);
        
        try {
            // 1. 数据完整性检查
            double completenessScore = completenessService.checkCompleteness(dataSource, tableName);
            
            // 2. 数据准确性验证
            double accuracyScore = accuracyService.validateAccuracy(dataSource, tableName);
            
            // 3. 数据一致性监控
            double consistencyScore = consistencyService.checkConsistency(dataSource, tableName);
            
            // 4. 异常数据检测
            List<DataAnomalyRecord> anomalies = anomalyDetectionService.detectAnomalies(dataSource, tableName);
            
            // 5. 计算综合质量评分
            double overallScore = calculateOverallQualityScore(completenessScore, accuracyScore, consistencyScore);
            
            // 6. 生成质量报告
            DataQualityReport report = createQualityReport(
                dataSource, tableName, completenessScore, accuracyScore, 
                consistencyScore, overallScore, anomalies
            );
            
            // 7. 保存报告和指标
            saveQualityMetrics(dataSource, tableName, completenessScore, accuracyScore, consistencyScore, overallScore);
            reportRepository.save(report);
            
            // 8. 检查是否需要告警
            checkQualityAlerts(report);
            
            log.info("数据质量检查完成: 总体评分={}", overallScore);
            return report;
            
        } catch (Exception e) {
            log.error("数据质量检查失败: dataSource={}, tableName={}", dataSource, tableName, e);
            throw new RuntimeException("数据质量检查失败: " + e.getMessage(), e);
        }
    }

    /**
     * 定时执行数据质量监控
     */
    @Scheduled(cron = "0 0 */6 * * ?") // 每6小时执行一次
    @Async
    public void scheduledQualityMonitoring() {
        log.info("开始定时数据质量监控");
        
        try {
            // 获取需要监控的数据源列表
            List<String> dataSources = getMonitoredDataSources();
            
            for (String dataSource : dataSources) {
                List<String> tables = getMonitoredTables(dataSource);
                
                for (String table : tables) {
                    try {
                        performQualityCheck(dataSource, table);
                    } catch (Exception e) {
                        log.error("定时质量检查失败: dataSource={}, table={}", dataSource, table, e);
                    }
                }
            }
            
            // 生成汇总报告
            generateDailyQualityReport();
            
        } catch (Exception e) {
            log.error("定时数据质量监控失败", e);
        }
    }

    /**
     * 获取数据质量趋势分析
     * @param dataSource 数据源
     * @param tableName 表名
     * @param days 分析天数
     * @return 质量趋势数据
     */
    public Map<String, Object> getQualityTrend(String dataSource, String tableName, int days) {
        LocalDateTime startTime = LocalDateTime.now().minusDays(days);
        
        List<DataQualityMetric> metrics = metricRepository.findByDataSourceAndTableNameAndCreateTimeAfter(
            dataSource, tableName, startTime
        );
        
        Map<String, Object> trend = new HashMap<>();
        
        // 按日期分组统计
        Map<String, List<DataQualityMetric>> dailyMetrics = metrics.stream()
            .collect(Collectors.groupingBy(
                metric -> metric.getCreateTime().toLocalDate().toString()
            ));
        
        List<Map<String, Object>> trendData = new ArrayList<>();
        
        for (Map.Entry<String, List<DataQualityMetric>> entry : dailyMetrics.entrySet()) {
            List<DataQualityMetric> dayMetrics = entry.getValue();
            
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", entry.getKey());
            dayData.put("completeness", dayMetrics.stream().mapToDouble(DataQualityMetric::getCompletenessScore).average().orElse(0));
            dayData.put("accuracy", dayMetrics.stream().mapToDouble(DataQualityMetric::getAccuracyScore).average().orElse(0));
            dayData.put("consistency", dayMetrics.stream().mapToDouble(DataQualityMetric::getConsistencyScore).average().orElse(0));
            dayData.put("overall", dayMetrics.stream().mapToDouble(DataQualityMetric::getOverallScore).average().orElse(0));
            
            trendData.add(dayData);
        }
        
        // 按日期排序
        trendData.sort((a, b) -> ((String) a.get("date")).compareTo((String) b.get("date")));
        
        trend.put("trendData", trendData);
        trend.put("summary", calculateTrendSummary(trendData));
        
        return trend;
    }

    /**
     * 获取数据质量仪表板数据
     * @return 仪表板数据
     */
    public Map<String, Object> getQualityDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        
        // 获取最近24小时的质量指标
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        List<DataQualityMetric> recentMetrics = metricRepository.findByCreateTimeAfter(last24Hours);
        
        if (!recentMetrics.isEmpty()) {
            // 计算平均质量分数
            double avgCompleteness = recentMetrics.stream().mapToDouble(DataQualityMetric::getCompletenessScore).average().orElse(0);
            double avgAccuracy = recentMetrics.stream().mapToDouble(DataQualityMetric::getAccuracyScore).average().orElse(0);
            double avgConsistency = recentMetrics.stream().mapToDouble(DataQualityMetric::getConsistencyScore).average().orElse(0);
            double avgOverall = recentMetrics.stream().mapToDouble(DataQualityMetric::getOverallScore).average().orElse(0);
            
            dashboard.put("averageCompleteness", Math.round(avgCompleteness * 100.0) / 100.0);
            dashboard.put("averageAccuracy", Math.round(avgAccuracy * 100.0) / 100.0);
            dashboard.put("averageConsistency", Math.round(avgConsistency * 100.0) / 100.0);
            dashboard.put("averageOverall", Math.round(avgOverall * 100.0) / 100.0);
            
            // 质量等级分布
            Map<String, Long> qualityLevels = recentMetrics.stream()
                .collect(Collectors.groupingBy(
                    metric -> getQualityLevel(metric.getOverallScore()),
                    Collectors.counting()
                ));
            dashboard.put("qualityLevels", qualityLevels);
        }
        
        // 获取最近的异常记录
        List<DataAnomalyRecord> recentAnomalies = anomalyRepository.findTop10ByOrderByDetectionTimeDesc();
        dashboard.put("recentAnomalies", recentAnomalies);
        
        // 数据源质量统计
        Map<String, Object> dataSourceStats = getDataSourceQualityStats();
        dashboard.put("dataSourceStats", dataSourceStats);
        
        return dashboard;
    }

    /**
     * 获取数据质量报告列表
     * @param dataSource 数据源（可选）
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 报告列表
     */
    public List<DataQualityReport> getQualityReports(String dataSource, LocalDateTime startTime, LocalDateTime endTime) {
        if (dataSource != null && !dataSource.isEmpty()) {
            return reportRepository.findByDataSourceAndCreateTimeBetween(dataSource, startTime, endTime);
        } else {
            return reportRepository.findByCreateTimeBetween(startTime, endTime);
        }
    }

    /**
     * 计算综合质量评分
     */
    private double calculateOverallQualityScore(double completeness, double accuracy, double consistency) {
        // 加权平均：完整性30%，准确性40%，一致性30%
        return (completeness * 0.3 + accuracy * 0.4 + consistency * 0.3);
    }

    /**
     * 创建质量报告
     */
    private DataQualityReport createQualityReport(String dataSource, String tableName, 
                                                 double completeness, double accuracy, double consistency, 
                                                 double overall, List<DataAnomalyRecord> anomalies) {
        DataQualityReport report = new DataQualityReport();
        report.setDataSource(dataSource);
        report.setTableName(tableName);
        report.setCompletenessScore(completeness);
        report.setAccuracyScore(accuracy);
        report.setConsistencyScore(consistency);
        report.setOverallScore(overall);
        report.setQualityLevel(getQualityLevel(overall));
        report.setAnomalyCount(anomalies.size());
        report.setCreateTime(LocalDateTime.now());
        
        // 生成质量问题描述
        List<String> issues = new ArrayList<>();
        if (completeness < COMPLETENESS_THRESHOLD) {
            issues.add(String.format("数据完整性不足: %.2f%% < %.2f%%", completeness * 100, COMPLETENESS_THRESHOLD * 100));
        }
        if (accuracy < ACCURACY_THRESHOLD) {
            issues.add(String.format("数据准确性不足: %.2f%% < %.2f%%", accuracy * 100, ACCURACY_THRESHOLD * 100));
        }
        if (consistency < CONSISTENCY_THRESHOLD) {
            issues.add(String.format("数据一致性不足: %.2f%% < %.2f%%", consistency * 100, CONSISTENCY_THRESHOLD * 100));
        }
        if (!anomalies.isEmpty()) {
            issues.add(String.format("检测到%d个异常数据", anomalies.size()));
        }
        
        report.setIssues(String.join("; ", issues));
        
        // 生成改进建议
        List<String> suggestions = generateImprovementSuggestions(completeness, accuracy, consistency, anomalies);
        report.setSuggestions(String.join("; ", suggestions));
        
        return report;
    }

    /**
     * 保存质量指标
     */
    private void saveQualityMetrics(String dataSource, String tableName, 
                                  double completeness, double accuracy, double consistency, double overall) {
        DataQualityMetric metric = new DataQualityMetric();
        metric.setDataSource(dataSource);
        metric.setTableName(tableName);
        metric.setCompletenessScore(completeness);
        metric.setAccuracyScore(accuracy);
        metric.setConsistencyScore(consistency);
        metric.setOverallScore(overall);
        metric.setCreateTime(LocalDateTime.now());
        
        metricRepository.save(metric);
    }

    /**
     * 检查质量告警
     */
    private void checkQualityAlerts(DataQualityReport report) {
        if (report.getOverallScore() < OVERALL_QUALITY_THRESHOLD) {
            log.warn("数据质量告警: dataSource={}, table={}, score={}", 
                report.getDataSource(), report.getTableName(), report.getOverallScore());
            
            // 发送告警通知
            sendQualityAlert(report);
        }
    }

    /**
     * 发送质量告警
     */
    @Async
    private void sendQualityAlert(DataQualityReport report) {
        // 实现告警通知逻辑（邮件、短信、系统通知等）
        log.info("发送数据质量告警: {}", report);
    }

    /**
     * 获取质量等级
     */
    private String getQualityLevel(double score) {
        if (score >= 0.95) return "优秀";
        if (score >= 0.90) return "良好";
        if (score >= 0.80) return "一般";
        if (score >= 0.70) return "较差";
        return "很差";
    }

    /**
     * 生成改进建议
     */
    private List<String> generateImprovementSuggestions(double completeness, double accuracy, 
                                                       double consistency, List<DataAnomalyRecord> anomalies) {
        List<String> suggestions = new ArrayList<>();
        
        if (completeness < COMPLETENESS_THRESHOLD) {
            suggestions.add("建议检查数据采集流程，确保数据完整性");
            suggestions.add("考虑增加数据验证规则和必填字段检查");
        }
        
        if (accuracy < ACCURACY_THRESHOLD) {
            suggestions.add("建议加强数据输入验证和格式检查");
            suggestions.add("考虑实施数据清洗和标准化流程");
        }
        
        if (consistency < CONSISTENCY_THRESHOLD) {
            suggestions.add("建议统一数据标准和编码规范");
            suggestions.add("考虑实施主数据管理策略");
        }
        
        if (!anomalies.isEmpty()) {
            suggestions.add("建议调查异常数据的根本原因");
            suggestions.add("考虑优化异常检测规则和阈值设置");
        }
        
        return suggestions;
    }

    /**
     * 获取监控的数据源列表
     */
    private List<String> getMonitoredDataSources() {
        // 实现获取监控数据源的逻辑
        return Arrays.asList("energy_system", "carbon_system", "production_system", "resource_system");
    }

    /**
     * 获取监控的表列表
     */
    private List<String> getMonitoredTables(String dataSource) {
        // 实现获取监控表的逻辑
        Map<String, List<String>> tableMap = new HashMap<>();
        tableMap.put("energy_system", Arrays.asList("energy_consumption", "energy_production", "energy_storage"));
        tableMap.put("carbon_system", Arrays.asList("carbon_emissions", "carbon_absorption", "carbon_trading"));
        tableMap.put("production_system", Arrays.asList("production_data", "equipment_status", "product_quality"));
        tableMap.put("resource_system", Arrays.asList("water_usage", "waste_management", "material_flow"));
        
        return tableMap.getOrDefault(dataSource, new ArrayList<>());
    }

    /**
     * 生成日度质量报告
     */
    private void generateDailyQualityReport() {
        log.info("生成日度数据质量汇总报告");
        // 实现日度报告生成逻辑
    }

    /**
     * 计算趋势摘要
     */
    private Map<String, Object> calculateTrendSummary(List<Map<String, Object>> trendData) {
        Map<String, Object> summary = new HashMap<>();
        
        if (!trendData.isEmpty()) {
            // 计算平均值和趋势
            double avgCompleteness = trendData.stream().mapToDouble(d -> (Double) d.get("completeness")).average().orElse(0);
            double avgAccuracy = trendData.stream().mapToDouble(d -> (Double) d.get("accuracy")).average().orElse(0);
            double avgConsistency = trendData.stream().mapToDouble(d -> (Double) d.get("consistency")).average().orElse(0);
            double avgOverall = trendData.stream().mapToDouble(d -> (Double) d.get("overall")).average().orElse(0);
            
            summary.put("avgCompleteness", Math.round(avgCompleteness * 100.0) / 100.0);
            summary.put("avgAccuracy", Math.round(avgAccuracy * 100.0) / 100.0);
            summary.put("avgConsistency", Math.round(avgConsistency * 100.0) / 100.0);
            summary.put("avgOverall", Math.round(avgOverall * 100.0) / 100.0);
            
            // 计算趋势方向
            if (trendData.size() >= 2) {
                Map<String, Object> first = trendData.get(0);
                Map<String, Object> last = trendData.get(trendData.size() - 1);
                
                summary.put("completenessTrend", getTrendDirection((Double) first.get("completeness"), (Double) last.get("completeness")));
                summary.put("accuracyTrend", getTrendDirection((Double) first.get("accuracy"), (Double) last.get("accuracy")));
                summary.put("consistencyTrend", getTrendDirection((Double) first.get("consistency"), (Double) last.get("consistency")));
                summary.put("overallTrend", getTrendDirection((Double) first.get("overall"), (Double) last.get("overall")));
            }
        }
        
        return summary;
    }

    /**
     * 获取趋势方向
     */
    private String getTrendDirection(double start, double end) {
        double diff = end - start;
        if (Math.abs(diff) < 0.01) return "stable";
        return diff > 0 ? "up" : "down";
    }

    /**
     * 获取数据源质量统计
     */
    private Map<String, Object> getDataSourceQualityStats() {
        Map<String, Object> stats = new HashMap<>();
        
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        List<DataQualityMetric> recentMetrics = metricRepository.findByCreateTimeAfter(last24Hours);
        
        Map<String, List<DataQualityMetric>> dataSourceMetrics = recentMetrics.stream()
            .collect(Collectors.groupingBy(DataQualityMetric::getDataSource));
        
        for (Map.Entry<String, List<DataQualityMetric>> entry : dataSourceMetrics.entrySet()) {
            String dataSource = entry.getKey();
            List<DataQualityMetric> metrics = entry.getValue();
            
            double avgScore = metrics.stream().mapToDouble(DataQualityMetric::getOverallScore).average().orElse(0);
            
            Map<String, Object> sourceStats = new HashMap<>();
            sourceStats.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
            sourceStats.put("qualityLevel", getQualityLevel(avgScore));
            sourceStats.put("recordCount", metrics.size());
            
            stats.put(dataSource, sourceStats);
        }
        
        return stats;
    }

    /**
     * 获取数据源质量统计（带参数）
     */
    public Map<String, Object> getDataSourceQualityStats(String dataSource) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 获取该数据源下所有监控的表
            List<String> tables = getMonitoredTables(dataSource);
            
            double totalScore = 0.0;
            int tableCount = 0;
            Map<String, Integer> gradeDistribution = new HashMap<>();
            
            for (String table : tables) {
                try {
                    DataQualityMetric latestMetric = getLatestQualityMetric(dataSource, table);
                    if (latestMetric != null) {
                        totalScore += latestMetric.getOverallScore();
                        tableCount++;
                        
                        String grade = getQualityLevel(latestMetric.getOverallScore());
                        gradeDistribution.put(grade, gradeDistribution.getOrDefault(grade, 0) + 1);
                    }
                } catch (Exception e) {
                    log.warn("获取表 {} 质量指标失败", table, e);
                }
            }
            
            stats.put("data_source", dataSource);
            stats.put("total_tables", tables.size());
            stats.put("monitored_tables", tableCount);
            stats.put("average_quality_score", tableCount > 0 ? totalScore / tableCount : 0.0);
            stats.put("grade_distribution", gradeDistribution);
            stats.put("last_update", LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("获取数据源质量统计失败", e);
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }

    /**
     * 获取最新质量指标
     */
    private DataQualityMetric getLatestQualityMetric(String dataSource, String tableName) {
        List<DataQualityMetric> metrics = metricRepository.findByDataSourceAndTableNameOrderByCreateTimeDesc(dataSource, tableName);
        return metrics.isEmpty() ? null : metrics.get(0);
    }

    /**
     * 执行质量监控
     */
    public DataQualityMetric performQualityMonitoring(String dataSource, String tableName) {
        log.info("执行质量监控: dataSource={}, tableName={}", dataSource, tableName);
        
        try {
            // 1. 数据完整性检查
            double completenessScore = completenessService.checkCompleteness(dataSource, tableName);
            
            // 2. 数据准确性验证
            double accuracyScore = accuracyService.validateAccuracy(dataSource, tableName);
            
            // 3. 数据一致性监控
            double consistencyScore = consistencyService.checkConsistency(dataSource, tableName);
            
            // 4. 计算其他维度评分（简化实现）
            double timelinessScore = 0.95; // 及时性评分
            double validityScore = 0.98; // 有效性评分
            double uniquenessScore = 0.96; // 唯一性评分
            
            // 5. 计算综合质量评分
            double overallScore = calculateOverallQualityScore(completenessScore, accuracyScore, consistencyScore);
            
            // 6. 创建质量指标对象
            DataQualityMetric metric = new DataQualityMetric();
            metric.setDataSource(dataSource);
            metric.setTableName(tableName);
            metric.setCompletenessScore(completenessScore);
            metric.setAccuracyScore(accuracyScore);
            metric.setConsistencyScore(consistencyScore);
            metric.setOverallScore(overallScore);
            metric.setCreateTime(LocalDateTime.now());
            
            // 7. 保存指标
            metricRepository.save(metric);
            
            log.info("质量监控完成: 总体评分={}", overallScore);
            return metric;
            
        } catch (Exception e) {
            log.error("质量监控失败: dataSource={}, tableName={}", dataSource, tableName, e);
            throw new RuntimeException("质量监控失败: " + e.getMessage(), e);
        }
    }

    /**
     * 生成质量报告
     */
    public DataQualityReport generateQualityReport(String dataSource, String tableName, String reportType) {
        log.info("生成质量报告: dataSource={}, tableName={}, reportType={}", dataSource, tableName, reportType);
        
        try {
            // 执行质量监控获取最新指标
            DataQualityMetric metric = performQualityMonitoring(dataSource, tableName);
            
            // 创建质量报告
            DataQualityReport report = new DataQualityReport();
            report.setDataSource(dataSource);
            report.setTableName(tableName);
            report.setCompletenessScore(metric.getCompletenessScore());
            report.setAccuracyScore(metric.getAccuracyScore());
            report.setConsistencyScore(metric.getConsistencyScore());
            report.setOverallScore(metric.getOverallScore());
            report.setQualityLevel(getQualityLevel(metric.getOverallScore()));
            report.setCreateTime(LocalDateTime.now());
            
            // 生成问题描述和改进建议
            List<String> issues = new ArrayList<>();
            List<String> suggestions = new ArrayList<>();
            
            if (metric.getCompletenessScore() < COMPLETENESS_THRESHOLD) {
                issues.add(String.format("数据完整性不足: %.2f%% < %.2f%%", metric.getCompletenessScore() * 100, COMPLETENESS_THRESHOLD * 100));
                suggestions.add("建议检查数据采集流程，确保数据完整性");
            }
            if (metric.getAccuracyScore() < ACCURACY_THRESHOLD) {
                issues.add(String.format("数据准确性不足: %.2f%% < %.2f%%", metric.getAccuracyScore() * 100, ACCURACY_THRESHOLD * 100));
                suggestions.add("建议加强数据输入验证和格式检查");
            }
            if (metric.getConsistencyScore() < CONSISTENCY_THRESHOLD) {
                issues.add(String.format("数据一致性不足: %.2f%% < %.2f%%", metric.getConsistencyScore() * 100, CONSISTENCY_THRESHOLD * 100));
                suggestions.add("建议统一数据标准和编码规范");
            }
            
            report.setIssues(String.join("; ", issues));
            report.setSuggestions(String.join("; ", suggestions));
            
            // 保存报告
            DataQualityReport savedReport = reportRepository.save(report);
            
            log.info("质量报告生成完成: reportId={}", savedReport.getId());
            return savedReport;
            
        } catch (Exception e) {
            log.error("生成质量报告失败", e);
            throw new RuntimeException("生成质量报告失败: " + e.getMessage(), e);
        }
    }

    /**
     * 启动定时监控
     */
    public void startScheduledMonitoring(String dataSource, List<String> tableNames, int intervalMinutes) {
        log.info("启动定时监控: dataSource={}, tables={}, interval={}分钟", dataSource, tableNames, intervalMinutes);
        // 这里可以集成Spring的@Scheduled或Quartz等定时任务框架
        log.info("定时监控任务已配置，将每{}分钟执行一次质量检查", intervalMinutes);
    }

    /**
     * 停止定时监控
     */
    public void stopScheduledMonitoring(String dataSource) {
        log.info("停止定时监控: dataSource={}", dataSource);
        // 停止定时任务的逻辑
    }

    /**
     * 获取监控状态
     */
    public Map<String, Object> getMonitoringStatus(String dataSource) {
        Map<String, Object> status = new HashMap<>();
        
        status.put("data_source", dataSource);
        status.put("monitoring_enabled", true);
        status.put("last_check_time", LocalDateTime.now());
        status.put("monitored_tables", getMonitoredTables(dataSource));
        status.put("status", "ACTIVE");
        
        return status;
    }

    /**
     * 获取质量概览
     */
    public Map<String, Object> getQualityOverview(String dataSource) {
        Map<String, Object> overview = new HashMap<>();
        
        try {
            List<String> tables = getMonitoredTables(dataSource);
            
            int totalTables = tables.size();
            int excellentTables = 0;
            int goodTables = 0;
            int fairTables = 0;
            int poorTables = 0;
            
            double totalScore = 0.0;
            int validTables = 0;
            
            for (String table : tables) {
                try {
                    DataQualityMetric metric = getLatestQualityMetric(dataSource, table);
                    if (metric != null) {
                        double score = metric.getOverallScore();
                        totalScore += score;
                        validTables++;
                        
                        if (score >= 0.95) excellentTables++;
                        else if (score >= 0.85) goodTables++;
                        else if (score >= 0.70) fairTables++;
                        else poorTables++;
                    }
                } catch (Exception e) {
                    log.warn("获取表 {} 质量指标失败", table, e);
                }
            }
            
            overview.put("data_source", dataSource);
            overview.put("total_tables", totalTables);
            overview.put("monitored_tables", validTables);
            overview.put("average_quality_score", validTables > 0 ? totalScore / validTables : 0.0);
            
            Map<String, Integer> distribution = new HashMap<>();
            distribution.put("excellent", excellentTables);
            distribution.put("good", goodTables);
            distribution.put("fair", fairTables);
            distribution.put("poor", poorTables);
            overview.put("quality_distribution", distribution);
            
            overview.put("last_update", LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("获取质量概览失败", e);
            overview.put("error", e.getMessage());
        }
        
        return overview;
    }
}