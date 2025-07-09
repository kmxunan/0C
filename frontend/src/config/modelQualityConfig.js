/**
 * 3D模型质量提升配置
 * 管理LOD系统、性能优化和模型质量设置
 */

export const MODEL_QUALITY_LEVELS = {
  ULTRA: {
    name: 'ultra',
    displayName: '超高质量',
    lodDistances: [50, 100, 200],
    maxTriangles: 500000,
    enableShadows: true,
    enableReflections: true,
    enablePostProcessing: true,
    textureQuality: 'high',
    antiAliasing: 'MSAA',
    anisotropicFiltering: 16
  },
  HIGH: {
    name: 'high',
    displayName: '高质量',
    lodDistances: [30, 80, 150],
    maxTriangles: 200000,
    enableShadows: true,
    enableReflections: false,
    enablePostProcessing: true,
    textureQuality: 'medium',
    antiAliasing: 'FXAA',
    anisotropicFiltering: 8
  },
  MEDIUM: {
    name: 'medium',
    displayName: '中等质量',
    lodDistances: [20, 50, 100],
    maxTriangles: 100000,
    enableShadows: false,
    enableReflections: false,
    enablePostProcessing: false,
    textureQuality: 'medium',
    antiAliasing: 'FXAA',
    anisotropicFiltering: 4
  },
  LOW: {
    name: 'low',
    displayName: '低质量',
    lodDistances: [10, 30, 60],
    maxTriangles: 50000,
    enableShadows: false,
    enableReflections: false,
    enablePostProcessing: false,
    textureQuality: 'low',
    antiAliasing: 'none',
    anisotropicFiltering: 1
  }
};

export const LOD_SETTINGS = {
  // LOD级别定义
  LEVELS: {
    LOD0: { name: 'LOD0', quality: 'high', suffix: '_lod0', maxDistance: 50 },
    LOD1: { name: 'LOD1', quality: 'medium', suffix: '_lod1', maxDistance: 100 },
    LOD2: { name: 'LOD2', quality: 'low', suffix: '_lod2', maxDistance: 200 }
  },
  
  // 自动LOD切换阈值
  AUTO_SWITCH_THRESHOLDS: {
    fps: {
      high: 60,    // 高于60fps使用高质量LOD
      medium: 30,  // 30-60fps使用中等质量LOD
      low: 15      // 低于30fps使用低质量LOD
    },
    triangleCount: {
      high: 50000,
      medium: 100000,
      low: 200000
    },
    memoryUsage: {
      high: 512,   // MB
      medium: 1024,
      low: 2048
    }
  },
  
  // LOD更新频率（毫秒）
  UPDATE_INTERVALS: {
    normal: 1000,
    performance: 500,
    aggressive: 250
  }
};

export const PERFORMANCE_THRESHOLDS = {
  // FPS阈值
  FPS: {
    EXCELLENT: 60,
    GOOD: 45,
    ACCEPTABLE: 30,
    POOR: 15
  },
  
  // 三角形数量阈值
  TRIANGLES: {
    LOW: 50000,
    MEDIUM: 100000,
    HIGH: 200000,
    EXTREME: 500000
  },
  
  // 内存使用阈值（MB）
  MEMORY: {
    LOW: 256,
    MEDIUM: 512,
    HIGH: 1024,
    EXTREME: 2048
  },
  
  // GPU使用率阈值（%）
  GPU_USAGE: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    EXTREME: 95
  }
};

export const MODEL_OPTIMIZATION_STRATEGIES = {
  // 几何体优化
  GEOMETRY: {
    enableInstancing: true,        // 启用实例化渲染
    enableMerging: true,          // 启用几何体合并
    enableCompression: true,      // 启用Draco压缩
    enableCulling: true,          // 启用视锥剔除
    enableOcclusion: true         // 启用遮挡剔除
  },
  
  // 纹理优化
  TEXTURE: {
    enableCompression: true,      // 启用纹理压缩
    enableMipmaps: true,         // 启用Mipmap
    maxTextureSize: 2048,        // 最大纹理尺寸
    compressionFormat: 'DXT',    // 压缩格式
    enableStreaming: true        // 启用纹理流式加载
  },
  
  // 材质优化
  MATERIAL: {
    enableShaderCaching: true,   // 启用着色器缓存
    enableBatching: true,        // 启用材质批处理
    maxMaterialVariants: 50,     // 最大材质变体数
    enablePBROptimization: true  // 启用PBR优化
  },
  
  // 动画优化
  ANIMATION: {
    enableCompression: true,     // 启用动画压缩
    maxAnimationFPS: 30,        // 最大动画帧率
    enableInterpolation: true,   // 启用插值优化
    enableCulling: true         // 启用动画剔除
  }
};

