/**
 * VPP交易策略编辑器API路由
 * 提供策略创建、编辑、执行和监控的RESTful接口
 */

import express from 'express';
import vppTradingStrategyEditorService from '../services/VPPTradingStrategyEditorService.js';
import { STRATEGY_TYPE, CONDITION_TYPE, ACTION_TYPE, OPERATOR, STRATEGY_STATUS } from '../services/VPPTradingStrategyEditorService.js';
import logger from '../shared/utils/logger.js';
import { authenticateToken } from '../interfaces/http/middleware/authMiddleware.js';
import { validateRequest } from '../interfaces/http/middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// 应用认证中间件
router.use(authenticateToken);

/**
 * @swagger
 * /api/vpp/trading-strategy/strategies:
 *   get:
 *     summary: 获取策略列表
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, stopped, archived, error]
 *         description: 策略状态过滤
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rule_based, ai_driven, hybrid, manual]
 *         description: 策略类型过滤
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否活跃过滤
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 策略列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 strategies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TradingStrategy'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/strategies', [
  query('status').optional().isIn(Object.values(STRATEGY_STATUS)),
  query('type').optional().isIn(Object.values(STRATEGY_TYPE)),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest
], async (req, res) => {
  try {
    const { status, type, isActive, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    const result = await vppTradingStrategyEditorService.getStrategies(filters);
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStrategies = result.strategies.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      strategies: paginatedStrategies,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    logger.error('获取策略列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取策略列表失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vpp/trading-strategy/strategies:
 *   post:
 *     summary: 创建新策略
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: 策略名称
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: 策略描述
 *               type:
 *                 type: string
 *                 enum: [rule_based, ai_driven, hybrid, manual]
 *                 description: 策略类型
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: 策略优先级
 *               config:
 *                 type: object
 *                 description: 策略配置
 *               riskParameters:
 *                 type: object
 *                 description: 风险参数
 *               performanceTargets:
 *                 type: object
 *                 description: 性能目标
 *     responses:
 *       201:
 *         description: 策略创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 strategyId:
 *                   type: string
 *                 strategy:
 *                   $ref: '#/components/schemas/TradingStrategy'
 */
