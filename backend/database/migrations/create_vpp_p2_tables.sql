-- =====================================================
-- 虚拟电厂与电力交易模块 P2阶段数据库表结构
-- 支持高级交易功能、智能决策系统、用户界面等
-- =====================================================

-- 高级交易配置表
CREATE TABLE IF NOT EXISTS advanced_trading_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_name VARCHAR(100) NOT NULL,
    config_type ENUM('arbitrage', 'optimization', 'dispatch', 'hedge') NOT NULL,
    config_data JSON NOT NULL,
    risk_limits JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_type (config_type),
    INDEX idx_is_active (is_active)
);

-- 套利机会表
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
    id VARCHAR(100) PRIMARY KEY,
    arbitrage_type ENUM('spatial', 'temporal', 'cross_commodity', 'volatility', 'basis') NOT NULL,
    buy_market VARCHAR(50),
    sell_market VARCHAR(50),
    buy_price DECIMAL(10,4),
    sell_price DECIMAL(10,4),
    profit_margin DECIMAL(8,6),
    estimated_profit DECIMAL(12,2),
    risk_score DECIMAL(4,3),
    status ENUM('identified', 'executing', 'executed', 'expired', 'failed') DEFAULT 'identified',
    execution_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL,
    INDEX idx_arbitrage_type (arbitrage_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 价格优化历史表
CREATE TABLE IF NOT EXISTS price_optimization_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vpp_id INT NOT NULL,
    optimization_objective ENUM('profit_maximization', 'risk_minimization', 'sharpe_maximization', 'multi_objective') NOT NULL,
    input_parameters JSON NOT NULL,
    optimization_result JSON NOT NULL,
    pricing_strategy JSON NOT NULL,
    expected_profit DECIMAL(12,2),
    actual_profit DECIMAL(12,2),
    risk_metrics JSON,
    performance_score DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vpp_id) REFERENCES vpps(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_objective (optimization_objective),
    INDEX idx_created_at (created_at)
);

-- 动态调度历史表
CREATE TABLE IF NOT EXISTS dynamic_dispatch_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vpp_id INT NOT NULL,
    dispatch_strategy ENUM('economic', 'security', 'environmental', 'hybrid') NOT NULL,
    resource_status JSON NOT NULL,
    load_forecast JSON NOT NULL,
    market_signals JSON NOT NULL,
    dispatch_plan JSON NOT NULL,
    execution_results JSON,
    efficiency_score DECIMAL(4,3),
    cost_savings DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vpp_id) REFERENCES vpps(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_strategy (dispatch_strategy),
    INDEX idx_created_at (created_at)
);

-- 风险对冲记录表
CREATE TABLE IF NOT EXISTS risk_hedge_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vpp_id INT NOT NULL,
    hedge_types JSON NOT NULL,
    risk_assessment JSON NOT NULL,
    hedge_strategy JSON NOT NULL,
    hedge_instruments JSON NOT NULL,
    hedge_ratio DECIMAL(4,3),
    hedge_results JSON,
    effectiveness_metrics JSON,
    cost DECIMAL(12,2),
    risk_reduction DECIMAL(4,3),
    status ENUM('planned', 'executing', 'active', 'expired', 'closed') DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (vpp_id) REFERENCES vpps(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 强化学习模型表
CREATE TABLE IF NOT EXISTS rl_models (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(100) NOT NULL,
    algorithm_type ENUM('q_learning', 'dqn', 'policy_gradient', 'actor_critic', 'ppo', 'sac') NOT NULL,
    decision_type ENUM('trading_decision', 'dispatch_decision', 'pricing_decision', 'risk_management_decision', 'resource_allocation_decision') NOT NULL,
    model_parameters JSON NOT NULL,
    training_data JSON,
    performance_metrics JSON,
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_algorithm_type (algorithm_type),
    INDEX idx_decision_type (decision_type),
    INDEX idx_is_active (is_active)
);

-- 决策历史表
CREATE TABLE IF NOT EXISTS decision_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vpp_id INT NOT NULL,
    decision_type ENUM('trading_decision', 'dispatch_decision', 'pricing_decision', 'risk_management_decision', 'resource_allocation_decision') NOT NULL,
    algorithm_used VARCHAR(50),
    state_data JSON NOT NULL,
    action_taken JSON NOT NULL,
    reward_received DECIMAL(8,4),
    execution_result JSON,
    confidence_score DECIMAL(4,3),
    learning_mode ENUM('online_learning', 'offline_learning', 'hybrid_learning', 'transfer_learning'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vpp_id) REFERENCES vpps(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_decision_type (decision_type),
    INDEX idx_created_at (created_at)
);

-- 多目标优化结果表
CREATE TABLE IF NOT EXISTS multi_objective_optimization (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vpp_id INT NOT NULL,
    objectives JSON NOT NULL,
    weights JSON NOT NULL,
    algorithm_used ENUM('genetic_algorithm', 'particle_swarm', 'simulated_annealing', 'differential_evolution', 'nsga_ii', 'mopso') NOT NULL,
    pareto_front JSON NOT NULL,
    optimal_solution JSON NOT NULL,
    convergence_metrics JSON,
    execution_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vpp_id) REFERENCES vpps(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_algorithm (algorithm_used),
    INDEX idx_created_at (created_at)
);

-- 自适应参数调整记录表
CREATE TABLE IF NOT EXISTS adaptive_parameter_adjustments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vpp_id INT NOT NULL,
    target_metrics JSON NOT NULL,
    adjustment_strategy VARCHAR(50) NOT NULL,
    performance_trends JSON NOT NULL,
    adjustment_plan JSON NOT NULL,
    adjustment_results JSON,
    validation_results JSON,
    improvement_score DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vpp_id) REFERENCES vpps(id) ON DELETE CASCADE,
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_strategy (adjustment_strategy),
    INDEX idx_created_at (created_at)
);

