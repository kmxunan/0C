/**
 * VPP市场连接器仪表板组件
 * 提供市场连接状态监控和管理界面
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  WifiOff as DisconnectedIcon,
  Wifi as ConnectedIcon,
  Sync as SyncIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  CloudQueue as CloudIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement
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

const StatusCard = styled(Paper)(({ theme, status }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  borderLeft: `4px solid ${
    status === 'connected' ? theme.palette.success.main :
    status === 'error' ? theme.palette.error.main :
    status === 'connecting' ? theme.palette.warning.main :
    theme.palette.grey[400]
  }`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const MetricCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const MarketConnectorDashboard = () => {
  // 状态管理
  const [marketConnections, setMarketConnections] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [connectionStats, setConnectionStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 对话框状态
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  
  // 表格分页
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 实时更新
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // 表单状态
  const [configForm, setConfigForm] = useState({
    market_name: '',
    market_type: 'spot',
    api_endpoint: '',
    ws_endpoint: '',
    auth_config: {
      api_key: '',
      secret_key: '',
      auth_type: 'api_key'
    },
    connection_config: {
      timeout: 30000,
      heartbeat_interval: 30000,
      reconnect_attempts: 5,
      reconnect_delay: 5000
    },
    trading_config: {
      max_order_size: 1000,
      min_order_size: 1,
      price_precision: 2,
      quantity_precision: 2
    },
    settlement_config: {
      settlement_period: 'hourly',
      settlement_delay: 3600,
      auto_settlement: true
    }
  });

  // 模拟数据
  const mockMarketConnections = [
    {
      connection_id: '1',
      market_name: '云南省电力市场',
      market_type: 'spot',
      status: 'connected',
      last_heartbeat: new Date().toISOString(),
      api_endpoint: 'https://api.ynpowermarket.com/v1',
      ws_endpoint: 'wss://ws.ynpowermarket.com/v1',
      connection_time: new Date(Date.now() - 3600000).toISOString(),
      data_received: 15420,
      orders_submitted: 45,
      last_error: null,
      latency: 25
    },
    {
      connection_id: '2',
      market_name: '云南省共享储能容量租赁市场',
      market_type: 'capacity',
      status: 'connected',
      last_heartbeat: new Date().toISOString(),
      api_endpoint: 'https://api.ynstorage.com/v1',
      ws_endpoint: 'wss://ws.ynstorage.com/v1',
      connection_time: new Date(Date.now() - 7200000).toISOString(),
      data_received: 8930,
      orders_submitted: 12,
      last_error: null,
      latency: 18
    },
    {
      connection_id: '3',
      market_name: '南方电网现货市场',
      market_type: 'spot',
      status: 'error',
      last_heartbeat: new Date(Date.now() - 300000).toISOString(),
      api_endpoint: 'https://api.csgmarket.com/v1',
      ws_endpoint: 'wss://ws.csgmarket.com/v1',
      connection_time: null,
      data_received: 0,
      orders_submitted: 0,
      last_error: 'Authentication failed',
      latency: null
    }
  ];

  const mockConnectionStats = {
    total_connections: 3,
    active_connections: 2,
    failed_connections: 1,
    total_data_received: 24350,
    total_orders_submitted: 57,
    average_latency: 21.5,
    uptime_percentage: 95.2
  };

  // 加载数据
  const loadMarketConnections = useCallback(async () => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMarketConnections(mockMarketConnections);
      setConnectionStats(mockConnectionStats);
    } catch (err) {
      setError('加载市场连接失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 自动刷新
  useEffect(() => {
    loadMarketConnections();
    
    if (autoRefresh) {
      const interval = setInterval(loadMarketConnections, 30000); // 30秒刷新
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, loadMarketConnections]);

  // 连接操作
  const handleConnect = async (connectionId) => {
    try {
      setLoading(true);
      // 模拟连接操作
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('市场连接成功');
      await loadMarketConnections();
    } catch (err) {
      setError('连接失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    try {
      setLoading(true);
      // 模拟断开连接操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('已断开市场连接');
      await loadMarketConnections();
    } catch (err) {
      setError('断开连接失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (connectionId) => {
    try {
      setLoading(true);
      // 模拟连接测试
      await new Promise(resolve => setTimeout(resolve, 3000));
      setSuccess('连接测试成功');
    } catch (err) {
      setError('连接测试失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <ConnectedIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'connecting':
        return <SyncIcon color="warning" />;
      default:
        return <DisconnectedIcon color="disabled" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'error':
        return 'error';
      case 'connecting':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 图表配置
  const connectionStatusChartData = {
    labels: ['已连接', '连接中', '错误', '断开'],
    datasets: [{
      data: [2, 0, 1, 0],
      backgroundColor: [
        '#4caf50',
        '#ff9800',
        '#f44336',
        '#9e9e9e'
      ],
      borderWidth: 2
    }]
  };

  const latencyChartData = {
    labels: ['云南电力市场', '云南储能市场', '南方电网'],
    datasets: [{
      label: '延迟 (ms)',
      data: [25, 18, null],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  const dataFlowChartData = {
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: [{
      label: '数据接收量',
      data: Array.from({length: 24}, () => Math.floor(Math.random() * 1000) + 500),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和控制按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          市场连接器仪表板
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="自动刷新"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadMarketConnections}
            disabled={loading}
          >
            刷新
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setConfigDialogOpen(true)}
          >
            添加连接
          </Button>
        </Box>
      </Box>

      {/* 加载指示器 */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 统计概览 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <CloudIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {connectionStats.total_connections || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                总连接数
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {connectionStats.active_connections || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                活跃连接
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {connectionStats.average_latency?.toFixed(1) || 0}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                平均延迟
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {connectionStats.uptime_percentage?.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                可用性
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>

      {/* 图表区域 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardHeader title="连接状态分布" />
            <CardContent>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut
                  data={connectionStatusChartData}
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
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardHeader title="市场延迟对比" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={latencyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '延迟 (ms)'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardHeader title="24小时数据流量" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line
                  data={dataFlowChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '数据量'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* 连接列表 */}
      <StyledCard>
        <CardHeader
          title="市场连接列表"
          action={
            <Tooltip title="刷新连接状态">
              <IconButton onClick={loadMarketConnections} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>市场名称</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>延迟</TableCell>
                  <TableCell>数据接收</TableCell>
                  <TableCell>订单提交</TableCell>
                  <TableCell>最后心跳</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marketConnections
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((connection) => (
                    <TableRow key={connection.connection_id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(connection.status)}
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {connection.market_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={connection.market_type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={connection.status}
                          size="small"
                          color={getStatusColor(connection.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {connection.latency ? `${connection.latency}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StorageIcon fontSize="small" color="action" />
                          {connection.data_received.toLocaleString()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon fontSize="small" color="action" />
                          {connection.orders_submitted}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {connection.last_heartbeat ? 
                            new Date(connection.last_heartbeat).toLocaleTimeString() : '-'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="查看详情">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedConnection(connection);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <AssessmentIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="编辑配置">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedConnection(connection);
                                setConfigDialogOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {connection.status === 'connected' ? (
                            <Tooltip title="断开连接">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDisconnect(connection.connection_id)}
                              >
                                <DisconnectedIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="连接">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleConnect(connection.connection_id)}
                              >
                                <ConnectedIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="测试连接">
                            <IconButton
                              size="small"
                              onClick={() => handleTestConnection(connection.connection_id)}
                            >
                              <SyncIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={marketConnections.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </StyledCard>

      {/* 连接详情对话框 */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TimelineIcon />
            连接详情: {selectedConnection?.market_name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedConnection && (
            <Box>
              {/* 基本信息 */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">基本信息</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">市场类型</Typography>
                      <Typography variant="body1">{selectedConnection.market_type}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">连接状态</Typography>
                      <Chip
                        label={selectedConnection.status}
                        color={getStatusColor(selectedConnection.status)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">API端点</Typography>
                      <Typography variant="body1">{selectedConnection.api_endpoint}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">WebSocket端点</Typography>
                      <Typography variant="body1">{selectedConnection.ws_endpoint}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 连接统计 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">连接统计</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">连接时间</Typography>
                      <Typography variant="body1">
                        {selectedConnection.connection_time ? 
                          new Date(selectedConnection.connection_time).toLocaleString() : '-'
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">数据接收量</Typography>
                      <Typography variant="body1">
                        {selectedConnection.data_received.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">订单提交数</Typography>
                      <Typography variant="body1">
                        {selectedConnection.orders_submitted}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">网络延迟</Typography>
                      <Typography variant="body1">
                        {selectedConnection.latency ? `${selectedConnection.latency}ms` : '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 错误信息 */}
              {selectedConnection.last_error && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" color="error">错误信息</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Alert severity="error">
                      {selectedConnection.last_error}
                    </Alert>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 配置对话框 */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedConnection ? '编辑市场连接' : '添加市场连接'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="市场名称"
                value={configForm.market_name}
                onChange={(e) => setConfigForm(prev => ({ ...prev, market_name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>市场类型</InputLabel>
                <Select
                  value={configForm.market_type}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, market_type: e.target.value }))}
                  label="市场类型"
                >
                  <MenuItem value="spot">现货市场</MenuItem>
                  <MenuItem value="capacity">容量市场</MenuItem>
                  <MenuItem value="ancillary">辅助服务市场</MenuItem>
                  <MenuItem value="carbon">碳交易市场</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API端点"
                value={configForm.api_endpoint}
                onChange={(e) => setConfigForm(prev => ({ ...prev, api_endpoint: e.target.value }))}
                placeholder="https://api.example.com/v1"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="WebSocket端点"
                value={configForm.ws_endpoint}
                onChange={(e) => setConfigForm(prev => ({ ...prev, ws_endpoint: e.target.value }))}
                placeholder="wss://ws.example.com/v1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="API密钥"
                type="password"
                value={configForm.auth_config.api_key}
                onChange={(e) => setConfigForm(prev => ({
                  ...prev,
                  auth_config: { ...prev.auth_config, api_key: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="密钥"
                type="password"
                value={configForm.auth_config.secret_key}
                onChange={(e) => setConfigForm(prev => ({
                  ...prev,
                  auth_config: { ...prev.auth_config, secret_key: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            disabled={!configForm.market_name || !configForm.api_endpoint || loading}
          >
            {selectedConnection ? '更新' : '添加'}
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

export default MarketConnectorDashboard;