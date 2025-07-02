const tf = require('@tensorflow/tfjs-node');
const { EnergyData } = require('../models');
const logger = require('../utils/logger');

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
            units: 32,
            activation: 'relu',
            kernelInitializer: 'heNormal'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1 })
        ]
      });

      // 编译模型
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mse']
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
  async fetchTrainingData(limit = 10000) {
    try {
      // 获取最近的能源数据
      const energyData = await EnergyData.findAll({
        order: [['timestamp', 'DESC']],
        limit: limit
      });

      if (energyData.length < 100) {
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
    for (let i = 1; i < sortedData.length; i++) {
      const current = sortedData[i];
      const previous = sortedData[i - 1];
      const date = new Date(current.timestamp);

      // 提取时间特征
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      // 添加特征
      features.push([
        hour / 23, // 归一化到0-1
        dayOfWeek / 6, // 归一化到0-1
        (current.temperature || 20) / 40, // 假设温度范围0-40
        (current.humidity || 50) / 100, // 湿度0-100
        previous.energyUsage / 1000 // 前一小时能耗，假设最大值1000
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
  async trainModel(epochs = 50, batchSize = 32) {
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
        epochs: epochs,
        batchSize: batchSize,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.info(`Epoch ${epoch + 1}/${epochs} - loss: ${logs.loss.toFixed(4)} - val_loss: ${logs.val_loss.toFixed(4)}`);
          }
        }
      });

      // 释放张量内存
      xs.dispose();
      ys.dispose();

      const finalLoss = history.history.loss[history.history.loss.length - 1];
      const finalValLoss = history.history.val_loss[history.history.val_loss.length - 1];

      logger.info(`模型训练完成 - 最终损失: ${finalLoss.toFixed(4)} - 最终验证损失: ${finalValLoss.toFixed(4)}`);

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
        inputData.hour / 23,
        inputData.dayOfWeek / 6,
        (inputData.temperature || 20) / 40,
        (inputData.humidity || 50) / 100,
        (inputData.previousEnergyUsage || 0) / 1000
      ];

      // 转换为张量并进行预测
      const inputTensor = tf.tensor2d([inputFeatures]);
      const prediction = this.model.predict(inputTensor);
      const result = await prediction.data();

      // 释放张量内存
      inputTensor.dispose();
      prediction.dispose();

      // 返回预测结果
      return result[0];
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

      // 获取最近的能耗数据作为初始值
      const latestEnergyData = await EnergyData.findOne({
        order: [['timestamp', 'DESC']]
      });

      let previousEnergyUsage = latestEnergyData ? latestEnergyData.energyUsage : 0;

      // 预测未来24小时
      for (let i = 0; i < 24; i++) {
        const hour = (currentHour + i) % 24;

        // 使用基础数据或默认值
        const prediction = await this.predictEnergyUsage({
          hour: hour,
          dayOfWeek: dayOfWeek,
          temperature: baseData.temperature || 20,
          humidity: baseData.humidity || 50,
          previousEnergyUsage: previousEnergyUsage
        });

        // 将当前预测作为下一个预测的前一小时能耗
        previousEnergyUsage = prediction;

        predictions.push({
          hour: hour,
          predictedEnergyUsage: prediction,
          timestamp: new Date(now.getTime() + i * 60 * 60 * 1000)
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
  energyPredictionService.trainModel().catch(err => {
    logger.error('服务启动时模型训练失败:', err);
  });
}

module.exports = energyPredictionService;