exports.up = async function (knex) {
  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      data_type TEXT NOT NULL,
      device_id TEXT,
      conditions TEXT NOT NULL,
      actions TEXT NOT NULL DEFAULT '[]',
      severity TEXT NOT NULL DEFAULT 'medium',
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );
  `);

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      rule_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      description TEXT NOT NULL,
      data TEXT NOT NULL,
      resolution TEXT,
      resolved_by TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (rule_id) REFERENCES alert_rules(id),
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );
  `);

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      channels TEXT NOT NULL,
      severity_filters TEXT NOT NULL DEFAULT '["all"]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (alert_id) REFERENCES alerts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alert_rules_data_type ON alert_rules(data_type);
    CREATE INDEX IF NOT EXISTS idx_notification_logs_alert_id ON notification_logs(alert_id);
    CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notification_logs');
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('alerts');
  await knex.schema.dropTableIfExists('alert_rules');
};
