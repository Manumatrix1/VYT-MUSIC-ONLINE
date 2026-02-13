/**
 * 🔄 SCRIPT DE MIGRACIÓN DE CERTÁMENES
 * 
 * Migra datos de certamenes_online → certamenes_provinciales
 * Normaliza campos y estructura para compatibilidad total
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abrir la consola del navegador en la página de Admin (admin.html)
 * 2. Copiar y pegar todo este código
 * 3. Ejecutar: await migrateCertamenes()
 * 4. Verificar los resultados en la consola
 */

async function migrateCertamenes() {
    console.log('🔄 ========================================');
    console.log('🔄 INICIANDO MIGRACIÓN DE CERTÁMENES');
    console.log('🔄 ========================================');
    
    try {
        // Verificar que Firebase esté disponible
        if (typeof db === 'undefined') {
            throw new Error('❌ Firebase no está inicializado. Asegúrate de estar en admin.html con sesión activa.');
        }
        
        // 1️⃣ LEER CERTÁMENES DE certamenes_online
        console.log('\n📖 Paso 1: Leyendo certámenes de certamenes_online...');
        const { collection, getDocs, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const onlineSnapshot = await getDocs(collection(db, 'certamenes_online'));
        
        if (onlineSnapshot.empty) {
            console.log('ℹ️  No hay certámenes en certamenes_online para migrar');
            console.log('✅ Si ya migraste anteriormente, todo está OK');
            return;
        }
        
        console.log(`📊 Encontrados ${onlineSnapshot.size} certámenes en certamenes_online`);
        
        // 2️⃣ LEER CERTÁMENES EXISTENTES EN certamenes_provinciales
        console.log('\n🔍 Paso 2: Verificando certámenes existentes en certamenes_provinciales...');
        const provincialSnapshot = await getDocs(collection(db, 'certamenes_provinciales'));
        const existingNames = new Set();
        
        provincialSnapshot.forEach(doc => {
            const data = doc.data();
            const nombre = data.nombre || data.name || '';
            if (nombre) existingNames.add(nombre.toLowerCase().trim());
        });
        
        console.log(`📊 Ya existen ${provincialSnapshot.size} certámenes en certamenes_provinciales`);
        
        // 3️⃣ MIGRAR CADA CERTAMEN
        console.log('\n🚀 Paso 3: Migrando certámenes...');
        let migrated = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const doc of onlineSnapshot.docs) {
            const oldData = doc.data();
            const nombreOriginal = oldData.name || oldData.nombre || `Certamen ${doc.id}`;
            
            // Verificar si ya existe
            if (existingNames.has(nombreOriginal.toLowerCase().trim())) {
                console.log(`⏭️  Saltando "${nombreOriginal}" (ya existe en destino)`);
                skipped++;
                continue;
            }
            
            try {
                // Normalizar datos al formato correcto
                const normalizedData = {
                    // Campos principales (ESPAÑOL)
                    nombre: nombreOriginal,
                    provincia: oldData.provincia || 'Buenos Aires', // Default si no existe
                    descripcion: oldData.descripcion || oldData.description || '',
                    
                    // Económico
                    precio: Number(oldData.precio || oldData.precio_inscripcion || 5000),
                    precio_inscripcion: Number(oldData.precio || oldData.precio_inscripcion || 5000),
                    
                    // Fechas (generar por defecto si no existen)
                    fecha_inicio: oldData.fecha_inicio || new Date().toISOString().split('T')[0],
                    fecha_fin: oldData.fecha_fin || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                    
                    // Estado
                    activo: oldData.activo ?? true,
                    ranking_habilitado: oldData.ranking_habilitado ?? true,
                    
                    // Multimedia
                    imagen_url: oldData.imagen_url || oldData.imageUrl || '',
                    imageUrl: oldData.imagen_url || oldData.imageUrl || '',
                    videoUrl: oldData.videoUrl || oldData.video_url || '',
                    url_inscripcion: oldData.url_inscripcion || '',
                    
                    // Organización
                    orden: Number(oldData.orden || 0),
                    
                    // Metadata
                    createdAt: oldData.createdAt || serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    
                    // Información de migración
                    migrated_from: 'certamenes_online',
                    migration_date: serverTimestamp(),
                    original_id: doc.id
                };
                
                // Guardar en certamenes_provinciales
                await addDoc(collection(db, 'certamenes_provinciales'), normalizedData);
                
                console.log(`✅ Migrado: "${nombreOriginal}" → certamenes_provinciales`);
                migrated++;
                
            } catch (error) {
                console.error(`❌ Error migrando "${nombreOriginal}":`, error.message);
                errors++;
            }
        }
        
        // 4️⃣ RESUMEN FINAL
        console.log('\n📊 ========================================');
        console.log('📊 RESULTADO DE LA MIGRACIÓN');
        console.log('📊 ========================================');
        console.log(`✅ Migrados exitosamente: ${migrated}`);
        console.log(`⏭️  Saltados (duplicados): ${skipped}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`📈 Total procesados: ${onlineSnapshot.size}`);
        
        if (migrated > 0) {
            console.log('\n🎉 ¡MIGRACIÓN COMPLETADA!');
            console.log('👉 Los certámenes ahora son visibles en el frontend público');
            console.log('👉 Puedes verificarlos en la página de certámenes');
            console.log('\n⚠️  OPCIONAL: Puedes eliminar certamenes_online manualmente desde Firebase Console');
        } else if (skipped > 0) {
            console.log('\n✅ MIGRACIÓN PREVIAMENTE COMPLETADA');
            console.log('📝 Todos los certámenes ya estaban migrados');
        } else {
            console.log('\nℹ️  No había certámenes para migrar');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO EN LA MIGRACIÓN:', error);
        console.error('Stack:', error.stack);
        throw error;
    }
}

// Exportar para uso global
window.migrateCertamenes = migrateCertamenes;

console.log('✅ Script de migración cargado');
console.log('👉 Para iniciar la migración, ejecuta: await migrateCertamenes()');
