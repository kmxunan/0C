/**
 * 测试配置文件
 * 统一管理所有测试的配置参数
 */

export const testConfig = {
  // 服务URL配置
  services: {
    backend: {
      url: 'http://localhost:3000',
      healthEndpoint: '/health',
      timeout: 10000
    },
    frontend: {
      url: 'http://localhost:3001',
      timeout: 15000
    }
  },
  
  // 测试超时配置
  timeouts: {
    api: 30000,        // API测试超时 (30秒)
    integration: 300000, // 集成测试超时 (5分钟)
    pwa: 180000,       // PWA测试超时 (3分钟)
    pageLoad: 30000,   // 页面加载超时 (30秒)
    element: 10000     // 元素等待超时 (10秒)
  },
  
  // Puppeteer配置
  puppeteer: {
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },
  
  // 移动端测试配置
  mobile: {
    devices: [
      {
        name: 'iPhone 12',
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        name: 'iPad',
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        name: 'Android Phone',
        viewport: { width: 360, height: 640 },
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36'
      }
    ]
  },
  
  // API测试配置
  api: {
    // 测试数据
    testData: {
      device: {
        name: '测试设备001',
        type: 'sensor',
        location: '测试区域A',
        status: 'active'
      },
      energyData: {
        deviceId: 'test-device-001',
        timestamp: new Date().toISOString(),
        consumption: 100.5,
        voltage: 220,
        current: 10.2,
        power: 2244
      },
      carbonData: {
        source: 'electricity',
        amount: 1000,
        factor: 0.5703,
        timestamp: new Date().toISOString()
      }
    },
    
    // 请求配置
    request: {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Runner/1.0'
      }
    }
  },
  
  // 性能测试配置
  performance: {
    thresholds: {
      // 页面加载时间阈值 (毫秒)
      pageLoad: 3000,
      // 首次内容绘制时间阈值 (毫秒)
      firstContentfulPaint: 1500,
      // 最大内容绘制时间阈值 (毫秒)
      largestContentfulPaint: 2500,
      // 累积布局偏移阈值
      cumulativeLayoutShift: 0.1,
      // 首次输入延迟阈值 (毫秒)
      firstInputDelay: 100
    }
  },
  
  // PWA测试配置
  pwa: {
    // Service Worker配置
    serviceWorker: {
      expectedFiles: [
        '/static/js/',
        '/static/css/',
        '/manifest.json',
        '/'
      ],
      cacheNames: [
        'static-resources',
        'api-cache',
        'runtime-cache'
      ]
    },
    
    // Manifest配置
    manifest: {
      requiredFields: [
        'name',
        'short_name',
        'start_url',
        'display',
        'theme_color',
        'background_color',
        'icons'
      ],
      expectedValues: {
        name: '零碳园区数字孪生能碳管理系统',
        short_name: '零碳园区',
        display: 'standalone'
      }
    }
  },
  
  // 测试报告配置
  reporting: {
    // 输出目录
    outputDir: './test-results',
    
    // 报告格式
    formats: ['console', 'json', 'html'],
    
    // 截图配置
    screenshots: {
      onFailure: true,
      onSuccess: false,
      quality: 80,
      fullPage: true
    },
    
    // 视频录制配置
    video: {
      enabled: false,
      dir: './test-results/videos'
    }
  },
  
  // 重试配置
  retry: {
    // API测试重试次数
    api: 3,
    // 页面操作重试次数
    pageAction: 2,
    // 元素查找重试次数
    elementFind: 3,
    // 重试间隔 (毫秒)
    delay: 1000
  },
  
  // 并发配置
  concurrency: {
    // 最大并发测试数
    maxConcurrent: 3,
    // API测试并发数
    apiTests: 5,
    // 浏览器实例数
    browsers: 2
  },
  
  // 环境配置
  environment: {
    // 当前环境
    current: process.env.NODE_ENV || 'test',
    
    // 环境特定配置
    test: {
      logLevel: 'info',
      verbose: true,
      cleanup: true
    },
    
    development: {
      logLevel: 'debug',
      verbose: true,
      cleanup: false
    },
    
    production: {
      logLevel: 'error',
      verbose: false,
      cleanup: true
    }
  },
  
  // 数据库配置 (用于测试数据清理)
  database: {
    cleanup: {
      // 测试后是否清理数据
      enabled: true,
      // 保留的测试数据天数
      retentionDays: 1,
      // 需要清理的集合
      collections: [
        'devices',
        'energyData',
        'carbonEmissions',
        'alerts',
        'maintenanceRecords'
      ]
    }
  }
};

// 获取当前环境配置
export function getCurrentConfig() {
  const env = testConfig.environment.current;
  return {
    ...testConfig,
    ...testConfig.environment[env]
  };
}

// 验证配置
export function validateConfig() {
  const errors = [];
  
  // 检查必需的配置
  if (!testConfig.services.backend.url) {
    errors.push('Backend URL is required');
  }
  
  if (!testConfig.services.frontend.url) {
    errors.push('Frontend URL is required');
  }
  
  // 检查超时配置
  Object.entries(testConfig.timeouts).forEach(([key, value]) => {
    if (typeof value !== 'number' || value <= 0) {
      errors.push(`Invalid timeout value for ${key}: ${value}`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

// 导出默认配置
export default testConfig;