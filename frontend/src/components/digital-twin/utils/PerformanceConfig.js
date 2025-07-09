/**
 * 性能优化配置
 * 统一管理3D模型的性能优化设置
 */

// 性能级别定义
export const PERFORMANCE_LEVELS = {
  ULTRA: {
    name: 'ultra',
    label: '超高',
    maxTriangles: 100000,
    maxTextures: 20,
    textureSize: 2048,
    shadowQuality: 'high',
    enablePostProcessing: true,
    enableSSAO: true,
    enableBloom: true,
    enableAntialiasing: true,
    lodDistance: [10, 30, 100],
    cullingDistance: 500
  },
  HIGH: {
    name: 'high',
    label: '高',
    maxTriangles: 50000,
    maxTextures: 15,
    textureSize: 1024,
    shadowQuality: 'medium',
    enablePostProcessing: true,
    enableSSAO: true,
    enableBloom: false,
    enableAntialiasing: true,
    lodDistance: [8, 25, 80],
    cullingDistance: 400
  },
  MEDIUM: {
    name: 'medium',
    label: '中',
    maxTriangles: 25000,
    maxTextures: 10,
    textureSize: 512,
    shadowQuality: 'low',
    enablePostProcessing: false,
    enableSSAO: false,
    enableBloom: false,
    enableAntialiasing: false,
    lodDistance: [6, 20, 60],
    cullingDistance: 300
  },
  LOW: {
    name: 'low',
    label: '低',
    maxTriangles: 10000,
    maxTextures: 5,
    textureSize: 256,
    shadowQuality: 'off',
    enablePostProcessing: false,
    enableSSAO: false,
    enableBloom: false,
    enableAntialiasing: false,
    lodDistance: [4, 15, 40],
    cullingDistance: 200
  },
  MINIMAL: {
    name: 'minimal',
    label: '最低',
    maxTriangles: 5000,
    maxTextures: 3,
    textureSize: 128,
    shadowQuality: 'off',
    enablePostProcessing: false,
    enableSSAO: false,
    enableBloom: false,
    enableAntialiasing: false,
    lodDistance: [2, 10, 25],
    cullingDistance: 150
  }
};

// 设备类型性能配置
export const DEVICE_PERFORMANCE_CONFIG = {
  desktop: {
    defaultLevel: 'high',
    adaptiveQuality: true,
    targetFPS: 60,
    memoryLimit: 2048, // MB
    enableGPUProfiling: true
  },
  mobile: {
    defaultLevel: 'medium',
    adaptiveQuality: true,
    targetFPS: 30,
    memoryLimit: 512, // MB
    enableGPUProfiling: false
  },
  tablet: {
    defaultLevel: 'medium',
    adaptiveQuality: true,
    targetFPS: 45,
    memoryLimit: 1024, // MB
    enableGPUProfiling: false
  }
};

// 模型优化配置
export const MODEL_OPTIMIZATION_CONFIG = {
  // 几何体优化
  geometry: {
    enableSimplification: true,
    simplificationRatio: {
      ultra: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      minimal: 0.2
    },
    enableMerging: true,
    enableInstancing: true,
    enableCompression: true
  },
  
  // 纹理优化
  texture: {
    enableCompression: true,
    compressionFormat: 'DXT',
    enableMipmaps: true,
    anisotropicFiltering: {
      ultra: 16,
      high: 8,
      medium: 4,
      low: 2,
      minimal: 1
    },
    enableAtlasing: true
  },
  
  // 材质优化
  material: {
    enableSharing: true,
    enableBatching: true,
    simplifyShaders: {
      ultra: false,
      high: false,
      medium: true,
      low: true,
      minimal: true
    }
  },
  
  // LOD配置
  lod: {
    enableAutoGeneration: true,
    levels: 4,
    distanceMultiplier: {
      ultra: 1.0,
      high: 1.2,
      medium: 1.5,
      low: 2.0,
      minimal: 3.0
    },
    enableFading: true,
    fadeDistance: 5
  }
};

