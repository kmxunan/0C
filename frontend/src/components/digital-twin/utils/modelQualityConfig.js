/**
 * 3D模型质量提升配置
 * 定义不同质量级别的LOD距离、渲染设置和性能阈值
 */

// 模型质量级别定义
export const MODEL_QUALITY_LEVELS = {
  ULTRA: {
    name: 'ultra',
    displayName: '超高质量',
    lodDistances: { high: 50, medium: 150, low: 300 },
    maxTriangles: 200000,
    shadows: true,
    reflections: true,
    postProcessing: true,
    textureQuality: 'high',
    antiAliasing: 'MSAA',
    anisotropicFiltering: 16,
    renderDistance: 500,
    cullingDistance: 1000,
    geometryLOD: {
      high: { decimation: 0.0, textureSize: 2048 },
      medium: { decimation: 0.3, textureSize: 1024 },
      low: { decimation: 0.7, textureSize: 512 }
    },
    materialOptimization: {
      useCompressedTextures: true,
      enableMipmaps: true,
      textureCompression: 'DXT5',
      normalMapIntensity: 1.0
    }
  },
  HIGH: {
    name: 'high',
    displayName: '高质量',
    lodDistances: { high: 30, medium: 100, low: 200 },
    maxTriangles: 100000,
    shadows: true,
    reflections: true,
    postProcessing: true,
    textureQuality: 'high',
    antiAliasing: 'FXAA',
    anisotropicFiltering: 8,
    renderDistance: 300,
    cullingDistance: 600,
    geometryLOD: {
      high: { decimation: 0.1, textureSize: 1024 },
      medium: { decimation: 0.4, textureSize: 512 },
      low: { decimation: 0.8, textureSize: 256 }
    },
    materialOptimization: {
      useCompressedTextures: true,
      enableMipmaps: true,
      textureCompression: 'DXT1',
      normalMapIntensity: 0.8
    }
  },
  MEDIUM: {
    name: 'medium',
    displayName: '中等质量',
    lodDistances: { high: 20, medium: 60, low: 120 },
    maxTriangles: 50000,
    shadows: true,
    reflections: false,
    postProcessing: false,
    textureQuality: 'medium',
    antiAliasing: 'FXAA',
    anisotropicFiltering: 4,
    renderDistance: 200,
    cullingDistance: 400,
    geometryLOD: {
      high: { decimation: 0.2, textureSize: 512 },
      medium: { decimation: 0.5, textureSize: 256 },
      low: { decimation: 0.85, textureSize: 128 }
    },
    materialOptimization: {
      useCompressedTextures: true,
      enableMipmaps: false,
      textureCompression: 'DXT1',
      normalMapIntensity: 0.5
    }
  },
  LOW: {
    name: 'low',
    displayName: '低质量',
    lodDistances: { high: 10, medium: 30, low: 60 },
    maxTriangles: 25000,
    shadows: false,
    reflections: false,
    postProcessing: false,
    textureQuality: 'low',
    antiAliasing: 'none',
    anisotropicFiltering: 1,
    renderDistance: 100,
    cullingDistance: 200,
    geometryLOD: {
      high: { decimation: 0.4, textureSize: 256 },
      medium: { decimation: 0.7, textureSize: 128 },
      low: { decimation: 0.9, textureSize: 64 }
    },
    materialOptimization: {
      useCompressedTextures: false,
      enableMipmaps: false,
      textureCompression: 'none',
      normalMapIntensity: 0.0
    }
  }
};

// LOD系统设置
export const LOD_SETTINGS = {
  // LOD级别定义
  levels: {
    high: {
      name: 'high',
      displayName: '高精度',
      triangleReduction: 0.0,
      textureScale: 1.0,
      materialComplexity: 'full'
    },
    medium: {
      name: 'medium',
      displayName: '中精度',
      triangleReduction: 0.5,
      textureScale: 0.5,
      materialComplexity: 'simplified'
    },
    low: {
      name: 'low',
      displayName: '低精度',
      triangleReduction: 0.8,
      textureScale: 0.25,
      materialComplexity: 'basic'
    }
  },
  
  // 自动LOD切换阈值
  autoSwitchThresholds: {
    distanceBased: true,
    performanceBased: true,
    screenSizeBased: true,
    frustumCulling: true
  },
  
  // LOD更新频率（毫秒）
  updateFrequency: 100,
  
  // 平滑过渡设置
  smoothTransition: {
    enabled: true,
    duration: 500, // 毫秒
    easing: 'easeInOutQuad'
  },
  
  // 预加载设置
  preloading: {
    enabled: true,
    distance: 1.5, // 预加载距离倍数
    maxConcurrent: 3 // 最大并发预加载数量
  }
};

