/**
 * VPP交易策略API服务
 * 提供与后端交易策略相关的API接口
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// 创建axios实例
const api = axios.create({
    baseURL: `${API_BASE_URL}/vpp/trading-strategy`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // 处理认证错误
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = '/login';
            return Promise.reject(new Error('认证失败，请重新登录'));
        }
    
        // 处理其他HTTP错误
        const message = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                '网络请求失败';
    
        return Promise.reject(new Error(message));
    }
);

/**
 * VPP交易策略API服务类
 */
export const vppTradingStrategyAPI = {
    /**
     * 获取策略列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.limit - 每页数量
     * @param {string} params.type - 策略类型过滤
     * @param {string} params.status - 状态过滤
     * @param {string} params.search - 搜索关键词
     * @returns {Promise<Object>} 策略列表响应
     */
    async getStrategies(params = {}) {
        try {
            const response = await api.get('/strategies', { params });
            return response;
        } catch (error) {
            console.error('获取策略列表失败:', error);
            throw error;
        }
    },

    /**
     * 创建新策略
     * @param {Object} strategyData - 策略数据
     * @param {string} strategyData.name - 策略名称
     * @param {string} strategyData.description - 策略描述
     * @param {string} strategyData.type - 策略类型
     * @param {number} strategyData.priority - 优先级
     * @param {Object} strategyData.config - 策略配置
     * @param {Object} strategyData.riskParameters - 风险参数
     * @param {Object} strategyData.performanceTargets - 性能目标
     * @returns {Promise<Object>} 创建结果
     */
    async createStrategy(strategyData) {
        try {
            const response = await api.post('/strategies', {
                strategy_name: strategyData.name,
                description: strategyData.description,
                strategy_type: strategyData.type,
                priority: strategyData.priority,
                strategy_config: strategyData.config,
                risk_parameters: strategyData.riskParameters,
                performance_targets: strategyData.performanceTargets
            });
            return response;
        } catch (error) {
            console.error('创建策略失败:', error);
            throw error;
        }
    },

    /**
     * 获取策略详情
     * @param {string} strategyId - 策略ID
     * @returns {Promise<Object>} 策略详情
     */
    async getStrategyDetails(strategyId) {
        try {
            const response = await api.get(`/strategies/${strategyId}`);
            return response;
        } catch (error) {
            console.error('获取策略详情失败:', error);
            throw error;
        }
    },

    /**
     * 更新策略
     * @param {string} strategyId - 策略ID
     * @param {Object} updateData - 更新数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateStrategy(strategyId, updateData) {
        try {
            const response = await api.put(`/strategies/${strategyId}`, updateData);
            return response;
        } catch (error) {
            console.error('更新策略失败:', error);
            throw error;
        }
    },

    /**
     * 删除策略
     * @param {string} strategyId - 策略ID
     * @returns {Promise<Object>} 删除结果
     */
    async deleteStrategy(strategyId) {
        try {
            const response = await api.delete(`/strategies/${strategyId}`);
            return response;
        } catch (error) {
            console.error('删除策略失败:', error);
            throw error;
        }
    },

    /**
     * 激活策略
     * @param {string} strategyId - 策略ID
     * @returns {Promise<Object>} 激活结果
     */
    async activateStrategy(strategyId) {
        try {
            const response = await api.post(`/strategies/${strategyId}/activate`);
            return response;
        } catch (error) {
            console.error('激活策略失败:', error);
            throw error;
        }
    },

    /**
     * 停用策略
     * @param {string} strategyId - 策略ID
     * @returns {Promise<Object>} 停用结果
     */
    async deactivateStrategy(strategyId) {
        try {
            const response = await api.post(`/strategies/${strategyId}/deactivate`);
            return response;
        } catch (error) {
            console.error('停用策略失败:', error);
            throw error;
        }
    },

    /**
     * 为策略添加规则
     * @param {string} strategyId - 策略ID
     * @param {Object} ruleData - 规则数据
     * @param {string} ruleData.name - 规则名称
     * @param {string} ruleData.description - 规则描述
     * @param {Array} ruleData.conditions - 条件列表
     * @param {Array} ruleData.actions - 动作列表
     * @param {boolean} ruleData.isEnabled - 是否启用
     * @param {Object} ruleData.executionConfig - 执行配置
     * @returns {Promise<Object>} 添加结果
     */
    async addRuleToStrategy(strategyId, ruleData) {
        try {
            const response = await api.post(`/strategies/${strategyId}/rules`, {
                rule_name: ruleData.name,
                description: ruleData.description,
                conditions: ruleData.conditions,
                actions: ruleData.actions,
                is_enabled: ruleData.isEnabled,
                execution_config: ruleData.executionConfig
            });
            return response;
        } catch (error) {
            console.error('添加规则失败:', error);
            throw error;
        }
    },

    /**
     * 更新规则
     * @param {string} strategyId - 策略ID
     * @param {string} ruleId - 规则ID
     * @param {Object} updateData - 更新数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateRule(strategyId, ruleId, updateData) {
        try {
            const response = await api.put(`/strategies/${strategyId}/rules/${ruleId}`, updateData);
            return response;
        } catch (error) {
            console.error('更新规则失败:', error);
            throw error;
        }
    },

    /**
     * 删除规则
     * @param {string} strategyId - 策略ID
     * @param {string} ruleId - 规则ID
     * @returns {Promise<Object>} 删除结果
     */
    async deleteRule(strategyId, ruleId) {
        try {
            const response = await api.delete(`/strategies/${strategyId}/rules/${ruleId}`);
            return response;
        } catch (error) {
            console.error('删除规则失败:', error);
            throw error;
        }
    },

    /**
     * 启用/禁用规则
     * @param {string} strategyId - 策略ID
     * @param {string} ruleId - 规则ID
     * @param {boolean} enabled - 是否启用
     * @returns {Promise<Object>} 操作结果
     */
    async toggleRule(strategyId, ruleId, enabled) {
        try {
            const response = await api.patch(`/strategies/${strategyId}/rules/${ruleId}`, {
                is_enabled: enabled
            });
            return response;
        } catch (error) {
            console.error('切换规则状态失败:', error);
            throw error;
        }
    },

    /**
     * 获取枚举值
     * @returns {Promise<Object>} 枚举值对象
     */
    async getEnums() {
        try {
            const response = await api.get('/enums');
            return response;
        } catch (error) {
            console.error('获取枚举值失败:', error);
            throw error;
        }
    },

    /**
     * 获取服务状态
     * @returns {Promise<Object>} 服务状态
     */
    async getServiceStatus() {
        try {
            const response = await api.get('/status');
            return response;
        } catch (error) {
            console.error('获取服务状态失败:', error);
            throw error;
        }
    },

    /**
     * 获取策略统计信息
     * @param {Object} params - 查询参数
     * @param {string} params.period - 统计周期 (day/week/month)
     * @param {string} params.startDate - 开始日期
     * @param {string} params.endDate - 结束日期
     * @returns {Promise<Object>} 统计信息
     */
    async getStrategyStatistics(params = {}) {
        try {
            const response = await api.get('/statistics', { params });
            return response;
        } catch (error) {
            console.error('获取策略统计失败:', error);
            throw error;
        }
    },

    /**
     * 获取策略执行历史
     * @param {string} strategyId - 策略ID
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.limit - 每页数量
     * @param {string} params.startDate - 开始日期
     * @param {string} params.endDate - 结束日期
     * @returns {Promise<Object>} 执行历史
     */
    async getExecutionHistory(strategyId, params = {}) {
        try {
            const response = await api.get(`/strategies/${strategyId}/executions`, { params });
            return response;
        } catch (error) {
            console.error('获取执行历史失败:', error);
            throw error;
        }
    },

    /**
     * 测试策略规则
     * @param {string} strategyId - 策略ID
     * @param {Object} testData - 测试数据
     * @returns {Promise<Object>} 测试结果
     */
    async testStrategy(strategyId, testData) {
        try {
            const response = await api.post(`/strategies/${strategyId}/test`, testData);
            return response;
        } catch (error) {
            console.error('测试策略失败:', error);
            throw error;
        }
    },

    /**
     * 导出策略配置
     * @param {string} strategyId - 策略ID
     * @returns {Promise<Blob>} 导出文件
     */
    async exportStrategy(strategyId) {
        try {
            const response = await api.get(`/strategies/${strategyId}/export`, {
                responseType: 'blob'
            });
            return response;
        } catch (error) {
            console.error('导出策略失败:', error);
            throw error;
        }
    },

    /**
     * 导入策略配置
     * @param {File} file - 策略配置文件
     * @returns {Promise<Object>} 导入结果
     */
    async importStrategy(file) {
        try {
            const formData = new FormData();
            formData.append('strategy_file', file);
            const response = await api.post('/strategies/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response;
        } catch (error) {
            console.error('导入策略失败:', error);
            throw error;
        }
    },

    /**
     * 克隆策略
     * @param {string} strategyId - 源策略ID
     * @param {string} newName - 新策略名称
     * @returns {Promise<Object>} 克隆结果
     */
    async cloneStrategy(strategyId, newName) {
        try {
            const response = await api.post(`/strategies/${strategyId}/clone`, {
                new_name: newName
            });
            return response;
        } catch (error) {
            console.error('克隆策略失败:', error);
            throw error;
        }
    },

    /**
     * 获取策略性能分析
     * @param {string} strategyId - 策略ID
     * @param {Object} params - 分析参数
     * @returns {Promise<Object>} 性能分析结果
     */
    async getPerformanceAnalysis(strategyId, params = {}) {
        try {
            const response = await api.get(`/strategies/${strategyId}/performance`, { params });
            return response;
        } catch (error) {
            console.error('获取性能分析失败:', error);
            throw error;
        }
    },

    /**
     * 获取策略风险评估
     * @param {string} strategyId - 策略ID
     * @returns {Promise<Object>} 风险评估结果
     */
    async getRiskAssessment(strategyId) {
        try {
            const response = await api.get(`/strategies/${strategyId}/risk-assessment`);
            return response;
        } catch (error) {
            console.error('获取风险评估失败:', error);
            throw error;
        }
    },

    /**
     * 获取市场数据用于策略回测
     * @param {Object} params - 查询参数
     * @param {string} params.market - 市场类型
     * @param {string} params.startDate - 开始日期
     * @param {string} params.endDate - 结束日期
     * @param {string} params.interval - 数据间隔
     * @returns {Promise<Object>} 市场数据
     */
    async getMarketDataForBacktest(params) {
        try {
            const response = await api.get('/market-data', { params });
            return response;
        } catch (error) {
            console.error('获取市场数据失败:', error);
            throw error;
        }
    },

    /**
     * 执行策略回测
     * @param {string} strategyId - 策略ID
     * @param {Object} backtestConfig - 回测配置
     * @returns {Promise<Object>} 回测结果
     */
    async runBacktest(strategyId, backtestConfig) {
        try {
            const response = await api.post(`/strategies/${strategyId}/backtest`, backtestConfig);
            return response;
        } catch (error) {
            console.error('执行回测失败:', error);
            throw error;
        }
    }
};

// 默认导出
export default vppTradingStrategyAPI;