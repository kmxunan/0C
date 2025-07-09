/**
 * 边缘计算控制器
 * 提供边缘计算功能的REST API接口
 */

import EdgeComputingService from '../../../core/services/EdgeComputingService.js';
import logger from '../../../shared/utils/logger.js';
import { HTTP_STATUS_CODES } from '../../../shared/constants/HttpStatusCodes.js';

class EdgeComputingController {
    constructor() {
        this.edgeComputingService = new EdgeComputingService();
        this.initializeEventListeners();
    }
    
    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        this.edgeComputingService.on('nodeRegistered', (node) => {
            logger.info('边缘节点注册事件', { nodeId: node.id, nodeName: node.name });
        });
        
        this.edgeComputingService.on('nodeOffline', (node) => {
            logger.warn('边缘节点离线事件', { nodeId: node.id, nodeName: node.name });
        });
        
        this.edgeComputingService.on('deviceConnected', (device) => {
            logger.info('设备连接事件', { deviceId: device.id, deviceName: device.name });
        });
        
        this.edgeComputingService.on('dataProcessed', (result) => {
            logger.debug('数据处理完成事件', { processorId: result.processorId, nodeId: result.nodeId });
        });
    }
    
    /**
     * 获取服务状态
     * GET /api/v1/edge-computing/status
     */
    async getServiceStatus(req, res) {
        try {
            const status = this.edgeComputingService.getServiceStatus();
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取边缘计算服务状态成功',
                data: {
                    status,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取边缘计算服务状态失败', { error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '获取边缘计算服务状态失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取边缘节点列表
     * GET /api/v1/edge-computing/nodes
     */
    async getEdgeNodes(req, res) {
        try {
            const { status, type, location } = req.query;
            
            let nodes = Array.from(this.edgeComputingService.edgeNodes.values());
            
            // 过滤条件
            if (status) {
                nodes = nodes.filter(node => 
                    this.edgeComputingService.nodeStatus.get(node.id) === status
                );
            }
            
            if (type) {
                nodes = nodes.filter(node => node.type === type);
            }
            
            if (location) {
                nodes = nodes.filter(node => 
                    node.location.toLowerCase().includes(location.toLowerCase())
                );
            }
            
            // 添加实时状态和指标
            const nodesWithStatus = nodes.map(node => ({
                ...node,
                currentStatus: this.edgeComputingService.nodeStatus.get(node.id),
                currentMetrics: this.edgeComputingService.nodeMetrics.get(node.id),
                connectedDevicesCount: node.devices ? node.devices.size : 0
            }));
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取边缘节点列表成功',
                data: {
                    nodes: nodesWithStatus,
                    total: nodesWithStatus.length,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取边缘节点列表失败', { error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '获取边缘节点列表失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取边缘节点详情
     * GET /api/v1/edge-computing/nodes/:nodeId
     */
    async getEdgeNodeDetails(req, res) {
        try {
            const { nodeId } = req.params;
            
            const nodeDetails = this.edgeComputingService.getNodeDetails(nodeId);
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取边缘节点详情成功',
                data: {
                    node: nodeDetails,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取边缘节点详情失败', { nodeId: req.params.nodeId, error: error.message });
            
            const statusCode = error.message.includes('不存在') ? 
                HTTP_STATUS_CODES.NOT_FOUND : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
            
            res.status(statusCode).json({
                success: false,
                message: '获取边缘节点详情失败',
                error: error.message
            });
        }
    }
    
    /**
     * 注册边缘节点
     * POST /api/v1/edge-computing/nodes
     */
    async registerEdgeNode(req, res) {
        try {
            const nodeConfig = req.body;
            
            // 验证必需字段
            const requiredFields = ['id', 'name', 'type', 'location', 'capabilities', 'resources'];
            for (const field of requiredFields) {
                if (!nodeConfig[field]) {
                    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
                        success: false,
                        message: `缺少必需字段: ${field}`
                    });
                }
            }
            
            // 验证资源配置
            const { resources } = nodeConfig;
            if (!resources.cpu || !resources.memory || !resources.storage) {
                return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: '资源配置不完整，需要包含cpu、memory、storage'
                });
            }
            
            const node = await this.edgeComputingService.registerEdgeNode(nodeConfig);
            
            res.status(HTTP_STATUS_CODES.CREATED).json({
                success: true,
                message: '边缘节点注册成功',
                data: {
                    node,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('边缘节点注册失败', { error: error.message, nodeConfig: req.body });
            
            const statusCode = error.message.includes('已存在') ? 
                HTTP_STATUS_CODES.CONFLICT : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
            
            res.status(statusCode).json({
                success: false,
                message: '边缘节点注册失败',
                error: error.message
            });
        }
    }
    
    /**
     * 启动边缘节点
     * POST /api/v1/edge-computing/nodes/:nodeId/start
     */
    async startEdgeNode(req, res) {
        try {
            const { nodeId } = req.params;
            
            await this.edgeComputingService.startEdgeNode(nodeId);
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '边缘节点启动成功',
                data: {
                    nodeId,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('边缘节点启动失败', { nodeId: req.params.nodeId, error: error.message });
            
            const statusCode = error.message.includes('不存在') ? 
                HTTP_STATUS_CODES.NOT_FOUND : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
            
            res.status(statusCode).json({
                success: false,
                message: '边缘节点启动失败',
                error: error.message
            });
        }
    }
    
    /**
     * 停止边缘节点
     * POST /api/v1/edge-computing/nodes/:nodeId/stop
     */
    async stopEdgeNode(req, res) {
        try {
            const { nodeId } = req.params;
            
            await this.edgeComputingService.stopEdgeNode(nodeId);
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '边缘节点停止成功',
                data: {
                    nodeId,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('边缘节点停止失败', { nodeId: req.params.nodeId, error: error.message });
            
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '边缘节点停止失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取连接的设备列表
     * GET /api/v1/edge-computing/devices
     */
    async getConnectedDevices(req, res) {
        try {
            const { type, status, nodeId } = req.query;
            
            let devices = Array.from(this.edgeComputingService.connectedDevices.values());
            
            // 过滤条件
            if (type) {
                devices = devices.filter(device => device.type === type);
            }
            
            if (status) {
                const isOnline = status === 'online';
                devices = devices.filter(device => device.isOnline === isOnline);
            }
            
            if (nodeId) {
                devices = devices.filter(device => device.assignedNodeId === nodeId);
            }
            
            // 添加实时指标
            const devicesWithMetrics = devices.map(device => ({
                ...device,
                currentMetrics: this.edgeComputingService.deviceMetrics.get(device.id)
            }));
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取连接设备列表成功',
                data: {
                    devices: devicesWithMetrics,
                    total: devicesWithMetrics.length,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取连接设备列表失败', { error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '获取连接设备列表失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取设备详情
     * GET /api/v1/edge-computing/devices/:deviceId
     */
    async getDeviceDetails(req, res) {
        try {
            const { deviceId } = req.params;
            
            const deviceDetails = this.edgeComputingService.getDeviceDetails(deviceId);
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取设备详情成功',
                data: {
                    device: deviceDetails,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取设备详情失败', { deviceId: req.params.deviceId, error: error.message });
            
            const statusCode = error.message.includes('不存在') ? 
                HTTP_STATUS_CODES.NOT_FOUND : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
            
            res.status(statusCode).json({
                success: false,
                message: '获取设备详情失败',
                error: error.message
            });
        }
    }
    
    /**
     * 连接设备
     * POST /api/v1/edge-computing/devices
     */
    async connectDevice(req, res) {
        try {
            const deviceConfig = req.body;
            
            // 验证必需字段
            const requiredFields = ['id', 'name', 'type', 'location'];
            for (const field of requiredFields) {
                if (!deviceConfig[field]) {
                    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
                        success: false,
                        message: `缺少必需字段: ${field}`
                    });
                }
            }
            
            const device = await this.edgeComputingService.connectDevice(deviceConfig);
            
            res.status(HTTP_STATUS_CODES.CREATED).json({
                success: true,
                message: '设备连接成功',
                data: {
                    device,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('设备连接失败', { error: error.message, deviceConfig: req.body });
            
            const statusCode = error.message.includes('已存在') ? 
                HTTP_STATUS_CODES.CONFLICT : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
            
            res.status(statusCode).json({
                success: false,
                message: '设备连接失败',
                error: error.message
            });
        }
    }
    
    /**
     * 断开设备连接
     * DELETE /api/v1/edge-computing/devices/:deviceId
     */
    async disconnectDevice(req, res) {
        try {
            const { deviceId } = req.params;
            
            await this.edgeComputingService.disconnectDevice(deviceId);
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '设备断开连接成功',
                data: {
                    deviceId,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('设备断开连接失败', { deviceId: req.params.deviceId, error: error.message });
            
            const statusCode = error.message.includes('不存在') ? 
                HTTP_STATUS_CODES.NOT_FOUND : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
            
            res.status(statusCode).json({
                success: false,
                message: '设备断开连接失败',
                error: error.message
            });
        }
    }
    
    /**
     * 处理数据
     * POST /api/v1/edge-computing/process
     */
    async processData(req, res) {
        try {
            const { data, processorId, nodeId } = req.body;
            
            // 验证必需字段
            if (!data || !processorId) {
                return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: '缺少必需字段: data 和 processorId'
                });
            }
            
            const result = await this.edgeComputingService.processData(data, processorId, nodeId);
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '数据处理成功',
                data: {
                    result,
                    processorId,
                    nodeId,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('数据处理失败', { error: error.message, requestBody: req.body });
            
            const statusCode = error.message.includes('不存在') ? 
                HTTP_STATUS_CODES.NOT_FOUND : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
            
            res.status(statusCode).json({
                success: false,
                message: '数据处理失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取数据处理器统计
     * GET /api/v1/edge-computing/processors/stats
     */
    async getProcessorStats(req, res) {
        try {
            const stats = this.edgeComputingService.getProcessorStats();
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取数据处理器统计成功',
                data: {
                    stats,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取数据处理器统计失败', { error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '获取数据处理器统计失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取节点指标
     * GET /api/v1/edge-computing/nodes/:nodeId/metrics
     */
    async getNodeMetrics(req, res) {
        try {
            const { nodeId } = req.params;
            const { timeRange = '1h' } = req.query;
            
            const node = this.edgeComputingService.edgeNodes.get(nodeId);
            if (!node) {
                return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
                    success: false,
                    message: `边缘节点不存在: ${nodeId}`
                });
            }
            
            const currentMetrics = this.edgeComputingService.nodeMetrics.get(nodeId);
            
            // 生成历史指标数据 (模拟)
            const historicalMetrics = this.generateHistoricalMetrics(timeRange);
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取节点指标成功',
                data: {
                    nodeId,
                    nodeName: node.name,
                    currentMetrics,
                    historicalMetrics,
                    timeRange,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取节点指标失败', { nodeId: req.params.nodeId, error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '获取节点指标失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取设备指标
     * GET /api/v1/edge-computing/devices/:deviceId/metrics
     */
    async getDeviceMetrics(req, res) {
        try {
            const { deviceId } = req.params;
            const { timeRange = '1h' } = req.query;
            
            const device = this.edgeComputingService.connectedDevices.get(deviceId);
            if (!device) {
                return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
                    success: false,
                    message: `设备不存在: ${deviceId}`
                });
            }
            
            const currentMetrics = this.edgeComputingService.deviceMetrics.get(deviceId);
            
            // 生成历史指标数据 (模拟)
            const historicalMetrics = this.generateDeviceHistoricalMetrics(device.type, timeRange);
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取设备指标成功',
                data: {
                    deviceId,
                    deviceName: device.name,
                    deviceType: device.type,
                    currentMetrics,
                    historicalMetrics,
                    timeRange,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取设备指标失败', { deviceId: req.params.deviceId, error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '获取设备指标失败',
                error: error.message
            });
        }
    }
    
    /**
     * 执行云端同步
     * POST /api/v1/edge-computing/sync
     */
    async performCloudSync(req, res) {
        try {
            await this.edgeComputingService.performCloudSync();
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '云端同步执行成功',
                data: {
                    lastSync: this.edgeComputingService.lastCloudSync,
                    isOnline: this.edgeComputingService.isOnline,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('云端同步执行失败', { error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '云端同步执行失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取离线队列状态
     * GET /api/v1/edge-computing/offline-queue
     */
    async getOfflineQueueStatus(req, res) {
        try {
            const queueStatus = {
                size: this.edgeComputingService.offlineQueue.length,
                items: this.edgeComputingService.offlineQueue.slice(0, 10), // 只返回前10项
                isOnline: this.edgeComputingService.isOnline,
                lastSync: this.edgeComputingService.lastCloudSync
            };
            
            res.status(HTTP_STATUS_CODES.OK).json({
                success: true,
                message: '获取离线队列状态成功',
                data: {
                    queueStatus,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('获取离线队列状态失败', { error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '获取离线队列状态失败',
                error: error.message
            });
        }
    }
    
    /**
     * 健康检查
     * GET /api/v1/edge-computing/health
     */
    async healthCheck(req, res) {
        try {
            const status = this.edgeComputingService.getServiceStatus();
            const isHealthy = status.isInitialized && 
                            status.edgeNodes.online > 0 && 
                            status.dataProcessors.active > 0;
            
            const healthStatus = {
                healthy: isHealthy,
                service: {
                    initialized: status.isInitialized,
                    online: status.isOnline,
                    lastSync: status.lastCloudSync
                },
                nodes: {
                    total: status.edgeNodes.total,
                    online: status.edgeNodes.online,
                    offline: status.edgeNodes.offline
                },
                devices: {
                    total: status.connectedDevices.total,
                    online: status.connectedDevices.online
                },
                processors: {
                    total: status.dataProcessors.total,
                    active: status.dataProcessors.active
                },
                offlineQueue: {
                    size: status.offlineQueueSize
                }
            };
            
            const statusCode = isHealthy ? HTTP_STATUS_CODES.OK : HTTP_STATUS_CODES.SERVICE_UNAVAILABLE;
            
            res.status(statusCode).json({
                success: isHealthy,
                message: isHealthy ? '边缘计算服务健康' : '边缘计算服务异常',
                data: {
                    health: healthStatus,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('健康检查失败', { error: error.message });
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: '健康检查失败',
                error: error.message
            });
        }
    }
    
    /**
     * 生成历史指标数据 (模拟)
     */
    generateHistoricalMetrics(timeRange) {
        const now = new Date();
        const points = [];
        let interval, count;
        
        switch (timeRange) {
            case '1h':
                interval = 5 * 60 * 1000; // 5分钟
                count = 12;
                break;
            case '6h':
                interval = 30 * 60 * 1000; // 30分钟
                count = 12;
                break;
            case '24h':
                interval = 2 * 60 * 60 * 1000; // 2小时
                count = 12;
                break;
            case '7d':
                interval = 12 * 60 * 60 * 1000; // 12小时
                count = 14;
                break;
            default:
                interval = 5 * 60 * 1000;
                count = 12;
        }
        
        for (let i = count - 1; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * interval);
            points.push({
                timestamp,
                cpuUsage: Math.random() * 60 + 20,
                memoryUsage: Math.random() * 50 + 30,
                storageUsage: Math.random() * 40 + 40,
                networkLatency: Math.random() * 40 + 10,
                tasksProcessed: Math.floor(Math.random() * 100 + 50),
                errorsCount: Math.floor(Math.random() * 5)
            });
        }
        
        return points;
    }
    
    /**
     * 生成设备历史指标数据 (模拟)
     */
    generateDeviceHistoricalMetrics(deviceType, timeRange) {
        const now = new Date();
        const points = [];
        let interval, count;
        
        switch (timeRange) {
            case '1h':
                interval = 5 * 60 * 1000;
                count = 12;
                break;
            case '6h':
                interval = 30 * 60 * 1000;
                count = 12;
                break;
            case '24h':
                interval = 2 * 60 * 60 * 1000;
                count = 12;
                break;
            case '7d':
                interval = 12 * 60 * 60 * 1000;
                count = 14;
                break;
            default:
                interval = 5 * 60 * 1000;
                count = 12;
        }
        
        for (let i = count - 1; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * interval);
            const basePoint = {
                timestamp,
                cpuUsage: Math.random() * 40 + 20,
                memoryUsage: Math.random() * 30 + 25,
                networkLatency: Math.random() * 20 + 5,
                dataRate: Math.random() * 800 + 200,
                errorRate: Math.random() * 0.03
            };
            
            // 根据设备类型添加特定指标
            switch (deviceType) {
                case 'energy-meter':
                    basePoint.energyConsumption = Math.random() * 80 + 60;
                    basePoint.voltage = Math.random() * 15 + 225;
                    basePoint.current = Math.random() * 8 + 7;
                    basePoint.powerFactor = Math.random() * 0.15 + 0.85;
                    break;
                
                case 'temperature-sensor':
                    basePoint.temperature = Math.random() * 12 + 22;
                    basePoint.humidity = Math.random() * 25 + 45;
                    basePoint.pressure = Math.random() * 15 + 1005;
                    break;
                
                case 'air-quality-sensor':
                    basePoint.pm25 = Math.random() * 40 + 15;
                    basePoint.pm10 = Math.random() * 60 + 30;
                    basePoint.co2 = Math.random() * 150 + 450;
                    basePoint.voc = Math.random() * 80 + 60;
                    break;
            }
            
            points.push(basePoint);
        }
        
        return points;
    }
}

export default EdgeComputingController;