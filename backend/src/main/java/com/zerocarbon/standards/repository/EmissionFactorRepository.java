package com.zerocarbon.standards.repository;

import com.zerocarbon.standards.entity.EmissionFactor;
import com.zerocarbon.standards.entity.Standard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 排放因子数据访问层
 */
@Repository
public interface EmissionFactorRepository extends JpaRepository<EmissionFactor, Long> {

    /**
     * 根据标准和因子代码查找排放因子
     */
    Optional<EmissionFactor> findByStandardAndFactorCode(Standard standard, String factorCode);

    /**
     * 根据标准和状态查找排放因子
     */
    List<EmissionFactor> findByStandardAndStatus(Standard standard, String status);

    /**
     * 根据能源类型和状态查找排放因子
     */
    List<EmissionFactor> findByEnergyTypeAndStatus(String energyType, String status);

    /**
     * 根据因子代码和状态查找最新的排放因子
     */
    Optional<EmissionFactor> findTopByFactorCodeAndStatusOrderByEffectiveDateDesc(String factorCode, String status);

    /**
     * 根据温室气体类型查找排放因子
     */
    List<EmissionFactor> findByGasTypeAndStatus(String gasType, String status);

    /**
     * 根据状态统计排放因子数量
     */
    long countByStatus(String status);

    /**
     * 根据能源类型统计排放因子数量
     */
    @Query("SELECT ef.energyType, COUNT(ef) FROM EmissionFactor ef WHERE ef.status = 'active' GROUP BY ef.energyType")
    List<Object[]> countFactorsByEnergyType();

    /**
     * 查找指定日期范围内生效的排放因子
     */
    @Query("SELECT ef FROM EmissionFactor ef WHERE ef.status = 'active' AND " +
           "(ef.effectiveDate IS NULL OR ef.effectiveDate <= :date) AND " +
           "(ef.expiryDate IS NULL OR ef.expiryDate > :date)")
    List<EmissionFactor> findValidFactorsAtDate(@Param("date") LocalDateTime date);

    /**
     * 查找即将过期的排放因子
     */
    @Query("SELECT ef FROM EmissionFactor ef WHERE ef.status = 'active' AND " +
           "ef.expiryDate IS NOT NULL AND ef.expiryDate BETWEEN :startDate AND :endDate")
    List<EmissionFactor> findFactorsExpiringBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);

    /**
     * 根据适用范围查找排放因子
     */
    @Query("SELECT ef FROM EmissionFactor ef WHERE ef.applicableScope LIKE %:scope% AND ef.status = 'active'")
    List<EmissionFactor> findByApplicableScope(@Param("scope") String scope);

    /**
     * 查找指定不确定性范围内的排放因子
     */
    @Query("SELECT ef FROM EmissionFactor ef WHERE ef.uncertainty <= :maxUncertainty AND ef.status = 'active'")
    List<EmissionFactor> findByUncertaintyLessThanEqual(@Param("maxUncertainty") java.math.BigDecimal maxUncertainty);

    /**
     * 根据数据来源查找排放因子
     */
    List<EmissionFactor> findByDataSourceAndStatus(String dataSource, String status);

    /**
     * 查找需要更新的排放因子（超过指定天数未更新）
     */
    @Query("SELECT ef FROM EmissionFactor ef WHERE ef.updateTime < :cutoffDate AND ef.status = 'active'")
    List<EmissionFactor> findFactorsNeedingUpdate(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * 根据标准类型统计排放因子
     */
    @Query("SELECT s.type, COUNT(ef) FROM EmissionFactor ef JOIN ef.standard s WHERE ef.status = 'active' GROUP BY s.type")
    List<Object[]> countFactorsByStandardType();

    /**
     * 查找重复的排放因子（相同因子代码但不同标准）
     */
    @Query("SELECT ef.factorCode, COUNT(ef) FROM EmissionFactor ef WHERE ef.status = 'active' GROUP BY ef.factorCode HAVING COUNT(ef) > 1")
    List<Object[]> findDuplicateFactorCodes();

    /**
     * 根据因子名称模糊查找
     */
    @Query("SELECT ef FROM EmissionFactor ef WHERE (ef.factorName LIKE %:name% OR ef.factorCode LIKE %:name%) AND ef.status = 'active'")
    List<EmissionFactor> findByNameContaining(@Param("name") String name);
}