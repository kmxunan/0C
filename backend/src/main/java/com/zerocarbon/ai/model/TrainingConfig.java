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
 * AI模型训练配置相关数据结构
 *
 * @author Zero Carbon Team
 * @version 1.0
 * @since 2025-06-10
 */
public class TrainingConfig {
    
    /**
     * 碳排放预测模型训练配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarbonPredictionTrainingConfig {
        
        /**
         * 模型名称
         */
        private String modelName;
        
        /**
         * 模型架构
         */
        private ModelArchitecture modelArchitecture;
        
        /**
         * 训练数据时间范围
         */
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        
        /**
         * 最小数据量要求
         */
        private int minDataSize;
        
        /**
         * 批次大小
         */
        private int batchSize;
        
        /**
         * 训练轮数
         */
        private int epochs;
        
        /**
         * 学习率
         */
        private double learningRate;
        
        /**
         * 输入维度
         */
        private int inputDimension;
        
        /**
         * 输出维度
         */
        private int outputDimension;
        
        /**
         * 隐藏层配置
         */
        private List<HiddenLayer> hiddenLayers;
        
        /**
         * 激活函数
         */
        private ActivationFunction activationFunction;
        
        /**
         * 优化器类型
         */
        private OptimizerType optimizerType;
        
        /**
         * 损失函数
         */
        private LossFunction lossFunction;
        
        /**
         * 训练/测试数据分割比例
         */
        private double trainTestSplit;
        
        /**
         * 数据过滤条件
         */
        private Map<String, Object> dataFilters;
        
        /**
         * 特征配置
         */
        private FeatureConfig featureConfig;
        
        /**
         * 正则化参数
         */
        private RegularizationConfig regularizationConfig;
        
        /**
         * 早停配置
         */
        private EarlyStoppingConfig earlyStoppingConfig;
        
        /**
         * 数据增强配置
         */
        private DataAugmentationConfig dataAugmentationConfig;
        
        /**
         * 验证策略
         */
        private ValidationStrategy validationStrategy;
        
        /**
         * 是否启用GPU加速
         */
        private boolean enableGpu;
        
        /**
         * 随机种子
         */
        private Long randomSeed;
        
        /**
         * 模型保存路径
         */
        private String modelSavePath;
        
        /**
         * 日志级别
         */
        private String logLevel;
        
        /**
         * 自定义超参数
         */
        private Map<String, Object> customHyperParameters;
    }
    
    /**
     * 异常检测模型训练配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyDetectionTrainingConfig {
        
        /**
         * 模型名称
         */
        private String modelName;
        
        /**
         * 异常检测算法类型
         */
        private AnomalyDetectionAlgorithm algorithm;
        
        /**
         * 训练数据时间范围
         */
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        
        /**
         * 异常阈值
         */
        private double anomalyThreshold;
        
        /**
         * 窗口大小（用于时序异常检测）
         */
        private int windowSize;
        
        /**
         * 特征维度
         */
        private int featureDimension;
        
        /**
         * 正常数据比例
         */
        private double normalDataRatio;
        
        /**
         * 污染率（异常数据比例）
         */
        private double contaminationRate;
        
        /**
         * 数据预处理配置
         */
        private DataPreprocessingConfig preprocessingConfig;
        
        /**
         * 特征选择配置
         */
        private FeatureSelectionConfig featureSelectionConfig;
        
        /**
         * 模型参数
         */
        private Map<String, Object> modelParameters;
        
        /**
         * 交叉验证折数
         */
        private int crossValidationFolds;
        
        /**
         * 性能评估指标
         */
        private List<MetricType> evaluationMetrics;
    }
    
    /**
     * 隐藏层配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HiddenLayer {
        
        /**
         * 层大小（神经元数量）
         */
        private int size;
        
        /**
         * 激活函数
         */
        private ActivationFunction activationFunction;
        
        /**
         * Dropout率
         */
        private double dropoutRate;
        
        /**
         * 批标准化
         */
        private boolean batchNormalization;
        
        /**
         * 权重初始化方法
         */
        private WeightInitialization weightInitialization;
        
        /**
         * 层类型
         */
        private LayerType layerType;
        
        /**
         * 自定义参数
         */
        private Map<String, Object> customParams;
    }
    
    /**
     * 特征配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureConfig {
        
        /**
         * 特征列表
         */
        private List<String> features;
        
        /**
         * 目标变量
         */
        private String targetVariable;
        
        /**
         * 特征工程方法
         */
        private List<FeatureEngineeringMethod> engineeringMethods;
        
        /**
         * 特征标准化方法
         */
        private FeatureNormalizationMethod normalizationMethod;
        
        /**
         * 特征选择方法
         */
        private FeatureSelectionMethod selectionMethod;
        
        /**
         * 时间特征配置
         */
        private TimeFeatureConfig timeFeatureConfig;
        
        /**
         * 分类特征编码方法
         */
        private CategoricalEncodingMethod categoricalEncoding;
        
        /**
         * 缺失值处理方法
         */
        private MissingValueHandling missingValueHandling;
        
        /**
         * 异常值处理方法
         */
        private OutlierHandling outlierHandling;
    }
    
    /**
     * 正则化配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegularizationConfig {
        
        /**
         * L1正则化系数
         */
        private double l1Lambda;
        
        /**
         * L2正则化系数
         */
        private double l2Lambda;
        
        /**
         * Dropout率
         */
        private double dropoutRate;
        
        /**
         * 批标准化
         */
        private boolean batchNormalization;
        
        /**
         * 权重衰减
         */
        private double weightDecay;
        
        /**
         * 梯度裁剪阈值
         */
        private double gradientClipping;
    }
    
    /**
     * 早停配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EarlyStoppingConfig {
        
        /**
         * 是否启用早停
         */
        private boolean enabled;
        
        /**
         * 监控指标
         */
        private String monitorMetric;
        
        /**
         * 耐心值（连续多少轮无改善后停止）
         */
        private int patience;
        
        /**
         * 最小改善幅度
         */
        private double minDelta;
        
        /**
         * 监控模式（min/max）
         */
        private String mode;
        
        /**
         * 是否恢复最佳权重
         */
        private boolean restoreBestWeights;
    }
    
    /**
     * 数据增强配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataAugmentationConfig {
        
        /**
         * 是否启用数据增强
         */
        private boolean enabled;
        
        /**
         * 增强方法列表
         */
        private List<DataAugmentationMethod> methods;
        
        /**
         * 增强比例
         */
        private double augmentationRatio;
        
        /**
         * 噪声水平
         */
        private double noiseLevel;
        
        /**
         * 时间扭曲参数
         */
        private TimeWarpingConfig timeWarpingConfig;
        
        /**
         * 随机采样配置
         */
        private RandomSamplingConfig randomSamplingConfig;
    }
    
    /**
     * 数据预处理配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPreprocessingConfig {
        
        /**
         * 数据清洗规则
         */
        private List<DataCleaningRule> cleaningRules;
        
        /**
         * 异常值检测方法
         */
        private OutlierDetectionMethod outlierDetectionMethod;
        
        /**
         * 缺失值填充方法
         */
        private MissingValueImputationMethod imputationMethod;
        
        /**
         * 数据平滑方法
         */
        private DataSmoothingMethod smoothingMethod;
        
        /**
         * 数据标准化方法
         */
        private DataNormalizationMethod normalizationMethod;
        
        /**
         * 采样方法
         */
        private SamplingMethod samplingMethod;
    }
    
    /**
     * 特征选择配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureSelectionConfig {
        
        /**
         * 特征选择方法
         */
        private FeatureSelectionMethod method;
        
        /**
         * 选择的特征数量
         */
        private int numberOfFeatures;
        
        /**
         * 重要性阈值
         */
        private double importanceThreshold;
        
        /**
         * 相关性阈值
         */
        private double correlationThreshold;
        
        /**
         * 统计检验方法
         */
        private StatisticalTestMethod statisticalTest;
    }
    
    /**
     * 时间特征配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeFeatureConfig {
        
        /**
         * 是否提取时间特征
         */
        private boolean extractTimeFeatures;
        
        /**
         * 时间粒度
         */
        private TimeGranularity timeGranularity;
        
        /**
         * 滞后特征窗口
         */
        private List<Integer> lagWindows;
        
        /**
         * 滑动窗口统计特征
         */
        private List<WindowStatistic> windowStatistics;
        
        /**
         * 季节性特征
         */
        private boolean seasonalFeatures;
        
        /**
         * 趋势特征
         */
        private boolean trendFeatures;
    }
    
    /**
     * 时间扭曲配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeWarpingConfig {
        
        /**
         * 扭曲强度
         */
        private double warpingStrength;
        
        /**
         * 扭曲点数量
         */
        private int warpingPoints;
        
        /**
         * 扭曲方法
         */
        private TimeWarpingMethod method;
    }
    
    /**
     * 随机采样配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RandomSamplingConfig {
        
        /**
         * 采样率
         */
        private double samplingRate;
        
        /**
         * 采样方法
         */
        private RandomSamplingMethod method;
        
        /**
         * 是否保持时序
         */
        private boolean maintainSequence;
    }
    
    // ==================== 枚举定义 ====================
    
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
     * 权重初始化方法
     */
    public enum WeightInitialization {
        XAVIER, HE, LECUN, RANDOM_NORMAL, RANDOM_UNIFORM, ZEROS, ONES
    }
    
    /**
     * 层类型
     */
    public enum LayerType {
        DENSE, CONV1D, CONV2D, LSTM, GRU, ATTENTION, DROPOUT, BATCH_NORM
    }
    
    /**
     * 特征工程方法
     */
    public enum FeatureEngineeringMethod {
        POLYNOMIAL, INTERACTION, LOG_TRANSFORM, SQRT_TRANSFORM,
        BOX_COX, BINNING, SCALING, PCA, ICA
    }
    
    /**
     * 特征标准化方法
     */
    public enum FeatureNormalizationMethod {
        STANDARD_SCALER, MIN_MAX_SCALER, ROBUST_SCALER,
        QUANTILE_UNIFORM, QUANTILE_NORMAL, POWER_TRANSFORMER
    }
    
    /**
     * 特征选择方法
     */
    public enum FeatureSelectionMethod {
        UNIVARIATE_SELECTION, RECURSIVE_FEATURE_ELIMINATION,
        FEATURE_IMPORTANCE, CORRELATION_FILTER, MUTUAL_INFO,
        CHI_SQUARE, ANOVA_F_TEST, LASSO_REGULARIZATION
    }
    
    /**
     * 分类特征编码方法
     */
    public enum CategoricalEncodingMethod {
        ONE_HOT, LABEL_ENCODING, TARGET_ENCODING, BINARY_ENCODING,
        HASH_ENCODING, ORDINAL_ENCODING, FREQUENCY_ENCODING
    }
    
    /**
     * 缺失值处理方法
     */
    public enum MissingValueHandling {
        DROP, MEAN_IMPUTATION, MEDIAN_IMPUTATION, MODE_IMPUTATION,
        FORWARD_FILL, BACKWARD_FILL, INTERPOLATION, KNN_IMPUTATION
    }
    
    /**
     * 异常值处理方法
     */
    public enum OutlierHandling {
        REMOVE, CAP, TRANSFORM, KEEP, WINSORIZE, CLIP
    }
    
    /**
     * 验证策略
     */
    public enum ValidationStrategy {
        HOLD_OUT, K_FOLD, STRATIFIED_K_FOLD, TIME_SERIES_SPLIT,
        LEAVE_ONE_OUT, BOOTSTRAP
    }
    
    /**
     * 数据增强方法
     */
    public enum DataAugmentationMethod {
        NOISE_INJECTION, TIME_WARPING, RANDOM_SAMPLING,
        MIXUP, CUTMIX, ROTATION, SCALING, JITTERING
    }
    
    /**
     * 异常值检测方法
     */
    public enum OutlierDetectionMethod {
        Z_SCORE, MODIFIED_Z_SCORE, IQR, ISOLATION_FOREST,
        LOCAL_OUTLIER_FACTOR, ONE_CLASS_SVM
    }
    
    /**
     * 缺失值填充方法
     */
    public enum MissingValueImputationMethod {
        MEAN, MEDIAN, MODE, FORWARD_FILL, BACKWARD_FILL,
        LINEAR_INTERPOLATION, SPLINE_INTERPOLATION, KNN
    }
    
    /**
     * 数据平滑方法
     */
    public enum DataSmoothingMethod {
        MOVING_AVERAGE, EXPONENTIAL_SMOOTHING, SAVITZKY_GOLAY,
        GAUSSIAN_FILTER, MEDIAN_FILTER
    }
    
    /**
     * 数据标准化方法
     */
    public enum DataNormalizationMethod {
        Z_SCORE, MIN_MAX, ROBUST, QUANTILE, UNIT_VECTOR
    }
    
    /**
     * 采样方法
     */
    public enum SamplingMethod {
        RANDOM, SYSTEMATIC, STRATIFIED, CLUSTER, OVERSAMPLING, UNDERSAMPLING
    }
    
    /**
     * 统计检验方法
     */
    public enum StatisticalTestMethod {
        CHI_SQUARE, ANOVA, T_TEST, MANN_WHITNEY, KRUSKAL_WALLIS
    }
    
    /**
     * 时间粒度
     */
    public enum TimeGranularity {
        SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, YEAR
    }
    
    /**
     * 窗口统计
     */
    public enum WindowStatistic {
        MEAN, MEDIAN, STD, MIN, MAX, SUM, COUNT, SKEWNESS, KURTOSIS
    }
    
    /**
     * 时间扭曲方法
     */
    public enum TimeWarpingMethod {
        DTW, ELASTIC, PIECEWISE_LINEAR, SPLINE
    }
    
    /**
     * 随机采样方法
     */
    public enum RandomSamplingMethod {
        UNIFORM, GAUSSIAN, BOOTSTRAP, PERMUTATION
    }
    
    /**
     * 数据清洗规则
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataCleaningRule {
        
        /**
         * 规则名称
         */
        private String ruleName;
        
        /**
         * 规则类型
         */
        private CleaningRuleType ruleType;
        
        /**
         * 规则参数
         */
        private Map<String, Object> parameters;
        
        /**
         * 是否启用
         */
        private boolean enabled;
    }
    
    /**
     * 清洗规则类型
     */
    public enum CleaningRuleType {
        REMOVE_DUPLICATES, REMOVE_NULLS, REMOVE_OUTLIERS,
        FORMAT_CORRECTION, RANGE_VALIDATION, CONSISTENCY_CHECK
    }
}