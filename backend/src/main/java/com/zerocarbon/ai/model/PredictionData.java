package com.zerocarbon.ai.model;

import com.zerocarbon.ai.model.ModelEnums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * AI模型预测相关数据结构
 *
 * @author Zero Carbon Team
 * @version 1.0
 * @since 2025-06-10
 */
public class PredictionData {
    
    /**
     * 碳排放预测输入数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarbonPredictionInput {
        
        /**
         * 预测请求ID
         */
        private String requestId;
        
        /**
         * 企业ID
         */
        private String enterpriseId;
        
        /**
         * 预测时间范围
         */
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        
        /**
         * 预测粒度（小时、天、月等）
         */
        private TimeGranularity granularity;
        
        /**
         * 能耗数据
         */
        private EnergyConsumptionData energyData;
        
        /**
         * 生产数据
         */
        private ProductionData productionData;
        
        /**
         * 环境数据
         */
        private EnvironmentalData environmentalData;
        
        /**
         * 设备运行数据
         */
        private EquipmentOperationData equipmentData;
        
        /**
         * 历史碳排放数据
         */
        private List<HistoricalCarbonData> historicalData;
        
        /**
         * 外部因子数据
         */
        private ExternalFactorData externalFactors;
        
        /**
         * 预测配置
         */
        private PredictionConfig predictionConfig;
        
        /**
         * 模型版本
         */
        private String modelVersion;
        
        /**
         * 是否包含不确定性分析
         */
        private boolean includeUncertainty;
        
        /**
         * 置信区间
         */
        private double confidenceInterval;
        
        /**
         * 自定义特征
         */
        private Map<String, Object> customFeatures;
    }
    
    /**
     * 碳排放预测输出数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarbonPredictionOutput {
        
        /**
         * 预测请求ID
         */
        private String requestId;
        
        /**
         * 预测结果
         */
        private List<CarbonPredictionResult> predictions;
        
        /**
         * 模型信息
         */
        private ModelInfo modelInfo;
        
        /**
         * 预测置信度
         */
        private double confidence;
        
        /**
         * 不确定性分析结果
         */
        private UncertaintyAnalysis uncertaintyAnalysis;
        
        /**
         * 特征重要性
         */
        private Map<String, Double> featureImportance;
        
        /**
         * 预测时间
         */
        private LocalDateTime predictionTime;
        
        /**
         * 处理耗时（毫秒）
         */
        private long processingTimeMs;
        
        /**
         * 预测状态
         */
        private PredictionStatus status;
        
        /**
         * 错误信息（如果有）
         */
        private String errorMessage;
        
        /**
         * 数据质量评估
         */
        private DataQualityAssessment dataQuality;
        
        /**
         * 模型性能指标
         */
        private ModelPerformanceMetrics performanceMetrics;
    }
    
    /**
     * 异常检测输入数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyDetectionInput {
        
        /**
         * 检测请求ID
         */
        private String requestId;
        
        /**
         * 数据源ID
         */
        private String dataSourceId;
        
        /**
         * 检测时间范围
         */
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        
        /**
         * 检测数据
         */
        private List<TimeSeriesDataPoint> dataPoints;
        
        /**
         * 检测类型
         */
        private AnomalyDetectionType detectionType;
        
        /**
         * 异常阈值
         */
        private double threshold;
        
        /**
         * 检测窗口大小
         */
        private int windowSize;
        
        /**
         * 历史基线数据
         */
        private List<TimeSeriesDataPoint> baselineData;
        
        /**
         * 检测配置
         */
        private AnomalyDetectionConfig detectionConfig;
        
        /**
         * 模型版本
         */
        private String modelVersion;
        
        /**
         * 实时检测模式
         */
        private boolean realTimeMode;
        
        /**
         * 自定义参数
         */
        private Map<String, Object> customParameters;
    }
    
    /**
     * 异常检测输出数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyDetectionOutput {
        
        /**
         * 检测请求ID
         */
        private String requestId;
        
        /**
         * 异常检测结果
         */
        private List<AnomalyDetectionResult> anomalies;
        
        /**
         * 整体异常评分
         */
        private double overallAnomalyScore;
        
        /**
         * 检测统计信息
         */
        private AnomalyDetectionStatistics statistics;
        
        /**
         * 模型信息
         */
        private ModelInfo modelInfo;
        
        /**
         * 检测时间
         */
        private LocalDateTime detectionTime;
        
        /**
         * 处理耗时（毫秒）
         */
        private long processingTimeMs;
        
        /**
         * 检测状态
         */
        private DetectionStatus status;
        
        /**
         * 错误信息（如果有）
         */
        private String errorMessage;
        
        /**
         * 建议操作
         */
        private List<RecommendedAction> recommendedActions;
    }
    
    /**
     * 能耗数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnergyConsumptionData {
        
        /**
         * 电力消耗（kWh）
         */
        private double electricityConsumption;
        
        /**
         * 天然气消耗（m³）
         */
        private double naturalGasConsumption;
        
        /**
         * 煤炭消耗（吨）
         */
        private double coalConsumption;
        
        /**
         * 石油消耗（升）
         */
        private double oilConsumption;
        
        /**
         * 蒸汽消耗（吨）
         */
        private double steamConsumption;
        
        /**
         * 可再生能源消耗（kWh）
         */
        private double renewableEnergyConsumption;
        
        /**
         * 总能耗（标准煤吨）
         */
        private double totalEnergyConsumption;
        
        /**
         * 能耗强度
         */
        private double energyIntensity;
        
        /**
         * 峰谷用电比例
         */
        private PeakValleyRatio peakValleyRatio;
        
        /**
         * 能源结构
         */
        private EnergyStructure energyStructure;
    }
    
    /**
     * 生产数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductionData {
        
        /**
         * 产品产量
         */
        private double productionVolume;
        
        /**
         * 产品类型
         */
        private String productType;
        
        /**
         * 生产线数量
         */
        private int productionLineCount;
        
        /**
         * 设备利用率
         */
        private double equipmentUtilization;
        
        /**
         * 生产效率
         */
        private double productionEfficiency;
        
        /**
         * 废品率
         */
        private double defectRate;
        
        /**
         * 原材料消耗
         */
        private Map<String, Double> rawMaterialConsumption;
        
        /**
         * 工艺参数
         */
        private Map<String, Double> processParameters;
        
        /**
         * 生产班次
         */
        private ProductionShift productionShift;
    }
    
    /**
     * 环境数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnvironmentalData {
        
        /**
         * 温度（℃）
         */
        private double temperature;
        
        /**
         * 湿度（%）
         */
        private double humidity;
        
        /**
         * 大气压力（hPa）
         */
        private double pressure;
        
        /**
         * 风速（m/s）
         */
        private double windSpeed;
        
        /**
         * 风向（度）
         */
        private double windDirection;
        
        /**
         * 降雨量（mm）
         */
        private double rainfall;
        
        /**
         * 太阳辐射（W/m²）
         */
        private double solarRadiation;
        
        /**
         * 空气质量指数
         */
        private double airQualityIndex;
        
        /**
         * 季节因子
         */
        private SeasonalFactor seasonalFactor;
    }
    
    /**
     * 设备运行数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentOperationData {
        
        /**
         * 设备运行状态
         */
        private Map<String, EquipmentStatus> equipmentStatus;
        
        /**
         * 设备负载率
         */
        private Map<String, Double> equipmentLoad;
        
        /**
         * 设备效率
         */
        private Map<String, Double> equipmentEfficiency;
        
        /**
         * 设备温度
         */
        private Map<String, Double> equipmentTemperature;
        
        /**
         * 设备振动
         */
        private Map<String, Double> equipmentVibration;
        
        /**
         * 设备运行时间
         */
        private Map<String, Double> operatingHours;
        
        /**
         * 维护状态
         */
        private Map<String, MaintenanceStatus> maintenanceStatus;
        
        /**
         * 故障记录
         */
        private List<EquipmentFault> faultRecords;
    }
    
    /**
     * 历史碳排放数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoricalCarbonData {
        
        /**
         * 时间戳
         */
        private LocalDateTime timestamp;
        
        /**
         * 碳排放量（tCO2e）
         */
        private double carbonEmission;
        
        /**
         * 排放源类型
         */
        private EmissionSourceType sourceType;
        
        /**
         * 排放范围（Scope 1/2/3）
         */
        private EmissionScope emissionScope;
        
        /**
         * 数据质量等级
         */
        private DataQualityLevel qualityLevel;
        
        /**
         * 数据来源
         */
        private String dataSource;
        
        /**
         * 计算方法
         */
        private String calculationMethod;
        
        /**
         * 不确定性
         */
        private double uncertainty;
    }
    
    /**
     * 外部因子数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExternalFactorData {
        
        /**
         * 电网排放因子（tCO2/MWh）
         */
        private double gridEmissionFactor;
        
        /**
         * 燃料排放因子
         */
        private Map<String, Double> fuelEmissionFactors;
        
        /**
         * 区域排放因子
         */
        private double regionalEmissionFactor;
        
        /**
         * 行业基准值
         */
        private double industryBenchmark;
        
        /**
         * 政策因子
         */
        private PolicyFactor policyFactor;
        
        /**
         * 经济因子
         */
        private EconomicFactor economicFactor;
        
        /**
         * 技术因子
         */
        private TechnologyFactor technologyFactor;
    }
    
    /**
     * 预测配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PredictionConfig {
        
        /**
         * 预测步长
         */
        private int predictionSteps;
        
        /**
         * 预测方法
         */
        private PredictionMethod predictionMethod;
        
        /**
         * 集成方法
         */
        private EnsembleMethod ensembleMethod;
        
        /**
         * 后处理方法
         */
        private List<PostProcessingMethod> postProcessingMethods;
        
        /**
         * 异常值处理
         */
        private OutlierHandlingMethod outlierHandling;
        
        /**
         * 平滑参数
         */
        private double smoothingParameter;
        
        /**
         * 趋势调整
         */
        private boolean trendAdjustment;
        
        /**
         * 季节性调整
         */
        private boolean seasonalAdjustment;
    }
    
    /**
     * 碳排放预测结果
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarbonPredictionResult {
        
        /**
         * 预测时间
         */
        private LocalDateTime timestamp;
        
        /**
         * 预测碳排放量（tCO2e）
         */
        private double predictedEmission;
        
        /**
         * 置信区间下限
         */
        private double lowerBound;
        
        /**
         * 置信区间上限
         */
        private double upperBound;
        
        /**
         * 预测置信度
         */
        private double confidence;
        
        /**
         * 分类预测（按排放源）
         */
        private Map<EmissionSourceType, Double> emissionBySource;
        
        /**
         * 分类预测（按范围）
         */
        private Map<EmissionScope, Double> emissionByScope;
        
        /**
         * 贡献因子分析
         */
        private Map<String, Double> contributionFactors;
        
        /**
         * 预测质量评估
         */
        private PredictionQuality predictionQuality;
    }
    
    /**
     * 模型信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelInfo {
        
        /**
         * 模型名称
         */
        private String modelName;
        
        /**
         * 模型版本
         */
        private String modelVersion;
        
        /**
         * 模型类型
         */
        private ModelType modelType;
        
        /**
         * 模型架构
         */
        private ModelArchitecture architecture;
        
        /**
         * 训练时间
         */
        private LocalDateTime trainedAt;
        
        /**
         * 训练数据大小
         */
        private int trainingDataSize;
        
        /**
         * 模型参数数量
         */
        private long parameterCount;
        
        /**
         * 模型大小（MB）
         */
        private double modelSizeMB;
        
        /**
         * 模型状态
         */
        private ModelStatus modelStatus;
    }
    
    /**
     * 不确定性分析
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UncertaintyAnalysis {
        
        /**
         * 模型不确定性
         */
        private double modelUncertainty;
        
        /**
         * 数据不确定性
         */
        private double dataUncertainty;
        
        /**
         * 参数不确定性
         */
        private double parameterUncertainty;
        
        /**
         * 总体不确定性
         */
        private double totalUncertainty;
        
        /**
         * 不确定性来源分析
         */
        private Map<String, Double> uncertaintySources;
        
        /**
         * 敏感性分析
         */
        private Map<String, Double> sensitivityAnalysis;
    }
    
    /**
     * 数据质量评估
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataQualityAssessment {
        
        /**
         * 数据完整性评分
         */
        private double completenessScore;
        
        /**
         * 数据准确性评分
         */
        private double accuracyScore;
        
        /**
         * 数据一致性评分
         */
        private double consistencyScore;
        
        /**
         * 数据及时性评分
         */
        private double timelinessScore;
        
        /**
         * 总体质量评分
         */
        private double overallQualityScore;
        
        /**
         * 质量问题列表
         */
        private List<DataQualityIssue> qualityIssues;
        
        /**
         * 改进建议
         */
        private List<String> improvementSuggestions;
    }
    
    /**
     * 模型性能指标
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelPerformanceMetrics {
        
        /**
         * 均方误差（MSE）
         */
        private double mse;
        
        /**
         * 均方根误差（RMSE）
         */
        private double rmse;
        
        /**
         * 平均绝对误差（MAE）
         */
        private double mae;
        
        /**
         * 平均绝对百分比误差（MAPE）
         */
        private double mape;
        
        /**
         * R²决定系数
         */
        private double r2Score;
        
        /**
         * 调整R²
         */
        private double adjustedR2;
        
        /**
         * 预测准确率
         */
        private double accuracy;
        
        /**
         * 模型稳定性
         */
        private double stability;
    }
    
    /**
     * 时间序列数据点
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesDataPoint {
        
        /**
         * 时间戳
         */
        private LocalDateTime timestamp;
        
        /**
         * 数值
         */
        private double value;
        
        /**
         * 特征向量
         */
        private Map<String, Double> features;
        
        /**
         * 数据标签
         */
        private String label;
        
        /**
         * 数据质量
         */
        private DataQualityLevel quality;
    }
    
    /**
     * 异常检测配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyDetectionConfig {
        
        /**
         * 检测算法
         */
        private AnomalyDetectionAlgorithm algorithm;
        
        /**
         * 敏感度
         */
        private double sensitivity;
        
        /**
         * 最小异常持续时间
         */
        private int minAnomalyDuration;
        
        /**
         * 异常严重程度阈值
         */
        private Map<AnomalySeverity, Double> severityThresholds;
        
        /**
         * 是否启用自适应阈值
         */
        private boolean adaptiveThreshold;
        
        /**
         * 历史数据窗口大小
         */
        private int historicalWindowSize;
        
        /**
         * 异常类型过滤
         */
        private List<AnomalyType> enabledAnomalyTypes;
    }
    
    /**
     * 异常检测结果
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyDetectionResult {
        
        /**
         * 异常时间
         */
        private LocalDateTime timestamp;
        
        /**
         * 异常值
         */
        private double anomalyValue;
        
        /**
         * 异常评分
         */
        private double anomalyScore;
        
        /**
         * 异常类型
         */
        private AnomalyType anomalyType;
        
        /**
         * 异常严重程度
         */
        private AnomalySeverity severity;
        
        /**
         * 异常描述
         */
        private String description;
        
        /**
         * 可能原因
         */
        private List<String> possibleCauses;
        
        /**
         * 影响评估
         */
        private ImpactAssessment impactAssessment;
        
        /**
         * 置信度
         */
        private double confidence;
    }
    
    /**
     * 异常检测统计信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyDetectionStatistics {
        
        /**
         * 总数据点数
         */
        private int totalDataPoints;
        
        /**
         * 异常数据点数
         */
        private int anomalyDataPoints;
        
        /**
         * 异常率
         */
        private double anomalyRate;
        
        /**
         * 平均异常评分
         */
        private double averageAnomalyScore;
        
        /**
         * 最高异常评分
         */
        private double maxAnomalyScore;
        
        /**
         * 异常类型分布
         */
        private Map<AnomalyType, Integer> anomalyTypeDistribution;
        
        /**
         * 严重程度分布
         */
        private Map<AnomalySeverity, Integer> severityDistribution;
    }
    
    /**
     * 建议操作
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedAction {
        
        /**
         * 操作类型
         */
        private ActionType actionType;
        
        /**
         * 操作描述
         */
        private String description;
        
        /**
         * 优先级
         */
        private ActionPriority priority;
        
        /**
         * 预期效果
         */
        private String expectedOutcome;
        
        /**
         * 执行时间估计（分钟）
         */
        private int estimatedTimeMinutes;
        
        /**
         * 相关资源
         */
        private List<String> relatedResources;
    }
    
    // ==================== 枚举定义 ====================
    
    /**
     * 预测状态
     */
    public enum PredictionStatus {
        SUCCESS, PARTIAL_SUCCESS, FAILED, IN_PROGRESS, CANCELLED
    }
    
    /**
     * 检测状态
     */
    public enum DetectionStatus {
        COMPLETED, FAILED, IN_PROGRESS, CANCELLED, TIMEOUT
    }
    
    /**
     * 异常检测类型
     */
    public enum AnomalyDetectionType {
        POINT_ANOMALY, CONTEXTUAL_ANOMALY, COLLECTIVE_ANOMALY,
        TREND_ANOMALY, SEASONAL_ANOMALY, PATTERN_ANOMALY
    }
    
    /**
     * 峰谷用电比例
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeakValleyRatio {
        private double peakRatio;
        private double valleyRatio;
        private double flatRatio;
    }
    
    /**
     * 能源结构
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnergyStructure {
        private double fossilFuelRatio;
        private double renewableRatio;
        private double nuclearRatio;
        private double otherRatio;
    }
    
    /**
     * 生产班次
     */
    public enum ProductionShift {
        DAY_SHIFT, NIGHT_SHIFT, CONTINUOUS, FLEXIBLE
    }
    
    /**
     * 季节因子
     */
    public enum SeasonalFactor {
        SPRING, SUMMER, AUTUMN, WINTER
    }
    
    /**
     * 设备状态
     */
    public enum EquipmentStatus {
        RUNNING, IDLE, MAINTENANCE, FAULT, SHUTDOWN
    }
    
    /**
     * 维护状态
     */
    public enum MaintenanceStatus {
        NORMAL, SCHEDULED, OVERDUE, IN_PROGRESS, COMPLETED
    }
    
    /**
     * 设备故障
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentFault {
        private String equipmentId;
        private LocalDateTime faultTime;
        private String faultType;
        private String faultDescription;
        private FaultSeverity severity;
        private boolean resolved;
    }
    
    /**
     * 故障严重程度
     */
    public enum FaultSeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
    
    /**
     * 排放源类型
     */
    public enum EmissionSourceType {
        ELECTRICITY, NATURAL_GAS, COAL, OIL, STEAM,
        PROCESS, TRANSPORTATION, WASTE, FUGITIVE
    }
    
    /**
     * 排放范围
     */
    public enum EmissionScope {
        SCOPE_1, SCOPE_2, SCOPE_3
    }
    
    /**
     * 数据质量等级
     */
    public enum DataQualityLevel {
        HIGH, MEDIUM, LOW, UNKNOWN
    }
    
    /**
     * 政策因子
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PolicyFactor {
        private double carbonTaxRate;
        private double emissionTradingPrice;
        private double subsidyRate;
        private double penaltyRate;
    }
    
    /**
     * 经济因子
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EconomicFactor {
        private double energyPrice;
        private double rawMaterialPrice;
        private double laborCost;
        private double inflationRate;
    }
    
    /**
     * 技术因子
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TechnologyFactor {
        private double efficiencyImprovement;
        private double technologyAdoptionRate;
        private double innovationIndex;
        private double automationLevel;
    }
    
    /**
     * 预测方法
     */
    public enum PredictionMethod {
        SINGLE_MODEL, ENSEMBLE, HYBRID, ADAPTIVE
    }
    
    /**
     * 集成方法
     */
    public enum EnsembleMethod {
        VOTING, AVERAGING, WEIGHTED_AVERAGING, STACKING, BLENDING
    }
    
    /**
     * 后处理方法
     */
    public enum PostProcessingMethod {
        SMOOTHING, TREND_ADJUSTMENT, SEASONAL_ADJUSTMENT,
        OUTLIER_REMOVAL, BIAS_CORRECTION
    }
    
    /**
     * 异常值处理方法
     */
    public enum OutlierHandlingMethod {
        REMOVE, CAP, INTERPOLATE, KEEP, TRANSFORM
    }
    
    /**
     * 预测质量
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PredictionQuality {
        private double reliability;
        private double stability;
        private double robustness;
        private QualityLevel qualityLevel;
    }
    
    /**
     * 质量等级
     */
    public enum QualityLevel {
        EXCELLENT, GOOD, FAIR, POOR
    }
    
    /**
     * 异常严重程度
     */
    public enum AnomalySeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
    
    /**
     * 异常类型
     */
    public enum AnomalyType {
        SPIKE, DIP, TREND_CHANGE, PATTERN_BREAK,
        MISSING_DATA, OUTLIER, DRIFT, OSCILLATION
    }
    
    /**
     * 影响评估
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactAssessment {
        private ImpactLevel environmentalImpact;
        private ImpactLevel economicImpact;
        private ImpactLevel operationalImpact;
        private ImpactLevel complianceImpact;
    }
    
    /**
     * 影响等级
     */
    public enum ImpactLevel {
        NEGLIGIBLE, LOW, MEDIUM, HIGH, SEVERE
    }
    
    /**
     * 操作类型
     */
    public enum ActionType {
        INVESTIGATE, ADJUST_PARAMETERS, MAINTENANCE,
        ALERT_OPERATOR, SHUTDOWN_EQUIPMENT, CONTACT_EXPERT
    }
    
    /**
     * 操作优先级
     */
    public enum ActionPriority {
        LOW, MEDIUM, HIGH, URGENT, CRITICAL
    }
    
    /**
     * 数据质量问题
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataQualityIssue {
        private QualityIssueType issueType;
        private String description;
        private IssueSeverity severity;
        private String affectedField;
        private int affectedRecords;
    }
    
    /**
     * 质量问题类型
     */
    public enum QualityIssueType {
        MISSING_DATA, DUPLICATE_DATA, INCONSISTENT_DATA,
        OUTDATED_DATA, INVALID_FORMAT, OUT_OF_RANGE
    }
    
    /**
     * 问题严重程度
     */
    public enum IssueSeverity {
        MINOR, MODERATE, MAJOR, CRITICAL
    }
    
    /**
     * 异常检测算法
     */
    public enum AnomalyDetectionAlgorithm {
        ISOLATION_FOREST, ONE_CLASS_SVM, LOCAL_OUTLIER_FACTOR,
        AUTOENCODER, LSTM_AUTOENCODER, VAE, GAN,
        STATISTICAL_OUTLIER, Z_SCORE, MODIFIED_Z_SCORE,
        DBSCAN, HDBSCAN, OPTICS
    }
    
    /**
     * 时间粒度
     */
    public enum TimeGranularity {
        SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, YEAR
    }
}