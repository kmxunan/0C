package com.zerocarbon.standards.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 标准合规性验证结果DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandardComplianceResult {
    
    /**
     * 标准代码
     */
    private String standardCode;
    
    /**
     * 标准名称
     */
    private String standardName;
    
    /**
     * 是否合规
     */
    private Boolean isCompliant;
    
    /**
     * 合规性评分（0-1）
     */
    private Double complianceScore;
    
    /**
     * 验证错误列表
     */
    private List<String> validationErrors;
    
    /**
     * 验证警告列表
     */
    private List<String> validationWarnings;
    
    /**
     * 验证时间
     */
    private LocalDateTime validationTime;
    
    /**
     * 改进建议
     */
    private List<String> recommendations;
    
    /**
     * 详细验证结果
     */
    private Map<String, Object> detailedResults;
    
    /**
     * 验证的数据摘要
     */
    private Map<String, Object> dataSummary;
    
    /**
     * 下次建议验证时间
     */
    private LocalDateTime nextValidationTime;
}