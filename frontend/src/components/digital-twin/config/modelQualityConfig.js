/**
 * 3D模型质量提升配置文件
 * 定义LOD系统、性能优化策略和质量级别配置
 */

/**
 * 质量级别配置
 */
export const qualityLevels = {
  ultra: {
    name: '超高质量',
    description: '最高画质，适用于高端设备',
    lodDistances: [100, 200, 400, 800],
    shadowMapSize: 4096,
    shadowCascades: 4,
    textureQuality: 1.0,
    geometryDetail: 1.0,
    particleCount: 2000,
    postProcessing: true,
    antialias: true,
    anisotropicFiltering: 16,
    performanceThreshold: 45,
    targetFPS: 60,
    maxTriangles: 2000000,
    renderDistance: 1000
  },
  high: {
    name: '高质量',
    description: '高画质，平衡性能与质量',
    lodDistances: [50, 100, 200, 400],
    shadowMapSize: 2048,
    shadowCascades: 3,
    textureQuality: 1.0,
    geometryDetail: 1.0,
    particleCount: 1000,
    postProcessing: true,
    antialias: true,
    anisotropicFiltering: 8,
    performanceThreshold: 35,
    targetFPS: 60,
    maxTriangles: 1500000,
    renderDistance: 800
  },
  medium: {
    name: '中等质量',
    description: '中等画质，适用于大多数设备',
    lodDistances: [30, 60, 120, 240],
    shadowMapSize: 1024,
    shadowCascades: 2,
    textureQuality: 0.75,
    geometryDetail: 0.8,
    particleCount: 500,
    postProcessing: false,
    antialias: true,
    anisotropicFiltering: 4,
    performanceThreshold: 25,
    targetFPS: 45,
    maxTriangles: 1000000,
    renderDistance: 600
  },
  low: {
    name: '低质量',
    description: '低画质，适用于低端设备',
    lodDistances: [20, 40, 80, 160],
    shadowMapSize: 512,
    shadowCascades: 1,
    textureQuality: 0.5,
    geometryDetail: 0.6,
    particleCount: 200,
    postProcessing: false,
    antialias: false,
    anisotropicFiltering: 1,
    performanceThreshold: 15,
    targetFPS: 30,
    maxTriangles: 500000,
    renderDistance: 400
  },
  minimal: {
    name: '最低质量',
    description: '最低画质，极限性能优化',
    lodDistances: [10, 20, 40, 80],
    shadowMapSize: 256,
    shadowCascades: 1,
    textureQuality: 0.25,
    geometryDetail: 0.4,
    particleCount: 100,
    postProcessing: false,
    antialias: false,
    anisotropicFiltering: 1,
    performanceThreshold: 10,
    targetFPS: 24,
    maxTriangles: 250000,
    renderDistance: 200
  }
};

/**
 * 性能阈值定义
 */
export const performanceThresholds = {
  excellent: { fps: 55, frameTime: 18, memory: 200 },
  good: { fps: 45, frameTime: 22, memory: 300 },
  fair: { fps: 30, frameTime: 33, memory: 400 },
  poor: { fps: 20, frameTime: 50, memory: 500 },
  critical: { fps: 15, frameTime: 67, memory: 600 }
};

/**
 * LOD系统设置
 */
export const lodSystemConfig = {
  updateInterval: 1000, // LOD更新间隔(ms)
  hysteresis: 0.15, // 防止频繁切换的滞后系数
  maxDistance: 1000, // 最大渲染距离
  fadeTransition: true, // 启用淡入淡出过渡
  transitionDuration: 500, // 过渡持续时间(ms)
  cullingEnabled: true, // 启用视锥剔除
  occlusionCulling: false, // 遮挡剔除(实验性)
  adaptiveUpdate: true, // 自适应更新频率
  performanceBasedLOD: true // 基于性能的LOD调整
};

/**
 * 模型优化策略
 */
