/**
 * 数据库Schema验证工具
 * 确保数据库结构的一致性和完整性
 */

import { logger } from './logger.js';
// import knex from 'knex'; // 暂时注释掉未使用的导入

// Schema定义
const EXPECTED_TABLES = {
  users: {
    columns: {
      id: { type: 'integer', nullable: false, primary: true },
      username: { type: 'varchar', nullable: false, unique: true },
      email: { type: 'varchar', nullable: false, unique: true },
      password_hash: { type: 'varchar', nullable: false },
      role: { type: 'varchar', nullable: false, default: 'user' },
      is_active: { type: 'boolean', nullable: false, default: true },
      last_login: { type: 'datetime', nullable: true },
      created_at: { type: 'datetime', nullable: false },
      updated_at: { type: 'datetime', nullable: false }
    },
    indexes: [
      { name: 'idx_users_username', columns: ['username'], unique: true },
      { name: 'idx_users_email', columns: ['email'], unique: true },
      { name: 'idx_users_role', columns: ['role'] },
      { name: 'idx_users_is_active', columns: ['is_active'] }
    ]
  },

  devices: {
    columns: {
      id: { type: 'integer', nullable: false, primary: true },
      device_id: { type: 'varchar', nullable: false, unique: true },
      name: { type: 'varchar', nullable: false },
      type: { type: 'varchar', nullable: false },
      location: { type: 'varchar', nullable: true },
      status: { type: 'varchar', nullable: false, default: 'offline' },
      last_seen: { type: 'datetime', nullable: true },
      metadata: { type: 'text', nullable: true },
      created_at: { type: 'datetime', nullable: false },
      updated_at: { type: 'datetime', nullable: false }
    },
    indexes: [
      { name: 'idx_devices_device_id', columns: ['device_id'], unique: true },
      { name: 'idx_devices_type', columns: ['type'] },
      { name: 'idx_devices_status', columns: ['status'] },
      { name: 'idx_devices_last_seen', columns: ['last_seen'] }
    ]
  },

  energy_data: {
    columns: {
      id: { type: 'integer', nullable: false, primary: true },
      device_id: { type: 'varchar', nullable: false },
      timestamp: { type: 'datetime', nullable: false },
      energy_consumption: { type: 'decimal', nullable: false },
      power: { type: 'decimal', nullable: true },
      voltage: { type: 'decimal', nullable: true },
      current: { type: 'decimal', nullable: true },
      frequency: { type: 'decimal', nullable: true },
      power_factor: { type: 'decimal', nullable: true },
      created_at: { type: 'datetime', nullable: false }
    },
    indexes: [
      { name: 'idx_energy_data_device_timestamp', columns: ['device_id', 'timestamp'] },
      { name: 'idx_energy_data_timestamp', columns: ['timestamp'] },
      { name: 'idx_energy_data_device_id', columns: ['device_id'] }
    ],
    foreignKeys: [{ column: 'device_id', references: 'devices.device_id', onDelete: 'CASCADE' }]
  },

  carbon_data: {
    columns: {
      id: { type: 'integer', nullable: false, primary: true },
      device_id: { type: 'varchar', nullable: false },
      timestamp: { type: 'datetime', nullable: false },
      carbon_emission: { type: 'decimal', nullable: false },
      emission_factor: { type: 'decimal', nullable: true },
      calculation_method: { type: 'varchar', nullable: true },
      created_at: { type: 'datetime', nullable: false }
    },
    indexes: [
      { name: 'idx_carbon_data_device_timestamp', columns: ['device_id', 'timestamp'] },
      { name: 'idx_carbon_data_timestamp', columns: ['timestamp'] },
      { name: 'idx_carbon_data_device_id', columns: ['device_id'] }
    ],
    foreignKeys: [{ column: 'device_id', references: 'devices.device_id', onDelete: 'CASCADE' }]
  },

  storage_devices: {
    columns: {
      id: { type: 'integer', nullable: false, primary: true },
      device_id: { type: 'varchar', nullable: false },
      capacity: { type: 'decimal', nullable: false },
      current_charge: { type: 'decimal', nullable: false, default: 0 },
      charge_rate: { type: 'decimal', nullable: true },
      discharge_rate: { type: 'decimal', nullable: true },
      efficiency: { type: 'decimal', nullable: true },
      status: { type: 'varchar', nullable: false, default: 'idle' },
      last_updated: { type: 'datetime', nullable: false },
      created_at: { type: 'datetime', nullable: false },
      updated_at: { type: 'datetime', nullable: false }
    },
    indexes: [
      { name: 'idx_storage_devices_device_id', columns: ['device_id'], unique: true },
      { name: 'idx_storage_devices_status', columns: ['status'] },
      { name: 'idx_storage_devices_last_updated', columns: ['last_updated'] }
    ],
    foreignKeys: [{ column: 'device_id', references: 'devices.device_id', onDelete: 'CASCADE' }]
  },

  alert_rules: {
    columns: {
      id: { type: 'integer', nullable: false, primary: true },
      name: { type: 'varchar', nullable: false },
      description: { type: 'text', nullable: true },
      condition_type: { type: 'varchar', nullable: false },
      condition_value: { type: 'decimal', nullable: false },
      device_type: { type: 'varchar', nullable: true },
      device_id: { type: 'varchar', nullable: true },
      is_active: { type: 'boolean', nullable: false, default: true },
      severity: { type: 'varchar', nullable: false, default: 'medium' },
      created_by: { type: 'integer', nullable: false },
      created_at: { type: 'datetime', nullable: false },
      updated_at: { type: 'datetime', nullable: false }
    },
    indexes: [
      { name: 'idx_alert_rules_is_active', columns: ['is_active'] },
      { name: 'idx_alert_rules_device_type', columns: ['device_type'] },
      { name: 'idx_alert_rules_device_id', columns: ['device_id'] },
      { name: 'idx_alert_rules_created_by', columns: ['created_by'] }
    ],
    foreignKeys: [{ column: 'created_by', references: 'users.id', onDelete: 'CASCADE' }]
  },

  alerts: {
    columns: {
      id: { type: 'integer', nullable: false, primary: true },
      rule_id: { type: 'integer', nullable: false },
      device_id: { type: 'varchar', nullable: false },
      message: { type: 'text', nullable: false },
      severity: { type: 'varchar', nullable: false },
      status: { type: 'varchar', nullable: false, default: 'active' },
      triggered_at: { type: 'datetime', nullable: false },
      acknowledged_at: { type: 'datetime', nullable: true },
      acknowledged_by: { type: 'integer', nullable: true },
      resolved_at: { type: 'datetime', nullable: true },
      resolved_by: { type: 'integer', nullable: true },
      created_at: { type: 'datetime', nullable: false }
    },
    indexes: [
      { name: 'idx_alerts_rule_id', columns: ['rule_id'] },
      { name: 'idx_alerts_device_id', columns: ['device_id'] },
      { name: 'idx_alerts_status', columns: ['status'] },
      { name: 'idx_alerts_severity', columns: ['severity'] },
      { name: 'idx_alerts_triggered_at', columns: ['triggered_at'] }
    ],
    foreignKeys: [
      { column: 'rule_id', references: 'alert_rules.id', onDelete: 'CASCADE' },
      { column: 'acknowledged_by', references: 'users.id', onDelete: 'SET NULL' },
      { column: 'resolved_by', references: 'users.id', onDelete: 'SET NULL' }
    ]
  }
};

