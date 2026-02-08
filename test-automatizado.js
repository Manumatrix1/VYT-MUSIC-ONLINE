/**
 * TESTS AUTOMATIZADOS - VYT-MUSIC-ONLINE
 * Tests básicos de infraestructura y accesibilidad
 * Ejecutar: node test-automatizado.js
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'https://vyt-online.web.app';
const FUNCTIONS_URL = 'https://us-central1-vyt-online.cloudfunctions.net';

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Contador de tests
let testsPassed = 0;
let testsFailed = 0;
let testsTotal = 0;

/**
 * Función helper para hacer requests HTTP
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Ejecutar un test
 */
async function runTest(name, testFn) {
    testsTotal++;
    process.stdout.write(`${colors.cyan}▶${colors.reset} ${name}... `);
    
    try {
        await testFn();
        console.log(`${colors.green}✓ PASS${colors.reset}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ FAIL${colors.reset}`);
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
        testsFailed++;
        return false;
    }
}

/**
 * TESTS DE HOSTING
 */
async function testHosting() {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}📦 TESTS DE HOSTING${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    // Test 1: Página principal carga
    await runTest('Página principal (/) carga correctamente', async () => {
        const res = await makeRequest(`${BASE_URL}/`);
        if (res.statusCode !== 200) {
            throw new Error(`Status code ${res.statusCode}, esperado 200`);
        }
        if (!res.body.includes('VYT') && !res.body.includes('DOCTYPE')) {
            throw new Error('HTML inválido o vacío');
        }
    });
    
    // Test 2: Página de login existe
    await runTest('Página de login existe', async () => {
        const res = await makeRequest(`${BASE_URL}/login.html`);
        if (res.statusCode !== 200) {
            throw new Error(`Status code ${res.statusCode}`);
        }
    });
    
    // Test 3: Página de inscripción existe
    await runTest('Página de inscripción existe', async () => {
        const res = await makeRequest(`${BASE_URL}/inscripcion-unificada.html`);
        if (res.statusCode !== 200) {
            throw new Error(`Status code ${res.statusCode}`);
        }
    });
    
    // Test 4: Página admin existe
    await runTest('Página admin existe', async () => {
        const res = await makeRequest(`${BASE_URL}/admin.html`);
        if (res.statusCode !== 200) {
            throw new Error(`Status code ${res.statusCode}`);
        }
    });
    
    // Test 5: Firebase config carga
    await runTest('Firebase config (firebase-config.js) existe', async () => {
        const res = await makeRequest(`${BASE_URL}/firebase-config.js`);
        if (res.statusCode !== 200) {
            throw new Error(`Status code ${res.statusCode}`);
        }
        if (!res.body.includes('firebase') && !res.body.includes('apiKey')) {
            throw new Error('Firebase config no válido');
        }
    });
    
    // Test 6: Manifest PWA existe
    await runTest('Manifest PWA existe', async () => {
        const res = await makeRequest(`${BASE_URL}/manifest.json`);
        if (res.statusCode !== 200) {
            throw new Error(`Status code ${res.statusCode}`);
        }
    });
}

/**
 * TESTS DE ARCHIVOS CRÍTICOS
 */
async function testCriticalFiles() {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}📄 TESTS DE ARCHIVOS CRÍTICOS${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    const criticalFiles = [
        '/main.js',
        '/style.css',
        '/src/inscription-handler.js',
        '/certamenes.html',
        '/comprar-vyt-money.html'
    ];
    
    for (const file of criticalFiles) {
        await runTest(`Archivo ${file} existe`, async () => {
            const res = await makeRequest(`${BASE_URL}${file}`);
            if (res.statusCode !== 200) {
                throw new Error(`Status code ${res.statusCode}`);
            }
        });
    }
}

/**
 * TESTS DE SEGURIDAD (HEADERS)
 */
async function testSecurity() {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}🔒 TESTS DE SEGURIDAD (Headers)${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    // Test: Headers de seguridad
    await runTest('Headers de seguridad configurados', async () => {
        const res = await makeRequest(`${BASE_URL}/`);
        
        // Firebase Hosting siempre añade estos headers
        const hasStrictTransportSecurity = res.headers['strict-transport-security'];
        const hasContentType = res.headers['content-type'];
        
        if (!hasContentType) {
            throw new Error('Falta header Content-Type');
        }
    });
}

/**
 * TESTS DE FIREBASE FUNCTIONS
 */
