const { dbPromise } = require('../database.js');
const { v4: uuidv4 } = require('uuid');

class DeviceHistory {
  /**
   * 记录设备数据到历史记录
   * @param {Object} data - 设备数据
   * @returns {Promise<Object>} 创建的历史记录
   */
  static async create(data) {
    const recordId = uuidv4();
    const timestamp = new Date().toISOString();

    const record = {
      id: recordId,
      device_id: data.deviceId,
      data: JSON.stringify(data.data),
      timestamp: data.timestamp || timestamp,
      created_at: timestamp
    };

    const db = await dbPromise;
    await db('device_history').insert(record);
    return record;
  }

  /**
   * 查询设备历史数据
   * @param {string} deviceId - 设备ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 历史数据列表
   */
  static async findByDeviceId(deviceId, options = {}) {
    const db = await dbPromise;
    let query = db('device_history').where({ device_id: deviceId }).orderBy('timestamp', 'desc');

    // 时间范围过滤
    if (options.startTime) {
      query = query.where('timestamp', '>=', options.startTime);
    }
    if (options.endTime) {
      query = query.where('timestamp', '<=', options.endTime);
    }

    // 分页
    if (options.limit) {
      query = query.limit(options.limit);
      if (options.offset) {
        query = query.offset(options.offset);
      }
    }

    const records = await query;
    return records.map((record) => ({
      ...record,
      data: JSON.parse(record.data)
    }));
  }

  /**
   * 获取设备历史数据统计
   * @param {string} deviceId - 设备ID
   * @param {string} interval - 时间间隔 (hour, day, week, month)
   * @returns {Promise<Array>} 统计数据
   */
  static async getStatistics(deviceId, interval = 'hour') {
    let groupBy = "strftime('%Y-%m-%d %H:00:00', timestamp)"; // 默认按小时

    switch (interval) {
      case 'day':
        groupBy = "strftime('%Y-%m-%d', timestamp)";
        break;
      case 'week':
        groupBy = "strftime('%Y-%W', timestamp)";
        break;
      case 'month':
        groupBy = "strftime('%Y-%m', timestamp)";
        break;
    }

    const db = await dbPromise;
    return db.raw(
      `
      SELECT
        ${groupBy} as time,
        COUNT(*) as record_count,
        MIN(json_extract(data, '$.value')) as min_value,
        MAX(json_extract(data, '$.value')) as max_value,
        AVG(json_extract(data, '$.value')) as avg_value
      FROM device_history
      WHERE device_id = ?
      GROUP BY time
      ORDER BY time DESC
    `,
      [deviceId]
    );
  }

  /**
   * 删除设备历史数据
   * @param {string} deviceId - 设备ID
   * @param {string} olderThan - 删除早于该时间的记录
   * @returns {Promise<number>} 删除的记录数
   */
  static async deleteOldRecords(deviceId, olderThan) {
    const db = await dbPromise;
    return db('device_history')
      .where({ device_id: deviceId })
      .andWhere('timestamp', '<', olderThan)
      .del();
  }
}

module.exports = DeviceHistory;
