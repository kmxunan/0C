exports.up = function (knex) {
  return knex.schema.createTable('users', function (table) {
    table.string('id').primary();
    table.string('username').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('role').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};
