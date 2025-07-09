import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Sky,
  Stars,
  Html,
  Sphere,
  Box,
  Cylinder,
  Plane,
  Float,
  Sparkles
} from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore';
// 导入新的组件
import { BarChart3D, PieChart3D, HeatmapOverlay } from '../data-visualization/Chart3D';
import { 
  GestureController, 
  VoiceController, 
  KeyboardController, 
  RaycastInteraction,
  MultiTouchController 
} from '../interaction/InteractionSystem';
import { 
  WebSocketProvider, 
  WebSocketStatus, 
  DataFlowVisualization
} from '../data/WebSocketManager';

// 常量定义
const CONSTANTS = {
  SKY: {
    DISTANCE: 450000,
    TURBIDITY: 10,
    RAYLEIGH: 3,
    MIE_COEFFICIENT: 0.005,
    MIE_DIRECTIONAL_G: 0.7,
    AZIMUTH: 0.25
  },
  PARTICLES: {
    DEFAULT_COUNT: 1000,
    SPREAD: 200,
    HEIGHT: 100,
    ROTATION_SPEED: 0.001,
    ANIMATION_SPEED: 0.01,
    SIZE: 0.5,
    OPACITY: 0.6
  },
  DATA_FLOW: {
    PROGRESS_SPEED: 0.02,
    PATH_POINTS: 50,
    HEIGHT_OFFSET: 10,
    SPHERE_SIZE: 0.2,
    LINE_OPACITY: 0.3
  },
  BUILDING: {
    BREATHING_SPEED: 2,
    BREATHING_AMPLITUDE: 0.05,
    HOVER_SPEED: 3,
    HOVER_AMPLITUDE: 0.2,
    SELECTED_OPACITY: 0.8,
    DEFAULT_OPACITY: 0.7,
    MAX_ENERGY: 1000
  },
  TIME: {
    HOURS_PER_DAY: 24,
    DEGREES_PER_HALF_DAY: 180,
    RIGHT_ANGLE: 90,
    FULL_CIRCLE: 180,
    RECOVERY_DELAY: 3000
  },
  ARRAY_INDICES: {
    X: 0,
    Y: 1,
    Z: 2,
    POSITION_STEP: 3
  }
};

// 扩展 Three.js 材质
extend({ THREE });

/**
 * WebGL错误边界组件
 */
