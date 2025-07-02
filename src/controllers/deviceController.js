import Device from '../models/Device.js';
import StorageDevice from '../models/storageDevice.js';
import { validationResult } from 'express-validator';

/**
 * 获取所有设备
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const getDevices = async (req, res) => {
  try {
    const filters = req.query;
    const devices = await Device.findAll(filters);
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({
      message: '获取设备列表失败',
      error: error.message
    });
  }
};

/**
 * 根据ID获取设备
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findById(id);
    
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    // 如果是储能设备，获取对应的储能参数
    if (device.type === 'energy_storage') {
      const storageParams = await StorageDevice.findByDeviceId(device.id);
      device.storage_params = storageParams;
    }
    
    res.status(200).json(device);
  } catch (error) {
    res.status(500).json({
      message: '获取设备详情失败',
      error: error.message
    });
  }
};

/**
 * 创建新设备
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const createDevice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const device = await Device.create(req.body);
    
    // 如果是储能设备，创建对应的储能参数记录
    if (req.body.type === 'energy_storage') {
      const storageParams = {
        device_id: device.id,
        capacity: req.body.capacity,
        efficiency: req.body.efficiency,
        min_soc: req.body.min_soc,
        max_soc: req.body.max_soc,
        charge_rate: req.body.charge_rate,
        discharge_rate: req.body.discharge_rate,
        battery_type: req.body.battery_type,
        cycle_life: req.body.cycle_life
      };
      await StorageDevice.create(storageParams);
    }
    
    res.status(201).json({
      message: '设备创建成功',
      device
    });
  } catch (error) {
    res.status(500).json({
      message: '创建设备失败',
      error: error.message
    });
  }
};

/**
 * 更新设备信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // 检查设备是否存在
    const existingDevice = await Device.findById(id);
    if (!existingDevice) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    const updatedDevice = await Device.update(id, updates);
    
    // 如果是储能设备，更新对应的储能参数记录
    if (existingDevice.type === 'energy_storage' && updates.storage_params) {
      await StorageDevice.updateByDeviceId(id, updates.storage_params);
    }
    
    res.status(200).json({
      message: '设备更新成功',
      device: updatedDevice
    });
  } catch (error) {
    res.status(500).json({
      message: '更新设备失败',
      error: error.message
    });
  }
};

/**
 * 更新设备状态
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const updateDeviceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: '状态参数不能为空' });
    }
    
    const updatedDevice = await Device.updateStatus(id, status);
    res.status(200).json({
      message: '设备状态更新成功',
      device: updatedDevice
    });
  } catch (error) {
    res.status(500).json({
      message: '更新设备状态失败',
      error: error.message
    });
  }
};

/**
 * 删除设备
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查设备是否存在
    const existingDevice = await Device.findById(id);
    if (!existingDevice) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    // 如果是储能设备，同时删除对应的储能参数记录
    if (existingDevice.type === 'energy_storage') {
      await StorageDevice.deleteByDeviceId(id);
    }
    
    await Device.delete(id);
    res.status(200).json({ message: '设备删除成功' });
  } catch (error) {
    res.status(500).json({
      message: '删除设备失败',
      error: error.message
    });
  }
};

/**
 * 获取储能设备列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const getEnergyStorageDevices = async (req, res) => {
  try {
    const devices = await Device.findAll({
      type: 'energy_storage'
    });
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({
      message: '获取储能设备列表失败',
      error: error.message
    });
  }
};

/**
 * 更新储能设备参数
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const updateStorageDeviceParams = async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity, efficiency, min_soc, max_soc } = req.body;
    
    // 检查设备是否存在
    const existingDevice = await Device.findById(id);
    if (!existingDevice) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    // 检查设备类型是否为储能设备
    if (existingDevice.type !== 'energy_storage') {
      return res.status(400).json({ message: '该设备不是储能设备' });
    }
    
    // 更新储能设备特定参数
    const storageParams = {
      capacity,
      efficiency,
      min_soc,
      max_soc,
      updated_at: new Date().toISOString()
    };
    
    // 这里假设数据库中有一个storage_devices表存储储能设备参数
    await db('storage_devices').where({ device_id: id }).update(storageParams);
    
    // 返回更新后的完整设备信息
    const updatedDevice = await Device.findById(id);
    const deviceParams = await db('storage_devices').where({ device_id: id }).first();
    
    res.status(200).json({
      message: '储能设备参数更新成功',
      device: {
        ...updatedDevice,
        params: deviceParams
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '更新储能设备参数失败',
      error: error.message
    });
  }
};