/**
 * FORCE-RELOAD.js - Forzar actualización en navegadores móviles
 * Sistema agresivo de limpieza de caché
 */

(function() {
  const APP_VERSION = '1768337820';
  const VERSION_KEY = 'vyt_app_version';
  const LAST_RELOAD_KEY = 'vyt_last_reload';
  
  console.log('🔄 Force Reload System - Versión:', APP_VERSION);
  
  // Obtener versión almacenada
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const lastReload = localStorage.getItem(LAST_RELOAD_KEY);
  const now = Date.now();
  
  // Si es diferente versión o han pasado más de 5 minutos desde último reload
  const needsReload = !storedVersion || 
                     storedVersion !== APP_VERSION || 
                     !lastReload || 
                     (now - parseInt(lastReload)) > 300000; // 5 minutos
  
  if (needsReload && window.location.search.indexOf('noReload') === -1) {
    console.log('⚠️ Nueva versión detectada o caché expirado');
    console.log('  Versión almacenada:', storedVersion);
    console.log('  Versión actual:', APP_VERSION);
    
    // Limpiar todo el storage
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Guardar nueva versión
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      localStorage.setItem(LAST_RELOAD_KEY, now.toString());
      
      console.log('🗑️ Storage limpiado completamente');
      
      // Forzar recarga con parámetro para evitar loop infinito
      const separator = window.location.search ? '&' : '?';
      const newUrl = window.location.href.split('?')[0] + '?noReload=1&v=' + APP_VERSION;
      
      console.log('🔄 Redirigiendo a:', newUrl);
      window.location.replace(newUrl);
      
    } catch (error) {
      console.error('❌ Error limpiando storage:', error);
    }
  } else {
    console.log('✅ Versión actual OK:', APP_VERSION);
    
    // Limpiar parámetro noReload de la URL si existe
    if (window.location.search.indexOf('noReload') !== -1) {
      const cleanUrl = window.location.href.split('?')[0];
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
  
  // Mostrar badge de versión en consola (solo desarrollo)
  console.log('%c VYT MUSIC v' + APP_VERSION + ' ', 'background: #00d9ff; color: #000; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  
})();
