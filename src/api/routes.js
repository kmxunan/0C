import express from 'express';
import devicesRouter from '../../backend/routes/api/devices.js';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database.js';
import { createRequire } from 'module';
import { createCacheMiddleware, clearCacheByPrefix } from '../utils/cache.js';
import CacheMiddleware from '../middleware/cacheMiddleware.js';

const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// 挂载设备路由
router.use('/devices', devicesRouter);

// 导入维护管理器
import MaintenanceManager from '../maintenance/MaintenanceManager.js';
const maintenanceManager = new MaintenanceManager();

// API根路径处理
router.get('/', (req, res) => {
  res.json({
    message: '零碳园区数字孪生能碳管理系统 API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 创建不同TTL的缓存中间件
const veryShortCache = createCacheMiddleware(30 * 1000); // 30秒缓存
const shortCache = createCacheMiddleware(2 * 60 * 1000); // 2分钟缓存
const mediumCache = createCacheMiddleware(5 * 60 * 1000); // 5分钟缓存
const longCache = createCacheMiddleware(15 * 60 * 1000); // 15分钟缓存

/**
 * 用户认证相关路由
 */

// 用户登录
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CREDENTIALS',
          message: '用户名和密码不能为空'
        }
      });
    }

    // 查询用户
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名或密码错误'
        }
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名或密码错误'
        }
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    // 更新最后登录时间
    await updateLastLogin(user.id);

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          email: user.email
        }
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      error: {
        code: 'LOGIN_FAILED',
        message: '登录失败，请稍后重试'
      }
    });
  }
});

// 用户注册（仅管理员可用）
router.post('/auth/register', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, email, full_name, role = 'viewer', department, phone } = req.body;
    
    // 验证必填字段
    if (!username || !password || !email || !full_name) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: '用户名、密码、邮箱和姓名不能为空'
        }
      });
    }

    // 检查用户名是否已存在
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'USERNAME_EXISTS',
          message: '用户名已存在'
        }
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const userId = uuidv4();
    await createUser({
      id: userId,
      username,
      password_hash: passwordHash,
      email,
      full_name,
      role,
      department,
      phone
    });

    res.status(201).json({
      data: {
        id: userId,
        username,
        email,
        full_name,
        role
      }
    });

  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({
      error: {
        code: 'REGISTRATION_FAILED',
        message: '用户注册失败'
      }
    });
  }
});

/**
 * 设备历史数据相关路由
 */
// 获取设备历史数据
router.get('/devices/:deviceId/history', authenticateToken, CacheMiddleware.deviceDataCache(), async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startTime, endTime, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const options = {
      startTime,
      endTime,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const DeviceHistory = require('../models/DeviceHistory');
    const records = await DeviceHistory.findByDeviceId(deviceId, options);
    const totalRecords = await db('device_history').where({ device_id: deviceId }).count('id as count').first();

    res.json({
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalRecords.count),
        pages: Math.ceil(totalRecords.count / limit)
      }
    });
  } catch (error) {
    console.error('获取设备历史数据失败:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_DEVICE_HISTORY_FAILED',
        message: '获取设备历史数据失败'
      }
    });
  }
});

// 获取设备历史数据统计
router.get('/devices/:deviceId/history/stats', authenticateToken, CacheMiddleware.deviceDataCache(), async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { interval = 'hour', startTime, endTime } = req.query;

    const DeviceHistory = require('../models/DeviceHistory');
    const stats = await DeviceHistory.getStatistics(deviceId, interval, startTime, endTime);

    res.json({
      data: stats
    });
  } catch (error) {
    console.error('获取设备历史统计数据失败:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_DEVICE_STATS_FAILED',
        message: '获取设备历史统计数据失败'
      }
    });
  }
});

/**
 * 告警历史查询相关路由
 */
