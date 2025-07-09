import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  ButtonGroup,
  Slider,
  Typography,
  Paper
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  // PanTool,
  CenterFocusStrong,
  FlightTakeoff,
  Terrain,
  Map,
  Videocam
} from '@mui/icons-material';

/**
 * 3D场景导航控制组件
 */
const NavigationControls = ({ 
  position = 'bottom-right',
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onResetView,
  onTopView,
  onFrontView,
  onSideView,
  zoomLevel = 50,
  onZoomChange,
  onToggleMinimap,
  onToggleViewportManager,
  minimapVisible = true,
  viewportManagerVisible = true
}) => {
  const [showZoomSlider, setShowZoomSlider] = useState(false);

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
        return { ...base, bottom: 16, right: 16 };
    }
  };

  return (
    <Box sx={getPositionStyles()}>
      {/* 主要导航控制 */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {/* 缩放控制 */}
        <ButtonGroup
          orientation="vertical"
          variant="text"
          size="small"
          sx={{ '& .MuiIconButton-root': { color: 'white' } }}
        >
          <Tooltip title="放大" placement="left">
            <IconButton onClick={onZoomIn}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="缩放控制" placement="left">
            <IconButton 
              onClick={() => setShowZoomSlider(!showZoomSlider)}
              sx={{ 
                backgroundColor: showZoomSlider ? 'rgba(76, 175, 80, 0.3)' : 'transparent'
              }}
            >
              <CenterFocusStrong />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="缩小" placement="left">
            <IconButton onClick={onZoomOut}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* 旋转控制 */}
        <ButtonGroup
          orientation="vertical"
          variant="text"
          size="small"
          sx={{ '& .MuiIconButton-root': { color: 'white' } }}
        >
          <Tooltip title="向左旋转" placement="left">
            <IconButton onClick={onRotateLeft}>
              <RotateLeft />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="向右旋转" placement="left">
            <IconButton onClick={onRotateRight}>
              <RotateRight />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* 视角预设 */}
        <ButtonGroup
          orientation="vertical"
          variant="text"
          size="small"
          sx={{ '& .MuiIconButton-root': { color: 'white' } }}
        >
          <Tooltip title="俯视图" placement="left">
            <IconButton onClick={onTopView}>
              <Terrain />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="正视图" placement="left">
            <IconButton onClick={onFrontView}>
              <FlightTakeoff sx={{ transform: 'rotate(90deg)' }} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="重置视角" placement="left">
            <IconButton onClick={onResetView}>
              <CenterFocusStrong />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* 导航工具 */}
        <ButtonGroup
          orientation="vertical"
          variant="text"
          size="small"
          sx={{ '& .MuiIconButton-root': { color: 'white' } }}
        >
          <Tooltip title="小地图导航" placement="left">
            <IconButton 
              onClick={onToggleMinimap}
              sx={{ 
                backgroundColor: minimapVisible ? 'rgba(76, 175, 80, 0.3)' : 'transparent'
              }}
            >
              <Map />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="视角管理器" placement="left">
            <IconButton 
              onClick={onToggleViewportManager}
              sx={{ 
                backgroundColor: viewportManagerVisible ? 'rgba(76, 175, 80, 0.3)' : 'transparent'
              }}
            >
              <Videocam />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Paper>

      {/* 缩放滑块 */}
      {showZoomSlider && (
        <Paper
          elevation={3}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            p: 2,
            mt: 1,
            width: 200
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ color: 'white', mb: 1, display: 'block' }}
          >
            缩放级别: {zoomLevel}%
          </Typography>
          <Slider
            value={zoomLevel}
            onChange={(e, value) => onZoomChange && onZoomChange(value)}
            min={10}
            max={200}
            step={5}
            marks={[
              { value: 25, label: '25%' },
              { value: 50, label: '50%' },
              { value: 100, label: '100%' },
              { value: 150, label: '150%' }
            ]}
            sx={{
              color: '#4caf50',
              '& .MuiSlider-markLabel': {
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.6rem'
              }
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default NavigationControls;