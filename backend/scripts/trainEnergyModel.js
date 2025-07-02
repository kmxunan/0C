const energyPredictionService = require('../services/energyPredictionService');
const logger = require('../utils/logger');
const { program } = require('commander');

/**
 * 能源预测模型训练脚本
 * 用于手动触发或定时执行模型训练
 */
async function trainModel() {
  try {
    // 解析命令行参数
    program
      .option('-e, --epochs <number>', '训练轮次', parseInt, 50)
      .option('-b, --batch-size <number>', '批次大小', parseInt, 32)
      .option('-l, --log-level <level>', '日志级别', 'info')
      .parse(process.argv);

    const options = program.opts();

    // 设置日志级别
    logger.level = options.logLevel;

    logger.info(`开始训练能源预测模型 - 轮次: ${options.epochs}, 批次大小: ${options.batchSize}`);

    // 训练模型
    const startTime = Date.now();
    const trainingSuccess = await energyPredictionService.trainModel(options.epochs, options.batchSize);
    const endTime = Date.now();

    if (trainingSuccess) {
      logger.info(`模型训练成功，耗时: ${Math.round((endTime - startTime) / 1000)}秒`);
      process.exit(0);
    } else {
      logger.error('模型训练失败');
      process.exit(1);
    }
  } catch (error) {
    logger.error('模型训练脚本执行失败:', error);
    process.exit(1);
  }
}

// 执行训练
if (require.main === module) {
  trainModel();
}

module.exports = trainModel;