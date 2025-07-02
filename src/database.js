import fs from 'fs';
import path from 'path';
import knex from 'knex';
import knexConfig from '../knexfile.cjs';

// 初始化Knex连接
const environment = process.env.NODE_ENV || 'development';
export const db = knex(knexConfig[environment]);

async function initializeDatabase() {
  try {
    // 验证数据库连接
    await db.raw('SELECT 1');
    console.log('数据库连接成功');
    // 运行迁移
    await db.migrate.latest();
    console.log('数据库迁移完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw new Error('数据库初始化失败');
  }


// 验证数据库连接
async function verifyConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('成功连接到数据库');
  } catch (err) {
    console.error('数据库连接失败:', err.message);
  }

verifyConnection();

// 创建数据目录
const dataDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 初始化数据库
const dbPath = path.resolve(dataDir, 'park.db');
// 已通过Knex初始化数据库连接，无需额外sqlite3连接
// const sqlite3 = require('sqlite3');
// const db = new sqlite3.Database(dbPath, async (err) => {
  // 已注释的遗留代码
  // if (err) {
  //   console.error('数据库连接失败:', err.message);
  // } else {
    console.log('成功连接到SQLite数据库');
    try {
      await initializeDatabase();
      console.log('✅ 数据库初始化完成');
      setTimeout(() => {
        console.log('✅ 数据库迁移完成');
        migrateDatabase();
        createPerformanceIndexes();
      }, 1000);
    } catch (error) {
      console.error('数据库初始化失败:', error.message);
    }
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      department TEXT,
      phone TEXT,
      last_login DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建用户表失败:', err.message);
    } else {
      checkCompletion();
    }
  });

  // 创建园区表
  db.run(`
    CREATE TABLE IF NOT EXISTS parks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      area REAL,
      description TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status INTEGER NOT NULL DEFAULT 1,
      remark TEXT
    )
  `, (err) => {
    if (err) {
      console.error('创建园区表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建建筑表
  db.run(`
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      park_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      type INTEGER NOT NULL,
      area REAL NOT NULL,
      floors INTEGER NOT NULL,
      location TEXT NOT NULL,
      coordinates TEXT,
      shape TEXT,
      construction_year INTEGER,
      energy_rating TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status INTEGER NOT NULL DEFAULT 1,
      remark TEXT,
      FOREIGN KEY (park_id) REFERENCES parks(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建建筑表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建设备表
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type INTEGER NOT NULL,
      category TEXT NOT NULL,
      model TEXT NOT NULL,
      manufacturer TEXT,
      serial_number TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      coordinates TEXT,
      install_date DATE NOT NULL,
      warranty_date DATE,
      rated_power REAL,
      parameters TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status INTEGER NOT NULL DEFAULT 1,
      remark TEXT,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建设备表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建传感器表
  db.run(`
    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type INTEGER NOT NULL,
      model TEXT NOT NULL,
      location TEXT NOT NULL,
      range TEXT NOT NULL,
      unit TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      status INTEGER NOT NULL,
      remark TEXT,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建传感器表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建能源数据表
  db.run(`
    CREATE TABLE IF NOT EXISTS energy_data (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      sensor_id TEXT,
      data_type INTEGER NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      created_at DATETIME NOT NULL,
      is_anomaly INTEGER DEFAULT 0,
      anomaly_reason TEXT,
      quality_score REAL DEFAULT 1.0,
      remark TEXT,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (sensor_id) REFERENCES sensors(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建能源数据表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建能源报告表
  db.run(`
    CREATE TABLE IF NOT EXISTS energy_reports (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      time_range TEXT NOT NULL,
      report_data TEXT NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建能源报告表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建能源价格配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS energy_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      energy_type TEXT NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      effective_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
     if (err) {
       console.error('创建能源价格表失败:', err.message);
       reject(err);
     } else {
       checkCompletion();
     }
   });

  // 创建基准消耗数据表
  db.run(`
    CREATE TABLE IF NOT EXISTS baseline_consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      energy_type TEXT NOT NULL,
      baseline_value REAL NOT NULL,
      unit TEXT NOT NULL,
      period_start DATETIME NOT NULL,
      period_end DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
     if (err) {
       console.error('创建基准消耗表失败:', err.message);
       reject(err);
     } else {
       checkCompletion();
     }
   });



  // 创建碳中和目标表
  db.run(`
    CREATE TABLE IF NOT EXISTS carbon_targets (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      target_year INTEGER NOT NULL,
      baseline_year INTEGER NOT NULL,
      baseline_emission REAL NOT NULL,
      target_emission REAL DEFAULT 0,
      milestones TEXT,
      strategies TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建碳中和目标表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建碳排放记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS carbon_emissions (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      emission_date TEXT NOT NULL,
      total_emission REAL NOT NULL,
      breakdown TEXT,
      calculation_method TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建碳排放记录表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建维护计划表
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_plans (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      scheduled_date TEXT NOT NULL,
      estimated_duration INTEGER,
      description TEXT,
      required_skills TEXT,
      required_parts TEXT,
      assigned_technician TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建维护计划表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建维护记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_records (
      id TEXT PRIMARY KEY,
      plan_id TEXT,
      device_id TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      technician_id TEXT,
      technician_name TEXT,
      technician_hourly_rate REAL DEFAULT 50,
      started_date TEXT,
      completed_date TEXT,
      estimated_duration INTEGER,
      actual_duration INTEGER,
      parts_cost REAL DEFAULT 0,
      downtime_hours REAL DEFAULT 0,
      downtime_hourly_cost REAL DEFAULT 100,
      description TEXT,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建维护记录表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建维护报告表
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_reports (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      time_range TEXT NOT NULL,
      report_data TEXT NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建维护报告表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });



  // 创建技师表
  db.run(`
    CREATE TABLE IF NOT EXISTS technicians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      skills TEXT,
      hourly_rate REAL DEFAULT 50,
      availability TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建技师表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建设备健康记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS device_health_records (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      assessment_date TEXT NOT NULL,
      overall_health REAL NOT NULL,
      health_level TEXT NOT NULL,
      health_metrics TEXT,
      risk_factors TEXT,
      recommendations TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建设备健康记录表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建故障预测记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS failure_predictions (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      prediction_date TEXT NOT NULL,
      prediction_period INTEGER NOT NULL,
      failure_probability REAL NOT NULL,
      risk_level TEXT NOT NULL,
      estimated_failure_time TEXT,
      potential_failures TEXT,
      preventive_measures TEXT,
      confidence_score REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建故障预测记录表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 所有索引将在表创建完成后统一创建

  // 创建碳排放数据表
  db.run(`
    CREATE TABLE IF NOT EXISTS carbon_data (
      id TEXT PRIMARY KEY,
      energy_data_id TEXT NOT NULL,
      carbon_factor_id TEXT NOT NULL,
      emission_value REAL NOT NULL,
      emission_unit TEXT NOT NULL DEFAULT 'kgCO2e',
      calculation_method TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      remark TEXT,
      FOREIGN KEY (energy_data_id) REFERENCES energy_data(id),
      FOREIGN KEY (carbon_factor_id) REFERENCES carbon_factors(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建碳排放数据表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建碳排放因子表
  db.run(`
    CREATE TABLE IF NOT EXISTS carbon_factors (
      id TEXT PRIMARY KEY,
      energy_type TEXT NOT NULL,
      factor_value REAL NOT NULL,
      unit TEXT NOT NULL,
      source TEXT,
      region TEXT,
      valid_from DATE NOT NULL,
      valid_to DATE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      remark TEXT
    )
  `, (err) => {
    if (err) {
      console.error('创建碳排放因子表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建告警规则表
  db.run(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      device_id TEXT,
      sensor_id TEXT,
      metric_type TEXT NOT NULL,
      condition_operator TEXT NOT NULL,
      threshold_value REAL NOT NULL,
      severity INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (sensor_id) REFERENCES sensors(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建告警规则表失败:', err.message);
      reject(err);
    } else {
      checkCompletion();
    }
  });

  // 创建告警记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      rule_id TEXT NOT NULL,
      device_id TEXT,
      sensor_id TEXT,
      alert_level INTEGER NOT NULL,
      message TEXT NOT NULL,
      current_value REAL,
      threshold_value REAL,
      status INTEGER DEFAULT 0,
      acknowledged_by TEXT,
      acknowledged_at DATETIME,
      resolved_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES alert_rules(id),
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (sensor_id) REFERENCES sensors(id),
      FOREIGN KEY (acknowledged_by) REFERENCES users(id)
    )
  `, (err) => {
      if (err) {
        console.error('创建告警记录表失败:', err.message);
        reject(err);
      } else {
        checkCompletion();
      }
    });

  // 创建系统日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
      if (err) {
        console.error('创建系统日志表失败:', err.message);
        reject(err);
      } else {
        checkCompletion();
      }
    });
  };
}

// 数据库迁移函数
function migrateDatabase() {
  // 迁移devices表
  db.run(`ALTER TABLE devices ADD COLUMN category TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加category列失败:', err.message);
    }
  });
  
  db.run(`ALTER TABLE devices ADD COLUMN manufacturer TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加manufacturer列失败:', err.message);
    }
  });

  db.run(`ALTER TABLE devices ADD COLUMN coordinates TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加coordinates列失败:', err.message);
    }
  });

  db.run(`ALTER TABLE devices ADD COLUMN warranty_date DATE`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加warranty_date列失败:', err.message);
    }
  });

  db.run(`ALTER TABLE devices ADD COLUMN rated_power REAL`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加rated_power列失败:', err.message);
    }
  });

  // 迁移carbon_data表
  db.run(`ALTER TABLE carbon_data ADD COLUMN emission_value REAL`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加emission_value列失败:', err.message);
    }
  });

  db.run(`ALTER TABLE carbon_data ADD COLUMN emission_unit TEXT DEFAULT 'kgCO2e'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加emission_unit列失败:', err.message);
    }
  });

  db.run(`ALTER TABLE carbon_data ADD COLUMN calculation_method TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加calculation_method列失败:', err.message);
    }
  });

  console.log('✅ 数据库迁移完成');
}

