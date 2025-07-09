package com.zerocarbon.standards.service;

import com.zerocarbon.standards.dto.StandardVersion;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * 标准通知服务
 */
@Slf4j
@Service
public class StandardsNotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final List<String> adminEmails = List.of(
        "admin@zero-carbon-park.com",
        "standards@zero-carbon-park.com"
    );

    /**
     * 通知标准更新
     */
    public void notifyStandardUpdate(StandardsManagementService.StandardInfo standardInfo, StandardVersion newVersion) {
        log.info("发送标准更新通知: {} -> {}", standardInfo.getCode(), newVersion.getVersion());
        
        // 异步发送通知
        CompletableFuture.runAsync(() -> {
            try {
                sendEmailNotification(standardInfo, newVersion);
                sendSystemNotification(standardInfo, newVersion);
                logNotification(standardInfo, newVersion);
            } catch (Exception e) {
                log.error("发送标准更新通知失败", e);
            }
        });
    }

    /**
     * 发送邮件通知
     */
    private void sendEmailNotification(StandardsManagementService.StandardInfo standardInfo, StandardVersion newVersion) {
        if (mailSender == null) {
            log.warn("邮件发送器未配置，跳过邮件通知");
            return;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(adminEmails.toArray(new String[0]));
            message.setSubject("标准更新通知 - " + standardInfo.getCode());
            message.setText(buildEmailContent(standardInfo, newVersion));
            message.setFrom("system@zero-carbon-park.com");
            
            mailSender.send(message);
            log.info("标准更新邮件通知已发送: {}", standardInfo.getCode());
        } catch (Exception e) {
            log.error("发送邮件通知失败: {}", standardInfo.getCode(), e);
        }
    }

    /**
     * 构建邮件内容
     */
    private String buildEmailContent(StandardsManagementService.StandardInfo standardInfo, StandardVersion newVersion) {
        StringBuilder content = new StringBuilder();
        content.append("零碳园区数字孪生系统 - 标准更新通知\n\n");
        content.append("标准代码: ").append(standardInfo.getCode()).append("\n");
        content.append("标准名称: ").append(standardInfo.getName()).append("\n");
        content.append("标准类型: ").append(getStandardTypeDescription(standardInfo.getType())).append("\n");
        content.append("新版本号: ").append(newVersion.getVersion()).append("\n");
        content.append("发布时间: ").append(newVersion.getReleaseDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
        content.append("更新描述: ").append(newVersion.getDescription()).append("\n\n");
        
        content.append("影响说明:\n");
        content.append("- 相关排放因子已自动更新\n");
        content.append("- 计算规则可能需要人工审核\n");
        content.append("- 建议重新验证相关数据的合规性\n\n");
        
        content.append("操作建议:\n");
        content.append("1. 登录系统查看详细更新内容\n");
        content.append("2. 检查现有数据是否符合新标准要求\n");
        content.append("3. 更新相关业务流程和操作手册\n");
        content.append("4. 通知相关用户和部门\n\n");
        
        content.append("系统链接: https://zero-carbon-park.com/standards\n");
        content.append("通知时间: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
        content.append("\n此邮件由系统自动发送，请勿回复。");
        
        return content.toString();
    }

    /**
     * 发送系统内通知
     */
    private void sendSystemNotification(StandardsManagementService.StandardInfo standardInfo, StandardVersion newVersion) {
        try {
            // 创建系统通知记录
            SystemNotification notification = SystemNotification.builder()
                .title("标准更新通知")
                .content(String.format("标准 %s (%s) 已更新到版本 %s", 
                    standardInfo.getCode(), standardInfo.getName(), newVersion.getVersion()))
                .type("STANDARD_UPDATE")
                .priority("HIGH")
                .targetUsers("ALL_ADMINS")
                .relatedEntity("STANDARD")
                .relatedEntityId(standardInfo.getCode())
                .createTime(LocalDateTime.now())
                .status("ACTIVE")
                .build();
            
            // 保存通知到数据库（如果有通知表的话）
            // notificationRepository.save(notification);
            
            log.info("系统通知已创建: {}", standardInfo.getCode());
        } catch (Exception e) {
            log.error("创建系统通知失败: {}", standardInfo.getCode(), e);
        }
    }

    /**
     * 记录通知日志
     */
    private void logNotification(StandardsManagementService.StandardInfo standardInfo, StandardVersion newVersion) {
        log.info("标准更新通知记录 - 代码: {}, 名称: {}, 类型: {}, 新版本: {}, 时间: {}",
            standardInfo.getCode(),
            standardInfo.getName(),
            standardInfo.getType(),
            newVersion.getVersion(),
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        );
    }

    /**
     * 通知排放因子更新
     */
    public void notifyEmissionFactorUpdate(String standardCode, int updatedCount) {
        log.info("排放因子更新通知: 标准 {} 更新了 {} 个排放因子", standardCode, updatedCount);
        
        CompletableFuture.runAsync(() -> {
            try {
                sendEmissionFactorUpdateNotification(standardCode, updatedCount);
            } catch (Exception e) {
                log.error("发送排放因子更新通知失败", e);
            }
        });
    }

    /**
     * 发送排放因子更新通知
     */
    private void sendEmissionFactorUpdateNotification(String standardCode, int updatedCount) {
        if (mailSender == null) {
            log.warn("邮件发送器未配置，跳过排放因子更新通知");
            return;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(adminEmails.toArray(new String[0]));
            message.setSubject("排放因子更新通知 - " + standardCode);
            
            StringBuilder content = new StringBuilder();
            content.append("零碳园区数字孪生系统 - 排放因子更新通知\n\n");
            content.append("标准代码: ").append(standardCode).append("\n");
            content.append("更新数量: ").append(updatedCount).append(" 个排放因子\n");
            content.append("更新时间: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n\n");
            content.append("建议操作:\n");
            content.append("1. 检查更新后的排放因子数据\n");
            content.append("2. 重新计算相关的碳排放数据\n");
            content.append("3. 验证计算结果的准确性\n\n");
            content.append("此邮件由系统自动发送，请勿回复。");
            
            message.setText(content.toString());
            message.setFrom("system@zero-carbon-park.com");
            
            mailSender.send(message);
            log.info("排放因子更新邮件通知已发送: {}", standardCode);
        } catch (Exception e) {
            log.error("发送排放因子更新邮件通知失败: {}", standardCode, e);
        }
    }

    /**
     * 通知标准验证失败
     */
    public void notifyValidationFailure(String standardCode, String entityId, List<String> errors) {
        log.warn("标准验证失败通知: 标准 {}, 实体 {}, 错误数量: {}", standardCode, entityId, errors.size());
        
        CompletableFuture.runAsync(() -> {
            try {
                sendValidationFailureNotification(standardCode, entityId, errors);
            } catch (Exception e) {
                log.error("发送验证失败通知失败", e);
            }
        });
    }

    /**
     * 发送验证失败通知
     */
    private void sendValidationFailureNotification(String standardCode, String entityId, List<String> errors) {
        if (mailSender == null) {
            log.warn("邮件发送器未配置，跳过验证失败通知");
            return;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(adminEmails.toArray(new String[0]));
            message.setSubject("标准验证失败通知 - " + standardCode);
            
            StringBuilder content = new StringBuilder();
            content.append("零碳园区数字孪生系统 - 标准验证失败通知\n\n");
            content.append("标准代码: ").append(standardCode).append("\n");
            content.append("实体ID: ").append(entityId).append("\n");
            content.append("验证时间: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n\n");
            content.append("验证错误:\n");
            for (int i = 0; i < errors.size(); i++) {
                content.append(String.format("%d. %s\n", i + 1, errors.get(i)));
            }
            content.append("\n建议操作:\n");
            content.append("1. 检查数据完整性和准确性\n");
            content.append("2. 确认是否使用了正确的标准\n");
            content.append("3. 联系相关人员修正数据\n\n");
            content.append("此邮件由系统自动发送，请勿回复。");
            
            message.setText(content.toString());
            message.setFrom("system@zero-carbon-park.com");
            
            mailSender.send(message);
            log.info("验证失败邮件通知已发送: {}", standardCode);
        } catch (Exception e) {
            log.error("发送验证失败邮件通知失败: {}", standardCode, e);
        }
    }

    /**
     * 获取标准类型描述
     */
    private String getStandardTypeDescription(String type) {
        switch (type) {
            case "national":
                return "国家标准";
            case "industry":
                return "行业标准";
            case "international":
                return "国际标准";
            default:
                return "其他标准";
        }
    }

    /**
     * 系统通知内部类
     */
    private static class SystemNotification {
        private String title;
        private String content;
        private String type;
        private String priority;
        private String targetUsers;
        private String relatedEntity;
        private String relatedEntityId;
        private LocalDateTime createTime;
        private String status;

        public static SystemNotificationBuilder builder() {
            return new SystemNotificationBuilder();
        }

        public static class SystemNotificationBuilder {
            private SystemNotification notification = new SystemNotification();

            public SystemNotificationBuilder title(String title) {
                notification.title = title;
                return this;
            }

            public SystemNotificationBuilder content(String content) {
                notification.content = content;
                return this;
            }

            public SystemNotificationBuilder type(String type) {
                notification.type = type;
                return this;
            }

            public SystemNotificationBuilder priority(String priority) {
                notification.priority = priority;
                return this;
            }

            public SystemNotificationBuilder targetUsers(String targetUsers) {
                notification.targetUsers = targetUsers;
                return this;
            }

            public SystemNotificationBuilder relatedEntity(String relatedEntity) {
                notification.relatedEntity = relatedEntity;
                return this;
            }

            public SystemNotificationBuilder relatedEntityId(String relatedEntityId) {
                notification.relatedEntityId = relatedEntityId;
                return this;
            }

            public SystemNotificationBuilder createTime(LocalDateTime createTime) {
                notification.createTime = createTime;
                return this;
            }

            public SystemNotificationBuilder status(String status) {
                notification.status = status;
                return this;
            }

            public SystemNotification build() {
                return notification;
            }
        }
    }
}