/**
 * 🔐 ADMIN CLAIMS MANAGEMENT - VYT MUSIC ONLINE
 * 
 * Funciones para gestionar Custom Claims de administradores
 * Reemplaza el sistema actual de role en Firestore por claims nativos de Firebase Auth
 * 
 * Beneficios:
 * - 0 queries adicionales (claims incluidos en token)
 * - Más seguro (firmados por Firebase)
 * - Mejor performance
 */

const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// ===== SET ADMIN CLAIM =====

/**
 * Establecer custom claim de administrador
 * Solo puede ser ejecutado por super-admin existente
 */
exports.setAdminClaim = onCall(async (data, context) => {
  try {
    // ===== VALIDACIÓN DE PERMISOS =====
    
    const caller = context.auth;
    
    if (!caller) {
      throw new Error('No autenticado');
    }
    
    // Verificar que caller es admin actual (durante transición)
    // Primero revisar custom claim
    let isCallerAdmin = caller.token.admin === true;
    
    // Fallback a Firestore durante transición
    if (!isCallerAdmin) {
      const callerDoc = await admin.firestore()
        .collection('users')
        .doc(caller.uid)
        .get();
      
      if (callerDoc.exists) {
        isCallerAdmin = callerDoc.data().role === 'admin';
      }
    }
    
    if (!isCallerAdmin) {
      throw new Error('Permisos insuficientes: se requiere rol de administrador');
    }
    
    // ===== ESTABLECER CUSTOM CLAIM =====
    
    const { targetUserId, isAdmin } = request.data;
    
    if (!targetUserId) {
      throw new Error('targetUserId requerido');
    }
    
    // Validar que el usuario existe
    let targetUser;
    try {
      targetUser = await admin.auth().getUser(targetUserId);
    } catch (error) {
      throw new Error(`Usuario no encontrado: ${targetUserId}`);
    }
    
    // Establecer custom claims
    await admin.auth().setCustomUserClaims(targetUserId, {
      admin: isAdmin === true,
      role: isAdmin ? 'admin' : 'user',
      updatedAt: Date.now()
    });
    
    // Sincronizar con Firestore (mantener compatibilidad)
    await admin.firestore()
      .collection('users')
      .doc(targetUserId)
      .set({
        role: isAdmin ? 'admin' : 'user',
        isAdmin: isAdmin === true,
        customClaims: {
          admin: isAdmin === true,
          role: isAdmin ? 'admin' : 'user'
        },
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_by: caller.uid
      }, { merge: true });
    
    // ===== AUDIT LOG =====
    
    await admin.firestore()
      .collection('audit_logs')
      .add({
        action: 'set_admin_claim',
        performed_by: caller.uid,
        performed_by_email: caller.token.email,
        target_user_id: targetUserId,
        target_user_email: targetUser.email,
        new_admin_status: isAdmin,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: request.rawRequest?.ip,
        user_agent: request.rawRequest?.headers?.['user-agent']
      });
    
    console.log(`✅ Admin claim actualizado: ${targetUserId} -> admin: ${isAdmin}`);
    
    return {
      success: true,
      message: `Usuario ${isAdmin ? 'promovido a' : 'removido de'} administrador`,
      userId: targetUserId,
      isAdmin: isAdmin
    };
    
  } catch (error) {
    console.error('❌ Error en setAdminClaim:', error);
    throw new Error(`Error al establecer claim: ${error.message}`);
  }
});

// ===== GET USER CLAIMS =====

/**
 * Obtener custom claims de un usuario
 * Útil para debugging y verificación
 */
exports.getUserClaims = onCall({
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ]
}, async (request) => {
  try {
    const caller = request.auth;
    
    if (!caller) {
      throw new Error('No autenticado');
    }
    
    const { userId } = data;
    const targetUserId = userId || caller.uid; // Por defecto, el usuario actual
    
    // Solo admins pueden ver claims de otros usuarios
    if (targetUserId !== caller.uid && !caller.token.admin) {
      throw new Error('Solo administradores pueden ver claims de otros usuarios');
    }
    
    const user = await admin.auth().getUser(targetUserId);
    
    return {
      success: true,
      userId: targetUserId,
      email: user.email,
      customClaims: user.customClaims || {},
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    };
    
  } catch (error) {
    console.error('❌ Error en getUserClaims:', error);
    throw new Error(error.message);
  }
});

// ===== REFRESH TOKEN =====

/**
 * Forzar refresh del token del usuario
 * Necesario después de cambiar custom claims
 */
exports.refreshUserToken = onCall({
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ]
}, async (request) => {
  const caller = request.auth;
  
  if (!caller) {
    throw new Error('No autenticado');
  }
  
  // Obtener claims actualizados
  const user = await admin.auth().getUser(caller.uid);
  
  return {
    success: true,
    message: 'Token actualizado. Recarga la página para aplicar cambios.',
    customClaims: user.customClaims || {}
  };
});

// ===== LIST ADMINS =====

/**
 * Listar todos los usuarios con rol de administrador
 * Solo accesible por admins
 */
exports.listAdmins = onCall({
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ]
}, async (request) => {
  try {
    const caller = request.auth;
    
    if (!caller || !caller.token.admin) {
      throw new Error('Solo administradores pueden listar admins');
    }
    
    // Buscar en Firestore (más eficiente que iterar todos los usuarios)
    const adminsSnapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();
    
    const admins = [];
    
    for (const doc of adminsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener info de Firebase Auth
      let authUser = null;
      try {
        authUser = await admin.auth().getUser(doc.id);
      } catch (error) {
        console.warn(`Usuario ${doc.id} no existe en Auth`);
      }
      
      admins.push({
        uid: doc.id,
        email: data.email || authUser?.email,
        displayName: data.displayName || authUser?.displayName,
        role: data.role,
        isAdmin: data.isAdmin,
        customClaims: authUser?.customClaims || {},
        hasCustomClaim: authUser?.customClaims?.admin === true,
        lastUpdate: data.updated_at,
        disabled: authUser?.disabled || false
      });
    }
    
    return {
      success: true,
      admins: admins,
      total: admins.length
    };
    
  } catch (error) {
    console.error('❌ Error en listAdmins:', error);
    throw new Error(error.message);
  }
});

// ===== BATCH SET CLAIMS (Para migración inicial) =====

/**
 * Establecer custom claims para todos los admins existentes
 * ⚠️ Solo para uso durante migración inicial
 */
exports.migrateAdminClaims = onCall({
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ]
}, async (request) => {
  try {
    const caller = request.auth;
    
    // Verificación estricta
    if (!caller || !caller.token.admin) {
      const callerDoc = await admin.firestore()
        .collection('users')
        .doc(caller.uid)
        .get();
      
      if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        throw new Error('Solo super-admin puede ejecutar migración');
      }
    }
    
    console.log('🚀 Iniciando migración de admin claims...');
    
    // Buscar todos los admins en Firestore
    const adminsSnapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();
    
    console.log(`📊 Admins encontrados: ${adminsSnapshot.size}`);
    
    const results = {
      success: [],
      failed: [],
      total: adminsSnapshot.size
    };
    
    for (const doc of adminsSnapshot.docs) {
      try {
        await admin.auth().setCustomUserClaims(doc.id, {
          admin: true,
          role: 'admin',
          migratedAt: Date.now()
        });
        
        await doc.ref.update({
          customClaims: {
            admin: true,
            role: 'admin'
          },
          claims_migrated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        results.success.push(doc.id);
        console.log(`✅ Migrado: ${doc.id} (${doc.data().email})`);
        
      } catch (error) {
        results.failed.push({ userId: doc.id, error: error.message });
        console.error(`❌ Error migrando ${doc.id}:`, error.message);
      }
    }
    
    // Audit log
    await admin.firestore()
      .collection('audit_logs')
      .add({
        action: 'batch_migrate_admin_claims',
        performed_by: caller.uid,
        results: results,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log(`✅ Migración completada: ${results.success.length} exitosos, ${results.failed.length} fallidos`);
    
    return {
      success: true,
      message: 'Migración completada',
      ...results
    };
    
  } catch (error) {
    console.error('❌ Error en migrateAdminClaims:', error);
    throw new Error(error.message);
  }
});
