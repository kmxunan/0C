package com.zerocarbon.ai.controller;

import com.zerocarbon.ai.model.PredictionData.*;
import com.zerocarbon.ai.model.TrainingConfig.*;
import com.zerocarbon.ai.model.ValidationResult.*;
import com.zerocarbon.ai.service.DeepLearningModelService;
import com.zerocarbon.common.response.ApiResponse;
import com.zerocarbon.common.response.PageResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 深度学习模型控制器
 * 提供AI/ML模型训练、预测、验证等功能的REST API接口
 *
 * @author Zero Carbon Team
 * @version 1.0
 * @since 2025-06-10
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ai/deep-learning")
@RequiredArgsConstructor
@Validated
@Tag(name = "深度学习模型管理", description = "AI/ML模型训练、预测、验证等功能")
public class DeepLearningController {
    
    private final DeepLearningModelService deepLearningModelService;
    
    // ==================== 模型训练相关接口 ====================
    
    /**
     * 训练碳排放预测模型
     */
    @PostMapping("/models/carbon-prediction/train")
    @Operation(summary = "训练碳排放预测模型", description = "基于历史数据训练深度学习碳排放预测模型")
    public ResponseEntity<ApiResponse<String>> trainCarbonPredictionModel(
            @Valid @RequestBody CarbonPredictionTrainingConfig config) {
        
        log.info("开始训练碳排放预测模型: {}", config.getModelName());
        
        try {
            String modelId = deepLearningModelService.trainCarbonPredictionModel(config);
            
            log.info("碳排放预测模型训练启动成功，模型ID: {}", modelId);
            return ResponseEntity.ok(ApiResponse.success(modelId, "模型训练已启动"));
            
        } catch (Exception e) {
            log.error("训练碳排放预测模型失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("模型训练失败: " + e.getMessage()));
        }
    }
    
    /**
     * 训练异常检测模型
     */
    @PostMapping("/models/anomaly-detection/train")
    @Operation(summary = "训练异常检测模型", description = "基于历史数据训练异常检测模型")
    public ResponseEntity<ApiResponse<String>> trainAnomalyDetectionModel(
            @Valid @RequestBody AnomalyDetectionTrainingConfig config) {
        
        log.info("开始训练异常检测模型: {}", config.getModelName());
        
        try {
            String modelId = deepLearningModelService.trainAnomalyDetectionModel(config);
            
            log.info("异常检测模型训练启动成功，模型ID: {}", modelId);
            return ResponseEntity.ok(ApiResponse.success(modelId, "模型训练已启动"));
            
        } catch (Exception e) {
            log.error("训练异常检测模型失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("模型训练失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取模型训练状态
     */
    @GetMapping("/models/{modelId}/training-status")
    @Operation(summary = "获取模型训练状态", description = "查询指定模型的训练进度和状态")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTrainingStatus(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId) {
        
        try {
            Map<String, Object> status = deepLearningModelService.getTrainingStatus(modelId);
            return ResponseEntity.ok(ApiResponse.success(status));
            
        } catch (Exception e) {
            log.error("获取模型训练状态失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取训练状态失败: " + e.getMessage()));
        }
    }
    
    /**
     * 停止模型训练
     */
    @PostMapping("/models/{modelId}/stop-training")
    @Operation(summary = "停止模型训练", description = "停止指定模型的训练过程")
    public ResponseEntity<ApiResponse<String>> stopTraining(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId) {
        
        try {
            deepLearningModelService.stopTraining(modelId);
            
            log.info("模型训练已停止，模型ID: {}", modelId);
            return ResponseEntity.ok(ApiResponse.success("模型训练已停止"));
            
        } catch (Exception e) {
            log.error("停止模型训练失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("停止训练失败: " + e.getMessage()));
        }
    }
    
    // ==================== 模型预测相关接口 ====================
    
    /**
     * 碳排放预测
     */
    @PostMapping("/models/carbon-prediction/predict")
    @Operation(summary = "碳排放预测", description = "使用训练好的模型进行碳排放预测")
    public ResponseEntity<ApiResponse<CarbonPredictionOutput>> predictCarbonEmission(
            @Valid @RequestBody CarbonPredictionInput input) {
        
        log.info("开始碳排放预测，企业ID: {}, 预测时间范围: {} - {}", 
                input.getEnterpriseId(), input.getStartTime(), input.getEndTime());
        
        try {
            CarbonPredictionOutput output = deepLearningModelService.predictCarbonEmission(input);
            
            log.info("碳排放预测完成，预测结果数量: {}", output.getPredictions().size());
            return ResponseEntity.ok(ApiResponse.success(output));
            
        } catch (Exception e) {
            log.error("碳排放预测失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("预测失败: " + e.getMessage()));
        }
    }
    
    /**
     * 批量碳排放预测
     */
    @PostMapping("/models/carbon-prediction/batch-predict")
    @Operation(summary = "批量碳排放预测", description = "批量处理多个企业的碳排放预测")
    public ResponseEntity<ApiResponse<List<CarbonPredictionOutput>>> batchPredictCarbonEmission(
            @Valid @RequestBody List<CarbonPredictionInput> inputs) {
        
        log.info("开始批量碳排放预测，批次大小: {}", inputs.size());
        
        try {
            List<CarbonPredictionOutput> outputs = deepLearningModelService.batchPredictCarbonEmission(inputs);
            
            log.info("批量碳排放预测完成，处理数量: {}", outputs.size());
            return ResponseEntity.ok(ApiResponse.success(outputs));
            
        } catch (Exception e) {
            log.error("批量碳排放预测失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("批量预测失败: " + e.getMessage()));
        }
    }
    
    /**
     * 异常检测
     */
    @PostMapping("/models/anomaly-detection/detect")
    @Operation(summary = "异常检测", description = "使用训练好的模型进行异常检测")
    public ResponseEntity<ApiResponse<AnomalyDetectionOutput>> detectAnomalies(
            @Valid @RequestBody AnomalyDetectionInput input) {
        
        log.info("开始异常检测，数据源ID: {}, 检测时间范围: {} - {}", 
                input.getDataSourceId(), input.getStartTime(), input.getEndTime());
        
        try {
            AnomalyDetectionOutput output = deepLearningModelService.detectAnomalies(input);
            
            log.info("异常检测完成，检测到异常数量: {}", output.getAnomalies().size());
            return ResponseEntity.ok(ApiResponse.success(output));
            
        } catch (Exception e) {
            log.error("异常检测失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("异常检测失败: " + e.getMessage()));
        }
    }
    
    /**
     * 实时异常检测
     */
    @PostMapping("/models/anomaly-detection/real-time")
    @Operation(summary = "实时异常检测", description = "对实时数据流进行异常检测")
    public ResponseEntity<ApiResponse<AnomalyDetectionOutput>> realTimeAnomalyDetection(
            @Valid @RequestBody AnomalyDetectionInput input) {
        
        log.info("开始实时异常检测，数据源ID: {}", input.getDataSourceId());
        
        try {
            // 设置实时模式
            input.setRealTimeMode(true);
            AnomalyDetectionOutput output = deepLearningModelService.detectAnomalies(input);
            
            return ResponseEntity.ok(ApiResponse.success(output));
            
        } catch (Exception e) {
            log.error("实时异常检测失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("实时异常检测失败: " + e.getMessage()));
        }
    }
    
    // ==================== 模型验证相关接口 ====================
    
    /**
     * 模型验证
     */
    @PostMapping("/models/{modelId}/validate")
    @Operation(summary = "模型验证", description = "对指定模型进行验证评估")
    public ResponseEntity<ApiResponse<ModelValidationResult>> validateModel(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId,
            @RequestParam(required = false) String validationDatasetId,
            @RequestParam(required = false, defaultValue = "CROSS_VALIDATION") String validationType) {
        
        log.info("开始模型验证，模型ID: {}, 验证类型: {}", modelId, validationType);
        
        try {
            ModelValidationResult result = deepLearningModelService.validateModel(
                    modelId, validationDatasetId, validationType);
            
            log.info("模型验证完成，验证结果: {}", result.isPassed() ? "通过" : "未通过");
            return ResponseEntity.ok(ApiResponse.success(result));
            
        } catch (Exception e) {
            log.error("模型验证失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("模型验证失败: " + e.getMessage()));
        }
    }
    
    /**
     * 模型比较
     */
    @PostMapping("/models/compare")
    @Operation(summary = "模型比较", description = "比较多个模型的性能")
    public ResponseEntity<ApiResponse<ModelComparisonResult>> compareModels(
            @RequestParam @NotNull List<String> modelIds,
            @RequestParam(required = false) String comparisonDatasetId) {
        
        log.info("开始模型比较，模型数量: {}", modelIds.size());
        
        try {
            ModelComparisonResult result = deepLearningModelService.compareModels(
                    modelIds, comparisonDatasetId);
            
            log.info("模型比较完成，最佳模型: {}", result.getBestModel());
            return ResponseEntity.ok(ApiResponse.success(result));
            
        } catch (Exception e) {
            log.error("模型比较失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("模型比较失败: " + e.getMessage()));
        }
    }
    
    /**
     * A/B测试
     */
    @PostMapping("/models/ab-test")
    @Operation(summary = "A/B测试", description = "对两个模型进行A/B测试")
    public ResponseEntity<ApiResponse<ABTestResult>> performABTest(
            @RequestParam @NotBlank String controlModelId,
            @RequestParam @NotBlank String treatmentModelId,
            @RequestParam(required = false, defaultValue = "30") int testDurationDays,
            @RequestParam(required = false, defaultValue = "0.5") double trafficSplit) {
        
        log.info("开始A/B测试，控制组模型: {}, 实验组模型: {}", controlModelId, treatmentModelId);
        
        try {
            ABTestResult result = deepLearningModelService.performABTest(
                    controlModelId, treatmentModelId, testDurationDays, trafficSplit);
            
            return ResponseEntity.ok(ApiResponse.success(result));
            
        } catch (Exception e) {
            log.error("A/B测试失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("A/B测试失败: " + e.getMessage()));
        }
    }
    
    // ==================== 模型管理相关接口 ====================
    
    /**
     * 获取模型列表
     */
    @GetMapping("/models")
    @Operation(summary = "获取模型列表", description = "分页查询模型列表")
    public ResponseEntity<ApiResponse<PageResult<ModelInfo>>> getModels(
            @RequestParam(required = false) String modelType,
            @RequestParam(required = false) String modelStatus,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        try {
            PageResult<ModelInfo> result = deepLearningModelService.getModels(
                    modelType, modelStatus, page, size);
            
            return ResponseEntity.ok(ApiResponse.success(result));
            
        } catch (Exception e) {
            log.error("获取模型列表失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取模型列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取模型详情
     */
    @GetMapping("/models/{modelId}")
    @Operation(summary = "获取模型详情", description = "查询指定模型的详细信息")
    public ResponseEntity<ApiResponse<ModelInfo>> getModelInfo(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId) {
        
        try {
            ModelInfo modelInfo = deepLearningModelService.getModelInfo(modelId);
            return ResponseEntity.ok(ApiResponse.success(modelInfo));
            
        } catch (Exception e) {
            log.error("获取模型详情失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取模型详情失败: " + e.getMessage()));
        }
    }
    
    /**
     * 部署模型
     */
    @PostMapping("/models/{modelId}/deploy")
    @Operation(summary = "部署模型", description = "将训练好的模型部署到生产环境")
    public ResponseEntity<ApiResponse<String>> deployModel(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId,
            @RequestParam(required = false, defaultValue = "PRODUCTION") String environment) {
        
        log.info("开始部署模型，模型ID: {}, 环境: {}", modelId, environment);
        
        try {
            String deploymentId = deepLearningModelService.deployModel(modelId, environment);
            
            log.info("模型部署成功，部署ID: {}", deploymentId);
            return ResponseEntity.ok(ApiResponse.success(deploymentId, "模型部署成功"));
            
        } catch (Exception e) {
            log.error("模型部署失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("模型部署失败: " + e.getMessage()));
        }
    }
    
    /**
     * 下线模型
     */
    @PostMapping("/models/{modelId}/undeploy")
    @Operation(summary = "下线模型", description = "从生产环境下线指定模型")
    public ResponseEntity<ApiResponse<String>> undeployModel(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId) {
        
        log.info("开始下线模型，模型ID: {}", modelId);
        
        try {
            deepLearningModelService.undeployModel(modelId);
            
            log.info("模型下线成功，模型ID: {}", modelId);
            return ResponseEntity.ok(ApiResponse.success("模型下线成功"));
            
        } catch (Exception e) {
            log.error("模型下线失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("模型下线失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除模型
     */
    @DeleteMapping("/models/{modelId}")
    @Operation(summary = "删除模型", description = "删除指定的模型及其相关数据")
    public ResponseEntity<ApiResponse<String>> deleteModel(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId) {
        
        log.info("开始删除模型，模型ID: {}", modelId);
        
        try {
            deepLearningModelService.deleteModel(modelId);
            
            log.info("模型删除成功，模型ID: {}", modelId);
            return ResponseEntity.ok(ApiResponse.success("模型删除成功"));
            
        } catch (Exception e) {
            log.error("模型删除失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("模型删除失败: " + e.getMessage()));
        }
    }
    
    // ==================== 模型监控相关接口 ====================
    
    /**
     * 获取模型性能指标
     */
    @GetMapping("/models/{modelId}/metrics")
    @Operation(summary = "获取模型性能指标", description = "查询指定模型的性能指标")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getModelMetrics(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId,
            @RequestParam(required = false) LocalDateTime startTime,
            @RequestParam(required = false) LocalDateTime endTime) {
        
        try {
            Map<String, Object> metrics = deepLearningModelService.getModelMetrics(
                    modelId, startTime, endTime);
            
            return ResponseEntity.ok(ApiResponse.success(metrics));
            
        } catch (Exception e) {
            log.error("获取模型性能指标失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取性能指标失败: " + e.getMessage()));
        }
    }
    
    /**
     * 模型监控
     */
    @GetMapping("/models/{modelId}/monitoring")
    @Operation(summary = "模型监控", description = "获取模型监控结果")
    public ResponseEntity<ApiResponse<ModelMonitoringResult>> getModelMonitoring(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId,
            @RequestParam(required = false) LocalDateTime startTime,
            @RequestParam(required = false) LocalDateTime endTime) {
        
        try {
            ModelMonitoringResult result = deepLearningModelService.getModelMonitoring(
                    modelId, startTime, endTime);
            
            return ResponseEntity.ok(ApiResponse.success(result));
            
        } catch (Exception e) {
            log.error("获取模型监控结果失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取监控结果失败: " + e.getMessage()));
        }
    }
    
    /**
     * 模型自动更新
     */
    @PostMapping("/models/{modelId}/auto-update")
    @Operation(summary = "模型自动更新", description = "启动模型自动更新流程")
    public ResponseEntity<ApiResponse<String>> enableAutoUpdate(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId,
            @RequestParam(required = false, defaultValue = "WEEKLY") String updateFrequency) {
        
        log.info("启动模型自动更新，模型ID: {}, 更新频率: {}", modelId, updateFrequency);
        
        try {
            String updateJobId = deepLearningModelService.enableAutoUpdate(modelId, updateFrequency);
            
            log.info("模型自动更新已启动，任务ID: {}", updateJobId);
            return ResponseEntity.ok(ApiResponse.success(updateJobId, "自动更新已启动"));
            
        } catch (Exception e) {
            log.error("启动模型自动更新失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("启动自动更新失败: " + e.getMessage()));
        }
    }
    
    // ==================== 模型解释性相关接口 ====================
    
    /**
     * 模型解释性分析
     */
    @PostMapping("/models/{modelId}/explainability")
    @Operation(summary = "模型解释性分析", description = "对模型进行可解释性分析")
    public ResponseEntity<ApiResponse<ModelExplainabilityResult>> analyzeModelExplainability(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId,
            @RequestParam(required = false) String analysisType,
            @RequestBody(required = false) Map<String, Object> analysisConfig) {
        
        log.info("开始模型解释性分析，模型ID: {}, 分析类型: {}", modelId, analysisType);
        
        try {
            ModelExplainabilityResult result = deepLearningModelService.analyzeModelExplainability(
                    modelId, analysisType, analysisConfig);
            
            return ResponseEntity.ok(ApiResponse.success(result));
            
        } catch (Exception e) {
            log.error("模型解释性分析失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("解释性分析失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取特征重要性
     */
    @GetMapping("/models/{modelId}/feature-importance")
    @Operation(summary = "获取特征重要性", description = "查询模型的特征重要性排序")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getFeatureImportance(
            @Parameter(description = "模型ID") @PathVariable @NotBlank String modelId,
            @RequestParam(required = false, defaultValue = "10") int topN) {
        
        try {
            Map<String, Double> featureImportance = deepLearningModelService.getFeatureImportance(
                    modelId, topN);
            
            return ResponseEntity.ok(ApiResponse.success(featureImportance));
            
        } catch (Exception e) {
            log.error("获取特征重要性失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取特征重要性失败: " + e.getMessage()));
        }
    }
    
    // ==================== 系统管理相关接口 ====================
    
    /**
     * 获取系统状态
     */
    @GetMapping("/system/status")
    @Operation(summary = "获取系统状态", description = "查询AI系统的运行状态")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStatus() {
        
        try {
            Map<String, Object> status = deepLearningModelService.getSystemStatus();
            return ResponseEntity.ok(ApiResponse.success(status));
            
        } catch (Exception e) {
            log.error("获取系统状态失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取系统状态失败: " + e.getMessage()));
        }
    }
    
    /**
     * 清理系统缓存
     */
    @PostMapping("/system/clear-cache")
    @Operation(summary = "清理系统缓存", description = "清理AI系统的缓存数据")
    public ResponseEntity<ApiResponse<String>> clearSystemCache(
            @RequestParam(required = false, defaultValue = "ALL") String cacheType) {
        
        log.info("开始清理系统缓存，缓存类型: {}", cacheType);
        
        try {
            deepLearningModelService.clearSystemCache(cacheType);
            
            log.info("系统缓存清理完成");
            return ResponseEntity.ok(ApiResponse.success("缓存清理完成"));
            
        } catch (Exception e) {
            log.error("清理系统缓存失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("缓存清理失败: " + e.getMessage()));
        }
    }
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    @Operation(summary = "健康检查", description = "检查AI系统的健康状态")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        
        try {
            Map<String, Object> health = deepLearningModelService.healthCheck();
            return ResponseEntity.ok(ApiResponse.success(health));
            
        } catch (Exception e) {
            log.error("健康检查失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("健康检查失败: " + e.getMessage()));
        }
    }
}