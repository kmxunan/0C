/**
 * 设备管理组件
 * 提供设备列表、状态监控、配置管理等功能
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Alert, Grid, Card, CardContent,
  LinearProgress, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogActions, DialogContent,
  DialogTitle, TextField, Snackbar, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// 导入所有需要的图标
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import BuildIcon from '@mui/icons-material/Build';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterIcon from '@mui/icons-material/Water';

import { API_BASE_URL } from '../apiConfig';

const DeviceManagement = () => {
  // --- State Hooks ---
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    type: '',
    category: '',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    ratedPower: ''
  });

  const navigate = useNavigate();

  // --- Helper Functions ---
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // --- Data Fetching Logic ---
  // 使用 useCallback 包裹，防止因函数在每次渲染时重新创建而导致 useEffect 无限循环
  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/devices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        console.error('认证失败或令牌已过期，请重新登录。');
        localStorage.removeItem('token');
        navigate('/login');
        throw new Error('认证失败');
      }

      if (!response.ok) {
        throw new Error('获取设备列表时发生网络错误');
      }

      const result = await response.json();
      const devicesData = result.data || [];
      
      const formattedDevices = devicesData.map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        category: device.category || 'other',
        location: device.location || '未指定',
        manufacturer: device.manufacturer || '未知',
        model: device.model || '未知',
        serialNumber: device.serial_number || '未知',
        status: device.status === 'online' ? 1 : device.status === 'offline' ? 2 : 0,
        ratedPower: device.rated_power || 0,
        currentPower: 0, // 占位数据，应从实时接口获取
        efficiency: 0, // 占位数据，应计算得出
        lastUpdate: device.updated_at || device.created_at,
        maintenanceRequired: false // 占位数据，应从维护系统获取
      }));
      
      setDevices(formattedDevices);
    } catch (error) {
      console.error('加载设备列表失败:', error);
      showSnackbar('加载设备列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate]); // navigate 是稳定的，所以这个函数只会被创建一次

  // --- Effect Hook ---
  // 在组件挂载时加载设备数据
  useEffect(() => {
    loadDevices();
  }, [loadDevices]); // 依赖于 useCallback 包裹后的 loadDevices

  const getStatusChip = (status, maintenanceRequired = false) => {
    if (maintenanceRequired) {
      return <Chip icon={<WarningIcon />} label="需要维护" color="warning" size="small" />;
    }
    
    switch (status) {
      case 1:
        return <Chip icon={<CheckCircleIcon />} label="在线" color="success" size="small" />;
      case 2:
        return <Chip icon={<ErrorIcon />} label="离线" color="error" size="small" />;
      case 3:
        return <Chip icon={<WarningIcon />} label="告警" color="warning" size="small" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
  };

  const getDeviceIcon = (category) => {
    switch (category) {
      case 'renewable':
        return <ElectricBoltIcon color="primary" />;
      case 'storage':
        return <PowerSettingsNewIcon color="secondary" />;
      case 'hvac':
        return <ThermostatIcon color="info" />;
      case 'water':
        return <WaterIcon color="primary" />;
      default:
        return <BuildIcon color="action" />;
    }
  };

  // --- Event Handlers ---
  const handleAddDevice = () => {
    setSelectedDevice(null);
    setDeviceForm({
      name: '', type: '', category: '', location: '', manufacturer: '',
      model: '', serialNumber: '', ratedPower: ''
    });
    setOpenDialog(true);
  };

  const handleEditDevice = (device) => {
    setSelectedDevice(device);
    setDeviceForm({
      name: device.name,
      type: device.type.toString(),
      category: device.category,
      location: device.location,
      manufacturer: device.manufacturer,
      model: device.model,
      serialNumber: device.serialNumber,
      ratedPower: device.ratedPower.toString()
    });
    setOpenDialog(true);
  };

  const handleSaveDevice = async () => {
    try {
      setLoading(true);
      
      const deviceData = {
        name: deviceForm.name,
        type: deviceForm.type,
        category: deviceForm.category,
        location: deviceForm.location,
        manufacturer: deviceForm.manufacturer,
        model: deviceForm.model,
        serial_number: deviceForm.serialNumber,
        rated_power: parseFloat(deviceForm.ratedPower) || 0,
        building_id: 'default-building', // 默认建筑ID
        status: 'offline' // 新设备默认离线状态
      };
      
          const token = localStorage.getItem('token');
        if (!token) {
          showSnackbar('未找到身份验证令牌，请重新登录', 'error');
          setLoading(false);
          return;
        }
        let response;
      if (selectedDevice) {
        // 更新设备
        response = await fetch(`${API_BASE_URL}/devices/${selectedDevice.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(deviceData)
        });
      } else {
        // 添加设备
        response = await fetch(`${API_BASE_URL}/devices`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(deviceData)
        });
      }
      
      if (!response.ok) {
        throw new Error(selectedDevice ? '更新设备失败' : '添加设备失败');
      }
      
      showSnackbar(selectedDevice ? '设备更新成功' : '设备添加成功', 'success');
      setOpenDialog(false);
      loadDevices();
    } catch (error) {
      console.error('保存设备失败:', error);
      showSnackbar('保存设备失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('确定要删除这个设备吗？')) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          showSnackbar('未找到身份验证令牌，请重新登录', 'error');
          setLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('删除设备失败');
        }
        
        showSnackbar('设备删除成功', 'success');
        loadDevices();
      } catch (error) {
        console.error('删除设备失败:', error);
        showSnackbar('删除设备失败', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatPower = (power) => {
    if (Math.abs(power) >= 1000) {
      return `${(power / 1000).toFixed(1)}kW`;
    }
    return `${power.toFixed(1)}W`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          设备管理
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDevices}
            sx={{ mr: 2 }}
          >
            刷新
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddDevice}
          >
            添加设备
          </Button>
        </Box>
      </Box>

      {/* 设备统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                总设备数
              </Typography>
              <Typography variant="h4">
                {devices.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                在线设备
              </Typography>
              <Typography variant="h4" color="success.main">
                {devices.filter(d => d.status === 1).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                离线设备
              </Typography>
              <Typography variant="h4" color="error.main">
                {devices.filter(d => d.status === 2).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                需要维护
              </Typography>
              <Typography variant="h4" color="warning.main">
                {devices.filter(d => d.maintenanceRequired).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 设备列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            设备列表
          </Typography>
          {loading ? (
            <LinearProgress />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>设备</TableCell>
                    <TableCell>类型</TableCell>
                    <TableCell>位置</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>当前功率</TableCell>
                    <TableCell>效率</TableCell>
                    <TableCell>最后更新</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getDeviceIcon(device.category)}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle2">
                              {device.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {device.manufacturer} {device.model}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{device.category}</TableCell>
                      <TableCell>{device.location}</TableCell>
                      <TableCell>
                        {getStatusChip(device.status, device.maintenanceRequired)}
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={device.currentPower > 0 ? 'success.main' : device.currentPower < 0 ? 'info.main' : 'textSecondary'}
                        >
                          {formatPower(device.currentPower)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {device.efficiency ? `${device.efficiency}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {device.lastUpdate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="查看详情">
                          <IconButton size="small">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="编辑">
                          <IconButton size="small" onClick={() => handleEditDevice(device)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="设置">
                          <IconButton size="small">
                            <SettingsIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton size="small" onClick={() => handleDeleteDevice(device.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 设备编辑对话框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDevice ? '编辑设备' : '添加设备'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="设备名称"
                value={deviceForm.name}
                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>设备类型</InputLabel>
                <Select
                  value={deviceForm.type}
                  onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}
                >
                  <MenuItem value="1">太阳能发电</MenuItem>
                  <MenuItem value="2">风力发电</MenuItem>
                  <MenuItem value="3">储能设备</MenuItem>
                  <MenuItem value="4">空调系统</MenuItem>
                  <MenuItem value="5">照明系统</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>设备分类</InputLabel>
                <Select
                  value={deviceForm.category}
                  onChange={(e) => setDeviceForm({ ...deviceForm, category: e.target.value })}
                >
                  <MenuItem value="renewable">可再生能源</MenuItem>
                  <MenuItem value="storage">储能设备</MenuItem>
                  <MenuItem value="hvac">暖通空调</MenuItem>
                  <MenuItem value="lighting">照明系统</MenuItem>
                  <MenuItem value="water">水务系统</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="安装位置"
                value={deviceForm.location}
                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="制造商"
                value={deviceForm.manufacturer}
                onChange={(e) => setDeviceForm({ ...deviceForm, manufacturer: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="型号"
                value={deviceForm.model}
                onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="序列号"
                value={deviceForm.serialNumber}
                onChange={(e) => setDeviceForm({ ...deviceForm, serialNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="额定功率 (W)"
                type="number"
                value={deviceForm.ratedPower}
                onChange={(e) => setDeviceForm({ ...deviceForm, ratedPower: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button onClick={handleSaveDevice} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default DeviceManagement;