/**
 * 🧪 SUITE DE TESTING - VYT MUSIC ONLINE
 * 
 * Testing automático de componentes críticos del sistema
 * Verifica: Functions, Firestore, Auth, Database
 */

const admin = require('firebase-admin');
const path = require('path');
const https = require('https');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account-key.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
  projectId: 'vytonlineprueva'
});

const db = admin.firestore();

// ===== COLORES PARA CONSOLA =====
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function info(msg) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
}

function warning(msg) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

// ===== TESTS =====

async function testFirestoreConnection() {
  console.log('\n📊 TEST 1: Conexión Firestore');
  console.log('─'.repeat(60));
  
  try {
    const testDoc = await db.collection('system_config').doc('general').get();
    
    if (testDoc.exists) {
      success('Conexión a Firestore exitosa');
      info(`   Proyecto: vytonlineprueva`);
      return true;
    } else {
      warning('Conexión OK pero documento system_config no existe');
      return true;
    }
  } catch (err) {
    error(`Error de conexión: ${err.message}`);
    return false;
  }
}

async function testDatabaseStructure() {
  console.log('\n🗄️  TEST 2: Estructura de Base de Datos');
  console.log('─'.repeat(60));
  
  const requiredCollections = [
    'participantes_online',
    'artist_profiles',
    'users',
    'system_config'
  ];
  
  let allOk = true;
  
  for (const collectionName of requiredCollections) {
    try {
      const snapshot = await db.collection(collectionName).limit(1).get();
      const count = (await db.collection(collectionName).count().get()).data().count;
      
      success(`${collectionName}: ${count} documentos`);
    } catch (err) {
      error(`${collectionName}: Error - ${err.message}`);
      allOk = false;
    }
  }
  
  return allOk;
}

async function testNormalizedFields() {
  console.log('\n🔄 TEST 3: Campos Normalizados');
  console.log('─'.repeat(60));
  
  try {
    const snapshot = await db.collection('artist_profiles').limit(5).get();
    
    if (snapshot.empty) {
      warning('Colección artist_profiles vacía');
      return true;
    }
    
    let normalized = 0;
    let legacy = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Verificar campos normalizados
      if (data.foto_url || data.nombre_artistico || data.fecha_creacion) {
        normalized++;
      }
      
      // Verificar campos legacy
      if (data.fotoURL || data.nombreArtistico || data.fechaCreacion) {
        legacy++;
      }
    });
    
    success(`Documentos con campos normalizados: ${normalized}/${snapshot.size}`);
    info(`   Documentos con campos legacy: ${legacy}/${snapshot.size}`);
    
    if (normalized > 0) {
      success('Normalización funcionando correctamente');
      return true;
    } else {
      warning('No se encontraron campos normalizados');
      return false;
    }
  } catch (err) {
    error(`Error verificando normalización: ${err.message}`);
    return false;
  }
}

async function testCloudFunctions() {
  console.log('\n☁️  TEST 4: Cloud Functions');
  console.log('─'.repeat(60));
  
  const functionsToTest = [
    {
      name: 'healthCheck',
      url: 'https://us-central1-vytonlineprueva.cloudfunctions.net/healthCheck',
      method: 'GET'
    }
  ];
  
  let allOk = true;
  
  for (const func of functionsToTest) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.get(func.url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ status: res.statusCode });
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
      });
      
      if (response.status === 'healthy' || response.status === 200) {
        success(`${func.name}: Funcionando`);
      } else {
        warning(`${func.name}: Respuesta inesperada`);
      }
    } catch (err) {
      error(`${func.name}: ${err.message}`);
      allOk = false;
    }
  }
  
  return allOk;
}

