package com.carbon.service;

import com.carbon.dto.SettlementRequest;
import com.carbon.dto.SettlementResult;
import com.carbon.dto.PerformanceAnalysisReport;
import com.carbon.dto.ProfitDistribution;
import com.carbon.entity.TradingRecord;
import com.carbon.entity.SettlementRecord;
import com.carbon.entity.VppResourceInstance;
import com.carbon.entity.Vpp;
import com.carbon.repository.TradingRecordRepository;
import com.carbon.repository.SettlementRecordRepository;
import com.carbon.repository.VppResourceInstanceRepository;
import com.carbon.repository.VppRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 结算和分析系统服务
 * 负责交易结算、收益分配、性能分析和报告生成
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SettlementAnalysisService {

    private final TradingRecordRepository tradingRecordRepository;
    private final SettlementRecordRepository settlementRecordRepository;
    private final VppResourceInstanceRepository resourceInstanceRepository;
    private final VppRepository vppRepository;

    /**
     * 执行日结算
     */
    @Transactional
    public SettlementResult executeDailySettlement(SettlementRequest request) {
        try {
            log.info("开始执行日结算: date={}, vppId={}", request.getSettlementDate(), request.getVppId());

            // 验证结算请求
            validateSettlementRequest(request);

            // 获取交易记录
            List<TradingRecord> tradingRecords = getTradingRecords(request);
            
            if (tradingRecords.isEmpty()) {
                log.info("无交易记录需要结算: date={}, vppId={}", 
                    request.getSettlementDate(), request.getVppId());
                return SettlementResult.empty(request);
            }

            // 计算总收益
            BigDecimal totalRevenue = calculateTotalRevenue(tradingRecords);
            BigDecimal totalCost = calculateTotalCost(tradingRecords);
            BigDecimal netProfit = totalRevenue.subtract(totalCost);

            // 获取VPP和资源信息
            Vpp vpp = vppRepository.findById(request.getVppId())
                .orElseThrow(() -> new RuntimeException("VPP不存在: " + request.getVppId()));
            
            List<VppResourceInstance> resources = getVppResources(request.getVppId());

            // 计算收益分配
            List<ProfitDistribution> distributions = calculateProfitDistribution(
                netProfit, resources, tradingRecords, request.getDistributionStrategy());

            // 创建结算记录
            SettlementRecord settlementRecord = createSettlementRecord(
                request, totalRevenue, totalCost, netProfit, distributions);

            // 更新资源收益
            updateResourceProfits(distributions);

            SettlementResult result = SettlementResult.builder()
                .settlementId(settlementRecord.getId())
                .settlementDate(request.getSettlementDate())
                .vppId(request.getVppId())
                .vppName(vpp.getName())
                .totalRevenue(totalRevenue)
                .totalCost(totalCost)
                .netProfit(netProfit)
                .tradingRecordCount(tradingRecords.size())
                .resourceCount(resources.size())
                .distributions(distributions)
                .createdAt(settlementRecord.getCreatedAt())
                .build();

            log.info("日结算完成: settlementId={}, netProfit={}, resourceCount={}", 
                settlementRecord.getId(), netProfit, resources.size());

            return result;

        } catch (Exception e) {
            log.error("日结算失败: {}", e.getMessage(), e);
            throw new RuntimeException("日结算失败: " + e.getMessage(), e);
        }
    }

    /**
     * 执行月结算
     */
    @Transactional
    public SettlementResult executeMonthlySettlement(Long vppId, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);
        
        SettlementRequest request = SettlementRequest.builder()
            .vppId(vppId)
            .settlementDate(endDate)
            .startDate(startDate)
            .endDate(endDate)
            .settlementType("MONTHLY")
            .distributionStrategy("CAPACITY_WEIGHTED")
            .build();
            
        return executeDailySettlement(request);
    }

    /**
     * 生成性能分析报告
     */
    public PerformanceAnalysisReport generatePerformanceReport(Long vppId, 
                                                              LocalDate startDate, 
                                                              LocalDate endDate) {
        try {
            log.info("生成性能分析报告: vppId={}, period={}-{}", vppId, startDate, endDate);

            // 获取VPP信息
            Vpp vpp = vppRepository.findById(vppId)
                .orElseThrow(() -> new RuntimeException("VPP不存在: " + vppId));

            // 获取期间内的结算记录
            List<SettlementRecord> settlements = settlementRecordRepository
                .findByVppIdAndSettlementDateBetweenOrderBySettlementDate(
                    vppId, startDate, endDate);

            // 获取交易记录
            List<TradingRecord> tradingRecords = tradingRecordRepository
                .findByVppIdAndExecutionTimeBetween(
                    vppId, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());

            // 计算关键指标
            PerformanceMetrics metrics = calculatePerformanceMetrics(
                settlements, tradingRecords, startDate, endDate);

            // 生成报告
            PerformanceAnalysisReport report = PerformanceAnalysisReport.builder()
                .vppId(vppId)
                .vppName(vpp.getName())
                .reportPeriod(startDate + " 至 " + endDate)
                .startDate(startDate)
                .endDate(endDate)
                .totalRevenue(metrics.getTotalRevenue())
                .totalCost(metrics.getTotalCost())
                .netProfit(metrics.getNetProfit())
                .profitMargin(metrics.getProfitMargin())
                .averageDailyProfit(metrics.getAverageDailyProfit())
                .totalTradingVolume(metrics.getTotalTradingVolume())
                .tradingCount(metrics.getTradingCount())
                .averageTradeSize(metrics.getAverageTradeSize())
                .successRate(metrics.getSuccessRate())
                .resourceUtilization(metrics.getResourceUtilization())
                .capacityFactor(metrics.getCapacityFactor())
                .peakLoadContribution(metrics.getPeakLoadContribution())
                .carbonReduction(metrics.getCarbonReduction())
                .generatedAt(LocalDateTime.now())
                .build();

            log.info("性能分析报告生成完成: vppId={}, netProfit={}", vppId, metrics.getNetProfit());
            return report;

        } catch (Exception e) {
            log.error("生成性能分析报告失败: vppId={}, error={}", vppId, e.getMessage(), e);
            throw new RuntimeException("生成性能分析报告失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取结算历史
     */
    public List<SettlementRecord> getSettlementHistory(Long vppId, LocalDate startDate, LocalDate endDate) {
        return settlementRecordRepository.findByVppIdAndSettlementDateBetweenOrderBySettlementDate(
            vppId, startDate, endDate);
    }

    /**
     * 获取资源收益排行
     */
    public List<ResourceProfitRanking> getResourceProfitRanking(Long vppId, 
                                                               LocalDate startDate, 
                                                               LocalDate endDate) {
        List<SettlementRecord> settlements = getSettlementHistory(vppId, startDate, endDate);
        
        Map<Long, BigDecimal> resourceProfits = new HashMap<>();
        Map<Long, String> resourceNames = new HashMap<>();
        
        for (SettlementRecord settlement : settlements) {
            List<ProfitDistribution> distributions = parseDistributions(settlement.getDistributionDetails());
            for (ProfitDistribution dist : distributions) {
                resourceProfits.merge(dist.getResourceId(), dist.getAmount(), BigDecimal::add);
                resourceNames.put(dist.getResourceId(), dist.getResourceName());
            }
        }
        
        return resourceProfits.entrySet().stream()
            .map(entry -> ResourceProfitRanking.builder()
                .resourceId(entry.getKey())
                .resourceName(resourceNames.get(entry.getKey()))
                .totalProfit(entry.getValue())
                .build())
            .sorted((r1, r2) -> r2.getTotalProfit().compareTo(r1.getTotalProfit()))
            .collect(Collectors.toList());
    }

    /**
     * 定时执行自动结算
     */
    @Scheduled(cron = "0 0 1 * * ?") // 每天凌晨1点执行
    public void autoSettlement() {
        try {
            log.info("开始执行自动结算");
            
            LocalDate yesterday = LocalDate.now().minusDays(1);
            
            // 获取所有活跃的VPP
            List<Vpp> activeVpps = vppRepository.findByStatus("ACTIVE");
            
            for (Vpp vpp : activeVpps) {
                try {
                    // 检查是否已经结算
                    boolean alreadySettled = settlementRecordRepository
                        .existsByVppIdAndSettlementDate(vpp.getId(), yesterday);
                    
                    if (!alreadySettled) {
                        SettlementRequest request = SettlementRequest.builder()
                            .vppId(vpp.getId())
                            .settlementDate(yesterday)
                            .settlementType("DAILY")
                            .distributionStrategy("CAPACITY_WEIGHTED")
                            .build();
                            
                        executeDailySettlement(request);
                        log.info("自动结算完成: vppId={}, date={}", vpp.getId(), yesterday);
                    }
                    
                } catch (Exception e) {
                    log.error("VPP自动结算失败: vppId={}, error={}", vpp.getId(), e.getMessage());
                }
            }
            
            log.info("自动结算任务完成");
            
        } catch (Exception e) {
            log.error("自动结算任务失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 验证结算请求
     */
    private void validateSettlementRequest(SettlementRequest request) {
        if (request.getVppId() == null) {
            throw new IllegalArgumentException("VPP ID不能为空");
        }
        if (request.getSettlementDate() == null) {
            throw new IllegalArgumentException("结算日期不能为空");
        }
        if (request.getSettlementDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("不能结算未来日期");
        }
    }

    /**
     * 获取交易记录
     */
    private List<TradingRecord> getTradingRecords(SettlementRequest request) {
        LocalDateTime startTime = request.getSettlementDate().atStartOfDay();
        LocalDateTime endTime = request.getSettlementDate().plusDays(1).atStartOfDay();
        
        if (request.getStartDate() != null && request.getEndDate() != null) {
            startTime = request.getStartDate().atStartOfDay();
            endTime = request.getEndDate().plusDays(1).atStartOfDay();
        }
        
        return tradingRecordRepository.findByVppIdAndExecutionTimeBetween(
            request.getVppId(), startTime, endTime);
    }

    /**
     * 计算总收入
     */
    private BigDecimal calculateTotalRevenue(List<TradingRecord> records) {
        return records.stream()
            .filter(r -> "SELL".equals(r.getOrderType()) || "DISCHARGE".equals(r.getOrderType()))
            .map(TradingRecord::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * 计算总成本
     */
    private BigDecimal calculateTotalCost(List<TradingRecord> records) {
        BigDecimal tradingCost = records.stream()
            .filter(r -> "BUY".equals(r.getOrderType()) || "CHARGE".equals(r.getOrderType()))
            .map(TradingRecord::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal commission = records.stream()
            .map(TradingRecord::getCommission)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        return tradingCost.add(commission);
    }

    /**
     * 获取VPP资源
     */
    private List<VppResourceInstance> getVppResources(Long vppId) {
        // 通过VPP资源映射获取资源列表
        // 这里简化实现，实际应该通过VppResourceMapping查询
        return resourceInstanceRepository.findByVppId(vppId);
    }

    /**
     * 计算收益分配
     */
    private List<ProfitDistribution> calculateProfitDistribution(BigDecimal netProfit,
                                                               List<VppResourceInstance> resources,
                                                               List<TradingRecord> tradingRecords,
                                                               String strategy) {
        List<ProfitDistribution> distributions = new ArrayList<>();
        
        if (netProfit.compareTo(BigDecimal.ZERO) <= 0 || resources.isEmpty()) {
            return distributions;
        }
        
        switch (strategy) {
            case "CAPACITY_WEIGHTED":
                distributions = distributeByCapacity(netProfit, resources);
                break;
            case "CONTRIBUTION_WEIGHTED":
                distributions = distributeByContribution(netProfit, resources, tradingRecords);
                break;
            case "EQUAL_SHARE":
                distributions = distributeEqually(netProfit, resources);
                break;
            default:
                distributions = distributeByCapacity(netProfit, resources);
        }
        
        return distributions;
    }

    /**
     * 按容量分配收益
     */
    private List<ProfitDistribution> distributeByCapacity(BigDecimal netProfit, 
                                                         List<VppResourceInstance> resources) {
        BigDecimal totalCapacity = resources.stream()
            .map(VppResourceInstance::getCapacity)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        if (totalCapacity.compareTo(BigDecimal.ZERO) == 0) {
            return new ArrayList<>();
        }
        
        return resources.stream()
            .map(resource -> {
                BigDecimal ratio = resource.getCapacity().divide(totalCapacity, 6, RoundingMode.HALF_UP);
                BigDecimal amount = netProfit.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
                
                return ProfitDistribution.builder()
                    .resourceId(resource.getId())
                    .resourceName(resource.getName())
                    .distributionRatio(ratio)
                    .amount(amount)
                    .distributionMethod("CAPACITY_WEIGHTED")
                    .build();
            })
            .collect(Collectors.toList());
    }

    /**
     * 按贡献分配收益
     */
    private List<ProfitDistribution> distributeByContribution(BigDecimal netProfit,
                                                            List<VppResourceInstance> resources,
                                                            List<TradingRecord> tradingRecords) {
        // 计算每个资源的贡献度
        Map<Long, BigDecimal> contributions = calculateResourceContributions(resources, tradingRecords);
        
        BigDecimal totalContribution = contributions.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        if (totalContribution.compareTo(BigDecimal.ZERO) == 0) {
            return distributeEqually(netProfit, resources);
        }
        
        return resources.stream()
            .map(resource -> {
                BigDecimal contribution = contributions.getOrDefault(resource.getId(), BigDecimal.ZERO);
                BigDecimal ratio = contribution.divide(totalContribution, 6, RoundingMode.HALF_UP);
                BigDecimal amount = netProfit.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
                
                return ProfitDistribution.builder()
                    .resourceId(resource.getId())
                    .resourceName(resource.getName())
                    .distributionRatio(ratio)
                    .amount(amount)
                    .distributionMethod("CONTRIBUTION_WEIGHTED")
                    .build();
            })
            .collect(Collectors.toList());
    }

    /**
     * 平均分配收益
     */
    private List<ProfitDistribution> distributeEqually(BigDecimal netProfit, 
                                                      List<VppResourceInstance> resources) {
        if (resources.isEmpty()) {
            return new ArrayList<>();
        }
        
        BigDecimal ratio = BigDecimal.ONE.divide(BigDecimal.valueOf(resources.size()), 6, RoundingMode.HALF_UP);
        BigDecimal amount = netProfit.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
        
        return resources.stream()
            .map(resource -> ProfitDistribution.builder()
                .resourceId(resource.getId())
                .resourceName(resource.getName())
                .distributionRatio(ratio)
                .amount(amount)
                .distributionMethod("EQUAL_SHARE")
                .build())
            .collect(Collectors.toList());
    }

    /**
     * 创建结算记录
     */
    private SettlementRecord createSettlementRecord(SettlementRequest request,
                                                   BigDecimal totalRevenue,
                                                   BigDecimal totalCost,
                                                   BigDecimal netProfit,
                                                   List<ProfitDistribution> distributions) {
        SettlementRecord record = SettlementRecord.builder()
            .vppId(request.getVppId())
            .settlementDate(request.getSettlementDate())
            .settlementType(request.getSettlementType())
            .totalRevenue(totalRevenue)
            .totalCost(totalCost)
            .netProfit(netProfit)
            .distributionStrategy(request.getDistributionStrategy())
            .distributionDetails(serializeDistributions(distributions))
            .status("COMPLETED")
            .createdAt(LocalDateTime.now())
            .build();
            
        return settlementRecordRepository.save(record);
    }

    /**
     * 更新资源收益
     */
    private void updateResourceProfits(List<ProfitDistribution> distributions) {
        for (ProfitDistribution distribution : distributions) {
            VppResourceInstance resource = resourceInstanceRepository
                .findById(distribution.getResourceId())
                .orElse(null);
                
            if (resource != null) {
                BigDecimal currentProfit = resource.getTotalProfit() != null ? 
                    resource.getTotalProfit() : BigDecimal.ZERO;
                resource.setTotalProfit(currentProfit.add(distribution.getAmount()));
                resource.setUpdatedAt(LocalDateTime.now());
                resourceInstanceRepository.save(resource);
            }
        }
    }

    // 辅助方法实现
    private PerformanceMetrics calculatePerformanceMetrics(List<SettlementRecord> settlements,
                                                          List<TradingRecord> tradingRecords,
                                                          LocalDate startDate,
                                                          LocalDate endDate) {
        // 实现性能指标计算
        return new PerformanceMetrics(); // 简化实现
    }

    private Map<Long, BigDecimal> calculateResourceContributions(List<VppResourceInstance> resources,
                                                               List<TradingRecord> tradingRecords) {
        // 计算资源贡献度
        return new HashMap<>(); // 简化实现
    }

    private List<ProfitDistribution> parseDistributions(String distributionDetails) {
        // 解析分配详情JSON
        return new ArrayList<>(); // 简化实现
    }

    private String serializeDistributions(List<ProfitDistribution> distributions) {
        // 序列化分配详情为JSON
        return ""; // 简化实现
    }

    // 内部类定义
    private static class PerformanceMetrics {
        // 性能指标字段
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private BigDecimal totalCost = BigDecimal.ZERO;
        private BigDecimal netProfit = BigDecimal.ZERO;
        private BigDecimal profitMargin = BigDecimal.ZERO;
        private BigDecimal averageDailyProfit = BigDecimal.ZERO;
        private BigDecimal totalTradingVolume = BigDecimal.ZERO;
        private Integer tradingCount = 0;
        private BigDecimal averageTradeSize = BigDecimal.ZERO;
        private BigDecimal successRate = BigDecimal.ZERO;
        private BigDecimal resourceUtilization = BigDecimal.ZERO;
        private BigDecimal capacityFactor = BigDecimal.ZERO;
        private BigDecimal peakLoadContribution = BigDecimal.ZERO;
        private BigDecimal carbonReduction = BigDecimal.ZERO;

        // Getters
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public BigDecimal getTotalCost() { return totalCost; }
        public BigDecimal getNetProfit() { return netProfit; }
        public BigDecimal getProfitMargin() { return profitMargin; }
        public BigDecimal getAverageDailyProfit() { return averageDailyProfit; }
        public BigDecimal getTotalTradingVolume() { return totalTradingVolume; }
        public Integer getTradingCount() { return tradingCount; }
        public BigDecimal getAverageTradeSize() { return averageTradeSize; }
        public BigDecimal getSuccessRate() { return successRate; }
        public BigDecimal getResourceUtilization() { return resourceUtilization; }
        public BigDecimal getCapacityFactor() { return capacityFactor; }
        public BigDecimal getPeakLoadContribution() { return peakLoadContribution; }
        public BigDecimal getCarbonReduction() { return carbonReduction; }
    }

    @lombok.Builder
    @lombok.Data
    public static class ResourceProfitRanking {
        private Long resourceId;
        private String resourceName;
        private BigDecimal totalProfit;
    }
}