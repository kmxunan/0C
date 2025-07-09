# 零碳园区数字孪生能碳管理系统 API 接口文档

## 1. 引言

### 1.1 目的

本文档旨在为开发者提供零碳园区数字孪生能碳管理系统的API接口使用说明。通过这些接口，外部系统或应用可以与核心能碳管理系统进行数据交互，实现数据查询、设备控制、告警推送等功能，促进园区内各系统间的协同工作。

### 1.2 目标用户

- 后端开发工程师
- 前端开发工程师
- 系统集成商
- 需要接入园区能碳数据的第三方应用开发者

### 1.3 接口风格

本系统API采用RESTful风格设计，使用HTTP协议进行通信。数据传输格式主要采用JSON。

### 1.4 授权认证

所有API接口均需要进行身份验证。采用基于Token的认证方式（如Bearer Token），客户端在首次访问时获取Token，后续每次请求需在Header中携带该Token。
**认证Header格式:**

```
Authorization: Bearer <access_token>
```

### 1.5 基础URL

所有接口URL均为相对路径，实际调用时需拼接基础URL。例如，基础URL为 `https://api.zerocarbonpark.com/v1`。

### 1.6 错误处理

接口返回的HTTP状态码表示请求的处理结果。常见状态码及含义如下：
| 状态码 | 含义 |
| --- | --- |
| 200 OK | 请求成功。 |
| 201 Created | 资源创建成功。 |
| 204 No Content | 请求成功，但无返回内容。 |
| 400 Bad Request | 请求参数错误或格式不正确。 |
| 401 Unauthorized | 认证失败，Token无效或未提供。 |
| 403 Forbidden | 用户无权限访问该资源。 |
| 404 Not Found | 请求的资源不存在。 |
| 500 Internal Server Error | 服务器内部错误。 |
详细的错误信息会在响应体中以JSON格式返回，结构如下：

```json
{
  "error": {
    "code": "错误代码",
    "message": "错误描述信息",
    "details": "详细的错误原因（可选）"
  }
}
```

## 2. 数据模型

### 2.1 设备(Device)

```json
{
  "id": "设备唯一标识符",
  "name": "设备名称",
  "type": "设备类型（如：光伏板、储能电池、充电桩、传感器等）",
  "location": {
    "latitude": "纬度",
    "longitude": "经度",
    "address": "物理地址（可选）"
  },
  "status": "设备状态（如：在线、离线、故障、维护中）",
  "power": "当前功率（W）",
  "energy": "累计发电/用电量（kWh）",
  "installation_date": "安装日期",
  "manufacturer": "制造商",
  "model": "型号",
  "metadata": {
    "custom_field1": "自定义字段值",
    "custom_field2": "自定义字段值"
  }
}
```

### 2.2 能源数据(EnergyData)

```json
{
  "id": "数据记录ID",
  "device_id": "关联的设备ID",
  "timestamp": "数据采集时间戳",
  "value": "能源数值（如：功率、电量）",
  "unit": "单位（如：W, kWh）",
  "type": "能源类型（如：光伏发电、电网用电、储能充放电）",
  "quality": "数据质量（如：良好、可疑、错误）"
}
```

### 2.3 碳排放数据(CarbonData)

```json
{
  "id": "数据记录ID",
  "timestamp": "数据时间戳",
  "value": "碳排放量（如：吨CO2e）",
  "unit": "单位（如：kgCO2e, tCO2e）",
  "source": "碳排放源（如：电力消耗、交通、建筑供暖）",
  "category": "排放类别（如：范围一、范围二、范围三）",
  "calculation_method": "计算方法（如：基于活动数据、基于投入产出）"
}
```

### 2.4 告警(Alert)

```json
{
  "id": "告警ID",
  "device_id": "关联的设备ID（如适用）",
  "timestamp": "告警发生时间",
  "level": "告警级别（如：紧急、高、中、低）",
  "type": "告警类型（如：设备故障、能耗异常、碳排放超标）",
  "message": "告警描述信息",
  "status": "告警状态（如：未处理、处理中、已解决）",
  "resolved_by": "处理人（可选）",
  "resolved_at": "处理时间（可选）"
}
```

### 2.5 场景/策略(Scenario/Strategy)

```json
{
  "id": "策略ID",
  "name": "策略名称",
  "description": "策略描述",
  "type": "策略类型（如：优化发电、削峰填谷、应急响应）",
  "status": "策略状态（如：启用、禁用、执行中）",
  "parameters": {
    "param1": "参数值",
    "param2": "参数值"
  },
  "created_at": "创建时间",
  "updated_at": "更新时间"
}
```

## 3. API 接口列表

### 3.1 设备管理

#### 3.1.1 获取所有设备列表

