/**
 * 虚拟电厂交易执行服务
 * 负责市场连接、交易执行、调度指令处理等功能
 */

const { v4: uuidv4 } = require('uuid');
const vppDatabase = require('../database/vppDatabase');
const vppConfig = require('../config/vppConfig');
const logger = require('../utils/logger');

// 交易状态枚举
const TRADING_STATUS = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  EXECUTED: 'EXECUTED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

// 市场类型枚举
const MARKET_TYPE = {
  SPOT: 'SPOT',
  DAY_AHEAD: 'DAY_AHEAD',
  INTRADAY: 'INTRADAY',
  BALANCING: 'BALANCING',
  ANCILLARY: 'ANCILLARY'
};

// 交易类型枚举
const TRADE_TYPE = {
  BUY: 'BUY',
  SELL: 'SELL',
  BID: 'BID',
  OFFER: 'OFFER'
};

// 调度指令类型枚举
const DISPATCH_TYPE = {
  INCREASE_GENERATION: 'INCREASE_GENERATION',
  DECREASE_GENERATION: 'DECREASE_GENERATION',
  CHARGE_STORAGE: 'CHARGE_STORAGE',
  DISCHARGE_STORAGE: 'DISCHARGE_STORAGE',
  LOAD_SHEDDING: 'LOAD_SHEDDING',
  LOAD_SHIFTING: 'LOAD_SHIFTING'
};

// 执行状态枚举
const EXECUTION_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

class VPPTradingService {
  constructor() {
    this.marketConnectors = new Map();
    this.activeOrders = new Map();
    this.executionQueue = [];
    this.isProcessing = false;
    this.cache = new Map();
    this.initializeMarketConnectors();
  }

  /**
   * 初始化市场连接器
   */
  initializeMarketConnectors() {
    try {
      // 模拟不同市场的连接器配置
      const marketConfigs = {
        [MARKET_TYPE.SPOT]: {
          endpoint: 'https://api.spotmarket.com',
          apiKey: process.env.SPOT_MARKET_API_KEY || 'demo_key',
          timeout: 5000,
          retryAttempts: 3
        },
        [MARKET_TYPE.DAY_AHEAD]: {
          endpoint: 'https://api.dayaheadmarket.com',
          apiKey: process.env.DAY_AHEAD_API_KEY || 'demo_key',
          timeout: 10000,
          retryAttempts: 2
        },
        [MARKET_TYPE.INTRADAY]: {
          endpoint: 'https://api.intradaymarket.com',
          apiKey: process.env.INTRADAY_API_KEY || 'demo_key',
          timeout: 3000,
          retryAttempts: 5
        }
      };

      for (const [marketType, config] of Object.entries(marketConfigs)) {
        this.marketConnectors.set(marketType, {
          ...config,
          connected: false,
          lastHeartbeat: null,
          connectionAttempts: 0
        });
      }

      logger.info('市场连接器初始化完成', { connectors: this.marketConnectors.size });
    } catch (error) {
      logger.error('市场连接器初始化失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 连接到指定市场
   */
  async connectToMarket(marketType) {
    try {
      const connector = this.marketConnectors.get(marketType);
      if (!connector) {
        throw new Error(`不支持的市场类型: ${marketType}`);
      }

      // 模拟连接过程
      connector.connectionAttempts++;
      
      // 模拟连接延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟连接成功/失败
      const connectionSuccess = Math.random() > 0.1; // 90% 成功率
      
      if (connectionSuccess) {
        connector.connected = true;
        connector.lastHeartbeat = new Date();
        connector.connectionAttempts = 0;
        
        logger.info('市场连接成功', { marketType });
        return { success: true, marketType, connectedAt: connector.lastHeartbeat };
      } else {
        throw new Error('连接失败');
      }
    } catch (error) {
      logger.error('市场连接失败', { marketType, error: error.message });
      return { success: false, marketType, error: error.message };
    }
  }

  /**
   * 获取市场实时数据
   */
  async getMarketData(marketType, timeRange = '1h') {
    try {
      const cacheKey = `market_data_${marketType}_${timeRange}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 60000) { // 1分钟缓存
        return cached.data;
      }

      const connector = this.marketConnectors.get(marketType);
      if (!connector || !connector.connected) {
        throw new Error(`市场 ${marketType} 未连接`);
      }

      // 模拟获取市场数据
      const marketData = this.generateMockMarketData(marketType, timeRange);
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data: marketData,
        timestamp: Date.now()
      });

      logger.info('获取市场数据成功', { marketType, timeRange, dataPoints: marketData.prices.length });
      return marketData;
    } catch (error) {
      logger.error('获取市场数据失败', { marketType, error: error.message });
      throw error;
    }
  }

  /**
   * 生成模拟市场数据
   */
  generateMockMarketData(marketType, timeRange) {
    const now = new Date();
    const dataPoints = timeRange === '1h' ? 60 : timeRange === '1d' ? 24 : 12;
    const basePrice = marketType === MARKET_TYPE.SPOT ? 50 : 
                     marketType === MARKET_TYPE.DAY_AHEAD ? 45 : 55;
    
    const prices = [];
    const volumes = [];
    const timestamps = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(now.getTime() - (dataPoints - i) * 60000);
      const price = basePrice + (Math.random() - 0.5) * 20; // ±10元波动
      const volume = 1000 + Math.random() * 2000; // 1000-3000 MWh
      
      timestamps.push(timestamp);
      prices.push(Math.round(price * 100) / 100);
      volumes.push(Math.round(volume * 100) / 100);
    }
    
    return {
      marketType,
      timeRange,
      timestamps,
      prices,
      volumes,
      currentPrice: prices[prices.length - 1],
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      priceChange: prices[prices.length - 1] - prices[0],
      totalVolume: volumes.reduce((a, b) => a + b, 0),
      lastUpdated: now
    };
  }

  /**
   * 提交交易报价
   */
  async submitTradingBid(bidData) {
    try {
      const {
        vppId,
        marketType,
        tradeType,
        quantity,
        price,
        timeSlot,
        validUntil,
        strategyId
      } = bidData;

      // 验证输入参数
      this.validateBidData(bidData);

      // 检查市场连接
      const connector = this.marketConnectors.get(marketType);
      if (!connector || !connector.connected) {
        await this.connectToMarket(marketType);
      }

      // 创建交易订单
      const orderId = uuidv4();
      const order = {
        id: orderId,
        vppId,
        marketType,
        tradeType,
        quantity,
        price,
        timeSlot,
        validUntil: validUntil || new Date(Date.now() + 3600000), // 默认1小时有效
        strategyId,
        status: TRADING_STATUS.PENDING,
        submittedAt: new Date(),
        executedAt: null,
        executedPrice: null,
        executedQuantity: null,
        fees: 0,
        errorMessage: null
      };

      // 模拟提交到市场
      const submissionResult = await this.simulateMarketSubmission(order);
      
      if (submissionResult.success) {
        order.status = TRADING_STATUS.SUBMITTED;
        order.marketOrderId = submissionResult.marketOrderId;
        this.activeOrders.set(orderId, order);
        
        // 保存到数据库
        await this.saveTradingOrder(order);
        
        logger.info('交易报价提交成功', { orderId, marketType, tradeType, quantity, price });
        return { success: true, orderId, order };
      } else {
        order.status = TRADING_STATUS.FAILED;
        order.errorMessage = submissionResult.error;
        
        logger.error('交易报价提交失败', { orderId, error: submissionResult.error });
        return { success: false, orderId, error: submissionResult.error };
      }
    } catch (error) {
      logger.error('提交交易报价异常', { error: error.message, bidData });
      throw error;
    }
  }

  /**
   * 验证报价数据
   */
  validateBidData(bidData) {
    const required = ['vppId', 'marketType', 'tradeType', 'quantity', 'price'];
    for (const field of required) {
      if (!bidData[field]) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }

    if (bidData.quantity <= 0) {
      throw new Error('交易数量必须大于0');
    }

    if (bidData.price <= 0) {
      throw new Error('交易价格必须大于0');
    }

    if (!Object.values(MARKET_TYPE).includes(bidData.marketType)) {
      throw new Error(`不支持的市场类型: ${bidData.marketType}`);
    }

    if (!Object.values(TRADE_TYPE).includes(bidData.tradeType)) {
      throw new Error(`不支持的交易类型: ${bidData.tradeType}`);
    }
  }

  /**
   * 模拟市场提交
   */
  async simulateMarketSubmission(order) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // 模拟提交成功率（95%）
      const success = Math.random() > 0.05;
      
      if (success) {
        return {
          success: true,
          marketOrderId: `MKT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      } else {
        const errors = [
          '市场暂时关闭',
          '价格超出限制范围',
          '数量超出最大限制',
          '网络连接超时',
          '市场拒绝订单'
        ];
        return {
          success: false,
          error: errors[Math.floor(Math.random() * errors.length)]
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取交易结果
   */
  async getTradingResults(filters = {}) {
    try {
      const {
        vppId,
        marketType,
        status,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = filters;

      let query = 'SELECT * FROM trading_orders WHERE 1=1';
      const params = [];

      if (vppId) {
        query += ' AND vpp_id = ?';
        params.push(vppId);
      }

      if (marketType) {
        query += ' AND market_type = ?';
        params.push(marketType);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (startDate) {
        query += ' AND submitted_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND submitted_at <= ?';
        params.push(endDate);
      }

      query += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const results = await vppDatabase.query(query, params);
      
      // 获取总数
      let countQuery = 'SELECT COUNT(*) as total FROM trading_orders WHERE 1=1';
      const countParams = params.slice(0, -2); // 移除limit和offset参数
      
      if (vppId) countQuery += ' AND vpp_id = ?';
      if (marketType) countQuery += ' AND market_type = ?';
      if (status) countQuery += ' AND status = ?';
      if (startDate) countQuery += ' AND submitted_at >= ?';
      if (endDate) countQuery += ' AND submitted_at <= ?';
      
      const [{ total }] = await vppDatabase.query(countQuery, countParams);

      logger.info('获取交易结果成功', { total, returned: results.length });
      return {
        results,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + results.length < total
        }
      };
    } catch (error) {
      logger.error('获取交易结果失败', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * 执行调度指令
   */
  async executeDispatchInstruction(instruction) {
    try {
      const {
        vppId,
        dispatchType,
        targetValue,
        duration,
        priority = 'NORMAL',
        scheduledTime
      } = instruction;

      // 验证调度指令
      this.validateDispatchInstruction(instruction);

      // 创建执行任务
      const executionId = uuidv4();
      const execution = {
        id: executionId,
        vppId,
        dispatchType,
        targetValue,
        duration,
        priority,
        scheduledTime: scheduledTime || new Date(),
        status: EXECUTION_STATUS.PENDING,
        progress: 0,
        actualValue: 0,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        createdAt: new Date()
      };

      // 添加到执行队列
      this.executionQueue.push(execution);
      
      // 按优先级排序
      this.executionQueue.sort((a, b) => {
        const priorityOrder = { 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // 保存到数据库
      await this.saveDispatchExecution(execution);

      // 启动执行处理
      if (!this.isProcessing) {
        this.processExecutionQueue();
      }

      logger.info('调度指令已加入执行队列', { executionId, dispatchType, vppId });
      return { success: true, executionId, execution };
    } catch (error) {
      logger.error('执行调度指令失败', { error: error.message, instruction });
      throw error;
    }
  }

  /**
   * 验证调度指令
   */
  validateDispatchInstruction(instruction) {
    const required = ['vppId', 'dispatchType', 'targetValue'];
    for (const field of required) {
      if (instruction[field] === undefined || instruction[field] === null) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }

    if (!Object.values(DISPATCH_TYPE).includes(instruction.dispatchType)) {
      throw new Error(`不支持的调度类型: ${instruction.dispatchType}`);
    }

    if (instruction.targetValue < 0) {
      throw new Error('目标值不能为负数');
    }

    if (instruction.duration && instruction.duration <= 0) {
      throw new Error('持续时间必须大于0');
    }
  }

  /**
   * 处理执行队列
   */
  async processExecutionQueue() {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      while (this.executionQueue.length > 0) {
        const execution = this.executionQueue.shift();
        
        // 检查是否到达执行时间
        if (execution.scheduledTime > new Date()) {
          // 重新加入队列等待
          this.executionQueue.unshift(execution);
          break;
        }

        await this.executeDispatchTask(execution);
      }
    } catch (error) {
      logger.error('处理执行队列异常', { error: error.message });
    } finally {
      this.isProcessing = false;
      
      // 如果还有任务，延迟继续处理
      if (this.executionQueue.length > 0) {
        setTimeout(() => this.processExecutionQueue(), 5000);
      }
    }
  }

  /**
   * 执行调度任务
   */
  async executeDispatchTask(execution) {
    try {
      execution.status = EXECUTION_STATUS.IN_PROGRESS;
      execution.startedAt = new Date();
      
      await this.updateDispatchExecution(execution);
      
      logger.info('开始执行调度任务', { 
        executionId: execution.id, 
        dispatchType: execution.dispatchType,
        targetValue: execution.targetValue
      });

      // 模拟执行过程
      const steps = 10;
      const stepDuration = (execution.duration || 60) * 1000 / steps; // 转换为毫秒
      
      for (let step = 1; step <= steps; step++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
        
        execution.progress = (step / steps) * 100;
        execution.actualValue = (execution.targetValue * step) / steps;
        
        await this.updateDispatchExecution(execution);
        
        // 模拟执行失败的可能性（5%）
        if (Math.random() < 0.05) {
          throw new Error('设备响应超时');
        }
      }

      execution.status = EXECUTION_STATUS.COMPLETED;
      execution.completedAt = new Date();
      execution.progress = 100;
      execution.actualValue = execution.targetValue;
      
      await this.updateDispatchExecution(execution);
      
      logger.info('调度任务执行完成', { 
        executionId: execution.id,
        actualValue: execution.actualValue,
        duration: execution.completedAt - execution.startedAt
      });
    } catch (error) {
      execution.status = EXECUTION_STATUS.FAILED;
      execution.errorMessage = error.message;
      execution.completedAt = new Date();
      
      await this.updateDispatchExecution(execution);
      
      logger.error('调度任务执行失败', { 
        executionId: execution.id, 
        error: error.message 
      });
    }
  }

  /**
   * 获取执行状态
   */
  async getExecutionStatus(executionId) {
    try {
      const query = 'SELECT * FROM dispatch_executions WHERE id = ?';
      const [execution] = await vppDatabase.query(query, [executionId]);
      
      if (!execution) {
        throw new Error(`执行任务不存在: ${executionId}`);
      }

      return execution;
    } catch (error) {
      logger.error('获取执行状态失败', { executionId, error: error.message });
      throw error;
    }
  }

  /**
   * 保存交易订单
   */
  async saveTradingOrder(order) {
    try {
      const query = `
        INSERT INTO trading_orders (
          id, vpp_id, market_type, trade_type, quantity, price, time_slot,
          valid_until, strategy_id, status, submitted_at, market_order_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await vppDatabase.query(query, [
        order.id, order.vppId, order.marketType, order.tradeType,
        order.quantity, order.price, order.timeSlot, order.validUntil,
        order.strategyId, order.status, order.submittedAt, order.marketOrderId
      ]);
    } catch (error) {
      logger.error('保存交易订单失败', { orderId: order.id, error: error.message });
      throw error;
    }
  }

  /**
   * 保存调度执行记录
   */
  async saveDispatchExecution(execution) {
    try {
      const query = `
        INSERT INTO dispatch_executions (
          id, vpp_id, dispatch_type, target_value, duration, priority,
          scheduled_time, status, progress, actual_value, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await vppDatabase.query(query, [
        execution.id, execution.vppId, execution.dispatchType, execution.targetValue,
        execution.duration, execution.priority, execution.scheduledTime,
        execution.status, execution.progress, execution.actualValue, execution.createdAt
      ]);
    } catch (error) {
      logger.error('保存调度执行记录失败', { executionId: execution.id, error: error.message });
      throw error;
    }
  }

  /**
   * 更新调度执行记录
   */
  async updateDispatchExecution(execution) {
    try {
      const query = `
        UPDATE dispatch_executions SET
          status = ?, progress = ?, actual_value = ?, started_at = ?,
          completed_at = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await vppDatabase.query(query, [
        execution.status, execution.progress, execution.actualValue,
        execution.startedAt, execution.completedAt, execution.errorMessage,
        execution.id
      ]);
    } catch (error) {
      logger.error('更新调度执行记录失败', { executionId: execution.id, error: error.message });
      throw error;
    }
  }

  /**
   * 获取服务状态
   */
  getServiceStatus() {
    const connectedMarkets = Array.from(this.marketConnectors.entries())
      .filter(([, connector]) => connector.connected)
      .map(([marketType]) => marketType);
    
    return {
      status: 'running',
      connectedMarkets,
      totalMarkets: this.marketConnectors.size,
      activeOrders: this.activeOrders.size,
      executionQueueLength: this.executionQueue.length,
      isProcessingQueue: this.isProcessing,
      cacheSize: this.cache.size,
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    logger.info('交易服务缓存已清理');
  }
}

// 导出服务实例和枚举
module.exports = {
  VPPTradingService,
  TRADING_STATUS,
  MARKET_TYPE,
  TRADE_TYPE,
  DISPATCH_TYPE,
  EXECUTION_STATUS
};