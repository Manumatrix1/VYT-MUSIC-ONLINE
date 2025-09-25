// VYT MUSIC - Service Worker Optimizado v2.1
const CACHE_NAME = 'vyt-music-v2.1';
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/principal.html',
  '/main.js',
  '/firebase-config.js',
  '/style.css',
  '/src/performance-utils.js'
];

// Instalación del service worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando v2.1');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cacheando recursos estáticos');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('✅ Recursos cacheados exitosamente');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error cacheando recursos:', error);
      })
  );
});

// Activación del service worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activado');
        return self.clients.claim();
      })
  );
});

// Interceptar requests de fetch
self.addEventListener('fetch', event => {
  // Solo procesar requests GET y HTTP(S)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Recurso en cache, devolverlo
          return cachedResponse;
        }

        // No está en cache, hacer fetch
        return fetch(event.request)
          .then(response => {
            // Verificar que la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar respuesta para guardar en cache
            const responseToCache = response.clone();

            // Guardar en cache para futuras requests
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('Error en fetch:', error);
            // Opcional: retornar página de fallback
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificaciones push (opcional para futuras actualizaciones)
self.addEventListener('push', event => {
  console.log('📱 Push notification recibida');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});