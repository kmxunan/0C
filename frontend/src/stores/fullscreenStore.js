import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 全屏状态管理Store
 * 管理全屏模式的状态和操作
 */
export const useFullscreenStore = create(
  devtools(
    (set, get) => ({
      // 状态
      isFullscreen: false,
      fullscreenElement: null,
      fullscreenError: null,
      isSupported: false,
      
      // 初始化检查浏览器支持
      checkSupport: () => {
        const isSupported = !!(document.fullscreenEnabled ||
          document.webkitFullscreenEnabled ||
          document.mozFullScreenEnabled ||
          document.msFullscreenEnabled);
        
        set({ isSupported });
        return isSupported;
      },

      // 进入全屏模式
      enterFullscreen: async (element) => {
        try {
          const targetElement = element || document.documentElement;
          
          // 检查浏览器支持
          if (!get().checkSupport()) {
            throw new Error('浏览器不支持全屏模式');
          }

          // 尝试进入全屏
          if (targetElement.requestFullscreen) {
            await targetElement.requestFullscreen();
          } else if (targetElement.webkitRequestFullscreen) {
            await targetElement.webkitRequestFullscreen();
          } else if (targetElement.mozRequestFullScreen) {
            await targetElement.mozRequestFullScreen();
          } else if (targetElement.msRequestFullscreen) {
            await targetElement.msRequestFullscreen();
          } else {
            throw new Error('无法进入全屏模式');
          }

          set({ 
            isFullscreen: true, 
            fullscreenElement: targetElement,
            fullscreenError: null 
          });
        } catch (error) {
          console.error('进入全屏失败:', error);
          set({ 
            fullscreenError: error.message,
            isFullscreen: false,
            fullscreenElement: null
          });
        }
      },

      // 退出全屏模式
      exitFullscreen: async () => {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
          }

          set({ 
            isFullscreen: false, 
            fullscreenElement: null,
            fullscreenError: null 
          });
        } catch (error) {
          console.error('退出全屏失败:', error);
          set({ fullscreenError: error.message });
        }
      },

      // 切换全屏模式
      toggleFullscreen: async (element) => {
        const { isFullscreen, enterFullscreen, exitFullscreen } = get();
        
        if (isFullscreen) {
          await exitFullscreen();
        } else {
          await enterFullscreen(element);
        }
      },

      // 清除错误
      clearError: () => {
        set({ fullscreenError: null });
      },

      // 监听全屏状态变化
      setupEventListeners: () => {
        const handleFullscreenChange = () => {
          const isCurrentlyFullscreen = !!(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement);
          
          set({ 
            isFullscreen: isCurrentlyFullscreen,
            fullscreenElement: isCurrentlyFullscreen ? 
              (document.fullscreenElement || 
               document.webkitFullscreenElement || 
               document.mozFullScreenElement || 
               document.msFullscreenElement) : null
          });
        };

        const handleFullscreenError = (event) => {
          console.error('全屏模式错误:', event);
          set({ 
            fullscreenError: '全屏模式操作失败',
            isFullscreen: false,
            fullscreenElement: null
          });
        };

        // 添加事件监听器
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        document.addEventListener('fullscreenerror', handleFullscreenError);
        document.addEventListener('webkitfullscreenerror', handleFullscreenError);
        document.addEventListener('mozfullscreenerror', handleFullscreenError);
        document.addEventListener('MSFullscreenError', handleFullscreenError);

        // 返回清理函数
        return () => {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
          document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
          document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
          
          document.removeEventListener('fullscreenerror', handleFullscreenError);
          document.removeEventListener('webkitfullscreenerror', handleFullscreenError);
          document.removeEventListener('mozfullscreenerror', handleFullscreenError);
          document.removeEventListener('MSFullscreenError', handleFullscreenError);
        };
      }
    }),
    {
      name: 'fullscreen-store',
      // 只持久化必要的状态
      partialize: (state) => ({
        isSupported: state.isSupported
      })
    }
  )
);

// 状态选择器
export const selectIsFullscreen = (state) => state.isFullscreen;
export const selectFullscreenElement = (state) => state.fullscreenElement;
export const selectFullscreenError = (state) => state.fullscreenError;
export const selectIsSupported = (state) => state.isSupported;

// 初始化全屏功能
export const initializeFullscreen = () => {
  const store = useFullscreenStore.getState();
  
  // 检查浏览器支持
  store.checkSupport();
  
  // 设置事件监听器
  const cleanup = store.setupEventListeners();
  
  // 返回清理函数
  return cleanup;
};

// 全屏工具函数
export const fullscreenUtils = {
  // 检查当前是否处于全屏状态
  isCurrentlyFullscreen: () => {
    return !!(document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement);
  },

  // 获取当前全屏元素
  getCurrentFullscreenElement: () => {
    return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
  },

  // 检查元素是否支持全屏
  canElementGoFullscreen: (element) => {
    return !!(element && (
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen
    ));
  },

  // 获取全屏API前缀
  getFullscreenApiPrefix: () => {
    if (document.fullscreenEnabled) return '';
    if (document.webkitFullscreenEnabled) return 'webkit';
    if (document.mozFullScreenEnabled) return 'moz';
    if (document.msFullscreenEnabled) return 'ms';
    return null;
  }
};

export default useFullscreenStore;