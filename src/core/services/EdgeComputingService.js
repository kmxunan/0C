/**
 * 边缘计算服务
 * 零碳园区数字孪生系统边缘计算核心服务
 * 提供边缘节点管理、边云协同、本地数据处理等功能
 */

import { EventEmitter } from 'events';
import logger from '../../shared/utils/logger.js';
import { MATH_CONSTANTS } from '../../shared/constants/MathConstants.js';
import { HTTP_STATUS_CODES } from '../../shared/constants/HttpStatusCodes.js';

class EdgeComputingService extends EventEmitter {
    constructor() {
        super();
        
        // 边缘节点管理
        this.edgeNodes = new Map();
        this.nodeStatus = new Map();
        this.nodeMetrics = new Map();
        
        // 边云协同
        this.cloudConnection = null;
        this.syncTasks = new Map();
        this.offlineQueue = [];
        
        // 本地数据处理
        this.localDataCache = new Map();
        this.processingTasks = new Map();
        this.dataProcessors = new Map();
        
        // 设备管理
        this.connectedDevices = new Map();
        this.deviceStreams = new Map();
        this.deviceMetrics = new Map();
        
        // 配置参数
        this.config = {
            maxNodes: 100,
            syncInterval: 30000, // 30秒
            offlineThreshold: 60000, // 1分钟
            maxCacheSize: 1000,
            processingTimeout: 30000,
            heartbeatInterval: 10000 // 10秒
        };
        
        // 服务状态
        this.isInitialized = false;
        this.isOnline = false;
        this.lastCloudSync = null;
        
        this.initializeService();
    }
    
    /**
     * 初始化边缘计算服务
     */
    async initializeService() {
        try {
            logger.info('正在初始化边缘计算服务...');
            
            // 初始化边缘节点
            await this.initializeEdgeNodes();
            
            // 初始化数据处理器
            await this.initializeDataProcessors();
            
            // 启动心跳检测
            this.startHeartbeat();
            
            // 启动同步任务
            this.startSyncTasks();
            
            // 启动设备监控
            this.startDeviceMonitoring();
            
            this.isInitialized = true;
            this.emit('serviceInitialized');
            
            logger.info('边缘计算服务初始化完成');
        } catch (error) {
            logger.error('边缘计算服务初始化失败', { error: error.message, stack: error.stack });
            throw error;
        }
    }
    
    /**
     * 初始化边缘节点
     */
    async initializeEdgeNodes() {
        // 创建默认边缘节点
        const defaultNodes = [
            {
                id: 'edge-node-001',
                name: '主边缘节点',
                type: 'primary',
                location: '园区中心',
                capabilities: ['data-processing', 'ai-inference', 'device-management'],
                resources: {
                    cpu: 8,
                    memory: 16384, // MB
                    storage: 512000, // MB
                    gpu: true
                }
            },
            {
                id: 'edge-node-002',
                name: '生产区边缘节点',
                type: 'secondary',
                location: '生产区域',
                capabilities: ['data-collection', 'real-time-monitoring'],
                resources: {
                    cpu: 4,
                    memory: 8192,
                    storage: 256000,
                    gpu: false
                }
            },
            {
                id: 'edge-node-003',
                name: '办公区边缘节点',
                type: 'secondary',
                location: '办公区域',
                capabilities: ['data-collection', 'environmental-monitoring'],
                resources: {
                    cpu: 4,
                    memory: 8192,
                    storage: 128000,
                    gpu: false
                }
            }
        ];
        
        for (const nodeConfig of defaultNodes) {
            await this.registerEdgeNode(nodeConfig);
        }
    }
    
    /**
     * 注册边缘节点
     */
    async registerEdgeNode(nodeConfig) {
        try {
            const node = {
                ...nodeConfig,
                status: 'initializing',
                registeredAt: new Date(),
                lastHeartbeat: new Date(),
                metrics: {
                    cpuUsage: 0,
                    memoryUsage: 0,
                    storageUsage: 0,
                    networkLatency: 0,
                    tasksProcessed: 0,
                    errorsCount: 0
                },
                tasks: new Map(),
                devices: new Set()
            };
            
            this.edgeNodes.set(node.id, node);
            this.nodeStatus.set(node.id, 'online');
            this.nodeMetrics.set(node.id, node.metrics);
            
            // 启动节点
            await this.startEdgeNode(node.id);
            
            this.emit('nodeRegistered', node);
            logger.info(`边缘节点注册成功: ${node.name} (${node.id})`);
            
            return node;
        } catch (error) {
            logger.error('边缘节点注册失败', { nodeId: nodeConfig.id, error: error.message });
            throw error;
        }
    }
    
