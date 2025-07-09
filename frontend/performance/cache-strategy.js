// 零碳园区数字孪生系统 - 前端缓存策略
// 版本: 2.0
// 作者: 零碳园区开发团队
// 日期: 2025-06-15

// 缓存配置常量
const CACHE_CONFIG = {
  // 缓存版本
  VERSION: '2.0.0',
  
  // 缓存键前缀
  PREFIX: 'zero_carbon_',
  
  // 缓存过期时间（毫秒）
  EXPIRY: {
    SHORT: 5 * 60 * 1000,      // 5分钟
    MEDIUM: 30 * 60 * 1000,    // 30分钟
    LONG: 2 * 60 * 60 * 1000,  // 2小时
    VERY_LONG: 24 * 60 * 60 * 1000, // 24小时
    PERSISTENT: 7 * 24 * 60 * 60 * 1000 // 7天
  },
  
  // 缓存大小限制
  SIZE_LIMITS: {
    LOCAL_STORAGE: 5 * 1024 * 1024,    // 5MB
    SESSION_STORAGE: 5 * 1024 * 1024,  // 5MB
    MEMORY_CACHE: 50 * 1024 * 1024,    // 50MB
    INDEX_DB: 100 * 1024 * 1024        // 100MB
  }
};

// 缓存类型枚举
const CACHE_TYPES = {
  MEMORY: 'memory',
  LOCAL_STORAGE: 'localStorage',
  SESSION_STORAGE: 'sessionStorage',
  INDEX_DB: 'indexedDB'
};

// 内存缓存管理器
class MemoryCache {
  constructor(maxSize = CACHE_CONFIG.SIZE_LIMITS.MEMORY_CACHE) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.currentSize = 0;
  }

  set(key, value, expiry = CACHE_CONFIG.EXPIRY.MEDIUM) {
    const item = {
      value,
      expiry: Date.now() + expiry,
      size: this.calculateSize(value),
      lastAccessed: Date.now()
    };

    // 检查是否需要清理空间
    if (this.currentSize + item.size > this.maxSize) {
      this.evictLRU(item.size);
    }

    // 如果键已存在，先删除旧值
    if (this.cache.has(key)) {
      this.currentSize -= this.cache.get(key).size;
    }

    this.cache.set(key, item);
    this.currentSize += item.size;
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }

    // 更新访问时间
    item.lastAccessed = Date.now();
    return item.value;
  }

  delete(key) {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      this.cache.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.currentSize = 0;
  }

  // LRU淘汰策略
  evictLRU(requiredSize) {
    const entries = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);

    let freedSize = 0;
    for (const [key, item] of entries) {
      this.delete(key);
      freedSize += item.size;
      
      if (freedSize >= requiredSize) {
        break;
      }
    }
  }

  // 计算数据大小（简化版）
  calculateSize(value) {
    return JSON.stringify(value).length * 2; // 粗略估算
  }

  // 获取缓存统计信息
  getStats() {
    return {
      size: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      utilization: (this.currentSize / this.maxSize * 100).toFixed(2) + '%'
    };
  }
}

