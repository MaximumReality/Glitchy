const CACHE_NAME = 'mr-pinball-v2';

// Use relative paths so it works inside the /Glitchy/ folder correctly
const FILES_TO_CACHE = [
  './',
  './pinball.html',
  './chaos.mp3',
  './mr-pb-favicon.jpeg',
  './ball.png',
  './share-app.jpeg',
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js'
];

const EXTERNAL_FILES = [
  'https://maximumreality.xyz/intro.MP4'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const total = FILES_TO_CACHE.length + EXTERNAL_FILES.length;
    let loaded = 0;

    // Cache local files one by one to track progress
    for (const url of FILES_TO_CACHE) {
      try {
        await cache.add(url);
      } catch (e) {
        console.warn('Failed to cache:', url);
      }
      loaded++;
      await notifyProgress(loaded, total);
    }

    // Try external files
    for (const url of EXTERNAL_FILES) {
      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch (e) {
        console.warn('External file skipped:', url);
      }
      loaded++;
      await notifyProgress(loaded, total);
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});

async function notifyProgress(loaded, total) {
  // includeUncontrolled is the key to fixing the 0% bug!
  const clientsList = await self.clients.matchAll({includeUncontrolled: true, type: 'window'});
  clientsList.forEach(client => {
    client.postMessage({ type: 'CACHE_PROGRESS', loaded, total });
  });
}
