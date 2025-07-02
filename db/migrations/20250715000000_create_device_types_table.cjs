'use strict';

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('device_types', (table) => {
    table.text('id').primary();
    table.text('name').notNullable().unique();
    table.text('description');
    table.text('category');
    table.text('manufacturer');
    table.text('data_schema').notNullable();
    table.text('created_at').notNullable();
    table.text('updated_at').notNullable();
  });

  return knex('device_types').insert([
    {
      id: 'dt-elec-meter',
      name: '智能电表',
      description: '用于测量电力消耗的智能设备',
      category: '电力',
      manufacturer: '施耐德',
      data_schema: JSON.stringify({
        energy_consumption: 'number',
        power: 'number',
        voltage: 'number',
        current: 'number'
      }),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'dt-carbon-sensor',
      name: '碳排放传感器',
      description: '用于监测碳排放的传感器',
      category: '环境',
      manufacturer: '西门子',
      data_schema: JSON.stringify({
        carbon_emission: 'number',
        intensity: 'number'
      }),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'dt-thermostat',
      name: '智能温控器',
      description: '用于控制温度的智能设备',
      category: '暖通',
      manufacturer: '霍尼韦尔',
      data_schema: JSON.stringify({
        temperature: 'number',
        humidity: 'number',
        mode: 'string'
      }),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};

exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_devices_type');
  return knex.schema.dropTable('device_types');
};