import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

class Recommendation {
  /**
   * 创建推荐规则
   * @param {Object} ruleData - 推荐规则数据
   * @returns {Promise<Object>} 创建的推荐规则
   */
  static async createRule(ruleData) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const rule = {
      id,
      name: ruleData.name,
      description: ruleData.description,
      type: ruleData.type,
      priority: ruleData.priority || 5,
      conditions: JSON.stringify(ruleData.conditions),
      actions: JSON.stringify(ruleData.actions),
      is_active: ruleData.is_active !== undefined ? ruleData.is_active : true,
      created_at: timestamp,
      updated_at: timestamp
    };

    await db('recommendation_rules').insert(rule);
    return this.getRuleById(id);
  }

  /**
   * 获取所有推荐规则
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 推荐规则列表
   */
  static async getAllRules(filters = {}) {
    let query = db('recommendation_rules');

    if (filters.type) {
      query = query.where({ type: filters.type });
    }
    if (filters.is_active !== undefined) {
      query = query.where({ is_active: filters.is_active });
    }

    const rules = await query.orderBy('priority', 'desc');
    return rules.map(rule => this._parseRule(rule));
  }

  /**
   * 根据ID获取推荐规则
   * @param {string} id - 规则ID
   * @returns {Promise<Object>} 推荐规则
   */
  static async getRuleById(id) {
    const rule = await db('recommendation_rules').where({ id }).first();
    return rule ? this._parseRule(rule) : null;
  }

  /**
   * 更新推荐规则
   * @param {string} id - 规则ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的推荐规则
   */
  static async updateRule(id, updates) {
    updates.updated_at = new Date().toISOString();

    // 序列化JSON字段
    if (updates.conditions) updates.conditions = JSON.stringify(updates.conditions);
    if (updates.actions) updates.actions = JSON.stringify(updates.actions);

    await db('recommendation_rules').where({ id }).update(updates);
    return this.getRuleById(id);
  }

  /**
   * 激活/禁用推荐规则
   * @param {string} id - 规则ID
   * @param {boolean} isActive - 是否激活
   * @returns {Promise<Object>} 更新后的推荐规则
   */
  static async toggleRuleStatus(id, isActive) {
    await db('recommendation_rules').where({ id }).update({
      is_active: isActive,
      updated_at: new Date().toISOString()
    });
    return this.getRuleById(id);
  }

  /**
   * 删除推荐规则
   * @param {string} id - 规则ID
   * @returns {Promise<number>} 删除的行数
   */
  static async deleteRule(id) {
    return db('recommendation_rules').where({ id }).del();
  }

  /**
   * 生成推荐
   * @param {Object} userContext - 用户上下文数据
   * @returns {Promise<Array>} 推荐结果列表
   */
  static async generateRecommendations(userContext) {
    // 获取所有激活的规则
    const rules = await this.getAllRules({ is_active: true });
    const recommendations = [];

    // 评估每个规则是否适用
    for (const rule of rules) {
      if (this._evaluateConditions(rule.conditions, userContext)) {
        recommendations.push({
          id: uuidv4(),
          rule_id: rule.id,
          rule_name: rule.name,
          description: rule.description,
          actions: rule.actions,
          priority: rule.priority,
          generated_at: new Date().toISOString(),
          context: userContext
        });
      }
    }

    // 按优先级排序
    recommendations.sort((a, b) => b.priority - a.priority);

    // 保存推荐结果
    if (recommendations.length > 0) {
      await db('recommendations').insert(recommendations);
    }

    return recommendations;
  }

  /**
   * 评估规则条件
   * @param {Object} conditions - 规则条件
   * @param {Object} context - 用户上下文
   * @returns {boolean} 条件是否满足
   */
  static _evaluateConditions(conditions, context) {
    // 简单的条件评估逻辑，实际应用中可能需要更复杂的表达式解析
    if (!conditions || !conditions.operator) return true;

    switch (conditions.operator) {
      case 'and':
        return conditions.conditions.every(cond => 
          this._evaluateConditions(cond, context)
        );
      case 'or':
        return conditions.conditions.some(cond => 
          this._evaluateConditions(cond, context)
        );
      case 'equals':
        return context[conditions.field] === conditions.value;
      case 'greater_than':
        return context[conditions.field] > conditions.value;
      case 'less_than':
        return context[conditions.field] < conditions.value;
      case 'contains':
        return context[conditions.field] && 
               context[conditions.field].includes(conditions.value);
      default:
        return false;
    }
  }

  /**
   * 解析规则数据，将JSON字符串转换为对象
   * @param {Object} rule - 原始规则数据
   * @returns {Object} 解析后的规则数据
   */
  static _parseRule(rule) {
    return {
      ...rule,
      conditions: rule.conditions ? JSON.parse(rule.conditions) : {},
      actions: rule.actions ? JSON.parse(rule.actions) : {}
    };
  }
}

export default Recommendation;