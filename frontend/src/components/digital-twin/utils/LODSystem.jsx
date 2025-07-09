import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier';

/**
 * LOD（Level of Detail）系统管理器
 * 提供基于距离和性能的自动模型细节调整功能
 */

// LOD级别定义
const LOD_LEVELS = {
  ULTRA: { level: 0, distance: 0, quality: 1.0, name: '超高' },
  HIGH: { level: 1, distance: 50, quality: 0.8, name: '高' },
  MEDIUM: { level: 2, distance: 100, quality: 0.6, name: '中' },
  LOW: { level: 3, distance: 200, quality: 0.4, name: '低' },
  MINIMAL: { level: 4, distance: 500, quality: 0.2, name: '最低' }
};

// LOD策略
const LOD_STRATEGIES = {
  DISTANCE_BASED: 'distance_based', // 基于距离
  PERFORMANCE_BASED: 'performance_based', // 基于性能
  HYBRID: 'hybrid', // 混合策略
  MANUAL: 'manual' // 手动控制
};

// 初始状态
const initialState = {
  objects: new Map(), // LOD对象映射
  camera: null, // 相机引用
  strategy: LOD_STRATEGIES.HYBRID,
  config: {
    updateInterval: 100, // 更新间隔(ms)
    hysteresis: 0.1, // 滞后系数，防止频繁切换
    performanceTarget: 60, // 目标FPS
    adaptiveEnabled: true, // 自适应启用
    debugMode: false // 调试模式
  },
  performance: {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    triangleCount: 0
  },
  statistics: {
    totalObjects: 0,
    activeObjects: 0,
    lodSwitches: 0,
    performanceGains: 0
  }
};

// Reducer
const lodReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_OBJECT':
      return {
        ...state,
        objects: new Map(state.objects).set(action.id, action.object),
        statistics: {
          ...state.statistics,
          totalObjects: state.statistics.totalObjects + 1
        }
      };

    case 'REMOVE_OBJECT':
      const newObjects = new Map(state.objects);
      newObjects.delete(action.id);
      return {
        ...state,
        objects: newObjects,
        statistics: {
          ...state.statistics,
          totalObjects: state.statistics.totalObjects - 1
        }
      };

    case 'UPDATE_OBJECT':
      const updatedObjects = new Map(state.objects);
      const existingObject = updatedObjects.get(action.id);
      if (existingObject) {
        updatedObjects.set(action.id, { ...existingObject, ...action.updates });
      }
      return {
        ...state,
        objects: updatedObjects
      };

    case 'SET_CAMERA':
      return {
        ...state,
        camera: action.camera
      };

    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performance: {
          ...state.performance,
          ...action.metrics
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

    case 'SET_STRATEGY':
      return {
        ...state,
        strategy: action.strategy
      };

    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.config
        }
      };

    default:
      return state;
  }
};

// Context
const LODContext = createContext();

/**
 * LOD系统提供者组件
 */
