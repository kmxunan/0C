-- VPP虚拟电厂模块数据库表结构 - P0阶段
-- 创建时间: 2024
-- 描述: 虚拟电厂资源管理、聚合管理、交易策略等核心功能的数据库表结构

BEGIN TRANSACTION;

-- 1. VPP资源模板表
CREATE TABLE IF NOT EXISTS vpp_resource_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL, -- 模板名称
    type VARCHAR(50) NOT NULL, -- 资源类型: solar, wind, battery, load等
    category VARCHAR(50) NOT NULL, -- 资源分类: renewable, storage, controllable_load等
    rated_capacity DECIMAL(10,2) NOT NULL, -- 额定容量
    unit VARCHAR(20) NOT NULL DEFAULT 'kW', -- 容量单位
    technical_specs TEXT, -- 技术规格参数(JSON格式)
    operational_constraints TEXT, -- 运行约束条件(JSON格式)
    cost_parameters TEXT, -- 成本参数(JSON格式)
    description TEXT, -- 模板描述
    is_active BOOLEAN DEFAULT TRUE, -- 是否启用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- 创建人ID
    updated_by INTEGER -- 更新人ID
);

-- 2. VPP资源实例表
CREATE TABLE IF NOT EXISTS vpp_resource_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL, -- 关联的模板ID
    name VARCHAR(100) NOT NULL, -- 资源实例名称
    device_id VARCHAR(100), -- 关联的设备ID
    location_info TEXT, -- 位置信息(JSON格式)
    current_capacity DECIMAL(10,2) NOT NULL, -- 当前可用容量
    status VARCHAR(20) DEFAULT 'offline', -- 状态: online, offline, maintenance, error
    operational_parameters TEXT, -- 运行参数(JSON格式)
    performance_metrics TEXT, -- 性能指标(JSON格式)
    last_maintenance_date DATE, -- 最后维护日期
    next_maintenance_date DATE, -- 下次维护日期
    is_available BOOLEAN DEFAULT TRUE, -- 是否可用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES vpp_resource_templates(id)
);

-- 3. VPP定义表
CREATE TABLE IF NOT EXISTS vpp_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL, -- VPP名称
    description TEXT, -- VPP描述
    target_capacity DECIMAL(10,2) NOT NULL, -- 目标聚合容量
    current_capacity DECIMAL(10,2) DEFAULT 0, -- 当前聚合容量
    operational_strategy TEXT, -- 运营策略配置(JSON格式)
    geographical_boundary TEXT, -- 地理边界定义(JSON格式)
    market_participation TEXT, -- 市场参与配置(JSON格式)
    status VARCHAR(20) DEFAULT 'inactive', -- 状态: active, inactive, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- 创建人ID
    updated_by INTEGER -- 更新人ID
);

-- 4. VPP资源关联表
CREATE TABLE IF NOT EXISTS vpp_resource_associations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vpp_id INTEGER NOT NULL, -- VPP ID
    resource_instance_id INTEGER NOT NULL, -- 资源实例ID
    allocation_ratio DECIMAL(5,4) DEFAULT 1.0000, -- 分配比例 (0-1)
    priority_level INTEGER DEFAULT 1, -- 优先级 (1-10)
    participation_constraints TEXT, -- 参与约束条件(JSON格式)
    revenue_sharing_ratio DECIMAL(5,4) DEFAULT 1.0000, -- 收益分配比例
    status VARCHAR(20) DEFAULT 'active', -- 关联状态: active, inactive, suspended
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 生效时间
    effective_to TIMESTAMP, -- 失效时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id),
    FOREIGN KEY (resource_instance_id) REFERENCES vpp_resource_instances(id),
    UNIQUE(vpp_id, resource_instance_id)
);

-- 5. VPP交易策略表
CREATE TABLE IF NOT EXISTS vpp_trading_strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL, -- 策略名称
    vpp_id INTEGER NOT NULL, -- 关联的VPP ID
    strategy_type VARCHAR(50) NOT NULL, -- 策略类型: arbitrage, peak_shaving, load_following等
    market_type VARCHAR(50) NOT NULL, -- 市场类型: spot, day_ahead, real_time等
    configuration TEXT NOT NULL, -- 策略配置参数(JSON格式)
    risk_parameters TEXT, -- 风险控制参数(JSON格式)
    performance_targets TEXT, -- 性能目标(JSON格式)
    status VARCHAR(20) DEFAULT 'inactive', -- 状态: active, inactive, testing
    backtest_results TEXT, -- 回测结果(JSON格式)
    live_performance TEXT, -- 实盘表现(JSON格式)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- 创建人ID
    updated_by INTEGER, -- 更新人ID
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id)
);

