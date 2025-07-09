import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { LOD } from 'three';

const DigitalTwinViewer = ({ parkData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // 初始化场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 100);

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 加载GLTF模型示例
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/examples/jsm/libs/draco/'); // 设置Draco解码器的路径
    loader.setDRACOLoader(dracoLoader);
    const lodModel = new LOD();

    // 加载高细节模型
    loader.load(
      'models/building_lod0.glb', // 假设高细节模型
      function (gltf) {
        lodModel.addLevel(gltf.scene, 0); // 距离0时显示高细节模型
      },
      undefined,
      function (error) {
        console.error('Error loading building_lod0.glb:', error);
      }
    );

    // 加载低细节模型
    loader.load(
      'models/building_lod1.glb', // 假设低细节模型
      function (gltf) {
        lodModel.addLevel(gltf.scene, 100); // 距离100时显示低细节模型
      },
      undefined,
      function (error) {
        console.error('Error loading building_lod1.glb:', error);
      }
    );
    scene.add(lodModel);
    lodModel.position.set(0, 0, 0); // 调整LOD模型位置

    // 创建园区建筑
    parkData.buildings.forEach((building) => {
      const lod = new LOD();

      // 假设我们有不同细节的模型，这里用简单的几何体代替
      // 高细节模型
      const geometryHigh = new THREE.BoxGeometry(
        building.dimensions.width,
        building.dimensions.height,
        building.dimensions.depth
      );
      const materialHigh = new THREE.MeshStandardMaterial({
        color: building.type === 'industrial' ? 0x4a90e2 : 0x66c2a5,
        metalness: 0.3,
        roughness: 0.8,
      });
      const meshHigh = new THREE.Mesh(geometryHigh, materialHigh);
      lod.addLevel(meshHigh, 0); // 距离0时显示高细节模型

      // 中细节模型
      const geometryMid = new THREE.BoxGeometry(
        building.dimensions.width * 0.9,
        building.dimensions.height * 0.9,
        building.dimensions.depth * 0.9
      );
      const materialMid = new THREE.MeshStandardMaterial({
        color: building.type === 'industrial' ? 0x4a90e2 : 0x66c2a5,
        metalness: 0.5,
        roughness: 0.9,
      });
      const meshMid = new THREE.Mesh(geometryMid, materialMid);
      lod.addLevel(meshMid, 50); // 距离50时显示中细节模型

      // 低细节模型
      const geometryLow = new THREE.BoxGeometry(
        building.dimensions.width * 0.8,
        building.dimensions.height * 0.8,
        building.dimensions.depth * 0.8
      );
      const materialLow = new THREE.MeshStandardMaterial({
        color: building.type === 'industrial' ? 0x4a90e2 : 0x66c2a5,
        metalness: 0.7,
        roughness: 1.0,
      });
      const meshLow = new THREE.Mesh(geometryLow, materialLow);
      lod.addLevel(meshLow, 100); // 距离100时显示低细节模型

      lod.position.set(...building.position);
      scene.add(lod);
    });

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      // 更新LOD
      scene.traverse((object) => {
        if (object instanceof LOD) {
          object.update(camera);
        }
      });
      renderer.render(scene, camera);
    };

    animate();

    // 清理函数
    return () => {
      renderer.dispose();
      // 注意：这里需要更精细的清理，因为LOD内部有多个mesh和geometry/material
      // 对于简单的几何体，可以遍历lod的levels进行清理
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
    };
  }, [parkData]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100vh' }} />;
};

export default DigitalTwinViewer;
