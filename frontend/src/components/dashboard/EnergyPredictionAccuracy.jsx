import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, CircularProgress, Alert, Grid, Card, CardContent, Divider, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { Assessment, Warning, Refresh, Download, CheckCircle, Error, Info } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const EnergyPredictionAccuracy = () => {
  const theme = useTheme();
  const [accuracyData, setAccuracyData] = useState(null);
  const [errorDistribution, setErrorDistribution] = useState([]);
  const [predictionComparison, setPredictionComparison] = useState([]);
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 图表颜色配置
  const chartColors = {
    mae: theme.palette.primary.main,
    rmse: theme.palette.error.main,
    rSquared: theme.palette.success.main,
    actual: theme.palette.success.main,
    predicted: theme.palette.primary.main,
    error: theme.palette.warning.main
  };

  // 评估指标解释
  const metricExplanations = {
    mae: '平均绝对误差 - 预测值与实际值绝对差的平均值',
    rmse: '均方根误差 - 预测值与实际值差的平方的平均值的平方根',
    rSquared: '决定系数 - 模型解释数据变异性的能力，值越接近1越好',
    mape: '平均绝对百分比误差 - 绝对误差占实际值的百分比的平均值'
  };

  // 获取准确性评估数据
  const fetchAccuracyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取总体准确性指标
      const accuracyResponse = await axios.get('/api/energy/predict/accuracy');
      setAccuracyData(accuracyResponse.data);

      // 获取误差分布数据
      const errorDistResponse = await axios.get('/api/energy/predict/accuracy/error-distribution');
      setErrorDistribution(errorDistResponse.data);

      // 获取预测与实际值对比数据
      const comparisonResponse = await axios.get('/api/energy/predict/accuracy/comparison');
      setPredictionComparison(comparisonResponse.data);

      // 获取性能趋势数据
      const trendResponse = await axios.get('/api/energy/predict/accuracy/trend');
      setPerformanceTrend(trendResponse.data);
    } catch (err) {
      console.error('获取能源预测准确性数据失败:', err);
      setError('无法加载预测准确性评估数据，请稍后重试');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAccuracyData();
  };

  // 导出评估报告
  const exportReport = () => {
    // 实现导出逻辑
    const csvContent = "data:text/csv;charset=utf-8,"
      + [['时间', '实际能耗 (kWh)', '预测能耗 (kWh)', '绝对误差', '百分比误差 (%)'].join(','), ...predictionComparison.map(item => 
        [
          format(parseISO(item.timestamp), 'yyyy-MM-dd HH:mm'),
          item.actualEnergyUsage.toFixed(2),
          item.predictedEnergyUsage.toFixed(2),
          Math.abs(item.actualEnergyUsage - item.predictedEnergyUsage).toFixed(2),
          ((Math.abs(item.actualEnergyUsage - item.predictedEnergyUsage) / item.actualEnergyUsage) * 100).toFixed(2)
        ].join(',')
      )].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `energy_prediction_accuracy_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchAccuracyData();

    // 设置定时刷新（每24小时）
    const intervalId = setInterval(fetchAccuracyData, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // 判断模型性能等级
  const getPerformanceLevel = (rSquared) => {
    if (rSquared >= 0.9) return { level: '优秀', color: 'success' };
    if (rSquared >= 0.8) return { level: '良好', color: 'info' };
    if (rSquared >= 0.7) return { level: '一般', color: 'warning' };
    return { level: '需改进', color: 'error' };
  };

  if (loading && !accuracyData) {
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
          <Typography variant="h6">能源预测准确性评估</Typography>
          {accuracyData && (
            <Chip
              size="small"
              icon={<CheckCircle fontSize="small" />}
              label={`模型性能: ${getPerformanceLevel(accuracyData.rSquared).level}`}
              color={getPerformanceLevel(accuracyData.rSquared).color}
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <Box display="flex" gap={1}>
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
            onClick={exportReport}
            disabled={!predictionComparison || predictionComparison.length === 0}
          >
            导出报告
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>{error}</Alert>
      )}

      {accuracyData && (
        <>{
          /* 关键评估指标卡片 */
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3} lg={3}>
              <Card sx={{ bgcolor: theme.palette.background.paper, borderLeft: `4px solid ${chartColors.mae}` }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        平均绝对误差 (MAE)
                      </Typography>
                      <Typography variant="h4" component="div">
                        {accuracyData.mae.toFixed(2)} kWh
                      </Typography>
                    </Box>
                    <Tooltip title={metricExplanations.mae} arrow>
                      <Info color="action" sx={{ mt: 0.5 }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    越低越好
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={3}>
              <Card sx={{ bgcolor: theme.palette.background.paper, borderLeft: `4px solid ${chartColors.rmse}` }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        均方根误差 (RMSE)
                      </Typography>
                      <Typography variant="h4" component="div">
                        {accuracyData.rmse.toFixed(2)} kWh
                      </Typography>
                    </Box>
                    <Tooltip title={metricExplanations.rmse} arrow>
                      <Info color="action" sx={{ mt: 0.5 }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    越低越好
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={3}>
              <Card sx={{ bgcolor: theme.palette.background.paper, borderLeft: `4px solid ${chartColors.rSquared}` }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        决定系数 (R²)
                      </Typography>
                      <Typography variant="h4" component="div">
                        {accuracyData.rSquared.toFixed(4)}
                      </Typography>
                    </Box>
                    <Tooltip title={metricExplanations.rSquared} arrow>
                      <Info color="action" sx={{ mt: 0.5 }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    越接近1越好
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={3}>
              <Card sx={{ bgcolor: theme.palette.background.paper, borderLeft: `4px solid ${theme.palette.info.main}` }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        平均绝对百分比误差 (MAPE)
                      </Typography>
                      <Typography variant="h4" component="div">
                        {accuracyData.mape.toFixed(2)}%
                      </Typography>
                    </Box>
                    <Tooltip title={metricExplanations.mape} arrow>
                      <Info color="action" sx={{ mt: 0.5 }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    越低越好
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* 图表区域 */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* 误差分布图表 */}
            <Grid item xs={12} md={6} lg={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>误差分布</Typography>
                <Box height={250} width="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={errorDistribution}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: '误差范围 (kWh)', position: 'bottom', offset: 0, fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: '样本数量', angle: -90, position: 'left', offset: 0, fontSize: 12 }}
                      />
                      <RechartsTooltip
                        formatter={(value) => [`${value} 个样本`, '数量']}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
                      />
                      <Bar
                        dataKey="count"
                        fill={chartColors.error}
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* 实际值与预测值对比图表 */}
            <Grid item xs={12} md={6} lg={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>实际值 vs 预测值</Typography>
                <Box height={250} width="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={predictionComparison.slice(-10)} // 取最近10个数据点
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => format(parseISO(value), 'HH:mm')}
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
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="actualEnergyUsage"
                        name="实际能耗"
                        stroke={chartColors.actual}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        animationDuration={1500}
                      />
                      <Line
                        type="monotone"
                        dataKey="predictedEnergyUsage"
                        name="预测能耗"
                        stroke={chartColors.predicted}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* 性能趋势图表 */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>模型性能趋势</Typography>
            <Box height={250} width="100%">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceTrend}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: chartColors.mae }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `${value.toFixed(1)}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: chartColors.rSquared }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0.5, 1]}
                    tickFormatter={(value) => `${value.toFixed(2)}`}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mae"
                    name="MAE"
                    stroke={chartColors.mae}
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rSquared"
                    name="R²"
                    stroke={chartColors.rSquared}
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* 最近预测对比表格 */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>最近预测对比</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>时间</TableCell>
                    <TableCell>实际能耗 (kWh)</TableCell>
                    <TableCell>预测能耗 (kWh)</TableCell>
                    <TableCell>绝对误差 (kWh)</TableCell>
                    <TableCell>百分比误差 (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictionComparison.slice(-10).map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{format(parseISO(item.timestamp), 'MM-dd HH:mm')}</TableCell>
                      <TableCell>{item.actualEnergyUsage.toFixed(2)}</TableCell>
                      <TableCell>{item.predictedEnergyUsage.toFixed(2)}</TableCell>
                      <TableCell>
                        {Math.abs(item.actualEnergyUsage - item.predictedEnergyUsage).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${((Math.abs(item.actualEnergyUsage - item.predictedEnergyUsage) / item.actualEnergyUsage) * 100).toFixed(2)}%`}
                          color={
                            ((Math.abs(item.actualEnergyUsage - item.predictedEnergyUsage) / item.actualEnergyUsage) * 100) < 5
                              ? "success"
                              : ((Math.abs(item.actualEnergyUsage - item.predictedEnergyUsage) / item.actualEnergyUsage) * 100) < 10
                                ? "info"
                                : ((Math.abs(item.actualEnergyUsage - item.predictedEnergyUsage) / item.actualEnergyUsage) * 100) < 20
                                  ? "warning"
                                  : "error"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Paper>
  );
};

export default EnergyPredictionAccuracy;