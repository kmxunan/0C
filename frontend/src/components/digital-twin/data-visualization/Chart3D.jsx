import React, { useRef, useMemo, useState } from 'react';
// import { useFrame } from '@react-three/fiber'; // 未使用，已注释
// import { useEffect } from 'react'; // 未使用，已注释
import { Text, Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';

/**
 * 3D图表组件
 * 支持柱状图、饼图、热力图等多种3D数据可视化
 */

/**
 * 3D柱状图组件
 */
export const BarChart3D = ({ 
  data = [], 
  position = [0, 0, 0], 
  size = [10, 8, 6],
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
  animated: enableAnimation = true,
  showLabels = true,
  showValues = true,
  onBarClick,
  ...props 
}) => {
  const groupRef = useRef();
  const [width, height, depth] = size;
  
  // 数据预处理
  const processedData = useMemo(() => {
    if (!data.length) return [];
    
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = width / data.length * 0.8;
    const spacing = width / data.length;
    
    return data.map((item, index) => ({
      ...item,
      normalizedValue: item.value / maxValue,
      barHeight: (item.value / maxValue) * height,
      x: -width/2 + spacing * index + spacing/2,
      z: 0,
      color: colors[index % colors.length],
      barWidth
    }));
  }, [data, width, height, colors]);

  return (
    <group ref={groupRef} position={position} {...props}>
      {/* 底座 */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[width + 1, 0.2, depth + 1]} />
        <meshStandardMaterial color="#2c3e50" opacity={0.8} transparent />
      </mesh>
      
      {/* 柱状图 */}
      {processedData.map((item, index) => (
        <BarColumn
          key={item.id || index}
          data={item}
          animated={enableAnimation}
          showLabels={showLabels}
          showValues={showValues}
          onClick={onBarClick}
        />
      ))}
      
      {/* 坐标轴 */}
      <CoordinateAxes size={size} />
    </group>
  );
};

/**
 * 单个柱状图列组件
 */
const BarColumn = ({ data, animated: enableAnimation, showLabels, showValues, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // 动画配置
  const [spring, api] = useSpring(() => ({
    scale: [1, enableAnimation ? 0 : 1, 1],
    color: data.color,
    config: { mass: 1, tension: 280, friction: 60 }
  }));
  
  // 启动动画
  React.useEffect(() => {
    if (enableAnimation) {
      api.start({ scale: [1, 1, 1] });
    }
  }, [api, enableAnimation]);
  
  // 悬停效果
  React.useEffect(() => {
    api.start({
      scale: hovered ? [1.1, 1, 1.1] : [1, 1, 1],
      color: hovered ? '#ffffff' : data.color
    });
  }, [hovered, data.color, api]);
  
  const handlePointerOver = (event) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  
  const handleClick = (event) => {
    event.stopPropagation();
    onClick?.(data);
  };
  
  return (
    <group position={[data.x, 0, data.z]}>
      {/* 柱体 */}
      <animated.mesh
        ref={meshRef}
        position={[0, data.barHeight / 2, 0]}
        scale={spring.scale}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
      >
        <boxGeometry args={[data.barWidth, data.barHeight, data.barWidth]} />
        <animated.meshStandardMaterial
          color={spring.color}
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0.9}
        />
      </animated.mesh>
      
      {/* 标签 */}
      {showLabels && (
        <Text
          position={[0, -0.5, data.barWidth/2 + 0.5]}
          rotation={[-Math.PI/2, 0, 0]}
          fontSize={0.3}
          color="#2c3e50"
          anchorX="center"
          anchorY="middle"
        >
          {data.label}
        </Text>
      )}
      
      {/* 数值显示 */}
      {showValues && (
        <Html
          position={[0, data.barHeight + 0.5, 0]}
          center
          distanceFactor={8}
        >
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            {data.value}
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 3D饼图组件
 */
export const PieChart3D = ({ 
  data = [], 
  position = [0, 0, 0], 
  radius = 3,
  height = 0.5,
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
  animated: enableAnimation = true,
  showLabels = true,
  showPercentages = true,
  onSliceClick,
  ...props 
}) => {
  const groupRef = useRef();
  
  // 数据预处理
  const processedData = useMemo(() => {
    if (!data.length) return [];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    return data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * Math.PI * 2;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      const midAngle = startAngle + angle / 2;
      
      currentAngle += angle;
      
      return {
        ...item,
        percentage: percentage * 100,
        startAngle,
        endAngle,
        midAngle,
        color: colors[index % colors.length]
      };
    });
  }, [data, colors]);
  
  return (
    <group ref={groupRef} position={position} {...props}>
      {processedData.map((item, index) => (
        <PieSlice
          key={item.id || index}
          data={item}
          radius={radius}
          height={height}
          animated={enableAnimation}
          showLabels={showLabels}
          showPercentages={showPercentages}
          onClick={onSliceClick}
        />
      ))}
    </group>
  );
};

/**
 * 饼图切片组件
 */
const PieSlice = ({ data, radius, height, animated: enableAnimation, showLabels, showPercentages, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // 创建扇形几何体
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.arc(0, 0, radius, data.startAngle, data.endAngle, false);
    shape.lineTo(0, 0);
    
    const extrudeSettings = {
      depth: height,
      bevelEnabled: false
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [data.startAngle, data.endAngle, radius, height]);
  
  // 动画配置
  const [spring, api] = useSpring(() => ({
    scale: enableAnimation ? 0 : 1,
    position: [0, 0, 0],
    color: data.color,
    config: { mass: 1, tension: 280, friction: 60 }
  }));
  
  // 启动动画
  React.useEffect(() => {
    if (enableAnimation) {
      api.start({ scale: 1 });
    }
  }, [api, enableAnimation]);
  
  // 悬停效果
  React.useEffect(() => {
    const offset = hovered ? 0.2 : 0;
    const x = Math.cos(data.midAngle) * offset;
    const z = Math.sin(data.midAngle) * offset;
    
    api.start({
      position: [x, hovered ? 0.1 : 0, z],
      color: hovered ? '#ffffff' : data.color
    });
  }, [hovered, data.midAngle, data.color, api]);
  
  const handlePointerOver = (event) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  
  const handleClick = (event) => {
    event.stopPropagation();
    onClick?.(data);
  };
  
  // 标签位置
  const labelPosition = useMemo(() => {
    const labelRadius = radius * 1.3;
    return [
      Math.cos(data.midAngle) * labelRadius,
      height + 0.5,
      Math.sin(data.midAngle) * labelRadius
    ];
  }, [data.midAngle, radius, height]);
  
  return (
    <group>
      <animated.mesh
        ref={meshRef}
        geometry={geometry}
        position={spring.position}
        scale={spring.scale}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
      >
        <animated.meshStandardMaterial
          color={spring.color}
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0.9}
        />
      </animated.mesh>
      
      {/* 标签 */}
      {showLabels && (
        <Html
          position={labelPosition}
          center
          distanceFactor={8}
        >
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textAlign: 'center'
          }}>
            <div>{data.label}</div>
            {showPercentages && (
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {data.percentage.toFixed(1)}%
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 热力图覆盖组件
 */
export const HeatmapOverlay = ({ 
  data = [], 
  position = [0, 0.1, 0], 
  size = [20, 20],
  resolution = [20, 20],
  colorScale = ['#0000ff', '#00ff00', '#ffff00', '#ff0000'],
  opacity = 0.7,
  animated: enableAnimation = true,
  ...props 
}) => {
  const meshRef = useRef();
  const [width, height] = size;
  const [resX, resY] = resolution;
  
  // 创建热力图纹理
  const texture = useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, resX);
      canvas.height = Math.max(1, resY);
      
      const ctx = canvas.getContext('2d', { 
        willReadFrequently: false,
        alpha: true,
        desynchronized: false,
        preserveDrawingBuffer: false
      });
      
      if (!ctx) {
        console.warn('Failed to get 2D context for heatmap canvas');
        return null;
      }
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 创建渐变
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const pixels = imageData.data;
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          
          // 根据数据计算热力值
          const normalizedX = x / canvas.width;
          const normalizedY = y / canvas.height;
          const value = getHeatValue(normalizedX, normalizedY, data);
          
          // 映射到颜色
          const color = interpolateColor(value, colorScale);
          pixels[index] = Math.max(0, Math.min(255, color.r));
          pixels[index + 1] = Math.max(0, Math.min(255, color.g));
          pixels[index + 2] = Math.max(0, Math.min(255, color.b));
          pixels[index + 3] = Math.max(0, Math.min(255, Math.floor(255 * opacity)));
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // 创建纹理时使用更安全的配置
      const texture = new THREE.CanvasTexture(canvas);
      
      // 禁用mipmap生成以避免共享图像问题
      texture.generateMipmaps = false;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.flipY = false;
      texture.premultiplyAlpha = false;
      texture.unpackAlignment = 1;
      
      // 强制更新纹理
      texture.needsUpdate = true;
      
      // 添加纹理销毁清理
      texture.userData = { canvas };
      
      return texture;
    } catch (error) {
      console.warn('Error creating heatmap texture:', error);
      return null;
    }
  }, [data, resX, resY, colorScale, opacity]);
  
  // 清理纹理资源
  React.useEffect(() => {
    return () => {
      if (texture && texture.dispose) {
        texture.dispose();
      }
    };
  }, [texture]);
  
  // 动画配置
  const [spring, api] = useSpring(() => ({
    opacity: enableAnimation ? 0 : opacity,
    config: { mass: 1, tension: 280, friction: 60 }
  }));
  
  React.useEffect(() => {
    if (enableAnimation) {
      api.start({ opacity });
    }
  }, [api, enableAnimation, opacity]);
  
  // 如果纹理创建失败，不渲染热力图
  if (!texture) {
    return null;
  }

  return (
    <animated.mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      {...props}
    >
      <planeGeometry args={[width, height]} />
      <animated.meshBasicMaterial
        map={texture}
        transparent
        opacity={spring.opacity}
        side={THREE.DoubleSide}
        alphaTest={0.01}
        depthWrite={false}
        blending={THREE.NormalBlending}
        premultipliedAlpha={false}
      />
    </animated.mesh>
  );
};

/**
 * 坐标轴组件
 */
const CoordinateAxes = ({ size }) => {
  const [width, height, depth] = size;
  
  return (
    <group>
      {/* X轴 */}
      <mesh position={[0, -0.05, -depth/2 - 0.5]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color="#34495e" />
      </mesh>
      
      {/* Y轴 */}
      <mesh position={[-width/2 - 0.5, height/2, -depth/2 - 0.5]}>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshStandardMaterial color="#34495e" />
      </mesh>
      
      {/* Z轴 */}
      <mesh position={[-width/2 - 0.5, -0.05, 0]}>
        <boxGeometry args={[0.05, 0.05, depth]} />
        <meshStandardMaterial color="#34495e" />
      </mesh>
    </group>
  );
};

// 工具函数
function getHeatValue(x, y, data) {
  // 简单的热力值计算，实际应用中可以根据具体需求实现
  if (!data.length) return 0;
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  data.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
    );
    const weight = 1 / (1 + distance * 10); // 距离权重
    totalWeight += weight;
    weightedSum += point.value * weight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function interpolateColor(value, colorScale) {
  // 简单的颜色插值
  const clampedValue = Math.max(0, Math.min(1, value));
  const index = clampedValue * (colorScale.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const t = index - lowerIndex;
  
  if (lowerIndex === upperIndex) {
    return hexToRgb(colorScale[lowerIndex]);
  }
  
  const lowerColor = hexToRgb(colorScale[lowerIndex]);
  const upperColor = hexToRgb(colorScale[upperIndex]);
  
  return {
    r: Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * t),
    g: Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * t),
    b: Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * t)
  };
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

const Chart3D = { BarChart3D, PieChart3D, HeatmapOverlay };

export default Chart3D;