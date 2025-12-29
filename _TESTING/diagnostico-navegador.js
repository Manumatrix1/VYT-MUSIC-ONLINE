/**
 * HERRAMIENTA DE DIAGNÓSTICO - VYT MUSIC CUELGUES
 * Ejecutar en Console del navegador para obtener datos reales
 * 
 * Copia y pega esto en DevTools Console (F12)
 */

console.log('%c=== DIAGNÓSTICO COMPLETO VYT MUSIC ===', 'color: red; font-size: 16px; font-weight: bold');

// 1. REVISAR MEMORIA
console.log('\n📊 MEMORIA ACTUAL:');
if (performance.memory) {
    const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
    const limitMB = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
    const percentUsed = ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1);
    
    console.log(`  Usada: ${usedMB} MB`);
    console.log(`  Límite: ${limitMB} MB`);
    console.log(`  Porcentaje: ${percentUsed}%`);
    
    if (percentUsed > 80) {
        console.warn('⚠️ ALERTA: Memoria muy alta (>80%)');
    }
} else {
    console.warn('⚠️ Chrome DevTools no detectó performance.memory');
}

// 2. REVISAR TIMERS ACTIVOS
console.log('\n⏰ TIMERS ACTIVOS:');
console.log(`  Intervals globales: ${window.activeIntervals ? window.activeIntervals.length : 0}`);
console.log(`  Listeners: ${getEventListenerCount()}`);

function getEventListenerCount() {
    let count = 0;
    // Aproximación: contar listeners en elementos principales
    const elements = [document, window, document.body];
    return 'N/A (revisar en Inspector)';
}

// 3. REVISAR CACHE
console.log('\n💾 CACHE:');
console.log(`  Cache de inscripciones: ${window.inscriptionCache ? window.inscriptionCache.size : 'N/A'} items`);
console.log(`  localStorage size: ${JSON.stringify(localStorage).length} bytes`);

// 4. REVISAR FIREBASE
console.log('\n🔥 FIREBASE:');
console.log(`  Firebase inicializado: ${window.firebaseInitialized || 'desconocido'}`);
console.log(`  Firebase SDK v8 (CDN): ${typeof firebase !== 'undefined' ? '✅ Sí' : '❌ No'}`);

// 5. REVISAR PROCESOS EN BACKGROUND
console.log('\n🔄 PROCESOS ACTIVOS:');

// Monitorear navegador próximo 30 segundos
console.log('\n%c⏳ MONITOREANDO PRÓXIMOS 30 SEGUNDOS...', 'color: blue; font-weight: bold');

const startMem = performance.memory?.usedJSHeapSize || 0;
const startTime = Date.now();

const monitor = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (elapsed > 30000) {
        clearInterval(monitor);
        
        const endMem = performance.memory?.usedJSHeapSize || 0;
        const diff = ((endMem - startMem) / 1048576).toFixed(2);
        const diffPercent = ((diff / (startMem / 1048576)) * 100).toFixed(1);
        
        console.log('\n%c=== RESULTADO DESPUÉS DE 30 SEGUNDOS ===', 'color: green; font-size: 14px; font-weight: bold');
        console.log(`  Cambio de memoria: ${diff} MB (${diffPercent}%)`);
        
        if (Math.abs(parseFloat(diff)) > 10) {
            console.warn('⚠️ ALERTA: Fuga de memoria detectada! +'+diff+'MB en 30 segundos');
        } else {
            console.log('✅ Memoria estable');
        }
        
        return;
    }
    
    // Mostrar progreso
    const progress = Math.round((elapsed / 30000) * 100);
    console.clear();
    console.log(`${progress}% - Monitoreando... (${(elapsed/1000).toFixed(1)}s)`);
}, 5000);

// 6. FUNCIÓN PARA ENCONTRAR QUÉ ESTÁ LENTO
console.log('\n\n%c🔍 PRUEBAS DE RENDIMIENTO', 'color: purple; font-weight: bold');

// Test 1: Evaluaciónde Firebase
console.log('\nTest 1: Firebase query (tiempo esperado <500ms)');
const firebaseTest = async () => {
    const start = performance.now();
    try {
        // Intenta una query básica
        const result = await fetch('https://healthcheck-argiroqkia-uc.a.run.app');
        const end = performance.now();
        console.log(`  Tiempo: ${(end - start).toFixed(0)}ms`);
        if (end - start > 2000) {
            console.warn('  ⚠️ LENTO: Firebase respondiendo lentamente');
        }
    } catch (e) {
        console.error('  ❌ Error:', e.message);
    }
};
firebaseTest();

// Test 2: Rendimiento del DOM
console.log('\nTest 2: Operaciones del DOM');
const domTest = () => {
    const start = performance.now();
    const elem = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
        elem.innerHTML += '<span>test</span>';
    }
    const end = performance.now();
    console.log(`  Tiempo crear 1000 elementos: ${(end - start).toFixed(0)}ms`);
    if (end - start > 100) {
        console.warn('  ⚠️ DOM lento');
    }
};
domTest();

// 7. EXPORTAR DATOS PARA ANÁLISIS
console.log('\n\n%c📋 COPIA ESTO PARA ENVIAR AL SOPORTE:', 'color: orange; font-weight: bold');
const report = {
    timestamp: new Date().toISOString(),
    memoria: performance.memory ? {
        usada: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        limite: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    } : 'N/A',
    cache: window.inscriptionCache?.size || 0,
    timers: window.activeIntervals?.length || 0,
    firebaseOK: typeof firebase !== 'undefined',
    navegador: navigator.userAgent.split('Chrome')[1]?.split(' ')[0] || 'Desconocido'
};

console.log(JSON.stringify(report, null, 2));

console.log('\n%c✅ DIAGNÓSTICO COMPLETADO', 'color: green; font-size: 14px; font-weight: bold');
console.log('Espera a que termine el monitoreo de 30 segundos para ver el resultado');
