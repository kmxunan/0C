/**
 * 虚拟电厂智能决策服务
 * 实现强化学习策略、多目标优化、自适应参数调整和市场趋势预测
 * 
 * @author VPP Development Team
 * @version 2.0.0
 * @since P2 Phase
 */

const EventEmitter = require('events');
const VPPDatabase = require('./vppDatabase');
const VPPConfig = require('./vppConfig');
const VPPAIModelService = require('./VPPAIModelService');
const VPPStrategyService = require('./VPPStrategyService');
const VPPAdvancedTradingService = require('./VPPAdvancedTradingService');

// 强化学习算法类型
const RL_ALGORITHMS = {
  Q_LEARNING: 'q_learning',
  DEEP_Q_NETWORK: 'dqn',
  POLICY_GRADIENT: 'policy_gradient',
  ACTOR_CRITIC: 'actor_critic',
  PROXIMAL_POLICY: 'ppo',
  SOFT_ACTOR_CRITIC: 'sac'
};

// 优化算法类型
const OPTIMIZATION_ALGORITHMS = {
  GENETIC: 'genetic_algorithm',
  PARTICLE_SWARM: 'particle_swarm',
  SIMULATED_ANNEALING: 'simulated_annealing',
  DIFFERENTIAL_EVOLUTION: 'differential_evolution',
  NSGA_II: 'nsga_ii',
  MULTI_OBJECTIVE_PSO: 'mopso'
};

// 决策类型
const DECISION_TYPES = {
  TRADING: 'trading_decision',
  DISPATCH: 'dispatch_decision',
  PRICING: 'pricing_decision',
  RISK_MANAGEMENT: 'risk_management_decision',
  RESOURCE_ALLOCATION: 'resource_allocation_decision'
};

// 学习模式
const LEARNING_MODES = {
  ONLINE: 'online_learning',
  OFFLINE: 'offline_learning',
  HYBRID: 'hybrid_learning',
  TRANSFER: 'transfer_learning'
};

// 市场状态
const MARKET_STATES = {
  BULL: 'bull_market',
  BEAR: 'bear_market',
  SIDEWAYS: 'sideways_market',
  VOLATILE: 'volatile_market',
  STABLE: 'stable_market'
};

class VPPIntelligentDecisionService extends EventEmitter {
  constructor() {
    super();
    this.db = new VPPDatabase();
    this.config = VPPConfig.getConfig();
    this.aiModelService = new VPPAIModelService();
    this.strategyService = new VPPStrategyService();
    this.advancedTradingService = new VPPAdvancedTradingService();
    
    // 强化学习环境
    this.rlEnvironment = {
      state: null,
      action: null,
      reward: 0,
      nextState: null,
      done: false
    };
    
    // 学习参数
    this.learningParams = {
      learningRate: 0.001,
      discountFactor: 0.95,
      explorationRate: 0.1,
      explorationDecay: 0.995,
      minExplorationRate: 0.01,
      batchSize: 32,
      memorySize: 10000
    };
    
    // 多目标优化参数
    this.optimizationParams = {
      populationSize: 100,
      generations: 50,
      crossoverRate: 0.8,
      mutationRate: 0.1,
      eliteSize: 10
    };
    
    // 缓存
    this.decisionCache = new Map();
    this.modelCache = new Map();
    this.stateCache = new Map();
    
    // 性能指标
    this.performanceMetrics = {
      totalDecisions: 0,
      successfulDecisions: 0,
      averageReward: 0,
      learningProgress: 0
    };
    
    this.initializeService();
  }

  /**
   * 初始化服务
   */
  async initializeService() {
    try {
      await this.loadLearningModels();
      await this.initializeRLEnvironment();
      await this.startAdaptiveLearning();
      this.emit('service_initialized', { timestamp: new Date() });
    } catch (error) {
      console.error('Intelligent decision service initialization failed:', error);
      throw error;
    }
  }

