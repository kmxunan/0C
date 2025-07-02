import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import NotificationService from '../services/NotificationService.js';

/**
 * 告警管理器 - 处理告警规则、检测和通知
 */
class AlertManager {
  constructor() {
    this.rules = new Map(); // 存储告警规则: { ruleId => ruleObject }
    this.activeAlerts = new Map(); // 存储活跃告警: { alertId => alertObject }
    this.notificationService = new NotificationService();
    this.initialize();
  }

  /**
   * 初始化告警管理器
   */
  async initialize() {
    try {
      await this.loadAlertRules();
      await this.loadActiveAlerts();
      logger.info('告警管理器初始化完成');
    } catch (error) {
      logger.error('告警管理器初始化失败:', error);
    }
  }

  /**
   * 从数据库加载告警规则
   */
  async loadAlertRules() {
    try {
      const rules = await db.all('SELECT * FROM alert_rules WHERE is_active = 1');
      rules.forEach(rule => {
        // 解析规则条件（JSON格式）
        try {
          rule.conditions = JSON.parse(rule.conditions);
          rule.actions = JSON.parse(rule.actions);
          this.rules.set(rule.id, rule);
        } catch (error) {
          logger.error(`解析告警规则失败 (ID: ${rule.id}):`, error);
        }
      });
      logger.info(`加载了 ${rules.length} 条告警规则`);
    } catch (error) {
      logger.error('加载告警规则失败:', error);
    }
  }

  /**
   * 从数据库加载活跃告警
   */
  async loadActiveAlerts() {
    try {
      const alerts = await db.all(
        'SELECT * FROM alerts WHERE status = "active" ORDER BY created_at DESC'
      );
      alerts.forEach(alert => {
        this.activeAlerts.set(alert.id, alert);
      });
      logger.info(`加载了 ${alerts.length} 条活跃告警`);
    } catch (error) {
      logger.error('加载活跃告警失败:', error);
    }
  }

  /**
   * 检查数据是否触发告警规则
   * @param {Object} data - 要检查的数据对象
   * @param {string} dataType - 数据类型 (energy, carbon, device_status等)
   * @param {string} deviceId - 设备ID
   */
  async checkAlerts(data, dataType, deviceId) {
    if (!data || !dataType || !deviceId) return;

    // 遍历所有相关告警规则
    for (const [ruleId, rule] of this.rules.entries()) {
      // 检查规则是否适用于此数据类型和设备
      if (rule.data_type !== dataType && rule.data_type !== 'all') continue;
      if (rule.device_id && rule.device_id !== deviceId) continue;

      // 检查是否满足告警条件
      if (this.evaluateConditions(data, rule.conditions)) {
        await this.triggerAlert(rule, data, deviceId);
      }
    }
  }

  /**
   * 评估数据是否满足告警条件
   * @param {Object} data - 数据对象
   * @param {Object} conditions - 告警条件
   */
  evaluateConditions(data, conditions) {
    try {
      // 支持的操作符
      const operators = {
        'gt': (a, b) => a > b,
        'lt': (a, b) => a < b,
        'gte': (a, b) => a >= b,
        'lte': (a, b) => a <= b,
        'eq': (a, b) => a === b,
        'neq': (a, b) => a !== b,
        'contains': (a, b) => a && a.includes(b),
        'not_contains': (a, b) => a && !a.includes(b)
      };

      // 简单条件评估 (AND逻辑)
      if (conditions.type === 'simple') {
        const { field, operator, value } = conditions;
        if (!operators[operator]) return false;
        return operators[operator](data[field], value);
      }

      // 复合条件评估 (AND/OR逻辑)
      if (conditions.type === 'compound') {
        const results = conditions.conditions.map(cond => 
          this.evaluateConditions(data, cond)
        );

        if (conditions.logic === 'and') {
          return results.every(result => result);
        } else if (conditions.logic === 'or') {
          return results.some(result => result);
        }
      }

      return false;
    } catch (error) {
      logger.error('评估告警条件失败:', error);
      return false;
    }
  }

