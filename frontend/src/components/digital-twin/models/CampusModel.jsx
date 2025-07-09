import React from 'react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';
import BuildingModel from './BuildingModel';
import DeviceModel from './DeviceModel';
import { PerformanceOptimizerProvider, PerformanceMonitor } from '../utils/PerformanceOptimizer';
import { ModelCacheProvider } from '../utils/ModelCacheManager';
import { LODProvider } from '../utils/LODSystem';

/**
 * 园区模型组件
 * 渲染整个园区的3D模型，包括建筑物和设备
 */
const CampusModel = ({ settings = {} }) => {
  const { campusData, selectedBuilding } = useDigitalTwinStore();

  if (!campusData) {
    return null;
  }

  return (
    <ModelCacheProvider>
      <LODProvider>
        <PerformanceOptimizerProvider>
          <group name="campus">
            {/* 地面 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
              <planeGeometry args={[200, 200]} />
              <meshStandardMaterial color="#90EE90" />
            </mesh>

            {/* 建筑物 */}
            {campusData.buildings?.map((building) => (
              <BuildingModel
                key={building.id}
                building={building}
                isSelected={selectedBuilding === building.id}
                settings={settings}
              />
            ))}

            {/* 设备 */}
            {campusData.devices?.map((device) => (
              <DeviceModel
                key={device.id}
                device={device}
                settings={settings}
              />
            ))}

            {/* 性能监控器 */}
            {settings.showPerformanceMonitor && (
              <PerformanceMonitor position={[0, 50, 0]} />
            )}
          </group>
        </PerformanceOptimizerProvider>
      </LODProvider>
    </ModelCacheProvider>
  );
};

export default CampusModel;