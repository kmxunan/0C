package com.carbon.service;

import com.carbon.dto.TradingOrder;
import com.carbon.dto.ExecutionResult;
import com.carbon.dto.RiskCheckResult;
import com.carbon.entity.TradingStrategy;
import com.carbon.entity.MarketData;
import com.carbon.entity.TradingRecord;
import com.carbon.entity.VppResourceInstance;
import com.carbon.repository.TradingStrategyRepository;
import com.carbon.repository.TradingRecordRepository;
import com.carbon.repository.VppResourceInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 自动交易执行服务
 * 负责实时监控市场数据，执行交易策略，管理交易风险
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AutoTradingExecutionService {

    private final TradingStrategyRepository strategyRepository;
    private final TradingRecordRepository tradingRecordRepository;
    private final VppResourceInstanceRepository resourceRepository;
    private final MarketConnectorService marketConnectorService;
    private final MarketDataSyncService marketDataSyncService;
    private final TradingStrategyEditorService strategyEditorService;
    
    // 运行状态管理
    private final Map<Long, StrategyExecutor> activeExecutors = new ConcurrentHashMap<>();
    private final ReentrantLock executionLock = new ReentrantLock();
    private volatile boolean globalTradingEnabled = true;

    /**
     * 启动策略执行
     */
    @Transactional
    public CompletableFuture<Void> startStrategyExecution(Long strategyId) {
        return CompletableFuture.runAsync(() -> {
            try {
                executionLock.lock();
                
                if (activeExecutors.containsKey(strategyId)) {
                    log.warn("策略已在运行中: strategyId={}", strategyId);
                    return;
                }

                TradingStrategy strategy = strategyRepository.findById(strategyId)
                    .orElseThrow(() -> new RuntimeException("策略不存在: " + strategyId));

                if (!"ACTIVE".equals(strategy.getStatus())) {
                    throw new RuntimeException("策略未激活，无法启动执行: " + strategyId);
                }

                // 创建策略执行器
                StrategyExecutor executor = new StrategyExecutor(strategy);
                activeExecutors.put(strategyId, executor);
                
                // 更新策略状态
                strategy.setStatus("RUNNING");
                strategy.setLastExecutionTime(LocalDateTime.now());
                strategyRepository.save(strategy);

                log.info("策略执行已启动: strategyId={}, strategyName={}", 
                    strategyId, strategy.getName());
                
            } finally {
                executionLock.unlock();
            }
        });
    }

    /**
     * 停止策略执行
     */
    @Transactional
    public CompletableFuture<Void> stopStrategyExecution(Long strategyId) {
        return CompletableFuture.runAsync(() -> {
            try {
                executionLock.lock();
                
                StrategyExecutor executor = activeExecutors.remove(strategyId);
                if (executor != null) {
                    executor.stop();
                    
                    // 更新策略状态
                    TradingStrategy strategy = strategyRepository.findById(strategyId)
                        .orElse(null);
                    if (strategy != null) {
                        strategy.setStatus("ACTIVE");
                        strategyRepository.save(strategy);
                    }
                    
                    log.info("策略执行已停止: strategyId={}", strategyId);
                } else {
                    log.warn("策略未在运行中: strategyId={}", strategyId);
                }
                
            } finally {
                executionLock.unlock();
            }
        });
    }

    /**
     * 停止所有策略执行
     */
    public void stopAllStrategies() {
        try {
            executionLock.lock();
            
            for (Map.Entry<Long, StrategyExecutor> entry : activeExecutors.entrySet()) {
                entry.getValue().stop();
                log.info("策略执行已停止: strategyId={}", entry.getKey());
            }
            
            activeExecutors.clear();
            
        } finally {
            executionLock.unlock();
        }
    }

    /**
     * 获取运行中的策略列表
     */
    public List<Long> getRunningStrategies() {
        return new ArrayList<>(activeExecutors.keySet());
    }

    /**
     * 启用/禁用全局交易
     */
    public void setGlobalTradingEnabled(boolean enabled) {
        this.globalTradingEnabled = enabled;
        log.info("全局交易状态已更新: enabled={}", enabled);
    }

    /**
     * 定时执行策略检查
     */
    @Scheduled(fixedDelay = 5000) // 每5秒执行一次
    public void executeStrategies() {
        if (!globalTradingEnabled) {
            return;
        }

        for (Map.Entry<Long, StrategyExecutor> entry : activeExecutors.entrySet()) {
            try {
                entry.getValue().execute();
            } catch (Exception e) {
                log.error("策略执行异常: strategyId={}, error={}", entry.getKey(), e.getMessage(), e);
            }
        }
    }

    /**
     * 执行交易订单
     */
    @Async
    public CompletableFuture<ExecutionResult> executeOrder(TradingOrder order) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("开始执行交易订单: {}", order);

                // 风险检查
                RiskCheckResult riskCheck = performRiskCheck(order);
                if (!riskCheck.isPassed()) {
                    log.warn("交易订单风险检查未通过: {}, reason={}", order, riskCheck.getReason());
                    return ExecutionResult.failed(riskCheck.getReason());
                }

                // 执行交易
                ExecutionResult result = executeTradeOrder(order);
                
                // 记录交易
                if (result.isSuccess()) {
                    recordTrade(order, result);
                }

                return result;
                
            } catch (Exception e) {
                log.error("交易订单执行失败: {}, error={}", order, e.getMessage(), e);
                return ExecutionResult.failed("交易执行异常: " + e.getMessage());
            }
        });
    }

    /**
     * 策略执行器内部类
     */
    private class StrategyExecutor {
        private final TradingStrategy strategy;
        private volatile boolean running = true;
        private LocalDateTime lastExecutionTime;

        public StrategyExecutor(TradingStrategy strategy) {
            this.strategy = strategy;
            this.lastExecutionTime = LocalDateTime.now();
        }

        public void execute() {
            if (!running || !globalTradingEnabled) {
                return;
            }

            try {
                // 获取最新市场数据
                List<MarketData> marketDataList = getLatestMarketData(strategy);
                
                for (MarketData marketData : marketDataList) {
                    // 评估策略条件
                    if (evaluateStrategyConditions(strategy, marketData)) {
                        // 生成交易信号
                        List<TradingOrder> orders = generateTradingOrders(strategy, marketData);
                        
                        // 执行交易订单
                        for (TradingOrder order : orders) {
                            executeOrder(order);
                        }
                    }
                }
                
                lastExecutionTime = LocalDateTime.now();
                
            } catch (Exception e) {
                log.error("策略执行异常: strategyId={}, error={}", strategy.getId(), e.getMessage(), e);
            }
        }

        public void stop() {
            this.running = false;
        }

        public boolean isRunning() {
            return running;
        }
    }

    /**
     * 获取最新市场数据
     */
    private List<MarketData> getLatestMarketData(TradingStrategy strategy) {
        // 根据策略配置获取相关市场数据
        String marketType = extractMarketTypeFromStrategy(strategy);
        return marketDataSyncService.getLatestMarketData(marketType, 10);
    }

    /**
     * 评估策略条件
     */
    private boolean evaluateStrategyConditions(TradingStrategy strategy, MarketData marketData) {
        try {
            // 解析策略条件
            Map<String, Object> conditions = parseStrategyConditions(strategy.getConditions());
            
            // 评估每个条件
            for (Map.Entry<String, Object> condition : conditions.entrySet()) {
                if (!evaluateCondition(condition.getKey(), condition.getValue(), marketData)) {
                    return false;
                }
            }
            
            return true;
            
        } catch (Exception e) {
            log.error("策略条件评估失败: strategyId={}, error={}", strategy.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * 生成交易订单
     */
    private List<TradingOrder> generateTradingOrders(TradingStrategy strategy, MarketData marketData) {
        List<TradingOrder> orders = new ArrayList<>();
        
        try {
            // 解析策略动作
            Map<String, Object> actions = parseStrategyActions(strategy.getActions());
            
            for (Map.Entry<String, Object> action : actions.entrySet()) {
                TradingOrder order = createTradingOrder(action.getKey(), action.getValue(), 
                    strategy, marketData);
                if (order != null) {
                    orders.add(order);
                }
            }
            
        } catch (Exception e) {
            log.error("生成交易订单失败: strategyId={}, error={}", strategy.getId(), e.getMessage());
        }
        
        return orders;
    }

    /**
     * 执行风险检查
     */
    private RiskCheckResult performRiskCheck(TradingOrder order) {
        // 检查资金充足性
        if (!checkCapitalSufficiency(order)) {
            return RiskCheckResult.failed("资金不足");
        }
        
        // 检查持仓限制
        if (!checkPositionLimits(order)) {
            return RiskCheckResult.failed("超出持仓限制");
        }
        
        // 检查交易频率
        if (!checkTradingFrequency(order)) {
            return RiskCheckResult.failed("交易频率过高");
        }
        
        // 检查价格合理性
        if (!checkPriceReasonableness(order)) {
            return RiskCheckResult.failed("价格异常");
        }
        
        return RiskCheckResult.passed();
    }

    /**
     * 执行具体交易
     */
    private ExecutionResult executeTradeOrder(TradingOrder order) {
        try {
            // 根据订单类型执行不同的交易逻辑
            switch (order.getType()) {
                case "BUY":
                    return executeBuyOrder(order);
                case "SELL":
                    return executeSellOrder(order);
                case "CHARGE":
                    return executeChargeOrder(order);
                case "DISCHARGE":
                    return executeDischargeOrder(order);
                default:
                    return ExecutionResult.failed("不支持的订单类型: " + order.getType());
            }
            
        } catch (Exception e) {
            log.error("交易执行失败: order={}, error={}", order, e.getMessage(), e);
            return ExecutionResult.failed("交易执行异常: " + e.getMessage());
        }
    }

    /**
     * 记录交易
     */
    private void recordTrade(TradingOrder order, ExecutionResult result) {
        try {
            TradingRecord record = TradingRecord.builder()
                .strategyId(order.getStrategyId())
                .resourceId(order.getResourceId())
                .marketType(order.getMarketType())
                .orderType(order.getType())
                .quantity(order.getQuantity())
                .price(result.getExecutionPrice())
                .amount(result.getExecutionAmount())
                .commission(result.getCommission())
                .status("EXECUTED")
                .executionTime(result.getExecutionTime())
                .createdAt(LocalDateTime.now())
                .build();
                
            tradingRecordRepository.save(record);
            
            log.info("交易记录已保存: {}", record);
            
        } catch (Exception e) {
            log.error("保存交易记录失败: order={}, result={}, error={}", 
                order, result, e.getMessage(), e);
        }
    }

    // 辅助方法实现
    private String extractMarketTypeFromStrategy(TradingStrategy strategy) {
        // 从策略配置中提取市场类型
        return "YUNNAN_SPOT"; // 简化实现
    }

    private Map<String, Object> parseStrategyConditions(String conditions) {
        // 解析策略条件JSON
        return new HashMap<>(); // 简化实现
    }

    private Map<String, Object> parseStrategyActions(String actions) {
        // 解析策略动作JSON
        return new HashMap<>(); // 简化实现
    }

    private boolean evaluateCondition(String conditionType, Object conditionValue, MarketData marketData) {
        // 实现具体的条件评估逻辑
        return true; // 简化实现
    }

    private TradingOrder createTradingOrder(String actionType, Object actionValue, 
                                          TradingStrategy strategy, MarketData marketData) {
        // 根据动作类型创建交易订单
        return null; // 简化实现
    }

    private boolean checkCapitalSufficiency(TradingOrder order) {
        // 检查资金充足性
        return true; // 简化实现
    }

    private boolean checkPositionLimits(TradingOrder order) {
        // 检查持仓限制
        return true; // 简化实现
    }

    private boolean checkTradingFrequency(TradingOrder order) {
        // 检查交易频率
        return true; // 简化实现
    }

    private boolean checkPriceReasonableness(TradingOrder order) {
        // 检查价格合理性
        return true; // 简化实现
    }

    private ExecutionResult executeBuyOrder(TradingOrder order) {
        // 执行买入订单
        return ExecutionResult.success(order.getPrice(), order.getQuantity().multiply(order.getPrice()));
    }

    private ExecutionResult executeSellOrder(TradingOrder order) {
        // 执行卖出订单
        return ExecutionResult.success(order.getPrice(), order.getQuantity().multiply(order.getPrice()));
    }

    private ExecutionResult executeChargeOrder(TradingOrder order) {
        // 执行充电订单
        return ExecutionResult.success(order.getPrice(), order.getQuantity().multiply(order.getPrice()));
    }

    private ExecutionResult executeDischargeOrder(TradingOrder order) {
        // 执行放电订单
        return ExecutionResult.success(order.getPrice(), order.getQuantity().multiply(order.getPrice()));
    }
}