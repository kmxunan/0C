import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Alert, Button, Divider, Chip } from '@mui/material';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getEnergyData, getCarbonData, getActiveAlerts, getSystemStatus } from '../services/api';
import { useTheme } from '@mui/material/styles';
import AlertIcon from '@mui/icons-material/Alert';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formatDate, formatNumber } from '../utils/formatters';

// 注册ChartJS组件
ChartJS.register(
  ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
);

/**
 * 仪表板组件 - 展示系统关键指标和告警信息
 */
const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [carbonData, setCarbonData] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 告警严重级别样式映射
  const severityStyles = {
    critical: { color: theme.palette.error.main, icon: <ErrorIcon /> },
    high: { color: theme.palette.warning.main, icon: <WarningIcon /> },
    medium: { color: theme.palette.info.main, icon: <AlertIcon /> },
    low: { color: theme.palette.success.main, icon: <CheckCircleIcon /> }
  };

  // 系统状态样式映射
  const statusStyles = {
    normal: { color: theme.palette.success.main, label: '正常' },
    warning: { color: theme.palette.warning.main, label: '警告' },
    error: { color: theme.palette.error.main, label: '错误' },
    maintenance: { color: theme.palette.info.main, label: '维护中' }
  };

  // 获取仪表板数据
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行获取所有数据
      const [energyRes, carbonRes, alertsRes, statusRes] = await Promise.all([
        getEnergyData({ period: 'day' }),
        getCarbonData({ period: 'day' }),
        getActiveAlerts({ limit: 5 }),
        getSystemStatus()
      ]);

      setEnergyData(energyRes.data);
      setCarbonData(carbonRes.data);
      setActiveAlerts(alertsRes.data);
      setSystemStatus(statusRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('获取仪表板数据失败:', err);
      setError('无法加载仪表板数据，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时和刷新按钮点击时获取数据
  useEffect(() => {
    fetchDashboardData();
    // 设置自动刷新（每30秒）
    const intervalId = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // 能源使用图表配置
  const energyChartConfig = energyData ? {
    labels: energyData.timestamps,
    datasets: [
      {
        label: '电力 (kWh)',
        data: energyData.electricity,
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
      },
      {
        label: '天然气 (m³)',
        data: energyData.gas,
        backgroundColor: theme.palette.secondary.main,
        borderColor: theme.palette.secondary.dark,
        borderWidth: 1,
      }
    ]
  } : null;

  // 碳排放图表配置
  const carbonChartConfig = carbonData ? {
    labels: ['电力', '天然气', '交通', '废弃物'],
    datasets: [
      {
        data: [
          carbonData.electricity,
          carbonData.gas,
          carbonData.transport,
          carbonData.waste
        ],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.warning.main,
          theme.palette.info.main
        ],
        borderWidth: 1,
      }
    ]
  } : null;

  // 图表通用选项
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatNumber(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };

  // 处理刷新按钮点击
  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading && !energyData && !carbonData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          零碳园区监控中心
        </Typography>
        <Box display="flex" alignItems="center">
          {lastUpdated && (
            <Typography variant="body2" color="text.secondary" mr={2}>
              最后更新: {formatDate(lastUpdated)}
            </Typography>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* 系统状态 */}
      {systemStatus && (
        <Box mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="subtitle1">系统状态:</Typography>
            </Grid>
            <Grid item>
              <Chip
                icon={
                  systemStatus.status === 'normal' ? (
                    <CheckCircleIcon />
                  ) : systemStatus.status === 'error' ? (
                    <ErrorIcon />
                  ) : systemStatus.status === 'warning' ? (
                    <WarningIcon />
                  ) : (
                    <AlertIcon />
                  )
                }
                label={statusStyles[systemStatus.status]?.label || systemStatus.status}
                color={
                  systemStatus.status === 'normal' ? 'success' :
                  systemStatus.status === 'error' ? 'error' :
                  systemStatus.status === 'warning' ? 'warning' : 'info'
                }
                size="small"
              />
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                设备在线率: {systemStatus.deviceOnlineRate}% ({systemStatus.onlineDevices}/{systemStatus.totalDevices})
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                数据更新频率: {systemStatus.updateFrequency}秒
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* 关键指标卡片 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                总能耗 (今日)
              </Typography>
              <Typography variant="h4" component="div">
                {energyData ? formatNumber(energyData.total) : '--'}
              </Typography>
              <Typography variant="body2" color={energyData?.trend >= 0 ? 'error.main' : 'success.main'}>
                {energyData ? `${energyData.trend >= 0 ? '+' : ''}${energyData.trend}% 较昨日` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                总碳排放 (今日)
              </Typography>
              <Typography variant="h4" component="div">
                {carbonData ? formatNumber(carbonData.total) : '--'} kg CO₂
              </Typography>
              <Typography variant="body2" color={carbonData?.trend >= 0 ? 'error.main' : 'success.main'}>
                {carbonData ? `${carbonData.trend >= 0 ? '+' : ''}${carbonData.trend}% 较昨日` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                活跃告警
              </Typography>
              <Typography variant="h4" component="div" color={activeAlerts.length > 0 ? 'warning.main' : 'textPrimary'}>
                {activeAlerts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                严重: {activeAlerts.filter(a => a.severity === 'critical').length},
                高级: {activeAlerts.filter(a => a.severity === 'high').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                能源效率指数
              </Typography>
              <Typography variant="h4" component="div">
                {systemStatus ? systemStatus.energyEfficiencyIndex.toFixed(2) : '--'}
              </Typography>
              <Typography variant="body2" color={systemStatus?.energyEfficiencyTrend >= 0 ? 'success.main' : 'error.main'}>
                {systemStatus ? `${systemStatus.energyEfficiencyTrend >= 0 ? '+' : ''}${systemStatus.energyEfficiencyTrend}% 较上周` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 能源使用图表 */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                今日能源消耗趋势
              </Typography>
              <Box height={300}>
                {energyChartConfig ? (
                  <Bar
                    data={energyChartConfig}
                    options={{...chartOptions, scales: { y: { beginAtZero: true } }}}
                  />
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">无法加载能源数据</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 碳排放饼图 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                碳排放构成
              </Typography>
              <Box height={300} display="flex" justifyContent="center" alignItems="center">
                {carbonChartConfig ? (
                  <Doughnut
                    data={carbonChartConfig}
                    options={chartOptions}
                  />
                ) : (
                  <Typography color="textSecondary">无法加载碳排放数据</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 活跃告警列表 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">活跃告警</Typography>
                <Button size="small" color="primary">查看全部</Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {activeAlerts.length === 0 ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <Typography color="textSecondary">暂无活跃告警</Typography>
                </Box>
              ) : (
                <Box>
                  {activeAlerts.map(alert => (
                    <Box key={alert.id} mb={2} p={2} border={1} borderColor="divider" borderRadius={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box display="flex" alignItems="center">
                          {severityStyles[alert.severity]?.icon}
                          <Typography variant="subtitle2" ml={1}>
                            {alert.description}
                          </Typography>
                          <Chip
                            size="small"
                            label={alert.severity.toUpperCase()}
                            color={
                              alert.severity === 'critical' ? 'error' :
                              alert.severity === 'high' ? 'warning' :
                              alert.severity === 'medium' ? 'info' : 'success'
                            }
                            sx={{ ml: 2 }}
                          />
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(new Date(alert.created_at))}
                        </Typography>
                      </Box>
                      <Box mt={1}>
                        <Typography variant="body2" color="textSecondary">
                          设备: {alert.device_id} | 规则ID: {alert.rule_id}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;