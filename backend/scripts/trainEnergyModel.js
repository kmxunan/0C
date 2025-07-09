const energyPredictionService = require('../services/energyPredictionService');
const logger = require('../utils/logger');
const { program } = require('commander');
const { MATH_CONSTANTS } = require('../../src/shared/constants/MathConstants.js');

/**
 * 能源预测模型训练脚本
 * 用于手动触发或定时执行模型训练
 */
async function trainModel() {
  try {
    // 解析命令行参数
    const defaultEpochs = 50;
    const defaultBatchSize = 32;
    
    program
      .option('-e, --epochs <number>', '训练轮次', parseInt, defaultEpochs)
      .option('-b, --batch-size <number>', '批次大小', parseInt, defaultBatchSize)
      .option('-l, --log-level <level>', '日志级别', 'info')
      .parse(process.argv);

    const options = program.opts();

    // 设置日志级别
    logger.level = options.logLevel;

    logger.info(`开始训练能源预测模型 - 轮次: ${options.epochs}, 批次大小: ${options.batchSize}`);

    // 训练模型
    const startTime = Date.now();
    const trainingSuccess = await energyPredictionService.trainModel(
      options.epochs,
      options.batchSize
    );
    const endTime = Date.now();

    const millisecondsToSeconds = 1000;
    
    if (trainingSuccess) {
      logger.info(`模型训练成功，耗时: ${Math.round((endTime - startTime) / millisecondsToSeconds)}秒`);
      process.exit(MATH_CONSTANTS.ZERO);
    } else {
      logger.error('模型训练失败');
      process.exit(MATH_CONSTANTS.ONE);
    }
  } catch (error) {
    logger.error('模型训练脚本执行失败:', error);
    process.exit(MATH_CONSTANTS.ONE);
  }
}

// 执行训练
if (require.main === module) {
  trainModel();
}

module.exports = trainModel;
