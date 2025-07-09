import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrthographicCamera, Html } from '@react-three/drei';
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
import * as THREE from 'three';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';

/**
 * 小地图相机组件
 * 提供俯视角度的场景概览
 */
const MinimapCamera = ({ mainCamera, onCameraUpdate }) => {
  const { camera, scene } = useThree();
  const [position, setPosition] = useState([0, 100, 0]);
  const [zoom, setZoom] = useState(1);

  useFrame(() => {
    if (mainCamera && onCameraUpdate) {
      // 同步主相机位置到小地图
      const mainPos = mainCamera.position;
      setPosition([mainPos.x, 100, mainPos.z]);
      onCameraUpdate({
        position: mainPos,
        target: mainCamera.getWorldDirection(new THREE.Vector3())
      });
    }
  });

  useEffect(() => {
    if (camera) {
      camera.position.set(...position);
      camera.lookAt(position[0], 0, position[2]);
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, position, zoom]);

  return null;
};

/**
 * 小地图场景内容
 * 渲染简化的园区布局
 */
const MinimapScene = ({ buildings, devices, mainCameraPosition, onLocationClick }) => {
  const { scene } = useThree();

  // 渲染建筑物（简化版）
  const renderBuildings = () => {
    return buildings.map((building, index) => (
      <mesh
        key={`building-${index}`}
        position={[building.x || 0, 0, building.z || 0]}
        onClick={(e) => {
          e.stopPropagation();
          onLocationClick && onLocationClick(building.x || 0, building.z || 0);
        }}
      >
        <boxGeometry args={[building.width || 10, 2, building.depth || 10]} />
        <meshBasicMaterial 
          color={building.selected ? '#4caf50' : '#2196f3'}
          transparent
          opacity={0.7}
        />
      </mesh>
    ));
  };

  // 渲染设备（简化版）
  const renderDevices = () => {
    return devices.map((device, index) => (
      <mesh
        key={`device-${index}`}
        position={[device.x || 0, 1, device.z || 0]}
        onClick={(e) => {
          e.stopPropagation();
          onLocationClick && onLocationClick(device.x || 0, device.z || 0);
        }}
      >
        <sphereGeometry args={[0.5]} />
        <meshBasicMaterial 
          color={device.status === 'active' ? '#4caf50' : '#ff9800'}
        />
      </mesh>
    ));
  };

  // 渲染主相机位置指示器
  const renderCameraIndicator = () => {
    if (!mainCameraPosition) return null;
    
    return (
      <mesh position={[mainCameraPosition.x, 2, mainCameraPosition.z]}>
        <coneGeometry args={[1, 2, 4]} />
        <meshBasicMaterial color="#f44336" />
      </mesh>
    );
  };

  return (
    <>
      {/* 地面网格 */}
      <gridHelper args={[200, 20, '#666666', '#333333']} />
      
      {/* 建筑物 */}
      {renderBuildings()}
      
      {/* 设备 */}
      {renderDevices()}
      
      {/* 相机位置指示器 */}
      {renderCameraIndicator()}
      
      {/* 环境光 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
    </>
  );
};

/**
 * 小地图导航组件
 * 提供园区概览和快速导航功能
 */
const MinimapNavigation = ({ 
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
  const [mainCameraPosition, setMainCameraPosition] = useState(null);
  const canvasRef = useRef();
  
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

  // 处理位置点击
  const handleLocationClick = useCallback((x, z) => {
    if (onNavigate) {
      onNavigate({ x, y: 10, z }); // 导航到指定位置
    }
  }, [onNavigate]);

  // 处理相机更新
  const handleCameraUpdate = useCallback((cameraInfo) => {
    setMainCameraPosition(cameraInfo.position);
  }, []);

  // 处理小地图缩放
  const handleZoomChange = useCallback((event, value) => {
    setMinimapZoom(value);
  }, []);

  // 重置视角到园区中心
  const handleResetView = useCallback(() => {
    if (onNavigate) {
      onNavigate({ x: 0, y: 20, z: 0 });
    }
  }, [onNavigate]);

  // 定位到当前选中建筑
  const handleLocateSelected = useCallback(() => {
    if (selectedBuilding && onNavigate) {
      onNavigate({
        x: selectedBuilding.x || 0,
        y: 20,
        z: selectedBuilding.z || 0
      });
    }
  }, [selectedBuilding, onNavigate]);

  if (!visible) {
    return (
      <Box sx={getPositionStyles()}>
        <Tooltip title="显示小地图">
          <IconButton
            onClick={() => onVisibilityChange && onVisibilityChange(true)}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.9)'
              }
            }}
          >
            <Map />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={getPositionStyles()}>
      <Paper
        elevation={3}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          overflow: 'hidden',
          width: isExpanded ? size.width + 100 : size.width,
          transition: 'width 0.3s ease'
        }}
      >
        {/* 小地图标题栏 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
            园区导航
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="定位选中建筑">
              <IconButton
                size="small"
                onClick={handleLocateSelected}
                disabled={!selectedBuilding}
                sx={{ color: 'white' }}
              >
                <MyLocation fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="重置视角">
              <IconButton
                size="small"
                onClick={handleResetView}
                sx={{ color: 'white' }}
              >
                <CenterFocusStrong fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isExpanded ? '收起控制' : '展开控制'}>
              <IconButton
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{ color: 'white' }}
              >
                <NavigationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="隐藏小地图">
              <IconButton
                size="small"
                onClick={() => onVisibilityChange && onVisibilityChange(false)}
                sx={{ color: 'white' }}
              >
                <VisibilityOff fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 小地图3D视图 */}
        <Box
          sx={{
            width: size.width,
            height: size.height,
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          <Canvas
            ref={canvasRef}
            camera={{ 
              position: [0, 100, 0],
              fov: 50,
              near: 0.1,
              far: 1000
            }}
            onClick={(e) => {
              // 处理画布点击，转换为3D坐标
              const rect = e.target.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
              
              // 简单的坐标转换（需要根据实际场景调整）
              const worldX = x * 50;
              const worldZ = y * 50;
              handleLocationClick(worldX, worldZ);
            }}
          >
            <MinimapCamera 
              mainCamera={mainCamera}
              onCameraUpdate={handleCameraUpdate}
            />
            <MinimapScene
              buildings={campusData?.buildings || []}
              devices={showDevices ? (devices || []) : []}
              mainCameraPosition={mainCameraPosition}
              onLocationClick={handleLocationClick}
            />
          </Canvas>
          
          {/* 小地图覆盖信息 */}
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
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                px: 1,
                py: 0.5,
                borderRadius: 1
              }}
            >
              缩放: {Math.round(minimapZoom * 100)}%
            </Typography>
          </Box>
        </Box>

        {/* 扩展控制面板 */}
        {isExpanded && (
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {/* 缩放控制 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'white', mb: 1, display: 'block' }}>
                小地图缩放
              </Typography>
              <Slider
                value={minimapZoom}
                onChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.1}
                marks={[
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' },
                  { value: 2, label: '200%' }
                ]}
                sx={{
                  color: '#4caf50',
                  '& .MuiSlider-markLabel': {
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.6rem'
                  }
                }}
              />
            </Box>

            <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

            {/* 显示选项 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showBuildings}
                    onChange={(e) => setShowBuildings(e.target.checked)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50'
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50'
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    显示建筑物
                  </Typography>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showDevices}
                    onChange={(e) => setShowDevices(e.target.checked)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50'
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50'
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    显示设备
                  </Typography>
                }
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MinimapNavigation;