// Service Worker SIMPLE - Sin auto-updates, sin notificaciones
const CACHE_NAME = 'vyt-simple-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/principal.html',
  '/certamenes.html',
  '/ranking.html',
  '/src/navigation.js',
  '/src/navigation-styles.css'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
