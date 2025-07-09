import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
// import { Vector3, Raycaster, Vector2 } from 'three'; // Vector3未使用，已注释
import { Raycaster, Vector2 } from 'three';
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/three';
// import Hammer from 'hammerjs'; // 未使用，已注释

/**
 * 高级交互系统组件
 * 支持手势控制、语音命令、快捷键、多点触控等
 */

/**
 * 手势控制系统
 */
export const GestureController = ({ 
  onPinch, 
  onRotate, 
  onPan, 
  onTap, 
  onDoubleTap,
  sensitivity = 1,
  enabled = true,
  children 
}) => {
  const meshRef = useRef();
  const [gestureState, setGestureState] = useState({
    isPinching: false,
    isRotating: false,
    isPanning: false,
    scale: 1,
    rotation: 0,
    offset: [0, 0]
  });
  
  // 手势绑定
  const bind = useGesture({
    // 缩放手势
    onPinch: ({ offset: [scale], velocity, direction, memo }) => {
      if (!enabled) return;
      
      setGestureState(prev => ({ ...prev, isPinching: true, scale }));
      onPinch?.({ scale, velocity, direction, memo });
      
      return memo;
    },
    onPinchEnd: () => {
      setGestureState(prev => ({ ...prev, isPinching: false }));
    },
    
    // 旋转手势
    onWheel: ({ offset: [, rotation], velocity, direction }) => {
      if (!enabled) return;
      
      setGestureState(prev => ({ ...prev, isRotating: true, rotation }));
      onRotate?.({ rotation: rotation * sensitivity, velocity, direction });
    },
    onWheelEnd: () => {
      setGestureState(prev => ({ ...prev, isRotating: false }));
    },
    
    // 拖拽手势
    onDrag: ({ offset, velocity, direction, tap, memo }) => {
      if (!enabled) return;
      
      if (tap) {
        onTap?.(memo);
        return memo;
      }
      
      setGestureState(prev => ({ 
        ...prev, 
        isPanning: true, 
        offset: [offset[0] * sensitivity, offset[1] * sensitivity] 
      }));
      
      onPan?.({ 
        offset: [offset[0] * sensitivity, offset[1] * sensitivity], 
        velocity, 
        direction, 
        memo 
      });
      
      return memo;
    },
    onDragEnd: () => {
      setGestureState(prev => ({ ...prev, isPanning: false }));
    },
    
    // 双击手势
    onDoubleClick: ({ event }) => {
      if (!enabled) return;
      onDoubleTap?.(event);
    }
  }, {
    pinch: { scaleBounds: { min: 0.1, max: 10 } },
    drag: { filterTaps: true },
    wheel: { axis: 'y' }
  });
  
  return (
    <group ref={meshRef} {...bind()}>
      {children}
      
      {/* 手势状态指示器 */}
      {(gestureState.isPinching || gestureState.isRotating || gestureState.isPanning) && (
        <GestureIndicator state={gestureState} />
      )}
    </group>
  );
};

/**
 * 手势状态指示器
 */
const GestureIndicator = ({ state }) => {
  const [spring, api] = useSpring(() => ({
    opacity: 0,
    scale: 1,
    config: { tension: 300, friction: 30 }
  }));
  
  useEffect(() => {
    const isActive = state.isPinching || state.isRotating || state.isPanning;
    api.start({ 
      opacity: isActive ? 1 : 0,
      scale: isActive ? 1.2 : 1
    });
  }, [state, api]);
  
  return (
    <animated.group scale={spring.scale}>
      <animated.mesh position={[0, 5, 0]}>
        <sphereGeometry args={[0.1]} />
        <animated.meshBasicMaterial 
          color={state.isPinching ? '#ff6b6b' : state.isRotating ? '#4ecdc4' : '#45b7d1'}
          transparent
          opacity={spring.opacity}
        />
      </animated.mesh>
    </animated.group>
  );
};

/**
 * 语音命令系统
 */
export const VoiceController = ({ 
  commands = {},
  language = 'zh-CN',
  continuous = true,
  enabled = true,
  onResult,
  onError,
  onStart,
  onEnd
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [lastCommand, setLastCommand] = useState('');
  
  // 初始化语音识别
  useEffect(() => {
    if (!enabled || (!window.webkitSpeechRecognition && !window.SpeechRecognition)) {
      console.warn('语音识别不支持');
      return;
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = continuous;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;
    
    recognitionInstance.onstart = () => {
      setIsListening(true);
      onStart?.();
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
      onEnd?.();
    };
    
    recognitionInstance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
        .toLowerCase()
        .trim();
      
      setLastCommand(transcript);
      onResult?.(transcript);
      
      // 匹配命令
      Object.entries(commands).forEach(([command, handler]) => {
        if (transcript.includes(command.toLowerCase())) {
          handler(transcript);
        }
      });
    };
    
    recognitionInstance.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      onError?.(event.error);
    };
    
    setRecognition(recognitionInstance);
    
    return () => {
      recognitionInstance.stop();
    };
  }, [commands, language, continuous, enabled, onResult, onError, onStart, onEnd]);
  
  // 开始/停止语音识别
  const toggleListening = useCallback(() => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }, [recognition, isListening]);
  
  return (
    <VoiceIndicator 
      isListening={isListening}
      lastCommand={lastCommand}
      onToggle={toggleListening}
    />
  );
};

/**
 * 语音状态指示器
 */
const VoiceIndicator = ({ isListening, lastCommand, onToggle }) => {
  const [spring, api] = useSpring(() => ({
    scale: 1,
    color: '#95a5a6',
    opacity: 0.8,
    config: { tension: 300, friction: 30 }
  }));
  
  useEffect(() => {
    api.start({
      scale: isListening ? 1.3 : 1,
      color: isListening ? '#e74c3c' : '#95a5a6',
      opacity: isListening ? 1 : 0.8
    });
  }, [isListening, api]);
  
  return (
    <group position={[-8, 4, 0]}>
      <animated.mesh 
        scale={spring.scale}
        onClick={onToggle}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <sphereGeometry args={[0.3]} />
        <animated.meshStandardMaterial 
          color={spring.color}
          transparent
          opacity={spring.opacity}
        />
      </animated.mesh>
      
      {/* 语音波形效果 */}
      {isListening && <VoiceWaveform />}
      
      {/* 最后命令显示 */}
      {lastCommand && (
        <Html position={[0, -1, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '200px',
            textAlign: 'center'
          }}>
            {lastCommand}
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 语音波形效果
 */
const VoiceWaveform = () => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        child.scale.y = 1 + Math.sin(state.clock.elapsedTime * 10 + index) * 0.5;
      });
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[(i - 3.5) * 0.1, 0, 0]}>
          <boxGeometry args={[0.05, 0.5, 0.05]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
      ))}
    </group>
  );
};

/**
 * 快捷键系统
 */
export const KeyboardController = ({ 
  shortcuts = {},
  enabled = true,
  preventDefault = true
}) => {
  const [activeKeys, setActiveKeys] = useState(new Set());
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      setActiveKeys(prev => new Set([...prev, key]));
      
      // 检查快捷键组合
      const combination = Array.from(activeKeys).concat(key).sort().join('+');
      
      Object.entries(shortcuts).forEach(([shortcut, handler]) => {
        const normalizedShortcut = shortcut.toLowerCase().split('+').sort().join('+');
        if (combination.includes(normalizedShortcut)) {
          if (preventDefault) {
            event.preventDefault();
          }
          handler(event);
        }
      });
    };
    
    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shortcuts, enabled, preventDefault, activeKeys]);
  
  return (
    <KeyboardIndicator activeKeys={activeKeys} shortcuts={shortcuts} />
  );
};

/**
 * 快捷键指示器
 */
