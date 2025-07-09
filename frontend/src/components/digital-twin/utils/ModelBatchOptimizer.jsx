import React, { createContext, useContext, useState, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier';
import * as THREE from 'three';
import { useModelCache } from './ModelCacheManager';
import { MODEL_OPTIMIZATION_CONFIG } from './PerformanceConfig';

/**
 * 模型批量优化工具
 * 批量处理和优化多个3D模型
 */

const ModelBatchOptimizerContext = createContext();

export const ModelBatchOptimizerProvider = ({ children }) => {
  const { loadModel, cacheModel } = useModelCache();
  const [optimizationQueue, setOptimizationQueue] = useState([]);
  const [optimizationProgress, setOptimizationProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    current: null,
    progress: 0
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState([]);
  const abortControllerRef = useRef(null);
  const loadersRef = useRef({});

  // 初始化加载器
  React.useEffect(() => {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    
    dracoLoader.setDecoderPath('/draco/');
    gltfLoader.setDRACOLoader(dracoLoader);
    
    loadersRef.current = {
      gltf: gltfLoader,
      draco: dracoLoader,
      simplify: new SimplifyModifier()
    };

    return () => {
      dracoLoader.dispose();
    };
  }, []);

  // 添加模型到优化队列
  const addToOptimizationQueue = (models) => {
    const newModels = Array.isArray(models) ? models : [models];
    setOptimizationQueue(prev => {
      const existing = new Set(prev.map(m => m.url));
      const filtered = newModels.filter(m => !existing.has(m.url));
      return [...prev, ...filtered];
    });
  };

  // 移除队列中的模型
  const removeFromOptimizationQueue = (urls) => {
    const urlsToRemove = Array.isArray(urls) ? urls : [urls];
    setOptimizationQueue(prev => prev.filter(m => !urlsToRemove.includes(m.url)));
  };

  // 清空优化队列
  const clearOptimizationQueue = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setOptimizationQueue([]);
    setOptimizationProgress({ total: 0, completed: 0, failed: 0, current: null, progress: 0 });
    setOptimizationResults([]);
    setIsOptimizing(false);
  };

  // 优化单个模型
  const optimizeModel = async (modelConfig, options = {}) => {
    const {
      url,
      targetQuality = 'medium',
      enableGeometryOptimization = true,
      enableTextureOptimization = true,
      enableMaterialOptimization = true,
      generateLOD = true
    } = modelConfig;

    const {
      onProgress,
      signal
    } = options;

    try {
      onProgress?.({ stage: 'loading', progress: 0 });
      
      // 加载原始模型
      const gltf = await new Promise((resolve, reject) => {
        loadersRef.current.gltf.load(
          url,
          resolve,
          (progress) => {
            const loadProgress = (progress.loaded / progress.total) * 0.3;
            onProgress?.({ stage: 'loading', progress: loadProgress });
          },
          reject
        );
      });

      if (signal?.aborted) throw new Error('Optimization aborted');

      onProgress?.({ stage: 'analyzing', progress: 0.3 });
      
      // 分析模型
      const analysis = analyzeModel(gltf);
      
      onProgress?.({ stage: 'optimizing', progress: 0.4 });
      
      // 优化几何体
      if (enableGeometryOptimization) {
        await optimizeGeometry(gltf, targetQuality, (progress) => {
          onProgress?.({ stage: 'geometry', progress: 0.4 + progress * 0.2 });
        });
      }

      if (signal?.aborted) throw new Error('Optimization aborted');

      // 优化纹理
      if (enableTextureOptimization) {
        await optimizeTextures(gltf, targetQuality, (progress) => {
          onProgress?.({ stage: 'texture', progress: 0.6 + progress * 0.2 });
        });
      }

      if (signal?.aborted) throw new Error('Optimization aborted');

      // 优化材质
      if (enableMaterialOptimization) {
        optimizeMaterials(gltf, targetQuality);
        onProgress?.({ stage: 'material', progress: 0.8 });
      }

      // 生成LOD
      let lodModels = [];
      if (generateLOD) {
        lodModels = await generateLODModels(gltf, targetQuality, (progress) => {
          onProgress?.({ stage: 'lod', progress: 0.8 + progress * 0.2 });
        });
      }

      onProgress?.({ stage: 'complete', progress: 1.0 });

      const result = {
        url,
        originalAnalysis: analysis,
        optimizedModel: gltf,
        lodModels,
        optimizationStats: {
          originalTriangles: analysis.triangles,
          optimizedTriangles: countTriangles(gltf),
          originalTextures: analysis.textures,
          optimizedTextures: countTextures(gltf),
          compressionRatio: analysis.size > 0 ? (analysis.size - getModelSize(gltf)) / analysis.size : 0
        },
        timestamp: Date.now()
      };

      return result;
    } catch (error) {
      throw new Error(`模型优化失败: ${error.message}`);
    }
  };

  // 分析模型
  const analyzeModel = (gltf) => {
    let triangles = 0;
    let vertices = 0;
    let textures = 0;
    let materials = 0;
    const textureSet = new Set();
    const materialSet = new Set();

    gltf.scene.traverse((object) => {
      if (object.isMesh) {
        const geometry = object.geometry;
        if (geometry) {
          triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
          vertices += geometry.attributes.position.count;
        }

        const material = object.material;
        if (material) {
          const materials = Array.isArray(material) ? material : [material];
          materials.forEach(mat => {
            materialSet.add(mat.uuid);
            
            // 统计纹理
            Object.keys(mat).forEach(key => {
              if (mat[key] && mat[key].isTexture) {
                textureSet.add(mat[key].uuid);
              }
            });
          });
        }
      }
    });

    return {
      triangles: Math.round(triangles),
      vertices,
      textures: textureSet.size,
      materials: materialSet.size,
      size: getModelSize(gltf)
    };
  };

  // 优化几何体
  const optimizeGeometry = async (gltf, quality, onProgress) => {
    const config = MODEL_OPTIMIZATION_CONFIG.geometry;
    const simplificationRatio = config.simplificationRatio[quality] || 0.6;
    let processed = 0;
    const meshes = [];

    // 收集所有网格
    gltf.scene.traverse((object) => {
      if (object.isMesh) {
        meshes.push(object);
      }
    });

    for (const mesh of meshes) {
      if (mesh.geometry) {
        // 简化几何体
        if (config.enableSimplification && simplificationRatio < 1.0) {
          const simplified = loadersRef.current.simplify.modify(
            mesh.geometry,
            Math.floor(mesh.geometry.attributes.position.count * simplificationRatio)
          );
          mesh.geometry.dispose();
          mesh.geometry = simplified;
        }

        // 优化属性
        if (config.enableCompression) {
          optimizeGeometryAttributes(mesh.geometry);
        }
      }

      processed++;
      onProgress?.(processed / meshes.length);
    }
  };

  // 优化几何体属性
  const optimizeGeometryAttributes = (geometry) => {
    // 移除未使用的属性
    const requiredAttributes = ['position', 'normal', 'uv'];
    const attributesToRemove = [];
    
    Object.keys(geometry.attributes).forEach(name => {
      if (!requiredAttributes.includes(name)) {
        attributesToRemove.push(name);
      }
    });
    
    attributesToRemove.forEach(name => {
      geometry.deleteAttribute(name);
    });

    // 压缩位置精度
    if (geometry.attributes.position) {
      const positions = geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i++) {
        positions[i] = Math.round(positions[i] * 1000) / 1000;
      }
    }

    // 重新计算边界
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  };

  // 优化纹理
  const optimizeTextures = async (gltf, quality, onProgress) => {
    const config = MODEL_OPTIMIZATION_CONFIG.texture;
    const textureMap = new Map();
    let processed = 0;
    const textures = [];

    // 收集所有纹理
    gltf.scene.traverse((object) => {
      if (object.isMesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          Object.keys(material).forEach(key => {
            if (material[key] && material[key].isTexture && !textureMap.has(material[key].uuid)) {
              textureMap.set(material[key].uuid, material[key]);
              textures.push(material[key]);
            }
          });
        });
      }
    });

    for (const texture of textures) {
      if (config.enableCompression) {
        // 调整纹理大小
        const maxSize = getMaxTextureSize(quality);
        if (texture.image && (texture.image.width > maxSize || texture.image.height > maxSize)) {
          await resizeTexture(texture, maxSize);
        }

        // 设置过滤和包装
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        // 生成mipmap
        if (config.enableMipmaps) {
          texture.generateMipmaps = true;
        }
      }

      processed++;
      onProgress?.(processed / textures.length);
    }
  };

  // 获取质量对应的最大纹理尺寸
  const getMaxTextureSize = (quality) => {
    const sizes = {
      ultra: 2048,
      high: 1024,
      medium: 512,
      low: 256,
      minimal: 128
    };
    return sizes[quality] || 512;
  };

  // 调整纹理大小
  const resizeTexture = async (texture, maxSize) => {
    if (!texture.image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const { width, height } = texture.image;
    const scale = Math.min(maxSize / width, maxSize / height);
    
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    
    ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
    
    texture.image = canvas;
    texture.needsUpdate = true;
  };

  // 优化材质
  const optimizeMaterials = (gltf, quality) => {
    const config = MODEL_OPTIMIZATION_CONFIG.material;
    const materialMap = new Map();

    gltf.scene.traverse((object) => {
      if (object.isMesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach((material, index) => {
          // 材质共享
          if (config.enableSharing) {
            const key = getMaterialKey(material);
            if (materialMap.has(key)) {
              if (Array.isArray(object.material)) {
                object.material[index] = materialMap.get(key);
              } else {
                object.material = materialMap.get(key);
              }
              return;
            }
            materialMap.set(key, material);
          }

          // 简化着色器
          if (config.simplifyShaders[quality]) {
            simplifyMaterialShader(material, quality);
          }
        });
      }
    });
  };

  // 获取材质键值
  const getMaterialKey = (material) => {
    const props = {
      type: material.type,
      color: material.color?.getHex(),
      roughness: material.roughness,
      metalness: material.metalness,
      transparent: material.transparent,
      opacity: material.opacity
    };
    return JSON.stringify(props);
  };

  // 简化材质着色器
  const simplifyMaterialShader = (material, quality) => {
    if (quality === 'low' || quality === 'minimal') {
      // 移除复杂的材质属性
      material.normalMap = null;
      material.roughnessMap = null;
      material.metalnessMap = null;
      material.aoMap = null;
      material.emissiveMap = null;
      
      if (quality === 'minimal') {
        material.envMap = null;
        material.lightMap = null;
      }
    }
  };

  // 生成LOD模型
  const generateLODModels = async (gltf, quality, onProgress) => {
    const config = MODEL_OPTIMIZATION_CONFIG.lod;
    if (!config.enableAutoGeneration) return [];

    const lodLevels = [
      { name: 'high', ratio: 0.8 },
      { name: 'medium', ratio: 0.5 },
      { name: 'low', ratio: 0.3 }
    ];

    const lodModels = [];
    
    for (let i = 0; i < lodLevels.length; i++) {
      const level = lodLevels[i];
      const lodGltf = gltf.scene.clone();
      
      // 简化LOD模型
      lodGltf.traverse((object) => {
        if (object.isMesh && object.geometry) {
          const simplified = loadersRef.current.simplify.modify(
            object.geometry,
            Math.floor(object.geometry.attributes.position.count * level.ratio)
          );
          object.geometry = simplified;
        }
      });

      lodModels.push({
        level: i,
        name: level.name,
        model: lodGltf,
        ratio: level.ratio
      });

      onProgress?.((i + 1) / lodLevels.length);
    }

    return lodModels;
  };

  // 计算三角形数量
  const countTriangles = (gltf) => {
    let triangles = 0;
    gltf.scene.traverse((object) => {
      if (object.isMesh && object.geometry) {
        triangles += object.geometry.index ? 
          object.geometry.index.count / 3 : 
          object.geometry.attributes.position.count / 3;
      }
    });
    return Math.round(triangles);
  };

  // 计算纹理数量
  const countTextures = (gltf) => {
    const textureSet = new Set();
    gltf.scene.traverse((object) => {
      if (object.isMesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          Object.keys(material).forEach(key => {
            if (material[key] && material[key].isTexture) {
              textureSet.add(material[key].uuid);
            }
          });
        });
      }
    });
    return textureSet.size;
  };

  // 获取模型大小（估算）
  const getModelSize = (gltf) => {
    let size = 0;
    gltf.scene.traverse((object) => {
      if (object.isMesh) {
        if (object.geometry) {
          size += object.geometry.attributes.position.count * 12; // 3 floats * 4 bytes
          if (object.geometry.attributes.normal) {
            size += object.geometry.attributes.normal.count * 12;
          }
          if (object.geometry.attributes.uv) {
            size += object.geometry.attributes.uv.count * 8; // 2 floats * 4 bytes
          }
        }
      }
    });
    return size;
  };

  // 开始批量优化
  const startBatchOptimization = async (options = {}) => {
    if (isOptimizing || optimizationQueue.length === 0) {
      return;
    }

    const {
      maxConcurrent = 2,
      onProgress,
      onComplete,
      onError
    } = options;

    setIsOptimizing(true);
    abortControllerRef.current = new AbortController();
    
    const total = optimizationQueue.length;
    let completed = 0;
    let failed = 0;
    const results = [];

    setOptimizationProgress({ total, completed, failed, current: null, progress: 0 });

    try {
      // 并发优化
      const semaphore = new Array(maxConcurrent).fill(null);
      const optimizeNext = async (index) => {
        while (index < optimizationQueue.length && !abortControllerRef.current?.signal.aborted) {
          const modelConfig = optimizationQueue[index];
          index += maxConcurrent;

          setOptimizationProgress(prev => ({ ...prev, current: modelConfig.url }));

          try {
            const result = await optimizeModel(modelConfig, {
              signal: abortControllerRef.current.signal,
              onProgress: (progress) => {
                onProgress?.({
                  total,
                  completed,
                  failed,
                  current: modelConfig.url,
                  currentProgress: progress,
                  overallProgress: (completed + progress.progress) / total
                });
              }
            });

            results.push(result);
            completed++;
          } catch (error) {
            if (error.message !== 'Optimization aborted') {
              failed++;
              onError?.(error, modelConfig);
            }
          }

          const progress = (completed + failed) / total;
          setOptimizationProgress({ total, completed, failed, current: null, progress });
        }
      };

      // 启动并发优化
      const promises = [];
      for (let i = 0; i < maxConcurrent; i++) {
        promises.push(optimizeNext(i));
      }

      await Promise.all(promises);
      
      setOptimizationResults(results);
      onComplete?.(results, completed, failed);
    } catch (error) {
      console.error('批量优化过程中发生错误:', error);
    } finally {
      setIsOptimizing(false);
      abortControllerRef.current = null;
    }
  };

  // 停止批量优化
  const stopBatchOptimization = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsOptimizing(false);
  };

  // 获取优化统计
  const getOptimizationStats = () => {
    const totalOriginalTriangles = optimizationResults.reduce((sum, result) => 
      sum + result.optimizationStats.originalTriangles, 0);
    
    const totalOptimizedTriangles = optimizationResults.reduce((sum, result) => 
      sum + result.optimizationStats.optimizedTriangles, 0);
    
    const averageCompressionRatio = optimizationResults.length > 0 ? 
      optimizationResults.reduce((sum, result) => 
        sum + result.optimizationStats.compressionRatio, 0) / optimizationResults.length : 0;

    return {
      totalModels: optimizationResults.length,
      totalOriginalTriangles,
      totalOptimizedTriangles,
      triangleReduction: totalOriginalTriangles > 0 ? 
        (totalOriginalTriangles - totalOptimizedTriangles) / totalOriginalTriangles : 0,
      averageCompressionRatio,
      results: optimizationResults
    };
  };

  const value = {
    // 队列管理
    optimizationQueue,
    addToOptimizationQueue,
    removeFromOptimizationQueue,
    clearOptimizationQueue,

    // 优化控制
    isOptimizing,
    optimizationProgress,
    startBatchOptimization,
    stopBatchOptimization,

    // 结果和统计
    optimizationResults,
    getOptimizationStats,

    // 单个模型优化
    optimizeModel
  };

  return (
    <ModelBatchOptimizerContext.Provider value={value}>
      {children}
    </ModelBatchOptimizerContext.Provider>
  );
};

export const useModelBatchOptimizer = () => {
  const context = useContext(ModelBatchOptimizerContext);
  if (!context) {
    throw new Error('useModelBatchOptimizer must be used within a ModelBatchOptimizerProvider');
  }
  return context;
};

// 批量优化控制面板组件
export const BatchOptimizationPanel = ({ className = '' }) => {
  const {
    optimizationQueue,
    isOptimizing,
    optimizationProgress,
    startBatchOptimization,
    stopBatchOptimization,
    clearOptimizationQueue,
    addToOptimizationQueue,
    getOptimizationStats
  } = useModelBatchOptimizer();

  const [stats, setStats] = useState(getOptimizationStats());
  const [showResults, setShowResults] = useState(false);

  React.useEffect(() => {
    setStats(getOptimizationStats());
  }, [optimizationProgress, getOptimizationStats]);

  const handleAddCommonModels = () => {
    const commonModels = [
      { url: '/models/buildings/office.glb', targetQuality: 'medium' },
      { url: '/models/buildings/factory.glb', targetQuality: 'medium' },
      { url: '/models/buildings/warehouse.glb', targetQuality: 'low' },
      { url: '/models/devices/solar_panel.glb', targetQuality: 'high' },
      { url: '/models/devices/wind_turbine.glb', targetQuality: 'high' }
    ];
    addToOptimizationQueue(commonModels);
  };

  const handleStartOptimization = () => {
    startBatchOptimization({
      maxConcurrent: 2,
      onProgress: (progress) => {
        console.log('优化进度:', progress);
      },
      onComplete: (results, completed, failed) => {
        console.log(`优化完成: ${completed} 成功, ${failed} 失败`);
      },
      onError: (error, model) => {
        console.error(`模型 ${model.url} 优化失败:`, error);
      }
    });
  };

  return (
    <div className={`batch-optimization-panel ${className}`} style={{
      position: 'fixed',
      top: '280px',
      right: '20px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      minWidth: '300px',
      maxWidth: '400px',
      maxHeight: '60vh',
      overflow: 'auto',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>批量模型优化</h4>
      
      {/* 队列状态 */}
      <div style={{ marginBottom: '15px' }}>
        <div>队列长度: {optimizationQueue.length}</div>
        {isOptimizing && (
          <div>
            <div>进度: {optimizationProgress.completed + optimizationProgress.failed}/{optimizationProgress.total}</div>
            <div>当前: {optimizationProgress.current || '准备中...'}</div>
            <div style={{
              width: '100%',
              height: '4px',
              background: '#333',
              borderRadius: '2px',
              marginTop: '5px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${optimizationProgress.progress * 100}%`,
                height: '100%',
                background: '#4CAF50',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* 优化统计 */}
      {stats.totalModels > 0 && (
        <div style={{ marginBottom: '15px', fontSize: '11px', opacity: 0.8 }}>
          <div>已优化: {stats.totalModels} 个模型</div>
          <div>三角形减少: {(stats.triangleReduction * 100).toFixed(1)}%</div>
          <div>平均压缩: {(stats.averageCompressionRatio * 100).toFixed(1)}%</div>
        </div>
      )}

      {/* 控制按钮 */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <button
          onClick={handleAddCommonModels}
          style={{
            padding: '4px 8px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          添加常用模型
        </button>
        
        {isOptimizing ? (
          <button
            onClick={stopBatchOptimization}
            style={{
              padding: '4px 8px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            停止优化
          </button>
        ) : (
          <button
            onClick={handleStartOptimization}
            disabled={optimizationQueue.length === 0}
            style={{
              padding: '4px 8px',
              background: optimizationQueue.length > 0 ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: optimizationQueue.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            开始优化
          </button>
        )}
        
        <button
          onClick={clearOptimizationQueue}
          style={{
            padding: '4px 8px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          清空队列
        </button>
        
        <button
          onClick={() => setShowResults(!showResults)}
          style={{
            padding: '4px 8px',
            background: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {showResults ? '隐藏结果' : '显示结果'}
        </button>
      </div>

      {/* 优化结果 */}
      {showResults && stats.results.length > 0 && (
        <div style={{ fontSize: '10px' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>优化结果</h5>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {stats.results.map((result, index) => (
              <div key={index} style={{
                padding: '6px',
                margin: '4px 0',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                fontSize: '9px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                  {result.url.split('/').pop()}
                </div>
                <div>三角形: {result.optimizationStats.originalTriangles} → {result.optimizationStats.optimizedTriangles}</div>
                <div>压缩率: {(result.optimizationStats.compressionRatio * 100).toFixed(1)}%</div>
                <div>LOD级别: {result.lodModels.length}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelBatchOptimizerProvider;