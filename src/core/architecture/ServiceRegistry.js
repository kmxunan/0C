/**
 * 服务注册与发现中心
 * 实现微服务架构的核心组件，负责服务注册、发现、健康检查和负载均衡
 * 支持零碳园区数字孪生系统的分布式架构
 */

import logger from '../../shared/utils/logger.js';
import { MATH_CONSTANTS, TIME_INTERVALS } from '../../shared/constants/MathConstants.js';

class ServiceRegistry {
    constructor() {
        this.services = new Map(); // 服务注册表
        this.healthChecks = new Map(); // 健康检查配置
        this.loadBalancers = new Map(); // 负载均衡器
        this.serviceInstances = new Map(); // 服务实例列表
        this.eventListeners = new Map(); // 事件监听器
        
        // 服务类型定义
        this.serviceTypes = {
            CARBON_ACCOUNTING: 'carbon-accounting',
            ENERGY_FLOW: 'energy-flow',
            NATIONAL_INDICATOR: 'national-indicator',
            GREEN_ELECTRICITY: 'green-electricity',
            REPORT_GENERATOR: 'report-generator',
            DATA_COLLECTOR: 'data-collector',
            API_GATEWAY: 'api-gateway'
        };
        
        this.init();
    }
    
    /**
     * 初始化服务注册中心
     */
    async init() {
        logger.info('🚀 服务注册中心启动中...');
        
        // 启动健康检查定时器
        this.startHealthCheckTimer();
        
        // 注册核心服务
        await this.registerCoreServices();
        
        logger.info('✅ 服务注册中心启动完成');
    }
    
    /**
     * 注册服务
     * @param {Object} serviceConfig 服务配置
     */
    async registerService(serviceConfig) {
        const {
            name,
            type,
            version,
            host,
            port,
            healthCheckUrl,
            metadata = {}
        } = serviceConfig;
        
        const serviceId = `${name}-${Date.now()}`;
        const serviceInfo = {
            id: serviceId,
            name,
            type,
            version,
            host,
            port,
            healthCheckUrl,
            metadata,
            status: 'healthy',
            registeredAt: new Date(),
            lastHealthCheck: new Date()
        };
        
        // 注册服务
        this.services.set(serviceId, serviceInfo);
        
        // 添加到服务实例列表
        if (!this.serviceInstances.has(name)) {
            this.serviceInstances.set(name, []);
        }
        this.serviceInstances.get(name).push(serviceInfo);
        
        // 配置健康检查
        if (healthCheckUrl) {
            this.setupHealthCheck(serviceId, healthCheckUrl);
        }
        
        // 触发服务注册事件
        this.emitEvent('service:registered', serviceInfo);
        
        logger.info(`📋 服务注册成功: ${name} (${serviceId})`);
        return serviceId;
    }
    
    /**
     * 注销服务
     * @param {string} serviceId 服务ID
     */
    async unregisterService(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error(`服务不存在: ${serviceId}`);
        }
        
        // 从服务注册表移除
        this.services.delete(serviceId);
        
        // 从服务实例列表移除
        const instances = this.serviceInstances.get(service.name) || [];
        const updatedInstances = instances.filter(instance => instance.id !== serviceId);
        this.serviceInstances.set(service.name, updatedInstances);
        
        // 移除健康检查
        this.healthChecks.delete(serviceId);
        
        // 触发服务注销事件
        this.emitEvent('service:unregistered', service);
        
