-- 虚拟电厂P1阶段数据库表结构
-- 包括策略管理、AI模型管理和回测仿真相关表

-- 1. 交易策略表
CREATE TABLE IF NOT EXISTS trading_strategies (
    id VARCHAR(36) PRIMARY KEY COMMENT '策略ID',
    name VARCHAR(100) NOT NULL COMMENT '策略名称',
    vpp_id VARCHAR(36) NOT NULL COMMENT '关联VPP ID',
    strategy_type ENUM('RULE_BASED','AI_DRIVEN','HYBRID') NOT NULL COMMENT '策略类型',
    config JSON COMMENT '策略配置',
    model_version VARCHAR(50) COMMENT 'AI模型版本',
    status ENUM('DRAFT','TESTING','ACTIVE','SUSPENDED') DEFAULT 'DRAFT' COMMENT '策略状态',
    performance_metrics JSON COMMENT '性能指标',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by VARCHAR(36) COMMENT '创建人',
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_strategy_type (strategy_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) COMMENT='交易策略表';

-- 2. AI模型表
CREATE TABLE IF NOT EXISTS ai_models (
    id VARCHAR(36) PRIMARY KEY COMMENT '模型ID',
    name VARCHAR(100) NOT NULL COMMENT '模型名称',
    model_type ENUM('PRICE_PREDICTION','DEMAND_FORECASTING','OPTIMIZATION','RISK_ASSESSMENT','ANOMALY_DETECTION') NOT NULL COMMENT '模型类型',
    version VARCHAR(20) NOT NULL COMMENT '模型版本',
    model_file_path VARCHAR(500) COMMENT '模型文件路径',
    input_schema JSON COMMENT '输入数据结构',
    output_schema JSON COMMENT '输出数据结构',
    description TEXT COMMENT '模型描述',
    framework VARCHAR(50) DEFAULT 'tensorflow' COMMENT '框架类型',
    status ENUM('REGISTERED','TRAINING','READY','DEPRECATED','ERROR') DEFAULT 'REGISTERED' COMMENT '模型状态',
    performance_metrics JSON COMMENT '性能指标',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by VARCHAR(36) COMMENT '创建人',
    INDEX idx_model_type (model_type),
    INDEX idx_status (status),
    INDEX idx_framework (framework),
    INDEX idx_version (version),
    UNIQUE KEY uk_name_version (name, version)
) COMMENT='AI模型表';

-- 3. 回测任务表
CREATE TABLE IF NOT EXISTS backtest_tasks (
    id VARCHAR(36) PRIMARY KEY COMMENT '任务ID',
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    backtest_type ENUM('STRATEGY_VALIDATION','PERFORMANCE_ANALYSIS','RISK_ASSESSMENT','PARAMETER_OPTIMIZATION') DEFAULT 'STRATEGY_VALIDATION' COMMENT '回测类型',
    start_date DATE NOT NULL COMMENT '回测开始日期',
    end_date DATE NOT NULL COMMENT '回测结束日期',
    data_source ENUM('HISTORICAL_DB','EXTERNAL_API','SIMULATION','HYBRID') DEFAULT 'HISTORICAL_DB' COMMENT '数据源',
    config JSON COMMENT '回测配置',
    status ENUM('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING' COMMENT '任务状态',
    progress INT DEFAULT 0 COMMENT '执行进度(0-100)',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    started_at TIMESTAMP NULL COMMENT '开始时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    created_by VARCHAR(36) COMMENT '创建人',
    FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE CASCADE,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_status (status),
    INDEX idx_backtest_type (backtest_type),
    INDEX idx_created_at (created_at),
    INDEX idx_date_range (start_date, end_date)
) COMMENT='回测任务表';

-- 4. 回测结果表
CREATE TABLE IF NOT EXISTS backtest_results (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '结果ID',
    task_id VARCHAR(36) NOT NULL COMMENT '任务ID',
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    results_data JSON COMMENT '回测结果数据',
    analysis_data JSON COMMENT '分析结果数据',
    report_data JSON COMMENT '报告数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (task_id) REFERENCES backtest_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_created_at (created_at),
    UNIQUE KEY uk_task_id (task_id)
) COMMENT='回测结果表';

-- 5. 策略执行历史表
CREATE TABLE IF NOT EXISTS strategy_execution_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '执行ID',
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    vpp_id VARCHAR(36) NOT NULL COMMENT 'VPP ID',
    execution_time TIMESTAMP NOT NULL COMMENT '执行时间',
    market_data JSON COMMENT '市场数据',
    vpp_data JSON COMMENT 'VPP数据',
    strategy_result JSON COMMENT '策略执行结果',
    success BOOLEAN DEFAULT FALSE COMMENT '执行是否成功',
    error_message TEXT COMMENT '错误信息',
    processing_time_ms INT COMMENT '处理时间(毫秒)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id) ON DELETE CASCADE,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_execution_time (execution_time),
    INDEX idx_success (success),
    INDEX idx_created_at (created_at)
) COMMENT='策略执行历史表';

-- 6. AI模型预测历史表
CREATE TABLE IF NOT EXISTS ai_model_predictions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '预测ID',
    model_id VARCHAR(36) NOT NULL COMMENT '模型ID',
    input_data JSON COMMENT '输入数据',
    prediction_result JSON COMMENT '预测结果',
    confidence DECIMAL(5,4) COMMENT '置信度',
    confidence_level ENUM('HIGH','MEDIUM','LOW') COMMENT '置信度等级',
    processing_time_ms INT COMMENT '处理时间(毫秒)',
    prediction_time TIMESTAMP NOT NULL COMMENT '预测时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE CASCADE,
    INDEX idx_model_id (model_id),
    INDEX idx_prediction_time (prediction_time),
    INDEX idx_confidence_level (confidence_level),
    INDEX idx_created_at (created_at)
) COMMENT='AI模型预测历史表';

