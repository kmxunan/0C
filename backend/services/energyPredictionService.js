import tf from '@tensorflow/tfjs-node';
// import { EnergyData } from '../models/index.js'; // 暂时注释掉，使用数据库直接查询
import logger from '../../src/shared/utils/logger.js';
import { 
  ALGORITHM_CONSTANTS, 
  DATA_PROCESSING_CONSTANTS, 
  TIME_INTERVALS,
  MATH_CONSTANTS 
} from '../../src/shared/constants/MathConstants.js';

class EnergyPredictionService {
  constructor() {
    this.model = null;
    this.isModelTrained = false;
    this.features = ['hour', 'dayOfWeek', 'temperature', 'humidity', 'previousEnergyUsage'];
    this.target = 'energyUsage';
    this.initializeModel();
  }

  /**
   * 初始化预测模型
   */
  async initializeModel() {
    try {
      // 创建一个简单的神经网络模型
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [this.features.length],
            units: ALGORITHM_CONSTANTS.BATCH_SIZE,
            activation: 'relu',
            kernelInitializer: 'heNormal',
          }),
          tf.layers.dropout({ rate: ALGORITHM_CONSTANTS.VALIDATION_SPLIT }),
          tf.layers.dense({ units: MATH_CONSTANTS.SIXTEEN, activation: 'relu' }),
          tf.layers.dense({ units: MATH_CONSTANTS.EIGHT, activation: 'relu' }),
          tf.layers.dense({ units: MATH_CONSTANTS.ONE }),
        ],
      });

      // 编译模型
      this.model.compile({
        optimizer: tf.train.adam(ALGORITHM_CONSTANTS.LEARNING_RATE),
        loss: 'meanSquaredError',
        metrics: ['mse'],
      });

      logger.info('能源预测模型初始化成功');

      // 尝试加载已保存的模型
      await this.loadModel();
    } catch (error) {
      logger.error('能源预测模型初始化失败:', error);
    }
  }

  /**
   * 从数据库获取训练数据
   * @param {number} limit - 获取数据条数
   * @returns {Promise<{features: number[][], labels: number[]}>} - 特征和标签数据
   */
  async fetchTrainingData(limit = DATA_PROCESSING_CONSTANTS.BATCH_SIZE_EXTRA_LARGE) {
    try {
      // 暂时返回模拟数据，避免数据库查询错误
      logger.warn('使用模拟数据进行训练，实际应用中需要连接真实数据库');

      // 生成模拟的能源数据
      const energyData = [];
      const now = new Date();

      for (let i = 0; i < Math.min(limit, DATA_PROCESSING_CONSTANTS.BATCH_SIZE_LARGE); i++) {
        const timestamp = new Date(now.getTime() - i * TIME_INTERVALS.ONE_HOUR_MS); // 每小时一条数据
        energyData.push({
          timestamp: timestamp.toISOString(),
          energyUsage: MATH_CONSTANTS.FIVE_HUNDRED + Math.random() * MATH_CONSTANTS.FIVE_HUNDRED, // 500-1000 kWh
          temperature: MATH_CONSTANTS.TWENTY + Math.random() * MATH_CONSTANTS.TWENTY, // 20-40°C
          humidity: MATH_CONSTANTS.FORTY + Math.random() * MATH_CONSTANTS.FORTY, // 40-80%
        });
      }

      if (energyData.length < MATH_CONSTANTS.ONE_HUNDRED) {
        logger.warn('训练数据不足，需要至少100条记录');
        return null;
      }

      // 数据预处理
      const processedData = this.preprocessData(energyData);
      return processedData;
    } catch (error) {
      logger.error('获取训练数据失败:', error);
      return null;
    }
  }

  /**
   * 数据预处理
   * @param {Array} data - 原始数据
   * @returns {Object} - 处理后的特征和标签
   */
  preprocessData(data) {
    // 按时间戳排序
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const features = [];
    const labels = [];

    // 提取特征和标签

    // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

    for (let i = 1; i < sortedData.length; i++) {
      const current = sortedData[i];
      const previous = sortedData[i - 1];
      const date = new Date(current.timestamp);

      // 提取时间特征
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      // 添加特征
      features.push([
        hour / MATH_CONSTANTS.TWENTY_THREE, // 归一化到0-1
        dayOfWeek / MATH_CONSTANTS.SIX, // 归一化到0-1
        (current.temperature || MATH_CONSTANTS.TWENTY) / MATH_CONSTANTS.FORTY, // 假设温度范围0-40
        (current.humidity || MATH_CONSTANTS.FIFTY) / MATH_CONSTANTS.ONE_HUNDRED, // 湿度0-100
        previous.energyUsage / MATH_CONSTANTS.ONE_THOUSAND, // 前一小时能耗，假设最大值1000
      ]);

      // 添加标签
      labels.push([current.energyUsage]);
    }

    return { features, labels };
  }

  /**
   * 训练模型
   * @param {number} epochs - 训练轮次
   * @param {number} batchSize - 批次大小
   * @returns {Promise<boolean>} - 训练是否成功
   */
  async trainModel(epochs = MATH_CONSTANTS.FIFTY, batchSize = ALGORITHM_CONSTANTS.BATCH_SIZE) {
    try {
      logger.info('开始训练能源预测模型...');

      // 获取训练数据
      const trainingData = await this.fetchTrainingData();
      if (!trainingData) {
        return false;
      }

      // 转换为张量
      const xs = tf.tensor2d(trainingData.features);
      const ys = tf.tensor2d(trainingData.labels);

      // 训练模型
      const history = await this.model.fit(xs, ys, {
        epochs,
        batchSize,
        validationSplit: ALGORITHM_CONSTANTS.VALIDATION_SPLIT,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.info(
              `Epoch ${epoch + MATH_CONSTANTS.ONE}/${epochs} - loss: ${logs.loss.toFixed(MATH_CONSTANTS.FOUR)} - val_loss: ${logs.val_loss.toFixed(MATH_CONSTANTS.FOUR)}`
            );
          },
        },
      });

      // 释放张量内存
      xs.dispose();
      ys.dispose();

      const finalLoss = history.history.loss[history.history.loss.length - MATH_CONSTANTS.ONE];
      const finalValLoss = history.history.val_loss[history.history.val_loss.length - MATH_CONSTANTS.ONE];

      logger.info(
          `模型训练完成 - 最终损失: ${finalLoss.toFixed(MATH_CONSTANTS.FOUR)} - 最终验证损失: ${finalValLoss.toFixed(MATH_CONSTANTS.FOUR)}`
        );

      this.isModelTrained = true;

      // 保存模型
      await this.saveModel();

      return true;
    } catch (error) {
      logger.error('模型训练失败:', error);
      return false;
    }
  }

  /**
   * 保存模型到文件系统
   * @returns {Promise<void>}
   */
  async saveModel() {
    try {
      await this.model.save('file://./models/energy-prediction-model');
      logger.info('模型保存成功');
    } catch (error) {
      logger.error('模型保存失败:', error);
    }
  }

  /**
   * 从文件系统加载模型
   * @returns {Promise<boolean>}
   */
  async loadModel() {
    try {
      this.model = await tf.loadLayersModel('file://./models/energy-prediction-model/model.json');
      this.isModelTrained = true;
      logger.info('模型加载成功');
      return true;
    } catch (error) {
      logger.warn('模型加载失败，将使用新模型:', error.message);
      return false;
    }
  }

  /**
   * 预测能源消耗
   * @param {Object} inputData - 输入特征数据
   * @returns {Promise<number>} - 预测的能源消耗量
   */
  async predictEnergyUsage(inputData) {
    try {
      if (!this.isModelTrained) {
        logger.warn('模型尚未训练，正在进行首次训练...');
        const trainingSuccess = await this.trainModel();
        if (!trainingSuccess) {
          logger.error('模型训练失败，无法进行预测');
          return null;
        }
      }

      // 准备输入特征
      const inputFeatures = [
        inputData.hour / MATH_CONSTANTS.TWENTY_THREE,
        inputData.dayOfWeek / MATH_CONSTANTS.SIX,
        (inputData.temperature || MATH_CONSTANTS.TWENTY) / MATH_CONSTANTS.FORTY,
        (inputData.humidity || MATH_CONSTANTS.FIFTY) / MATH_CONSTANTS.ONE_HUNDRED,
        (inputData.previousEnergyUsage || MATH_CONSTANTS.ZERO) / MATH_CONSTANTS.ONE_THOUSAND,
      ];

      // 转换为张量并进行预测
      const inputTensor = tf.tensor2d([inputFeatures]);
      const prediction = this.model.predict(inputTensor);
      const result = await prediction.data();

      // 释放张量内存
      inputTensor.dispose();
      prediction.dispose();

      // 返回预测结果
      return result[MATH_CONSTANTS.ZERO];
    } catch (error) {
      logger.error('能源消耗预测失败:', error);
      return null;
    }
  }

  /**
   * 批量预测未来24小时能源消耗
   * @param {Object} baseData - 基础数据（包含温度、湿度等）
   * @returns {Promise<Array>} - 未来24小时的预测结果
   */
  async predict24Hours(baseData) {
    try {
      const predictions = [];
      const now = new Date();
      const currentHour = now.getHours();
      const dayOfWeek = now.getDay();

      // 获取最近的能耗数据作为初始值（暂时使用模拟数据）
      // const latestEnergyData = await EnergyData.findOne({
      //   order: [['timestamp', 'DESC']],
      // });
      const latestEnergyData = null; // 暂时设为null，使用默认值

      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

      let previousEnergyUsage = latestEnergyData ? latestEnergyData.energyUsage : MATH_CONSTANTS.ZERO;

      // 预测未来24小时
      for (let i = 0; i < MATH_CONSTANTS.TWENTY_FOUR; i++) {
        const hour = (currentHour + i) % MATH_CONSTANTS.TWENTY_FOUR;

        // 使用基础数据或默认值
        const prediction = await this.predictEnergyUsage({
          hour,
          dayOfWeek,
          temperature: baseData.temperature || MATH_CONSTANTS.TWENTY,
          humidity: baseData.humidity || MATH_CONSTANTS.FIFTY,
          previousEnergyUsage,
        });

        // 将当前预测作为下一个预测的前一小时能耗
        previousEnergyUsage = prediction;

        predictions.push({
          hour,
          predictedEnergyUsage: prediction,
          timestamp: new Date(now.getTime() + i * TIME_INTERVALS.ONE_HOUR_MS),
        });
      }

      return predictions;
    } catch (error) {
      logger.error('24小时能源预测失败:', error);
      return [];
    }
  }
}

// 创建单例实例
const energyPredictionService = new EnergyPredictionService();

// 当服务启动时训练模型（如果尚未训练）
if (!energyPredictionService.isModelTrained) {
  energyPredictionService.trainModel().catch((err) => {
    logger.error('服务启动时模型训练失败:', err);
  });
}

export default energyPredictionService;
