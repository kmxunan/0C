import axios from 'axios';
import { getAuthToken } from './auth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

/**
 * 获取设备状态信息
 * @param {string} deviceId - 设备ID
 * @returns {Promise<Object>} 设备状态数据
 */
export const getDeviceStatus = async (deviceId) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/devices/${deviceId}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取设备状态失败:', error);
    throw error.response?.data || { error: { message: '获取设备状态时发生错误' } };
  }
};

/**
 * 获取设备列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 设备列表数据
 */
export const fetchDevices = async (params = {}) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/devices`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params
    });
    return response.data;
  } catch (error) {
    console.error('获取设备列表失败:', error);
    throw error.response?.data || { error: { message: '获取设备列表时发生错误' } };
  }
};

/**
 * 更新设备状态
 * @param {string} deviceId - 设备ID
 * @param {Object} statusData - 状态数据 { status, remark }
 * @returns {Promise<Object>} 更新结果
 */
export const updateDeviceStatus = async (deviceId, statusData) => {
  try {
    const token = getAuthToken();
    const response = await axios.patch(`${API_BASE_URL}/devices/${deviceId}/status`, statusData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('更新设备状态失败:', error);
    throw error.response?.data || { error: { message: '更新设备状态时发生错误' } };
  }
};

/**
 * 获取设备详情
 * @param {string} deviceId - 设备ID
 * @returns {Promise<Object>} 设备详情数据
 */
export const getDeviceDetails = async (deviceId) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/devices/${deviceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取设备详情失败:', error);
    throw error.response?.data || { error: { message: '获取设备详情时发生错误' } };
  }
};

/**
 * 创建设备
 * @param {Object} deviceData - 设备数据
 * @returns {Promise<Object>} 创建结果
 */
export const createDevice = async (deviceData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_BASE_URL}/devices`, deviceData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('创建设备失败:', error);
    throw error.response?.data || { error: { message: '创建设备时发生错误' } };
  }
};

/**
 * 更新设备信息
 * @param {string} deviceId - 设备ID
 * @param {Object} deviceData - 设备数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateDevice = async (deviceId, deviceData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_BASE_URL}/devices/${deviceId}`, deviceData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('更新设备信息失败:', error);
    throw error.response?.data || { error: { message: '更新设备信息时发生错误' } };
  }
};

/**
 * 删除设备
 * @param {string} deviceId - 设备ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteDevice = async (deviceId) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('删除设备失败:', error);
    throw error.response?.data || { error: { message: '删除设备时发生错误' } };
  }
};