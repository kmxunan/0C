-- 添加储能设备类型
INSERT INTO device_types (id, name, description, category, manufacturer, data_schema, created_at, updated_at)
VALUES
('dt-battery-storage', '储能电池', '用于存储电能的储能设备', '储能', '特斯拉', '{"soc": "number", "power": "number", "voltage": "number", "temperature": "number", "charge_status": "string"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 创建储能设备数据索引
CREATE INDEX IF NOT EXISTS idx_energy_data_battery ON energy_data(device_id) WHERE device_id IN (
  SELECT id FROM devices WHERE type = 'dt-battery-storage'
);