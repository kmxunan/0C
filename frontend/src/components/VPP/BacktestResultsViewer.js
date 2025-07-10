/**
 * VPP策略回测结果展示组件
 * 提供回测结果的可视化分析和比较功能
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
  Alert,
  Snackbar,
  Paper,
  LinearProgress,
  TablePagination,
  Tab,
  Tabs,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Compare as CompareIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { vppTradingStrategyAPI } from '../../api/vppTradingStrategy';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// 样式化组件

const ResultCard = styled(Card)(({ theme, status }) => ({
  margin: theme.spacing(1),
  border: `1px solid ${
    status === 'completed' ? theme.palette.success.main :
    status === 'running' ? theme.palette.warning.main :
    status === 'failed' ? theme.palette.error.main :
    theme.palette.divider
  }`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[6]
  }
}));

// 自定义TabPanel组件
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const BacktestResultsViewer = () => {
  // 状态管理
  const [backtestResults, setBacktestResults] = useState([]);
  const [selectedResults, setSelectedResults] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 对话框状态
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  // Tab状态
  const [tabValue, setTabValue] = useState(0);
  
  // 表格分页
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 筛选和排序
  const [filters, setFilters] = useState({
    strategy_type: '',
    status: '',
    date_range: [null, null]
  });
  
  // 回测配置
  const [backtestConfig, setBacktestConfig] = useState({
    start_date: '',
    end_date: '',
    initial_capital: 100000,
    commission_rate: 0.001,
    slippage_rate: 0.0005,
    benchmark: 'market_index'
  });

  // 加载回测结果
  const loadBacktestResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vppTradingStrategyAPI.getBacktestResults(filters);
      setBacktestResults(response.results || []);
    } catch (err) {
      setError('加载回测结果失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 运行新回测
  const runBacktest = async (strategyId) => {
    try {
      setLoading(true);
      const response = await vppTradingStrategyAPI.runBacktest(strategyId, backtestConfig);
      setSuccess('回测任务已启动');
      await loadBacktestResults();
    } catch (err) {
      setError('启动回测失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 比较策略
  const compareStrategies = async () => {
    if (selectedResults.length < 2) {
      setError('请至少选择两个回测结果进行比较');
      return;
    }
    
    try {
      setLoading(true);
      const response = await vppTradingStrategyAPI.compareBacktestResults(selectedResults);
      setComparisonData(response.comparison);
      setComparisonDialogOpen(true);
    } catch (err) {
      setError('比较策略失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBacktestResults();
  }, [loadBacktestResults]);

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <WarningIcon color="warning" />;
      default:
        return <SettingsIcon color="disabled" />;
    }
  };

  // 获取趋势指示器
  const getTrendIcon = (value) => {
    return value > 0 ? 
      <TrendingUpIcon color="success" /> : 
      <TrendingDownIcon color="error" />;
  };

  // 格式化数字
  const formatNumber = (num, decimals = 2) => {
    return Number(num).toFixed(decimals);
  };

  // 格式化百分比
  const formatPercentage = (num) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  // 生成性能图表数据
  const generatePerformanceChartData = (result) => {
    if (!result.performance_data) return null;
    
    return {
      labels: result.performance_data.dates || [],
      datasets: [
        {
          label: '策略收益',
          data: result.performance_data.strategy_returns || [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: '基准收益',
          data: result.performance_data.benchmark_returns || [],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  };



  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          策略回测结果
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={compareStrategies}
            disabled={selectedResults.length < 2}
          >
            比较策略 ({selectedResults.length})
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadBacktestResults}
          >
            刷新
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={() => setConfigDialogOpen(true)}
          >
            运行回测
          </Button>
        </Box>
      </Box>

      {/* 加载指示器 */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 筛选器 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>策略类型</InputLabel>
                <Select
                  value={filters.strategy_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, strategy_type: e.target.value }))}
                  label="策略类型"
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="price_based">价格驱动</MenuItem>
                  <MenuItem value="load_based">负荷驱动</MenuItem>
                  <MenuItem value="arbitrage">套利策略</MenuItem>
                  <MenuItem value="peak_shaving">削峰填谷</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>状态</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  label="状态"
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="completed">已完成</MenuItem>
                  <MenuItem value="running">运行中</MenuItem>
                  <MenuItem value="failed">失败</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="开始日期"
                type="date"
                value={filters.date_range[0] || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  date_range: [e.target.value, prev.date_range[1]] 
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                onClick={() => setFilters({ strategy_type: '', status: '', date_range: [null, null] })}
                fullWidth
              >
                清除筛选
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 回测结果列表 */}
      <Grid container spacing={3}>
        {backtestResults.map((result) => (
          <Grid item xs={12} lg={6} key={result.backtest_id}>
            <ResultCard status={result.status}>
              <CardHeader
                avatar={getStatusIcon(result.status)}
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">{result.strategy_name}</Typography>
                    <Chip
                      label={result.strategy_type}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                subheader={`回测时间: ${new Date(result.created_at).toLocaleString()}`}
                action={
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedResults.includes(result.backtest_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResults(prev => [...prev, result.backtest_id]);
                          } else {
                            setSelectedResults(prev => prev.filter(id => id !== result.backtest_id));
                          }
                        }}
                      />
                    }
                    label="选择"
                  />
                }
              />
              <CardContent>
                {result.status === 'completed' && result.performance_metrics && (
                  <>
                    {/* 关键指标 */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">总收益率</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <Typography variant="h6" color={result.performance_metrics.total_return >= 0 ? 'success.main' : 'error.main'}>
                              {formatPercentage(result.performance_metrics.total_return)}
                            </Typography>
                            {getTrendIcon(result.performance_metrics.total_return)}
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">夏普比率</Typography>
                          <Typography variant="h6">
                            {formatNumber(result.performance_metrics.sharpe_ratio)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">最大回撤</Typography>
                          <Typography variant="h6" color="error.main">
                            {formatPercentage(Math.abs(result.performance_metrics.max_drawdown))}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">胜率</Typography>
                          <Typography variant="h6">
                            {formatPercentage(result.performance_metrics.win_rate)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* 性能图表 */}
                    {result.performance_data && (
                      <Box sx={{ height: 200, mb: 2 }}>
                        <Line
                          data={generatePerformanceChartData(result)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                              title: {
                                display: true,
                                text: '收益曲线'
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: false
                              }
                            }
                          }}
                        />
                      </Box>
                    )}
                  </>
                )}

                {result.status === 'running' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress sx={{ flex: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      进度: {result.progress || 0}%
                    </Typography>
                  </Box>
                )}

                {result.status === 'failed' && (
                  <Alert severity="error">
                    {result.error_message || '回测执行失败'}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`${result.backtest_period?.start_date || ''} - ${result.backtest_period?.end_date || ''}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`初始资金: ¥${(result.initial_capital || 0).toLocaleString()}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="查看详情">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedResults([result]);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <AssessmentIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="下载报告">
                      <IconButton
                        size="small"
                        onClick={() => {
                          // 下载回测报告逻辑
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </ResultCard>
          </Grid>
        ))}
      </Grid>

      {/* 分页 */}
      {backtestResults.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <TablePagination
            component="div"
            count={backtestResults.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Box>
      )}

      {/* 回测配置对话框 */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>回测配置</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="开始日期"
                type="date"
                value={backtestConfig.start_date}
                onChange={(e) => setBacktestConfig(prev => ({ ...prev, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="结束日期"
                type="date"
                value={backtestConfig.end_date}
                onChange={(e) => setBacktestConfig(prev => ({ ...prev, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="初始资金"
                type="number"
                value={backtestConfig.initial_capital}
                onChange={(e) => setBacktestConfig(prev => ({ ...prev, initial_capital: parseFloat(e.target.value) }))}
                InputProps={{ startAdornment: '¥' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="手续费率"
                type="number"
                value={backtestConfig.commission_rate}
                onChange={(e) => setBacktestConfig(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                inputProps={{ step: 0.0001, min: 0, max: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="滑点率"
                type="number"
                value={backtestConfig.slippage_rate}
                onChange={(e) => setBacktestConfig(prev => ({ ...prev, slippage_rate: parseFloat(e.target.value) }))}
                inputProps={{ step: 0.0001, min: 0, max: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>基准指数</InputLabel>
                <Select
                  value={backtestConfig.benchmark}
                  onChange={(e) => setBacktestConfig(prev => ({ ...prev, benchmark: e.target.value }))}
                  label="基准指数"
                >
                  <MenuItem value="market_index">市场指数</MenuItem>
                  <MenuItem value="power_index">电力指数</MenuItem>
                  <MenuItem value="custom">自定义</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>取消</Button>
          <Button
            onClick={() => {
              // 这里需要选择策略ID
              setConfigDialogOpen(false);
            }}
            variant="contained"
            disabled={!backtestConfig.start_date || !backtestConfig.end_date}
          >
            开始回测
          </Button>
        </DialogActions>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TimelineIcon />
            回测详情
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedResults.length > 0 && (
            <Box>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="性能分析" />
                <Tab label="风险指标" />
                <Tab label="交易记录" />
                <Tab label="持仓分析" />
              </Tabs>
              
              <TabPanel value={tabValue} index={0}>
                {/* 性能分析内容 */}
                <Typography variant="h6" gutterBottom>性能分析</Typography>
                {/* 这里添加详细的性能分析图表和数据 */}
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                {/* 风险指标内容 */}
                <Typography variant="h6" gutterBottom>风险指标</Typography>
                {/* 这里添加风险指标的雷达图和详细数据 */}
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                {/* 交易记录内容 */}
                <Typography variant="h6" gutterBottom>交易记录</Typography>
                {/* 这里添加交易记录表格 */}
              </TabPanel>
              
              <TabPanel value={tabValue} index={3}>
                {/* 持仓分析内容 */}
                <Typography variant="h6" gutterBottom>持仓分析</Typography>
                {/* 这里添加持仓分析图表 */}
              </TabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 策略比较对话框 */}
      <Dialog
        open={comparisonDialogOpen}
        onClose={() => setComparisonDialogOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CompareIcon />
            策略比较分析
          </Box>
        </DialogTitle>
        <DialogContent>
          {comparisonData && (
            <Box>
              {/* 比较图表和数据 */}
              <Typography variant="h6" gutterBottom>策略对比</Typography>
              {/* 这里添加策略比较的图表和分析 */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComparisonDialogOpen(false)}>关闭</Button>
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

export default BacktestResultsViewer;