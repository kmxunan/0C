import logger from '../../src/shared/utils/logger.js';
import { dbPromise } from '../../src/infrastructure/database/index.js';
import { TIME_INTERVALS, MATH_CONSTANTS } from '../../src/shared/constants/MathConstants.js';
import vppResourceService from './VPPResourceService.js';

/**
 * 虚拟电厂管理服务
 * 负责VPP的创建、配置、资源组合和运营策略管理
 * P0阶段核心功能：VPP定义、资源关联、基础运营策略
 */
class VPPManagementService {
  constructor() {
    this.vppStatus = {
      INACTIVE: 'inactive',
      ACTIVE: 'active',
      MAINTENANCE: 'maintenance',
      SUSPENDED: 'suspended'
    };
    
    this.operationalModes = {
      AUTOMATIC: 'automatic',
      MANUAL: 'manual',
      SCHEDULED: 'scheduled',
      EMERGENCY: 'emergency'
    };
    
    // VPP缓存
    this.vppCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = TIME_INTERVALS.FIVE_MINUTES_MS;
    
    this.initialize();
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      logger.info('初始化虚拟电厂管理服务...');
      
      // 创建必要的数据库表
      await this.createTables();
      
      // 加载VPP缓存
      await this.refreshVPPCache();
      
      logger.info('虚拟电厂管理服务初始化完成');
    } catch (error) {
      logger.error('虚拟电厂管理服务初始化失败:', error);
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    try {
      const db = await dbPromise;
      
      // 检查表是否存在
      const hasResourceAssocTable = await db.schema.hasTable('vpp_resource_associations');
      const hasOperationLogTable = await db.schema.hasTable('vpp_operation_logs');
      
      // 创建VPP资源关联表
      if (!hasResourceAssocTable) {
        await db.schema.createTable('vpp_resource_associations', (table) => {
          table.increments('id').primary();
          table.integer('vpp_id').unsigned().references('id').inTable('vpp_definitions').onDelete('CASCADE');
          table.integer('resource_id').unsigned().references('id').inTable('vpp_resources').onDelete('CASCADE');
          table.decimal('allocation_ratio', 5, 2).defaultTo(100); // 资源分配比例
          table.integer('priority').defaultTo(1); // 优先级
          table.json('constraints'); // 约束条件
          table.boolean('is_active').defaultTo(true);
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
          
          table.unique(['vpp_id', 'resource_id']);
          table.index(['vpp_id', 'is_active']);
        });
        logger.info('创建vpp_resource_associations表成功');
      }
      
      // 创建VPP运营日志表
      if (!hasOperationLogTable) {
        await db.schema.createTable('vpp_operation_logs', (table) => {
          table.increments('id').primary();
          table.integer('vpp_id').unsigned().references('id').inTable('vpp_definitions').onDelete('CASCADE');
          table.string('operation_type', 50).notNullable();
          table.string('operation_mode', 20).notNullable();
          table.json('operation_data');
          table.decimal('target_output', 10, 2);
          table.decimal('actual_output', 10, 2);
          table.string('status', 20).notNullable();
          table.text('notes');
          table.timestamp('start_time').notNullable();
          table.timestamp('end_time');
          table.timestamp('created_at').defaultTo(db.fn.now());
          
          table.index(['vpp_id', 'operation_type']);
          table.index(['start_time', 'end_time']);
        });
        logger.info('创建vpp_operation_logs表成功');
      }
      
    } catch (error) {
      logger.error('创建数据库表失败:', error);
      throw error;
    }
  }

