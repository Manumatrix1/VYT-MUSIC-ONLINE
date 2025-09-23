/**
 * Sistema de Backup Automatizado para VYT-MUSIC-ONLINE
 * Crea respaldos automáticos de Firestore y maneja restauración
 */

const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { logAuditEvent, AUDIT_EVENTS } = require('./audit-logger');

// Inicializar servicios
const db = admin.firestore();
const storage = new Storage();

// Configuración de backup
const BACKUP_CONFIG = {
    // Colecciones críticas para backup
    collections: [
        'users',
        'participantes_online',
        'participantes_presenciales',
        'certamenes_provinciales',
        'votes',
        'transactions',
        'audit_logs',
        'system_config',
        'system_stats'
    ],
    
    // Configuración de retención
    retention: {
        daily: 7,    // 7 días
        weekly: 4,   // 4 semanas
        monthly: 12  // 12 meses
    },
    
    // Bucket de almacenamiento
    bucketName: 'vyt-backups-storage',
    
    // Límites
    maxDocumentsPerCollection: 10000,
    batchSize: 500
};

/**
 * Crear backup completo del sistema
 * @param {string} backupType - Tipo de backup (daily, weekly, monthly, manual)
 * @returns {Promise<Object>} Resultado del backup
 */
async function createSystemBackup(backupType = 'manual') {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const backupId = `backup_${backupType}_${Date.now()}`;
    
    try {
        console.log(`🗄️ Iniciando backup ${backupType} - ID: ${backupId}`);
        
        const backupData = {
            id: backupId,
            type: backupType,
            timestamp,
            collections: {},
            metadata: {
                totalDocuments: 0,
                totalSize: 0,
                collections: []
            }
        };
        
        // Backup de cada colección
        for (const collectionName of BACKUP_CONFIG.collections) {
            try {
                console.log(`📋 Backing up collection: ${collectionName}`);
                
                const collectionData = await backupCollection(collectionName);
                backupData.collections[collectionName] = collectionData.documents;
                
                backupData.metadata.totalDocuments += collectionData.count;
                backupData.metadata.totalSize += collectionData.size;
                backupData.metadata.collections.push({
                    name: collectionName,
                    documents: collectionData.count,
                    size: collectionData.size
                });
                
            } catch (error) {
                console.error(`Error backing up collection ${collectionName}:`, error);
                backupData.collections[collectionName] = {
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }
        
        // Calcular tiempo total
        const duration = Date.now() - startTime;
        backupData.metadata.duration = duration;
        backupData.metadata.durationFormatted = formatDuration(duration);
        
        // Guardar backup localmente
        await saveBackupToFirestore(backupData);
        
        // Subir a Cloud Storage si está configurado
        try {
            await uploadBackupToStorage(backupData);
        } catch (storageError) {
            console.warn('Warning: Failed to upload to Cloud Storage:', storageError.message);
        }
        
        // Log de audit
        await logAuditEvent(AUDIT_EVENTS.BACKUP_CREATED, {
            backupId,
            type: backupType,
            totalDocuments: backupData.metadata.totalDocuments,
            duration
        });
        
        console.log(`✅ Backup completado: ${backupId} (${backupData.metadata.durationFormatted})`);
        
        return {
            success: true,
            backupId,
            metadata: backupData.metadata
        };
        
    } catch (error) {
        console.error(`❌ Error creating backup ${backupId}:`, error);
        
        await logAuditEvent(AUDIT_EVENTS.SYSTEM_ERROR, {
            error: 'Backup failed',
            backupId,
            message: error.message
        });
        
        throw error;
    }
}

/**
 * Backup de una colección específica
 * @param {string} collectionName - Nombre de la colección
 * @returns {Promise<Object>} Datos de la colección
 */
async function backupCollection(collectionName) {
    const documents = [];
    let totalSize = 0;
    
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef
        .limit(BACKUP_CONFIG.maxDocumentsPerCollection)
        .get();
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const docData = {
            id: doc.id,
            data: data
        };
        
        documents.push(docData);
        totalSize += JSON.stringify(docData).length;
    });
    
    return {
        documents,
        count: documents.length,
        size: totalSize
    };
}

/**
 * Guardar backup en Firestore
 * @param {Object} backupData - Datos del backup
 */
