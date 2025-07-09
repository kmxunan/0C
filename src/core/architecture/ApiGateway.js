/**
 * API网关
 * 零碳园区数字孪生系统的统一API入口
 * 提供路由、认证、限流、监控等功能
 */

import { EventEmitter } from 'events';
import logger from '../../shared/utils/logger.js';
import ServiceRegistry from './ServiceRegistry.js';
import { MATH_CONSTANTS } from '../../shared/constants/MathConstants.js';
import { HTTP_STATUS_CODES } from '../../shared/constants/HttpStatusCodes.js';

class ApiGateway extends EventEmitter {
    constructor() {
        super();
        this.serviceRegistry = new ServiceRegistry();
        this.routes = new Map();
        this.middlewares = [];
        this.rateLimiters = new Map();
        this.authTokens = new Map();
        this.requestStats = new Map();
        
        // 路由配置
        this.routeConfig = {
            '/api/v1/carbon': {
                service: 'carbon-accounting-engine',
                methods: ['GET', 'POST'],
                auth: true,
                rateLimit: { requests: 100, window: 60000 } // 100请求/分钟
            },
            '/api/v1/energy-flow': {
                service: 'energy-flow-visualization',
                methods: ['GET', 'POST'],
                auth: true,
                rateLimit: { requests: 50, window: 60000 }
            },
            '/api/v1/indicators': {
                service: 'national-indicator-dashboard',
                methods: ['GET', 'POST'],
                auth: true,
                rateLimit: { requests: 200, window: 60000 }
            },
            '/api/v1/green-electricity': {
                service: 'green-electricity-tracing',
                methods: ['GET', 'POST'],
                auth: true,
                rateLimit: { requests: 80, window: 60000 }
            },
            '/api/v1/reports': {
                service: 'report-generator',
                methods: ['GET', 'POST'],
                auth: true,
                rateLimit: { requests: 20, window: 60000 }
            },
            '/api/v1/integration': {
                service: 'energy-carbon-integration',
                methods: ['GET', 'POST'],
                auth: true,
                rateLimit: { requests: 150, window: 60000 }
            }
        };
        
        this.init();
    }
    
    /**
     * 初始化API网关
     */
    async init() {
        try {
            logger.info('🚀 API网关启动中...');
            
            // 等待服务注册中心初始化
            await this.waitForServiceRegistry();
            
            // 初始化路由
            this.initializeRoutes();
            
            // 初始化中间件
            this.initializeMiddlewares();
            
            // 启动监控
            this.startMonitoring();
            
            logger.info('✅ API网关启动完成');
            this.emit('gateway:ready');
        } catch (error) {
            logger.error('API网关启动失败:', error);
            throw error;
        }
    }
    
    /**
     * 等待服务注册中心就绪
     */
    async waitForServiceRegistry() {
        return new Promise((resolve) => {
            if (this.serviceRegistry.services.size > 0) {
                resolve();
            } else {
                this.serviceRegistry.on('service:registered', () => {
                    resolve();
                });
            }
        });
    }
    
    /**
     * 初始化路由
     */
    initializeRoutes() {
        for (const [path, config] of Object.entries(this.routeConfig)) {
            this.routes.set(path, {
                ...config,
                stats: {
                    requests: 0,
                    errors: 0,
                    avgResponseTime: 0,
                    lastAccess: null
                }
            });
        }
        
        logger.info(`📋 已配置 ${this.routes.size} 个路由`);
    }
    
    /**
     * 初始化中间件
     */
    initializeMiddlewares() {
        // 请求日志中间件
        this.use(this.requestLoggerMiddleware.bind(this));
        
        // 认证中间件
        this.use(this.authenticationMiddleware.bind(this));
        
        // 限流中间件
        this.use(this.rateLimitMiddleware.bind(this));
        
        // CORS中间件
        this.use(this.corsMiddleware.bind(this));
        
        // 错误处理中间件
        this.use(this.errorHandlingMiddleware.bind(this));
        
        logger.info(`🔧 已加载 ${this.middlewares.length} 个中间件`);
    }
    
    /**
     * 添加中间件
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }
    
    /**
     * 处理HTTP请求
     * @param {Object} request 请求对象
     * @returns {Object} 响应对象
     */
    async handleRequest(request) {
        const startTime = Date.now();
        let response = {
            status: 200,
            headers: {},
            body: null
        };
        
        try {
            // 创建请求上下文
            const context = {
                request,
                response,
                startTime,
                route: null,
                service: null,
                user: null
            };
            
            // 路由匹配
            const route = this.matchRoute(request.path, request.method);
            if (!route) {
                return this.createErrorResponse(HTTP_STATUS_CODES.NOT_FOUND, '路由不存在');
            }
            
            context.route = route;
            
            // 执行中间件链
            for (const middleware of this.middlewares) {
                const result = await middleware(context);
                if (result && result.status) {
                    return result; // 中间件返回响应，终止处理
                }
            }
            
            // 服务发现
            const serviceInstance = this.serviceRegistry.discoverService(route.service);
            if (!serviceInstance) {
                return this.createErrorResponse(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, '服务不可用');
            }
            
            context.service = serviceInstance;
            
            // 转发请求到后端服务
            response = await this.forwardRequest(context);
            
            // 更新统计信息
            this.updateRequestStats(route, startTime, response.status);
            
            return response;
        } catch (error) {
            logger.error('请求处理失败:', error);
            return this.createErrorResponse(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, '内部服务器错误', error.message);
        }
    }
    
