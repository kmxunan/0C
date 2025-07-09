import { jest } from '@jest/globals';
import NationalIndicatorEngine from '../../src/core/services/NationalIndicatorEngine.js';
import { CARBON_CONSTANTS, MATH_CONSTANTS } from '../../src/shared/constants/MathConstants.js';

describe('NationalIndicatorEngine', () => {
  let indicatorEngine;

  beforeEach(() => {
    indicatorEngine = new NationalIndicatorEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初始化测试', () => {
    test('应该正确初始化国家指标计算引擎', () => {
      expect(indicatorEngine).toBeDefined();
      expect(indicatorEngine.nationalStandards).toBeDefined();
      expect(indicatorEngine.calculationHistory).toBeDefined();
    });

    test('应该加载国家标准指标阈值', () => {
      expect(indicatorEngine.nationalStandards.unitCarbonEmissionThreshold).toBeDefined();
      expect(indicatorEngine.nationalStandards.cleanEnergyRatioThreshold).toBe(0.9); // ≥90%
    });
  });

  describe('单位能耗碳排放计算', () => {
    test('应该正确计算单位能耗碳排放指标', () => {
      const testData = {
        totalCarbonEmissions: 10000, // 吨CO2
        totalEnergyConsumption: 50000 // 吨标煤
      };

      const result = indicatorEngine.calculateUnitCarbonEmission(testData);
      
      expect(result.value).toBe(0.2); // 10000/50000 = 0.2 吨CO2/吨标煤
      expect(result.unit).toBe('吨CO2/吨标煤');
      expect(result.isCompliant).toBe(true); // 假设阈值为0.3
    });

    test('应该正确处理边界情况', () => {
      // 测试零能耗情况
      expect(() => {
        indicatorEngine.calculateUnitCarbonEmission({
          totalCarbonEmissions: 1000,
          totalEnergyConsumption: 0
        });
      }).toThrow('Total energy consumption cannot be zero');

      // 测试负值情况
      expect(() => {
        indicatorEngine.calculateUnitCarbonEmission({
          totalCarbonEmissions: -1000,
          totalEnergyConsumption: 5000
        });
      }).toThrow('Carbon emissions cannot be negative');
    });

    test('应该提供合规性评估', () => {
      const highEmissionData = {
        totalCarbonEmissions: 20000, // 吨CO2
        totalEnergyConsumption: 50000 // 吨标煤
      };

      const result = indicatorEngine.calculateUnitCarbonEmission(highEmissionData);
      
      expect(result.value).toBe(0.4); // 超过0.3阈值
      expect(result.isCompliant).toBe(false);
      expect(result.exceedanceRatio).toBeGreaterThan(1);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('清洁能源消费占比计算', () => {
    test('应该正确计算清洁能源消费占比', () => {
      const energyData = {
        renewableGeneration: 30000, // kWh - 园区自产可再生能源
        greenElectricityPurchase: 20000, // kWh - 外购绿电
        nonFossilHeat: 5000, // GJ - 外购非化石能源热力
        totalEnergyConsumption: 100000 // 吨标煤当量
      };

      const result = indicatorEngine.calculateCleanEnergyRatio(energyData);
      
      expect(result.ratio).toBeGreaterThan(0);
      expect(result.ratio).toBeLessThanOrEqual(1);
      expect(result.percentage).toBe(result.ratio * 100);
      expect(result.unit).toBe('%');
    });

    test('应该正确转换能源单位', () => {
      const energyData = {
        renewableGeneration: 10000, // kWh
        greenElectricityPurchase: 5000, // kWh
        nonFossilHeat: 1000, // GJ
        totalEnergyConsumption: 10 // 吨标煤
      };

      const result = indicatorEngine.calculateCleanEnergyRatio(energyData);
      
      // 验证单位转换正确性
      expect(result.cleanEnergyInTce).toBeDefined(); // 清洁能源折标煤量
      expect(result.conversionFactors).toBeDefined(); // 转换系数
    });

    test('应该评估是否达到90%目标', () => {
      const highCleanEnergyData = {
        renewableGeneration: 80000,
        greenElectricityPurchase: 15000,
        nonFossilHeat: 0,
        totalEnergyConsumption: 100 // 吨标煤
      };

      const result = indicatorEngine.calculateCleanEnergyRatio(highCleanEnergyData);
      
      expect(result.percentage).toBeGreaterThanOrEqual(90);
      expect(result.isCompliant).toBe(true);
      expect(result.targetAchievement).toBe('达标');
    });

    test('应该处理低清洁能源占比情况', () => {
      const lowCleanEnergyData = {
        renewableGeneration: 5000,
        greenElectricityPurchase: 2000,
        nonFossilHeat: 0,
        totalEnergyConsumption: 100 // 吨标煤
      };

      const result = indicatorEngine.calculateCleanEnergyRatio(lowCleanEnergyData);
      
      expect(result.percentage).toBeLessThan(90);
      expect(result.isCompliant).toBe(false);
      expect(result.gapToTarget).toBeGreaterThan(0);
      expect(result.improvementSuggestions).toBeDefined();
    });
  });

  describe('综合能源消费量计算', () => {
    test('应该正确计算年综合能源消费量', () => {
      const energyConsumptionData = {
        coal: 1000, // 吨
        naturalGas: 500000, // 立方米
        electricity: 100000, // kWh (按等价值计算)
        heat: 5000, // GJ
        gasoline: 100, // 吨
        diesel: 200 // 吨
      };

      const result = indicatorEngine.calculateTotalEnergyConsumption(energyConsumptionData);
      
      expect(result.totalInTce).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.coal).toBeDefined();
      expect(result.breakdown.electricity).toBeDefined();
      expect(result.unit).toBe('吨标煤');
    });

    test('应该使用正确的折标煤系数', () => {
      const testData = {
        electricity: 1000 // kWh
      };

      const result = indicatorEngine.calculateTotalEnergyConsumption(testData);
      
      // 验证电力按等价值计算 (1 kWh = 0.1229 kgce)
      expect(result.breakdown.electricity).toBeCloseTo(1000 * 0.1229 / 1000, 3);
    });

    test('应该区分电力计算方式', () => {
      const testData = {
        electricity: 1000 // kWh
      };

      // 等价值计算
      const equivalentResult = indicatorEngine.calculateTotalEnergyConsumption(
        testData, 
        { electricityCalculationMethod: 'equivalent' }
      );

      // 当量值计算
      const calorificResult = indicatorEngine.calculateTotalEnergyConsumption(
        testData, 
        { electricityCalculationMethod: 'calorific' }
      );

      expect(equivalentResult.totalInTce).not.toBe(calorificResult.totalInTce);
      expect(equivalentResult.calculationMethod).toBe('等价值');
      expect(calorificResult.calculationMethod).toBe('当量值');
    });
  });

  describe('引导性指标计算', () => {
    test('应该计算工业固废综合利用率', () => {
      const wasteData = {
        totalWasteGeneration: 10000, // 吨
        wasteUtilization: 8500, // 吨
        wasteStorage: 1000, // 吨
        wasteDisposal: 500 // 吨
      };

      const result = indicatorEngine.calculateWasteUtilizationRate(wasteData);
      
      expect(result.utilizationRate).toBe(0.85); // 8500/10000
      expect(result.percentage).toBe(85);
      expect(result.isCompliant).toBeDefined();
    });

    test('应该计算余热余冷余压综合利用率', () => {
      const wasteEnergyData = {
        totalWasteHeat: 50000, // GJ
        utilizedWasteHeat: 40000, // GJ
        totalWasteCold: 20000, // GJ
        utilizedWasteCold: 15000, // GJ
        totalWastePressure: 10000, // GJ
        utilizedWastePressure: 8000 // GJ
      };

      const result = indicatorEngine.calculateWasteEnergyUtilizationRate(wasteEnergyData);
      
      expect(result.heatUtilizationRate).toBe(0.8);
      expect(result.coldUtilizationRate).toBe(0.75);
      expect(result.pressureUtilizationRate).toBe(0.8);
      expect(result.overallUtilizationRate).toBeGreaterThan(0);
    });

    test('应该计算工业用水重复利用率', () => {
      const waterData = {
        totalWaterConsumption: 100000, // 立方米
        recycledWaterUsage: 60000, // 立方米
        freshWaterIntake: 40000 // 立方米
      };

      const result = indicatorEngine.calculateWaterReuseRate(waterData);
      
      expect(result.reuseRate).toBe(0.6); // 60000/100000
      expect(result.percentage).toBe(60);
      expect(result.waterSavings).toBe(60000);
    });
  });

  describe('实时监测功能', () => {
    test('应该支持实时指标计算', async () => {
      const realTimeData = {
        timestamp: new Date().toISOString(),
        carbonEmissions: 1000,
        energyConsumption: 5000,
        cleanEnergyRatio: 0.85
      };

      const result = await indicatorEngine.calculateRealTimeIndicators(realTimeData);
      
      expect(result.timestamp).toBe(realTimeData.timestamp);
      expect(result.indicators.unitCarbonEmission).toBeDefined();
      expect(result.indicators.cleanEnergyRatio).toBeDefined();
      expect(result.complianceStatus).toBeDefined();
    });

    test('应该提供预警功能', () => {
      const alertData = {
        unitCarbonEmission: 0.35, // 超过0.3阈值
        cleanEnergyRatio: 0.85 // 低于90%目标
      };

      const alerts = indicatorEngine.checkComplianceAlerts(alertData);
      
      expect(alerts).toHaveLength(2);
      expect(alerts[0].type).toBe('unitCarbonEmission');
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[1].type).toBe('cleanEnergyRatio');
      expect(alerts[1].severity).toBe('warning');
    });
  });

  describe('国家标准对标验证', () => {
    test('应该符合《国家级零碳园区建设指标体系（试行）》', () => {
      const standardTestData = {
        totalCarbonEmissions: 15000, // 吨CO2
        totalEnergyConsumption: 50000, // 吨标煤
        renewableGeneration: 40000, // kWh
        greenElectricityPurchase: 10000, // kWh
        totalEnergyConsumptionKwh: 100000 // kWh
      };

      const indicators = indicatorEngine.calculateAllNationalIndicators(standardTestData);
      
      // 验证核心指标
      expect(indicators.unitCarbonEmission).toBeDefined();
      expect(indicators.unitCarbonEmission.value).toBe(0.3); // 15000/50000
      expect(indicators.cleanEnergyRatio).toBeDefined();
      
      // 验证引导性指标
      expect(indicators.wasteUtilizationRate).toBeDefined();
      expect(indicators.wasteEnergyUtilizationRate).toBeDefined();
      expect(indicators.waterReuseRate).toBeDefined();
    });

    test('应该生成符合国家格式的指标报告', () => {
      const testData = {
        totalCarbonEmissions: 10000,
        totalEnergyConsumption: 40000,
        renewableGeneration: 30000,
        greenElectricityPurchase: 20000
      };

      const report = indicatorEngine.generateNationalIndicatorReport(testData);
      
      expect(report.reportTitle).toBe('国家级零碳园区建设指标监测报告');
      expect(report.coreIndicators).toBeDefined();
      expect(report.guidingIndicators).toBeDefined();
      expect(report.complianceAssessment).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.generatedAt).toBeDefined();
    });
  });

  describe('性能和准确性测试', () => {
    test('应该保证计算精度', () => {
      const precisionTestData = {
        totalCarbonEmissions: 12345.6789,
        totalEnergyConsumption: 54321.9876
      };

      const result = indicatorEngine.calculateUnitCarbonEmission(precisionTestData);
      
      // 验证计算精度保持到小数点后4位
      expect(result.value).toBeCloseTo(0.2273, 4);
    });

    test('应该在大数据量下保持性能', () => {
      const largeDataSet = {
        totalCarbonEmissions: 1000000,
        totalEnergyConsumption: 5000000,
        renewableGeneration: 2000000,
        greenElectricityPurchase: 1000000
      };

      const startTime = Date.now();
      const result = indicatorEngine.calculateAllNationalIndicators(largeDataSet);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(500); // 应在500ms内完成
    });

    test('应该支持历史数据趋势分析', () => {
      const historicalData = [
        { period: '2024-01', unitCarbonEmission: 0.35, cleanEnergyRatio: 0.80 },
        { period: '2024-02', unitCarbonEmission: 0.32, cleanEnergyRatio: 0.85 },
        { period: '2024-03', unitCarbonEmission: 0.28, cleanEnergyRatio: 0.90 }
      ];

      const trendAnalysis = indicatorEngine.analyzeTrends(historicalData);
      
      expect(trendAnalysis.unitCarbonEmissionTrend).toBe('improving');
      expect(trendAnalysis.cleanEnergyRatioTrend).toBe('improving');
      expect(trendAnalysis.overallProgress).toBe('positive');
      expect(trendAnalysis.projectedCompliance).toBeDefined();
    });
  });
});