-- 7. 策略规则表（用于规则驱动策略的详细配置）
CREATE TABLE IF NOT EXISTS strategy_rules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '规则ID',
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    rule_order INT DEFAULT 1 COMMENT '规则执行顺序',
    conditions JSON COMMENT '条件配置',
    actions JSON COMMENT '动作配置',
    enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    description TEXT COMMENT '规则描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE CASCADE,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_rule_order (rule_order),
    INDEX idx_enabled (enabled)
) COMMENT='策略规则表';

-- 8. 市场数据历史表（用于回测）
CREATE TABLE IF NOT EXISTS market_data_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '数据ID',
    market_type VARCHAR(50) NOT NULL COMMENT '市场类型',
    trading_date DATE NOT NULL COMMENT '交易日期',
    time_slot VARCHAR(20) NOT NULL COMMENT '时段',
    price DECIMAL(10,4) COMMENT '价格(元/kWh)',
    volume DECIMAL(18,2) COMMENT '成交量(kWh)',
    demand DECIMAL(18,2) COMMENT '需求量(kWh)',
    supply DECIMAL(18,2) COMMENT '供应量(kWh)',
    weather_data JSON COMMENT '天气数据',
    external_factors JSON COMMENT '外部因素',
    data_source VARCHAR(50) COMMENT '数据来源',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_market_type (market_type),
    INDEX idx_trading_date (trading_date),
    INDEX idx_time_slot (time_slot),
    INDEX idx_data_source (data_source),
    UNIQUE KEY uk_market_date_slot (market_type, trading_date, time_slot)
) COMMENT='市场数据历史表';

-- 9. VPP历史数据表（用于回测）
CREATE TABLE IF NOT EXISTS vpp_data_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '数据ID',
    vpp_id VARCHAR(36) NOT NULL COMMENT 'VPP ID',
    timestamp TIMESTAMP NOT NULL COMMENT '时间戳',
    available_capacity DECIMAL(18,2) COMMENT '可用容量(kW)',
    generation DECIMAL(18,2) COMMENT '发电量(kWh)',
    storage_soc DECIMAL(5,4) COMMENT '储能SOC',
    load DECIMAL(18,2) COMMENT '负荷(kWh)',
    efficiency DECIMAL(5,4) COMMENT '效率',
    status VARCHAR(20) COMMENT '状态',
    resource_data JSON COMMENT '资源详细数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_created_at (created_at)
) COMMENT='VPP历史数据表';

