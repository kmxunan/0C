// 零碳园区数字孪生系统 - 主题和UI优化
// 版本: 2.0
// 作者: 零碳园区开发团队
// 日期: 2025-06-15

import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 主题配置常量
const THEME_CONFIG = {
  // 主色调配置
  COLORS: {
    // 主品牌色
    PRIMARY: {
      light: '#52c41a',    // 浅绿色
      default: '#389e0d',  // 标准绿色
      dark: '#237804'      // 深绿色
    },
    
    // 辅助色
    SECONDARY: {
      blue: '#1890ff',     // 蓝色
      orange: '#fa8c16',   // 橙色
      purple: '#722ed1',   // 紫色
      cyan: '#13c2c2'      // 青色
    },
    
    // 功能色
    FUNCTIONAL: {
      success: '#52c41a',  // 成功
      warning: '#faad14',  // 警告
      error: '#f5222d',    // 错误
      info: '#1890ff'      // 信息
    },
    
    // 中性色
    NEUTRAL: {
      white: '#ffffff',
      gray1: '#fafafa',
      gray2: '#f5f5f5',
      gray3: '#f0f0f0',
      gray4: '#d9d9d9',
      gray5: '#bfbfbf',
      gray6: '#8c8c8c',
      gray7: '#595959',
      gray8: '#434343',
      gray9: '#262626',
      black: '#000000'
    },
    
    // 背景色
    BACKGROUND: {
      light: '#ffffff',
      gray: '#fafafa',
      dark: '#001529'
    }
  },
  
  // 字体配置
  TYPOGRAPHY: {
    FONT_FAMILY: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
      chinese: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif'
    },
    
    FONT_SIZE: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px'
    },
    
    LINE_HEIGHT: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    },
    
    FONT_WEIGHT: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  
  // 间距配置
  SPACING: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px'
  },
  
  // 圆角配置
  BORDER_RADIUS: {
    none: '0',
    sm: '2px',
    base: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%'
  },
  
  // 阴影配置
  BOX_SHADOW: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  
  // 动画配置
  ANIMATION: {
    DURATION: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    
    EASING: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      linear: 'linear'
    }
  }
};

