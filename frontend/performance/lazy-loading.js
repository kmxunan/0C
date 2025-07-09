// 零碳园区数字孪生系统 - 懒加载和代码分割优化
// 版本: 2.0
// 作者: 零碳园区开发团队
// 日期: 2025-06-15

import React, { Suspense, lazy } from 'react';
import { Spin } from 'antd';

// 加载状态组件
const LoadingSpinner = ({ tip = '加载中...' }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column'
  }}>
    <Spin size="large" tip={tip} />
  </div>
);

// 错误边界组件
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy load error:', error, errorInfo);
    // 上报错误到监控系统
    if (window.performanceMonitor) {
      window.performanceMonitor.addMetric({
        type: 'lazy-load-error',
        timestamp: Date.now(),
        sessionId: window.performanceMonitor.sessionId,
        data: {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href
        }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#ff4d4f'
        }}>
          <h3>模块加载失败</h3>
          <p>请刷新页面重试</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 高阶组件：懒加载包装器
const withLazyLoading = (importFunc, fallback = <LoadingSpinner />) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <LazyLoadErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

// 预加载函数
const preloadComponent = (importFunc) => {
  const componentImport = importFunc();
  return componentImport;
};

// 智能预加载管理器
class PreloadManager {
  constructor() {
    this.preloadQueue = new Map();
    this.preloadedComponents = new Set();
    this.isIdle = false;
    this.setupIdleCallback();
  }

  // 设置空闲时间回调
  setupIdleCallback() {
    if ('requestIdleCallback' in window) {
      const idleCallback = (deadline) => {
        this.isIdle = true;
        this.processPreloadQueue(deadline);
        
        // 继续监听下一个空闲时间
        requestIdleCallback(idleCallback, { timeout: 5000 });
      };
      
      requestIdleCallback(idleCallback, { timeout: 5000 });
    } else {
      // 降级方案
      setTimeout(() => {
        this.isIdle = true;
        this.processPreloadQueue({ timeRemaining: () => 50 });
      }, 2000);
    }
  }

  // 处理预加载队列
  processPreloadQueue(deadline) {
    while (deadline.timeRemaining() > 0 && this.preloadQueue.size > 0) {
      const [key, importFunc] = this.preloadQueue.entries().next().value;
      this.preloadQueue.delete(key);
      
      if (!this.preloadedComponents.has(key)) {
        this.executePreload(key, importFunc);
      }
    }
  }

  // 执行预加载
  async executePreload(key, importFunc) {
    try {
      const startTime = performance.now();
      await importFunc();
      const endTime = performance.now();
      
      this.preloadedComponents.add(key);
      
      // 记录预加载性能
      if (window.performanceMonitor) {
        window.performanceMonitor.addMetric({
          type: 'component-preload',
          timestamp: Date.now(),
          sessionId: window.performanceMonitor.sessionId,
          data: {
            component: key,
            duration: endTime - startTime,
            success: true
          }
        });
      }
    } catch (error) {
      console.warn(`Failed to preload component ${key}:`, error);
      
      // 记录预加载错误
      if (window.performanceMonitor) {
        window.performanceMonitor.addMetric({
          type: 'component-preload-error',
          timestamp: Date.now(),
          sessionId: window.performanceMonitor.sessionId,
          data: {
            component: key,
            error: error.message,
            success: false
          }
        });
      }
    }
  }

  // 添加到预加载队列
  addToQueue(key, importFunc, priority = 'normal') {
    if (this.preloadedComponents.has(key)) {
      return; // 已经预加载过
    }

    if (priority === 'high' && this.isIdle) {
      // 高优先级立即执行
      this.executePreload(key, importFunc);
    } else {
      // 添加到队列
      this.preloadQueue.set(key, importFunc);
    }
  }

  // 检查是否已预加载
  isPreloaded(key) {
    return this.preloadedComponents.has(key);
  }
}

// 全局预加载管理器实例
const preloadManager = new PreloadManager();

// 路由级别的懒加载组件
export const LazyRoutes = {
  // 主页面
  Dashboard: withLazyLoading(
    () => import('../pages/Dashboard'),
    <LoadingSpinner tip="加载仪表板..." />
  ),
  
  // 能源监测模块
  EnergyMonitoring: withLazyLoading(
    () => import('../modules/energy-monitoring/EnergyMonitoring'),
    <LoadingSpinner tip="加载能源监测模块..." />
  ),
  
  EnergyConsumption: withLazyLoading(
    () => import('../modules/energy-monitoring/EnergyConsumption'),
    <LoadingSpinner tip="加载能耗分析..." />
  ),
  
  EnergyEfficiency: withLazyLoading(
    () => import('../modules/energy-monitoring/EnergyEfficiency'),
    <LoadingSpinner tip="加载能效分析..." />
  ),
  
  // 碳核算模块
  CarbonAccounting: withLazyLoading(
    () => import('../modules/carbon-accounting/CarbonAccounting'),
    <LoadingSpinner tip="加载碳核算模块..." />
  ),
  
  CarbonEmission: withLazyLoading(
    () => import('../modules/carbon-accounting/CarbonEmission'),
    <LoadingSpinner tip="加载碳排放分析..." />
  ),
  
  CarbonFootprint: withLazyLoading(
    () => import('../modules/carbon-accounting/CarbonFootprint'),
    <LoadingSpinner tip="加载碳足迹分析..." />
  ),
  
  // 虚拟电厂模块
  VirtualPowerPlant: withLazyLoading(
    () => import('../modules/virtual-power-plant/VirtualPowerPlant'),
    <LoadingSpinner tip="加载虚拟电厂模块..." />
  ),
  
  PowerGeneration: withLazyLoading(
    () => import('../modules/virtual-power-plant/PowerGeneration'),
    <LoadingSpinner tip="加载发电管理..." />
  ),
  
  PowerStorage: withLazyLoading(
    () => import('../modules/virtual-power-plant/PowerStorage'),
    <LoadingSpinner tip="加载储能管理..." />
  ),
  
  PowerTrading: withLazyLoading(
    () => import('../modules/virtual-power-plant/PowerTrading'),
    <LoadingSpinner tip="加载电力交易..." />
  ),
  
  // 资源循环模块
  ResourceCirculation: withLazyLoading(
    () => import('../modules/resource-circulation/ResourceCirculation'),
    <LoadingSpinner tip="加载资源循环模块..." />
  ),
  
  WasteManagement: withLazyLoading(
    () => import('../modules/resource-circulation/WasteManagement'),
    <LoadingSpinner tip="加载废物管理..." />
  ),
  
  WaterRecycling: withLazyLoading(
    () => import('../modules/resource-circulation/WaterRecycling'),
    <LoadingSpinner tip="加载水资源循环..." />
  ),
  
  // 数据治理模块
  DataGovernance: withLazyLoading(
    () => import('../modules/data-governance/DataGovernance'),
    <LoadingSpinner tip="加载数据治理模块..." />
  ),
  
  DataQuality: withLazyLoading(
    () => import('../modules/data-governance/DataQuality'),
    <LoadingSpinner tip="加载数据质量管理..." />
  ),
  
  DataLineage: withLazyLoading(
    () => import('../modules/data-governance/DataLineage'),
    <LoadingSpinner tip="加载数据血缘分析..." />
  ),
  
  // 绿电交易模块
  GreenElectricity: withLazyLoading(
    () => import('../modules/green-electricity/GreenElectricity'),
    <LoadingSpinner tip="加载绿电交易模块..." />
  ),
  
  GreenCertificate: withLazyLoading(
    () => import('../modules/green-electricity/GreenCertificate'),
    <LoadingSpinner tip="加载绿证管理..." />
  ),
  
  // 系统设置
  Settings: withLazyLoading(
    () => import('../pages/Settings'),
    <LoadingSpinner tip="加载系统设置..." />
  ),
  
  UserManagement: withLazyLoading(
    () => import('../pages/UserManagement'),
    <LoadingSpinner tip="加载用户管理..." />
  ),
  
  SystemMonitoring: withLazyLoading(
    () => import('../pages/SystemMonitoring'),
    <LoadingSpinner tip="加载系统监控..." />
  )
};

// 组件级别的懒加载
export const LazyComponents = {
  // 图表组件
  EnergyChart: withLazyLoading(
    () => import('../components/charts/EnergyChart'),
    <LoadingSpinner tip="加载图表..." />
  ),
  
  CarbonChart: withLazyLoading(
    () => import('../components/charts/CarbonChart'),
    <LoadingSpinner tip="加载图表..." />
  ),
  
  PowerChart: withLazyLoading(
    () => import('../components/charts/PowerChart'),
    <LoadingSpinner tip="加载图表..." />
  ),
  
  // 数据表格
  DataTable: withLazyLoading(
    () => import('../components/tables/DataTable'),
    <LoadingSpinner tip="加载数据表格..." />
  ),
  
  // 地图组件
  EnergyMap: withLazyLoading(
    () => import('../components/maps/EnergyMap'),
    <LoadingSpinner tip="加载地图..." />
  ),
  
  // 3D可视化
  ThreeDVisualization: withLazyLoading(
    () => import('../components/visualization/ThreeDVisualization'),
    <LoadingSpinner tip="加载3D可视化..." />
  )
};

// 预加载策略
export const PreloadStrategies = {
  // 基于路由的预加载
  preloadByRoute: (currentRoute) => {
    const routePreloadMap = {
      '/dashboard': ['EnergyMonitoring', 'CarbonAccounting'],
      '/energy': ['EnergyConsumption', 'EnergyEfficiency'],
      '/carbon': ['CarbonEmission', 'CarbonFootprint'],
      '/power': ['PowerGeneration', 'PowerStorage', 'PowerTrading'],
      '/resource': ['WasteManagement', 'WaterRecycling'],
      '/data': ['DataQuality', 'DataLineage'],
      '/green': ['GreenCertificate']
    };
    
    const componentsToPreload = routePreloadMap[currentRoute] || [];
    componentsToPreload.forEach(componentName => {
      if (LazyRoutes[componentName]) {
        preloadManager.addToQueue(
          componentName,
          () => import(`../modules/${componentName}`),
          'normal'
        );
      }
    });
  },
  
  // 基于用户行为的预加载
  preloadByUserBehavior: (userActions) => {
    // 分析用户最常访问的模块
    const frequentModules = userActions
      .filter(action => action.type === 'route_visit')
      .reduce((acc, action) => {
        acc[action.route] = (acc[action.route] || 0) + 1;
        return acc;
      }, {});
    
    // 预加载访问频率最高的模块
    Object.entries(frequentModules)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([route]) => {
        PreloadStrategies.preloadByRoute(route);
      });
  },
  
  // 基于时间的预加载
  preloadByTime: () => {
    const hour = new Date().getHours();
    
    // 工作时间预加载业务模块
    if (hour >= 9 && hour <= 18) {
      ['EnergyMonitoring', 'CarbonAccounting', 'VirtualPowerPlant'].forEach(componentName => {
        preloadManager.addToQueue(
          componentName,
          () => import(`../modules/${componentName}`),
          'normal'
        );
      });
    }
    
    // 非工作时间预加载报表模块
    else {
      ['DataGovernance', 'SystemMonitoring'].forEach(componentName => {
        preloadManager.addToQueue(
          componentName,
          () => import(`../pages/${componentName}`),
          'low'
        );
      });
    }
  },
  
  // 基于网络状况的预加载
  preloadByNetwork: () => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // 快速网络时积极预加载
      if (connection.effectiveType === '4g' && !connection.saveData) {
        Object.keys(LazyRoutes).forEach(componentName => {
          preloadManager.addToQueue(
            componentName,
            () => import(`../modules/${componentName}`),
            'low'
          );
        });
      }
      
      // 慢速网络时只预加载核心模块
      else if (connection.effectiveType === '2g' || connection.saveData) {
        ['Dashboard', 'EnergyMonitoring'].forEach(componentName => {
          preloadManager.addToQueue(
            componentName,
            () => import(`../pages/${componentName}`),
            'high'
          );
        });
      }
    }
  }
};

// 智能预加载初始化
export const initializeSmartPreloading = (userPreferences = {}) => {
  // 延迟执行，避免影响首屏加载
  setTimeout(() => {
    // 基于网络状况预加载
    PreloadStrategies.preloadByNetwork();
    
    // 基于时间预加载
    PreloadStrategies.preloadByTime();
    
    // 基于用户偏好预加载
    if (userPreferences.favoriteModules) {
      userPreferences.favoriteModules.forEach(module => {
        preloadManager.addToQueue(
          module,
          () => import(`../modules/${module}`),
          'high'
        );
      });
    }
  }, 3000); // 3秒后开始预加载
};

// 导出工具函数
export {
  withLazyLoading,
  preloadComponent,
  preloadManager,
  LoadingSpinner,
  LazyLoadErrorBoundary
};

export default {
  LazyRoutes,
  LazyComponents,
  PreloadStrategies,
  initializeSmartPreloading
};