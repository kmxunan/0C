import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Card, CardContent } from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import axios from 'axios';

// 注册Chart.js组件
Chart.register(...registerables);

const EnergyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [energyData, setEnergyData] = useState([]);
  const [carbonData, setCarbonData] = useState([]);
  const [deviceStats, setDeviceStats] = useState({ active: 0, offline: 0, total: 0 });
  const [error, setError] = useState(null);

  // 使用useCallback缓存数据获取函数
  const fetchEnergyData = useCallback(async () => {
    try {
      const response = await axios.get('/api/energy-data?period=24h');
      setEnergyData(response.data.data);
    } catch (err) {
      console.error('获取能源数据失败:', err);
      setError('无法加载能源数据');
    }
  }, []);

  const fetchCarbonData = useCallback(async () => {
    try {
      const response = await axios.get('/api/carbon-data?period=24h');
      setCarbonData(response.data.data);
    } catch (err) {
      console.error('获取碳排放数据失败:', err);
      setError('无法加载碳排放数据');
    }
  }, []);

  const fetchDeviceStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/devices/stats');
      setDeviceStats(response.data.data);
    } catch (err) {
      console.error('获取设备统计失败:', err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchEnergyData(), fetchCarbonData(), fetchDeviceStats()]);
      setLoading(false);
    };

    fetchData();

    // 设置定时器定期刷新数据
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 每5分钟刷新一次
    return () => clearInterval(interval);
  }, [fetchEnergyData, fetchCarbonData, fetchDeviceStats]);

  // 使用useMemo缓存图表数据计算结果，避免不必要的重渲染
  const energyChartData = useMemo(() => ({
    labels: energyData.map(item => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: '能耗 (kWh)',
        data: energyData.map(item => item.energy_consumption),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: '功率 (kW)',
        data: energyData.map(item => item.power),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }), [energyData]);

  const carbonChartData = useMemo(() => ({
    labels: carbonData.map(item => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: '碳排放量 (kg CO₂)',
        data: carbonData.map(item => item.carbon_emission),
        borderColor: '#dc004e',
        backgroundColor: 'rgba(220, 0, 78, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }), [carbonData]);

  const deviceStatusData = useMemo(() => ({
    labels: ['在线设备', '离线设备'],
    datasets: [
      {
        data: [deviceStats.active, deviceStats.offline],
        backgroundColor: ['#4caf50', '#f44336'],
        borderWidth: 1
      }
    ]
  }), [deviceStats]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>能源与碳排放监控仪表盘</Typography>

      {error && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          {error}
        </Paper>
      )}

      {/* 设备状态卡片 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">总设备数</Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>{deviceStats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">在线设备</Typography>
              <Typography variant="h3" sx={{ mt: 1, color: 'success.main' }}>{deviceStats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">离线设备</Typography>
              <Typography variant="h3" sx={{ mt: 1, color: 'error.main' }}>{deviceStats.offline}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 图表区域 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>能源消耗趋势 (过去24小时)</Typography>
            <Box height="320px">
              <Line data={energyChartData} options={{ maintainAspectRatio: false, responsive: true }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>设备状态分布</Typography>
            <Box height="320px" display="flex" justifyContent="center" alignItems="center">
              <Doughnut data={deviceStatusData} options={{ maintainAspectRatio: false, responsive: true }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>碳排放趋势 (过去24小时)</Typography>
            <Box height="320px">
              <Bar data={carbonChartData} options={{ maintainAspectRatio: false, responsive: true }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnergyDashboard;