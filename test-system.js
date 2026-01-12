/**
 * VYT MUSIC - SISTEMA DE TESTING AUTOMATIZADO
 * 
 * Tests de validación para todas las funcionalidades críticas
 * Genera reporte HTML con resultados
 * 
 * EJECUTAR: node test-system.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const config = {
    baseUrl: 'http://localhost:5000',
    timeout: 10000,
    outputFile: 'reporte-testing.html'
};

// Resultados globales
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    tests: []
};

/**
 * Ejecutar un test individual
 */
async function runTest(name, testFn) {
    testResults.total++;
    console.log(`\n🧪 ${name}...`);
    
    try {
        const result = await testFn();
        
        if (result.success) {
            testResults.passed++;
            console.log(`✅ PASS: ${result.message}`);
            testResults.tests.push({
                name,
                status: 'pass',
                message: result.message,
                duration: result.duration || 0
            });
        } else {
            testResults.failed++;
            console.log(`❌ FAIL: ${result.message}`);
            testResults.tests.push({
                name,
                status: 'fail',
                message: result.message,
                error: result.error,
                duration: result.duration || 0
            });
        }
    } catch (error) {
        testResults.failed++;
        console.log(`❌ ERROR: ${error.message}`);
        testResults.tests.push({
            name,
            status: 'error',
            message: 'Test lanzó excepción',
            error: error.message,
            duration: 0
        });
    }
}

/**
 * TEST 1: Validar estructura de archivos
 */
async function testFileStructure() {
    const startTime = Date.now();
    const requiredFiles = [
        'index.html',
        'firebase-config.js',
        'firestore.rules',
        'firebase.json',
        'manifest.json',
        'src/google-analytics.js',
        'src/recaptcha.js',
        'src/lazy-loading.js',
        'design-tokens.css'
    ];
    
    const missingFiles = [];
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            missingFiles.push(file);
        }
    }
    
    const duration = Date.now() - startTime;
    
    if (missingFiles.length === 0) {
        return {
            success: true,
            message: `Todos los archivos requeridos existen (${requiredFiles.length} archivos)`,
            duration
        };
    } else {
        return {
            success: false,
            message: `Archivos faltantes: ${missingFiles.join(', ')}`,
            error: missingFiles,
            duration
        };
    }
}

/**
 * TEST 2: Validar páginas HTML
 */
async function testHTMLPages() {
    const startTime = Date.now();
    const pages = [
        'index.html',
        'register.html',
        'login.html',
        'inscripcion-unificada.html',
        'certamenes.html',
        'ranking.html'
    ];
    
    const errors = [];
    
    for (const page of pages) {
        if (!fs.existsSync(page)) {
            errors.push(`${page}: No existe`);
            continue;
        }
        
        const content = fs.readFileSync(page, 'utf8');
        
        // Validar estructura básica HTML
        if (!content.includes('<!DOCTYPE html>')) {
            errors.push(`${page}: Falta DOCTYPE`);
        }
        if (!content.includes('<html')) {
            errors.push(`${page}: Falta tag html`);
        }
        if (!content.includes('<head>')) {
            errors.push(`${page}: Falta head`);
        }
        if (!content.includes('<body')) {
            errors.push(`${page}: Falta body`);
        }
        
        // Validar design-tokens.css
        if (!content.includes('design-tokens.css')) {
            errors.push(`${page}: No incluye design-tokens.css`);
        }
    }
    
    const duration = Date.now() - startTime;
    
    if (errors.length === 0) {
        return {
            success: true,
            message: `${pages.length} páginas HTML validadas correctamente`,
            duration
        };
    } else {
        return {
            success: false,
            message: `Errores en páginas HTML`,
            error: errors.join('; '),
            duration
        };
    }
}

/**
 * TEST 3: Validar Firebase Config
 */
async function testFirebaseConfig() {
    const startTime = Date.now();
    
    if (!fs.existsSync('firebase-config.js')) {
        return {
            success: false,
            message: 'firebase-config.js no existe',
            duration: Date.now() - startTime
        };
    }
    
    const content = fs.readFileSync('firebase-config.js', 'utf8');
    
    const requiredFields = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
    ];
    
    const missingFields = requiredFields.filter(field => !content.includes(field));
    
    const duration = Date.now() - startTime;
    
    if (missingFields.length === 0 && content.includes('initializeApp')) {
        return {
            success: true,
            message: 'Firebase config válido con todos los campos requeridos',
            duration
        };
    } else {
        return {
            success: false,
            message: `Campos faltantes: ${missingFields.join(', ')}`,
            duration
        };
    }
}

