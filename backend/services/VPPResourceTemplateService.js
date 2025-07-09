/**
 * 虚拟电厂资源模板库服务
 * P0阶段：可调控资源模板库建设
 * 实现预置资源模板、自定义模板、模板版本管理等功能
 * 
 * @author VPP Development Team
 * @version 1.0.0
 * @since P0 Phase
 */

import logger from '../../src/shared/utils/logger.js';
import { dbPromise } from '../../src/infrastructure/database/index.js';
import { TIME_INTERVALS, MATH_CONSTANTS, ENERGY_CONSTANTS } from '../../src/shared/constants/MathConstants.js';

/**
 * 资源模板类型枚举
 */
const RESOURCE_TEMPLATE_TYPES = {
  // 发电资源
  SOLAR_PV: 'solar_pv',
  WIND_TURBINE: 'wind_turbine',
  MICRO_HYDRO: 'micro_hydro',
  BIOMASS_GENERATOR: 'biomass_generator',
  FUEL_CELL: 'fuel_cell',
  
  // 储能资源
  LITHIUM_BATTERY: 'lithium_battery',
  FLOW_BATTERY: 'flow_battery',
  COMPRESSED_AIR: 'compressed_air',
  PUMPED_HYDRO: 'pumped_hydro',
  FLYWHEEL: 'flywheel',
  
  // 可调负荷
  INDUSTRIAL_LOAD: 'industrial_load',
  COMMERCIAL_LOAD: 'commercial_load',
  RESIDENTIAL_LOAD: 'residential_load',
  DATA_CENTER: 'data_center',
  HVAC_SYSTEM: 'hvac_system',
  
  // 电动汽车
  EV_CHARGER: 'ev_charger',
  EV_FLEET: 'ev_fleet',
  
  // 热电联产
  CHP_UNIT: 'chp_unit',
  HEAT_PUMP: 'heat_pump',
  ELECTRIC_BOILER: 'electric_boiler'
};

/**
 * 模板状态枚举
 */
const TEMPLATE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
  ARCHIVED: 'archived'
};

/**
 * 控制策略类型
 */
const CONTROL_STRATEGIES = {
  DIRECT: 'direct',           // 直接控制
  PRICE_BASED: 'price_based', // 价格响应
  LOAD_FOLLOWING: 'load_following', // 负荷跟踪
  FREQUENCY_REGULATION: 'frequency_regulation', // 频率调节
  VOLTAGE_SUPPORT: 'voltage_support', // 电压支撑
  PEAK_SHAVING: 'peak_shaving', // 削峰填谷
  EMERGENCY_RESPONSE: 'emergency_response' // 应急响应
};