// 性能阈值定义
export const PERFORMANCE_THRESHOLDS = {
  fps: {
    excellent: 60,
    good: 45,
    acceptable: 30,
    poor: 20
  },
  triangles: {
    low: 50000,
    medium: 100000,
    high: 200000,
    extreme: 500000
  },
  memory: {
    low: 256, // MB
    medium: 512,
    high: 1024,
    extreme: 2048
  },
  gpu: {
    utilization: {
      low: 50, // %
      medium: 70,
      high: 85,
      extreme: 95
    }
  }
};

// 模型优化策略
export const MODEL_OPTIMIZATION_STRATEGIES = {
  geometry: {
    // 几何体优化
    decimation: {
      enabled: true,
      algorithm: 'quadric', // quadric, edge_collapse, vertex_clustering
      preserveUVs: true,
      preserveNormals: true,
      preserveBoundaries: true
    },
    
    // 网格合并
    meshMerging: {
      enabled: true,
      maxVertices: 65536,
      materialBatching: true
    },
    
    // 实例化渲染
    instancing: {
      enabled: true,
      threshold: 5, // 相同模型数量阈值
      maxInstances: 1000
    }
  },
  
  texture: {
    // 纹理压缩
    compression: {
      enabled: true,
      format: 'auto', // auto, DXT1, DXT5, ETC1, ETC2, ASTC
      quality: 'high'
    },
    
    // 纹理流式加载
    streaming: {
      enabled: true,
      tileSize: 256,
      maxCacheSize: 512 // MB
    },
    
    // 纹理优化
    optimization: {
      generateMipmaps: true,
      powerOfTwo: true,
      maxSize: 2048
    }
  },
  
  material: {
    // 材质简化
    simplification: {
      enabled: true,
      combineTextures: true,
      reducePasses: true,
      optimizeShaders: true
    },
    
    // 材质缓存
    caching: {
      enabled: true,
      maxCacheSize: 100,
      shareCommonMaterials: true
    }
  },
  
  animation: {
    // 动画优化
    compression: {
      enabled: true,
      keyframeReduction: 0.1,
      quaternionCompression: true
    },
    
    // 动画LOD
    lod: {
      enabled: true,
      distanceThresholds: [50, 100, 200],
      frameRateReduction: [1, 0.5, 0.25]
    }
  }
};

// 自适应质量配置
export const ADAPTIVE_QUALITY_CONFIG = {
  // 启用自适应质量
  enabled: true,
  
  // 监控间隔（毫秒）
  monitorInterval: 1000,
  
  // 调整策略
  adjustmentStrategy: {
    fps: {
      enabled: true,
      weight: 0.6,
      thresholds: {
        EXCELLENT: 60,
        GOOD: 45,
        ACCEPTABLE: 30,
        POOR: 20
      }
    },
    triangles: {
      enabled: true,
      weight: 0.25,
      thresholds: {
        LOW: 50000,
        MEDIUM: 100000,
        HIGH: 200000,
        EXTREME: 500000
      }
    },
    memory: {
      enabled: true,
      weight: 0.15,
      thresholds: {
        LOW: 256,
        MEDIUM: 512,
        HIGH: 1024,
        EXTREME: 2048
      }
    }
  },
  
  // 平滑调整
  smoothing: {
    enabled: true,
    minInterval: 2000, // 最小调整间隔
    hysteresis: 0.1 // 防抖动阈值
  },
  
  // 质量级别权重
  qualityWeights: {
    ultra: 1.0,
    high: 0.8,
    medium: 0.6,
    low: 0.4
  }
};

// 工具函数

/**
 * 根据性能指标获取推荐的质量级别
 * @param {Object} metrics - 性能指标 {fps, triangleCount, memoryUsage}
 * @returns {string} 推荐的质量级别
 */
