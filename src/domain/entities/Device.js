import { dbPromise } from '../../infrastructure/database/index.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger.js';

class Device {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.buildingId = data.building_id || data.buildingId;
    this.floor = data.floor;
    this.room = data.room;
    this.manufacturer = data.manufacturer;
    this.model = data.model;
    this.serialNumber = data.serial_number || data.serialNumber;
    this.ipAddress = data.ip_address || data.ipAddress;
    this.macAddress = data.mac_address || data.macAddress;
    this.status = data.status;
    this.lastCommunication = data.last_communication || data.lastCommunication;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  /**
   * 创建新设备
   * @param {Object} deviceData - 设备数据
   * @returns {Promise<Device>} 创建的设备
   */
  static async create(deviceData) {
    try {
      const deviceId = uuidv4();
      const timestamp = new Date().toISOString();

      const device = {
        id: deviceId,
        name: deviceData.name,
        type: deviceData.type,
        building_id: deviceData.buildingId || deviceData.building_id,
        floor: deviceData.floor,
        room: deviceData.room,
        manufacturer: deviceData.manufacturer,
        model: deviceData.model,
        serial_number: deviceData.serialNumber || deviceData.serial_number,
        ip_address: deviceData.ipAddress || deviceData.ip_address,
        mac_address: deviceData.macAddress || deviceData.mac_address,
        status: deviceData.status || 'active',
        last_communication: deviceData.lastCommunication || null,
        created_at: timestamp,
        updated_at: timestamp
      };

      const db = await dbPromise;
      await db('devices').insert(device);
      
      const newDevice = await Device.findById(deviceId);
      logger.info('设备创建成功', { deviceId, name: deviceData.name });
      return newDevice;
    } catch (error) {
      logger.error('创建设备失败', { error: error.message, deviceData });
      throw error;
    }
  }