class VPPResourceTemplateService {
  constructor() {
    this.templateTypes = RESOURCE_TEMPLATE_TYPES;
    this.templateStatus = TEMPLATE_STATUS;
    this.controlStrategies = CONTROL_STRATEGIES;
    
    // 模板缓存
    this.templateCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = TIME_INTERVALS.TEN_MINUTES_MS;
    
    // 预置模板定义
    this.presetTemplates = this.initializePresetTemplates();
    
    this.initialize();
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      logger.info('初始化VPP资源模板库服务...');
      
      await this.createTables();
      await this.loadPresetTemplates();
      await this.refreshTemplateCache();
      
      logger.info('VPP资源模板库服务初始化完成');
    } catch (error) {
      logger.error('VPP资源模板库服务初始化失败:', error);
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    try {
      const db = await dbPromise;
      
      // 资源模板表
      const hasTemplateTable = await db.schema.hasTable('vpp_resource_templates');
      if (!hasTemplateTable) {
        await db.schema.createTable('vpp_resource_templates', (table) => {
          table.increments('id').primary();
          table.string('name', 255).notNullable();
          table.string('type', 100).notNullable();
          table.string('category', 100).notNullable();
          table.text('description');
          table.string('version', 50).defaultTo('1.0.0');
          table.boolean('is_preset').defaultTo(false);
          table.string('status', 50).defaultTo('active');
          
          // 技术规格
          table.decimal('rated_capacity', 12, 2).notNullable();
          table.string('capacity_unit', 20).defaultTo('kW');
          table.decimal('min_output', 12, 2).defaultTo(0);
          table.decimal('max_output', 12, 2);
          table.decimal('ramp_rate', 10, 2); // MW/min
          table.decimal('efficiency', 5, 2).defaultTo(95);
          table.integer('response_time').defaultTo(60); // 秒
          table.integer('min_on_time').defaultTo(0); // 分钟
          table.integer('min_off_time').defaultTo(0); // 分钟
          
          // 运行约束
          table.json('operational_constraints');
          table.json('control_parameters');
          table.json('communication_protocol');
          table.json('safety_limits');
          
          // 经济参数
          table.decimal('capital_cost', 12, 2);
          table.decimal('operational_cost', 10, 4); // ¥/kWh
          table.decimal('maintenance_cost', 10, 4); // ¥/kW/year
          table.integer('lifetime_years').defaultTo(20);
          
          // 环境参数
          table.json('environmental_conditions');
          table.decimal('carbon_intensity', 10, 4); // kgCO2/kWh
          
          // 元数据
          table.string('manufacturer', 255);
          table.string('model', 255);
          table.string('firmware_version', 100);
          table.json('certification_standards');
          table.json('tags');
          
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          table.string('created_by', 100);
          table.string('updated_by', 100);
          
          // 索引
          table.index(['type', 'status']);
          table.index(['category', 'is_preset']);
          table.index(['name']);
          table.index(['version']);
        });
        
        logger.info('创建vpp_resource_templates表成功');
      }
      
      // 模板版本历史表
      const hasVersionTable = await db.schema.hasTable('vpp_template_versions');
      if (!hasVersionTable) {
        await db.schema.createTable('vpp_template_versions', (table) => {
          table.increments('id').primary();
          table.integer('template_id').unsigned().references('id').inTable('vpp_resource_templates').onDelete('CASCADE');
          table.string('version', 50).notNullable();
          table.json('template_data');
          table.text('change_log');
          table.string('change_type', 50); // major, minor, patch
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.string('created_by', 100);
          
          table.index(['template_id', 'version']);
          table.index(['created_at']);
        });
        
        logger.info('创建vpp_template_versions表成功');
      }
      
    } catch (error) {
      logger.error('创建数据库表失败:', error);
      throw error;
    }
  }

  /**
   * 初始化预置模板定义
   */
  initializePresetTemplates() {
    return {
      // 光伏发电模板
      solar_pv_residential: {
        name: '住宅屋顶光伏',
        type: this.templateTypes.SOLAR_PV,
        category: 'generation',
        description: '住宅屋顶分布式光伏发电系统',
        rated_capacity: 10,
        capacity_unit: 'kW',
        min_output: 0,
        max_output: 10,
        ramp_rate: 5,
        efficiency: 18,
        response_time: 0,
        operational_constraints: {
          weather_dependent: true,
          daylight_only: true,
          temperature_coefficient: -0.4,
          irradiance_threshold: 100
        },
        control_parameters: {
          mppt_enabled: true,
          power_factor_range: [0.95, 1.0],
          voltage_regulation: true
        },
        environmental_conditions: {
          operating_temp_range: [-40, 85],
          humidity_max: 95,
          wind_resistance: 'IEC 61215'
        },
        carbon_intensity: 0
      },
      
      // 锂电池储能模板
      lithium_battery_commercial: {
        name: '商用锂电池储能',
        type: this.templateTypes.LITHIUM_BATTERY,
        category: 'storage',
        description: '商用级锂离子电池储能系统',
        rated_capacity: 100,
        capacity_unit: 'kWh',
        min_output: -50,
        max_output: 50,
        ramp_rate: 50,
        efficiency: 95,
        response_time: 1,
        min_on_time: 0,
        min_off_time: 0,
        operational_constraints: {
          soc_min: 10,
          soc_max: 90,
          charge_rate_max: 0.5,
          discharge_rate_max: 1.0,
          cycle_life: 6000,
          depth_of_discharge: 80
        },
        control_parameters: {
          bms_enabled: true,
          thermal_management: true,
          grid_forming: false,
          grid_following: true
        },
        safety_limits: {
          voltage_max: 1000,
          current_max: 200,
          temperature_max: 60,
          emergency_shutdown: true
        }
      },
      
      // 工业可调负荷模板
      industrial_load_steel: {
        name: '钢铁工业可调负荷',
        type: this.templateTypes.INDUSTRIAL_LOAD,
        category: 'load',
        description: '钢铁行业电弧炉等可调节负荷',
        rated_capacity: 50000,
        capacity_unit: 'kW',
        min_output: 20000,
        max_output: 50000,
        ramp_rate: 1000,
        efficiency: 85,
        response_time: 300,
        min_on_time: 60,
        min_off_time: 30,
        operational_constraints: {
          production_schedule: true,
          quality_requirements: true,
          energy_intensity: 600, // kWh/ton
          load_factor_min: 0.4
        },
        control_parameters: {
          demand_response_enabled: true,
          load_shedding_priority: 3,
          curtailment_max: 0.3,
          recovery_time: 120
        }
      },
      
      // 电动汽车充电桩模板
      ev_charger_fast: {
        name: '快速充电桩',
        type: this.templateTypes.EV_CHARGER,
        category: 'load',
        description: '直流快速充电桩',
        rated_capacity: 120,
        capacity_unit: 'kW',
        min_output: 0,
        max_output: 120,
        ramp_rate: 120,
        efficiency: 95,
        response_time: 5,
        operational_constraints: {
          charging_curve: 'CC-CV',
          connector_type: 'CCS2',
          vehicle_compatibility: ['BEV', 'PHEV'],
          session_duration_avg: 30
        },
        control_parameters: {
          smart_charging: true,
          v2g_capable: false,
          load_balancing: true,
          price_responsive: true
        }
      }
    };
  }

  /**
   * 加载预置模板到数据库
   */
  async loadPresetTemplates() {
    try {
      const db = await dbPromise;
      
      for (const [key, template] of Object.entries(this.presetTemplates)) {
        // 检查模板是否已存在
        const existing = await db('vpp_resource_templates')
          .where({ name: template.name, is_preset: true })
          .first();
          
        if (!existing) {
          await db('vpp_resource_templates').insert({
            ...template,
            is_preset: true,
            status: this.templateStatus.ACTIVE,
            operational_constraints: JSON.stringify(template.operational_constraints || {}),
            control_parameters: JSON.stringify(template.control_parameters || {}),
            safety_limits: JSON.stringify(template.safety_limits || {}),
            environmental_conditions: JSON.stringify(template.environmental_conditions || {}),
            created_by: 'system'
          });
          
          logger.info(`加载预置模板: ${template.name}`);
        }
      }
      
    } catch (error) {
      logger.error('加载预置模板失败:', error);
    }
  }

