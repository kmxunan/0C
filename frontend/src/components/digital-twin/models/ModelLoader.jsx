import React, { useRef, useEffect, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
// import { useModelQuality } from '../utils/ModelQualityManager';
// import { usePerformanceOptimizer } from '../utils/PerformanceOptimizer';
import modelQualityConfig from '../utils/modelQualityConfig';
import { useModelOptimizer } from '../utils/ModelOptimizer';

/**
 * GLTF模型加载器组件
 * 支持Draco压缩、模型缓存和LOD系统
 */
class ModelCache {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
  }

  async loadModel(url, options = {}) {
    // 检查缓存
    if (this.cache.has(url)) {
      return this.cache.get(url).clone();
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    // 创建加载Promise
    const loadingPromise = this.createLoader(options).loadAsync(url)
      .then(gltf => {
        // 缓存模型
        this.cache.set(url, gltf.scene);
        this.loadingPromises.delete(url);
        return gltf.scene.clone();
      })
      .catch(error => {
        this.loadingPromises.delete(url);
        throw error;
      });

    this.loadingPromises.set(url, loadingPromise);
    return loadingPromise;
  }

  createLoader(options = {}) {
    const loader = new GLTFLoader();
    
    // 配置Draco解码器
    if (options.useDraco !== false) {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      loader.setDRACOLoader(dracoLoader);
    }

    return loader;
  }

  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }
}

// 全局模型缓存实例
const modelCache = new ModelCache();

/**
 * 增强的LOD管理器
 */
class LODManager {
  constructor() {
    this.lodLevels = {
      high: { distance: 50, suffix: '_lod0', quality: 1.0 },
      medium: { distance: 100, suffix: '_lod1', quality: 0.6 },
      low: { distance: 200, suffix: '_lod2', quality: 0.3 }
    };
    this.performanceMode = false;
    this.lastUpdateTime = 0;
    this.updateInterval = 1000; // 1秒更新一次
  }

  setPerformanceMode(enabled) {
    this.performanceMode = enabled;
    if (enabled) {
      // 性能模式下调整距离阈值
      this.lodLevels.high.distance = 30;
      this.lodLevels.medium.distance = 60;
      this.lodLevels.low.distance = 120;
    } else {
      // 恢复默认距离
      this.lodLevels.high.distance = 50;
      this.lodLevels.medium.distance = 100;
      this.lodLevels.low.distance = 200;
    }
  }

  getLODLevel(distance, frameRate = 60) {
    // 根据帧率动态调整LOD
    const performanceFactor = frameRate < 30 ? 0.7 : frameRate < 45 ? 0.85 : 1.0;
    const adjustedDistance = distance / performanceFactor;
    
    if (adjustedDistance <= this.lodLevels.high.distance) return 'high';
    if (adjustedDistance <= this.lodLevels.medium.distance) return 'medium';
    return 'low';
  }

  getLODModelUrl(baseUrl, lodLevel) {
    const suffix = this.lodLevels[lodLevel]?.suffix || '';
    return baseUrl.replace('.glb', `${suffix}.glb`).replace('.gltf', `${suffix}.gltf`);
  }

  shouldUpdateLOD() {
    const now = Date.now();
    if (now - this.lastUpdateTime > this.updateInterval) {
      this.lastUpdateTime = now;
      return true;
    }
    return false;
  }

  getQualityFactor(lodLevel) {
    return this.lodLevels[lodLevel]?.quality || 1.0;
  }
}

const lodManager = new LODManager();

/**
 * ModelLoader组件
 */
