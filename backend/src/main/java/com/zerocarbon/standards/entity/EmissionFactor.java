package com.zerocarbon.standards.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 排放因子实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "emission_factors")
public class EmissionFactor {

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
     * 因子代码
     */
    @Column(name = "factor_code", nullable = false)
    private String factorCode;

    /**
     * 因子名称
     */
    @Column(name = "factor_name", nullable = false)
    private String factorName;

    /**
     * 能源类型或物质类型
     */
    @Column(name = "energy_type")
    private String energyType;

    /**
     * 排放因子值
     */
    @Column(name = "factor_value", precision = 20, scale = 6)
    private BigDecimal factorValue;

    /**
     * 单位
     */
    @Column(name = "unit")
    private String unit;

    /**
     * 温室气体类型（CO2/CH4/N2O等）
     */
    @Column(name = "gas_type")
    private String gasType;

    /**
     * 适用范围
     */
    @Column(name = "applicable_scope")
    private String applicableScope;

    /**
     * 数据来源
     */
    @Column(name = "data_source")
    private String dataSource;

    /**
     * 不确定性
     */
    @Column(name = "uncertainty", precision = 10, scale = 4)
    private BigDecimal uncertainty;

    /**
     * 生效日期
     */
    @Column(name = "effective_date")
    private LocalDateTime effectiveDate;

    /**
     * 失效日期
     */
    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    /**
     * 状态（active/inactive）
     */
    @Column(name = "status")
    private String status;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    /**
     * 检查排放因子是否有效
     */
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return "active".equals(status) &&
               (effectiveDate == null || !now.isBefore(effectiveDate)) &&
               (expiryDate == null || !now.isAfter(expiryDate));
    }
}