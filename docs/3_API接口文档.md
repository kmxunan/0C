# 零碳园区数字孪生系统 - API接口文档

## API概览

零碳园区数字孪生系统提供RESTful API接口，支持前后端分离架构。API采用统一的响应格式、版本控制、认证授权和限流机制，确保接口的安全性和稳定性。

### API特性

- **RESTful设计**：遵循REST架构风格
- **统一响应格式**：标准化的JSON响应结构
- **版本控制**：支持API版本管理
- **JWT认证**：基于令牌的身份认证
- **限流控制**：防止API滥用
- **实时通信**：WebSocket支持实时数据推送

### 基础信息

- **Base URL**: `http://localhost:1125/api/v1`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 认证接口

### 用户登录

**接口路径**: `POST /auth/login`

**接口描述**: 用户登录认证，获取访问令牌

**请求参数**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "profile": {
        "name": "管理员",
        "avatar": "/avatars/admin.jpg"
      }
    }
  },
  "message": "登录成功"
}
```

**失败响应**:
- `400 Bad Request`: 用户名或密码错误
- `401 Unauthorized`: 账户被禁用
- `429 Too Many Requests`: 登录尝试过于频繁

### 刷新令牌

**接口路径**: `POST /auth/refresh`

**接口描述**: 使用刷新令牌获取新的访问令牌

**请求参数**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "expiresIn": 3600
  },
  "message": "令牌刷新成功"
}
```

### 用户登出

**接口路径**: `POST /auth/logout`

**接口描述**: 用户登出，使令牌失效

**请求头**:
```
Authorization: Bearer <token>
```

**成功响应**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

## 用户管理接口

### 获取用户列表

**接口路径**: `GET /users`

**接口描述**: 获取系统用户列表，支持分页和筛选

**请求参数**:
- `page` (query, number): 页码，默认1
- `limit` (query, number): 每页数量，默认20
- `role` (query, string): 角色筛选
- `status` (query, string): 状态筛选
- `search` (query, string): 搜索关键词

**成功响应**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "isActive": true,
        "profile": {
          "name": "管理员",
          "avatar": "/avatars/admin.jpg"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "lastLoginAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  },
  "message": "获取成功"
}
```

### 创建用户

**接口路径**: `POST /users`

**接口描述**: 创建新用户

**请求参数**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "operator",
  "profile": {
    "name": "新用户",
    "department": "运营部"
  }
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "operator",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "用户创建成功"
}
```

### 更新用户

**接口路径**: `PUT /users/{id}`

**接口描述**: 更新用户信息

**路径参数**:
- `id` (number): 用户ID

**请求参数**:
```json
{
  "email": "updated@example.com",
  "role": "admin",
  "profile": {
    "name": "更新后的名称"
  }
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "updated@example.com",
    "role": "admin",
    "updatedAt": "2024-01-15T11:00:00Z"
  },
  "message": "用户更新成功"
}
```

### 删除用户

**接口路径**: `DELETE /users/{id}`

**接口描述**: 删除用户（软删除）

**路径参数**:
- `id` (number): 用户ID

**成功响应**:
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

## 设备管理接口

### 获取设备列表

**接口路径**: `GET /devices`

**接口描述**: 获取园区设备列表

**请求参数**:
- `page` (query, number): 页码
- `limit` (query, number): 每页数量
- `type` (query, string): 设备类型
- `status` (query, string): 设备状态
- `location` (query, string): 设备位置