    /**
     * 启动边缘节点
     */
    async startEdgeNode(nodeId) {
        const node = this.edgeNodes.get(nodeId);
        if (!node) {
            throw new Error(`边缘节点不存在: ${nodeId}`);
        }
        
        try {
            // 更新节点状态
            node.status = 'starting';
            
            // 初始化节点资源
            await this.initializeNodeResources(nodeId);
            
            // 启动节点服务
            await this.startNodeServices(nodeId);
            
            // 连接到云端
            await this.connectNodeToCloud(nodeId);
            
            node.status = 'running';
            this.nodeStatus.set(nodeId, 'online');
            
            this.emit('nodeStarted', node);
            logger.info(`边缘节点启动成功: ${node.name}`);
        } catch (error) {
            node.status = 'error';
            this.nodeStatus.set(nodeId, 'offline');
            logger.error('边缘节点启动失败', { nodeId, error: error.message });
            throw error;
        }
    }
    
    /**
     * 初始化节点资源
     */
    async initializeNodeResources(nodeId) {
        const node = this.edgeNodes.get(nodeId);
        
        // 初始化计算资源
        node.computePool = {
            availableCpu: node.resources.cpu,
            availableMemory: node.resources.memory,
            availableStorage: node.resources.storage,
            runningTasks: 0
        };
        
        // 初始化数据缓存
        node.dataCache = new Map();
        
        // 初始化任务队列
        node.taskQueue = [];
        
        logger.info(`节点资源初始化完成: ${nodeId}`);
    }
    
    /**
     * 启动节点服务
     */
    async startNodeServices(nodeId) {
        const node = this.edgeNodes.get(nodeId);
        
        // 启动数据处理服务
        if (node.capabilities.includes('data-processing')) {
            await this.startDataProcessingService(nodeId);
        }
        
        // 启动AI推理服务
        if (node.capabilities.includes('ai-inference')) {
            await this.startAIInferenceService(nodeId);
        }
        
        // 启动设备管理服务
        if (node.capabilities.includes('device-management')) {
            await this.startDeviceManagementService(nodeId);
        }
        
        // 启动数据采集服务
        if (node.capabilities.includes('data-collection')) {
            await this.startDataCollectionService(nodeId);
        }
        
        logger.info(`节点服务启动完成: ${nodeId}`);
    }
    
    /**
     * 启动数据处理服务
     */
    async startDataProcessingService(nodeId) {
        const processor = {
            nodeId,
            type: 'data-processing',
            status: 'running',
            processedCount: 0,
            errorCount: 0,
            lastProcessTime: null
        };
        
        this.dataProcessors.set(`${nodeId}-data-processing`, processor);
        logger.info(`数据处理服务启动: ${nodeId}`);
    }
    
    /**
     * 启动AI推理服务
     */
    async startAIInferenceService(nodeId) {
        const processor = {
            nodeId,
            type: 'ai-inference',
            status: 'running',
            modelsLoaded: ['carbon-prediction', 'anomaly-detection'],
            inferenceCount: 0,
            averageLatency: 0
        };
        
        this.dataProcessors.set(`${nodeId}-ai-inference`, processor);
        logger.info(`AI推理服务启动: ${nodeId}`);
    }
    
    /**
     * 启动设备管理服务
     */
    async startDeviceManagementService(nodeId) {
        const processor = {
            nodeId,
            type: 'device-management',
            status: 'running',
            managedDevices: 0,
            commandsSent: 0,
            responsesReceived: 0
        };
        
        this.dataProcessors.set(`${nodeId}-device-management`, processor);
        logger.info(`设备管理服务启动: ${nodeId}`);
    }
    
