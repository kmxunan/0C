/**
 * VPP TensorFlow.js 模型管理器
 * 负责TensorFlow.js模型的加载、预测和管理
 * P1阶段核心功能：AI框架集成
 */

const tf = require('@tensorflow/tfjs-node');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

// 模型类型映射
const MODEL_TYPE_MAPPING = {
  PRICE_PREDICTION: 'price_prediction',
  DEMAND_FORECASTING: 'demand_forecasting',
  OPTIMIZATION: 'optimization',
  RISK_ASSESSMENT: 'risk_assessment',
  ANOMALY_DETECTION: 'anomaly_detection'
};

// 预处理器类型
const PREPROCESSOR_TYPES = {
  NORMALIZATION: 'normalization',
  STANDARDIZATION: 'standardization',
  MIN_MAX_SCALING: 'min_max_scaling',
  FEATURE_ENGINEERING: 'feature_engineering'
};

class VPPTensorFlowModelManager {
  constructor() {
    this.loadedModels = new Map();
    this.modelMetadata = new Map();
    this.preprocessors = new Map();
    this.modelPerformance = new Map();
    this.predictionCache = new Map();
    this.cacheTimeout = 300000; // 5分钟缓存
    
    this.initializeManager();
  }

  /**
   * 初始化模型管理器
   */
  async initializeManager() {
    try {
      // 设置TensorFlow.js后端
      await tf.ready();
      logger.info('TensorFlow.js backend initialized:', tf.getBackend());
      
      // 创建模型存储目录
      const modelDir = path.join(process.cwd(), 'models', 'tensorflow');
      await fs.mkdir(modelDir, { recursive: true });
      
      // 加载预训练模型
      await this.loadPretrainedModels();
      
      logger.info('TensorFlow.js模型管理器初始化完成');
    } catch (error) {
      logger.error('TensorFlow.js模型管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载TensorFlow.js模型
   * @param {string} modelId - 模型ID
   * @param {string} modelPath - 模型路径
   * @param {Object} metadata - 模型元数据
   * @returns {Promise<boolean>} 加载结果
   */
  async loadModel(modelId, modelPath, metadata = {}) {
    try {
      // 检查模型是否已加载
      if (this.loadedModels.has(modelId)) {
        logger.info(`模型已加载: ${modelId}`);
        return true;
      }

      let model;
      
      // 根据路径类型加载模型
      if (modelPath.startsWith('http://') || modelPath.startsWith('https://')) {
        // 从URL加载
        model = await tf.loadLayersModel(modelPath);
      } else if (modelPath.endsWith('.json')) {
        // 从本地JSON文件加载
        model = await tf.loadLayersModel(`file://${modelPath}`);
      } else {
        // 从SavedModel格式加载
        model = await tf.loadGraphModel(`file://${modelPath}`);
      }

      // 验证模型
      if (!model) {
        throw new Error('模型加载失败');
      }

      // 存储模型和元数据
      this.loadedModels.set(modelId, model);
      this.modelMetadata.set(modelId, {
        ...metadata,
        loadedAt: new Date(),
        modelPath,
        inputShape: model.inputs ? model.inputs[0].shape : null,
        outputShape: model.outputs ? model.outputs[0].shape : null
      });

      // 初始化性能指标
      this.modelPerformance.set(modelId, {
        totalPredictions: 0,
        averageLatency: 0,
        accuracy: 0,
        lastUsed: new Date()
      });

      logger.info(`TensorFlow.js模型加载成功: ${modelId}`, {
        inputShape: model.inputs ? model.inputs[0].shape : 'unknown',
        outputShape: model.outputs ? model.outputs[0].shape : 'unknown'
      });

      return true;
    } catch (error) {
      logger.error(`TensorFlow.js模型加载失败: ${modelId}`, error);
      return false;
    }
  }

  /**
   * 执行模型预测
   * @param {string} modelId - 模型ID
   * @param {Array|Object} inputData - 输入数据
   * @param {Object} options - 预测选项
   * @returns {Promise<Object>} 预测结果
   */
  async predict(modelId, inputData, options = {}) {
    try {
      const startTime = Date.now();
      
      // 检查缓存
      const cacheKey = this.generateCacheKey(modelId, inputData);
      if (options.useCache !== false && this.predictionCache.has(cacheKey)) {
        const cached = this.predictionCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          logger.debug(`使用缓存预测结果: ${modelId}`);
          return cached.result;
        }
      }

      // 获取模型
      const model = this.loadedModels.get(modelId);
      if (!model) {
        throw new Error(`模型未加载: ${modelId}`);
      }

      // 预处理输入数据
      const preprocessedData = await this.preprocessInput(modelId, inputData);
      
      // 转换为张量
      const inputTensor = this.convertToTensor(preprocessedData, modelId);
      
      // 执行预测
      const prediction = model.predict(inputTensor);
      
      // 处理预测结果
      const result = await this.postprocessOutput(modelId, prediction);
      
      // 清理张量内存
      inputTensor.dispose();
      if (Array.isArray(prediction)) {
        prediction.forEach(tensor => tensor.dispose());
      } else {
        prediction.dispose();
      }

      const latency = Date.now() - startTime;
      
      // 更新性能指标
      this.updatePerformanceMetrics(modelId, latency);
      
      // 缓存结果
      if (options.useCache !== false) {
        this.predictionCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
      }

      logger.debug(`TensorFlow.js预测完成: ${modelId}`, {
        latency: `${latency}ms`,
        inputShape: inputTensor.shape,
        outputShape: Array.isArray(prediction) ? prediction.map(p => p.shape) : prediction.shape
      });

      return {
        modelId,
        prediction: result,
        confidence: this.calculateConfidence(result),
        latency,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error(`TensorFlow.js预测失败: ${modelId}`, error);
      throw new Error(`预测失败: ${error.message}`);
    }
  }

  /**
   * 批量预测
   * @param {string} modelId - 模型ID
   * @param {Array} inputDataArray - 输入数据数组
   * @param {Object} options - 预测选项
   * @returns {Promise<Array>} 预测结果数组
   */
  async batchPredict(modelId, inputDataArray, options = {}) {
    try {
      const startTime = Date.now();
      
      // 获取模型
      const model = this.loadedModels.get(modelId);
      if (!model) {
        throw new Error(`模型未加载: ${modelId}`);
      }

      // 批量预处理
      const preprocessedBatch = await Promise.all(
        inputDataArray.map(data => this.preprocessInput(modelId, data))
      );
      
      // 转换为批量张量
      const batchTensor = this.convertToBatchTensor(preprocessedBatch, modelId);
      
      // 执行批量预测
      const batchPrediction = model.predict(batchTensor);
      
      // 处理批量结果
      const results = await this.postprocessBatchOutput(modelId, batchPrediction);
      
      // 清理内存
      batchTensor.dispose();
      if (Array.isArray(batchPrediction)) {
        batchPrediction.forEach(tensor => tensor.dispose());
      } else {
        batchPrediction.dispose();
      }

      const totalLatency = Date.now() - startTime;
      const avgLatency = totalLatency / inputDataArray.length;
      
      // 更新性能指标
      this.updatePerformanceMetrics(modelId, avgLatency, inputDataArray.length);

      logger.info(`TensorFlow.js批量预测完成: ${modelId}`, {
        batchSize: inputDataArray.length,
        totalLatency: `${totalLatency}ms`,
        avgLatency: `${avgLatency}ms`
      });

      return results.map((result, index) => ({
        modelId,
        prediction: result,
        confidence: this.calculateConfidence(result),
        latency: avgLatency,
        timestamp: new Date(),
        batchIndex: index
      }));

    } catch (error) {
      logger.error(`TensorFlow.js批量预测失败: ${modelId}`, error);
      throw new Error(`批量预测失败: ${error.message}`);
    }
  }

  /**
   * 预处理输入数据
   * @param {string} modelId - 模型ID
   * @param {Array|Object} inputData - 输入数据
   * @returns {Promise<Array>} 预处理后的数据
   */
  async preprocessInput(modelId, inputData) {
    try {
      const metadata = this.modelMetadata.get(modelId);
      if (!metadata || !metadata.preprocessing) {
        return Array.isArray(inputData) ? inputData : [inputData];
      }

      let processedData = Array.isArray(inputData) ? [...inputData] : [inputData];
      
      // 应用预处理步骤
      for (const step of metadata.preprocessing) {
        switch (step.type) {
          case PREPROCESSOR_TYPES.NORMALIZATION:
            processedData = this.normalizeData(processedData, step.params);
            break;
          case PREPROCESSOR_TYPES.STANDARDIZATION:
            processedData = this.standardizeData(processedData, step.params);
            break;
          case PREPROCESSOR_TYPES.MIN_MAX_SCALING:
            processedData = this.minMaxScale(processedData, step.params);
            break;
          case PREPROCESSOR_TYPES.FEATURE_ENGINEERING:
            processedData = this.engineerFeatures(processedData, step.params);
            break;
        }
      }

      return processedData;
    } catch (error) {
      logger.error(`输入预处理失败: ${modelId}`, error);
      throw error;
    }
  }

  /**
   * 后处理输出数据
   * @param {string} modelId - 模型ID
   * @param {tf.Tensor} prediction - 预测张量
   * @returns {Promise<Array>} 后处理后的数据
   */
  async postprocessOutput(modelId, prediction) {
    try {
      // 转换张量为数组
      const data = await prediction.data();
      const shape = prediction.shape;
      
      // 根据模型类型进行后处理
      const metadata = this.modelMetadata.get(modelId);
      const modelType = metadata?.modelType || 'unknown';
      
      switch (modelType) {
        case MODEL_TYPE_MAPPING.PRICE_PREDICTION:
          return this.postprocessPricePrediction(data, shape);
        case MODEL_TYPE_MAPPING.DEMAND_FORECASTING:
          return this.postprocessDemandForecast(data, shape);
        case MODEL_TYPE_MAPPING.RISK_ASSESSMENT:
          return this.postprocessRiskAssessment(data, shape);
        case MODEL_TYPE_MAPPING.ANOMALY_DETECTION:
          return this.postprocessAnomalyDetection(data, shape);
        default:
          return Array.from(data);
      }
    } catch (error) {
      logger.error(`输出后处理失败: ${modelId}`, error);
      throw error;
    }
  }

  /**
   * 转换数据为张量
   * @param {Array} data - 输入数据
   * @param {string} modelId - 模型ID
   * @returns {tf.Tensor} 张量
   */
  convertToTensor(data, modelId) {
    try {
      const metadata = this.modelMetadata.get(modelId);
      const inputShape = metadata?.inputShape;
      
      if (inputShape && inputShape.length > 1) {
        // 多维输入
        const expectedSize = inputShape.slice(1).reduce((a, b) => a * b, 1);
        if (data.length !== expectedSize) {
          throw new Error(`输入数据大小不匹配，期望: ${expectedSize}, 实际: ${data.length}`);
        }
        return tf.tensor(data, [1, ...inputShape.slice(1)]);
      } else {
        // 一维输入
        return tf.tensor2d([data]);
      }
    } catch (error) {
      logger.error(`张量转换失败: ${modelId}`, error);
      throw error;
    }
  }

  /**
   * 转换批量数据为张量
   * @param {Array} batchData - 批量数据
   * @param {string} modelId - 模型ID
   * @returns {tf.Tensor} 批量张量
   */
  convertToBatchTensor(batchData, modelId) {
    try {
      const metadata = this.modelMetadata.get(modelId);
      const inputShape = metadata?.inputShape;
      
      if (inputShape && inputShape.length > 1) {
        const batchSize = batchData.length;
        const shape = [batchSize, ...inputShape.slice(1)];
        const flatData = batchData.flat();
        return tf.tensor(flatData, shape);
      } else {
        return tf.tensor2d(batchData);
      }
    } catch (error) {
      logger.error(`批量张量转换失败: ${modelId}`, error);
      throw error;
    }
  }

  /**
   * 后处理批量输出
   * @param {string} modelId - 模型ID
   * @param {tf.Tensor} batchPrediction - 批量预测张量
   * @returns {Promise<Array>} 后处理后的批量数据
   */
  async postprocessBatchOutput(modelId, batchPrediction) {
    try {
      const data = await batchPrediction.data();
      const shape = batchPrediction.shape;
      const batchSize = shape[0];
      const outputSize = shape.slice(1).reduce((a, b) => a * b, 1);
      
      const results = [];
      for (let i = 0; i < batchSize; i++) {
        const start = i * outputSize;
        const end = start + outputSize;
        const sampleData = data.slice(start, end);
        
        // 创建单个样本的张量进行后处理
        const sampleTensor = tf.tensor(sampleData, shape.slice(1));
        const processedResult = await this.postprocessOutput(modelId, sampleTensor);
        sampleTensor.dispose();
        
        results.push(processedResult);
      }
      
      return results;
    } catch (error) {
      logger.error(`批量输出后处理失败: ${modelId}`, error);
      throw error;
    }
  }

  /**
   * 计算预测置信度
   * @param {Array} prediction - 预测结果
   * @returns {number} 置信度
   */
  calculateConfidence(prediction) {
    if (!Array.isArray(prediction) || prediction.length === 0) {
      return 0;
    }
    
    // 对于分类问题，使用最大概率作为置信度
    if (prediction.every(val => val >= 0 && val <= 1)) {
      return Math.max(...prediction);
    }
    
    // 对于回归问题，基于预测值的稳定性计算置信度
    const mean = prediction.reduce((a, b) => a + b, 0) / prediction.length;
    const variance = prediction.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prediction.length;
    const stability = 1 / (1 + variance);
    
    return Math.min(stability, 1);
  }

  /**
   * 更新性能指标
   * @param {string} modelId - 模型ID
   * @param {number} latency - 延迟时间
   * @param {number} count - 预测次数
   */
  updatePerformanceMetrics(modelId, latency, count = 1) {
    const metrics = this.modelPerformance.get(modelId);
    if (metrics) {
      const totalPredictions = metrics.totalPredictions + count;
      const averageLatency = (metrics.averageLatency * metrics.totalPredictions + latency * count) / totalPredictions;
      
      this.modelPerformance.set(modelId, {
        ...metrics,
        totalPredictions,
        averageLatency,
        lastUsed: new Date()
      });
    }
  }

  /**
   * 生成缓存键
   * @param {string} modelId - 模型ID
   * @param {Array|Object} inputData - 输入数据
   * @returns {string} 缓存键
   */
  generateCacheKey(modelId, inputData) {
    const dataStr = JSON.stringify(inputData);
    return `${modelId}_${Buffer.from(dataStr).toString('base64').slice(0, 32)}`;
  }

  /**
   * 加载预训练模型
   */
  async loadPretrainedModels() {
    try {
      // 这里可以加载一些预训练的模型
      // 例如价格预测模型、需求预测模型等
      
      logger.info('预训练模型加载完成');
    } catch (error) {
      logger.error('预训练模型加载失败:', error);
    }
  }

  /**
   * 数据标准化
   * @param {Array} data - 数据
   * @param {Object} params - 参数
   * @returns {Array} 标准化后的数据
   */
  standardizeData(data, params) {
    const { mean = 0, std = 1 } = params;
    return data.map(val => (val - mean) / std);
  }

  /**
   * 数据归一化
   * @param {Array} data - 数据
   * @param {Object} params - 参数
   * @returns {Array} 归一化后的数据
   */
  normalizeData(data, params) {
    const { norm = 'l2' } = params;
    if (norm === 'l2') {
      const magnitude = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0));
      return magnitude > 0 ? data.map(val => val / magnitude) : data;
    }
    return data;
  }

  /**
   * 最小-最大缩放
   * @param {Array} data - 数据
   * @param {Object} params - 参数
   * @returns {Array} 缩放后的数据
   */
  minMaxScale(data, params) {
    const { min = 0, max = 1 } = params;
    const dataMin = Math.min(...data);
    const dataMax = Math.max(...data);
    const range = dataMax - dataMin;
    
    if (range === 0) return data;
    
    return data.map(val => min + (val - dataMin) * (max - min) / range);
  }

  /**
   * 特征工程
   * @param {Array} data - 数据
   * @param {Object} params - 参数
   * @returns {Array} 工程化后的数据
   */
  engineerFeatures(data, params) {
    // 这里可以实现各种特征工程技术
    // 例如多项式特征、交互特征等
    return data;
  }

  /**
   * 后处理价格预测
   * @param {Float32Array} data - 预测数据
   * @param {Array} shape - 张量形状
   * @returns {Object} 处理后的价格预测
   */
  postprocessPricePrediction(data, shape) {
    return {
      predictedPrice: data[0],
      priceRange: {
        min: data[0] * 0.95,
        max: data[0] * 1.05
      },
      trend: data[0] > 0 ? 'up' : 'down'
    };
  }

  /**
   * 后处理需求预测
   * @param {Float32Array} data - 预测数据
   * @param {Array} shape - 张量形状
   * @returns {Object} 处理后的需求预测
   */
  postprocessDemandForecast(data, shape) {
    return {
      predictedDemand: data[0],
      demandCategory: data[0] > 0.7 ? 'high' : data[0] > 0.3 ? 'medium' : 'low',
      confidence: this.calculateConfidence(Array.from(data))
    };
  }

  /**
   * 后处理风险评估
   * @param {Float32Array} data - 预测数据
   * @param {Array} shape - 张量形状
   * @returns {Object} 处理后的风险评估
   */
  postprocessRiskAssessment(data, shape) {
    return {
      riskScore: data[0],
      riskLevel: data[0] > 0.8 ? 'high' : data[0] > 0.5 ? 'medium' : 'low',
      riskFactors: Array.from(data).slice(1)
    };
  }

  /**
   * 后处理异常检测
   * @param {Float32Array} data - 预测数据
   * @param {Array} shape - 张量形状
   * @returns {Object} 处理后的异常检测
   */
  postprocessAnomalyDetection(data, shape) {
    return {
      isAnomaly: data[0] > 0.5,
      anomalyScore: data[0],
      anomalyType: data[0] > 0.8 ? 'severe' : data[0] > 0.5 ? 'moderate' : 'normal'
    };
  }

  /**
   * 卸载模型
   * @param {string} modelId - 模型ID
   */
  unloadModel(modelId) {
    try {
      const model = this.loadedModels.get(modelId);
      if (model) {
        model.dispose();
        this.loadedModels.delete(modelId);
        this.modelMetadata.delete(modelId);
        this.modelPerformance.delete(modelId);
        logger.info(`模型已卸载: ${modelId}`);
      }
    } catch (error) {
      logger.error(`模型卸载失败: ${modelId}`, error);
    }
  }

  /**
   * 获取模型信息
   * @param {string} modelId - 模型ID
   * @returns {Object} 模型信息
   */
  getModelInfo(modelId) {
    const metadata = this.modelMetadata.get(modelId);
    const performance = this.modelPerformance.get(modelId);
    const isLoaded = this.loadedModels.has(modelId);
    
    return {
      modelId,
      isLoaded,
      metadata,
      performance
    };
  }

  /**
   * 获取所有模型状态
   * @returns {Object} 所有模型状态
   */
  getAllModelsStatus() {
    const models = {};
    
    for (const [modelId] of this.loadedModels) {
      models[modelId] = this.getModelInfo(modelId);
    }
    
    return {
      totalModels: this.loadedModels.size,
      models,
      memoryUsage: tf.memory(),
      backend: tf.getBackend()
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.predictionCache.clear();
    logger.info('预测缓存已清理');
  }

  /**
   * 清理所有资源
   */
  dispose() {
    // 卸载所有模型
    for (const [modelId] of this.loadedModels) {
      this.unloadModel(modelId);
    }
    
    // 清理缓存
    this.clearCache();
    
    logger.info('TensorFlow.js模型管理器已清理');
  }
}

module.exports = {
  VPPTensorFlowModelManager,
  MODEL_TYPE_MAPPING,
  PREPROCESSOR_TYPES
};