// 获取告警历史记录
router.get('/alerts/history', authenticateToken, async (req, res) => {
  try {
    const { deviceId, startDate, endDate, severity, page = 1, limit = 20, export: exportFormat } = req.query;
    const offset = (page - 1) * limit;
    let queryParams = [];
    let whereClauses = [];

    // 构建查询条件
    if (deviceId) {
      whereClauses.push('device_id = ?');
      queryParams.push(deviceId);
    }
    if (startDate) {
      whereClauses.push('created_at >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereClauses.push('created_at <= ?');
      queryParams.push(endDate);
    }
    if (severity) {
      whereClauses.push('severity = ?');
      queryParams.push(severity);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countQuery = `SELECT COUNT(*) as total FROM alerts ${whereClause}`;
    const dataQuery = `
      SELECT a.*, d.name as device_name, d.type as device_type
      FROM alerts a
      LEFT JOIN devices d ON a.device_id = d.id
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    // 执行查询
    const countResult = await db.get(countQuery, queryParams);
    const total = parseInt(countResult.total);
    const alerts = await db.all(dataQuery, [...queryParams, limit, offset]);

    // 处理导出请求
    if (exportFormat === 'csv') {
      const createCsvWriter = require('csv-writer').createObjectCsvWriter;
      const path = require('path');
      const filename = `alerts_export_${new Date().toISOString().slice(0,10)}.csv`;
      const filePath = path.join(os.tmpdir(), filename);

      const csvWriter = createCsvWriter({
        path: filePath,
        header: [
          {id: 'id', title: '告警ID'},
          {id: 'device_id', title: '设备ID'},
          {id: 'device_name', title: '设备名称'},
          {id: 'type', title: '告警类型'},
          {id: 'severity', title: '严重级别'},
          {id: 'message', title: '告警信息'},
          {id: 'status', title: '状态'},
          {id: 'created_at', title: '发生时间'}
        ]
      });

      await csvWriter.writeRecords(alerts);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.sendFile(filePath, (err) => {
        if (err) console.error('导出文件发送失败:', err);
        // 删除临时文件
        fs.unlinkSync(filePath);
      });
    }

    // 返回JSON数据
    res.json({
      data: alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取告警历史失败:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ALERTS_FAILED',
        message: '获取告警历史记录失败'
      }
    });
  }
});

/**
 * 设备类型管理相关路由
 */
// 创建设备类型
router.post('/device-types', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const DeviceType = require('../models/DeviceType');
    const typeData = req.body;

    // 验证必填字段
    if (!typeData.name || !typeData.data_schema) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: '设备类型名称和数据模式不能为空'
        }
      });
    }

    // 检查设备类型名称是否已存在
    const existingType = await DeviceType.findByName(typeData.name);
    if (existingType) {
      return res.status(409).json({
        error: {
          code: 'TYPE_EXISTS',
          message: '该设备类型名称已存在'
        }
      });
    }

    // 创建设备类型
    const newType = await DeviceType.create(typeData);

    res.status(201).json({
      data: newType
    });

  } catch (error) {
    console.error('创建设备类型失败:', error);
    res.status(500).json({
      error: {
        code: 'TYPE_CREATION_FAILED',
        message: '设备类型创建失败，请稍后重试'
      }
    });
  }
});

// 获取设备类型列表
router.get('/device-types', authenticateToken, mediumCache, async (req, res) => {
  try {
    const DeviceType = require('../models/DeviceType');
    const { category, manufacturer } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (manufacturer) filters.manufacturer = manufacturer;

    const types = await DeviceType.findAll(filters);

    res.json({
      data: types
    });

  } catch (error) {
    console.error('获取设备类型列表失败:', error);
    res.status(500).json({
      error: {
        code: 'TYPE_QUERY_FAILED',
        message: '获取设备类型列表失败'
      }
    });
  }
});

// 获取设备类型详情
router.get('/device-types/:id', authenticateToken, mediumCache, async (req, res) => {
  try {
    const DeviceType = require('../models/DeviceType');
    const { id } = req.params;

    const deviceType = await DeviceType.findById(id);
    if (!deviceType) {
      return res.status(404).json({
        error: {
          code: 'TYPE_NOT_FOUND',
          message: '设备类型不存在'
        }
      });
    }

    res.json({
      data: deviceType
    });

  } catch (error) {
    console.error('获取设备类型详情失败:', error);
    res.status(500).json({
      error: {
        code: 'TYPE_DETAIL_FAILED',
        message: '获取设备类型详情失败'
      }
    });
  }
});

// 更新设备类型
router.put('/device-types/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const DeviceType = require('../models/DeviceType');
    const { id } = req.params;
    const updates = req.body;

    // 检查设备类型是否存在
    const existingType = await DeviceType.findById(id);
    if (!existingType) {
      return res.status(404).json({
        error: {
          code: 'TYPE_NOT_FOUND',
          message: '设备类型不存在'
        }
      });
    }

    // 如果更新名称，检查新名称是否已存在
    if (updates.name && updates.name !== existingType.name) {
      const nameExists = await DeviceType.findByName(updates.name);
      if (nameExists) {
        return res.status(409).json({
          error: {
            code: 'TYPE_EXISTS',
            message: '该设备类型名称已存在'
          }
        });
      }
    }

    // 更新设备类型
    const updatedType = await DeviceType.update(id, updates);

    // 清除缓存
    clearCacheByPrefix('devices:');

    res.json({
      data: updatedType
    });

  } catch (error) {
    console.error('更新设备类型失败:', error);
    res.status(500).json({
      error: {
        code: 'TYPE_UPDATE_FAILED',
        message: '设备类型更新失败，请稍后重试'
      }
    });
  }
});

// 删除设备类型
router.delete('/device-types/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const DeviceType = require('../models/DeviceType');
    const { id } = req.params;

    // 检查设备类型是否存在
    const existingType = await DeviceType.findById(id);
    if (!existingType) {
      return res.status(404).json({
        error: {
          code: 'TYPE_NOT_FOUND',
          message: '设备类型不存在'
        }
      });
    }

    // 删除设备类型
    await DeviceType.delete(id);

    // 清除缓存
    clearCacheByPrefix('devices:');

    res.json({
      data: {
        message: '设备类型已成功删除'
      }
    });

  } catch (error) {
    if (error.message.includes('无法删除设备类型，有设备正在使用此类型')) {
      return res.status(409).json({
        error: {
          code: 'TYPE_IN_USE',
          message: error.message
        }
      });
    }

    console.error('删除设备类型失败:', error);
    res.status(500).json({
      error: {
        code: 'TYPE_DELETE_FAILED',
        message: '设备类型删除失败，请稍后重试'
      }
    });
  }
});

/**
 * 设备管理相关路由
 */

// 设备数据采集接口
router.post('/devices/:id/data', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const data = req.body;

    // 验证设备是否存在
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: '设备不存在'
        }
      });
    }

    // 记录设备通信时间
    await Device.recordCommunication(deviceId);

    // 根据数据类型保存
    if (data.type === 'energy') {
      await db('energy_data').insert({
        id: uuidv4(),
        device_id: deviceId,
        timestamp: data.timestamp || new Date().toISOString(),
        energy_consumption: data.energy_consumption,
        power: data.power,
        voltage: data.voltage,
        current: data.current,
        frequency: data.frequency,
        power_factor: data.power_factor,
        created_at: new Date().toISOString()
      });
    } else if (data.type === 'carbon') {
      await db('carbon_data').insert({
        id: uuidv4(),
        device_id: deviceId,
        timestamp: data.timestamp || new Date().toISOString(),
        carbon_emission: data.carbon_emission,
        intensity: data.intensity,
        created_at: new Date().toISOString()
      });
    } else {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATA_TYPE',
          message: '无效的数据类型'
        }
      });
    }

    res.json({
      data: {
        status: 'success',
        message: '数据已接收'
      }
    });

  } catch (error) {
    console.error('设备数据采集失败:', error);
    res.status(500).json({
      error: {
        code: 'DATA_COLLECTION_FAILED',
        message: '数据采集失败'
      }
    });
  }
});

// 创建新设备
router.post('/devices', authenticateToken, requireRole('admin', 'operator'), async (req, res) => {
  try {
    const deviceData = req.body;

    // 验证必填字段
    const requiredFields = ['name', 'type', 'building_id'];
    const missingFields = requiredFields.filter(field => !deviceData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: `缺少必填字段: ${missingFields.join(', ')}`
        }
      });
    }

    // 检查设备序列号是否已存在
    if (deviceData.serial_number) {
      const existingDevice = await db('devices')
        .where({ serial_number: deviceData.serial_number })
        .first();

      if (existingDevice) {
        return res.status(409).json({
          error: {
            code: 'DEVICE_EXISTS',
            message: '该序列号的设备已存在'
          }
        });
      }
    }

    // 创建设备
    const Device = require('../models/Device');
    const newDevice = await Device.create(deviceData);

    // 清除缓存
    clearCacheByPrefix('devices:');

    res.status(201).json({
      data: newDevice
    });

  } catch (error) {
    console.error('创建设备失败:', error);
    res.status(500).json({
      error: {
        code: 'DEVICE_CREATION_FAILED',
        message: '设备创建失败，请稍后重试'
      }
    });
  }
});

// 获取设备列表
router.get('/devices', authenticateToken, shortCache, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      building_id, 
      page = 1, 
      page_size = 20,
      search 
    } = req.query;

    const offset = (page - 1) * page_size;
    let whereConditions = [];
    let params = [];

    // 构建查询条件
    if (type) {
      whereConditions.push('d.type = ?');
      params.push(type);
    }
    if (status) {
      whereConditions.push('d.status = ?');
      params.push(status);
    }
    if (building_id) {
      whereConditions.push('d.building_id = ?');
      params.push(building_id);
    }
    if (search) {
      whereConditions.push('(d.name LIKE ? OR d.model LIKE ? OR d.serial_number LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 查询设备列表
    const sql = `
      SELECT 
        d.*,
        b.name as building_name,
        p.name as park_name
      FROM devices d
      LEFT JOIN buildings b ON d.building_id = b.id
      LEFT JOIN parks p ON b.park_id = p.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(page_size), offset);
    const devices = await queryDatabase(sql, params);

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM devices d
      LEFT JOIN buildings b ON d.building_id = b.id
      LEFT JOIN parks p ON b.park_id = p.id
      ${whereClause}
    `;
    
    const countParams = params.slice(0, -2); // 移除LIMIT和OFFSET参数
    const countResult = await queryDatabase(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      data: devices,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size),
        total,
        total_pages: Math.ceil(total / page_size)
      }
    });

  } catch (error) {
    console.error('获取设备列表失败:', error);
    res.status(500).json({
      error: {
        code: 'QUERY_FAILED',
        message: '获取设备列表失败'
      }
    });
  }
});

// 获取设备详情
router.get('/devices/:id', authenticateToken, mediumCache, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        d.*,
        b.name as building_name,
        p.name as park_name
      FROM devices d
      LEFT JOIN buildings b ON d.building_id = b.id
      LEFT JOIN parks p ON b.park_id = p.id
      WHERE d.id = ?
    `;
    
    const devices = await queryDatabase(sql, [id]);
    if (devices.length === 0) {
      return res.status(404).json({
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: '设备不存在'
        }
      });
    }

    // 获取设备的传感器列表
    const sensors = await queryDatabase(
      'SELECT * FROM sensors WHERE device_id = ? ORDER BY created_at',
      [id]
    );

    const device = devices[0];
    device.sensors = sensors;

    res.json({ data: device });

  } catch (error) {
    console.error('获取设备详情失败:', error);
    res.status(500).json({
      error: {
        code: 'QUERY_FAILED',
        message: '获取设备详情失败'
      }
    });
  }
});

