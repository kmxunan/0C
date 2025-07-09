package com.zerocarbon.dataquality.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 数据质量指标实体
 * 记录数据质量检查的各项指标和评分
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "data_quality_metric", indexes = {
    @Index(name = "idx_data_source_table", columnList = "dataSource,tableName"),
    @Index(name = "idx_create_time", columnList = "createTime"),
    @Index(name = "idx_overall_score", columnList = "overallScore")
})
@EntityListeners(AuditingEntityListener.class)
public class DataQualityMetric {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
     * 数据完整性评分 (0-1)
     */
    @Column(name = "completeness_score", nullable = false, precision = 5, scale = 4)
    private Double completenessScore;

    /**
     * 数据准确性评分 (0-1)
     */
    @Column(name = "accuracy_score", nullable = false, precision = 5, scale = 4)
    private Double accuracyScore;

    /**
     * 数据一致性评分 (0-1)
     */
    @Column(name = "consistency_score", nullable = false, precision = 5, scale = 4)
    private Double consistencyScore;

    /**
     * 数据及时性评分 (0-1)
     */
    @Column(name = "timeliness_score", precision = 5, scale = 4)
    private Double timelinessScore;

    /**
     * 数据有效性评分 (0-1)
     */
    @Column(name = "validity_score", precision = 5, scale = 4)
    private Double validityScore;

    /**
     * 数据唯一性评分 (0-1)
     */
    @Column(name = "uniqueness_score", precision = 5, scale = 4)
    private Double uniquenessScore;

    /**
     * 综合质量评分 (0-1)
     */
    @Column(name = "overall_score", nullable = false, precision = 5, scale = 4)
    private Double overallScore;

    /**
     * 质量等级
     */
    @Column(name = "quality_level", length = 20)
    private String qualityLevel;

    /**
     * 检查的记录总数
     */
    @Column(name = "total_records")
    private Long totalRecords;

    /**
     * 有效记录数
     */
    @Column(name = "valid_records")
    private Long validRecords;

    /**
     * 无效记录数
     */
    @Column(name = "invalid_records")
    private Long invalidRecords;

    /**
     * 缺失记录数
     */
    @Column(name = "missing_records")
    private Long missingRecords;

    /**
     * 重复记录数
     */
    @Column(name = "duplicate_records")
    private Long duplicateRecords;

    /**
     * 异常记录数
     */
    @Column(name = "anomaly_records")
    private Long anomalyRecords;

    /**
     * 检查耗时（毫秒）
     */
    @Column(name = "check_duration_ms")
    private Long checkDurationMs;

    /**
     * 检查类型
     */
    @Column(name = "check_type", length = 50)
    private String checkType;

    /**
     * 检查规则版本
     */
    @Column(name = "rule_version", length = 20)
    private String ruleVersion;

    /**
     * 数据快照时间
     */
    @Column(name = "snapshot_time")
    private LocalDateTime snapshotTime;

    /**
     * 质量问题描述
     */
    @Column(name = "issues", columnDefinition = "TEXT")
    private String issues;

    /**
     * 改进建议
     */
    @Column(name = "suggestions", columnDefinition = "TEXT")
    private String suggestions;

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
     * 计算质量等级
     */
    public void calculateQualityLevel() {
        if (overallScore == null) {
            this.qualityLevel = "未知";
            return;
        }
        
        if (overallScore >= 0.95) {
            this.qualityLevel = "优秀";
        } else if (overallScore >= 0.90) {
            this.qualityLevel = "良好";
        } else if (overallScore >= 0.80) {
            this.qualityLevel = "一般";
        } else if (overallScore >= 0.70) {
            this.qualityLevel = "较差";
        } else {
            this.qualityLevel = "很差";
        }
    }

    /**
     * 计算综合评分
     */
    public void calculateOverallScore() {
        if (completenessScore == null || accuracyScore == null || consistencyScore == null) {
            return;
        }
        
        double score = 0.0;
        double weight = 0.0;
        
        // 完整性权重：25%
        score += completenessScore * 0.25;
        weight += 0.25;
        
        // 准确性权重：30%
        score += accuracyScore * 0.30;
        weight += 0.30;
        
        // 一致性权重：25%
        score += consistencyScore * 0.25;
        weight += 0.25;
        
        // 及时性权重：10%
        if (timelinessScore != null) {
            score += timelinessScore * 0.10;
            weight += 0.10;
        }
        
        // 有效性权重：5%
        if (validityScore != null) {
            score += validityScore * 0.05;
            weight += 0.05;
        }
        
        // 唯一性权重：5%
        if (uniquenessScore != null) {
            score += uniquenessScore * 0.05;
            weight += 0.05;
        }
        
        // 如果权重不足1，按比例调整
        if (weight < 1.0 && weight > 0) {
            score = score / weight;
        }
        
        this.overallScore = Math.round(score * 10000.0) / 10000.0; // 保留4位小数
    }

    /**
     * 获取质量状态
     */
    public String getQualityStatus() {
        if (overallScore == null) {
            return "未检查";
        }
        
        if (overallScore >= 0.90) {
            return "正常";
        } else if (overallScore >= 0.70) {
            return "警告";
        } else {
            return "异常";
        }
    }

    /**
     * 获取质量趋势（需要与历史数据比较）
     */
    public String getQualityTrend(Double previousScore) {
        if (overallScore == null || previousScore == null) {
            return "无数据";
        }
        
        double diff = overallScore - previousScore;
        
        if (Math.abs(diff) < 0.01) {
            return "稳定";
        } else if (diff > 0) {
            return "上升";
        } else {
            return "下降";
        }
    }

    /**
     * 检查是否需要告警
     */
    public boolean needsAlert() {
        return overallScore != null && overallScore < 0.80;
    }

    /**
     * 获取主要问题类型
     */
    public String getPrimaryIssueType() {
        if (completenessScore != null && completenessScore < 0.80) {
            return "完整性问题";
        }
        if (accuracyScore != null && accuracyScore < 0.80) {
            return "准确性问题";
        }
        if (consistencyScore != null && consistencyScore < 0.80) {
            return "一致性问题";
        }
        if (timelinessScore != null && timelinessScore < 0.80) {
            return "及时性问题";
        }
        if (validityScore != null && validityScore < 0.80) {
            return "有效性问题";
        }
        if (uniquenessScore != null && uniquenessScore < 0.80) {
            return "唯一性问题";
        }
        return "无明显问题";
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
        
        // 自动计算综合评分和质量等级
        calculateOverallScore();
        calculateQualityLevel();
        
        // 设置快照时间
        if (snapshotTime == null) {
            snapshotTime = LocalDateTime.now();
        }
    }

    /**
     * 实体生命周期回调：更新前
     */
    @PreUpdate
    public void preUpdate() {
        updateTime = LocalDateTime.now();
        
        // 重新计算综合评分和质量等级
        calculateOverallScore();
        calculateQualityLevel();
    }
}