const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const DigitalTwinModel = require('../../../core/entities/DigitalTwinModel');
const Device = require('../../../core/entities/Device');
const authMiddleware = require('../middleware/auth');
const responseFormatter = require('../middleware/responseFormatter');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();
/* eslint-disable no-console, no-magic-numbers */

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 常量定义
const DIGITAL_TWIN_CONSTANTS = {
  MAX_MODELS_PER_PAGE: 50,
  DEFAULT_PAGE_SIZE: 20,
  MODEL_TYPES: ['building', 'equipment', 'system', 'zone', 'component'],
  MODEL_STATUS: ['active', 'inactive', 'maintenance', 'error'],
  SIMULATION_TYPES: ['energy', 'thermal', 'airflow', 'lighting', 'structural'],
  VIEW_PRESETS: ['overview', 'energy_view', 'maintenance_view', 'security_view', 'custom'],
  SUPPORTED_FORMATS: ['gltf', 'fbx', 'obj', 'ifc'],
  MAX_FILE_SIZE: 100 * 1024 * 1024 // 100MB
};

// 验证规则
const digitalTwinValidation = [
  body('name').notEmpty().withMessage('模型名称不能为空'),
  body('type').isIn(DIGITAL_TWIN_CONSTANTS.MODEL_TYPES).withMessage('模型类型无效'),
  body('description').optional().isString().withMessage('描述必须是字符串'),
  body('modelPath').notEmpty().withMessage('模型路径不能为空'),
  body('position').optional().isObject().withMessage('位置信息必须是对象'),
  body('rotation').optional().isObject().withMessage('旋转信息必须是对象'),
  body('scale').optional().isObject().withMessage('缩放信息必须是对象'),
  body('metadata').optional().isObject().withMessage('元数据必须是对象')
];

const simulationValidation = [
  body('modelId').isMongoId().withMessage('模型ID格式无效'),
  body('simulationType').isIn(DIGITAL_TWIN_CONSTANTS.SIMULATION_TYPES).withMessage('仿真类型无效'),
  body('parameters').isObject().withMessage('参数必须是对象'),
  body('duration').optional().isNumeric().withMessage('持续时间必须是数字'),
  body('timeStep').optional().isNumeric().withMessage('时间步长必须是数字')
];

const viewPresetValidation = [
  body('name').notEmpty().withMessage('视图名称不能为空'),
  body('type').isIn(DIGITAL_TWIN_CONSTANTS.VIEW_PRESETS).withMessage('视图类型无效'),
  body('cameraPosition').isObject().withMessage('相机位置必须是对象'),
  body('cameraTarget').isObject().withMessage('相机目标必须是对象'),
  body('visibleLayers').optional().isArray().withMessage('可见图层必须是数组'),
  body('settings').optional().isObject().withMessage('设置必须是对象')
];

// 获取数字孪生模型列表
router.get(
  '/models',
  [
    query('type').optional().isIn(DIGITAL_TWIN_CONSTANTS.MODEL_TYPES).withMessage('模型类型无效'),
    query('status')
      .optional()
      .isIn(DIGITAL_TWIN_CONSTANTS.MODEL_STATUS)
      .withMessage('模型状态无效'),
    query('search').optional().isString().withMessage('搜索关键词必须是字符串')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const {
        page = 1,
        limit = DIGITAL_TWIN_CONSTANTS.DEFAULT_PAGE_SIZE,
        type,
        status,
        search
      } = req.query;

      const filters = {};
      if (type) {filters.type = type;}
      if (status) {filters.status = status;}
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const offset = (page - 1) * limit;
      const models = await DigitalTwinModel.findWithPagination(filters, offset, parseInt(limit));
      const total = await DigitalTwinModel.countDocuments(filters);

      responseFormatter.success(res, '获取数字孪生模型列表成功', {
        models,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('获取数字孪生模型列表错误:', error);
      responseFormatter.error(res, '获取数字孪生模型列表失败', 500);
    }
  }
);

// 获取单个数字孪生模型详情
router.get(
  '/models/:id',
  [param('id').isMongoId().withMessage('模型ID格式无效')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const model = await DigitalTwinModel.findByIdWithDetails(req.params.id);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      responseFormatter.success(res, '获取数字孪生模型详情成功', { model });
    } catch (error) {
      console.error('获取数字孪生模型详情错误:', error);
      responseFormatter.error(res, '获取数字孪生模型详情失败', 500);
    }
  }
);

