import express from 'express';
import vppController from '../controllers/VPPController.js';
import logger from '../../src/shared/utils/logger.js';

/**
 * 虚拟电厂路由配置
 * 定义虚拟电厂相关的API路由
 * P0阶段功能：资源管理、VPP管理、基础监控
 */
const router = express.Router();

// 中间件：请求日志记录
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info(`VPP API请求开始: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // 响应结束时记录日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`VPP API请求完成: ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
});

// 中间件：错误处理
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== 系统接口 ====================

/**
 * 健康检查
 * GET /api/vpp/health
 */
router.get('/health', asyncHandler(vppController.getHealthCheck));

/**
 * 服务状态
 * GET /api/vpp/status
 */
router.get('/status', asyncHandler(vppController.getServiceStatus));

// ==================== 资源管理接口 ====================

/**
 * 获取资源列表
 * GET /api/vpp/resources
 * 查询参数：
 * - type: 资源类型 (solar, wind, battery, load)
 * - status: 资源状态 (online, offline, maintenance, error)
 * - location: 位置筛选
 * - limit: 分页大小 (默认50，最大100)
 * - offset: 分页偏移 (默认0)
 */
router.get('/resources', asyncHandler(vppController.getResources));

/**
 * 获取聚合容量信息
 * GET /api/vpp/resources/aggregated-capacity
 * 查询参数：
 * - type: 资源类型筛选
 * - status: 状态筛选
 * - location: 位置筛选
 */
router.get('/resources/aggregated-capacity', asyncHandler(vppController.getAggregatedCapacity));

/**
 * 获取资源详情
 * GET /api/vpp/resources/:id
 */
router.get('/resources/:id', asyncHandler(vppController.getResourceById));

/**
 * 注册新资源
 * POST /api/vpp/resources
 * 请求体：
 * {
 *   "name": "资源名称",
 *   "type": "资源类型",
 *   "description": "资源描述",
 *   "ratedCapacity": 额定容量,
 *   "unit": "单位",
 *   "technicalSpecs": {},
 *   "operationalConstraints": {},
 *   "location": "位置",
 *   "latitude": 纬度,
 *   "longitude": 经度
 * }
 */
router.post('/resources', asyncHandler(vppController.registerResource));

/**
 * 更新资源状态
 * PUT /api/vpp/resources/:id/status
 * 请求体：
 * {
 *   "status": "状态",
 *   "currentOutput": 当前输出,
 *   "availableCapacity": 可用容量,
 *   "efficiency": 效率,
 *   "realTimeData": {}
 * }
 */
router.put('/resources/:id/status', asyncHandler(vppController.updateResourceStatus));

/**
 * 删除资源
 * DELETE /api/vpp/resources/:id
 */
router.delete('/resources/:id', asyncHandler(vppController.deleteResource));

// ==================== VPP管理接口 ====================

/**
 * 获取VPP列表
 * GET /api/vpp/vpps
 * 查询参数：
 * - status: VPP状态筛选
 * - limit: 分页大小 (默认50，最大100)
 * - offset: 分页偏移 (默认0)
 */
router.get('/vpps', asyncHandler(vppController.getVPPs));

/**
 * 获取VPP详情
 * GET /api/vpp/vpps/:id
 */
router.get('/vpps/:id', asyncHandler(vppController.getVPPById));

/**
 * 创建VPP
 * POST /api/vpp/vpps
 * 请求体：
 * {
 *   "name": "VPP名称",
 *   "description": "VPP描述",
 *   "resourceIds": [资源ID列表],
 *   "operationalStrategy": {},
 *   "targetCapacity": 目标容量
 * }
 */
router.post('/vpps', asyncHandler(vppController.createVPP));

/**
 * 更新VPP
 * PUT /api/vpp/vpps/:id
 * 请求体：
 * {
 *   "name": "VPP名称",
 *   "description": "VPP描述",
 *   "operationalStrategy": {},
 *   "status": "状态"
 * }
 */
