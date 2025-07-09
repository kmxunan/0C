package com.zerocarbon.standards.service;

import com.zerocarbon.standards.entity.EmissionFactor;
import com.zerocarbon.standards.entity.Standard;
import com.zerocarbon.standards.repository.EmissionFactorRepository;
import com.zerocarbon.standards.repository.StandardsRepository;
import com.zerocarbon.standards.dto.StandardVersion;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 排放因子服务
 */
@Slf4j
@Service
public class EmissionFactorService {

    private final EmissionFactorRepository emissionFactorRepository;
    private final StandardsRepository standardsRepository;

    public EmissionFactorService(
            EmissionFactorRepository emissionFactorRepository,
            StandardsRepository standardsRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
        this.standardsRepository = standardsRepository;
    }

    /**
     * 根据标准更新排放因子
     */
    @Transactional
    public void updateFactorsByStandard(String standardCode, StandardVersion version) {
        log.info("开始更新标准 {} 的排放因子", standardCode);
        
        Optional<Standard> standardOpt = standardsRepository.findByCode(standardCode);
        if (standardOpt.isEmpty()) {
            log.warn("未找到标准: {}", standardCode);
            return;
        }
        
        Standard standard = standardOpt.get();
        
        // 根据不同标准更新对应的排放因子
        switch (standardCode) {
            case "GB/T 32150-2015":
                updateNationalEmissionFactors(standard);
                break;
            case "HJ 944-2018":
                updateIndustryEmissionFactors(standard);
                break;
            case "ISO 14064-1:2018":
                updateInternationalEmissionFactors(standard);
                break;
            default:
                updateGenericEmissionFactors(standard);
                break;
        }
        
        log.info("标准 {} 的排放因子更新完成", standardCode);
    }

    /**
     * 更新国家标准排放因子
     */
    private void updateNationalEmissionFactors(Standard standard) {
        List<EmissionFactor> factors = Arrays.asList(
            // 电力排放因子
            createEmissionFactor(standard, "EF_ELEC_GRID", "电网平均排放因子", "电力", 
                new BigDecimal("0.5703"), "tCO2/MWh", "CO2", "全国电网平均"),
            
            // 燃料排放因子
            createEmissionFactor(standard, "EF_COAL", "原煤排放因子", "煤炭", 
                new BigDecimal("1.9003"), "tCO2/t", "CO2", "原煤燃烧"),
            
            createEmissionFactor(standard, "EF_GASOLINE", "汽油排放因子", "汽油", 
                new BigDecimal("2.9251"), "tCO2/t", "CO2", "汽油燃烧"),
            
            createEmissionFactor(standard, "EF_DIESEL", "柴油排放因子", "柴油", 
                new BigDecimal("3.0959"), "tCO2/t", "CO2", "柴油燃烧"),
            
            createEmissionFactor(standard, "EF_NATURAL_GAS", "天然气排放因子", "天然气", 
                new BigDecimal("2.1622"), "tCO2/千m³", "CO2", "天然气燃烧"),
            
            // 工业过程排放因子
            createEmissionFactor(standard, "EF_CEMENT", "水泥生产排放因子", "水泥", 
                new BigDecimal("0.5383"), "tCO2/t", "CO2", "水泥生产过程"),
            
            createEmissionFactor(standard, "EF_STEEL", "钢铁生产排放因子", "钢铁", 
                new BigDecimal("2.07"), "tCO2/t", "CO2", "钢铁生产过程")
        );
        
        saveEmissionFactors(factors);
    }

    /**
     * 更新行业标准排放因子
     */
    private void updateIndustryEmissionFactors(Standard standard) {
        List<EmissionFactor> factors = Arrays.asList(
            // 园区特定排放因子
            createEmissionFactor(standard, "EF_PARK_ELEC", "园区电力排放因子", "电力", 
                new BigDecimal("0.4856"), "tCO2/MWh", "CO2", "园区内部电网"),
            
            createEmissionFactor(standard, "EF_WASTE_TREATMENT", "废物处理排放因子", "废物处理", 
                new BigDecimal("0.3"), "tCO2/t", "CO2", "固废处理过程"),
            
            createEmissionFactor(standard, "EF_WASTEWATER", "污水处理排放因子", "污水处理", 
                new BigDecimal("0.489"), "tCO2/t", "CH4", "污水处理过程")
        );
        
        saveEmissionFactors(factors);
    }