-- 10. 策略性能指标表
CREATE TABLE IF NOT EXISTS strategy_performance_metrics (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '指标ID',
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    metric_date DATE NOT NULL COMMENT '指标日期',
    total_executions INT DEFAULT 0 COMMENT '总执行次数',
    successful_executions INT DEFAULT 0 COMMENT '成功执行次数',
    success_rate DECIMAL(5,4) COMMENT '成功率',
    total_revenue DECIMAL(18,2) DEFAULT 0 COMMENT '总收益',
    total_cost DECIMAL(18,2) DEFAULT 0 COMMENT '总成本',
    net_profit DECIMAL(18,2) DEFAULT 0 COMMENT '净利润',
    average_confidence DECIMAL(5,4) COMMENT '平均置信度',
    risk_score DECIMAL(5,4) COMMENT '风险评分',
    sharpe_ratio DECIMAL(8,4) COMMENT '夏普比率',
    max_drawdown DECIMAL(18,2) COMMENT '最大回撤',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE CASCADE,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_metric_date (metric_date),
    INDEX idx_success_rate (success_rate),
    INDEX idx_net_profit (net_profit),
    UNIQUE KEY uk_strategy_date (strategy_id, metric_date)
) COMMENT='策略性能指标表';

-- 创建视图：策略综合性能视图
CREATE OR REPLACE VIEW v_strategy_performance AS
SELECT 
    ts.id as strategy_id,
    ts.name as strategy_name,
    ts.strategy_type,
    ts.status,
    ts.vpp_id,
    vd.name as vpp_name,
    JSON_EXTRACT(ts.performance_metrics, '$.total_executions') as total_executions,
    JSON_EXTRACT(ts.performance_metrics, '$.success_rate') as success_rate,
    JSON_EXTRACT(ts.performance_metrics, '$.average_revenue') as average_revenue,
    JSON_EXTRACT(ts.performance_metrics, '$.risk_score') as risk_score,
    COUNT(bt.id) as backtest_count,
    COUNT(CASE WHEN bt.status = 'COMPLETED' THEN 1 END) as completed_backtests,
    ts.created_at,
    ts.updated_at
FROM trading_strategies ts
LEFT JOIN vpp_definitions vd ON ts.vpp_id = vd.id
LEFT JOIN backtest_tasks bt ON ts.id = bt.strategy_id
GROUP BY ts.id, ts.name, ts.strategy_type, ts.status, ts.vpp_id, vd.name, ts.created_at, ts.updated_at;

-- 创建视图：AI模型性能视图
CREATE OR REPLACE VIEW v_ai_model_performance AS
SELECT 
    am.id as model_id,
    am.name as model_name,
    am.model_type,
    am.version,
    am.status,
    am.framework,
    JSON_EXTRACT(am.performance_metrics, '$.total_predictions') as total_predictions,
    JSON_EXTRACT(am.performance_metrics, '$.average_confidence') as average_confidence,
    JSON_EXTRACT(am.performance_metrics, '$.average_processing_time') as average_processing_time,
    JSON_EXTRACT(am.performance_metrics, '$.high_confidence_count') as high_confidence_count,
    COUNT(amp.id) as prediction_count,
    AVG(amp.confidence) as avg_confidence,
    AVG(amp.processing_time_ms) as avg_processing_time,
    am.created_at,
    am.updated_at
FROM ai_models am
LEFT JOIN ai_model_predictions amp ON am.id = amp.model_id
GROUP BY am.id, am.name, am.model_type, am.version, am.status, am.framework, am.created_at, am.updated_at;

