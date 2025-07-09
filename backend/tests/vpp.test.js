import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import vppRoutes from '../routes/vppRoutes.js';
import vppDatabase from '../database/vppDatabase.js';
import logger from '../../src/shared/utils/logger.js';

/**
 * 虚拟电厂模块测试套件
 * P0阶段功能测试：资源管理、VPP管理、基础监控
 */

// 创建测试应用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/vpp', vppRoutes);
  return app;
};

const app = createTestApp();

// 测试数据
const testResourceData = {
  name: '测试光伏电站',
  type: 'solar',
  description: '用于测试的光伏发电系统',
  ratedCapacity: 100.0,
  unit: 'kW',
  technicalSpecs: {
    panel_type: 'monocrystalline',
    efficiency: 20.5,
    tilt_angle: 30
  },
  operationalConstraints: {
    min_irradiance: 100,
    max_temperature: 85
  },
  location: '测试园区',
  latitude: 39.9042,
  longitude: 116.4074
};

const testVPPData = {
  name: '测试虚拟电厂',
  description: '用于测试的虚拟电厂',
  operationalStrategy: {
    optimization_objective: 'cost_minimization',
    trading_preference: 'conservative'
  },
  targetCapacity: 500.0
};

let testResourceId;
let testVPPId;

describe('虚拟电厂模块测试', () => {
  let testStrategyId;
  let testModelId;
  let testBacktestId;

  beforeAll(async () => {
    // 初始化数据库连接
    try {
      await vppDatabase.initialize();
      logger.info('测试数据库初始化完成');
    } catch (error) {
      logger.error('测试数据库初始化失败:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      if (testVPPId) {
        await vppDatabase.delete('vpp_definitions', 'id = ?', [testVPPId]);
      }
      if (testResourceId) {
        await vppDatabase.delete('vpp_resources', 'id = ?', [testResourceId]);
      }
      if (testStrategyId) {
        await vppDatabase.delete('optimization_strategies', 'id = ?', [testStrategyId]);
      }
      if (testModelId) {
        await vppDatabase.delete('prediction_models', 'id = ?', [testModelId]);
      }
      if (testBacktestId) {
        await vppDatabase.delete('backtest_results', 'id = ?', [testBacktestId]);
      }
      await vppDatabase.close();
      logger.info('测试数据清理完成');
    } catch (error) {
      logger.error('测试数据清理失败:', error);
    }
  });

  beforeEach(() => {
    // 重置测试ID
    testResourceId = null;
    testVPPId = null;
    testStrategyId = null;
    testModelId = null;
    testBacktestId = null;
  });

  describe('系统接口测试', () => {
    it('应该返回健康检查状态', async () => {
      const response = await request(app)
        .get('/api/vpp/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('应该返回服务状态', async () => {
      const response = await request(app)
        .get('/api/vpp/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overall.status).toBe('running');
      expect(response.body.data.resourceService).toBeDefined();
      expect(response.body.data.vppService).toBeDefined();
    });
  });

  describe('资源管理接口测试', () => {
    it('应该成功注册新资源', async () => {
      const response = await request(app)
        .post('/api/vpp/resources')
        .send(testResourceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resourceId).toBeDefined();
      expect(response.body.data.message).toContain('注册成功');
      
      testResourceId = response.body.data.resourceId;
    });

    it('应该拒绝无效的资源数据', async () => {
      const invalidData = {
        name: '',
        type: 'invalid_type',
        ratedCapacity: -100
      };

      const response = await request(app)
        .post('/api/vpp/resources')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('应该获取资源列表', async () => {
      const response = await request(app)
        .get('/api/vpp/resources')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('应该支持资源列表筛选', async () => {
      const response = await request(app)
        .get('/api/vpp/resources?type=solar&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('应该获取聚合容量信息', async () => {
      const response = await request(app)
        .get('/api/vpp/resources/aggregated-capacity')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('VPP管理接口测试', () => {
    beforeEach(async () => {
      // 确保有测试资源
      if (!testResourceId) {
        const resourceResponse = await request(app)
          .post('/api/vpp/resources')
          .send(testResourceData);
        testResourceId = resourceResponse.body.data.resourceId;
      }
    });

    it('应该成功创建VPP', async () => {
      const vppData = {
        ...testVPPData,
        resourceIds: [testResourceId]
      };

      const response = await request(app)
        .post('/api/vpp/vpps')
        .send(vppData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vppId).toBeDefined();
      expect(response.body.data.totalCapacity).toBeDefined();
      
      testVPPId = response.body.data.vppId;
    });

    it('应该拒绝无效的VPP数据', async () => {
      const invalidData = {
        name: '',
        targetCapacity: -100
      };

      const response = await request(app)
        .post('/api/vpp/vpps')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('应该获取VPP列表', async () => {
      const response = await request(app)
        .get('/api/vpp/vpps')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('应该获取VPP详情', async () => {
      // 先创建VPP
      const createResponse = await request(app)
        .post('/api/vpp/vpps')
        .send(testVPPData);
      
      const vppId = createResponse.body.data.vppId;
      testVPPId = vppId;

      const response = await request(app)
        .get(`/api/vpp/vpps/${vppId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(vppId);
      expect(response.body.data.name).toBe(testVPPData.name);
    });

    it('应该处理不存在的VPP', async () => {
      const response = await request(app)
        .get('/api/vpp/vpps/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('不存在');
    });
  });

  describe('资源关联管理测试', () => {
    beforeEach(async () => {
      // 确保有测试资源和VPP
      if (!testResourceId) {
        const resourceResponse = await request(app)
          .post('/api/vpp/resources')
          .send(testResourceData);
        testResourceId = resourceResponse.body.data.resourceId;
      }

      if (!testVPPId) {
        const vppResponse = await request(app)
          .post('/api/vpp/vpps')
          .send(testVPPData);
        testVPPId = vppResponse.body.data.vppId;
      }
    });

    it('应该成功为VPP添加资源', async () => {
      const associationData = {
        resourceAssociations: [{
          resourceId: testResourceId,
          allocationRatio: 90.0,
          priority: 1,
          constraints: {
            max_daily_cycles: 2
          }
        }]
      };

      const response = await request(app)
        .post(`/api/vpp/vpps/${testVPPId}/resources`)
        .send(associationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('添加成功');
    });

    it('应该拒绝无效的资源关联数据', async () => {
      const invalidData = {
        resourceAssociations: [{
          resourceId: 'invalid',
          allocationRatio: 150.0
        }]
      };

      const response = await request(app)
        .post(`/api/vpp/vpps/${testVPPId}/resources`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('应该成功从VPP移除资源', async () => {
      // 先添加资源
      const associationData = {
        resourceAssociations: [{
          resourceId: testResourceId,
          allocationRatio: 90.0
        }]
      };

      await request(app)
        .post(`/api/vpp/vpps/${testVPPId}/resources`)
        .send(associationData);

      // 然后移除资源
      const removeData = {
        resourceIds: [testResourceId]
      };

      const response = await request(app)
        .delete(`/api/vpp/vpps/${testVPPId}/resources`)
        .send(removeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.removedCount).toBe(1);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理无效的资源ID', async () => {
      const response = await request(app)
        .get('/api/vpp/resources/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('无效');
    });

    it('应该处理无效的VPP ID', async () => {
      const response = await request(app)
        .get('/api/vpp/vpps/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('无效');
    });

    it('应该处理不存在的路由', async () => {
      const response = await request(app)
        .get('/api/vpp/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('未找到');
    });
  });

  describe('参数验证测试', () => {
    it('应该验证分页参数', async () => {
      const response = await request(app)
        .get('/api/vpp/resources?limit=1000&offset=-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
      expect(response.body.pagination.offset).toBeGreaterThanOrEqual(0);
    });

    it('应该验证地理坐标', async () => {
      const invalidData = {
        ...testResourceData,
        latitude: 200,
        longitude: -200
      };

      const response = await request(app)
        .post('/api/vpp/resources')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('纬度');
    });

    it('应该验证容量参数', async () => {
      const invalidData = {
        ...testResourceData,
        ratedCapacity: -100
      };

      const response = await request(app)
        .post('/api/vpp/resources')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('正数');
    });
  });

  describe('优化策略管理测试', () => {
    const testStrategyData = {
      name: '测试优化策略',
      description: '用于测试的优化策略',
      type: 'cost_optimization',
      parameters: {
        objective: 'minimize_cost',
        constraints: {
          max_power: 1000,
          min_soc: 20
        },
        weights: {
          cost: 0.7,
          reliability: 0.3
        }
      },
      isActive: true
    };

    it('应该成功创建优化策略', async () => {
      const response = await request(app)
        .post('/api/vpp/strategies')
        .send(testStrategyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.strategyId).toBeDefined();
      expect(response.body.data.message).toContain('创建成功');
      
      testStrategyId = response.body.data.strategyId;
    });

    it('应该获取策略列表', async () => {
      const response = await request(app)
        .get('/api/vpp/strategies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该更新策略参数', async () => {
      if (!testStrategyId) {
        const createResponse = await request(app)
          .post('/api/vpp/strategies')
          .send(testStrategyData);
        testStrategyId = createResponse.body.data.strategyId;
      }

      const updateData = {
        parameters: {
          ...testStrategyData.parameters,
          weights: {
            cost: 0.8,
            reliability: 0.2
          }
        }
      };

      const response = await request(app)
        .put(`/api/vpp/strategies/${testStrategyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('更新成功');
    });
  });

  describe('预测模型管理测试', () => {
    const testModelData = {
      name: '测试预测模型',
      description: '用于测试的预测模型',
      type: 'load_forecasting',
      algorithm: 'lstm',
      parameters: {
        sequence_length: 24,
        hidden_units: 128,
        learning_rate: 0.001,
        epochs: 100
      },
      features: ['temperature', 'humidity', 'historical_load'],
      isActive: true
    };

    it('应该成功创建预测模型', async () => {
      const response = await request(app)
        .post('/api/vpp/models')
        .send(testModelData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modelId).toBeDefined();
      expect(response.body.data.message).toContain('创建成功');
      
      testModelId = response.body.data.modelId;
    });

    it('应该获取模型列表', async () => {
      const response = await request(app)
        .get('/api/vpp/models')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该训练模型', async () => {
      if (!testModelId) {
        const createResponse = await request(app)
          .post('/api/vpp/models')
          .send(testModelData);
        testModelId = createResponse.body.data.modelId;
      }

      const trainingData = {
        dataSource: 'historical',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        validationSplit: 0.2
      };

      const response = await request(app)
        .post(`/api/vpp/models/${testModelId}/train`)
        .send(trainingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trainingJobId).toBeDefined();
    });

    it('应该进行预测', async () => {
      if (!testModelId) {
        const createResponse = await request(app)
          .post('/api/vpp/models')
          .send(testModelData);
        testModelId = createResponse.body.data.modelId;
      }

      const predictionData = {
        horizon: 24,
        features: {
          temperature: [20, 21, 22],
          humidity: [60, 65, 70]
        }
      };

      const response = await request(app)
        .post(`/api/vpp/models/${testModelId}/predict`)
        .send(predictionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions).toBeDefined();
      expect(Array.isArray(response.body.data.predictions)).toBe(true);
    });
  });

  describe('回测分析测试', () => {
    beforeEach(async () => {
      // 确保有测试策略
      if (!testStrategyId) {
        const strategyData = {
          name: '回测测试策略',
          type: 'cost_optimization',
          parameters: {
            objective: 'minimize_cost'
          }
        };
        const strategyResponse = await request(app)
          .post('/api/vpp/strategies')
          .send(strategyData);
        testStrategyId = strategyResponse.body.data.strategyId;
      }
    });

    it('应该成功启动回测', async () => {
      const backtestData = {
        name: '测试回测',
        description: '用于测试的回测分析',
        strategyId: testStrategyId,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        initialCapital: 1000000,
        parameters: {
          rebalanceFrequency: 'daily',
          transactionCost: 0.001
        }
      };

      const response = await request(app)
        .post('/api/vpp/backtests')
        .send(backtestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.backtestId).toBeDefined();
      expect(response.body.data.status).toBe('running');
      
      testBacktestId = response.body.data.backtestId;
    });

    it('应该获取回测列表', async () => {
      const response = await request(app)
        .get('/api/vpp/backtests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该获取回测结果', async () => {
      if (!testBacktestId) {
        const backtestData = {
          name: '测试回测结果',
          strategyId: testStrategyId,
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        };
        const backtestResponse = await request(app)
          .post('/api/vpp/backtests')
          .send(backtestData);
        testBacktestId = backtestResponse.body.data.backtestId;
      }

      const response = await request(app)
        .get(`/api/vpp/backtests/${testBacktestId}/results`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('应该获取回测性能指标', async () => {
      if (!testBacktestId) {
        const backtestData = {
          name: '测试性能指标',
          strategyId: testStrategyId,
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        };
        const backtestResponse = await request(app)
          .post('/api/vpp/backtests')
          .send(backtestData);
        testBacktestId = backtestResponse.body.data.backtestId;
      }

      const response = await request(app)
        .get(`/api/vpp/backtests/${testBacktestId}/metrics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.risk).toBeDefined();
    });
  });

  describe('高级监控测试', () => {
    it('应该获取实时性能指标', async () => {
      const response = await request(app)
        .get('/api/vpp/monitoring/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.efficiency).toBeDefined();
      expect(response.body.data.utilization).toBeDefined();
      expect(response.body.data.revenue).toBeDefined();
    });

    it('应该获取风险指标', async () => {
      const response = await request(app)
        .get('/api/vpp/monitoring/risk')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.var).toBeDefined();
      expect(response.body.data.volatility).toBeDefined();
      expect(response.body.data.concentration).toBeDefined();
    });

    it('应该获取预警信息', async () => {
      const response = await request(app)
        .get('/api/vpp/monitoring/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该支持自定义监控指标', async () => {
      const customMetrics = {
        metrics: ['efficiency', 'revenue'],
        timeRange: '24h',
        aggregation: 'avg'
      };

      const response = await request(app)
        .post('/api/vpp/monitoring/custom')
        .send(customMetrics)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
    });
  });

  // =====================================================
  // P2阶段：高级交易功能测试
  // =====================================================

  describe('高级交易功能测试', () => {
    it('应该执行套利策略', async () => {
      const arbitrageConfig = {
        vppId: testVPPId,
        markets: ['spot', 'futures'],
        strategy: 'price_spread',
        parameters: {
          minSpread: 5.0,
          maxPosition: 100,
          timeHorizon: '1h'
        }
      };

      const response = await request(app)
        .post('/api/vpp/advanced-trading/arbitrage')
        .send(arbitrageConfig)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.arbitrageId).toBeDefined();
      expect(response.body.data.expectedProfit).toBeDefined();
    });

    it('应该进行实时价格优化', async () => {
      const optimizationConfig = {
        vppId: testVPPId,
        marketConditions: {
          currentPrice: 50.0,
          demand: 150,
          supply: 200
        },
        constraints: {
          minPrice: 40.0,
          maxPrice: 80.0
        },
        objectives: ['maximize_revenue', 'minimize_risk']
      };

      const response = await request(app)
        .post('/api/vpp/advanced-trading/optimize-pricing')
        .send(optimizationConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.optimizedPrice).toBeDefined();
      expect(response.body.data.expectedRevenue).toBeDefined();
    });

    it('应该进行动态资源调度', async () => {
      const dispatchConfig = {
        vppId: testVPPId,
        demandForecast: {
          next1h: 120,
          next4h: 180,
          next24h: 200
        },
        resourceAvailability: {
          solar: 80,
          wind: 60,
          battery: 40
        },
        constraints: {
          maxRampRate: 10,
          minStableTime: 30
        }
      };

      const response = await request(app)
        .post('/api/vpp/advanced-trading/dynamic-dispatch')
        .send(dispatchConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.dispatchPlan).toBeDefined();
      expect(response.body.data.resourceAllocation).toBeDefined();
    });

    it('应该执行风险对冲', async () => {
      const hedgingConfig = {
        vppId: testVPPId,
        riskExposure: {
          priceRisk: 0.8,
          volumeRisk: 0.6,
          weatherRisk: 0.4
        },
        hedgingInstruments: ['futures', 'options', 'swaps'],
        strategy: 'delta_neutral'
      };

      const response = await request(app)
        .post('/api/vpp/advanced-trading/risk-hedging')
        .send(hedgingConfig)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.hedgeId).toBeDefined();
      expect(response.body.data.hedgeRatio).toBeDefined();
    });
  });

  // =====================================================
  // P2阶段：智能决策系统测试
  // =====================================================

  describe('智能决策系统测试', () => {
    it('应该进行强化学习决策', async () => {
      const decisionConfig = {
        vppId: testVPPId,
        state: {
          marketPrice: 55.0,
          demand: 150,
          weatherCondition: 'sunny',
          resourceStatus: {
            solar: 0.8,
            wind: 0.6,
            battery: 0.4
          }
        },
        availableActions: ['increase_output', 'decrease_output', 'maintain', 'store_energy'],
        modelId: 'rl_model_v1'
      };

      const response = await request(app)
        .post('/api/vpp/intelligent-decision/rl-decision')
        .send(decisionConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedAction).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
      expect(response.body.data.expectedReward).toBeDefined();
    });

    it('应该进行多目标优化决策', async () => {
      const decisionConfig = {
        vppId: testVPPId,
        objectives: [
          { name: 'maximize_profit', weight: 0.4 },
          { name: 'minimize_risk', weight: 0.3 },
          { name: 'maximize_efficiency', weight: 0.3 }
        ],
        constraints: {
          maxOutput: 200,
          minReserve: 20,
          environmentalLimit: 100
        },
        preferences: {
          riskTolerance: 'medium',
          timeHorizon: '24h'
        }
      };

      const response = await request(app)
        .post('/api/vpp/intelligent-decision/multi-objective')
        .send(decisionConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.paretoSolutions).toBeDefined();
      expect(response.body.data.recommendedSolution).toBeDefined();
    });

    it('应该进行自适应参数调整', async () => {
      const adjustmentConfig = {
        vppId: testVPPId,
        currentParameters: {
          bidPrice: 50.0,
          reserveMargin: 0.1,
          rampRate: 5.0
        },
        performanceMetrics: {
          profitability: 0.75,
          reliability: 0.95,
          efficiency: 0.88
        },
        adjustmentStrategy: 'gradient_based'
      };

      const response = await request(app)
        .post('/api/vpp/intelligent-decision/adaptive-adjustment')
        .send(adjustmentConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.adjustedParameters).toBeDefined();
      expect(response.body.data.improvementExpected).toBeDefined();
    });

    it('应该进行市场趋势预测', async () => {
      const predictionConfig = {
        vppId: testVPPId,
        historicalData: {
          prices: [45, 48, 52, 55, 58],
          demands: [120, 135, 150, 165, 180],
          weather: ['cloudy', 'sunny', 'windy', 'sunny', 'cloudy']
        },
        predictionHorizon: '7d',
        modelType: 'lstm'
      };

      const response = await request(app)
        .post('/api/vpp/intelligent-decision/market-prediction')
        .send(predictionConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.priceForecast).toBeDefined();
      expect(response.body.data.demandForecast).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
    });
  });

  // =====================================================
  // P2阶段：高级分析功能测试
  // =====================================================

  describe('高级分析功能测试', () => {
    it('应该进行实时风险监控', async () => {
      const monitoringConfig = {
        vppId: testVPPId,
        riskMetrics: ['market_risk', 'credit_risk', 'operational_risk'],
        thresholds: {
          market_risk: 0.8,
          credit_risk: 0.6,
          operational_risk: 0.7
        },
        alertSettings: {
          email: true,
          sms: false,
          dashboard: true
        }
      };

      const response = await request(app)
        .post('/api/vpp/advanced-analytics/risk-monitoring')
        .send(monitoringConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.riskAssessment).toBeDefined();
      expect(response.body.data.alerts).toBeDefined();
    });

    it('应该进行投资组合优化', async () => {
      const optimizationConfig = {
        vppId: testVPPId,
        assets: [
          { id: 'solar_farm_1', expectedReturn: 0.08, risk: 0.12 },
          { id: 'wind_farm_1', expectedReturn: 0.10, risk: 0.15 },
          { id: 'battery_storage_1', expectedReturn: 0.06, risk: 0.08 }
        ],
        constraints: {
          maxWeight: 0.6,
          minWeight: 0.1,
          totalBudget: 1000000
        },
        objectives: ['maximize_return', 'minimize_risk'],
        riskTolerance: 'moderate'
      };

      const response = await request(app)
        .post('/api/vpp/advanced-analytics/portfolio-optimization')
        .send(optimizationConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.optimalWeights).toBeDefined();
      expect(response.body.data.expectedReturn).toBeDefined();
      expect(response.body.data.portfolioRisk).toBeDefined();
    });

    it('应该进行敏感性分析', async () => {
      const analysisConfig = {
        vppId: testVPPId,
        baseScenario: {
          marketPrice: 50.0,
          fuelCost: 30.0,
          demand: 150
        },
        variables: [
          { name: 'marketPrice', range: [40, 60] },
          { name: 'fuelCost', range: [25, 35] },
          { name: 'demand', range: [120, 180] }
        ],
        outputMetrics: ['profit', 'risk', 'efficiency']
      };

      const response = await request(app)
        .post('/api/vpp/advanced-analytics/sensitivity-analysis')
        .send(analysisConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.sensitivityMatrix).toBeDefined();
      expect(response.body.data.keyDrivers).toBeDefined();
    });

    it('应该进行压力测试', async () => {
      const testConfig = {
        vppId: testVPPId,
        stressScenarios: [
          {
            name: 'market_crash',
            parameters: { priceShock: -0.3, demandShock: -0.2 }
          },
          {
            name: 'extreme_weather',
            parameters: { renewableOutput: -0.5, maintenanceCost: 1.5 }
          }
        ],
        testParameters: {
          duration: '30d',
          iterations: 1000
        },
        evaluationMetrics: ['var', 'expected_shortfall', 'max_drawdown']
      };

      const response = await request(app)
        .post('/api/vpp/advanced-analytics/stress-test')
        .send(testConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.stressTestResults).toBeDefined();
      expect(response.body.data.riskMetrics).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });
  });
});

// 导出测试工具函数
export {
  createTestApp,
  testResourceData,
  testVPPData
};