// 更新设备状态
router.patch('/devices/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    // 验证状态值
    if (![0, 1, 2, 3].includes(status)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: '无效的设备状态值'
        }
      });
    }

    // 检查设备是否存在
    const existingDevice = await queryDatabase(
      'SELECT id FROM devices WHERE id = ?',
      [id]
    );
    
    if (existingDevice.length === 0) {
      return res.status(404).json({
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: '设备不存在'
        }
      });
    }

    // 更新设备状态
    await runDatabase(
      'UPDATE devices SET status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, remark || null, id]
    );

    // 清除相关缓存
    cache.clearByPrefix('devices');

    res.json({
      data: {
        message: '设备状态更新成功'
      }
    });

  } catch (error) {
    console.error('更新设备状态失败:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: '更新设备状态失败'
      }
    });
  }
});

// 获取设备实时状态 - 添加缓存
router.get('/devices/:id/status', authenticateToken, shortCache, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取设备基本信息
    const deviceSql = `
      SELECT 
        d.id, d.name, d.type, d.status, d.updated_at,
        b.name as building_name
      FROM devices d
      LEFT JOIN buildings b ON d.building_id = b.id
      WHERE d.id = ?
    `;
    
    const devices = await queryDatabase(deviceSql, [id]);
    if (devices.length === 0) {
      return res.status(404).json({
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: '设备不存在'
        }
      });
    }

    const device = devices[0];

    // 获取最新的传感器数据
    const sensorDataSql = `
      SELECT 
        s.name as sensor_name,
        s.type as sensor_type,
        s.unit,
        ed.value,
        ed.timestamp
      FROM sensors s
      LEFT JOIN (
        SELECT 
          sensor_id,
          value,
          timestamp,
          ROW_NUMBER() OVER (PARTITION BY sensor_id ORDER BY timestamp DESC) as rn
        FROM energy_data
        WHERE device_id = ?
      ) ed ON s.id = ed.sensor_id AND ed.rn = 1
      WHERE s.device_id = ?
      ORDER BY s.created_at
    `;
    
    const sensorData = await queryDatabase(sensorDataSql, [id, id]);

    // 获取活跃告警
    const alertsSql = `
      SELECT 
        a.id,
        a.message,
        a.alert_level,
        a.current_value,
        a.threshold_value,
        a.created_at,
        ar.name as rule_name
      FROM alerts a
      LEFT JOIN alert_rules ar ON a.rule_id = ar.id
      WHERE a.device_id = ? AND a.status = 0
      ORDER BY a.created_at DESC
      LIMIT 10
    `;
    
    const alerts = await queryDatabase(alertsSql, [id]);

    res.json({
      data: {
        device,
        sensor_data: sensorData,
        active_alerts: alerts,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取设备状态失败:', error);
    res.status(500).json({
      error: {
        code: 'QUERY_FAILED',
        message: '获取设备状态失败'
      }
    });
  }
});

// 创建设备 - 合并重复路由并增强验证
router.post('/devices', authenticateToken, requireRole('admin', 'operator'), async (req, res) => {
  try {
    const Device = require('../models/Device');
    const DeviceType = require('../models/DeviceType');
    const deviceData = req.body;

    // 验证必填字段
    const requiredFields = ['name', 'type', 'building_id', 'category', 'model', 'serial_number', 'location', 'install_date'];
    const missingFields = requiredFields.filter(field => !deviceData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: `缺少必填字段: ${missingFields.join(', ')}`
        }
      });
    }

    // 验证设备类型是否存在
    const deviceType = await DeviceType.findById(deviceData.type);
    if (!deviceType) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DEVICE_TYPE',
          message: '设备类型不存在'
        }
      });
    }

    // 验证坐标格式
    if (deviceData.coordinates) {
      try {
        const coords = JSON.parse(deviceData.coordinates);
        if (!Array.isArray(coords) || coords.length !== 2 || !coords.every(coord => typeof coord === 'number')) {
          throw new Error('坐标格式无效');
        }
      } catch (error) {
        return res.status(400).json({
          error: {
            code: 'INVALID_COORDINATES',
            message: '坐标格式必须为JSON数组 [longitude, latitude]'
          }
        });
      }
    }

    // 检查设备序列号是否已存在
    const existingDevice = await db('devices')
      .where({ serial_number: deviceData.serial_number })
      .first();

    if (existingDevice) {
      return res.status(409).json({
        error: {
          code: 'DEVICE_EXISTS',
          message: '该序列号的设备已存在'
        }
      });
    }

    // 创建设备
    const newDevice = await Device.create(deviceData);

    // 清除缓存
    clearCacheByPrefix('devices:');
    clearCacheByPrefix('energy-data:');
    clearCacheByPrefix('carbon-data:');

    // 记录审计日志
    console.log(`设备创建成功: ${newDevice.id} - ${newDevice.name}`);

    res.status(201).json({
      data: newDevice
    });

  } catch (error) {
    console.error('创建设备失败:', error);
    res.status(500).json({
      error: {
        code: 'DEVICE_CREATION_FAILED',
        message: '设备创建失败，请稍后重试',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

// 更新设备信息
router.patch('/devices/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      building_id,
      name,
      type,
      category,
      model,
      manufacturer,
      serial_number,
      location,
      coordinates,
      install_date,
      warranty_date,
      rated_power,
      parameters,
      remark
    } = req.body;

    // 检查设备是否存在
    const existingDevice = await queryDatabase(
      'SELECT id FROM devices WHERE id = ?',
      [id]
    );
    
    if (existingDevice.length === 0) {
      return res.status(404).json({
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: '设备不存在'
        }
      });
    }

    // 如果更新序列号，检查是否与其他设备冲突
    if (serial_number) {
      const conflictDevice = await queryDatabase(
        'SELECT id FROM devices WHERE serial_number = ? AND id != ?',
        [serial_number, id]
      );
      
      if (conflictDevice.length > 0) {
        return res.status(409).json({
          error: {
            code: 'SERIAL_NUMBER_EXISTS',
            message: '设备序列号已存在'
          }
        });
      }
    }

    // 构建更新SQL
    const updateFields = [];
    const updateValues = [];
    
    if (building_id !== undefined) {
      updateFields.push('building_id = ?');
      updateValues.push(building_id);
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (model !== undefined) {
      updateFields.push('model = ?');
      updateValues.push(model);
    }
    if (manufacturer !== undefined) {
      updateFields.push('manufacturer = ?');
      updateValues.push(manufacturer);
    }
    if (serial_number !== undefined) {
      updateFields.push('serial_number = ?');
      updateValues.push(serial_number);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    if (coordinates !== undefined) {
      updateFields.push('coordinates = ?');
      updateValues.push(coordinates);
    }
    if (install_date !== undefined) {
      updateFields.push('install_date = ?');
      updateValues.push(install_date);
    }
    if (warranty_date !== undefined) {
      updateFields.push('warranty_date = ?');
      updateValues.push(warranty_date);
    }
    if (rated_power !== undefined) {
      updateFields.push('rated_power = ?');
      updateValues.push(rated_power);
    }
    if (parameters !== undefined) {
      updateFields.push('parameters = ?');
      updateValues.push(parameters);
    }
    if (remark !== undefined) {
      updateFields.push('remark = ?');
      updateValues.push(remark);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_UPDATE_FIELDS',
          message: '没有提供要更新的字段'
        }
      });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const sql = `UPDATE devices SET ${updateFields.join(', ')} WHERE id = ?`;
    await runDatabase(sql, updateValues);

    // 清除设备相关缓存
    clearCacheByPrefix('devices');
    clearCacheByPrefix('energy-data');
    clearCacheByPrefix('carbon-data');

    res.json({
      data: {
        message: '设备更新成功'
      }
    });

  } catch (error) {
    console.error('更新设备失败:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: '更新设备失败'
      }
    });
  }
});