**成功响应**:
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": 1,
        "deviceId": "DEV001",
        "name": "太阳能板A1",
        "type": "solar_panel",
        "location": "屋顶区域A",
        "status": "online",
        "specifications": {
          "capacity": "10kW",
          "efficiency": "22%",
          "manufacturer": "SolarTech"
        },
        "lastSeen": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  },
  "message": "获取成功"
}
```

### 创建设备

**接口路径**: `POST /devices`

**接口描述**: 注册新设备

**请求参数**:
```json
{
  "deviceId": "DEV002",
  "name": "风力发电机B1",
  "type": "wind_turbine",
  "location": "风力发电区B",
  "specifications": {
    "capacity": "50kW",
    "rotorDiameter": "15m",
    "manufacturer": "WindPower"
  }
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "deviceId": "DEV002",
    "name": "风力发电机B1",
    "type": "wind_turbine",
    "status": "offline",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "设备创建成功"
}
```

### 获取设备详情

**接口路径**: `GET /devices/{id}`

**接口描述**: 获取设备详细信息

**路径参数**:
- `id` (number): 设备ID

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "deviceId": "DEV001",
    "name": "太阳能板A1",
    "type": "solar_panel",
    "location": "屋顶区域A",
    "status": "online",
    "specifications": {
      "capacity": "10kW",
      "efficiency": "22%",
      "manufacturer": "SolarTech"
    },
    "realTimeData": {
      "currentOutput": 8.5,
      "voltage": 380,
      "current": 22.4,
      "temperature": 45.2,
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "lastSeen": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "获取成功"
}
```

### 获取设备实时数据

**接口路径**: `GET /devices/{id}/data`

**接口描述**: 获取设备实时监测数据

**路径参数**:
- `id` (number): 设备ID

**请求参数**:
- `startTime` (query, string): 开始时间
- `endTime` (query, string): 结束时间
- `metrics` (query, string): 指标名称，多个用逗号分隔
- `interval` (query, string): 数据间隔（1m, 5m, 1h, 1d）

**成功响应**:
```json
{
  "success": true,
  "data": {
    "deviceId": "DEV001",
    "timeRange": {
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T10:00:00Z"
    },
    "metrics": {
      "power_output": [
        {
          "timestamp": "2024-01-15T09:00:00Z",
          "value": 8.2,
          "unit": "kW"
        },
        {
          "timestamp": "2024-01-15T09:05:00Z",
          "value": 8.5,
          "unit": "kW"
        }
      ],
      "temperature": [
        {
          "timestamp": "2024-01-15T09:00:00Z",
          "value": 44.8,
          "unit": "°C"
        }
      ]
    }
  },
  "message": "获取成功"
}
```

### 控制设备

**接口路径**: `POST /devices/{id}/control`

**接口描述**: 发送设备控制指令

**路径参数**:
- `id` (number): 设备ID

**请求参数**:
```json
{
  "command": "set_power_limit",
  "parameters": {
    "powerLimit": 8.0,
    "unit": "kW"
  }
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "commandId": "cmd_123456",
    "status": "sent",
    "sentAt": "2024-01-15T10:30:00Z"
  },
  "message": "控制指令发送成功"
}
```

## VPP虚拟电厂接口

### 获取VPP列表

**接口路径**: `GET /vpp`

**接口描述**: 获取虚拟电厂列表

**请求参数**:
- `page` (query, number): 页码
- `limit` (query, number): 每页数量
- `status` (query, string): VPP状态

**成功响应**:
```json
{
  "success": true,
  "data": {
    "vpps": [
      {
        "id": 1,
        "vppId": "VPP001",
        "name": "园区主VPP",
        "description": "园区主要虚拟电厂",
        "totalCapacity": 500.0,
        "status": "active",
        "resourceCount": 25,
        "currentOutput": 320.5,
        "efficiency": 85.2,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  },
  "message": "获取成功"
}
```

### 创建VPP

**接口路径**: `POST /vpp`

**接口描述**: 创建新的虚拟电厂

**请求参数**:
```json
{
  "vppId": "VPP002",
  "name": "园区备用VPP",
  "description": "园区备用虚拟电厂",
  "configuration": {
    "maxCapacity": 300.0,
    "operatingMode": "automatic",
    "priority": "medium"
  }
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "vppId": "VPP002",
    "name": "园区备用VPP",
    "status": "inactive",
    "totalCapacity": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "VPP创建成功"
}
```

### 获取VPP资源

**接口路径**: `GET /vpp/{id}/resources`

**接口描述**: 获取VPP关联的资源列表

**路径参数**:
- `id` (number): VPP ID

**成功响应**:
```json
{
  "success": true,
  "data": {
    "vppId": "VPP001",
    "resources": [
      {
        "id": 1,
        "resourceId": "RES001",
        "name": "太阳能发电组",
        "type": "solar",
        "capacity": 100.0,
        "currentOutput": 85.2,
        "allocationRatio": 0.8,
        "role": "primary",
        "status": "active"
      }
    ],
    "summary": {
      "totalResources": 25,
      "totalCapacity": 500.0,
      "currentOutput": 320.5,
      "utilizationRate": 64.1
    }
  },
  "message": "获取成功"
}
```

