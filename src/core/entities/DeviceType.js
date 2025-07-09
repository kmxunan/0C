import { v4 as uuidv4 } from 'uuid';
import dbPromise from '../database.js';

class DeviceType {
  /**
   * 创建新设备类型
   * @param {Object} typeData - 设备类型数据
   * @returns {Promise<Object>} 创建的设备类型
   */
  static async create(typeData) {
    const typeId = uuidv4();
    const timestamp = new Date().toISOString();

    const deviceType = {
      id: typeId,
      name: typeData.name,
      code: typeData.code,
      description: typeData.description || '',
      category: typeData.category || '',
      manufacturer: typeData.manufacturer || '',
      data_schema: typeData.data_schema || '{}',
      created_at: timestamp,
      updated_at: timestamp
    };

    const db = await dbPromise;
    await db('device_types').insert(deviceType);
    return deviceType;
  }

  /**
   * 根据ID获取设备类型
   * @param {string} id - 设备类型ID
   * @returns {Promise<Object>} 设备类型信息
   */
  static async findById(id) {
    const db = await dbPromise;
    return db('device_types').where({ id }).first();
  }

  /**
   * 根据名称获取设备类型
   * @param {string} name - 设备类型名称
   * @returns {Promise<Object>} 设备类型信息
   */
  static async findByName(name) {
    const db = await dbPromise;
    return db('device_types').where({ name }).first();
  }

  /**
   * 获取设备类型列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 设备类型列表
   */
  static async findAll(filters = {}) {
    const db = await dbPromise;
    let query = db('device_types');

    if (filters.category) {
      query = query.where('category', filters.category);
    }
    if (filters.manufacturer) {
      query = query.where('manufacturer', filters.manufacturer);
    }

    return query.orderBy('name', 'asc');
  }

  /**
   * 更新设备类型
   * @param {string} id - 设备类型ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的设备类型
   */
  static async update(id, updates) {
    updates.updated_at = new Date().toISOString();
    const db = await dbPromise;
    await db('device_types').where({ id }).update(updates);
    return this.findById(id);
  }

  /**
   * 删除设备类型
   * @param {string} id - 设备类型ID
   * @returns {Promise<number>} 删除的行数
   */
  static async delete(id) {
    // 检查是否有设备正在使用此类型
    const db = await dbPromise;
    const devicesUsingType = await db('devices').where({ type: id }).count('id as count').first();
    if (parseInt(devicesUsingType.count) > 0) {
      throw new Error('无法删除设备类型，有设备正在使用此类型');
    }
    return db('device_types').where({ id }).del();
  }

  /**
   * 验证数据是否符合设备类型的数据模式
   * @param {string} typeId - 设备类型ID
   * @param {Object} data - 要验证的数据
   * @returns {Promise<boolean>} 验证结果
   */
  static async validateData(typeId, data) {
    const deviceType = await this.findById(typeId);
    if (!deviceType) {
      throw new Error('设备类型不存在');
    }

    try {
      const schema = JSON.parse(deviceType.data_schema);
      const dataKeys = Object.keys(data);

      // 检查数据是否包含所有必填字段
      for (const [field, type] of Object.entries(schema)) {
        if (!dataKeys.includes(field)) {
          throw new Error(`缺少必填字段: ${field}`);
        }

        // 检查数据类型是否匹配
        if (
          typeof data[field] !== type &&
          !(type === 'number' && typeof data[field] === 'string' && !isNaN(data[field]))
        ) {
          throw new Error(`字段 ${field} 类型不匹配，期望 ${type}，实际 ${typeof data[field]}`);
        }
      }

      return true;
    } catch (error) {
      throw new Error(`数据验证失败: ${error.message}`);
    }
  }
}

export default DeviceType;
