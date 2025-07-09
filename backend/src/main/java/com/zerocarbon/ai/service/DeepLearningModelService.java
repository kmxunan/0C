package com.zerocarbon.ai.service;

import com.zerocarbon.ai.model.*;
import com.zerocarbon.ai.repository.ModelRepository;
import com.zerocarbon.ai.repository.TrainingDataRepository;
import com.zerocarbon.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * 深度学习模型优化服务
 * 实现更精准的碳排放预测模型、智能异常检测算法等AI/ML能力增强
 * 
 * @author Zero Carbon Team
 * @version 1.0
 * @since 2025-01-10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeepLearningModelService {
    
    private final ModelRepository modelRepository;
    private final TrainingDataRepository trainingDataRepository;
    
    @Value("${ai.model.training.batch-size:1000}")
    private int batchSize;
    
    @Value("${ai.model.training.epochs:100}")
    private int epochs;
    
    @Value("${ai.model.training.learning-rate:0.001}")
    private double learningRate;
    
    @Value("${ai.model.prediction.confidence-threshold:0.85}")
    private double confidenceThreshold;
    
    @Value("${ai.model.auto-retrain.enabled:true}")
    private boolean autoRetrainEnabled;
    
    @Value("${ai.model.auto-retrain.interval-hours:24}")
    private int autoRetrainIntervalHours;
    
    // 模型缓存
    private final Map<String, CarbonPredictionModel> modelCache = new HashMap<>();
    private final Map<String, AnomalyDetectionModel> anomalyModelCache = new HashMap<>();
    
    /**
     * 训练碳排放预测模型
     */
    @Async
    @Transactional
    public CompletableFuture<ModelTrainingResult> trainCarbonPredictionModel(
            String modelName, CarbonPredictionTrainingConfig config) {
        try {
            log.info("开始训练碳排放预测模型: {}", modelName);
            
            // 1. 准备训练数据
            List<CarbonTrainingData> trainingData = prepareTrainingData(config);
            if (trainingData.size() < config.getMinDataSize()) {
                throw new BusinessException("训练数据不足，需要至少 " + config.getMinDataSize() + " 条数据");
            }
            
            // 2. 数据预处理
            ProcessedTrainingData processedData = preprocessTrainingData(trainingData, config);
            
            // 3. 构建深度学习模型
            CarbonPredictionModel model = buildCarbonPredictionModel(config);
            
            // 4. 训练模型
            TrainingMetrics metrics = trainModel(model, processedData, config);
            
            // 5. 模型验证
            ValidationResult validation = validateModel(model, processedData.getValidationSet());
            
            // 6. 保存模型
            String modelId = saveModel(modelName, model, metrics, validation);
            
            // 7. 更新缓存
            modelCache.put(modelId, model);
            
            ModelTrainingResult result = ModelTrainingResult.builder()
                    .modelId(modelId)
                    .modelName(modelName)
                    .trainingMetrics(metrics)
                    .validationResult(validation)
                    .trainingTime(LocalDateTime.now())
                    .status(ModelStatus.TRAINED)
                    .build();
            
            log.info("碳排放预测模型训练完成: {}, 准确率: {:.2f}%", 
                    modelName, validation.getAccuracy() * 100);
            
            return CompletableFuture.completedFuture(result);
            
        } catch (Exception e) {
            log.error("碳排放预测模型训练失败: {}", modelName, e);
            throw new BusinessException("模型训练失败: " + e.getMessage());
        }
    }
    
    /**
     * 训练异常检测模型
     */
    @Async
    @Transactional
    public CompletableFuture<ModelTrainingResult> trainAnomalyDetectionModel(
            String modelName, AnomalyDetectionTrainingConfig config) {
        try {
            log.info("开始训练异常检测模型: {}", modelName);
            
            // 1. 准备训练数据
            List<AnomalyTrainingData> trainingData = prepareAnomalyTrainingData(config);
            
            // 2. 数据预处理
            ProcessedAnomalyData processedData = preprocessAnomalyData(trainingData, config);
            
            // 3. 构建异常检测模型
            AnomalyDetectionModel model = buildAnomalyDetectionModel(config);
            
            // 4. 训练模型
            TrainingMetrics metrics = trainAnomalyModel(model, processedData, config);
            
            // 5. 模型验证
            AnomalyValidationResult validation = validateAnomalyModel(model, processedData.getTestSet());
            
            // 6. 保存模型
            String modelId = saveAnomalyModel(modelName, model, metrics, validation);
            
            // 7. 更新缓存
            anomalyModelCache.put(modelId, model);
            
            ModelTrainingResult result = ModelTrainingResult.builder()
                    .modelId(modelId)
                    .modelName(modelName)
                    .trainingMetrics(metrics)
                    .validationResult(validation)
                    .trainingTime(LocalDateTime.now())
                    .status(ModelStatus.TRAINED)
                    .build();
            
            log.info("异常检测模型训练完成: {}, F1分数: {:.2f}", 
                    modelName, validation.getF1Score());
            
            return CompletableFuture.completedFuture(result);
            
        } catch (Exception e) {
            log.error("异常检测模型训练失败: {}", modelName, e);
            throw new BusinessException("异常检测模型训练失败: " + e.getMessage());
        }
    }
    
    /**
     * 碳排放预测
     */
    public CarbonPredictionResult predictCarbonEmission(
            String modelId, CarbonPredictionInput input) {
        try {
            CarbonPredictionModel model = getModel(modelId);
            if (model == null) {
                throw new BusinessException("模型不存在: " + modelId);
            }
            
            // 数据预处理
            ProcessedPredictionInput processedInput = preprocessPredictionInput(input);
            
            // 执行预测
            PredictionOutput output = model.predict(processedInput);
            
            // 后处理
            CarbonPredictionResult result = postprocessPredictionOutput(output, input);
            
            // 记录预测日志
            logPrediction(modelId, input, result);
            
            return result;
            
        } catch (Exception e) {
            log.error("碳排放预测失败: modelId={}", modelId, e);
            throw new BusinessException("预测失败: " + e.getMessage());
        }
    }
    
    /**
     * 异常检测
     */
    public AnomalyDetectionResult detectAnomaly(
            String modelId, AnomalyDetectionInput input) {
        try {
            AnomalyDetectionModel model = getAnomalyModel(modelId);
            if (model == null) {
                throw new BusinessException("异常检测模型不存在: " + modelId);
            }
            
            // 数据预处理
            ProcessedAnomalyInput processedInput = preprocessAnomalyInput(input);
            
            // 执行异常检测
            AnomalyOutput output = model.detectAnomaly(processedInput);
            
            // 后处理
            AnomalyDetectionResult result = postprocessAnomalyOutput(output, input);
            
            // 如果检测到异常，记录告警
            if (result.isAnomaly() && result.getConfidence() > confidenceThreshold) {
                logAnomalyAlert(modelId, input, result);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("异常检测失败: modelId={}", modelId, e);
            throw new BusinessException("异常检测失败: " + e.getMessage());
        }
    }
    
    /**
     * 批量预测
     */
    public List<CarbonPredictionResult> batchPredict(
            String modelId, List<CarbonPredictionInput> inputs) {
        try {
            CarbonPredictionModel model = getModel(modelId);
            if (model == null) {
                throw new BusinessException("模型不存在: " + modelId);
            }
            
            return inputs.parallelStream()
                    .map(input -> {
                        try {
                            return predictCarbonEmission(modelId, input);
                        } catch (Exception e) {
                            log.warn("批量预测中单个预测失败: {}", e.getMessage());
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("批量预测失败: modelId={}", modelId, e);
            throw new BusinessException("批量预测失败: " + e.getMessage());
        }
    }
    
    /**
     * 模型自动更新
     */
    @Async
    public CompletableFuture<Void> autoUpdateModel(String modelId) {
        try {
            if (!autoRetrainEnabled) {
                return CompletableFuture.completedFuture(null);
            }
            
            ModelInfo modelInfo = modelRepository.findById(modelId)
                    .orElseThrow(() -> new BusinessException("模型不存在: " + modelId));
            
            // 检查是否需要更新
            if (shouldUpdateModel(modelInfo)) {
                log.info("开始自动更新模型: {}", modelId);
                
                // 获取新的训练数据
                List<CarbonTrainingData> newData = getNewTrainingData(
                        modelInfo.getLastTrainingTime());
                
                if (newData.size() >= batchSize) {
                    // 增量训练
                    incrementalTrain(modelId, newData);
                    log.info("模型自动更新完成: {}", modelId);
                } else {
                    log.info("新数据不足，跳过模型更新: {}", modelId);
                }
            }
            
            return CompletableFuture.completedFuture(null);
            
        } catch (Exception e) {
            log.error("模型自动更新失败: modelId={}", modelId, e);
            return CompletableFuture.failedFuture(e);
        }
    }
    
    /**
     * 获取模型性能指标
     */
    public ModelPerformanceMetrics getModelPerformance(String modelId) {
        try {
            ModelInfo modelInfo = modelRepository.findById(modelId)
                    .orElseThrow(() -> new BusinessException("模型不存在: " + modelId));
            
            // 计算实时性能指标
            List<PredictionRecord> recentPredictions = getRecentPredictions(modelId, 24); // 最近24小时
            
            return ModelPerformanceMetrics.builder()
                    .modelId(modelId)
                    .accuracy(calculateAccuracy(recentPredictions))
                    .precision(calculatePrecision(recentPredictions))
                    .recall(calculateRecall(recentPredictions))
                    .f1Score(calculateF1Score(recentPredictions))
                    .mse(calculateMSE(recentPredictions))
                    .mae(calculateMAE(recentPredictions))
                    .predictionCount(recentPredictions.size())
                    .avgResponseTime(calculateAvgResponseTime(recentPredictions))
                    .lastUpdated(LocalDateTime.now())
                    .build();
                    
        } catch (Exception e) {
            log.error("获取模型性能指标失败: modelId={}", modelId, e);
            throw new BusinessException("获取性能指标失败: " + e.getMessage());
        }
    }
    
    /**
     * 模型A/B测试
     */
    public ABTestResult performABTest(
            String modelAId, String modelBId, ABTestConfig config) {
        try {
            log.info("开始A/B测试: modelA={}, modelB={}", modelAId, modelBId);
            
            List<CarbonPredictionInput> testData = getTestData(config.getTestDataSize());
            
            // 模型A预测
            List<CarbonPredictionResult> resultsA = batchPredict(modelAId, testData);
            
            // 模型B预测
            List<CarbonPredictionResult> resultsB = batchPredict(modelBId, testData);
            
            // 计算性能对比
            ModelPerformanceComparison comparison = compareModelPerformance(
                    resultsA, resultsB, testData);
            
            ABTestResult result = ABTestResult.builder()
                    .modelAId(modelAId)
                    .modelBId(modelBId)
                    .testDataSize(testData.size())
                    .performanceComparison(comparison)
                    .winnerModelId(comparison.getBetterModelId())
                    .confidenceLevel(comparison.getConfidenceLevel())
                    .testTime(LocalDateTime.now())
                    .build();
            
            log.info("A/B测试完成，获胜模型: {}", result.getWinnerModelId());
            
            return result;
            
        } catch (Exception e) {
            log.error("A/B测试失败: modelA={}, modelB={}", modelAId, modelBId, e);
            throw new BusinessException("A/B测试失败: " + e.getMessage());
        }
    }
    
    // ==================== 私有辅助方法 ====================
    
    private List<CarbonTrainingData> prepareTrainingData(CarbonPredictionTrainingConfig config) {
        return trainingDataRepository.findCarbonTrainingData(
                config.getStartTime(),
                config.getEndTime(),
                config.getDataFilters()
        );
    }
    
    private ProcessedTrainingData preprocessTrainingData(
            List<CarbonTrainingData> data, CarbonPredictionTrainingConfig config) {
        // 数据清洗
        List<CarbonTrainingData> cleanedData = cleanTrainingData(data);
        
        // 特征工程
        List<FeatureVector> features = extractFeatures(cleanedData, config.getFeatureConfig());
        
        // 数据标准化
        List<FeatureVector> normalizedFeatures = normalizeFeatures(features);
        
        // 数据分割
        return splitTrainingData(normalizedFeatures, config.getTrainTestSplit());
    }
    
    private CarbonPredictionModel buildCarbonPredictionModel(CarbonPredictionTrainingConfig config) {
        return CarbonPredictionModel.builder()
                .architecture(config.getModelArchitecture())
                .inputDimension(config.getInputDimension())
                .hiddenLayers(config.getHiddenLayers())
                .outputDimension(config.getOutputDimension())
                .activationFunction(config.getActivationFunction())
                .optimizer(config.getOptimizer())
                .learningRate(learningRate)
                .build();
    }
    
    private TrainingMetrics trainModel(
            CarbonPredictionModel model, ProcessedTrainingData data, 
            CarbonPredictionTrainingConfig config) {
        
        TrainingMetrics metrics = new TrainingMetrics();
        
        for (int epoch = 0; epoch < epochs; epoch++) {
            // 前向传播
            List<PredictionOutput> outputs = model.forward(data.getTrainingSet());
            
            // 计算损失
            double loss = calculateLoss(outputs, data.getTrainingLabels());
            
            // 反向传播
            model.backward(loss);
            
            // 更新权重
            model.updateWeights();
            
            // 记录指标
            if (epoch % 10 == 0) {
                double accuracy = calculateTrainingAccuracy(outputs, data.getTrainingLabels());
                metrics.addEpochMetric(epoch, loss, accuracy);
                log.debug("Epoch {}: loss={:.4f}, accuracy={:.4f}", epoch, loss, accuracy);
            }
        }
        
        return metrics;
    }
    
    private ValidationResult validateModel(
            CarbonPredictionModel model, List<FeatureVector> validationSet) {
        
        List<PredictionOutput> predictions = model.predict(validationSet);
        
        return ValidationResult.builder()
                .accuracy(calculateValidationAccuracy(predictions, validationSet))
                .mse(calculateMSE(predictions, validationSet))
                .mae(calculateMAE(predictions, validationSet))
                .r2Score(calculateR2Score(predictions, validationSet))
                .build();
    }
    
    private String saveModel(
            String modelName, CarbonPredictionModel model, 
            TrainingMetrics metrics, ValidationResult validation) {
        
        ModelInfo modelInfo = ModelInfo.builder()
                .name(modelName)
                .type(ModelType.CARBON_PREDICTION)
                .version(generateModelVersion())
                .trainingMetrics(metrics)
                .validationResult(validation)
                .modelData(serializeModel(model))
                .status(ModelStatus.TRAINED)
                .createdTime(LocalDateTime.now())
                .lastTrainingTime(LocalDateTime.now())
                .build();
        
        return modelRepository.save(modelInfo).getId();
    }
    
    private CarbonPredictionModel getModel(String modelId) {
        if (modelCache.containsKey(modelId)) {
            return modelCache.get(modelId);
        }
        
        Optional<ModelInfo> modelInfo = modelRepository.findById(modelId);
        if (modelInfo.isPresent()) {
            CarbonPredictionModel model = deserializeModel(modelInfo.get().getModelData());
            modelCache.put(modelId, model);
            return model;
        }
        
        return null;
    }
    
    private boolean shouldUpdateModel(ModelInfo modelInfo) {
        LocalDateTime lastTraining = modelInfo.getLastTrainingTime();
        LocalDateTime threshold = LocalDateTime.now().minusHours(autoRetrainIntervalHours);
        return lastTraining.isBefore(threshold);
    }
    
    private void logPrediction(String modelId, CarbonPredictionInput input, CarbonPredictionResult result) {
        // 记录预测日志，用于模型性能监控
        log.debug("预测记录: modelId={}, input={}, result={}", modelId, input, result);
    }
    
    private void logAnomalyAlert(String modelId, AnomalyDetectionInput input, AnomalyDetectionResult result) {
        log.warn("检测到异常: modelId={}, confidence={:.2f}, input={}", 
                modelId, result.getConfidence(), input);
    }
    
    // 其他辅助方法...
    private List<CarbonTrainingData> cleanTrainingData(List<CarbonTrainingData> data) {
        return data.stream()
                .filter(d -> d.isValid())
                .filter(d -> !d.isOutlier())
                .collect(Collectors.toList());
    }
    
    private List<FeatureVector> extractFeatures(List<CarbonTrainingData> data, FeatureConfig config) {
        // 特征提取逻辑
        return data.stream()
                .map(d -> FeatureExtractor.extract(d, config))
                .collect(Collectors.toList());
    }
    
    private List<FeatureVector> normalizeFeatures(List<FeatureVector> features) {
        // 特征标准化
        return FeatureNormalizer.normalize(features);
    }
    
    private ProcessedTrainingData splitTrainingData(List<FeatureVector> features, double trainTestSplit) {
        int splitIndex = (int) (features.size() * trainTestSplit);
        
        return ProcessedTrainingData.builder()
                .trainingSet(features.subList(0, splitIndex))
                .validationSet(features.subList(splitIndex, features.size()))
                .build();
    }
    
    private double calculateLoss(List<PredictionOutput> outputs, List<Double> labels) {
        // 计算均方误差损失
        double sum = 0.0;
        for (int i = 0; i < outputs.size(); i++) {
            double diff = outputs.get(i).getValue() - labels.get(i);
            sum += diff * diff;
        }
        return sum / outputs.size();
    }
    
    private double calculateTrainingAccuracy(List<PredictionOutput> outputs, List<Double> labels) {
        // 计算训练准确率
        int correct = 0;
        for (int i = 0; i < outputs.size(); i++) {
            if (Math.abs(outputs.get(i).getValue() - labels.get(i)) < 0.1) {
                correct++;
            }
        }
        return (double) correct / outputs.size();
    }
    
    private String generateModelVersion() {
        return "v" + System.currentTimeMillis();
    }
    
    private byte[] serializeModel(CarbonPredictionModel model) {
        // 模型序列化逻辑
        return ModelSerializer.serialize(model);
    }
    
    private CarbonPredictionModel deserializeModel(byte[] modelData) {
        // 模型反序列化逻辑
        return ModelSerializer.deserialize(modelData);
    }
}