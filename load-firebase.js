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
    
    // Cargar scripts sincrónicamente
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Importante: cargar en orden
        document.head.appendChild(script);
    });
    
    console.log('📦 Firebase scripts añadidos al DOM');
})();
