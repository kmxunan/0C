import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier';
import { modelQualityConfig } from './modelQualityConfig';

/**
 * 3D模型优化器
 * 提供模型简化、LOD生成、纹理压缩等功能
 */
class ModelOptimizer {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.simplifyModifier = new SimplifyModifier();
    this.textureLoader = new THREE.TextureLoader();
    this.optimizedModels = new Map();
    this.lodCache = new Map();
    
    // 配置Draco解码器
    this.dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  /**
   * 优化GLTF模型
   * @param {string} url - 模型URL
   * @param {Object} options - 优化选项
   * @returns {Promise<Object>} 优化后的模型数据
   */
  async optimizeModel(url, options = {}) {
    const {
      generateLOD = true,
      compressTextures = true,
      simplifyGeometry = true,
      qualityLevel = 'medium',
      targetTriangleCount = null
    } = options;

    try {
      // 检查缓存
      const cacheKey = `${url}_${qualityLevel}`;
      if (this.optimizedModels.has(cacheKey)) {
        return this.optimizedModels.get(cacheKey);
      }

      // 加载原始模型
      const gltf = await this.loadModel(url);
      const originalModel = gltf.scene.clone();

      // 分析模型复杂度
      const modelStats = this.analyzeModel(originalModel);
      console.log('模型分析结果:', modelStats);

      // 优化几何体
      if (simplifyGeometry) {
        this.optimizeGeometry(originalModel, qualityLevel, targetTriangleCount);
      }

      // 优化材质和纹理
      if (compressTextures) {
        await this.optimizeTextures(originalModel, qualityLevel);
      }

      // 生成LOD级别
      const lodModels = generateLOD ? 
        await this.generateLODLevels(originalModel, qualityLevel) : 
        [originalModel];

      // 优化结果
      const optimizedResult = {
        originalStats: modelStats,
        lodModels: lodModels,
        qualityLevel: qualityLevel,
        optimizedAt: Date.now()
      };

      // 缓存结果
      this.optimizedModels.set(cacheKey, optimizedResult);
      
      return optimizedResult;
    } catch (error) {
      console.error('模型优化失败:', error);
      throw error;
    }
  }

