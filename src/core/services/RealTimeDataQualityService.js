/**
 * 实时数据质量监控与预警服务
 * 实现数据质量的实时监控、异常检测、自动预警和质量评分
 * 为零碳园区数字孪生系统提供全面的数据质量保障
 */

import { EventEmitter } from 'events';
import logger from '../../shared/utils/logger.js';
import { MATH_CONSTANTS } from '../../shared/constants/MathConstants.js';

const { DATA_QUALITY_CONSTANTS } = MATH_CONSTANTS;

class RealTimeDataQualityService extends EventEmitter {
    constructor() {
        super();
        
        // 数据质量规则
        this.qualityRules = new Map();
        
        // 监控任务
        this.monitoringTasks = new Map();
        
        // 质量指标
        this.qualityMetrics = new Map();
        
        // 异常检测器
        this.anomalyDetectors = new Map();
        
        // 预警配置
        this.alertConfigs = new Map();
        
        // 质量报告
        this.qualityReports = new Map();
        
        // 实时质量状态
        this.realTimeStatus = new Map();
        
        // 质量趋势数据
        this.qualityTrends = new Map();
        
        // 修复建议
        this.repairSuggestions = new Map();
        
        this.startTime = Date.now();
        this.init();
    }
    
    /**
     * 初始化数据质量监控服务
     */
    async init() {
        try {
            logger.info('📊 实时数据质量监控服务启动中...');
            
            // 初始化质量规则
            await this.initializeQualityRules();
            
            // 初始化异常检测器
            await this.initializeAnomalyDetectors();
            
            // 初始化预警配置
            await this.initializeAlertConfigs();
            
            // 启动实时监控
            await this.startRealTimeMonitoring();
            
            // 初始化质量指标
            await this.initializeQualityMetrics();
            
            logger.info('✅ 实时数据质量监控服务启动完成');
            this.emit('quality:ready');
        } catch (error) {
            return false;
        }
    }
    
    async getDetectionData(_detector) {
        // 模拟获取异常检测数据
        const baseData = await this.getTestData('ems_energy_data');
        return baseData.map(record => ({
            ...record,
            timestamp: record.measurement_time,
            value: record.consumption_amount
        }));
    }
    
    detectZScoreAnomalies(data, parameters) {
        const anomalies = [];
        if (data.length < parameters.min_samples) {return anomalies;}
        
        const values = data.map(d => d.value || 0);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        data.forEach((record, index) => {
            const zScore = Math.abs((record.value - mean) / stdDev);
            if (zScore > parameters.threshold) {
                anomalies.push({
                    type: 'statistical_outlier',
                    record_id: record.meter_id || index,
                    value: record.value,
                    z_score: zScore,
                    threshold: parameters.threshold,
                    severity: zScore > parameters.threshold * DATA_QUALITY_CONSTANTS.Z_SCORE_SEVERITY_MULTIPLIER ? 'high' : 'medium',
                    description: `统计异常值检测: Z-Score ${zScore.toFixed(2)} 超过阈值 ${parameters.threshold}`
                });
            }
        });
        
        return anomalies;
    }
    
    detectTrendAnomalies(data, parameters) {
        const anomalies = [];
        if (data.length < parameters.window_size) {return anomalies;}
        
        for (let i = parameters.window_size; i < data.length; i++) {
            const window = data.slice(i - parameters.window_size, i);
            const windowMean = window.reduce((sum, d) => sum + d.value, 0) / window.length;
            const currentValue = data[i].value;
            
            const deviation = Math.abs(currentValue - windowMean) / windowMean;
            if (deviation > parameters.deviation_threshold) {
                anomalies.push({
                    type: 'trend_anomaly',
                    record_id: data[i].meter_id || i,
                    value: currentValue,
                    expected_value: windowMean,
                    deviation,
                    threshold: parameters.deviation_threshold,
                    severity: deviation > parameters.deviation_threshold * DATA_QUALITY_CONSTANTS.TREND_DEVIATION_MULTIPLIER ? 'high' : 'medium',
                    description: `趋势异常检测: 偏差 ${(deviation * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}% 超过阈值 ${(parameters.deviation_threshold * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%`
                });
            }
        }
        
        return anomalies;
    }
    
    detectPatternAnomalies(data, _parameters) {
        const anomalies = [];
        // 简化的模式异常检测
        const values = data.map(d => d.value || 0);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const threshold = mean * DATA_QUALITY_CONSTANTS.PATTERN_THRESHOLD_MULTIPLIER; // 简化阈值
        
        data.forEach((record, index) => {
            if (record.value > threshold) {
                anomalies.push({
                    type: 'pattern_anomaly',
                    record_id: record.meter_id || index,
                    value: record.value,
                    threshold,
                    severity: 'medium',
                    description: `模式异常检测: 值 ${record.value} 超过模式阈值 ${threshold.toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}`
                });
            }
        });
        
        return anomalies;
    }
    
    detectRuleViolations(data, _parameters) {
        const anomalies = [];
        
        data.forEach((record, index) => {
            // 检查业务规则违反
            if (record.value <= 0) {
                anomalies.push({
                    type: 'rule_violation',
                    record_id: record.meter_id || index,
                    value: record.value,
                    rule: 'value_must_be_positive',
                    severity: 'high',
                    description: `业务规则违反: 值必须大于0，当前值为 ${record.value}`
                });
            }
            
            // 检查时间规则
            const recordTime = new Date(record.timestamp).getTime();
            const currentTime = Date.now();
            if (recordTime > currentTime + DATA_QUALITY_CONSTANTS.FUTURE_TIME_TOLERANCE_MS) { // 5分钟未来时间容错
                anomalies.push({
                    type: 'rule_violation',
                    record_id: record.meter_id || index,
                    timestamp: record.timestamp,
                    rule: 'timestamp_cannot_be_future',
                    severity: 'medium',
                    description: `业务规则违反: 时间戳不能是未来时间`
                });
            }
        });
        
        return anomalies;
    }
    
    async evaluateAlertConditions(alertConfig) {
        const conditions = alertConfig.trigger_conditions;
        
        // 检查质量分数条件
        if (conditions.quality_score) {
                const latestCheck = this.realTimeStatus.get('latest_check');
                if (latestCheck && latestCheck.quality_scores) {
                    for (const category of conditions.category || []) {
                        const categoryScore = latestCheck.quality_scores[category];
                        if (categoryScore && this.evaluateCondition(categoryScore.final_score, conditions.quality_score)) {
                            return true;
                        }
                    }
                }
            }
        
        return false;
    }
    
    evaluateCondition(value, condition) {
        switch (condition.operator) {
            case '<':
                return value < condition.value;
            case '<=':
                return value <= condition.value;
            case '>':
                return value > condition.value;
            case '>=':
                return value >= condition.value;
            case '==':
                return value === condition.value;
            case '!=':
                return value !== condition.value;
            default:
                return false;
        }
    }
    
