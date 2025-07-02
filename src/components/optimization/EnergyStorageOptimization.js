import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Divider, CircularProgress, Alert } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { getEnergyStorageDevices } from '../../controllers/deviceController.js';
import { generateOptimizationStrategies } from '../../optimization/battery.js';

// 注册Chart.js组件
Chart.register(...registerables);

const EnergyStorageOptimization = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  // 获取储能设备列表
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getEnergyStorageDevices();
        setDevices(data);
        if (data.length > 0) {
          setSelectedDevice(data[0]);
        }
      } catch (err) {
        setError('获取储能设备失败: ' + err.message);
        console.error(err);
      }
    };

    fetchDevices();
  }, []);

  // 当选择设备或时间范围变化时，重新生成优化策略
  useEffect(() => {
    if (selectedDevice) {
      generateStrategies();
    }
  }, [selectedDevice, timeRange]);

  // 生成优化策略
  const generateStrategies = async () => {
    try {
      setLoading(true);
      setError(null);

      // 计算时间范围
      const endTime = new Date();
      const startTime = new Date();
      
      switch (timeRange) {
        case '24h':
          startTime.setHours(endTime.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(endTime.getDate() - 7);
          break;
        case '30d':
          startTime.setMonth(endTime.getMonth() - 1);
          break;
        default:
          startTime.setHours(endTime.getHours() - 24);
      }

      // 获取预测数据（实际应用中应从API获取）
      // 这里使用模拟数据
      const predictions = generateMockSOCData(timeRange);

      // 生成优化策略
      const result = await generateOptimizationStrategies(
        predictions,
        '1h',
        selectedDevice.id,
        startTime.toISOString(),
        endTime.toISOString()
      );

      setStrategies(result);
    } catch (err) {
      setError('生成优化策略失败: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 生成模拟SOC数据
  const generateMockSOCData = (range) => {
    const dataPoints = range === '24h' ? 24 : range === '7d' ? 168 : 720;
    const data = [];
    
    for (let i = 0; i < dataPoints; i++) {
      // 生成0.3-0.7之间的随机SOC值，添加一些波动趋势
      const baseValue = 0.5 + Math.sin(i/12 * Math.PI) * 0.2;
      const noise = (Math.random() - 0.5) * 0.1;
      const value = Math.max(0.2, Math.min(0.8, baseValue + noise));
      data.push(value);
    }
    
    return data;
  };

  // 准备图表数据
  const prepareChartData = () => {
    if (!strategies || strategies.length === 0) return null;

    const timestamps = strategies.map(s => new Date(s.timestamp).toLocaleTimeString());
    const socData = strategies.map((_, index) => generateMockSOCData(timeRange)[index] * 100);
    const prices = strategies.map(s => s.economicImpact ? parseFloat(s.economicImpact.split(':')[1]) : 0);

    return {
      labels: timestamps,
      datasets: [
        {
          label: 'SOC (%)',
          data: socData,
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.1)',
          borderWidth: 2,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: '经济效益 (元)',
          data: prices,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // 图表配置
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'SOC (%)'
        },
        min: 0,
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '经济效益 (元)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // 策略优先级颜色映射
  const getPriorityColor = (priority) => {
    if (priority >= 8) return '#f44336'; // 高优先级 - 红色
    if (priority >= 5) return '#ff9800'; // 中高优先级 - 橙色
    if (priority >= 3) return '#ffeb3b'; // 中优先级 - 黄色
    return '#4caf50'; // 低优先级 - 绿色
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        储能优化策略
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              储能设备选择
            </Typography>
            <select
              value={selectedDevice?.id || ''}
              onChange={(e) => {
                const device = devices.find(d => d.id === e.target.value);
                setSelectedDevice(device);
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.model})
                </option>
              ))}
            </select>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              时间范围
            </Typography>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="24h">24小时</option>
              <option value="7d">7天</option>
              <option value="30d">30天</option>
            </select>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <button
                onClick={generateStrategies}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3f51b5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                生成优化策略
              </button>
            )}
          </Paper>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {strategies.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                储能优化趋势
              </Typography>
              <Box sx={{ height: 400 }}>
                <Line data={prepareChartData()} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                推荐策略列表
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {strategies
                  .filter(s => s.strategy !== 'maintenance')
                  .sort((a, b) => b.priority - a.priority)
                  .map((strategy, index) => (
                    <Card key={index} sx={{ mb: 2, borderLeft: `4px solid ${getPriorityColor(strategy.priority)}` }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={2}>
                            <Typography variant="subtitle2">
                              {new Date(strategy.timestamp).toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 'bold', color: getPriorityColor(strategy.priority) }}
                            >
                              {strategy.strategy === 'charge' && '充电'}
                              {strategy.strategy === 'discharge' && '放电'}
                              {strategy.strategy === 'stop_charge' && '停止充电'}
                              {strategy.strategy === 'stop_discharge' && '停止放电'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2">
                              {strategy.description}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Typography variant="body2">
                              {strategy.economicImpact}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Typography variant="body2">
                              {strategy.carbonImpact || '无碳排放数据'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default EnergyStorageOptimization;