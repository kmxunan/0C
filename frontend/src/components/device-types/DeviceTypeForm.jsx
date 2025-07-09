import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,

  Chip,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import JsonEditor from '../common/JsonEditor';


// 步骤标签
const steps = ['基本信息', '数据模式定义'];

const DeviceTypeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 如果有id则为编辑模式
  const isEditMode = !!id;

  // 状态管理
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(isEditMode);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    data_schema: '{}'
  });

  // 制造商列表


  // 类别列表
  const [categories] = useState([
    '电力', '环境', '暖通', '照明', '安防', '水资源', '交通', '其他'
  ]);

  // 加载设备类型数据（编辑模式）
  useEffect(() => {

  }, [id, isEditMode]);

  // 处理表单字段变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 处理JSON编辑器变化
  const handleJsonChange = (value) => {
    setFormData(prev => ({ ...prev, data_schema: value }));
  };

  // 验证当前步骤
  const validateStep = () => {
    if (activeStep === 0) {
      // 验证基本信息
      if (!formData.name.trim()) {
        setError('设备类型名称不能为空');
        return false;
      }
      if (!formData.category) {
        setError('请选择设备类别');
        return false;
      }
    } else if (activeStep === 1) {
      // 验证JSON格式
      try {
        JSON.parse(formData.data_schema);
      } catch (e) {
        setError('数据模式格式不正确，请输入有效的JSON');
        return false;
      }
    }
    setError(null);
    return true;
  };

  // 处理步骤变更
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setSaving(true);
      setError(null);

      // 验证JSON
      const dataSchema = JSON.parse(formData.data_schema);

      const payload = {
        ...formData,
        data_schema: dataSchema
      };

      if (isEditMode) {
        // 更新设备类型
        await axios.put(`/api/device-types/${id}`, payload);
      } else {
        // 创建新设备类型
        await axios.post('/api/device-types', payload);
      }

      setSuccess(true);
      // 延迟导航，让用户看到成功提示
      setTimeout(() => {
        navigate('/device-types');
      }, 1500);

    } catch (err) {
      console.error(isEditMode ? '更新设备类型失败' : '创建设备类型失败', err);
      setError(
        err.response?.data?.error?.message || 
        (isEditMode ? '更新设备类型失败' : '创建设备类型失败')
      );
    } finally {
      setSaving(false);
    }
  };

  // 渲染步骤内容
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="设备类型名称"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!error && activeStep === 0}
                helperText={activeStep === 0 && error}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel>设备类别</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="设备类别"
                  onChange={handleChange}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  提示: 设备类型定义了设备的基本属性和数据采集格式，创建后将应用于所有该类型的设备。
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                数据模式定义
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                定义该类型设备采集数据的JSON模式，指定字段名称和数据类型。
                例如: {`{ "temperature": "number", "humidity": "number" }`}
              </Typography>
              <JsonEditor
                value={formData.data_schema}
                onChange={handleJsonChange}
                error={!!error && activeStep === 1}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                <Typography variant="subtitle2" color="text.primary">
                  数据类型说明:
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="string" size="small" />
                  <Chip label="number" size="small" />
                  <Chip label="boolean" size="small" />
                  <Chip label="object" size="small" />
                  <Chip label="array" size="small" />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );
      default:
        return '未知步骤';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/device-types')}
          sx={{ mr: 2 }}
        >
          返回列表
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? '编辑设备类型' : '创建设备类型'}
        </Typography>
      </Box>

      {success ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          {isEditMode ? '设备类型更新成功！' : '设备类型创建成功！'}
          <br />
          正在返回设备类型列表...
        </Alert>
      ) : error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack} disabled={saving}>
              上一步
            </Button>
          )}

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : isEditMode ? '保存修改' : '创建设备类型'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={saving}
            >
              下一步
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DeviceTypeForm;