// 创建数字孪生模型
router.post(
  '/models',
  requireRole(['admin', 'operator']),
  digitalTwinValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const modelData = {
        ...req.body,
        status: 'active',
        createdBy: req.user.userId,
        createdAt: new Date(),
        version: '1.0.0'
      };

      // 检查模型名称是否已存在
      const existingModel = await DigitalTwinModel.findByName(modelData.name);
      if (existingModel) {
        return responseFormatter.error(res, '模型名称已存在', 409);
      }

      const newModel = await DigitalTwinModel.create(modelData);

      responseFormatter.success(res, '数字孪生模型创建成功', { model: newModel }, 201);
    } catch (error) {
      console.error('创建数字孪生模型错误:', error);
      responseFormatter.error(res, '创建数字孪生模型失败', 500);
    }
  }
);

// 更新数字孪生模型
router.put(
  '/models/:id',
  requireRole(['admin', 'operator']),
  [
    param('id').isMongoId().withMessage('模型ID格式无效'),
    ...digitalTwinValidation.map((rule) => rule.optional())
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const model = await DigitalTwinModel.findById(req.params.id);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      // 如果更新模型名称，检查是否重复
      if (req.body.name && req.body.name !== model.name) {
        const existingModel = await DigitalTwinModel.findByName(req.body.name);
        if (existingModel) {
          return responseFormatter.error(res, '模型名称已存在', 409);
        }
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.userId,
        updatedAt: new Date()
      };

      const updatedModel = await model.update(updateData);

      responseFormatter.success(res, '数字孪生模型更新成功', { model: updatedModel });
    } catch (error) {
      console.error('更新数字孪生模型错误:', error);
      responseFormatter.error(res, '更新数字孪生模型失败', 500);
    }
  }
);

// 删除数字孪生模型
router.delete(
  '/models/:id',
  requireRole(['admin']),
  [param('id').isMongoId().withMessage('模型ID格式无效')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const model = await DigitalTwinModel.findById(req.params.id);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      // 检查模型是否有关联的设备或仿真
      const hasAssociations = await model.hasAssociations();
      if (hasAssociations) {
        return responseFormatter.error(res, '模型存在关联数据，无法删除', 409);
      }

      await model.delete();

      responseFormatter.success(res, '数字孪生模型删除成功');
    } catch (error) {
      console.error('删除数字孪生模型错误:', error);
      responseFormatter.error(res, '删除数字孪生模型失败', 500);
    }
  }
);

// 获取模型关联的设备
router.get(
  '/models/:id/devices',
  [param('id').isMongoId().withMessage('模型ID格式无效')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const model = await DigitalTwinModel.findById(req.params.id);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      const devices = await model.getAssociatedDevices();

      responseFormatter.success(res, '获取关联设备成功', { devices });
    } catch (error) {
      console.error('获取关联设备错误:', error);
      responseFormatter.error(res, '获取关联设备失败', 500);
    }
  }
);

// 关联设备到模型
router.post(
  '/models/:id/devices',
  requireRole(['admin', 'operator']),
  [
    param('id').isMongoId().withMessage('模型ID格式无效'),
    body('deviceIds').isArray().withMessage('设备ID列表必须是数组'),
    body('deviceIds.*').isMongoId().withMessage('设备ID格式无效')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const model = await DigitalTwinModel.findById(req.params.id);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      const { deviceIds } = req.body;

      // 验证所有设备是否存在
      const devices = await Device.findByIds(deviceIds);
      if (devices.length !== deviceIds.length) {
        return responseFormatter.error(res, '部分设备不存在', 404);
      }

      await model.associateDevices(deviceIds, req.user.userId);

      responseFormatter.success(res, '设备关联成功');
    } catch (error) {
      console.error('关联设备错误:', error);
      responseFormatter.error(res, '关联设备失败', 500);
    }
  }
);

// 运行仿真
router.post(
  '/simulations',
  requireRole(['admin', 'operator']),
  simulationValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const { modelId, simulationType, parameters, duration = 3600, timeStep = 60 } = req.body;

      // 验证模型是否存在
      const model = await DigitalTwinModel.findById(modelId);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      if (model.status !== 'active') {
        return responseFormatter.error(res, '模型状态不允许运行仿真', 400);
      }

      const simulationData = {
        modelId,
        simulationType,
        parameters,
        duration,
        timeStep,
        status: 'running',
        startedBy: req.user.userId,
        startedAt: new Date()
      };

      const simulation = await model.runSimulation(simulationData);

      responseFormatter.success(res, '仿真启动成功', { simulation }, 201);
    } catch (error) {
      console.error('运行仿真错误:', error);
      responseFormatter.error(res, '运行仿真失败', 500);
    }
  }
);

