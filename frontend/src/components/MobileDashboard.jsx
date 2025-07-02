/**
 * 移动端仪表板组件
 * 专为移动设备优化的能源管理界面
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Fab,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Alert,
  Collapse,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import {
  ElectricBolt,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Refresh,
  Menu,
  Close,
  Notifications,
  Settings,
  DevicesOther,
  Analytics,
  Nature,
  Battery3Bar,
  WbSunny,
  Air,
  Factory
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const MobileDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('energy');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    energy: {
      production: 850.5,
      consumption: 720.3,
      efficiency: 84.7,
      trend: 'up'
    },
    carbon: {
      emission: 125.8,
      reduction: 15.2,
      target: 200,
      trend: 'down'
    },
    devices: {
      online: 12,
      offline: 1,
      warning: 2,
      total: 15
    },
    alerts: [
      {
        id: '1',
        level: 'warning',
        message: '设备温度偏高',
        time: '5分钟前'
      },
      {
        id: '2',
        level: 'info',
        message: '储能系统充电完成',
        time: '15分钟前'
      }
    ]
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    // 模拟数据加载
    const mockChartData = Array.from({ length: 12 }, (_, i) => ({
      time: `${i + 1}:00`,
      energy: 800 + Math.random() * 200,
      carbon: 100 + Math.random() * 50
    }));
    setChartData(mockChartData);
  };

  const handleRefresh = () => {
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getAlertColor = (level) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'success';
    }
  };

  const MetricCard = ({ title, value, unit, trend, icon, color = 'primary' }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette[color].light}20, ${theme.palette[color].main}10)`,
        border: `1px solid ${theme.palette[color].light}`,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)'
        }
      }}
      onClick={() => setSelectedMetric(title.toLowerCase())}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {value}
              <Typography component="span" variant="body2" color="text.secondary">
                {unit}
              </Typography>
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              {trend === 'up' ? (
                <TrendingUp color="success" fontSize="small" />
              ) : (
                <TrendingDown color="error" fontSize="small" />
              )}
              <Typography variant="caption" color={getStatusColor(trend)} ml={0.5}>
                {trend === 'up' ? '上升' : '下降'}
              </Typography>
            </Box>
          </Box>
          <Avatar sx={{ bgcolor: `${theme.palette[color].main}20` }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const QuickActionButton = ({ icon, label, onClick, badge = 0 }) => (
    <Box textAlign="center">
      <IconButton
        size="large"
        onClick={onClick}
        sx={{
          bgcolor: 'background.paper',
          boxShadow: 2,
          mb: 1,
          '&:hover': {
            bgcolor: 'primary.light',
            color: 'white'
          }
        }}
      >
        <Badge badgeContent={badge} color="error">
          {icon}
        </Badge>
      </IconButton>
      <Typography variant="caption" display="block">
        {label}
      </Typography>
    </Box>
  );

  const renderChart = () => {
    if (selectedMetric === 'energy') {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <XAxis dataKey="time" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="energy" 
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.light}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="carbon" 
              stroke={theme.palette.success.main}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* 顶部状态栏 */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2, 
          background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight="bold">
              智慧园区
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              实时监控 · 智能管理
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton 
              color="inherit" 
              onClick={() => setAlertsOpen(!alertsOpen)}
            >
              <Badge badgeContent={realTimeData.alerts.length} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton color="inherit" onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* 告警通知 */}
      <Collapse in={alertsOpen}>
        <Box mb={2}>
          {realTimeData.alerts.map((alert) => (
            <Alert 
              key={alert.id}
              severity={getAlertColor(alert.level)}
              sx={{ mb: 1 }}
              onClose={() => {
                setRealTimeData(prev => ({
                  ...prev,
                  alerts: prev.alerts.filter(a => a.id !== alert.id)
                }));
              }}
            >
              <Typography variant="body2">
                {alert.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {alert.time}
              </Typography>
            </Alert>
          ))}
        </Box>
      </Collapse>

      {/* 核心指标卡片 */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6}>
          <MetricCard
            title="能源效率"
            value={realTimeData.energy.efficiency}
            unit="%"
            trend={realTimeData.energy.trend}
            icon={<ElectricBolt />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6}>
          <MetricCard
            title="碳排放"
            value={realTimeData.carbon.emission}
            unit="kg"
            trend={realTimeData.carbon.trend}
            icon={<Nature />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* 详细数据卡片 */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                能源生产
              </Typography>
              <Typography variant="h6" color="primary">
                {realTimeData.energy.production} kWh
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={75} 
                sx={{ mt: 1 }}
                color="primary"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                能源消耗
              </Typography>
              <Typography variant="h6" color="warning">
                {realTimeData.energy.consumption} kWh
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={60} 
                sx={{ mt: 1 }}
                color="warning"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 设备状态 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            设备状态
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="success.main">
                  {realTimeData.devices.online}
                </Typography>
                <Typography variant="caption">在线</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="error.main">
                  {realTimeData.devices.offline}
                </Typography>
                <Typography variant="caption">离线</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="warning.main">
                  {realTimeData.devices.warning}
                </Typography>
                <Typography variant="caption">告警</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="primary.main">
                  {realTimeData.devices.total}
                </Typography>
                <Typography variant="caption">总计</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 趋势图表 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">
              {selectedMetric === 'energy' ? '能源趋势' : '碳排放趋势'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip 
                label="能源" 
                color={selectedMetric === 'energy' ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedMetric('energy')}
              />
              <Chip 
                label="碳排放" 
                color={selectedMetric === 'carbon' ? 'success' : 'default'}
                size="small"
                onClick={() => setSelectedMetric('carbon')}
              />
            </Stack>
          </Box>
          {renderChart()}
        </CardContent>
      </Card>

      {/* 快捷操作 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            快捷操作
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={3}>
              <QuickActionButton
                icon={<DevicesOther />}
                label="设备"
                onClick={() => {}}
              />
            </Grid>
            <Grid item xs={3}>
              <QuickActionButton
                icon={<Analytics />}
                label="分析"
                onClick={() => {}}
              />
            </Grid>
            <Grid item xs={3}>
              <QuickActionButton
                icon={<Notifications />}
                label="告警"
                badge={realTimeData.alerts.length}
                onClick={() => {}}
              />
            </Grid>
            <Grid item xs={3}>
              <QuickActionButton
                icon={<Settings />}
                label="设置"
                onClick={() => {}}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 浮动操作按钮 */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => setDrawerOpen(true)}
      >
        <Menu />
      </Fab>

      {/* 侧边抽屉菜单 */}
      <SwipeableDrawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">菜单</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItem button>
              <ListItemIcon><Dashboard /></ListItemIcon>
              <ListItemText primary="仪表板" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><DevicesOther /></ListItemIcon>
              <ListItemText primary="设备管理" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><ElectricBolt /></ListItemIcon>
              <ListItemText primary="能源监控" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><Analytics /></ListItemIcon>
              <ListItemText primary="数据分析" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><Nature /></ListItemIcon>
              <ListItemText primary="碳排放管理" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <Badge badgeContent={realTimeData.alerts.length} color="error">
                  <Notifications />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="告警管理" />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
};

export default MobileDashboard;