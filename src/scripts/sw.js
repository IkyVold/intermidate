import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { 
  NetworkFirst, 
  CacheFirst, 
  StaleWhileRevalidate,
  NetworkOnly 
} from 'workbox-strategies';
import CONFIG from './config';

// Service Worker version for cache management
const SW_VERSION = 'story-app-v2.1';
const CACHE_NAME = `story-app-cache-${SW_VERSION}`;

// Precache static assets
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

// Enhanced runtime caching strategies

// Google Fonts with expiration
registerRoute(
  ({ url }) => {
    return (
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com'
    );
  },
  new CacheFirst({
    cacheName: 'google-fonts-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// CDN resources with improved caching
registerRoute(
  ({ url }) => {
    return (
      url.origin === 'https://cdnjs.cloudflare.com' ||
      url.origin.includes('fontawesome') ||
      url.origin.includes('jsdelivr') ||
      url.origin.includes('unpkg')
    );
  },
  new CacheFirst({
    cacheName: 'cdn-resources-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Avatar API with better error handling
registerRoute(
  ({ url }) => {
    return url.origin === 'https://ui-avatars.com' || 
           url.origin.includes('avatar') ||
           url.origin.includes('gravatar');
  },
  new StaleWhileRevalidate({
    cacheName: 'user-avatars-v2',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
      }),
    ],
  })
);

// API requests with background sync
const bgSyncPlugin = new BackgroundSyncPlugin('story-api-queue', {
  maxRetentionTime: 24 * 60, // Retry for 24 hours
});

registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(CONFIG.BASE_URL);
    return baseUrl.origin === url.origin && 
           request.destination !== 'image' &&
           (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE');
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  })
);

// GET API requests
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(CONFIG.BASE_URL);
    return baseUrl.origin === url.origin && 
           request.destination !== 'image' &&
           request.method === 'GET';
  },
  new NetworkFirst({
    cacheName: 'story-api-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
  })
);

// Image caching with size limits
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(CONFIG.BASE_URL);
    return (baseUrl.origin === url.origin && request.destination === 'image') ||
           request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'images-cache-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Map tiles caching
registerRoute(
  ({ url }) => {
    return url.origin.includes('maptiler') ||
           url.origin.includes('openstreetmap') ||
           url.origin.includes('mapbox');
  },
  new CacheFirst({
    cacheName: 'map-tiles-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Enhanced installation and activation
self.addEventListener('install', event => {
  console.log(`[SW] Installing version ${SW_VERSION}`);
  
  // Enhanced install process
  event.waitUntil(
    (async () => {
      // Pre-warm critical resources
      const cache = await caches.open(CACHE_NAME);
      const criticalUrls = [
        '/',
        '/dashboard',
        '/offline.html'
      ];
      
      try {
        await cache.addAll(criticalUrls);
        console.log('[SW] Critical resources cached');
      } catch (error) {
        console.warn('[SW] Failed to cache some critical resources:', error);
      }
      
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  console.log(`[SW] Activating version ${SW_VERSION}`);
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('story-app') && name !== CACHE_NAME
      );
      
      await Promise.all(
        oldCaches.map(cacheName => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      
      // Take control of all pages
      await self.clients.claim();
      console.log('[SW] Service Worker now controls all pages');
      
      // Notify clients about update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: SW_VERSION
        });
      });
    })()
  );
});

