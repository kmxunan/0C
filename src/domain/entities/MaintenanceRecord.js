import { dbPromise } from '../../infrastructure/database/index.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger.js';

class MaintenanceRecord {
  constructor(data) {
    this.id = data.id;
    this.deviceId = data.deviceId || data.device_id;
    this.maintenanceType = data.maintenanceType || data.maintenance_type;
    this.status = data.status;
    this.priority = data.priority;
    this.scheduledDate = data.scheduledDate || data.scheduled_date;
    this.completedDate = data.completedDate || data.completed_date;
    this.description = data.description;
    this.technician = data.technician;
    this.estimatedDuration = data.estimatedDuration || data.estimated_duration;
    this.actualDuration = data.actualDuration || data.actual_duration;
    this.cost = data.cost;
    this.notes = data.notes;
    this.createdBy = data.createdBy || data.created_by;
    this.updatedBy = data.updatedBy || data.updated_by;
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  /**
   * 创建新的维护记录
   * @param {Object} maintenanceData - 维护记录数据
   * @returns {Promise<MaintenanceRecord>} 创建的维护记录
   */
  static async create(maintenanceData) {
    try {
      const recordId = uuidv4();
      const timestamp = new Date().toISOString();

      const record = {
        id: recordId,
        device_id: maintenanceData.deviceId,
        maintenance_type: maintenanceData.maintenanceType,
        status: maintenanceData.status || 'scheduled',
        priority: maintenanceData.priority || 'medium',
        scheduled_date: maintenanceData.scheduledDate,
        completed_date: maintenanceData.completedDate || null,
        description: maintenanceData.description,
        technician: maintenanceData.technician,
        estimated_duration: maintenanceData.estimatedDuration,
        actual_duration: maintenanceData.actualDuration || null,
        cost: maintenanceData.cost || null,
        notes: maintenanceData.notes || null,
        created_by: maintenanceData.createdBy,
        updated_by: maintenanceData.updatedBy || maintenanceData.createdBy,
        created_at: maintenanceData.createdAt || timestamp,
        updated_at: timestamp
      };

      const db = await dbPromise;
      await db('maintenance_records').insert(record);
      
      const newRecord = await MaintenanceRecord.findById(recordId);
      logger.info('维护记录创建成功', { recordId, deviceId: maintenanceData.deviceId });
      return newRecord;
    } catch (error) {
      logger.error('创建维护记录失败', { error: error.message, maintenanceData });
      throw error;
    }
  }

  /**
   * 根据ID查找维护记录
   * @param {string} id - 维护记录ID
   * @returns {Promise<MaintenanceRecord|null>} 维护记录
   */
  static async findById(id) {
    try {
      const db = await dbPromise;
      const record = await db('maintenance_records').where({ id }).first();
      return record ? new MaintenanceRecord(record) : null;
    } catch (error) {
      logger.error('根据ID查找维护记录失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 根据ID查找维护记录并包含设备信息
   * @param {string} id - 维护记录ID
   * @returns {Promise<Object|null>} 维护记录及设备信息
   */
  static async findByIdWithDevice(id) {
    try {
      const db = await dbPromise;
      const result = await db('maintenance_records')
        .leftJoin('devices', 'maintenance_records.device_id', 'devices.id')
        .select(
          'maintenance_records.*',
          'devices.name as device_name',
          'devices.type as device_type',
          'devices.manufacturer',
          'devices.model'
        )
        .where('maintenance_records.id', id)
        .first();
      
      if (!result) return null;
      
      const record = new MaintenanceRecord(result);
      record.device = {
        name: result.device_name,
        type: result.device_type,
        manufacturer: result.manufacturer,
        model: result.model
      };
      
      return record;
    } catch (error) {
      logger.error('根据ID查找维护记录及设备信息失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 分页查找维护记录
   * @param {Object} filters - 过滤条件
   * @param {number} offset - 偏移量
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 维护记录列表
   */
  static async findWithPagination(filters = {}, offset = 0, limit = 20) {
    try {
      const db = await dbPromise;
      let query = db('maintenance_records')
        .leftJoin('devices', 'maintenance_records.device_id', 'devices.id')
        .select(
          'maintenance_records.*',
          'devices.name as device_name',
          'devices.type as device_type'
        );

      // 应用过滤条件
      if (filters.deviceId) {
        query = query.where('maintenance_records.device_id', filters.deviceId);
      }
      if (filters.maintenanceType) {
        query = query.where('maintenance_records.maintenance_type', filters.maintenanceType);
      }
      if (filters.status) {
        query = query.where('maintenance_records.status', filters.status);
      }
      if (filters.priority) {
        query = query.where('maintenance_records.priority', filters.priority);
      }
      if (filters.scheduledDate) {
        if (filters.scheduledDate.$gte) {
          query = query.where('maintenance_records.scheduled_date', '>=', filters.scheduledDate.$gte);
        }
        if (filters.scheduledDate.$lte) {
          query = query.where('maintenance_records.scheduled_date', '<=', filters.scheduledDate.$lte);
        }
      }

      const results = await query
        .orderBy('maintenance_records.scheduled_date', 'desc')
        .limit(limit)
        .offset(offset);

      return results.map(record => {
        const maintenanceRecord = new MaintenanceRecord(record);
        maintenanceRecord.device = {
          name: record.device_name,
          type: record.device_type
        };
        return maintenanceRecord;
      });
    } catch (error) {
      logger.error('分页查找维护记录失败', { error: error.message, filters, offset, limit });
      throw error;
    }
  }

  /**
   * 统计维护记录数量
   * @param {Object} filters - 过滤条件
   * @returns {Promise<number>} 记录数量
   */
  static async countDocuments(filters = {}) {
    try {
      const db = await dbPromise;
      let query = db('maintenance_records');

      // 应用过滤条件
      if (filters.deviceId) {
        query = query.where('device_id', filters.deviceId);
      }
      if (filters.maintenanceType) {
        query = query.where('maintenance_type', filters.maintenanceType);
      }
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.priority) {
        query = query.where('priority', filters.priority);
      }
      if (filters.scheduledDate) {
        if (filters.scheduledDate.$gte) {
          query = query.where('scheduled_date', '>=', filters.scheduledDate.$gte);
        }
        if (filters.scheduledDate.$lte) {
          query = query.where('scheduled_date', '<=', filters.scheduledDate.$lte);
        }
      }

      const result = await query.count('* as count').first();
      return result.count;
    } catch (error) {
      logger.error('统计维护记录数量失败', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * 获取维护统计数据
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 统计数据
   */
  static async getStatistics(filters = {}) {
    try {
      const db = await dbPromise;
      let query = db('maintenance_records');

      // 应用过滤条件
      if (filters.deviceId) {
        query = query.where('device_id', filters.deviceId);
      }
      if (filters.maintenanceType) {
        query = query.where('maintenance_type', filters.maintenanceType);
      }
      if (filters.scheduledDate) {
        if (filters.scheduledDate.$gte) {
          query = query.where('scheduled_date', '>=', filters.scheduledDate.$gte);
        }
        if (filters.scheduledDate.$lte) {
          query = query.where('scheduled_date', '<=', filters.scheduledDate.$lte);
        }
      }

      const [totalCount, statusStats, typeStats, priorityStats] = await Promise.all([
        query.clone().count('* as count').first(),
        query.clone().select('status').count('* as count').groupBy('status'),
        query.clone().select('maintenance_type').count('* as count').groupBy('maintenance_type'),
        query.clone().select('priority').count('* as count').groupBy('priority')
      ]);

      return {
        total: totalCount.count,
        byStatus: statusStats.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, item) => {
          acc[item.maintenance_type] = item.count;
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc, item) => {
          acc[item.priority] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('获取维护统计数据失败', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * 查找计划中的维护记录
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 计划中的维护记录
   */
  static async findScheduled(filters = {}) {
    try {
      const db = await dbPromise;
      let query = db('maintenance_records')
        .leftJoin('devices', 'maintenance_records.device_id', 'devices.id')
        .select(
          'maintenance_records.*',
          'devices.name as device_name',
          'devices.type as device_type'
        )
        .where('maintenance_records.status', 'scheduled');

      // 应用过滤条件
      if (filters.deviceId) {
        query = query.where('maintenance_records.device_id', filters.deviceId);
      }
      if (filters.scheduledDate) {
        if (filters.scheduledDate.$gte) {
          query = query.where('maintenance_records.scheduled_date', '>=', filters.scheduledDate.$gte);
        }
        if (filters.scheduledDate.$lte) {
          query = query.where('maintenance_records.scheduled_date', '<=', filters.scheduledDate.$lte);
        }
      }

      const results = await query.orderBy('maintenance_records.scheduled_date', 'asc');

      return results.map(record => {
        const maintenanceRecord = new MaintenanceRecord(record);
        maintenanceRecord.device = {
          name: record.device_name,
          type: record.device_type
        };
        return maintenanceRecord;
      });
    } catch (error) {
      logger.error('查找计划中的维护记录失败', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * 更新维护记录
   * @param {Object} updateData - 更新数据
   * @returns {Promise<MaintenanceRecord>} 更新后的维护记录
   */
  async update(updateData) {
    try {
      const timestamp = new Date().toISOString();
      const updates = {
        ...updateData,
        updated_at: timestamp
      };

      // 转换字段名
      if (updates.deviceId) {
        updates.device_id = updates.deviceId;
        delete updates.deviceId;
      }
      if (updates.maintenanceType) {
        updates.maintenance_type = updates.maintenanceType;
        delete updates.maintenanceType;
      }
      if (updates.scheduledDate) {
        updates.scheduled_date = updates.scheduledDate;
        delete updates.scheduledDate;
      }
      if (updates.completedDate) {
        updates.completed_date = updates.completedDate;
        delete updates.completedDate;
      }
      if (updates.estimatedDuration) {
        updates.estimated_duration = updates.estimatedDuration;
        delete updates.estimatedDuration;
      }
      if (updates.actualDuration) {
        updates.actual_duration = updates.actualDuration;
        delete updates.actualDuration;
      }
      if (updates.createdBy) {
        updates.created_by = updates.createdBy;
        delete updates.createdBy;
      }
      if (updates.updatedBy) {
        updates.updated_by = updates.updatedBy;
        delete updates.updatedBy;
      }

      const db = await dbPromise;
      await db('maintenance_records').where({ id: this.id }).update(updates);
      
      const updatedRecord = await MaintenanceRecord.findById(this.id);
      logger.info('维护记录更新成功', { recordId: this.id, updateData });
      return updatedRecord;
    } catch (error) {
      logger.error('更新维护记录失败', { error: error.message, recordId: this.id, updateData });
      throw error;
    }
  }

  /**
   * 删除维护记录
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete() {
    try {
      const db = await dbPromise;
      const result = await db('maintenance_records').where({ id: this.id }).del();
      logger.info('维护记录删除成功', { recordId: this.id });
      return result > 0;
    } catch (error) {
      logger.error('删除维护记录失败', { error: error.message, recordId: this.id });
      throw error;
    }
  }
}

export default MaintenanceRecord;