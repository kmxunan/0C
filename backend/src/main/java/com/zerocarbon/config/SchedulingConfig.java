package com.zerocarbon.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 定时任务配置类
 * 配置应用程序的定时任务执行
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2025
 */
@Configuration
@EnableScheduling
public class SchedulingConfig implements SchedulingConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(SchedulingConfig.class);
    
    /**
     * 配置定时任务执行器
     */
    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        taskRegistrar.setScheduler(taskScheduler());
    }
    
    /**
     * 定时任务调度器
     */
    @Bean(name = "taskScheduler")
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        
        // 线程池大小
        scheduler.setPoolSize(10);
        
        // 线程名前缀
        scheduler.setThreadNamePrefix("ZeroCarbon-Scheduler-");
        
        // 等待所有任务完成后再关闭线程池
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        
        // 等待时间（秒）
        scheduler.setAwaitTerminationSeconds(30);
        
        // 拒绝策略：记录日志并丢弃任务
        scheduler.setRejectedExecutionHandler(new CustomRejectedExecutionHandler());
        
        // 初始化
        scheduler.initialize();
        
        logger.info("定时任务调度器初始化完成: 线程池大小={}", scheduler.getPoolSize());
        
        return scheduler;
    }
    
    /**
     * 数据清理任务调度器
     */
    @Bean(name = "dataCleanupScheduler")
    public TaskScheduler dataCleanupScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        
        // 线程池大小
        scheduler.setPoolSize(3);
        
        // 线程名前缀
        scheduler.setThreadNamePrefix("ZeroCarbon-DataCleanup-");
        
        // 等待所有任务完成后再关闭线程池
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        
        // 等待时间（秒）
        scheduler.setAwaitTerminationSeconds(60);
        
        // 拒绝策略：由调用线程执行
        scheduler.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        // 初始化
        scheduler.initialize();
        
        logger.info("数据清理任务调度器初始化完成: 线程池大小={}", scheduler.getPoolSize());
        
        return scheduler;
    }
    
    /**
     * 监控任务调度器
     */
    @Bean(name = "monitoringScheduler")
    public TaskScheduler monitoringScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        
        // 线程池大小
        scheduler.setPoolSize(2);
        
        // 线程名前缀
        scheduler.setThreadNamePrefix("ZeroCarbon-Monitoring-");
        
        // 等待所有任务完成后再关闭线程池
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        
        // 等待时间（秒）
        scheduler.setAwaitTerminationSeconds(15);
        
        // 拒绝策略：丢弃任务
        scheduler.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        
        // 初始化
        scheduler.initialize();
        
        logger.info("监控任务调度器初始化完成: 线程池大小={}", scheduler.getPoolSize());
        
        return scheduler;
    }
    
    /**
     * 自定义拒绝执行处理器
     */
    public static class CustomRejectedExecutionHandler implements RejectedExecutionHandler {
        
        private static final Logger logger = LoggerFactory.getLogger(CustomRejectedExecutionHandler.class);
        
        @Override
        public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
            logger.warn("定时任务被拒绝执行: 任务={}, 活跃线程数={}, 队列大小={}, 已完成任务数={}", 
                    r.getClass().getSimpleName(),
                    executor.getActiveCount(),
                    executor.getQueue().size(),
                    executor.getCompletedTaskCount());
            
            // 可以在这里添加更多的处理逻辑，比如：
            // 1. 发送告警
            // 2. 记录到数据库
            // 3. 尝试重新提交任务
            
            // 示例：尝试在当前线程中执行任务（谨慎使用）
            try {
                if (!executor.isShutdown()) {
                    logger.info("尝试在当前线程中执行被拒绝的定时任务");
                    r.run();
                }
            } catch (Exception e) {
                logger.error("在当前线程中执行被拒绝的定时任务失败", e);
            }
        }
    }
}