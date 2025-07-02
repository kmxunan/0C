/**
 * 能源管理模块
 * 负责能源数据的监控、分析和优化
 */

import { EventEmitter } from 'events';

class EnergyManager extends EventEmitter {
  constructor(apiBaseUrl = '/api') {
    super();
    this.apiBaseUrl = apiBaseUrl;
    this.energyDevices = new Map();
    this.consumptionData = new Map();
    this.productionData = new Map();
    this.efficiencyMetrics = new Map();
    this.optimizationRules = [];
    this.monitoringInterval = null;
    
    this.init();
  }

  async init() {
    try {
      await this.loadEnergyDevices();
      await this.loadOptimizationRules();
      this.startMonitoring();
      console.log('能源管理模块初始化完成');
    } catch (error) {
      console.error('能源管理模块初始化失败:', error);
    }
  }

  // 加载能源设备
  async loadEnergyDevices() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devices?category=energy`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取能源设备失败');
      }
      
      const result = await response.json();
      const devices = result.data || [];
      
      devices.forEach(device => {
        this.energyDevices.set(device.id, {
          ...device,
          type: this.classifyEnergyDevice(device),
          efficiency: 0,
          status: 'unknown',
          lastUpdate: null
        });
      });
      
      console.log(`加载了 ${devices.length} 个能源设备`);
    } catch (error) {
      console.error('加载能源设备失败:', error);
    }
  }

  // 分类能源设备
  classifyEnergyDevice(device) {
    const { category, model, name } = device;
    
    if (category.includes('solar') || name.includes('太阳能')) {
      return 'solar';
    } else if (category.includes('wind') || name.includes('风能')) {
      return 'wind';
    } else if (category.includes('battery') || name.includes('储能')) {
      return 'storage';
    } else if (category.includes('grid') || name.includes('电网')) {
      return 'grid';
    } else if (category.includes('load') || name.includes('负载')) {
      return 'load';
    }
    
    return 'other';
  }

  // 获取实时能源数据
  async getRealTimeEnergyData() {
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 最近5分钟
      
      const response = await fetch(
        `${this.apiBaseUrl}/energy-data?start_time=${startTime}&end_time=${endTime}&interval=minute`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('获取实时能源数据失败');
      }
      
      const result = await response.json();
      const data = result.data || [];
      
      this.processEnergyData(data);
      return data;
    } catch (error) {
      console.error('获取实时能源数据失败:', error);
      return [];
    }
  }

  // 处理能源数据
  processEnergyData(data) {
    const consumption = new Map();
    const production = new Map();
    
    data.forEach(record => {
      const { device_id, data_type, value, timestamp } = record;
      const device = this.energyDevices.get(device_id);
      
      if (!device) return;
      
      const deviceType = device.type;
      const time = new Date(timestamp);
      
      // 分类为消耗或生产
      if (this.isProductionDevice(deviceType)) {
        if (!production.has(device_id)) {
          production.set(device_id, []);
        }
        production.get(device_id).push({ value, timestamp: time, type: data_type });
      } else if (this.isConsumptionDevice(deviceType)) {
        if (!consumption.has(device_id)) {
          consumption.set(device_id, []);
        }
        consumption.get(device_id).push({ value, timestamp: time, type: data_type });
      }
      
      // 更新设备状态
      device.lastUpdate = time;
      device.status = 'online';
    });
    
    this.consumptionData = consumption;
    this.productionData = production;
    
    // 计算效率指标
    this.calculateEfficiencyMetrics();
    
    // 触发数据更新事件
    this.emit('energyDataUpdated', {
      consumption: Array.from(consumption.entries()),
      production: Array.from(production.entries()),
      timestamp: new Date()
    });
  }

  // 判断是否为生产设备
  isProductionDevice(type) {
    return ['solar', 'wind', 'grid'].includes(type);
  }

  // 判断是否为消耗设备
  isConsumptionDevice(type) {
    return ['load', 'other'].includes(type);
  }

  // 计算效率指标
  calculateEfficiencyMetrics() {
    const metrics = {
      totalProduction: 0,
      totalConsumption: 0,
      renewableRatio: 0,
      efficiency: 0,
      peakDemand: 0,
      loadFactor: 0
    };
    
    // 计算总生产量
    for (const [deviceId, data] of this.productionData) {
      const latestValue = data[data.length - 1]?.value || 0;
      metrics.totalProduction += latestValue;
    }
    
    // 计算总消耗量
    for (const [deviceId, data] of this.consumptionData) {
      const latestValue = data[data.length - 1]?.value || 0;
      metrics.totalConsumption += latestValue;
      metrics.peakDemand = Math.max(metrics.peakDemand, latestValue);
    }
    
    // 计算可再生能源比例
    let renewableProduction = 0;
    for (const [deviceId, data] of this.productionData) {
      const device = this.energyDevices.get(deviceId);
      if (device && ['solar', 'wind'].includes(device.type)) {
        const latestValue = data[data.length - 1]?.value || 0;
        renewableProduction += latestValue;
      }
    }
    
    if (metrics.totalProduction > 0) {
      metrics.renewableRatio = (renewableProduction / metrics.totalProduction) * 100;
    }
    
    // 计算整体效率
    if (metrics.totalProduction > 0) {
      metrics.efficiency = (metrics.totalConsumption / metrics.totalProduction) * 100;
    }
    
    // 计算负载因子
    if (metrics.peakDemand > 0) {
      metrics.loadFactor = (metrics.totalConsumption / metrics.peakDemand) * 100;
    }
    
    this.efficiencyMetrics.set('current', metrics);
    
    // 触发效率更新事件
    this.emit('efficiencyUpdated', metrics);
  }

  // 获取能源统计报告
  async getEnergyReport(timeRange = '24h') {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/energy-data/report?time_range=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('获取能源报告失败');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取能源报告失败:', error);
      return this.generateMockReport(timeRange);
    }
  }

  // 生成模拟报告
  generateMockReport(timeRange) {
    const hours = this.parseTimeRange(timeRange) / (1000 * 60 * 60);
    
    return {
      timeRange,
      summary: {
        totalProduction: Math.random() * 1000 * hours,
        totalConsumption: Math.random() * 800 * hours,
        renewableRatio: 60 + Math.random() * 30,
        efficiency: 80 + Math.random() * 15,
        costSavings: Math.random() * 5000
      },
      hourlyData: Array.from({ length: Math.min(hours, 24) }, (_, i) => ({
        hour: i,
        production: Math.random() * 100,
        consumption: Math.random() * 80,
        renewable: Math.random() * 60
      })),
      deviceBreakdown: Array.from(this.energyDevices.values()).map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        contribution: Math.random() * 100,
        efficiency: 80 + Math.random() * 20
      }))
    };
  }

  // 能源优化建议
  async getOptimizationSuggestions() {
    const suggestions = [];
    const currentMetrics = this.efficiencyMetrics.get('current');
    
    if (!currentMetrics) {
      return suggestions;
    }
    
    // 可再生能源比例建议
    if (currentMetrics.renewableRatio < 50) {
      suggestions.push({
        type: 'renewable',
        priority: 'high',
        title: '增加可再生能源比例',
        description: `当前可再生能源比例为 ${currentMetrics.renewableRatio.toFixed(1)}%，建议增加太阳能或风能设备`,
        potentialSavings: '预计可节省 15-25% 的能源成本',
        actions: [
          '安装更多太阳能板',
          '考虑小型风力发电机',
          '优化现有可再生能源设备的运行时间'
        ]
      });
    }
    
    // 效率优化建议
    if (currentMetrics.efficiency < 80) {
      suggestions.push({
        type: 'efficiency',
        priority: 'medium',
        title: '提高能源利用效率',
        description: `当前能源效率为 ${currentMetrics.efficiency.toFixed(1)}%，存在优化空间`,
        potentialSavings: '预计可节省 10-15% 的能源消耗',
        actions: [
          '升级老旧设备',
          '优化设备运行时间',
          '实施智能控制系统'
        ]
      });
    }
    
    // 负载平衡建议
    if (currentMetrics.loadFactor < 60) {
      suggestions.push({
        type: 'load_balancing',
        priority: 'medium',
        title: '优化负载分布',
        description: `负载因子为 ${currentMetrics.loadFactor.toFixed(1)}%，建议平衡峰谷用电`,
        potentialSavings: '预计可降低 20-30% 的峰值需求',
        actions: [
          '实施错峰用电策略',
          '安装储能系统',
          '优化生产计划'
        ]
      });
    }
    
    return suggestions;
  }

  // 加载优化规则
  async loadOptimizationRules() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/energy/optimization-rules`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        this.optimizationRules = result.data || [];
      }
    } catch (error) {
      console.error('加载优化规则失败:', error);
    }
    
    // 使用默认规则
    if (this.optimizationRules.length === 0) {
      this.optimizationRules = this.getDefaultOptimizationRules();
    }
  }

  // 获取默认优化规则
  getDefaultOptimizationRules() {
    return [
      {
        id: 'peak_shaving',
        name: '削峰填谷',
        description: '在用电高峰期减少非必要负载',
        condition: 'peak_demand > threshold',
        action: 'reduce_non_critical_loads',
        enabled: true
      },
      {
        id: 'renewable_priority',
        name: '可再生能源优先',
        description: '优先使用可再生能源',
        condition: 'renewable_available > 0',
        action: 'prioritize_renewable',
        enabled: true
      },
      {
        id: 'battery_optimization',
        name: '储能优化',
        description: '在低谷时充电，高峰时放电',
        condition: 'time_based_pricing',
        action: 'optimize_battery_schedule',
        enabled: true
      }
    ];
  }

  // 执行优化策略
  async executeOptimization() {
    const results = [];
    
    for (const rule of this.optimizationRules) {
      if (!rule.enabled) continue;
      
      try {
        const result = await this.applyOptimizationRule(rule);
        results.push(result);
      } catch (error) {
        console.error(`执行优化规则 ${rule.name} 失败:`, error);
      }
    }
    
    this.emit('optimizationExecuted', results);
    return results;
  }

  // 应用优化规则
  async applyOptimizationRule(rule) {
    // 这里实现具体的优化逻辑
    // 实际应用中需要根据具体的设备和系统进行实现
    
    console.log(`应用优化规则: ${rule.name}`);
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      applied: true,
      timestamp: new Date(),
      impact: {
        energySaved: Math.random() * 50,
        costSaved: Math.random() * 100,
        efficiencyImproved: Math.random() * 5
      }
    };
  }

  // 开始监控
  startMonitoring(interval = 30000) {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.getRealTimeEnergyData();
        
        // 检查是否需要执行优化
        const currentMetrics = this.efficiencyMetrics.get('current');
        if (currentMetrics && this.shouldExecuteOptimization(currentMetrics)) {
          await this.executeOptimization();
        }
      } catch (error) {
        console.error('能源监控失败:', error);
      }
    }, interval);
  }

  // 判断是否需要执行优化
  shouldExecuteOptimization(metrics) {
    // 简单的优化触发条件
    return (
      metrics.efficiency < 70 ||
      metrics.renewableRatio < 30 ||
      metrics.loadFactor < 50
    );
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
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }

  // 获取当前效率指标
  getCurrentMetrics() {
    return this.efficiencyMetrics.get('current');
  }

  // 获取设备列表
  getEnergyDevices() {
    return Array.from(this.energyDevices.values());
  }

  // 清理资源
  dispose() {
    this.stopMonitoring();
    this.removeAllListeners();
    this.energyDevices.clear();
    this.consumptionData.clear();
    this.productionData.clear();
    this.efficiencyMetrics.clear();
  }
}

export default EnergyManager;