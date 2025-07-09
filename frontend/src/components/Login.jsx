import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // 清除之前的错误状态
      setError('');
      
      // 发送登录请求
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      // 保存token到本地存储
      localStorage.setItem('token', response.data.token);
      
      // 重定向到仪表板
      navigate('/dashboard');
    } catch (err) {
      // 处理登录错误
      setError('登录失败: ' + (err.response?.data?.message || '用户名或密码不正确'));
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          系统登录
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="用户名"
          name="username"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="密码"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <Button
          type="button"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2, py: 1.5 }}
          onClick={handleLogin}
        >
          登录
        </Button>
      </Box>
    </Container>
  );
};

export default Login;