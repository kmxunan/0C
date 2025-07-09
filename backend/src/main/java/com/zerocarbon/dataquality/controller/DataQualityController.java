package com.zerocarbon.dataquality.controller;

import com.zerocarbon.dataquality.entity.DataQualityMetric;
import com.zerocarbon.dataquality.entity.DataQualityReport;
import com.zerocarbon.dataquality.entity.DataAnomalyRecord;
import com.zerocarbon.dataquality.service.DataQualityMonitoringService;
import com.zerocarbon.dataquality.service.DataAnomalyDetectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据质量监控控制器
 * 提供数据质量监控、异常检测、报告生成等REST API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/data-quality")
@CrossOrigin(origins = "*")
public class DataQualityController {

    @Autowired
    private DataQualityMonitoringService monitoringService;
    
    @Autowired
    private DataAnomalyDetectionService anomalyDetectionService;

    /**
     * 执行数据质量监控
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @return 质量监控结果
     */
    @PostMapping("/monitor")
    public ResponseEntity<Map<String, Object>> performQualityMonitoring(
            @RequestParam String dataSource,
            @RequestParam String tableName) {
        
        log.info("执行数据质量监控: dataSource={}, tableName={}", dataSource, tableName);
        
        try {
            DataQualityMetric metric = monitoringService.performQualityMonitoring(dataSource, tableName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "数据质量监控完成");
            response.put("data", metric);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("数据质量监控失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "数据质量监控失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 批量执行数据质量监控
     * @param request 批量监控请求
     * @return 批量监控结果
     */
    @PostMapping("/monitor/batch")
    public ResponseEntity<Map<String, Object>> batchQualityMonitoring(
            @RequestBody Map<String, Object> request) {
        
        log.info("执行批量数据质量监控");
        
        try {
            String dataSource = (String) request.get("dataSource");
            @SuppressWarnings("unchecked")
            List<String> tableNames = (List<String>) request.get("tableNames");
            
            Map<String, DataQualityMetric> results = new HashMap<>();
            
            for (String tableName : tableNames) {
                try {
                    DataQualityMetric metric = monitoringService.performQualityMonitoring(dataSource, tableName);
                    results.put(tableName, metric);
                } catch (Exception e) {
                    log.error("表 {} 质量监控失败", tableName, e);
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("批量监控完成，成功 %d/%d 个表", results.size(), tableNames.size()));
            response.put("data", results);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("批量数据质量监控失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "批量数据质量监控失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取质量趋势数据
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @param days 天数
     * @return 质量趋势数据
     */
    @GetMapping("/trend")
    public ResponseEntity<Map<String, Object>> getQualityTrend(
            @RequestParam String dataSource,
            @RequestParam String tableName,
            @RequestParam(defaultValue = "7") int days) {
        
        log.info("获取质量趋势数据: dataSource={}, tableName={}, days={}", dataSource, tableName, days);
        
        try {
            List<Map<String, Object>> trendData = monitoringService.getQualityTrend(dataSource, tableName, days);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "获取质量趋势数据成功");
            response.put("data", trendData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取质量趋势数据失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取质量趋势数据失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取质量仪表板数据
     * @param dataSource 数据源标识
     * @return 仪表板数据
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getQualityDashboard(
            @RequestParam String dataSource) {
        
        log.info("获取质量仪表板数据: dataSource={}", dataSource);
        
        try {
            Map<String, Object> dashboardData = monitoringService.getDashboardData(dataSource);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "获取仪表板数据成功");
            response.put("data", dashboardData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取仪表板数据失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取仪表板数据失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取质量报告列表
     * @param dataSource 数据源标识
     * @param tableName 表名（可选）
     * @param startTime 开始时间（可选）
     * @param endTime 结束时间（可选）
     * @param page 页码
     * @param size 页大小
     * @return 质量报告列表
     */
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getQualityReports(
            @RequestParam String dataSource,
            @RequestParam(required = false) String tableName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("获取质量报告列表: dataSource={}, tableName={}, page={}, size={}", 
                dataSource, tableName, page, size);
        
        try {
            List<DataQualityReport> reports = monitoringService.getQualityReports(
                dataSource, tableName, startTime, endTime, page, size);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "获取质量报告列表成功");
            response.put("data", reports);
            response.put("page", page);
            response.put("size", size);
            response.put("total", reports.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取质量报告列表失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取质量报告列表失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 生成质量报告
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @param reportType 报告类型
     * @return 生成的质量报告
     */
    @PostMapping("/reports/generate")
    public ResponseEntity<Map<String, Object>> generateQualityReport(
            @RequestParam String dataSource,
            @RequestParam String tableName,
            @RequestParam(defaultValue = "standard") String reportType) {
        
        log.info("生成质量报告: dataSource={}, tableName={}, reportType={}", 
                dataSource, tableName, reportType);
        
        try {
            DataQualityReport report = monitoringService.generateQualityReport(dataSource, tableName, reportType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "质量报告生成成功");
            response.put("data", report);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("生成质量报告失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "生成质量报告失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 执行异常检测
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @return 异常检测结果
     */
    @PostMapping("/anomaly/detect")
    public ResponseEntity<Map<String, Object>> detectAnomalies(
            @RequestParam String dataSource,
            @RequestParam String tableName) {
        
        log.info("执行异常检测: dataSource={}, tableName={}", dataSource, tableName);
        
        try {
            List<DataAnomalyDetectionService.AnomalyResult> anomalies = 
                anomalyDetectionService.detectAnomalies(dataSource, tableName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "异常检测完成");
            response.put("data", anomalies);
            response.put("anomaly_count", anomalies.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("异常检测失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "异常检测失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 批量异常检测
     * @param request 批量检测请求
     * @return 批量检测结果
     */
    @PostMapping("/anomaly/detect/batch")
    public ResponseEntity<Map<String, Object>> batchDetectAnomalies(
            @RequestBody Map<String, Object> request) {
        
        log.info("执行批量异常检测");
        
        try {
            String dataSource = (String) request.get("dataSource");
            @SuppressWarnings("unchecked")
            List<String> tableNames = (List<String>) request.get("tableNames");
            
            Map<String, List<DataAnomalyDetectionService.AnomalyResult>> results = 
                anomalyDetectionService.batchDetectAnomalies(dataSource, tableNames);
            
            int totalAnomalies = results.values().stream()
                .mapToInt(List::size)
                .sum();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("批量异常检测完成，共发现 %d 个异常", totalAnomalies));
            response.put("data", results);
            response.put("total_anomalies", totalAnomalies);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("批量异常检测失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "批量异常检测失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取异常统计信息
     * @param dataSource 数据源标识
     * @param tableName 表名
     * @return 异常统计信息
     */
    @GetMapping("/anomaly/statistics")
    public ResponseEntity<Map<String, Object>> getAnomalyStatistics(
            @RequestParam String dataSource,
            @RequestParam String tableName) {
        
        log.info("获取异常统计信息: dataSource={}, tableName={}", dataSource, tableName);
        
        try {
            Map<String, Object> statistics = anomalyDetectionService.getAnomalyStatistics(dataSource, tableName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "获取异常统计信息成功");
            response.put("data", statistics);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取异常统计信息失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取异常统计信息失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 启动定时监控
     * @param dataSource 数据源标识
     * @param tableNames 表名列表
     * @param intervalMinutes 监控间隔（分钟）
     * @return 启动结果
     */
    @PostMapping("/monitor/schedule")
    public ResponseEntity<Map<String, Object>> startScheduledMonitoring(
            @RequestParam String dataSource,
            @RequestParam List<String> tableNames,
            @RequestParam(defaultValue = "60") int intervalMinutes) {
        
        log.info("启动定时监控: dataSource={}, tables={}, interval={}分钟", 
                dataSource, tableNames, intervalMinutes);
        
        try {
            monitoringService.startScheduledMonitoring(dataSource, tableNames, intervalMinutes);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "定时监控启动成功");
            response.put("data_source", dataSource);
            response.put("table_names", tableNames);
            response.put("interval_minutes", intervalMinutes);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("启动定时监控失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "启动定时监控失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 停止定时监控
     * @param dataSource 数据源标识
     * @return 停止结果
     */
    @PostMapping("/monitor/schedule/stop")
    public ResponseEntity<Map<String, Object>> stopScheduledMonitoring(
            @RequestParam String dataSource) {
        
        log.info("停止定时监控: dataSource={}", dataSource);
        
        try {
            monitoringService.stopScheduledMonitoring(dataSource);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "定时监控停止成功");
            response.put("data_source", dataSource);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("停止定时监控失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "停止定时监控失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取监控状态
     * @param dataSource 数据源标识
     * @return 监控状态
     */
    @GetMapping("/monitor/status")
    public ResponseEntity<Map<String, Object>> getMonitoringStatus(
            @RequestParam String dataSource) {
        
        log.info("获取监控状态: dataSource={}", dataSource);
        
        try {
            Map<String, Object> status = monitoringService.getMonitoringStatus(dataSource);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "获取监控状态成功");
            response.put("data", status);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取监控状态失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取监控状态失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取数据源列表
     * @return 数据源列表
     */
    @GetMapping("/datasources")
    public ResponseEntity<Map<String, Object>> getDataSources() {
        
        log.info("获取数据源列表");
        
        try {
            List<String> dataSources = monitoringService.getMonitoredDataSources();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "获取数据源列表成功");
            response.put("data", dataSources);
            response.put("count", dataSources.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取数据源列表失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取数据源列表失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取表列表
     * @param dataSource 数据源标识
     * @return 表列表
     */
    @GetMapping("/tables")
    public ResponseEntity<Map<String, Object>> getTables(
            @RequestParam String dataSource) {
        
        log.info("获取表列表: dataSource={}", dataSource);
        
        try {
            List<String> tables = monitoringService.getMonitoredTables(dataSource);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "获取表列表成功");
            response.put("data", tables);
            response.put("count", tables.size());
            response.put("data_source", dataSource);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取表列表失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取表列表失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 健康检查
     * @return 健康状态
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "数据质量监控服务运行正常");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "Data Quality Monitoring");
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取质量评分概览
     * @param dataSource 数据源标识
     * @return 质量评分概览
     */
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getQualityOverview(
            @RequestParam String dataSource) {
        
        log.info("获取质量评分概览: dataSource={}", dataSource);
        
        try {
            Map<String, Object> overview = monitoringService.getQualityOverview(dataSource);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "获取质量评分概览成功");
            response.put("data", overview);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取质量评分概览失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取质量评分概览失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}