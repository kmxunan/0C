/**
 * VPP性能分析组件
 * 提供虚拟电厂性能指标分析和报告功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  MonetizationOn as MoneyIcon,
  ElectricBolt as ElectricIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Compare as CompareIcon,
  Analytics as AnalyticsIcon,
  Eco as EcoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Line, Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';
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
  RadialLinearScale,
  Filler
} from 'chart.js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import zhCN from 'date-fns/locale/zh-CN';

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
  RadialLinearScale,
  Filler
);

// 样式化组件
const StyledCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const MetricCard = styled(Paper)(({ theme, trend }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  borderLeft: `4px solid ${
    trend === 'up' ? theme.palette.success.main :
    trend === 'down' ? theme.palette.error.main :
    theme.palette.info.main
  }`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const PerformanceAnalytics = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 筛选条件
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
    end: new Date()
  });
  
  // 性能数据
  const [performanceData, setPerformanceData] = useState({
    overview: {
      total_revenue: 0,
      total_generation: 0,
      average_efficiency: 0,
      availability_rate: 0,
      carbon_reduction: 0,
      cost_savings: 0,
      roi: 0,
      capacity_factor: 0
    },
    trends: {
      revenue: [],
      generation: [],
      efficiency: [],
      availability: []
    },
    resources: [],
    strategies: [],
    benchmarks: {
      industry_average: {},
      best_practice: {},
      targets: {}
    },
    alerts: [],
    recommendations: []
  });
  


  // 生成模拟性能数据
  const generateMockPerformanceData = useCallback(() => {
    const days = Math.ceil((dateRange.end - dateRange.start) / (24 * 60 * 60 * 1000));
    const labels = [];
    const revenueData = [];
    const generationData = [];
    const efficiencyData = [];
    const availabilityData = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      labels.push(date.toLocaleDateString('zh-CN'));
      
      // 模拟季节性变化
      const seasonFactor = 0.8 + 0.4 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
      revenueData.push(15000 + Math.random() * 10000 * seasonFactor);
      generationData.push(800 + Math.random() * 400 * seasonFactor);
      efficiencyData.push(0.85 + Math.random() * 0.1);
      availabilityData.push(0.92 + Math.random() * 0.07);
    }
    
    return {
      overview: {
        total_revenue: 450000 + Math.random() * 100000,
        total_generation: 25000 + Math.random() * 5000,
        average_efficiency: 0.87 + Math.random() * 0.08,
        availability_rate: 0.94 + Math.random() * 0.05,
        carbon_reduction: 12.5 + Math.random() * 2.5,
        cost_savings: 85000 + Math.random() * 15000,
        roi: 0.15 + Math.random() * 0.05,
        capacity_factor: 0.68 + Math.random() * 0.12
      },
      trends: {
        labels,
        revenue: revenueData,
        generation: generationData,
        efficiency: efficiencyData,
        availability: availabilityData
      },
      resources: [
        {
          id: '1',
          name: '太阳能发电站A',
          type: 'solar',
          capacity: 500,
          generation: 12500,
          revenue: 180000,
          efficiency: 0.89,
          availability: 0.96,
          capacity_factor: 0.72,
          maintenance_cost: 15000,
          roi: 0.18
        },
        {
          id: '2',
          name: '风力发电站B',
          type: 'wind',
          capacity: 400,
          generation: 8500,
          revenue: 125000,
          efficiency: 0.85,
          availability: 0.92,
          capacity_factor: 0.61,
          maintenance_cost: 12000,
          roi: 0.14
        },
        {
          id: '3',
          name: '储能系统C',
          type: 'battery',
          capacity: 300,
          generation: 4000,
          revenue: 95000,
          efficiency: 0.88,
          availability: 0.95,
          capacity_factor: 0.38,
          maintenance_cost: 8000,
          roi: 0.16
        }
      ],
      strategies: [
        {
          id: '1',
          name: '削峰填谷策略',
          executions: 450,
          success_rate: 0.92,
          total_profit: 125000,
          average_profit: 278,
          risk_score: 0.15,
          sharpe_ratio: 1.85
        },
        {
          id: '2',
          name: '套利交易策略',
          executions: 280,
          success_rate: 0.88,
          total_profit: 85000,
          average_profit: 304,
          risk_score: 0.22,
          sharpe_ratio: 1.62
        }
      ],
      benchmarks: {
        industry_average: {
          efficiency: 0.82,
          availability: 0.89,
          capacity_factor: 0.58,
          roi: 0.12
        },
        best_practice: {
          efficiency: 0.92,
          availability: 0.97,
          capacity_factor: 0.78,
          roi: 0.22
        },
        targets: {
          efficiency: 0.90,
          availability: 0.95,
          capacity_factor: 0.70,
          roi: 0.18
        }
      },
      alerts: [
        {
          id: '1',
          type: 'performance',
          severity: 'warning',
          message: '风力发电站B效率低于目标值',
          metric: 'efficiency',
          current_value: 0.85,
          target_value: 0.90,
          recommendation: '建议进行叶片清洁和维护检查'
        },
        {
          id: '2',
          type: 'financial',
          severity: 'info',
          message: '削峰填谷策略收益超预期',
          metric: 'profit',
          current_value: 125000,
          target_value: 100000,
          recommendation: '可考虑增加策略执行频率'
        }
      ],
      recommendations: [
        {
          id: '1',
          category: 'optimization',
          priority: 'high',
          title: '优化储能系统充放电策略',
          description: '基于历史数据分析，建议调整储能系统的充放电时间窗口以提高收益',
          potential_benefit: '预计可提升15%收益',
          implementation_effort: 'medium'
        },
        {
          id: '2',
          category: 'maintenance',
          priority: 'medium',
          title: '制定预防性维护计划',
          description: '建立基于状态的维护策略，减少计划外停机时间',
          potential_benefit: '预计可提升3%可用率',
          implementation_effort: 'high'
        }
      ]
    };
  }, [dateRange]);

  // 加载性能数据
  const loadPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      // 在实际应用中，这里应该调用真实的API
      const data = generateMockPerformanceData();
      setPerformanceData(data);
    } catch (err) {
      setError('加载性能数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [generateMockPerformanceData]);

  // 导出报告
  const exportReport = async (format) => {
    try {
      setLoading(true);
      // 在实际应用中，这里应该调用导出API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(`${format.toUpperCase()}报告导出成功`);
    } catch (err) {
      setError('导出报告失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  // 格式化数字
  const formatNumber = (num, decimals = 2) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
    return Number(num).toFixed(decimals);
  };

  // 格式化百分比
  const formatPercentage = (num) => {
    return `${(num * 100).toFixed(1)}%`;
  };



  // 生成收益趋势图数据
  const generateRevenueTrendData = () => {
    return {
      labels: performanceData.trends.labels,
      datasets: [
        {
          label: '日收益 (¥)',
          data: performanceData.trends.revenue,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  // 生成效率对比雷达图数据
  const generateEfficiencyRadarData = () => {
    return {
      labels: ['发电效率', '可用率', '容量因子', 'ROI', '成本控制', '环保指标'],
      datasets: [
        {
          label: '当前表现',
          data: [
            performanceData.overview.average_efficiency * 100,
            performanceData.overview.availability_rate * 100,
            performanceData.overview.capacity_factor * 100,
            performanceData.overview.roi * 100,
            85, // 成本控制评分
            90  // 环保指标评分
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointBackgroundColor: 'rgba(54, 162, 235, 1)'
        },
        {
          label: '行业平均',
          data: [
            performanceData.benchmarks.industry_average.efficiency * 100,
            performanceData.benchmarks.industry_average.availability * 100,
            performanceData.benchmarks.industry_average.capacity_factor * 100,
            performanceData.benchmarks.industry_average.roi * 100,
            75,
            80
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          pointBackgroundColor: 'rgba(255, 99, 132, 1)'
        },
        {
          label: '目标值',
          data: [
            performanceData.benchmarks.targets.efficiency * 100,
            performanceData.benchmarks.targets.availability * 100,
            performanceData.benchmarks.targets.capacity_factor * 100,
            performanceData.benchmarks.targets.roi * 100,
            90,
            95
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          pointBackgroundColor: 'rgba(75, 192, 192, 1)'
        }
      ]
    };
  };

  // 生成资源性能对比图数据
  const generateResourceComparisonData = () => {
    return {
      labels: performanceData.resources.map(r => r.name),
      datasets: [
        {
          label: 'ROI (%)',
          data: performanceData.resources.map(r => r.roi * 100),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: '效率 (%)',
          data: performanceData.resources.map(r => r.efficiency * 100),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: '可用率 (%)',
          data: performanceData.resources.map(r => r.availability * 100),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
      <Box sx={{ p: 3 }}>
        {/* 页面标题和控制面板 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            性能分析
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <MuiDatePicker
              label="开始日期"
              value={dateRange.start}
              onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
            <MuiDatePicker
              label="结束日期"
              value={dateRange.end}
              onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportReport('pdf')}
              disabled={loading}
            >
              导出PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportReport('excel')}
              disabled={loading}
            >
              导出Excel
            </Button>
            <Tooltip title="刷新数据">
              <IconButton onClick={loadPerformanceData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 关键指标概览 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard trend="up">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">总收益</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ¥{formatNumber(performanceData.overview.total_revenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main">+12.5%</Typography>
                  </Box>
                </Box>
              </Box>
            </MetricCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard trend="up">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <ElectricIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">总发电量</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(performanceData.overview.total_generation)} MWh
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main">+8.3%</Typography>
                  </Box>
                </Box>
              </Box>
            </MetricCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard trend="stable">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <SpeedIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">平均效率</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatPercentage(performanceData.overview.average_efficiency)}
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    目标: {formatPercentage(performanceData.benchmarks.targets.efficiency)}
                  </Typography>
                </Box>
              </Box>
            </MetricCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard trend="up">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <EcoIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">碳减排</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {performanceData.overview.carbon_reduction.toFixed(1)}t
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    环保贡献
                  </Typography>
                </Box>
              </Box>
            </MetricCard>
          </Grid>
        </Grid>

        {/* 标签页导航 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="趋势分析" icon={<TimelineIcon />} />
            <Tab label="资源对比" icon={<CompareIcon />} />
            <Tab label="策略表现" icon={<AssessmentIcon />} />
            <Tab label="基准对比" icon={<AnalyticsIcon />} />
            <Tab label="告警建议" icon={<WarningIcon />} />
          </Tabs>
        </Box>

        {/* 趋势分析标签页 */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <StyledCard>
                <CardHeader title="收益趋势" />
                <CardContent>
                  <Box sx={{ height: 400 }}>
                    <Line
                      data={generateRevenueTrendData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: '收益 (¥)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: '日期'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <StyledCard>
                <CardHeader title="关键指标" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <StarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="ROI"
                        secondary={formatPercentage(performanceData.overview.roi)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="可用率"
                        secondary={formatPercentage(performanceData.overview.availability_rate)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SpeedIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="容量因子"
                        secondary={formatPercentage(performanceData.overview.capacity_factor)}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 资源对比标签页 */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <StyledCard>
                <CardHeader title="资源性能对比" />
                <CardContent>
                  <Box sx={{ height: 400 }}>
                    <Bar
                      data={generateResourceComparisonData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: '百分比 (%)'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <StyledCard>
                <CardHeader title="资源详情" />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>资源</TableCell>
                          <TableCell align="right">收益</TableCell>
                          <TableCell align="right">ROI</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>{resource.name}</TableCell>
                            <TableCell align="right">¥{formatNumber(resource.revenue)}</TableCell>
                            <TableCell align="right">{formatPercentage(resource.roi)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 策略表现标签页 */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <StyledCard>
                <CardHeader title="交易策略表现" />
                <CardContent>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>策略名称</TableCell>
                          <TableCell align="right">执行次数</TableCell>
                          <TableCell align="right">成功率</TableCell>
                          <TableCell align="right">总收益</TableCell>
                          <TableCell align="right">平均收益</TableCell>
                          <TableCell align="right">风险评分</TableCell>
                          <TableCell align="right">夏普比率</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.strategies.map((strategy) => (
                          <TableRow key={strategy.id}>
                            <TableCell>{strategy.name}</TableCell>
                            <TableCell align="right">{strategy.executions}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                {formatPercentage(strategy.success_rate)}
                                <LinearProgress
                                  variant="determinate"
                                  value={strategy.success_rate * 100}
                                  sx={{ width: 50 }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell align="right">¥{formatNumber(strategy.total_profit)}</TableCell>
                            <TableCell align="right">¥{strategy.average_profit}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={strategy.risk_score.toFixed(2)}
                                color={strategy.risk_score < 0.2 ? 'success' : strategy.risk_score < 0.3 ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">{strategy.sharpe_ratio.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 基准对比标签页 */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <StyledCard>
                <CardHeader title="性能基准对比" />
                <CardContent>
                  <Box sx={{ height: 400 }}>
                    <Radar
                      data={generateEfficiencyRadarData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          }
                        },
                        scales: {
                          r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              stepSize: 20
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <StyledCard>
                <CardHeader title="基准说明" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="当前表现"
                        secondary="基于实际运行数据计算的综合指标"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="行业平均"
                        secondary="同类型虚拟电厂的平均水平"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="目标值"
                        secondary="设定的性能改进目标"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 告警建议标签页 */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardHeader title="性能告警" />
                <CardContent>
                  <List>
                    {performanceData.alerts.map((alert) => (
                      <ListItem key={alert.id} divider>
                        <ListItemIcon>
                          {alert.severity === 'warning' ? 
                            <WarningIcon color="warning" /> : 
                            <CheckCircleIcon color="info" />
                          }
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.message}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                当前值: {alert.current_value} | 目标值: {alert.target_value}
                              </Typography>
                              <Typography variant="body2" color="primary.main">
                                建议: {alert.recommendation}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardHeader title="优化建议" />
                <CardContent>
                  <List>
                    {performanceData.recommendations.map((rec) => (
                      <ListItem key={rec.id} divider>
                        <ListItemIcon>
                          <Chip
                            label={rec.priority}
                            color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                            size="small"
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {rec.description}
                              </Typography>
                              <Typography variant="body2" color="success.main">
                                预期收益: {rec.potential_benefit}
                              </Typography>
                              <Typography variant="body2" color="info.main">
                                实施难度: {rec.implementation_effort}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </TabPanel>

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
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default PerformanceAnalytics;