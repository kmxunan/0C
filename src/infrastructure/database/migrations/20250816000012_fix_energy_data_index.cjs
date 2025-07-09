'use strict';

/**
 * 修复储能设备数据索引，移除SQLite不支持的子查询
 */
exports.up = async function (knex) {
  // 删除旧的部分索引（如果存在）
  await knex.raw('DROP INDEX IF EXISTS idx_energy_data_battery');

  // 创建新的普通索引
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_energy_data_battery ON energy_data(device_id)');
};

exports.down = async function (knex) {
  // 回滚：恢复旧的部分索引
  await knex.raw('DROP INDEX IF EXISTS idx_energy_data_battery');
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_energy_data_battery ON energy_data(device_id) WHERE device_id IN (SELECT id FROM devices WHERE type = ?)',
    ['dt-battery-storage']
  );
};
