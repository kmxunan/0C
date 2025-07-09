import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Billboard, Text } from '@react-three/drei';
import { useDigitalTwinStore } from '../stores/digitalTwinStore';
import LoadingSpinner from './common/LoadingSpinner';

// 常量定义
const PLANE_SIZE = 100;
const CAMERA_POSITION = [20, 20, 20];
const CAMERA_FOV = 50;
const LIGHT_INTENSITY = 1;
const LIGHT_POSITION = [10, 10, 5];
const SHADOW_MAP_SIZE = 1024;
const AMBIENT_LIGHT_INTENSITY = 0.5;
const CONTROL_SPEED = 0.5;
const SPHERE_RADIUS = 0.3;
const BILLBOARD_OFFSET = 1;
const TEXT_SIZE = 0.8;
const SCALE_FACTOR = 1.05;
const OPACITY = 0.8;
const DEVICE_Y_OFFSET = 0.5;

// 园区3D模型组件
const CampusModel = () => {
  const { selectedBuilding, campusData, isLoading } = useDigitalTwinStore();

  if (isLoading) return <LoadingSpinner position={[0, 0, 0]} />;

  return (
    <group>
      {/* 园区基础地形 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <meshStandardMaterial color="#8fbc8f" />
      </mesh>

      {/* 建筑物模型 - 实际项目中应替换为GLTF/GLB模型加载 */}
      {campusData?.buildings?.map((building) => (
        <mesh
          key={building.id}
          position={[building.x, building.y, building.z]}
          scale={selectedBuilding === building.id ? SCALE_FACTOR : 1}
          onClick={() => useDigitalTwinStore.getState().setSelectedBuilding(building.id)}
        >
          <boxGeometry args={[building.width, building.height, building.depth]} />
          <meshStandardMaterial
            color={selectedBuilding === building.id ? '#4a90e2' : '#a9a9a9'}
            transparent
            opacity={OPACITY}
          />
          {/* 建筑物标签 */}
          <Billboard position={[0, building.height + BILLBOARD_OFFSET, 0]}>
            <Text
              fontSize={TEXT_SIZE}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {building.name}
            </Text>
          </Billboard>
        </mesh>
      ))}

      {/* 能源设备点位 */}
      {campusData?.devices?.map((device) => (
        <mesh key={device.id} position={[device.x, device.y + DEVICE_Y_OFFSET, device.z]}>
          <sphereGeometry args={[SPHERE_RADIUS]} />
          <meshStandardMaterial color={device.status === 'active' ? '#00ff00' : '#ff0000'} />
        </mesh>
      ))}
    </group>
  );
};

// 数字孪生3D视图主组件
const DigitalTwinViewer = () => {
  const { fetchCampusData, error, campusData, isLoading } = useDigitalTwinStore();

  useEffect(() => {
    fetchCampusData();
  }, [fetchCampusData]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px' }}>
      {isLoading && (
        <div style={{ padding: '10px', textAlign: 'center' }}>
          加载中...
        </div>
      )}
      {error && (
        <div style={{ color: 'red', padding: '10px', textAlign: 'center' }}>
          错误: {error}
        </div>
      )}
      {!isLoading && !error && campusData && campusData.length === 0 && (
        <div style={{ padding: '10px', textAlign: 'center' }}>
          未找到园区数据
        </div>
      )}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={CAMERA_POSITION} fov={CAMERA_FOV} />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={CONTROL_SPEED}
          rotateSpeed={CONTROL_SPEED}
        />
        <ambientLight intensity={AMBIENT_LIGHT_INTENSITY} />
        <directionalLight
          position={LIGHT_POSITION}
          intensity={LIGHT_INTENSITY}
          castShadow
          shadow-mapSize-width={SHADOW_MAP_SIZE}
          shadow-mapSize-height={SHADOW_MAP_SIZE}
        />
        <Suspense fallback={<LoadingSpinner />}>
          <CampusModel />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default DigitalTwinViewer;