/**
 * TEST 4: Validar Design Tokens
 */
async function testDesignTokens() {
    const startTime = Date.now();
    
    if (!fs.existsSync('design-tokens.css')) {
        return {
            success: false,
            message: 'design-tokens.css no existe',
            duration: Date.now() - startTime
        };
    }
    
    const content = fs.readFileSync('design-tokens.css', 'utf8');
    
    const requiredVariables = [
        '--vyt-primary',
        '--vyt-accent',
        '--vyt-bg-dark',
        '--vyt-text-light',
        '--vyt-gradient-primary'
    ];
    
    const missingVars = requiredVariables.filter(v => !content.includes(v));
    
    const duration = Date.now() - startTime;
    
    if (missingVars.length === 0) {
        return {
            success: true,
            message: `Design tokens válidos con ${requiredVariables.length} variables críticas`,
            duration
        };
    } else {
        return {
            success: false,
            message: `Variables faltantes: ${missingVars.join(', ')}`,
            duration
        };
    }
}

/**
 * TEST 5: Validar Scripts de optimización
 */
async function testOptimizationScripts() {
    const startTime = Date.now();
    
    const scripts = {
        'src/google-analytics.js': ['trackInscripcion', 'trackPagoExitoso'],
        'src/recaptcha.js': ['executeRecaptcha', 'validateLoginForm'],
        'src/lazy-loading.js': ['VYTLazyLoad', 'initLazyLoading']
    };
    
    const errors = [];
    
    for (const [file, functions] of Object.entries(scripts)) {
        if (!fs.existsSync(file)) {
            errors.push(`${file}: No existe`);
            continue;
        }
        
        const content = fs.readFileSync(file, 'utf8');
        
        for (const fn of functions) {
            if (!content.includes(fn)) {
                errors.push(`${file}: Falta función ${fn}`);
            }
        }
    }
    
    const duration = Date.now() - startTime;
    
    if (errors.length === 0) {
        return {
            success: true,
            message: 'Todos los scripts de optimización son válidos',
            duration
        };
    } else {
        return {
            success: false,
            message: 'Errores en scripts de optimización',
            error: errors.join('; '),
            duration
        };
    }
}

/**
 * TEST 6: Validar Firestore Rules
 */
async function testFirestoreRules() {
    const startTime = Date.now();
    
    if (!fs.existsSync('firestore.rules')) {
        return {
            success: false,
            message: 'firestore.rules no existe',
            duration: Date.now() - startTime
        };
    }
    
    const content = fs.readFileSync('firestore.rules', 'utf8');
    
    const requiredCollections = [
        'users',
        'artist_profiles',
        'certamenes_provinciales',
        'participantes_online',
        'user_vyt_money'
    ];
    
    const missingCollections = requiredCollections.filter(c => !content.includes(c));
    
    const duration = Date.now() - startTime;
    
    if (missingCollections.length === 0) {
        return {
            success: true,
            message: `Firestore rules válidas con ${requiredCollections.length} colecciones`,
            duration
        };
    } else {
        return {
            success: false,
            message: `Colecciones faltantes: ${missingCollections.join(', ')}`,
            duration
        };
    }
}

/**
 * TEST 7: Validar PWA Manifest
 */
