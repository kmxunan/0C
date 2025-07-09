// 零碳园区数字孪生系统 - 前端性能监控
// 版本: 2.0
// 作者: 零碳园区开发团队
// 日期: 2025-06-15

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableResourceTiming: true,
      enableUserTiming: true,
      enableNavigationTiming: true,
      enableLongTaskObserver: true,
      enableMemoryMonitor: true,
      enableErrorTracking: true,
      reportInterval: 30000, // 30秒
      apiEndpoint: '/api/performance/metrics',
      maxMetricsBuffer: 100,
      ...options
    };

    this.metrics = [];
    this.observers = [];
    this.startTime = performance.now();
    this.sessionId = this.generateSessionId();
    
    this.init();
  }

  init() {
    // 页面加载性能监控
    if (this.options.enableNavigationTiming) {
      this.monitorNavigationTiming();
    }

    // 资源加载性能监控
    if (this.options.enableResourceTiming) {
      this.monitorResourceTiming();
    }

    // 用户自定义性能标记监控
    if (this.options.enableUserTiming) {
      this.monitorUserTiming();
    }

    // 长任务监控
    if (this.options.enableLongTaskObserver) {
      this.monitorLongTasks();
    }

    // 内存使用监控
    if (this.options.enableMemoryMonitor) {
      this.monitorMemoryUsage();
    }

    // 错误监控
    if (this.options.enableErrorTracking) {
      this.monitorErrors();
    }

    // 定期上报性能数据
    this.startReporting();

    // 页面卸载时上报剩余数据
    this.setupBeforeUnload();
  }

  // 生成会话ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 监控页面导航性能
  monitorNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          const metrics = {
            type: 'navigation',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            data: {
              // DNS查询时间
              dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
              // TCP连接时间
              tcpConnect: navigation.connectEnd - navigation.connectStart,
              // SSL握手时间
              sslConnect: navigation.secureConnectionStart > 0 
                ? navigation.connectEnd - navigation.secureConnectionStart : 0,
              // 请求响应时间
              requestResponse: navigation.responseEnd - navigation.requestStart,
              // DOM解析时间
              domParse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
              // 资源加载时间
              resourceLoad: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
              // 总加载时间
              totalLoad: navigation.loadEventEnd - navigation.navigationStart,
              // 首字节时间(TTFB)
              ttfb: navigation.responseStart - navigation.navigationStart,
              // 首次内容绘制(FCP)
              fcp: this.getFCP(),
              // 最大内容绘制(LCP)
              lcp: this.getLCP(),
              // 首次输入延迟(FID)
              fid: this.getFID(),
              // 累积布局偏移(CLS)
              cls: this.getCLS()
            }
          };
          this.addMetric(metrics);
        }
      }, 0);
    });
  }

  // 监控资源加载性能
  monitorResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          const metrics = {
            type: 'resource',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            data: {
              name: entry.name,
              type: this.getResourceType(entry.name),
              size: entry.transferSize || 0,
              duration: entry.duration,
              startTime: entry.startTime,
              dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
              tcpConnect: entry.connectEnd - entry.connectStart,
              requestResponse: entry.responseEnd - entry.requestStart,
              cached: entry.transferSize === 0 && entry.decodedBodySize > 0
            }
          };
          this.addMetric(metrics);
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  // 监控用户自定义性能标记
  monitorUserTiming() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        const metrics = {
          type: 'user-timing',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          data: {
            name: entry.name,
            entryType: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration || 0
          }
        };
        this.addMetric(metrics);
      });
    });
    
    observer.observe({ entryTypes: ['mark', 'measure'] });
    this.observers.push(observer);
  }

  // 监控长任务
  monitorLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            const metrics = {
              type: 'long-task',
              timestamp: Date.now(),
              sessionId: this.sessionId,
              data: {
                duration: entry.duration,
                startTime: entry.startTime,
                attribution: entry.attribution ? entry.attribution.map(attr => ({
                  name: attr.name,
                  containerType: attr.containerType,
                  containerSrc: attr.containerSrc,
                  containerId: attr.containerId,
                  containerName: attr.containerName
                })) : []
              }
            };
            this.addMetric(metrics);
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('Long task observer not supported:', e);
      }
    }
  }

  // 监控内存使用
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const metrics = {
          type: 'memory',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          data: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          }
        };
        this.addMetric(metrics);
      }, 10000); // 每10秒检查一次
    }
  }

  // 监控错误
  monitorErrors() {
    // JavaScript错误
    window.addEventListener('error', (event) => {
      const metrics = {
        type: 'javascript-error',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        data: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error ? event.error.stack : null,
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };
      this.addMetric(metrics);
    });

    // Promise拒绝错误
    window.addEventListener('unhandledrejection', (event) => {
      const metrics = {
        type: 'promise-rejection',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        data: {
          reason: event.reason ? event.reason.toString() : 'Unknown',
          stack: event.reason && event.reason.stack ? event.reason.stack : null,
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };
      this.addMetric(metrics);
    });

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const metrics = {
          type: 'resource-error',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          data: {
            tagName: event.target.tagName,
            source: event.target.src || event.target.href,
            message: 'Resource failed to load',
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        };
        this.addMetric(metrics);
      }
    }, true);
  }

  // 获取首次内容绘制时间
  getFCP() {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    return fcpEntry ? fcpEntry.startTime : null;
  }

  // 获取最大内容绘制时间
  getLCP() {
    return new Promise((resolve) => {
      let lcp = null;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.startTime;
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // 页面隐藏时停止观察
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          observer.disconnect();
          resolve(lcp);
        }
      });
    });
  }

  // 获取首次输入延迟
  getFID() {
    return new Promise((resolve) => {
      let fid = null;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          fid = entry.processingStart - entry.startTime;
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      
      // 页面隐藏时停止观察
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          observer.disconnect();
          resolve(fid);
        }
      });
    });
  }

  // 获取累积布局偏移
  getCLS() {
    return new Promise((resolve) => {
      let cls = 0;
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      
      // 页面隐藏时停止观察
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          observer.disconnect();
          resolve(cls);
        }
      });
    });
  }

  // 获取资源类型
  getResourceType(url) {
    const extension = url.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const scriptExts = ['js', 'jsx', 'ts', 'tsx'];
    const styleExts = ['css', 'less', 'scss', 'sass'];
    const fontExts = ['woff', 'woff2', 'ttf', 'eot', 'otf'];
    
    if (imageExts.includes(extension)) return 'image';
    if (scriptExts.includes(extension)) return 'script';
    if (styleExts.includes(extension)) return 'stylesheet';
    if (fontExts.includes(extension)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // 添加性能指标
  addMetric(metric) {
    this.metrics.push(metric);
    
    // 限制缓存大小
    if (this.metrics.length > this.options.maxMetricsBuffer) {
      this.metrics = this.metrics.slice(-this.options.maxMetricsBuffer);
    }
  }

  // 开始定期上报
  startReporting() {
    setInterval(() => {
      this.reportMetrics();
    }, this.options.reportInterval);
  }

  // 上报性能数据
  async reportMetrics() {
    if (this.metrics.length === 0) return;
    
    const metricsToSend = [...this.metrics];
    this.metrics = [];
    
    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          metrics: metricsToSend
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to report performance metrics:', response.status);
        // 失败时重新加入队列
        this.metrics.unshift(...metricsToSend);
      }
    } catch (error) {
      console.warn('Error reporting performance metrics:', error);
      // 失败时重新加入队列
      this.metrics.unshift(...metricsToSend);
    }
  }

  // 页面卸载时上报
  setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.metrics.length > 0) {
        // 使用sendBeacon确保数据能够发送
        const data = JSON.stringify({
          sessionId: this.sessionId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          metrics: this.metrics
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(this.options.apiEndpoint, data);
        }
      }
    });
  }

  // 手动标记性能点
  mark(name) {
    performance.mark(name);
  }

  // 手动测量性能区间
  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);
  }

  // 获取当前性能统计
  getStats() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      currentTime: performance.now(),
      metricsCount: this.metrics.length,
      observersCount: this.observers.length
    };
  }

  // 销毁监控器
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// 自动初始化性能监控
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
  
  // 自动启动监控（可通过配置禁用）
  if (!window.DISABLE_PERFORMANCE_MONITOR) {
    window.performanceMonitor = new PerformanceMonitor();
  }
}

export default PerformanceMonitor;