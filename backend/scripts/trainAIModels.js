/**
 * AI模型训练脚本
 * 用于训练和保存虚拟电厂相关的AI模型
 * 支持价格预测、需求预测、风险评估等模型
 */

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import logger from '../../src/shared/utils/logger.js';

/**
 * 模型配置
 */
const MODEL_CONFIGS = {
  PRICE_PREDICTION: {
    name: 'price_prediction_model',
    inputShape: [24], // 24小时历史数据
    outputShape: 1, // 预测下一小时价格
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001
  },
  DEMAND_FORECAST: {
    name: 'demand_forecast_model',
    inputShape: [48], // 48小时历史数据
    outputShape: 24, // 预测未来24小时需求
    epochs: 150,
    batchSize: 16,
    learningRate: 0.0005
  },
  RISK_ASSESSMENT: {
    name: 'risk_assessment_model',
    inputShape: [20], // 20个风险指标
    outputShape: 3, // 低、中、高风险概率
    epochs: 80,
    batchSize: 64,
    learningRate: 0.002
  }
};

/**
 * 生成模拟训练数据
 * @param {string} modelType 模型类型
 * @param {number} samples 样本数量
 * @returns {Object} 训练数据
 */
function generateTrainingData(modelType, samples = 1000) {
  const config = MODEL_CONFIGS[modelType];
  if (!config) {
    throw new Error(`未知的模型类型: ${modelType}`);
  }

  const inputData = [];
  const outputData = [];

  for (let i = 0; i < samples; i++) {
    switch (modelType) {
      case 'PRICE_PREDICTION':
        // 生成24小时价格历史数据
        const priceHistory = Array.from({ length: 24 }, () => 
          0.08 + Math.random() * 0.12 + Math.sin(Math.random() * Math.PI) * 0.02
        );
        // 预测下一小时价格（基于趋势和随机因素）
        const avgPrice = priceHistory.reduce((a, b) => a + b) / 24;
        const trend = (priceHistory[23] - priceHistory[0]) / 24;
        const nextPrice = avgPrice + trend + (Math.random() - 0.5) * 0.01;
        
        inputData.push(priceHistory);
        outputData.push([Math.max(0.05, Math.min(0.25, nextPrice))]);
        break;

      case 'DEMAND_FORECAST':
        // 生成48小时需求历史数据
        const demandHistory = Array.from({ length: 48 }, (_, hour) => {
          const baseLoad = 100;
          const dailyCycle = Math.sin((hour % 24) * Math.PI / 12) * 30;
          const weeklyPattern = Math.sin(hour * Math.PI / 168) * 10;
          const noise = (Math.random() - 0.5) * 20;
          return Math.max(50, baseLoad + dailyCycle + weeklyPattern + noise);
        });
        
        // 预测未来24小时需求
        const futureDemand = Array.from({ length: 24 }, (_, hour) => {
          const lastHour = demandHistory[47];
          const seasonalFactor = Math.sin((hour + 48) * Math.PI / 12) * 25;
          const trend = (demandHistory[47] - demandHistory[23]) / 24;
          return Math.max(50, lastHour + seasonalFactor + trend * hour + (Math.random() - 0.5) * 15);
        });
        
        inputData.push(demandHistory);
        outputData.push(futureDemand);
        break;

      case 'RISK_ASSESSMENT':
        // 生成20个风险指标
        const riskIndicators = Array.from({ length: 20 }, () => Math.random());
        
        // 计算风险等级概率
        const riskScore = riskIndicators.reduce((sum, indicator, index) => {
          const weight = [0.15, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05, 0.04, 0.04, 0.03,
                         0.03, 0.03, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02][index];
          return sum + indicator * weight;
        }, 0);
        
        let lowRisk, mediumRisk, highRisk;
        if (riskScore < 0.3) {
          lowRisk = 0.7 + Math.random() * 0.2;
          mediumRisk = 0.2 + Math.random() * 0.1;
          highRisk = Math.max(0, 0.1 - lowRisk - mediumRisk);
        } else if (riskScore < 0.7) {
          mediumRisk = 0.5 + Math.random() * 0.3;
          lowRisk = Math.random() * 0.3;
          highRisk = Math.max(0, 1 - lowRisk - mediumRisk);
        } else {
          highRisk = 0.5 + Math.random() * 0.3;
          mediumRisk = Math.random() * 0.3;
          lowRisk = Math.max(0, 1 - mediumRisk - highRisk);
        }
        
        // 归一化概率
        const total = lowRisk + mediumRisk + highRisk;
        inputData.push(riskIndicators);
        outputData.push([lowRisk/total, mediumRisk/total, highRisk/total]);
        break;
    }
  }

  return {
    inputs: tf.tensor2d(inputData),
    outputs: tf.tensor2d(outputData)
  };
}

/**
 * 创建神经网络模型
 * @param {string} modelType 模型类型
 * @returns {tf.Sequential} TensorFlow模型
 */
function createModel(modelType) {
  const config = MODEL_CONFIGS[modelType];
  
  const model = tf.sequential({
    layers: [
      // 输入层
      tf.layers.dense({
        inputShape: config.inputShape,
        units: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      
      // 第一隐藏层
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      
      // 第二隐藏层
      tf.layers.dropout({ rate: 0.1 }),
      tf.layers.dense({
        units: 16,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      
      // 输出层
      tf.layers.dense({
        units: config.outputShape,
        activation: modelType === 'RISK_ASSESSMENT' ? 'softmax' : 'linear'
      })
    ]
  });

  // 编译模型
  const optimizer = tf.train.adam(config.learningRate);
  const loss = modelType === 'RISK_ASSESSMENT' ? 'categoricalCrossentropy' : 'meanSquaredError';
  const metrics = modelType === 'RISK_ASSESSMENT' ? ['accuracy'] : ['mae'];
  
  model.compile({
    optimizer,
    loss,
    metrics
  });

  return model;
}

/**
 * 训练模型
 * @param {string} modelType 模型类型
 * @param {number} samples 训练样本数量
 * @returns {Promise<Object>} 训练结果
 */
async function trainModel(modelType, samples = 5000) {
  try {
    logger.info(`开始训练${modelType}模型...`);
    
    // 生成训练数据
    const { inputs, outputs } = generateTrainingData(modelType, samples);
    
    // 创建模型
    const model = createModel(modelType);
    
    // 打印模型结构
    model.summary();
    
    // 训练模型
    const config = MODEL_CONFIGS[modelType];
    const history = await model.fit(inputs, outputs, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            logger.info(`Epoch ${epoch + 1}/${config.epochs} - loss: ${logs.loss.toFixed(4)} - val_loss: ${logs.val_loss.toFixed(4)}`);
          }
        }
      }
    });
    
    // 保存模型
    const modelDir = path.join(process.cwd(), 'models', config.name);
    if (!fs.existsSync(path.dirname(modelDir))) {
      fs.mkdirSync(path.dirname(modelDir), { recursive: true });
    }
    
    await model.save(`file://${modelDir}`);
    logger.info(`模型已保存到: ${modelDir}`);
    
    // 清理内存
    inputs.dispose();
    outputs.dispose();
    
    return {
      modelType,
      modelPath: modelDir,
      finalLoss: history.history.loss[history.history.loss.length - 1],
      finalValLoss: history.history.val_loss[history.history.val_loss.length - 1],
      epochs: config.epochs,
      samples
    };
    
  } catch (error) {
    logger.error(`训练${modelType}模型失败:`, error);
    throw error;
  }
}

/**
 * 训练所有模型
 */
async function trainAllModels() {
  try {
    logger.info('开始训练所有AI模型...');
    
    const results = [];
    
    for (const modelType of Object.keys(MODEL_CONFIGS)) {
      const result = await trainModel(modelType);
      results.push(result);
      
      // 在模型之间稍作休息，避免内存问题
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info('所有模型训练完成!');
    logger.info('训练结果汇总:', results);
    
    // 保存训练报告
    const reportPath = path.join(process.cwd(), 'models', 'training_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalModels: results.length,
        avgFinalLoss: results.reduce((sum, r) => sum + r.finalLoss, 0) / results.length,
        avgFinalValLoss: results.reduce((sum, r) => sum + r.finalValLoss, 0) / results.length
      }
    }, null, 2));
    
    logger.info(`训练报告已保存到: ${reportPath}`);
    
  } catch (error) {
    logger.error('训练过程中发生错误:', error);
    process.exit(1);
  }
}

/**
 * 测试模型预测
 * @param {string} modelType 模型类型
 */
async function testModel(modelType) {
  try {
    const config = MODEL_CONFIGS[modelType];
    const modelPath = path.join(process.cwd(), 'models', config.name);
    
    if (!fs.existsSync(modelPath)) {
      logger.warn(`模型不存在: ${modelPath}`);
      return;
    }
    
    logger.info(`测试${modelType}模型...`);
    
    // 加载模型
    const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
    
    // 生成测试数据
    const { inputs } = generateTrainingData(modelType, 5);
    
    // 进行预测
    const predictions = model.predict(inputs);
    
    logger.info(`${modelType}模型预测结果:`);
    const predictionData = await predictions.data();
    logger.info(predictionData.slice(0, 10)); // 显示前10个预测值
    
    // 清理内存
    inputs.dispose();
    predictions.dispose();
    model.dispose();
    
  } catch (error) {
    logger.error(`测试${modelType}模型失败:`, error);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'train';
  const modelType = args[1];
  
  switch (command) {
    case 'train':
      if (modelType && MODEL_CONFIGS[modelType]) {
        await trainModel(modelType);
      } else {
        await trainAllModels();
      }
      break;
      
    case 'test':
      if (modelType && MODEL_CONFIGS[modelType]) {
        await testModel(modelType);
      } else {
        for (const type of Object.keys(MODEL_CONFIGS)) {
          await testModel(type);
        }
      }
      break;
      
    default:
      logger.info('用法:');
      logger.info('  node trainAIModels.js train [MODEL_TYPE]  - 训练模型');
      logger.info('  node trainAIModels.js test [MODEL_TYPE]   - 测试模型');
      logger.info('可用的模型类型:', Object.keys(MODEL_CONFIGS));
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('脚本执行失败:', error);
    process.exit(1);
  });
}

export {
  trainModel,
  testModel,
  generateTrainingData,
  createModel,
  MODEL_CONFIGS
};