/**
 * 💰 SISTEMA DE PAGOS MÚLTIPLES VYT-MUSIC
 * 
 * Este archivo mejora el sistema de pagos para manejar:
 * - VYT-MONEY (moneda virtual)
 * - Inscripciones Online (por certamen provincial)
 * - Inscripciones Presenciales
 * - Precios dinámicos por certamen
 * - Notificaciones diferenciadas por tipo de pago
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onCall, onRequest } = require('firebase-functions/v2/https');

// =====================================
// 📊 CONFIGURACIÓN DE PRECIOS DINÁMICOS
// =====================================

/**
 * Obtener configuración de precios para un tipo específico
 */
exports.getPricingConfig = onCall(async (request) => {
  try {
    const { tipo, certamen_id } = request.data;
    
    let configRef;
    
    switch (tipo) {
      case 'vyt_money':
        configRef = admin.firestore().collection('configuracion_precios').doc('vyt_money');
        break;
      case 'inscripcion_online':
        if (certamen_id) {
          // Precio específico del certamen
          const certamenDoc = await admin.firestore().collection('certamenes_provinciales').doc(certamen_id).get();
          if (certamenDoc.exists()) {
            return { 
              precio: certamenDoc.data().precio,
              moneda: 'ARS',
              tipo: 'inscripcion_online',
              certamen: certamenDoc.data()
            };
          }
        }
        // Precio por defecto
        configRef = admin.firestore().collection('configuracion_precios').doc('inscripcion_online');
        break;
      case 'inscripcion_presencial':
        configRef = admin.firestore().collection('configuracion_precios').doc('inscripcion_presencial');
        break;
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Tipo de precio no válido');
    }
    
    const configDoc = await configRef.get();
    return configDoc.exists ? configDoc.data() : null;
    
  } catch (error) {
    console.error('Error getting pricing config:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Actualizar configuración de precios
 */
exports.updatePricingConfig = onCall(async (request) => {
  try {
    const { tipo, config } = request.data;
    
    // Verificar permisos de admin aquí
    
    const configRef = admin.firestore().collection('configuracion_precios').doc(tipo);
    await configRef.set({
      ...config,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: request.auth?.uid || 'system'
    }, { merge: true });
    
    return { success: true, message: `Configuración de ${tipo} actualizada` };
    
  } catch (error) {
    console.error('Error updating pricing config:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// =====================================
// 💳 FUNCIONES DE PAGO ESPECÍFICAS
// =====================================

/**
 * Crear pago para inscripción online (con certamen específico)
 */
exports.createInscripcionOnlinePayment = onCall(async (request) => {
  try {
    const { 
      participante_data, 
      certamen_id,
      user_email 
    } = request.data;
    
    // Obtener datos del certamen
    const certamenDoc = await admin.firestore().collection('certamenes_provinciales').doc(certamen_id).get();
    if (!certamenDoc.exists()) {
      throw new functions.https.HttpsError('not-found', 'Certamen no encontrado');
    }
    
    const certamen = certamenDoc.data();
    const precio = certamen.precio;
    
    // Crear cliente de MercadoPago
    const client = new MercadoPagoConfig({ 
      accessToken: mercadopagoToken.value() 
    });
    const preference = new Preference(client);
    
    // Crear preferencia de pago
    const preferenceData = {
      items: [
        {
          title: `Inscripción ${certamen.nombre} - VYT Music`,
          description: `Inscripción para el certamen online de ${certamen.provincia}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: precio
        }
      ],
      payer: {
        email: user_email,
        name: participante_data.nombre_artista
      },
      back_urls: {
        success: `${siteUrl.value()}/pago/pago_exitoso.html?tipo=inscripcion_online&certamen=${encodeURIComponent(certamen.nombre)}&precio=${precio}`,
        failure: `${siteUrl.value()}/pago/pago_fallido.html?tipo=inscripcion_online&certamen=${encodeURIComponent(certamen.nombre)}&precio=${precio}`,
        pending: `${siteUrl.value()}/pago/pago_pendiente.html?tipo=inscripcion_online&certamen=${encodeURIComponent(certamen.nombre)}&precio=${precio}`
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        type: 'inscripcion_online',
        certamen_id: certamen_id,
        participante_data: participante_data,
        precio: precio,
        timestamp: Date.now()
      }),
      notification_url: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/processPaymentNotification`
    };
    
    const result = await preference.create({ body: preferenceData });
    
    // Guardar transacción pendiente
    await admin.firestore().collection('payment_transactions').add({
      type: 'inscripcion_online',
      certamen_id: certamen_id,
      certamen_nombre: certamen.nombre,
      participante_data: participante_data,
      precio: precio,
      moneda: 'ARS',
      preference_id: result.id,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      mercadopago_data: result
    });
    
    return {
      preference_id: result.id,
      init_point: result.init_point,
      precio: precio,
      certamen: certamen.nombre
    };
    
  } catch (error) {
    console.error('Error creating inscripcion online payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Crear pago para inscripción presencial
 */
exports.createInscripcionPresencialPayment = onCall(async (request) => {
  try {
    const { participante_data, user_email } = request.data;
    
    // Obtener precio de inscripción presencial
    const priceDoc = await admin.firestore().collection('configuracion_precios').doc('inscripcion_presencial').get();
    const precio = priceDoc.exists ? priceDoc.data().precio : 25000; // Precio por defecto
    
    // Crear cliente de MercadoPago
    const client = new MercadoPagoConfig({ 
      accessToken: mercadopagoToken.value() 
    });
    const preference = new Preference(client);
    
    // Crear preferencia de pago
    const preferenceData = {
      items: [
        {
          title: "Inscripción Presencial VYT Music - Rosario",
          description: "Inscripción para el certamen presencial en Rosario",
          quantity: 1,
          currency_id: 'ARS',
          unit_price: precio
        }
      ],
      payer: {
        email: user_email,
        name: participante_data.nombre_artista
      },
      back_urls: {
        success: `${siteUrl.value()}/pago/pago_exitoso.html?tipo=inscripcion_presencial&precio=${precio}`,
        failure: `${siteUrl.value()}/pago/pago_fallido.html?tipo=inscripcion_presencial&precio=${precio}`,
        pending: `${siteUrl.value()}/pago/pago_pendiente.html?tipo=inscripcion_presencial&precio=${precio}`
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        type: 'inscripcion_presencial',
        participante_data: participante_data,
        precio: precio,
        timestamp: Date.now()
      }),
      notification_url: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/processPaymentNotification`
    };
    
    const result = await preference.create({ body: preferenceData });
    
    // Guardar transacción pendiente
    await admin.firestore().collection('payment_transactions').add({
      type: 'inscripcion_presencial',
      participante_data: participante_data,
      precio: precio,
      moneda: 'ARS',
      preference_id: result.id,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      mercadopago_data: result
    });
    
    return {
      preference_id: result.id,
      init_point: result.init_point,
      precio: precio
    };
    
  } catch (error) {
    console.error('Error creating inscripcion presencial payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// =====================================
// 🔔 WEBHOOK UNIFICADO MEJORADO
// =====================================

/**
 * Procesar notificaciones de pago de MercadoPago (WEBHOOK UNIFICADO)
 */
exports.processPaymentNotification = onRequest(async (req, res) => {
  try {
    console.log('Payment notification received:', req.body);
    
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const payment_id = data.id;
      
      // Obtener información del pago de MercadoPago
      const client = new MercadoPagoConfig({ 
        accessToken: mercadopagoToken.value() 
      });
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: payment_id });
      
      if (paymentData.status === 'approved') {
        const external_reference = JSON.parse(paymentData.external_reference);
        
        // Procesar según el tipo de pago
        switch (external_reference.type) {
          case 'vyt_money_purchase':
            await processVYTMoneyPayment(external_reference, paymentData);
            break;
          case 'inscripcion_online':
            await processInscripcionOnlinePayment(external_reference, paymentData);
            break;
          case 'inscripcion_presencial':
            await processInscripcionPresencialPayment(external_reference, paymentData);
            break;
          default:
            console.log('Unknown payment type:', external_reference.type);
        }
      }
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error processing payment notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// 🎯 PROCESADORES ESPECÍFICOS
// =====================================

/**
 * Procesar pago confirmado de VYT-MONEY
 */
async function processVYTMoneyPayment(external_reference, paymentData) {
  const { user_id, cantidad_vyt_money } = external_reference;
  
  // Actualizar balance del usuario
  const userRef = admin.firestore().collection('users').doc(user_id);
  await admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentBalance = userDoc.exists ? (userDoc.data().vyt_money_balance || 0) : 0;
    
    transaction.update(userRef, {
      vyt_money_balance: currentBalance + cantidad_vyt_money,
      last_vyt_money_purchase: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  // Actualizar transacción
  const transactionQuery = await admin.firestore()
    .collection('vyt_money_transactions')
    .where('user_id', '==', user_id)
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
  
  // Enviar notificación específica
  await sendVYTMoneyPurchaseNotification(user_id, cantidad_vyt_money, paymentData);
  
  console.log(`VYT-MONEY purchase confirmed: ${cantidad_vyt_money} for user ${user_id}`);
}

/**
 * Procesar pago confirmado de inscripción online
 */
async function processInscripcionOnlinePayment(external_reference, paymentData) {
  const { certamen_id, participante_data, precio } = external_reference;
  
  // Guardar participante en la colección correspondiente
  const participanteRef = await admin.firestore().collection('participantes_online').add({
    ...participante_data,
    certamen_id: certamen_id,
    precio_pagado: precio,
    pago_confirmado: true,
    pago_completado: true,
    payment_id: paymentData.id,
    fecha_pago: admin.firestore.FieldValue.serverTimestamp(),
    fecha_inscripcion: admin.firestore.FieldValue.serverTimestamp(),
    mercadopago_data: paymentData,
    estado: 'pago_confirmado'
  });
  
  // Actualizar transacción
  const transactionQuery = await admin.firestore()
    .collection('payment_transactions')
    .where('type', '==', 'inscripcion_online')
    .where('status', '==', 'pending')
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();
    
  if (!transactionQuery.empty) {
    await transactionQuery.docs[0].ref.update({
      status: 'approved',
      participante_id: participanteRef.id,
      payment_id: paymentData.id,
      approved_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Enviar notificaciones específicas
  await sendInscripcionOnlineConfirmation(participante_data, certamen_id, precio, paymentData);
  await notifyAdminInscripcionOnline(participanteRef.id, participante_data, certamen_id);
  
  console.log(`Online inscription confirmed: ${participante_data.nombre_artista} - Certamen: ${certamen_id}`);
}

/**
 * Procesar pago confirmado de inscripción presencial
 */
async function processInscripcionPresencialPayment(external_reference, paymentData) {
  const { participante_data, precio } = external_reference;
  
  // Guardar participante en la colección correspondiente
  const participanteRef = await admin.firestore().collection('participantes_presencial').add({
    ...participante_data,
    precio_pagado: precio,
    pago_confirmado: true,
    pago_completado: true,
    payment_id: paymentData.id,
    fecha_pago: admin.firestore.FieldValue.serverTimestamp(),
    fecha_inscripcion: admin.firestore.FieldValue.serverTimestamp(),
    mercadopago_data: paymentData,
    estado: 'pago_confirmado'
  });
  
  // Actualizar transacción
  const transactionQuery = await admin.firestore()
    .collection('payment_transactions')
    .where('type', '==', 'inscripcion_presencial')
    .where('status', '==', 'pending')
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();
    
  if (!transactionQuery.empty) {
    await transactionQuery.docs[0].ref.update({
      status: 'approved',
      participante_id: participanteRef.id,
      payment_id: paymentData.id,
      approved_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Enviar notificaciones específicas
  await sendInscripcionPresencialConfirmation(participante_data, precio, paymentData);
  await notifyAdminInscripcionPresencial(participanteRef.id, participante_data);
  
  console.log(`Presencial inscription confirmed: ${participante_data.nombre_artista}`);
}

// =====================================
// 📧 NOTIFICACIONES ESPECÍFICAS
// =====================================

/**
 * Enviar confirmación de compra de VYT-MONEY
 */
async function sendVYTMoneyPurchaseNotification(userId, cantidadVYTMoney, paymentData) {
  // Obtener datos del usuario
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (userData && userData.email) {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value()
      }
    });
    
    const mailOptions = {
      from: `VYT Music <${gmailEmail.value()}>`,
      to: userData.email,
      subject: `🎉 ¡VYT-MONEY Acreditado! - ${cantidadVYTMoney} monedas`,
      html: `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; font-family: Arial, sans-serif;">
          <div style="background: white; border-radius: 15px; padding: 30px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #667eea; text-align: center; margin-bottom: 20px;">💰 ¡VYT-MONEY Acreditado!</h1>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #333; margin-bottom: 15px;">Detalles de tu compra:</h2>
              <p><strong>VYT-MONEY adquirido:</strong> ${cantidadVYTMoney}</p>
              <p><strong>Precio pagado:</strong> $${paymentData.transaction_amount} ARS</p>
              <p><strong>ID de transacción:</strong> ${paymentData.id}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; font-size: 16px;">¡Ahora puedes votar por tus artistas favoritos!</p>
              <a href="${siteUrl.value()}/principal.html" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin-top: 15px;">
                Ir a Votar
              </a>
            </div>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
  }
}

/**
 * Enviar confirmación de inscripción online
 */
async function sendInscripcionOnlineConfirmation(participanteData, certamenId, precio, paymentData) {
  // Obtener datos del certamen
  const certamenDoc = await admin.firestore().collection('certamenes_provinciales').doc(certamenId).get();
  const certamen = certamenDoc.data();
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: gmailEmail.value(),
      pass: gmailPassword.value()
    }
  });
  
  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: participanteData.email,
    subject: `🎤 ¡Inscripción Confirmada! - ${certamen.nombre}`,
    html: `
      <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px; font-family: Arial, sans-serif;">
        <div style="background: white; border-radius: 15px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e3c72; text-align: center; margin-bottom: 20px;">🎤 ¡Inscripción Confirmada!</h1>
          
          <div style="background: #f0f4ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 15px;">Detalles de tu inscripción:</h2>
            <p><strong>Artista:</strong> ${participanteData.nombre_artista}</p>
            <p><strong>Certamen:</strong> ${certamen.nombre}</p>
            <p><strong>Provincia:</strong> ${certamen.provincia}</p>
            <p><strong>Precio pagado:</strong> $${precio} ARS</p>
            <p><strong>Fecha de inscripción:</strong> ${new Date().toLocaleString('es-AR')}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #2d5f2d; margin: 0; text-align: center;">
              <strong>¡Tu inscripción será revisada y aprobada pronto!</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl.value()}/principal.html" style="background: #1e3c72; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
              Ver Mi Perfil
            </a>
          </div>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

/**
 * Enviar confirmación de inscripción presencial
 */
async function sendInscripcionPresencialConfirmation(participanteData, precio, paymentData) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: gmailEmail.value(),
      pass: gmailPassword.value()
    }
  });
  
  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: participanteData.email,
    subject: `🎸 ¡Inscripción Presencial Confirmada! - VYT Music Rosario`,
    html: `
      <div style="background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%); padding: 40px; font-family: Arial, sans-serif;">
        <div style="background: white; border-radius: 15px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #185a9d; text-align: center; margin-bottom: 20px;">🎸 ¡Inscripción Presencial Confirmada!</h1>
          
          <div style="background: #f0fffe; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 15px;">Detalles de tu inscripción:</h2>
            <p><strong>Artista:</strong> ${participanteData.nombre_artista}</p>
            <p><strong>Modalidad:</strong> Presencial - Rosario</p>
            <p><strong>Precio pagado:</strong> $${precio} ARS</p>
            <p><strong>Fecha de inscripción:</strong> ${new Date().toLocaleString('es-AR')}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0;">
              <strong>📍 Próximos pasos:</strong><br>
              Te contactaremos pronto con los detalles del evento presencial, ubicación y horarios.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl.value()}/principal.html" style="background: #185a9d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
              Ver Mi Perfil
            </a>
          </div>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

/**
 * Notificar admin sobre nueva inscripción online
 */
async function notifyAdminInscripcionOnline(participanteId, participanteData, certamenId) {
  // Obtener datos del certamen
  const certamenDoc = await admin.firestore().collection('certamenes_provinciales').doc(certamenId).get();
  const certamen = certamenDoc.data();
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: gmailEmail.value(),
      pass: gmailPassword.value()
    }
  });
  
  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: gmailEmail.value(), // Email del admin
    subject: `🔔 Nueva Inscripción Online - ${participanteData.nombre_artista}`,
    html: `
      <div style="background: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: white; border-radius: 10px; padding: 20px; max-width: 600px; margin: 0 auto; border-left: 4px solid #007bff;">
          <h1 style="color: #007bff; margin-bottom: 20px;">🔔 Nueva Inscripción Online</h1>
          
          <p><strong>Artista:</strong> ${participanteData.nombre_artista}</p>
          <p><strong>Email:</strong> ${participanteData.email}</p>
          <p><strong>WhatsApp:</strong> ${participanteData.whatsapp}</p>
          <p><strong>Certamen:</strong> ${certamen.nombre} (${certamen.provincia})</p>
          <p><strong>Precio pagado:</strong> $${certamen.precio} ARS</p>
          <p><strong>ID de participante:</strong> ${participanteId}</p>
          
          <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
            <p style="margin: 0; color: #1565c0;">
              <strong>Acción requerida:</strong> Revisar y aprobar la inscripción en el panel de administración.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${siteUrl.value()}/admin.html" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Ir al Panel Admin
            </a>
          </div>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

/**
 * Notificar admin sobre nueva inscripción presencial
 */
async function notifyAdminInscripcionPresencial(participanteId, participanteData) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: gmailEmail.value(),
      pass: gmailPassword.value()
    }
  });
  
  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: gmailEmail.value(), // Email del admin
    subject: `🎸 Nueva Inscripción Presencial - ${participanteData.nombre_artista}`,
    html: `
      <div style="background: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: white; border-radius: 10px; padding: 20px; max-width: 600px; margin: 0 auto; border-left: 4px solid #28a745;">
          <h1 style="color: #28a745; margin-bottom: 20px;">🎸 Nueva Inscripción Presencial</h1>
          
          <p><strong>Artista:</strong> ${participanteData.nombre_artista}</p>
          <p><strong>Email:</strong> ${participanteData.email}</p>
          <p><strong>Teléfono:</strong> ${participanteData.telefono}</p>
          <p><strong>Edad:</strong> ${participanteData.edad}</p>
          <p><strong>Modalidad:</strong> Presencial - Rosario</p>
          <p><strong>ID de participante:</strong> ${participanteId}</p>
          
          <div style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 5px;">
            <p style="margin: 0; color: #155724;">
              <strong>Acción requerida:</strong> Revisar y aprobar la inscripción presencial.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${siteUrl.value()}/admin.html" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Ir al Panel Admin
            </a>
          </div>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}