const KeyboardIndicator = ({ activeKeys, shortcuts }) => {
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <group position={[8, 4, 0]}>
      <mesh 
        onClick={() => setShowHelp(!showHelp)}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <boxGeometry args={[0.6, 0.4, 0.1]} />
        <meshStandardMaterial color={showHelp ? '#3498db' : '#95a5a6'} />
      </mesh>
      
      {/* 快捷键帮助 */}
      {showHelp && (
        <Html position={[0, -2, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            minWidth: '200px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#3498db' }}>快捷键</h4>
            {Object.entries(shortcuts).map(([shortcut, _]) => (
              <div key={shortcut} style={{ margin: '4px 0' }}>
                <span style={{ 
                  background: '#34495e', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>
                  {shortcut}
                </span>
              </div>
            ))}
            
            {activeKeys.size > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #34495e' }}>
                <small>当前按键: {Array.from(activeKeys).join(', ')}</small>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 射线投射交互系统
 */
export const RaycastInteraction = ({ 
  onHover,
  onClick,
  onDoubleClick,
  enabled = true,
  showRay = false,
  rayColor = '#ff0000'
}) => {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const mouse = useRef(new Vector2());
  const [hoveredObject, setHoveredObject] = useState(null);
  const [rayPoints, setRayPoints] = useState([]);
  
  // 更新鼠标位置
  const updateMouse = useCallback((event) => {
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }, [gl]);
  
  // 射线投射
  const performRaycast = useCallback(() => {
    if (!enabled) return [];
    
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    // 更新射线可视化
    if (showRay) {
      const origin = raycaster.current.ray.origin;
      const direction = raycaster.current.ray.direction.clone().multiplyScalar(50);
      const end = origin.clone().add(direction);
      setRayPoints([origin, end]);
    }
    
    return intersects;
  }, [enabled, camera, scene, showRay]);
  
  // 鼠标移动处理
  const handleMouseMove = useCallback((event) => {
    updateMouse(event);
    const intersects = performRaycast();
    
    const newHovered = intersects.length > 0 ? intersects[0].object : null;
    
    if (newHovered !== hoveredObject) {
      // 取消之前的悬停
      if (hoveredObject) {
        onHover?.(null, hoveredObject);
      }
      
      // 设置新的悬停
      if (newHovered) {
        onHover?.(intersects[0], newHovered);
        gl.domElement.style.cursor = 'pointer';
      } else {
        gl.domElement.style.cursor = 'auto';
      }
      
      setHoveredObject(newHovered);
    }
  }, [updateMouse, performRaycast, hoveredObject, onHover, gl]);
  
  // 点击处理
  const handleClick = useCallback((event) => {
    updateMouse(event);
    const intersects = performRaycast();
    
    if (intersects.length > 0) {
      onClick?.(intersects[0], event);
    }
  }, [updateMouse, performRaycast, onClick]);
  
  // 双击处理
  const handleDoubleClick = useCallback((event) => {
    updateMouse(event);
    const intersects = performRaycast();
    
    if (intersects.length > 0) {
      onDoubleClick?.(intersects[0], event);
    }
  }, [updateMouse, performRaycast, onDoubleClick]);
  
  // 绑定事件
  useEffect(() => {
    if (!enabled) return;
    
    const canvas = gl.domElement;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDoubleClick);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [enabled, gl, handleMouseMove, handleClick, handleDoubleClick]);
  
  return (
    <>
      {/* 射线可视化 */}
      {showRay && rayPoints.length === 2 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                rayPoints[0].x, rayPoints[0].y, rayPoints[0].z,
                rayPoints[1].x, rayPoints[1].y, rayPoints[1].z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={rayColor} />
        </line>
      )}
    </>
  );
};

/**
 * 多点触控系统
 */
export const MultiTouchController = ({ 
  onTouch,
  onPinch,
  onRotate,
  enabled = true
}) => {
  const [touches, setTouches] = useState([]);
  const [gestureState, setGestureState] = useState({
    initialDistance: 0,
    initialAngle: 0,
    scale: 1,
    rotation: 0
  });
  
  // 计算两点距离
  const getDistance = useCallback((touch1, touch2) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);
  
  // 计算两点角度
  const getAngle = useCallback((touch1, touch2) => {
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    );
  }, []);
  
  // 触摸开始
  const handleTouchStart = useCallback((event) => {
    if (!enabled) return;
    
    const touchList = Array.from(event.touches);
    setTouches(touchList);
    
    if (touchList.length === 2) {
      const distance = getDistance(touchList[0], touchList[1]);
      const angle = getAngle(touchList[0], touchList[1]);
      
      setGestureState({
        initialDistance: distance,
        initialAngle: angle,
        scale: 1,
        rotation: 0
      });
    }
    
    onTouch?.('start', touchList);
  }, [enabled, getDistance, getAngle, onTouch]);
  
  // 触摸移动
  const handleTouchMove = useCallback((event) => {
    if (!enabled) return;
    
    const touchList = Array.from(event.touches);
    setTouches(touchList);
    
    if (touchList.length === 2 && gestureState.initialDistance > 0) {
      const distance = getDistance(touchList[0], touchList[1]);
      const angle = getAngle(touchList[0], touchList[1]);
      
      const scale = distance / gestureState.initialDistance;
      const rotation = angle - gestureState.initialAngle;
      
      setGestureState(prev => ({ ...prev, scale, rotation }));
      
      onPinch?.(scale);
      onRotate?.(rotation);
    }
    
    onTouch?.('move', touchList);
  }, [enabled, gestureState, getDistance, getAngle, onTouch, onPinch, onRotate]);
  
  // 触摸结束
  const handleTouchEnd = useCallback((event) => {
    if (!enabled) return;
    
    const touchList = Array.from(event.touches);
    setTouches(touchList);
    
    if (touchList.length < 2) {
      setGestureState({
        initialDistance: 0,
        initialAngle: 0,
        scale: 1,
        rotation: 0
      });
    }
    
    onTouch?.('end', touchList);
  }, [enabled, onTouch]);
  
  // 绑定触摸事件
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  return (
    <TouchIndicator 
      touches={touches}
      gestureState={gestureState}
    />
  );
};

/**
 * 触摸指示器
 */
const TouchIndicator = ({ touches, gestureState }) => {
  return (
    <group>
      {touches.map((touch, index) => (
        <mesh key={touch.identifier} position={[index * 2 - 1, 3, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#9b59b6" />
        </mesh>
      ))}
      
      {touches.length === 2 && (
        <Html position={[0, 2, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            <div>缩放: {gestureState.scale.toFixed(2)}</div>
            <div>旋转: {(gestureState.rotation * 180 / Math.PI).toFixed(1)}°</div>
          </div>
        </Html>
      )}
    </group>
  );
};

const InteractionSystem = {
  GestureController,
  VoiceController,
  KeyboardController,
  RaycastInteraction,
  MultiTouchController
};

export default InteractionSystem;