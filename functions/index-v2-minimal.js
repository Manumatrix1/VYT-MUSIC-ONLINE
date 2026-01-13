/**
 * VYT MUSIC ONLINE - FIREBASE FUNCTIONS INDEX V2 - MINIMAL WORKING
 * Solo funciones esenciales migradas a v2 API
 */

const { onRequest, onCall } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ===== HEALTH CHECK =====

exports.healthCheck = onRequest({ cors: true }, async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'VYT Music Online - Sistema v2 funcionando',
    version: '2.0.0'
  });
});

// ===== INITIALIZE FIRESTORE =====

exports.initializeFirestoreStructure = onRequest({ cors: true }, async (req, res) => {
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
    }, { merge: true });

    // Configuración del sistema
    await db.collection('system_config').doc('general').set({
      site_name: 'VYT Music Online',
      certamen_activo: true,
      inscripciones_abiertas: true,
      voting_enabled: true,
      maintenance_mode: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Estructura de Firestore inicializada');
    res.json({
      success: true,
      message: 'Estructura de Firestore inicializada correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error al inicializar Firestore:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== VYT-MONEY BALANCE =====

exports.getVYTMoneyBalance = onCall(async (request) => {
  try {
    const { user_id } = request.data;
    
    if (!user_id) {
      throw new Error('User ID requerido');
    }

    const userDoc = await db.collection('user_vyt_money').doc(user_id).get();
    
    if (!userDoc.exists) {
      return {
        balance: 0,
        total_purchased: 0,
        total_spent: 0,
        last_purchase: null
      };
    }

    const userData = userDoc.data();
    
    return {
      balance: userData.balance || 0,
      total_purchased: userData.total_purchased || 0,
      total_spent: userData.total_spent || 0,
      last_purchase: userData.last_purchase || null
    };

  } catch (error) {
    console.error('Error getting VYT-MONEY balance:', error);
    throw new Error(error.message);
  }
});

// ===== VOTING FUNCTION =====

exports.registrarVoto = onCall(async (request) => {
  try {
    const { participacion_id, monto } = request.data;
    const uid = request.auth?.uid;
    
    if (!uid) {
      throw new Error('Usuario no autenticado');
    }
    
    if (!participacion_id || !monto || monto <= 0) {
      throw new Error('Datos de voto inválidos');
    }

    // Verificar que el video esté activo y aprobado
    const participacionDoc = await db.collection('participaciones').doc(participacion_id).get();
    
    if (!participacionDoc.exists) {
      throw new Error('Participación no encontrada');
    }

    const participacion = participacionDoc.data();
    
    // ⭐ VALIDACIÓN CRÍTICA: Solo se puede votar si video_activo === true
    if (participacion.video_activo !== true) {
      throw new Error('Este video aún no está disponible para votación. Debe estar procesado y activo en YouTube.');
    }

    // Verificar saldo del usuario
    const userMoneyDoc = await db.collection('user_vyt_money').doc(uid).get();
    
    if (!userMoneyDoc.exists) {
      throw new Error('Usuario sin saldo de VYT Money');
    }

    const userMoney = userMoneyDoc.data();
    const balanceActual = userMoney.balance || 0;

    if (balanceActual < monto) {
      throw new Error(`Saldo insuficiente. Tienes ${balanceActual} VYT Money, necesitas ${monto}`);
    }

    // Transacción atómica
    await db.runTransaction(async (transaction) => {
      // 1. Descontar saldo del usuario
      transaction.update(userMoneyDoc.ref, {
        balance: balanceActual - monto,
        total_spent: (userMoney.total_spent || 0) + monto,
        last_vote: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Incrementar votos de la participación
      transaction.update(participacionDoc.ref, {
        votos_totales: admin.firestore.FieldValue.increment(monto),
        conteo_votos: admin.firestore.FieldValue.increment(1),
        ultima_votacion: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Registrar el voto
      const votoRef = db.collection('votos').doc();
      transaction.set(votoRef, {
        user_id: uid,
        participacion_id: participacion_id,
        monto: monto,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        certamen_id: participacion.certamen_id || null,
        artista_id: participacion.artista_id || null
      });
    });

    return {
      success: true,
      nuevo_balance: balanceActual - monto,
      votos_registrados: monto,
      message: `¡Voto registrado! ${monto} VYT Money`
    };

  } catch (error) {
    console.error('Error al registrar voto:', error);
    throw new Error(error.message);
  }
});

// ===== IMPORT YOUTUBE AUTOMATION =====

const youtubeAutomation = require('./youtube-automation');

exports.triggerYouTubeUpload = youtubeAutomation.triggerYouTubeUpload;
exports.youtubeUploadCallback = youtubeAutomation.youtubeUploadCallback;
exports.retryYouTubeUpload = youtubeAutomation.retryYouTubeUpload;
exports.checkYouTubeUploadStatus = youtubeAutomation.checkYouTubeUploadStatus;

console.log('✅ VYT Music Online Functions v2 - Loaded successfully');