router.put('/vpps/:id', asyncHandler(vppController.updateVPP));

/**
 * 删除VPP
 * DELETE /api/vpp/vpps/:id
 */
router.delete('/vpps/:id', asyncHandler(vppController.deleteVPP));

/**
 * 为VPP添加资源
 * POST /api/vpp/vpps/:id/resources
 * 请求体：
 * {
 *   "resourceAssociations": [
 *     {
 *       "resourceId": 资源ID,
 *       "allocationRatio": 分配比例,
 *       "priority": 优先级,
 *       "constraints": {}
 *     }
 *   ]
 * }
 */
router.post('/vpps/:id/resources', asyncHandler(vppController.addResourcesToVPP));

/**
 * 从VPP移除资源
 * DELETE /api/vpp/vpps/:id/resources
 * 请求体：
 * {
 *   "resourceIds": [资源ID列表]
 * }
 */
router.delete('/vpps/:id/resources', asyncHandler(vppController.removeResourcesFromVPP));

/**
 * 获取VPP操作日志
 * GET /api/vpp/vpps/:id/logs
 * 查询参数：
 * - operationType: 操作类型筛选
 * - limit: 分页大小 (默认50，最大100)
 * - offset: 分页偏移 (默认0)
 */
router.get('/vpps/:id/logs', asyncHandler(vppController.getVPPOperationLogs));

// ==================== P0阶段新增路由 ====================

// 资源模板管理接口
/**
 * 获取资源模板列表
 * GET /api/vpp/resource-templates
 * 查询参数：
 * - type: 模板类型筛选
 * - category: 模板分类筛选
 * - limit: 分页大小 (默认50，最大100)
 * - offset: 分页偏移 (默认0)
 */
router.get('/resource-templates', asyncHandler(vppController.getResourceTemplates));

/**
 * 创建资源模板
 * POST /api/vpp/resource-templates
 * 请求体：
 * {
 *   "name": "模板名称",
 *   "type": "模板类型",
 *   "category": "模板分类",
 *   "description": "模板描述",
 *   "defaultConfig": {},
 *   "validationRules": {},
 *   "uiSchema": {}
 * }
 */
router.post('/resource-templates', asyncHandler(vppController.createResourceTemplate));

/**
 * 更新资源模板
 * PUT /api/vpp/resource-templates/:id
 */
router.put('/resource-templates/:id', asyncHandler(vppController.updateResourceTemplate));

/**
 * 删除资源模板
 * DELETE /api/vpp/resource-templates/:id
 */
router.delete('/resource-templates/:id', asyncHandler(vppController.deleteResourceTemplate));

/**
 * 获取模板版本历史
 * GET /api/vpp/resource-templates/:id/versions
 */
router.get('/resource-templates/:id/versions', asyncHandler(vppController.getTemplateVersions));

// 资源聚合管理接口
/**
 * 创建VPP聚合
 * POST /api/vpp/aggregations
 * 请求体：
 * {
 *   "name": "聚合名称",
 *   "description": "聚合描述",
 *   "strategy": "聚合策略",
 *   "targetCapacity": 目标容量,
 *   "priority": 优先级
 * }
 */
router.post('/aggregations', asyncHandler(vppController.createAggregation));

/**
 * 添加资源到聚合
 * POST /api/vpp/aggregations/:id/resources
 * 请求体：
 * {
 *   "resourceId": 资源ID,
 *   "allocationRatio": 分配比例,
 *   "priority": 优先级
 * }
 */
router.post('/aggregations/:id/resources', asyncHandler(vppController.addResourceToAggregation));

/**
 * 从聚合移除资源
 * DELETE /api/vpp/aggregations/:id/resources/:resourceId
 */
router.delete('/aggregations/:id/resources/:resourceId', asyncHandler(vppController.removeResourceFromAggregation));

/**
 * 获取聚合列表
 * GET /api/vpp/aggregations
 */
router.get('/aggregations', asyncHandler(vppController.getAggregations));

/**
 * 获取聚合详情
 * GET /api/vpp/aggregations/:id
 */
