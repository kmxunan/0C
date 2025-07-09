import BaseController from './BaseController.js';
import DigitalTwin from '../../../domain/entities/DigitalTwin.js';
import Device from '../../../domain/entities/Device.js';
import logger from '../../../utils/logger.js';
/* eslint-disable no-magic-numbers */

class DigitalTwinController extends BaseController {
  /**
   * 获取数字孪生列表
   */
  async getDigitalTwins(req, res) {
    try {
      const { page = 1, limit = 20, deviceId, twinType, status, buildingId } = req.query;

      const filters = {};
      if (deviceId) {filters.deviceId = deviceId;}
      if (twinType) {filters.twinType = twinType;}
      if (status) {filters.status = status;}
      if (buildingId) {filters.buildingId = buildingId;}

      const offset = (page - 1) * limit;
      const digitalTwins = await DigitalTwin.findWithPagination(filters, offset, parseInt(limit));
      const total = await DigitalTwin.countDocuments(filters);

      return this.success(res, '获取数字孪生列表成功', {
        data: digitalTwins,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('获取数字孪生列表错误:', error);
      return this.error(res, '获取数字孪生列表失败', 500);
    }
  }

  /**
   * 获取单个数字孪生
   */
  async getDigitalTwin(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findByIdWithDetails(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      return this.success(res, '获取数字孪生成功', { digitalTwin });
    } catch (error) {
      logger.error('获取数字孪生错误:', error);
      return this.error(res, '获取数字孪生失败', 500);
    }
  }

  /**
   * 创建数字孪生
   */
  async createDigitalTwin(req, res) {
    try {
      // 验证关联设备是否存在
      if (req.body.deviceId) {
        const device = await Device.findById(req.body.deviceId);
        if (!device) {
          return this.error(res, '关联设备不存在', 404);
        }
      }

      const digitalTwinData = {
        ...req.body,
        createdBy: req.user.userId,
        createdAt: new Date()
      };

      const newDigitalTwin = await DigitalTwin.create(digitalTwinData);

      return this.success(res, '数字孪生创建成功', { digitalTwin: newDigitalTwin }, 201);
    } catch (error) {
      logger.error('创建数字孪生错误:', error);
      return this.error(res, '创建数字孪生失败', 500);
    }
  }

  /**
   * 更新数字孪生
   */
  async updateDigitalTwin(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findById(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.userId,
        updatedAt: new Date()
      };

      const updatedDigitalTwin = await digitalTwin.update(updateData);

      return this.success(res, '数字孪生更新成功', { digitalTwin: updatedDigitalTwin });
    } catch (error) {
      logger.error('更新数字孪生错误:', error);
      return this.error(res, '更新数字孪生失败', 500);
    }
  }

  /**
   * 删除数字孪生
   */
  async deleteDigitalTwin(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findById(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      await digitalTwin.delete();

      return this.success(res, '数字孪生删除成功');
    } catch (error) {
      logger.error('删除数字孪生错误:', error);
      return this.error(res, '删除数字孪生失败', 500);
    }
  }

  /**
   * 获取数字孪生实时数据
   */
  async getDigitalTwinRealTimeData(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findById(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      const realTimeData = await digitalTwin.getRealTimeData();

      return this.success(res, '获取实时数据成功', { realTimeData });
    } catch (error) {
      logger.error('获取数字孪生实时数据错误:', error);
      return this.error(res, '获取实时数据失败', 500);
    }
  }

  /**
   * 更新数字孪生状态
   */
  async updateDigitalTwinStatus(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findById(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      const { status, statusData } = req.body;
      const updatedDigitalTwin = await digitalTwin.updateStatus(
        status,
        statusData,
        req.user.userId
      );

      return this.success(res, '数字孪生状态更新成功', { digitalTwin: updatedDigitalTwin });
    } catch (error) {
      logger.error('更新数字孪生状态错误:', error);
      return this.error(res, '更新状态失败', 500);
    }
  }

  /**
   * 获取数字孪生模拟数据
   */
  async getDigitalTwinSimulationData(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findById(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      const { startDate, endDate, simulationType, parameters } = req.query;

      const simulationData = await digitalTwin.getSimulationData({
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        simulationType,
        parameters: parameters ? JSON.parse(parameters) : {}
      });

      return this.success(res, '获取模拟数据成功', { simulationData });
    } catch (error) {
      logger.error('获取数字孪生模拟数据错误:', error);
      return this.error(res, '获取模拟数据失败', 500);
    }
  }

  /**
   * 运行数字孪生模拟
   */
  async runDigitalTwinSimulation(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findById(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      const { simulationType, parameters, duration } = req.body;

      const simulationResult = await digitalTwin.runSimulation({
        simulationType,
        parameters,
        duration,
        initiatedBy: req.user.userId
      });

      return this.success(res, '模拟运行成功', { simulationResult });
    } catch (error) {
      logger.error('运行数字孪生模拟错误:', error);
      return this.error(res, '运行模拟失败', 500);
    }
  }

  /**
   * 获取数字孪生统计数据
   */
  async getDigitalTwinStats(req, res) {
    try {
      const { twinType, buildingId, status } = req.query;

      const filters = {};
      if (twinType) {filters.twinType = twinType;}
      if (buildingId) {filters.buildingId = buildingId;}
      if (status) {filters.status = status;}

      const stats = await DigitalTwin.getStatistics(filters);

      return this.success(res, '获取数字孪生统计成功', { stats });
    } catch (error) {
      logger.error('获取数字孪生统计错误:', error);
      return this.error(res, '获取统计数据失败', 500);
    }
  }

  /**
   * 同步数字孪生数据
   */
  async syncDigitalTwinData(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findById(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      const syncResult = await digitalTwin.syncWithRealWorld(req.user.userId);

      return this.success(res, '数据同步成功', { syncResult });
    } catch (error) {
      logger.error('同步数字孪生数据错误:', error);
      return this.error(res, '数据同步失败', 500);
    }
  }

  /**
   * 获取数字孪生性能指标
   */
  async getDigitalTwinPerformance(req, res) {
    try {
      const digitalTwin = await DigitalTwin.findById(req.params.id);
      if (!digitalTwin) {
        return this.error(res, '数字孪生不存在', 404);
      }

      const { startDate, endDate, metrics } = req.query;

      const performance = await digitalTwin.getPerformanceMetrics({
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        metrics: metrics ? metrics.split(',') : []
      });

      return this.success(res, '获取性能指标成功', { performance });
    } catch (error) {
      logger.error('获取数字孪生性能指标错误:', error);
      return this.error(res, '获取性能指标失败', 500);
    }
  }

  /**
   * 导出数字孪生数据
   */
  async exportDigitalTwinData(req, res) {
    try {
      const { twinType, buildingId, status, format = 'csv' } = req.query;

      const filters = {};
      if (twinType) {filters.twinType = twinType;}
      if (buildingId) {filters.buildingId = buildingId;}
      if (status) {filters.status = status;}

      let exportData;
      let contentType;
      let filename;

      if (format === 'json') {
        exportData = await DigitalTwin.exportToJSON(filters);
        contentType = 'application/json';
        filename = 'digital-twins.json';
      } else {
        exportData = await DigitalTwin.exportToCSV(filters);
        contentType = 'text/csv';
        filename = 'digital-twins.csv';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(exportData);
    } catch (error) {
      logger.error('导出数字孪生数据错误:', error);
      return this.error(res, '导出数据失败', 500);
    }
  }
}

export default new DigitalTwinController();