    async triggerAlert(alertConfig) {
        const alert = {
            id: `alert_${Date.now()}`,
            config_id: alertConfig.id,
            name: alertConfig.name,
            severity: alertConfig.severity,
            triggered_at: new Date().toISOString(),
            status: 'active',
            description: alertConfig.description
        };
        
        logger.warn(`🚨 触发预警: ${alert.name} (${alert.severity})`);
        
        // 更新触发统计
        alertConfig.trigger_count++;
        alertConfig.last_triggered = alert.triggered_at;
        
        this.emit('alert:triggered', alert);
        
        return alert;
    }
    
    calculateOverallQualityScore(qualityScores) {
        const categoryWeights = {
            energy: 0.25,
            carbon: 0.30,
            production: 0.20,
            indicators: 0.25
        };
        
        let totalWeight = 0;
        let weightedSum = 0;
        
        for (const [category, scoreData] of Object.entries(qualityScores)) {
            const weight = categoryWeights[category] || 0;
            if (weight > 0 && scoreData.final_score !== undefined) {
                totalWeight += weight;
                weightedSum += scoreData.final_score * weight;
            }
        }
        
        return totalWeight > MATH_CONSTANTS.ZERO ? weightedSum / totalWeight : MATH_CONSTANTS.ZERO;
    }
    
    calculateAnomalyDetectionRate() {
        // 模拟异常检测率计算
        const totalDetections = Array.from(this.anomalyDetectors.values())
            .reduce((sum, detector) => sum + detector.detection_count, 0);
        const totalRecords = DATA_QUALITY_CONSTANTS.MOCK_TOTAL_RECORDS; // 模拟总记录数
        return totalRecords > MATH_CONSTANTS.ZERO ? totalDetections / totalRecords : MATH_CONSTANTS.ZERO;
    }
    
    calculateDataFreshnessScore() {
        // 模拟数据时效性评分计算
        return DATA_QUALITY_CONSTANTS.DATA_FRESHNESS_SCORE;
    }
    
    /**
     * 生成质量报告
     */
    async generateQualityReport() {
        const report = {
            id: `quality_report_${Date.now()}`,
            generated_at: new Date().toISOString(),
            period: {
                start: new Date(Date.now() - DATA_QUALITY_CONSTANTS.HOURS_TO_MS).toISOString(),
                end: new Date().toISOString()
            },
            summary: {
                overall_quality_score: this.qualityMetrics.get('overall_quality_score')?.current_value || 0,
                total_rules_executed: Array.from(this.qualityRules.values())
                    .reduce((sum, rule) => sum + rule.execution_count, 0),
                total_anomalies_detected: Array.from(this.anomalyDetectors.values())
                    .reduce((sum, detector) => sum + detector.detection_count, 0),
                alerts_triggered: Array.from(this.alertConfigs.values())
                    .reduce((sum, config) => sum + config.trigger_count, 0)
            },
            quality_metrics: Object.fromEntries(
                Array.from(this.qualityMetrics.entries()).map(([id, metric]) => [
                    id,
                    {
                        current_value: metric.current_value,
                        target_value: metric.target_value,
                        trend: metric.trend,
                        achievement_rate: metric.target_value > 0 ? 
                            (metric.current_value / metric.target_value) : 0
                    }
                ])
            ),
            recommendations: this.generateQualityRecommendations()
        };
        
        this.qualityReports.set(report.id, report);
        logger.info(`📊 质量报告已生成: ${report.id}`);
        
        return report;
    }
    
    generateQualityRecommendations() {
        const recommendations = [];
        
        // 基于质量指标生成建议
        for (const [metricId, metric] of this.qualityMetrics) {
            if (metric.current_value < metric.target_value * DATA_QUALITY_CONSTANTS.QUALITY_TARGET_THRESHOLD) {
                recommendations.push({
                    type: 'quality_improvement',
                    metric: metricId,
                    priority: 'high',
                    description: `${metric.name}低于目标值90%，建议加强数据质量管控`,
                    suggested_actions: [
                        '增加数据验证规则',
                        '提高数据采集频率',
                        '加强数据源监控'
                    ]
                });
            }
        }
        
        return recommendations;
    }
    
    /**
     * 获取服务状态
     */
    getServiceStatus() {
        return {
            service_name: 'RealTimeDataQualityService',
            status: 'running',
            uptime: Date.now() - this.startTime,
            statistics: {
                quality_rules: this.qualityRules.size,
                anomaly_detectors: this.anomalyDetectors.size,
                alert_configs: this.alertConfigs.size,
                quality_metrics: this.qualityMetrics.size,
                monitoring_tasks: this.monitoringTasks.size
            },
            latest_metrics: Object.fromEntries(
                Array.from(this.qualityMetrics.entries()).map(([id, metric]) => [
                    id,
                    {
                        value: metric.current_value,
                        trend: metric.trend,
                        last_updated: metric.last_updated
                    }
                ])
            )
        };
    }
    
    /**
     * 停止服务
     */
    async stop() {
        logger.info('🛑 停止实时数据质量监控服务...');
        
        // 清理监控任务
        for (const [taskName, task] of this.monitoringTasks) {
            clearInterval(task);
            logger.info(`✅ 已停止监控任务: ${taskName}`);
        }
        
        this.monitoringTasks.clear();
        this.emit('quality:stopped');
        
        logger.info('✅ 实时数据质量监控服务已停止');
    }
    
    /**
     * 初始化数据质量规则
     */
    async initializeQualityRules() {
        const rules = [
            // 能源数据质量规则
            {
                id: 'energy_completeness',
                name: '能源数据完整性',
                category: 'energy',
                data_source: 'ems_energy_data',
                rule_type: 'completeness',
                description: '检查能源消费数据的完整性',
                validation_logic: {
                    required_fields: ['meter_id', 'energy_type', 'consumption_amount', 'measurement_time'],
                    null_tolerance: 0,
                    missing_tolerance: 0.05 // 5%容错率
                },
                thresholds: {
                    excellent: 0.98,
                    good: 0.95,
                    acceptable: 0.90,
                    poor: 0.85
                },
                weight: 0.25,
                enabled: true
            },
            {
                id: 'energy_accuracy',
                name: '能源数据准确性',
                category: 'energy',
                data_source: 'ems_energy_data',
                rule_type: 'accuracy',
                description: '检查能源消费数据的准确性',
                validation_logic: {
                    range_checks: {
                        'consumption_amount': { min: 0, max: 10000 },
                        'measurement_time': { format: 'ISO8601', future_tolerance: 300 }
                    },
                    business_rules: [
                        'consumption_amount > 0',
                        'measurement_time <= current_time + 5_minutes'
                    ],
                    outlier_detection: {
                        method: 'z_score',
                        threshold: 3,
                        window_size: 100
                    }
                },
                thresholds: {
                    excellent: 0.99,
                    good: 0.97,
                    acceptable: 0.93,
                    poor: 0.90
                },
                weight: 0.30,
                enabled: true
            },
            {
                id: 'energy_timeliness',
                name: '能源数据时效性',
                category: 'energy',
                data_source: 'ems_energy_data',
                rule_type: 'timeliness',
                description: '检查能源数据的时效性',
                validation_logic: {
                    max_delay: 300, // 5分钟
                    expected_frequency: 60, // 每分钟
                    delay_calculation: 'current_time - measurement_time'
                },
                thresholds: {
                    excellent: 0.98,
                    good: 0.95,
                    acceptable: 0.90,
                    poor: 0.85
                },
                weight: 0.20,
                enabled: true
            },
            {
                id: 'energy_consistency',
                name: '能源数据一致性',
                category: 'energy',
                data_source: 'ems_energy_data',
                rule_type: 'consistency',
                description: '检查能源数据的一致性',
                validation_logic: {
                    cross_validation: [
                        'sum(sub_meters) == total_meter',
                        'energy_type matches meter_type'
                    ],
                    temporal_consistency: {
                        check_period: '1_hour',
                        variance_threshold: 0.2
                    }
                },
                thresholds: {
                    excellent: 0.97,
                    good: 0.94,
                    acceptable: 0.90,
                    poor: 0.85
                },
                weight: 0.25,
                enabled: true
            },
            
            // 碳排放数据质量规则
            {
                id: 'carbon_completeness',
                name: '碳排放数据完整性',
                category: 'carbon',
                data_source: 'carbon_emissions',
                rule_type: 'completeness',
                description: '检查碳排放计算数据的完整性',
                validation_logic: {
                    required_fields: ['emission_id', 'emission_scope', 'emission_source', 'emission_amount', 'calculation_time'],
                    null_tolerance: 0,
                    missing_tolerance: 0.02
                },
                thresholds: {
                    excellent: 0.99,
                    good: 0.97,
                    acceptable: 0.93,
                    poor: 0.90
                },
                weight: 0.30,
                enabled: true
            },
            {
                id: 'carbon_accuracy',
                name: '碳排放数据准确性',
                category: 'carbon',
                data_source: 'carbon_emissions',
                rule_type: 'accuracy',
                description: '检查碳排放计算结果的准确性',
                validation_logic: {
                    calculation_verification: {
                        recalculate_sample: 0.1, // 重新计算10%样本
                        tolerance: 0.01 // 1%误差容忍
                    },
                    factor_validation: {
                        check_emission_factors: true,
                        validate_calculation_method: true
                    }
                },
                thresholds: {
                    excellent: 0.99,
                    good: 0.97,
                    acceptable: 0.94,
                    poor: 0.90
                },
                weight: 0.35,
                enabled: true
            },
            {
                id: 'carbon_validity',
                name: '碳排放数据有效性',
                category: 'carbon',
                data_source: 'carbon_emissions',
                rule_type: 'validity',
                description: '检查碳排放数据的有效性',
                validation_logic: {
                    scope_validation: {
                        valid_scopes: ['scope1', 'scope2', 'scope3'],
                        scope_completeness: true
                    },
                    source_validation: {
                        valid_sources: ['electricity', 'natural_gas', 'coal', 'diesel', 'gasoline'],
                        source_mapping: true
                    }
                },
                thresholds: {
                    excellent: 0.98,
                    good: 0.95,
                    acceptable: 0.92,
                    poor: 0.88
                },
                weight: 0.20,
                enabled: true
            },
            {
                id: 'carbon_traceability',
                name: '碳排放数据可追溯性',
                category: 'carbon',
                data_source: 'carbon_emissions',
                rule_type: 'traceability',
                description: '检查碳排放数据的可追溯性',
                validation_logic: {
                    audit_trail: {
                        required_metadata: ['calculation_method', 'emission_factor_source', 'data_source'],
                        version_control: true
                    },
                    lineage_validation: {
                        source_data_linkage: true,
                        calculation_steps: true
                    }
                },
                thresholds: {
                    excellent: 0.96,
                    good: 0.93,
                    acceptable: 0.88,
                    poor: 0.83
                },
                weight: 0.15,
                enabled: true
            },
            
            // 生产数据质量规则
            {
                id: 'production_completeness',
                name: '生产数据完整性',
                category: 'production',
                data_source: 'mes_production_data',
                rule_type: 'completeness',
                description: '检查生产数据的完整性',
                validation_logic: {
                    required_fields: ['enterprise_id', 'product_code', 'production_volume', 'production_date'],
                    null_tolerance: 0,
                    missing_tolerance: 0.03
                },
                thresholds: {
                    excellent: 0.98,
                    good: 0.95,
                    acceptable: 0.91,
                    poor: 0.87
                },
                weight: 0.25,
                enabled: true
            },
            {
                id: 'production_consistency',
                name: '生产数据一致性',
                category: 'production',
                data_source: 'mes_production_data',
                rule_type: 'consistency',
                description: '检查生产数据的一致性',
                validation_logic: {
                    cross_system_validation: [
                        'production_volume matches inventory_change',
                        'enterprise_id exists in enterprise_registry'
                    ],
                    temporal_consistency: {
                        check_period: '1_day',
                        variance_threshold: 0.15
                    }
                },
                thresholds: {
                    excellent: 0.96,
                    good: 0.93,
                    acceptable: 0.89,
                    poor: 0.84
                },
                weight: 0.30,
                enabled: true
            },
            
            // 国家指标数据质量规则
            {
                id: 'indicator_accuracy',
                name: '国家指标准确性',
                category: 'indicators',
                data_source: 'national_indicators',
                rule_type: 'accuracy',
                description: '检查国家指标计算的准确性',
                validation_logic: {
                    calculation_verification: {
                        recalculate_sample: 0.2,
                        tolerance: 0.005
                    },
                    benchmark_comparison: {
                        compare_with_targets: true,
                        historical_trend_check: true
                    }
                },
                thresholds: {
                    excellent: 0.995,
                    good: 0.99,
                    acceptable: 0.98,
                    poor: 0.95
                },
                weight: 0.40,
                enabled: true
            },
            {
                id: 'indicator_compliance',
                name: '国家指标合规性',
                category: 'indicators',
                data_source: 'national_indicators',
                rule_type: 'compliance',
                description: '检查国家指标的合规性',
                validation_logic: {
                    standard_compliance: {
                        check_calculation_method: true,
                        validate_data_sources: true,
                        verify_reporting_format: true
                    },
                    regulatory_requirements: [
                        'calculation_follows_national_standard',
                        'data_retention_compliant',
                        'audit_trail_complete'
                    ]
                },
                thresholds: {
                    excellent: 1.0,
                    good: 0.98,
                    acceptable: 0.95,
                    poor: 0.90
                },
                weight: 0.35,
                enabled: true
            }
        ];
        
        for (const rule of rules) {
            this.qualityRules.set(rule.id, {
                ...rule,
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                execution_count: 0,
                last_execution: null,
                status: 'active'
            });
        }
        
        logger.info(`📋 已初始化 ${this.qualityRules.size} 个数据质量规则`);
    }
    
    /**
     * 初始化异常检测器
     */
    async initializeAnomalyDetectors() {
        const detectors = [
            {
                id: 'statistical_outlier',
                name: '统计异常检测',
                type: 'statistical',
                description: '基于统计方法检测数据异常',
                algorithm: 'z_score',
                parameters: {
                    threshold: 3,
                    window_size: 100,
                    min_samples: 30
                },
                applicable_data_types: ['numeric'],
                sensitivity: 'medium'
            },
            {
                id: 'trend_anomaly',
                name: '趋势异常检测',
                type: 'trend',
                description: '检测数据趋势异常',
                algorithm: 'moving_average_deviation',
                parameters: {
                    window_size: 24,
                    deviation_threshold: 0.3,
                    trend_sensitivity: 0.1
                },
                applicable_data_types: ['time_series'],
                sensitivity: 'high'
            },
            {
                id: 'pattern_anomaly',
                name: '模式异常检测',
                type: 'pattern',
                description: '检测数据模式异常',
                algorithm: 'isolation_forest',
                parameters: {
                    contamination: 0.1,
                    n_estimators: 100,
                    max_samples: 256
                },
                applicable_data_types: ['multivariate'],
                sensitivity: 'medium'
            },
            {
                id: 'business_rule_violation',
                name: '业务规则违反检测',
                type: 'rule_based',
                description: '检测违反业务规则的数据',
                algorithm: 'rule_engine',
                parameters: {
                    rule_evaluation: 'strict',
                    violation_tolerance: 0
                },
                applicable_data_types: ['all'],
                sensitivity: 'high'
            }
        ];
        
        for (const detector of detectors) {
            this.anomalyDetectors.set(detector.id, {
                ...detector,
                created_at: new Date().toISOString(),
                detection_count: 0,
                last_detection: null,
                status: 'active'
            });
        }
        
        logger.info(`🔍 已初始化 ${this.anomalyDetectors.size} 个异常检测器`);
    }
    
    /**
     * 初始化预警配置
     */
    async initializeAlertConfigs() {
        const configs = [
            {
                id: 'critical_quality_degradation',
                name: '关键质量下降预警',
                severity: 'critical',
                description: '数据质量严重下降时触发',
                trigger_conditions: {
                    quality_score: { operator: '<', value: 0.85 },
                    category: ['energy', 'carbon', 'indicators'],
                    duration: 300 // 5分钟
                },
                notification_channels: ['email', 'sms', 'dashboard'],
                escalation_rules: {
                    level_1: { delay: 0, recipients: ['quality_team'] },
                    level_2: { delay: 600, recipients: ['quality_manager'] },
                    level_3: { delay: 1800, recipients: ['system_admin'] }
                },
                auto_actions: [
                    'increase_monitoring_frequency',
                    'trigger_data_validation',
                    'generate_quality_report'
                ]
            },
            {
                id: 'anomaly_detection_alert',
                name: '异常检测预警',
                severity: 'high',
                description: '检测到数据异常时触发',
                trigger_conditions: {
                    anomaly_count: { operator: '>=', value: 5 },
                    time_window: 600, // 10分钟
                    anomaly_types: ['statistical_outlier', 'trend_anomaly']
                },
                notification_channels: ['email', 'dashboard'],
                escalation_rules: {
                    level_1: { delay: 0, recipients: ['data_analyst'] },
                    level_2: { delay: 900, recipients: ['quality_team'] }
                },
                auto_actions: [
                    'detailed_anomaly_analysis',
                    'data_source_health_check'
                ]
            },
            {
                id: 'compliance_violation',
                name: '合规性违反预警',
                severity: 'high',
                description: '检测到合规性违反时触发',
                trigger_conditions: {
                    compliance_score: { operator: '<', value: 0.95 },
                    category: ['indicators'],
                    violation_type: ['calculation_method', 'data_retention']
                },
                notification_channels: ['email', 'sms'],
                escalation_rules: {
                    level_1: { delay: 0, recipients: ['compliance_officer'] },
                    level_2: { delay: 300, recipients: ['legal_team'] }
                },
                auto_actions: [
                    'compliance_audit_trigger',
                    'violation_documentation'
                ]
            },
            {
                id: 'data_freshness_warning',
                name: '数据时效性预警',
                severity: 'medium',
                description: '数据更新延迟时触发',
                trigger_conditions: {
                    data_delay: { operator: '>', value: 600 }, // 10分钟
                    data_sources: ['ems_energy_data', 'mes_production_data']
                },
                notification_channels: ['dashboard'],
                escalation_rules: {
                    level_1: { delay: 0, recipients: ['data_team'] }
                },
                auto_actions: [
                    'data_source_connectivity_check',
                    'retry_data_collection'
                ]
            }
        ];
        
        for (const config of configs) {
            this.alertConfigs.set(config.id, {
                ...config,
                created_at: new Date().toISOString(),
                trigger_count: 0,
                last_triggered: null,
                status: 'active'
            });
        }
        
        logger.info(`🚨 已初始化 ${this.alertConfigs.size} 个预警配置`);
    }
    
    /**
     * 启动实时监控
     */
    async startRealTimeMonitoring() {
        // 实时质量检查任务
        const realTimeQualityTask = setInterval(async () => {
            await this.performRealTimeQualityCheck();
        }, MATH_CONSTANTS.SIXTY * MATH_CONSTANTS.MILLISECONDS_PER_SECOND); // 每分钟
        
        // 异常检测任务
        const anomalyDetectionTask = setInterval(async () => {
            await this.performAnomalyDetection();
        }, MATH_CONSTANTS.FIVE * MATH_CONSTANTS.SIXTY * MATH_CONSTANTS.MILLISECONDS_PER_SECOND); // 每5分钟
        
        // 质量趋势分析任务
        const trendAnalysisTask = setInterval(async () => {
            await this.performTrendAnalysis();
        }, MATH_CONSTANTS.FIFTEEN * MATH_CONSTANTS.SIXTY * MATH_CONSTANTS.MILLISECONDS_PER_SECOND); // 每15分钟
        
        // 预警检查任务
        const alertCheckTask = setInterval(async () => {
            await this.checkAlertConditions();
        }, MATH_CONSTANTS.THIRTY * MATH_CONSTANTS.MILLISECONDS_PER_SECOND); // 每30秒
        
        this.monitoringTasks.set('real_time_quality', realTimeQualityTask);
        this.monitoringTasks.set('anomaly_detection', anomalyDetectionTask);
        this.monitoringTasks.set('trend_analysis', trendAnalysisTask);
        this.monitoringTasks.set('alert_check', alertCheckTask);
        
        logger.info('🔄 实时数据质量监控任务已启动');
    }
    
