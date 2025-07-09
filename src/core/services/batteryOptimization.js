// 引入必要的模块
import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';

// 储能设备状态模拟数据
const batteryStatusData = [
/* eslint-disable no-console, no-magic-numbers */
  { timestamp: '2025-06-01T00:00:00Z', soc: 0.8, power: 50, voltage: 400 },
  { timestamp: '2025-06-01T01:00:00Z', soc: 0.75, power: 60, voltage: 395 }
  // ... 更多历史数据
];

// 准备训练数据
function _prepareTrainingData(data, windowSize = 24) {
  const xs = [];
  const ys = [];

  for (let i = windowSize; i < data.length; i++) {
    const window = data.slice(i - windowSize, i).map((d) => d.soc);
    xs.push(window);
    ys.push(data[i].soc);
  }

  return {
    xs: tf.tensor2d(xs, [xs.length, windowSize]),
    ys: tf.tensor2d(ys, [ys.length, 1])
  };
}

// 创建LSTM模型

// TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

function _createModel(inputShape) {
  const model = tf.sequential();

  model.add(
    tf.layers.lstm({
      units: 64,
      inputShape,
      returnSequences: false
    })
  );

  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });

  return model;
}

// 加载训练数据
async function _loadMockTrainingData() {
  const fs = require('fs').promises;
  const csv = require('csv-parser');
  const results = [];

  try {
    const data = await fs.readFile(
      '/Users/xunan/Documents/WebStormProjects/0C/test-data/battery_data.csv',
      'utf8'
    );

    // 解析CSV数据
    return new Promise((resolve, reject) => {
      require('stream')
        .Readable.from(data)
        .pipe(csv())
        .on('data', (data) =>
          results.push({
            timestamp: data.timestamp,
            soc: parseFloat(data.soc),
            power: parseFloat(data.power),
            voltage: parseFloat(data.voltage),
            temperature: parseFloat(data.temperature)
          })
        )
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  } catch (error) {
    console.error('加载训练数据失败:', error.message);
    throw new Error('TRAINING_DATA_LOAD_FAILED');
  }
}

// 预处理数据
function preprocessTrainingData(data) {
  // 检查数据有效性
  if (!data || data.length === 0) {
    throw new Error('EMPTY_TRAINING_DATA');
  }

  // 提取特征和标签
  const features = [];
  const labels = [];

  // 使用过去24个时间步的数据预测下一个时间步的SOC
  const windowSize = 24;

  for (let i = windowSize; i < data.length; i++) {
    // 提取特征窗口
    const window = data.slice(i - windowSize, i);
    const featureRow = [];

    // 为每个时间步提取特征
    window.forEach((point) => {
      featureRow.push(point.soc);
      featureRow.push(point.power);
      featureRow.push(point.voltage);
      featureRow.push(point.temperature);
    });

    features.push(featureRow);
    labels.push([data[i].soc]); // 预测下一个时间步的SOC
  }

  // 数据归一化
  const featureTensor = tf.tensor2d(features);
  const labelTensor = tf.tensor2d(labels);

  // 计算特征的均值和标准差
  const featureMean = featureTensor.mean(0);
  const featureStd = featureTensor.std(0);

  // 标准化特征 (避免除以零)
  const epsilon = 1e-8;
  const normalizedFeatures = featureTensor.sub(featureMean).div(featureStd.add(epsilon));

  // 保存归一化参数供推理时使用
  // 保存归一化参数供推理时使用
  (async () => {
    global.batteryModelStats = {
      mean: await featureMean.array(),
      std: await featureStd.array()
    };
  })();

  return {
    features: normalizedFeatures,
    labels: labelTensor
  };
}

// 训练储能优化模型
export async function trainModel() {
  try {
    // 加载训练数据
    const data = await loadTrainingData();

    // 预处理数据
    const { features, labels } = preprocessTrainingData(data);

    // 创建模型
    const model = createBatteryOptimizationModel();

    // 训练模型
    await trainBatteryOptimizationModel(model, features, labels);

    // 保存模型
    await saveModel(model);
  } catch (error) {
    console.error('模型训练失败:', error.message);
    throw error;
  }
}

// 创建储能优化路由
export function setupBatteryRoutes(app, authenticateToken) {
  // 储能优化接口
  app.get('/battery/optimization', authenticateToken(), async (req, res) => {
    try {
      // 获取查询参数
      const { buildingId, start_time, end_time, interval } = req.query;

      // 参数验证
      if (!buildingId) {
        return res.status(400).json({
          error: {
            code: 'MISSING_BUILDING_ID',
            message: '缺少必要参数: buildingId'
          }
        });
      }

      if (!start_time || !end_time) {
        return res.status(400).json({
          error: {
            code: 'INVALID_TIME_RANGE',
            message: '缺少必要时间参数: start_time, end_time'
          }
        });
      }

      // 调用优化模型 - 暂时返回模拟数据
      const optimization = {
        buildingId,
        timeRange: { start_time, end_time },
        interval: interval || '1h',
        strategies: [
          {
            timestamp: start_time,
            strategy: 'charge',
            description: `建议在低电价时段充电`,
            priority: 8,
            economicImpact: '预计节省成本: 50元',
            carbonImpact: '预计减少碳排放: 25kgCO2'
          }
        ],
        summary: {
          totalSavings: 150,
          carbonReduction: 75,
          efficiency: 0.92
        }
      };

      // 返回优化结果
      res.json(optimization);
    } catch (error) {
      console.error('储能优化错误:', error);

      // 如果已经是特定错误响应，直接返回
      if (error.code && error.message) {
        return res.status(500).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.stack
          }
        });
      }

      // 否则返回通用错误
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '储能优化失败',
          details: error.message
        }
      });
    }
  });

  // 返回app对象以便链式调用
  return app;
}

