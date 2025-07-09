/**
 * 零碳园区数字孪生系统 - 自然语言处理控制器
 * 
 * 功能说明:
 * 1. 智能问答API接口
 * 2. 自动报告生成接口
 * 3. 语音交互接口
 * 4. 多语言支持接口
 * 5. 文本分析接口
 * 6. 会话管理接口
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0.0
 * @since 2025-06-26
 */

const NLPService = require('../../../services/NLPService');
const { validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

class NLPController {
    constructor() {
        this.nlpService = new NLPService();
        this.initializeRateLimits();
    }
    
    /**
     * 初始化速率限制
     */
    initializeRateLimits() {
        // 问答接口限制
        this.questionLimit = rateLimit({
            windowMs: 60 * 1000, // 1分钟
            max: 30, // 最多30次请求
            message: {
                success: false,
                error: '请求过于频繁，请稍后再试',
                code: 'RATE_LIMIT_EXCEEDED'
            }
        });
        
        // 报告生成限制
        this.reportLimit = rateLimit({
            windowMs: 5 * 60 * 1000, // 5分钟
            max: 5, // 最多5次请求
            message: {
                success: false,
                error: '报告生成请求过于频繁，请稍后再试',
                code: 'REPORT_RATE_LIMIT_EXCEEDED'
            }
        });
        
        // 语音接口限制
        this.voiceLimit = rateLimit({
            windowMs: 60 * 1000, // 1分钟
            max: 20, // 最多20次请求
            message: {
                success: false,
                error: '语音请求过于频繁，请稍后再试',
                code: 'VOICE_RATE_LIMIT_EXCEEDED'
            }
        });
    }
    
    /**
     * 智能问答
     * POST /api/nlp/ask
     */
    async askQuestion(req, res) {
        try {
            // 验证请求参数
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '请求参数验证失败',
                    details: errors.array()
                });
            }
            
            const { question, sessionId, context, language } = req.body;
            
            // 设置语言
            if (language) {
                this.nlpService.setLanguage(language);
            }
            
            // 处理问答
            const result = await this.nlpService.askQuestion(
                question, 
                sessionId || `session_${Date.now()}`, 
                context || {}
            );
            
            res.json(result);
            
        } catch (error) {
            console.error('问答处理失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器内部错误',
                message: error.message
            });
        }
    }
    
    /**
     * 获取问答建议
     * GET /api/nlp/suggestions
     */
    async getSuggestions(req, res) {
        try {
            const { category, language } = req.query;
            
            const suggestions = {
                carbon_emission: [
                    '如何计算碳排放量？',
                    '什么是碳中和？',
                    '碳排放标准有哪些？',
                    '如何减少碳排放？'
                ],
                energy_management: [
                    '如何优化能耗？',
                    '什么是峰谷电价？',
                    '能效比如何计算？',
                    '节能措施有哪些？'
                ],
                system_operation: [
                    '系统运行状态如何？',
                    '如何查看设备状态？',
                    '系统有哪些功能？',
                    '如何生成报告？'
                ],
                general: [
                    '系统有什么功能？',
                    '如何使用语音交互？',
                    '支持哪些语言？',
                    '如何获取帮助？'
                ]
            };
            
            const categoryQuestions = suggestions[category] || suggestions.general;
            
            res.json({
                success: true,
                suggestions: categoryQuestions,
                category: category || 'general',
                language: language || 'zh-CN'
            });
            
        } catch (error) {
            console.error('获取建议失败:', error);
            res.status(500).json({
                success: false,
                error: '获取建议失败',
                message: error.message
            });
        }
    }
    
    /**
     * 生成报告
     * POST /api/nlp/generate-report
     */
    async generateReport(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '请求参数验证失败',
                    details: errors.array()
                });
            }
            
            const { reportType, data, options } = req.body;
            
            // 生成报告
            const result = await this.nlpService.generateReport(reportType, data, options);
            
            if (result.success) {
                res.json({
                    success: true,
                    report: result.report,
                    metadata: result.metadata,
                    downloadUrl: `/api/nlp/download-report/${result.report.id || Date.now()}`
                });
            } else {
                res.status(400).json(result);
            }
            
        } catch (error) {
            console.error('报告生成失败:', error);
            res.status(500).json({
                success: false,
                error: '报告生成失败',
                message: error.message
            });
        }
    }
    
    /**
     * 获取报告模板列表
     * GET /api/nlp/report-templates
     */
    async getReportTemplates(req, res) {
        try {
            const templates = [
                {
                    id: 'carbon_emission_report',
                    name: '碳排放分析报告',
                    description: '详细的碳排放数据分析和趋势报告',
                    sections: ['summary', 'overview', 'analysis', 'trends', 'recommendations', 'conclusion'],
                    estimatedTime: '2-3分钟',
                    dataRequired: ['emission_data', 'time_range']
                },
                {
                    id: 'energy_analysis_report',
                    name: '能耗分析报告',
                    description: '能源消耗分析和优化建议报告',
                    sections: ['summary', 'consumption', 'efficiency', 'optimization'],
                    estimatedTime: '1-2分钟',
                    dataRequired: ['energy_data', 'time_range']
                },
                {
                    id: 'system_operation_report',
                    name: '系统运行报告',
                    description: '系统运行状态和性能分析报告',
                    sections: ['status', 'performance', 'issues', 'maintenance'],
                    estimatedTime: '1-2分钟',
                    dataRequired: ['system_metrics', 'time_range']
                }
            ];
            
            res.json({
                success: true,
                templates: templates,
                total: templates.length
            });
            
        } catch (error) {
            console.error('获取模板列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取模板列表失败',
                message: error.message
            });
        }
    }
    
    /**
     * 下载报告
     * GET /api/nlp/download-report/:reportId
     */
    async downloadReport(req, res) {
        try {
            const { reportId } = req.params;
            const { format = 'markdown' } = req.query;
            
            // 这里应该从数据库或缓存中获取报告
            // 暂时返回模拟数据
            const reportContent = `# 示例报告\n\n这是一个示例报告内容。\n\n报告ID: ${reportId}\n生成时间: ${new Date().toLocaleString('zh-CN')}`;
            
            const filename = `report_${reportId}.${format === 'pdf' ? 'pdf' : 'md'}`;
            
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'text/markdown');
            
            res.send(reportContent);
            
        } catch (error) {
            console.error('下载报告失败:', error);
            res.status(500).json({
                success: false,
                error: '下载报告失败',
                message: error.message
            });
        }
    }
    
    /**
     * 语音转文字
     * POST /api/nlp/speech-to-text
     */
    async speechToText(req, res) {
        try {
            const { language, format } = req.body;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: '未上传音频文件'
                });
            }
            
            const audioData = req.file.buffer;
            const options = {
                language: language || 'zh-CN',
                format: format || 'wav'
            };
            
            const result = await this.nlpService.speechToText(audioData, options);
            
            res.json(result);
            
        } catch (error) {
            console.error('语音识别失败:', error);
            res.status(500).json({
                success: false,
                error: '语音识别失败',
                message: error.message
            });
        }
    }
    
    /**
     * 文字转语音
     * POST /api/nlp/text-to-speech
     */
    async textToSpeech(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '请求参数验证失败',
                    details: errors.array()
                });
            }
            
            const { text, voice, language, speed, pitch } = req.body;
            
            const options = {
                profile: voice || 'default',
                language: language || 'zh-CN',
                speed: speed || 1.0,
                pitch: pitch || 1.0
            };
            
            const result = await this.nlpService.textToSpeech(text, options);
            
            if (result.success) {
                res.setHeader('Content-Type', 'audio/wav');
                res.setHeader('Content-Length', result.audioData.length);
                res.send(result.audioData);
            } else {
                res.status(400).json(result);
            }
            
        } catch (error) {
            console.error('语音合成失败:', error);
            res.status(500).json({
                success: false,
                error: '语音合成失败',
                message: error.message
            });
        }
    }
    
    /**
     * 获取语音配置
     * GET /api/nlp/voice-profiles
     */
    async getVoiceProfiles(req, res) {
        try {
            const profiles = [
                {
                    id: 'default',
                    name: '默认女声',
                    language: 'zh-CN',
                    gender: 'female',
                    description: '标准中文女声'
                },
                {
                    id: 'male_cn',
                    name: '中文男声',
                    language: 'zh-CN',
                    gender: 'male',
                    description: '标准中文男声'
                },
                {
                    id: 'english',
                    name: 'English Female',
                    language: 'en-US',
                    gender: 'female',
                    description: 'Standard English female voice'
                }
            ];
            
            res.json({
                success: true,
                profiles: profiles,
                total: profiles.length
            });
            
        } catch (error) {
            console.error('获取语音配置失败:', error);
            res.status(500).json({
                success: false,
                error: '获取语音配置失败',
                message: error.message
            });
        }
    }
    
    /**
     * 文本分析
     * POST /api/nlp/analyze-text
     */
    async analyzeText(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '请求参数验证失败',
                    details: errors.array()
                });
            }
            
            const { text, analysisTypes } = req.body;
            
            const result = await this.nlpService.analyzeText(text, analysisTypes);
            
            res.json({
                success: true,
                analysis: result,
                textLength: text.length,
                analysisTypes: analysisTypes
            });
            
        } catch (error) {
            console.error('文本分析失败:', error);
            res.status(500).json({
                success: false,
                error: '文本分析失败',
                message: error.message
            });
        }
    }
    
    /**
     * 设置语言
     * POST /api/nlp/set-language
     */
    async setLanguage(req, res) {
        try {
            const { language } = req.body;
            
            if (!language) {
                return res.status(400).json({
                    success: false,
                    error: '语言参数不能为空'
                });
            }
            
            const success = this.nlpService.setLanguage(language);
            
            if (success) {
                res.json({
                    success: true,
                    language: language,
                    message: '语言设置成功'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: '不支持的语言',
                    supportedLanguages: this.nlpService.getSupportedLanguages()
                });
            }
            
        } catch (error) {
            console.error('设置语言失败:', error);
            res.status(500).json({
                success: false,
                error: '设置语言失败',
                message: error.message
            });
        }
    }
    
    /**
     * 获取支持的语言
     * GET /api/nlp/languages
     */
    async getSupportedLanguages(req, res) {
        try {
            const languages = this.nlpService.getSupportedLanguages();
            
            res.json({
                success: true,
                languages: languages,
                currentLanguage: this.nlpService.currentLanguage,
                total: languages.length
            });
            
        } catch (error) {
            console.error('获取语言列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取语言列表失败',
                message: error.message
            });
        }
    }
    
    /**
     * 获取会话列表
     * GET /api/nlp/conversations
     */
    async getConversations(req, res) {
        try {
            const { page = 1, limit = 20, language } = req.query;
            
            let conversations = this.nlpService.getConversations();
            
            // 语言过滤
            if (language) {
                conversations = conversations.filter(conv => conv.language === language);
            }
            
            // 分页
            const total = conversations.length;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedConversations = conversations.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                conversations: paginatedConversations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('获取会话列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取会话列表失败',
                message: error.message
            });
        }
    }
    
    /**
     * 获取会话详情
     * GET /api/nlp/conversations/:sessionId
     */
    async getConversationDetails(req, res) {
        try {
            const { sessionId } = req.params;
            
            const conversation = this.nlpService.conversations.get(sessionId);
            
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: '会话不存在'
                });
            }
            
            res.json({
                success: true,
                conversation: {
                    id: conversation.id,
                    language: conversation.language,
                    createdAt: conversation.createdAt,
                    messageCount: conversation.history.length,
                    history: conversation.history.map(msg => ({
                        question: msg.question,
                        answer: msg.answer,
                        intent: msg.intent,
                        confidence: msg.confidence,
                        timestamp: msg.timestamp
                    }))
                }
            });
            
        } catch (error) {
            console.error('获取会话详情失败:', error);
            res.status(500).json({
                success: false,
                error: '获取会话详情失败',
                message: error.message
            });
        }
    }
    
    /**
     * 删除会话
     * DELETE /api/nlp/conversations/:sessionId
     */
    async deleteConversation(req, res) {
        try {
            const { sessionId } = req.params;
            
            const deleted = this.nlpService.conversations.delete(sessionId);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: '会话删除成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: '会话不存在'
                });
            }
            
        } catch (error) {
            console.error('删除会话失败:', error);
            res.status(500).json({
                success: false,
                error: '删除会话失败',
                message: error.message
            });
        }
    }
    
    /**
     * 清理过期会话
     * POST /api/nlp/cleanup-conversations
     */
    async cleanupConversations(req, res) {
        try {
            const { maxAge } = req.body;
            
            const cleanedCount = this.nlpService.cleanupConversations(maxAge);
            
            res.json({
                success: true,
                cleanedCount: cleanedCount,
                message: `已清理 ${cleanedCount} 个过期会话`
            });
            
        } catch (error) {
            console.error('清理会话失败:', error);
            res.status(500).json({
                success: false,
                error: '清理会话失败',
                message: error.message
            });
        }
    }
    
    /**
     * 获取服务状态
     * GET /api/nlp/status
     */
    async getStatus(req, res) {
        try {
            const status = this.nlpService.getStatus();
            
            res.json({
                success: true,
                status: status,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('获取状态失败:', error);
            res.status(500).json({
                success: false,
                error: '获取状态失败',
                message: error.message
            });
        }
    }
    
    /**
     * 获取统计信息
     * GET /api/nlp/statistics
     */
    async getStatistics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const status = this.nlpService.getStatus();
            
            // 计算成功率
            const successRate = status.stats.totalQueries > 0 ? 
                (status.stats.successfulResponses / status.stats.totalQueries * 100).toFixed(2) : 0;
            
            // 语言使用分布
            const languageDistribution = Object.entries(status.stats.languageUsage)
                .map(([language, count]) => ({
                    language: language,
                    count: count,
                    percentage: status.stats.totalQueries > 0 ? 
                        (count / status.stats.totalQueries * 100).toFixed(2) : 0
                }));
            
            const statistics = {
                overview: {
                    totalQueries: status.stats.totalQueries,
                    successfulResponses: status.stats.successfulResponses,
                    successRate: parseFloat(successRate),
                    averageResponseTime: Math.round(status.stats.averageResponseTime),
                    reportsGenerated: status.stats.reportGenerated,
                    voiceInteractions: status.stats.voiceInteractions
                },
                languageUsage: languageDistribution,
                systemInfo: {
                    activeConversations: status.activeConversations,
                    knowledgeBaseSize: status.knowledgeBaseSize,
                    supportedLanguages: status.supportedLanguages.length,
                    availableTemplates: status.templates.length
                },
                performance: {
                    averageResponseTime: Math.round(status.stats.averageResponseTime),
                    peakResponseTime: Math.round(status.stats.averageResponseTime * 1.5), // 模拟峰值
                    uptime: '99.9%', // 模拟运行时间
                    memoryUsage: '256MB' // 模拟内存使用
                }
            };
            
            res.json({
                success: true,
                statistics: statistics,
                period: {
                    startDate: startDate || 'N/A',
                    endDate: endDate || 'N/A'
                },
                generatedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('获取统计信息失败:', error);
            res.status(500).json({
                success: false,
                error: '获取统计信息失败',
                message: error.message
            });
        }
    }
    
    /**
     * 健康检查
     * GET /api/nlp/health
     */
    async healthCheck(req, res) {
        try {
            const status = this.nlpService.getStatus();
            
            const health = {
                status: status.isInitialized ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: {
                    nlp: status.isInitialized ? 'up' : 'down',
                    knowledgeBase: status.knowledgeBaseSize > 0 ? 'up' : 'down',
                    languageModels: status.supportedLanguages.length > 0 ? 'up' : 'down'
                },
                metrics: {
                    totalQueries: status.stats.totalQueries,
                    averageResponseTime: Math.round(status.stats.averageResponseTime),
                    activeConversations: status.activeConversations
                }
            };
            
            const httpStatus = health.status === 'healthy' ? 200 : 503;
            res.status(httpStatus).json(health);
            
        } catch (error) {
            console.error('健康检查失败:', error);
            res.status(503).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * 获取速率限制中间件
     */
    getQuestionRateLimit() {
        return this.questionLimit;
    }
    
    getReportRateLimit() {
        return this.reportLimit;
    }
    
    getVoiceRateLimit() {
        return this.voiceLimit;
    }
}

module.exports = NLPController;