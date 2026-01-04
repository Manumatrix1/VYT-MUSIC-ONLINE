/**
 * Script de limpieza TOTAL - Desregistra TODOS los Service Workers
 * Ejecutar UNA VEZ para limpiar instalaciones viejas
 */

console.log('🔥 LIMPIEZA TOTAL DE SERVICE WORKERS');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`📋 Service Workers encontrados: ${registrations.length}`);
    
    registrations.forEach((registration, index) => {
      console.log(`🗑️ Desregistrando SW ${index + 1}/${registrations.length}:`, registration.scope);
      registration.unregister();
    });
    
    console.log('✅ TODOS los Service Workers desregistrados');
    console.log('🔄 Recarga la página para instalar el nuevo SW limpio');
  });
  
  // Limpiar todos los cachés
  caches.keys().then(cacheNames => {
    console.log(`📦 Cachés encontrados: ${cacheNames.length}`);
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log(`🗑️ Eliminando caché: ${cacheName}`);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('✅ TODOS los cachés eliminados');
  });
}

// Mostrar mensaje al usuario
setTimeout(() => {
  alert('✅ LIMPIEZA COMPLETA\n\nTodos los Service Workers viejos fueron desregistrados.\n\n🔄 La página se recargará ahora para instalar la versión limpia.');
  window.location.reload(true);
}, 2000);
