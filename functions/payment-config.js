// payment-config.js - Configuración centralizada del sistema de pagos
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

// Variables de entorno
const mercadopagoToken = functions.config().mercadopago?.token || process.env.MERCADOPAGO_TOKEN;
const siteUrl = functions.config().site?.url || process.env.SITE_URL || "https://vytonlineprueva.web.app";

/**
 * Configuración de precios por defecto para el sistema
 */
const DEFAULT_PRICING = {
  vyt_money: {
    precio_por_100: 100, // 100 pesos por 100 VYT-MONEY
    moneda: 'ARS',
    activo: true,
    descuentos: {
      500: 5,   // 5% descuento por 500 VYT-MONEY
      1000: 10, // 10% descuento por 1000 VYT-MONEY
      2000: 15  // 15% descuento por 2000 VYT-MONEY
    }
  },
  inscripcion_online: {
    precio_base: 15000,
    moneda: 'ARS',
    activo: true,
    descuento_temprano: 20 // 20% descuento inscripción temprana
  },
  inscripcion_presencial: {
    precio_base: 25000,
    moneda: 'ARS',
    activo: true,
    descuento_temprano: 15
  },
  votes: {
    precio_por_voto: 10, // 10 VYT-MONEY por voto
    paquetes: {
      basico: { votos: 10, precio_vyt: 90 },    // 10% descuento
      medio: { votos: 50, precio_vyt: 400 },    // 20% descuento
      premium: { votos: 100, precio_vyt: 700 }  // 30% descuento
    }
  }
};

/**
 * Inicializar configuración de pagos en Firestore
 */