// Schema验证器类
export class SchemaValidator {
  constructor(database) {
    this.db = database;
    this.validationResults = {
      tables: {},
      columns: {},
      indexes: {},
      foreignKeys: {},
      overall: { valid: true, errors: [], warnings: [] }
    };
  }

  // 验证所有表结构
  async validateSchema() {
    logger.info('开始数据库Schema验证');

    try {
      // 检查表是否存在
      await this.validateTables();

      // 检查列结构
      await this.validateColumns();

      // 检查索引
      await this.validateIndexes();

      // 检查外键约束
      await this.validateForeignKeys();

      // 生成验证报告
      const report = this.generateValidationReport();

      if (this.validationResults.overall.valid) {
        logger.info('数据库Schema验证通过', { report });
      } else {
        logger.error('数据库Schema验证失败', { report });
      }

      return report;
    } catch (error) {
      logger.error('Schema验证过程中发生错误', { error: error.message });
      throw error;
    }
  }

  // 验证表是否存在
  async validateTables() {
    const existingTables = await this.db.raw("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = existingTables
      .map((row) => row.name)
      .filter((name) => !name.startsWith('sqlite_'));

    for (const [tableName] of Object.entries(EXPECTED_TABLES)) {
      const exists = tableNames.includes(tableName);
      this.validationResults.tables[tableName] = {
        exists,
        valid: exists
      };

      if (!exists) {
        this.addError(`表 '${tableName}' 不存在`);
      }
    }

    // 检查是否有多余的表
    const expectedTableNames = Object.keys(EXPECTED_TABLES);
    const extraTables = tableNames.filter((name) => !expectedTableNames.includes(name));

    if (extraTables.length > 0) {
      this.addWarning(`发现额外的表: ${extraTables.join(', ')}`);
    }
  }

  // 验证列结构
  async validateColumns() {
    for (const [tableName, tableSchema] of Object.entries(EXPECTED_TABLES)) {
      if (!this.validationResults.tables[tableName]?.exists) {
        continue;
      }

      try {
        const columnInfo = await this.db.raw(`PRAGMA table_info(${tableName})`);
        const existingColumns = {};

        columnInfo.forEach((col) => {
          existingColumns[col.name] = {
            type: col.type.toLowerCase(),
            nullable: col.notnull === 0,
            default: col.dflt_value,
            primary: col.pk === 1
          };
        });

        this.validationResults.columns[tableName] = {
          expected: Object.keys(tableSchema.columns).length,
          actual: Object.keys(existingColumns).length,
          missing: [],
          extra: [],
          typeMismatches: []
        };

        // 检查缺失的列
        for (const [columnName, columnSchema] of Object.entries(tableSchema.columns)) {
          if (!existingColumns[columnName]) {
            this.validationResults.columns[tableName].missing.push(columnName);
            this.addError(`表 '${tableName}' 缺少列 '${columnName}'`);
          } else {
            // 检查类型匹配
            const expectedType = this.normalizeType(columnSchema.type);
            const actualType = this.normalizeType(existingColumns[columnName].type);

            if (expectedType !== actualType) {
              this.validationResults.columns[tableName].typeMismatches.push({
                column: columnName,
                expected: expectedType,
                actual: actualType
              });
              this.addWarning(
                `表 '${tableName}' 列 '${columnName}' 类型不匹配: 期望 ${expectedType}, 实际 ${actualType}`
              );
            }
          }
        }

        // 检查多余的列
        const expectedColumns = Object.keys(tableSchema.columns);
        const extraColumns = Object.keys(existingColumns).filter(
          (name) => !expectedColumns.includes(name)
        );

        if (extraColumns.length > 0) {
          this.validationResults.columns[tableName].extra = extraColumns;
          this.addWarning(`表 '${tableName}' 有额外的列: ${extraColumns.join(', ')}`);
        }
      } catch (error) {
        this.addError(`验证表 '${tableName}' 列结构时发生错误: ${error.message}`);
      }
    }
  }

  // 验证索引
  async validateIndexes() {
    for (const [tableName, tableSchema] of Object.entries(EXPECTED_TABLES)) {
      if (!this.validationResults.tables[tableName]?.exists || !tableSchema.indexes) {
        continue;
      }

      try {
        const indexInfo = await this.db.raw(`PRAGMA index_list(${tableName})`);
        const existingIndexes = indexInfo.map((idx) => idx.name);

        this.validationResults.indexes[tableName] = {
          expected: tableSchema.indexes.length,
          actual: existingIndexes.length,
          missing: [],
          extra: []
        };

        // 检查缺失的索引
        for (const expectedIndex of tableSchema.indexes) {
          if (!existingIndexes.includes(expectedIndex.name)) {
            this.validationResults.indexes[tableName].missing.push(expectedIndex.name);
            this.addWarning(`表 '${tableName}' 缺少索引 '${expectedIndex.name}'`);
          }
        }
      } catch (error) {
        this.addError(`验证表 '${tableName}' 索引时发生错误: ${error.message}`);
      }
    }
  }

  // 验证外键约束
  async validateForeignKeys() {
    for (const [tableName, tableSchema] of Object.entries(EXPECTED_TABLES)) {
      if (!this.validationResults.tables[tableName]?.exists || !tableSchema.foreignKeys) {
        continue;
      }

      try {
        const foreignKeyInfo = await this.db.raw(`PRAGMA foreign_key_list(${tableName})`);
        const existingForeignKeys = foreignKeyInfo.map((fk) => ({
          column: fk.from,
          references: `${fk.table}.${fk.to}`
        }));

        this.validationResults.foreignKeys[tableName] = {
          expected: tableSchema.foreignKeys.length,
          actual: existingForeignKeys.length,
          missing: []
        };

        // 检查缺失的外键
        for (const expectedFk of tableSchema.foreignKeys) {
          const exists = existingForeignKeys.some(
            (fk) => fk.column === expectedFk.column && fk.references === expectedFk.references
          );

          if (!exists) {
            this.validationResults.foreignKeys[tableName].missing.push(expectedFk);
            this.addWarning(
              `表 '${tableName}' 缺少外键约束: ${expectedFk.column} -> ${expectedFk.references}`
            );
          }
        }
      } catch (error) {
        this.addError(`验证表 '${tableName}' 外键约束时发生错误: ${error.message}`);
      }
    }
  }

  // 标准化数据类型
  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)
  normalizeType(type) {
    const typeMap = {
      varchar: 'text',
      char: 'text',
      string: 'text',
      int: 'integer',
      bigint: 'integer',
      float: 'real',
      double: 'real',
      decimal: 'real',
      numeric: 'real',
      bool: 'integer',
      boolean: 'integer',
      datetime: 'text',
      timestamp: 'text',
      date: 'text',
      time: 'text'
    };

    const [normalizedType] = type.toLowerCase().split('(');
    return typeMap[normalizedType] || normalizedType;
  }

