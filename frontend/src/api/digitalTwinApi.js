import axios from 'axios';
import { notification } from 'antd';

// 创建数字孪生API实例
const digitalTwinApi = axios.create({
  baseURL: 'http://localhost:1125/api/digital-twin',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
digitalTwinApi.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
digitalTwinApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.message || '数字孪生服务请求失败';
    notification.error({
      message: 'API错误',
      description: errorMsg
    });
    return Promise.reject(error);
  }
);

// 获取园区3D模型数据
export const getCampusData = async () => {
  return digitalTwinApi.get('/campus');
};

// 获取建筑物详细信息
export const getBuildingDetails = async (buildingId) => {
  return digitalTwinApi.get(`/buildings/${buildingId}`);
};

// 更新设备状态
export const updateDeviceStatus = async (deviceId, status) => {
  return digitalTwinApi.patch(`/devices/${deviceId}/status`, { status });
};

export default {
  getCampusData,
  getBuildingDetails,
  updateDeviceStatus
};