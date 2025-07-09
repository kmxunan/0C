import { dbPromise } from '../../infrastructure/database/index.js';
import { v4 as uuidv4 } from 'uuid';

// 储能设备默认参数常量
const STORAGE_DEFAULTS = {
  EFFICIENCY: 0.9,
  MIN_SOC: 0.2,
  MAX_SOC: 0.8
};

class StorageDevice {
  /**
   * 创建储能设备参数记录
   * @param {Object} storageData - 储能设备参数数据
   * @returns {Promise<Object>} 创建的储能设备参数记录
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  static async create(storageData) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const storageDevice = {
      id,
      device_id: storageData.device_id,
      capacity: storageData.capacity,
      efficiency: storageData.efficiency || STORAGE_DEFAULTS.EFFICIENCY,
      min_soc: storageData.min_soc || STORAGE_DEFAULTS.MIN_SOC,
      max_soc: storageData.max_soc || STORAGE_DEFAULTS.MAX_SOC,
      charge_rate: storageData.charge_rate,
      discharge_rate: storageData.discharge_rate,
      battery_type: storageData.battery_type,
      cycle_life: storageData.cycle_life,
      created_at: timestamp,
      updated_at: timestamp
    };

    const db = await dbPromise;
    await db('storage_devices').insert(storageDevice);
    return storageDevice;
  }

  /**
   * 根据设备ID获取储能设备参数
   * @param {string} deviceId - 设备ID
   * @returns {Promise<Object>} 储能设备参数
   */
  static async findByDeviceId(deviceId) {
    const db = await dbPromise;
    return db('storage_devices').where({ device_id: deviceId }).first();
  }

  /**
   * 更新储能设备参数
   * @param {string} deviceId - 设备ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的储能设备参数
   */
  static async updateByDeviceId(deviceId, updates) {
    updates.updated_at = new Date().toISOString();
    const db = await dbPromise;
    await db('storage_devices').where({ device_id: deviceId }).update(updates);
    return this.findByDeviceId(deviceId);
  }

  /**
   * 根据设备ID删除储能设备参数
   * @param {string} deviceId - 设备ID
   * @returns {Promise<number>} 删除的行数
   */
  static async deleteByDeviceId(deviceId) {
    const db = await dbPromise;
    return db('storage_devices').where({ device_id: deviceId }).del();
  }

  /**
   * 获取所有储能设备参数
   * @returns {Promise<Array>} 储能设备参数列表
   */
  static async findAll() {
    const db = await dbPromise;
    return db('storage_devices')
      .join('devices', 'storage_devices.device_id', 'devices.id')
      .select(
        'storage_devices.*',
        'devices.name as device_name',
        'devices.model as device_model',
        'devices.building_id'
      );
  }
}

export default StorageDevice;
