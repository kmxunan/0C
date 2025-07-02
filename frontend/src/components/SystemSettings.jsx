/**
 * 系统设置组件
 * 提供系统配置、用户管理、权限设置等功能
 */

import React, { useState, useEffect } from 'react';
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
  Switch,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Divider,
  Alert,
  Slider,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup
} from '@mui/material';
import {
  Settings,
  Person,
  Security,
  Notifications,
  Storage,
  Network,
  Backup,
  Update,
  Language,
  Palette,
  Schedule,
  Email,
  Sms,
  VolumeUp,
  Save,
  Refresh,
  Add,
  Edit,
  Delete,
  ExpandMore,
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Group,
  Key,
  Shield,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';

const SystemSettings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [notifications, setNotifications] = useState({});
  const [systemInfo, setSystemInfo] = useState({});
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: '',
    department: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSystemSettings(),
        loadUsers(),
        loadRoles(),
        loadNotificationSettings(),
        loadSystemInfo()
      ]);
    } catch (error) {
      console.error('加载设置数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemSettings = async () => {
    // 模拟系统设置数据
    const systemSettings = {
      general: {
        systemName: '智慧园区能源管理系统',
        timezone: 'Asia/Shanghai',
        language: 'zh-CN',
        theme: 'light',
        dateFormat: 'YYYY-MM-DD',
        currency: 'CNY'
      },
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expirationDays: 90
        },
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        twoFactorAuth: false,
        ipWhitelist: []
      },
      data: {
        retentionPeriod: 365,
        backupFrequency: 'daily',
        backupRetention: 30,
        autoCleanup: true,
        compressionEnabled: true
      },
      performance: {
        cacheEnabled: true,
        cacheSize: 512,
        maxConcurrentUsers: 100,
        queryTimeout: 30,
        logLevel: 'info'
      }
    };
    setSettings(systemSettings);
  };

  const loadUsers = async () => {
    // 模拟用户数据
    const usersData = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@company.com',
        role: 'administrator',
        department: 'IT部门',
        status: 'active',
        lastLogin: '2024-01-15 14:30',
        createdAt: '2023-01-01',
        avatar: null
      },
      {
        id: 2,
        username: 'energy_manager',
        email: 'energy@company.com',
        role: 'energy_manager',
        department: '能源管理部',
        status: 'active',
        lastLogin: '2024-01-15 10:15',
        createdAt: '2023-02-15',
        avatar: null
      },
      {
        id: 3,
        username: 'operator',
        email: 'operator@company.com',
        role: 'operator',
        department: '运维部门',
        status: 'active',
        lastLogin: '2024-01-14 16:45',
        createdAt: '2023-03-10',
        avatar: null
      },
      {
        id: 4,
        username: 'analyst',
        email: 'analyst@company.com',
        role: 'analyst',
        department: '数据分析部',
        status: 'inactive',
        lastLogin: '2024-01-10 09:20',
        createdAt: '2023-04-20',
        avatar: null
      }
    ];
    setUsers(usersData);
  };

  const loadRoles = async () => {
    // 模拟角色数据
    const rolesData = [
      {
        id: 1,
        name: 'administrator',
        displayName: '系统管理员',
        description: '拥有系统所有权限',
        permissions: [
          'system.manage',
          'user.manage',
          'data.read',
          'data.write',
          'report.generate',
          'settings.modify'
        ],
        userCount: 1
      },
      {
        id: 2,
        name: 'energy_manager',
        displayName: '能源管理员',
        description: '管理能源数据和设备',
        permissions: [
          'energy.manage',
          'device.manage',
          'data.read',
          'data.write',
          'report.generate'
        ],
        userCount: 1
      },
      {
        id: 3,
        name: 'operator',
        displayName: '操作员',
        description: '日常操作和监控',
        permissions: [
          'device.operate',
          'data.read',
          'alert.handle'
        ],
        userCount: 1
      },
      {
        id: 4,
        name: 'analyst',
        displayName: '数据分析师',
        description: '数据分析和报告生成',
        permissions: [
          'data.read',
          'report.generate',
          'analytics.access'
        ],
        userCount: 1
      }
    ];
    setRoles(rolesData);
  };

  const loadNotificationSettings = async () => {
    // 模拟通知设置数据
    const notificationSettings = {
      email: {
        enabled: true,
        server: 'smtp.company.com',
        port: 587,
        username: 'system@company.com',
        ssl: true,
        templates: {
          alert: true,
          report: true,
          maintenance: true
        }
      },
      sms: {
        enabled: false,
        provider: 'aliyun',
        apiKey: '',
        templates: {
          critical: true,
          emergency: true
        }
      },
      push: {
        enabled: true,
        sound: true,
        vibration: true,
        badge: true
      },
      rules: [
        {
          id: 1,
          name: '设备故障告警',
          condition: 'device.fault',
          channels: ['email', 'push'],
          recipients: ['admin@company.com', 'operator@company.com'],
          priority: 'high'
        },
        {
          id: 2,
          name: '能耗异常告警',
          condition: 'energy.anomaly',
          channels: ['email'],
          recipients: ['energy@company.com'],
          priority: 'medium'
        }
      ]
    };
    setNotifications(notificationSettings);
  };

  const loadSystemInfo = async () => {
    // 模拟系统信息数据
    const systemInfoData = {
      version: '1.0.0',
      buildDate: '2024-01-01',
      uptime: '15天 8小时 32分钟',
      database: {
        type: 'PostgreSQL',
        version: '14.5',
        size: '2.5GB',
        connections: 25
      },
      server: {
        os: 'Ubuntu 22.04 LTS',
        cpu: 'Intel Xeon E5-2686 v4',
        memory: '16GB',
        disk: '500GB SSD',
        load: '15%'
      },
      services: [
        { name: 'API服务', status: 'running', port: 3000 },
        { name: 'MQTT服务', status: 'running', port: 1883 },
        { name: '数据库', status: 'running', port: 5432 },
        { name: '缓存服务', status: 'running', port: 6379 }
      ]
    };
    setSystemInfo(systemInfoData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'running':
        return 'success';
      case 'inactive':
      case 'stopped':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '非活跃';
      case 'running':
        return '运行中';
      case 'stopped':
        return '已停止';
      case 'pending':
        return '待处理';
      default:
        return status;
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleCreateUser = () => {
    // 创建用户逻辑
    console.log('创建用户:', newUser);
    setUserDialogOpen(false);
    setNewUser({
      username: '',
      email: '',
      role: '',
      department: '',
      password: ''
    });
  };

  const renderGeneralSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              基本设置
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="系统名称"
                  value={settings.general?.systemName || ''}
                  onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>时区</InputLabel>
                  <Select
                    value={settings.general?.timezone || ''}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  >
                    <MenuItem value="Asia/Shanghai">Asia/Shanghai</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="America/New_York">America/New_York</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>语言</InputLabel>
                  <Select
                    value={settings.general?.language || ''}
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                  >
                    <MenuItem value="zh-CN">中文</MenuItem>
                    <MenuItem value="en-US">English</MenuItem>
                    <MenuItem value="ja-JP">日本語</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>主题</InputLabel>
                  <Select
                    value={settings.general?.theme || ''}
                    onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
                  >
                    <MenuItem value="light">浅色主题</MenuItem>
                    <MenuItem value="dark">深色主题</MenuItem>
                    <MenuItem value="auto">自动</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>货币</InputLabel>
                  <Select
                    value={settings.general?.currency || ''}
                    onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                  >
                    <MenuItem value="CNY">人民币 (CNY)</MenuItem>
                    <MenuItem value="USD">美元 (USD)</MenuItem>
                    <MenuItem value="EUR">欧元 (EUR)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              性能设置
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="启用缓存"
                  secondary="提高系统响应速度"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.performance?.cacheEnabled || false}
                    onChange={(e) => handleSettingChange('performance', 'cacheEnabled', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="自动清理"
                  secondary="自动清理过期数据"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.data?.autoCleanup || false}
                    onChange={(e) => handleSettingChange('data', 'autoCleanup', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="数据压缩"
                  secondary="压缩存储数据以节省空间"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.data?.compressionEnabled || false}
                    onChange={(e) => handleSettingChange('data', 'compressionEnabled', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                缓存大小: {settings.performance?.cacheSize || 512}MB
              </Typography>
              <Slider
                value={settings.performance?.cacheSize || 512}
                onChange={(e, value) => handleSettingChange('performance', 'cacheSize', value)}
                min={128}
                max={2048}
                step={128}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                数据保留期: {settings.data?.retentionPeriod || 365}天
              </Typography>
              <Slider
                value={settings.data?.retentionPeriod || 365}
                onChange={(e, value) => handleSettingChange('data', 'retentionPeriod', value)}
                min={30}
                max={1095}
                step={30}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderUserManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            用户管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setUserDialogOpen(true)}
          >
            添加用户
          </Button>
        </Box>
        
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>用户</TableCell>
                    <TableCell>角色</TableCell>
                    <TableCell>部门</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>最后登录</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2 }}>
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {user.username}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={roles.find(r => r.name === user.role)?.displayName || user.role}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(user.status)}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" startIcon={<Edit />}>
                            编辑
                          </Button>
                          <Button size="small" startIcon={<Key />}>
                            重置密码
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          角色权限
        </Typography>
        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} key={role.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        {role.displayName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {role.description}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${role.userCount} 用户`}
                      size="small"
                      color="info"
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    权限列表:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {role.permissions.map((permission) => (
                      <Chip 
                        key={permission}
                        label={permission}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<Edit />}>
                      编辑权限
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );

  const renderSecuritySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              密码策略
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="最小长度"
                  type="number"
                  value={settings.security?.passwordPolicy?.minLength || 8}
                  onChange={(e) => {
                    const newPolicy = { ...settings.security.passwordPolicy, minLength: parseInt(e.target.value) };
                    handleSettingChange('security', 'passwordPolicy', newPolicy);
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings.security?.passwordPolicy?.requireUppercase || false}
                        onChange={(e) => {
                          const newPolicy = { ...settings.security.passwordPolicy, requireUppercase: e.target.checked };
                          handleSettingChange('security', 'passwordPolicy', newPolicy);
                        }}
                      />
                    }
                    label="要求大写字母"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings.security?.passwordPolicy?.requireLowercase || false}
                        onChange={(e) => {
                          const newPolicy = { ...settings.security.passwordPolicy, requireLowercase: e.target.checked };
                          handleSettingChange('security', 'passwordPolicy', newPolicy);
                        }}
                      />
                    }
                    label="要求小写字母"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings.security?.passwordPolicy?.requireNumbers || false}
                        onChange={(e) => {
                          const newPolicy = { ...settings.security.passwordPolicy, requireNumbers: e.target.checked };
                          handleSettingChange('security', 'passwordPolicy', newPolicy);
                        }}
                      />
                    }
                    label="要求数字"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings.security?.passwordPolicy?.requireSpecialChars || false}
                        onChange={(e) => {
                          const newPolicy = { ...settings.security.passwordPolicy, requireSpecialChars: e.target.checked };
                          handleSettingChange('security', 'passwordPolicy', newPolicy);
                        }}
                      />
                    }
                    label="要求特殊字符"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              安全设置
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="双因子认证"
                  secondary="启用双因子认证增强安全性"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.security?.twoFactorAuth || false}
                    onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                会话超时: {settings.security?.sessionTimeout || 30}分钟
              </Typography>
              <Slider
                value={settings.security?.sessionTimeout || 30}
                onChange={(e, value) => handleSettingChange('security', 'sessionTimeout', value)}
                min={5}
                max={120}
                step={5}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                最大登录尝试次数: {settings.security?.maxLoginAttempts || 5}
              </Typography>
              <Slider
                value={settings.security?.maxLoginAttempts || 5}
                onChange={(e, value) => handleSettingChange('security', 'maxLoginAttempts', value)}
                min={3}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSystemInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              系统信息
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="版本"
                  secondary={systemInfo.version}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="构建日期"
                  secondary={systemInfo.buildDate}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="运行时间"
                  secondary={systemInfo.uptime}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              服务状态
            </Typography>
            <List>
              {systemInfo.services?.map((service, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {service.status === 'running' ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={service.name}
                    secondary={`端口: ${service.port}`}
                  />
                  <Chip 
                    label={getStatusText(service.status)}
                    color={getStatusColor(service.status)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              系统资源
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {systemInfo.server?.load}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    CPU负载
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {systemInfo.server?.memory}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    内存
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {systemInfo.database?.size}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    数据库大小
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {systemInfo.database?.connections}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    数据库连接
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          系统设置
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadSettingsData}
          >
            刷新
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
          >
            保存设置
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<Settings />} label="常规设置" />
          <Tab icon={<Group />} label="用户管理" />
          <Tab icon={<Security />} label="安全设置" />
          <Tab icon={<Info />} label="系统信息" />
        </Tabs>
      </Paper>

      {tabValue === 0 && renderGeneralSettings()}
      {tabValue === 1 && renderUserManagement()}
      {tabValue === 2 && renderSecuritySettings()}
      {tabValue === 3 && renderSystemInfo()}

      {/* 添加用户对话框 */}
      <Dialog 
        open={userDialogOpen} 
        onClose={() => setUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>添加新用户</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="用户名"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="邮箱"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>角色</InputLabel>
                <Select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="部门"
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="密码"
                type={showPassword ? 'text' : 'password'}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ minWidth: 'auto', p: 1 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={handleCreateUser}
            variant="contained"
            disabled={!newUser.username || !newUser.email || !newUser.role || !newUser.password}
          >
            创建用户
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;