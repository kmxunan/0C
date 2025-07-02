/**
 * 系统报告组件
 * 提供能源报告、碳排放报告、设备报告等功能
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
  TextField,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Assessment,
  Download,
  Print,
  Email,
  Schedule,
  Visibility,
  Edit,
  Delete,
  Add,
  FilterList,
  Search,
  ExpandMore,
  Description,
  PictureAsPdf,
  TableChart,
  InsertChart,
  Settings,
  Share,
  Refresh
} from '@mui/icons-material';
// 日期选择器相关导入已移除，使用标准输入框代替

const SystemReports = () => {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [filters, setFilters] = useState({
    reportType: 'all',
    dateRange: '30d',
    status: 'all',
    startDate: null,
    endDate: null
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'energy',
    template: '',
    format: 'pdf',
    schedule: 'manual',
    recipients: ''
  });

  useEffect(() => {
    loadReportsData();
  }, [filters]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadReports(),
        loadTemplates(),
        loadSchedules()
      ]);
    } catch (error) {
      console.error('加载报告数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    // 模拟报告数据
    const reportsData = [
      {
        id: 1,
        name: '月度能源消耗报告',
        type: 'energy',
        status: 'completed',
        createdAt: '2024-01-15',
        size: '2.5MB',
        format: 'pdf',
        author: '系统管理员',
        downloads: 25,
        description: '包含本月所有设备的能源消耗统计和分析'
      },
      {
        id: 2,
        name: '碳排放年度报告',
        type: 'carbon',
        status: 'generating',
        createdAt: '2024-01-14',
        size: '4.2MB',
        format: 'pdf',
        author: '环保专员',
        downloads: 12,
        description: '年度碳排放数据汇总及减排措施效果分析'
      },
      {
        id: 3,
        name: '设备运行状态报告',
        type: 'device',
        status: 'completed',
        createdAt: '2024-01-13',
        size: '1.8MB',
        format: 'excel',
        author: '运维工程师',
        downloads: 18,
        description: '设备健康状态、故障统计和维护建议'
      },
      {
        id: 4,
        name: '能效分析报告',
        type: 'efficiency',
        status: 'scheduled',
        createdAt: '2024-01-12',
        size: '3.1MB',
        format: 'pdf',
        author: '能源分析师',
        downloads: 8,
        description: '能源利用效率分析和优化建议'
      },
      {
        id: 5,
        name: '成本分析报告',
        type: 'cost',
        status: 'failed',
        createdAt: '2024-01-11',
        size: '0MB',
        format: 'pdf',
        author: '财务分析师',
        downloads: 0,
        description: '能源成本分析和预算建议'
      }
    ];
    setReports(reportsData);
  };

  const loadTemplates = async () => {
    // 模拟报告模板数据
    const templatesData = [
      {
        id: 1,
        name: '标准能源报告模板',
        type: 'energy',
        description: '包含能源消耗、成本分析、趋势预测等标准内容',
        sections: ['概述', '消耗统计', '成本分析', '趋势分析', '建议'],
        lastModified: '2024-01-10',
        usage: 45
      },
      {
        id: 2,
        name: '碳排放合规报告模板',
        type: 'carbon',
        description: '符合国家标准的碳排放报告格式',
        sections: ['排放概述', '数据统计', '核查结果', '减排措施', '合规声明'],
        lastModified: '2024-01-08',
        usage: 23
      },
      {
        id: 3,
        name: '设备维护报告模板',
        type: 'device',
        description: '设备运行状态和维护记录报告',
        sections: ['设备清单', '运行状态', '故障记录', '维护计划', '建议'],
        lastModified: '2024-01-05',
        usage: 31
      }
    ];
    setTemplates(templatesData);
  };

  const loadSchedules = async () => {
    // 模拟定时报告数据
    const schedulesData = [
      {
        id: 1,
        name: '每日能源监控报告',
        type: 'energy',
        frequency: 'daily',
        time: '08:00',
        recipients: ['admin@company.com', 'energy@company.com'],
        status: 'active',
        lastRun: '2024-01-15 08:00',
        nextRun: '2024-01-16 08:00'
      },
      {
        id: 2,
        name: '周度碳排放报告',
        type: 'carbon',
        frequency: 'weekly',
        time: '09:00',
        recipients: ['env@company.com'],
        status: 'active',
        lastRun: '2024-01-14 09:00',
        nextRun: '2024-01-21 09:00'
      },
      {
        id: 3,
        name: '月度综合报告',
        type: 'comprehensive',
        frequency: 'monthly',
        time: '10:00',
        recipients: ['manager@company.com', 'board@company.com'],
        status: 'paused',
        lastRun: '2024-01-01 10:00',
        nextRun: '2024-02-01 10:00'
      }
    ];
    setSchedules(schedulesData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'success';
      case 'generating':
      case 'scheduled':
        return 'warning';
      case 'failed':
      case 'paused':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'generating':
        return '生成中';
      case 'scheduled':
        return '已计划';
      case 'failed':
        return '失败';
      case 'active':
        return '活跃';
      case 'paused':
        return '暂停';
      default:
        return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'energy':
        return '能源报告';
      case 'carbon':
        return '碳排放报告';
      case 'device':
        return '设备报告';
      case 'efficiency':
        return '能效报告';
      case 'cost':
        return '成本报告';
      case 'comprehensive':
        return '综合报告';
      default:
        return type;
    }
  };

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'daily':
        return '每日';
      case 'weekly':
        return '每周';
      case 'monthly':
        return '每月';
      case 'quarterly':
        return '每季度';
      case 'yearly':
        return '每年';
      default:
        return frequency;
    }
  };

  const handleCreateReport = () => {
    // 创建新报告的逻辑
    console.log('创建报告:', newReport);
    setCreateDialogOpen(false);
    setNewReport({
      name: '',
      type: 'energy',
      template: '',
      format: 'pdf',
      schedule: 'manual',
      recipients: ''
    });
  };

  const handleDownloadReport = (reportId) => {
    // 下载报告的逻辑
    console.log('下载报告:', reportId);
  };

  const handlePreviewReport = (reportId) => {
    // 预览报告的逻辑
    console.log('预览报告:', reportId);
  };

  const renderReportsList = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                报告列表
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>报告类型</InputLabel>
                  <Select
                    value={filters.reportType}
                    onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                  >
                    <MenuItem value="all">全部类型</MenuItem>
                    <MenuItem value="energy">能源报告</MenuItem>
                    <MenuItem value="carbon">碳排放报告</MenuItem>
                    <MenuItem value="device">设备报告</MenuItem>
                    <MenuItem value="efficiency">能效报告</MenuItem>
                    <MenuItem value="cost">成本报告</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>状态</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="all">全部状态</MenuItem>
                    <MenuItem value="completed">已完成</MenuItem>
                    <MenuItem value="generating">生成中</MenuItem>
                    <MenuItem value="scheduled">已计划</MenuItem>
                    <MenuItem value="failed">失败</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="开始日期"
                  type="date"
                  value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="结束日期"
                  type="date"
                  value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  创建报告
                </Button>
              </Box>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>报告名称</TableCell>
                    <TableCell>类型</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>创建时间</TableCell>
                    <TableCell>大小</TableCell>
                    <TableCell>下载次数</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {report.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {report.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getTypeText(report.type)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(report.status)}
                          color={getStatusColor(report.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{report.createdAt}</TableCell>
                      <TableCell>{report.size}</TableCell>
                      <TableCell>{report.downloads}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {report.status === 'completed' && (
                            <>
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => handlePreviewReport(report.id)}
                              >
                                预览
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Download />}
                                onClick={() => handleDownloadReport(report.id)}
                              >
                                下载
                              </Button>
                            </>
                          )}
                          {report.status === 'failed' && (
                            <Button
                              size="small"
                              startIcon={<Refresh />}
                              color="warning"
                            >
                              重试
                            </Button>
                          )}
                        </Box>
                      </TableCell>
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

  const renderTemplates = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            报告模板
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            创建模板
          </Button>
        </Box>
      </Grid>
      
      {templates.map((template) => (
        <Grid item xs={12} md={6} lg={4} key={template.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Chip 
                  label={getTypeText(template.type)}
                  size="small"
                  color="primary"
                />
              </Box>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                {template.description}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                包含章节:
              </Typography>
              <List dense>
                {template.sections.map((section, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText 
                      primary={`${index + 1}. ${section}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  使用次数: {template.usage}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<Edit />}>
                    编辑
                  </Button>
                  <Button size="small" startIcon={<Description />}>
                    使用
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderSchedules = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            定时报告
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            创建定时任务
          </Button>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>任务名称</TableCell>
                    <TableCell>类型</TableCell>
                    <TableCell>频率</TableCell>
                    <TableCell>执行时间</TableCell>
                    <TableCell>收件人</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>下次执行</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {schedule.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getTypeText(schedule.type)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{getFrequencyText(schedule.frequency)}</TableCell>
                      <TableCell>{schedule.time}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {schedule.recipients.length} 个收件人
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(schedule.status)}
                          color={getStatusColor(schedule.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{schedule.nextRun}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" startIcon={<Edit />}>
                            编辑
                          </Button>
                          {schedule.status === 'active' ? (
                            <Button size="small" color="warning">
                              暂停
                            </Button>
                          ) : (
                            <Button size="small" color="success">
                              启用
                            </Button>
                          )}
                        </Box>
                      </TableCell>
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
          系统报告
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadReportsData}
          >
            刷新
          </Button>
          <Button
            variant="outlined"
            startIcon={<Settings />}
          >
            设置
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<Assessment />} label="报告列表" />
          <Tab icon={<Description />} label="报告模板" />
          <Tab icon={<Schedule />} label="定时报告" />
        </Tabs>
      </Paper>

      {tabValue === 0 && renderReportsList()}
      {tabValue === 1 && renderTemplates()}
      {tabValue === 2 && renderSchedules()}

      {/* 创建报告对话框 */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>创建新报告</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="报告名称"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>报告类型</InputLabel>
                <Select
                  value={newReport.type}
                  onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                >
                  <MenuItem value="energy">能源报告</MenuItem>
                  <MenuItem value="carbon">碳排放报告</MenuItem>
                  <MenuItem value="device">设备报告</MenuItem>
                  <MenuItem value="efficiency">能效报告</MenuItem>
                  <MenuItem value="cost">成本报告</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>输出格式</InputLabel>
                <Select
                  value={newReport.format}
                  onChange={(e) => setNewReport({ ...newReport, format: e.target.value })}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="word">Word</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>报告模板</InputLabel>
                <Select
                  value={newReport.template}
                  onChange={(e) => setNewReport({ ...newReport, template: e.target.value })}
                >
                  {templates
                    .filter(t => t.type === newReport.type)
                    .map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="收件人邮箱 (多个邮箱用逗号分隔)"
                value={newReport.recipients}
                onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                placeholder="user1@company.com, user2@company.com"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={handleCreateReport}
            variant="contained"
            disabled={!newReport.name || !newReport.template}
          >
            创建报告
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemReports;