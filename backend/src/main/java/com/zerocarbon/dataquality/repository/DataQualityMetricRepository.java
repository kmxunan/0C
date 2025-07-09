package com.zerocarbon.dataquality.repository;

import com.zerocarbon.dataquality.entity.DataQualityMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 数据质量指标数据访问层
 */
@Repository
public interface DataQualityMetricRepository extends JpaRepository<DataQualityMetric, Long> {

    /**
     * 根据数据源和表名查询质量指标
     */
    List<DataQualityMetric> findByDataSourceAndTableName(String dataSource, String tableName);

    /**
     * 根据数据源查询质量指标
     */
    List<DataQualityMetric> findByDataSource(String dataSource);

    /**
     * 根据表名查询质量指标
     */
    List<DataQualityMetric> findByTableName(String tableName);

    /**
     * 根据质量等级查询指标
     */
    List<DataQualityMetric> findByQualityLevel(String qualityLevel);

    /**
     * 根据综合评分范围查询指标
     */
    List<DataQualityMetric> findByOverallScoreBetween(Double minScore, Double maxScore);

    /**
     * 根据创建时间范围查询指标
     */
    List<DataQualityMetric> findByCreateTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据创建时间之后查询指标
     */
    List<DataQualityMetric> findByCreateTimeAfter(LocalDateTime time);

    /**
     * 根据数据源、表名和创建时间查询指标
     */
    List<DataQualityMetric> findByDataSourceAndTableNameAndCreateTimeAfter(
        String dataSource, String tableName, LocalDateTime time);

    /**
     * 根据数据源、表名和创建时间范围查询指标
     */
    List<DataQualityMetric> findByDataSourceAndTableNameAndCreateTimeBetween(
        String dataSource, String tableName, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查询最新的质量指标
     */
    @Query("SELECT m FROM DataQualityMetric m WHERE m.dataSource = :dataSource AND m.tableName = :tableName " +
           "ORDER BY m.createTime DESC")
    List<DataQualityMetric> findLatestByDataSourceAndTableName(
        @Param("dataSource") String dataSource, @Param("tableName") String tableName);

    /**
     * 查询最新的质量指标（单条）
     */
    @Query("SELECT m FROM DataQualityMetric m WHERE m.dataSource = :dataSource AND m.tableName = :tableName " +
           "ORDER BY m.createTime DESC LIMIT 1")
    Optional<DataQualityMetric> findLatestOneByDataSourceAndTableName(
        @Param("dataSource") String dataSource, @Param("tableName") String tableName);

    /**
     * 查询指定时间段内的平均质量评分
     */
    @Query("SELECT AVG(m.overallScore) FROM DataQualityMetric m " +
           "WHERE m.dataSource = :dataSource AND m.tableName = :tableName " +
           "AND m.createTime BETWEEN :startTime AND :endTime")
    Double findAverageScoreByDataSourceAndTableNameAndTimeBetween(
        @Param("dataSource") String dataSource, 
        @Param("tableName") String tableName,
        @Param("startTime") LocalDateTime startTime, 
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询指定数据源的平均质量评分
     */
    @Query("SELECT AVG(m.overallScore) FROM DataQualityMetric m WHERE m.dataSource = :dataSource")
    Double findAverageScoreByDataSource(@Param("dataSource") String dataSource);

    /**
     * 查询所有数据源的平均质量评分
     */
    @Query("SELECT AVG(m.overallScore) FROM DataQualityMetric m")
    Double findOverallAverageScore();

    /**
     * 统计各质量等级的数量
     */
    @Query("SELECT m.qualityLevel, COUNT(m) FROM DataQualityMetric m GROUP BY m.qualityLevel")
    List<Object[]> countByQualityLevel();

    /**
     * 统计各数据源的质量指标数量
     */
    @Query("SELECT m.dataSource, COUNT(m) FROM DataQualityMetric m GROUP BY m.dataSource")
    List<Object[]> countByDataSource();

    /**
     * 查询质量评分低于阈值的指标
     */
    List<DataQualityMetric> findByOverallScoreLessThan(Double threshold);

    /**
     * 查询完整性评分低于阈值的指标
     */
    List<DataQualityMetric> findByCompletenessScoreLessThan(Double threshold);

    /**
     * 查询准确性评分低于阈值的指标
     */
    List<DataQualityMetric> findByAccuracyScoreLessThan(Double threshold);

    /**
     * 查询一致性评分低于阈值的指标
     */
    List<DataQualityMetric> findByConsistencyScoreLessThan(Double threshold);

    /**
     * 查询需要告警的质量指标
     */
    @Query("SELECT m FROM DataQualityMetric m WHERE m.overallScore < :threshold " +
           "AND m.createTime > :time ORDER BY m.overallScore ASC")
    List<DataQualityMetric> findAlertsAfterTime(
        @Param("threshold") Double threshold, @Param("time") LocalDateTime time);

    /**
     * 查询质量趋势数据
     */
    @Query("SELECT DATE(m.createTime) as date, AVG(m.overallScore) as avgScore, " +
           "AVG(m.completenessScore) as avgCompleteness, AVG(m.accuracyScore) as avgAccuracy, " +
           "AVG(m.consistencyScore) as avgConsistency, COUNT(m) as count " +
           "FROM DataQualityMetric m " +
           "WHERE m.dataSource = :dataSource AND m.tableName = :tableName " +
           "AND m.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(m.createTime) ORDER BY DATE(m.createTime)")
    List<Object[]> findQualityTrendByDataSourceAndTableNameAndTimeBetween(
        @Param("dataSource") String dataSource,
        @Param("tableName") String tableName,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询数据源质量趋势
     */
    @Query("SELECT DATE(m.createTime) as date, AVG(m.overallScore) as avgScore, COUNT(m) as count " +
           "FROM DataQualityMetric m " +
           "WHERE m.dataSource = :dataSource AND m.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(m.createTime) ORDER BY DATE(m.createTime)")
    List<Object[]> findQualityTrendByDataSourceAndTimeBetween(
        @Param("dataSource") String dataSource,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询整体质量趋势
     */
    @Query("SELECT DATE(m.createTime) as date, AVG(m.overallScore) as avgScore, COUNT(m) as count " +
           "FROM DataQualityMetric m " +
           "WHERE m.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(m.createTime) ORDER BY DATE(m.createTime)")
    List<Object[]> findOverallQualityTrendByTimeBetween(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询质量最差的表
     */
    @Query("SELECT m.dataSource, m.tableName, AVG(m.overallScore) as avgScore " +
           "FROM DataQualityMetric m " +
           "WHERE m.createTime > :time " +
           "GROUP BY m.dataSource, m.tableName " +
           "ORDER BY avgScore ASC")
    List<Object[]> findWorstQualityTablesAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询质量最好的表
     */
    @Query("SELECT m.dataSource, m.tableName, AVG(m.overallScore) as avgScore " +
           "FROM DataQualityMetric m " +
           "WHERE m.createTime > :time " +
           "GROUP BY m.dataSource, m.tableName " +
           "ORDER BY avgScore DESC")
    List<Object[]> findBestQualityTablesAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询质量波动最大的表
     */
    @Query("SELECT m.dataSource, m.tableName, " +
           "STDDEV(m.overallScore) as scoreStdDev, AVG(m.overallScore) as avgScore " +
           "FROM DataQualityMetric m " +
           "WHERE m.createTime > :time " +
           "GROUP BY m.dataSource, m.tableName " +
           "HAVING COUNT(m) >= :minCount " +
           "ORDER BY scoreStdDev DESC")
    List<Object[]> findMostVolatileQualityTablesAfterTime(
        @Param("time") LocalDateTime time, @Param("minCount") Long minCount);

    /**
     * 查询检查耗时统计
     */
    @Query("SELECT m.dataSource, m.tableName, AVG(m.checkDurationMs) as avgDuration, " +
           "MIN(m.checkDurationMs) as minDuration, MAX(m.checkDurationMs) as maxDuration " +
           "FROM DataQualityMetric m " +
           "WHERE m.checkDurationMs IS NOT NULL AND m.createTime > :time " +
           "GROUP BY m.dataSource, m.tableName")
    List<Object[]> findCheckDurationStatsAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询异常记录数统计
     */
    @Query("SELECT m.dataSource, m.tableName, SUM(m.anomalyRecords) as totalAnomalies, " +
           "AVG(m.anomalyRecords) as avgAnomalies " +
           "FROM DataQualityMetric m " +
           "WHERE m.anomalyRecords IS NOT NULL AND m.createTime > :time " +
           "GROUP BY m.dataSource, m.tableName " +
           "ORDER BY totalAnomalies DESC")
    List<Object[]> findAnomalyStatsAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询数据量统计
     */
    @Query("SELECT m.dataSource, m.tableName, AVG(m.totalRecords) as avgRecords, " +
           "MIN(m.totalRecords) as minRecords, MAX(m.totalRecords) as maxRecords " +
           "FROM DataQualityMetric m " +
           "WHERE m.totalRecords IS NOT NULL AND m.createTime > :time " +
           "GROUP BY m.dataSource, m.tableName")
    List<Object[]> findRecordCountStatsAfterTime(@Param("time") LocalDateTime time);

    /**
     * 删除指定时间之前的历史数据
     */
    void deleteByCreateTimeBefore(LocalDateTime time);

    /**
     * 查询需要清理的历史数据数量
     */
    @Query("SELECT COUNT(m) FROM DataQualityMetric m WHERE m.createTime < :time")
    Long countByCreateTimeBefore(@Param("time") LocalDateTime time);

    /**
     * 查询最近N条记录
     */
    List<DataQualityMetric> findTop10ByOrderByCreateTimeDesc();

    /**
     * 查询指定数据源和表的最近N条记录
     */
    List<DataQualityMetric> findTop10ByDataSourceAndTableNameOrderByCreateTimeDesc(
        String dataSource, String tableName);

    /**
     * 检查是否存在指定条件的记录
     */
    boolean existsByDataSourceAndTableNameAndCreateTimeAfter(
        String dataSource, String tableName, LocalDateTime time);

    /**
     * 查询指定检查类型的指标
     */
    List<DataQualityMetric> findByCheckType(String checkType);

    /**
     * 查询指定规则版本的指标
     */
    List<DataQualityMetric> findByRuleVersion(String ruleVersion);

    /**
     * 查询创建人的指标
     */
    List<DataQualityMetric> findByCreatedBy(String createdBy);

    /**
     * 查询包含指定问题的指标
     */
    @Query("SELECT m FROM DataQualityMetric m WHERE m.issues LIKE %:issue%")
    List<DataQualityMetric> findByIssuesContaining(@Param("issue") String issue);

    /**
     * 查询包含指定建议的指标
     */
    @Query("SELECT m FROM DataQualityMetric m WHERE m.suggestions LIKE %:suggestion%")
    List<DataQualityMetric> findBySuggestionsContaining(@Param("suggestion") String suggestion);
}