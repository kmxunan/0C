import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import * as THREE from 'three';

/**
 * 模型缓存管理器
 * 提供智能的3D模型缓存、预加载和内存管理功能
 */

// 缓存状态
const CACHE_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  EXPIRED: 'expired'
};

// 缓存策略
const CACHE_STRATEGIES = {
  LRU: 'lru', // 最近最少使用
  LFU: 'lfu', // 最少使用频率
  FIFO: 'fifo', // 先进先出
  SIZE_BASED: 'size_based' // 基于大小
};

// 初始状态
const initialState = {
  cache: new Map(), // 模型缓存
  loadingQueue: new Map(), // 加载队列
  preloadQueue: [], // 预加载队列
  statistics: {
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    loadCount: 0,
    errorCount: 0
  },
  config: {
    maxSize: 500 * 1024 * 1024, // 500MB
    maxItems: 100,
    ttl: 30 * 60 * 1000, // 30分钟
    strategy: CACHE_STRATEGIES.LRU,
    preloadEnabled: true,
    compressionEnabled: true
  }
};

// Reducer
const cacheReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CACHE_ITEM':
      return {
        ...state,
        cache: new Map(state.cache).set(action.key, action.item),
        statistics: {
          ...state.statistics,
          totalSize: state.statistics.totalSize + (action.item.size || 0)
        }
      };

    case 'REMOVE_CACHE_ITEM':
      const newCache = new Map(state.cache);
      const item = newCache.get(action.key);
      newCache.delete(action.key);
      return {
        ...state,
        cache: newCache,
        statistics: {
          ...state.statistics,
          totalSize: state.statistics.totalSize - (item?.size || 0)
        }
      };

    case 'UPDATE_STATISTICS':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          ...action.updates
        }
      };

    case 'SET_LOADING':
      return {
        ...state,
        loadingQueue: new Map(state.loadingQueue).set(action.key, action.promise)
      };

    case 'REMOVE_LOADING':
      const newLoadingQueue = new Map(state.loadingQueue);
      newLoadingQueue.delete(action.key);
      return {
        ...state,
        loadingQueue: newLoadingQueue
      };

    case 'SET_CONFIG':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.config
        }
      };

    case 'CLEAR_CACHE':
      return {
        ...state,
        cache: new Map(),
        statistics: {
          ...state.statistics,
          totalSize: 0
        }
      };

    default:
      return state;
  }
};

// Context
const ModelCacheContext = createContext();

/**
 * 模型缓存提供者组件
 */
