// Service Worker OPTIMIZADO - Estrategias de cache avanzadas
const CACHE_NAME = 'vyt-optimized-v5';
const CACHE_STATIC = 'vyt-static-v5';
const CACHE_DYNAMIC = 'vyt-dynamic-v5';
const CACHE_IMAGES = 'vyt-images-v5';

const urlsToCache = [
  '/',
  '/index.html',
  '/principal.html',
  '/certamenes.html',
  '/ranking.html',
  '/src/navigation.js',
  '/src/navigation-styles.css',
  '/src/lazy-loading.js',
  '/design-tokens.css',
  '/firebase-config.js'
];

// Instalación: precachear recursos críticos
self.addEventListener('install', event => {
  self.skipWaitng();
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(urlsToCache))
  );
});

// Activación: limpiar caches antiguas
self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== CACHE_STATIC && 
              cacheName !== CACHE_DYNAMIC && 
              cacheName !== CACHE_IMAGES) {
            console.log('🗑️ Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: estrategias de cache inteligentes
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // ESTRATEGIA 1: Cache-First para assets estáticos (CSS, JS, fonts)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'font' ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(request).then(response => {
          return caches.open(CACHE_STATIC).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // ESTRATEGIA 2: Stale-While-Revalidate para imágenes
  if (request.destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_IMAGES).then(cache => {
        return cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // ESTRATEGIA 3: Network-First para API de Firebase
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            return caches.open(CACHE_DYNAMIC).then(cache => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // ESTRATEGIA 4: Network-First con fallback a cache para HTML
  if (request.destination === 'document' || 
      request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          return caches.open(CACHE_DYNAMIC).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Default: Network-First con cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        return caches.open(CACHE_DYNAMIC).then(cache => {
          cache.put(request, response.clone());
          return response;
        });
      })
      .catch(() => caches.match(request))
  );
});
