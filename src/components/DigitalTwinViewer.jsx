import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // 创建园区建筑
    parkData.buildings.forEach(building => {
      const geometry = new THREE.BoxGeometry(
        building.dimensions.width,
        building.dimensions.height,
        building.dimensions.depth
      );
      
      const material = new THREE.MeshStandardMaterial({
        color: building.type === 'industrial' ? 0x4a90e2 : 0x66c2a5,
        metalness: 0.3,
        roughness: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...building.position);
      scene.add(mesh);
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
      renderer.render(scene, camera);
    };
    
    animate();
    
    // 清理函数
    return () => {
      renderer.dispose();
      geometry?.dispose();
      material?.dispose();
    };
  }, [parkData]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
};

export default DigitalTwinViewer;