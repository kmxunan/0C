import React, { useState, useEffect } from 'react';
import { getDeviceStatus, getDeviceHistory } from '../../api/deviceApi';
import { Box, Typography, CircularProgress, Card, CardContent, Grid, Chip, Alert } from '@mui/material';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend }
from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DeviceStatus = ({ match }) => {
  const { id } = match.params;
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
 
  const [sensorHistory, setSensorHistory] = useState([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const data = await getDeviceStatus(id);
        setDeviceStatus(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch device status. Please try again later.');
        console.error('Error fetching device status:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSensorHistory = async () => {
      try {
        setLoading(true);
        const hours = 24; // 默认24小时
        const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        const endTime = new Date().toISOString();

        const response = await getDeviceHistory(id, {
          startTime,
          endTime,
          limit: 100
        });

        setSensorHistory(response.data);
      } catch (error) {
        console.error('获取传感器历史数据失败:', error);
        setError('无法加载传感器历史数据，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    fetchSensorHistory();
    const intervalId = setInterval(() => {
      fetchStatus();
      fetchSensorHistory();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box my={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!deviceStatus) return null;

  // 状态指示颜色
  const statusColor = {
    online: 'success',
    offline: 'error',
    warning: 'warning',
    maintenance: 'info'
  }[deviceStatus.status] || 'default';

  // 图表数据配置
  const sensorDataChartConfig = {
    labels: sensorHistory.map(d => new Date(d.timestamp).toLocaleTimeString()) || [],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: sensorHistory.map(d => d.data.temperature) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Humidity (%)',
        data: sensorHistory.map(d => d.data.humidity) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Pressure (hPa)',
        data: sensorHistory.map(d => d.data.pressure) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const statusDistributionConfig = {
    labels: ['Normal', 'Warning', 'Alert'],
    datasets: [
      {
        data: [
          deviceStatus.alerts?.filter(a => a.severity === 'normal').length || 0,
          deviceStatus.alerts?.filter(a => a.severity === 'warning').length || 0,
          deviceStatus.alerts?.filter(a => a.severity === 'alert').length || 0,
        ],
        backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Device Status - {deviceStatus.name}</Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>Status</Typography>
              <Chip
                label={deviceStatus.status.toUpperCase()}
                color={statusColor}
                size="large"
                sx={{ fontSize: '1.2rem', height: '40px' }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>Last Activity</Typography>
              <Typography variant="body1">
                {new Date(deviceStatus.lastActivity).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>Uptime</Typography>
              <Typography variant="body1">{deviceStatus.uptime} hours</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>Active Alerts</Typography>
              <Typography variant="body1" color={deviceStatus.activeAlerts > 0 ? 'error' : 'inherit'}>
                {deviceStatus.activeAlerts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sensor Data History</Typography>
              <Box height={300}>
                <Line
                  data={sensorDataChartConfig}
                  options={{ maintainAspectRatio: false }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Alert Distribution</Typography>
              <Box height={300} display="flex" justifyContent="center" alignItems="center">
                <Doughnut
                  data={statusDistributionConfig}
                  options={{ maintainAspectRatio: false }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {deviceStatus.alerts && deviceStatus.alerts.length > 0 && (
        <Card mb={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
            {deviceStatus.alerts.slice(0, 5).map((alert, index) => (
              <Alert
                key={index}
                severity={alert.severity === 'alert' ? 'error' : alert.severity}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">{alert.message}</Typography>
                <Typography variant="caption">{new Date(alert.timestamp).toLocaleString()}</Typography>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DeviceStatus;