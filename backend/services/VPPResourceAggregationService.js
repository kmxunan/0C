/**
 * 虚拟电厂资源聚合管理服务
 * P0阶段：实现拖拽式VPP资源聚合、实时聚合计算引擎
 * 支持资源复用机制、冲突检测、3D地图可视化挂接
 * 
 * @author VPP Development Team
 * @version 1.0.0
 * @since P0 Phase
 */

import logger from '../../src/shared/utils/logger.js';
import { dbPromise } from '../../src/infrastructure/database/index.js';
import { TIME_INTERVALS, MATH_CONSTANTS, ENERGY_CONSTANTS } from '../../src/shared/constants/MathConstants.js';
import vppResourceService from './VPPResourceService.js';
import vppResourceTemplateService from './VPPResourceTemplateService.js';

/**
 * 聚合策略类型
 */
const AGGREGATION_STRATEGIES = {
  SIMPLE_SUM: 'simple_sum',           // 简单求和
  WEIGHTED_SUM: 'weighted_sum',       // 加权求和
  PRIORITY_BASED: 'priority_based',   // 基于优先级
  CONSTRAINT_AWARE: 'constraint_aware', // 约束感知
  OPTIMAL_DISPATCH: 'optimal_dispatch'  // 最优调度
};

/**
 * 聚合状态枚举
 */
const AGGREGATION_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  MAINTENANCE: 'maintenance',
  ERROR: 'error'
};

/**
 * 冲突类型枚举
 */
const CONFLICT_TYPES = {
  CAPACITY_OVERLAP: 'capacity_overlap',     // 容量重叠
  TIME_CONFLICT: 'time_conflict',           // 时间冲突
  RESOURCE_UNAVAILABLE: 'resource_unavailable', // 资源不可用
  CONSTRAINT_VIOLATION: 'constraint_violation', // 约束违反
  PRIORITY_CONFLICT: 'priority_conflict'    // 优先级冲突
};

