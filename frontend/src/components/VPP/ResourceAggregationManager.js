/**
 * VPP资源聚合管理组件
 * 提供拖拽式资源聚合配置和管理界面
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Grid,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  LinearProgress,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Badge,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Power as PowerIcon,
  BatteryFull as BatteryIcon,
  Air as WindIcon,
  Factory as FactoryIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; // Removed due to React 19 compatibility
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';

// 样式化组件
const StyledCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const ResourceCard = styled(Paper)(({ theme, resourceType, isSelected }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  cursor: 'pointer',
  border: isSelected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
  borderLeft: `4px solid ${
    resourceType === 'solar' ? '#ff9800' :
    resourceType === 'wind' ? '#2196f3' :
    resourceType === 'battery' ? '#4caf50' :
    resourceType === 'load' ? '#f44336' :
    theme.palette.grey[400]
  }`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)'
  }
}));

const AggregationZone = styled(Paper)(({ theme }) => ({
  minHeight: 200,
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start'
}));

const ResourceIcon = styled(Avatar)(({ theme, resourceType }) => ({
  backgroundColor: 
    resourceType === 'solar' ? '#ff9800' :
    resourceType === 'wind' ? '#2196f3' :
    resourceType === 'battery' ? '#4caf50' :
    resourceType === 'load' ? '#f44336' :
    theme.palette.grey[400],
  width: 40,
  height: 40
}));

// 自定义TabPanel组件
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ResourceAggregationManager = () => {
  // 状态管理
  const [resources, setResources] = useState([]);
  const [aggregationGroups, setAggregationGroups] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 对话框状态
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  // Tab状态
  const [tabValue, setTabValue] = useState(0);
  
  // 表单状态
  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'solar',
    capacity: 100,
    location: '',
    status: 'online',
    parameters: {
      efficiency: 0.85,
      availability: 0.95,
      ramp_rate: 10,
      min_output: 0,
      max_output: 100
    },
    cost_parameters: {
      fixed_cost: 0,
      variable_cost: 0.05,
      startup_cost: 0,
      shutdown_cost: 0
    },
    constraints: {
      min_up_time: 0,
      min_down_time: 0,
      max_starts_per_day: 10
    }
  });
  
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    strategy: 'balanced',
    priority: 1,
    constraints: {
      max_capacity: 1000,
      min_capacity: 10,
      max_resources: 50,
      geographic_limit: 100
    },
    optimization_config: {
      objective: 'maximize_profit',
      risk_tolerance: 0.5,
      time_horizon: 24,
      update_frequency: 15
    }
  });

  // 模拟数据
  const mockResources = [
    {
      resource_id: '1',
      name: '太阳能电站A',
      type: 'solar',
      capacity: 500,
      current_output: 350,
      location: '昆明市',
      status: 'online',
      efficiency: 0.88,
      availability: 0.96,
      last_update: new Date().toISOString()
    },
    {
      resource_id: '2',
      name: '风力发电场B',
      type: 'wind',
      capacity: 300,
      current_output: 180,
      location: '大理市',
      status: 'online',
      efficiency: 0.82,
      availability: 0.94,
      last_update: new Date().toISOString()
    },
    {
      resource_id: '3',
      name: '储能电站C',
      type: 'battery',
      capacity: 200,
      current_output: -50,
      location: '曲靖市',
      status: 'online',
      efficiency: 0.92,
      availability: 0.98,
      last_update: new Date().toISOString()
    },
    {
      resource_id: '4',
      name: '工业负荷D',
      type: 'load',
      capacity: 400,
      current_output: -320,
      location: '玉溪市',
      status: 'online',
      efficiency: 1.0,
      availability: 0.99,
      last_update: new Date().toISOString()
    }
  ];

  const mockAggregationGroups = [
    {
      group_id: '1',
      name: '可再生能源组合',
      description: '太阳能和风能资源聚合',
      strategy: 'renewable_priority',
      total_capacity: 800,
      current_output: 530,
      resource_count: 2,
      status: 'active',
      resources: ['1', '2'],
      performance: {
        efficiency: 0.85,
        availability: 0.95,
        profit_margin: 0.12
      }
    },
    {
      group_id: '2',
      name: '储能调节组合',
      description: '储能和负荷平衡聚合',
      strategy: 'load_balancing',
      total_capacity: 600,
      current_output: -370,
      resource_count: 2,
      status: 'active',
      resources: ['3', '4'],
      performance: {
        efficiency: 0.96,
        availability: 0.985,
        profit_margin: 0.08
      }
    }
  ];

  // 加载数据
  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResources(mockResources);
      setAggregationGroups(mockAggregationGroups);
    } catch (err) {
      setError('加载资源数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // 拖拽处理
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    // 如果拖拽到聚合区域
    if (destination.droppableId.startsWith('group-')) {
      const groupId = destination.droppableId.replace('group-', '');
      const resourceId = draggableId.replace('resource-', '');
      
      // 添加资源到聚合组
      setAggregationGroups(prev => 
        prev.map(group => 
          group.group_id === groupId
            ? { ...group, resources: [...group.resources, resourceId] }
            : group
        )
      );
      
      setSuccess(`资源已添加到聚合组`);
    }
  };

  // 资源操作
  const handleCreateResource = async () => {
    try {
      setLoading(true);
      // 模拟创建资源
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('资源创建成功');
      setResourceDialogOpen(false);
      await loadResources();
    } catch (err) {
      setError('创建资源失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      setLoading(true);
      // 模拟创建聚合组
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('聚合组创建成功');
      setGroupDialogOpen(false);
      await loadResources();
    } catch (err) {
      setError('创建聚合组失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeGroup = async (groupId) => {
    try {
      setLoading(true);
      // 模拟优化计算
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('聚合组优化完成');
    } catch (err) {
      setError('优化失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取资源图标
  const getResourceIcon = (type) => {
    switch (type) {
      case 'solar':
        return <PowerIcon />;
      case 'wind':
        return <WindIcon />;
      case 'battery':
        return <BatteryIcon />;
      case 'load':
        return <FactoryIcon />;
      default:
        return <PowerIcon />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'active':
        return 'success';
      case 'offline':
      case 'inactive':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 图表数据
  const resourceDistributionData = {
    labels: ['太阳能', '风能', '储能', '负荷'],
    datasets: [{
      data: [
        resources.filter(r => r.type === 'solar').length,
        resources.filter(r => r.type === 'wind').length,
        resources.filter(r => r.type === 'battery').length,
        resources.filter(r => r.type === 'load').length
      ],
      backgroundColor: ['#ff9800', '#2196f3', '#4caf50', '#f44336'],
      borderWidth: 2
    }]
  };

  const capacityComparisonData = {
    labels: aggregationGroups.map(g => g.name),
    datasets: [{
      label: '总容量 (MW)',
      data: aggregationGroups.map(g => g.total_capacity),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }, {
      label: '当前输出 (MW)',
      data: aggregationGroups.map(g => Math.abs(g.current_output)),
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }]
  };

  const performanceRadarData = {
    labels: ['效率', '可用性', '利润率', '响应速度', '稳定性'],
    datasets: aggregationGroups.map((group, index) => ({
      label: group.name,
      data: [
        group.performance.efficiency * 100,
        group.performance.availability * 100,
        group.performance.profit_margin * 100,
        Math.random() * 100, // 模拟响应速度
        Math.random() * 100  // 模拟稳定性
      ],
      backgroundColor: `rgba(${index * 100 + 54}, ${index * 50 + 162}, 235, 0.2)`,
      borderColor: `rgba(${index * 100 + 54}, ${index * 50 + 162}, 235, 1)`,
      borderWidth: 2
    }))
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          资源聚合管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadResources}
            disabled={loading}
          >
            刷新
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setResourceDialogOpen(true)}
          >
            添加资源
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setGroupDialogOpen(true)}
          >
            创建聚合组
          </Button>
        </Box>
      </Box>

      {/* 加载指示器 */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="资源概览" />
          <Tab label="聚合配置" />
          <Tab label="性能分析" />
        </Tabs>
      </Box>

      {/* 资源概览标签页 */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* 统计卡片 */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <StyledCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PowerIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {resources.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      总资源数
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={6} sm={3}>
                <StyledCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {resources.filter(r => r.status === 'online').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      在线资源
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={6} sm={3}>
                <StyledCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AssessmentIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {aggregationGroups.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      聚合组数
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={6} sm={3}>
                <StyledCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TimelineIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {resources.reduce((sum, r) => sum + r.capacity, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      总容量(MW)
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          </Grid>
          
          {/* 资源分布图 */}
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardHeader title="资源类型分布" />
              <CardContent>
                <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Doughnut
                    data={resourceDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* 资源列表 */}
        <StyledCard sx={{ mt: 3 }}>
          <CardHeader title="资源列表" />
          <CardContent>
            <Grid container spacing={2}>
              {resources.map((resource, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={resource.resource_id}>
                  <ResourceCard
                    resourceType={resource.type}
                    isSelected={selectedResources.includes(resource.resource_id)}
                    onClick={() => {
                      if (selectedResources.includes(resource.resource_id)) {
                        setSelectedResources(prev => 
                          prev.filter(id => id !== resource.resource_id)
                        );
                      } else {
                        setSelectedResources(prev => [...prev, resource.resource_id]);
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ResourceIcon resourceType={resource.type}>
                        {getResourceIcon(resource.type)}
                      </ResourceIcon>
                      <Box sx={{ ml: 2, flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {resource.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {resource.location}
                        </Typography>
                      </Box>
                      <DragIcon color="action" />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">容量</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {resource.capacity} MW
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">当前输出</Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: resource.current_output >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {resource.current_output} MW
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">效率</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {(resource.efficiency * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={resource.status}
                        size="small"
                        color={getStatusColor(resource.status)}
                      />
                      <Box>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <SettingsIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </ResourceCard>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </StyledCard>
      </TabPanel>

      {/* 聚合配置标签页 */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {aggregationGroups.map((group) => (
            <Grid item xs={12} md={6} key={group.group_id}>
              <StyledCard>
                <CardHeader
                  title={group.name}
                  subheader={group.description}
                  action={
                    <Box>
                      <IconButton onClick={() => handleOptimizeGroup(group.group_id)}>
                        <SettingsIcon />
                      </IconButton>
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                    </Box>
                  }
                />
                <CardContent>
                  <AggregationZone>
                    <>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2 }}>
                                <Typography variant="h6">聚合资源</Typography>
                                <Chip
                                  label={group.status}
                                  color={getStatusColor(group.status)}
                                  size="small"
                                />
                              </Box>
                              
                              <Grid container spacing={1} sx={{ width: '100%' }}>
                                {group.resources.map((resourceId) => {
                                  const resource = resources.find(r => r.resource_id === resourceId);
                                  return resource ? (
                                    <Grid item xs={12} sm={6} key={resourceId}>
                                      <Paper sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                                        <ResourceIcon resourceType={resource.type} sx={{ width: 24, height: 24, mr: 1 }}>
                                          {getResourceIcon(resource.type)}
                                        </ResourceIcon>
                                        <Typography variant="body2" sx={{ flex: 1 }}>
                                          {resource.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {resource.capacity}MW
                                        </Typography>
                                      </Paper>
                                    </Grid>
                                  ) : null;
                                })}
                              </Grid>
                              
                              <Divider sx={{ my: 2, width: '100%' }} />
                              
                              <Grid container spacing={2} sx={{ width: '100%' }}>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">总容量</Typography>
                                  <Typography variant="h6">{group.total_capacity} MW</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">当前输出</Typography>
                                  <Typography variant="h6">{group.current_output} MW</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">资源数量</Typography>
                                  <Typography variant="h6">{group.resource_count}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">效率</Typography>
                                  <Typography variant="h6">{(group.performance.efficiency * 100).toFixed(1)}%</Typography>
                                </Grid>
                              </Grid>
                    </>
                  </AggregationZone>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* 性能分析标签页 */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="容量对比分析" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={capacityComparisonData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: '容量 (MW)'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="性能雷达图" />
              <CardContent>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Radar
                    data={performanceRadarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      },
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 添加资源对话框 */}
      <Dialog
        open={resourceDialogOpen}
        onClose={() => setResourceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>添加新资源</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="资源名称"
                value={resourceForm.name}
                onChange={(e) => setResourceForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>资源类型</InputLabel>
                <Select
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, type: e.target.value }))}
                  label="资源类型"
                >
                  <MenuItem value="solar">太阳能</MenuItem>
                  <MenuItem value="wind">风能</MenuItem>
                  <MenuItem value="battery">储能</MenuItem>
                  <MenuItem value="load">负荷</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="容量 (MW)"
                type="number"
                value={resourceForm.capacity}
                onChange={(e) => setResourceForm(prev => ({ ...prev, capacity: parseFloat(e.target.value) }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="位置"
                value={resourceForm.location}
                onChange={(e) => setResourceForm(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResourceDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleCreateResource}
            variant="contained"
            disabled={!resourceForm.name || !resourceForm.location || loading}
          >
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建聚合组对话框 */}
      <Dialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>创建聚合组</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="聚合组名称"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>聚合策略</InputLabel>
                <Select
                  value={groupForm.strategy}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, strategy: e.target.value }))}
                  label="聚合策略"
                >
                  <MenuItem value="balanced">平衡策略</MenuItem>
                  <MenuItem value="renewable_priority">可再生能源优先</MenuItem>
                  <MenuItem value="load_balancing">负荷平衡</MenuItem>
                  <MenuItem value="profit_maximization">利润最大化</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="优先级"
                type="number"
                value={groupForm.priority}
                onChange={(e) => setGroupForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!groupForm.name || loading}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ResourceAggregationManager;