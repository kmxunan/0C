import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 碳排放管理模块
 * 提供碳排放计算、碳足迹分析、碳中和目标管理等功能
 */
class CarbonManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10分钟缓存
    
    // 默认碳排放因子 (kg CO2/单位)
    this.defaultFactors = {
      electricity: 0.5703, // kg CO2/kWh (中国电网平均)
      naturalGas: 2.0317,  // kg CO2/m³
      water: 0.194,        // kg CO2/m³
      heating: 0.2016,     // kg CO2/kWh
      cooling: 0.5703      // kg CO2/kWh
    };
  }

  /**
   * 计算设备碳排放
   */
  async calculateDeviceCarbonEmission(deviceId, timeRange = '24h') {
    try {
      const cacheKey = `device_carbon_${deviceId}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const timeCondition = this.getTimeCondition(timeRange);
      
      // 获取设备能源消耗数据
      const sql = `
        SELECT 
          ed.data_type,
          SUM(ed.value) as total_consumption,
          ed.unit,
          cf.factor_value,
          cf.unit as factor_unit
        FROM energy_data ed
        LEFT JOIN carbon_factors cf ON (
          cf.energy_type = ed.data_type AND 
          cf.unit = ed.unit AND 
          cf.is_active = 1
        )
        WHERE ed.device_id = ? AND ed.timestamp >= datetime('now', ?)
        GROUP BY ed.data_type, ed.unit
      `;

      const energyData = await this.queryDatabase(sql, [deviceId, timeCondition]);
      
      let totalEmission = 0;
      const emissionBreakdown = [];
      
      for (const data of energyData) {
        // 使用数据库中的因子或默认因子
        const factor = data.factor_value || this.getDefaultFactor(data.data_type);
        const emission = data.total_consumption * factor;
        
        totalEmission += emission;
        emissionBreakdown.push({
          energy_type: data.data_type,
          consumption: data.total_consumption,
          unit: data.unit,
          emission_factor: factor,
          carbon_emission: emission,
          percentage: 0 // 将在后面计算
        });
      }
      
      // 计算百分比
      emissionBreakdown.forEach(item => {
        item.percentage = totalEmission > 0 ? (item.carbon_emission / totalEmission) * 100 : 0;
      });
      
      const result = {
        device_id: deviceId,
        time_range: timeRange,
        total_emission: totalEmission,
        unit: 'kg CO2',
        breakdown: emissionBreakdown,
        calculated_at: new Date().toISOString()
      };
      
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('计算设备碳排放失败:', error);
      throw error;
    }
  }

  /**
   * 计算建筑碳排放
   */
  async calculateBuildingCarbonEmission(buildingId, timeRange = '24h') {
    try {
      const cacheKey = `building_carbon_${buildingId}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const timeCondition = this.getTimeCondition(timeRange);
      
      const sql = `
        SELECT 
          ed.data_type,
          SUM(ed.value) as total_consumption,
          ed.unit,
          cf.factor_value,
          COUNT(DISTINCT ed.device_id) as device_count
        FROM energy_data ed
        JOIN devices d ON ed.device_id = d.id
        LEFT JOIN carbon_factors cf ON (
          cf.energy_type = ed.data_type AND 
          cf.unit = ed.unit AND 
          cf.is_active = 1
        )
        WHERE d.building_id = ? AND ed.timestamp >= datetime('now', ?)
        GROUP BY ed.data_type, ed.unit
      `;

      const energyData = await this.queryDatabase(sql, [buildingId, timeCondition]);
      
      let totalEmission = 0;
      const emissionBreakdown = [];
      
      for (const data of energyData) {
        const factor = data.factor_value || this.getDefaultFactor(data.data_type);
        const emission = data.total_consumption * factor;
        
        totalEmission += emission;
        emissionBreakdown.push({
          energy_type: data.data_type,
          consumption: data.total_consumption,
          unit: data.unit,
          emission_factor: factor,
          carbon_emission: emission,
          device_count: data.device_count,
          percentage: 0
        });
      }
      
      emissionBreakdown.forEach(item => {
        item.percentage = totalEmission > 0 ? (item.carbon_emission / totalEmission) * 100 : 0;
      });
      
      const result = {
        building_id: buildingId,
        time_range: timeRange,
        total_emission: totalEmission,
        unit: 'kg CO2',
        breakdown: emissionBreakdown,
        calculated_at: new Date().toISOString()
      };
      
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('计算建筑碳排放失败:', error);
      throw error;
    }
  }

  /**
   * 计算园区碳排放
   */
  async calculateParkCarbonEmission(parkId, timeRange = '24h') {
    try {
      const cacheKey = `park_carbon_${parkId}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const timeCondition = this.getTimeCondition(timeRange);
      
      const sql = `
        SELECT 
          ed.data_type,
          SUM(ed.value) as total_consumption,
          ed.unit,
          cf.factor_value,
          COUNT(DISTINCT ed.device_id) as device_count,
          COUNT(DISTINCT d.building_id) as building_count
        FROM energy_data ed
        JOIN devices d ON ed.device_id = d.id
        JOIN buildings b ON d.building_id = b.id
        LEFT JOIN carbon_factors cf ON (
          cf.energy_type = ed.data_type AND 
          cf.unit = ed.unit AND 
          cf.is_active = 1
        )
        WHERE b.park_id = ? AND ed.timestamp >= datetime('now', ?)
        GROUP BY ed.data_type, ed.unit
      `;

      const energyData = await this.queryDatabase(sql, [parkId, timeCondition]);
      
      let totalEmission = 0;
      const emissionBreakdown = [];
      
      for (const data of energyData) {
        const factor = data.factor_value || this.getDefaultFactor(data.data_type);
        const emission = data.total_consumption * factor;
        
        totalEmission += emission;
        emissionBreakdown.push({
          energy_type: data.data_type,
          consumption: data.total_consumption,
          unit: data.unit,
          emission_factor: factor,
          carbon_emission: emission,
          device_count: data.device_count,
          building_count: data.building_count,
          percentage: 0
        });
      }
      
      emissionBreakdown.forEach(item => {
        item.percentage = totalEmission > 0 ? (item.carbon_emission / totalEmission) * 100 : 0;
      });
      
      const result = {
        park_id: parkId,
        time_range: timeRange,
        total_emission: totalEmission,
        unit: 'kg CO2',
        breakdown: emissionBreakdown,
        calculated_at: new Date().toISOString()
      };
      
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('计算园区碳排放失败:', error);
      throw error;
    }
  }

  /**
   * 获取碳排放趋势
   */
  async getCarbonEmissionTrend(scope, scopeId, timeRange = '30d', interval = 'day') {
    try {
      const cacheKey = `carbon_trend_${scope}_${scopeId}_${timeRange}_${interval}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const timeCondition = this.getTimeCondition(timeRange);
      const groupBy = this.getGroupByInterval(interval);
      
      let sql, params;
      
      switch (scope) {
        case 'device':
          sql = `
            SELECT 
              ${groupBy} as time_period,
              ed.data_type,
              SUM(ed.value) as consumption,
              cf.factor_value
            FROM energy_data ed
            LEFT JOIN carbon_factors cf ON (
              cf.energy_type = ed.data_type AND 
              cf.unit = ed.unit AND 
              cf.is_active = 1
            )
            WHERE ed.device_id = ? AND ed.timestamp >= datetime('now', ?)
            GROUP BY time_period, ed.data_type
            ORDER BY time_period
          `;
          params = [scopeId, timeCondition];
          break;
          
        case 'building':
          sql = `
            SELECT 
              ${groupBy} as time_period,
              ed.data_type,
              SUM(ed.value) as consumption,
              cf.factor_value
            FROM energy_data ed
            JOIN devices d ON ed.device_id = d.id
            LEFT JOIN carbon_factors cf ON (
              cf.energy_type = ed.data_type AND 
              cf.unit = ed.unit AND 
              cf.is_active = 1
            )
            WHERE d.building_id = ? AND ed.timestamp >= datetime('now', ?)
            GROUP BY time_period, ed.data_type
            ORDER BY time_period
          `;
          params = [scopeId, timeCondition];
          break;
          
        case 'park':
          sql = `
            SELECT 
              ${groupBy} as time_period,
              ed.data_type,
              SUM(ed.value) as consumption,
              cf.factor_value
            FROM energy_data ed
            JOIN devices d ON ed.device_id = d.id
            JOIN buildings b ON d.building_id = b.id
            LEFT JOIN carbon_factors cf ON (
              cf.energy_type = ed.data_type AND 
              cf.unit = ed.unit AND 
              cf.is_active = 1
            )
            WHERE b.park_id = ? AND ed.timestamp >= datetime('now', ?)
            GROUP BY time_period, ed.data_type
            ORDER BY time_period
          `;
          params = [scopeId, timeCondition];
          break;
          
        default:
          throw new Error('无效的scope参数');
      }
      
      const data = await this.queryDatabase(sql, params);
      
      // 计算每个时间段的碳排放
      const trendData = {};
      data.forEach(item => {
        if (!trendData[item.time_period]) {
          trendData[item.time_period] = {
            time_period: item.time_period,
            total_emission: 0,
            breakdown: {}
          };
        }
        
        const factor = item.factor_value || this.getDefaultFactor(item.data_type);
        const emission = item.consumption * factor;
        
        trendData[item.time_period].total_emission += emission;
        trendData[item.time_period].breakdown[item.data_type] = emission;
      });
      
      const result = {
        scope,
        scope_id: scopeId,
        time_range: timeRange,
        interval,
        trend_data: Object.values(trendData),
        summary: this.calculateTrendSummary(Object.values(trendData))
      };
      
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('获取碳排放趋势失败:', error);
      throw error;
    }
  }

  /**
   * 设置碳中和目标
   */
  async setCarbonNeutralTarget(params) {
    try {
      const {
        scope,
        scopeId,
        targetYear,
        baselineYear,
        baselineEmission,
        targetEmission = 0,
        milestones = [],
        strategies = []
      } = params;
      
      const targetId = uuidv4();
      
      const sql = `
        INSERT INTO carbon_targets (
          id, scope, scope_id, target_year, baseline_year, 
          baseline_emission, target_emission, milestones, 
          strategies, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
      `;
      
      await this.runDatabase(sql, [
        targetId,
        scope,
        scopeId,
        targetYear,
        baselineYear,
        baselineEmission,
        targetEmission,
        JSON.stringify(milestones),
        JSON.stringify(strategies)
      ]);
      
      return {
        id: targetId,
        scope,
        scope_id: scopeId,
        target_year: targetYear,
        baseline_year: baselineYear,
        baseline_emission: baselineEmission,
        target_emission: targetEmission,
        reduction_target: baselineEmission - targetEmission,
        reduction_percentage: ((baselineEmission - targetEmission) / baselineEmission) * 100,
        milestones,
        strategies,
        status: 'active'
      };

    } catch (error) {
      console.error('设置碳中和目标失败:', error);
      throw error;
    }
  }

  /**
   * 获取碳中和进度
   */
  async getCarbonNeutralProgress(targetId) {
    try {
      // 获取目标信息
      const targetSql = `
        SELECT * FROM carbon_targets WHERE id = ?
      `;
      
      const target = await this.queryDatabase(targetSql, [targetId]);
      if (!target || target.length === 0) {
        throw new Error('碳中和目标不存在');
      }
      
      const targetInfo = target[0];
      const currentYear = new Date().getFullYear();
      
      // 计算当前排放量
      let currentEmission;
      switch (targetInfo.scope) {
        case 'device':
          currentEmission = await this.calculateDeviceCarbonEmission(targetInfo.scope_id, '365d');
          break;
        case 'building':
          currentEmission = await this.calculateBuildingCarbonEmission(targetInfo.scope_id, '365d');
          break;
        case 'park':
          currentEmission = await this.calculateParkCarbonEmission(targetInfo.scope_id, '365d');
          break;
        default:
          throw new Error('无效的scope');
      }
      
      const totalReduction = targetInfo.baseline_emission - targetInfo.target_emission;
      const currentReduction = targetInfo.baseline_emission - currentEmission.total_emission;
      const progressPercentage = totalReduction > 0 ? (currentReduction / totalReduction) * 100 : 0;
      
      // 计算年度进度
      const yearsElapsed = currentYear - targetInfo.baseline_year;
      const totalYears = targetInfo.target_year - targetInfo.baseline_year;
      const expectedProgress = totalYears > 0 ? (yearsElapsed / totalYears) * 100 : 0;
      
      // 解析里程碑
      const milestones = JSON.parse(targetInfo.milestones || '[]');
      const strategies = JSON.parse(targetInfo.strategies || '[]');
      
      // 检查里程碑完成情况
      const milestoneProgress = milestones.map(milestone => {
        const isCompleted = currentYear >= milestone.year && 
                           currentEmission.total_emission <= milestone.target_emission;
        return {
          ...milestone,
          completed: isCompleted,
          current_emission: currentEmission.total_emission
        };
      });
      
      return {
        target_id: targetId,
        target_info: targetInfo,
        current_emission: currentEmission.total_emission,
        baseline_emission: targetInfo.baseline_emission,
        target_emission: targetInfo.target_emission,
        total_reduction_needed: totalReduction,
        current_reduction: currentReduction,
        progress_percentage: Math.max(0, Math.min(100, progressPercentage)),
        expected_progress: expectedProgress,
        on_track: progressPercentage >= expectedProgress * 0.9, // 允许10%的偏差
        years_remaining: Math.max(0, targetInfo.target_year - currentYear),
        milestones: milestoneProgress,
        strategies,
        recommendations: await this.generateCarbonReductionRecommendations(targetInfo, currentEmission)
      };

    } catch (error) {
      console.error('获取碳中和进度失败:', error);
      throw error;
    }
  }

  /**
   * 生成碳减排建议
   */
  async generateCarbonReductionRecommendations(target, currentEmission) {
    const recommendations = [];
    
    try {
      // 分析排放源
      const highEmissionSources = currentEmission.breakdown
        .filter(item => item.percentage > 20)
        .sort((a, b) => b.carbon_emission - a.carbon_emission);
      
      for (const source of highEmissionSources) {
        switch (source.energy_type) {
          case 'electricity':
            recommendations.push({
              type: 'energy_efficiency',
              priority: 'high',
              title: '提升电力使用效率',
              description: `电力消耗占总排放的${source.percentage.toFixed(1)}%，建议采用节能设备和智能控制系统`,
              potential_reduction: source.carbon_emission * 0.2, // 假设可减少20%
              implementation_cost: 'medium',
              payback_period: '2-3年'
            });
            
            recommendations.push({
              type: 'renewable_energy',
              priority: 'high',
              title: '采用可再生能源',
              description: '安装太阳能板或购买绿色电力，直接减少碳排放',
              potential_reduction: source.carbon_emission * 0.8,
              implementation_cost: 'high',
              payback_period: '5-7年'
            });
            break;
            
          case 'heating':
            recommendations.push({
              type: 'heating_optimization',
              priority: 'medium',
              title: '优化供暖系统',
              description: '升级供暖设备，改善建筑保温，优化供暖策略',
              potential_reduction: source.carbon_emission * 0.3,
              implementation_cost: 'medium',
              payback_period: '3-4年'
            });
            break;
            
          case 'cooling':
            recommendations.push({
              type: 'cooling_optimization',
              priority: 'medium',
              title: '优化制冷系统',
              description: '使用高效制冷设备，优化空调运行策略',
              potential_reduction: source.carbon_emission * 0.25,
              implementation_cost: 'medium',
              payback_period: '2-3年'
            });
            break;
        }
      }
      
      // 添加通用建议
      recommendations.push({
        type: 'monitoring',
        priority: 'low',
        title: '加强能源监测',
        description: '部署更多传感器，实时监测能源使用情况，及时发现异常',
        potential_reduction: currentEmission.total_emission * 0.05,
        implementation_cost: 'low',
        payback_period: '1年'
      });
      
      return recommendations.slice(0, 5); // 返回前5个建议

    } catch (error) {
      console.error('生成碳减排建议失败:', error);
      return [];
    }
  }

  /**
   * 计算碳足迹
   */
  async calculateCarbonFootprint(scope, scopeId, timeRange = '365d') {
    try {
      let emission;
      
      switch (scope) {
        case 'device':
          emission = await this.calculateDeviceCarbonEmission(scopeId, timeRange);
          break;
        case 'building':
          emission = await this.calculateBuildingCarbonEmission(scopeId, timeRange);
          break;
        case 'park':
          emission = await this.calculateParkCarbonEmission(scopeId, timeRange);
          break;
        default:
          throw new Error('无效的scope参数');
      }
      
      // 计算等效指标
      const footprint = {
        ...emission,
        equivalents: {
          trees_needed: Math.ceil(emission.total_emission / 22), // 一棵树年吸收约22kg CO2
          car_km: Math.ceil(emission.total_emission / 0.12), // 汽车每公里排放约0.12kg CO2
          coal_kg: Math.ceil(emission.total_emission / 2.86), // 燃烧1kg煤炭排放约2.86kg CO2
          gasoline_liters: Math.ceil(emission.total_emission / 2.31) // 燃烧1升汽油排放约2.31kg CO2
        },
        intensity: await this.calculateCarbonIntensity(scope, scopeId, emission.total_emission)
      };
      
      return footprint;

    } catch (error) {
      console.error('计算碳足迹失败:', error);
      throw error;
    }
  }

  /**
   * 计算碳强度
   */
  async calculateCarbonIntensity(scope, scopeId, totalEmission) {
    try {
      let intensityMetrics = {};
      
      switch (scope) {
        case 'building':
          // 获取建筑面积
          const buildingSql = 'SELECT area FROM buildings WHERE id = ?';
          const building = await this.queryDatabase(buildingSql, [scopeId]);
          if (building && building[0]) {
            intensityMetrics.per_sqm = totalEmission / building[0].area;
            intensityMetrics.unit = 'kg CO2/m²';
          }
          break;
          
        case 'park':
          // 获取园区总面积
          const parkSql = `
            SELECT SUM(b.area) as total_area 
            FROM buildings b 
            WHERE b.park_id = ?
          `;
          const park = await this.queryDatabase(parkSql, [scopeId]);
          if (park && park[0] && park[0].total_area) {
            intensityMetrics.per_sqm = totalEmission / park[0].total_area;
            intensityMetrics.unit = 'kg CO2/m²';
          }
          break;
      }
      
      return intensityMetrics;

    } catch (error) {
      console.error('计算碳强度失败:', error);
      return {};
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取默认碳排放因子
   */
  getDefaultFactor(energyType) {
    return this.defaultFactors[energyType] || 0.5; // 默认因子
  }

  /**
   * 获取时间条件
   */
  getTimeCondition(timeRange) {
    const conditions = {
      '1h': '-1 hour',
      '6h': '-6 hours',
      '24h': '-1 day',
      '7d': '-7 days',
      '30d': '-30 days',
      '90d': '-90 days',
      '365d': '-365 days',
      '1y': '-1 year'
    };
    return conditions[timeRange] || '-1 day';
  }

  /**
   * 获取分组间隔
   */
  getGroupByInterval(interval) {
    const intervals = {
      'hour': "strftime('%Y-%m-%d %H:00', timestamp)",
      'day': "strftime('%Y-%m-%d', timestamp)",
      'week': "strftime('%Y-W%W', timestamp)",
      'month': "strftime('%Y-%m', timestamp)",
      'year': "strftime('%Y', timestamp)"
    };
    return intervals[interval] || intervals['day'];
  }

  /**
   * 计算趋势摘要
   */
  calculateTrendSummary(trendData) {
    if (trendData.length < 2) {
      return {
        direction: 'stable',
        change_rate: 0,
        average_emission: 0
      };
    }
    
    const emissions = trendData.map(d => d.total_emission);
    const firstEmission = emissions[0];
    const lastEmission = emissions[emissions.length - 1];
    const averageEmission = emissions.reduce((sum, val) => sum + val, 0) / emissions.length;
    
    const changeRate = firstEmission > 0 ? (lastEmission - firstEmission) / firstEmission : 0;
    
    return {
      direction: changeRate > 0.05 ? 'increasing' : changeRate < -0.05 ? 'decreasing' : 'stable',
      change_rate: changeRate,
      average_emission: averageEmission,
      total_periods: trendData.length
    };
  }

  /**
   * 缓存管理
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
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
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * 数据库执行封装
   */
  runDatabase(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }
}

export default CarbonManager;