    /**
     * 启动数据采集服务
     */
    async startDataCollectionService(nodeId) {
        const processor = {
            nodeId,
            type: 'data-collection',
            status: 'running',
            dataPointsCollected: 0,
            collectionRate: 0,
            lastCollectionTime: null
        };
        
        this.dataProcessors.set(`${nodeId}-data-collection`, processor);
        logger.info(`数据采集服务启动: ${nodeId}`);
    }
    
    /**
     * 连接节点到云端
     */
    async connectNodeToCloud(nodeId) {
        try {
            // 模拟云端连接
            const connection = {
                nodeId,
                status: 'connected',
                connectedAt: new Date(),
                lastSync: new Date(),
                syncCount: 0,
                latency: Math.random() * 50 + 10 // 10-60ms
            };
            
            this.cloudConnection = connection;
            this.isOnline = true;
            
            logger.info(`节点已连接到云端: ${nodeId}`);
        } catch (error) {
            logger.error('节点连接云端失败', { nodeId, error: error.message });
            this.isOnline = false;
        }
    }
    
    /**
     * 初始化数据处理器
     */
    async initializeDataProcessors() {
        // 碳排放数据处理器
        this.registerDataProcessor('carbon-emission', {
            name: '碳排放数据处理器',
            type: 'real-time',
            inputTypes: ['energy-consumption', 'production-data'],
            outputTypes: ['carbon-emission'],
            processingFunction: this.processCarbonEmissionData.bind(this)
        });
        
        // 异常检测处理器
        this.registerDataProcessor('anomaly-detection', {
            name: '异常检测处理器',
            type: 'ai-inference',
            inputTypes: ['sensor-data', 'device-status'],
            outputTypes: ['anomaly-alert'],
            processingFunction: this.processAnomalyDetection.bind(this)
        });
        
        // 能耗优化处理器
        this.registerDataProcessor('energy-optimization', {
            name: '能耗优化处理器',
            type: 'optimization',
            inputTypes: ['energy-data', 'weather-data', 'schedule-data'],
            outputTypes: ['optimization-recommendation'],
            processingFunction: this.processEnergyOptimization.bind(this)
        });
        
        logger.info('数据处理器初始化完成');
    }
    
    /**
     * 注册数据处理器
     */
    registerDataProcessor(id, config) {
        const processor = {
            id,
            ...config,
            registeredAt: new Date(),
            processedCount: 0,
            errorCount: 0,
            averageProcessingTime: 0,
            status: 'active'
        };
        
        this.dataProcessors.set(id, processor);
        logger.info(`数据处理器注册成功: ${config.name}`);
    }
    
    /**
     * 处理碳排放数据
     */
    async processCarbonEmissionData(data) {
        try {
            const startTime = performance.now();
            
            // 提取能耗数据
            const energyConsumption = data.energyConsumption || 0;
            const productionOutput = data.productionOutput || 0;
            
            // 计算碳排放
            const emissionFactor = 0.5968; // kg CO2/kWh (电网平均排放因子)
            const carbonEmission = energyConsumption * emissionFactor;
            
            // 计算碳强度
            const carbonIntensity = productionOutput > 0 ? carbonEmission / productionOutput : 0;
            
            const result = {
                timestamp: new Date(),
                deviceId: data.deviceId,
                energyConsumption,
                carbonEmission,
                carbonIntensity,
                emissionFactor,
                processingTime: performance.now() - startTime
            };
            
            // 更新处理器统计
            const processor = this.dataProcessors.get('carbon-emission');
            processor.processedCount++;
            processor.averageProcessingTime = 
                (processor.averageProcessingTime * (processor.processedCount - 1) + result.processingTime) / processor.processedCount;
            
            return result;
        } catch (error) {
            logger.error('碳排放数据处理失败', { error: error.message, data });
            const processor = this.dataProcessors.get('carbon-emission');
            processor.errorCount++;
            throw error;
        }
    }
    
    /**
     * 处理异常检测
     */
    async processAnomalyDetection(data) {
        try {
            const startTime = performance.now();
            
            // 简化的异常检测算法 (Z-Score)
            const values = data.values || [];
            if (values.length < 3) {
                return { anomaly: false, score: 0 };
            }
            
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            
            const currentValue = values[values.length - 1];
            const zScore = stdDev > 0 ? Math.abs(currentValue - mean) / stdDev : 0;
            
            const isAnomaly = zScore > 2.5; // 2.5个标准差
            
            const result = {
                timestamp: new Date(),
                deviceId: data.deviceId,
                anomaly: isAnomaly,
                score: zScore,
                threshold: 2.5,
                currentValue,
                mean,
                stdDev,
                processingTime: performance.now() - startTime
            };
            
            // 更新处理器统计
            const processor = this.dataProcessors.get('anomaly-detection');
            processor.processedCount++;
            processor.averageProcessingTime = 
                (processor.averageProcessingTime * (processor.processedCount - 1) + result.processingTime) / processor.processedCount;
            
            return result;
        } catch (error) {
            logger.error('异常检测处理失败', { error: error.message, data });
            const processor = this.dataProcessors.get('anomaly-detection');
            processor.errorCount++;
            throw error;
        }
    }
    
    /**
     * 处理能耗优化
     */
    async processEnergyOptimization(data) {
        try {
            const startTime = performance.now();
            
            // 简化的能耗优化算法
            const currentConsumption = data.energyConsumption || 0;
            const weatherFactor = data.temperature ? (25 - Math.abs(data.temperature - 25)) / 25 : 1;
            const scheduleFactor = data.isWorkingHours ? 1.2 : 0.8;
            
            const optimizedConsumption = currentConsumption * weatherFactor * scheduleFactor;
            const savingsPotential = Math.max(0, currentConsumption - optimizedConsumption);
            const savingsPercentage = currentConsumption > 0 ? (savingsPotential / currentConsumption) * 100 : 0;
            
            const recommendations = [];
            if (savingsPercentage > 10) {
                recommendations.push('调整HVAC系统设定温度');
                recommendations.push('优化照明系统运行时间');
            }
            if (data.temperature && Math.abs(data.temperature - 25) > 5) {
                recommendations.push('根据天气条件调整能耗策略');
            }
            
            const result = {
                timestamp: new Date(),
                deviceId: data.deviceId,
                currentConsumption,
                optimizedConsumption,
                savingsPotential,
                savingsPercentage,
                recommendations,
                processingTime: performance.now() - startTime
            };
            
            // 更新处理器统计
            const processor = this.dataProcessors.get('energy-optimization');
            processor.processedCount++;
            processor.averageProcessingTime = 
                (processor.averageProcessingTime * (processor.processedCount - 1) + result.processingTime) / processor.processedCount;
            
            return result;
        } catch (error) {
            logger.error('能耗优化处理失败', { error: error.message, data });
            const processor = this.dataProcessors.get('energy-optimization');
            processor.errorCount++;
            throw error;
        }
    }
    
    /**
     * 启动心跳检测
     */
    startHeartbeat() {
        setInterval(() => {
            this.performHeartbeat();
        }, this.config.heartbeatInterval);
    }
    
    /**
     * 执行心跳检测
     */
    async performHeartbeat() {
        try {
            const now = new Date();
            
            // 检查所有边缘节点状态
            for (const [nodeId, node] of this.edgeNodes) {
                const timeSinceLastHeartbeat = now - node.lastHeartbeat;
                
                if (timeSinceLastHeartbeat > this.config.offlineThreshold) {
                    // 节点离线
                    if (this.nodeStatus.get(nodeId) !== 'offline') {
                        this.nodeStatus.set(nodeId, 'offline');
                        node.status = 'offline';
                        this.emit('nodeOffline', node);
                        logger.warn(`边缘节点离线: ${node.name}`);
                    }
                } else {
                    // 节点在线
                    if (this.nodeStatus.get(nodeId) !== 'online') {
                        this.nodeStatus.set(nodeId, 'online');
                        node.status = 'running';
                        this.emit('nodeOnline', node);
                        logger.info(`边缘节点恢复在线: ${node.name}`);
                    }
                    
                    // 更新节点指标
                    await this.updateNodeMetrics(nodeId);
                }
            }
            
            // 检查云端连接
            if (this.cloudConnection) {
                const timeSinceLastSync = now - this.cloudConnection.lastSync;
                if (timeSinceLastSync > this.config.offlineThreshold) {
                    this.isOnline = false;
                    this.emit('cloudDisconnected');
                }
            }
        } catch (error) {
            logger.error('心跳检测失败', { error: error.message });
        }
    }
    
