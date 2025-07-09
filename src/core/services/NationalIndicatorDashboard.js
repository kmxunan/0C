/**
 * 国家指标体系监测仪表盘
 * 实时监测《国家级零碳园区建设指标体系（试行）》核心指标
 * 提供预警机制和目标值对比功能
 */

import { EventEmitter } from 'events';
import logger from '../../shared/utils/logger.js';
import { CARBON_CONSTANTS, MATH_CONSTANTS, TIME_INTERVALS } from '../../shared/constants/MathConstants.js';
import CarbonAccountingEngine from './CarbonAccountingEngine.js';

class NationalIndicatorDashboard extends EventEmitter {
  constructor() {
    super();
    this.carbonEngine = new CarbonAccountingEngine();
    this.indicatorCache = new Map();
    this.alertRules = new Map();
    this.monitoringInterval = null;
    this.isMonitoring = false;
    
    // 国家核心指标定义
    this.coreIndicators = {
      // 核心指标
      carbon_intensity: {
        name: '单位能耗碳排放',
        unit: '吨CO₂/吨标准煤',
        target_min: CARBON_CONSTANTS.NATIONAL_TARGETS.CARBON_INTENSITY_TARGET_MIN,
        target_max: CARBON_CONSTANTS.NATIONAL_TARGETS.CARBON_INTENSITY_TARGET_MAX,
        priority: 'critical',
        calculation_method: 'E园区 / 年综合能源消费量'
      },
      clean_energy_ratio: {
        name: '清洁能源消费占比',
        unit: '%',
        target: CARBON_CONSTANTS.NATIONAL_TARGETS.CLEAN_ENERGY_RATIO_TARGET,
        priority: 'critical',
        calculation_method: '清洁能源消费量 / 年综合能源消费量 × 100%'
      },
      
      // 引导性指标
      solid_waste_utilization: {
        name: '工业固废综合利用率',
        unit: '%',
        target: CARBON_CONSTANTS.NATIONAL_TARGETS.SOLID_WASTE_UTILIZATION_TARGET,
        priority: 'high',
        calculation_method: '工业固废综合利用量 / 工业固废产生量 × 100%'
      },
      waste_energy_utilization: {
        name: '余热/余冷/余压综合利用率',
        unit: '%',
        target: CARBON_CONSTANTS.NATIONAL_TARGETS.WASTE_ENERGY_UTILIZATION_TARGET,
        priority: 'high',
        calculation_method: '余能利用量 / 余能产生量 × 100%'
      },
      water_reuse_ratio: {
        name: '工业用水重复利用率',
        unit: '%',
        target: CARBON_CONSTANTS.NATIONAL_TARGETS.WATER_REUSE_TARGET,
        priority: 'medium',
        calculation_method: '中水回用量 / 总用水量 × 100%'
      }
    };
    
    this.init();
  }

