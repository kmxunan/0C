// 零碳园区数字孪生系统 - 响应式设计配置
// 版本: 2.0
// 作者: 零碳园区开发团队
// 日期: 2025-06-15

import React, { useState, useEffect, useCallback } from 'react';
import { Grid } from 'antd';

// 断点配置
const BREAKPOINTS = {
  xs: 0,      // 超小屏幕 < 576px
  sm: 576,    // 小屏幕 ≥ 576px
  md: 768,    // 中等屏幕 ≥ 768px
  lg: 992,    // 大屏幕 ≥ 992px
  xl: 1200,   // 超大屏幕 ≥ 1200px
  xxl: 1600   // 超超大屏幕 ≥ 1600px
};

// 设备类型
const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
  LARGE_DESKTOP: 'large_desktop'
};

// 响应式配置
const RESPONSIVE_CONFIG = {
  // 容器最大宽度
  CONTAINER_MAX_WIDTH: {
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
    xxl: '1320px'
  },
  
  // 栅格间距
  GRID_GUTTER: {
    xs: [8, 8],
    sm: [16, 16],
    md: [24, 16],
    lg: [32, 24],
    xl: [32, 24],
    xxl: [32, 24]
  },
  
  // 组件尺寸
  COMPONENT_SIZES: {
    xs: {
      button: 'small',
      input: 'small',
      table: 'small',
      card: 'small'
    },
    sm: {
      button: 'small',
      input: 'middle',
      table: 'small',
      card: 'default'
    },
    md: {
      button: 'middle',
      input: 'middle',
      table: 'middle',
      card: 'default'
    },
    lg: {
      button: 'middle',
      input: 'middle',
      table: 'middle',
      card: 'default'
    },
    xl: {
      button: 'large',
      input: 'large',
      table: 'middle',
      card: 'default'
    },
    xxl: {
      button: 'large',
      input: 'large',
      table: 'middle',
      card: 'default'
    }
  },
  
  // 字体大小
  FONT_SIZES: {
    xs: {
      h1: '24px',
      h2: '20px',
      h3: '18px',
      h4: '16px',
      body: '14px',
      small: '12px'
    },
    sm: {
      h1: '28px',
      h2: '24px',
      h3: '20px',
      h4: '18px',
      body: '14px',
      small: '12px'
    },
    md: {
      h1: '32px',
      h2: '28px',
      h3: '24px',
      h4: '20px',
      body: '16px',
      small: '14px'
    },
    lg: {
      h1: '36px',
      h2: '32px',
      h3: '28px',
      h4: '24px',
      body: '16px',
      small: '14px'
    },
    xl: {
      h1: '40px',
      h2: '36px',
      h3: '32px',
      h4: '28px',
      body: '18px',
      small: '16px'
    },
    xxl: {
      h1: '48px',
      h2: '40px',
      h3: '36px',
      h4: '32px',
      body: '18px',
      small: '16px'
    }
  },
  
  // 布局配置
  LAYOUT_CONFIG: {
    xs: {
      siderWidth: 0,
      siderCollapsed: true,
      headerHeight: 56,
      contentPadding: '16px 8px',
      showBreadcrumb: false,
      showSider: false
    },
    sm: {
      siderWidth: 200,
      siderCollapsed: true,
      headerHeight: 64,
      contentPadding: '16px 16px',
      showBreadcrumb: true,
      showSider: true
    },
    md: {
      siderWidth: 200,
      siderCollapsed: false,
      headerHeight: 64,
      contentPadding: '24px 24px',
      showBreadcrumb: true,
      showSider: true
    },
    lg: {
      siderWidth: 256,
      siderCollapsed: false,
      headerHeight: 64,
      contentPadding: '24px 32px',
      showBreadcrumb: true,
      showSider: true
    },
    xl: {
      siderWidth: 256,
      siderCollapsed: false,
      headerHeight: 64,
      contentPadding: '32px 32px',
      showBreadcrumb: true,
      showSider: true
    },
    xxl: {
      siderWidth: 280,
      siderCollapsed: false,
      headerHeight: 64,
      contentPadding: '32px 48px',
      showBreadcrumb: true,
      showSider: true
    }
  },
  
  // 表格配置
  TABLE_CONFIG: {
    xs: {
      size: 'small',
      scroll: { x: 800 },
      pagination: {
        size: 'small',
        showSizeChanger: false,
        showQuickJumper: false,
        showTotal: false,
        pageSize: 5
      },
      hideColumns: ['description', 'createTime', 'updateTime']
    },
    sm: {
      size: 'small',
      scroll: { x: 1000 },
      pagination: {
        size: 'small',
        showSizeChanger: false,
        showQuickJumper: false,
        showTotal: true,
        pageSize: 10
      },
      hideColumns: ['description', 'createTime']
    },
    md: {
      size: 'middle',
      scroll: { x: 1200 },
      pagination: {
        size: 'default',
        showSizeChanger: true,
        showQuickJumper: false,
        showTotal: true,
        pageSize: 10
      },
      hideColumns: ['description']
    },
    lg: {
      size: 'middle',
      scroll: { x: 1400 },
      pagination: {
        size: 'default',
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: true,
        pageSize: 15
      },
      hideColumns: []
    },
    xl: {
      size: 'middle',
      scroll: { x: 1600 },
      pagination: {
        size: 'default',
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: true,
        pageSize: 20
      },
      hideColumns: []
    },
    xxl: {
      size: 'middle',
      scroll: { x: 1800 },
      pagination: {
        size: 'default',
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: true,
        pageSize: 20
      },
      hideColumns: []
    }
  },
  
  // 图表配置
  CHART_CONFIG: {
    xs: {
      height: 200,
      legend: {
        show: false
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '15%'
      },
      tooltip: {
        trigger: 'axis',
        confine: true
      }
    },
    sm: {
      height: 250,
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: 0
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '20%'
      },
      tooltip: {
        trigger: 'axis',
        confine: true
      }
    },
    md: {
      height: 300,
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: 0
      },
      grid: {
        left: '8%',
        right: '8%',
        top: '10%',
        bottom: '15%'
      },
      tooltip: {
        trigger: 'axis'
      }
    },
    lg: {
      height: 350,
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: 0
      },
      grid: {
        left: '6%',
        right: '6%',
        top: '10%',
        bottom: '12%'
      },
      tooltip: {
        trigger: 'axis'
      }
    },
    xl: {
      height: 400,
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: 0
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '8%',
        bottom: '10%'
      },
      tooltip: {
        trigger: 'axis'
      }
    },
    xxl: {
      height: 450,
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: 0
      },
      grid: {
        left: '4%',
        right: '4%',
        top: '6%',
        bottom: '8%'
      },
      tooltip: {
        trigger: 'axis'
      }
    }
  }
};

// 响应式管理器
class ResponsiveManager {
  constructor() {
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.listeners = new Set();
    this.setupResizeListener();
  }

  // 获取当前断点
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width >= BREAKPOINTS.xxl) return 'xxl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }

  // 获取设备类型
  getDeviceType() {
    const breakpoint = this.currentBreakpoint;
    
    if (breakpoint === 'xs') return DEVICE_TYPES.MOBILE;
    if (breakpoint === 'sm' || breakpoint === 'md') return DEVICE_TYPES.TABLET;
    if (breakpoint === 'lg' || breakpoint === 'xl') return DEVICE_TYPES.DESKTOP;
    return DEVICE_TYPES.LARGE_DESKTOP;
  }

  // 检查是否为移动设备
  isMobile() {
    return this.getDeviceType() === DEVICE_TYPES.MOBILE;
  }

  // 检查是否为平板设备
  isTablet() {
    return this.getDeviceType() === DEVICE_TYPES.TABLET;
  }

  // 检查是否为桌面设备
  isDesktop() {
    const deviceType = this.getDeviceType();
    return deviceType === DEVICE_TYPES.DESKTOP || deviceType === DEVICE_TYPES.LARGE_DESKTOP;
  }

  // 设置窗口大小变化监听器
  setupResizeListener() {
    let resizeTimer;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newBreakpoint = this.getCurrentBreakpoint();
        
        if (newBreakpoint !== this.currentBreakpoint) {
          const oldBreakpoint = this.currentBreakpoint;
          this.currentBreakpoint = newBreakpoint;
          this.notifyListeners(newBreakpoint, oldBreakpoint);
        }
      }, 150); // 防抖处理
    };
    
    window.addEventListener('resize', handleResize);
    
    // 返回清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }

  // 添加断点变化监听器
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 通知监听器
  notifyListeners(newBreakpoint, oldBreakpoint) {
    this.listeners.forEach(callback => {
      try {
        callback(newBreakpoint, oldBreakpoint);
      } catch (error) {
        console.error('Responsive listener error:', error);
      }
    });
  }

  // 获取响应式配置
  getConfig(configType, breakpoint = this.currentBreakpoint) {
    const config = RESPONSIVE_CONFIG[configType.toUpperCase()];
    return config ? config[breakpoint] : null;
  }

  // 获取栅格配置
  getGridConfig(breakpoint = this.currentBreakpoint) {
    return {
      gutter: RESPONSIVE_CONFIG.GRID_GUTTER[breakpoint],
      breakpoint: breakpoint
    };
  }

  // 获取布局配置
  getLayoutConfig(breakpoint = this.currentBreakpoint) {
    return RESPONSIVE_CONFIG.LAYOUT_CONFIG[breakpoint];
  }

  // 获取表格配置
  getTableConfig(breakpoint = this.currentBreakpoint) {
    return RESPONSIVE_CONFIG.TABLE_CONFIG[breakpoint];
  }

  // 获取图表配置
  getChartConfig(breakpoint = this.currentBreakpoint) {
    return RESPONSIVE_CONFIG.CHART_CONFIG[breakpoint];
  }

  // 获取组件尺寸
  getComponentSize(component, breakpoint = this.currentBreakpoint) {
    const sizes = RESPONSIVE_CONFIG.COMPONENT_SIZES[breakpoint];
    return sizes ? sizes[component] : 'middle';
  }

  // 获取字体大小
  getFontSize(type, breakpoint = this.currentBreakpoint) {
    const sizes = RESPONSIVE_CONFIG.FONT_SIZES[breakpoint];
    return sizes ? sizes[type] : '16px';
  }

  // 媒体查询匹配
  matchMedia(query) {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }

  // 获取断点媒体查询
  getBreakpointQuery(breakpoint) {
    const minWidth = BREAKPOINTS[breakpoint];
    const breakpointKeys = Object.keys(BREAKPOINTS);
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[currentIndex + 1];
    
    if (nextBreakpoint) {
      const maxWidth = BREAKPOINTS[nextBreakpoint] - 1;
      return `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
    } else {
      return `(min-width: ${minWidth}px)`;
    }
  }
}

// 创建全局响应式管理器实例
const responsiveManager = new ResponsiveManager();

// 响应式Hook
const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState(responsiveManager.currentBreakpoint);
  const [deviceType, setDeviceType] = useState(responsiveManager.getDeviceType());
  
  useEffect(() => {
    const unsubscribe = responsiveManager.addListener((newBreakpoint) => {
      setBreakpoint(newBreakpoint);
      setDeviceType(responsiveManager.getDeviceType());
    });
    
    return unsubscribe;
  }, []);
  
  return {
    breakpoint,
    deviceType,
    isMobile: responsiveManager.isMobile(),
    isTablet: responsiveManager.isTablet(),
    isDesktop: responsiveManager.isDesktop(),
    getConfig: responsiveManager.getConfig.bind(responsiveManager),
    getLayoutConfig: responsiveManager.getLayoutConfig.bind(responsiveManager),
    getTableConfig: responsiveManager.getTableConfig.bind(responsiveManager),
    getChartConfig: responsiveManager.getChartConfig.bind(responsiveManager),
    getComponentSize: responsiveManager.getComponentSize.bind(responsiveManager),
    getFontSize: responsiveManager.getFontSize.bind(responsiveManager)
  };
};

// 响应式容器组件
const ResponsiveContainer = ({ children, className = '', style = {} }) => {
  const { breakpoint } = useResponsive();
  const maxWidth = RESPONSIVE_CONFIG.CONTAINER_MAX_WIDTH[breakpoint];
  
  const containerStyle = {
    width: '100%',
    maxWidth: maxWidth,
    margin: '0 auto',
    padding: '0 16px',
    ...style
  };
  
  return (
    <div className={`responsive-container ${className}`} style={containerStyle}>
      {children}
    </div>
  );
};

// 响应式栅格组件
const ResponsiveGrid = ({ children, ...props }) => {
  const { breakpoint } = useResponsive();
  const gridConfig = responsiveManager.getGridConfig(breakpoint);
  
  return (
    <Grid.Row gutter={gridConfig.gutter} {...props}>
      {children}
    </Grid.Row>
  );
};

// 响应式列组件
const ResponsiveCol = ({ xs, sm, md, lg, xl, xxl, children, ...props }) => {
  const colProps = {
    xs: xs || 24,
    sm: sm || xs || 24,
    md: md || sm || xs || 12,
    lg: lg || md || sm || xs || 8,
    xl: xl || lg || md || sm || xs || 6,
    xxl: xxl || xl || lg || md || sm || xs || 6,
    ...props
  };
  
  return (
    <Grid.Col {...colProps}>
      {children}
    </Grid.Col>
  );
};

// 响应式文本组件
const ResponsiveText = ({ type = 'body', children, style = {}, ...props }) => {
  const { getFontSize, breakpoint } = useResponsive();
  const fontSize = getFontSize(type, breakpoint);
  
  const textStyle = {
    fontSize,
    ...style
  };
  
  return (
    <span style={textStyle} {...props}>
      {children}
    </span>
  );
};

// 响应式显示/隐藏组件
const ResponsiveShow = ({ breakpoints = [], children }) => {
  const { breakpoint } = useResponsive();
  const shouldShow = breakpoints.includes(breakpoint);
  
  return shouldShow ? children : null;
};

const ResponsiveHide = ({ breakpoints = [], children }) => {
  const { breakpoint } = useResponsive();
  const shouldHide = breakpoints.includes(breakpoint);
  
  return shouldHide ? null : children;
};

// 媒体查询Hook
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    const handleChange = (e) => setMatches(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);
  
  return matches;
};

// 断点Hook
const useBreakpoint = () => {
  const { breakpoint } = useResponsive();
  
  return {
    xs: breakpoint === 'xs',
    sm: breakpoint === 'sm',
    md: breakpoint === 'md',
    lg: breakpoint === 'lg',
    xl: breakpoint === 'xl',
    xxl: breakpoint === 'xxl'
  };
};

// 工具函数
const getBreakpointValue = (breakpointConfig, currentBreakpoint) => {
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // 从当前断点向下查找可用值
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (breakpointConfig[bp] !== undefined) {
      return breakpointConfig[bp];
    }
  }
  
  return null;
};

// 导出
export {
  responsiveManager,
  useResponsive,
  useMediaQuery,
  useBreakpoint,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCol,
  ResponsiveText,
  ResponsiveShow,
  ResponsiveHide,
  getBreakpointValue,
  BREAKPOINTS,
  DEVICE_TYPES,
  RESPONSIVE_CONFIG
};

export default responsiveManager;