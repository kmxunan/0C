-- 虚拟电厂与电力交易模块数据库表结构
-- P0阶段：资源管理、VPP管理、基础监控
-- 创建时间：2024年
-- 版本：1.0.0

-- ==================== 资源管理相关表 ====================

-- 1. 资源模板表 (vpp_resources)
-- 定义分布式能源资源的基本信息和技术规格
CREATE TABLE IF NOT EXISTS vpp_resources (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '资源ID',
    name VARCHAR(255) NOT NULL COMMENT '资源名称',
    type ENUM('solar', 'wind', 'battery', 'load', 'generator', 'ev_charger', 'heat_pump') NOT NULL COMMENT '资源类型',
    description TEXT COMMENT '资源描述',
    rated_capacity DECIMAL(10,2) NOT NULL COMMENT '额定容量',
    unit VARCHAR(50) DEFAULT 'kW' COMMENT '容量单位',
    technical_specs JSON COMMENT '技术规格参数',
    operational_constraints JSON COMMENT '运行约束条件',
    location VARCHAR(255) COMMENT '安装位置',
    latitude DECIMAL(10,8) COMMENT '纬度',
    longitude DECIMAL(11,8) COMMENT '经度',
    status ENUM('active', 'inactive', 'maintenance', 'decommissioned') DEFAULT 'active' COMMENT '资源状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by VARCHAR(100) COMMENT '创建人',
    updated_by VARCHAR(100) COMMENT '更新人',
    
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_location (location),
    INDEX idx_created_at (created_at),
    INDEX idx_capacity (rated_capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='虚拟电厂资源模板表';

-- 2. 资源实例表 (vpp_resource_instances)
-- 记录资源的实时运行状态和数据
CREATE TABLE IF NOT EXISTS vpp_resource_instances (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '实例ID',
    resource_id INT NOT NULL COMMENT '关联资源ID',
    status ENUM('online', 'offline', 'maintenance', 'error', 'standby') DEFAULT 'offline' COMMENT '运行状态',
    current_output DECIMAL(10,2) DEFAULT 0 COMMENT '当前输出功率',
    available_capacity DECIMAL(10,2) DEFAULT 0 COMMENT '可用容量',
    efficiency DECIMAL(5,2) DEFAULT 100 COMMENT '运行效率百分比',
    real_time_data JSON COMMENT '实时数据',
    last_communication TIMESTAMP NULL COMMENT '最后通信时间',
    error_message TEXT COMMENT '错误信息',
    maintenance_schedule JSON COMMENT '维护计划',
    performance_metrics JSON COMMENT '性能指标',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (resource_id) REFERENCES vpp_resources(id) ON DELETE CASCADE,
    INDEX idx_resource_id (resource_id),
    INDEX idx_status (status),
    INDEX idx_updated_at (updated_at),
    INDEX idx_last_communication (last_communication)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='虚拟电厂资源实例表';

-- ==================== VPP管理相关表 ====================

-- 3. VPP定义表 (vpp_definitions)
-- 定义虚拟电厂的基本信息和配置
CREATE TABLE IF NOT EXISTS vpp_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'VPP ID',
    name VARCHAR(255) NOT NULL COMMENT 'VPP名称',
    description TEXT COMMENT 'VPP描述',
    total_capacity DECIMAL(12,2) DEFAULT 0 COMMENT '总容量',
    available_capacity DECIMAL(12,2) DEFAULT 0 COMMENT '可用容量',
    operational_strategy JSON COMMENT '运营策略配置',
    target_capacity DECIMAL(12,2) COMMENT '目标容量',
    status ENUM('active', 'inactive', 'maintenance', 'suspended') DEFAULT 'inactive' COMMENT 'VPP状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by VARCHAR(100) COMMENT '创建人',
    updated_by VARCHAR(100) COMMENT '更新人',
    
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_total_capacity (total_capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='虚拟电厂定义表';

-- 4. VPP资源关联表 (vpp_resource_associations)
-- 定义VPP与资源的关联关系和配置
CREATE TABLE IF NOT EXISTS vpp_resource_associations (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
    vpp_id INT NOT NULL COMMENT 'VPP ID',
    resource_id INT NOT NULL COMMENT '资源ID',
    allocation_ratio DECIMAL(5,2) DEFAULT 100 COMMENT '分配比例(0-100%)',
    priority INT DEFAULT 1 COMMENT '优先级(1-10)',
    constraints JSON COMMENT '约束条件',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '关联状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES vpp_resources(id) ON DELETE CASCADE,
    UNIQUE KEY uk_vpp_resource (vpp_id, resource_id),
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_resource_id (resource_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='VPP资源关联表';

-- 5. VPP操作日志表 (vpp_operation_logs)
-- 记录VPP的所有操作历史
CREATE TABLE IF NOT EXISTS vpp_operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    vpp_id INT NOT NULL COMMENT 'VPP ID',
    operation_type ENUM('create', 'update', 'delete', 'start', 'stop', 'add_resource', 'remove_resource', 'strategy_change') NOT NULL COMMENT '操作类型',
    operation_details JSON COMMENT '操作详情',
    operator VARCHAR(100) COMMENT '操作人',
    operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    result ENUM('success', 'failure', 'partial') DEFAULT 'success' COMMENT '操作结果',
    error_message TEXT COMMENT '错误信息',
    
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_operation_time (operation_time),
    INDEX idx_result (result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='VPP操作日志表';

-- ==================== 预留扩展表 ====================

-- 6. 交易策略表 (vpp_trading_strategies) - P1阶段使用
-- 定义电力交易策略和规则
CREATE TABLE IF NOT EXISTS vpp_trading_strategies (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '策略ID',
    vpp_id INT NOT NULL COMMENT 'VPP ID',
    strategy_name VARCHAR(255) NOT NULL COMMENT '策略名称',
    strategy_type ENUM('manual', 'automatic', 'hybrid') DEFAULT 'manual' COMMENT '策略类型',
    strategy_config JSON COMMENT '策略配置',
    market_type ENUM('day_ahead', 'intraday', 'balancing', 'ancillary') COMMENT '市场类型',
    status ENUM('active', 'inactive', 'testing') DEFAULT 'inactive' COMMENT '策略状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by VARCHAR(100) COMMENT '创建人',
    
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_strategy_type (strategy_type),
    INDEX idx_market_type (market_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='VPP交易策略表';

-- 7. 交易记录表 (vpp_trading_records) - P1阶段使用
-- 记录所有电力交易的详细信息
CREATE TABLE IF NOT EXISTS vpp_trading_records (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '交易ID',
    vpp_id INT NOT NULL COMMENT 'VPP ID',
    strategy_id INT COMMENT '策略ID',
    trade_type ENUM('buy', 'sell') NOT NULL COMMENT '交易类型',
    market_type ENUM('day_ahead', 'intraday', 'balancing', 'ancillary') NOT NULL COMMENT '市场类型',
    quantity DECIMAL(12,2) NOT NULL COMMENT '交易电量(kWh)',
    price DECIMAL(10,4) NOT NULL COMMENT '交易价格(元/kWh)',
    total_amount DECIMAL(15,2) NOT NULL COMMENT '交易总额',
    trade_time TIMESTAMP NOT NULL COMMENT '交易时间',
    delivery_start TIMESTAMP NOT NULL COMMENT '交割开始时间',
    delivery_end TIMESTAMP NOT NULL COMMENT '交割结束时间',
    status ENUM('pending', 'executed', 'settled', 'cancelled', 'failed') DEFAULT 'pending' COMMENT '交易状态',
    settlement_details JSON COMMENT '结算详情',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (vpp_id) REFERENCES vpp_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES vpp_trading_strategies(id) ON DELETE SET NULL,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_trade_type (trade_type),
    INDEX idx_market_type (market_type),
    INDEX idx_trade_time (trade_time),
    INDEX idx_delivery_start (delivery_start),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='VPP交易记录表';

-- ==================== 初始化数据 ====================

-- 插入示例资源类型配置
INSERT IGNORE INTO vpp_resources (name, type, description, rated_capacity, unit, technical_specs, operational_constraints, location, latitude, longitude, created_by) VALUES
('示例光伏电站', 'solar', '屋顶分布式光伏发电系统', 100.00, 'kW', 
 JSON_OBJECT(
   'panel_type', 'monocrystalline',
   'efficiency', 20.5,
   'tilt_angle', 30,
   'azimuth', 180,
   'inverter_efficiency', 98.5
 ), 
 JSON_OBJECT(
   'min_irradiance', 100,
   'max_temperature', 85,
   'maintenance_interval', 6
 ),
 '园区A栋屋顶', 39.9042, 116.4074, 'system'),

('示例风力发电机', 'wind', '小型风力发电机组', 50.00, 'kW',
 JSON_OBJECT(
   'turbine_type', 'horizontal_axis',
   'cut_in_speed', 3,
   'rated_speed', 12,
   'cut_out_speed', 25,
   'hub_height', 30
 ),
 JSON_OBJECT(
   'min_wind_speed', 3,
   'max_wind_speed', 25,
   'noise_limit', 45
 ),
 '园区北侧空地', 39.9052, 116.4064, 'system'),

('示例储能电池', 'battery', '锂离子储能电池系统', 200.00, 'kWh',
 JSON_OBJECT(
   'battery_type', 'lithium_ion',
   'nominal_voltage', 400,
   'max_charge_rate', 0.5,
   'max_discharge_rate', 1.0,
   'cycle_life', 6000
 ),
 JSON_OBJECT(
   'soc_min', 10,
   'soc_max', 95,
   'temperature_range', JSON_ARRAY(-10, 45)
 ),
 '园区储能站', 39.9032, 116.4084, 'system'),

('示例负荷', 'load', '可调节负荷设备', 80.00, 'kW',
 JSON_OBJECT(
   'load_type', 'hvac',
   'controllability', 'high',
   'response_time', 5,
   'flexibility_range', 30
 ),
 JSON_OBJECT(
   'min_load', 20,
   'max_load', 80,
   'control_duration', 4
 ),
 '园区办公楼', 39.9022, 116.4094, 'system');

-- 插入示例VPP配置
INSERT IGNORE INTO vpp_definitions (name, description, operational_strategy, target_capacity, created_by) VALUES
('示例虚拟电厂', '园区综合能源虚拟电厂示例', 
 JSON_OBJECT(
   'optimization_objective', 'cost_minimization',
   'trading_preference', 'conservative',
   'response_time', 15,
   'forecast_horizon', 24,
   'risk_tolerance', 'medium'
 ),
 500.00, 'system');

-- 创建VPP资源关联示例
INSERT IGNORE INTO vpp_resource_associations (vpp_id, resource_id, allocation_ratio, priority, constraints)
SELECT 
    v.id as vpp_id,
    r.id as resource_id,
    CASE 
        WHEN r.type = 'solar' THEN 90.0
        WHEN r.type = 'wind' THEN 85.0
        WHEN r.type = 'battery' THEN 100.0
        WHEN r.type = 'load' THEN 70.0
        ELSE 80.0
    END as allocation_ratio,
    CASE 
        WHEN r.type = 'battery' THEN 1
        WHEN r.type IN ('solar', 'wind') THEN 2
        WHEN r.type = 'load' THEN 3
        ELSE 4
    END as priority,
    JSON_OBJECT(
        'max_daily_cycles', CASE WHEN r.type = 'battery' THEN 2 ELSE NULL END,
        'min_reserve_capacity', CASE WHEN r.type = 'battery' THEN 20 ELSE NULL END
    ) as constraints
FROM vpp_definitions v
CROSS JOIN vpp_resources r
WHERE v.name = '示例虚拟电厂'
AND r.name LIKE '示例%';

-- 更新VPP总容量
UPDATE vpp_definitions v
SET total_capacity = (
    SELECT COALESCE(SUM(r.rated_capacity * a.allocation_ratio / 100), 0)
    FROM vpp_resource_associations a
    JOIN vpp_resources r ON a.resource_id = r.id
    WHERE a.vpp_id = v.id AND a.status = 'active'
),
available_capacity = (
    SELECT COALESCE(SUM(r.rated_capacity * a.allocation_ratio / 100), 0)
    FROM vpp_resource_associations a
    JOIN vpp_resources r ON a.resource_id = r.id
    WHERE a.vpp_id = v.id AND a.status = 'active'
)
WHERE v.name = '示例虚拟电厂';

-- 插入操作日志示例
INSERT IGNORE INTO vpp_operation_logs (vpp_id, operation_type, operation_details, operator, result)
SELECT 
    v.id,
    'create',
    JSON_OBJECT(
        'action', 'VPP创建',
        'initial_capacity', v.total_capacity,
        'resource_count', (
            SELECT COUNT(*) 
            FROM vpp_resource_associations a 
            WHERE a.vpp_id = v.id
        )
    ),
    'system',
    'success'
FROM vpp_definitions v
WHERE v.name = '示例虚拟电厂';

-- ==================== 视图定义 ====================

-- VPP资源汇总视图
CREATE OR REPLACE VIEW vpp_resource_summary AS
SELECT 
    v.id as vpp_id,
    v.name as vpp_name,
    r.type as resource_type,
    COUNT(r.id) as resource_count,
    SUM(r.rated_capacity * a.allocation_ratio / 100) as allocated_capacity,
    AVG(COALESCE(ri.efficiency, 100)) as avg_efficiency,
    COUNT(CASE WHEN ri.status = 'online' THEN 1 END) as online_count,
    COUNT(CASE WHEN ri.status = 'offline' THEN 1 END) as offline_count
FROM vpp_definitions v
JOIN vpp_resource_associations a ON v.id = a.vpp_id
JOIN vpp_resources r ON a.resource_id = r.id
LEFT JOIN vpp_resource_instances ri ON r.id = ri.resource_id
WHERE a.status = 'active'
GROUP BY v.id, v.name, r.type;

-- VPP状态监控视图
CREATE OR REPLACE VIEW vpp_status_monitor AS
SELECT 
    v.id as vpp_id,
    v.name as vpp_name,
    v.status as vpp_status,
    v.total_capacity,
    v.available_capacity,
    COUNT(a.resource_id) as total_resources,
    COUNT(CASE WHEN ri.status = 'online' THEN 1 END) as online_resources,
    COALESCE(SUM(ri.current_output), 0) as current_total_output,
    COALESCE(SUM(ri.available_capacity), 0) as current_available_capacity,
    COALESCE(AVG(ri.efficiency), 0) as avg_efficiency,
    MAX(ri.last_communication) as last_communication,
    v.updated_at as last_updated
FROM vpp_definitions v
LEFT JOIN vpp_resource_associations a ON v.id = a.vpp_id AND a.status = 'active'
LEFT JOIN vpp_resources r ON a.resource_id = r.id
LEFT JOIN vpp_resource_instances ri ON r.id = ri.resource_id
GROUP BY v.id, v.name, v.status, v.total_capacity, v.available_capacity, v.updated_at;

-- ==================== 存储过程 ====================

-- 更新VPP容量的存储过程
DELIMITER //
CREATE PROCEDURE UpdateVPPCapacity(IN vpp_id_param INT)
BEGIN
    DECLARE total_cap DECIMAL(12,2) DEFAULT 0;
    DECLARE available_cap DECIMAL(12,2) DEFAULT 0;
    
    -- 计算总容量
    SELECT COALESCE(SUM(r.rated_capacity * a.allocation_ratio / 100), 0)
    INTO total_cap
    FROM vpp_resource_associations a
    JOIN vpp_resources r ON a.resource_id = r.id
    WHERE a.vpp_id = vpp_id_param AND a.status = 'active';
    
    -- 计算可用容量
    SELECT COALESCE(SUM(COALESCE(ri.available_capacity, r.rated_capacity) * a.allocation_ratio / 100), 0)
    INTO available_cap
    FROM vpp_resource_associations a
    JOIN vpp_resources r ON a.resource_id = r.id
    LEFT JOIN vpp_resource_instances ri ON r.id = ri.resource_id
    WHERE a.vpp_id = vpp_id_param AND a.status = 'active';
    
    -- 更新VPP容量
    UPDATE vpp_definitions 
    SET total_capacity = total_cap,
        available_capacity = available_cap,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = vpp_id_param;
    
END //
DELIMITER ;

-- ==================== 触发器 ====================

-- 资源关联变更时自动更新VPP容量
DELIMITER //
CREATE TRIGGER tr_vpp_resource_association_update
AFTER INSERT ON vpp_resource_associations
FOR EACH ROW
BEGIN
    CALL UpdateVPPCapacity(NEW.vpp_id);
END //

CREATE TRIGGER tr_vpp_resource_association_update_after_update
AFTER UPDATE ON vpp_resource_associations
FOR EACH ROW
BEGIN
    CALL UpdateVPPCapacity(NEW.vpp_id);
    IF OLD.vpp_id != NEW.vpp_id THEN
        CALL UpdateVPPCapacity(OLD.vpp_id);
    END IF;
END //

CREATE TRIGGER tr_vpp_resource_association_update_after_delete
AFTER DELETE ON vpp_resource_associations
FOR EACH ROW
BEGIN
    CALL UpdateVPPCapacity(OLD.vpp_id);
END //
DELIMITER ;

-- 记录VPP操作日志的触发器
DELIMITER //
CREATE TRIGGER tr_vpp_operation_log_insert
AFTER INSERT ON vpp_definitions
FOR EACH ROW
BEGIN
    INSERT INTO vpp_operation_logs (vpp_id, operation_type, operation_details, operator, result)
    VALUES (NEW.id, 'create', JSON_OBJECT('action', 'VPP创建', 'name', NEW.name), NEW.created_by, 'success');
END //

CREATE TRIGGER tr_vpp_operation_log_update
AFTER UPDATE ON vpp_definitions
FOR EACH ROW
BEGIN
    INSERT INTO vpp_operation_logs (vpp_id, operation_type, operation_details, operator, result)
    VALUES (NEW.id, 'update', JSON_OBJECT('action', 'VPP更新', 'changes', JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status)), NEW.updated_by, 'success');
END //
DELIMITER ;

-- ==================== 索引优化 ====================

-- 复合索引优化查询性能
CREATE INDEX idx_vpp_resource_status ON vpp_resource_associations(vpp_id, status, allocation_ratio);
CREATE INDEX idx_resource_instance_status ON vpp_resource_instances(resource_id, status, current_output);
CREATE INDEX idx_operation_logs_time ON vpp_operation_logs(vpp_id, operation_time DESC);

-- ==================== 完成提示 ====================

SELECT 'VPP数据库表结构创建完成！' as message,
       COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name LIKE 'vpp_%';