const ModelLoader = ({ 
  url, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = [1, 1, 1],
  enableLOD = true,
  cameraPosition = [0, 0, 0],
  useDraco = true,
  performanceMode = false,
  onLoad,
  onError,
  onLODChange,
  fallbackGeometry,
  qualityLevel = 'medium',
  enableOptimization = true,
  ...props 
}) => {
  const groupRef = useRef();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLOD, setCurrentLOD] = useState('high');
  const [frameRate, setFrameRate] = useState(60);
  const [optimizedModel, setOptimizedModel] = useState(null);
  const frameTimeRef = useRef(Date.now());
  const { optimizeModel, isOptimizing } = useModelOptimizer();

  // 性能监控
  const updateFrameRate = () => {
    const now = Date.now();
    const deltaTime = now - frameTimeRef.current;
    if (deltaTime > 0) {
      const currentFPS = 1000 / deltaTime;
      setFrameRate(prev => prev * 0.9 + currentFPS * 0.1); // 平滑处理
    }
    frameTimeRef.current = now;
  };

  // 计算距离和LOD级别
  const calculateDistance = () => {
    if (!enableLOD || !groupRef.current) return 0;
    
    const modelPosition = new THREE.Vector3(...position);
    const cameraPos = new THREE.Vector3(...cameraPosition);
    return modelPosition.distanceTo(cameraPos);
  };

  // 设置性能模式
  useEffect(() => {
    lodManager.setPerformanceMode(performanceMode);
  }, [performanceMode]);

  // 加载模型
  const loadModel = async (modelUrl) => {
    try {
      setLoading(true);
      setError(null);
      
      // 检查缓存
      const cacheKey = `${modelUrl}_${qualityLevel}_${enableOptimization}`;
      const cachedModel = modelCache.cache.get(cacheKey);
      if (cachedModel) {
        setModel(cachedModel.originalModel || cachedModel);
        setOptimizedModel(cachedModel);
        setLoading(false);
        onLoad?.(cachedModel.originalModel || cachedModel);
        return;
      }
      
      const loadedModel = await modelCache.loadModel(modelUrl, { useDraco });
      
      // 基础优化模型
      optimizeModelBasic(loadedModel);
      
      setModel(loadedModel);
      
      // 高级优化（如果启用）
      if (enableOptimization) {
        try {
          const optimizationResult = await optimizeModel(modelUrl, {
            qualityLevel,
            generateLOD: enableLOD,
            compressTextures: true,
            simplifyGeometry: true
          });
          
          setOptimizedModel(optimizationResult);
          modelCache.cache.set(cacheKey, optimizationResult);
          console.log('模型优化完成:', optimizationResult.originalStats);
        } catch (optimizationError) {
          console.warn('模型优化失败，使用原始模型:', optimizationError);
          modelCache.cache.set(cacheKey, loadedModel);
        }
      } else {
        modelCache.cache.set(cacheKey, loadedModel);
      }
      
      onLoad?.(loadedModel);
    } catch (err) {
      console.error('模型加载失败:', err);
      setError(err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  // 基础优化模型性能
  const optimizeModelBasic = (model) => {
    model.traverse((child) => {
      if (child.isMesh) {
        // 启用阴影
        child.castShadow = true;
        child.receiveShadow = true;
        
        // 优化材质
        if (child.material) {
          child.material.needsUpdate = true;
          
          // 如果是数组材质
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.needsUpdate = true;
            });
          }
        }
        
        // 优化几何体
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
      }
    });
  };

  // 初始加载
  useEffect(() => {
    if (!url) return;
    
    const distance = calculateDistance();
    const lodLevel = enableLOD ? lodManager.getLODLevel(distance, frameRate) : 'high';
    const modelUrl = enableLOD ? lodManager.getLODModelUrl(url, lodLevel) : url;
    
    setCurrentLOD(lodLevel);
    loadModel(modelUrl);
  }, [url, enableLOD, useDraco, calculateDistance, frameRate, loadModel]);

  // 智能LOD更新
  useEffect(() => {
    if (!enableLOD || !url) return;
    
    const updateLOD = () => {
      updateFrameRate();
      
      // 只在需要时更新LOD
      if (!lodManager.shouldUpdateLOD()) return;
      
      const distance = calculateDistance();
      
      // 使用模型质量配置获取LOD级别
      const qualityLevel = modelQualityConfig.getRecommendedQuality({
        fps: frameRate,
        triangleCount: 50000,
        memoryUsage: 512
      });
      
      // const lodLevel = modelQualityConfig.getLODLevel(distance, qualityLevel);
      const newLODLevel = lodManager.getLODLevel(distance, frameRate);
      
      if (newLODLevel !== currentLOD) {
        const newModelUrl = lodManager.getLODModelUrl(url, newLODLevel);
        setCurrentLOD(newLODLevel);
        loadModel(newModelUrl);
        
        // 通知LOD变化
        onLODChange?.({
          level: newLODLevel,
          distance,
          frameRate,
          quality: lodManager.getQualityFactor(newLODLevel)
        });
      }
    };

    // 根据性能调整更新频率
    const updateInterval = frameRate < 30 ? 2000 : frameRate < 45 ? 1500 : 1000;
    const interval = setInterval(updateLOD, updateInterval);
    return () => clearInterval(interval);
  }, [url, currentLOD, enableLOD, cameraPosition, frameRate, calculateDistance, loadModel, onLODChange]);

  // 渲染加载状态
  if (loading || isOptimizing) {
    return (
      <group ref={groupRef} position={position} rotation={rotation} scale={scale} {...props}>
        {/* 加载占位符 */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={isOptimizing ? "#ffa502" : "#cccccc"} 
            transparent 
            opacity={0.5} 
          />
        </mesh>
      </group>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <group ref={groupRef} position={position} rotation={rotation} scale={scale} {...props}>
        {/* 错误回退几何体 */}
        {fallbackGeometry || (
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ff6b6b" />
          </mesh>
        )}
      </group>
    );
  }

  // 渲染模型
  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} {...props}>
      {model && (
        <primitive object={
          optimizedModel?.lodModels?.[currentLOD] || model
        } />
      )}
    </group>
  );
};

// 导出工具函数
export { modelCache, lodManager };
export default ModelLoader;