  /**
   * 创建虚拟电厂
   * @param {Object} vppData - VPP数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createVPP(vppData) {
    try {
      const {
        name,
        description,
        resourceIds = [],
        operationalStrategy = {},
        targetCapacity
      } = vppData;
      
      // 验证必要字段
      if (!name) {
        throw new Error('VPP名称不能为空');
      }
      
      const db = await dbPromise;
      
      // 检查VPP名称是否已存在
      const existingVPP = await db('vpp_definitions')
        .where({ name })
        .first();
        
      if (existingVPP) {
        throw new Error(`VPP名称已存在: ${name}`);
      }
      
      // 验证资源是否存在
      if (resourceIds.length > 0) {
        const resources = await vppResourceService.getResources({
          limit: resourceIds.length
        });
        
        const existingResourceIds = resources.map(r => r.id);
        const invalidIds = resourceIds.filter(id => !existingResourceIds.includes(id));
        
        if (invalidIds.length > 0) {
          throw new Error(`无效的资源ID: ${invalidIds.join(', ')}`);
        }
      }
      
      // 计算总容量
      let totalCapacity = 0;
      if (resourceIds.length > 0) {
        const resources = await Promise.all(
          resourceIds.map(id => vppResourceService.getResourceById(id))
        );
        
        totalCapacity = resources.reduce((sum, resource) => {
          return sum + (parseFloat(resource?.rated_capacity) || 0);
        }, 0);
      }
      
      // 创建VPP定义
      const [vppId] = await db('vpp_definitions')
        .insert({
          name,
          description,
          total_capacity: targetCapacity || totalCapacity,
          resource_mix: JSON.stringify({
            resourceCount: resourceIds.length,
            resourceIds: resourceIds
          }),
          operational_strategy: JSON.stringify({
            mode: this.operationalModes.MANUAL,
            ...operationalStrategy
          }),
          status: this.vppStatus.INACTIVE
        })
        .returning('id');
      
      // 关联资源
      if (resourceIds.length > 0) {
        const associations = resourceIds.map(resourceId => ({
          vpp_id: vppId,
          resource_id: resourceId,
          allocation_ratio: 100,
          priority: 1,
          constraints: JSON.stringify({})
        }));
        
        await db('vpp_resource_associations').insert(associations);
      }
      
      // 记录操作日志
      await this.logOperation(vppId, 'create', {
        resourceIds,
        totalCapacity,
        operationalStrategy
      });
      
      // 清除缓存
      this.clearVPPCache();
      
      logger.info(`成功创建VPP: ${name} (ID: ${vppId})`);
      
      return {
        success: true,
        vppId,
        totalCapacity,
        message: 'VPP创建成功'
      };
      
    } catch (error) {
      logger.error('创建VPP失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取VPP列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} - VPP列表
   */
  async getVPPs(filters = {}) {
    try {
      const {
        status,
        limit = 50,
        offset = 0
      } = filters;
      
      const db = await dbPromise;
      
      let query = db('vpp_definitions as v')
        .select(
          'v.*',
          db.raw('COUNT(DISTINCT ra.resource_id) as resource_count'),
          db.raw('SUM(CASE WHEN r.status = "online" THEN r.rated_capacity ELSE 0 END) as online_capacity'),
          db.raw('SUM(CASE WHEN r.status = "online" THEN ri.current_output ELSE 0 END) as current_output')
        )
        .leftJoin('vpp_resource_associations as ra', function() {
          this.on('v.id', '=', 'ra.vpp_id')
              .andOn('ra.is_active', '=', db.raw('true'));
        })
        .leftJoin('vpp_resources as r', 'ra.resource_id', 'r.id')
        .leftJoin('vpp_resource_instances as ri', 'r.id', 'ri.resource_id')
        .groupBy('v.id');
      
      // 应用过滤条件
      if (status) {
        query = query.where('v.status', status);
      }
      
      // 分页
      query = query.limit(limit).offset(offset);
      
      const vpps = await query;
      
      // 处理JSON字段
      const processedVPPs = vpps.map(vpp => ({
        ...vpp,
        resource_mix: vpp.resource_mix ? JSON.parse(vpp.resource_mix) : {},
        operational_strategy: vpp.operational_strategy ? 
          JSON.parse(vpp.operational_strategy) : {},
        online_capacity: parseFloat(vpp.online_capacity) || 0,
        current_output: parseFloat(vpp.current_output) || 0,
        capacity_utilization: vpp.total_capacity > 0 ? 
          ((parseFloat(vpp.current_output) || 0) / vpp.total_capacity) * 100 : 0
      }));
      
      return processedVPPs;
      
    } catch (error) {
      logger.error('获取VPP列表失败:', error);
      return [];
    }
  }

