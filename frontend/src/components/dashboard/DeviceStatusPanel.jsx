import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Alert, CheckCircle, Warning, Error, Info } from '@mui/icons-material';
import axios from 'axios';

const DeviceStatusPanel = () => {
  const theme = useTheme();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取设备状态数据
  useEffect(() => {
    const fetchDeviceStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/devices/status');
        setDevices(response.data);
        setError(null);
      } catch (err) {
        console.error('获取设备状态失败:', err);
        setError('无法加载设备状态数据，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    // 初始加载
    fetchDeviceStatus();

    // 每10秒刷新一次
    const intervalId = setInterval(fetchDeviceStatus, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // 根据状态获取对应的颜色和图标
  const getStatusIndicator = (status) => {
    switch (status) {
      case 'normal':
        return { color: '#4caf50', icon: <CheckCircle fontSize="small" /> };
      case 'warning':
        return { color: '#ff9800', icon: <Warning fontSize="small" /> };
      case 'alert':
        return { color: '#f44336', icon: <Error fontSize="small" /> };
      default:
        return { color: '#2196f3', icon: <Info fontSize="small" /> };
    }
  };

  // 计算设备状态统计
  const statusSummary = devices.reduce((summary, device) => {
    summary[device.status] = (summary[device.status] || 0) + 1;
    return summary;
  }, { normal: 0, warning: 0, alert: 0, unknown: 0 });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error" icon={<Error />}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>设备状态监控</Typography>
      <Divider sx={{ mb: 3 }} />

      {/* 状态概览 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
            <Typography variant="h5" color="#2e7d32">{statusSummary.normal}</Typography>
            <Typography variant="body2" color="textSecondary">正常</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff8e1' }}>
            <Typography variant="h5" color="#ff8f00">{statusSummary.warning}</Typography>
            <Typography variant="body2" color="textSecondary">警告</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
            <Typography variant="h5" color="#c62828">{statusSummary.alert}</Typography>
            <Typography variant="body2" color="textSecondary">告警</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="h5" color="#1565c0">{devices.length}</Typography>
            <Typography variant="body2" color="textSecondary">总数</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 设备列表 */}
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>设备名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>位置</TableCell>
              <TableCell>状态</TableCell>
              <TableCell align="right">能耗 (kWh)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => {
              const statusIndicator = getStatusIndicator(device.status);
              return (
                <TableRow key={device.id} hover>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.type}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>
                    <Chip
                      icon={statusIndicator.icon}
                      label={device.status === 'normal' ? '正常' : device.status === 'warning' ? '警告' : device.status === 'alert' ? '告警' : '未知'}
                      size="small"
                      sx={{ bgcolor: statusIndicator.color, color: 'white' }}
                    />
                  </TableCell>
                  <TableCell align="right">{device.energyConsumption.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DeviceStatusPanel;