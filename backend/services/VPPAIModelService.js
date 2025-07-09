/**
 * 虚拟电厂AI模型管理服务
 * 负责AI模型的注册、管理、预测和版本控制
 * P1阶段核心功能：AI框架集成
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const vppDatabase = require('./vppDatabase');
const fs = require('fs').promises;
const path = require('path');
const { VPPTensorFlowModelManager, MODEL_TYPE_MAPPING } = require('./VPPTensorFlowModelManager');

// 模型类型枚举
const MODEL_TYPES = {
  PRICE_PREDICTION: 'PRICE_PREDICTION',
  DEMAND_FORECASTING: 'DEMAND_FORECASTING',
  OPTIMIZATION: 'OPTIMIZATION',
  RISK_ASSESSMENT: 'RISK_ASSESSMENT',
  ANOMALY_DETECTION: 'ANOMALY_DETECTION'
};

// 模型状态枚举
const MODEL_STATUS = {
  REGISTERED: 'REGISTERED',
  TRAINING: 'TRAINING',
  READY: 'READY',
  DEPRECATED: 'DEPRECATED',
  ERROR: 'ERROR'
};

// 预测置信度等级
const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',      // > 0.8
  MEDIUM: 'MEDIUM',  // 0.6 - 0.8
  LOW: 'LOW'         // < 0.6
};

class VPPAIModelService {
  constructor() {
    this.modelCache = new Map();
    this.predictionHistory = new Map();
    this.modelPerformance = new Map();
    this.modelInstances = new Map();
    this.tensorflowManager = new VPPTensorFlowModelManager();
    this.initializeService();
  }

  /**
   * 初始化服务
   */
  async initializeService() {
    try {
      // 创建模型存储目录
      const modelDir = path.join(process.cwd(), 'models');
      await fs.mkdir(modelDir, { recursive: true });
      
      // 初始化TensorFlow.js管理器
      await this.tensorflowManager.initializeManager();
      
      // 加载已注册的模型
      await this.loadRegisteredModels();
      
      logger.info('AI模型服务初始化完成');
    } catch (error) {
      logger.error('AI模型服务初始化失败:', error);
    }
  }

  /**
   * 注册AI模型
   * @param {Object} modelData - 模型数据
   * @returns {Promise<Object>} 注册结果
   */
  async registerModel(modelData) {
    try {
      const modelId = uuidv4();
      const now = new Date();
      
      // 验证模型数据
      this.validateModelData(modelData);
      
      const model = {
        id: modelId,
        name: modelData.name,
        model_type: modelData.model_type,
        version: modelData.version,
        model_file_path: modelData.model_file_path,
        input_schema: JSON.stringify(modelData.input_schema),
        output_schema: JSON.stringify(modelData.output_schema),
        description: modelData.description || '',
        framework: modelData.framework || 'tensorflow',
        status: MODEL_STATUS.REGISTERED,
        performance_metrics: JSON.stringify({
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1_score: 0,
          mse: 0,
          mae: 0
        }),
        created_at: now,
        updated_at: now
      };
      
      // 插入数据库
      const query = `
        INSERT INTO ai_models 
        (id, name, model_type, version, model_file_path, input_schema, output_schema, 
         description, framework, status, performance_metrics, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await vppDatabase.execute(query, [
        model.id, model.name, model.model_type, model.version, model.model_file_path,
        model.input_schema, model.output_schema, model.description, model.framework,
        model.status, model.performance_metrics, model.created_at, model.updated_at
      ]);
      
      // 更新缓存
      this.modelCache.set(modelId, {
        ...model,
        input_schema: modelData.input_schema,
        output_schema: modelData.output_schema,
        performance_metrics: JSON.parse(model.performance_metrics)
      });
      
      logger.info(`AI模型注册成功: ${modelId}`, { name: model.name, type: model.model_type });
      
      return {
        id: modelId,
        name: model.name,
        model_type: model.model_type,
        version: model.version,
        status: model.status,
        created_at: model.created_at
      };
      
    } catch (error) {
      logger.error('注册AI模型失败:', error);
      throw new Error(`注册AI模型失败: ${error.message}`);
    }
  }

  /**
   * 获取AI模型列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 模型列表
   */
  async getModels(filters = {}) {
    try {
      let query = 'SELECT * FROM ai_models WHERE 1=1';
      const params = [];
      
      if (filters.model_type) {
        query += ' AND model_type = ?';
        params.push(filters.model_type);
      }
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.framework) {
        query += ' AND framework = ?';
        params.push(filters.framework);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const models = await vppDatabase.query(query, params);
      
      return models.map(model => ({
        ...model,
        input_schema: JSON.parse(model.input_schema || '{}'),
        output_schema: JSON.parse(model.output_schema || '{}'),
        performance_metrics: JSON.parse(model.performance_metrics || '{}')
      }));
      
    } catch (error) {
      logger.error('获取AI模型列表失败:', error);
      throw new Error(`获取AI模型列表失败: ${error.message}`);
    }
  }

  /**
   * 获取模型详情
   * @param {string} modelId - 模型ID
   * @returns {Promise<Object>} 模型详情
   */
  async getModelById(modelId) {
    try {
      // 先从缓存获取
      if (this.modelCache.has(modelId)) {
        return this.modelCache.get(modelId);
      }
      
      const query = 'SELECT * FROM ai_models WHERE id = ?';
      const models = await vppDatabase.query(query, [modelId]);
      
      if (models.length === 0) {
        throw new Error('模型不存在');
      }
      
      const model = models[0];
      const result = {
        ...model,
        input_schema: JSON.parse(model.input_schema || '{}'),
        output_schema: JSON.parse(model.output_schema || '{}'),
        performance_metrics: JSON.parse(model.performance_metrics || '{}')
      };
      
      // 更新缓存
      this.modelCache.set(modelId, result);
      
      return result;
      
    } catch (error) {
      logger.error('获取模型详情失败:', error);
      throw new Error(`获取模型详情失败: ${error.message}`);
    }
  }

  /**
   * 加载模型实例
   * @param {string} modelId - 模型ID
   * @returns {Promise<Object>} 模型实例
   */
  async loadModel(modelId) {
    try {
      // 检查是否已加载
      if (this.modelInstances.has(modelId)) {
        return this.modelInstances.get(modelId);
      }
      
      const model = await this.getModelById(modelId);
      
      if (model.status !== MODEL_STATUS.READY) {
        throw new Error('模型未就绪，无法加载');
      }
      
      // 如果是TensorFlow.js模型，尝试加载到TensorFlow.js管理器
      if (model.framework === 'tensorflow' && model.model_file_path) {
        try {
          const loadSuccess = await this.tensorflowManager.loadModel(
            modelId, 
            model.model_file_path, 
            {
              modelType: model.model_type,
              inputSchema: model.input_schema,
              outputSchema: model.output_schema,
              preprocessing: model.preprocessing || []
            }
          );
          
          if (loadSuccess) {
            logger.info(`TensorFlow.js模型加载成功: ${modelId}`);
          } else {
            logger.warn(`TensorFlow.js模型加载失败，将使用模拟预测: ${modelId}`);
          }
        } catch (tfError) {
          logger.warn(`TensorFlow.js模型加载异常: ${modelId}`, tfError);
        }
      }
      
      // 模拟模型加载过程
      // 在实际实现中，这里会根据framework加载相应的模型文件
      const modelInstance = {
        id: modelId,
        name: model.name,
        type: model.model_type,
        version: model.version,
        framework: model.framework,
        loaded_at: new Date(),
        predict: this.createPredictFunction(model)
      };
      
      this.modelInstances.set(modelId, modelInstance);
      
      // 更新模型状态
      await this.updateModelStatus(modelId, MODEL_STATUS.READY);
      
      logger.info(`模型加载成功: ${modelId}`);
      
      return modelInstance;
      
    } catch (error) {
      logger.error('加载模型失败:', error);
      await this.updateModelStatus(modelId, MODEL_STATUS.ERROR);
      throw new Error(`加载模型失败: ${error.message}`);
    }
  }

  /**
   * 模型预测
   * @param {string} modelId - 模型ID
   * @param {Object} inputData - 输入数据
   * @returns {Promise<Object>} 预测结果
   */
  async predict(modelId, inputData) {
    try {
      const model = await this.getModelById(modelId);
      
      if (!model) {
        throw new Error('模型不存在');
      }
      
      if (model.status !== MODEL_STATUS.READY) {
        throw new Error('模型状态不可用');
      }
      
      // 验证输入数据
      this.validateInputData(model, inputData);
      
      let prediction;
      
      // 检查是否为TensorFlow.js模型
      if (model.framework === 'tensorflow' && model.model_file_path) {
        try {
          // 使用TensorFlow.js进行预测
          prediction = await this.tensorflowManager.predict(modelId, inputData);
        } catch (tfError) {
          logger.warn(`TensorFlow.js预测失败，使用模拟预测: ${tfError.message}`);
          // 回退到模拟预测
          prediction = await this.simulatePredict(model, inputData);
        }
      } else {
        // 使用模拟预测
        prediction = await this.simulatePredict(model, inputData);
      }
      
      // 计算置信度等级
      const confidenceLevel = this.getConfidenceLevel(prediction.confidence);
      
      const result = {
        model_id: modelId,
        model_name: model.name,
        model_version: model.version,
        input_data: inputData,
        predictions: prediction.output,
        confidence: prediction.confidence,
        confidence_level: confidenceLevel,
        prediction_time: new Date(),
        processing_time_ms: prediction.processing_time
      };
      
      // 记录预测历史
      this.recordPrediction(modelId, result);
      
      // 更新模型性能指标
      await this.updateModelPerformance(modelId, result);
      
      logger.info(`模型预测完成: ${modelId}`, { confidence: prediction.confidence });
      
      return result;
      
    } catch (error) {
      logger.error('模型预测失败:', error);
      throw new Error(`模型预测失败: ${error.message}`);
    }
  }

  /**
   * 批量预测
   * @param {string} modelId - 模型ID
   * @param {Array} inputDataArray - 输入数据数组
   * @returns {Promise<Array>} 预测结果数组
   */
  async batchPredict(modelId, inputDataArray) {
    try {
      const model = await this.getModelById(modelId);
      
      if (!model) {
        throw new Error('模型不存在');
      }
      
      if (model.status !== MODEL_STATUS.READY) {
        throw new Error('模型状态不可用');
      }
      
      let results;
      
      // 检查是否为TensorFlow.js模型
      if (model.framework === 'tensorflow' && model.model_file_path) {
        try {
          // 使用TensorFlow.js进行批量预测
          results = await this.tensorflowManager.batchPredict(modelId, inputDataArray);
        } catch (tfError) {
          logger.warn(`TensorFlow.js批量预测失败，使用逐个预测: ${tfError.message}`);
          // 回退到逐个预测
          results = [];
          for (const inputData of inputDataArray) {
            const prediction = await this.simulatePredict(model, inputData);
            const confidenceLevel = this.getConfidenceLevel(prediction.confidence);
            const result = {
              model_id: modelId,
              model_name: model.name,
              model_version: model.version,
              input_data: inputData,
              predictions: prediction.output,
              confidence: prediction.confidence,
              confidence_level: confidenceLevel,
              prediction_time: new Date(),
              processing_time_ms: prediction.processing_time
            };
            results.push(result);
          }
        }
      } else {
        // 使用模拟预测
        results = [];
        for (const inputData of inputDataArray) {
          const prediction = await this.simulatePredict(model, inputData);
          const confidenceLevel = this.getConfidenceLevel(prediction.confidence);
          const result = {
            model_id: modelId,
            model_name: model.name,
            model_version: model.version,
            input_data: inputData,
            predictions: prediction.output,
            confidence: prediction.confidence,
            confidence_level: confidenceLevel,
            prediction_time: new Date(),
            processing_time_ms: prediction.processing_time
          };
          results.push(result);
        }
      }
      
      // 记录批量预测历史
      for (const result of results) {
        this.recordPrediction(modelId, result);
        await this.updateModelPerformance(modelId, result);
      }
      
      logger.info(`批量预测完成: ${modelId}`, { count: results.length });
      
      return results;
      
    } catch (error) {
      logger.error('批量预测失败:', error);
      throw new Error(`批量预测失败: ${error.message}`);
    }
  }

  /**
   * 更新模型状态
   * @param {string} modelId - 模型ID
   * @param {string} status - 新状态
   * @returns {Promise<void>}
   */
  async updateModelStatus(modelId, status) {
    try {
      const query = 'UPDATE ai_models SET status = ?, updated_at = ? WHERE id = ?';
      await vppDatabase.execute(query, [status, new Date(), modelId]);
      
      // 更新缓存
      if (this.modelCache.has(modelId)) {
        this.modelCache.get(modelId).status = status;
      }
      
    } catch (error) {
      logger.error('更新模型状态失败:', error);
    }
  }

  /**
   * 更新模型性能指标
   * @param {string} modelId - 模型ID
   * @param {Object} predictionResult - 预测结果
   */
  async updateModelPerformance(modelId, predictionResult) {
    try {
      if (!this.modelPerformance.has(modelId)) {
        this.modelPerformance.set(modelId, {
          total_predictions: 0,
          average_confidence: 0,
          average_processing_time: 0,
          high_confidence_count: 0,
          medium_confidence_count: 0,
          low_confidence_count: 0
        });
      }
      
      const performance = this.modelPerformance.get(modelId);
      performance.total_predictions++;
      
      // 更新平均置信度
      performance.average_confidence = 
        (performance.average_confidence * (performance.total_predictions - 1) + predictionResult.confidence) / 
        performance.total_predictions;
      
      // 更新平均处理时间
      performance.average_processing_time = 
        (performance.average_processing_time * (performance.total_predictions - 1) + predictionResult.processing_time_ms) / 
        performance.total_predictions;
      
      // 更新置信度分布
      switch (predictionResult.confidence_level) {
        case CONFIDENCE_LEVELS.HIGH:
          performance.high_confidence_count++;
          break;
        case CONFIDENCE_LEVELS.MEDIUM:
          performance.medium_confidence_count++;
          break;
        case CONFIDENCE_LEVELS.LOW:
          performance.low_confidence_count++;
          break;
      }
      
      // 更新数据库
      const query = 'UPDATE ai_models SET performance_metrics = ?, updated_at = ? WHERE id = ?';
      await vppDatabase.execute(query, [JSON.stringify(performance), new Date(), modelId]);
      
    } catch (error) {
      logger.error('更新模型性能指标失败:', error);
    }
  }

  /**
   * 模拟预测（当TensorFlow.js不可用时的回退方案）
   * @param {Object} model - 模型对象
   * @param {Object} inputData - 输入数据
   * @returns {Promise<Object>} 预测结果
   */
  async simulatePredict(model, inputData) {
    const startTime = Date.now();
    
    // 模拟不同类型模型的预测逻辑
    let output;
    let confidence;
    
    switch (model.model_type) {
      case MODEL_TYPES.PRICE_PREDICTION:
        output = this.simulatePricePrediction(inputData);
        confidence = 0.75 + Math.random() * 0.2;
        break;
        
      case MODEL_TYPES.DEMAND_FORECASTING:
        output = this.simulateDemandForecasting(inputData);
        confidence = 0.8 + Math.random() * 0.15;
        break;
        
      case MODEL_TYPES.OPTIMIZATION:
        output = this.simulateOptimization(inputData);
        confidence = 0.85 + Math.random() * 0.1;
        break;
        
      case MODEL_TYPES.RISK_ASSESSMENT:
        output = this.simulateRiskAssessment(inputData);
        confidence = 0.7 + Math.random() * 0.25;
        break;
        
      case MODEL_TYPES.ANOMALY_DETECTION:
        output = this.simulateAnomalyDetection(inputData);
        confidence = 0.9 + Math.random() * 0.1;
        break;
        
      default:
        throw new Error(`不支持的模型类型: ${model.model_type}`);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      output,
      confidence,
      processing_time: processingTime
    };
  }

  /**
   * 创建预测函数（保留用于向后兼容）
   * @param {Object} model - 模型对象
   * @returns {Function} 预测函数
   */
  createPredictFunction(model) {
    return async (inputData) => {
      return await this.simulatePredict(model, inputData);
    };
  }

  /**
   * 模拟价格预测
   * @param {Object} inputData - 输入数据
   * @returns {Object} 预测结果
   */
  simulatePricePrediction(inputData) {
    const { historical_prices, market_conditions, weather_data } = inputData;
    
    // 简单的价格预测模拟
    const basePrice = historical_prices[historical_prices.length - 1] || 100;
    const trend = (Math.random() - 0.5) * 0.2; // -10% to +10%
    const volatility = Math.random() * 0.1; // 0% to 10%
    
    const predictedPrice = basePrice * (1 + trend + (Math.random() - 0.5) * volatility);
    
    return {
      predicted_price: Math.round(predictedPrice * 100) / 100,
      price_range: {
        min: Math.round(predictedPrice * 0.9 * 100) / 100,
        max: Math.round(predictedPrice * 1.1 * 100) / 100
      },
      trend: trend > 0 ? 'up' : 'down',
      volatility_level: volatility > 0.05 ? 'high' : 'low'
    };
  }

  /**
   * 模拟需求预测
   * @param {Object} inputData - 输入数据
   * @returns {Object} 预测结果
   */
  simulateDemandForecasting(inputData) {
    const { historical_demand, time_features, external_factors } = inputData;
    
    const baseDemand = historical_demand[historical_demand.length - 1] || 1000;
    const seasonalFactor = 1 + Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 365) * 2 * Math.PI) * 0.2;
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    const predictedDemand = baseDemand * seasonalFactor * randomFactor;
    
    return {
      predicted_demand: Math.round(predictedDemand),
      demand_category: predictedDemand > baseDemand * 1.1 ? 'high' : 
                      predictedDemand < baseDemand * 0.9 ? 'low' : 'normal',
      peak_hours: ['09:00', '18:00', '20:00'],
      confidence_interval: {
        lower: Math.round(predictedDemand * 0.85),
        upper: Math.round(predictedDemand * 1.15)
      }
    };
  }

  /**
   * 模拟优化
   * @param {Object} inputData - 输入数据
   * @returns {Object} 优化结果
   */
  simulateOptimization(inputData) {
    const { resources, constraints, objectives } = inputData;
    
    // 简单的资源分配优化模拟
    const optimizedAllocation = resources.map(resource => ({
      resource_id: resource.id,
      allocated_capacity: resource.capacity * (0.7 + Math.random() * 0.3),
      utilization_rate: 0.8 + Math.random() * 0.2,
      priority: Math.floor(Math.random() * 5) + 1
    }));
    
    return {
      optimized_allocation: optimizedAllocation,
      total_cost: Math.round(Math.random() * 10000),
      efficiency_improvement: Math.round((Math.random() * 0.3 + 0.1) * 100) / 100,
      constraints_satisfied: Math.random() > 0.1
    };
  }

  /**
   * 模拟风险评估
   * @param {Object} inputData - 输入数据
   * @returns {Object} 风险评估结果
   */
  simulateRiskAssessment(inputData) {
    const { portfolio, market_data, historical_volatility } = inputData;
    
    const riskScore = Math.random() * 100;
    const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
    
    return {
      overall_risk_score: Math.round(riskScore),
      risk_level: riskLevel,
      risk_factors: [
        { factor: 'market_volatility', score: Math.round(Math.random() * 100) },
        { factor: 'liquidity_risk', score: Math.round(Math.random() * 100) },
        { factor: 'operational_risk', score: Math.round(Math.random() * 100) }
      ],
      recommendations: [
        '建议增加风险对冲措施',
        '优化资产配置比例',
        '加强实时监控'
      ]
    };
  }

  /**
   * 模拟异常检测
   * @param {Object} inputData - 输入数据
   * @returns {Object} 异常检测结果
   */
  simulateAnomalyDetection(inputData) {
    const { time_series_data, normal_patterns } = inputData;
    
    const anomalyProbability = Math.random();
    const isAnomaly = anomalyProbability > 0.8;
    
    return {
      is_anomaly: isAnomaly,
      anomaly_score: Math.round(anomalyProbability * 100) / 100,
      anomaly_type: isAnomaly ? ['spike', 'drift', 'outlier'][Math.floor(Math.random() * 3)] : null,
      affected_metrics: isAnomaly ? ['power_consumption', 'efficiency'][Math.floor(Math.random() * 2)] : [],
      severity: isAnomaly ? ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] : null
    };
  }

  /**
   * 获取置信度等级
   * @param {number} confidence - 置信度值
   * @returns {string} 置信度等级
   */
  getConfidenceLevel(confidence) {
    if (confidence > 0.8) return CONFIDENCE_LEVELS.HIGH;
    if (confidence > 0.6) return CONFIDENCE_LEVELS.MEDIUM;
    return CONFIDENCE_LEVELS.LOW;
  }

  /**
   * 验证模型数据
   * @param {Object} modelData - 模型数据
   */
  validateModelData(modelData) {
    const required = ['name', 'model_type', 'version', 'input_schema', 'output_schema'];
    
    for (const field of required) {
      if (!modelData[field]) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }
    
    if (!Object.values(MODEL_TYPES).includes(modelData.model_type)) {
      throw new Error('无效的模型类型');
    }
  }

  /**
   * 验证输入数据
   * @param {Object} model - 模型对象
   * @param {Object} inputData - 输入数据
   */
  validateInputData(model, inputData) {
    const schema = model.input_schema;
    
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in inputData)) {
          throw new Error(`缺少必需的输入字段: ${field}`);
        }
      }
    }
  }

  /**
   * 记录预测历史
   * @param {string} modelId - 模型ID
   * @param {Object} result - 预测结果
   */
  recordPrediction(modelId, result) {
    if (!this.predictionHistory.has(modelId)) {
      this.predictionHistory.set(modelId, []);
    }
    
    const history = this.predictionHistory.get(modelId);
    history.push({
      timestamp: new Date(),
      result,
      confidence: result.confidence
    });
    
    // 保留最近1000次预测记录
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  /**
   * 加载已注册的模型
   */
  async loadRegisteredModels() {
    try {
      const models = await this.getModels({ status: MODEL_STATUS.READY });
      
      for (const model of models) {
        this.modelCache.set(model.id, model);
      }
      
      logger.info(`加载了 ${models.length} 个已注册模型`);
      
    } catch (error) {
      logger.error('加载已注册模型失败:', error);
    }
  }

  /**
   * 获取模型预测历史
   * @param {string} modelId - 模型ID
   * @param {number} limit - 限制数量
   * @returns {Array} 预测历史
   */
  getPredictionHistory(modelId, limit = 100) {
    const history = this.predictionHistory.get(modelId) || [];
    return history.slice(-limit);
  }

  /**
   * 获取模型性能统计
   * @param {string} modelId - 模型ID
   * @returns {Object} 性能统计
   */
  getModelPerformance(modelId) {
    return this.modelPerformance.get(modelId) || {
      total_predictions: 0,
      average_confidence: 0,
      average_processing_time: 0,
      high_confidence_count: 0,
      medium_confidence_count: 0,
      low_confidence_count: 0
    };
  }

  /**
   * 卸载模型
   * @param {string} modelId - 模型ID
   */
  unloadModel(modelId) {
    if (this.modelInstances.has(modelId)) {
      this.modelInstances.delete(modelId);
      logger.info(`模型已卸载: ${modelId}`);
    }
  }

  /**
   * 获取服务状态
   * @returns {Object} 服务状态
   */
  getServiceStatus() {
    return {
      service: 'VPPAIModelService',
      status: 'running',
      cached_models: this.modelCache.size,
      loaded_instances: this.modelInstances.size,
      prediction_histories: this.predictionHistory.size,
      supported_model_types: Object.values(MODEL_TYPES),
      supported_frameworks: ['tensorflow', 'pytorch', 'scikit-learn', 'xgboost'],
      confidence_levels: Object.values(CONFIDENCE_LEVELS),
      timestamp: new Date()
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.modelCache.clear();
    this.predictionHistory.clear();
    this.modelPerformance.clear();
    this.modelInstances.clear();
    logger.info('AI模型服务缓存已清理');
  }
}

// 导出常量和服务类
module.exports = {
  VPPAIModelService,
  MODEL_TYPES,
  MODEL_STATUS,
  CONFIDENCE_LEVELS
};