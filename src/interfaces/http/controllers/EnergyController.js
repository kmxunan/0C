import { validationResult } from 'express-validator';
import BaseController from './BaseController.js';
import EnergyData from '../../../core/entities/EnergyData.js';
import Device from '../../../core/entities/Device.js';
import logger from '../../../shared/utils/logger.js';
/* eslint-disable no-magic-numbers */

/**
 * 能源数据控制器
 * 处理能耗数据相关的业务逻辑
 */
class EnergyController extends BaseController {
  constructor() {
    super();
  }

  /**
   * 获取能耗数据列表
   */
  getEnergyData = this.asyncHandler(async (req, res) => {
    try {
      const pagination = this.getPaginationParams(req);
      const sorting = this.getSortingParams(req, 'timestamp', 'desc');
      const filters = this.getFilterParams(req, ['device_id', 'energy_type']);
      const dateRange = this.getDateRangeParams(req);

      // 构建查询条件
      const queryConditions = {
        ...filters,
        ...dateRange
      };

      const result = await EnergyData.findWithPagination({
        conditions: queryConditions,
        pagination,
        sorting
      });

      const response = this.formatPaginatedResponse(result, pagination);
      res.success(response);
    } catch (error) {
      logger.error('获取能耗数据列表失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('获取能耗数据列表失败');
    }
  });

  /**
   * 获取单个能耗记录
   */
  getEnergyRecord = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const energyRecord = await EnergyData.findById(id);
      if (!energyRecord) {
        return res.notFound('能耗记录不存在');
      }

      // 获取关联设备信息
      if (energyRecord.device_id) {
        energyRecord.device_info = await Device.findById(energyRecord.device_id);
      }

      res.success(energyRecord);
    } catch (error) {
      logger.error('获取能耗记录失败', {
        error: error.message,
        recordId: id,
        userId: req.user?.id
      });
      res.internalError('获取能耗记录失败');
    }
  });

  /**
   * 创建能耗数据记录
   */
  createEnergyData = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    try {
      const energyData = {
        ...req.body,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      };

      // 验证设备是否存在
      if (energyData.device_id) {
        const device = await Device.findById(energyData.device_id);
        if (!device) {
          return res.badRequest('设备不存在');
        }
      }

      // 设置默认时间戳
      if (!energyData.timestamp) {
        energyData.timestamp = new Date().toISOString();
      }

      const newRecord = await EnergyData.create(energyData);

      this.logOperation(req, 'ENERGY_DATA_CREATE', {
        recordId: newRecord.id,
        deviceId: energyData.device_id,
        consumption: energyData.consumption
      });

      res.success(newRecord, '能耗数据创建成功', 201);
    } catch (error) {
      logger.error('创建能耗数据失败', {
        error: error.message,
        energyData: req.body,
        userId: req.user?.id
      });
      res.internalError('创建能耗数据失败');
    }
  });

  /**
   * 批量创建能耗数据记录
   */
  batchCreateEnergyData = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    const { records } = req.body;

    try {
      // 验证所有设备ID
      const deviceIds = [...new Set(records.map((r) => r.device_id).filter(Boolean))];
      if (deviceIds.length > 0) {
        const devices = await Device.findByIds(deviceIds);
        const existingDeviceIds = devices.map((d) => d.id);
        const invalidDeviceIds = deviceIds.filter((id) => !existingDeviceIds.includes(id));

        if (invalidDeviceIds.length > 0) {
          return res.badRequest(`以下设备不存在: ${invalidDeviceIds.join(', ')}`);
        }
      }

      // 处理批量数据
      const processedRecords = records.map((record) => ({
        ...record,
        created_by: req.user.id,
        created_at: new Date().toISOString(),
        timestamp: record.timestamp || new Date().toISOString()
      }));

      const result = await EnergyData.batchCreate(processedRecords);

      this.logOperation(req, 'ENERGY_DATA_BATCH_CREATE', {
        recordCount: processedRecords.length,
        deviceIds
      });

      res.success(
        {
          created_count: result.insertedCount,
          records: result.records
        },
        '批量创建能耗数据成功',
        201
      );
    } catch (error) {
      logger.error('批量创建能耗数据失败', {
        error: error.message,
        recordCount: req.body.records?.length,
        userId: req.user?.id
      });
      res.internalError('批量创建能耗数据失败');
    }
  });

  /**
   * 获取能耗统计数据
   */
  getEnergyStatistics = this.asyncHandler(async (req, res) => {
    try {
      const dateRange = this.getDateRangeParams(req);
      const { device_id, energy_type, group_by = 'day' } = req.query;

      const filters = {
        ...dateRange
      };

      if (device_id) {filters.device_id = device_id;}
      if (energy_type) {filters.energy_type = energy_type;}

      const statistics = await EnergyData.getStatistics({
        filters,
        groupBy: group_by
      });

      res.success(statistics);
    } catch (error) {
      logger.error('获取能耗统计数据失败', {
        error: error.message,
        filters: req.query,
        userId: req.user?.id
      });
      res.internalError('获取能耗统计数据失败');
    }
  });

  /**
   * 获取设备能耗排行
   */
  getDeviceEnergyRanking = this.asyncHandler(async (req, res) => {
    try {
      const dateRange = this.getDateRangeParams(req);
      const { limit = 10, energy_type } = req.query;

      const filters = {
        ...dateRange
      };

      if (energy_type) {filters.energy_type = energy_type;}

      const ranking = await EnergyData.getDeviceRanking({
        filters,
        limit: parseInt(limit)
      });

      res.success(ranking);
    } catch (error) {
      logger.error('获取设备能耗排行失败', {
        error: error.message,
        filters: req.query,
        userId: req.user?.id
      });
      res.internalError('获取设备能耗排行失败');
    }
  });

  /**
   * 获取能耗趋势数据
   */
  getEnergyTrend = this.asyncHandler(async (req, res) => {
    try {
      const dateRange = this.getDateRangeParams(req);
      const { device_id, energy_type, interval = 'hour' } = req.query;

      const filters = {
        ...dateRange
      };

      if (device_id) {filters.device_id = device_id;}
      if (energy_type) {filters.energy_type = energy_type;}

      const trendData = await EnergyData.getTrendData({
        filters,
        interval
      });

      res.success({
        trend: trendData,
        interval,
        time_range: dateRange
      });
    } catch (error) {
      logger.error('获取能耗趋势数据失败', {
        error: error.message,
        filters: req.query,
        userId: req.user?.id
      });
      res.internalError('获取能耗趋势数据失败');
    }
  });

  /**
   * 删除能耗数据记录
   */
  deleteEnergyData = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const energyRecord = await EnergyData.findById(id);
      if (!energyRecord) {
        return res.notFound('能耗记录不存在');
      }

      await EnergyData.delete(id);

      this.logOperation(req, 'ENERGY_DATA_DELETE', {
        recordId: id,
        deviceId: energyRecord.device_id
      });

      res.success(null, '能耗数据删除成功');
    } catch (error) {
      logger.error('删除能耗数据失败', {
        error: error.message,
        recordId: id,
        userId: req.user?.id
      });
      res.internalError('删除能耗数据失败');
    }
  });

  /**
   * 导出能耗数据（CSV格式）
   */
  exportEnergyData = this.asyncHandler(async (req, res) => {
    try {
      const dateRange = this.getDateRangeParams(req);
      const filters = this.getFilterParams(req, ['device_id', 'energy_type']);

      const queryConditions = {
        ...filters,
        ...dateRange
      };

      const data = await EnergyData.exportToCSV(queryConditions);

      this.logOperation(req, 'ENERGY_DATA_EXPORT', {
        filters: queryConditions,
        recordCount: data.recordCount
      });

      res.downloadFile(data.csvContent, `energy_data_${Date.now()}.csv`, 'text/csv');
    } catch (error) {
      logger.error('导出能耗数据失败', {
        error: error.message,
        filters: req.query,
        userId: req.user?.id
      });
      res.internalError('导出能耗数据失败');
    }
  });

  /**
   * 获取能耗预测数据
   */
  getEnergyPrediction = this.asyncHandler(async (req, res) => {
    try {
      const { device_id, prediction_days = 7 } = req.query;

      if (!device_id) {
        return res.badRequest('设备ID是必需的');
      }

      // 验证设备是否存在
      const device = await Device.findById(device_id);
      if (!device) {
        return res.badRequest('设备不存在');
      }

      const prediction = await EnergyData.getPrediction({
        deviceId: device_id,
        predictionDays: parseInt(prediction_days)
      });

      res.success({
        device_id,
        prediction_days: parseInt(prediction_days),
        prediction_data: prediction,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取能耗预测数据失败', {
        error: error.message,
        deviceId: req.query.device_id,
        userId: req.user?.id
      });
      res.internalError('获取能耗预测数据失败');
    }
  });

  /**
   * 获取实时能耗数据
   */
  getRealTimeEnergyData = this.asyncHandler(async (req, res) => {
    try {
      const { device_ids } = req.query;
      const deviceIdArray = device_ids ? device_ids.split(',') : [];

      const realTimeData = await EnergyData.getRealTimeData(deviceIdArray);

      res.success({
        data: realTimeData,
        timestamp: new Date().toISOString(),
        device_count: realTimeData.length
      });
    } catch (error) {
      logger.error('获取实时能耗数据失败', {
        error: error.message,
        deviceIds: req.query.device_ids,
        userId: req.user?.id
      });
      res.internalError('获取实时能耗数据失败');
    }
  });
}

export default new EnergyController();