  // 添加错误
  addError(message) {
    this.validationResults.overall.errors.push(message);
    this.validationResults.overall.valid = false;
  }

  // 添加警告
  addWarning(message) {
    this.validationResults.overall.warnings.push(message);
  }

  // 生成验证报告
  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      valid: this.validationResults.overall.valid,
      summary: {
        totalTables: Object.keys(EXPECTED_TABLES).length,
        validTables: Object.values(this.validationResults.tables).filter((t) => t.valid).length,
        totalErrors: this.validationResults.overall.errors.length,
        totalWarnings: this.validationResults.overall.warnings.length
      },
      details: this.validationResults
    };

    return report;
  }

  // 生成修复建议
  generateFixSuggestions() {
    const suggestions = [];

    // 缺失表的建议
    for (const [tableName, tableResult] of Object.entries(this.validationResults.tables)) {
      if (!tableResult.exists) {
        suggestions.push({
          type: 'CREATE_TABLE',
          table: tableName,
          description: `创建缺失的表 '${tableName}'`,
          sql: this.generateCreateTableSQL(tableName)
        });
      }
    }

    // 缺失列的建议
    for (const [tableName, columnResult] of Object.entries(this.validationResults.columns)) {
      for (const missingColumn of columnResult.missing || []) {
        suggestions.push({
          type: 'ADD_COLUMN',
          table: tableName,
          column: missingColumn,
          description: `在表 '${tableName}' 中添加缺失的列 '${missingColumn}'`,
          sql: this.generateAddColumnSQL(tableName, missingColumn)
        });
      }
    }

    // 缺失索引的建议
    for (const [tableName, indexResult] of Object.entries(this.validationResults.indexes)) {
      for (const missingIndex of indexResult.missing || []) {
        const indexSchema = EXPECTED_TABLES[tableName].indexes.find(
          (idx) => idx.name === missingIndex
        );
        if (indexSchema) {
          suggestions.push({
            type: 'CREATE_INDEX',
            table: tableName,
            index: missingIndex,
            description: `在表 '${tableName}' 上创建缺失的索引 '${missingIndex}'`,
            sql: this.generateCreateIndexSQL(indexSchema)
          });
        }
      }
    }

    return suggestions;
  }

  // 生成创建表的SQL
  generateCreateTableSQL(tableName) {
    const tableSchema = EXPECTED_TABLES[tableName];
    if (!tableSchema) {
      return null;
    }

    const columns = Object.entries(tableSchema.columns).map(([name, schema]) => {
      let columnDef = `${name} ${schema.type.toUpperCase()}`;

      if (schema.primary) {
        columnDef += ' PRIMARY KEY';
      }

      if (!schema.nullable) {
        columnDef += ' NOT NULL';
      }

      if (schema.default !== undefined) {
        columnDef += ` DEFAULT ${schema.default}`;
      }

      if (schema.unique) {
        columnDef += ' UNIQUE';
      }

      return columnDef;
    });

    return `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;
  }

  // 生成添加列的SQL
  generateAddColumnSQL(tableName, columnName) {
    const columnSchema = EXPECTED_TABLES[tableName]?.columns[columnName];
    if (!columnSchema) {
      return null;
    }

    let columnDef = `${columnName} ${columnSchema.type.toUpperCase()}`;

    if (!columnSchema.nullable) {
      columnDef += ' NOT NULL';
    }

    if (columnSchema.default !== undefined) {
      columnDef += ` DEFAULT ${columnSchema.default}`;
    }

    return `ALTER TABLE ${tableName} ADD COLUMN ${columnDef};`;
  }

  // 生成创建索引的SQL
  generateCreateIndexSQL(indexSchema) {
    const uniqueClause = indexSchema.unique ? 'UNIQUE ' : '';
    const columns = indexSchema.columns.join(', ');

    return `CREATE ${uniqueClause}INDEX ${indexSchema.name} ON ${indexSchema.table || 'table_name'} (${columns});`;
  }
}

// 导出验证函数
export async function validateDatabaseSchema(database) {
  const validator = new SchemaValidator(database);
  return await validator.validateSchema();
}

export async function generateSchemaFixSuggestions(database) {
  const validator = new SchemaValidator(database);
  await validator.validateSchema();
  return validator.generateFixSuggestions();
}

export { EXPECTED_TABLES };