    /**
     * 初始化质量指标
     */
    async initializeQualityMetrics() {
        const metrics = [
            {
                id: 'overall_quality_score',
                name: '整体质量评分',
                description: '系统整体数据质量评分',
                calculation_method: 'weighted_average',
                target_value: 0.95,
                unit: 'score',
                category: 'overall'
            },
            {
                id: 'energy_data_quality',
                name: '能源数据质量',
                description: '能源数据质量评分',
                calculation_method: 'category_average',
                target_value: 0.96,
                unit: 'score',
                category: 'energy'
            },
            {
                id: 'carbon_data_quality',
                name: '碳排放数据质量',
                description: '碳排放数据质量评分',
                calculation_method: 'category_average',
                target_value: 0.98,
                unit: 'score',
                category: 'carbon'
            },
            {
                id: 'production_data_quality',
                name: '生产数据质量',
                description: '生产数据质量评分',
                calculation_method: 'category_average',
                target_value: 0.94,
                unit: 'score',
                category: 'production'
            },
            {
                id: 'indicator_data_quality',
                name: '国家指标数据质量',
                description: '国家指标数据质量评分',
                calculation_method: 'category_average',
                target_value: 0.99,
                unit: 'score',
                category: 'indicators'
            },
            {
                id: 'anomaly_detection_rate',
                name: '异常检测率',
                description: '数据异常检测率',
                calculation_method: 'percentage',
                target_value: 0.02,
                unit: 'percentage',
                category: 'monitoring'
            },
            {
                id: 'data_freshness_score',
                name: '数据时效性评分',
                description: '数据时效性评分',
                calculation_method: 'timeliness_average',
                target_value: 0.97,
                unit: 'score',
                category: 'timeliness'
            }
        ];
        
        for (const metric of metrics) {
            this.qualityMetrics.set(metric.id, {
                ...metric,
                current_value: 0,
                last_updated: new Date().toISOString(),
                trend: 'stable',
                history: []
            });
        }
        
        logger.info(`📈 已初始化 ${this.qualityMetrics.size} 个质量指标`);
    }
    
    /**
     * 执行实时质量检查
     */
    async performRealTimeQualityCheck() {
        logger.info('🔍 开始实时质量检查...');
        
        const checkResults = {
            timestamp: new Date().toISOString(),
            total_rules_checked: 0,
            passed_rules: 0,
            failed_rules: 0,
            quality_scores: {},
            issues_found: []
        };
        
        // 执行所有启用的质量规则
        for (const [ruleId, rule] of this.qualityRules) {
            if (!rule.enabled) {continue;}
            
            try {
                const ruleResult = await this.executeQualityRule(rule);
                checkResults.total_rules_checked++;
                
                if (ruleResult.passed) {
                    checkResults.passed_rules++;
                } else {
                    checkResults.failed_rules++;
                    checkResults.issues_found.push({
                        rule_id: ruleId,
                        rule_name: rule.name,
                        issue_type: ruleResult.issue_type,
                        severity: ruleResult.severity,
                        description: ruleResult.description,
                        affected_records: ruleResult.affected_records
                    });
                }
                
                // 更新质量分数
                if (!checkResults.quality_scores[rule.category]) {
                    checkResults.quality_scores[rule.category] = {
                        total_weight: 0,
                        weighted_score: 0,
                        rule_count: 0
                    };
                }
                
                checkResults.quality_scores[rule.category].total_weight += rule.weight;
                checkResults.quality_scores[rule.category].weighted_score += ruleResult.score * rule.weight;
                checkResults.quality_scores[rule.category].rule_count++;
                
                // 更新规则执行统计
                rule.execution_count++;
                rule.last_execution = new Date().toISOString();
                
            } catch (error) {
                logger.error(`质量规则执行失败 ${ruleId}:`, error);
                checkResults.issues_found.push({
                    rule_id: ruleId,
                    rule_name: rule.name,
                    issue_type: 'execution_error',
                    severity: 'high',
                    description: `规则执行失败: ${error.message}`,
                    affected_records: 0
                });
            }
        }
        
        // 计算分类质量分数
        for (const [_category, scoreData] of Object.entries(checkResults.quality_scores)) {
            if (scoreData.total_weight > 0) {
                scoreData.final_score = scoreData.weighted_score / scoreData.total_weight;
            } else {
                scoreData.final_score = 0;
            }
        }
        
        // 更新实时状态
        this.realTimeStatus.set('latest_check', checkResults);
        
        // 更新质量指标
        await this.updateQualityMetrics(checkResults);
        
        logger.info(`✅ 实时质量检查完成，检查了 ${checkResults.total_rules_checked} 个规则，发现 ${checkResults.issues_found.length} 个问题`);
        this.emit('quality:check_completed', checkResults);
        
        return checkResults;
    }
    
    /**
     * 执行质量规则
     * @param {Object} rule 质量规则
     * @returns {Object} 规则执行结果
     */
    async executeQualityRule(rule) {
        let result = {
            rule_id: rule.id,
            executed_at: new Date().toISOString(),
            passed: false,
            score: 0,
            issue_type: null,
            severity: 'low',
            description: '',
            affected_records: 0,
            details: {}
        };
        
        try {
            // 获取测试数据（模拟）
            const testData = await this.getTestData(rule.data_source);
            
            switch (rule.rule_type) {
                case 'completeness':
                    result = await this.checkCompleteness(rule, testData, result);
                    break;
                case 'accuracy':
                    result = await this.checkAccuracy(rule, testData, result);
                    break;
                case 'timeliness':
                    result = await this.checkTimeliness(rule, testData, result);
                    break;
                case 'consistency':
                    result = await this.checkConsistency(rule, testData, result);
                    break;
                case 'validity':
                    result = await this.checkValidity(rule, testData, result);
                    break;
                case 'traceability':
                    result = await this.checkTraceability(rule, testData, result);
                    break;
                case 'compliance':
                    result = await this.checkCompliance(rule, testData, result);
                    break;
                default:
                    throw new Error(`不支持的规则类型: ${rule.rule_type}`);
            }
            
            // 根据分数确定是否通过
            result.passed = result.score >= rule.thresholds.acceptable;
            
            // 确定严重程度
            if (result.score >= rule.thresholds.excellent) {
                result.severity = 'info';
            } else if (result.score >= rule.thresholds.good) {
                result.severity = 'low';
            } else if (result.score >= rule.thresholds.acceptable) {
                result.severity = 'medium';
            } else {
                result.severity = 'high';
            }
            
        } catch (error) {
            result.passed = false;
            result.score = 0;
            result.issue_type = 'execution_error';
            result.severity = 'high';
            result.description = `规则执行错误: ${error.message}`;
        }
        
        return result;
    }
    
    /**
     * 检查数据完整性
     */
    async checkCompleteness(rule, testData, result) {
        const validation = rule.validation_logic;
        const totalRecords = testData.length;
        let completeRecords = 0;
        const missingFields = {};
        
        for (const record of testData) {
            let recordComplete = true;
            
            for (const field of validation.required_fields) {
                if (!record[field] || record[field] === null || record[field] === undefined) {
                    recordComplete = false;
                    missingFields[field] = (missingFields[field] || 0) + 1;
                }
            }
            
            if (recordComplete) {
                completeRecords++;
            }
        }
        
        const completenessRate = totalRecords > 0 ? completeRecords / totalRecords : 0;
        
        result.score = completenessRate;
        result.affected_records = totalRecords - completeRecords;
        result.details = {
            total_records: totalRecords,
            complete_records: completeRecords,
            completeness_rate: completenessRate,
            missing_fields: missingFields
        };
        
        if (completenessRate < validation.missing_tolerance) {
            result.issue_type = 'completeness_violation';
            result.description = `数据完整性不足: ${(completenessRate * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%，低于要求的 ${((1 - validation.missing_tolerance) * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%`;
        }
        
        return result;
    }
    
    /**
     * 检查数据准确性
     */
    async checkAccuracy(rule, testData, result) {
        const validation = rule.validation_logic;
        let accurateRecords = 0;
        let rangeViolations = 0;
        let businessRuleViolations = 0;
        let outliers = 0;
        
        for (const record of testData) {
            let recordAccurate = true;
            
            // 范围检查
            if (validation.range_checks) {
                for (const [field, range] of Object.entries(validation.range_checks)) {
                    const value = record[field];
                    if (value !== null && value !== undefined) {
                        if ((range.min !== undefined && value < range.min) ||
                            (range.max !== undefined && value > range.max)) {
                            recordAccurate = false;
                            rangeViolations++;
                        }
                    }
                }
            }
            
            // 业务规则检查
            if (validation.business_rules) {
                for (const rule of validation.business_rules) {
                    if (!this.evaluateBusinessRule(rule, record)) {
                        recordAccurate = false;
                        businessRuleViolations++;
                    }
                }
            }
            
            if (recordAccurate) {
                accurateRecords++;
            }
        }
        
        // 异常值检测
        if (validation.outlier_detection) {
            outliers = await this.detectOutliers(testData, validation.outlier_detection);
        }
        
        const accuracyRate = testData.length > 0 ? accurateRecords / testData.length : 0;
        
        result.score = accuracyRate;
        result.affected_records = testData.length - accurateRecords;
        result.details = {
            total_records: testData.length,
            accurate_records: accurateRecords,
            accuracy_rate: accuracyRate,
            range_violations: rangeViolations,
            business_rule_violations: businessRuleViolations,
            outliers
        };
        
        if (accuracyRate < rule.thresholds.acceptable) {
            result.issue_type = 'accuracy_violation';
            result.description = `数据准确性不足: ${(accuracyRate * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%`;
        }
        
        return result;
    }
    
    /**
     * 检查数据时效性
     */
    async checkTimeliness(rule, testData, result) {
        const validation = rule.validation_logic;
        const currentTime = Date.now();
        let timelyRecords = 0;
        let totalDelay = 0;
        let maxDelay = 0;
        
        for (const record of testData) {
            const measurementTime = new Date(record.measurement_time || record.timestamp).getTime();
            const delay = (currentTime - measurementTime) / MATH_CONSTANTS.MILLISECONDS_PER_SECOND; // 秒
            
            totalDelay += delay;
            maxDelay = Math.max(maxDelay, delay);
            
            if (delay <= validation.max_delay) {
                timelyRecords++;
            }
        }
        
        const timelinessRate = testData.length > 0 ? timelyRecords / testData.length : 0;
        const avgDelay = testData.length > 0 ? totalDelay / testData.length : 0;
        
        result.score = timelinessRate;
        result.affected_records = testData.length - timelyRecords;
        result.details = {
            total_records: testData.length,
            timely_records: timelyRecords,
            timeliness_rate: timelinessRate,
            average_delay: avgDelay,
            max_delay: maxDelay,
            max_allowed_delay: validation.max_delay
        };
        
        if (timelinessRate < rule.thresholds.acceptable) {
            result.issue_type = 'timeliness_violation';
            result.description = `数据时效性不足: ${(timelinessRate * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%，平均延迟 ${avgDelay.toFixed(MATH_CONSTANTS.DECIMAL_PLACES)} 秒`;
        }
        
        return result;
    }
    
    /**
     * 检查数据一致性
     */
    async checkConsistency(rule, testData, result) {
        const validation = rule.validation_logic;
        let consistentRecords = 0;
        let crossValidationFailures = 0;
        let temporalInconsistencies = 0;
        
        for (const record of testData) {
            let recordConsistent = true;
            
            // 交叉验证
            if (validation.cross_validation) {
                for (const validationRule of validation.cross_validation) {
                    if (!this.evaluateConsistencyRule(validationRule, record)) {
                        recordConsistent = false;
                        crossValidationFailures++;
                    }
                }
            }
            
            if (recordConsistent) {
                consistentRecords++;
            }
        }
        
        // 时间一致性检查
        if (validation.temporal_consistency) {
            temporalInconsistencies = await this.checkTemporalConsistency(
                testData, 
                validation.temporal_consistency
            );
        }
        
        const consistencyRate = testData.length > 0 ? consistentRecords / testData.length : 0;
        
        result.score = consistencyRate;
        result.affected_records = testData.length - consistentRecords;
        result.details = {
            total_records: testData.length,
            consistent_records: consistentRecords,
            consistency_rate: consistencyRate,
            cross_validation_failures: crossValidationFailures,
            temporal_inconsistencies: temporalInconsistencies
        };
        
        if (consistencyRate < rule.thresholds.acceptable) {
            result.issue_type = 'consistency_violation';
            result.description = `数据一致性不足: ${(consistencyRate * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%`;
        }
        
        return result;
    }
    
    /**
     * 检查数据有效性
     */
    async checkValidity(rule, testData, result) {
        const validation = rule.validation_logic;
        let validRecords = 0;
        let scopeViolations = 0;
        let sourceViolations = 0;
        
        for (const record of testData) {
            let recordValid = true;
            
            // 范围验证
            if (validation.scope_validation) {
                const scope = record.emission_scope || record.scope;
                if (scope && !validation.scope_validation.valid_scopes.includes(scope)) {
                    recordValid = false;
                    scopeViolations++;
                }
            }
            
            // 来源验证
            if (validation.source_validation) {
                const source = record.emission_source || record.source;
                if (source && !validation.source_validation.valid_sources.includes(source)) {
                    recordValid = false;
                    sourceViolations++;
                }
            }
            
            if (recordValid) {
                validRecords++;
            }
        }
        
        const validityRate = testData.length > 0 ? validRecords / testData.length : 0;
        
        result.score = validityRate;
        result.affected_records = testData.length - validRecords;
        result.details = {
            total_records: testData.length,
            valid_records: validRecords,
            validity_rate: validityRate,
            scope_violations: scopeViolations,
            source_violations: sourceViolations
        };
        
        if (validityRate < rule.thresholds.acceptable) {
            result.issue_type = 'validity_violation';
            result.description = `数据有效性不足: ${(validityRate * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%`;
        }
        
        return result;
    }
    
    /**
     * 检查数据可追溯性
     */
    async checkTraceability(rule, testData, result) {
        const validation = rule.validation_logic;
        let traceableRecords = 0;
        let missingMetadata = 0;
        let missingLineage = 0;
        
        for (const record of testData) {
            let recordTraceable = true;
            
            // 审计轨迹检查
            if (validation.audit_trail) {
                for (const field of validation.audit_trail.required_metadata) {
                    if (!record[field]) {
                        recordTraceable = false;
                        missingMetadata++;
                        break;
                    }
                }
            }
            
            // 血缘验证
            if (validation.lineage_validation) {
                if (!record.source_data_id || !record.calculation_steps) {
                    recordTraceable = false;
                    missingLineage++;
                }
            }
            
            if (recordTraceable) {
                traceableRecords++;
            }
        }
        
        const traceabilityRate = testData.length > 0 ? traceableRecords / testData.length : 0;
        
        result.score = traceabilityRate;
        result.affected_records = testData.length - traceableRecords;
        result.details = {
            total_records: testData.length,
            traceable_records: traceableRecords,
            traceability_rate: traceabilityRate,
            missing_metadata: missingMetadata,
            missing_lineage: missingLineage
        };
        
        if (traceabilityRate < rule.thresholds.acceptable) {
            result.issue_type = 'traceability_violation';
            result.description = `数据可追溯性不足: ${(traceabilityRate * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%`;
        }
        
        return result;
    }
    
    /**
     * 检查合规性
     */
    async checkCompliance(rule, testData, result) {
        const validation = rule.validation_logic;
        let compliantRecords = 0;
        let standardViolations = 0;
        let regulatoryViolations = 0;
        
        for (const record of testData) {
            let recordCompliant = true;
            
            // 标准合规检查
            if (validation.standard_compliance) {
                if (validation.standard_compliance.check_calculation_method) {
                    if (!record.calculation_method || 
                        !this.isValidCalculationMethod(record.calculation_method)) {
                        recordCompliant = false;
                        standardViolations++;
                    }
                }
            }
            
            // 监管要求检查
            if (validation.regulatory_requirements) {
                for (const requirement of validation.regulatory_requirements) {
                    if (!this.evaluateRegulatoryRequirement(requirement, record)) {
                        recordCompliant = false;
                        regulatoryViolations++;
                        break;
                    }
                }
            }
            
            if (recordCompliant) {
                compliantRecords++;
            }
        }
        
        const complianceRate = testData.length > 0 ? compliantRecords / testData.length : 0;
        
        result.score = complianceRate;
        result.affected_records = testData.length - compliantRecords;
        result.details = {
            total_records: testData.length,
            compliant_records: compliantRecords,
            compliance_rate: complianceRate,
            standard_violations: standardViolations,
            regulatory_violations: regulatoryViolations
        };
        
        if (complianceRate < rule.thresholds.acceptable) {
            result.issue_type = 'compliance_violation';
            result.description = `合规性不足: ${(complianceRate * DATA_QUALITY_CONSTANTS.QUALITY_SCORE_MULTIPLIER).toFixed(MATH_CONSTANTS.DECIMAL_PLACES)}%`;
        }
        
        return result;
    }
    
    /**
     * 执行异常检测
     */
    async performAnomalyDetection() {
        logger.info('🔍 开始异常检测...');
        
        const detectionResults = {
            timestamp: new Date().toISOString(),
            total_detectors: this.anomalyDetectors.size,
            anomalies_found: [],
            detection_summary: {}
        };
        
        for (const [detectorId, detector] of this.anomalyDetectors) {
            if (detector.status !== 'active') {continue;}
            
            try {
                const anomalies = await this.runAnomalyDetector(detector);
                
                detectionResults.anomalies_found.push(...anomalies);
                detectionResults.detection_summary[detectorId] = {
                    detector_name: detector.name,
                    anomalies_count: anomalies.length,
                    execution_time: new Date().toISOString()
                };
                
                detector.detection_count += anomalies.length;
                if (anomalies.length > 0) {
                    detector.last_detection = new Date().toISOString();
                }
                
            } catch (error) {
                logger.error(`异常检测器执行失败 ${detectorId}:`, error);
                detectionResults.detection_summary[detectorId] = {
                    detector_name: detector.name,
                    error: error.message,
                    execution_time: new Date().toISOString()
                };
            }
        }
        
        logger.info(`✅ 异常检测完成，发现 ${detectionResults.anomalies_found.length} 个异常`);
        this.emit('anomaly:detection_completed', detectionResults);
        
        return detectionResults;
    }
    
    /**
     * 运行异常检测器
     */
    async runAnomalyDetector(detector) {
        const anomalies = [];
        
        // 获取检测数据
        const detectionData = await this.getDetectionData(detector);
        
        switch (detector.algorithm) {
            case 'z_score':
                anomalies.push(...this.detectZScoreAnomalies(detectionData, detector.parameters));
                break;
            case 'moving_average_deviation':
                anomalies.push(...this.detectTrendAnomalies(detectionData, detector.parameters));
                break;
            case 'isolation_forest':
                anomalies.push(...this.detectPatternAnomalies(detectionData, detector.parameters));
                break;
            case 'rule_engine':
                anomalies.push(...this.detectRuleViolations(detectionData, detector.parameters));
                break;
        }
        
        return anomalies.map(anomaly => ({
            ...anomaly,
            detector_id: detector.id,
            detector_name: detector.name,
            detected_at: new Date().toISOString()
        }));
    }
    