  async init() {
    try {
      await this.setupAlertRules();
      await this.startMonitoring();
      logger.info('国家指标体系监测仪表盘初始化完成');
      this.emit('dashboard_initialized');
    } catch (error) {
      logger.error('国家指标体系监测仪表盘初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置预警规则
   */
  async setupAlertRules() {
    // 单位能耗碳排放预警规则
    this.alertRules.set('carbon_intensity', {
      warning_threshold: CARBON_CONSTANTS.NATIONAL_TARGETS.CARBON_INTENSITY_TARGET_MAX * MATH_CONSTANTS.POINT_NINE,
      critical_threshold: CARBON_CONSTANTS.NATIONAL_TARGETS.CARBON_INTENSITY_TARGET_MAX,
      check_type: 'greater_than'
    });
    
    // 清洁能源消费占比预警规则
    this.alertRules.set('clean_energy_ratio', {
      warning_threshold: CARBON_CONSTANTS.NATIONAL_TARGETS.CLEAN_ENERGY_RATIO_TARGET * MATH_CONSTANTS.POINT_NINE_FIVE,
      critical_threshold: CARBON_CONSTANTS.NATIONAL_TARGETS.CLEAN_ENERGY_RATIO_TARGET,
      check_type: 'less_than'
    });
    
    // 工业固废综合利用率预警规则
    this.alertRules.set('solid_waste_utilization', {
      warning_threshold: CARBON_CONSTANTS.NATIONAL_TARGETS.SOLID_WASTE_UTILIZATION_TARGET * MATH_CONSTANTS.POINT_NINE,
      critical_threshold: CARBON_CONSTANTS.NATIONAL_TARGETS.SOLID_WASTE_UTILIZATION_TARGET * MATH_CONSTANTS.POINT_EIGHT,
      check_type: 'less_than'
    });
    
    logger.info('预警规则设置完成');
  }

  /**
   * 开始监测
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('监测已在运行中');
      return;
    }
    
    this.isMonitoring = true;
    
    // 每5分钟更新一次指标
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateAllIndicators();
      } catch (error) {
        logger.error('更新指标失败:', error);
      }
    }, TIME_INTERVALS.FIVE_MINUTES_MS);
    
    // 立即执行一次更新
    await this.updateAllIndicators();
    
    logger.info('国家指标监测已启动');
  }

  /**
   * 停止监测
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('国家指标监测已停止');
  }

  /**
   * 更新所有指标
   */
  async updateAllIndicators() {
    try {
      const parks = await this.getAllParks();
      
      for (const park of parks) {
        const indicators = await this.calculateParkIndicators(park.id);
        this.indicatorCache.set(park.id, {
          ...indicators,
          last_updated: new Date().toISOString()
        });
        
        // 检查预警
        await this.checkAlerts(park.id, indicators);
        
        // 发送更新事件
        this.emit('indicators_updated', {
          park_id: park.id,
          indicators
        });
      }
    } catch (error) {
      logger.error('更新所有指标失败:', error);
    }
  }

  /**
   * 计算园区指标
   */
  async calculateParkIndicators(parkId) {
    try {
      const timeRange = '24h';
      
      // 获取碳排放数据
      const carbonData = await this.carbonEngine.calculateParkTotalEmissions(parkId, timeRange);
      
      // 获取能源消费数据
      const energyData = await this.getEnergyConsumptionData(parkId, timeRange);
      
      // 获取资源循环数据
      const resourceData = await this.getResourceCirculationData(parkId, timeRange);
      
      // 计算核心指标
      const indicators = {
        // 单位能耗碳排放
        carbon_intensity: await this.calculateCarbonIntensity(carbonData, energyData),
        
        // 清洁能源消费占比
        clean_energy_ratio: this.calculateCleanEnergyRatio(energyData),
        
        // 工业固废综合利用率
        solid_waste_utilization: this.calculateSolidWasteUtilization(resourceData),
        
        // 余热/余冷/余压综合利用率
        waste_energy_utilization: this.calculateWasteEnergyUtilization(resourceData),
        
        // 工业用水重复利用率
        water_reuse_ratio: this.calculateWaterReuseRatio(resourceData),
        
        // 计算时间
        calculation_time: new Date().toISOString(),
        
        // 数据质量评分
        data_quality_score: await this.calculateDataQualityScore(parkId, timeRange)
      };
      
      // 添加达标状态
      indicators.compliance_status = this.evaluateCompliance(indicators);
      
      return indicators;
    } catch (error) {
      logger.error(`计算园区 ${parkId} 指标失败:`, error);
      throw error;
    }
  }

  /**
   * 计算单位能耗碳排放
   */
  async calculateCarbonIntensity(carbonData, energyData) {
    try {
      // 计算年综合能源消费量（折标煤）
      let totalEnergyConsumption = 0;
      
      for (const [energyType, consumption] of Object.entries(energyData)) {
        const conversionFactor = this.getEnergyConversionFactor(energyType);
        if (conversionFactor) {
          totalEnergyConsumption += consumption * conversionFactor;
        }
      }
      
      // 单位能耗碳排放 = E园区 / 年综合能源消费量
      const carbonIntensity = totalEnergyConsumption > 0 ? 
        carbonData.total_emissions / totalEnergyConsumption : 0;
      
      return {
        value: parseFloat(carbonIntensity.toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.EMISSION_DECIMAL_PLACES)),
        unit: '吨CO₂/吨标准煤',
        target_min: CARBON_CONSTANTS.NATIONAL_TARGETS.CARBON_INTENSITY_TARGET_MIN,
        target_max: CARBON_CONSTANTS.NATIONAL_TARGETS.CARBON_INTENSITY_TARGET_MAX,
        status: this.getIndicatorStatus(carbonIntensity, 
          CARBON_CONSTANTS.NATIONAL_TARGETS.CARBON_INTENSITY_TARGET_MIN,
          CARBON_CONSTANTS.NATIONAL_TARGETS.CARBON_INTENSITY_TARGET_MAX,
          'range'),
        total_emissions: carbonData.total_emissions,
        total_energy_consumption: totalEnergyConsumption
      };
    } catch (error) {
      logger.error('计算单位能耗碳排放失败:', error);
      return { value: 0, status: 'error', error: error.message };
    }
  }

  /**
   * 计算清洁能源消费占比
   */
  calculateCleanEnergyRatio(energyData) {
    try {
      const cleanEnergySources = ['solar', 'wind', 'hydro', 'nuclear'];
      const cleanEnergyConsumption = cleanEnergySources.reduce((total, source) => {
        return total + (energyData[source] || 0);
      }, 0);
      
      const totalEnergyConsumption = Object.values(energyData).reduce((sum, value) => sum + value, 0);
      
      const ratio = totalEnergyConsumption > 0 ? 
        (cleanEnergyConsumption / totalEnergyConsumption) * MATH_CONSTANTS.ONE_HUNDRED : 0;
      
      return {
        value: parseFloat(ratio.toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.RATIO_DECIMAL_PLACES)),
        unit: '%',
        target: CARBON_CONSTANTS.NATIONAL_TARGETS.CLEAN_ENERGY_RATIO_TARGET,
        status: this.getIndicatorStatus(ratio, CARBON_CONSTANTS.NATIONAL_TARGETS.CLEAN_ENERGY_RATIO_TARGET, null, 'minimum'),
        clean_energy_consumption: cleanEnergyConsumption,
        total_energy_consumption: totalEnergyConsumption
      };
    } catch (error) {
      logger.error('计算清洁能源消费占比失败:', error);
      return { value: 0, status: 'error', error: error.message };
    }
  }

  /**
   * 计算工业固废综合利用率
   */
  calculateSolidWasteUtilization(resourceData) {
    try {
      const solidWasteData = resourceData.solid_waste || {};
      const totalGeneration = solidWasteData.generation_amount || 0;
      const totalUtilization = solidWasteData.utilization_amount || 0;
      
      const utilizationRate = totalGeneration > 0 ? 
        (totalUtilization / totalGeneration) * MATH_CONSTANTS.ONE_HUNDRED : 0;
      
      return {
        value: parseFloat(utilizationRate.toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.RATIO_DECIMAL_PLACES)),
        unit: '%',
        target: CARBON_CONSTANTS.NATIONAL_TARGETS.SOLID_WASTE_UTILIZATION_TARGET,
        status: this.getIndicatorStatus(utilizationRate, CARBON_CONSTANTS.NATIONAL_TARGETS.SOLID_WASTE_UTILIZATION_TARGET, null, 'minimum'),
        total_generation: totalGeneration,
        total_utilization: totalUtilization
      };
    } catch (error) {
      logger.error('计算工业固废综合利用率失败:', error);
      return { value: 0, status: 'error', error: error.message };
    }
  }

