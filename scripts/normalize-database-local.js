/**
 * 🔧 NORMALIZACIÓN DE CAMPOS DE BASE DE DATOS - EJECUCIÓN LOCAL
 * 
 * Script para ejecutar normalización sin necesidad de Functions desplegadas
 * Usa Firebase Admin SDK directamente desde Node.js local
 * 
 * USO:
 * 1. Descarga Service Account Key desde Firebase Console:
 *    https://console.firebase.google.com/project/vytonlineprueva/settings/serviceaccounts/adminsdk
 * 2. Guarda el JSON como: service-account-key.json (en esta carpeta)
 * 3. Ejecuta: node normalize-database-local.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ===== CONFIGURACIÓN =====

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account-key.json');
const DRY_RUN = process.argv.includes('--dry-run'); // Modo prueba sin escritura

// Verificar que existe el service account key
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ ERROR: No se encontró service-account-key.json');
  console.error('');
  console.error('📋 PASOS PARA OBTENERLO:');
  console.error('1. Visita: https://console.firebase.google.com/project/vytonlineprueva/settings/serviceaccounts/adminsdk');
  console.error('2. Click en "Generate new private key"');
  console.error('3. Guarda el archivo JSON como: scripts/service-account-key.json');
  console.error('');
  process.exit(1);
}

// Inicializar Firebase Admin
console.log('🔥 Inicializando Firebase Admin...');
admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
  projectId: 'vytonlineprueva'
});

const db = admin.firestore();

// ===== MAPEO DE CAMPOS A NORMALIZAR =====

const FIELD_MAPPINGS = {
  // Colección participantes_online - YA NORMALIZADO ✅
  participantes_online: {
    // No requiere normalización, campos ya en snake_case
  },
  
  // Colección certamenes_provinciales - VACÍA
  certamenes_provinciales: {
    // Vacía actualmente
  },
  
  // Colección artist_profiles - REQUIERE NORMALIZACIÓN
  artist_profiles: {
    nombreArtistico: 'nombre_artistico',
    fotoURL: 'foto_url',
    fechaCreacion: 'fecha_creacion',
    fechaNacimiento: 'fecha_nacimiento'
  }
};

// ===== FUNCIÓN PRINCIPAL =====

async function normalizeCollection(collectionName, fieldMappings) {
  console.log(`\n📂 Procesando colección: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Colección vacía, omitiendo...`);
      return {
        total: 0,
        updated: 0,
        errors: 0
      };
    }
    
    console.log(`   📊 Total documentos: ${snapshot.size}`);
    
    let updated = 0;
    let errors = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;
      
      // Verificar cada campo a normalizar
      for (const [oldField, newField] of Object.entries(fieldMappings)) {
        if (data.hasOwnProperty(oldField)) {
          // ESTRATEGIA: Double-write (mantener ambos campos por 30 días)
          updates[newField] = data[oldField];
          needsUpdate = true;
          
          console.log(`   🔄 ${doc.id}: ${oldField} → ${newField}`);
        }
      }
      
      if (needsUpdate) {
        if (!DRY_RUN) {
          batch.update(doc.ref, updates);
          batchCount++;
          
          // Firestore permite máximo 500 operaciones por batch
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`   💾 Guardados ${batchCount} documentos...`);
            batchCount = 0;
          }
        }
        updated++;
      }
    }
    
    // Commit de operaciones pendientes
    if (batchCount > 0 && !DRY_RUN) {
      await batch.commit();
      console.log(`   💾 Guardados ${batchCount} documentos finales`);
    }
    
    console.log(`   ✅ Completado: ${updated} documentos ${DRY_RUN ? '(modo prueba)' : 'actualizados'}`);
    
    return {
      total: snapshot.size,
      updated,
      errors
    };
    
  } catch (error) {
    console.error(`   ❌ Error procesando ${collectionName}:`, error.message);
    return {
      total: 0,
      updated: 0,
      errors: 1
    };
  }
}

// ===== EJECUCIÓN =====

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔧 NORMALIZACIÓN DE CAMPOS - VYT MUSIC ONLINE           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (DRY_RUN) {
    console.log('⚠️  MODO PRUEBA ACTIVO - No se escribirá en la base de datos');
    console.log('   Para ejecutar la normalización real, quita el flag --dry-run');
    console.log('');
  }
  
  console.log('📋 Estrategia: Double-write (mantener campos legacy 30 días)');
  console.log('');
  
  const results = {};
  
  // Procesar cada colección
  for (const [collectionName, fieldMappings] of Object.entries(FIELD_MAPPINGS)) {
    results[collectionName] = await normalizeCollection(collectionName, fieldMappings);
  }
  
  // Resumen final
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 RESUMEN FINAL                                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  let totalDocs = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  for (const [collectionName, stats] of Object.entries(results)) {
    console.log(`📂 ${collectionName}:`);
    console.log(`   Total: ${stats.total} | Actualizados: ${stats.updated} | Errores: ${stats.errors}`);
    totalDocs += stats.total;
    totalUpdated += stats.updated;
    totalErrors += stats.errors;
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ TOTAL: ${totalDocs} docs | ${totalUpdated} actualizados | ${totalErrors} errores`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  if (!DRY_RUN) {
    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('');
    console.log('1. ✅ Campos normalizados (snake_case)');
    console.log('2. 🔄 Campos legacy mantenidos por compatibilidad');
    console.log('3. ⏰ Después de 30 días, ejecuta cleanup-legacy-fields.js');
    console.log('');
    console.log('📝 NOTA: El código frontend debe actualizarse para usar');
    console.log('   los campos snake_case (nombre_artista, imagen_url)');
    console.log('');
  } else {
    console.log('💡 Para ejecutar la normalización real:');
    console.log('   node normalize-database-local.js');
    console.log('');
  }
  
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('');
  console.error('❌ ERROR NO MANEJADO:');
  console.error(error);
  console.error('');
  process.exit(1);
});

// Ejecutar
main().catch(console.error);
