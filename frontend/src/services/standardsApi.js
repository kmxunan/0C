import { request } from './request';

/**
 * 标准管理API服务
 */
export const standardsApi = {
  /**
   * 获取支持的标准列表
   * @param {Object} params - 查询参数
   * @param {string} params.type - 标准类型
   * @param {string} params.industry - 适用行业
   * @returns {Promise}
   */
  getStandards: (params = {}) => {
    return request.get('/api/v2/standards', { params });
  },

  /**
   * 获取标准详情
   * @param {string} standardCode - 标准代码
   * @returns {Promise}
   */
  getStandardDetails: (standardCode) => {
    return request.get(`/api/v2/standards/${encodeURIComponent(standardCode)}`);
  },

  /**
   * 验证数据合规性
   * @param {string} standardCode - 标准代码
   * @param {Object} data - 待验证的数据
   * @returns {Promise}
   */
  validateCompliance: (standardCode, data) => {
    return request.post(`/api/v2/standards/${encodeURIComponent(standardCode)}/validate`, data);
  },

  /**
   * 多标准对比分析
   * @param {Array<string>} standardCodes - 标准代码列表
   * @param {Object} data - 待分析的数据
   * @returns {Promise}
   */
  compareStandards: (standardCodes, data) => {
    return request.post('/api/v2/standards/compare', data, {
      params: { standardCodes: standardCodes.join(',') }
    });
  },

  /**
   * 获取排放因子
   * @param {string} standardCode - 标准代码
   * @param {string} energyType - 能源类型（可选）
   * @returns {Promise}
   */
  getEmissionFactors: (standardCode, energyType = null) => {
    const params = energyType ? { energyType } : {};
    return request.get(`/api/v2/standards/${encodeURIComponent(standardCode)}/emission-factors`, { params });
  },

  /**
   * 获取最新排放因子
   * @param {string} factorCode - 因子代码
   * @returns {Promise}
   */
  getLatestEmissionFactor: (factorCode) => {
    return request.get(`/api/v2/standards/emission-factors/${encodeURIComponent(factorCode)}/latest`);
  },

  /**
   * 手动触发标准更新检查
   * @returns {Promise}
   */
  checkUpdates: () => {
    return request.post('/api/v2/standards/check-updates');
  },

  /**
   * 获取标准统计信息
   * @returns {Promise}
   */
  getStatistics: () => {
    return request.get('/api/v2/standards/statistics');
  },

  /**
   * 获取排放因子统计信息
   * @returns {Promise}
   */
  getEmissionFactorStatistics: () => {
    return request.get('/api/v2/standards/emission-factors/statistics');
  },

  /**
   * 搜索标准
   * @param {string} keyword - 搜索关键词
   * @returns {Promise}
   */
  searchStandards: (keyword) => {
    return request.get('/api/v2/standards/search', {
      params: { keyword }
    });
  },

  /**
   * 搜索排放因子
   * @param {string} keyword - 搜索关键词
   * @returns {Promise}
   */
  searchEmissionFactors: (keyword) => {
    return request.get('/api/v2/standards/emission-factors/search', {
      params: { keyword }
    });
  },

  /**
   * 根据标准类型获取标准列表
   * @param {string} type - 标准类型 (national/industry/international)
   * @returns {Promise}
   */
  getStandardsByType: (type) => {
    return request.get('/api/v2/standards', {
      params: { type }
    });
  },

  /**
   * 根据行业获取标准列表
   * @param {string} industry - 行业类型
   * @returns {Promise}
   */
  getStandardsByIndustry: (industry) => {
    return request.get('/api/v2/standards', {
      params: { industry }
    });
  },

  /**
   * 获取标准版本历史
   * @param {string} standardCode - 标准代码
   * @returns {Promise}
   */
  getStandardVersions: (standardCode) => {
    return request.get(`/api/v2/standards/${encodeURIComponent(standardCode)}/versions`);
  },

  /**
   * 获取标准的计算规则
   * @param {string} standardCode - 标准代码
   * @returns {Promise}
   */
  getCalculationRules: (standardCode) => {
    return request.get(`/api/v2/standards/${encodeURIComponent(standardCode)}/calculation-rules`);
  },

  /**
   * 验证计算规则
   * @param {string} standardCode - 标准代码
   * @param {string} ruleCode - 规则代码
   * @param {Object} inputData - 输入数据
   * @returns {Promise}
   */
  validateCalculationRule: (standardCode, ruleCode, inputData) => {
    return request.post(`/api/v2/standards/${encodeURIComponent(standardCode)}/calculation-rules/${encodeURIComponent(ruleCode)}/validate`, inputData);
  },

  /**
   * 执行计算规则
   * @param {string} standardCode - 标准代码
   * @param {string} ruleCode - 规则代码
   * @param {Object} inputData - 输入数据
   * @returns {Promise}
   */
  executeCalculationRule: (standardCode, ruleCode, inputData) => {
    return request.post(`/api/v2/standards/${encodeURIComponent(standardCode)}/calculation-rules/${encodeURIComponent(ruleCode)}/execute`, inputData);
  },

  /**
   * 获取标准适用性分析
   * @param {Object} projectData - 项目数据
   * @returns {Promise}
   */
  getApplicabilityAnalysis: (projectData) => {
    return request.post('/api/v2/standards/applicability-analysis', projectData);
  },

  /**
   * 获取标准合规性报告
   * @param {string} standardCode - 标准代码
   * @param {Object} data - 数据
   * @param {string} format - 报告格式 (pdf/excel/json)
   * @returns {Promise}
   */
  getComplianceReport: (standardCode, data, format = 'json') => {
    return request.post(`/api/v2/standards/${encodeURIComponent(standardCode)}/compliance-report`, data, {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  },

  /**
   * 导出标准列表
   * @param {Object} filters - 过滤条件
   * @param {string} format - 导出格式 (excel/csv)
   * @returns {Promise}
   */
  exportStandards: (filters = {}, format = 'excel') => {
    return request.get('/api/v2/standards/export', {
      params: { ...filters, format },
      responseType: 'blob'
    });
  },

  /**
   * 导出排放因子列表
   * @param {Object} filters - 过滤条件
   * @param {string} format - 导出格式 (excel/csv)
   * @returns {Promise}
   */
  exportEmissionFactors: (filters = {}, format = 'excel') => {
    return request.get('/api/v2/standards/emission-factors/export', {
      params: { ...filters, format },
      responseType: 'blob'
    });
  },

  /**
   * 获取标准更新历史
   * @param {string} standardCode - 标准代码（可选）
   * @param {number} page - 页码
   * @param {number} size - 页大小
   * @returns {Promise}
   */
  getUpdateHistory: (standardCode = null, page = 1, size = 20) => {
    const params = { page, size };
    if (standardCode) {
      params.standardCode = standardCode;
    }
    return request.get('/api/v2/standards/update-history', { params });
  },

  /**
   * 获取标准通知设置
   * @returns {Promise}
   */
  getNotificationSettings: () => {
    return request.get('/api/v2/standards/notification-settings');
  },

  /**
   * 更新标准通知设置
   * @param {Object} settings - 通知设置
   * @returns {Promise}
   */
  updateNotificationSettings: (settings) => {
    return request.put('/api/v2/standards/notification-settings', settings);
  },

  /**
   * 订阅标准更新通知
   * @param {Array<string>} standardCodes - 标准代码列表
   * @returns {Promise}
   */
  subscribeUpdates: (standardCodes) => {
    return request.post('/api/v2/standards/subscribe-updates', { standardCodes });
  },

  /**
   * 取消订阅标准更新通知
   * @param {Array<string>} standardCodes - 标准代码列表
   * @returns {Promise}
   */
  unsubscribeUpdates: (standardCodes) => {
    return request.post('/api/v2/standards/unsubscribe-updates', { standardCodes });
  },

  /**
   * 获取标准依赖关系
   * @param {string} standardCode - 标准代码
   * @returns {Promise}
   */
  getStandardDependencies: (standardCode) => {
    return request.get(`/api/v2/standards/${encodeURIComponent(standardCode)}/dependencies`);
  },

  /**
   * 获取标准影响分析
   * @param {string} standardCode - 标准代码
   * @returns {Promise}
   */
  getImpactAnalysis: (standardCode) => {
    return request.get(`/api/v2/standards/${encodeURIComponent(standardCode)}/impact-analysis`);
  },

  /**
   * 批量验证合规性
   * @param {Array<Object>} validationRequests - 验证请求列表
   * @returns {Promise}
   */
  batchValidateCompliance: (validationRequests) => {
    return request.post('/api/v2/standards/batch-validate', { validationRequests });
  },

  /**
   * 获取标准推荐
   * @param {Object} projectProfile - 项目概况
   * @returns {Promise}
   */
  getStandardRecommendations: (projectProfile) => {
    return request.post('/api/v2/standards/recommendations', projectProfile);
  }
};

export default standardsApi;