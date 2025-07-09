import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

/**
 * 性能优化器上下文
 */
const PerformanceOptimizerContext = createContext();

/**
 * 性能指标收集器
 */
class PerformanceMetrics {
  constructor() {
    this.fps = 60;
    this.frameTime = 16.67;
    this.triangleCount = 0;
    this.drawCalls = 0;
    this.memoryUsage = 0;
    this.gpuMemoryUsage = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsHistory = [];
    this.maxHistoryLength = 60; // 保存60帧的历史数据
  }

  update(renderer) {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    
    // 更新FPS
    this.frameTime = deltaTime;
    this.fps = 1000 / deltaTime;
    
    // 更新FPS历史
    this.fpsHistory.push(this.fps);
    if (this.fpsHistory.length > this.maxHistoryLength) {
      this.fpsHistory.shift();
    }
    
    // 更新渲染统计
    if (renderer && renderer.info) {
      this.triangleCount = renderer.info.render.triangles;
      this.drawCalls = renderer.info.render.calls;
    }
    
    // 更新内存使用情况
    if (performance.memory) {
      this.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
  }

  getAverageFPS() {
    if (this.fpsHistory.length === 0) return this.fps;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }

  getPerformanceLevel() {
    const avgFPS = this.getAverageFPS();
    if (avgFPS >= 55) return 'excellent';
    if (avgFPS >= 45) return 'good';
    if (avgFPS >= 30) return 'fair';
    return 'poor';
  }

  shouldOptimize() {
    const avgFPS = this.getAverageFPS();
    return avgFPS < 45 || this.triangleCount > 100000 || this.memoryUsage > 512;
  }
}

/**
 * 性能优化策略管理器
 */
class OptimizationStrategy {
  constructor() {
    this.strategies = {
      // LOD优化策略
      lod: {
        enabled: true,
        aggressiveness: 1.0, // 0.5 = 温和, 1.0 = 标准, 1.5 = 激进
        distanceMultiplier: 1.0
      },
      
      // 阴影优化策略
      shadows: {
        enabled: true,
        quality: 'high', // low, medium, high
        cascadeCount: 3,
        maxDistance: 100
      },
      
      // 后处理优化策略
      postProcessing: {
        enabled: true,
        effects: ['bloom', 'ssao', 'fxaa'],
        quality: 'medium'
      },
      
      // 纹理优化策略
      textures: {
        maxSize: 1024,
        compression: true,
        mipmaps: true,
        anisotropy: 4
      },
      
      // 几何体优化策略
      geometry: {
        simplification: false,
        merging: true,
        instancing: true
      }
    };
  }

  updateStrategy(performanceLevel, metrics) {
    switch (performanceLevel) {
      case 'poor':
        this.applyAggressiveOptimization();
        break;
      case 'fair':
        this.applyModerateOptimization();
        break;
      case 'good':
        this.applyLightOptimization();
        break;
      case 'excellent':
        this.applyMinimalOptimization();
        break;
    }
  }

  applyAggressiveOptimization() {
    this.strategies.lod.aggressiveness = 1.8;
    this.strategies.lod.distanceMultiplier = 0.6;
    this.strategies.shadows.quality = 'low';
    this.strategies.shadows.maxDistance = 50;
    this.strategies.postProcessing.quality = 'low';
    this.strategies.postProcessing.effects = ['fxaa'];
    this.strategies.textures.maxSize = 512;
    this.strategies.textures.anisotropy = 1;
    this.strategies.geometry.simplification = true;
  }

  applyModerateOptimization() {
    this.strategies.lod.aggressiveness = 1.3;
    this.strategies.lod.distanceMultiplier = 0.8;
    this.strategies.shadows.quality = 'medium';
    this.strategies.shadows.maxDistance = 75;
    this.strategies.postProcessing.quality = 'medium';
    this.strategies.postProcessing.effects = ['bloom', 'fxaa'];
    this.strategies.textures.maxSize = 1024;
    this.strategies.textures.anisotropy = 2;
    this.strategies.geometry.simplification = false;
  }

  applyLightOptimization() {
    this.strategies.lod.aggressiveness = 1.1;
    this.strategies.lod.distanceMultiplier = 0.9;
    this.strategies.shadows.quality = 'high';
    this.strategies.shadows.maxDistance = 100;
    this.strategies.postProcessing.quality = 'high';
    this.strategies.postProcessing.effects = ['bloom', 'ssao', 'fxaa'];
    this.strategies.textures.maxSize = 1024;
    this.strategies.textures.anisotropy = 4;
    this.strategies.geometry.simplification = false;
  }

  applyMinimalOptimization() {
    this.strategies.lod.aggressiveness = 1.0;
    this.strategies.lod.distanceMultiplier = 1.0;
    this.strategies.shadows.quality = 'high';
    this.strategies.shadows.maxDistance = 150;
    this.strategies.postProcessing.quality = 'high';
    this.strategies.postProcessing.effects = ['bloom', 'ssao', 'fxaa'];
    this.strategies.textures.maxSize = 2048;
    this.strategies.textures.anisotropy = 8;
    this.strategies.geometry.simplification = false;
  }

  getStrategy(type) {
    return this.strategies[type] || {};
  }
}

/**
 * 模型注册管理器
 */
class ModelRegistry {
  constructor() {
    this.models = new Map();
    this.totalTriangles = 0;
    this.visibleTriangles = 0;
  }