// 缓存配置
export const CACHE_CONFIG = {
  maxSize: 512, // MB
  maxItems: 1000,
  ttl: 30 * 60 * 1000, // 30分钟
  enablePersistence: true,
  enablePreloading: true,
  preloadDistance: 100,
  enableCompression: true,
  compressionLevel: 6
};

// 渲染配置
export const RENDER_CONFIG = {
  // 阴影配置
  shadows: {
    enabled: true,
    type: 'PCFSoft',
    mapSize: {
      ultra: 2048,
      high: 1024,
      medium: 512,
      low: 256,
      minimal: 128
    },
    cascade: {
      ultra: 4,
      high: 3,
      medium: 2,
      low: 1,
      minimal: 0
    }
  },
  
  // 抗锯齿配置
  antialiasing: {
    enabled: true,
    type: 'MSAA',
    samples: {
      ultra: 8,
      high: 4,
      medium: 2,
      low: 0,
      minimal: 0
    }
  },
  
  // 后处理配置
  postProcessing: {
    enabled: true,
    effects: {
      ssao: {
        enabled: true,
        quality: {
          ultra: 'high',
          high: 'medium',
          medium: 'low',
          low: 'off',
          minimal: 'off'
        }
      },
      bloom: {
        enabled: true,
        quality: {
          ultra: 'high',
          high: 'medium',
          medium: 'off',
          low: 'off',
          minimal: 'off'
        }
      },
      fxaa: {
        enabled: true,
        quality: {
          ultra: 'high',
          high: 'medium',
          medium: 'low',
          low: 'off',
          minimal: 'off'
        }
      }
    }
  }
};

// 性能监控配置
export const MONITORING_CONFIG = {
  enabled: true,
  interval: 1000, // ms
  metrics: {
    fps: true,
    memory: true,
    drawCalls: true,
    triangles: true,
    textures: true,
    geometries: true
  },
  thresholds: {
    fps: {
      warning: 30,
      critical: 15
    },
    memory: {
      warning: 1024, // MB
      critical: 1536 // MB
    },
    drawCalls: {
      warning: 1000,
      critical: 2000
    }
  },
  autoOptimize: true,
  optimizationDelay: 5000 // ms
};

// 获取当前设备的性能配置
export const getDevicePerformanceConfig = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(navigator.userAgent);
  
  if (isMobile && !isTablet) {
    return DEVICE_PERFORMANCE_CONFIG.mobile;
  } else if (isTablet) {
    return DEVICE_PERFORMANCE_CONFIG.tablet;
  } else {
    return DEVICE_PERFORMANCE_CONFIG.desktop;
  }
};

// 获取推荐的性能级别
export const getRecommendedPerformanceLevel = () => {
  // const deviceConfig = getDevicePerformanceConfig(); // 未使用，已注释
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    return 'minimal';
  }
  
  // 检测GPU性能
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  
  // 检测内存
  const memory = navigator.deviceMemory || 4;
  
  // 基于设备信息推荐性能级别
  if (memory >= 8 && renderer.includes('RTX')) {
    return 'ultra';
  } else if (memory >= 6 && (renderer.includes('GTX') || renderer.includes('RX'))) {
    return 'high';
  } else if (memory >= 4) {
    return 'medium';
  } else if (memory >= 2) {
    return 'low';
  } else {
    return 'minimal';
  }
};

// 导出默认配置
const PerformanceConfig = {
  PERFORMANCE_LEVELS,
  DEVICE_PERFORMANCE_CONFIG,
  MODEL_OPTIMIZATION_CONFIG,
  CACHE_CONFIG,
  RENDER_CONFIG,
  MONITORING_CONFIG,
  getDevicePerformanceConfig,
  getRecommendedPerformanceLevel
};

export default PerformanceConfig;