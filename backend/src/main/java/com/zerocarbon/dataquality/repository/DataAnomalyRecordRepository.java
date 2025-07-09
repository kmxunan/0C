package com.zerocarbon.dataquality.repository;

import com.zerocarbon.dataquality.entity.DataAnomalyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 数据异常记录数据访问层
 */
@Repository
public interface DataAnomalyRecordRepository extends JpaRepository<DataAnomalyRecord, Long> {

    /**
     * 根据异常编号查询记录
     */
    Optional<DataAnomalyRecord> findByAnomalyCode(String anomalyCode);

    /**
     * 根据数据源和表名查询异常记录
     */
    List<DataAnomalyRecord> findByDataSourceAndTableName(String dataSource, String tableName);

    /**
     * 根据数据源查询异常记录
     */
    List<DataAnomalyRecord> findByDataSource(String dataSource);

    /**
     * 根据表名查询异常记录
     */
    List<DataAnomalyRecord> findByTableName(String tableName);

    /**
     * 根据字段名查询异常记录
     */
    List<DataAnomalyRecord> findByFieldName(String fieldName);

    /**
     * 根据异常类型查询记录
     */
    List<DataAnomalyRecord> findByAnomalyType(String anomalyType);

    /**
     * 根据异常子类型查询记录
     */
    List<DataAnomalyRecord> findByAnomalySubtype(String anomalySubtype);

    /**
     * 根据严重程度查询记录
     */
    List<DataAnomalyRecord> findBySeverityLevel(String severityLevel);

    /**
     * 根据异常状态查询记录
     */
    List<DataAnomalyRecord> findByStatus(String status);

    /**
     * 根据处理状态查询记录
     */
    List<DataAnomalyRecord> findByHandleStatus(String handleStatus);

    /**
     * 根据处理人查询记录
     */
    List<DataAnomalyRecord> findByHandler(String handler);

    /**
     * 根据检测时间范围查询记录
     */
    List<DataAnomalyRecord> findByDetectionTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据检测时间之后查询记录
     */
    List<DataAnomalyRecord> findByDetectionTimeAfter(LocalDateTime time);

    /**
     * 根据异常评分范围查询记录
     */
    List<DataAnomalyRecord> findByAnomalyScoreBetween(Double minScore, Double maxScore);

    /**
     * 根据置信度范围查询记录
     */
    List<DataAnomalyRecord> findByConfidenceBetween(Double minConfidence, Double maxConfidence);

    /**
     * 查询未处理的异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE a.handleStatus IN ('待处理', '处理中') " +
           "ORDER BY a.severityLevel, a.detectionTime")
    List<DataAnomalyRecord> findUnhandledAnomalies();

    /**
     * 查询已处理的异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE a.handleStatus IN ('已处理', '已解决', '已关闭') " +
           "ORDER BY a.handleTime DESC")
    List<DataAnomalyRecord> findHandledAnomalies();

    /**
     * 查询需要立即处理的异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE a.severityLevel IN ('critical', '严重') " +
           "AND a.handleStatus IN ('待处理', '处理中') " +
           "ORDER BY a.detectionTime ASC")
    List<DataAnomalyRecord> findCriticalAnomalies();

    /**
     * 查询过期未处理的异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE a.detectionTime < :time " +
           "AND a.handleStatus IN ('待处理', '处理中') " +
           "ORDER BY a.detectionTime ASC")
    List<DataAnomalyRecord> findOverdueAnomalies(@Param("time") LocalDateTime time);

    /**
     * 查询误报记录
     */
    List<DataAnomalyRecord> findByFalsePositiveTrue();

    /**
     * 查询非误报记录
     */
    List<DataAnomalyRecord> findByFalsePositiveFalse();

    /**
     * 查询未通知的异常记录
     */
    List<DataAnomalyRecord> findByNotifiedFalse();

    /**
     * 查询已通知的异常记录
     */
    List<DataAnomalyRecord> findByNotifiedTrue();

    /**
     * 根据关联报告ID查询异常记录
     */
    List<DataAnomalyRecord> findByReportId(Long reportId);

    /**
     * 根据关联指标ID查询异常记录
     */
    List<DataAnomalyRecord> findByMetricId(Long metricId);

    /**
     * 统计各异常类型的数量
     */
    @Query("SELECT a.anomalyType, COUNT(a) FROM DataAnomalyRecord a GROUP BY a.anomalyType")
    List<Object[]> countByAnomalyType();

    /**
     * 统计各严重程度的数量
     */
    @Query("SELECT a.severityLevel, COUNT(a) FROM DataAnomalyRecord a GROUP BY a.severityLevel")
    List<Object[]> countBySeverityLevel();

    /**
     * 统计各数据源的异常数量
     */
    @Query("SELECT a.dataSource, COUNT(a) FROM DataAnomalyRecord a GROUP BY a.dataSource")
    List<Object[]> countByDataSource();

    /**
     * 统计各表的异常数量
     */
    @Query("SELECT a.dataSource, a.tableName, COUNT(a) FROM DataAnomalyRecord a " +
           "GROUP BY a.dataSource, a.tableName ORDER BY COUNT(a) DESC")
    List<Object[]> countByTable();

    /**
     * 统计各字段的异常数量
     */
    @Query("SELECT a.dataSource, a.tableName, a.fieldName, COUNT(a) FROM DataAnomalyRecord a " +
           "WHERE a.fieldName IS NOT NULL " +
           "GROUP BY a.dataSource, a.tableName, a.fieldName ORDER BY COUNT(a) DESC")
    List<Object[]> countByField();

    /**
     * 统计各处理状态的数量
     */
    @Query("SELECT a.handleStatus, COUNT(a) FROM DataAnomalyRecord a GROUP BY a.handleStatus")
    List<Object[]> countByHandleStatus();

    /**
     * 统计各检测算法的异常数量
     */
    @Query("SELECT a.detectionAlgorithm, COUNT(a) FROM DataAnomalyRecord a " +
           "WHERE a.detectionAlgorithm IS NOT NULL " +
           "GROUP BY a.detectionAlgorithm")
    List<Object[]> countByDetectionAlgorithm();

