/**
 * 数字孪生数据管理器
 * 负责实时数据的获取、处理和分发
 */

import { EventEmitter } from 'events';
import { MATH_CONSTANTS } from '../../shared/constants/MathConstants.js';
import { defaultLogger } from '../../shared/utils/logger.js';

const logger = defaultLogger.child('DataManager');

class DataManager extends EventEmitter {
  constructor(apiBaseUrl = '/api') {
    super();
    this.apiBaseUrl = apiBaseUrl;
    this.devices = new Map();
    this.sensors = new Map();
    this.energyData = new Map();
    this.carbonData = new Map();
    this.updateInterval = null;

    this.init();
  }

  async init() {
    try {
      // 初始化设备和传感器数据
      await this.loadDevices();
      await this.loadSensors();

      // 定期更新数据
      this.startDataUpdate();

      logger.info('数字孪生数据管理器初始化完成');
    } catch (error) {
      logger.error('数据管理器初始化失败', { error: error.message, stack: error.stack });
    }
  }

  // 加载设备列表
  async loadDevices() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devices`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取设备列表失败');
      }

      const result = await response.json();
      const devices = result.data || [];

      devices.forEach((device) => {
        this.devices.set(device.id, {
          ...device,
          lastUpdate: null,
          status: device.status || 'unknown'
        });
      });

      this.emit('devicesLoaded', devices);
      logger.info(`加载了 ${devices.length} 个设备`);
    } catch (error) {
      logger.error('加载设备失败', { error: error.message, stack: error.stack });
      this.emit('error', { type: 'loadDevices', error });
    }
  }

  // 加载传感器列表
  async loadSensors() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sensors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取传感器列表失败');
      }

      const result = await response.json();
      const sensors = result.data || [];

      sensors.forEach((sensor) => {
        this.sensors.set(sensor.id, {
          ...sensor,
          lastValue: null,
          lastUpdate: null
        });
      });

      this.emit('sensorsLoaded', sensors);
      logger.info(`加载了 ${sensors.length} 个传感器`);
    } catch (error) {
      logger.error('加载传感器失败', { error: error.message, stack: error.stack });
      this.emit('error', { type: 'loadSensors', error });
    }
  }

  // 获取实时能源数据
  async getEnergyData(deviceId, timeRange = '1h') {
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - this.parseTimeRange(timeRange)).toISOString();

      const response = await fetch(
        `${this.apiBaseUrl}/energy-data?device_id=${deviceId}&start_time=${startTime}&end_time=${endTime}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('获取能源数据失败');
      }

      const result = await response.json();
      const data = result.data || [];

      // 更新本地缓存
      this.energyData.set(deviceId, {
        data,
        lastUpdate: new Date(),
        timeRange
      });

      this.emit('energyDataUpdated', { deviceId, data });
      return data;
    } catch (error) {
      logger.error('获取能源数据失败', { deviceId, error: error.message, stack: error.stack });
      this.emit('error', { type: 'getEnergyData', deviceId, error });
      return [];
    }
  }

  // 获取碳排放数据
  async getCarbonData(deviceId, timeRange = '1h') {
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - this.parseTimeRange(timeRange)).toISOString();

      const response = await fetch(
        `${this.apiBaseUrl}/carbon-data?device_id=${deviceId}&start_time=${startTime}&end_time=${endTime}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('获取碳排放数据失败');
      }

      const result = await response.json();
      const data = result.data || [];

      // 更新本地缓存
      this.carbonData.set(deviceId, {
        data,
        lastUpdate: new Date(),
        timeRange
      });

      this.emit('carbonDataUpdated', { deviceId, data });
      return data;
    } catch (error) {
      logger.error('获取碳排放数据失败', { deviceId, error: error.message, stack: error.stack });
      this.emit('error', { type: 'getCarbonData', deviceId, error });
      return [];
    }
  }

  // 建立WebSocket连接

  // 处理实时消息

  // 处理能源数据更新

  // 处理设备状态更新

  // 处理告警

  // 处理碳排放数据更新

  // 开始定期数据更新
  startDataUpdate(interval = MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.MILLISECONDS_PER_SECOND / MATH_CONSTANTS.TWO) {
    // 默认30秒
    this.updateInterval = setInterval(async () => {
      try {
        // 更新所有设备的能源数据
        for (const [deviceId] of this.devices) {
          await this.getEnergyData(deviceId);
          await this.getCarbonData(deviceId);
        }
      } catch (error) {
        logger.error('定期数据更新失败', { error: error.message, stack: error.stack });
      }
    }, interval);
  }

  // 停止数据更新
  stopDataUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // 解析时间范围
  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'h':
        return value * MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.MILLISECONDS_PER_SECOND;
      case 'd':
        return value * MATH_CONSTANTS.HOURS_PER_DAY * MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.MILLISECONDS_PER_SECOND;
      case 'm':
        return value * MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.MILLISECONDS_PER_SECOND;
      default:
        return MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.SECONDS_PER_MINUTE * MATH_CONSTANTS.MILLISECONDS_PER_SECOND; // 默认1小时
    }
  }

  // 获取设备信息
  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  // 获取传感器信息
  getSensor(sensorId) {
    return this.sensors.get(sensorId);
  }

  // 获取所有设备
  getAllDevices() {
    return Array.from(this.devices.values());
  }

  // 获取所有传感器
  getAllSensors() {
    return Array.from(this.sensors.values());
  }

  // 清理资源
  dispose() {
    this.stopDataUpdate();

    this.removeAllListeners();
    this.devices.clear();
    this.sensors.clear();
    this.energyData.clear();
    this.carbonData.clear();
  }
}

export default DataManager;