    /**
     * 更新节点指标
     */
    async updateNodeMetrics(nodeId) {
        const node = this.edgeNodes.get(nodeId);
        if (!node) return;
        
        // 模拟指标更新
        const metrics = {
            cpuUsage: Math.random() * 80 + 10, // 10-90%
            memoryUsage: Math.random() * 70 + 20, // 20-90%
            storageUsage: Math.random() * 60 + 30, // 30-90%
            networkLatency: Math.random() * 50 + 10, // 10-60ms
            tasksProcessed: node.metrics.tasksProcessed + Math.floor(Math.random() * 10),
            errorsCount: node.metrics.errorsCount + (Math.random() < 0.1 ? 1 : 0)
        };
        
        node.metrics = metrics;
        this.nodeMetrics.set(nodeId, metrics);
        node.lastHeartbeat = new Date();
    }
    
    /**
     * 启动同步任务
     */
    startSyncTasks() {
        setInterval(() => {
            this.performCloudSync();
        }, this.config.syncInterval);
    }
    
    /**
     * 执行云端同步
     */
    async performCloudSync() {
        if (!this.isOnline) {
            logger.debug('云端连接断开，跳过同步');
            return;
        }
        
        try {
            // 同步节点状态
            await this.syncNodeStatus();
            
            // 同步处理结果
            await this.syncProcessingResults();
            
            // 同步离线队列
            await this.syncOfflineQueue();
            
            this.lastCloudSync = new Date();
            if (this.cloudConnection) {
                this.cloudConnection.lastSync = new Date();
                this.cloudConnection.syncCount++;
            }
            
            logger.debug('云端同步完成');
        } catch (error) {
            logger.error('云端同步失败', { error: error.message });
        }
    }
    
    /**
     * 同步节点状态
     */
    async syncNodeStatus() {
        const statusData = {
            timestamp: new Date(),
            nodes: Array.from(this.edgeNodes.values()).map(node => ({
                id: node.id,
                name: node.name,
                status: node.status,
                metrics: node.metrics,
                lastHeartbeat: node.lastHeartbeat
            }))
        };
        
        // 模拟发送到云端
        logger.debug('同步节点状态到云端', { nodeCount: statusData.nodes.length });
    }
    
    /**
     * 同步处理结果
     */
    async syncProcessingResults() {
        const results = [];
        
        // 收集所有处理结果
        for (const [nodeId, node] of this.edgeNodes) {
            if (node.dataCache && node.dataCache.size > 0) {
                for (const [key, data] of node.dataCache) {
                    results.push({
                        nodeId,
                        key,
                        data,
                        timestamp: new Date()
                    });
                }
                
                // 清空已同步的缓存
                node.dataCache.clear();
            }
        }
        
        if (results.length > 0) {
            logger.debug('同步处理结果到云端', { resultCount: results.length });
        }
    }
    
    /**
     * 同步离线队列
     */
    async syncOfflineQueue() {
        if (this.offlineQueue.length === 0) return;
        
        const queueData = [...this.offlineQueue];
        
        // 模拟发送到云端
        logger.debug('同步离线队列到云端', { queueSize: queueData.length });
        
        // 清空离线队列
        this.offlineQueue = [];
    }
    
    /**
     * 启动设备监控
     */
    startDeviceMonitoring() {
        setInterval(() => {
            this.monitorConnectedDevices();
        }, this.config.heartbeatInterval);
    }
    
    /**
     * 监控连接的设备
     */
    async monitorConnectedDevices() {
        try {
            for (const [deviceId, device] of this.connectedDevices) {
                // 检查设备状态
                const isOnline = await this.checkDeviceStatus(deviceId);
                
                if (isOnline !== device.isOnline) {
                    device.isOnline = isOnline;
                    device.lastStatusChange = new Date();
                    
                    this.emit('deviceStatusChanged', {
                        deviceId,
                        status: isOnline ? 'online' : 'offline',
                        timestamp: device.lastStatusChange
                    });
                }
                
                // 更新设备指标
                if (isOnline) {
                    await this.updateDeviceMetrics(deviceId);
                }
            }
        } catch (error) {
            logger.error('设备监控失败', { error: error.message });
        }
    }
    
