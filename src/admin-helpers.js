/**
 * 🔧 ADMIN HELPERS - VYT MUSIC ONLINE
 * 
 * Funciones auxiliares para el panel de administración
 * Interfaz simplificada para las nuevas Cloud Functions
 * 
 * Uso: Importar en admin.js o admin.html
 */

// ===== ADMIN CLAIMS HELPERS =====

/**
 * Promover usuario a administrador
 */
async function promoteToAdmin(userId) {
  if (!confirm(`¿Promover usuario ${userId} a administrador?`)) {
    return null;
  }
  
  try {
    const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
    const result = await setAdminClaim({ 
      targetUserId: userId, 
      isAdmin: true 
    });
    
    console.log('✅ Usuario promovido a admin:', result.data);
    alert(`✅ Usuario promovido a administrador exitosamente.\n\nEl usuario debe cerrar sesión y volver a ingresar para que los cambios tomen efecto.`);
    
    return result.data;
  } catch (error) {
    console.error('❌ Error promoviendo a admin:', error);
    alert(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Remover rol de administrador
 */
async function removeAdmin(userId) {
  if (!confirm(`⚠️ ¿Remover permisos de administrador del usuario ${userId}?`)) {
    return null;
  }
  
  try {
    const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
    const result = await setAdminClaim({ 
      targetUserId: userId, 
      isAdmin: false 
    });
    
    console.log('✅ Admin removido:', result.data);
    alert('✅ Permisos de administrador removidos exitosamente.');
    
    return result.data;
  } catch (error) {
    console.error('❌ Error removiendo admin:', error);
    alert(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Listar todos los administradores
 */
async function listAllAdmins() {
  try {
    const listAdmins = httpsCallable(functions, 'listAdmins');
    const result = await listAdmins({});
    
    console.log('📋 Administradores:', result.data);
    
    // Mostrar en consola formateado
    console.table(result.data.admins.map(admin => ({
      Email: admin.email,
      'Has Custom Claim': admin.hasCustomClaim ? '✅' : '❌',
      'Firestore Role': admin.role,
      Disabled: admin.disabled ? '⚠️' : '✓'
    })));
    
    return result.data.admins;
  } catch (error) {
    console.error('❌ Error listando admins:', error);
    throw error;
  }
}

/**
 * Migrar claims de todos los admins existentes
 * ⚠️ Solo ejecutar una vez durante implementación inicial
 */
async function migrateAllAdminClaims() {
  const confirmed = confirm(
    '⚠️ MIGRACIÓN DE ADMIN CLAIMS\n\n' +
    'Esta operación establecerá custom claims para todos los usuarios con role=admin en Firestore.\n\n' +
    '¿Continuar?'
  );
  
  if (!confirmed) {
    return null;
  }
  
  try {
    console.log('🚀 Iniciando migración de admin claims...');
    
    const migrateAdminClaims = httpsCallable(functions, 'migrateAdminClaims');
    const result = await migrateAdminClaims({});
    
    console.log('✅ Migración completada:', result.data);
    
    alert(
      `✅ Migración completada\n\n` +
      `Exitosos: ${result.data.success.length}\n` +
      `Fallidos: ${result.data.failed.length}\n\n` +
      `Los administradores deben cerrar sesión y volver a ingresar.`
    );
    
    return result.data;
  } catch (error) {
    console.error('❌ Error en migración:', error);
    alert(`❌ Error: ${error.message}`);
    throw error;
  }
}

// ===== VYT MONEY HELPERS =====

/**
 * Ajustar balance de VYT Money de un usuario
 */
async function adjustVYTMoneyBalance(userId, amount, reason, category = 'manual_adjustment') {
  // Validaciones
  if (!userId) {
    alert('❌ Error: userId requerido');
    return null;
  }
  
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum)) {
    alert('❌ Error: amount debe ser un número válido');
    return null;
  }
  
  if (!reason || reason.trim().length < 5) {
    alert('❌ Error: Debe proporcionar una razón (mínimo 5 caracteres)');
    return null;
  }
  
  // Confirmación
  const action = amountNum > 0 ? 'agregar' : 'deducir';
  const confirmed = confirm(
    `💰 Ajuste de VYT Money\n\n` +
    `Usuario: ${userId}\n` +
    `Monto: ${amountNum > 0 ? '+' : ''}${amountNum.toLocaleString()} VYT Money\n` +
    `Razón: ${reason}\n\n` +
    `¿Confirmar ${action}?`
  );
  
  if (!confirmed) {
    return null;
  }
  
  try {
    const adjustUserBalance = httpsCallable(functions, 'adjustUserBalance');
    const result = await adjustUserBalance({
      userId: userId,
      amount: amountNum,
      reason: reason,
      category: category
    });
    
    console.log('✅ Balance ajustado:', result.data);
    
    alert(
      `✅ Balance ajustado exitosamente\n\n` +
      `Balance anterior: ${result.data.previousBalance.toLocaleString()}\n` +
      `Ajuste: ${amountNum > 0 ? '+' : ''}${amountNum.toLocaleString()}\n` +
      `Nuevo balance: ${result.data.newBalance.toLocaleString()}\n\n` +
      `Audit Log ID: ${result.data.auditLogId}`
    );
    
    return result.data;
  } catch (error) {
    console.error('❌ Error ajustando balance:', error);
    alert(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Ver historial de auditoría de un usuario
 */
async function viewUserAuditTrail(userId, limit = 50) {
  if (!userId) {
    alert('❌ Error: userId requerido');
    return null;
  }
  
  try {
    const getUserAuditTrail = httpsCallable(functions, 'getUserAuditTrail');
    const result = await getUserAuditTrail({ userId, limit });
    
    console.log('📊 Audit Trail:', result.data);
    
    // Mostrar estadísticas
    const stats = result.data.statistics;
    console.log('📈 Estadísticas:');
    console.table({
      'Total Ajustes': stats.totalAdjustments,
      'Total Agregado': stats.totalAdded.toLocaleString(),
      'Total Deducido': stats.totalDeducted.toLocaleString(),
      'Balance Actual': stats.currentBalance.toLocaleString()
    });
    
    // Mostrar logs
    if (result.data.logs.length > 0) {
      console.log(`\n📋 Últimos ${result.data.logs.length} movimientos:`);
      console.table(result.data.logs.map(log => ({
        Fecha: new Date(log.timestamp).toLocaleString('es-AR'),
        Acción: log.action,
        Monto: log.amount,
        'Balance Anterior': log.previous_balance,
        'Balance Nuevo': log.new_balance,
        Razón: log.reason
      })));
    }
    
    return result.data;
  } catch (error) {
    console.error('❌ Error obteniendo audit trail:', error);
    alert(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Obtener logs de auditoría con filtros
 */
async function getAuditLogs(filters = {}) {
  try {
    const getAuditLogs = httpsCallable(functions, 'getAuditLogs');
    const result = await getAuditLogs(filters);
    
    console.log(`📋 ${result.data.total} logs encontrados`);
    
    if (result.data.logs.length > 0) {
      console.table(result.data.logs.map(log => ({
        ID: log.id.substring(0, 8),
        Fecha: new Date(log.timestamp).toLocaleString('es-AR'),
        Acción: log.action,
        Admin: log.admin_email,
        Usuario: log.target_user_id?.substring(0, 8) || '-',
        Monto: log.amount || '-'
      })));
    }
    
    return result.data.logs;
  } catch (error) {
    console.error('❌ Error obteniendo logs:', error);
    throw error;
  }
}

/**
 * Exportar audit logs a CSV
 */
async function exportAuditLogsCSV(startDate = null, endDate = null, action = null) {
  try {
    console.log('📥 Exportando audit logs...');
    
    const exportAuditLogs = httpsCallable(functions, 'exportAuditLogs', {
      timeout: 300000 // 5 minutos
    });
    
    const result = await exportAuditLogs({ startDate, endDate, action });
    
    // Crear blob y descargar
    const blob = new Blob([result.data.csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log(`✅ ${result.data.recordCount} registros exportados`);
    alert(`✅ ${result.data.recordCount} registros exportados exitosamente`);
    
    return result.data;
  } catch (error) {
    console.error('❌ Error exportando logs:', error);
    alert(`❌ Error: ${error.message}`);
    throw error;
  }
}

// ===== UI HELPERS =====

/**
 * Crear UI simple para ajustar VYT Money
 */
function showVYTMoneyAdjustmentUI(userId) {
  const amount = prompt('Ingrese monto (positivo para agregar, negativo para deducir):');
  if (amount === null) return;
  
  const reason = prompt('Ingrese razón del ajuste:');
  if (reason === null) return;
  
  const categories = ['manual_adjustment', 'refund', 'bonus', 'correction', 'compensation', 'other'];
  const category = prompt(
    `Categoría:\n${categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nIngrese número:`,
    '1'
  );
  
  const selectedCategory = categories[parseInt(category) - 1] || 'manual_adjustment';
  
  adjustVYTMoneyBalance(userId, amount, reason, selectedCategory);
}

/**
 * Mostrar panel de admin claims
 */
async function showAdminClaimsPanel() {
  console.log('\n🔐 ADMIN CLAIMS PANEL');
  console.log('=====================\n');
  console.log('Comandos disponibles:');
  console.log('  listAllAdmins()           - Ver todos los admins');
  console.log('  promoteToAdmin(userId)    - Promover usuario');
  console.log('  removeAdmin(userId)       - Remover admin');
  console.log('  migrateAllAdminClaims()   - Migrar claims (una vez)\n');
  
  await listAllAdmins();
}

/**
 * Mostrar panel de audit logging
 */
function showAuditPanel() {
  console.log('\n📊 AUDIT LOGGING PANEL');
  console.log('=======================\n');
  console.log('Comandos disponibles:');
  console.log('  adjustVYTMoneyBalance(userId, amount, reason)  - Ajustar balance');
  console.log('  viewUserAuditTrail(userId)                     - Ver historial usuario');
  console.log('  getAuditLogs({filters})                        - Ver logs filtrados');
  console.log('  exportAuditLogsCSV()                           - Exportar a CSV\n');
  console.log('Ejemplos:');
  console.log('  adjustVYTMoneyBalance("user123", 1000, "Bonus bienvenida", "bonus")');
  console.log('  viewUserAuditTrail("user123")');
  console.log('  getAuditLogs({ action: "vyt_money_adjustment", limit: 20 })\n');
}

// ===== EXPORT TO WINDOW (Para uso en console) =====

if (typeof window !== 'undefined') {
  window.AdminHelpers = {
    // Admin Claims
    promoteToAdmin,
    removeAdmin,
    listAllAdmins,
    migrateAllAdminClaims,
    showAdminClaimsPanel,
    
    // VYT Money
    adjustVYTMoneyBalance,
    viewUserAuditTrail,
    getAuditLogs,
    exportAuditLogsCSV,
    showVYTMoneyAdjustmentUI,
    showAuditPanel
  };
  
  console.log('✅ Admin Helpers cargados. Usa window.AdminHelpers o:');
  console.log('   showAdminClaimsPanel() - Panel de gestión de admins');
  console.log('   showAuditPanel()       - Panel de audit logging');
}

// Export para módulos ES6
export {
  promoteToAdmin,
  removeAdmin,
  listAllAdmins,
  migrateAllAdminClaims,
  adjustVYTMoneyBalance,
  viewUserAuditTrail,
  getAuditLogs,
  exportAuditLogsCSV,
  showVYTMoneyAdjustmentUI,
  showAdminClaimsPanel,
  showAuditPanel
};
