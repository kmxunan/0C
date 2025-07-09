import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  Settings,
  Speed,
  Memory,
  Visibility,
  VisibilityOff,
  Refresh,
  Save,
  Restore,
  TuneOutlined,
  Assessment,
  ModelTraining
} from '@mui/icons-material';
import { useModelQuality } from './ModelQualityManager';
import { usePerformanceOptimizer } from './PerformanceOptimizer';
import { useModelOptimizer } from './ModelOptimizer';
import { modelQualityConfig } from './modelQualityConfig';

/**
 * 模型质量控制面板组件
 * 提供3D模型质量管理和LOD控制的用户界面
 */
const ModelQualityControlPanel = ({ 
  className = '',
  position = 'top-right',
  expanded = false,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [activeTab, setActiveTab] = useState('quality');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const {
    qualityLevel,
    setQualityLevel,
    lodLevel,
    performanceMetrics,
    qualityHistory,
    getQualityStats,
    applyOptimization
  } = useModelQuality();
  
  const {
    getPerformanceMetrics,
    getOptimizationStrategy
  } = usePerformanceOptimizer();
  
  const {
    optimizeModel,
    isOptimizing,
    optimizationProgress,
    optimizationError
  } = useModelOptimizer();

  const [localSettings, setLocalSettings] = useState({
    autoOptimization: true,
    adaptiveQuality: true,
    lodEnabled: true,
    textureCompression: true,
    geometrySimplification: true,
    performanceTarget: 60,
    memoryLimit: 1024
  });

  // 获取当前性能指标
  const currentMetrics = getPerformanceMetrics();
  const qualityStats = getQualityStats();

  // 处理质量级别变化
  const handleQualityChange = (event, newValue) => {
    const qualityLevels = ['low', 'medium', 'high', 'ultra'];
    const newQuality = qualityLevels[newValue];
    setQualityLevel(newQuality);
  };

  // 处理设置变化
  const handleSettingChange = (setting, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // 应用优化设置
  const handleApplyOptimization = async () => {
    try {
      await applyOptimization({
        qualityLevel,
        ...localSettings
      });
    } catch (error) {
      console.error('应用优化失败:', error);
    }
  };

  // 重置设置
  const handleResetSettings = () => {
    setLocalSettings({
      autoOptimization: true,
      adaptiveQuality: true,
      lodEnabled: true,
      textureCompression: true,
      geometrySimplification: true,
      performanceTarget: 60,
      memoryLimit: 1024
    });
    setQualityLevel('medium');
  };

  // 获取质量级别颜色
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'low': return '#ff6b6b';
      case 'medium': return '#ffa502';
      case 'high': return '#2ed573';
      case 'ultra': return '#3742fa';
      default: return '#747d8c';
    }
  };

  // 获取性能状态颜色
  const getPerformanceColor = (fps) => {
    if (fps >= 60) return '#2ed573';
    if (fps >= 30) return '#ffa502';
    return '#ff6b6b';
  };

  // 渲染质量控制面板
  const renderQualityPanel = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        模型质量控制
      </Typography>
      
      {/* 质量级别选择 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          质量级别
        </Typography>
        <Slider
          value={['low', 'medium', 'high', 'ultra'].indexOf(qualityLevel)}
          onChange={handleQualityChange}
          min={0}
          max={3}
          step={1}
          marks={[
            { value: 0, label: '低' },
            { value: 1, label: '中' },
            { value: 2, label: '高' },
            { value: 3, label: '超高' }
          ]}
          sx={{
            '& .MuiSlider-thumb': {
              backgroundColor: getQualityColor(qualityLevel)
            },
            '& .MuiSlider-track': {
              backgroundColor: getQualityColor(qualityLevel)
            }
          }}
        />
      </Box>

      {/* 当前质量状态 */}
      <Card sx={{ mb: 2, bgcolor: 'rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                当前质量
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={qualityLevel.toUpperCase()} 
                  size="small"
                  sx={{ 
                    bgcolor: getQualityColor(qualityLevel),
                    color: 'white'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                LOD级别
              </Typography>
              <Typography variant="body2">
                {lodLevel || 0}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 优化选项 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          优化选项
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={localSettings.autoOptimization}
              onChange={(e) => handleSettingChange('autoOptimization', e.target.checked)}
            />
          }
          label="自动优化"
        />
        <FormControlLabel
          control={
            <Switch
              checked={localSettings.adaptiveQuality}
              onChange={(e) => handleSettingChange('adaptiveQuality', e.target.checked)}
            />
          }
          label="自适应质量"
        />
        <FormControlLabel
          control={
            <Switch
              checked={localSettings.lodEnabled}
              onChange={(e) => handleSettingChange('lodEnabled', e.target.checked)}
            />
          }
          label="LOD系统"
        />
      </Box>

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleApplyOptimization}
          disabled={isOptimizing}
          startIcon={<Save />}
        >
          应用设置
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleResetSettings}
          startIcon={<Restore />}
        >
          重置
        </Button>
      </Box>
    </Box>
  );

  // 渲染性能监控面板
  const renderPerformancePanel = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        性能监控
      </Typography>
      
      {/* 性能指标 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="textSecondary">
                FPS
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ color: getPerformanceColor(currentMetrics?.fps || 0) }}
              >
                {Math.round(currentMetrics?.fps || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="textSecondary">
                内存 (MB)
              </Typography>
              <Typography variant="h6">
                {Math.round((currentMetrics?.memoryUsage || 0) / 1024 / 1024)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="textSecondary">
                三角形数
              </Typography>
              <Typography variant="h6">
                {(currentMetrics?.triangleCount || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="textSecondary">
                渲染时间 (ms)
              </Typography>
              <Typography variant="h6">
                {Math.round(currentMetrics?.frameTime || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 性能目标设置 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          性能目标 (FPS)
        </Typography>
        <Slider
          value={localSettings.performanceTarget}
          onChange={(e, value) => handleSettingChange('performanceTarget', value)}
          min={30}
          max={120}
          step={10}
          marks={[
            { value: 30, label: '30' },
            { value: 60, label: '60' },
            { value: 120, label: '120' }
          ]}
          valueLabelDisplay="auto"
        />
      </Box>

      {/* 内存限制设置 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          内存限制 (MB)
        </Typography>
        <Slider
          value={localSettings.memoryLimit}
          onChange={(e, value) => handleSettingChange('memoryLimit', value)}
          min={256}
          max={4096}
          step={256}
          marks={[
            { value: 256, label: '256' },
            { value: 1024, label: '1GB' },
            { value: 2048, label: '2GB' },
            { value: 4096, label: '4GB' }
          ]}
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );

  // 渲染高级设置面板
  const renderAdvancedPanel = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        高级设置
      </Typography>
      
      {/* 纹理设置 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">纹理优化</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.textureCompression}
                onChange={(e) => handleSettingChange('textureCompression', e.target.checked)}
              />
            }
            label="纹理压缩"
          />
          <Typography variant="caption" color="textSecondary">
            启用纹理压缩以减少内存使用
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 几何体设置 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">几何体优化</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.geometrySimplification}
                onChange={(e) => handleSettingChange('geometrySimplification', e.target.checked)}
              />
            }
            label="几何体简化"
          />
          <Typography variant="caption" color="textSecondary">
            自动简化复杂几何体以提升性能
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 质量统计 */}
      {qualityStats && (
        <Card sx={{ mt: 2, bgcolor: 'rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              质量统计
            </Typography>
            <Typography variant="caption" color="textSecondary">
              平均质量: {qualityStats.averageQuality || 'N/A'}
            </Typography>
            <br />
            <Typography variant="caption" color="textSecondary">
              优化次数: {qualityStats.optimizationCount || 0}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // 获取面板位置样式
  const getPositionStyle = () => {
    const baseStyle = {
      position: 'fixed',
      zIndex: 1000,
      maxWidth: 400,
      maxHeight: '80vh',
      overflow: 'auto'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: 16, left: 16 };
      case 'top-right':
        return { ...baseStyle, top: 16, right: 16 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 16, left: 16 };
      case 'bottom-right':
        return { ...baseStyle, bottom: 16, right: 16 };
      default:
        return { ...baseStyle, top: 16, right: 16 };
    }
  };

  return (
    <Paper
      className={className}
      elevation={8}
      sx={{
        ...getPositionStyle(),
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2
      }}
    >
      {/* 头部 */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneOutlined />
          模型质量控制
        </Typography>
        <Box>
          <Tooltip title="高级设置">
            <IconButton
              size="small"
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{ color: showAdvanced ? 'primary.main' : 'inherit' }}
            >
              <Settings />
            </IconButton>
          </Tooltip>
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <VisibilityOff />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* 优化进度 */}
      {isOptimizing && (
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="textSecondary">
            正在优化模型...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={optimizationProgress} 
            sx={{ mt: 1 }}
          />
        </Box>
      )}

      {/* 错误提示 */}
      {optimizationError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {optimizationError}
        </Alert>
      )}

      {/* 标签页 */}
      <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex' }}>
          <Button
            size="small"
            onClick={() => setActiveTab('quality')}
            sx={{ 
              borderRadius: 0,
              borderBottom: activeTab === 'quality' ? '2px solid' : 'none',
              borderColor: 'primary.main'
            }}
          >
            质量控制
          </Button>
          <Button
            size="small"
            onClick={() => setActiveTab('performance')}
            sx={{ 
              borderRadius: 0,
              borderBottom: activeTab === 'performance' ? '2px solid' : 'none',
              borderColor: 'primary.main'
            }}
          >
            性能监控
          </Button>
          {showAdvanced && (
            <Button
              size="small"
              onClick={() => setActiveTab('advanced')}
              sx={{ 
                borderRadius: 0,
                borderBottom: activeTab === 'advanced' ? '2px solid' : 'none',
                borderColor: 'primary.main'
              }}
            >
              高级设置
            </Button>
          )}
        </Box>
      </Box>

      {/* 内容区域 */}
      {activeTab === 'quality' && renderQualityPanel()}
      {activeTab === 'performance' && renderPerformancePanel()}
      {activeTab === 'advanced' && showAdvanced && renderAdvancedPanel()}
    </Paper>
  );
};

export default ModelQualityControlPanel;