    /**
     * 检查设备状态
     */
    async checkDeviceStatus(deviceId) {
        // 模拟设备状态检查
        return Math.random() > 0.1; // 90%在线率
    }
    
    /**
     * 更新设备指标
     */
    async updateDeviceMetrics(deviceId) {
        const metrics = {
            timestamp: new Date(),
            cpuUsage: Math.random() * 60 + 20,
            memoryUsage: Math.random() * 50 + 30,
            networkLatency: Math.random() * 30 + 5,
            dataRate: Math.random() * 1000 + 100, // KB/s
            errorRate: Math.random() * 0.05 // 0-5%
        };
        
        this.deviceMetrics.set(deviceId, metrics);
    }
    
    /**
     * 处理数据
     */
    async processData(data, processorId, nodeId = null) {
        try {
            const processor = this.dataProcessors.get(processorId);
            if (!processor) {
                throw new Error(`数据处理器不存在: ${processorId}`);
            }
            
            // 选择处理节点
            const targetNode = nodeId ? this.edgeNodes.get(nodeId) : this.selectOptimalNode(processor.type);
            if (!targetNode) {
                throw new Error('没有可用的边缘节点');
            }
            
            // 执行数据处理
            const result = await processor.processingFunction(data);
            
            // 缓存结果
            if (targetNode.dataCache) {
                const cacheKey = `${processorId}-${Date.now()}`;
                targetNode.dataCache.set(cacheKey, result);
                
                // 限制缓存大小
                if (targetNode.dataCache.size > this.config.maxCacheSize) {
                    const firstKey = targetNode.dataCache.keys().next().value;
                    targetNode.dataCache.delete(firstKey);
                }
            }
            
            // 如果离线，添加到离线队列
            if (!this.isOnline) {
                this.offlineQueue.push({
                    processorId,
                    nodeId: targetNode.id,
                    data,
                    result,
                    timestamp: new Date()
                });
            }
            
            this.emit('dataProcessed', {
                processorId,
                nodeId: targetNode.id,
                result
            });
            
            return result;
        } catch (error) {
            logger.error('数据处理失败', { processorId, nodeId, error: error.message });
            throw error;
        }
    }
    
    /**
     * 选择最优节点
     */
    selectOptimalNode(taskType) {
        const availableNodes = Array.from(this.edgeNodes.values())
            .filter(node => node.status === 'running' && this.nodeStatus.get(node.id) === 'online');
        
        if (availableNodes.length === 0) {
            return null;
        }
        
        // 根据任务类型和节点负载选择最优节点
        let bestNode = availableNodes[0];
        let bestScore = this.calculateNodeScore(bestNode, taskType);
        
        for (let i = 1; i < availableNodes.length; i++) {
            const score = this.calculateNodeScore(availableNodes[i], taskType);
            if (score > bestScore) {
                bestScore = score;
                bestNode = availableNodes[i];
            }
        }
        
        return bestNode;
    }
    
    /**
     * 计算节点评分
     */
    calculateNodeScore(node, taskType) {
        const metrics = node.metrics;
        
        // 基础评分 (资源可用性)
        const cpuScore = (100 - metrics.cpuUsage) / 100;
        const memoryScore = (100 - metrics.memoryUsage) / 100;
        const networkScore = Math.max(0, (100 - metrics.networkLatency) / 100);
        
        // 任务类型权重
        let typeWeight = 1;
        if (taskType === 'ai-inference' && node.resources.gpu) {
            typeWeight = 1.5;
        } else if (taskType === 'data-processing' && node.type === 'primary') {
            typeWeight = 1.3;
        }
        
        return (cpuScore + memoryScore + networkScore) * typeWeight;
    }
    
