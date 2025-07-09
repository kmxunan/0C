-- 虚拟电厂与电力交易模块P0阶段数据库扩展
-- 基于需求规格说明书的新增表结构
-- 创建时间: 2025年1月
-- 版本: v1.0

-- ==================== 资源模板管理扩展 ====================

-- 1. 资源模板库表 (vpp_resource_templates)
-- 标准化的资源模板定义，支持快速实例化
CREATE TABLE IF NOT EXISTS vpp_resource_templates (
    id VARCHAR(36) PRIMARY KEY COMMENT '模板ID',
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    type VARCHAR(50) NOT NULL COMMENT '资源类型',
    category ENUM('GENERATION','STORAGE','LOAD','FLEXIBLE') COMMENT '资源分类',
    parameters JSON COMMENT '技术参数配置',
    control_interface JSON COMMENT '控制接口定义',
    version VARCHAR(20) DEFAULT '1.0' COMMENT '模板版本',
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) COMMENT '创建人',
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源模板定义表';

-- 2. 扩展资源实例表字段
-- 为现有的vpp_resource_instances表添加新字段
ALTER TABLE vpp_resource_instances 
ADD COLUMN IF NOT EXISTS template_id VARCHAR(36) COMMENT '关联模板ID',
ADD COLUMN IF NOT EXISTS device_ip VARCHAR(15) COMMENT '设备IP地址',
ADD COLUMN IF NOT EXISTS device_port INT COMMENT '设备端口',
ADD COLUMN IF NOT EXISTS location_info JSON COMMENT '位置信息(经纬度、建筑等)',
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP COMMENT '最后心跳时间',
ADD INDEX idx_template_id (template_id),
ADD INDEX idx_device_ip (device_ip),
ADD INDEX idx_last_heartbeat (last_heartbeat);

-- ==================== 市场连接器管理 ====================

