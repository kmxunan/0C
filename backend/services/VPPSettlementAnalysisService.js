/**
 * 虚拟电厂结算与分析系统服务
 * 负责交易结算、财务分析、报告生成和合规监控
 */

import dbPromise from '../database/database.js';
import logger from '../utils/logger.js';
import EventEmitter from 'events';

// 结算状态枚举
const SETTLEMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled'
};

// 结算类型枚举
const SETTLEMENT_TYPE = {
  TRADE: 'trade',
  CAPACITY: 'capacity',
  ANCILLARY: 'ancillary',
  IMBALANCE: 'imbalance',
  TRANSMISSION: 'transmission',
  DISTRIBUTION: 'distribution'
};

// 报告类型枚举
const REPORT_TYPE = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
  CUSTOM: 'custom'
};

// 分析类型枚举
const ANALYSIS_TYPE = {
  PROFIT_LOSS: 'profit_loss',
  PERFORMANCE: 'performance',
  RISK: 'risk',
  PORTFOLIO: 'portfolio',
  MARKET: 'market',
  COMPLIANCE: 'compliance'
};

// 货币类型枚举
const CURRENCY = {
  CNY: 'CNY',
  USD: 'USD',
  EUR: 'EUR'
};

class VPPSettlementAnalysisService extends EventEmitter {
  constructor() {
    super();
    
    // 结算引擎状态
    this.isRunning = false;
    this.settlementQueue = [];
    this.activeSettlements = new Map();
    
    // 配置参数
    this.config = {
      settlementInterval: 3600000, // 1小时
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 5000,
      reportGenerationTimeout: 300000, // 5分钟
      defaultCurrency: CURRENCY.CNY,
      taxRate: 0.13, // 13%增值税
      commissionRate: 0.001 // 0.1%手续费
    };
    
    // 分析引擎
    this.analysisEngine = {
      isRunning: false,
      analysisQueue: [],
      activeAnalyses: new Map(),
      scheduledReports: new Map()
    };
    
    // 缓存
    this.settlementCache = new Map();
    this.reportCache = new Map();
    this.analysisCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = 300000; // 5分钟
    
    // 统计信息
    this.statistics = {
      totalSettlements: 0,
      completedSettlements: 0,
      failedSettlements: 0,
      totalAmount: 0,
      totalCommission: 0,
      totalTax: 0,
      reportsGenerated: 0,
      analysesCompleted: 0
    };
    
    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    try {
      await this.createTables();
      await this.loadConfiguration();
      await this.startSettlementEngine();
      await this.startAnalysisEngine();
      await this.scheduleReports();
      
      logger.info('VPP结算与分析系统服务初始化完成');
    } catch (error) {
      logger.error('VPP结算与分析系统服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    const db = await dbPromise;
    
    // 结算记录表
    await db.schema.hasTable('vpp_settlements').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_settlements', table => {
          table.increments('id').primary();
          table.string('settlement_id', 50).unique().notNullable();
          table.integer('trade_id');
          table.integer('execution_id');
          table.string('market_id', 50).notNullable();
          table.enum('settlement_type', Object.values(SETTLEMENT_TYPE)).notNullable();
          table.enum('status', Object.values(SETTLEMENT_STATUS)).defaultTo(SETTLEMENT_STATUS.PENDING);
          table.string('currency', 3).defaultTo('CNY');
          table.decimal('gross_amount', 15, 2).notNullable();
          table.decimal('commission', 15, 2).defaultTo(0);
          table.decimal('tax_amount', 15, 2).defaultTo(0);
          table.decimal('net_amount', 15, 2).notNullable();
          table.decimal('quantity', 15, 6).notNullable();
          table.decimal('price', 15, 6).notNullable();
          table.json('settlement_details');
          table.json('calculation_breakdown');
          table.json('fees_breakdown');
          table.json('tax_breakdown');
          table.timestamp('trade_date').notNullable();
          table.timestamp('settlement_date');
          table.timestamp('due_date');
          table.timestamp('completed_at');
          table.text('notes');
          table.timestamps(true, true);
          
          table.index(['market_id', 'settlement_date']);
          table.index(['status', 'due_date']);
          table.index('settlement_id');
          table.index(['trade_date', 'settlement_type']);
        });
      }
    });
    
    // 财务分析表
    await db.schema.hasTable('vpp_financial_analysis').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_financial_analysis', table => {
          table.increments('id').primary();
          table.string('analysis_id', 50).unique().notNullable();
          table.enum('analysis_type', Object.values(ANALYSIS_TYPE)).notNullable();
          table.string('period_type', 20).notNullable();
          table.date('period_start').notNullable();
          table.date('period_end').notNullable();
          table.json('analysis_parameters');
          table.json('analysis_results');
          table.json('key_metrics');
          table.json('performance_indicators');
          table.json('risk_metrics');
          table.json('recommendations');
          table.decimal('total_revenue', 15, 2).defaultTo(0);
          table.decimal('total_cost', 15, 2).defaultTo(0);
          table.decimal('net_profit', 15, 2).defaultTo(0);
          table.decimal('roi', 8, 4).defaultTo(0);
          table.timestamp('generated_at').defaultTo(db.fn.now());
          table.timestamps(true, true);
          
          table.index(['analysis_type', 'period_start']);
          table.index('analysis_id');
          table.index(['period_start', 'period_end']);
        });
      }
    });
    
    // 报告表
    await db.schema.hasTable('vpp_reports').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_reports', table => {
          table.increments('id').primary();
          table.string('report_id', 50).unique().notNullable();
          table.enum('report_type', Object.values(REPORT_TYPE)).notNullable();
          table.string('report_name', 200).notNullable();
          table.text('description');
          table.date('period_start').notNullable();
          table.date('period_end').notNullable();
          table.json('report_parameters');
          table.json('report_data');
          table.json('summary_metrics');
          table.json('charts_data');
          table.string('file_path', 500);
          table.string('file_format', 10).defaultTo('pdf');
          table.integer('file_size');
          table.boolean('is_scheduled').defaultTo(false);
          table.boolean('is_published').defaultTo(false);
          table.timestamp('generated_at').defaultTo(db.fn.now());
          table.timestamp('published_at');
          table.timestamps(true, true);
          
          table.index(['report_type', 'period_start']);
          table.index('report_id');
          table.index(['is_scheduled', 'generated_at']);
        });
      }
    });
    
    // 合规监控表
    await db.schema.hasTable('vpp_compliance_monitoring').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_compliance_monitoring', table => {
          table.increments('id').primary();
          table.string('compliance_id', 50).unique().notNullable();
          table.string('regulation_type', 100).notNullable();
          table.string('regulation_code', 50);
          table.text('regulation_description');
          table.json('compliance_criteria');
          table.json('monitoring_parameters');
          table.json('violation_details');
          table.boolean('is_compliant').defaultTo(true);
          table.enum('severity', ['low', 'medium', 'high', 'critical']).defaultTo('low');
          table.text('remediation_actions');
          table.timestamp('check_date').defaultTo(db.fn.now());
          table.timestamp('resolved_at');
          table.timestamps(true, true);
          
          table.index(['regulation_type', 'is_compliant']);
          table.index('compliance_id');
          table.index(['check_date', 'severity']);
        });
      }
    });
    
    // 账户余额表
    await db.schema.hasTable('vpp_account_balances').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_account_balances', table => {
          table.increments('id').primary();
          table.string('account_id', 50).notNullable();
          table.string('market_id', 50).notNullable();
          table.string('currency', 3).defaultTo('CNY');
          table.decimal('available_balance', 15, 2).defaultTo(0);
          table.decimal('frozen_balance', 15, 2).defaultTo(0);
          table.decimal('total_balance', 15, 2).defaultTo(0);
          table.decimal('credit_limit', 15, 2).defaultTo(0);
          table.json('balance_details');
          table.timestamp('last_updated').defaultTo(db.fn.now());
          table.timestamps(true, true);
          
          table.unique(['account_id', 'market_id', 'currency']);
          table.index(['account_id', 'market_id']);
          table.index('last_updated');
        });
      }
    });
  }

  /**
   * 加载配置
   */
  async loadConfiguration() {
    try {
      const db = await dbPromise;
      
      const configs = await db('vpp_execution_config')
        .where({ config_key: 'settlement_analysis', is_active: true })
        .first();
      
      if (configs) {
        const configValue = JSON.parse(configs.config_value);
        Object.assign(this.config, configValue);
      }
      
      logger.info('结算分析配置加载完成');
    } catch (error) {
      logger.error('加载配置失败:', error);
    }
  }

  /**
   * 启动结算引擎
   */
  async startSettlementEngine() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // 启动结算处理
    this.settlementInterval = setInterval(() => {
      this.processSettlements();
    }, this.config.settlementInterval);
    
    logger.info('结算引擎已启动');
  }

  /**
   * 启动分析引擎
   */
  async startAnalysisEngine() {
    this.analysisEngine.isRunning = true;
    
    // 启动分析处理
    this.analysisInterval = setInterval(() => {
      this.processAnalyses();
    }, 60000); // 每分钟检查一次
    
    logger.info('分析引擎已启动');
  }

  /**
   * 创建结算记录
   */
  async createSettlement(settlementData) {
    try {
      const settlementId = this.generateSettlementId();
      
      // 计算结算金额
      const calculations = this.calculateSettlementAmounts(settlementData);
      
      const settlement = {
        settlement_id: settlementId,
        trade_id: settlementData.tradeId,
        execution_id: settlementData.executionId,
        market_id: settlementData.marketId,
        settlement_type: settlementData.settlementType,
        status: SETTLEMENT_STATUS.PENDING,
        currency: settlementData.currency || this.config.defaultCurrency,
        gross_amount: calculations.grossAmount,
        commission: calculations.commission,
        tax_amount: calculations.taxAmount,
        net_amount: calculations.netAmount,
        quantity: settlementData.quantity,
        price: settlementData.price,
        settlement_details: settlementData.details || {},
        calculation_breakdown: calculations.breakdown,
        fees_breakdown: calculations.feesBreakdown,
        tax_breakdown: calculations.taxBreakdown,
        trade_date: settlementData.tradeDate,
        settlement_date: settlementData.settlementDate,
        due_date: settlementData.dueDate
      };
      
      // 保存到数据库
      const db = await dbPromise;
      await db('vpp_settlements').insert({
        ...settlement,
        settlement_details: JSON.stringify(settlement.settlement_details),
        calculation_breakdown: JSON.stringify(settlement.calculation_breakdown),
        fees_breakdown: JSON.stringify(settlement.fees_breakdown),
        tax_breakdown: JSON.stringify(settlement.tax_breakdown)
      });
      
      // 添加到处理队列
      this.settlementQueue.push(settlement);
      
      logger.info(`结算记录已创建: ${settlementId}`);
      
      return {
        success: true,
        settlementId,
        settlement
      };
      
    } catch (error) {
      logger.error('创建结算记录失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 计算结算金额
   */
  calculateSettlementAmounts(settlementData) {
    const grossAmount = settlementData.quantity * settlementData.price;
    const commission = grossAmount * this.config.commissionRate;
    const taxableAmount = grossAmount - commission;
    const taxAmount = taxableAmount * this.config.taxRate;
    const netAmount = grossAmount - commission - taxAmount;
    
    return {
      grossAmount,
      commission,
      taxAmount,
      netAmount,
      breakdown: {
        quantity: settlementData.quantity,
        price: settlementData.price,
        gross_amount: grossAmount,
        commission_rate: this.config.commissionRate,
        tax_rate: this.config.taxRate
      },
      feesBreakdown: {
        commission: {
          amount: commission,
          rate: this.config.commissionRate,
          description: '交易手续费'
        }
      },
      taxBreakdown: {
        vat: {
          amount: taxAmount,
          rate: this.config.taxRate,
          taxable_amount: taxableAmount,
          description: '增值税'
        }
      }
    };
  }

  /**
   * 处理结算
   */
  async processSettlements() {
    if (this.settlementQueue.length === 0) {
      return;
    }
    
    const batch = this.settlementQueue.splice(0, this.config.batchSize);
    
    for (const settlement of batch) {
      try {
        await this.processSettlement(settlement);
      } catch (error) {
        logger.error(`处理结算失败 ${settlement.settlement_id}:`, error);
      }
    }
  }

  /**
   * 处理单个结算
   */
  async processSettlement(settlement) {
    try {
      this.activeSettlements.set(settlement.settlement_id, settlement);
      
      // 更新状态为处理中
      await this.updateSettlementStatus(settlement.settlement_id, SETTLEMENT_STATUS.PROCESSING);
      
      // 执行结算逻辑
      const result = await this.executeSettlement(settlement);
      
      if (result.success) {
        // 更新账户余额
        await this.updateAccountBalance(settlement);
        
        // 完成结算
        await this.completeSettlement(settlement.settlement_id, result);
        
        this.statistics.completedSettlements++;
        this.statistics.totalAmount += settlement.net_amount;
        this.statistics.totalCommission += settlement.commission;
        this.statistics.totalTax += settlement.tax_amount;
        
      } else {
        await this.failSettlement(settlement.settlement_id, result.error);
        this.statistics.failedSettlements++;
      }
      
    } catch (error) {
      logger.error(`结算处理失败 ${settlement.settlement_id}:`, error);
      await this.failSettlement(settlement.settlement_id, error.message);
      this.statistics.failedSettlements++;
    } finally {
      this.activeSettlements.delete(settlement.settlement_id);
      this.statistics.totalSettlements++;
    }
  }

  /**
   * 执行结算
   */
  async executeSettlement(settlement) {
    try {
      // 这里实现具体的结算逻辑
      // 包括与银行系统、支付系统的接口
      
      // 模拟结算处理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        transactionId: `TXN_${Date.now()}`,
        processedAt: new Date()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新账户余额
   */
  async updateAccountBalance(settlement) {
    try {
      const db = await dbPromise;
      
      const accountId = 'VPP_MAIN'; // 主账户
      const marketId = settlement.market_id;
      const currency = settlement.currency;
      
      // 获取当前余额
      let balance = await db('vpp_account_balances')
        .where({ account_id: accountId, market_id: marketId, currency })
        .first();
      
      if (!balance) {
        // 创建新的余额记录
        balance = {
          account_id: accountId,
          market_id: marketId,
          currency,
          available_balance: 0,
          frozen_balance: 0,
          total_balance: 0,
          credit_limit: 0,
          balance_details: {}
        };
      }
      
      // 更新余额
      const newAvailableBalance = parseFloat(balance.available_balance) + settlement.net_amount;
      const newTotalBalance = parseFloat(balance.total_balance) + settlement.net_amount;
      
      await db('vpp_account_balances')
        .insert({
          ...balance,
          available_balance: newAvailableBalance,
          total_balance: newTotalBalance,
          balance_details: JSON.stringify({
            ...balance.balance_details,
            last_settlement: {
              settlement_id: settlement.settlement_id,
              amount: settlement.net_amount,
              timestamp: new Date()
            }
          }),
          last_updated: new Date()
        })
        .onConflict(['account_id', 'market_id', 'currency'])
        .merge();
      
    } catch (error) {
      logger.error('更新账户余额失败:', error);
      throw error;
    }
  }

  /**
   * 完成结算
   */
  async completeSettlement(settlementId, result) {
    const db = await dbPromise;
    
    await db('vpp_settlements')
      .where({ settlement_id: settlementId })
      .update({
        status: SETTLEMENT_STATUS.COMPLETED,
        completed_at: new Date(),
        settlement_details: db.raw(`JSON_SET(settlement_details, '$.completion_result', '${JSON.stringify(result)}')`)
      });
    
    this.emit('settlementCompleted', { settlementId, result });
  }

  /**
   * 结算失败
   */
  async failSettlement(settlementId, errorMessage) {
    const db = await dbPromise;
    
    await db('vpp_settlements')
      .where({ settlement_id: settlementId })
      .update({
        status: SETTLEMENT_STATUS.FAILED,
        settlement_details: db.raw(`JSON_SET(settlement_details, '$.error', '${errorMessage}')`)
      });
    
    this.emit('settlementFailed', { settlementId, error: errorMessage });
  }

  /**
   * 更新结算状态
   */
  async updateSettlementStatus(settlementId, status) {
    const db = await dbPromise;
    
    await db('vpp_settlements')
      .where({ settlement_id: settlementId })
      .update({ status });
  }

  /**
   * 生成财务分析
   */
  async generateFinancialAnalysis(analysisParams) {
    try {
      const analysisId = this.generateAnalysisId();
      
      const analysis = {
        analysis_id: analysisId,
        analysis_type: analysisParams.analysisType,
        period_type: analysisParams.periodType,
        period_start: analysisParams.periodStart,
        period_end: analysisParams.periodEnd,
        analysis_parameters: analysisParams.parameters || {}
      };
      
      // 执行分析
      const results = await this.performAnalysis(analysis);
      
      // 保存分析结果
      const db = await dbPromise;
      await db('vpp_financial_analysis').insert({
        ...analysis,
        analysis_parameters: JSON.stringify(analysis.analysis_parameters),
        analysis_results: JSON.stringify(results.analysisResults),
        key_metrics: JSON.stringify(results.keyMetrics),
        performance_indicators: JSON.stringify(results.performanceIndicators),
        risk_metrics: JSON.stringify(results.riskMetrics),
        recommendations: JSON.stringify(results.recommendations),
        total_revenue: results.totalRevenue,
        total_cost: results.totalCost,
        net_profit: results.netProfit,
        roi: results.roi
      });
      
      this.statistics.analysesCompleted++;
      
      logger.info(`财务分析已生成: ${analysisId}`);
      
      return {
        success: true,
        analysisId,
        results
      };
      
    } catch (error) {
      logger.error('生成财务分析失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 执行分析
   */
  async performAnalysis(analysis) {
    const db = await dbPromise;
    
    // 获取结算数据
    const settlements = await db('vpp_settlements')
      .where('settlement_date', '>=', analysis.period_start)
      .where('settlement_date', '<=', analysis.period_end)
      .where('status', SETTLEMENT_STATUS.COMPLETED);
    
    // 计算基础指标
    const totalRevenue = settlements.reduce((sum, s) => sum + parseFloat(s.gross_amount), 0);
    const totalCost = settlements.reduce((sum, s) => sum + parseFloat(s.commission) + parseFloat(s.tax_amount), 0);
    const netProfit = totalRevenue - totalCost;
    const roi = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // 按类型分组统计
    const byType = settlements.reduce((acc, s) => {
      if (!acc[s.settlement_type]) {
        acc[s.settlement_type] = {
          count: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }
      acc[s.settlement_type].count++;
      acc[s.settlement_type].revenue += parseFloat(s.gross_amount);
      acc[s.settlement_type].cost += parseFloat(s.commission) + parseFloat(s.tax_amount);
      acc[s.settlement_type].profit += parseFloat(s.net_amount);
      return acc;
    }, {});
    
    // 按市场分组统计
    const byMarket = settlements.reduce((acc, s) => {
      if (!acc[s.market_id]) {
        acc[s.market_id] = {
          count: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }
      acc[s.market_id].count++;
      acc[s.market_id].revenue += parseFloat(s.gross_amount);
      acc[s.market_id].cost += parseFloat(s.commission) + parseFloat(s.tax_amount);
      acc[s.market_id].profit += parseFloat(s.net_amount);
      return acc;
    }, {});
    
    // 计算风险指标
    const dailyProfits = this.calculateDailyProfits(settlements);
    const volatility = this.calculateVolatility(dailyProfits);
    const maxDrawdown = this.calculateMaxDrawdown(dailyProfits);
    const sharpeRatio = this.calculateSharpeRatio(dailyProfits);
    
    return {
      analysisResults: {
        period: {
          start: analysis.period_start,
          end: analysis.period_end,
          days: Math.ceil((new Date(analysis.period_end) - new Date(analysis.period_start)) / (1000 * 60 * 60 * 24))
        },
        summary: {
          total_settlements: settlements.length,
          total_revenue: totalRevenue,
          total_cost: totalCost,
          net_profit: netProfit,
          profit_margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        },
        by_type: byType,
        by_market: byMarket
      },
      keyMetrics: {
        revenue_growth: 0, // 需要历史数据对比
        cost_efficiency: totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0,
        settlement_success_rate: 100, // 基于已完成的结算
        average_settlement_value: settlements.length > 0 ? totalRevenue / settlements.length : 0
      },
      performanceIndicators: {
        roi: roi,
        daily_average_profit: dailyProfits.length > 0 ? dailyProfits.reduce((a, b) => a + b, 0) / dailyProfits.length : 0,
        best_day_profit: dailyProfits.length > 0 ? Math.max(...dailyProfits) : 0,
        worst_day_profit: dailyProfits.length > 0 ? Math.min(...dailyProfits) : 0
      },
      riskMetrics: {
        volatility: volatility,
        max_drawdown: maxDrawdown,
        sharpe_ratio: sharpeRatio,
        var_95: this.calculateVaR(dailyProfits, 0.95)
      },
      recommendations: this.generateRecommendations({
        roi,
        volatility,
        maxDrawdown,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      }),
      totalRevenue,
      totalCost,
      netProfit,
      roi
    };
  }

  /**
   * 计算日收益
   */
  calculateDailyProfits(settlements) {
    const dailyProfits = {};
    
    settlements.forEach(settlement => {
      const date = new Date(settlement.settlement_date).toDateString();
      if (!dailyProfits[date]) {
        dailyProfits[date] = 0;
      }
      dailyProfits[date] += parseFloat(settlement.net_amount);
    });
    
    return Object.values(dailyProfits);
  }

  /**
   * 计算波动率
   */
  calculateVolatility(profits) {
    if (profits.length < 2) return 0;
    
    const mean = profits.reduce((a, b) => a + b, 0) / profits.length;
    const variance = profits.reduce((sum, profit) => sum + Math.pow(profit - mean, 2), 0) / profits.length;
    
    return Math.sqrt(variance);
  }

  /**
   * 计算最大回撤
   */
  calculateMaxDrawdown(profits) {
    if (profits.length === 0) return 0;
    
    let maxDrawdown = 0;
    let peak = profits[0];
    let cumulative = 0;
    
    for (const profit of profits) {
      cumulative += profit;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = (peak - cumulative) / Math.abs(peak);
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown * 100;
  }

  /**
   * 计算夏普比率
   */
  calculateSharpeRatio(profits) {
    if (profits.length < 2) return 0;
    
    const mean = profits.reduce((a, b) => a + b, 0) / profits.length;
    const volatility = this.calculateVolatility(profits);
    
    return volatility > 0 ? mean / volatility : 0;
  }

  /**
   * 计算VaR
   */
  calculateVaR(profits, confidence) {
    if (profits.length === 0) return 0;
    
    const sorted = [...profits].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sorted.length);
    
    return sorted[index] || 0;
  }

  /**
   * 生成建议
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.roi < 5) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: '提升投资回报率',
        description: '当前ROI较低，建议优化交易策略或寻找更高收益的市场机会'
      });
    }
    
    if (metrics.volatility > 1000) {
      recommendations.push({
        type: 'risk',
        priority: 'medium',
        title: '降低投资组合波动性',
        description: '收益波动较大，建议分散投资或调整风险管理策略'
      });
    }
    
    if (metrics.maxDrawdown > 20) {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        title: '控制最大回撤',
        description: '最大回撤过大，建议设置止损机制或降低仓位'
      });
    }
    
    if (metrics.profitMargin < 10) {
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        title: '优化成本结构',
        description: '利润率偏低，建议分析成本构成并寻找降本增效的机会'
      });
    }
    
    return recommendations;
  }

  /**
   * 生成报告
   */
  async generateReport(reportParams) {
    try {
      const reportId = this.generateReportId();
      
      const report = {
        report_id: reportId,
        report_type: reportParams.reportType,
        report_name: reportParams.reportName,
        description: reportParams.description,
        period_start: reportParams.periodStart,
        period_end: reportParams.periodEnd,
        report_parameters: reportParams.parameters || {},
        is_scheduled: reportParams.isScheduled || false
      };
      
      // 收集报告数据
      const reportData = await this.collectReportData(report);
      
      // 生成图表数据
      const chartsData = await this.generateChartsData(reportData);
      
      // 计算汇总指标
      const summaryMetrics = this.calculateSummaryMetrics(reportData);
      
      // 保存报告
      const db = await dbPromise;
      await db('vpp_reports').insert({
        ...report,
        report_parameters: JSON.stringify(report.report_parameters),
        report_data: JSON.stringify(reportData),
        summary_metrics: JSON.stringify(summaryMetrics),
        charts_data: JSON.stringify(chartsData),
        file_format: 'json' // 可以扩展支持PDF等格式
      });
      
      this.statistics.reportsGenerated++;
      
      logger.info(`报告已生成: ${reportId}`);
      
      return {
        success: true,
        reportId,
        report: {
          ...report,
          report_data: reportData,
          summary_metrics: summaryMetrics,
          charts_data: chartsData
        }
      };
      
    } catch (error) {
      logger.error('生成报告失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 收集报告数据
   */
  async collectReportData(report) {
    const db = await dbPromise;
    
    // 获取结算数据
    const settlements = await db('vpp_settlements')
      .where('settlement_date', '>=', report.period_start)
      .where('settlement_date', '<=', report.period_end);
    
    // 获取分析数据
    const analyses = await db('vpp_financial_analysis')
      .where('period_start', '>=', report.period_start)
      .where('period_end', '<=', report.period_end);
    
    // 获取账户余额
    const balances = await db('vpp_account_balances')
      .where('last_updated', '>=', report.period_start)
      .where('last_updated', '<=', report.period_end);
    
    return {
      settlements: settlements.map(s => ({
        ...s,
        settlement_details: JSON.parse(s.settlement_details || '{}'),
        calculation_breakdown: JSON.parse(s.calculation_breakdown || '{}'),
        fees_breakdown: JSON.parse(s.fees_breakdown || '{}'),
        tax_breakdown: JSON.parse(s.tax_breakdown || '{}')
      })),
      analyses: analyses.map(a => ({
        ...a,
        analysis_parameters: JSON.parse(a.analysis_parameters || '{}'),
        analysis_results: JSON.parse(a.analysis_results || '{}'),
        key_metrics: JSON.parse(a.key_metrics || '{}'),
        performance_indicators: JSON.parse(a.performance_indicators || '{}'),
        risk_metrics: JSON.parse(a.risk_metrics || '{}'),
        recommendations: JSON.parse(a.recommendations || '[]')
      })),
      balances: balances.map(b => ({
        ...b,
        balance_details: JSON.parse(b.balance_details || '{}')
      }))
    };
  }

  /**
   * 生成图表数据
   */
  async generateChartsData(reportData) {
    const charts = {};
    
    // 收益趋势图
    charts.revenue_trend = this.generateRevenueTrendChart(reportData.settlements);
    
    // 结算类型分布图
    charts.settlement_type_distribution = this.generateSettlementTypeChart(reportData.settlements);
    
    // 市场分布图
    charts.market_distribution = this.generateMarketDistributionChart(reportData.settlements);
    
    // 风险指标图
    if (reportData.analyses.length > 0) {
      charts.risk_metrics = this.generateRiskMetricsChart(reportData.analyses);
    }
    
    return charts;
  }

  /**
   * 生成收益趋势图数据
   */
  generateRevenueTrendChart(settlements) {
    const dailyRevenue = {};
    
    settlements.forEach(settlement => {
      const date = new Date(settlement.settlement_date).toDateString();
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += parseFloat(settlement.net_amount);
    });
    
    return {
      type: 'line',
      data: {
        labels: Object.keys(dailyRevenue).sort(),
        datasets: [{
          label: '日收益',
          data: Object.keys(dailyRevenue).sort().map(date => dailyRevenue[date]),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)'
        }]
      }
    };
  }

  /**
   * 生成结算类型分布图数据
   */
  generateSettlementTypeChart(settlements) {
    const typeDistribution = {};
    
    settlements.forEach(settlement => {
      if (!typeDistribution[settlement.settlement_type]) {
        typeDistribution[settlement.settlement_type] = 0;
      }
      typeDistribution[settlement.settlement_type] += parseFloat(settlement.net_amount);
    });
    
    return {
      type: 'pie',
      data: {
        labels: Object.keys(typeDistribution),
        datasets: [{
          data: Object.values(typeDistribution),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ]
        }]
      }
    };
  }

  /**
   * 生成市场分布图数据
   */
  generateMarketDistributionChart(settlements) {
    const marketDistribution = {};
    
    settlements.forEach(settlement => {
      if (!marketDistribution[settlement.market_id]) {
        marketDistribution[settlement.market_id] = 0;
      }
      marketDistribution[settlement.market_id] += parseFloat(settlement.net_amount);
    });
    
    return {
      type: 'bar',
      data: {
        labels: Object.keys(marketDistribution),
        datasets: [{
          label: '市场收益分布',
          data: Object.values(marketDistribution),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }
    };
  }

  /**
   * 生成风险指标图数据
   */
  generateRiskMetricsChart(analyses) {
    const riskData = analyses.map(analysis => ({
      date: analysis.period_start,
      volatility: analysis.risk_metrics.volatility || 0,
      max_drawdown: analysis.risk_metrics.max_drawdown || 0,
      sharpe_ratio: analysis.risk_metrics.sharpe_ratio || 0
    }));
    
    return {
      type: 'line',
      data: {
        labels: riskData.map(d => d.date),
        datasets: [
          {
            label: '波动率',
            data: riskData.map(d => d.volatility),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)'
          },
          {
            label: '最大回撤(%)',
            data: riskData.map(d => d.max_drawdown),
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)'
          },
          {
            label: '夏普比率',
            data: riskData.map(d => d.sharpe_ratio),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)'
          }
        ]
      }
    };
  }

  /**
   * 计算汇总指标
   */
  calculateSummaryMetrics(reportData) {
    const settlements = reportData.settlements;
    
    const totalRevenue = settlements.reduce((sum, s) => sum + parseFloat(s.gross_amount), 0);
    const totalCost = settlements.reduce((sum, s) => sum + parseFloat(s.commission) + parseFloat(s.tax_amount), 0);
    const netProfit = totalRevenue - totalCost;
    
    return {
      total_settlements: settlements.length,
      total_revenue: totalRevenue,
      total_cost: totalCost,
      net_profit: netProfit,
      profit_margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      average_settlement_value: settlements.length > 0 ? totalRevenue / settlements.length : 0,
      settlement_success_rate: 100, // 基于已完成的结算
      period_days: Math.ceil((new Date(reportData.period_end) - new Date(reportData.period_start)) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * 安排报告
   */
  async scheduleReports() {
    // 安排日报
    this.scheduleReport({
      reportType: REPORT_TYPE.DAILY,
      reportName: '日度财务报告',
      schedule: '0 8 * * *' // 每天8点
    });
    
    // 安排周报
    this.scheduleReport({
      reportType: REPORT_TYPE.WEEKLY,
      reportName: '周度财务报告',
      schedule: '0 8 * * 1' // 每周一8点
    });
    
    // 安排月报
    this.scheduleReport({
      reportType: REPORT_TYPE.MONTHLY,
      reportName: '月度财务报告',
      schedule: '0 8 1 * *' // 每月1号8点
    });
  }

  /**
   * 安排单个报告
   */
  scheduleReport(reportConfig) {
    // 这里可以集成cron调度器
    // 简化实现，使用定时器
    
    const interval = this.getScheduleInterval(reportConfig.reportType);
    
    setInterval(async () => {
      try {
        const now = new Date();
        const { periodStart, periodEnd } = this.getReportPeriod(reportConfig.reportType, now);
        
        await this.generateReport({
          reportType: reportConfig.reportType,
          reportName: reportConfig.reportName,
          description: `自动生成的${reportConfig.reportName}`,
          periodStart,
          periodEnd,
          isScheduled: true
        });
        
      } catch (error) {
        logger.error(`生成定时报告失败 ${reportConfig.reportType}:`, error);
      }
    }, interval);
  }

  /**
   * 获取调度间隔
   */
  getScheduleInterval(reportType) {
    switch (reportType) {
      case REPORT_TYPE.DAILY:
        return 24 * 60 * 60 * 1000; // 24小时
      case REPORT_TYPE.WEEKLY:
        return 7 * 24 * 60 * 60 * 1000; // 7天
      case REPORT_TYPE.MONTHLY:
        return 30 * 24 * 60 * 60 * 1000; // 30天
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * 获取报告周期
   */
  getReportPeriod(reportType, referenceDate) {
    const date = new Date(referenceDate);
    
    switch (reportType) {
      case REPORT_TYPE.DAILY:
        const yesterday = new Date(date);
        yesterday.setDate(date.getDate() - 1);
        return {
          periodStart: yesterday.toISOString().split('T')[0],
          periodEnd: yesterday.toISOString().split('T')[0]
        };
        
      case REPORT_TYPE.WEEKLY:
        const lastWeekEnd = new Date(date);
        lastWeekEnd.setDate(date.getDate() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        return {
          periodStart: lastWeekStart.toISOString().split('T')[0],
          periodEnd: lastWeekEnd.toISOString().split('T')[0]
        };
        
      case REPORT_TYPE.MONTHLY:
        const lastMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const lastMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
        return {
          periodStart: lastMonth.toISOString().split('T')[0],
          periodEnd: lastMonthEnd.toISOString().split('T')[0]
        };
        
      default:
        return {
          periodStart: date.toISOString().split('T')[0],
          periodEnd: date.toISOString().split('T')[0]
        };
    }
  }

  /**
   * 处理分析队列
   */
  async processAnalyses() {
    if (this.analysisEngine.analysisQueue.length === 0) {
      return;
    }
    
    const analysis = this.analysisEngine.analysisQueue.shift();
    
    try {
      await this.generateFinancialAnalysis(analysis);
    } catch (error) {
      logger.error('处理分析失败:', error);
    }
  }

  /**
   * 生成ID
   */
  generateSettlementId() {
    return `SETTLE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAnalysisId() {
    return `ANALYSIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateReportId() {
    return `REPORT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查缓存是否过期
   */
  isCacheExpired() {
    return !this.lastCacheUpdate || 
           (Date.now() - this.lastCacheUpdate) > this.cacheTimeout;
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus() {
    try {
      const db = await dbPromise;
      
      // 统计结算数据
      const settlementStats = await db('vpp_settlements')
        .select(
          db.raw('COUNT(*) as total_settlements'),
          db.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_settlements'),
          db.raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed_settlements'),
          db.raw('COUNT(CASE WHEN status = "pending" THEN 1 END) as pending_settlements'),
          db.raw('SUM(net_amount) as total_net_amount'),
          db.raw('SUM(commission) as total_commission'),
          db.raw('SUM(tax_amount) as total_tax')
        )
        .first();
      
      // 统计分析数据
      const analysisStats = await db('vpp_financial_analysis')
        .select(
          db.raw('COUNT(*) as total_analyses'),
          db.raw('AVG(roi) as average_roi'),
          db.raw('MAX(generated_at) as last_analysis_time')
        )
        .first();
      
      // 统计报告数据
      const reportStats = await db('vpp_reports')
        .select(
          db.raw('COUNT(*) as total_reports'),
          db.raw('COUNT(CASE WHEN is_scheduled = true THEN 1 END) as scheduled_reports'),
          db.raw('MAX(generated_at) as last_report_time')
        )
        .first();
      
      // 统计账户余额
      const balanceStats = await db('vpp_account_balances')
        .select(
          db.raw('COUNT(*) as total_accounts'),
          db.raw('SUM(total_balance) as total_balance'),
          db.raw('SUM(available_balance) as available_balance')
        )
        .first();
      
      return {
        service: 'VPPSettlementAnalysisService',
        status: this.isRunning ? 'running' : 'stopped',
        engines: {
          settlement_engine: {
            is_running: this.isRunning,
            active_settlements: this.activeSettlements.size,
            queue_size: this.settlementQueue.length
          },
          analysis_engine: {
            is_running: this.analysisEngine.isRunning,
            active_analyses: this.analysisEngine.activeAnalyses.size,
            queue_size: this.analysisEngine.analysisQueue.length
          }
        },
        statistics: {
          settlements: {
            total: parseInt(settlementStats.total_settlements) || 0,
            completed: parseInt(settlementStats.completed_settlements) || 0,
            failed: parseInt(settlementStats.failed_settlements) || 0,
            pending: parseInt(settlementStats.pending_settlements) || 0,
            success_rate: settlementStats.total_settlements > 0 ? 
              (settlementStats.completed_settlements / settlementStats.total_settlements) * 100 : 0,
            total_net_amount: parseFloat(settlementStats.total_net_amount) || 0,
            total_commission: parseFloat(settlementStats.total_commission) || 0,
            total_tax: parseFloat(settlementStats.total_tax) || 0
          },
          analyses: {
            total: parseInt(analysisStats.total_analyses) || 0,
            average_roi: parseFloat(analysisStats.average_roi) || 0,
            last_analysis_time: analysisStats.last_analysis_time
          },
          reports: {
            total: parseInt(reportStats.total_reports) || 0,
            scheduled: parseInt(reportStats.scheduled_reports) || 0,
            last_report_time: reportStats.last_report_time
          },
          balances: {
            total_accounts: parseInt(balanceStats.total_accounts) || 0,
            total_balance: parseFloat(balanceStats.total_balance) || 0,
            available_balance: parseFloat(balanceStats.available_balance) || 0
          }
        },
        configuration: this.config,
        cache_status: {
          settlement_cache_size: this.settlementCache.size,
          report_cache_size: this.reportCache.size,
          analysis_cache_size: this.analysisCache.size,
          is_expired: this.isCacheExpired()
        },
        last_check: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      return {
        service: 'VPPSettlementAnalysisService',
        status: 'error',
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }
}

// 创建服务实例
const vppSettlementAnalysisService = new VPPSettlementAnalysisService();

export default vppSettlementAnalysisService;
export { 
  SETTLEMENT_STATUS, 
  SETTLEMENT_TYPE, 
  REPORT_TYPE, 
  ANALYSIS_TYPE, 
  CURRENCY 
};