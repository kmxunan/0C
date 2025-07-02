/**
 * Service Worker for Smart Park Energy Management System
 * 提供离线缓存、推送通知等PWA功能
 */

const CACHE_NAME = 'smart-park-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// 安装事件 - 缓存资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 只处理GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  // API请求策略：网络优先，缓存备用
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 如果网络请求成功，缓存响应
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时，尝试从缓存获取
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // 如果缓存中也没有，返回离线页面或默认响应
            return new Response(
              JSON.stringify({ 
                error: '网络连接失败，请检查网络设置', 
                offline: true 
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // 静态资源策略：缓存优先，网络备用
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          // 检查响应是否有效
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 缓存新的响应
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // 如果是导航请求且失败，返回离线页面
        if (event.request.destination === 'document') {
          return caches.match('/offline.html') || 
                 new Response('<h1>离线模式</h1><p>请检查网络连接</p>', {
                   headers: { 'Content-Type': 'text/html' }
                 });
        }
      })
  );
});

// 推送通知事件
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: '智慧园区通知',
    body: '您有新的系统消息',
    icon: '/logo192.png',
    badge: '/favicon.ico',
    tag: 'smart-park-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: '查看详情',
        icon: '/logo192.png'
      },
      {
        action: 'dismiss',
        title: '忽略',
        icon: '/logo192.png'
      }
    ]
  };

  // 如果推送包含数据，解析并使用
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Service Worker: Error parsing push data', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    // 打开应用
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // 忽略通知
    console.log('Service Worker: Notification dismissed');
  } else {
    // 默认行为：打开应用
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 后台同步事件
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      syncData()
    );
  }
});

// 同步数据函数
async function syncData() {
  try {
    console.log('Service Worker: Syncing data...');
    
    // 获取离线时存储的数据
    const cache = await caches.open(CACHE_NAME);
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // 尝试上传离线数据
      for (const data of offlineData) {
        try {
          await fetch('/api/data/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
        } catch (error) {
          console.error('Service Worker: Failed to sync data item', error);
        }
      }
      
      // 清除已同步的离线数据
      await clearOfflineData();
      console.log('Service Worker: Data sync completed');
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// 获取离线数据
async function getOfflineData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offlineData'], 'readonly');
    const store = transaction.objectStore('offlineData');
    return await store.getAll();
  } catch (error) {
    console.error('Service Worker: Failed to get offline data', error);
    return [];
  }
}

// 清除离线数据
async function clearOfflineData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offlineData'], 'readwrite');
    const store = transaction.objectStore('offlineData');
    await store.clear();
  } catch (error) {
    console.error('Service Worker: Failed to clear offline data', error);
  }
}

// 打开IndexedDB
function openIndexedDB() {
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
}

// 消息处理
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// 错误处理
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error occurred', event.error);
});

// 未处理的Promise拒绝
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
  event.preventDefault();
});