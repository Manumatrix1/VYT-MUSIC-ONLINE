/**
 * 🗑️ SCRIPT DE LIMPIEZA DE CAMPOS LEGACY - VYT MUSIC ONLINE
 * 
 * Propósito: Eliminar campos antiguos después de período de transición
 * ⚠️ EJECUTAR SOLO DESPUÉS DE 30 DÍAS de double-write exitoso
 * 
 * EJECUTAR: node scripts/cleanup-legacy-fields.js
 * 
 * PRERREQUISITOS:
 * - Verificar que todos los sistemas usan campos nuevos
 * - Hacer backup completo de Firestore
 * - Confirmar que no hay código legacy en producción
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Campos a eliminar (mismos del script de normalización)
const LEGACY_FIELDS = {
  participantes_online: ['nombreArtista', 'imageUrl', 'videoUrl', 'artistName'],
  certamenes_provinciales: ['imageUrl', 'videoUrl', 'inscripcionUrl'],
  artist_profiles: ['artistName', 'profileImage', 'coverImage']
};

/**
 * Solicitar confirmación al usuario
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'si' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Limpiar campos legacy de una colección
 */
async function cleanupCollection(collectionName, fieldsToRemove) {
  console.log(`\n🗑️  Limpiando colección: ${collectionName}`);
  
  const snapshot = await db.collection(collectionName).get();
  
  if (snapshot.empty) {
    console.log(`   ℹ️  Colección vacía`);
    return { processed: 0, cleaned: 0 };
  }
  
  console.log(`   📊 Documentos: ${snapshot.size}`);
  
  let cleaned = 0;
  const batchSize = 500;
  let batch = db.batch();
  let batchCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let hasLegacyFields = false;
    
    for (const field of fieldsToRemove) {
      if (data.hasOwnProperty(field)) {
        updates[field] = admin.firestore.FieldValue.delete();
        hasLegacyFields = true;
      }
    }
    
    if (hasLegacyFields) {
      updates._legacy_cleaned_at = admin.firestore.FieldValue.serverTimestamp();
      batch.update(doc.ref, updates);
      batchCount++;
      cleaned++;
      
      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`   ✅ Batch: ${batchCount} documentos limpiados`);
        batch = db.batch();
        batchCount = 0;
      }
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
    console.log(`   ✅ Batch final: ${batchCount} documentos`);
  }
  
  console.log(`   ✅ Total limpiado: ${cleaned} documentos`);
  
  return { processed: snapshot.size, cleaned };
}

/**
 * Script principal
 */
async function main() {
  console.log('\n🗑️  LIMPIEZA DE CAMPOS LEGACY');
  console.log('============================\n');
  
  // Verificar estado de migración
  const migrationDoc = await db.collection('_system_migrations')
    .doc('normalize_fields_v1')
    .get();
  
  if (!migrationDoc.exists) {
    console.error('❌ Error: No se encontró registro de migración.');
    console.error('   Ejecuta primero: node scripts/normalize-database-fields.js');
    process.exit(1);
  }
  
  const migrationData = migrationDoc.data();
  const migrationDate = migrationData.completed_at?.toDate();
  
  if (migrationDate) {
    const daysSince = (Date.now() - migrationDate.getTime()) / (1000 * 60 * 60 * 24);
    console.log(`📅 Migración completada hace: ${Math.floor(daysSince)} días`);
    
    if (daysSince < 30) {
      console.log('⚠️  ADVERTENCIA: Se recomienda esperar 30 días antes de limpiar.\n');
      const proceed = await askConfirmation('¿Continuar de todas formas? (si/no): ');
      if (!proceed) {
        console.log('❌ Operación cancelada.');
        process.exit(0);
      }
    }
  }
  
  // Confirmación final
  console.log('\n⚠️  ADVERTENCIA IMPORTANTE:');
  console.log('===========================\n');
  console.log('Esta operación es IRREVERSIBLE y eliminará los siguientes campos:\n');
  
  for (const [collection, fields] of Object.entries(LEGACY_FIELDS)) {
    console.log(`   📦 ${collection}:`);
    fields.forEach(field => console.log(`      - ${field}`));
  }
  
  console.log('\n¿Has verificado que:');
  console.log('  ✓ Todos los sistemas usan campos nuevos (snake_case)');
  console.log('  ✓ Existe un backup reciente de Firestore');
  console.log('  ✓ No hay código legacy en producción\n');
  
  const confirmed = await askConfirmation('¿Proceder con la limpieza? (si/no): ');
  
  if (!confirmed) {
    console.log('\n❌ Operación cancelada por el usuario.');
    process.exit(0);
  }
  
  console.log('\n🚀 Iniciando limpieza...\n');
  
  // Ejecutar limpieza
  const stats = {};
  
  for (const [collectionName, fields] of Object.entries(LEGACY_FIELDS)) {
    stats[collectionName] = await cleanupCollection(collectionName, fields);
  }
  
  // Actualizar registro de migración
  await db.collection('_system_migrations')
    .doc('normalize_fields_v1')
    .update({
      legacy_cleaned: true,
      cleanup_completed_at: admin.firestore.FieldValue.serverTimestamp(),
      cleanup_stats: stats
    });
  
  console.log('\n✅ LIMPIEZA COMPLETADA');
  console.log('======================\n');
  
  for (const [collection, stat] of Object.entries(stats)) {
    console.log(`   ${collection}: ${stat.cleaned} de ${stat.processed} documentos`);
  }
  
  console.log('\n');
  process.exit(0);
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
