import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars, Billboard, Text } from '@react-three/drei';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useSpring, a } from '@react-spring/three';
import axios from 'axios';
import { Box, Typography, CircularProgress, Paper, Button, Grid, Slider, FormControl, InputLabel, Select, MenuItem, Divider } from '@mui/material';

// 园区基础3D模型组件
const ParkModel = React.memo(({ deviceData, isLoadingData }) => {
  return (
    <group>
      {/* 地面平面 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#8fbc8f" />
      </mesh>

      {/* 道路 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <planeGeometry args={[120, 8]} />
        <meshStandardMaterial color="#a9a9a9" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} rotation-z={Math.PI / 2}>
        <planeGeometry args={[120, 8]} />
        <meshStandardMaterial color="#a9a9a9" />
      </mesh>

      {/* 主建筑 */}
      <Building position={[-30, 0, -30]} width={25} depth={25} height={12} color="#556b2f" name="行政办公楼" energyData={1250} />
      <Building position={[30, 0, -25]} width={20} depth={20} height={10} color="#556b2f" name="研发中心" energyData={980} />
      <Building position={[-20, 0, 30]} width={18} depth={18} height={9} color="#556b2f" name="生产车间A" energyData={1850} />
      <Building position={[25, 0, 25]} width={22} depth={22} height={11} color="#556b2f" name="生产车间B" energyData={2100} />

      {/* 太阳能板区域 */}
      <SolarPanelFarm position={[-45, 0, 45]} size={15} />

      {/* 风力发电机 */}
      <WindTurbine position={[45, 0, -45]} height={15} />

      {/* 设备 */}
      {isLoadingData ? (
        <Billboard position={[0, 2, 0]}>
          <SceneText fontSize={1} color="white">加载设备数据中...</SceneText>
        </Billboard>
      ) : deviceData && Object.keys(deviceData).length > 0 ? (
        Object.values(deviceData).map(device => (
          <Device
            key={device.id}
            position={device.position || [0, 1, 0]}
            size={device.size || 1}
            label={device.name}
            type={device.type}
            status={device.status || 'normal'}
            energyConsumption={device.energyConsumption || 0}
          />
        ))
      ) : (
        <Billboard position={[0, 2, 0]}>
          <Text fontSize={1} color="white">未找到设备数据</Text>
        </Billboard>
      )}
    </group>
  );
});

// 太阳能板农场组件
const SolarPanelFarm = ({ position, size }) => {
  return (
    <group position={position}>
      {/* 基座 */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[size, 1, size]} />
        <meshStandardMaterial color="#708090" />
      </mesh>
      {/* 太阳能板阵列 */}
      {Array.from({ length: 25 }).map((_, i) => {
        const x = ((i % 5) - 2) * (size / 5);
        const z = (Math.floor(i / 5) - 2) * (size / 5);
        return (
          <mesh key={i} position={[x, 1, z]} rotation-x={Math.PI / 12}>
            <boxGeometry args={[size/6, 0.1, size/6]} />
            <meshStandardMaterial color="#87ceeb" />
          </mesh>
        );
      })}
    </group>
  );
};

// 风力发电机组件
const WindTurbine = ({ position, height }) => {
  return (
    <group position={position}>
      {/* 基座 */}
      <mesh position={[0, height/2, 0]}>
        <cylinderGeometry args={[1, 1.5, height, 16]} />
        <meshStandardMaterial color="#a9a9a9" />
      </mesh>
      {/* 叶片 */}
      <group position={[0, height, 0]} rotation-y={[0, Math.PI/4, 0]}>
        {[0, Math.PI*2/3, Math.PI*4/3].map((angle, i) => (
          <mesh key={i} rotation-y={angle}>
            <mesh position={[height/3, 0, 0]}>
              <boxGeometry args={[height/2, 0.3, 1.5]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          </mesh>
        ))}
      </group>
    </group>
  );
};

// 建筑组件
const Building = ({ position, width, depth, height, color, name, energyData }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);

  return (
    <group position={position}>
      {/* 建筑主体 */}
      <mesh 
        position={[0, height / 2, 0]} 
        onPointerOver={() => setIsHovered(true)} 
        onPointerOut={() => setIsHovered(false)} 
        onClick={() => setShowInfo(!showInfo)}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          transparent={isHovered} 
          opacity={isHovered ? 0.7 : 1} 
          emissive={isHovered ? "#ffff00" : "#000000"} 
          emissiveIntensity={isHovered ? 0.3 : 0} />
      </mesh>

      {/* 建筑细节 - 底层 */}
      <mesh position={[0, height * 0.1, 0]}>
        <boxGeometry args={[width * 1.05, height * 0.2, depth * 1.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>

      {/* 窗户 */}
      {Array.from({ length: Math.floor(width / 5) }).map((_, i) => (
        Array.from({ length: Math.floor(height / 4) }).map((_, j) => (
          <mesh key={`${i}-${j}`} position={[-(width/2 - 3) + i*5, 2 + j*4, depth/2 + 0.1]}>
            <boxGeometry args={[3, 2.5, 0.1]} />
            <meshStandardMaterial 
              color={j % 2 === 0 ? "#87cefa" : "#add8e6"} 
              emissive={isHovered ? "#87cefa" : "#000000"} 
              emissiveIntensity={isHovered ? 0.5 : 0.2} />
          </mesh>
        ))
      ))}

      {/* 门 */}
      <mesh position={[0, 1.5, depth/2 + 0.1]}>
        <boxGeometry args={[2.5, 3, 0.1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* 屋顶 */}
      <mesh position={[0, height + 1, 0]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[width/2 + 1, 2, 4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* 建筑标识 */}
      {showInfo && (
        <Billboard position={[0, height + 3, 0]}>
          <Text 
            fontSize={1.2} 
            color="#ffffff" 
            anchorX="center" 
            anchorY="middle"
            backgroundColor="#00000080" 
            padding={0.2} 
            borderRadius={0.1}>
            {name}
            {energyData && `
能耗: ${energyData} kWh`}
          </Text>
        </Billboard>
      )}
    </group>
  );
};

// 设备组件
const Device = React.memo(({ position, size, color, label, type, status, energyConsumption }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  // 使用react-spring创建动画效果
  const [springProps, api] = useSpring(() => ({
    scale: size,
    color: status === 'error' ? '#ff4500' : status === 'warning' ? '#ffd700' : 
           type === 'solar' ? '#ffd700' : type === 'wind' ? '#1e90ff' : color || '#808080',
    config: { mass: 1, tension: 200, friction: 10 }
  }));

  // 状态为error时添加脉冲动画
  React.useEffect(() => {
    let interval;
    if (status === 'error') {
      interval = setInterval(() => {
        api.start({ scale: size * 1.2 });
        setTimeout(() => api.start({ scale: size * 1.1 }), 500);
      }, 1000);
    } else {
      api.start({ scale: size });
    }
    return () => interval && clearInterval(interval);
  }, [status, size, api]);

  // 鼠标悬停动画
  React.useEffect(() => {
    api.start({ scale: isHovered ? size * 1.2 : (status === 'error' ? size * 1.1 : size) });
  }, [isHovered, status, size, api]);

  return (
    <group position={position}>
      <a.mesh 
        onPointerOver={() => setIsHovered(true)} 
        onPointerOut={() => setIsHovered(false)} 
        onClick={() => setShowDetails(!showDetails)} 
        scale={springProps.scale}>
        <sphereGeometry args={[size, 16, 16]} />
        <a.meshStandardMaterial 
          color={springProps.color} 
          emissive={isHovered || status === 'error' ? springProps.color : "#000000"} 
          emissiveIntensity={isHovered ? 0.8 : status === 'error' ? 0.5 : 0.3} 
          transparent={isHovered} 
          opacity={isHovered ? 0.8 : 1} />
      </a.mesh>

      {/* 设备类型标识 */}
      <Billboard position={[0, size + 1, 0]}>
        <Text 
          fontSize={0.8} 
          color="#ffffff" 
          anchorX="center" 
          anchorY="middle" 
          backgroundColor="#00000080" 
          padding={0.1}>
          {label}
        </Text>
      </Billboard>

      {/* 设备详情面板 */}
      {showDetails && (
        <Billboard position={[size + 2, size, 0]}>
          <Text 
            fontSize={0.7} 
            color="#ffffff" 
            anchorX="left" 
            anchorY="top" 
            backgroundColor="#000000cc" 
            padding={0.3} 
            borderRadius={0.1}>
            设备名称: {label}
            设备类型: {type}
            运行状态: {status === 'normal' ? '正常' : status === 'warning' ? '警告' : '故障'}
            能耗: {energyConsumption} kW
          </Text>
        </Billboard>
      )}
    </group>
  );
});

// 文本组件
const SceneText = ({ children, position, fontSize, color, anchorX }) => {
  return (
    <sprite position={position}>
      <spriteMaterial transparent opacity={0.9}>
        <canvas width={256} height={64}>
          {(context) => {
            context.font = `${fontSize * 16}px Arial`;
            context.fillStyle = color;
            context.textAlign = anchorX || 'center';
            context.textBaseline = 'middle';
            context.fillText(children, 128, 32);
          }}
        </canvas>
      </spriteMaterial>
    </sprite>
  );
};

// 数字孪生场景主组件
const DigitalTwinScene = React.memo(() => {
  const [zoomLevel, setZoomLevel] = React.useState(50);
  const [deviceData, setDeviceData] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedDevice, setSelectedDevice] = React.useState('all');
  const [timeRange, setTimeRange] = React.useState('day');

  // 实时数据获取
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setIsLoadingData(true);
        const response = await axios.get('http://localhost:3000/api/devices/status');
        setDeviceData(response.data);
      } catch (error) {
        console.error('获取设备数据失败:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    // 初始加载
    fetchDeviceData();

    // 每30秒刷新一次数据
    const intervalId = setInterval(fetchDeviceData, 30000);

    // 清理函数
    return () => clearInterval(intervalId);
  }, []);
  const [rotationSpeed, setRotationSpeed] = React.useState(0.5);
  const [autoRotate, setAutoRotate] = React.useState(false);
  const [visualizationMode, setVisualizationMode] = React.useState('normal');
  const [showBuildings, setShowBuildings] = React.useState(true);
  const [showDevices, setShowDevices] = React.useState(true);
  const [showEnergyFlow, setShowEnergyFlow] = React.useState(false);
  const controlsRef = React.useRef();

  // 自动旋转控制
  React.useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.autoRotate = autoRotate;
    controlsRef.current.autoRotateSpeed = rotationSpeed;
  }, [autoRotate, rotationSpeed]);

  // 缩放控制
  React.useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.target = [0, 5, 0];
    controlsRef.current.update();
  }, [zoomLevel]);

  // 重置视图
  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      setZoomLevel(50);
      setRotationSpeed(0.5);
      setAutoRotate(false);
    }
  };

  // 切换全屏
  const toggleFullscreen = () => {
    const canvas = document.querySelector('canvas');
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Typography variant="h4" sx={{ position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 100 }}>
        零碳园区数字孪生可视化
      </Typography>

      {/* 控制面板 */}
      <Paper sx={{ position: 'absolute', bottom: 20, left: 20, p: 2, zIndex: 100, backgroundColor: 'white' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}><Typography variant="h6">场景控制</Typography></Grid>
          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={6} sm={4}><Button variant="contained" onClick={resetView} fullWidth>重置视图</Button></Grid>
          <Grid item xs={6} sm={4}><Button variant="contained" onClick={toggleFullscreen} fullWidth>全屏显示</Button></Grid>
          <Grid item xs={6} sm={4}><Button variant="contained" onClick={() => setAutoRotate(!autoRotate)} fullWidth>{autoRotate ? '停止旋转' : '开始旋转'}</Button></Grid>

          <Grid item xs={12}><Typography variant="subtitle1">旋转速度: {rotationSpeed.toFixed(1)}</Typography></Grid>
          <Grid item xs={12}><Slider value={rotationSpeed} min={0.1} max={2} step={0.1} onChange={(_, value) => setRotationSpeed(value)} /></Grid>

          <Grid item xs={12}><Typography variant="subtitle1">缩放级别: {zoomLevel}</Typography></Grid>
          <Grid item xs={12}><Slider value={zoomLevel} min={30} max={100} step={1} onChange={(_, value) => setZoomLevel(value)} /></Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>可视化模式</InputLabel>
              <Select value={visualizationMode} label="可视化模式" onChange={e => setVisualizationMode(e.target.value)}>
                <MenuItem value="normal">常规视图</MenuItem>
                <MenuItem value="energy">能耗视图</MenuItem>
                <MenuItem value="status">设备状态</MenuItem>
                <MenuItem value="alarm">告警视图</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>能耗数据可视化</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>选择设备</InputLabel>
                <Select
                  value={selectedDevice}
                  label="选择设备"
                  onChange={(e) => setSelectedDevice(e.target.value)}
                >
                  <MenuItem value="all">所有设备</MenuItem>
                  {Object.values(deviceData).map(device => (
                    <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>时间范围</InputLabel>
                <Select
                  value={timeRange}
                  label="时间范围"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="day">今日</MenuItem>
                  <MenuItem value="week">本周</MenuItem>
                  <MenuItem value="month">本月</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {isLoadingData ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : deviceData && Object.keys(deviceData).length > 0 ? (
            <><Box height={300} width="100%" mb={3}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.values(deviceData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: '能耗 (kWh)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="energyConsumption" fill="#8884d8" name="当前能耗" />
                  </BarChart>
                </ResponsiveContainer>
              </Box><Box height={300} width="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={deviceData.energyHistory || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis label={{ value: '能耗 (kWh)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#82ca9d" name="能耗趋势" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box></>
          ) : (
            <Typography color="textSecondary" align="center" p={3}>无能耗数据可显示</Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Grid item xs={12}><Typography variant="subtitle1">图层控制</Typography></Grid>
          <Grid item xs={12}><Button variant={showBuildings ? "contained" : "outlined"} onClick={() => setShowBuildings(!showBuildings)} fullWidth>建筑物</Button></Grid>
          <Grid item xs={12}><Button variant={showDevices ? "contained" : "outlined"} onClick={() => setShowDevices(!showDevices)} fullWidth>设备</Button></Grid>
          <Grid item xs={12}><Button variant={showEnergyFlow ? "contained" : "outlined"} onClick={() => setShowEnergyFlow(!showEnergyFlow)} fullWidth>能流动画</Button></Grid>
        </Grid>
      </Paper>

      <Suspense fallback={
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
          <Typography variant="h6" ml={2}>加载3D场景中...</Typography>
        </Box>
      }>
        <Canvas shadows dpr={[1, 2]}>
          <OrbitControls ref={controlsRef} enableZoom={true} enablePan={true} enableRotate={true} maxPolarAngle={Math.PI / 2} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <Stars />
          <Environment preset="city" />
          <ParkModel 
            showBuildings={showBuildings} 
            showDevices={showDevices} 
            showEnergyFlow={showEnergyFlow} 
            visualizationMode={visualizationMode} 
            deviceData={deviceData} 
            isLoadingData={isLoadingData} 
          />
        </Canvas>
      </Suspense>
    </Box>
  );
});

export default DigitalTwinScene;