const initializePaymentConfig = functions.https.onCall(async (data, context) => {
  try {
    const batch = admin.firestore().batch();
    
    // Configuración VYT-MONEY
    const vytMoneyRef = admin.firestore().collection('payment_config').doc('vyt_money');
    batch.set(vytMoneyRef, {
      ...DEFAULT_PRICING.vyt_money,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: request.auth?.uid || 'system'
    });

    // Configuración inscripciones online
    const onlineRef = admin.firestore().collection('payment_config').doc('inscripcion_online');
    batch.set(onlineRef, {
      ...DEFAULT_PRICING.inscripcion_online,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: request.auth?.uid || 'system'
    });

    // Configuración inscripciones presenciales
    const presencialRef = admin.firestore().collection('payment_config').doc('inscripcion_presencial');
    batch.set(presencialRef, {
      ...DEFAULT_PRICING.inscripcion_presencial,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: request.auth?.uid || 'system'
    });

    // Configuración votos
    const votesRef = admin.firestore().collection('payment_config').doc('votes');
    batch.set(votesRef, {
      ...DEFAULT_PRICING.votes,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: request.auth?.uid || 'system'
    });

    // Estados de pago válidos
    const statusRef = admin.firestore().collection('payment_config').doc('estados');
    batch.set(statusRef, {
      estados_validos: ['pending', 'approved', 'rejected', 'cancelled', 'refunded'],
      tipos_pago: ['vyt_money_purchase', 'inscripcion_online', 'inscripcion_presencial', 'vote_package'],
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    
    return { success: true, message: 'Configuración de pagos inicializada correctamente' };
    
  } catch (error) {
    console.error('Error initializing payment config:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Obtener configuración de precios actualizada
 */
const getPaymentConfig = functions.https.onCall(async (data, context) => {
  try {
    const { tipo } = data;
    
    if (tipo) {
      // Obtener configuración específica
      const configDoc = await admin.firestore().collection('payment_config').doc(tipo).get();
      return configDoc.exists ? configDoc.data() : DEFAULT_PRICING[tipo];
    } else {
      // Obtener toda la configuración
      const configSnapshot = await admin.firestore().collection('payment_config').get();
      const config = {};
      
      configSnapshot.forEach(doc => {
        config[doc.id] = doc.data();
      });
      
      return config;
    }
    
  } catch (error) {
    console.error('Error getting payment config:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Actualizar configuración de precios (solo admins)
 */
const updatePaymentConfig = functions.https.onCall(async (data, context) => {
  try {
    // Verificar que sea admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden modificar precios');
    }

    const { tipo, configuracion } = request.data;
    
    await admin.firestore().collection('payment_config').doc(tipo).update({
      ...configuracion,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: request.auth.uid
    });
    
    return { success: true, message: 'Configuración actualizada' };
    
  } catch (error) {
    console.error('Error updating payment config:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Calcular precio con descuentos aplicados
 */
const calculatePrice = functions.https.onCall(async (data, context) => {
  try {
    const { tipo, cantidad, fecha_limite } = request.data;
    
    const configDoc = await admin.firestore().collection('payment_config').doc(tipo).get();
    const config = configDoc.exists ? configDoc.data() : DEFAULT_PRICING[tipo];
    
    let precio_base = 0;
    let descuento = 0;
    let precio_final = 0;
    
    switch (tipo) {
      case 'vyt_money':
        precio_base = (cantidad / 100) * config.precio_por_100;
        
        // Aplicar descuentos por cantidad
        if (config.descuentos) {
          const descuentoKeys = Object.keys(config.descuentos).map(Number).sort((a, b) => b - a);
          for (const cantidadDesc of descuentoKeys) {
            if (cantidad >= cantidadDesc) {
              descuento = config.descuentos[cantidadDesc];
              break;
            }
          }
        }
        
        precio_final = precio_base * (1 - descuento / 100);
        break;
        
      case 'inscripcion_online':
      case 'inscripcion_presencial':
        precio_base = config.precio_base;
        
        // Aplicar descuento temprano si aplica
        if (fecha_limite && new Date() < new Date(fecha_limite)) {
          descuento = config.descuento_temprano;
        }
        
        precio_final = precio_base * (1 - descuento / 100);
        break;
        
      case 'vote_package':
        const paquete = config.paquetes[cantidad];
        if (paquete) {
          precio_final = paquete.precio_vyt;
        } else {
          precio_final = cantidad * config.precio_por_voto;
        }
        break;
        
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Tipo de precio no válido');
    }
    
    return {
      precio_base,
      descuento,
      precio_final: Math.round(precio_final),
      moneda: config.moneda,
      detalles: {
        tipo,
        cantidad,
        descuento_aplicado: descuento > 0,
        fecha_calculo: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error calculating price:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Crear preferencia de pago unificada
 */
const createUnifiedPaymentPreference = functions.https.onCall(async (data, context) => {
  try {
    const { 
      tipo_pago, 
      datos_compra,
      user_id,
      user_email 
    } = request.data;
    
    if (!user_id || !user_email) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos de usuario requeridos');
    }

    // Obtener configuración de precios
    const priceCalculation = await calculatePrice({
      data: {
        tipo: tipo_pago,
        cantidad: datos_compra.cantidad,
        fecha_limite: datos_compra.fecha_limite
      }
    });

    // Crear cliente MercadoPago
    const client = new MercadoPagoConfig({ 
      accessToken: mercadopagoToken.value() 
    });
    const preference = new Preference(client);

    // Configurar título y descripción según tipo
    let title, description;
    switch (tipo_pago) {
      case 'vyt_money':
        title = `${datos_compra.cantidad} VYT-MONEY`;
        description = `Compra de ${datos_compra.cantidad} VYT-MONEY para votar`;
        break;
      case 'inscripcion_online':
        title = `Inscripción Online - ${datos_compra.certamen_nombre}`;
        description = `Inscripción para certamen online de ${datos_compra.provincia}`;
        break;
      case 'inscripcion_presencial':
        title = "Inscripción Presencial VYT Music";
        description = "Inscripción para certamen presencial en Rosario";
        break;
      case 'vote_package':
        title = `Paquete de ${datos_compra.cantidad} votos`;
        description = `Compra de paquete de votos para certamen`;
        break;
    }

    // Crear preferencia
    const preferenceData = {
      items: [{
        title,
        description,
        quantity: 1,
        currency_id: priceCalculation.moneda,
        unit_price: priceCalculation.precio_final
      }],
      payer: {
        email: user_email,
        name: datos_compra.nombre_usuario || 'Usuario VYT'
      },
      back_urls: {
        success: `${siteUrl.value()}/pago/pago_exitoso.html?tipo=${tipo_pago}&precio=${priceCalculation.precio_final}`,
        failure: `${siteUrl.value()}/pago/pago_fallido.html?tipo=${tipo_pago}&precio=${priceCalculation.precio_final}`,
        pending: `${siteUrl.value()}/pago/pago_pendiente.html?tipo=${tipo_pago}&precio=${priceCalculation.precio_final}`
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        type: tipo_pago,
        user_id,
        datos_compra,
        precio_calculado: priceCalculation,
        timestamp: Date.now()
      }),
      notification_url: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/processUnifiedPaymentNotification`
    };

    const result = await preference.create({ body: preferenceData });

    // Guardar transacción pendiente
    await admin.firestore().collection('payment_transactions').add({
      type: tipo_pago,
      user_id,
      datos_compra,
      precio_base: priceCalculation.precio_base,
      descuento: priceCalculation.descuento,
      precio_final: priceCalculation.precio_final,
      moneda: priceCalculation.moneda,
      preference_id: result.id,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      mercadopago_data: {
        id: result.id,
        init_point: result.init_point
      }
    });

    return {
      preference_id: result.id,
      init_point: result.init_point,
      precio_final: priceCalculation.precio_final,
      descuento_aplicado: priceCalculation.descuento,
      detalles: priceCalculation.detalles
    };

  } catch (error) {
    console.error('Error creating unified payment preference:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Webhook unificado para procesar todas las notificaciones de pago
 */
const processUnifiedPaymentNotification = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  try {
    console.log('Unified payment notification received:', req.body);
    
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const payment_id = data.id;
      
      // Obtener información del pago
      const client = new MercadoPagoConfig({ 
        accessToken: mercadopagoToken.value() 
      });
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: payment_id });
      
      if (paymentData.status === 'approved') {
        const external_reference = JSON.parse(paymentData.external_reference);
        
        // Actualizar transacción en Firestore
        const transactionQuery = await admin.firestore()
          .collection('payment_transactions')
          .where('user_id', '==', external_reference.user_id)
          .where('status', '==', 'pending')
          .orderBy('created_at', 'desc')
          .limit(1)
          .get();
          
        if (!transactionQuery.empty) {
          await transactionQuery.docs[0].ref.update({
            status: 'approved',
            payment_id: paymentData.id,
            approved_at: admin.firestore.FieldValue.serverTimestamp(),
            mercadopago_payment_data: paymentData
          });
        }
        
        // Procesar según tipo específico
        await processPaymentByType(external_reference, paymentData);
      }
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error processing unified payment notification:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Procesar pago según su tipo específico
 */
async function processPaymentByType(external_reference, paymentData) {
  const { type, user_id, datos_compra } = external_reference;
  
  switch (type) {
    case 'vyt_money':
      await processVYTMoneyPurchase(user_id, datos_compra.cantidad);
      break;
      
    case 'inscripcion_online':
      await processOnlineInscription(user_id, datos_compra);
      break;
      
    case 'inscripcion_presencial':
      await processPresencialInscription(user_id, datos_compra);
      break;
      
    case 'vote_package':
      await processVotePackagePurchase(user_id, datos_compra);
      break;
      
    default:
      console.log('Unknown payment type:', type);
  }
}

/**
 * Procesar compra de VYT-MONEY
 */
async function processVYTMoneyPurchase(user_id, cantidad) {
  const userRef = admin.firestore().collection('users').doc(user_id);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentBalance = userDoc.exists ? (userDoc.data().vyt_money_balance || 0) : 0;
    
    transaction.update(userRef, {
      vyt_money_balance: currentBalance + cantidad,
      last_vyt_money_purchase: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Registrar transacción VYT-MONEY
    const transactionRef = admin.firestore().collection('vyt_money_transactions').doc();
    transaction.set(transactionRef, {
      user_id,
      type: 'purchase',
      amount: cantidad,
      balance_before: currentBalance,
      balance_after: currentBalance + cantidad,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      description: `Compra de ${cantidad} VYT-MONEY`
    });
  });
  
  console.log(`VYT-MONEY purchase processed: ${cantidad} for user ${user_id}`);
}

/**
 * Procesar inscripción online
 */
async function processOnlineInscription(user_id, datos_compra) {
  await admin.firestore().collection('participantes_online').add({
    user_id,
    ...datos_compra,
    pago_confirmado: true,
    fecha_inscripcion: admin.firestore.FieldValue.serverTimestamp(),
    estado: 'inscrito'
  });
  
  console.log(`Online inscription processed for user ${user_id}`);
}

/**
 * Procesar inscripción presencial
 */
async function processPresencialInscription(user_id, datos_compra) {
  await admin.firestore().collection('participantes_presencial').add({
    user_id,
    ...datos_compra,
    pago_confirmado: true,
    fecha_inscripcion: admin.firestore.FieldValue.serverTimestamp(),
    estado: 'inscrito'
  });
  
  console.log(`Presencial inscription processed for user ${user_id}`);
}

/**
 * Procesar compra de paquete de votos
 */
async function processVotePackagePurchase(user_id, datos_compra) {
  const userRef = admin.firestore().collection('users').doc(user_id);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentBalance = userDoc.exists ? (userDoc.data().vyt_money_balance || 0) : 0;
    const votesToAdd = datos_compra.cantidad;
    const costInVYTMoney = datos_compra.costo_vyt_money;
    
    transaction.update(userRef, {
      vyt_money_balance: currentBalance + costInVYTMoney,
      available_votes: admin.firestore.FieldValue.increment(votesToAdd),
      last_vote_purchase: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  console.log(`Vote package processed: ${datos_compra.cantidad} votes for user ${user_id}`);
}

// Exportar todas las funciones
module.exports = {
  initializePaymentConfig,
  getPaymentConfig,
  updatePaymentConfig,
  calculatePrice,
  createUnifiedPaymentPreference,
  processUnifiedPaymentNotification
};