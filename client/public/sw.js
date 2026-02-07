// Service Worker version - increment this to force cache invalidation
const SW_VERSION = 'v1-' + new Date().toISOString().split('T')[0]; // Changes daily
const OFFLINE_CACHE = 'rotihai-offline-' + SW_VERSION;

// Install event - skip waiting to activate immediately
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing, version:', SW_VERSION);
  event.waitUntil(
    caches.open(OFFLINE_CACHE)
      .then(() => {
        console.log('✅ Cache storage ready');
        // Force this SW to become active immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches and take control
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating, version:', SW_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete all old version caches
            const isOldCache = !cacheName.includes(SW_VERSION);
            if (isOldCache) {
              console.log('🗑️ Clearing old cache:', cacheName);
            }
            return isOldCache;
          })
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('✅ Old caches cleared, taking control...');
      return self.clients.claim(); // Take control of all clients immediately
    })
  );
});

// Fetch event - NETWORK FIRST for dev, CACHE FIRST for production
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Detect if running in development mode
  const isDev = self.location.hostname === 'localhost' || 
                self.location.hostname === '127.0.0.1';

  // DEVELOPMENT: Network-first strategy (always fresh)
  if (isDev) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache non-API, non-HTML for offline support
          if (response && response.status === 200 &&
              !event.request.url.includes('/api/') && 
              !event.request.url.includes('.html') &&
              !event.request.url.includes('?')) {
            const responseToCache = response.clone();
            caches.open(OFFLINE_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache as fallback
          return caches.match(event.request)
            .then(response => {
              if (response) return response;
              return new Response('Offline - Service unavailable', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain' })
              });
            });
        })
    );
    return;
  }

  // PRODUCTION: Cache-first for static assets, network-first for API
  if (event.request.url.includes('/api/')) {
    // API calls: network-first
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: new Headers({ 'Content-Type': 'application/json' })
          });
        })
    );
  } else if (event.request.url.includes('.html') || event.request.url.endsWith('/')) {
    // HTML: always fresh from network
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(() => caches.match(event.request))
    );
  } else {
    // Static assets: cache-first (they're hashed in build)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          return fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(OFFLINE_CACHE).then(cache => {
                  cache.put(event.request, responseToCache);
                });
              }
              return response;
            });
        })
        .catch(() => {
          return new Response('Offline', { status: 503 });
        })
    );
  }
});

// Background sync for orders
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    const response = await fetch('/api/orders');
    if (response.ok) {
      // Show notification
      self.registration.showNotification('RotiHai', {
        body: 'Your orders have been synced',
        icon: '/icon-192.png',
      });
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
};

// 🔔 Handle incoming push notifications (for offline delivery)
self.addEventListener('push', event => {
  console.log('📬 Push notification received:', event);
  
  try {
    let notificationData = {
      title: 'RotiHai',
      body: 'New notification',
      icon: '/icon-192.png',
      badge: '/icon-96x96.png',
      tag: 'rotihai-notification',
      requireInteraction: false,
    };

    // Parse push event data if available
    if (event.data) {
      try {
        const data = event.data.json();
        notificationData = {
          ...notificationData,
          ...data,
        };
      } catch (e) {
        // If not JSON, use as body text
        notificationData.body = event.data.text();
      }
    }

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
        data: notificationData.data || {},
      })
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('RotiHai', {
        body: 'New notification received',
        icon: '/icon-192.png',
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked:', event);
  event.notification.close();

  // Open app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Try to focus existing window
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
