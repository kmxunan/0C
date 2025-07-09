import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Tune as TuneIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// 尝试导入性能优化器，如果不存在则降级处理
let usePerformanceOptimizer;
try {
  const PerformanceOptimizer = require('./PerformanceOptimizer');
  usePerformanceOptimizer = PerformanceOptimizer.usePerformanceOptimizer;
} catch (error) {
  console.warn('PerformanceOptimizer not available, using fallback');
  usePerformanceOptimizer = null;
}

/**
 * 模型质量配置
 */
const modelQualityConfig = {
  qualityLevels: {
    ultra: {
      name: '超高',
      lodDistances: [100, 200, 400],
      shadowMapSize: 4096,
      textureQuality: 1.0,
      geometryDetail: 1.0,
      particleCount: 2000,
      postProcessing: true,
      antialias: true,
      performanceThreshold: 45
    },
    high: {
      name: '高',
      lodDistances: [50, 100, 200],
      shadowMapSize: 2048,
      textureQuality: 1.0,
      geometryDetail: 1.0,
      particleCount: 1000,
      postProcessing: true,
      antialias: true,
      performanceThreshold: 35
    },
    medium: {
      name: '中',
      lodDistances: [30, 60, 120],
      shadowMapSize: 1024,
      textureQuality: 0.75,
      geometryDetail: 0.8,
      particleCount: 500,
      postProcessing: false,
      antialias: true,
      performanceThreshold: 25
    },
    low: {
      name: '低',
      lodDistances: [20, 40, 80],
      shadowMapSize: 512,
      textureQuality: 0.5,
      geometryDetail: 0.6,
      particleCount: 200,
      postProcessing: false,
      antialias: false,
      performanceThreshold: 15
    }
  },
  
  performanceThresholds: {
    excellent: 55,
    good: 45,
    fair: 30,
    poor: 20
  },
  
  lodSystem: {
    updateInterval: 1000,
    hysteresis: 0.1, // 防止频繁切换的滞后系数
    maxDistance: 500
  }
};

/**
 * 高级模型质量管理器
 */
class AdvancedModelQualityManager {
  constructor() {
    this.currentQuality = 'high';
    this.autoAdjust = true;
    this.performanceHistory = [];
    this.qualityHistory = [];
    this.lastAdjustTime = 0;
    this.adjustCooldown = 3000; // 3秒冷却时间
    this.transitionDuration = 1000; // 1秒过渡时间
  }

  /**
   * 智能质量评估
   */
  assessQuality(performanceMetrics) {
    const { fps, frameTime, memoryUsage, triangleCount } = performanceMetrics;
    
    // 计算性能分数 (0-100)
    const fpsScore = Math.min(fps / 60 * 40, 40);
    const frameTimeScore = Math.min((33.33 - frameTime) / 33.33 * 30, 30);
    const memoryScore = Math.max(30 - (memoryUsage / 512) * 30, 0);
    
    const totalScore = fpsScore + frameTimeScore + memoryScore;
    
    // 根据分数推荐质量级别
    if (totalScore >= 85) return 'ultra';
    if (totalScore >= 70) return 'high';
    if (totalScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * 平滑质量过渡
   */
  smoothTransition(fromQuality, toQuality, progress) {
    const fromConfig = modelQualityConfig.qualityLevels[fromQuality];
    const toConfig = modelQualityConfig.qualityLevels[toQuality];
    
    return {
      shadowMapSize: Math.round(fromConfig.shadowMapSize + 
        (toConfig.shadowMapSize - fromConfig.shadowMapSize) * progress),
      textureQuality: fromConfig.textureQuality + 
        (toConfig.textureQuality - fromConfig.textureQuality) * progress,
      geometryDetail: fromConfig.geometryDetail + 
        (toConfig.geometryDetail - fromConfig.geometryDetail) * progress,
      particleCount: Math.round(fromConfig.particleCount + 
        (toConfig.particleCount - fromConfig.particleCount) * progress)
    };
  }

  /**
   * 检查是否需要调整质量
   */
  shouldAdjustQuality(performanceMetrics) {
    if (!this.autoAdjust) return false;
    
    const now = Date.now();
    if (now - this.lastAdjustTime < this.adjustCooldown) return false;
    
    const recommendedQuality = this.assessQuality(performanceMetrics);
    return recommendedQuality !== this.currentQuality;
  }

  /**
   * 更新性能历史
   */
  updateHistory(performanceMetrics, quality) {
    const now = Date.now();
    
    this.performanceHistory.push({
      timestamp: now,
      ...performanceMetrics
    });
    
    this.qualityHistory.push({
      timestamp: now,
      quality
    });
    
    // 限制历史长度（保留最近5分钟）
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    this.performanceHistory = this.performanceHistory.filter(h => h.timestamp > fiveMinutesAgo);
    this.qualityHistory = this.qualityHistory.filter(h => h.timestamp > fiveMinutesAgo);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    if (this.performanceHistory.length === 0) return null;
    
    const recent = this.performanceHistory.slice(-10); // 最近10个数据点
    const avgFPS = recent.reduce((sum, h) => sum + h.fps, 0) / recent.length;
    const avgFrameTime = recent.reduce((sum, h) => sum + h.frameTime, 0) / recent.length;
    const avgMemory = recent.reduce((sum, h) => sum + h.memoryUsage, 0) / recent.length;
    
    return {
      averageFPS: avgFPS,
      averageFrameTime: avgFrameTime,
      averageMemory: avgMemory,
      dataPoints: this.performanceHistory.length,
      qualityChanges: this.qualityHistory.length
    };
  }
}

/**
 * 模型质量上下文
 */
const ModelQualityContext = createContext(null);

/**
 * 使用模型质量的Hook
 */
export const useModelQuality = () => {
  const context = useContext(ModelQualityContext);
  if (!context) {
    throw new Error('useModelQuality must be used within a ModelQualityProvider');
  }
  return context;
};

/**
 * 模型质量提供者组件
 */
export const ModelQualityProvider = ({ children }) => {
  const [qualityLevel, setQualityLevel] = useState('high');
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    triangleCount: 0
  });
  const [qualityHistory, setQualityHistory] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const managerRef = useRef(new AdvancedModelQualityManager());
  
  // 尝试使用性能优化器
  let performanceOptimizer = null;
  try {
    if (usePerformanceOptimizer) {
      performanceOptimizer = usePerformanceOptimizer();
    }
  } catch (error) {
    console.warn('Performance optimizer not available:', error);
  }

  // 监听性能指标变化，智能调整质量
  useEffect(() => {
    if (!performanceMetrics) return;
    
    const manager = managerRef.current;
    manager.updateHistory(performanceMetrics, qualityLevel);
    
    if (manager.shouldAdjustQuality(performanceMetrics)) {
      const recommendedQuality = manager.assessQuality(performanceMetrics);
      if (recommendedQuality !== qualityLevel) {
        console.log(`自动调整质量级别: ${qualityLevel} -> ${recommendedQuality}`);
        setQualityLevel(recommendedQuality);
        manager.currentQuality = recommendedQuality;
        manager.lastAdjustTime = Date.now();
      }
    }
  }, [performanceMetrics, qualityLevel]);