    /**
     * 查询异常趋势数据
     */
    @Query("SELECT DATE(a.detectionTime) as date, COUNT(a) as count, " +
           "AVG(a.anomalyScore) as avgScore, " +
           "SUM(CASE WHEN a.severityLevel IN ('critical', '严重') THEN 1 ELSE 0 END) as criticalCount " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.detectionTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(a.detectionTime) ORDER BY DATE(a.detectionTime)")
    List<Object[]> findAnomalyTrendByTimeBetween(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询数据源异常趋势
     */
    @Query("SELECT DATE(a.detectionTime) as date, COUNT(a) as count " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.dataSource = :dataSource AND a.detectionTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(a.detectionTime) ORDER BY DATE(a.detectionTime)")
    List<Object[]> findAnomalyTrendByDataSourceAndTimeBetween(
        @Param("dataSource") String dataSource,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询表异常趋势
     */
    @Query("SELECT DATE(a.detectionTime) as date, COUNT(a) as count " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.dataSource = :dataSource AND a.tableName = :tableName " +
           "AND a.detectionTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(a.detectionTime) ORDER BY DATE(a.detectionTime)")
    List<Object[]> findAnomalyTrendByTableAndTimeBetween(
        @Param("dataSource") String dataSource,
        @Param("tableName") String tableName,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询异常最多的表
     */
    @Query("SELECT a.dataSource, a.tableName, COUNT(a) as anomalyCount " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.detectionTime > :time " +
           "GROUP BY a.dataSource, a.tableName " +
           "ORDER BY anomalyCount DESC")
    List<Object[]> findMostAnomalousTablesAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询异常最多的字段
     */
    @Query("SELECT a.dataSource, a.tableName, a.fieldName, COUNT(a) as anomalyCount " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.fieldName IS NOT NULL AND a.detectionTime > :time " +
           "GROUP BY a.dataSource, a.tableName, a.fieldName " +
           "ORDER BY anomalyCount DESC")
    List<Object[]> findMostAnomalousFieldsAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询处理效率统计
     */
    @Query("SELECT a.handler, COUNT(a) as handledCount, " +
           "AVG(TIMESTAMPDIFF(HOUR, a.detectionTime, a.handleTime)) as avgHandleHours " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.handler IS NOT NULL AND a.handleTime IS NOT NULL " +
           "AND a.detectionTime > :time " +
           "GROUP BY a.handler")
    List<Object[]> findHandleEfficiencyStatsAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询误报率统计
     */
    @Query("SELECT a.detectionAlgorithm, " +
           "COUNT(a) as totalCount, " +
           "SUM(CASE WHEN a.falsePositive = true THEN 1 ELSE 0 END) as falsePositiveCount, " +
           "(SUM(CASE WHEN a.falsePositive = true THEN 1 ELSE 0 END) * 100.0 / COUNT(a)) as falsePositiveRate " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.detectionAlgorithm IS NOT NULL AND a.detectionTime > :time " +
           "GROUP BY a.detectionAlgorithm")
    List<Object[]> findFalsePositiveRateStatsAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询检测规则效果统计
     */
    @Query("SELECT a.detectionRule, COUNT(a) as detectionCount, " +
           "AVG(a.anomalyScore) as avgScore, AVG(a.confidence) as avgConfidence " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.detectionRule IS NOT NULL AND a.detectionTime > :time " +
           "GROUP BY a.detectionRule")
    List<Object[]> findDetectionRuleStatsAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询最近N条异常记录
     */
    List<DataAnomalyRecord> findTop10ByOrderByDetectionTimeDesc();

    /**
     * 查询指定数据源和表的最近N条异常记录
     */
    List<DataAnomalyRecord> findTop10ByDataSourceAndTableNameOrderByDetectionTimeDesc(
        String dataSource, String tableName);

    /**
     * 查询指定严重程度的最近N条异常记录
     */
    List<DataAnomalyRecord> findTop10BySeverityLevelOrderByDetectionTimeDesc(String severityLevel);

    /**
     * 查询重复异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE EXISTS (" +
           "SELECT 1 FROM DataAnomalyRecord a2 WHERE a2.dataSource = a.dataSource " +
           "AND a2.tableName = a.tableName AND a2.fieldName = a.fieldName " +
           "AND a2.anomalyType = a.anomalyType AND a2.anomalyValue = a.anomalyValue " +
           "AND a2.id != a.id AND a2.detectionTime > a.detectionTime)")
    List<DataAnomalyRecord> findDuplicateAnomalies();

    /**
     * 查询相似异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE a.dataSource = :dataSource " +
           "AND a.tableName = :tableName AND a.fieldName = :fieldName " +
           "AND a.anomalyType = :anomalyType AND a.id != :excludeId " +
           "ORDER BY a.detectionTime DESC")
    List<DataAnomalyRecord> findSimilarAnomalies(
        @Param("dataSource") String dataSource,
        @Param("tableName") String tableName,
        @Param("fieldName") String fieldName,
        @Param("anomalyType") String anomalyType,
        @Param("excludeId") Long excludeId);

    /**
     * 删除指定时间之前的历史记录
     */
    void deleteByDetectionTimeBefore(LocalDateTime time);

    /**
     * 查询需要清理的历史记录数量
     */
    @Query("SELECT COUNT(a) FROM DataAnomalyRecord a WHERE a.detectionTime < :time")
    Long countByDetectionTimeBefore(@Param("time") LocalDateTime time);

    /**
     * 检查是否存在指定条件的异常记录
     */
    boolean existsByDataSourceAndTableNameAndDetectionTimeAfter(
        String dataSource, String tableName, LocalDateTime time);

    /**
     * 检查异常编号是否存在
     */
    boolean existsByAnomalyCode(String anomalyCode);

    /**
     * 查询创建人的异常记录
     */
    List<DataAnomalyRecord> findByCreatedBy(String createdBy);

    /**
     * 查询包含指定描述的异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE a.description LIKE %:keyword%")
    List<DataAnomalyRecord> findByDescriptionContaining(@Param("keyword") String keyword);

    /**
     * 查询包含指定根本原因的异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE a.rootCause LIKE %:keyword%")
    List<DataAnomalyRecord> findByRootCauseContaining(@Param("keyword") String keyword);

    /**
     * 查询包含指定影响范围的异常记录
     */
    @Query("SELECT a FROM DataAnomalyRecord a WHERE a.impactScope LIKE %:keyword%")
    List<DataAnomalyRecord> findByImpactScopeContaining(@Param("keyword") String keyword);

    /**
     * 查询月度异常统计
     */
    @Query("SELECT YEAR(a.detectionTime) as year, MONTH(a.detectionTime) as month, " +
           "COUNT(a) as anomalyCount, AVG(a.anomalyScore) as avgScore " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.detectionTime BETWEEN :startTime AND :endTime " +
           "GROUP BY YEAR(a.detectionTime), MONTH(a.detectionTime) " +
           "ORDER BY year, month")
    List<Object[]> findMonthlyAnomalyStats(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询周度异常统计
     */
    @Query("SELECT YEAR(a.detectionTime) as year, WEEK(a.detectionTime) as week, " +
           "COUNT(a) as anomalyCount, AVG(a.anomalyScore) as avgScore " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.detectionTime BETWEEN :startTime AND :endTime " +
           "GROUP BY YEAR(a.detectionTime), WEEK(a.detectionTime) " +
           "ORDER BY year, week")
    List<Object[]> findWeeklyAnomalyStats(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询日度异常统计
     */
    @Query("SELECT DATE(a.detectionTime) as date, COUNT(a) as anomalyCount, AVG(a.anomalyScore) as avgScore " +
           "FROM DataAnomalyRecord a " +
           "WHERE a.detectionTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(a.detectionTime) " +
           "ORDER BY date")
    List<Object[]> findDailyAnomalyStats(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);
}