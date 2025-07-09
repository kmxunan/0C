import React from 'react';
import Enhanced3DScene from './enhanced/Enhanced3DScene';
import { useDigitalTwinStore } from '../../stores/digitalTwinStore';

// 常量定义 - 预留用于未来扩展
// const DEFAULT_BUILDING_HEIGHT = {
//   ACADEMIC: 15,
//   LABORATORY: 12,
//   LIBRARY: 18
// };

const DEFAULT_BUILDING_SIZE = {
  ACADEMIC: [20, 15, 10],
  LABORATORY: [15, 12, 8],
  LIBRARY: [25, 18, 12]
};

const DEFAULT_POSITIONS = {
  BUILDING_1: [0, 0, 0],
  BUILDING_2: [30, 0, 0],
  BUILDING_3: [-25, 0, 15],
  DEVICE_1: [10, 5, 5],
  DEVICE_2: [15, 3, 8]
};

const ENERGY_CONSUMPTION = {
  HIGH: 85,
  MEDIUM: 72,
  LOW: 68
};

const DEFAULT_TIME_OF_DAY = 12;

/**
 * 数字孪生场景组件
 * 这是一个包装器组件，用于在 Canvas 内部渲染 3D 场景
 */
const DigitalTwinScene = () => {
  const { campusData, selectedBuilding } = useDigitalTwinStore();

  // 模拟校园数据（如果 store 中没有数据）
  const defaultCampusData = {
    buildings: [
      {
        id: 'building-1',
        name: '教学楼A',
        position: DEFAULT_POSITIONS.BUILDING_1,
        size: DEFAULT_BUILDING_SIZE.ACADEMIC,
        energyConsumption: ENERGY_CONSUMPTION.HIGH,
        status: 'normal',
        type: 'academic'
      },
      {
        id: 'building-2',
        name: '实验楼B',
        position: DEFAULT_POSITIONS.BUILDING_2,
        size: DEFAULT_BUILDING_SIZE.LABORATORY,
        energyConsumption: ENERGY_CONSUMPTION.MEDIUM,
        status: 'normal',
        type: 'laboratory'
      },
      {
        id: 'building-3',
        name: '图书馆',
        position: DEFAULT_POSITIONS.BUILDING_3,
        size: DEFAULT_BUILDING_SIZE.LIBRARY,
        energyConsumption: ENERGY_CONSUMPTION.LOW,
        status: 'normal',
        type: 'library'
      }
    ],
    devices: [
      {
        id: 'device-1',
        name: '空调系统',
        position: DEFAULT_POSITIONS.DEVICE_1,
        type: 'hvac',
        status: 'active'
      },
      {
        id: 'device-2',
        name: '照明系统',
        position: DEFAULT_POSITIONS.DEVICE_2,
        type: 'lighting',
        status: 'active'
      }
    ]
  };

  const sceneData = campusData || defaultCampusData;

  return (
    <Enhanced3DScene
      campusData={sceneData}
      selectedBuilding={selectedBuilding}
      settings={{
        quality: 'medium',
        particles: true,
        shadows: true,
        animations: true,
        dataFlow: true,
        autoRotate: false,
        timeOfDay: DEFAULT_TIME_OF_DAY
      }}
    />
  );
};

export default DigitalTwinScene;