router.post('/strategies', [
  body('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('策略名称必须在1-100字符之间'),
  body('description').optional().isLength({ max: 500 }).withMessage('策略描述不能超过500字符'),
  body('type').isIn(Object.values(STRATEGY_TYPE)).withMessage('无效的策略类型'),
  body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('优先级必须在1-10之间'),
  body('config').optional().isObject().withMessage('配置必须是对象格式'),
  body('riskParameters').optional().isObject().withMessage('风险参数必须是对象格式'),
  body('performanceTargets').optional().isObject().withMessage('性能目标必须是对象格式'),
  validateRequest
], async (req, res) => {
  try {
    const strategyData = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const result = await vppTradingStrategyEditorService.createStrategy(strategyData);
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('创建策略失败:', error);
    res.status(500).json({
      success: false,
      message: '创建策略失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vpp/trading-strategy/strategies/{strategyId}:
 *   get:
 *     summary: 获取策略详情
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 策略ID
 *     responses:
 *       200:
 *         description: 策略详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 strategy:
 *                   $ref: '#/components/schemas/TradingStrategy'
 *                 rules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TradingRule'
 *                 executions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StrategyExecution'
 *                 statistics:
 *                   $ref: '#/components/schemas/StrategyStatistics'
 */
router.get('/strategies/:strategyId', [
  param('strategyId').isUUID().withMessage('无效的策略ID格式'),
  validateRequest
], async (req, res) => {
  try {
    const { strategyId } = req.params;
    
    const result = await vppTradingStrategyEditorService.getStrategyDetails(strategyId);
    
    res.json(result);
  } catch (error) {
    logger.error('获取策略详情失败:', error);
    
    if (error.message.includes('策略不存在')) {
      res.status(404).json({
        success: false,
        message: '策略不存在',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '获取策略详情失败',
        error: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/vpp/trading-strategy/strategies/{strategyId}/rules:
 *   post:
 *     summary: 添加规则到策略
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 策略ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - conditions
 *               - actions
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: 规则名称
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: 规则描述
 *               conditions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/RuleCondition'
 *                 description: 规则条件
 *               actions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/RuleAction'
 *                 description: 规则动作
 *               isEnabled:
 *                 type: boolean
 *                 default: true
 *                 description: 是否启用
 *               executionConfig:
 *                 type: object
 *                 description: 执行配置
 *     responses:
 *       201:
 *         description: 规则添加成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 ruleId:
 *                   type: string
 *                 rule:
 *                   $ref: '#/components/schemas/TradingRule'
 */
router.post('/strategies/:strategyId/rules', [
  param('strategyId').isUUID().withMessage('无效的策略ID格式'),
  body('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('规则名称必须在1-100字符之间'),
  body('description').optional().isLength({ max: 500 }).withMessage('规则描述不能超过500字符'),
  body('conditions').isArray({ min: 1 }).withMessage('至少需要一个条件'),
  body('conditions.*.type').isIn(Object.values(CONDITION_TYPE)).withMessage('无效的条件类型'),
  body('conditions.*.operator').isIn(Object.values(OPERATOR)).withMessage('无效的操作符'),
  body('actions').isArray({ min: 1 }).withMessage('至少需要一个动作'),
  body('actions.*.type').isIn(Object.values(ACTION_TYPE)).withMessage('无效的动作类型'),
  body('isEnabled').optional().isBoolean().withMessage('启用状态必须是布尔值'),
  body('executionConfig').optional().isObject().withMessage('执行配置必须是对象格式'),
  validateRequest
], async (req, res) => {
  try {
    const { strategyId } = req.params;
    const ruleData = req.body;
    
    const result = await vppTradingStrategyEditorService.addRuleToStrategy(strategyId, ruleData);
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('添加规则失败:', error);
    
    if (error.message.includes('策略不存在')) {
      res.status(404).json({
        success: false,
        message: '策略不存在',
        error: error.message
      });
    } else if (error.message.includes('规则数量已达上限')) {
      res.status(400).json({
        success: false,
        message: '规则数量已达上限',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '添加规则失败',
        error: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/vpp/trading-strategy/strategies/{strategyId}/activate:
 *   post:
 *     summary: 激活策略
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 策略ID
 *     responses:
 *       200:
 *         description: 策略激活成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/strategies/:strategyId/activate', [
  param('strategyId').isUUID().withMessage('无效的策略ID格式'),
  validateRequest
], async (req, res) => {
  try {
    const { strategyId } = req.params;
    
    const result = await vppTradingStrategyEditorService.activateStrategy(strategyId);
    
    res.json({
      ...result,
      message: '策略激活成功'
    });
  } catch (error) {
    logger.error('激活策略失败:', error);
    res.status(500).json({
      success: false,
      message: '激活策略失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vpp/trading-strategy/strategies/{strategyId}/deactivate:
 *   post:
 *     summary: 停用策略
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 策略ID
 *     responses:
 *       200:
 *         description: 策略停用成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/strategies/:strategyId/deactivate', [
  param('strategyId').isUUID().withMessage('无效的策略ID格式'),
  validateRequest
], async (req, res) => {
  try {
    const { strategyId } = req.params;
    
    const result = await vppTradingStrategyEditorService.deactivateStrategy(strategyId);
    
    res.json({
      ...result,
      message: '策略停用成功'
    });
  } catch (error) {
    logger.error('停用策略失败:', error);
    res.status(500).json({
      success: false,
      message: '停用策略失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vpp/trading-strategy/enums:
 *   get:
 *     summary: 获取枚举值
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 枚举值获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 enums:
 *                   type: object
 *                   properties:
 *                     strategyTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     conditionTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     actionTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     operators:
 *                       type: array
 *                       items:
 *                         type: string
 *                     strategyStatuses:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/enums', async (req, res) => {
  try {
    res.json({
      success: true,
      enums: {
        strategyTypes: Object.values(STRATEGY_TYPE),
        conditionTypes: Object.values(CONDITION_TYPE),
        actionTypes: Object.values(ACTION_TYPE),
        operators: Object.values(OPERATOR),
        strategyStatuses: Object.values(STRATEGY_STATUS)
      }
    });
  } catch (error) {
    logger.error('获取枚举值失败:', error);
    res.status(500).json({
      success: false,
      message: '获取枚举值失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vpp/trading-strategy/status:
 *   get:
 *     summary: 获取服务状态
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 服务状态获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                 status:
 *                   type: string
 *                 statistics:
 *                   type: object
 *                 activeStrategies:
 *                   type: integer
 *                 loadedRules:
 *                   type: integer
 *                 uptime:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 */
router.get('/status', async (req, res) => {
  try {
    const status = await vppTradingStrategyEditorService.getServiceStatus();
    res.json(status);
  } catch (error) {
    logger.error('获取服务状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务状态失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vpp/trading-strategy/strategies/{strategyId}/statistics:
 *   get:
 *     summary: 获取策略统计信息
 *     tags: [VPP Trading Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 策略ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: 统计周期
 *     responses:
 *       200:
 *         description: 策略统计信息获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StrategyStatistics'
 */
router.get('/strategies/:strategyId/statistics', [
  param('strategyId').isUUID().withMessage('无效的策略ID格式'),
  query('period').optional().isIn(['1d', '7d', '30d', '90d', '1y']),
  validateRequest
], async (req, res) => {
  try {
    const { strategyId } = req.params;
    const { period = '30d' } = req.query;
    
    const statistics = await vppTradingStrategyEditorService.getStrategyStatistics(strategyId);
    
    res.json({
      success: true,
      strategyId,
      period,
      statistics
    });
  } catch (error) {
    logger.error('获取策略统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取策略统计失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     TradingStrategy:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         strategy_id:
 *           type: string
 *         strategy_name:
 *           type: string
 *         description:
 *           type: string
 *         strategy_type:
 *           type: string
 *           enum: [rule_based, ai_driven, hybrid, manual]
 *         status:
 *           type: string
 *           enum: [draft, active, paused, stopped, archived, error]
 *         version:
 *           type: integer
 *         priority:
 *           type: integer
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     TradingRule:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         rule_id:
 *           type: string
 *         strategy_id:
 *           type: string
 *         rule_name:
 *           type: string
 *         description:
 *           type: string
 *         rule_order:
 *           type: integer
 *         is_enabled:
 *           type: boolean
 *         conditions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RuleCondition'
 *         actions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RuleAction'
 *         created_at:
 *           type: string
 *           format: date-time
 *     
 *     RuleCondition:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [price_threshold, time_based, volume_threshold, market_status, weather_condition, demand_forecast, supply_forecast, grid_frequency, carbon_intensity, custom_indicator]
 *         field:
 *           type: string
 *         operator:
 *           type: string
 *           enum: [equals, not_equals, greater_than, less_than, greater_equal, less_equal, between, in, not_in, contains, starts_with, ends_with]
 *         value:
 *           oneOf:
 *             - type: string
 *             - type: number
 *             - type: array
 *         metadata:
 *           type: object
 *     
 *     RuleAction:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [submit_bid, cancel_order, adjust_price, modify_volume, activate_resource, deactivate_resource, send_notification, trigger_backup, execute_hedge, custom_action]
 *         parameters:
 *           type: object
 *         priority:
 *           type: integer
 *         timeout:
 *           type: integer
 *         retry_policy:
 *           type: object
 *     
 *     StrategyExecution:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         execution_id:
 *           type: string
 *         strategy_id:
 *           type: string
 *         rule_id:
 *           type: string
 *         started_at:
 *           type: string
 *           format: date-time
 *         completed_at:
 *           type: string
 *           format: date-time
 *         execution_status:
 *           type: string
 *         execution_time_ms:
 *           type: integer
 *         performance_score:
 *           type: number
 *     
 *     StrategyStatistics:
 *       type: object
 *       properties:
 *         totalExecutions:
 *           type: integer
 *         successfulExecutions:
 *           type: integer
 *         failedExecutions:
 *           type: integer
 *         successRate:
 *           type: string
 *         averageExecutionTime:
 *           type: number
 *         averagePerformanceScore:
 *           type: number
 */

export default router;