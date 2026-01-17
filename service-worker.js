const CACHE_NAME = 'tlcc-connect-v2';
const BASE_URL = '/tlccconnect/';

const urlsToCache = [
  BASE_URL,
  BASE_URL + 'index.html',
  BASE_URL + 'tlccconnect.css',
  BASE_URL + 'tlccconnect.js',
  BASE_URL + 'manifest.json'
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('Opened cache');

      for (const url of urlsToCache) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            await cache.put(url, res.clone());
          }
        } catch (e) {
          console.warn('Cache skipped:', url);
        }
      }
    })()
  );

  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// FETCH
self.addEventListener('fetch', event => {
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
