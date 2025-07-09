# 零碳园区数字孪生系统六大核心模块API文档

版本：V2.0  
更新时间：2025年6月10日  
状态：✅ 已完成实现

## 📋 文档概述

本文档详细描述了零碳园区数字孪生系统六大核心模块的API接口，这些模块完全对标国家《关于开展零碳园区建设的通知》要求，为园区申报验收提供数据支撑。

### 🎯 核心模块列表

1. **能碳一体化监测与核算中心** - 对标任务七
2. **用能结构转型与优化调度中心** - 对标任务一  
3. **企业节能降碳与对标诊断中心** - 对标任务二
4. **资源循环利用与固废追溯中心** - 对标任务三
5. **虚拟电厂运营与交易中心** - 对标任务四
6. **数据资产目录与标准化管理中心** - 数据治理核心

## 🏗️ API架构设计

### 基础URL
```
生产环境: https://api.zero-carbon-park.com/v2
开发环境: http://localhost:1125/api/v2
```

### 认证方式
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-01-10T10:00:00Z",
  "requestId": "req_123456789"
}
```

## 1️⃣ 能碳一体化监测与核算中心

### 1.1 碳排放实时核算引擎

#### 获取园区总碳排放量
```http
GET /carbon-accounting/total-emissions
```

**查询参数：**
- `timeRange`: 时间范围 (hour|day|month|year)
- `startDate`: 开始日期 (ISO 8601)
- `endDate`: 结束日期 (ISO 8601)
- `includeBreakdown`: 是否包含分项排放 (boolean)

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalEmissions": 12580.5,
    "unit": "tCO2",
    "period": "2025-01-01 to 2025-01-10",
    "breakdown": {
      "energyActivities": 8960.3,
      "industrialProcesses": 3620.2
    },
    "nationalIndicators": {
      "carbonIntensityPerEnergy": 0.25,
      "targetValue": 0.3,
      "complianceStatus": "达标"
    }
  }
}
```

#### 实时碳排放计算
```http
POST /carbon-accounting/calculate-realtime
```

**请求体：**
```json
{
  "energyData": {
    "coal": 150.5,
    "naturalGas": 89.2,
    "electricity": 2580.0
  },
  "productionData": {
    "cement": 1200.0,
    "steel": 800.0
  },
  "calculationMethod": "national_standard"
}
```

### 1.2 园区能流全景图

#### 获取能源流向数据
```http
GET /energy-flow/sankey-data
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {"id": "grid_power", "name": "电网供电", "type": "source"},
      {"id": "solar_pv", "name": "光伏发电", "type": "renewable"},
      {"id": "enterprise_a", "name": "企业A", "type": "consumer"}
    ],
    "links": [
      {"source": "grid_power", "target": "enterprise_a", "value": 1500.0, "unit": "kWh"},
      {"source": "solar_pv", "target": "enterprise_a", "value": 800.0, "unit": "kWh"}
    ],
    "metadata": {
      "totalInput": 2300.0,
      "totalOutput": 2280.0,
      "efficiency": 99.1
    }
  }
}
```

### 1.3 国家指标体系监测

#### 获取核心指标实时状态
```http
GET /national-indicators/core-metrics
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "carbonIntensityPerEnergy": {
      "value": 0.25,
      "unit": "tCO2/tce",
      "target": 0.3,
      "status": "达标",
      "trend": "下降"
    },
    "cleanEnergyRatio": {
      "value": 92.5,
      "unit": "%",
      "target": 90.0,
      "status": "达标",
      "trend": "上升"
    },
    "lastUpdated": "2025-01-10T10:00:00Z"
  }
}
```

## 2️⃣ 用能结构转型与优化调度中心

### 2.1 绿电溯源与绿证管理

#### 获取绿电消费明细
```http
GET /green-electricity/consumption-details
```

