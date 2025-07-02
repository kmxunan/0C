/**
 * 数字孪生场景管理器
 * 负责3D场景的创建、更新和管理
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.labelRenderer = null;
    this.controls = null;
    this.buildings = new Map();
    this.devices = new Map();
    this.sensors = new Map();
    this.animationId = null;
    
    this.init();
  }

  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // 天空蓝
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(100, 100, 100);

    // 创建WebGL渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 创建CSS2D渲染器用于标签
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    // 创建轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2;

    // 添加光源
    this.setupLighting();
    
    // 创建地面
    this.createGround();
    
    // 开始渲染循环
    this.animate();
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // 方向光（太阳光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // 创建建筑物
  createBuilding(buildingData) {
    const { id, name, position, dimensions, type, color } = buildingData;
    
    const geometry = new THREE.BoxGeometry(
      dimensions.width || 20,
      dimensions.height || 30,
      dimensions.depth || 15
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: color || (type === 'industrial' ? 0x4a90e2 : 0x66c2a5),
      metalness: 0.3,
      roughness: 0.8
    });
    
    const building = new THREE.Mesh(geometry, material);
    building.position.set(
      position.x || 0,
      (dimensions.height || 30) / 2,
      position.z || 0
    );
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData = { id, type: 'building', data: buildingData };
    
    this.scene.add(building);
    this.buildings.set(id, building);
    
    // 添加建筑标签
    this.createLabel(building, name, 'building');
    
    return building;
  }

  // 创建设备
  createDevice(deviceData) {
    const { id, name, position, device_type, status } = deviceData;
    
    let geometry, material;
    
    // 根据设备类型创建不同形状
    switch (device_type) {
      case 'solar_panel':
        geometry = new THREE.BoxGeometry(8, 0.5, 4);
        material = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
        break;
      case 'wind_turbine':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 15);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        break;
      case 'battery':
        geometry = new THREE.BoxGeometry(3, 4, 2);
        material = new THREE.MeshStandardMaterial({ color: 0x059669 });
        break;
      default:
        geometry = new THREE.BoxGeometry(2, 2, 2);
        material = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
    }
    
    // 根据状态调整颜色
    if (status === 'offline') {
      material.color.setHex(0xef4444);
    } else if (status === 'warning') {
      material.color.setHex(0xf59e0b);
    }
    
    const device = new THREE.Mesh(geometry, material);
    device.position.set(position.x || 0, position.y || 2, position.z || 0);
    device.castShadow = true;
    device.userData = { id, type: 'device', data: deviceData };
    
    this.scene.add(device);
    this.devices.set(id, device);
    
    // 添加设备标签
    this.createLabel(device, name, 'device');
    
    return device;
  }

  // 创建标签
  createLabel(object, text, type) {
    const labelDiv = document.createElement('div');
    labelDiv.className = `label label-${type}`;
    labelDiv.textContent = text;
    labelDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    labelDiv.style.color = 'white';
    labelDiv.style.padding = '4px 8px';
    labelDiv.style.borderRadius = '4px';
    labelDiv.style.fontSize = '12px';
    labelDiv.style.fontFamily = 'Arial, sans-serif';
    
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, object.geometry.parameters.height || 5, 0);
    object.add(label);
  }

  // 更新设备状态
  updateDeviceStatus(deviceId, status, data) {
    const device = this.devices.get(deviceId);
    if (!device) return;
    
    // 更新颜色
    let color;
    switch (status) {
      case 'online':
        color = 0x10b981;
        break;
      case 'warning':
        color = 0xf59e0b;
        break;
      case 'offline':
        color = 0xef4444;
        break;
      default:
        color = 0x6b7280;
    }
    
    device.material.color.setHex(color);
    device.userData.data = { ...device.userData.data, ...data, status };
  }

  // 添加数据可视化效果
  addDataVisualization(deviceId, value, maxValue = 100) {
    const device = this.devices.get(deviceId);
    if (!device) return;
    
    // 移除旧的可视化效果
    const oldViz = device.getObjectByName('dataViz');
    if (oldViz) device.remove(oldViz);
    
    // 创建数据条
    const barHeight = (value / maxValue) * 10;
    const geometry = new THREE.BoxGeometry(0.5, barHeight, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: value > 80 ? 0xef4444 : value > 60 ? 0xf59e0b : 0x10b981
    });
    
    const dataBar = new THREE.Mesh(geometry, material);
    dataBar.position.set(0, barHeight / 2 + 2, 0);
    dataBar.name = 'dataViz';
    device.add(dataBar);
  }

  // 动画循环
  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  // 窗口大小变化处理
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  // 清理资源
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    this.labelRenderer.domElement.remove();
    this.container.removeChild(this.renderer.domElement);
  }
}

export default SceneManager;