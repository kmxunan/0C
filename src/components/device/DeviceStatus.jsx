import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress, Alert, Chip, Divider, List, ListItem, ListItemText, ListItemIcon, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';
import { getDeviceStatus } from '../../api/deviceApi';
import { Alert as AlertIcon, BatteryFull, ThermometerHalf, Zap, Wifi } from '@mui/icons-material';
import moment from 'moment';

const statusColors = {
  0: 'error',    // 离线
  1: 'success',  // 正常
  2: 'warning',  // 警告
  3: 'error'     // 故障
};

const statusLabels = {
  0: '离线',
  1: '正常',
  2: '警告',
  3: '故障'
};

const sensorIcons = {
  'temperature': <ThermometerHalf />,
  'power': <Zap />,
  'battery': <BatteryFull />,
  'signal': <Wifi />,
  'default': <Zap />
};

const DeviceStatus = () => {
  const { id } = useParams();
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    const fetchDeviceStatus = async () => {
      try {
        setLoading(true);
        const data = await getDeviceStatus(id);
        setDeviceData(data);
        setError(null);
      } catch (err) {
        console.error('获取设备状态失败:', err);
        setError('无法获取设备状态数据，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    // 初始加载
    fetchDeviceStatus();

    // 设置定时刷新（每30秒）
    const interval = setInterval(fetchDeviceStatus, 30000);
    setRefreshInterval(interval);

    // 清理函数
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box my={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!deviceData || !deviceData.data) {
    return (
      <Box my={2}>
        <Alert severity="info">未找到设备状态数据</Alert>
      </Box>
    );
  }

  const { device, sensor_data, active_alerts } = deviceData.data;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>设备状态监控</Typography>

      {/* 设备基本信息卡片 */}
      <Card mb={3}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5">{device.name}</Typography>
              <Typography color="textSecondary">
                {device.building_name} | 设备类型: {device.type} | 最后更新: {moment(device.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Chip
                label={statusLabels[device.status]}
                color={statusColors[device.status]}
                size="large"
                sx={{ float: 'right' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3} mt={2}>
        {/* 传感器数据面板 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>实时传感器数据</Typography>
            <Divider sx={{ mb: 2 }} />

            {sensor_data && sensor_data.length > 0 ? (
              <Grid container spacing={2}>
                {sensor_data.map((sensor, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          {sensorIcons[sensor.sensor_type] || sensorIcons.default}
                          <Typography variant="subtitle1" sx={{ ml: 1 }}>{sensor.sensor_name}</Typography>
                        </Box>
                        <Typography variant="h4">
                          {sensor.value !== null ? sensor.value : '--'}
                          {sensor.unit && <span style={{ fontSize: '0.7em', marginLeft: '5px' }}>{sensor.unit}</span>}
                        </Typography>
                        {sensor.timestamp && (
                          <Typography variant="caption" color="textSecondary">
                            更新于: {moment(sensor.timestamp).format('HH:mm:ss')}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">暂无传感器数据</Alert>
            )}
          </Paper>
        </Grid>

        {/* 告警信息面板 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>活跃告警 ({active_alerts.length})</Typography>
            <Divider sx={{ mb: 2 }} />

            {active_alerts && active_alerts.length > 0 ? (
              <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {active_alerts.map((alert) => (
                  <ListItem key={alert.id} divider>
                    <ListItemIcon>
                      <AlertIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.message}
                      secondary={
                        <>                          
                          <Typography component="span" variant="body2" color="textPrimary">
                            {alert.rule_name}
                          </Typography>
                          <br />
                          当前值: {alert.current_value} | 阈值: {alert.threshold_value}
                          <br />
                          {moment(alert.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success">暂无活跃告警</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeviceStatus;