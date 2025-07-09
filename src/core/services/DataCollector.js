import mqtt from 'mqtt';
// const { db } = require('../database.js'); // 暂时注释掉，避免模块找不到
// const Device = require('../models/Device.js'); // 暂时注释掉，避免模块找不到
// const DeviceType = require('../models/DeviceType.js'); // 暂时注释掉，避免模块找不到
// const AlertManager = require('../maintenance/AlertManager.js'); // 暂时注释掉，避免模块找不到
// const alertManager = new AlertManager();
import { v4 as uuidv4 } from 'uuid';
import { MATH_CONSTANTS } from '../../shared/constants/MathConstants.js';
import { defaultLogger } from '../../shared/utils/logger.js';

const logger = defaultLogger.child('DataCollector');

class DataCollector {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.connected = false;
    this.topics = ['park/energy/+/data', 'park/carbon/+/data', 'device/status/+'];
    this.reconnectInterval = MATH_CONSTANTS.FIVE * MATH_CONSTANTS.MILLISECONDS_PER_SECOND; // 5秒重连间隔
  }

  /**
   * 初始化数据采集器
   */
  async initialize() {
    logger.info('[DataCollector] 初始化数据采集器');
    // 暂时不启动 MQTT 连接，避免配置问题
    // this.start();
    return Promise.resolve();
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
        clientId: `data-collector-${uuidv4().substring(0, MATH_CONSTANTS.MIN_PASSWORD_LENGTH)}`,
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
    if (!this.connected || !this.client) {
      return;
    }

    this.topics.forEach((topic) => {
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
      const [, , deviceId] = topicParts;

      if (!deviceId || !data) {
        logger.warn('[DataCollector] 无效的消息格式');
        return;
      }

      // 验证设备是否存在 (暂时跳过)
      // const device = await Device.findById(deviceId);
      // if (!device) {
      //   logger.warn(`[DataCollector] 未知设备ID: ${deviceId}`);
      //   return;
      // }

      // 验证设备类型和数据格式 (暂时跳过)
      // try {
      //   await DeviceType.validateData(device.type, data);
      // } catch (validationError) {
      //   logger.error(`[DataCollector] 数据验证失败: ${validationError.message}`);
      //   // 触发数据格式异常告警
      //   await alertManager.triggerAlert({
      //     device_id: deviceId,
      //     alert_type: 'DATA_FORMAT_ERROR',
      //     severity: 'high',
      //     description: `数据格式验证失败: ${validationError.message}`,
      //     data: { raw_data: messageStr },
      //   });
      //   return;
      // }

      // 更新设备最后通信时间 (暂时跳过)
      // await Device.recordCommunication(deviceId);

      logger.info(`[DataCollector] 处理设备 ${deviceId} 的数据`);

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
        // 如果设备状态异常，触发告警 (暂时跳过)
        // if (data.status === 'error' || data.status === 'warning') {
        //   await alertManager.triggerAlert({
        //     device_id: deviceId,
        //     alert_type: 'DEVICE_STATUS_ABNORMAL',
        //     severity: data.status === 'error' ? 'critical' : 'medium',
        //     description: `设备状态异常: ${data.status === 'error' ? '错误' : '警告'}`,
        //     data: { status: data.status, message: data.message || '' },
        //   });
        // }
        logger.info(`[DataCollector] 设备状态更新: ${deviceId} -> ${data.status}`);
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

    // 暂时注释掉数据库操作
    // await db('energy_data').insert(energyData);
    logger.debug(`[DataCollector] 模拟保存能源数据: ${deviceId}`, energyData);
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

    // 暂时注释掉数据库操作
    // await db('carbon_data').insert(carbonData);
    logger.debug(`[DataCollector] 模拟保存碳排放数据: ${deviceId}`, carbonData);
  }

  /**
   * 更新设备状态
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 状态数据
   */
  async updateDeviceStatus(deviceId, data) {
    // 暂时注释掉数据库操作
    // await Device.updateStatus(deviceId, data.status);
    logger.debug(`[DataCollector] 模拟更新设备状态: ${deviceId} -> ${data.status}`);
  }

  /**
   * 检查能源数据是否超出阈值
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 能源数据
   */
  async checkEnergyThresholds(deviceId, data) {
    // 暂时注释掉阈值检查功能
    // const device = await Device.findById(deviceId);
    // if (!device || !device.thresholds) {
    //   return;
    // }

    logger.debug(`[DataCollector] 模拟检查能源阈值: ${deviceId}`, data);
  }

  /**
   * 检查碳排放数据是否超出阈值
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 碳排放数据
   */
  async checkCarbonThresholds(deviceId, data) {
    // 暂时注释掉碳排放阈值检查功能
    // const device = await Device.findById(deviceId);
    // if (!device || !device.thresholds) {
    //   return;
    // }

    logger.debug(`[DataCollector] 模拟检查碳排放阈值: ${deviceId}`, data);
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

export default DataCollector;
