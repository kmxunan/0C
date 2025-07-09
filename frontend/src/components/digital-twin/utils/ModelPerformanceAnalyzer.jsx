import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PERFORMANCE_LEVELS, MONITORING_CONFIG } from './PerformanceConfig';

/**
 * 模型性能分析器
 * 分析和优化3D模型的性能
 */

const ModelPerformanceAnalyzerContext = createContext();

export const ModelPerformanceAnalyzerProvider = ({ children }) => {
  const { gl, scene } = useThree();
  const [performanceData, setPerformanceData] = useState({
    fps: 60,
    frameTime: 16.67,
    memory: { used: 0, total: 0 },
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
    materials: 0,
    lights: 0,
    objects: 0
  });
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const analysisIntervalRef = useRef(null);

  // 性能监控
  useFrame(() => {
    if (!MONITORING_CONFIG.enabled) return;

    frameCountRef.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;

    // 每秒更新一次性能数据
    if (deltaTime >= MONITORING_CONFIG.interval) {
      const fps = (frameCountRef.current * 1000) / deltaTime;
      const frameTime = deltaTime / frameCountRef.current;

      // 获取渲染统计信息
      const info = gl.info;
      const memory = info.memory;
      const render = info.render;

      const newData = {
        fps: Math.round(fps * 100) / 100,
        frameTime: Math.round(frameTime * 100) / 100,
        memory: {
          used: memory.geometries + memory.textures,
          total: memory.geometries + memory.textures + 100 // 估算
        },
        drawCalls: render.calls,
        triangles: render.triangles,
        textures: memory.textures,
        geometries: memory.geometries,
        materials: memory.materials || 0,
        lights: scene.children.filter(child => child.isLight).length,
        objects: scene.children.length,
        timestamp: currentTime
      };

      setPerformanceData(newData);
      
      // 更新历史数据（保留最近100个数据点）
      setPerformanceHistory(prev => {
        const newHistory = [...prev, newData].slice(-100);
        return newHistory;
      });

      // 重置计数器
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;

      // 检查性能阈值并生成建议
      checkPerformanceThresholds(newData);
    }
  });

  // 检查性能阈值
  const checkPerformanceThresholds = (data) => {
    const suggestions = [];
    const thresholds = MONITORING_CONFIG.thresholds;

    // FPS检查
    if (data.fps < thresholds.fps.critical) {
      suggestions.push({
        type: 'critical',
        category: 'fps',
        message: `FPS过低 (${data.fps})，建议降低模型质量或启用LOD`,
        action: 'reduce_quality',
        priority: 'high'
      });
    } else if (data.fps < thresholds.fps.warning) {
      suggestions.push({
        type: 'warning',
        category: 'fps',
        message: `FPS较低 (${data.fps})，考虑优化模型或减少特效`,
        action: 'optimize_models',
        priority: 'medium'
      });
    }

    // 内存检查
    if (data.memory.used > thresholds.memory.critical) {
      suggestions.push({
        type: 'critical',
        category: 'memory',
        message: `内存使用过高 (${data.memory.used}MB)，建议清理缓存或减少模型数量`,
        action: 'clear_cache',
        priority: 'high'
      });
    } else if (data.memory.used > thresholds.memory.warning) {
      suggestions.push({
        type: 'warning',
        category: 'memory',
        message: `内存使用较高 (${data.memory.used}MB)，考虑启用模型压缩`,
        action: 'enable_compression',
        priority: 'medium'
      });
    }

    // 绘制调用检查
    if (data.drawCalls > thresholds.drawCalls.critical) {
      suggestions.push({
        type: 'critical',
        category: 'drawCalls',
        message: `绘制调用过多 (${data.drawCalls})，建议启用实例化或合并几何体`,
        action: 'enable_instancing',
        priority: 'high'
      });
    } else if (data.drawCalls > thresholds.drawCalls.warning) {
      suggestions.push({
        type: 'warning',
        category: 'drawCalls',
        message: `绘制调用较多 (${data.drawCalls})，考虑优化材质共享`,
        action: 'optimize_materials',
        priority: 'medium'
      });
    }

    setOptimizationSuggestions(suggestions);
  };

  // 分析场景性能
  const analyzeScene = async () => {
    setIsAnalyzing(true);
    
    try {
      const analysis = {
        models: [],
        textures: [],
        materials: [],
        lights: [],
        recommendations: []
      };

      // 遍历场景中的所有对象
      scene.traverse((object) => {
        if (object.isMesh) {
          const geometry = object.geometry;
          const material = object.material;
          
          // 分析几何体
          if (geometry) {
            const triangleCount = geometry.index ? 
              geometry.index.count / 3 : 
              geometry.attributes.position.count / 3;
            
            analysis.models.push({
              name: object.name || 'Unnamed',
              triangles: triangleCount,
              vertices: geometry.attributes.position.count,
              hasUV: !!geometry.attributes.uv,
              hasNormals: !!geometry.attributes.normal,
              boundingBox: geometry.boundingBox,
              complexity: getComplexityLevel(triangleCount)
            });
          }

          // 分析材质
          if (material) {
            const materials = Array.isArray(material) ? material : [material];
            materials.forEach(mat => {
              analysis.materials.push({
                name: mat.name || 'Unnamed',
                type: mat.type,
                transparent: mat.transparent,
                alphaTest: mat.alphaTest,
                side: mat.side,
                textureCount: getTextureCount(mat)
              });
            });
          }
        }

        // 分析光源
        if (object.isLight) {
          analysis.lights.push({
            name: object.name || 'Unnamed',
            type: object.type,
            intensity: object.intensity,
            castShadow: object.castShadow,
            shadowMapSize: object.shadow?.mapSize
          });
        }
      });

      // 生成优化建议
      analysis.recommendations = generateOptimizationRecommendations(analysis);
      
      return analysis;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 获取复杂度级别
  const getComplexityLevel = (triangleCount) => {
    if (triangleCount > 50000) return 'very_high';
    if (triangleCount > 20000) return 'high';
    if (triangleCount > 5000) return 'medium';
    if (triangleCount > 1000) return 'low';
    return 'very_low';
  };

  // 获取材质纹理数量
  const getTextureCount = (material) => {
    let count = 0;
    const textureProperties = [
      'map', 'normalMap', 'roughnessMap', 'metalnessMap',
      'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap',
      'alphaMap', 'lightMap', 'envMap'
    ];
    
    textureProperties.forEach(prop => {
      if (material[prop]) count++;
    });
    
    return count;
  };

  // 生成优化建议
  const generateOptimizationRecommendations = (analysis) => {
    const recommendations = [];

    // 检查高复杂度模型
    const highComplexityModels = analysis.models.filter(m => 
      m.complexity === 'very_high' || m.complexity === 'high'
    );
    
    if (highComplexityModels.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'geometry',
        message: `发现 ${highComplexityModels.length} 个高复杂度模型，建议启用LOD或简化几何体`,
        models: highComplexityModels.map(m => m.name),
        action: 'enable_lod',
        priority: 'high'
      });
    }

    // 检查纹理使用
    const highTextureModels = analysis.materials.filter(m => m.textureCount > 5);
    if (highTextureModels.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'texture',
        message: `发现 ${highTextureModels.length} 个材质使用了大量纹理，考虑纹理合并`,
        action: 'merge_textures',
        priority: 'medium'
      });
    }

    // 检查透明材质
    const transparentMaterials = analysis.materials.filter(m => m.transparent);
    if (transparentMaterials.length > 10) {
      recommendations.push({
        type: 'warning',
        category: 'material',
        message: `透明材质过多 (${transparentMaterials.length})，可能影响性能`,
        action: 'reduce_transparency',
        priority: 'medium'
      });
    }

    // 检查光源数量
    if (analysis.lights.length > 8) {
      recommendations.push({
        type: 'warning',
        category: 'lighting',
        message: `光源数量过多 (${analysis.lights.length})，建议减少或使用光照贴图`,
        action: 'reduce_lights',
        priority: 'medium'
      });
    }

    // 检查阴影光源
    const shadowLights = analysis.lights.filter(l => l.castShadow);
    if (shadowLights.length > 3) {
      recommendations.push({
        type: 'info',
        category: 'shadows',
        message: `阴影光源较多 (${shadowLights.length})，考虑减少或降低阴影质量`,
        action: 'optimize_shadows',
        priority: 'low'
      });
    }

    return recommendations;
  };

  // 获取性能等级建议
  const getPerformanceLevelSuggestion = () => {
    const avgFps = performanceHistory.length > 0 ? 
      performanceHistory.reduce((sum, data) => sum + data.fps, 0) / performanceHistory.length : 60;
    
    if (avgFps >= 55) return 'ultra';
    if (avgFps >= 45) return 'high';
    if (avgFps >= 30) return 'medium';
    if (avgFps >= 20) return 'low';
    return 'minimal';
  };

  // 获取性能报告
  const getPerformanceReport = () => {
    const avgFps = performanceHistory.length > 0 ? 
      performanceHistory.reduce((sum, data) => sum + data.fps, 0) / performanceHistory.length : 0;
    
    const minFps = performanceHistory.length > 0 ? 
      Math.min(...performanceHistory.map(data => data.fps)) : 0;
    
    const maxFps = performanceHistory.length > 0 ? 
      Math.max(...performanceHistory.map(data => data.fps)) : 0;

    return {
      current: performanceData,
      average: {
        fps: Math.round(avgFps * 100) / 100,
        frameTime: avgFps > 0 ? Math.round((1000 / avgFps) * 100) / 100 : 0
      },
      range: {
        minFps: Math.round(minFps * 100) / 100,
        maxFps: Math.round(maxFps * 100) / 100
      },
      suggestions: optimizationSuggestions,
      recommendedLevel: getPerformanceLevelSuggestion(),
      history: performanceHistory
    };
  };

  // 清除性能历史
  const clearPerformanceHistory = () => {
    setPerformanceHistory([]);
    setOptimizationSuggestions([]);
  };

  const value = {
    performanceData,
    performanceHistory,
    optimizationSuggestions,
    isAnalyzing,
    analyzeScene,
    getPerformanceReport,
    getPerformanceLevelSuggestion,
    clearPerformanceHistory
  };

  return (
    <ModelPerformanceAnalyzerContext.Provider value={value}>
      {children}
    </ModelPerformanceAnalyzerContext.Provider>
  );
};

