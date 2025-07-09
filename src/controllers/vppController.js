/**
 * VPP控制器 - 虚拟电厂资源管理和交易控制器
 */

import vppResourceService from '../services/vppResourceService.js';
import vppTradingService from '../services/vppTradingService.js';
import marketConnectorService from '../services/marketConnectorService.js';
import logger from '../shared/utils/logger.js';

class VPPController {
  // 资源模板管理
  async getResourceTemplates(req, res) {
    try {
      const { type, category, page = 1, limit = 20 } = req.query;
      const result = await vppResourceService.getResourceTemplates({
        type, category, page: parseInt(page), limit: parseInt(limit)
      });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      logger.error('获取资源模板失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_TEMPLATES_FAILED', message: error.message } });
    }
  }

  async createResourceTemplate(req, res) {
    try {
      const result = await vppResourceService.createResourceTemplate(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('创建资源模板失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'CREATE_TEMPLATE_FAILED', message: error.message } });
    }
  }

  async updateResourceTemplate(req, res) {
    try {
      const result = await vppResourceService.updateResourceTemplate(req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('更新资源模板失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'UPDATE_TEMPLATE_FAILED', message: error.message } });
    }
  }

  async deleteResourceTemplate(req, res) {
    try {
      await vppResourceService.deleteResourceTemplate(req.params.id);
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      logger.error('删除资源模板失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'DELETE_TEMPLATE_FAILED', message: error.message } });
    }
  }

  // 资源实例管理
  async getResourceInstances(req, res) {
    try {
      const { type, status, vppId, page = 1, limit = 20 } = req.query;
      const result = await vppResourceService.getResourceInstances({
        type, status, vppId, page: parseInt(page), limit: parseInt(limit)
      });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      logger.error('获取资源实例失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_INSTANCES_FAILED', message: error.message } });
    }
  }

  async createResourceInstance(req, res) {
    try {
      const result = await vppResourceService.createResourceInstance(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('创建资源实例失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'CREATE_INSTANCE_FAILED', message: error.message } });
    }
  }

  async updateResourceInstanceStatus(req, res) {
    try {
      const result = await vppResourceService.updateResourceInstanceStatus(req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('更新资源状态失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'UPDATE_STATUS_FAILED', message: error.message } });
    }
  }

  async getResourceRealtimeData(req, res) {
    try {
      const result = await vppResourceService.getResourceRealtimeData(req.params.id, req.query.metrics?.split(','));
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('获取实时数据失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_REALTIME_DATA_FAILED', message: error.message } });
    }
  }

  // VPP聚合管理
  async getVPPList(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await vppResourceService.getVPPList({ status, page: parseInt(page), limit: parseInt(limit) });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      logger.error('获取VPP列表失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_VPP_LIST_FAILED', message: error.message } });
    }
  }

  async createVPP(req, res) {
    try {
      const result = await vppResourceService.createVPP(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('创建VPP失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'CREATE_VPP_FAILED', message: error.message } });
    }
  }

  async configureVPPResources(req, res) {
    try {
      const result = await vppResourceService.configureVPPResources(req.params.id, req.body.resourceConfigurations);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('配置VPP资源失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'CONFIGURE_VPP_FAILED', message: error.message } });
    }
  }

  async getVPPAggregatedParameters(req, res) {
    try {
      const result = await vppResourceService.getVPPAggregatedParameters(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('获取VPP聚合参数失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_AGGREGATED_PARAMS_FAILED', message: error.message } });
    }
  }

  // 交易策略管理
  async getTradingStrategies(req, res) {
    try {
      const { vppId, type, status, page = 1, limit = 20 } = req.query;
      const result = await vppTradingService.getTradingStrategies({
        vppId, type, status, page: parseInt(page), limit: parseInt(limit)
      });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      logger.error('获取交易策略失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_STRATEGIES_FAILED', message: error.message } });
    }
  }

  async createTradingStrategy(req, res) {
    try {
      const result = await vppTradingService.createTradingStrategy(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('创建交易策略失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'CREATE_STRATEGY_FAILED', message: error.message } });
    }
  }

  async updateTradingStrategy(req, res) {
    try {
      const result = await vppTradingService.updateTradingStrategy(req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('更新交易策略失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'UPDATE_STRATEGY_FAILED', message: error.message } });
    }
  }

  // 回测管理
  async submitBacktestTask(req, res) {
    try {
      const result = await vppTradingService.submitBacktestTask(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('提交回测任务失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'SUBMIT_BACKTEST_FAILED', message: error.message } });
    }
  }

  async getBacktestResults(req, res) {
    try {
      const result = await vppTradingService.getBacktestResults(req.params.taskId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('获取回测结果失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_BACKTEST_RESULTS_FAILED', message: error.message } });
    }
  }

  // AI模型管理
  async getAIModels(req, res) {
    try {
      const { type, status, page = 1, limit = 20 } = req.query;
      const result = await vppTradingService.getAIModels({ type, status, page: parseInt(page), limit: parseInt(limit) });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      logger.error('获取AI模型失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_AI_MODELS_FAILED', message: error.message } });
    }
  }

  async registerAIModel(req, res) {
    try {
      const result = await vppTradingService.registerAIModel(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('注册AI模型失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'REGISTER_AI_MODEL_FAILED', message: error.message } });
    }
  }

  async predictWithAIModel(req, res) {
    try {
      const result = await vppTradingService.predictWithAIModel(req.params.modelId, req.body.inputData);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('AI模型预测失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'AI_PREDICTION_FAILED', message: error.message } });
    }
  }

  // 市场连接器管理
  async getMarketConnectorConfigurations(req, res) {
    try {
      const result = await marketConnectorService.getMarketConnectorConfigurations(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('获取市场连接器配置失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_MARKET_CONFIGS_FAILED', message: error.message } });
    }
  }

  async createMarketConnectorConfiguration(req, res) {
    try {
      const result = await marketConnectorService.createMarketConnectorConfiguration(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('创建市场连接器配置失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'CREATE_MARKET_CONFIG_FAILED', message: error.message } });
    }
  }

  async getRealtimeMarketData(req, res) {
    try {
      const result = await marketConnectorService.getRealtimeMarketData(req.query.marketType, req.query.dataType);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('获取实时市场数据失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_MARKET_DATA_FAILED', message: error.message } });
    }
  }

  // 交易执行
  async submitTradingBid(req, res) {
    try {
      const result = await marketConnectorService.submitTradingBid(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('提交交易投标失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'SUBMIT_BID_FAILED', message: error.message } });
    }
  }

  async getTradingBidResults(req, res) {
    try {
      const result = await marketConnectorService.getTradingBidResults(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('获取投标结果失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_BID_RESULTS_FAILED', message: error.message } });
    }
  }

  async executeDispatchInstruction(req, res) {
    try {
      const result = await marketConnectorService.executeDispatchInstruction(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('执行调度指令失败', { error: error.message });
      res.status(400).json({ success: false, error: { code: 'EXECUTE_DISPATCH_FAILED', message: error.message } });
    }
  }

  async getDispatchExecutionStatus(req, res) {
    try {
      const result = await marketConnectorService.getDispatchExecutionStatus(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('获取调度执行状态失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'GET_DISPATCH_STATUS_FAILED', message: error.message } });
    }
  }

  // 健康检查
  async healthCheck(req, res) {
    try {
      const result = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          vppResourceService: 'healthy',
          vppTradingService: 'healthy',
          marketConnectorService: 'healthy'
        },
        version: '1.0.0'
      };
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('健康检查失败', { error: error.message });
      res.status(500).json({ success: false, error: { code: 'HEALTH_CHECK_FAILED', message: error.message } });
    }
  }
}

export default new VPPController();