// 获取电价数据
async function getElectricityPrices(startTime, endTime) {
  try {
    // 实际应用中应从API获取实时电价数据
    // 此处使用模拟数据
    const prices = [];
    const start = new Date(startTime);
    const end = new Date(endTime);

    // 生成每小时电价 (0.5-1.5元/度)
    for (let d = new Date(start); d <= new Date(end); d.setHours(d.getHours() + 1)) {
      const hour = d.getHours();
      // 模拟峰谷电价: 峰时(8-22点)高价，谷时(22-8点)低价
      const price =
        hour >= 8 && hour <= 22
          ? 1.2 + Math.random() * 0.3 // 峰时: 1.2-1.5元
          : 0.5 + Math.random() * 0.3; // 谷时: 0.5-0.8元

      prices.push({
        timestamp: d.toISOString(),
        price: parseFloat(price.toFixed(2))
      });
    }
    return prices;
  } catch (error) {
    console.error('获取电价数据失败:', error.message);
    return [];
  }
}

// 获取碳排放因子数据
async function getCarbonIntensity(startTime, endTime) {
  try {
    // 实际应用中应从API获取实时碳排放因子数据
    // 此处使用模拟数据
    const intensities = [];
    const start = new Date(startTime);
    const end = new Date(endTime);

    // 生成每小时碳排放因子 (300-800 gCO2/kWh)
    for (let d = new Date(start); d <= new Date(end); d.setHours(d.getHours() + 1)) {
      const hour = d.getHours();
      // 模拟碳排放因子变化
      const intensity =
        500 + Math.sin((hour / 24) * Math.PI * 2) * 150 + (Math.random() * 100 - 50);

      intensities.push({
        timestamp: d.toISOString(),
        intensity: parseFloat(intensity.toFixed(0))
      });
    }
    return intensities;
  } catch (error) {
    console.error('获取碳排放因子数据失败:', error.message);
    return [];
  }
}

// 计算充放电成本效益
function calculateCostBenefit(soc, price, carbonIntensity, currentState) {
  // 电池参数
  const batteryCapacity = 1000; // 电池容量 kWh
  const chargeEfficiency = 0.9; // 充电效率
  const dischargeEfficiency = 0.9; // 放电效率
  const carbonPrice = 0.05; // 碳价 元/gCO2

  // 计算潜在收益
  if (currentState === 'low' || soc < 0.3) {
    // 需要充电时，计算成本
    const requiredEnergy = batteryCapacity * (0.8 - soc);
    const actualEnergyNeeded = requiredEnergy / chargeEfficiency;
    const cost = actualEnergyNeeded * price;
    const carbonEmission = actualEnergyNeeded * carbonIntensity;
    const carbonCost = carbonEmission * carbonPrice;
    const totalCost = cost + carbonCost;

    return {
      action: 'charge',
      cost: totalCost,
      carbonEmission,
      benefitScore: price < 0.7 ? 8 : price < 0.9 ? 5 : 2 // 价格越低，充电收益越高
    };
  } else if (currentState === 'high' || soc > 0.7) {
    // 需要放电时，计算收益
    const availableEnergy = batteryCapacity * (soc - 0.2);
    const actualEnergyAvailable = availableEnergy * dischargeEfficiency;
    const revenue = actualEnergyAvailable * price;
    const carbonReduction = actualEnergyAvailable * carbonIntensity;
    const carbonBenefit = carbonReduction * carbonPrice;
    const totalBenefit = revenue + carbonBenefit;

    return {
      action: 'discharge',
      benefit: totalBenefit,
      carbonReduction,
      benefitScore: price > 1.2 ? 9 : price > 1.0 ? 6 : 3 // 价格越高，放电收益越高
    };
  }

  return { action: 'none', benefitScore: 0 };
}

// 生成优化策略
async function _generateOptimizationStrategies(
  predictions,
  interval,
  buildingId,
  startTime,
  endTime
) {
  if (!predictions || predictions.length === 0) {
    throw new Error('无效的预测数据');
  }

  if (!interval || typeof interval !== 'string') {
    interval = '1h'; // 默认间隔为1小时
  }

  // 获取电价和碳排放因子数据
  const [electricityPrices, carbonIntensities] = await Promise.all([
    getElectricityPrices(startTime, endTime),
    getCarbonIntensity(startTime, endTime)
  ]);

  const strategies = [];
  let currentState = 'normal';

  try {
    predictions.forEach((soc, index) => {
      if (typeof soc !== 'number') {
        throw new Error(`无效的预测值在索引 ${index}: ${soc}`);
      }

      const timestamp = calculatePredictionTime(index, interval);
      // 查找对应时间的电价和碳排放因子
      const priceData = electricityPrices.find((p) => p.timestamp === timestamp);
      const carbonData = carbonIntensities.find((c) => c.timestamp === timestamp);
      const price = priceData ? priceData.price : 0.8;
      const carbonIntensity = carbonData ? carbonData.intensity : 500;

      // 计算成本效益
      const costBenefit = calculateCostBenefit(soc, price, carbonIntensity, currentState);

      // 根据SOC值和成本效益生成优化策略
      if (soc < 0.2 || (soc < 0.3 && costBenefit.benefitScore > 7)) {
        strategies.push({
          timestamp,
          strategy: 'charge',
          description: `电池${buildingId}电量过低(${soc.toFixed(2)}), 建议充电。当前电价: ${price.toFixed(2)}元/度, 碳排放因子: ${carbonIntensity}gCO2/kWh`,
          priority: costBenefit.benefitScore,
          economicImpact: `预计成本: ${costBenefit.cost ? costBenefit.cost.toFixed(2) : 'N/A'}元`,
          carbonImpact: `预计碳排放: ${costBenefit.carbonEmission ? costBenefit.carbonEmission.toFixed(2) : 'N/A'}gCO2`
        });
        currentState = 'low';
      } else if (soc > 0.8 || (soc > 0.7 && costBenefit.benefitScore > 7)) {
        strategies.push({
          timestamp,
          strategy: 'discharge',
          description: `电池${buildingId}电量过高(${soc.toFixed(2)}), 建议放电。当前电价: ${price.toFixed(2)}元/度, 碳排放因子: ${carbonIntensity}gCO2/kWh`,
          priority: costBenefit.benefitScore,
          economicImpact: `预计收益: ${costBenefit.benefit ? costBenefit.benefit.toFixed(2) : 'N/A'}元`,
          carbonImpact: `预计碳减排: ${costBenefit.carbonReduction ? costBenefit.carbonReduction.toFixed(2) : 'N/A'}gCO2`
        });
        currentState = 'high';
      } else if (currentState === 'low' && soc > 0.5) {
        strategies.push({
          timestamp,
          strategy: 'stop_charge',
          description: `电池${buildingId}电量已恢复(${soc.toFixed(2)}), 停止充电`,
          priority: 2,
          economicImpact: '无额外成本'
        });
        currentState = 'normal';
      } else if (currentState === 'high' && soc < 0.6) {
        strategies.push({
          timestamp,
          strategy: 'stop_discharge',
          description: `电池${buildingId}电量已恢复(${soc.toFixed(2)}), 停止放电`,
          priority: 2,
          economicImpact: '无额外收益'
        });
        currentState = 'normal';
      } else if (index % 24 === 0) {
        strategies.push({
          timestamp,
          strategy: 'maintenance',
          description: `电池${buildingId}每日状态维护检查`,
          priority: 3
        });
      }
    });
  } catch (error) {
    console.error(`生成优化策略失败: ${error.message}`);
    throw error;
  }

  // 按优先级排序
  return strategies.sort((a, b) => a.priority - b.priority);
}

// 准备预测输入数据
function _preparePredictionInput(data, _windowSize = 24) {
  if (!data || data.length === 0) {
    throw new Error('无效的历史数据');
  }

  try {
    // 确保数据按时间排序
    const sortedData = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 提取SOC值并进行归一化
    const socValues = sortedData.map((d) => d.soc);

    // 如果数据不足一个窗口，则使用所有可用数据
    const windowSize = 24; // 使用明确的窗口大小
    const inputData = socValues.slice(-windowSize);

    // 数据归一化（确保值在0-1之间）
    const normalized = normalizeData(inputData);

    // 创建张量
    const tensor = tf.tensor2d([normalized], [1, normalized.length]);

    // 验证张量形状
    if (tensor.shape[1] !== windowSize) {
      throw new Error(`输入数据形状不匹配: 需要${windowSize}个时间步，但得到${tensor.shape[1]}个`);
    }

    return tensor;
  } catch (error) {
    console.error(`准备预测输入失败: ${error.message}`);
    throw error;
  }
}

// 数据归一化
function normalizeData(data) {
  const max = Math.max(...data);
  return data.map((value) => value / max);
}

// 计算预测时间
function calculatePredictionTime(baseTime, index, interval) {
  const intervalMap = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000
  };

  // 如果没有提供基准时间，使用当前时间
  const baseTimestamp = baseTime ? new Date(baseTime).getTime() : Date.now();

  if (isNaN(baseTimestamp)) {
    throw new Error(`无效的基准时间: ${baseTime}`);
  }

  const intervalMs = intervalMap[interval] || intervalMap['1h'];
  const ms = baseTimestamp + (index + 1) * intervalMs;

  return new Date(ms).toISOString();
}

// 获取历史储能数据（模拟）
function _getHistoricalBatteryData(start_time, end_time, buildingId) {
  if (!start_time || !end_time) {
    throw new Error('必须提供开始时间和结束时间');
  }

  // 验证时间格式
  if (isNaN(Date.parse(start_time)) || isNaN(Date.parse(end_time))) {
    throw new Error('无效的时间格式，应使用ISO 8601格式');
  }

  if (buildingId && typeof buildingId !== 'string') {
    throw new Error('buildingId必须是字符串');
  }

  return new Promise((resolve, reject) => {
    try {
      // 在实际应用中，这里应该查询数据库
      // 并根据buildingId、start_time和end_time过滤数据
      const filteredData = batteryStatusData.filter((dataPoint) => {
        const timestamp = new Date(dataPoint.timestamp).getTime();
        return (
          timestamp >= new Date(start_time).getTime() && timestamp <= new Date(end_time).getTime()
        );
      });

      resolve(filteredData);
    } catch (error) {
      reject(new Error(`获取历史数据失败: ${error.message}`));
    }
  });
}

