package com.zerocarbon.standards.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 标准版本信息DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandardVersion {
    
    /**
     * 版本号
     */
    private String version;
    
    /**
     * 发布日期
     */
    private LocalDateTime releaseDate;
    
    /**
     * 实施日期
     */
    private LocalDateTime implementationDate;
    
    /**
     * 版本描述
     */
    private String description;
    
    /**
     * 更新内容
     */
    private String updateContent;
    
    /**
     * 影响范围
     */
    private String impactScope;
    
    /**
     * 是否为重大更新
     */
    private Boolean majorUpdate;
    
    /**
     * 下载链接
     */
    private String downloadUrl;
    
    /**
     * 文档链接
     */
    private String documentUrl;
}