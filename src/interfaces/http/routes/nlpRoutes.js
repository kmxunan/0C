/**
 * 零碳园区数字孪生系统 - 自然语言处理路由
 * 
 * 功能说明:
 * 1. 智能问答路由
 * 2. 自动报告生成路由
 * 3. 语音交互路由
 * 4. 多语言支持路由
 * 5. 文本分析路由
 * 6. 会话管理路由
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0.0
 * @since 2025-06-26
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const multer = require('multer');
const NLPController = require('../controllers/NLPController');
const authMiddleware = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

const router = express.Router();
const nlpController = new NLPController();

// 配置文件上传
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // 只允许音频文件
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('只支持音频文件'), false);
        }
    }
});

// 验证规则
const questionValidation = [
    body('question')
        .notEmpty()
        .withMessage('问题不能为空')
        .isLength({ min: 1, max: 1000 })
        .withMessage('问题长度必须在1-1000字符之间'),
    body('sessionId')
        .optional()
        .isString()
        .withMessage('会话ID必须是字符串'),
    body('context')
        .optional()
        .isObject()
        .withMessage('上下文必须是对象'),
    body('language')
        .optional()
        .isIn(['zh-CN', 'en-US', 'ja-JP', 'ko-KR'])
        .withMessage('不支持的语言')
];

const reportValidation = [
    body('reportType')
        .notEmpty()
        .withMessage('报告类型不能为空')
        .isIn(['carbon_emission_report', 'energy_analysis_report', 'system_operation_report'])
        .withMessage('不支持的报告类型'),
    body('data')
        .notEmpty()
        .withMessage('数据不能为空')
        .isObject()
        .withMessage('数据必须是对象'),
    body('options')
        .optional()
        .isObject()
        .withMessage('选项必须是对象')
];

const textToSpeechValidation = [
    body('text')
        .notEmpty()
        .withMessage('文本不能为空')
        .isLength({ min: 1, max: 500 })
        .withMessage('文本长度必须在1-500字符之间'),
    body('voice')
        .optional()
        .isString()
        .withMessage('语音配置必须是字符串'),
    body('language')
        .optional()
        .isIn(['zh-CN', 'en-US', 'ja-JP', 'ko-KR'])
        .withMessage('不支持的语言'),
    body('speed')
        .optional()
        .isFloat({ min: 0.5, max: 2.0 })
        .withMessage('语速必须在0.5-2.0之间'),
    body('pitch')
        .optional()
        .isFloat({ min: 0.5, max: 2.0 })
        .withMessage('音调必须在0.5-2.0之间')
];

const textAnalysisValidation = [
    body('text')
        .notEmpty()
        .withMessage('文本不能为空')
        .isLength({ min: 1, max: 5000 })
        .withMessage('文本长度必须在1-5000字符之间'),
    body('analysisTypes')
        .optional()
        .isArray()
        .withMessage('分析类型必须是数组')
        .custom((value) => {
            const validTypes = ['sentiment', 'keywords', 'summary', 'entities'];
            return value.every(type => validTypes.includes(type));
        })
        .withMessage('包含不支持的分析类型')
];

const languageValidation = [
    body('language')
        .notEmpty()
        .withMessage('语言不能为空')
        .isIn(['zh-CN', 'en-US', 'ja-JP', 'ko-KR'])
        .withMessage('不支持的语言')
];

const conversationQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('页码必须是正整数'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('每页数量必须在1-100之间'),
    query('language')
        .optional()
        .isIn(['zh-CN', 'en-US', 'ja-JP', 'ko-KR'])
        .withMessage('不支持的语言')
];

const sessionIdValidation = [
    param('sessionId')
        .notEmpty()
        .withMessage('会话ID不能为空')
        .isString()
        .withMessage('会话ID必须是字符串')
];

// ==================== 智能问答接口 ====================

/**
 * @route POST /api/nlp/ask
 * @desc 智能问答
 * @access Private
 */
router.post('/ask', 
    authMiddleware.authenticate,
    nlpController.getQuestionRateLimit(),
    questionValidation,
    nlpController.askQuestion.bind(nlpController)
);

/**
 * @route GET /api/nlp/suggestions
 * @desc 获取问答建议
 * @access Private
 */
router.get('/suggestions',
    authMiddleware.authenticate,
    cacheMiddleware.cache(300), // 缓存5分钟
    nlpController.getSuggestions.bind(nlpController)
);

// ==================== 报告生成接口 ====================

/**
 * @route POST /api/nlp/generate-report
 * @desc 生成报告
 * @access Private
 */
router.post('/generate-report',
    authMiddleware.authenticate,
    nlpController.getReportRateLimit(),
    reportValidation,
    nlpController.generateReport.bind(nlpController)
);

/**
 * @route GET /api/nlp/report-templates
 * @desc 获取报告模板列表
 * @access Private
 */
router.get('/report-templates',
    authMiddleware.authenticate,
    cacheMiddleware.cache(3600), // 缓存1小时
    nlpController.getReportTemplates.bind(nlpController)
);

/**
 * @route GET /api/nlp/download-report/:reportId
 * @desc 下载报告
 * @access Private
 */
router.get('/download-report/:reportId',
    authMiddleware.authenticate,
    param('reportId').notEmpty().withMessage('报告ID不能为空'),
    nlpController.downloadReport.bind(nlpController)
);

// ==================== 语音交互接口 ====================

/**
 * @route POST /api/nlp/speech-to-text
 * @desc 语音转文字
 * @access Private
 */
router.post('/speech-to-text',
    authMiddleware.authenticate,
    nlpController.getVoiceRateLimit(),
    upload.single('audio'),
    nlpController.speechToText.bind(nlpController)
);

/**
 * @route POST /api/nlp/text-to-speech
 * @desc 文字转语音
 * @access Private
 */
router.post('/text-to-speech',
    authMiddleware.authenticate,
    nlpController.getVoiceRateLimit(),
    textToSpeechValidation,
    nlpController.textToSpeech.bind(nlpController)
);

/**
 * @route GET /api/nlp/voice-profiles
 * @desc 获取语音配置
 * @access Private
 */
router.get('/voice-profiles',
    authMiddleware.authenticate,
    cacheMiddleware.cache(3600), // 缓存1小时
    nlpController.getVoiceProfiles.bind(nlpController)
);

// ==================== 文本分析接口 ====================

/**
 * @route POST /api/nlp/analyze-text
 * @desc 文本分析
 * @access Private
 */
router.post('/analyze-text',
    authMiddleware.authenticate,
    textAnalysisValidation,
    nlpController.analyzeText.bind(nlpController)
);

// ==================== 多语言支持接口 ====================

/**
 * @route POST /api/nlp/set-language
 * @desc 设置语言
 * @access Private
 */
router.post('/set-language',
    authMiddleware.authenticate,
    languageValidation,
    nlpController.setLanguage.bind(nlpController)
);

/**
 * @route GET /api/nlp/languages
 * @desc 获取支持的语言
 * @access Private
 */
router.get('/languages',
    authMiddleware.authenticate,
    cacheMiddleware.cache(3600), // 缓存1小时
    nlpController.getSupportedLanguages.bind(nlpController)
);

// ==================== 会话管理接口 ====================

/**
 * @route GET /api/nlp/conversations
 * @desc 获取会话列表
 * @access Private
 */
router.get('/conversations',
    authMiddleware.authenticate,
    conversationQueryValidation,
    nlpController.getConversations.bind(nlpController)
);

/**
 * @route GET /api/nlp/conversations/:sessionId
 * @desc 获取会话详情
 * @access Private
 */
router.get('/conversations/:sessionId',
    authMiddleware.authenticate,
    sessionIdValidation,
    nlpController.getConversationDetails.bind(nlpController)
);

/**
 * @route DELETE /api/nlp/conversations/:sessionId
 * @desc 删除会话
 * @access Private
 */
router.delete('/conversations/:sessionId',
    authMiddleware.authenticate,
    sessionIdValidation,
    nlpController.deleteConversation.bind(nlpController)
);

/**
 * @route POST /api/nlp/cleanup-conversations
 * @desc 清理过期会话
 * @access Private
 */
router.post('/cleanup-conversations',
    authMiddleware.authenticate,
    body('maxAge')
        .optional()
        .isInt({ min: 3600000 }) // 最少1小时
        .withMessage('最大存活时间必须至少为1小时'),
    nlpController.cleanupConversations.bind(nlpController)
);

// ==================== 系统管理接口 ====================

/**
 * @route GET /api/nlp/status
 * @desc 获取服务状态
 * @access Private
 */
router.get('/status',
    authMiddleware.authenticate,
    nlpController.getStatus.bind(nlpController)
);

/**
 * @route GET /api/nlp/statistics
 * @desc 获取统计信息
 * @access Private
 */
router.get('/statistics',
    authMiddleware.authenticate,
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('开始日期格式不正确'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('结束日期格式不正确'),
    nlpController.getStatistics.bind(nlpController)
);

/**
 * @route GET /api/nlp/health
 * @desc 健康检查
 * @access Public
 */
router.get('/health',
    nlpController.healthCheck.bind(nlpController)
);

// ==================== WebSocket支持 ====================

/**
 * WebSocket连接处理
 * 用于实时问答和语音交互
 */
function setupWebSocket(io) {
    const nlpNamespace = io.of('/nlp');
    
    nlpNamespace.on('connection', (socket) => {
        console.log(`NLP WebSocket客户端连接: ${socket.id}`);
        
        // 实时问答
        socket.on('ask_question', async (data) => {
            try {
                const { question, sessionId, context, language } = data;
                
                // 设置语言
                if (language) {
                    nlpController.nlpService.setLanguage(language);
                }
                
                // 处理问答
                const result = await nlpController.nlpService.askQuestion(
                    question, 
                    sessionId || `ws_${socket.id}`, 
                    context || {}
                );
                
                socket.emit('question_response', result);
                
            } catch (error) {
                console.error('WebSocket问答处理失败:', error);
                socket.emit('error', {
                    success: false,
                    error: '问答处理失败',
                    message: error.message
                });
            }
        });
        
        // 实时语音识别
        socket.on('speech_data', async (data) => {
            try {
                const { audioData, options } = data;
                
                const result = await nlpController.nlpService.speechToText(
                    Buffer.from(audioData), 
                    options || {}
                );
                
                socket.emit('speech_result', result);
                
            } catch (error) {
                console.error('WebSocket语音识别失败:', error);
                socket.emit('error', {
                    success: false,
                    error: '语音识别失败',
                    message: error.message
                });
            }
        });
        
        // 设置语言
        socket.on('set_language', (data) => {
            try {
                const { language } = data;
                const success = nlpController.nlpService.setLanguage(language);
                
                socket.emit('language_set', {
                    success: success,
                    language: language,
                    currentLanguage: nlpController.nlpService.currentLanguage
                });
                
            } catch (error) {
                console.error('WebSocket设置语言失败:', error);
                socket.emit('error', {
                    success: false,
                    error: '设置语言失败',
                    message: error.message
                });
            }
        });
        
        // 获取建议
        socket.on('get_suggestions', (data) => {
            try {
                const { category } = data;
                
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
                    general: [
                        '系统有什么功能？',
                        '如何使用语音交互？',
                        '支持哪些语言？',
                        '如何获取帮助？'
                    ]
                };
                
                const categoryQuestions = suggestions[category] || suggestions.general;
                
                socket.emit('suggestions_response', {
                    success: true,
                    suggestions: categoryQuestions,
                    category: category || 'general'
                });
                
            } catch (error) {
                console.error('WebSocket获取建议失败:', error);
                socket.emit('error', {
                    success: false,
                    error: '获取建议失败',
                    message: error.message
                });
            }
        });
        
        // 断开连接
        socket.on('disconnect', () => {
            console.log(`NLP WebSocket客户端断开: ${socket.id}`);
        });
    });
    
    return nlpNamespace;
}

// 错误处理中间件
router.use((error, req, res, next) => {
    console.error('NLP路由错误:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: '文件大小超出限制',
                maxSize: '10MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: '文件数量超出限制',
                maxCount: 1
            });
        }
    }
    
    if (error.message === '只支持音频文件') {
        return res.status(400).json({
            success: false,
            error: '只支持音频文件',
            supportedTypes: ['audio/wav', 'audio/mp3', 'audio/ogg']
        });
    }
    
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: error.message
    });
});

module.exports = {
    router,
    setupWebSocket
};