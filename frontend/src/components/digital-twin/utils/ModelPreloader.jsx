import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { useModelCache } from './ModelCacheManager';
import { CACHE_CONFIG } from './PerformanceConfig';

/**
 * 模型预加载管理器
 * 智能预加载可能需要的3D模型
 */

const ModelPreloaderContext = createContext();

export const ModelPreloaderProvider = ({ children }) => {
  const { gl, scene } = useThree();
  const { loadModel, preloadModel, getCacheStats } = useModelCache();
  const [preloadQueue, setPreloadQueue] = useState([]);
  const [preloadStats, setPreloadStats] = useState({
    total: 0,
    loaded: 0,
    failed: 0,
    progress: 0
  });
  const [isPreloading, setIsPreloading] = useState(false);
  const loadersRef = useRef({});
  const preloadingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // 初始化加载器
  useEffect(() => {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    const ktx2Loader = new KTX2Loader();

    // 配置DRACO解码器
    dracoLoader.setDecoderPath('/draco/');
    gltfLoader.setDRACOLoader(dracoLoader);

    // 配置KTX2解码器
    ktx2Loader.setTranscoderPath('/basis/');
    ktx2Loader.detectSupport(gl);
    gltfLoader.setKTX2Loader(ktx2Loader);

    loadersRef.current = {
      gltf: gltfLoader,
      draco: dracoLoader,
      ktx2: ktx2Loader
    };

    return () => {
      dracoLoader.dispose();
      ktx2Loader.dispose();
    };
  }, [gl]);

  // 添加模型到预加载队列
  const addToPreloadQueue = (models) => {
    const newModels = Array.isArray(models) ? models : [models];
    setPreloadQueue(prev => {
      const existing = new Set(prev.map(m => m.url));
      const filtered = newModels.filter(m => !existing.has(m.url));
      return [...prev, ...filtered];
    });
  };

  // 移除预加载队列中的模型
  const removeFromPreloadQueue = (urls) => {
    const urlsToRemove = Array.isArray(urls) ? urls : [urls];
    setPreloadQueue(prev => prev.filter(m => !urlsToRemove.includes(m.url)));
  };

  // 清空预加载队列
  const clearPreloadQueue = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setPreloadQueue([]);
    setPreloadStats({ total: 0, loaded: 0, failed: 0, progress: 0 });
    setIsPreloading(false);
  };

  // 开始预加载
  const startPreloading = async (options = {}) => {
    if (preloadingRef.current || preloadQueue.length === 0) {
      return;
    }

    const {
      maxConcurrent = 3,
      priority = 'normal',
      onProgress,
      onComplete,
      onError
    } = options;

    preloadingRef.current = true;
    setIsPreloading(true);
    abortControllerRef.current = new AbortController();

    const total = preloadQueue.length;
    let loaded = 0;
    let failed = 0;

    setPreloadStats({ total, loaded, failed, progress: 0 });

    // 按优先级排序
    const sortedQueue = [...preloadQueue].sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    });

    // 并发加载
    const loadPromises = [];
    const semaphore = new Array(maxConcurrent).fill(null);

    const loadNext = async (index) => {
      while (index < sortedQueue.length && !abortControllerRef.current?.signal.aborted) {
        const model = sortedQueue[index];
        index += maxConcurrent;

        try {
          await preloadModel(model.url, {
            priority: model.priority,
            signal: abortControllerRef.current.signal
          });
          loaded++;
        } catch (error) {
          if (error.name !== 'AbortError') {
            failed++;
            onError?.(error, model);
          }
        }

        const progress = (loaded + failed) / total;
        setPreloadStats({ total, loaded, failed, progress });
        onProgress?.(progress, loaded, failed, total);
      }
    };

    // 启动并发加载
    for (let i = 0; i < maxConcurrent; i++) {
      loadPromises.push(loadNext(i));
    }

    try {
      await Promise.all(loadPromises);
      onComplete?.(loaded, failed, total);
    } catch (error) {
      console.error('预加载过程中发生错误:', error);
    } finally {
      preloadingRef.current = false;
      setIsPreloading(false);
      abortControllerRef.current = null;
    }
  };

  // 停止预加载
  const stopPreloading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    preloadingRef.current = false;
    setIsPreloading(false);
  };

  // 智能预加载建议
  const getPreloadSuggestions = (currentPosition, viewDirection, buildings, devices) => {
    const suggestions = [];
    const preloadDistance = CACHE_CONFIG.preloadDistance;

    // 预加载附近的建筑物模型
    buildings?.forEach(building => {
      const distance = Math.sqrt(
        Math.pow(building.x - currentPosition.x, 2) +
        Math.pow(building.z - currentPosition.z, 2)
      );

      if (distance <= preloadDistance) {
        const priority = distance < preloadDistance / 2 ? 'high' : 'normal';
        suggestions.push({
          url: `/models/buildings/${building.type}.glb`,
          type: 'building',
          id: building.id,
          priority,
          distance
        });

        // 预加载不同LOD级别
        ['_lod1', '_lod2'].forEach(suffix => {
          suggestions.push({
            url: `/models/buildings/${building.type}${suffix}.glb`,
            type: 'building_lod',
            id: `${building.id}${suffix}`,
            priority: 'low',
            distance
          });
        });
      }
    });

    // 预加载附近的设备模型
    devices?.forEach(device => {
      const distance = Math.sqrt(
        Math.pow(device.x - currentPosition.x, 2) +
        Math.pow(device.z - currentPosition.z, 2)
      );

      if (distance <= preloadDistance / 2) {
        const priority = distance < preloadDistance / 4 ? 'high' : 'normal';
        suggestions.push({
          url: `/models/devices/${device.type}.glb`,
          type: 'device',
          id: device.id,
          priority,
          distance
        });
      }
    });

    // 按距离和优先级排序
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      return priorityDiff !== 0 ? priorityDiff : a.distance - b.distance;
    });
  };

  // 自动预加载
  const autoPreload = (currentPosition, viewDirection, buildings, devices) => {
    const suggestions = getPreloadSuggestions(currentPosition, viewDirection, buildings, devices);
    const cacheStats = getCacheStats();
    
    // 检查缓存容量
    const availableSpace = CACHE_CONFIG.maxSize - cacheStats.totalSize;
    const maxModels = Math.min(suggestions.length, Math.floor(availableSpace / 10)); // 假设每个模型平均10MB

    const modelsToPreload = suggestions.slice(0, maxModels);
    addToPreloadQueue(modelsToPreload);

    // 如果不在预加载中，自动开始
    if (!isPreloading && modelsToPreload.length > 0) {
      startPreloading({
        maxConcurrent: 2,
        priority: 'normal'
      });
    }
  };

  // 预加载常用模型
  const preloadCommonModels = () => {
    const commonModels = [
      { url: '/models/buildings/office.glb', type: 'building', priority: 'high' },
      { url: '/models/buildings/factory.glb', type: 'building', priority: 'high' },
      { url: '/models/buildings/warehouse.glb', type: 'building', priority: 'normal' },
      { url: '/models/devices/solar_panel.glb', type: 'device', priority: 'normal' },
      { url: '/models/devices/wind_turbine.glb', type: 'device', priority: 'normal' },
      { url: '/models/devices/battery.glb', type: 'device', priority: 'low' }
    ];

    addToPreloadQueue(commonModels);
  };

  // 获取预加载统计
  const getPreloadStats = () => {
    return {
      ...preloadStats,
      queueLength: preloadQueue.length,
      isPreloading,
      cacheStats: getCacheStats()
    };
  };

  const value = {
    // 队列管理
    addToPreloadQueue,
    removeFromPreloadQueue,
    clearPreloadQueue,
    preloadQueue,

    // 预加载控制
    startPreloading,
    stopPreloading,
    isPreloading,

    // 智能预加载
    getPreloadSuggestions,
    autoPreload,
    preloadCommonModels,

    // 统计信息
    getPreloadStats,
    preloadStats
  };

  return (
    <ModelPreloaderContext.Provider value={value}>
      {children}
    </ModelPreloaderContext.Provider>
  );
};

