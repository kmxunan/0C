import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Fade
} from '@mui/material';
import {
  CameraAlt,
  Visibility,
  FlightTakeoff,
  Terrain,
  ViewInAr,
  CenterFocusStrong,
  Save,
  Delete,
  Edit,
  PlayArrow,
  Stop,
  MoreVert,
  Bookmark,
  BookmarkBorder
} from '@mui/icons-material';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';

/**
 * 预设视角数据
 */
const DEFAULT_VIEWPOINTS = [
  {
    id: 'overview',
    name: '总览视角',
    description: '园区全景俯视图',
    position: { x: 0, y: 50, z: 50 },
    target: { x: 0, y: 0, z: 0 },
    fov: 60,
    icon: <Terrain />,
    category: 'default'
  },
  {
    id: 'aerial',
    name: '航拍视角',
    description: '高空俯视角度',
    position: { x: 0, y: 100, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    fov: 45,
    icon: <FlightTakeoff />,
    category: 'default'
  },
  {
    id: 'ground',
    name: '地面视角',
    description: '人眼高度观察',
    position: { x: 20, y: 2, z: 20 },
    target: { x: 0, y: 0, z: 0 },
    fov: 75,
    icon: <Visibility />,
    category: 'default'
  },
  {
    id: 'building-focus',
    name: '建筑聚焦',
    description: '聚焦主要建筑',
    position: { x: 30, y: 15, z: 30 },
    target: { x: 0, y: 5, z: 0 },
    fov: 50,
    icon: <ViewInAr />,
    category: 'default'
  }
];

/**
 * 视角动画组件
 */
const ViewportAnimation = ({ 
  isAnimating, 
  fromPosition, 
  toPosition, 
  fromTarget, 
  toTarget,
  duration = 2000,
  onComplete 
}) => {
  // const [progress, setProgress] = useState(0); // 未使用，已注释
  
  // // const { animatedPosition, animatedTarget } = useSpring({ // 未使用，已注释
  //   animatedPosition: isAnimating ? 
  //     [toPosition.x, toPosition.y, toPosition.z] : 
  //     [fromPosition.x, fromPosition.y, fromPosition.z],
  //   animatedTarget: isAnimating ? 
  //     [toTarget.x, toTarget.y, toTarget.z] : 
  //     [fromTarget.x, fromTarget.y, fromTarget.z],
  //   config: { duration },
  //   onRest: () => {
  //     if (isAnimating && onComplete) {
  //       onComplete();
  //     }
  //   }
  // }); // 未使用，已注释

  return null;
};

/**
 * 视角管理器组件
 * 提供预设视角切换和自定义视角保存功能
 */
const ViewportManager = ({ 
  position = 'top-right',
  camera,
  controls,
  onViewportChange,
  visible = true
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewpoints, setViewpoints] = useState(DEFAULT_VIEWPOINTS);
  const [currentViewpoint, setCurrentViewpoint] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingViewpoint, setEditingViewpoint] = useState(null);
  const [newViewpointName, setNewViewpointName] = useState('');
  const [newViewpointDescription, setNewViewpointDescription] = useState('');
  const animationRef = useRef(null);
  
  // 从状态管理获取数据
  const {
    selectedBuilding
    // campusData // 未使用，已注释
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
        return { ...base, top: 16, right: 16 };
    }
  };

  // 打开视角菜单
  const handleMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  // 关闭视角菜单
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // 切换到指定视角
  const switchToViewpoint = useCallback((viewpoint, animate = true) => {
    if (!camera || isAnimating) return;

    const currentPos = camera.position.clone();
    const currentTarget = controls?.target?.clone() || new THREE.Vector3(0, 0, 0);
    
    const targetPos = new THREE.Vector3(viewpoint.position.x, viewpoint.position.y, viewpoint.position.z);
    const targetLookAt = new THREE.Vector3(viewpoint.target.x, viewpoint.target.y, viewpoint.target.z);

    if (animate) {
      setIsAnimating(true);
      
      // 使用TWEEN.js进行平滑动画
      const startTime = Date.now();
      const duration = 2000; // 2秒动画
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用easeInOutCubic缓动函数
        const easeProgress = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // 插值位置
        const newPos = currentPos.clone().lerp(targetPos, easeProgress);
        const newTarget = currentTarget.clone().lerp(targetLookAt, easeProgress);
        
        camera.position.copy(newPos);
        if (controls) {
          controls.target.copy(newTarget);
          controls.update();
        }
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateCamera);
        } else {
          setIsAnimating(false);
          setCurrentViewpoint(viewpoint);
          if (onViewportChange) {
            onViewportChange(viewpoint);
          }
        }
      };
      
      animateCamera();
    } else {
      // 立即切换
      camera.position.copy(targetPos);
      if (controls) {
        controls.target.copy(targetLookAt);
        controls.update();
      }
      setCurrentViewpoint(viewpoint);
      if (onViewportChange) {
        onViewportChange(viewpoint);
      }
    }
    
    handleMenuClose();
  }, [camera, controls, isAnimating, onViewportChange, handleMenuClose]);

  // 保存当前视角
  const saveCurrentViewpoint = useCallback(() => {
    if (!camera) return;
    
    const currentPos = camera.position;
    const currentTarget = controls?.target || new THREE.Vector3(0, 0, 0);
    
    const newViewpoint = {
      id: `custom-${Date.now()}`,
      name: newViewpointName || `自定义视角 ${viewpoints.filter(v => v.category === 'custom').length + 1}`,
      description: newViewpointDescription || '用户自定义视角',
      position: { x: currentPos.x, y: currentPos.y, z: currentPos.z },
      target: { x: currentTarget.x, y: currentTarget.y, z: currentTarget.z },
      fov: camera.fov || 60,
      icon: <Bookmark />,
      category: 'custom',
      createdAt: new Date().toISOString()
    };
    
    setViewpoints(prev => [...prev, newViewpoint]);
    setSaveDialogOpen(false);
    setNewViewpointName('');
    setNewViewpointDescription('');
  }, [camera, controls, newViewpointName, newViewpointDescription, viewpoints]);

  // 删除自定义视角
  const deleteViewpoint = useCallback((viewpointId) => {
    setViewpoints(prev => prev.filter(v => v.id !== viewpointId));
    if (currentViewpoint?.id === viewpointId) {
      setCurrentViewpoint(null);
    }
  }, [currentViewpoint]);

  // 编辑视角
  const editViewpoint = useCallback((viewpoint) => {
    setEditingViewpoint(viewpoint);
    setNewViewpointName(viewpoint.name);
    setNewViewpointDescription(viewpoint.description);
    setEditDialogOpen(true);
  }, []);

  // 更新视角信息
  const updateViewpoint = useCallback(() => {
    if (!editingViewpoint) return;
    
    setViewpoints(prev => prev.map(v => 
      v.id === editingViewpoint.id 
        ? { ...v, name: newViewpointName, description: newViewpointDescription }
        : v
    ));
    
    setEditDialogOpen(false);
    setEditingViewpoint(null);
    setNewViewpointName('');
    setNewViewpointDescription('');
  }, [editingViewpoint, newViewpointName, newViewpointDescription]);

  // 聚焦到选中建筑
  const focusOnSelectedBuilding = useCallback(() => {
    if (!selectedBuilding || !camera) return;
    
    const buildingPos = {
      x: selectedBuilding.x || 0,
      y: selectedBuilding.y || 0,
      z: selectedBuilding.z || 0
    };
    
    const focusViewpoint = {
      id: 'focus-building',
      name: `聚焦: ${selectedBuilding.name}`,
      position: { 
        x: buildingPos.x + 20, 
        y: buildingPos.y + 15, 
        z: buildingPos.z + 20 
      },
      target: buildingPos,
      fov: 50
    };
    
    switchToViewpoint(focusViewpoint);
  }, [selectedBuilding, camera, switchToViewpoint]);

  // 组件卸载时清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <Box sx={getPositionStyles()}>
        <Paper
          elevation={3}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            p: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 当前视角指示 */}
            {currentViewpoint && (
              <Chip
                icon={currentViewpoint.icon}
                label={currentViewpoint.name}
                size="small"
                sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.3)',
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            )}
            
            {/* 视角菜单按钮 */}
            <Tooltip title="视角预设">
              <IconButton
                onClick={handleMenuOpen}
                disabled={isAnimating}
                sx={{ 
                  color: 'white',
                  backgroundColor: isAnimating ? 'rgba(255, 193, 7, 0.3)' : 'transparent'
                }}
              >
                <CameraAlt />
              </IconButton>
            </Tooltip>
            
            {/* 聚焦选中建筑 */}
            {selectedBuilding && (
              <Tooltip title={`聚焦: ${selectedBuilding.name}`}>
                <IconButton
                  onClick={focusOnSelectedBuilding}
                  disabled={isAnimating}
                  sx={{ color: 'white' }}
                >
                  <CenterFocusStrong />
                </IconButton>
              </Tooltip>
            )}
            
            {/* 保存当前视角 */}
            <Tooltip title="保存当前视角">
              <IconButton
                onClick={() => setSaveDialogOpen(true)}
                disabled={isAnimating}
                sx={{ color: 'white' }}
              >
                <Save />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      </Box>

      {/* 视角选择菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            minWidth: 250
          }
        }}
      >
        {/* 默认视角 */}
        <Typography variant="caption" sx={{ px: 2, py: 1, color: 'rgba(255,255,255,0.7)' }}>
          预设视角
        </Typography>
        {viewpoints.filter(v => v.category === 'default').map((viewpoint) => (
          <MenuItem
            key={viewpoint.id}
            onClick={() => switchToViewpoint(viewpoint)}
            disabled={isAnimating}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {viewpoint.icon}
            </ListItemIcon>
            <ListItemText
              primary={viewpoint.name}
              secondary={viewpoint.description}
              secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            />
          </MenuItem>
        ))}
        
        {/* 自定义视角 */}
        {viewpoints.filter(v => v.category === 'custom').length > 0 && (
          <>
            <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <Typography variant="caption" sx={{ px: 2, py: 1, color: 'rgba(255,255,255,0.7)' }}>
              自定义视角
            </Typography>
            {viewpoints.filter(v => v.category === 'custom').map((viewpoint) => (
              <MenuItem
                key={viewpoint.id}
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <Box 
                  sx={{ display: 'flex', alignItems: 'center', flex: 1 }}
                  onClick={() => switchToViewpoint(viewpoint)}
                >
                  <ListItemIcon sx={{ color: 'white' }}>
                    {viewpoint.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={viewpoint.name}
                    secondary={viewpoint.description}
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      editViewpoint(viewpoint);
                    }}
                    sx={{ color: 'white' }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteViewpoint(viewpoint.id);
                    }}
                    sx={{ color: 'white' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </MenuItem>
            ))}
          </>
        )}
      </Menu>

      {/* 保存视角对话框 */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white'
          }
        }}
      >
        <DialogTitle>保存当前视角</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="视角名称"
            fullWidth
            variant="outlined"
            value={newViewpointName}
            onChange={(e) => setNewViewpointName(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#4caf50' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
          <TextField
            margin="dense"
            label="描述（可选）"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newViewpointDescription}
            onChange={(e) => setNewViewpointDescription(e.target.value)}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#4caf50' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} sx={{ color: 'white' }}>
            取消
          </Button>
          <Button 
            onClick={saveCurrentViewpoint} 
            variant="contained"
            sx={{ backgroundColor: '#4caf50' }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑视角对话框 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white'
          }
        }}
      >
        <DialogTitle>编辑视角</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="视角名称"
            fullWidth
            variant="outlined"
            value={newViewpointName}
            onChange={(e) => setNewViewpointName(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#4caf50' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
          <TextField
            margin="dense"
            label="描述"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newViewpointDescription}
            onChange={(e) => setNewViewpointDescription(e.target.value)}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#4caf50' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: 'white' }}>
            取消
          </Button>
          <Button 
            onClick={updateViewpoint} 
            variant="contained"
            sx={{ backgroundColor: '#4caf50' }}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ViewportManager;