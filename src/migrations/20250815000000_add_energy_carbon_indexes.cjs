'use strict';

/**
 * 添加能源和碳排放数据表的优化索引
 */
module.exports = {
  async up(knex) {
    // 为能源数据表添加复合索引，优化按日期和类型的聚合查询
    // 检查并创建能源数据表索引
    const hasEnergyIndex = await knex.schema.hasIndex('energy_data', 'idx_energy_data_timestamp_type');
    if (!hasEnergyIndex) {
      await knex.schema.table('energy_data', table => {
        table.index(['timestamp', 'device_id'], 'idx_energy_data_timestamp_type');
      });
    }
      
      // 为碳排放数据表添加索引
      await knex.schema.table('carbon_data', table => {
        table.index(['timestamp'], 'idx_carbon_data_timestamp');
        table.index(['device_id', 'timestamp'], 'idx_carbon_data_device_timestamp');
      });

    console.log('✅ 成功添加能源和碳排放数据表优化索引');
  },

  async down(knex) {
    // 回滚索引
    await knex.schema.table('energy_data', (table) => {
      table.dropIndex(['date', 'type'], 'idx_energy_data_date_type');
      table.dropIndex(['device_id', 'timestamp', 'data_type'], 'idx_energy_data_multi_key');
    });

    await knex.schema.table('carbon_data', (table) => {
      table.dropIndex(['date', 'energy_type'], 'idx_carbon_data_date_type');
      table.dropIndex(['energy_data_id', 'created_at'], 'idx_carbon_data_energy_created');
    });

    console.log('✅ 已回滚能源和碳排放数据表索引');
  }
};