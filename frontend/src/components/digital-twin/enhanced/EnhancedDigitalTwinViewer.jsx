import React, { Suspense, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  Sky,
  Stars,
  ContactShadows,
  Text,
  Billboard,
  Html
} from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import CampusModel from '../models/CampusModel';
import DynamicEnvironment from '../environment/DynamicEnvironment';
import ParticleEffects from '../environment/ParticleEffects';
import RealTimeDataFlow from '../data-visualization/RealTimeDataFlow';
import MinimapNavigation from './MinimapNavigation';
import MinimapNavigation2D from './MinimapNavigation2D';
import ViewportManager from './ViewportManager';

/**
 * 增强版数字孪生查看器
 * 提供高质量的3D渲染和丰富的交互功能
 */
const EnhancedDigitalTwinViewer = ({ 
  className,
  showPerformanceMonitor = true,
  enableAdvancedEffects = true,
  autoRotate = false,
  showMinimap = true,
  showViewportManager = true,
  force2DMinimap = false,
  settings = {} 
}) => {
  const { camera, scene, gl } = useThree();
  const controlsRef = useRef();
  const [timeOfDay, setTimeOfDay] = useState(12); // 24小时制
  const [weather, setWeather] = useState('clear'); // clear, cloudy, rainy
  const [showParticles, setShowParticles] = useState(true);
  const [showDataFlow, setShowDataFlow] = useState(true);
  const [minimapVisible, setMinimapVisible] = useState(showMinimap);
  const [viewportManagerVisible, setViewportManagerVisible] = useState(showViewportManager);
  const [webglError, setWebglError] = useState(false);
  const [use2DMinimap, setUse2DMinimap] = useState(false);
  
  // 数字孪生状态
  const {
    campusData,
    selectedBuilding,
    isLoading,
    error,
    fetchCampusData
  } = useDigitalTwinStore();

  // 相机动画
  const [cameraPosition, setCameraPosition] = useSpring(() => ({
    position: [20, 20, 20],
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  // 环境光动画
  const [lightIntensity, setLightIntensity] = useSpring(() => ({
    intensity: 0.5,
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  // 时间循环效果
  useFrame((state) => {
    // 自动时间推进（可选）
    // setTimeOfDay(prev => (prev + 0.01) % 24);
    
    // 相机轻微摆动效果
    if (controlsRef.current && !controlsRef.current.enabled) {
      const time = state.clock.elapsedTime;
      camera.position.y += Math.sin(time * 0.5) * 0.01;
    }
  });

  // 根据时间调整环境
  useEffect(() => {
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    const intensity = isNight ? 0.2 : 0.8;
    setLightIntensity({ intensity });
  }, [timeOfDay, setLightIntensity]);

  // 选中建筑时的相机动画
  useEffect(() => {
    if (selectedBuilding && campusData?.buildings) {
      const building = campusData.buildings.find(b => b.id === selectedBuilding);
      if (building) {
        const targetPosition = [
          building.x + 10,
          building.y + building.height + 5,
          building.z + 10
        ];
        setCameraPosition({ position: targetPosition });
      }
    } else {
      // 重置到默认视角
      setCameraPosition({ position: [20, 20, 20] });
    }
  }, [selectedBuilding, campusData, setCameraPosition]);

  // 初始化数据加载
  useEffect(() => {
    if (!campusData && !isLoading && !error) {
      fetchCampusData();
    }
  }, [campusData, isLoading, error, fetchCampusData]);

  // WebGL错误检测
  useEffect(() => {
    const handleWebGLError = (event) => {
      console.warn('WebGL error detected:', event);
      setWebglError(true);
      setUse2DMinimap(true);
    };

    const handleContextLost = (event) => {
      console.warn('WebGL context lost:', event);
      event.preventDefault();
      setWebglError(true);
      setUse2DMinimap(true);
    };

    const handleContextRestored = (event) => {
      console.log('WebGL context restored:', event);
      setWebglError(false);
      // 可以选择是否切换回3D小地图
      // setUse2DMinimap(false);
    };

    // 监听WebGL错误事件
    if (gl && gl.canvas) {
      gl.canvas.addEventListener('webglcontextlost', handleContextLost);
      gl.canvas.addEventListener('webglcontextrestored', handleContextRestored);
    }

    // 监听全局错误
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && (
        event.error.message.includes('GL_INVALID_OPERATION') ||
        event.error.message.includes('WebGL') ||
        event.error.message.includes('Context Lost')
      )) {
        handleWebGLError(event);
      }
    });

    return () => {
      if (gl && gl.canvas) {
        gl.canvas.removeEventListener('webglcontextlost', handleContextLost);
        gl.canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, [gl]);

  // 性能优化：根据距离调整渲染质量
  const handleCameraChange = () => {
    if (controlsRef.current) {
      const distance = controlsRef.current.getDistance();
      
      // 根据距离调整渲染质量
      if (distance > 50) {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1));
      } else {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    }
  };

  return (
    <>
      {/* 相机控制 */}
      <animated.group position={cameraPosition.position}>
        <PerspectiveCamera
          makeDefault
          fov={50}
          near={0.1}
          far={1000}
        />
      </animated.group>

      {/* 轨道控制器 */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={0.8}
        rotateSpeed={0.6}
        panSpeed={0.8}
        minDistance={5}
        maxDistance={100}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        onChange={handleCameraChange}
        makeDefault
      />

      {/* 动态环境系统 */}
      <DynamicEnvironment
        timeOfDay={timeOfDay}
        weather={weather}
        onTimeChange={setTimeOfDay}
        onWeatherChange={setWeather}
      />

      {/* 天空盒 */}
      <Sky
        distance={450000}
        sunPosition={[
          Math.cos((timeOfDay - 6) * Math.PI / 12) * 100,
          Math.sin((timeOfDay - 6) * Math.PI / 12) * 100,
          0
        ]}
        inclination={0}
        azimuth={0.25}
      />

      {/* 星空（夜晚时显示） */}
      {(timeOfDay < 6 || timeOfDay > 18) && (
        <Stars
          radius={300}
          depth={60}
          count={1000}
          factor={6}
          saturation={0}
          fade
        />
      )}

      {/* 环境光 */}
      <animated.ambientLight intensity={lightIntensity.intensity} />
      
      {/* 主光源 */}
      <directionalLight
        position={[
          Math.cos((timeOfDay - 6) * Math.PI / 12) * 50,
          Math.sin((timeOfDay - 6) * Math.PI / 12) * 50,
          10
        ]}
        intensity={timeOfDay < 6 || timeOfDay > 18 ? 0.1 : 1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* 补光 */}
      <pointLight
        position={[0, 30, 0]}
        intensity={0.3}
        color="#ffffff"
      />

      {/* 园区模型 */}
      <Suspense fallback={<LoadingSpinner position={[0, 5, 0]} />}>
        <CampusModel
          campusData={campusData}
          selectedBuilding={selectedBuilding}
          timeOfDay={timeOfDay}
          weather={weather}
        />
      </Suspense>

      {/* 粒子效果系统 */}
      {showParticles && (
        <Suspense fallback={null}>
          <ParticleEffects
            campusData={campusData}
            weather={weather}
            intensity={timeOfDay < 6 || timeOfDay > 18 ? 0.5 : 1}
          />
        </Suspense>
      )}

      {/* 实时数据流可视化 */}
      {showDataFlow && (
        <Suspense fallback={null}>
          <RealTimeDataFlow
            campusData={campusData}
            selectedBuilding={selectedBuilding}
          />
        </Suspense>
      )}

      {/* 地面阴影 */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={100}
        blur={2}
        far={50}
      />

      {/* 环境贴图 */}
      <Environment
        preset={timeOfDay < 6 || timeOfDay > 18 ? 'night' : 'city'}
        background={false}
      />

      {/* 错误提示 */}
      {error && (
        <Html center>
          <div style={{
            color: '#f44336',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>加载失败</div>
            <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>{error}</div>
          </div>
        </Html>
      )}

      {/* 加载提示 */}
      {isLoading && (
        <Html center>
          <div style={{
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>正在加载园区数据...</div>
            <div style={{
              width: '200px',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#4caf50',
                animation: 'loading 2s ease-in-out infinite',
                transform: 'translateX(-100%)'
              }} />
            </div>
          </div>
        </Html>
      )}

      {/* 小地图导航 */}
      {minimapVisible && (
        (use2DMinimap || force2DMinimap) ? (
          <MinimapNavigation2D
            campusData={campusData}
            selectedBuilding={selectedBuilding}
            mainCamera={camera}
            onNavigate={(position) => {
              if (controlsRef.current) {
                camera.position.set(position.x, position.y, position.z);
                controlsRef.current.target.set(position.x, 0, position.z);
                controlsRef.current.update();
              }
            }}
            onVisibilityChange={() => setMinimapVisible(!minimapVisible)}
          />
        ) : (
          <MinimapNavigation
            campusData={campusData}
            selectedBuilding={selectedBuilding}
            mainCamera={camera}
            controlsRef={controlsRef}
            onToggleVisibility={() => setMinimapVisible(!minimapVisible)}
          />
        )
      )}

      {/* 视角管理器 */}
      {viewportManagerVisible && (
        <ViewportManager
          camera={camera}
          controlsRef={controlsRef}
          campusData={campusData}
          selectedBuilding={selectedBuilding}
          onToggleVisibility={() => setViewportManagerVisible(!viewportManagerVisible)}
        />
      )}

      {/* 调试信息（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <Html
          position={[0, 0, 0]}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            pointerEvents: 'none'
          }}
        >
          <div>时间: {timeOfDay.toFixed(1)}:00</div>
          <div>天气: {weather}</div>
          <div>建筑: {campusData?.buildings?.length || 0}</div>
          <div>设备: {campusData?.devices?.length || 0}</div>
          <div>小地图: {minimapVisible ? ((use2DMinimap || force2DMinimap) ? (force2DMinimap ? '强制2D' : '自动2D') : '3D显示') : '隐藏'}</div>
          <div>视角管理: {viewportManagerVisible ? '显示' : '隐藏'}</div>
          <div style={{ color: webglError ? '#ff6b6b' : '#4ecdc4' }}>WebGL: {webglError ? '错误' : '正常'}</div>
        </Html>
      )}
    </>
  );
};

export default EnhancedDigitalTwinViewer;