package com.zerocarbon.standards.controller;

import com.zerocarbon.standards.StandardsManagementService;
import com.zerocarbon.standards.dto.StandardComparisonResult;
import com.zerocarbon.standards.dto.StandardComplianceResult;
import com.zerocarbon.standards.entity.EmissionFactor;
import com.zerocarbon.standards.entity.Standard;
import com.zerocarbon.standards.service.EmissionFactorService;
import com.zerocarbon.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 标准管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/standards")
@Tag(name = "标准管理", description = "国家标准跟踪更新和行业标准扩展API")
public class StandardsController {

    @Autowired
    private StandardsManagementService standardsManagementService;

    @Autowired
    private EmissionFactorService emissionFactorService;

    /**
     * 获取支持的标准列表
     */
    @GetMapping
    @Operation(summary = "获取支持的标准列表", description = "获取系统支持的所有活跃标准")
    public ResponseEntity<ApiResponse<List<Standard>>> getSupportedStandards(
            @Parameter(description = "标准类型") @RequestParam(required = false) String type,
            @Parameter(description = "适用行业") @RequestParam(required = false) String industry) {
        
        try {
            List<Standard> standards;
            
            if (type != null && !type.isEmpty()) {
                standards = standardsManagementService.getStandardsByType(type);
            } else if (industry != null && !industry.isEmpty()) {
                standards = standardsManagementService.getStandardsByIndustry(industry);
            } else {
                standards = standardsManagementService.getSupportedStandards();
            }
            
            return ResponseEntity.ok(ApiResponse.success(standards));
        } catch (Exception e) {
            log.error("获取标准列表失败", e);
            return ResponseEntity.ok(ApiResponse.error("获取标准列表失败: " + e.getMessage()));
        }
    }

