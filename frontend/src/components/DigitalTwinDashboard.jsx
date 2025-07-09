import React, { Suspense, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  Business,
  ElectricBolt,
  Co2,
  Warning,
  CheckCircle,
  Refresh,
  Fullscreen,
  Close
} from '@mui/icons-material';
import { useDigitalTwinStore } from '../stores/digitalTwinStore';
import FullscreenDigitalTwin from './digital-twin/FullscreenDigitalTwin';

// 动态导入3D场景组件
const DigitalTwinViewer = React.lazy(() => import('./DigitalTwinViewer'));

const DigitalTwinDashboard = () => {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const { 
    campusData, 
    selectedBuilding, 
    setSelectedBuilding, 
    isLoading, 
    error, 
    fetchCampusData 
  } = useDigitalTwinStore();

  // 获取园区统计信息
  const getStats = () => {
    if (!campusData) return null;
    
    const totalBuildings = campusData.buildings?.length || 0;
    const totalDevices = campusData.devices?.filter(d => d.status === 'active').length || 0;
    const totalEnergy = campusData.buildings?.reduce((sum, b) => sum + (b.energyConsumption || 0), 0) || 0;
    const totalCarbon = campusData.buildings?.reduce((sum, b) => sum + (b.carbonEmission || 0), 0) || 0;
    const alerts = campusData.alerts?.filter(a => a.level === 'high').length || 0;
    
    return { totalBuildings, totalDevices, totalEnergy, totalCarbon, alerts };
  };

  const stats = getStats();

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* 页面标题和操作栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          园区3D数字孪生视图
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="刷新数据">
            <IconButton onClick={fetchCampusData} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="全屏模式">
            <IconButton onClick={() => setFullscreenOpen(true)}>
              <Fullscreen />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 统计卡片 */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Business sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats.totalBuildings}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  建筑数量
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ElectricBolt sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats.totalDevices}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  活跃设备
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ElectricBolt sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats.totalEnergy.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  总能耗 (kWh)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Co2 sx={{ fontSize: 40, color: '#795548', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats.totalCarbon.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  碳排放 (kg)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                {stats.alerts > 0 ? (
                  <Warning sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                ) : (
                  <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                )}
                <Typography variant="h5" component="div">
                  {stats.alerts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  高级告警
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      <Grid container spacing={3}>
        {/* 3D场景区域 */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 600,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary">
                园区3D模型
              </Typography>
              <Chip 
                label={isLoading ? '加载中...' : error ? '连接错误' : '实时数据'}
                color={isLoading ? 'default' : error ? 'error' : 'success'}
                size="small"
              />
            </Box>
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              {error ? (
                <Alert severity="error" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">数字孪生加载失败</Typography>
                  <Typography variant="body2">{error}</Typography>
                </Alert>
              ) : (
                <Suspense fallback={
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100%',
                      gap: 2
                    }}
                  >
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="text.secondary">
                      正在加载3D场景...
                    </Typography>
                  </Box>
                }>
                  <DigitalTwinViewer 
                    selectedBuilding={selectedBuilding}
                    onBuildingSelect={setSelectedBuilding}
                  />
                </Suspense>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* 信息面板区域 */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 600,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              建筑详细信息
            </Typography>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {selectedBuilding && campusData?.buildings ? (
                (() => {
                  const building = campusData.buildings.find(b => b.id === selectedBuilding);
                  return building ? (
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ color: '#2196f3' }}>
                        {building.name || '未命名建筑'}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>基本信息</Typography>
                        <Typography variant="body2" color="text.secondary">
                          类型: {building.type || '办公楼'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          楼层: {building.floors || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          面积: {building.area || 'N/A'} m²
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>能耗数据</Typography>
                        <Typography variant="body2" color="text.secondary">
                          当前功率: {building.currentPower || 0} kW
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          日能耗: {building.dailyConsumption || 0} kWh
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          月能耗: {building.monthlyConsumption || 0} kWh
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>环境数据</Typography>
                        <Typography variant="body2" color="text.secondary">
                          温度: {building.temperature || 'N/A'}°C
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          湿度: {building.humidity || 'N/A'}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          空气质量: {building.airQuality || 'N/A'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>运行状态</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {building.status === 'normal' ? (
                            <CheckCircle sx={{ fontSize: 16, color: '#4caf50', mr: 1 }} />
                          ) : (
                            <Warning sx={{ fontSize: 16, color: '#ff9800', mr: 1 }} />
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {building.status === 'normal' ? '正常运行' : '需要关注'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      建筑信息未找到
                    </Typography>
                  );
                })()
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Business sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    请点击3D场景中的建筑物查看详细信息
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 全屏数字孪生对话框 */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <FullscreenDigitalTwin onClose={() => setFullscreenOpen(false)} />
          <IconButton
            onClick={() => setFullscreenOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 2000,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.7)'
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DigitalTwinDashboard;