        logger.info(`📤 服务注销成功: ${service.name} (${serviceId})`);
    }
    
    /**
     * 发现服务
     * @param {string} serviceName 服务名称
     * @param {Object} options 选项
     */
    discoverService(serviceName, options = {}) {
        const { loadBalanceStrategy = 'round-robin', healthyOnly = true } = options;
        
        const instances = this.serviceInstances.get(serviceName) || [];
        
        // 过滤健康的服务实例
        const availableInstances = healthyOnly 
            ? instances.filter(instance => instance.status === 'healthy')
            : instances;
            
        if (availableInstances.length === 0) {
            throw new Error(`没有可用的服务实例: ${serviceName}`);
        }
        
        // 负载均衡选择实例
        return this.selectInstance(serviceName, availableInstances, loadBalanceStrategy);
    }
    
    /**
     * 获取所有服务
     */
    getAllServices() {
        const serviceList = [];
        for (const [_serviceId, service] of this.services) {
            serviceList.push({
                ...service,
                url: `http://${service.host}:${service.port}`
            });
        }
        return serviceList;
    }
    
    /**
     * 获取服务健康状态
     */
    getServiceHealth() {
        const healthStatus = {};
        for (const [serviceName, instances] of this.serviceInstances) {
            const totalInstances = instances.length;
            const healthyInstances = instances.filter(instance => instance.status === 'healthy').length;
            
            healthStatus[serviceName] = {
                total: totalInstances,
                healthy: healthyInstances,
                unhealthy: totalInstances - healthyInstances,
                healthRate: totalInstances > MATH_CONSTANTS.ZERO ? (healthyInstances / totalInstances * MATH_CONSTANTS.ONE_HUNDRED).toFixed(MATH_CONSTANTS.TWO) : MATH_CONSTANTS.ZERO
            };
        }
        return healthStatus;
    }
    
    /**
     * 注册核心服务
     */
    async registerCoreServices() {
        const coreServices = [
            {
                name: 'carbon-accounting-engine',
                type: this.serviceTypes.CARBON_ACCOUNTING,
                version: '1.0.0',
                host: 'localhost',
                port: 3001,
                healthCheckUrl: '/health',
                metadata: { description: '碳排放实时核算引擎' }
            },
            {
                name: 'energy-flow-visualization',
                type: this.serviceTypes.ENERGY_FLOW,
                version: '1.0.0',
                host: 'localhost',
                port: 3002,
                healthCheckUrl: '/health',
                metadata: { description: '园区能流全景图构建模块' }
            },
            {
                name: 'national-indicator-dashboard',
                type: this.serviceTypes.NATIONAL_INDICATOR,
                version: '1.0.0',
                host: 'localhost',
                port: 3003,
                healthCheckUrl: '/health',
                metadata: { description: '国家指标体系监测仪表盘' }
            },
            {
                name: 'green-electricity-tracing',
                type: this.serviceTypes.GREEN_ELECTRICITY,
                version: '1.0.0',
                host: 'localhost',
                port: 3004,
                healthCheckUrl: '/health',
                metadata: { description: '绿电溯源与认证模块' }
            },
            {
                name: 'report-generator',
                type: this.serviceTypes.REPORT_GENERATOR,
                version: '1.0.0',
                host: 'localhost',
                port: 3005,
                healthCheckUrl: '/health',
                metadata: { description: '智能申报验收材料生成器' }
            }
        ];
        
        for (const serviceConfig of coreServices) {
            try {
                await this.registerService(serviceConfig);
            } catch (error) {
                logger.warn(`⚠️ 核心服务注册失败: ${serviceConfig.name}`, error.message);
            }
        }
    }
    
    /**
     * 设置健康检查
     */
    setupHealthCheck(serviceId, healthCheckUrl) {
        this.healthChecks.set(serviceId, {
            url: healthCheckUrl,
            interval: TIME_INTERVALS.THIRTY_SECONDS_MS, // 30秒检查一次
            timeout: 5000,   // 5秒超时
            retries: 3       // 重试3次
        });
    }
    
    /**
     * 启动健康检查定时器
     */
    startHealthCheckTimer() {
        setInterval(async () => {
            await this.performHealthChecks();
        }, TIME_INTERVALS.THIRTY_SECONDS_MS); // 每30秒执行一次健康检查
    }
    
    /**
     * 执行健康检查
     */
    async performHealthChecks() {
        for (const [serviceId, service] of this.services) {
            const healthConfig = this.healthChecks.get(serviceId);
            if (!healthConfig) {
                continue;
            }
            
            try {
                const isHealthy = await this.checkServiceHealth(service, healthConfig);
                const previousStatus = service.status;
                service.status = isHealthy ? 'healthy' : 'unhealthy';
                service.lastHealthCheck = new Date();
                
                // 状态变化时触发事件
                if (previousStatus !== service.status) {
                    this.emitEvent('service:status-changed', {
                        service,
                        previousStatus,
                        currentStatus: service.status
                    });
                }
            } catch (error) {
                logger.warn(`⚠️ 健康检查失败: ${service.name}`, error.message);
                service.status = 'unhealthy';
            }
        }
    }
    
    /**
     * 检查单个服务健康状态
     */
    async checkServiceHealth(_service, _healthConfig) {
        // 模拟健康检查（实际应用中应该发送HTTP请求）
        return new Promise((resolve) => {
            setTimeout(() => {
                // 模拟90%的成功率
                resolve(Math.random() > MATH_CONSTANTS.ZERO_POINT_ONE);
            }, MATH_CONSTANTS.ONE_HUNDRED);
        });
    }
    
    /**
     * 负载均衡选择实例
     */
    selectInstance(serviceName, instances, strategy) {
        switch (strategy) {
            case 'round-robin':
                return this.roundRobinSelect(serviceName, instances);
            case 'random':
                return instances[Math.floor(Math.random() * instances.length)];
            case 'least-connections':
                return this.leastConnectionsSelect(instances);
            default:
                return instances[0];
        }
    }
    
    /**
     * 轮询负载均衡
     */
    roundRobinSelect(serviceName, instances) {
        if (!this.loadBalancers.has(serviceName)) {
            this.loadBalancers.set(serviceName, { currentIndex: 0 });
        }
        
        const balancer = this.loadBalancers.get(serviceName);
        const instance = instances[balancer.currentIndex];
        balancer.currentIndex = (balancer.currentIndex + 1) % instances.length;
        
        return instance;
    }
    
    /**
     * 最少连接数负载均衡
     */
    leastConnectionsSelect(instances) {
        // 简化实现，实际应用中需要跟踪连接数
        return instances.reduce((min, current) => {
            const minConnections = min.metadata.connections || 0;
            const currentConnections = current.metadata.connections || 0;
            return currentConnections < minConnections ? current : min;
        });
    }
    
    /**
     * 事件监听
     */
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }
    
    /**
     * 触发事件
     */
    emitEvent(event, data) {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                logger.error(`事件监听器错误 (${event}):`, error);
            }
        });
    }
    
    /**
     * 获取服务统计信息
     */
    getServiceStats() {
        const stats = {
            totalServices: this.services.size,
            serviceTypes: {},
            healthyServices: 0,
            unhealthyServices: 0
        };
        
        for (const service of this.services.values()) {
            // 统计服务类型
            stats.serviceTypes[service.type] = (stats.serviceTypes[service.type] || 0) + 1;
            
            // 统计健康状态
            if (service.status === 'healthy') {
                stats.healthyServices++;
            } else {
                stats.unhealthyServices++;
            }
        }
        
        return stats;
    }
}

export default ServiceRegistry;