  /**
   * 根据ID获取设备
   * @param {string} id - 设备ID
   * @returns {Promise<Device|null>} 设备信息
   */
  static async findById(id) {
    try {
      const db = await dbPromise;
      const device = await db('devices').where({ id }).first();
      return device ? new Device(device) : null;
    } catch (error) {
      logger.error('根据ID查找设备失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 获取设备列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 设备列表
   */
  static async findAll(filters = {}) {
    try {
      const db = await dbPromise;
      let query = db('devices');

      if (filters.type) {
        query = query.where('type', filters.type);
      }
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.building_id) {
        query = query.where('building_id', filters.building_id);
      }
      if (filters.floor) {
        query = query.where('floor', filters.floor);
      }
      if (filters.manufacturer) {
        query = query.where('manufacturer', filters.manufacturer);
      }

      const devices = await query.orderBy('created_at', 'desc');
      return devices.map(device => new Device(device));
    } catch (error) {
      logger.error('获取设备列表失败', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * 分页获取设备列表
   * @param {Object} filters - 过滤条件
   * @param {number} offset - 偏移量
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 设备列表
   */
  static async findWithPagination(filters = {}, offset = 0, limit = 20) {
    try {
      const db = await dbPromise;
      let query = db('devices');

      // 应用过滤条件
      if (filters.type) {
        query = query.where('type', filters.type);
      }
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.building_id) {
        query = query.where('building_id', filters.building_id);
      }
      if (filters.floor) {
        query = query.where('floor', filters.floor);
      }
      if (filters.manufacturer) {
        query = query.where('manufacturer', filters.manufacturer);
      }
      if (filters.name) {
        query = query.where('name', 'like', `%${filters.name}%`);
      }

      const devices = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return devices.map(device => new Device(device));
    } catch (error) {
      logger.error('分页获取设备列表失败', { error: error.message, filters, offset, limit });
      throw error;
    }
  }

  /**
   * 统计设备数量
   * @param {Object} filters - 过滤条件
   * @returns {Promise<number>} 设备数量
   */
  static async countDocuments(filters = {}) {
    try {
      const db = await dbPromise;
      let query = db('devices');

      // 应用过滤条件
      if (filters.type) {
        query = query.where('type', filters.type);
      }
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.building_id) {
        query = query.where('building_id', filters.building_id);
      }
      if (filters.floor) {
        query = query.where('floor', filters.floor);
      }
      if (filters.manufacturer) {
        query = query.where('manufacturer', filters.manufacturer);
      }
      if (filters.name) {
        query = query.where('name', 'like', `%${filters.name}%`);
      }

      const result = await query.count('* as count').first();
      return result.count;
    } catch (error) {
      logger.error('统计设备数量失败', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * 更新设备信息
   * @param {string} id - 设备ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Device>} 更新后的设备
   */
  static async update(id, updates) {
    try {
      const timestamp = new Date().toISOString();
      const updateData = {
        ...updates,
        updated_at: timestamp
      };

      // 转换字段名
      if (updateData.buildingId) {
        updateData.building_id = updateData.buildingId;
        delete updateData.buildingId;
      }
      if (updateData.serialNumber) {
        updateData.serial_number = updateData.serialNumber;
        delete updateData.serialNumber;
      }
      if (updateData.ipAddress) {
        updateData.ip_address = updateData.ipAddress;
        delete updateData.ipAddress;
      }
      if (updateData.macAddress) {
        updateData.mac_address = updateData.macAddress;
        delete updateData.macAddress;
      }
      if (updateData.lastCommunication) {
        updateData.last_communication = updateData.lastCommunication;
        delete updateData.lastCommunication;
      }

      const db = await dbPromise;
      await db('devices').where({ id }).update(updateData);
      
      const updatedDevice = await Device.findById(id);
      logger.info('设备更新成功', { deviceId: id, updates });
      return updatedDevice;
    } catch (error) {
      logger.error('更新设备失败', { error: error.message, id, updates });
      throw error;
    }
  }

  /**
   * 更新设备状态
   * @param {string} id - 设备ID
   * @param {string} status - 新状态
   * @returns {Promise<Device>} 更新后的设备
   */
  static async updateStatus(id, status) {
    try {
      const updatedDevice = await Device.update(id, { status });
      logger.info('设备状态更新成功', { deviceId: id, status });
      return updatedDevice;
    } catch (error) {
      logger.error('更新设备状态失败', { error: error.message, id, status });
      throw error;
    }
  }

  /**
   * 记录设备通信时间
   * @param {string} id - 设备ID
   * @returns {Promise<Device>} 更新后的设备
   */
  static async recordCommunication(id) {
    try {
      const updatedDevice = await Device.update(id, {
        last_communication: new Date().toISOString(),
        status: 'active'
      });
      logger.info('设备通信时间记录成功', { deviceId: id });
      return updatedDevice;
    } catch (error) {
      logger.error('记录设备通信时间失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 删除设备
   * @param {string} id - 设备ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  static async delete(id) {
    try {
      const db = await dbPromise;
      const result = await db('devices').where({ id }).del();
      logger.info('设备删除成功', { deviceId: id });
      return result > 0;
    } catch (error) {
      logger.error('删除设备失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 根据类型获取设备统计
   * @returns {Promise<Object>} 设备类型统计
   */
  static async getStatsByType() {
    try {
      const db = await dbPromise;
      const stats = await db('devices')
        .select('type')
        .count('* as count')
        .groupBy('type');
      
      return stats.reduce((acc, item) => {
        acc[item.type] = item.count;
        return acc;
      }, {});
    } catch (error) {
      logger.error('获取设备类型统计失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 根据状态获取设备统计
   * @returns {Promise<Object>} 设备状态统计
   */
  static async getStatsByStatus() {
    try {
      const db = await dbPromise;
      const stats = await db('devices')
        .select('status')
        .count('* as count')
        .groupBy('status');
      
      return stats.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {});
    } catch (error) {
      logger.error('获取设备状态统计失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取设备健康状态
   * @param {string} id - 设备ID
   * @returns {Promise<Object>} 设备健康状态
   */
  static async getHealthStatus(id) {
    try {
      const device = await Device.findById(id);
      if (!device) {
        throw new Error('设备不存在');
      }

      const now = new Date();
      const lastComm = device.lastCommunication ? new Date(device.lastCommunication) : null;
      const timeDiff = lastComm ? (now - lastComm) / (1000 * 60) : null; // 分钟

      let healthStatus = 'unknown';
      if (device.status === 'inactive' || device.status === 'error') {
        healthStatus = 'critical';
      } else if (!lastComm || timeDiff > 60) { // 超过1小时未通信
        healthStatus = 'warning';
      } else if (timeDiff <= 5) { // 5分钟内有通信
        healthStatus = 'healthy';
      } else {
        healthStatus = 'normal';
      }

      return {
        deviceId: id,
        status: device.status,
        healthStatus,
        lastCommunication: device.lastCommunication,
        timeSinceLastComm: timeDiff
      };
    } catch (error) {
      logger.error('获取设备健康状态失败', { error: error.message, id });
      throw error;
    }
  }
}

export default Device;