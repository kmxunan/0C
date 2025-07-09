import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ExpandMore,
  Business,
  ElectricBolt,
  Co2,
  Warning,
  CheckCircle,
  Error,
  Visibility,
  VisibilityOff,
  Tune,
  Timeline,
  Map,
  Layers,
  Speed
} from '@mui/icons-material';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';

/**
 * 全屏模式控制面板
 * 在全屏模式下提供信息展示和控制功能
 */
const FullscreenControls = ({ selectedBuilding, campusData, isLoading, error }) => {
  const [expandedPanel, setExpandedPanel] = useState('overview');
  const [showLayers, setShowLayers] = useState({
    buildings: true,
    devices: true,
    energy: true,
    carbon: true,
    alerts: true
  });
  const [viewSettings, setViewSettings] = useState({
    quality: 'high',
    particles: true,
    shadows: true,
    animations: true,
    dataFlow: true
  });
  const [timeSpeed, setTimeSpeed] = useState(1);
  
  const { setSelectedBuilding } = useDigitalTwinStore();

  // 处理面板展开/收起
  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  // 处理图层显示切换
  const handleLayerToggle = (layer) => {
    setShowLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // 处理视图设置变更
  const handleViewSettingChange = (setting, value) => {
    setViewSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // 获取建筑详细信息
  const getSelectedBuildingData = () => {
    if (!selectedBuilding || !campusData?.buildings) return null;
    return campusData.buildings.find(b => b.id === selectedBuilding);
  };

  // 获取园区统计信息
  const getCampusStats = () => {
    if (!campusData) return null;
    
    const totalBuildings = campusData.buildings?.length || 0;
    const totalDevices = campusData.devices?.length || 0;
    const activeDevices = campusData.devices?.filter(d => d.status === 'active').length || 0;
    const totalEnergy = campusData.buildings?.reduce((sum, b) => sum + (b.energyConsumption || 0), 0) || 0;
    const totalCarbon = campusData.buildings?.reduce((sum, b) => sum + (b.carbonEmission || 0), 0) || 0;
    const alerts = campusData.alerts?.length || 0;
    
    return {
      totalBuildings,
      totalDevices,
      activeDevices,
      deviceEfficiency: totalDevices > 0 ? (activeDevices / totalDevices * 100) : 0,
      totalEnergy,
      totalCarbon,
      alerts
    };
  };

  const buildingData = getSelectedBuildingData();
  const stats = getCampusStats();

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        width: '6px'
      },
      '&::-webkit-scrollbar-track': {
        background: 'rgba(255,255,255,0.1)'
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '3px'
      }
    }}>
      {/* 园区概览 */}
      <Accordion 
        expanded={expandedPanel === 'overview'} 
        onChange={handlePanelChange('overview')}
        sx={{ 
          backgroundColor: 'transparent',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
            园区概览
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {isLoading ? (
            <Box sx={{ color: 'white', textAlign: 'center', py: 2 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography>正在加载数据...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ color: '#f44336', textAlign: 'center', py: 2 }}>
              <Error sx={{ fontSize: 40, mb: 1 }} />
              <Typography>数据加载失败</Typography>
              <Typography variant="caption">{error}</Typography>
            </Box>
          ) : stats ? (
            <Box sx={{ color: 'white' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="#4caf50">{stats.totalBuildings}</Typography>
                  <Typography variant="caption">建筑数量</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="#2196f3">{stats.totalDevices}</Typography>
                  <Typography variant="caption">设备总数</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">设备运行率</Typography>
                  <Typography variant="body2">{stats.deviceEfficiency.toFixed(1)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.deviceEfficiency}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: stats.deviceEfficiency > 80 ? '#4caf50' : 
                                     stats.deviceEfficiency > 60 ? '#ff9800' : '#f44336'
                    }
                  }}
                />
              </Box>

              <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)', my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ElectricBolt sx={{ fontSize: 16, mr: 1, color: '#ffeb3b' }} />
                  <Typography variant="body2">总能耗</Typography>
                </Box>
                <Typography variant="body2">{stats.totalEnergy.toFixed(1)} kWh</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Co2 sx={{ fontSize: 16, mr: 1, color: '#795548' }} />
                  <Typography variant="body2">碳排放</Typography>
                </Box>
                <Typography variant="body2">{stats.totalCarbon.toFixed(1)} kg</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Warning sx={{ fontSize: 16, mr: 1, color: '#ff5722' }} />
                  <Typography variant="body2">告警数量</Typography>
                </Box>
                <Chip 
                  label={stats.alerts} 
                  size="small" 
                  color={stats.alerts > 0 ? 'error' : 'success'}
                />
              </Box>
            </Box>
          ) : (
            <Typography sx={{ color: 'white', textAlign: 'center', py: 2 }}>
              暂无数据
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 选中建筑信息 */}
      <Accordion 
        expanded={expandedPanel === 'building'} 
        onChange={handlePanelChange('building')}
        sx={{ 
          backgroundColor: 'transparent',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
            建筑信息
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {buildingData ? (
            <Box sx={{ color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#4caf50' }}>
                {buildingData.name}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>基本信息</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">类型: {buildingData.type || '办公楼'}</Typography>
                  <Typography variant="body2">楼层: {buildingData.floors || 'N/A'}</Typography>
                  <Typography variant="body2">面积: {buildingData.area || 'N/A'} m²</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>能耗数据</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">当前功率: {buildingData.currentPower || 0} kW</Typography>
                  <Typography variant="body2">日能耗: {buildingData.dailyConsumption || 0} kWh</Typography>
                  <Typography variant="body2">月能耗: {buildingData.monthlyConsumption || 0} kWh</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>环境数据</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">温度: {buildingData.temperature || 'N/A'}°C</Typography>
                  <Typography variant="body2">湿度: {buildingData.humidity || 'N/A'}%</Typography>
                  <Typography variant="body2">空气质量: {buildingData.airQuality || 'N/A'}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>运行状态</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                  {buildingData.status === 'normal' ? (
                    <CheckCircle sx={{ fontSize: 16, color: '#4caf50', mr: 1 }} />
                  ) : (
                    <Warning sx={{ fontSize: 16, color: '#ff9800', mr: 1 }} />
                  )}
                  <Typography variant="body2">
                    {buildingData.status === 'normal' ? '正常运行' : '需要关注'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ color: 'white', textAlign: 'center', py: 2 }}>
              <Business sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
              <Typography>请选择一个建筑</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                点击3D场景中的建筑物查看详细信息
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 图层控制 */}
      <Accordion 
        expanded={expandedPanel === 'layers'} 
        onChange={handlePanelChange('layers')}
        sx={{ 
          backgroundColor: 'transparent',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
            图层控制
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ color: 'white' }}>
            {Object.entries(showLayers).map(([layer, visible]) => (
              <FormControlLabel
                key={layer}
                control={
                  <Switch
                    checked={visible}
                    onChange={() => handleLayerToggle(layer)}
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {layer === 'buildings' && <Business sx={{ fontSize: 16, mr: 1 }} />}
                    {layer === 'devices' && <ElectricBolt sx={{ fontSize: 16, mr: 1 }} />}
                    {layer === 'energy' && <Timeline sx={{ fontSize: 16, mr: 1 }} />}
                    {layer === 'carbon' && <Co2 sx={{ fontSize: 16, mr: 1 }} />}
                    {layer === 'alerts' && <Warning sx={{ fontSize: 16, mr: 1 }} />}
                    <Typography variant="body2">
                      {{
                        buildings: '建筑物',
                        devices: '设备',
                        energy: '能源流',
                        carbon: '碳排放',
                        alerts: '告警'
                      }[layer]}
                    </Typography>
                  </Box>
                }
                sx={{ width: '100%', m: 0, mb: 1 }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 视图设置 */}
      <Accordion 
        expanded={expandedPanel === 'settings'} 
        onChange={handlePanelChange('settings')}
        sx={{ 
          backgroundColor: 'transparent',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
            视图设置
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ color: 'white' }}>
            {/* 渲染质量 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>渲染质量</Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={viewSettings.quality}
                  onChange={(e) => handleViewSettingChange('quality', e.target.value)}
                  sx={{ 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)'
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white'
                    }
                  }}
                >
                  <MenuItem value="low">低质量</MenuItem>
                  <MenuItem value="medium">中等质量</MenuItem>
                  <MenuItem value="high">高质量</MenuItem>
                  <MenuItem value="ultra">超高质量</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* 时间速度 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>时间流速: {timeSpeed}x</Typography>
              <Slider
                value={timeSpeed}
                onChange={(e, value) => setTimeSpeed(value)}
                min={0}
                max={10}
                step={0.5}
                marks={[
                  { value: 0, label: '暂停' },
                  { value: 1, label: '1x' },
                  { value: 5, label: '5x' },
                  { value: 10, label: '10x' }
                ]}
                sx={{
                  color: '#4caf50',
                  '& .MuiSlider-markLabel': {
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.7rem'
                  }
                }}
              />
            </Box>

            {/* 视觉效果开关 */}
            {Object.entries({
              particles: '粒子效果',
              shadows: '阴影',
              animations: '动画',
              dataFlow: '数据流'
            }).map(([setting, label]) => (
              <FormControlLabel
                key={setting}
                control={
                  <Switch
                    checked={viewSettings[setting]}
                    onChange={(e) => handleViewSettingChange(setting, e.target.checked)}
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
                label={<Typography variant="body2">{label}</Typography>}
                sx={{ width: '100%', m: 0, mb: 1 }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default FullscreenControls;