**查询参数：**
- `enterpriseId`: 企业ID
- `timeRange`: 时间范围
- `electricityType`: 电力类型 (grid|green_trade|direct_supply)

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalConsumption": 5800.0,
    "breakdown": {
      "gridElectricity": 2200.0,
      "greenTradeElectricity": 2100.0,
      "directSupplyGreen": 1500.0
    },
    "greenCertificates": [
      {
        "certificateId": "GC202501001",
        "amount": 1000.0,
        "source": "风电场A",
        "status": "已核销"
      }
    ],
    "greenRatio": 62.1
  }
}
```

### 2.2 多能互补仿真优化

#### 能源配置仿真
```http
POST /energy-optimization/simulation
```

**请求体：**
```json
{
  "scenario": {
    "solarPV": {"capacity": 5000, "unit": "kW"},
    "windPower": {"capacity": 3000, "unit": "kW"},
    "energyStorage": {"capacity": 2000, "unit": "kWh"}
  },
  "simulationPeriod": "1year",
  "objectives": ["cost_minimization", "carbon_reduction"]
}
```

## 3️⃣ 企业节能降碳与对标诊断中心

### 3.1 企业能效对标分析

#### 获取企业能效雷达图数据
```http
GET /enterprise-diagnosis/energy-efficiency-radar/{enterpriseId}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "enterpriseInfo": {
      "id": "ENT001",
      "name": "钢铁企业A",
      "industry": "钢铁冶炼"
    },
    "radarData": {
      "energyIntensity": {
        "current": 580.5,
        "benchmark": 520.0,
        "advanced": 480.0,
        "level": "二级"
      },
      "carbonIntensity": {
        "current": 1.85,
        "benchmark": 1.65,
        "advanced": 1.45,
        "level": "准入"
      }
    },
    "recommendations": [
      "建议更新高效电机设备",
      "优化生产工艺流程"
    ]
  }
}
```

### 3.2 重点用能设备档案

#### 获取设备运行状态
```http
GET /equipment-archives/operational-status
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "equipmentList": [
      {
        "id": "BOILER001",
        "name": "锅炉#1",
        "type": "燃气锅炉",
        "efficiency": 85.2,
        "loadRate": 78.5,
        "healthScore": 92,
        "status": "正常运行",
        "energyStandard": "一级能效"
      }
    ],
    "summary": {
      "totalEquipment": 156,
      "normalOperation": 148,
      "needMaintenance": 6,
      "offline": 2
    }
  }
}
```

## 4️⃣ 资源循环利用与固废追溯中心

### 4.1 固废全生命周期追溯

#### 获取固废流向追溯
```http
GET /waste-tracing/lifecycle/{wasteId}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "wasteInfo": {
      "id": "WASTE202501001",
      "type": "工业固废",
      "category": "一般固废",
      "amount": 15.8,
      "unit": "吨"
    },
    "lifecycle": [
      {
        "stage": "产生",
        "enterprise": "化工企业B",
        "timestamp": "2025-01-01T08:00:00Z",
        "amount": 15.8
      },
      {
        "stage": "收集",
        "operator": "环保公司C",
        "timestamp": "2025-01-01T14:00:00Z",
        "amount": 15.8
      },
      {
        "stage": "处置",
        "facility": "资源化利用厂D",
        "timestamp": "2025-01-02T09:00:00Z",
        "amount": 15.8,
        "method": "资源化利用"
      }
    ],
    "utilizationRate": 100.0
  }
}
```

### 4.2 循环经济效益评估

#### 获取循环经济指标
```http
GET /circular-economy/indicators
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "wasteUtilizationRate": 95.2,
    "waterReuseRate": 88.7,
    "heatRecoveryRate": 76.3,
    "carbonReductionContribution": 2580.5,
    "economicBenefit": {
      "costSaving": 1250000,
      "revenueGeneration": 850000,
      "unit": "CNY"
    }
  }
}
```

## 5️⃣ 虚拟电厂运营与交易中心

### 5.1 分布式能源聚合管理

#### 获取VPP资源池状态
```http
GET /virtual-power-plant/resource-pool
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalCapacity": 25000,
    "availableCapacity": 18500,
    "resources": {
      "solarPV": {"capacity": 12000, "available": 9500},
      "energyStorage": {"capacity": 8000, "available": 6000},
      "adjustableLoad": {"capacity": 5000, "available": 3000}
    },
    "responseTime": "<5min",
    "sustainableDuration": "2-4hours"
  }
}
```

### 5.2 电力市场交易策略

#### 获取交易策略建议
```http
GET /power-trading/strategy-recommendation
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "marketConditions": {
      "spotPrice": 0.45,
      "ancillaryServicePrice": 0.12,
      "demandForecast": "高"
    },
    "recommendations": [
      {
        "action": "参与调频服务",
        "capacity": 5000,
        "expectedRevenue": 15000,
        "riskLevel": "低"
      }
    ],
    "optimizedSchedule": {
      "charge": ["02:00-06:00"],
      "discharge": ["18:00-22:00"],
      "standby": ["06:00-18:00"]
    }
  }
}
```

## 6️⃣ 数据资产目录与标准化管理中心

### 6.1 数据资产目录管理

#### 获取数据资产清单
```http
GET /data-assets/catalog
```

**查询参数：**
- `category`: 数据类别 (energy|carbon|production|resource)
- `dataLevel`: 数据级别 (raw|processed|aggregated)
- `updateFrequency`: 更新频率 (realtime|hourly|daily)

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalAssets": 1256,
    "categories": {
      "energy": 456,
      "carbon": 298,
      "production": 312,
      "resource": 190
    },
    "assets": [
      {
        "id": "DA_ENERGY_001",
        "name": "企业电力消耗数据",
        "category": "energy",
        "source": "智能电表",
        "updateFrequency": "realtime",
        "dataQuality": 98.5,
        "lastUpdated": "2025-01-10T10:00:00Z"
      }
    ]
  }
}
```

