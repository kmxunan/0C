# 3D可视化模块实现说明

## 1. 模块概述
3D可视化模块基于Three.js构建，实现园区的三维数字孪生展示，支持实时数据绑定、交互操作和性能优化功能。

## 2. 技术架构
```
+---------------------+
|     表现层           |
|  - React组件         |
|  - Three.js渲染器    |
|  - 用户交互处理       |
+----------+----------+
           |
+----------v----------+
|     场景管理层       |
|  - 场景初始化        |
|  - 对象管理          |
|  - 动画控制          |
+----------+----------+
           |
+----------v----------+
|     数据绑定层       |
|  - 实时数据订阅      |
|  - 状态更新          |
|  - 可视化映射        |
+----------+----------+
           |
+----------v----------+
|     资源加载层       |
|  - 模型加载          |
|  - 纹理加载          |
|  - 资源缓存          |
+---------------------+
```

## 3. 核心技术实现

### 3.1 场景初始化
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 初始化场景
function initScene() {
  // 创建场景和相机
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
  );
  
  // 创建渲染器
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  // 添加控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);
  
  return { scene, camera, renderer, controls };
}
```

### 3.2 实时数据绑定
```javascript
// 更新设备状态函数
function updateDeviceState(deviceId, data) {
  const object = scene.getObjectByName(`device_${deviceId}`);
  if (!object) return;
  
  // 根据数据更新对象属性
  if (data.temperature) {
    // 温度颜色映射
    const color = mapTemperatureToColor(data.temperature);
    object.material.color.set(color);
  }
  
  // 更新位置（如果需要）
  if (data.position) {
    object.position.set(data.position.x, data.position.y, data.position.z);
  }
  
  // 触发闪烁效果（数据更新时）
  if (data.updateTriggered) {
    triggerPulseEffect(object);
  }
}

// 数据更新循环
function startDataUpdateLoop() {
  setInterval(async () => {
    const newData = await fetchDataFromAPI();
    
    newData.forEach(item => {
      updateDeviceState(item.id, item.data);
    });
    
    // 记录性能指标
    performanceMonitor.recordFrameRate();
  }, DATA_UPDATE_INTERVAL);
}
```

### 3.3 性能优化
```javascript
// 对象池实现
class ObjectPool {
  constructor(type, count) {
    this.type = type;
    this.pool = [];
    this.used = [];
    
    // 预先创建对象
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createObject());
    }
  }
  
  createObject() {
    // 根据类型创建不同对象
    switch (this.type) {
      case 'windTurbine':
        return new WindTurbine();
      case 'solarPanel':
        return new SolarPanel();
      default:
        return new GenericDevice();
    }
  }
  
  getObject() {
    let obj;
    
    // 优先从池中获取
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      // 池为空时创建新对象（限制最大数量）
      if (this.used.length < MAX_OBJECT_COUNT) {
        obj = this.createObject();
      }
    }
    
    if (obj) {
      this.used.push(obj);
    }
    
    return obj;
  }
  
  releaseObject(obj) {
    const index = this.used.indexOf(obj);
    if (index !== -1) {
      this.used.splice(index, 1);
      this.pool.push(obj);
    }
  }
}
```

## 4. 配置参数

| 参数 | 描述 | 默认值 |
|------|------|--------|
|渲染精度|渲染质量（高/中/低）|中|
|更新间隔|实时数据更新频率|1秒|
|粒子数量|粒子系统的最大粒子数|1000|
|阴影质量|阴影渲染质量（高/中/低）|中|
|最大对象数|对象池的最大对象数量|500|

## 5. 监控与告警
- 实时监控帧率（目标：45-60 FPS）
- 内存使用监控（警戒线：512MB）
- 渲染延迟监控（阈值：5秒）
- 提供性能统计报表