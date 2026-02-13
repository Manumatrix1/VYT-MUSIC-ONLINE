/**
 * 🔧 SCRIPT DE NORMALIZACIÓN DE CAMPOS - VYT MUSIC ONLINE
 * 
 * Propósito: Unificar nomenclatura de campos en Firestore
 * Estrategia: Double-write (mantener ambos campos durante transición)
 * 
 * EJECUTAR: node scripts/normalize-database-fields.js
 * 
 * ⚠️ IMPORTANTE: Hacer backup de Firestore antes de ejecutar
 */

const admin = require('firebase-admin');
const serviceAccount = require('../functions/.serviceAccountKey.json');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ============================================
// CONFIGURACIÓN DE MAPEOS
// ============================================

const FIELD_MAPPINGS = {
  // Colección: participantes_online
  participantes_online: {
    nombreArtista: 'nombre_artista',  // camelCase → snake_case
    imageUrl: 'imagen_url',
    videoUrl: 'video_url',
    artistName: 'nombre_artista'      // alias en inglés
  },
  
  // Colección: certamenes_provinciales
  certamenes_provinciales: {
    imageUrl: 'imagen_url',
    videoUrl: 'video_url',
    inscripcionUrl: 'url_inscripcion'
  },
  
  // Colección: artist_profiles
  artist_profiles: {
    artistName: 'nombre_artista',
    profileImage: 'imagen_perfil',
    coverImage: 'imagen_portada'
  }
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Normalizar una colección específica
 */
async function normalizeCollection(collectionName, fieldMap) {
  console.log(`\n📦 Procesando colección: ${collectionName}`);
  console.log(`   Mapeos: ${Object.keys(fieldMap).length} campos`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Colección vacía, saltando...`);
      return { processed: 0, updated: 0, errors: 0 };
    }
    
    console.log(`   📊 Documentos encontrados: ${snapshot.size}`);
    
    let processed = 0;
    let updated = 0;
    let errors = 0;
    let skipped = 0;
    
    // Procesar en lotes de 500 (límite de Firestore batch)
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      processed++;
      const docData = doc.data();
      const updates = {};
      let hasChanges = false;
      
      // Verificar cada mapeo
      for (const [oldField, newField] of Object.entries(fieldMap)) {
        // Si el documento tiene el campo antiguo
        if (docData.hasOwnProperty(oldField)) {
          const value = docData[oldField];
          
          // ⭐ ESTRATEGIA DOUBLE-WRITE:
          // 1. Copiar valor al nuevo campo (si no existe)
          if (!docData.hasOwnProperty(newField)) {
            updates[newField] = value;
            hasChanges = true;
          }
          
          // 2. MANTENER el campo antiguo (compatibilidad)
          // NO lo eliminamos todavía
          // updates[oldField] = admin.firestore.FieldValue.delete();
        }
      }
      
      // Agregar metadata de migración
      if (hasChanges) {
        updates._migrated_at = admin.firestore.FieldValue.serverTimestamp();
        updates._migration_version = '1.0';
        
        batch.update(doc.ref, updates);
        batchCount++;
        updated++;
        
        // Commit batch si alcanzamos el límite
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`   ✅ Batch commit: ${batchCount} documentos`);
          batch = db.batch();
          batchCount = 0;
        }
      } else {
        skipped++;
      }
      
      // Progress log cada 100 docs
      if (processed % 100 === 0) {
        console.log(`   🔄 Progreso: ${processed}/${snapshot.size}`);
      }
    }
    
    // Commit final batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Batch final commit: ${batchCount} documentos`);
    }
    
    console.log(`   ✅ Completado: ${updated} actualizados, ${skipped} sin cambios, ${errors} errores`);
    
    return { processed, updated, errors, skipped };
    
  } catch (error) {
    console.error(`   ❌ Error en colección ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Verificar estado de normalización
 */
async function verifyNormalization(collectionName, fieldMap) {
  console.log(`\n🔍 Verificando normalización: ${collectionName}`);
  
  const snapshot = await db.collection(collectionName).get();
  
  let withOldFields = 0;
  let withNewFields = 0;
  let withBothFields = 0;
  let samples = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let hasOld = false;
    let hasNew = false;
    
    for (const [oldField, newField] of Object.entries(fieldMap)) {
      if (data.hasOwnProperty(oldField)) hasOld = true;
      if (data.hasOwnProperty(newField)) hasNew = true;
    }
    
    if (hasOld && hasNew) withBothFields++;
    else if (hasOld) withOldFields++;
    else if (hasNew) withNewFields++;
    
    // Guardar muestra
    if (samples.length < 3) {
      samples.push({
        id: doc.id,
        fields: Object.keys(data).filter(key => 
          Object.keys(fieldMap).includes(key) || 
          Object.values(fieldMap).includes(key)
        )
      });
    }
  }
  
  console.log(`   📊 Estadísticas:`);
  console.log(`      Solo campos antiguos: ${withOldFields}`);
  console.log(`      Solo campos nuevos: ${withNewFields}`);
  console.log(`      Ambos campos (transición): ${withBothFields}`);
  console.log(`      Total documentos: ${snapshot.size}`);
  
  if (samples.length > 0) {
    console.log(`   📝 Muestras:`);
    samples.forEach(s => {
      console.log(`      ${s.id}: [${s.fields.join(', ')}]`);
    });
  }
  
  const successRate = snapshot.size > 0 
    ? ((withNewFields + withBothFields) / snapshot.size * 100).toFixed(1)
    : 0;
  
  console.log(`   ✅ Tasa de éxito: ${successRate}%`);
  
  return {
    total: snapshot.size,
    withOldFields,
    withNewFields,
    withBothFields,
    successRate: parseFloat(successRate)
  };
}

/**
 * Crear índice de campos migrados (para rollback si necesario)
 */
async function createMigrationIndex() {
  console.log(`\n📋 Creando índice de migración...`);
  
  const migrationData = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    version: '1.0',
    strategy: 'double-write',
    collections: Object.keys(FIELD_MAPPINGS),
    mappings: FIELD_MAPPINGS,
    status: 'in_progress'
  };
  
  await db.collection('_system_migrations')
    .doc('normalize_fields_v1')
    .set(migrationData);
  
  console.log(`   ✅ Índice creado en _system_migrations/normalize_fields_v1`);
}

/**
 * Actualizar estado de migración
 */
async function updateMigrationStatus(status, stats) {
  await db.collection('_system_migrations')
    .doc('normalize_fields_v1')
    .update({
      status: status,
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      statistics: stats
    });
}

// ============================================
// SCRIPT PRINCIPAL
// ============================================

async function main() {
  console.log('🚀 INICIANDO NORMALIZACIÓN DE CAMPOS');
  console.log('====================================\n');
  
  const startTime = Date.now();
  const stats = {
    collections: {},
    totalProcessed: 0,
    totalUpdated: 0,
    totalErrors: 0
  };
  
  try {
    // 1. Crear registro de migración
    await createMigrationIndex();
    
    // 2. Procesar cada colección
    for (const [collectionName, fieldMap] of Object.entries(FIELD_MAPPINGS)) {
      const result = await normalizeCollection(collectionName, fieldMap);
      stats.collections[collectionName] = result;
      stats.totalProcessed += result.processed;
      stats.totalUpdated += result.updated;
      stats.totalErrors += result.errors;
    }
    
    // 3. Verificar resultados
    console.log('\n🔍 VERIFICACIÓN POST-MIGRACIÓN');
    console.log('==============================\n');
    
    for (const [collectionName, fieldMap] of Object.entries(FIELD_MAPPINGS)) {
      const verification = await verifyNormalization(collectionName, fieldMap);
      stats.collections[collectionName].verification = verification;
    }
    
    // 4. Actualizar estado
    await updateMigrationStatus('completed', stats);
    
    // 5. Resumen final
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ MIGRACIÓN COMPLETADA');
    console.log('======================\n');
    console.log(`   ⏱️  Duración: ${duration}s`);
    console.log(`   📊 Documentos procesados: ${stats.totalProcessed}`);
    console.log(`   ✅ Documentos actualizados: ${stats.totalUpdated}`);
    console.log(`   ❌ Errores: ${stats.totalErrors}`);
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('==================\n');
    console.log('   1. ✅ Verificar que la aplicación funciona con ambos campos');
    console.log('   2. ⏳ Mantener double-write activo durante 30 días');
    console.log('   3. 🧪 Ejecutar tests de integración');
    console.log('   4. 🗑️  Eliminar campos antiguos con cleanup-legacy-fields.js');
    console.log('\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error);
    await updateMigrationStatus('failed', { error: error.message, ...stats });
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { normalizeCollection, verifyNormalization };