export const optimizationStrategies = {
  geometry: {
    // 几何体优化
    mergeGeometries: true, // 合并几何体
    simplifyMeshes: true, // 简化网格
    removeUnusedVertices: true, // 移除未使用顶点
    optimizeIndices: true, // 优化索引
    computeNormals: true, // 计算法线
    computeTangents: false, // 计算切线(按需)
    boundingBoxOptimization: true // 包围盒优化
  },
  
  textures: {
    // 纹理优化
    compression: 'auto', // 纹理压缩: 'auto', 'dxt', 'etc', 'astc', 'none'
    mipmaps: true, // 生成mipmap
    powerOfTwo: true, // 强制2的幂次方尺寸
    maxSize: 2048, // 最大纹理尺寸
    format: 'auto', // 纹理格式: 'auto', 'rgb', 'rgba', 'luminance'
    anisotropicFiltering: 'auto', // 各向异性过滤
    flipY: false // 翻转Y轴
  },
  
  materials: {
    // 材质优化
    shareCommonMaterials: true, // 共享通用材质
    removeUnusedMaterials: true, // 移除未使用材质
    optimizeShaders: true, // 优化着色器
    reducePrecision: false, // 降低精度(移动端)
    disableExtensions: [], // 禁用的扩展
    enableInstancing: true // 启用实例化渲染
  },
  
  animations: {
    // 动画优化
    compressKeyframes: true, // 压缩关键帧
    removeRedundantTracks: true, // 移除冗余轨道
    optimizeInterpolation: true, // 优化插值
    maxAnimationFPS: 30, // 最大动画帧率
    enableMorphTargets: false, // 启用变形目标(按需)
    skeletonOptimization: true // 骨骼优化
  }
};

/**
 * 自适应质量配置
 */
export const adaptiveQualityConfig = {
  enabled: true, // 启用自适应质量
  monitoringInterval: 2000, // 监控间隔(ms)
  adjustmentCooldown: 5000, // 调整冷却时间(ms)
  stabilityThreshold: 3, // 稳定性阈值(连续帧数)
  aggressiveOptimization: false, // 激进优化模式
  
  triggers: {
    // 触发条件
    lowFPS: { threshold: 25, action: 'reduce_quality' },
    highFPS: { threshold: 55, action: 'increase_quality' },
    highMemory: { threshold: 400, action: 'reduce_particles' },
    highTriangles: { threshold: 1000000, action: 'increase_lod_distance' }
  },
  
  actions: {
    // 优化动作
    reduce_quality: {
      priority: 1,
      steps: ['reduce_shadows', 'disable_postprocessing', 'reduce_particles', 'lower_texture_quality']
    },
    increase_quality: {
      priority: 3,
      steps: ['increase_shadows', 'enable_postprocessing', 'increase_particles', 'higher_texture_quality']
    },
    reduce_particles: {
      priority: 2,
      factor: 0.5
    },
    increase_lod_distance: {
      priority: 2,
      factor: 0.8
    }
  }
};

/**
 * 设备性能分级
 */
export const devicePerformanceProfiles = {
  high_end: {
    // 高端设备
    criteria: {
      cores: 8,
      memory: 8192,
      gpu: 'dedicated',
      webgl_version: 2
    },
    recommended_quality: 'ultra',
    max_triangles: 2000000,
    max_texture_size: 4096
  },
  
  mid_range: {
    // 中端设备
    criteria: {
      cores: 4,
      memory: 4096,
      gpu: 'integrated',
      webgl_version: 2
    },
    recommended_quality: 'high',
    max_triangles: 1000000,
    max_texture_size: 2048
  },
  
  low_end: {
    // 低端设备
    criteria: {
      cores: 2,
      memory: 2048,
      gpu: 'integrated',
      webgl_version: 1
    },
    recommended_quality: 'medium',
    max_triangles: 500000,
    max_texture_size: 1024
  },
  
  mobile: {
    // 移动设备
    criteria: {
      is_mobile: true,
      memory: 1024,
      gpu: 'mobile',
      webgl_version: 1
    },
    recommended_quality: 'low',
    max_triangles: 250000,
    max_texture_size: 512
  }
};

/**
 * 工具函数
 */

/**
 * 根据性能指标获取推荐质量级别
 */
