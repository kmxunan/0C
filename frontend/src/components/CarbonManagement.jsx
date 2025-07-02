/**
 * 碳排放管理组件
 * 提供碳排放监控、分析、报告和减排建议等功能
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
  AccordionDetails
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
  Co2,
  TrendingUp,
  TrendingDown,
  Nature,
  Factory,
  ElectricBolt,
  LocalFireDepartment,
  Assessment,
  Refresh,
  Download,
  ExpandMore,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';

const CarbonManagement = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedScope, setSelectedScope] = useState('all');
  const [carbonData, setCarbonData] = useState({});
  const [emissionTrends, setEmissionTrends] = useState([]);
  const [emissionSources, setEmissionSources] = useState([]);
  const [reductionTargets, setReductionTargets] = useState([]);
  const [offsetProjects, setOffsetProjects] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState({});

  useEffect(() => {
    loadCarbonData();
  }, [timeRange, selectedScope]);

  const loadCarbonData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCarbonOverview(),
        loadEmissionTrends(),
        loadEmissionSources(),
        loadReductionTargets(),
        loadOffsetProjects(),
        loadComplianceStatus()
      ]);
    } catch (error) {
      console.error('加载碳排放数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCarbonOverview = async () => {
    // 模拟碳排放概览数据
    const overview = {
      totalEmissions: 1250.5,
      monthlyChange: -8.2,
      yearlyTarget: 1000,
      targetProgress: 75.2,
      scope1: 450.2,
      scope2: 680.8,
      scope3: 119.5,
      carbonIntensity: 0.42,
      offsetCredits: 125.3,
      netEmissions: 1125.2
    };
    setCarbonData(overview);
  };

  const loadEmissionTrends = async () => {
    // 模拟排放趋势数据
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2024, i, 1).toLocaleDateString('zh-CN', { month: 'short' });
      const baseEmission = 1200 + Math.sin(i * Math.PI / 6) * 200;
      return {
        month,
        scope1: baseEmission * 0.35 + Math.random() * 50,
        scope2: baseEmission * 0.55 + Math.random() * 80,
        scope3: baseEmission * 0.1 + Math.random() * 20,
        target: 1000,
        offset: 100 + Math.random() * 50
      };
    });
    setEmissionTrends(months);
  };

  const loadEmissionSources = async () => {
    // 模拟排放源数据
    const sources = [
      { name: '电力消耗', value: 680.8, scope: 'Scope 2', color: '#8884d8', percentage: 54.5 },
      { name: '天然气', value: 280.5, scope: 'Scope 1', color: '#82ca9d', percentage: 22.4 },
      { name: '柴油发电', value: 169.7, scope: 'Scope 1', color: '#ffc658', percentage: 13.6 },
      { name: '员工通勤', value: 75.2, scope: 'Scope 3', color: '#ff7300', percentage: 6.0 },
      { name: '商务差旅', value: 44.3, scope: 'Scope 3', color: '#00ff00', percentage: 3.5 }
    ];
    setEmissionSources(sources);
  };

  const loadReductionTargets = async () => {
    // 模拟减排目标数据
    const targets = [
      {
        id: 1,
        title: '2024年减排目标',
        target: 20,
        current: 15.2,
        deadline: '2024-12-31',
        status: 'on-track',
        measures: ['提高能效', '增加可再生能源', '优化运营']
      },
      {
        id: 2,
        title: '2030年碳中和目标',
        target: 80,
        current: 25.8,
        deadline: '2030-12-31',
        status: 'needs-attention',
        measures: ['大规模可再生能源', '碳捕获技术', '碳抵消项目']
      }
    ];
    setReductionTargets(targets);
  };

  const loadOffsetProjects = async () => {
    // 模拟碳抵消项目数据
    const projects = [
      {
        id: 1,
        name: '森林碳汇项目',
        type: '自然碳汇',
        credits: 50.5,
        cost: 25250,
        status: 'active',
        location: '云南省',
        verification: 'VCS'
      },
      {
        id: 2,
        name: '风电CDM项目',
        type: '清洁发展机制',
        credits: 74.8,
        cost: 37400,
        status: 'active',
        location: '内蒙古',
        verification: 'CDM'
      },
      {
        id: 3,
        name: '生物质能项目',
        type: '可再生能源',
        credits: 30.2,
        cost: 15100,
        status: 'pending',
        location: '山东省',
        verification: 'CCER'
      }
    ];
    setOffsetProjects(projects);
  };

  const loadComplianceStatus = async () => {
    // 模拟合规状态数据
    const compliance = {
      nationalETS: {
        status: 'compliant',
        allocation: 1200,
        used: 980,
        remaining: 220,
        deadline: '2024-06-30'
      },
      reporting: {
        status: 'submitted',
        lastReport: '2024-03-15',
        nextDeadline: '2025-03-31',
        completeness: 98.5
      },
      verification: {
        status: 'verified',
        verifier: '第三方认证机构',
        date: '2024-04-20',
        confidence: 'high'
      }
    };
    setComplianceStatus(compliance);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-track':
      case 'compliant':
      case 'active':
      case 'verified':
        return 'success';
      case 'needs-attention':
      case 'pending':
        return 'warning';
      case 'off-track':
      case 'non-compliant':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'on-track':
      case 'compliant':
      case 'active':
      case 'verified':
        return <CheckCircle />;
      case 'needs-attention':
      case 'pending':
        return <Warning />;
      default:
        return <Info />;
    }
  };

  const renderCarbonOverview = () => (
    <Grid container spacing={3}>
      {/* 总排放量卡片 */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Co2 color="error" sx={{ mr: 1 }} />
              <Typography color="textSecondary" variant="h6">
                总排放量
              </Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              {carbonData.totalEmissions?.toFixed(1)} t
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {carbonData.monthlyChange < 0 ? (
                <TrendingDown color="success" sx={{ mr: 0.5 }} />
              ) : (
                <TrendingUp color="error" sx={{ mr: 0.5 }} />
              )}
              <Typography 
                variant="body2" 
                color={carbonData.monthlyChange < 0 ? 'success.main' : 'error.main'}
              >
                {Math.abs(carbonData.monthlyChange)}% 较上月
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 减排进度 */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Nature color="success" sx={{ mr: 1 }} />
              <Typography color="textSecondary" variant="h6">
                减排进度
              </Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {carbonData.targetProgress?.toFixed(1)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={carbonData.targetProgress} 
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              目标: {carbonData.yearlyTarget}t
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 碳强度 */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Factory color="warning" sx={{ mr: 1 }} />
              <Typography color="textSecondary" variant="h6">
                碳强度
              </Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {carbonData.carbonIntensity?.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              t CO₂/MWh
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 净排放量 */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Nature color="info" sx={{ mr: 1 }} />
              <Typography color="textSecondary" variant="h6">
                净排放量
              </Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {carbonData.netEmissions?.toFixed(1)} t
            </Typography>
            <Typography variant="body2" color="textSecondary">
              已抵消: {carbonData.offsetCredits?.toFixed(1)}t
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 排放趋势图 */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              碳排放趋势
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={emissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(1)}t`} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="scope1" 
                  stackId="1" 
                  stroke="#ff7300" 
                  fill="#ff7300" 
                  name="Scope 1"
                />
                <Area 
                  type="monotone" 
                  dataKey="scope2" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Scope 2"
                />
                <Area 
                  type="monotone" 
                  dataKey="scope3" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="Scope 3"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ff0000" 
                  strokeDasharray="5 5" 
                  name="目标值"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      {/* 排放源分布 */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              排放源分布
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={emissionSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {emissionSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)}t`} />
              </PieChart>
            </ResponsiveContainer>
            <List dense>
              {emissionSources.map((source, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        backgroundColor: source.color, 
                        borderRadius: '50%' 
                      }} 
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={source.name}
                    secondary={`${source.value.toFixed(1)}t (${source.scope})`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderReductionTargets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          减排目标与进度
        </Typography>
        {reductionTargets.map((target) => (
          <Accordion key={target.id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {getStatusIcon(target.status)}
                <Box sx={{ ml: 2, flexGrow: 1 }}>
                  <Typography variant="subtitle1">
                    {target.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      进度: {target.current}% / {target.target}%
                    </Typography>
                    <Chip 
                      label={target.status === 'on-track' ? '按计划进行' : '需要关注'}
                      color={getStatusColor(target.status)}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    减排措施:
                  </Typography>
                  <List dense>
                    {target.measures.map((measure, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={measure} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    截止日期: {target.deadline}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(target.current / target.target) * 100} 
                    sx={{ mt: 2, height: 8, borderRadius: 4 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Grid>
    </Grid>
  );

  const renderOffsetProjects = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              碳抵消项目
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>项目名称</TableCell>
                    <TableCell>类型</TableCell>
                    <TableCell>抵消量 (t)</TableCell>
                    <TableCell>成本 (元)</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>认证标准</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {offsetProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {project.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {project.location}
                        </Typography>
                      </TableCell>
                      <TableCell>{project.type}</TableCell>
                      <TableCell>{project.credits.toFixed(1)}</TableCell>
                      <TableCell>¥{project.cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={project.status === 'active' ? '进行中' : '待启动'}
                          color={getStatusColor(project.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{project.verification}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              抵消项目统计
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                总抵消量
              </Typography>
              <Typography variant="h4" color="success.main">
                {offsetProjects.reduce((sum, p) => sum + p.credits, 0).toFixed(1)} t
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                总投资
              </Typography>
              <Typography variant="h4" color="primary.main">
                ¥{offsetProjects.reduce((sum, p) => sum + p.cost, 0).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                平均成本
              </Typography>
              <Typography variant="h4" color="info.main">
                ¥{(offsetProjects.reduce((sum, p) => sum + p.cost, 0) / offsetProjects.reduce((sum, p) => sum + p.credits, 0)).toFixed(0)}/t
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              合规状态
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="全国碳市场"
                  secondary={`配额使用: ${complianceStatus.nationalETS?.used}/${complianceStatus.nationalETS?.allocation}t`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="排放报告"
                  secondary={`最近提交: ${complianceStatus.reporting?.lastReport}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="第三方核查"
                  secondary={`核查日期: ${complianceStatus.verification?.date}`}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          碳排放管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>范围</InputLabel>
            <Select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
            >
              <MenuItem value="all">全部范围</MenuItem>
              <MenuItem value="scope1">Scope 1</MenuItem>
              <MenuItem value="scope2">Scope 2</MenuItem>
              <MenuItem value="scope3">Scope 3</MenuItem>
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
            onClick={loadCarbonData}
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
          <Tab icon={<Assessment />} label="排放概览" />
          <Tab icon={<Nature />} label="减排目标" />
          <Tab icon={<Nature />} label="碳抵消" />
        </Tabs>
      </Paper>

      {tabValue === 0 && renderCarbonOverview()}
      {tabValue === 1 && renderReductionTargets()}
      {tabValue === 2 && renderOffsetProjects()}
    </Box>
  );
};

export default CarbonManagement;