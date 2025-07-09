import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * AR/VR预备功能系统
 * 为未来的增强现实和虚拟现实功能提供基础架构
 */

/**
 * WebXR管理器
 */
export const WebXRManager = ({ 
  onSessionStart,
  onSessionEnd,
  onError,
  enableAR = true,
  enableVR = true
}) => {
  const { gl } = useThree();
  // const scene = useThree().scene; // 未使用，已注释
  // const camera = useThree().camera; // 未使用，已注释
  const [xrSupported, setXrSupported] = useState({
    ar: false,
    vr: false
  });
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionType, setSessionType] = useState(null);
  
  // 检查WebXR支持
  useEffect(() => {
    const checkXRSupport = async () => {
      if (!navigator.xr) {
        console.warn('WebXR不支持');
        return;
      }
      
      try {
        const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
        const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        
        setXrSupported({
          ar: arSupported && enableAR,
          vr: vrSupported && enableVR
        });
        
        console.log('XR支持状态:', { ar: arSupported, vr: vrSupported });
      } catch (error) {
        console.error('检查XR支持时出错:', error);
        onError?.(error);
      }
    };
    
    checkXRSupport();
  }, [enableAR, enableVR, onError]);
  
  // 启动AR会话
  const startARSession = useCallback(async () => {
    if (!xrSupported.ar) {
      console.warn('AR不支持');
      return;
    }
    
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local', 'hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation']
      });
      
      await gl.xr.setSession(session);
      setCurrentSession(session);
      setSessionType('ar');
      
      session.addEventListener('end', () => {
        setCurrentSession(null);
        setSessionType(null);
        onSessionEnd?.('ar');
      });
      
      onSessionStart?.('ar', session);
      console.log('AR会话已启动');
    } catch (error) {
      console.error('启动AR会话失败:', error);
      onError?.(error);
    }
  }, [xrSupported.ar, gl, onSessionStart, onSessionEnd, onError]);
  
  // 启动VR会话
  const startVRSession = useCallback(async () => {
    if (!xrSupported.vr) {
      console.warn('VR不支持');
      return;
    }
    
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local'],
        optionalFeatures: ['hand-tracking', 'eye-tracking']
      });
      
      await gl.xr.setSession(session);
      setCurrentSession(session);
      setSessionType('vr');
      
      session.addEventListener('end', () => {
        setCurrentSession(null);
        setSessionType(null);
        onSessionEnd?.('vr');
      });
      
      onSessionStart?.('vr', session);
      console.log('VR会话已启动');
    } catch (error) {
      console.error('启动VR会话失败:', error);
      onError?.(error);
    }
  }, [xrSupported.vr, gl, onSessionStart, onSessionEnd, onError]);
  
  // 结束当前会话
  const endSession = useCallback(() => {
    if (currentSession) {
      currentSession.end();
    }
  }, [currentSession]);
  
  return {
    xrSupported,
    currentSession,
    sessionType,
    startARSession,
    startVRSession,
    endSession,
    isInXR: !!currentSession
  };
};

/**
 * AR锚点系统
 */
export const ARAnchors = ({ 
  anchors = [],
  onAnchorCreate,
  onAnchorUpdate,
  onAnchorDelete,
  showAnchors = true
}) => {
  const [hitTestSource, setHitTestSource] = useState(null);
  const [reticle, setReticle] = useState(null);
  const { gl, scene } = useThree();
  
  // 初始化命中测试
  useEffect(() => {
    const initHitTest = async () => {
      const session = gl.xr.getSession();
      if (!session) return;
      
      try {
        const referenceSpace = await session.requestReferenceSpace('viewer');
        const hitTestSource = await session.requestHitTestSource({ space: referenceSpace });
        setHitTestSource(hitTestSource);
        
        // 创建瞄准器
        const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
        const reticleMaterial = new THREE.MeshBasicMaterial();
        const reticleMesh = new THREE.Mesh(reticleGeometry, reticleMaterial);
        reticleMesh.matrixAutoUpdate = false;
        reticleMesh.visible = false;
        scene.add(reticleMesh);
        setReticle(reticleMesh);
      } catch (error) {
        console.error('初始化命中测试失败:', error);
      }
    };
    
    initHitTest();
    
    return () => {
      if (hitTestSource) {
        hitTestSource.cancel();
      }
      if (reticle) {
        scene.remove(reticle);
      }
    };
  }, [gl, scene, hitTestSource, reticle]);
  
  // 更新命中测试
  useFrame((state, delta, frame) => {
    if (!frame || !hitTestSource || !reticle) return;
    
    const hitTestResults = frame.getHitTestResults(hitTestSource);
    
    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      reticle.visible = true;
      reticle.matrix.fromArray(hit.getPose(gl.xr.getReferenceSpace()).transform.matrix);
    } else {
      reticle.visible = false;
    }
  });
  
  // 创建锚点
  // const createAnchor = useCallback(async (position, rotation = [0, 0, 0]) => {
  //   const session = gl.xr.getSession();
  //   if (!session) return null;
  //   
  //   try {
  //     const referenceSpace = gl.xr.getReferenceSpace();
  //     const anchorPose = new XRRigidTransform(
  //       { x: position[0], y: position[1], z: position[2] },
  //       { x: rotation[0], y: rotation[1], z: rotation[2], w: 1 }
  //     );
  //     
  //     const anchor = await session.requestAnchor(anchorPose, referenceSpace);
  //     
  //     const anchorData = {
  //       id: Date.now().toString(),
  //       anchor,
  //       position,
  //       rotation,
  //       timestamp: Date.now()
  //     };
  //     
  //     onAnchorCreate?.(anchorData);
  //     return anchorData;
  //   } catch (error) {
  //     console.error('创建锚点失败:', error);
  //     return null;
  //   }
  // }, [gl, onAnchorCreate]); // 未使用，已注释
  
  return (
    <group>
      {/* 渲染锚点 */}
      {showAnchors && anchors.map((anchorData) => (
        <ARAnchor
          key={anchorData.id}
          anchorData={anchorData}
          onUpdate={onAnchorUpdate}
          onDelete={onAnchorDelete}
        />
      ))}
    </group>
  );
};

/**
 * 单个AR锚点组件
 */
const ARAnchor = ({ anchorData, onUpdate, onDelete }) => {
  const meshRef = useRef();
  const [visible, setVisible] = useState(true);
  
  useFrame((state, delta, frame) => {
    if (!frame || !anchorData.anchor || !meshRef.current) return;
    
    try {
      const pose = frame.getPose(anchorData.anchor.anchorSpace, frame.session.renderState.baseLayer.framebuffer);
      if (pose) {
        meshRef.current.matrix.fromArray(pose.transform.matrix);
        meshRef.current.matrixAutoUpdate = false;
        setVisible(true);
      } else {
        setVisible(false);
      }
    } catch (error) {
      console.error('更新锚点位置失败:', error);
      setVisible(false);
    }
  });
  
  if (!visible) return null;
  
  return (
    <group ref={meshRef}>
      {/* 锚点可视化 */}
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#ff0000" transparent opacity={0.7} />
      </mesh>
      
      {/* 锚点信息 */}
      <Html
        position={[0, 0.2, 0]}
        center
        distanceFactor={5}
      >
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}>
          锚点 {anchorData.id}
        </div>
      </Html>
    </group>
  );
};

/**
 * VR控制器系统
 */
export const VRControllers = ({ 
  onControllerConnect,
  onControllerDisconnect,
  onControllerSelect,
  onControllerSqueeze,
  showControllers = true
}) => {
  const [controllers, setControllers] = useState([]);
  const { gl, scene } = useThree();
  
  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;
    
    const handleInputSourcesChange = (event) => {
      const inputSources = Array.from(session.inputSources);
      setControllers(inputSources);
      
      event.added?.forEach(source => {
        onControllerConnect?.(source);
      });
      
      event.removed?.forEach(source => {
        onControllerDisconnect?.(source);
      });
    };
    
    session.addEventListener('inputsourceschange', handleInputSourcesChange);
    
    // 初始化现有控制器
    setControllers(Array.from(session.inputSources));
    
    return () => {
      session.removeEventListener('inputsourceschange', handleInputSourcesChange);
    };
  }, [gl, onControllerConnect, onControllerDisconnect]);
  
  return (
    <group>
      {showControllers && controllers.map((controller, index) => (
        <VRController
          key={controller.handedness + index}
          controller={controller}
          index={index}
          onSelect={onControllerSelect}
          onSqueeze={onControllerSqueeze}
        />
      ))}
    </group>
  );
};

/**
 * 单个VR控制器组件
 */
const VRController = ({ controller, index, onSelect, onSqueeze }) => {
  const meshRef = useRef();
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSqeezing, setIsSqeezing] = useState(false);
  
  useEffect(() => {
    const handleSelectStart = () => {
      setIsSelecting(true);
      onSelect?.(controller, 'start');
    };
    
    const handleSelectEnd = () => {
      setIsSelecting(false);
      onSelect?.(controller, 'end');
    };
    
    const handleSqueezeStart = () => {
      setIsSqeezing(true);
      onSqueeze?.(controller, 'start');
    };
    
    const handleSqueezeEnd = () => {
      setIsSqeezing(false);
      onSqueeze?.(controller, 'end');
    };
    
    controller.addEventListener('selectstart', handleSelectStart);
    controller.addEventListener('selectend', handleSelectEnd);
    controller.addEventListener('squeezestart', handleSqueezeStart);
    controller.addEventListener('squeezeend', handleSqueezeEnd);
    
    return () => {
      controller.removeEventListener('selectstart', handleSelectStart);
      controller.removeEventListener('selectend', handleSelectEnd);
      controller.removeEventListener('squeezestart', handleSqueezeStart);
      controller.removeEventListener('squeezeend', handleSqueezeEnd);
    };
  }, [controller, onSelect, onSqueeze]);
  
  useFrame((state, delta, frame) => {
    if (!frame || !controller.gripSpace || !meshRef.current) return;
    
    try {
      const pose = frame.getPose(controller.gripSpace, frame.session.renderState.baseLayer.framebuffer);
      if (pose) {
        meshRef.current.matrix.fromArray(pose.transform.matrix);
        meshRef.current.matrixAutoUpdate = false;
      }
    } catch (error) {
      console.error('更新控制器位置失败:', error);
    }
  });
  
  return (
    <group ref={meshRef}>
      {/* 控制器模型 */}
      <mesh>
        <boxGeometry args={[0.05, 0.1, 0.15]} />
        <meshStandardMaterial 
          color={isSelecting ? '#00ff00' : isSqeezing ? '#ff0000' : '#666666'}
        />
      </mesh>
      
      {/* 射线指示器 */}
      {isSelecting && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 0, 0, 0, 0, -5])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00ff00" />
        </line>
      )}
      
      {/* 控制器标签 */}
      <Html
        position={[0, 0.15, 0]}
        center
        distanceFactor={3}
      >
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          whiteSpace: 'nowrap'
        }}>
          {controller.handedness} {index}
        </div>
      </Html>
    </group>
  );
};

/**
 * XR用户界面系统
 */
export const XRUserInterface = ({ 
  children,
  position = [0, 1.6, -1],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  followUser = false
}) => {
  const groupRef = useRef();
  const { camera } = useThree();
  
  useFrame(() => {
    if (followUser && groupRef.current) {
      // 让UI面板始终面向用户
      groupRef.current.lookAt(camera.position);
      
      // 保持相对距离
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.multiplyScalar(-2); // 距离用户2米
      direction.add(camera.position);
      direction.y = position[1]; // 保持固定高度
      
      groupRef.current.position.copy(direction);
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* 背景面板 */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2, 1.5]} />
        <meshStandardMaterial 
          color="#000000"
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* UI内容 */}
      {children}
    </group>
  );
};

/**
 * AR/VR状态指示器
 */
export const XRStatusIndicator = ({ position = [0, 2, 0] }) => {
  const xrManager = WebXRManager({});
  
  return (
    <group position={position}>
      <Html center>
        <div style={{
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          minWidth: '200px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#3498db' }}>
            XR状态
          </h4>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>AR支持:</strong> {xrManager.xrSupported.ar ? '✓' : '✗'}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>VR支持:</strong> {xrManager.xrSupported.vr ? '✓' : '✗'}
          </div>
          
          {xrManager.isInXR && (
            <div style={{ marginTop: '8px', color: '#27ae60' }}>
              <strong>当前模式:</strong> {xrManager.sessionType?.toUpperCase()}
            </div>
          )}
          
          <div style={{ marginTop: '12px' }}>
            {xrManager.xrSupported.ar && (
              <button
                onClick={xrManager.startARSession}
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >
                启动AR
              </button>
            )}
            
            {xrManager.xrSupported.vr && (
              <button
                onClick={xrManager.startVRSession}
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >
                启动VR
              </button>
            )}
            
            {xrManager.isInXR && (
              <button
                onClick={xrManager.endSession}
                style={{
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >
                退出XR
              </button>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};

/**
 * 空间音频系统
 */
export const SpatialAudio = ({ 
  sounds = [],
  listenerPosition = [0, 1.6, 0],
  enabled = true
}) => {
  const audioContextRef = useRef(null);
  const listenerRef = useRef(null);
  const soundsRef = useRef(new Map());
  
  useEffect(() => {
    if (!enabled) return;
    
    // 初始化音频上下文
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    listenerRef.current = audioContextRef.current.listener;
    
    // 设置监听器位置
    if (listenerRef.current.positionX) {
      listenerRef.current.positionX.setValueAtTime(listenerPosition[0], audioContextRef.current.currentTime);
      listenerRef.current.positionY.setValueAtTime(listenerPosition[1], audioContextRef.current.currentTime);
      listenerRef.current.positionZ.setValueAtTime(listenerPosition[2], audioContextRef.current.currentTime);
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [enabled, listenerPosition]);
  
  // 播放空间音频
  const playSound = useCallback(async (soundId, url, position, volume = 1) => {
    if (!audioContextRef.current) return;
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      const source = audioContextRef.current.createBufferSource();
      const panner = audioContextRef.current.createPanner();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = audioBuffer;
      
      // 配置空间音频
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;
      
      // 设置位置
      if (panner.positionX) {
        panner.positionX.setValueAtTime(position[0], audioContextRef.current.currentTime);
        panner.positionY.setValueAtTime(position[1], audioContextRef.current.currentTime);
        panner.positionZ.setValueAtTime(position[2], audioContextRef.current.currentTime);
      }
      
      // 设置音量
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      
      // 连接音频节点
      source.connect(panner);
      panner.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // 播放
      source.start();
      
      soundsRef.current.set(soundId, { source, panner, gainNode });
      
      // 播放结束后清理
      source.onended = () => {
        soundsRef.current.delete(soundId);
      };
      
    } catch (error) {
      console.error('播放空间音频失败:', error);
    }
  }, []);
  
  // 停止音频
  const stopSound = useCallback((soundId) => {
    const sound = soundsRef.current.get(soundId);
    if (sound) {
      sound.source.stop();
      soundsRef.current.delete(soundId);
    }
  }, []);
  
  return {
    playSound,
    stopSound,
    isEnabled: enabled && !!audioContextRef.current
  };
};

const ARVRSystem = {
  WebXRManager,
  ARAnchors,
  VRControllers,
  XRUserInterface,
  XRStatusIndicator,
  SpatialAudio
};

export default ARVRSystem;