-- 3. 市场连接器配置表 (market_connectors)
CREATE TABLE IF NOT EXISTS market_connectors (
    id VARCHAR(36) PRIMARY KEY COMMENT '连接器ID',
    name VARCHAR(100) NOT NULL COMMENT '连接器名称',
    market_type VARCHAR(50) NOT NULL COMMENT '市场类型',
    api_endpoint VARCHAR(255) NOT NULL COMMENT 'API接口地址',
    auth_config JSON COMMENT '认证配置',
    trading_rules JSON COMMENT '交易规则配置',
    status ENUM('ACTIVE','INACTIVE','TESTING') DEFAULT 'INACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_market_type (market_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='市场连接器配置表';

-- ==================== AI模型管理 ====================

-- 4. AI模型管理表 (ai_models)
CREATE TABLE IF NOT EXISTS ai_models (
    id VARCHAR(36) PRIMARY KEY COMMENT '模型ID',
    name VARCHAR(100) NOT NULL COMMENT '模型名称',
    model_type VARCHAR(50) NOT NULL COMMENT '模型类型',
    version VARCHAR(50) NOT NULL COMMENT '模型版本',
    model_file_path VARCHAR(255) COMMENT '模型文件路径',
    input_schema JSON COMMENT '输入数据结构',
    output_schema JSON COMMENT '输出数据结构',
    performance_metrics JSON COMMENT '性能指标',
    status ENUM('TRAINING','TESTING','ACTIVE','DEPRECATED') DEFAULT 'TRAINING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_model_type (model_type),
    INDEX idx_status (status),
    INDEX idx_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型管理表';

-- ==================== 策略回测管理 ====================

-- 5. 策略回测任务表 (backtest_tasks)
CREATE TABLE IF NOT EXISTS backtest_tasks (
    id VARCHAR(36) PRIMARY KEY COMMENT '任务ID',
    strategy_id INT NOT NULL COMMENT '策略ID',
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    start_date DATE NOT NULL COMMENT '回测开始日期',
    end_date DATE NOT NULL COMMENT '回测结束日期',
    market_data_source VARCHAR(100) COMMENT '市场数据源',
    status ENUM('PENDING','RUNNING','COMPLETED','FAILED') DEFAULT 'PENDING',
    results JSON COMMENT '回测结果',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (strategy_id) REFERENCES vpp_trading_strategies(id),
    INDEX idx_strategy (strategy_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='策略回测任务表';

-- ==================== 调度指令管理 ====================

-- 6. 调度指令表 (dispatch_instructions)
CREATE TABLE IF NOT EXISTS dispatch_instructions (
    id VARCHAR(36) PRIMARY KEY COMMENT '指令ID',
    vpp_id INT NOT NULL COMMENT 'VPP ID',
    resource_id INT NOT NULL COMMENT '资源ID',
    instruction_type ENUM('CHARGE','DISCHARGE','REDUCE_LOAD','INCREASE_LOAD') COMMENT '指令类型',
    target_power DECIMAL(18,2) NOT NULL COMMENT '目标功率(kW)',
    start_time TIMESTAMP NOT NULL COMMENT '开始时间',
    duration INT NOT NULL COMMENT '持续时间(分钟)',
    actual_power DECIMAL(18,2) COMMENT '实际功率(kW)',
    deviation DECIMAL(18,2) COMMENT '偏差(kW)',
    status ENUM('PENDING','EXECUTING','COMPLETED','FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id),
    FOREIGN KEY (resource_id) REFERENCES vpp_resources(id),
    INDEX idx_vpp (vpp_id),
    INDEX idx_resource (resource_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='调度指令表';

-- ==================== 实时数据监控 ====================

-- 7. 资源实时数据表 (resource_realtime_data)
CREATE TABLE IF NOT EXISTS resource_realtime_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '数据ID',
    resource_id INT NOT NULL COMMENT '资源ID',
    timestamp TIMESTAMP NOT NULL COMMENT '时间戳',
    power DECIMAL(18,2) COMMENT '功率(kW)',
    energy DECIMAL(18,2) COMMENT '电量(kWh)',
    soc DECIMAL(5,2) COMMENT '电池SOC(%)',
    temperature DECIMAL(5,2) COMMENT '温度(°C)',
    voltage DECIMAL(8,2) COMMENT '电压(V)',
    current DECIMAL(8,2) COMMENT '电流(A)',
    frequency DECIMAL(6,3) COMMENT '频率(Hz)',
    additional_data JSON COMMENT '其他数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES vpp_resources(id),
    INDEX idx_resource_time (resource_id, timestamp),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源实时数据表'
PARTITION BY RANGE (TO_DAYS(timestamp)) (
    PARTITION p_history VALUES LESS THAN (TO_DAYS('2025-01-01')),
    PARTITION p_2025_01 VALUES LESS THAN (TO_DAYS('2025-02-01')),
    PARTITION p_2025_02 VALUES LESS THAN (TO_DAYS('2025-03-01')),
    PARTITION p_2025_03 VALUES LESS THAN (TO_DAYS('2025-04-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ==================== 扩展交易策略表 ====================

-- 8. 扩展现有交易策略表字段
ALTER TABLE vpp_trading_strategies 
ADD COLUMN IF NOT EXISTS strategy_version VARCHAR(20) DEFAULT '1.0' COMMENT '策略版本',
ADD COLUMN IF NOT EXISTS ai_model_id VARCHAR(36) COMMENT '关联AI模型ID',
ADD COLUMN IF NOT EXISTS rule_config JSON COMMENT '规则配置',
ADD COLUMN IF NOT EXISTS risk_parameters JSON COMMENT '风险参数',
ADD COLUMN IF NOT EXISTS last_executed TIMESTAMP COMMENT '最后执行时间',
ADD INDEX idx_ai_model (ai_model_id),
ADD INDEX idx_last_executed (last_executed);

-- ==================== 市场数据管理 ====================

-- 9. 市场数据表 (market_data)
CREATE TABLE IF NOT EXISTS market_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '数据ID',
    market_connector_id VARCHAR(36) NOT NULL COMMENT '市场连接器ID',
    data_type ENUM('PRICE','VOLUME','FORECAST','NEWS') NOT NULL COMMENT '数据类型',
    timestamp TIMESTAMP NOT NULL COMMENT '时间戳',
    time_slot VARCHAR(20) COMMENT '时段',
    price DECIMAL(10,4) COMMENT '价格',
    volume DECIMAL(18,2) COMMENT '成交量',
    forecast_data JSON COMMENT '预测数据',
    raw_data JSON COMMENT '原始数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_connector_id) REFERENCES market_connectors(id),
    INDEX idx_connector_time (market_connector_id, timestamp),
    INDEX idx_data_type (data_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='市场数据表'
PARTITION BY RANGE (TO_DAYS(timestamp)) (
    PARTITION p_history VALUES LESS THAN (TO_DAYS('2025-01-01')),
    PARTITION p_2025_01 VALUES LESS THAN (TO_DAYS('2025-02-01')),
    PARTITION p_2025_02 VALUES LESS THAN (TO_DAYS('2025-03-01')),
    PARTITION p_2025_03 VALUES LESS THAN (TO_DAYS('2025-04-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ==================== 初始化预置数据 ====================

-- 插入预置资源模板数据
INSERT IGNORE INTO vpp_resource_templates (id, name, type, category, parameters, control_interface, created_by) VALUES
('template-pv-001', '光伏发电模板', 'PHOTOVOLTAIC', 'GENERATION', 
 JSON_OBJECT(
   'rated_power', 1000,
   'inverter_efficiency', 0.95,
   'prediction_api', '/api/v1/pv-forecast',
   'panel_type', 'monocrystalline',
   'tilt_angle', 30,
   'azimuth', 180
 ), 
 JSON_OBJECT(
   'control_endpoint', '/api/v1/pv-control',
   'status_endpoint', '/api/v1/pv-status',
   'protocol', 'MODBUS_TCP',
   'port', 502
 ), 
 'system'),

('template-ess-001', '磷酸铁锂储能模板', 'LITHIUM_ESS', 'STORAGE',
 JSON_OBJECT(
   'rated_power', 500,
   'rated_capacity', 1000,
   'charge_efficiency', 0.95,
   'discharge_efficiency', 0.95,
   'soc_min', 0.1,
   'soc_max', 0.9,
   'max_charge_rate', 0.5,
   'max_discharge_rate', 1.0
 ),
 JSON_OBJECT(
   'control_endpoint', '/api/v1/ess-control',
   'status_endpoint', '/api/v1/ess-status',
   'bms_protocol', 'MODBUS_TCP',
   'port', 502
 ),
 'system'),

('template-caes-001', '压缩空气储能模板', 'CAES', 'STORAGE',
 JSON_OBJECT(
   'rated_power', 2000,
   'rated_capacity', 8000,
   'charge_efficiency', 0.75,
   'discharge_efficiency', 0.75,
   'pressure_min', 50,
   'pressure_max', 300,
   'response_time', 10
 ),
 JSON_OBJECT(
   'control_endpoint', '/api/v1/caes-control',
   'status_endpoint', '/api/v1/caes-status',
   'protocol', 'HTTP_REST',
   'port', 8080
 ),
 'system'),

('template-load-001', '可中断工业负荷模板', 'INTERRUPTIBLE_LOAD', 'LOAD',
 JSON_OBJECT(
   'rated_power', 800,
   'interrupt_duration_max', 120,
   'response_time', 5,
   'compensation_cost', 0.5,
   'flexibility_range', 30
 ),
 JSON_OBJECT(
   'control_endpoint', '/api/v1/load-control',
   'status_endpoint', '/api/v1/load-status',
   'protocol', 'HTTP_REST',
   'port', 8080
 ),
 'system'),

('template-ev-001', '电动汽车充电桩模板', 'EV_CHARGING', 'FLEXIBLE',
 JSON_OBJECT(
   'total_power', 300,
   'charging_efficiency', 0.9,
   'v2g_capability', true,
   'smart_charging', true,
   'max_charging_power', 60
 ),
 JSON_OBJECT(
   'control_endpoint', '/api/v1/ev-control',
   'status_endpoint', '/api/v1/ev-status',
   'protocol', 'OCPP',
   'port', 8080
 ),
 'system');

-- 插入市场连接器配置
INSERT IGNORE INTO market_connectors (id, name, market_type, api_endpoint, auth_config, trading_rules, status) VALUES
('connector-yunnan-001', '云南省电力市场连接器', 'SPOT_MARKET', 'https://api.ynpowermarket.com/v1',
 JSON_OBJECT(
   'auth_type', 'JWT',
   'client_id', 'vpp_client',
   'token_endpoint', '/auth/token',
   'refresh_interval', 3600
 ),
 JSON_OBJECT(
   'trading_cycle', 'DAY_AHEAD',
   'bid_deadline', '10:00',
   'settlement_period', '15MIN',
   'price_unit', 'CNY_PER_KWH',
   'min_bid_quantity', 1,
   'max_bid_quantity', 10000
 ),
 'TESTING'),

('connector-ancillary-001', '辅助服务市场连接器', 'ANCILLARY_SERVICE', 'https://api.ancillarymarket.com/v1',
 JSON_OBJECT(
   'auth_type', 'API_KEY',
   'api_key_header', 'X-API-Key',
   'rate_limit', 1000
 ),
 JSON_OBJECT(
   'service_types', JSON_ARRAY('FREQUENCY_REGULATION', 'SPINNING_RESERVE'),
   'response_time_max', 300,
   'capacity_unit', 'MW',
   'bid_resolution', 0.1
 ),
 'INACTIVE');

-- 插入示例AI模型
INSERT IGNORE INTO ai_models (id, name, model_type, version, input_schema, output_schema, performance_metrics, status) VALUES
('model-price-forecast-001', '电价预测模型', 'PRICE_FORECAST', 'v1.0',
 JSON_OBJECT(
   'features', JSON_ARRAY('historical_price', 'load_forecast', 'weather_data', 'renewable_forecast'),
   'time_horizon', 24,
   'resolution', 'hourly'
 ),
 JSON_OBJECT(
   'predictions', JSON_ARRAY('price_forecast', 'confidence_interval'),
   'format', 'time_series'
 ),
 JSON_OBJECT(
   'accuracy', 0.85,
   'mae', 0.05,
   'rmse', 0.08,
   'last_training', '2025-01-01'
 ),
 'TESTING'),

('model-load-forecast-001', '负荷预测模型', 'LOAD_FORECAST', 'v1.0',
 JSON_OBJECT(
   'features', JSON_ARRAY('historical_load', 'weather_data', 'calendar_info'),
   'time_horizon', 48,
   'resolution', 'hourly'
 ),
 JSON_OBJECT(
   'predictions', JSON_ARRAY('load_forecast', 'uncertainty'),
   'format', 'time_series'
 ),
 JSON_OBJECT(
   'accuracy', 0.92,
   'mae', 0.03,
   'rmse', 0.05,
   'last_training', '2025-01-01'
 ),
 'ACTIVE');

-- ==================== 创建新的视图 ====================

-- VPP资源模板汇总视图
CREATE OR REPLACE VIEW vpp_template_summary AS
SELECT 
    category,
    COUNT(*) as template_count,
    GROUP_CONCAT(DISTINCT type) as available_types,
    AVG(JSON_EXTRACT(parameters, '$.rated_power')) as avg_rated_power
FROM vpp_resource_templates 
WHERE status = 'ACTIVE'
GROUP BY category;

-- 市场连接器状态视图
CREATE OR REPLACE VIEW market_connector_status AS
SELECT 
    id,
    name,
    market_type,
    status,
    CASE 
        WHEN status = 'ACTIVE' THEN '正常运行'
        WHEN status = 'TESTING' THEN '测试中'
        ELSE '未连接'
    END as status_desc,
    JSON_EXTRACT(trading_rules, '$.trading_cycle') as trading_cycle,
    created_at,
    updated_at
FROM market_connectors;

-- AI模型性能视图
CREATE OR REPLACE VIEW ai_model_performance AS
SELECT 
    id,
    name,
    model_type,
    version,
    status,
    JSON_EXTRACT(performance_metrics, '$.accuracy') as accuracy,
    JSON_EXTRACT(performance_metrics, '$.mae') as mae,
    JSON_EXTRACT(performance_metrics, '$.rmse') as rmse,
    created_at,
    updated_at
FROM ai_models
WHERE status IN ('ACTIVE', 'TESTING');

-- ==================== 完成提示 ====================

SELECT 'VPP P0阶段数据库扩展完成！' as message,
       'P0阶段新增表：资源模板、市场连接器、AI模型、回测任务、调度指令、实时数据、市场数据' as new_tables,
       '已插入预置模板和配置数据' as initialization_status;