
exports.up = function(knex) {
  return knex.schema.createTable('notification_preferences', function(table) {
    table.increments('id').primary();
    table.string('user_id').notNullable().unique();
    table.boolean('email_enabled').defaultTo(true);
    table.boolean('sms_enabled').defaultTo(true);
    table.boolean('discord_enabled').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notification_preferences');
};