    /**
     * 路由匹配
     */
    matchRoute(path, method) {
        for (const [routePath, routeConfig] of this.routes) {
            if (this.pathMatches(path, routePath) && routeConfig.methods.includes(method)) {
                return { path: routePath, ...routeConfig };
            }
        }
        return null;
    }
    
    /**
     * 路径匹配
     */
    pathMatches(requestPath, routePath) {
        // 简单的路径匹配，支持通配符
        const routeRegex = routePath.replace(/\*/g, '.*');
        return new RegExp(`^${routeRegex}`).test(requestPath);
    }
    
    /**
     * 转发请求到后端服务
     */
    async forwardRequest(context) {
        const { request, service } = context;
        
        try {
            // 构建目标URL
            const targetUrl = `http://${service.host}:${service.port}${request.path}`;
            
            // 模拟HTTP请求转发
            const response = await this.makeHttpRequest({
                url: targetUrl,
                method: request.method,
                headers: request.headers,
                body: request.body
            });
            
            return response;
        } catch (error) {
            logger.error(`请求转发失败 (${service.name}):`, error);
            throw error;
        }
    }
    
    /**
     * 模拟HTTP请求
     */
    async makeHttpRequest(options) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, Math.random() * MATH_CONSTANTS.ONE_HUNDRED + MATH_CONSTANTS.FIFTY));
        
        // 模拟响应
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Service-Name': 'mock-service'
            },
            body: {
                success: true,
                data: {
                    message: '模拟响应数据',
                    timestamp: new Date().toISOString(),
                    requestPath: options.url
                }
            }
        };
    }
    
    /**
     * 请求日志中间件
     */
    async requestLoggerMiddleware(context) {
        const { request } = context;
        logger.info(`📥 ${request.method} ${request.path} - ${request.headers['user-agent'] || 'Unknown'}`);
        
        // 记录请求开始时间
        context.requestStartTime = Date.now();
    }
    
    /**
     * 认证中间件
     */
    async authenticationMiddleware(context) {
        const { request, route } = context;
        
        // 如果路由不需要认证，跳过
        if (!route.auth) {
            return;
        }
        
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return this.createErrorResponse(HTTP_STATUS_CODES.UNAUTHORIZED, '缺少认证令牌');
        }
        
        const token = authHeader.substring(MATH_CONSTANTS.SEVEN);
        const user = this.validateToken(token);
        
        if (!user) {
            return this.createErrorResponse(HTTP_STATUS_CODES.UNAUTHORIZED, '无效的认证令牌');
        }
        
        context.user = user;
        logger.debug(`🔐 用户认证成功: ${user.username}`);
    }
    
    /**
     * 限流中间件
     */
    async rateLimitMiddleware(context) {
        const { request, route } = context;
        
        if (!route.rateLimit) {
            return;
        }
        
        const clientId = this.getClientId(request);
        const rateLimitKey = `${route.path}:${clientId}`;
        
        if (this.isRateLimited(rateLimitKey, route.rateLimit)) {
            return this.createErrorResponse(HTTP_STATUS_CODES.TOO_MANY_REQUESTS, '请求频率超限');
        }
        
        this.recordRequest(rateLimitKey, route.rateLimit);
    }
    
    /**
     * CORS中间件
     */
    async corsMiddleware(context) {
        const { response } = context;
        
        response.headers['Access-Control-Allow-Origin'] = '*';
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }
    
    /**
     * 错误处理中间件
     */
    async errorHandlingMiddleware(context) {
        // 在请求完成后执行
        const { response } = context;
        
        if (response.status >= HTTP_STATUS_CODES.BAD_REQUEST) {
            logger.warn(`⚠️ 请求错误: ${response.status} - ${context.request.path}`);
            this.emit('request:error', {
                path: context.request.path,
                status: response.status,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * 验证令牌
     */
    validateToken(token) {
        // 模拟令牌验证
        const validTokens = {
            'admin-token-123': { username: 'admin', role: 'administrator' },
            'user-token-456': { username: 'user', role: 'operator' },
            'readonly-token-789': { username: 'readonly', role: 'viewer' }
        };
        
        return validTokens[token] || null;
    }
    
    /**
     * 获取客户端ID
     */
    getClientId(request) {
        return request.headers['x-client-id'] || 
               request.headers['x-forwarded-for'] || 
               request.connection?.remoteAddress || 
               'unknown';
    }
    
    /**
     * 检查是否被限流
     */
    isRateLimited(key, rateLimit) {
        const now = Date.now();
        const windowStart = now - rateLimit.window;
        
        if (!this.rateLimiters.has(key)) {
            this.rateLimiters.set(key, []);
        }
        
        const requests = this.rateLimiters.get(key);
        
        // 清理过期的请求记录
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        this.rateLimiters.set(key, validRequests);
        
        return validRequests.length >= rateLimit.requests;
    }
    
    /**
     * 记录请求
     */
    recordRequest(key, _rateLimit) {
        const now = Date.now();
        const requests = this.rateLimiters.get(key) || [];
        requests.push(now);
        this.rateLimiters.set(key, requests);
    }
    
    /**
     * 创建错误响应
     */
    createErrorResponse(status, message, details = null) {
        return {
            status,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                error: true,
                message,
                details,
                timestamp: new Date().toISOString()
            }
        };
    }
    
    /**
     * 更新请求统计
     */
    updateRequestStats(route, startTime, status) {
        const responseTime = Date.now() - startTime;
        const { stats } = route;
        
        stats.requests++;
        if (status >= HTTP_STATUS_CODES.BAD_REQUEST) {
            stats.errors++;
        }
        
        // 计算平均响应时间
        stats.avgResponseTime = (stats.avgResponseTime * (stats.requests - 1) + responseTime) / stats.requests;
        stats.lastAccess = new Date().toISOString();
    }
    
    /**
     * 启动监控
     */
    startMonitoring() {
        // 每分钟清理过期的限流记录
        setInterval(() => {
            this.cleanupRateLimiters();
        }, MATH_CONSTANTS.SIXTY * MATH_CONSTANTS.MILLISECONDS_PER_SECOND);
        
        // 每5分钟输出统计信息
        setInterval(() => {
            this.logStatistics();
        }, MATH_CONSTANTS.FIVE * MATH_CONSTANTS.SIXTY * MATH_CONSTANTS.MILLISECONDS_PER_SECOND);
    }
    
    /**
     * 清理限流记录
     */
    cleanupRateLimiters() {
        const now = Date.now();
        const maxAge = MATH_CONSTANTS.SIXTY * MATH_CONSTANTS.MILLISECONDS_PER_SECOND; // 1分钟
        
        for (const [key, requests] of this.rateLimiters) {
            const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
            if (validRequests.length === 0) {
                this.rateLimiters.delete(key);
            } else {
                this.rateLimiters.set(key, validRequests);
            }
        }
    }
    
    /**
     * 输出统计信息
     */
    logStatistics() {
        const stats = this.getGatewayStats();
        logger.info('📊 API网关统计信息:', stats);
        this.emit('gateway:stats', stats);
    }
    
    /**
     * 获取网关统计信息
     */
    getGatewayStats() {
        const stats = {
            totalRoutes: this.routes.size,
            activeRateLimiters: this.rateLimiters.size,
            serviceHealth: this.serviceRegistry.getServiceHealth(),
            routeStats: {}
        };
        
        for (const [path, route] of this.routes) {
            stats.routeStats[path] = {
                requests: route.stats.requests,
                errors: route.stats.errors,
                errorRate: route.stats.requests > MATH_CONSTANTS.ZERO ? (route.stats.errors / route.stats.requests * MATH_CONSTANTS.ONE_HUNDRED).toFixed(MATH_CONSTANTS.TWO) : MATH_CONSTANTS.ZERO,
                avgResponseTime: Math.round(route.stats.avgResponseTime),
                lastAccess: route.stats.lastAccess
            };
        }
        
        return stats;
    }
    
    /**
     * 获取健康状态
     */
    getHealthStatus() {
        const serviceHealth = this.serviceRegistry.getServiceHealth();
        const totalServices = Object.values(serviceHealth).reduce((sum, service) => sum + service.total, 0);
        const healthyServices = Object.values(serviceHealth).reduce((sum, service) => sum + service.healthy, 0);
        
        return {
            status: healthyServices === totalServices ? 'healthy' : 'degraded',
            services: serviceHealth,
            gateway: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                routes: this.routes.size,
                activeConnections: this.rateLimiters.size
            },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 添加路由
     */
    addRoute(path, config) {
        this.routes.set(path, {
            ...config,
            stats: {
                requests: 0,
                errors: 0,
                avgResponseTime: 0,
                lastAccess: null
            }
        });
        
        logger.info(`➕ 添加路由: ${path} -> ${config.service}`);
    }
    
    /**
     * 移除路由
     */
    removeRoute(path) {
        if (this.routes.delete(path)) {
            logger.info(`➖ 移除路由: ${path}`);
        }
    }
}

export default ApiGateway;