import express from 'express';
// 引入必要的模块
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 定义能源类型常量
export const ENERGY_TYPES = {
  ELECTRICITY: 'electricity',      // 电力
  DIESEL: 'diesel',              // 柴油
  NATURAL_GAS: 'natural_gas',    // 天然气
  SOLAR: 'solar'                 // 光伏
};

// 定义能源消耗数据样本
export const energyConsumptionData = [
  {
    buildingId: 'B1',
    timestamp: new Date('2023-06-01T00:00:00Z'),
    energyType: ENERGY_TYPES.ELECTRICITY,
    consumption: 1500, // 千瓦时
    carbonEmission: 0.5 // 吨CO2
  },
  {
    buildingId: 'B1',
    timestamp: new Date('2023-06-01T00:00:00Z'),
    energyType: ENERGY_TYPES.SOLAR,
    consumption: 200, // 千瓦时
    carbonEmission: 0.0 // 吨CO2
  }
];

// 计算单个数据点的碳排放量
function calculateEmission(dataPoint) {
  // 使用默认碳排放因子（避免数据库查询）
  const defaultCarbonFactors = {
    'electricity': 0.5968,  // 电力碳排放因子 (kg CO2/kWh)
    'diesel': 2.68,         // 柴油碳排放因子 (kg CO2/L)
    'natural_gas': 2.03,    // 天然气碳排放因子 (kg CO2/m³)
    'solar': 0.0            // 光伏碳排放因子 (kg CO2/kWh)
  };
  
  const carbonFactor = defaultCarbonFactors[dataPoint.energyType] || 0.5968;
  return dataPoint.consumption * carbonFactor;
}

// 验证时间范围有效性
function validateTimeRange(start_time, end_time) {
  // 验证开始时间是否早于结束时间
  if (start_time >= end_time) {
    throw new Error('开始时间必须早于结束时间');
  }
  
  // 验证时间范围是否超过限制（例如不能超过1年）
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  if (end_time - start_time > oneYearInMs) {
    throw new Error('时间范围不能超过一年');
  }
}

// 计算指定时间范围内的总碳排放量
function calculateTotalEmissions(startTime, endTime) {
  // 过滤指定时间范围内的能源消耗数据
  const filteredData = energyConsumptionData.filter(dataPoint => {
    return dataPoint.timestamp >= startTime && dataPoint.timestamp <= endTime;
  });
  
  // 计算总碳排放量
  let totalEmissions = 0;
  
  filteredData.forEach(dataPoint => {
    totalEmissions += calculateEmission(dataPoint);
  });
  
  // 返回总碳排放量
  return totalEmissions;
}

// 计算详细的碳排放明细
function calculateEmissionDetails(startTime, endTime) {
  // 过滤指定时间范围内的能源消耗数据
  const filteredData = energyConsumptionData.filter(dataPoint => {
    return dataPoint.timestamp >= startTime && dataPoint.timestamp <= endTime;
  });
  
  // 按能源类型分类统计
  const emissionDetails = {};
  let totalEmissions = 0;
  
  filteredData.forEach(dataPoint => {
    const emission = calculateEmission(dataPoint);
    if (!emissionDetails[dataPoint.energyType]) {
      emissionDetails[dataPoint.energyType] = {
        energyType: dataPoint.energyType,
        totalConsumption: 0,
        totalEmission: 0
      };
    }
    
    emissionDetails[dataPoint.energyType].totalConsumption += dataPoint.consumption;
    emissionDetails[dataPoint.energyType].totalEmission += emission;
    totalEmissions += emission;
  });
  
  // 返回汇总结果
  return {
    total: totalEmissions,
    details: Object.values(emissionDetails),
    timeRange: {
      start: startTime,
      end: endTime
    }
  };
}

// 创建碳排放计算路由
function setupCarbonRoutes(app, authenticateToken) {
  // 碳排放计算接口
  app.get('/carbon/emissions', authenticateToken, async (req, res) => {
    try {
      // 获取查询参数
      const { buildingId, startDate, endDate } = req.query;
      
      if (!buildingId || !startDate || !endDate) {
        res.status(400).json({ error: '缺少必要参数' });
        return;
      }
      
      // 验证时间范围
      validateTimeRange(new Date(startDate), new Date(endDate));
      
      // 调用碳排放计算模型
      const emissions = await calculateCarbonEmissions(buildingId, startDate, endDate);
      
      // 返回计算结果
      res.json(emissions);
    } catch (error) {
      console.error('碳排放计算错误:', error);
      res.status(500).json({ error: '碳排放计算失败' });
    }
  });
  
  // 返回app对象以便链式调用
  return app;
}

// 统一导出所有 functions 和 constants
export { 
  calculateEmission, 
  validateTimeRange, 
  calculateTotalEmissions, 
  calculateEmissionDetails, 
  setupCarbonRoutes 
};
