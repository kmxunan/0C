/**
 * 园区能流全景图构建模块
 * 构建"源-网-荷-储"全环节动态能源流向图
 * 实现桑基图(Sankey Diagram)可视化展示
 */

import { EventEmitter } from 'events';
import logger from '../../shared/utils/logger.js';
import { MATH_CONSTANTS } from '../../shared/constants/MathConstants.js';

class EnergyFlowVisualization extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.energySources = new Map(); // 源
    this.energyGrid = new Map(); // 网
    this.energyLoads = new Map(); // 荷
    this.energyStorage = new Map(); // 储
    this.flowData = new Map();
    this.realTimeFlows = new Map();
    this.sankeyData = null;
    
    // 能源流向配置
    this.flowConfig = {
      // 能源源头类型
      sources: {
        solar_pv: { name: '光伏发电', color: '#FFD700', icon: '☀️' },
        wind: { name: '风力发电', color: '#87CEEB', icon: '💨' },
        hydro: { name: '水力发电', color: '#4682B4', icon: '💧' },
        grid: { name: '电网供电', color: '#808080', icon: '⚡' },
        natural_gas: { name: '天然气', color: '#FF6347', icon: '🔥' },
        biomass: { name: '生物质能', color: '#228B22', icon: '🌱' }
      },
      // 电网节点类型
      grid_nodes: {
        main_transformer: { name: '主变压器', color: '#4169E1', icon: '🔌' },
        distribution_panel: { name: '配电柜', color: '#6495ED', icon: '📦' },
        smart_meter: { name: '智能电表', color: '#00CED1', icon: '📊' }
      },
      // 负荷类型
      loads: {
        industrial: { name: '工业负荷', color: '#B22222', icon: '🏭' },
        commercial: { name: '商业负荷', color: '#FF8C00', icon: '🏢' },
        residential: { name: '居民负荷', color: '#32CD32', icon: '🏠' },
        public: { name: '公共设施', color: '#9370DB', icon: '🏛️' },
        ev_charging: { name: '充电桩', color: '#FF1493', icon: '🚗' }
      },
      // 储能类型
      storage: {
        battery: { name: '电池储能', color: '#FF4500', icon: '🔋' },
        pumped_hydro: { name: '抽水蓄能', color: '#1E90FF', icon: '⛲' },
        compressed_air: { name: '压缩空气', color: '#708090', icon: '💨' },
        flywheel: { name: '飞轮储能', color: '#8A2BE2', icon: '⚙️' }
      }
    };
    
    this.init();
  }

  async init() {
    try {
      await this.loadEnergyInfrastructure();
      await this.setupRealTimeMonitoring();
      this.isInitialized = true;
      logger.info('园区能流全景图构建模块初始化完成');
      this.emit('initialized');
    } catch (error) {
      logger.error('能流全景图模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载能源基础设施数据
   */
  async loadEnergyInfrastructure() {
    try {
      // 加载能源源头设备
      const sources = await this.getEnergySourceDevices();
      sources.forEach(source => {
        this.energySources.set(source.id, {
          ...source,
          type: 'source',
          config: this.flowConfig.sources[source.energy_type] || {}
        });
      });

      // 加载电网设备
      const gridDevices = await this.getGridDevices();
      gridDevices.forEach(device => {
        this.energyGrid.set(device.id, {
          ...device,
          type: 'grid',
          config: this.flowConfig.grid_nodes[device.device_type] || {}
        });
      });

      // 加载负荷设备
      const loads = await this.getLoadDevices();
      loads.forEach(load => {
        this.energyLoads.set(load.id, {
          ...load,
          type: 'load',
          config: this.flowConfig.loads[load.load_type] || {}
        });
      });

      // 加载储能设备
      const storageDevices = await this.getStorageDevices();
      storageDevices.forEach(storage => {
        this.energyStorage.set(storage.id, {
          ...storage,
          type: 'storage',
          config: this.flowConfig.storage[storage.storage_type] || {}
        });
      });

      logger.info(`已加载能源基础设施: 源${this.energySources.size}个, 网${this.energyGrid.size}个, 荷${this.energyLoads.size}个, 储${this.energyStorage.size}个`);
    } catch (error) {
      logger.error('加载能源基础设施失败:', error);
      throw error;
    }
  }

  /**
   * 设置实时监控
   */
  async setupRealTimeMonitoring() {
    // 每30秒更新一次能流数据
    setInterval(async () => {
      try {
        await this.updateRealTimeFlows();
        await this.generateSankeyDiagram();
        this.emit('flow_updated', this.sankeyData);
      } catch (error) {
        logger.error('更新实时能流数据失败:', error);
      }
    }, MATH_CONSTANTS.THIRTY * MATH_CONSTANTS.MILLISECONDS_PER_SECOND);
  }

  /**
   * 生成园区能流全景图数据
   * @param {string} parkId - 园区ID
   * @param {string} timeRange - 时间范围
   * @returns {Object} 能流全景图数据
   */
  async generateEnergyFlowMap(parkId, timeRange = '1h') {
    try {
      // 获取实时能流数据
      const flowData = await this.getRealTimeFlowData(parkId, timeRange);
      
      // 构建能流拓扑图
      const topology = this.buildEnergyTopology(flowData);
      
      // 生成桑基图数据
      const sankeyData = this.generateSankeyData(flowData);
      
      // 计算能流统计
      const statistics = this.calculateFlowStatistics(flowData);
      
      const energyFlowMap = {
        park_id: parkId,
        time_range: timeRange,
        timestamp: new Date().toISOString(),
        topology,
        sankey_data: sankeyData,
        statistics,
        real_time_flows: this.realTimeFlows.get(parkId) || [],
        infrastructure: {
          sources: Array.from(this.energySources.values()),
          grid_nodes: Array.from(this.energyGrid.values()),
          loads: Array.from(this.energyLoads.values()),
          storage: Array.from(this.energyStorage.values())
        }
      };

      return energyFlowMap;
    } catch (error) {
      logger.error('生成园区能流全景图失败:', error);
      throw error;
    }
  }

  /**
   * 构建能源拓扑图
   * @param {Array} flowData - 能流数据
   * @returns {Object} 拓扑图数据
   */
  buildEnergyTopology(flowData) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // 添加所有设备节点
    const allDevices = [
      ...Array.from(this.energySources.values()),
      ...Array.from(this.energyGrid.values()),
      ...Array.from(this.energyLoads.values()),
      ...Array.from(this.energyStorage.values())
    ];

    allDevices.forEach(device => {
      const node = {
        id: device.id,
        name: device.name,
        type: device.type,
        category: device.energy_type || device.device_type || device.load_type || device.storage_type,
        config: device.config,
        position: device.position || this.calculateNodePosition(device),
        capacity: device.capacity || device.rated_power || 0,
        current_power: 0,
        efficiency: device.efficiency || 1.0,
        status: device.status || 'online'
      };
      nodes.push(node);
      nodeMap.set(device.id, node);
    });

    // 添加能流连接
    flowData.forEach(flow => {
      const sourceNode = nodeMap.get(flow.source_id);
      const targetNode = nodeMap.get(flow.target_id);
      
      if (sourceNode && targetNode) {
        // 更新节点功率
        sourceNode.current_power = (sourceNode.current_power || 0) + flow.power;
        targetNode.current_power = (targetNode.current_power || 0) + flow.power;
        
        // 添加连接
        links.push({
          source: flow.source_id,
          target: flow.target_id,
          power: flow.power,
          energy: flow.energy,
          efficiency: flow.efficiency || 1.0,
          flow_direction: flow.direction || 'forward',
          line_loss: flow.line_loss || 0,
          timestamp: flow.timestamp
        });
      }
    });

    return {
      nodes,
      links,
      layout: 'force_directed', // 或 'hierarchical', 'circular'
      zoom_level: 1.0,
      center_point: { x: 0, y: 0 }
    };
  }

  /**
   * 生成桑基图数据
   * @param {Array} flowData - 能流数据
   * @returns {Object} 桑基图数据
   */
  generateSankeyData(flowData) {
    const nodes = [];
    const links = [];
    const nodeIndex = new Map();
    let nodeCounter = 0;

    // 按层级组织节点
    const layers = {
      sources: [], // 第一层：能源源头
      grid: [],    // 第二层：电网节点
      storage: [], // 第三层：储能设备
      loads: []    // 第四层：负荷
    };

    // 分类设备到不同层级
    this.energySources.forEach(source => {
      const nodeId = nodeCounter++;
      const node = {
        id: nodeId,
        name: source.name,
        category: 'source',
        layer: 0,
        color: source.config.color || '#FFD700',
        icon: source.config.icon || '⚡'
      };
      nodes.push(node);
      nodeIndex.set(source.id, nodeId);
      layers.sources.push(node);
    });

    this.energyGrid.forEach(grid => {
      const nodeId = nodeCounter++;
      const node = {
        id: nodeId,
        name: grid.name,
        category: 'grid',
        layer: 1,
        color: grid.config.color || '#4169E1',
        icon: grid.config.icon || '🔌'
      };
      nodes.push(node);
      nodeIndex.set(grid.id, nodeId);
      layers.grid.push(node);
    });

    this.energyStorage.forEach(storage => {
      const nodeId = nodeCounter++;
      const node = {
        id: nodeId,
        name: storage.name,
        category: 'storage',
        layer: 2,
        color: storage.config.color || '#FF4500',
        icon: storage.config.icon || '🔋'
      };
      nodes.push(node);
      nodeIndex.set(storage.id, nodeId);
      layers.storage.push(node);
    });

    this.energyLoads.forEach(load => {
      const nodeId = nodeCounter++;
      const node = {
        id: nodeId,
        name: load.name,
        category: 'load',
        layer: 3,
        color: load.config.color || '#B22222',
        icon: load.config.icon || '🏭'
      };
      nodes.push(node);
      nodeIndex.set(load.id, nodeId);
      layers.loads.push(node);
    });

    // 生成连接数据
    flowData.forEach(flow => {
      const sourceIndex = nodeIndex.get(flow.source_id);
      const targetIndex = nodeIndex.get(flow.target_id);
      
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        links.push({
          source: sourceIndex,
          target: targetIndex,
          value: flow.power, // 功率作为流量值
          energy: flow.energy,
          efficiency: flow.efficiency || 1.0,
          color: this.getFlowColor(flow.power),
          opacity: this.getFlowOpacity(flow.power)
        });
      }
    });

    return {
      nodes,
      links,
      layers,
      layout: {
        node_width: 20,
        node_padding: 10,
        iterations: 32,
        link_curvature: 0.5
      },
      animation: {
        enabled: true,
        duration: 1000,
        easing: 'ease-in-out'
      }
    };
  }

  /**
   * 计算能流统计
   * @param {Array} flowData - 能流数据
   * @returns {Object} 统计数据
   */
  calculateFlowStatistics(flowData) {
    const stats = {
      total_generation: 0,
      total_consumption: 0,
      total_storage_charge: 0,
      total_storage_discharge: 0,
      grid_import: 0,
      grid_export: 0,
      renewable_ratio: 0,
      energy_efficiency: 0,
      peak_power: 0,
      average_power: 0,
      power_balance: 0,
      breakdown: {
        by_source: {},
        by_load: {},
        by_storage: {},
        by_time: []
      }
    };

    // 按源头统计
    this.energySources.forEach(source => {
      const sourceFlows = flowData.filter(f => f.source_id === source.id);
      const totalPower = sourceFlows.reduce((sum, f) => sum + f.power, 0);
      stats.breakdown.by_source[source.energy_type] = totalPower;
      stats.total_generation += totalPower;
    });

    // 按负荷统计
    this.energyLoads.forEach(load => {
      const loadFlows = flowData.filter(f => f.target_id === load.id);
      const totalPower = loadFlows.reduce((sum, f) => sum + f.power, 0);
      stats.breakdown.by_load[load.load_type] = totalPower;
      stats.total_consumption += totalPower;
    });

    // 按储能统计
    this.energyStorage.forEach(storage => {
      const chargeFlows = flowData.filter(f => f.target_id === storage.id);
      const dischargeFlows = flowData.filter(f => f.source_id === storage.id);
      
      const chargeTotal = chargeFlows.reduce((sum, f) => sum + f.power, 0);
      const dischargeTotal = dischargeFlows.reduce((sum, f) => sum + f.power, 0);
      
      stats.breakdown.by_storage[storage.storage_type] = {
        charge: chargeTotal,
        discharge: dischargeTotal,
        net: dischargeTotal - chargeTotal
      };
      
      stats.total_storage_charge += chargeTotal;
      stats.total_storage_discharge += dischargeTotal;
    });

    // 计算可再生能源占比
    const renewableSources = ['solar_pv', 'wind', 'hydro', 'biomass'];
    const renewableGeneration = renewableSources.reduce((sum, type) => {
      return sum + (stats.breakdown.by_source[type] || 0);
    }, 0);
    stats.renewable_ratio = stats.total_generation > 0 ? 
      (renewableGeneration / stats.total_generation * MATH_CONSTANTS.ONE_HUNDRED).toFixed(MATH_CONSTANTS.DECIMAL_PLACES) : 0;

    // 计算功率平衡
    stats.power_balance = stats.total_generation - stats.total_consumption;
    
    // 计算平均功率
    stats.average_power = flowData.length > 0 ? 
      flowData.reduce((sum, f) => sum + f.power, 0) / flowData.length : 0;
    
    // 计算峰值功率
    stats.peak_power = flowData.length > 0 ? 
      Math.max(...flowData.map(f => f.power)) : 0;

    return stats;
  }

  /**
   * 更新实时能流数据
   */
  async updateRealTimeFlows() {
    try {
      const parks = await this.getAllParks();
      
      for (const park of parks) {
        const flowData = await this.getRealTimeFlowData(park.id, '5m');
        this.realTimeFlows.set(park.id, flowData);
        
        // 发送实时更新事件
        this.emit('real_time_flow_update', {
          park_id: park.id,
          flows: flowData,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('更新实时能流数据失败:', error);
    }
  }

  /**
   * 计算节点位置
   */
  calculateNodePosition(device) {
    // 根据设备类型计算布局位置
    const typePositions = {
      source: { x: 0, y: 0 },
      grid: { x: 200, y: 0 },
      storage: { x: 400, y: 0 },
      load: { x: 600, y: 0 }
    };
    
    const basePos = typePositions[device.type] || { x: 0, y: 0 };
    return {
      x: basePos.x + Math.random() * MATH_CONSTANTS.ONE_HUNDRED,
      y: basePos.y + Math.random() * MATH_CONSTANTS.ONE_HUNDRED
    };
  }

  /**
   * 获取能流颜色
   */
  getFlowColor(power) {
    if (power > MATH_CONSTANTS.ONE_THOUSAND) {
      return '#FF0000'; // 高功率：红色
    }
    if (power > MATH_CONSTANTS.FIVE_HUNDRED) {
      return '#FF8C00';  // 中功率：橙色
    }
    if (power > MATH_CONSTANTS.ONE_HUNDRED) {
      return '#FFD700';  // 低功率：金色
    }
    return '#90EE90'; // 极低功率：浅绿色
  }

  /**
   * 获取能流透明度
   */
  getFlowOpacity(power) {
    const maxPower = MATH_CONSTANTS.TWO_THOUSAND;
    const minOpacity = MATH_CONSTANTS.POINT_THREE;
    const maxOpacity = MATH_CONSTANTS.ONE_POINT_ZERO;
    
    const ratio = Math.min(power / maxPower, 1);
    return minOpacity + (maxOpacity - minOpacity) * ratio;
  }

  // 模拟数据获取方法（实际应用中需要连接真实数据源）
  async getEnergySourceDevices() {
    return [
      { id: 'solar_001', name: '光伏电站1', energy_type: 'solar_pv', capacity: 1000, efficiency: 0.85 },
      { id: 'wind_001', name: '风力发电机1', energy_type: 'wind', capacity: 500, efficiency: 0.90 },
      { id: 'grid_001', name: '电网接入点', energy_type: 'grid', capacity: 5000, efficiency: 0.95 }
    ];
  }

  async getGridDevices() {
    return [
      { id: 'transformer_001', name: '主变压器', device_type: 'main_transformer', capacity: 5000 },
      { id: 'panel_001', name: '配电柜1', device_type: 'distribution_panel', capacity: 1000 }
    ];
  }

  async getLoadDevices() {
    return [
      { id: 'factory_001', name: '工厂1', load_type: 'industrial', capacity: 2000 },
      { id: 'office_001', name: '办公楼1', load_type: 'commercial', capacity: 500 },
      { id: 'charging_001', name: '充电站1', load_type: 'ev_charging', capacity: 300 }
    ];
  }

  async getStorageDevices() {
    return [
      { id: 'battery_001', name: '电池储能1', storage_type: 'battery', capacity: 1000, efficiency: 0.90 }
    ];
  }

  async getRealTimeFlowData(_parkId, _timeRange) {
    // TODO: 实现真实的数据库查询
    return [
      {
        source_id: 'solar_001',
        target_id: 'transformer_001',
        power: Math.random() * MATH_CONSTANTS.EIGHT_HUNDRED + MATH_CONSTANTS.TWO_HUNDRED,
        energy: Math.random() * MATH_CONSTANTS.ONE_THOUSAND,
        efficiency: 0.95,
        direction: 'forward',
        timestamp: new Date().toISOString()
      },
      {
        source_id: 'transformer_001',
        target_id: 'factory_001',
        power: Math.random() * MATH_CONSTANTS.FIFTEEN_HUNDRED + MATH_CONSTANTS.FIVE_HUNDRED,
        energy: Math.random() * MATH_CONSTANTS.TWO_THOUSAND + MATH_CONSTANTS.ONE_THOUSAND,
        efficiency: 0.98,
        direction: 'forward',
        timestamp: new Date().toISOString()
      }
    ];
  }

  async getAllParks() {
    return [
      { id: 'park_001', name: '示例园区1' }
    ];
  }
}

export default EnergyFlowVisualization;