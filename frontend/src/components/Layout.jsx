/**
 * 主布局组件
 * 提供导航栏、侧边栏和主内容区域
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  DevicesOther,
  Category as CategoryIcon,
  Analytics,
  Assessment,
  Notifications,
  Settings,
  AccountCircle,
  Logout,
  Help,
  ElectricBolt,
  Co2,
  PhoneAndroid,
  ThreeDRotation,
  TrendingUp as TradingIcon,
  Assessment as BacktestIcon,
  Hub as AggregationIcon,
  Link as ConnectorIcon,
  MonitorHeart as MonitoringIcon,
  BarChart as PerformanceIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const drawerWidth = 240;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 检查登录状态，如果未登录则重定向到登录页
  useEffect(() => {
    const token = localStorage.getItem('token');
    // 如果没有token且当前不在登录页，则重定向
    if (!token && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [navigate, location.pathname]);

  const menuItems = [
    {
      text: '数字孪生仪表板',
      icon: <Dashboard />,
      path: '/dashboard'
    },
    {
      text: '设备管理',
      icon: <DevicesOther />,
      path: '/devices'
    },
    {
      text: '设备类型管理',
      icon: <CategoryIcon />,
      path: '/device-types'
    },
    {
      text: '能源监控',
      icon: <ElectricBolt />,
      path: '/energy'
    },
    {
      text: '数据分析',
      icon: <Analytics />,
      path: '/analytics'
    },
    {
      text: '碳排放管理',
      icon: <Co2 />,
      path: '/carbon'
    },
    {
      text: '告警管理',
      icon: <Notifications />,
      path: '/alerts'
    },
    {
      text: '数字孪生可视化',
      icon: <ThreeDRotation />,
      path: '/digital-twin'
    },
    {
      text: 'VPP交易策略',
      icon: <TradingIcon />,
      path: '/vpp/trading-strategy'
    },
    {
      text: 'VPP回测结果',
      icon: <BacktestIcon />,
      path: '/vpp/backtest-results'
    },
    {
      text: 'VPP资源聚合',
      icon: <AggregationIcon />,
      path: '/vpp/resource-aggregation'
    },
    {
      text: 'VPP市场连接',
      icon: <ConnectorIcon />,
      path: '/vpp/market-connector'
    },
    {
      text: 'VPP实时监控',
      icon: <MonitoringIcon />,
      path: '/vpp/monitoring'
    },
    {
      text: 'VPP性能分析',
      icon: <PerformanceIcon />,
      path: '/vpp/performance'
    },
    {
      text: 'PWA状态',
      icon: <PhoneAndroid />,
      path: '/pwa'
    },
    {
      text: '系统报告',
      icon: <Assessment />,
      path: '/reports'
    }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
  setAnchorEl(null);
};

const handleLogout = () => {
  localStorage.removeItem('token');
  navigate('/login');
  handleProfileMenuClose();
};

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <ElectricBolt color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap component="div" color="primary">
            智慧园区
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/settings')}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="系统设置" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/help')}>
            <ListItemIcon>
              <Help />
            </ListItemIcon>
            <ListItemText primary="帮助中心" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            智慧园区能源管理系统
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="通知">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="账户设置">
              <IconButton
                color="inherit"
                onClick={handleProfileMenuOpen}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <AccountCircle />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      
      {/* 用户菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <Avatar /> 个人资料
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <Settings sx={{ mr: 2 }} /> 账户设置
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 2 }} /> 退出登录
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;