/**
 * VPP交易策略服务
 * 提供交易策略管理、回测、AI模型集成、市场连接器等核心业务逻辑
 * 版本: v1.0
 * 创建时间: 2025年1月
 */

import db from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class VPPTradingService {
    /**
     * ==================== 交易策略管理 ====================
     */

    /**
     * 获取交易策略列表
     * @param {Object} filters - 过滤条件
     * @param {number} filters.vpp_id - VPP ID
     * @param {string} filters.strategy_type - 策略类型
     * @param {string} filters.status - 状态
     * @param {number} filters.page - 页码
     * @param {number} filters.size - 页大小
     * @returns {Promise<Object>} 策略列表和分页信息
     */
    async getTradingStrategies(filters = {}) {
        try {
            const {
                vpp_id,
                strategy_type,
                status,
                page = 1,
                size = 20
            } = filters;

            let whereConditions = [];
            let params = [];

            if (vpp_id) {
                whereConditions.push('vpp_id = ?');
                params.push(vpp_id);
            }

            if (strategy_type) {
                whereConditions.push('strategy_type = ?');
                params.push(strategy_type);
            }

            if (status) {
                whereConditions.push('status = ?');
                params.push(status);
            }

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';

            // 获取总数
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM vpp_trading_strategies 
                ${whereClause}
            `;
            const [countResult] = await db.execute(countQuery, params);
            const total = countResult[0].total;

            // 获取策略列表
            const offset = (page - 1) * size;
            const listQuery = `
                SELECT 
                    ts.*,
                    vd.name as vpp_name,
                    u.username as created_by_name
                FROM vpp_trading_strategies ts
                LEFT JOIN vpp_definitions vd ON ts.vpp_id = vd.id
                LEFT JOIN users u ON ts.created_by = u.id
                ${whereClause}
                ORDER BY ts.created_at DESC
                LIMIT ? OFFSET ?
            `;
            params.push(size, offset);
            const [strategies] = await db.execute(listQuery, params);

            return {
                success: true,
                data: {
                    strategies: strategies.map(strategy => ({
                        ...strategy,
                        config: JSON.parse(strategy.config || '{}'),
                        risk_parameters: JSON.parse(strategy.risk_parameters || '{}'),
                        performance_metrics: JSON.parse(strategy.performance_metrics || '{}')
                    })),
                    pagination: {
                        page,
                        size,
                        total,
                        pages: Math.ceil(total / size)
                    }
                }
            };
        } catch (error) {
            logger.error('获取交易策略列表失败:', error);
            throw new Error(`获取交易策略列表失败: ${error.message}`);
        }
    }

    /**
     * 创建交易策略
     * @param {Object} strategyData - 策略数据
     * @returns {Promise<Object>} 创建结果
     */
    async createTradingStrategy(strategyData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                name,
                description,
                vpp_id,
                strategy_type,
                market_type,
                config,
                risk_parameters,
                created_by
            } = strategyData;

            // 验证VPP是否存在
            const [vppCheck] = await connection.execute(
                'SELECT id FROM vpp_definitions WHERE id = ? AND status = "active"',
                [vpp_id]
            );

            if (vppCheck.length === 0) {
                throw new Error('指定的VPP不存在或未激活');
            }

            // 检查策略名称是否重复
            const [nameCheck] = await connection.execute(
                'SELECT id FROM vpp_trading_strategies WHERE name = ? AND vpp_id = ?',
                [name, vpp_id]
            );

            if (nameCheck.length > 0) {
                throw new Error('该VPP下已存在同名策略');
            }

            // 插入策略记录
            const insertQuery = `
                INSERT INTO vpp_trading_strategies (
                    name, description, vpp_id, strategy_type, market_type,
                    config, risk_parameters, created_by, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'inactive')
            `;

            const [result] = await connection.execute(insertQuery, [
                name,
                description || null,
                vpp_id,
                strategy_type,
                market_type,
                JSON.stringify(config || {}),
                JSON.stringify(risk_parameters || {}),
                created_by
            ]);

            // 记录操作日志
            await this._logStrategyOperation(connection, {
                strategy_id: result.insertId,
                operation_type: 'create',
                operator_id: created_by,
                details: { name, strategy_type, market_type }
            });

            await connection.commit();

            return {
                success: true,
                data: {
                    id: result.insertId,
                    message: '交易策略创建成功'
                }
            };
        } catch (error) {
            await connection.rollback();
            logger.error('创建交易策略失败:', error);
            throw new Error(`创建交易策略失败: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * 更新交易策略
     * @param {number} strategyId - 策略ID
     * @param {Object} updateData - 更新数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateTradingStrategy(strategyId, updateData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 检查策略是否存在
            const [strategyCheck] = await connection.execute(
                'SELECT id, name, status FROM vpp_trading_strategies WHERE id = ?',
                [strategyId]
            );

            if (strategyCheck.length === 0) {
                throw new Error('策略不存在');
            }

            const currentStrategy = strategyCheck[0];

            // 如果策略正在运行，限制某些字段的修改
            if (currentStrategy.status === 'active' && 
                (updateData.strategy_type || updateData.market_type)) {
                throw new Error('运行中的策略不能修改类型和市场类型');
            }

            // 构建更新字段
            const updateFields = [];
            const updateValues = [];

            const allowedFields = [
                'name', 'description', 'config', 'risk_parameters', 'status'
            ];

            allowedFields.forEach(field => {
                if (updateData.hasOwnProperty(field)) {
                    updateFields.push(`${field} = ?`);
                    if (field === 'config' || field === 'risk_parameters') {
                        updateValues.push(JSON.stringify(updateData[field]));
                    } else {
                        updateValues.push(updateData[field]);
                    }
                }
            });

            if (updateFields.length === 0) {
                throw new Error('没有有效的更新字段');
            }

            updateFields.push('updated_at = NOW()');
            updateValues.push(strategyId);

            const updateQuery = `
                UPDATE vpp_trading_strategies 
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `;

            await connection.execute(updateQuery, updateValues);

            // 记录操作日志
            await this._logStrategyOperation(connection, {
                strategy_id: strategyId,
                operation_type: 'update',
                operator_id: updateData.updated_by,
                details: updateData
            });

            await connection.commit();

            return {
                success: true,
                data: {
                    message: '交易策略更新成功'
                }
            };
        } catch (error) {
            await connection.rollback();
            logger.error('更新交易策略失败:', error);
            throw new Error(`更新交易策略失败: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * ==================== 策略回测 ====================
     */

    /**
     * 提交策略回测任务
     * @param {Object} backtestData - 回测数据
     * @returns {Promise<Object>} 回测任务信息
     */
    async submitBacktestTask(backtestData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                strategy_id,
                start_date,
                end_date,
                initial_capital = 1000000,
                market_data_source = 'historical',
                simulation_config = {},
                created_by
            } = backtestData;

            // 验证策略是否存在
            const [strategyCheck] = await connection.execute(
                'SELECT id, name FROM vpp_trading_strategies WHERE id = ?',
                [strategy_id]
            );

            if (strategyCheck.length === 0) {
                throw new Error('指定的策略不存在');
            }

            // 验证日期范围
            if (new Date(start_date) >= new Date(end_date)) {
                throw new Error('开始日期必须早于结束日期');
            }

            // 插入回测任务
            const insertQuery = `
                INSERT INTO backtest_tasks (
                    strategy_id, start_date, end_date, initial_capital,
                    market_data_source, simulation_config, created_by, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
            `;

            const [result] = await connection.execute(insertQuery, [
                strategy_id,
                start_date,
                end_date,
                initial_capital,
                market_data_source,
                JSON.stringify(simulation_config),
                created_by
            ]);

            const taskId = result.insertId;

            // 异步启动回测任务
            this._executeBacktestTask(taskId).catch(error => {
                logger.error(`回测任务 ${taskId} 执行失败:`, error);
            });

            await connection.commit();

            return {
                success: true,
                data: {
                    task_id: taskId,
                    message: '回测任务提交成功',
                    estimated_duration: '5-10分钟'
                }
            };
        } catch (error) {
            await connection.rollback();
            logger.error('提交回测任务失败:', error);
            throw new Error(`提交回测任务失败: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * 获取回测结果
     * @param {number} taskId - 任务ID
     * @returns {Promise<Object>} 回测结果
     */
    async getBacktestResults(taskId) {
        try {
            const query = `
                SELECT 
                    bt.*,
                    ts.name as strategy_name,
                    ts.strategy_type
                FROM backtest_tasks bt
                LEFT JOIN vpp_trading_strategies ts ON bt.strategy_id = ts.id
                WHERE bt.id = ?
            `;

            const [results] = await db.execute(query, [taskId]);

            if (results.length === 0) {
                throw new Error('回测任务不存在');
            }

            const task = results[0];

            return {
                success: true,
                data: {
                    task_id: taskId,
                    status: task.status,
                    strategy_name: task.strategy_name,
                    strategy_type: task.strategy_type,
                    start_date: task.start_date,
                    end_date: task.end_date,
                    initial_capital: task.initial_capital,
                    results: task.results ? JSON.parse(task.results) : null,
                    performance_metrics: task.performance_metrics ? JSON.parse(task.performance_metrics) : null,
                    created_at: task.created_at,
                    completed_at: task.completed_at,
                    error_message: task.error_message
                }
            };
        } catch (error) {
            logger.error('获取回测结果失败:', error);
            throw new Error(`获取回测结果失败: ${error.message}`);
        }
    }

    /**
     * 执行回测任务（异步）
     * @param {number} taskId - 任务ID
     * @private
     */
    async _executeBacktestTask(taskId) {
        const connection = await db.getConnection();
        try {
            // 更新任务状态为运行中
            await connection.execute(
                'UPDATE backtest_tasks SET status = "running", started_at = NOW() WHERE id = ?',
                [taskId]
            );

            // 获取任务详情
            const [taskDetails] = await connection.execute(
                'SELECT * FROM backtest_tasks WHERE id = ?',
                [taskId]
            );

            const task = taskDetails[0];

            // 模拟回测计算过程
            await new Promise(resolve => setTimeout(resolve, 5000)); // 模拟5秒计算时间

            // 生成模拟回测结果
            const results = this._generateMockBacktestResults(task);

            // 更新任务结果
            await connection.execute(`
                UPDATE backtest_tasks 
                SET status = 'completed', 
                    results = ?, 
                    performance_metrics = ?,
                    completed_at = NOW()
                WHERE id = ?
            `, [
                JSON.stringify(results.results),
                JSON.stringify(results.performance_metrics),
                taskId
            ]);

            logger.info(`回测任务 ${taskId} 执行完成`);
        } catch (error) {
            // 更新任务状态为失败
            await connection.execute(
                'UPDATE backtest_tasks SET status = "failed", error_message = ?, completed_at = NOW() WHERE id = ?',
                [error.message, taskId]
            );
            logger.error(`回测任务 ${taskId} 执行失败:`, error);
        } finally {
            connection.release();
        }
    }

    /**
     * 生成模拟回测结果
     * @param {Object} task - 任务信息
     * @returns {Object} 回测结果
     * @private
     */
    _generateMockBacktestResults(task) {
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // 生成模拟交易记录
        const trades = [];
        const dailyReturns = [];
        let currentCapital = task.initial_capital;
        
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dailyReturn = (Math.random() - 0.45) * 0.05; // -2.5% 到 +2.5% 的日收益
            const profit = currentCapital * dailyReturn;
            
            currentCapital += profit;
            dailyReturns.push({
                date: date.toISOString().split('T')[0],
                return: dailyReturn,
                capital: currentCapital,
                profit: profit
            });
            
            // 随机生成一些交易记录
            if (Math.random() > 0.7) {
                trades.push({
                    date: date.toISOString(),
                    type: Math.random() > 0.5 ? 'buy' : 'sell',
                    quantity: Math.floor(Math.random() * 1000) + 100,
                    price: 0.4 + Math.random() * 0.2,
                    profit: profit > 0 ? profit : 0
                });
            }
        }
        
        const totalReturn = (currentCapital - task.initial_capital) / task.initial_capital;
        const profitableTrades = trades.filter(t => t.profit > 0).length;
        const winRate = trades.length > 0 ? profitableTrades / trades.length : 0;
        
        // 计算夏普比率（简化版）
        const avgReturn = dailyReturns.reduce((sum, r) => sum + r.return, 0) / dailyReturns.length;
        const returnStd = Math.sqrt(
            dailyReturns.reduce((sum, r) => sum + Math.pow(r.return - avgReturn, 2), 0) / dailyReturns.length
        );
        const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0;
        
        // 计算最大回撤
        let maxDrawdown = 0;
        let peak = task.initial_capital;
        dailyReturns.forEach(r => {
            if (r.capital > peak) peak = r.capital;
            const drawdown = (peak - r.capital) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });
        
        return {
            results: {
                total_return: totalReturn,
                final_capital: currentCapital,
                total_trades: trades.length,
                profitable_trades: profitableTrades,
                losing_trades: trades.length - profitableTrades,
                win_rate: winRate,
                avg_profit: trades.length > 0 ? trades.reduce((sum, t) => sum + t.profit, 0) / trades.length : 0,
                performance_chart: dailyReturns,
                trade_history: trades.slice(0, 50) // 只返回前50条交易记录
            },
            performance_metrics: {
                sharpe_ratio: sharpeRatio,
                max_drawdown: maxDrawdown,
                volatility: returnStd * Math.sqrt(252),
                calmar_ratio: totalReturn / (maxDrawdown || 0.01)
            }
        };
    }

    /**
     * ==================== AI模型管理 ====================
     */

    /**
     * 获取AI模型列表
     * @param {Object} filters - 过滤条件
     * @returns {Promise<Object>} 模型列表
     */
    async getAIModels(filters = {}) {
        try {
            const {
                model_type,
                status,
                page = 1,
                size = 20
            } = filters;

            let whereConditions = [];
            let params = [];

            if (model_type) {
                whereConditions.push('model_type = ?');
                params.push(model_type);
            }

            if (status) {
                whereConditions.push('status = ?');
                params.push(status);
            }

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';

            // 获取总数
            const countQuery = `SELECT COUNT(*) as total FROM ai_models ${whereClause}`;
            const [countResult] = await db.execute(countQuery, params);
            const total = countResult[0].total;

            // 获取模型列表
            const offset = (page - 1) * size;
            const listQuery = `
                SELECT 
                    am.*,
                    u.username as created_by_name
                FROM ai_models am
                LEFT JOIN users u ON am.created_by = u.id
                ${whereClause}
                ORDER BY am.created_at DESC
                LIMIT ? OFFSET ?
            `;
            params.push(size, offset);
            const [models] = await db.execute(listQuery, params);

            return {
                success: true,
                data: {
                    models: models.map(model => ({
                        ...model,
                        input_schema: JSON.parse(model.input_schema || '{}'),
                        output_schema: JSON.parse(model.output_schema || '{}'),
                        performance_metrics: JSON.parse(model.performance_metrics || '{}')
                    })),
                    pagination: {
                        page,
                        size,
                        total,
                        pages: Math.ceil(total / size)
                    }
                }
            };
        } catch (error) {
            logger.error('获取AI模型列表失败:', error);
            throw new Error(`获取AI模型列表失败: ${error.message}`);
        }
    }

    /**
     * 注册AI模型
     * @param {Object} modelData - 模型数据
     * @returns {Promise<Object>} 注册结果
     */
    async registerAIModel(modelData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                name,
                description,
                model_type,
                version,
                model_path,
                input_schema,
                output_schema,
                performance_metrics,
                created_by
            } = modelData;

            // 检查模型名称和版本是否重复
            const [nameCheck] = await connection.execute(
                'SELECT id FROM ai_models WHERE name = ? AND version = ?',
                [name, version]
            );

            if (nameCheck.length > 0) {
                throw new Error('该名称和版本的模型已存在');
            }

            // 插入模型记录
            const insertQuery = `
                INSERT INTO ai_models (
                    name, description, model_type, version, model_path,
                    input_schema, output_schema, performance_metrics, created_by, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'inactive')
            `;

            const [result] = await connection.execute(insertQuery, [
                name,
                description || null,
                model_type,
                version,
                model_path,
                JSON.stringify(input_schema || {}),
                JSON.stringify(output_schema || {}),
                JSON.stringify(performance_metrics || {}),
                created_by
            ]);

            await connection.commit();

            return {
                success: true,
                data: {
                    id: result.insertId,
                    message: 'AI模型注册成功'
                }
            };
        } catch (error) {
            await connection.rollback();
            logger.error('注册AI模型失败:', error);
            throw new Error(`注册AI模型失败: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * AI模型预测
     * @param {number} modelId - 模型ID
     * @param {Object} inputData - 输入数据
     * @returns {Promise<Object>} 预测结果
     */
    async predictWithAIModel(modelId, inputData) {
        try {
            // 获取模型信息
            const [modelInfo] = await db.execute(
                'SELECT * FROM ai_models WHERE id = ? AND status = "active"',
                [modelId]
            );

            if (modelInfo.length === 0) {
                throw new Error('模型不存在或未激活');
            }

            const model = modelInfo[0];

            // 验证输入数据格式（简化版）
            const inputSchema = JSON.parse(model.input_schema || '{}');
            // 这里应该实现详细的数据验证逻辑

            // 模拟AI模型预测过程
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟1秒预测时间

            // 生成模拟预测结果
            const prediction = this._generateMockPrediction(model.model_type, inputData);

            // 记录预测日志
            await db.execute(`
                INSERT INTO ai_model_predictions (
                    model_id, input_data, prediction_result, confidence, created_at
                ) VALUES (?, ?, ?, ?, NOW())
            `, [
                modelId,
                JSON.stringify(inputData),
                JSON.stringify(prediction.result),
                prediction.confidence
            ]);

            return {
                success: true,
                data: {
                    model_id: modelId,
                    model_name: model.name,
                    model_type: model.model_type,
                    prediction: prediction.result,
                    confidence: prediction.confidence,
                    prediction_time: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('AI模型预测失败:', error);
            throw new Error(`AI模型预测失败: ${error.message}`);
        }
    }

    /**
     * 生成模拟预测结果
     * @param {string} modelType - 模型类型
     * @param {Object} inputData - 输入数据
     * @returns {Object} 预测结果
     * @private
     */
    _generateMockPrediction(modelType, inputData) {
        const confidence = 0.7 + Math.random() * 0.25; // 70%-95%的置信度
        
        switch (modelType) {
            case 'price_prediction':
                return {
                    result: {
                        next_hour_price: 0.4 + Math.random() * 0.2,
                        next_day_avg_price: 0.45 + Math.random() * 0.1,
                        price_trend: Math.random() > 0.5 ? 'up' : 'down',
                        volatility: Math.random() * 0.1
                    },
                    confidence
                };
            
            case 'demand_forecast':
                return {
                    result: {
                        next_hour_demand: 800 + Math.random() * 400,
                        peak_demand_time: '14:00',
                        daily_total_demand: 18000 + Math.random() * 4000,
                        demand_pattern: 'normal'
                    },
                    confidence
                };
            
            case 'risk_assessment':
                return {
                    result: {
                        risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                        risk_score: Math.random() * 100,
                        main_risk_factors: ['market_volatility', 'weather_uncertainty'],
                        recommended_action: 'monitor'
                    },
                    confidence
                };
            
            case 'optimization':
                return {
                    result: {
                        optimal_bid_price: 0.42 + Math.random() * 0.06,
                        optimal_quantity: 500 + Math.random() * 300,
                        expected_profit: 1000 + Math.random() * 500,
                        strategy_adjustments: ['increase_storage_usage', 'reduce_peak_load']
                    },
                    confidence
                };
            
            default:
                return {
                    result: { message: '未知模型类型' },
                    confidence: 0.5
                };
        }
    }

    /**
     * ==================== 辅助方法 ====================
     */

    /**
     * 记录策略操作日志
     * @param {Object} connection - 数据库连接
     * @param {Object} logData - 日志数据
     * @private
     */
    async _logStrategyOperation(connection, logData) {
        const {
            strategy_id,
            operation_type,
            operator_id,
            details
        } = logData;

        await connection.execute(`
            INSERT INTO strategy_operation_logs (
                strategy_id, operation_type, operator_id, details, created_at
            ) VALUES (?, ?, ?, ?, NOW())
        `, [
            strategy_id,
            operation_type,
            operator_id,
            JSON.stringify(details)
        ]);
    }

    /**
     * 获取策略性能统计
     * @param {number} strategyId - 策略ID
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Promise<Object>} 性能统计
     */
    async getStrategyPerformanceStats(strategyId, startDate, endDate) {
        try {
            // 这里应该实现真实的性能统计逻辑
            // 暂时返回模拟数据
            return {
                success: true,
                data: {
                    strategy_id: strategyId,
                    period: { start_date: startDate, end_date: endDate },
                    performance: {
                        total_return: 15.6,
                        sharpe_ratio: 1.8,
                        max_drawdown: -5.2,
                        win_rate: 68.5,
                        total_trades: 156,
                        avg_profit: 320
                    },
                    generated_at: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('获取策略性能统计失败:', error);
            throw new Error(`获取策略性能统计失败: ${error.message}`);
        }
    }
}

export default new VPPTradingService();