    /**
     * 连接设备
     */
    async connectDevice(deviceConfig) {
        try {
            const device = {
                id: deviceConfig.id,
                name: deviceConfig.name,
                type: deviceConfig.type,
                location: deviceConfig.location,
                capabilities: deviceConfig.capabilities || [],
                isOnline: false,
                connectedAt: new Date(),
                lastDataTime: null,
                lastStatusChange: new Date(),
                metrics: {
                    dataPointsReceived: 0,
                    commandsSent: 0,
                    errorsCount: 0
                }
            };
            
            this.connectedDevices.set(device.id, device);
            
            // 分配到边缘节点
            const assignedNode = this.selectOptimalNode('device-management');
            if (assignedNode) {
                assignedNode.devices.add(device.id);
                device.assignedNodeId = assignedNode.id;
            }
            
            // 启动设备数据流
            await this.startDeviceDataStream(device.id);
            
            device.isOnline = true;
            
            this.emit('deviceConnected', device);
            logger.info(`设备连接成功: ${device.name} (${device.id})`);
            
            return device;
        } catch (error) {
            logger.error('设备连接失败', { deviceId: deviceConfig.id, error: error.message });
            throw error;
        }
    }
    
    /**
     * 启动设备数据流
     */
    async startDeviceDataStream(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) return;
        
        // 模拟数据流
        const stream = setInterval(() => {
            if (device.isOnline) {
                const data = this.generateDeviceData(device);
                this.handleDeviceData(deviceId, data);
            }
        }, 5000); // 每5秒生成一次数据
        
