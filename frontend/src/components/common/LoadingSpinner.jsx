import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Html } from '@react-three/drei';

const LoadingSpinner = ({ message = '加载中...', size = 40, position = [0, 0, 0] }) => {
  // 如果在 Three.js Canvas 内部使用，需要用 Html 包装
  if (position) {
    return (
      <Html center position={position}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="200px"
          gap={2}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 2,
            borderRadius: 1,
            color: 'white'
          }}
        >
          <CircularProgress size={size} sx={{ color: 'white' }} />
          <Typography variant="body2" color="white">
            {message}
          </Typography>
        </Box>
      </Html>
    );
  }
  
  // 普通 HTML 使用
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      gap={2}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;