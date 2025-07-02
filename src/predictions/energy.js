import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tf = require('@tensorflow/tfjs-node');

// 模拟历史能源数据
const historicalEnergyData = [
  { timestamp: '2025-06-01T00:00:00Z', value: 1200, type: 'electricity' },
  { timestamp: '2025-06-01T01:00:00Z', value: 1100, type: 'electricity' },
  // ... 更多历史数据
];

// 准备训练数据
function prepareTrainingData(data, windowSize = 24) {
  const xs = [];
  const ys = [];
  
  for (let i = windowSize; i < data.length; i++) {
    const window = data.slice(i - windowSize, i).map(d => d.value);
    xs.push(window);
    ys.push(data[i].value);
  }
  
  return {
    xs: tf.tensor2d(xs, [xs.length, windowSize]),
    ys: tf.tensor2d(ys, [ys.length, 1])
  };
}

// 创建LSTM模型
function createModel(inputShape) {
  const model = tf.sequential();
  
  model.add(tf.layers.lstm({
    units: 64,
    inputShape: inputShape,
    returnSequences: false
  }));
  
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });
  
  return model;
}

// 训练模型
async function trainModel() {
  try {
    // 准备训练数据
    const { xs, ys } = prepareTrainingData(historicalEnergyData);
    
    // 创建模型
    const model = createModel([xs.shape[1], 1]);
    
    // 训练模型
    await model.fit(xs, ys, {
      epochs: 100,
      batchSize: 32,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss}`);
        }
      }
    });
    
    // 保存模型
    await model.save('file://./models/energy-prediction');
    console.log('能源预测模型训练完成并已保存');
  } catch (error) {
    console.error('模型训练失败:', error.message);
  }
}

// 创建能源预测路由
function setupEnergyRoutes(app, authenticateToken) {
  // 能源消耗预测接口
  app.get('/energy/predict', authenticateToken, async (req, res) => {
    try {
      // 获取查询参数
      const { buildingId, days } = req.query;
      
      if (!buildingId || !days) {
        res.status(400).json({ error: '缺少必要参数' });
        return;
      }
      
      // 调用预测模型
      const prediction = await predictEnergyConsumption(buildingId, parseInt(days));
      
      // 返回预测结果
      res.json(prediction);
    } catch (error) {
      console.error('能源预测错误:', error);
      res.status(500).json({ error: '能源预测失败' });
    }
  });
  
  // 返回app对象以便链式调用
  return app;
}

// 准备预测输入数据
function preparePredictionInput(data) {
  // 实际开发中需要将历史数据转换为模型输入格式
  const normalized = normalizeData(data.map(d => d.value));
  return tf.tensor2d([normalized], [1, normalized.length]);
}

// 数据归一化
function normalizeData(data) {
  const max = Math.max(...data);
  return data.map(value => value / max);
}

// 计算预测时间
function calculatePredictionTime(index, interval) {
  const intervalMap = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000
  };
  
  const ms = new Date().getTime() + (index + 1) * (intervalMap[interval] || intervalMap['1h']);
  return new Date(ms).toISOString();
}

// 获取历史能源数据（模拟）
function getHistoricalEnergyData(device_id, start_time, end_time) {
  // 实际开发中应从数据库查询数据
  return new Promise(resolve => {
    resolve(historicalEnergyData);
  });
}

// 导出能源预测功能
export { setupEnergyRoutes };