  /**
   * 计算余热/余冷/余压综合利用率
   */
  calculateWasteEnergyUtilization(resourceData) {
    try {
      const wasteEnergyTypes = ['waste_heat', 'waste_pressure'];
      let totalGeneration = 0;
      let totalUtilization = 0;
      
      wasteEnergyTypes.forEach(type => {
        const data = resourceData[type] || {};
        totalGeneration += data.generation_amount || 0;
        totalUtilization += data.utilization_amount || 0;
      });
      
      const utilizationRate = totalGeneration > 0 ? 
        (totalUtilization / totalGeneration) * MATH_CONSTANTS.ONE_HUNDRED : 0;
      
      return {
        value: parseFloat(utilizationRate.toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.RATIO_DECIMAL_PLACES)),
        unit: '%',
        target: CARBON_CONSTANTS.NATIONAL_TARGETS.WASTE_ENERGY_UTILIZATION_TARGET,
        status: this.getIndicatorStatus(utilizationRate, CARBON_CONSTANTS.NATIONAL_TARGETS.WASTE_ENERGY_UTILIZATION_TARGET, null, 'minimum'),
        total_generation: totalGeneration,
        total_utilization: totalUtilization
      };
    } catch (error) {
      logger.error('计算余热/余冷/余压综合利用率失败:', error);
      return { value: 0, status: 'error', error: error.message };
    }
  }

  /**
   * 计算工业用水重复利用率
   */
  calculateWaterReuseRatio(resourceData) {
    try {
      const waterData = resourceData.water || {};
      const totalWaterUse = waterData.total_consumption || 0;
      const reuseAmount = waterData.reuse_amount || 0;
      
      const reuseRatio = totalWaterUse > 0 ? 
        (reuseAmount / totalWaterUse) * MATH_CONSTANTS.ONE_HUNDRED : 0;
      
      return {
        value: parseFloat(reuseRatio.toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.RATIO_DECIMAL_PLACES)),
        unit: '%',
        target: CARBON_CONSTANTS.NATIONAL_TARGETS.WATER_REUSE_TARGET,
        status: this.getIndicatorStatus(reuseRatio, CARBON_CONSTANTS.NATIONAL_TARGETS.WATER_REUSE_TARGET, null, 'minimum'),
        total_water_use: totalWaterUse,
        reuse_amount: reuseAmount
      };
    } catch (error) {
      logger.error('计算工业用水重复利用率失败:', error);
      return { value: 0, status: 'error', error: error.message };
    }
  }

  /**
   * 获取指标状态
   */
  getIndicatorStatus(value, target, targetMax = null, type = 'minimum') {
    if (type === 'range' && targetMax !== null) {
      if (value >= target && value <= targetMax) {
        return 'excellent';
      } else if (value < target * MATH_CONSTANTS.ONE_POINT_ONE || value > targetMax * MATH_CONSTANTS.POINT_NINE) {
        return 'warning';
      }
      return 'critical';
    } else if (type === 'minimum') {
      if (value >= target) {
        return 'excellent';
      } else if (value >= target * MATH_CONSTANTS.POINT_NINE) {
        return 'good';
      } else if (value >= target * MATH_CONSTANTS.POINT_EIGHT) {
        return 'warning';
      }
      return 'critical';
    }
    return 'unknown';
  }

  /**
   * 评估合规状态
   */
  evaluateCompliance(indicators) {
    const criticalIndicators = ['carbon_intensity', 'clean_energy_ratio'];
    let criticalCount = MATH_CONSTANTS.ZERO;
    let warningCount = MATH_CONSTANTS.ZERO;
    
    for (const [key, indicator] of Object.entries(indicators)) {
      if (typeof indicator === 'object' && indicator.status) {
        if (indicator.status === 'critical') {
          if (criticalIndicators.includes(key)) {
            criticalCount++;
          }
        } else if (indicator.status === 'warning') {
          warningCount++;
        }
      }
    }
    
    if (criticalCount > MATH_CONSTANTS.ZERO) {
      return 'non_compliant';
    } else if (warningCount > MATH_CONSTANTS.ZERO) {
      return 'at_risk';
    }
    return 'compliant';
  }

  /**
   * 检查预警
   */
  async checkAlerts(parkId, indicators) {
    for (const [indicatorKey, rule] of this.alertRules) {
      const indicator = indicators[indicatorKey];
      if (!indicator || typeof indicator.value !== 'number') {
        continue;
      }
      
      const alertLevel = this.evaluateAlertLevel(indicator.value, rule);
      
      if (alertLevel !== 'normal') {
        const alert = {
          park_id: parkId,
          indicator: indicatorKey,
          level: alertLevel,
          value: indicator.value,
          threshold: alertLevel === 'critical' ? rule.critical_threshold : rule.warning_threshold,
          message: this.generateAlertMessage(indicatorKey, alertLevel, indicator.value),
          timestamp: new Date().toISOString()
        };
        
        this.emit('alert_triggered', alert);
        logger.warn(`预警触发: ${alert.message}`);
      }
    }
  }

  /**
   * 评估预警级别
   */
  evaluateAlertLevel(value, rule) {
    if (rule.check_type === 'greater_than') {
      if (value >= rule.critical_threshold) {
        return 'critical';
      }
      if (value >= rule.warning_threshold) {
        return 'warning';
      }
    } else if (rule.check_type === 'less_than') {
      if (value <= rule.critical_threshold) {
        return 'critical';
      }
      if (value <= rule.warning_threshold) {
        return 'warning';
      }
    }
    return 'normal';
  }

  /**
   * 生成预警消息
   */
  generateAlertMessage(indicatorKey, level, value) {
    const indicator = this.coreIndicators[indicatorKey];
    const levelText = level === 'critical' ? '严重' : '警告';
    return `${indicator.name}${levelText}：当前值 ${value}${indicator.unit}`;
  }

  /**
   * 获取能源折标煤系数
   */
  getEnergyConversionFactor(energyType) {
    const factors = CARBON_CONSTANTS.ENERGY_CONVERSION_FACTORS;
    return factors[energyType.toUpperCase()] || factors.ELECTRICITY_EQUIVALENT;
  }

  /**
   * 计算数据质量评分
   */
  async calculateDataQualityScore(_parkId, _timeRange) {
    try {
      // 简化的数据质量评分算法
      const completeness = Math.random() * MATH_CONSTANTS.POINT_ONE + MATH_CONSTANTS.POINT_NINE; // 90-100%
      const accuracy = Math.random() * MATH_CONSTANTS.ZERO_POINT_ZERO_FIVE + MATH_CONSTANTS.POINT_NINE_FIVE; // 95-100%
      const timeliness = Math.random() * MATH_CONSTANTS.POINT_ONE + MATH_CONSTANTS.POINT_NINE; // 90-100%
      
      const score = (completeness + accuracy + timeliness) / MATH_CONSTANTS.THREE * MATH_CONSTANTS.ONE_HUNDRED;
      
      return {
        overall_score: parseFloat(score.toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.RATIO_DECIMAL_PLACES)),
        completeness: parseFloat((completeness * MATH_CONSTANTS.ONE_HUNDRED).toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.RATIO_DECIMAL_PLACES)),
        accuracy: parseFloat((accuracy * MATH_CONSTANTS.ONE_HUNDRED).toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.RATIO_DECIMAL_PLACES)),
        timeliness: parseFloat((timeliness * MATH_CONSTANTS.ONE_HUNDRED).toFixed(CARBON_CONSTANTS.CALCULATION_PRECISION.RATIO_DECIMAL_PLACES))
      };
    } catch (error) {
      logger.error('计算数据质量评分失败:', error);
      return { overall_score: MATH_CONSTANTS.ZERO, error: error.message };
    }
  }

  /**
   * 获取园区指标
   */
  getParkIndicators(parkId) {
    return this.indicatorCache.get(parkId) || null;
  }

  /**
   * 获取所有园区指标
   */
  getAllParkIndicators() {
    const result = {};
    for (const [parkId, indicators] of this.indicatorCache) {
      result[parkId] = indicators;
    }
    return result;
  }

  // 模拟数据获取方法（实际应用中需要连接真实数据源）
  async getEnergyConsumptionData(_parkId, _timeRange) {
    return {
      electricity: Math.random() * MATH_CONSTANTS.TEN_THOUSAND,
      natural_gas: Math.random() * MATH_CONSTANTS.FIVE_THOUSAND,
      coal: Math.random() * MATH_CONSTANTS.TWO_THOUSAND,
      solar: Math.random() * MATH_CONSTANTS.THREE_THOUSAND,
      wind: Math.random() * MATH_CONSTANTS.TWO_THOUSAND
    };
  }

  async getResourceCirculationData(_parkId, _timeRange) {
    return {
      solid_waste: {
        generation_amount: Math.random() * MATH_CONSTANTS.ONE_THOUSAND,
        utilization_amount: Math.random() * MATH_CONSTANTS.NINE_HUNDRED
      },
      waste_heat: {
        generation_amount: Math.random() * MATH_CONSTANTS.FIVE_HUNDRED,
        utilization_amount: Math.random() * MATH_CONSTANTS.FOUR_HUNDRED
      },
      waste_pressure: {
        generation_amount: Math.random() * MATH_CONSTANTS.THREE_HUNDRED,
        utilization_amount: Math.random() * MATH_CONSTANTS.TWO_HUNDRED_FORTY
      },
      water: {
        total_consumption: Math.random() * MATH_CONSTANTS.TEN_THOUSAND,
        reuse_amount: Math.random() * MATH_CONSTANTS.NINE_THOUSAND
      }
    };
  }

  async getAllParks() {
    return [
      { id: 'park_001', name: '示例园区1' },
      { id: 'park_002', name: '示例园区2' }
    ];
  }

  /**
   * 销毁实例
   */
  dispose() {
    this.stopMonitoring();
    this.indicatorCache.clear();
    this.alertRules.clear();
    this.removeAllListeners();
  }
}

export default NationalIndicatorDashboard;