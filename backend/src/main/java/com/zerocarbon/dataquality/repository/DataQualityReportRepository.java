package com.zerocarbon.dataquality.repository;

import com.zerocarbon.dataquality.entity.DataQualityReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 数据质量报告数据访问层
 */
@Repository
public interface DataQualityReportRepository extends JpaRepository<DataQualityReport, Long> {

    /**
     * 根据报告编号查询报告
     */
    Optional<DataQualityReport> findByReportCode(String reportCode);

    /**
     * 根据数据源和表名查询报告
     */
    List<DataQualityReport> findByDataSourceAndTableName(String dataSource, String tableName);

    /**
     * 根据数据源查询报告
     */
    List<DataQualityReport> findByDataSource(String dataSource);

    /**
     * 根据表名查询报告
     */
    List<DataQualityReport> findByTableName(String tableName);

    /**
     * 根据质量等级查询报告
     */
    List<DataQualityReport> findByQualityLevel(String qualityLevel);

    /**
     * 根据报告类型查询报告
     */
    List<DataQualityReport> findByReportType(String reportType);

    /**
     * 根据报告状态查询报告
     */
    List<DataQualityReport> findByReportStatus(String reportStatus);

    /**
     * 根据审核状态查询报告
     */
    List<DataQualityReport> findByReviewStatus(String reviewStatus);

    /**
     * 根据检查状态查询报告
     */
    List<DataQualityReport> findByCheckStatus(String checkStatus);

    /**
     * 根据综合评分范围查询报告
     */
    List<DataQualityReport> findByOverallScoreBetween(Double minScore, Double maxScore);

    /**
     * 根据创建时间范围查询报告
     */
    List<DataQualityReport> findByCreateTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据数据源和创建时间范围查询报告
     */
    List<DataQualityReport> findByDataSourceAndCreateTimeBetween(
        String dataSource, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据检查时间范围查询报告
     */
    List<DataQualityReport> findByCheckStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查询最新的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.dataSource = :dataSource AND r.tableName = :tableName " +
           "ORDER BY r.createTime DESC")
    List<DataQualityReport> findLatestByDataSourceAndTableName(
        @Param("dataSource") String dataSource, @Param("tableName") String tableName);

    /**
     * 查询最新的报告（单条）
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.dataSource = :dataSource AND r.tableName = :tableName " +
           "ORDER BY r.createTime DESC LIMIT 1")
    Optional<DataQualityReport> findLatestOneByDataSourceAndTableName(
        @Param("dataSource") String dataSource, @Param("tableName") String tableName);

    /**
     * 查询需要告警的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.overallScore < :threshold " +
           "AND r.createTime > :time ORDER BY r.overallScore ASC")
    List<DataQualityReport> findAlertsAfterTime(
        @Param("threshold") Double threshold, @Param("time") LocalDateTime time);

    /**
     * 查询未发送通知的报告
     */
    List<DataQualityReport> findByNotificationSentFalse();

    /**
     * 查询需要审核的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.reviewStatus = '待审核' " +
           "ORDER BY r.createTime ASC")
    List<DataQualityReport> findPendingReview();

    /**
     * 查询已审核的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.reviewStatus IN ('已审核', '审核通过', '审核拒绝') " +
           "ORDER BY r.reviewTime DESC")
    List<DataQualityReport> findReviewed();

    /**
     * 查询指定审核人的报告
     */
    List<DataQualityReport> findByReviewer(String reviewer);

    /**
     * 查询异常数量超过阈值的报告
     */
    List<DataQualityReport> findByAnomalyCountGreaterThan(Integer threshold);

    /**
     * 查询检查耗时超过阈值的报告
     */
    List<DataQualityReport> findByCheckDurationMsGreaterThan(Long threshold);

    /**
     * 统计各质量等级的报告数量
     */
    @Query("SELECT r.qualityLevel, COUNT(r) FROM DataQualityReport r GROUP BY r.qualityLevel")
    List<Object[]> countByQualityLevel();

    /**
     * 统计各数据源的报告数量
     */
    @Query("SELECT r.dataSource, COUNT(r) FROM DataQualityReport r GROUP BY r.dataSource")
    List<Object[]> countByDataSource();

    /**
     * 统计各报告类型的数量
     */
    @Query("SELECT r.reportType, COUNT(r) FROM DataQualityReport r GROUP BY r.reportType")
    List<Object[]> countByReportType();

    /**
     * 统计各报告状态的数量
     */
    @Query("SELECT r.reportStatus, COUNT(r) FROM DataQualityReport r GROUP BY r.reportStatus")
    List<Object[]> countByReportStatus();

    /**
     * 查询指定时间段内的平均质量评分
     */
    @Query("SELECT AVG(r.overallScore) FROM DataQualityReport r " +
           "WHERE r.dataSource = :dataSource AND r.tableName = :tableName " +
           "AND r.createTime BETWEEN :startTime AND :endTime")
    Double findAverageScoreByDataSourceAndTableNameAndTimeBetween(
        @Param("dataSource") String dataSource, 
        @Param("tableName") String tableName,
        @Param("startTime") LocalDateTime startTime, 
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询指定数据源的平均质量评分
     */
    @Query("SELECT AVG(r.overallScore) FROM DataQualityReport r WHERE r.dataSource = :dataSource")
    Double findAverageScoreByDataSource(@Param("dataSource") String dataSource);

    /**
     * 查询所有报告的平均质量评分
     */
    @Query("SELECT AVG(r.overallScore) FROM DataQualityReport r")
    Double findOverallAverageScore();

    /**
     * 查询质量趋势数据
     */
    @Query("SELECT DATE(r.createTime) as date, AVG(r.overallScore) as avgScore, " +
           "AVG(r.completenessScore) as avgCompleteness, AVG(r.accuracyScore) as avgAccuracy, " +
           "AVG(r.consistencyScore) as avgConsistency, COUNT(r) as count " +
           "FROM DataQualityReport r " +
           "WHERE r.dataSource = :dataSource AND r.tableName = :tableName " +
           "AND r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(r.createTime) ORDER BY DATE(r.createTime)")
    List<Object[]> findQualityTrendByDataSourceAndTableNameAndTimeBetween(
        @Param("dataSource") String dataSource,
        @Param("tableName") String tableName,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询数据源质量趋势
     */
    @Query("SELECT DATE(r.createTime) as date, AVG(r.overallScore) as avgScore, COUNT(r) as count " +
           "FROM DataQualityReport r " +
           "WHERE r.dataSource = :dataSource AND r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(r.createTime) ORDER BY DATE(r.createTime)")
    List<Object[]> findQualityTrendByDataSourceAndTimeBetween(
        @Param("dataSource") String dataSource,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询整体质量趋势
     */
    @Query("SELECT DATE(r.createTime) as date, AVG(r.overallScore) as avgScore, COUNT(r) as count " +
           "FROM DataQualityReport r " +
           "WHERE r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(r.createTime) ORDER BY DATE(r.createTime)")
    List<Object[]> findOverallQualityTrendByTimeBetween(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询质量最差的表
     */
    @Query("SELECT r.dataSource, r.tableName, AVG(r.overallScore) as avgScore " +
           "FROM DataQualityReport r " +
           "WHERE r.createTime > :time " +
           "GROUP BY r.dataSource, r.tableName " +
           "ORDER BY avgScore ASC")
    List<Object[]> findWorstQualityTablesAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询质量最好的表
     */
    @Query("SELECT r.dataSource, r.tableName, AVG(r.overallScore) as avgScore " +
           "FROM DataQualityReport r " +
           "WHERE r.createTime > :time " +
           "GROUP BY r.dataSource, r.tableName " +
           "ORDER BY avgScore DESC")
    List<Object[]> findBestQualityTablesAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询异常最多的表
     */
    @Query("SELECT r.dataSource, r.tableName, SUM(r.anomalyCount) as totalAnomalies " +
           "FROM DataQualityReport r " +
           "WHERE r.createTime > :time AND r.anomalyCount IS NOT NULL " +
           "GROUP BY r.dataSource, r.tableName " +
           "ORDER BY totalAnomalies DESC")
    List<Object[]> findMostAnomalousTablesAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询检查耗时统计
     */
    @Query("SELECT r.dataSource, r.tableName, AVG(r.checkDurationMs) as avgDuration, " +
           "MIN(r.checkDurationMs) as minDuration, MAX(r.checkDurationMs) as maxDuration " +
           "FROM DataQualityReport r " +
           "WHERE r.checkDurationMs IS NOT NULL AND r.createTime > :time " +
           "GROUP BY r.dataSource, r.tableName")
    List<Object[]> findCheckDurationStatsAfterTime(@Param("time") LocalDateTime time);

    /**
     * 查询需要下次检查的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.nextCheckTime <= :time " +
           "ORDER BY r.nextCheckTime ASC")
    List<DataQualityReport> findDueForCheck(@Param("time") LocalDateTime time);

    /**
     * 查询过期未处理的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.overallScore < :threshold " +
           "AND r.createTime < :time AND r.reportStatus NOT IN ('已处理', '已关闭') " +
           "ORDER BY r.createTime ASC")
    List<DataQualityReport> findOverdueReports(
        @Param("threshold") Double threshold, @Param("time") LocalDateTime time);

    /**
     * 查询创建人的报告
     */
    List<DataQualityReport> findByCreatedBy(String createdBy);

    /**
     * 查询更新人的报告
     */
    List<DataQualityReport> findByUpdatedBy(String updatedBy);

    /**
     * 查询包含指定问题的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.issues LIKE %:issue%")
    List<DataQualityReport> findByIssuesContaining(@Param("issue") String issue);

    /**
     * 查询包含指定建议的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.suggestions LIKE %:suggestion%")
    List<DataQualityReport> findBySuggestionsContaining(@Param("suggestion") String suggestion);

    /**
     * 查询包含指定摘要内容的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.summary LIKE %:keyword%")
    List<DataQualityReport> findBySummaryContaining(@Param("keyword") String keyword);

    /**
     * 查询包含指定标题的报告
     */
    @Query("SELECT r FROM DataQualityReport r WHERE r.title LIKE %:title%")
    List<DataQualityReport> findByTitleContaining(@Param("title") String title);

    /**
     * 查询指定检查类型的报告
     */
    List<DataQualityReport> findByCheckType(String checkType);

    /**
     * 查询指定规则版本的报告
     */
    List<DataQualityReport> findByRuleVersion(String ruleVersion);

    /**
     * 删除指定时间之前的历史报告
     */
    void deleteByCreateTimeBefore(LocalDateTime time);

    /**
     * 查询需要清理的历史报告数量
     */
    @Query("SELECT COUNT(r) FROM DataQualityReport r WHERE r.createTime < :time")
    Long countByCreateTimeBefore(@Param("time") LocalDateTime time);

    /**
     * 查询最近N条报告
     */
    List<DataQualityReport> findTop10ByOrderByCreateTimeDesc();

    /**
     * 查询指定数据源和表的最近N条报告
     */
    List<DataQualityReport> findTop10ByDataSourceAndTableNameOrderByCreateTimeDesc(
        String dataSource, String tableName);

    /**
     * 检查是否存在指定条件的报告
     */
    boolean existsByDataSourceAndTableNameAndCreateTimeAfter(
        String dataSource, String tableName, LocalDateTime time);

    /**
     * 检查报告编号是否存在
     */
    boolean existsByReportCode(String reportCode);

    /**
     * 查询月度报告统计
     */
    @Query("SELECT YEAR(r.createTime) as year, MONTH(r.createTime) as month, " +
           "COUNT(r) as reportCount, AVG(r.overallScore) as avgScore " +
           "FROM DataQualityReport r " +
           "WHERE r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY YEAR(r.createTime), MONTH(r.createTime) " +
           "ORDER BY year, month")
    List<Object[]> findMonthlyReportStats(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询周度报告统计
     */
    @Query("SELECT YEAR(r.createTime) as year, WEEK(r.createTime) as week, " +
           "COUNT(r) as reportCount, AVG(r.overallScore) as avgScore " +
           "FROM DataQualityReport r " +
           "WHERE r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY YEAR(r.createTime), WEEK(r.createTime) " +
           "ORDER BY year, week")
    List<Object[]> findWeeklyReportStats(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    /**
     * 查询日度报告统计
     */
    @Query("SELECT DATE(r.createTime) as date, COUNT(r) as reportCount, AVG(r.overallScore) as avgScore " +
           "FROM DataQualityReport r " +
           "WHERE r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(r.createTime) " +
           "ORDER BY date")
    List<Object[]> findDailyReportStats(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);
}