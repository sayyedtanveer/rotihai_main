// ✅ CRITICAL: Service Worker version - changes on EVERY deployment to force cache invalidation
// Using build timestamp: this MUST BE UPDATED by the build system or server on deployment
// Format: v{major}-{ISO-date-string}
const SW_VERSION = 'v1-' + new Date().toISOString().replace(/[:.]/g, '-');
const OFFLINE_CACHE = 'rotihai-offline-' + SW_VERSION;

// ✅ Aggressive install: Clear ALL caches immediately and skip waiting
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing, version:', SW_VERSION);
  event.waitUntil(
    // IMPORTANT: Delete ALL old caches from previous versions
    caches.keys().then(cacheNames => {
      console.log('📋 Found caches:', cacheNames);
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete everything - we'll recreate fresh cache
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Create fresh cache for this version
      return caches.open(OFFLINE_CACHE);
    }).then(() => {
      console.log('✅ Cache cleared and new cache ready');
      // CRITICAL: Skip waiting to activate immediately without restart
      return self.skipWaiting();
    })
  );
});

// ✅ Activate immediately - take control of all pages without waiting for page reload
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating, version:', SW_VERSION);
  event.waitUntil(
    // Final cleanup of any remaining old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !cacheName.includes(SW_VERSION))
          .map(cacheName => {
            console.log('🗑️ Cleaning old cache on activate:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control immediately - this ensures new SW controls all pages
      console.log('✅ Taking control of all clients');
      return self.clients.claim();
    })
  );
});

// ✅ Fetch strategy: Network-FIRST, with careful cache handling
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;
  const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

  // ✅ NETWORK-FIRST for everything in development
  if (isDev) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache GET responses that are successful
          if (response && response.status === 200 && !url.includes('/api/')) {
            const responseToCache = response.clone();
            caches.open(OFFLINE_CACHE)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.log('Cache put failed:', err));
          }
          return response;
        })
        .catch(error => {
          console.log('Fetch failed, trying cache:', url, error);
          return caches.match(event.request)
            .then(response => {
              if (response) {
                console.log('Returning from cache:', url);
                return response;
              }
              // Offline - return error page
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

  // ✅ PRODUCTION: Smart caching strategy
  
  // 1. API calls: Always network-first
  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          console.log('✅ API response:', url);
          return response;
        })
        .catch(() => {
          console.log('❌ API offline:', url);
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: new Headers({ 'Content-Type': 'application/json' })
          });
        })
    );
    return;
  }

  // 2. HTML files (including root '/'): NETWORK-FIRST with cache fallback
  if (url.includes('.html') || url.endsWith('/')) {
    event.respondWith(
      // Try network first
      fetch(event.request)
        .then(response => {
          console.log('✅ HTML from network:', url);
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(OFFLINE_CACHE)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.log('Failed to cache HTML:', err));
          }
          return response;
        })
        .catch(error => {
          console.log('❌ HTML fetch failed, trying cache:', url, error);
          // Fall back to cache if network fails
          return caches.match(event.request)
            .then(response => {
              if (response) {
                console.log('📦 HTML from cache:', url);
                return response;
              }
              // No cache available
              return new Response('Page not available offline', {
                status: 503,
                headers: new Headers({ 'Content-Type': 'text/html' })
              });
            });
        })
    );
    return;
  }

  // 3. JavaScript & CSS files: NETWORK-FIRST (hashed names ensure new versions on deploy)
  if (url.endsWith('.js') || url.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          console.log('✅ JS/CSS from network:', url);
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(OFFLINE_CACHE)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.log('Failed to cache JS/CSS:', err));
          }
          return response;
        })
        .catch(error => {
          console.log('❌ JS/CSS fetch failed:', url, error);
          // Try cache as fallback
          return caches.match(event.request)
            .then(response => {
              if (response) {
                console.log('📦 JS/CSS from cache:', url);
                return response;
              }
              // Return error - missing critical resource
              return new Response('Resource not available', { status: 404 });
            });
        })
    );
    return;
  }

  // 4. Other static assets (images, fonts, manifests): CACHE-FIRST
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('📦 Asset from cache:', url);
          return response;
        }
        return fetch(event.request)
          .then(response => {
            console.log('✅ Asset from network:', url);
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(OFFLINE_CACHE)
                .then(cache => cache.put(event.request, responseToCache))
                .catch(err => console.log('Failed to cache asset:', err));
            }
            return response;
          })
          .catch(() => {
            console.log('❌ Asset offline:', url);
            return new Response('Asset not available offline', { status: 503 });
          });
      })
  );
});

// ✅ Background sync for offline orders
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    console.log('🔄 Syncing orders...');
    const response = await fetch('/api/orders');
    if (response.ok) {
      self.registration.showNotification('RotiHai', {
        body: 'Your orders have been synced',
        icon: '/icon-192.png',
      });
      console.log('✅ Orders synced');
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// ✅ Handle incoming push notifications
self.addEventListener('push', event => {
  console.log('📬 Push notification received');
  
  try {
    let notificationData = {
      title: 'RotiHai',
      body: 'New notification',
      icon: '/icon-192.png',
      badge: '/icon-96x96.png',
      tag: 'rotihai-notification',
      requireInteraction: false,
    };

    if (event.data) {
      try {
        const data = event.data.json();
        notificationData = { ...notificationData, ...data };
      } catch (e) {
        notificationData.body = event.data.text();
      }
    }

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
    event.waitUntil(
      self.registration.showNotification('RotiHai', {
        body: 'New notification received',
        icon: '/icon-192.png',
      })
    );
  }
});

// ✅ Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
