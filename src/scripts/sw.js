// Service Worker for Push Notifications and Caching
const CACHE_NAME = 'story-app-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/api.js',
  '/config.js',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS.filter(url => url !== '/'));
      })
      .catch((error) => {
        console.error('Error caching static resources:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            throw error;
          });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Story App',
    body: 'You have a new story notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'story-notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: false,
      silent: false,
      renotify: true,
      actions: [
        { action: 'view', title: 'View Story', icon: '/icon-192x192.png' },
        { action: 'close', title: 'Close', icon: '/icon-192x192.png' }
      ]
    }
  );

  event.waitUntil(notificationPromise);
});

// Notification click event - handle user interaction with notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};
  
  if (action === 'close') {
    return;
  }

  const urlToOpen = notificationData.url || '/';
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    const matchingClient = windowClients.find(client => client.url === new URL(urlToOpen, self.location.origin).href);
    return matchingClient ? matchingClient.focus() : clients.openWindow(urlToOpen);
  });

  event.waitUntil(promiseChain);
});

// Notification close event - handle when user dismisses notification
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Background sync event (if you want to implement offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'story-upload') {
    event.waitUntil(handleBackgroundStoryUpload());
  }
});

async function handleBackgroundStoryUpload() {
  try {
    console.log('Handling background story upload...');
  } catch (error) {
    console.error('Error in background story upload:', error);
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Error event - handle service worker errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Unhandled rejection event
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled promise rejection:', event.reason);
  event.preventDefault();
});