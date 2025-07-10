package com.carbon.service;

import com.carbon.entity.MarketData;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 回测模拟器
 * 模拟交易执行和投资组合管理
 */
@Slf4j
@Getter
public class BacktestSimulator {

    private final BigDecimal initialCapital;
    private final BigDecimal commissionRate;
    private final BigDecimal slippageRate;
    
    private BigDecimal currentCapital;
    private final Map<String, Position> positions;
    private final List<Trade> tradingHistory;
    private final List<PortfolioSnapshot> portfolioHistory;
    private SimulatorState currentState;

    public BacktestSimulator(BigDecimal initialCapital, BigDecimal commissionRate, BigDecimal slippageRate) {
        this.initialCapital = initialCapital;
        this.commissionRate = commissionRate != null ? commissionRate : BigDecimal.valueOf(0.001); // 默认0.1%手续费
        this.slippageRate = slippageRate != null ? slippageRate : BigDecimal.valueOf(0.0005); // 默认0.05%滑点
        
        this.currentCapital = initialCapital;
        this.positions = new HashMap<>();
        this.tradingHistory = new ArrayList<>();
        this.portfolioHistory = new ArrayList<>();
        this.currentState = new SimulatorState();
    }

    /**
     * 执行买入操作
     */
    public void executeBuy(String symbol, BigDecimal quantity, BigDecimal price, LocalDateTime timestamp) {
        // 计算交易成本
        BigDecimal tradeValue = quantity.multiply(price);
        BigDecimal commission = tradeValue.multiply(commissionRate);
        BigDecimal slippage = tradeValue.multiply(slippageRate);
        BigDecimal totalCost = tradeValue.add(commission).add(slippage);

        // 检查资金是否充足
        if (currentCapital.compareTo(totalCost) < 0) {
            log.warn("资金不足，无法执行买入: symbol={}, quantity={}, price={}, required={}, available={}",
                symbol, quantity, price, totalCost, currentCapital);
            return;
        }

        // 更新持仓
        Position position = positions.computeIfAbsent(symbol, k -> new Position(symbol));
        position.addPosition(quantity, price);

        // 更新资金
        currentCapital = currentCapital.subtract(totalCost);

        // 记录交易
        Trade trade = Trade.builder()
            .symbol(symbol)
            .type(TradeType.BUY)
            .quantity(quantity)
            .price(price)
            .commission(commission)
            .slippage(slippage)
            .timestamp(timestamp)
            .build();
        
        tradingHistory.add(trade);
        
        log.debug("执行买入: symbol={}, quantity={}, price={}, cost={}", 
            symbol, quantity, price, totalCost);
    }

    /**
     * 执行卖出操作
     */
    public void executeSell(String symbol, BigDecimal quantity, BigDecimal price, LocalDateTime timestamp) {
        Position position = positions.get(symbol);
        if (position == null || position.getQuantity().compareTo(quantity) < 0) {
            log.warn("持仓不足，无法执行卖出: symbol={}, quantity={}, available={}",
                symbol, quantity, position != null ? position.getQuantity() : BigDecimal.ZERO);
            return;
        }

        // 计算交易收入
        BigDecimal tradeValue = quantity.multiply(price);
        BigDecimal commission = tradeValue.multiply(commissionRate);
        BigDecimal slippage = tradeValue.multiply(slippageRate);
        BigDecimal netIncome = tradeValue.subtract(commission).subtract(slippage);

        // 计算盈亏
        BigDecimal avgCost = position.getAverageCost();
        BigDecimal profit = quantity.multiply(price.subtract(avgCost)).subtract(commission).subtract(slippage);

        // 更新持仓
        position.reducePosition(quantity);
        if (position.getQuantity().compareTo(BigDecimal.ZERO) == 0) {
            positions.remove(symbol);
        }

        // 更新资金
        currentCapital = currentCapital.add(netIncome);

        // 记录交易
        Trade trade = Trade.builder()
            .symbol(symbol)
            .type(TradeType.SELL)
            .quantity(quantity)
            .price(price)
            .commission(commission)
            .slippage(slippage)
            .profit(profit)
            .timestamp(timestamp)
            .build();
        
        tradingHistory.add(trade);
        
        log.debug("执行卖出: symbol={}, quantity={}, price={}, income={}, profit={}", 
            symbol, quantity, price, netIncome, profit);
    }

