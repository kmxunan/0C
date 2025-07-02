import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, IconButton, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../common/ConfirmDialog';
import FilterDrawer from '../common/FilterDrawer';

const DeviceTypeList = () => {
  const navigate = useNavigate();
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ category: '', manufacturer: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 获取设备类型列表
  const fetchDeviceTypes = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/api/device-types', { params });
      setDeviceTypes(response.data.data);
      setError(null);
    } catch (err) {
      console.error('获取设备类型列表失败:', err);
      setError('获取设备类型失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceTypes();
  }, [filters, searchTerm]);

  // 处理搜索
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 处理筛选变更
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setFilterOpen(false);
  };

  // 导航到创建设备类型页面
  const handleAddType = () => {
    navigate('/device-types/new');
  };

  // 导航到编辑设备类型页面
  const handleEditType = (id) => {
    navigate(`/device-types/${id}/edit`);
  };

  // 打开删除确认对话框
  const handleDeleteClick = (type) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setTypeToDelete(null);
  };

  // 确认删除设备类型
  const handleDeleteConfirm = async () => {
    if (!typeToDelete) return;

    try {
      setDeleteLoading(true);
      await axios.delete(`/api/device-types/${typeToDelete.id}`);
      fetchDeviceTypes(); // 重新获取列表
      handleDeleteClose();
    } catch (err) {
      console.error('删除设备类型失败:', err);
      setError(err.response?.data?.error?.message || '删除设备类型失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">设备类型管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddType}
        >
          添加设备类型
        </Button>
      </Box>

      {/* 搜索和筛选区域 */}
      <Box sx={{ display: 'flex', mb: 3, gap: 2, alignItems: 'center' }}>
        <TextField
          variant="outlined"
          placeholder="搜索设备类型..."
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, maxWidth: 500 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterOpen(true)}
        >
          筛选
        </Button>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 设备类型表格 */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>类别</TableCell>
              <TableCell>制造商</TableCell>
              <TableCell>设备数量</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : deviceTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  没有找到设备类型数据
                </TableCell>
              </TableRow>
            ) : (
              deviceTypes.map((type) => (
                <TableRow key={type.id} hover>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={type.category}
                      size="small"
                      sx={{ backgroundColor: '#e3f2fd', color: '#1565c0' }}
                    />
                  </TableCell>
                  <TableCell>{type.manufacturer || '-'}</TableCell>
                  <TableCell>{type.device_count || 0}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEditType(type.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(type)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 筛选抽屉 */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApplyFilters={handleFilterChange}
        filterOptions={{
          categories: [
            { value: '电力', label: '电力' },
            { value: '环境', label: '环境' },
            { value: '暖通', label: '暖通' },
            { value: '照明', label: '照明' },
            { value: '安防', label: '安防' }
          ],
          manufacturers: [
            { value: '施耐德', label: '施耐德' },
            { value: '西门子', label: '西门子' },
            { value: '霍尼韦尔', label: '霍尼韦尔' },
            { value: 'ABB', label: 'ABB' },
            { value: '其他', label: '其他' }
          ]
        }}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="确认删除"
        content={`确定要删除设备类型 "${typeToDelete?.name || ''}" 吗？此操作不可撤销。`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteClose}
      />

    </Box>
  )
};
export default DeviceTypeList;
