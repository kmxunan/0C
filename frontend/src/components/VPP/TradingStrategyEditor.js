/**
 * VPP交易策略编辑器组件
 * 提供IFTTT风格的可视化策略编辑界面
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
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { vppTradingStrategyAPI } from '../../api/vppTradingStrategy';

// 样式化组件
const StyledCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const StrategyCard = styled(Paper)(({ theme, status }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  borderLeft: `4px solid ${
    status === 'active' ? theme.palette.success.main :
    status === 'error' ? theme.palette.error.main :
    status === 'paused' ? theme.palette.warning.main :
    theme.palette.grey[400]
  }`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const RuleBuilder = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  margin: theme.spacing(2, 0),
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  }
}));

const ConditionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText
}));

const ActionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.secondary.light,
  color: theme.palette.secondary.contrastText
}));

const TradingStrategyEditor = () => {
  // 状态管理
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [enums, setEnums] = useState({});
  
  // 对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // 表单状态
  const [strategyForm, setStrategyForm] = useState({
    name: '',
    description: '',
    type: 'rule_based',
    priority: 1,
    config: {},
    riskParameters: {
      max_position_size: 100,
      max_daily_loss: 10000,
      stop_loss_threshold: 0.05
    },
    performanceTargets: {
      target_return: 0.1,
      max_drawdown: 0.05,
      sharpe_ratio: 1.5
    }
  });
  
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    conditions: [],
    actions: [],
    isEnabled: true,
    executionConfig: {
      max_executions_per_hour: 10,
      cooldown_period: 300,
      retry_attempts: 3
    }
  });
  
  const [currentCondition, setCurrentCondition] = useState({
    type: 'price_threshold',
    field: 'price',
    operator: 'greater_than',
    value: '',
    metadata: {}
  });
  
  const [currentAction, setCurrentAction] = useState({
    type: 'submit_bid',
    parameters: {},
    priority: 1,
    timeout: 30000,
    retry_policy: {
      max_attempts: 3,
      backoff_multiplier: 2
    }
  });

  // 加载数据
  const loadStrategies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vppTradingStrategyAPI.getStrategies();
      setStrategies(response.strategies || []);
    } catch (err) {
      setError('加载策略列表失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEnums = useCallback(async () => {
    try {
      const response = await vppTradingStrategyAPI.getEnums();
      setEnums(response.enums || {});
    } catch (err) {
      console.error('加载枚举值失败:', err);
    }
  }, []);

  useEffect(() => {
    loadStrategies();
    loadEnums();
  }, [loadStrategies, loadEnums]);

  // 策略操作
  const handleCreateStrategy = async () => {
    try {
      setLoading(true);
      await vppTradingStrategyAPI.createStrategy(strategyForm);
      setSuccess('策略创建成功');
      setCreateDialogOpen(false);
      setStrategyForm({
        name: '',
        description: '',
        type: 'rule_based',
        priority: 1,
        config: {},
        riskParameters: {
          max_position_size: 100,
          max_daily_loss: 10000,
          stop_loss_threshold: 0.05
        },
        performanceTargets: {
          target_return: 0.1,
          max_drawdown: 0.05,
          sharpe_ratio: 1.5
        }
      });
      await loadStrategies();
    } catch (err) {
      setError('创建策略失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateStrategy = async (strategyId) => {
    try {
      setLoading(true);
      await vppTradingStrategyAPI.activateStrategy(strategyId);
      setSuccess('策略激活成功');
      await loadStrategies();
    } catch (err) {
      setError('激活策略失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateStrategy = async (strategyId) => {
    try {
      setLoading(true);
      await vppTradingStrategyAPI.deactivateStrategy(strategyId);
      setSuccess('策略停用成功');
      await loadStrategies();
    } catch (err) {
      setError('停用策略失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    try {
      if (!selectedStrategy) return;
      
      setLoading(true);
      await vppTradingStrategyAPI.addRuleToStrategy(selectedStrategy.strategy_id, ruleForm);
      setSuccess('规则添加成功');
      setRuleDialogOpen(false);
      setRuleForm({
        name: '',
        description: '',
        conditions: [],
        actions: [],
        isEnabled: true,
        executionConfig: {
          max_executions_per_hour: 10,
          cooldown_period: 300,
          retry_attempts: 3
        }
      });
      // 重新加载策略详情
      const details = await vppTradingStrategyAPI.getStrategyDetails(selectedStrategy.strategy_id);
      setSelectedStrategy({ ...selectedStrategy, rules: details.rules });
    } catch (err) {
      setError('添加规则失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 条件和动作管理
  const addCondition = () => {
    if (currentCondition.type && currentCondition.operator && currentCondition.value) {
      setRuleForm(prev => ({
        ...prev,
        conditions: [...prev.conditions, { ...currentCondition }]
      }));
      setCurrentCondition({
        type: 'price_threshold',
        field: 'price',
        operator: 'greater_than',
        value: '',
        metadata: {}
      });
    }
  };

  const removeCondition = (index) => {
    setRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    if (currentAction.type) {
      setRuleForm(prev => ({
        ...prev,
        actions: [...prev.actions, { ...currentAction }]
      }));
      setCurrentAction({
        type: 'submit_bid',
        parameters: {},
        priority: 1,
        timeout: 30000,
        retry_policy: {
          max_attempts: 3,
          backoff_multiplier: 2
        }
      });
    }
  };

  const removeAction = (index) => {
    setRuleForm(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'paused':
        return <WarningIcon color="warning" />;
      default:
        return <SettingsIcon color="disabled" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'error':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          交易策略编辑器
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          创建策略
        </Button>
      </Box>

      {/* 加载指示器 */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 策略列表 */}
      <Grid container spacing={3}>
        {strategies.map((strategy) => (
          <Grid item xs={12} md={6} lg={4} key={strategy.strategy_id}>
            <StrategyCard status={strategy.status}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {strategy.strategy_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {strategy.description || '无描述'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={strategy.strategy_type}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={strategy.status}
                      size="small"
                      color={getStatusColor(strategy.status)}
                      icon={getStatusIcon(strategy.status)}
                    />
                    <Chip
                      label={`优先级: ${strategy.priority}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="查看详情">
                    <IconButton
                      size="small"
                      onClick={async () => {
                        try {
                          const details = await vppTradingStrategyAPI.getStrategyDetails(strategy.strategy_id);
                          setSelectedStrategy({ ...strategy, ...details });
                          setDetailsDialogOpen(true);
                        } catch (err) {
                          setError('获取策略详情失败: ' + err.message);
                        }
                      }}
                    >
                      <AssessmentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="编辑策略">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedStrategy(strategy);
                        setStrategyForm({
                          name: strategy.strategy_name,
                          description: strategy.description || '',
                          type: strategy.strategy_type,
                          priority: strategy.priority,
                          config: strategy.strategy_config || {},
                          riskParameters: strategy.risk_parameters || {},
                          performanceTargets: strategy.performance_targets || {}
                        });
                        setEditDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="添加规则">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedStrategy(strategy);
                        setRuleDialogOpen(true);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {strategy.is_active ? (
                    <Tooltip title="停用策略">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeactivateStrategy(strategy.strategy_id)}
                      >
                        <StopIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="激活策略">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleActivateStrategy(strategy.strategy_id)}
                      >
                        <PlayIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </StrategyCard>
          </Grid>
        ))}
      </Grid>

      {/* 创建策略对话框 */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>创建新策略</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="策略名称"
                value={strategyForm.name}
                onChange={(e) => setStrategyForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>策略类型</InputLabel>
                <Select
                  value={strategyForm.type}
                  onChange={(e) => setStrategyForm(prev => ({ ...prev, type: e.target.value }))}
                  label="策略类型"
                >
                  {(enums.strategyTypes || []).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="策略描述"
                value={strategyForm.description}
                onChange={(e) => setStrategyForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="优先级"
                type="number"
                value={strategyForm.priority}
                onChange={(e) => setStrategyForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleCreateStrategy}
            variant="contained"
            disabled={!strategyForm.name || loading}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 添加规则对话框 */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>添加交易规则</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="规则名称"
                value={ruleForm.name}
                onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.isEnabled}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, isEnabled: e.target.checked }))}
                  />
                }
                label="启用规则"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="规则描述"
                value={ruleForm.description}
                onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          {/* 条件构建器 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>条件设置 (IF)</Typography>
            <RuleBuilder>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>条件类型</InputLabel>
                    <Select
                      value={currentCondition.type}
                      onChange={(e) => setCurrentCondition(prev => ({ ...prev, type: e.target.value }))}
                      label="条件类型"
                    >
                      {(enums.conditionTypes || []).map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace('_', ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>操作符</InputLabel>
                    <Select
                      value={currentCondition.operator}
                      onChange={(e) => setCurrentCondition(prev => ({ ...prev, operator: e.target.value }))}
                      label="操作符"
                    >
                      {(enums.operators || []).map((op) => (
                        <MenuItem key={op} value={op}>
                          {op.replace('_', ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="字段"
                    value={currentCondition.field}
                    onChange={(e) => setCurrentCondition(prev => ({ ...prev, field: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="值"
                    value={currentCondition.value}
                    onChange={(e) => setCurrentCondition(prev => ({ ...prev, value: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={addCondition}
                    disabled={!currentCondition.type || !currentCondition.operator || !currentCondition.value}
                  >
                    添加
                  </Button>
                </Grid>
              </Grid>
            </RuleBuilder>
            
            {/* 已添加的条件 */}
            {ruleForm.conditions.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>已添加的条件:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {ruleForm.conditions.map((condition, index) => (
                    <ConditionChip
                      key={index}
                      label={`${condition.type} ${condition.operator} ${condition.value}`}
                      onDelete={() => removeCondition(index)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* 动作构建器 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>动作设置 (THEN)</Typography>
            <RuleBuilder>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>动作类型</InputLabel>
                    <Select
                      value={currentAction.type}
                      onChange={(e) => setCurrentAction(prev => ({ ...prev, type: e.target.value }))}
                      label="动作类型"
                    >
                      {(enums.actionTypes || []).map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace('_', ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="优先级"
                    type="number"
                    value={currentAction.priority}
                    onChange={(e) => setCurrentAction(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="超时时间(ms)"
                    type="number"
                    value={currentAction.timeout}
                    onChange={(e) => setCurrentAction(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={addAction}
                    disabled={!currentAction.type}
                  >
                    添加
                  </Button>
                </Grid>
              </Grid>
            </RuleBuilder>
            
            {/* 已添加的动作 */}
            {ruleForm.actions.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>已添加的动作:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {ruleForm.actions.map((action, index) => (
                    <ActionChip
                      key={index}
                      label={`${action.type} (优先级: ${action.priority})`}
                      onDelete={() => removeAction(index)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleAddRule}
            variant="contained"
            disabled={!ruleForm.name || ruleForm.conditions.length === 0 || ruleForm.actions.length === 0 || loading}
          >
            添加规则
          </Button>
        </DialogActions>
      </Dialog>

      {/* 策略详情对话框 */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TimelineIcon />
            策略详情: {selectedStrategy?.strategy_name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStrategy && (
            <Box>
              {/* 基本信息 */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">基本信息</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">策略类型</Typography>
                      <Typography variant="body1">{selectedStrategy.strategy_type}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">状态</Typography>
                      <Chip
                        label={selectedStrategy.status}
                        color={getStatusColor(selectedStrategy.status)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">描述</Typography>
                      <Typography variant="body1">{selectedStrategy.description || '无描述'}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 规则列表 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">交易规则 ({selectedStrategy.rules?.length || 0})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedStrategy.rules && selectedStrategy.rules.length > 0 ? (
                    <List>
                      {selectedStrategy.rules.map((rule, index) => (
                        <ListItem key={rule.rule_id} divider={index < selectedStrategy.rules.length - 1}>
                          <ListItemText
                            primary={rule.rule_name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {rule.description || '无描述'}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip label={`条件: ${rule.conditions?.length || 0}`} size="small" />
                                  <Chip label={`动作: ${rule.actions?.length || 0}`} size="small" />
                                  <Chip
                                    label={rule.is_enabled ? '已启用' : '已禁用'}
                                    color={rule.is_enabled ? 'success' : 'default'}
                                    size="small"
                                  />
                                </Box>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">暂无规则</Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* 统计信息 */}
              {selectedStrategy.statistics && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">执行统计</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">总执行次数</Typography>
                        <Typography variant="h6">{selectedStrategy.statistics.totalExecutions}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">成功率</Typography>
                        <Typography variant="h6" color="success.main">
                          {selectedStrategy.statistics.successRate}%
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">平均执行时间</Typography>
                        <Typography variant="h6">
                          {selectedStrategy.statistics.averageExecutionTime?.toFixed(2)}ms
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">性能评分</Typography>
                        <Typography variant="h6">
                          {selectedStrategy.statistics.averagePerformanceScore?.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>关闭</Button>
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

export default TradingStrategyEditor;