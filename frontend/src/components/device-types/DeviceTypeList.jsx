import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_BASE_URL } from '../../apiConfig'; // 确保 apiConfig.js 在 src 目录下
import axios from 'axios';

const DeviceTypeList = () => {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- 这是关键的修复 ---
  // 1. 将函数包裹在 useCallback 中以优化性能。
  // 2. 为函数添加 async 关键字，以允许在内部使用 await。
  const fetchDeviceTypes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/device-types`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          // 为了保持功能，我们保留参数，即使它们当前为空
          category: '',
          manufacturer: ''
        }
      });
      setDeviceTypes(response.data.data || []);
      setError(null);
    } catch (err) {
      setError('获取设备类型列表失败');
      console.error("获取设备类型列表失败:", err);
    } finally {
      setLoading(false);
    }
  }, []); // useCallback 的依赖项为空数组，因为函数内容不依赖于组件的 props 或 state

  useEffect(() => {
    fetchDeviceTypes();
  }, [fetchDeviceTypes]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4 }}>
        <Typography variant="h4" component="h1">
          设备类型管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/device-types/new')}
        >
          添加新类型
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>类型名称</TableCell>
              <TableCell>分类</TableCell>
              <TableCell>制造商</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deviceTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.name}</TableCell>
                <TableCell>{type.category}</TableCell>
                <TableCell>{type.manufacturer}</TableCell>
                <TableCell>
                  <Tooltip title="编辑">
                    <IconButton onClick={() => navigate(`/device-types/${type.id}/edit`)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default DeviceTypeList;