  /**
   * 获取VPP详情
   * @param {number} vppId - VPP ID
   * @returns {Promise<Object|null>} - VPP详情
   */
  async getVPPById(vppId) {
    try {
      const db = await dbPromise;
      
      // 获取VPP基本信息
      const vpp = await db('vpp_definitions')
        .where({ id: vppId })
        .first();
      
      if (!vpp) {
        return null;
      }
      
      // 获取关联的资源
      const resources = await db('vpp_resource_associations as ra')
        .join('vpp_resources as r', 'ra.resource_id', 'r.id')
        .leftJoin('vpp_resource_instances as ri', 'r.id', 'ri.resource_id')
        .select(
          'r.*',
          'ri.current_output',
          'ri.available_capacity',
          'ri.efficiency',
          'ri.operational_status',
          'ra.allocation_ratio',
          'ra.priority',
          'ra.constraints as association_constraints'
        )
        .where('ra.vpp_id', vppId)
        .where('ra.is_active', true);
      
      // 处理资源数据
      const processedResources = resources.map(resource => ({
        ...resource,
        technical_specs: resource.technical_specs ? 
          JSON.parse(resource.technical_specs) : {},
        operational_constraints: resource.operational_constraints ? 
          JSON.parse(resource.operational_constraints) : {},
        association_constraints: resource.association_constraints ? 
          JSON.parse(resource.association_constraints) : {}
      }));
      
      // 计算聚合数据
      const aggregation = {
        totalRatedCapacity: 0,
        totalAvailableCapacity: 0,
        totalCurrentOutput: 0,
        averageEfficiency: 0,
        resourceCount: processedResources.length
      };
      
      let totalEfficiency = 0;
      let efficiencyCount = 0;
      
      processedResources.forEach(resource => {
        aggregation.totalRatedCapacity += parseFloat(resource.rated_capacity) || 0;
        aggregation.totalAvailableCapacity += parseFloat(resource.available_capacity) || 0;
        aggregation.totalCurrentOutput += parseFloat(resource.current_output) || 0;
        
        const efficiency = parseFloat(resource.efficiency) || 0;
        if (efficiency > 0) {
          totalEfficiency += efficiency;
          efficiencyCount++;
        }
      });
      
      aggregation.averageEfficiency = efficiencyCount > 0 ? 
        totalEfficiency / efficiencyCount : 0;
      
      aggregation.capacityUtilization = aggregation.totalRatedCapacity > 0 ? 
        (aggregation.totalCurrentOutput / aggregation.totalRatedCapacity) * 100 : 0;
      
      return {
        ...vpp,
        resource_mix: vpp.resource_mix ? JSON.parse(vpp.resource_mix) : {},
        operational_strategy: vpp.operational_strategy ? 
          JSON.parse(vpp.operational_strategy) : {},
        resources: processedResources,
        aggregation
      };
      
    } catch (error) {
      logger.error('获取VPP详情失败:', error);
      return null;
    }
  }