    /**
     * 检查预警条件
     */
    async checkAlertConditions() {
        for (const [alertId, alertConfig] of this.alertConfigs) {
            if (alertConfig.status !== 'active') {continue;}
            
            try {
                const shouldTrigger = await this.evaluateAlertConditions(alertConfig);
                
                if (shouldTrigger) {
                    await this.triggerAlert(alertConfig);
                }
                
            } catch (error) {
                logger.error(`预警条件检查失败 ${alertId}:`, error);
            }
        }
    }
    
    /**
     * 更新质量指标
     */
    async updateQualityMetrics(checkResults) {
        const timestamp = new Date().toISOString();
        
        // 更新整体质量评分
        const overallScore = this.calculateOverallQualityScore(checkResults.quality_scores);
        this.updateMetric('overall_quality_score', overallScore, timestamp);
        
        // 更新分类质量评分
        for (const [category, scoreData] of Object.entries(checkResults.quality_scores)) {
            const metricId = `${category}_data_quality`;
            if (this.qualityMetrics.has(metricId)) {
                this.updateMetric(metricId, scoreData.final_score, timestamp);
            }
        }
        
        // 更新异常检测率
        const anomalyRate = this.calculateAnomalyDetectionRate();
        this.updateMetric('anomaly_detection_rate', anomalyRate, timestamp);
        
        // 更新数据时效性评分
        const freshnessScore = this.calculateDataFreshnessScore();
        this.updateMetric('data_freshness_score', freshnessScore, timestamp);
    }
    
    /**
     * 更新单个指标
     */
    updateMetric(metricId, value, timestamp) {
        const metric = this.qualityMetrics.get(metricId);
        if (!metric) {return;}
        
        const previousValue = metric.current_value;
        metric.current_value = value;
        metric.last_updated = timestamp;
        
        // 计算趋势
        if (previousValue !== null && previousValue !== undefined) {
            const change = value - previousValue;
            if (Math.abs(change) < DATA_QUALITY_CONSTANTS.METRIC_CHANGE_THRESHOLD) {
                metric.trend = 'stable';
            } else if (change > 0) {
                metric.trend = 'improving';
            } else {
                metric.trend = 'declining';
            }
        }
        
        // 保存历史记录
        metric.history.push({
            value,
            timestamp
        });
        
        // 保持历史记录在合理范围内
        if (metric.history.length > DATA_QUALITY_CONSTANTS.MAX_HISTORY_RECORDS) {
            metric.history = metric.history.slice(-DATA_QUALITY_CONSTANTS.MAX_HISTORY_RECORDS);
        }
    }
    
    // 辅助方法实现
    async getTestData(dataSource) {
        // 模拟获取测试数据
        const sampleData = {
            'ems_energy_data': [
                {
                    meter_id: 'M001',
                    energy_type: 'electricity',
                    consumption_amount: 1250.5,
                    measurement_time: new Date(Date.now() - DATA_QUALITY_CONSTANTS.SAMPLE_TIME_OFFSET_1MIN).toISOString(),
                    quality_flag: 'good'
                },
                {
                    meter_id: 'M002',
                    energy_type: 'natural_gas',
                    consumption_amount: 850.2,
                    measurement_time: new Date(Date.now() - DATA_QUALITY_CONSTANTS.SAMPLE_TIME_OFFSET_2MIN).toISOString(),
                    quality_flag: 'good'
                }
            ],
            'carbon_emissions': [
                {
                    emission_id: 'E001',
                    emission_scope: 'scope1',
                    emission_source: 'natural_gas',
                    emission_amount: 125.8,
                    calculation_time: new Date().toISOString(),
                    calculation_method: 'emission_factor_method',
                    data_quality_score: DATA_QUALITY_CONSTANTS.HIGH_QUALITY_SCORE
                }
            ],
            'mes_production_data': [
                {
                    enterprise_id: 'ENT001',
                    product_code: 'PROD001',
                    production_volume: DATA_QUALITY_CONSTANTS.SAMPLE_PRODUCTION_VOLUME,
                    production_date: new Date().toISOString().split('T')[0]
                }
            ],
            'national_indicators': [
                {
                    indicator_id: 'IND001',
                    indicator_type: 'carbon_intensity',
                    indicator_value: DATA_QUALITY_CONSTANTS.SAMPLE_INDICATOR_VALUE,
                    target_value: DATA_QUALITY_CONSTANTS.SAMPLE_TARGET_VALUE,
                    calculation_date: new Date().toISOString().split('T')[0],
                    compliance_status: 'compliant'
                }
            ]
        };
        
        return sampleData[dataSource] || [];
    }
    
    evaluateBusinessRule(rule, record) {
        // 简化的业务规则评估
        try {
            if (rule.includes('consumption_amount > 0')) {
                return record.consumption_amount > 0;
            }
            if (rule.includes('measurement_time <= current_time')) {
                const measurementTime = new Date(record.measurement_time).getTime();
                const currentTime = Date.now();
                return measurementTime <= currentTime + DATA_QUALITY_CONSTANTS.FUTURE_TIME_TOLERANCE_MS; // 5分钟容错
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async detectOutliers(data, config) {
        // 简化的异常值检测
        if (data.length < config.min_samples) {return 0;}
        
        const values = data.map(d => d.consumption_amount || d.emission_amount || d.production_volume || 0);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        let outliers = 0;
        for (const value of values) {
            const zScore = Math.abs((value - mean) / stdDev);
            if (zScore > config.threshold) {
                outliers++;
            }
        }
        
        return outliers;
    }
    
    evaluateConsistencyRule(rule, _record) {
        // 简化的一致性规则评估
        try {
            if (rule.includes('sum(sub_meters) == total_meter')) {
                // 模拟子表求和检查
                return true;
            }
            if (rule.includes('energy_type matches meter_type')) {
                // 模拟能源类型匹配检查
                return true;
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async checkTemporalConsistency(data, config) {
        // 简化的时间一致性检查
        let inconsistencies = 0;
        
        for (let i = 1; i < data.length; i++) {
            const current = data[i].consumption_amount || data[i].emission_amount || 0;
            const previous = data[i-1].consumption_amount || data[i-1].emission_amount || 0;
            
            if (previous > 0) {
                const variance = Math.abs(current - previous) / previous;
                if (variance > config.variance_threshold) {
                    inconsistencies++;
                }
            }
        }
        
        return inconsistencies;
    }
    
    isValidCalculationMethod(method) {
        const validMethods = [
            'emission_factor_method',
            'mass_balance_method',
            'continuous_monitoring_method'
        ];
        return validMethods.includes(method);
    }
    
    evaluateRegulatoryRequirement(requirement, record) {
        // 简化的监管要求评估
        try {
            if (requirement.includes('calculation_follows_national_standard')) {
                return record.calculation_method === 'emission_factor_method';
            }
            if (requirement.includes('audit_trail_complete')) {
                return record.calculation_method && record.data_source;
            }
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default RealTimeDataQualityService;
