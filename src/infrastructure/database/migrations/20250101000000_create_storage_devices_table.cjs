/**
 * 创建储能设备参数表
 */
exports.up = async function (knex) {
  return knex.schema.createTable('storage_devices', (table) => {
    table.specificType('id', 'CHAR(36)').defaultTo(knex.raw('(UUID())')).primary();
    table.string('device_id').notNullable().references('id').inTable('devices').onDelete('CASCADE');
    table.decimal('capacity', 10, 2).notNullable().comment('电池容量 (kWh)');
    table.decimal('efficiency', 5, 2).notNullable().comment('充放电效率');
    table.decimal('min_soc', 5, 2).notNullable().defaultTo(0.2).comment('最小荷电状态');
    table.decimal('max_soc', 5, 2).notNullable().defaultTo(0.8).comment('最大荷电状态');
    table.decimal('charge_rate', 5, 2).comment('充电速率 (kW)');
    table.decimal('discharge_rate', 5, 2).comment('放电速率 (kW)');
    table.string('battery_type').comment('电池类型');
    table.integer('cycle_life').comment('循环寿命');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  return knex.schema.dropTableIfExists('storage_devices');
};