-- 市场趋势预测表
CREATE TABLE IF NOT EXISTS market_trend_predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    market_type VARCHAR(50) NOT NULL,
    prediction_horizon_hours INT NOT NULL,
    prediction_models JSON NOT NULL,
    prediction_data JSON NOT NULL,
    trend_analysis JSON NOT NULL,
    confidence_level DECIMAL(4,3),
    cross_market_analysis JSON,
    trading_signals JSON,
    actual_data JSON,
    accuracy_score DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_market_type (market_type),
    INDEX idx_prediction_horizon (prediction_horizon_hours),
    INDEX idx_created_at (created_at)
);

-- 强化学习经验回放表
CREATE TABLE IF NOT EXISTS rl_experience_replay (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_id INT NOT NULL,
    state_vector JSON NOT NULL,
    action_id INT NOT NULL,
    reward DECIMAL(8,4) NOT NULL,
    next_state_vector JSON NOT NULL,
    done BOOLEAN DEFAULT false,
    priority DECIMAL(4,3) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES rl_models(id) ON DELETE CASCADE,
    INDEX idx_model_id (model_id),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
);

-- 系统性能监控表
CREATE TABLE IF NOT EXISTS system_performance_monitoring (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(12,4) NOT NULL,
    metric_unit VARCHAR(20),
    threshold_min DECIMAL(12,4),
    threshold_max DECIMAL(12,4),
    alert_level ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_name (service_name),
    INDEX idx_metric_name (metric_name),
    INDEX idx_alert_level (alert_level),
    INDEX idx_created_at (created_at)
);

-- 用户界面配置表
CREATE TABLE IF NOT EXISTS ui_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(100) NOT NULL,
    dashboard_type ENUM('vpp_management', 'strategy_config', 'trading_monitor', 'analytics_report') NOT NULL,
    layout_config JSON NOT NULL,
    widget_config JSON NOT NULL,
    theme_settings JSON,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_dashboard_type (dashboard_type),
    INDEX idx_is_default (is_default)
);

-- 实时警报表
CREATE TABLE IF NOT EXISTS real_time_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_type ENUM('risk_warning', 'performance_alert', 'system_error', 'market_opportunity', 'resource_issue') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    source_service VARCHAR(100) NOT NULL,
    vpp_id INT,
    alert_message TEXT NOT NULL,
    alert_data JSON,
    status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vpp_id) REFERENCES vpps(id) ON DELETE SET NULL,
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_vpp_id (vpp_id),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 视图定义
-- =====================================================

-- 套利机会汇总视图
CREATE OR REPLACE VIEW v_arbitrage_summary AS
SELECT 
    arbitrage_type,
    COUNT(*) as total_opportunities,
    COUNT(CASE WHEN status = 'executed' THEN 1 END) as executed_count,
    AVG(profit_margin) as avg_profit_margin,
    SUM(CASE WHEN status = 'executed' THEN estimated_profit ELSE 0 END) as total_profit,
    AVG(risk_score) as avg_risk_score
