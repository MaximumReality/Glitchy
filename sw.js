const CACHE_NAME = 'mr-pinball-v1';
const ASSETS_TO_CACHE = [
  '/Glitchy/pinball.html',
  '/Glitchy/manifest.json',
  'https://maximumreality.github.io/Glitchy/share-app.jpeg',
  'https://maximumreality.github.io/Glitchy/mr-pb-favicon.jpeg',
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js',
  'https://maximumreality.github.io/Glitchy/chaos.mp3',
  'https://maximumreality.xyz/intro.MP4',
  '/Glitchy/style.css' // optional if you separate CSS
];

// Install SW and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate SW and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch: respond with cache first, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => {
        // Optional: fallback for offline, e.g., a placeholder
        return caches.match('/Glitchy/share-app.jpeg');
      })
  );
});
