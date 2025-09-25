// VYT MUSIC - Service Worker Optimizado v2.0
const CACHE_NAME = 'vyt-music-optimized-v2.1';
const CRITICAL_CACHE = 'vyt-critical-v2.1';
const DYNAMIC_CACHE = 'vyt-dynamic-v2.1';

// Recursos críticos que deben estar disponibles offline
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/principal.html',
  '/main.js',
  '/firebase-config.js',
  '/style.css',
  '/src/performance-utils.js'
];

// Recursos que se cachean bajo demanda
const CACHEABLE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.html$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.webp$/,
  /fonts\.googleapis\.com/,
  /cdnjs\.cloudflare\.com/
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker Optimizado: Instalando...');
  
  event.waitUntil(
    caches.open(CRITICAL_CACHE)
      .then(cache => {
        console.log('📦 Cacheando recursos críticos...');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('✅ Service Worker optimizado instalado');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error instalando Service Worker:', error);
      })
  );
});

// Activación
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker Optimizado: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![CACHE_NAME, CRITICAL_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker optimizado activado');
        return self.clients.claim();
      })
  );
});

// Estrategia de fetch optimizada
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Solo procesar requests HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estrategia según el tipo de recurso
  if (isCriticalResource(request.url)) {
    // Recursos críticos: Cache first
    event.respondWith(cacheFirst(request, CRITICAL_CACHE));
  } else if (isFirebaseResource(request.url)) {
    // Firebase: Network first (datos dinámicos)
    event.respondWith(networkFirst(request));
  } else if (isCacheableResource(request.url)) {
    // Recursos estáticos: Stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Otros: Network first con cache fallback
    event.respondWith(networkFirstWithCache(request));
  }
});

// Estrategias de caching

async function cacheFirst(request, cacheName = CRITICAL_CACHE) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Cache hit:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache first error:', error);
    return new Response('Recurso no disponible', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🔄 Network failed, using cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Actualizar en background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Silenciar errores de background update
  });
  
  return cachedResponse || fetchPromise;
}

async function networkFirstWithCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // Intentar cache como fallback
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Fallback final
  return new Response('Recurso no disponible', { 
    status: 503,
    headers: {'Content-Type': 'text/plain'} 
  });
}

// Funciones auxiliares
function isCriticalResource(url) {
  return CRITICAL_RESOURCES.some(resource => url.includes(resource));
}

function isFirebaseResource(url) {
  return url.includes('firestore.googleapis.com') || 
         url.includes('firebase') ||
         url.includes('gstatic.com/firebasejs');
}

function isCacheableResource(url) {
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(url));
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Forzando actualización del Service Worker...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Limpiando todos los caches...');
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cache => caches.delete(cache)));
    }).then(() => {
      console.log('✅ Todos los caches limpiados');
      if (event.ports[0]) {
        event.ports[0].postMessage({success: true});
      }
    });
  }
});