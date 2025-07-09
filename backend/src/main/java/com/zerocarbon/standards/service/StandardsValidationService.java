package com.zerocarbon.standards.service;

import com.zerocarbon.standards.dto.StandardComplianceResult;
import com.zerocarbon.standards.entity.Standard;
import com.zerocarbon.standards.entity.CalculationRule;
import com.zerocarbon.standards.repository.StandardsRepository;
import com.zerocarbon.standards.repository.CalculationRuleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 标准验证服务
 */
@Slf4j
@Service
public class StandardsValidationService {

    private final StandardsRepository standardsRepository;
    private final CalculationRuleRepository calculationRuleRepository;

    public StandardsValidationService(
            StandardsRepository standardsRepository,
            CalculationRuleRepository calculationRuleRepository) {
        this.standardsRepository = standardsRepository;
        this.calculationRuleRepository = calculationRuleRepository;
    }

    /**
     * 验证数据是否符合指定标准
     */
    public StandardComplianceResult validateCompliance(String standardCode, Map<String, Object> data) {
        log.info("开始验证标准 {} 的合规性", standardCode);
        
        Optional<Standard> standardOpt = standardsRepository.findByCode(standardCode);
        if (standardOpt.isEmpty()) {
            return createNonCompliantResult(standardCode, "标准不存在", 0.0);
        }
        
        Standard standard = standardOpt.get();
        
        // 获取该标准的计算规则
        List<CalculationRule> rules = calculationRuleRepository.findByStandardAndStatus(standard, "active");
        
        if (rules.isEmpty()) {
            return createNonCompliantResult(standardCode, "标准缺少计算规则", 0.0);
        }
        
        // 执行验证
        return performValidation(standard, rules, data);
    }

    /**
     * 执行具体的验证逻辑
     */
    private StandardComplianceResult performValidation(Standard standard, List<CalculationRule> rules, Map<String, Object> data) {
        List<String> validationErrors = new ArrayList<>();
        List<String> validationWarnings = new ArrayList<>();
        double totalScore = 0.0;
        int totalChecks = 0;
        
        for (CalculationRule rule : rules) {
            ValidationResult ruleResult = validateRule(rule, data);
            validationErrors.addAll(ruleResult.getErrors());
            validationWarnings.addAll(ruleResult.getWarnings());
            totalScore += ruleResult.getScore();
            totalChecks++;
        }
        
        // 执行标准特定的验证
        ValidationResult standardSpecificResult = validateStandardSpecific(standard, data);
        validationErrors.addAll(standardSpecificResult.getErrors());
        validationWarnings.addAll(standardSpecificResult.getWarnings());
        totalScore += standardSpecificResult.getScore();
        totalChecks++;
        
        double complianceScore = totalChecks > 0 ? totalScore / totalChecks : 0.0;
        boolean isCompliant = validationErrors.isEmpty() && complianceScore >= 0.8;
        
        return StandardComplianceResult.builder()
            .standardCode(standard.getCode())
            .standardName(standard.getName())
            .isCompliant(isCompliant)
            .complianceScore(complianceScore)
            .validationErrors(validationErrors)
            .validationWarnings(validationWarnings)
            .validationTime(LocalDateTime.now())
            .recommendations(generateRecommendations(validationErrors, validationWarnings))
            .build();
    }

    /**
     * 验证单个计算规则
     */
    private ValidationResult validateRule(CalculationRule rule, Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        double score = 1.0;
        
        try {
            // 解析输入参数要求
            Map<String, Object> inputRequirements = parseInputParameters(rule.getInputParameters());
            
            // 验证必需参数
            for (Map.Entry<String, Object> requirement : inputRequirements.entrySet()) {
                String paramName = requirement.getKey();
                Map<String, Object> paramConfig = (Map<String, Object>) requirement.getValue();
                
                if (!data.containsKey(paramName)) {
                    if (Boolean.TRUE.equals(paramConfig.get("required"))) {
                        errors.add(String.format("缺少必需参数: %s", paramName));
                        score -= 0.2;
                    } else {
                        warnings.add(String.format("缺少可选参数: %s", paramName));
                        score -= 0.1;
                    }
                    continue;
                }
                
                // 验证参数类型和范围
                Object value = data.get(paramName);
                ValidationResult paramResult = validateParameter(paramName, value, paramConfig);
                errors.addAll(paramResult.getErrors());
                warnings.addAll(paramResult.getWarnings());
                score = Math.min(score, paramResult.getScore());
            }
            
            // 验证计算公式的适用条件
            if (rule.getApplicableConditions() != null) {
                ValidationResult conditionResult = validateApplicableConditions(rule.getApplicableConditions(), data);
                errors.addAll(conditionResult.getErrors());
                warnings.addAll(conditionResult.getWarnings());
                score = Math.min(score, conditionResult.getScore());
            }
            
        } catch (Exception e) {
            log.error("验证规则 {} 时发生错误", rule.getRuleCode(), e);
            errors.add(String.format("规则验证异常: %s", e.getMessage()));
            score = 0.0;
        }
        
        return new ValidationResult(errors, warnings, Math.max(0.0, score));
    }

    /**
     * 验证参数
     */
    private ValidationResult validateParameter(String paramName, Object value, Map<String, Object> config) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        double score = 1.0;
        
        // 验证数据类型
        String expectedType = (String) config.get("type");
        if (expectedType != null && !isValidType(value, expectedType)) {
            errors.add(String.format("参数 %s 类型错误，期望: %s，实际: %s", 
                paramName, expectedType, value.getClass().getSimpleName()));
            score -= 0.3;
        }
        
        // 验证数值范围
        if (value instanceof Number) {
            Number numValue = (Number) value;
            
            if (config.containsKey("min")) {
                double min = ((Number) config.get("min")).doubleValue();
                if (numValue.doubleValue() < min) {
                    errors.add(String.format("参数 %s 值 %s 小于最小值 %s", paramName, numValue, min));
                    score -= 0.2;
                }
            }
            
            if (config.containsKey("max")) {
                double max = ((Number) config.get("max")).doubleValue();
                if (numValue.doubleValue() > max) {
                    errors.add(String.format("参数 %s 值 %s 大于最大值 %s", paramName, numValue, max));
                    score -= 0.2;
                }
            }
        }
        
        // 验证字符串长度
        if (value instanceof String) {
            String strValue = (String) value;
            
            if (config.containsKey("minLength")) {
                int minLength = (Integer) config.get("minLength");
                if (strValue.length() < minLength) {
                    warnings.add(String.format("参数 %s 长度 %d 小于建议最小长度 %d", 
                        paramName, strValue.length(), minLength));
                    score -= 0.1;
                }
            }
        }
        
