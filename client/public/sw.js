// Detect if running in development mode
const isDev = typeof navigator !== 'undefined' && 
              (self.location.hostname === 'localhost' || 
               self.location.hostname === '127.0.0.1');

const OFFLINE_CACHE = 'rotihai-offline-v1';

// Install event - skip waiting to activate immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE)
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== OFFLINE_CACHE)
          .map(cacheName => {
            console.log('🗑️ Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - NETWORK FIRST for dev, CACHE FIRST for production
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

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
}
