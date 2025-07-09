-- 添加储能设备类型
INSERT INTO device_types (id, name, code, description, category, manufacturer, data_schema, created_at, updated_at)
SELECT 'dt-battery-storage', '储能电池', 'battery-storage', '用于存储电能的储能设备', '储能', '特斯拉', '{"soc": "number", "power": "number", "voltage": "number", "temperature": "number", "charge_status": "string"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM device_types WHERE code = 'battery-storage'
);

-- 创建储能设备数据索引（移除子查询以兼容SQLite）
CREATE INDEX IF NOT EXISTS idx_energy_data_battery ON energy_data(device_id);