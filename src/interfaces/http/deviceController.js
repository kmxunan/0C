import Device from '../../core/entities/Device.js';
import StorageDevice from '../../core/entities/storageDevice.js';
import { validationResult } from 'express-validator';
import db, { dbPromise } from '../../infrastructure/database/index.js';
/* eslint-disable no-magic-numbers */

/**
 * 获取设备列表，支持通过查询参数进行过滤
 * @param {object} req - Express 请求对象
 * @param {object} res - Express 响应对象
 * @param {function} next - Express next 中间件函数
 */
export const getDevices = async (req, res, next) => {
  try {
    const db = await dbPromise;
    // 基础查询语句
    let sql = 'SELECT * FROM devices';
    const params = [];
    const conditions = [];

    // (可选) 这里可以根据 req.query 添加过滤条件
    // 例如: if (req.query.status) { ... }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const devices = await db.raw(sql, params);

    res.status(200).json({
      message: '设备列表获取成功',
      data: devices
    });
  } catch (error) {
    // --- 这是关键的修复 ---
    // 我们不再直接响应，而是调用 next(error)
    // 将错误传递给在 index.js 中注册的全局错误处理器进行记录。
    next(error);
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
export const createDevice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 提取并清洗设备基本信息
    const {
      name,
      type,
      location,
      status,
      manufacturer,
      model,
      serial_number,
      installation_date,
      last_maintenance_date,
      notes,
      energy_storage_params,
      solar_panel_params,
      ev_charger_params
    } = req.body;

    const deviceData = {
      name: String(name).trim(),
      type: String(type).trim(),
      location: String(location).trim(),
      status: String(status).trim(),
      manufacturer: String(manufacturer).trim(),
      model: String(model).trim(),
      serial_number: String(serial_number).trim(),
      installation_date: installation_date ? new Date(installation_date).toISOString() : null,
      last_maintenance_date: last_maintenance_date
        ? new Date(last_maintenance_date).toISOString()
        : null,
      notes: notes ? String(notes).trim() : null
    };

    const device = await Device.create(deviceData);

    // 根据设备类型处理不同的参数
    if (device.type === 'energy_storage' && energy_storage_params) {
      // 验证储能设备参数
      const {
        capacity,
        efficiency,
        min_soc,
        max_soc,
        charge_rate,
        discharge_rate,
        battery_type,
        cycle_life
      } = energy_storage_params;
      if (
        !capacity ||
        !efficiency ||
        !min_soc ||
        !max_soc ||
        !charge_rate ||
        !discharge_rate ||
        !battery_type ||
        !cycle_life
      ) {
        return res.status(400).json({ message: '储能设备参数不完整' });
      }
      const storageParams = {
        device_id: device.id,
        capacity: Number(capacity),
        efficiency: Number(efficiency),
        min_soc: Number(min_soc),
        max_soc: Number(max_soc),
        charge_rate: Number(charge_rate),
        discharge_rate: Number(discharge_rate),
        battery_type: String(battery_type).trim(),
        cycle_life: Number(cycle_life)
      };
      await StorageDevice.create(storageParams);
    } else if (device.type === 'solar_panel' && solar_panel_params) {
      // 验证太阳能板参数
      const {
        peak_power,
        efficiency,
        orientation,
        tilt_angle,
        installation_date: spInstallationDate
      } = solar_panel_params;
      if (!peak_power || !efficiency || !orientation || !tilt_angle || !spInstallationDate) {
        return res.status(400).json({ message: '太阳能板参数不完整' });
      }
      // 假设有一个 SolarPanel 模型
      // await SolarPanel.create({ device_id: device.id, ...solar_panel_params });
      res.status(501).json({ message: '太阳能板参数配置功能待实现' });
      return;
    } else if (device.type === 'ev_charger' && ev_charger_params) {
      // 验证电动汽车充电桩参数
      const { max_power, connector_type, num_ports, charging_standards } = ev_charger_params;
      if (!max_power || !connector_type || !num_ports || !charging_standards) {
        return res.status(400).json({ message: '电动汽车充电桩参数不完整' });
      }
      // 假设有一个 EvCharger 模型
      // await EvCharger.create({ device_id: device.id, ...ev_charger_params });
      res.status(501).json({ message: '电动汽车充电桩参数配置功能待实现' });
      return;
    }

    res.status(200).json({
      message: '设备创建成功',
      device
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新设备信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 检查设备是否存在
    const existingDevice = await Device.findById(id);
    if (!existingDevice) {
      return res.status(404).json({ message: '设备不存在' });
    }

    // 提取并清洗设备基本信息
    const {
      name,
      type,
      location,
      status,
      manufacturer,
      model,
      serial_number,
      installation_date,
      last_maintenance_date,
      notes,
      energy_storage_params,
      solar_panel_params,
      ev_charger_params
    } = req.body;

    const updates = {};
    if (name !== undefined) {
      updates.name = String(name).trim();
    }
    // 如果设备类型发生变化，需要特别处理，可能需要删除旧的参数记录并创建新的
    if (type !== undefined && type !== existingDevice.type) {
      updates.type = String(type).trim();
      // 这里可以添加逻辑来删除旧的特定类型参数记录
      // 例如：if (existingDevice.type === 'energy_storage') { await StorageDevice.deleteByDeviceId(id); }
    } else if (type !== undefined) {
      updates.type = String(type).trim();
    }
    if (location !== undefined) {
      updates.location = String(location).trim();
    }
    if (status !== undefined) {
      updates.status = String(status).trim();
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (manufacturer !== undefined) {
      updates.manufacturer = String(manufacturer).trim();
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (model !== undefined) {
      updates.model = String(model).trim();
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (serial_number !== undefined) {
      updates.serial_number = String(serial_number).trim();
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (installation_date !== undefined) {
      updates.installation_date = installation_date
        ? new Date(installation_date).toISOString()
        : null;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (last_maintenance_date !== undefined) {
      updates.last_maintenance_date = last_maintenance_date
        ? new Date(last_maintenance_date).toISOString()
        : null;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (notes !== undefined) {
      updates.notes = notes ? String(notes).trim() : null;
    }

    const _updatedDevice = await Device.update(id, updates);

    // 根据设备类型处理不同的参数更新
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (existingDevice.type === 'energy_storage' && energy_storage_params) {
      const storageUpdates = {};
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (energy_storage_params.capacity !== undefined) {
        storageUpdates.capacity = Number(energy_storage_params.capacity);
      }
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (energy_storage_params.efficiency !== undefined) {
        storageUpdates.efficiency = Number(energy_storage_params.efficiency);
      }
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (energy_storage_params.min_soc !== undefined) {
        storageUpdates.min_soc = Number(energy_storage_params.min_soc);
      }
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (energy_storage_params.max_soc !== undefined) {
        storageUpdates.max_soc = Number(energy_storage_params.max_soc);
      }
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (energy_storage_params.charge_rate !== undefined) {
        storageUpdates.charge_rate = Number(energy_storage_params.charge_rate);
      }
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (energy_storage_params.discharge_rate !== undefined) {
        storageUpdates.discharge_rate = Number(energy_storage_params.discharge_rate);
      }
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (energy_storage_params.battery_type !== undefined) {
        storageUpdates.battery_type = String(energy_storage_params.battery_type).trim();
      }
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (energy_storage_params.cycle_life !== undefined) {
        storageUpdates.cycle_life = Number(energy_storage_params.cycle_life);
      }

      await StorageDevice.updateByDeviceId(id, storageUpdates);
    } else if (existingDevice.type === 'solar_panel' && solar_panel_params) {
      // 验证太阳能板参数
      const {
        peak_power,
        efficiency,
        orientation,
        tilt_angle,
        installation_date: spInstallationDate
      } = solar_panel_params;
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (!peak_power || !efficiency || !orientation || !tilt_angle || !spInstallationDate) {
        return res.status(400).json({ message: '太阳能板参数不完整' });
      }
      // 假设有一个 SolarPanel 模型
      // await SolarPanel.updateByDeviceId(id, solar_panel_params);
      res.status(501).json({ message: '太阳能板参数配置功能待实现' });
      return;
    } else if (existingDevice.type === 'ev_charger' && ev_charger_params) {
      // 验证电动汽车充电桩参数
      const { max_power, connector_type, num_ports, charging_standards } = ev_charger_params;
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (!max_power || !connector_type || !num_ports || !charging_standards) {
        return res.status(400).json({ message: '电动汽车充电桩参数不完整' });
      }
      // 假设有一个 EvCharger 模型
      // await EvCharger.updateByDeviceId(id, ev_charger_params);
      res.status(501).json({ message: '电动汽车充电桩参数配置功能待实现' });
      return;
    }

    res.status(201).json({
      message: '设备创建成功',
      device: existingDevice
    });
  } catch (error) {
    next(error);
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

    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
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
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (!existingDevice) {
      return res.status(404).json({ message: '设备不存在' });
    }

    // 如果是储能设备，同时删除对应的储能参数记录
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
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
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (!existingDevice) {
      return res.status(404).json({ message: '设备不存在' });
    }

    // 检查设备类型是否为储能设备
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
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