  /**
   * 加载GLTF模型
   * @param {string} url - 模型URL
   * @returns {Promise<Object>} GLTF对象
   */
  loadModel(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) => {
          console.log('模型加载进度:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => reject(error)
      );
    });
  }

  /**
   * 分析模型复杂度
   * @param {THREE.Object3D} model - 3D模型
   * @returns {Object} 模型统计信息
   */
  analyzeModel(model) {
    let triangleCount = 0;
    let vertexCount = 0;
    let materialCount = 0;
    let textureCount = 0;
    const materials = new Set();
    const textures = new Set();

    model.traverse((child) => {
      if (child.isMesh) {
        const geometry = child.geometry;
        if (geometry.index) {
          triangleCount += geometry.index.count / 3;
        } else {
          triangleCount += geometry.attributes.position.count / 3;
        }
        vertexCount += geometry.attributes.position.count;

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => materials.add(mat));
          } else {
            materials.add(child.material);
          }
        }
      }
    });

    materials.forEach(material => {
      materialCount++;
      Object.values(material).forEach(value => {
        if (value && value.isTexture) {
          textures.add(value);
        }
      });
    });

    textureCount = textures.size;

    return {
      triangleCount: Math.floor(triangleCount),
      vertexCount,
      materialCount,
      textureCount,
      boundingBox: new THREE.Box3().setFromObject(model)
    };
  }

  /**
   * 优化几何体
   * @param {THREE.Object3D} model - 3D模型
   * @param {string} qualityLevel - 质量级别
   * @param {number} targetTriangleCount - 目标三角形数量
   */
  optimizeGeometry(model, qualityLevel, targetTriangleCount) {
    const qualitySettings = modelQualityConfig.qualityLevels[qualityLevel];
    const simplificationRatio = qualitySettings?.geometryOptimization?.simplification || 0.8;

    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geometry = child.geometry;
        
        // 计算当前三角形数量
        const currentTriangles = geometry.index ? 
          geometry.index.count / 3 : 
          geometry.attributes.position.count / 3;

        // 确定目标三角形数量
        const targetTriangles = targetTriangleCount || 
          Math.floor(currentTriangles * simplificationRatio);

        if (currentTriangles > targetTriangles) {
          try {
            // 使用SimplifyModifier简化几何体
            const simplifiedGeometry = this.simplifyModifier.modify(
              geometry, 
              Math.floor(targetTriangles * 3)
            );
            
            if (simplifiedGeometry) {
              child.geometry.dispose();
              child.geometry = simplifiedGeometry;
              console.log(`几何体简化: ${currentTriangles} -> ${targetTriangles} 三角形`);
            }
          } catch (error) {
            console.warn('几何体简化失败:', error);
          }
        }

        // 优化几何体属性
        this.optimizeGeometryAttributes(child.geometry);
      }
    });
  }

  /**
   * 优化几何体属性
   * @param {THREE.BufferGeometry} geometry - 几何体
   */
  optimizeGeometryAttributes(geometry) {
    // 移除未使用的属性
    const requiredAttributes = ['position', 'normal', 'uv'];
    const attributesToRemove = [];

    for (const attributeName in geometry.attributes) {
      if (!requiredAttributes.includes(attributeName)) {
        attributesToRemove.push(attributeName);
      }
    }

    attributesToRemove.forEach(attr => {
      geometry.deleteAttribute(attr);
    });

    // 计算边界球
    geometry.computeBoundingSphere();
    
    // 计算法线（如果不存在）
    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }
  }

  /**
   * 优化纹理
   * @param {THREE.Object3D} model - 3D模型
   * @param {string} qualityLevel - 质量级别
   */
  async optimizeTextures(model, qualityLevel) {
    const qualitySettings = modelQualityConfig.qualityLevels[qualityLevel];
    const textureSettings = qualitySettings?.textureOptimization || {};
    const maxTextureSize = textureSettings.maxSize || 1024;
    const compressionFormat = textureSettings.format || 'RGBA';

    const processedTextures = new Set();

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? 
          child.material : [child.material];

        materials.forEach(material => {
          this.optimizeMaterialTextures(material, maxTextureSize, processedTextures);
        });
      }
    });
  }

  /**
   * 优化材质纹理
   * @param {THREE.Material} material - 材质
   * @param {number} maxSize - 最大纹理尺寸
   * @param {Set} processedTextures - 已处理的纹理集合
   */
  optimizeMaterialTextures(material, maxSize, processedTextures) {
    const textureProperties = [
      'map', 'normalMap', 'roughnessMap', 'metalnessMap', 
      'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'
    ];

    textureProperties.forEach(prop => {
      const texture = material[prop];
      if (texture && texture.isTexture && !processedTextures.has(texture)) {
        this.optimizeTexture(texture, maxSize);
        processedTextures.add(texture);
      }
    });
  }

  /**
   * 优化单个纹理
   * @param {THREE.Texture} texture - 纹理
   * @param {number} maxSize - 最大尺寸
   */
  optimizeTexture(texture, maxSize) {
    if (texture.image) {
      const { width, height } = texture.image;
      
      if (width > maxSize || height > maxSize) {
        // 创建canvas进行纹理压缩
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const scale = Math.min(maxSize / width, maxSize / height);
        canvas.width = Math.floor(width * scale);
        canvas.height = Math.floor(height * scale);
        
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        
        // 更新纹理
        texture.image = canvas;
        texture.needsUpdate = true;
        
        console.log(`纹理压缩: ${width}x${height} -> ${canvas.width}x${canvas.height}`);
      }
    }

    // 设置纹理过滤
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
  }

  /**
   * 生成LOD级别
   * @param {THREE.Object3D} originalModel - 原始模型
   * @param {string} qualityLevel - 质量级别
   * @returns {Array<THREE.Object3D>} LOD模型数组
   */
  async generateLODLevels(originalModel, qualityLevel) {
    const lodLevels = modelQualityConfig.lodSystem.levels;
    const lodModels = [];

    for (let i = 0; i < lodLevels.length; i++) {
      const lodLevel = lodLevels[i];
      const lodModel = originalModel.clone();
      
      // 根据LOD级别调整模型复杂度
      const simplificationRatio = lodLevel.triangleReduction;
      
      lodModel.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const geometry = child.geometry;
          const currentTriangles = geometry.index ? 
            geometry.index.count / 3 : 
            geometry.attributes.position.count / 3;
          
          const targetTriangles = Math.floor(currentTriangles * simplificationRatio);
          
          if (targetTriangles < currentTriangles) {
            try {
              const simplifiedGeometry = this.simplifyModifier.modify(
                geometry.clone(), 
                Math.floor(targetTriangles * 3)
              );
              
              if (simplifiedGeometry) {
                child.geometry = simplifiedGeometry;
              }
            } catch (error) {
              console.warn(`LOD ${i} 几何体简化失败:`, error);
            }
          }
        }
      });

      lodModels.push(lodModel);
      console.log(`生成LOD级别 ${i}: 简化比例 ${simplificationRatio}`);
    }

    return lodModels;
  }

  /**
   * 获取优化建议
   * @param {Object} modelStats - 模型统计信息
   * @returns {Array<string>} 优化建议列表
   */
  getOptimizationSuggestions(modelStats) {
    const suggestions = [];

    if (modelStats.triangleCount > 100000) {
      suggestions.push('模型三角形数量过多，建议进行几何体简化');
    }

    if (modelStats.textureCount > 10) {
      suggestions.push('纹理数量较多，建议合并纹理或使用纹理图集');
    }

    if (modelStats.materialCount > 20) {
      suggestions.push('材质数量过多，建议合并相似材质');
    }

    return suggestions;
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.optimizedModels.clear();
    this.lodCache.clear();
  }

  /**
   * 释放资源
   */
  dispose() {
    this.clearCache();
    this.dracoLoader.dispose();
  }
}

// 全局模型优化器实例
const modelOptimizer = new ModelOptimizer();

/**
 * React Hook for model optimization
 */
export const useModelOptimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationError, setOptimizationError] = useState(null);

  const optimizeModel = async (url, options = {}) => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    setOptimizationError(null);

    try {
      const result = await modelOptimizer.optimizeModel(url, options);
      setOptimizationProgress(100);
      return result;
    } catch (error) {
      setOptimizationError(error.message);
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  };

  const getOptimizationSuggestions = (modelStats) => {
    return modelOptimizer.getOptimizationSuggestions(modelStats);
  };

  return {
    optimizeModel,
    getOptimizationSuggestions,
    isOptimizing,
    optimizationProgress,
    optimizationError,
    clearCache: () => modelOptimizer.clearCache()
  };
};

export default modelOptimizer;
export { ModelOptimizer };