    /**
     * 更新国际标准排放因子
     */
    private void updateInternationalEmissionFactors(Standard standard) {
        List<EmissionFactor> factors = Arrays.asList(
            // 国际通用排放因子
            createEmissionFactor(standard, "EF_SCOPE2_ELEC", "Scope2电力排放因子", "电力", 
                new BigDecimal("0.5"), "tCO2/MWh", "CO2", "Scope2间接排放"),
            
            createEmissionFactor(standard, "EF_SCOPE3_TRANSPORT", "Scope3运输排放因子", "运输", 
                new BigDecimal("0.21"), "tCO2/t·km", "CO2", "Scope3其他间接排放")
        );
        
        saveEmissionFactors(factors);
    }

    /**
     * 更新通用排放因子
     */
    private void updateGenericEmissionFactors(Standard standard) {
        List<EmissionFactor> factors = Arrays.asList(
            createEmissionFactor(standard, "EF_GENERIC_ELEC", "通用电力排放因子", "电力", 
                new BigDecimal("0.6"), "tCO2/MWh", "CO2", "通用电力消费")
        );
        
        saveEmissionFactors(factors);
    }

    /**
     * 创建排放因子
     */
    private EmissionFactor createEmissionFactor(Standard standard, String factorCode, 
            String factorName, String energyType, BigDecimal factorValue, 
            String unit, String gasType, String applicableScope) {
        return EmissionFactor.builder()
            .standard(standard)
            .factorCode(factorCode)
            .factorName(factorName)
            .energyType(energyType)
            .factorValue(factorValue)
            .unit(unit)
            .gasType(gasType)
            .applicableScope(applicableScope)
            .dataSource("国家发改委/生态环境部")
            .uncertainty(new BigDecimal("0.05"))
            .effectiveDate(LocalDateTime.now())
            .status("active")
            .build();
    }

    /**
     * 批量保存排放因子
     */
    @Transactional
    public void saveEmissionFactors(List<EmissionFactor> factors) {
        for (EmissionFactor factor : factors) {
            // 检查是否已存在相同的排放因子
            Optional<EmissionFactor> existing = emissionFactorRepository
                .findByStandardAndFactorCode(factor.getStandard(), factor.getFactorCode());
            
            if (existing.isPresent()) {
                // 更新现有排放因子
                EmissionFactor existingFactor = existing.get();
                existingFactor.setFactorValue(factor.getFactorValue());
                existingFactor.setUnit(factor.getUnit());
                existingFactor.setUncertainty(factor.getUncertainty());
                existingFactor.setEffectiveDate(factor.getEffectiveDate());
                emissionFactorRepository.save(existingFactor);
            } else {
                // 创建新的排放因子
                emissionFactorRepository.save(factor);
            }
        }
    }

    /**
     * 获取指定标准的排放因子
     */
    public List<EmissionFactor> getFactorsByStandard(String standardCode) {
        Optional<Standard> standard = standardsRepository.findByCode(standardCode);
        if (standard.isPresent()) {
            return emissionFactorRepository.findByStandardAndStatus(standard.get(), "active");
        }
        return Collections.emptyList();
    }

    /**
     * 根据能源类型获取排放因子
     */
    public List<EmissionFactor> getFactorsByEnergyType(String energyType) {
        return emissionFactorRepository.findByEnergyTypeAndStatus(energyType, "active");
    }

    /**
     * 获取最新的排放因子
     */
    public Optional<EmissionFactor> getLatestFactor(String factorCode) {
        return emissionFactorRepository.findTopByFactorCodeAndStatusOrderByEffectiveDateDesc(
            factorCode, "active");
    }

    /**
     * 验证排放因子数据完整性
     */
    public boolean validateFactorData(EmissionFactor factor) {
        return factor.getFactorValue() != null && 
               factor.getFactorValue().compareTo(BigDecimal.ZERO) > 0 &&
               factor.getUnit() != null && !factor.getUnit().trim().isEmpty() &&
               factor.getGasType() != null && !factor.getGasType().trim().isEmpty();
    }

    /**
     * 获取排放因子统计信息
     */
    public Map<String, Object> getFactorStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalFactors = emissionFactorRepository.count();
        long activeFactors = emissionFactorRepository.countByStatus("active");
        
        List<Object[]> factorsByType = emissionFactorRepository.countFactorsByEnergyType();
        Map<String, Long> typeStats = new HashMap<>();
        for (Object[] row : factorsByType) {
            typeStats.put((String) row[0], (Long) row[1]);
        }
        
        stats.put("totalFactors", totalFactors);
        stats.put("activeFactors", activeFactors);
        stats.put("factorsByType", typeStats);
        stats.put("lastUpdateTime", LocalDateTime.now());
        
        return stats;
    }
}