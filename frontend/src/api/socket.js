import { useEffect, useState } from 'react';

// 从环境变量获取WebSocket URL，默认为ws://localhost:3000/ws
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws';

/**
 * 自定义WebSocket Hook
 * @param {string} path - WebSocket连接路径
 * @returns {Object} - WebSocket实例和状态
 */
export const useWebSocket = (path = '') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    // 构建完整的WebSocket URL
    const url = `${WS_URL}${path}`;
    const newSocket = new WebSocket(url);

    // 连接打开时设置状态
    newSocket.onopen = () => {
      console.log('WebSocket连接已建立:', url);
      setSocket(newSocket);
      setIsConnected(true);
    };

    // 接收消息时更新状态
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
        setLastMessage(event.data);
      }
    };

    // 连接关闭时清理
    newSocket.onclose = () => {
      console.log('WebSocket连接已关闭');
      setIsConnected(false);
      setSocket(null);
      // 尝试重连
      setTimeout(() => window.location.reload(), 3000);
    };

    // 连接错误时处理
    newSocket.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    // 组件卸载时关闭连接
    return () => {
      newSocket.close();
    };
  }, [path]);

  /**
   * 发送消息到WebSocket服务器
   * @param {any} data - 要发送的数据
   */
  const sendMessage = (data) => {
    if (socket && isConnected) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        socket.send(message);
      } catch (error) {
        console.error('发送WebSocket消息失败:', error);
      }
    } else {
      console.warn('无法发送消息，WebSocket未连接');
    }
  };

  return { socket, isConnected, lastMessage, sendMessage };
};

// 默认导出WebSocket服务
export default useWebSocket;