  /**
   * 创建自定义资源模板
   * @param {Object} templateData - 模板数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createTemplate(templateData) {
    try {
      const {
        name,
        type,
        category,
        description,
        ratedCapacity,
        capacityUnit = 'kW',
        technicalSpecs = {},
        operationalConstraints = {},
        controlParameters = {},
        safetyLimits = {},
        economicParameters = {},
        environmentalConditions = {},
        metadata = {},
        createdBy
      } = templateData;
      
      // 验证必要字段
      if (!name || !type || !category || !ratedCapacity) {
        throw new Error('缺少必要字段: name, type, category, ratedCapacity');
      }
      
      // 验证资源类型
      if (!Object.values(this.templateTypes).includes(type)) {
        throw new Error(`不支持的资源类型: ${type}`);
      }
      
      const db = await dbPromise;
      
      // 检查模板名称是否已存在
      const existing = await db('vpp_resource_templates')
        .where({ name })
        .first();
        
      if (existing) {
        throw new Error(`模板名称已存在: ${name}`);
      }
      
      // 插入模板记录
      const [templateId] = await db('vpp_resource_templates')
        .insert({
          name,
          type,
          category,
          description,
          version: '1.0.0',
          is_preset: false,
          status: this.templateStatus.DRAFT,
          rated_capacity: ratedCapacity,
          capacity_unit: capacityUnit,
          min_output: technicalSpecs.minOutput || 0,
          max_output: technicalSpecs.maxOutput || ratedCapacity,
          ramp_rate: technicalSpecs.rampRate,
          efficiency: technicalSpecs.efficiency || 95,
          response_time: technicalSpecs.responseTime || 60,
          min_on_time: technicalSpecs.minOnTime || 0,
          min_off_time: technicalSpecs.minOffTime || 0,
          operational_constraints: JSON.stringify(operationalConstraints),
          control_parameters: JSON.stringify(controlParameters),
          safety_limits: JSON.stringify(safetyLimits),
          environmental_conditions: JSON.stringify(environmentalConditions),
          capital_cost: economicParameters.capitalCost,
          operational_cost: economicParameters.operationalCost,
          maintenance_cost: economicParameters.maintenanceCost,
          lifetime_years: economicParameters.lifetimeYears || 20,
          carbon_intensity: environmentalConditions.carbonIntensity || 0,
          manufacturer: metadata.manufacturer,
          model: metadata.model,
          firmware_version: metadata.firmwareVersion,
          certification_standards: JSON.stringify(metadata.certificationStandards || []),
          tags: JSON.stringify(metadata.tags || []),
          created_by: createdBy || 'user'
        })
        .returning('id');
      
      // 创建版本记录
      await this.createVersionRecord(templateId, '1.0.0', templateData, 'initial', createdBy);
      
      // 清除缓存
      this.clearTemplateCache();
      
      logger.info(`成功创建资源模板: ${name} (ID: ${templateId})`);
      
      return {
        success: true,
        templateId,
        message: '模板创建成功'
      };
      
    } catch (error) {
      logger.error('创建资源模板失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取资源模板列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} - 模板列表
   */
  async getTemplates(filters = {}) {
    try {
      const {
        type,
        category,
        status,
        isPreset,
        search,
        limit = 50,
        offset = 0
      } = filters;
      
      const db = await dbPromise;
      
      let query = db('vpp_resource_templates')
        .select('*');
      
      // 应用过滤条件
      if (type) {
        query = query.where('type', type);
      }
      
      if (category) {
        query = query.where('category', category);
      }
      
      if (status) {
        query = query.where('status', status);
      }
      
      if (isPreset !== undefined) {
        query = query.where('is_preset', isPreset);
      }
      
      if (search) {
        query = query.where(function() {
          this.where('name', 'like', `%${search}%`)
              .orWhere('description', 'like', `%${search}%`)
              .orWhere('manufacturer', 'like', `%${search}%`);
        });
      }
      
      // 排序和分页
      query = query.orderBy('created_at', 'desc')
                   .limit(limit)
                   .offset(offset);
      
      const templates = await query;
      
      // 处理JSON字段
      const processedTemplates = templates.map(template => ({
        ...template,
        operational_constraints: template.operational_constraints ? 
          JSON.parse(template.operational_constraints) : {},
        control_parameters: template.control_parameters ? 
          JSON.parse(template.control_parameters) : {},
        safety_limits: template.safety_limits ? 
          JSON.parse(template.safety_limits) : {},
        environmental_conditions: template.environmental_conditions ? 
          JSON.parse(template.environmental_conditions) : {},
        certification_standards: template.certification_standards ? 
          JSON.parse(template.certification_standards) : [],
        tags: template.tags ? JSON.parse(template.tags) : []
      }));
      
      return processedTemplates;
      
    } catch (error) {
      logger.error('获取资源模板列表失败:', error);
      return [];
    }
  }

