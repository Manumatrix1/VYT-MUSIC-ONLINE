/**
 * VYT MUSIC SERVICE WORKER
 * PWA con caché offline y estrategias de actualización
 * Versión: 2.0
 */

const CACHE_NAME = 'vyt-music-v2.0';
const RUNTIME_CACHE = 'vyt-music-runtime';

// Assets críticos para funcionamiento offline
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/principal.html',
  '/style.css',
  '/main.js',
  '/firebase-config.js',
  '/manifest.json',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap'
];

// Assets a cachear progresivamente
const CACHE_ON_USE = [
  '/certamenes.html',
  '/ranking.html',
  '/inscripcion-unificada.html',
  '/comprar-vyt-money.html',
  '/perfil-artista.html',
  '/nosotros.html',
  '/reglamento.html'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cacheando assets críticos');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalación completa');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('❌ Service Worker: Error en instalación', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    // Limpiar cachés antiguas
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('🗑️ Service Worker: Eliminando caché antigua:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activación completa');
        return self.clients.claim(); // Tomar control inmediato
      })
  );
});

// Interceptar peticiones (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones a Firebase/Firestore (siempre ir a la red)
  if (url.origin.includes('googleapis.com') || 
      url.origin.includes('firebasestorage.googleapis.com') ||
      url.origin.includes('firestore.googleapis.com')) {
    return;
  }

  // Estrategia: Network First con fallback a Cache
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('functions') ||
      url.pathname.includes('.json')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Estrategia: Cache First para assets estáticos
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Estrategia: Stale While Revalidate para páginas HTML
  event.respondWith(staleWhileRevalidateStrategy(request));
});

/**
 * Estrategia: Network First (Intenta red, si falla usa caché)
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Si la respuesta es válida, cachearla
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Si falla la red, buscar en caché
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('📦 Sirviendo desde caché (offline):', request.url);
      return cachedResponse;
    }
    
    // Si no hay caché, mostrar página offline
    return offlineFallback(request);
  }
}

/**
 * Estrategia: Cache First (Busca en caché, si no hay va a red)
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Error cargando:', request.url);
    return offlineFallback(request);
  }
}

/**
 * Estrategia: Stale While Revalidate (Sirve caché y actualiza en background)
 */
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = caches.open(RUNTIME_CACHE);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

/**
 * Fallback offline
 */
function offlineFallback(request) {
  if (request.destination === 'document') {
    return caches.match('/index.html');
  }
  
  // Para otros tipos de recursos, retornar respuesta vacía
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
}

// Mensajes desde la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('✅ Todas las cachés eliminadas');
    });
  }
});

// Notificaciones Push (futuro)
self.addEventListener('push', (event) => {
  console.log('📬 Push notification recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nuevo contenido disponible',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'vyt-music-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('VYT Music', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('✅ VYT Music Service Worker cargado');
