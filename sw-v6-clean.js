// VYT MUSIC - Service Worker con Actualización Automática v4.0
const CACHE_NAME = 'vyt-music-v6-final';
const CACHE_VERSION = '6.0';

// Recursos críticos
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/principal.html',
  '/main.js',
  '/firebase-config.js',
  '/style.css'
];

// Instalación - skipWaiting para actualizar inmediatamente
self.addEventListener('install', event => {
  console.log(`🔧 Service Worker ${CACHE_VERSION} instalando...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_RESOURCES))
      .then(() => {
        console.log(`✅ Caché ${CACHE_VERSION} creado`);
        // Forzar activación inmediata
        return self.skipWaiting();
      })
  );
});

// Activación - limpiar cachés viejos y tomar control inmediato
self.addEventListener('activate', event => {
  console.log(`🚀 Service Worker ${CACHE_VERSION} activando...`);
  event.waitUntil(
    caches.keys()
      .then(keys => {
        // Eliminar todos los cachés viejos
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME)
              .map(key => {
                console.log(`🗑️ Eliminando caché viejo: ${key}`);
                return caches.delete(key);
              })
        );
      })
      .then(() => {
        console.log(`✅ Service Worker ${CACHE_VERSION} activado`);
        // Tomar control de todas las páginas inmediatamente
        return self.clients.claim();
      })
      .then(() => {
        // Notificar a todos los clientes que hay actualización
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION
            });
          });
        });
      })
  );
});

// Fetch optimizado con network-first para HTML
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Para HTML: siempre buscar en red primero (network-first)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Guardar en caché la respuesta actualizada
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, usar caché
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para otros recursos: cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            if (response.ok && event.request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          });
      })
  );
});

// Mensaje desde el cliente para forzar actualización
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('📨 Cliente solicitó actualización inmediata');
    self.skipWaiting();
  }
});
