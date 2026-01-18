// DESREGISTRAR SERVICE WORKER TEMPORALMENTE
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Desregistrar todos los service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('🗑️ SW desregistrado');
    }
    
    // Limpiar caché
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('🗑️ Caché eliminado:', cacheName);
    }
    
    console.log('✅ Service Worker y caché limpiados');
  });
}


