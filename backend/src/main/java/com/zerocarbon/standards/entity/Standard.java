package com.zerocarbon.standards.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 标准实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "standards")
public class Standard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 标准代码（如：GB/T 32150-2015）
     */
    @Column(name = "code", unique = true, nullable = false)
    private String code;

    /**
     * 标准名称
     */
    @Column(name = "name", nullable = false)
    private String name;

    /**
     * 标准类型（national/industry/international）
     */
    @Column(name = "type", nullable = false)
    private String type;

    /**
     * 标准版本
     */
    @Column(name = "version")
    private String version;

    /**
     * 发布日期
     */
    @Column(name = "release_date")
    private LocalDateTime releaseDate;

    /**
     * 实施日期
     */
    @Column(name = "implementation_date")
    private LocalDateTime implementationDate;

    /**
     * 标准描述
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 适用行业
     */
    @Column(name = "applicable_industries")
    private String applicableIndustries;

    /**
     * 标准状态（active/deprecated/draft）
     */
    @Column(name = "status")
    private String status;

    /**
     * 标准文档URL
     */
    @Column(name = "document_url")
    private String documentUrl;

    /**
     * 发布机构
     */
    @Column(name = "issuing_authority")
    private String issuingAuthority;

    /**
     * 替代的标准代码
     */
    @Column(name = "replaces_standard")
    private String replacesStandard;

    /**
     * 被替代的标准代码
     */
    @Column(name = "replaced_by_standard")
    private String replacedByStandard;

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

    /**
     * 关联的排放因子
     */
    @OneToMany(mappedBy = "standard", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EmissionFactor> emissionFactors;

    /**
     * 标准计算规则
     */
    @OneToMany(mappedBy = "standard", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CalculationRule> calculationRules;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}