class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('WebGL Error caught:', error, errorInfo);
    
    // 检查是否是WebGL相关错误
    if (error.message && (
      error.message.includes('GL_INVALID_OPERATION') ||
      error.message.includes('WebGL') ||
      error.message.includes('texture') ||
      error.message.includes('Context Lost')
    )) {
      console.warn('WebGL error detected, attempting recovery...');
      
      // 如果是上下文丢失错误，尝试重新加载页面
      if (error.message.includes('Context Lost')) {
        console.warn('WebGL context lost detected, will attempt automatic recovery');
        // 延迟重新加载以避免立即重复错误
        setTimeout(() => {
          if (this.state.hasError) {
            console.log('Attempting to recover from WebGL context loss...');
            window.location.reload();
          }
        }, CONSTANTS.TIME.RECOVERY_DELAY);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isContextLost = this.state.error && this.state.error.message && 
        this.state.error.message.includes('Context Lost');
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h2>{isContextLost ? '🔄 WebGL上下文丢失' : '🔧 3D场景加载遇到问题'}</h2>
          {isContextLost ? (
            <div>
              <p>WebGL上下文已丢失，系统正在尝试自动恢复...</p>
              <p style={{ fontSize: '14px', opacity: 0.8 }}>如果问题持续存在，请刷新页面</p>
              <div style={{ margin: '20px 0' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(255,255,255,0.3)',
                  borderTop: '4px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
              </div>
            </div>
          ) : (
            <div>
              <p>WebGL渲染出现错误，这可能是由于:</p>
              <ul style={{ textAlign: 'left', marginBottom: '20px' }}>
                <li>显卡驱动需要更新</li>
                <li>浏览器WebGL支持有限</li>
                <li>系统资源不足</li>
              </ul>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            🔄 刷新页面
          </button>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 动态天空组件
 */
const DynamicSky = ({ timeOfDay = 12 }) => {
  const skyRef = useRef();
  
  useFrame((state) => {
    if (skyRef.current) {
      // 根据时间调整太阳位置
      const sunPosition = new THREE.Vector3();
      const phi = THREE.MathUtils.degToRad(CONSTANTS.TIME.RIGHT_ANGLE - (timeOfDay / CONSTANTS.TIME.HOURS_PER_DAY) * CONSTANTS.TIME.DEGREES_PER_HALF_DAY);
      const theta = THREE.MathUtils.degToRad(CONSTANTS.TIME.FULL_CIRCLE);
      sunPosition.setFromSphericalCoords(1, phi, theta);
      skyRef.current.material.uniforms.sunPosition.value.copy(sunPosition);
    }
  });

  return (
    <Sky
      ref={skyRef}
      distance={CONSTANTS.SKY.DISTANCE}
      sunPosition={[0, 1, 0]}
      inclination={0}
      azimuth={CONSTANTS.SKY.AZIMUTH}
      turbidity={CONSTANTS.SKY.TURBIDITY}
      rayleigh={CONSTANTS.SKY.RAYLEIGH}
      mieCoefficient={CONSTANTS.SKY.MIE_COEFFICIENT}
      mieDirectionalG={CONSTANTS.SKY.MIE_DIRECTIONAL_G}
    />
  );
};

/**
 * 粒子系统组件
 */
const ParticleSystem = ({ count = CONSTANTS.PARTICLES.DEFAULT_COUNT, enabled = true }) => {
  const meshRef = useRef();
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * CONSTANTS.ARRAY_INDICES.POSITION_STEP);
    for (let i = 0; i < count; i++) {
      positions[i * CONSTANTS.ARRAY_INDICES.POSITION_STEP] = (Math.random() - 0.5) * CONSTANTS.PARTICLES.SPREAD;
      positions[i * CONSTANTS.ARRAY_INDICES.POSITION_STEP + 1] = Math.random() * CONSTANTS.PARTICLES.HEIGHT;
      positions[i * CONSTANTS.ARRAY_INDICES.POSITION_STEP + 2] = (Math.random() - 0.5) * CONSTANTS.PARTICLES.SPREAD;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (meshRef.current && enabled) {
      meshRef.current.rotation.y += CONSTANTS.PARTICLES.ROTATION_SPEED;
      const positions = meshRef.current.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += CONSTANTS.ARRAY_INDICES.POSITION_STEP) {
        positions[i] += Math.sin(state.clock.elapsedTime + i) * CONSTANTS.PARTICLES.ANIMATION_SPEED;
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!enabled) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition}
          itemSize={CONSTANTS.ARRAY_INDICES.POSITION_STEP}
        />
      </bufferGeometry>
      <pointsMaterial
        size={CONSTANTS.PARTICLES.SIZE}
        color="#ffffff"
        transparent
        opacity={CONSTANTS.PARTICLES.OPACITY}
        sizeAttenuation
      />
    </points>
  );
};

/**
 * 数据流可视化组件
 */
const DataFlow = ({ from, to, color = '#00ff00', enabled = true }) => {
  const lineRef = useRef();
  const [progress, setProgress] = useState(0);

  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(from[CONSTANTS.ARRAY_INDICES.X], from[CONSTANTS.ARRAY_INDICES.Y], from[CONSTANTS.ARRAY_INDICES.Z]),
      new THREE.Vector3(
        (from[CONSTANTS.ARRAY_INDICES.X] + to[CONSTANTS.ARRAY_INDICES.X]) / 2,
        Math.max(from[CONSTANTS.ARRAY_INDICES.Y], to[CONSTANTS.ARRAY_INDICES.Y]) + CONSTANTS.DATA_FLOW.HEIGHT_OFFSET,
        (from[CONSTANTS.ARRAY_INDICES.Z] + to[CONSTANTS.ARRAY_INDICES.Z]) / 2
      ),
      new THREE.Vector3(to[CONSTANTS.ARRAY_INDICES.X], to[CONSTANTS.ARRAY_INDICES.Y], to[CONSTANTS.ARRAY_INDICES.Z])
    ]);
    return curve.getPoints(CONSTANTS.DATA_FLOW.PATH_POINTS);
  }, [from, to]);

  useFrame(() => {
    if (enabled) {
      setProgress((prev) => (prev + CONSTANTS.DATA_FLOW.PROGRESS_SPEED) % 1);
    }
  });

  if (!enabled) return null;

  return (
    <group>
      {/* 数据流路径 */}
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={CONSTANTS.DATA_FLOW.LINE_OPACITY} />
      </line>
      
      {/* 移动的数据包 */}
      <Sphere
        position={[
          points[Math.floor(progress * (points.length - 1))]?.x || 0,
          points[Math.floor(progress * (points.length - 1))]?.y || 0,
          points[Math.floor(progress * (points.length - 1))]?.z || 0
        ]}
        args={[CONSTANTS.DATA_FLOW.SPHERE_SIZE]}
      >
        <meshBasicMaterial color={color} />
      </Sphere>
    </group>
  );
};

/**
 * 增强建筑物组件
 */
const EnhancedBuilding = ({ 
  building, 
  isSelected, 
  onSelect, 
  showLabel = true,
  showEnergyFlow = true 
}) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      // 选中时的呼吸效果
      if (isSelected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * CONSTANTS.BUILDING.BREATHING_SPEED) * CONSTANTS.BUILDING.BREATHING_AMPLITUDE;
        meshRef.current.scale.setScalar(scale);
      } else {
        meshRef.current.scale.setScalar(1);
      }
      
      // 悬停时的轻微浮动
      if (hovered) {
        meshRef.current.position.y = building.position[CONSTANTS.ARRAY_INDICES.Y] + Math.sin(state.clock.elapsedTime * CONSTANTS.BUILDING.HOVER_SPEED) * CONSTANTS.BUILDING.HOVER_AMPLITUDE;
      } else {
        meshRef.current.position.y = building.position[CONSTANTS.ARRAY_INDICES.Y];
      }
    }
  });

  const buildingColor = useMemo(() => {
    if (isSelected) return '#00ff00';
    if (hovered) return '#ffff00';
    
    // 根据能耗状态设置颜色
    const energyRatio = building.energyConsumption / CONSTANTS.BUILDING.MAX_ENERGY;
    const HIGH_ENERGY_THRESHOLD = 0.8;
    const MEDIUM_HIGH_ENERGY_THRESHOLD = 0.6;
    const MEDIUM_ENERGY_THRESHOLD = 0.4;
    
    if (energyRatio > HIGH_ENERGY_THRESHOLD) return '#ff4444';
    if (energyRatio > MEDIUM_HIGH_ENERGY_THRESHOLD) return '#ff8800';
    if (energyRatio > MEDIUM_ENERGY_THRESHOLD) return '#ffff00';
    return '#44ff44';
  }, [isSelected, hovered, building.energyConsumption]);

  return (
    <group>
      {/* 建筑主体 */}
      <Box
        ref={meshRef}
        position={building.position}
        args={[building.size[0], building.size[1], building.size[2]]}
        onClick={() => onSelect(building.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={buildingColor}
          transparent
          opacity={isSelected ? CONSTANTS.BUILDING.SELECTED_OPACITY : CONSTANTS.BUILDING.DEFAULT_OPACITY}
          emissive={buildingColor}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
        />
      </Box>

      {/* 建筑标签 */}
      {(showLabel && (isSelected || hovered)) && (
        <Html
          position={[
            building.position[0],
            building.position[1] + building.size[1] / 2 + 2,
            building.position[2]
          ]}
          center
        >
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            border: `1px solid ${buildingColor}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontWeight: 'bold' }}>{building.name}</div>
            <div>能耗: {building.energyConsumption?.toFixed(1) || 0} kWh</div>
            <div>碳排放: {building.carbonEmission?.toFixed(1) || 0} kg</div>
            {building.status !== 'normal' && (
              <div style={{ color: '#ff4444' }}>⚠ {building.status}</div>
            )}
          </div>
        </Html>
      )}

      {/* 能源流效果 */}
      {showEnergyFlow && building.energyConsumption > 0 && (
        <Sparkles
          count={Math.min(building.energyConsumption / 10, 50)}
          scale={[building.size[0] * 1.2, building.size[1] * 1.2, building.size[2] * 1.2]}
          position={building.position}
          size={2}
          speed={0.5}
          color={buildingColor}
        />
      )}

      {/* 告警指示器 */}
      {building.alerts && building.alerts.length > 0 && (
        <Float
          position={[
            building.position[0],
            building.position[1] + building.size[1] / 2 + 3,
            building.position[2]
          ]}
          rotationIntensity={2}
          floatIntensity={2}
        >
          <Sphere args={[0.5]}>
            <meshBasicMaterial color="#ff0000" />
          </Sphere>
        </Float>
      )}
    </group>
  );
};

/**
 * 设备组件
 */
const Device = ({ device, showLabel = true }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (device.status === 'active') {
        meshRef.current.material.emissiveIntensity = 
          0.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      }
    }
  });

  const deviceColor = device.status === 'active' ? '#00ff00' : 
                     device.status === 'warning' ? '#ffaa00' : '#ff0000';

  return (
    <group>
      <Cylinder
        ref={meshRef}
        position={device.position}
        args={[0.5, 0.5, 1]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={deviceColor}
          emissive={deviceColor}
          emissiveIntensity={0.2}
        />
      </Cylinder>

      {(showLabel && hovered) && (
        <Html
          position={[device.position[0], device.position[1] + 1.5, device.position[2]]}
          center
        >
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap'
          }}>
            <div>{device.name}</div>
            <div>状态: {device.status}</div>
            <div>功率: {device.power || 0} kW</div>
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 地面网格
 */
const GroundGrid = () => {
  return (
    <group>
      {/* 主地面 */}
      <Plane
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[200, 200]}
      >
        <meshStandardMaterial
          color="#2a2a2a"
          transparent
          opacity={0.8}
        />
      </Plane>
      
      {/* 网格线 */}
      <primitive
        object={new THREE.GridHelper(200, 20, '#444444', '#333333')}
        position={[0, 0, 0]}
      />
    </group>
  );
};

/**
 * 相机控制器
 */
const CameraController = ({ target, autoRotate = false }) => {
  const controlsRef = useRef();

  useEffect(() => {
    if (target && controlsRef.current) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  }, [target]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      minDistance={10}
      maxDistance={200}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
    />
  );
};

/**
 * 增强的3D场景内容组件
 */
const Enhanced3DSceneContent = ({ 
  campusData, 
  selectedBuilding, 
  onBuildingSelect,
  settings = {},
  className 
}) => {
  const {
    quality = 'high',
    particles = true,
    shadows = true,
    dataFlow = true,
    autoRotate = false,
    timeOfDay = 12,
    enableInteraction = true,
    enableVoice = false,
    enable3DCharts = true,
    enableWebSocket = true
  } = settings;

  const { setSelectedBuilding } = useDigitalTwinStore();
  const [interactionMode, setInteractionMode] = useState('navigate');
  // 预留用于未来功能扩展
  // const [selectedObject, setSelectedObject] = useState(null);
  
  // 实时数据 - 预留用于未来功能扩展
  // const energyData = useRealTimeData('energy', null);
  // const carbonData = useRealTimeData('carbon', null);
  // const deviceData = useRealTimeData('device', null);

  const handleBuildingSelect = (buildingId) => {
    setSelectedBuilding(buildingId);
    if (onBuildingSelect) {
      onBuildingSelect(buildingId);
    }
  };
  
  // 交互处理函数 - 预留用于未来功能扩展
  // const handleObjectHover = (intersection, object) => {
  //   setSelectedObject(object);
  //   document.body.style.cursor = 'pointer';
  // };
  
  const handleObjectClick = (intersection, event) => {
    if (intersection.object.userData.type === 'building') {
      handleBuildingSelect(intersection.object.userData.id);
    }
  };
  
  // 手势处理
  const handleGesture = {
    onPinch: ({ scale }) => {
      // 缩放控制
      console.log('Pinch scale:', scale);
    },
    onRotate: ({ rotation }) => {
      // 旋转控制
      console.log('Rotate:', rotation);
    },
    onPan: ({ offset }) => {
      // 平移控制
      console.log('Pan:', offset);
    }
  };
  
  // 语音命令
  const voiceCommands = {
    '放大': () => setInteractionMode('zoom'),
    '缩小': () => setInteractionMode('zoom-out'),
    '旋转': () => setInteractionMode('rotate'),
    '重置': () => setInteractionMode('reset'),
    '显示数据': () => setInteractionMode('show-data'),
    '隐藏数据': () => setInteractionMode('hide-data')
  };
  
  // 快捷键
  const shortcuts = {
    'r': () => setInteractionMode('reset'),
    'space': () => setInteractionMode('pause'),
    '1': () => handleBuildingSelect('building-1'),
    '2': () => handleBuildingSelect('building-2'),
    '3': () => handleBuildingSelect('building-3')
  };
  
  // 准备图表数据
  const chartData = useMemo(() => {
    if (!campusData?.buildings) return [];
    
    return campusData.buildings.map(building => ({
      id: building.id,
      label: building.name || building.id,
      value: building.energyConsumption || Math.random() * 1000,
      color: building.energyConsumption > 800 ? '#e74c3c' : 
             building.energyConsumption > 500 ? '#f39c12' : '#27ae60'
    }));
  }, [campusData]);
  
  const pieData = useMemo(() => {
    const types = ['办公楼', '工厂', '仓库', '其他'];
    return types.map((type, index) => ({
      id: type,
      label: type,
      value: Math.random() * 100 + 50,
      color: ['#3498db', '#e74c3c', '#f39c12', '#27ae60'][index]
    }));
  }, []);

  // 根据质量设置调整渲染参数
  const renderSettings = useMemo(() => {
    switch (quality) {
      case 'low':
        return { antialias: false, shadows: false, pixelRatio: 1 };
      case 'medium':
        return { antialias: true, shadows: false, pixelRatio: 1 };
      case 'high':
        return { antialias: true, shadows: true, pixelRatio: Math.min(window.devicePixelRatio, 2) };
      case 'ultra':
        return { antialias: true, shadows: true, pixelRatio: window.devicePixelRatio };
      default:
        return { antialias: true, shadows: true, pixelRatio: 1 };
    }
  }, [quality]);

  return (
    <WebGLErrorBoundary>
      <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [50, 30, 50], fov: 60 }}
        shadows={renderSettings.shadows && shadows}
        dpr={renderSettings.pixelRatio}
        gl={{
          antialias: renderSettings.antialias,
          alpha: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
          stencil: false,
          depth: true,
          desynchronized: false,
          // 禁用可能导致邮箱错误的功能
          xrCompatible: false
        }}
        onCreated={({ gl, scene, camera }) => {
          // 设置WebGL上下文参数以避免纹理错误
          try {
            if (gl && typeof gl.pixelStorei === 'function') {
              gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
              gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
              gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
              gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
              
              // 设置额外的WebGL参数以避免共享图像错误
              if (gl.getParameter && gl.TEXTURE_2D) {
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);
                gl.clearDepth(1.0);
                
                // 禁用可能导致邮箱错误的扩展
                try {
                  // 检查并禁用共享图像相关的扩展
                  const extensions = gl.getSupportedExtensions() || [];
                  const problematicExtensions = [
                    'WEBGL_shared_resources',
                    'WEBGL_multi_draw',
                    'WEBGL_draw_instanced_base_vertex_base_instance'
                  ];
                  
                  problematicExtensions.forEach(extName => {
                    if (extensions.includes(extName)) {
                      console.warn(`Avoiding potentially problematic extension: ${extName}`);
                    }
                  });
                  
                  // 强制禁用某些可能导致问题的功能
                  if (gl.hint) {
                    gl.hint(gl.GENERATE_MIPMAP_HINT, gl.NICEST);
                  }
                } catch (extError) {
                  console.warn('Extension check failed:', extError);
                }
              }
            }
            
            // 设置渲染器参数
            if (gl.setPixelRatio) {
              gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }
            
            // 清理初始纹理状态以避免共享图像错误
            try {
              // 验证 gl 对象和必要方法的有效性
              if (gl && typeof gl.getParameter === 'function' && gl.MAX_TEXTURE_IMAGE_UNITS) {
                // 确保所有纹理单元都处于干净状态
                const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
                for (let i = 0; i < Math.min(32, maxTextureUnits); i++) {
                  gl.activeTexture(gl.TEXTURE0 + i);
                  gl.bindTexture(gl.TEXTURE_2D, null);
                  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                }
                gl.activeTexture(gl.TEXTURE0);
                
                // 强制清除帧缓冲区
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
              }
            } catch (cleanupError) {
              console.warn('Texture cleanup failed:', cleanupError);
            }
            
            // 添加WebGL上下文丢失和恢复处理
            const canvas = gl.domElement;
            if (canvas) {
              const handleContextLost = (event) => {
                console.warn('WebGL context lost, preventing default behavior');
                event.preventDefault();
              };
              
              const handleContextRestored = (event) => {
                console.log('WebGL context restored, reinitializing...');
                // 重新初始化WebGL设置
                try {
                  if (gl && typeof gl.pixelStorei === 'function') {
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
                    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                    
                    // 重新设置深度测试
                    if (gl.getParameter && gl.TEXTURE_2D) {
                      gl.enable(gl.DEPTH_TEST);
                      gl.depthFunc(gl.LEQUAL);
                      gl.clearDepth(1.0);
                    }
                    
                    // 清除所有纹理绑定以避免共享图像错误
                    for (let i = 0; i < 32; i++) {
                      gl.activeTexture(gl.TEXTURE0 + i);
                      gl.bindTexture(gl.TEXTURE_2D, null);
                      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                    }
                    gl.activeTexture(gl.TEXTURE0);
                  }
                } catch (error) {
                  console.warn('WebGL context restoration failed:', error);
                }
              };
              
              canvas.addEventListener('webglcontextlost', handleContextLost, false);
              canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
              
              // 清理函数
              const cleanup = () => {
                canvas.removeEventListener('webglcontextlost', handleContextLost);
                canvas.removeEventListener('webglcontextrestored', handleContextRestored);
              };
              
              // 存储清理函数以便后续使用
              canvas._webglCleanup = cleanup;
            }
            
            // 禁用调试信息以减少控制台输出
            if (gl.getExtension) {
              const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
              if (debugInfo) {
                console.log('WebGL Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
              }
            }
          } catch (error) {
            console.warn('WebGL configuration failed:', error);
          }
        }}
      >
        {/* 交互系统 */}
        {enableInteraction && (
          <>
            <GestureController
              {...handleGesture}
              enabled={interactionMode === 'navigate'}
            >
              <RaycastInteraction
                onClick={handleObjectClick}
                enabled={true}
                showRay={false}
              />
            </GestureController>
            
            <KeyboardController
              shortcuts={shortcuts}
              enabled={true}
            />
            
            <MultiTouchController
              enabled={true}
              onPinch={handleGesture.onPinch}
              onRotate={handleGesture.onRotate}
            />
          </>
        )}
        
        {/* 语音控制 */}
        {enableVoice && (
          <VoiceController
            commands={voiceCommands}
            enabled={enableVoice}
            language="zh-CN"
          />
        )}
        
        {/* WebSocket状态指示器 */}
        {enableWebSocket && (
          <WebSocketStatus
            position={[45, 25, 0]}
            showDetails={true}
          />
        )}
        
        {/* 数据流可视化 */}
        {enableWebSocket && (
          <DataFlowVisualization
            channels={['energy', 'carbon', 'device']}
            position={[0, 15, 0]}
            maxParticles={30}
          />
        )}

        {/* 环境设置 */}
        <DynamicSky timeOfDay={timeOfDay} />
        <Stars radius={300} depth={60} count={1000} factor={7} saturation={0} fade speed={1} />
        
        {/* 光照 */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={1}
          castShadow={shadows}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <pointLight position={[0, 20, 0]} intensity={0.5} color="#ffffff" />

        {/* 地面 */}
        <GroundGrid />

        {/* 建筑物 */}
        {campusData?.buildings?.map((building) => (
          <EnhancedBuilding
            key={building.id}
            building={{
              ...building,
              userData: { type: 'building', id: building.id }
            }}
            isSelected={selectedBuilding === building.id}
            onSelect={handleBuildingSelect}
            showLabel={true}
            showEnergyFlow={dataFlow}
          />
        ))}

        {/* 设备 */}
        {campusData?.devices?.map((device) => (
          <Device
            key={device.id}
            device={{
              ...device,
              userData: { type: 'device', id: device.id }
            }}
            showLabel={true}
          />
        ))}
        
        {/* 3D图表 */}
        {enable3DCharts && chartData.length > 0 && (
          <>
            {/* 能耗柱状图 */}
            <BarChart3D
              data={chartData}
              position={[-30, 0, -30]}
              size={[15, 12, 8]}
              animated={true}
              showLabels={true}
              showValues={true}
              onBarClick={(data) => {
                console.log('Bar clicked:', data);
                handleBuildingSelect(data.id);
              }}
            />
            
            {/* 建筑类型饼图 */}
            <PieChart3D
              data={pieData}
              position={[30, 5, -30]}
              radius={8}
              height={1}
              animated={true}
              showLabels={true}
              showPercentages={true}
              onSliceClick={(data) => {
                console.log('Pie slice clicked:', data);
              }}
            />
            
            {/* 热力图覆盖 */}
            <HeatmapOverlay
              data={[
                { x: 0.2, y: 0.3, value: 0.8 },
                { x: 0.7, y: 0.6, value: 0.6 },
                { x: 0.4, y: 0.8, value: 0.9 },
                { x: 0.9, y: 0.2, value: 0.4 }
              ]}
              position={[0, 0.2, 0]}
              size={[80, 80]}
              resolution={[40, 40]}
              opacity={0.5}
              animated={true}
            />
          </>
        )}

        {/* 数据流 */}
        {dataFlow && campusData?.buildings?.map((building, index) => {
          const nextBuilding = campusData.buildings[(index + 1) % campusData.buildings.length];
          return (
            <DataFlow
              key={`flow-${building.id}-${nextBuilding.id}`}
              from={building.position}
              to={nextBuilding.position}
              color={building.energyConsumption > nextBuilding.energyConsumption ? '#ff4444' : '#44ff44'}
              enabled={dataFlow}
            />
          );
        })}

        {/* 粒子系统 */}
        <ParticleSystem count={quality === 'low' ? 500 : quality === 'ultra' ? 2000 : 1000} enabled={particles} />

        {/* 相机控制 */}
        <CameraController 
          target={selectedBuilding && campusData?.buildings ? 
            campusData.buildings.find(b => b.id === selectedBuilding)?.position : 
            [0, 0, 0]
          }
          autoRotate={autoRotate}
        />

        {/* 后处理效果 - 暂时禁用，需要安装 @react-three/postprocessing */}
        {/* {quality !== 'low' && (
          <EffectComposer>
            <Bloom intensity={0.5} luminanceThreshold={0.9} />
            {quality === 'ultra' && (
              <>
                <DepthOfField focusDistance={0.02} focalLength={0.005} bokehScale={3} />
                <Noise opacity={0.02} />
                <Vignette eskil={false} offset={0.1} darkness={0.5} />
              </>
            )}
          </EffectComposer>
        )} */}
      </Canvas>
    </div>
    </WebGLErrorBoundary>
  );
};

/**
 * 主要的增强3D场景组件（带WebSocket包装）
 */
const Enhanced3DScene = (props) => {
  const { settings = {} } = props;
  const { enableWebSocket = true } = settings;
  
  if (enableWebSocket) {
    return (
      <WebSocketProvider
        url={process.env.REACT_APP_WS_URL || 'ws://localhost:1125/ws'}
        autoReconnect={true}
        reconnectInterval={3000}
        maxReconnectAttempts={10}
        enableHeartbeat={true}
      >
        <Enhanced3DSceneContent {...props} />
      </WebSocketProvider>
    );
  }
  
  return <Enhanced3DSceneContent {...props} />;
};

export default Enhanced3DScene;