/**
 * PWA工具函数
 * 处理Service Worker注册、安装提示、离线检测等功能
 */

// Service Worker注册
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 新版本可用
                  showUpdateAvailable();
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// 显示更新可用提示
const showUpdateAvailable = () => {
  if (window.confirm('发现新版本，是否立即更新？')) {
    window.location.reload();
  }
};

// PWA安装提示
let deferredPrompt;

export const initPWAInstall = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt triggered');
    // 阻止默认的安装提示
    e.preventDefault();
    // 保存事件以便后续使用
    deferredPrompt = e;
    // 显示自定义安装按钮
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    hideInstallButton();
    // 可以在这里添加安装成功的分析事件
  });
};

// 显示安装按钮
const showInstallButton = () => {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'block';
  } else {
    // 动态创建安装按钮
    createInstallButton();
  }
};

// 隐藏安装按钮
const hideInstallButton = () => {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
};

// 创建安装按钮
const createInstallButton = () => {
  const button = document.createElement('button');
  button.id = 'pwa-install-button';
  button.innerHTML = '📱 安装应用';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    background: #1976d2;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;
  
  button.addEventListener('click', installPWA);
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
  
  document.body.appendChild(button);
};

// 安装PWA
export const installPWA = async () => {
  if (deferredPrompt) {
    // 显示安装提示
    deferredPrompt.prompt();
    
    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // 清除保存的事件
    deferredPrompt = null;
    hideInstallButton();
  }
};

// 检查是否已安装
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// 离线状态检测
export const initOfflineDetection = () => {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    const event = new CustomEvent('networkStatusChange', {
      detail: { isOnline }
    });
    window.dispatchEvent(event);
    
    // 显示离线提示
    if (!isOnline) {
      showOfflineNotification();
    } else {
      hideOfflineNotification();
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // 初始状态检查
  updateOnlineStatus();
};

// 显示离线通知
const showOfflineNotification = () => {
  let notification = document.getElementById('offline-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'offline-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f44336;
        color: white;
        text-align: center;
        padding: 10px;
        z-index: 9999;
        font-size: 14px;
      ">
        🔌 网络连接已断开，当前处于离线模式
      </div>
    `;
    document.body.appendChild(notification);
  }
};

// 隐藏离线通知
const hideOfflineNotification = () => {
  const notification = document.getElementById('offline-notification');
  if (notification) {
    notification.remove();
  }
};

// 推送通知权限请求
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  }
  return false;
};

// 发送本地通知
export const sendLocalNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/favicon.ico',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    // 自动关闭
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    return notification;
  }
};

// 订阅推送通知
export const subscribeToPushNotifications = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });
      
      console.log('Push subscription:', subscription);
      
      // 发送订阅信息到服务器
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }
};

// VAPID密钥转换
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// 离线数据存储
export const storeOfflineData = async (data) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offlineData'], 'readwrite');
    const store = transaction.objectStore('offlineData');
    await store.add({
      ...data,
      timestamp: Date.now(),
      synced: false
    });
    console.log('Data stored offline');
  } catch (error) {
    console.error('Failed to store offline data:', error);
  }
};

// 获取离线数据
export const getOfflineData = async () => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offlineData'], 'readonly');
    const store = transaction.objectStore('offlineData');
    return await store.getAll();
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return [];
  }
};

// 打开IndexedDB
const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SmartParkDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// 应用更新检查
export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.update();
  }
};

// 获取应用信息
export const getAppInfo = () => {
  return {
    isOnline: navigator.onLine,
    isPWA: isPWAInstalled(),
    hasServiceWorker: 'serviceWorker' in navigator,
    hasNotifications: 'Notification' in window,
    hasPushManager: 'PushManager' in window,
    notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported'
  };
};

// 初始化所有PWA功能
export const initPWA = () => {
  registerServiceWorker();
  initPWAInstall();
  initOfflineDetection();
  
  // 请求通知权限（可选）
  setTimeout(() => {
    requestNotificationPermission();
  }, 3000);
};

export default {
  registerServiceWorker,
  initPWAInstall,
  installPWA,
  isPWAInstalled,
  initOfflineDetection,
  requestNotificationPermission,
  sendLocalNotification,
  subscribeToPushNotifications,
  storeOfflineData,
  getOfflineData,
  checkForUpdates,
  getAppInfo,
  initPWA
};