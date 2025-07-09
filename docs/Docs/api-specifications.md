# API规范

## 1. 概述
本系统遵循RESTful API设计规范，采用JSON作为数据交换格式，所有API请求和响应都通过HTTPS协议传输。

## 2. API版本控制
- 所有API路径以`/api/v1/`开头
- 版本升级时保持向后兼容性

## 3. 通用请求规范

### 3.1 请求方法
| 方法 | 描述 |
|------|------|
| GET | 获取资源 |
| POST | 创建资源 |
| PUT | 更新资源 |
| DELETE | 删除资源 |

### 3.2 请求头
```http
Content-Type: application/json
Authorization: Bearer <token>
```

### 3.3 响应格式
```json
{
  "status": "success",
  "data": { /* 响应数据 */ },
  "message": "操作成功"
}
```

## 4. 核心API列表

### 4.1 能源管理
- `GET /api/v1/energy/devices` - 获取能源设备列表
- `GET /api/v1/energy/devices/{id}` - 获取设备详细信息
- `GET /api/v1/energy/consumption` - 获取能耗数据
- `GET /api/v1/energy/emission` - 获取碳排放数据

### 4.2 设备管理
- `GET /api/v1/devices` - 获取设备列表
- `POST /api/v1/devices` - 添加新设备
- `PUT /api/v1/devices/{id}` - 更新设备信息
- `DELETE /api/v1/devices/{id}` - 删除设备

### 4.3 实时数据
- `GET /api/v1/data/realtime` - 获取实时数据
- `GET /api/v1/data/historical` - 获取历史数据

### 4.4 AI预测
- `GET /api/v1/predict/energy` - 获取能源消耗预测
- `GET /api/v1/predict/emission` - 获取碳排放预测

## 5. 错误处理
```json
{
  "status": "error",
  "error": {
    "code": 404,
    "message": "资源未找到",
    "details": "请求的设备ID不存在"
  }
}
```

## 6. 安全规范
- 使用JWT进行身份验证
- 实施API请求速率限制（默认15分钟100次）
- 所有API必须通过HTTPS访问
- 对敏感操作实施双因素认证