import crypto from 'crypto';
/* eslint-disable no-console, no-magic-numbers */
// 安全随机数生成函数
function _generateSecureRandom() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 数字孪生控制器
 * 整合场景管理和数据管理，提供统一的数字孪生接口
 */

import SceneManager from './SceneManager.js';
import DataManager from './DataManager.js';

class DigitalTwinController {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      apiBaseUrl: '/api',
      updateInterval: 11250,
      enableRealtime: true,
      ...options
    };

    this.sceneManager = null;
    this.dataManager = null;
    this.isInitialized = false;
    this.parkData = null;
    this.alerts = [];

    this.init();
  }

  async init() {
    try {
      console.log('初始化数字孪生系统...');

      // 初始化场景管理器
      this.sceneManager = new SceneManager(this.container);

      // 初始化数据管理器
      this.dataManager = new DataManager(this.options.apiBaseUrl);

      // 设置事件监听
      this.setupEventListeners();

      // 加载园区数据
      await this.loadParkData();

      this.isInitialized = true;
      console.log('数字孪生系统初始化完成');
    } catch (error) {
      console.error('数字孪生系统初始化失败:', error);
      throw error;
    }
  }

  // 设置事件监听
  setupEventListeners() {
    // 监听设备数据加载完成
    this.dataManager.on('devicesLoaded', (devices) => {
      this.createDevicesInScene(devices);
    });

    // 监听实时能源数据
    this.dataManager.on('realtimeEnergyData', (data) => {
      this.updateDeviceVisualization(data);
    });

    // 监听设备状态变化
    this.dataManager.on('deviceStatusChanged', (data) => {
      this.updateDeviceStatus(data);
    });

    // 监听告警
    this.dataManager.on('alert', (alert) => {
      this.handleAlert(alert);
    });

    // 监听碳排放数据
    this.dataManager.on('realtimeCarbonData', (data) => {
      this.updateCarbonVisualization(data);
    });

    // 监听错误
    this.dataManager.on('error', (error) => {
      console.error('数据管理器错误:', error);
    });
  }

  // 加载园区数据
  async loadParkData() {
    try {
      const response = await fetch(`${this.options.apiBaseUrl}/parks`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取园区数据失败');
      }

      const result = await response.json();
      this.parkData = result.data || [];

      // 创建园区建筑
      this.createBuildingsInScene();
    } catch (error) {
      console.error('加载园区数据失败:', error);
      // 使用模拟数据
      this.createMockParkData();
    }
  }

  // 创建模拟园区数据

  // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

  createMockParkData() {
    this.parkData = {
      id: 'park_001',
      name: '零碳示范园区',
      buildings: [
        {
          id: 'building_001',
          name: '办公楼A',
          type: 'office',
          position: { x: 0, y: 0, z: 0 },
          dimensions: { width: 30, height: 40, depth: 20 },
          color: 0x66c2a5
        },
        {
          id: 'building_002',
          name: '生产车间B',
          type: 'industrial',
          position: { x: 50, y: 0, z: 0 },
          dimensions: { width: 40, height: 25, depth: 30 },
          color: 0x4a90e2
        },
        {
          id: 'building_003',
          name: '仓储中心C',
          type: 'warehouse',
          position: { x: -40, y: 0, z: 30 },
          dimensions: { width: 35, height: 15, depth: 25 },
          color: 0xfc8d62
        }
      ]
    };

    this.createBuildingsInScene();
  }

  // 在场景中创建建筑
  createBuildingsInScene() {
    if (!this.parkData || !this.parkData.buildings) {
      return;
    }

    this.parkData.buildings.forEach((building) => {
      this.sceneManager.createBuilding(building);
    });
  }

  // 在场景中创建设备
  createDevicesInScene(devices) {
    devices.forEach((device) => {
      // 为设备分配位置（如果没有指定）
      if (!device.position) {
        device.position = this.generateDevicePosition(device);
      }

      this.sceneManager.createDevice(device);
    });
  }

  // 生成设备位置
  generateDevicePosition(device) {
    // 根据设备类型和建筑ID生成合理的位置
    const buildingId = device.building_id;
    const building = this.parkData?.buildings?.find((b) => b.id === buildingId);

    if (building) {
      // 在建筑周围随机分布
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetZ = (Math.random() - 0.5) * 20;

      return {
        x: building.position.x + offsetX,
        y: 2,
        z: building.position.z + offsetZ
      };
    }

    // 默认随机位置
    return {
      x: (Math.random() - 0.5) * 100,
      y: 2,
      z: (Math.random() - 0.5) * 100
    };
  }

  // 更新设备可视化
  updateDeviceVisualization(data) {
    const { deviceId, value, unit } = data;

    // 更新设备的数据可视化
    this.sceneManager.addDataVisualization(deviceId, value);

    // 触发自定义事件
    this.dispatchEvent('deviceDataUpdated', {
      deviceId,
      value,
      unit,
      timestamp: new Date()
    });
  }

  // 更新设备状态
  updateDeviceStatus(data) {
    const { deviceId, status, device } = data;

    this.sceneManager.updateDeviceStatus(deviceId, status, device);

    // 触发自定义事件
    this.dispatchEvent('deviceStatusUpdated', {
      deviceId,
      status,
      device
    });
  }

  // 更新碳排放可视化
  updateCarbonVisualization(data) {
    const { deviceId, emissionValue } = data;

    // 可以在这里添加碳排放的特殊可视化效果
    // 比如粒子效果、颜色变化等

    this.dispatchEvent('carbonDataUpdated', {
      deviceId,
      emissionValue,
      timestamp: new Date()
    });
  }

  // 处理告警
  handleAlert(alert) {
    const { deviceId, level, message: _message } = alert;

    // 添加到告警列表
    this.alerts.unshift({
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // 保持最近100条告警
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    // 在场景中显示告警效果
    this.showAlertInScene(deviceId, level);

    // 触发自定义事件
    this.dispatchEvent('alert', alert);
  }

  // 在场景中显示告警效果
  showAlertInScene(deviceId, level) {
    // 可以添加闪烁效果、颜色变化等
    const device = this.sceneManager.devices.get(deviceId);
    if (device) {
      // 根据告警级别设置颜色
      let color;
      switch (level) {
        case 'critical':
          color = 0xff0000;
          break;
        case 'warning':
          color = 0xffa500;
          break;
        default:
          color = 0xffff00;
      }

      // 临时改变设备颜色
      const originalColor = device.material.color.getHex();
      device.material.color.setHex(color);

      // 3秒后恢复原色
      setTimeout(() => {
        device.material.color.setHex(originalColor);
      }, 3000);
    }
  }

  // 获取设备详细信息
  async getDeviceDetails(deviceId) {
    try {
      const response = await fetch(`${this.options.apiBaseUrl}/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取设备详情失败');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取设备详情失败:', error);
      return null;
    }
  }

  // 获取能源数据统计
  async getEnergyStatistics(timeRange = '24h') {
    try {
      const response = await fetch(
        `${this.options.apiBaseUrl}/energy-data/statistics?time_range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('获取能源统计失败');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取能源统计失败:', error);
      return null;
    }
  }

  // 获取碳排放统计
  async getCarbonStatistics(timeRange = '24h') {
    try {
      const response = await fetch(
        `${this.options.apiBaseUrl}/carbon-data/statistics?time_range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('获取碳排放统计失败');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取碳排放统计失败:', error);
      return null;
    }
  }

  // 设置相机视角
  setCameraView(position, target) {
    if (this.sceneManager && this.sceneManager.camera) {
      this.sceneManager.camera.position.set(position.x, position.y, position.z);
      if (target) {
        this.sceneManager.camera.lookAt(target.x, target.y, target.z);
      }
    }
  }

  // 聚焦到设备
  focusOnDevice(deviceId) {
    const device = this.sceneManager.devices.get(deviceId);
    if (device) {
      const { position } = device;
      this.setCameraView({ x: position.x + 20, y: position.y + 20, z: position.z + 20 }, position);
    }
  }

  // 获取告警列表
  getAlerts(limit = 10) {
    return this.alerts.slice(0, limit);
  }

  // 清除告警
  clearAlert(alertId) {
    this.alerts = this.alerts.filter((alert) => alert.id !== alertId);
  }

  // 自定义事件分发
  dispatchEvent(eventType, data) {
    const event = new CustomEvent(eventType, { detail: data });
    this.container.dispatchEvent(event);
  }

  // 添加事件监听
  addEventListener(eventType, callback) {
    this.container.addEventListener(eventType, callback);
  }

  // 移除事件监听
  removeEventListener(eventType, callback) {
    this.container.removeEventListener(eventType, callback);
  }

  // 销毁数字孪生系统
  dispose() {
    if (this.sceneManager) {
      this.sceneManager.dispose();
      this.sceneManager = null;
    }

    if (this.dataManager) {
      this.dataManager.dispose();
      this.dataManager = null;
    }

    this.alerts = [];
    this.parkData = null;
    this.isInitialized = false;
  }
}

export default DigitalTwinController;
