/**
 * VPP实时监控仪表板组件
 * 提供虚拟电厂运行状态的实时监控和可视化
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Power as PowerIcon,
  BatteryFull as BatteryIcon,
  Air as WindIcon,
  Factory as FactoryIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Speed as SpeedIcon,
  MonetizationOn as MoneyIcon,
  ElectricBolt as ElectricIcon,
  Thermostat as ThermostatIcon,
  WbSunny as SunnyIcon,
  Air as AirIcon,
  ShowChart as ChartIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Line, Doughnut, Bar, Gauge } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

// 样式化组件
const StyledCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const MetricCard = styled(Paper)(({ theme, status }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  borderLeft: `4px solid ${
    status === 'normal' ? theme.palette.success.main :
    status === 'warning' ? theme.palette.warning.main :
    status === 'critical' ? theme.palette.error.main :
    theme.palette.info.main
  }`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const StatusIndicator = styled(Box)(({ theme, status }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor:
    status === 'online' ? theme.palette.success.main :
    status === 'offline' ? theme.palette.error.main :
    status === 'maintenance' ? theme.palette.warning.main :
    theme.palette.grey[400],
  animation: status === 'online' ? 'pulse 2s infinite' : 'none',
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${theme.palette.success.main}40`
    },
    '70%': {
      boxShadow: `0 0 0 10px ${theme.palette.success.main}00`
    },
    '100%': {
      boxShadow: `0 0 0 0 ${theme.palette.success.main}00`
    }
  }
}));

const RealTimeMonitoringDashboard = () => {
  // 状态管理
  const [realTimeData, setRealTimeData] = useState({
    overview: {
      total_capacity: 0,
      active_capacity: 0,
      current_generation: 0,
      current_load: 0,
      grid_frequency: 50.0,
      system_efficiency: 0,
      revenue_today: 0,
      carbon_reduction: 0
    },
    resources: [],
    strategies: [],
    alerts: [],
    market_data: {
      current_price: 0,
      price_trend: 'stable',
      volume: 0,
      next_settlement: ''
    },
    weather: {
      temperature: 0,
      humidity: 0,
      wind_speed: 0,
      solar_irradiance: 0,
      weather_condition: 'sunny'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5秒
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  
  // WebSocket连接
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  // 模拟实时数据
  const generateMockData = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    
    // 模拟日间和夜间的不同数据模式
    const isDaytime = hour >= 6 && hour <= 18;
    const baseGeneration = isDaytime ? 800 + Math.random() * 400 : 200 + Math.random() * 100;
    const baseLoad = 600 + Math.random() * 300 + (isDaytime ? 200 : -100);
    
    return {
      overview: {
        total_capacity: 1500,
        active_capacity: 1200 + Math.random() * 200,
        current_generation: baseGeneration,
        current_load: baseLoad,
        grid_frequency: 49.8 + Math.random() * 0.4,
        system_efficiency: 0.85 + Math.random() * 0.1,
        revenue_today: 15000 + Math.random() * 5000,
        carbon_reduction: 2.5 + Math.random() * 0.5
      },
      resources: [
        {
          id: '1',
          name: '太阳能发电站A',
          type: 'solar',
          status: 'online',
          capacity: 500,
          current_output: isDaytime ? 300 + Math.random() * 150 : 0,
          efficiency: 0.88 + Math.random() * 0.1,
          temperature: 25 + Math.random() * 10
        },
        {
          id: '2',
          name: '风力发电站B',
          type: 'wind',
          status: 'online',
          capacity: 400,
          current_output: 200 + Math.random() * 150,
          efficiency: 0.82 + Math.random() * 0.1,
          wind_speed: 8 + Math.random() * 5
        },
        {
          id: '3',
          name: '储能系统C',
          type: 'battery',
          status: 'online',
          capacity: 300,
          current_output: -50 + Math.random() * 100, // 负值表示充电
          soc: 0.6 + Math.random() * 0.3,
          cycles: 1250
        },
        {
          id: '4',
          name: '工业负荷D',
          type: 'load',
          status: 'online',
          capacity: 600,
          current_consumption: 400 + Math.random() * 150,
          power_factor: 0.9 + Math.random() * 0.08
        }
      ],
      strategies: [
        {
          id: '1',
          name: '削峰填谷策略',
          status: 'active',
          executions_today: 15,
          success_rate: 0.92,
          profit_today: 3500
        },
        {
          id: '2',
          name: '套利交易策略',
          status: 'active',
          executions_today: 8,
          success_rate: 0.88,
          profit_today: 2100
        }
      ],
      alerts: [
        {
          id: '1',
          type: 'warning',
          message: '储能系统C充电功率接近上限',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          source: 'battery_3'
        },
        {
          id: '2',
          type: 'info',
          message: '削峰填谷策略执行成功',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          source: 'strategy_1'
        }
      ],
      market_data: {
        current_price: 0.45 + Math.random() * 0.2,
        price_trend: Math.random() > 0.5 ? 'up' : 'down',
        volume: 15000 + Math.random() * 5000,
        next_settlement: new Date(Date.now() + 3600000).toISOString()
      },
      weather: {
        temperature: 22 + Math.random() * 8,
        humidity: 45 + Math.random() * 20,
        wind_speed: 5 + Math.random() * 8,
        solar_irradiance: isDaytime ? 600 + Math.random() * 300 : 0,
        weather_condition: isDaytime ? 'sunny' : 'clear'
      }
    };
  }, []);

  // 加载实时数据
  const loadRealTimeData = useCallback(async () => {
    try {
      setLoading(true);
      // 在实际应用中，这里应该调用真实的API
      const data = generateMockData();
      setRealTimeData(data);
    } catch (err) {
      setError('加载实时数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [generateMockData]);

  // 设置自动刷新
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadRealTimeData, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, loadRealTimeData]);

  // 初始加载
  useEffect(() => {
    loadRealTimeData();
  }, [loadRealTimeData]);

  // 获取资源图标
  const getResourceIcon = (type) => {
    switch (type) {
      case 'solar':
        return <SunnyIcon />;
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
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 格式化数字
  const formatNumber = (num, decimals = 2) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
    return Number(num).toFixed(decimals);
  };

  // 格式化百分比
  const formatPercentage = (num) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  // 生成功率趋势图数据
  const generatePowerTrendData = () => {
    const labels = [];
    const generationData = [];
    const loadData = [];
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(Date.now() - i * 60000); // 每分钟一个数据点
      labels.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      
      const hour = time.getHours();
      const isDaytime = hour >= 6 && hour <= 18;
      generationData.push(isDaytime ? 700 + Math.random() * 300 : 150 + Math.random() * 100);
      loadData.push(500 + Math.random() * 200 + (isDaytime ? 150 : -50));
    }
    
    return {
      labels,
      datasets: [
        {
          label: '发电功率 (kW)',
          data: generationData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: '负荷功率 (kW)',
          data: loadData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  // 生成资源分布饼图数据
  const generateResourceDistributionData = () => {
    const totalCapacity = realTimeData.resources.reduce((sum, resource) => sum + resource.capacity, 0);
    
    return {
      labels: realTimeData.resources.map(r => r.name),
      datasets: [
        {
          data: realTimeData.resources.map(r => r.capacity),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ],
          hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ]
        }
      ]
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和控制面板 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          实时监控仪表板
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>时间范围</InputLabel>
            <Select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              label="时间范围"
            >
              <MenuItem value="1h">1小时</MenuItem>
              <MenuItem value="6h">6小时</MenuItem>
              <MenuItem value="24h">24小时</MenuItem>
              <MenuItem value="7d">7天</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="自动刷新"
          />
          <Tooltip title="手动刷新">
            <IconButton onClick={loadRealTimeData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 系统概览指标 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard status="normal">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PowerIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">总装机容量</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(realTimeData.overview.total_capacity)} kW
                </Typography>
                <Typography variant="body2" color="success.main">
                  活跃: {formatNumber(realTimeData.overview.active_capacity)} kW
                </Typography>
              </Box>
            </Box>
          </MetricCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard status="normal">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <ElectricIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">当前发电</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(realTimeData.overview.current_generation)} kW
                </Typography>
                <Typography variant="body2" color="info.main">
                  效率: {formatPercentage(realTimeData.overview.system_efficiency)}
                </Typography>
              </Box>
            </Box>
          </MetricCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard status="normal">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <SpeedIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">电网频率</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {realTimeData.overview.grid_frequency.toFixed(2)} Hz
                </Typography>
                <Typography variant="body2" color={
                  Math.abs(realTimeData.overview.grid_frequency - 50) < 0.1 ? 'success.main' : 'warning.main'
                }>
                  {Math.abs(realTimeData.overview.grid_frequency - 50) < 0.1 ? '正常' : '偏差'}
                </Typography>
              </Box>
            </Box>
          </MetricCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard status="normal">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <MoneyIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">今日收益</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  ¥{formatNumber(realTimeData.overview.revenue_today)}
                </Typography>
                <Typography variant="body2" color="success.main">
                  减碳: {realTimeData.overview.carbon_reduction.toFixed(1)}t
                </Typography>
              </Box>
            </Box>
          </MetricCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 功率趋势图 */}
        <Grid item xs={12} lg={8}>
          <StyledCard>
            <CardHeader
              title="功率趋势"
              action={
                <Chip
                  label={autoRefresh ? '实时更新' : '已暂停'}
                  color={autoRefresh ? 'success' : 'default'}
                  size="small"
                />
              }
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line
                  data={generatePowerTrendData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '功率 (kW)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: '时间'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* 资源分布 */}
        <Grid item xs={12} lg={4}>
          <StyledCard>
            <CardHeader title="资源分布" />
            <CardContent>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut
                  data={generateResourceDistributionData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* 资源状态 */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardHeader title="资源状态" />
            <CardContent>
              <List>
                {realTimeData.resources.map((resource) => (
                  <ListItem key={resource.id} divider>
                    <ListItemIcon>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <StatusIndicator status={resource.status} />
                        }
                      >
                        <Avatar sx={{ bgcolor: getStatusColor(resource.status) + '.main' }}>
                          {getResourceIcon(resource.type)}
                        </Avatar>
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={resource.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {resource.type === 'battery' ? 
                              `SOC: ${formatPercentage(resource.soc)} | 循环: ${resource.cycles}` :
                              resource.type === 'wind' ?
                              `风速: ${resource.wind_speed?.toFixed(1)} m/s` :
                              resource.type === 'solar' ?
                              `温度: ${resource.temperature?.toFixed(1)}°C` :
                              `功率因数: ${resource.power_factor?.toFixed(2)}`
                            }
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(Math.abs(resource.current_output) / resource.capacity) * 100}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6">
                        {formatNumber(Math.abs(resource.current_output))} kW
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatPercentage(Math.abs(resource.current_output) / resource.capacity)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* 策略执行状态 */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardHeader title="策略执行状态" />
            <CardContent>
              <List>
                {realTimeData.strategies.map((strategy) => (
                  <ListItem key={strategy.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: getStatusColor(strategy.status) + '.main' }}>
                        <AssessmentIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={strategy.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            今日执行: {strategy.executions_today}次 | 成功率: {formatPercentage(strategy.success_rate)}
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            今日收益: ¥{formatNumber(strategy.profit_today)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={strategy.status === 'active' ? '运行中' : '已停止'}
                      color={getStatusColor(strategy.status)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* 市场数据 */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardHeader title="市场数据" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">当前电价</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        ¥{realTimeData.market_data.current_price.toFixed(3)}
                      </Typography>
                      {realTimeData.market_data.price_trend === 'up' ? 
                        <TrendingUpIcon color="success" /> : 
                        <TrendingDownIcon color="error" />
                      }
                    </Box>
                    <Typography variant="body2" color="text.secondary">/kWh</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">交易量</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {formatNumber(realTimeData.market_data.volume)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">MWh</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    下次结算: {new Date(realTimeData.market_data.next_settlement).toLocaleString('zh-CN')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* 天气信息 */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardHeader title="天气信息" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ThermostatIcon color="primary" />
                    <Typography variant="body2" color="text.secondary">温度</Typography>
                    <Typography variant="h6">
                      {realTimeData.weather.temperature.toFixed(1)}°C
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AirIcon color="primary" />
                    <Typography variant="body2" color="text.secondary">风速</Typography>
                    <Typography variant="h6">
                      {realTimeData.weather.wind_speed.toFixed(1)} m/s
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SunnyIcon color="warning" />
                    <Typography variant="body2" color="text.secondary">辐照度</Typography>
                    <Typography variant="h6">
                      {formatNumber(realTimeData.weather.solar_irradiance)} W/m²
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">湿度</Typography>
                    <Typography variant="h6">
                      {realTimeData.weather.humidity.toFixed(0)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* 系统告警 */}
        <Grid item xs={12}>
          <StyledCard>
            <CardHeader
              title="系统告警"
              action={
                <Badge badgeContent={realTimeData.alerts.length} color="error">
                  <NotificationsIcon />
                </Badge>
              }
            />
            <CardContent>
              {realTimeData.alerts.length > 0 ? (
                <List>
                  {realTimeData.alerts.map((alert) => (
                    <ListItem key={alert.id} divider>
                      <ListItemIcon>
                        {alert.type === 'warning' ? 
                          <WarningIcon color="warning" /> : 
                          alert.type === 'error' ? 
                          <ErrorIcon color="error" /> : 
                          <CheckCircleIcon color="info" />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              来源: {alert.source}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(alert.timestamp).toLocaleString('zh-CN')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    系统运行正常，无告警信息
                  </Typography>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

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
    </Box>
  );
};

export default RealTimeMonitoringDashboard;