  /**
   * 触发告警
   * @param {Object} rule - 告警规则
   * @param {Object} data - 触发告警的数据
   * @param {string} deviceId - 设备ID
   */
  async triggerAlert(rule, data, deviceId) {
    try {
      // 检查是否已经存在相同的活跃告警（避免重复告警）
      const existingAlertId = Array.from(this.activeAlerts.values())
        .find(alert => alert.rule_id === rule.id && alert.device_id === deviceId && alert.status === 'active')?.id;

      if (existingAlertId) {
        // 更新现有告警的时间戳
        await db.run(
          'UPDATE alerts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [existingAlertId]
        );
        this.activeAlerts.get(existingAlertId).updated_at = new Date().toISOString();
        logger.debug(`更新现有告警: ${existingAlertId}`);
        return;
      }

      // 创建新告警
      const alertId = uuidv4();
      const severity = rule.severity || 'medium';
      const alertTime = new Date().toISOString();
      const description = this.generateAlertDescription(rule, data);

      // 存储到数据库
      await db.run(
        `INSERT INTO alerts (id, rule_id, device_id, severity, status, description, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [alertId, rule.id, deviceId, severity, 'active', description, JSON.stringify(data), alertTime, alertTime]
      );

      // 添加到活跃告警列表
      const newAlert = {
        id: alertId,
        rule_id: rule.id,
        device_id: deviceId,
        severity: severity,
        status: 'active',
        description: description,
        data: data,
        created_at: alertTime,
        updated_at: alertTime
      };
      this.activeAlerts.set(alertId, newAlert);

      // 执行告警动作（通知等）
      await this.executeAlertActions(rule, newAlert);

      logger.warn(`触发新告警 [${severity}]: ${description} (设备: ${deviceId})`);
      return newAlert;
    } catch (error) {
      logger.error('触发告警失败:', error);
    }
  }

  /**
   * 生成告警描述
   * @param {Object} rule - 告警规则
   * @param {Object} data - 触发告警的数据
   */
  generateAlertDescription(rule, data) {
    if (rule.description_template) {
      try {
        // 简单模板替换
        let description = rule.description_template;
        Object.entries(data).forEach(([key, value]) => {
          description = description.replace(`{{${key}}}`, value);
        });
        return description;
      } catch (error) {
        logger.error('生成告警描述失败:', error);
      }
    }
    return `${rule.name} (设备: ${data.device_id || '未知'})`;
  }

  /**
   * 执行告警动作
   * @param {Object} rule - 告警规则
   * @param {Object} alert - 告警对象
   */
  async executeAlertActions(rule, alert) {
    try {
      if (!rule.actions || !Array.isArray(rule.actions)) return;

      for (const action of rule.actions) {
        switch (action.type) {
          case 'notification':
            await this.notificationService.sendNotification({
              type: action.notification_type || 'system',
              recipients: action.recipients || 'admin',
              title: `[${alert.severity.toUpperCase()}] ${rule.name}`,
              message: alert.description,
              alert_id: alert.id
            });
            break;
          case 'webhook':
            await this.triggerWebhook(action.url, alert);
            break;
          case 'script':
            await this.executeScript(action.script_path, alert);
            break;
        }
      }
    } catch (error) {
      logger.error('执行告警动作失败:', error);
    }
  }

  /**
   * 触发Webhook
   * @param {string} url - Webhook URL
   * @param {Object} alert - 告警对象
   */
  async triggerWebhook(url, alert) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Alert-ID': alert.id,
          'X-Alert-Severity': alert.severity
        },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        throw new Error(`Webhook请求失败: ${response.status}`);
      }

      logger.info(`Webhook触发成功: ${url}`);
    } catch (error) {
      logger.error(`Webhook触发失败: ${url}`, error);
    }
  }

  /**
   * 执行脚本
   * @param {string} scriptPath - 脚本路径
   * @param {Object} alert - 告警对象
   */
  async executeScript(scriptPath, alert) {
    // 实际实现需要考虑安全因素，此处仅为示例
    logger.warn(`执行告警脚本: ${scriptPath} (告警ID: ${alert.id})`);
    // 这里应该有脚本执行逻辑，需要谨慎实现以避免安全风险
  }

  /**
   * 解决告警
   * @param {string} alertId - 告警ID
   * @param {string} resolution - 解决说明
   * @param {string} userId - 处理人ID
   */
  async resolveAlert(alertId, resolution, userId) {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new Error(`告警不存在: ${alertId}`);
      }

      const resolvedTime = new Date().toISOString();
      await db.run(
        `UPDATE alerts SET status = "resolved", resolution = ?, resolved_by = ?, resolved_at = ?
         WHERE id = ?`,
        [resolution, userId, resolvedTime, alertId]
      );

      alert.status = 'resolved';
      alert.resolution = resolution;
      alert.resolved_by = userId;
      alert.resolved_at = resolvedTime;

      this.activeAlerts.delete(alertId);
      logger.info(`告警已解决: ${alertId} - ${resolution}`);

      return alert;
    } catch (error) {
      logger.error('解决告警失败:', error);
      throw error;
    }
  }

  /**
   * 获取活跃告警列表
   * @param {Object} filters - 过滤条件
   */
  getActiveAlerts(filters = {}) {
    let alerts = Array.from(this.activeAlerts.values());

    // 应用过滤条件
    if (filters.severity) {
      alerts = alerts.filter(alert => alert.severity === filters.severity);
    }
    if (filters.deviceId) {
      alerts = alerts.filter(alert => alert.device_id === filters.deviceId);
    }
    if (filters.ruleId) {
      alerts = alerts.filter(alert => alert.rule_id === filters.ruleId);
    }

    // 按创建时间排序（最新的在前）
    return alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  /**
   * 添加新的告警规则
   * @param {Object} rule - 新告警规则
   */
  async addAlertRule(rule) {
    try {
      const ruleId = uuidv4();
      const now = new Date().toISOString();

      // 验证规则结构
      if (!rule.name || !rule.data_type || !rule.conditions) {
        throw new Error('告警规则缺少必要字段');
      }

      // 存储到数据库
      await db.run(
        `INSERT INTO alert_rules (
          id, name, description, data_type, device_id, conditions, actions,
          severity, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ruleId, rule.name, rule.description || '', rule.data_type, rule.device_id || null,
          JSON.stringify(rule.conditions), JSON.stringify(rule.actions || []),
          rule.severity || 'medium', rule.is_active !== false, now, now
        ]
      );

      // 添加到内存中的规则列表
      rule.id = ruleId;
      rule.created_at = now;
      rule.updated_at = now;
      this.rules.set(ruleId, rule);

      logger.info(`添加新告警规则: ${rule.name} (ID: ${ruleId})`);
      return ruleId;
    } catch (error) {
      logger.error('添加告警规则失败:', error);
      throw error;
    }
  }

  /**
   * 更新告警规则
   * @param {string} ruleId - 规则ID
   * @param {Object} updates - 更新内容
   */
  async updateAlertRule(ruleId, updates) {
    try {
      const existingRule = this.rules.get(ruleId);
      if (!existingRule) {
        throw new Error(`告警规则不存在: ${ruleId}`);
      }

      // 合并更新
      const updatedRule = { ...existingRule, ...updates, updated_at: new Date().toISOString() };

      // 如果更新了条件或动作，需要重新解析
      if (updates.conditions) {
        updatedRule.conditions = JSON.parse(updates.conditions);
      }
      if (updates.actions) {
        updatedRule.actions = JSON.parse(updates.actions);
      }

      // 更新数据库
      await db.run(
        `UPDATE alert_rules SET
          name = ?, description = ?, data_type = ?, device_id = ?,
          conditions = ?, actions = ?, severity = ?, is_active = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          updatedRule.name, updatedRule.description || '', updatedRule.data_type,
          updatedRule.device_id || null, JSON.stringify(updatedRule.conditions),
          JSON.stringify(updatedRule.actions || []), updatedRule.severity || 'medium',
          updatedRule.is_active !== false, updatedRule.updated_at, ruleId
        ]
      );

      // 更新内存中的规则
      this.rules.set(ruleId, updatedRule);
      logger.info(`更新告警规则: ${ruleId}`);
      return true;
    } catch (error) {
      logger.error('更新告警规则失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const alertManager = new AlertManager();

export default AlertManager;