// Enhanced push notification handling
self.addEventListener('push', event => {
  console.log('[SW] Push event received:', event);

  // Default notification configuration
  let notificationData = {
    title: 'Story App',
    options: {
      body: 'Anda memiliki notifikasi baru dari Story App',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `story-notification-${Date.now()}`,
      requireInteraction: false,
      renotify: true,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      actions: [
        {
          action: 'view',
          title: 'Lihat Detail',
          icon: '/icons/view-icon.png',
        },
        {
          action: 'dismiss',
          title: 'Tutup',
          icon: '/icons/close-icon.png',
        },
      ],
      data: {
        timestamp: Date.now(),
        url: '/dashboard',
        source: 'push-notification'
      },
    },
  };

  // Process push data
  if (event.data) {
    try {
      const textData = event.data.text();
      console.log('[SW] Push data received:', textData);

      let parsedData;
      try {
        parsedData = JSON.parse(textData);
        console.log('[SW] Parsed push data:', parsedData);

        // Merge with default data
        notificationData.title = parsedData.title || notificationData.title;
        notificationData.options.body = parsedData.body || 
                                       parsedData.message || 
                                       notificationData.options.body;

        // Handle different notification types
        if (parsedData.type) {
          notificationData.options.data.type = parsedData.type;
          
          switch (parsedData.type) {
            case 'new-story':
              notificationData.options.icon = '/icons/story-icon.png';
              break;
            case 'comment':
              notificationData.options.icon = '/icons/comment-icon.png';
              break;
            case 'like':
              notificationData.options.icon = '/icons/like-icon.png';
              break;
          }
        }

        // Set target URL
        if (parsedData.url) {
          notificationData.options.data.url = parsedData.url;
        }

        // Additional data
        if (parsedData.storyId) {
          notificationData.options.data.storyId = parsedData.storyId;
        }

        if (parsedData.userId) {
          notificationData.options.data.userId = parsedData.userId;
        }

      } catch (jsonError) {
        console.log('[SW] Using text data as notification body');
        notificationData.options.body = textData;
      }
    } catch (error) {
      console.error('[SW] Error processing push data:', error);
    }
  }

  console.log('[SW] Showing notification:', notificationData);

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationData.options)
      .then(() => {
        console.log('[SW] Notification displayed successfully');
        
        // Track notification display
        return fetch('/api/analytics/notification-shown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: Date.now(),
            type: notificationData.options.data.type || 'general'
          })
        }).catch(() => {}); // Silent fail for analytics
      })
      .catch(error => {
        console.error('[SW] Error showing notification:', error);
      })
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Handle different actions
  if (action === 'dismiss') {
    console.log('[SW] Notification dismissed');
    return;
  }

  // Determine target URL
  let targetUrl = data.url || '/dashboard';
  
  if (data.storyId) {
    targetUrl = `/story/${data.storyId}`;
  }

  console.log('[SW] Opening URL:', targetUrl);

  event.waitUntil(
    (async () => {
      try {
        // Track notification click
        await fetch('/api/analytics/notification-clicked', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: action || 'view',
            type: data.type || 'general',
            timestamp: Date.now()
          })
        }).catch(() => {}); // Silent fail

        // Find existing client or open new window
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });

        console.log('[SW] Found clients:', clientList.length);

        // Try to focus existing window with matching URL
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === targetUrl && 'focus' in client) {
            console.log('[SW] Focusing existing client');
            return client.focus();
          }
        }

        // Try to navigate existing dashboard client
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'navigate' in client) {
            console.log('[SW] Navigating existing client');
            client.navigate(targetUrl);
            return client.focus();
          }
        }

        // Open new window
        if (self.clients.openWindow) {
          console.log('[SW] Opening new window');
          return self.clients.openWindow(targetUrl);
        }

      } catch (error) {
        console.error('[SW] Error handling notification click:', error);
      }
    })()
  );
});

// Enhanced fetch handling with offline support
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle manifest requests
  if (request.url.includes('app.webmanifest')) {
    event.respondWith(fetch(request, { cache: 'reload' }));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          return response;
        } catch (error) {
          console.log('[SW] Network failed, serving offline page');
          const cache = await caches.open(CACHE_NAME);
          return cache.match('/offline.html') || 
                 new Response('Offline - Please check your connection', {
                   status: 503,
                   statusText: 'Service Unavailable'
                 });
        }
      })()
    );
    return;
  }

  // Handle API requests with offline queue
  const baseUrl = new URL(CONFIG.BASE_URL);
  if (url.origin === baseUrl.origin && request.method !== 'GET') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (error) {
          // Queue for background sync
          console.log('[SW] Queueing failed request for background sync');
          throw error; // Let background sync handle it
        }
      })()
    );
  }
});

// Enhanced message handling
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);

  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: SW_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        (async () => {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          event.ports[0].postMessage({ success: true });
        })()
      );
      break;
      
    case 'PRELOAD_ROUTE':
      if (payload?.url) {
        event.waitUntil(
          (async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
              await cache.add(payload.url);
              console.log('[SW] Preloaded route:', payload.url);
            } catch (error) {
              console.warn('[SW] Failed to preload route:', error);
            }
          })()
        );
      }
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Background sync for failed requests
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'story-api-queue') {
    event.waitUntil(
      (async () => {
        console.log('[SW] Processing background sync queue');
        // The BackgroundSyncPlugin will handle the actual retry logic
      })()
    );
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log(`[SW] Service Worker ${SW_VERSION} loaded successfully`);