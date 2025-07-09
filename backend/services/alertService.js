import logger from '../../src/shared/utils/logger.js';
// import Device from '../../src/core/entities/Device.js'; // 暂时注释掉未使用的导入
import { dbPromise } from '../../src/infrastructure/database/index.js';

class AlertService {
  constructor() {
    // 可以初始化一些告警规则或阈值
    this.alertRules = [
      { type: 'energy_threshold', threshold: 1000, message: '设备能耗超出阈值', severity: 'high' },
      { type: 'device_offline', message: '设备离线', severity: 'critical' },
      // ... 更多告警规则
    ];
  }

  /**
   * 检查并生成告警
   * @param {string} type - 告警类型 (e.g., 'energy_threshold', 'device_offline')
   * @param {object} data - 告警相关数据 (e.g., { deviceId: 'xxx', currentConsumption: 1200 })
   * @returns {Promise<Alert|null>} - 生成的告警对象或 null
   */
  async checkAndGenerateAlert(type, data) {
    const rule = this.alertRules.find((r) => r.type === type);
    if (!rule) {
      logger.warn(`未找到告警类型 '${type}' 的规则。`);
      return null;
    }

    let shouldAlert = false;
    let alertMessage = rule.message;

    switch (type) {
      case 'energy_threshold':
        if (data.currentConsumption > rule.threshold) {
          shouldAlert = true;
          alertMessage = `${rule.message}: 设备 ${data.deviceId} 当前能耗 ${data.currentConsumption} kWh，超过阈值 ${rule.threshold} kWh。`;
        }
        break;
      case 'device_offline':
        // 假设 data.deviceId 存在且设备确实离线
        shouldAlert = true;
        alertMessage = `${rule.message}: 设备 ${data.deviceId} 已离线。`;
        break;
      // ... 更多告警类型判断
      default:
        logger.warn(`未处理的告警类型: ${type}`);
        break;
    }

    if (shouldAlert) {
      try {
        const db = await dbPromise;
        const newAlert = await db('alerts')
          .insert({
            device_id: data.deviceId || null,
            type: rule.type,
            message: alertMessage,
            severity: rule.severity,
            timestamp: new Date().toISOString(), // Store as ISO string
            status: 'active', // Initial status is active
          })
          .returning('*'); // Return the inserted row(s)
        logger.info(`生成新告警: [${rule.severity}] ${alertMessage}`);
        return newAlert;
      } catch (error) {
        logger.error('生成告警失败:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * 获取所有活跃告警
   * @returns {Promise<Array<Alert>>} - 活跃告警列表
   */
  async getActiveAlerts() {
    try {
      const db = await dbPromise;
      const alerts = await db('alerts').where({ status: 'active' });
      // Note: Knex does not have a direct 'include' equivalent like Sequelize.
      // If device information is needed, it's recommended to perform a separate query or join.
      // For now, we'll just return the alerts.
      return alerts;
    } catch (error) {
      logger.error('获取活跃告警失败:', error);
      return [];
    }
  }

  /**
   * 更新告警状态
   * @param {string} alertId - 告警ID
   * @param {string} newStatus - 新状态 (e.g., 'resolved', 'acknowledged')
   * @returns {Promise<boolean>} - 更新是否成功
   */
  async updateAlertStatus(alertId, newStatus) {
    try {
      const db = await dbPromise;
      const updatedRows = await db('alerts').where({ id: alertId }).update({ status: newStatus });
      if (updatedRows > 0) {
        logger.info(`告警 ${alertId} 状态更新为 '${newStatus}'。`);
        return true;
      }
      logger.warn(`未找到告警 ${alertId} 或状态未改变。`);
      return false;
    } catch (error) {
      logger.error(`更新告警 ${alertId} 状态失败:`, error);
      return false;
    }
  }

  /**
   * 添加或更新告警规则
   * @param {object} rule - 告警规则对象
   */
  addOrUpdateAlertRule(rule) {
    const index = this.alertRules.findIndex((r) => r.type === rule.type);
    if (index !== -1) {
      this.alertRules[index] = { ...this.alertRules[index], ...rule };
      logger.info(`告警规则 '${rule.type}' 已更新。`);
    } else {
      this.alertRules.push(rule);
      logger.info(`新告警规则 '${rule.type}' 已添加。`);
    }
  }

  /**
   * 移除告警规则
   * @param {string} type - 告警类型
   * @returns {boolean} - 移除是否成功
   */
  removeAlertRule(type) {
    const initialLength = this.alertRules.length;
    this.alertRules = this.alertRules.filter((r) => r.type !== type);
    if (this.alertRules.length < initialLength) {
      logger.info(`告警规则 '${type}' 已移除。`);
      return true;
    }
    logger.warn(`未找到告警规则 '${type}'。`);
    return false;
  }
}

export default AlertService;