  /**
   * 获取模板详情
   * @param {number} templateId - 模板ID
   * @returns {Promise<Object|null>} - 模板详情
   */
  async getTemplateById(templateId) {
    try {
      const db = await dbPromise;
      
      const template = await db('vpp_resource_templates')
        .where({ id: templateId })
        .first();
        
      if (!template) {
        return null;
      }
      
      // 处理JSON字段
      return {
        ...template,
        operational_constraints: template.operational_constraints ? 
          JSON.parse(template.operational_constraints) : {},
        control_parameters: template.control_parameters ? 
          JSON.parse(template.control_parameters) : {},
        safety_limits: template.safety_limits ? 
          JSON.parse(template.safety_limits) : {},
        environmental_conditions: template.environmental_conditions ? 
          JSON.parse(template.environmental_conditions) : {},
        certification_standards: template.certification_standards ? 
          JSON.parse(template.certification_standards) : [],
        tags: template.tags ? JSON.parse(template.tags) : []
      };
      
    } catch (error) {
      logger.error('获取模板详情失败:', error);
      return null;
    }
  }

  /**
   * 更新资源模板
   * @param {number} templateId - 模板ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateTemplate(templateId, updateData) {
    try {
      const { updatedBy, changeLog, ...templateData } = updateData;
      
      const db = await dbPromise;
      
      // 检查模板是否存在
      const existing = await db('vpp_resource_templates')
        .where({ id: templateId })
        .first();
        
      if (!existing) {
        throw new Error('模板不存在');
      }
      
      // 检查是否为预置模板
      if (existing.is_preset) {
        throw new Error('预置模板不允许修改');
      }
      
      // 生成新版本号
      const newVersion = this.incrementVersion(existing.version, 'minor');
      
      // 更新模板
      await db('vpp_resource_templates')
        .where({ id: templateId })
        .update({
          ...templateData,
          version: newVersion,
          updated_at: db.fn.now(),
          updated_by: updatedBy || 'user'
        });
      
      // 创建版本记录
      await this.createVersionRecord(templateId, newVersion, updateData, 'minor', updatedBy);
      
      // 清除缓存
      this.clearTemplateCache();
      
      logger.info(`成功更新资源模板: ${templateId} -> ${newVersion}`);
      
      return {
        success: true,
        version: newVersion,
        message: '模板更新成功'
      };
      
    } catch (error) {
      logger.error('更新资源模板失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 创建版本记录
   */
  async createVersionRecord(templateId, version, templateData, changeType, createdBy) {
    try {
      const db = await dbPromise;
      
      await db('vpp_template_versions').insert({
        template_id: templateId,
        version,
        template_data: JSON.stringify(templateData),
        change_log: templateData.changeLog || `${changeType} version update`,
        change_type: changeType,
        created_by: createdBy || 'system'
      });
      
    } catch (error) {
      logger.error('创建版本记录失败:', error);
    }
  }

