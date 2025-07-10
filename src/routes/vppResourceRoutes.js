/**
 * VPP资源管理API路由
 * 提供资源模板、资源实例、VPP聚合管理的RESTful接口
 * 版本: v1.0
 * 创建时间: 2025年1月
 */

import express from 'express';
import vppResourceService from '../services/vppResourceService.js';
import { authenticate } from '../interfaces/http/middleware/authMiddleware.js';
import { requireRole } from '../interfaces/http/middleware/roleCheck.js';
import { validateRequest } from '../interfaces/http/middleware/validation.js';
import { body, param, query } from 'express-validator';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * ==================== 资源模板管理接口 ====================
 */

/**
 * 获取资源模板列表
 * GET /api/v1/vpp/resource-templates
 */
router.get('/resource-templates', 
    authenticate,
    [
        query('type').optional().isString().withMessage('资源类型必须是字符串'),
        query('category').optional().isIn(['GENERATION', 'STORAGE', 'LOAD', 'FLEXIBLE']).withMessage('资源分类无效'),
        query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
        query('size').optional().isInt({ min: 1, max: 100 }).withMessage('页大小必须在1-100之间')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const result = await vppResourceService.getResourceTemplates(req.query);
            res.json(result);
        } catch (error) {
            logger.error('获取资源模板列表失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 创建资源模板
 * POST /api/v1/vpp/resource-templates
 */
router.post('/resource-templates',
    authenticate,
    requireRole(['admin', 'operator']),
    [
        body('name').notEmpty().isLength({ max: 100 }).withMessage('模板名称不能为空且长度不超过100字符'),
        body('type').notEmpty().isString().withMessage('资源类型不能为空'),
        body('category').isIn(['GENERATION', 'STORAGE', 'LOAD', 'FLEXIBLE']).withMessage('资源分类无效'),
        body('parameters').isObject().withMessage('技术参数必须是对象'),
        body('control_interface').isObject().withMessage('控制接口必须是对象'),
        body('version').optional().isString().withMessage('版本号必须是字符串')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const templateData = {
                ...req.body,
                created_by: req.user.id
            };
            
            const result = await vppResourceService.createResourceTemplate(templateData);
            res.status(201).json(result);
        } catch (error) {
            logger.error('创建资源模板失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 更新资源模板
 * PUT /api/v1/vpp/resource-templates/:id
 */
router.put('/resource-templates/:id',
    authenticate,
    requireRole(['admin', 'operator']),
    [
        param('id').isUUID().withMessage('模板ID格式无效'),
        body('name').optional().isLength({ max: 100 }).withMessage('模板名称长度不超过100字符'),
        body('parameters').optional().isObject().withMessage('技术参数必须是对象'),
        body('control_interface').optional().isObject().withMessage('控制接口必须是对象'),
        body('version').optional().isString().withMessage('版本号必须是字符串')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const result = await vppResourceService.updateResourceTemplate(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            logger.error('更新资源模板失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 删除资源模板
 * DELETE /api/v1/vpp/resource-templates/:id
 */
router.delete('/resource-templates/:id',
    authenticate,
    requireRole(['admin']),
    [
        param('id').isUUID().withMessage('模板ID格式无效')
    ],
    validateRequest,
    async (req, res) => {
        try {
            // 软删除：将状态设置为INACTIVE
            const result = await vppResourceService.updateResourceTemplate(req.params.id, { status: 'INACTIVE' });
            res.json({
                success: true,
                data: {
                    message: '资源模板删除成功'
                }
            });
        } catch (error) {
            logger.error('删除资源模板失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * ==================== 资源实例管理接口 ====================
 */

/**
 * 获取资源实例列表
 * GET /api/v1/vpp/resource-instances
 */
router.get('/resource-instances',
    authenticate,
    [
        query('template_id').optional().isUUID().withMessage('模板ID格式无效'),
        query('status').optional().isIn(['online', 'offline', 'maintenance', 'error', 'standby']).withMessage('状态值无效'),
        query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
        query('size').optional().isInt({ min: 1, max: 100 }).withMessage('页大小必须在1-100之间')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const result = await vppResourceService.getResourceInstances(req.query);
            res.json(result);
        } catch (error) {
            logger.error('获取资源实例列表失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 创建资源实例
 * POST /api/v1/vpp/resource-instances
 */
router.post('/resource-instances',
    authenticate,
    requireRole(['admin', 'operator']),
    [
        body('template_id').isUUID().withMessage('模板ID格式无效'),
        body('resource_id').isInt().withMessage('资源ID必须是整数'),
        body('device_ip').optional().isIP().withMessage('设备IP地址格式无效'),
        body('device_port').optional().isInt({ min: 1, max: 65535 }).withMessage('设备端口必须在1-65535之间'),
        body('location_info').optional().isObject().withMessage('位置信息必须是对象'),
        body('capacity').optional().isFloat({ min: 0 }).withMessage('容量必须是非负数')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const result = await vppResourceService.createResourceInstance(req.body);
            res.status(201).json(result);
        } catch (error) {
            logger.error('创建资源实例失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 更新资源实例状态
 * PUT /api/v1/vpp/resource-instances/:id/status
 */
router.put('/resource-instances/:id/status',
    authenticate,
    requireRole(['admin', 'operator']),
    [
        param('id').isInt().withMessage('实例ID必须是整数'),
        body('status').isIn(['online', 'offline', 'maintenance', 'error', 'standby']).withMessage('状态值无效'),
        body('reason').optional().isString().withMessage('原因必须是字符串')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const result = await vppResourceService.updateResourceInstanceStatus(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            logger.error('更新资源实例状态失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 获取资源实时数据
 * GET /api/v1/vpp/resource-instances/:id/realtime-data
 */
router.get('/resource-instances/:id/realtime-data',
    authenticate,
    [
        param('id').isInt().withMessage('实例ID必须是整数')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const result = await vppResourceService.getResourceRealtimeData(req.params.id);
            res.json(result);
        } catch (error) {
            logger.error('获取资源实时数据失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * ==================== VPP管理接口 ====================
 */

/**
 * 获取VPP列表
 * GET /api/v1/vpp/vpps
 */
router.get('/vpps',
    authenticate,
    [
        query('market_type').optional().isIn(['day_ahead', 'intraday', 'balancing', 'ancillary']).withMessage('市场类型无效'),
        query('status').optional().isIn(['active', 'inactive', 'maintenance', 'suspended']).withMessage('状态值无效'),
        query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
        query('size').optional().isInt({ min: 1, max: 100 }).withMessage('页大小必须在1-100之间')
    ],
    validateRequest,
    async (req, res) => {
        try {
            // 这里调用现有的VPP服务或创建新的VPP管理服务
            // 暂时返回示例数据结构
            res.json({
                success: true,
                data: {
                    vpps: [],
                    pagination: {
                        page: parseInt(req.query.page) || 1,
                        size: parseInt(req.query.size) || 20,
                        total: 0,
                        pages: 0
                    }
                }
            });
        } catch (error) {
            logger.error('获取VPP列表失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 创建VPP
 * POST /api/v1/vpp/vpps
 */
router.post('/vpps',
    authenticate,
    requireRole(['admin', 'operator']),
    [
        body('name').notEmpty().isLength({ max: 100 }).withMessage('VPP名称不能为空且长度不超过100字符'),
        body('description').optional().isString().withMessage('描述必须是字符串'),
        body('market_type').isIn(['day_ahead', 'intraday', 'balancing', 'ancillary']).withMessage('市场类型无效'),
        body('resource_ids').isArray().withMessage('资源ID列表必须是数组'),
        body('resource_ids.*').isInt().withMessage('资源ID必须是整数')
    ],
    validateRequest,
    async (req, res) => {
        try {
            // 这里实现VPP创建逻辑
            res.status(201).json({
                success: true,
                data: {
                    id: Date.now(), // 临时ID
                    message: 'VPP创建成功'
                }
            });
        } catch (error) {
            logger.error('创建VPP失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 更新VPP资源配置
 * PUT /api/v1/vpp/vpps/:id/resources
 */
router.put('/vpps/:id/resources',
    authenticate,
    requireRole(['admin', 'operator']),
    [
        param('id').isInt().withMessage('VPP ID必须是整数'),
        body('add_resources').optional().isArray().withMessage('添加资源列表必须是数组'),
        body('add_resources.*.resource_id').optional().isInt().withMessage('资源ID必须是整数'),
        body('add_resources.*.allocation_ratio').optional().isFloat({ min: 0, max: 100 }).withMessage('分配比例必须在0-100之间'),
        body('add_resources.*.priority').optional().isInt({ min: 1, max: 10 }).withMessage('优先级必须在1-10之间'),
        body('remove_resources').optional().isArray().withMessage('移除资源列表必须是数组'),
        body('remove_resources.*').optional().isInt().withMessage('资源ID必须是整数'),
        body('update_resources').optional().isArray().withMessage('更新资源列表必须是数组')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const result = await vppResourceService.updateVPPResources(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            logger.error('更新VPP资源配置失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 获取VPP聚合参数
 * GET /api/v1/vpp/vpps/:id/aggregated-params
 */
router.get('/vpps/:id/aggregated-params',
    authenticate,
    [
        param('id').isInt().withMessage('VPP ID必须是整数')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const result = await vppResourceService.getVPPAggregatedParams(req.params.id);
            res.json(result);
        } catch (error) {
            logger.error('获取VPP聚合参数失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * ==================== 统计和监控接口 ====================
 */

/**
 * 获取资源模板统计
 * GET /api/v1/vpp/statistics/templates
 */
router.get('/statistics/templates',
    authenticate,
    async (req, res) => {
        try {
            // 实现模板统计逻辑
            res.json({
                success: true,
                data: {
                    total_templates: 0,
                    by_category: {},
                    by_type: {},
                    active_templates: 0
                }
            });
        } catch (error) {
            logger.error('获取资源模板统计失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 获取资源实例状态统计
 * GET /api/v1/vpp/statistics/instances
 */
router.get('/statistics/instances',
    authenticate,
    async (req, res) => {
        try {
            // 实现实例统计逻辑
            res.json({
                success: true,
                data: {
                    total_instances: 0,
                    online_instances: 0,
                    offline_instances: 0,
                    error_instances: 0,
                    total_capacity: 0,
                    available_capacity: 0
                }
            });
        } catch (error) {
            logger.error('获取资源实例统计失败:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * 健康检查接口
 * GET /api/v1/vpp/health
 */
router.get('/health', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                service: 'VPP Resource Management',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Service unhealthy'
        });
    }
});

export default router;