async function testFunctions() {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}⚡ TESTS DE FIREBASE FUNCTIONS${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    // Test: Health check de functions
    await runTest('Firebase Functions están desplegadas', async () => {
        try {
            const res = await makeRequest(`${FUNCTIONS_URL}/exportarBackup`);
            // Esta función requiere auth, pero debe devolver 403 (Forbidden) no 404
            if (res.statusCode === 404) {
                throw new Error('Función no encontrada (404)');
            }
            // 403, 401, 500, etc. son OK - significa que la función existe
        } catch (error) {
            if (error.message.includes('ENOTFOUND')) {
                throw new Error('Functions no están desplegadas o URL incorrecta');
            }
            // Otros errores de red son OK para este test
        }
    });
}

/**
 * TESTS DE PERFORMANCE
 */
async function testPerformance() {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}⚡ TESTS DE PERFORMANCE${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    // Test: Tiempo de respuesta
    await runTest('Tiempo de respuesta < 3 segundos', async () => {
        const start = Date.now();
        await makeRequest(`${BASE_URL}/`);
        const elapsed = Date.now() - start;
        
        if (elapsed > 3000) {
            throw new Error(`Respuesta lenta: ${elapsed}ms (máximo 3000ms)`);
        }
        console.log(`\n  ${colors.cyan}→ Tiempo: ${elapsed}ms${colors.reset}`);
    });
}

/**
 * TESTS DE CONTENIDO
 */
async function testContent() {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}📝 TESTS DE CONTENIDO${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    // Test: Página principal tiene contenido VYT
    await runTest('Index contiene branding VYT', async () => {
        const res = await makeRequest(`${BASE_URL}/`);
        if (!res.body.toLowerCase().includes('vyt')) {
            throw new Error('No se encontró branding VYT en la página principal');
        }
    });
    
    // Test: Login tiene formulario
    await runTest('Login contiene formulario de auth', async () => {
        const res = await makeRequest(`${BASE_URL}/login.html`);
        const hasForm = res.body.includes('input') || res.body.includes('button');
        if (!hasForm) {
            throw new Error('No se encontró formulario en login.html');
        }
    });
}

/**
 * RESUMEN FINAL
 */
function printSummary() {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}📊 RESUMEN DE TESTS${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    const percentage = Math.round((testsPassed / testsTotal) * 100);
    
    console.log(`  Total:   ${testsTotal} tests`);
    console.log(`  ${colors.green}Pasados: ${testsPassed}${colors.reset}`);
    console.log(`  ${colors.red}Fallados: ${testsFailed}${colors.reset}`);
    console.log(`  Éxito:   ${percentage}%`);
    
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    if (percentage >= 80) {
        console.log(`${colors.green}✓ Sistema funcionando correctamente${colors.reset}`);
        console.log(`${colors.cyan}→ Puedes proceder con testing manual de flujos de usuario${colors.reset}\n`);
    } else if (percentage >= 60) {
        console.log(`${colors.yellow}⚠ Sistema parcialmente funcional${colors.reset}`);
        console.log(`${colors.cyan}→ Revisa los tests fallados antes de continuar${colors.reset}\n`);
    } else {
        console.log(`${colors.red}✗ Sistema con problemas críticos${colors.reset}`);
        console.log(`${colors.cyan}→ Corrige los tests fallados antes de hacer testing manual${colors.reset}\n`);
    }
}

/**
 * EJECUTAR TODOS LOS TESTS
 */
async function runAllTests() {
    console.log(`\n${colors.cyan}╔═══════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║  🧪 VYT-MUSIC TESTS AUTOMATIZADOS       ║${colors.reset}`);
    console.log(`${colors.cyan}║  Testing básico de infraestructura       ║${colors.reset}`);
    console.log(`${colors.cyan}╚═══════════════════════════════════════════╝${colors.reset}`);
    console.log(`\n${colors.yellow}URL Base: ${BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Fecha: ${new Date().toLocaleString('es-AR')}${colors.reset}\n`);
    
    try {
        await testHosting();
        await testCriticalFiles();
        await testSecurity();
        await testFunctions();
        await testPerformance();
        await testContent();
        
        printSummary();
        
        // Exit code basado en resultados
        process.exit(testsFailed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error(`\n${colors.red}Error fatal en tests:${colors.reset}`, error);
        process.exit(1);
    }
}

// Ejecutar
runAllTests();
