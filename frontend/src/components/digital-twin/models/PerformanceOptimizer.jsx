import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

/**
 * 性能优化器上下文
 */
const PerformanceOptimizerContext = createContext(null);

/**
 * 性能指标收集器
 */
class PerformanceMetrics {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.frameTime = 16.67;
    this.triangleCount = 0;
    this.drawCalls = 0;
    this.memoryUsage = 0;
    this.gpuMemory = 0;
    this.history = {
      fps: [],
      frameTime: [],
      memory: []
    };
    this.maxHistoryLength = 60; // 保存60帧历史
  }

  update(renderer) {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    
    this.frameCount++;
    this.frameTime = deltaTime;
    this.fps = 1000 / deltaTime;
    
    // 获取渲染信息
    if (renderer && renderer.info) {
      this.triangleCount = renderer.info.render.triangles;
      this.drawCalls = renderer.info.render.calls;
    }
    
    // 获取内存使用情况
    if (performance.memory) {
      this.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    // 更新历史记录
    this.updateHistory();
    
    this.lastTime = now;
  }

  updateHistory() {
    this.history.fps.push(this.fps);
    this.history.frameTime.push(this.frameTime);
    this.history.memory.push(this.memoryUsage);
    
    // 限制历史长度
    if (this.history.fps.length > this.maxHistoryLength) {
      this.history.fps.shift();
      this.history.frameTime.shift();
      this.history.memory.shift();
    }
  }

  getAverageFPS() {
    if (this.history.fps.length === 0) return this.fps;
    return this.history.fps.reduce((a, b) => a + b, 0) / this.history.fps.length;
  }

  getPerformanceLevel() {
    const avgFPS = this.getAverageFPS();
    if (avgFPS >= 55) return 'high';
    if (avgFPS >= 35) return 'medium';
    return 'low';
  }

  reset() {
    this.frameCount = 0;
    this.history.fps = [];
    this.history.frameTime = [];
    this.history.memory = [];
  }
}

/**
 * 优化策略管理器
 */
class OptimizationStrategy {
  constructor() {
    this.strategies = {
      high: {
        shadowMapSize: 2048,
        shadowCascades: 4,
        antialias: true,
        postProcessing: true,
        particleCount: 1000,
        lodDistance: [50, 100, 200],
        textureQuality: 1.0,
        geometryDetail: 1.0
      },
      medium: {
        shadowMapSize: 1024,
        shadowCascades: 2,
        antialias: true,
        postProcessing: false,
        particleCount: 500,
        lodDistance: [30, 60, 120],
        textureQuality: 0.75,
        geometryDetail: 0.8
      },
      low: {
        shadowMapSize: 512,
        shadowCascades: 1,
        antialias: false,
        postProcessing: false,
        particleCount: 200,
        lodDistance: [20, 40, 80],
        textureQuality: 0.5,
        geometryDetail: 0.6
      }
    };
  }

  getStrategy(performanceLevel) {
    return this.strategies[performanceLevel] || this.strategies.medium;
  }

  applyRendererOptimizations(renderer, strategy) {
    // 阴影优化
    if (renderer.shadowMap) {
      renderer.shadowMap.mapSize.setScalar(strategy.shadowMapSize);
      renderer.shadowMap.enabled = strategy.shadowMapSize > 0;
    }
    
    // 抗锯齿优化
    if (renderer.getContext) {
      const gl = renderer.getContext();
      if (strategy.antialias) {
        gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
      } else {
        gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
      }
    }
    
    // 像素比优化
    const pixelRatio = strategy.textureQuality * window.devicePixelRatio;
    renderer.setPixelRatio(Math.min(pixelRatio, 2));
  }

  optimizeScene(scene, strategy) {
    scene.traverse((object) => {
      if (object.isMesh) {
        this.optimizeMesh(object, strategy);
      } else if (object.isLight) {
        this.optimizeLight(object, strategy);
      }
    });
  }

