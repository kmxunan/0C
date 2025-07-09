/**
 * 虚拟电厂自动化交易执行引擎服务
 * 负责策略执行、订单管理、风险控制和实时监控
 */

import dbPromise from '../database/database.js';
import logger from '../utils/logger.js';
import EventEmitter from 'events';

// 执行状态枚举
const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
};

// 订单状态枚举
const ORDER_STATUS = {
  CREATED: 'created',
  SUBMITTED: 'submitted',
  PARTIAL_FILLED: 'partial_filled',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// 订单类型枚举
const ORDER_TYPE = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop',
  STOP_LIMIT: 'stop_limit',
  ICEBERG: 'iceberg',
  TWA: 'twa' // Time Weighted Average
};

// 市场类型枚举
const MARKET_TYPE = {
  SPOT: 'spot',
  DAY_AHEAD: 'day_ahead',
  INTRADAY: 'intraday',
  BALANCING: 'balancing',
  ANCILLARY: 'ancillary',
  CAPACITY: 'capacity'
};

// 风险级别枚举
const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class VPPTradingExecutionService extends EventEmitter {
  constructor() {
    super();
    
    // 执行引擎状态
    this.isRunning = false;
    this.executionQueue = [];
    this.activeExecutions = new Map();
    this.orderBook = new Map();
    
    // 配置参数
    this.config = {
      maxConcurrentExecutions: 10,
      executionTimeout: 300000, // 5分钟
      orderTimeout: 60000, // 1分钟
      riskCheckInterval: 5000, // 5秒
      heartbeatInterval: 10000, // 10秒
      maxRetries: 3,
      retryDelay: 5000
    };
    
    // 风险控制参数
    this.riskLimits = {
      maxDailyLoss: 100000, // 最大日损失
      maxPositionSize: 1000, // 最大持仓量(MWh)
      maxOrderValue: 50000, // 最大订单价值
      maxDrawdown: 0.1, // 最大回撤比例
      minCashReserve: 10000 // 最小现金储备
    };
    
    // 性能监控
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalOrders: 0,
      filledOrders: 0,
      averageExecutionTime: 0,
      totalProfit: 0,
      totalLoss: 0
    };
    
    // 缓存
    this.strategyCache = new Map();
    this.marketDataCache = new Map();
    this.riskCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = 60000; // 1分钟
    
    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    try {
      await this.createTables();
      await this.loadConfiguration();
      await this.startExecutionEngine();
      await this.startRiskMonitoring();
      
      logger.info('VPP交易执行引擎服务初始化完成');
    } catch (error) {
      logger.error('VPP交易执行引擎服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    const db = await dbPromise;
    
    // 执行记录表
    await db.schema.hasTable('vpp_executions').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_executions', table => {
          table.increments('id').primary();
          table.integer('strategy_id').notNullable();
          table.string('execution_id', 50).unique().notNullable();
          table.enum('status', Object.values(EXECUTION_STATUS)).defaultTo(EXECUTION_STATUS.PENDING);
          table.enum('market_type', Object.values(MARKET_TYPE)).notNullable();
          table.json('execution_config');
          table.json('market_conditions');
          table.json('resource_state');
          table.json('input_data');
          table.json('execution_results');
          table.json('trading_decisions');
          table.json('risk_assessment');
          table.json('performance_metrics');
          table.json('error_details');
          table.decimal('profit_loss', 15, 2).defaultTo(0);
          table.integer('orders_count').defaultTo(0);
          table.integer('filled_orders').defaultTo(0);
          table.timestamp('started_at');
          table.timestamp('completed_at');
          table.timestamps(true, true);
          
          table.index(['strategy_id', 'status']);
          table.index(['market_type', 'started_at']);
          table.index('execution_id');
        });
      }
    });
    
    // 订单表
    await db.schema.hasTable('vpp_orders').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_orders', table => {
          table.increments('id').primary();
          table.integer('execution_id').notNullable();
          table.string('order_id', 50).unique().notNullable();
          table.string('external_order_id', 100);
          table.enum('status', Object.values(ORDER_STATUS)).defaultTo(ORDER_STATUS.CREATED);
          table.enum('order_type', Object.values(ORDER_TYPE)).notNullable();
          table.enum('market_type', Object.values(MARKET_TYPE)).notNullable();
          table.string('symbol', 20).notNullable();
          table.enum('side', ['buy', 'sell']).notNullable();
          table.decimal('quantity', 15, 6).notNullable();
          table.decimal('price', 15, 6);
          table.decimal('stop_price', 15, 6);
          table.decimal('filled_quantity', 15, 6).defaultTo(0);
          table.decimal('average_price', 15, 6).defaultTo(0);
          table.decimal('commission', 15, 6).defaultTo(0);
          table.json('order_params');
          table.json('fill_details');
          table.json('rejection_reason');
          table.timestamp('submitted_at');
          table.timestamp('filled_at');
          table.timestamp('expires_at');
          table.timestamps(true, true);
          
          table.index(['execution_id', 'status']);
          table.index(['market_type', 'symbol']);
          table.index('order_id');
          table.index('external_order_id');
        });
      }
    });
    
    // 风险监控表
    await db.schema.hasTable('vpp_risk_monitoring').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_risk_monitoring', table => {
          table.increments('id').primary();
          table.integer('execution_id');
          table.enum('risk_level', Object.values(RISK_LEVEL)).notNullable();
          table.string('risk_type', 50).notNullable();
          table.text('risk_description');
          table.json('risk_metrics');
          table.json('mitigation_actions');
          table.boolean('is_resolved').defaultTo(false);
          table.timestamp('detected_at').defaultTo(db.fn.now());
          table.timestamp('resolved_at');
          table.timestamps(true, true);
          
          table.index(['risk_level', 'is_resolved']);
          table.index(['execution_id', 'detected_at']);
        });
      }
    });
    
    // 执行配置表
    await db.schema.hasTable('vpp_execution_config').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_execution_config', table => {
          table.increments('id').primary();
          table.string('config_key', 100).unique().notNullable();
          table.json('config_value').notNullable();
          table.text('description');
          table.boolean('is_active').defaultTo(true);
          table.timestamps(true, true);
          
          table.index('config_key');
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
        .where({ is_active: true });
      
      configs.forEach(config => {
        const value = JSON.parse(config.config_value);
        
        switch (config.config_key) {
          case 'execution_engine':
            Object.assign(this.config, value);
            break;
          case 'risk_limits':
            Object.assign(this.riskLimits, value);
            break;
        }
      });
      
      logger.info('执行引擎配置加载完成');
    } catch (error) {
      logger.error('加载配置失败:', error);
    }
  }

  /**
   * 启动执行引擎
   */
  async startExecutionEngine() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // 启动执行队列处理
    this.executionInterval = setInterval(() => {
      this.processExecutionQueue();
    }, 1000);
    
    // 启动心跳监控
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
    
    logger.info('交易执行引擎已启动');
  }

  /**
   * 停止执行引擎
   */
  async stopExecutionEngine() {
    this.isRunning = false;
    
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.riskMonitoringInterval) {
      clearInterval(this.riskMonitoringInterval);
    }
    
    // 等待当前执行完成
    await this.waitForActiveExecutions();
    
    logger.info('交易执行引擎已停止');
  }

  /**
   * 启动风险监控
   */
  startRiskMonitoring() {
    this.riskMonitoringInterval = setInterval(() => {
      this.performRiskCheck();
    }, this.config.riskCheckInterval);
    
    logger.info('风险监控已启动');
  }

  /**
   * 执行策略
   * @param {Object} strategyExecution - 策略执行配置
   * @returns {Promise<Object>} - 执行结果
   */
  async executeStrategy(strategyExecution) {
    try {
      const executionId = this.generateExecutionId();
      
      // 创建执行记录
      const execution = {
        id: executionId,
        strategy_id: strategyExecution.strategyId,
        execution_id: executionId,
        status: EXECUTION_STATUS.PENDING,
        market_type: strategyExecution.marketType,
        execution_config: strategyExecution.config,
        market_conditions: strategyExecution.marketConditions,
        resource_state: strategyExecution.resourceState,
        input_data: strategyExecution.inputData,
        started_at: new Date()
      };
      
      // 保存到数据库
      const db = await dbPromise;
      await db('vpp_executions').insert({
        ...execution,
        execution_config: JSON.stringify(execution.execution_config),
        market_conditions: JSON.stringify(execution.market_conditions),
        resource_state: JSON.stringify(execution.resource_state),
        input_data: JSON.stringify(execution.input_data)
      });
      
      // 添加到执行队列
      this.executionQueue.push(execution);
      
      logger.info(`策略执行已加入队列: ${executionId}`);
      
      return {
        success: true,
        executionId,
        message: '策略执行已启动'
      };
      
    } catch (error) {
      logger.error('执行策略失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 处理执行队列
   */
  async processExecutionQueue() {
    if (this.executionQueue.length === 0 || 
        this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
      return;
    }
    
    const execution = this.executionQueue.shift();
    
    try {
      // 风险检查
      const riskCheck = await this.performExecutionRiskCheck(execution);
      if (!riskCheck.passed) {
        await this.handleExecutionFailure(execution, `风险检查失败: ${riskCheck.reason}`);
        return;
      }
      
      // 开始执行
      this.activeExecutions.set(execution.id, execution);
      await this.runExecution(execution);
      
    } catch (error) {
      logger.error(`执行失败 ${execution.id}:`, error);
      await this.handleExecutionFailure(execution, error.message);
    }
  }

  /**
   * 运行执行
   */
  async runExecution(execution) {
    try {
      // 更新状态为运行中
      await this.updateExecutionStatus(execution.id, EXECUTION_STATUS.RUNNING);
      
      // 获取策略定义
      const strategy = await this.getStrategy(execution.strategy_id);
      if (!strategy) {
        throw new Error('策略不存在');
      }
      
      // 执行交易决策
      const decisions = await this.makeTradingDecisions(execution, strategy);
      
      // 执行订单
      const orders = await this.executeOrders(execution, decisions);
      
      // 计算结果
      const results = await this.calculateExecutionResults(execution, orders);
      
      // 更新执行记录
      await this.completeExecution(execution, decisions, orders, results);
      
      logger.info(`执行完成: ${execution.id}`);
      
    } catch (error) {
      logger.error(`执行运行失败 ${execution.id}:`, error);
      await this.handleExecutionFailure(execution, error.message);
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  /**
   * 制定交易决策
   */
  async makeTradingDecisions(execution, strategy) {
    // 这里实现具体的交易决策逻辑
    // 根据策略定义、市场条件、资源状态等制定交易决策
    
    const decisions = {
      timestamp: new Date(),
      strategy_id: strategy.id,
      market_analysis: {},
      resource_optimization: {},
      trading_signals: [],
      risk_assessment: {},
      orders_to_create: []
    };
    
    // 模拟交易决策过程
    // 实际实现中这里会包含复杂的算法逻辑
    
    return decisions;
  }

  /**
   * 执行订单
   */
  async executeOrders(execution, decisions) {
    const orders = [];
    
    for (const orderSpec of decisions.orders_to_create) {
      try {
        const order = await this.createAndSubmitOrder(execution, orderSpec);
        orders.push(order);
      } catch (error) {
        logger.error(`订单执行失败:`, error);
        // 继续执行其他订单
      }
    }
    
    return orders;
  }

  /**
   * 创建并提交订单
   */
  async createAndSubmitOrder(execution, orderSpec) {
    const orderId = this.generateOrderId();
    
    const order = {
      execution_id: execution.id,
      order_id: orderId,
      status: ORDER_STATUS.CREATED,
      order_type: orderSpec.type,
      market_type: orderSpec.market,
      symbol: orderSpec.symbol,
      side: orderSpec.side,
      quantity: orderSpec.quantity,
      price: orderSpec.price,
      stop_price: orderSpec.stopPrice,
      order_params: orderSpec.params,
      submitted_at: new Date()
    };
    
    // 保存订单到数据库
    const db = await dbPromise;
    await db('vpp_orders').insert({
      ...order,
      order_params: JSON.stringify(order.order_params)
    });
    
    // 提交到市场
    const submissionResult = await this.submitOrderToMarket(order);
    
    if (submissionResult.success) {
      order.status = ORDER_STATUS.SUBMITTED;
      order.external_order_id = submissionResult.externalOrderId;
      
      await db('vpp_orders')
        .where({ order_id: orderId })
        .update({
          status: order.status,
          external_order_id: order.external_order_id
        });
    } else {
      order.status = ORDER_STATUS.REJECTED;
      order.rejection_reason = submissionResult.error;
      
      await db('vpp_orders')
        .where({ order_id: orderId })
        .update({
          status: order.status,
          rejection_reason: JSON.stringify(order.rejection_reason)
        });
    }
    
    return order;
  }

  /**
   * 提交订单到市场
   */
  async submitOrderToMarket(order) {
    // 这里实现与实际电力市场的接口
    // 模拟提交过程
    
    try {
      // 模拟市场响应
      const externalOrderId = `EXT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        externalOrderId,
        message: '订单已提交到市场'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 计算执行结果
   */
  async calculateExecutionResults(execution, orders) {
    const results = {
      total_orders: orders.length,
      successful_orders: orders.filter(o => o.status === ORDER_STATUS.SUBMITTED).length,
      failed_orders: orders.filter(o => o.status === ORDER_STATUS.REJECTED).length,
      total_quantity: orders.reduce((sum, o) => sum + (o.quantity || 0), 0),
      estimated_value: 0,
      execution_time: Date.now() - new Date(execution.started_at).getTime(),
      performance_metrics: {
        latency: 0,
        slippage: 0,
        fill_rate: 0
      }
    };
    
    return results;
  }

  /**
   * 完成执行
   */
  async completeExecution(execution, decisions, orders, results) {
    const db = await dbPromise;
    
    await db('vpp_executions')
      .where({ execution_id: execution.id })
      .update({
        status: EXECUTION_STATUS.COMPLETED,
        trading_decisions: JSON.stringify(decisions),
        execution_results: JSON.stringify(results),
        orders_count: orders.length,
        filled_orders: orders.filter(o => o.status === ORDER_STATUS.FILLED).length,
        completed_at: new Date()
      });
    
    // 更新指标
    this.metrics.totalExecutions++;
    this.metrics.successfulExecutions++;
    
    // 发送完成事件
    this.emit('executionCompleted', {
      executionId: execution.id,
      results
    });
  }

  /**
   * 处理执行失败
   */
  async handleExecutionFailure(execution, errorMessage) {
    const db = await dbPromise;
    
    await db('vpp_executions')
      .where({ execution_id: execution.id })
      .update({
        status: EXECUTION_STATUS.FAILED,
        error_details: JSON.stringify({ error: errorMessage, timestamp: new Date() }),
        completed_at: new Date()
      });
    
    this.metrics.failedExecutions++;
    
    // 发送失败事件
    this.emit('executionFailed', {
      executionId: execution.id,
      error: errorMessage
    });
  }

  /**
   * 执行风险检查
   */
  async performExecutionRiskCheck(execution) {
    try {
      // 检查日损失限制
      const dailyLoss = await this.getDailyLoss();
      if (dailyLoss > this.riskLimits.maxDailyLoss) {
        return {
          passed: false,
          reason: '超过日损失限制'
        };
      }
      
      // 检查持仓限制
      const currentPosition = await this.getCurrentPosition();
      if (Math.abs(currentPosition) > this.riskLimits.maxPositionSize) {
        return {
          passed: false,
          reason: '超过最大持仓限制'
        };
      }
      
      // 检查现金储备
      const cashReserve = await this.getCashReserve();
      if (cashReserve < this.riskLimits.minCashReserve) {
        return {
          passed: false,
          reason: '现金储备不足'
        };
      }
      
      return {
        passed: true,
        reason: '风险检查通过'
      };
      
    } catch (error) {
      logger.error('风险检查失败:', error);
      return {
        passed: false,
        reason: '风险检查系统错误'
      };
    }
  }

  /**
   * 执行风险检查
   */
  async performRiskCheck() {
    try {
      const risks = [];
      
      // 检查各种风险指标
      const dailyLoss = await this.getDailyLoss();
      const currentPosition = await this.getCurrentPosition();
      const cashReserve = await this.getCashReserve();
      const drawdown = await this.getDrawdown();
      
      // 评估风险级别
      if (dailyLoss > this.riskLimits.maxDailyLoss * 0.8) {
        risks.push({
          type: 'daily_loss',
          level: RISK_LEVEL.HIGH,
          description: '日损失接近限制',
          metrics: { current: dailyLoss, limit: this.riskLimits.maxDailyLoss }
        });
      }
      
      if (Math.abs(currentPosition) > this.riskLimits.maxPositionSize * 0.8) {
        risks.push({
          type: 'position_size',
          level: RISK_LEVEL.MEDIUM,
          description: '持仓量接近限制',
          metrics: { current: currentPosition, limit: this.riskLimits.maxPositionSize }
        });
      }
      
      if (cashReserve < this.riskLimits.minCashReserve * 1.2) {
        risks.push({
          type: 'cash_reserve',
          level: RISK_LEVEL.MEDIUM,
          description: '现金储备偏低',
          metrics: { current: cashReserve, minimum: this.riskLimits.minCashReserve }
        });
      }
      
      if (drawdown > this.riskLimits.maxDrawdown * 0.8) {
        risks.push({
          type: 'drawdown',
          level: RISK_LEVEL.HIGH,
          description: '回撤过大',
          metrics: { current: drawdown, limit: this.riskLimits.maxDrawdown }
        });
      }
      
      // 记录风险
      if (risks.length > 0) {
        await this.recordRisks(risks);
      }
      
    } catch (error) {
      logger.error('风险检查失败:', error);
    }
  }

  /**
   * 记录风险
   */
  async recordRisks(risks) {
    const db = await dbPromise;
    
    for (const risk of risks) {
      await db('vpp_risk_monitoring').insert({
        risk_level: risk.level,
        risk_type: risk.type,
        risk_description: risk.description,
        risk_metrics: JSON.stringify(risk.metrics),
        detected_at: new Date()
      });
    }
    
    // 发送风险警报
    this.emit('riskDetected', risks);
  }

  /**
   * 获取策略
   */
  async getStrategy(strategyId) {
    if (this.strategyCache.has(strategyId) && !this.isCacheExpired()) {
      return this.strategyCache.get(strategyId);
    }
    
    const db = await dbPromise;
    const strategy = await db('vpp_trading_strategies')
      .where({ id: strategyId })
      .first();
    
    if (strategy) {
      this.strategyCache.set(strategyId, strategy);
    }
    
    return strategy;
  }

  /**
   * 更新执行状态
   */
  async updateExecutionStatus(executionId, status) {
    const db = await dbPromise;
    
    await db('vpp_executions')
      .where({ execution_id: executionId })
      .update({ status });
  }

  /**
   * 获取日损失
   */
  async getDailyLoss() {
    const db = await dbPromise;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db('vpp_executions')
      .where('started_at', '>=', today)
      .where('profit_loss', '<', 0)
      .sum('profit_loss as total_loss')
      .first();
    
    return Math.abs(result.total_loss || 0);
  }

  /**
   * 获取当前持仓
   */
  async getCurrentPosition() {
    // 这里应该从实际的持仓系统获取数据
    // 模拟返回
    return 0;
  }

  /**
   * 获取现金储备
   */
  async getCashReserve() {
    // 这里应该从实际的资金管理系统获取数据
    // 模拟返回
    return 50000;
  }

  /**
   * 获取回撤
   */
  async getDrawdown() {
    // 这里应该计算实际的回撤
    // 模拟返回
    return 0.05;
  }

  /**
   * 等待活跃执行完成
   */
  async waitForActiveExecutions() {
    while (this.activeExecutions.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * 发送心跳
   */
  sendHeartbeat() {
    this.emit('heartbeat', {
      timestamp: new Date(),
      activeExecutions: this.activeExecutions.size,
      queueSize: this.executionQueue.length,
      metrics: this.metrics
    });
  }

  /**
   * 生成执行ID
   */
  generateExecutionId() {
    return `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成订单ID
   */
  generateOrderId() {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      
      // 统计执行数据
      const executionStats = await db('vpp_executions')
        .select(
          db.raw('COUNT(*) as total_executions'),
          db.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_executions'),
          db.raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed_executions'),
          db.raw('COUNT(CASE WHEN status = "running" THEN 1 END) as running_executions'),
          db.raw('SUM(profit_loss) as total_profit_loss'),
          db.raw('AVG(orders_count) as avg_orders_per_execution')
        )
        .first();
      
      // 统计订单数据
      const orderStats = await db('vpp_orders')
        .select(
          db.raw('COUNT(*) as total_orders'),
          db.raw('COUNT(CASE WHEN status = "filled" THEN 1 END) as filled_orders'),
          db.raw('COUNT(CASE WHEN status = "rejected" THEN 1 END) as rejected_orders'),
          db.raw('SUM(filled_quantity * average_price) as total_volume')
        )
        .first();
      
      // 统计风险数据
      const riskStats = await db('vpp_risk_monitoring')
        .select(
          db.raw('COUNT(*) as total_risks'),
          db.raw('COUNT(CASE WHEN is_resolved = false THEN 1 END) as active_risks'),
          db.raw('COUNT(CASE WHEN risk_level = "critical" THEN 1 END) as critical_risks')
        )
        .first();
      
      return {
        service: 'VPPTradingExecutionService',
        status: this.isRunning ? 'running' : 'stopped',
        engine_status: {
          is_running: this.isRunning,
          active_executions: this.activeExecutions.size,
          queue_size: this.executionQueue.length,
          max_concurrent: this.config.maxConcurrentExecutions
        },
        statistics: {
          executions: {
            total: parseInt(executionStats.total_executions) || 0,
            completed: parseInt(executionStats.completed_executions) || 0,
            failed: parseInt(executionStats.failed_executions) || 0,
            running: parseInt(executionStats.running_executions) || 0,
            success_rate: executionStats.total_executions > 0 ? 
              (executionStats.completed_executions / executionStats.total_executions) * 100 : 0,
            total_profit_loss: parseFloat(executionStats.total_profit_loss) || 0,
            avg_orders_per_execution: parseFloat(executionStats.avg_orders_per_execution) || 0
          },
          orders: {
            total: parseInt(orderStats.total_orders) || 0,
            filled: parseInt(orderStats.filled_orders) || 0,
            rejected: parseInt(orderStats.rejected_orders) || 0,
            fill_rate: orderStats.total_orders > 0 ? 
              (orderStats.filled_orders / orderStats.total_orders) * 100 : 0,
            total_volume: parseFloat(orderStats.total_volume) || 0
          },
          risks: {
            total: parseInt(riskStats.total_risks) || 0,
            active: parseInt(riskStats.active_risks) || 0,
            critical: parseInt(riskStats.critical_risks) || 0
          }
        },
        risk_limits: this.riskLimits,
        configuration: this.config,
        cache_status: {
          strategy_cache_size: this.strategyCache.size,
          market_data_cache_size: this.marketDataCache.size,
          risk_cache_size: this.riskCache.size,
          is_expired: this.isCacheExpired()
        },
        last_check: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      return {
        service: 'VPPTradingExecutionService',
        status: 'error',
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }
}

// 创建服务实例
const vppTradingExecutionService = new VPPTradingExecutionService();

export default vppTradingExecutionService;
export { 
  EXECUTION_STATUS, 
  ORDER_STATUS, 
  ORDER_TYPE, 
  MARKET_TYPE, 
  RISK_LEVEL 
};