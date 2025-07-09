import logger from '../../src/shared/utils/logger.js';
import { dbPromise } from '../../src/infrastructure/database/index.js';
import { TIME_INTERVALS, MATH_CONSTANTS, ENERGY_CONSTANTS } from '../../src/shared/constants/MathConstants.js';

/**
 * 虚拟电厂资源管理服务
 * 负责分布式能源资源的统一管理、聚合和监控
 * P0阶段核心功能：资源注册、状态监控、基础聚合
 */
class VPPResourceService {
  constructor() {
    this.resourceTypes = {
      SOLAR: 'solar',
      WIND: 'wind', 
      BATTERY: 'battery',
      LOAD: 'load',
      GENERATOR: 'generator'
    };
    
    this.resourceStatus = {
      ONLINE: 'online',
      OFFLINE: 'offline',
      MAINTENANCE: 'maintenance',
      ERROR: 'error'
    };
    
    // 资源缓存，提高查询性能
    this.resourceCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = TIME_INTERVALS.FIVE_MINUTES_MS;
    
    // 初始化服务
    this.initialize();
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      logger.info('初始化虚拟电厂资源管理服务...');
      
      // 创建必要的数据库表（如果不存在）
      await this.createTables();
      
      // 加载资源缓存
      await this.refreshResourceCache();
      
      logger.info('虚拟电厂资源管理服务初始化完成');
    } catch (error) {
      logger.error('虚拟电厂资源管理服务初始化失败:', error);
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    try {
      const db = await dbPromise;
      
      // 检查表是否存在
      const hasResourceTable = await db.schema.hasTable('vpp_resources');
      const hasInstanceTable = await db.schema.hasTable('vpp_resource_instances');
      const hasVppTable = await db.schema.hasTable('vpp_definitions');
      
      // 创建资源模板表
      if (!hasResourceTable) {
        await db.schema.createTable('vpp_resources', (table) => {
          table.increments('id').primary();
          table.string('name', 100).notNullable();
          table.string('type', 50).notNullable();
          table.text('description');
          table.decimal('rated_capacity', 10, 2).notNullable();
          table.string('unit', 20).defaultTo('kW');
          table.json('technical_specs');
          table.json('operational_constraints');
          table.string('location', 200);
          table.decimal('latitude', 10, 8);
          table.decimal('longitude', 11, 8);
          table.string('status', 20).defaultTo('offline');
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          
          table.index(['type', 'status']);
          table.index(['location']);
        });
        logger.info('创建vpp_resources表成功');
      }
      
      // 创建资源实例表
      if (!hasInstanceTable) {
        await db.schema.createTable('vpp_resource_instances', (table) => {
          table.increments('id').primary();
          table.integer('resource_id').unsigned().references('id').inTable('vpp_resources').onDelete('CASCADE');
          table.decimal('current_output', 10, 2).defaultTo(0);
          table.decimal('available_capacity', 10, 2).defaultTo(0);
          table.decimal('efficiency', 5, 2).defaultTo(100);
          table.json('real_time_data');
          table.string('operational_status', 20).defaultTo('standby');
          table.timestamp('last_update').defaultTo(db.fn.now());
          table.timestamp('created_at').defaultTo(db.fn.now());
          
          table.index(['resource_id', 'operational_status']);
          table.index(['last_update']);
        });
        logger.info('创建vpp_resource_instances表成功');
      }
      
      // 创建VPP定义表
      if (!hasVppTable) {
        await db.schema.createTable('vpp_definitions', (table) => {
          table.increments('id').primary();
          table.string('name', 100).notNullable();
          table.text('description');
          table.decimal('total_capacity', 12, 2).defaultTo(0);
          table.json('resource_mix');
          table.json('operational_strategy');
          table.string('status', 20).defaultTo('inactive');
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          
          table.index(['status']);
        });
        logger.info('创建vpp_definitions表成功');
      }
      
    } catch (error) {
      logger.error('创建数据库表失败:', error);
      throw error;
    }
  }

