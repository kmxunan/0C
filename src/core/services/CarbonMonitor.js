/**
 * 碳排放监测模块
 * 负责碳排放数据的实时监测、计算和分析
 */

import { EventEmitter } from 'events';
import logger from '../../shared/utils/logger.js';
import {
  TIME_CONSTANTS,
  PERCENTAGE_CONSTANTS,
  RANGE_CONSTANTS,
  CONVERSION_CONSTANTS,
  REDUCTION_TARGETS,
  DEFAULT_CARBON_FACTORS
} from './CarbonMonitorConstants.js';

class CarbonMonitor extends EventEmitter {
  constructor(apiBaseUrl = '/api') {
    super();
    this.apiBaseUrl = apiBaseUrl;
    this.carbonFactors = new Map();
    this.emissionData = new Map();
    this.reductionTargets = new Map();
    this.monitoringDevices = new Map();
    this.calculationRules = [];
    this.monitoringInterval = null;

    this.init();
  }

  async init() {
    try {
      await this.loadCarbonFactors();
      await this.loadReductionTargets();
      await this.loadMonitoringDevices();
      this.setupCalculationRules();
      this.startMonitoring();
      logger.info('碳排放监测模块初始化完成');
    } catch (error) {
      logger.error('碳排放监测模块初始化失败:', error);
    }
  }

  // 加载碳排放因子
  async loadCarbonFactors() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/carbon-factors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取碳排放因子失败');
      }

      const result = await response.json();
      const factors = result.data || [];

      factors.forEach((factor) => {
        this.carbonFactors.set(factor.energy_type, {
          ...factor,
          value: parseFloat(factor.factor_value),
          unit: factor.unit
        });
      });

      logger.info(`加载了 ${factors.length} 个碳排放因子`);
    } catch (error) {
      logger.error('加载碳排放因子失败:', error);
      // 使用默认因子
      this.loadDefaultCarbonFactors();
    }
  }

  // 加载默认碳排放因子
  loadDefaultCarbonFactors() {
    const defaultFactors = [
      {
        energy_type: 'electricity',
        factor_value: DEFAULT_CARBON_FACTORS.ELECTRICITY,
        unit: 'kgCO2e/kWh',
        source: '国家发改委'
      },
      { energy_type: 'natural_gas', factor_value: DEFAULT_CARBON_FACTORS.NATURAL_GAS, unit: 'kgCO2e/m³', source: 'IPCC' },
      { energy_type: 'diesel', factor_value: DEFAULT_CARBON_FACTORS.DIESEL, unit: 'kgCO2e/L', source: 'IPCC' },
      { energy_type: 'gasoline', factor_value: DEFAULT_CARBON_FACTORS.GASOLINE, unit: 'kgCO2e/L', source: 'IPCC' },
      { energy_type: 'coal', factor_value: DEFAULT_CARBON_FACTORS.COAL, unit: 'kgCO2e/kg', source: 'IPCC' }
    ];

    defaultFactors.forEach((factor) => {
      this.carbonFactors.set(factor.energy_type, {
        ...factor,
        value: parseFloat(factor.factor_value)
      });
    });
  }

  // 加载减排目标
  async loadReductionTargets() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/carbon/targets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const targets = result.data || [];

        targets.forEach((target) => {
          this.reductionTargets.set(target.id, target);
        });
      }
    } catch (error) {
      logger.error('加载减排目标失败:', error);
    }

    // 设置默认目标
    if (this.reductionTargets.size === 0) {
      this.setDefaultReductionTargets();
    }
  }

  // 设置默认减排目标
  setDefaultReductionTargets() {
    const defaultTargets = [
      {
        id: 'annual_2024',
        name: '2024年度减排目标',
        targetReduction: REDUCTION_TARGETS.ANNUAL_2024.REDUCTION_PERCENTAGE,
        baselineYear: REDUCTION_TARGETS.ANNUAL_2024.BASELINE_YEAR,
        targetYear: REDUCTION_TARGETS.ANNUAL_2024.TARGET_YEAR,
        scope: 'total',
        status: 'active'
      },
      {
        id: 'carbon_neutral_2030',
        name: '2030年碳中和目标',
        targetReduction: REDUCTION_TARGETS.CARBON_NEUTRAL_2030.REDUCTION_PERCENTAGE,
        baselineYear: REDUCTION_TARGETS.CARBON_NEUTRAL_2030.BASELINE_YEAR,
        targetYear: REDUCTION_TARGETS.CARBON_NEUTRAL_2030.TARGET_YEAR,
        scope: 'total',
        status: 'planning'
      }
    ];

    defaultTargets.forEach((target) => {
      this.reductionTargets.set(target.id, target);
    });
  }

  // 加载监测设备
  async loadMonitoringDevices() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devices?category=energy`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取监测设备失败');
      }

      const result = await response.json();
      const devices = result.data || [];

      devices.forEach((device) => {
        this.monitoringDevices.set(device.id, {
          ...device,
          energyType: this.determineEnergyType(device),
          lastEmission: 0,
          totalEmission: 0,
          lastUpdate: null
        });
      });

      logger.info(`加载了 ${devices.length} 个监测设备`);
    } catch (error) {
      logger.error('加载监测设备失败:', error);
    }
  }

  // 确定设备的能源类型
  determineEnergyType(device) {
    const { category, model, name } = device;
    const text = `${category} ${model} ${name}`.toLowerCase();

    if (text.includes('电') || text.includes('electric')) {
      return 'electricity';
    } else if (text.includes('天然气') || text.includes('gas')) {
      return 'natural_gas';
    } else if (text.includes('柴油') || text.includes('diesel')) {
      return 'diesel';
    } else if (text.includes('汽油') || text.includes('gasoline')) {
      return 'gasoline';
    } else if (text.includes('煤') || text.includes('coal')) {
      return 'coal';
    }

    return 'electricity'; // 默认为电力
  }

  // 设置计算规则

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  setupCalculationRules() {
    this.calculationRules = [
      {
        id: 'direct_emission',
        name: '直接排放计算',
        description: '基于能源消耗量和排放因子的直接计算',
        formula: 'emission = consumption * factor',
        scope: 'scope1'
      },
      {
        id: 'indirect_emission',
        name: '间接排放计算',
        description: '基于外购电力的间接排放计算',
        formula: 'emission = electricity_consumption * grid_factor',
        scope: 'scope2'
      },
      {
        id: 'upstream_emission',
        name: '上游排放计算',
        description: '包含原料生产和运输的排放',
        formula: 'emission = material_consumption * upstream_factor',
        scope: 'scope3'
      }
    ];
  }

  // 计算实时碳排放
  async calculateRealTimeEmissions() {
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - TIME_CONSTANTS.FIVE_MINUTES).toISOString(); // 最近5分钟

      const response = await fetch(
        `${this.apiBaseUrl}/energy-data?start_time=${startTime}&end_time=${endTime}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('获取能源数据失败');
      }

      const result = await response.json();
      const energyData = result.data || [];

      const emissions = this.processEnergyDataForEmissions(energyData);

      // 更新排放数据
      this.updateEmissionData(emissions);

      return emissions;
    } catch (error) {
      logger.error('计算实时碳排放失败:', error);
      return [];
    }
  }

  // 处理能源数据计算排放
  processEnergyDataForEmissions(energyData) {
    const emissions = [];

    energyData.forEach((record) => {
      const { device_id, value, unit, timestamp } = record;
      const device = this.monitoringDevices.get(device_id);

      if (!device) {
        return;
      }

      const { energyType } = device;
      const carbonFactor = this.carbonFactors.get(energyType);

      if (!carbonFactor) {
        return;
      }

      // 单位转换和排放计算
      const normalizedValue = this.normalizeEnergyValue(value, unit, energyType);
      const emissionValue = normalizedValue * carbonFactor.value;

      const emission = {
        device_id,
        energy_type: energyType,
        energy_consumption: normalizedValue,
        emission_value: emissionValue,
        emission_unit: 'kgCO2e',
        carbon_factor: carbonFactor.value,
        timestamp: new Date(timestamp),
        calculation_method: 'direct'
      };

      emissions.push(emission);

      // 更新设备排放数据
      if (device) {
        device.lastEmission = emissionValue;
        device.totalEmission += emissionValue;
        device.lastUpdate = new Date(timestamp);
      }
    });

    return emissions;
  }

  // 标准化能源值
  normalizeEnergyValue(value, unit, energyType) {
    // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 41 行)

    // 将不同单位的能源消耗转换为标准单位
    const lowerUnit = unit.toLowerCase();

    switch (energyType) {
      case 'electricity':
        if (lowerUnit.includes('kwh')) {
          return value;
        }
        if (lowerUnit.includes('mwh')) {
          return value * CONVERSION_CONSTANTS.UNIT_CONVERSION_FACTOR;
        }
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (lowerUnit.includes('wh')) {
          return value / CONVERSION_CONSTANTS.UNIT_CONVERSION_FACTOR;
        }
        break;
      case 'natural_gas':
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (lowerUnit.includes('m³') || lowerUnit.includes('m3')) {
          return value;
        }
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (lowerUnit.includes('l')) {
          return value / CONVERSION_CONSTANTS.UNIT_CONVERSION_FACTOR;
        }
        break;
      case 'diesel':
      case 'gasoline':
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (lowerUnit.includes('l')) {
          return value;
        }
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (lowerUnit.includes('ml')) {
          return value / CONVERSION_CONSTANTS.UNIT_CONVERSION_FACTOR;
        }
        break;
      case 'coal':
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (lowerUnit.includes('kg')) {
          return value;
        }
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (lowerUnit.includes('t')) {
          return value * CONVERSION_CONSTANTS.UNIT_CONVERSION_FACTOR;
        }
        break;
    }

    return value; // 默认不转换
  }

  // 更新排放数据
  updateEmissionData(emissions) {
    const currentTime = new Date();
    const timeKey = currentTime.toISOString().slice(0, CONVERSION_CONSTANTS.TIME_SLICE_PRECISION); // 精确到分钟

    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (!this.emissionData.has(timeKey)) {
      this.emissionData.set(timeKey, {
        timestamp: currentTime,
        total_emission: 0,
        device_emissions: new Map(),
        energy_type_emissions: new Map()
      });
    }

    // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 28 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 24 行)

    const timeData = this.emissionData.get(timeKey);

    emissions.forEach((emission) => {
      const { device_id, energy_type, emission_value } = emission;

      // 累计总排放
      timeData.total_emission += emission_value;

      // 按设备累计
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (!timeData.device_emissions.has(device_id)) {
        timeData.device_emissions.set(device_id, 0);
      }
      timeData.device_emissions.set(
        device_id,
        timeData.device_emissions.get(device_id) + emission_value
      );

      // 按能源类型累计
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (!timeData.energy_type_emissions.has(energy_type)) {
        timeData.energy_type_emissions.set(energy_type, 0);
      }
      timeData.energy_type_emissions.set(
        energy_type,
        timeData.energy_type_emissions.get(energy_type) + emission_value
      );
    });

    // 保持最近24小时的数据
    this.cleanupOldEmissionData();

    // 触发排放数据更新事件
    this.emit('emissionDataUpdated', {
      timestamp: currentTime,
      emissions,
      totalEmission: timeData.total_emission
    });
  }

  // 清理旧的排放数据
  cleanupOldEmissionData() {
    const cutoffTime = new Date(Date.now() - TIME_CONSTANTS.ONE_DAY); // 24小时前

    for (const [currentTimeKey, data] of this.emissionData) {
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (data.timestamp < cutoffTime) {
        this.emissionData.delete(currentTimeKey);
      }
    }
  }

  // 获取排放统计
  getEmissionStatistics(timeRange = '24h') {
    const hours = this.parseTimeRange(timeRange) / TIME_CONSTANTS.ONE_HOUR;
    const cutoffTime = new Date(Date.now() - hours * TIME_CONSTANTS.ONE_HOUR);

    let totalEmission = 0;
    const deviceEmissions = new Map();
    const energyTypeEmissions = new Map();
    const hourlyEmissions = [];

    // 统计指定时间范围内的排放数据
    for (const [_timeKey, data] of this.emissionData) {
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (data.timestamp >= cutoffTime) {
        totalEmission += data.total_emission;

        // 按设备统计
        for (const [deviceId, emission] of data.device_emissions) {
          deviceEmissions.set(deviceId, (deviceEmissions.get(deviceId) || 0) + emission);
        }

        // 按能源类型统计
        for (const [energyType, emission] of data.energy_type_emissions) {
          energyTypeEmissions.set(
            energyType,
            (energyTypeEmissions.get(energyType) || 0) + emission
          );
        }

        // 按小时统计
        const hour = data.timestamp.getHours();
        const existingHourData = hourlyEmissions.find((h) => h.hour === hour);
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (existingHourData) {
          existingHourData.emission += data.total_emission;
        } else {
          hourlyEmissions.push({
            hour,
            emission: data.total_emission,
            timestamp: data.timestamp
          });
        }
      }
    }

    return {
      timeRange,
      totalEmission,
      averageEmissionRate: totalEmission / hours,
      deviceBreakdown: Array.from(deviceEmissions.entries()).map(([deviceId, emission]) => {
        const device = this.monitoringDevices.get(deviceId);
        return {
          deviceId,
          deviceName: device?.name || 'Unknown',
          emission,
          percentage: (emission / totalEmission) * PERCENTAGE_CONSTANTS.FULL_PERCENTAGE
        };
      }),
      energyTypeBreakdown: Array.from(energyTypeEmissions.entries()).map(
        ([energyType, emission]) => ({
          energyType,
          emission,
          percentage: (emission / totalEmission) * PERCENTAGE_CONSTANTS.FULL_PERCENTAGE
        })
      ),
      hourlyData: hourlyEmissions.sort((a, b) => a.hour - b.hour)
    };
  }

  // 检查减排目标进度
  checkReductionProgress() {
    const progress = [];

    for (const [targetId, target] of this.reductionTargets) {
      if (target.status !== 'active') {
        continue;
      }

      // 获取当前年度排放数据
      const currentYearEmission = this.getCurrentYearEmission();
      const baselineEmission = this.getBaselineEmission(target.baselineYear);

      if (baselineEmission > 0) {
        const actualReduction = ((baselineEmission - currentYearEmission) / baselineEmission) * PERCENTAGE_CONSTANTS.FULL_PERCENTAGE;
        const progressPercentage = (actualReduction / target.targetReduction) * PERCENTAGE_CONSTANTS.FULL_PERCENTAGE;

        progress.push({
          targetId,
          targetName: target.name,
          targetReduction: target.targetReduction,
          actualReduction,
          progressPercentage,
          status:
            progressPercentage >= PERCENTAGE_CONSTANTS.FULL_PERCENTAGE
              ? 'achieved'
              : progressPercentage >= PERCENTAGE_CONSTANTS.EFFICIENCY_THRESHOLD
                ? 'on_track'
                : 'behind',
          remainingReduction: Math.max(0, target.targetReduction - actualReduction)
        });
      }
    }

    return progress;
  }

  // 获取当前年度排放量
  getCurrentYearEmission() {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

    let totalEmission = 0;

    for (const [_timeKey, data] of this.emissionData) {
      if (data.timestamp >= yearStart && data.timestamp < yearEnd) {
        totalEmission += data.total_emission;
      }
    }

    // 如果数据不足一年，按比例估算
    const daysPassed = (Date.now() - yearStart.getTime()) / TIME_CONSTANTS.ONE_DAY;
    const estimatedAnnualEmission = (totalEmission / daysPassed) * TIME_CONSTANTS.DAYS_PER_YEAR;

    return estimatedAnnualEmission;
  }

  // 获取基线年排放量
  getBaselineEmission(_baselineYear) {
    // 这里应该从历史数据中获取基线年的排放量
    // 暂时返回模拟数据
    return RANGE_CONSTANTS.MAX_EMISSION_THRESHOLD; // kgCO2e
  }

  // 生成减排建议
  generateReductionSuggestions() {
    const statistics = this.getEmissionStatistics('24h');
    const suggestions = [];

    // 基于能源类型的建议
    statistics.energyTypeBreakdown.forEach((item) => {
     if (item.percentage > RANGE_CONSTANTS.PRIORITY_LEVELS + RANGE_CONSTANTS.PERCENTAGE_THRESHOLD_OFFSET) {
        suggestions.push({
          type: 'energy_substitution',
          priority: 'high',
          title: `减少${item.energyType}使用`,
          description: `${item.energyType}占总排放的${item.percentage.toFixed(1)}%，建议寻找清洁替代方案`,
          potentialReduction: `预计可减少${(item.emission * PERCENTAGE_CONSTANTS.REDUCTION_FACTOR).toFixed(1)} kgCO2e`,
          actions: this.getEnergyTypeReductionActions(item.energyType)
        });
      }
    });

    // 基于设备的建议
    const topEmitters = statistics.deviceBreakdown
      .sort((a, b) => b.emission - a.emission)
      .slice(0, RANGE_CONSTANTS.SUGGESTION_COUNT);

    topEmitters.forEach((device) => {
      if (device.percentage > RANGE_CONSTANTS.PRIORITY_LEVELS) {
        suggestions.push({
          type: 'device_optimization',
          priority: 'medium',
          title: `优化设备 ${device.deviceName}`,
          description: `该设备占总排放的${device.percentage.toFixed(1)}%，建议进行优化`,
          potentialReduction: `预计可减少${(device.emission * PERCENTAGE_CONSTANTS.IMPROVEMENT_FACTOR).toFixed(1)} kgCO2e`,
          actions: ['检查设备运行效率', '优化运行时间', '考虑设备升级']
        });
      }
    });

    return suggestions;
  }

  // 获取能源类型减排措施
  getEnergyTypeReductionActions(energyType) {
    const actions = {
      electricity: ['安装太阳能发电系统', '使用节能设备', '实施智能用电管理', '购买绿色电力'],
      natural_gas: ['提高燃烧效率', '改善保温措施', '考虑电气化改造', '使用生物天然气'],
      diesel: ['使用电动车辆', '优化运输路线', '使用生物柴油', '提高燃油效率'],
      coal: ['淘汰燃煤设备', '改用清洁能源', '提高燃烧效率', '安装排放控制设备']
    };

    return actions[energyType] || ['寻找清洁替代方案', '提高使用效率'];
  }

  // 开始监控
  startMonitoring(interval = TIME_CONSTANTS.MONITORING_INTERVAL) {
    // 默认1分钟
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.calculateRealTimeEmissions();

        // 检查减排目标进度
        const progress = this.checkReductionProgress();
        this.emit('reductionProgressUpdated', progress);
      } catch (error) {
        logger.error('碳排放监控失败:', error);
      }
    }, interval);
  }

  // 停止监控
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // 解析时间范围
  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'h':
        return value * TIME_CONSTANTS.ONE_HOUR;
      case 'd':
        return value * TIME_CONSTANTS.ONE_DAY;
      case 'm':
        return value * TIME_CONSTANTS.FIVE_MINUTES / RANGE_CONSTANTS.TIME_RANGE_DIVISOR;
      default:
        return TIME_CONSTANTS.ONE_HOUR;
    }
  }

  // 获取碳排放因子
  getCarbonFactors() {
    return Array.from(this.carbonFactors.values());
  }

  // 获取减排目标
  getReductionTargets() {
    return Array.from(this.reductionTargets.values());
  }

  // 清理资源
  dispose() {
    this.stopMonitoring();
    this.removeAllListeners();
    this.carbonFactors.clear();
    this.emissionData.clear();
    this.reductionTargets.clear();
    this.monitoringDevices.clear();
  }
}

export default CarbonMonitor;
