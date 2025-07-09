import Recommendation from '../models/recommendation.js';
import EnergyData from '../models/energyData.js';
import CarbonData from '../models/carbonData.js';
import Device from '../models/Device.js';
import StorageDevice from '../models/storageDevice.js';
import { Op } from 'sequelize';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
/* eslint-disable no-console, no-magic-numbers */

/**
 * 推荐服务类，处理推荐规则评估和建议生成
 */
class RecommendationService {
  /**
   * 基于系统数据生成推荐
   * @param {Object} userContext - 用户上下文
   * @returns {Promise<Array>} 推荐结果列表
   */
  static async generateSystemRecommendations(userContext) {
    // 获取系统数据
    const systemData = await this._collectSystemData(userContext);

    // 丰富用户上下文
    const enrichedContext = {
      ...userContext,
      ...systemData
    };

    // 使用推荐模型生成推荐
    const recommendations = await Recommendation.generateRecommendations(enrichedContext);

    // 增强推荐内容
    const enhancedRecommendations = await this._enhanceRecommendations(recommendations);

    return enhancedRecommendations;
  }

  /**
   * 收集系统数据用于推荐
   * @param {Object} userContext - 用户上下文
   * @returns {Promise<Object>} 系统数据
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  static async _collectSystemData(userContext) {
    const { parkId, buildingId, timeRange = '7d' } = userContext;
    const endDate = new Date();
    const startDate = moment().subtract(this._parseTimeRange(timeRange), 'days').toDate();

    // 并行收集各类数据
    const [energyConsumption, carbonEmissions, deviceStatus, storageDevices, peakLoadData] =
      await Promise.all([
        this._getEnergyConsumption(parkId, buildingId, startDate, endDate),
        this._getCarbonEmissions(parkId, buildingId, startDate, endDate),
        this._getDeviceStatus(parkId, buildingId),
        this._getStorageDevices(parkId, buildingId),
        this._getPeakLoadData(parkId, buildingId, startDate, endDate)
      ]);

    return {
      energyConsumption,
      carbonEmissions,
      deviceStatus,
      storageDevices,
      peakLoadData,
      timeRange,
      currentTime: new Date()
    };
  }

  /**
   * 解析时间范围字符串
   * @param {string} timeRange - 时间范围字符串，如 '7d' 表示7天
   * @returns {number} 天数
   */
  static _parseTimeRange(timeRange) {
    const days = parseInt(timeRange.replace('d', ''), 10);
    return isNaN(days) ? 7 : days;
  }

  /**
   * 获取能源消耗数据
   * @param {string} parkId - 园区ID
   * @param {string} buildingId - 建筑ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 能源消耗数据
   */
  static async _getEnergyConsumption(parkId, buildingId, startDate, endDate) {
    // 构建查询条件
    const whereClause = { timestamp: { [Op.between]: [startDate, endDate] } };
    if (parkId) {
      whereClause.park_id = parkId;
    }
    if (buildingId) {
      whereClause.building_id = buildingId;
    }

    // 查询能源数据
    const energyData = await EnergyData.findAll({
      where: whereClause,
      attributes: [
        [
          EnergyData.sequelize.fn('strftime', '%Y-%m-%d', EnergyData.sequelize.col('timestamp')),
          'date'
        ],
        [EnergyData.sequelize.fn('SUM', EnergyData.sequelize.col('value')), 'total_consumption'],
        'type'
      ],
      group: ['date', 'type'],
      order: [['date', 'ASC']]
    });

    // 格式化数据
    const formattedData = {};
    energyData.forEach((item) => {
      const date = item.get('date');
      const type = item.get('type');
      const consumption = parseFloat(item.get('total_consumption'));

      if (!formattedData[date]) {
        formattedData[date] = {};
      }
      formattedData[date][type] = consumption;
    });

    // 计算平均值和趋势
    const dailyAverages = {};
    const energyTypes = new Set();

    Object.values(formattedData).forEach((dailyData) => {
      Object.entries(dailyData).forEach(([type, value]) => {
        energyTypes.add(type);
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (!dailyAverages[type]) {
          dailyAverages[type] = [];
        }
        dailyAverages[type].push(value);
      });
    });

    const trends = {};
    Object.entries(dailyAverages).forEach(([type, values]) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const recentAvg =
        values.slice(-3).reduce((sum, val) => sum + val, 0) / Math.min(3, values.length);
      trends[type] = {
        average: avg,
        recentAverage: recentAvg,
        trend: recentAvg > avg ? 'increasing' : recentAvg < avg ? 'decreasing' : 'stable',
        changeRate: avg ? Math.abs((recentAvg - avg) / avg) : 0
      };
    });