router.get('/aggregations/:id', asyncHandler(vppController.getAggregationById));

/**
 * 激活聚合
 * POST /api/vpp/aggregations/:id/activate
 */
router.post('/aggregations/:id/activate', asyncHandler(vppController.activateAggregation));

/**
 * 获取聚合冲突
 * GET /api/vpp/aggregations/:id/conflicts
 */
router.get('/aggregations/:id/conflicts', asyncHandler(vppController.getAggregationConflicts));

// 交易策略管理接口
/**
 * 获取交易策略列表
 * GET /api/vpp/trading-strategies
 * 查询参数：
 * - type: 策略类型筛选
 * - status: 策略状态筛选
 * - targetMarket: 目标市场筛选
 * - limit: 分页大小 (默认50，最大100)
 * - offset: 分页偏移 (默认0)
 */
router.get('/trading-strategies', asyncHandler(vppController.getTradingStrategies));

/**
 * 创建交易策略
 * POST /api/vpp/trading-strategies
 * 请求体：
 * {
 *   "name": "策略名称",
 *   "type": "策略类型",
 *   "description": "策略描述",
 *   "targetMarket": "目标市场",
 *   "parameters": {},
 *   "riskLimits": {}
 * }
 */
router.post('/trading-strategies', asyncHandler(vppController.createTradingStrategy));

/**
 * 验证交易策略
 * POST /api/vpp/trading-strategies/:id/validate
 * 请求体：
 * {
 *   "validationType": "验证类型",
 *   "parameters": {}
 * }
 */
router.post('/trading-strategies/:id/validate', asyncHandler(vppController.validateTradingStrategy));

/**
 * 激活交易策略
 * POST /api/vpp/trading-strategies/:id/activate
 */
router.post('/trading-strategies/:id/activate', asyncHandler(vppController.activateTradingStrategy));

/**
 * 获取策略模板
 * GET /api/vpp/trading-strategy-templates
 */
router.get('/trading-strategy-templates', asyncHandler(vppController.getTradingStrategyTemplates));

// 交易执行管理接口
/**
 * 启动交易执行引擎
 * POST /api/vpp/trading-execution/start
 */
router.post('/trading-execution/start', asyncHandler(vppController.startTradingEngine));

/**
 * 停止交易执行引擎
 * POST /api/vpp/trading-execution/stop
 */
router.post('/trading-execution/stop', asyncHandler(vppController.stopTradingEngine));

/**
 * 获取执行记录
 * GET /api/vpp/trading-execution/records
 */
router.get('/trading-execution/records', asyncHandler(vppController.getTradingExecutionRecords));

/**
 * 获取订单列表
 * GET /api/vpp/trading-execution/orders
 */
router.get('/trading-execution/orders', asyncHandler(vppController.getTradingOrders));

/**
 * 获取风险监控
 * GET /api/vpp/trading-execution/risk-monitoring
 */
router.get('/trading-execution/risk-monitoring', asyncHandler(vppController.getTradingRiskMonitoring));

// 市场连接器管理接口
/**
 * 获取市场连接状态
 * GET /api/vpp/market-connector/status
 */
router.get('/market-connector/status', asyncHandler(vppController.getMarketConnectorStatus));

/**
 * 连接市场
 * POST /api/vpp/market-connector/:marketType/connect
 */
router.post('/market-connector/:marketType/connect', asyncHandler(vppController.connectMarket));

/**
 * 断开市场连接
 * POST /api/vpp/market-connector/:marketType/disconnect
 */
router.post('/market-connector/:marketType/disconnect', asyncHandler(vppController.disconnectMarket));

/**
 * 订阅市场数据
 * POST /api/vpp/market-connector/:marketType/subscribe
 * 请求体：
 * {
 *   "dataTypes": ["数据类型列表"],
 *   "symbols": ["交易品种列表"]
 * }
 */
router.post('/market-connector/:marketType/subscribe', asyncHandler(vppController.subscribeMarketData));

