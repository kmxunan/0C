import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    // 处理401未授权错误（如token过期）
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 获取设备状态
export const getDeviceHistory = async (deviceId, params) => {
  try {
    const response = await api.get(`/devices/${deviceId}/history`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching device history:', error);
    throw error;
  }
};

export const getDeviceStatus = async (deviceId) => {
  return api.get(`/devices/${deviceId}/status`);
};

// 获取设备列表
export const fetchDevices = async (params = {}) => {
  return api.get('/devices', { params });
};

// 更新设备状态
export const updateDeviceStatus = async (deviceId, status) => {
  return api.patch(`/devices/${deviceId}/status`, { status });
};

// 获取设备详情
export const getDeviceDetails = async (deviceId) => {
  return api.get(`/devices/${deviceId}`);
};

// 创建设备
export const createDevice = async (deviceData) => {
  return api.post('/devices', deviceData);
};

// 更新设备信息
export const updateDevice = async (deviceId, deviceData) => {
  return api.put(`/devices/${deviceId}`, deviceData);
};

// 删除设备
export const deleteDevice = async (deviceId) => {
  return api.delete(`/devices/${deviceId}`);
};

export default api;