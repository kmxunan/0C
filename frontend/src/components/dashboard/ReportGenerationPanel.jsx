import React, { useState } from 'react';
import { Grid, Paper, Typography, Box, Button, TextField, MenuItem, FormControl, InputLabel, Select, Divider, CircularProgress, Alert, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Download, FileDownload, FilterList, CalendarToday, Assessment, CheckCircle, Warning } from '@mui/icons-material';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from 'date-fns/locale';

const ReportGenerationPanel = () => {
  const theme = useTheme();
  const [reportType, setReportType] = useState('energy');
  const [timeRange, setTimeRange] = useState('daily');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [exportFormat, setExportFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState('all');

  // 报表类型选项
  const reportTypeOptions = [
    { value: 'energy', label: '能源消耗报表' },
    { value: 'carbon', label: '碳排放报表' },
    { value: 'device', label: '设备运行报表' },
    { value: 'alert', label: '告警统计报表' },
    { value: 'summary', label: '综合分析报表' },
  ];

  // 时间范围选项
  const timeRangeOptions = [
    { value: 'daily', label: '日报' },
    { value: 'weekly', label: '周报' },
    { value: 'monthly', label: '月报' },
    { value: 'quarterly', label: '季报' },
    { value: 'yearly', label: '年报' },
    { value: 'custom', label: '自定义' },
  ];

  // 导出格式选项
  const exportFormatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
  ];

  // 处理报表生成
  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 准备请求参数
      const params = {
        type: reportType,
        timeRange: timeRange,
        format: exportFormat,
        deviceId: selectedDevices !== 'all' ? selectedDevices : undefined,
      };

      // 如果是自定义时间范围，添加开始和结束日期
      if (timeRange === 'custom') {
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      }

      // 调用API生成报表
      const response = await axios.post('/api/reports/generate', params, {
        responseType: 'blob', // 重要：设置响应类型为blob
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // 生成文件名
      const reportTypeLabel = reportTypeOptions.find(opt => opt.value === reportType)?.label || reportType;
      const timeRangeLabel = timeRangeOptions.find(opt => opt.value === timeRange)?.label || timeRange;
      const fileName = `${reportTypeLabel}_${timeRangeLabel}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(true);
    } catch (err) {
      console.error('生成报表失败:', err);
      setError('生成报表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>报表生成</Typography>
      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>{error}</Alert>
      )}

      {success && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
          报表生成成功！
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 报表类型选择 */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>报表类型</InputLabel>
            <Select
              value={reportType}
              label="报表类型"
              onChange={(e) => setReportType(e.target.value)}
            >
              {reportTypeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* 时间范围选择 */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>时间范围</InputLabel>
            <Select
              value={timeRange}
              label="时间范围"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRangeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* 导出格式选择 */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>导出格式</InputLabel>
            <Select
              value={exportFormat}
              label="导出格式"
              onChange={(e) => setExportFormat(e.target.value)}
            >
              {exportFormatOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* 设备选择 */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>设备筛选</InputLabel>
            <Select
              value={selectedDevices}
              label="设备筛选"
              onChange={(e) => setSelectedDevices(e.target.value)}
            >
              <MenuItem value="all">所有设备</MenuItem>
              <MenuItem value="building1">1号楼设备</MenuItem>
              <MenuItem value="building2">2号楼设备</MenuItem>
              <MenuItem value="building3">3号楼设备</MenuItem>
              <MenuItem value="hvac">HVAC系统</MenuItem>
              <MenuItem value="lighting">照明系统</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* 自定义日期范围 - 仅在选择自定义时显示 */}
        {timeRange === 'custom' && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
                <DatePicker
                  label="开始日期"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
                <DatePicker
                  label="结束日期"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
          </>
        )}
      </Grid>

      <Box display="flex" justifyContent="center" mt={2}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownload />}
          onClick={handleGenerateReport}
          disabled={loading}
          sx={{ minWidth: 200 }}
        >
          {loading ? '生成中...' : '生成报表'}
        </Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box>
        <Typography variant="subtitle1" gutterBottom>常用报表模板</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{ p: 2, cursor: 'pointer', transition: '0.3s', '&:hover': { boxShadow: 3 } }}
              onClick={() => {
                setReportType('energy');
                setTimeRange('monthly');
                setExportFormat('excel');
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1">月度能源报表</Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                生成月度能源消耗分析报表 (Excel格式)
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{ p: 2, cursor: 'pointer', transition: '0.3s', '&:hover': { boxShadow: 3 } }}
              onClick={() => {
                setReportType('carbon');
                setTimeRange('quarterly');
                setExportFormat('pdf');
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Assessment color="secondary" sx={{ mr: 1 }} />
                <Typography variant="body1">季度碳排放报表</Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                生成季度碳排放分析报表 (PDF格式)
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{ p: 2, cursor: 'pointer', transition: '0.3s', '&:hover': { boxShadow: 3 } }}
              onClick={() => {
                setReportType('alert');
                setTimeRange('weekly');
                setExportFormat('csv');
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Assessment color="error" sx={{ mr: 1 }} />
                <Typography variant="body1">周告警统计报表</Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                生成每周告警统计报表 (CSV格式)
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{ p: 2, cursor: 'pointer', transition: '0.3s', '&:hover': { boxShadow: 3 } }}
              onClick={() => {
                setReportType('summary');
                setTimeRange('yearly');
                setExportFormat('pdf');
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Assessment color="info" sx={{ mr: 1 }} />
                <Typography variant="body1">年度综合分析报表</Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                生成年度综合分析报表 (PDF格式)
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ReportGenerationPanel;