-- 创建视图：回测任务概览视图
CREATE OR REPLACE VIEW v_backtest_overview AS
SELECT 
    bt.id as task_id,
    bt.strategy_id,
    ts.name as strategy_name,
    ts.strategy_type,
    bt.backtest_type,
    bt.start_date,
    bt.end_date,
    DATEDIFF(bt.end_date, bt.start_date) as duration_days,
    bt.data_source,
    bt.status,
    bt.progress,
    bt.created_at,
    bt.started_at,
    bt.completed_at,
    CASE 
        WHEN bt.completed_at IS NOT NULL AND bt.started_at IS NOT NULL 
        THEN TIMESTAMPDIFF(SECOND, bt.started_at, bt.completed_at)
        ELSE NULL 
    END as execution_time_seconds,
    br.id as result_id
FROM backtest_tasks bt
LEFT JOIN trading_strategies ts ON bt.strategy_id = ts.id
LEFT JOIN backtest_results br ON bt.id = br.task_id;

-- 创建存储过程：清理历史数据
DELIMITER //
CREATE PROCEDURE CleanupHistoryData(
    IN retention_days INT DEFAULT 90
)
BEGIN
    DECLARE cleanup_date DATE;
    SET cleanup_date = DATE_SUB(CURDATE(), INTERVAL retention_days DAY);
    
    -- 清理策略执行历史
    DELETE FROM strategy_execution_history 
    WHERE created_at < cleanup_date;
    
    -- 清理AI模型预测历史
    DELETE FROM ai_model_predictions 
    WHERE created_at < cleanup_date;
    
    -- 清理市场数据历史（保留更长时间用于回测）
    DELETE FROM market_data_history 
    WHERE created_at < DATE_SUB(CURDATE(), INTERVAL (retention_days * 2) DAY);
    
    -- 清理VPP历史数据
    DELETE FROM vpp_data_history 
    WHERE created_at < cleanup_date;
    
    -- 清理已完成的回测任务（保留结果）
    DELETE bt FROM backtest_tasks bt
    LEFT JOIN backtest_results br ON bt.id = br.task_id
    WHERE bt.status = 'COMPLETED' 
    AND bt.completed_at < cleanup_date
    AND br.id IS NOT NULL;
    
    SELECT CONCAT('清理完成，删除了 ', retention_days, ' 天前的历史数据') as message;
END //
DELIMITER ;

-- 创建触发器：自动更新策略性能指标
DELIMITER //
CREATE TRIGGER tr_update_strategy_performance
AFTER INSERT ON strategy_execution_history
FOR EACH ROW
BEGIN
    DECLARE exec_date DATE;
    DECLARE total_exec INT DEFAULT 0;
    DECLARE success_exec INT DEFAULT 0;
    DECLARE calc_success_rate DECIMAL(5,4) DEFAULT 0;
    
    SET exec_date = DATE(NEW.execution_time);
    
    -- 计算当日执行统计
    SELECT 
        COUNT(*),
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END)
    INTO total_exec, success_exec
    FROM strategy_execution_history 
    WHERE strategy_id = NEW.strategy_id 
    AND DATE(execution_time) = exec_date;
    
    -- 计算成功率
    IF total_exec > 0 THEN
        SET calc_success_rate = success_exec / total_exec;
    END IF;
    
    -- 插入或更新性能指标
    INSERT INTO strategy_performance_metrics 
    (strategy_id, metric_date, total_executions, successful_executions, success_rate)
    VALUES (NEW.strategy_id, exec_date, total_exec, success_exec, calc_success_rate)
    ON DUPLICATE KEY UPDATE
        total_executions = total_exec,
        successful_executions = success_exec,
        success_rate = calc_success_rate,
        updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- 创建索引优化
CREATE INDEX idx_strategy_execution_composite ON strategy_execution_history(strategy_id, execution_time, success);
CREATE INDEX idx_ai_prediction_composite ON ai_model_predictions(model_id, prediction_time, confidence_level);
CREATE INDEX idx_market_data_composite ON market_data_history(market_type, trading_date, time_slot);
CREATE INDEX idx_vpp_data_composite ON vpp_data_history(vpp_id, timestamp);

-- 插入示例数据

