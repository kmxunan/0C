import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';
import ModelLoader from './ModelLoader';
import { usePerformanceOptimizer } from '../utils/PerformanceOptimizer';
import { useModelQuality } from '../utils/ModelQualityManager';
import { useModelCache } from '../utils/ModelCacheManager';
import { useLODObject } from '../utils/LODSystem';

/**
 * 增强的建筑物模型组件
 * 支持GLTF模型加载、LOD系统和性能优化
 */
const BuildingModel = ({ building, isSelected, settings = {} }) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const { setSelectedBuilding } = useDigitalTwinStore();
  const { camera } = useThree();
  const performanceOptimizer = usePerformanceOptimizer();
  const { getOptimizedModelUrl, getLODLevel, applyOptimization } = useModelQuality();
  const { loadModel, preloadModel } = useModelCache();
  const { currentLOD, updateLOD } = useLODObject(`building-${building.id}`, null, {
    onLODChange: (newLOD, oldLOD) => {
      console.log(`建筑 ${building.name} LOD变化: ${oldLOD?.name} -> ${newLOD?.name}`);
      handleLODChangeCallback(newLOD.level, 0);
    }
  });

  // 建筑物颜色动画
  const [spring, api] = useSpring(() => ({
    scale: isSelected ? 1.05 : 1,
    color: isSelected ? '#ff6b6b' : (hovered ? '#4ecdc4' : '#95a5a6'),
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  // 更新动画状态
  React.useEffect(() => {
    api.start({
      scale: isSelected ? 1.05 : (hovered ? 1.02 : 1),
      color: isSelected ? '#ff6b6b' : (hovered ? '#4ecdc4' : '#95a5a6')
    });
  }, [isSelected, hovered, api]);

  // 能耗指示器动画
  useFrame((state) => {
    if (meshRef.current && building.energyConsumption > 80) {
      // 高能耗建筑闪烁效果
      const intensity = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7;
      if (meshRef.current.material) {
        meshRef.current.material.emissive.setRGB(intensity * 0.3, 0, 0);
      }
    }
  });

  // 计算相机距离用于LOD
  const cameraPosition = useMemo(() => {
    return [camera.position.x, camera.position.y, camera.position.z];
  }, [camera.position]);

  // 注册模型到性能优化器
  useEffect(() => {
    if (performanceOptimizer && building.id) {
      const modelInfo = {
        id: building.id,
        type: 'building',
        position: [building.x || 0, 0, building.z || 0],
        priority: isSelected ? 'high' : 'normal',
        triangleCount: building.triangleCount || 1000,
        boundingBox: {
          width: building.width || 8,
          height: building.height || 10,
          depth: building.depth || 6
        }
      };
      
      performanceOptimizer.registerModel(modelInfo);
      
      return () => {
        performanceOptimizer.unregisterModel(building.id);
      };
    }
  }, [performanceOptimizer, building.id, building.x, building.z, isSelected]);

  // 监听性能优化器的建议
  useEffect(() => {
    if (performanceOptimizer) {
      const handlePerformanceUpdate = () => {
        const metrics = performanceOptimizer.getPerformanceMetrics();
        const shouldUsePerformanceMode = metrics.fps < 30 || metrics.triangleCount > 100000;
        setPerformanceMode(shouldUsePerformanceMode);
      };
      
      // 定期检查性能
      const interval = setInterval(handlePerformanceUpdate, 1000);
      return () => clearInterval(interval);
    }
  }, [performanceOptimizer]);

  const handleClick = (event) => {
    event.stopPropagation();
    setSelectedBuilding(isSelected ? null : building.id);
  };

  const handlePointerOver = (event) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  // 模型加载成功回调
  const handleModelLoad = (model) => {
    setModelLoaded(true);
    setModelError(false);
    console.log(`建筑物模型加载成功: ${building.name}`);
    
    // 预加载其他LOD级别的模型
    if (preloadModel) {
      [1, 2].forEach(lodLevel => {
        const url = getModelUrl(lodLevel);
        preloadModel(url, { priority: 'low' });
      });
    }
  };

  // 模型加载失败回调
  const handleModelError = (error) => {
    setModelError(true);
    setModelLoaded(false);
    console.warn(`建筑物模型加载失败: ${building.name}`, error);
  };

  // LOD变化回调
  const handleLODChangeCallback = (newLOD, distance) => {
    if (performanceOptimizer) {
      performanceOptimizer.updateModelMetrics(building.id, {
        currentLOD: newLOD,
        distance: distance,
        lastUpdate: Date.now()
      });
    }
  };

  // 根据建筑类型和质量设置确定模型URL
  const getModelUrl = (lodLevel = 0) => {
    const baseUrl = '/models/';
    let modelName;
    switch (building.type) {
      case 'office':
        modelName = 'office_building';
        break;
      case 'factory':
        modelName = 'factory_building';
        break;
      case 'warehouse':
        modelName = 'warehouse_building';
        break;
      default:
        modelName = 'building';
        break;
    }
    
    // 根据LOD级别选择不同质量的模型
    const qualitySuffix = lodLevel > 2 ? '_lod2' : lodLevel > 1 ? '_lod1' : '';
    
    // 使用模型质量管理器获取优化后的模型URL
    if (getOptimizedModelUrl) {
      const optimizedUrl = getOptimizedModelUrl(modelName, lodLevel);
      if (optimizedUrl) return optimizedUrl;
    }
    
    return `${baseUrl}${modelName}${qualitySuffix}.glb`;
  };

  // 回退几何体（当GLTF模型加载失败时使用）
  const getFallbackGeometry = () => {
    switch (building.type) {
      case 'office':
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[building.width || 8, building.height || 12, building.depth || 6]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.7}
              metalness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      case 'factory':
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[building.width || 15, building.height || 8, building.depth || 10]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.7}
              metalness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      case 'warehouse':
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[building.width || 20, building.height || 6, building.depth || 12]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.7}
              metalness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      default:
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[building.width || 8, building.height || 10, building.depth || 6]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.7}
              metalness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
    }
  };

  return (
    <group 
      ref={groupRef}
      position={[building.x || 0, 0, building.z || 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 建筑物主体 - 优先使用GLTF模型 */}
      <animated.group
        position={[0, (building.height || 10) / 2, 0]}
        scale={spring.scale}
      >
        {settings.useGLTFModels !== false ? (
          <ModelLoader
            url={getModelUrl(currentLOD?.level || 0)}
            position={[0, 0, 0]}
            enableLOD={settings.enableLOD !== false}
            cameraPosition={cameraPosition}
            performanceMode={performanceMode}
            onLoad={handleModelLoad}
            onError={handleModelError}
            onLODChange={handleLODChangeCallback}
            fallbackGeometry={getFallbackGeometry()}
            qualityLevel={currentLOD?.name || 'medium'}
            enableOptimization={true}
            useCache={true}
          />
        ) : (
          getFallbackGeometry()
        )}
      </animated.group>

      {/* 建筑物标签 */}
      {(isSelected || hovered) && (
        <Html
          position={[0, (building.height || 10) + 2, 0]}
          center
          distanceFactor={10}
          occlude
        >
          <div className="building-label" style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontWeight: 'bold' }}>{building.name}</div>
            <div>类型: {building.type}</div>
            <div>能耗: {building.energyConsumption || 0}kWh</div>
            {building.carbonEmission && (
              <div>碳排放: {building.carbonEmission}kg CO₂</div>
            )}
            {settings.showModelInfo && (
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                模型: {modelLoaded ? 'GLTF' : modelError ? '几何体(回退)' : '加载中...'}
              </div>
            )}
          </div>
        </Html>
      )}

      {/* 能耗指示器 */}
      {building.energyConsumption > 0 && (
        <mesh position={[0, (building.height || 10) + 1, 0]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshBasicMaterial
            color={building.energyConsumption > 80 ? '#ff4757' : 
                   building.energyConsumption > 50 ? '#ffa502' : '#2ed573'}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* 告警指示器 */}
      {building.hasAlert && (
        <mesh position={[(building.width || 8) / 2 + 1, (building.height || 10) / 2, 0]}>
          <coneGeometry args={[0.5, 1, 6]} />
          <meshBasicMaterial color="#ff3838" />
        </mesh>
      )}

      {/* 性能优化边界框（仅在开发模式显示） */}
      {settings.showBoundingBox && process.env.NODE_ENV === 'development' && (
        <mesh>
          <boxGeometry args={[building.width || 8, building.height || 10, building.depth || 6]} />
          <meshBasicMaterial color="#00ff00" wireframe transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
};

export default BuildingModel;