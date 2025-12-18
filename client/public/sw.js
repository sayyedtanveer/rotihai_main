const CACHE_NAME = 'rotihai-v3-' + new Date().getTime();
const STATIC_CACHE = 'rotihai-static-v3';
const urlsToCache = [
  '/',
  '/favicon.png',
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - Aggressively clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete everything except current caches
            return cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE;
          })
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first for everything, cache for static only
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // ALWAYS fetch HTML fresh from network (never use cache)
  if (event.request.url.endsWith('/index.html') || event.request.url.endsWith('/') || event.request.url.includes('?')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Don't cache HTML
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Skip API calls, let them go through network
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response('Offline - API temporarily unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        })
    );
    return;
  }

  // Cache only static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => {
        // Offline fallback for resources
        return new Response('Offline', { status: 503 });
      })
  );
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
