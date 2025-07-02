const mqtt = require('mqtt');
const { db } = require('../database.js');
const { logger } = require('../utils/logger.js');
const Device = require('../models/Device.js');
const DeviceType = require('../models/DeviceType.js');
const AlertManager = require('../maintenance/AlertManager.js');
const alertManager = new AlertManager();
const { v4: uuidv4 } = require('uuid');

class DataCollector {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.connected = false;
    this.topics = [
      'park/energy/+/data',
      'park/carbon/+/data',
      'device/status/+'
    ];
    this.reconnectInterval = 5000; // 5秒重连间隔
  }

  /**
   * 连接到MQTT broker并开始数据采集
   */
  start() {
    if (this.connected) {
      logger.info('[DataCollector] 数据采集器已在运行中');
      return;
    }

    try {
      this.client = mqtt.connect(this.config.brokerUrl, {
        clientId: `data-collector-${uuidv4().substring(0, 8)}`,
        username: this.config.username,
        password: this.config.password,
        reconnectPeriod: this.reconnectInterval
      });

      // 连接成功处理
      this.client.on('connect', () => {
        this.connected = true;
        logger.info(`[DataCollector] 已连接到MQTT Broker: ${this.config.brokerUrl}`);
        this.subscribeToTopics();
      });

      // 消息接收处理
      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      // 连接错误处理
      this.client.on('error', (error) => {
        logger.error(`[DataCollector] MQTT连接错误: ${error.message}`);
        this.connected = false;
      });

      // 断开连接处理
      this.client.on('close', () => {
        if (this.connected) {
          logger.warn('[DataCollector] MQTT连接已关闭');
          this.connected = false;
        }
      });

    } catch (error) {
      logger.error(`[DataCollector] 启动失败: ${error.message}`);
    }
  }

  /**
   * 订阅指定的MQTT主题
   */
  subscribeToTopics() {
    if (!this.connected || !this.client) return;

    this.topics.forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          logger.error(`[DataCollector] 订阅主题失败 ${topic}: ${err.message}`);
        } else {
          logger.info(`[DataCollector] 已订阅主题: ${topic}`);
        }
      });
    });
  }

  /**
   * 处理接收到的MQTT消息
   * @param {string} topic - 消息主题
   * @param {Buffer} message - 消息内容
   */
  async handleMessage(topic, message) {
    try {
      const messageStr = message.toString();
      const data = JSON.parse(messageStr);

      // 提取设备ID (假设主题格式为: park/energy/{deviceId}/data)
      const topicParts = topic.split('/');
      const deviceId = topicParts[2];

      if (!deviceId || !data) {
        logger.warn('[DataCollector] 无效的消息格式');
        return;
      }

      // 验证设备是否存在
      const device = await Device.findById(deviceId);
      if (!device) {
        logger.warn(`[DataCollector] 未知设备ID: ${deviceId}`);
        return;
      }

      // 验证设备类型和数据格式
      try {
        await DeviceType.validateData(device.type, data);
      } catch (validationError) {
        logger.error(`[DataCollector] 数据验证失败: ${validationError.message}`);
        // 触发数据格式异常告警
        await alertManager.triggerAlert({
          device_id: deviceId,
          alert_type: 'DATA_FORMAT_ERROR',
          severity: 'high',
          description: `数据格式验证失败: ${validationError.message}`,
          data: { raw_data: messageStr }
        });
        return;
      }

      // 更新设备最后通信时间
      await Device.recordCommunication(deviceId);

      // 根据主题类型处理数据
      if (topic.includes('energy')) {
        await this.saveEnergyData(deviceId, data);
        // 检查能源数据是否超出阈值
        await this.checkEnergyThresholds(deviceId, data);
      } else if (topic.includes('carbon')) {
        await this.saveCarbonData(deviceId, data);
        // 检查碳排放数据是否超出阈值
        await this.checkCarbonThresholds(deviceId, data);
      } else if (topic.includes('status')) {
        await this.updateDeviceStatus(deviceId, data);
        // 如果设备状态异常，触发告警
        if (data.status === 'error' || data.status === 'warning') {
          await alertManager.triggerAlert({
            device_id: deviceId,
            alert_type: 'DEVICE_STATUS_ABNORMAL',
            severity: data.status === 'error' ? 'critical' : 'medium',
            description: `设备状态异常: ${data.status === 'error' ? '错误' : '警告'}`,
            data: { status: data.status, message: data.message || '' }
          });
        }
      }

    } catch (error) {
      logger.error(`[DataCollector] 消息处理失败: ${error.message}`);
      logger.debug(`[DataCollector] 原始消息: ${message.toString()}`);
    }
  }

  /**
   * 保存能源数据到数据库
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 能源数据
   */
  async saveEnergyData(deviceId, data) {
    const energyData = {
      id: uuidv4(),
      device_id: deviceId,
      timestamp: data.timestamp || new Date().toISOString(),
      energy_consumption: data.energy_consumption,
      power: data.power,
      voltage: data.voltage,
      current: data.current,
      frequency: data.frequency,
      power_factor: data.power_factor,
      created_at: new Date().toISOString()
    };

    await db('energy_data').insert(energyData);
    logger.debug(`[DataCollector] 已保存能源数据: ${deviceId}`);
  }

  /**
   * 保存碳排放数据到数据库
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 碳排放数据
   */
  async saveCarbonData(deviceId, data) {
    const carbonData = {
      id: uuidv4(),
      device_id: deviceId,
      timestamp: data.timestamp || new Date().toISOString(),
      carbon_emission: data.carbon_emission,
      intensity: data.intensity,
      created_at: new Date().toISOString()
    };

    await db('carbon_data').insert(carbonData);
    logger.debug(`[DataCollector] 已保存碳排放数据: ${deviceId}`);
  }

  /**
   * 更新设备状态
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 状态数据
   */
  async updateDeviceStatus(deviceId, data) {
    await Device.updateStatus(deviceId, data.status);
    logger.debug(`[DataCollector] 已更新设备状态: ${deviceId} -> ${data.status}`);
  }

  /**
   * 检查能源数据是否超出阈值
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 能源数据
   */
  async checkEnergyThresholds(deviceId, data) {
    try {
      // 获取设备信息和阈值配置
      const device = await Device.findById(deviceId);
      if (!device || !device.thresholds) return;

      const thresholds = JSON.parse(device.thresholds);
      const alerts = [];

      // 检查各项指标是否超出阈值
      if (thresholds.max_power && data.power > thresholds.max_power) {
        alerts.push({
          type: 'POWER_EXCEEDED',
          severity: 'high',
          message: `功率超出阈值 ${thresholds.max_power}W，当前值: ${data.power}W`
        });
      }

      if (thresholds.max_voltage && data.voltage > thresholds.max_voltage) {
        alerts.push({
          type: 'VOLTAGE_EXCEEDED',
          severity: 'high',
          message: `电压超出阈值 ${thresholds.max_voltage}V，当前值: ${data.voltage}V`
        });
      }

      if (thresholds.max_current && data.current > thresholds.max_current) {
        alerts.push({
          type: 'CURRENT_EXCEEDED',
          severity: 'high',
          message: `电流超出阈值 ${thresholds.max_current}A，当前值: ${data.current}A`
        });
      }

      // 触发告警
      for (const alert of alerts) {
        await alertManager.triggerAlert({
          device_id: deviceId,
          alert_type: alert.type,
          severity: alert.severity,
          description: alert.message,
          data: data
        });
      }
    } catch (error) {
      logger.error(`[DataCollector] 能源阈值检查失败: ${error.message}`);
    }
  }

  /**
   * 检查碳排放数据是否超出阈值
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 碳排放数据
   */
  async checkCarbonThresholds(deviceId, data) {
    try {
      // 获取设备信息和阈值配置
      const device = await Device.findById(deviceId);
      if (!device || !device.thresholds) return;

      const thresholds = JSON.parse(device.thresholds);
      const alerts = [];

      // 检查碳排放是否超出阈值
      if (thresholds.max_carbon_emission && data.carbon_emission > thresholds.max_carbon_emission) {
        alerts.push({
          type: 'CARBON_EXCEEDED',
          severity: 'high',
          message: `碳排放量超出阈值 ${thresholds.max_carbon_emission}kg，当前值: ${data.carbon_emission}kg`
        });
      }

      if (thresholds.max_intensity && data.intensity > thresholds.max_intensity) {
        alerts.push({
          type: 'INTENSITY_EXCEEDED',
          severity: 'medium',
          message: `碳排放强度超出阈值 ${thresholds.max_intensity}kg/kWh，当前值: ${data.intensity}kg/kWh`
        });
      }

      // 触发告警
      for (const alert of alerts) {
        await alertManager.triggerAlert({
          device_id: deviceId,
          alert_type: alert.type,
          severity: alert.severity,
          description: alert.message,
          data: data
        });
      }
    } catch (error) {
      logger.error(`[DataCollector] 碳排放阈值检查失败: ${error.message}`);
    }
  }

  /**
   * 停止数据采集并断开连接
   */
  stop() {
    if (this.client) {
      this.client.end();
      this.connected = false;
      logger.info('[DataCollector] 数据采集器已停止');
    }
  }
}

module.exports = DataCollector;