/**
 * 虚拟电厂电力市场连接器服务
 * 负责与各种电力市场的接口连接、数据同步和交易执行
 */

import dbPromise from '../database/database.js';
import logger from '../utils/logger.js';
import EventEmitter from 'events';
import axios from 'axios';
import WebSocket from 'ws';

// 市场类型枚举
const MARKET_TYPE = {
  SPOT: 'spot',
  DAY_AHEAD: 'day_ahead',
  INTRADAY: 'intraday',
  BALANCING: 'balancing',
  ANCILLARY: 'ancillary',
  CAPACITY: 'capacity',
  BILATERAL: 'bilateral'
};

// 连接状态枚举
const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',
  MAINTENANCE: 'maintenance'
};

// 数据类型枚举
const DATA_TYPE = {
  PRICE: 'price',
  VOLUME: 'volume',
  ORDER_BOOK: 'order_book',
  TRADE: 'trade',
  MARKET_STATUS: 'market_status',
  SETTLEMENT: 'settlement',
  FORECAST: 'forecast'
};

// API类型枚举
const API_TYPE = {
  REST: 'rest',
  WEBSOCKET: 'websocket',
  FTP: 'ftp',
  SFTP: 'sftp',
  EMAIL: 'email',
  FILE: 'file'
};

class VPPMarketConnectorService extends EventEmitter {
  constructor() {
    super();
    
    // 市场连接管理
    this.marketConnections = new Map();
    this.websocketConnections = new Map();
    this.dataStreams = new Map();
    
    // 配置参数
    this.config = {
      connectionTimeout: 30000, // 30秒
      heartbeatInterval: 60000, // 1分钟
      reconnectInterval: 5000, // 5秒
      maxReconnectAttempts: 10,
      dataBufferSize: 1000,
      rateLimitRequests: 100,
      rateLimitWindow: 60000 // 1分钟
    };
    
    // 数据缓存
    this.priceCache = new Map();
    this.orderBookCache = new Map();
    this.marketStatusCache = new Map();
    this.lastDataUpdate = new Map();
    
    // 速率限制
    this.rateLimiter = new Map();
    
    // 统计信息
    this.statistics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      dataPointsReceived: 0,
      lastSyncTime: null,
      uptime: Date.now()
    };
    
    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    try {
      await this.createTables();
      await this.loadMarketConfigurations();
      await this.initializeConnections();
      await this.startHeartbeat();
      
      logger.info('VPP市场连接器服务初始化完成');
    } catch (error) {
      logger.error('VPP市场连接器服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    const db = await dbPromise;
    
    // 市场配置表
    await db.schema.hasTable('vpp_market_configs').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_market_configs', table => {
          table.increments('id').primary();
          table.string('market_id', 50).unique().notNullable();
          table.string('market_name', 100).notNullable();
          table.enum('market_type', Object.values(MARKET_TYPE)).notNullable();
          table.string('region', 50);
          table.string('operator', 100);
          table.enum('api_type', Object.values(API_TYPE)).notNullable();
          table.string('base_url', 500);
          table.string('websocket_url', 500);
          table.json('authentication_config');
          table.json('api_endpoints');
          table.json('data_mapping');
          table.json('trading_rules');
          table.json('settlement_rules');
          table.boolean('is_active').defaultTo(true);
          table.boolean('is_trading_enabled').defaultTo(false);
          table.integer('priority').defaultTo(1);
          table.timestamps(true, true);
          
          table.index(['market_type', 'is_active']);
          table.index('market_id');
        });
      }
    });
    
    // 市场数据表
    await db.schema.hasTable('vpp_market_data').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_market_data', table => {
          table.increments('id').primary();
          table.string('market_id', 50).notNullable();
          table.enum('data_type', Object.values(DATA_TYPE)).notNullable();
          table.string('symbol', 50);
          table.timestamp('data_timestamp').notNullable();
          table.json('data_content').notNullable();
          table.decimal('price', 15, 6);
          table.decimal('volume', 15, 6);
          table.json('metadata');
          table.timestamp('received_at').defaultTo(db.fn.now());
          table.timestamps(true, true);
          
          table.index(['market_id', 'data_type', 'data_timestamp']);
          table.index(['symbol', 'data_timestamp']);
          table.index('received_at');
        });
      }
    });
    
    // 连接状态表
    await db.schema.hasTable('vpp_market_connections').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_market_connections', table => {
          table.increments('id').primary();
          table.string('market_id', 50).notNullable();
          table.enum('connection_status', Object.values(CONNECTION_STATUS)).notNullable();
          table.timestamp('last_connected_at');
          table.timestamp('last_disconnected_at');
          table.integer('reconnect_attempts').defaultTo(0);
          table.json('connection_info');
          table.json('error_details');
          table.decimal('uptime_percentage', 5, 2).defaultTo(0);
          table.integer('total_requests').defaultTo(0);
          table.integer('successful_requests').defaultTo(0);
          table.integer('failed_requests').defaultTo(0);
          table.timestamps(true, true);
          
          table.index(['market_id', 'connection_status']);
          table.index('last_connected_at');
        });
      }
    });
    
    // 交易记录表
    await db.schema.hasTable('vpp_market_trades').then(exists => {
      if (!exists) {
        return db.schema.createTable('vpp_market_trades', table => {
          table.increments('id').primary();
          table.string('market_id', 50).notNullable();
          table.string('trade_id', 100).unique().notNullable();
          table.string('external_trade_id', 100);
          table.string('order_id', 100);
          table.string('symbol', 50).notNullable();
          table.enum('side', ['buy', 'sell']).notNullable();
          table.decimal('quantity', 15, 6).notNullable();
          table.decimal('price', 15, 6).notNullable();
          table.decimal('commission', 15, 6).defaultTo(0);
          table.json('trade_details');
          table.timestamp('trade_timestamp').notNullable();
          table.timestamp('settlement_date');
          table.timestamps(true, true);
          
          table.index(['market_id', 'trade_timestamp']);
          table.index(['symbol', 'trade_timestamp']);
          table.index('trade_id');
          table.index('external_trade_id');
        });
      }
    });
  }

  /**
   * 加载市场配置
   */
  async loadMarketConfigurations() {
    try {
      const db = await dbPromise;
      
      const configs = await db('vpp_market_configs')
        .where({ is_active: true })
        .orderBy('priority', 'desc');
      
      for (const config of configs) {
        this.marketConnections.set(config.market_id, {
          config: {
            ...config,
            authentication_config: JSON.parse(config.authentication_config || '{}'),
            api_endpoints: JSON.parse(config.api_endpoints || '{}'),
            data_mapping: JSON.parse(config.data_mapping || '{}'),
            trading_rules: JSON.parse(config.trading_rules || '{}'),
            settlement_rules: JSON.parse(config.settlement_rules || '{}')
          },
          status: CONNECTION_STATUS.DISCONNECTED,
          lastHeartbeat: null,
          reconnectAttempts: 0,
          client: null,
          websocket: null
        });
      }
      
      logger.info(`加载了 ${configs.length} 个市场配置`);
    } catch (error) {
      logger.error('加载市场配置失败:', error);
    }
  }

  /**
   * 初始化连接
   */
  async initializeConnections() {
    const promises = [];
    
    for (const [marketId, connection] of this.marketConnections) {
      promises.push(this.connectToMarket(marketId));
    }
    
    await Promise.allSettled(promises);
  }

  /**
   * 连接到市场
   */
  async connectToMarket(marketId) {
    const connection = this.marketConnections.get(marketId);
    if (!connection) {
      throw new Error(`市场配置不存在: ${marketId}`);
    }
    
    try {
      connection.status = CONNECTION_STATUS.CONNECTING;
      await this.updateConnectionStatus(marketId, CONNECTION_STATUS.CONNECTING);
      
      const config = connection.config;
      
      // 根据API类型建立连接
      switch (config.api_type) {
        case API_TYPE.REST:
          await this.initializeRestConnection(marketId, connection);
          break;
        case API_TYPE.WEBSOCKET:
          await this.initializeWebSocketConnection(marketId, connection);
          break;
        default:
          throw new Error(`不支持的API类型: ${config.api_type}`);
      }
      
      connection.status = CONNECTION_STATUS.CONNECTED;
      connection.lastHeartbeat = Date.now();
      connection.reconnectAttempts = 0;
      
      await this.updateConnectionStatus(marketId, CONNECTION_STATUS.CONNECTED);
      
      // 开始数据订阅
      await this.subscribeToMarketData(marketId);
      
      logger.info(`成功连接到市场: ${marketId}`);
      this.emit('marketConnected', { marketId });
      
    } catch (error) {
      logger.error(`连接市场失败 ${marketId}:`, error);
      connection.status = CONNECTION_STATUS.ERROR;
      await this.updateConnectionStatus(marketId, CONNECTION_STATUS.ERROR, error.message);
      
      // 安排重连
      this.scheduleReconnect(marketId);
    }
  }

  /**
   * 初始化REST连接
   */
  async initializeRestConnection(marketId, connection) {
    const config = connection.config;
    
    // 创建axios实例
    const client = axios.create({
      baseURL: config.base_url,
      timeout: this.config.connectionTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VPP-Market-Connector/1.0'
      }
    });
    
    // 添加认证
    if (config.authentication_config.type === 'bearer') {
      const token = await this.getAuthToken(marketId);
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else if (config.authentication_config.type === 'api_key') {
      client.defaults.headers.common[config.authentication_config.header_name] = 
        config.authentication_config.api_key;
    }
    
    // 添加请求拦截器
    client.interceptors.request.use(
      (config) => {
        this.statistics.totalRequests++;
        return config;
      },
      (error) => {
        this.statistics.failedRequests++;
        return Promise.reject(error);
      }
    );
    
    // 添加响应拦截器
    client.interceptors.response.use(
      (response) => {
        this.statistics.successfulRequests++;
        return response;
      },
      (error) => {
        this.statistics.failedRequests++;
        return Promise.reject(error);
      }
    );
    
    connection.client = client;
    
    // 测试连接
    if (config.api_endpoints.health_check) {
      await client.get(config.api_endpoints.health_check);
    }
  }

  /**
   * 初始化WebSocket连接
   */
  async initializeWebSocketConnection(marketId, connection) {
    const config = connection.config;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.websocket_url);
      
      ws.on('open', () => {
        logger.info(`WebSocket连接已建立: ${marketId}`);
        connection.websocket = ws;
        resolve();
      });
      
      ws.on('message', (data) => {
        this.handleWebSocketMessage(marketId, data);
      });
      
      ws.on('error', (error) => {
        logger.error(`WebSocket错误 ${marketId}:`, error);
        reject(error);
      });
      
      ws.on('close', () => {
        logger.warn(`WebSocket连接关闭: ${marketId}`);
        this.handleWebSocketDisconnect(marketId);
      });
      
      // 连接超时
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error('WebSocket连接超时'));
        }
      }, this.config.connectionTimeout);
    });
  }

  /**
   * 处理WebSocket消息
   */
  async handleWebSocketMessage(marketId, data) {
    try {
      const message = JSON.parse(data.toString());
      
      // 更新心跳
      const connection = this.marketConnections.get(marketId);
      if (connection) {
        connection.lastHeartbeat = Date.now();
      }
      
      // 处理不同类型的消息
      switch (message.type) {
        case 'price_update':
          await this.handlePriceUpdate(marketId, message.data);
          break;
        case 'order_book':
          await this.handleOrderBookUpdate(marketId, message.data);
          break;
        case 'trade':
          await this.handleTradeUpdate(marketId, message.data);
          break;
        case 'market_status':
          await this.handleMarketStatusUpdate(marketId, message.data);
          break;
        default:
          logger.debug(`未知消息类型: ${message.type}`);
      }
      
      this.statistics.dataPointsReceived++;
      
    } catch (error) {
      logger.error(`处理WebSocket消息失败 ${marketId}:`, error);
    }
  }

  /**
   * 处理WebSocket断开
   */
  handleWebSocketDisconnect(marketId) {
    const connection = this.marketConnections.get(marketId);
    if (connection) {
      connection.status = CONNECTION_STATUS.DISCONNECTED;
      connection.websocket = null;
      this.updateConnectionStatus(marketId, CONNECTION_STATUS.DISCONNECTED);
      this.scheduleReconnect(marketId);
    }
  }

  /**
   * 订阅市场数据
   */
  async subscribeToMarketData(marketId) {
    const connection = this.marketConnections.get(marketId);
    if (!connection) return;
    
    const config = connection.config;
    
    try {
      if (config.api_type === API_TYPE.WEBSOCKET && connection.websocket) {
        // WebSocket订阅
        const subscribeMessage = {
          action: 'subscribe',
          channels: ['price', 'orderbook', 'trades', 'market_status']
        };
        
        connection.websocket.send(JSON.stringify(subscribeMessage));
        
      } else if (config.api_type === API_TYPE.REST && connection.client) {
        // REST轮询
        this.startRestPolling(marketId);
      }
      
      logger.info(`开始订阅市场数据: ${marketId}`);
      
    } catch (error) {
      logger.error(`订阅市场数据失败 ${marketId}:`, error);
    }
  }

  /**
   * 开始REST轮询
   */
  startRestPolling(marketId) {
    const connection = this.marketConnections.get(marketId);
    if (!connection) return;
    
    const config = connection.config;
    const client = connection.client;
    
    // 价格数据轮询
    if (config.api_endpoints.price_data) {
      const priceInterval = setInterval(async () => {
        try {
          if (connection.status !== CONNECTION_STATUS.CONNECTED) {
            clearInterval(priceInterval);
            return;
          }
          
          const response = await client.get(config.api_endpoints.price_data);
          await this.handlePriceUpdate(marketId, response.data);
          
        } catch (error) {
          logger.error(`获取价格数据失败 ${marketId}:`, error);
        }
      }, 30000); // 30秒轮询一次
    }
    
    // 订单簿数据轮询
    if (config.api_endpoints.order_book) {
      const orderBookInterval = setInterval(async () => {
        try {
          if (connection.status !== CONNECTION_STATUS.CONNECTED) {
            clearInterval(orderBookInterval);
            return;
          }
          
          const response = await client.get(config.api_endpoints.order_book);
          await this.handleOrderBookUpdate(marketId, response.data);
          
        } catch (error) {
          logger.error(`获取订单簿数据失败 ${marketId}:`, error);
        }
      }, 10000); // 10秒轮询一次
    }
  }

  /**
   * 处理价格更新
   */
  async handlePriceUpdate(marketId, data) {
    try {
      const connection = this.marketConnections.get(marketId);
      const mapping = connection.config.data_mapping;
      
      // 数据映射
      const priceData = {
        market_id: marketId,
        data_type: DATA_TYPE.PRICE,
        symbol: data[mapping.symbol] || 'DEFAULT',
        data_timestamp: new Date(data[mapping.timestamp] || Date.now()),
        price: parseFloat(data[mapping.price] || 0),
        volume: parseFloat(data[mapping.volume] || 0),
        data_content: data,
        metadata: {
          source: 'market_feed',
          processing_time: Date.now()
        }
      };
      
      // 保存到数据库
      await this.saveMarketData(priceData);
      
      // 更新缓存
      const cacheKey = `${marketId}_${priceData.symbol}`;
      this.priceCache.set(cacheKey, priceData);
      this.lastDataUpdate.set(cacheKey, Date.now());
      
      // 发送事件
      this.emit('priceUpdate', priceData);
      
    } catch (error) {
      logger.error(`处理价格更新失败 ${marketId}:`, error);
    }
  }

  /**
   * 处理订单簿更新
   */
  async handleOrderBookUpdate(marketId, data) {
    try {
      const orderBookData = {
        market_id: marketId,
        data_type: DATA_TYPE.ORDER_BOOK,
        symbol: data.symbol || 'DEFAULT',
        data_timestamp: new Date(data.timestamp || Date.now()),
        data_content: data,
        metadata: {
          source: 'market_feed',
          processing_time: Date.now()
        }
      };
      
      // 保存到数据库
      await this.saveMarketData(orderBookData);
      
      // 更新缓存
      const cacheKey = `${marketId}_${orderBookData.symbol}_orderbook`;
      this.orderBookCache.set(cacheKey, orderBookData);
      
      // 发送事件
      this.emit('orderBookUpdate', orderBookData);
      
    } catch (error) {
      logger.error(`处理订单簿更新失败 ${marketId}:`, error);
    }
  }

  /**
   * 处理交易更新
   */
  async handleTradeUpdate(marketId, data) {
    try {
      const tradeData = {
        market_id: marketId,
        trade_id: data.trade_id || `${marketId}_${Date.now()}`,
        external_trade_id: data.external_id,
        order_id: data.order_id,
        symbol: data.symbol,
        side: data.side,
        quantity: parseFloat(data.quantity),
        price: parseFloat(data.price),
        commission: parseFloat(data.commission || 0),
        trade_details: data,
        trade_timestamp: new Date(data.timestamp || Date.now()),
        settlement_date: data.settlement_date ? new Date(data.settlement_date) : null
      };
      
      // 保存交易记录
      await this.saveTradeData(tradeData);
      
      // 发送事件
      this.emit('tradeUpdate', tradeData);
      
    } catch (error) {
      logger.error(`处理交易更新失败 ${marketId}:`, error);
    }
  }

  /**
   * 处理市场状态更新
   */
  async handleMarketStatusUpdate(marketId, data) {
    try {
      const statusData = {
        market_id: marketId,
        data_type: DATA_TYPE.MARKET_STATUS,
        data_timestamp: new Date(data.timestamp || Date.now()),
        data_content: data,
        metadata: {
          source: 'market_feed',
          processing_time: Date.now()
        }
      };
      
      // 保存到数据库
      await this.saveMarketData(statusData);
      
      // 更新缓存
      this.marketStatusCache.set(marketId, statusData);
      
      // 发送事件
      this.emit('marketStatusUpdate', statusData);
      
    } catch (error) {
      logger.error(`处理市场状态更新失败 ${marketId}:`, error);
    }
  }

  /**
   * 保存市场数据
   */
  async saveMarketData(data) {
    try {
      const db = await dbPromise;
      
      await db('vpp_market_data').insert({
        ...data,
        data_content: JSON.stringify(data.data_content),
        metadata: JSON.stringify(data.metadata)
      });
      
    } catch (error) {
      logger.error('保存市场数据失败:', error);
    }
  }

  /**
   * 保存交易数据
   */
  async saveTradeData(data) {
    try {
      const db = await dbPromise;
      
      await db('vpp_market_trades').insert({
        ...data,
        trade_details: JSON.stringify(data.trade_details)
      });
      
    } catch (error) {
      logger.error('保存交易数据失败:', error);
    }
  }

  /**
   * 提交订单到市场
   */
  async submitOrder(marketId, orderData) {
    const connection = this.marketConnections.get(marketId);
    if (!connection || connection.status !== CONNECTION_STATUS.CONNECTED) {
      throw new Error(`市场未连接: ${marketId}`);
    }
    
    if (!connection.config.is_trading_enabled) {
      throw new Error(`市场交易未启用: ${marketId}`);
    }
    
    try {
      // 检查速率限制
      if (!this.checkRateLimit(marketId)) {
        throw new Error('超过速率限制');
      }
      
      const config = connection.config;
      const client = connection.client;
      
      // 构建订单请求
      const orderRequest = this.buildOrderRequest(orderData, config);
      
      // 提交订单
      const response = await client.post(config.api_endpoints.submit_order, orderRequest);
      
      return {
        success: true,
        external_order_id: response.data.order_id,
        message: '订单已提交',
        response: response.data
      };
      
    } catch (error) {
      logger.error(`提交订单失败 ${marketId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 构建订单请求
   */
  buildOrderRequest(orderData, config) {
    const mapping = config.data_mapping.order || {};
    
    const request = {};
    
    // 映射字段
    request[mapping.symbol || 'symbol'] = orderData.symbol;
    request[mapping.side || 'side'] = orderData.side;
    request[mapping.quantity || 'quantity'] = orderData.quantity;
    request[mapping.price || 'price'] = orderData.price;
    request[mapping.order_type || 'type'] = orderData.order_type;
    
    // 添加其他参数
    if (orderData.stop_price) {
      request[mapping.stop_price || 'stop_price'] = orderData.stop_price;
    }
    
    if (orderData.time_in_force) {
      request[mapping.time_in_force || 'time_in_force'] = orderData.time_in_force;
    }
    
    return request;
  }

  /**
   * 检查速率限制
   */
  checkRateLimit(marketId) {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    if (!this.rateLimiter.has(marketId)) {
      this.rateLimiter.set(marketId, []);
    }
    
    const requests = this.rateLimiter.get(marketId);
    
    // 清理过期请求
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.config.rateLimitRequests) {
      return false;
    }
    
    // 添加当前请求
    validRequests.push(now);
    this.rateLimiter.set(marketId, validRequests);
    
    return true;
  }

  /**
   * 获取认证令牌
   */
  async getAuthToken(marketId) {
    const connection = this.marketConnections.get(marketId);
    const authConfig = connection.config.authentication_config;
    
    if (authConfig.type === 'oauth2') {
      // OAuth2认证流程
      const tokenResponse = await axios.post(authConfig.token_url, {
        grant_type: 'client_credentials',
        client_id: authConfig.client_id,
        client_secret: authConfig.client_secret,
        scope: authConfig.scope
      });
      
      return tokenResponse.data.access_token;
    }
    
    return authConfig.static_token;
  }

  /**
   * 安排重连
   */
  scheduleReconnect(marketId) {
    const connection = this.marketConnections.get(marketId);
    if (!connection) return;
    
    connection.reconnectAttempts++;
    
    if (connection.reconnectAttempts > this.config.maxReconnectAttempts) {
      logger.error(`市场 ${marketId} 重连次数超过限制，停止重连`);
      return;
    }
    
    const delay = this.config.reconnectInterval * Math.pow(2, connection.reconnectAttempts - 1);
    
    setTimeout(() => {
      logger.info(`尝试重连市场: ${marketId} (第${connection.reconnectAttempts}次)`);
      this.connectToMarket(marketId);
    }, delay);
  }

  /**
   * 更新连接状态
   */
  async updateConnectionStatus(marketId, status, errorMessage = null) {
    try {
      const db = await dbPromise;
      
      const updateData = {
        market_id: marketId,
        connection_status: status,
        updated_at: new Date()
      };
      
      if (status === CONNECTION_STATUS.CONNECTED) {
        updateData.last_connected_at = new Date();
      } else if (status === CONNECTION_STATUS.DISCONNECTED) {
        updateData.last_disconnected_at = new Date();
      }
      
      if (errorMessage) {
        updateData.error_details = JSON.stringify({ error: errorMessage, timestamp: new Date() });
      }
      
      await db('vpp_market_connections')
        .insert(updateData)
        .onConflict('market_id')
        .merge();
        
    } catch (error) {
      logger.error('更新连接状态失败:', error);
    }
  }

  /**
   * 开始心跳监控
   */
  startHeartbeat() {
    setInterval(() => {
      this.checkConnections();
    }, this.config.heartbeatInterval);
  }

  /**
   * 检查连接状态
   */
  checkConnections() {
    const now = Date.now();
    
    for (const [marketId, connection] of this.marketConnections) {
      if (connection.status === CONNECTION_STATUS.CONNECTED) {
        const timeSinceLastHeartbeat = now - (connection.lastHeartbeat || 0);
        
        if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
          logger.warn(`市场 ${marketId} 心跳超时，尝试重连`);
          connection.status = CONNECTION_STATUS.DISCONNECTED;
          this.scheduleReconnect(marketId);
        }
      }
    }
  }

  /**
   * 获取市场数据
   */
  async getMarketData(marketId, dataType, symbol = null, startTime = null, endTime = null, limit = 100) {
    try {
      const db = await dbPromise;
      
      let query = db('vpp_market_data')
        .where({ market_id: marketId, data_type: dataType });
      
      if (symbol) {
        query = query.where({ symbol });
      }
      
      if (startTime) {
        query = query.where('data_timestamp', '>=', startTime);
      }
      
      if (endTime) {
        query = query.where('data_timestamp', '<=', endTime);
      }
      
      const data = await query
        .orderBy('data_timestamp', 'desc')
        .limit(limit);
      
      return data.map(item => ({
        ...item,
        data_content: JSON.parse(item.data_content),
        metadata: JSON.parse(item.metadata || '{}')
      }));
      
    } catch (error) {
      logger.error('获取市场数据失败:', error);
      return [];
    }
  }

  /**
   * 获取最新价格
   */
  getLatestPrice(marketId, symbol = 'DEFAULT') {
    const cacheKey = `${marketId}_${symbol}`;
    return this.priceCache.get(cacheKey);
  }

  /**
   * 获取订单簿
   */
  getOrderBook(marketId, symbol = 'DEFAULT') {
    const cacheKey = `${marketId}_${symbol}_orderbook`;
    return this.orderBookCache.get(cacheKey);
  }

  /**
   * 获取市场状态
   */
  getMarketStatus(marketId) {
    return this.marketStatusCache.get(marketId);
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus() {
    try {
      const db = await dbPromise;
      
      // 统计连接状态
      const connectionStats = await db('vpp_market_connections')
        .select(
          db.raw('COUNT(*) as total_markets'),
          db.raw('COUNT(CASE WHEN connection_status = "connected" THEN 1 END) as connected_markets'),
          db.raw('COUNT(CASE WHEN connection_status = "error" THEN 1 END) as error_markets'),
          db.raw('AVG(uptime_percentage) as avg_uptime')
        )
        .first();
      
      // 统计数据量
      const dataStats = await db('vpp_market_data')
        .select(
          db.raw('COUNT(*) as total_data_points'),
          db.raw('COUNT(DISTINCT market_id) as active_markets'),
          db.raw('MAX(received_at) as last_data_time')
        )
        .where('received_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 DAY)'))
        .first();
      
      // 统计交易数据
      const tradeStats = await db('vpp_market_trades')
        .select(
          db.raw('COUNT(*) as total_trades'),
          db.raw('SUM(quantity * price) as total_volume'),
          db.raw('MAX(trade_timestamp) as last_trade_time')
        )
        .where('trade_timestamp', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 DAY)'))
        .first();
      
      return {
        service: 'VPPMarketConnectorService',
        status: 'running',
        uptime: Date.now() - this.statistics.uptime,
        connections: {
          total_markets: parseInt(connectionStats.total_markets) || 0,
          connected_markets: parseInt(connectionStats.connected_markets) || 0,
          error_markets: parseInt(connectionStats.error_markets) || 0,
          average_uptime: parseFloat(connectionStats.avg_uptime) || 0,
          active_websockets: this.websocketConnections.size
        },
        data_flow: {
          total_data_points_24h: parseInt(dataStats.total_data_points) || 0,
          active_markets: parseInt(dataStats.active_markets) || 0,
          last_data_time: dataStats.last_data_time,
          data_points_received: this.statistics.dataPointsReceived
        },
        trading: {
          total_trades_24h: parseInt(tradeStats.total_trades) || 0,
          total_volume_24h: parseFloat(tradeStats.total_volume) || 0,
          last_trade_time: tradeStats.last_trade_time
        },
        api_statistics: {
          total_requests: this.statistics.totalRequests,
          successful_requests: this.statistics.successfulRequests,
          failed_requests: this.statistics.failedRequests,
          success_rate: this.statistics.totalRequests > 0 ? 
            (this.statistics.successfulRequests / this.statistics.totalRequests) * 100 : 0
        },
        cache_status: {
          price_cache_size: this.priceCache.size,
          order_book_cache_size: this.orderBookCache.size,
          market_status_cache_size: this.marketStatusCache.size
        },
        configuration: this.config,
        last_sync: this.statistics.lastSyncTime,
        last_check: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      return {
        service: 'VPPMarketConnectorService',
        status: 'error',
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }
}

// 创建服务实例
const vppMarketConnectorService = new VPPMarketConnectorService();

export default vppMarketConnectorService;
export { 
  MARKET_TYPE, 
  CONNECTION_STATUS, 
  DATA_TYPE, 
  API_TYPE 
};