// 删除设备
router.delete('/devices/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查设备是否存在
    const existingDevice = await queryDatabase(
      'SELECT id FROM devices WHERE id = ?',
      [id]
    );
    
    if (existingDevice.length === 0) {
      return res.status(404).json({
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: '设备不存在'
        }
      });
    }

    // 检查设备是否有关联数据
    const hasEnergyData = await queryDatabase(
      'SELECT COUNT(*) as count FROM energy_data WHERE device_id = ?',
      [id]
    );
    
    const hasSensors = await queryDatabase(
      'SELECT COUNT(*) as count FROM sensors WHERE device_id = ?',
      [id]
    );
    
    if (hasEnergyData[0].count > 0 || hasSensors[0].count > 0) {
      return res.status(409).json({
        error: {
          code: 'DEVICE_HAS_DATA',
          message: '设备存在关联数据，无法删除。请先清理相关数据或将设备状态设为停用。'
        }
      });
    }

    // 删除设备
    await runDatabase('DELETE FROM devices WHERE id = ?', [id]);

    // 清除设备相关缓存
    clearCacheByPrefix('devices');
    clearCacheByPrefix('energy-data');
    clearCacheByPrefix('carbon-data');

    res.json({
      data: {
        message: '设备删除成功'
      }
    });

  } catch (error) {
    console.error('删除设备失败:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: '删除设备失败'
      }
    });
  }
});

/**
 * 能源数据相关路由
 */

// 获取能源数据
// 能源消费数据API
router.get('/energy/consumption', authenticateToken, CacheMiddleware.energyStatsCache(), async (req, res) => {
  try {
    const { start_date, end_date, device_id, building_id, park_id } = req.query;
    
    // 返回能源消费数据
    res.json({
      data: {
        consumption: [
          { timestamp: '2023-01-01T00:00:00Z', value: 120.5, unit: 'kWh' },
          { timestamp: '2023-01-02T00:00:00Z', value: 115.2, unit: 'kWh' },
          { timestamp: '2023-01-03T00:00:00Z', value: 130.8, unit: 'kWh' },
        ],
        total: 366.5,
        unit: 'kWh',
        period: { start: start_date || '2023-01-01', end: end_date || '2023-01-03' }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: '获取能源消费数据失败',
        details: error.message
      }
    });
  }
});

router.get('/energy-data', authenticateToken, CacheMiddleware.energyStatsCache(), async (req, res) => {
  try {
    const {
      device_id,
      data_type,
      start_time,
      end_time,
      interval = 'hour',
      page = 1,
      page_size = 100
    } = req.query;

    if (!start_time || !end_time) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TIME_RANGE',
          message: '缺少时间范围参数'
        }
      });
    }

    let whereConditions = ['timestamp BETWEEN ? AND ?'];
    let params = [start_time, end_time];

    if (device_id) {
      whereConditions.push('device_id = ?');
      params.push(device_id);
    }
    if (data_type) {
      whereConditions.push('data_type = ?');
      params.push(data_type);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * page_size;

    // 根据间隔聚合数据
    let groupByClause = '';
    let selectClause = '*';
    
    if (interval === 'hour') {
      selectClause = `
        device_id,
        data_type,
        AVG(value) as value,
        unit,
        strftime('%Y-%m-%d %H:00:00', timestamp) as timestamp,
        COUNT(*) as data_points
      `;
      groupByClause = 'GROUP BY device_id, data_type, strftime(\'%Y-%m-%d %H\', timestamp)';
    } else if (interval === 'day') {
      selectClause = `
        device_id,
        data_type,
        AVG(value) as value,
        unit,
        strftime('%Y-%m-%d 00:00:00', timestamp) as timestamp,
        COUNT(*) as data_points
      `;
      groupByClause = 'GROUP BY device_id, data_type, strftime(\'%Y-%m-%d\', timestamp)';
    }

    const sql = `
      SELECT ${selectClause}
      FROM energy_data
      WHERE ${whereClause}
      ${groupByClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(page_size), offset);
    const energyData = await queryDatabase(sql, params);

    res.json({
      data: energyData,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });

  } catch (error) {
    console.error('获取能源数据失败:', error);
    res.status(500).json({
      error: {
        code: 'QUERY_FAILED',
        message: '获取能源数据失败'
      }
    });
  }
});

// 获取碳排放数据
router.get('/carbon-data', authenticateToken, CacheMiddleware.energyStatsCache(), async (req, res) => {
  try {
    const {
      device_id,
      start_time,
      end_time,
      interval = 'hour',
      page = 1,
      page_size = 100
    } = req.query;

    if (!start_time || !end_time) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TIME_RANGE',
          message: '缺少时间范围参数'
        }
      });
    }

    let whereConditions = ['ed.timestamp BETWEEN ? AND ?'];
    let params = [start_time, end_time];

    if (device_id) {
      whereConditions.push('ed.device_id = ?');
      params.push(device_id);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * page_size;

    const sql = `
      SELECT 
        cd.*,
        ed.device_id,
        ed.timestamp,
        ed.value as energy_value,
        ed.unit as energy_unit,
        cf.energy_type,
        cf.factor_value
      FROM carbon_data cd
      JOIN energy_data ed ON cd.energy_data_id = ed.id
      JOIN carbon_factors cf ON cd.carbon_factor_id = cf.id
      WHERE ${whereClause}
      ORDER BY ed.timestamp DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(page_size), offset);
    const carbonData = await queryDatabase(sql, params);

    res.json({
      data: carbonData,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });

  } catch (error) {
    console.error('获取碳排放数据失败:', error);
    res.status(500).json({
      error: {
        code: 'QUERY_FAILED',
        message: '获取碳排放数据失败'
      }
    });
  }
});

/**
 * 性能监控相关路由
 */

// 获取性能统计信息
router.get('/performance/stats', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { performanceMonitor } = require('../middleware/performance.js');
    const stats = performanceMonitor.getStats();
    
    res.json({
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取性能统计失败:', error);
    res.status(500).json({
      error: {
        code: 'STATS_FAILED',
        message: '获取性能统计失败'
      }
    });
  }
});

