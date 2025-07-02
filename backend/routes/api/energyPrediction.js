const express = require('express');
const router = express.Router();
const energyPredictionService = require('../../services/energyPredictionService');
const { authenticate } = require('../../middleware/auth');
const logger = require('../../utils/logger');
const { check, validationResult } = require('express-validator');

/**
 * @route   POST /api/energy/predict
 * @desc    预测特定时间的能源消耗
 * @access  Private
 */
router.post('/predict', [
  authenticate,
  [
    check('hour', '小时必须是0-23之间的数字').isInt({ min: 0, max: 23 }),
    check('dayOfWeek', '星期必须是0-6之间的数字').isInt({ min: 0, max: 6 }),
    check('temperature', '温度必须是有效的数字').optional().isFloat(),
    check('humidity', '湿度必须是0-100之间的数字').optional().isFloat({ min: 0, max: 100 }),
    check('previousEnergyUsage', '前一小时能耗必须是正数').optional().isFloat({ min: 0 })
  ]
], async (req, res) => {
  try {
    // 验证请求参数
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 调用预测服务
    const prediction = await energyPredictionService.predictEnergyUsage(req.body);

    if (prediction === null) {
      return res.status(500).json({
        message: '能源消耗预测失败，请稍后重试'
      });
    }

    // 返回预测结果
    res.json({
      success: true,
      predictedEnergyUsage: parseFloat(prediction.toFixed(2)),
      unit: 'kWh'
    });
  } catch (error) {
    logger.error('能源预测API错误:', error);
    res.status(500).json({
      message: '服务器错误，无法完成预测'
    });
  }
});

/**
 * @route   GET /api/energy/predict/24hours
 * @desc    预测未来24小时的能源消耗
 * @access  Private
 */
router.get('/predict/24hours', authenticate, async (req, res) => {
  try {
    // 获取查询参数中的温度和湿度（可选）
    const { temperature, humidity } = req.query;
    const baseData = {};

    if (temperature) baseData.temperature = parseFloat(temperature);
    if (humidity) baseData.humidity = parseFloat(humidity);

    // 调用预测服务
    const predictions = await energyPredictionService.predict24Hours(baseData);

    if (predictions.length === 0) {
      return res.status(500).json({
        message: '24小时能源预测失败，请稍后重试'
      });
    }

    // 格式化预测结果
    const formattedPredictions = predictions.map(pred => ({
      hour: pred.hour,
      predictedEnergyUsage: parseFloat(pred.predictedEnergyUsage.toFixed(2)),
      timestamp: pred.timestamp,
      unit: 'kWh'
    }));

    // 返回预测结果
    res.json({
      success: true,
      predictions: formattedPredictions,
      generatedAt: new Date()
    });
  } catch (error) {
    logger.error('24小时能源预测API错误:', error);
    res.status(500).json({
      message: '服务器错误，无法完成24小时预测'
    });
  }
});

/**
 * @route   GET /api/energy/predict/model/status
 * @desc    获取预测模型状态
 * @access  Private
 */
router.get('/predict/model/status', authenticate, async (req, res) => {
  try {
    // 返回模型状态信息
    res.json({
      success: true,
      isModelTrained: energyPredictionService.isModelTrained,
      lastTrained: new Date().toISOString(), // 在实际应用中应该存储和返回真实的最后训练时间
      features: energyPredictionService.features
    });
  } catch (error) {
    logger.error('模型状态API错误:', error);
    res.status(500).json({
      message: '服务器错误，无法获取模型状态'
    });
  }
});

/**
 * @route   POST /api/energy/predict/model/retrain
 * @desc    重新训练预测模型
 * @access  Private (Admin only)
 */
router.post('/predict/model/retrain', [
  authenticate,
  // 在实际应用中应该添加管理员权限检查
  [
    check('epochs', '训练轮次必须是正整数').optional().isInt({ min: 1 }),
    check('batchSize', '批次大小必须是正整数').optional().isInt({ min: 1 })
  ]
], async (req, res) => {
  try {
    // 验证请求参数
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 异步执行模型训练，不阻塞响应
    const { epochs, batchSize } = req.body;
    energyPredictionService.trainModel(epochs, batchSize)
      .then(() => {
        logger.info('模型重新训练成功');
      })
      .catch(err => {
        logger.error('模型重新训练失败:', err);
      });

    // 立即返回响应，告知训练已开始
    res.json({
      success: true,
      message: '模型重新训练已开始，请稍后查看结果'
    });
  } catch (error) {
    logger.error('模型重新训练API错误:', error);
    res.status(500).json({
      message: '服务器错误，无法启动模型训练'
    });
  }
});

module.exports = router;