### 添加VPP资源

**接口路径**: `POST /vpp/{id}/resources`

**接口描述**: 向VPP添加资源

**路径参数**:
- `id` (number): VPP ID

**请求参数**:
```json
{
  "resourceId": 2,
  "allocationRatio": 0.9,
  "role": "primary"
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "associationId": 10,
    "vppId": 1,
    "resourceId": 2,
    "allocationRatio": 0.9,
    "role": "primary",
    "associatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "资源添加成功"
}
```

### 获取交易策略

**接口路径**: `GET /vpp/{id}/strategies`

**接口描述**: 获取VPP交易策略列表

**路径参数**:
- `id` (number): VPP ID

**成功响应**:
```json
{
  "success": true,
  "data": {
    "strategies": [
      {
        "id": 1,
        "strategyName": "峰谷套利策略",
        "strategyType": "arbitrage",
        "status": "active",
        "parameters": {
          "peakHours": ["09:00-12:00", "18:00-21:00"],
          "valleyHours": ["23:00-06:00"],
          "profitThreshold": 0.15
        },
        "performance": {
          "totalTrades": 156,
          "successRate": 87.2,
          "totalProfit": 12580.50
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "message": "获取成功"
}
```

### 创建交易策略

**接口路径**: `POST /vpp/{id}/strategies`

**接口描述**: 为VPP创建交易策略

**路径参数**:
- `id` (number): VPP ID

**请求参数**:
```json
{
  "strategyName": "负荷跟踪策略",
  "strategyType": "load_following",
  "parameters": {
    "responseTime": 300,
    "maxPowerChange": 50.0,
    "minRunTime": 1800
  }
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "strategyName": "负荷跟踪策略",
    "strategyType": "load_following",
    "status": "inactive",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "策略创建成功"
}
```

### 获取交易记录

**接口路径**: `GET /vpp/{id}/trades`

**接口描述**: 获取VPP交易记录

**路径参数**:
- `id` (number): VPP ID

**请求参数**:
- `startDate` (query, string): 开始日期
- `endDate` (query, string): 结束日期
- `tradeType` (query, string): 交易类型
- `status` (query, string): 交易状态