// 生成性能报告
router.post('/performance/report', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { performanceMonitor } = require('../middleware/performance.js');
    const report = performanceMonitor.generateReport();
    
    res.json({
      data: {
        message: '性能报告已生成',
        stats: report
      }
    });
  } catch (error) {
    console.error('生成性能报告失败:', error);
    res.status(500).json({
      error: {
        code: 'REPORT_FAILED',
        message: '生成性能报告失败'
      }
    });
  }
});

// 重置性能统计
router.post('/performance/reset', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { performanceMonitor } = require('../middleware/performance.js');
    performanceMonitor.reset();
    
    res.json({
      data: {
        message: '性能统计已重置'
      }
    });
  } catch (error) {
    console.error('重置性能统计失败:', error);
    res.status(500).json({
      error: {
        code: 'RESET_FAILED',
        message: '重置性能统计失败'
      }
    });
  }
});

/**
 * 告警管理相关路由
 */

// 获取告警列表
router.get('/alerts', authenticateToken, veryShortCache, async (req, res) => {
  try {
    const {
      status,
      alert_level,
      device_id,
      start_time,
      end_time,
      page = 1,
      page_size = 20
    } = req.query;

    let whereConditions = [];
    let params = [];

    if (status !== undefined) {
      whereConditions.push('a.status = ?');
      params.push(status);
    }
    if (alert_level) {
      whereConditions.push('a.alert_level = ?');
      params.push(alert_level);
    }
    if (device_id) {
      whereConditions.push('a.device_id = ?');
      params.push(device_id);
    }
    if (start_time && end_time) {
      whereConditions.push('a.created_at BETWEEN ? AND ?');
      params.push(start_time, end_time);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * page_size;

    const sql = `
      SELECT 
        a.*,
        ar.name as rule_name,
        d.name as device_name,
        u.full_name as acknowledged_by_name
      FROM alerts a
      LEFT JOIN alert_rules ar ON a.rule_id = ar.id
      LEFT JOIN devices d ON a.device_id = d.id
      LEFT JOIN users u ON a.acknowledged_by = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(page_size), offset);
    const alerts = await queryDatabase(sql, params);

    res.json({
      data: alerts,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });

  } catch (error) {
    console.error('获取告警列表失败:', error);
    res.status(500).json({
      error: {
        code: 'QUERY_FAILED',
        message: '获取告警列表失败'
      }
    });
  }
});

// 确认告警
router.post('/alerts/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sql = `
      UPDATE alerts 
      SET status = 1, acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 0
    `;

    const result = await runDatabase(sql, [userId, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        error: {
          code: 'ALERT_NOT_FOUND',
          message: '告警不存在或已被确认'
        }
      });
    }

    res.json({
      data: {
        message: '告警确认成功'
      }
    });

  } catch (error) {
    console.error('确认告警失败:', error);
    res.status(500).json({
      error: {
        code: 'ACKNOWLEDGE_FAILED',
        message: '确认告警失败'
      }
    });
  }
});

/**
 * 告警规则管理相关路由
 */

// 获取告警规则列表
router.get('/alert-rules', authenticateToken, shortCache, async (req, res) => {
  try {
    const {
      device_id,
      is_active,
      page = 1,
      page_size = 20
    } = req.query;

    const offset = (page - 1) * page_size;
    let whereConditions = [];
    let params = [];

    if (device_id) {
      whereConditions.push('ar.device_id = ?');
      params.push(device_id);
    }
    if (is_active !== undefined) {
      whereConditions.push('ar.is_active = ?');
      params.push(parseInt(is_active));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        ar.*,
        d.name as device_name,
        s.name as sensor_name,
        u.full_name as created_by_name
      FROM alert_rules ar
      LEFT JOIN devices d ON ar.device_id = d.id
      LEFT JOIN sensors s ON ar.sensor_id = s.id
      LEFT JOIN users u ON ar.created_by = u.id
      ${whereClause}
      ORDER BY ar.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(page_size), offset);
    const rules = await queryDatabase(sql, params);

    res.json({
      data: rules,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });

  } catch (error) {
    console.error('获取告警规则列表失败:', error);
    res.status(500).json({
      error: {
        code: 'QUERY_FAILED',
        message: '获取告警规则列表失败'
      }
    });
  }
});

// 创建告警规则
router.post('/alert-rules', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      device_id,
      sensor_id,
      metric_type,
      condition_operator,
      threshold_value,
      severity = 1
    } = req.body;

    // 验证必填字段
    if (!name || !device_id || !metric_type || !condition_operator || threshold_value === undefined) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: '缺少必填字段'
        }
      });
    }

    // 验证条件操作符
    const validOperators = ['>', '<', '>=', '<=', '=', '!='];
    if (!validOperators.includes(condition_operator)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_OPERATOR',
          message: '无效的条件操作符'
        }
      });
    }

    // 验证严重级别
    if (![1, 2, 3, 4].includes(severity)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SEVERITY',
          message: '无效的严重级别'
        }
      });
    }

    const ruleId = uuidv4();
    const sql = `
      INSERT INTO alert_rules (
        id, name, description, device_id, sensor_id, metric_type,
        condition_operator, threshold_value, severity, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await runDatabase(sql, [
      ruleId, name, description, device_id, sensor_id || null,
      metric_type, condition_operator, threshold_value, severity, req.user.id
    ]);

    res.status(201).json({
      data: {
        id: ruleId,
        message: '告警规则创建成功'
      }
    });

  } catch (error) {
    console.error('创建告警规则失败:', error);
    res.status(500).json({
      error: {
        code: 'CREATE_FAILED',
        message: '创建告警规则失败'
      }
    });
  }
});

// 更新告警规则状态
router.patch('/alert-rules/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: '无效的状态值'
        }
      });
    }

    const result = await runDatabase(
      'UPDATE alert_rules SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: {
          code: 'RULE_NOT_FOUND',
          message: '告警规则不存在'
        }
      });
    }

    res.json({
      data: {
        message: '告警规则状态更新成功'
      }
    });

  } catch (error) {
    console.error('更新告警规则状态失败:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: '更新告警规则状态失败'
      }
    });
  }
});

/**
 * 设备类型管理相关路由
 */

// 获取设备类型列表
router.get('/device-types', authenticateToken, longCache, async (req, res) => {
  try {
    // 这里可以从配置文件或数据库获取设备类型
    const deviceTypes = [
      { id: 1, name: '电表', category: 'meter', description: '电能计量设备' },
      { id: 2, name: '水表', category: 'meter', description: '水量计量设备' },
      { id: 3, name: '气表', category: 'meter', description: '燃气计量设备' },
      { id: 4, name: '温度传感器', category: 'sensor', description: '温度监测设备' },
      { id: 5, name: '湿度传感器', category: 'sensor', description: '湿度监测设备' },
      { id: 6, name: '空调', category: 'hvac', description: '空调设备' },
      { id: 7, name: '照明', category: 'lighting', description: '照明设备' },
      { id: 8, name: '电梯', category: 'elevator', description: '电梯设备' },
      { id: 9, name: '充电桩', category: 'charging', description: '电动车充电设备' },
      { id: 10, name: '太阳能板', category: 'renewable', description: '太阳能发电设备' }
    ];

    res.json({
      data: deviceTypes
    });

  } catch (error) {
    console.error('获取设备类型列表失败:', error);
    res.status(500).json({
      error: {
        code: 'QUERY_FAILED',
        message: '获取设备类型列表失败'
      }
    });
  }
});

// ==================== 能源分析 API ====================

// 获取设备能源统计 - 添加缓存
router.get('/energy/stats/device/:deviceId', authenticateToken, mediumCache, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '24h' } = req.query;
    
    const EnergyAnalytics = (await import('../energy/EnergyAnalytics.js')).default;
    const analytics = new EnergyAnalytics();
    
    const stats = await analytics.getDeviceEnergyStats(deviceId, timeRange);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取设备能源统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设备能源统计失败',
      error: error.message
    });
  }
});

// 获取园区能源趋势 - 添加缓存
router.get('/energy/trend/park/:parkId', authenticateToken, mediumCache, async (req, res) => {
  try {
    const { parkId } = req.params;
    const { timeRange = '7d', interval = 'hour' } = req.query;
    
    const EnergyAnalytics = (await import('../energy/EnergyAnalytics.js')).default;
    const analytics = new EnergyAnalytics();
    
    const trend = await analytics.getParkEnergyTrend(parkId, timeRange, interval);
    
    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('获取园区能源趋势失败:', error);
    res.status(500).json({
      success: false,
      message: '获取园区能源趋势失败',
      error: error.message
    });
  }
});

// 生成能源报告
router.post('/energy/reports', authenticateToken, async (req, res) => {
  try {
    const {
      scope,
      scopeId,
      timeRange = '30d',
      includeComparison = true,
      includeForecasting = false
    } = req.body;
    
    if (!scope || !scopeId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: scope, scopeId'
      });
    }
    
    if (!['device', 'building', 'park'].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: 'scope 必须是 device, building 或 park'
      });
    }
    
    const EnergyAnalytics = (await import('../energy/EnergyAnalytics.js')).default;
    const analytics = new EnergyAnalytics();
    
    const report = await analytics.generateEnergyReport({
      scope,
      scopeId,
      timeRange,
      includeComparison,
      includeForecasting
    });
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('生成能源报告失败:', error);
    res.status(500).json({
      success: false,
      message: '生成能源报告失败',
      error: error.message
    });
  }
});

// 获取能源效率评分
router.get('/energy/efficiency/:scope/:scopeId', authenticateToken, async (req, res) => {
  try {
    const { scope, scopeId } = req.params;
    
    if (!['device', 'building', 'park'].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: 'scope 必须是 device, building 或 park'
      });
    }
    
    const EnergyAnalytics = (await import('../energy/EnergyAnalytics.js')).default;
    const analytics = new EnergyAnalytics();
    
    const efficiency = await analytics.calculateEnergyEfficiency(scopeId, scope);
    
    res.json({
      success: true,
      data: efficiency
    });
  } catch (error) {
    console.error('获取能源效率评分失败:', error);
    res.status(500).json({
      success: false,
      message: '获取能源效率评分失败',
      error: error.message
    });
  }
});

// 检测能源异常
router.get('/energy/anomalies/device/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '7d' } = req.query;
    
    const EnergyAnalytics = (await import('../energy/EnergyAnalytics.js')).default;
    const analytics = new EnergyAnalytics();
    
    const anomalies = await analytics.detectEnergyAnomalies(deviceId, timeRange);
    
    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    console.error('检测能源异常失败:', error);
    res.status(500).json({
      success: false,
      message: '检测能源异常失败',
      error: error.message
    });
  }
});

// 获取能源成本分析
router.get('/energy/cost/:scope/:scopeId', authenticateToken, async (req, res) => {
  try {
    const { scope, scopeId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    if (!['device', 'building', 'park'].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: 'scope 必须是 device, building 或 park'
      });
    }
    
    const EnergyAnalytics = (await import('../energy/EnergyAnalytics.js')).default;
    const analytics = new EnergyAnalytics();
    
    const costAnalysis = await analytics.getEnergyCostAnalysis(scopeId, scope, timeRange);
    
    res.json({
      success: true,
      data: costAnalysis
    });
  } catch (error) {
    console.error('获取能源成本分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取能源成本分析失败',
      error: error.message
    });
  }
});

// 获取历史报告列表
router.get('/energy/reports', authenticateToken, async (req, res) => {
  try {
    const { scope, scopeId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, scope, scope_id, time_range, generated_at
      FROM energy_reports
    `;
    let params = [];
    let whereConditions = [];
    
    if (scope) {
      whereConditions.push('scope = ?');
      params.push(scope);
    }
    
    if (scopeId) {
      whereConditions.push('scope_id = ?');
      params.push(scopeId);
    }
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    sql += ' ORDER BY generated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    db.all(sql, params, (err, reports) => {
      if (err) {
        console.error('获取报告列表失败:', err);
        return res.status(500).json({
          success: false,
          message: '获取报告列表失败'
        });
      }
      
      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM energy_reports';
      let countParams = [];
      
      if (whereConditions.length > 0) {
        countSql += ' WHERE ' + whereConditions.join(' AND ');
        countParams = params.slice(0, -2); // 移除 limit 和 offset
      }
      
      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          console.error('获取报告总数失败:', err);
          return res.status(500).json({
            success: false,
            message: '获取报告总数失败'
          });
        }
        
        res.json({
          success: true,
          data: {
            reports,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: countResult.total,
              pages: Math.ceil(countResult.total / limit)
            }
          }
        });
      });
    });
  } catch (error) {
    console.error('获取报告列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取报告列表失败',
      error: error.message
    });
  }
});

// 获取具体报告详情
router.get('/energy/reports/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    db.get(
      'SELECT * FROM energy_reports WHERE id = ?',
      [reportId],
      (err, report) => {
        if (err) {
          console.error('获取报告详情失败:', err);
          return res.status(500).json({
            success: false,
            message: '获取报告详情失败'
          });
        }
        
        if (!report) {
          return res.status(404).json({
            success: false,
            message: '报告不存在'
          });
        }
        
        // 解析报告数据
        try {
          report.report_data = JSON.parse(report.report_data);
        } catch (parseError) {
          console.error('解析报告数据失败:', parseError);
          return res.status(500).json({
            success: false,
            message: '报告数据格式错误'
          });
        }
        
        res.json({
          success: true,
          data: report
        });
      }
    );
  } catch (error) {
    console.error('获取报告详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取报告详情失败',
      error: error.message
    });
  }
});

// ==================== 碳排放管理API ====================

// 计算设备碳排放
router.get('/carbon/device/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '24h' } = req.query;
    
    const { default: CarbonManager } = await import('../carbon/CarbonManager.js');
    const carbonManager = new CarbonManager();
    const result = await carbonManager.calculateDeviceCarbonEmission(deviceId, timeRange);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('计算设备碳排放失败:', error);
    res.status(500).json({ error: '计算设备碳排放失败' });
  }
});

// 计算建筑碳排放
router.get('/carbon/building/:buildingId', authenticateToken, async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { timeRange = '24h' } = req.query;
    
    const { default: CarbonManager } = await import('../carbon/CarbonManager.js');
    const carbonManager = new CarbonManager();
    const result = await carbonManager.calculateBuildingCarbonEmission(buildingId, timeRange);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('计算建筑碳排放失败:', error);
    res.status(500).json({ error: '计算建筑碳排放失败' });
  }
});

// 计算园区碳排放
router.get('/carbon/park/:parkId', authenticateToken, async (req, res) => {
  try {
    const { parkId } = req.params;
    const { timeRange = '24h' } = req.query;
    
    const { default: CarbonManager } = await import('../carbon/CarbonManager.js');
    const carbonManager = new CarbonManager();
    const result = await carbonManager.calculateParkCarbonEmission(parkId, timeRange);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('计算园区碳排放失败:', error);
    res.status(500).json({ error: '计算园区碳排放失败' });
  }
});

// 获取碳排放趋势
router.get('/carbon/trend/:scope/:scopeId', authenticateToken, async (req, res) => {
  try {
    const { scope, scopeId } = req.params;
    const { timeRange = '30d', interval = 'day' } = req.query;
    
    if (!['device', 'building', 'park'].includes(scope)) {
      return res.status(400).json({ error: '无效的scope参数' });
    }
    
    const { default: CarbonManager } = await import('../carbon/CarbonManager.js');
    const carbonManager = new CarbonManager();
    const result = await carbonManager.getCarbonEmissionTrend(scope, scopeId, timeRange, interval);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('获取碳排放趋势失败:', error);
    res.status(500).json({ error: '获取碳排放趋势失败' });
  }
});

// 计算碳足迹
router.get('/carbon/footprint/:scope/:scopeId', authenticateToken, async (req, res) => {
  try {
    const { scope, scopeId } = req.params;
    const { timeRange = '365d' } = req.query;
    
    if (!['device', 'building', 'park'].includes(scope)) {
      return res.status(400).json({ error: '无效的scope参数' });
    }
    
    const { default: CarbonManager } = await import('../carbon/CarbonManager.js');
    const carbonManager = new CarbonManager();
    const result = await carbonManager.calculateCarbonFootprint(scope, scopeId, timeRange);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('计算碳足迹失败:', error);
    res.status(500).json({ error: '计算碳足迹失败' });
  }
});

// 设置碳中和目标
router.post('/carbon/targets', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      scope,
      scopeId,
      targetYear,
      baselineYear,
      baselineEmission,
      targetEmission,
      milestones,
      strategies
    } = req.body;
    
    // 验证必填字段
    if (!scope || !scopeId || !targetYear || !baselineYear || baselineEmission === undefined) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    
    if (!['device', 'building', 'park'].includes(scope)) {
      return res.status(400).json({ error: '无效的scope参数' });
    }
    
    if (targetYear <= baselineYear) {
      return res.status(400).json({ error: '目标年份必须大于基准年份' });
    }
    
    const { default: CarbonManager } = await import('../carbon/CarbonManager.js');
    const carbonManager = new CarbonManager();
    const result = await carbonManager.setCarbonNeutralTarget({
      scope,
      scopeId,
      targetYear,
      baselineYear,
      baselineEmission,
      targetEmission,
      milestones,
      strategies
    });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('设置碳中和目标失败:', error);
    res.status(500).json({ error: '设置碳中和目标失败' });
  }
});

// 获取碳中和进度
router.get('/carbon/targets/:targetId/progress', authenticateToken, async (req, res) => {
  try {
    const { targetId } = req.params;
    
    const { default: CarbonManager } = await import('../carbon/CarbonManager.js');
    const carbonManager = new CarbonManager();
    const result = await carbonManager.getCarbonNeutralProgress(targetId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('获取碳中和进度失败:', error);
    res.status(500).json({ error: '获取碳中和进度失败' });
  }
});

// 获取碳中和目标列表
router.get('/carbon/targets', authenticateToken, async (req, res) => {
  try {
    const { scope, scopeId, status = 'active', page = 1, limit = 10 } = req.query;
    
    let sql = 'SELECT * FROM carbon_targets WHERE 1=1';
    const params = [];
    
    if (scope) {
      sql += ' AND scope = ?';
      params.push(scope);
    }
    
    if (scopeId) {
      sql += ' AND scope_id = ?';
      params.push(scopeId);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    db.all(sql, params, (err, targets) => {
      if (err) {
        console.error('获取碳中和目标列表失败:', err);
        return res.status(500).json({ error: '获取碳中和目标列表失败' });
      }
      
      // 解析JSON字段
      const processedTargets = targets.map(target => ({
        ...target,
        milestones: target.milestones ? JSON.parse(target.milestones) : [],
        strategies: target.strategies ? JSON.parse(target.strategies) : []
      }));
      
      res.json({
        success: true,
        data: processedTargets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: processedTargets.length
        }
      });
    });
    
  } catch (error) {
    console.error('获取碳中和目标列表失败:', error);
    res.status(500).json({ error: '获取碳中和目标列表失败' });
  }
});

// 管理碳排放因子
router.get('/carbon/factors', authenticateToken, async (req, res) => {
  try {
    const { energyType, region = 'CN', isActive = 1 } = req.query;
    
    let sql = 'SELECT * FROM carbon_factors WHERE is_active = ?';
    const params = [isActive];
    
    if (energyType) {
      sql += ' AND energy_type = ?';
      params.push(energyType);
    }
    
    if (region) {
      sql += ' AND region = ?';
      params.push(region);
    }
    
    sql += ' ORDER BY energy_type, created_at DESC';
    
    db.all(sql, params, (err, factors) => {
      if (err) {
        console.error('获取碳排放因子失败:', err);
        return res.status(500).json({ error: '获取碳排放因子失败' });
      }
      
      res.json({
        success: true,
        data: factors
      });
    });
    
  } catch (error) {
    console.error('获取碳排放因子失败:', error);
    res.status(500).json({ error: '获取碳排放因子失败' });
  }
});

// 创建碳排放因子
router.post('/carbon/factors', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      energyType,
      factorValue,
      unit,
      region = 'CN',
      source
    } = req.body;
    
    if (!energyType || factorValue === undefined || !unit) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    
    if (factorValue < 0) {
      return res.status(400).json({ error: '碳排放因子不能为负数' });
    }
    
    const factorId = uuidv4();
    
    const sql = `
      INSERT INTO carbon_factors (
        id, energy_type, factor_value, unit, region, source, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
    `;
    
    db.run(sql, [factorId, energyType, factorValue, unit, region, source], function(err) {
      if (err) {
        console.error('创建碳排放因子失败:', err);
        return res.status(500).json({ error: '创建碳排放因子失败' });
      }
      
      res.json({
        success: true,
        data: {
          id: factorId,
          energy_type: energyType,
          factor_value: factorValue,
          unit,
          region,
          source,
          is_active: 1
        }
      });
    });
    
  } catch (error) {
    console.error('创建碳排放因子失败:', error);
    res.status(500).json({ error: '创建碳排放因子失败' });
  }
});

// 能源数据查询接口
router.get('/energy-data', authenticateToken, async (req, res) => {
  try {
    const { period = '24h', deviceId } = req.query;
    let timeCondition = '';
    const params = [];

    // 根据时间周期设置查询条件
    switch(period) {
      case '24h':
        timeCondition = 'timestamp >= datetime(\'now\', \'-24 hours\')';
        break;
      case '7d':
        timeCondition = 'timestamp >= datetime(\'now\', \'-7 days\')';
        break;
      case '30d':
        timeCondition = 'timestamp >= datetime(\'now\', \'-30 days\')';
        break;
      default:
        timeCondition = '1=1'; // 不限制时间
    }

    // 如果指定了设备ID，添加设备筛选条件
    if (deviceId) {
      timeCondition += ' AND device_id = ?';
      params.push(deviceId);
    }

    const sql = `SELECT * FROM energy_data WHERE ${timeCondition} ORDER BY timestamp ASC`;
    const data = await queryDatabase(sql, params);

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取能源数据失败', { error: error.message, userId: req.user.id });
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: '获取能源数据失败'
      }
    });
  }
});

// 碳排放数据查询接口
router.get('/carbon-data', authenticateToken, async (req, res) => {
  try {
    const { period = '24h', deviceId } = req.query;
    let timeCondition = '';
    const params = [];

    // 根据时间周期设置查询条件
    switch(period) {
      case '24h':
        timeCondition = 'timestamp >= datetime(\'now\', \'-24 hours\')';
        break;
      case '7d':
        timeCondition = 'timestamp >= datetime(\'now\', \'-7 days\')';
        break;
      case '30d':
        timeCondition = 'timestamp >= datetime(\'now\', \'-30 days\')';
        break;
      default:
        timeCondition = '1=1'; // 不限制时间
    }

    // 如果指定了设备ID，添加设备筛选条件
    if (deviceId) {
      timeCondition += ' AND device_id = ?';
      params.push(deviceId);
    }

    const sql = `SELECT * FROM carbon_data WHERE ${timeCondition} ORDER BY timestamp ASC`;
    const data = await queryDatabase(sql, params);

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取碳排放数据失败', { error: error.message, userId: req.user.id });
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: '获取碳排放数据失败'
      }
    });
  }
});

// 设备状态统计接口
router.get('/devices/stats', authenticateToken, async (req, res) => {
  try {
    // 查询总设备数
    const totalDevices = await queryDatabase('SELECT COUNT(*) as count FROM devices');
    // 查询在线设备数
    const activeDevices = await queryDatabase('SELECT COUNT(*) as count FROM devices WHERE status = ?', ['active']);
    // 计算离线设备数
    const offlineCount = totalDevices[0].count - activeDevices[0].count;

    res.json({
      success: true,
      data: {
        total: totalDevices[0].count,
        active: activeDevices[0].count,
        offline: offlineCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取设备统计数据失败', { error: error.message, userId: req.user.id });
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: '获取设备统计数据失败'
      }
    });
  }
});

/**
 * 工具函数
 */

// JWT认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: '缺少认证令牌'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: '无效的认证令牌'
        }
      });
    }
    req.user = user;
    next();
  });
}

// 角色权限中间件
function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: '权限不足'
        }
      });
    }
    next();
  };
}

// 数据库查询函数
function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 数据库执行函数
function runDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

// 根据用户名获取用户
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// 更新最后登录时间
function updateLastLogin(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

// 创建用户
function createUser(userData) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (
        id, username, password_hash, email, full_name, role, department, phone,
        created_at, updated_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
    `;
    
    db.run(sql, [
      userData.id, userData.username, userData.password_hash, userData.email,
      userData.full_name, userData.role, userData.department, userData.phone
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// ==================== 智能运维管理 API ====================

// 获取设备健康度评估
router.get('/maintenance/health/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const health = await maintenanceManager.assessDeviceHealth(deviceId);
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('获取设备健康度评估失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取设备健康度评估失败',
      message: error.message 
    });
  }
});

// 获取故障预测
router.get('/maintenance/prediction/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { period = 30 } = req.query;
    const prediction = await maintenanceManager.predictFailure(deviceId, parseInt(period));
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('获取故障预测失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取故障预测失败',
      message: error.message 
    });
  }
});

// 创建维护计划
router.post('/maintenance/plans', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const planData = req.body;
    const plan = await maintenanceManager.createMaintenancePlan(planData);
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('创建维护计划失败:', error);
    res.status(500).json({ 
      success: false,
      error: '创建维护计划失败',
      message: error.message 
    });
  }
});

// 获取维护计划列表
router.get('/maintenance/plans', authenticateToken, async (req, res) => {
  try {
    const { deviceId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filters = {};
    if (deviceId) filters.deviceId = deviceId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    

    const plans = await maintenanceManager.getMaintenancePlans(filters, parseInt(page), parseInt(limit));
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('获取维护计划列表失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取维护计划列表失败',
      message: error.message 
    });
  }
});

// 获取智能维护调度
router.get('/maintenance/schedule', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, technicianId } = req.query;
    const schedule = await maintenanceManager.getMaintenanceSchedule(startDate, endDate, technicianId);
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('获取智能维护调度失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取智能维护调度失败',
      message: error.message 
    });
  }
});

// 获取维护成本分析
router.get('/maintenance/cost/:scope/:scopeId', authenticateToken, async (req, res) => {
  try {
    const { scope, scopeId } = req.params;
    const { startDate, endDate } = req.query;
    const costAnalysis = await maintenanceManager.getMaintenanceCostAnalysis(scope, scopeId, startDate, endDate);
    res.json({
      success: true,
      data: costAnalysis
    });
  } catch (error) {
    console.error('获取维护成本分析失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取维护成本分析失败',
      message: error.message 
    });
  }
});

// 生成维护报告
router.post('/maintenance/reports', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { scope, scopeId, reportType, timeRange } = req.body;
    const report = await maintenanceManager.generateMaintenanceReport(scope, scopeId, reportType, timeRange);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('生成维护报告失败:', error);
    res.status(500).json({ 
      success: false,
      error: '生成维护报告失败',
      message: error.message 
    });
  }
});

// 获取维护报告列表
router.get('/maintenance/reports', authenticateToken, async (req, res) => {
  try {
    const { scope, scopeId, reportType, page = 1, limit = 20 } = req.query;
    const filters = {};
    if (scope) filters.scope = scope;
    if (scopeId) filters.scopeId = scopeId;
    if (reportType) filters.reportType = reportType;
    
    const reports = await maintenanceManager.getMaintenanceReports(filters, parseInt(page), parseInt(limit));
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('获取维护报告列表失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取维护报告列表失败',
      message: error.message 
    });
  }
});

// 获取维护报告详情
router.get('/maintenance/reports/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await maintenanceManager.getMaintenanceReportById(reportId);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('获取维护报告详情失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取维护报告详情失败',
      message: error.message 
    });
  }
});

// 更新维护计划状态
router.put('/maintenance/plans/:planId/status', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.params;
    const { status, notes } = req.body;
    const result = await maintenanceManager.updateMaintenancePlanStatus(planId, status, notes);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('更新维护计划状态失败:', error);
    res.status(500).json({ 
      success: false,
      error: '更新维护计划状态失败',
      message: error.message 
    });
  }
});

// 记录维护完成
router.post('/maintenance/records', authenticateToken, async (req, res) => {
  try {
    const recordData = req.body;
    const record = await maintenanceManager.recordMaintenanceCompletion(recordData);
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('记录维护完成失败:', error);
    res.status(500).json({ 
      success: false,
      error: '记录维护完成失败',
      message: error.message 
    });
  }
});

// 获取技师列表
router.get('/maintenance/technicians', authenticateToken, async (req, res) => {
  try {
    const { skills, availability, status = 'active' } = req.query;
    const filters = { status };
    if (skills) filters.skills = skills;
    if (availability) filters.availability = availability;
    
    const technicians = await maintenanceManager.getTechnicians(filters);
    res.json({
      success: true,
      data: technicians
    });
  } catch (error) {
    console.error('获取技师列表失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取技师列表失败',
      message: error.message 
    });
  }
});

// 创建或更新技师信息
router.post('/maintenance/technicians', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const technicianData = req.body;
    const technician = await maintenanceManager.createOrUpdateTechnician(technicianData);
    res.json({
      success: true,
      data: technician
    });
  } catch (error) {
    console.error('创建或更新技师信息失败:', error);
    res.status(500).json({ 
      success: false,
      error: '创建或更新技师信息失败',
      message: error.message 
    });
  }
});

export default router;