async function testPWAManifest() {
    const startTime = Date.now();
    
    if (!fs.existsSync('manifest.json')) {
        return {
            success: false,
            message: 'manifest.json no existe',
            duration: Date.now() - startTime
        };
    }
    
    try {
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = requiredFields.filter(f => !manifest[f]);
        
        const duration = Date.now() - startTime;
        
        if (missingFields.length === 0) {
            return {
                success: true,
                message: `PWA manifest válido con ${manifest.icons?.length || 0} iconos`,
                duration
            };
        } else {
            return {
                success: false,
                message: `Campos faltantes: ${missingFields.join(', ')}`,
                duration
            };
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error parseando manifest.json',
            error: error.message,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Generar reporte HTML
 */
function generateHTMLReport() {
    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    const totalDuration = testResults.tests.reduce((sum, t) => sum + t.duration, 0);
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Testing - VYT Music</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #58a6ff, #FFD700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .meta {
            color: #8b949e;
            margin-bottom: 40px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stat-label {
            font-size: 0.875rem;
            color: #8b949e;
            margin-bottom: 8px;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
        }
        .stat-value.pass { color: #2ea043; }
        .stat-value.fail { color: #f85149; }
        .stat-value.total { color: #58a6ff; }
        .stat-value.rate {
            background: linear-gradient(135deg, #2ea043, #58a6ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .tests-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .test-item {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid;
            transition: transform 0.2s;
        }
        .test-item:hover {
            transform: translateX(4px);
        }
        .test-item.pass { border-left-color: #2ea043; }
        .test-item.fail { border-left-color: #f85149; }
        .test-item.error { border-left-color: #ff7b00; }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .test-name {
            font-size: 1.125rem;
            font-weight: 600;
        }
        .test-status {
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        .test-status.pass {
            background: rgba(46, 160, 67, 0.2);
            color: #2ea043;
        }
        .test-status.fail {
            background: rgba(248, 81, 73, 0.2);
            color: #f85149;
        }
        .test-status.error {
            background: rgba(255, 123, 0, 0.2);
            color: #ff7b00;
        }
        .test-message {
            color: #c9d1d9;
            margin-bottom: 8px;
        }
        .test-error {
            background: rgba(248, 81, 73, 0.1);
            border-radius: 6px;
            padding: 12px;
            color: #f85149;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            margin-top: 8px;
        }
        .test-duration {
            color: #8b949e;
            font-size: 0.875rem;
        }
        @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .summary { grid-template-columns: 1fr 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Reporte de Testing Automatizado</h1>
        <p class="meta">VYT Music Online | ${new Date().toLocaleString('es-AR')}</p>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-label">Tests Ejecutados</div>
                <div class="stat-value total">${testResults.total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tests Exitosos</div>
                <div class="stat-value pass">${testResults.passed}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tests Fallidos</div>
                <div class="stat-value fail">${testResults.failed}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tasa de Éxito</div>
                <div class="stat-value rate">${passRate}%</div>
            </div>
        </div>
        
        <h2 style="margin-bottom: 20px; color: #58a6ff;">Resultados Detallados</h2>
        
        <div class="tests-list">
            ${testResults.tests.map(test => `
                <div class="test-item ${test.status}">
                    <div class="test-header">
                        <div class="test-name">${test.name}</div>
                        <span class="test-status ${test.status}">
                            ${test.status === 'pass' ? '✅ PASS' : test.status === 'fail' ? '❌ FAIL' : '⚠️ ERROR'}
                        </span>
                    </div>
                    <div class="test-message">${test.message}</div>
                    ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
                    <div class="test-duration">⏱️ ${test.duration}ms</div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 40px; padding: 20px; background: rgba(88, 166, 255, 0.1); border-radius: 12px; border-left: 4px solid #58a6ff;">
            <h3 style="color: #58a6ff; margin-bottom: 10px;">📊 Estadísticas Finales</h3>
            <p>⏱️ Duración total: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)</p>
            <p>✅ Tasa de éxito: ${passRate}%</p>
            <p>🎯 Estado del sistema: ${passRate >= 90 ? 'Excelente' : passRate >= 70 ? 'Bueno' : 'Necesita mejoras'}</p>
        </div>
    </div>
</body>
</html>
    `;
    
    fs.writeFileSync(config.outputFile, html);
    console.log(`\n📄 Reporte generado: ${config.outputFile}`);
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
    console.log('========================================');
    console.log('  VYT MUSIC - TESTING AUTOMATIZADO');
    console.log('========================================');
    
    await runTest('Estructura de archivos', testFileStructure);
    await runTest('Validación de páginas HTML', testHTMLPages);
    await runTest('Configuración de Firebase', testFirebaseConfig);
    await runTest('Design Tokens CSS', testDesignTokens);
    await runTest('Scripts de optimización', testOptimizationScripts);
    await runTest('Reglas de Firestore', testFirestoreRules);
    await runTest('Manifest PWA', testPWAManifest);
    
    console.log('\n========================================');
    console.log('  RESUMEN FINAL');
    console.log('========================================');
    console.log(`✅ Tests exitosos: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Tests fallidos: ${testResults.failed}/${testResults.total}`);
    console.log(`📊 Tasa de éxito: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    console.log('========================================\n');
    
    generateHTMLReport();
    
    // Retornar código de salida apropiado
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Ejecutar tests
runAllTests().catch(error => {
    console.error('❌ Error fatal en testing:', error);
    process.exit(1);
});
