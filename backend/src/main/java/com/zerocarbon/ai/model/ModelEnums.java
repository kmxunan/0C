package com.zerocarbon.ai.model;

/**
 * AI模型相关枚举定义
 * 
 * @author Zero Carbon Team
 * @version 1.0
 * @since 2025-01-10
 */
public class ModelEnums {
    
    /**
     * 模型架构类型
     */
    public enum ModelArchitecture {
        /**
         * 多层感知机
         */
        MLP("Multi-Layer Perceptron", "多层感知机"),
        
        /**
         * 卷积神经网络
         */
        CNN("Convolutional Neural Network", "卷积神经网络"),
        
        /**
         * 循环神经网络
         */
        RNN("Recurrent Neural Network", "循环神经网络"),
        
        /**
         * 长短期记忆网络
         */
        LSTM("Long Short-Term Memory", "长短期记忆网络"),
        
        /**
         * 门控循环单元
         */
        GRU("Gated Recurrent Unit", "门控循环单元"),
        
        /**
         * Transformer
         */
        TRANSFORMER("Transformer", "Transformer"),
        
        /**
         * 自编码器
         */
        AUTOENCODER("Autoencoder", "自编码器"),
        
        /**
         * 生成对抗网络
         */
        GAN("Generative Adversarial Network", "生成对抗网络"),
        
        /**
         * 残差网络
         */
        RESNET("Residual Network", "残差网络"),
        
        /**
         * 注意力机制网络
         */
        ATTENTION("Attention Network", "注意力机制网络");
        
        private final String englishName;
        private final String chineseName;
        