export const LODProvider = ({ children }) => {
  const [state, dispatch] = useReducer(lodReducer, initialState);
  const updateIntervalRef = useRef();
  const simplifyModifier = useRef(new SimplifyModifier());

  // 计算距离
  const calculateDistance = useCallback((object, camera) => {
    if (!camera || !object.position) return Infinity;
    
    const objectPosition = object.position;
    const cameraPosition = camera.position;
    
    return objectPosition.distanceTo(cameraPosition);
  }, []);

  // 根据距离获取LOD级别
  const getLODLevelByDistance = useCallback((distance) => {
    const levels = Object.values(LOD_LEVELS).sort((a, b) => a.distance - b.distance);
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (distance >= levels[i].distance) {
        return levels[i];
      }
    }
    
    return levels[0]; // 返回最高质量
  }, []);

  // 根据性能获取LOD级别
  const getLODLevelByPerformance = useCallback(() => {
    const { fps, triangleCount } = state.performance;
    const { performanceTarget } = state.config;
    
    if (fps >= performanceTarget) {
      // 性能良好，可以提升质量
      if (triangleCount < 100000) return LOD_LEVELS.ULTRA;
      if (triangleCount < 200000) return LOD_LEVELS.HIGH;
      return LOD_LEVELS.MEDIUM;
    } else if (fps >= performanceTarget * 0.8) {
      // 性能一般
      return LOD_LEVELS.MEDIUM;
    } else if (fps >= performanceTarget * 0.6) {
      // 性能较差
      return LOD_LEVELS.LOW;
    } else {
      // 性能很差
      return LOD_LEVELS.MINIMAL;
    }
  }, [state.performance, state.config]);

  // 混合策略获取LOD级别
  const getLODLevelHybrid = useCallback((distance) => {
    const distanceLOD = getLODLevelByDistance(distance);
    const performanceLOD = getLODLevelByPerformance();
    
    // 选择更保守的LOD级别（更低的质量）
    return distanceLOD.level > performanceLOD.level ? distanceLOD : performanceLOD;
  }, [getLODLevelByDistance, getLODLevelByPerformance]);

  // 创建简化几何体
  const createSimplifiedGeometry = useCallback((originalGeometry, quality) => {
    if (!originalGeometry || quality >= 1.0) {
      return originalGeometry;
    }
    
    try {
      // 克隆原始几何体
      const geometry = originalGeometry.clone();
      
      // 计算目标三角形数量
      const originalTriangles = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
      const targetTriangles = Math.max(1, Math.floor(originalTriangles * quality));
      
      // 使用SimplifyModifier简化
      const simplified = simplifyModifier.current.modify(geometry, targetTriangles);
      
      return simplified;
    } catch (error) {
      console.warn('几何体简化失败:', error);
      return originalGeometry;
    }
  }, []);

  // 创建LOD模型
  const createLODModel = useCallback((originalModel, lodLevels = Object.values(LOD_LEVELS)) => {
    const lodGroup = new THREE.LOD();
    
    lodLevels.forEach((level) => {
      const modelClone = originalModel.clone();
      
      // 遍历模型中的所有网格
      modelClone.traverse((child) => {
        if (child.isMesh && child.geometry) {
          // 简化几何体
          const simplifiedGeometry = createSimplifiedGeometry(child.geometry, level.quality);
          child.geometry = simplifiedGeometry;
          
          // 调整材质
          if (child.material) {
            const material = child.material.clone();
            
            // 根据LOD级别调整材质质量
            if (level.quality < 0.8) {
              // 降低纹理分辨率
              if (material.map) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const originalSize = Math.max(material.map.image.width, material.map.image.height);
                const newSize = Math.max(64, Math.floor(originalSize * level.quality));
                
                canvas.width = newSize;
                canvas.height = newSize;
                ctx.drawImage(material.map.image, 0, 0, newSize, newSize);
                
                const newTexture = new THREE.CanvasTexture(canvas);
                newTexture.wrapS = material.map.wrapS;
                newTexture.wrapT = material.map.wrapT;
                newTexture.minFilter = THREE.LinearFilter;
                newTexture.magFilter = THREE.LinearFilter;
                
                material.map = newTexture;
              }
              
              // 简化材质属性
              if (level.quality < 0.5) {
                material.normalMap = null;
                material.roughnessMap = null;
                material.metalnessMap = null;
              }
            }
            
            child.material = material;
          }
        }
      });
      
      lodGroup.addLevel(modelClone, level.distance);
    });
    
    return lodGroup;
  }, [createSimplifiedGeometry]);

  // 注册LOD对象
  const registerObject = useCallback((id, object, options = {}) => {
    const lodObject = {
      id,
      object,
      originalObject: object.clone(),
      currentLOD: LOD_LEVELS.ULTRA,
      lastDistance: 0,
      lastUpdate: Date.now(),
      options: {
        enabled: true,
        minLOD: LOD_LEVELS.MINIMAL,
        maxLOD: LOD_LEVELS.ULTRA,
        ...options
      }
    };
    
    // 如果对象不是LOD对象，创建LOD版本
    if (!object.isLOD) {
      const lodModel = createLODModel(object);
      lodObject.lodModel = lodModel;
    }
    
    dispatch({ type: 'ADD_OBJECT', id, object: lodObject });
    
    return lodObject;
  }, [createLODModel]);

  // 注销LOD对象
  const unregisterObject = useCallback((id) => {
    dispatch({ type: 'REMOVE_OBJECT', id });
  }, []);

  // 更新对象LOD
  const updateObjectLOD = useCallback((id, forceLOD = null) => {
    const lodObject = state.objects.get(id);
    if (!lodObject || !lodObject.options.enabled) return;
    
    const { camera, strategy, config } = state;
    if (!camera) return;
    
    let targetLOD;
    
    if (forceLOD) {
      targetLOD = forceLOD;
    } else {
      const distance = calculateDistance(lodObject.object, camera);
      
      switch (strategy) {
        case LOD_STRATEGIES.DISTANCE_BASED:
          targetLOD = getLODLevelByDistance(distance);
          break;
        case LOD_STRATEGIES.PERFORMANCE_BASED:
          targetLOD = getLODLevelByPerformance();
          break;
        case LOD_STRATEGIES.HYBRID:
          targetLOD = getLODLevelHybrid(distance);
          break;
        default:
          return; // 手动模式不自动更新
      }
    }
    
    // 应用滞后，防止频繁切换
    const distanceChange = Math.abs(lodObject.lastDistance - calculateDistance(lodObject.object, camera));
    const hysteresisThreshold = config.hysteresis * targetLOD.distance;
    
    if (targetLOD.level !== lodObject.currentLOD.level && distanceChange > hysteresisThreshold) {
      // 更新LOD
      if (lodObject.lodModel) {
        lodObject.lodModel.update(camera);
      }
      
      dispatch({
        type: 'UPDATE_OBJECT',
        id,
        updates: {
          currentLOD: targetLOD,
          lastDistance: calculateDistance(lodObject.object, camera),
          lastUpdate: Date.now()
        }
      });
      
      dispatch({
        type: 'UPDATE_STATISTICS',
        updates: {
          lodSwitches: state.statistics.lodSwitches + 1
        }
      });
      
      // 触发LOD变化回调
      if (lodObject.options.onLODChange) {
        lodObject.options.onLODChange(targetLOD, lodObject.currentLOD);
      }
    }
  }, [state, calculateDistance, getLODLevelByDistance, getLODLevelByPerformance, getLODLevelHybrid]);

  // 更新所有对象
  const updateAllObjects = useCallback(() => {
    state.objects.forEach((_, id) => {
      updateObjectLOD(id);
    });
    
    dispatch({
      type: 'UPDATE_STATISTICS',
      updates: {
        activeObjects: Array.from(state.objects.values()).filter(obj => obj.options.enabled).length
      }
    });
  }, [state.objects, updateObjectLOD]);

  // 设置相机
  const setCamera = useCallback((camera) => {
    dispatch({ type: 'SET_CAMERA', camera });
  }, []);

  // 更新性能指标
  const updatePerformance = useCallback((metrics) => {
    dispatch({ type: 'UPDATE_PERFORMANCE', metrics });
  }, []);

  // 设置策略
  const setStrategy = useCallback((strategy) => {
    dispatch({ type: 'SET_STRATEGY', strategy });
  }, []);

  // 更新配置
  const updateConfig = useCallback((config) => {
    dispatch({ type: 'UPDATE_CONFIG', config });
  }, []);

  // 获取对象信息
  const getObjectInfo = useCallback((id) => {
    return state.objects.get(id);
  }, [state.objects]);

  // 获取统计信息
  const getStatistics = useCallback(() => {
    const objects = Array.from(state.objects.values());
    const lodDistribution = {};
    
    Object.values(LOD_LEVELS).forEach(level => {
      lodDistribution[level.name] = objects.filter(obj => obj.currentLOD.level === level.level).length;
    });
    
    return {
      ...state.statistics,
      lodDistribution,
      averageLOD: objects.reduce((sum, obj) => sum + obj.currentLOD.level, 0) / objects.length || 0
    };
  }, [state]);

  // 强制设置LOD级别
  const setObjectLOD = useCallback((id, lodLevel) => {
    updateObjectLOD(id, lodLevel);
  }, [updateObjectLOD]);

  // 启动自动更新
  useEffect(() => {
    if (state.config.adaptiveEnabled) {
      updateIntervalRef.current = setInterval(() => {
        updateAllObjects();
      }, state.config.updateInterval);
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [state.config.adaptiveEnabled, state.config.updateInterval, updateAllObjects]);

  const value = {
    // 状态
    objects: state.objects,
    camera: state.camera,
    strategy: state.strategy,
    config: state.config,
    performance: state.performance,
    statistics: state.statistics,
    
    // 方法
    registerObject,
    unregisterObject,
    updateObjectLOD,
    updateAllObjects,
    setCamera,
    updatePerformance,
    setStrategy,
    updateConfig,
    getObjectInfo,
    getStatistics,
    setObjectLOD,
    createLODModel,
    
    // 常量
    LOD_LEVELS,
    LOD_STRATEGIES
  };

  return (
    <LODContext.Provider value={value}>
      {children}
    </LODContext.Provider>
  );
};

/**
 * 使用LOD系统的Hook
 */
export const useLODSystem = () => {
  const context = useContext(LODContext);
  if (!context) {
    throw new Error('useLODSystem must be used within a LODProvider');
  }
  return context;
};

/**
 * LOD对象Hook
 */
export const useLODObject = (id, object, options = {}) => {
  const { registerObject, unregisterObject, getObjectInfo, updateObjectLOD } = useLODSystem();
  
  useEffect(() => {
    if (object) {
      registerObject(id, object, options);
    }
    
    return () => {
      unregisterObject(id);
    };
  }, [id, object, registerObject, unregisterObject]);
  
  const objectInfo = getObjectInfo(id);
  
  return {
    currentLOD: objectInfo?.currentLOD,
    updateLOD: (forceLOD) => updateObjectLOD(id, forceLOD),
    isRegistered: !!objectInfo
  };
};

export default LODProvider;

// 导出常量
export { LOD_LEVELS, LOD_STRATEGIES };