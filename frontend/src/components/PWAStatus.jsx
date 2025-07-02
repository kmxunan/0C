import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  PhoneAndroid,
  Notifications,
  CloudDownload,
  Refresh,
  Info,
  CheckCircle,
  Error
} from '@mui/icons-material';
import {
  getAppInfo,
  installPWA,
  requestNotificationPermission,
  sendLocalNotification,
  subscribeToPushNotifications,
  checkForUpdates
} from '../utils/pwa';

const PWAStatus = () => {
  const [appInfo, setAppInfo] = useState({
    isOnline: true,
    isPWA: false,
    hasServiceWorker: false,
    hasNotifications: false,
    hasPushManager: false,
    notificationPermission: 'default'
  });
  const [notifications, setNotifications] = useState(false);
  const [pushSubscription, setPushSubscription] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    updateAppInfo();
    
    // 监听网络状态变化
    const handleNetworkChange = (event) => {
      updateAppInfo();
      const message = event.detail.isOnline ? '网络连接已恢复' : '网络连接已断开';
      showSnackbar(message, event.detail.isOnline ? 'success' : 'warning');
    };

    window.addEventListener('networkStatusChange', handleNetworkChange);
    
    return () => {
      window.removeEventListener('networkStatusChange', handleNetworkChange);
    };
  }, []);

  const updateAppInfo = () => {
    const info = getAppInfo();
    setAppInfo(info);
    setNotifications(info.notificationPermission === 'granted');
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleInstallPWA = async () => {
    try {
      await installPWA();
      showSnackbar('应用安装成功！', 'success');
      updateAppInfo();
    } catch (error) {
      showSnackbar('应用安装失败', 'error');
    }
  };

  const handleNotificationToggle = async (event) => {
    const enabled = event.target.checked;
    
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifications(true);
        showSnackbar('通知权限已开启', 'success');
        
        // 发送测试通知
        sendLocalNotification('智慧园区能源管理系统', {
          body: '通知功能已启用，您将收到重要的系统提醒',
          icon: '/logo192.png'
        });
      } else {
        showSnackbar('通知权限被拒绝', 'error');
      }
    } else {
      setNotifications(false);
      showSnackbar('通知功能已关闭', 'info');
    }
    
    updateAppInfo();
  };

  const handleSubscribePush = async () => {
    try {
      const subscription = await subscribeToPushNotifications();
      setPushSubscription(subscription);
      showSnackbar('推送通知订阅成功', 'success');
    } catch (error) {
      showSnackbar('推送通知订阅失败', 'error');
    }
  };

  const handleCheckUpdates = async () => {
    setIsUpdating(true);
    try {
      await checkForUpdates();
      showSnackbar('已检查更新', 'info');
    } catch (error) {
      showSnackbar('检查更新失败', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestNotification = () => {
    if (appInfo.notificationPermission === 'granted') {
      sendLocalNotification('测试通知', {
        body: `当前时间：${new Date().toLocaleString()}`,
        icon: '/logo192.png',
        tag: 'test-notification'
      });
      showSnackbar('测试通知已发送', 'success');
    } else {
      showSnackbar('请先开启通知权限', 'warning');
    }
  };

  const getStatusColor = (status) => {
    return status ? 'success' : 'default';
  };

  const getStatusIcon = (status) => {
    return status ? <CheckCircle /> : <Error />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        PWA状态管理
      </Typography>
      
      <Grid container spacing={3}>
        {/* 应用状态卡片 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                应用状态
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {appInfo.isOnline ? <Wifi color="success" /> : <WifiOff color="error" />}
                  <Typography sx={{ ml: 1 }}>
                    网络状态: 
                    <Chip 
                      label={appInfo.isOnline ? '在线' : '离线'} 
                      color={getStatusColor(appInfo.isOnline)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneAndroid color={appInfo.isPWA ? 'success' : 'disabled'} />
                  <Typography sx={{ ml: 1 }}>
                    PWA模式: 
                    <Chip 
                      label={appInfo.isPWA ? '已安装' : '未安装'} 
                      color={getStatusColor(appInfo.isPWA)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Notifications color={notifications ? 'success' : 'disabled'} />
                  <Typography sx={{ ml: 1 }}>
                    通知权限: 
                    <Chip 
                      label={appInfo.notificationPermission === 'granted' ? '已授权' : 
                             appInfo.notificationPermission === 'denied' ? '已拒绝' : '未设置'} 
                      color={getStatusColor(appInfo.notificationPermission === 'granted')}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {!appInfo.isPWA && (
                  <Button 
                    variant="contained" 
                    startIcon={<CloudDownload />}
                    onClick={handleInstallPWA}
                    size="small"
                  >
                    安装应用
                  </Button>
                )}
                
                <Tooltip title="检查应用更新">
                  <IconButton 
                    onClick={handleCheckUpdates}
                    disabled={isUpdating}
                    color="primary"
                  >
                    <Refresh className={isUpdating ? 'rotating' : ''} />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 功能控制卡片 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                功能控制
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications}
                      onChange={handleNotificationToggle}
                      disabled={!appInfo.hasNotifications}
                    />
                  }
                  label="推送通知"
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  variant="outlined" 
                  onClick={handleTestNotification}
                  disabled={!notifications}
                  size="small"
                >
                  测试通知
                </Button>
                
                {appInfo.hasPushManager && (
                  <Button 
                    variant="outlined" 
                    onClick={handleSubscribePush}
                    disabled={!notifications || pushSubscription}
                    size="small"
                  >
                    {pushSubscription ? '已订阅推送' : '订阅推送'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 技术信息卡片 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                技术信息
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    {getStatusIcon(appInfo.hasServiceWorker)}
                    <Typography variant="body2">
                      Service Worker
                    </Typography>
                    <Chip 
                      label={appInfo.hasServiceWorker ? '支持' : '不支持'}
                      color={getStatusColor(appInfo.hasServiceWorker)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    {getStatusIcon(appInfo.hasNotifications)}
                    <Typography variant="body2">
                      通知API
                    </Typography>
                    <Chip 
                      label={appInfo.hasNotifications ? '支持' : '不支持'}
                      color={getStatusColor(appInfo.hasNotifications)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    {getStatusIcon(appInfo.hasPushManager)}
                    <Typography variant="body2">
                      推送管理
                    </Typography>
                    <Chip 
                      label={appInfo.hasPushManager ? '支持' : '不支持'}
                      color={getStatusColor(appInfo.hasPushManager)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    {getStatusIcon(appInfo.isPWA)}
                    <Typography variant="body2">
                      PWA模式
                    </Typography>
                    <Chip 
                      label={appInfo.isPWA ? '激活' : '未激活'}
                      color={getStatusColor(appInfo.isPWA)}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 离线提示 */}
        {!appInfo.isOnline && (
          <Grid item xs={12}>
            <Alert severity="warning" icon={<WifiOff />}>
              当前处于离线模式。某些功能可能受限，数据将在网络恢复后同步。
            </Alert>
          </Grid>
        )}
      </Grid>
      
      {/* 通知栏 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <style jsx>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Box>
  );
};

export default PWAStatus;