        ModelArchitecture(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 激活函数类型
     */
    public enum ActivationFunction {
        /**
         * 线性激活函数
         */
        LINEAR("Linear", "线性"),
        
        /**
         * ReLU激活函数
         */
        RELU("ReLU", "ReLU"),
        
        /**
         * Leaky ReLU激活函数
         */
        LEAKY_RELU("Leaky ReLU", "Leaky ReLU"),
        
        /**
         * ELU激活函数
         */
        ELU("ELU", "ELU"),
        
        /**
         * Sigmoid激活函数
         */
        SIGMOID("Sigmoid", "Sigmoid"),
        
        /**
         * Tanh激活函数
         */
        TANH("Tanh", "Tanh"),
        
        /**
         * Softmax激活函数
         */
        SOFTMAX("Softmax", "Softmax"),
        
        /**
         * Swish激活函数
         */
        SWISH("Swish", "Swish"),
        
        /**
         * GELU激活函数
         */
        GELU("GELU", "GELU");
        
        private final String englishName;
        private final String chineseName;
        
        ActivationFunction(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 模型状态
     */
    public enum ModelStatus {
        /**
         * 初始化
         */
        INITIALIZED("Initialized", "已初始化"),
        
        /**
         * 训练中
         */
        TRAINING("Training", "训练中"),
        
        /**
         * 已训练
         */
        TRAINED("Trained", "已训练"),
        
        /**
         * 验证中
         */
        VALIDATING("Validating", "验证中"),
        
        /**
         * 已验证
         */
        VALIDATED("Validated", "已验证"),
        
        /**
         * 部署中
         */
        DEPLOYING("Deploying", "部署中"),
        
        /**
         * 已部署
         */
        DEPLOYED("Deployed", "已部署"),
        
        /**
         * 已停用
         */
        DEPRECATED("Deprecated", "已停用"),
        
        /**
         * 错误
         */
        ERROR("Error", "错误"),
        
        /**
         * 更新中
         */
        UPDATING("Updating", "更新中");
        
        private final String englishName;
        private final String chineseName;
        
        ModelStatus(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 模型类型
     */
    public enum ModelType {
        /**
         * 碳排放预测
         */
        CARBON_PREDICTION("Carbon Prediction", "碳排放预测"),
        
        /**
         * 异常检测
         */
        ANOMALY_DETECTION("Anomaly Detection", "异常检测"),
        
        /**
         * 能耗预测
         */
        ENERGY_PREDICTION("Energy Prediction", "能耗预测"),
        
        /**
         * 负荷预测
         */
        LOAD_FORECASTING("Load Forecasting", "负荷预测"),
        
        /**
         * 设备故障预测
         */
        EQUIPMENT_FAILURE_PREDICTION("Equipment Failure Prediction", "设备故障预测"),
        
        /**
         * 优化调度
         */
        OPTIMIZATION_SCHEDULING("Optimization Scheduling", "优化调度"),
        
        /**
         * 图像识别
         */
        IMAGE_RECOGNITION("Image Recognition", "图像识别"),
        
        /**
         * 自然语言处理
         */
        NLP("Natural Language Processing", "自然语言处理"),
        
        /**
         * 推荐系统
         */
        RECOMMENDATION("Recommendation", "推荐系统"),
        
        /**
         * 分类
         */
        CLASSIFICATION("Classification", "分类"),
        
        /**
         * 回归
         */
        REGRESSION("Regression", "回归"),
        
        /**
         * 聚类
         */
        CLUSTERING("Clustering", "聚类");
        
        private final String englishName;
        private final String chineseName;
        
        ModelType(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 损失函数类型
     */
    public enum LossFunction {
        /**
         * 均方误差
         */
        MSE("Mean Squared Error", "均方误差"),
        
        /**
         * 平均绝对误差
         */
        MAE("Mean Absolute Error", "平均绝对误差"),
        
        /**
         * 交叉熵
         */
        CROSS_ENTROPY("Cross Entropy", "交叉熵"),
        
        /**
         * 二元交叉熵
         */
        BINARY_CROSS_ENTROPY("Binary Cross Entropy", "二元交叉熵"),
        
        /**
         * Huber损失
         */
        HUBER("Huber Loss", "Huber损失"),
        
        /**
         * 分位数损失
         */
        QUANTILE("Quantile Loss", "分位数损失"),
        
        /**
         * 焦点损失
         */
        FOCAL("Focal Loss", "焦点损失");
        
        private final String englishName;
        private final String chineseName;
        
        LossFunction(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 优化器类型
     */
    public enum OptimizerType {
        /**
         * 随机梯度下降
         */
        SGD("Stochastic Gradient Descent", "随机梯度下降"),
        
        /**
         * Adam优化器
         */
        ADAM("Adam", "Adam"),
        
        /**
         * AdaGrad优化器
         */
        ADAGRAD("AdaGrad", "AdaGrad"),
        
        /**
         * RMSprop优化器
         */
        RMSPROP("RMSprop", "RMSprop"),
        
        /**
         * AdaDelta优化器
         */
        ADADELTA("AdaDelta", "AdaDelta"),
        
        /**
         * AdamW优化器
         */
        ADAMW("AdamW", "AdamW"),
        
        /**
         * Nadam优化器
         */
        NADAM("Nadam", "Nadam");
        
        private final String englishName;
        private final String chineseName;
        
        OptimizerType(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 数据类型
     */
    public enum DataType {
        /**
         * 训练数据
         */
        TRAINING("Training", "训练数据"),
        
        /**
         * 验证数据
         */
        VALIDATION("Validation", "验证数据"),
        
        /**
         * 测试数据
         */
        TEST("Test", "测试数据"),
        
        /**
         * 预测数据
         */
        PREDICTION("Prediction", "预测数据");
        
        private final String englishName;
        private final String chineseName;
        
        DataType(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 模型压缩类型
     */
    public enum CompressionType {
        /**
         * 量化
         */
        QUANTIZATION("Quantization", "量化"),
        
        /**
         * 剪枝
         */
        PRUNING("Pruning", "剪枝"),
        
        /**
         * 知识蒸馏
         */
        DISTILLATION("Knowledge Distillation", "知识蒸馏"),
        
        /**
         * 低秩分解
         */
        LOW_RANK_DECOMPOSITION("Low Rank Decomposition", "低秩分解"),
        
        /**
         * 权重共享
         */
        WEIGHT_SHARING("Weight Sharing", "权重共享");
        
        private final String englishName;
        private final String chineseName;
        
        CompressionType(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 集成学习类型
     */
    public enum EnsembleType {
        /**
         * 投票
         */
        VOTING("Voting", "投票"),
        
        /**
         * 平均
         */
        AVERAGING("Averaging", "平均"),
        
        /**
         * 加权平均
         */
        WEIGHTED_AVERAGING("Weighted Averaging", "加权平均"),
        
        /**
         * 堆叠
         */
        STACKING("Stacking", "堆叠"),
        
        /**
         * 混合
         */
        BLENDING("Blending", "混合"),
        
        /**
         * Boosting
         */
        BOOSTING("Boosting", "Boosting"),
        
        /**
         * Bagging
         */
        BAGGING("Bagging", "Bagging");
        
        private final String englishName;
        private final String chineseName;
        
        EnsembleType(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
    
    /**
     * 评估指标类型
     */
    public enum MetricType {
        /**
         * 准确率
         */
        ACCURACY("Accuracy", "准确率"),
        
        /**
         * 精确率
         */
        PRECISION("Precision", "精确率"),
        
        /**
         * 召回率
         */
        RECALL("Recall", "召回率"),
        
        /**
         * F1分数
         */
        F1_SCORE("F1 Score", "F1分数"),
        
        /**
         * AUC
         */
        AUC("AUC", "AUC"),
        
        /**
         * 均方误差
         */
        MSE("Mean Squared Error", "均方误差"),
        
        /**
         * 平均绝对误差
         */
        MAE("Mean Absolute Error", "平均绝对误差"),
        
        /**
         * R²分数
         */
        R2_SCORE("R² Score", "R²分数"),
        
        /**
         * 均方根误差
         */
        RMSE("Root Mean Squared Error", "均方根误差"),
        
        /**
         * 平均绝对百分比误差
         */
        MAPE("Mean Absolute Percentage Error", "平均绝对百分比误差");
        
        private final String englishName;
        private final String chineseName;
        
        MetricType(String englishName, String chineseName) {
            this.englishName = englishName;
            this.chineseName = chineseName;
        }
        
        public String getEnglishName() {
            return englishName;
        }
        
        public String getChineseName() {
            return chineseName;
        }
    }
}