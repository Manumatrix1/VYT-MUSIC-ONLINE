/**
 * VYT MUSIC ONLINE - FIREBASE FUNCTIONS INDEX - VERSIÓN MÍNIMA V1
 * Solo funciones básicas para que el sistema funcione
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
// const { withRateLimit } = require('./rate-limiter'); // COMENTADO TEMPORALMENTE

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
    
    // Crear usuario en Auth SIN VERIFICAR
    const userRecord = await admin.auth().createUser({
      email: email.trim(),
      emailVerified: false, // 🔥 REQUERIR VERIFICACIÓN
      displayName: displayName.trim()
    });

    console.log(`✅ Usuario Auth creado con UID: ${userRecord.uid}`);

    // 🔥 GENERAR Y ENVIAR EMAIL DE VERIFICACIÓN
    try {
      const link = await admin.auth().generateEmailVerificationLink(email.trim());
      console.log('📧 Link de verificación generado para:', email);
      
      // Enviar email de verificación personalizado
      if (global.sendVerificationEmail) {
        await global.sendVerificationEmail(email.trim(), displayName.trim(), link);
      } else {
        console.warn('⚠️ Función de email no disponible, solo se generó el link');
      }
    } catch (emailError) {
      console.error('❌ Error enviando verificación:', emailError);
    }

    // Crear perfil en Firestore
    const userData = {
      email: email.trim(),
      displayName: displayName.trim(),
      role: 'admin',
      emailVerified: false, // 🔥 Estado de verificación
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      vyt_money_balance: 0,
      total_votes: 0,
      status: 'pending_verification' // 🔥 Estado pendiente
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

// ===== FUNCIONES DE PAGO VYT-MONEY (SOLO LO ESENCIAL) =====

// Solo importar y exportar la función principal para evitar timeouts
try {
  const paymentFunctions = require('./payments');
  
  // Exportar solo la función más importante
  exports.createVYTMoneyPayment = paymentFunctions.createVYTMoneyPayment;
  
  console.log('✅ VYT Money Payment function loaded successfully');
} catch (error) {
  console.error('⚠️ Error loading payment functions:', error.message);
  console.log('🔄 Continuing with basic functions only');
}

// ===== FUNCIONES VYT-MONEY MINIMAL (LIGHTWEIGHT CON LAZY-LOAD) =====
try {
  const vytMoneyMinimal = require('./vyt-money-minimal');
  
  // Exportar funciones críticas con lazy-load de dependencias
  exports.voteWithVYTMoney = vytMoneyMinimal.voteWithVYTMoney;
  exports.getVYTMoneyBalance = vytMoneyMinimal.getVYTMoneyBalance;
  exports.getPrizePoolStatus = vytMoneyMinimal.getPrizePoolStatus;
  exports.createVYTMoneyPayment = vytMoneyMinimal.createVYTMoneyPayment;
  exports.sendVYTMoneyConfirmation = vytMoneyMinimal.sendVYTMoneyConfirmation;
  
  console.log('✅ VYT Money MINIMAL functions loaded (5 functions: vote, balance, pool, payment, email)');
} catch (error) {
  console.error('⚠️ Error loading VYT Money minimal functions:', error.message);
  console.log('🔄 Continuing without VYT Money system');
}

console.log('🚀 VYT Music Online - Core functions ready');

// ===== CLOUD FUNCTION PARA PAGO DE INSCRIPCIÓN - TAREA 4 =====

/**
 * Crear preferencia de pago en MercadoPago para inscripción
 * Llamada desde: pagar-inscripcion.html
 */
exports.crearPagoInscripcion = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'El usuario debe estar autenticado para realizar un pago'
      );
    }

    const { participante_id, certamen_id } = data;

    if (!participante_id) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'participante_id es requerido'
      );
    }

    console.log(`💳 Creando pago para participante: ${participante_id}`);

    // Obtener datos del participante
    const participanteDoc = await db.collection('participantes_certamen').doc(participante_id).get();
    
    if (!participanteDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Participante no encontrado'
      );
    }

    const participanteData = participanteDoc.data();

    // Verificar estado
    if (participanteData.estado !== 'aprobado_pendiente_pago') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'El participante no está en estado válido para pagar. Estado actual: ' + participanteData.estado
      );
    }

    // Obtener datos del certamen
    const certamenDoc = await db.collection('certamenes').doc(certamen_id || participanteData.certamen_id).get();
    
    if (!certamenDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Certamen no encontrado'
      );
    }

    const certamenData = certamenDoc.data();
    const monto = certamenData.precio || 15000; // Precio del certamen o por defecto

    console.log(`💰 Monto a cobrar: $${monto} ARS`);

    // Crear preferencia de MercadoPago
    try {
      const { MercadoPagoConfig, Preference } = require('mercadopago');
      const mercadopagoToken = functions.config().mercadopago?.token || process.env.MERCADOPAGO_TOKEN;
      
      if (!mercadopagoToken) {
        throw new Error('Token de MercadoPago no configurado');
      }

      const client = new MercadoPagoConfig({
        accessToken: mercadopagoToken,
        options: { timeout: 5000 }
      });

      const preference = new Preference(client);

      const preferenceData = await preference.create({
        body: {
          items: [
            {
              title: `Inscripción - ${certamenData.nombre || 'VYT Music'}`,
              description: `${participanteData.nombre_artistico} - ${participanteData.nombre_cancion}`,
              quantity: 1,
              unit_price: monto,
              currency_id: 'ARS'
            }
          ],
          payer: {
            name: participanteData.nombre_artistico,
            email: participanteData.email
          },
          back_urls: {
            success: `${process.env.SITE_URL || 'https://vytonlineprueva.web.app'}/pago/inscripcion-exitosa.html`,
            failure: `${process.env.SITE_URL || 'https://vytonlineprueva.web.app'}/pago/inscripcion-fallida.html`,
            pending: `${process.env.SITE_URL || 'https://vytonlineprueva.web.app'}/pago/inscripcion-pendiente.html`
          },
          external_reference: participante_id, // 🔑 IMPORTANTE: Para el webhook
          notification_url: `${functions.config().site?.webhook_url || 'https://us-central1-vyt-music-online.cloudfunctions.net/recibirNotificacionPago'}`,
          statement_descriptor: 'VYT MUSIC'
        }
      });

      console.log(`✅ Preferencia creada en MercadoPago: ${preferenceData.id}`);

      // Guardar registro de transacción en Firestore
      await db.collection('payment_transactions').add({
        participante_id: participante_id,
        certamen_id: certamen_id || participanteData.certamen_id,
        user_id: context.auth.uid,
        monto: monto,
        currency: 'ARS',
        tipo: 'inscripcion_certamen',
        status: 'pending',
        mercadopago_preference_id: preferenceData.id,
        nombre_artistico: participanteData.nombre_artistico,
        email: participanteData.email,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        initPoint: preferenceData.init_point, // URL para ir a MercadoPago
        preferenceId: preferenceData.id,
        monto: monto,
        message: 'Preferencia de pago creada exitosamente'
      };

    } catch (mpError) {
      console.error('❌ Error de MercadoPago:', mpError);
      throw new functions.https.HttpsError(
        'internal',
        'Error creando preferencia de pago: ' + mpError.message
      );
    }

  } catch (error) {
    console.error('❌ Error en crearPagoInscripcion:', error);
    
    // Si ya es un HttpsError, re-lanzarlo
    if (error.code && error.code.startsWith('auth/') || error.code && error.code.includes('unauthenticated')) {
      throw error;
    }
    
    // Convertir otros errores
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Error creando preferencia de pago'
    );
  }
});

