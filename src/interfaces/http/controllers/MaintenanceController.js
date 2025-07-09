import BaseController from './BaseController.js';
import MaintenanceRecord from '../../../domain/entities/MaintenanceRecord.js';
import Device from '../../../domain/entities/Device.js';
import logger from '../../../utils/logger.js';
/* eslint-disable no-magic-numbers */

class MaintenanceController extends BaseController {
  /**
   * 获取维护记录列表
   */
  async getMaintenanceRecords(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        deviceId,
        maintenanceType,
        status,
        startDate,
        endDate,
        priority
      } = req.query;

      const filters = {};
      if (deviceId) {filters.deviceId = deviceId;}
      if (maintenanceType) {filters.maintenanceType = maintenanceType;}
      if (status) {filters.status = status;}
      if (priority) {filters.priority = priority;}
      if (startDate || endDate) {
        filters.scheduledDate = {};
        if (startDate) {filters.scheduledDate.$gte = new Date(startDate);}
        if (endDate) {filters.scheduledDate.$lte = new Date(endDate);}
      }

      const offset = (page - 1) * limit;
      const maintenanceRecords = await MaintenanceRecord.findWithPagination(
        filters,
        offset,
        parseInt(limit)
      );
      const total = await MaintenanceRecord.countDocuments(filters);

      return this.success(res, '获取维护记录成功', {
        data: maintenanceRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('获取维护记录错误:', error);
      return this.error(res, '获取维护记录失败', 500);
    }
  }

  /**
   * 获取单个维护记录
   */
  async getMaintenanceRecord(req, res) {
    try {
      const maintenanceRecord = await MaintenanceRecord.findByIdWithDevice(req.params.id);
      if (!maintenanceRecord) {
        return this.error(res, '维护记录不存在', 404);
      }

      return this.success(res, '获取维护记录成功', { maintenanceRecord });
    } catch (error) {
      logger.error('获取维护记录错误:', error);
      return this.error(res, '获取维护记录失败', 500);
    }
  }

  /**
   * 创建维护记录
   */
  async createMaintenanceRecord(req, res) {
    try {
      // 验证设备是否存在
      const device = await Device.findById(req.body.deviceId);
      if (!device) {
        return this.error(res, '设备不存在', 404);
      }

      const maintenanceData = {
        ...req.body,
        createdBy: req.user.userId,
        createdAt: new Date()
      };

      const newMaintenanceRecord = await MaintenanceRecord.create(maintenanceData);

      return this.success(
        res,
        '维护记录创建成功',
        { maintenanceRecord: newMaintenanceRecord },
        201
      );
    } catch (error) {
      logger.error('创建维护记录错误:', error);
      return this.error(res, '创建维护记录失败', 500);
    }
  }

  /**
   * 更新维护记录
   */
  async updateMaintenanceRecord(req, res) {
    try {
      const maintenanceRecord = await MaintenanceRecord.findById(req.params.id);
      if (!maintenanceRecord) {
        return this.error(res, '维护记录不存在', 404);
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.userId,
        updatedAt: new Date()
      };

      const updatedRecord = await maintenanceRecord.update(updateData);

      return this.success(res, '维护记录更新成功', { maintenanceRecord: updatedRecord });
    } catch (error) {
      logger.error('更新维护记录错误:', error);
      return this.error(res, '更新维护记录失败', 500);
    }
  }

  /**
   * 删除维护记录
   */
  async deleteMaintenanceRecord(req, res) {
    try {
      const maintenanceRecord = await MaintenanceRecord.findById(req.params.id);
      if (!maintenanceRecord) {
        return this.error(res, '维护记录不存在', 404);
      }

      await maintenanceRecord.delete();

      return this.success(res, '维护记录删除成功');
    } catch (error) {
      logger.error('删除维护记录错误:', error);
      return this.error(res, '删除维护记录失败', 500);
    }
  }

