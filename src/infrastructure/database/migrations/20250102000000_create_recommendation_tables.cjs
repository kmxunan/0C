/**
 * 创建推荐规则和推荐结果表
 */

exports.up = async function (knex) {
  // 创建推荐规则表
  await knex.schema.createTable('recommendation_rules', (table) => {
    table
      .specificType('id', 'CHAR(36)')
      .defaultTo(knex.raw('(UUID())'))
      .primary()
      .comment('规则ID');
    table.string('name').notNullable().comment('规则名称');
    table.text('description').comment('规则描述');
    table
      .string('type')
      .notNullable()
      .comment('规则类型: energy_saving, cost_reduction, comfort_improvement等');
    table.integer('priority').defaultTo(5).comment('规则优先级: 1-10，10为最高');
    table.json('conditions').notNullable().comment('规则条件，JSON格式');
    table.json('actions').notNullable().comment('规则执行动作，JSON格式');
    table.boolean('is_active').defaultTo(true).comment('是否激活');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('创建时间');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('更新时间');
  });

  // 创建推荐结果表
  await knex.schema.createTable('recommendations', (table) => {
    table
      .specificType('id', 'CHAR(36)')
      .defaultTo(knex.raw('(UUID())'))
      .primary()
      .comment('推荐ID');
    table.uuid('rule_id').notNullable().comment('关联的规则ID');
    table.string('rule_name').notNullable().comment('规则名称');
    table.text('description').comment('推荐描述');
    table.json('actions').notNullable().comment('推荐动作，JSON格式');
    table.integer('priority').notNullable().comment('推荐优先级');
    table.json('context').comment('生成推荐时的上下文数据');
    table.timestamp('generated_at').notNullable().defaultTo(knex.fn.now()).comment('生成时间');
    table.timestamp('viewed_at').comment('查看时间');
    table.timestamp('applied_at').comment('应用时间');
    table
      .string('status')
      .defaultTo('pending')
      .comment('状态: pending, viewed, applied, dismissed');

    // 添加外键约束
    table
      .foreign('rule_id')
      .references('id')
      .inTable('recommendation_rules')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });

  // 创建索引
  await knex.schema.table('recommendation_rules', (table) => {
    table.index('type');
    table.index('is_active');
  });

  await knex.schema.table('recommendations', (table) => {
    table.index('rule_id');
    table.index('status');
    table.index('generated_at');
  });
};

exports.down = async function (knex) {
  // 先删除依赖表
  await knex.schema.dropTableIfExists('recommendations');
  // 再删除主表
  await knex.schema.dropTableIfExists('recommendation_rules');
};