  // 设置质量级别
  const setQualityLevelHandler = useCallback((level) => {
    if (level === qualityLevel) return;
    
    setIsTransitioning(true);
    setQualityLevel(level);
    managerRef.current.currentQuality = level;
    
    // 记录质量变化历史
    setQualityHistory(prev => [...prev, {
      timestamp: Date.now(),
      from: qualityLevel,
      to: level,
      reason: autoAdjust ? 'auto' : 'manual'
    }].slice(-20)); // 保留最近20次变化
    
    // 模拟过渡完成
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [qualityLevel, autoAdjust]);

  // 获取LOD级别
  const getLODLevel = useCallback((distance) => {
    const config = modelQualityConfig.qualityLevels[qualityLevel];
    const distances = config.lodDistances;
    
    if (distance <= distances[0]) return 0; // 高细节
    if (distance <= distances[1]) return 1; // 中细节
    if (distance <= distances[2]) return 2; // 低细节
    return 3; // 最低细节
  }, [qualityLevel]);

  // 获取优化的模型URL
  const getOptimizedModelUrl = useCallback((baseUrl, distance) => {
    const lodLevel = getLODLevel(distance);
    const suffix = lodLevel > 0 ? `_lod${lodLevel}` : '';
    return baseUrl.replace(/\.(glb|gltf)$/, `${suffix}.$1`);
  }, [getLODLevel]);

  // 获取性能建议
  const getPerformanceRecommendations = useCallback(() => {
    const manager = managerRef.current;
    const stats = manager.getPerformanceStats();
    
    if (!stats) return [];
    
    const recommendations = [];
    
    if (stats.averageFPS < 30) {
      recommendations.push({
        type: 'warning',
        message: '帧率较低，建议降低质量级别或减少模型数量',
        action: 'reduce_quality'
      });
    }
    
    if (stats.averageMemory > 400) {
      recommendations.push({
        type: 'warning',
        message: '内存使用过高，建议启用模型缓存清理',
        action: 'clear_cache'
      });
    }
    
    if (stats.averageFPS > 55 && qualityLevel !== 'ultra') {
      recommendations.push({
        type: 'info',
        message: '性能良好，可以尝试提高质量级别',
        action: 'increase_quality'
      });
    }
    
    return recommendations;
  }, [qualityLevel]);

  // 应用优化
  const applyOptimization = useCallback((action) => {
    switch (action) {
      case 'reduce_quality':
        const lowerQuality = {
          'ultra': 'high',
          'high': 'medium',
          'medium': 'low',
          'low': 'low'
        }[qualityLevel];
        setQualityLevelHandler(lowerQuality);
        break;
        
      case 'increase_quality':
        const higherQuality = {
          'low': 'medium',
          'medium': 'high',
          'high': 'ultra',
          'ultra': 'ultra'
        }[qualityLevel];
        setQualityLevelHandler(higherQuality);
        break;
        
      case 'clear_cache':
        // 清理模型缓存
        if (performanceOptimizer && performanceOptimizer.clearCache) {
          performanceOptimizer.clearCache();
        }
        break;
        
      default:
        console.warn('未知的优化操作:', action);
    }
  }, [qualityLevel, setQualityLevelHandler, performanceOptimizer]);

  // 获取质量统计
  const getQualityStats = useCallback(() => {
    const manager = managerRef.current;
    const performanceStats = manager.getPerformanceStats();
    const currentConfig = modelQualityConfig.qualityLevels[qualityLevel];
    
    return {
      currentQuality: qualityLevel,
      currentConfig,
      performanceStats,
      qualityHistory: qualityHistory.slice(-10),
      isTransitioning,
      autoAdjust,
      recommendations: getPerformanceRecommendations()
    };
  }, [qualityLevel, qualityHistory, isTransitioning, autoAdjust, getPerformanceRecommendations]);

  const value = {
    qualityLevel,
    setQualityLevel: setQualityLevelHandler,
    autoAdjust,
    setAutoAdjust,
    performanceMetrics,
    setPerformanceMetrics,
    getLODLevel,
    getOptimizedModelUrl,
    getPerformanceRecommendations,
    applyOptimization,
    getQualityStats,
    isTransitioning,
    qualityConfig: modelQualityConfig
  };

  return (
    <ModelQualityContext.Provider value={value}>
      {children}
    </ModelQualityContext.Provider>
  );
};

/**
 * 质量控制面板组件
 */
export const QualityControlPanel = ({ open = false, onClose }) => {
  const {
    qualityLevel,
    setQualityLevel,
    autoAdjust,
    setAutoAdjust,
    performanceMetrics,
    getQualityStats,
    applyOptimization,
    qualityConfig
  } = useModelQuality();

  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState('quality');

  // 定期更新统计信息
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getQualityStats());
    }, 1000);
    return () => clearInterval(interval);
  }, [getQualityStats]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 20,
        width: 350,
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 1000,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3
      }}
    >
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TuneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            模型质量控制
          </Typography>

          {/* 质量设置 */}
          <Accordion expanded={expanded === 'quality'} onChange={handleAccordionChange('quality')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>质量设置</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoAdjust}
                        onChange={(e) => setAutoAdjust(e.target.checked)}
                      />
                    }
                    label="自动调整质量"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>质量级别</InputLabel>
                    <Select
                      value={qualityLevel}
                      onChange={(e) => setQualityLevel(e.target.value)}
                      disabled={autoAdjust}
                    >
                      {Object.entries(qualityConfig.qualityLevels).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          {config.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    当前配置:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {stats && stats.currentConfig && (
                      <>
                        <Chip size="small" label={`阴影: ${stats.currentConfig.shadowMapSize}px`} sx={{ mr: 0.5, mb: 0.5 }} />
                        <Chip size="small" label={`纹理: ${Math.round(stats.currentConfig.textureQuality * 100)}%`} sx={{ mr: 0.5, mb: 0.5 }} />
                        <Chip size="small" label={`几何: ${Math.round(stats.currentConfig.geometryDetail * 100)}%`} sx={{ mr: 0.5, mb: 0.5 }} />
                        <Chip size="small" label={`粒子: ${stats.currentConfig.particleCount}`} sx={{ mr: 0.5, mb: 0.5 }} />
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* 性能监控 */}
          <Accordion expanded={expanded === 'performance'} onChange={handleAccordionChange('performance')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>性能监控</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <SpeedIcon color="primary" />
                    <Typography variant="h6">{Math.round(performanceMetrics.fps)}</Typography>
                    <Typography variant="caption">FPS</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <MemoryIcon color="secondary" />
                    <Typography variant="h6">{Math.round(performanceMetrics.memoryUsage)}</Typography>
                    <Typography variant="caption">MB</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    帧时间: {Math.round(performanceMetrics.frameTime)}ms
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(performanceMetrics.frameTime / 33.33 * 100, 100)}
                    color={performanceMetrics.frameTime < 16.67 ? 'success' : performanceMetrics.frameTime < 33.33 ? 'warning' : 'error'}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    三角面数: {performanceMetrics.triangleCount.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* 优化建议 */}
          <Accordion expanded={expanded === 'recommendations'} onChange={handleAccordionChange('recommendations')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>优化建议</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {stats && stats.recommendations && stats.recommendations.length > 0 ? (
                <List dense>
                  {stats.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AssessmentIcon color={rec.type === 'warning' ? 'warning' : 'info'} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={rec.message}
                        secondary={
                          <Button 
                            size="small" 
                            onClick={() => applyOptimization(rec.action)}
                            sx={{ mt: 0.5 }}
                          >
                            应用建议
                          </Button>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  当前性能良好，无需优化
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* 历史统计 */}
          <Accordion expanded={expanded === 'history'} onChange={handleAccordionChange('history')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>历史统计</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {stats && stats.performanceStats ? (
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      平均FPS: {Math.round(stats.performanceStats.averageFPS)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      平均帧时间: {Math.round(stats.performanceStats.averageFrameTime)}ms
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      平均内存: {Math.round(stats.performanceStats.averageMemory)}MB
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      数据点: {stats.performanceStats.dataPoints}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      质量调整次数: {stats.performanceStats.qualityChanges}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  暂无历史数据
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ModelQualityProvider;