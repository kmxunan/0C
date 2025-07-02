/**
 * 创建设备基础表
 */

exports.up = async function(knex) {
  return knex.schema.createTable('devices', (table) => {
    table.specificType('id', 'CHAR(36)').defaultTo(knex.raw('(UUID())')).primary().comment('设备ID');
    table.string('name').notNullable().comment('设备名称');
    table.string('type').notNullable().comment('设备类型');
    table.string('model').comment('设备型号');
    table.string('manufacturer').comment('制造商');
    table.json('metadata').comment('设备元数据');
    table.boolean('is_active').defaultTo(true).comment('是否激活');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('创建时间');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('更新时间');
  });
};

exports.down = async function(knex) {
  return knex.schema.dropTableIfExists('devices');
};