// ===== EMAIL TRIGGERS AUTOMÁTICOS (SOLO LOS BÁSICOS) =====
try {
  // Solo cargar el trigger más importante para evitar timeouts
  const { onDocumentCreated } = require('firebase-functions/v2/firestore');
  const nodemailer = require('nodemailer');
  
  // Email de bienvenida al crear perfil de artista (función inline para evitar imports complejos)
  exports.emailPerfilArtistaCreado = onDocumentCreated(
    "artist_profiles/{profileId}",
    async (event) => {
      try {
        const data = event.data.data();
        console.log('📧 Enviando email de bienvenida a artista:', data.nombreArtistico);
        
        const transporter = nodemailer.createTransporter({
          service: "gmail",
          auth: {
            user: "luciano21martinez@gmail.com",
            pass: "wwhm qqei uxxz ciwl",
          },
        });
        
        await transporter.sendMail({
          from: "VYT Music <luciano21martinez@gmail.com>",
          to: data.email || data.user_email,
          subject: "🎉 ¡Bienvenido/a a VYT Music! Tu perfil de artista ha sido creado",
          html: `
            <h1>🎉 ¡Bienvenido/a a VYT Music!</h1>
            <p>Hola <strong>${data.nombreArtistico}</strong>,</p>
            <p>¡Tu perfil de artista ha sido creado exitosamente! 🎤✨</p>
            <p><a href="https://vytonlineprueva.web.app/perfil-artista.html">Ver mi Perfil</a></p>
            <p>El equipo de VYT Music</p>
          `
        });
        
        console.log('✅ Email de bienvenida enviado');
        return { success: true };
      } catch (error) {
        console.error('❌ Error enviando email:', error);
        return null;
      }
    }
  );

  // 🔥 FUNCIÓN GLOBAL PARA ENVIAR EMAIL DE VERIFICACIÓN
  global.sendVerificationEmail = async function(email, displayName, verificationLink) {
    try {
      const transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
          user: "luciano21martinez@gmail.com",
          pass: "wwhm qqei uxxz ciwl",
        },
      });

      await transporter.sendMail({
        from: "VYT Music <luciano21martinez@gmail.com>",
        to: email,
        subject: "🔐 Verifica tu email para acceder a VYT Music",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #00d9ff;">🔐 Verifica tu Email</h1>
            <p>Hola <strong>${displayName}</strong>,</p>
            <p>¡Gracias por registrarte en VYT Music! 🎵</p>
            <p>Para acceder a tu cuenta y comenzar a participar en nuestros certámenes, necesitas verificar tu dirección de email.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #00d9ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ✅ VERIFICAR MI EMAIL
              </a>
            </div>
            
            <p><strong>¿Por qué necesitas verificar?</strong></p>
            <ul>
              <li>🎤 Acceder a tu perfil de artista</li>
              <li>📧 Recibir notificaciones de nuevos certámenes</li>
              <li>🏆 Participar en competencias</li>
              <li>💰 Gestionar VYT Money</li>
            </ul>
            
            <p><small>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</small></p>
            <p><small>${verificationLink}</small></p>
            
            <p>¡Nos vemos pronto en VYT Music! 🚀</p>
            <p><strong>El equipo de VYT Music</strong></p>
          </div>
        `
      });

      console.log('✅ Email de verificación enviado a:', email);
    } catch (error) {
      console.error('❌ Error enviando verificación:', error);
      throw error;
    }
  };
  
  console.log('✅ Basic email trigger loaded');
} catch (error) {
  console.error('⚠️ Error loading email trigger:', error.message);
}

// ===== CÁLCULO AUTOMÁTICO DE CLASIFICACIÓN 40% =====

/**
 * Función manual para calcular los clasificados al 40% por región
 * Se ejecuta desde el admin cuando finaliza la Fase 2 (Clasificación)
 * 
 * Endpoint: /calcularClasificados
 * Método: POST
 * Body: { certamenId: "santafe_2025", fase: 2 }
 */
exports.calcularClasificados = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    const { certamenId, fase } = req.body;
    
    if (!certamenId || !fase) {
      return res.status(400).json({ 
        error: 'Faltan parámetros: certamenId y fase son requeridos' 
      });
    }
    
    console.log(`🎯 Calculando clasificados para certamen: ${certamenId}, fase: ${fase}`);
    
    // Obtener configuración del certamen
    const configDoc = await db.collection('configuracion_sistema').doc('config_principal').get();
    const config = configDoc.data();
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    const porcentajeClasificacion = config.certamen?.porcentaje_clasificacion || 40;
    const regionesActivas = config.certamen?.regiones || { norte: true, centro: true, sur: true };
    
    // Obtener todas las inscripciones del certamen
    const inscripcionesSnapshot = await db.collection('inscripciones')
      .where('estado', '==', 'aprobado')
      .get();
    
    if (inscripcionesSnapshot.empty) {
      return res.status(404).json({ error: 'No hay inscripciones aprobadas' });
    }
    
    // Agrupar por región
    const porRegion = {
      norte: [],
      centro: [],
      sur: []
    };
    
    inscripcionesSnapshot.forEach(doc => {
      const data = doc.data();
      const region = data.codigoRegion || 'centro';
      porRegion[region].push({
        id: doc.id,
        votos: data.votos || 0,
        nombreArtista: data.nombreArtista || 'Sin nombre',
        provincia: data.provincia,
        ciudad: data.ciudad
      });
    });
    
    // Calcular clasificados por región
    const resultados = {};
    let totalClasificados = 0;
    
    for (const [region, participantes] of Object.entries(porRegion)) {
      if (!regionesActivas[region] || participantes.length === 0) {
        console.log(`⏭️ Región ${region} deshabilitada o sin participantes`);
        continue;
      }
      
      // Ordenar por votos descendente
      participantes.sort((a, b) => b.votos - a.votos);
      
      // Calcular cuántos clasifican
      const cantidadClasificados = Math.ceil(participantes.length * (porcentajeClasificacion / 100));
      
      // Si una región tiene menos de 30, fusionar con centro (simplificado para MVP)
      const minimoParticipantes = 30;
      if (participantes.length < minimoParticipantes && region !== 'centro') {
        console.log(`⚠️ Región ${region} tiene solo ${participantes.length} participantes (< ${minimoParticipantes}). Fusionando con centro.`);
        // En MVP simplificado, solo marcamos esto pero procesamos igual
      }
      
      // Actualizar estado de los clasificados
      const batch = db.batch();
      const clasificados = participantes.slice(0, cantidadClasificados);
      
      for (const participante of clasificados) {
        const docRef = db.collection('inscripciones').doc(participante.id);
        batch.update(docRef, {
          estado: 'semifinalista',
          fase_actual: 3,
          fecha_clasificacion: admin.firestore.FieldValue.serverTimestamp(),
          posicion_regional: clasificados.indexOf(participante) + 1
        });
      }
      
      await batch.commit();
      
      resultados[region] = {
        total: participantes.length,
        clasificados: cantidadClasificados,
        porcentaje: porcentajeClasificacion,
        listado: clasificados.map((p, idx) => ({
          posicion: idx + 1,
          nombre: p.nombreArtista,
          votos: p.votos,
          ciudad: p.ciudad
        }))
      };
      
      totalClasificados += cantidadClasificados;
      
      console.log(`✅ Región ${region}: ${cantidadClasificados}/${participantes.length} clasificados`);
    }
    
    // Guardar registro histórico
    await db.collection('historial_clasificaciones').add({
      certamenId,
      fase,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      porcentaje: porcentajeClasificacion,
      resultados,
      totalClasificados,
      ejecutadoPor: 'sistema'
    });
    
    res.json({
      success: true,
      message: `Clasificación completada: ${totalClasificados} semifinalistas`,
      resultados
    });
    
  } catch (error) {
    console.error('❌ Error calculando clasificados:', error);
    res.status(500).json({ 
      error: 'Error procesando clasificación',
      details: error.message 
    });
  }
});