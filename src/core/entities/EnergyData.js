import db from '../../infrastructure/database/index.js';
import logger from '../../shared/utils/logger.js';

/**
 * 能源数据实体类
 * 处理能源数据相关的数据操作
 */
class EnergyData {
  constructor(data) {
    this.id = data.id;
    this.deviceId = data.deviceId;
    this.deviceType = data.deviceType;
    this.energyType = data.energyType; // 'electricity', 'gas', 'water', 'steam', 'heat'
    this.consumption = data.consumption; // 消耗量
    this.production = data.production; // 生产量
    this.unit = data.unit; // 单位 (kWh, m³, kg, etc.)
    this.cost = data.cost; // 成本
    this.currency = data.currency || 'CNY';
    this.efficiency = data.efficiency; // 效率
    this.powerFactor = data.powerFactor; // 功率因数
    this.voltage = data.voltage; // 电压
    this.current = data.current; // 电流
    this.frequency = data.frequency; // 频率
    this.temperature = data.temperature; // 温度
    this.pressure = data.pressure; // 压力
    this.flowRate = data.flowRate; // 流量
    this.quality = data.quality; // 质量指标
    this.timestamp = data.timestamp;
    this.period = data.period; // 统计周期
    this.source = data.source; // 数据源
    this.verified = data.verified || false;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * 根据ID查找能源数据记录
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM energy_data WHERE id = ? LIMIT 1';
      const result = await db.get(query, [id]);
      return result ? new EnergyData(result) : null;
    } catch (error) {
      logger.error('根据ID查找能源数据记录失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 根据设备ID查找能源数据记录
   */
  static async findByDeviceId(deviceId, options = {}) {
    try {
      const { limit = 100, offset = 0, startTime, endTime, energyType } = options;
      let query = 'SELECT * FROM energy_data WHERE deviceId = ?';
      const params = [deviceId];
      
      if (energyType) {
        query += ' AND energyType = ?';
        params.push(energyType);
      }
      
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
      return results.map(row => new EnergyData(row));
    } catch (error) {
      logger.error('根据设备ID查找能源数据记录失败', { error: error.message, deviceId, options });
      throw error;
    }
  }

  /**
   * 创建新的能源数据记录
   */
  static async create(energyData) {
    try {
      const query = `
        INSERT INTO energy_data (
          deviceId, deviceType, energyType, consumption, production, unit, cost, currency,
          efficiency, powerFactor, voltage, current, frequency, temperature, pressure,
          flowRate, quality, timestamp, period, source, verified, metadata,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const metadata = JSON.stringify(energyData.metadata || {});
      
      const result = await db.run(query, [
        energyData.deviceId,
        energyData.deviceType,
        energyData.energyType,
        energyData.consumption,
        energyData.production,
        energyData.unit,
        energyData.cost,
        energyData.currency || 'CNY',
        energyData.efficiency,
        energyData.powerFactor,
        energyData.voltage,
        energyData.current,
        energyData.frequency,
        energyData.temperature,
        energyData.pressure,
        energyData.flowRate,
        energyData.quality,
        energyData.timestamp,
        energyData.period,
        energyData.source,
        energyData.verified || false,
        metadata,
        now,
        now
      ]);

      const newEnergyData = await EnergyData.findById(result.lastID);
      logger.info('能源数据记录创建成功', { energyDataId: result.lastID, deviceId: energyData.deviceId });
      return newEnergyData;
    } catch (error) {
      logger.error('创建能源数据记录失败', { error: error.message, energyData });
      throw error;
    }
  }

  /**
   * 更新能源数据记录
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          if (key === 'metadata') {
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
      
      const query = `UPDATE energy_data SET ${fields.join(', ')} WHERE id = ?`;
      await db.run(query, values);
      
      const updatedEnergyData = await EnergyData.findById(id);
      logger.info('能源数据记录更新成功', { energyDataId: id, updateData });
      return updatedEnergyData;
    } catch (error) {
      logger.error('更新能源数据记录失败', { error: error.message, id, updateData });
      throw error;
    }
  }

  /**
   * 删除能源数据记录
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM energy_data WHERE id = ?';
      const result = await db.run(query, [id]);
      logger.info('能源数据记录删除成功', { energyDataId: id });
      return result.changes > 0;
    } catch (error) {
      logger.error('删除能源数据记录失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 获取能源消耗统计数据
   */
  static async getConsumptionStatistics(options = {}) {
    try {
      const { deviceId, deviceType, energyType, startTime, endTime, groupBy = 'day' } = options;
      
      let query = `
        SELECT 
          COUNT(*) as count,
          SUM(consumption) as totalConsumption,
          SUM(production) as totalProduction,
          AVG(consumption) as avgConsumption,
          AVG(production) as avgProduction,
          SUM(cost) as totalCost
      `;
      
      if (groupBy === 'day') {
        query += `, DATE(timestamp) as period`;
      } else if (groupBy === 'month') {
        query += `, strftime('%Y-%m', timestamp) as period`;
      } else if (groupBy === 'year') {
        query += `, strftime('%Y', timestamp) as period`;
      } else if (groupBy === 'hour') {
        query += `, strftime('%Y-%m-%d %H', timestamp) as period`;
      }
      
      query += ' FROM energy_data WHERE 1=1';
      const params = [];
      
      if (deviceId) {
        query += ' AND deviceId = ?';
        params.push(deviceId);
      }
      
      if (deviceType) {
        query += ' AND deviceType = ?';
        params.push(deviceType);
      }
      
      if (energyType) {
        query += ' AND energyType = ?';
        params.push(energyType);
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
      logger.error('获取能源消耗统计数据失败', { error: error.message, options });
      throw error;
    }
  }

  /**
   * 获取能源效率分析数据
   */
  static async getEfficiencyAnalysis(options = {}) {
    try {
      const { deviceId, deviceType, startTime, endTime } = options;
      
      let query = `
        SELECT 
          deviceId,
          deviceType,
          energyType,
          AVG(efficiency) as avgEfficiency,
          MIN(efficiency) as minEfficiency,
          MAX(efficiency) as maxEfficiency,
          AVG(powerFactor) as avgPowerFactor,
          COUNT(*) as recordCount
        FROM energy_data
        WHERE efficiency IS NOT NULL
      `;
      
      const params = [];
      
      if (deviceId) {
        query += ' AND deviceId = ?';
        params.push(deviceId);
      }
      
      if (deviceType) {
        query += ' AND deviceType = ?';
        params.push(deviceType);
      }
      
      if (startTime) {
        query += ' AND timestamp >= ?';
        params.push(startTime);
      }
      
      if (endTime) {
        query += ' AND timestamp <= ?';
        params.push(endTime);
      }
      
      query += ' GROUP BY deviceId, deviceType, energyType ORDER BY avgEfficiency DESC';
      
      const results = await db.all(query, params);
      return results;
    } catch (error) {
      logger.error('获取能源效率分析数据失败', { error: error.message, options });
      throw error;
    }
  }

  /**
   * 获取能源趋势数据
   */
  static async getTrends(options = {}) {
    try {
      const { deviceId, energyType, period = '30d', interval = 'day' } = options;
      
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
          SUM(consumption) as totalConsumption,
          SUM(production) as totalProduction,
          SUM(cost) as totalCost,
          AVG(efficiency) as avgEfficiency,
          COUNT(*) as recordCount
        FROM energy_data
        WHERE ${timeCondition}
      `;
      
      const params = [];
      
      if (deviceId) {
        query += ' AND deviceId = ?';
        params.push(deviceId);
      }
      
      if (energyType) {
        query += ' AND energyType = ?';
        params.push(energyType);
      }
      
      query += ` GROUP BY ${groupByClause} ORDER BY period`;
      
      const results = await db.all(query, params);
      return results;
    } catch (error) {
      logger.error('获取能源趋势数据失败', { error: error.message, options });
      throw error;
    }
  }

  /**
   * 批量创建能源数据记录
   */
  static async createBatch(energyDataArray) {
    try {
      const query = `
        INSERT INTO energy_data (
          deviceId, deviceType, energyType, consumption, production, unit, cost, currency,
          efficiency, powerFactor, voltage, current, frequency, temperature, pressure,
          flowRate, quality, timestamp, period, source, verified, metadata,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const results = [];
      
      for (const energyData of energyDataArray) {
        const metadata = JSON.stringify(energyData.metadata || {});
        
        const result = await db.run(query, [
          energyData.deviceId,
          energyData.deviceType,
          energyData.energyType,
          energyData.consumption,
          energyData.production,
          energyData.unit,
          energyData.cost,
          energyData.currency || 'CNY',
          energyData.efficiency,
          energyData.powerFactor,
          energyData.voltage,
          energyData.current,
          energyData.frequency,
          energyData.temperature,
          energyData.pressure,
          energyData.flowRate,
          energyData.quality,
          energyData.timestamp,
          energyData.period,
          energyData.source,
          energyData.verified || false,
          metadata,
          now,
          now
        ]);
        
        results.push(result.lastID);
      }
      
      logger.info('批量创建能源数据记录成功', { count: results.length });
      return results;
    } catch (error) {
      logger.error('批量创建能源数据记录失败', { error: error.message, count: energyDataArray.length });
      throw error;
    }
  }

  /**
   * 获取实时能源数据
   */
  static async getRealTimeData(deviceIds = []) {
    try {
      let query = `
        SELECT * FROM energy_data 
        WHERE timestamp >= datetime('now', '-1 hour')
      `;
      
      const params = [];
      
      if (deviceIds.length > 0) {
        const placeholders = deviceIds.map(() => '?').join(',');
        query += ` AND deviceId IN (${placeholders})`;
        params.push(...deviceIds);
      }
      
      query += ' ORDER BY timestamp DESC';
      
      const results = await db.all(query, params);
      return results.map(row => new EnergyData(row));
    } catch (error) {
      logger.error('获取实时能源数据失败', { error: error.message, deviceIds });
      throw error;
    }
  }
}

export default EnergyData;