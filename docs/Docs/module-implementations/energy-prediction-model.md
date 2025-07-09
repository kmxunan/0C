# 能源预测模型模块实现说明

## 1. 模块概述
能源预测模型模块基于TensorFlow.js构建，实现园区能源消耗的短期和中期预测，为能源调度和储能优化提供决策支持。

## 2. 技术架构
```
+---------------------+
|     数据输入层       |
|  - 历史能耗数据      |
|  - 天气数据          |
|  - 日历特征          |
+----------+----------+
           |
+----------v----------+
|     特征工程层       |
|  - 数据清洗          |
|  - 特征提取          |
|  - 归一化处理        |
+----------+----------+
           |
+----------v----------+
|     模型训练层       |
|  - LSTM网络          |
|  - XGBoost           |
|  - 模型评估          |
+----------+----------+
           |
+----------v----------+
|     预测输出层       |
|  - 短期预测（小时级）|
|  - 中期预测（日级）  |
|  - 不确定性分析      |
+---------------------+
```

## 3. 核心技术实现

### 3.1 数据预处理
```javascript
// 数据清洗函数
function cleanData(rawData) {
  // 移除异常值
  const cleaned = rawData.filter(data => {
    return data.consumption >= 0 && data.consumption <= MAX_CONSUMPTION;
  });
  
  // 时间序列对齐
  const aligned = alignTimeSeries(cleaned, 'hourly');
  
  // 缺失值填充
  const filled = fillMissingValues(aligned, 'linear');
  
  return filled;
}

// 特征工程
function extractFeatures(data) {
  // 创建时间特征
  const timeFeatures = createTimeFeatures(data.timestamp);
  
  // 创建滞后特征
  const lagFeatures = createLagFeatures(data.consumption, [1, 24, 168]);
  
  // 创建天气特征
  const weatherFeatures = getWeatherFeatures(data.date);
  
  // 组合所有特征
  return combineFeatures(timeFeatures, lagFeatures, weatherFeatures);
}

// 归一化处理
function normalizeData(data) {
  // 计算统计量
  const mean = calculateMean(data);
  const std = calculateStd(data);
  
  // 应用标准化
  const normalized = data.map(item => {
    return (item - mean) / std;
  });
  
  return { normalized, mean, std };
}
```

### 3.2 模型定义
#### 3.2.1 LSTM模型
```javascript
async function createLSTMModel(inputShape, outputUnits) {
  const model = tf.sequential();
  
  // 添加LSTM层
  model.add(tf.layers.lstm({
    units: 64,
    inputShape: inputShape,
    recurrentInitializer: 'glorotUniform'
  }));
  
  // 添加隐藏层
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  
  // 输出层
  model.add(tf.layers.dense({ units: outputUnits }));
  
  // 编译模型
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });
  
  return model;
}
```

### 3.3 预测流程
```javascript
// 单步预测函数
async function predict(model, inputData) {
  // 数据预处理
  const cleanedData = cleanData(inputData);
  const features = extractFeatures(cleanedData);
  const { normalized, mean, std } = normalizeData(features);
  
  // 数据分批
  const batches = createBatches(normalized, BATCH_SIZE);
  
  // 执行预测
  const predictions = [];
  for (const batch of batches) {
    const tensor = tf.tensor3d([batch]);
    const prediction = model.predict(tensor);
    predictions.push(...prediction.dataSync());
    prediction.dispose();
  }
  
  // 反归一化
  const denormalized = predictions.map(p => p * std + mean);
  
  // 后处理
  const result = applyPostProcessing(denormalized);
  
  return result;
}

// 预测更新循环
function startPredictionLoop() {
  setInterval(async () => {
    try {
      // 获取最新数据
      const latestData = await fetchLatestEnergyData();
      
      // 执行预测
      const forecast = await predict(model, latestData);
      
      // 存储预测结果
      await storePredictions(forecast);
      
      // 发送通知
      notifyPredictionUpdate(forecast);
    } catch (error) {
      console.error('预测失败:', error);
      handlePredictionError(error);
    }
  }, PREDICTION_INTERVAL);
}
```

## 4. 训练流程

### 4.1 模型训练
```javascript
async function trainModel(model, trainingData, epochs, validationData) {
  // 数据准备
  const { inputs, outputs } = prepareTrainingData(trainingData);
  
  // 开始训练
  const history = await model.fit(
    tf.tensor3d(inputs),
    tf.tensor2d(outputs),
    {
      epochs,
      validationData: [
        tf.tensor3d(validationData.inputs),
        tf.tensor2d(validationData.outputs)
      ],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss}`);
          reportTrainingProgress(epoch, logs);
        }
      }
    }
  );
  
  // 保存模型
  await saveModel(model, 'latest');
  
  return history;
}
```

## 5. 配置参数

| 参数 | 描述 | 默认值 |
|------|------|--------|
|模型类型|使用的预测算法|LSTM|
|预测周期|预测的时间跨度|24小时|
|训练频率|模型再训练间隔|每天|
|历史数据量|用于训练的数据量|1年|
|批次大小|训练时的批次大小|32|
|学习率|优化器的学习率|0.001|
|神经元数|LSTM层的神经元数量|64|

## 6. 监控与告警
- 实时监控预测准确率（MAE < 5%）
- 预测结果异常波动检测
- 模型性能退化检测
- 提供预测误差统计报表