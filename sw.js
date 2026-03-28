const CACHE_NAME = 'mr-pinball-v1';
const FILES_TO_CACHE = [
  '/Glitchy/pinball.html',
  '/Glitchy/manifest.json',
  '/Glitchy/chaos.mp3',
  '/Glitchy/intro.MP4',
  '/Glitchy/mr-pb-favicon.jpeg',
  '/Glitchy/share-app.jpeg',
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js'
];

// Install SW and cache files with progress
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (let i = 0; i < FILES_TO_CACHE.length; i++) {
        try {
          await cache.add(FILES_TO_CACHE[i]);
          console.log(`[SW] Cached: ${FILES_TO_CACHE[i]} (${i + 1}/${FILES_TO_CACHE.length})`);
          // Send progress to clients
          const clientsList = await self.clients.matchAll();
          clientsList.forEach(client => {
            client.postMessage({
              type: 'CACHE_PROGRESS',
              loaded: i + 1,
              total: FILES_TO_CACHE.length
            });
          });
        } catch (e) {
          console.warn('[SW] Cache failed for', FILES_TO_CACHE[i], e);
        }
      }
    })()
  );
});

// Activate SW and clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', key);
          await caches.delete(key);
        }
      }
      await self.clients.claim();
    })()
  );
});

// Fetch handler with cache-first strategy and fallback for images
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        // Only cache valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for images
        if (event.request.destination === 'image') {
          return caches.match('/Glitchy/share-app.jpeg');
        }
      });
    })
  );
});
