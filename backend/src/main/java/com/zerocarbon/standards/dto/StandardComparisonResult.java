package com.zerocarbon.standards.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 标准对比分析结果DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandardComparisonResult {
    
    /**
     * 对比的标准合规性结果列表
     */
    private List<StandardComplianceResult> comparisonResults;
    
    /**
     * 推荐的最佳标准
     */
    private String recommendedStandard;
    
    /**
     * 推荐理由
     */
    private String recommendationReason;
    
    /**
     * 对比时间
     */
    private LocalDateTime comparisonTime;
    
    /**
     * 对比摘要
     */
    private ComparisonSummary summary;
    
    /**
     * 详细对比分析
     */
    private Map<String, Object> detailedAnalysis;
    
    /**
     * 对比摘要内部类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComparisonSummary {
        
        /**
         * 总对比标准数量
         */
        private Integer totalStandards;
        
        /**
         * 合规标准数量
         */
        private Integer compliantStandards;
        
        /**
         * 最高合规性评分
         */
        private Double highestScore;
        
        /**
         * 最低合规性评分
         */
        private Double lowestScore;
        
        /**
         * 平均合规性评分
         */
        private Double averageScore;
        
        /**
         * 主要差异点
         */
        private List<String> majorDifferences;
        
        /**
         * 共同要求
         */
        private List<String> commonRequirements;
    }
}