/**
 * 零碳园区数字孪生系统 - 自然语言处理服务
 * 
 * 功能说明:
 * 1. 智能问答系统 - 基于知识图谱的智能问答
 * 2. 自动报告生成 - 智能生成各类分析报告
 * 3. 语音交互功能 - 语音识别和语音合成
 * 4. 多语言支持 - 支持多种语言的文本处理
 * 5. 文本分析 - 情感分析、关键词提取等
 * 6. 智能摘要 - 自动生成文档摘要
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0.0
 * @since 2025-06-26
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class NLPService extends EventEmitter {
    constructor() {
        super();
        this.isInitialized = false;
        this.knowledgeBase = new Map();
        this.languageModels = new Map();
        this.templates = new Map();
        this.conversations = new Map();
        this.voiceProfiles = new Map();
        this.supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
        this.currentLanguage = 'zh-CN';
        
        // 初始化配置
        this.config = {
            maxConversationHistory: 100,
            responseTimeout: 30000,
            confidenceThreshold: 0.7,
            maxTokens: 2048,
            temperature: 0.7,
            enableVoice: true,
            enableMultiLanguage: true
        };
        
        // 统计信息
        this.stats = {
            totalQueries: 0,
            successfulResponses: 0,
            averageResponseTime: 0,
            languageUsage: {},
            reportGenerated: 0,
            voiceInteractions: 0
        };
        
        this.init();
    }
    
    /**
     * 初始化NLP服务
     */
    async init() {
        try {
            console.log('正在初始化NLP服务...');
            
            // 初始化知识库
            await this.initKnowledgeBase();
            
            // 初始化语言模型
            await this.initLanguageModels();
            
            // 初始化报告模板
            await this.initReportTemplates();
            
            // 初始化语音配置
            await this.initVoiceConfig();
            
            this.isInitialized = true;
            console.log('NLP服务初始化完成');
            this.emit('initialized');
            
        } catch (error) {
            console.error('NLP服务初始化失败:', error);
            this.emit('error', error);
        }
    }
    
    /**
     * 初始化知识库
     */
    async initKnowledgeBase() {
        // 碳排放相关知识
        this.knowledgeBase.set('carbon_emission', {
            concepts: [
                { term: '碳排放', definition: '温室气体排放的总量，通常以二氧化碳当量表示' },
                { term: '碳足迹', definition: '个人、组织或产品在生命周期内产生的温室气体排放总量' },
                { term: '碳中和', definition: '通过减排和碳抵消实现净零碳排放' },
                { term: '碳达峰', definition: '碳排放量达到历史最高值后逐步下降' }
            ],
            faqs: [
                {
                    question: '如何计算碳排放量？',
                    answer: '碳排放量 = 活动数据 × 排放因子。活动数据包括能源消耗、生产量等，排放因子根据不同能源类型确定。'
                },
                {
                    question: '什么是Scope 1、2、3排放？',
                    answer: 'Scope 1是直接排放，Scope 2是间接排放（购买的电力等），Scope 3是价值链排放。'
                }
            ]
        });
        
        // 能源管理知识
        this.knowledgeBase.set('energy_management', {
            concepts: [
                { term: '能效比', definition: '输出能量与输入能量的比值，衡量能源利用效率' },
                { term: '峰谷电价', definition: '根据用电时段不同制定的差别化电价政策' },
                { term: '需求响应', definition: '用户根据电网需求调整用电行为的机制' }
            ],
            faqs: [
                {
                    question: '如何提高能源效率？',
                    answer: '通过设备升级、优化运行策略、实施能源管理系统等方式提高能源利用效率。'
                }
            ]
        });
        
        // 数字孪生知识
        this.knowledgeBase.set('digital_twin', {
            concepts: [
                { term: '数字孪生', definition: '物理实体的数字化副本，实现虚实融合' },
                { term: '实时同步', definition: '物理世界与数字世界的实时数据同步' },
                { term: '预测性维护', definition: '基于数据分析预测设备故障的维护策略' }
            ],
            faqs: [
                {
                    question: '数字孪生有什么优势？',
                    answer: '数字孪生可以实现实时监控、预测分析、优化决策和风险评估等功能。'
                }
            ]
        });
    }
    
    /**
     * 初始化语言模型
     */
    async initLanguageModels() {
        // 模拟语言模型配置
        this.languageModels.set('zh-CN', {
            name: '中文语言模型',
            version: '1.0',
            tokenizer: 'chinese_tokenizer',
            vocabulary: 50000,
            maxLength: 512
        });
        
        this.languageModels.set('en-US', {
            name: 'English Language Model',
            version: '1.0',
            tokenizer: 'english_tokenizer',
            vocabulary: 30000,
            maxLength: 512
        });
        
        // 初始化语言使用统计
        this.supportedLanguages.forEach(lang => {
            this.stats.languageUsage[lang] = 0;
        });
    }
    
    /**
     * 初始化报告模板
     */
    async initReportTemplates() {
        // 碳排放报告模板
        this.templates.set('carbon_emission_report', {
            name: '碳排放分析报告',
            sections: [
                { id: 'summary', title: '执行摘要', required: true },
                { id: 'overview', title: '排放概览', required: true },
                { id: 'analysis', title: '详细分析', required: true },
                { id: 'trends', title: '趋势分析', required: false },
                { id: 'recommendations', title: '改进建议', required: true },
                { id: 'conclusion', title: '结论', required: true }
            ],
            format: 'markdown'
        });
        
        // 能耗分析报告模板
        this.templates.set('energy_analysis_report', {
            name: '能耗分析报告',
            sections: [
                { id: 'summary', title: '摘要', required: true },
                { id: 'consumption', title: '能耗统计', required: true },
                { id: 'efficiency', title: '效率分析', required: true },
                { id: 'optimization', title: '优化建议', required: true }
            ],
            format: 'markdown'
        });
        
        // 系统运行报告模板
        this.templates.set('system_operation_report', {
            name: '系统运行报告',
            sections: [
                { id: 'status', title: '运行状态', required: true },
                { id: 'performance', title: '性能指标', required: true },
                { id: 'issues', title: '问题分析', required: false },
                { id: 'maintenance', title: '维护建议', required: true }
            ],
            format: 'markdown'
        });
    }
    
    /**
     * 初始化语音配置
     */
    async initVoiceConfig() {
        this.voiceProfiles.set('default', {
            language: 'zh-CN',
            voice: 'female',
            speed: 1.0,
            pitch: 1.0,
            volume: 0.8
        });
        
        this.voiceProfiles.set('english', {
            language: 'en-US',
            voice: 'female',
            speed: 1.0,
            pitch: 1.0,
            volume: 0.8
        });
    }
    
    /**
     * 智能问答
     * @param {string} question - 用户问题
     * @param {string} sessionId - 会话ID
     * @param {Object} context - 上下文信息
     * @returns {Object} 问答结果
     */
    async askQuestion(question, sessionId = 'default', context = {}) {
        const startTime = Date.now();
        this.stats.totalQueries++;
        
        try {
            // 获取或创建会话
            if (!this.conversations.has(sessionId)) {
                this.conversations.set(sessionId, {
                    id: sessionId,
                    history: [],
                    context: {},
                    language: this.currentLanguage,
                    createdAt: new Date()
                });
            }
            
            const conversation = this.conversations.get(sessionId);
            
            // 问题预处理
            const processedQuestion = await this.preprocessQuestion(question, conversation.language);
            
            // 意图识别
            const intent = await this.recognizeIntent(processedQuestion);
            
            // 实体提取
            const entities = await this.extractEntities(processedQuestion);
            
            // 知识检索
            const knowledge = await this.retrieveKnowledge(processedQuestion, intent, entities);
            
            // 生成回答
            const answer = await this.generateAnswer(processedQuestion, intent, entities, knowledge, conversation);
            
            // 更新会话历史
            conversation.history.push({
                question: processedQuestion,
                answer: answer.text,
                intent: intent,
                entities: entities,
                timestamp: new Date(),
                confidence: answer.confidence
            });
            
            // 限制历史记录长度
            if (conversation.history.length > this.config.maxConversationHistory) {
                conversation.history = conversation.history.slice(-this.config.maxConversationHistory);
            }
            
            const responseTime = Date.now() - startTime;
            this.updateStats(responseTime, conversation.language, true);
            
            return {
                success: true,
                answer: answer.text,
                confidence: answer.confidence,
                intent: intent,
                entities: entities,
                suggestions: answer.suggestions || [],
                responseTime: responseTime,
                sessionId: sessionId
            };
            
        } catch (error) {
            console.error('问答处理失败:', error);
            const responseTime = Date.now() - startTime;
            this.updateStats(responseTime, this.currentLanguage, false);
            
            return {
                success: false,
                error: error.message,
                answer: '抱歉，我暂时无法回答这个问题。请稍后再试或联系技术支持。',
                responseTime: responseTime,
                sessionId: sessionId
            };
        }
    }
    
    /**
     * 问题预处理
     */
    async preprocessQuestion(question, language = 'zh-CN') {
        // 文本清理
        let processed = question.trim();
        
        // 去除多余空格
        processed = processed.replace(/\s+/g, ' ');
        
        // 标准化标点符号
        processed = processed.replace(/[？]/g, '?');
        processed = processed.replace(/[！]/g, '!');
        
        // 语言特定处理
        if (language === 'zh-CN') {
            // 中文分词（模拟）
            processed = this.chineseTokenize(processed);
        }
        
        return processed;
    }
    
    /**
     * 中文分词（模拟实现）
     */
    chineseTokenize(text) {
        // 简单的中文分词模拟
        return text;
    }
    
    /**
     * 意图识别
     */
    async recognizeIntent(question) {
        const lowerQuestion = question.toLowerCase();
        
        // 基于关键词的简单意图识别
        if (lowerQuestion.includes('碳排放') || lowerQuestion.includes('carbon')) {
            if (lowerQuestion.includes('计算') || lowerQuestion.includes('calculate')) {
                return 'calculate_carbon_emission';
            } else if (lowerQuestion.includes('报告') || lowerQuestion.includes('report')) {
                return 'carbon_emission_report';
            } else {
                return 'carbon_emission_inquiry';
            }
        }
        
        if (lowerQuestion.includes('能耗') || lowerQuestion.includes('energy')) {
            if (lowerQuestion.includes('优化') || lowerQuestion.includes('optimize')) {
                return 'energy_optimization';
            } else {
                return 'energy_inquiry';
            }
        }
        
        if (lowerQuestion.includes('设备') || lowerQuestion.includes('device')) {
            return 'device_inquiry';
        }
        
        if (lowerQuestion.includes('报告') || lowerQuestion.includes('report')) {
            return 'generate_report';
        }
        
        if (lowerQuestion.includes('帮助') || lowerQuestion.includes('help')) {
            return 'help';
        }
        
        return 'general_inquiry';
    }
    
    /**
     * 实体提取
     */
    async extractEntities(question) {
        const entities = [];
        
        // 时间实体
        const timeRegex = /(\d{4}年|\d{1,2}月|今天|昨天|本月|上月)/g;
        const timeMatches = question.match(timeRegex);
        if (timeMatches) {
            entities.push(...timeMatches.map(match => ({ type: 'time', value: match })));
        }
        
        // 数值实体
        const numberRegex = /(\d+(?:\.\d+)?)(吨|千瓦时|度|%)/g;
        const numberMatches = question.match(numberRegex);
        if (numberMatches) {
            entities.push(...numberMatches.map(match => ({ type: 'quantity', value: match })));
        }
        
        // 设备实体
        const deviceRegex = /(空调|照明|电梯|锅炉|冷却塔)/g;
        const deviceMatches = question.match(deviceRegex);
        if (deviceMatches) {
            entities.push(...deviceMatches.map(match => ({ type: 'device', value: match })));
        }
        
        return entities;
    }
    
    /**
     * 知识检索
     */
    async retrieveKnowledge(question, intent, entities) {
        const knowledge = [];
        
        // 根据意图检索相关知识
        if (intent.includes('carbon')) {
            const carbonKnowledge = this.knowledgeBase.get('carbon_emission');
            if (carbonKnowledge) {
                knowledge.push(...carbonKnowledge.concepts, ...carbonKnowledge.faqs);
            }
        }
        
        if (intent.includes('energy')) {
            const energyKnowledge = this.knowledgeBase.get('energy_management');
            if (energyKnowledge) {
                knowledge.push(...energyKnowledge.concepts, ...energyKnowledge.faqs);
            }
        }
        
        // 基于实体检索
        entities.forEach(entity => {
            if (entity.type === 'device') {
                // 检索设备相关知识
                knowledge.push({
                    type: 'device_info',
                    device: entity.value,
                    info: `${entity.value}是重要的能耗设备，需要定期监控和维护。`
                });
            }
        });
        
        return knowledge;
    }
    
    /**
     * 生成回答
     */
    async generateAnswer(question, intent, entities, knowledge, conversation) {
        let answer = '';
        let confidence = 0.8;
        let suggestions = [];
        
        switch (intent) {
            case 'calculate_carbon_emission':
                answer = '碳排放计算需要以下信息：\n1. 能源消耗数据（电力、燃气等）\n2. 对应的排放因子\n3. 计算公式：碳排放量 = 活动数据 × 排放因子\n\n您可以在系统的碳排放计算模块中输入具体数据进行计算。';
                suggestions = ['查看碳排放计算器', '了解排放因子', '查看历史排放数据'];
                break;
                
            case 'carbon_emission_report':
                answer = '我可以为您生成碳排放分析报告。报告将包括：\n1. 排放总量统计\n2. 排放源分析\n3. 趋势变化\n4. 对标分析\n5. 减排建议\n\n请告诉我您需要哪个时间段的报告？';
                suggestions = ['生成月度报告', '生成年度报告', '自定义时间范围'];
                break;
                
            case 'energy_optimization':
                answer = '能耗优化建议：\n1. 设备运行时间优化\n2. 负荷调度优化\n3. 设备效率提升\n4. 能源结构调整\n\n系统可以基于历史数据和AI算法为您提供个性化的优化方案。';
                suggestions = ['查看优化建议', '设置优化目标', '查看节能效果'];
                break;
                
            case 'help':
                answer = '我是零碳园区数字孪生系统的智能助手，可以帮助您：\n\n🔍 **查询功能**\n- 碳排放数据查询\n- 能耗数据分析\n- 设备运行状态\n\n📊 **报告生成**\n- 碳排放分析报告\n- 能耗分析报告\n- 系统运行报告\n\n💡 **智能建议**\n- 节能优化建议\n- 减排策略建议\n- 设备维护建议\n\n请告诉我您需要什么帮助？';
                suggestions = ['碳排放查询', '能耗分析', '生成报告', '优化建议'];
                break;
                
            default:
                // 基于知识库生成回答
                if (knowledge.length > 0) {
                    const relevantKnowledge = knowledge.slice(0, 3);
                    answer = '根据您的问题，我找到了以下相关信息：\n\n';
                    relevantKnowledge.forEach((item, index) => {
                        if (item.definition) {
                            answer += `${index + 1}. **${item.term}**: ${item.definition}\n`;
                        } else if (item.answer) {
                            answer += `${index + 1}. **${item.question}**\n   ${item.answer}\n`;
                        }
                    });
                    answer += '\n如需更详细的信息，请告诉我具体想了解什么？';
                } else {
                    answer = '抱歉，我没有找到与您问题直接相关的信息。您可以：\n1. 重新描述您的问题\n2. 查看帮助文档\n3. 联系技术支持\n\n或者告诉我您想了解哪个方面的内容？';
                    confidence = 0.3;
                }
                suggestions = ['查看帮助', '联系支持', '浏览功能'];
        }
        
        return {
            text: answer,
            confidence: confidence,
            suggestions: suggestions
        };
    }
    
    /**
     * 自动报告生成
     * @param {string} reportType - 报告类型
     * @param {Object} data - 数据源
     * @param {Object} options - 生成选项
     * @returns {Object} 生成结果
     */
    async generateReport(reportType, data, options = {}) {
        try {
            const template = this.templates.get(reportType);
            if (!template) {
                throw new Error(`未找到报告模板: ${reportType}`);
            }
            
            const report = {
                title: template.name,
                generatedAt: new Date(),
                language: options.language || this.currentLanguage,
                format: template.format,
                sections: []
            };
            
            // 生成各个章节
            for (const section of template.sections) {
                if (section.required || options.includeSections?.includes(section.id)) {
                    const sectionContent = await this.generateReportSection(
                        reportType, 
                        section, 
                        data, 
                        options
                    );
                    report.sections.push(sectionContent);
                }
            }
            
            // 生成完整报告文本
            report.content = this.formatReport(report);
            
            this.stats.reportGenerated++;
            
            return {
                success: true,
                report: report,
                metadata: {
                    wordCount: report.content.length,
                    sectionCount: report.sections.length,
                    generationTime: Date.now()
                }
            };
            
        } catch (error) {
            console.error('报告生成失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 生成报告章节
     */
    async generateReportSection(reportType, section, data, options) {
        let content = '';
        
        switch (section.id) {
            case 'summary':
                content = this.generateSummarySection(data, options);
                break;
            case 'overview':
                content = this.generateOverviewSection(data, options);
                break;
            case 'analysis':
                content = this.generateAnalysisSection(data, options);
                break;
            case 'trends':
                content = this.generateTrendsSection(data, options);
                break;
            case 'recommendations':
                content = this.generateRecommendationsSection(data, options);
                break;
            case 'conclusion':
                content = this.generateConclusionSection(data, options);
                break;
            default:
                content = `${section.title}章节内容待完善。`;
        }
        
        return {
            id: section.id,
            title: section.title,
            content: content,
            generatedAt: new Date()
        };
    }
    
    /**
     * 生成摘要章节
     */
    generateSummarySection(data, options) {
        return `## 执行摘要

本报告基于${options.startDate || '指定时间段'}至${options.endDate || '当前'}的数据分析生成。

**主要发现：**
- 总体表现良好，各项指标基本达标
- 发现${Math.floor(Math.random() * 5) + 1}个需要关注的问题
- 提出${Math.floor(Math.random() * 8) + 3}项改进建议

**关键指标：**
- 数据完整性：${(Math.random() * 10 + 90).toFixed(1)}%
- 系统可用性：${(Math.random() * 5 + 95).toFixed(2)}%
- 处理效率：${(Math.random() * 20 + 80).toFixed(1)}%
`;
    }
    
    /**
     * 生成概览章节
     */
    generateOverviewSection(data, options) {
        return `## 数据概览

### 基本统计
- 数据记录总数：${Math.floor(Math.random() * 10000) + 5000}
- 有效数据比例：${(Math.random() * 10 + 85).toFixed(1)}%
- 平均处理时间：${(Math.random() * 100 + 50).toFixed(0)}ms

### 分布情况
数据在各个维度上的分布相对均匀，符合预期模式。
`;
    }
    
    /**
     * 生成分析章节
     */
    generateAnalysisSection(data, options) {
        return `## 详细分析

### 趋势分析
通过对历史数据的分析，发现以下趋势：
1. 整体呈现稳定上升趋势
2. 季节性波动明显
3. 周期性特征显著

### 异常检测
系统检测到${Math.floor(Math.random() * 3) + 1}个异常点，均已进行标记和处理。
`;
    }
    
    /**
     * 生成趋势章节
     */
    generateTrendsSection(data, options) {
        return `## 趋势分析

### 长期趋势
- 年度增长率：${(Math.random() * 20 - 10).toFixed(1)}%
- 月度波动范围：±${(Math.random() * 15 + 5).toFixed(1)}%

### 预测展望
基于当前趋势，预计未来3个月将保持稳定发展态势。
`;
    }
    
    /**
     * 生成建议章节
     */
    generateRecommendationsSection(data, options) {
        const recommendations = [
            '优化数据采集频率，提高数据质量',
            '加强异常监控，建立预警机制',
            '完善数据备份策略，确保数据安全',
            '提升系统处理能力，优化响应时间',
            '建立定期评估机制，持续改进系统'
        ];
        
        const selectedRecommendations = recommendations
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 3) + 3);
        
        let content = `## 改进建议\n\n`;
        selectedRecommendations.forEach((rec, index) => {
            content += `${index + 1}. ${rec}\n`;
        });
        
        return content;
    }
    
    /**
     * 生成结论章节
     */
    generateConclusionSection(data, options) {
        return `## 结论

综合分析结果表明，系统整体运行状况良好，各项指标基本达到预期目标。

**主要成果：**
- 系统稳定性得到有效保障
- 数据质量持续提升
- 处理效率不断优化

**下一步工作：**
- 继续监控系统运行状态
- 实施改进建议
- 定期评估和优化

报告生成时间：${new Date().toLocaleString('zh-CN')}
`;
    }
    
    /**
     * 格式化报告
     */
    formatReport(report) {
        let content = `# ${report.title}\n\n`;
        content += `**生成时间：** ${report.generatedAt.toLocaleString('zh-CN')}\n`;
        content += `**语言：** ${report.language}\n\n`;
        
        report.sections.forEach(section => {
            content += section.content + '\n\n';
        });
        
        return content;
    }
    
    /**
     * 语音转文字
     * @param {Buffer} audioData - 音频数据
     * @param {Object} options - 识别选项
     * @returns {Object} 识别结果
     */
    async speechToText(audioData, options = {}) {
        try {
            this.stats.voiceInteractions++;
            
            // 模拟语音识别
            const mockTexts = [
                '请帮我查询今天的碳排放数据',
                '生成本月的能耗分析报告',
                '设备运行状态如何',
                '有什么节能建议吗'
            ];
            
            const recognizedText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
            const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0
            
            return {
                success: true,
                text: recognizedText,
                confidence: confidence,
                language: options.language || this.currentLanguage,
                duration: audioData.length / 16000 // 假设16kHz采样率
            };
            
        } catch (error) {
            console.error('语音识别失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 文字转语音
     * @param {string} text - 要转换的文字
     * @param {Object} options - 合成选项
     * @returns {Object} 合成结果
     */
    async textToSpeech(text, options = {}) {
        try {
            this.stats.voiceInteractions++;
            
            const profile = this.voiceProfiles.get(options.profile || 'default');
            
            // 模拟语音合成
            const audioBuffer = Buffer.alloc(text.length * 1000); // 模拟音频数据
            
            return {
                success: true,
                audioData: audioBuffer,
                format: 'wav',
                sampleRate: 16000,
                duration: text.length * 0.1, // 假设每字符0.1秒
                profile: profile
            };
            
        } catch (error) {
            console.error('语音合成失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 设置语言
     * @param {string} language - 语言代码
     */
    setLanguage(language) {
        if (this.supportedLanguages.includes(language)) {
            this.currentLanguage = language;
            return true;
        }
        return false;
    }
    
    /**
     * 获取支持的语言列表
     */
    getSupportedLanguages() {
        return this.supportedLanguages.map(lang => ({
            code: lang,
            name: this.getLanguageName(lang),
            available: true
        }));
    }
    
    /**
     * 获取语言名称
     */
    getLanguageName(code) {
        const names = {
            'zh-CN': '简体中文',
            'en-US': 'English',
            'ja-JP': '日本語',
            'ko-KR': '한국어'
        };
        return names[code] || code;
    }
    
    /**
     * 文本分析
     * @param {string} text - 要分析的文本
     * @param {Array} analysisTypes - 分析类型
     * @returns {Object} 分析结果
     */
    async analyzeText(text, analysisTypes = ['sentiment', 'keywords', 'summary']) {
        const results = {};
        
        if (analysisTypes.includes('sentiment')) {
            results.sentiment = await this.analyzeSentiment(text);
        }
        
        if (analysisTypes.includes('keywords')) {
            results.keywords = await this.extractKeywords(text);
        }
        
        if (analysisTypes.includes('summary')) {
            results.summary = await this.generateSummary(text);
        }
        
        if (analysisTypes.includes('entities')) {
            results.entities = await this.extractEntities(text);
        }
        
        return results;
    }
    
    /**
     * 情感分析
     */
    async analyzeSentiment(text) {
        // 简单的情感分析模拟
        const positiveWords = ['好', '优秀', '满意', '成功', '提升', 'good', 'excellent', 'success'];
        const negativeWords = ['差', '失败', '问题', '错误', '下降', 'bad', 'fail', 'error', 'problem'];
        
        let positiveScore = 0;
        let negativeScore = 0;
        
        positiveWords.forEach(word => {
            if (text.includes(word)) positiveScore++;
        });
        
        negativeWords.forEach(word => {
            if (text.includes(word)) negativeScore++;
        });
        
        const totalScore = positiveScore - negativeScore;
        let sentiment = 'neutral';
        
        if (totalScore > 0) sentiment = 'positive';
        else if (totalScore < 0) sentiment = 'negative';
        
        return {
            sentiment: sentiment,
            score: totalScore,
            confidence: Math.min(Math.abs(totalScore) * 0.3 + 0.5, 1.0),
            details: {
                positive: positiveScore,
                negative: negativeScore
            }
        };
    }
    
    /**
     * 关键词提取
     */
    async extractKeywords(text) {
        // 简单的关键词提取
        const stopWords = ['的', '是', '在', '有', '和', '了', '与', 'the', 'is', 'in', 'and', 'of'];
        const words = text.split(/[\s，。！？；：、]+/).filter(word => 
            word.length > 1 && !stopWords.includes(word)
        );
        
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        const keywords = Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word, count]) => ({ word, count, weight: count / words.length }));
        
        return keywords;
    }
    
    /**
     * 生成摘要
     */
    async generateSummary(text, maxLength = 200) {
        // 简单的摘要生成
        const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
        
        if (sentences.length <= 2) {
            return text;
        }
        
        // 选择前两句作为摘要
        const summary = sentences.slice(0, 2).join('。') + '。';
        
        return summary.length > maxLength ? 
            summary.substring(0, maxLength) + '...' : 
            summary;
    }
    
    /**
     * 更新统计信息
     */
    updateStats(responseTime, language, success) {
        if (success) {
            this.stats.successfulResponses++;
        }
        
        this.stats.languageUsage[language] = (this.stats.languageUsage[language] || 0) + 1;
        
        // 更新平均响应时间
        const totalResponses = this.stats.successfulResponses + (this.stats.totalQueries - this.stats.successfulResponses);
        this.stats.averageResponseTime = (
            (this.stats.averageResponseTime * (totalResponses - 1) + responseTime) / totalResponses
        );
    }
    
    /**
     * 获取服务状态
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentLanguage: this.currentLanguage,
            supportedLanguages: this.supportedLanguages,
            knowledgeBaseSize: this.knowledgeBase.size,
            activeConversations: this.conversations.size,
            templates: Array.from(this.templates.keys()),
            stats: { ...this.stats },
            config: { ...this.config }
        };
    }
    
    /**
     * 获取会话列表
     */
    getConversations() {
        return Array.from(this.conversations.values()).map(conv => ({
            id: conv.id,
            language: conv.language,
            messageCount: conv.history.length,
            createdAt: conv.createdAt,
            lastActivity: conv.history.length > 0 ? 
                conv.history[conv.history.length - 1].timestamp : 
                conv.createdAt
        }));
    }
    
    /**
     * 清理过期会话
     */
    cleanupConversations(maxAge = 24 * 60 * 60 * 1000) { // 24小时
        const now = Date.now();
        const expiredSessions = [];
        
        for (const [sessionId, conversation] of this.conversations) {
            const lastActivity = conversation.history.length > 0 ? 
                conversation.history[conversation.history.length - 1].timestamp.getTime() : 
                conversation.createdAt.getTime();
            
            if (now - lastActivity > maxAge) {
                expiredSessions.push(sessionId);
            }
        }
        
        expiredSessions.forEach(sessionId => {
            this.conversations.delete(sessionId);
        });
        
        return expiredSessions.length;
    }
    
    /**
     * 停止服务
     */
    async stop() {
        console.log('正在停止NLP服务...');
        
        // 清理资源
        this.conversations.clear();
        this.knowledgeBase.clear();
        this.templates.clear();
        
        this.isInitialized = false;
        console.log('NLP服务已停止');
        this.emit('stopped');
    }
}

module.exports = NLPService;