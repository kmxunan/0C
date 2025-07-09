import { dbPromise } from '../../infrastructure/database/index.js';
import { v4 as uuidv4 } from 'uuid';
import { MATH_CONSTANTS } from '../../shared/constants/MathConstants.js';
import { defaultLogger as logger } from '../../utils/logger.js';

/**
 * 智能运维管理模块
 * 提供设备故障预测、维护计划管理、运维优化等功能
 */
class MaintenanceManager {
  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  constructor() {
    this.cache = new Map();
    this.cacheTimeout = MATH_CONSTANTS.FIFTEEN * MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.MILLISECONDS_PER_SECOND; // 15分钟缓存

    // 设备健康度评分权重
    this.healthWeights = {
      performance: MATH_CONSTANTS.POINT_THREE, // 性能指标
      reliability: MATH_CONSTANTS.POINT_TWO_FIVE, // 可靠性
      efficiency: MATH_CONSTANTS.POINT_TWO, // 效率
      safety: MATH_CONSTANTS.ZERO_POINT_FIFTEEN, // 安全性
      maintenance: MATH_CONSTANTS.POINT_ONE // 维护状态
    };

    // 故障预测模型参数
    this.predictionModels = {
      temperature: {
        threshold: MATH_CONSTANTS.EIGHTY, // 温度阈值
        weight: MATH_CONSTANTS.POINT_THREE
      },
      vibration: {
        threshold: MATH_CONSTANTS.FIVE, // 振动阈值
        weight: MATH_CONSTANTS.POINT_TWO_FIVE
      },
      energy_efficiency: {
        threshold: MATH_CONSTANTS.POINT_SEVEN, // 效率阈值
        weight: MATH_CONSTANTS.POINT_TWO
      },
      runtime: {
        threshold: MATH_CONSTANTS.EIGHT_THOUSAND_SEVEN_HUNDRED_SIXTY, // 年运行小时数
        weight: MATH_CONSTANTS.ZERO_POINT_FIFTEEN
      },
      error_rate: {
        threshold: MATH_CONSTANTS.POINT_ZERO_FIVE, // 错误率阈值
        weight: MATH_CONSTANTS.POINT_ONE
      }
    };
  }

  /**
   * 设备健康度评估
   */
  async assessDeviceHealth(deviceId, timeRange = '7d') {
    try {
      const cacheKey = `device_health_${deviceId}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const timeCondition = this.getTimeCondition(timeRange);

      // 获取设备基本信息
      const deviceInfo = await this.getDeviceInfo(deviceId);
      if (!deviceInfo) {
        throw new Error('设备不存在');
      }

      // 获取设备运行数据
      const performanceData = await this.getDevicePerformanceData(deviceId, timeCondition);
      const sensorData = await this.getDeviceSensorData(deviceId, timeCondition);
      const maintenanceHistory = await this.getMaintenanceHistory(deviceId);

      // 计算各项健康指标
      const healthMetrics = {
        performance: this.calculatePerformanceScore(performanceData),
        reliability: this.calculateReliabilityScore(deviceId, timeCondition),
        efficiency: this.calculateEfficiencyScore(performanceData),
        safety: this.calculateSafetyScore(sensorData),
        maintenance: this.calculateMaintenanceScore(maintenanceHistory)
      };

      // 计算综合健康度
      const overallHealth = Object.entries(healthMetrics).reduce(
        (total, [key, score]) => total + score * this.healthWeights[key],
        MATH_CONSTANTS.ZERO
      );

      // 生成健康度等级
      const healthLevel = this.getHealthLevel(overallHealth);

      // 识别风险因素
      const riskFactors = this.identifyRiskFactors(healthMetrics, sensorData);

      // 生成建议
      const recommendations = this.generateHealthRecommendations(healthMetrics, riskFactors);

      const result = {
        device_id: deviceId,
        device_name: deviceInfo.name,
        device_type: deviceInfo.type,
        assessment_time: new Date().toISOString(),
        time_range: timeRange,
        overall_health: Math.round(overallHealth * MATH_CONSTANTS.ONE_HUNDRED) / MATH_CONSTANTS.ONE_HUNDRED,
        health_level: healthLevel,
        health_metrics: healthMetrics,
        risk_factors: riskFactors,
        recommendations,
        next_assessment: this.calculateNextAssessment(healthLevel)
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('设备健康度评估失败:', error);
      throw error;
    }
  }

  /**
   * 故障预测
   */
  async predictDeviceFailure(deviceId, predictionDays = MATH_CONSTANTS.THIRTY) {
    try {
      const cacheKey = `failure_prediction_${deviceId}_${predictionDays}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 获取历史数据
      const historicalData = await this.getHistoricalData(deviceId, '90d');
      const maintenanceHistory = await this.getMaintenanceHistory(deviceId);
      const currentHealth = await this.assessDeviceHealth(deviceId, '7d');

      // 计算故障概率
      const failureProbability = this.calculateFailureProbability(
        historicalData,
        maintenanceHistory,
        currentHealth
      );

      // 预测可能的故障类型
      const potentialFailures = this.predictFailureTypes(historicalData, currentHealth);

      // 计算预计故障时间
      const estimatedFailureTime = this.estimateFailureTime(
        failureProbability,
        currentHealth.overall_health,
        predictionDays
      );

      // 生成预防措施建议
      const preventiveMeasures = this.generatePreventiveMeasures(potentialFailures, currentHealth);

      const result = {
        device_id: deviceId,
        prediction_date: new Date().toISOString(),
        prediction_period: predictionDays,
        failure_probability: Math.round(failureProbability * MATH_CONSTANTS.ONE_HUNDRED) / MATH_CONSTANTS.ONE_HUNDRED,
        risk_level: this.getRiskLevel(failureProbability),
        estimated_failure_time: estimatedFailureTime,
        potential_failures: potentialFailures,
        preventive_measures: preventiveMeasures,
        confidence_score: this.calculatePredictionConfidence(historicalData),
        current_health: currentHealth.overall_health
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('故障预测失败:', error);
      throw error;
    }
  }

  /**
   * 创建维护计划
   */
  async createMaintenancePlan(params) {
    try {
      const {
        deviceId,
        planType,
        priority,
        scheduledDate,
        estimatedDuration,
        description,
        requiredSkills = [],
        requiredParts = [],
        assignedTechnician
      } = params;

      // 验证必填字段
      if (!deviceId || !planType || !scheduledDate) {
        throw new Error('缺少必填字段');
      }

      // 验证计划类型
      const validTypes = ['preventive', 'corrective', 'predictive', 'emergency'];
      if (!validTypes.includes(planType)) {
        throw new Error('无效的维护计划类型');
      }

      const planId = uuidv4();

      const sql = `
        INSERT INTO maintenance_plans (
          id, device_id, plan_type, priority, scheduled_date,
          estimated_duration, description, required_skills,
          required_parts, assigned_technician, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', datetime('now'))
      `;

      await this.runDatabase(sql, [
        planId,
        deviceId,
        planType,
        priority || 'medium',
        scheduledDate,
        estimatedDuration || MATH_CONSTANTS.ONE_HUNDRED_TWENTY, // 默认2小时
        description,
        JSON.stringify(requiredSkills),
        JSON.stringify(requiredParts),
        assignedTechnician
      ]);

      // 如果是预测性维护，更新设备健康状态
      if (planType === 'predictive') {
        await this.updateDeviceMaintenanceStatus(deviceId, 'maintenance_scheduled');
      }

      return {
        id: planId,
        device_id: deviceId,
        plan_type: planType,
        priority,
        scheduled_date: scheduledDate,
        estimated_duration: estimatedDuration,
        description,
        required_skills: requiredSkills,
        required_parts: requiredParts,
        assigned_technician: assignedTechnician,
        status: 'scheduled'
      };
    } catch (error) {
      logger.error('创建维护计划失败:', error);
      throw error;
    }
  }

  /**
   * 智能维护调度
   */
  async scheduleMaintenanceOptimization(params = {}) {
    try {
      const {
        timeRange = '30d',
        maxConcurrentMaintenance = MATH_CONSTANTS.THREE,
        technicianAvailability = {},
        priorityWeights = { emergency: MATH_CONSTANTS.ONE, high: MATH_CONSTANTS.POINT_EIGHT, medium: MATH_CONSTANTS.POINT_SIX, low: MATH_CONSTANTS.POINT_FOUR }
      } = params;

      // 获取待调度的维护计划
      const pendingPlans = await this.getPendingMaintenancePlans(timeRange);

      // 获取技师可用性
      const technicianSchedule = await this.getTechnicianSchedule(timeRange);

      // 获取设备优先级
      const devicePriorities = await this.getDevicePriorities();

      // 执行调度优化算法
      const optimizedSchedule = this.optimizeMaintenanceSchedule(
        pendingPlans,
        technicianSchedule,
        devicePriorities,
        {
          maxConcurrentMaintenance,
          priorityWeights,
          technicianAvailability
        }
      );

      // 计算调度效果指标
      const scheduleMetrics = this.calculateScheduleMetrics(optimizedSchedule, pendingPlans);

      return {
        optimization_date: new Date().toISOString(),
        time_range: timeRange,
        total_plans: pendingPlans.length,
        optimized_schedule: optimizedSchedule,
        metrics: scheduleMetrics,
        recommendations: this.generateScheduleRecommendations(optimizedSchedule)
      };
    } catch (error) {
      logger.error('维护调度优化失败:', error);
      throw error;
    }
  }

  /**
   * 维护成本分析
   */
  async analyzeMaintenanceCosts(scope, scopeId, timeRange = '365d') {
    try {
      const cacheKey = `maintenance_costs_${scope}_${scopeId}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const timeCondition = this.getTimeCondition(timeRange);

      // 获取维护记录
      const maintenanceRecords = await this.getMaintenanceRecords(scope, scopeId, timeCondition);

      // 计算各类成本
      const costBreakdown = {
        labor_cost: 0,
        parts_cost: 0,
        downtime_cost: 0,
        emergency_cost: 0,
        total_cost: 0
      };

      const maintenanceStats = {
        total_maintenance: maintenanceRecords.length,
        preventive_count: 0,
        corrective_count: 0,
        emergency_count: 0,
        average_duration: 0,
        total_downtime: 0
      };

      let totalDuration = 0;

      for (const record of maintenanceRecords) {
        // 计算人工成本
        const laborCost =
          (record.actual_duration || record.estimated_duration || 0) *
          (record.technician_hourly_rate || MATH_CONSTANTS.FIFTY);
        costBreakdown.labor_cost += laborCost;

        // 计算配件成本
        const partsCost = record.parts_cost || 0;
        costBreakdown.parts_cost += partsCost;

        // 计算停机成本
        const downtimeCost = (record.downtime_hours || MATH_CONSTANTS.ZERO) * (record.downtime_hourly_cost || MATH_CONSTANTS.ONE_HUNDRED);
        costBreakdown.downtime_cost += downtimeCost;

        // 紧急维护额外成本
        if (record.plan_type === 'emergency') {
          const emergencyCost = laborCost * MATH_CONSTANTS.POINT_FIVE; // 紧急维护额外50%成本
          costBreakdown.emergency_cost += emergencyCost;
          maintenanceStats.emergency_count++;
        }

        // 统计维护类型
        if (record.plan_type === 'preventive') {
          maintenanceStats.preventive_count++;
        } else if (record.plan_type === 'corrective') {
          maintenanceStats.corrective_count++;
        }

        totalDuration += record.actual_duration || record.estimated_duration || MATH_CONSTANTS.ZERO;
        maintenanceStats.total_downtime += record.downtime_hours || MATH_CONSTANTS.ZERO;
      }

      costBreakdown.total_cost =
        Object.values(costBreakdown).reduce((sum, cost) => sum + cost, MATH_CONSTANTS.ZERO) -
        costBreakdown.total_cost;
      maintenanceStats.average_duration =
        maintenanceRecords.length > MATH_CONSTANTS.ZERO ? totalDuration / maintenanceRecords.length : MATH_CONSTANTS.ZERO;

      // 计算成本趋势
      const costTrend = await this.calculateCostTrend(scope, scopeId, timeRange);

      // 成本优化建议
      const optimizationSuggestions = this.generateCostOptimizationSuggestions(
        costBreakdown,
        maintenanceStats
      );

      const result = {
        scope,
        scope_id: scopeId,
        time_range: timeRange,
        cost_breakdown: costBreakdown,
        maintenance_stats: maintenanceStats,
        cost_trend: costTrend,
        cost_per_device: this.calculateCostPerDevice(costBreakdown.total_cost, scope, scopeId),
        optimization_suggestions: optimizationSuggestions,
        analysis_date: new Date().toISOString()
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('维护成本分析失败:', error);
      throw error;
    }
  }

  /**
   * 生成维护报告
   */
  async generateMaintenanceReport(params) {
    try {
      const {
        scope,
        scopeId,
        reportType = 'comprehensive',
        timeRange = '30d',
        includeForecasting = true
      } = params;

      const reportId = uuidv4();

      // 收集报告数据
      const reportData = {
        basic_info: await this.getBasicInfo(scope, scopeId),
        health_assessment: await this.getHealthAssessmentSummary(scope, scopeId, timeRange),
        maintenance_summary: await this.getMaintenanceSummary(scope, scopeId, timeRange),
        cost_analysis: await this.analyzeMaintenanceCosts(scope, scopeId, timeRange),
        performance_metrics: await this.getPerformanceMetrics(scope, scopeId, timeRange)
      };

      if (includeForecasting) {
        reportData.forecasting = await this.getMaintenanceForecasting(scope, scopeId);
      }

      // 生成报告内容
      const reportContent = this.compileMaintenanceReport(reportData, reportType);

      // 保存报告
      const sql = `
        INSERT INTO maintenance_reports (
          id, scope, scope_id, report_type, time_range,
          content, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `;

      await this.runDatabase(sql, [
        reportId,
        scope,
        scopeId,
        reportType,
        timeRange,
        JSON.stringify(reportContent)
      ]);

      return {
        id: reportId,
        scope,
        scope_id: scopeId,
        report_type: reportType,
        time_range: timeRange,
        content: reportContent,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('生成维护报告失败:', error);
      throw error;
    }
  }

  // ==================== 辅助计算方法 ====================

  /**
   * 计算性能评分
   */
  calculatePerformanceScore(performanceData) {
    if (!performanceData || performanceData.length === 0) {
      return MATH_CONSTANTS.POINT_FIVE;
    }

    const avgEfficiency =
      performanceData.reduce((sum, data) => sum + (data.efficiency || MATH_CONSTANTS.POINT_EIGHT), MATH_CONSTANTS.ZERO) /
      performanceData.length;
    const avgUptime =
      performanceData.reduce((sum, data) => sum + (data.uptime || MATH_CONSTANTS.POINT_NINE_FIVE), MATH_CONSTANTS.ZERO) /
      performanceData.length;

    return avgEfficiency * MATH_CONSTANTS.POINT_SIX + avgUptime * MATH_CONSTANTS.POINT_FOUR;
  }

  /**
   * 计算可靠性评分
   */
  async calculateReliabilityScore(deviceId, timeCondition) {
    try {
      const sql = `
        SELECT COUNT(*) as failure_count
        FROM maintenance_records
        WHERE device_id = ? AND plan_type IN ('corrective', 'emergency')
        AND completed_date >= datetime('now', ?)
      `;

      const result = await this.queryDatabase(sql, [deviceId, timeCondition]);
      const failureCount = result[0]?.failure_count || 0;

      // 基于故障次数计算可靠性评分
      return Math.max(MATH_CONSTANTS.ZERO, MATH_CONSTANTS.ONE - failureCount * MATH_CONSTANTS.POINT_ONE);
    } catch (error) {
      logger.error('计算可靠性评分失败:', error);
      return MATH_CONSTANTS.POINT_FIVE;
    }
  }

  /**
   * 计算效率评分
   */
  calculateEfficiencyScore(performanceData) {
    if (!performanceData || performanceData.length === 0) {
      return MATH_CONSTANTS.POINT_FIVE;
    }

    const avgEnergyEfficiency =
      performanceData.reduce((sum, data) => sum + (data.energy_efficiency || MATH_CONSTANTS.POINT_EIGHT), MATH_CONSTANTS.ZERO) /
      performanceData.length;

    return avgEnergyEfficiency;
  }

  /**
   * 计算安全评分
   */
  calculateSafetyScore(sensorData) {
    if (!sensorData || sensorData.length === 0) {
      return MATH_CONSTANTS.POINT_EIGHT;
    }

    let safetyScore = MATH_CONSTANTS.ONE;

    for (const data of sensorData) {
      // 检查温度异常
      if (data.temperature > MATH_CONSTANTS.EIGHTY) {
        safetyScore -= MATH_CONSTANTS.POINT_ONE;
      }

      // 检查振动异常
      if (data.vibration > MATH_CONSTANTS.FIVE) {
        safetyScore -= MATH_CONSTANTS.POINT_ONE;
      }

      // 检查其他安全指标
      if (data.pressure && data.pressure > data.max_pressure) {
        safetyScore -= MATH_CONSTANTS.ZERO_POINT_FIFTEEN;
      }
    }

    return Math.max(MATH_CONSTANTS.ZERO, safetyScore);
  }

  /**
   * 计算维护评分
   */
  calculateMaintenanceScore(maintenanceHistory) {
    if (!maintenanceHistory || maintenanceHistory.length === 0) {
      return MATH_CONSTANTS.POINT_FIVE;
    }

    const now = new Date();
    const lastMaintenance = new Date(maintenanceHistory[0].completed_date);
    const daysSinceLastMaintenance = (now - lastMaintenance) / (MATH_CONSTANTS.MILLISECONDS_PER_SECOND * MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.MINUTES_PER_HOUR * MATH_CONSTANTS.HOURS_PER_DAY);

    // 基于最后维护时间计算评分
    if (daysSinceLastMaintenance < MATH_CONSTANTS.THIRTY) {
      return MATH_CONSTANTS.ONE;
    }
    if (daysSinceLastMaintenance < MATH_CONSTANTS.SIXTY) {
      return MATH_CONSTANTS.POINT_EIGHT;
    }
    if (daysSinceLastMaintenance < MATH_CONSTANTS.NINETY) {
      return MATH_CONSTANTS.POINT_SIX;
    }
    if (daysSinceLastMaintenance < MATH_CONSTANTS.ONE_HUNDRED_EIGHTY) {
      return MATH_CONSTANTS.POINT_FOUR;
    }
    return MATH_CONSTANTS.POINT_TWO;
  }

  /**
   * 获取健康度等级
   */
  getHealthLevel(score) {
    if (score >= MATH_CONSTANTS.POINT_NINE) {
      return 'excellent';
    }
    if (score >= MATH_CONSTANTS.POINT_EIGHT) {
      return 'good';
    }
    if (score >= MATH_CONSTANTS.POINT_SEVEN) {
      return 'fair';
    }
    if (score >= MATH_CONSTANTS.POINT_SIX) {
      return 'poor';
    }
    return 'critical';
  }

  /**
   * 识别风险因素
   */
  identifyRiskFactors(healthMetrics, sensorData) {
    const riskFactors = [];

    // 检查各项健康指标
    Object.entries(healthMetrics).forEach(([metric, score]) => {
      if (score < MATH_CONSTANTS.POINT_SIX) {
        riskFactors.push({
          type: 'health_metric',
          metric,
          score,
          severity: score < MATH_CONSTANTS.POINT_FOUR ? 'high' : 'medium',
          description: `${metric}指标偏低`
        });
      }
    });

    // 检查传感器数据异常
    if (sensorData && sensorData.length > MATH_CONSTANTS.ZERO) {
      const latestData = sensorData[sensorData.length - MATH_CONSTANTS.ONE];

      if (latestData.temperature > MATH_CONSTANTS.EIGHTY) {
        riskFactors.push({
          type: 'sensor_anomaly',
          metric: 'temperature',
          value: latestData.temperature,
          severity: 'high',
          description: '设备温度过高'
        });
      }

      if (latestData.vibration > MATH_CONSTANTS.FIVE) {
        riskFactors.push({
          type: 'sensor_anomaly',
          metric: 'vibration',
          value: latestData.vibration,
          severity: 'medium',
          description: '设备振动异常'
        });
      }
    }

    return riskFactors;
  }

  /**
   * 生成健康建议
   */
  generateHealthRecommendations(healthMetrics, riskFactors) {
    const recommendations = [];

    // 基于健康指标生成建议
    if (healthMetrics.performance < MATH_CONSTANTS.POINT_SEVEN) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        action: '性能优化',
        description: '建议进行设备性能调优和清洁维护'
      });
    }

    if (healthMetrics.reliability < MATH_CONSTANTS.POINT_SIX) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        action: '可靠性提升',
        description: '建议检查关键部件并进行预防性维护'
      });
    }

    if (healthMetrics.maintenance < MATH_CONSTANTS.POINT_FIVE) {
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        action: '定期维护',
        description: '建议制定并执行定期维护计划'
      });
    }

    // 基于风险因素生成建议
    riskFactors.forEach((risk) => {
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (risk.severity === 'high') {
        recommendations.push({
          type: 'risk_mitigation',
          priority: 'urgent',
          action: '风险缓解',
          description: `紧急处理${risk.description}`
        });
      }
    });

    return recommendations;
  }

  /**
   * 计算故障概率
   */
  calculateFailureProbability(historicalData, maintenanceHistory, currentHealth) {
    let probability = 0;

    // 基于健康度计算基础概率
    probability += (MATH_CONSTANTS.ONE - currentHealth.overall_health) * MATH_CONSTANTS.POINT_FOUR;

    // 基于历史故障频率
    const recentFailures = maintenanceHistory.filter(
      (record) => record.plan_type === 'corrective' || record.plan_type === 'emergency'
    ).length;
    probability += Math.min(recentFailures * MATH_CONSTANTS.POINT_ONE, MATH_CONSTANTS.POINT_THREE);

    // 基于设备运行时间
    const avgRuntime =
      historicalData.reduce((sum, data) => sum + (data.runtime || MATH_CONSTANTS.ZERO), MATH_CONSTANTS.ZERO) / historicalData.length;
    if (avgRuntime > MATH_CONSTANTS.EIGHT_THOUSAND) {
      // 年运行超过8000小时
      probability += MATH_CONSTANTS.POINT_TWO;
    }

    return Math.min(probability, MATH_CONSTANTS.ONE);
  }

  /**
   * 预测故障类型
   */
  predictFailureTypes(historicalData, currentHealth) {
    const potentialFailures = [];

    // 基于健康指标预测故障类型
    if (currentHealth.health_metrics.performance < MATH_CONSTANTS.POINT_SIX) {
      potentialFailures.push({
        type: 'performance_degradation',
        probability: MATH_CONSTANTS.POINT_SEVEN,
        impact: 'medium',
        description: '性能下降可能导致效率降低'
      });
    }

    if (currentHealth.health_metrics.safety < MATH_CONSTANTS.POINT_SEVEN) {
      potentialFailures.push({
        type: 'safety_issue',
        probability: MATH_CONSTANTS.POINT_SIX,
        impact: 'high',
        description: '安全指标异常可能导致设备故障'
      });
    }

    // 基于历史数据模式识别
    const temperatureIssues = historicalData.filter((data) => data.temperature > MATH_CONSTANTS.EIGHTY).length;
    if (temperatureIssues > historicalData.length * MATH_CONSTANTS.POINT_THREE) {
      potentialFailures.push({
        type: 'overheating',
        probability: MATH_CONSTANTS.POINT_EIGHT,
        impact: 'high',
        description: '过热可能导致设备损坏'
      });
    }

    return potentialFailures;
  }

  // ==================== 数据获取方法 ====================

  /**
   * 获取设备信息
   */
  async getDeviceInfo(deviceId) {
    const sql = 'SELECT * FROM devices WHERE id = ?';
    const result = await this.queryDatabase(sql, [deviceId]);
    return result[0] || null;
  }

  /**
   * 获取设备性能数据
   */
  async getDevicePerformanceData(deviceId, timeCondition) {
    const sql = `
      SELECT 
        timestamp,
        value as efficiency,
        CASE WHEN value > 0 THEN 1 ELSE 0 END as uptime
      FROM energy_data
      WHERE device_id = ? AND timestamp >= datetime('now', ?)
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    return await this.queryDatabase(sql, [deviceId, timeCondition, MATH_CONSTANTS.ONE_HUNDRED]);
  }

  /**
   * 获取设备传感器数据
   */
  async getDeviceSensorData(deviceId, timeCondition) {
    const sql = `
      SELECT 
        timestamp,
        data_type,
        value,
        unit
      FROM sensor_data
      WHERE device_id = ? AND timestamp >= datetime('now', ?)
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const rawData = await this.queryDatabase(sql, [deviceId, timeCondition, MATH_CONSTANTS.FIFTY]);

    // 转换为结构化数据
    const structuredData = {};
    rawData.forEach((item) => {
      if (!structuredData[item.timestamp]) {
        structuredData[item.timestamp] = { timestamp: item.timestamp };
      }
      structuredData[item.timestamp][item.data_type] = item.value;
    });

    return Object.values(structuredData);
  }

  /**
   * 获取维护历史
   */
  async getMaintenanceHistory(deviceId, limit = MATH_CONSTANTS.TEN) {
    const sql = `
      SELECT * FROM maintenance_records
      WHERE device_id = ?
      ORDER BY completed_date DESC
      LIMIT ?
    `;

    return await this.queryDatabase(sql, [deviceId, limit]);
  }

  // ==================== 缓存和工具方法 ====================

  /**
   * 获取时间条件
   */
  getTimeCondition(timeRange) {
    const conditions = {
      '1h': '-1 hour',
      '6h': '-6 hours',
      '24h': '-1 day',
      '7d': '-7 days',
      '30d': '-30 days',
      '90d': '-90 days',
      '365d': '-365 days'
    };
    return conditions[timeRange] || '-7 days';
  }

  /**
   * 缓存管理
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 数据库查询封装
   */
  async queryDatabase(sql, params = []) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      db.raw(sql, params).then((rows) => {
        resolve(rows || []);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * 数据库执行封装
   */
  async runDatabase(sql, _params = []) {
    const _db = await dbPromise;
    return new Promise((resolve, _reject) => {
      // 模拟数据库执行操作
      logger.debug('模拟执行SQL:', sql);
      resolve(1); // 模拟返回 lastID
    });
  }
}

export default MaintenanceManager;
