import Recommendation from '../models/recommendation.js';
import { validationResult } from 'express-validator';

/**
 * 创建推荐规则
 * @route POST /api/recommendations/rules
 * @access Private
 */
export const createRecommendationRule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rule = await Recommendation.createRule(req.body);
    res.status(201).json({
      message: '推荐规则创建成功',
      rule
    });
  } catch (error) {
    console.error('创建推荐规则失败:', error);
    res.status(500).json({
      message: '创建推荐规则失败',
      error: error.message
    });
  }
};

/**
 * 获取所有推荐规则
 * @route GET /api/recommendations/rules
 * @access Private
 */
export const getAllRecommendationRules = async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined
    };

    const rules = await Recommendation.getAllRules(filters);
    res.status(200).json(rules);
  } catch (error) {
    console.error('获取推荐规则失败:', error);
    res.status(500).json({
      message: '获取推荐规则失败',
      error: error.message
    });
  }
};

/**
 * 根据ID获取推荐规则
 * @route GET /api/recommendations/rules/:id
 * @access Private
 */
export const getRecommendationRuleById = async (req, res) => {
  try {
    const rule = await Recommendation.getRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: '推荐规则不存在' });
    }

    res.status(200).json(rule);
  } catch (error) {
    console.error('获取推荐规则失败:', error);
    res.status(500).json({
      message: '获取推荐规则失败',
      error: error.message
    });
  }
};

/**
 * 更新推荐规则
 * @route PUT /api/recommendations/rules/:id
 * @access Private
 */
export const updateRecommendationRule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rule = await Recommendation.updateRule(req.params.id, req.body);
    if (!rule) {
      return res.status(404).json({ message: '推荐规则不存在' });
    }

    res.status(200).json({
      message: '推荐规则更新成功',
      rule
    });
  } catch (error) {
    console.error('更新推荐规则失败:', error);
    res.status(500).json({
      message: '更新推荐规则失败',
      error: error.message
    });
  }
};

/**
 * 激活/禁用推荐规则
 * @route PATCH /api/recommendations/rules/:id/status
 * @access Private
 */
export const toggleRecommendationRuleStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) {
      return res.status(400).json({ message: '必须提供is_active参数' });
    }

    const rule = await Recommendation.toggleRuleStatus(req.params.id, is_active);
    if (!rule) {
      return res.status(404).json({ message: '推荐规则不存在' });
    }

    res.status(200).json({
      message: `推荐规则已${is_active ? '激活' : '禁用'}`,
      rule
    });
  } catch (error) {
    console.error('更新推荐规则状态失败:', error);
    res.status(500).json({
      message: '更新推荐规则状态失败',
      error: error.message
    });
  }
};

/**
 * 删除推荐规则
 * @route DELETE /api/recommendations/rules/:id
 * @access Private
 */
export const deleteRecommendationRule = async (req, res) => {
  try {
    const deletedRows = await Recommendation.deleteRule(req.params.id);
    if (deletedRows === 0) {
      return res.status(404).json({ message: '推荐规则不存在' });
    }

    res.status(200).json({ message: '推荐规则删除成功' });
  } catch (error) {
    console.error('删除推荐规则失败:', error);
    res.status(500).json({
      message: '删除推荐规则失败',
      error: error.message
    });
  }
};

/**
 * 生成推荐
 * @route POST /api/recommendations/generate
 * @access Private
 */
export const generateRecommendations = async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ message: '必须提供用户上下文数据' });
    }

    const recommendations = await Recommendation.generateRecommendations(context);
    res.status(200).json({
      message: '推荐生成成功',
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    console.error('生成推荐失败:', error);
    res.status(500).json({
      message: '生成推荐失败',
      error: error.message
    });
  }
};