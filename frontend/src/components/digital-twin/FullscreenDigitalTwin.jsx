import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, Fade, Tooltip, Paper } from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  Settings,
  ViewInAr,
  Navigation,
  Layers,
  Speed,
  Info,
  Home,
  CameraAlt,
  Refresh,
  Map,
  Videocam
} from '@mui/icons-material';
import EnhancedDigitalTwinViewer from './enhanced/EnhancedDigitalTwinViewer';
import FullscreenControls from './enhanced/FullscreenControls';
import PerformanceMonitor from './enhanced/PerformanceMonitor';
import { ModelQualityProvider, QualityControlPanel } from './utils/ModelQualityManager';
import { PerformanceOptimizerProvider } from './utils/PerformanceOptimizer';
import { ModelCacheProvider } from './utils/ModelCacheManager';
import { LODProvider } from './utils/LODSystem';
import { ModelPreloaderProvider, PreloadControlPanel } from './utils/ModelPreloader';
import { ModelPerformanceAnalyzerProvider, PerformanceAnalysisPanel } from './utils/ModelPerformanceAnalyzer';
import { ModelBatchOptimizerProvider, BatchOptimizationPanel } from './utils/ModelBatchOptimizer';
import ModelQualityControlPanel from './utils/ModelQualityControlPanel';
import { useDigitalTwinStore } from '../../stores/digitalTwinStore';
import { useFullscreenStore } from '../../stores/fullscreenStore';

/**
 * 全屏数字孪生主组件
 * 提供沉浸式的3D数字孪生体验
 */