    return {
      dailyData: formattedData,
      trends,
      types: Array.from(energyTypes)
    };
  }

  /**
   * 获取碳排放数据
   * @param {string} parkId - 园区ID
   * @param {string} buildingId - 建筑ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 碳排放数据
   */
  static async _getCarbonEmissions(parkId, buildingId, startDate, endDate) {
    // 构建查询条件
    const whereClause = { timestamp: { [Op.between]: [startDate, endDate] } };
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (parkId) {
      whereClause.park_id = parkId;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (buildingId) {
      whereClause.building_id = buildingId;
    }

    // 查询碳排放数据
    const carbonData = await CarbonData.findAll({
      where: whereClause,
      attributes: [
        [
          CarbonData.sequelize.fn('strftime', '%Y-%m-%d', CarbonData.sequelize.col('timestamp')),
          'date'
        ],
        [CarbonData.sequelize.fn('SUM', CarbonData.sequelize.col('value')), 'total_emissions']
      ],
      group: ['date'],
      order: [['date', 'ASC']]
    });

    // 格式化数据
    const dailyData = {};
    carbonData.forEach((item) => {
      dailyData[item.get('date')] = parseFloat(item.get('total_emissions'));
    });

    // 计算趋势
    const values = Object.values(dailyData);
    const avg = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    const recentValues = values.slice(-3);
    const recentAvg = recentValues.length
      ? recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
      : 0;
    const trend = recentAvg > avg ? 'increasing' : recentAvg < avg ? 'decreasing' : 'stable';
    const changeRate = avg ? Math.abs((recentAvg - avg) / avg) : 0;

    return {
      dailyData,
      average: avg,
      recentAverage: recentAvg,
      trend,
      changeRate,
      total: values.reduce((sum, val) => sum + val, 0)
    };
  }

  /**
   * 获取设备状态
   * @param {string} parkId - 园区ID
   * @param {string} buildingId - 建筑ID
   * @returns {Promise<Object>} 设备状态数据
   */
  static async _getDeviceStatus(parkId, buildingId) {
    // 构建查询条件
    const whereClause = {};
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (parkId) {
      whereClause.park_id = parkId;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (buildingId) {
      whereClause.building_id = buildingId;
    }

    // 查询设备
    const devices = await Device.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'type', 'status', 'last_active', 'efficiency', 'model']
    });

    // 分类统计
    const statusCounts = {
      online: 0,
      offline: 0,
      warning: 0,
      error: 0
    };

    const typeCounts = {};
    const inefficientDevices = [];
    const offlineDevices = [];

    devices.forEach((device) => {
      const status = device.status || 'unknown';
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }

      const type = device.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      // 标记效率低下的设备
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (device.efficiency && device.efficiency < 0.7) {
        inefficientDevices.push(device);
      }

      // 标记离线设备
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (status === 'offline' && device.last_active) {
        const lastActive = new Date(device.last_active);
        const hoursSinceActive = (new Date() - lastActive) / (1000 * 60 * 60);
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        // TODO: 考虑使用早期返回或策略模式来减少嵌套
        if (hoursSinceActive > 2) {
          offlineDevices.push({
            ...device.toJSON(),
            hoursOffline: hoursSinceActive
          });
        }
      }
    });

    return {
      total: devices.length,
      statusCounts,
      typeCounts,
      inefficientDevices,
      offlineDevices
    };
  }

  /**
   * 获取储能设备数据
   * @param {string} parkId - 园区ID
   * @param {string} buildingId - 建筑ID
   * @returns {Promise<Array>} 储能设备列表
   */
  static async _getStorageDevices(parkId, buildingId) {
    // 先查询设备
    const whereClause = { type: 'energy_storage' };
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (parkId) {
      whereClause.park_id = parkId;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (buildingId) {
      whereClause.building_id = buildingId;
    }

    const storageDevices = await Device.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'status', 'last_active']
    });

    // 获取详细参数
    const detailedDevices = await Promise.all(
      storageDevices.map(async (device) => {
        const params = await StorageDevice.findByDeviceId(device.id);
        return {
          ...device.toJSON(),
          params
        };
      })
    );

    return detailedDevices;
  }

  /**
   * 获取峰值负荷数据
   * @param {string} parkId - 园区ID
   * @param {string} buildingId - 建筑ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 峰值负荷数据
   */
  static async _getPeakLoadData(parkId, buildingId, startDate, endDate) {
    // 构建查询条件
    const whereClause = { timestamp: { [Op.between]: [startDate, endDate] } };
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (parkId) {
      whereClause.park_id = parkId;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (buildingId) {
      whereClause.building_id = buildingId;
    }

    // 查询电力数据
    const electricityData = await EnergyData.findAll({
      where: {
        ...whereClause,
        type: 'electricity'
      },
      attributes: ['timestamp', 'value'],
      order: [['timestamp', 'ASC']]
    });

    // 按小时聚合
    const hourlyData = {};
    electricityData.forEach((item) => {
      const hour = moment(item.timestamp).format('YYYY-MM-DD HH:00');
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(parseFloat(item.value));
    });

    // 计算每小时平均值
    const hourlyAverages = {};
    Object.entries(hourlyData).forEach(([hour, values]) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      hourlyAverages[hour] = avg;
    });

    // 找出峰值时段
    const sortedHours = Object.entries(hourlyAverages).sort((a, b) => b[1] - a[1]);
    const peakHours = sortedHours.slice(0, 5).map(([hour, value]) => ({
      hour: hour.split(' ')[1],
      averageLoad: value,
      date: hour.split(' ')[0]
    }));

    // 找出用电高峰时段（小时）
    const hourDistribution = {};
    for (let i = 0; i < 24; i++) {
      hourDistribution[i] = [];
    }

    Object.entries(hourlyAverages).forEach(([hour, value]) => {
      const hourOfDay = parseInt(hour.split(' ')[1].split(':')[0], 10);
      hourDistribution[hourOfDay].push(value);
    });

    const hourlyDistribution = {};
    Object.entries(hourDistribution).forEach(([hour, values]) => {
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (values.length) {
        hourlyDistribution[hour] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    });

    // 找出用电高峰时段
    const peakHour = Object.entries(hourlyDistribution).sort((a, b) => b[1] - a[1])[0] || [0, 0];

    return {
      hourlyAverages,
      peakHours,
      peakHour: parseInt(peakHour[0], 10),
      peakLoad: peakHour[1]
    };
  }

  /**
   * 增强推荐内容，添加具体数据和实施步骤
   * @param {Array} recommendations - 原始推荐列表
   * @returns {Promise<Array>} 增强后的推荐列表
   */
  static async _enhanceRecommendations(recommendations) {
    return Promise.all(
      recommendations.map(async (recommendation) => {
        // 根据推荐类型添加具体内容
        let details = {};

        // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)

        // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)

        // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)

        // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)

        let implementationSteps = [];
        let potentialSavings = {};

        switch (recommendation.type) {
          case 'energy_saving':
            details = await this._calculateEnergySavingDetails(recommendation);
            implementationSteps = this._getEnergySavingSteps(recommendation);
            potentialSavings = await this._estimateEnergySavings(recommendation);
            break;
          case 'cost_reduction':
            details = await this._calculateCostReductionDetails(recommendation);
            implementationSteps = this._getCostReductionSteps(recommendation);
            potentialSavings = await this._estimateCostSavings(recommendation);
            break;
          case 'maintenance':
            details = await this._getMaintenanceDetails(recommendation);
            implementationSteps = this._getMaintenanceSteps(recommendation);
            potentialSavings = await this._estimateMaintenanceSavings(recommendation);
            break;
          default:
            details = { description: '推荐详情正在计算中' };
            implementationSteps = [
              '查看推荐详情',
              '评估实施难度',
              '制定实施计划',
              '执行推荐措施',
              '验证实施效果'
            ];
        }

        return {
          ...recommendation,
          details,
          implementationSteps,
          potentialSavings,
          estimatedImplementationTime: this._estimateImplementationTime(recommendation)
        };
      })
    );
  }

  /**
   * 估算实施时间
   * @param {Object} recommendation - 推荐
   * @returns {string} 估算时间
   */
  static _estimateImplementationTime(recommendation) {
    // 根据优先级和类型估算实施时间
    const baseHours = recommendation.priority >= 8 ? 2 : recommendation.priority >= 5 ? 4 : 8;
    const typeFactor = recommendation.type === 'maintenance' ? 0.8 : 1;
    const hours = Math.round(baseHours * typeFactor);

    return hours <= 1 ? '1小时以内' : `${hours}小时`;
  }

  /**
   * 计算节能推荐详情
   * @param {Object} recommendation - 推荐
   * @returns {Promise<Object>} 节能详情
   */
  static async _calculateEnergySavingDetails(recommendation) {
    // 这里应该有更复杂的计算逻辑
    return {
      currentConsumption: Math.round(Math.random() * 1000),
      potentialReduction: Math.round(Math.random() * 30 + 10),
      unit: 'kWh/天',
      affectedDevices: recommendation.actions?.deviceIds?.length || 1
    };
  }

  /**
   * 获取节能实施步骤
   * @param {Object} recommendation - 推荐
   * @returns {Array} 实施步骤
   */
  static _getEnergySavingSteps(recommendation) {
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (recommendation.actions?.type === 'schedule_adjustment') {
      return [
        '分析当前设备运行时间表',
        '调整设备运行时段至非高峰时段',
        '设置新的设备运行计划',
        '监控调整后的能耗变化',
        '根据效果微调运行计划'
      ];
    } else if (recommendation.actions?.type === 'device_adjustment') {
      return [
        '检查目标设备当前设置',
        '调整设备参数至优化值',
        '测试调整后的设备运行状态',
        '记录能耗变化数据',
        '确认节能效果'
      ];
    }

    return [
      '评估当前能源使用情况',
      '制定节能措施实施计划',
      '实施节能措施',
      '监控能源消耗变化',
      '优化调整节能措施'
    ];
  }

  /**
   * 估算节能效果
   * @param {Object} recommendation - 推荐
   * @returns {Promise<Object>} 节能估算
   */
  static async _estimateEnergySavings(_recommendation) {
    // 这里应该有更复杂的估算逻辑
    const dailySavings = Math.round(Math.random() * 50 + 10);
    return {
      daily: dailySavings,
      monthly: Math.round(dailySavings * 30),
      annual: Math.round(dailySavings * 365),
      unit: 'kWh',
      carbonReduction: Math.round((dailySavings * 0.5 * 365) / 1000) // 粗略估算碳排放减少
    };
  }

  /**
   * 计算成本降低详情
   * @param {Object} recommendation - 推荐
   * @returns {Promise<Object>} 成本详情
   */
  static async _calculateCostReductionDetails(_recommendation) {
    // 这里应该有更复杂的计算逻辑
    return {
      currentCost: Math.round(Math.random() * 1000 + 500),
      potentialReductionPercent: Math.round(Math.random() * 20 + 5),
      unit: '元/月'
    };
  }

  /**
   * 获取成本降低实施步骤
   * @param {Object} recommendation - 推荐
   * @returns {Array} 实施步骤
   */
  static _getCostReductionSteps() {
    return [
      '分析当前能源成本结构',
      '识别成本优化机会',
      '制定成本优化方案',
      '实施成本优化措施',
      '监控成本变化并调整'
    ];
  }

  /**
   * 估算成本节约
   * @param {Object} recommendation - 推荐
   * @returns {Promise<Object>} 成本节约估算
   */
  static async _estimateCostSavings(_recommendation) {
    // 这里应该有更复杂的估算逻辑
    const monthlySavings = Math.round(Math.random() * 500 + 100);
    return {
      daily: Math.round(monthlySavings / 30),
      monthly: monthlySavings,
      annual: Math.round(monthlySavings * 12),
      unit: '元'
    };
  }

  /**
   * 获取维护详情
   * @param {Object} recommendation - 推荐
   * @returns {Promise<Object>} 维护详情
   */
  static async _getMaintenanceDetails(recommendation) {
    // 这里应该有更复杂的逻辑
    return {
      deviceName: recommendation.actions?.deviceName || '目标设备',
      issue: recommendation.actions?.issue || '潜在故障风险',
      urgency: recommendation.priority >= 8 ? '高' : recommendation.priority >= 5 ? '中' : '低',
      estimatedCost: Math.round(Math.random() * 1000 + 200),
      estimatedDowntime: Math.round(Math.random() * 4 + 1) // 小时
    };
  }

  /**
   * 获取维护实施步骤
   * @param {Object} recommendation - 推荐
   * @returns {Array} 实施步骤
   */
  static _getMaintenanceSteps() {
    return [
      '准备维护工具和备件',
      '安排维护时间窗口',
      '执行维护操作',
      '测试设备运行状态',
      '记录维护结果'
    ];
  }

  /**
   * 估算维护节约
   * @param {Object} recommendation - 推荐
   * @returns {Promise<Object>} 维护节约估算
   */
  static async _estimateMaintenanceSavings() {
    // 这里应该有更复杂的估算逻辑
    const potentialCost = Math.round(Math.random() * 5000 + 1000);
    return {
      potentialFailureCost: potentialCost,
      maintenanceCost: Math.round(potentialCost * 0.2),
      savings: potentialCost - Math.round(potentialCost * 0.2),
      unit: '元'
    };
  }

  /**
   * 评估推荐实施效果
   * @param {string} recommendationId - 推荐ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 评估结果
   */
  static async evaluateRecommendationEffectiveness(recommendationId, startDate, endDate) {
    // 获取推荐详情 - 模拟数据库查询
    const recommendation = {
      id: recommendationId,
      type: 'energy_saving',
      title: '模拟推荐',
      description: '这是一个模拟的推荐项目'
    };
    if (!recommendation) {
      throw new Error('推荐不存在');
    }

    // 获取推荐应用前的数据

    // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

    const preStartDate = moment(startDate).subtract(1, 'month').toDate();
    const preEndDate = moment(startDate).subtract(1, 'day').toDate();

    // 根据推荐类型评估效果
    let evaluation = {};

    switch (recommendation.type) {
      case 'energy_saving':
        evaluation = await this._evaluateEnergySavingEffectiveness(
          recommendation,
          preStartDate,
          preEndDate,
          startDate,
          endDate
        );
        break;
      case 'cost_reduction':
        evaluation = await this._evaluateCostReductionEffectiveness(
          recommendation,
          preStartDate,
          preEndDate,
          startDate,
          endDate
        );
        break;
      default:
        evaluation = {
          status: 'not_evaluated',
          message: '暂不支持该类型推荐的自动评估'
        };
    }

    // 保存评估结果 - 模拟保存
    const evaluationRecord = {
      id: uuidv4(),
      recommendation_id: recommendationId,
      evaluation_data: JSON.stringify(evaluation),
      evaluated_at: new Date()
    };
    console.log('评估结果已保存:', evaluationRecord.id);

    return evaluation;
  }
}

export default RecommendationService;
