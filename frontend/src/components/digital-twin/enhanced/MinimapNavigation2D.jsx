import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Map,
  MyLocation,
  ZoomIn,
  ZoomOut,
  Visibility,
  VisibilityOff,
  CenterFocusStrong,
  Navigation as NavigationIcon
} from '@mui/icons-material';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';

/**
 * 2D小地图导航组件（WebGL备用方案）
 * 使用Canvas 2D API而不是WebGL，避免上下文丢失问题
 */
const MinimapNavigation2D = ({ 
  position = 'bottom-left',
  size = { width: 300, height: 200 },
  mainCamera,
  onNavigate,
  visible = true,
  onVisibilityChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minimapZoom, setMinimapZoom] = useState(1);
  const [showDevices, setShowDevices] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [mainCameraPosition, setMainCameraPosition] = useState({ x: 0, z: 0 });
  const canvasRef = useRef();
  const animationRef = useRef();
  
  // 从状态管理获取数据
  const {
    campusData,
    selectedBuilding,
    devices
  } = useDigitalTwinStore();

  // 获取位置样式
  const getPositionStyles = () => {
    const base = {
      position: 'absolute',
      zIndex: 1000
    };
    
    switch (position) {
      case 'top-left':
        return { ...base, top: 16, left: 16 };
      case 'top-right':
        return { ...base, top: 16, right: 16 };
      case 'bottom-left':
        return { ...base, bottom: 16, left: 16 };
      case 'bottom-right':
        return { ...base, bottom: 16, right: 16 };
      default:
        return { ...base, bottom: 16, left: 16 };
    }
  };

  // 绘制2D小地图
  const drawMinimap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 设置坐标系（中心为原点）
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(minimapZoom, minimapZoom);
    
    // 绘制网格
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    const gridSize = 10;
    const gridRange = 100;
    
    for (let i = -gridRange; i <= gridRange; i += gridSize) {
      // 垂直线
      ctx.beginPath();
      ctx.moveTo(i, -gridRange);
      ctx.lineTo(i, gridRange);
      ctx.stroke();
      
      // 水平线
      ctx.beginPath();
      ctx.moveTo(-gridRange, i);
      ctx.lineTo(gridRange, i);
      ctx.stroke();
    }
    
    // 绘制建筑物
    if (showBuildings && campusData?.buildings) {
      campusData.buildings.forEach((building, index) => {
        const x = building.x || 0;
        const z = building.z || 0;
        const width = building.width || 10;
        const depth = building.depth || 10;
        
        ctx.fillStyle = building.id === selectedBuilding ? '#4caf50' : '#2196f3';
        ctx.fillRect(x - width/2, z - depth/2, width, depth);
        
        // 建筑标签
        if (building.name) {
          ctx.fillStyle = '#fff';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(building.name, x, z + 2);
        }
      });
    }
    
    // 绘制设备
    if (showDevices && devices) {
      devices.forEach((device, index) => {
        const x = device.x || 0;
        const z = device.z || 0;
        
        ctx.fillStyle = device.status === 'active' ? '#4caf50' : '#ff9800';
        ctx.beginPath();
        ctx.arc(x, z, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // 绘制相机位置指示器
    if (mainCameraPosition) {
      const { x, z } = mainCameraPosition;
      
      // 相机位置（红色三角形）
      ctx.fillStyle = '#f44336';
      ctx.beginPath();
      ctx.moveTo(x, z - 3);
      ctx.lineTo(x - 2, z + 2);
      ctx.lineTo(x + 2, z + 2);
      ctx.closePath();
      ctx.fill();
      
      // 相机视野范围（扇形）
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(x, z, 15, -Math.PI/4, Math.PI/4);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  };

  // 处理画布点击
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !onNavigate) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvas.width / 2;
    const z = event.clientY - rect.top - canvas.height / 2;
    
    // 转换为世界坐标
    const worldX = x / minimapZoom;
    const worldZ = z / minimapZoom;
    
    onNavigate({ x: worldX, y: 10, z: worldZ });
  };

  // 更新相机位置
  useEffect(() => {
    if (mainCamera) {
      const updateCameraPosition = () => {
        setMainCameraPosition({
          x: mainCamera.position.x,
          z: mainCamera.position.z
        });
      };
      
      updateCameraPosition();
      
      // 定期更新
      const interval = setInterval(updateCameraPosition, 100);
      return () => clearInterval(interval);
    }
  }, [mainCamera]);

  // 绘制循环
  useEffect(() => {
    const animate = () => {
      drawMinimap();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [minimapZoom, showDevices, showBuildings, mainCameraPosition, campusData, selectedBuilding, devices]);

  if (!visible) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        ...getPositionStyles(),
        width: isExpanded ? size.width + 100 : size.width,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 标题栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Map sx={{ color: 'white', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color: 'white' }}>
            园区导航 (2D)
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="展开/收起">
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ color: 'white' }}
            >
              {isExpanded ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
          
          {onVisibilityChange && (
            <Tooltip title="关闭">
              <IconButton
                size="small"
                onClick={() => onVisibilityChange(false)}
                sx={{ color: 'white' }}
              >
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* 2D画布 */}
      <Box sx={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={size.width}
          height={size.height}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            cursor: 'crosshair',
            backgroundColor: '#1a1a1a'
          }}
        />
        
        {/* 缩放控制 */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          <Tooltip title="放大">
            <IconButton
              size="small"
              onClick={() => setMinimapZoom(prev => Math.min(prev * 1.2, 3))}
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="缩小">
            <IconButton
              size="small"
              onClick={() => setMinimapZoom(prev => Math.max(prev / 1.2, 0.5))}
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <ZoomOut fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* 状态指示器 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            color: 'white',
            fontSize: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '2px 6px',
            borderRadius: 1
          }}
        >
          缩放: {minimapZoom.toFixed(1)}x
        </Box>
      </Box>

      {/* 扩展控制面板 */}
      {isExpanded && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="caption" sx={{ color: 'white', mb: 1, display: 'block' }}>
            显示选项
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={showBuildings}
                onChange={(e) => setShowBuildings(e.target.checked)}
                size="small"
              />
            }
            label="建筑物"
            sx={{ color: 'white', mb: 0.5 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showDevices}
                onChange={(e) => setShowDevices(e.target.checked)}
                size="small"
              />
            }
            label="设备"
            sx={{ color: 'white' }}
          />
          
          <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <Typography variant="caption" sx={{ color: 'white', mb: 1, display: 'block' }}>
            缩放级别
          </Typography>
          
          <Slider
            value={minimapZoom}
            onChange={(e, value) => setMinimapZoom(value)}
            min={0.5}
            max={3}
            step={0.1}
            size="small"
            sx={{
              color: '#4caf50',
              '& .MuiSlider-thumb': {
                backgroundColor: '#4caf50'
              },
              '& .MuiSlider-track': {
                backgroundColor: '#4caf50'
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default MinimapNavigation2D;