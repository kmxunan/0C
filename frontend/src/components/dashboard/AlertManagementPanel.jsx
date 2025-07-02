import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Menu, MenuItem, TextField, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Alert, CheckCircle, Warning, Error, FilterList, Download, MoreVert, Search } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const AlertManagementPanel = () => {
  const theme = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // 获取告警数据
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/alerts', {
          params: { status: filter !== 'all' ? filter : undefined }
        });
        setAlerts(response.data);
        setError(null);
      } catch (err) {
        console.error('获取告警数据失败:', err);
        setError('无法加载告警数据，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    // 初始加载
    fetchAlerts();

    // 每30秒刷新一次
    const intervalId = setInterval(fetchAlerts, 30000);

    return () => clearInterval(intervalId);
  }, [filter]);

  // 根据告警级别获取对应的颜色和图标
  const getAlertIndicator = (severity) => {
    switch (severity) {
      case 'info':
        return { color: '#2196f3', icon: <Info fontSize="small" />, label: '信息' };
      case 'warning':
        return { color: '#ff9800', icon: <Warning fontSize="small" />, label: '警告' };
      case 'critical':
        return { color: '#f44336', icon: <Error fontSize="small" />, label: '严重' };
      default:
        return { color: '#2196f3', icon: <Info fontSize="small" />, label: '未知' };
    }
  };

  // 根据状态获取对应的颜色
  const getStatusColor = (status) => {
    return status === 'resolved' ? '#4caf50' : '#f44336';
  };

  // 处理告警状态变更
  const handleAlertAction = async (alertId, action) => {
    try {
      await axios.patch(`/api/alerts/${alertId}/status`, {
        status: action === 'resolve' ? 'resolved' : 'acknowledged'
      });
      // 刷新告警列表
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: action === 'resolve' ? 'resolved' : 'acknowledged' } : alert
      ));
    } catch (err) {
      console.error('更新告警状态失败:', err);
      setError('更新告警状态失败，请稍后重试');
    }
  };

  // 打开告警操作菜单
  const handleMenuOpen = (event, alert) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlert(alert);
  };

  // 关闭告警操作菜单
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlert(null);
  };

  // 导出告警数据
  const exportAlerts = () => {
    // 这里实现导出逻辑，可以导出为CSV或Excel
    alert('告警数据导出功能将在后续实现');
  };

  // 筛选告警
  const filteredAlerts = alerts.filter(alert => 
    (alert.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     alert.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 计算告警统计
  const alertSummary = alerts.reduce((summary, alert) => {
    summary[alert.severity] = (summary[alert.severity] || 0) + 1;
    summary[alert.status] = (summary[alert.status] || 0) + 1;
    return summary;
  }, { info: 0, warning: 0, critical: 0, active: 0, resolved: 0 });

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">告警管理</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={exportAlerts}
          >
            导出
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterList />}
            onClick={() => setFilter(filter === 'all' ? 'active' : 'all')}
          >
            {filter === 'all' ? '显示全部' : '仅显示活跃'}
          </Button>
        </Box>
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder="搜索设备名称或告警信息..."
        variant="outlined"
        sx={{ mb: 3 }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <Divider sx={{ mb: 3 }} />

      {/* 告警概览 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="h5" color="#1565c0">{alertSummary.info}</Typography>
            <Typography variant="body2" color="textSecondary">信息</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff8e1' }}>
            <Typography variant="h5" color="#ff8f00">{alertSummary.warning}</Typography>
            <Typography variant="body2" color="textSecondary">警告</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
            <Typography variant="h5" color="#c62828">{alertSummary.critical}</Typography>
            <Typography variant="body2" color="textSecondary">严重</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffe0b2' }}>
            <Typography variant="h5" color="#e65100">{alertSummary.active}</Typography>
            <Typography variant="body2" color="textSecondary">活跃告警</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 告警列表 */}
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>设备名称</TableCell>
              <TableCell>告警级别</TableCell>
              <TableCell>告警信息</TableCell>
              <TableCell>发生时间</TableCell>
              <TableCell>状态</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => {
                const alertIndicator = getAlertIndicator(alert.severity);
                return (
                  <TableRow key={alert.id} hover>
                    <TableCell>{alert.deviceName}</TableCell>
                    <TableCell>
                      <Chip
                        icon={alertIndicator.icon}
                        label={alertIndicator.label}
                        size="small"
                        sx={{ bgcolor: alertIndicator.color, color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>
                      {format(new Date(alert.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status === 'resolved' ? '已解决' : '活跃'}
                        size="small"
                        sx={{ bgcolor: getStatusColor(alert.status), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, alert)}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  没有找到告警数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 告警操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        keepMounted
      >
        {selectedAlert && selectedAlert.status !== 'resolved' && (
          <>
            <MenuItem onClick={() => {
              handleAlertAction(selectedAlert.id, 'acknowledged');
              handleMenuClose();
            }}>
              确认告警
            </MenuItem>
            <MenuItem onClick={() => {
              handleAlertAction(selectedAlert.id, 'resolve');
              handleMenuClose();
            }}>
              标记为已解决
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleMenuClose}>查看详情</MenuItem>
      </Menu>
    </Paper>
  );
};

export default AlertManagementPanel;