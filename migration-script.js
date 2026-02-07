/**
 * SCRIPT DE MIGRACION DE DATOS - VYT MUSIC ONLINE
 * Ejecutar MANUALMENTE en consola de Firebase o como Cloud Function
 * 
 * OBJETIVO: Estandarizar datos existentes después de los fixes
 * 
 * CAMBIOS A APLICAR:
 * 1. Agregar campo "estado" a inscripciones que solo tienen "aprobado"
 * 2. Copiar docs de "participantes_presenciales" (plural) a "participantes_presencial" (singular)
 * 3. Verificar que todos los docs tienen los campos requeridos
 */

const admin = require('firebase-admin');

// Inicializar (si no está inicializado)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// =================================================================
// PASO 1: Agregar campo "estado" a participantes_online
// =================================================================
async function migrarEstadoParticipantesOnline() {
    console.log('📝 PASO 1: Migrando campo "estado" en participantes_online...');
    
    try {
        const snapshot = await db.collection('participantes_online').get();
        
        if (snapshot.empty) {
            console.log('⚠️ No hay participantes online para migrar');
            return;
        }
        
        const batch = db.batch();
        let count = 0;
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Solo actualizar si NO tiene campo "estado"
            if (!data.estado) {
                let nuevoEstado = 'pendiente';
                
                // Inferir estado desde campo "aprobado"
                if (data.aprobado === true) {
                    nuevoEstado = 'aprobado';
                } else if (data.rechazado === true) {
                    nuevoEstado = 'rechazado';
                }
                
                batch.update(doc.ref, {
                    estado: nuevoEstado,
                    // NO eliminar campo "aprobado" para mantener compatibilidad
                    migrado: true,
                    fecha_migracion: admin.firestore.FieldValue.serverTimestamp()
                });
                
                count++;
            }
        });
        
        if (count > 0) {
            await batch.commit();
            console.log(`✅ ${count} participantes online migrados`);
        } else {
            console.log('✅ Todos los participantes online ya tienen campo "estado"');
        }
        
    } catch (error) {
        console.error('❌ Error en migración participantes_online:', error);
        throw error;
    }
}

// =================================================================
// PASO 2: Copiar participantes_presenciales → participantes_presencial
// =================================================================
async function migrarColeccionPresenciales() {
    console.log('📝 PASO 2: Copiando participantes_presenciales → participantes_presencial...');
    
    try {
        const oldCollectionRef = db.collection('participantes_presenciales');
        const newCollectionRef = db.collection('participantes_presencial');
        
        const snapshot = await oldCollectionRef.get();
        
        if (snapshot.empty) {
            console.log('⚠️ No hay participantes presenciales para migrar');
            return;
        }
        
        console.log(`📊 Encontrados ${snapshot.size} documentos para copiar`);
        
        const batch = db.batch();
        let count = 0;
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Verificar si ya existe en la nueva colección
            const existingDoc = await newCollectionRef.doc(doc.id).get();
            
            if (!existingDoc.exists) {
                // Agregar campo "estado" si no existe
                const migratedData = {
                    ...data,
                    estado: data.estado || (data.aprobado === true ? 'aprobado' : 'pendiente'),
                    migrado: true,
                    fecha_migracion: admin.firestore.FieldValue.serverTimestamp()
                };
                
                batch.set(newCollectionRef.doc(doc.id), migratedData);
                count++;
            }
        }
        
        if (count > 0) {
            await batch.commit();
            console.log(`✅ ${count} participantes presenciales copiados a colección singular`);
            console.log('⚠️ IMPORTANTE: Verificar manualmente antes de eliminar colección antigua');
        } else {
            console.log('✅ Todos los documentos ya existen en la colección nueva');
        }
        
    } catch (error) {
        console.error('❌ Error en migración colección presenciales:', error);
        throw error;
    }
}

// =================================================================
// PASO 3: Agregar campo "estado" a participantes_presencial
// =================================================================
async function migrarEstadoParticipantesPresencial() {
    console.log('📝 PASO 3: Migrando campo "estado" en participantes_presencial...');
    
    try {
        const snapshot = await db.collection('participantes_presencial').get();
        
        if (snapshot.empty) {
            console.log('⚠️ No hay participantes presenciales para migrar');
            return;
        }
        
        const batch = db.batch();
        let count = 0;
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            if (!data.estado) {
                let nuevoEstado = 'pendiente';
                
                if (data.aprobado === true) {
                    nuevoEstado = 'aprobado';
                } else if (data.rechazado === true) {
                    nuevoEstado = 'rechazado';
                }
                
                batch.update(doc.ref, {
                    estado: nuevoEstado,
                    migrado: true,
                    fecha_migracion: admin.firestore.FieldValue.serverTimestamp()
                });
                
                count++;
            }
        });
        
        if (count > 0) {
            await batch.commit();
            console.log(`✅ ${count} participantes presenciales migrados`);
        } else {
            console.log('✅ Todos los participantes presenciales ya tienen campo "estado"');
        }
        
    } catch (error) {
        console.error('❌ Error en migración participantes_presencial:', error);
        throw error;
    }
}

// =================================================================
// FUNCIÓN PRINCIPAL - Ejecutar todos los pasos
// =================================================================
async function ejecutarMigracionCompleta() {
    console.log('🚀 INICIANDO MIGRACIÓN DE DATOS VYT MUSIC ONLINE\n');
    console.log('⏰ ' + new Date().toLocaleString());
    console.log('=' .repeat(60) + '\n');
    
    try {
        await migrarEstadoParticipantesOnline();
        console.log('');
        
        await migrarColeccionPresenciales();
        console.log('');
        
        await migrarEstadoParticipantesPresencial();
        console.log('');
        
        console.log('=' .repeat(60));
        console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
        console.log('⏰ ' + new Date().toLocaleString());
        console.log('\n📋 SIGUIENTES PASOS:');
        console.log('   1. Verificar datos en Firestore Console');
        console.log('   2. Probar funcionalidad en admin panel');
        console.log('   3. Si todo funciona, eliminar colección "participantes_presenciales" (plural)');
        console.log('   4. Desplegar firestore.rules actualizadas');
        
    } catch (error) {
        console.error('\n❌ ERROR EN MIGRACIÓN:', error);
        console.error('⚠️ Revertir cambios si es necesario');
        process.exit(1);
    }
}

// =================================================================
// EXPORTAR FUNCIONES
// =================================================================
module.exports = {
    ejecutarMigracionCompleta,
    migrarEstadoParticipantesOnline,
    migrarColeccionPresenciales,
    migrarEstadoParticipantesPresencial
};

// Si se ejecuta directamente
if (require.main === module) {
    ejecutarMigracionCompleta()
        .then(() => {
            console.log('\n✅ Script finalizado');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Script fallido:', error);
            process.exit(1);
        });
}
