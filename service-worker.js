const CACHE_NAME = 'tlcc-connect-v1';
const BASE_URL = '/tlccconnect/';

const urlsToCache = [
  '/tlccconnect/',
  '/tlccconnect/index.html',
  '/tlccconnect/tlccconnect.css',
  '/tlccconnect/tlccconnect.js',
  '/tlccconnect/manifest.json',
  '/tlccconnect/icons/Icon-192x192.png',
  '/tlccconnect/icons/Icon-512x512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('Opened cache');

      for (const url of urlsToCache) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
          } else {
            console.warn('Skipping cache (not OK):', url);
          }
        } catch (err) {
          console.warn('Skipping cache (failed):', url);
        }
      }
    })
  );

  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', event => {
  // Only handle GET requests inside this repo
  if (
    !event.request.url.includes(BASE_URL) ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() =>
        caches.match(event.request).then(response => {
          return response || caches.match('/tlccconnect/');
        })
      )
  );
});

// Background Sync (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts());
  }
});

async function syncContacts() {
  console.log('Syncing contacts...');
}