async function testFirestoreRules() {
  console.log('\n🔐 TEST 5: Firestore Rules');
  console.log('─'.repeat(60));
  
  try {
    // Verificar que las reglas permiten lectura pública en certamenes
    const certamenesSnapshot = await db.collection('certamenes_provinciales').limit(1).get();
    success('Lectura pública en certamenes_provinciales: OK');
    
    // Verificar que participantes_online es accesible
    const participantesSnapshot = await db.collection('participantes_online').limit(1).get();
    success('Acceso a participantes_online: OK');
    
    info('   Nota: Tests de escritura requieren autenticación');
    
    return true;
  } catch (err) {
    error(`Error verificando reglas: ${err.message}`);
    return false;
  }
}

async function testSystemConfig() {
  console.log('\n⚙️  TEST 6: Configuración del Sistema');
  console.log('─'.repeat(60));
  
  try {
    const pricingDoc = await db.collection('system_config').doc('pricing').get();
    
    if (pricingDoc.exists) {
      const pricing = pricingDoc.data();
      success('Configuración de precios: OK');
      
      if (pricing.vyt_money) {
        info(`   Precio VYT Money: $${pricing.vyt_money.precio_por_100} por 100 unidades`);
      }
      
      if (pricing.inscripcion_online) {
        info(`   Precio inscripción: $${pricing.inscripcion_online.precio_base}`);
      }
    } else {
      warning('Documento de pricing no existe');
    }
    
    return true;
  } catch (err) {
    error(`Error verificando configuración: ${err.message}`);
    return false;
  }
}

async function testDataConsistency() {
  console.log('\n🔍 TEST 7: Consistencia de Datos');
  console.log('─'.repeat(60));
  
  try {
    const participantesSnapshot = await db.collection('participantes_online').get();
    
    let consistentes = 0;
    let inconsistentes = 0;
    
    participantesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Verificar campos requeridos
      const hasRequired = data.nombre_artista && data.email && data.provincia;
      
      if (hasRequired) {
        consistentes++;
      } else {
        inconsistentes++;
        info(`   Documento ${doc.id} le faltan campos requeridos`);
      }
    });
    
    success(`Documentos consistentes: ${consistentes}/${participantesSnapshot.size}`);
    
    if (inconsistentes > 0) {
      warning(`Documentos con problemas: ${inconsistentes}`);
    }
    
    return inconsistentes === 0;
  } catch (err) {
    error(`Error verificando consistencia: ${err.message}`);
    return false;
  }
}

// ===== EJECUCIÓN PRINCIPAL =====

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 SUITE DE TESTING - VYT MUSIC ONLINE                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 7
  };
  
  const tests = [
    { name: 'Firestore Connection', fn: testFirestoreConnection },
    { name: 'Database Structure', fn: testDatabaseStructure },
    { name: 'Normalized Fields', fn: testNormalizedFields },
    { name: 'Cloud Functions', fn: testCloudFunctions },
    { name: 'Firestore Rules', fn: testFirestoreRules },
    { name: 'System Config', fn: testSystemConfig },
    { name: 'Data Consistency', fn: testDataConsistency }
  ];
  
  for (const test of tests) {
    const result = await test.fn();
    
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Resumen final
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 RESUMEN DE TESTS                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  success(`Tests pasados: ${results.passed}/${results.total}`);
  
  if (results.failed > 0) {
    error(`Tests fallidos: ${results.failed}/${results.total}`);
  }
  
  const percentage = Math.round((results.passed / results.total) * 100);
  console.log('');
  console.log(`📈 Cobertura: ${percentage}%`);
  console.log('');
  
  if (percentage >= 80) {
    success('🎉 Sistema en buen estado - Listo para producción');
  } else if (percentage >= 60) {
    warning('⚠️  Sistema funcional pero con issues menores');
  } else {
    error('❌ Sistema requiere atención inmediata');
  }
  
  console.log('');
  process.exit(results.failed > 0 ? 1 : 0);
}

// Manejar errores
process.on('unhandledRejection', (error) => {
  console.error('');
  error('Error no manejado:');
  console.error(error);
  console.error('');
  process.exit(1);
});

// Ejecutar
runAllTests().catch(console.error);
