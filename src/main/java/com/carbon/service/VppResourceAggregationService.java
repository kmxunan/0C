package com.carbon.service;

import com.carbon.dto.VppAggregationRequest;
import com.carbon.dto.VppAggregationResult;
import com.carbon.dto.ResourceCapacityInfo;
import com.carbon.dto.AggregationStrategy;
import com.carbon.entity.Vpp;
import com.carbon.entity.VppResourceInstance;
import com.carbon.entity.VppResourceMapping;
import com.carbon.entity.VppResourceTemplate;
import com.carbon.repository.VppRepository;
import com.carbon.repository.VppResourceInstanceRepository;
import com.carbon.repository.VppResourceMappingRepository;
import com.carbon.repository.VppResourceTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * VPP资源聚合管理服务
 * 负责虚拟电厂资源的聚合、优化配置和容量管理
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VppResourceAggregationService {

    private final VppRepository vppRepository;
    private final VppResourceInstanceRepository resourceInstanceRepository;
    private final VppResourceMappingRepository resourceMappingRepository;
    private final VppResourceTemplateRepository resourceTemplateRepository;

    /**
     * 创建VPP资源聚合
     */
    @Transactional
    public VppAggregationResult createAggregation(VppAggregationRequest request) {
        try {
            log.info("开始创建VPP资源聚合: name={}, resourceCount={}", 
                request.getName(), request.getResourceIds().size());

            // 验证请求参数
            validateAggregationRequest(request);

            // 验证资源可用性
            List<VppResourceInstance> resources = validateResourceAvailability(request.getResourceIds());

            // 计算聚合容量
            ResourceCapacityInfo totalCapacity = calculateTotalCapacity(resources);

            // 创建VPP实例
            Vpp vpp = createVppInstance(request, totalCapacity);

            // 创建资源映射关系
            List<VppResourceMapping> mappings = createResourceMappings(vpp.getId(), resources, request);

            // 优化资源配置
            optimizeResourceConfiguration(vpp, mappings);

            // 更新资源状态
            updateResourceStatus(resources, "AGGREGATED");

            VppAggregationResult result = VppAggregationResult.builder()
                .vppId(vpp.getId())
                .vppName(vpp.getName())
                .totalCapacity(totalCapacity)
                .resourceCount(resources.size())
                .aggregationStrategy(request.getStrategy())
                .createdAt(vpp.getCreatedAt())
                .build();

            log.info("VPP资源聚合创建成功: vppId={}, totalCapacity={}", 
                vpp.getId(), totalCapacity.getTotalCapacity());

            return result;

        } catch (Exception e) {
            log.error("创建VPP资源聚合失败: {}", e.getMessage(), e);
            throw new RuntimeException("创建VPP资源聚合失败: " + e.getMessage(), e);
        }
    }

    /**
     * 更新VPP资源聚合
     */
    @Transactional
    public VppAggregationResult updateAggregation(Long vppId, VppAggregationRequest request) {
        try {
            log.info("开始更新VPP资源聚合: vppId={}", vppId);

            Vpp vpp = vppRepository.findById(vppId)
                .orElseThrow(() -> new RuntimeException("VPP不存在: " + vppId));

            // 获取当前资源映射
            List<VppResourceMapping> currentMappings = resourceMappingRepository.findByVppId(vppId);
            Set<Long> currentResourceIds = currentMappings.stream()
                .map(VppResourceMapping::getResourceId)
                .collect(Collectors.toSet());

            Set<Long> newResourceIds = new HashSet<>(request.getResourceIds());

            // 计算需要添加和移除的资源
            Set<Long> toAdd = new HashSet<>(newResourceIds);
            toAdd.removeAll(currentResourceIds);

            Set<Long> toRemove = new HashSet<>(currentResourceIds);
            toRemove.removeAll(newResourceIds);

            // 移除资源
            if (!toRemove.isEmpty()) {
                removeResourcesFromVpp(vppId, toRemove);
            }

            // 添加资源
            if (!toAdd.isEmpty()) {
                addResourcesToVpp(vppId, toAdd, request);
            }

            // 重新计算总容量
            List<VppResourceInstance> allResources = getVppResources(vppId);
            ResourceCapacityInfo totalCapacity = calculateTotalCapacity(allResources);

            // 更新VPP信息
            vpp.setName(request.getName());
            vpp.setDescription(request.getDescription());
            vpp.setTotalCapacity(totalCapacity.getTotalCapacity());
            vpp.setAvailableCapacity(totalCapacity.getAvailableCapacity());
            vpp.setUpdatedAt(LocalDateTime.now());
            vppRepository.save(vpp);

            // 重新优化配置
            List<VppResourceMapping> updatedMappings = resourceMappingRepository.findByVppId(vppId);
            optimizeResourceConfiguration(vpp, updatedMappings);

            VppAggregationResult result = VppAggregationResult.builder()
                .vppId(vpp.getId())
                .vppName(vpp.getName())
                .totalCapacity(totalCapacity)
                .resourceCount(allResources.size())
                .aggregationStrategy(request.getStrategy())
                .createdAt(vpp.getCreatedAt())
                .build();

            log.info("VPP资源聚合更新成功: vppId={}", vppId);
            return result;

        } catch (Exception e) {
            log.error("更新VPP资源聚合失败: vppId={}, error={}", vppId, e.getMessage(), e);
            throw new RuntimeException("更新VPP资源聚合失败: " + e.getMessage(), e);
        }
    }

    /**
     * 解散VPP资源聚合
     */
    @Transactional
    public void dissolveAggregation(Long vppId) {
        try {
            log.info("开始解散VPP资源聚合: vppId={}", vppId);

            Vpp vpp = vppRepository.findById(vppId)
                .orElseThrow(() -> new RuntimeException("VPP不存在: " + vppId));

            // 获取所有资源映射
            List<VppResourceMapping> mappings = resourceMappingRepository.findByVppId(vppId);
            Set<Long> resourceIds = mappings.stream()
                .map(VppResourceMapping::getResourceId)
                .collect(Collectors.toSet());

            // 删除资源映射
            resourceMappingRepository.deleteAll(mappings);

            // 恢复资源状态
            if (!resourceIds.isEmpty()) {
                List<VppResourceInstance> resources = resourceInstanceRepository.findAllById(resourceIds);
                updateResourceStatus(resources, "AVAILABLE");
            }

            // 删除VPP
            vppRepository.delete(vpp);

            log.info("VPP资源聚合解散成功: vppId={}, 释放资源数量={}", vppId, resourceIds.size());

        } catch (Exception e) {
            log.error("解散VPP资源聚合失败: vppId={}, error={}", vppId, e.getMessage(), e);
            throw new RuntimeException("解散VPP资源聚合失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取VPP聚合信息
     */
    public VppAggregationResult getAggregationInfo(Long vppId) {
        Vpp vpp = vppRepository.findById(vppId)
            .orElseThrow(() -> new RuntimeException("VPP不存在: " + vppId));

        List<VppResourceInstance> resources = getVppResources(vppId);
        ResourceCapacityInfo totalCapacity = calculateTotalCapacity(resources);

        return VppAggregationResult.builder()
            .vppId(vpp.getId())
            .vppName(vpp.getName())
            .totalCapacity(totalCapacity)
            .resourceCount(resources.size())
            .createdAt(vpp.getCreatedAt())
            .build();
    }

    /**
     * 获取可用资源列表
     */
    public List<VppResourceInstance> getAvailableResources(String resourceType) {
        if (resourceType != null) {
            return resourceInstanceRepository.findByResourceTypeAndStatus(resourceType, "AVAILABLE");
        } else {
            return resourceInstanceRepository.findByStatus("AVAILABLE");
        }
    }

    /**
     * 智能资源推荐
     */
    public List<VppResourceInstance> recommendResources(VppAggregationRequest request) {
        // 获取可用资源
        List<VppResourceInstance> availableResources = getAvailableResources(null);

        // 根据聚合策略进行筛选和排序
        return availableResources.stream()
            .filter(resource -> isResourceSuitable(resource, request))
            .sorted((r1, r2) -> compareResourcePriority(r1, r2, request.getStrategy()))
            .limit(request.getMaxResourceCount() != null ? request.getMaxResourceCount() : 50)
            .collect(Collectors.toList());
    }

    /**
     * 验证聚合请求
     */
    private void validateAggregationRequest(VppAggregationRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("VPP名称不能为空");
        }
        if (request.getResourceIds() == null || request.getResourceIds().isEmpty()) {
            throw new IllegalArgumentException("资源列表不能为空");
        }
        if (request.getStrategy() == null) {
            throw new IllegalArgumentException("聚合策略不能为空");
        }
    }

    /**
     * 验证资源可用性
     */
    private List<VppResourceInstance> validateResourceAvailability(List<Long> resourceIds) {
        List<VppResourceInstance> resources = resourceInstanceRepository.findAllById(resourceIds);
        
        if (resources.size() != resourceIds.size()) {
            throw new RuntimeException("部分资源不存在");
        }

        List<VppResourceInstance> unavailableResources = resources.stream()
            .filter(r -> !"AVAILABLE".equals(r.getStatus()))
            .collect(Collectors.toList());

        if (!unavailableResources.isEmpty()) {
            String unavailableIds = unavailableResources.stream()
                .map(r -> r.getId().toString())
                .collect(Collectors.joining(", "));
            throw new RuntimeException("以下资源不可用: " + unavailableIds);
        }

        return resources;
    }

    /**
     * 计算总容量
     */
    private ResourceCapacityInfo calculateTotalCapacity(List<VppResourceInstance> resources) {
        BigDecimal totalCapacity = BigDecimal.ZERO;
        BigDecimal availableCapacity = BigDecimal.ZERO;
        BigDecimal maxPower = BigDecimal.ZERO;
        BigDecimal minPower = BigDecimal.ZERO;

        for (VppResourceInstance resource : resources) {
            totalCapacity = totalCapacity.add(resource.getCapacity());
            availableCapacity = availableCapacity.add(resource.getAvailableCapacity());
            maxPower = maxPower.add(resource.getMaxPower());
            minPower = minPower.add(resource.getMinPower());
        }

        return ResourceCapacityInfo.builder()
            .totalCapacity(totalCapacity)
            .availableCapacity(availableCapacity)
            .maxPower(maxPower)
            .minPower(minPower)
            .resourceCount(resources.size())
            .build();
    }

    /**
     * 创建VPP实例
     */
    private Vpp createVppInstance(VppAggregationRequest request, ResourceCapacityInfo capacity) {
        Vpp vpp = Vpp.builder()
            .name(request.getName())
            .description(request.getDescription())
            .type("AGGREGATED")
            .status("ACTIVE")
            .totalCapacity(capacity.getTotalCapacity())
            .availableCapacity(capacity.getAvailableCapacity())
            .maxPower(capacity.getMaxPower())
            .minPower(capacity.getMinPower())
            .aggregationStrategy(request.getStrategy().toString())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        return vppRepository.save(vpp);
    }

    /**
     * 创建资源映射关系
     */
    private List<VppResourceMapping> createResourceMappings(Long vppId, 
                                                           List<VppResourceInstance> resources, 
                                                           VppAggregationRequest request) {
        List<VppResourceMapping> mappings = new ArrayList<>();
        
        for (VppResourceInstance resource : resources) {
            VppResourceMapping mapping = VppResourceMapping.builder()
                .vppId(vppId)
                .resourceId(resource.getId())
                .allocationRatio(calculateAllocationRatio(resource, request.getStrategy()))
                .priority(calculateResourcePriority(resource, request.getStrategy()))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
            
            mappings.add(mapping);
        }
        
        return resourceMappingRepository.saveAll(mappings);
    }

    /**
     * 优化资源配置
     */
    private void optimizeResourceConfiguration(Vpp vpp, List<VppResourceMapping> mappings) {
        // 根据不同的聚合策略进行优化
        AggregationStrategy strategy = AggregationStrategy.valueOf(vpp.getAggregationStrategy());
        
        switch (strategy) {
            case CAPACITY_WEIGHTED:
                optimizeByCapacity(mappings);
                break;
            case EFFICIENCY_WEIGHTED:
                optimizeByEfficiency(mappings);
                break;
            case COST_WEIGHTED:
                optimizeByCost(mappings);
                break;
            case BALANCED:
                optimizeBalanced(mappings);
                break;
        }
        
        resourceMappingRepository.saveAll(mappings);
    }

    /**
     * 更新资源状态
     */
    private void updateResourceStatus(List<VppResourceInstance> resources, String status) {
        for (VppResourceInstance resource : resources) {
            resource.setStatus(status);
            resource.setUpdatedAt(LocalDateTime.now());
        }
        resourceInstanceRepository.saveAll(resources);
    }

    /**
     * 获取VPP的所有资源
     */
    private List<VppResourceInstance> getVppResources(Long vppId) {
        List<VppResourceMapping> mappings = resourceMappingRepository.findByVppId(vppId);
        List<Long> resourceIds = mappings.stream()
            .map(VppResourceMapping::getResourceId)
            .collect(Collectors.toList());
        return resourceInstanceRepository.findAllById(resourceIds);
    }

    /**
     * 从VPP中移除资源
     */
    private void removeResourcesFromVpp(Long vppId, Set<Long> resourceIds) {
        List<VppResourceMapping> mappingsToRemove = resourceMappingRepository
            .findByVppIdAndResourceIdIn(vppId, resourceIds);
        resourceMappingRepository.deleteAll(mappingsToRemove);
        
        List<VppResourceInstance> resources = resourceInstanceRepository.findAllById(resourceIds);
        updateResourceStatus(resources, "AVAILABLE");
    }

    /**
     * 向VPP中添加资源
     */
    private void addResourcesToVpp(Long vppId, Set<Long> resourceIds, VppAggregationRequest request) {
        List<VppResourceInstance> resources = validateResourceAvailability(new ArrayList<>(resourceIds));
        createResourceMappings(vppId, resources, request);
        updateResourceStatus(resources, "AGGREGATED");
    }

    // 辅助方法实现
    private boolean isResourceSuitable(VppResourceInstance resource, VppAggregationRequest request) {
        // 实现资源适用性判断逻辑
        return true;
    }

    private int compareResourcePriority(VppResourceInstance r1, VppResourceInstance r2, AggregationStrategy strategy) {
        // 实现资源优先级比较逻辑
        return r2.getCapacity().compareTo(r1.getCapacity());
    }

    private BigDecimal calculateAllocationRatio(VppResourceInstance resource, AggregationStrategy strategy) {
        // 计算资源分配比例
        return BigDecimal.ONE;
    }

    private Integer calculateResourcePriority(VppResourceInstance resource, AggregationStrategy strategy) {
        // 计算资源优先级
        return 1;
    }

    private void optimizeByCapacity(List<VppResourceMapping> mappings) {
        // 按容量优化
    }

    private void optimizeByEfficiency(List<VppResourceMapping> mappings) {
        // 按效率优化
    }

    private void optimizeByCost(List<VppResourceMapping> mappings) {
        // 按成本优化
    }

    private void optimizeBalanced(List<VppResourceMapping> mappings) {
        // 平衡优化
    }
}