  optimizeMesh(mesh, strategy) {
    // 材质优化
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => this.optimizeMaterial(mat, strategy));
      } else {
        this.optimizeMaterial(mesh.material, strategy);
      }
    }
    
    // 几何体优化
    if (mesh.geometry && strategy.geometryDetail < 1.0) {
      this.optimizeGeometry(mesh.geometry, strategy);
    }
  }

  optimizeMaterial(material, strategy) {
    // 纹理质量优化
    if (material.map) {
      this.optimizeTexture(material.map, strategy);
    }
    if (material.normalMap) {
      this.optimizeTexture(material.normalMap, strategy);
    }
    if (material.roughnessMap) {
      this.optimizeTexture(material.roughnessMap, strategy);
    }
    
    // 材质属性优化
    if (strategy.textureQuality < 0.8) {
      material.transparent = false;
      material.alphaTest = 0;
    }
  }

  optimizeTexture(texture, strategy) {
    if (strategy.textureQuality < 1.0) {
      // 降低纹理分辨率
      const scale = strategy.textureQuality;
      if (texture.image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = texture.image.width * scale;
        canvas.height = texture.image.height * scale;
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        texture.image = canvas;
        texture.needsUpdate = true;
      }
    }
  }

  optimizeGeometry(geometry, strategy) {
    // 简化几何体
    if (strategy.geometryDetail < 1.0 && geometry.attributes.position) {
      const positions = geometry.attributes.position.array;
      const simplificationRatio = strategy.geometryDetail;
      
      // 简单的顶点抽取（实际项目中可以使用更复杂的简化算法）
      const step = Math.ceil(1 / simplificationRatio);
      const newPositions = [];
      
      for (let i = 0; i < positions.length; i += step * 3) {
        newPositions.push(positions[i], positions[i + 1], positions[i + 2]);
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
    }
  }

  optimizeLight(light, strategy) {
    // 阴影优化
    if (light.castShadow) {
      if (light.shadow) {
        light.shadow.mapSize.setScalar(strategy.shadowMapSize);
        
        // 调整阴影相机参数
        if (light.shadow.camera) {
          if (light.isDirectionalLight) {
            const size = 50 * strategy.geometryDetail;
            light.shadow.camera.left = -size;
            light.shadow.camera.right = size;
            light.shadow.camera.top = size;
            light.shadow.camera.bottom = -size;
          }
        }
      }
    }
  }
}

/**
 * 模型注册表
 */
class ModelRegistry {
  constructor() {
    this.models = new Map();
    this.totalTriangles = 0;
  }

  registerModel(id, model, triangleCount) {
    this.models.set(id, {
      model,
      triangleCount,
      visible: true,
      lodLevel: 'high'
    });
    this.updateTotalTriangles();
  }

  unregisterModel(id) {
    this.models.delete(id);
    this.updateTotalTriangles();
  }

  updateModelLOD(id, lodLevel) {
    const modelData = this.models.get(id);
    if (modelData) {
      modelData.lodLevel = lodLevel;
    }
  }

  setModelVisibility(id, visible) {
    const modelData = this.models.get(id);
    if (modelData) {
      modelData.visible = visible;
      modelData.model.visible = visible;
      this.updateTotalTriangles();
    }
  }

  updateTotalTriangles() {
    this.totalTriangles = 0;
    this.models.forEach(modelData => {
      if (modelData.visible) {
        this.totalTriangles += modelData.triangleCount;
      }
    });
  }

  getTotalTriangles() {
    return this.totalTriangles;
  }

  getModelCount() {
    return this.models.size;
  }

  getVisibleModelCount() {
    let count = 0;
    this.models.forEach(modelData => {
      if (modelData.visible) count++;
    });
    return count;
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
    drawCalls: 0,
    memoryUsage: 0,
    performanceLevel: 'high'
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);

  // 注册渲染器和场景
  const registerRenderer = useCallback((renderer) => {
    rendererRef.current = renderer;
  }, []);

  const registerScene = useCallback((scene) => {
    sceneRef.current = scene;
  }, []);

  // 更新性能指标
  const updateMetrics = useCallback(() => {
    if (rendererRef.current) {
      metricsRef.current.update(rendererRef.current);
      
      setPerformanceData({
        fps: metricsRef.current.fps,
        frameTime: metricsRef.current.frameTime,
        triangleCount: metricsRef.current.triangleCount,
        drawCalls: metricsRef.current.drawCalls,
        memoryUsage: metricsRef.current.memoryUsage,
        performanceLevel: metricsRef.current.getPerformanceLevel()
      });
    }
  }, []);

