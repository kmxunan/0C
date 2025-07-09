# 数据库设计

## 1. 概述
本系统采用多数据库架构，结合SQLite、MongoDB和Redis的优势，实现高效的数据存储与管理。

## 2. 数据库选型
- **SQLite**：用于轻量级数据存储和本地开发
- **MongoDB**：处理时序数据和非结构化数据
- **Redis**：提供高性能缓存和实时数据处理

## 3. 核心表结构（SQLite）

### 3.1 能源设备表 (energy_devices)
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 设备名称 |
| type | TEXT | 设备类型 |
| location | TEXT | 安装位置 |
| last_update | DATETIME | 最后更新时间 |

### 3.2 能源数据表 (energy_data)
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INTEGER | 主键 |
| device_id | INTEGER | 关联设备ID |
| timestamp | DATETIME | 数据时间戳 |
| energy_consumption | REAL | 能耗值 |
| carbon_emission | REAL | 碳排放量 |

## 4. MongoDB集合设计

### 4.1 实时数据集合 (realtime_data)
```json
{
  "device_id": Number,
  "timestamp": Date,
  "data": {
    "voltage": Number,
    "current": Number,
    "power": Number
  }
}
```

## 5. Redis数据结构设计

### 5.1 缓存热点数据
- 键格式：`cache:{device_id}:{metric}`
- 示例：`cache:1001:power`
- 数据类型：Hash

## 6. 数据流向图
```
+----------------+     +------------------+     +--------------+
|  物联网设备      |---->|   MQTT Broker    |---->|   数据处理层   |
+----------------+     +------------------+     +--------------+
                                                  |
                    +-----------------------------v---------------------+
                    |           SQLite (结构化数据) / MongoDB (时序数据)        |
                    +----------------------------+----------------------+
                                                 |
                    +-----------------------------v---------------------+
                    |                     Redis (实时缓存)                   |
                    +----------------------------------------------------+
```