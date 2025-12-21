/**
 * Cargador de Firebase para VYT MUSIC
 * Este script carga Firebase de forma sincrónica antes que cualquier otro script
 */

(function() {
    'use strict';
    
    // Si Firebase ya está cargado, no hacer nada
    if (typeof firebase !== 'undefined') {
        console.log('✅ Firebase ya está disponible');
        return;
    }
    
    console.log('🔄 Cargando Firebase...');
    
    // Versión de Firebase a usar
    const FIREBASE_VERSION = '8.10.1';
    const CDN_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
    
    // Scripts necesarios
    const scripts = [
        `${CDN_BASE}/firebase-app.js`,
        `${CDN_BASE}/firebase-auth.js`,
        `${CDN_BASE}/firebase-firestore.js`,
        `${CDN_BASE}/firebase-storage.js`
    ];
    
    let loaded = 0;
    
    // Cargar scripts en secuencia
    function loadNext(index) {
        if (index >= scripts.length) {
            console.log('✅ Todos los scripts de Firebase cargados');
            // Disparar evento cuando todo esté listo
            window.dispatchEvent(new Event('firebaseScriptsLoaded'));
            return;
        }
        
        const script = document.createElement('script');
        script.src = scripts[index];
        script.onload = () => {
            loaded++;
            console.log(`✅ Cargado ${loaded}/${scripts.length}: ${scripts[index]}`);
            loadNext(index + 1);
        };
        script.onerror = (err) => {
            console.error(`❌ Error cargando ${scripts[index]}:`, err);
        };
        document.head.appendChild(script);
    }
    
    loadNext(0);
})();