export const useModelPerformanceAnalyzer = () => {
  const context = useContext(ModelPerformanceAnalyzerContext);
  if (!context) {
    throw new Error('useModelPerformanceAnalyzer must be used within a ModelPerformanceAnalyzerProvider');
  }
  return context;
};

// 性能分析面板组件
export const PerformanceAnalysisPanel = ({ className = '' }) => {
  const {
    performanceData,
    optimizationSuggestions,
    isAnalyzing,
    analyzeScene,
    getPerformanceReport,
    clearPerformanceHistory
  } = useModelPerformanceAnalyzer();

  const [report, setReport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAnalyze = async () => {
    const sceneAnalysis = await analyzeScene();
    const performanceReport = getPerformanceReport();
    setReport({ ...performanceReport, sceneAnalysis });
  };

  const getSeverityColor = (type) => {
    switch (type) {
      case 'critical': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#4caf50';
    }
  };

  return (
    <div className={`performance-analysis-panel ${className}`} style={{
      position: 'fixed',
      top: '200px',
      right: '20px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      minWidth: '300px',
      maxWidth: '400px',
      maxHeight: '70vh',
      overflow: 'auto',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>性能分析</h4>
      
      {/* 实时性能数据 */}
      <div style={{ marginBottom: '15px' }}>
        <h5 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>实时性能</h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
          <div>FPS: <span style={{ color: performanceData.fps < 30 ? '#f44336' : '#4caf50' }}>
            {performanceData.fps}
          </span></div>
          <div>帧时间: {performanceData.frameTime}ms</div>
          <div>绘制调用: {performanceData.drawCalls}</div>
          <div>三角形: {performanceData.triangles.toLocaleString()}</div>
          <div>纹理: {performanceData.textures}</div>
          <div>几何体: {performanceData.geometries}</div>
          <div>光源: {performanceData.lights}</div>
          <div>对象: {performanceData.objects}</div>
        </div>
      </div>

      {/* 优化建议 */}
      {optimizationSuggestions.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>优化建议</h5>
          <div style={{ maxHeight: '120px', overflow: 'auto' }}>
            {optimizationSuggestions.map((suggestion, index) => (
              <div key={index} style={{
                padding: '6px',
                margin: '4px 0',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                borderLeft: `3px solid ${getSeverityColor(suggestion.type)}`,
                fontSize: '10px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                  {suggestion.category.toUpperCase()}
                </div>
                <div>{suggestion.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 控制按钮 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          style={{
            padding: '6px 12px',
            background: isAnalyzing ? '#666' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer'
          }}
        >
          {isAnalyzing ? '分析中...' : '场景分析'}
        </button>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '6px 12px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {showDetails ? '隐藏详情' : '显示详情'}
        </button>
        
        <button
          onClick={clearPerformanceHistory}
          style={{
            padding: '6px 12px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          清除历史
        </button>
      </div>

      {/* 详细报告 */}
      {showDetails && report && (
        <div style={{ fontSize: '10px' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>详细报告</h5>
          
          {/* 平均性能 */}
          <div style={{ marginBottom: '10px' }}>
            <strong>平均性能:</strong>
            <div>FPS: {report.average.fps} (范围: {report.range.minFps} - {report.range.maxFps})</div>
            <div>推荐级别: {report.recommendedLevel}</div>
          </div>

          {/* 场景分析 */}
          {report.sceneAnalysis && (
            <div>
              <strong>场景统计:</strong>
              <div>模型数量: {report.sceneAnalysis.models.length}</div>
              <div>材质数量: {report.sceneAnalysis.materials.length}</div>
              <div>光源数量: {report.sceneAnalysis.lights.length}</div>
              
              {report.sceneAnalysis.recommendations.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong>场景优化建议:</strong>
                  {report.sceneAnalysis.recommendations.map((rec, index) => (
                    <div key={index} style={{
                      padding: '4px',
                      margin: '2px 0',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '2px',
                      fontSize: '9px'
                    }}>
                      {rec.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelPerformanceAnalyzerProvider;