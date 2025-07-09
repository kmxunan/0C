import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';

/**
 * 实时数据流可视化组件
 * 显示设备间的数据传输和能源流动
 */
const RealTimeDataFlow = ({ enabled = true, intensity = 1 }) => {
  const { campusData } = useDigitalTwinStore();
  // const flowLinesRef = useRef([]); // 未使用，已注释
  const particlesRef = useRef([]);

  // 生成数据流连接
  const dataFlows = useMemo(() => {
    if (!campusData?.devices || !campusData?.buildings) return [];

    const flows = [];
    const devices = campusData.devices.filter(d => d.status === 'online');
    const buildings = campusData.buildings;

    // 设备到建筑的能源流
    devices.forEach(device => {
      if (device.type === 'solar_panel' || device.type === 'wind_turbine') {
        // 找到最近的建筑
        const nearestBuilding = buildings.reduce((nearest, building) => {
          const devicePos = new THREE.Vector3(device.x || 0, 0, device.z || 0);
          const buildingPos = new THREE.Vector3(building.x || 0, 0, building.z || 0);
          const distance = devicePos.distanceTo(buildingPos);
          
          if (!nearest || distance < nearest.distance) {
            return { building, distance };
          }
          return nearest;
        }, null);

        if (nearestBuilding) {
          flows.push({
            id: `${device.id}-${nearestBuilding.building.id}`,
            from: {
              x: device.x || 0,
              y: 2,
              z: device.z || 0
            },
            to: {
              x: nearestBuilding.building.x || 0,
              y: (nearestBuilding.building.height || 10) / 2,
              z: nearestBuilding.building.z || 0
            },
            type: 'energy',
            intensity: device.power || 50,
            color: '#00ff88'
          });
        }
      }
    });

    // 设备间的数据流
    devices.forEach((device, index) => {
      if (device.type === 'sensor' && index < devices.length - 1) {
        const nextDevice = devices[index + 1];
        flows.push({
          id: `data-${device.id}-${nextDevice.id}`,
          from: {
            x: device.x || 0,
            y: 1,
            z: device.z || 0
          },
          to: {
            x: nextDevice.x || 0,
            y: 1,
            z: nextDevice.z || 0
          },
          type: 'data',
          intensity: 30,
          color: '#4a90e2'
        });
      }
    });

    return flows;
  }, [campusData]);

  // 生成流动粒子
  const flowParticles = useMemo(() => {
    const particles = [];
    
    dataFlows.forEach(flow => {
      const particleCount = Math.max(3, Math.floor(flow.intensity / 20));
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          id: `${flow.id}-particle-${i}`,
          flowId: flow.id,
          progress: i / particleCount,
          speed: 0.01 + Math.random() * 0.02,
          size: flow.type === 'energy' ? 0.2 : 0.1,
          color: flow.color
        });
      }
    });
    
    return particles;
  }, [dataFlows]);

  // 粒子动画
  useFrame((state, delta) => {
    if (!enabled) return;

    flowParticles.forEach((particle, index) => {
      const flow = dataFlows.find(f => f.id === particle.flowId);
      if (!flow) return;

      // 更新粒子进度
      particle.progress += particle.speed * delta * 60;
      if (particle.progress > 1) {
        particle.progress = 0;
      }

      // 计算粒子位置
      const from = new THREE.Vector3(flow.from.x, flow.from.y, flow.from.z);
      const to = new THREE.Vector3(flow.to.x, flow.to.y, flow.to.z);
      const position = from.lerp(to, particle.progress);

      // 添加轻微的波动效果
      position.y += Math.sin(state.clock.elapsedTime * 2 + index) * 0.5;

      // 更新粒子网格位置
      if (particlesRef.current[index]) {
        particlesRef.current[index].position.copy(position);
        
        // 更新透明度
        const opacity = Math.sin(particle.progress * Math.PI) * 0.8 + 0.2;
        if (particlesRef.current[index].material) {
          particlesRef.current[index].material.opacity = opacity;
        }
      }
    });
  });

  if (!enabled || dataFlows.length === 0) {
    return null;
  }

  return (
    <group name="data-flow">
      {/* 流动线条 */}
      {dataFlows.map(flow => {
        const points = [
          new THREE.Vector3(flow.from.x, flow.from.y, flow.from.z),
          new THREE.Vector3(
            (flow.from.x + flow.to.x) / 2,
            Math.max(flow.from.y, flow.to.y) + 3,
            (flow.from.z + flow.to.z) / 2
          ),
          new THREE.Vector3(flow.to.x, flow.to.y, flow.to.z)
        ];

        return (
          <Line
            key={flow.id}
            points={points}
            color={flow.color}
            lineWidth={2}
            transparent
            opacity={0.3}
          />
        );
      })}

      {/* 流动粒子 */}
      {flowParticles.map((particle, index) => (
        <mesh
          key={particle.id}
          ref={el => particlesRef.current[index] = el}
        >
          <sphereGeometry args={[particle.size, 8, 6]} />
          <meshBasicMaterial
            color={particle.color}
            transparent
            opacity={0.8}
            emissive={particle.color}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* 连接点指示器 */}
      {dataFlows.map(flow => (
        <group key={`indicators-${flow.id}`}>
          {/* 起点 */}
          <mesh position={[flow.from.x, flow.from.y, flow.from.z]}>
            <ringGeometry args={[0.3, 0.5, 16]} />
            <meshBasicMaterial
              color={flow.color}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* 终点 */}
          <mesh position={[flow.to.x, flow.to.y, flow.to.z]}>
            <ringGeometry args={[0.4, 0.6, 16]} />
            <meshBasicMaterial
              color={flow.color}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default RealTimeDataFlow;