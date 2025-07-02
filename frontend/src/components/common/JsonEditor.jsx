import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Alert } from '@mui/material';

const JsonEditor = ({ value, onChange, label, error }) => {
  const [textValue, setTextValue] = useState('');
  const [jsonError, setJsonError] = useState('');

  // 将JSON对象转换为格式化字符串
  useEffect(() => {
    if (value) {
      try {
        setTextValue(JSON.stringify(value, null, 2));
        setJsonError('');
      } catch (err) {
        setJsonError('无效的JSON格式');
      }
    } else {
      setTextValue('');
    }
  }, [value]);

  // 验证JSON格式并更新
  const handleTextChange = (e) => {
    const text = e.target.value;
    setTextValue(text);
    setJsonError('');

    try {
      if (text.trim() !== '') {
        const json = JSON.parse(text);
        onChange(json);
      } else {
        onChange(null);
      }
    } catch (err) {
      setJsonError('请输入有效的JSON格式');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {label && <Typography variant="subtitle1" sx={{ mb: 1 }}>{label}</Typography>}
      <TextField
        fullWidth
        multiline
        rows={6}
        variant="outlined"
        value={textValue}
        onChange={handleTextChange}
        error={!!(jsonError || error)}
        helperText={jsonError || error}
        InputProps={{
          placeholder: `{
  "key": "value"
}`
        }}
      />
      {jsonError && (
        <Alert severity="error" sx={{ mt: 1 }}>{jsonError}</Alert>
      )}
    </Box>
  );
};

export default JsonEditor;