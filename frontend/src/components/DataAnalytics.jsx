/**
 * 数据分析组件
 * 提供能源数据深度分析、预测模型、优化建议等功能
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
  Chip,
  Alert,
  LinearProgress,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Warning,
  CheckCircle,
  Schedule,
  EmojiObjects,
  Assessment,
  Psychology,
  Insights,
  ExpandMore,
  Refresh,
  Download,
  Settings,
  CompareArrows
} from '@mui/icons-material';

const DataAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [analysisType, setAnalysisType] = useState('consumption');
  const [timeRange, setTimeRange] = useState('30d');
  const [predictionData, setPredictionData] = useState([]);
  const [correlationData, setCorrelationData] = useState([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [anomalyDetection, setAnomalyDetection] = useState([]);
  const [costAnalysis, setCostAnalysis] = useState([]);
  const [efficiencyTrends, setEfficiencyTrends] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [analysisType, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPredictionData(),
        loadCorrelationData(),
        loadOptimizationSuggestions(),
        loadPerformanceMetrics(),
        loadAnomalyDetection(),
        loadCostAnalysis(),
        loadEfficiencyTrends(),
        loadBenchmarkData()
      ]);
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPredictionData = async () => {
    // 模拟预测数据
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const baseConsumption = 15000 + Math.sin(i * Math.PI / 15) * 3000;
      return {
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        historical: i < 15 ? baseConsumption + Math.random() * 1000 : null,
        predicted: i >= 15 ? baseConsumption + Math.random() * 1000 : null,
        confidence: i >= 15 ? 85 + Math.random() * 10 : null,
        upperBound: i >= 15 ? baseConsumption + Math.random() * 1000 + 500 : null,
        lowerBound: i >= 15 ? baseConsumption + Math.random() * 1000 - 500 : null
      };
    });
    setPredictionData(days);
  };

  const loadCorrelationData = async () => {
    // 模拟相关性分析数据
    const hours = Array.from({ length: 24 }, (_, i) => {
      const temperature = 20 + Math.sin(i * Math.PI / 12) * 8 + Math.random() * 3;
      const consumption = 800 + temperature * 15 + Math.random() * 100;
      return {
        hour: i,
        temperature,
        consumption,
        occupancy: Math.max(0, Math.sin((i - 8) * Math.PI / 10) * 100 + Math.random() * 20),
        solarRadiation: Math.max(0, Math.sin((i - 6) * Math.PI / 12) * 1000)
      };
    });
    setCorrelationData(hours);
  };

  const loadOptimizationSuggestions = async () => {
    // 模拟优化建议
    const suggestions = [
      {
        id: 1,
        category: 'HVAC优化',
        title: '调整空调温度设定',
        description: '建议将空调温度从22°C调整至24°C，可节省约15%的能耗',
        impact: 'high',
        savings: 2250,
        implementation: 'easy',
        priority: 1
      },
      {
        id: 2,
        category: '照明优化',
        title: '安装智能照明控制系统',
        description: '根据自然光照和人员活动自动调节照明亮度',
        impact: 'medium',
        savings: 1800,
        implementation: 'medium',
        priority: 2
      },
      {
        id: 3,
        category: '设备管理',
        title: '优化设备运行时间',
        description: '将非关键设备的运行时间调整到低峰时段',
        impact: 'medium',
        savings: 1200,
        implementation: 'easy',
        priority: 3
      },
      {
        id: 4,
        category: '储能优化',
        title: '优化储能充放电策略',
        description: '根据电价和负荷预测优化储能系统的充放电时机',
        impact: 'high',
        savings: 3200,
        implementation: 'hard',
        priority: 1
      }
    ];
    setOptimizationSuggestions(suggestions);
  };

  const loadPerformanceMetrics = async () => {
    // 模拟性能指标
    const metrics = {
      energyEfficiency: 85.2,
      costEfficiency: 78.5,
      carbonIntensity: 0.45,
      renewableRatio: 65.8,
      peakDemandReduction: 12.3,
      loadFactor: 0.72,
      powerQuality: 98.5,
      systemReliability: 99.2
    };
    setPerformanceMetrics(metrics);
  };

  const loadAnomalyDetection = async () => {
    // 模拟异常检测数据
    const anomalies = [
      {
        id: 1,
        timestamp: '2024-12-27 14:30:00',
        type: 'consumption_spike',
        severity: 'high',
        description: 'A栋用电量异常增高，超出正常范围35%',
        affectedDevices: ['HVAC-A1', 'HVAC-A2'],
        status: 'investigating'
      },
      {
        id: 2,
        timestamp: '2024-12-27 09:15:00',
        type: 'efficiency_drop',
        severity: 'medium',
        description: '太阳能发电效率下降，可能需要清洁面板',
        affectedDevices: ['SOLAR-B1'],
        status: 'resolved'
      },
      {
        id: 3,
        timestamp: '2024-12-26 22:45:00',
        type: 'power_quality',
        severity: 'low',
        description: '电压波动超出正常范围',
        affectedDevices: ['GRID-MAIN'],
        status: 'monitoring'
      }
    ];
    setAnomalyDetection(anomalies);
  };

  const loadCostAnalysis = async () => {
    // 模拟成本分析数据
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2024, i, 1).toLocaleDateString('zh-CN', { month: 'short' });
      return {
        month,
        energyCost: 8000 + Math.random() * 2000,
        demandCost: 2000 + Math.random() * 500,
        maintenanceCost: 1000 + Math.random() * 300,
        savings: 500 + Math.random() * 200
      };
    });
    setCostAnalysis(months);
  };

  const loadEfficiencyTrends = async () => {
    // 模拟效率趋势数据
    const weeks = Array.from({ length: 12 }, (_, i) => {
      return {
        week: `第${i + 1}周`,
        overallEfficiency: 80 + Math.random() * 10,
        hvacEfficiency: 75 + Math.random() * 15,
        lightingEfficiency: 85 + Math.random() * 10,
        renewableEfficiency: 70 + Math.random() * 20
      };
    });
    setEfficiencyTrends(weeks);
  };

  const loadBenchmarkData = async () => {
    // 模拟基准对比数据
    const benchmark = [
      {
        metric: '能源强度 (kWh/m²)',
        current: 125.5,
        industry: 145.2,
        best: 98.3,
        target: 110.0
      },
      {
        metric: '碳强度 (kg CO₂/kWh)',
        current: 0.45,
        industry: 0.52,
        best: 0.28,
        target: 0.35
      },
      {
        metric: '可再生能源比例 (%)',
        current: 65.8,
        industry: 45.2,
        best: 85.6,
        target: 75.0
      },
      {
        metric: '运营成本 (元/kWh)',
        current: 0.68,
        industry: 0.75,
        best: 0.52,
        target: 0.60
      }
    ];
    setBenchmarkData(benchmark);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return <TrendingUp color="success" />;
      case 'medium': return <TrendingUp color="warning" />;
      case 'low': return <TrendingUp color="info" />;
      default: return <TrendingUp />;
    }
  };

  const renderPredictiveAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              能耗预测模型
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={predictionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stackId="1"
                  stroke="none"
                  fill="#e3f2fd"
                  name="预测区间"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stackId="1"
                  stroke="none"
                  fill="#ffffff"
                />
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#1976d2"
                  strokeWidth={2}
                  name="历史数据"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#ff9800"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="预测数据"
                  connectNulls={false}
                />
                <ReferenceLine x="12月15日" stroke="red" strokeDasharray="2 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              相关性分析
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={correlationData}>
                <CartesianGrid />
                <XAxis dataKey="temperature" name="温度" unit="°C" />
                <YAxis dataKey="consumption" name="能耗" unit="kWh" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="温度-能耗关系" data={correlationData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              预测准确性
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                短期预测准确率 (24小时)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={92.5} 
                sx={{ height: 8, borderRadius: 4, mt: 1, mb: 2 }}
              />
              <Typography variant="h6" color="success.main">
                92.5%
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                中期预测准确率 (7天)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={87.3} 
                sx={{ height: 8, borderRadius: 4, mt: 1, mb: 2 }}
              />
              <Typography variant="h6" color="warning.main">
                87.3%
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                长期预测准确率 (30天)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={78.9} 
                sx={{ height: 8, borderRadius: 4, mt: 1, mb: 2 }}
              />
              <Typography variant="h6" color="info.main">
                78.9%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderOptimizationInsights = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              优化建议
            </Typography>
            {optimizationSuggestions.map((suggestion) => (
              <Accordion key={suggestion.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {getImpactIcon(suggestion.impact)}
                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                      <Typography variant="subtitle1">
                        {suggestion.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={suggestion.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`节省 ¥${suggestion.savings}`} 
                          size="small" 
                          color="success"
                        />
                        <Chip 
                          label={suggestion.implementation === 'easy' ? '易实施' : suggestion.implementation === 'medium' ? '中等难度' : '复杂'} 
                          size="small" 
                          color={suggestion.implementation === 'easy' ? 'success' : suggestion.implementation === 'medium' ? 'warning' : 'error'}
                        />
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="textSecondary">
                    {suggestion.description}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small">
                      实施建议
                    </Button>
                    <Button variant="outlined" size="small">
                      查看详情
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              性能指标
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="primary">
                    {performanceMetrics.energyEfficiency?.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    能源效率
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="success.main">
                    {performanceMetrics.renewableRatio?.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    可再生能源比例
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="warning.main">
                    {performanceMetrics.carbonIntensity?.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    碳强度 (t/MWh)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="info.main">
                    {performanceMetrics.systemReliability?.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    系统可靠性
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              异常检测
            </Typography>
            <List>
              {anomalyDetection.map((anomaly) => (
                <ListItem key={anomaly.id}>
                  <ListItemIcon>
                    <Warning color={getSeverityColor(anomaly.severity)} />
                  </ListItemIcon>
                  <ListItemText
                    primary={anomaly.description}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {anomaly.timestamp}
                        </Typography>
                        <Chip 
                          label={anomaly.status} 
                          size="small" 
                          color={anomaly.status === 'resolved' ? 'success' : 'warning'}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderBenchmarkComparison = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              行业基准对比
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>指标</TableCell>
                    <TableCell>当前值</TableCell>
                    <TableCell>行业平均</TableCell>
                    <TableCell>行业最佳</TableCell>
                    <TableCell>目标值</TableCell>
                    <TableCell>表现</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {benchmarkData.map((item, index) => {
                    const performance = item.current < item.industry ? 'better' : 'worse';
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.metric}</TableCell>
                        <TableCell>
                          <Typography 
                            color={performance === 'better' ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {item.current}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.industry}</TableCell>
                        <TableCell>{item.best}</TableCell>
                        <TableCell>{item.target}</TableCell>
                        <TableCell>
                          <Chip 
                            icon={performance === 'better' ? <CheckCircle /> : <Warning />}
                            label={performance === 'better' ? '优于平均' : '低于平均'}
                            color={performance === 'better' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              效率趋势分析
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={efficiencyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[60, 100]} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="overallEfficiency" 
                  stroke="#1976d2" 
                  strokeWidth={3}
                  name="总体效率"
                />
                <Line 
                  type="monotone" 
                  dataKey="hvacEfficiency" 
                  stroke="#ff9800" 
                  strokeWidth={2}
                  name="HVAC效率"
                />
                <Line 
                  type="monotone" 
                  dataKey="lightingEfficiency" 
                  stroke="#4caf50" 
                  strokeWidth={2}
                  name="照明效率"
                />
                <Line 
                  type="monotone" 
                  dataKey="renewableEfficiency" 
                  stroke="#9c27b0" 
                  strokeWidth={2}
                  name="可再生能源效率"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          数据分析
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>分析类型</InputLabel>
            <Select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
            >
              <MenuItem value="consumption">能耗分析</MenuItem>
              <MenuItem value="efficiency">效率分析</MenuItem>
              <MenuItem value="cost">成本分析</MenuItem>
              <MenuItem value="carbon">碳排放分析</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>时间范围</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">7天</MenuItem>
              <MenuItem value="30d">30天</MenuItem>
              <MenuItem value="90d">90天</MenuItem>
              <MenuItem value="1y">1年</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadAnalyticsData}
          >
            刷新
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            导出报告
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<Psychology />} label="预测分析" />
          <Tab icon={<Insights />} label="优化洞察" />
          <Tab icon={<CompareArrows />} label="基准对比" />
        </Tabs>
      </Paper>

      {tabValue === 0 && renderPredictiveAnalysis()}
      {tabValue === 1 && renderOptimizationInsights()}
      {tabValue === 2 && renderBenchmarkComparison()}
    </Box>
  );
};

export default DataAnalytics;