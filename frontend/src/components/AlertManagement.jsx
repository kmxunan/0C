/**
 * 告警管理组件
 * 提供实时告警监控、告警规则配置、告警历史查询等功能
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notification } from 'antd';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Add,
  Edit,
  Delete,
  Refresh,
  FilterList,
  NotificationsActive,
  NotificationsOff,
  Settings,
  History,
  TrendingUp,
  Schedule
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AlertManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [alertStats, setAlertStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openRuleDialog, setOpenRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    deviceType: '',
    parameter: '',
    condition: 'greater_than',
    threshold: '',
    level: 'warning',
    enabled: true
  });

  useEffect(() => {
    loadAlertData();
    const interval = setInterval(loadAlertData, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  // 告警历史数据与状态
  const [alertHistory, setAlertHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ deviceId: '', startDate: '', endDate: '', severity: '' });

  // 获取告警历史数据
  const fetchAlertHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.deviceId && { deviceId: filters.deviceId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.severity && { severity: filters.severity })
      });



      const token = localStorage.getItem('token');
      const requestHeaders = token ? { Authorization: `Bearer ${token}` } : {};
console.log('Request headers:', requestHeaders);
console.log('Headers size:', JSON.stringify(requestHeaders).length);
try {
  const response = await axios.get(`/api/alerts/history?${params}`, { headers: requestHeaders });
  setAlertHistory(response.data.data);
  setPagination(response.data.pagination);
} catch (error) {
  console.error('Fetch alert history error:', error);
  console.error('Response status:', error.response?.status);
  console.error('Response headers:', error.response?.headers);
}
    } catch (error) {
      console.error('获取告警历史失败:', error);
      notification.error({ message: '获取告警历史失败', description: error.response?.data?.error?.message || '服务器错误' });
    } finally {
      setLoadingHistory(false);
    }
  };

  // 导出告警历史为CSV
  const exportAlertHistory = async () => {
    try {
      const params = new URLSearchParams({
        export: 'csv',
        ...(filters.deviceId && { deviceId: filters.deviceId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.severity && { severity: filters.severity })
      });

      const response = await axios.get(`/api/alerts/history?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `alerts_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出告警历史失败:', error);
      notification.error({ message: '导出告警历史失败', description: error.response?.data?.error?.message || '服务器错误' });
    }
  };

  // 处理筛选条件变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一页
  };

  // 处理分页变化
  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, page, limit: pageSize }));
  };

  // 初始加载和筛选条件变化时获取数据
  useEffect(() => {
    fetchAlertHistory();
  }, [pagination.page, pagination.limit, filters]);

  const loadAlertData = async () => {
    try {
      setIsLoading(true);
      
      // 模拟API调用
      const mockAlerts = [
        {
          id: '1',
          level: 'critical',
          title: '设备离线告警',
          message: '太阳能板A已离线超过5分钟',
          deviceId: 'solar_001',
          deviceName: '太阳能板A',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          status: 'active',
          acknowledged: false
        },
        {
          id: '2',
          level: 'warning',
          title: '能耗异常',
          message: '生产线B能耗超出正常范围15%',
          deviceId: 'prod_002',
          deviceName: '生产线B',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          status: 'active',
          acknowledged: true
        },
        {
          id: '3',
          level: 'info',
          title: '维护提醒',
          message: '储能系统C计划维护时间临近',
          deviceId: 'battery_003',
          deviceName: '储能系统C',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'resolved',
          acknowledged: true
        },
        {
          id: '4',
          level: 'warning',
          title: '温度告警',
          message: '变压器D温度达到65°C',
          deviceId: 'trans_004',
          deviceName: '变压器D',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          status: 'active',
          acknowledged: false
        }
      ];

      const mockRules = [
        {
          id: '1',
          name: '设备离线检测',
          description: '检测设备是否离线超过5分钟',
          deviceType: 'all',
          parameter: 'connection_status',
          condition: 'equals',
          threshold: 'offline',
          level: 'critical',
          enabled: true,
          triggerCount: 15
        },
        {
          id: '2',
          name: '能耗异常检测',
          description: '检测设备能耗是否超出正常范围',
          deviceType: 'production',
          parameter: 'power_consumption',
          condition: 'greater_than',
          threshold: '500',
          level: 'warning',
          enabled: true,
          triggerCount: 8
        },
        {
          id: '3',
          name: '温度监控',
          description: '监控设备温度是否超过安全阈值',
          deviceType: 'transformer',
          parameter: 'temperature',
          condition: 'greater_than',
          threshold: '60',
          level: 'warning',
          enabled: true,
          triggerCount: 3
        }
      ];

      const mockStats = {
        total: mockAlerts.length,
        active: mockAlerts.filter(a => a.status === 'active').length,
        critical: mockAlerts.filter(a => a.level === 'critical').length,
        warning: mockAlerts.filter(a => a.level === 'warning').length,
        info: mockAlerts.filter(a => a.level === 'info').length,
        acknowledged: mockAlerts.filter(a => a.acknowledged).length,
        hourlyTrend: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.floor(Math.random() * 10)
        })),
        levelDistribution: [
          { name: '严重', value: 2, color: '#f44336' },
          { name: '警告', value: 5, color: '#ff9800' },
          { name: '信息', value: 3, color: '#2196f3' }
        ]
      };

      setAlerts(mockAlerts);
      setAlertRules(mockRules);
      setAlertStats(mockStats);
      setIsLoading(false);
    } catch (error) {
      console.error('加载告警数据失败:', error);
      setIsLoading(false);
    }
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <CheckCircle color="success" />;
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

  const handleAcknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleResolveAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setNewRule({
      name: '',
      description: '',
      deviceType: '',
      parameter: '',
      condition: 'greater_than',
      threshold: '',
      level: 'warning',
      enabled: true
    });
    setOpenRuleDialog(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setNewRule({ ...rule });
    setOpenRuleDialog(true);
  };

  const handleSaveRule = () => {
    if (editingRule) {
      setAlertRules(prev => prev.map(rule => 
        rule.id === editingRule.id ? { ...newRule, id: editingRule.id } : rule
      ));
    } else {
      const newId = Date.now().toString();
      setAlertRules(prev => [...prev, { ...newRule, id: newId, triggerCount: 0 }]);
    }
    setOpenRuleDialog(false);
  };

  const handleDeleteRule = (ruleId) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterLevel !== 'all' && alert.level !== filterLevel) return false;
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    return true;
  });

  const renderAlertsList = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">实时告警</Typography>
          <Box display="flex" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>级别</InputLabel>
              <Select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                label="级别"
              >
                <MenuItem value="all">全部</MenuItem>
                <MenuItem value="critical">严重</MenuItem>
                <MenuItem value="warning">警告</MenuItem>
                <MenuItem value="info">信息</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>状态</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="状态"
              >
                <MenuItem value="all">全部</MenuItem>
                <MenuItem value="active">活跃</MenuItem>
                <MenuItem value="resolved">已解决</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={loadAlertData}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>级别</TableCell>
                <TableCell>标题</TableCell>
                <TableCell>设备</TableCell>
                <TableCell>时间</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getAlertIcon(alert.level)}
                      <Chip 
                        label={alert.level} 
                        color={getAlertColor(alert.level)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.message}
                    </Typography>
                  </TableCell>
                  <TableCell>{alert.deviceName}</TableCell>
                  <TableCell>
                    {alert.timestamp.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Chip 
                        label={alert.status} 
                        color={alert.status === 'active' ? 'error' : 'success'}
                        size="small"
                      />
                      {alert.acknowledged && (
                        <Chip label="已确认" color="info" size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {!alert.acknowledged && (
                        <Button 
                          size="small" 
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          确认
                        </Button>
                      )}
                      {alert.status === 'active' && (
                        <Button 
                          size="small" 
                          color="success"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          解决
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderAlertRules = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">告警规则</Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={handleCreateRule}
          >
            新建规则
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>规则名称</TableCell>
                <TableCell>设备类型</TableCell>
                <TableCell>参数</TableCell>
                <TableCell>条件</TableCell>
                <TableCell>级别</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>触发次数</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alertRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {rule.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rule.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{rule.deviceType}</TableCell>
                  <TableCell>{rule.parameter}</TableCell>
                  <TableCell>
                    {rule.condition} {rule.threshold}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={rule.level} 
                      color={getAlertColor(rule.level)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge badgeContent={rule.triggerCount} color="primary">
                      <TrendingUp />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderStatistics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>告警趋势</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={alertStats.hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="告警数量"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>告警分布</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alertStats.levelDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {alertStats.levelDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        告警管理
      </Typography>
      
      {/* 统计卡片 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    总告警数
                  </Typography>
                  <Typography variant="h4">
                    {alertStats.total || 0}
                  </Typography>
                </Box>
                <NotificationsActive color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    活跃告警
                  </Typography>
                  <Typography variant="h4" color="error">
                    {alertStats.active || 0}
                  </Typography>
                </Box>
                <Error color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    严重告警
                  </Typography>
                  <Typography variant="h4" color="error">
                    {alertStats.critical || 0}
                  </Typography>
                </Box>
                <Warning color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    已确认
                  </Typography>
                  <Typography variant="h4" color="success">
                    {alertStats.acknowledged || 0}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 主要内容区域 */}
      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="实时告警" icon={<NotificationsActive />} />
          <Tab label="告警规则" icon={<Settings />} />
          <Tab label="统计分析" icon={<TrendingUp />} />
        </Tabs>
        
        <Box p={3}>
          {activeTab === 0 && renderAlertsList()}
          {activeTab === 1 && renderAlertRules()}
          {activeTab === 2 && renderStatistics()}
        </Box>
      </Paper>

      {/* 规则编辑对话框 */}
      <Dialog 
        open={openRuleDialog} 
        onClose={() => setOpenRuleDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRule ? '编辑告警规则' : '新建告警规则'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="规则名称"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>设备类型</InputLabel>
                <Select
                  value={newRule.deviceType}
                  onChange={(e) => setNewRule({ ...newRule, deviceType: e.target.value })}
                  label="设备类型"
                >
                  <MenuItem value="all">全部设备</MenuItem>
                  <MenuItem value="solar">太阳能板</MenuItem>
                  <MenuItem value="wind">风力发电机</MenuItem>
                  <MenuItem value="battery">储能系统</MenuItem>
                  <MenuItem value="production">生产线</MenuItem>
                  <MenuItem value="transformer">变压器</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={2}
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="监控参数"
                value={newRule.parameter}
                onChange={(e) => setNewRule({ ...newRule, parameter: e.target.value })}
                placeholder="如: temperature, power_consumption"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>条件</InputLabel>
                <Select
                  value={newRule.condition}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                  label="条件"
                >
                  <MenuItem value="greater_than">大于</MenuItem>
                  <MenuItem value="less_than">小于</MenuItem>
                  <MenuItem value="equals">等于</MenuItem>
                  <MenuItem value="not_equals">不等于</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="阈值"
                value={newRule.threshold}
                onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>告警级别</InputLabel>
                <Select
                  value={newRule.level}
                  onChange={(e) => setNewRule({ ...newRule, level: e.target.value })}
                  label="告警级别"
                >
                  <MenuItem value="info">信息</MenuItem>
                  <MenuItem value="warning">警告</MenuItem>
                  <MenuItem value="critical">严重</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newRule.enabled}
                    onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                  />
                }
                label="启用规则"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRuleDialog(false)}>取消</Button>
          <Button onClick={handleSaveRule} variant="contained">
            {editingRule ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertManagement;