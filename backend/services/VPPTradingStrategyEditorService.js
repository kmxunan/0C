/**
 * 虚拟电厂交易策略编辑器服务
 * 实现IFTTT风格的规则驱动策略编辑和AI驱动策略框架
 */

import dbPromise from '../database/database.js';
import logger from '../utils/logger.js';
import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';

// 策略类型枚举
const STRATEGY_TYPE = {
  RULE_BASED: 'rule_based',
  AI_DRIVEN: 'ai_driven',
  HYBRID: 'hybrid',
  MANUAL: 'manual'
};

// 条件类型枚举
const CONDITION_TYPE = {
  PRICE_THRESHOLD: 'price_threshold',
  TIME_BASED: 'time_based',
  VOLUME_THRESHOLD: 'volume_threshold',
  MARKET_STATUS: 'market_status',
  WEATHER_CONDITION: 'weather_condition',
  DEMAND_FORECAST: 'demand_forecast',
  SUPPLY_FORECAST: 'supply_forecast',
  GRID_FREQUENCY: 'grid_frequency',
  CARBON_INTENSITY: 'carbon_intensity',
  CUSTOM_INDICATOR: 'custom_indicator'
};

// 动作类型枚举
const ACTION_TYPE = {
  SUBMIT_BID: 'submit_bid',
  CANCEL_ORDER: 'cancel_order',
  ADJUST_PRICE: 'adjust_price',
  MODIFY_VOLUME: 'modify_volume',
  ACTIVATE_RESOURCE: 'activate_resource',
  DEACTIVATE_RESOURCE: 'deactivate_resource',
  SEND_NOTIFICATION: 'send_notification',
  TRIGGER_BACKUP: 'trigger_backup',
  EXECUTE_HEDGE: 'execute_hedge',
  CUSTOM_ACTION: 'custom_action'
};

// 操作符枚举
const OPERATOR = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_EQUAL: 'greater_equal',
  LESS_EQUAL: 'less_equal',
  BETWEEN: 'between',
  IN: 'in',
  NOT_IN: 'not_in',
  CONTAINS: 'contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with'
};

// 策略状态枚举
const STRATEGY_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  ARCHIVED: 'archived',
  ERROR: 'error'
};