// 模拟加载训练数据
async function loadTrainingData() {
  // 在实际应用中，这里应该从数据库或API获取数据
  return new Promise((resolve) => {
    resolve(batteryStatusData);
  });
}

// 预处理数据
function _preprocessPredictionData(data) {
  const _windowSize = 24;
  const xs = [];
  const ys = [];

  for (let i = _windowSize; i < data.length; i++) {
    const window = data.slice(i - _windowSize, i).map((d) => d.soc);
    xs.push(window);
    ys.push(data[i].soc);
  }

  return {
    features: tf.tensor2d(xs, [xs.length, _windowSize]),
    labels: tf.tensor2d(ys, [ys.length, 1])
  };

  // TODO: 考虑将此函数拆分为更小的函数 (当前 42 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 45 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 48 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 51 行)
}

// 创建储能优化模型
function createBatteryOptimizationModel() {
  // 输入形状: [时间窗口大小, 特征数量]
  // 时间窗口大小为24, 每个时间步有4个特征(soc, power, voltage, temperature)
  const inputShape = [24, 4];

  const model = tf.sequential();

  // 第一层LSTM
  model.add(
    tf.layers.lstm({
      units: 64,
      inputShape,
      returnSequences: true,
      recurrentDropout: 0.2
    })
  );

  // 第二层LSTM
  model.add(
    tf.layers.lstm({
      units: 32,
      returnSequences: false,
      recurrentDropout: 0.2
    })
  );

  // 全连接层
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.3 }));

  // 输出层 - 预测SOC值
  model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

  // 编译模型
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanAbsoluteError',
    metrics: ['mse']

    // TODO: 考虑将此函数拆分为更小的函数 (当前 42 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 42 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 42 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 42 行)
  });

  return model;
}

// 训练储能优化模型
async function trainBatteryOptimizationModel(model, features, labels) {
  // 划分训练集和验证集 (80%训练, 20%验证)
  const trainSize = Math.floor(features.shape[0] * 0.8);
  const trainFeatures = features.slice([0, 0], [trainSize, -1]);
  const trainLabels = labels.slice([0, 0], [trainSize, -1]);
  const valFeatures = features.slice([trainSize, 0], [-1, -1]);
  const valLabels = labels.slice([trainSize, 0], [-1, -1]);

  // 重塑特征以适应LSTM输入形状 [样本数, 时间步, 特征数]
  const reshapedTrainFeatures = trainFeatures.reshape([trainFeatures.shape[0], 24, 4]);
  const reshapedValFeatures = valFeatures.reshape([valFeatures.shape[0], 24, 4]);

  // 设置训练参数
  const batchSize = 32;
  const epochs = 50;

  // 训练模型
  const history = await model.fit(reshapedTrainFeatures, trainLabels, {
    batchSize,
    epochs,
    validationData: [reshapedValFeatures, valLabels],
    callbacks: {
      earlyStopping: {
        monitor: 'val_loss',
        patience: 5,
        restoreBestWeights: true
      },
      reduceLROnPlateau: {
        monitor: 'val_loss',
        factor: 0.5,
        patience: 3,
        minLearningRate: 0.0001
      }
    }
  });

  console.log(
    '模型训练完成，最终验证损失:',
    history.history.val_loss[history.history.val_loss.length - 1]
  );
  return model;
}

// 保存模型
async function saveModel(model) {
  try {
    // 创建模型保存目录
    const modelDir = '/Users/xunan/Documents/WebStormProjects/0C/models/battery-optimization';
    await fs.mkdir(modelDir, { recursive: true });

    // 保存模型
    await model.save(`file://${modelDir}`);
    console.log('模型已成功保存到:', modelDir);

    // 保存归一化参数
    await fs.writeFile(
      `${modelDir}/normalization-stats.json`,
      JSON.stringify(global.batteryModelStats, null, 2)
    );
  } catch (error) {
    console.error('保存模型失败:', error.message);
    throw new Error('MODEL_SAVE_FAILED');
  }
}