export const ModelCacheProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cacheReducer, initialState);
  
  // 加载器实例
  const loaders = {
    gltf: new GLTFLoader(),
    draco: new DRACOLoader(),
    ktx2: new KTX2Loader()
  };

  // 初始化加载器
  useEffect(() => {
    // 配置DRACO解码器
    loaders.draco.setDecoderPath('/draco/');
    loaders.gltf.setDRACOLoader(loaders.draco);
    
    // 配置KTX2加载器
    loaders.ktx2.setTranscoderPath('/basis/');
    loaders.gltf.setKTX2Loader(loaders.ktx2);
  }, []);

  // 生成缓存键
  const generateCacheKey = useCallback((url, options = {}) => {
    const optionsStr = JSON.stringify(options);
    return `${url}:${btoa(optionsStr)}`;
  }, []);

  // 计算模型大小
  const calculateModelSize = useCallback((model) => {
    let size = 0;
    
    model.traverse((child) => {
      if (child.geometry) {
        // 几何体大小
        const geometry = child.geometry;
        if (geometry.attributes.position) {
          size += geometry.attributes.position.array.byteLength;
        }
        if (geometry.attributes.normal) {
          size += geometry.attributes.normal.array.byteLength;
        }
        if (geometry.attributes.uv) {
          size += geometry.attributes.uv.array.byteLength;
        }
        if (geometry.index) {
          size += geometry.index.array.byteLength;
        }
      }
      
      if (child.material) {
        // 材质和纹理大小
        const material = Array.isArray(child.material) ? child.material : [child.material];
        material.forEach(mat => {
          Object.values(mat).forEach(value => {
            if (value && value.isTexture) {
              const image = value.image;
              if (image) {
                size += image.width * image.height * 4; // 假设RGBA
              }
            }
          });
        });
      }
    });
    
    return size;
  }, []);

  // 检查缓存容量
  const checkCacheCapacity = useCallback(() => {
    const { cache, config } = state;
    
    if (cache.size >= config.maxItems || state.statistics.totalSize >= config.maxSize) {
      // 执行清理策略
      const itemsToRemove = [];
      
      switch (config.strategy) {
        case CACHE_STRATEGIES.LRU:
          // 按最后访问时间排序
          const sortedByAccess = Array.from(cache.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
          itemsToRemove.push(...sortedByAccess.slice(0, Math.ceil(cache.size * 0.2)));
          break;
          
        case CACHE_STRATEGIES.LFU:
          // 按访问频率排序
          const sortedByFrequency = Array.from(cache.entries())
            .sort((a, b) => a[1].accessCount - b[1].accessCount);
          itemsToRemove.push(...sortedByFrequency.slice(0, Math.ceil(cache.size * 0.2)));
          break;
          
        case CACHE_STRATEGIES.SIZE_BASED:
          // 按大小排序，移除最大的
          const sortedBySize = Array.from(cache.entries())
            .sort((a, b) => b[1].size - a[1].size);
          itemsToRemove.push(...sortedBySize.slice(0, Math.ceil(cache.size * 0.1)));
          break;
          
        default:
          // FIFO - 移除最早的
          const sortedByTime = Array.from(cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
          itemsToRemove.push(...sortedByTime.slice(0, Math.ceil(cache.size * 0.2)));
      }
      
      // 移除选中的项目
      itemsToRemove.forEach(([key]) => {
        dispatch({ type: 'REMOVE_CACHE_ITEM', key });
      });
    }
  }, [state]);

  // 加载模型
  const loadModel = useCallback(async (url, options = {}) => {
    const cacheKey = generateCacheKey(url, options);
    
    // 检查缓存
    if (state.cache.has(cacheKey)) {
      const cachedItem = state.cache.get(cacheKey);
      
      // 检查是否过期
      if (Date.now() - cachedItem.timestamp < state.config.ttl) {
        // 更新访问信息
        cachedItem.lastAccessed = Date.now();
        cachedItem.accessCount++;
        
        dispatch({ 
          type: 'UPDATE_STATISTICS', 
          updates: { hitCount: state.statistics.hitCount + 1 }
        });
        
        return cachedItem.model.clone();
      } else {
        // 过期，移除
        dispatch({ type: 'REMOVE_CACHE_ITEM', key: cacheKey });
      }
    }
    
    // 检查是否正在加载
    if (state.loadingQueue.has(cacheKey)) {
      return await state.loadingQueue.get(cacheKey);
    }
    
    // 开始加载
    dispatch({ 
      type: 'UPDATE_STATISTICS', 
      updates: { 
        missCount: state.statistics.missCount + 1,
        loadCount: state.statistics.loadCount + 1
      }
    });
    
    const loadPromise = new Promise((resolve, reject) => {
      loaders.gltf.load(
        url,
        (gltf) => {
          try {
            const model = gltf.scene;
            const size = calculateModelSize(model);
            
            // 检查缓存容量
            checkCacheCapacity();
            
            // 缓存模型
            const cacheItem = {
              model: model.clone(),
              size,
              timestamp: Date.now(),
              lastAccessed: Date.now(),
              accessCount: 1,
              url,
              options,
              state: CACHE_STATES.LOADED
            };
            
            dispatch({ type: 'SET_CACHE_ITEM', key: cacheKey, item: cacheItem });
            dispatch({ type: 'REMOVE_LOADING', key: cacheKey });
            
            resolve(model);
          } catch (error) {
            console.error('模型处理失败:', error);
            dispatch({ 
              type: 'UPDATE_STATISTICS', 
              updates: { errorCount: state.statistics.errorCount + 1 }
            });
            dispatch({ type: 'REMOVE_LOADING', key: cacheKey });
            reject(error);
          }
        },
        (progress) => {
          // 加载进度
          if (options.onProgress) {
            options.onProgress(progress);
          }
        },
        (error) => {
          console.error('模型加载失败:', error);
          dispatch({ 
            type: 'UPDATE_STATISTICS', 
            updates: { errorCount: state.statistics.errorCount + 1 }
          });
          dispatch({ type: 'REMOVE_LOADING', key: cacheKey });
          reject(error);
        }
      );
    });
    
    dispatch({ type: 'SET_LOADING', key: cacheKey, promise: loadPromise });
    
    return loadPromise;
  }, [state, generateCacheKey, calculateModelSize, checkCacheCapacity]);

  // 预加载模型
  const preloadModel = useCallback(async (url, options = {}) => {
    if (!state.config.preloadEnabled) return;
    
    const cacheKey = generateCacheKey(url, options);
    
    // 如果已缓存或正在加载，跳过
    if (state.cache.has(cacheKey) || state.loadingQueue.has(cacheKey)) {
      return;
    }
    
    try {
      await loadModel(url, { ...options, priority: 'low' });
    } catch (error) {
      console.warn('预加载失败:', url, error);
    }
  }, [state, generateCacheKey, loadModel]);

  // 批量预加载
  const preloadModels = useCallback(async (urls) => {
    const promises = urls.map(url => {
      if (typeof url === 'string') {
        return preloadModel(url);
      } else {
        return preloadModel(url.url, url.options);
      }
    });
    
    await Promise.allSettled(promises);
  }, [preloadModel]);

  // 清理过期缓存
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    const expiredKeys = [];
    
    state.cache.forEach((item, key) => {
      if (now - item.timestamp > state.config.ttl) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      dispatch({ type: 'REMOVE_CACHE_ITEM', key });
    });
    
    return expiredKeys.length;
  }, [state]);

  // 获取缓存统计
  const getCacheStats = useCallback(() => {
    const hitRate = state.statistics.hitCount / (state.statistics.hitCount + state.statistics.missCount) || 0;
    
    return {
      ...state.statistics,
      hitRate: Math.round(hitRate * 100),
      cacheSize: state.cache.size,
      totalSizeMB: Math.round(state.statistics.totalSize / 1024 / 1024),
      maxSizeMB: Math.round(state.config.maxSize / 1024 / 1024)
    };
  }, [state]);

  // 清空缓存
  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, []);

  // 更新配置
  const updateConfig = useCallback((newConfig) => {
    dispatch({ type: 'SET_CONFIG', config: newConfig });
  }, []);

  // 定期清理
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredCache();
    }, 5 * 60 * 1000); // 每5分钟清理一次
    
    return () => clearInterval(interval);
  }, [cleanupExpiredCache]);

  const value = {
    // 状态
    cache: state.cache,
    statistics: state.statistics,
    config: state.config,
    
    // 方法
    loadModel,
    preloadModel,
    preloadModels,
    getCacheStats,
    clearCache,
    updateConfig,
    cleanupExpiredCache
  };

  return (
    <ModelCacheContext.Provider value={value}>
      {children}
    </ModelCacheContext.Provider>
  );
};

/**
 * 使用模型缓存的Hook
 */
export const useModelCache = () => {
  const context = useContext(ModelCacheContext);
  if (!context) {
    throw new Error('useModelCache must be used within a ModelCacheProvider');
  }
  return context;
};

/**
 * 模型缓存管理器组件
 */
export const ModelCacheManager = ({ children, config = {} }) => {
  return (
    <ModelCacheProvider>
      {children}
    </ModelCacheProvider>
  );
};

export default ModelCacheManager;

// 导出常量
export { CACHE_STATES, CACHE_STRATEGIES };