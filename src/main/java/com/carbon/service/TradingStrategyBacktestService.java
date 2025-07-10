package com.carbon.service;

import com.carbon.dto.BacktestRequest;
import com.carbon.dto.BacktestResult;
import com.carbon.dto.BacktestReport;
import com.carbon.dto.PerformanceMetrics;
import com.carbon.entity.TradingStrategy;
import com.carbon.entity.MarketData;
import com.carbon.entity.BacktestRecord;
import com.carbon.repository.TradingStrategyRepository;
import com.carbon.repository.MarketDataRepository;
import com.carbon.repository.BacktestRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 交易策略回测和模拟服务
 * 提供策略历史数据回测、实时模拟、性能分析等功能
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TradingStrategyBacktestService {

    private final TradingStrategyRepository strategyRepository;
    private final MarketDataRepository marketDataRepository;
    private final BacktestRecordRepository backtestRecordRepository;
    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    /**
     * 执行策略回测
     */
    @Transactional
    public CompletableFuture<BacktestResult> runBacktest(BacktestRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("开始执行策略回测: strategyId={}, period={}-{}", 
                    request.getStrategyId(), request.getStartTime(), request.getEndTime());

                // 验证请求参数
                validateBacktestRequest(request);

                // 获取策略配置
                TradingStrategy strategy = strategyRepository.findById(request.getStrategyId())
                    .orElseThrow(() -> new RuntimeException("策略不存在: " + request.getStrategyId()));

                // 获取历史市场数据
                List<MarketData> marketDataList = getHistoricalMarketData(request);

                // 执行回测模拟
                BacktestResult result = executeBacktestSimulation(strategy, marketDataList, request);

                // 保存回测记录
                saveBacktestRecord(result, request);

                log.info("策略回测完成: strategyId={}, 总收益率={}", 
                    request.getStrategyId(), result.getTotalReturn());

                return result;
            } catch (Exception e) {
                log.error("策略回测失败: {}", e.getMessage(), e);
                throw new RuntimeException("策略回测失败: " + e.getMessage(), e);
            }
        }, executorService);
    }

    /**
     * 批量回测多个策略
     */
    public CompletableFuture<List<BacktestResult>> runBatchBacktest(List<BacktestRequest> requests) {
        List<CompletableFuture<BacktestResult>> futures = requests.stream()
            .map(this::runBacktest)
            .toList();

        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .toList());
    }

    /**
     * 获取回测报告
     */
    public BacktestReport generateBacktestReport(Long backtestId) {
        BacktestRecord record = backtestRecordRepository.findById(backtestId)
            .orElseThrow(() -> new RuntimeException("回测记录不存在: " + backtestId));

        return BacktestReport.builder()
            .backtestId(backtestId)
            .strategyId(record.getStrategyId())
            .strategyName(record.getStrategyName())
            .startTime(record.getStartTime())
            .endTime(record.getEndTime())
            .totalReturn(record.getTotalReturn())
            .annualizedReturn(record.getAnnualizedReturn())
            .maxDrawdown(record.getMaxDrawdown())
            .sharpeRatio(record.getSharpeRatio())
            .winRate(record.getWinRate())
            .totalTrades(record.getTotalTrades())
            .profitableTrades(record.getProfitableTrades())
            .averageProfit(record.getAverageProfit())
            .averageLoss(record.getAverageLoss())
            .maxConsecutiveWins(record.getMaxConsecutiveWins())
            .maxConsecutiveLosses(record.getMaxConsecutiveLosses())
            .createdAt(record.getCreatedAt())
            .build();
    }

    /**
     * 比较多个策略的回测结果
     */
    public List<BacktestReport> compareStrategies(List<Long> backtestIds) {
        return backtestIds.stream()
            .map(this::generateBacktestReport)
            .sorted((r1, r2) -> r2.getTotalReturn().compareTo(r1.getTotalReturn()))
            .toList();
    }

    /**
     * 获取策略历史回测记录
     */
    public List<BacktestRecord> getStrategyBacktestHistory(Long strategyId) {
        return backtestRecordRepository.findByStrategyIdOrderByCreatedAtDesc(strategyId);
    }

    /**
     * 验证回测请求参数
     */
    private void validateBacktestRequest(BacktestRequest request) {
        if (request.getStrategyId() == null) {
            throw new IllegalArgumentException("策略ID不能为空");
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new IllegalArgumentException("回测时间范围不能为空");
        }
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new IllegalArgumentException("开始时间不能晚于结束时间");
        }
        if (request.getInitialCapital() == null || request.getInitialCapital().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("初始资金必须大于0");
        }
    }

    /**
     * 获取历史市场数据
     */
    private List<MarketData> getHistoricalMarketData(BacktestRequest request) {
        return marketDataRepository.findByMarketTypeAndTimestampBetweenOrderByTimestamp(
            request.getMarketType(),
            request.getStartTime(),
            request.getEndTime()
        );
    }

    /**
     * 执行回测模拟
     */
    private BacktestResult executeBacktestSimulation(TradingStrategy strategy, 
                                                    List<MarketData> marketDataList, 
                                                    BacktestRequest request) {
        
        // 初始化回测状态
        BacktestSimulator simulator = new BacktestSimulator(
            request.getInitialCapital(),
            request.getCommissionRate(),
            request.getSlippageRate()
        );

        // 逐个处理市场数据点
        for (MarketData marketData : marketDataList) {
            // 评估策略条件
            boolean shouldTrade = evaluateStrategyConditions(strategy, marketData, simulator.getCurrentState());
            
            if (shouldTrade) {
                // 执行交易决策
                executeTradeDecision(strategy, marketData, simulator);
            }
            
            // 更新投资组合状态
            simulator.updatePortfolio(marketData);
        }

        // 计算性能指标
        PerformanceMetrics metrics = calculatePerformanceMetrics(simulator.getTradingHistory(), request);

        return BacktestResult.builder()
            .strategyId(strategy.getId())
            .strategyName(strategy.getName())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .initialCapital(request.getInitialCapital())
            .finalCapital(simulator.getCurrentCapital())
            .totalReturn(metrics.getTotalReturn())
            .annualizedReturn(metrics.getAnnualizedReturn())
            .maxDrawdown(metrics.getMaxDrawdown())
            .sharpeRatio(metrics.getSharpeRatio())
            .winRate(metrics.getWinRate())
            .totalTrades(metrics.getTotalTrades())
            .profitableTrades(metrics.getProfitableTrades())
            .averageProfit(metrics.getAverageProfit())
            .averageLoss(metrics.getAverageLoss())
            .maxConsecutiveWins(metrics.getMaxConsecutiveWins())
            .maxConsecutiveLosses(metrics.getMaxConsecutiveLosses())
            .tradingHistory(simulator.getTradingHistory())
            .portfolioHistory(simulator.getPortfolioHistory())
            .build();
    }

    /**
     * 评估策略条件
     */
    private boolean evaluateStrategyConditions(TradingStrategy strategy, MarketData marketData, 
                                             BacktestSimulator.SimulatorState state) {
        // 解析策略条件
        Map<String, Object> conditions = parseStrategyConditions(strategy.getConditions());
        
        // 评估每个条件
        for (Map.Entry<String, Object> condition : conditions.entrySet()) {
            if (!evaluateCondition(condition.getKey(), condition.getValue(), marketData, state)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 执行交易决策
     */
    private void executeTradeDecision(TradingStrategy strategy, MarketData marketData, 
                                     BacktestSimulator simulator) {
        // 解析策略动作
        Map<String, Object> actions = parseStrategyActions(strategy.getActions());
        
        for (Map.Entry<String, Object> action : actions.entrySet()) {
            executeAction(action.getKey(), action.getValue(), marketData, simulator);
        }
    }

    /**
     * 计算性能指标
     */
    private PerformanceMetrics calculatePerformanceMetrics(List<BacktestSimulator.Trade> trades, 
                                                         BacktestRequest request) {
        if (trades.isEmpty()) {
            return PerformanceMetrics.builder().build();
        }

        // 计算总收益率
        BigDecimal totalReturn = calculateTotalReturn(trades, request.getInitialCapital());
        
        // 计算年化收益率
        BigDecimal annualizedReturn = calculateAnnualizedReturn(totalReturn, request);
        
        // 计算最大回撤
        BigDecimal maxDrawdown = calculateMaxDrawdown(trades);
        
        // 计算夏普比率
        BigDecimal sharpeRatio = calculateSharpeRatio(trades);
        
        // 计算胜率
        BigDecimal winRate = calculateWinRate(trades);
        
        // 计算交易统计
        int totalTrades = trades.size();
        int profitableTrades = (int) trades.stream().filter(t -> t.getProfit().compareTo(BigDecimal.ZERO) > 0).count();
        
        BigDecimal averageProfit = calculateAverageProfit(trades);
        BigDecimal averageLoss = calculateAverageLoss(trades);
        
        int maxConsecutiveWins = calculateMaxConsecutiveWins(trades);
        int maxConsecutiveLosses = calculateMaxConsecutiveLosses(trades);

        return PerformanceMetrics.builder()
            .totalReturn(totalReturn)
            .annualizedReturn(annualizedReturn)
            .maxDrawdown(maxDrawdown)
            .sharpeRatio(sharpeRatio)
            .winRate(winRate)
            .totalTrades(totalTrades)
            .profitableTrades(profitableTrades)
            .averageProfit(averageProfit)
            .averageLoss(averageLoss)
            .maxConsecutiveWins(maxConsecutiveWins)
            .maxConsecutiveLosses(maxConsecutiveLosses)
            .build();
    }

    /**
     * 保存回测记录
     */
    private void saveBacktestRecord(BacktestResult result, BacktestRequest request) {
        BacktestRecord record = BacktestRecord.builder()
            .strategyId(result.getStrategyId())
            .strategyName(result.getStrategyName())
            .startTime(result.getStartTime())
            .endTime(result.getEndTime())
            .initialCapital(result.getInitialCapital())
            .finalCapital(result.getFinalCapital())
            .totalReturn(result.getTotalReturn())
            .annualizedReturn(result.getAnnualizedReturn())
            .maxDrawdown(result.getMaxDrawdown())
            .sharpeRatio(result.getSharpeRatio())
            .winRate(result.getWinRate())
            .totalTrades(result.getTotalTrades())
            .profitableTrades(result.getProfitableTrades())
            .averageProfit(result.getAverageProfit())
            .averageLoss(result.getAverageLoss())
            .maxConsecutiveWins(result.getMaxConsecutiveWins())
            .maxConsecutiveLosses(result.getMaxConsecutiveLosses())
            .marketType(request.getMarketType())
            .commissionRate(request.getCommissionRate())
            .slippageRate(request.getSlippageRate())
            .createdAt(LocalDateTime.now())
            .build();

        backtestRecordRepository.save(record);
    }

    // 辅助方法实现
    private Map<String, Object> parseStrategyConditions(String conditions) {
        // 实现策略条件解析逻辑
        return new HashMap<>();
    }

    private Map<String, Object> parseStrategyActions(String actions) {
        // 实现策略动作解析逻辑
        return new HashMap<>();
    }

    private boolean evaluateCondition(String conditionType, Object conditionValue, 
                                    MarketData marketData, BacktestSimulator.SimulatorState state) {
        // 实现条件评估逻辑
        return true;
    }

    private void executeAction(String actionType, Object actionValue, 
                             MarketData marketData, BacktestSimulator simulator) {
        // 实现动作执行逻辑
    }

    private BigDecimal calculateTotalReturn(List<BacktestSimulator.Trade> trades, BigDecimal initialCapital) {
        BigDecimal totalProfit = trades.stream()
            .map(BacktestSimulator.Trade::getProfit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return totalProfit.divide(initialCapital, 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAnnualizedReturn(BigDecimal totalReturn, BacktestRequest request) {
        // 计算年化收益率的简化实现
        return totalReturn;
    }

    private BigDecimal calculateMaxDrawdown(List<BacktestSimulator.Trade> trades) {
        // 计算最大回撤的简化实现
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateSharpeRatio(List<BacktestSimulator.Trade> trades) {
        // 计算夏普比率的简化实现
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateWinRate(List<BacktestSimulator.Trade> trades) {
        if (trades.isEmpty()) return BigDecimal.ZERO;
        
        long profitableTrades = trades.stream()
            .filter(t -> t.getProfit().compareTo(BigDecimal.ZERO) > 0)
            .count();
        
        return BigDecimal.valueOf(profitableTrades)
            .divide(BigDecimal.valueOf(trades.size()), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAverageProfit(List<BacktestSimulator.Trade> trades) {
        List<BigDecimal> profits = trades.stream()
            .map(BacktestSimulator.Trade::getProfit)
            .filter(p -> p.compareTo(BigDecimal.ZERO) > 0)
            .toList();
        
        if (profits.isEmpty()) return BigDecimal.ZERO;
        
        return profits.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(profits.size()), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAverageLoss(List<BacktestSimulator.Trade> trades) {
        List<BigDecimal> losses = trades.stream()
            .map(BacktestSimulator.Trade::getProfit)
            .filter(p -> p.compareTo(BigDecimal.ZERO) < 0)
            .toList();
        
        if (losses.isEmpty()) return BigDecimal.ZERO;
        
        return losses.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(losses.size()), 4, RoundingMode.HALF_UP);
    }

    private int calculateMaxConsecutiveWins(List<BacktestSimulator.Trade> trades) {
        int maxWins = 0;
        int currentWins = 0;
        
        for (BacktestSimulator.Trade trade : trades) {
            if (trade.getProfit().compareTo(BigDecimal.ZERO) > 0) {
                currentWins++;
                maxWins = Math.max(maxWins, currentWins);
            } else {
                currentWins = 0;
            }
        }
        
        return maxWins;
    }

    private int calculateMaxConsecutiveLosses(List<BacktestSimulator.Trade> trades) {
        int maxLosses = 0;
        int currentLosses = 0;
        
        for (BacktestSimulator.Trade trade : trades) {
            if (trade.getProfit().compareTo(BigDecimal.ZERO) < 0) {
                currentLosses++;
                maxLosses = Math.max(maxLosses, currentLosses);
            } else {
                currentLosses = 0;
            }
        }
        
        return maxLosses;
    }
}