class VPPTradingStrategyEditorService extends EventEmitter {
  constructor() {
    super();
    
    // 策略管理
    this.strategies = new Map();
    this.ruleEngine = new Map();
    this.aiModels = new Map();
    
    // 执行状态
    this.executionQueue = [];
    this.activeExecutions = new Map();
    
    // 配置参数
    this.config = {
      maxRulesPerStrategy: 50,
      maxActionsPerRule: 10,
      executionTimeout: 30000,
      evaluationInterval: 5000,
      maxConcurrentExecutions: 20,
      strategyVersionLimit: 10
    };
    
    // 统计信息
    this.statistics = {
      totalStrategies: 0,
      activeStrategies: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };
    
    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    try {
      await this.createTables();
      await this.loadStrategies();
      await this.startStrategyEvaluator();
      
      logger.info('VPP交易策略编辑器服务初始化完成');
    } catch (error) {
      logger.error('VPP交易策略编辑器服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    const db = await dbPromise;
    
    // 策略定义表
    await db.schema.hasTable('vpp_trading_strategies').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_trading_strategies', table => {
          table.increments('id').primary();
          table.string('strategy_id', 50).unique().notNullable();
          table.string('strategy_name', 100).notNullable();
          table.text('description');
          table.enum('strategy_type', Object.values(STRATEGY_TYPE)).notNullable();
          table.enum('status', Object.values(STRATEGY_STATUS)).defaultTo(STRATEGY_STATUS.DRAFT);
          table.integer('version').defaultTo(1);
          table.string('parent_strategy_id', 50);
          table.json('strategy_config');
          table.json('risk_parameters');
          table.json('performance_targets');
          table.integer('priority').defaultTo(1);
          table.boolean('is_active').defaultTo(false);
          table.timestamp('activated_at');
          table.timestamp('deactivated_at');
          table.string('created_by', 50);
          table.string('updated_by', 50);
          table.timestamps(true, true);
          
          table.index(['strategy_type', 'status']);
          table.index(['is_active', 'priority']);
          table.index('strategy_id');
        });
      }
    });
    
    // 策略规则表
    await db.schema.hasTable('vpp_strategy_rules').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_strategy_rules', table => {
          table.increments('id').primary();
          table.string('rule_id', 50).unique().notNullable();
          table.string('strategy_id', 50).notNullable();
          table.string('rule_name', 100).notNullable();
          table.text('description');
          table.integer('rule_order').notNullable();
          table.boolean('is_enabled').defaultTo(true);
          table.json('conditions');
          table.json('actions');
          table.json('execution_config');
          table.integer('execution_count').defaultTo(0);
          table.timestamp('last_executed_at');
          table.timestamps(true, true);
          
          table.foreign('strategy_id').references('strategy_id').inTable('vpp_trading_strategies');
          table.index(['strategy_id', 'rule_order']);
          table.index(['is_enabled', 'rule_order']);
        });
      }
    });
    
    // 策略执行历史表
    await db.schema.hasTable('vpp_strategy_executions').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_strategy_executions', table => {
          table.increments('id').primary();
          table.string('execution_id', 50).unique().notNullable();
          table.string('strategy_id', 50).notNullable();
          table.string('rule_id', 50);
          table.timestamp('started_at').notNullable();
          table.timestamp('completed_at');
          table.string('execution_status', 20).notNullable();
          table.json('input_data');
          table.json('output_data');
          table.json('execution_context');
          table.text('error_message');
          table.integer('execution_time_ms');
          table.decimal('performance_score', 5, 2);
          table.timestamps(true, true);
          
          table.foreign('strategy_id').references('strategy_id').inTable('vpp_trading_strategies');
          table.index(['strategy_id', 'started_at']);
          table.index(['execution_status', 'started_at']);
        });
      }
    });
    
    // A/B测试表
    await db.schema.hasTable('vpp_strategy_ab_tests').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_strategy_ab_tests', table => {
          table.increments('id').primary();
          table.string('test_id', 50).unique().notNullable();
          table.string('test_name', 100).notNullable();
          table.text('description');
          table.string('control_strategy_id', 50).notNullable();
          table.string('variant_strategy_id', 50).notNullable();
          table.decimal('traffic_split', 3, 2).defaultTo(0.5);
          table.timestamp('start_date').notNullable();
          table.timestamp('end_date');
          table.string('status', 20).defaultTo('running');
          table.json('success_metrics');
          table.json('test_results');
          table.timestamps(true, true);
          
          table.foreign('control_strategy_id').references('strategy_id').inTable('vpp_trading_strategies');
          table.foreign('variant_strategy_id').references('strategy_id').inTable('vpp_trading_strategies');
          table.index(['status', 'start_date']);
        });
      }
    });
  }

  /**
   * 创建新策略
   */
  async createStrategy(strategyData) {
    try {
      const strategyId = uuidv4();
      const db = await dbPromise;
      
      const strategy = {
        strategy_id: strategyId,
        strategy_name: strategyData.name,
        description: strategyData.description,
        strategy_type: strategyData.type || STRATEGY_TYPE.RULE_BASED,
        status: STRATEGY_STATUS.DRAFT,
        version: 1,
        strategy_config: strategyData.config || {},
        risk_parameters: strategyData.riskParameters || {
          max_position_size: 100,
          max_daily_loss: 10000,
          stop_loss_threshold: 0.05
        },
        performance_targets: strategyData.performanceTargets || {
          target_return: 0.1,
          max_drawdown: 0.05,
          sharpe_ratio: 1.5
        },
        priority: strategyData.priority || 1,
        created_by: strategyData.createdBy || 'system'
      };
      
      await db('vpp_trading_strategies').insert(strategy);
      
      this.strategies.set(strategyId, strategy);
      this.statistics.totalStrategies++;
      
      logger.info(`策略创建成功: ${strategyId}`);
      this.emit('strategyCreated', { strategyId, strategy });
      
      return {
        success: true,
        strategyId,
        strategy
      };
    } catch (error) {
      logger.error('创建策略失败:', error);
      throw error;
    }
  }

  /**
   * 添加规则到策略
   */
  async addRuleToStrategy(strategyId, ruleData) {
    try {
      const db = await dbPromise;
      const ruleId = uuidv4();
      
      // 验证策略存在
      const strategy = await db('vpp_trading_strategies')
        .where('strategy_id', strategyId)
        .first();
      
      if (!strategy) {
        throw new Error(`策略不存在: ${strategyId}`);
      }
      
      // 检查规则数量限制
      const ruleCount = await db('vpp_strategy_rules')
        .where('strategy_id', strategyId)
        .count('id as count')
        .first();
      
      if (ruleCount.count >= this.config.maxRulesPerStrategy) {
        throw new Error(`策略规则数量已达上限: ${this.config.maxRulesPerStrategy}`);
      }
      
      // 获取下一个规则顺序
      const lastRule = await db('vpp_strategy_rules')
        .where('strategy_id', strategyId)
        .orderBy('rule_order', 'desc')
        .first();
      
      const ruleOrder = lastRule ? lastRule.rule_order + 1 : 1;
      
      const rule = {
        rule_id: ruleId,
        strategy_id: strategyId,
        rule_name: ruleData.name,
        description: ruleData.description,
        rule_order: ruleOrder,
        is_enabled: ruleData.isEnabled !== false,
        conditions: this.validateConditions(ruleData.conditions),
        actions: this.validateActions(ruleData.actions),
        execution_config: ruleData.executionConfig || {
          max_executions_per_hour: 10,
          cooldown_period: 300, // 5 minutes
          retry_attempts: 3
        }
      };
      
      await db('vpp_strategy_rules').insert(rule);
      
      logger.info(`规则添加成功: ${ruleId} -> ${strategyId}`);
      this.emit('ruleAdded', { strategyId, ruleId, rule });
      
      return {
        success: true,
        ruleId,
        rule
      };
    } catch (error) {
      logger.error('添加规则失败:', error);
      throw error;
    }
  }

  /**
   * 验证条件配置
   */
  validateConditions(conditions) {
    if (!Array.isArray(conditions)) {
      throw new Error('条件必须是数组格式');
    }
    
    return conditions.map(condition => {
      if (!condition.type || !Object.values(CONDITION_TYPE).includes(condition.type)) {
        throw new Error(`无效的条件类型: ${condition.type}`);
      }
      
      if (!condition.operator || !Object.values(OPERATOR).includes(condition.operator)) {
        throw new Error(`无效的操作符: ${condition.operator}`);
      }
      
      return {
        type: condition.type,
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        metadata: condition.metadata || {}
      };
    });
  }

  /**
   * 验证动作配置
   */
  validateActions(actions) {
    if (!Array.isArray(actions)) {
      throw new Error('动作必须是数组格式');
    }
    
    if (actions.length > this.config.maxActionsPerRule) {
      throw new Error(`动作数量超过限制: ${this.config.maxActionsPerRule}`);
    }
    
    return actions.map(action => {
      if (!action.type || !Object.values(ACTION_TYPE).includes(action.type)) {
        throw new Error(`无效的动作类型: ${action.type}`);
      }
      
      return {
        type: action.type,
        parameters: action.parameters || {},
        priority: action.priority || 1,
        timeout: action.timeout || 30000,
        retry_policy: action.retryPolicy || {
          max_attempts: 3,
          backoff_multiplier: 2
        }
      };
    });
  }

  /**
   * 激活策略
   */
  async activateStrategy(strategyId) {
    try {
      const db = await dbPromise;
      
      await db('vpp_trading_strategies')
        .where('strategy_id', strategyId)
        .update({
          status: STRATEGY_STATUS.ACTIVE,
          is_active: true,
          activated_at: new Date()
        });
      
      // 加载策略到内存
      await this.loadStrategy(strategyId);
      
      this.statistics.activeStrategies++;
      
      logger.info(`策略已激活: ${strategyId}`);
      this.emit('strategyActivated', { strategyId });
      
      return { success: true };
    } catch (error) {
      logger.error('激活策略失败:', error);
      throw error;
    }
  }

  /**
   * 停用策略
   */
  async deactivateStrategy(strategyId) {
    try {
      const db = await dbPromise;
      
      await db('vpp_trading_strategies')
        .where('strategy_id', strategyId)
        .update({
          status: STRATEGY_STATUS.STOPPED,
          is_active: false,
          deactivated_at: new Date()
        });
      
      // 从内存中移除
      this.strategies.delete(strategyId);
      this.ruleEngine.delete(strategyId);
      
      this.statistics.activeStrategies--;
      
      logger.info(`策略已停用: ${strategyId}`);
      this.emit('strategyDeactivated', { strategyId });
      
      return { success: true };
    } catch (error) {
      logger.error('停用策略失败:', error);
      throw error;
    }
  }

  /**
   * 加载策略到内存
   */
  async loadStrategy(strategyId) {
    try {
      const db = await dbPromise;
      
      const strategy = await db('vpp_trading_strategies')
        .where('strategy_id', strategyId)
        .first();
      
      if (!strategy) {
        throw new Error(`策略不存在: ${strategyId}`);
      }
      
      const rules = await db('vpp_strategy_rules')
        .where('strategy_id', strategyId)
        .where('is_enabled', true)
        .orderBy('rule_order');
      
      this.strategies.set(strategyId, strategy);
      this.ruleEngine.set(strategyId, rules);
      
      logger.info(`策略加载完成: ${strategyId}`);
    } catch (error) {
      logger.error('加载策略失败:', error);
      throw error;
    }
  }

  /**
   * 加载所有活跃策略
   */
  async loadStrategies() {
    try {
      const db = await dbPromise;
      
      const activeStrategies = await db('vpp_trading_strategies')
        .where('is_active', true)
        .where('status', STRATEGY_STATUS.ACTIVE);
      
      for (const strategy of activeStrategies) {
        await this.loadStrategy(strategy.strategy_id);
      }
      
      this.statistics.activeStrategies = activeStrategies.length;
      logger.info(`加载了 ${activeStrategies.length} 个活跃策略`);
    } catch (error) {
      logger.error('加载策略失败:', error);
      throw error;
    }
  }

  /**
   * 启动策略评估器
   */
  startStrategyEvaluator() {
    setInterval(() => {
      this.evaluateStrategies();
    }, this.config.evaluationInterval);
    
    logger.info('策略评估器已启动');
  }

  /**
   * 评估所有活跃策略
   */
  async evaluateStrategies() {
    try {
      for (const [strategyId, strategy] of this.strategies) {
        if (strategy.is_active && strategy.status === STRATEGY_STATUS.ACTIVE) {
          await this.evaluateStrategy(strategyId);
        }
      }
    } catch (error) {
      logger.error('策略评估失败:', error);
    }
  }

  /**
   * 评估单个策略
   */
  async evaluateStrategy(strategyId) {
    try {
      const rules = this.ruleEngine.get(strategyId);
      if (!rules) return;
      
      for (const rule of rules) {
        if (await this.evaluateRule(strategyId, rule)) {
          await this.executeRule(strategyId, rule);
        }
      }
    } catch (error) {
      logger.error(`策略评估失败 ${strategyId}:`, error);
    }
  }

  /**
   * 评估规则条件
   */
  async evaluateRule(strategyId, rule) {
    try {
      const conditions = rule.conditions;
      if (!conditions || conditions.length === 0) return false;
      
      // 获取当前市场数据
      const marketData = await this.getCurrentMarketData();
      
      // 评估所有条件（AND逻辑）
      for (const condition of conditions) {
        if (!await this.evaluateCondition(condition, marketData)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`规则评估失败 ${rule.rule_id}:`, error);
      return false;
    }
  }

  /**
   * 评估单个条件
   */
  async evaluateCondition(condition, marketData) {
    try {
      const { type, field, operator, value } = condition;
      let actualValue;
      
      // 根据条件类型获取实际值
      switch (type) {
        case CONDITION_TYPE.PRICE_THRESHOLD:
          actualValue = marketData.price;
          break;
        case CONDITION_TYPE.VOLUME_THRESHOLD:
          actualValue = marketData.volume;
          break;
        case CONDITION_TYPE.TIME_BASED:
          actualValue = new Date().getHours();
          break;
        case CONDITION_TYPE.MARKET_STATUS:
          actualValue = marketData.status;
          break;
        default:
          actualValue = marketData[field];
      }
      
      // 根据操作符比较值
      return this.compareValues(actualValue, operator, value);
    } catch (error) {
      logger.error('条件评估失败:', error);
      return false;
    }
  }

  /**
   * 比较值
   */
  compareValues(actual, operator, expected) {
    switch (operator) {
      case OPERATOR.EQUALS:
        return actual === expected;
      case OPERATOR.NOT_EQUALS:
        return actual !== expected;
      case OPERATOR.GREATER_THAN:
        return actual > expected;
      case OPERATOR.LESS_THAN:
        return actual < expected;
      case OPERATOR.GREATER_EQUAL:
        return actual >= expected;
      case OPERATOR.LESS_EQUAL:
        return actual <= expected;
      case OPERATOR.BETWEEN:
        return actual >= expected[0] && actual <= expected[1];
      case OPERATOR.IN:
        return Array.isArray(expected) && expected.includes(actual);
      case OPERATOR.NOT_IN:
        return Array.isArray(expected) && !expected.includes(actual);
      default:
        return false;
    }
  }

  /**
   * 执行规则动作
   */
  async executeRule(strategyId, rule) {
    try {
      const executionId = uuidv4();
      const startTime = Date.now();
      
      // 记录执行开始
      await this.recordExecution(executionId, strategyId, rule.rule_id, 'started');
      
      const actions = rule.actions;
      const results = [];
      
      for (const action of actions) {
        const result = await this.executeAction(action);
        results.push(result);
      }
      
      const executionTime = Date.now() - startTime;
      
      // 记录执行完成
      await this.recordExecution(executionId, strategyId, rule.rule_id, 'completed', {
        results,
        executionTime
      });
      
      this.statistics.totalExecutions++;
      this.statistics.successfulExecutions++;
      this.statistics.averageExecutionTime = 
        (this.statistics.averageExecutionTime + executionTime) / 2;
      
      logger.info(`规则执行成功: ${rule.rule_id}`);
      this.emit('ruleExecuted', { strategyId, ruleId: rule.rule_id, results });
      
    } catch (error) {
      logger.error(`规则执行失败 ${rule.rule_id}:`, error);
      this.statistics.failedExecutions++;
      
      await this.recordExecution(executionId, strategyId, rule.rule_id, 'failed', {
        error: error.message
      });
    }
  }

  /**
   * 执行动作
   */
  async executeAction(action) {
    try {
      const { type, parameters } = action;
      
      switch (type) {
        case ACTION_TYPE.SUBMIT_BID:
          return await this.submitBid(parameters);
        case ACTION_TYPE.CANCEL_ORDER:
          return await this.cancelOrder(parameters);
        case ACTION_TYPE.ADJUST_PRICE:
          return await this.adjustPrice(parameters);
        case ACTION_TYPE.MODIFY_VOLUME:
          return await this.modifyVolume(parameters);
        case ACTION_TYPE.SEND_NOTIFICATION:
          return await this.sendNotification(parameters);
        default:
          throw new Error(`未支持的动作类型: ${type}`);
      }
    } catch (error) {
      logger.error('动作执行失败:', error);
      throw error;
    }
  }

  /**
   * 提交投标
   */
  async submitBid(parameters) {
    // 实现投标逻辑
    logger.info('提交投标:', parameters);
    return { success: true, action: 'bid_submitted', parameters };
  }

  /**
   * 取消订单
   */
  async cancelOrder(parameters) {
    // 实现取消订单逻辑
    logger.info('取消订单:', parameters);
    return { success: true, action: 'order_cancelled', parameters };
  }

  /**
   * 调整价格
   */
  async adjustPrice(parameters) {
    // 实现价格调整逻辑
    logger.info('调整价格:', parameters);
    return { success: true, action: 'price_adjusted', parameters };
  }

  /**
   * 修改数量
   */
  async modifyVolume(parameters) {
    // 实现数量修改逻辑
    logger.info('修改数量:', parameters);
    return { success: true, action: 'volume_modified', parameters };
  }

  /**
   * 发送通知
   */
  async sendNotification(parameters) {
    // 实现通知发送逻辑
    logger.info('发送通知:', parameters);
    return { success: true, action: 'notification_sent', parameters };
  }

  /**
   * 获取当前市场数据
   */
  async getCurrentMarketData() {
    // 模拟市场数据
    return {
      price: 50.5 + Math.random() * 10,
      volume: 1000 + Math.random() * 500,
      status: 'open',
      timestamp: new Date()
    };
  }

  /**
   * 记录执行历史
   */
  async recordExecution(executionId, strategyId, ruleId, status, data = {}) {
    try {
      const db = await dbPromise;
      
      const execution = {
        execution_id: executionId,
        strategy_id: strategyId,
        rule_id: ruleId,
        execution_status: status,
        ...data
      };
      
      if (status === 'started') {
        execution.started_at = new Date();
      } else {
        execution.completed_at = new Date();
        if (data.executionTime) {
          execution.execution_time_ms = data.executionTime;
        }
      }
      
      await db('vpp_strategy_executions').insert(execution);
    } catch (error) {
      logger.error('记录执行历史失败:', error);
    }
  }

  /**
   * 获取策略列表
   */
  async getStrategies(filters = {}) {
    try {
      const db = await dbPromise;
      let query = db('vpp_trading_strategies');
      
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      
      if (filters.type) {
        query = query.where('strategy_type', filters.type);
      }
      
      if (filters.isActive !== undefined) {
        query = query.where('is_active', filters.isActive);
      }
      
      const strategies = await query.orderBy('created_at', 'desc');
      
      return {
        success: true,
        strategies,
        total: strategies.length
      };
    } catch (error) {
      logger.error('获取策略列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取策略详情
   */
  async getStrategyDetails(strategyId) {
    try {
      const db = await dbPromise;
      
      const strategy = await db('vpp_trading_strategies')
        .where('strategy_id', strategyId)
        .first();
      
      if (!strategy) {
        throw new Error(`策略不存在: ${strategyId}`);
      }
      
      const rules = await db('vpp_strategy_rules')
        .where('strategy_id', strategyId)
        .orderBy('rule_order');
      
      const executions = await db('vpp_strategy_executions')
        .where('strategy_id', strategyId)
        .orderBy('started_at', 'desc')
        .limit(100);
      
      return {
        success: true,
        strategy,
        rules,
        executions,
        statistics: await this.getStrategyStatistics(strategyId)
      };
    } catch (error) {
      logger.error('获取策略详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取策略统计信息
   */
  async getStrategyStatistics(strategyId) {
    try {
      const db = await dbPromise;
      
      const stats = await db('vpp_strategy_executions')
        .where('strategy_id', strategyId)
        .select(
          db.raw('COUNT(*) as total_executions'),
          db.raw('COUNT(CASE WHEN execution_status = "completed" THEN 1 END) as successful_executions'),
          db.raw('COUNT(CASE WHEN execution_status = "failed" THEN 1 END) as failed_executions'),
          db.raw('AVG(execution_time_ms) as avg_execution_time'),
          db.raw('AVG(performance_score) as avg_performance_score')
        )
        .first();
      
      return {
        totalExecutions: parseInt(stats.total_executions) || 0,
        successfulExecutions: parseInt(stats.successful_executions) || 0,
        failedExecutions: parseInt(stats.failed_executions) || 0,
        successRate: stats.total_executions > 0 ? 
          (stats.successful_executions / stats.total_executions * 100).toFixed(2) : 0,
        averageExecutionTime: parseFloat(stats.avg_execution_time) || 0,
        averagePerformanceScore: parseFloat(stats.avg_performance_score) || 0
      };
    } catch (error) {
      logger.error('获取策略统计失败:', error);
      return {};
    }
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus() {
    return {
      service: 'VPP Trading Strategy Editor',
      status: 'running',
      statistics: this.statistics,
      activeStrategies: this.strategies.size,
      loadedRules: Array.from(this.ruleEngine.values()).reduce((sum, rules) => sum + rules.length, 0),
      uptime: Date.now() - this.statistics.uptime,
      timestamp: new Date().toISOString()
    };
  }
}

const vppTradingStrategyEditorService = new VPPTradingStrategyEditorService();

export default vppTradingStrategyEditorService;
export {
  STRATEGY_TYPE,
  CONDITION_TYPE,
  ACTION_TYPE,
  OPERATOR,
  STRATEGY_STATUS
};