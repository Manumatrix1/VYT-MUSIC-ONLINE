/**
 * ═══════════════════════════════════════════════════════════════════════
 * VYT MUSIC - SERVICE WORKER v3.1 PROFESIONAL
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Estrategia: NETWORK-FIRST (Prioridad a contenido fresco del servidor)
 * Auto-Update: skipWaiting() + clients.claim() para actualización inmediata
 * Versionado: Cache invalidation automática en cada deploy
 * 
 * Fecha: 14 de Enero 2026
 * Versión: 3.1 - PRODUCCIÓN
 */

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════

const CACHE_VERSION = '3.6';
const CACHE_NAME = `vyt-music-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `vyt-music-runtime-v${CACHE_VERSION}`;
const CACHE_TIMEOUT = 5000; // 5 segundos timeout para network requests

// Assets críticos LOCALES (NO incluir CDN externos - se cachean dinámicamente)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/firebase-config.js',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  // CSS críticos
  '/style.css',
  '/mobile-fixes.css',
  '/design-tokens.css',
  '/icon-control.css',
  '/src/navigation-styles.css',
  '/src/gamification-styles.css',
  '/src/animations.css',
  '/src/empty-states.css',
  // JavaScript crítico
  '/main.js',
  '/sw-register.js',
  '/src/navigation-component.js',
  // Imagen de fondo principal
  '/images/fotos/chica-feliz-grabando-una-cancion.jpg',
  '/images/logos/logo-blanco.png',
  '/images/logos/logo-negro.png',
  '/images/logos/logo-dorado.png'
];

// CDN externos - Cache-First con StaleWhileRevalidate
const CDN_PATTERNS = [
  'cdnjs.cloudflare.com',
  'www.gstatic.com/firebasejs',
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'i.ibb.co'
];

// URLs que SIEMPRE deben ir a la red (no cachear)
const NETWORK_ONLY_URLS = [
  '/sw.js',
  '/firebase-config.js',
  'firebasestorage.googleapis.com',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'googleapis.com/auth',
  'api.mercadopago.com'
];

// ═══════════════════════════════════════════════════════════════════════
// INSTALL EVENT - Instalación con skipWaiting() INMEDIATO
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log(`🔧 [SW v${CACHE_VERSION}] Instalando...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`📦 [SW v${CACHE_VERSION}] Cacheando assets críticos`);
        return cache.addAll(CRITICAL_ASSETS).catch(err => {
          console.warn('⚠️ [SW] Algunos assets críticos no se pudieron cachear:', err);
          // Continuar aunque falle el caché de algunos assets
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log(`✅ [SW v${CACHE_VERSION}] Instalación completa`);
        console.log('⚡ [SW] FORZANDO activación inmediata (skipWaiting)');
        // CRÍTICO: skipWaiting() para actualización automática
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ [SW] Error en instalación:', error);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT - Limpieza de cachés antiguas + clients.claim()
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log(`🚀 [SW v${CACHE_VERSION}] Activando...`);
  
  event.waitUntil(
    Promise.all([
      // 1. Limpiar cachés de versiones anteriores
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Eliminar cachés que no sean de la versión actual
              return cacheName.startsWith('vyt-music-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log(`🗑️ [SW] Eliminando caché antigua: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // 2. Tomar control de todas las pestañas inmediatamente
      self.clients.claim()
    ])
    .then(() => {
      console.log(`✅ [SW v${CACHE_VERSION}] Activación completa`);
      console.log('🎯 [SW] Control tomado de todos los clientes');
      
      // 3. Notificar a todos los clientes que hay nueva versión
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) {
          console.log(`📢 [SW] Notificando a ${clients.length} cliente(s)`);
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION,
              message: `Service Worker actualizado a v${CACHE_VERSION}`
            });
          });
        }
      });
    })
    .catch((error) => {
      console.error('❌ [SW] Error en activación:', error);
    })
  );
});

// ═══════════════════════════════════════════════════════════════════════
// FETCH EVENT - Estrategia NETWORK-FIRST con fallback inteligente
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // URLs que SIEMPRE van directo a la red (no interceptar)
  if (shouldBypassCache(url)) {
    return; // Dejar que el browser maneje la petición normalmente
  }

  // CDN externos: NO INTERCEPTAR - el browser los maneja mejor sin SW
  if (isCDNRequest(url)) {
    return; // Dejar pasar sin interceptar
  }

  // Estrategia según tipo de recurso LOCAL
  if (isApiRequest(url)) {
    // APIs y datos dinámicos: NETWORK-FIRST con timeout
    event.respondWith(networkFirstWithTimeout(request, CACHE_TIMEOUT));
  } else if (isStaticAsset(request)) {
    // CSS, JS, imágenes, fuentes: NETWORK-FIRST rápido
    event.respondWith(networkFirstWithTimeout(request, 3000));
  } else {
    // HTML y otros: NETWORK-FIRST estándar
    event.respondWith(networkFirstWithTimeout(request, CACHE_TIMEOUT));
  }
});

// ═══════════════════════════════════════════════════════════════════════
// ESTRATEGIAS DE CACHÉ
// ═══════════════════════════════════════════════════════════════════════

/**
 * Network-First con Timeout
 * Intenta red primero, si falla o tarda mucho → caché
 */
async function networkFirstWithTimeout(request, timeout) {
  try {
    // Race entre fetch normal y fetch con timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    // Si la respuesta es válida, cachearla y retornarla
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone()).catch(err => {
        console.warn('⚠️ [SW] No se pudo cachear:', request.url, err);
      });
      
      console.log(`🌐 [SW] Servido desde RED: ${request.url}`);
      return networkResponse;
    }
    
    // Si respuesta no es OK, intentar caché
    throw new Error(`Network response not OK: ${networkResponse.status}`);
    
  } catch (error) {
    // Network falló o timeout → buscar en caché
    console.log(`⚠️ [SW] Network falló (${error.message}), buscando en caché: ${request.url}`);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log(`📦 [SW] Servido desde CACHÉ: ${request.url}`);
      return cachedResponse;
    }
    
    // No hay caché → retornar error apropiado
    console.error(`❌ [SW] No hay caché disponible para: ${request.url}`);
    return offlineFallback(request);
  }
}

/**
 * Fallback cuando no hay red ni caché
 */
function offlineFallback(request) {
  const url = new URL(request.url);
  
  // Para páginas HTML, intentar servir index.html desde caché
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    return caches.match('/index.html').then(response => {
      if (response) return response;
      return new Response(
        '<h1>Sin conexión</h1><p>VYT Music requiere conexión a internet.</p>',
        { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    });
  }
  
  // Para otros recursos, retornar error 503
  return new Response('Recurso no disponible offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS - Detección de tipo de petición
// ═══════════════════════════════════════════════════════════════════════

/**
 * URLs que NO deben cachearse NUNCA
 */
function shouldBypassCache(url) {
  return NETWORK_ONLY_URLS.some(pattern => url.href.includes(pattern));
}

/**
 * Detectar peticiones a CDN externos
 */
function isCDNRequest(url) {
  return CDN_PATTERNS.some(pattern => url.href.includes(pattern));
}

/**
 * Detectar peticiones a APIs o datos dinámicos
 */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.pathname.includes('/functions/') ||
         url.pathname.endsWith('.json') ||
         url.search.includes('nocache');
}

/**
 * Detectar assets estáticos (CSS, JS, imágenes, fuentes)
 */
function isStaticAsset(request) {
  return request.destination === 'style' ||
         request.destination === 'script' ||
         request.destination === 'image' ||
         request.destination === 'font' ||
         request.url.match(/\.(css|js|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$/i);
}

// ═══════════════════════════════════════════════════════════════════════
// MESSAGE EVENT - Comunicación con la app
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  console.log('📨 [SW] Mensaje recibido:', event.data);
  
  if (!event.data || !event.data.type) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      // Forzar activación inmediata
      console.log('⚡ [SW] Ejecutando skipWaiting() por petición del cliente');
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      // Limpiar todas las cachés
      console.log('🗑️ [SW] Limpiando todas las cachés...');
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('✅ [SW] Todas las cachés eliminadas');
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'GET_VERSION':
      // Retornar versión actual del SW
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
      break;
      
    default:
      console.warn('⚠️ [SW] Tipo de mensaje desconocido:', event.data.type);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS - Preparado para futuro
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  console.log('📬 [SW] Push notification recibida');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'VYT Music';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'vyt-music-notification',
    requireInteraction: false,
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notificación clickeada');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Si ya hay una ventana abierta, enfocarla
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus().then(client => client.navigate(urlToOpen));
          }
        }
        // Si no, abrir nueva ventana
        return clients.openWindow(urlToOpen);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SYNC EVENT - Background Sync (futuro)
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-votes') {
    event.waitUntil(syncPendingVotes());
  }
});

async function syncPendingVotes() {
  // Implementar sincronización de votos pendientes
  console.log('📊 [SW] Sincronizando votos pendientes...');
  // TODO: Implementar lógica de sincronización
}

// ═══════════════════════════════════════════════════════════════════════
// LOG INICIAL
// ═══════════════════════════════════════════════════════════════════════

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║     VYT MUSIC - SERVICE WORKER v${CACHE_VERSION} INICIADO                      ║
╠════════════════════════════════════════════════════════════════════╣
║  ✅ Estrategia: Network-First con timeout ${CACHE_TIMEOUT}ms                  ║
║  ✅ Auto-Update: skipWaiting() + clients.claim()                   ║
║  ✅ Cache: ${CACHE_NAME}                         ║
║  ✅ Assets críticos: ${CRITICAL_ASSETS.length} archivos                             ║
╚════════════════════════════════════════════════════════════════════╝
`);
