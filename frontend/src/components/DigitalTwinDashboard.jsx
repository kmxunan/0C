/**
 * 数字孪生仪表板组件
 * 整合3D可视化、能源管理和碳排放监测功能
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  TrendingUp,
  TrendingDown,
  ElectricBolt,
  Factory,
  Refresh,
  Settings,
  Nature
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// 模拟导入，实际应用中替换为真实路径
// import DigitalTwinController from '../../../src/digital-twin/DigitalTwinController.js';
// import EnergyManager from '../../../src/energy/EnergyManager.js';
// import CarbonMonitor from '../../../src/carbon/CarbonMonitor.js';

const DigitalTwinDashboard = React.memo(() => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [energyData, setEnergyData] = useState({
    realTime: { production: 0, consumption: 0, efficiency: 0 },
    hourly: [],
    devices: []
  });
  const [carbonData, setCarbonData] = useState({
    realTime: { totalEmission: 0, reductionRate: 0 },
    hourly: [],
    breakdown: []
  });
  const [systemStatus, setSystemStatus] = useState({
    devices: { online: 0, offline: 0, warning: 0 },
    connectivity: 'connected',
    lastUpdate: new Date()
  });

  const digitalTwinRef = useRef(null);
  // 模拟控制器引用
  const controllerRef = useRef(null);
  const energyManagerRef = useRef(null);
  const carbonMonitorRef = useRef(null);

  const loadInitialData = useCallback(async () => {
    // 模拟加载数据
    const mockEnergyData = {
      realTime: {
        production: 850.5,
        consumption: 720.3,
        efficiency: 84.7
      },
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        production: 800 + Math.random() * 200,
        consumption: 600 + Math.random() * 200,
        renewable: 400 + Math.random() * 300
      })),
      devices: [
        { id: '1', name: '太阳能板A', type: 'solar', status: 'online', power: 250.5 },
        { id: '2', name: '风力发电机B', type: 'wind', status: 'online', power: 180.2 },
        { id: '3', name: '储能系统C', type: 'battery', status: 'charging', power: -120.8 },
        { id: '4', name: '生产线D', type: 'load', status: 'online', power: 450.3 }
      ]
    };

    const mockCarbonData = {
      realTime: {
        totalEmission: 125.8,
        reductionRate: 15.2
      },
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        emission: 100 + Math.random() * 50,
        target: 120
      })),
      breakdown: [
        { name: '电力', value: 45.2, color: '#8884d8' },
        { name: '天然气', value: 32.1, color: '#82ca9d' },
        { name: '柴油', value: 15.7, color: '#ffc658' },
        { name: '其他', value: 7.0, color: '#ff7300' }
      ]
    };

    setEnergyData(mockEnergyData);
    setCarbonData(mockCarbonData);

    // 模拟系统状态
    setSystemStatus({
      devices: { online: 12, offline: 1, warning: 2 },
      connectivity: 'connected',
      lastUpdate: new Date()
    });

    // 模拟告警
    setAlerts([
      {
        id: '1',
        level: 'warning',
        message: '设备温度偏高',
        device: '生产线D',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: '2',
        level: 'info',
        message: '储能系统充电完成',
        device: '储能系统C',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      }
    ]);
  }, []);

  const updateRealTimeData = useCallback(() => {
    // 模拟实时数据更新
    setEnergyData(prev => ({
      ...prev,
      realTime: {
        production: 800 + Math.random() * 100,
        consumption: 650 + Math.random() * 100,
        efficiency: 80 + Math.random() * 10
      }
    }));

    setCarbonData(prev => ({
      ...prev,
      realTime: {
        totalEmission: 120 + Math.random() * 20,
        reductionRate: 10 + Math.random() * 10
      }
    }));

    setSystemStatus(prev => ({
      ...prev,
      lastUpdate: new Date()
    }));
  }, []);

  useEffect(() => {
    const initializeSystem = async () => {
      setIsLoading(true);
      // 在此可以进行数字孪生控制器、能源管理器等的初始化
      // controllerRef.current = new DigitalTwinController(digitalTwinRef.current);
      // energyManagerRef.current = new EnergyManager();
      // carbonMonitorRef.current = new CarbonMonitor();

      // 注册事件监听 (如果需要)
      // controllerRef.current.on('dataUpdate', handleDataUpdate);

      await loadInitialData();
      setIsLoading(false);
    };

    initializeSystem();
    
    // 设置定时器以模拟实时数据更新
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 5000);

    // 清理函数
    return () => {
      clearInterval(interval);
      // 在此执行资源清理，例如断开事件监听
      // if (controllerRef.current) {
      //   controllerRef.current.dispose();
      // }
    };
  }, [loadInitialData, updateRealTimeData]);
  
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'charging':
        return 'success';
      case 'offline': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'charging':
        return <CheckCircle color="success"/>;
      case 'offline': return <Error color="error"/>;
      case 'warning': return <Warning color="warning"/>;
      default: return null;
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* 系统状态卡片 */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              系统状态
            </Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">
                在线设备: {systemStatus.devices.online}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="body2">
                告警设备: {systemStatus.devices.warning}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Error color="error" sx={{ mr: 1 }} />
              <Typography variant="body2">
                离线设备: {systemStatus.devices.offline}
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary">
              最后更新: {formatTime(systemStatus.lastUpdate)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 能源概览 */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              能源概览
            </Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <TrendingUp color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">
                生产: {energyData.realTime.production.toFixed(1)} kW
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <TrendingDown color="secondary" sx={{ mr: 1 }} />
              <Typography variant="body2">
                消耗: {energyData.realTime.consumption.toFixed(1)} kW
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <ElectricBolt color="action" sx={{ mr: 1 }} />
              <Typography variant="body2">
                效率: {energyData.realTime.efficiency.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={energyData.realTime.efficiency} 
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      
      {/* 碳排放概览 */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              碳排放概览
            </Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <Factory color="disabled" sx={{ mr: 1 }} />
              <Typography variant="body2">
                当前排放: {carbonData.realTime.totalEmission.toFixed(1)} kgCO₂e
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Nature color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">
                减排率: {carbonData.realTime.reductionRate.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={carbonData.realTime.reductionRate} 
              color="success"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      
      {/* 告警中心 */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                告警中心
              </Typography>
              <Chip 
                label={alerts.length} 
                color={alerts.length > 0 ? 'warning' : 'success'}
                size="small"
              />
            </Box>
            {alerts.slice(0, 3).map(alert => (
              <Alert 
                key={alert.id}
                severity={alert.level}
                icon={false}
                sx={{ mb: 1, fontSize: '0.8rem', alignItems: 'center' }}
              >
                {alert.message}
              </Alert>
            ))}
            {alerts.length > 3 && (
              <Typography 
                variant="caption" 
                color="primary" 
                sx={{ cursor: 'pointer' }}
                onClick={() => setShowAlerts(true)}
              >
                查看更多 ({alerts.length - 3})
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* 3D数字孪生视图 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                数字孪生3D视图
              </Typography>
              <Box>
                <Tooltip title="刷新数据">
                  <IconButton onClick={updateRealTimeData}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Tooltip title="视图设置">
                  <IconButton>
                    <Settings />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box 
              ref={digitalTwinRef}
              sx={{ 
                height: 500, 
                backgroundColor: '#e0e0e0',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <Typography color="textSecondary">正在加载3D场景...</Typography>
              ) : (
                <Typography color="textSecondary">3D数字孪生场景将在此处显示</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderEnergyManagement = () => (
    <Grid container spacing={3}>
      {/* 实时能源数据 */}
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              24小时能源趋势
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={energyData.hourly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="production" stroke="#8884d8" name="生产" />
                <Line type="monotone" dataKey="consumption" stroke="#82ca9d" name="消耗" />
                <Line type="monotone" dataKey="renewable" stroke="#ffc658" name="可再生" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 设备状态 */}
      <Grid item xs={12} lg={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              设备状态
            </Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {energyData.devices.map(device => (
                <ListItem key={device.id} disablePadding>
                  <ListItemIcon sx={{ minWidth: '40px' }}>
                    {getStatusIcon(device.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={device.name}
                    secondary={`${device.power.toFixed(1)} kW`}
                  />
                  <Chip 
                    label={device.status}
                    color={getStatusColor(device.status)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCarbonMonitoring = () => (
    <Grid container spacing={3}>
      {/* 碳排放趋势 */}
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              24小时碳排放趋势
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={carbonData.hourly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="emission" stackId="1" stroke="#ff7300" fill="#ff7300" name="实际排放" />
                <Area type="monotone" dataKey="target" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="目标排放" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 排放源分布 */}
      <Grid item xs={12} lg={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              排放源分布
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={carbonData.breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {carbonData.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        零碳园区数字孪生管理系统
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="系统概览" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="能源管理" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="碳排放监测" id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>
      </Box>
      
      <Box hidden={activeTab !== 0} id="tabpanel-0" aria-labelledby="tab-0">
        {activeTab === 0 && renderOverview()}
      </Box>
      <Box hidden={activeTab !== 1} id="tabpanel-1" aria-labelledby="tab-1">
        {activeTab === 1 && renderEnergyManagement()}
      </Box>
      <Box hidden={activeTab !== 2} id="tabpanel-2" aria-labelledby="tab-2">
        {activeTab === 2 && renderCarbonMonitoring()}
      </Box>
      
      {/* 告警对话框 */}
      <Dialog open={showAlerts} onClose={() => setShowAlerts(false)} maxWidth="md" fullWidth>
        <DialogTitle>系统告警</DialogTitle>
        <DialogContent>
          <List>
            {alerts.map(alert => (
              <ListItem key={alert.id}>
                <ListItemIcon>
                  {alert.level === 'warning' ? <Warning color="warning" /> : <CheckCircle color="info" />}
                </ListItemIcon>
                <ListItemText
                  primary={alert.message}
                  secondary={`设备: ${alert.device} | 时间: ${formatTime(alert.timestamp)}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
});

export default DigitalTwinDashboard;