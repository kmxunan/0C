import { validationResult } from 'express-validator';
import BaseController from './BaseController.js';
import Device from '../../../core/entities/Device.js';
import DeviceType from '../../../core/entities/DeviceType.js';
import logger from '../../../shared/utils/logger.js';
/* eslint-disable no-magic-numbers */

/**
 * 设备管理控制器
 * 处理设备相关的业务逻辑
 */
class DeviceController extends BaseController {
  constructor() {
    super();
  }

  /**
   * 获取设备列表
   */
  getDevices = this.asyncHandler(async (req, res) => {
    try {
      const pagination = this.getPaginationParams(req);
      const sorting = this.getSortingParams(req, 'created_at', 'desc');
      const filters = this.getFilterParams(req, ['type', 'status', 'location']);
      const search = this.getSearchParams(req, ['name', 'serial_number', 'model']);
      const dateRange = this.getDateRangeParams(req);

      // 构建查询条件
      const queryConditions = {
        ...filters,
        ...search,
        ...dateRange
      };

      const result = await Device.findWithPagination({
        conditions: queryConditions,
        pagination,
        sorting
      });

      const response = this.formatPaginatedResponse(result, pagination);
      res.success(response);
    } catch (error) {
      logger.error('获取设备列表失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('获取设备列表失败');
    }
  });

  /**
   * 获取单个设备详情
   */
  getDevice = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const device = await Device.findById(id);
      if (!device) {
        return res.notFound('设备不存在');
      }

      // 获取设备类型信息
      if (device.type_id) {
        device.type_info = await DeviceType.findById(device.type_id);
      }

      res.success(device);
    } catch (error) {
      logger.error('获取设备详情失败', {
        error: error.message,
        deviceId: id,
        userId: req.user?.id
      });
      res.internalError('获取设备详情失败');
    }
  });

  /**
   * 创建新设备
   */
  createDevice = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    try {
      const deviceData = {
        ...req.body,
        created_by: req.user.id,
        created_at: new Date().toISOString(),
        status: req.body.status || 'offline'
      };

      // 检查序列号是否已存在
      if (deviceData.serial_number) {
        const existingDevice = await Device.findBySerialNumber(deviceData.serial_number);
        if (existingDevice) {
          return res.conflict('设备序列号已存在');
        }
      }

      // 验证设备类型
      if (deviceData.type_id) {
        const deviceType = await DeviceType.findById(deviceData.type_id);
        if (!deviceType) {
          return res.badRequest('无效的设备类型');
        }
      }

      const newDevice = await Device.create(deviceData);

      this.logOperation(req, 'DEVICE_CREATE', {
        deviceId: newDevice.id,
        deviceName: newDevice.name
      });

      res.success(newDevice, '设备创建成功', 201);
    } catch (error) {
      logger.error('创建设备失败', {
        error: error.message,
        deviceData: req.body,
        userId: req.user?.id
      });
      res.internalError('创建设备失败');
    }
  });

  /**
   * 更新设备信息
   */
  updateDevice = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    const { id } = req.params;

    try {
      const device = await Device.findById(id);
      if (!device) {
        return res.notFound('设备不存在');
      }

      const updateData = {
        ...req.body,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      };

      // 检查序列号冲突（如果更新了序列号）
      if (updateData.serial_number && updateData.serial_number !== device.serial_number) {
        const existingDevice = await Device.findBySerialNumber(updateData.serial_number);
        if (existingDevice && existingDevice.id !== id) {
          return res.conflict('设备序列号已存在');
        }
      }

      // 验证设备类型（如果更新了类型）
      if (updateData.type_id && updateData.type_id !== device.type_id) {
        const deviceType = await DeviceType.findById(updateData.type_id);
        if (!deviceType) {
          return res.badRequest('无效的设备类型');
        }
      }

      const updatedDevice = await Device.update(id, updateData);

      this.logOperation(req, 'DEVICE_UPDATE', {
        deviceId: id,
        deviceName: updatedDevice.name,
        changes: Object.keys(updateData)
      });

      res.success(updatedDevice, '设备更新成功');
    } catch (error) {
      logger.error('更新设备失败', {
        error: error.message,
        deviceId: id,
        updateData: req.body,
        userId: req.user?.id
      });
      res.internalError('更新设备失败');
    }
  });

  /**
   * 删除设备
   */
  deleteDevice = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const device = await Device.findById(id);
      if (!device) {
        return res.notFound('设备不存在');
      }

      // 检查设备是否有关联数据
      const hasRelatedData = await Device.hasRelatedData(id);
      if (hasRelatedData) {
        return res.conflict('设备存在关联数据，无法删除');
      }

      await Device.delete(id);

      this.logOperation(req, 'DEVICE_DELETE', {
        deviceId: id,
        deviceName: device.name
      });

      res.success(null, '设备删除成功');
    } catch (error) {
      logger.error('删除设备失败', {
        error: error.message,
        deviceId: id,
        userId: req.user?.id
      });
      res.internalError('删除设备失败');
    }
  });

  /**
   * 获取设备类型列表
   */
  getDeviceTypes = this.asyncHandler(async (req, res) => {
    try {
      const deviceTypes = await DeviceType.findAll();
      res.success(deviceTypes);
    } catch (error) {
      logger.error('获取设备类型列表失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('获取设备类型列表失败');
    }
  });

  /**
   * 获取设备状态统计
   */
  getDeviceStatusStats = this.asyncHandler(async (req, res) => {
    try {
      const stats = await Device.getStatusStatistics();
      res.success(stats);
    } catch (error) {
      logger.error('获取设备状态统计失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('获取设备状态统计失败');
    }
  });

  /**
   * 获取设备类型统计
   */
  getDeviceTypeStats = this.asyncHandler(async (req, res) => {
    try {
      const stats = await Device.getTypeStatistics();
      res.success(stats);
    } catch (error) {
      logger.error('获取设备类型统计失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('获取设备类型统计失败');
    }
  });

  /**
   * 批量更新设备状态
   */
  batchUpdateStatus = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    const { device_ids, status } = req.body;

    try {
      const updateData = {
        status,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      };

      const result = await Device.batchUpdate(device_ids, updateData);

      this.logOperation(req, 'DEVICE_BATCH_UPDATE', {
        deviceIds: device_ids,
        status,
        affectedCount: result.affectedRows
      });

      res.success(
        {
          affected_count: result.affectedRows,
          status
        },
        '批量更新设备状态成功'
      );
    } catch (error) {
      logger.error('批量更新设备状态失败', {
        error: error.message,
        deviceIds: req.body.device_ids,
        status: req.body.status,
        userId: req.user?.id
      });
      res.internalError('批量更新设备状态失败');
    }
  });

  /**
   * 设备健康检查
   */
  healthCheck = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const device = await Device.findById(id);
      if (!device) {
        return res.notFound('设备不存在');
      }

      // 执行设备健康检查
      const healthStatus = await Device.performHealthCheck(id);

      // 更新设备健康状态
      await Device.update(id, {
        health_status: healthStatus.status,
        last_health_check: new Date().toISOString(),
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      });

      this.logOperation(req, 'DEVICE_HEALTH_CHECK', {
        deviceId: id,
        healthStatus: healthStatus.status
      });

      res.success(healthStatus, '设备健康检查完成');
    } catch (error) {
      logger.error('设备健康检查失败', {
        error: error.message,
        deviceId: id,
        userId: req.user?.id
      });
      res.internalError('设备健康检查失败');
    }
  });

  /**
   * 获取设备历史数据
   */
  getDeviceHistory = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const dateRange = this.getDateRangeParams(req);
    const pagination = this.getPaginationParams(req);

    try {
      const device = await Device.findById(id);
      if (!device) {
        return res.notFound('设备不存在');
      }

      const history = await Device.getHistory(id, {
        ...dateRange,
        ...pagination
      });

      const response = this.formatPaginatedResponse(history, pagination);
      res.success(response);
    } catch (error) {
      logger.error('获取设备历史数据失败', {
        error: error.message,
        deviceId: id,
        userId: req.user?.id
      });
      res.internalError('获取设备历史数据失败');
    }
  });
}

export default new DeviceController();
