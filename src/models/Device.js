import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

class Device {
  /**
   * 创建新设备
   * @param {Object} deviceData - 设备数据
   * @returns {Promise<Object>} 创建的设备
   */
  static async create(deviceData) {
    const deviceId = uuidv4();
    const timestamp = new Date().toISOString();

    const device = {
      id: deviceId,
      name: deviceData.name,
      type: deviceData.type,
      building_id: deviceData.building_id,
      floor: deviceData.floor,
      room: deviceData.room,
      manufacturer: deviceData.manufacturer,
      model: deviceData.model,
      serial_number: deviceData.serial_number,
      ip_address: deviceData.ip_address,
      mac_address: deviceData.mac_address,
      status: 'active',
      last_communication: null,
      created_at: timestamp,
      updated_at: timestamp
    };

    await db('devices').insert(device);
    return device;
  }

  /**
   * 根据ID获取设备
   * @param {string} id - 设备ID
   * @returns {Promise<Object>} 设备信息
   */
  static async findById(id) {
    return db('devices').where({ id }).first();
  }

  /**
   * 获取设备列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 设备列表
   */
  static async findAll(filters = {}) {


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

    return query.orderBy('created_at', 'desc');
  }

  /**
   * 更新设备信息
   * @param {string} id - 设备ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的设备
   */
  static async update(id, updates) {
    updates.updated_at = new Date().toISOString();
    await db('devices').where({ id }).update(updates);
    return this.findById(id);
  }

  /**
   * 更新设备状态
   * @param {string} id - 设备ID
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 更新后的设备
   */
  static async updateStatus(id, status) {
    return this.update(id, { status });
  }

  /**
   * 记录设备通信时间
   * @param {string} id - 设备ID
   * @returns {Promise<Object>} 更新后的设备
   */
  static async recordCommunication(id) {
    return this.update(id, {
      last_communication: new Date().toISOString(),
      status: 'active'
    });
  }

  /**
   * 删除设备
   * @param {string} id - 设备ID
   * @returns {Promise<number>} 删除的行数
   */
  static async delete(id) {
    return db('devices').where({ id }).del();
  }
}

export default Device;