  // 应用优化策略
  const applyOptimization = useCallback((performanceLevel) => {
    if (!rendererRef.current || !sceneRef.current) return;
    
    setIsOptimizing(true);
    
    try {
      const strategy = strategyRef.current.getStrategy(performanceLevel);
      
      // 应用渲染器优化
      strategyRef.current.applyRendererOptimizations(rendererRef.current, strategy);
      
      // 应用场景优化
      strategyRef.current.optimizeScene(sceneRef.current, strategy);
      
      console.log(`应用了 ${performanceLevel} 级别的性能优化`);
    } catch (error) {
      console.error('应用性能优化时出错:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  // 自动优化
  const autoOptimize = useCallback(() => {
    const currentLevel = metricsRef.current.getPerformanceLevel();
    applyOptimization(currentLevel);
  }, [applyOptimization]);

  // 注册模型
  const registerModel = useCallback((id, model, triangleCount) => {
    registryRef.current.registerModel(id, model, triangleCount);
  }, []);

  // 注销模型
  const unregisterModel = useCallback((id) => {
    registryRef.current.unregisterModel(id);
  }, []);

  // 设置模型可见性
  const setModelVisibility = useCallback((id, visible) => {
    registryRef.current.setModelVisibility(id, visible);
  }, []);

  // 获取性能统计
  const getPerformanceStats = useCallback(() => {
    return {
      ...performanceData,
      averageFPS: metricsRef.current.getAverageFPS(),
      totalTriangles: registryRef.current.getTotalTriangles(),
      modelCount: registryRef.current.getModelCount(),
      visibleModelCount: registryRef.current.getVisibleModelCount(),
      history: metricsRef.current.history
    };
  }, [performanceData]);

  // 定期更新性能指标
  useEffect(() => {
    const interval = setInterval(updateMetrics, 100); // 每100ms更新一次
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // 自动优化检查
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const avgFPS = metricsRef.current.getAverageFPS();
      if (avgFPS < 30) {
        autoOptimize();
      }
    }, 5000); // 每5秒检查一次
    
    return () => clearInterval(checkInterval);
  }, [autoOptimize]);

  const value = {
    performanceData,
    isOptimizing,
    registerRenderer,
    registerScene,
    updateMetrics,
    applyOptimization,
    autoOptimize,
    registerModel,
    unregisterModel,
    setModelVisibility,
    getPerformanceStats
  };

  return (
    <PerformanceOptimizerContext.Provider value={value}>
      {children}
    </PerformanceOptimizerContext.Provider>
  );
};

/**
 * 使用性能优化器的Hook
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
export const PerformanceMonitor = ({ showDetails = false }) => {
  const { performanceData, getPerformanceStats } = usePerformanceOptimizer();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getPerformanceStats());
    }, 1000);
    return () => clearInterval(interval);
  }, [getPerformanceStats]);

  if (!showDetails) {
    return (
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 1000
      }}>
        FPS: {Math.round(performanceData.fps)} | 
        Triangles: {performanceData.triangleCount.toLocaleString()} | 
        Memory: {Math.round(performanceData.memoryUsage)}MB
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <div><strong>Performance Monitor</strong></div>
      <div>FPS: {Math.round(performanceData.fps)}</div>
      <div>Frame Time: {Math.round(performanceData.frameTime)}ms</div>
      <div>Triangles: {performanceData.triangleCount.toLocaleString()}</div>
      <div>Draw Calls: {performanceData.drawCalls}</div>
      <div>Memory: {Math.round(performanceData.memoryUsage)}MB</div>
      <div>Level: {performanceData.performanceLevel}</div>
      {stats && (
        <>
          <div>Avg FPS: {Math.round(stats.averageFPS)}</div>
          <div>Models: {stats.visibleModelCount}/{stats.modelCount}</div>
        </>
      )}
    </div>
  );
};

export default PerformanceOptimizerProvider;