const FullscreenDigitalTwin = ({ onClose }) => {
  const containerRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [showPreloadPanel, setShowPreloadPanel] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showViewportManager, setShowViewportManager] = useState(true);
  const [force2DMinimap, setForce2DMinimap] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  
  // 状态管理
  const {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    fullscreenError
  } = useFullscreenStore();
  
  const {
    selectedBuilding,
    campusData,
    isLoading,
    error
  } = useDigitalTwinStore();

  // 自动隐藏控制面板
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    setShowControls(true);
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000); // 3秒后隐藏
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  // 鼠标移动时显示控制面板
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // 键盘快捷键处理
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'Escape':
        if (isFullscreen) {
          exitFullscreen();
        } else if (onClose) {
          onClose();
        }
        break;
      case 'F11':
        event.preventDefault();
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen(containerRef.current);
        }
        break;
      case 'h':
      case 'H':
        setShowControls(prev => !prev);
        break;
      case 'p':
      case 'P':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setShowPerformance(prev => !prev);
        }
        break;
      case 'q':
      case 'Q':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setShowQualityPanel(prev => !prev);
        }
        break;
      default:
        break;
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen, onClose]);

  // 全屏切换处理
  const handleFullscreenToggle = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen(containerRef.current);
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // 组件挂载时的初始化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown);
    container.addEventListener('mousemove', handleMouseMove);
    
    // 初始化控制面板自动隐藏
    resetControlsTimeout();

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [handleKeyDown, handleMouseMove, resetControlsTimeout, controlsTimeout]);

  // 全屏状态变化时的处理
  useEffect(() => {
    if (fullscreenError) {
      console.error('全屏模式错误:', fullscreenError);
    }
  }, [fullscreenError]);

  return (
    <PerformanceOptimizerProvider>
      <ModelQualityProvider>
        <ModelCacheProvider>
        <LODProvider>
          <ModelPreloaderProvider>
            <ModelPerformanceAnalyzerProvider>
              <ModelBatchOptimizerProvider>
              <Box
              ref={containerRef}
              sx={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                backgroundColor: '#000',
                overflow: 'hidden',
                cursor: showControls ? 'default' : 'none',
                '&:fullscreen': {
                  width: '100vw',
                  height: '100vh'
                }
              }}
            >
      {/* 增强版3D查看器 */}
      <EnhancedDigitalTwinViewer
        className="fullscreen-3d-viewer"
        showPerformanceMonitor={showPerformance}
        enableAdvancedEffects={true}
        autoRotate={false}
        showMinimap={showMinimap}
        showViewportManager={showViewportManager}
        force2DMinimap={force2DMinimap}
        settings={{
          quality: 'high',
          particles: true,
          shadows: true,
          animations: true,
          dataFlow: true,
          timeOfDay: 12
        }}
      />
      
      {/* 独立性能监控器 */}
      {showPerformance && (
        <PerformanceMonitor
          position="top-left"
          expanded={true}
        />
      )}
      
      {/* 模型质量控制面板 */}
      {showQualityPanel && (
        <ModelQualityControlPanel
          position="top-right"
          onClose={() => setShowQualityPanel(false)}
        />
      )}
      
      {/* 预加载控制面板 */}
       {showPreloadPanel && (
         <PreloadControlPanel />
       )}
       
       {/* 性能分析面板 */}
        {showAnalysisPanel && (
          <PerformanceAnalysisPanel />
        )}
        
        {/* 批量优化面板 */}
        {showBatchPanel && (
          <BatchOptimizationPanel />
        )}

      {/* 顶部控制栏 */}
      <Fade in={showControls} timeout={300}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            zIndex: 1000
          }}
        >
          {/* 全屏切换按钮 */}
          <Tooltip title={isFullscreen ? '退出全屏 (Esc)' : '进入全屏 (F11)'}>
            <IconButton
              onClick={handleFullscreenToggle}
              sx={{ color: 'white' }}
              size="small"
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>

          {/* 视角重置 */}
          <Tooltip title="重置视角">
            <IconButton sx={{ color: 'white' }} size="small">
              <Home />
            </IconButton>
          </Tooltip>

          {/* 截图功能 */}
          <Tooltip title="截图">
            <IconButton sx={{ color: 'white' }} size="small">
              <CameraAlt />
            </IconButton>
          </Tooltip>

          {/* 刷新数据 */}
          <Tooltip title="刷新数据">
            <IconButton sx={{ color: 'white' }} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>

          {/* 小地图切换 */}
          <Tooltip title={`小地图导航 (${force2DMinimap ? '2D' : '3D'})`}>
            <IconButton
              onClick={() => setShowMinimap(prev => !prev)}
              onDoubleClick={() => setForce2DMinimap(prev => !prev)}
              sx={{ 
                color: showMinimap ? '#4caf50' : 'white',
                border: force2DMinimap ? '1px solid #ff9800' : 'none'
              }}
              size="small"
            >
              <Map />
            </IconButton>
          </Tooltip>

          {/* 视角管理器切换 */}
          <Tooltip title="视角管理">
            <IconButton
              onClick={() => setShowViewportManager(prev => !prev)}
              sx={{ 
                color: showViewportManager ? '#4caf50' : 'white'
              }}
              size="small"
            >
              <Videocam />
            </IconButton>
          </Tooltip>

          {/* 图层控制 */}
          <Tooltip title="图层管理">
            <IconButton sx={{ color: 'white' }} size="small">
              <Layers />
            </IconButton>
          </Tooltip>

          {/* 性能监控切换 */}
          <Tooltip title="性能监控 (Ctrl+P)">
            <IconButton
              onClick={() => setShowPerformance(prev => !prev)}
              sx={{ 
                color: showPerformance ? '#4caf50' : 'white'
              }}
              size="small"
            >
              <Speed />
            </IconButton>
          </Tooltip>

          {/* 质量控制面板切换 */}
          <Tooltip title="模型质量控制 (Ctrl+Q)">
            <IconButton
              onClick={() => setShowQualityPanel(prev => !prev)}
              sx={{ 
                color: showQualityPanel ? '#4caf50' : 'white'
              }}
              size="small"
            >
              <ViewInAr />
            </IconButton>
          </Tooltip>

          {/* 预加载控制面板切换 */}
           <Tooltip title="模型预加载控制">
             <IconButton
               onClick={() => setShowPreloadPanel(prev => !prev)}
               sx={{ 
                 color: showPreloadPanel ? '#4caf50' : 'white'
               }}
               size="small"
             >
               <Refresh />
             </IconButton>
           </Tooltip>

           {/* 性能分析面板切换 */}
            <Tooltip title="性能分析">
              <IconButton
                onClick={() => setShowAnalysisPanel(prev => !prev)}
                sx={{ 
                  color: showAnalysisPanel ? '#4caf50' : 'white'
                }}
                size="small"
              >
                <Speed />
              </IconButton>
            </Tooltip>

            {/* 批量优化面板切换 */}
            <Tooltip title="批量模型优化">
              <IconButton
                onClick={() => setShowBatchPanel(prev => !prev)}
                sx={{ 
                  color: showBatchPanel ? '#4caf50' : 'white'
                }}
                size="small"
              >
                <Settings />
              </IconButton>
            </Tooltip>

          {/* 设置 */}
          <Tooltip title="设置">
            <IconButton sx={{ color: 'white' }} size="small">
              <Settings />
            </IconButton>
          </Tooltip>

          {/* 帮助信息 */}
          <Tooltip title="帮助 (H键切换控制面板)">
            <IconButton sx={{ color: 'white' }} size="small">
              <Info />
            </IconButton>
          </Tooltip>
        </Paper>
      </Fade>

      {/* 左侧信息面板 */}
      <Fade in={showControls} timeout={300}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 80,
            left: 16,
            width: 300,
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            overflow: 'hidden',
            zIndex: 999
          }}
        >
          <FullscreenControls
            selectedBuilding={selectedBuilding}
            campusData={campusData}
            isLoading={isLoading}
            error={error}
          />
        </Paper>
      </Fade>

      {/* 底部状态栏 */}
      <Fade in={showControls} timeout={300}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 3,
            py: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            zIndex: 1000,
            color: 'white',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box>零碳园区数字孪生系统</Box>
          <Box sx={{ opacity: 0.7 }}>|</Box>
          <Box sx={{ opacity: 0.8 }}>
            {isLoading ? '加载中...' : 
             error ? '连接错误' : 
             campusData ? `${campusData.buildings?.length || 0} 栋建筑` : '无数据'}
          </Box>
          <Box sx={{ opacity: 0.7 }}>|</Box>
          <Box sx={{ opacity: 0.6, fontSize: '0.75rem' }}>
            按 H 键切换控制面板 • 按 Esc 键退出
          </Box>
        </Paper>
      </Fade>

      {/* 加载指示器 */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center',
            zIndex: 1001
          }}
        >
          <Box sx={{ mb: 2, fontSize: '1.2rem' }}>正在加载数字孪生场景...</Box>
          <Box sx={{ 
            width: 200, 
            height: 4, 
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundColor: '#4caf50',
                animation: 'loading 2s ease-in-out infinite',
                '@keyframes loading': {
                  '0%': { transform: 'translateX(-100%)' },
                  '50%': { transform: 'translateX(0%)' },
                  '100%': { transform: 'translateX(100%)' }
                }
              }}
            />
          </Box>
        </Box>
      )}

      {/* 错误提示 */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#f44336',
            textAlign: 'center',
            zIndex: 1001,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 3,
            borderRadius: 2,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ fontSize: '1.2rem', mb: 1 }}>加载失败</Box>
          <Box sx={{ opacity: 0.8 }}>{error}</Box>
        </Box>
      )}
            </Box>
              </ModelBatchOptimizerProvider>
            </ModelPerformanceAnalyzerProvider>
          </ModelPreloaderProvider>
        </LODProvider>
      </ModelCacheProvider>
      </ModelQualityProvider>
    </PerformanceOptimizerProvider>
  );
};

export default FullscreenDigitalTwin;