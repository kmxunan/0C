package com.zerocarbon.standards.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 计算规则实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "calculation_rules")
public class CalculationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 关联的标准
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "standard_id")
    private Standard standard;

    /**
     * 规则代码
     */
    @Column(name = "rule_code", nullable = false)
    private String ruleCode;

    /**
     * 规则名称
     */
    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    /**
     * 计算类型（direct/indirect/scope1/scope2/scope3）
     */
    @Column(name = "calculation_type")
    private String calculationType;

    /**
     * 计算公式
     */
    @Column(name = "formula", columnDefinition = "TEXT")
    private String formula;

    /**
     * 公式描述
     */
    @Column(name = "formula_description", columnDefinition = "TEXT")
    private String formulaDescription;

    /**
     * 输入参数定义（JSON格式）
     */
    @Column(name = "input_parameters", columnDefinition = "TEXT")
    private String inputParameters;

    /**
     * 输出参数定义（JSON格式）
     */
    @Column(name = "output_parameters", columnDefinition = "TEXT")
    private String outputParameters;

    /**
     * 验证规则（JSON格式）
     */
    @Column(name = "validation_rules", columnDefinition = "TEXT")
    private String validationRules;

    /**
     * 适用条件
     */
    @Column(name = "applicable_conditions", columnDefinition = "TEXT")
    private String applicableConditions;

    /**
     * 计算精度要求
     */
    @Column(name = "precision_requirement")
    private Integer precisionRequirement;

    /**
     * 优先级
     */
    @Column(name = "priority")
    private Integer priority;

    /**
     * 状态（active/inactive）
     */
    @Column(name = "status")
    private String status;

    /**
     * 版本号
     */
    @Column(name = "version")
    private String version;

    /**
     * 备注
     */
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    /**
     * 创建时间
     */
    @Column(name = "create_time")
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = "active";
        }
        if (priority == null) {
            priority = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}