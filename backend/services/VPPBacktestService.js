/**
 * 虚拟电厂回测仿真服务
 * 负责策略的历史数据回测、性能分析和风险评估
 * P1阶段核心功能：回测仿真功能
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const vppDatabase = require('./vppDatabase');
const { VPPStrategyService } = require('./VPPStrategyService');

// 回测状态枚举
const BACKTEST_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// 回测类型枚举
const BACKTEST_TYPES = {
  STRATEGY_VALIDATION: 'STRATEGY_VALIDATION',
  PERFORMANCE_ANALYSIS: 'PERFORMANCE_ANALYSIS',
  RISK_ASSESSMENT: 'RISK_ASSESSMENT',
  PARAMETER_OPTIMIZATION: 'PARAMETER_OPTIMIZATION'
};

// 市场数据源枚举
const DATA_SOURCES = {
  HISTORICAL_DB: 'HISTORICAL_DB',
  EXTERNAL_API: 'EXTERNAL_API',
  SIMULATION: 'SIMULATION',
  HYBRID: 'HYBRID'
};

class VPPBacktestService {
  constructor() {
    this.backtestTasks = new Map();
    this.backtestResults = new Map();
    this.strategyService = new VPPStrategyService();
    this.runningTasks = new Set();
  }

  /**
   * 创建回测任务
   * @param {Object} backtestConfig - 回测配置
   * @returns {Promise<Object>} 回测任务信息
   */
  async createBacktest(backtestConfig) {
    try {
      const taskId = uuidv4();
      const now = new Date();
      
      // 验证回测配置
      this.validateBacktestConfig(backtestConfig);
      
      const backtestTask = {
        id: taskId,
        strategy_id: backtestConfig.strategy_id,
        backtest_type: backtestConfig.backtest_type || BACKTEST_TYPES.STRATEGY_VALIDATION,
        start_date: new Date(backtestConfig.start_date),
        end_date: new Date(backtestConfig.end_date),
        data_source: backtestConfig.data_source || DATA_SOURCES.HISTORICAL_DB,
        config: JSON.stringify(backtestConfig.config || {}),
        status: BACKTEST_STATUS.PENDING,
        progress: 0,
        created_at: now,
        updated_at: now,
        started_at: null,
        completed_at: null
      };
      
      // 插入数据库
      const query = `
        INSERT INTO backtest_tasks 
        (id, strategy_id, backtest_type, start_date, end_date, data_source, 
         config, status, progress, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await vppDatabase.execute(query, [
        backtestTask.id, backtestTask.strategy_id, backtestTask.backtest_type,
        backtestTask.start_date, backtestTask.end_date, backtestTask.data_source,
        backtestTask.config, backtestTask.status, backtestTask.progress,
        backtestTask.created_at, backtestTask.updated_at
      ]);
      
      // 更新缓存
      this.backtestTasks.set(taskId, {
        ...backtestTask,
        config: backtestConfig.config || {}
      });
      
      logger.info(`回测任务创建成功: ${taskId}`, { strategy_id: backtestConfig.strategy_id });
      
      return {
        task_id: taskId,
        status: backtestTask.status,
        created_at: backtestTask.created_at
      };
      
    } catch (error) {
      logger.error('创建回测任务失败:', error);
      throw new Error(`创建回测任务失败: ${error.message}`);
    }
  }

  /**
   * 执行回测任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 执行结果
   */
  async executeBacktest(taskId) {
    try {
      const task = await this.getBacktestTask(taskId);
      
      if (!task) {
        throw new Error('回测任务不存在');
      }
      
      if (task.status !== BACKTEST_STATUS.PENDING) {
        throw new Error('任务状态不允许执行');
      }
      
      if (this.runningTasks.has(taskId)) {
        throw new Error('任务已在执行中');
      }
      
      // 标记任务开始
      this.runningTasks.add(taskId);
      await this.updateTaskStatus(taskId, BACKTEST_STATUS.RUNNING, 0);
      
      // 异步执行回测
      this.runBacktestAsync(taskId).catch(error => {
        logger.error(`回测任务执行失败: ${taskId}`, error);
        this.updateTaskStatus(taskId, BACKTEST_STATUS.FAILED, 0);
        this.runningTasks.delete(taskId);
      });
      
      return {
        task_id: taskId,
        status: BACKTEST_STATUS.RUNNING,
        message: '回测任务已开始执行'
      };
      
    } catch (error) {
      logger.error('执行回测任务失败:', error);
      throw new Error(`执行回测任务失败: ${error.message}`);
    }
  }

  /**
   * 异步执行回测
   * @param {string} taskId - 任务ID
   */
  async runBacktestAsync(taskId) {
    try {
      const task = await this.getBacktestTask(taskId);
      const strategy = await this.strategyService.getStrategyById(task.strategy_id);
      
      // 获取历史数据
      await this.updateTaskStatus(taskId, BACKTEST_STATUS.RUNNING, 10);
      const historicalData = await this.getHistoricalData(task);
      
      // 执行回测
      await this.updateTaskStatus(taskId, BACKTEST_STATUS.RUNNING, 30);
      const backtestResults = await this.performBacktest(strategy, historicalData, task);
      
      // 分析结果
      await this.updateTaskStatus(taskId, BACKTEST_STATUS.RUNNING, 80);
      const analysis = await this.analyzeResults(backtestResults, task);
      
      // 生成报告
      await this.updateTaskStatus(taskId, BACKTEST_STATUS.RUNNING, 95);
      const report = await this.generateReport(backtestResults, analysis, task);
      
      // 保存结果
      const finalResult = {
        task_id: taskId,
        strategy_id: task.strategy_id,
        backtest_results: backtestResults,
        analysis: analysis,
        report: report,
        completed_at: new Date()
      };
      
      await this.saveBacktestResults(taskId, finalResult);
      this.backtestResults.set(taskId, finalResult);
      
      // 标记完成
      await this.updateTaskStatus(taskId, BACKTEST_STATUS.COMPLETED, 100);
      this.runningTasks.delete(taskId);
      
      logger.info(`回测任务完成: ${taskId}`);
      
    } catch (error) {
      logger.error(`回测任务执行失败: ${taskId}`, error);
      await this.updateTaskStatus(taskId, BACKTEST_STATUS.FAILED, 0);
      this.runningTasks.delete(taskId);
      throw error;
    }
  }

  /**
   * 获取历史数据
   * @param {Object} task - 回测任务
   * @returns {Promise<Object>} 历史数据
   */
  async getHistoricalData(task) {
    try {
      const { start_date, end_date, data_source } = task;
      
      switch (data_source) {
        case DATA_SOURCES.HISTORICAL_DB:
          return await this.getHistoricalDataFromDB(start_date, end_date);
        case DATA_SOURCES.EXTERNAL_API:
          return await this.getHistoricalDataFromAPI(start_date, end_date);
        case DATA_SOURCES.SIMULATION:
          return await this.generateSimulatedData(start_date, end_date);
        case DATA_SOURCES.HYBRID:
          return await this.getHybridHistoricalData(start_date, end_date);
        default:
          throw new Error(`不支持的数据源: ${data_source}`);
      }
    } catch (error) {
      logger.error('获取历史数据失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库获取历史数据
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 历史数据
   */
  async getHistoricalDataFromDB(startDate, endDate) {
    // 模拟从数据库获取历史数据
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const marketData = [];
    const vppData = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      // 生成24小时的数据点
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(date.getTime() + hour * 60 * 60 * 1000);
        
        marketData.push({
          timestamp,
          price: 50 + Math.sin(hour / 24 * 2 * Math.PI) * 20 + Math.random() * 10,
          volume: 1000 + Math.random() * 500,
          demand: 800 + Math.sin(hour / 24 * 2 * Math.PI) * 200 + Math.random() * 100
        });
        
        vppData.push({
          timestamp,
          available_capacity: 500 + Math.random() * 200,
          generation: 300 + Math.random() * 150,
          storage_soc: 0.5 + Math.random() * 0.4,
          load: 200 + Math.random() * 100
        });
      }
    }
    
    return { marketData, vppData };
  }

  /**
   * 从外部API获取历史数据
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 历史数据
   */
  async getHistoricalDataFromAPI(startDate, endDate) {
    // TODO: 实现外部API数据获取
    // 这里先返回模拟数据
    return await this.getHistoricalDataFromDB(startDate, endDate);
  }

  /**
   * 生成模拟数据
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 模拟数据
   */
  async generateSimulatedData(startDate, endDate) {
    return await this.getHistoricalDataFromDB(startDate, endDate);
  }

  /**
   * 获取混合历史数据
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 混合数据
   */
  async getHybridHistoricalData(startDate, endDate) {
    const dbData = await this.getHistoricalDataFromDB(startDate, endDate);
    const simulatedData = await this.generateSimulatedData(startDate, endDate);
    
    // 合并数据
    return {
      marketData: [...dbData.marketData, ...simulatedData.marketData],
      vppData: [...dbData.vppData, ...simulatedData.vppData]
    };
  }

  /**
   * 执行回测
   * @param {Object} strategy - 策略对象
   * @param {Object} historicalData - 历史数据
   * @param {Object} task - 回测任务
   * @returns {Promise<Object>} 回测结果
   */
  async performBacktest(strategy, historicalData, task) {
    const { marketData, vppData } = historicalData;
    const results = [];
    const trades = [];
    let totalRevenue = 0;
    let totalCost = 0;
    let successfulTrades = 0;
    
    // 按时间顺序执行策略
    for (let i = 0; i < marketData.length; i++) {
      const currentMarketData = marketData[i];
      const currentVppData = vppData[i];
      
      try {
        // 执行策略
        const strategyResult = await this.strategyService.executeStrategy(
          strategy.id,
          currentMarketData,
          currentVppData
        );
        
        // 模拟交易执行
        const tradeResult = this.simulateTradeExecution(
          strategyResult,
          currentMarketData,
          currentVppData
        );
        
        results.push({
          timestamp: currentMarketData.timestamp,
          strategy_result: strategyResult,
          trade_result: tradeResult,
          market_data: currentMarketData,
          vpp_data: currentVppData
        });
        
        if (tradeResult.executed) {
          trades.push(tradeResult);
          totalRevenue += tradeResult.revenue || 0;
          totalCost += tradeResult.cost || 0;
          if (tradeResult.success) {
            successfulTrades++;
          }
        }
        
        // 更新进度
        if (i % Math.floor(marketData.length / 10) === 0) {
          const progress = 30 + Math.floor((i / marketData.length) * 50);
          await this.updateTaskStatus(task.id, BACKTEST_STATUS.RUNNING, progress);
        }
        
      } catch (error) {
        logger.warn(`策略执行失败 (时间点: ${currentMarketData.timestamp}):`, error);
        results.push({
          timestamp: currentMarketData.timestamp,
          error: error.message,
          market_data: currentMarketData,
          vpp_data: currentVppData
        });
      }
    }
    
    return {
      strategy_id: strategy.id,
      total_data_points: marketData.length,
      successful_executions: results.filter(r => !r.error).length,
      failed_executions: results.filter(r => r.error).length,
      total_trades: trades.length,
      successful_trades: successfulTrades,
      total_revenue: totalRevenue,
      total_cost: totalCost,
      net_profit: totalRevenue - totalCost,
      results: results,
      trades: trades
    };
  }

  /**
   * 模拟交易执行
   * @param {Object} strategyResult - 策略结果
   * @param {Object} marketData - 市场数据
   * @param {Object} vppData - VPP数据
   * @returns {Object} 交易结果
   */
  simulateTradeExecution(strategyResult, marketData, vppData) {
    const { actions } = strategyResult;
    
    let bidPrice = null;
    let bidQuantity = null;
    
    // 提取报价信息
    for (const action of actions) {
      if (action.type === 'bid_price') {
        bidPrice = action.value;
      } else if (action.type === 'bid_quantity') {
        bidQuantity = action.value;
      }
    }
    
    if (bidPrice === null || bidQuantity === null) {
      return {
        executed: false,
        reason: 'no_bid_submitted'
      };
    }
    
    // 模拟市场出清
    const marketPrice = marketData.price;
    const marketVolume = marketData.volume;
    
    // 简单的出清逻辑：如果报价合理且有足够容量，则成交
    const priceAcceptable = Math.abs(bidPrice - marketPrice) / marketPrice < 0.1; // 10%价差内
    const volumeAvailable = bidQuantity <= marketVolume;
    const capacityAvailable = bidQuantity <= vppData.available_capacity;
    
    if (priceAcceptable && volumeAvailable && capacityAvailable) {
      const clearedPrice = marketPrice;
      const clearedQuantity = bidQuantity;
      const revenue = clearedPrice * clearedQuantity;
      const cost = clearedQuantity * 30; // 假设成本为30元/MWh
      
      return {
        executed: true,
        success: true,
        bid_price: bidPrice,
        bid_quantity: bidQuantity,
        cleared_price: clearedPrice,
        cleared_quantity: clearedQuantity,
        revenue: revenue,
        cost: cost,
        profit: revenue - cost,
        timestamp: marketData.timestamp
      };
    } else {
      return {
        executed: true,
        success: false,
        bid_price: bidPrice,
        bid_quantity: bidQuantity,
        reason: !priceAcceptable ? 'price_not_competitive' :
                !volumeAvailable ? 'insufficient_market_volume' :
                'insufficient_capacity',
        timestamp: marketData.timestamp
      };
    }
  }

  /**
   * 分析回测结果
   * @param {Object} backtestResults - 回测结果
   * @param {Object} task - 回测任务
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeResults(backtestResults, task) {
    const { trades, total_trades, successful_trades, total_revenue, total_cost, net_profit } = backtestResults;
    
    // 基础性能指标
    const successRate = total_trades > 0 ? successful_trades / total_trades : 0;
    const averageRevenue = total_trades > 0 ? total_revenue / total_trades : 0;
    const profitMargin = total_revenue > 0 ? net_profit / total_revenue : 0;
    
    // 风险指标
    const profits = trades.filter(t => t.success).map(t => t.profit || 0);
    const losses = trades.filter(t => t.success && (t.profit || 0) < 0).map(t => Math.abs(t.profit || 0));
    
    const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;
    const maxLoss = losses.length > 0 ? Math.max(...losses) : 0;
    const avgProfit = profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    
    // 夏普比率（简化计算）
    const profitStdDev = this.calculateStandardDeviation(profits);
    const sharpeRatio = profitStdDev > 0 ? avgProfit / profitStdDev : 0;
    
    // 最大回撤
    const maxDrawdown = this.calculateMaxDrawdown(trades);
    
    // 时间分析
    const timeAnalysis = this.analyzeTimePatterns(trades);
    
    // 市场条件分析
    const marketAnalysis = this.analyzeMarketConditions(backtestResults.results);
    
    return {
      performance_metrics: {
        total_trades,
        successful_trades,
        success_rate: Math.round(successRate * 10000) / 100, // 百分比，保留2位小数
        total_revenue: Math.round(total_revenue * 100) / 100,
        total_cost: Math.round(total_cost * 100) / 100,
        net_profit: Math.round(net_profit * 100) / 100,
        profit_margin: Math.round(profitMargin * 10000) / 100,
        average_revenue: Math.round(averageRevenue * 100) / 100
      },
      risk_metrics: {
        max_profit: Math.round(maxProfit * 100) / 100,
        max_loss: Math.round(maxLoss * 100) / 100,
        average_profit: Math.round(avgProfit * 100) / 100,
        average_loss: Math.round(avgLoss * 100) / 100,
        sharpe_ratio: Math.round(sharpeRatio * 100) / 100,
        max_drawdown: Math.round(maxDrawdown * 100) / 100,
        profit_loss_ratio: avgLoss > 0 ? Math.round((avgProfit / avgLoss) * 100) / 100 : 0
      },
      time_analysis: timeAnalysis,
      market_analysis: marketAnalysis,
      recommendations: this.generateRecommendations({
        successRate,
        profitMargin,
        sharpeRatio,
        maxDrawdown
      })
    };
  }

  /**
   * 计算标准差
   * @param {Array} values - 数值数组
   * @returns {number} 标准差
   */
  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * 计算最大回撤
   * @param {Array} trades - 交易数组
   * @returns {number} 最大回撤
   */
  calculateMaxDrawdown(trades) {
    if (trades.length === 0) return 0;
    
    let cumulativeProfit = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    for (const trade of trades) {
      if (trade.success) {
        cumulativeProfit += trade.profit || 0;
        peak = Math.max(peak, cumulativeProfit);
        const drawdown = peak - cumulativeProfit;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown;
  }

  /**
   * 分析时间模式
   * @param {Array} trades - 交易数组
   * @returns {Object} 时间分析结果
   */
  analyzeTimePatterns(trades) {
    const hourlyPerformance = new Array(24).fill(0).map(() => ({ trades: 0, profit: 0 }));
    const dailyPerformance = {};
    
    for (const trade of trades) {
      if (trade.success && trade.timestamp) {
        const hour = new Date(trade.timestamp).getHours();
        const date = new Date(trade.timestamp).toDateString();
        
        hourlyPerformance[hour].trades++;
        hourlyPerformance[hour].profit += trade.profit || 0;
        
        if (!dailyPerformance[date]) {
          dailyPerformance[date] = { trades: 0, profit: 0 };
        }
        dailyPerformance[date].trades++;
        dailyPerformance[date].profit += trade.profit || 0;
      }
    }
    
    // 找出最佳和最差时段
    const bestHour = hourlyPerformance.reduce((best, current, index) => 
      current.profit > hourlyPerformance[best].profit ? index : best, 0);
    const worstHour = hourlyPerformance.reduce((worst, current, index) => 
      current.profit < hourlyPerformance[worst].profit ? index : worst, 0);
    
    return {
      hourly_performance: hourlyPerformance,
      best_trading_hour: bestHour,
      worst_trading_hour: worstHour,
      daily_performance: Object.keys(dailyPerformance).map(date => ({
        date,
        ...dailyPerformance[date]
      }))
    };
  }

  /**
   * 分析市场条件
   * @param {Array} results - 回测结果
   * @returns {Object} 市场分析结果
   */
  analyzeMarketConditions(results) {
    const priceRanges = {
      low: { min: 0, max: 40, trades: 0, profit: 0 },
      medium: { min: 40, max: 80, trades: 0, profit: 0 },
      high: { min: 80, max: Infinity, trades: 0, profit: 0 }
    };
    
    const volatilityRanges = {
      low: { trades: 0, profit: 0 },
      medium: { trades: 0, profit: 0 },
      high: { trades: 0, profit: 0 }
    };
    
    for (const result of results) {
      if (result.trade_result && result.trade_result.success) {
        const price = result.market_data.price;
        const profit = result.trade_result.profit || 0;
        
        // 价格区间分析
        if (price < 40) {
          priceRanges.low.trades++;
          priceRanges.low.profit += profit;
        } else if (price < 80) {
          priceRanges.medium.trades++;
          priceRanges.medium.profit += profit;
        } else {
          priceRanges.high.trades++;
          priceRanges.high.profit += profit;
        }
        
        // 波动性分析（简化）
        const volatility = Math.abs(price - 60) / 60; // 以60为基准价格
        if (volatility < 0.1) {
          volatilityRanges.low.trades++;
          volatilityRanges.low.profit += profit;
        } else if (volatility < 0.3) {
          volatilityRanges.medium.trades++;
          volatilityRanges.medium.profit += profit;
        } else {
          volatilityRanges.high.trades++;
          volatilityRanges.high.profit += profit;
        }
      }
    }
    
    return {
      price_range_analysis: priceRanges,
      volatility_analysis: volatilityRanges,
      optimal_conditions: this.identifyOptimalConditions(priceRanges, volatilityRanges)
    };
  }

  /**
   * 识别最优市场条件
   * @param {Object} priceRanges - 价格区间分析
   * @param {Object} volatilityRanges - 波动性分析
   * @returns {Object} 最优条件
   */
  identifyOptimalConditions(priceRanges, volatilityRanges) {
    // 找出最盈利的价格区间
    const bestPriceRange = Object.keys(priceRanges).reduce((best, current) => 
      priceRanges[current].profit > priceRanges[best].profit ? current : best);
    
    // 找出最盈利的波动性区间
    const bestVolatilityRange = Object.keys(volatilityRanges).reduce((best, current) => 
      volatilityRanges[current].profit > volatilityRanges[best].profit ? current : best);
    
    return {
      optimal_price_range: bestPriceRange,
      optimal_volatility_range: bestVolatilityRange,
      recommendations: [
        `策略在${bestPriceRange}价格区间表现最佳`,
        `策略在${bestVolatilityRange}波动性环境下表现最佳`,
        '建议在相应市场条件下增加交易频率'
      ]
    };
  }

  /**
   * 生成优化建议
   * @param {Object} metrics - 性能指标
   * @returns {Array} 建议列表
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.successRate < 0.6) {
      recommendations.push('成功率较低，建议优化策略条件或调整参数');
    }
    
    if (metrics.profitMargin < 0.1) {
      recommendations.push('利润率偏低，建议检查成本控制和定价策略');
    }
    
    if (metrics.sharpeRatio < 1) {
      recommendations.push('风险调整收益较低，建议优化风险管理');
    }
    
    if (metrics.maxDrawdown > 0.2) {
      recommendations.push('最大回撤过大，建议增加止损机制');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('策略表现良好，可考虑增加投入规模');
    }
    
    return recommendations;
  }

  /**
   * 生成回测报告
   * @param {Object} backtestResults - 回测结果
   * @param {Object} analysis - 分析结果
   * @param {Object} task - 回测任务
   * @returns {Promise<Object>} 报告
   */
  async generateReport(backtestResults, analysis, task) {
    const strategy = await this.strategyService.getStrategyById(task.strategy_id);
    
    return {
      executive_summary: {
        strategy_name: strategy.name,
        backtest_period: `${task.start_date.toDateString()} - ${task.end_date.toDateString()}`,
        total_trades: backtestResults.total_trades,
        success_rate: analysis.performance_metrics.success_rate,
        net_profit: analysis.performance_metrics.net_profit,
        sharpe_ratio: analysis.risk_metrics.sharpe_ratio,
        max_drawdown: analysis.risk_metrics.max_drawdown
      },
      detailed_analysis: analysis,
      key_insights: [
        `策略在回测期间执行了${backtestResults.total_trades}笔交易`,
        `成功率为${analysis.performance_metrics.success_rate}%`,
        `净利润为${analysis.performance_metrics.net_profit}元`,
        `最大回撤为${analysis.risk_metrics.max_drawdown}元`
      ],
      recommendations: analysis.recommendations,
      charts_data: {
        profit_curve: this.generateProfitCurve(backtestResults.trades),
        hourly_performance: analysis.time_analysis.hourly_performance,
        price_performance: analysis.market_analysis.price_range_analysis
      },
      generated_at: new Date()
    };
  }

  /**
   * 生成利润曲线数据
   * @param {Array} trades - 交易数组
   * @returns {Array} 利润曲线数据
   */
  generateProfitCurve(trades) {
    let cumulativeProfit = 0;
    const curve = [];
    
    for (const trade of trades) {
      if (trade.success) {
        cumulativeProfit += trade.profit || 0;
        curve.push({
          timestamp: trade.timestamp,
          cumulative_profit: Math.round(cumulativeProfit * 100) / 100
        });
      }
    }
    
    return curve;
  }

  /**
   * 保存回测结果
   * @param {string} taskId - 任务ID
   * @param {Object} results - 结果数据
   */
  async saveBacktestResults(taskId, results) {
    try {
      const query = `
        INSERT INTO backtest_results 
        (task_id, strategy_id, results_data, analysis_data, report_data, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await vppDatabase.execute(query, [
        taskId,
        results.strategy_id,
        JSON.stringify(results.backtest_results),
        JSON.stringify(results.analysis),
        JSON.stringify(results.report),
        new Date()
      ]);
      
    } catch (error) {
      logger.error('保存回测结果失败:', error);
      throw error;
    }
  }

  /**
   * 获取回测任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 任务信息
   */
  async getBacktestTask(taskId) {
    try {
      // 先从缓存获取
      if (this.backtestTasks.has(taskId)) {
        return this.backtestTasks.get(taskId);
      }
      
      const query = 'SELECT * FROM backtest_tasks WHERE id = ?';
      const tasks = await vppDatabase.query(query, [taskId]);
      
      if (tasks.length === 0) {
        return null;
      }
      
      const task = tasks[0];
      const result = {
        ...task,
        config: JSON.parse(task.config || '{}')
      };
      
      // 更新缓存
      this.backtestTasks.set(taskId, result);
      
      return result;
      
    } catch (error) {
      logger.error('获取回测任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取回测结果
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 回测结果
   */
  async getBacktestResults(taskId) {
    try {
      // 先从缓存获取
      if (this.backtestResults.has(taskId)) {
        return this.backtestResults.get(taskId);
      }
      
      const query = 'SELECT * FROM backtest_results WHERE task_id = ?';
      const results = await vppDatabase.query(query, [taskId]);
      
      if (results.length === 0) {
        return null;
      }
      
      const result = results[0];
      const backtestResult = {
        task_id: taskId,
        strategy_id: result.strategy_id,
        backtest_results: JSON.parse(result.results_data || '{}'),
        analysis: JSON.parse(result.analysis_data || '{}'),
        report: JSON.parse(result.report_data || '{}'),
        created_at: result.created_at
      };
      
      // 更新缓存
      this.backtestResults.set(taskId, backtestResult);
      
      return backtestResult;
      
    } catch (error) {
      logger.error('获取回测结果失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {string} status - 状态
   * @param {number} progress - 进度
   */
  async updateTaskStatus(taskId, status, progress) {
    try {
      const updateFields = ['status = ?', 'progress = ?', 'updated_at = ?'];
      const params = [status, progress, new Date()];
      
      if (status === BACKTEST_STATUS.RUNNING && progress === 0) {
        updateFields.push('started_at = ?');
        params.push(new Date());
      }
      
      if (status === BACKTEST_STATUS.COMPLETED) {
        updateFields.push('completed_at = ?');
        params.push(new Date());
      }
      
      const query = `UPDATE backtest_tasks SET ${updateFields.join(', ')} WHERE id = ?`;
      params.push(taskId);
      
      await vppDatabase.execute(query, params);
      
      // 更新缓存
      if (this.backtestTasks.has(taskId)) {
        const task = this.backtestTasks.get(taskId);
        task.status = status;
        task.progress = progress;
        task.updated_at = new Date();
      }
      
    } catch (error) {
      logger.error('更新任务状态失败:', error);
    }
  }

  /**
   * 取消回测任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 取消结果
   */
  async cancelBacktest(taskId) {
    try {
      const task = await this.getBacktestTask(taskId);
      
      if (!task) {
        throw new Error('回测任务不存在');
      }
      
      if (task.status === BACKTEST_STATUS.COMPLETED) {
        throw new Error('已完成的任务无法取消');
      }
      
      await this.updateTaskStatus(taskId, BACKTEST_STATUS.CANCELLED, 0);
      this.runningTasks.delete(taskId);
      
      logger.info(`回测任务已取消: ${taskId}`);
      
      return { success: true, message: '回测任务已取消' };
      
    } catch (error) {
      logger.error('取消回测任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取回测任务列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 任务列表
   */
  async getBacktestTasks(filters = {}) {
    try {
      let query = 'SELECT * FROM backtest_tasks WHERE 1=1';
      const params = [];
      
      if (filters.strategy_id) {
        query += ' AND strategy_id = ?';
        params.push(filters.strategy_id);
      }
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.backtest_type) {
        query += ' AND backtest_type = ?';
        params.push(filters.backtest_type);
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (filters.page && filters.size) {
        const offset = (filters.page - 1) * filters.size;
        query += ' LIMIT ? OFFSET ?';
        params.push(filters.size, offset);
      }
      
      const tasks = await vppDatabase.query(query, params);
      
      return tasks.map(task => ({
        ...task,
        config: JSON.parse(task.config || '{}')
      }));
      
    } catch (error) {
      logger.error('获取回测任务列表失败:', error);
      throw error;
    }
  }

  /**
   * 验证回测配置
   * @param {Object} config - 回测配置
   */
  validateBacktestConfig(config) {
    const required = ['strategy_id', 'start_date', 'end_date'];
    
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }
    
    const startDate = new Date(config.start_date);
    const endDate = new Date(config.end_date);
    
    if (startDate >= endDate) {
      throw new Error('开始日期必须早于结束日期');
    }
    
    if (endDate > new Date()) {
      throw new Error('结束日期不能晚于当前日期');
    }
    
    if (config.backtest_type && !Object.values(BACKTEST_TYPES).includes(config.backtest_type)) {
      throw new Error('无效的回测类型');
    }
    
    if (config.data_source && !Object.values(DATA_SOURCES).includes(config.data_source)) {
      throw new Error('无效的数据源');
    }
  }

  /**
   * 获取服务状态
   * @returns {Object} 服务状态
   */
  getServiceStatus() {
    return {
      service: 'VPPBacktestService',
      status: 'running',
      cached_tasks: this.backtestTasks.size,
      cached_results: this.backtestResults.size,
      running_tasks: this.runningTasks.size,
      supported_backtest_types: Object.values(BACKTEST_TYPES),
      supported_data_sources: Object.values(DATA_SOURCES),
      timestamp: new Date()
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.backtestTasks.clear();
    this.backtestResults.clear();
    this.runningTasks.clear();
    logger.info('回测服务缓存已清理');
  }
}

// 导出常量和服务类
module.exports = {
  VPPBacktestService,
  BACKTEST_STATUS,
  BACKTEST_TYPES,
  DATA_SOURCES
};