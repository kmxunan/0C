import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from './theme/mobileTheme';
import { CssBaseline, Box } from '@mui/material';
import Layout from './components/Layout';
import './App.css';
// 路由懒加载组件
const DigitalTwinDashboard = React.lazy(() => import('./components/DigitalTwinDashboard'));
const EnergyDashboard = React.lazy(() => import('./components/dashboard/EnergyDashboard.jsx'));
const DeviceTypeList = React.lazy(() => import('./components/device-types/DeviceTypeList'));
const DeviceTypeForm = React.lazy(() => import('./components/device-types/DeviceTypeForm'));
const DeviceManagement = React.lazy(() => import('./components/DeviceManagement'));
const DeviceStatus = React.lazy(() => import('./components/device/DeviceStatus'));
const EnergyMonitoring = React.lazy(() => import('./components/EnergyMonitoring'));
const DataAnalytics = React.lazy(() => import('./components/DataAnalytics'));
const CarbonManagement = React.lazy(() => import('./components/CarbonManagement'));
const AlertManagement = React.lazy(() => import('./components/AlertManagement'));
const DigitalTwinScene = React.lazy(() => import('./components/digital-twin/DigitalTwinScene'));
const PWAStatus = React.lazy(() => import('./components/PWAStatus'));
const SystemReports = React.lazy(() => import('./components/SystemReports'));
const SystemSettings = React.lazy(() => import('./components/SystemSettings'));
const HelpCenter = React.lazy(() => import('./components/HelpCenter'));
// 路由懒加载组件

// 获取移动端优化主题
const theme = getTheme('light');

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <DigitalTwinDashboard />
              </React.Suspense>
            } />
            <Route path="/energy-dashboard" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <EnergyDashboard />
              </React.Suspense>
            } />
            <Route path="/device-types" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <DeviceTypeList />
              </React.Suspense>
            } />
            <Route path="/device-types/new" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <DeviceTypeForm />
              </React.Suspense>
            } />
            <Route path="/device-types/:id/edit" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <DeviceTypeForm />
              </React.Suspense>
            } />
            <Route path="/devices" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <DeviceManagement />
              </React.Suspense>
            } />
            <Route path="/devices/:id/status" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <DeviceStatus />
              </React.Suspense>
            } />
            <Route path="/energy" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <EnergyMonitoring />
              </React.Suspense>
            } />
            <Route path="/analytics" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <DataAnalytics />
              </React.Suspense>
            } />
            <Route path="/carbon" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <CarbonManagement />
              </React.Suspense>
            } />
            <Route path="/alerts" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <AlertManagement />
              </React.Suspense>
            } />
            <Route path="/digital-twin" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <DigitalTwinScene />
              </React.Suspense>
            } />
            <Route path="/pwa" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <PWAStatus />
              </React.Suspense>
            } />
            <Route path="/reports" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <SystemReports />
              </React.Suspense>
            } />
            <Route path="/settings" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <SystemSettings />
              </React.Suspense>
            } />
            <Route path="/help" element={
              <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>加载中...</Box>}>
                <HelpCenter />
              </React.Suspense>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