### 6.2 申报验收支撑系统

#### 生成申报材料
```http
POST /declaration-support/generate-report
```

**请求体：**
```json
{
  "reportType": "national_indicator_report",
  "timeRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "includeAttachments": true,
  "format": "pdf"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "reportId": "RPT_20250110_001",
    "downloadUrl": "/downloads/reports/national_indicator_2024.pdf",
    "summary": {
      "carbonIntensityPerEnergy": 0.25,
      "cleanEnergyRatio": 92.5,
      "complianceStatus": "全部达标"
    },
    "generatedAt": "2025-01-10T10:00:00Z",
    "validUntil": "2025-01-17T10:00:00Z"
  }
}
```

## 🔧 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "参数验证失败",
    "details": "时间范围不能超过1年"
  },
  "timestamp": "2025-01-10T10:00:00Z",
  "requestId": "req_123456789"
}
```

### 常见错误码
- `INVALID_PARAMETER`: 参数验证失败
- `UNAUTHORIZED`: 认证失败
- `FORBIDDEN`: 权限不足
- `NOT_FOUND`: 资源不存在
- `RATE_LIMIT_EXCEEDED`: 请求频率超限
- `INTERNAL_ERROR`: 服务器内部错误

## 📊 性能指标

- **API响应时间**: ≤200ms (95%请求)
- **数据实时性**: ≤1秒延迟
- **并发支持**: ≥100用户
- **可用性**: 99.9%
- **数据准确性**: ≥99.9%

## 🔐 安全特性

- JWT Token认证
- RBAC权限控制
- API请求频率限制
- 数据传输HTTPS加密
- 敏感数据脱敏处理

## 📞 技术支持

- **API文档**: 实时更新，支持在线测试
- **SDK支持**: 提供JavaScript、Python、Java SDK
- **技术支持**: 7x24小时技术支持
- **问题反馈**: GitHub Issues或技术支持邮箱

---

**文档版本**: V2.0  
**最后更新**: 2025年6月10日  
**维护团队**: 零碳园区数字孪生系统开发团队