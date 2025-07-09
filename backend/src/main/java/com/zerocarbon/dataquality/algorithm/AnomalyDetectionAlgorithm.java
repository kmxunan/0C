package com.zerocarbon.dataquality.algorithm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 异常检测算法实现类
 * 用于零碳园区数字孪生系统中的数据异常检测
 * 
 * @author Zero Carbon System
 * @version 1.0
 * @since 2024
 */
@Slf4j
@Component
public class AnomalyDetectionAlgorithm {
    
    /**
     * Z-Score异常检测
     * 基于标准差的异常检测方法
     */
    public List<AnomalyResult> detectZScoreAnomalies(List<Double> values, double threshold) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        if (values == null || values.size() < 3) {
            return anomalies;
        }
        
        // 计算均值和标准差
        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double variance = values.stream()
            .mapToDouble(v -> Math.pow(v - mean, 2))
            .average().orElse(0.0);
        double stdDev = Math.sqrt(variance);
        
        if (stdDev == 0) {
            return anomalies; // 所有值相同，无异常
        }
        
        // 检测异常值
        for (int i = 0; i < values.size(); i++) {
            double value = values.get(i);
            double zScore = Math.abs((value - mean) / stdDev);
            
            if (zScore > threshold) {
                AnomalyResult anomaly = new AnomalyResult();
                anomaly.setIndex(i);
                anomaly.setValue(value);
                anomaly.setScore(zScore);
                anomaly.setType("Z_SCORE");
                anomaly.setDescription(String.format("Z-Score异常: %.2f (阈值: %.2f)", zScore, threshold));
                anomaly.setSeverity(getSeverityByScore(zScore, threshold));
                anomalies.add(anomaly);
            }
        }
        
        return anomalies;
    }
    
    /**
     * IQR (四分位距) 异常检测
     * 基于四分位数的异常检测方法
     */
    public List<AnomalyResult> detectIQRAnomalies(List<Double> values, double multiplier) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        if (values == null || values.size() < 4) {
            return anomalies;
        }
        
        // 排序并计算四分位数
        List<Double> sortedValues = values.stream().sorted().collect(Collectors.toList());
        int n = sortedValues.size();
        
        double q1 = getPercentile(sortedValues, 25);
        double q3 = getPercentile(sortedValues, 75);
        double iqr = q3 - q1;
        
        double lowerBound = q1 - multiplier * iqr;
        double upperBound = q3 + multiplier * iqr;
        
        // 检测异常值
        for (int i = 0; i < values.size(); i++) {
            double value = values.get(i);
            
            if (value < lowerBound || value > upperBound) {
                AnomalyResult anomaly = new AnomalyResult();
                anomaly.setIndex(i);
                anomaly.setValue(value);
                anomaly.setScore(Math.max(
                    Math.abs(value - lowerBound) / iqr,
                    Math.abs(value - upperBound) / iqr
                ));
                anomaly.setType("IQR");
                anomaly.setDescription(String.format("IQR异常: %.2f (范围: [%.2f, %.2f])", 
                    value, lowerBound, upperBound));
                anomaly.setSeverity(getSeverityByBounds(value, lowerBound, upperBound, iqr));
                anomalies.add(anomaly);
            }
        }
        
        return anomalies;
    }
    
    /**
     * 移动平均异常检测
     * 基于移动平均的异常检测方法
     */
    public List<AnomalyResult> detectMovingAverageAnomalies(List<Double> values, int windowSize, double threshold) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        if (values == null || values.size() < windowSize + 1) {
            return anomalies;
        }
        
        // 计算移动平均
        for (int i = windowSize; i < values.size(); i++) {
            double sum = 0;
            for (int j = i - windowSize; j < i; j++) {
                sum += values.get(j);
            }
            double movingAverage = sum / windowSize;
            
            double currentValue = values.get(i);
            double deviation = Math.abs(currentValue - movingAverage);
            double relativeDeviation = movingAverage != 0 ? deviation / Math.abs(movingAverage) : deviation;
            
            if (relativeDeviation > threshold) {
                AnomalyResult anomaly = new AnomalyResult();
                anomaly.setIndex(i);
                anomaly.setValue(currentValue);
                anomaly.setScore(relativeDeviation);
                anomaly.setType("MOVING_AVERAGE");
                anomaly.setDescription(String.format("移动平均异常: %.2f vs 平均 %.2f (偏差: %.2f%%)", 
                    currentValue, movingAverage, relativeDeviation * 100));
                anomaly.setSeverity(getSeverityByScore(relativeDeviation, threshold));
                anomalies.add(anomaly);
            }
        }
        
        return anomalies;
    }
    
    /**
     * 孤立森林异常检测 (简化版)
     * 基于随机森林的异常检测方法
     */
    public List<AnomalyResult> detectIsolationForestAnomalies(List<Double> values, double threshold) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        if (values == null || values.size() < 10) {
            return anomalies;
        }
        
        // 简化的孤立森林实现
        // 计算每个点的孤立度分数
        for (int i = 0; i < values.size(); i++) {
            double value = values.get(i);
            double isolationScore = calculateIsolationScore(value, values);
            
            if (isolationScore > threshold) {
                AnomalyResult anomaly = new AnomalyResult();
                anomaly.setIndex(i);
                anomaly.setValue(value);
                anomaly.setScore(isolationScore);
                anomaly.setType("ISOLATION_FOREST");
                anomaly.setDescription(String.format("孤立森林异常: 孤立度 %.2f (阈值: %.2f)", 
                    isolationScore, threshold));
                anomaly.setSeverity(getSeverityByScore(isolationScore, threshold));
                anomalies.add(anomaly);
            }
        }
        
        return anomalies;
    }
    
    /**
     * 时间序列异常检测
     * 基于时间序列特征的异常检测
     */
    public List<AnomalyResult> detectTimeSeriesAnomalies(List<TimeSeriesPoint> timeSeries, double threshold) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        if (timeSeries == null || timeSeries.size() < 5) {
            return anomalies;
        }
        
        // 检测趋势异常
        anomalies.addAll(detectTrendAnomalies(timeSeries, threshold));
        
        // 检测季节性异常
        anomalies.addAll(detectSeasonalAnomalies(timeSeries, threshold));
        
        // 检测突变点
        anomalies.addAll(detectChangePoints(timeSeries, threshold));
        
        return anomalies;
    }
    
    /**
     * 模式异常检测
     * 检测数据中的模式异常
     */
    public List<AnomalyResult> detectPatternAnomalies(List<String> patterns, double threshold) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        if (patterns == null || patterns.isEmpty()) {
            return anomalies;
        }
        
        // 计算模式频率
        Map<String, Integer> patternCounts = new HashMap<>();
        for (String pattern : patterns) {
            patternCounts.put(pattern, patternCounts.getOrDefault(pattern, 0) + 1);
        }
        
        // 计算期望频率
        double expectedFrequency = (double) patterns.size() / patternCounts.size();
        
        // 检测异常模式
        for (int i = 0; i < patterns.size(); i++) {
            String pattern = patterns.get(i);
            int actualCount = patternCounts.get(pattern);
            double deviation = Math.abs(actualCount - expectedFrequency) / expectedFrequency;
            
            if (deviation > threshold) {
                AnomalyResult anomaly = new AnomalyResult();
                anomaly.setIndex(i);
                anomaly.setStringValue(pattern);
                anomaly.setScore(deviation);
                anomaly.setType("PATTERN");
                anomaly.setDescription(String.format("模式异常: %s 出现 %d 次 (期望: %.1f)", 
                    pattern, actualCount, expectedFrequency));
                anomaly.setSeverity(getSeverityByScore(deviation, threshold));
                anomalies.add(anomaly);
            }
        }
        
        return anomalies;
    }
    
    /**
     * 计算百分位数
     */
    private double getPercentile(List<Double> sortedValues, double percentile) {
        int n = sortedValues.size();
        double index = (percentile / 100.0) * (n - 1);
        
        if (index == Math.floor(index)) {
            return sortedValues.get((int) index);
        } else {
            int lower = (int) Math.floor(index);
            int upper = (int) Math.ceil(index);
            double weight = index - lower;
            return sortedValues.get(lower) * (1 - weight) + sortedValues.get(upper) * weight;
        }
    }
    
    /**
     * 计算孤立度分数
     */
    private double calculateIsolationScore(double value, List<Double> values) {
        // 简化的孤立度计算
        // 计算与其他点的平均距离
        double totalDistance = 0;
        for (Double other : values) {
            if (!other.equals(value)) {
                totalDistance += Math.abs(value - other);
            }
        }
        
        double avgDistance = totalDistance / (values.size() - 1);
        
        // 计算相对孤立度
        double maxDistance = values.stream().mapToDouble(v -> Math.abs(value - v)).max().orElse(1.0);
        return avgDistance / maxDistance;
    }
    
    /**
     * 检测趋势异常
     */
    private List<AnomalyResult> detectTrendAnomalies(List<TimeSeriesPoint> timeSeries, double threshold) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        // 计算移动趋势
        int windowSize = Math.min(5, timeSeries.size() / 2);
        
        for (int i = windowSize; i < timeSeries.size() - windowSize; i++) {
            double beforeTrend = calculateTrend(timeSeries.subList(i - windowSize, i));
            double afterTrend = calculateTrend(timeSeries.subList(i, i + windowSize));
            
            double trendChange = Math.abs(afterTrend - beforeTrend);
            
            if (trendChange > threshold) {
                AnomalyResult anomaly = new AnomalyResult();
                anomaly.setIndex(i);
                anomaly.setValue(timeSeries.get(i).getValue());
                anomaly.setScore(trendChange);
                anomaly.setType("TREND");
                anomaly.setDescription(String.format("趋势异常: 趋势变化 %.2f", trendChange));
                anomaly.setSeverity(getSeverityByScore(trendChange, threshold));
                anomalies.add(anomaly);
            }
        }
        
        return anomalies;
    }
    
    /**
     * 检测季节性异常
     */
    private List<AnomalyResult> detectSeasonalAnomalies(List<TimeSeriesPoint> timeSeries, double threshold) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        // 简化的季节性检测
        // 假设以24小时为周期
        int period = 24;
        
        if (timeSeries.size() < period * 2) {
            return anomalies;
        }
        
        for (int i = period; i < timeSeries.size(); i++) {
            double currentValue = timeSeries.get(i).getValue();
            double seasonalValue = timeSeries.get(i - period).getValue();
            
            double deviation = Math.abs(currentValue - seasonalValue);
            double relativeDeviation = seasonalValue != 0 ? deviation / Math.abs(seasonalValue) : deviation;
            
            if (relativeDeviation > threshold) {
                AnomalyResult anomaly = new AnomalyResult();
                anomaly.setIndex(i);
                anomaly.setValue(currentValue);
                anomaly.setScore(relativeDeviation);
                anomaly.setType("SEASONAL");
                anomaly.setDescription(String.format("季节性异常: %.2f vs 历史同期 %.2f", 
                    currentValue, seasonalValue));
                anomaly.setSeverity(getSeverityByScore(relativeDeviation, threshold));
                anomalies.add(anomaly);
            }
        }
        
        return anomalies;
    }
    
    /**
     * 检测突变点
     */
    private List<AnomalyResult> detectChangePoints(List<TimeSeriesPoint> timeSeries, double threshold) {
        List<AnomalyResult> anomalies = new ArrayList<>();
        
        for (int i = 1; i < timeSeries.size() - 1; i++) {
            double prevValue = timeSeries.get(i - 1).getValue();
            double currentValue = timeSeries.get(i).getValue();
            double nextValue = timeSeries.get(i + 1).getValue();
            
            // 计算变化率
            double changeRate1 = Math.abs(currentValue - prevValue);
            double changeRate2 = Math.abs(nextValue - currentValue);
            
            double maxChange = Math.max(changeRate1, changeRate2);
            double avgValue = (prevValue + currentValue + nextValue) / 3;
            double relativeChange = avgValue != 0 ? maxChange / Math.abs(avgValue) : maxChange;
            
            if (relativeChange > threshold) {
                AnomalyResult anomaly = new AnomalyResult();
                anomaly.setIndex(i);
                anomaly.setValue(currentValue);
                anomaly.setScore(relativeChange);
                anomaly.setType("CHANGE_POINT");
                anomaly.setDescription(String.format("突变点: 变化率 %.2f%%", relativeChange * 100));
                anomaly.setSeverity(getSeverityByScore(relativeChange, threshold));
                anomalies.add(anomaly);
            }
        }
        
        return anomalies;
    }
    
    /**
     * 计算趋势
     */
    private double calculateTrend(List<TimeSeriesPoint> points) {
        if (points.size() < 2) {
            return 0;
        }
        
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        int n = points.size();
        
        for (int i = 0; i < n; i++) {
            double x = i;
            double y = points.get(i).getValue();
            
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }
        
        // 计算斜率
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }
    
    /**
     * 根据分数获取严重程度
     */
    private String getSeverityByScore(double score, double threshold) {
        if (score > threshold * 3) {
            return "CRITICAL";
        } else if (score > threshold * 2) {
            return "HIGH";
        } else if (score > threshold * 1.5) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }
    
    /**
     * 根据边界获取严重程度
     */
    private String getSeverityByBounds(double value, double lowerBound, double upperBound, double iqr) {
        double distance = Math.min(Math.abs(value - lowerBound), Math.abs(value - upperBound));
        double relativeDistance = distance / iqr;
        
        if (relativeDistance > 3) {
            return "CRITICAL";
        } else if (relativeDistance > 2) {
            return "HIGH";
        } else if (relativeDistance > 1) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }
    
    /**
     * 异常检测结果
     */
    public static class AnomalyResult {
        private int index;
        private double value;
        private String stringValue;
        private double score;
        private String type;
        private String description;
        private String severity;
        private Map<String, Object> metadata = new HashMap<>();
        
        // Getters and Setters
        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }
        
        public double getValue() { return value; }
        public void setValue(double value) { this.value = value; }
        
        public String getStringValue() { return stringValue; }
        public void setStringValue(String stringValue) { this.stringValue = stringValue; }
        
        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }
    
    /**
     * 时间序列数据点
     */
    public static class TimeSeriesPoint {
        private long timestamp;
        private double value;
        
        public TimeSeriesPoint(long timestamp, double value) {
            this.timestamp = timestamp;
            this.value = value;
        }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        
        public double getValue() { return value; }
        public void setValue(double value) { this.value = value; }
    }
}