// 亮色主题配置
const lightTheme = {
  token: {
    // 主色
    colorPrimary: THEME_CONFIG.COLORS.PRIMARY.default,
    colorSuccess: THEME_CONFIG.COLORS.FUNCTIONAL.success,
    colorWarning: THEME_CONFIG.COLORS.FUNCTIONAL.warning,
    colorError: THEME_CONFIG.COLORS.FUNCTIONAL.error,
    colorInfo: THEME_CONFIG.COLORS.FUNCTIONAL.info,
    
    // 背景色
    colorBgContainer: THEME_CONFIG.COLORS.BACKGROUND.light,
    colorBgElevated: THEME_CONFIG.COLORS.BACKGROUND.light,
    colorBgLayout: THEME_CONFIG.COLORS.BACKGROUND.gray,
    
    // 文字色
    colorText: THEME_CONFIG.COLORS.NEUTRAL.gray8,
    colorTextSecondary: THEME_CONFIG.COLORS.NEUTRAL.gray6,
    colorTextTertiary: THEME_CONFIG.COLORS.NEUTRAL.gray5,
    colorTextQuaternary: THEME_CONFIG.COLORS.NEUTRAL.gray4,
    
    // 边框色
    colorBorder: THEME_CONFIG.COLORS.NEUTRAL.gray3,
    colorBorderSecondary: THEME_CONFIG.COLORS.NEUTRAL.gray2,
    
    // 字体
    fontFamily: THEME_CONFIG.TYPOGRAPHY.FONT_FAMILY.primary,
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // 行高
    lineHeight: THEME_CONFIG.TYPOGRAPHY.LINE_HEIGHT.normal,
    lineHeightHeading1: 1.21,
    lineHeightHeading2: 1.27,
    lineHeightHeading3: 1.33,
    lineHeightHeading4: 1.4,
    lineHeightHeading5: 1.5,
    
    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // 控件高度
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    controlHeightXS: 16,
    
    // 阴影
    boxShadow: THEME_CONFIG.BOX_SHADOW.base,
    boxShadowSecondary: THEME_CONFIG.BOX_SHADOW.sm,
    boxShadowTertiary: THEME_CONFIG.BOX_SHADOW.lg,
    
    // 动画
    motionDurationFast: THEME_CONFIG.ANIMATION.DURATION.fast,
    motionDurationMid: THEME_CONFIG.ANIMATION.DURATION.normal,
    motionDurationSlow: THEME_CONFIG.ANIMATION.DURATION.slow,
    
    motionEaseInOut: THEME_CONFIG.ANIMATION.EASING.easeInOut,
    motionEaseOut: THEME_CONFIG.ANIMATION.EASING.easeOut,
    motionEaseIn: THEME_CONFIG.ANIMATION.EASING.easeIn
  },
  
  components: {
    // 布局组件
    Layout: {
      headerBg: THEME_CONFIG.COLORS.BACKGROUND.light,
      headerHeight: 64,
      headerPadding: '0 24px',
      siderBg: THEME_CONFIG.COLORS.BACKGROUND.light,
      footerBg: THEME_CONFIG.COLORS.BACKGROUND.gray,
      footerPadding: '24px 50px',
      triggerBg: THEME_CONFIG.COLORS.PRIMARY.default,
      triggerColor: THEME_CONFIG.COLORS.BACKGROUND.light
    },
    
    // 菜单组件
    Menu: {
      itemBg: 'transparent',
      itemColor: THEME_CONFIG.COLORS.NEUTRAL.gray7,
      itemHoverBg: THEME_CONFIG.COLORS.PRIMARY.light + '20',
      itemHoverColor: THEME_CONFIG.COLORS.PRIMARY.default,
      itemSelectedBg: THEME_CONFIG.COLORS.PRIMARY.light + '30',
      itemSelectedColor: THEME_CONFIG.COLORS.PRIMARY.default,
      subMenuItemBg: 'transparent',
      groupTitleColor: THEME_CONFIG.COLORS.NEUTRAL.gray6
    },
    
    // 按钮组件
    Button: {
      primaryShadow: `0 2px 0 ${THEME_CONFIG.COLORS.PRIMARY.dark}`,
      dangerShadow: `0 2px 0 ${THEME_CONFIG.COLORS.FUNCTIONAL.error}`,
      borderRadius: THEME_CONFIG.BORDER_RADIUS.base,
      fontWeight: THEME_CONFIG.TYPOGRAPHY.FONT_WEIGHT.medium
    },
    
    // 卡片组件
    Card: {
      headerBg: 'transparent',
      headerFontSize: 16,
      headerFontSizeSM: 14,
      headerHeight: 56,
      headerHeightSM: 48,
      actionsBg: THEME_CONFIG.COLORS.BACKGROUND.gray,
      tabsMarginBottom: 16
    },
    
    // 表格组件
    Table: {
      headerBg: THEME_CONFIG.COLORS.BACKGROUND.gray,
      headerColor: THEME_CONFIG.COLORS.NEUTRAL.gray8,
      headerSortActiveBg: THEME_CONFIG.COLORS.PRIMARY.light + '20',
      headerSortHoverBg: THEME_CONFIG.COLORS.NEUTRAL.gray2,
      rowHoverBg: THEME_CONFIG.COLORS.PRIMARY.light + '10',
      rowSelectedBg: THEME_CONFIG.COLORS.PRIMARY.light + '20',
      rowSelectedHoverBg: THEME_CONFIG.COLORS.PRIMARY.light + '30'
    },
    
    // 表单组件
    Form: {
      labelColor: THEME_CONFIG.COLORS.NEUTRAL.gray8,
      labelFontSize: 14,
      labelRequiredMarkColor: THEME_CONFIG.COLORS.FUNCTIONAL.error,
      itemMarginBottom: 24
    },
    
    // 输入框组件
    Input: {
      hoverBorderColor: THEME_CONFIG.COLORS.PRIMARY.light,
      activeBorderColor: THEME_CONFIG.COLORS.PRIMARY.default,
      activeShadow: `0 0 0 2px ${THEME_CONFIG.COLORS.PRIMARY.light}40`
    },
    
    // 选择器组件
    Select: {
      optionSelectedBg: THEME_CONFIG.COLORS.PRIMARY.light + '20',
      optionActiveBg: THEME_CONFIG.COLORS.PRIMARY.light + '10',
      selectorBg: THEME_CONFIG.COLORS.BACKGROUND.light
    },
    
    // 日期选择器
    DatePicker: {
      cellHoverBg: THEME_CONFIG.COLORS.PRIMARY.light + '20',
      cellActiveWithRangeBg: THEME_CONFIG.COLORS.PRIMARY.light + '10',
      cellRangeBorderColor: THEME_CONFIG.COLORS.PRIMARY.light
    },
    
    // 标签页
    Tabs: {
      itemColor: THEME_CONFIG.COLORS.NEUTRAL.gray6,
      itemHoverColor: THEME_CONFIG.COLORS.PRIMARY.default,
      itemSelectedColor: THEME_CONFIG.COLORS.PRIMARY.default,
      inkBarColor: THEME_CONFIG.COLORS.PRIMARY.default,
      cardBg: THEME_CONFIG.COLORS.BACKGROUND.light
    },
    
    // 步骤条
    Steps: {
      colorPrimary: THEME_CONFIG.COLORS.PRIMARY.default,
      finishIconBorderColor: THEME_CONFIG.COLORS.PRIMARY.default,
      processIconColor: THEME_CONFIG.COLORS.BACKGROUND.light
    },
    
    // 进度条
    Progress: {
      defaultColor: THEME_CONFIG.COLORS.PRIMARY.default,
      remainingColor: THEME_CONFIG.COLORS.NEUTRAL.gray3
    },
    
    // 消息提示
    Message: {
      contentBg: THEME_CONFIG.COLORS.BACKGROUND.light,
      contentPadding: '10px 16px'
    },
    
    // 通知提醒
    Notification: {
      notificationBg: THEME_CONFIG.COLORS.BACKGROUND.light,
      notificationPadding: '16px 24px'
    },
    
    // 抽屉
    Drawer: {
      colorBgElevated: THEME_CONFIG.COLORS.BACKGROUND.light,
      colorBgMask: 'rgba(0, 0, 0, 0.45)'
    },
    
    // 模态框
    Modal: {
      contentBg: THEME_CONFIG.COLORS.BACKGROUND.light,
      headerBg: THEME_CONFIG.COLORS.BACKGROUND.light,
      footerBg: 'transparent',
      maskBg: 'rgba(0, 0, 0, 0.45)'
    }
  }
};