        this.deviceStreams.set(deviceId, stream);
    }
    
    /**
     * 生成设备数据
     */
    generateDeviceData(device) {
        const baseData = {
            deviceId: device.id,
            timestamp: new Date(),
            type: device.type
        };
        
        switch (device.type) {
            case 'energy-meter':
                return {
                    ...baseData,
                    energyConsumption: Math.random() * 100 + 50, // 50-150 kWh
                    voltage: Math.random() * 20 + 220, // 220-240V
                    current: Math.random() * 10 + 5, // 5-15A
                    powerFactor: Math.random() * 0.2 + 0.8 // 0.8-1.0
                };
            
            case 'temperature-sensor':
                return {
                    ...baseData,
                    temperature: Math.random() * 15 + 20, // 20-35°C
                    humidity: Math.random() * 30 + 40, // 40-70%
                    pressure: Math.random() * 20 + 1000 // 1000-1020 hPa
                };
            
            case 'air-quality-sensor':
                return {
                    ...baseData,
                    pm25: Math.random() * 50 + 10, // 10-60 μg/m³
                    pm10: Math.random() * 80 + 20, // 20-100 μg/m³
                    co2: Math.random() * 200 + 400, // 400-600 ppm
                    voc: Math.random() * 100 + 50 // 50-150 ppb
                };
            
            default:
                return {
                    ...baseData,
                    value: Math.random() * 100,
                    status: 'normal'
                };
        }
    }
    
    /**
     * 处理设备数据
     */
    async handleDeviceData(deviceId, data) {
        try {
            const device = this.connectedDevices.get(deviceId);
            if (!device) return;
            
            device.lastDataTime = new Date();
            device.metrics.dataPointsReceived++;
            
            // 根据数据类型选择处理器
            let processorId;
            if (data.energyConsumption !== undefined) {
                processorId = 'carbon-emission';
            } else if (data.temperature !== undefined || data.pm25 !== undefined) {
                processorId = 'anomaly-detection';
                data.values = [data.temperature || data.pm25];
            }
            
            if (processorId) {
                // 处理数据
                const result = await this.processData(data, processorId, device.assignedNodeId);
                
                // 发送处理结果
                this.emit('deviceDataProcessed', {
                    deviceId,
                    originalData: data,
                    processedResult: result
                });
            }
        } catch (error) {
            logger.error('设备数据处理失败', { deviceId, error: error.message });
            const device = this.connectedDevices.get(deviceId);
            if (device) {
                device.metrics.errorsCount++;
            }
        }
    }
    
    /**
     * 断开设备连接
     */
    async disconnectDevice(deviceId) {
        try {
            const device = this.connectedDevices.get(deviceId);
            if (!device) {
                throw new Error(`设备不存在: ${deviceId}`);
            }
            
            // 停止数据流
            const stream = this.deviceStreams.get(deviceId);
            if (stream) {
                clearInterval(stream);
                this.deviceStreams.delete(deviceId);
            }
            
            // 从节点中移除
            if (device.assignedNodeId) {
                const node = this.edgeNodes.get(device.assignedNodeId);
                if (node) {
                    node.devices.delete(deviceId);
                }
            }
            
            // 移除设备
            this.connectedDevices.delete(deviceId);
            this.deviceMetrics.delete(deviceId);
            
            this.emit('deviceDisconnected', device);
            logger.info(`设备断开连接: ${device.name}`);
        } catch (error) {
            logger.error('设备断开连接失败', { deviceId, error: error.message });
            throw error;
        }
    }
    
    /**
     * 获取服务状态
     */
    getServiceStatus() {
        return {
            isInitialized: this.isInitialized,
            isOnline: this.isOnline,
            lastCloudSync: this.lastCloudSync,
            edgeNodes: {
                total: this.edgeNodes.size,
                online: Array.from(this.nodeStatus.values()).filter(status => status === 'online').length,
                offline: Array.from(this.nodeStatus.values()).filter(status => status === 'offline').length
            },
            connectedDevices: {
                total: this.connectedDevices.size,
                online: Array.from(this.connectedDevices.values()).filter(device => device.isOnline).length
            },
            dataProcessors: {
                total: this.dataProcessors.size,
                active: Array.from(this.dataProcessors.values()).filter(processor => processor.status === 'active').length
            },
            offlineQueueSize: this.offlineQueue.length
        };
    }
    
    /**
     * 获取节点详情
     */
    getNodeDetails(nodeId) {
        const node = this.edgeNodes.get(nodeId);
        if (!node) {
            throw new Error(`边缘节点不存在: ${nodeId}`);
        }
        
        return {
            ...node,
            status: this.nodeStatus.get(nodeId),
            metrics: this.nodeMetrics.get(nodeId),
            connectedDevices: Array.from(node.devices),
            cacheSize: node.dataCache ? node.dataCache.size : 0
        };
    }
    
    /**
     * 获取设备详情
     */
    getDeviceDetails(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            throw new Error(`设备不存在: ${deviceId}`);
        }
        
        return {
            ...device,
            metrics: this.deviceMetrics.get(deviceId)
        };
    }
    
    /**
     * 获取处理器统计
     */
    getProcessorStats() {
        const stats = {};
        
        for (const [id, processor] of this.dataProcessors) {
            stats[id] = {
                name: processor.name,
                type: processor.type,
                status: processor.status,
                processedCount: processor.processedCount,
                errorCount: processor.errorCount,
                averageProcessingTime: processor.averageProcessingTime,
                errorRate: processor.processedCount > 0 ? 
                    (processor.errorCount / processor.processedCount * 100).toFixed(2) + '%' : '0%'
            };
        }
        
        return stats;
    }
    
    /**
     * 停止服务
     */
    async stopService() {
        try {
            logger.info('正在停止边缘计算服务...');
            
            // 断开所有设备
            for (const deviceId of this.connectedDevices.keys()) {
                await this.disconnectDevice(deviceId);
            }
            
            // 停止所有边缘节点
            for (const nodeId of this.edgeNodes.keys()) {
                await this.stopEdgeNode(nodeId);
            }
            
            // 清理资源
            this.edgeNodes.clear();
            this.nodeStatus.clear();
            this.nodeMetrics.clear();
            this.connectedDevices.clear();
            this.deviceStreams.clear();
            this.deviceMetrics.clear();
            this.dataProcessors.clear();
            this.offlineQueue = [];
            
            this.isInitialized = false;
            this.isOnline = false;
            
            this.emit('serviceStopped');
            logger.info('边缘计算服务已停止');
        } catch (error) {
            logger.error('停止边缘计算服务失败', { error: error.message });
            throw error;
        }
    }
    
    /**
     * 停止边缘节点
     */
    async stopEdgeNode(nodeId) {
        const node = this.edgeNodes.get(nodeId);
        if (!node) return;
        
        try {
            node.status = 'stopping';
            
            // 停止节点上的所有任务
            if (node.tasks) {
                node.tasks.clear();
            }
            
            // 清理缓存
            if (node.dataCache) {
                node.dataCache.clear();
            }
            
            node.status = 'stopped';
            this.nodeStatus.set(nodeId, 'offline');
            
            this.emit('nodeStopped', node);
            logger.info(`边缘节点已停止: ${node.name}`);
        } catch (error) {
            logger.error('停止边缘节点失败', { nodeId, error: error.message });
        }
    }
}

export default EdgeComputingService;