  registerModel(id, modelData) {
    this.models.set(id, {
      ...modelData,
      triangleCount: modelData.triangleCount || 0,
      boundingBox: modelData.boundingBox || new THREE.Box3(),
      visible: true,
      lodLevel: 'high'
    });
    this.updateTriangleCounts();
  }

  unregisterModel(id) {
    this.models.delete(id);
    this.updateTriangleCounts();
  }

  updateModel(id, updates) {
    const model = this.models.get(id);
    if (model) {
      Object.assign(model, updates);
      this.updateTriangleCounts();
    }
  }

  updateTriangleCounts() {
    this.totalTriangles = 0;
    this.visibleTriangles = 0;
    
    for (const model of this.models.values()) {
      this.totalTriangles += model.triangleCount;
      if (model.visible) {
        this.visibleTriangles += model.triangleCount;
      }
    }
  }

  getModels() {
    return Array.from(this.models.entries()).map(([id, data]) => ({ id, ...data }));
  }

  getTriangleCounts() {
    return {
      total: this.totalTriangles,
      visible: this.visibleTriangles
    };
  }
}

/**
 * 性能优化器提供者组件
 */
export const PerformanceOptimizerProvider = ({ children }) => {
  const metricsRef = useRef(new PerformanceMetrics());
  const strategyRef = useRef(new OptimizationStrategy());
  const registryRef = useRef(new ModelRegistry());
  const [performanceData, setPerformanceData] = useState({
    fps: 60,
    frameTime: 16.67,
    triangleCount: 0,
    memoryUsage: 0,
    performanceLevel: 'excellent'
  });

  // 性能监控循环
  useEffect(() => {
    const updatePerformance = () => {
      const metrics = metricsRef.current;
      const strategy = strategyRef.current;
      const registry = registryRef.current;
      
      // 更新性能指标
      metrics.update();
      
      // 获取当前性能级别
      const performanceLevel = metrics.getPerformanceLevel();
      
      // 更新优化策略
      strategy.updateStrategy(performanceLevel, metrics);
      
      // 更新状态
      setPerformanceData({
        fps: metrics.getAverageFPS(),
        frameTime: metrics.frameTime,
        triangleCount: registry.visibleTriangles,
        memoryUsage: metrics.memoryUsage,
        performanceLevel
      });
    };

    const interval = setInterval(updatePerformance, 1000);
    return () => clearInterval(interval);
  }, []);

  // 注册模型
  const registerModel = useCallback((id, modelData) => {
    registryRef.current.registerModel(id, modelData);
  }, []);

  // 注销模型
  const unregisterModel = useCallback((id) => {
    registryRef.current.unregisterModel(id);
  }, []);

  // 更新模型
  const updateModel = useCallback((id, updates) => {
    registryRef.current.updateModel(id, updates);
  }, []);

  // 获取优化策略
  const getOptimizationStrategy = useCallback((type) => {
    return strategyRef.current.getStrategy(type);
  }, []);

  // 获取性能指标
  const getPerformanceMetrics = useCallback(() => {
    return {
      ...performanceData,
      shouldOptimize: metricsRef.current.shouldOptimize(),
      triangleCounts: registryRef.current.getTriangleCounts()
    };
  }, [performanceData]);

  const value = {
    performanceData,
    registerModel,
    unregisterModel,
    updateModel,
    getOptimizationStrategy,
    getPerformanceMetrics
  };

  return (
    <PerformanceOptimizerContext.Provider value={value}>
      {children}
    </PerformanceOptimizerContext.Provider>
  );
};

/**
 * 性能优化器钩子
 */
export const usePerformanceOptimizer = () => {
  const context = useContext(PerformanceOptimizerContext);
  if (!context) {
    throw new Error('usePerformanceOptimizer must be used within a PerformanceOptimizerProvider');
  }
  return context;
};

/**
 * 性能监控组件
 */
export const PerformanceMonitor = ({ position = 'top-right', expanded = false }) => {
  const { performanceData, getPerformanceMetrics } = usePerformanceOptimizer();
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getPerformanceMetrics());
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [getPerformanceMetrics]);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 10000,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px',
      cursor: 'pointer'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '10px', left: '10px' };
      case 'top-right':
        return { ...baseStyles, top: '10px', right: '10px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '10px', left: '10px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '10px', right: '10px' };
      default:
        return { ...baseStyles, top: '10px', right: '10px' };
    }
  };

  const getPerformanceColor = (level) => {
    switch (level) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#ffffff';
    }
  };

  if (!metrics) return null;

  return (
    <div 
      style={getPositionStyles()} 
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div style={{ color: getPerformanceColor(performanceData.performanceLevel) }}>
        FPS: {Math.round(performanceData.fps)}
      </div>
      
      {isExpanded && (
        <div style={{ marginTop: '8px', fontSize: '11px' }}>
          <div>Frame Time: {performanceData.frameTime.toFixed(1)}ms</div>
          <div>Triangles: {metrics.triangleCounts.visible.toLocaleString()}</div>
          <div>Memory: {performanceData.memoryUsage.toFixed(1)}MB</div>
          <div>Level: {performanceData.performanceLevel}</div>
          {metrics.shouldOptimize && (
            <div style={{ color: '#ff9800', marginTop: '4px' }}>
              ⚠ Optimization Needed
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizerProvider;