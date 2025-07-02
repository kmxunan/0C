/**
 * 能源监控组件
 * 提供实时能源数据监控、历史数据分析、能耗统计等功能
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
  TableRow
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  ElectricBolt,
  TrendingUp,
  TrendingDown,
  Battery3Bar,
  WbSunny,
  Air,
  LocalFireDepartment,
  Water,
  Refresh,
  Download,
  FilterList
} from '@mui/icons-material';

const EnergyMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [realTimeData, setRealTimeData] = useState({});
  const [historicalData, setHistoricalData] = useState([]);
  const [energyDistribution, setEnergyDistribution] = useState([]);
  const [consumptionTrend, setConsumptionTrend] = useState([]);
  const [peakAnalysis, setPeakAnalysis] = useState([]);

  useEffect(() => {
    loadEnergyData();
    const interval = setInterval(loadRealTimeData, 5000); // 每5秒更新实时数据
    return () => clearInterval(interval);
  }, [timeRange, selectedBuilding]);

  const loadEnergyData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRealTimeData(),
        loadHistoricalData(),
        loadEnergyDistribution(),
        loadConsumptionTrend(),
        loadPeakAnalysis()
      ]);
    } catch (error) {
      console.error('加载能源数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    // 模拟实时数据
    const mockRealTimeData = {
      totalConsumption: 1250.5 + Math.random() * 100,
      totalGeneration: 890.2 + Math.random() * 50,
      gridImport: 360.3 + Math.random() * 30,
      batteryLevel: 75 + Math.random() * 10,
      solarGeneration: 450.8 + Math.random() * 40,
      windGeneration: 439.4 + Math.random() * 30,
      hvacConsumption: 680.2 + Math.random() * 50,
      lightingConsumption: 120.5 + Math.random() * 20,
      equipmentConsumption: 449.8 + Math.random() * 40,
      efficiency: 85.2 + Math.random() * 5,
      carbonEmission: 0.45 + Math.random() * 0.1,
      costToday: 1250.30 + Math.random() * 100
    };
    setRealTimeData(mockRealTimeData);
  };

  const loadHistoricalData = async () => {
    // 模拟历史数据
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        consumption: 800 + Math.random() * 400 + Math.sin(i * Math.PI / 12) * 200,
        generation: 300 + Math.random() * 300 + Math.sin((i - 6) * Math.PI / 12) * 250,
        gridImport: Math.max(0, 200 + Math.random() * 200),
        batteryCharge: Math.random() * 100 - 50
      };
    });
    setHistoricalData(hours);
  };

  const loadEnergyDistribution = async () => {
    // 模拟能源分布数据
    const mockDistribution = [
      { name: '暖通空调', value: 45, color: '#8884d8' },
      { name: '照明系统', value: 20, color: '#82ca9d' },
      { name: '办公设备', value: 25, color: '#ffc658' },
      { name: '其他设备', value: 10, color: '#ff7300' }
    ];
    setEnergyDistribution(mockDistribution);
  };

  const loadConsumptionTrend = async () => {
    // 模拟消耗趋势数据
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 29 + i);
      return {
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        consumption: 15000 + Math.random() * 5000,
        generation: 8000 + Math.random() * 4000,
        cost: 1200 + Math.random() * 400
      };
    });
    setConsumptionTrend(days);
  };

  const loadPeakAnalysis = async () => {
    // 模拟峰值分析数据
    const mockPeakData = [
      {
        period: '早高峰 (8:00-10:00)',
        avgConsumption: 1450.5,
        peakConsumption: 1680.2,
        efficiency: 82.3,
        cost: 145.20
      },
      {
        period: '午高峰 (12:00-14:00)',
        avgConsumption: 1320.8,
        peakConsumption: 1520.5,
        efficiency: 85.1,
        cost: 132.10
      },
      {
        period: '晚高峰 (18:00-20:00)',
        avgConsumption: 1580.3,
        peakConsumption: 1820.7,
        efficiency: 79.8,
        cost: 158.05
      }
    ];
    setPeakAnalysis(mockPeakData);
  };

  const formatPower = (power) => {
    if (power >= 1000) {
      return `${(power / 1000).toFixed(1)}kW`;
    }
    return `${power.toFixed(1)}W`;
  };

  const formatEnergy = (energy) => {
    if (energy >= 1000) {
      return `${(energy / 1000).toFixed(1)}kWh`;
    }
    return `${energy.toFixed(1)}Wh`;
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) {
      return <TrendingUp color="error" />;
    } else if (current < previous) {
      return <TrendingDown color="success" />;
    }
    return null;
  };

  const renderRealTimeOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ElectricBolt color="primary" sx={{ mr: 1 }} />
              <Typography color="textSecondary" variant="h6">
                总消耗
              </Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {formatPower(realTimeData.totalConsumption)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              实时功率消耗
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WbSunny color="warning" sx={{ mr: 1 }} />
              <Typography color="textSecondary" variant="h6">
                总发电
              </Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {formatPower(realTimeData.totalGeneration)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              可再生能源发电
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Battery3Bar color="info" sx={{ mr: 1 }} />
              <Typography color="textSecondary" variant="h6">
                储能状态
              </Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {realTimeData.batteryLevel?.toFixed(1)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={realTimeData.batteryLevel} 
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalFireDepartment color="error" sx={{ mr: 1 }} />
              <Typography color="textSecondary" variant="h6">
                碳排放
              </Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              {realTimeData.carbonEmission?.toFixed(2)}t
            </Typography>
            <Typography variant="body2" color="textSecondary">
              今日累计
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 详细实时数据 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              实时能源详情
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    太阳能发电
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {formatPower(realTimeData.solarGeneration)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    风力发电
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {formatPower(realTimeData.windGeneration)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    电网导入
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {formatPower(realTimeData.gridImport)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    暖通空调
                  </Typography>
                  <Typography variant="h6">
                    {formatPower(realTimeData.hvacConsumption)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    照明系统
                  </Typography>
                  <Typography variant="h6">
                    {formatPower(realTimeData.lightingConsumption)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    设备用电
                  </Typography>
                  <Typography variant="h6">
                    {formatPower(realTimeData.equipmentConsumption)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderHistoricalAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              24小时能源趋势
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => formatPower(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="consumption" 
                  stroke="#8884d8" 
                  name="消耗功率"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="generation" 
                  stroke="#82ca9d" 
                  name="发电功率"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="gridImport" 
                  stroke="#ffc658" 
                  name="电网导入"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              能源消耗分布
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={energyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {energyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              30天消耗趋势
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={consumptionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatEnergy(value)} />
                <Area 
                  type="monotone" 
                  dataKey="consumption" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="消耗"
                />
                <Area 
                  type="monotone" 
                  dataKey="generation" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="发电"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPeakAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              用电高峰分析
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>时段</TableCell>
                    <TableCell>平均消耗</TableCell>
                    <TableCell>峰值消耗</TableCell>
                    <TableCell>效率</TableCell>
                    <TableCell>成本</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {peakAnalysis.map((period, index) => (
                    <TableRow key={index}>
                      <TableCell>{period.period}</TableCell>
                      <TableCell>{formatPower(period.avgConsumption)}</TableCell>
                      <TableCell>{formatPower(period.peakConsumption)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${period.efficiency}%`}
                          color={period.efficiency > 80 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>¥{period.cost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          能源监控
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>时间范围</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">1小时</MenuItem>
              <MenuItem value="24h">24小时</MenuItem>
              <MenuItem value="7d">7天</MenuItem>
              <MenuItem value="30d">30天</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>建筑</InputLabel>
            <Select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="building-a">A栋</MenuItem>
              <MenuItem value="building-b">B栋</MenuItem>
              <MenuItem value="building-c">C栋</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadEnergyData}
          >
            刷新
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            导出
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="实时监控" />
          <Tab label="历史分析" />
          <Tab label="峰值分析" />
        </Tabs>
      </Paper>

      {tabValue === 0 && renderRealTimeOverview()}
      {tabValue === 1 && renderHistoricalAnalysis()}
      {tabValue === 2 && renderPeakAnalysis()}
    </Box>
  );
};

export default EnergyMonitoring;