/**
 * 提交订单到市场
 * POST /api/vpp/market-connector/:marketType/order
 * 请求体：
 * {
 *   "orderType": "订单类型",
 *   "symbol": "交易品种",
 *   "quantity": 数量,
 *   "price": 价格,
 *   "side": "买卖方向"
 * }
 */
router.post('/market-connector/:marketType/order', asyncHandler(vppController.submitMarketOrder));

/**
 * 获取市场数据
 * GET /api/vpp/market-connector/:marketType/data
 */
router.get('/market-connector/:marketType/data', asyncHandler(vppController.getMarketData));

// 结算分析管理接口
/**
 * 创建结算记录
 * POST /api/vpp/settlement/records
 * 请求体：
 * {
 *   "tradingDate": "交易日期",
 *   "settlementType": "结算类型",
 *   "marketType": "市场类型",
 *   "currency": "货币类型"
 * }
 */
router.post('/settlement/records', asyncHandler(vppController.createSettlementRecord));

/**
 * 获取结算记录
 * GET /api/vpp/settlement/records
 */
router.get('/settlement/records', asyncHandler(vppController.getSettlementRecords));

/**
 * 生成财务分析
 * POST /api/vpp/settlement/financial-analysis
 * 请求体：
 * {
 *   "analysisType": "分析类型",
 *   "startDate": "开始日期",
 *   "endDate": "结束日期",
 *   "parameters": {}
 * }
 */
router.post('/settlement/financial-analysis', asyncHandler(vppController.generateFinancialAnalysis));

/**
 * 生成报告
 * POST /api/vpp/settlement/reports
 * 请求体：
 * {
 *   "reportType": "报告类型",
 *   "startDate": "开始日期",
 *   "endDate": "结束日期",
 *   "format": "报告格式"
 * }
 */
router.post('/settlement/reports', asyncHandler(vppController.generateSettlementReport));

/**
 * 获取账户余额
 * GET /api/vpp/settlement/balance
 */
router.get('/settlement/balance', asyncHandler(vppController.getAccountBalance));

/**
 * 获取合规监控
 * GET /api/vpp/settlement/compliance
 */
router.get('/settlement/compliance', asyncHandler(vppController.getComplianceMonitoring));

// ==================== P1阶段新增路由 ====================

// 策略管理接口
router.get('/strategies', asyncHandler(vppController.getStrategies));
router.post('/strategies', asyncHandler(vppController.createStrategy));
router.put('/strategies/:id', asyncHandler(vppController.updateStrategy));
router.delete('/strategies/:id', asyncHandler(vppController.deleteStrategy));

// AI模型管理接口
router.get('/ai-models', asyncHandler(vppController.getAIModels));
router.post('/ai-models', asyncHandler(vppController.createAIModel));
router.post('/ai-models/:id/train', asyncHandler(vppController.trainAIModel));

// 回测仿真接口
router.post('/backtest', asyncHandler(vppController.runBacktest));
router.get('/backtest/:id/results', asyncHandler(vppController.getBacktestResults));

// 交易执行接口
router.post('/trading/execute', asyncHandler(vppController.executeTrade));
router.get('/trading/history', asyncHandler(vppController.getTradingHistory));

// 分析报告接口
router.post('/analytics/report', asyncHandler(vppController.generateAnalyticsReport));

// =====================================================
// P2阶段：高级交易功能路由
// =====================================================

// 套利策略
router.post('/advanced-trading/arbitrage', asyncHandler(vppController.executeArbitrageStrategy));

// 实时价格优化
router.post('/advanced-trading/optimize-pricing', asyncHandler(vppController.optimizePricing));

// 动态资源调度
router.post('/advanced-trading/dynamic-dispatch', asyncHandler(vppController.dynamicResourceDispatch));

// 风险对冲
router.post('/advanced-trading/risk-hedging', asyncHandler(vppController.executeRiskHedging));

// =====================================================
// P2阶段：智能决策系统路由
// =====================================================

// 强化学习决策
router.post('/intelligent-decision/rl-decision', asyncHandler(vppController.makeRLDecision));

// 多目标优化决策
router.post('/intelligent-decision/multi-objective', asyncHandler(vppController.makeMultiObjectiveDecision));

// 自适应参数调整
router.post('/intelligent-decision/adaptive-adjustment', asyncHandler(vppController.adaptiveParameterAdjustment));

// 市场趋势预测
router.post('/intelligent-decision/market-prediction', asyncHandler(vppController.predictMarketTrends));

// =====================================================
// P2阶段：高级分析功能路由
// =====================================================

// 实时风险监控
router.post('/advanced-analytics/risk-monitoring', asyncHandler(vppController.monitorRiskInRealTime));

// 投资组合优化
router.post('/advanced-analytics/portfolio-optimization', asyncHandler(vppController.optimizePortfolio));

// 敏感性分析
router.post('/advanced-analytics/sensitivity-analysis', asyncHandler(vppController.performSensitivityAnalysis));

// 压力测试
router.post('/advanced-analytics/stress-test', asyncHandler(vppController.runStressTest));

// =====================================================
// P1阶段：智能决策增强接口
// =====================================================

/**
 * 执行智能决策
 * POST /api/vpp/intelligent-decision/make-decision
 * 请求体：
 * {
 *   "vppId": VPP ID,
 *   "decisionType": "决策类型 (TRADING, RESOURCE_ALLOCATION, RISK_MANAGEMENT)",
 *   "marketData": {},
 *   "resourceData": {},
 *   "constraints": {},
 *   "preferences": {}
 * }
 */
router.post('/intelligent-decision/make-decision', asyncHandler(vppController.makeIntelligentDecision));

/**
 * 分析市场条件
 * POST /api/vpp/intelligent-decision/analyze-market
 * 请求体：
 * {
 *   "marketData": {},
 *   "timeHorizon": "时间范围 (1h, 4h, 24h)",
 *   "analysisType": "分析类型 (comprehensive, quick, detailed)"
 * }
 */
router.post('/intelligent-decision/analyze-market', asyncHandler(vppController.analyzeMarketConditions));

/**
 * AI预测
 * POST /api/vpp/intelligent-decision/predict
 * 请求体：
 * {
 *   "modelType": "模型类型 (PRICE_PREDICTION, DEMAND_FORECAST, RISK_ASSESSMENT)",
 *   "inputData": {},
 *   "predictionHorizon": "预测时间范围",
 *   "confidenceLevel": 置信度水平
 * }
 */
router.post('/intelligent-decision/predict', asyncHandler(vppController.predictWithAI));

/**
 * 验证决策
 * POST /api/vpp/intelligent-decision/validate
 * 请求体：
 * {
 *   "decision": {},
 *   "constraints": {},
 *   "riskThresholds": {}
 * }
 */
router.post('/intelligent-decision/validate', asyncHandler(vppController.validateDecision));

/**
 * 获取决策历史
 * GET /api/vpp/intelligent-decision/history
 * 查询参数：
 * - vppId: VPP ID
 * - decisionType: 决策类型
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - limit: 分页大小 (默认50，最大100)
 * - offset: 分页偏移 (默认0)
 */
router.get('/intelligent-decision/history', asyncHandler(vppController.getDecisionHistory));

// ==================== 错误处理中间件 ====================

/**
 * 404错误处理
 */
router.use('*', (req, res) => {
  logger.warn(`VPP API路由未找到: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'API路由未找到',
    message: `${req.method} ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

/**
 * 通用错误处理
 */
router.use((error, req, res, next) => {
  logger.error('VPP API错误:', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  // 根据错误类型返回不同的状态码
  let statusCode = 500;
  let errorMessage = '内部服务器错误';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = '请求参数验证失败';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = '未授权访问';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = '访问被禁止';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = '资源未找到';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    errorMessage = '资源冲突';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    errorMessage = '请求过于频繁';
  }
  
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    message: error.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default router;