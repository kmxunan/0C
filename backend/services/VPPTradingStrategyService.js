/**
 * 虚拟电厂交易策略编辑器服务
 * P0阶段：实现可视化策略编辑、策略模板库、策略验证
 * 支持拖拽式策略构建、实时策略仿真、策略性能评估
 * 
 * @author VPP Development Team
 * @version 1.0.0
 * @since P0 Phase
 */

import logger from '../../src/shared/utils/logger.js';
import { dbPromise } from '../../src/infrastructure/database/index.js';
import { TIME_INTERVALS, MATH_CONSTANTS, ENERGY_CONSTANTS } from '../../src/shared/constants/MathConstants.js';

/**
 * 策略类型枚举
 */
const STRATEGY_TYPES = {
  ARBITRAGE: 'arbitrage',           // 套利策略
  PEAK_SHAVING: 'peak_shaving',     // 削峰策略
  LOAD_FOLLOWING: 'load_following', // 负荷跟踪
  FREQUENCY_REGULATION: 'frequency_regulation', // 频率调节
  DEMAND_RESPONSE: 'demand_response', // 需求响应
  RENEWABLE_INTEGRATION: 'renewable_integration', // 可再生能源集成
  CUSTOM: 'custom'                  // 自定义策略
};

/**
 * 策略状态枚举
 */
const STRATEGY_STATUS = {
  DRAFT: 'draft',
  TESTING: 'testing',
  VALIDATED: 'validated',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
  ERROR: 'error'
};

/**
 * 策略组件类型
 */
const COMPONENT_TYPES = {
  TRIGGER: 'trigger',               // 触发器
  CONDITION: 'condition',           // 条件
  ACTION: 'action',                 // 动作
  FILTER: 'filter',                 // 过滤器
  CALCULATOR: 'calculator',         // 计算器
  TIMER: 'timer',                   // 定时器
  VALIDATOR: 'validator'            // 验证器
};

/**
 * 市场类型枚举
 */
const MARKET_TYPES = {
  DAY_AHEAD: 'day_ahead',           // 日前市场
  REAL_TIME: 'real_time',           // 实时市场
  ANCILLARY: 'ancillary',           // 辅助服务市场
  CAPACITY: 'capacity',             // 容量市场
  BILATERAL: 'bilateral'            // 双边交易
};

class VPPTradingStrategyService {
  constructor() {
    this.strategyTypes = STRATEGY_TYPES;
    this.strategyStatus = STRATEGY_STATUS;
    this.componentTypes = COMPONENT_TYPES;
    this.marketTypes = MARKET_TYPES;
    
    // 策略缓存
    this.strategyCache = new Map();
    this.templateCache = new Map();
    this.validationCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = TIME_INTERVALS.FIVE_MINUTES_MS;
    
    // 策略执行引擎
    this.executionEngine = {
      isRunning: false,
      activeStrategies: new Map(),
      executionQueue: [],
      maxConcurrentExecutions: 10
    };
    
    this.initialize();
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      logger.info('初始化VPP交易策略编辑器服务...');
      
      await this.createTables();
      await this.loadDefaultTemplates();
      
      logger.info('VPP交易策略编辑器服务初始化完成');
    } catch (error) {
      logger.error('VPP交易策略编辑器服务初始化失败:', error);
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    try {
      const db = await dbPromise;
      
      // 策略模板表
      const hasTemplateTable = await db.schema.hasTable('vpp_strategy_templates');
      if (!hasTemplateTable) {
        await db.schema.createTable('vpp_strategy_templates', (table) => {
          table.increments('id').primary();
          table.string('name', 255).notNullable();
          table.text('description');
          table.string('type', 100).notNullable();
          table.string('category', 100).defaultTo('general');
          table.string('market_type', 100);
          
          // 模板配置
          table.json('strategy_config');
          table.json('component_definitions');
          table.json('default_parameters');
          table.json('validation_rules');
          table.json('performance_metrics');
          
          // 适用条件
          table.json('applicable_resources');
          table.json('market_conditions');
          table.decimal('min_capacity', 12, 2);
          table.decimal('max_capacity', 12, 2);
          
          // 版本信息
          table.string('version', 20).defaultTo('1.0.0');
          table.boolean('is_default').defaultTo(false);
          table.boolean('is_public').defaultTo(true);
          table.integer('usage_count').defaultTo(0);
          table.decimal('success_rate', 5, 2).defaultTo(0);
          
          // 标签和分类
          table.json('tags');
          table.string('difficulty_level', 50).defaultTo('intermediate');
          table.integer('estimated_setup_time').defaultTo(30); // 分钟
          
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          table.string('created_by', 100);
          table.string('updated_by', 100);
          
          table.index(['type', 'category']);
          table.index(['market_type']);
          table.index(['is_default', 'is_public']);
          table.index(['name']);
        });
        
        logger.info('创建vpp_strategy_templates表成功');
      }
      
      // 交易策略表
      const hasStrategyTable = await db.schema.hasTable('vpp_trading_strategies');
      if (!hasStrategyTable) {
        await db.schema.createTable('vpp_trading_strategies', (table) => {
          table.increments('id').primary();
          table.string('name', 255).notNullable();
          table.text('description');
          table.string('type', 100).notNullable();
          table.string('status', 50).defaultTo('draft');
          table.integer('template_id').unsigned().references('id').inTable('vpp_strategy_templates');
          
          // 策略配置
          table.json('strategy_definition');
          table.json('execution_parameters');
          table.json('risk_parameters');
          table.json('optimization_objectives');
          table.json('constraints');
          
          // 市场配置
          table.string('target_market', 100);
          table.json('market_parameters');
          table.json('trading_hours');
          table.json('price_thresholds');
          
          // 资源配置
          table.json('resource_allocation');
          table.decimal('min_capacity_requirement', 12, 2);
          table.decimal('max_capacity_limit', 12, 2);
          table.json('resource_constraints');
          
          // 执行配置
          table.integer('execution_frequency').defaultTo(300); // 秒
          table.boolean('auto_execution').defaultTo(false);
          table.json('execution_schedule');
          table.json('stop_conditions');
          
          // 性能指标
          table.decimal('expected_profit', 12, 2).defaultTo(0);
          table.decimal('risk_score', 5, 2).defaultTo(50);
          table.decimal('success_probability', 5, 2).defaultTo(70);
          table.json('historical_performance');
          
          // 验证状态
          table.boolean('is_validated').defaultTo(false);
          table.timestamp('last_validation').nullable();
          table.json('validation_results');
          table.json('validation_errors');
          
          // 执行状态
          table.timestamp('last_execution').nullable();
          table.json('execution_statistics');
          table.decimal('total_profit', 12, 2).defaultTo(0);
          table.integer('execution_count').defaultTo(0);
          table.integer('success_count').defaultTo(0);
          
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          table.string('created_by', 100);
          table.string('updated_by', 100);
          
          table.index(['type', 'status']);
          table.index(['target_market']);
          table.index(['auto_execution', 'status']);
          table.index(['name']);
        });
        
        logger.info('创建vpp_trading_strategies表成功');
      }
      
      // 策略组件表
      const hasComponentTable = await db.schema.hasTable('vpp_strategy_components');
      if (!hasComponentTable) {
        await db.schema.createTable('vpp_strategy_components', (table) => {
          table.increments('id').primary();
          table.integer('strategy_id').unsigned().references('id').inTable('vpp_trading_strategies').onDelete('CASCADE');
          table.string('component_type', 100).notNullable();
          table.string('component_name', 255).notNullable();
          table.text('description');
          
          // 组件配置
          table.json('component_config');
          table.json('input_parameters');
          table.json('output_parameters');
          table.json('validation_rules');
          
          // 执行配置
          table.integer('execution_order').defaultTo(1);
          table.boolean('is_required').defaultTo(true);
          table.boolean('is_enabled').defaultTo(true);
          table.json('execution_conditions');
          
          // 可视化配置
          table.json('visual_config');
          table.decimal('position_x', 10, 2).defaultTo(0);
          table.decimal('position_y', 10, 2).defaultTo(0);
          table.json('connections');
          
          // 性能统计
          table.integer('execution_count').defaultTo(0);
          table.integer('success_count').defaultTo(0);
          table.decimal('average_execution_time', 10, 3).defaultTo(0);
          table.timestamp('last_execution').nullable();
          
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          
          table.index(['strategy_id', 'execution_order']);
          table.index(['component_type']);
          table.index(['is_enabled', 'is_required']);
        });
        
        logger.info('创建vpp_strategy_components表成功');
      }
      
      // 策略验证记录表
      const hasValidationTable = await db.schema.hasTable('vpp_strategy_validations');
      if (!hasValidationTable) {
        await db.schema.createTable('vpp_strategy_validations', (table) => {
          table.increments('id').primary();
          table.integer('strategy_id').unsigned().references('id').inTable('vpp_trading_strategies').onDelete('CASCADE');
          table.string('validation_type', 100).notNullable(); // syntax, logic, simulation, backtest
          table.string('status', 50).notNullable(); // pending, running, passed, failed
          
          // 验证配置
          table.json('validation_config');
          table.json('test_scenarios');
          table.json('validation_criteria');
          
          // 验证结果
          table.json('validation_results');
          table.json('error_details');
          table.json('warning_details');
          table.json('performance_metrics');
          
          // 执行信息
          table.timestamp('started_at').defaultTo(db.fn.now());
          table.timestamp('completed_at').nullable();
          table.integer('execution_time_ms').defaultTo(0);
          table.string('executed_by', 100);
          
          // 评分
          table.decimal('overall_score', 5, 2).defaultTo(0);
          table.decimal('syntax_score', 5, 2).defaultTo(0);
          table.decimal('logic_score', 5, 2).defaultTo(0);
          table.decimal('performance_score', 5, 2).defaultTo(0);
          table.decimal('risk_score', 5, 2).defaultTo(0);
          
          table.index(['strategy_id', 'validation_type']);
          table.index(['status']);
          table.index(['started_at']);
        });
        
        logger.info('创建vpp_strategy_validations表成功');
      }
      
      // 策略执行日志表
      const hasExecutionTable = await db.schema.hasTable('vpp_strategy_executions');
      if (!hasExecutionTable) {
        await db.schema.createTable('vpp_strategy_executions', (table) => {
          table.increments('id').primary();
          table.integer('strategy_id').unsigned().references('id').inTable('vpp_trading_strategies').onDelete('CASCADE');
          table.string('execution_type', 100).notNullable(); // manual, scheduled, triggered
          table.string('status', 50).notNullable(); // pending, running, completed, failed, cancelled
          
          // 执行配置
          table.json('execution_config');
          table.json('market_conditions');
          table.json('resource_state');
          table.json('input_data');
          
          // 执行结果
          table.json('execution_results');
          table.json('trading_decisions');
          table.json('resource_allocations');
          table.decimal('profit_loss', 12, 2).defaultTo(0);
          table.decimal('energy_traded', 12, 2).defaultTo(0);
          
          // 性能指标
          table.decimal('execution_efficiency', 5, 2).defaultTo(0);
          table.integer('response_time_ms').defaultTo(0);
          table.json('component_performance');
          
          // 时间信息
          table.timestamp('started_at').defaultTo(db.fn.now());
          table.timestamp('completed_at').nullable();
          table.integer('total_execution_time_ms').defaultTo(0);
          
          // 错误信息
          table.json('error_details');
          table.text('error_message');
          table.json('debug_info');
          
          table.index(['strategy_id', 'started_at']);
          table.index(['status']);
          table.index(['execution_type']);
        });
        
        logger.info('创建vpp_strategy_executions表成功');
      }
      
    } catch (error) {
      logger.error('创建数据库表失败:', error);
      throw error;
    }
  }