    /**
     * 更新投资组合状态
     */
    public void updatePortfolio(MarketData marketData) {
        // 计算持仓市值
        BigDecimal totalMarketValue = BigDecimal.ZERO;
        for (Position position : positions.values()) {
            if (position.getSymbol().equals(marketData.getSymbol())) {
                BigDecimal marketValue = position.getQuantity().multiply(marketData.getPrice());
                totalMarketValue = totalMarketValue.add(marketValue);
                position.setCurrentPrice(marketData.getPrice());
            }
        }

        // 计算总资产
        BigDecimal totalAssets = currentCapital.add(totalMarketValue);
        
        // 计算收益率
        BigDecimal totalReturn = totalAssets.subtract(initialCapital)
            .divide(initialCapital, 4, RoundingMode.HALF_UP);

        // 更新状态
        currentState.setTotalAssets(totalAssets);
        currentState.setTotalReturn(totalReturn);
        currentState.setMarketValue(totalMarketValue);
        currentState.setCashBalance(currentCapital);
        currentState.setLastUpdateTime(marketData.getTimestamp());

        // 记录投资组合快照
        PortfolioSnapshot snapshot = PortfolioSnapshot.builder()
            .timestamp(marketData.getTimestamp())
            .totalAssets(totalAssets)
            .cashBalance(currentCapital)
            .marketValue(totalMarketValue)
            .totalReturn(totalReturn)
            .positionCount(positions.size())
            .build();
        
        portfolioHistory.add(snapshot);
    }

    /**
     * 获取指定品种的持仓
     */
    public Position getPosition(String symbol) {
        return positions.get(symbol);
    }

    /**
     * 检查是否有足够资金
     */
    public boolean hasEnoughCapital(BigDecimal requiredAmount) {
        return currentCapital.compareTo(requiredAmount) >= 0;
    }

    /**
     * 检查是否有足够持仓
     */
    public boolean hasEnoughPosition(String symbol, BigDecimal requiredQuantity) {
        Position position = positions.get(symbol);
        return position != null && position.getQuantity().compareTo(requiredQuantity) >= 0;
    }

    /**
     * 持仓信息
     */
    @Data
    public static class Position {
        private final String symbol;
        private BigDecimal quantity = BigDecimal.ZERO;
        private BigDecimal totalCost = BigDecimal.ZERO;
        private BigDecimal currentPrice = BigDecimal.ZERO;

        public Position(String symbol) {
            this.symbol = symbol;
        }

        public void addPosition(BigDecimal qty, BigDecimal price) {
            BigDecimal cost = qty.multiply(price);
            this.totalCost = this.totalCost.add(cost);
            this.quantity = this.quantity.add(qty);
        }

        public void reducePosition(BigDecimal qty) {
            if (this.quantity.compareTo(qty) >= 0) {
                BigDecimal avgCost = getAverageCost();
                BigDecimal reducedCost = qty.multiply(avgCost);
                this.totalCost = this.totalCost.subtract(reducedCost);
                this.quantity = this.quantity.subtract(qty);
            }
        }

        public BigDecimal getAverageCost() {
            if (quantity.compareTo(BigDecimal.ZERO) == 0) {
                return BigDecimal.ZERO;
            }
            return totalCost.divide(quantity, 4, RoundingMode.HALF_UP);
        }

        public BigDecimal getMarketValue() {
            return quantity.multiply(currentPrice);
        }

        public BigDecimal getUnrealizedPnL() {
            return getMarketValue().subtract(totalCost);
        }
    }

    /**
     * 交易记录
     */
    @Data
    @Builder
    public static class Trade {
        private String symbol;
        private TradeType type;
        private BigDecimal quantity;
        private BigDecimal price;
        private BigDecimal commission;
        private BigDecimal slippage;
        private BigDecimal profit; // 仅卖出时有值
        private LocalDateTime timestamp;
    }

    /**
     * 投资组合快照
     */
    @Data
    @Builder
    public static class PortfolioSnapshot {
        private LocalDateTime timestamp;
        private BigDecimal totalAssets;
        private BigDecimal cashBalance;
        private BigDecimal marketValue;
        private BigDecimal totalReturn;
        private int positionCount;
    }

    /**
     * 模拟器状态
     */
    @Data
    public static class SimulatorState {
        private BigDecimal totalAssets = BigDecimal.ZERO;
        private BigDecimal totalReturn = BigDecimal.ZERO;
        private BigDecimal marketValue = BigDecimal.ZERO;
        private BigDecimal cashBalance = BigDecimal.ZERO;
        private LocalDateTime lastUpdateTime;
    }

    /**
     * 交易类型
     */
    public enum TradeType {
        BUY, SELL
    }
}