- **URL:** `/devices`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Query Parameters:**
  - `type` (可选): 设备类型，用于筛选。
  - `status` (可选): 设备状态，用于筛选。
  - `page` (可选): 页码，默认1。
  - `page_size` (可选): 每页数量，默认10。
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "dev_001",
        "name": "光伏阵列A",
        "type": "photovoltaic",
        "location": {
          "latitude": 24.8071,
          "longitude": 102.6687
        },
        "status": "online",
        "power": 1200,
        "energy": 1500.5,
        "installation_date": "2023-05-15"
      },
      ...
    ],
    "total": 50,
    "page": 1,
    "page_size": 10
  }
  ```
- **Response (401 Unauthorized):**
  ```json
  {
    "error": {
      "code": "AUTH_FAILED",
      "message": "Invalid or missing access token."
    }
  }
  ```

#### 3.1.2 获取单个设备详情

- **URL:** `/devices/{device_id}`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Path Parameters:**
  - `device_id`: 设备的唯一标识符。
- **Response (200 OK):**
  ```json
  {
    "data": {
      "id": "dev_001",
      "name": "光伏阵列A",
      "type": "photovoltaic",
      ...
    }
  }
  ```
- **Response (404 Not Found):**
  ```json
  {
    "error": {
      "code": "DEVICE_NOT_FOUND",
      "message": "Device with ID dev_001 not found."
    }
  }
  ```

#### 3.1.3 创建新设备

- **URL:** `/devices`
- **Method:** `POST`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "name": "储能电池B",
    "type": "battery",
    "location": {
      "latitude": 24.8072,
      "longitude": 102.6688
    },
    "status": "online",
    "power": 0,
    "energy": 0,
    "installation_date": "2023-06-01",
    "manufacturer": "Tesla",
    "model": "Powerwall 2"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "data": {
      "id": "dev_002", // 由服务器生成
      "name": "储能电池B",
      ...
    }
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "error": {
      "code": "INVALID_PAYLOAD",
      "message": "Missing required field: name."
    }
  }
  ```

#### 3.1.4 更新设备信息

- **URL:** `/devices/{device_id}`
- **Method:** `PUT`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
- **Path Parameters:**
  - `device_id`: 设备的唯一标识符。
- **Request Body:** 包含需要更新的字段。
  ```json
  {
    "status": "maintenance"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "data": {
      "id": "dev_001",
      "status": "maintenance",
      ...
    }
  }
  ```
- **Response (404 Not Found):** (同3.1.2)

#### 3.1.5 删除设备

- **URL:** `/devices/{device_id}`
- **Method:** `DELETE`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Path Parameters:**
  - `device_id`: 设备的唯一标识符。
- **Response (204 No Content):** 成功删除，无返回内容。
- **Response (404 Not Found):** (同3.1.2)

### 3.2 能源数据管理

#### 3.2.1 获取设备能源数据（按时间范围）

- **URL:** `/energy-data`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Query Parameters:**
  - `device_id`: 设备ID，用于筛选。
  - `type`: 能源类型，用于筛选。
  - `start_time`: 开始时间戳（ISO 8601格式，如：2023-06-01T00:00:00Z）。
  - `end_time`: 结束时间戳（ISO 8601格式）。
  - `interval`: 时间间隔（如：1h, 1d, 1m），用于聚合数据。
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "device_id": "dev_001",
        "timestamp": "2023-06-01T01:00:00Z",
        "value": 1250,
        "unit": "W",
        "type": "photovoltaic"
      },
      ...
    ]
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "error": {
      "code": "INVALID_DATE_RANGE",
      "message": "End time must be after start time."
    }
  }
  ```

#### 3.2.2 推送实时能源数据（设备端调用）

- **URL:** `/energy-data/realtime`
- **Method:** `POST`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "device_id": "dev_001",
    "timestamp": "2023-06-23T10:00:00Z",
    "value": 1180,
    "unit": "W",
    "type": "photovoltaic"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "data": {
      "id": "ed_123", // 由服务器生成
      "device_id": "dev_001",
      ...
    }
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "error": {
      "code": "INVALID_DATA",
      "message": "Value must be a positive number."
    }
  }
  ```

### 3.3 碳排放数据管理

#### 3.3.1 获取碳排放数据（按时间范围）

- **URL:** `/carbon-data`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Query Parameters:**
  - `source`: 排放源，用于筛选。
  - `category`: 排放类别，用于筛选。
  - `start_time`: 开始时间戳（ISO 8601格式）。
  - `end_time`: 结束时间戳（ISO 8601格式）。
  - `interval`: 时间间隔（如：1h, 1d, 1m），用于聚合数据。
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "timestamp": "2023-06-01T00:00:00Z",
        "value": 0.25,
        "unit": "kgCO2e",
        "source": "electricity",
        "category": "Scope 2"
      },
      ...
    ]
  }
  ```

#### 3.3.2 获取园区总碳排放统计

- **URL:** `/carbon-data/total`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Query Parameters:**
  - `start_time`: 开始时间戳。
  - `end_time`: 结束时间戳。
  - `category`: 排放类别（可选，如：Scope 1, Scope 2）。
- **Response (200 OK):**
  ```json
  {
    "data": {
      "total_emission": 125.5,
      "unit": "tCO2e",
      "category": "Scope 2",
      "period": "2023-06-01 to 2023-06-30"
    }
  }
  ```

### 3.4 告警管理

#### 3.4.1 获取告警列表

- **URL:** `/alerts`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Query Parameters:**
  - `device_id`: 关联设备ID，用于筛选。
  - `level`: 告警级别，用于筛选。
  - `status`: 告警状态，用于筛选。
  - `start_time`: 开始时间戳。
  - `end_time`: 结束时间戳。
  - `page`: 页码。
  - `page_size`: 每页数量。
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "alert_001",
        "device_id": "dev_001",
        "timestamp": "2023-06-23T09:15:00Z",
        "level": "high",
        "type": "performance_drop",
        "message": "光伏阵列A功率输出低于预期20%超过10分钟。",
        "status": "unresolved"
      },
      ...
    ],
    "total": 5,
    "page": 1,
    "page_size": 10
  }
  ```

#### 3.4.2 标记告警为已解决

- **URL:** `/alerts/{alert_id}/resolve`
- **Method:** `POST`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
- **Path Parameters:**
  - `alert_id`: 告警ID。
- **Request Body (可选):**
  ```json
  {
    "resolved_by": "user001",
    "notes": "已检查连接线，恢复正常。"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "data": {
      "id": "alert_001",
      "status": "resolved",
      "resolved_by": "user001",
      "resolved_at": "2023-06-23T10:05:00Z"
    }
  }
  ```
- **Response (404 Not Found):**
  ```json
  {
    "error": {
      "code": "ALERT_NOT_FOUND",
      "message": "Alert with ID alert_001 not found."
    }
  }
  ```

### 3.5 场景/策略管理

#### 3.5.1 获取所有策略列表

- **URL:** `/strategies`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Query Parameters:**
  - `type`: 策略类型，用于筛选。
  - `status`: 策略状态，用于筛选。
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "strat_001",
        "name": "光伏优先调度",
        "type": "optimization",
        "status": "enabled"
      },
      ...
    ]
  }
  ```

#### 3.5.2 启用/禁用策略

- **URL:** `/strategies/{strategy_id}/toggle`
- **Method:** `POST`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
- **Path Parameters:**
  - `strategy_id`: 策略ID。
- **Request Body:**
  ```json
  {
    "enable": true // true表示启用，false表示禁用
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "data": {
      "id": "strat_001",
      "status": "enabled" // 或 "disabled"
    }
  }
  ```

#### 3.5.3 执行策略（手动触发）

- **URL:** `/strategies/{strategy_id}/execute`
- **Method:** `POST`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
- **Path Parameters:**
  - `strategy_id`: 策略ID。
- **Request Body (可选，用于传递运行时参数):**
  ```json
  {
    "override_params": {
      "priority": "high"
    }
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "data": {
      "message": "Strategy strat_001 execution initiated."
    }
  }
  ```
- **Response (403 Forbidden):**
  ```json
  {
    "error": {
      "code": "STRATEGY_DISABLED",
      "message": "Cannot execute disabled strategy."
    }
  }
  ```

### 3.6 数字孪生服务

#### 3.6.1 获取园区实时数字孪生状态快照

- **URL:** `/twin/snapshot`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Query Parameters:**
  - `include_devices`: 是否包含设备状态（布尔值，默认true）。
  - `include_energy`: 是否包含能源数据（布尔值，默认true）。
  - `include_carbon`: 是否包含碳排放数据（布尔值，默认true）。
- **Response (200 OK):**
  ```json
  {
    "timestamp": "2023-06-23T10:10:00Z",
    "status": {
      "overall": "normal",
      "energy_balance": "surplus",
      "carbon_status": "neutral"
    },
    "devices": [
      /* 设备状态列表，简化 */
    ],
    "energy": [
      /* 能源数据列表，简化 */
    ],
    "carbon": [
      /* 碳排放数据列表，简化 */
    ]
  }
  ```

#### 3.6.2 获取园区数字孪生模型信息

- **URL:** `/twin/model`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Response (200 OK):**
  ```json
  {
    "data": {
      "model_version": "v1.2.0",
      "last_updated": "2023-06-20",
      "components_count": 150,
      "spatial_coverage": "Entire Park",
      "data_sources": ["IoT", "GIS", "Energy Management", "Weather"]
    }
  }
  ```

## 4. 附录

### 4.1 完整数据模型定义

（此处应包含更详细的数据模型定义，包括所有字段的数据类型、约束等。）

### 4.2 完整ER图

（此处应包含系统的实体关系图。）

### 4.3 数据流程图

（此处应包含关键业务流程的数据流向图。）

### 4.4 数据模型图

（此处应包含更直观的数据模型图，如PlantUML或Mermaid图。）

### 4.5 数据安全策略详情

（此处应包含更详细的数据安全措施，如数据加密、访问控制策略等。）

### 4.6 数据备份方案详情

（此处应包含具体的备份频率、存储位置、恢复流程等。）

### 4.7 数据恢复方案详情

## （此处应包含不同场景下的数据恢复步骤和验证方法。）

**注意：** 这只是一个API接口文档的框架和示例，实际开发中需要根据具体业务需求进行详细设计和补充。例如，需要定义更详细的错误代码、请求/响应示例、分页逻辑、过滤条件等。同时，对于性能敏感的接口，可能需要考虑缓存策略。