// 获取仿真结果
router.get(
  '/simulations/:id/results',
  [param('id').isMongoId().withMessage('仿真ID格式无效')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const simulation = await DigitalTwinModel.getSimulationResults(req.params.id);
      if (!simulation) {
        return responseFormatter.error(res, '仿真不存在', 404);
      }

      responseFormatter.success(res, '获取仿真结果成功', { simulation });
    } catch (error) {
      console.error('获取仿真结果错误:', error);
      responseFormatter.error(res, '获取仿真结果失败', 500);
    }
  }
);

// 获取视图预设列表
router.get(
  '/view-presets',
  [query('type').optional().isIn(DIGITAL_TWIN_CONSTANTS.VIEW_PRESETS).withMessage('视图类型无效')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const { type } = req.query;
      const filters = {};
      if (type) {filters.type = type;}

      const presets = await DigitalTwinModel.getViewPresets(filters);

      responseFormatter.success(res, '获取视图预设成功', { presets });
    } catch (error) {
      console.error('获取视图预设错误:', error);
      responseFormatter.error(res, '获取视图预设失败', 500);
    }
  }
);

// 创建视图预设
router.post(
  '/view-presets',
  requireRole(['admin', 'operator']),
  viewPresetValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const presetData = {
        ...req.body,
        createdBy: req.user.userId,
        createdAt: new Date()
      };

      const newPreset = await DigitalTwinModel.createViewPreset(presetData);

      responseFormatter.success(res, '视图预设创建成功', { preset: newPreset }, 201);
    } catch (error) {
      console.error('创建视图预设错误:', error);
      responseFormatter.error(res, '创建视图预设失败', 500);
    }
  }
);

// 获取模型性能统计
router.get(
  '/models/:id/performance',
  [param('id').isMongoId().withMessage('模型ID格式无效')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const model = await DigitalTwinModel.findById(req.params.id);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      const performance = await model.getPerformanceMetrics();

      responseFormatter.success(res, '获取模型性能统计成功', { performance });
    } catch (error) {
      console.error('获取模型性能统计错误:', error);
      responseFormatter.error(res, '获取模型性能统计失败', 500);
    }
  }
);

// 优化模型
router.post(
  '/models/:id/optimize',
  requireRole(['admin', 'operator']),
  [
    param('id').isMongoId().withMessage('模型ID格式无效'),
    body('optimizationType')
      .isIn(['lod', 'texture', 'geometry', 'all'])
      .withMessage('优化类型无效'),
    body('targetQuality').optional().isIn(['low', 'medium', 'high']).withMessage('目标质量无效')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const model = await DigitalTwinModel.findById(req.params.id);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      const { optimizationType, targetQuality = 'medium' } = req.body;

      const optimizationResult = await model.optimize({
        type: optimizationType,
        quality: targetQuality,
        optimizedBy: req.user.userId
      });

      responseFormatter.success(res, '模型优化完成', { result: optimizationResult });
    } catch (error) {
      console.error('优化模型错误:', error);
      responseFormatter.error(res, '优化模型失败', 500);
    }
  }
);

// 获取模型统计数据
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await DigitalTwinModel.getStatistics();

    responseFormatter.success(res, '获取模型统计数据成功', { stats });
  } catch (error) {
    console.error('获取模型统计数据错误:', error);
    responseFormatter.error(res, '获取模型统计数据失败', 500);
  }
});

// 导出模型配置
router.get(
  '/models/:id/export',
  [
    param('id').isMongoId().withMessage('模型ID格式无效'),
    query('format').optional().isIn(['json', 'xml']).withMessage('导出格式无效')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responseFormatter.error(res, '输入验证失败', 400, errors.array());
      }

      const model = await DigitalTwinModel.findById(req.params.id);
      if (!model) {
        return responseFormatter.error(res, '数字孪生模型不存在', 404);
      }

      const { format = 'json' } = req.query;
      const exportData = await model.exportConfiguration(format);

      const contentType = format === 'xml' ? 'application/xml' : 'application/json';
      const filename = `model-${model.name}-config.${format}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(exportData);
    } catch (error) {
      console.error('导出模型配置错误:', error);
      responseFormatter.error(res, '导出模型配置失败', 500);
    }
  }
);

module.exports = router;
