# 碳排放计算模块实现说明

## 1. 模块概述
碳排放计算模块负责根据能源消耗数据和碳因子数据库，实时计算园区的碳排放量，为减排决策提供数据支持。

## 2. 计算模型

### 2.1 基本公式
$$ E = \sum_{i=1}^{n}(C_i \times EF_i) $$

其中：
- E: 总碳排放量（kgCO₂）
- Cᵢ: 第i种能源的消耗量
- EFᵢ: 第i种能源的碳排放因子

## 3. 系统架构
```
+---------------------+
|     数据输入层       |
|  - 能源消耗数据      |
|  - 碳因子数据库      |
+----------+----------+
           |
+----------v----------+
|     计算引擎层       |
|  - 实时计算          |
|  - 历史计算          |
|  - 趋势预测          |
+----------+----------+
           |
+----------v----------+
|     结果输出层       |
|  - 总量统计          |
|  - 强度分析          |
|  - 明细展示          |
+---------------------+
```

## 4. 核心功能实现

### 4.1 碳因子管理
```javascript
// 碳因子数据结构
const carbonFactors = {
  electricity: {
    value: 0.997, // kgCO₂/kWh
    source: 'IPCC 2021',
    lastUpdated: '2023-06-01'
  },
  diesel: {
    value: 2.68, // kgCO₂/L
    source: 'EPA 2022',
    lastUpdated: '2023-05-15'
  },
  naturalGas: {
    value: 1.89, // kgCO₂/m³
    source: 'IEA 2023',
    lastUpdated: '2023-04-20'
  }
};

// 获取碳因子函数
function getCarbonFactor(energyType) {
  const factor = carbonFactors[energyType];
  if (!factor) {
    throw new Error(`未知能源类型: ${energyType}`);
  }
  
  // 检查因子有效性（更新时间在一年内）
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (new Date(factor.lastUpdated) < oneYearAgo) {
    console.warn(`${energyType} 的碳因子数据已过期，请更新`);
  }
  
  return factor.value;
}
```

### 4.2 碳排放计算
```javascript
// 实时计算函数
function calculateEmission实时计算(energyData) {
  let totalEmission = 0;
  
  energyData.forEach(data => {
    const factor = getCarbonFactor(data.type);
    const emission = data.consumption * factor;
    totalEmission += emission;
    
    // 存储明细数据
    storeEmissionDetail({
      timestamp: data.timestamp,
      energyType: data.type,
      consumption: data.consumption,
      carbonFactor: factor,
      emission: emission
    });
  });
  
  return {
    timestamp: Date.now(),
    totalEmission: totalEmission,
    details: getEmissionDetails()
  };
}

// 批量历史计算函数
async function calculateHistoricalEmissions(startDate, endDate) {
  const energyData = await fetchEnergyData(startDate, endDate);
  const results = [];
  
  for (let i = 0; i < energyData.length; i += BATCH_SIZE) {
    const batch = energyData.slice(i, i + BATCH_SIZE);
    const result = calculateEmissionBatch(batch);
    results.push(...result);
    
    // 进度报告
    reportProgress((i / energyData.length) * 100);
  }
  
  return results;
}
```

## 5. 配置参数

| 参数 | 描述 | 默认值 |
|------|------|--------|
|计算间隔|实时计算的触发间隔|1分钟|
|批量大小|历史计算的批处理大小|1000条|
|超时时间|单次计算的最大允许时间|30秒|
|最大延迟|允许的最大计算延迟|5分钟|

## 6. 监控与告警
- 实时监控计算成功率
- 计算结果异常波动检测
- 碳因子数据过期提醒
- 提供碳排放统计报表