/**
 * 虚拟电厂策略引擎服务
 * 负责交易策略的管理、执行和监控
 * P1阶段核心功能：规则驱动策略引擎
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const vppDatabase = require('./vppDatabase');

// 策略类型枚举
const STRATEGY_TYPES = {
  RULE_BASED: 'RULE_BASED',
  AI_DRIVEN: 'AI_DRIVEN',
  HYBRID: 'HYBRID'
};

// 策略状态枚举
const STRATEGY_STATUS = {
  DRAFT: 'DRAFT',
  TESTING: 'TESTING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED'
};

// 条件操作符枚举
const CONDITION_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_EQUAL: 'greater_equal',
  LESS_EQUAL: 'less_equal',
  CONTAINS: 'contains',
  IN: 'in',
  BETWEEN: 'between'
};

// 动作类型枚举
const ACTION_TYPES = {
  BID_PRICE: 'bid_price',
  BID_QUANTITY: 'bid_quantity',
  MARKET_PARTICIPATION: 'market_participation',
  RESOURCE_DISPATCH: 'resource_dispatch',
  ALERT: 'alert',
  LOG: 'log'
};

class VPPStrategyService {
  constructor() {
    this.cache = new Map();
    this.executionHistory = new Map();
    this.performanceMetrics = new Map();
  }

  /**
   * 创建交易策略
   * @param {Object} strategyData - 策略数据
   * @returns {Promise<Object>} 创建的策略信息
   */
  async createStrategy(strategyData) {
    try {
      const strategyId = uuidv4();
      const now = new Date();
      
      // 验证策略配置
      this.validateStrategyConfig(strategyData);
      
      const strategy = {
        id: strategyId,
        name: strategyData.name,
        vpp_id: strategyData.vpp_id,
        strategy_type: strategyData.strategy_type,
        config: JSON.stringify(strategyData.config),
        model_version: strategyData.model_version || null,
        status: STRATEGY_STATUS.DRAFT,
        performance_metrics: JSON.stringify({
          total_executions: 0,
          success_rate: 0,
          average_revenue: 0,
          risk_score: 0
        }),
        created_at: now,
        updated_at: now
      };
      
      // 插入数据库
      const query = `
        INSERT INTO trading_strategies 
        (id, name, vpp_id, strategy_type, config, model_version, status, performance_metrics, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await vppDatabase.execute(query, [
        strategy.id, strategy.name, strategy.vpp_id, strategy.strategy_type,
        strategy.config, strategy.model_version, strategy.status,
        strategy.performance_metrics, strategy.created_at, strategy.updated_at
      ]);
      
      // 更新缓存
      this.cache.set(strategyId, {
        ...strategy,
        config: strategyData.config,
        performance_metrics: JSON.parse(strategy.performance_metrics)
      });
      
      logger.info(`策略创建成功: ${strategyId}`, { strategy: strategy.name });
      
      return {
        id: strategyId,
        name: strategy.name,
        vpp_id: strategy.vpp_id,
        strategy_type: strategy.strategy_type,
        status: strategy.status,
        created_at: strategy.created_at
      };
      
    } catch (error) {
      logger.error('创建策略失败:', error);
      throw new Error(`创建策略失败: ${error.message}`);
    }
  }

  /**
   * 获取策略列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 策略列表
   */
  async getStrategies(filters = {}) {
    try {
      let query = 'SELECT * FROM trading_strategies WHERE 1=1';
      const params = [];
      
      if (filters.vpp_id) {
        query += ' AND vpp_id = ?';
        params.push(filters.vpp_id);
      }
      
      if (filters.strategy_type) {
        query += ' AND strategy_type = ?';
        params.push(filters.strategy_type);
      }
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (filters.page && filters.size) {
        const offset = (filters.page - 1) * filters.size;
        query += ' LIMIT ? OFFSET ?';
        params.push(filters.size, offset);
      }
      
      const strategies = await vppDatabase.query(query, params);
      
      return strategies.map(strategy => ({
        ...strategy,
        config: JSON.parse(strategy.config || '{}'),
        performance_metrics: JSON.parse(strategy.performance_metrics || '{}')
      }));
      
    } catch (error) {
      logger.error('获取策略列表失败:', error);
      throw new Error(`获取策略列表失败: ${error.message}`);
    }
  }

  /**
   * 获取策略详情
   * @param {string} strategyId - 策略ID
   * @returns {Promise<Object>} 策略详情
   */
  async getStrategyById(strategyId) {
    try {
      // 先从缓存获取
      if (this.cache.has(strategyId)) {
        return this.cache.get(strategyId);
      }
      
      const query = 'SELECT * FROM trading_strategies WHERE id = ?';
      const strategies = await vppDatabase.query(query, [strategyId]);
      
      if (strategies.length === 0) {
        throw new Error('策略不存在');
      }
      
      const strategy = strategies[0];
      const result = {
        ...strategy,
        config: JSON.parse(strategy.config || '{}'),
        performance_metrics: JSON.parse(strategy.performance_metrics || '{}')
      };
      
      // 更新缓存
      this.cache.set(strategyId, result);
      
      return result;
      
    } catch (error) {
      logger.error('获取策略详情失败:', error);
      throw new Error(`获取策略详情失败: ${error.message}`);
    }
  }

  /**
   * 更新策略
   * @param {string} strategyId - 策略ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateStrategy(strategyId, updateData) {
    try {
      const strategy = await this.getStrategyById(strategyId);
      
      if (!strategy) {
        throw new Error('策略不存在');
      }
      
      const updates = {};
      const params = [];
      
      if (updateData.name) {
        updates.name = '?';
        params.push(updateData.name);
      }
      
      if (updateData.config) {
        this.validateStrategyConfig({ config: updateData.config });
        updates.config = '?';
        params.push(JSON.stringify(updateData.config));
      }
      
      if (updateData.status) {
        if (!Object.values(STRATEGY_STATUS).includes(updateData.status)) {
          throw new Error('无效的策略状态');
        }
        updates.status = '?';
        params.push(updateData.status);
      }
      
      if (updateData.model_version) {
        updates.model_version = '?';
        params.push(updateData.model_version);
      }
      
      updates.updated_at = '?';
      params.push(new Date());
      
      const setClause = Object.keys(updates).map(key => `${key} = ${updates[key]}`).join(', ');
      const query = `UPDATE trading_strategies SET ${setClause} WHERE id = ?`;
      params.push(strategyId);
      
      await vppDatabase.execute(query, params);
      
      // 清除缓存
      this.cache.delete(strategyId);
      
      logger.info(`策略更新成功: ${strategyId}`);
      
      return { success: true, message: '策略更新成功' };
      
    } catch (error) {
      logger.error('更新策略失败:', error);
      throw new Error(`更新策略失败: ${error.message}`);
    }
  }

  /**
   * 删除策略
   * @param {string} strategyId - 策略ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteStrategy(strategyId) {
    try {
      const strategy = await this.getStrategyById(strategyId);
      
      if (!strategy) {
        throw new Error('策略不存在');
      }
      
      if (strategy.status === STRATEGY_STATUS.ACTIVE) {
        throw new Error('无法删除活跃状态的策略，请先暂停策略');
      }
      
      const query = 'DELETE FROM trading_strategies WHERE id = ?';
      await vppDatabase.execute(query, [strategyId]);
      
      // 清除缓存
      this.cache.delete(strategyId);
      this.executionHistory.delete(strategyId);
      this.performanceMetrics.delete(strategyId);
      
      logger.info(`策略删除成功: ${strategyId}`);
      
      return { success: true, message: '策略删除成功' };
      
    } catch (error) {
      logger.error('删除策略失败:', error);
      throw new Error(`删除策略失败: ${error.message}`);
    }
  }

  /**
   * 执行策略
   * @param {string} strategyId - 策略ID
   * @param {Object} marketData - 市场数据
   * @param {Object} vppData - VPP数据
   * @returns {Promise<Object>} 执行结果
   */
  async executeStrategy(strategyId, marketData, vppData) {
    try {
      const strategy = await this.getStrategyById(strategyId);
      
      if (!strategy) {
        throw new Error('策略不存在');
      }
      
      if (strategy.status !== STRATEGY_STATUS.ACTIVE) {
        throw new Error('策略未激活，无法执行');
      }
      
      let result;
      
      switch (strategy.strategy_type) {
        case STRATEGY_TYPES.RULE_BASED:
          result = await this.executeRuleBasedStrategy(strategy, marketData, vppData);
          break;
        case STRATEGY_TYPES.AI_DRIVEN:
          result = await this.executeAIStrategy(strategy, marketData, vppData);
          break;
        case STRATEGY_TYPES.HYBRID:
          result = await this.executeHybridStrategy(strategy, marketData, vppData);
          break;
        default:
          throw new Error('不支持的策略类型');
      }
      
      // 记录执行历史
      this.recordExecution(strategyId, result);
      
      // 更新性能指标
      await this.updatePerformanceMetrics(strategyId, result);
      
      logger.info(`策略执行成功: ${strategyId}`, { result });
      
      return result;
      
    } catch (error) {
      logger.error('策略执行失败:', error);
      throw new Error(`策略执行失败: ${error.message}`);
    }
  }

  /**
   * 执行规则驱动策略
   * @param {Object} strategy - 策略对象
   * @param {Object} marketData - 市场数据
   * @param {Object} vppData - VPP数据
   * @returns {Promise<Object>} 执行结果
   */
  async executeRuleBasedStrategy(strategy, marketData, vppData) {
    const { rules } = strategy.config;
    const actions = [];
    
    for (const rule of rules) {
      const conditionsMet = this.evaluateConditions(rule.conditions, { marketData, vppData });
      
      if (conditionsMet) {
        for (const action of rule.actions) {
          const actionResult = await this.executeAction(action, { marketData, vppData, strategy });
          actions.push(actionResult);
        }
      }
    }
    
    return {
      strategy_id: strategy.id,
      strategy_type: STRATEGY_TYPES.RULE_BASED,
      execution_time: new Date(),
      actions,
      success: true
    };
  }

  /**
   * 执行AI驱动策略
   * @param {Object} strategy - 策略对象
   * @param {Object} marketData - 市场数据
   * @param {Object} vppData - VPP数据
   * @returns {Promise<Object>} 执行结果
   */
  async executeAIStrategy(strategy, marketData, vppData) {
    // TODO: 集成AI模型预测
    // 这里先返回模拟结果，后续集成AI模型管理服务
    
    const { model_config } = strategy.config;
    
    // 模拟AI预测结果
    const prediction = {
      bid_price: marketData.current_price * (0.95 + Math.random() * 0.1),
      bid_quantity: vppData.available_capacity * (0.8 + Math.random() * 0.4),
      confidence: 0.85 + Math.random() * 0.15
    };
    
    const actions = [
      {
        type: ACTION_TYPES.BID_PRICE,
        value: prediction.bid_price,
        confidence: prediction.confidence
      },
      {
        type: ACTION_TYPES.BID_QUANTITY,
        value: prediction.bid_quantity,
        confidence: prediction.confidence
      }
    ];
    
    return {
      strategy_id: strategy.id,
      strategy_type: STRATEGY_TYPES.AI_DRIVEN,
      execution_time: new Date(),
      prediction,
      actions,
      success: true
    };
  }

  /**
   * 执行混合策略
   * @param {Object} strategy - 策略对象
   * @param {Object} marketData - 市场数据
   * @param {Object} vppData - VPP数据
   * @returns {Promise<Object>} 执行结果
   */
  async executeHybridStrategy(strategy, marketData, vppData) {
    // 先执行规则策略
    const ruleResult = await this.executeRuleBasedStrategy(strategy, marketData, vppData);
    
    // 再执行AI策略
    const aiResult = await this.executeAIStrategy(strategy, marketData, vppData);
    
    // 合并结果
    const combinedActions = [...ruleResult.actions, ...aiResult.actions];
    
    return {
      strategy_id: strategy.id,
      strategy_type: STRATEGY_TYPES.HYBRID,
      execution_time: new Date(),
      rule_result: ruleResult,
      ai_result: aiResult,
      actions: combinedActions,
      success: true
    };
  }

  /**
   * 评估条件
   * @param {Array} conditions - 条件数组
   * @param {Object} context - 上下文数据
   * @returns {boolean} 条件是否满足
   */
  evaluateConditions(conditions, context) {
    return conditions.every(condition => {
      const { field, operator, value } = condition;
      const actualValue = this.getFieldValue(field, context);
      
      switch (operator) {
        case CONDITION_OPERATORS.EQUALS:
          return actualValue === value;
        case CONDITION_OPERATORS.NOT_EQUALS:
          return actualValue !== value;
        case CONDITION_OPERATORS.GREATER_THAN:
          return actualValue > value;
        case CONDITION_OPERATORS.LESS_THAN:
          return actualValue < value;
        case CONDITION_OPERATORS.GREATER_EQUAL:
          return actualValue >= value;
        case CONDITION_OPERATORS.LESS_EQUAL:
          return actualValue <= value;
        case CONDITION_OPERATORS.CONTAINS:
          return String(actualValue).includes(String(value));
        case CONDITION_OPERATORS.IN:
          return Array.isArray(value) && value.includes(actualValue);
        case CONDITION_OPERATORS.BETWEEN:
          return Array.isArray(value) && value.length === 2 && 
                 actualValue >= value[0] && actualValue <= value[1];
        default:
          return false;
      }
    });
  }

  /**
   * 获取字段值
   * @param {string} field - 字段路径
   * @param {Object} context - 上下文数据
   * @returns {any} 字段值
   */
  getFieldValue(field, context) {
    const parts = field.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * 执行动作
   * @param {Object} action - 动作对象
   * @param {Object} context - 上下文数据
   * @returns {Promise<Object>} 动作执行结果
   */
  async executeAction(action, context) {
    const { type, parameters } = action;
    
    switch (type) {
      case ACTION_TYPES.BID_PRICE:
        return {
          type,
          value: this.calculateBidPrice(parameters, context),
          timestamp: new Date()
        };
      case ACTION_TYPES.BID_QUANTITY:
        return {
          type,
          value: this.calculateBidQuantity(parameters, context),
          timestamp: new Date()
        };
      case ACTION_TYPES.MARKET_PARTICIPATION:
        return {
          type,
          value: this.determineMarketParticipation(parameters, context),
          timestamp: new Date()
        };
      case ACTION_TYPES.ALERT:
        await this.sendAlert(parameters, context);
        return {
          type,
          value: 'alert_sent',
          timestamp: new Date()
        };
      case ACTION_TYPES.LOG:
        logger.info('策略日志:', { parameters, context });
        return {
          type,
          value: 'logged',
          timestamp: new Date()
        };
      default:
        throw new Error(`不支持的动作类型: ${type}`);
    }
  }

  /**
   * 计算报价
   * @param {Object} parameters - 参数
   * @param {Object} context - 上下文
   * @returns {number} 报价
   */
  calculateBidPrice(parameters, context) {
    const { marketData } = context;
    const basePrice = marketData.current_price || 0;
    const adjustment = parameters.adjustment || 0;
    const multiplier = parameters.multiplier || 1;
    
    return (basePrice + adjustment) * multiplier;
  }

  /**
   * 计算报量
   * @param {Object} parameters - 参数
   * @param {Object} context - 上下文
   * @returns {number} 报量
   */
  calculateBidQuantity(parameters, context) {
    const { vppData } = context;
    const availableCapacity = vppData.available_capacity || 0;
    const ratio = parameters.ratio || 1;
    const maxQuantity = parameters.max_quantity || availableCapacity;
    
    return Math.min(availableCapacity * ratio, maxQuantity);
  }

  /**
   * 确定市场参与
   * @param {Object} parameters - 参数
   * @param {Object} context - 上下文
   * @returns {boolean} 是否参与
   */
  determineMarketParticipation(parameters, context) {
    const { marketData, vppData } = context;
    const minPrice = parameters.min_price || 0;
    const minCapacity = parameters.min_capacity || 0;
    
    return marketData.current_price >= minPrice && vppData.available_capacity >= minCapacity;
  }

  /**
   * 发送告警
   * @param {Object} parameters - 参数
   * @param {Object} context - 上下文
   */
  async sendAlert(parameters, context) {
    // TODO: 集成告警服务
    logger.warn('策略告警:', { parameters, context });
  }

  /**
   * 记录执行历史
   * @param {string} strategyId - 策略ID
   * @param {Object} result - 执行结果
   */
  recordExecution(strategyId, result) {
    if (!this.executionHistory.has(strategyId)) {
      this.executionHistory.set(strategyId, []);
    }
    
    const history = this.executionHistory.get(strategyId);
    history.push({
      timestamp: new Date(),
      result,
      success: result.success
    });
    
    // 保留最近100次执行记录
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  /**
   * 更新性能指标
   * @param {string} strategyId - 策略ID
   * @param {Object} result - 执行结果
   */
  async updatePerformanceMetrics(strategyId, result) {
    try {
      const history = this.executionHistory.get(strategyId) || [];
      const totalExecutions = history.length;
      const successfulExecutions = history.filter(h => h.success).length;
      const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;
      
      const metrics = {
        total_executions: totalExecutions,
        success_rate: successRate,
        average_revenue: 0, // TODO: 计算平均收益
        risk_score: 0, // TODO: 计算风险评分
        last_execution: new Date()
      };
      
      const query = 'UPDATE trading_strategies SET performance_metrics = ?, updated_at = ? WHERE id = ?';
      await vppDatabase.execute(query, [JSON.stringify(metrics), new Date(), strategyId]);
      
      // 更新缓存
      if (this.cache.has(strategyId)) {
        const cachedStrategy = this.cache.get(strategyId);
        cachedStrategy.performance_metrics = metrics;
      }
      
    } catch (error) {
      logger.error('更新性能指标失败:', error);
    }
  }

  /**
   * 验证策略配置
   * @param {Object} strategyData - 策略数据
   */
  validateStrategyConfig(strategyData) {
    const { config } = strategyData;
    
    if (!config) {
      throw new Error('策略配置不能为空');
    }
    
    if (strategyData.strategy_type === STRATEGY_TYPES.RULE_BASED) {
      if (!config.rules || !Array.isArray(config.rules)) {
        throw new Error('规则驱动策略必须包含规则数组');
      }
      
      for (const rule of config.rules) {
        if (!rule.conditions || !Array.isArray(rule.conditions)) {
          throw new Error('规则必须包含条件数组');
        }
        
        if (!rule.actions || !Array.isArray(rule.actions)) {
          throw new Error('规则必须包含动作数组');
        }
      }
    }
    
    if (strategyData.strategy_type === STRATEGY_TYPES.AI_DRIVEN) {
      if (!config.model_config) {
        throw new Error('AI驱动策略必须包含模型配置');
      }
    }
  }

  /**
   * 获取策略执行历史
   * @param {string} strategyId - 策略ID
   * @param {number} limit - 限制数量
   * @returns {Array} 执行历史
   */
  getExecutionHistory(strategyId, limit = 50) {
    const history = this.executionHistory.get(strategyId) || [];
    return history.slice(-limit);
  }

  /**
   * 获取服务状态
   * @returns {Object} 服务状态
   */
  getServiceStatus() {
    return {
      service: 'VPPStrategyService',
      status: 'running',
      cached_strategies: this.cache.size,
      execution_histories: this.executionHistory.size,
      supported_strategy_types: Object.values(STRATEGY_TYPES),
      supported_operators: Object.values(CONDITION_OPERATORS),
      supported_actions: Object.values(ACTION_TYPES),
      timestamp: new Date()
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    this.executionHistory.clear();
    this.performanceMetrics.clear();
    logger.info('策略服务缓存已清理');
  }
}

// 导出常量和服务类
module.exports = {
  VPPStrategyService,
  STRATEGY_TYPES,
  STRATEGY_STATUS,
  CONDITION_OPERATORS,
  ACTION_TYPES
};