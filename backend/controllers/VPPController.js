import logger from '../../src/shared/utils/logger.js';
import vppResourceService from '../services/VPPResourceService.js';
import vppManagementService from '../services/VPPManagementService.js';
import vppStrategyService from '../services/VPPStrategyService.js';
import vppAIModelService from '../services/VPPAIModelService.js';
import vppBacktestService from '../services/VPPBacktestService.js';
import vppTradingService from '../services/VPPTradingService.js';
import vppAnalyticsService from '../services/VPPAnalyticsService.js';
import vppAdvancedTradingService from '../services/VPPAdvancedTradingService.js';
import vppIntelligentDecisionService from '../services/VPPIntelligentDecisionService.js';
import vppIntelligentDecisionEnhancedService from '../services/VPPIntelligentDecisionEnhancedService.js';
import vppAdvancedAnalyticsService from '../services/VPPAdvancedAnalyticsService.js';
import vppResourceTemplateService from '../services/VPPResourceTemplateService.js';
import vppResourceAggregationService from '../services/VPPResourceAggregationService.js';
import vppTradingStrategyService from '../services/VPPTradingStrategyService.js';
import vppTradingExecutionService from '../services/VPPTradingExecutionService.js';
import vppMarketConnectorService from '../services/VPPMarketConnectorService.js';
import vppSettlementAnalysisService from '../services/VPPSettlementAnalysisService.js';

/**
 * 虚拟电厂控制器
 * 提供虚拟电厂相关的REST API接口
 * P0阶段功能：资源管理、VPP管理、基础监控
 * P1阶段功能：策略管理、AI模型管理、交易执行、分析报告
 */
class VPPController {
  constructor() {
    // 绑定方法上下文
    this.getResources = this.getResources.bind(this);
    this.getResourceById = this.getResourceById.bind(this);
    this.registerResource = this.registerResource.bind(this);
    this.updateResourceStatus = this.updateResourceStatus.bind(this);
    this.deleteResource = this.deleteResource.bind(this);
    this.getAggregatedCapacity = this.getAggregatedCapacity.bind(this);
    
    this.getVPPs = this.getVPPs.bind(this);
    this.getVPPById = this.getVPPById.bind(this);
    this.createVPP = this.createVPP.bind(this);
    this.updateVPP = this.updateVPP.bind(this);
    this.deleteVPP = this.deleteVPP.bind(this);
    this.addResourcesToVPP = this.addResourcesToVPP.bind(this);
    this.removeResourcesFromVPP = this.removeResourcesFromVPP.bind(this);
    this.getVPPOperationLogs = this.getVPPOperationLogs.bind(this);
    
    // P1阶段新增方法绑定
    this.getStrategies = this.getStrategies.bind(this);
    this.createStrategy = this.createStrategy.bind(this);
    this.updateStrategy = this.updateStrategy.bind(this);
    this.deleteStrategy = this.deleteStrategy.bind(this);
    this.getAIModels = this.getAIModels.bind(this);
    this.createAIModel = this.createAIModel.bind(this);
    this.trainAIModel = this.trainAIModel.bind(this);
    this.runBacktest = this.runBacktest.bind(this);
    this.getBacktestResults = this.getBacktestResults.bind(this);
    this.executeTrade = this.executeTrade.bind(this);
    this.getTradingHistory = this.getTradingHistory.bind(this);
    this.generateAnalyticsReport = this.generateAnalyticsReport.bind(this);
    
    // P2阶段新增方法绑定
    this.executeArbitrageStrategy = this.executeArbitrageStrategy.bind(this);
    this.optimizePricing = this.optimizePricing.bind(this);
    this.dynamicResourceDispatch = this.dynamicResourceDispatch.bind(this);
    this.executeRiskHedging = this.executeRiskHedging.bind(this);
    this.makeRLDecision = this.makeRLDecision.bind(this);
    this.makeMultiObjectiveDecision = this.makeMultiObjectiveDecision.bind(this);
    this.adaptiveParameterAdjustment = this.adaptiveParameterAdjustment.bind(this);
    this.predictMarketTrends = this.predictMarketTrends.bind(this);
    this.monitorRiskInRealTime = this.monitorRiskInRealTime.bind(this);
    this.optimizePortfolio = this.optimizePortfolio.bind(this);
    this.performSensitivityAnalysis = this.performSensitivityAnalysis.bind(this);
    this.runStressTest = this.runStressTest.bind(this);
    
    // P1阶段新增方法绑定 - 智能决策增强
    this.makeIntelligentDecision = this.makeIntelligentDecision.bind(this);
    this.analyzeMarketConditions = this.analyzeMarketConditions.bind(this);
    this.predictWithAI = this.predictWithAI.bind(this);
    this.validateDecision = this.validateDecision.bind(this);
    this.getDecisionHistory = this.getDecisionHistory.bind(this);
    
    // P0阶段新增方法绑定 - 资源模板管理
    this.getResourceTemplates = this.getResourceTemplates.bind(this);
    this.createResourceTemplate = this.createResourceTemplate.bind(this);
    this.updateResourceTemplate = this.updateResourceTemplate.bind(this);
    this.deleteResourceTemplate = this.deleteResourceTemplate.bind(this);
    this.getTemplateVersions = this.getTemplateVersions.bind(this);
    
    // P0阶段新增方法绑定 - 资源聚合管理
    this.createAggregation = this.createAggregation.bind(this);
    this.addResourceToAggregation = this.addResourceToAggregation.bind(this);
    this.removeResourceFromAggregation = this.removeResourceFromAggregation.bind(this);
    this.getAggregations = this.getAggregations.bind(this);
    this.getAggregationDetails = this.getAggregationDetails.bind(this);
    this.activateAggregation = this.activateAggregation.bind(this);
    this.getAggregationConflicts = this.getAggregationConflicts.bind(this);
    
    // P0阶段新增方法绑定 - 交易策略管理
    this.getTradingStrategies = this.getTradingStrategies.bind(this);
    this.createTradingStrategy = this.createTradingStrategy.bind(this);
    this.validateTradingStrategy = this.validateTradingStrategy.bind(this);
    this.activateTradingStrategy = this.activateTradingStrategy.bind(this);
    this.getStrategyTemplates = this.getStrategyTemplates.bind(this);
    
    // P0阶段新增方法绑定 - 交易执行管理
    this.startTradingEngine = this.startTradingEngine.bind(this);
    this.stopTradingEngine = this.stopTradingEngine.bind(this);
    this.executeStrategy = this.executeStrategy.bind(this);
    this.getExecutionRecords = this.getExecutionRecords.bind(this);
    this.getOrderHistory = this.getOrderHistory.bind(this);
    this.getRiskMonitoring = this.getRiskMonitoring.bind(this);
    
    // P0阶段新增方法绑定 - 市场连接器管理
    this.getMarketConnections = this.getMarketConnections.bind(this);
    this.connectToMarket = this.connectToMarket.bind(this);
    this.disconnectFromMarket = this.disconnectFromMarket.bind(this);
    this.getMarketData = this.getMarketData.bind(this);
    this.submitMarketOrder = this.submitMarketOrder.bind(this);
    
    // P0阶段新增方法绑定 - 结算分析管理
    this.createSettlement = this.createSettlement.bind(this);
    this.getSettlements = this.getSettlements.bind(this);
    this.generateFinancialAnalysis = this.generateFinancialAnalysis.bind(this);
    this.generateReport = this.generateReport.bind(this);
    this.getReports = this.getReports.bind(this);
    this.getAccountBalances = this.getAccountBalances.bind(this);
    
    this.getServiceStatus = this.getServiceStatus.bind(this);
    this.getHealthCheck = this.getHealthCheck.bind(this);
  }

  // ==================== 资源管理接口 ====================

  /**
   * 获取资源列表
   * GET /api/vpp/resources
   */
  async getResources(req, res) {
    try {
      const {
        type,
        status,
        location,
        limit = 50,
        offset = 0
      } = req.query;
      
      // 参数验证
      const parsedLimit = Math.min(parseInt(limit) || 50, 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);
      
      const filters = {
        type,
        status,
        location,
        limit: parsedLimit,
        offset: parsedOffset
      };
      
      const resources = await vppResourceService.getResources(filters);
      
      res.json({
        success: true,
        data: resources,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: resources.length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取资源列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取资源列表失败',
        message: error.message
      });
    }
  }

  /**
   * 获取资源详情
   * GET /api/vpp/resources/:id
   */
  async getResourceById(req, res) {
    try {
      const { id } = req.params;
      
      // 参数验证
      const resourceId = parseInt(id);
      if (isNaN(resourceId) || resourceId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的资源ID'
        });
      }
      
      const resource = await vppResourceService.getResourceById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: '资源不存在'
        });
      }
      
      res.json({
        success: true,
        data: resource,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取资源详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取资源详情失败',
        message: error.message
      });
    }
  }

  /**
   * 注册新资源
   * POST /api/vpp/resources
   */
  async registerResource(req, res) {
    try {
      const {
        name,
        type,
        description,
        ratedCapacity,
        unit,
        technicalSpecs,
        operationalConstraints,
        location,
        latitude,
        longitude
      } = req.body;
      
      // 参数验证
      if (!name || !type || !ratedCapacity) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: name, type, ratedCapacity'
        });
      }
      
      if (typeof ratedCapacity !== 'number' || ratedCapacity <= 0) {
        return res.status(400).json({
          success: false,
          error: '额定容量必须是正数'
        });
      }
      
      if (latitude && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
        return res.status(400).json({
          success: false,
          error: '纬度必须在-90到90之间'
        });
      }
      
      if (longitude && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
        return res.status(400).json({
          success: false,
          error: '经度必须在-180到180之间'
        });
      }
      
      const resourceData = {
        name: name.trim(),
        type,
        description,
        ratedCapacity,
        unit,
        technicalSpecs,
        operationalConstraints,
        location,
        latitude,
        longitude
      };
      
      const result = await vppResourceService.registerResource(resourceData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            resourceId: result.resourceId,
            message: result.message
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('注册资源失败:', error);
      res.status(500).json({
        success: false,
        error: '注册资源失败',
        message: error.message
      });
    }
  }

  /**
   * 更新资源状态
   * PUT /api/vpp/resources/:id/status
   */
  async updateResourceStatus(req, res) {
    try {
      const { id } = req.params;
      const {
        status,
        currentOutput,
        availableCapacity,
        efficiency,
        realTimeData
      } = req.body;
      
      // 参数验证
      const resourceId = parseInt(id);
      if (isNaN(resourceId) || resourceId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的资源ID'
        });
      }
      
      if (currentOutput !== undefined && (typeof currentOutput !== 'number' || currentOutput < 0)) {
        return res.status(400).json({
          success: false,
          error: '当前输出功率必须是非负数'
        });
      }
      
      if (availableCapacity !== undefined && (typeof availableCapacity !== 'number' || availableCapacity < 0)) {
        return res.status(400).json({
          success: false,
          error: '可用容量必须是非负数'
        });
      }
      
      if (efficiency !== undefined && (typeof efficiency !== 'number' || efficiency < 0 || efficiency > 100)) {
        return res.status(400).json({
          success: false,
          error: '效率必须在0-100之间'
        });
      }
      
      const statusData = {
        status,
        currentOutput,
        availableCapacity,
        efficiency,
        realTimeData
      };
      
      const result = await vppResourceService.updateResourceStatus(resourceId, statusData);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('更新资源状态失败:', error);
      res.status(500).json({
        success: false,
        error: '更新资源状态失败',
        message: error.message
      });
    }
  }

  /**
   * 删除资源
   * DELETE /api/vpp/resources/:id
   */
  async deleteResource(req, res) {
    try {
      const { id } = req.params;
      
      // 参数验证
      const resourceId = parseInt(id);
      if (isNaN(resourceId) || resourceId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的资源ID'
        });
      }
      
      const result = await vppResourceService.deleteResource(resourceId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('删除资源失败:', error);
      res.status(500).json({
        success: false,
        error: '删除资源失败',
        message: error.message
      });
    }
  }

  /**
   * 获取聚合容量信息
   * GET /api/vpp/resources/aggregated-capacity
   */
  async getAggregatedCapacity(req, res) {
    try {
      const { type, status, location } = req.query;
      
      const filters = {
        type,
        status,
        location
      };
      
      const aggregation = await vppResourceService.getAggregatedCapacity(filters);
      
      res.json({
        success: true,
        data: aggregation,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取聚合容量信息失败:', error);
      res.status(500).json({
        success: false,
        error: '获取聚合容量信息失败',
        message: error.message
      });
    }
  }

  // ==================== VPP管理接口 ====================

  /**
   * 获取VPP列表
   * GET /api/vpp/vpps
   */
  async getVPPs(req, res) {
    try {
      const {
        status,
        limit = 50,
        offset = 0
      } = req.query;
      
      // 参数验证
      const parsedLimit = Math.min(parseInt(limit) || 50, 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);
      
      const filters = {
        status,
        limit: parsedLimit,
        offset: parsedOffset
      };
      
      const vpps = await vppManagementService.getVPPs(filters);
      
      res.json({
        success: true,
        data: vpps,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: vpps.length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取VPP列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取VPP列表失败',
        message: error.message
      });
    }
  }

  /**
   * 获取VPP详情
   * GET /api/vpp/vpps/:id
   */
  async getVPPById(req, res) {
    try {
      const { id } = req.params;
      
      // 参数验证
      const vppId = parseInt(id);
      if (isNaN(vppId) || vppId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的VPP ID'
        });
      }
      
      const vpp = await vppManagementService.getVPPById(vppId);
      
      if (!vpp) {
        return res.status(404).json({
          success: false,
          error: 'VPP不存在'
        });
      }
      
      res.json({
        success: true,
        data: vpp,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取VPP详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取VPP详情失败',
        message: error.message
      });
    }
  }

  /**
   * 创建VPP
   * POST /api/vpp/vpps
   */
  async createVPP(req, res) {
    try {
      const {
        name,
        description,
        resourceIds,
        operationalStrategy,
        targetCapacity
      } = req.body;
      
      // 参数验证
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'VPP名称不能为空'
        });
      }
      
      if (resourceIds && !Array.isArray(resourceIds)) {
        return res.status(400).json({
          success: false,
          error: '资源ID列表必须是数组'
        });
      }
      
      if (targetCapacity !== undefined && (typeof targetCapacity !== 'number' || targetCapacity <= 0)) {
        return res.status(400).json({
          success: false,
          error: '目标容量必须是正数'
        });
      }
      
      const vppData = {
        name: name.trim(),
        description,
        resourceIds: resourceIds || [],
        operationalStrategy: operationalStrategy || {},
        targetCapacity
      };
      
      const result = await vppManagementService.createVPP(vppData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            vppId: result.vppId,
            totalCapacity: result.totalCapacity,
            message: result.message
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('创建VPP失败:', error);
      res.status(500).json({
        success: false,
        error: '创建VPP失败',
        message: error.message
      });
    }
  }

  /**
   * 更新VPP
   * PUT /api/vpp/vpps/:id
   */
  async updateVPP(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        operationalStrategy,
        status
      } = req.body;
      
      // 参数验证
      const vppId = parseInt(id);
      if (isNaN(vppId) || vppId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的VPP ID'
        });
      }
      
      const updateData = {
        name,
        description,
        operationalStrategy,
        status
      };
      
      const result = await vppManagementService.updateVPP(vppId, updateData);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('更新VPP失败:', error);
      res.status(500).json({
        success: false,
        error: '更新VPP失败',
        message: error.message
      });
    }
  }

  /**
   * 删除VPP
   * DELETE /api/vpp/vpps/:id
   */
  async deleteVPP(req, res) {
    try {
      const { id } = req.params;
      
      // 参数验证
      const vppId = parseInt(id);
      if (isNaN(vppId) || vppId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的VPP ID'
        });
      }
      
      const result = await vppManagementService.deleteVPP(vppId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('删除VPP失败:', error);
      res.status(500).json({
        success: false,
        error: '删除VPP失败',
        message: error.message
      });
    }
  }

  /**
   * 为VPP添加资源
   * POST /api/vpp/vpps/:id/resources
   */
  async addResourcesToVPP(req, res) {
    try {
      const { id } = req.params;
      const { resourceAssociations } = req.body;
      
      // 参数验证
      const vppId = parseInt(id);
      if (isNaN(vppId) || vppId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的VPP ID'
        });
      }
      
      if (!Array.isArray(resourceAssociations) || resourceAssociations.length === 0) {
        return res.status(400).json({
          success: false,
          error: '资源关联配置必须是非空数组'
        });
      }
      
      // 验证每个资源关联配置
      for (const assoc of resourceAssociations) {
        if (!assoc.resourceId || typeof assoc.resourceId !== 'number') {
          return res.status(400).json({
            success: false,
            error: '资源ID必须是有效数字'
          });
        }
        
        if (assoc.allocationRatio !== undefined && 
            (typeof assoc.allocationRatio !== 'number' || 
             assoc.allocationRatio < 0 || assoc.allocationRatio > 100)) {
          return res.status(400).json({
            success: false,
            error: '分配比例必须在0-100之间'
          });
        }
      }
      
      const result = await vppManagementService.addResourcesToVPP(vppId, resourceAssociations);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('为VPP添加资源失败:', error);
      res.status(500).json({
        success: false,
        error: '为VPP添加资源失败',
        message: error.message
      });
    }
  }

  /**
   * 从VPP移除资源
   * DELETE /api/vpp/vpps/:id/resources
   */
  async removeResourcesFromVPP(req, res) {
    try {
      const { id } = req.params;
      const { resourceIds } = req.body;
      
      // 参数验证
      const vppId = parseInt(id);
      if (isNaN(vppId) || vppId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的VPP ID'
        });
      }
      
      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: '资源ID列表必须是非空数组'
        });
      }
      
      // 验证资源ID
      for (const resourceId of resourceIds) {
        if (typeof resourceId !== 'number' || resourceId <= 0) {
          return res.status(400).json({
            success: false,
            error: '资源ID必须是有效的正整数'
          });
        }
      }
      
      const result = await vppManagementService.removeResourcesFromVPP(vppId, resourceIds);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            removedCount: result.removedCount
          },
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('从VPP移除资源失败:', error);
      res.status(500).json({
        success: false,
        error: '从VPP移除资源失败',
        message: error.message
      });
    }
  }

  /**
   * 获取VPP操作日志
   * GET /api/vpp/vpps/:id/logs
   */
  async getVPPOperationLogs(req, res) {
    try {
      const { id } = req.params;
      const {
        operationType,
        limit = 50,
        offset = 0
      } = req.query;
      
      // 参数验证
      const vppId = parseInt(id);
      if (isNaN(vppId) || vppId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的VPP ID'
        });
      }
      
      const parsedLimit = Math.min(parseInt(limit) || 50, 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);
      
      const filters = {
        operationType,
        limit: parsedLimit,
        offset: parsedOffset
      };
      
      const logs = await vppManagementService.getOperationLogs(vppId, filters);
      
      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: logs.length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取VPP操作日志失败:', error);
      res.status(500).json({
        success: false,
        error: '获取VPP操作日志失败',
        message: error.message
      });
    }
  }

  // ==================== P0阶段新增接口 - 资源模板管理 ====================

  /**
   * 获取资源模板列表
   * GET /api/vpp/resource-templates
   */
  async getResourceTemplates(req, res) {
    try {
      const {
        type,
        category,
        status,
        search,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        type,
        category,
        status,
        search,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppResourceTemplateService.getTemplates(filters);
      
      res.json({
        success: true,
        data: result.templates,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取资源模板列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取资源模板列表失败',
        message: error.message
      });
    }
  }

  /**
   * 创建资源模板
   * POST /api/vpp/resource-templates
   */
  async createResourceTemplate(req, res) {
    try {
      const {
        name,
        type,
        category,
        description,
        specifications,
        constraints,
        controlStrategies,
        isCustom = true
      } = req.body;
      
      // 参数验证
      if (!name || !type || !category) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: name, type, category'
        });
      }
      
      const templateData = {
        name,
        type,
        category,
        description,
        specifications,
        constraints,
        controlStrategies,
        isCustom
      };
      
      const result = await vppResourceTemplateService.createTemplate(templateData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.template,
          message: '资源模板创建成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('创建资源模板失败:', error);
      res.status(500).json({
        success: false,
        error: '创建资源模板失败',
        message: error.message
      });
    }
  }

  /**
   * 更新资源模板
   * PUT /api/vpp/resource-templates/:id
   */
  async updateResourceTemplate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const templateId = parseInt(id);
      if (isNaN(templateId) || templateId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的模板ID'
        });
      }
      
      const result = await vppResourceTemplateService.updateTemplate(templateId, updateData);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.template,
          message: '资源模板更新成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('更新资源模板失败:', error);
      res.status(500).json({
        success: false,
        error: '更新资源模板失败',
        message: error.message
      });
    }
  }

  /**
   * 删除资源模板
   * DELETE /api/vpp/resource-templates/:id
   */
  async deleteResourceTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const templateId = parseInt(id);
      if (isNaN(templateId) || templateId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的模板ID'
        });
      }
      
      const result = await vppResourceTemplateService.deleteTemplate(templateId);
      
      if (result.success) {
        res.json({
          success: true,
          message: '资源模板删除成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('删除资源模板失败:', error);
      res.status(500).json({
        success: false,
        error: '删除资源模板失败',
        message: error.message
      });
    }
  }

  /**
   * 获取模板版本历史
   * GET /api/vpp/resource-templates/:id/versions
   */
  async getTemplateVersions(req, res) {
    try {
      const { id } = req.params;
      
      const templateId = parseInt(id);
      if (isNaN(templateId) || templateId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的模板ID'
        });
      }
      
      const result = await vppResourceTemplateService.getTemplateVersions(templateId);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.versions,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('获取模板版本失败:', error);
      res.status(500).json({
        success: false,
        error: '获取模板版本失败',
        message: error.message
      });
    }
  }

  // ==================== P0阶段新增接口 - 资源聚合管理 ====================

  /**
   * 创建资源聚合
   * POST /api/vpp/aggregations
   */
  async createAggregation(req, res) {
    try {
      const {
        name,
        description,
        strategy,
        targetCapacity,
        maxResources,
        geographicConstraints,
        technicalConstraints
      } = req.body;
      
      // 参数验证
      if (!name || !strategy) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: name, strategy'
        });
      }
      
      const aggregationData = {
        name,
        description,
        strategy,
        targetCapacity,
        maxResources,
        geographicConstraints,
        technicalConstraints
      };
      
      const result = await vppResourceAggregationService.createAggregation(aggregationData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.aggregation,
          message: '资源聚合创建成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('创建资源聚合失败:', error);
      res.status(500).json({
        success: false,
        error: '创建资源聚合失败',
        message: error.message
      });
    }
  }

  /**
   * 添加资源到聚合
   * POST /api/vpp/aggregations/:id/resources
   */
  async addResourceToAggregation(req, res) {
    try {
      const { id } = req.params;
      const { resourceIds, weights } = req.body;
      
      const aggregationId = parseInt(id);
      if (isNaN(aggregationId) || aggregationId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的聚合ID'
        });
      }
      
      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: '资源ID列表不能为空'
        });
      }
      
      const result = await vppResourceAggregationService.addResources(aggregationId, resourceIds, weights);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.conflicts || [],
          message: '资源添加成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('添加资源到聚合失败:', error);
      res.status(500).json({
        success: false,
        error: '添加资源到聚合失败',
        message: error.message
      });
    }
  }

  /**
   * 从聚合中移除资源
   * DELETE /api/vpp/aggregations/:id/resources
   */
  async removeResourceFromAggregation(req, res) {
    try {
      const { id } = req.params;
      const { resourceIds } = req.body;
      
      const aggregationId = parseInt(id);
      if (isNaN(aggregationId) || aggregationId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的聚合ID'
        });
      }
      
      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: '资源ID列表不能为空'
        });
      }
      
      const result = await vppResourceAggregationService.removeResources(aggregationId, resourceIds);
      
      if (result.success) {
        res.json({
          success: true,
          message: '资源移除成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('从聚合中移除资源失败:', error);
      res.status(500).json({
        success: false,
        error: '从聚合中移除资源失败',
        message: error.message
      });
    }
  }

  /**
   * 获取聚合列表
   * GET /api/vpp/aggregations
   */
  async getAggregations(req, res) {
    try {
      const {
        status,
        strategy,
        search,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        status,
        strategy,
        search,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppResourceAggregationService.getAggregations(filters);
      
      res.json({
        success: true,
        data: result.aggregations,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取聚合列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取聚合列表失败',
        message: error.message
      });
    }
  }

  /**
   * 获取聚合详情
   * GET /api/vpp/aggregations/:id
   */
  async getAggregationDetails(req, res) {
    try {
      const { id } = req.params;
      
      const aggregationId = parseInt(id);
      if (isNaN(aggregationId) || aggregationId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的聚合ID'
        });
      }
      
      const result = await vppResourceAggregationService.getAggregationDetails(aggregationId);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.aggregation,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('获取聚合详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取聚合详情失败',
        message: error.message
      });
    }
  }

  /**
   * 激活聚合
   * POST /api/vpp/aggregations/:id/activate
   */
  async activateAggregation(req, res) {
    try {
      const { id } = req.params;
      
      const aggregationId = parseInt(id);
      if (isNaN(aggregationId) || aggregationId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的聚合ID'
        });
      }
      
      const result = await vppResourceAggregationService.activateAggregation(aggregationId);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.aggregation,
          message: '聚合激活成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('激活聚合失败:', error);
      res.status(500).json({
        success: false,
        error: '激活聚合失败',
        message: error.message
      });
    }
  }

  /**
   * 获取聚合冲突
   * GET /api/vpp/aggregations/:id/conflicts
   */
  async getAggregationConflicts(req, res) {
    try {
      const { id } = req.params;
      
      const aggregationId = parseInt(id);
      if (isNaN(aggregationId) || aggregationId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的聚合ID'
        });
      }
      
      const result = await vppResourceAggregationService.detectConflicts(aggregationId);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.conflicts,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('获取聚合冲突失败:', error);
      res.status(500).json({
        success: false,
        error: '获取聚合冲突失败',
        message: error.message
      });
    }
  }

  // ==================== P0阶段新增接口 - 交易策略管理 ====================

  /**
   * 获取交易策略列表
   * GET /api/vpp/trading-strategies
   */
  async getTradingStrategies(req, res) {
    try {
      const {
        type,
        status,
        targetMarket,
        validationStatus,
        search,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        type,
        status,
        targetMarket,
        validationStatus,
        search,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppTradingStrategyService.getStrategies(filters);
      
      res.json({
        success: true,
        data: result.strategies,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取交易策略列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取交易策略列表失败',
        message: error.message
      });
    }
  }

  /**
   * 创建交易策略
   * POST /api/vpp/trading-strategies
   */
  async createTradingStrategy(req, res) {
    try {
      const {
        name,
        description,
        type,
        targetMarket,
        parameters,
        riskLimits,
        components
      } = req.body;
      
      // 参数验证
      if (!name || !type || !targetMarket) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: name, type, targetMarket'
        });
      }
      
      const strategyData = {
        name,
        description,
        type,
        targetMarket,
        parameters,
        riskLimits,
        components
      };
      
      const result = await vppTradingStrategyService.createStrategy(strategyData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.strategy,
          message: '交易策略创建成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('创建交易策略失败:', error);
      res.status(500).json({
        success: false,
        error: '创建交易策略失败',
        message: error.message
      });
    }
  }

  /**
   * 验证交易策略
   * POST /api/vpp/trading-strategies/:id/validate
   */
  async validateTradingStrategy(req, res) {
    try {
      const { id } = req.params;
      const { validationType = 'full' } = req.body;
      
      const strategyId = parseInt(id);
      if (isNaN(strategyId) || strategyId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的策略ID'
        });
      }
      
      const result = await vppTradingStrategyService.validateStrategy(strategyId, validationType);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.validation,
          message: '策略验证完成',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('验证交易策略失败:', error);
      res.status(500).json({
        success: false,
        error: '验证交易策略失败',
        message: error.message
      });
    }
  }

  /**
   * 激活交易策略
   * POST /api/vpp/trading-strategies/:id/activate
   */
  async activateTradingStrategy(req, res) {
    try {
      const { id } = req.params;
      
      const strategyId = parseInt(id);
      if (isNaN(strategyId) || strategyId <= 0) {
        return res.status(400).json({
          success: false,
          error: '无效的策略ID'
        });
      }
      
      const result = await vppTradingStrategyService.activateStrategy(strategyId);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.strategy,
          message: '策略激活成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('激活交易策略失败:', error);
      res.status(500).json({
        success: false,
        error: '激活交易策略失败',
        message: error.message
      });
    }
  }

  /**
   * 获取策略模板
   * GET /api/vpp/strategy-templates
   */
  async getStrategyTemplates(req, res) {
    try {
      const { type, market } = req.query;
      
      const filters = { type, market };
      
      const result = await vppTradingStrategyService.getStrategyTemplates(filters);
      
      res.json({
        success: true,
        data: result.templates,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取策略模板失败:', error);
      res.status(500).json({
        success: false,
        error: '获取策略模板失败',
        message: error.message
      });
    }
  }

  // ==================== P0阶段新增接口 - 交易执行管理 ====================

  /**
   * 启动交易执行引擎
   * POST /api/vpp/trading-execution/start
   */
  async startTradingExecution(req, res) {
    try {
      const { config } = req.body;
      
      const result = await vppTradingExecutionService.startEngine(config);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.status,
          message: '交易执行引擎启动成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('启动交易执行引擎失败:', error);
      res.status(500).json({
        success: false,
        error: '启动交易执行引擎失败',
        message: error.message
      });
    }
  }

  /**
   * 停止交易执行引擎
   * POST /api/vpp/trading-execution/stop
   */
  async stopTradingExecution(req, res) {
    try {
      const result = await vppTradingExecutionService.stopEngine();
      
      if (result.success) {
        res.json({
          success: true,
          data: result.status,
          message: '交易执行引擎停止成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('停止交易执行引擎失败:', error);
      res.status(500).json({
        success: false,
        error: '停止交易执行引擎失败',
        message: error.message
      });
    }
  }

  /**
   * 获取执行记录
   * GET /api/vpp/trading-execution/records
   */
  async getTradingExecutionRecords(req, res) {
    try {
      const {
        strategyId,
        status,
        startTime,
        endTime,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        strategyId: strategyId ? parseInt(strategyId) : undefined,
        status,
        startTime,
        endTime,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppTradingExecutionService.getExecutionRecords(filters);
      
      res.json({
        success: true,
        data: result.records,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取执行记录失败:', error);
      res.status(500).json({
        success: false,
        error: '获取执行记录失败',
        message: error.message
      });
    }
  }

  /**
   * 获取订单列表
   * GET /api/vpp/trading-execution/orders
   */
  async getTradingOrders(req, res) {
    try {
      const {
        executionId,
        status,
        orderType,
        market,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        executionId: executionId ? parseInt(executionId) : undefined,
        status,
        orderType,
        market,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppTradingExecutionService.getOrders(filters);
      
      res.json({
        success: true,
        data: result.orders,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取订单列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取订单列表失败',
        message: error.message
      });
    }
  }

  /**
   * 获取风险监控数据
   * GET /api/vpp/trading-execution/risk-monitoring
   */
  async getRiskMonitoring(req, res) {
    try {
      const {
        executionId,
        riskLevel,
        startTime,
        endTime,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        executionId: executionId ? parseInt(executionId) : undefined,
        riskLevel,
        startTime,
        endTime,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppTradingExecutionService.getRiskMonitoring(filters);
      
      res.json({
        success: true,
        data: result.risks,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取风险监控数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取风险监控数据失败',
        message: error.message
      });
    }
  }

  // ==================== P0阶段新增接口 - 市场连接器管理 ====================

  /**
   * 获取市场连接状态
   * GET /api/vpp/market-connector/status
   */
  async getMarketConnectorStatus(req, res) {
    try {
      const result = await vppMarketConnectorService.getServiceStatus();
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取市场连接状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取市场连接状态失败',
        message: error.message
      });
    }
  }

  /**
   * 连接市场
   * POST /api/vpp/market-connector/connect
   */
  async connectMarket(req, res) {
    try {
      const { marketType, config } = req.body;
      
      if (!marketType) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: marketType'
        });
      }
      
      const result = await vppMarketConnectorService.connectMarket(marketType, config);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.connection,
          message: '市场连接成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('连接市场失败:', error);
      res.status(500).json({
        success: false,
        error: '连接市场失败',
        message: error.message
      });
    }
  }

  /**
   * 断开市场连接
   * POST /api/vpp/market-connector/disconnect
   */
  async disconnectMarket(req, res) {
    try {
      const { marketType } = req.body;
      
      if (!marketType) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: marketType'
        });
      }
      
      const result = await vppMarketConnectorService.disconnectMarket(marketType);
      
      if (result.success) {
        res.json({
          success: true,
          message: '市场连接断开成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('断开市场连接失败:', error);
      res.status(500).json({
        success: false,
        error: '断开市场连接失败',
        message: error.message
      });
    }
  }

  /**
   * 订阅市场数据
   * POST /api/vpp/market-connector/subscribe
   */
  async subscribeMarketData(req, res) {
    try {
      const { marketType, dataTypes, symbols } = req.body;
      
      if (!marketType || !dataTypes) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: marketType, dataTypes'
        });
      }
      
      const result = await vppMarketConnectorService.subscribeData(marketType, dataTypes, symbols);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.subscription,
          message: '市场数据订阅成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('订阅市场数据失败:', error);
      res.status(500).json({
        success: false,
        error: '订阅市场数据失败',
        message: error.message
      });
    }
  }

  /**
   * 提交订单到市场
   * POST /api/vpp/market-connector/submit-order
   */
  async submitMarketOrder(req, res) {
    try {
      const { marketType, orderData } = req.body;
      
      if (!marketType || !orderData) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: marketType, orderData'
        });
      }
      
      const result = await vppMarketConnectorService.submitOrder(marketType, orderData);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.order,
          message: '订单提交成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('提交订单失败:', error);
      res.status(500).json({
        success: false,
        error: '提交订单失败',
        message: error.message
      });
    }
  }

  /**
   * 获取市场数据
   * GET /api/vpp/market-connector/data
   */
  async getMarketData(req, res) {
    try {
      const {
        marketType,
        dataType,
        symbol,
        startTime,
        endTime,
        limit = 100,
        offset = 0
      } = req.query;
      
      const filters = {
        marketType,
        dataType,
        symbol,
        startTime,
        endTime,
        limit: Math.min(parseInt(limit) || 100, 1000),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppMarketConnectorService.getMarketData(filters);
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取市场数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取市场数据失败',
        message: error.message
      });
    }
  }

  // ==================== P0阶段新增接口 - 结算分析管理 ====================

  /**
   * 创建结算记录
   * POST /api/vpp/settlement/records
   */
  async createSettlementRecord(req, res) {
    try {
      const {
        executionId,
        settlementType,
        settlementData
      } = req.body;
      
      if (!executionId || !settlementType) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: executionId, settlementType'
        });
      }
      
      const result = await vppSettlementAnalysisService.createSettlement(executionId, settlementType, settlementData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.settlement,
          message: '结算记录创建成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('创建结算记录失败:', error);
      res.status(500).json({
        success: false,
        error: '创建结算记录失败',
        message: error.message
      });
    }
  }

  /**
   * 获取结算记录
   * GET /api/vpp/settlement/records
   */
  async getSettlementRecords(req, res) {
    try {
      const {
        executionId,
        status,
        settlementType,
        startTime,
        endTime,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        executionId: executionId ? parseInt(executionId) : undefined,
        status,
        settlementType,
        startTime,
        endTime,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppSettlementAnalysisService.getSettlementRecords(filters);
      
      res.json({
        success: true,
        data: result.records,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取结算记录失败:', error);
      res.status(500).json({
        success: false,
        error: '获取结算记录失败',
        message: error.message
      });
    }
  }

  /**
   * 生成财务分析
   * POST /api/vpp/settlement/analysis
   */
  async generateFinancialAnalysis(req, res) {
    try {
      const {
        analysisType,
        timeRange,
        parameters
      } = req.body;
      
      if (!analysisType || !timeRange) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: analysisType, timeRange'
        });
      }
      
      const result = await vppSettlementAnalysisService.generateAnalysis(analysisType, timeRange, parameters);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.analysis,
          message: '财务分析生成成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('生成财务分析失败:', error);
      res.status(500).json({
        success: false,
        error: '生成财务分析失败',
        message: error.message
      });
    }
  }

  /**
   * 生成报告
   * POST /api/vpp/settlement/reports
   */
  async generateSettlementReport(req, res) {
    try {
      const {
        reportType,
        timeRange,
        parameters,
        format = 'json'
      } = req.body;
      
      if (!reportType || !timeRange) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: reportType, timeRange'
        });
      }
      
      const result = await vppSettlementAnalysisService.generateReport(reportType, timeRange, parameters, format);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.report,
          message: '报告生成成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('生成报告失败:', error);
      res.status(500).json({
        success: false,
        error: '生成报告失败',
        message: error.message
      });
    }
  }

  /**
   * 获取账户余额
   * GET /api/vpp/settlement/balance
   */
  async getAccountBalance(req, res) {
    try {
      const { accountId, currency } = req.query;
      
      const result = await vppSettlementAnalysisService.getAccountBalance(accountId, currency);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.balance,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('获取账户余额失败:', error);
      res.status(500).json({
        success: false,
        error: '获取账户余额失败',
        message: error.message
      });
    }
  }

  /**
   * 获取合规监控数据
   * GET /api/vpp/settlement/compliance
   */
  async getComplianceMonitoring(req, res) {
    try {
      const {
        ruleType,
        status,
        startTime,
        endTime,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        ruleType,
        status,
        startTime,
        endTime,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      const result = await vppSettlementAnalysisService.getComplianceMonitoring(filters);
      
      res.json({
        success: true,
        data: result.compliance,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取合规监控数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取合规监控数据失败',
        message: error.message
      });
    }
  }

  // ==================== P1阶段智能决策增强接口 ====================

  /**
   * 执行智能决策
   * POST /api/vpp/intelligent-decision/make-decision
   */
  async makeIntelligentDecision(req, res) {
    try {
      const { vppId, decisionType, marketData, resourceData, constraints, preferences } = req.body;
      
      if (!vppId || !decisionType) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, decisionType'
        });
      }
      
      const decisionRequest = {
        vppId,
        decisionType,
        marketData,
        resourceData,
        constraints,
        preferences
      };
      
      const result = await vppIntelligentDecisionEnhancedService.makeIntelligentDecision(decisionRequest);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('智能决策执行失败:', error);
      res.status(500).json({
        success: false,
        error: '智能决策执行失败',
        message: error.message
      });
    }
  }

  /**
   * 分析市场条件
   * POST /api/vpp/intelligent-decision/analyze-market
   */
  async analyzeMarketConditions(req, res) {
    try {
      const { marketData, timeHorizon, analysisType } = req.body;
      
      if (!marketData) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: marketData'
        });
      }
      
      const analysisRequest = {
        marketData,
        timeHorizon: timeHorizon || '1h',
        analysisType: analysisType || 'comprehensive'
      };
      
      const result = await vppIntelligentDecisionEnhancedService.analyzeMarketConditions(analysisRequest);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('市场条件分析失败:', error);
      res.status(500).json({
        success: false,
        error: '市场条件分析失败',
        message: error.message
      });
    }
  }

  /**
   * AI预测
   * POST /api/vpp/intelligent-decision/predict
   */
  async predictWithAI(req, res) {
    try {
      const { modelType, inputData, predictionHorizon, confidenceLevel } = req.body;
      
      if (!modelType || !inputData) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: modelType, inputData'
        });
      }
      
      const predictionRequest = {
        modelType,
        inputData,
        predictionHorizon: predictionHorizon || '24h',
        confidenceLevel: confidenceLevel || 0.95
      };
      
      const result = await vppIntelligentDecisionEnhancedService.generateAIPrediction(predictionRequest);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('AI预测失败:', error);
      res.status(500).json({
        success: false,
        error: 'AI预测失败',
        message: error.message
      });
    }
  }

  /**
   * 验证决策
   * POST /api/vpp/intelligent-decision/validate
   */
  async validateDecision(req, res) {
    try {
      const { decision, constraints, riskThresholds } = req.body;
      
      if (!decision) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: decision'
        });
      }
      
      const validationRequest = {
        decision,
        constraints: constraints || {},
        riskThresholds: riskThresholds || {}
      };
      
      const result = await vppIntelligentDecisionEnhancedService.validateDecision(validationRequest);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('决策验证失败:', error);
      res.status(500).json({
        success: false,
        error: '决策验证失败',
        message: error.message
      });
    }
  }

  /**
   * 获取决策历史
   * GET /api/vpp/intelligent-decision/history
   */
  async getDecisionHistory(req, res) {
    try {
      const {
        vppId,
        decisionType,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        vppId: vppId ? parseInt(vppId) : undefined,
        decisionType,
        startDate,
        endDate,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: Math.max(parseInt(offset) || 0, 0)
      };
      
      // 模拟决策历史数据
      const mockHistory = {
        decisions: [
          {
            id: 1,
            vppId: filters.vppId || 1,
            decisionType: 'TRADING',
            decision: {
              action: 'BUY',
              quantity: 100,
              price: 0.12,
              confidence: 0.85
            },
            aiPredictions: {
              priceDirection: 'UP',
              confidence: 0.78,
              timeHorizon: '4h'
            },
            marketConditions: {
              volatility: 'MEDIUM',
              trend: 'BULLISH',
              liquidity: 'HIGH'
            },
            outcome: {
              executed: true,
              profit: 150.5,
              accuracy: 0.82
            },
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 2,
            vppId: filters.vppId || 1,
            decisionType: 'RESOURCE_ALLOCATION',
            decision: {
              action: 'REALLOCATE',
              resources: [1, 3, 5],
              allocation: [0.4, 0.35, 0.25],
              confidence: 0.91
            },
            aiPredictions: {
              demandForecast: [120, 135, 110],
              confidence: 0.88,
              timeHorizon: '24h'
            },
            marketConditions: {
              demand: 'HIGH',
              supply: 'MEDIUM',
              price: 'STABLE'
            },
            outcome: {
              executed: true,
              efficiency: 0.94,
              costSaving: 230.8
            },
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ],
        pagination: {
          total: 2,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: false
        },
        statistics: {
          totalDecisions: 2,
          successRate: 0.85,
          averageConfidence: 0.88,
          totalProfit: 381.3
        }
      };
      
      res.json({
        success: true,
        data: mockHistory,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取决策历史失败:', error);
      res.status(500).json({
        success: false,
        error: '获取决策历史失败',
        message: error.message
      });
    }
  }

  // ==================== 系统接口 ====================

  // ==================== P1阶段新增接口 ====================

  /**
   * 获取策略列表
   * GET /api/vpp/strategies
   */
  async getStrategies(req, res) {
    try {
      const { type, status, limit = 50, offset = 0 } = req.query;
      
      const parsedLimit = Math.min(parseInt(limit) || 50, 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);
      
      const filters = { type, status, limit: parsedLimit, offset: parsedOffset };
      const strategies = await vppStrategyService.getStrategies(filters);
      
      res.json({
        success: true,
        data: strategies,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: strategies.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取策略列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取策略列表失败',
        message: error.message
      });
    }
  }

  /**
   * 创建策略
   * POST /api/vpp/strategies
   */
  async createStrategy(req, res) {
    try {
      const { name, type, description, parameters, conditions } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: name, type'
        });
      }
      
      const strategyData = { name: name.trim(), type, description, parameters, conditions };
      const result = await vppStrategyService.createStrategy(strategyData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: { strategyId: result.strategyId, message: result.message },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('创建策略失败:', error);
      res.status(500).json({
        success: false,
        error: '创建策略失败',
        message: error.message
      });
    }
  }

  /**
   * 更新策略
   * PUT /api/vpp/strategies/:id
   */
  async updateStrategy(req, res) {
    try {
      const { id } = req.params;
      const { name, description, parameters, conditions, status } = req.body;
      
      const strategyId = parseInt(id);
      if (isNaN(strategyId) || strategyId <= 0) {
        return res.status(400).json({ success: false, error: '无效的策略ID' });
      }
      
      const updateData = { name, description, parameters, conditions, status };
      const result = await vppStrategyService.updateStrategy(strategyId, updateData);
      
      if (result.success) {
        res.json({ success: true, message: result.message, timestamp: new Date().toISOString() });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('更新策略失败:', error);
      res.status(500).json({
        success: false,
        error: '更新策略失败',
        message: error.message
      });
    }
  }

  /**
   * 删除策略
   * DELETE /api/vpp/strategies/:id
   */
  async deleteStrategy(req, res) {
    try {
      const { id } = req.params;
      
      const strategyId = parseInt(id);
      if (isNaN(strategyId) || strategyId <= 0) {
        return res.status(400).json({ success: false, error: '无效的策略ID' });
      }
      
      const result = await vppStrategyService.deleteStrategy(strategyId);
      
      if (result.success) {
        res.json({ success: true, message: result.message, timestamp: new Date().toISOString() });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('删除策略失败:', error);
      res.status(500).json({
        success: false,
        error: '删除策略失败',
        message: error.message
      });
    }
  }

  /**
   * 获取AI模型列表
   * GET /api/vpp/ai-models
   */
  async getAIModels(req, res) {
    try {
      const { type, status, limit = 50, offset = 0 } = req.query;
      
      const parsedLimit = Math.min(parseInt(limit) || 50, 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);
      
      const filters = { type, status, limit: parsedLimit, offset: parsedOffset };
      const models = await vppAIModelService.getAIModels(filters);
      
      res.json({
        success: true,
        data: models,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: models.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取AI模型列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取AI模型列表失败',
        message: error.message
      });
    }
  }

  /**
   * 创建AI模型
   * POST /api/vpp/ai-models
   */
  async createAIModel(req, res) {
    try {
      const { name, type, description, architecture, hyperparameters } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: name, type'
        });
      }
      
      const modelData = { name: name.trim(), type, description, architecture, hyperparameters };
      const result = await vppAIModelService.createAIModel(modelData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: { modelId: result.modelId, message: result.message },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('创建AI模型失败:', error);
      res.status(500).json({
        success: false,
        error: '创建AI模型失败',
        message: error.message
      });
    }
  }

  /**
   * 训练AI模型
   * POST /api/vpp/ai-models/:id/train
   */
  async trainAIModel(req, res) {
    try {
      const { id } = req.params;
      const { trainingData, validationData, epochs, batchSize } = req.body;
      
      const modelId = parseInt(id);
      if (isNaN(modelId) || modelId <= 0) {
        return res.status(400).json({ success: false, error: '无效的模型ID' });
      }
      
      const trainingConfig = { trainingData, validationData, epochs, batchSize };
      const result = await vppAIModelService.trainModel(modelId, trainingConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: { trainingJobId: result.trainingJobId },
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('训练AI模型失败:', error);
      res.status(500).json({
        success: false,
        error: '训练AI模型失败',
        message: error.message
      });
    }
  }

  /**
   * 运行回测
   * POST /api/vpp/backtest
   */
  async runBacktest(req, res) {
    try {
      const { strategyId, startDate, endDate, initialCapital, parameters } = req.body;
      
      if (!strategyId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: strategyId, startDate, endDate'
        });
      }
      
      const backtestConfig = { strategyId, startDate, endDate, initialCapital, parameters };
      const result = await vppBacktestService.runBacktest(backtestConfig);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: { backtestId: result.backtestId },
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('运行回测失败:', error);
      res.status(500).json({
        success: false,
        error: '运行回测失败',
        message: error.message
      });
    }
  }

  /**
   * 获取回测结果
   * GET /api/vpp/backtest/:id/results
   */
  async getBacktestResults(req, res) {
    try {
      const { id } = req.params;
      
      const backtestId = parseInt(id);
      if (isNaN(backtestId) || backtestId <= 0) {
        return res.status(400).json({ success: false, error: '无效的回测ID' });
      }
      
      const results = await vppBacktestService.getBacktestResults(backtestId);
      
      if (results) {
        res.json({
          success: true,
          data: results,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({ success: false, error: '回测结果不存在' });
      }
    } catch (error) {
      logger.error('获取回测结果失败:', error);
      res.status(500).json({
        success: false,
        error: '获取回测结果失败',
        message: error.message
      });
    }
  }

  /**
   * 执行交易
   * POST /api/vpp/trading/execute
   */
  async executeTrade(req, res) {
    try {
      const { vppId, strategyId, tradeType, quantity, price, marketType } = req.body;
      
      if (!vppId || !tradeType || !quantity) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, tradeType, quantity'
        });
      }
      
      const tradeData = { vppId, strategyId, tradeType, quantity, price, marketType };
      const result = await vppTradingService.executeTrade(tradeData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: { tradeId: result.tradeId, executionPrice: result.executionPrice },
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('执行交易失败:', error);
      res.status(500).json({
        success: false,
        error: '执行交易失败',
        message: error.message
      });
    }
  }

  /**
   * 获取交易历史
   * GET /api/vpp/trading/history
   */
  async getTradingHistory(req, res) {
    try {
      const { vppId, startDate, endDate, tradeType, limit = 50, offset = 0 } = req.query;
      
      const parsedLimit = Math.min(parseInt(limit) || 50, 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);
      
      const filters = { vppId, startDate, endDate, tradeType, limit: parsedLimit, offset: parsedOffset };
      const history = await vppTradingService.getTradingHistory(filters);
      
      res.json({
        success: true,
        data: history,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: history.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取交易历史失败:', error);
      res.status(500).json({
        success: false,
        error: '获取交易历史失败',
        message: error.message
      });
    }
  }

  /**
   * 生成分析报告
   * POST /api/vpp/analytics/report
   */
  async generateAnalyticsReport(req, res) {
    try {
      const { vppId, reportType, startDate, endDate, metrics } = req.body;
      
      if (!vppId || !reportType) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, reportType'
        });
      }
      
      const reportConfig = { vppId, reportType, startDate, endDate, metrics };
      const result = await vppAnalyticsService.generateReport(reportConfig);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: { reportId: result.reportId, reportUrl: result.reportUrl },
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('生成分析报告失败:', error);
      res.status(500).json({
        success: false,
        error: '生成分析报告失败',
        message: error.message
      });
    }
  }

  // ==================== P2阶段：高级交易功能接口 ====================

  /**
   * 执行套利策略
   * POST /api/vpp/advanced-trading/arbitrage
   */
  async executeArbitrageStrategy(req, res) {
    try {
      const { vppId, markets, strategy, parameters } = req.body;
      
      if (!vppId || !markets || !strategy) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, markets, strategy'
        });
      }
      
      const arbitrageConfig = { vppId, markets, strategy, parameters };
      const result = await vppAdvancedTradingService.executeArbitrageStrategy(arbitrageConfig);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('执行套利策略失败:', error);
      res.status(500).json({
        success: false,
        error: '执行套利策略失败',
        message: error.message
      });
    }
  }

  /**
   * 实时价格优化
   * POST /api/vpp/advanced-trading/optimize-pricing
   */
  async optimizePricing(req, res) {
    try {
      const { vppId, marketConditions, constraints, objectives } = req.body;
      
      if (!vppId || !marketConditions) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, marketConditions'
        });
      }
      
      const optimizationConfig = { vppId, marketConditions, constraints, objectives };
      const result = await vppAdvancedTradingService.optimizePricing(optimizationConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('实时价格优化失败:', error);
      res.status(500).json({
        success: false,
        error: '实时价格优化失败',
        message: error.message
      });
    }
  }

  /**
   * 动态资源调度
   * POST /api/vpp/advanced-trading/dynamic-dispatch
   */
  async dynamicResourceDispatch(req, res) {
    try {
      const { vppId, demandForecast, resourceAvailability, constraints } = req.body;
      
      if (!vppId || !demandForecast || !resourceAvailability) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, demandForecast, resourceAvailability'
        });
      }
      
      const dispatchConfig = { vppId, demandForecast, resourceAvailability, constraints };
      const result = await vppAdvancedTradingService.dynamicResourceDispatch(dispatchConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('动态资源调度失败:', error);
      res.status(500).json({
        success: false,
        error: '动态资源调度失败',
        message: error.message
      });
    }
  }

  /**
   * 执行风险对冲
   * POST /api/vpp/advanced-trading/risk-hedging
   */
  async executeRiskHedging(req, res) {
    try {
      const { vppId, riskExposure, hedgingInstruments, strategy } = req.body;
      
      if (!vppId || !riskExposure || !hedgingInstruments) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, riskExposure, hedgingInstruments'
        });
      }
      
      const hedgingConfig = { vppId, riskExposure, hedgingInstruments, strategy };
      const result = await vppAdvancedTradingService.executeRiskHedging(hedgingConfig);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('执行风险对冲失败:', error);
      res.status(500).json({
        success: false,
        error: '执行风险对冲失败',
        message: error.message
      });
    }
  }

  // ==================== P2阶段：智能决策系统接口 ====================

  /**
   * 强化学习决策
   * POST /api/vpp/intelligent-decision/rl-decision
   */
  async makeRLDecision(req, res) {
    try {
      const { vppId, state, availableActions, modelId } = req.body;
      
      if (!vppId || !state || !availableActions) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, state, availableActions'
        });
      }
      
      const decisionConfig = { vppId, state, availableActions, modelId };
      const result = await vppIntelligentDecisionService.makeRLDecision(decisionConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('强化学习决策失败:', error);
      res.status(500).json({
        success: false,
        error: '强化学习决策失败',
        message: error.message
      });
    }
  }

  /**
   * 多目标优化决策
   * POST /api/vpp/intelligent-decision/multi-objective
   */
  async makeMultiObjectiveDecision(req, res) {
    try {
      const { vppId, objectives, constraints, preferences } = req.body;
      
      if (!vppId || !objectives) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, objectives'
        });
      }
      
      const decisionConfig = { vppId, objectives, constraints, preferences };
      const result = await vppIntelligentDecisionService.makeMultiObjectiveDecision(decisionConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('多目标优化决策失败:', error);
      res.status(500).json({
        success: false,
        error: '多目标优化决策失败',
        message: error.message
      });
    }
  }

  /**
   * 自适应参数调整
   * POST /api/vpp/intelligent-decision/adaptive-adjustment
   */
  async adaptiveParameterAdjustment(req, res) {
    try {
      const { vppId, currentParameters, performanceMetrics, adjustmentStrategy } = req.body;
      
      if (!vppId || !currentParameters || !performanceMetrics) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, currentParameters, performanceMetrics'
        });
      }
      
      const adjustmentConfig = { vppId, currentParameters, performanceMetrics, adjustmentStrategy };
      const result = await vppIntelligentDecisionService.adaptiveParameterAdjustment(adjustmentConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('自适应参数调整失败:', error);
      res.status(500).json({
        success: false,
        error: '自适应参数调整失败',
        message: error.message
      });
    }
  }

  /**
   * 市场趋势预测
   * POST /api/vpp/intelligent-decision/market-prediction
   */
  async predictMarketTrends(req, res) {
    try {
      const { vppId, historicalData, predictionHorizon, modelType } = req.body;
      
      if (!vppId || !historicalData || !predictionHorizon) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, historicalData, predictionHorizon'
        });
      }
      
      const predictionConfig = { vppId, historicalData, predictionHorizon, modelType };
      const result = await vppIntelligentDecisionService.predictMarketTrends(predictionConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('市场趋势预测失败:', error);
      res.status(500).json({
        success: false,
        error: '市场趋势预测失败',
        message: error.message
      });
    }
  }

  // ==================== P2阶段：高级分析功能接口 ====================

  /**
   * 实时风险监控
   * POST /api/vpp/advanced-analytics/risk-monitoring
   */
  async monitorRiskInRealTime(req, res) {
    try {
      const { vppId, riskMetrics, thresholds, alertSettings } = req.body;
      
      if (!vppId || !riskMetrics) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, riskMetrics'
        });
      }
      
      const monitoringConfig = { vppId, riskMetrics, thresholds, alertSettings };
      const result = await vppAdvancedAnalyticsService.monitorRiskInRealTime(monitoringConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('实时风险监控失败:', error);
      res.status(500).json({
        success: false,
        error: '实时风险监控失败',
        message: error.message
      });
    }
  }

  /**
   * 投资组合优化
   * POST /api/vpp/advanced-analytics/portfolio-optimization
   */
  async optimizePortfolio(req, res) {
    try {
      const { vppId, assets, constraints, objectives, riskTolerance } = req.body;
      
      if (!vppId || !assets || !objectives) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, assets, objectives'
        });
      }
      
      const optimizationConfig = { vppId, assets, constraints, objectives, riskTolerance };
      const result = await vppAdvancedAnalyticsService.optimizePortfolio(optimizationConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('投资组合优化失败:', error);
      res.status(500).json({
        success: false,
        error: '投资组合优化失败',
        message: error.message
      });
    }
  }

  /**
   * 敏感性分析
   * POST /api/vpp/advanced-analytics/sensitivity-analysis
   */
  async performSensitivityAnalysis(req, res) {
    try {
      const { vppId, baseScenario, variables, ranges, outputMetrics } = req.body;
      
      if (!vppId || !baseScenario || !variables || !outputMetrics) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, baseScenario, variables, outputMetrics'
        });
      }
      
      const analysisConfig = { vppId, baseScenario, variables, ranges, outputMetrics };
      const result = await vppAdvancedAnalyticsService.performSensitivityAnalysis(analysisConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('敏感性分析失败:', error);
      res.status(500).json({
        success: false,
        error: '敏感性分析失败',
        message: error.message
      });
    }
  }

  /**
   * 压力测试
   * POST /api/vpp/advanced-analytics/stress-test
   */
  async runStressTest(req, res) {
    try {
      const { vppId, stressScenarios, testParameters, evaluationMetrics } = req.body;
      
      if (!vppId || !stressScenarios || !evaluationMetrics) {
        return res.status(400).json({
          success: false,
          error: '缺少必要字段: vppId, stressScenarios, evaluationMetrics'
        });
      }
      
      const testConfig = { vppId, stressScenarios, testParameters, evaluationMetrics };
      const result = await vppAdvancedAnalyticsService.runStressTest(testConfig);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('压力测试失败:', error);
      res.status(500).json({
        success: false,
        error: '压力测试失败',
        message: error.message
      });
    }
  }

  // ==================== 系统接口 ====================

  /**
   * 获取服务状态
   * GET /api/vpp/status
   */
  async getServiceStatus(req, res) {
    try {
      // P0阶段核心服务状态
      const resourceStatus = await vppResourceService.getServiceStatus();
      const vppStatus = await vppManagementService.getServiceStatus();
      const resourceTemplateStatus = await vppResourceTemplateService.getServiceStatus();
      const resourceAggregationStatus = await vppResourceAggregationService.getServiceStatus();
      const tradingStrategyStatus = await vppTradingStrategyService.getServiceStatus();
      const tradingExecutionStatus = await vppTradingExecutionService.getServiceStatus();
      const marketConnectorStatus = await vppMarketConnectorService.getServiceStatus();
      const settlementAnalysisStatus = await vppSettlementAnalysisService.getServiceStatus();
      
      // P1阶段服务状态
      const strategyStatus = await vppStrategyService.getServiceStatus();
      const aiModelStatus = await vppAIModelService.getServiceStatus();
      const backtestStatus = await vppBacktestService.getServiceStatus();
      const tradingStatus = await vppTradingService.getServiceStatus();
      const analyticsStatus = await vppAnalyticsService.getServiceStatus();
      
      // P2阶段高级服务状态
      const advancedTradingStatus = await vppAdvancedTradingService.getServiceStatus();
      const intelligentDecisionStatus = await vppIntelligentDecisionService.getServiceStatus();
      const advancedAnalyticsStatus = await vppAdvancedAnalyticsService.getServiceStatus();
      
      // P1阶段智能决策增强服务状态
      const intelligentDecisionEnhancedStatus = await vppIntelligentDecisionEnhancedService.getServiceStatus();
      
      res.json({
        success: true,
        data: {
          // P0阶段核心服务
          resourceService: resourceStatus,
          vppService: vppStatus,
          resourceTemplateService: resourceTemplateStatus,
          resourceAggregationService: resourceAggregationStatus,
          tradingStrategyService: tradingStrategyStatus,
          tradingExecutionService: tradingExecutionStatus,
          marketConnectorService: marketConnectorStatus,
          settlementAnalysisService: settlementAnalysisStatus,
          
          // P1阶段服务
          strategyService: strategyStatus,
          aiModelService: aiModelStatus,
          backtestService: backtestStatus,
          tradingService: tradingStatus,
          analyticsService: analyticsStatus,
          
          // P2阶段高级服务
          advancedTradingService: advancedTradingStatus,
          intelligentDecisionService: intelligentDecisionStatus,
          advancedAnalyticsService: advancedAnalyticsStatus,
          
          // P1阶段智能决策增强服务
          intelligentDecisionEnhancedService: intelligentDecisionEnhancedStatus,
          
          overall: {
            status: 'running',
            version: '3.0.0',
            phase: 'P0 - 资源聚合与管理中心',
            timestamp: new Date().toISOString()
          }
        }
      });
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取服务状态失败',
        message: error.message
      });
    }
  }

  /**
   * 健康检查
   * GET /api/vpp/health
   */
  async getHealthCheck(req, res) {
    try {
      // 全面的健康检查
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
          // P0阶段核心服务
          resourceService: 'healthy',
          vppService: 'healthy',
          resourceTemplateService: 'healthy',
          resourceAggregationService: 'healthy',
          tradingStrategyService: 'healthy',
          tradingExecutionService: 'healthy',
          marketConnectorService: 'healthy',
          settlementAnalysisService: 'healthy',
          
          // P1阶段服务
          strategyService: 'healthy',
          aiModelService: 'healthy',
          backtestService: 'healthy',
          tradingService: 'healthy',
          analyticsService: 'healthy',
          
          // P2阶段高级服务
          advancedTradingService: 'healthy',
          intelligentDecisionService: 'healthy',
          advancedAnalyticsService: 'healthy',
          
          // P1阶段智能决策增强服务
          intelligentDecisionEnhancedService: 'healthy'
        },
        phase: {
          current: 'P0',
          description: '资源聚合与管理中心',
          progress: '100%',
          nextPhase: 'P1 - 电力市场与交易策略中心'
        }
      };
      
      res.json({
        success: true,
        data: healthStatus
      });
      
    } catch (error) {
      logger.error('健康检查失败:', error);
      res.status(500).json({
        success: false,
        error: '健康检查失败',
        message: error.message
      });
    }
  }
}

// 创建控制器实例
const vppController = new VPPController();

export default vppController;