  /**
   * 版本号递增
   */
  incrementVersion(currentVersion, type = 'patch') {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * 获取模板版本历史
   * @param {number} templateId - 模板ID
   * @returns {Promise<Array>} - 版本历史
   */
  async getTemplateVersions(templateId) {
    try {
      const db = await dbPromise;
      
      const versions = await db('vpp_template_versions')
        .where({ template_id: templateId })
        .orderBy('created_at', 'desc');
      
      return versions.map(version => ({
        ...version,
        template_data: version.template_data ? JSON.parse(version.template_data) : {}
      }));
      
    } catch (error) {
      logger.error('获取模板版本历史失败:', error);
      return [];
    }
  }

  /**
   * 激活模板
   * @param {number} templateId - 模板ID
   * @returns {Promise<Object>} - 操作结果
   */
  async activateTemplate(templateId) {
    try {
      const db = await dbPromise;
      
      await db('vpp_resource_templates')
        .where({ id: templateId })
        .update({ 
          status: this.templateStatus.ACTIVE,
          updated_at: db.fn.now()
        });
      
      this.clearTemplateCache();
      
      return {
        success: true,
        message: '模板已激活'
      };
      
    } catch (error) {
      logger.error('激活模板失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 刷新模板缓存
   */
  async refreshTemplateCache() {
    try {
      const templates = await this.getTemplates({ status: this.templateStatus.ACTIVE });
      
      this.templateCache.clear();
      templates.forEach(template => {
        this.templateCache.set(template.id, template);
      });
      
      this.lastCacheUpdate = Date.now();
      
    } catch (error) {
      logger.error('刷新模板缓存失败:', error);
    }
  }

  /**
   * 清除模板缓存
   */
  clearTemplateCache() {
    this.templateCache.clear();
    this.lastCacheUpdate = null;
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
   * @returns {Promise<Object>} - 服务状态
   */
  async getServiceStatus() {
    try {
      const db = await dbPromise;
      
      // 统计模板数量
      const stats = await db('vpp_resource_templates')
        .select(
          db.raw('COUNT(*) as total_templates'),
          db.raw('COUNT(CASE WHEN is_preset = true THEN 1 END) as preset_templates'),
          db.raw('COUNT(CASE WHEN status = "active" THEN 1 END) as active_templates'),
          db.raw('COUNT(CASE WHEN status = "draft" THEN 1 END) as draft_templates')
        )
        .first();
      
      return {
        service: 'VPPResourceTemplateService',
        status: 'running',
        cache_status: {
          size: this.templateCache.size,
          last_update: this.lastCacheUpdate,
          is_expired: this.isCacheExpired()
        },
        statistics: {
          total_templates: parseInt(stats.total_templates) || 0,
          preset_templates: parseInt(stats.preset_templates) || 0,
          active_templates: parseInt(stats.active_templates) || 0,
          draft_templates: parseInt(stats.draft_templates) || 0
        },
        supported_types: Object.keys(this.templateTypes).length,
        last_check: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      return {
        service: 'VPPResourceTemplateService',
        status: 'error',
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  /**
   * 删除模板
   * @param {number} templateId - 模板ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteTemplate(templateId) {
    try {
      const db = await dbPromise;
      
      // 检查是否为预置模板
      const template = await db('vpp_resource_templates')
        .where({ id: templateId })
        .first();
        
      if (!template) {
        throw new Error('模板不存在');
      }
      
      if (template.is_preset) {
        throw new Error('预置模板不允许删除');
      }
      
      // 检查是否有资源实例使用此模板
      const usageCount = await db('vpp_resources')
        .where({ template_id: templateId })
        .count('id as count')
        .first();
        
      if (usageCount.count > 0) {
        throw new Error('模板正在被使用，无法删除');
      }
      
      // 删除模板和版本记录
      await db.transaction(async (trx) => {
        await trx('vpp_template_versions').where({ template_id: templateId }).del();
        await trx('vpp_resource_templates').where({ id: templateId }).del();
      });
      
      this.clearTemplateCache();
      
      logger.info(`成功删除资源模板: ${templateId}`);
      
      return {
        success: true,
        message: '模板删除成功'
      };
      
    } catch (error) {
      logger.error('删除资源模板失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 创建服务实例
const vppResourceTemplateService = new VPPResourceTemplateService();

export default vppResourceTemplateService;
export { RESOURCE_TEMPLATE_TYPES, TEMPLATE_STATUS, CONTROL_STRATEGIES };