**成功响应**:
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": 1001,
        "tradeType": "sell",
        "quantity": 50.0,
        "price": 0.85,
        "totalValue": 42.50,
        "market": "spot_market",
        "status": "executed",
        "strategyId": 1,
        "strategyName": "峰谷套利策略",
        "tradeTime": "2024-01-15T09:30:00Z",
        "settlementTime": "2024-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "totalTrades": 25,
      "totalVolume": 1250.0,
      "totalValue": 1062.50,
      "averagePrice": 0.85,
      "profitLoss": 156.30
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2
    }
  },
  "message": "获取成功"
}
```

## 能源管理接口

### 获取能源概览

**接口路径**: `GET /energy/overview`

**接口描述**: 获取园区能源使用概览

**请求参数**:
- `period` (query, string): 时间周期（today, week, month, year）

**成功响应**:
```json
{
  "success": true,
  "data": {
    "period": "today",
    "consumption": {
      "total": 1250.5,
      "unit": "kWh",
      "breakdown": {
        "lighting": 320.2,
        "hvac": 580.1,
        "equipment": 350.2
      }
    },
    "production": {
      "total": 980.3,
      "unit": "kWh",
      "breakdown": {
        "solar": 650.8,
        "wind": 329.5
      }
    },
    "efficiency": {
      "selfSufficiency": 78.4,
      "energyIntensity": 0.85,
      "carbonIntensity": 0.42
    },
    "carbonEmissions": {
      "total": 525.2,
      "unit": "kg CO2",
      "reduction": 35.8
    }
  },
  "message": "获取成功"
}
```

### 获取能源预测

**接口路径**: `GET /energy/prediction`

**接口描述**: 获取能源消耗和产出预测

**请求参数**:
- `horizon` (query, string): 预测时间范围（1h, 24h, 7d, 30d）
- `type` (query, string): 预测类型（consumption, production, both）

**成功响应**:
```json
{
  "success": true,
  "data": {
    "horizon": "24h",
    "generatedAt": "2024-01-15T10:30:00Z",
    "consumption": {
      "predictions": [
        {
          "timestamp": "2024-01-15T11:00:00Z",
          "predicted": 85.2,
          "confidence": 0.92,
          "unit": "kW"
        }
      ],
      "summary": {
        "totalPredicted": 1850.5,
        "peakTime": "2024-01-15T19:00:00Z",
        "peakValue": 125.8
      }
    },
    "production": {
      "predictions": [
        {
          "timestamp": "2024-01-15T11:00:00Z",
          "predicted": 65.8,
          "confidence": 0.88,
          "unit": "kW"
        }
      ],
      "summary": {
        "totalPredicted": 1420.3,
        "peakTime": "2024-01-15T13:00:00Z",
        "peakValue": 95.2
      }
    }
  },
  "message": "获取成功"
}
```

## 区块链接口

### 获取智能合约列表

**接口路径**: `GET /blockchain/contracts`

**接口描述**: 获取已部署的智能合约列表

**成功响应**:
```json
{
  "success": true,
  "data": {
    "contracts": [
      {
        "id": 1,
        "contractName": "CarbonCreditToken",
        "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
        "network": "polygon",
        "status": "deployed",
        "deployedAt": "2024-01-01T00:00:00Z",
        "transactionCount": 156
      }
    ]
  },
  "message": "获取成功"
}
```

### 部署智能合约

**接口路径**: `POST /blockchain/contracts/deploy`

**接口描述**: 部署新的智能合约

**请求参数**:
```json
{
  "contractName": "EnergyTrading",
  "network": "polygon",
  "constructorArgs": [
    "Energy Trading Contract",
    "ETC"
  ]
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "contractId": 2,
    "contractName": "EnergyTrading",
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "status": "pending",
    "estimatedConfirmationTime": "2024-01-15T10:35:00Z"
  },
  "message": "合约部署已提交"
}
```

### 获取碳信用

**接口路径**: `GET /blockchain/carbon-credits`

**接口描述**: 获取碳信用列表

**请求参数**:
- `status` (query, string): 信用状态
- `issuer` (query, string): 发行方

**成功响应**:
```json
{
  "success": true,
  "data": {
    "credits": [
      {
        "id": 1,
        "creditId": "CC001",
        "amount": 100.0,
        "unit": "tCO2",
        "issuer": "Green Energy Corp",
        "status": "active",
        "blockchainTx": "0x1234...5678",
        "issuedAt": "2024-01-01T00:00:00Z",
        "expiresAt": "2025-01-01T00:00:00Z"
      }
    ],
    "summary": {
      "totalCredits": 500.0,
      "activeCredits": 450.0,
      "retiredCredits": 50.0
    }
  },
  "message": "获取成功"
}
```

## 数据分析接口

### 获取数据质量报告

**接口路径**: `GET /analytics/data-quality`

**接口描述**: 获取数据质量分析报告

**成功响应**:
```json
{
  "success": true,
  "data": {
    "overall": {
      "score": 92.5,
      "grade": "A",
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "metrics": {
      "completeness": 95.2,
      "accuracy": 91.8,
      "consistency": 89.5,
      "timeliness": 93.1
    },
    "issues": [
      {
        "type": "missing_data",
        "severity": "medium",
        "count": 12,
        "description": "部分设备数据缺失"
      }
    ]
  },
  "message": "获取成功"
}
```

### 获取AI模型状态

**接口路径**: `GET /ai/models`

**接口描述**: 获取AI模型运行状态

**成功响应**:
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": 1,
        "modelName": "EnergyPredictionModel",
        "modelType": "lstm",
        "status": "deployed",
        "version": "v2.1.0",
        "accuracy": 94.2,
        "lastTrained": "2024-01-10T00:00:00Z",
        "predictions": {
          "total": 15680,
          "today": 156
        }
      }
    ]
  },
  "message": "获取成功"
}
```

## WebSocket实时接口

### 连接WebSocket

**连接地址**: `ws://localhost:1125/ws`

**认证方式**: 连接时发送认证消息

```json
{
  "type": "auth",
  "token": "your_jwt_token"
}
```

### 订阅实时数据

**订阅设备数据**:
```json
{
  "type": "subscribe",
  "channel": "device_data",
  "deviceIds": [1, 2, 3]
}
```

**订阅VPP状态**:
```json
{
  "type": "subscribe",
  "channel": "vpp_status",
  "vppIds": [1]
}
```

**订阅交易事件**:
```json
{
  "type": "subscribe",
  "channel": "trading_events"
}
```

### 实时数据推送

**设备数据推送**:
```json
{
  "type": "device_data",
  "deviceId": 1,
  "data": {
    "power_output": 8.5,
    "temperature": 45.2,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**交易事件推送**:
```json
{
  "type": "trading_event",
  "event": "trade_executed",
  "data": {
    "tradeId": 1001,
    "vppId": 1,
    "quantity": 50.0,
    "price": 0.85,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## 错误代码说明

### 通用错误代码

| 错误代码 | 说明 |
|----------|------|
| VALIDATION_ERROR | 参数验证失败 |
| AUTHENTICATION_FAILED | 认证失败 |
| AUTHORIZATION_DENIED | 权限不足 |
| RESOURCE_NOT_FOUND | 资源不存在 |
| RESOURCE_CONFLICT | 资源冲突 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 |
| INTERNAL_SERVER_ERROR | 服务器内部错误 |

### 业务错误代码

| 错误代码 | 说明 |
|----------|------|
| DEVICE_OFFLINE | 设备离线 |
| DEVICE_MAINTENANCE | 设备维护中 |
| VPP_INSUFFICIENT_CAPACITY | VPP容量不足 |
| TRADING_MARKET_CLOSED | 交易市场关闭 |
| BLOCKCHAIN_TRANSACTION_FAILED | 区块链交易失败 |
| AI_MODEL_NOT_READY | AI模型未就绪 |

## API使用示例

### JavaScript示例

```javascript
// 登录获取token
const login = async () => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'password123'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    return data.data.token;
  }
};

// 获取设备列表
const getDevices = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/v1/devices', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// WebSocket连接
const connectWebSocket = () => {
  const token = localStorage.getItem('token');
  const ws = new WebSocket('ws://localhost:1125/ws');
  
  ws.onopen = () => {
    // 认证
    ws.send(JSON.stringify({
      type: 'auth',
      token: token
    }));
    
    // 订阅设备数据
    ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'device_data',
      deviceIds: [1, 2, 3]
    }));
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('实时数据:', data);
  };
};
```

### Python示例

```python
import requests
import json

class ZeroCarbonAPI:
    def __init__(self, base_url='http://localhost:1125/api/v1'):
        self.base_url = base_url
        self.token = None
    
    def login(self, username, password):
        response = requests.post(f'{self.base_url}/auth/login', json={
            'username': username,
            'password': password
        })
        
        data = response.json()
        if data['success']:
            self.token = data['data']['token']
            return True
        return False
    
    def get_headers(self):
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def get_devices(self, page=1, limit=20):
        response = requests.get(
            f'{self.base_url}/devices',
            headers=self.get_headers(),
            params={'page': page, 'limit': limit}
        )
        return response.json()
    
    def get_vpp_overview(self):
        response = requests.get(
            f'{self.base_url}/vpp',
            headers=self.get_headers()
        )
        return response.json()

# 使用示例
api = ZeroCarbonAPI()
if api.login('admin', 'password123'):
    devices = api.get_devices()
    print(f"设备数量: {devices['data']['pagination']['total']}")
    
    vpp_data = api.get_vpp_overview()
    print(f"VPP数量: {len(vpp_data['data']['vpps'])}")
```

## 总结

零碳园区数字孪生系统提供了完整的RESTful API接口，涵盖用户管理、设备监控、VPP运营、能源分析、区块链集成等核心功能。API设计遵循REST规范，提供统一的响应格式和错误处理机制，支持实时数据推送和高并发访问。通过完善的认证授权和限流机制，确保API的安全性和稳定性。