// IndexedDB缓存管理器
class IndexedDBCache {
  constructor(dbName = 'ZeroCarbonCache', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expiry', 'expiry', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  async set(key, value, expiry = CACHE_CONFIG.EXPIRY.LONG, category = 'default') {
    await this.initPromise;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    const item = {
      key,
      value,
      expiry: Date.now() + expiry,
      category,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key) {
    await this.initPromise;
    
    const transaction = this.db.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const item = request.result;
        
        if (!item) {
          resolve(null);
          return;
        }
        
        // 检查是否过期
        if (Date.now() > item.expiry) {
          this.delete(key);
          resolve(null);
          return;
        }
        
        resolve(item.value);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key) {
    await this.initPromise;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(category = null) {
    await this.initPromise;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    if (category) {
      const index = store.index('category');
      const request = index.openCursor(IDBKeyRange.only(category));
      
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    } else {
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // 清理过期数据
  async cleanExpired() {
    await this.initPromise;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('expiry');
    
    const now = Date.now();
    const request = index.openCursor(IDBKeyRange.upperBound(now));
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// 统一缓存管理器
class CacheManager {
  constructor() {
    this.memoryCache = new MemoryCache();
    this.indexedDBCache = new IndexedDBCache();
    this.strategies = new Map();
    
    this.initializeStrategies();
    this.startCleanupTimer();
  }

  // 初始化缓存策略
  initializeStrategies() {
    // API响应缓存策略
    this.strategies.set('api_response', {
      type: CACHE_TYPES.MEMORY,
      expiry: CACHE_CONFIG.EXPIRY.SHORT,
      compress: true
    });

    // 用户数据缓存策略
    this.strategies.set('user_data', {
      type: CACHE_TYPES.LOCAL_STORAGE,
      expiry: CACHE_CONFIG.EXPIRY.LONG,
      encrypt: true
    });

    // 静态资源缓存策略
    this.strategies.set('static_resource', {
      type: CACHE_TYPES.INDEX_DB,
      expiry: CACHE_CONFIG.EXPIRY.VERY_LONG,
      compress: true
    });

    // 实时数据缓存策略
    this.strategies.set('realtime_data', {
      type: CACHE_TYPES.MEMORY,
      expiry: CACHE_CONFIG.EXPIRY.SHORT,
      maxSize: 1024 * 1024 // 1MB
    });

    // 报表数据缓存策略
    this.strategies.set('report_data', {
      type: CACHE_TYPES.INDEX_DB,
      expiry: CACHE_CONFIG.EXPIRY.MEDIUM,
      category: 'reports'
    });

    // 配置数据缓存策略
    this.strategies.set('config_data', {
      type: CACHE_TYPES.LOCAL_STORAGE,
      expiry: CACHE_CONFIG.EXPIRY.PERSISTENT,
      persistent: true
    });
  }

  // 设置缓存
  async set(key, value, strategyName = 'api_response') {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Unknown cache strategy: ${strategyName}`);
    }

    const fullKey = `${CACHE_CONFIG.PREFIX}${key}`;
    let processedValue = value;

    // 数据压缩
    if (strategy.compress) {
      processedValue = this.compress(value);
    }

    // 数据加密
    if (strategy.encrypt) {
      processedValue = this.encrypt(processedValue);
    }

    // 根据策略选择缓存类型
    switch (strategy.type) {
      case CACHE_TYPES.MEMORY:
        this.memoryCache.set(fullKey, processedValue, strategy.expiry);
        break;
        
      case CACHE_TYPES.LOCAL_STORAGE:
        this.setLocalStorage(fullKey, processedValue, strategy.expiry);
        break;
        
      case CACHE_TYPES.SESSION_STORAGE:
        this.setSessionStorage(fullKey, processedValue, strategy.expiry);
        break;
        
      case CACHE_TYPES.INDEX_DB:
        await this.indexedDBCache.set(
          fullKey, 
          processedValue, 
          strategy.expiry, 
          strategy.category
        );
        break;
    }

    // 记录缓存操作
    this.recordCacheOperation('set', strategyName, key);
  }

  // 获取缓存
  async get(key, strategyName = 'api_response') {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      return null;
    }

    const fullKey = `${CACHE_CONFIG.PREFIX}${key}`;
    let value = null;

    // 根据策略选择缓存类型
    switch (strategy.type) {
      case CACHE_TYPES.MEMORY:
        value = this.memoryCache.get(fullKey);
        break;
        
      case CACHE_TYPES.LOCAL_STORAGE:
        value = this.getLocalStorage(fullKey);
        break;
        
      case CACHE_TYPES.SESSION_STORAGE:
        value = this.getSessionStorage(fullKey);
        break;
        
      case CACHE_TYPES.INDEX_DB:
        value = await this.indexedDBCache.get(fullKey);
        break;
    }

    if (value === null) {
      return null;
    }

    // 数据解密
    if (strategy.encrypt) {
      value = this.decrypt(value);
    }

    // 数据解压缩
    if (strategy.compress) {
      value = this.decompress(value);
    }

    // 记录缓存操作
    this.recordCacheOperation('get', strategyName, key);

    return value;
  }

  // 删除缓存
  async delete(key, strategyName = 'api_response') {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      return;
    }

    const fullKey = `${CACHE_CONFIG.PREFIX}${key}`;

    switch (strategy.type) {
      case CACHE_TYPES.MEMORY:
        this.memoryCache.delete(fullKey);
        break;
        
      case CACHE_TYPES.LOCAL_STORAGE:
        localStorage.removeItem(fullKey);
        break;
        
      case CACHE_TYPES.SESSION_STORAGE:
        sessionStorage.removeItem(fullKey);
        break;
        
      case CACHE_TYPES.INDEX_DB:
        await this.indexedDBCache.delete(fullKey);
        break;
    }

    this.recordCacheOperation('delete', strategyName, key);
  }

  // LocalStorage操作
  setLocalStorage(key, value, expiry) {
    try {
      const item = {
        value,
        expiry: Date.now() + expiry
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('LocalStorage set failed:', error);
      // 清理空间后重试
      this.cleanupLocalStorage();
      try {
        localStorage.setItem(key, JSON.stringify({ value, expiry: Date.now() + expiry }));
      } catch (retryError) {
        console.error('LocalStorage set failed after cleanup:', retryError);
      }
    }
  }

  getLocalStorage(key) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.warn('LocalStorage get failed:', error);
      return null;
    }
  }

  // SessionStorage操作
  setSessionStorage(key, value, expiry) {
    try {
      const item = {
        value,
        expiry: Date.now() + expiry
      };
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('SessionStorage set failed:', error);
    }
  }

  getSessionStorage(key) {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      if (Date.now() > item.expiry) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.warn('SessionStorage get failed:', error);
      return null;
    }
  }

  // 数据压缩（简化版）
  compress(data) {
    // 实际项目中可以使用 LZ-string 等压缩库
    return JSON.stringify(data);
  }

  // 数据解压缩
  decompress(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  }

  // 数据加密（简化版）
  encrypt(data) {
    // 实际项目中应使用更安全的加密算法
    return btoa(JSON.stringify(data));
  }

  // 数据解密
  decrypt(data) {
    try {
      return JSON.parse(atob(data));
    } catch (error) {
      return data;
    }
  }

  // 清理LocalStorage
  cleanupLocalStorage() {
    const keys = Object.keys(localStorage);
    const prefixKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX));
    
    // 按过期时间排序，优先删除过期的
    const itemsWithExpiry = prefixKeys.map(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        return { key, expiry: item.expiry || 0 };
      } catch {
        return { key, expiry: 0 };
      }
    }).sort((a, b) => a.expiry - b.expiry);
    
    // 删除一半的缓存项
    const toDelete = itemsWithExpiry.slice(0, Math.ceil(itemsWithExpiry.length / 2));
    toDelete.forEach(({ key }) => localStorage.removeItem(key));
  }

  // 记录缓存操作
  recordCacheOperation(operation, strategy, key) {
    if (window.performanceMonitor) {
      window.performanceMonitor.addMetric({
        type: 'cache-operation',
        timestamp: Date.now(),
        sessionId: window.performanceMonitor.sessionId,
        data: {
          operation,
          strategy,
          key: key.substring(0, 50), // 限制长度
          timestamp: Date.now()
        }
      });
    }
  }

  // 启动清理定时器
  startCleanupTimer() {
    // 每小时清理一次过期数据
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 60 * 1000);
  }

  // 清理过期数据
  async cleanupExpired() {
    // 清理IndexedDB过期数据
    await this.indexedDBCache.cleanExpired();
    
    // 清理LocalStorage过期数据
    const keys = Object.keys(localStorage);
    keys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX))
         .forEach(key => {
           try {
             const item = JSON.parse(localStorage.getItem(key));
             if (item.expiry && Date.now() > item.expiry) {
               localStorage.removeItem(key);
             }
           } catch (error) {
             localStorage.removeItem(key); // 删除损坏的数据
           }
         });
    
    // 清理SessionStorage过期数据
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX))
               .forEach(key => {
                 try {
                   const item = JSON.parse(sessionStorage.getItem(key));
                   if (item.expiry && Date.now() > item.expiry) {
                     sessionStorage.removeItem(key);
                   }
                 } catch (error) {
                   sessionStorage.removeItem(key);
                 }
               });
  }

  // 获取缓存统计信息
  async getStats() {
    const memoryStats = this.memoryCache.getStats();
    
    return {
      memory: memoryStats,
      localStorage: {
        used: JSON.stringify(localStorage).length,
        available: CACHE_CONFIG.SIZE_LIMITS.LOCAL_STORAGE
      },
      sessionStorage: {
        used: JSON.stringify(sessionStorage).length,
        available: CACHE_CONFIG.SIZE_LIMITS.SESSION_STORAGE
      },
      strategies: Array.from(this.strategies.keys())
    };
  }

  // 清空所有缓存
  async clearAll() {
    this.memoryCache.clear();
    await this.indexedDBCache.clear();
    
    // 清理LocalStorage中的缓存项
    const localKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_CONFIG.PREFIX));
    localKeys.forEach(key => localStorage.removeItem(key));
    
    // 清理SessionStorage中的缓存项
    const sessionKeys = Object.keys(sessionStorage)
      .filter(key => key.startsWith(CACHE_CONFIG.PREFIX));
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
  }
}

// 创建全局缓存管理器实例
const cacheManager = new CacheManager();

// 导出缓存管理器和相关工具
export {
  cacheManager,
  CacheManager,
  MemoryCache,
  IndexedDBCache,
  CACHE_CONFIG,
  CACHE_TYPES
};

export default cacheManager;