  /**
   * 获取维护统计数据
   */
  async getMaintenanceStats(req, res) {
    try {
      const { startDate, endDate, deviceId, maintenanceType } = req.query;

      const filters = {};
      if (deviceId) {filters.deviceId = deviceId;}
      if (maintenanceType) {filters.maintenanceType = maintenanceType;}
      if (startDate || endDate) {
        filters.scheduledDate = {};
        if (startDate) {filters.scheduledDate.$gte = new Date(startDate);}
        if (endDate) {filters.scheduledDate.$lte = new Date(endDate);}
      }

      const stats = await MaintenanceRecord.getStatistics(filters);

      return this.success(res, '获取维护统计成功', { stats });
    } catch (error) {
      logger.error('获取维护统计错误:', error);
      return this.error(res, '获取维护统计失败', 500);
    }
  }

  /**
   * 获取维护计划
   */
  async getMaintenanceSchedule(req, res) {
    try {
      const { startDate, endDate, deviceId, status = 'scheduled' } = req.query;

      const filters = { status };
      if (deviceId) {filters.deviceId = deviceId;}
      if (startDate || endDate) {
        filters.scheduledDate = {};
        if (startDate) {filters.scheduledDate.$gte = new Date(startDate);}
        if (endDate) {filters.scheduledDate.$lte = new Date(endDate);}
      }

      const schedule = await MaintenanceRecord.findScheduled(filters);

      return this.success(res, '获取维护计划成功', { schedule });
    } catch (error) {
      logger.error('获取维护计划错误:', error);
      return this.error(res, '获取维护计划失败', 500);
    }
  }

  /**
   * 完成维护任务
   */
  async completeMaintenance(req, res) {
    try {
      const maintenanceRecord = await MaintenanceRecord.findById(req.params.id);
      if (!maintenanceRecord) {
        return this.error(res, '维护记录不存在', 404);
      }

      if (maintenanceRecord.status === 'completed') {
        return this.error(res, '维护任务已完成', 400);
      }

      const completionData = {
        status: 'completed',
        completedDate: new Date(),
        completedBy: req.user.userId,
        notes: req.body.notes || '',
        actualCost: req.body.actualCost,
        actualDuration: req.body.actualDuration,
        updatedAt: new Date()
      };

      const completedRecord = await maintenanceRecord.update(completionData);

      return this.success(res, '维护任务完成', { maintenanceRecord: completedRecord });
    } catch (error) {
      logger.error('完成维护任务错误:', error);
      return this.error(res, '完成维护任务失败', 500);
    }
  }

  /**
   * 获取设备维护历史
   */
  async getDeviceMaintenanceHistory(req, res) {
    try {
      const { deviceId } = req.params;
      const { page = 1, limit = 20, maintenanceType, status } = req.query;

      const filters = { deviceId };
      if (maintenanceType) {filters.maintenanceType = maintenanceType;}
      if (status) {filters.status = status;}

      const offset = (page - 1) * limit;
      const history = await MaintenanceRecord.findWithPagination(filters, offset, parseInt(limit));
      const total = await MaintenanceRecord.countDocuments(filters);

      return this.success(res, '获取设备维护历史成功', {
        data: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('获取设备维护历史错误:', error);
      return this.error(res, '获取设备维护历史失败', 500);
    }
  }

  /**
   * 导出维护记录
   */
  async exportMaintenanceRecords(req, res) {
    try {
      const { startDate, endDate, deviceId, maintenanceType, status } = req.query;

      const filters = {};
      if (deviceId) {filters.deviceId = deviceId;}
      if (maintenanceType) {filters.maintenanceType = maintenanceType;}
      if (status) {filters.status = status;}
      if (startDate || endDate) {
        filters.scheduledDate = {};
        if (startDate) {filters.scheduledDate.$gte = new Date(startDate);}
        if (endDate) {filters.scheduledDate.$lte = new Date(endDate);}
      }

      const csvData = await MaintenanceRecord.exportToCSV(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=maintenance-records.csv');
      res.send(csvData);
    } catch (error) {
      logger.error('导出维护记录错误:', error);
      return this.error(res, '导出维护记录失败', 500);
    }
  }
}

export default new MaintenanceController();