  /**
   * 更新VPP配置
   * @param {number} vppId - VPP ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateVPP(vppId, updateData) {
    try {
      const {
        name,
        description,
        operationalStrategy,
        status
      } = updateData;
      
      const db = await dbPromise;
      
      // 验证VPP是否存在
      const vpp = await db('vpp_definitions')
        .where({ id: vppId })
        .first();
        
      if (!vpp) {
        throw new Error(`VPP不存在: ${vppId}`);
      }
      
      // 构建更新数据
      const updateFields = {
        updated_at: db.fn.now()
      };
      
      if (name) {
        // 检查名称是否重复
        const existingVPP = await db('vpp_definitions')
          .where({ name })
          .whereNot({ id: vppId })
          .first();
          
        if (existingVPP) {
          throw new Error(`VPP名称已存在: ${name}`);
        }
        
        updateFields.name = name;
      }
      
      if (description !== undefined) {
        updateFields.description = description;
      }
      
      if (operationalStrategy) {
        const currentStrategy = vpp.operational_strategy ? 
          JSON.parse(vpp.operational_strategy) : {};
          
        updateFields.operational_strategy = JSON.stringify({
          ...currentStrategy,
          ...operationalStrategy
        });
      }
      
      if (status && Object.values(this.vppStatus).includes(status)) {
        updateFields.status = status;
      }
      
      // 更新VPP
      await db('vpp_definitions')
        .where({ id: vppId })
        .update(updateFields);
      
      // 记录操作日志
      await this.logOperation(vppId, 'update', updateData);
      
      // 清除缓存
      this.clearVPPCache();
      
      logger.info(`成功更新VPP: ${vppId}`);
      
      return {
        success: true,
        message: 'VPP更新成功'
      };
      
    } catch (error) {
      logger.error('更新VPP失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 添加资源到VPP
   * @param {number} vppId - VPP ID
   * @param {Array} resourceAssociations - 资源关联配置
   * @returns {Promise<Object>} - 操作结果
   */
  async addResourcesToVPP(vppId, resourceAssociations) {
    try {
      const db = await dbPromise;
      
      // 验证VPP是否存在
      const vpp = await db('vpp_definitions')
        .where({ id: vppId })
        .first();
        
      if (!vpp) {
        throw new Error(`VPP不存在: ${vppId}`);
      }
      
      // 验证资源并准备关联数据
      const associations = [];
      
      for (const assoc of resourceAssociations) {
        const { resourceId, allocationRatio = 100, priority = 1, constraints = {} } = assoc;
        
        // 检查资源是否存在
        const resource = await vppResourceService.getResourceById(resourceId);
        if (!resource) {
          throw new Error(`资源不存在: ${resourceId}`);
        }
        
        // 检查是否已经关联
        const existingAssoc = await db('vpp_resource_associations')
          .where({ vpp_id: vppId, resource_id: resourceId })
          .first();
          
        if (existingAssoc) {
          // 更新现有关联
          await db('vpp_resource_associations')
            .where({ vpp_id: vppId, resource_id: resourceId })
            .update({
              allocation_ratio: allocationRatio,
              priority,
              constraints: JSON.stringify(constraints),
              is_active: true,
              updated_at: db.fn.now()
            });
        } else {
          // 创建新关联
          associations.push({
            vpp_id: vppId,
            resource_id: resourceId,
            allocation_ratio: allocationRatio,
            priority,
            constraints: JSON.stringify(constraints)
          });
        }
      }
      
      // 批量插入新关联
      if (associations.length > 0) {
        await db('vpp_resource_associations').insert(associations);
      }
      
      // 重新计算VPP总容量
      await this.recalculateVPPCapacity(vppId);
      
      // 记录操作日志
      await this.logOperation(vppId, 'add_resources', {
        resourceAssociations
      });
      
      // 清除缓存
      this.clearVPPCache();
      
      logger.info(`成功为VPP ${vppId} 添加 ${resourceAssociations.length} 个资源`);
      
      return {
        success: true,
        message: '资源添加成功'
      };
      
    } catch (error) {
      logger.error('添加资源到VPP失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 从VPP移除资源
   * @param {number} vppId - VPP ID
   * @param {Array} resourceIds - 资源ID列表
   * @returns {Promise<Object>} - 操作结果
   */
  async removeResourcesFromVPP(vppId, resourceIds) {
    try {
      const db = await dbPromise;
      
      // 验证VPP是否存在
      const vpp = await db('vpp_definitions')
        .where({ id: vppId })
        .first();
        
      if (!vpp) {
        throw new Error(`VPP不存在: ${vppId}`);
      }
      
      // 移除资源关联
      const removedCount = await db('vpp_resource_associations')
        .where({ vpp_id: vppId })
        .whereIn('resource_id', resourceIds)
        .update({ is_active: false, updated_at: db.fn.now() });
      
      // 重新计算VPP总容量
      await this.recalculateVPPCapacity(vppId);
      
      // 记录操作日志
      await this.logOperation(vppId, 'remove_resources', {
        resourceIds,
        removedCount
      });
      
      // 清除缓存
      this.clearVPPCache();
      
      logger.info(`成功从VPP ${vppId} 移除 ${removedCount} 个资源`);
      
      return {
        success: true,
        removedCount,
        message: '资源移除成功'
      };
      
    } catch (error) {
      logger.error('从VPP移除资源失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 重新计算VPP总容量
   * @param {number} vppId - VPP ID
   */
  async recalculateVPPCapacity(vppId) {
    try {
      const db = await dbPromise;
      
      // 计算活跃资源的总容量
      const result = await db('vpp_resource_associations as ra')
        .join('vpp_resources as r', 'ra.resource_id', 'r.id')
        .where('ra.vpp_id', vppId)
        .where('ra.is_active', true)
        .sum('r.rated_capacity as total_capacity')
        .first();
      
      const totalCapacity = parseFloat(result.total_capacity) || 0;
      
      // 更新VPP总容量
      await db('vpp_definitions')
        .where({ id: vppId })
        .update({
          total_capacity: totalCapacity,
          updated_at: db.fn.now()
        });
      
      logger.info(`VPP ${vppId} 总容量重新计算为: ${totalCapacity} kW`);
      
    } catch (error) {
      logger.error('重新计算VPP容量失败:', error);
    }
  }

  /**
   * 记录操作日志
   * @param {number} vppId - VPP ID
   * @param {string} operationType - 操作类型
   * @param {Object} operationData - 操作数据
   */
  async logOperation(vppId, operationType, operationData = {}) {
    try {
      const db = await dbPromise;
      
      await db('vpp_operation_logs').insert({
        vpp_id: vppId,
        operation_type: operationType,
        operation_mode: this.operationalModes.MANUAL,
        operation_data: JSON.stringify(operationData),
        status: 'completed',
        start_time: db.fn.now(),
        end_time: db.fn.now()
      });
      
    } catch (error) {
      logger.error('记录操作日志失败:', error);
    }
  }

  /**
   * 获取VPP操作日志
   * @param {number} vppId - VPP ID
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} - 操作日志列表
   */
  async getOperationLogs(vppId, filters = {}) {
    try {
      const {
        operationType,
        limit = 50,
        offset = 0
      } = filters;
      
      const db = await dbPromise;
      
      let query = db('vpp_operation_logs')
        .where({ vpp_id: vppId })
        .orderBy('created_at', 'desc');
      
      if (operationType) {
        query = query.where('operation_type', operationType);
      }
      
      query = query.limit(limit).offset(offset);
      
      const logs = await query;
      
      // 处理JSON字段
      return logs.map(log => ({
        ...log,
        operation_data: log.operation_data ? JSON.parse(log.operation_data) : {}
      }));
      
    } catch (error) {
      logger.error('获取操作日志失败:', error);
      return [];
    }
  }

  /**
   * 刷新VPP缓存
   */
  async refreshVPPCache() {
    try {
      const vpps = await this.getVPPs({ limit: 1000 });
      
      this.vppCache.clear();
      vpps.forEach(vpp => {
        this.vppCache.set(vpp.id, vpp);
      });
      
      this.lastCacheUpdate = Date.now();
      logger.info(`VPP缓存已刷新，共缓存 ${vpps.length} 个VPP`);
      
    } catch (error) {
      logger.error('刷新VPP缓存失败:', error);
    }
  }

  /**
   * 清除VPP缓存
   */
  clearVPPCache() {
    this.vppCache.clear();
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
      const vpps = await this.getVPPs();
      
      const stats = {
        total: vpps.length,
        active: vpps.filter(v => v.status === this.vppStatus.ACTIVE).length,
        inactive: vpps.filter(v => v.status === this.vppStatus.INACTIVE).length,
        totalCapacity: vpps.reduce((sum, v) => sum + (parseFloat(v.total_capacity) || 0), 0),
        totalOutput: vpps.reduce((sum, v) => sum + (parseFloat(v.current_output) || 0), 0)
      };
      
      return {
        service: 'VPPManagementService',
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        cache: {
          size: this.vppCache.size,
          lastUpdate: this.lastCacheUpdate,
          isExpired: this.isCacheExpired()
        },
        vpps: stats
      };
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      return {
        service: 'VPPManagementService',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 删除VPP
   * @param {number} vppId - VPP ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteVPP(vppId) {
    try {
      const db = await dbPromise;
      
      // 检查VPP是否存在
      const vpp = await db('vpp_definitions')
        .where({ id: vppId })
        .first();
        
      if (!vpp) {
        throw new Error(`VPP不存在: ${vppId}`);
      }
      
      // 删除VPP（级联删除关联和日志）
      await db('vpp_definitions')
        .where({ id: vppId })
        .del();
      
      // 清除缓存
      this.clearVPPCache();
      
      logger.info(`成功删除VPP: ${vppId}`);
      
      return {
        success: true,
        message: 'VPP删除成功'
      };
      
    } catch (error) {
      logger.error('删除VPP失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 创建服务实例
const vppManagementService = new VPPManagementService();

export default vppManagementService;