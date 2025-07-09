import { jest } from '@jest/globals';
import CarbonAccountingEngine from '../../src/core/services/CarbonAccountingEngine.js';
import { CARBON_CONSTANTS, MATH_CONSTANTS } from '../../src/shared/constants/MathConstants.js';

describe('CarbonAccountingEngine', () => {
  let carbonEngine;

  beforeEach(() => {
    carbonEngine = new CarbonAccountingEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初始化测试', () => {
    test('应该正确初始化碳核算引擎', () => {
      expect(carbonEngine).toBeDefined();
      expect(carbonEngine.emissionFactors).toBeDefined();
      expect(carbonEngine.calculationCache).toBeDefined();
    });

    test('应该加载国家标准排放因子', () => {
      expect(carbonEngine.emissionFactors.coal).toBe(CARBON_CONSTANTS.EMISSION_FACTORS.COAL);
      expect(carbonEngine.emissionFactors.naturalGas).toBe(CARBON_CONSTANTS.EMISSION_FACTORS.NATURAL_GAS);
      expect(carbonEngine.emissionFactors.electricity).toBe(CARBON_CONSTANTS.EMISSION_FACTORS.ELECTRICITY);
    });
  });

  describe('能源活动碳排放计算', () => {
    test('应该正确计算化石能源燃烧排放', () => {
      const energyData = {
        coal: 1000, // 吨
        naturalGas: 500, // 立方米
        diesel: 200 // 升
      };

      const emissions = carbonEngine.calculateEnergyActivityEmissions(energyData);
      
      expect(emissions.total).toBeGreaterThan(0);
      expect(emissions.coal).toBe(energyData.coal * CARBON_CONSTANTS.EMISSION_FACTORS.COAL);
      expect(emissions.naturalGas).toBe(energyData.naturalGas * CARBON_CONSTANTS.EMISSION_FACTORS.NATURAL_GAS);
      expect(emissions.total).toBe(emissions.coal + emissions.naturalGas + emissions.diesel);
    });

    test('应该正确计算电力间接排放', () => {
      const electricityData = {
        gridElectricity: 10000, // kWh - 公共电网电力
        greenElectricity: 5000, // kWh - 绿电交易电力
        directGreenElectricity: 3000 // kWh - 点对点直供绿电
      };

      const emissions = carbonEngine.calculateElectricityEmissions(electricityData);
      
      // 绿电排放因子为0
      expect(emissions.greenElectricity).toBe(0);
      expect(emissions.directGreenElectricity).toBe(0);
      
      // 公共电网电力使用国家排放因子
      expect(emissions.gridElectricity).toBe(
        electricityData.gridElectricity * CARBON_CONSTANTS.EMISSION_FACTORS.ELECTRICITY
      );
      
      expect(emissions.total).toBe(emissions.gridElectricity);
    });

    test('应该正确处理热力间接排放', () => {
      const heatData = {
        fossilHeat: 1000, // GJ - 化石能源热力
        nonFossilHeat: 500 // GJ - 非化石能源热力
      };

      const emissions = carbonEngine.calculateHeatEmissions(heatData);
      
      expect(emissions.fossilHeat).toBeGreaterThan(0);
      expect(emissions.nonFossilHeat).toBe(0); // 非化石能源热力排放因子为0
      expect(emissions.total).toBe(emissions.fossilHeat);
    });
  });

  describe('工业过程碳排放计算', () => {
    test('应该正确计算工业过程排放', () => {
      const processData = {
        cement: 5000, // 吨水泥熟料
        steel: 3000, // 吨粗钢
        aluminum: 1000 // 吨电解铝
      };

      const emissions = carbonEngine.calculateProcessEmissions(processData);
      
      expect(emissions.total).toBeGreaterThan(0);
      expect(emissions.cement).toBe(processData.cement * CARBON_CONSTANTS.PROCESS_EMISSION_FACTORS.CEMENT);
      expect(emissions.steel).toBe(processData.steel * CARBON_CONSTANTS.PROCESS_EMISSION_FACTORS.STEEL);
      expect(emissions.total).toBe(emissions.cement + emissions.steel + emissions.aluminum);
    });

    test('应该处理空的工业过程数据', () => {
      const emissions = carbonEngine.calculateProcessEmissions({});
      expect(emissions.total).toBe(0);
    });
  });

  describe('园区总碳排放计算', () => {
    test('应该正确计算园区总碳排放 (E园区 = E能源活动 + E工业过程)', () => {
      const parkData = {
        energy: {
          coal: 1000,
          naturalGas: 500,
          gridElectricity: 10000,
          greenElectricity: 5000
        },
        process: {
          cement: 5000,
          steel: 3000
        }
      };

      const totalEmissions = carbonEngine.calculateParkTotalEmissions(parkData);
      
      expect(totalEmissions.total).toBeGreaterThan(0);
      expect(totalEmissions.energyActivity).toBeGreaterThan(0);
      expect(totalEmissions.industrialProcess).toBeGreaterThan(0);
      expect(totalEmissions.total).toBe(
        totalEmissions.energyActivity + totalEmissions.industrialProcess
      );
    });

    test('应该提供详细的排放分解', () => {
      const parkData = {
        energy: {
          coal: 1000,
          gridElectricity: 10000
        },
        process: {
          cement: 5000
        }
      };

      const result = carbonEngine.calculateParkTotalEmissions(parkData);
      
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.fuelCombustion).toBeGreaterThan(0);
      expect(result.breakdown.electricityIndirect).toBeGreaterThan(0);
      expect(result.breakdown.industrialProcess).toBeGreaterThan(0);
    });
  });

  describe('实时计算功能', () => {
    test('应该支持实时数据更新', async () => {
      const realTimeData = {
        timestamp: new Date().toISOString(),
        energy: {
          coal: 100,
          gridElectricity: 1000
        }
      };

      const result = await carbonEngine.updateRealTimeEmissions(realTimeData);
      
      expect(result.timestamp).toBe(realTimeData.timestamp);
      expect(result.emissions).toBeGreaterThan(0);
      expect(result.status).toBe('success');
    });

    test('应该缓存计算结果以提高性能', () => {
      const testData = {
        energy: { coal: 1000 },
        process: { cement: 5000 }
      };

      // 第一次计算
      const result1 = carbonEngine.calculateParkTotalEmissions(testData);
      
      // 第二次计算相同数据应该使用缓存
      const result2 = carbonEngine.calculateParkTotalEmissions(testData);
      
      expect(result1.total).toBe(result2.total);
      expect(carbonEngine.calculationCache.size).toBeGreaterThan(0);
    });
  });

  describe('数据验证', () => {
    test('应该验证输入数据格式', () => {
      expect(() => {
        carbonEngine.calculateEnergyActivityEmissions(null);
      }).toThrow('Invalid energy data format');

      expect(() => {
        carbonEngine.calculateEnergyActivityEmissions('invalid');
      }).toThrow('Invalid energy data format');
    });

    test('应该处理负数输入', () => {
      const invalidData = {
        energy: { coal: -100 },
        process: { cement: -500 }
      };

      expect(() => {
        carbonEngine.calculateParkTotalEmissions(invalidData);
      }).toThrow('Energy consumption values cannot be negative');
    });

    test('应该验证排放因子的有效性', () => {
      const originalFactor = carbonEngine.emissionFactors.coal;
      carbonEngine.emissionFactors.coal = -1;

      expect(() => {
        carbonEngine.calculateEnergyActivityEmissions({ coal: 100 });
      }).toThrow('Invalid emission factor');

      // 恢复原始值
      carbonEngine.emissionFactors.coal = originalFactor;
    });
  });

  describe('国家标准对标', () => {
    test('应该符合《零碳园区碳排放核算方法（试行）》', () => {
      // 验证计算公式符合国家标准
      const standardTestData = {
        energy: {
          coal: 1000, // 吨
          naturalGas: 500, // 立方米
          gridElectricity: 10000 // kWh
        },
        process: {
          cement: 5000 // 吨
        }
      };

      const result = carbonEngine.calculateParkTotalEmissions(standardTestData);
      
      // 验证计算结果结构符合国家标准
      expect(result).toHaveProperty('energyActivity');
      expect(result).toHaveProperty('industrialProcess');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(result.energyActivity + result.industrialProcess);
    });

    test('应该使用国家推荐的排放因子', () => {
      // 验证使用的排放因子符合国家标准
      expect(carbonEngine.emissionFactors.electricity).toBe(0.8325); // kgCO2/kWh
      expect(carbonEngine.emissionFactors.coal).toBeGreaterThan(0);
      expect(carbonEngine.emissionFactors.naturalGas).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    test('应该在合理时间内完成大数据量计算', () => {
      const largeDataSet = {
        energy: {
          coal: 100000,
          naturalGas: 50000,
          gridElectricity: 1000000,
          greenElectricity: 500000
        },
        process: {
          cement: 500000,
          steel: 300000,
          aluminum: 100000
        }
      };

      const startTime = Date.now();
      const result = carbonEngine.calculateParkTotalEmissions(largeDataSet);
      const endTime = Date.now();

      expect(result.total).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // 应在1秒内完成
    });

    test('应该支持并发计算', async () => {
      const testData = {
        energy: { coal: 1000 },
        process: { cement: 5000 }
      };

      const promises = Array(10).fill().map(() => 
        carbonEngine.calculateParkTotalEmissions(testData)
      );

      const results = await Promise.all(promises);
      
      // 所有结果应该一致
      const firstResult = results[0].total;
      results.forEach(result => {
        expect(result.total).toBe(firstResult);
      });
    });
  });
});