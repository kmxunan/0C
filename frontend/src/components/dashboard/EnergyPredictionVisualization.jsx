import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, CircularProgress, Alert, Grid, Card, CardContent, Divider, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { Assessment, Warning, Refresh, Download, Timeline } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const EnergyPredictionVisualization = () => {
  const theme = useTheme();
  const [predictionData, setPredictionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [predictionAccuracy, setPredictionAccuracy] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 图表颜色配置
  const chartColors = {
    predicted: theme.palette.primary.main,
    actual: theme.palette.success.main,
    difference: theme.palette.warning.main
  };

  // 获取预测数据
  const fetchPredictionData = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '/api/energy/predict/24hours';
      if (timeRange === '7d') {
        endpoint = '/api/energy/predict/7days'; // 假设存在7天预测接口
      } else if (timeRange === '30d') {
        endpoint = '/api/energy/predict/30days'; // 假设存在30天预测接口
      }

      const response = await axios.get(endpoint);
      setPredictionData(response.data.predictions);

      // 获取预测准确性数据（假设存在此接口）
      const accuracyResponse = await axios.get('/api/energy/predict/accuracy');
      setPredictionAccuracy(accuracyResponse.data.accuracy);
    } catch (err) {
      console.error('获取能源预测数据失败:', err);
      setError('无法加载能源预测数据，请稍后重试');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPredictionData();
  };

  // 导出数据
  const exportData = () => {
    // 实现数据导出逻辑
    const csvContent = "data:text/csv;charset=utf-8,"
      + [['时间', '预测能耗 (kWh)'].join(','), ...predictionData.map(item => 
        [format(parseISO(item.timestamp), 'yyyy-MM-dd HH:mm'), item.predictedEnergyUsage].join(',')
      )].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `energy_prediction_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 组件挂载时和时间范围变化时获取数据
  useEffect(() => {
    fetchPredictionData();

    // 设置定时刷新（每30分钟）
    const intervalId = setInterval(fetchPredictionData, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [timeRange]);

  // 格式化X轴标签
  const formatXAxis = (value) => {
    if (timeRange === '24h') {
      return format(parseISO(value), 'HH:mm');
    } else if (timeRange === '7d') {
      return format(parseISO(value), 'MM-dd');
    } else {
      return format(parseISO(value), 'MM-dd');
    }
  };

  // 计算总预测能耗
  const totalPredictedEnergy = predictionData.reduce((sum, item) => sum + item.predictedEnergyUsage, 0).toFixed(2);

  // 找出峰值能耗
  const peakEnergy = predictionData.length > 0
    ? Math.max(...predictionData.map(item => item.predictedEnergyUsage)).toFixed(2)
    : '0.00';

  // 找出峰值时间
  const peakTime = predictionData.length > 0
    ? format(parseISO(predictionData.find(item => item.predictedEnergyUsage === Math.max(...predictionData.map(i => i.predictedEnergyUsage))).timestamp), 'HH:mm')
    : '--:--';

  if (loading && predictionData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Assessment color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">能源消耗预测</Typography>
          {predictionAccuracy !== null && (
            <Chip
              size="small"
              label={`准确率: ${(predictionAccuracy * 100).toFixed(1)}%`}
              color={predictionAccuracy >= 0.8 ? "success" : predictionAccuracy >= 0.6 ? "warning" : "error"}
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <Box display="flex" gap={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>时间范围</InputLabel>
            <Select
              value={timeRange}
              label="时间范围"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="24h">24小时</MenuItem>
              <MenuItem value="7d">7天</MenuItem>
              <MenuItem value="30d">30天</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            刷新
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={exportData}
            disabled={predictionData.length === 0}
          >
            导出
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* 关键指标卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4} md={4} lg={4}>
          <Card sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                总预测能耗
              </Typography>
              <Typography variant="h4" component="div">
                {totalPredictedEnergy} kWh
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {timeRange === '24h' ? '今日总预测' : timeRange === '7d' ? '本周总预测' : '本月总预测'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4} lg={4}>
          <Card sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                峰值能耗
              </Typography>
              <Typography variant="h4" component="div">
                {peakEnergy} kWh
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {timeRange === '24h' ? `预计峰值时间: ${peakTime}` : '最高单日能耗'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4} lg={4}>
          <Card sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                平均能耗
              </Typography>
              <Typography variant="h4" component="div">
                {predictionData.length > 0
                  ? (totalPredictedEnergy / predictionData.length).toFixed(2)
                  : '0.00'} kWh
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {timeRange === '24h' ? '每小时平均值' : timeRange === '7d' ? '每日平均值' : '每月平均值'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* 预测图表 */}
      <Box height={350} width="100%">
        <ResponsiveContainer width="100%" height="100%">
          {timeRange === '24h' ? (
            <AreaChart
              data={predictionData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="predictedEnergyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.predicted} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={chartColors.predicted} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value} kWh`}
              />
              <Tooltip
                formatter={(value) => [`${value.toFixed(2)} kWh`, '预测能耗']}
                labelFormatter={(label) => `时间: ${format(parseISO(label), 'yyyy-MM-dd HH:mm')}`}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
              />
              <Area
                type="monotone"
                dataKey="predictedEnergyUsage"
                stroke={chartColors.predicted}
                fillOpacity={1}
                fill="url(#predictedEnergyGradient)"
                strokeWidth={2}
                animationDuration={1500}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={predictionData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value} kWh`}
              />
              <Tooltip
                formatter={(value) => [`${value.toFixed(2)} kWh`, '预测能耗']}
                labelFormatter={(label) => `日期: ${format(parseISO(label), 'yyyy-MM-dd')}`}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
              />
              <Bar
                dataKey="predictedEnergyUsage"
                fill={chartColors.predicted}
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>

      {/* 预测说明 */}
      <Box mt={3}>
        <Typography variant="body2" color="textSecondary">
          <Timeline fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          预测基于历史能耗数据、时间特征和环境因素。实际能耗可能因设备使用情况和环境变化而有所不同。
        </Typography>
      </Box>
    </Paper>
  );
};

export default EnergyPredictionVisualization;