-- 6. 市场连接器配置表
CREATE TABLE IF NOT EXISTS market_connectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL, -- 连接器名称
    market_name VARCHAR(100) NOT NULL, -- 市场名称
    market_type VARCHAR(50) NOT NULL, -- 市场类型
    api_configuration TEXT NOT NULL, -- API配置信息(JSON格式)
    authentication_config TEXT, -- 认证配置(JSON格式)
    data_mapping_config TEXT, -- 数据映射配置(JSON格式)
    connection_status VARCHAR(20) DEFAULT 'disconnected', -- 连接状态
    last_sync_time TIMESTAMP, -- 最后同步时间
    error_log TEXT, -- 错误日志
    is_active BOOLEAN DEFAULT TRUE, -- 是否启用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. AI模型管理表
CREATE TABLE IF NOT EXISTS ai_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL, -- 模型名称
    model_type VARCHAR(50) NOT NULL, -- 模型类型: prediction, optimization, classification等
    version VARCHAR(20) NOT NULL, -- 模型版本
    framework VARCHAR(50), -- 框架: tensorflow, pytorch, sklearn等
    model_path VARCHAR(500), -- 模型文件路径
    input_schema TEXT, -- 输入数据结构(JSON格式)
    output_schema TEXT, -- 输出数据结构(JSON格式)
    training_config TEXT, -- 训练配置(JSON格式)
    performance_metrics TEXT, -- 性能指标(JSON格式)
    status VARCHAR(20) DEFAULT 'inactive', -- 状态: active, inactive, training, deprecated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER -- 创建人ID
);

-- 8. 回测任务表
CREATE TABLE IF NOT EXISTS backtest_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_name VARCHAR(100) NOT NULL, -- 任务名称
    strategy_id INTEGER NOT NULL, -- 关联的策略ID
    vpp_id INTEGER NOT NULL, -- 关联的VPP ID
    start_date DATE NOT NULL, -- 回测开始日期
    end_date DATE NOT NULL, -- 回测结束日期
    initial_capital DECIMAL(15,2) DEFAULT 0, -- 初始资金
    market_data_source VARCHAR(100), -- 市场数据源
    configuration TEXT, -- 回测配置参数(JSON格式)
    status VARCHAR(20) DEFAULT 'pending', -- 状态: pending, running, completed, failed
    progress DECIMAL(5,2) DEFAULT 0, -- 进度百分比
    results TEXT, -- 回测结果(JSON格式)
    performance_summary TEXT, -- 性能摘要(JSON格式)
    error_message TEXT, -- 错误信息
    started_at TIMESTAMP, -- 开始时间
    completed_at TIMESTAMP, -- 完成时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- 创建人ID
    FOREIGN KEY (strategy_id) REFERENCES vpp_trading_strategies(id),
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id)
);

-- 9. 调度指令表
CREATE TABLE IF NOT EXISTS dispatch_instructions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vpp_id INTEGER NOT NULL, -- VPP ID
    strategy_id INTEGER, -- 关联的策略ID
    instruction_type VARCHAR(50) NOT NULL, -- 指令类型: charge, discharge, reduce_load等
    target_resources TEXT, -- 目标资源列表(JSON格式)
    power_setpoint DECIMAL(10,2) NOT NULL, -- 功率设定值
    duration_minutes INTEGER NOT NULL, -- 持续时间(分钟)
    priority_level INTEGER DEFAULT 1, -- 优先级
    constraints TEXT, -- 约束条件(JSON格式)
    execution_time TIMESTAMP NOT NULL, -- 执行时间
    status VARCHAR(20) DEFAULT 'pending', -- 状态: pending, executing, completed, failed, cancelled
    actual_response TEXT, -- 实际响应(JSON格式)
    performance_metrics TEXT, -- 执行性能指标(JSON格式)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- 创建人ID
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id),
    FOREIGN KEY (strategy_id) REFERENCES vpp_trading_strategies(id)
);

-- 10. 资源实时数据表
CREATE TABLE IF NOT EXISTS resource_realtime_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_instance_id INTEGER NOT NULL, -- 资源实例ID
    timestamp TIMESTAMP NOT NULL, -- 数据时间戳
    power_output DECIMAL(10,2), -- 功率输出(kW)
    energy_output DECIMAL(10,2), -- 电量输出(kWh)
    efficiency DECIMAL(5,4), -- 效率
    temperature DECIMAL(5,2), -- 温度
    voltage DECIMAL(8,2), -- 电压
    current DECIMAL(8,2), -- 电流
    frequency DECIMAL(6,3), -- 频率
    state_of_charge DECIMAL(5,2), -- 充电状态(%)，适用于储能设备
    operational_status VARCHAR(20), -- 运行状态
    alarm_codes TEXT, -- 告警代码(JSON格式)
    raw_data TEXT, -- 原始数据(JSON格式)
    data_quality DECIMAL(3,2) DEFAULT 1.00, -- 数据质量评分
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_instance_id) REFERENCES vpp_resource_instances(id)
);

-- 11. 市场数据表
CREATE TABLE IF NOT EXISTS market_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_connector_id INTEGER NOT NULL, -- 市场连接器ID
    data_type VARCHAR(50) NOT NULL, -- 数据类型: price, volume, demand等
    market_period VARCHAR(50), -- 市场周期: real_time, day_ahead, hour_ahead等
    timestamp TIMESTAMP NOT NULL, -- 数据时间戳
    delivery_period_start TIMESTAMP, -- 交割周期开始
    delivery_period_end TIMESTAMP, -- 交割周期结束
    price DECIMAL(10,4), -- 价格
    volume DECIMAL(12,2), -- 交易量
    bid_price DECIMAL(10,4), -- 买入价
    ask_price DECIMAL(10,4), -- 卖出价
    market_clearing_price DECIMAL(10,4), -- 市场出清价格
    additional_data TEXT, -- 其他市场数据(JSON格式)
    data_source VARCHAR(100), -- 数据来源
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_connector_id) REFERENCES market_connectors(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_vpp_resource_instances_template_id ON vpp_resource_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_vpp_resource_instances_status ON vpp_resource_instances(status);
CREATE INDEX IF NOT EXISTS idx_vpp_resource_associations_vpp_id ON vpp_resource_associations(vpp_id);
CREATE INDEX IF NOT EXISTS idx_vpp_resource_associations_resource_id ON vpp_resource_associations(resource_instance_id);
CREATE INDEX IF NOT EXISTS idx_vpp_trading_strategies_vpp_id ON vpp_trading_strategies(vpp_id);
CREATE INDEX IF NOT EXISTS idx_vpp_trading_strategies_type ON vpp_trading_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_backtest_tasks_strategy_id ON backtest_tasks(strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtest_tasks_status ON backtest_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_instructions_vpp_id ON dispatch_instructions(vpp_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_instructions_execution_time ON dispatch_instructions(execution_time);
CREATE INDEX IF NOT EXISTS idx_resource_realtime_data_resource_id ON resource_realtime_data(resource_instance_id);
CREATE INDEX IF NOT EXISTS idx_resource_realtime_data_timestamp ON resource_realtime_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_connector_id ON market_data(market_connector_id);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_type_period ON market_data(data_type, market_period);

-- 插入一些示例数据

-- 示例资源模板
INSERT OR IGNORE INTO vpp_resource_templates (name, type, category, rated_capacity, unit, technical_specs, description) VALUES
('标准太阳能发电模板', 'solar', 'renewable', 1000.00, 'kW', '{"efficiency": 0.85, "degradation_rate": 0.005, "tilt_angle": 30}', '标准的太阳能发电资源模板'),
('风力发电模板', 'wind', 'renewable', 2000.00, 'kW', '{"cut_in_speed": 3, "cut_out_speed": 25, "rated_speed": 12}', '风力发电资源模板'),
('锂电池储能模板', 'battery', 'storage', 500.00, 'kWh', '{"efficiency": 0.95, "max_charge_rate": 0.5, "max_discharge_rate": 0.5}', '锂电池储能系统模板'),
('可控负荷模板', 'controllable_load', 'demand_response', 200.00, 'kW', '{"response_time": 5, "max_reduction": 0.8}', '可控负荷资源模板');

-- 示例VPP定义
INSERT OR IGNORE INTO vpp_definitions (name, description, target_capacity, operational_strategy) VALUES
('园区VPP-1', '园区主要虚拟电厂，整合多种分布式能源', 5000.00, '{"priority": "cost_optimization", "constraints": {"max_ramp_rate": 100}}'),
('工业园区VPP', '工业园区虚拟电厂，主要服务工业负荷', 8000.00, '{"priority": "reliability", "constraints": {"min_reserve": 500}}');

-- 示例市场连接器
INSERT OR IGNORE INTO market_connectors (name, market_name, market_type, api_configuration) VALUES
('现货市场连接器', '电力现货市场', 'spot', '{"endpoint": "https://api.spotmarket.com", "timeout": 30}'),
('日前市场连接器', '日前电力市场', 'day_ahead', '{"endpoint": "https://api.dayahead.com", "timeout": 60}');

COMMIT;