package com.zerocarbon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 零碳园区数字孪生系统主启动类
 *
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2025
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableTransactionManagement
public class ZeroCarbonDigitalTwinApplication {
    
    public static void main(String[] args) {
        // 设置系统属性
        System.setProperty("spring.application.name", "zero-carbon-digital-twin");
        System.setProperty("file.encoding", "UTF-8");
        System.setProperty("user.timezone", "Asia/Shanghai");
        
        // 启动应用
        SpringApplication application = new SpringApplication(ZeroCarbonDigitalTwinApplication.class);
        
        // 设置默认配置文件
        application.setDefaultProperties(java.util.Map.of(
                "spring.profiles.default", "dev",
                "server.port", "8080",
                "management.endpoints.web.exposure.include", "health,info,metrics"
        ));
        
        // 启动应用
        application.run(args);
        
        // 输出启动信息
        System.out.println("\n" +
                "=================================================================\n" +
                "    零碳园区数字孪生系统启动成功！\n" +
                "    Zero Carbon Digital Twin System Started Successfully!\n" +
                "    \n" +
                "    应用名称: 零碳园区数字孪生系统\n" +
                "    版本号: 1.0.0\n" +
                "    访问地址: http://localhost:8080\n" +
                "    API文档: http://localhost:8080/swagger-ui/\n" +
                "    监控端点: http://localhost:8080/actuator\n" +
                "    \n" +
                "    开发团队: Zero Carbon Team\n" +
                "    技术支持: admin@zerocarbon.com\n" +
                "=================================================================\n");
    }
}