exports.up = function (knex) {
  return knex.schema.createTable('device_types', function (table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('code').notNullable().unique();
    table.text('description');
    table.string('category');
    table.string('manufacturer');
    table.boolean('is_active').defaultTo(true);
    table.string('data_schema', 1000); // Change to string with length for SQLite compatibility
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('device_types');
};
