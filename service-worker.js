// TLCC Connect Service Worker - Industry Standard
// Version: 2.0.0

const APP_VERSION = '2.0.0';
const CACHE_NAME = `tlcc-connect-v${APP_VERSION}`;
const BASE_PATH = '/tlccconnect';

// Runtime cache name
const RUNTIME_CACHE = `tlcc-runtime-v${APP_VERSION}`;

// Core files to cache on install (App Shell)
const PRECACHE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/tlccconnect.css`,
  `${BASE_PATH}/tlccconnect.js`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`
];

// External resources to cache
const EXTERNAL_CACHE = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// ============================================
// INSTALL EVENT - Cache App Shell
// ============================================
self.addEventListener('install', event => {
  console.log(`[SW] Installing v${APP_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] App shell cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(err => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

// ============================================
// ACTIVATE EVENT - Clean Old Caches
// ============================================
self.addEventListener('activate', event => {
  console.log(`[SW] Activating v${APP_VERSION}`);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old versions
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// ============================================
// FETCH EVENT - Network First Strategy
// ============================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except allowed CDNs)
  if (url.origin !== location.origin && !isAllowedOrigin(url.origin)) {
    return;
  }
  
  // Handle Supabase API requests (Network Only)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Handle app assets (Network First, fallback to Cache)
  if (url.pathname.startsWith(BASE_PATH)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Handle external CDN resources (Cache First)
  if (isAllowedOrigin(url.origin)) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

// ============================================
// NETWORK FIRST STRATEGY
// Try network, fallback to cache, fallback to offline page
// ============================================
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(`${BASE_PATH}/index.html`);
      return offlineResponse || new Response('Offline', { 
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

// ============================================
// CACHE FIRST STRATEGY
// For static assets that rarely change
// ============================================
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    throw error;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function isAllowedOrigin(origin) {
  const allowedOrigins = [
    'https://cdn.jsdelivr.net',
    'https://cdnjs.cloudflare.com'
  ];
  return allowedOrigins.includes(origin);
}

// ============================================
// BACKGROUND SYNC (Optional - for offline forms)
// ============================================
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts());
  }
});

async function syncContacts() {
  console.log('[SW] Syncing offline contacts...');
  // Implementation for syncing offline data
  // This would retrieve data from IndexedDB and sync to Supabase
}

// ============================================
// PUSH NOTIFICATIONS (Future Enhancement)
// ============================================
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: `${BASE_PATH}/icons/icon-192x192.png`,
    badge: `${BASE_PATH}/icons/icon-72x72.png`,
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('TLCC Connect', options)
  );
});

// ============================================
// MESSAGE HANDLER (For client communication)
// ============================================
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});

// ============================================
// ERROR HANDLER
// ============================================
self.addEventListener('error', event => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log(`[SW] Service Worker v${APP_VERSION} loaded`);