        return new ValidationResult(errors, warnings, Math.max(0.0, score));
    }

    /**
     * 验证适用条件
     */
    private ValidationResult validateApplicableConditions(String conditions, Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        double score = 1.0;
        
        // 简化的条件验证逻辑
        // 实际实现中可以使用表达式引擎如SpEL或MVEL
        try {
            Map<String, Object> conditionMap = parseConditions(conditions);
            
            for (Map.Entry<String, Object> condition : conditionMap.entrySet()) {
                String conditionName = condition.getKey();
                Object expectedValue = condition.getValue();
                
                if (!data.containsKey(conditionName)) {
                    warnings.add(String.format("条件参数 %s 不存在", conditionName));
                    score -= 0.1;
                    continue;
                }
                
                Object actualValue = data.get(conditionName);
                if (!Objects.equals(expectedValue, actualValue)) {
                    warnings.add(String.format("条件 %s 不满足，期望: %s，实际: %s", 
                        conditionName, expectedValue, actualValue));
                    score -= 0.2;
                }
            }
            
        } catch (Exception e) {
            errors.add(String.format("条件验证失败: %s", e.getMessage()));
            score = 0.5;
        }
        
        return new ValidationResult(errors, warnings, Math.max(0.0, score));
    }

    /**
     * 执行标准特定的验证
     */
    private ValidationResult validateStandardSpecific(Standard standard, Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        double score = 1.0;
        
        switch (standard.getType()) {
            case "national":
                return validateNationalStandard(standard, data);
            case "industry":
                return validateIndustryStandard(standard, data);
            case "international":
                return validateInternationalStandard(standard, data);
            default:
                warnings.add("未知的标准类型: " + standard.getType());
                score = 0.8;
                break;
        }
        
        return new ValidationResult(errors, warnings, score);
    }

    /**
     * 验证国家标准
     */
    private ValidationResult validateNationalStandard(Standard standard, Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        double score = 1.0;
        
        // 国家标准特定验证逻辑
        if (standard.getCode().startsWith("GB/T")) {
            // 验证数据完整性要求
            String[] requiredFields = {"energyConsumption", "productionOutput", "emissionFactor"};
            for (String field : requiredFields) {
                if (!data.containsKey(field)) {
                    errors.add(String.format("国家标准要求的字段 %s 缺失", field));
                    score -= 0.2;
                }
            }
        }
        
        return new ValidationResult(errors, warnings, Math.max(0.0, score));
    }

    /**
     * 验证行业标准
     */
    private ValidationResult validateIndustryStandard(Standard standard, Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        double score = 1.0;
        
        // 行业标准特定验证逻辑
        if (standard.getCode().startsWith("HJ")) {
            // 环保行业标准验证
            if (!data.containsKey("pollutantEmissions")) {
                warnings.add("建议提供污染物排放数据");
                score -= 0.1;
            }
        }
        
        return new ValidationResult(errors, warnings, Math.max(0.0, score));
    }

    /**
     * 验证国际标准
     */
    private ValidationResult validateInternationalStandard(Standard standard, Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        double score = 1.0;
        
        // 国际标准特定验证逻辑
        if (standard.getCode().startsWith("ISO")) {
            // ISO标准验证
            if (!data.containsKey("uncertaintyAnalysis")) {
                warnings.add("建议提供不确定性分析数据");
                score -= 0.1;
            }
        }
        
        return new ValidationResult(errors, warnings, Math.max(0.0, score));
    }

    /**
     * 生成改进建议
     */
    private List<String> generateRecommendations(List<String> errors, List<String> warnings) {
        List<String> recommendations = new ArrayList<>();
        
        if (!errors.isEmpty()) {
            recommendations.add("请修复所有验证错误以确保合规性");
            recommendations.add("建议检查数据完整性和准确性");
        }
        
        if (!warnings.isEmpty()) {
            recommendations.add("建议关注警告信息以提高数据质量");
        }
        
        if (errors.isEmpty() && warnings.isEmpty()) {
            recommendations.add("数据完全符合标准要求");
            recommendations.add("建议定期更新数据以保持合规性");
        }
        
        return recommendations;
    }

    // 辅助方法
    private StandardComplianceResult createNonCompliantResult(String standardCode, String reason, double score) {
        return StandardComplianceResult.builder()
            .standardCode(standardCode)
            .standardName("未知标准")
            .isCompliant(false)
            .complianceScore(score)
            .validationErrors(Arrays.asList(reason))
            .validationWarnings(Collections.emptyList())
            .validationTime(LocalDateTime.now())
            .recommendations(Arrays.asList("请检查标准代码是否正确"))
            .build();
    }

    private Map<String, Object> parseInputParameters(String inputParameters) {
        // 简化实现，实际应该解析JSON
        return new HashMap<>();
    }

    private Map<String, Object> parseConditions(String conditions) {
        // 简化实现，实际应该解析条件表达式
        return new HashMap<>();
    }

    private boolean isValidType(Object value, String expectedType) {
        switch (expectedType.toLowerCase()) {
            case "string":
                return value instanceof String;
            case "number":
            case "double":
                return value instanceof Number;
            case "integer":
                return value instanceof Integer;
            case "boolean":
                return value instanceof Boolean;
            default:
                return true;
        }
    }

    /**
     * 验证结果内部类
     */
    private static class ValidationResult {
        private final List<String> errors;
        private final List<String> warnings;
        private final double score;

        public ValidationResult(List<String> errors, List<String> warnings, double score) {
            this.errors = errors;
            this.warnings = warnings;
            this.score = score;
        }

        public List<String> getErrors() { return errors; }
        public List<String> getWarnings() { return warnings; }
        public double getScore() { return score; }
    }
}