import { validationResult } from 'express-validator';
import BaseController from './BaseController.js';
import CarbonEmission from '../../../core/entities/CarbonEmission.js';
import CarbonFactor from '../../../core/entities/CarbonFactor.js';
import EnergyData from '../../../core/entities/EnergyData.js';
import logger from '../../../shared/utils/logger.js';
import { calculateTotalEmissions } from '../../../core/services/emission.js';
/* eslint-disable no-magic-numbers */

/**
 * 碳排放控制器
 * 处理碳排放相关的业务逻辑
 */
class CarbonController extends BaseController {
  constructor() {
    super();
  }

  /**
   * 获取碳排放数据列表
   */
  getCarbonEmissions = this.asyncHandler(async (req, res) => {
    try {
      const pagination = this.getPaginationParams(req);
      const sorting = this.getSortingParams(req, 'timestamp', 'desc');
      const filters = this.getFilterParams(req, ['device_id', 'emission_source']);
      const dateRange = this.getDateRangeParams(req);

      const queryConditions = {
        ...filters,
        ...dateRange
      };

      const result = await CarbonEmission.findWithPagination({
        conditions: queryConditions,
        pagination,
        sorting
      });

      const response = this.formatPaginatedResponse(result, pagination);
      res.success(response);
    } catch (error) {
      logger.error('获取碳排放数据列表失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('获取碳排放数据列表失败');
    }
  });

  /**
   * 获取单个碳排放记录
   */
  getCarbonEmission = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const carbonRecord = await CarbonEmission.findById(id);
      if (!carbonRecord) {
        return res.notFound('碳排放记录不存在');
      }

      res.success(carbonRecord);
    } catch (error) {
      logger.error('获取碳排放记录失败', {
        error: error.message,
        recordId: id,
        userId: req.user?.id
      });
      res.internalError('获取碳排放记录失败');
    }
  });

  /**
   * 创建碳排放数据记录
   */
  createCarbonEmission = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    try {
      const carbonData = {
        ...req.body,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      };

      // 设置默认时间戳
      if (!carbonData.timestamp) {
        carbonData.timestamp = new Date().toISOString();
      }

      const newRecord = await CarbonEmission.create(carbonData);

      this.logOperation(req, 'CARBON_EMISSION_CREATE', {
        recordId: newRecord.id,
        deviceId: carbonData.device_id,
        emission: carbonData.emission_amount
      });

      res.success(newRecord, '碳排放数据创建成功', 201);
    } catch (error) {
      logger.error('创建碳排放数据失败', {
        error: error.message,
        carbonData: req.body,
        userId: req.user?.id
      });
      res.internalError('创建碳排放数据失败');
    }
  });

  /**
   * 基于能耗数据计算碳排放
   */
  calculateCarbonFromEnergy = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    try {
      const { energy_data_ids, carbon_factor_id } = req.body;

      // 验证碳排放因子
      const carbonFactor = await CarbonFactor.findById(carbon_factor_id);
      if (!carbonFactor) {
        return res.badRequest('碳排放因子不存在');
      }

      // 获取能耗数据
      const energyRecords = await EnergyData.findByIds(energy_data_ids);
      if (energyRecords.length === 0) {
        return res.badRequest('未找到有效的能耗数据');
      }

      // 计算碳排放
      const carbonEmissions = [];
      for (const energyRecord of energyRecords) {
        const emissionAmount = energyRecord.consumption * carbonFactor.factor_value;

        const carbonData = {
          device_id: energyRecord.device_id,
          emission_source: energyRecord.energy_type,
          emission_amount: emissionAmount,
          emission_unit: carbonFactor.unit,
          energy_consumption: energyRecord.consumption,
          carbon_factor_id,
          calculation_method: 'energy_based',
          timestamp: energyRecord.timestamp,
          created_by: req.user.id,
          created_at: new Date().toISOString()
        };

        const newEmission = await CarbonEmission.create(carbonData);
        carbonEmissions.push(newEmission);
      }

      this.logOperation(req, 'CARBON_CALCULATION', {
        energyRecordCount: energyRecords.length,
        carbonFactorId: carbon_factor_id,
        totalEmission: carbonEmissions.reduce((sum, e) => sum + e.emission_amount, 0)
      });

      res.success(
        {
          calculated_emissions: carbonEmissions,
          total_emission: carbonEmissions.reduce((sum, e) => sum + e.emission_amount, 0),
          carbon_factor: carbonFactor
        },
        '碳排放计算成功',
        201
      );
    } catch (error) {
      logger.error('碳排放计算失败', {
        error: error.message,
        requestData: req.body,
        userId: req.user?.id
      });
      res.internalError('碳排放计算失败');
    }
  });

  /**
   * 获取碳排放统计数据
   */
  getCarbonStatistics = this.asyncHandler(async (req, res) => {
    try {
      const dateRange = this.getDateRangeParams(req);
      const { device_id, emission_source, group_by = 'day' } = req.query;

      const filters = {
        ...dateRange
      };

      if (device_id) {filters.device_id = device_id;}
      if (emission_source) {filters.emission_source = emission_source;}

      const statistics = await CarbonEmission.getStatistics({
        filters,
        groupBy: group_by
      });

      res.success(statistics);
    } catch (error) {
      logger.error('获取碳排放统计数据失败', {
        error: error.message,
        filters: req.query,
        userId: req.user?.id
      });
      res.internalError('获取碳排放统计数据失败');
    }
  });

  /**
   * 获取碳排放趋势数据
   */
  getCarbonTrend = this.asyncHandler(async (req, res) => {
    try {
      const { start_time, end_time, interval = 'day' } = req.query;

      if (!start_time || !end_time) {
        return res.badRequest('缺少必要参数: start_time, end_time');
      }

      // 使用现有的碳排放计算服务
      const trendData = calculateTotalEmissions(start_time, end_time, interval);

      this.logOperation(req, 'CARBON_TREND_QUERY', {
        timeRange: { start_time, end_time },
        interval
      });

      res.success({
        trend: trendData,
        unit: 'kgCO2',
        time_range: {
          start: start_time,
          end: end_time
        },
        interval
      });
    } catch (error) {
      logger.error('获取碳排放趋势数据失败', {
        error: error.message,
        timeRange: { start_time: req.query.start_time, end_time: req.query.end_time },
        userId: req.user?.id
      });
      res.internalError('获取碳排放趋势数据失败');
    }
  });

  /**
   * 获取碳排放因子列表
   */
  getCarbonFactors = this.asyncHandler(async (req, res) => {
    try {
      const pagination = this.getPaginationParams(req);
      const filters = this.getFilterParams(req, ['energy_type', 'region']);

      const result = await CarbonFactor.findWithPagination({
        conditions: filters,
        pagination
      });

      const response = this.formatPaginatedResponse(result, pagination);
      res.success(response);
    } catch (error) {
      logger.error('获取碳排放因子列表失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('获取碳排放因子列表失败');
    }
  });

  /**
   * 创建碳排放因子
   */
  createCarbonFactor = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    try {
      const factorData = {
        ...req.body,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      };

      const newFactor = await CarbonFactor.create(factorData);

      this.logOperation(req, 'CARBON_FACTOR_CREATE', {
        factorId: newFactor.id,
        energyType: factorData.energy_type,
        factorValue: factorData.factor_value
      });

      res.success(newFactor, '碳排放因子创建成功', 201);
    } catch (error) {
      logger.error('创建碳排放因子失败', {
        error: error.message,
        factorData: req.body,
        userId: req.user?.id
      });
      res.internalError('创建碳排放因子失败');
    }
  });

  /**
   * 更新碳排放因子
   */
  updateCarbonFactor = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    const { id } = req.params;

    try {
      const factor = await CarbonFactor.findById(id);
      if (!factor) {
        return res.notFound('碳排放因子不存在');
      }

      const updateData = {
        ...req.body,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      };

      const updatedFactor = await CarbonFactor.update(id, updateData);

      this.logOperation(req, 'CARBON_FACTOR_UPDATE', {
        factorId: id,
        changes: Object.keys(updateData)
      });

      res.success(updatedFactor, '碳排放因子更新成功');
    } catch (error) {
      logger.error('更新碳排放因子失败', {
        error: error.message,
        factorId: id,
        updateData: req.body,
        userId: req.user?.id
      });
      res.internalError('更新碳排放因子失败');
    }
  });

  /**
   * 生成碳排放报告
   */
  generateCarbonReport = this.asyncHandler(async (req, res) => {
    try {
      const dateRange = this.getDateRangeParams(req);
      const { report_type = 'summary', device_ids } = req.query;

      const filters = {
        ...dateRange
      };

      if (device_ids) {
        filters.device_id = device_ids.split(',');
      }

      const report = await CarbonEmission.generateReport({
        filters,
        reportType: report_type
      });

      this.logOperation(req, 'CARBON_REPORT_GENERATE', {
        reportType: report_type,
        timeRange: dateRange,
        deviceCount: device_ids ? device_ids.split(',').length : 'all'
      });

      res.success({
        report,
        generated_at: new Date().toISOString(),
        report_type,
        time_range: dateRange
      });
    } catch (error) {
      logger.error('生成碳排放报告失败', {
        error: error.message,
        reportType: req.query.report_type,
        userId: req.user?.id
      });
      res.internalError('生成碳排放报告失败');
    }
  });

  /**
   * 导出碳排放数据
   */
  exportCarbonData = this.asyncHandler(async (req, res) => {
    try {
      const dateRange = this.getDateRangeParams(req);
      const filters = this.getFilterParams(req, ['device_id', 'emission_source']);
      const { format = 'csv' } = req.query;

      const queryConditions = {
        ...filters,
        ...dateRange
      };

      let exportData;
      let contentType;
      let fileExtension;

      switch (format.toLowerCase()) {
        case 'csv':
          exportData = await CarbonEmission.exportToCSV(queryConditions);
          contentType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'json':
          exportData = await CarbonEmission.exportToJSON(queryConditions);
          contentType = 'application/json';
          fileExtension = 'json';
          break;
        default:
          return res.badRequest('不支持的导出格式');
      }

      this.logOperation(req, 'CARBON_DATA_EXPORT', {
        format,
        filters: queryConditions,
        recordCount: exportData.recordCount
      });

      res.downloadFile(
        exportData.content,
        `carbon_emissions_${Date.now()}.${fileExtension}`,
        contentType
      );
    } catch (error) {
      logger.error('导出碳排放数据失败', {
        error: error.message,
        format: req.query.format,
        filters: req.query,
        userId: req.user?.id
      });
      res.internalError('导出碳排放数据失败');
    }
  });

  /**
   * 删除碳排放数据记录
   */
  deleteCarbonEmission = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const carbonRecord = await CarbonEmission.findById(id);
      if (!carbonRecord) {
        return res.notFound('碳排放记录不存在');
      }

      await CarbonEmission.delete(id);

      this.logOperation(req, 'CARBON_EMISSION_DELETE', {
        recordId: id,
        deviceId: carbonRecord.device_id
      });

      res.success(null, '碳排放数据删除成功');
    } catch (error) {
      logger.error('删除碳排放数据失败', {
        error: error.message,
        recordId: id,
        userId: req.user?.id
      });
      res.internalError('删除碳排放数据失败');
    }
  });

  /**
   * 获取碳排放预测
   */
  getCarbonPrediction = this.asyncHandler(async (req, res) => {
    try {
      const { device_id, prediction_days = 7 } = req.query;

      const filters = {};
      if (device_id) {filters.device_id = device_id;}

      const prediction = await CarbonEmission.getPrediction({
        filters,
        predictionDays: parseInt(prediction_days)
      });

      res.success({
        prediction_days: parseInt(prediction_days),
        prediction_data: prediction,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取碳排放预测失败', {
        error: error.message,
        deviceId: req.query.device_id,
        userId: req.user?.id
      });
      res.internalError('获取碳排放预测失败');
    }
  });
}

export default new CarbonController();
