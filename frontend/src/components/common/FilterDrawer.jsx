import React from 'react';
import { Drawer, Box, Typography, Button, Divider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const FilterDrawer = ({ open, onClose, filters, onApplyFilters, filterOptions }) => {
  const [localFilters, setLocalFilters] = React.useState(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  return (
    <Drawer open={open} onClose={onClose} anchor="right" sx={{ width: 300 }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>筛选条件</Typography>
        <Divider sx={{ mb: 2 }} />

        {filterOptions.categories && (
          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <InputLabel>类别</InputLabel>
            <Select
              name="category"
              value={localFilters.category}
              label="类别"
              onChange={handleChange}
            >
              <MenuItem value=""><em>全部</em></MenuItem>
              {filterOptions.categories.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {filterOptions.manufacturers && (
          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <InputLabel>制造商</InputLabel>
            <Select
              name="manufacturer"
              value={localFilters.manufacturer}
              label="制造商"
              onChange={handleChange}
            >
              <MenuItem value=""><em>全部</em></MenuItem>
              {filterOptions.manufacturers.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
          <Button onClick={onClose}>取消</Button>
          <Button variant="contained" onClick={handleApply}>应用筛选</Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default FilterDrawer;