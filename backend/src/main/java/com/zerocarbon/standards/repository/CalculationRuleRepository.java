package com.zerocarbon.standards.repository;

import com.zerocarbon.standards.entity.CalculationRule;
import com.zerocarbon.standards.entity.Standard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 计算规则数据访问层
 */
@Repository
public interface CalculationRuleRepository extends JpaRepository<CalculationRule, Long> {

    /**
     * 根据标准和状态查找计算规则
     */
    List<CalculationRule> findByStandardAndStatus(Standard standard, String status);

    /**
     * 根据规则代码查找计算规则
     */
    Optional<CalculationRule> findByRuleCode(String ruleCode);

    /**
     * 根据计算类型查找计算规则
     */
    List<CalculationRule> findByCalculationTypeAndStatus(String calculationType, String status);

    /**
     * 根据标准代码查找计算规则
     */
    @Query("SELECT cr FROM CalculationRule cr JOIN cr.standard s WHERE s.code = :standardCode AND cr.status = :status")
    List<CalculationRule> findByStandardCodeAndStatus(@Param("standardCode") String standardCode, @Param("status") String status);

    /**
     * 根据优先级排序查找计算规则
     */
    List<CalculationRule> findByStandardAndStatusOrderByPriorityDesc(Standard standard, String status);

    /**
     * 根据版本查找计算规则
     */
    List<CalculationRule> findByVersionAndStatus(String version, String status);

    /**
     * 查找指定标准的所有计算类型
     */
    @Query("SELECT DISTINCT cr.calculationType FROM CalculationRule cr WHERE cr.standard = :standard AND cr.status = 'active'")
    List<String> findDistinctCalculationTypesByStandard(@Param("standard") Standard standard);

    /**
     * 统计各计算类型的规则数量
     */
    @Query("SELECT cr.calculationType, COUNT(cr) FROM CalculationRule cr WHERE cr.status = 'active' GROUP BY cr.calculationType")
    List<Object[]> countRulesByCalculationType();

    /**
     * 查找需要更新的计算规则
     */
    @Query("SELECT cr FROM CalculationRule cr WHERE cr.updateTime < :cutoffDate AND cr.status = 'active'")
    List<CalculationRule> findRulesNeedingUpdate(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);

    /**
     * 根据规则名称模糊查找
     */
    @Query("SELECT cr FROM CalculationRule cr WHERE (cr.ruleName LIKE %:name% OR cr.ruleCode LIKE %:name%) AND cr.status = 'active'")
    List<CalculationRule> findByNameContaining(@Param("name") String name);
}