    /**
     * 获取标准详情
     */
    @GetMapping("/{standardCode}")
    @Operation(summary = "获取标准详情", description = "根据标准代码获取详细信息")
    public ResponseEntity<ApiResponse<Standard>> getStandardDetails(
            @Parameter(description = "标准代码", example = "GB/T 32150-2015") @PathVariable String standardCode) {
        
        try {
            Optional<Standard> standard = standardsManagementService.getStandardDetails(standardCode);
            
            if (standard.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success(standard.get()));
            } else {
                return ResponseEntity.ok(ApiResponse.error("标准不存在: " + standardCode));
            }
        } catch (Exception e) {
            log.error("获取标准详情失败: {}", standardCode, e);
            return ResponseEntity.ok(ApiResponse.error("获取标准详情失败: " + e.getMessage()));
        }
    }

    /**
     * 验证数据合规性
     */
    @PostMapping("/{standardCode}/validate")
    @Operation(summary = "验证数据合规性", description = "验证提供的数据是否符合指定标准")
    public ResponseEntity<ApiResponse<StandardComplianceResult>> validateCompliance(
            @Parameter(description = "标准代码") @PathVariable String standardCode,
            @Parameter(description = "待验证的数据") @RequestBody Map<String, Object> data) {
        
        try {
            StandardComplianceResult result = standardsManagementService.validateCompliance(standardCode, data);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("验证合规性失败: {}", standardCode, e);
            return ResponseEntity.ok(ApiResponse.error("验证合规性失败: " + e.getMessage()));
        }
    }

    /**
     * 多标准对比分析
     */
    @PostMapping("/compare")
    @Operation(summary = "多标准对比分析", description = "对比多个标准的合规性并给出建议")
    public ResponseEntity<ApiResponse<StandardComparisonResult>> compareStandards(
            @Parameter(description = "标准代码列表") @RequestParam List<String> standardCodes,
            @Parameter(description = "待分析的数据") @RequestBody Map<String, Object> data) {
        
        try {
            StandardComparisonResult result = standardsManagementService.compareStandards(standardCodes, data);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("标准对比分析失败", e);
            return ResponseEntity.ok(ApiResponse.error("标准对比分析失败: " + e.getMessage()));
        }
    }

    /**
     * 获取排放因子
     */
    @GetMapping("/{standardCode}/emission-factors")
    @Operation(summary = "获取排放因子", description = "获取指定标准的排放因子列表")
    public ResponseEntity<ApiResponse<List<EmissionFactor>>> getEmissionFactors(
            @Parameter(description = "标准代码") @PathVariable String standardCode,
            @Parameter(description = "能源类型") @RequestParam(required = false) String energyType) {
        
        try {
            List<EmissionFactor> factors;
            
            if (energyType != null && !energyType.isEmpty()) {
                factors = emissionFactorService.getFactorsByEnergyType(energyType);
            } else {
                factors = emissionFactorService.getFactorsByStandard(standardCode);
            }
            
            return ResponseEntity.ok(ApiResponse.success(factors));
        } catch (Exception e) {
            log.error("获取排放因子失败: {}", standardCode, e);
            return ResponseEntity.ok(ApiResponse.error("获取排放因子失败: " + e.getMessage()));
        }
    }

    /**
     * 获取最新排放因子
     */
    @GetMapping("/emission-factors/{factorCode}/latest")
    @Operation(summary = "获取最新排放因子", description = "获取指定因子代码的最新版本")
    public ResponseEntity<ApiResponse<EmissionFactor>> getLatestEmissionFactor(
            @Parameter(description = "因子代码") @PathVariable String factorCode) {
        
        try {
            Optional<EmissionFactor> factor = emissionFactorService.getLatestFactor(factorCode);
            
            if (factor.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success(factor.get()));
            } else {
                return ResponseEntity.ok(ApiResponse.error("排放因子不存在: " + factorCode));
            }
        } catch (Exception e) {
            log.error("获取最新排放因子失败: {}", factorCode, e);
            return ResponseEntity.ok(ApiResponse.error("获取最新排放因子失败: " + e.getMessage()));
        }
    }

    /**
     * 手动触发标准更新检查
     */
    @PostMapping("/check-updates")
    @Operation(summary = "检查标准更新", description = "手动触发标准更新检查")
    public ResponseEntity<ApiResponse<String>> checkStandardsUpdates() {
        
        try {
            standardsManagementService.checkStandardsUpdates();
            return ResponseEntity.ok(ApiResponse.success("标准更新检查已启动"));
        } catch (Exception e) {
            log.error("触发标准更新检查失败", e);
            return ResponseEntity.ok(ApiResponse.error("触发标准更新检查失败: " + e.getMessage()));
        }
    }

    /**
     * 获取标准统计信息
     */
    @GetMapping("/statistics")
    @Operation(summary = "获取标准统计信息", description = "获取标准和排放因子的统计数据")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStandardsStatistics() {
        
        try {
            Map<String, Object> statistics = standardsManagementService.getStandardsStatistics();
            return ResponseEntity.ok(ApiResponse.success(statistics));
        } catch (Exception e) {
            log.error("获取标准统计信息失败", e);
            return ResponseEntity.ok(ApiResponse.error("获取标准统计信息失败: " + e.getMessage()));
        }
    }

    /**
     * 获取排放因子统计信息
     */
    @GetMapping("/emission-factors/statistics")
    @Operation(summary = "获取排放因子统计信息", description = "获取排放因子的统计数据")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmissionFactorStatistics() {
        
        try {
            Map<String, Object> statistics = emissionFactorService.getFactorStatistics();
            return ResponseEntity.ok(ApiResponse.success(statistics));
        } catch (Exception e) {
            log.error("获取排放因子统计信息失败", e);
            return ResponseEntity.ok(ApiResponse.error("获取排放因子统计信息失败: " + e.getMessage()));
        }
    }

    /**
     * 搜索标准
     */
    @GetMapping("/search")
    @Operation(summary = "搜索标准", description = "根据关键词搜索标准")
    public ResponseEntity<ApiResponse<List<Standard>>> searchStandards(
            @Parameter(description = "搜索关键词") @RequestParam String keyword) {
        
        try {
            List<Standard> standards = standardsManagementService.searchStandards(keyword);
            return ResponseEntity.ok(ApiResponse.success(standards));
        } catch (Exception e) {
            log.error("搜索标准失败: {}", keyword, e);
            return ResponseEntity.ok(ApiResponse.error("搜索标准失败: " + e.getMessage()));
        }
    }

    /**
     * 搜索排放因子
     */
    @GetMapping("/emission-factors/search")
    @Operation(summary = "搜索排放因子", description = "根据关键词搜索排放因子")
    public ResponseEntity<ApiResponse<List<EmissionFactor>>> searchEmissionFactors(
            @Parameter(description = "搜索关键词") @RequestParam String keyword) {
        
        try {
            List<EmissionFactor> factors = emissionFactorService.searchFactors(keyword);
            return ResponseEntity.ok(ApiResponse.success(factors));
        } catch (Exception e) {
            log.error("搜索排放因子失败: {}", keyword, e);
            return ResponseEntity.ok(ApiResponse.error("搜索排放因子失败: " + e.getMessage()));
        }
    }
}