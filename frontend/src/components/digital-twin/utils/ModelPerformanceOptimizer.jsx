import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * 3D模型性能优化器
 * 监控场景性能并自动调整LOD设置
 */
class ModelPerformanceOptimizer {
  constructor() {
    this.models = new Map();
    this.performanceMetrics = {
      frameRate: 60,
      renderTime: 0,
      triangleCount: 0,
      drawCalls: 0,
      memoryUsage: 0
    };
    this.thresholds = {
      lowFPS: 30,
      mediumFPS: 45,
      highTriangles: 100000,
      maxDrawCalls: 50
    };
    this.optimizationLevel = 'normal'; // normal, aggressive, ultra
    this.lastOptimization = 0;
    this.optimizationInterval = 5000; // 5秒
  }

  // 注册模型
  registerModel(id, modelData) {
    this.models.set(id, {
      ...modelData,
      lastLOD: 'high',
      distance: 0,
      visible: true,
      priority: modelData.priority || 1
    });
  }

  // 注销模型
  unregisterModel(id) {
    this.models.delete(id);
  }

  // 更新性能指标
  updateMetrics(metrics) {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    this.autoOptimize();
  }

  // 自动优化
  autoOptimize() {
    const now = Date.now();
    if (now - this.lastOptimization < this.optimizationInterval) return;

    const { frameRate, triangleCount, drawCalls } = this.performanceMetrics;
    
    // 根据性能指标调整优化级别
    if (frameRate < this.thresholds.lowFPS || triangleCount > this.thresholds.highTriangles) {
      this.optimizationLevel = 'aggressive';
    } else if (frameRate < this.thresholds.mediumFPS || drawCalls > this.thresholds.maxDrawCalls) {
      this.optimizationLevel = 'normal';
    } else {
      this.optimizationLevel = 'conservative';
    }

    this.optimizeModels();
    this.lastOptimization = now;
  }

  // 优化模型
  optimizeModels() {
    const sortedModels = Array.from(this.models.entries())
      .sort(([, a], [, b]) => {
        // 按距离和优先级排序
        const scoreA = a.distance / a.priority;
        const scoreB = b.distance / b.priority;
        return scoreB - scoreA;
      });

    let triangleBudget = this.getTriangleBudget();
    let currentTriangles = 0;

    for (const [id, model] of sortedModels) {
      const recommendedLOD = this.getRecommendedLOD(model, currentTriangles, triangleBudget);
      
      if (recommendedLOD !== model.lastLOD) {
        this.models.set(id, { ...model, lastLOD: recommendedLOD });
        model.onLODChange?.(recommendedLOD);
      }

      currentTriangles += this.estimateTriangles(recommendedLOD);
    }
  }

  // 获取三角形预算
  getTriangleBudget() {
    switch (this.optimizationLevel) {
      case 'aggressive': return 50000;
      case 'normal': return 100000;
      case 'conservative': return 200000;
      default: return 100000;
    }
  }

  // 获取推荐的LOD级别
  getRecommendedLOD(model, currentTriangles, triangleBudget) {
    const remainingBudget = triangleBudget - currentTriangles;
    const { distance, priority } = model;

    // 基于距离的基础LOD
    let baseLOD = 'high';
    if (distance > 100) baseLOD = 'medium';
    if (distance > 200) baseLOD = 'low';

    // 基于性能的调整
    if (this.optimizationLevel === 'aggressive') {
      if (baseLOD === 'high') baseLOD = 'medium';
      if (baseLOD === 'medium') baseLOD = 'low';
    }

    // 基于三角形预算的调整
    const estimatedTriangles = this.estimateTriangles(baseLOD);
    if (estimatedTriangles > remainingBudget && baseLOD !== 'low') {
      return baseLOD === 'high' ? 'medium' : 'low';
    }

    // 高优先级模型保持较高质量
    if (priority > 2 && baseLOD === 'low') {
      return 'medium';
    }

    return baseLOD;
  }

  // 估算三角形数量
  estimateTriangles(lodLevel) {
    switch (lodLevel) {
      case 'high': return 5000;
      case 'medium': return 2000;
      case 'low': return 500;
      default: return 2000;
    }
  }

  // 获取性能报告
  getPerformanceReport() {
    return {
      metrics: this.performanceMetrics,
      optimizationLevel: this.optimizationLevel,
      modelCount: this.models.size,
      estimatedTriangles: Array.from(this.models.values())
        .reduce((sum, model) => sum + this.estimateTriangles(model.lastLOD), 0),
      recommendations: this.getRecommendations()
    };
  }

  // 获取优化建议
  getRecommendations() {
    const recommendations = [];
    const { frameRate, triangleCount, drawCalls } = this.performanceMetrics;

    if (frameRate < this.thresholds.lowFPS) {
      recommendations.push('帧率过低，建议降低模型质量或减少可见模型数量');
    }

    if (triangleCount > this.thresholds.highTriangles) {
      recommendations.push('三角形数量过多，建议使用更低的LOD级别');
    }

    if (drawCalls > this.thresholds.maxDrawCalls) {
      recommendations.push('绘制调用过多，建议合并相似材质的模型');
    }

    if (this.models.size > 50) {
      recommendations.push('模型数量较多，建议实现视锥体剔除');
    }

    return recommendations;
  }
}

// 性能优化器上下文
const PerformanceOptimizerContext = createContext();

// 性能优化器提供者组件
export const PerformanceOptimizerProvider = ({ children }) => {
  const optimizerRef = useRef(new ModelPerformanceOptimizer());
  const [performanceReport, setPerformanceReport] = useState(null);

  useEffect(() => {
    const updateReport = () => {
      setPerformanceReport(optimizerRef.current.getPerformanceReport());
    };

    const interval = setInterval(updateReport, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PerformanceOptimizerContext.Provider value={{
      optimizer: optimizerRef.current,
      performanceReport
    }}>
      {children}
    </PerformanceOptimizerContext.Provider>
  );
};

// 使用性能优化器的Hook
export const usePerformanceOptimizer = () => {
  const context = useContext(PerformanceOptimizerContext);
  if (!context) {
    throw new Error('usePerformanceOptimizer must be used within PerformanceOptimizerProvider');
  }
  return context;
};

// 性能监控组件
export const PerformanceMonitor = ({ visible = false }) => {
  const { performanceReport } = usePerformanceOptimizer();

  if (!visible || !performanceReport) return null;

  const { metrics, optimizationLevel, modelCount, estimatedTriangles, recommendations } = performanceReport;

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <div><strong>性能监控</strong></div>
      <div>FPS: {metrics.frameRate.toFixed(1)}</div>
      <div>三角形: {estimatedTriangles.toLocaleString()}</div>
      <div>绘制调用: {metrics.drawCalls}</div>
      <div>模型数量: {modelCount}</div>
      <div>优化级别: {optimizationLevel}</div>
      
      {recommendations.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>建议:</strong>
          {recommendations.map((rec, index) => (
            <div key={index} style={{ fontSize: '10px', marginTop: '2px' }}>
              • {rec}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelPerformanceOptimizer;