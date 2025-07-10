package com.zerocarbon.vpp.service;

import com.zerocarbon.vpp.dto.TradingStrategyDto;
import com.zerocarbon.vpp.dto.StrategyTemplateDto;
import com.zerocarbon.vpp.dto.StrategyValidationResult;
import com.zerocarbon.vpp.entity.TradingStrategy;
import com.zerocarbon.vpp.entity.StrategyTemplate;
import com.zerocarbon.vpp.repository.TradingStrategyRepository;
import com.zerocarbon.vpp.repository.StrategyTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

/**
 * 交易策略编辑器服务
 * 提供可视化的交易策略配置和编辑功能
 * 
 * @author Zero Carbon Team
 * @version 1.0
 * @since 2025-07-10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TradingStrategyEditorService {

    private final TradingStrategyRepository tradingStrategyRepository;
    private final StrategyTemplateRepository strategyTemplateRepository;
    
    // JavaScript引擎用于策略表达式验证
    private final ScriptEngine scriptEngine = new ScriptEngineManager().getEngineByName("javascript");
    
    /**
     * 策略类型定义
     */
    public enum StrategyType {
        PRICE_BASED("基于价格", "根据电价变化进行交易决策"),
        LOAD_BASED("基于负荷", "根据负荷预测进行交易决策"),
        ARBITRAGE("套利策略", "利用价差进行套利交易"),
        PEAK_SHAVING("削峰填谷", "在高峰时段卖电，低谷时段买电"),
        FREQUENCY_REGULATION("调频服务", "提供电网调频辅助服务"),
        RESERVE_CAPACITY("备用容量", "提供备用容量服务"),
        CUSTOM("自定义", "用户自定义策略逻辑");
        
        private final String displayName;
        private final String description;
        
        StrategyType(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }
        
        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }
    
    /**
     * 条件操作符
     */
    public enum ConditionOperator {
        GREATER_THAN(">", "大于"),
        LESS_THAN("<", "小于"),
        GREATER_EQUAL(">=", "大于等于"),
        LESS_EQUAL("<=", "小于等于"),
        EQUAL("==", "等于"),
        NOT_EQUAL("!=", "不等于"),
        BETWEEN("BETWEEN", "介于"),
        IN("IN", "包含于");
        
        private final String symbol;
        private final String displayName;
        
        ConditionOperator(String symbol, String displayName) {
            this.symbol = symbol;
            this.displayName = displayName;
        }
        
        public String getSymbol() { return symbol; }
        public String getDisplayName() { return displayName; }
    }
    
    /**
     * 动作类型
     */
    public enum ActionType {
        BUY("买入", "购买电力"),
        SELL("卖出", "出售电力"),
        HOLD("持有", "保持当前状态"),
        CHARGE("充电", "储能设备充电"),
        DISCHARGE("放电", "储能设备放电"),
        REGULATE_UP("上调", "向上调频"),
        REGULATE_DOWN("下调", "向下调频");
        
        private final String displayName;
        private final String description;
        
        ActionType(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }
        
        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    /**
     * 创建新的交易策略
     * 
     * @param strategyDto 策略DTO
     * @return 创建的策略
     */
    @Transactional
    public TradingStrategyDto createStrategy(TradingStrategyDto strategyDto) {
        log.info("创建交易策略: {}", strategyDto.getName());
        
        // 验证策略配置
        StrategyValidationResult validation = validateStrategy(strategyDto);
        if (!validation.isValid()) {
            throw new IllegalArgumentException("策略配置无效: " + validation.getErrorMessage());
        }
        
        TradingStrategy strategy = TradingStrategy.builder()
                .id(UUID.randomUUID().toString())
                .name(strategyDto.getName())
                .description(strategyDto.getDescription())
                .strategyType(strategyDto.getStrategyType())
                .marketType(strategyDto.getMarketType())
                .conditions(strategyDto.getConditions())
                .actions(strategyDto.getActions())
                .parameters(strategyDto.getParameters())
                .priority(strategyDto.getPriority())
                .isActive(false) // 新创建的策略默认不激活
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        strategy = tradingStrategyRepository.save(strategy);
        
        log.info("交易策略创建成功: {}", strategy.getId());
        return convertToDto(strategy);
    }

    /**
     * 更新交易策略
     * 
     * @param strategyId 策略ID
     * @param strategyDto 策略DTO
     * @return 更新后的策略
     */
    @Transactional
    public TradingStrategyDto updateStrategy(String strategyId, TradingStrategyDto strategyDto) {
        log.info("更新交易策略: {}", strategyId);
        
        TradingStrategy strategy = tradingStrategyRepository.findById(strategyId)
                .orElseThrow(() -> new RuntimeException("策略不存在: " + strategyId));
        
        // 验证策略配置
        StrategyValidationResult validation = validateStrategy(strategyDto);
        if (!validation.isValid()) {
            throw new IllegalArgumentException("策略配置无效: " + validation.getErrorMessage());
        }
        
        // 如果策略正在运行，需要先停止
        if (strategy.getIsActive()) {
            log.warn("策略正在运行，将自动停止后更新: {}", strategyId);
            strategy.setIsActive(false);
        }
        
        strategy.setName(strategyDto.getName());
        strategy.setDescription(strategyDto.getDescription());
        strategy.setStrategyType(strategyDto.getStrategyType());
        strategy.setMarketType(strategyDto.getMarketType());
        strategy.setConditions(strategyDto.getConditions());
        strategy.setActions(strategyDto.getActions());
        strategy.setParameters(strategyDto.getParameters());
        strategy.setPriority(strategyDto.getPriority());
        strategy.setUpdatedAt(LocalDateTime.now());
        
        strategy = tradingStrategyRepository.save(strategy);
        
        log.info("交易策略更新成功: {}", strategyId);
        return convertToDto(strategy);
    }

    /**
     * 验证策略配置
     * 
     * @param strategyDto 策略DTO
     * @return 验证结果
     */
    public StrategyValidationResult validateStrategy(TradingStrategyDto strategyDto) {
        List<String> errors = new ArrayList<>();
        
        // 基本信息验证
        if (strategyDto.getName() == null || strategyDto.getName().trim().isEmpty()) {
            errors.add("策略名称不能为空");
        }
        
        if (strategyDto.getStrategyType() == null) {
            errors.add("策略类型不能为空");
        }
        
        if (strategyDto.getMarketType() == null || strategyDto.getMarketType().trim().isEmpty()) {
            errors.add("市场类型不能为空");
        }
        
        // 条件验证
        if (strategyDto.getConditions() == null || strategyDto.getConditions().isEmpty()) {
            errors.add("策略条件不能为空");
        } else {
            errors.addAll(validateConditions(strategyDto.getConditions()));
        }
        
        // 动作验证
        if (strategyDto.getActions() == null || strategyDto.getActions().isEmpty()) {
            errors.add("策略动作不能为空");
        } else {
            errors.addAll(validateActions(strategyDto.getActions()));
        }
        
        // 参数验证
        if (strategyDto.getParameters() != null) {
            errors.addAll(validateParameters(strategyDto.getParameters()));
        }
        
        boolean isValid = errors.isEmpty();
        String errorMessage = isValid ? null : String.join("; ", errors);
        
        return StrategyValidationResult.builder()
                .isValid(isValid)
                .errorMessage(errorMessage)
                .warnings(new ArrayList<>())
                .build();
    }

    /**
     * 验证策略条件
     */
    private List<String> validateConditions(List<Map<String, Object>> conditions) {
        List<String> errors = new ArrayList<>();
        
        for (int i = 0; i < conditions.size(); i++) {
            Map<String, Object> condition = conditions.get(i);
            String prefix = "条件" + (i + 1) + ": ";
            
            // 验证字段名
            String field = (String) condition.get("field");
            if (field == null || field.trim().isEmpty()) {
                errors.add(prefix + "字段名不能为空");
            }
            
            // 验证操作符
            String operator = (String) condition.get("operator");
            if (operator == null || operator.trim().isEmpty()) {
                errors.add(prefix + "操作符不能为空");
            } else {
                try {
                    ConditionOperator.valueOf(operator);
                } catch (IllegalArgumentException e) {
                    errors.add(prefix + "无效的操作符: " + operator);
                }
            }
            
            // 验证值
            Object value = condition.get("value");
            if (value == null) {
                errors.add(prefix + "比较值不能为空");
            }
        }
        
        return errors;
    }

    /**
     * 验证策略动作
     */
    private List<String> validateActions(List<Map<String, Object>> actions) {
        List<String> errors = new ArrayList<>();
        
        for (int i = 0; i < actions.size(); i++) {
            Map<String, Object> action = actions.get(i);
            String prefix = "动作" + (i + 1) + ": ";
            
            // 验证动作类型
            String type = (String) action.get("type");
            if (type == null || type.trim().isEmpty()) {
                errors.add(prefix + "动作类型不能为空");
            } else {
                try {
                    ActionType.valueOf(type);
                } catch (IllegalArgumentException e) {
                    errors.add(prefix + "无效的动作类型: " + type);
                }
            }
            
            // 验证数量
            Object quantity = action.get("quantity");
            if (quantity != null) {
                try {
                    BigDecimal quantityValue = new BigDecimal(quantity.toString());
                    if (quantityValue.compareTo(BigDecimal.ZERO) <= 0) {
                        errors.add(prefix + "数量必须大于0");
                    }
                } catch (NumberFormatException e) {
                    errors.add(prefix + "无效的数量格式: " + quantity);
                }
            }
        }
        
        return errors;
    }

    /**
     * 验证策略参数
     */
    private List<String> validateParameters(Map<String, Object> parameters) {
        List<String> errors = new ArrayList<>();
        
        // 验证风险控制参数
        Object maxLoss = parameters.get("maxLoss");
        if (maxLoss != null) {
            try {
                BigDecimal maxLossValue = new BigDecimal(maxLoss.toString());
                if (maxLossValue.compareTo(BigDecimal.ZERO) < 0) {
                    errors.add("最大亏损不能为负数");
                }
            } catch (NumberFormatException e) {
                errors.add("无效的最大亏损格式: " + maxLoss);
            }
        }
        
        // 验证执行时间窗口
        Object startTime = parameters.get("startTime");
        Object endTime = parameters.get("endTime");
        if (startTime != null && endTime != null) {
            // 这里可以添加时间格式验证逻辑
        }
        
        return errors;
    }

    /**
     * 获取策略模板列表
     * 
     * @return 模板列表
     */
    public List<StrategyTemplateDto> getStrategyTemplates() {
        log.info("获取策略模板列表");
        
        List<StrategyTemplate> templates = strategyTemplateRepository.findAll();
        return templates.stream()
                .map(this::convertTemplateToDto)
                .collect(Collectors.toList());
    }

    /**
     * 根据模板创建策略
     * 
     * @param templateId 模板ID
     * @param strategyName 策略名称
     * @return 创建的策略
     */
    @Transactional
    public TradingStrategyDto createStrategyFromTemplate(String templateId, String strategyName) {
        log.info("根据模板创建策略: {}, 策略名称: {}", templateId, strategyName);
        
        StrategyTemplate template = strategyTemplateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("模板不存在: " + templateId));
        
        TradingStrategyDto strategyDto = TradingStrategyDto.builder()
                .name(strategyName)
                .description(template.getDescription())
                .strategyType(template.getStrategyType())
                .marketType(template.getMarketType())
                .conditions(template.getConditions())
                .actions(template.getActions())
                .parameters(template.getParameters())
                .priority(5) // 默认优先级
                .build();
        
        return createStrategy(strategyDto);
    }

    /**
     * 获取策略列表
     * 
     * @param marketType 市场类型（可选）
     * @param isActive 是否激活（可选）
     * @return 策略列表
     */
    public List<TradingStrategyDto> getStrategies(String marketType, Boolean isActive) {
        log.info("获取策略列表: marketType={}, isActive={}", marketType, isActive);
        
        List<TradingStrategy> strategies;
        
        if (marketType != null && isActive != null) {
            strategies = tradingStrategyRepository.findByMarketTypeAndIsActive(marketType, isActive);
        } else if (marketType != null) {
            strategies = tradingStrategyRepository.findByMarketType(marketType);
        } else if (isActive != null) {
            strategies = tradingStrategyRepository.findByIsActive(isActive);
        } else {
            strategies = tradingStrategyRepository.findAll();
        }
        
        return strategies.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 获取策略详情
     * 
     * @param strategyId 策略ID
     * @return 策略详情
     */
    public TradingStrategyDto getStrategy(String strategyId) {
        log.info("获取策略详情: {}", strategyId);
        
        TradingStrategy strategy = tradingStrategyRepository.findById(strategyId)
                .orElseThrow(() -> new RuntimeException("策略不存在: " + strategyId));
        
        return convertToDto(strategy);
    }

    /**
     * 删除策略
     * 
     * @param strategyId 策略ID
     */
    @Transactional
    public void deleteStrategy(String strategyId) {
        log.info("删除策略: {}", strategyId);
        
        TradingStrategy strategy = tradingStrategyRepository.findById(strategyId)
                .orElseThrow(() -> new RuntimeException("策略不存在: " + strategyId));
        
        if (strategy.getIsActive()) {
            throw new IllegalStateException("不能删除正在运行的策略，请先停止策略");
        }
        
        tradingStrategyRepository.delete(strategy);
        log.info("策略删除成功: {}", strategyId);
    }

    /**
     * 激活策略
     * 
     * @param strategyId 策略ID
     */
    @Transactional
    public void activateStrategy(String strategyId) {
        log.info("激活策略: {}", strategyId);
        
        TradingStrategy strategy = tradingStrategyRepository.findById(strategyId)
                .orElseThrow(() -> new RuntimeException("策略不存在: " + strategyId));
        
        // 验证策略配置
        TradingStrategyDto strategyDto = convertToDto(strategy);
        StrategyValidationResult validation = validateStrategy(strategyDto);
        if (!validation.isValid()) {
            throw new IllegalArgumentException("策略配置无效，无法激活: " + validation.getErrorMessage());
        }
        
        strategy.setIsActive(true);
        strategy.setUpdatedAt(LocalDateTime.now());
        tradingStrategyRepository.save(strategy);
        
        log.info("策略激活成功: {}", strategyId);
    }

    /**
     * 停用策略
     * 
     * @param strategyId 策略ID
     */
    @Transactional
    public void deactivateStrategy(String strategyId) {
        log.info("停用策略: {}", strategyId);
        
        TradingStrategy strategy = tradingStrategyRepository.findById(strategyId)
                .orElseThrow(() -> new RuntimeException("策略不存在: " + strategyId));
        
        strategy.setIsActive(false);
        strategy.setUpdatedAt(LocalDateTime.now());
        tradingStrategyRepository.save(strategy);
        
        log.info("策略停用成功: {}", strategyId);
    }

    /**
     * 获取可用的策略类型
     */
    public List<Map<String, String>> getStrategyTypes() {
        return Arrays.stream(StrategyType.values())
                .map(type -> Map.of(
                        "value", type.name(),
                        "label", type.getDisplayName(),
                        "description", type.getDescription()
                ))
                .collect(Collectors.toList());
    }

    /**
     * 获取可用的条件操作符
     */
    public List<Map<String, String>> getConditionOperators() {
        return Arrays.stream(ConditionOperator.values())
                .map(op -> Map.of(
                        "value", op.name(),
                        "symbol", op.getSymbol(),
                        "label", op.getDisplayName()
                ))
                .collect(Collectors.toList());
    }

    /**
     * 获取可用的动作类型
     */
    public List<Map<String, String>> getActionTypes() {
        return Arrays.stream(ActionType.values())
                .map(action -> Map.of(
                        "value", action.name(),
                        "label", action.getDisplayName(),
                        "description", action.getDescription()
                ))
                .collect(Collectors.toList());
    }

    /**
     * 转换实体到DTO
     */
    private TradingStrategyDto convertToDto(TradingStrategy strategy) {
        return TradingStrategyDto.builder()
                .id(strategy.getId())
                .name(strategy.getName())
                .description(strategy.getDescription())
                .strategyType(strategy.getStrategyType())
                .marketType(strategy.getMarketType())
                .conditions(strategy.getConditions())
                .actions(strategy.getActions())
                .parameters(strategy.getParameters())
                .priority(strategy.getPriority())
                .isActive(strategy.getIsActive())
                .createdAt(strategy.getCreatedAt())
                .updatedAt(strategy.getUpdatedAt())
                .build();
    }

    /**
     * 转换模板实体到DTO
     */
    private StrategyTemplateDto convertTemplateToDto(StrategyTemplate template) {
        return StrategyTemplateDto.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .strategyType(template.getStrategyType())
                .marketType(template.getMarketType())
                .conditions(template.getConditions())
                .actions(template.getActions())
                .parameters(template.getParameters())
                .category(template.getCategory())
                .isBuiltIn(template.getIsBuiltIn())
                .createdAt(template.getCreatedAt())
                .build();
    }
}