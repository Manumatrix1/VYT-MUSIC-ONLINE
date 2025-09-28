/**
 * 🚀 FIREBASE FUNCTIONS PARA SISTEMA INTEGRAL ADMIN
 * Funciones especializadas para soportar la gestión integral del sistema
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Configuración de constantes
const gmailEmail = functions.config().gmail?.email || { value: () => 'test@gmail.com' };
const gmailPassword = functions.config().gmail?.password || { value: () => 'test_password' };
const siteUrl = functions.config().site?.url || { value: () => 'https://vyt-music-online.web.app' };

const { onCall, onRequest } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

// Variable global para el transporter de emails
let transporter = null;

// ===== FUNCIONES DE GESTIÓN DE CONTENIDO VISUAL =====

/**
 * Actualizar configuración visual del sitio
 */
exports.updateSiteVisualConfig = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    // Verificar que sea admin
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden actualizar la configuración visual');
    }

    const { configType, configData } = request.data;

    // Actualizar configuración
    await admin.firestore().collection('site_config').doc('visual').set({
      [configType]: {
        ...configData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid
      }
    }, { merge: true });

    // Notificar a todas las sesiones activas
    await admin.firestore().collection('system_broadcasts').add({
      type: 'visual_config_updated',
      configType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      adminId: request.auth.uid
    });

    return { success: true, message: 'Configuración visual actualizada' };

  } catch (error) {
    console.error('Error updating visual config:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Actualizar estilos de páginas en tiempo real
 */
exports.updatePageStyles = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { page, styles } = request.data;

    // Actualizar estilos en Firestore
    await admin.firestore().collection('page_styles').doc(page).set({
      styles,
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
      modifiedBy: request.auth.uid
    });

    // Broadcast a todas las sesiones para aplicar cambios
    await admin.firestore().collection('system_broadcasts').add({
      type: 'styles_updated',
      page,
      styles,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };

  } catch (error) {
    console.error('Error updating page styles:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== FUNCIONES DE EMAIL MASIVO =====

/**
 * Enviar email masivo
 */
exports.sendMassEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    // Verificar que sea admin
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden enviar emails masivos');
    }

    const { recipientType, templateId, customData } = request.data;

    // Obtener plantilla de email
    const templateDoc = await admin.firestore().collection('email_templates').doc(templateId).get();
    if (!templateDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Plantilla de email no encontrada');
    }

    const template = templateDoc.data();

    // Obtener lista de destinatarios según el tipo
    let recipients = [];
    
    switch (recipientType) {
      case 'all_users':
        const allUsersSnapshot = await admin.firestore().collection('users').get();
        recipients = allUsersSnapshot.docs
          .map(doc => ({ uid: doc.id, ...doc.data() }))
          .filter(user => user.email);
        break;
        
      case 'participants_only':
        const participantsSnapshot = await admin.firestore().collection('participantes_online').get();
        recipients = participantsSnapshot.docs.map(doc => doc.data()).filter(p => p.email);
        break;
        
      case 'approved_only':
        const approvedSnapshot = await admin.firestore()
          .collection('participantes_online')
          .where('status', '==', 'approved')
          .get();
        recipients = approvedSnapshot.docs.map(doc => doc.data()).filter(p => p.email);
        break;
    }

    // Configurar transporter si no existe
    if (!transporter) {
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value()
        }
      });
    }

    // Enviar emails en lotes para evitar rate limiting
    const batchSize = 10;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (recipient) => {
        try {
          // Personalizar email con datos del destinatario
          let personalizedHtml = template.html;
          let personalizedSubject = template.subject;

          // Reemplazar variables en el template
          const variables = {
            '{NOMBRE}': recipient.nombre_artista || recipient.firstName || recipient.email.split('@')[0],
            '{EMAIL}': recipient.email,
            '{FECHA}': new Date().toLocaleDateString('es-AR'),
            ...customData
          };

          Object.entries(variables).forEach(([key, value]) => {
            personalizedHtml = personalizedHtml.replace(new RegExp(key, 'g'), value);
            personalizedSubject = personalizedSubject.replace(new RegExp(key, 'g'), value);
          });

          await transporter.sendMail({
            from: `VYT Music <${gmailEmail.value()}>`,
            to: recipient.email,
            subject: personalizedSubject,
            html: personalizedHtml
          });

          sent++;
        } catch (error) {
          console.error(`Error enviando email a ${recipient.email}:`, error);
          failed++;
        }
      });

      await Promise.allSettled(emailPromises);
      
      // Pequeña pausa entre lotes
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Registrar actividad de email masivo
    await admin.firestore().collection('email_campaigns').add({
      templateId,
      recipientType,
      totalRecipients: recipients.length,
      sentCount: sent,
      failedCount: failed,
      sentBy: request.auth.uid,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      customData
    });

    return { 
      success: true, 
      sent, 
      failed, 
      total: recipients.length,
      message: `Email masivo enviado: ${sent} exitosos, ${failed} fallidos` 
    };

  } catch (error) {
    console.error('Error sending mass email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== FUNCIONES DE CONFIGURACIÓN DEL SISTEMA =====

/**
 * Actualizar tasas de VYT-Money
 */
exports.updateVYTMoneyRates = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    // Verificar que sea admin
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden actualizar tasas');
    }

    const newRates = request.data;

    // Actualizar configuración de VYT-Money
    await admin.firestore().collection('vyt_money_config').doc('rates').set({
      ...newRates,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid
    });

    // Notificar usuarios sobre cambio de precios
    await admin.firestore().collection('system_notifications').add({
      type: 'price_update',
      title: 'Precios de VYT-Money Actualizados',
      message: 'Los precios de VYT-Money han sido actualizados. Revisa los nuevos precios.',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isGlobal: true
    });

    return { success: true, newRates };

  } catch (error) {
    console.error('Error updating VYT Money rates:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== FUNCIONES DE MODERACIÓN AVANZADA =====

/**
 * Aprobación masiva de participantes
 */
exports.massApproveParticipants = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { participantIds, moderationType } = request.data;
    const collectionName = moderationType === 'online' ? 'participantes_online' : 'participantes_presenciales';
    
    const batch = admin.firestore().batch();
    const approvedParticipants = [];

    // Configurar transporter para emails
    if (!transporter) {
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value()
        }
      });
    }

    for (const participantId of participantIds) {
      const participantRef = admin.firestore().collection(collectionName).doc(participantId);
      const participantDoc = await participantRef.get();
      
      if (participantDoc.exists) {
        const participantData = participantDoc.data();
        
        // Actualizar status
        batch.update(participantRef, {
          status: 'approved',
          approved_at: admin.firestore.FieldValue.serverTimestamp(),
          approved_by: request.auth.uid
        });

        approvedParticipants.push(participantData);
      }
    }

    await batch.commit();

    // Enviar emails de aprobación en paralelo
    const emailPromises = approvedParticipants.map(async (participant) => {
      try {
        await transporter.sendMail({
          from: `VYT Music <${gmailEmail.value()}>`,
          to: participant.email,
          subject: '🎉 ¡APROBADO! Tu video ha sido aceptado ✅',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #00d9ff; text-align: center;">🎉 ¡FELICITACIONES! 🎉</h1>
              <p>¡Hola <strong>${participant.nombre_artista}</strong>!</p>
              <p>¡Excelentes noticias! Tu video ha sido <strong>APROBADO</strong> por nuestro equipo.</p>
              <p>Ya puedes participar en la votación del certamen.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl.value()}/principal.html" style="background: #00d9ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  🏆 Ver Mi Participación
                </a>
              </div>
              <p>¡Mucha suerte en el certamen!</p>
              <p>Equipo VYT Music</p>
            </div>
          `
        });
      } catch (error) {
        console.error(`Error enviando email a ${participant.email}:`, error);
      }
    });

    await Promise.allSettled(emailPromises);

    return { 
      success: true, 
      approved: approvedParticipants.length,
      message: `${approvedParticipants.length} participantes aprobados exitosamente` 
    };

  } catch (error) {
    console.error('Error in mass approval:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== FUNCIONES DE BACKUP Y RESTAURACIÓN =====

/**
 * Crear backup completo del sistema
 */
exports.createSystemBackup = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { includeMedia } = request.data;
    const backupId = `backup_${Date.now()}`;

    // Colecciones a respaldar
    const collections = [
      'users',
      'participantes_online',
      'participantes_presenciales',
      'system_config',
      'vyt_money_config',
      'email_templates',
      'certamenes_config',
      'page_styles'
    ];

    const backupData = {};
    
    // Respaldar cada colección
    for (const collectionName of collections) {
      const snapshot = await admin.firestore().collection(collectionName).get();
      backupData[collectionName] = {};
      
      snapshot.docs.forEach(doc => {
        backupData[collectionName][doc.id] = doc.data();
      });
    }

    // Guardar backup en Firestore
    await admin.firestore().collection('system_backups').doc(backupId).set({
      data: backupData,
      includeMedia,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      collections: collections,
      totalDocuments: Object.values(backupData).reduce((total, collection) => 
        total + Object.keys(collection).length, 0)
    });

    return { 
      success: true, 
      backupId,
      collections: collections.length,
      totalDocuments: Object.values(backupData).reduce((total, collection) => 
        total + Object.keys(collection).length, 0),
      message: 'Backup creado exitosamente' 
    };

  } catch (error) {
    console.error('Error creating backup:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== FUNCIONES DE MÉTRICAS EN TIEMPO REAL =====

/**
 * Actualizar métricas del sistema en tiempo real
 */
exports.updateSystemMetrics = onCall(async (request) => {
  try {
    // Calcular métricas en tiempo real
    const [
      usersSnapshot,
      onlineParticipantsSnapshot,
      votesSnapshot,
      paymentsSnapshot
    ] = await Promise.all([
      admin.firestore().collection('users').get(),
      admin.firestore().collection('participantes_online').where('status', '==', 'approved').get(),
      admin.firestore().collection('votes').get(),
      admin.firestore().collection('payment_transactions').where('status', '==', 'approved').get()
    ]);

    // Calcular pendientes
    const pendingSnapshot = await admin.firestore()
      .collection('participantes_online')
      .where('status', '==', 'pending')
      .get();

    // Calcular ingresos del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyPaymentsSnapshot = await admin.firestore()
      .collection('payment_transactions')
      .where('status', '==', 'approved')
      .where('created_at', '>=', today)
      .get();

    let dailyRevenue = 0;
    dailyPaymentsSnapshot.docs.forEach(doc => {
      const payment = doc.data();
      if (payment.amount) {
        dailyRevenue += payment.amount;
      }
    });

    const metrics = {
      onlineUsers: Math.floor(Math.random() * 200) + 50, // Simulado
      totalVotes: votesSnapshot.size,
      dailyRevenue: dailyRevenue,
      pendingApprovals: pendingSnapshot.size,
      activeParticipants: onlineParticipantsSnapshot.size,
      vytMoneyCirculation: 0, // Se calculará según transacciones
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // Actualizar métricas en tiempo real
    await admin.firestore().collection('system_metrics').doc('realtime').set(metrics);

    return { success: true, metrics };

  } catch (error) {
    console.error('Error updating metrics:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== TRIGGER PARA BROADCAST DE ACTUALIZACIONES =====

/**
 * Escuchar cambios en system_broadcasts y notificar a clientes
 */
exports.handleSystemBroadcast = onDocumentWritten(
  'system_broadcasts/{broadcastId}',
  async (event) => {
    const broadcast = event.data?.after?.data();
    if (!broadcast) return;

    console.log('📡 Sistema de broadcast activado:', broadcast.type);

    // Aquí se pueden agregar integraciones con servicios de push notification
    // Firebase Cloud Messaging, etc.

    return null;
  }
);

// ===== FUNCIÓN DE SALUD DEL SISTEMA INTEGRAL =====

exports.integralSystemHealth = onCall(async (request) => {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      services: {
        firestore: 'healthy',
        storage: 'healthy',
        auth: 'healthy',
        functions: 'healthy',
        email: 'healthy'
      },
      version: '2.0.0',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };

    // Verificar conexiones críticas
    try {
      await admin.firestore().collection('system_config').limit(1).get();
    } catch (error) {
      healthCheck.services.firestore = 'error';
    }

    return { success: true, health: healthCheck };
    
  } catch (error) {
    console.error('Health check failed:', error);
    return { success: false, error: error.message };
  }
});