import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import ModelLoader from './ModelLoader';
// import { usePerformanceOptimizer } from '../utils/PerformanceOptimizer';
// import { useModelQuality } from '../utils/ModelQualityManager';
// import { useModelCache } from '../utils/ModelCacheManager';
// import { useLODObject } from '../utils/LODSystem';

/**
 * 增强的设备模型组件
 * 支持GLTF模型加载、LOD系统和性能优化
 */
const DeviceModel = ({ device, settings = {} }) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const { camera } = useThree();
  // const performanceOptimizer = usePerformanceOptimizer();
  // const { getOptimizedModelUrl, getLODLevel, applyOptimization } = useModelQuality();
  // const { loadModel, preloadModel } = useModelCache();
  // const { currentLOD, updateLOD } = useLODObject(`device-${device.id}`, null, {
  //   onLODChange: (newLOD, oldLOD) => {
  //     console.log(`设备 ${device.name} LOD变化: ${oldLOD?.name} -> ${newLOD?.name}`);
  //     if (handleLODChange) handleLODChange(newLOD.level, 0);
  //   }
  // });
  const currentLOD = { level: 0, name: 'medium' }; // 临时替代

  // 设备状态动画
  const [spring, api] = useSpring(() => ({
    scale: 1,
    color: getDeviceColor(device.status),
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  // 根据设备状态获取颜色
  function getDeviceColor(status) {
    switch (status) {
      case 'online': return '#2ed573';
      case 'offline': return '#ff4757';
      case 'warning': return '#ffa502';
      case 'maintenance': return '#5352ed';
      default: return '#747d8c';
    }
  }

  // 设备运行状态动画
  useFrame((state) => {
    if (meshRef.current && device.status === 'online') {
      // 在线设备轻微脉冲效果
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  // 更新动画状态
  React.useEffect(() => {
    api.start({
      scale: hovered ? 1.2 : 1,
      color: getDeviceColor(device.status)
    });
  }, [hovered, device.status, api]);

  // 计算相机距离用于LOD
  const cameraPosition = useMemo(() => {
    return [camera.position.x, camera.position.y, camera.position.z];
  }, [camera.position]);

  // 注册设备到性能优化器
  // useEffect(() => {
  //   if (performanceOptimizer && device.id) {
  //     const modelInfo = {
  //       id: device.id,
  //       type: 'device',
  //       subType: device.type,
  //       position: [device.x || 0, device.y || 0, device.z || 0],
  //       priority: device.status === 'online' ? 'normal' : 'low',
  //       triangleCount: getDeviceTriangleCount(device.type),
  //       boundingBox: getDeviceBoundingBox(device.type)
  //     };
  //     
  //     performanceOptimizer.registerModel(modelInfo);
  //     
  //     return () => {
  //       performanceOptimizer.unregisterModel(device.id);
  //     };
  //   }
  // }, [performanceOptimizer, device.id, device.x, device.y, device.z, device.status]);

  // 监听性能优化器的建议
  // useEffect(() => {
  //   if (performanceOptimizer) {
  //     const handlePerformanceUpdate = () => {
  //       const metrics = performanceOptimizer.getPerformanceMetrics();
  //       const shouldUsePerformanceMode = metrics.fps < 30 || metrics.triangleCount > 100000;
  //       setPerformanceMode(shouldUsePerformanceMode);
  //     };
  //     
  //     const interval = setInterval(handlePerformanceUpdate, 1000);
  //     return () => clearInterval(interval);
  //   }
  // }, [performanceOptimizer]);

  // 获取设备三角形数量估算
  const getDeviceTriangleCount = (deviceType) => {
    switch (deviceType) {
      case 'wind_turbine': return 2000;
      case 'solar_panel': return 500;
      case 'transformer': return 800;
      case 'battery': return 400;
      case 'ev_charger': return 600;
      case 'sensor': return 200;
      default: return 300;
    }
  };

  // 获取设备边界框
  const getDeviceBoundingBox = (deviceType) => {
    switch (deviceType) {
      case 'wind_turbine': return { width: 4, height: 6, depth: 4 };
      case 'solar_panel': return { width: 2, height: 0.1, depth: 1 };
      case 'transformer': return { width: 1.5, height: 2, depth: 1.5 };
      case 'battery': return { width: 1, height: 1.5, depth: 0.8 };
      case 'ev_charger': return { width: 0.8, height: 2, depth: 0.6 };
      case 'sensor': return { width: 0.6, height: 0.6, depth: 0.6 };
      default: return { width: 0.8, height: 0.8, depth: 0.8 };
    }
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
    console.log(`设备模型加载成功: ${device.name}`);
    
    // 预加载其他LOD级别的模型
    // if (preloadModel) {
    //   [1, 2].forEach(lodLevel => {
    //     const url = getModelUrl(lodLevel);
    //     preloadModel(url, { priority: 'low' });
    //   });
    // }
  };

  // 模型加载失败回调
  const handleModelError = (error) => {
    setModelError(true);
    setModelLoaded(false);
    console.warn(`设备模型加载失败: ${device.name}`, error);
  };

  // LOD变化回调
  const handleLODChange = (newLOD, distance) => {
    // if (performanceOptimizer) {
    //   performanceOptimizer.updateModelMetrics(device.id, {
    //     currentLOD: newLOD,
    //     distance: distance,
    //     lastUpdate: Date.now()
    //   });
    // }
    console.log(`LOD变化: ${newLOD}, 距离: ${distance}`);
  };

  // 根据设备类型和质量设置确定模型URL
  const getModelUrl = (lodLevel = 0) => {
    const baseUrl = '/models/devices/';
    let modelName;
    switch (device.type) {
      case 'solar_panel':
        modelName = 'solar_panel';
        break;
      case 'wind_turbine':
        modelName = 'wind_turbine';
        break;
      case 'battery':
        modelName = 'battery';
        break;
      case 'transformer':
        modelName = 'transformer';
        break;
      case 'sensor':
        modelName = 'sensor';
        break;
      case 'ev_charger':
        modelName = 'ev_charger';
        break;
      default:
        modelName = 'generic_device';
        break;
    }
    
    // 根据LOD级别选择不同质量的模型
    const qualitySuffix = lodLevel > 2 ? '_lod2' : lodLevel > 1 ? '_lod1' : '';
    
    // 使用模型质量管理器获取优化后的模型URL
    // if (getOptimizedModelUrl) {
    //   const optimizedUrl = getOptimizedModelUrl(modelName, lodLevel);
    //   if (optimizedUrl) return optimizedUrl;
    // }
    
    return `${baseUrl}${modelName}${qualitySuffix}.glb`;
  };

  // 回退几何体（当GLTF模型加载失败时使用）
  const getFallbackGeometry = () => {
    switch (device.type) {
      case 'solar_panel':
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[2, 0.1, 1]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.4}
              metalness={0.6}
              emissive={device.status === 'online' ? new THREE.Color(0x001100) : new THREE.Color(0x000000)}
            />
          </mesh>
        );
      case 'wind_turbine':
        return (
          <group>
            <mesh ref={meshRef}>
              <cylinderGeometry args={[0.2, 0.2, 3, 8]} />
              <animated.meshStandardMaterial
                color={spring.color}
                roughness={0.4}
                metalness={0.6}
                emissive={device.status === 'online' ? new THREE.Color(0x001100) : new THREE.Color(0x000000)}
              />
            </mesh>
            {/* 风力发电机叶片 */}
            {device.status === 'online' && (
              <group position={[0, 1.5, 0]}>
                <mesh rotation={[0, 0, Date.now() * 0.01]}>
                  <boxGeometry args={[0.05, 2, 0.1]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
                <mesh rotation={[0, 0, Date.now() * 0.01 + Math.PI * 2/3]}>
                  <boxGeometry args={[0.05, 2, 0.1]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
                <mesh rotation={[0, 0, Date.now() * 0.01 + Math.PI * 4/3]}>
                  <boxGeometry args={[0.05, 2, 0.1]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              </group>
            )}
          </group>
        );
      case 'battery':
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[1, 1.5, 0.8]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.4}
              metalness={0.6}
              emissive={device.status === 'online' ? new THREE.Color(0x001100) : new THREE.Color(0x000000)}
            />
          </mesh>
        );
      case 'transformer':
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[1.5, 2, 1.5]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.4}
              metalness={0.6}
              emissive={device.status === 'online' ? new THREE.Color(0x001100) : new THREE.Color(0x000000)}
            />
          </mesh>
        );
      case 'sensor':
        return (
          <mesh ref={meshRef}>
            <sphereGeometry args={[0.3, 8, 6]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.4}
              metalness={0.6}
              emissive={device.status === 'online' ? new THREE.Color(0x001100) : new THREE.Color(0x000000)}
            />
          </mesh>
        );
      default:
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <animated.meshStandardMaterial
              color={spring.color}
              roughness={0.4}
              metalness={0.6}
              emissive={device.status === 'online' ? new THREE.Color(0x001100) : new THREE.Color(0x000000)}
            />
          </mesh>
        );
    }
  };

  const getDeviceHeight = () => {
    switch (device.type) {
      case 'solar_panel': return 0.05;
      case 'wind_turbine': return 1.5;
      case 'battery': return 0.75;
      case 'transformer': return 1;
      case 'sensor': return 0.3;
      default: return 0.4;
    }
  };

  return (
    <group 
      ref={groupRef}
      position={[device.x || 0, 0, device.z || 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 设备主体 - 优先使用GLTF模型 */}
      <animated.group
        position={[0, getDeviceHeight(), 0]}
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
            onLODChange={handleLODChange}
            fallbackGeometry={getFallbackGeometry()}
            qualityLevel={currentLOD?.name || 'medium'}
            enableOptimization={true}
            useCache={true}
          />
        ) : (
          getFallbackGeometry()
        )}
      </animated.group>

      {/* 设备信息标签 */}
      {hovered && (
        <Html
          position={[0, getDeviceHeight() * 2 + 1, 0]}
          center
          distanceFactor={8}
          occlude
        >
          <div className="device-label" style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontWeight: 'bold' }}>{device.name}</div>
            <div>类型: {device.type}</div>
            <div>状态: {device.status}</div>
            {device.power && (
              <div>功率: {device.power}W</div>
            )}
            {device.efficiency && (
              <div>效率: {device.efficiency}%</div>
            )}
            {settings.showModelInfo && (
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                模型: {modelLoaded ? 'GLTF' : modelError ? '几何体(回退)' : '加载中...'}
              </div>
            )}
          </div>
        </Html>
      )}

      {/* 状态指示灯 */}
      <mesh position={[0, getDeviceHeight() * 2 + 0.5, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshBasicMaterial
          color={getDeviceColor(device.status)}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 数据传输效果 */}
      {device.status === 'online' && settings.showDataFlow && (
        <mesh position={[0, getDeviceHeight() + 2, 0]}>
          <ringGeometry args={[0.5, 0.7, 16]} />
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={Math.sin(Date.now() * 0.005) * 0.3 + 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 性能优化边界框（仅在开发模式显示） */}
      {settings.showBoundingBox && process.env.NODE_ENV === 'development' && (
        <mesh position={[0, getDeviceHeight(), 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#00ff00" wireframe transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
};

export default DeviceModel;