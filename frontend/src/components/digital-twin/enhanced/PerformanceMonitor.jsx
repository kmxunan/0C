import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  // LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Speed,
  Memory,
  Visibility,
  ExpandMore,
  ExpandLess,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * 性能统计钩子
 */
const usePerformanceStats = () => {
  const [stats, setStats] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0
  });
  
  const { gl } = useThree();
  // const scene = useThree().scene; // 未使用，已注释
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef([]);
  
  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime.current;
    
    // 每秒更新一次统计信息
    if (deltaTime >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / deltaTime);
      const frameTime = deltaTime / frameCount.current;
      
      // 更新FPS历史记录
      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > 60) {
        fpsHistory.current.shift();
      }
      
      // 获取渲染器信息
      const info = gl.info;
      
      // 获取内存使用情况（如果可用）
      let memoryUsage = 0;
      if (performance.memory) {
        memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      }
      
      setStats({
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        memoryUsage,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length || 0
      });
      
      frameCount.current = 0;
      lastTime.current = currentTime;
    }
  });
  
  return { stats, fpsHistory: fpsHistory.current };
};

/**
 * 性能指标卡片组件
 */
const PerformanceCard = ({ title, value, unit, icon, color, warning, optimal }) => {
  const getStatusColor = () => {
    if (warning && value > warning) return '#f44336';
    if (optimal && value >= optimal) return '#4caf50';
    return color || '#2196f3';
  };
  
  const getStatusIcon = () => {
    if (warning && value > warning) return <Warning sx={{ fontSize: 16 }} />;
    if (optimal && value >= optimal) return <CheckCircle sx={{ fontSize: 16 }} />;
    return icon;
  };
  
  return (
    <Card sx={{ 
      backgroundColor: 'rgba(255,255,255,0.1)', 
      backdropFilter: 'blur(10px)',
      border: `1px solid ${getStatusColor()}`,
      height: '100%'
    }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: getStatusColor(), mr: 1 }}>
            {getStatusIcon()}
          </Box>
          <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: getStatusColor(), 
              fontWeight: 'bold',
              mr: 0.5
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {unit && (
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.6 }}>
              {unit}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * FPS图表组件
 */
const FPSChart = ({ fpsHistory, height = 60 }) => {
  const canvasRef = useRef();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fpsHistory.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const chartHeight = canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, chartHeight);
    
    // 绘制背景
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, width, chartHeight);
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    
    // 水平网格线
    for (let i = 0; i <= 4; i++) {
      const y = (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // 垂直网格线
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();
    }
    
    // 绘制FPS曲线
    if (fpsHistory.length > 1) {
      const maxFPS = Math.max(...fpsHistory, 60);
      const minFPS = Math.min(...fpsHistory, 0);
      const fpsRange = maxFPS - minFPS || 1;
      
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      fpsHistory.forEach((fps, index) => {
        const x = (index / (fpsHistory.length - 1)) * width;
        const y = chartHeight - ((fps - minFPS) / fpsRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // 绘制填充区域
      ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
      ctx.lineTo(width, chartHeight);
      ctx.lineTo(0, chartHeight);
      ctx.closePath();
      ctx.fill();
    }
    
    // 绘制标签
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('60 FPS', 5, 12);
    ctx.fillText('30 FPS', 5, chartHeight / 2 + 4);
    ctx.fillText('0 FPS', 5, chartHeight - 4);
    
  }, [fpsHistory]);
  
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      style={{
        width: '100%',
        height: `${height}px`,
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '4px'
      }}
    />
  );
};

/**
 * 性能监控主组件
 */
const PerformanceMonitor = ({ position = 'top-right', expanded: initialExpanded = false }) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const { stats, fpsHistory } = usePerformanceStats();
  
  const getPositionStyles = () => {
    const base = {
      position: 'absolute',
      zIndex: 1000,
      minWidth: expanded ? 320 : 200,
      maxWidth: 400
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
        return { ...base, top: 16, right: 16 };
    }
  };
  
  const getFPSStatus = () => {
    if (stats.fps >= 55) return { color: '#4caf50', status: '优秀' };
    if (stats.fps >= 30) return { color: '#ff9800', status: '良好' };
    return { color: '#f44336', status: '需优化' };
  };
  
  const getMemoryStatus = () => {
    if (stats.memoryUsage < 100) return { color: '#4caf50', status: '正常' };
    if (stats.memoryUsage < 200) return { color: '#ff9800', status: '注意' };
    return { color: '#f44336', status: '警告' };
  };
  
  const fpsStatus = getFPSStatus();
  const memoryStatus = getMemoryStatus();
  
  return (
    <Box sx={getPositionStyles()}>
      {/* 性能监控头部 */}
      <Box sx={{
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: expanded ? '8px 8px 0 0' : '8px',
        border: '1px solid rgba(255,255,255,0.2)',
        borderBottom: expanded ? 'none' : '1px solid rgba(255,255,255,0.2)',
        p: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Speed sx={{ color: '#2196f3', mr: 1 }} />
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
              性能监控
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              label={`${stats.fps} FPS`}
              size="small"
              sx={{
                backgroundColor: fpsStatus.color,
                color: 'white',
                fontWeight: 'bold',
                mr: 1
              }}
            />
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'white' }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        
        {!expanded && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.8, mr: 2 }}>
              状态: {fpsStatus.status}
            </Typography>
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
              内存: {stats.memoryUsage}MB
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* 详细信息面板 */}
      <Collapse in={expanded}>
        <Box sx={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '0 0 8px 8px',
          border: '1px solid rgba(255,255,255,0.2)',
          borderTop: 'none',
          p: 2
        }}>
          {/* FPS图表 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.8, mb: 1, display: 'block' }}>
              FPS 趋势图
            </Typography>
            <FPSChart fpsHistory={fpsHistory} />
          </Box>
          
          {/* 性能指标网格 */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <PerformanceCard
                title="帧率"
                value={stats.fps}
                unit="FPS"
                icon={<Speed sx={{ fontSize: 16 }} />}
                color={fpsStatus.color}
                optimal={55}
                warning={30}
              />
            </Grid>
            <Grid item xs={6}>
              <PerformanceCard
                title="帧时间"
                value={stats.frameTime}
                unit="ms"
                icon={<Speed sx={{ fontSize: 16 }} />}
                color="#ff9800"
                warning={33}
              />
            </Grid>
            <Grid item xs={6}>
              <PerformanceCard
                title="内存使用"
                value={stats.memoryUsage}
                unit="MB"
                icon={<Memory sx={{ fontSize: 16 }} />}
                color={memoryStatus.color}
                warning={200}
              />
            </Grid>
            <Grid item xs={6}>
              <PerformanceCard
                title="绘制调用"
                value={stats.drawCalls}
                unit="次"
                icon={<Visibility sx={{ fontSize: 16 }} />}
                color="#9c27b0"
                warning={1000}
              />
            </Grid>
          </Grid>
          
          {/* 渲染统计 */}
          <Box sx={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            p: 1.5
          }}>
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.8, mb: 1, display: 'block' }}>
              渲染统计
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.6 }}>
                  三角形: {stats.triangles.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.6 }}>
                  几何体: {stats.geometries}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.6 }}>
                  纹理: {stats.textures}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.6 }}>
                  着色器: {stats.programs}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default PerformanceMonitor;