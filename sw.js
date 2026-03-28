const CACHE_NAME = 'mr-pinball-v2';
const FILES_TO_CACHE = [
  '/Glitchy/pinball.html',
  '/Glitchy/chaos.mp3',
  '/Glitchy/mr-pb-favicon.jpeg',
  '/Glitchy/ball.png',
  '/Glitchy/share-app.jpeg',
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js'
];

const EXTERNAL_FILES = [
  'https://maximumreality.xyz/intro.MP4'  // network-only fallback
];

// Install SW and cache assets
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache local files
    for (let i = 0; i < FILES_TO_CACHE.length; i++) {
      try { await cache.add(FILES_TO_CACHE[i]); } 
      catch (e) { console.warn('Failed to cache', FILES_TO_CACHE[i]); }
      notifyProgress(i + 1, FILES_TO_CACHE.length + EXTERNAL_FILES.length);
    }
    // External files are optional, network-first
    for (let i = 0; i < EXTERNAL_FILES.length; i++) {
      try { await fetch(EXTERNAL_FILES[i]); } 
      catch (e) { console.warn('Cannot fetch external file', EXTERNAL_FILES[i]); }
      notifyProgress(FILES_TO_CACHE.length + i + 1, FILES_TO_CACHE.length + EXTERNAL_FILES.length);
    }
    self.skipWaiting();
  })());
});

// Activate SW and remove old caches
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key !== CACHE_NAME) await caches.delete(key);
    }
    self.clients.claim();
  })());
});

// Fetch handler: network-first, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    // Serve external MP4 from network if possible
    if (EXTERNAL_FILES.includes(event.request.url)) {
      try { return await fetch(event.request); } 
      catch (err) { return caches.match(event.request); }
    }
    // Local files: cache-first, then network
    const cached = await caches.match(event.request);
    return cached || fetch(event.request);
  })());
});

// Helper to notify clients of progress
async function notifyProgress(loaded, total) {
  const clientsList = await self.clients.matchAll();
  clientsList.forEach(client => {
    client.postMessage({
      type: 'CACHE_PROGRESS',
      loaded,
      total
    });
  });
}
