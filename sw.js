const CACHE_NAME = 'mr-pinball-v1';
const ASSETS_TO_CACHE = [
  '/Glitchy/pinball.html',
  '/Glitchy/manifest.json',
  'https://maximumreality.github.io/Glitchy/share-app.jpeg',
  'https://maximumreality.github.io/Glitchy/mr-pb-favicon.jpeg',
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js',
  'https://maximumreality.github.io/Glitchy/chaos.mp3',
  'https://maximumreality.xyz/intro.MP4'
];

// Install SW and pre-cache core assets with progress reporting
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      let loaded = 0;
      for (const url of ASSETS_TO_CACHE) {
        try {
          await cache.add(url);
          loaded++;
          // Send progress to clients
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'CACHE_PROGRESS', loaded, total: ASSETS_TO_CACHE.length });
            });
          });
        } catch (err) {
          console.warn('[SW] Failed to cache', url, err);
        }
      }
      self.skipWaiting();
    })
  );
});

// Activate SW and remove old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch handler with cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      }).catch(() => {
        // Optional fallback
        if (event.request.destination === 'image') {
          return caches.match('https://maximumreality.github.io/Glitchy/share-app.jpeg');
        }
      });
    })
  );
});
