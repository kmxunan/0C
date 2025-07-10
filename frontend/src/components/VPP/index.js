/**
 * VPP模块组件导出文件
 * 统一导出所有VPP相关组件
 */

// 导入所有VPP组件
import TradingStrategyEditor from './TradingStrategyEditor';
import BacktestResultsViewer from './BacktestResultsViewer';
import ResourceAggregationManager from './ResourceAggregationManager';
import MarketConnectorDashboard from './MarketConnectorDashboard';
import RealTimeMonitoringDashboard from './RealTimeMonitoringDashboard';
import PerformanceAnalytics from './PerformanceAnalytics';

// 统一导出
export {
  TradingStrategyEditor,
  BacktestResultsViewer,
  ResourceAggregationManager,
  MarketConnectorDashboard,
  RealTimeMonitoringDashboard,
  PerformanceAnalytics
};

// 默认导出（可选）
const VPPComponents = {
  TradingStrategyEditor,
  BacktestResultsViewer,
  ResourceAggregationManager,
  MarketConnectorDashboard,
  RealTimeMonitoringDashboard,
  PerformanceAnalytics
};

export default VPPComponents;

// VPP模块路由配置
export const vppRoutes = [
  {
    path: '/vpp/strategy-editor',
    component: TradingStrategyEditor,
    name: '策略编辑器',
    icon: 'EditIcon',
    description: 'IFTTT风格的可视化交易策略编辑器'
  },
  {
    path: '/vpp/backtest-results',
    component: BacktestResultsViewer,
    name: '回测结果',
    icon: 'AssessmentIcon',
    description: '策略回测结果展示和分析'
  },
  {
    path: '/vpp/resource-aggregation',
    component: ResourceAggregationManager,
    name: '资源聚合',
    icon: 'AccountTreeIcon',
    description: 'VPP资源聚合管理界面'
  },
  {
    path: '/vpp/market-connector',
    component: MarketConnectorDashboard,
    name: '市场连接',
    icon: 'LinkIcon',
    description: '电力市场连接状态监控'
  },
  {
    path: '/vpp/monitoring',
    component: RealTimeMonitoringDashboard,
    name: '实时监控',
    icon: 'DashboardIcon',
    description: 'VPP运行状态实时监控'
  },
  {
    path: '/vpp/analytics',
    component: PerformanceAnalytics,
    name: '性能分析',
    icon: 'AnalyticsIcon',
    description: 'VPP性能指标分析和报告'
  }
];

// VPP模块菜单配置
export const vppMenuConfig = {
  title: '虚拟电厂',
  icon: 'PowerIcon',
  children: [
    {
      title: '实时监控',
      path: '/vpp/monitoring',
      icon: 'DashboardIcon'
    },
    {
      title: '策略管理',
      icon: 'SettingsIcon',
      children: [
        {
          title: '策略编辑器',
          path: '/vpp/strategy-editor',
          icon: 'EditIcon'
        },
        {
          title: '回测结果',
          path: '/vpp/backtest-results',
          icon: 'AssessmentIcon'
        }
      ]
    },
    {
      title: '资源管理',
      icon: 'DeviceHubIcon',
      children: [
        {
          title: '资源聚合',
          path: '/vpp/resource-aggregation',
          icon: 'AccountTreeIcon'
        },
        {
          title: '市场连接',
          path: '/vpp/market-connector',
          icon: 'LinkIcon'
        }
      ]
    },
    {
      title: '分析报告',
      icon: 'AnalyticsIcon',
      children: [
        {
          title: '性能分析',
          path: '/vpp/analytics',
          icon: 'AnalyticsIcon'
        }
      ]
    }
  ]
};

// VPP模块权限配置
export const vppPermissions = {
  'vpp.monitoring.view': '查看实时监控',
  'vpp.strategy.view': '查看交易策略',
  'vpp.strategy.edit': '编辑交易策略',
  'vpp.strategy.execute': '执行交易策略',
  'vpp.resource.view': '查看资源信息',
  'vpp.resource.manage': '管理VPP资源',
  'vpp.market.view': '查看市场连接',
  'vpp.market.manage': '管理市场连接',
  'vpp.analytics.view': '查看性能分析',
  'vpp.analytics.export': '导出分析报告'
};

// VPP模块API端点配置
export const vppApiEndpoints = {
  // 策略相关
  strategies: '/api/vpp/strategies',
  strategyBacktest: '/api/vpp/strategies/backtest',
  strategyExecution: '/api/vpp/strategies/execution',
  
  // 资源相关
  resources: '/api/vpp/resources',
  resourceAggregation: '/api/vpp/resources/aggregation',
  resourceStatus: '/api/vpp/resources/status',
  
  // 市场相关
  marketConnectors: '/api/vpp/market/connectors',
  marketData: '/api/vpp/market/data',
  marketStatus: '/api/vpp/market/status',
  
  // 监控相关
  realTimeData: '/api/vpp/monitoring/realtime',
  systemStatus: '/api/vpp/monitoring/status',
  alerts: '/api/vpp/monitoring/alerts',
  
  // 分析相关
  performanceMetrics: '/api/vpp/analytics/performance',
  reports: '/api/vpp/analytics/reports',
  benchmarks: '/api/vpp/analytics/benchmarks'
};

// VPP模块常量配置
export const vppConstants = {
  // 刷新间隔（毫秒）
  REFRESH_INTERVALS: {
    REAL_TIME: 5000,
    MONITORING: 10000,
    ANALYTICS: 30000
  },
  
  // 图表颜色主题
  CHART_COLORS: {
    PRIMARY: '#1976d2',
    SUCCESS: '#2e7d32',
    WARNING: '#ed6c02',
    ERROR: '#d32f2f',
    INFO: '#0288d1'
  },
  
  // 资源类型
  RESOURCE_TYPES: {
    SOLAR: 'solar',
    WIND: 'wind',
    BATTERY: 'battery',
    LOAD: 'load',
    GENERATOR: 'generator'
  },
  
  // 策略状态
  STRATEGY_STATUS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    TESTING: 'testing',
    ERROR: 'error'
  },
  
  // 市场类型
  MARKET_TYPES: {
    SPOT: 'spot',
    FUTURES: 'futures',
    ANCILLARY: 'ancillary',
    CAPACITY: 'capacity'
  }
};

// VPP模块工具函数
export const vppUtils = {
  // 格式化数字
  formatNumber: (num, decimals = 2) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
    return Number(num).toFixed(decimals);
  },
  
  // 格式化百分比
  formatPercentage: (num) => {
    return `${(num * 100).toFixed(1)}%`;
  },
  
  // 格式化货币
  formatCurrency: (amount, currency = '¥') => {
    return `${currency}${vppUtils.formatNumber(amount)}`;
  },
  
  // 获取资源状态颜色
  getResourceStatusColor: (status) => {
    switch (status) {
      case 'online':
      case 'active':
        return 'success';
      case 'offline':
      case 'inactive':
        return 'error';
      case 'maintenance':
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  },
  
  // 获取策略类型图标
  getStrategyTypeIcon: (type) => {
    switch (type) {
      case 'arbitrage':
        return 'TrendingUpIcon';
      case 'peak_shaving':
        return 'ShowChartIcon';
      case 'load_following':
        return 'TimelineIcon';
      default:
        return 'SettingsIcon';
    }
  },
  
  // 生成唯一ID
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  // 深度克隆对象
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },
  
  // 防抖函数
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};