export const useModelPreloader = () => {
  const context = useContext(ModelPreloaderContext);
  if (!context) {
    throw new Error('useModelPreloader must be used within a ModelPreloaderProvider');
  }
  return context;
};

// 预加载控制面板组件
export const PreloadControlPanel = ({ className = '' }) => {
  const {
    preloadStats,
    isPreloading,
    startPreloading,
    stopPreloading,
    clearPreloadQueue,
    preloadCommonModels,
    getPreloadStats
  } = useModelPreloader();

  const [stats, setStats] = useState(getPreloadStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getPreloadStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [getPreloadStats]);

  return (
    <div className={`preload-control-panel ${className}`} style={{
      position: 'fixed',
      top: '120px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      minWidth: '250px',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>模型预加载</h4>
      
      {/* 预加载统计 */}
      <div style={{ marginBottom: '10px' }}>
        <div>队列长度: {stats.queueLength}</div>
        <div>已加载: {stats.loaded}/{stats.total}</div>
        <div>失败: {stats.failed}</div>
        <div>进度: {(stats.progress * 100).toFixed(1)}%</div>
        {stats.progress > 0 && (
          <div style={{
            width: '100%',
            height: '4px',
            background: '#333',
            borderRadius: '2px',
            marginTop: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${stats.progress * 100}%`,
              height: '100%',
              background: '#4CAF50',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>

      {/* 缓存统计 */}
      <div style={{ marginBottom: '10px', fontSize: '11px', opacity: 0.8 }}>
        <div>缓存: {stats.cacheStats.itemCount} 项</div>
        <div>大小: {(stats.cacheStats.totalSize / 1024 / 1024).toFixed(1)}MB</div>
        <div>命中率: {(stats.cacheStats.hitRate * 100).toFixed(1)}%</div>
      </div>

      {/* 控制按钮 */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button
          onClick={() => preloadCommonModels()}
          style={{
            padding: '4px 8px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          预加载常用
        </button>
        
        {isPreloading ? (
          <button
            onClick={stopPreloading}
            style={{
              padding: '4px 8px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            停止
          </button>
        ) : (
          <button
            onClick={() => startPreloading()}
            disabled={stats.queueLength === 0}
            style={{
              padding: '4px 8px',
              background: stats.queueLength > 0 ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: stats.queueLength > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            开始
          </button>
        )}
        
        <button
          onClick={clearPreloadQueue}
          style={{
            padding: '4px 8px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          清空
        </button>
      </div>
    </div>
  );
};

export default ModelPreloaderProvider;