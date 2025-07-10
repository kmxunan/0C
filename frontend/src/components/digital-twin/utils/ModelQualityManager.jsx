import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Box, Typography, Slider, FormControl, FormLabel, Switch, Button, Paper, Chip, LinearProgress } from '@mui/material';
import {
  MODEL_QUALITY_LEVELS,
  LOD_SETTINGS,
  PERFORMANCE_THRESHOLDS,
  MODEL_OPTIMIZATION_STRATEGIES,
  ADAPTIVE_QUALITY_CONFIG,
  getRecommendedQualityLevel,
  getModelPath,
  getLODDistance,
  getRecommendedLODLevel
} from '../../../config/modelQualityConfig';

// 性能优化器降级处理
const usePerformanceOptimizer = null;

/**
 * 高级模型质量管理器
 */
class AdvancedModelQualityManager {
  constructor() {
    this.qualityHistory = [];
    this.adaptiveSettings = {
      enabled: true,
      sensitivity: 0.8, // 0-1, 越高越敏感
      stabilityThreshold: 5, // 连续帧数阈值
      hysteresis: 0.1 // 防抖动阈值
    };
    this.performanceTargets = {
      targetFPS: 60,
      minFPS: 30,
      maxTriangles: 100000,
      maxMemory: 512 // MB
    };
    this.qualityTransitions = {
      inProgress: false,
      fromLevel: null,
      toLevel: null,
      progress: 0
    };
  }

  // 智能质量评估
  evaluateOptimalQuality(metrics) {
    const { fps, triangleCount, memoryUsage } = metrics;
    
    // 计算性能分数 (0-1)
    const fpsScore = Math.min(fps / this.performanceTargets.targetFPS, 1);
    const triangleScore = Math.max(1 - (triangleCount / this.performanceTargets.maxTriangles), 0);
    const memoryScore = Math.max(1 - (memoryUsage / this.performanceTargets.maxMemory), 0);
    
    const overallScore = (fpsScore * 0.5 + triangleScore * 0.3 + memoryScore * 0.2);
    
    // 根据分数确定质量级别
    if (overallScore >= 0.9) return MODEL_QUALITY_LEVELS.ULTRA;
    if (overallScore >= 0.7) return MODEL_QUALITY_LEVELS.HIGH;
    if (overallScore >= 0.4) return MODEL_QUALITY_LEVELS.MEDIUM;
    return MODEL_QUALITY_LEVELS.LOW;
  }

  // 平滑质量过渡
  shouldTransitionQuality(currentLevel, targetLevel, metrics) {
    if (currentLevel.name === targetLevel.name) return false;
    
    // 添加到历史记录
    this.qualityHistory.push({ level: targetLevel.name, timestamp: Date.now(), metrics });
    
    // 保持历史记录在合理范围内
    if (this.qualityHistory.length > 10) {
      this.qualityHistory.shift();
    }
    
    // 检查稳定性
    const recentHistory = this.qualityHistory.slice(-this.adaptiveSettings.stabilityThreshold);
    const consistentLevel = recentHistory.every(entry => entry.level === targetLevel.name);
    
    return consistentLevel && recentHistory.length >= this.adaptiveSettings.stabilityThreshold;
  }

  // 获取质量过渡进度
  getTransitionProgress() {
    return this.qualityTransitions;
  }

  // 开始质量过渡
  startTransition(fromLevel, toLevel) {
    this.qualityTransitions = {
      inProgress: true,
      fromLevel,
      toLevel,
      progress: 0
    };
  }

  // 完成质量过渡
  completeTransition() {
    this.qualityTransitions = {
      inProgress: false,
      fromLevel: null,
      toLevel: null,
      progress: 0
    };
  }
}

/**
 * 3D模型质量管理器
 * 提供统一的模型质量控制、LOD管理和性能优化功能
 */

const ModelQualityContext = createContext(null);

export const useModelQuality = () => {
  const context = useContext(ModelQualityContext);
  if (!context) {
    throw new Error('useModelQuality must be used within a ModelQualityProvider');
  }
  return context;
};

export const ModelQualityProvider = ({ children, initialQuality = null }) => {
  // 质量设置状态
  const [currentQuality, setCurrentQuality] = useState(
    initialQuality || getRecommendedQualityLevel()
  );
  const [adaptiveQualityEnabled, setAdaptiveQualityEnabled] = useState(
    ADAPTIVE_QUALITY_CONFIG.enabled
  );
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    triangleCount: 0,
    memoryUsage: 0,
    gpuUsage: 0,
    lastUpdate: Date.now()
  });
  const [qualityHistory, setQualityHistory] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [qualityTransition, setQualityTransition] = useState(null);
  const managerRef = useRef(new AdvancedModelQualityManager());
  const transitionTimeoutRef = useRef(null);

  // 性能监控
  const [performanceMonitor, setPerformanceMonitor] = useState(null);

  // 初始化性能监控
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const monitor = {
        frameCount: 0,
        lastTime: performance.now(),
        fpsHistory: [],
        
        updateFPS() {
          this.frameCount++;
          const currentTime = performance.now();
          const deltaTime = currentTime - this.lastTime;
          
          if (deltaTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.fpsHistory.push(fps);
            
            // 保持最近10个FPS记录
            if (this.fpsHistory.length > 10) {
              this.fpsHistory.shift();
            }
            
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            return fps;
          }
          
          return null;
        },
        
        getAverageFPS() {
          if (this.fpsHistory.length === 0) return 60;
          return Math.round(
            this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
          );
        }
      };
      
      setPerformanceMonitor(monitor);
    }
  }, []);

  // 更新性能指标
  const updatePerformanceMetrics = useCallback((newMetrics) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      ...newMetrics,
      lastUpdate: Date.now()
    }));
  }, []);

  // 监听性能指标变化并调整质量
  useEffect(() => {
    adjustQualityIntelligently();
  }, [performanceMetrics, adjustQualityIntelligently]);

  // 智能质量调整
  const adjustQualityIntelligently = useCallback(() => {
    if (!adaptiveQualityEnabled || isOptimizing) return;
    
    const manager = managerRef.current;
    const optimalLevel = manager.evaluateOptimalQuality(performanceMetrics);
    
    if (manager.shouldTransitionQuality(currentQuality, optimalLevel, performanceMetrics)) {
      // 开始平滑过渡
      manager.startTransition(currentQuality, optimalLevel);
      setQualityTransition(manager.getTransitionProgress());
      
      // 延迟应用新质量级别，实现平滑过渡
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentQuality(optimalLevel);
        manager.completeTransition();
        setQualityTransition(null);
        
        setQualityHistory(prev => [
          ...prev.slice(-9), // 保持最近10个记录
          {
            quality: optimalLevel.name,
            timestamp: Date.now(),
            reason: 'adaptive',
            metrics: performanceMetrics
          }
        ]);
      }, 1000); // 1秒过渡时间
    }
  }, [adaptiveQualityEnabled, isOptimizing, currentQuality, performanceMetrics]);

  // 定期性能监控和质量调整
  useEffect(() => {
    if (!adaptiveQualityEnabled) return;

    const interval = setInterval(() => {
      if (performanceMonitor) {
        const fps = performanceMonitor.updateFPS();
        if (fps !== null) {
          updatePerformanceMetrics({ fps });
        }
      }
    }, ADAPTIVE_QUALITY_CONFIG.monitorInterval);

    return () => clearInterval(interval);
  }, [adaptiveQualityEnabled, performanceMonitor, updatePerformanceMetrics]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // 手动设置质量级别
  const setQualityLevel = useCallback((qualityLevel) => {
    setAdaptiveQualityEnabled(false);
    
    // 清除任何进行中的过渡
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    managerRef.current.completeTransition();
    setQualityTransition(null);
    
    if (typeof qualityLevel === 'string') {
      const quality = Object.values(MODEL_QUALITY_LEVELS).find(q => q.name === qualityLevel);
      if (quality) {
        setCurrentQuality(quality);
        setQualityHistory(prev => [
          ...prev.slice(-9),
          {
            quality: quality.name,
            timestamp: Date.now(),
            reason: 'manual',
            metrics: performanceMetrics
          }
        ]);
      }
    } else {
      setCurrentQuality(qualityLevel);
    }
  }, [performanceMetrics]);

  // 获取LOD级别
  const getLODLevel = useCallback((distance, modelType = 'building') => {
    const lodDistances = currentQuality.lodDistances;
    
    if (distance <= lodDistances[0]) return 'LOD0';
    if (distance <= lodDistances[1]) return 'LOD1';
    if (distance <= lodDistances[2]) return 'LOD2';
    
    // 超远距离，不渲染或使用最低LOD
    return null;
  }, [currentQuality]);

  // 获取模型URL
  const getOptimizedModelUrl = useCallback((baseUrl, distance, modelType = 'building') => {
    const lodLevel = getLODLevel(distance, modelType);
    if (!lodLevel) return null;
    
    return getModelPath(baseUrl, lodLevel);
  }, [getLODLevel]);

  // 性能优化建议
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations = [];
    const { fps, triangleCount, memoryUsage } = performanceMetrics;

    if (fps < PERFORMANCE_THRESHOLDS.FPS.ACCEPTABLE) {
      recommendations.push({
        type: 'fps',
        severity: 'high',
        message: `帧率过低 (${fps}fps)，建议降低模型质量或启用性能模式`,
        action: 'reduce_quality'
      });
    }

    if (triangleCount > PERFORMANCE_THRESHOLDS.TRIANGLES.HIGH) {
      recommendations.push({
        type: 'triangles',
        severity: 'medium',
        message: `三角形数量过多 (${triangleCount})，建议启用LOD或减少可见模型`,
        action: 'enable_lod'
      });
    }

    if (memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY.HIGH) {
      recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: `内存使用过高 (${memoryUsage}MB)，建议清理缓存或降低纹理质量`,
        action: 'clear_cache'
      });
    }

    return recommendations;
  }, [performanceMetrics]);

  // 应用性能优化
  const applyOptimization = useCallback(async (optimizationType) => {
    setIsOptimizing(true);
    
    try {
      switch (optimizationType) {
        case 'reduce_quality':
          const lowerQuality = Object.values(MODEL_QUALITY_LEVELS)
            .find(q => q.name === 'low');
          if (lowerQuality) {
            setQualityLevel(lowerQuality);
          }
          break;
          
        case 'enable_lod':
          // LOD已经在质量设置中启用
          break;
          
        case 'clear_cache':
          // 触发缓存清理事件
          window.dispatchEvent(new CustomEvent('clearModelCache'));
          break;
          
        default:
          console.warn(`Unknown optimization type: ${optimizationType}`);
      }
    } finally {
      setTimeout(() => setIsOptimizing(false), 1000);
    }
  }, [setQualityLevel]);

  // 获取质量统计信息
  const getQualityStats = useCallback(() => {
    const manager = managerRef.current;
    return {
      currentLevel: currentQuality.name,
      adaptiveEnabled: adaptiveQualityEnabled,
      transitionInProgress: qualityTransition !== null,
      qualityHistory: manager.qualityHistory.slice(-5), // 最近5次记录
      performanceTargets: manager.performanceTargets
    };
  }, [currentQuality, adaptiveQualityEnabled, qualityTransition]);

  const contextValue = {
    // 状态
    currentQuality,
    adaptiveQualityEnabled,
    performanceMetrics,
    qualityHistory,
    isOptimizing,
    qualityTransition,
    
    // 方法
    setQualityLevel,
    setAdaptiveQualityEnabled,
    updatePerformanceMetrics,
    getLODLevel,
    getOptimizedModelUrl,
    getPerformanceRecommendations,
    applyOptimization,
    getQualityStats,
    
    // 配置
    qualityLevels: MODEL_QUALITY_LEVELS,
    lodSettings: LOD_SETTINGS,
    performanceThresholds: PERFORMANCE_THRESHOLDS
  };

  return (
    <ModelQualityContext.Provider value={contextValue}>
      {children}
    </ModelQualityContext.Provider>
  );
};