-- 示例策略数据
INSERT INTO trading_strategies (id, name, vpp_id, strategy_type, config, status, performance_metrics) VALUES
('strategy-001', '基础规则策略', 'vpp-001', 'RULE_BASED', 
 JSON_OBJECT(
   'rules', JSON_ARRAY(
     JSON_OBJECT(
       'conditions', JSON_ARRAY(
         JSON_OBJECT('field', 'marketData.price', 'operator', 'greater_than', 'value', 50)
       ),
       'actions', JSON_ARRAY(
         JSON_OBJECT('type', 'bid_price', 'parameters', JSON_OBJECT('adjustment', -5, 'multiplier', 0.95))
       )
     )
   )
 ), 'ACTIVE',
 JSON_OBJECT('total_executions', 0, 'success_rate', 0, 'average_revenue', 0, 'risk_score', 0)
),
('strategy-002', 'AI价格预测策略', 'vpp-001', 'AI_DRIVEN',
 JSON_OBJECT(
   'model_config', JSON_OBJECT(
     'model_type', 'PRICE_PREDICTION',
     'model_version', '1.0',
     'input_features', JSON_ARRAY('historical_prices', 'weather_data', 'demand_forecast'),
     'output_targets', JSON_ARRAY('predicted_price', 'confidence')
   )
 ), 'TESTING',
 JSON_OBJECT('total_executions', 0, 'success_rate', 0, 'average_revenue', 0, 'risk_score', 0)
);

-- 示例AI模型数据
INSERT INTO ai_models (id, name, model_type, version, input_schema, output_schema, description, status, performance_metrics) VALUES
('model-001', '电价预测模型v1.0', 'PRICE_PREDICTION', '1.0',
 JSON_OBJECT(
   'required', JSON_ARRAY('historical_prices', 'market_conditions'),
   'properties', JSON_OBJECT(
     'historical_prices', JSON_OBJECT('type', 'array', 'items', JSON_OBJECT('type', 'number')),
     'market_conditions', JSON_OBJECT('type', 'object')
   )
 ),
 JSON_OBJECT(
   'properties', JSON_OBJECT(
     'predicted_price', JSON_OBJECT('type', 'number'),
     'confidence', JSON_OBJECT('type', 'number', 'minimum', 0, 'maximum', 1)
   )
 ),
 '基于LSTM的电价预测模型，使用历史价格和市场条件预测未来电价', 'READY',
 JSON_OBJECT('total_predictions', 0, 'average_confidence', 0, 'average_processing_time', 0)
),
('model-002', '需求预测模型v1.0', 'DEMAND_FORECASTING', '1.0',
 JSON_OBJECT(
   'required', JSON_ARRAY('historical_demand', 'time_features'),
   'properties', JSON_OBJECT(
     'historical_demand', JSON_OBJECT('type', 'array'),
     'time_features', JSON_OBJECT('type', 'object')
   )
 ),
 JSON_OBJECT(
   'properties', JSON_OBJECT(
     'predicted_demand', JSON_OBJECT('type', 'number'),
     'confidence_interval', JSON_OBJECT('type', 'object')
   )
 ),
 '基于时间序列的需求预测模型', 'READY',
 JSON_OBJECT('total_predictions', 0, 'average_confidence', 0, 'average_processing_time', 0)
);

-- 示例市场数据
INSERT INTO market_data_history (market_type, trading_date, time_slot, price, volume, demand, supply, data_source) VALUES
('SPOT', '2024-01-01', '00:00-01:00', 45.50, 1000.00, 950.00, 1050.00, 'HISTORICAL_DB'),
('SPOT', '2024-01-01', '01:00-02:00', 42.30, 950.00, 900.00, 1000.00, 'HISTORICAL_DB'),
('SPOT', '2024-01-01', '02:00-03:00', 40.80, 900.00, 850.00, 950.00, 'HISTORICAL_DB'),
('SPOT', '2024-01-01', '08:00-09:00', 65.20, 1500.00, 1450.00, 1550.00, 'HISTORICAL_DB'),
('SPOT', '2024-01-01', '09:00-10:00', 68.90, 1600.00, 1550.00, 1650.00, 'HISTORICAL_DB');

COMMIT;

-- 输出创建完成信息
SELECT 'VPP P1阶段数据库表结构创建完成' as message,
       '包含策略管理、AI模型管理、回测仿真等功能表' as description,
       NOW() as created_at;