export function getRecommendedQualityLevel(metrics) {
  const { fps, triangleCount, memoryUsage } = metrics;
  
  // 基于FPS的评分
  let fpsScore = 0;
  if (fps >= PERFORMANCE_THRESHOLDS.fps.excellent) fpsScore = 4;
  else if (fps >= PERFORMANCE_THRESHOLDS.fps.good) fpsScore = 3;
  else if (fps >= PERFORMANCE_THRESHOLDS.fps.acceptable) fpsScore = 2;
  else if (fps >= PERFORMANCE_THRESHOLDS.fps.poor) fpsScore = 1;
  
  // 基于三角形数量的评分
  let triangleScore = 4;
  if (triangleCount >= PERFORMANCE_THRESHOLDS.triangles.extreme) triangleScore = 0;
  else if (triangleCount >= PERFORMANCE_THRESHOLDS.triangles.high) triangleScore = 1;
  else if (triangleCount >= PERFORMANCE_THRESHOLDS.triangles.medium) triangleScore = 2;
  else if (triangleCount >= PERFORMANCE_THRESHOLDS.triangles.low) triangleScore = 3;
  
  // 基于内存使用的评分
  let memoryScore = 4;
  if (memoryUsage >= PERFORMANCE_THRESHOLDS.memory.extreme) memoryScore = 0;
  else if (memoryUsage >= PERFORMANCE_THRESHOLDS.memory.high) memoryScore = 1;
  else if (memoryUsage >= PERFORMANCE_THRESHOLDS.memory.medium) memoryScore = 2;
  else if (memoryUsage >= PERFORMANCE_THRESHOLDS.memory.low) memoryScore = 3;
  
  // 计算综合评分
  const totalScore = (fpsScore * 0.5 + triangleScore * 0.3 + memoryScore * 0.2);
  
  // 返回推荐质量级别
  if (totalScore >= 3.5) return 'ultra';
  if (totalScore >= 2.5) return 'high';
  if (totalScore >= 1.5) return 'medium';
  return 'low';
}

/**
 * 获取指定质量级别和LOD的模型路径
 * @param {string} baseUrl - 基础模型URL
 * @param {string} lodLevel - LOD级别 (high/medium/low)
 * @param {string} quality - 质量级别 (ultra/high/medium/low)
 * @returns {string} 优化后的模型路径
 */
export function getModelPath(baseUrl, lodLevel = 'high', quality = 'high') {
  const baseName = baseUrl.replace(/\.[^/.]+$/, ''); // 移除扩展名
  const extension = baseUrl.split('.').pop();
  
  // 根据质量级别和LOD级别构建文件名
  const suffix = `_${quality}_${lodLevel}`;
  return `${baseName}${suffix}.${extension}`;
}

/**
 * 获取LOD距离阈值
 * @param {string} qualityLevel - 质量级别
 * @param {string} lodLevel - LOD级别
 * @returns {number} 距离阈值
 */
export function getLODDistance(qualityLevel, lodLevel) {
  const quality = MODEL_QUALITY_LEVELS[qualityLevel.toUpperCase()];
  return quality ? quality.lodDistances[lodLevel] : 100;
}

/**
 * 计算模型的屏幕空间大小
 * @param {Object} boundingBox - 模型包围盒
 * @param {number} distance - 距离相机的距离
 * @param {Object} camera - 相机对象
 * @returns {number} 屏幕空间大小（像素）
 */
export function calculateScreenSize(boundingBox, distance, camera) {
  const size = Math.max(
    boundingBox.max.x - boundingBox.min.x,
    boundingBox.max.y - boundingBox.min.y,
    boundingBox.max.z - boundingBox.min.z
  );
  
  const fov = camera.fov * Math.PI / 180;
  const screenHeight = window.innerHeight;
  const angularSize = 2 * Math.atan(size / (2 * distance));
  
  return (angularSize / fov) * screenHeight;
}

/**
 * 获取推荐的LOD级别
 * @param {number} distance - 距离
 * @param {number} screenSize - 屏幕大小
 * @param {string} qualityLevel - 质量级别
 * @returns {string} 推荐的LOD级别
 */
export function getRecommendedLODLevel(distance, screenSize, qualityLevel = 'high') {
  const quality = MODEL_QUALITY_LEVELS[qualityLevel.toUpperCase()];
  if (!quality) return 'medium';
  
  const { lodDistances } = quality;
  
  // 基于距离的LOD选择
  if (distance <= lodDistances.high) return 'high';
  if (distance <= lodDistances.medium) return 'medium';
  return 'low';
}

const modelQualityConfig = {
  MODEL_QUALITY_LEVELS,
  LOD_SETTINGS,
  PERFORMANCE_THRESHOLDS,
  MODEL_OPTIMIZATION_STRATEGIES,
  ADAPTIVE_QUALITY_CONFIG,
  getRecommendedQualityLevel,
  getModelPath,
  getLODDistance,
  calculateScreenSize,
  getRecommendedLODLevel
};

export default modelQualityConfig;