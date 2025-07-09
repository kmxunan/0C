exports.up = function (knex) {
  return (
    knex.schema
      // 能源数据表
      .hasTable('energy_data')
      .then((exists) => {
        if (!exists) {
          return knex.schema.createTable('energy_data', (table) => {
            table.string('id').primary();
            table.string('device_id').notNullable().references('id').inTable('devices');
            table.datetime('timestamp').notNullable();
            table.decimal('energy_consumption', 10, 2);
            table.decimal('power', 10, 2);
            table.decimal('voltage', 10, 2);
            table.decimal('current', 10, 2);
            table.decimal('frequency', 10, 2);
            table.decimal('power_factor', 5, 4);
            table.datetime('created_at').defaultTo(knex.fn.now());
          });
        }
      })
      // 碳排放数据表
      .then(() => knex.schema.hasTable('carbon_data'))
      .then((exists) => {
        if (!exists) {
          return knex.schema.createTable('carbon_data', (table) => {
            table.string('id').primary();
            table.string('device_id').notNullable().references('id').inTable('devices');
            table.datetime('timestamp').notNullable();
            table.decimal('carbon_emission', 10, 2);
            table.decimal('intensity', 10, 2);
            table.datetime('created_at').defaultTo(knex.fn.now());
          });
        }
      })
  );
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('carbon_data').dropTableIfExists('energy_data');
};