class VPPResourceAggregationService {
  constructor() {
    this.aggregationStrategies = AGGREGATION_STRATEGIES;
    this.aggregationStatus = AGGREGATION_STATUS;
    this.conflictTypes = CONFLICT_TYPES;
    
    // 聚合缓存
    this.aggregationCache = new Map();
    this.realTimeData = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = TIME_INTERVALS.ONE_MINUTE_MS;
    
    // 实时计算引擎
    this.calculationEngine = {
      isRunning: false,
      updateInterval: 5000, // 5秒更新一次
      intervalId: null
    };
    
    this.initialize();
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      logger.info('初始化VPP资源聚合管理服务...');
      
      await this.createTables();
      await this.startRealTimeEngine();
      
      logger.info('VPP资源聚合管理服务初始化完成');
    } catch (error) {
      logger.error('VPP资源聚合管理服务初始化失败:', error);
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    try {
      const db = await dbPromise;
      
      // VPP聚合配置表
      const hasAggregationTable = await db.schema.hasTable('vpp_aggregations');
      if (!hasAggregationTable) {
        await db.schema.createTable('vpp_aggregations', (table) => {
          table.increments('id').primary();
          table.string('name', 255).notNullable();
          table.text('description');
          table.string('strategy', 100).defaultTo('simple_sum');
          table.string('status', 50).defaultTo('draft');
          
          // 聚合参数
          table.decimal('target_capacity', 12, 2);
          table.string('capacity_unit', 20).defaultTo('kW');
          table.json('aggregation_rules');
          table.json('optimization_objectives');
          table.json('operational_constraints');
          
          // 地理信息
          table.decimal('center_latitude', 10, 8);
          table.decimal('center_longitude', 11, 8);
          table.decimal('coverage_radius', 10, 2); // km
          table.json('geographic_bounds');
          
          // 实时状态
          table.decimal('current_capacity', 12, 2).defaultTo(0);
          table.decimal('available_capacity', 12, 2).defaultTo(0);
          table.decimal('utilization_rate', 5, 2).defaultTo(0);
          table.integer('resource_count').defaultTo(0);
          table.integer('active_resource_count').defaultTo(0);
          
          // 性能指标
          table.decimal('efficiency', 5, 2).defaultTo(95);
          table.decimal('response_time', 10, 2); // 秒
          table.decimal('reliability_score', 5, 2).defaultTo(95);
          
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          table.string('created_by', 100);
          table.string('updated_by', 100);
          
          table.index(['status']);
          table.index(['strategy']);
          table.index(['name']);
        });
        
        logger.info('创建vpp_aggregations表成功');
      }
      
      // 聚合资源关联表
      const hasAggregationResourceTable = await db.schema.hasTable('vpp_aggregation_resources');
      if (!hasAggregationResourceTable) {
        await db.schema.createTable('vpp_aggregation_resources', (table) => {
          table.increments('id').primary();
          table.integer('aggregation_id').unsigned().references('id').inTable('vpp_aggregations').onDelete('CASCADE');
          table.integer('resource_id').unsigned().references('id').inTable('vpp_resources').onDelete('CASCADE');
          
          // 聚合参数
          table.decimal('allocation_ratio', 5, 2).defaultTo(100); // 分配比例 %
          table.integer('priority', 3).defaultTo(1); // 优先级 1-999
          table.decimal('weight', 5, 2).defaultTo(1.0); // 权重
          table.boolean('is_critical').defaultTo(false); // 是否关键资源
          table.boolean('is_backup').defaultTo(false); // 是否备用资源
          
          // 约束条件
          table.json('resource_constraints');
          table.json('operational_limits');
          table.time('available_start_time'); // 可用开始时间
          table.time('available_end_time');   // 可用结束时间
          table.json('availability_schedule'); // 可用性调度
          
          // 实时状态
          table.decimal('current_contribution', 12, 2).defaultTo(0);
          table.decimal('max_contribution', 12, 2);
          table.string('resource_status', 50).defaultTo('standby');
          table.timestamp('last_update').defaultTo(db.fn.now());
          
          // 3D地图可视化信息
          table.json('visualization_config');
          table.string('map_layer', 100);
          table.json('display_properties');
          
          table.boolean('is_active').defaultTo(true);
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          
          table.index(['aggregation_id', 'is_active']);
          table.index(['resource_id']);
          table.index(['priority', 'weight']);
          table.unique(['aggregation_id', 'resource_id']);
        });
        
        logger.info('创建vpp_aggregation_resources表成功');
      }
      
      // 聚合冲突检测表
      const hasConflictTable = await db.schema.hasTable('vpp_aggregation_conflicts');
      if (!hasConflictTable) {
        await db.schema.createTable('vpp_aggregation_conflicts', (table) => {
          table.increments('id').primary();
          table.integer('aggregation_id').unsigned().references('id').inTable('vpp_aggregations').onDelete('CASCADE');
          table.integer('resource_id').unsigned().references('id').inTable('vpp_resources').onDelete('CASCADE');
          table.string('conflict_type', 100).notNullable();
          table.string('severity', 50).defaultTo('medium'); // low, medium, high, critical
          table.text('description');
          table.json('conflict_details');
          table.json('suggested_resolution');
          table.boolean('is_resolved').defaultTo(false);
          table.timestamp('detected_at').defaultTo(db.fn.now());
          table.timestamp('resolved_at');
          table.string('resolved_by', 100);
          
          table.index(['aggregation_id', 'is_resolved']);
          table.index(['conflict_type', 'severity']);
          table.index(['detected_at']);
        });
        
        logger.info('创建vpp_aggregation_conflicts表成功');
      }
      
      // 实时聚合数据表
      const hasRealTimeTable = await db.schema.hasTable('vpp_aggregation_realtime');
      if (!hasRealTimeTable) {
        await db.schema.createTable('vpp_aggregation_realtime', (table) => {
          table.increments('id').primary();
          table.integer('aggregation_id').unsigned().references('id').inTable('vpp_aggregations').onDelete('CASCADE');
          
          // 实时聚合数据
          table.decimal('total_capacity', 12, 2).defaultTo(0);
          table.decimal('available_capacity', 12, 2).defaultTo(0);
          table.decimal('current_output', 12, 2).defaultTo(0);
          table.decimal('forecasted_output', 12, 2).defaultTo(0);
          
          // 分类统计
          table.json('capacity_by_type');
          table.json('output_by_type');
          table.json('availability_by_type');
          
          // 性能指标
          table.decimal('aggregation_efficiency', 5, 2).defaultTo(95);
          table.decimal('response_capability', 12, 2).defaultTo(0);
          table.decimal('ramp_rate', 10, 2).defaultTo(0); // MW/min
          table.integer('response_time', 6).defaultTo(60); // 秒
          
          // 状态统计
          table.integer('online_resources').defaultTo(0);
          table.integer('offline_resources').defaultTo(0);
          table.integer('maintenance_resources').defaultTo(0);
          table.integer('error_resources').defaultTo(0);
          
          // 预测数据
          table.json('hourly_forecast');
          table.json('daily_forecast');
          table.json('weather_impact');
          
          table.timestamp('timestamp').defaultTo(db.fn.now());
          table.timestamp('created_at').defaultTo(db.fn.now());
          
          table.index(['aggregation_id', 'timestamp']);
          table.index(['timestamp']);
        });
        
        logger.info('创建vpp_aggregation_realtime表成功');
      }
      
    } catch (error) {
      logger.error('创建数据库表失败:', error);
      throw error;
    }
  }

  /**
   * 创建VPP资源聚合
   * @param {Object} aggregationData - 聚合配置数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createAggregation(aggregationData) {
    try {
      const {
        name,
        description,
        strategy = this.aggregationStrategies.SIMPLE_SUM,
        targetCapacity,
        capacityUnit = 'kW',
        resources = [],
        aggregationRules = {},
        optimizationObjectives = {},
        operationalConstraints = {},
        geographicInfo = {},
        createdBy
      } = aggregationData;
      
      // 验证必要字段
      if (!name) {
        throw new Error('聚合名称不能为空');
      }
      
      if (!Object.values(this.aggregationStrategies).includes(strategy)) {
        throw new Error(`不支持的聚合策略: ${strategy}`);
      }
      
      const db = await dbPromise;
      
      // 检查名称是否已存在
      const existing = await db('vpp_aggregations')
        .where({ name })
        .first();
        
      if (existing) {
        throw new Error(`聚合名称已存在: ${name}`);
      }
      
      // 验证资源
      if (resources.length > 0) {
        const resourceIds = resources.map(r => r.resourceId);
        const validResources = await vppResourceService.getResources({
          resourceIds
        });
        
        if (validResources.length !== resourceIds.length) {
          throw new Error('包含无效的资源ID');
        }
        
        // 检测资源冲突
        const conflicts = await this.detectResourceConflicts(resources);
        if (conflicts.length > 0) {
          logger.warn(`检测到资源冲突: ${conflicts.length}个`);
        }
      }
      
      // 计算初始容量
      const initialCapacity = await this.calculateAggregatedCapacity(resources);
      
      // 创建聚合配置
      const [aggregationId] = await db('vpp_aggregations')
        .insert({
          name,
          description,
          strategy,
          status: this.aggregationStatus.DRAFT,
          target_capacity: targetCapacity || initialCapacity.total,
          capacity_unit: capacityUnit,
          aggregation_rules: JSON.stringify(aggregationRules),
          optimization_objectives: JSON.stringify(optimizationObjectives),
          operational_constraints: JSON.stringify(operationalConstraints),
          center_latitude: geographicInfo.centerLatitude,
          center_longitude: geographicInfo.centerLongitude,
          coverage_radius: geographicInfo.coverageRadius,
          geographic_bounds: JSON.stringify(geographicInfo.bounds || {}),
          current_capacity: initialCapacity.total,
          available_capacity: initialCapacity.available,
          resource_count: resources.length,
          active_resource_count: initialCapacity.activeCount,
          created_by: createdBy || 'user'
        })
        .returning('id');
      
      // 添加资源关联
      if (resources.length > 0) {
        await this.addResourcesToAggregation(aggregationId, resources);
      }
      
      // 初始化实时数据
      await this.initializeRealTimeData(aggregationId);
      
      logger.info(`成功创建VPP资源聚合: ${name} (ID: ${aggregationId})`);
      
      return {
        success: true,
        aggregationId,
        initialCapacity,
        message: '资源聚合创建成功'
      };
      
    } catch (error) {
      logger.error('创建VPP资源聚合失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 添加资源到聚合
   * @param {number} aggregationId - 聚合ID
   * @param {Array} resources - 资源配置列表
   * @returns {Promise<Object>} - 操作结果
   */
  async addResourcesToAggregation(aggregationId, resources) {
    try {
      const db = await dbPromise;
      
      // 验证聚合是否存在
      const aggregation = await db('vpp_aggregations')
        .where({ id: aggregationId })
        .first();
        
      if (!aggregation) {
        throw new Error('聚合不存在');
      }
      
      // 检测冲突
      const conflicts = await this.detectResourceConflicts(resources, aggregationId);
      
      // 准备插入数据
      const resourceAssociations = [];
      const conflictRecords = [];
      
      for (const resource of resources) {
        const {
          resourceId,
          allocationRatio = 100,
          priority = 1,
          weight = 1.0,
          isCritical = false,
          isBackup = false,
          constraints = {},
          operationalLimits = {},
          availabilitySchedule = {},
          visualizationConfig = {}
        } = resource;
        
        // 获取资源详情
        const resourceDetail = await vppResourceService.getResourceById(resourceId);
        if (!resourceDetail) {
          throw new Error(`资源不存在: ${resourceId}`);
        }
        
        // 计算最大贡献
        const maxContribution = (resourceDetail.rated_capacity * allocationRatio) / 100;
        
        resourceAssociations.push({
          aggregation_id: aggregationId,
          resource_id: resourceId,
          allocation_ratio: allocationRatio,
          priority,
          weight,
          is_critical: isCritical,
          is_backup: isBackup,
          resource_constraints: JSON.stringify(constraints),
          operational_limits: JSON.stringify(operationalLimits),
          availability_schedule: JSON.stringify(availabilitySchedule),
          max_contribution: maxContribution,
          visualization_config: JSON.stringify(visualizationConfig),
          map_layer: visualizationConfig.layer || 'default'
        });
        
        // 检查该资源的冲突
        const resourceConflicts = conflicts.filter(c => c.resourceId === resourceId);
        for (const conflict of resourceConflicts) {
          conflictRecords.push({
            aggregation_id: aggregationId,
            resource_id: resourceId,
            conflict_type: conflict.type,
            severity: conflict.severity,
            description: conflict.description,
            conflict_details: JSON.stringify(conflict.details),
            suggested_resolution: JSON.stringify(conflict.suggestedResolution)
          });
        }
      }
      
      // 批量插入
      await db.transaction(async (trx) => {
        // 插入资源关联
        if (resourceAssociations.length > 0) {
          await trx('vpp_aggregation_resources').insert(resourceAssociations);
        }
        
        // 插入冲突记录
        if (conflictRecords.length > 0) {
          await trx('vpp_aggregation_conflicts').insert(conflictRecords);
        }
        
        // 更新聚合统计
        await this.updateAggregationStatistics(aggregationId, trx);
      });
      
      // 更新实时数据
      await this.updateRealTimeData(aggregationId);
      
      logger.info(`成功添加${resources.length}个资源到聚合${aggregationId}`);
      
      return {
        success: true,
        addedCount: resources.length,
        conflictCount: conflictRecords.length,
        message: '资源添加成功'
      };
      
    } catch (error) {
      logger.error('添加资源到聚合失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检测资源冲突
   * @param {Array} resources - 资源列表
   * @param {number} excludeAggregationId - 排除的聚合ID
   * @returns {Promise<Array>} - 冲突列表
   */
  async detectResourceConflicts(resources, excludeAggregationId = null) {
    try {
      const conflicts = [];
      const db = await dbPromise;
      
      for (const resource of resources) {
        const { resourceId, allocationRatio = 100 } = resource;
        
        // 检查资源是否已被其他聚合使用
        let query = db('vpp_aggregation_resources as ar')
          .join('vpp_aggregations as a', 'ar.aggregation_id', 'a.id')
          .where('ar.resource_id', resourceId)
          .where('ar.is_active', true)
          .where('a.status', '!=', 'archived');
          
        if (excludeAggregationId) {
          query = query.where('ar.aggregation_id', '!=', excludeAggregationId);
        }
        
        const existingUsage = await query.select(
          'ar.aggregation_id',
          'ar.allocation_ratio',
          'a.name as aggregation_name',
          'a.status'
        );
        
        if (existingUsage.length > 0) {
          // 计算总分配比例
          const totalAllocation = existingUsage.reduce((sum, usage) => 
            sum + parseFloat(usage.allocation_ratio), 0) + allocationRatio;
          
          if (totalAllocation > 100) {
            conflicts.push({
              resourceId,
              type: this.conflictTypes.CAPACITY_OVERLAP,
              severity: 'high',
              description: `资源容量分配超过100% (当前: ${totalAllocation}%)`,
              details: {
                totalAllocation,
                existingUsage,
                newAllocation: allocationRatio
              },
              suggestedResolution: {
                action: 'reduce_allocation',
                maxAllowedRatio: 100 - (totalAllocation - allocationRatio)
              }
            });
          }
        }
        
        // 检查资源状态
        const resourceDetail = await vppResourceService.getResourceById(resourceId);
        if (resourceDetail && resourceDetail.status === 'offline') {
          conflicts.push({
            resourceId,
            type: this.conflictTypes.RESOURCE_UNAVAILABLE,
            severity: 'medium',
            description: '资源当前离线不可用',
            details: {
              resourceStatus: resourceDetail.status,
              lastUpdate: resourceDetail.updated_at
            },
            suggestedResolution: {
              action: 'check_resource_status',
              waitForOnline: true
            }
          });
        }
      }
      
      return conflicts;
      
    } catch (error) {
      logger.error('检测资源冲突失败:', error);
      return [];
    }
  }

  /**
   * 计算聚合容量
   * @param {Array} resources - 资源列表
   * @returns {Promise<Object>} - 容量统计
   */
  async calculateAggregatedCapacity(resources) {
    try {
      let totalCapacity = 0;
      let availableCapacity = 0;
      let activeCount = 0;
      const capacityByType = {};
      
      for (const resource of resources) {
        const { resourceId, allocationRatio = 100 } = resource;
        
        const resourceDetail = await vppResourceService.getResourceById(resourceId);
        if (resourceDetail) {
          const allocatedCapacity = (resourceDetail.rated_capacity * allocationRatio) / 100;
          totalCapacity += allocatedCapacity;
          
          if (resourceDetail.status === 'online') {
            availableCapacity += allocatedCapacity;
            activeCount++;
          }
          
          // 按类型统计
          if (!capacityByType[resourceDetail.type]) {
            capacityByType[resourceDetail.type] = 0;
          }
          capacityByType[resourceDetail.type] += allocatedCapacity;
        }
      }
      
      return {
        total: totalCapacity,
        available: availableCapacity,
        activeCount,
        totalCount: resources.length,
        utilizationRate: totalCapacity > 0 ? (availableCapacity / totalCapacity) * 100 : 0,
        capacityByType
      };
      
    } catch (error) {
      logger.error('计算聚合容量失败:', error);
      return {
        total: 0,
        available: 0,
        activeCount: 0,
        totalCount: 0,
        utilizationRate: 0,
        capacityByType: {}
      };
    }
  }

  /**
   * 更新聚合统计信息
   * @param {number} aggregationId - 聚合ID
   * @param {Object} trx - 数据库事务
   */
  async updateAggregationStatistics(aggregationId, trx = null) {
    try {
      const db = trx || await dbPromise;
      
      // 获取聚合的所有资源
      const resources = await db('vpp_aggregation_resources as ar')
        .join('vpp_resources as r', 'ar.resource_id', 'r.id')
        .where('ar.aggregation_id', aggregationId)
        .where('ar.is_active', true)
        .select(
          'ar.*',
          'r.rated_capacity',
          'r.status as resource_status',
          'r.type as resource_type'
        );
      
      // 计算统计信息
      let totalCapacity = 0;
      let availableCapacity = 0;
      let activeResourceCount = 0;
      
      for (const resource of resources) {
        const allocatedCapacity = (resource.rated_capacity * resource.allocation_ratio) / 100;
        totalCapacity += allocatedCapacity;
        
        if (resource.resource_status === 'online') {
          availableCapacity += allocatedCapacity;
          activeResourceCount++;
        }
      }
      
      const utilizationRate = totalCapacity > 0 ? (availableCapacity / totalCapacity) * 100 : 0;
      
      // 更新聚合记录
      await db('vpp_aggregations')
        .where({ id: aggregationId })
        .update({
          current_capacity: totalCapacity,
          available_capacity: availableCapacity,
          utilization_rate: utilizationRate,
          resource_count: resources.length,
          active_resource_count: activeResourceCount,
          updated_at: db.fn.now()
        });
      
    } catch (error) {
      logger.error('更新聚合统计信息失败:', error);
    }
  }

  /**
   * 初始化实时数据
   * @param {number} aggregationId - 聚合ID
   */
  async initializeRealTimeData(aggregationId) {
    try {
      const db = await dbPromise;
      
      // 获取聚合信息
      const aggregation = await db('vpp_aggregations')
        .where({ id: aggregationId })
        .first();
        
      if (!aggregation) {
        return;
      }
      
      // 初始化实时数据记录
      await db('vpp_aggregation_realtime')
        .insert({
          aggregation_id: aggregationId,
          total_capacity: aggregation.current_capacity,
          available_capacity: aggregation.available_capacity,
          current_output: 0,
          forecasted_output: 0,
          capacity_by_type: JSON.stringify({}),
          output_by_type: JSON.stringify({}),
          availability_by_type: JSON.stringify({}),
          online_resources: aggregation.active_resource_count,
          offline_resources: aggregation.resource_count - aggregation.active_resource_count,
          hourly_forecast: JSON.stringify([]),
          daily_forecast: JSON.stringify([])
        });
      
    } catch (error) {
      logger.error('初始化实时数据失败:', error);
    }
  }

  /**
   * 启动实时计算引擎
   */
  async startRealTimeEngine() {
    try {
      if (this.calculationEngine.isRunning) {
        return;
      }
      
      this.calculationEngine.isRunning = true;
      this.calculationEngine.intervalId = setInterval(async () => {
        await this.updateAllRealTimeData();
      }, this.calculationEngine.updateInterval);
      
      logger.info('实时计算引擎已启动');
      
    } catch (error) {
      logger.error('启动实时计算引擎失败:', error);
    }
  }

  /**
   * 停止实时计算引擎
   */
  stopRealTimeEngine() {
    if (this.calculationEngine.intervalId) {
      clearInterval(this.calculationEngine.intervalId);
      this.calculationEngine.intervalId = null;
    }
    this.calculationEngine.isRunning = false;
    logger.info('实时计算引擎已停止');
  }

  /**
   * 更新所有聚合的实时数据
   */
  async updateAllRealTimeData() {
    try {
      const db = await dbPromise;
      
      // 获取所有活跃的聚合
      const aggregations = await db('vpp_aggregations')
        .where('status', this.aggregationStatus.ACTIVE)
        .select('id');
      
      // 并行更新
      const updatePromises = aggregations.map(agg => 
        this.updateRealTimeData(agg.id)
      );
      
      await Promise.all(updatePromises);
      
    } catch (error) {
      logger.error('更新所有实时数据失败:', error);
    }
  }

  /**
   * 更新指定聚合的实时数据
   * @param {number} aggregationId - 聚合ID
   */
  async updateRealTimeData(aggregationId) {
    try {
      const db = await dbPromise;
      
      // 获取聚合资源的实时数据
      const resourceData = await db('vpp_aggregation_resources as ar')
        .join('vpp_resources as r', 'ar.resource_id', 'r.id')
        .leftJoin('vpp_resource_instances as ri', 'r.id', 'ri.resource_id')
        .where('ar.aggregation_id', aggregationId)
        .where('ar.is_active', true)
        .select(
          'ar.*',
          'r.type as resource_type',
          'r.status as resource_status',
          'r.rated_capacity',
          'ri.current_output',
          'ri.available_capacity',
          'ri.efficiency'
        );
      
      // 计算聚合数据
      let totalCapacity = 0;
      let availableCapacity = 0;
      let currentOutput = 0;
      let onlineResources = 0;
      let offlineResources = 0;
      
      const capacityByType = {};
      const outputByType = {};
      const availabilityByType = {};
      
      for (const resource of resourceData) {
        const allocatedCapacity = (resource.rated_capacity * resource.allocation_ratio) / 100;
        const allocatedOutput = resource.current_output ? 
          (resource.current_output * resource.allocation_ratio) / 100 : 0;
        
        totalCapacity += allocatedCapacity;
        currentOutput += allocatedOutput;
        
        if (resource.resource_status === 'online') {
          availableCapacity += allocatedCapacity;
          onlineResources++;
        } else {
          offlineResources++;
        }
        
        // 按类型统计
        const type = resource.resource_type;
        capacityByType[type] = (capacityByType[type] || 0) + allocatedCapacity;
        outputByType[type] = (outputByType[type] || 0) + allocatedOutput;
        availabilityByType[type] = (availabilityByType[type] || 0) + 
          (resource.resource_status === 'online' ? allocatedCapacity : 0);
      }
      
      // 计算效率和响应能力
      const efficiency = totalCapacity > 0 ? (currentOutput / totalCapacity) * 100 : 0;
      const responseCapability = availableCapacity - currentOutput;
      
      // 更新实时数据
      await db('vpp_aggregation_realtime')
        .where({ aggregation_id: aggregationId })
        .update({
          total_capacity: totalCapacity,
          available_capacity: availableCapacity,
          current_output: currentOutput,
          capacity_by_type: JSON.stringify(capacityByType),
          output_by_type: JSON.stringify(outputByType),
          availability_by_type: JSON.stringify(availabilityByType),
          aggregation_efficiency: efficiency,
          response_capability: responseCapability,
          online_resources: onlineResources,
          offline_resources: offlineResources,
          timestamp: db.fn.now()
        });
      
      // 更新缓存
      this.realTimeData.set(aggregationId, {
        totalCapacity,
        availableCapacity,
        currentOutput,
        efficiency,
        responseCapability,
        onlineResources,
        offlineResources,
        lastUpdate: Date.now()
      });
      
    } catch (error) {
      logger.error(`更新聚合${aggregationId}实时数据失败:`, error);
    }
  }

  /**
   * 获取聚合列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} - 聚合列表
   */
  async getAggregations(filters = {}) {
    try {
      const {
        status,
        strategy,
        search,
        limit = 50,
        offset = 0
      } = filters;
      
      const db = await dbPromise;
      
      let query = db('vpp_aggregations as a')
        .leftJoin('vpp_aggregation_realtime as rt', 'a.id', 'rt.aggregation_id')
        .select(
          'a.*',
          'rt.current_output',
          'rt.aggregation_efficiency',
          'rt.response_capability',
          'rt.online_resources',
          'rt.offline_resources'
        );
      
      // 应用过滤条件
      if (status) {
        query = query.where('a.status', status);
      }
      
      if (strategy) {
        query = query.where('a.strategy', strategy);
      }
      
      if (search) {
        query = query.where(function() {
          this.where('a.name', 'like', `%${search}%`)
              .orWhere('a.description', 'like', `%${search}%`);
        });
      }
      
      // 排序和分页
      query = query.orderBy('a.created_at', 'desc')
                   .limit(limit)
                   .offset(offset);
      
      const aggregations = await query;
      
      // 处理JSON字段
      return aggregations.map(agg => ({
        ...agg,
        aggregation_rules: agg.aggregation_rules ? JSON.parse(agg.aggregation_rules) : {},
        optimization_objectives: agg.optimization_objectives ? 
          JSON.parse(agg.optimization_objectives) : {},
        operational_constraints: agg.operational_constraints ? 
          JSON.parse(agg.operational_constraints) : {},
        geographic_bounds: agg.geographic_bounds ? JSON.parse(agg.geographic_bounds) : {}
      }));
      
    } catch (error) {
      logger.error('获取聚合列表失败:', error);
      return [];
    }
  }

  /**
   * 获取聚合详情
   * @param {number} aggregationId - 聚合ID
   * @returns {Promise<Object|null>} - 聚合详情
   */
  async getAggregationById(aggregationId) {
    try {
      const db = await dbPromise;
      
      // 获取聚合基本信息
      const aggregation = await db('vpp_aggregations')
        .where({ id: aggregationId })
        .first();
        
      if (!aggregation) {
        return null;
      }
      
      // 获取关联资源
      const resources = await db('vpp_aggregation_resources as ar')
        .join('vpp_resources as r', 'ar.resource_id', 'r.id')
        .where('ar.aggregation_id', aggregationId)
        .where('ar.is_active', true)
        .select(
          'ar.*',
          'r.name as resource_name',
          'r.type as resource_type',
          'r.status as resource_status',
          'r.rated_capacity',
          'r.location',
          'r.latitude',
          'r.longitude'
        );
      
      // 获取实时数据
      const realTimeData = await db('vpp_aggregation_realtime')
        .where({ aggregation_id: aggregationId })
        .orderBy('timestamp', 'desc')
        .first();
      
      // 获取冲突信息
      const conflicts = await db('vpp_aggregation_conflicts')
        .where({ aggregation_id: aggregationId, is_resolved: false })
        .orderBy('detected_at', 'desc');
      
      // 处理JSON字段
      const processedResources = resources.map(resource => ({
        ...resource,
        resource_constraints: resource.resource_constraints ? 
          JSON.parse(resource.resource_constraints) : {},
        operational_limits: resource.operational_limits ? 
          JSON.parse(resource.operational_limits) : {},
        availability_schedule: resource.availability_schedule ? 
          JSON.parse(resource.availability_schedule) : {},
        visualization_config: resource.visualization_config ? 
          JSON.parse(resource.visualization_config) : {}
      }));
      
      const processedRealTimeData = realTimeData ? {
        ...realTimeData,
        capacity_by_type: realTimeData.capacity_by_type ? 
          JSON.parse(realTimeData.capacity_by_type) : {},
        output_by_type: realTimeData.output_by_type ? 
          JSON.parse(realTimeData.output_by_type) : {},
        availability_by_type: realTimeData.availability_by_type ? 
          JSON.parse(realTimeData.availability_by_type) : {},
        hourly_forecast: realTimeData.hourly_forecast ? 
          JSON.parse(realTimeData.hourly_forecast) : [],
        daily_forecast: realTimeData.daily_forecast ? 
          JSON.parse(realTimeData.daily_forecast) : []
      } : null;
      
      const processedConflicts = conflicts.map(conflict => ({
        ...conflict,
        conflict_details: conflict.conflict_details ? 
          JSON.parse(conflict.conflict_details) : {},
        suggested_resolution: conflict.suggested_resolution ? 
          JSON.parse(conflict.suggested_resolution) : {}
      }));
      
      return {
        ...aggregation,
        aggregation_rules: aggregation.aggregation_rules ? 
          JSON.parse(aggregation.aggregation_rules) : {},
        optimization_objectives: aggregation.optimization_objectives ? 
          JSON.parse(aggregation.optimization_objectives) : {},
        operational_constraints: aggregation.operational_constraints ? 
          JSON.parse(aggregation.operational_constraints) : {},
        geographic_bounds: aggregation.geographic_bounds ? 
          JSON.parse(aggregation.geographic_bounds) : {},
        resources: processedResources,
        realTimeData: processedRealTimeData,
        conflicts: processedConflicts
      };
      
    } catch (error) {
      logger.error('获取聚合详情失败:', error);
      return null;
    }
  }

  /**
   * 激活聚合
   * @param {number} aggregationId - 聚合ID
   * @returns {Promise<Object>} - 操作结果
   */
  async activateAggregation(aggregationId) {
    try {
      const db = await dbPromise;
      
      // 检查聚合是否存在
      const aggregation = await db('vpp_aggregations')
        .where({ id: aggregationId })
        .first();
        
      if (!aggregation) {
        throw new Error('聚合不存在');
      }
      
      // 检查是否有未解决的严重冲突
      const criticalConflicts = await db('vpp_aggregation_conflicts')
        .where({ 
          aggregation_id: aggregationId, 
          is_resolved: false,
          severity: 'critical'
        })
        .count('id as count')
        .first();
        
      if (criticalConflicts.count > 0) {
        throw new Error('存在未解决的严重冲突，无法激活');
      }
      
      // 激活聚合
      await db('vpp_aggregations')
        .where({ id: aggregationId })
        .update({ 
          status: this.aggregationStatus.ACTIVE,
          updated_at: db.fn.now()
        });
      
      // 立即更新实时数据
      await this.updateRealTimeData(aggregationId);
      
      logger.info(`聚合${aggregationId}已激活`);
      
      return {
        success: true,
        message: '聚合已激活'
      };
      
    } catch (error) {
      logger.error('激活聚合失败:', error);
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
      
      // 统计聚合数量
      const stats = await db('vpp_aggregations')
        .select(
          db.raw('COUNT(*) as total_aggregations'),
          db.raw('COUNT(CASE WHEN status = "active" THEN 1 END) as active_aggregations'),
          db.raw('COUNT(CASE WHEN status = "draft" THEN 1 END) as draft_aggregations'),
          db.raw('SUM(current_capacity) as total_capacity'),
          db.raw('SUM(available_capacity) as available_capacity')
        )
        .first();
      
      // 统计冲突数量
      const conflictStats = await db('vpp_aggregation_conflicts')
        .select(
          db.raw('COUNT(*) as total_conflicts'),
          db.raw('COUNT(CASE WHEN is_resolved = false THEN 1 END) as unresolved_conflicts'),
          db.raw('COUNT(CASE WHEN severity = "critical" AND is_resolved = false THEN 1 END) as critical_conflicts')
        )
        .first();
      
      return {
        service: 'VPPResourceAggregationService',
        status: 'running',
        realtime_engine: {
          is_running: this.calculationEngine.isRunning,
          update_interval: this.calculationEngine.updateInterval,
          last_update: this.lastCacheUpdate
        },
        cache_status: {
          aggregation_cache_size: this.aggregationCache.size,
          realtime_data_size: this.realTimeData.size,
          is_expired: this.isCacheExpired()
        },
        statistics: {
          total_aggregations: parseInt(stats.total_aggregations) || 0,
          active_aggregations: parseInt(stats.active_aggregations) || 0,
          draft_aggregations: parseInt(stats.draft_aggregations) || 0,
          total_capacity: parseFloat(stats.total_capacity) || 0,
          available_capacity: parseFloat(stats.available_capacity) || 0,
          capacity_utilization: stats.total_capacity > 0 ? 
            (stats.available_capacity / stats.total_capacity) * 100 : 0,
          total_conflicts: parseInt(conflictStats.total_conflicts) || 0,
          unresolved_conflicts: parseInt(conflictStats.unresolved_conflicts) || 0,
          critical_conflicts: parseInt(conflictStats.critical_conflicts) || 0
        },
        supported_strategies: Object.keys(this.aggregationStrategies).length,
        last_check: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      return {
        service: 'VPPResourceAggregationService',
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
const vppResourceAggregationService = new VPPResourceAggregationService();

export default vppResourceAggregationService;
export { AGGREGATION_STRATEGIES, AGGREGATION_STATUS, CONFLICT_TYPES };