  /**
   * 注册新的分布式能源资源
   * @param {Object} resourceData - 资源数据
   * @returns {Promise<Object>} - 注册结果
   */
  async registerResource(resourceData) {
    try {
      const {
        name,
        type,
        description,
        ratedCapacity,
        unit = 'kW',
        technicalSpecs = {},
        operationalConstraints = {},
        location,
        latitude,
        longitude
      } = resourceData;
      
      // 验证必要字段
      if (!name || !type || !ratedCapacity) {
        throw new Error('缺少必要字段: name, type, ratedCapacity');
      }
      
      // 验证资源类型
      if (!Object.values(this.resourceTypes).includes(type)) {
        throw new Error(`不支持的资源类型: ${type}`);
      }
      
      const db = await dbPromise;
      
      // 检查资源名称是否已存在
      const existingResource = await db('vpp_resources')
        .where({ name })
        .first();
        
      if (existingResource) {
        throw new Error(`资源名称已存在: ${name}`);
      }
      
      // 插入资源记录
      const [resourceId] = await db('vpp_resources')
        .insert({
          name,
          type,
          description,
          rated_capacity: ratedCapacity,
          unit,
          technical_specs: JSON.stringify(technicalSpecs),
          operational_constraints: JSON.stringify(operationalConstraints),
          location,
          latitude,
          longitude,
          status: this.resourceStatus.OFFLINE
        })
        .returning('id');
      
      // 创建对应的资源实例
      await db('vpp_resource_instances')
        .insert({
          resource_id: resourceId,
          available_capacity: ratedCapacity,
          real_time_data: JSON.stringify({
            temperature: null,
            weather: null,
            grid_frequency: 50.0,
            voltage: null
          })
        });
      
      // 清除缓存
      this.clearResourceCache();
      
      logger.info(`成功注册资源: ${name} (ID: ${resourceId})`);
      
      return {
        success: true,
        resourceId,
        message: '资源注册成功'
      };
      
    } catch (error) {
      logger.error('注册资源失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新资源状态
   * @param {number} resourceId - 资源ID
   * @param {Object} statusData - 状态数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateResourceStatus(resourceId, statusData) {
    try {
      const {
        status,
        currentOutput,
        availableCapacity,
        efficiency,
        realTimeData = {}
      } = statusData;
      
      const db = await dbPromise;
      
      // 验证资源是否存在
      const resource = await db('vpp_resources')
        .where({ id: resourceId })
        .first();
        
      if (!resource) {
        throw new Error(`资源不存在: ${resourceId}`);
      }
      
      // 更新资源状态
      if (status && Object.values(this.resourceStatus).includes(status)) {
        await db('vpp_resources')
          .where({ id: resourceId })
          .update({
            status,
            updated_at: db.fn.now()
          });
      }
      
      // 更新资源实例数据
      const updateData = {
        last_update: db.fn.now()
      };
      
      if (currentOutput !== undefined) {
        updateData.current_output = currentOutput;
      }
      
      if (availableCapacity !== undefined) {
        updateData.available_capacity = availableCapacity;
      }
      
      if (efficiency !== undefined) {
        updateData.efficiency = efficiency;
      }
      
      if (Object.keys(realTimeData).length > 0) {
        // 获取现有实时数据并合并
        const instance = await db('vpp_resource_instances')
          .where({ resource_id: resourceId })
          .first();
          
        const existingData = instance?.real_time_data ? 
          JSON.parse(instance.real_time_data) : {};
          
        updateData.real_time_data = JSON.stringify({
          ...existingData,
          ...realTimeData,
          timestamp: new Date().toISOString()
        });
      }
      
      await db('vpp_resource_instances')
        .where({ resource_id: resourceId })
        .update(updateData);
      
      // 清除缓存
      this.clearResourceCache();
      
      logger.info(`成功更新资源状态: ${resourceId}`);
      
      return {
        success: true,
        message: '资源状态更新成功'
      };
      
    } catch (error) {
      logger.error('更新资源状态失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取资源列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} - 资源列表
   */
  async getResources(filters = {}) {
    try {
      const {
        type,
        status,
        location,
        limit = 100,
        offset = 0
      } = filters;
      
      const db = await dbPromise;
      
      let query = db('vpp_resources as r')
        .leftJoin('vpp_resource_instances as i', 'r.id', 'i.resource_id')
        .select(
          'r.*',
          'i.current_output',
          'i.available_capacity',
          'i.efficiency',
          'i.operational_status',
          'i.real_time_data',
          'i.last_update'
        );
      
      // 应用过滤条件
      if (type) {
        query = query.where('r.type', type);
      }
      
      if (status) {
        query = query.where('r.status', status);
      }
      
      if (location) {
        query = query.where('r.location', 'like', `%${location}%`);
      }
      
      // 分页
      query = query.limit(limit).offset(offset);
      
      const resources = await query;
      
      // 处理JSON字段
      const processedResources = resources.map(resource => ({
        ...resource,
        technical_specs: resource.technical_specs ? 
          JSON.parse(resource.technical_specs) : {},
        operational_constraints: resource.operational_constraints ? 
          JSON.parse(resource.operational_constraints) : {},
        real_time_data: resource.real_time_data ? 
          JSON.parse(resource.real_time_data) : {}
      }));
      
      return processedResources;
      
    } catch (error) {
      logger.error('获取资源列表失败:', error);
      return [];
    }
  }

  /**
   * 获取资源详情
   * @param {number} resourceId - 资源ID
   * @returns {Promise<Object|null>} - 资源详情
   */
  async getResourceById(resourceId) {
    try {
      const db = await dbPromise;
      
      const resource = await db('vpp_resources as r')
        .leftJoin('vpp_resource_instances as i', 'r.id', 'i.resource_id')
        .select(
          'r.*',
          'i.current_output',
          'i.available_capacity', 
          'i.efficiency',
          'i.operational_status',
          'i.real_time_data',
          'i.last_update'
        )
        .where('r.id', resourceId)
        .first();
      
      if (!resource) {
        return null;
      }
      
      // 处理JSON字段
      return {
        ...resource,
        technical_specs: resource.technical_specs ? 
          JSON.parse(resource.technical_specs) : {},
        operational_constraints: resource.operational_constraints ? 
          JSON.parse(resource.operational_constraints) : {},
        real_time_data: resource.real_time_data ? 
          JSON.parse(resource.real_time_data) : {}
      };
      
    } catch (error) {
      logger.error('获取资源详情失败:', error);
      return null;
    }
  }

  /**
   * 计算资源聚合容量
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} - 聚合容量信息
   */
  async getAggregatedCapacity(filters = {}) {
    try {
      const resources = await this.getResources(filters);
      
      const aggregation = {
        totalRatedCapacity: 0,
        totalAvailableCapacity: 0,
        totalCurrentOutput: 0,
        resourceCount: resources.length,
        byType: {},
        byStatus: {},
        averageEfficiency: 0
      };
      
      let totalEfficiency = 0;
      let efficiencyCount = 0;
      
      resources.forEach(resource => {
        const ratedCapacity = parseFloat(resource.rated_capacity) || 0;
        const availableCapacity = parseFloat(resource.available_capacity) || 0;
        const currentOutput = parseFloat(resource.current_output) || 0;
        const efficiency = parseFloat(resource.efficiency) || 0;
        
        // 总计
        aggregation.totalRatedCapacity += ratedCapacity;
        aggregation.totalAvailableCapacity += availableCapacity;
        aggregation.totalCurrentOutput += currentOutput;
        
        // 按类型统计
        if (!aggregation.byType[resource.type]) {
          aggregation.byType[resource.type] = {
            count: 0,
            ratedCapacity: 0,
            availableCapacity: 0,
            currentOutput: 0
          };
        }
        
        aggregation.byType[resource.type].count++;
        aggregation.byType[resource.type].ratedCapacity += ratedCapacity;
        aggregation.byType[resource.type].availableCapacity += availableCapacity;
        aggregation.byType[resource.type].currentOutput += currentOutput;
        
        // 按状态统计
        if (!aggregation.byStatus[resource.status]) {
          aggregation.byStatus[resource.status] = {
            count: 0,
            ratedCapacity: 0
          };
        }
        
        aggregation.byStatus[resource.status].count++;
        aggregation.byStatus[resource.status].ratedCapacity += ratedCapacity;
        
        // 效率统计
        if (efficiency > 0) {
          totalEfficiency += efficiency;
          efficiencyCount++;
        }
      });
      
      // 计算平均效率
      aggregation.averageEfficiency = efficiencyCount > 0 ? 
        totalEfficiency / efficiencyCount : 0;
      
      // 计算容量利用率
      aggregation.capacityUtilization = aggregation.totalRatedCapacity > 0 ? 
        (aggregation.totalCurrentOutput / aggregation.totalRatedCapacity) * 100 : 0;
      
      return aggregation;
      
    } catch (error) {
      logger.error('计算聚合容量失败:', error);
      return {
        totalRatedCapacity: 0,
        totalAvailableCapacity: 0,
        totalCurrentOutput: 0,
        resourceCount: 0,
        byType: {},
        byStatus: {},
        averageEfficiency: 0,
        capacityUtilization: 0
      };
    }
  }

  /**
   * 刷新资源缓存
   */
  async refreshResourceCache() {
    try {
      const resources = await this.getResources({ limit: 1000 });
      
      this.resourceCache.clear();
      resources.forEach(resource => {
        this.resourceCache.set(resource.id, resource);
      });
      
      this.lastCacheUpdate = Date.now();
      logger.info(`资源缓存已刷新，共缓存 ${resources.length} 个资源`);
      
    } catch (error) {
      logger.error('刷新资源缓存失败:', error);
    }
  }

  /**
   * 清除资源缓存
   */
  clearResourceCache() {
    this.resourceCache.clear();
    this.lastCacheUpdate = null;
  }

  /**
   * 检查缓存是否过期
   */
  isCacheExpired() {
    if (!this.lastCacheUpdate) {
      return true;
    }
    
    return (Date.now() - this.lastCacheUpdate) > this.cacheTimeout;
  }

  /**
   * 获取服务状态
   * @returns {Object} - 服务状态信息
   */
  async getServiceStatus() {
    try {
      const aggregation = await this.getAggregatedCapacity();
      
      return {
        service: 'VPPResourceService',
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        cache: {
          size: this.resourceCache.size,
          lastUpdate: this.lastCacheUpdate,
          isExpired: this.isCacheExpired()
        },
        resources: {
          total: aggregation.resourceCount,
          online: aggregation.byStatus.online?.count || 0,
          offline: aggregation.byStatus.offline?.count || 0,
          totalCapacity: aggregation.totalRatedCapacity,
          currentOutput: aggregation.totalCurrentOutput,
          utilization: aggregation.capacityUtilization
        }
      };
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      return {
        service: 'VPPResourceService',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 删除资源
   * @param {number} resourceId - 资源ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteResource(resourceId) {
    try {
      const db = await dbPromise;
      
      // 检查资源是否存在
      const resource = await db('vpp_resources')
        .where({ id: resourceId })
        .first();
        
      if (!resource) {
        throw new Error(`资源不存在: ${resourceId}`);
      }
      
      // 删除资源（级联删除实例）
      await db('vpp_resources')
        .where({ id: resourceId })
        .del();
      
      // 清除缓存
      this.clearResourceCache();
      
      logger.info(`成功删除资源: ${resourceId}`);
      
      return {
        success: true,
        message: '资源删除成功'
      };
      
    } catch (error) {
      logger.error('删除资源失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 创建服务实例
const vppResourceService = new VPPResourceService();

export default vppResourceService;