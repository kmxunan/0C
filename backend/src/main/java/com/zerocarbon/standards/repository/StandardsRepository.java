package com.zerocarbon.standards.repository;

import com.zerocarbon.standards.entity.Standard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 标准数据访问层
 */
@Repository
public interface StandardsRepository extends JpaRepository<Standard, Long> {

    /**
     * 根据标准代码查找标准
     */
    Optional<Standard> findByCode(String code);

    /**
     * 根据状态查找标准
     */
    List<Standard> findByStatus(String status);

    /**
     * 根据类型查找标准
     */
    List<Standard> findByType(String type);

    /**
     * 根据类型和状态查找标准
     */
    List<Standard> findByTypeAndStatus(String type, String status);

    /**
     * 根据适用行业查找标准
     */
    @Query("SELECT s FROM Standard s WHERE s.applicableIndustries LIKE %:industry%")
    List<Standard> findByApplicableIndustry(@Param("industry") String industry);

    /**
     * 查找指定日期之后发布的标准
     */
    List<Standard> findByReleaseDateAfter(LocalDateTime date);

    /**
     * 查找指定日期之后更新的标准
     */
    List<Standard> findByUpdateTimeAfter(LocalDateTime date);

    /**
     * 根据发布机构查找标准
     */
    List<Standard> findByIssuingAuthority(String authority);

    /**
     * 查找活跃的国家标准
     */
    @Query("SELECT s FROM Standard s WHERE s.type = 'national' AND s.status = 'active' ORDER BY s.releaseDate DESC")
    List<Standard> findActiveNationalStandards();

    /**
     * 查找活跃的行业标准
     */
    @Query("SELECT s FROM Standard s WHERE s.type = 'industry' AND s.status = 'active' ORDER BY s.releaseDate DESC")
    List<Standard> findActiveIndustryStandards();

    /**
     * 查找活跃的国际标准
     */
    @Query("SELECT s FROM Standard s WHERE s.type = 'international' AND s.status = 'active' ORDER BY s.releaseDate DESC")
    List<Standard> findActiveInternationalStandards();

    /**
     * 根据名称模糊查找标准
     */
    @Query("SELECT s FROM Standard s WHERE s.name LIKE %:name% OR s.code LIKE %:name%")
    List<Standard> findByNameContaining(@Param("name") String name);

    /**
     * 查找需要更新的标准（超过指定天数未更新）
     */
    @Query("SELECT s FROM Standard s WHERE s.updateTime < :cutoffDate AND s.status = 'active'")
    List<Standard> findStandardsNeedingUpdate(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * 统计各类型标准数量
     */
    @Query("SELECT s.type, COUNT(s) FROM Standard s WHERE s.status = 'active' GROUP BY s.type")
    List<Object[]> countStandardsByType();

    /**
     * 查找被替代的标准
     */
    @Query("SELECT s FROM Standard s WHERE s.replacedByStandard IS NOT NULL")
    List<Standard> findReplacedStandards();

    /**
     * 查找替代其他标准的标准
     */
    @Query("SELECT s FROM Standard s WHERE s.replacesStandard IS NOT NULL")
    List<Standard> findReplacingStandards();
}