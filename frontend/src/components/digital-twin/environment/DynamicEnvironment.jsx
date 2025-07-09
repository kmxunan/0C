import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 动态环境组件
 * 根据时间和天气条件调整环境光照和氛围
 */
const DynamicEnvironment = ({ 
  timeOfDay = 12, 
  weather = 'clear',
  onTimeChange,
  onWeatherChange 
}) => {
  const { scene } = useThree();
  // const gl = useThree().gl; // 未使用，已注释
  // const fogRef = useRef(); // 未使用，已注释

  // 根据时间计算环境参数
  const getEnvironmentParams = useCallback(() => {
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    const isDawn = timeOfDay >= 6 && timeOfDay < 8;
    const isDusk = timeOfDay >= 18 && timeOfDay < 20;
    
    let intensity, color, fogColor, fogDensity;
    
    if (isNight) {
      intensity = 0.1;
      color = new THREE.Color(0x1a1a2e);
      fogColor = new THREE.Color(0x0f0f23);
      fogDensity = 0.01;
    } else if (isDawn || isDusk) {
      intensity = 0.4;
      color = new THREE.Color(0xff6b35);
      fogColor = new THREE.Color(0x8b4513);
      fogDensity = 0.005;
    } else {
      intensity = 1.0;
      color = new THREE.Color(0x87ceeb);
      fogColor = new THREE.Color(0xcccccc);
      fogDensity = 0.002;
    }
    
    // 天气影响
    switch (weather) {
      case 'cloudy':
        intensity *= 0.7;
        fogDensity *= 2;
        break;
      case 'rainy':
        intensity *= 0.5;
        fogDensity *= 3;
        fogColor = new THREE.Color(0x666666);
        break;
      case 'foggy':
        intensity *= 0.3;
        fogDensity *= 5;
        break;
      default:
        // 默认晴天，无需额外处理
        break;
    }
    
    return { intensity, color, fogColor, fogDensity };
  }, [timeOfDay, weather]);

  // 更新环境
  useFrame(() => {
    const params = getEnvironmentParams();
    
    // 更新雾效
    if (scene.fog) {
      scene.fog.color.lerp(params.fogColor, 0.01);
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, params.fogDensity, 0.01);
    }
    
    // 更新背景色
    if (scene.background) {
      scene.background.lerp(params.color, 0.01);
    }
  });

  // 初始化环境
  useEffect(() => {
    const params = getEnvironmentParams();
    
    // 设置雾效
    scene.fog = new THREE.FogExp2(params.fogColor, params.fogDensity);
    
    // 设置背景
    scene.background = params.color;
    
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, getEnvironmentParams]);

  // 获取环境贴图
  const getEnvironmentPreset = () => {
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    
    switch (weather) {
      case 'clear':
        return isNight ? 'night' : 'sunset';
      case 'cloudy':
        return 'studio';
      case 'rainy':
        return 'forest';
      default:
        return 'city';
    }
  };

  return (
    <>
      {/* 环境光照 */}
      <Environment
        preset={getEnvironmentPreset()}
        background={false}
        environmentIntensity={getEnvironmentParams().intensity}
      />
      
      {/* 额外的环境光 */}
      <ambientLight 
        intensity={getEnvironmentParams().intensity * 0.3} 
        color={getEnvironmentParams().color}
      />
      
      {/* 主方向光 */}
      <directionalLight
        position={[
          Math.cos((timeOfDay - 6) * Math.PI / 12) * 50,
          Math.sin((timeOfDay - 6) * Math.PI / 12) * 50,
          10
        ]}
        intensity={getEnvironmentParams().intensity}
        color={getEnvironmentParams().color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* 补充光源 */}
      <hemisphereLight
        skyColor={getEnvironmentParams().color}
        groundColor={new THREE.Color(0x444444)}
        intensity={getEnvironmentParams().intensity * 0.2}
      />
    </>
  );
};

export default DynamicEnvironment;