async function saveBackupToFirestore(backupData) {
    const backupRef = db.collection('system_backups').doc(backupData.id);
    
    // Guardar metadata
    await backupRef.set({
        id: backupData.id,
        type: backupData.type,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        timestampISO: backupData.timestamp,
        metadata: backupData.metadata,
        status: 'completed'
    });
    
    // Guardar datos de colecciones por separado para evitar límites de documento
    for (const [collectionName, collectionData] of Object.entries(backupData.collections)) {
        if (collectionData && !collectionData.error) {
            const collectionRef = backupRef.collection('collections').doc(collectionName);
            
            // Dividir en chunks si es muy grande
            const chunks = chunkArray(collectionData, BACKUP_CONFIG.batchSize);
            
            for (let i = 0; i < chunks.length; i++) {
                const chunkRef = collectionRef.collection('chunks').doc(`chunk_${i}`);
                await chunkRef.set({
                    data: chunks[i],
                    chunkIndex: i,
                    totalChunks: chunks.length
                });
            }
            
            // Metadata de la colección
            await collectionRef.set({
                name: collectionName,
                totalDocuments: collectionData.length,
                totalChunks: chunks.length,
                backed_up_at: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }
}

/**
 * Subir backup a Cloud Storage
 * @param {Object} backupData - Datos del backup
 */
async function uploadBackupToStorage(backupData) {
    try {
        const fileName = `${backupData.id}.json`;
        const file = storage.bucket(BACKUP_CONFIG.bucketName).file(fileName);
        
        const stream = file.createWriteStream({
            metadata: {
                contentType: 'application/json',
                metadata: {
                    backupId: backupData.id,
                    type: backupData.type,
                    timestamp: backupData.timestamp
                }
            }
        });
        
        return new Promise((resolve, reject) => {
            stream.on('error', reject);
            stream.on('finish', resolve);
            stream.end(JSON.stringify(backupData, null, 2));
        });
        
    } catch (error) {
        console.error('Error uploading to Cloud Storage:', error);
        throw error;
    }
}

/**
 * Restaurar backup del sistema
 * @param {string} backupId - ID del backup a restaurar
 * @param {Object} options - Opciones de restauración
 * @returns {Promise<Object>} Resultado de la restauración
 */
async function restoreBackup(backupId, options = {}) {
    const startTime = Date.now();
    
    try {
        console.log(`🔄 Iniciando restauración del backup: ${backupId}`);
        
        const backupRef = db.collection('system_backups').doc(backupId);
        const backupDoc = await backupRef.get();
        
        if (!backupDoc.exists) {
            throw new Error(`Backup ${backupId} no encontrado`);
        }
        
        const backupMetadata = backupDoc.data();
        
        // Verificar si es seguro restaurar
        if (!options.force && !options.confirmed) {
            throw new Error('Restauración requiere confirmación explícita');
        }
        
        const restoredCollections = [];
        const errors = [];
        
        // Restaurar cada colección
        for (const collectionInfo of backupMetadata.metadata.collections) {
            try {
                await restoreCollection(backupId, collectionInfo.name, options);
                restoredCollections.push(collectionInfo.name);
                
            } catch (error) {
                console.error(`Error restoring collection ${collectionInfo.name}:`, error);
                errors.push({
                    collection: collectionInfo.name,
                    error: error.message
                });
            }
        }
        
        const duration = Date.now() - startTime;
        
        // Log de audit
        await logAuditEvent(AUDIT_EVENTS.BACKUP_RESTORED, {
            backupId,
            restoredCollections,
            errors,
            duration
        });
        
        console.log(`✅ Restauración completada: ${restoredCollections.length} colecciones restauradas`);
        
        return {
            success: true,
            backupId,
            restoredCollections,
            errors,
            duration: formatDuration(duration)
        };
        
    } catch (error) {
        console.error(`❌ Error restoring backup ${backupId}:`, error);
        
        await logAuditEvent(AUDIT_EVENTS.SYSTEM_ERROR, {
            error: 'Backup restoration failed',
            backupId,
            message: error.message
        });
        
        throw error;
    }
}

/**
 * Restaurar una colección específica
 * @param {string} backupId - ID del backup
 * @param {string} collectionName - Nombre de la colección
 * @param {Object} options - Opciones de restauración
 */
async function restoreCollection(backupId, collectionName, options = {}) {
    console.log(`📋 Restaurando colección: ${collectionName}`);
    
    const backupRef = db.collection('system_backups').doc(backupId);
    const collectionRef = backupRef.collection('collections').doc(collectionName);
    const collectionDoc = await collectionRef.get();
    
    if (!collectionDoc.exists) {
        throw new Error(`Collection backup ${collectionName} not found`);
    }
    
    const collectionData = collectionDoc.data();
    const chunks = [];
    
    // Obtener todos los chunks
    for (let i = 0; i < collectionData.totalChunks; i++) {
        const chunkRef = collectionRef.collection('chunks').doc(`chunk_${i}`);
        const chunkDoc = await chunkRef.get();
        
        if (chunkDoc.exists) {
            chunks.push(...chunkDoc.data().data);
        }
    }
    
    // Limpiar colección existente si se especifica
    if (options.clearFirst) {
        const targetCollection = db.collection(collectionName);
        const existingDocs = await targetCollection.limit(1000).get();
        
        if (!existingDocs.empty) {
            const batch = db.batch();
            existingDocs.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
    }
    
    // Restaurar documentos en lotes
    const targetCollection = db.collection(collectionName);
    const chunkSize = 500;
    
    for (let i = 0; i < chunks.length; i += chunkSize) {
        const batch = db.batch();
        const chunk = chunks.slice(i, i + chunkSize);
        
        chunk.forEach(docData => {
            const docRef = targetCollection.doc(docData.id);
            batch.set(docRef, docData.data);
        });
        
        await batch.commit();
    }
    
    console.log(`✅ Colección ${collectionName} restaurada: ${chunks.length} documentos`);
}

/**
 * Limpiar backups antiguos según política de retención
 * @returns {Promise<Object>} Resultado de la limpieza
 */
async function cleanupOldBackups() {
    try {
        console.log('🧹 Iniciando limpieza de backups antiguos...');
        
        const now = new Date();
        const deletedBackups = [];
        
        // Limpiar backups diarios (mantener últimos 7)
        const dailyQuery = db.collection('system_backups')
            .where('type', '==', 'daily')
            .orderBy('timestamp', 'desc')
            .offset(BACKUP_CONFIG.retention.daily);
        
        const dailySnapshot = await dailyQuery.get();
        for (const doc of dailySnapshot.docs) {
            await deleteBackup(doc.id);
            deletedBackups.push({ id: doc.id, type: 'daily' });
        }
        
        // Limpiar backups semanales (mantener últimos 4)
        const weeklyQuery = db.collection('system_backups')
            .where('type', '==', 'weekly')
            .orderBy('timestamp', 'desc')
            .offset(BACKUP_CONFIG.retention.weekly);
        
        const weeklySnapshot = await weeklyQuery.get();
        for (const doc of weeklySnapshot.docs) {
            await deleteBackup(doc.id);
            deletedBackups.push({ id: doc.id, type: 'weekly' });
        }
        
        // Limpiar backups mensuales (mantener últimos 12)
        const monthlyQuery = db.collection('system_backups')
            .where('type', '==', 'monthly')
            .orderBy('timestamp', 'desc')
            .offset(BACKUP_CONFIG.retention.monthly);
        
        const monthlySnapshot = await monthlyQuery.get();
        for (const doc of monthlySnapshot.docs) {
            await deleteBackup(doc.id);
            deletedBackups.push({ id: doc.id, type: 'monthly' });
        }
        
        console.log(`✅ Limpieza completada: ${deletedBackups.length} backups eliminados`);
        
        return {
            success: true,
            deletedBackups,
            deletedCount: deletedBackups.length
        };
        
    } catch (error) {
        console.error('Error cleaning up old backups:', error);
        throw error;
    }
}

/**
 * Eliminar un backup específico
 * @param {string} backupId - ID del backup a eliminar
 */
async function deleteBackup(backupId) {
    const backupRef = db.collection('system_backups').doc(backupId);
    
    // Eliminar colecciones de datos
    const collectionsSnapshot = await backupRef.collection('collections').get();
    
    for (const collectionDoc of collectionsSnapshot.docs) {
        const chunksSnapshot = await collectionDoc.ref.collection('chunks').get();
        
        // Eliminar chunks
        const batch = db.batch();
        chunksSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        // Eliminar documento de colección
        await collectionDoc.ref.delete();
    }
    
    // Eliminar documento principal del backup
    await backupRef.delete();
    
    console.log(`🗑️ Backup eliminado: ${backupId}`);
}

/**
 * Obtener lista de backups disponibles
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Array>} Lista de backups
 */
async function getAvailableBackups(filters = {}) {
    let query = db.collection('system_backups');
    
    if (filters.type) {
        query = query.where('type', '==', filters.type);
    }
    
    query = query.orderBy('timestamp', 'desc');
    
    if (filters.limit) {
        query = query.limit(filters.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Utilidades
 */
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

module.exports = {
    createSystemBackup,
    restoreBackup,
    cleanupOldBackups,
    getAvailableBackups,
    BACKUP_CONFIG
};