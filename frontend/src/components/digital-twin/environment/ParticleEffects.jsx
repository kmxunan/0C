import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 粒子效果组件
 * 提供各种环境粒子效果，如雨、雪、灰尘等
 */
const ParticleEffects = ({ 
  weather = 'clear',
  intensity = 1,
  enabled = true 
}) => {
  const particlesRef = useRef();
  const velocityRef = useRef();

  // 粒子系统配置
  const particleConfig = useMemo(() => {
    switch (weather) {
      case 'rainy':
        return {
          count: 1000 * intensity,
          size: 0.1,
          color: new THREE.Color(0x4a90e2),
          speed: 0.5,
          spread: 50,
          height: 100
        };
      case 'snowy':
        return {
          count: 500 * intensity,
          size: 0.3,
          color: new THREE.Color(0xffffff),
          speed: 0.1,
          spread: 50,
          height: 80
        };
      case 'dusty':
        return {
          count: 200 * intensity,
          size: 0.05,
          color: new THREE.Color(0xd4af37),
          speed: 0.02,
          spread: 30,
          height: 20
        };
      default:
        return {
          count: 0,
          size: 0,
          color: new THREE.Color(0xffffff),
          speed: 0,
          spread: 0,
          height: 0
        };
    }
  }, [weather, intensity]);

  // 生成粒子位置和速度
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleConfig.count * 3);
    const velocities = new Float32Array(particleConfig.count * 3);

    for (let i = 0; i < particleConfig.count; i++) {
      const i3 = i * 3;
      
      // 随机分布在空间中
      positions[i3] = (Math.random() - 0.5) * particleConfig.spread * 2;
      positions[i3 + 1] = Math.random() * particleConfig.height;
      positions[i3 + 2] = (Math.random() - 0.5) * particleConfig.spread * 2;
      
      // 设置初始速度
      velocities[i3] = (Math.random() - 0.5) * 0.1; // x方向轻微随机
      velocities[i3 + 1] = -particleConfig.speed * (0.8 + Math.random() * 0.4); // y方向下降
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1; // z方向轻微随机
    }

    return { positions, velocities };
  }, [particleConfig]);

  // 存储速度数据
  React.useEffect(() => {
    velocityRef.current = velocities;
  }, [velocities]);

  // 粒子动画
  useFrame((state, delta) => {
    if (!particlesRef.current || !enabled || particleConfig.count === 0) return;

    const positions = particlesRef.current.geometry.attributes.position.array;
    const velocities = velocityRef.current;

    for (let i = 0; i < particleConfig.count; i++) {
      const i3 = i * 3;
      
      // 更新位置
      positions[i3] += velocities[i3] * delta * 60;
      positions[i3 + 1] += velocities[i3 + 1] * delta * 60;
      positions[i3 + 2] += velocities[i3 + 2] * delta * 60;
      
      // 重置超出边界的粒子
      if (positions[i3 + 1] < -5) {
        positions[i3] = (Math.random() - 0.5) * particleConfig.spread * 2;
        positions[i3 + 1] = particleConfig.height;
        positions[i3 + 2] = (Math.random() - 0.5) * particleConfig.spread * 2;
      }
      
      // 边界检查 - x和z方向
      if (Math.abs(positions[i3]) > particleConfig.spread) {
        positions[i3] = (Math.random() - 0.5) * particleConfig.spread * 2;
      }
      if (Math.abs(positions[i3 + 2]) > particleConfig.spread) {
        positions[i3 + 2] = (Math.random() - 0.5) * particleConfig.spread * 2;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!enabled || particleConfig.count === 0) {
    return null;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleConfig.count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleConfig.size}
        color={particleConfig.color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleEffects;