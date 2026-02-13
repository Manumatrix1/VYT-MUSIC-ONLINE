/**
 * 💰 VYT MONEY AUDIT LOGGING - VYT MUSIC ONLINE
 * 
 * Sistema de audit logging para todas las operaciones de VYT Money
 * Garantiza trazabilidad completa de transacciones y ajustes
 */

const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// ===== ADJUST USER BALANCE (Con Audit Log Obligatorio) =====

/**
 * Ajustar balance de VYT Money de un usuario
 * Solo accesible por administradores
 * Registra automáticamente en audit log
 */
exports.adjustUserBalance = onCall({cors: ["https://manumatrix1.github.io", "http://127.0.0.1:3000", "http://localhost:3000"]}, async (request) => {
  try {
    const caller = request.auth;
    
    if (!caller) {
      throw new Error('No autenticado');
    }
    
    // Verificar admin (custom claim o Firestore)
    let isAdmin = caller.token?.admin === true;
    
    if (!isAdmin) {
      const callerDoc = await admin.firestore()
        .collection('users')
        .doc(caller.uid)
        .get();
      
      isAdmin = callerDoc.exists && callerDoc.data().role === 'admin';
    }
    
    if (!isAdmin) {
      throw new Error('Permisos insuficientes: se requiere rol de administrador');
    }
    
    // ===== VALIDACIÓN DE DATOS =====
    
    const { userId, amount, reason, category } = request.data;
    
    if (!userId) {
      throw new Error('userId requerido');
    }
    
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('amount debe ser un número válido');
    }
    
    if (!reason || reason.trim().length < 5) {
      throw new Error('reason requerido (mínimo 5 caracteres)');
    }
    
    const validCategories = ['manual_adjustment', 'refund', 'bonus', 'correction', 'compensation', 'other'];
    const adjustmentCategory = category && validCategories.includes(category) 
      ? category 
      : 'manual_adjustment';
    
    // ===== TRANSACCIÓN ATÓMICA =====
    
    const result = await admin.firestore().runTransaction(async (transaction) => {
      // 1. Leer balance actual
      const userMoneyRef = admin.firestore().collection('user_vyt_money').doc(userId);
      const userMoneyDoc = await transaction.get(userMoneyRef);
      
      const currentBalance = userMoneyDoc.exists ? (userMoneyDoc.data().balance || 0) : 0;
      const newBalance = currentBalance + amount;
      
      // Validar que no resulte en balance negativo
      if (newBalance < 0) {
        throw new Error(`Operación inválida: balance resultante sería negativo (${newBalance})`);
      }
      
      // 2. Actualizar balance
      const updateData = {
        balance: newBalance,
        last_modified: admin.firestore.FieldValue.serverTimestamp(),
        last_modified_by: caller.uid
      };
      
      if (userMoneyDoc.exists) {
        transaction.update(userMoneyRef, updateData);
      } else {
        transaction.set(userMoneyRef, {
          ...updateData,
          total_purchased: 0,
          total_spent: 0,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // 3. Crear audit log (OBLIGATORIO)
      const auditLogRef = admin.firestore().collection('audit_logs').doc();
      transaction.set(auditLogRef, {
        action: 'vyt_money_adjustment',
        category: adjustmentCategory,
        admin_uid: caller.uid,
        admin_email: caller.token?.email || 'unknown',
        target_user_id: userId,
        amount: amount,
        previous_balance: currentBalance,
        new_balance: newBalance,
        reason: reason,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: request.rawRequest?.ip,
        user_agent: request.rawRequest?.headers?.['user-agent'],
        metadata: {
          source: 'admin_panel',
          function: 'adjustUserBalance'
        }
      });
      
      // 4. Crear notificación para el usuario
      const notificationRef = admin.firestore().collection('notificaciones').doc();
      transaction.set(notificationRef, {
        userId: userId,
        type: 'vyt_money_adjustment',
        title: amount > 0 ? '💰 Crédito añadido' : '💸 Ajuste de balance',
        message: `Tu balance de VYT Money ha sido ${amount > 0 ? 'incrementado' : 'ajustado'} por un administrador. Nuevo balance: ${newBalance.toLocaleString()} VYT Money.`,
        amount: amount,
        previousBalance: currentBalance,
        newBalance: newBalance,
        reason: reason,
        leida: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        userId,
        previousBalance: currentBalance,
        newBalance: newBalance,
        adjustment: amount,
        auditLogId: auditLogRef.id
      };
    });
    
    console.log(`✅ Balance ajustado: Usuario ${userId}, ${amount > 0 ? '+' : ''}${amount} VYT Money`);
    
    return {
      success: true,
      message: 'Balance ajustado exitosamente',
      ...result
    };
    
  } catch (error) {
    console.error('❌ Error en adjustUserBalance:', error);
    throw new Error(`Error al ajustar balance: ${error.message}`);
  }
});

// ===== GET AUDIT LOGS =====

/**
 * Obtener logs de auditoría filtrados
 * Solo accesible por administradores
 */
exports.getAuditLogs = onCall({
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ]
}, async (request) => {
  try {
    const caller = request.auth;
    
    if (!caller || !caller.token?.admin) {
      throw new Error('Solo administradores pueden acceder a audit logs');
    }
    
    const { 
      action, 
      targetUserId, 
      adminUid, 
      startDate, 
      endDate, 
      limit = 50 
    } = request.data;
    
    // Construir query
    let query = admin.firestore().collection('audit_logs');
    
    if (action) {
      query = query.where('action', '==', action);
    }
    
    if (targetUserId) {
      query = query.where('target_user_id', '==', targetUserId);
    }
    
    if (adminUid) {
      query = query.where('admin_uid', '==', adminUid);
    }
    
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }
    
    // Ordenar por fecha descendente
    query = query.orderBy('timestamp', 'desc').limit(Math.min(limit, 100));
    
    const snapshot = await query.get();
    
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString()
    }));
    
    return {
      success: true,
      logs: logs,
      total: logs.length
    };
    
  } catch (error) {
    console.error('❌ Error en getAuditLogs:', error);
    throw new Error(error.message);
  }
});