  /**
   * 强化学习策略决策
   */
  async makeRLDecision(params) {
    try {
      const {
        vppId,
        decisionType = DECISION_TYPES.TRADING,
        algorithm = RL_ALGORITHMS.DEEP_Q_NETWORK,
        learningMode = LEARNING_MODES.ONLINE,
        contextData = {}
      } = params;

      // 获取当前状态
      const currentState = await this.getCurrentState(vppId, decisionType, contextData);
      
      // 选择动作
      const action = await this.selectAction(currentState, algorithm, decisionType);
      
      // 执行动作
      const executionResult = await this.executeAction(action, vppId, decisionType);
      
      // 计算奖励
      const reward = await this.calculateReward(executionResult, decisionType);
      
      // 获取下一状态
      const nextState = await this.getCurrentState(vppId, decisionType, contextData);
      
      // 更新学习模型（在线学习模式）
      if (learningMode === LEARNING_MODES.ONLINE || learningMode === LEARNING_MODES.HYBRID) {
        await this.updateRLModel({
          state: currentState,
          action,
          reward,
          nextState,
          algorithm,
          decisionType
        });
      }
      
      // 记录决策历史
      await this.recordDecision({
        vppId,
        decisionType,
        algorithm,
        state: currentState,
        action,
        reward,
        executionResult,
        timestamp: new Date()
      });
      
      // 更新性能指标
      this.updatePerformanceMetrics(reward, executionResult.success);
      
      return {
        success: true,
        vppId,
        decisionType,
        algorithm,
        state: currentState,
        action,
        reward,
        executionResult,
        confidence: action.confidence || 0.8
      };
      
    } catch (error) {
      console.error('RL decision making failed:', error);
      throw error;
    }
  }

  /**
   * 多目标优化决策
   */
  async makeMultiObjectiveDecision(params) {
    try {
      const {
        vppId,
        objectives = ['profit', 'risk', 'sustainability'],
        weights = [0.5, 0.3, 0.2],
        algorithm = OPTIMIZATION_ALGORITHMS.NSGA_II,
        constraints = {},
        timeHorizon = 24
      } = params;

      // 验证输入参数
      if (objectives.length !== weights.length) {
        throw new Error('Objectives and weights arrays must have the same length');
      }
      
      if (Math.abs(weights.reduce((sum, w) => sum + w, 0) - 1) > 0.001) {
        throw new Error('Weights must sum to 1');
      }
      
      // 获取VPP状态和约束
      const vppState = await this.getVPPState(vppId);
      const marketConditions = await this.getMarketConditions(timeHorizon);
      
      // 生成候选解决方案
      const candidateSolutions = await this.generateCandidateSolutions({
        vppState,
        marketConditions,
        constraints,
        algorithm
      });
      
      // 评估多目标函数
      const evaluatedSolutions = await this.evaluateMultiObjectives(
        candidateSolutions, objectives, vppId
      );
      
      // 执行多目标优化
      const optimizationResult = await this.executeMultiObjectiveOptimization({
        solutions: evaluatedSolutions,
        objectives,
        weights,
        algorithm
      });
      
      // 选择最优解
      const optimalSolution = await this.selectOptimalSolution(
        optimizationResult.paretoFront, weights
      );
      
      // 执行优化决策
      const executionResult = await this.executeOptimalSolution(optimalSolution, vppId);
      
      return {
        success: true,
        vppId,
        objectives,
        weights,
        algorithm,
        paretoFront: optimizationResult.paretoFront,
        optimalSolution,
        executionResult,
        convergenceMetrics: optimizationResult.convergenceMetrics
      };
      
    } catch (error) {
      console.error('Multi-objective decision making failed:', error);
      throw error;
    }
  }

  /**
   * 自适应参数调整
   */
  async adaptiveParameterAdjustment(params) {
    try {
      const {
        vppId,
        targetMetrics = ['profit', 'risk', 'efficiency'],
        adjustmentStrategy = 'gradient_based',
        learningWindow = 168, // 7天
        adaptationRate = 0.1
      } = params;

      // 获取历史性能数据
      const historicalPerformance = await this.getHistoricalPerformance(
        vppId, learningWindow
      );
      
      // 分析性能趋势
      const performanceTrends = await this.analyzePerformanceTrends(
        historicalPerformance, targetMetrics
      );
      
      // 识别需要调整的参数
      const parametersToAdjust = await this.identifyParametersForAdjustment(
        performanceTrends, targetMetrics
      );
      
      // 计算参数调整方案
      const adjustmentPlan = await this.calculateParameterAdjustments({
        parameters: parametersToAdjust,
        trends: performanceTrends,
        strategy: adjustmentStrategy,
        adaptationRate
      });
      
      // 执行参数调整
      const adjustmentResults = await this.executeParameterAdjustments(
        vppId, adjustmentPlan
      );
      
      // 验证调整效果
      const validationResults = await this.validateAdjustmentEffects(
        vppId, adjustmentResults, targetMetrics
      );
      
      return {
        success: true,
        vppId,
        targetMetrics,
        adjustmentStrategy,
        performanceTrends,
        adjustmentPlan,
        adjustmentResults,
        validationResults,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Adaptive parameter adjustment failed:', error);
      throw error;
    }
  }

  /**
   * 市场趋势预测
   */
  async predictMarketTrends(params) {
    try {
      const {
        markets = ['spot', 'day_ahead', 'intraday'],
        timeHorizon = 168, // 7天
        predictionModels = ['lstm', 'transformer', 'ensemble'],
        confidenceLevel = 0.95
      } = params;

      const predictions = {};
      
      for (const market of markets) {
        // 获取历史市场数据
        const historicalData = await this.getHistoricalMarketData(market, timeHorizon * 2);
        
        // 特征工程
        const features = await this.extractMarketFeatures(historicalData);
        
        // 多模型预测
        const modelPredictions = {};
        for (const model of predictionModels) {
          modelPredictions[model] = await this.predictWithModel(
            model, features, timeHorizon
          );
        }
        
        // 集成预测结果
        const ensemblePrediction = await this.ensemblePredictions(
          modelPredictions, confidenceLevel
        );
        
        // 趋势分析
        const trendAnalysis = await this.analyzeTrends(ensemblePrediction);
        
        predictions[market] = {
          prediction: ensemblePrediction,
          trendAnalysis,
          confidence: ensemblePrediction.confidence,
          modelContributions: modelPredictions
        };
      }
      
      // 跨市场关联分析
      const crossMarketAnalysis = await this.analyzeCrossMarketCorrelations(predictions);
      
      // 生成交易信号
      const tradingSignals = await this.generateTradingSignals(predictions, crossMarketAnalysis);
      
      return {
        success: true,
        markets,
        timeHorizon,
        predictions,
        crossMarketAnalysis,
        tradingSignals,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Market trend prediction failed:', error);
      throw error;
    }
  }

  /**
   * 获取当前状态
   */
  async getCurrentState(vppId, decisionType, contextData) {
    const cacheKey = `state_${vppId}_${decisionType}`;
    
    if (this.stateCache.has(cacheKey)) {
      const cached = this.stateCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1分钟缓存
        return cached.state;
      }
    }
    
    const state = {
      vppId,
      timestamp: new Date(),
      marketConditions: await this.getMarketConditions(1),
      vppStatus: await this.getVPPStatus(vppId),
      resourceStatus: await this.getResourceStatus(vppId),
      portfolioMetrics: await this.getPortfolioMetrics(vppId),
      riskMetrics: await this.getRiskMetrics(vppId),
      contextData
    };
    
    // 状态向量化
    state.vector = await this.vectorizeState(state);
    
    this.stateCache.set(cacheKey, { state, timestamp: Date.now() });
    return state;
  }

  /**
   * 选择动作
   */
  async selectAction(state, algorithm, decisionType) {
    const modelKey = `${algorithm}_${decisionType}`;
    
    // 获取或创建模型
    let model = this.modelCache.get(modelKey);
    if (!model) {
      model = await this.createRLModel(algorithm, decisionType);
      this.modelCache.set(modelKey, model);
    }
    
    // ε-贪婪策略
    if (Math.random() < this.learningParams.explorationRate) {
      // 探索：随机选择动作
      return await this.getRandomAction(decisionType);
    } else {
      // 利用：选择最优动作
      return await this.getBestAction(model, state, decisionType);
    }
  }

  /**
   * 执行动作
   */
  async executeAction(action, vppId, decisionType) {
    try {
      let result;
      
      switch (decisionType) {
        case DECISION_TYPES.TRADING:
          result = await this.executeTradingAction(action, vppId);
          break;
        case DECISION_TYPES.DISPATCH:
          result = await this.executeDispatchAction(action, vppId);
          break;
        case DECISION_TYPES.PRICING:
          result = await this.executePricingAction(action, vppId);
          break;
        case DECISION_TYPES.RISK_MANAGEMENT:
          result = await this.executeRiskAction(action, vppId);
          break;
        default:
          throw new Error(`Unsupported decision type: ${decisionType}`);
      }
      
      return { success: true, result, action };
      
    } catch (error) {
      console.error('Action execution failed:', error);
      return { success: false, error: error.message, action };
    }
  }

  /**
   * 计算奖励
   */
  async calculateReward(executionResult, decisionType) {
    if (!executionResult.success) {
      return -1; // 执行失败的惩罚
    }
    
    let reward = 0;
    
    switch (decisionType) {
      case DECISION_TYPES.TRADING:
        // 基于交易收益计算奖励
        reward = executionResult.result.profit || 0;
        break;
      case DECISION_TYPES.DISPATCH:
        // 基于调度效率计算奖励
        reward = executionResult.result.efficiency || 0;
        break;
      case DECISION_TYPES.PRICING:
        // 基于定价准确性计算奖励
        reward = executionResult.result.accuracy || 0;
        break;
      case DECISION_TYPES.RISK_MANAGEMENT:
        // 基于风险降低程度计算奖励
        reward = executionResult.result.riskReduction || 0;
        break;
    }
    
    // 标准化奖励到[-1, 1]范围
    return Math.max(-1, Math.min(1, reward / 1000));
  }

  /**
   * 更新强化学习模型
   */
  async updateRLModel(params) {
    const { state, action, reward, nextState, algorithm, decisionType } = params;
    
    // 存储经验
    await this.storeExperience({
      state: state.vector,
      action: action.id,
      reward,
      nextState: nextState.vector,
      done: false
    });
    
    // 批量学习
    if (this.shouldPerformBatchLearning()) {
      await this.performBatchLearning(algorithm, decisionType);
    }
    
    // 更新探索率
    this.updateExplorationRate();
  }

  /**
   * 生成候选解决方案
   */
  async generateCandidateSolutions(params) {
    const { vppState, marketConditions, constraints, algorithm } = params;
    const solutions = [];
    
    for (let i = 0; i < this.optimizationParams.populationSize; i++) {
      const solution = await this.generateRandomSolution(vppState, constraints);
      solutions.push(solution);
    }
    
    return solutions;
  }

  /**
   * 评估多目标函数
   */
  async evaluateMultiObjectives(solutions, objectives, vppId) {
    const evaluatedSolutions = [];
    
    for (const solution of solutions) {
      const objectiveValues = {};
      
      for (const objective of objectives) {
        objectiveValues[objective] = await this.evaluateObjective(
          solution, objective, vppId
        );
      }
      
      evaluatedSolutions.push({
        ...solution,
        objectives: objectiveValues
      });
    }
    
    return evaluatedSolutions;
  }

  /**
   * 启动自适应学习
   */
  async startAdaptiveLearning() {
    setInterval(async () => {
      try {
        await this.performAdaptiveLearning();
      } catch (error) {
        console.error('Adaptive learning error:', error);
      }
    }, 3600000); // 每小时执行一次
  }

  /**
   * 执行自适应学习
   */
  async performAdaptiveLearning() {
    // 分析最近的决策性能
    const recentPerformance = await this.analyzeRecentPerformance();
    
    // 调整学习参数
    if (recentPerformance.averageReward < 0.5) {
      this.learningParams.learningRate *= 1.1; // 增加学习率
      this.learningParams.explorationRate *= 1.05; // 增加探索率
    } else if (recentPerformance.averageReward > 0.8) {
      this.learningParams.learningRate *= 0.95; // 减少学习率
      this.learningParams.explorationRate *= 0.95; // 减少探索率
    }
    
    // 确保参数在合理范围内
    this.learningParams.learningRate = Math.max(0.0001, Math.min(0.01, this.learningParams.learningRate));
    this.learningParams.explorationRate = Math.max(0.01, Math.min(0.3, this.learningParams.explorationRate));
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus() {
    return {
      serviceName: 'VPPIntelligentDecisionService',
      version: '2.0.0',
      status: 'running',
      learningParams: this.learningParams,
      optimizationParams: this.optimizationParams,
      performanceMetrics: this.performanceMetrics,
      cacheSize: {
        decision: this.decisionCache.size,
        model: this.modelCache.size,
        state: this.stateCache.size
      },
      lastUpdate: new Date()
    };
  }

  /**
   * 停止服务
   */
  async stopService() {
    // 保存学习模型
    await this.saveLearningModels();
    
    // 清理缓存
    this.decisionCache.clear();
    this.modelCache.clear();
    this.stateCache.clear();
    
    this.emit('service_stopped', { timestamp: new Date() });
  }
}

module.exports = VPPIntelligentDecisionService;