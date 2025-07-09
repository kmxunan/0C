const dotenv = require('dotenv');

dotenv.config();

module.exports.seed = async function(knex) {
  // 添加储能设备类型
  try {
    // 检查设备类型是否已存在（按code字段）
    const existingType = await knex('device_types').where({ code: 'battery-storage' }).first();
    if (existingType) {
      console.log('储能电池设备类型已存在');
      return;
    }

    // 检查 device_types 表的结构
    const tableInfo = await knex.raw('PRAGMA table_info(device_types)');
    console.log('device_types table info:', tableInfo);
    const dataSchemaColumn = tableInfo.find(col => col.name === 'data_schema');
    if (dataSchemaColumn) {
      console.log('data_schema column type:', dataSchemaColumn.type);
    } else {
      console.log('data_schema column not found in table info.');
    }
    console.log('Knex client:', knex.client.config.client);

    // 创建新设备类型
    const [batteryType] = await knex('device_types').insert({

      name: '储能电池',
      code: 'battery-storage',
      description: '用于存储电能的储能设备',
      category: '储能',
      manufacturer: '特斯拉',

      data_schema: JSON.stringify({
        type: 'object',
        properties: {
          capacity: { type: 'number', description: '容量 (kWh)' },
          charge_rate: { type: 'number', description: '充电速率 (kW)' },
          discharge_rate: { type: 'number', description: '放电速率 (kW)' },
          efficiency: { type: 'number', description: '效率 (%)' }
        }
      }),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    console.log('储能电池设备类型添加成功:', batteryType.id);
  } catch (error) {
    console.error('添加储能设备类型失败:', error.message);
  }
};