  /**
   * 加载默认策略模板
   */
  async loadDefaultTemplates() {
    try {
      const db = await dbPromise;
      
      // 检查是否已有默认模板
      const existingTemplates = await db('vpp_strategy_templates')
        .where({ is_default: true })
        .count('id as count')
        .first();
        
      if (existingTemplates.count > 0) {
        logger.info('默认策略模板已存在，跳过加载');
        return;
      }
      
      // 定义默认模板
      const defaultTemplates = [
        {
          name: '基础套利策略',
          description: '基于价格差异的简单套利策略，适用于日前和实时市场',
          type: this.strategyTypes.ARBITRAGE,
          category: 'basic',
          market_type: this.marketTypes.DAY_AHEAD,
          strategy_config: {
            buy_threshold: 50,  // 买入价格阈值
            sell_threshold: 80, // 卖出价格阈值
            min_profit_margin: 10, // 最小利润率 %
            max_position_size: 1000 // 最大持仓 kWh
          },
          component_definitions: [
            {
              type: 'trigger',
              name: '价格监控触发器',
              config: { check_interval: 300 }
            },
            {
              type: 'condition',
              name: '套利机会检测',
              config: { price_spread_threshold: 15 }
            },
            {
              type: 'action',
              name: '交易执行',
              config: { execution_method: 'market_order' }
            }
          ],
          default_parameters: {
            risk_tolerance: 'medium',
            execution_speed: 'normal',
            position_sizing: 'conservative'
          },
          validation_rules: {
            required_capacity: 100,
            max_risk_exposure: 20,
            min_liquidity: 500
          },
          applicable_resources: ['battery', 'generator', 'load'],
          market_conditions: {
            volatility: 'medium',
            liquidity: 'high'
          },
          min_capacity: 100,
          max_capacity: 10000,
          tags: ['套利', '基础', '日前市场'],
          difficulty_level: 'beginner',
          estimated_setup_time: 15,
          is_default: true,
          is_public: true
        },
        {
          name: '削峰填谷策略',
          description: '通过储能设备在高峰时段放电、低谷时段充电来获得收益',
          type: this.strategyTypes.PEAK_SHAVING,
          category: 'energy_management',
          market_type: this.marketTypes.REAL_TIME,
          strategy_config: {
            peak_hours: ['09:00-12:00', '18:00-22:00'],
            valley_hours: ['23:00-06:00'],
            charge_efficiency: 0.95,
            discharge_efficiency: 0.92
          },
          component_definitions: [
            {
              type: 'timer',
              name: '时段监控',
              config: { check_frequency: 'hourly' }
            },
            {
              type: 'condition',
              name: '峰谷判断',
              config: { price_threshold_ratio: 1.5 }
            },
            {
              type: 'calculator',
              name: '收益计算',
              config: { include_efficiency_loss: true }
            },
            {
              type: 'action',
              name: '充放电控制',
              config: { ramp_rate_limit: 50 }
            }
          ],
          default_parameters: {
            soc_min: 20,
            soc_max: 90,
            power_limit: 500
          },
          applicable_resources: ['battery', 'pumped_hydro'],
          min_capacity: 500,
          max_capacity: 50000,
          tags: ['削峰', '储能', '实时市场'],
          difficulty_level: 'intermediate',
          estimated_setup_time: 30,
          is_default: true,
          is_public: true
        },
        {
          name: '频率调节策略',
          description: '参与电网频率调节服务，提供快速响应能力',
          type: this.strategyTypes.FREQUENCY_REGULATION,
          category: 'ancillary_services',
          market_type: this.marketTypes.ANCILLARY,
          strategy_config: {
            frequency_deadband: 0.02, // Hz
            response_time: 4, // 秒
            regulation_capacity: 0.8, // 容量比例
            bid_strategy: 'cost_plus_margin'
          },
          component_definitions: [
            {
              type: 'trigger',
              name: '频率信号监控',
              config: { sampling_rate: 1000 } // ms
            },
            {
              type: 'filter',
              name: '信号滤波',
              config: { filter_type: 'low_pass', cutoff: 0.1 }
            },
            {
              type: 'calculator',
              name: '调节量计算',
              config: { droop_coefficient: 5 }
            },
            {
              type: 'action',
              name: '功率调节',
              config: { max_ramp_rate: 100 }
            }
          ],
          applicable_resources: ['battery', 'generator', 'controllable_load'],
          min_capacity: 1000,
          max_capacity: 100000,
          tags: ['频率调节', '辅助服务', '快速响应'],
          difficulty_level: 'advanced',
          estimated_setup_time: 45,
          is_default: true,
          is_public: true
        },
        {
          name: '需求响应策略',
          description: '响应电网需求响应信号，调整负荷消费',
          type: this.strategyTypes.DEMAND_RESPONSE,
          category: 'demand_management',
          market_type: this.marketTypes.REAL_TIME,
          strategy_config: {
            response_types: ['emergency', 'economic', 'scheduled'],
            min_response_duration: 60, // 分钟
            max_response_duration: 240,
            compensation_rate: 0.5 // $/kWh
          },
          component_definitions: [
            {
              type: 'trigger',
              name: 'DR信号接收',
              config: { signal_sources: ['iso', 'utility'] }
            },
            {
              type: 'validator',
              name: '响应能力验证',
              config: { check_availability: true }
            },
            {
              type: 'calculator',
              name: '响应收益计算',
              config: { include_baseline: true }
            },
            {
              type: 'action',
              name: '负荷调节',
              config: { adjustment_method: 'proportional' }
            }
          ],
          applicable_resources: ['controllable_load', 'hvac', 'industrial_load'],
          min_capacity: 200,
          max_capacity: 20000,
          tags: ['需求响应', '负荷管理', '电网服务'],
          difficulty_level: 'intermediate',
          estimated_setup_time: 25,
          is_default: true,
          is_public: true
        }
      ];
      
      // 批量插入默认模板
      for (const template of defaultTemplates) {
        await db('vpp_strategy_templates').insert({
          ...template,
          strategy_config: JSON.stringify(template.strategy_config),
          component_definitions: JSON.stringify(template.component_definitions),
          default_parameters: JSON.stringify(template.default_parameters),
          validation_rules: JSON.stringify(template.validation_rules),
          applicable_resources: JSON.stringify(template.applicable_resources),
          market_conditions: JSON.stringify(template.market_conditions || {}),
          tags: JSON.stringify(template.tags),
          created_by: 'system'
        });
      }
      
      logger.info(`成功加载${defaultTemplates.length}个默认策略模板`);
      
    } catch (error) {
      logger.error('加载默认策略模板失败:', error);
    }
  }

  /**
   * 获取策略模板列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} - 模板列表
   */
  async getStrategyTemplates(filters = {}) {
    try {
      const {
        type,
        category,
        marketType,
        difficultyLevel,
        isPublic = true,
        search,
        limit = 50,
        offset = 0
      } = filters;
      
      const db = await dbPromise;
      
      let query = db('vpp_strategy_templates')
        .select('*');
      
      // 应用过滤条件
      if (type) {
        query = query.where('type', type);
      }
      
      if (category) {
        query = query.where('category', category);
      }
      
      if (marketType) {
        query = query.where('market_type', marketType);
      }
      
      if (difficultyLevel) {
        query = query.where('difficulty_level', difficultyLevel);
      }
      
      if (isPublic !== undefined) {
        query = query.where('is_public', isPublic);
      }
      
      if (search) {
        query = query.where(function() {
          this.where('name', 'like', `%${search}%`)
              .orWhere('description', 'like', `%${search}%`);
        });
      }
      
      // 排序和分页
      query = query.orderBy([['is_default', 'desc'], ['usage_count', 'desc'], ['created_at', 'desc']])
                   .limit(limit)
                   .offset(offset);
      
      const templates = await query;
      
      // 处理JSON字段
      return templates.map(template => ({
        ...template,
        strategy_config: template.strategy_config ? JSON.parse(template.strategy_config) : {},
        component_definitions: template.component_definitions ? 
          JSON.parse(template.component_definitions) : [],
        default_parameters: template.default_parameters ? 
          JSON.parse(template.default_parameters) : {},
        validation_rules: template.validation_rules ? 
          JSON.parse(template.validation_rules) : {},
        applicable_resources: template.applicable_resources ? 
          JSON.parse(template.applicable_resources) : [],
        market_conditions: template.market_conditions ? 
          JSON.parse(template.market_conditions) : {},
        tags: template.tags ? JSON.parse(template.tags) : []
      }));
      
    } catch (error) {
      logger.error('获取策略模板列表失败:', error);
      return [];
    }
  }

  /**
   * 创建交易策略
   * @param {Object} strategyData - 策略数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createStrategy(strategyData) {
    try {
      const {
        name,
        description,
        type,
        templateId,
        strategyDefinition = {},
        executionParameters = {},
        riskParameters = {},
        optimizationObjectives = {},
        constraints = {},
        targetMarket,
        marketParameters = {},
        resourceAllocation = {},
        components = [],
        createdBy
      } = strategyData;
      
      // 验证必要字段
      if (!name) {
        throw new Error('策略名称不能为空');
      }
      
      if (!type || !Object.values(this.strategyTypes).includes(type)) {
        throw new Error('无效的策略类型');
      }
      
      const db = await dbPromise;
      
      // 检查名称是否已存在
      const existing = await db('vpp_trading_strategies')
        .where({ name })
        .first();
        
      if (existing) {
        throw new Error(`策略名称已存在: ${name}`);
      }
      
      // 如果基于模板创建，获取模板信息
      let templateData = null;
      if (templateId) {
        templateData = await db('vpp_strategy_templates')
          .where({ id: templateId })
          .first();
          
        if (!templateData) {
          throw new Error('指定的模板不存在');
        }
        
        // 增加模板使用次数
        await db('vpp_strategy_templates')
          .where({ id: templateId })
          .increment('usage_count', 1);
      }
      
      // 合并模板配置和用户配置
      const finalStrategyDefinition = templateData ? 
        { ...JSON.parse(templateData.strategy_config || '{}'), ...strategyDefinition } :
        strategyDefinition;
      
      const finalExecutionParameters = templateData ? 
        { ...JSON.parse(templateData.default_parameters || '{}'), ...executionParameters } :
        executionParameters;
      
      // 创建策略
      const [strategyId] = await db('vpp_trading_strategies')
        .insert({
          name,
          description,
          type,
          template_id: templateId,
          strategy_definition: JSON.stringify(finalStrategyDefinition),
          execution_parameters: JSON.stringify(finalExecutionParameters),
          risk_parameters: JSON.stringify(riskParameters),
          optimization_objectives: JSON.stringify(optimizationObjectives),
          constraints: JSON.stringify(constraints),
          target_market: targetMarket,
          market_parameters: JSON.stringify(marketParameters),
          resource_allocation: JSON.stringify(resourceAllocation),
          created_by: createdBy || 'user'
        })
        .returning('id');
      
      // 创建策略组件
      if (components.length > 0) {
        await this.createStrategyComponents(strategyId, components);
      } else if (templateData && templateData.component_definitions) {
        // 使用模板的组件定义
        const templateComponents = JSON.parse(templateData.component_definitions);
        await this.createStrategyComponents(strategyId, templateComponents);
      }
      
      logger.info(`成功创建交易策略: ${name} (ID: ${strategyId})`);
      
      return {
        success: true,
        strategyId,
        message: '策略创建成功'
      };
      
    } catch (error) {
      logger.error('创建交易策略失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 创建策略组件
   * @param {number} strategyId - 策略ID
   * @param {Array} components - 组件列表
   */
  async createStrategyComponents(strategyId, components) {
    try {
      const db = await dbPromise;
      
      const componentRecords = components.map((component, index) => ({
        strategy_id: strategyId,
        component_type: component.type,
        component_name: component.name,
        description: component.description || '',
        component_config: JSON.stringify(component.config || {}),
        input_parameters: JSON.stringify(component.inputParameters || {}),
        output_parameters: JSON.stringify(component.outputParameters || {}),
        validation_rules: JSON.stringify(component.validationRules || {}),
        execution_order: component.executionOrder || (index + 1),
        is_required: component.isRequired !== undefined ? component.isRequired : true,
        is_enabled: component.isEnabled !== undefined ? component.isEnabled : true,
        execution_conditions: JSON.stringify(component.executionConditions || {}),
        visual_config: JSON.stringify(component.visualConfig || {}),
        position_x: component.positionX || 0,
        position_y: component.positionY || 0,
        connections: JSON.stringify(component.connections || [])
      }));
      
      await db('vpp_strategy_components').insert(componentRecords);
      
      logger.info(`为策略${strategyId}创建了${components.length}个组件`);
      
    } catch (error) {
      logger.error('创建策略组件失败:', error);
      throw error;
    }
  }

  /**
   * 验证策略
   * @param {number} strategyId - 策略ID
   * @param {Object} validationConfig - 验证配置
   * @returns {Promise<Object>} - 验证结果
   */
  async validateStrategy(strategyId, validationConfig = {}) {
    try {
      const {
        validationType = 'full', // syntax, logic, simulation, backtest, full
        testScenarios = [],
        validationCriteria = {},
        executedBy = 'user'
      } = validationConfig;
      
      const db = await dbPromise;
      
      // 获取策略信息
      const strategy = await db('vpp_trading_strategies')
        .where({ id: strategyId })
        .first();
        
      if (!strategy) {
        throw new Error('策略不存在');
      }
      
      // 创建验证记录
      const [validationId] = await db('vpp_strategy_validations')
        .insert({
          strategy_id: strategyId,
          validation_type: validationType,
          status: 'running',
          validation_config: JSON.stringify(validationConfig),
          test_scenarios: JSON.stringify(testScenarios),
          validation_criteria: JSON.stringify(validationCriteria),
          executed_by: executedBy
        })
        .returning('id');
      
      // 执行验证
      const validationResult = await this.performValidation(
        strategy, 
        validationType, 
        testScenarios, 
        validationCriteria
      );
      
      // 更新验证记录
      await db('vpp_strategy_validations')
        .where({ id: validationId })
        .update({
          status: validationResult.success ? 'passed' : 'failed',
          validation_results: JSON.stringify(validationResult.results),
          error_details: JSON.stringify(validationResult.errors || []),
          warning_details: JSON.stringify(validationResult.warnings || []),
          performance_metrics: JSON.stringify(validationResult.metrics || {}),
          completed_at: db.fn.now(),
          execution_time_ms: validationResult.executionTime,
          overall_score: validationResult.overallScore || 0,
          syntax_score: validationResult.syntaxScore || 0,
          logic_score: validationResult.logicScore || 0,
          performance_score: validationResult.performanceScore || 0,
          risk_score: validationResult.riskScore || 0
        });
      
      // 如果验证通过，更新策略状态
      if (validationResult.success && validationType === 'full') {
        await db('vpp_trading_strategies')
          .where({ id: strategyId })
          .update({
            is_validated: true,
            last_validation: db.fn.now(),
            validation_results: JSON.stringify(validationResult.results),
            status: this.strategyStatus.VALIDATED
          });
      }
      
      logger.info(`策略${strategyId}验证完成，结果: ${validationResult.success ? '通过' : '失败'}`);
      
      return {
        success: true,
        validationId,
        validationResult,
        message: validationResult.success ? '策略验证通过' : '策略验证失败'
      };
      
    } catch (error) {
      logger.error('策略验证失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 执行策略验证
   * @param {Object} strategy - 策略对象
   * @param {string} validationType - 验证类型
   * @param {Array} testScenarios - 测试场景
   * @param {Object} validationCriteria - 验证标准
   * @returns {Promise<Object>} - 验证结果
   */
  async performValidation(strategy, validationType, testScenarios, validationCriteria) {
    const startTime = Date.now();
    const results = {
      success: true,
      results: {},
      errors: [],
      warnings: [],
      metrics: {},
      overallScore: 0,
      syntaxScore: 0,
      logicScore: 0,
      performanceScore: 0,
      riskScore: 0
    };
    
    try {
      // 语法验证
      if (validationType === 'syntax' || validationType === 'full') {
        const syntaxResult = await this.validateSyntax(strategy);
        results.results.syntax = syntaxResult;
        results.syntaxScore = syntaxResult.score;
        
        if (!syntaxResult.valid) {
          results.success = false;
          results.errors.push(...syntaxResult.errors);
        }
        
        results.warnings.push(...syntaxResult.warnings);
      }
      
      // 逻辑验证
      if (validationType === 'logic' || validationType === 'full') {
        const logicResult = await this.validateLogic(strategy);
        results.results.logic = logicResult;
        results.logicScore = logicResult.score;
        
        if (!logicResult.valid) {
          results.success = false;
          results.errors.push(...logicResult.errors);
        }
        
        results.warnings.push(...logicResult.warnings);
      }
      
      // 仿真验证
      if (validationType === 'simulation' || validationType === 'full') {
        const simulationResult = await this.validateSimulation(strategy, testScenarios);
        results.results.simulation = simulationResult;
        results.performanceScore = simulationResult.score;
        
        if (!simulationResult.valid) {
          results.success = false;
          results.errors.push(...simulationResult.errors);
        }
        
        results.metrics = { ...results.metrics, ...simulationResult.metrics };
      }
      
      // 回测验证
      if (validationType === 'backtest' || validationType === 'full') {
        const backtestResult = await this.validateBacktest(strategy, validationCriteria);
        results.results.backtest = backtestResult;
        results.riskScore = backtestResult.riskScore;
        
        if (!backtestResult.valid) {
          results.warnings.push(...backtestResult.warnings);
        }
        
        results.metrics = { ...results.metrics, ...backtestResult.metrics };
      }
      
      // 计算总分
      const scores = [results.syntaxScore, results.logicScore, results.performanceScore, results.riskScore]
        .filter(score => score > 0);
      results.overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      
    } catch (error) {
      results.success = false;
      results.errors.push({
        type: 'validation_error',
        message: error.message,
        details: error.stack
      });
    }
    
    results.executionTime = Date.now() - startTime;
    return results;
  }

  /**
   * 语法验证
   * @param {Object} strategy - 策略对象
   * @returns {Promise<Object>} - 验证结果
   */
  async validateSyntax(strategy) {
    const result = {
      valid: true,
      score: 100,
      errors: [],
      warnings: []
    };
    
    try {
      // 检查必要字段
      const requiredFields = ['name', 'type', 'strategy_definition'];
      for (const field of requiredFields) {
        if (!strategy[field]) {
          result.errors.push({
            type: 'missing_field',
            field,
            message: `缺少必要字段: ${field}`
          });
          result.valid = false;
          result.score -= 20;
        }
      }
      
      // 验证JSON字段格式
      const jsonFields = ['strategy_definition', 'execution_parameters', 'risk_parameters'];
      for (const field of jsonFields) {
        if (strategy[field]) {
          try {
            JSON.parse(strategy[field]);
          } catch (error) {
            result.errors.push({
              type: 'invalid_json',
              field,
              message: `无效的JSON格式: ${field}`
            });
            result.valid = false;
            result.score -= 15;
          }
        }
      }
      
      // 检查策略类型
      if (strategy.type && !Object.values(this.strategyTypes).includes(strategy.type)) {
        result.errors.push({
          type: 'invalid_type',
          message: `无效的策略类型: ${strategy.type}`
        });
        result.valid = false;
        result.score -= 10;
      }
      
      // 检查市场类型
      if (strategy.target_market && !Object.values(this.marketTypes).includes(strategy.target_market)) {
        result.warnings.push({
          type: 'unknown_market',
          message: `未知的市场类型: ${strategy.target_market}`
        });
        result.score -= 5;
      }
      
    } catch (error) {
      result.valid = false;
      result.score = 0;
      result.errors.push({
        type: 'syntax_validation_error',
        message: error.message
      });
    }
    
    return result;
  }

  /**
   * 逻辑验证
   * @param {Object} strategy - 策略对象
   * @returns {Promise<Object>} - 验证结果
   */
  async validateLogic(strategy) {
    const result = {
      valid: true,
      score: 100,
      errors: [],
      warnings: []
    };
    
    try {
      const db = await dbPromise;
      
      // 获取策略组件
      const components = await db('vpp_strategy_components')
        .where({ strategy_id: strategy.id, is_enabled: true })
        .orderBy('execution_order');
      
      // 检查组件逻辑
      const componentTypes = components.map(c => c.component_type);
      
      // 必须有触发器
      if (!componentTypes.includes('trigger')) {
        result.errors.push({
          type: 'missing_trigger',
          message: '策略必须包含至少一个触发器组件'
        });
        result.valid = false;
        result.score -= 30;
      }
      
      // 必须有动作
      if (!componentTypes.includes('action')) {
        result.errors.push({
          type: 'missing_action',
          message: '策略必须包含至少一个动作组件'
        });
        result.valid = false;
        result.score -= 30;
      }
      
      // 检查组件连接
      for (const component of components) {
        const connections = JSON.parse(component.connections || '[]');
        for (const connection of connections) {
          const targetExists = components.some(c => c.id === connection.targetId);
          if (!targetExists) {
            result.errors.push({
              type: 'invalid_connection',
              componentId: component.id,
              message: `组件${component.component_name}连接到不存在的目标`
            });
            result.valid = false;
            result.score -= 10;
          }
        }
      }
      
      // 检查参数合理性
      const strategyDef = JSON.parse(strategy.strategy_definition || '{}');
      const riskParams = JSON.parse(strategy.risk_parameters || '{}');
      
      // 风险参数检查
      if (riskParams.max_loss && riskParams.max_loss > 50) {
        result.warnings.push({
          type: 'high_risk',
          message: '最大损失设置过高，可能存在风险'
        });
        result.score -= 5;
      }
      
      // 容量参数检查
      if (strategy.min_capacity_requirement && strategy.max_capacity_limit) {
        if (strategy.min_capacity_requirement > strategy.max_capacity_limit) {
          result.errors.push({
            type: 'invalid_capacity_range',
            message: '最小容量要求不能大于最大容量限制'
          });
          result.valid = false;
          result.score -= 20;
        }
      }
      
    } catch (error) {
      result.valid = false;
      result.score = 0;
      result.errors.push({
        type: 'logic_validation_error',
        message: error.message
      });
    }
    
    return result;
  }

  /**
   * 仿真验证
   * @param {Object} strategy - 策略对象
   * @param {Array} testScenarios - 测试场景
   * @returns {Promise<Object>} - 验证结果
   */
  async validateSimulation(strategy, testScenarios) {
    const result = {
      valid: true,
      score: 100,
      errors: [],
      warnings: [],
      metrics: {}
    };
    
    try {
      // 如果没有提供测试场景，使用默认场景
      const scenarios = testScenarios.length > 0 ? testScenarios : this.getDefaultTestScenarios(strategy.type);
      
      let totalProfit = 0;
      let successfulExecutions = 0;
      let totalExecutions = scenarios.length;
      
      for (const scenario of scenarios) {
        try {
          const simulationResult = await this.simulateStrategyExecution(strategy, scenario);
          
          if (simulationResult.success) {
            successfulExecutions++;
            totalProfit += simulationResult.profit || 0;
          } else {
            result.warnings.push({
              type: 'simulation_failure',
              scenario: scenario.name,
              message: simulationResult.error
            });
          }
        } catch (error) {
          result.errors.push({
            type: 'simulation_error',
            scenario: scenario.name,
            message: error.message
          });
        }
      }
      
      // 计算性能指标
      const successRate = (successfulExecutions / totalExecutions) * 100;
      const averageProfit = totalExecutions > 0 ? totalProfit / totalExecutions : 0;
      
      result.metrics = {
        success_rate: successRate,
        average_profit: averageProfit,
        total_simulations: totalExecutions,
        successful_simulations: successfulExecutions
      };
      
      // 评分
      if (successRate < 70) {
        result.valid = false;
        result.score = successRate;
      } else {
        result.score = Math.min(100, successRate + (averageProfit > 0 ? 10 : 0));
      }
      
    } catch (error) {
      result.valid = false;
      result.score = 0;
      result.errors.push({
        type: 'simulation_validation_error',
        message: error.message
      });
    }
    
    return result;
  }

  /**
   * 回测验证
   * @param {Object} strategy - 策略对象
   * @param {Object} validationCriteria - 验证标准
   * @returns {Promise<Object>} - 验证结果
   */
  async validateBacktest(strategy, validationCriteria) {
    const result = {
      valid: true,
      riskScore: 50,
      warnings: [],
      metrics: {}
    };
    
    try {
      // 模拟历史数据回测
      const backtestPeriod = validationCriteria.backtestPeriod || 30; // 天
      const historicalData = await this.generateHistoricalData(backtestPeriod);
      
      let totalReturn = 0;
      let maxDrawdown = 0;
      let volatility = 0;
      let sharpeRatio = 0;
      
      // 简化的回测计算
      const returns = [];
      for (let i = 0; i < historicalData.length; i++) {
        const dayReturn = Math.random() * 0.1 - 0.05; // -5% to +5%
        returns.push(dayReturn);
        totalReturn += dayReturn;
        
        // 计算最大回撤
        const currentDrawdown = Math.max(0, -dayReturn);
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      }
      
      // 计算波动率
      const meanReturn = totalReturn / returns.length;
      volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length);
      
      // 计算夏普比率
      sharpeRatio = volatility > 0 ? meanReturn / volatility : 0;
      
      result.metrics = {
        total_return: totalReturn,
        max_drawdown: maxDrawdown,
        volatility,
        sharpe_ratio: sharpeRatio,
        backtest_period: backtestPeriod
      };
      
      // 风险评估
      if (maxDrawdown > 0.2) {
        result.warnings.push({
          type: 'high_drawdown',
          message: '最大回撤过高，存在较大风险'
        });
        result.riskScore = 30;
      } else if (volatility > 0.15) {
        result.warnings.push({
          type: 'high_volatility',
          message: '策略波动性较高'
        });
        result.riskScore = 40;
      } else {
        result.riskScore = 70;
      }
      
    } catch (error) {
      result.valid = false;
      result.riskScore = 0;
      result.warnings.push({
        type: 'backtest_error',
        message: error.message
      });
    }
    
    return result;
  }

  /**
   * 获取默认测试场景
   * @param {string} strategyType - 策略类型
   * @returns {Array} - 测试场景列表
   */
  getDefaultTestScenarios(strategyType) {
    const baseScenarios = [
      {
        name: '正常市场条件',
        marketConditions: {
          price: 50,
          volatility: 0.1,
          liquidity: 'high'
        },
        resourceState: {
          availability: 0.9,
          capacity: 1000
        }
      },
      {
        name: '高价格波动',
        marketConditions: {
          price: 75,
          volatility: 0.3,
          liquidity: 'medium'
        },
        resourceState: {
          availability: 0.8,
          capacity: 1000
        }
      },
      {
        name: '低价格环境',
        marketConditions: {
          price: 25,
          volatility: 0.05,
          liquidity: 'high'
        },
        resourceState: {
          availability: 0.95,
          capacity: 1000
        }
      }
    ];
    
    // 根据策略类型添加特定场景
    if (strategyType === this.strategyTypes.ARBITRAGE) {
      baseScenarios.push({
        name: '套利机会',
        marketConditions: {
          dayAheadPrice: 40,
          realTimePrice: 60,
          spread: 20
        },
        resourceState: {
          availability: 1.0,
          capacity: 1000
        }
      });
    }
    
    return baseScenarios;
  }

  /**
   * 模拟策略执行
   * @param {Object} strategy - 策略对象
   * @param {Object} scenario - 测试场景
   * @returns {Promise<Object>} - 执行结果
   */
  async simulateStrategyExecution(strategy, scenario) {
    try {
      // 简化的策略执行仿真
      const strategyDef = JSON.parse(strategy.strategy_definition || '{}');
      const marketConditions = scenario.marketConditions;
      const resourceState = scenario.resourceState;
      
      // 模拟决策逻辑
      let shouldExecute = false;
      let expectedProfit = 0;
      
      switch (strategy.type) {
        case this.strategyTypes.ARBITRAGE:
          if (marketConditions.spread && marketConditions.spread > (strategyDef.min_profit_margin || 10)) {
            shouldExecute = true;
            expectedProfit = marketConditions.spread * (resourceState.capacity || 1000) / 1000;
          }
          break;
          
        case this.strategyTypes.PEAK_SHAVING:
          if (marketConditions.price > (strategyDef.sell_threshold || 70)) {
            shouldExecute = true;
            expectedProfit = (marketConditions.price - 50) * (resourceState.capacity || 1000) / 1000;
          }
          break;
          
        default:
          // 默认逻辑
          shouldExecute = Math.random() > 0.3;
          expectedProfit = Math.random() * 100 - 20;
      }
      
      return {
        success: shouldExecute && resourceState.availability > 0.5,
        profit: shouldExecute ? expectedProfit : 0,
        executionTime: Math.random() * 1000 + 500, // 0.5-1.5秒
        resourceUtilization: shouldExecute ? resourceState.availability : 0
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成历史数据
   * @param {number} days - 天数
   * @returns {Array} - 历史数据
   */
  generateHistoricalData(days) {
    const data = [];
    const basePrice = 50;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: basePrice + (Math.random() - 0.5) * 20,
        volume: Math.random() * 1000 + 500,
        volatility: Math.random() * 0.2 + 0.05
      });
    }
    
    return data;
  }

  /**
   * 获取策略列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} - 策略列表
   */
  async getStrategies(filters = {}) {
    try {
      const {
        type,
        status,
        targetMarket,
        isValidated,
        search,
        limit = 50,
        offset = 0
      } = filters;
      
      const db = await dbPromise;
      
      let query = db('vpp_trading_strategies as s')
        .leftJoin('vpp_strategy_templates as t', 's.template_id', 't.id')
        .select(
          's.*',
          't.name as template_name',
          't.category as template_category'
        );
      
      // 应用过滤条件
      if (type) {
        query = query.where('s.type', type);
      }
      
      if (status) {
        query = query.where('s.status', status);
      }
      
      if (targetMarket) {
        query = query.where('s.target_market', targetMarket);
      }
      
      if (isValidated !== undefined) {
        query = query.where('s.is_validated', isValidated);
      }
      
      if (search) {
        query = query.where(function() {
          this.where('s.name', 'like', `%${search}%`)
              .orWhere('s.description', 'like', `%${search}%`);
        });
      }
      
      // 排序和分页
      query = query.orderBy('s.created_at', 'desc')
                   .limit(limit)
                   .offset(offset);
      
      const strategies = await query;
      
      // 处理JSON字段
      return strategies.map(strategy => ({
        ...strategy,
        strategy_definition: strategy.strategy_definition ? JSON.parse(strategy.strategy_definition) : {},
        execution_parameters: strategy.execution_parameters ? JSON.parse(strategy.execution_parameters) : {},
        risk_parameters: strategy.risk_parameters ? JSON.parse(strategy.risk_parameters) : {},
        optimization_objectives: strategy.optimization_objectives ? 
          JSON.parse(strategy.optimization_objectives) : {},
        constraints: strategy.constraints ? JSON.parse(strategy.constraints) : {},
        market_parameters: strategy.market_parameters ? JSON.parse(strategy.market_parameters) : {},
        resource_allocation: strategy.resource_allocation ? JSON.parse(strategy.resource_allocation) : {},
        validation_results: strategy.validation_results ? JSON.parse(strategy.validation_results) : {},
        execution_statistics: strategy.execution_statistics ? JSON.parse(strategy.execution_statistics) : {},
        historical_performance: strategy.historical_performance ? 
          JSON.parse(strategy.historical_performance) : {}
      }));
      
    } catch (error) {
      logger.error('获取策略列表失败:', error);
      return [];
    }
  }

  /**
   * 获取策略详情
   * @param {number} strategyId - 策略ID
   * @returns {Promise<Object|null>} - 策略详情
   */
  async getStrategyById(strategyId) {
    try {
      const db = await dbPromise;
      
      // 获取策略基本信息
      const strategy = await db('vpp_trading_strategies as s')
        .leftJoin('vpp_strategy_templates as t', 's.template_id', 't.id')
        .where('s.id', strategyId)
        .select(
          's.*',
          't.name as template_name',
          't.category as template_category',
          't.version as template_version'
        )
        .first();
        
      if (!strategy) {
        return null;
      }
      
      // 获取策略组件
      const components = await db('vpp_strategy_components')
        .where({ strategy_id: strategyId })
        .orderBy('execution_order');
      
      // 获取验证记录
      const validations = await db('vpp_strategy_validations')
        .where({ strategy_id: strategyId })
        .orderBy('started_at', 'desc')
        .limit(10);
      
      // 获取执行记录
      const executions = await db('vpp_strategy_executions')
        .where({ strategy_id: strategyId })
        .orderBy('started_at', 'desc')
        .limit(20);
      
      // 处理JSON字段
      const processedComponents = components.map(component => ({
        ...component,
        component_config: component.component_config ? JSON.parse(component.component_config) : {},
        input_parameters: component.input_parameters ? JSON.parse(component.input_parameters) : {},
        output_parameters: component.output_parameters ? JSON.parse(component.output_parameters) : {},
        validation_rules: component.validation_rules ? JSON.parse(component.validation_rules) : {},
        execution_conditions: component.execution_conditions ? 
          JSON.parse(component.execution_conditions) : {},
        visual_config: component.visual_config ? JSON.parse(component.visual_config) : {},
        connections: component.connections ? JSON.parse(component.connections) : []
      }));
      
      const processedValidations = validations.map(validation => ({
        ...validation,
        validation_config: validation.validation_config ? JSON.parse(validation.validation_config) : {},
        test_scenarios: validation.test_scenarios ? JSON.parse(validation.test_scenarios) : [],
        validation_criteria: validation.validation_criteria ? JSON.parse(validation.validation_criteria) : {},
        validation_results: validation.validation_results ? JSON.parse(validation.validation_results) : {},
        error_details: validation.error_details ? JSON.parse(validation.error_details) : [],
        warning_details: validation.warning_details ? JSON.parse(validation.warning_details) : [],
        performance_metrics: validation.performance_metrics ? JSON.parse(validation.performance_metrics) : {}
      }));
      
      const processedExecutions = executions.map(execution => ({
        ...execution,
        execution_config: execution.execution_config ? JSON.parse(execution.execution_config) : {},
        market_conditions: execution.market_conditions ? JSON.parse(execution.market_conditions) : {},
        resource_state: execution.resource_state ? JSON.parse(execution.resource_state) : {},
        input_data: execution.input_data ? JSON.parse(execution.input_data) : {},
        execution_results: execution.execution_results ? JSON.parse(execution.execution_results) : {},
        trading_decisions: execution.trading_decisions ? JSON.parse(execution.trading_decisions) : {},
        resource_allocations: execution.resource_allocations ? JSON.parse(execution.resource_allocations) : {},
        component_performance: execution.component_performance ? 
          JSON.parse(execution.component_performance) : {},
        error_details: execution.error_details ? JSON.parse(execution.error_details) : {},
        debug_info: execution.debug_info ? JSON.parse(execution.debug_info) : {}
      }));
      
      return {
        ...strategy,
        strategy_definition: strategy.strategy_definition ? JSON.parse(strategy.strategy_definition) : {},
        execution_parameters: strategy.execution_parameters ? JSON.parse(strategy.execution_parameters) : {},
        risk_parameters: strategy.risk_parameters ? JSON.parse(strategy.risk_parameters) : {},
        optimization_objectives: strategy.optimization_objectives ? 
          JSON.parse(strategy.optimization_objectives) : {},
        constraints: strategy.constraints ? JSON.parse(strategy.constraints) : {},
        market_parameters: strategy.market_parameters ? JSON.parse(strategy.market_parameters) : {},
        resource_allocation: strategy.resource_allocation ? JSON.parse(strategy.resource_allocation) : {},
        validation_results: strategy.validation_results ? JSON.parse(strategy.validation_results) : {},
        execution_statistics: strategy.execution_statistics ? JSON.parse(strategy.execution_statistics) : {},
        historical_performance: strategy.historical_performance ? 
          JSON.parse(strategy.historical_performance) : {},
        components: processedComponents,
        validations: processedValidations,
        executions: processedExecutions
      };
      
    } catch (error) {
      logger.error('获取策略详情失败:', error);
      return null;
    }
  }

  /**
   * 激活策略
   * @param {number} strategyId - 策略ID
   * @returns {Promise<Object>} - 操作结果
   */
  async activateStrategy(strategyId) {
    try {
      const db = await dbPromise;
      
      // 检查策略是否存在且已验证
      const strategy = await db('vpp_trading_strategies')
        .where({ id: strategyId })
        .first();
        
      if (!strategy) {
        throw new Error('策略不存在');
      }
      
      if (!strategy.is_validated) {
        throw new Error('策略未通过验证，无法激活');
      }
      
      // 激活策略
      await db('vpp_trading_strategies')
        .where({ id: strategyId })
        .update({ 
          status: this.strategyStatus.ACTIVE,
          updated_at: db.fn.now()
        });
      
      // 添加到执行引擎
      this.executionEngine.activeStrategies.set(strategyId, {
        strategy,
        lastExecution: null,
        nextExecution: Date.now() + (strategy.execution_frequency * 1000)
      });
      
      logger.info(`策略${strategyId}已激活`);
      
      return {
        success: true,
        message: '策略已激活'
      };
      
    } catch (error) {
      logger.error('激活策略失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取服务状态
   * @returns {Promise<Object>} - 服务状态
   */
  async getServiceStatus() {
    try {
      const db = await dbPromise;
      
      // 统计策略数量
      const strategyStats = await db('vpp_trading_strategies')
        .select(
          db.raw('COUNT(*) as total_strategies'),
          db.raw('COUNT(CASE WHEN status = "active" THEN 1 END) as active_strategies'),
          db.raw('COUNT(CASE WHEN status = "draft" THEN 1 END) as draft_strategies'),
          db.raw('COUNT(CASE WHEN is_validated = true THEN 1 END) as validated_strategies'),
          db.raw('SUM(total_profit) as total_profit'),
          db.raw('SUM(execution_count) as total_executions')
        )
        .first();
      
      // 统计模板数量
      const templateStats = await db('vpp_strategy_templates')
        .select(
          db.raw('COUNT(*) as total_templates'),
          db.raw('COUNT(CASE WHEN is_default = true THEN 1 END) as default_templates'),
          db.raw('SUM(usage_count) as total_usage')
        )
        .first();
      
      // 统计验证记录
      const validationStats = await db('vpp_strategy_validations')
        .select(
          db.raw('COUNT(*) as total_validations'),
          db.raw('COUNT(CASE WHEN status = "passed" THEN 1 END) as passed_validations'),
          db.raw('AVG(overall_score) as average_score')
        )
        .first();
      
      return {
        service: 'VPPTradingStrategyService',
        status: 'running',
        execution_engine: {
          is_running: this.executionEngine.isRunning,
          active_strategies: this.executionEngine.activeStrategies.size,
          queue_size: this.executionEngine.executionQueue.length,
          max_concurrent: this.executionEngine.maxConcurrentExecutions
        },
        cache_status: {
          strategy_cache_size: this.strategyCache.size,
          template_cache_size: this.templateCache.size,
          validation_cache_size: this.validationCache.size,
          is_expired: this.isCacheExpired()
        },
        statistics: {
          strategies: {
            total: parseInt(strategyStats.total_strategies) || 0,
            active: parseInt(strategyStats.active_strategies) || 0,
            draft: parseInt(strategyStats.draft_strategies) || 0,
            validated: parseInt(strategyStats.validated_strategies) || 0,
            total_profit: parseFloat(strategyStats.total_profit) || 0,
            total_executions: parseInt(strategyStats.total_executions) || 0
          },
          templates: {
            total: parseInt(templateStats.total_templates) || 0,
            default: parseInt(templateStats.default_templates) || 0,
            total_usage: parseInt(templateStats.total_usage) || 0
          },
          validations: {
            total: parseInt(validationStats.total_validations) || 0,
            passed: parseInt(validationStats.passed_validations) || 0,
            pass_rate: validationStats.total_validations > 0 ? 
              (validationStats.passed_validations / validationStats.total_validations) * 100 : 0,
            average_score: parseFloat(validationStats.average_score) || 0
          }
        },
        supported_types: Object.keys(this.strategyTypes).length,
        supported_markets: Object.keys(this.marketTypes).length,
        last_check: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      return {
        service: 'VPPTradingStrategyService',
        status: 'error',
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  /**
   * 检查缓存是否过期
   */
  isCacheExpired() {
    return !this.lastCacheUpdate || 
           (Date.now() - this.lastCacheUpdate) > this.cacheTimeout;
  }
}

// 创建服务实例
const vppTradingStrategyService = new VPPTradingStrategyService();

export default vppTradingStrategyService;
export { STRATEGY_TYPES, STRATEGY_STATUS, COMPONENT_TYPES, MARKET_TYPES };