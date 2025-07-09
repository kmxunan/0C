import db from '../../infrastructure/database/index.js';
import logger from '../../shared/utils/logger.js';

/**
 * 碳排放实体类
 * 处理碳排放相关的数据操作
 */
class CarbonEmission {
  constructor(data) {
    this.id = data.id;
    this.deviceId = data.deviceId;
    this.deviceType = data.deviceType;
    this.emissionType = data.emissionType; // 'direct', 'indirect', 'other'
    this.scope = data.scope; // 1, 2, 3
    this.amount = data.amount; // 碳排放量 (kg CO2)
    this.unit = data.unit || 'kg CO2';
    this.source = data.source; // 排放源
    this.calculationMethod = data.calculationMethod;
    this.factors = data.factors; // 计算因子
    this.timestamp = data.timestamp;
    this.period = data.period; // 统计周期
    this.verified = data.verified || false;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * 根据ID查找碳排放记录
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM carbon_emissions WHERE id = ? LIMIT 1';
      const result = await db.get(query, [id]);
      return result ? new CarbonEmission(result) : null;
    } catch (error) {
      logger.error('根据ID查找碳排放记录失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 根据设备ID查找碳排放记录
   */
  static async findByDeviceId(deviceId, options = {}) {
    try {
      const { limit = 100, offset = 0, startTime, endTime } = options;
      let query = 'SELECT * FROM carbon_emissions WHERE deviceId = ?';
      const params = [deviceId];
      
      if (startTime) {
        query += ' AND timestamp >= ?';
        params.push(startTime);
      }
      
      if (endTime) {
        query += ' AND timestamp <= ?';
        params.push(endTime);
      }
      
      query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const results = await db.all(query, params);
      return results.map(row => new CarbonEmission(row));
    } catch (error) {
      logger.error('根据设备ID查找碳排放记录失败', { error: error.message, deviceId, options });
      throw error;
    }
  }

  /**
   * 创建新的碳排放记录
   */
  static async create(emissionData) {
    try {
      const query = `
        INSERT INTO carbon_emissions (
          deviceId, deviceType, emissionType, scope, amount, unit, source,
          calculationMethod, factors, timestamp, period, verified, metadata,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const factors = JSON.stringify(emissionData.factors || {});
      const metadata = JSON.stringify(emissionData.metadata || {});
      
      const result = await db.run(query, [
        emissionData.deviceId,
        emissionData.deviceType,
        emissionData.emissionType,
        emissionData.scope,
        emissionData.amount,
        emissionData.unit || 'kg CO2',
        emissionData.source,
        emissionData.calculationMethod,
        factors,
        emissionData.timestamp,
        emissionData.period,
        emissionData.verified || false,
        metadata,
        now,
        now
      ]);

      const newEmission = await CarbonEmission.findById(result.lastID);
      logger.info('碳排放记录创建成功', { emissionId: result.lastID, deviceId: emissionData.deviceId });
      return newEmission;
    } catch (error) {
      logger.error('创建碳排放记录失败', { error: error.message, emissionData });
      throw error;
    }
  }

  /**
   * 更新碳排放记录
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          if (key === 'factors' || key === 'metadata') {
            values.push(JSON.stringify(updateData[key]));
          } else {
            values.push(updateData[key]);
          }
        }
      });
      
      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }
      
      fields.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      const query = `UPDATE carbon_emissions SET ${fields.join(', ')} WHERE id = ?`;
      await db.run(query, values);
      
      const updatedEmission = await CarbonEmission.findById(id);
      logger.info('碳排放记录更新成功', { emissionId: id, updateData });
      return updatedEmission;
    } catch (error) {
      logger.error('更新碳排放记录失败', { error: error.message, id, updateData });
      throw error;
    }
  }

  /**
   * 删除碳排放记录
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM carbon_emissions WHERE id = ?';
      const result = await db.run(query, [id]);
      logger.info('碳排放记录删除成功', { emissionId: id });
      return result.changes > 0;
    } catch (error) {
      logger.error('删除碳排放记录失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 获取碳排放统计数据
   */
  static async getStatistics(options = {}) {
    try {
      const { deviceId, deviceType, scope, startTime, endTime, groupBy = 'day' } = options;
      
      let query = `
        SELECT 
          COUNT(*) as count,
          SUM(amount) as totalEmissions,
          AVG(amount) as avgEmissions,
          MIN(amount) as minEmissions,
          MAX(amount) as maxEmissions
      `;
      
      if (groupBy === 'day') {
        query += `, DATE(timestamp) as period`;
      } else if (groupBy === 'month') {
        query += `, strftime('%Y-%m', timestamp) as period`;
      } else if (groupBy === 'year') {
        query += `, strftime('%Y', timestamp) as period`;
      }
      
      query += ' FROM carbon_emissions WHERE 1=1';
      const params = [];
      
      if (deviceId) {
        query += ' AND deviceId = ?';
        params.push(deviceId);
      }
      
      if (deviceType) {
        query += ' AND deviceType = ?';
        params.push(deviceType);
      }
      
      if (scope) {
        query += ' AND scope = ?';
        params.push(scope);
      }
      
      if (startTime) {
        query += ' AND timestamp >= ?';
        params.push(startTime);
      }
      
      if (endTime) {
        query += ' AND timestamp <= ?';
        params.push(endTime);
      }
      
      if (groupBy !== 'total') {
        query += ' GROUP BY period ORDER BY period';
      }
      
      const results = await db.all(query, params);
      return results;
    } catch (error) {
      logger.error('获取碳排放统计数据失败', { error: error.message, options });
      throw error;
    }
  }

  /**
   * 获取碳排放趋势数据
   */
  static async getTrends(options = {}) {
    try {
      const { deviceId, period = '30d', interval = 'day' } = options;
      
      let timeCondition = '';
      if (period === '7d') {
        timeCondition = "timestamp >= datetime('now', '-7 days')";
      } else if (period === '30d') {
        timeCondition = "timestamp >= datetime('now', '-30 days')";
      } else if (period === '90d') {
        timeCondition = "timestamp >= datetime('now', '-90 days')";
      } else if (period === '1y') {
        timeCondition = "timestamp >= datetime('now', '-1 year')";
      }
      
      let groupByClause = '';
      if (interval === 'hour') {
        groupByClause = "strftime('%Y-%m-%d %H', timestamp)";
      } else if (interval === 'day') {
        groupByClause = "DATE(timestamp)";
      } else if (interval === 'week') {
        groupByClause = "strftime('%Y-%W', timestamp)";
      } else if (interval === 'month') {
        groupByClause = "strftime('%Y-%m', timestamp)";
      }
      
      let query = `
        SELECT 
          ${groupByClause} as period,
          SUM(amount) as totalEmissions,
          COUNT(*) as recordCount,
          AVG(amount) as avgEmissions
        FROM carbon_emissions
        WHERE ${timeCondition}
      `;
      
      const params = [];
      
      if (deviceId) {
        query += ' AND deviceId = ?';
        params.push(deviceId);
      }
      
      query += ` GROUP BY ${groupByClause} ORDER BY period`;
      
      const results = await db.all(query, params);
      return results;
    } catch (error) {
      logger.error('获取碳排放趋势数据失败', { error: error.message, options });
      throw error;
    }
  }

  /**
   * 批量创建碳排放记录
   */
  static async createBatch(emissionsData) {
    try {
      const query = `
        INSERT INTO carbon_emissions (
          deviceId, deviceType, emissionType, scope, amount, unit, source,
          calculationMethod, factors, timestamp, period, verified, metadata,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const results = [];
      
      for (const emissionData of emissionsData) {
        const factors = JSON.stringify(emissionData.factors || {});
        const metadata = JSON.stringify(emissionData.metadata || {});
        
        const result = await db.run(query, [
          emissionData.deviceId,
          emissionData.deviceType,
          emissionData.emissionType,
          emissionData.scope,
          emissionData.amount,
          emissionData.unit || 'kg CO2',
          emissionData.source,
          emissionData.calculationMethod,
          factors,
          emissionData.timestamp,
          emissionData.period,
          emissionData.verified || false,
          metadata,
          now,
          now
        ]);
        
        results.push(result.lastID);
      }
      
      logger.info('批量创建碳排放记录成功', { count: results.length });
      return results;
    } catch (error) {
      logger.error('批量创建碳排放记录失败', { error: error.message, count: emissionsData.length });
      throw error;
    }
  }
}

export default CarbonEmission;