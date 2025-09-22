/**
 * VYT MUSIC ONLINE - FIREBASE FUNCTIONS INDEX - VERSIÓN MÍNIMA V1
 * Solo funciones básicas para que el sistema funcione
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ===== FUNCIONES BÁSICAS MÍNIMAS =====

// Health Check - HTTP (sin autenticación)
exports.healthCheck = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'VYT Music Online - Sistema básico funcionando',
    version: '1.0.0-minimal'
  });
});

// Inicializar estructura básica de Firestore - HTTP (sin autenticación)
exports.initializeFirestoreStructure = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    console.log('🔄 Inicializando estructura de Firestore...');
    
    // Configuración de precios
    await db.collection('system_config').doc('pricing').set({
      vyt_money: {
        precio_por_100: 100,
        moneda: 'ARS',
        activo: true,
        descuentos: {
          500: 5,
          1000: 10,
          2000: 15
        }
      },
      inscripcion_online: {
        precio_base: 15000,
        moneda: 'ARS',
        activo: true,
        descuento_temprano: 20
      },
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Configuración del sistema
    await db.collection('system_config').doc('general').set({
      site_name: 'VYT Music Online',
      certamen_activo: true,
      inscripciones_abiertas: true,
      voting_enabled: true,
      maintenance_mode: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Estadísticas del sistema
    await db.collection('system_stats').doc('global').set({
      total_users: 0,
      total_payments: 0,
      total_vyt_money_issued: 0,
      total_votes: 0,
      prize_pool: 0,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Estructura de Firestore inicializada');
    res.json({
      success: true,
      message: 'Estructura de Firestore inicializada correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error inicializando Firestore:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obtener estadísticas - HTTP
exports.getSystemStats = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    console.log('📊 Obteniendo estadísticas del sistema...');
    
    // Intentar obtener documentos con manejo de errores individual
    let stats = null;
    let config = null;
    let pricing = null;
    
    try {
      const statsDoc = await db.collection('system_stats').doc('global').get();
      stats = statsDoc.exists ? statsDoc.data() : { message: 'Documento stats no encontrado' };
    } catch (statsError) {
      console.error('Error obteniendo stats:', statsError);
      stats = { error: statsError.message };
    }
    
    try {
      const configDoc = await db.collection('system_config').doc('general').get();
      config = configDoc.exists ? configDoc.data() : { message: 'Documento config no encontrado' };
    } catch (configError) {
      console.error('Error obteniendo config:', configError);
      config = { error: configError.message };
    }
    
    try {
      const pricingDoc = await db.collection('system_config').doc('pricing').get();
      pricing = pricingDoc.exists ? pricingDoc.data() : { message: 'Documento pricing no encontrado' };
    } catch (pricingError) {
      console.error('Error obteniendo pricing:', pricingError);
      pricing = { error: pricingError.message };
    }
    
    const result = {
      success: true,
      stats,
      config,
      pricing,
      timestamp: new Date().toISOString(),
      message: 'Estadísticas obtenidas correctamente'
    };
    
    console.log('✅ Stats obtenidas:', JSON.stringify(result, null, 2));
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error general obteniendo stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Versiones Callable para compatibilidad
exports.healthCheckCallable = functions.https.onCall(async (data, context) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'VYT Music Online - Sistema básico funcionando',
    version: '1.0.0-minimal'
  };
});

// Obtener estadísticas del sistema
exports.getSystemStats = functions.https.onCall(async (data, context) => {
  try {
    const statsDoc = await db.collection('system_stats').doc('global').get();
    const configDoc = await db.collection('system_config').doc('general').get();
    
    return {
      stats: statsDoc.exists ? statsDoc.data() : null,
      config: configDoc.exists ? configDoc.data() : null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error obteniendo estadísticas',
      error.message
    );
  }
});

// Función básica de pago (simplificada)
exports.createBasicPaymentPreference = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuario debe estar autenticado'
      );
    }

    const { tipo, cantidad } = data;
    
    // Calcular precio
    let precio = 0;
    if (tipo === 'vyt_money') {
      precio = Math.ceil((cantidad / 100) * 100); // 100 pesos por 100 VYT-MONEY
    } else if (tipo === 'inscripcion_online') {
      precio = 15000; // Precio fijo
    }

    // Guardar preferencia en Firestore
    const paymentDoc = await db.collection('payments').add({
      user_id: context.auth.uid,
      user_email: context.auth.token.email,
      tipo: tipo,
      cantidad: cantidad,
      precio: precio,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`💳 Preferencia básica creada: ${paymentDoc.id}`);
    
    return {
      success: true,
      payment_id: paymentDoc.id,
      precio: precio,
      tipo: tipo,
      cantidad: cantidad,
      message: 'Preferencia de pago creada (modo básico)'
    };

  } catch (error) {
    console.error('❌ Error creando preferencia:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error creando preferencia de pago',
      error.message
    );
  }
});

// Crear usuario administrador
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  try {
    console.log('👑 Iniciando creación de admin con data:', data);
    
    // Validar datos de entrada
    if (!data || typeof data !== 'object') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Los datos son requeridos'
      );
    }

    const { email, displayName } = data;
    
    // Validar email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email válido es requerido'
      );
    }
    
    // Validar nombre
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Nombre válido es requerido (mínimo 2 caracteres)'
      );
    }

    // Solo permitir si no hay admins existentes o si es llamado por un admin
    const adminsQuery = await db.collection('users').where('role', '==', 'admin').get();
    
    if (adminsQuery.size > 0 && (!context.auth || !context.auth.token || !context.auth.token.admin)) {
      console.log(`Admins existentes: ${adminsQuery.size}, Auth context:`, context.auth);
      throw new functions.https.HttpsError(
        'permission-denied',
        'Solo admins pueden crear otros admins'
      );
    }

    console.log(`🔄 Creando usuario en Auth: ${email}`);
    
    // Crear usuario en Auth
    const userRecord = await admin.auth().createUser({
      email: email.trim(),
      emailVerified: true,
      displayName: displayName.trim()
    });

    console.log(`✅ Usuario Auth creado con UID: ${userRecord.uid}`);

    // Crear perfil en Firestore
    const userData = {
      email: email.trim(),
      displayName: displayName.trim(),
      role: 'admin',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      vyt_money_balance: 0,
      total_votes: 0,
      status: 'active'
    };
    
    console.log('📝 Guardando en Firestore:', userData);
    
    await db.collection('users').doc(userRecord.uid).set(userData);

    console.log('🔑 Asignando claims personalizados');
    
    // Asignar claim personalizado
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    console.log(`👑 Admin creado exitosamente: ${email}`);
    
    return {
      success: true,
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      message: 'Usuario administrador creado exitosamente'
    };

  } catch (error) {
    console.error('❌ Error creando admin:', error);
    
    // Si es un error de Firebase, mantener el tipo
    if (error.code && error.code.startsWith('functions/')) {
      throw error;
    }
    
    // Convertir otros errores
    throw new functions.https.HttpsError(
      'internal',
      `Error creando usuario administrador: ${error.message}`,
      { originalError: error.code || error.message }
    );
  }
});

console.log('🚀 VYT Music Online - Funciones básicas v1 cargadas');