// ===== GET USER AUDIT TRAIL =====

/**
 * Obtener historial completo de auditoría de un usuario específico
 */
exports.getUserAuditTrail = onCall({
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ]
}, async (request) => {
  try {
    const caller = request.auth;
    
    if (!caller || !caller.token?.admin) {
      throw new Error('Solo administradores pueden acceder a audit trails');
    }
    
    const { userId, limit = 50 } = data;
    
    if (!userId) {
      throw new Error('userId requerido');
    }
    
    // Buscar todos los logs relacionados con el usuario
    const logsSnapshot = await admin.firestore()
      .collection('audit_logs')
      .where('target_user_id', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString()
    }));
    
    // Obtener balance actual
    const userMoneyDoc = await admin.firestore()
      .collection('user_vyt_money')
      .doc(userId)
      .get();
    
    const currentBalance = userMoneyDoc.exists ? (userMoneyDoc.data().balance || 0) : 0;
    
    // Calcular estadísticas
    const stats = {
      totalAdjustments: logs.filter(l => l.action === 'vyt_money_adjustment').length,
      totalAdded: logs
        .filter(l => l.action === 'vyt_money_adjustment' && l.amount > 0)
        .reduce((sum, l) => sum + l.amount, 0),
      totalDeducted: logs
        .filter(l => l.action === 'vyt_money_adjustment' && l.amount < 0)
        .reduce((sum, l) => sum + Math.abs(l.amount), 0),
      currentBalance: currentBalance
    };
    
    return {
      success: true,
      userId: userId,
      logs: logs,
      statistics: stats,
      total: logs.length
    };
    
  } catch (error) {
    console.error('❌ Error en getUserAuditTrail:', error);
    throw new Error(error.message);
  }
});

// ===== EXPORT AUDIT LOGS =====

/**
 * Exportar audit logs en formato CSV
 * Útil para compliance y reportes
 */
exports.exportAuditLogs = onCall({
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ],
  timeoutSeconds: 300 // 5 minutos para exports grandes
}, async (request) => {
  try {
    const caller = request.auth;
    
    if (!caller || !caller.token?.admin) {
      throw new Error('Solo administradores pueden exportar logs');
    }
    
    const { startDate, endDate, action } = data;
    
    let query = admin.firestore()
      .collection('audit_logs')
      .orderBy('timestamp', 'desc');
    
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }
    
    if (action) {
      query = query.where('action', '==', action);
    }
    
    const snapshot = await query.get();
    
    // Convertir a CSV
    const csvHeader = 'ID,Timestamp,Action,Admin UID,Admin Email,Target User,Amount,Previous Balance,New Balance,Reason,IP\n';
    
    const csvRows = snapshot.docs.map(doc => {
      const data = doc.data();
      return [
        doc.id,
        data.timestamp?.toDate().toISOString() || '',
        data.action || '',
        data.admin_uid || '',
        data.admin_email || '',
        data.target_user_id || '',
        data.amount || '',
        data.previous_balance || '',
        data.new_balance || '',
        `"${(data.reason || '').replace(/"/g, '""')}"`, // Escapar comillas
        data.ip || ''
      ].join(',');
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Crear audit log del export
    await admin.firestore().collection('audit_logs').add({
      action: 'export_audit_logs',
      performed_by: caller.uid,
      performed_by_email: caller.token?.email,
      records_exported: snapshot.size,
      filters: { startDate, endDate, action },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      csvContent: csvContent,
      recordCount: snapshot.size,
      exportDate: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en exportAuditLogs:', error);
    throw new Error(error.message);
  }
});
