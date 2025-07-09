package com.zerocarbon.dataquality.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 数据异常记录实体
 * 记录数据质量检查中发现的异常数据
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "data_anomaly_record", indexes = {
    @Index(name = "idx_data_source_table", columnList = "dataSource,tableName"),
    @Index(name = "idx_detection_time", columnList = "detectionTime"),
    @Index(name = "idx_anomaly_type", columnList = "anomalyType"),
    @Index(name = "idx_severity_level", columnList = "severityLevel"),
    @Index(name = "idx_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
public class DataAnomalyRecord {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 异常编号
     */
    @Column(name = "anomaly_code", unique = true, length = 100)
    private String anomalyCode;

    /**
     * 数据源标识
     */
    @Column(name = "data_source", nullable = false, length = 100)
    private String dataSource;

    /**
     * 表名
     */
    @Column(name = "table_name", nullable = false, length = 100)
    private String tableName;

    /**
     * 字段名
     */
    @Column(name = "field_name", length = 100)
    private String fieldName;

    /**
     * 记录主键值
     */
    @Column(name = "record_key", length = 200)
    private String recordKey;

    /**
     * 异常类型
     */
    @Column(name = "anomaly_type", nullable = false, length = 50)
    private String anomalyType;

    /**
     * 异常子类型
     */
    @Column(name = "anomaly_subtype", length = 50)
    private String anomalySubtype;

    /**
     * 严重程度
     */
    @Column(name = "severity_level", nullable = false, length = 20)
    private String severityLevel;

    /**
     * 异常描述
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 异常值
     */
    @Column(name = "anomaly_value", columnDefinition = "TEXT")
    private String anomalyValue;

    /**
     * 期望值
     */
    @Column(name = "expected_value", columnDefinition = "TEXT")
    private String expectedValue;

    /**
     * 异常评分 (0-1，1表示最严重)
     */
    @Column(name = "anomaly_score", precision = 5, scale = 4)
    private Double anomalyScore;

    /**
     * 置信度 (0-1)
     */
    @Column(name = "confidence", precision = 5, scale = 4)
    private Double confidence;

    /**
     * 检测时间
     */
    @Column(name = "detection_time", nullable = false)
    private LocalDateTime detectionTime;

    /**
     * 检测规则
     */
    @Column(name = "detection_rule", length = 200)
    private String detectionRule;

    /**
     * 检测算法
     */
    @Column(name = "detection_algorithm", length = 100)
    private String detectionAlgorithm;

    /**
     * 检测器版本
     */
    @Column(name = "detector_version", length = 20)
    private String detectorVersion;

    /**
     * 数据快照时间
     */
    @Column(name = "snapshot_time")
    private LocalDateTime snapshotTime;

    /**
     * 异常状态
     */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    /**
     * 处理状态
     */
    @Column(name = "handle_status", length = 20)
    private String handleStatus;

    /**
     * 处理人
     */
    @Column(name = "handler", length = 100)
    private String handler;

    /**
     * 处理时间
     */
    @Column(name = "handle_time")
    private LocalDateTime handleTime;

    /**
     * 处理方式
     */
    @Column(name = "handle_method", length = 100)
    private String handleMethod;

    /**
     * 处理结果
     */
    @Column(name = "handle_result", columnDefinition = "TEXT")
    private String handleResult;

    /**
     * 处理备注
     */
    @Column(name = "handle_remarks", columnDefinition = "TEXT")
    private String handleRemarks;

    /**
     * 根本原因分析
     */
    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    /**
     * 影响范围
     */
    @Column(name = "impact_scope", columnDefinition = "TEXT")
    private String impactScope;

    /**
     * 业务影响
     */
    @Column(name = "business_impact", columnDefinition = "TEXT")
    private String businessImpact;

    /**
     * 修复建议
     */
    @Column(name = "fix_suggestion", columnDefinition = "TEXT")
    private String fixSuggestion;

    /**
     * 预防措施
     */
    @Column(name = "prevention_measures", columnDefinition = "TEXT")
    private String preventionMeasures;

    /**
     * 是否已通知
     */
    @Column(name = "notified")
    private Boolean notified;

    /**
     * 通知时间
     */
    @Column(name = "notification_time")
    private LocalDateTime notificationTime;

    /**
     * 通知方式
     */
    @Column(name = "notification_method", length = 100)
    private String notificationMethod;

    /**
     * 关联的质量报告ID
     */
    @Column(name = "report_id")
    private Long reportId;

    /**
     * 关联的质量指标ID
     */
    @Column(name = "metric_id")
    private Long metricId;

    /**
     * 是否为误报
     */
    @Column(name = "false_positive")
    private Boolean falsePositive;

    /**
     * 误报确认人
     */
    @Column(name = "false_positive_confirmer", length = 100)
    private String falsePositiveConfirmer;

    /**
     * 误报确认时间
     */
    @Column(name = "false_positive_time")
    private LocalDateTime falsePositiveTime;

    /**
     * 误报原因
     */
    @Column(name = "false_positive_reason", columnDefinition = "TEXT")
    private String falsePositiveReason;

    /**
     * 扩展属性（JSON格式）
     */
    @Column(name = "extra_properties", columnDefinition = "TEXT")
    private String extraProperties;

    /**
     * 备注
     */
    @Column(name = "remarks", length = 500)
    private String remarks;

    /**
     * 创建时间
     */
    @CreatedDate
    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @LastModifiedDate
    @Column(name = "update_time")
    private LocalDateTime updateTime;

    /**
     * 创建人
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;

    /**
     * 更新人
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    /**
     * 生成异常编号
     */
    public void generateAnomalyCode() {
        if (anomalyCode == null || anomalyCode.isEmpty()) {
            String timestamp = String.valueOf(System.currentTimeMillis());
            String source = dataSource != null ? dataSource.toUpperCase() : "UNKNOWN";
            String type = anomalyType != null ? anomalyType.toUpperCase() : "UNKNOWN";
            this.anomalyCode = String.format("ANO_%s_%s_%s_%s", source, tableName, type, timestamp);
        }
    }

    /**
     * 获取异常等级描述
     */
    public String getSeverityDescription() {
        if (severityLevel == null) {
            return "未知";
        }
        
        switch (severityLevel.toLowerCase()) {
            case "critical":
            case "严重":
                return "严重 - 需要立即处理";
            case "high":
            case "高":
                return "高 - 需要优先处理";
            case "medium":
            case "中":
                return "中 - 需要及时处理";
            case "low":
            case "低":
                return "低 - 可延后处理";
            case "info":
            case "信息":
                return "信息 - 仅供参考";
            default:
                return severityLevel;
        }
    }

    /**
     * 获取异常类型描述
     */
    public String getAnomalyTypeDescription() {
        if (anomalyType == null) {
            return "未知异常";
        }
        
        switch (anomalyType.toLowerCase()) {
            case "missing":
            case "缺失":
                return "数据缺失";
            case "duplicate":
            case "重复":
                return "数据重复";
            case "invalid":
            case "无效":
                return "数据无效";
            case "outlier":
            case "异常值":
                return "异常值";
            case "inconsistent":
            case "不一致":
                return "数据不一致";
            case "format":
            case "格式":
                return "格式错误";
            case "range":
            case "范围":
                return "超出范围";
            case "pattern":
            case "模式":
                return "模式异常";
            case "business_rule":
            case "业务规则":
                return "违反业务规则";
            case "referential":
            case "引用":
                return "引用完整性错误";
            default:
                return anomalyType;
        }
    }

    /**
     * 检查是否需要立即处理
     */
    public boolean needsImmediateAction() {
        return "critical".equalsIgnoreCase(severityLevel) || "严重".equals(severityLevel);
    }

    /**
     * 检查是否已过期（超过7天未处理）
     */
    public boolean isExpired() {
        if (detectionTime == null || isResolved()) {
            return false;
        }
        return detectionTime.isBefore(LocalDateTime.now().minusDays(7));
    }

    /**
     * 检查是否已解决
     */
    public boolean isResolved() {
        return "resolved".equalsIgnoreCase(handleStatus) || "已解决".equals(handleStatus);
    }

    /**
     * 检查是否为误报
     */
    public boolean isFalsePositive() {
        return Boolean.TRUE.equals(falsePositive);
    }

    /**
     * 获取处理优先级
     */
    public int getPriority() {
        if (severityLevel == null) {
            return 3; // 默认中等优先级
        }
        
        switch (severityLevel.toLowerCase()) {
            case "critical":
            case "严重":
                return 1; // 最高优先级
            case "high":
            case "高":
                return 2;
            case "medium":
            case "中":
                return 3;
            case "low":
            case "低":
                return 4;
            case "info":
            case "信息":
                return 5; // 最低优先级
            default:
                return 3;
        }
    }

    /**
     * 获取异常持续时间（小时）
     */
    public long getDurationHours() {
        if (detectionTime == null) {
            return 0;
        }
        
        LocalDateTime endTime = handleTime != null ? handleTime : LocalDateTime.now();
        return java.time.Duration.between(detectionTime, endTime).toHours();
    }

    /**
     * 标记为已处理
     */
    public void markAsResolved(String handler, String method, String result) {
        this.handleStatus = "已解决";
        this.handler = handler;
        this.handleTime = LocalDateTime.now();
        this.handleMethod = method;
        this.handleResult = result;
        this.status = "已关闭";
    }

    /**
     * 标记为误报
     */
    public void markAsFalsePositive(String confirmer, String reason) {
        this.falsePositive = true;
        this.falsePositiveConfirmer = confirmer;
        this.falsePositiveTime = LocalDateTime.now();
        this.falsePositiveReason = reason;
        this.status = "误报";
        this.handleStatus = "已关闭";
    }

    /**
     * 发送通知
     */
    public void sendNotification(String method) {
        this.notified = true;
        this.notificationTime = LocalDateTime.now();
        this.notificationMethod = method;
    }

    /**
     * 实体生命周期回调：保存前
     */
    @PrePersist
    public void prePersist() {
        if (createTime == null) {
            createTime = LocalDateTime.now();
        }
        if (updateTime == null) {
            updateTime = createTime;
        }
        
        // 生成异常编号
        generateAnomalyCode();
        
        // 设置默认值
        if (detectionTime == null) {
            detectionTime = LocalDateTime.now();
        }
        if (snapshotTime == null) {
            snapshotTime = LocalDateTime.now();
        }
        if (status == null) {
            status = "新发现";
        }
        if (handleStatus == null) {
            handleStatus = "待处理";
        }
        if (notified == null) {
            notified = false;
        }
        if (falsePositive == null) {
            falsePositive = false;
        }
        
        // 根据异常评分设置严重程度
        if (severityLevel == null && anomalyScore != null) {
            if (anomalyScore >= 0.8) {
                severityLevel = "严重";
            } else if (anomalyScore >= 0.6) {
                severityLevel = "高";
            } else if (anomalyScore >= 0.4) {
                severityLevel = "中";
            } else if (anomalyScore >= 0.2) {
                severityLevel = "低";
            } else {
                severityLevel = "信息";
            }
        }
    }

    /**
     * 实体生命周期回调：更新前
     */
    @PreUpdate
    public void preUpdate() {
        updateTime = LocalDateTime.now();
    }
}