export function getRecommendedQuality(performanceMetrics) {
  const { fps, frameTime, memoryUsage, triangleCount } = performanceMetrics;
  
  // 计算性能分数
  let score = 0;
  
  // FPS评分 (40%权重)
  if (fps >= 55) score += 40;
  else if (fps >= 45) score += 32;
  else if (fps >= 30) score += 24;
  else if (fps >= 20) score += 16;
  else score += 8;
  
  // 帧时间评分 (30%权重)
  if (frameTime <= 18) score += 30;
  else if (frameTime <= 22) score += 24;
  else if (frameTime <= 33) score += 18;
  else if (frameTime <= 50) score += 12;
  else score += 6;
  
  // 内存使用评分 (20%权重)
  if (memoryUsage <= 200) score += 20;
  else if (memoryUsage <= 300) score += 16;
  else if (memoryUsage <= 400) score += 12;
  else if (memoryUsage <= 500) score += 8;
  else score += 4;
  
  // 三角面数评分 (10%权重)
  if (triangleCount <= 500000) score += 10;
  else if (triangleCount <= 1000000) score += 8;
  else if (triangleCount <= 1500000) score += 6;
  else if (triangleCount <= 2000000) score += 4;
  else score += 2;
  
  // 根据分数推荐质量级别
  if (score >= 85) return 'ultra';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  return 'minimal';
}

/**
 * 获取模型路径
 */
export function getModelPath(baseUrl, lodLevel = 0, quality = 'high') {
  const qualityConfig = qualityLevels[quality];
  if (!qualityConfig) return baseUrl;
  
  // 根据LOD级别添加后缀
  const lodSuffix = lodLevel > 0 ? `_lod${lodLevel}` : '';
  
  // 根据质量级别选择文件格式
  const extension = qualityConfig.textureQuality >= 0.8 ? '.glb' : '.gltf';
  
  return baseUrl.replace(/\.(glb|gltf)$/, `${lodSuffix}${extension}`);
}

/**
 * 获取LOD距离
 */
export function getLODDistance(quality, lodLevel) {
  const qualityConfig = qualityLevels[quality];
  if (!qualityConfig || !qualityConfig.lodDistances) return 100;
  
  return qualityConfig.lodDistances[lodLevel] || qualityConfig.lodDistances[qualityConfig.lodDistances.length - 1];
}

/**
 * 计算屏幕空间大小
 */
export function calculateScreenSize(distance, objectSize, fov, screenHeight) {
  const fovRadians = (fov * Math.PI) / 180;
  const projectedSize = (objectSize * screenHeight) / (2 * distance * Math.tan(fovRadians / 2));
  return projectedSize;
}

/**
 * 检测设备性能
 */
export function detectDevicePerformance() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return devicePerformanceProfiles.low_end;
  }
  
  // const debugInfo = gl.getExtension('WEBGL_debug_renderer_info'); // 未使用，已注释
    // const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''; // 未使用，已注释
    // const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : ''; // 未使用，已注释
  
  // 简单的设备检测逻辑
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const memory = navigator.deviceMemory || 4; // GB
  const cores = navigator.hardwareConcurrency || 4;
  
  if (isMobile) {
    return devicePerformanceProfiles.mobile;
  }
  
  if (memory >= 8 && cores >= 8) {
    return devicePerformanceProfiles.high_end;
  }
  
  if (memory >= 4 && cores >= 4) {
    return devicePerformanceProfiles.mid_range;
  }
  
  return devicePerformanceProfiles.low_end;
}

/**
 * 优化配置合并
 */
export function mergeOptimizationConfig(baseConfig, overrides) {
  return {
    ...baseConfig,
    ...overrides,
    geometry: { ...baseConfig.geometry, ...overrides.geometry },
    textures: { ...baseConfig.textures, ...overrides.textures },
    materials: { ...baseConfig.materials, ...overrides.materials },
    animations: { ...baseConfig.animations, ...overrides.animations }
  };
}

/**
 * 验证质量配置
 */
export function validateQualityConfig(config) {
  const required = ['lodDistances', 'shadowMapSize', 'textureQuality', 'geometryDetail'];
  
  for (const field of required) {
    if (!(field in config)) {
      throw new Error(`质量配置缺少必需字段: ${field}`);
    }
  }
  
  if (config.textureQuality < 0 || config.textureQuality > 1) {
    throw new Error('纹理质量必须在0-1之间');
  }
  
  if (config.geometryDetail < 0 || config.geometryDetail > 1) {
    throw new Error('几何体细节必须在0-1之间');
  }
  
  return true;
}

const modelQualityConfig = {
  qualityLevels,
  performanceThresholds,
  lodSystemConfig,
  optimizationStrategies,
  adaptiveQualityConfig,
  devicePerformanceProfiles,
  getRecommendedQuality,
  getModelPath,
  getLODDistance,
  calculateScreenSize,
  detectDevicePerformance,
  mergeOptimizationConfig,
  validateQualityConfig
};

export default modelQualityConfig;