FROM arbitrage_opportunities
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY arbitrage_type;

-- VPP智能决策性能视图
CREATE OR REPLACE VIEW v_vpp_decision_performance AS
SELECT 
    v.id as vpp_id,
    v.name as vpp_name,
    dh.decision_type,
    COUNT(*) as total_decisions,
    AVG(dh.reward_received) as avg_reward,
    AVG(dh.confidence_score) as avg_confidence,
    COUNT(CASE WHEN JSON_EXTRACT(dh.execution_result, '$.success') = true THEN 1 END) as successful_decisions
FROM vpps v
JOIN decision_history dh ON v.id = dh.vpp_id
WHERE dh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY v.id, v.name, dh.decision_type;

-- 市场预测准确性视图
CREATE OR REPLACE VIEW v_market_prediction_accuracy AS
SELECT 
    market_type,
    prediction_horizon_hours,
    COUNT(*) as total_predictions,
    AVG(accuracy_score) as avg_accuracy,
    AVG(confidence_level) as avg_confidence,
    COUNT(CASE WHEN accuracy_score >= 0.8 THEN 1 END) as high_accuracy_count
FROM market_trend_predictions
WHERE actual_data IS NOT NULL
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY market_type, prediction_horizon_hours;

-- 系统健康状态视图
CREATE OR REPLACE VIEW v_system_health_status AS
SELECT 
    service_name,
    COUNT(*) as total_metrics,
    COUNT(CASE WHEN alert_level IN ('error', 'critical') THEN 1 END) as error_count,
    COUNT(CASE WHEN alert_level = 'warning' THEN 1 END) as warning_count,
    AVG(metric_value) as avg_metric_value,
    MAX(created_at) as last_update
FROM system_performance_monitoring
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY service_name;

-- =====================================================
-- 存储过程
-- =====================================================

-- 清理过期数据的存储过程
DELIMITER //
CREATE PROCEDURE CleanupExpiredData()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 清理过期的套利机会（30天前）
    DELETE FROM arbitrage_opportunities 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND status IN ('expired', 'failed');
    
    -- 清理旧的决策历史（90天前）
    DELETE FROM decision_history 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- 清理旧的经验回放数据（30天前）
    DELETE FROM rl_experience_replay 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- 清理旧的性能监控数据（7天前）
    DELETE FROM system_performance_monitoring 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- 清理已解决的警报（30天前）
    DELETE FROM real_time_alerts 
    WHERE status = 'resolved' 
      AND resolved_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    COMMIT;
END //
DELIMITER ;

-- 计算VPP综合性能评分的存储过程
DELIMITER //
CREATE PROCEDURE CalculateVPPPerformanceScore(IN vpp_id_param INT, OUT performance_score DECIMAL(4,3))
BEGIN
    DECLARE decision_score DECIMAL(4,3) DEFAULT 0;
    DECLARE trading_score DECIMAL(4,3) DEFAULT 0;
    DECLARE risk_score DECIMAL(4,3) DEFAULT 0;
    
    -- 计算决策性能评分
    SELECT AVG(reward_received) INTO decision_score
    FROM decision_history
    WHERE vpp_id = vpp_id_param
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- 计算交易性能评分
    SELECT AVG(performance_score) INTO trading_score
    FROM price_optimization_history
    WHERE vpp_id = vpp_id_param
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- 计算风险管理评分
    SELECT AVG(risk_reduction) INTO risk_score
    FROM risk_hedge_records
    WHERE vpp_id = vpp_id_param
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- 综合评分（加权平均）
    SET performance_score = COALESCE(decision_score, 0) * 0.4 + 
                           COALESCE(trading_score, 0) * 0.4 + 
                           COALESCE(risk_score, 0) * 0.2;
END //
DELIMITER ;

-- =====================================================
-- 触发器
-- =====================================================

-- 自动更新强化学习模型性能指标的触发器
DELIMITER //
CREATE TRIGGER update_rl_model_performance
AFTER INSERT ON decision_history
FOR EACH ROW
BEGIN
    UPDATE rl_models rm
    SET rm.performance_metrics = JSON_SET(
        COALESCE(rm.performance_metrics, '{}'),
        '$.avg_reward',
        (
            SELECT AVG(dh.reward_received)
            FROM decision_history dh
            WHERE dh.algorithm_used = rm.algorithm_type
              AND dh.decision_type = rm.decision_type
              AND dh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ),
        '$.success_rate',
        (
            SELECT COUNT(CASE WHEN JSON_EXTRACT(dh.execution_result, '$.success') = true THEN 1 END) / COUNT(*)
            FROM decision_history dh
            WHERE dh.algorithm_used = rm.algorithm_type
              AND dh.decision_type = rm.decision_type
              AND dh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ),
        '$.last_updated',
        NOW()
    )
    WHERE rm.algorithm_type = NEW.algorithm_used
      AND rm.decision_type = NEW.decision_type;
