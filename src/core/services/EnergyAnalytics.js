
// 🚨 安全警告: 此文件包含SQL查询，请确保使用参数化查询防止SQL注入
// 示例: db.query('SELECT * FROM users WHERE id = ?', [userId])
// 避免: db.query('SELECT * FROM users WHERE id = ' + userId)
import { dbPromise } from '../../infrastructure/database/index.js';
import { v4 as uuidv4 } from 'uuid';
import { defaultLogger as logger } from '../../utils/logger.js';
import { MATH_CONSTANTS, TIME_INTERVALS, PREVIOUS_TIME_RANGES } from '../../shared/constants/MathConstants.js';
// 常量定义
const EFFICIENCY_THRESHOLDS = {
  EXCELLENT: MATH_CONSTANTS.NINETY,
  GOOD: MATH_CONSTANTS.EIGHTY,
  AVERAGE: MATH_CONSTANTS.SEVENTY,
  POOR: MATH_CONSTANTS.SIXTY,
  VERY_POOR: MATH_CONSTANTS.FIFTY
};

const ANOMALY_THRESHOLDS = {
  STANDARD_DEVIATIONS: MATH_CONSTANTS.THREE,
  CHANGE_THRESHOLD: 0.05
};

const TIME_CONDITIONS = {
  ONE_HOUR: '-1 hour',
  SIX_HOURS: '-6 hours',
  ONE_DAY: '-1 day',
  TWO_DAYS: '-2 days',
  SEVEN_DAYS: '-7 days',
  THIRTY_DAYS: '-30 days',
  NINETY_DAYS: '-90 days',
  ONE_YEAR: '-1 year'
};

/**
 * 能源分析模块
 * 提供能源数据的统计分析、趋势计算和报告生成功能
 */
class EnergyAnalytics {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = TIME_INTERVALS.FIVE_MINUTES_MS; // 5分钟缓存
  }

  /**
   * 获取设备能源消耗统计
   */
  async getDeviceEnergyStats(deviceId, timeRange = '24h') {
    try {
      const cacheKey = `device_stats_${deviceId}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {return cached;}

      const timeCondition = this.getTimeCondition(timeRange);

      const sql = `
        SELECT 
          data_type,
          COUNT(*) as data_points,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          SUM(value) as total_value,
          unit,
          MIN(timestamp) as start_time,
          MAX(timestamp) as end_time
        FROM energy_data 
        WHERE device_id = ? AND timestamp >= datetime('now', ?)
        GROUP BY data_type, unit
        ORDER BY data_type
      `;

      const stats = await this.queryDatabase(sql, [deviceId, timeCondition]);

      // 计算额外的统计指标
      const enrichedStats = await Promise.all(
        stats.map(async stat => {
          const variance = await this.calculateVariance(deviceId, stat.data_type, timeRange);
          const trend = await this.calculateTrend(deviceId, stat.data_type, timeRange);

          return {
            ...stat,
            variance,
            std_deviation: Math.sqrt(variance),
            trend_direction: trend.direction,
            trend_rate: trend.rate,
            efficiency_score: this.calculateEfficiencyScore(stat)
          };
        })
      );

      this.setCache(cacheKey, enrichedStats);
      return enrichedStats;
    } catch (error) {
      logger.error('获取设备能源统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取园区整体能源消耗趋势
   */
  async getParkEnergyTrend(parkId, timeRange = '7d', interval = 'hour') {
    try {
      const cacheKey = `park_trend_${parkId}_${timeRange}_${interval}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {return cached;}

      const timeCondition = this.getTimeCondition(timeRange);
      const groupBy = this.getGroupByInterval(interval);

      const sql = `
        SELECT 
          ${groupBy} as time_period,
          ed.data_type,
          SUM(ed.value) as total_consumption,
          AVG(ed.value) as avg_consumption,
          COUNT(DISTINCT ed.device_id) as active_devices,
          ed.unit
        FROM energy_data ed
        JOIN devices d ON ed.device_id = d.id
        JOIN buildings b ON d.building_id = b.id
        WHERE b.park_id = ? AND ed.timestamp >= datetime('now', ?)
        GROUP BY time_period, ed.data_type, ed.unit
        ORDER BY time_period, ed.data_type
      `;

      const trendData = await this.queryDatabase(sql, [parkId, timeCondition]);

      // 按数据类型分组
      const groupedData = this.groupByDataType(trendData);

      // 计算趋势指标
      const trendsWithMetrics = {};
      for (const [dataType, data] of Object.entries(groupedData)) {
        trendsWithMetrics[dataType] = {
          data,
          metrics: this.calculateTrendMetrics(data)
        };
      }

      this.setCache(cacheKey, trendsWithMetrics);
      return trendsWithMetrics;
    } catch (error) {
      logger.error('获取园区能源趋势失败:', error);
      throw error;
    }
  }

  /**
   * 生成能源消耗报告
   */
  async generateEnergyReport(params) {
    try {
      const {
        scope, // 'device', 'building', 'park'
        scopeId,
        timeRange = '30d',
        includeComparison = true,
        includeForecasting = false
      } = params;

      const report = {
        id: uuidv4(),
        scope,
        scope_id: scopeId,
        time_range: timeRange,
        generated_at: new Date().toISOString(),
        summary: {},
        details: {},
        recommendations: []
      };

      // 获取基础统计数据
      switch (scope) {
        case 'device':
          report.summary = await this.getDeviceEnergyStats(scopeId, timeRange);
          break;
        case 'building':
          report.summary = await this.getBuildingEnergyStats(scopeId, timeRange);
          break;
        case 'park':
          report.summary = await this.getParkEnergyStats(scopeId, timeRange);
          break;
      }

      // 添加对比分析
      if (includeComparison) {
        report.comparison = await this.getComparisonData(scope, scopeId, timeRange);
      }

      // 添加预测分析
      if (includeForecasting) {
        report.forecast = await this.generateForecast(scope, scopeId);
      }

      // 生成建议
      report.recommendations = await this.generateRecommendations(report.summary);

      // 保存报告
      await this.saveReport(report);

      return report;
    } catch (error) {
      logger.error('生成能源报告失败:', error);
      throw error;
    }
  }

  /**
   * 计算能源效率评分
   */
  async calculateEnergyEfficiency(scopeId, scope = 'building') {
    try {
      const baselineData = await this.getBaselineConsumption(scopeId, scope);
      const currentData = await this.getCurrentConsumption(scopeId, scope);

      if (!baselineData || !currentData) {
        return { score: null, message: '数据不足，无法计算效率评分' };
      }

      // 计算效率评分 (0-100)
      const efficiency = (baselineData.total - currentData.total) / baselineData.total;
      const score = Math.max(MATH_CONSTANTS.ZERO, Math.min(MATH_CONSTANTS.ONE_HUNDRED, MATH_CONSTANTS.FIFTY + efficiency * MATH_CONSTANTS.FIFTY));

      const result = {
        score: Math.round(score),
        baseline_consumption: baselineData.total,
        current_consumption: currentData.total,
        improvement: efficiency,
        rating: this.getEfficiencyRating(score)
      };

      return result;
    } catch (error) {
      logger.error('计算能源效率失败:', error);
      throw error;
    }
  }

  /**
   * 检测能源消耗异常
   */
  async detectEnergyAnomalies(deviceId, timeRange = '7d') {
    try {
      const sql = `
        SELECT 
          id,
          device_id,
          data_type,
          value,
          unit,
          timestamp,
          is_anomaly,
          anomaly_reason
        FROM energy_data 
        WHERE device_id = ? 
          AND timestamp >= datetime('now', ?)
          AND (is_anomaly = 1 OR value > (
            SELECT AVG(value) + 3 * (
              SELECT SQRT(AVG((value - sub.avg_val) * (value - sub.avg_val)))
              FROM (
                SELECT AVG(value) as avg_val 
                FROM energy_data 
                WHERE device_id = ? AND data_type = energy_data.data_type
              ) sub
            )
            FROM energy_data 
            WHERE device_id = ? AND data_type = energy_data.data_type
          ))
        ORDER BY timestamp DESC
      `;

      const timeCondition = this.getTimeCondition(timeRange);
      const anomalies = await this.queryDatabase(sql, [
        deviceId,
        timeCondition,
        deviceId,
        deviceId
      ]);

      // 分析异常模式
      const patterns = this.analyzeAnomalyPatterns(anomalies);

      return {
        anomalies,
        patterns,
        summary: {
          total_anomalies: anomalies.length,
          anomaly_rate: anomalies.length / (await this.getTotalDataPoints(deviceId, timeRange)),
          most_common_type: patterns.mostCommonType,
          severity_distribution: patterns.severityDistribution
        }
      };
    } catch (error) {
      logger.error('检测能源异常失败:', error);
      throw error;
    }
  }

  /**
   * 获取能源成本分析
   */
  async getEnergyCostAnalysis(scopeId, scope = 'building', timeRange = '30d') {
    try {
      // 获取能源消耗数据
      const consumptionData = await this.getEnergyConsumption(scopeId, scope, timeRange);

      // 获取能源价格配置
      const energyPrices = await this.getEnergyPrices();

      // 计算成本
      const costAnalysis = {
        total_cost: 0,
        cost_breakdown: {},
        cost_trends: [],
        savings_opportunities: []
      };

      for (const [energyType, consumption] of Object.entries(consumptionData)) {
        const price = energyPrices[energyType] || 0;
        const cost = consumption.total * price;

        costAnalysis.total_cost += cost;
        costAnalysis.cost_breakdown[energyType] = {
          consumption: consumption.total,
          unit_price: price,
          total_cost: cost,
          percentage: 0 // 将在后面计算
        };
      }

      // 计算百分比
      for (const energyType of Object.keys(costAnalysis.cost_breakdown)) {
        costAnalysis.cost_breakdown[energyType].percentage =
          (costAnalysis.cost_breakdown[energyType].total_cost / costAnalysis.total_cost) * MATH_CONSTANTS.ONE_HUNDRED;
      }

      // 识别节约机会
      costAnalysis.savings_opportunities = await this.identifySavingsOpportunities(
        consumptionData,
        energyPrices
      );

      return costAnalysis;
    } catch (error) {
      logger.error('获取能源成本分析失败:', error);
      throw error;
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取时间条件
   */
  getTimeCondition(timeRange) {
    const conditions = {
      '1h': TIME_CONDITIONS.ONE_HOUR,
      '6h': TIME_CONDITIONS.SIX_HOURS,
      '24h': TIME_CONDITIONS.ONE_DAY,
      '7d': TIME_CONDITIONS.SEVEN_DAYS,
      '30d': TIME_CONDITIONS.THIRTY_DAYS,
      '90d': TIME_CONDITIONS.NINETY_DAYS,
      '1y': TIME_CONDITIONS.ONE_YEAR
    };
    return conditions[timeRange] || TIME_CONDITIONS.ONE_DAY;
  }

  /**
   * 获取分组间隔
   */
  getGroupByInterval(interval) {
    const intervals = {
      minute: "strftime('%Y-%m-%d %H:%M', timestamp)",
      hour: "strftime('%Y-%m-%d %H:00', timestamp)",
      day: "strftime('%Y-%m-%d', timestamp)",
      week: "strftime('%Y-W%W', timestamp)",
      month: "strftime('%Y-%m', timestamp)"
    };
    return intervals[interval] || intervals.hour;
  }

  /**
   * 按数据类型分组
   */
  groupByDataType(data) {
    return data.reduce((groups, item) => {
      const key = `${item.data_type}_${item.unit}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * 计算趋势指标
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  calculateTrendMetrics(data) {
    if (!(data.length < 2)) {
      return { direction: 'stable', rate: 0, correlation: 0 };
    }

    const values = data.map(d => d.total_consumption);
    const n = values.length;

    // 计算线性回归斜率
    const sumX = (n * (n - MATH_CONSTANTS.ONE)) / MATH_CONSTANTS.TWO;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumX2 = (n * (n - MATH_CONSTANTS.ONE) * (MATH_CONSTANTS.TWO * n - MATH_CONSTANTS.ONE)) / MATH_CONSTANTS.SIX;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return {
      direction: slope > MATH_CONSTANTS.TEN_PERCENT ? 'increasing' : slope < -MATH_CONSTANTS.TEN_PERCENT ? 'decreasing' : 'stable',
      rate: Math.abs(slope),
      correlation: this.calculateCorrelation(values)
    };
  }

  /**
   * 计算相关系数
   */
  calculateCorrelation(values) {
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    const meanX = (n - MATH_CONSTANTS.ONE) / MATH_CONSTANTS.TWO;
    const meanY = values.reduce((sum, val) => sum + val, 0) / n;

    const numerator = indices.reduce((sum, x, i) => sum + (x - meanX) * (values[i] - meanY), 0);

    const denomX = Math.sqrt(indices.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0));
    const denomY = Math.sqrt(values.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0));

    return denomX * denomY === MATH_CONSTANTS.ZERO ? MATH_CONSTANTS.ZERO : numerator / (denomX * denomY);
  }

  /**
   * 计算方差
   */
  async calculateVariance(deviceId, dataType, timeRange) {
    const sql = `
      SELECT AVG(value) as mean, COUNT(*) as count
      FROM energy_data 
      WHERE device_id = ? AND data_type = ? AND timestamp >= datetime('now', ?)
    `;

    const timeCondition = this.getTimeCondition(timeRange);
    const result = await this.queryDatabase(sql, [deviceId, dataType, timeCondition]);

    const [firstResult] = result;
    if (!firstResult || firstResult.count === 0) {return 0;}

    const { mean } = firstResult;

    const varianceSql = `
      SELECT AVG((value - ?) * (value - ?)) as variance
      FROM energy_data 
      WHERE device_id = ? AND data_type = ? AND timestamp >= datetime('now', ?)
    `;

    const varianceResult = await this.queryDatabase(varianceSql, [
      mean,
      mean,
      deviceId,
      dataType,
      timeCondition
    ]);
    return varianceResult[0]?.variance || 0;
  }

  /**
   * 计算趋势
   */
  async calculateTrend(deviceId, dataType, timeRange) {
    const sql = `
      SELECT value, timestamp
      FROM energy_data 
      WHERE device_id = ? AND data_type = ? AND timestamp >= datetime('now', ?)
      ORDER BY timestamp
    `;

    const timeCondition = this.getTimeCondition(timeRange);
    const data = await this.queryDatabase(sql, [deviceId, dataType, timeCondition]);

    if (data.length < 2) {
      return { direction: 'stable', rate: 0 };
    }

    const [firstItem] = data;
    const lastItem = data[data.length - 1];
    const firstValue = firstItem.value;
    const lastValue = lastItem.value;
    const change = (lastValue - firstValue) / firstValue;

    return {
      direction: change > ANOMALY_THRESHOLDS.CHANGE_THRESHOLD ? 'increasing' : change < -ANOMALY_THRESHOLDS.CHANGE_THRESHOLD ? 'decreasing' : 'stable',
      rate: Math.abs(change)
    };
  }

  /**
   * 计算效率评分
   */
  calculateEfficiencyScore(stat) {
    // 基于数据质量、变异系数等计算效率评分
    const cv = stat.avg_value > 0 ? Math.sqrt(stat.variance || 0) / stat.avg_value : 0;
    const score = Math.max(MATH_CONSTANTS.ZERO, Math.min(MATH_CONSTANTS.ONE_HUNDRED, MATH_CONSTANTS.ONE_HUNDRED - cv * MATH_CONSTANTS.ONE_HUNDRED));
    return Math.round(score);
  }

  /**
   * 获取效率等级
   */
  getEfficiencyRating(score) {
    if (score >= EFFICIENCY_THRESHOLDS.EXCELLENT) {return 'A+';}
    if (score >= EFFICIENCY_THRESHOLDS.GOOD) {return 'A';}
    if (score >= EFFICIENCY_THRESHOLDS.AVERAGE) {return 'B';}
    if (score >= EFFICIENCY_THRESHOLDS.POOR) {return 'C';}
    if (score >= EFFICIENCY_THRESHOLDS.VERY_POOR) {return 'D';}
    return 'F';
  }

  /**
   * 缓存管理
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 数据库查询封装
   */
  queryDatabase(sql, params = []) {
    return new Promise((resolve, reject) => {
      dbPromise
        .then(db => {
          db.raw(sql, params).then(rows => {
            resolve(rows || []);
          }).catch(err => {
            reject(err);
          });
        })
        .catch(reject);
    });
  }

  /**
   * 获取建筑能源统计
   */
  async getBuildingEnergyStats(buildingId, timeRange = '24h') {
    try {
      const cacheKey = `building_stats_${buildingId}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {return cached;}

      const timeCondition = this.getTimeCondition(timeRange);

      const sql = `
        SELECT 
          ed.data_type,
          COUNT(*) as data_points,
          AVG(ed.value) as avg_value,
          MIN(ed.value) as min_value,
          MAX(ed.value) as max_value,
          SUM(ed.value) as total_value,
          ed.unit,
          COUNT(DISTINCT ed.device_id) as device_count
        FROM energy_data ed
        JOIN devices d ON ed.device_id = d.id
        WHERE d.building_id = ? AND ed.timestamp >= datetime('now', ?)
        GROUP BY ed.data_type, ed.unit
        ORDER BY ed.data_type
      `;

      const stats = await this.queryDatabase(sql, [buildingId, timeCondition]);
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      logger.error('获取建筑能源统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取园区能源统计
   */
  async getParkEnergyStats(parkId, timeRange = '24h') {
    try {
      const cacheKey = `park_stats_${parkId}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {return cached;}

      const timeCondition = this.getTimeCondition(timeRange);

      const sql = `
        SELECT 
          ed.data_type,
          COUNT(*) as data_points,
          AVG(ed.value) as avg_value,
          MIN(ed.value) as min_value,
          MAX(ed.value) as max_value,
          SUM(ed.value) as total_value,
          ed.unit,
          COUNT(DISTINCT ed.device_id) as device_count,
          COUNT(DISTINCT d.building_id) as building_count
        FROM energy_data ed
        JOIN devices d ON ed.device_id = d.id
        JOIN buildings b ON d.building_id = b.id
        WHERE b.park_id = ? AND ed.timestamp >= datetime('now', ?)
        GROUP BY ed.data_type, ed.unit
        ORDER BY ed.data_type
      `;

      const stats = await this.queryDatabase(sql, [parkId, timeCondition]);
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      logger.error('获取园区能源统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取对比数据
   */
  async getComparisonData(scope, scopeId, timeRange) {
    try {
      // 获取当前周期数据
      const currentData = await this.getEnergyConsumption(scopeId, scope, timeRange);

      // 获取上一个周期数据
      const previousTimeRange = this.getPreviousTimeRange(timeRange);
      const previousData = await this.getEnergyConsumption(
        scopeId,
        scope,
        timeRange,
        previousTimeRange
      );

      // 计算对比指标
      const comparison = {};
      for (const [energyType, current] of Object.entries(currentData)) {
        const previous = previousData[energyType];
        if (previous) {
          const change = (current.total - previous.total) / previous.total;
          comparison[energyType] = {
            current: current.total,
            previous: previous.total,
            change,
            change_percentage: change * MATH_CONSTANTS.ONE_HUNDRED,
            trend: change > ANOMALY_THRESHOLDS.CHANGE_THRESHOLD ? 'increasing' : change < -ANOMALY_THRESHOLDS.CHANGE_THRESHOLD ? 'decreasing' : 'stable'
          };
        } else {
          comparison[energyType] = {
            current: current.total,
            previous: 0,
            change: null,
            change_percentage: null,
            trend: 'new'
          };
        }
      }

      return comparison;
    } catch (error) {
      logger.error('获取对比数据失败:', error);
      throw error;
    }
  }

  /**
   * 生成预测
   */
  async generateForecast(scope, scopeId) {
    try {
      // 获取历史数据用于预测
      const historicalData = await this.getHistoricalData(scopeId, scope, '90d');

      const forecast = {};
      for (const [energyType, data] of Object.entries(historicalData)) {
        if (data.length < MATH_CONSTANTS.SEVEN) {
          forecast[energyType] = {
            message: '数据不足，无法生成预测',
            confidence: 0
          };
          continue;
        }

        // 简单的线性回归预测
        const trend = this.calculateLinearTrend(data);
        const nextPeriodForecast = this.extrapolateTrend(trend, MATH_CONSTANTS.SEVEN); // 预测未来7天

        forecast[energyType] = {
          trend_direction: trend.direction,
          predicted_values: nextPeriodForecast,
          confidence: this.calculateForecastConfidence(data, trend),
          method: 'linear_regression'
        };
      }

      return forecast;
    } catch (error) {
      logger.error('生成预测失败:', error);
      throw error;
    }
  }

  /**
   * 生成建议
   */
  async generateRecommendations(summary) {
    const recommendations = [];

    try {
      for (const stat of summary) {
        // 基于效率评分生成建议
        if (stat.efficiency_score < EFFICIENCY_THRESHOLDS.POOR) {
          recommendations.push({
            type: 'efficiency',
            priority: 'high',
            title: `${stat.data_type}能源效率偏低`,
            description: `当前效率评分为${stat.efficiency_score}分，建议检查设备运行状态和优化配置`,
            potential_savings: this.estimatePotentialSavings(stat)
          });
        }

        // 基于趋势生成建议
        if (stat.trend_direction === 'increasing' && stat.trend_rate > MATH_CONSTANTS.TWENTY_PERCENT) {
          recommendations.push({
            type: 'trend',
            priority: 'medium',
            title: `${stat.data_type}消耗呈上升趋势`,
            description: `消耗量增长率为${(stat.trend_rate * MATH_CONSTANTS.ONE_HUNDRED).toFixed(MATH_CONSTANTS.ONE)}%，建议关注使用模式变化`,
            potential_savings: null
          });
        }

        // 基于变异系数生成建议
        if (stat.std_deviation / stat.avg_value > MATH_CONSTANTS.FIFTY_PERCENT) {
          recommendations.push({
            type: 'stability',
            priority: 'low',
            title: `${stat.data_type}消耗波动较大`,
            description: '能源消耗不稳定，建议检查设备运行规律和负载管理',
            potential_savings: null
          });
        }
      }

      return recommendations;
    } catch (error) {
      logger.error('生成建议失败:', error);
      return [];
    }
  }

  /**
   * 获取能源消耗数据
   */
  async getEnergyConsumption(scopeId, scope, timeRange, customTimeRange = null) {
    try {

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

      const timeCondition = customTimeRange || this.getTimeCondition(timeRange);
      let sql; let params;

      switch (scope) {
        case 'device':
          sql = `
            SELECT data_type, SUM(value) as total, unit
            FROM energy_data 
            WHERE device_id = ? AND timestamp >= datetime('now', ?)
            GROUP BY data_type, unit
          `;
          params = [scopeId, timeCondition];
          break;

        case 'building':
          sql = `
            SELECT ed.data_type, SUM(ed.value) as total, ed.unit
            FROM energy_data ed
            JOIN devices d ON ed.device_id = d.id
            WHERE d.building_id = ? AND ed.timestamp >= datetime('now', ?)
            GROUP BY ed.data_type, ed.unit
          `;
          params = [scopeId, timeCondition];
          break;

        case 'park':
          sql = `
            SELECT ed.data_type, SUM(ed.value) as total, ed.unit
            FROM energy_data ed
            JOIN devices d ON ed.device_id = d.id
            JOIN buildings b ON d.building_id = b.id
            WHERE b.park_id = ? AND ed.timestamp >= datetime('now', ?)
            GROUP BY ed.data_type, ed.unit
          `;
          params = [scopeId, timeCondition];
          break;

        default:
          throw new Error('无效的scope参数');
      }

      const data = await this.queryDatabase(sql, params);

      // 转换为对象格式
      const consumption = {};
      data.forEach(item => {
        const key = `${item.data_type}_${item.unit}`;
        consumption[key] = {
          total: item.total,
          unit: item.unit
        };
      });

      return consumption;
    } catch (error) {
      logger.error('获取能源消耗数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取能源价格
   */
  async getEnergyPrices() {
    try {
      const sql = `
        SELECT energy_type, price, unit
        FROM energy_prices 
        WHERE is_active = 1
        ORDER BY effective_date DESC
      `;

      const prices = await this.queryDatabase(sql);

      // 转换为对象格式
      const priceMap = {};
      prices.forEach(price => {
        priceMap[`${price.energy_type}_${price.unit}`] = price.price;
      });

      // 如果没有配置价格，使用默认值
      if (!(Object.keys(priceMap).length === 0)) {
        return {
          electricity_kWh: 0.8,
          water_m3: 3.5,
          gas_m3: 2.8
        };
      }

      return priceMap;
    } catch (error) {
      logger.error('获取能源价格失败:', error);
      return {};
    }
  }

  /**
   * 识别节约机会
   */
  async identifySavingsOpportunities(consumptionData, energyPrices) {
    const opportunities = [];

    try {
      for (const [energyType, consumption] of Object.entries(consumptionData)) {
        const price = energyPrices[energyType] || 0;
        const _currentCost = consumption.total * price;

        // 基于行业基准识别节约机会
        const benchmark = await this.getIndustryBenchmark(energyType);
        if (benchmark && consumption.total > benchmark.average * MATH_CONSTANTS.ONE_POINT_TWO) {
          const potentialSaving = (consumption.total - benchmark.average) * price;
          opportunities.push({
            energy_type: energyType,
            current_consumption: consumption.total,
            benchmark_average: benchmark.average,
            excess_consumption: consumption.total - benchmark.average,
            potential_cost_saving: potentialSaving,
            recommendation: `${energyType}消耗超出行业平均水平20%，建议优化使用策略`
          });
        }
      }

      return opportunities;
    } catch (error) {
      logger.error('识别节约机会失败:', error);
      return [];
    }
  }

  /**
   * 获取基准消耗
   */
  async getBaselineConsumption(scopeId, scope) {
    try {
      const sql = `
        SELECT SUM(baseline_value) as total
        FROM baseline_consumption 
        WHERE scope = ? AND scope_id = ?
      `;

      const result = await this.queryDatabase(sql, [scope, scopeId]);
      return result[0] || null;
    } catch (error) {
      logger.error('获取基准消耗失败:', error);
      return null;
    }
  }

  /**
   * 获取当前消耗
   */
  async getCurrentConsumption(scopeId, scope) {
    try {
      const consumption = await this.getEnergyConsumption(scopeId, scope, '30d');
      const total = Object.values(consumption).reduce((sum, item) => sum + item.total, MATH_CONSTANTS.ZERO);
      return { total };
    } catch (error) {
      logger.error('获取当前消耗失败:', error);
      return null;
    }
  }

  /**
   * 获取行业基准
   */
  async getIndustryBenchmark(energyType) {
    // 这里可以从外部数据源获取行业基准数据
    // 暂时返回模拟数据
    const benchmarks = {
      electricity_kWh: { average: 1000, unit: 'kWh' },
      water_m3: { average: 50, unit: 'm3' },
      gas_m3: { average: 100, unit: 'm3' }
    };

    return benchmarks[energyType] || null;
  }

  /**
   * 获取历史数据
   */
  async getHistoricalData(scopeId, scope, timeRange) {
    try {
      const _consumption = await this.getEnergyConsumption(scopeId, scope, timeRange);

      // 按天分组获取详细历史数据
      const timeCondition = this.getTimeCondition(timeRange);
      let sql; let params;

      switch (scope) {
        case 'device':
          sql = `
            SELECT 
              strftime('%Y-%m-%d', timestamp) as date,
              data_type,
              SUM(value) as daily_total
            FROM energy_data 
            WHERE device_id = ? AND timestamp >= datetime('now', ?)
            GROUP BY date, data_type
            ORDER BY date
          `;
          params = [scopeId, timeCondition];
          break;

        default:
          // 其他scope的实现类似
          return {};
      }

      const data = await this.queryDatabase(sql, params);

      // 按数据类型分组
      const grouped = {};
      data.forEach(item => {
        if (!grouped[item.data_type]) {
          grouped[item.data_type] = [];
        }
        grouped[item.data_type].push({
          date: item.date,
          value: item.daily_total
        });
      });

      return grouped;
    } catch (error) {
      logger.error('获取历史数据失败:', error);
      return {};
    }
  }

  /**
   * 计算线性趋势
   */
  calculateLinearTrend(data) {
    if (data.length < 2) {
      return { direction: 'stable', slope: 0, intercept: 0 };
    }

    const n = data.length;
    const sumX = (n * (n - MATH_CONSTANTS.ONE)) / MATH_CONSTANTS.TWO;
    const sumY = data.reduce((sum, item) => sum + item.value, MATH_CONSTANTS.ZERO);
    const sumXY = data.reduce((sum, item, index) => sum + item.value * index, MATH_CONSTANTS.ZERO);
    const sumX2 = (n * (n - MATH_CONSTANTS.ONE) * (MATH_CONSTANTS.TWO * n - MATH_CONSTANTS.ONE)) / MATH_CONSTANTS.SIX;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      direction: slope > MATH_CONSTANTS.TEN_PERCENT ? 'increasing' : slope < -MATH_CONSTANTS.TEN_PERCENT ? 'decreasing' : 'stable',
      slope,
      intercept
    };
  }

  /**
   * 外推趋势
   */
  extrapolateTrend(trend, periods) {
    const predictions = [];
    const lastIndex = periods;

    for (let i = 1; i <= periods; i++) {
      const predictedValue = trend.intercept + trend.slope * (lastIndex + i);
      predictions.push(Math.max(MATH_CONSTANTS.ZERO, predictedValue)); // 确保预测值不为负
    }

    return predictions;
  }

  /**
   * 计算预测置信度
   */
  calculateForecastConfidence(data, trend) {
    if (data.length < MATH_CONSTANTS.THREE) {return MATH_CONSTANTS.ZERO;}

    // 计算R²值作为置信度指标
    const actualValues = data.map(item => item.value);
    const predictedValues = data.map((item, index) => trend.intercept + trend.slope * index);

    const meanActual = actualValues.reduce((sum, val) => sum + val, MATH_CONSTANTS.ZERO) / actualValues.length;

    const totalSumSquares = actualValues.reduce(
      (sum, val) => sum + Math.pow(val - meanActual, MATH_CONSTANTS.TWO),
      MATH_CONSTANTS.ZERO
    );
    const residualSumSquares = actualValues.reduce((sum, val, index) => sum + Math.pow(val - predictedValues[index], MATH_CONSTANTS.TWO), MATH_CONSTANTS.ZERO);

    const rSquared = MATH_CONSTANTS.ONE - residualSumSquares / totalSumSquares;
    return Math.max(MATH_CONSTANTS.ZERO, Math.min(MATH_CONSTANTS.ONE, rSquared)) * MATH_CONSTANTS.ONE_HUNDRED; // 转换为百分比
  }

  /**
   * 获取上一个时间范围
   */
  getPreviousTimeRange(timeRange) {
    const ranges = {
      '1h': PREVIOUS_TIME_RANGES.ONE_HOUR,
      '6h': PREVIOUS_TIME_RANGES.SIX_HOURS,
      '24h': PREVIOUS_TIME_RANGES.ONE_DAY,
      '7d': PREVIOUS_TIME_RANGES.SEVEN_DAYS,
      '30d': PREVIOUS_TIME_RANGES.THIRTY_DAYS,
      '90d': PREVIOUS_TIME_RANGES.NINETY_DAYS,
      '1y': PREVIOUS_TIME_RANGES.ONE_YEAR
    };
    return ranges[timeRange] || PREVIOUS_TIME_RANGES.ONE_DAY;
  }

  /**
   * 估算潜在节约
   */
  estimatePotentialSavings(stat) {
    // 基于效率评分估算潜在节约百分比
    const efficiencyGap = (EFFICIENCY_THRESHOLDS.GOOD - stat.efficiency_score) / MATH_CONSTANTS.ONE_HUNDRED; // 假设80分为良好水平
    const potentialSavingPercentage = Math.max(MATH_CONSTANTS.ZERO, efficiencyGap * MATH_CONSTANTS.THIRTY_PERCENT); // 最多30%的节约潜力

    return {
      percentage: potentialSavingPercentage * MATH_CONSTANTS.ONE_HUNDRED,
      estimated_amount: stat.total_value * potentialSavingPercentage
    };
  }

  /**
   * 分析异常模式
   */
  analyzeAnomalyPatterns(anomalies) {
    const patterns = {
      mostCommonType: null,
      severityDistribution: {},
      timePatterns: {},
      devicePatterns: {}
    };

    if (anomalies.length === 0) {return patterns;}

    // 分析最常见的异常类型
    const typeCount = {};
    anomalies.forEach(anomaly => {
      const reason = anomaly.anomaly_reason || 'unknown';
      typeCount[reason] = (typeCount[reason] || 0) + 1;
    });

    patterns.mostCommonType = Object.keys(typeCount).reduce((a, b) =>
      (typeCount[a] > typeCount[b] ? a : b)
    );

    // 分析严重程度分布
    anomalies.forEach(anomaly => {
      const severity = this.classifyAnomalySeverity(anomaly.value);
      patterns.severityDistribution[severity] = (patterns.severityDistribution[severity] || 0) + 1;
    });

    return patterns;
  }

  /**
   * 分类异常严重程度
   */
  classifyAnomalySeverity(value) {
    // 简单的严重程度分类逻辑
    if (value > MATH_CONSTANTS.ONE_THOUSAND) {return 'high';}
    if (value > MATH_CONSTANTS.FIVE_HUNDRED) {return 'medium';}
    return 'low';
  }

  /**
   * 获取总数据点数
   */
  async getTotalDataPoints(deviceId, timeRange) {
    try {
      const timeCondition = this.getTimeCondition(timeRange);
      const sql = `
        SELECT COUNT(*) as total
        FROM energy_data 
        WHERE device_id = ? AND timestamp >= datetime('now', ?)
      `;

      const result = await this.queryDatabase(sql, [deviceId, timeCondition]);
      return result[0]?.total || MATH_CONSTANTS.ZERO;
    } catch (error) {
      logger.error('获取总数据点数失败:', error);
      return 0;
    }
  }

  /**
   * 保存报告
   */
  async saveReport(report) {
    const _sql = `
      INSERT INTO energy_reports (
        id, scope, scope_id, time_range, report_data, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    // 模拟数据库保存操作
    return new Promise((resolve) => {
      logger.info('模拟保存报告:', report.id);
      resolve(report.id);
    });
  }
}

export default EnergyAnalytics;