export const ADAPTIVE_QUALITY_CONFIG = {
  // 自适应质量调整
  enabled: true,
  
  // 监控间隔（毫秒）
  monitorInterval: 1000,
  
  // 质量调整策略
  adjustmentStrategy: {
    // 基于FPS的调整
    fps: {
      enabled: true,
      weight: 0.4,
      thresholds: PERFORMANCE_THRESHOLDS.FPS
    },
    
    // 基于三角形数量的调整
    triangles: {
      enabled: true,
      weight: 0.3,
      thresholds: PERFORMANCE_THRESHOLDS.TRIANGLES
    },
    
    // 基于内存使用的调整
    memory: {
      enabled: true,
      weight: 0.2,
      thresholds: PERFORMANCE_THRESHOLDS.MEMORY
    },
    
    // 基于GPU使用率的调整
    gpu: {
      enabled: false, // 暂时禁用，需要WebGL扩展支持
      weight: 0.1,
      thresholds: PERFORMANCE_THRESHOLDS.GPU_USAGE
    }
  },
  
  // 质量调整的平滑度
  smoothing: {
    enabled: true,
    factor: 0.1,     // 调整因子（0-1）
    minInterval: 2000 // 最小调整间隔（毫秒）
  }
};

/**
 * 根据设备性能获取推荐的质量级别
 */
export function getRecommendedQualityLevel() {
  // 检测设备性能指标
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    return MODEL_QUALITY_LEVELS.LOW;
  }
  
  // 获取GPU信息
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  
  // 检测内存
  const memory = navigator.deviceMemory || 4; // GB
  
  // 检测CPU核心数
  const cores = navigator.hardwareConcurrency || 4;
  
  // 简单的性能评分
  let score = 0;
  
  // GPU评分
  if (renderer.includes('RTX') || renderer.includes('RX 6')) score += 40;
  else if (renderer.includes('GTX') || renderer.includes('RX 5')) score += 30;
  else if (renderer.includes('Intel Iris') || renderer.includes('AMD')) score += 20;
  else score += 10;
  
  // 内存评分
  if (memory >= 16) score += 30;
  else if (memory >= 8) score += 20;
  else if (memory >= 4) score += 10;
  else score += 5;
  
  // CPU评分
  if (cores >= 8) score += 30;
  else if (cores >= 4) score += 20;
  else score += 10;
  
  // 根据评分返回质量级别
  if (score >= 80) return MODEL_QUALITY_LEVELS.ULTRA;
  if (score >= 60) return MODEL_QUALITY_LEVELS.HIGH;
  if (score >= 40) return MODEL_QUALITY_LEVELS.MEDIUM;
  return MODEL_QUALITY_LEVELS.LOW;
}

/**
 * 获取模型文件路径
 */
export function getModelPath(baseUrl, lodLevel = 'LOD0') {
  const lodSetting = LOD_SETTINGS.LEVELS[lodLevel];
  if (!lodSetting) {
    console.warn(`Unknown LOD level: ${lodLevel}, using LOD0`);
    return baseUrl;
  }
  
  // 如果是基础模型，直接返回
  if (lodLevel === 'LOD0' && !baseUrl.includes('_lod')) {
    return baseUrl;
  }
  
  // 替换或添加LOD后缀
  const extension = baseUrl.split('.').pop();
  const baseName = baseUrl.replace(/(_lod[0-9])?\.[^.]+$/, '');
  
  return `${baseName}${lodSetting.suffix}.${extension}`;
}

export default {
  MODEL_QUALITY_LEVELS,
  LOD_SETTINGS,
  PERFORMANCE_THRESHOLDS,
  MODEL_OPTIMIZATION_STRATEGIES,
  ADAPTIVE_QUALITY_CONFIG,
  getRecommendedQualityLevel,
  getModelPath
};