/**
 * 增强的质量控制面板组件
 */
export const QualityControlPanel = ({ className = '' }) => {
  const {
    currentQuality,
    adaptiveQualityEnabled,
    performanceMetrics,
    qualityLevels,
    qualityTransition,
    setQualityLevel,
    setAdaptiveQualityEnabled,
    getPerformanceRecommendations,
    applyOptimization,
    getQualityStats
  } = useModelQuality();

  const [stats, setStats] = useState(null);
  const recommendations = getPerformanceRecommendations();

  // 定期更新统计信息
  useEffect(() => {
    const updateStats = () => {
      setStats(getQualityStats());
    };
    
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [getQualityStats]);

  const qualityLevelOptions = [
    { value: 'ultra', label: '超高质量', color: '#4caf50', description: '最佳视觉效果' },
    { value: 'high', label: '高质量', color: '#8bc34a', description: '平衡性能与质量' },
    { value: 'medium', label: '中等质量', color: '#ff9800', description: '优化性能' },
    { value: 'low', label: '低质量', color: '#f44336', description: '最佳性能' }
  ];

  const getPerformanceColor = (fps) => {
    if (fps >= 55) return '#4caf50';
    if (fps >= 45) return '#8bc34a';
    if (fps >= 30) return '#ff9800';
    return '#f44336';
  };

  const getPerformanceStatus = (fps) => {
    if (fps >= 55) return '优秀';
    if (fps >= 45) return '良好';
    if (fps >= 30) return '一般';
    return '较差';
  };

  return (
    <Paper
      className={className}
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        width: 360,
        maxHeight: 'calc(100vh - 100px)',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        p: 2,
        color: 'white',
        zIndex: 1000,
        overflow: 'auto'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
        🎮 模型质量控制
      </Typography>

      {/* 质量过渡指示器 */}
      {qualityTransition && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#ff9800', mb: 1 }}>
            正在调整质量级别...
          </Typography>
          <LinearProgress 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ff9800'
              }
            }} 
          />
        </Box>
      )}

      {/* 自适应质量开关 */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <FormLabel sx={{ color: 'white', mb: 1 }}>🤖 智能自适应质量</FormLabel>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Switch
            checked={adaptiveQualityEnabled}
            onChange={(e) => setAdaptiveQualityEnabled(e.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#4caf50'
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#4caf50'
              }
            }}
          />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {adaptiveQualityEnabled ? '已启用' : '已禁用'}
          </Typography>
        </Box>
      </FormControl>

      {/* 质量级别选择 */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <FormLabel sx={{ color: 'white', mb: 1 }}>🎯 质量级别</FormLabel>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {qualityLevelOptions.map((level) => (
            <Box
              key={level.value}
              onClick={() => setQualityLevel(level.value)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                borderRadius: 1,
                backgroundColor: currentQuality.name === level.value ? 
                  `${level.color}20` : 'rgba(255,255,255,0.05)',
                border: currentQuality.name === level.value ? 
                  `1px solid ${level.color}` : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: `${level.color}15`,
                  border: `1px solid ${level.color}60`
                }
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: level.color, fontWeight: 'bold' }}>
                  {level.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {level.description}
                </Typography>
              </Box>
              {currentQuality.name === level.value && (
                <Box sx={{ color: level.color }}>✓</Box>
              )}
            </Box>
          ))}
        </Box>
      </FormControl>

      {/* 性能指标显示 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
          📊 实时性能指标
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            p: 1,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 1
          }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              🎯 FPS:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ color: getPerformanceColor(performanceMetrics.fps), fontWeight: 'bold' }}
              >
                {Math.round(performanceMetrics.fps)}
              </Typography>
              <Chip 
                label={getPerformanceStatus(performanceMetrics.fps)}
                size="small"
                sx={{
                  backgroundColor: getPerformanceColor(performanceMetrics.fps),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: '20px'
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              🔺 三角形:
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {performanceMetrics.triangleCount.toLocaleString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              💾 内存:
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {performanceMetrics.memoryUsage.toFixed(1)}MB
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 当前质量配置显示 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
          ⚙️ 当前配置详情
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0.5, 
          fontSize: '0.75rem',
          backgroundColor: 'rgba(255,255,255,0.05)',
          p: 1,
          borderRadius: 1
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>最大三角形:</span>
            <span style={{ color: 'white' }}>{currentQuality.maxTriangles?.toLocaleString() || 'N/A'}</span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>阴影质量:</span>
            <span style={{ color: currentQuality.shadows ? '#4caf50' : '#f44336' }}>
              {currentQuality.shadows ? '✓ 开启' : '✗ 关闭'}
            </span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>反射效果:</span>
            <span style={{ color: currentQuality.reflections ? '#4caf50' : '#f44336' }}>
              {currentQuality.reflections ? '✓ 开启' : '✗ 关闭'}
            </span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>后处理:</span>
            <span style={{ color: currentQuality.postProcessing ? '#4caf50' : '#f44336' }}>
              {currentQuality.postProcessing ? '✓ 开启' : '✗ 关闭'}
            </span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>纹理质量:</span>
            <span style={{ color: 'white' }}>{currentQuality.textureQuality || 'N/A'}</span>
          </Box>
        </Box>
      </Box>

      {/* 性能建议 */}
      {recommendations.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
            💡 性能建议
          </Typography>
          {recommendations.map((rec, index) => (
            <Box key={index} sx={{ 
              marginBottom: 1,
              padding: 1,
              background: rec.severity === 'high' ? 'rgba(255,0,0,0.2)' : 'rgba(255,165,0,0.2)',
              borderRadius: 1,
              fontSize: '0.75rem'
            }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>{rec.message}</Typography>
              <Button
                onClick={() => applyOptimization(rec.action)}
                size="small"
                sx={{
                  background: '#007acc',
                  color: 'white',
                  fontSize: '0.7rem',
                  '&:hover': {
                    background: '#005a9e'
                  }
                }}
              >
                应用优化
              </Button>
            </Box>
          ))}
        </Box>
      )}

      {/* 质量历史统计 */}
      {stats?.qualityHistory?.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
            📈 质量调整历史
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5,
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {stats.qualityHistory.slice(-3).map((entry, index) => (
              <Box 
                key={index}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.6)'
                }}
              >
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span>{entry.level}</span>
                <span>{Math.round(entry.metrics.fps)} FPS</span>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default {
  ModelQualityProvider,
  useModelQuality,
  QualityControlPanel
};