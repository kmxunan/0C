import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Divider, CircularProgress, Alert, Grid, IconButton, Tooltip } from '@mui/material';
import { CheckCircle, Warning, Error, Info, ArrowForward, Refresh, Download, ThumbsUp, ThumbsDown } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

// 推荐类型对应的样式和图标
const recommendationTypes = {
  energy_saving: {
    color: '#4caf50',
    icon: <CheckCircle />,
    label: '节能优化'
  },
  cost_reduction: {
    color: '#2196f3',
    icon: <Info />,
    label: '成本降低'
  },
  comfort_improvement: {
    color: '#ff9800',
    icon: <Warning />,
    label: '舒适度提升'
  },
  maintenance: {
    color: '#f44336',
    icon: <Error />,
    label: '设备维护'
  }
};

const RecommendationList = ({ initialContext = {} }) => {
  const theme = useTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [context, setContext] = useState(initialContext);
  const [activeRecommendation, setActiveRecommendation] = useState(null);

  // 获取推荐列表
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/api/recommendations/generate', {
        context
      });
      setRecommendations(response.data.recommendations);
    } catch (err) {
      console.error('获取推荐失败:', err);
      setError('获取推荐失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 应用推荐
  const applyRecommendation = async (recommendation) => {
    try {
      setLoading(true);
      setError(null);
      // 这里应该调用实际应用推荐的API
      await axios.post(`/api/recommendations/${recommendation.id}/apply`);
      // 更新本地状态
      setRecommendations(recommendations.map(rec => 
        rec.id === recommendation.id ? { ...rec, status: 'applied', applied_at: new Date().toISOString() } : rec
      ));
    } catch (err) {
      console.error('应用推荐失败:', err);
      setError('应用推荐失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 忽略推荐
  const dismissRecommendation = async (recommendationId) => {
    try {
      // 调用API标记推荐为已忽略
      await axios.post(`/api/recommendations/${recommendationId}/dismiss`);
      // 更新本地状态
      setRecommendations(recommendations.filter(rec => rec.id !== recommendationId));
    } catch (err) {
      console.error('忽略推荐失败:', err);
      setError('操作失败，请稍后重试');
    }
  };

  // 导出推荐报告
  const exportRecommendations = async () => {
    try {
      const response = await axios.get('/api/recommendations/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `energy_recommendations_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('导出推荐失败:', err);
      setError('导出报告失败，请稍后重试');
    }
  };

  // 评分推荐
  const rateRecommendation = async (recommendationId, rating) => {
    try {
      await axios.post(`/api/recommendations/${recommendationId}/rate`, { rating });
    } catch (err) {
      console.error('评分失败:', err);
    }
  };

  // 初始加载推荐
  useEffect(() => {
    fetchRecommendations();
  }, []);

  // 根据优先级和状态排序推荐
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    // 优先显示未处理的推荐
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    // 按优先级排序
    return b.priority - a.priority;
  });

  // 获取推荐类型样式
  const getRecommendationTypeConfig = (type) => {
    return recommendationTypes[type] || {
      color: '#9e9e9e',
      icon: <Info />,
      label: '其他'
    };
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          智能能源优化建议
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportRecommendations}
            disabled={loading || recommendations.length === 0}
          >
            导出报告
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchRecommendations}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : '刷新推荐'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {loading && sortedRecommendations.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : sortedRecommendations.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          暂无推荐建议。点击"刷新推荐"按钮生成最新建议。
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {sortedRecommendations.map((recommendation) => {
            const typeConfig = getRecommendationTypeConfig(recommendation.type);
            const isNew = new Date(recommendation.generated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

            return (
              <Grid item xs={12} md={6} lg={4} key={recommendation.id}>
                <Card
                  sx={{
                    height: '100%',
                    borderLeft: `4px solid ${typeConfig.color}`,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: theme.shadows[6]
                    },
                    opacity: recommendation.status === 'applied' ? 0.8 : 1,
                    filter: recommendation.status === 'applied' ? 'grayscale(0.3)' : 'none'
                  }}
                >
                  <CardContent sx={{ position: 'relative' }}>
                    {isNew && (
                      <Chip
                        size="small"
                        label="新"
                        color="primary"
                        sx={{ position: 'absolute', top: 12, right: 12 }}
                      />
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ color: typeConfig.color, mr: 1 }}>{typeConfig.icon}</Box>
                      <Typography variant="subtitle1" component="div" fontWeight="bold">
                        {recommendation.rule_name}
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={typeConfig.label}
                      sx={{ mb: 2, backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                      {recommendation.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        生成时间: {formatDistanceToNow(new Date(recommendation.generated_at), { addSuffix: true, locale: zhCN })}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="有帮助">
                          <IconButton size="small" onClick={() => rateRecommendation(recommendation.id, 1)}>
                            <ThumbsUp fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="无帮助">
                          <IconButton size="small" onClick={() => rateRecommendation(recommendation.id, -1)}>
                            <ThumbsDown fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => dismissRecommendation(recommendation.id)}
                          disabled={loading || recommendation.status === 'applied'}
                        >
                          忽略
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          endIcon={<ArrowForward />}
                          onClick={() => applyRecommendation(recommendation)}
                          disabled={loading || recommendation.status === 'applied'}
                        >
                          {recommendation.status === 'applied' ? '已应用' : '应用'}
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default RecommendationList;