// 暗色主题配置
const darkTheme = {
  token: {
    ...lightTheme.token,
    
    // 背景色
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
    colorBgLayout: '#000000',
    
    // 文字色
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',
    
    // 边框色
    colorBorder: '#434343',
    colorBorderSecondary: '#303030'
  },
  
  components: {
    ...lightTheme.components,
    
    Layout: {
      ...lightTheme.components.Layout,
      headerBg: '#141414',
      siderBg: '#001529',
      footerBg: '#141414'
    },
    
    Menu: {
      ...lightTheme.components.Menu,
      itemColor: 'rgba(255, 255, 255, 0.65)',
      itemHoverColor: THEME_CONFIG.COLORS.PRIMARY.light,
      itemSelectedColor: THEME_CONFIG.COLORS.PRIMARY.light
    },
    
    Card: {
      ...lightTheme.components.Card,
      actionsBg: '#1f1f1f'
    },
    
    Table: {
      ...lightTheme.components.Table,
      headerBg: '#1f1f1f',
      headerColor: 'rgba(255, 255, 255, 0.85)'
    }
  }
};

// 主题管理器
class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themes = {
      light: lightTheme,
      dark: darkTheme
    };
    this.listeners = new Set();
    
    this.loadThemeFromStorage();
    this.setupSystemThemeListener();
  }

  // 从本地存储加载主题
  loadThemeFromStorage() {
    try {
      const savedTheme = localStorage.getItem('zero_carbon_theme');
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme;
      } else {
        // 如果没有保存的主题，使用系统主题
        this.currentTheme = this.getSystemTheme();
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error);
    }
  }

  // 获取系统主题
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // 监听系统主题变化
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // 只有在用户没有手动设置主题时才跟随系统
        const savedTheme = localStorage.getItem('zero_carbon_theme');
        if (!savedTheme) {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  // 设置主题
  setTheme(themeName, saveToStorage = true) {
    if (!this.themes[themeName]) {
      console.warn(`Theme '${themeName}' not found`);
      return;
    }

    this.currentTheme = themeName;
    
    // 保存到本地存储
    if (saveToStorage) {
      try {
        localStorage.setItem('zero_carbon_theme', themeName);
      } catch (error) {
        console.warn('Failed to save theme to storage:', error);
      }
    }

    // 更新CSS变量
    this.updateCSSVariables(this.themes[themeName]);
    
    // 通知监听器
    this.notifyListeners(themeName);
  }

  // 更新CSS变量
  updateCSSVariables(theme) {
    const root = document.documentElement;
    const { token } = theme;
    
    // 设置CSS变量
    root.style.setProperty('--primary-color', token.colorPrimary);
    root.style.setProperty('--success-color', token.colorSuccess);
    root.style.setProperty('--warning-color', token.colorWarning);
    root.style.setProperty('--error-color', token.colorError);
    root.style.setProperty('--info-color', token.colorInfo);
    
    root.style.setProperty('--bg-container', token.colorBgContainer);
    root.style.setProperty('--bg-elevated', token.colorBgElevated);
    root.style.setProperty('--bg-layout', token.colorBgLayout);
    
    root.style.setProperty('--text-color', token.colorText);
    root.style.setProperty('--text-secondary', token.colorTextSecondary);
    root.style.setProperty('--text-tertiary', token.colorTextTertiary);
    
    root.style.setProperty('--border-color', token.colorBorder);
    root.style.setProperty('--border-secondary', token.colorBorderSecondary);
    
    root.style.setProperty('--font-family', token.fontFamily);
    root.style.setProperty('--font-size', token.fontSize + 'px');
    root.style.setProperty('--line-height', token.lineHeight);
    
    root.style.setProperty('--border-radius', token.borderRadius + 'px');
    root.style.setProperty('--box-shadow', token.boxShadow);
    
    // 设置主题类名
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${this.currentTheme}`);
  }

  // 获取当前主题
  getCurrentTheme() {
    return this.currentTheme;
  }

  // 获取主题配置
  getThemeConfig(themeName = this.currentTheme) {
    return this.themes[themeName];
  }

  // 切换主题
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  // 添加主题变化监听器
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 通知监听器
  notifyListeners(themeName) {
    this.listeners.forEach(callback => {
      try {
        callback(themeName, this.themes[themeName]);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }

  // 注册自定义主题
  registerTheme(name, config) {
    this.themes[name] = config;
  }

  // 获取所有可用主题
  getAvailableThemes() {
    return Object.keys(this.themes);
  }
}

// 创建全局主题管理器实例
const themeManager = new ThemeManager();

// React主题提供者组件
const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = React.useState(themeManager.getCurrentTheme());
  
  React.useEffect(() => {
    const unsubscribe = themeManager.addListener((themeName) => {
      setCurrentTheme(themeName);
    });
    
    return unsubscribe;
  }, []);
  
  const themeConfig = themeManager.getThemeConfig(currentTheme);
  
  return (
    <ConfigProvider
      theme={themeConfig}
      locale={zhCN}
      componentSize="middle"
    >
      {children}
    </ConfigProvider>
  );
};

// 主题切换Hook
const useTheme = () => {
  const [currentTheme, setCurrentTheme] = React.useState(themeManager.getCurrentTheme());
  
  React.useEffect(() => {
    const unsubscribe = themeManager.addListener((themeName) => {
      setCurrentTheme(themeName);
    });
    
    return unsubscribe;
  }, []);
  
  return {
    theme: currentTheme,
    themeConfig: themeManager.getThemeConfig(currentTheme),
    setTheme: themeManager.setTheme.bind(themeManager),
    toggleTheme: themeManager.toggleTheme.bind(themeManager),
    availableThemes: themeManager.getAvailableThemes()
  };
};

// 导出
export {
  themeManager,
  ThemeProvider,
  useTheme,
  THEME_CONFIG,
  lightTheme,
  darkTheme
};

export default themeManager;