END //
DELIMITER ;

-- 自动生成系统警报的触发器
DELIMITER //
CREATE TRIGGER generate_performance_alert
AFTER INSERT ON system_performance_monitoring
FOR EACH ROW
BEGIN
    IF NEW.alert_level IN ('error', 'critical') THEN
        INSERT INTO real_time_alerts (
            alert_type,
            severity,
            source_service,
            alert_message,
            alert_data
        ) VALUES (
            'performance_alert',
            CASE NEW.alert_level 
                WHEN 'error' THEN 'high'
                WHEN 'critical' THEN 'critical'
                ELSE 'medium'
            END,
            NEW.service_name,
            CONCAT('Performance metric ', NEW.metric_name, ' is ', NEW.alert_level, ': ', NEW.metric_value, ' ', COALESCE(NEW.metric_unit, '')),
            JSON_OBJECT(
                'metric_name', NEW.metric_name,
                'metric_value', NEW.metric_value,
                'threshold_min', NEW.threshold_min,
                'threshold_max', NEW.threshold_max
            )
        );
    END IF;
END //
DELIMITER ;

-- =====================================================
-- 索引优化
-- =====================================================

-- 复合索引优化
CREATE INDEX idx_decision_history_composite ON decision_history(vpp_id, decision_type, created_at);
CREATE INDEX idx_arbitrage_opportunities_composite ON arbitrage_opportunities(arbitrage_type, status, created_at);
CREATE INDEX idx_market_predictions_composite ON market_trend_predictions(market_type, prediction_horizon_hours, created_at);
CREATE INDEX idx_performance_monitoring_composite ON system_performance_monitoring(service_name, metric_name, created_at);

-- =====================================================
-- 示例数据插入
-- =====================================================

-- 插入高级交易配置示例
INSERT INTO advanced_trading_config (config_name, config_type, config_data, risk_limits) VALUES
('Default Arbitrage Config', 'arbitrage', 
 JSON_OBJECT(
    'min_profit_margin', 0.02,
    'max_risk_exposure', 0.1,
    'update_frequency', 300
 ),
 JSON_OBJECT(
    'max_position_size', 1000000,
    'max_daily_loss', 50000,
    'max_drawdown', 0.1
 )
),
('Aggressive Optimization Config', 'optimization',
 JSON_OBJECT(
    'objective', 'profit_maximization',
    'time_horizon', 24,
    'update_frequency', 300
 ),
 JSON_OBJECT(
    'max_leverage', 3.0,
    'max_concentration', 0.3
 )
);

-- 插入强化学习模型示例
INSERT INTO rl_models (model_name, algorithm_type, decision_type, model_parameters) VALUES
('Trading DQN Model', 'dqn', 'trading_decision',
 JSON_OBJECT(
    'learning_rate', 0.001,
    'discount_factor', 0.95,
    'exploration_rate', 0.1,
    'batch_size', 32,
    'memory_size', 10000
 )
),
('Dispatch PPO Model', 'ppo', 'dispatch_decision',
 JSON_OBJECT(
    'learning_rate', 0.0003,
    'clip_ratio', 0.2,
    'value_coefficient', 0.5,
    'entropy_coefficient', 0.01
 )
);

-- 插入用户界面配置示例
INSERT INTO ui_configurations (user_id, dashboard_type, layout_config, widget_config, is_default) VALUES
('admin', 'vpp_management',
 JSON_OBJECT(
    'layout', 'grid',
    'columns', 3,
    'rows', 4
 ),
 JSON_ARRAY(
    JSON_OBJECT('type', 'vpp_status', 'position', JSON_OBJECT('x', 0, 'y', 0, 'w', 2, 'h', 1)),
    JSON_OBJECT('type', 'resource_overview', 'position', JSON_OBJECT('x', 2, 'y', 0, 'w', 1, 'h', 2)),
    JSON_OBJECT('type', 'performance_chart', 'position', JSON_OBJECT('x', 0, 'y', 1, 'w', 2, 'h', 2))
 ),
 true
);

COMMIT;