// 创建性能优化索引
function createPerformanceIndexes() {
  // 用户表索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)`);
  
  // 园区表索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_parks_code ON parks(code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_parks_status ON parks(status)`);
  
  // 建筑表索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_buildings_park_id ON buildings(park_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_buildings_code ON buildings(code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings(status)`);
  
  // 设备表索引（只为确定存在的列创建索引）
  db.run(`CREATE INDEX IF NOT EXISTS idx_devices_building_id ON devices(building_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status)`);
  
  // 为新添加的列创建索引（如果列存在）
  db.all("PRAGMA table_info(devices)", (err, columns) => {
    if (!err && columns) {
      const columnNames = columns.map(col => col.name);
      if (columnNames.includes('category')) {
        db.run(`CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category)`);
      }
    }
  });
  
  // 传感器表索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_sensors_device_id ON sensors(device_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status)`);
  
  

// 能源数据表索引（关键性能优化）
  db.run(`CREATE INDEX IF NOT EXISTS idx_energy_data_device_id ON energy_data(device_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_energy_data_sensor_id ON energy_data(sensor_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_energy_data_timestamp ON energy_data(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_energy_data_type ON energy_data(data_type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_energy_data_device_timestamp ON energy_data(device_id, timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_energy_data_created_at ON energy_data(created_at)`);
  
  // 碳排放数据表索引（使用energy_data_id列）
  db.run(`CREATE INDEX IF NOT EXISTS idx_carbon_data_energy_data_id ON carbon_data(energy_data_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_carbon_data_factor_id ON carbon_data(carbon_factor_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_carbon_data_created_at ON carbon_data(created_at)`);
  
  // 碳排放因子表索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_carbon_factors_energy_type ON carbon_factors(energy_type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_carbon_factors_active ON carbon_factors(is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_carbon_factors_valid_from ON carbon_factors(valid_from)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_carbon_factors_region ON carbon_factors(region)`);
  
  // 告警规则表索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_alert_rules_device_id ON alert_rules(device_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alert_rules_sensor_id ON alert_rules(sensor_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alert_rules_created_by ON alert_rules(created_by)`);
  
  // 告警记录表索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_sensor_id ON alerts(sensor_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(alert_level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at)`);
  
  // 系统日志表索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_system_logs_resource_type ON system_logs(resource_type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)`);
  
  console.log('✅ 数据库性能索引创建完成');
}

// 插入默认碳排放因子
function insertDefaultCarbonFactors() {
  return new Promise((resolve, reject) => {
    const defaultFactors = [
      {
        id: 'cf_electricity_cn',
        energy_type: 'electricity',
        factor_value: 0.5703,
        unit: 'kgCO2e/kWh',
        source: '国家发改委',
        region: '中国',
        valid_from: '2023-01-01'
      },
      {
        id: 'cf_natural_gas_cn',
        energy_type: 'natural_gas',
        factor_value: 2.1622,
        unit: 'kgCO2e/m³',
        source: 'IPCC',
        region: '中国',
        valid_from: '2023-01-01'
      },
      {
        id: 'cf_diesel_cn',
        energy_type: 'diesel',
        factor_value: 2.68,
        unit: 'kgCO2e/L',
        source: 'IPCC',
        region: '中国',
        valid_from: '2023-01-01'
      }
    ];

    let completed = 0;
    const total = defaultFactors.length;

    defaultFactors.forEach(factor => {
      db.run(`
        INSERT OR IGNORE INTO carbon_factors 
        (id, energy_type, factor_value, unit, source, region, valid_from, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [factor.id, factor.energy_type, factor.factor_value, factor.unit, factor.source, factor.region, factor.valid_from], (err) => {
        if (err) {
          console.error('插入碳排放因子失败:', err);
          reject(err);
        } else {
          completed++;
          if (completed === total) {
            console.log('默认碳排放因子已插入');
            resolve();
          }
        }
      });
    });
  });
}

// 插入默认管理员用户
function insertDefaultAdmin() {
  return new Promise((resolve, reject) => {
    const bcrypt = require('bcrypt');
    const defaultPassword = 'admin123';
    
    bcrypt.hash(defaultPassword, 10, (err, hash) => {
      if (err) {
        console.error('密码加密失败:', err);
        reject(err);
        return;
      }

      // 插入默认管理员用户代码
      db.run(`INSERT OR IGNORE INTO users (id, username, password_hash, email, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [
        'admin-001', 'admin', hash, 'admin@example.com', '系统管理员', 'admin'
      ], (err) => {
        if (err) {
          console.error('插入默认管理员失败:', err);
          reject(err);
        } else {
          console.log('默认管理员已创建');
          resolve();
        }
      });
    });
  });
}

// 创建数据库索引
function createDatabaseIndexes() {
  return new Promise((resolve, reject) => {
    const indexes = [
      // 用户表索引
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
      
      // 园区表索引
      'CREATE INDEX IF NOT EXISTS idx_parks_code ON parks(code)',
      'CREATE INDEX IF NOT EXISTS idx_parks_status ON parks(status)',
      
      // 建筑表索引
      'CREATE INDEX IF NOT EXISTS idx_buildings_park_id ON buildings(park_id)',
      'CREATE INDEX IF NOT EXISTS idx_buildings_code ON buildings(code)',
      'CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(type)',
      'CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings(status)',
      
      // 设备表索引
      'CREATE INDEX IF NOT EXISTS idx_devices_building_id ON devices(building_id)',
      'CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number)',
      'CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type)',
      'CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status)',
      'CREATE INDEX IF NOT EXISTS idx_devices_manufacturer ON devices(manufacturer)',
      'CREATE INDEX IF NOT EXISTS idx_devices_model ON devices(model)',
      'CREATE INDEX IF NOT EXISTS idx_devices_install_date ON devices(install_date)',
      'CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category)',
      
      // 传感器表索引
      'CREATE INDEX IF NOT EXISTS idx_sensors_device_id ON sensors(device_id)',
      'CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type)',
      'CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status)',
      
      // 能耗数据表索引
      'CREATE INDEX IF NOT EXISTS idx_energy_data_device_id ON energy_data(device_id)',
      'CREATE INDEX IF NOT EXISTS idx_energy_data_sensor_id ON energy_data(sensor_id)',
      'CREATE INDEX IF NOT EXISTS idx_energy_data_timestamp ON energy_data(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_energy_data_type ON energy_data(data_type)',
      'CREATE INDEX IF NOT EXISTS idx_energy_data_device_timestamp ON energy_data(device_id, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_energy_data_created_at ON energy_data(created_at)',
      
      // 碳排放数据表索引
      'CREATE INDEX IF NOT EXISTS idx_carbon_data_energy_data_id ON carbon_data(energy_data_id)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_data_factor_id ON carbon_data(carbon_factor_id)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_data_created_at ON carbon_data(created_at)',
      
      // 碳排放因子表索引
      'CREATE INDEX IF NOT EXISTS idx_carbon_factors_energy_type ON carbon_factors(energy_type)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_factors_active ON carbon_factors(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_factors_valid_from ON carbon_factors(valid_from)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_factors_region ON carbon_factors(region)',
      
      // 告警规则表索引
      'CREATE INDEX IF NOT EXISTS idx_alert_rules_device_id ON alert_rules(device_id)',
      'CREATE INDEX IF NOT EXISTS idx_alert_rules_sensor_id ON alert_rules(sensor_id)',
      'CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_alert_rules_created_by ON alert_rules(created_by)',
      
      // 告警表索引
      'CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_sensor_id ON alerts(sensor_id)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(alert_level)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at)',
      
      // 系统日志表索引
      'CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_resource_type ON system_logs(resource_type)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)',
      
      // 其他表索引
      'CREATE INDEX IF NOT EXISTS idx_energy_reports_scope ON energy_reports(scope, scope_id)',
      'CREATE INDEX IF NOT EXISTS idx_energy_prices_type ON energy_prices(energy_type, is_active)',
      'CREATE INDEX IF NOT EXISTS idx_baseline_scope ON baseline_consumption(scope, scope_id)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_factors_type ON carbon_factors(energy_type, unit)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_targets_scope ON carbon_targets(scope, scope_id)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_emissions_scope ON carbon_emissions(scope, scope_id)',
      'CREATE INDEX IF NOT EXISTS idx_carbon_emissions_date ON carbon_emissions(emission_date)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_plans_device ON maintenance_plans(device_id)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_plans_scheduled ON maintenance_plans(scheduled_date)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_records_device ON maintenance_records(device_id)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_records_completed ON maintenance_records(completed_date)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_reports_scope ON maintenance_reports(scope, scope_id)',
      'CREATE INDEX IF NOT EXISTS idx_device_health_device ON device_health_records(device_id)',
      'CREATE INDEX IF NOT EXISTS idx_device_health_date ON device_health_records(assessment_date)',
      'CREATE INDEX IF NOT EXISTS idx_failure_predictions_device ON failure_predictions(device_id)',
      'CREATE INDEX IF NOT EXISTS idx_failure_predictions_date ON failure_predictions(prediction_date)'
    ];
    
    let completed = 0;
    const total = indexes.length;
    
    if (total === 0) {
      resolve();
      return;
    }
    
    indexes.forEach(indexSql => {
      db.run(indexSql, (err) => {
        if (err) {
          console.error('创建索引失败:', err);
          reject(err);
        } else {
          completed++;
          if (completed === total) {
            resolve();
          }
        }
      });
    });
  });
}

// 导出数据库连接和相关函数
export {
    initializeDatabase,
    migrateDatabase,
    createPerformanceIndexes,
    insertDefaultCarbonFactors,
    insertDefaultAdmin,
    createDatabaseIndexes
};
