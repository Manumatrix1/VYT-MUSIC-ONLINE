/**
 * VYT MUSIC - AUTOMATIZACIÓN YOUTUBE CON N8N
 * 
 * Sistema de webhooks para automatizar la subida de videos a YouTube
 * Flujo: Firebase Storage → n8n → YouTube → Firestore → Activación de votos
 * 
 * Fecha: 12 de Enero 2026
 * Versión: 1.0.0
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

const db = admin.firestore();

// ===== CONFIGURACIÓN =====

// URL del webhook de n8n (se configurará en variables de entorno)
const N8N_WEBHOOK_URL = functions.config().n8n?.webhook_url || process.env.N8N_WEBHOOK_URL || 'https://n8n.vyt-music.com/webhook/youtube-upload';

// Token secreto para autenticar callbacks desde n8n
const N8N_SECRET_TOKEN = functions.config().n8n?.secret_token || process.env.N8N_SECRET_TOKEN || 'CHANGE_ME_IN_PRODUCTION';

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Genera un hash HMAC para validar la autenticidad de los webhooks
 */
function generateWebhookSignature(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * Valida que el webhook venga de n8n verificando la firma
 */
function validateWebhookSignature(payload, signature, secret) {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ===== ENDPOINT 1: WEBHOOK DE SALIDA (Firebase → n8n) =====

/**
 * DISPARADOR: Se ejecuta cuando el pago es confirmado
 * FUNCIÓN: Envía los datos del video a n8n para que lo suba a YouTube
 * 
 * Flujo:
 * 1. Artista paga inscripción (MercadoPago)
 * 2. Esta función se dispara automáticamente
 * 3. Envía datos a n8n: nombre, video_url, zona, email
 * 4. n8n descarga el video, lo sube a YouTube y llama al callback
 */
exports.triggerYouTubeUpload = functions.firestore
  .document('participaciones/{participacionId}')
  .onUpdate(async (change, context) => {
    const antes = change.before.data();
    const despues = change.after.data();
    
    // Solo disparar cuando el estado cambie de 'waiting_payment' a 'paid'
    if (antes.estado === 'waiting_payment' && despues.estado === 'paid') {
      const participacionId = context.params.participacionId;
      
      console.log(`🎬 Disparando subida a YouTube para: ${participacionId}`);
      
      try {
        // Preparar payload para n8n
        const payload = {
          // Identificación
          participacion_id: participacionId,
          artista_id: despues.uid,
          
          // Datos del artista
          nombre_artista: despues.nombreArtista,
          email: despues.email,
          telefono: despues.telefono || '',
          
          // Datos del video
          video_url_temporal: despues.videoURL, // URL de Firebase Storage
          titulo_cancion: despues.cancion,
          genero: despues.genero,
          
          // Ubicación
          zona: despues.zona,
          provincia: despues.provincia,
          ciudad: despues.ciudad,
          
          // Metadata
          timestamp: new Date().toISOString(),
          webhook_source: 'vyt-music-firebase'
        };
        
        // Generar firma de seguridad
        const signature = generateWebhookSignature(payload, N8N_SECRET_TOKEN);
        
        // Enviar a n8n
        const response = await axios.post(N8N_WEBHOOK_URL, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-VYT-Source': 'firebase-functions'
          },
          timeout: 10000 // 10 segundos timeout
        });
        
        console.log(`✅ Webhook enviado a n8n: ${response.status}`);
        
        // Actualizar estado en Firestore para tracking
        await db.collection('participaciones').doc(participacionId).update({
          youtube_upload_status: 'processing',
          youtube_webhook_sent: admin.firestore.FieldValue.serverTimestamp(),
          youtube_webhook_response: response.status
        });
        
        // Log del evento
        await db.collection('system_logs').add({
          tipo: 'youtube_upload_triggered',
          participacion_id: participacionId,
          artista: despues.nombreArtista,
          n8n_response: response.status,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
      } catch (error) {
        console.error('❌ Error enviando webhook a n8n:', error.message);
        
        // Marcar como error para retry manual
        await db.collection('participaciones').doc(participacionId).update({
          youtube_upload_status: 'error',
          youtube_upload_error: error.message,
          youtube_error_timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Log del error
        await db.collection('system_logs').add({
          tipo: 'youtube_upload_error',
          participacion_id: participacionId,
          error: error.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  });

// ===== ENDPOINT 2: WEBHOOK DE ENTRADA (n8n → Firebase) =====

/**
 * CALLBACK: n8n llama a este endpoint cuando termina de subir el video a YouTube
 * FUNCIÓN: Actualiza el documento del artista con el link de YouTube
 * 
 * Flujo:
 * 1. n8n sube el video a YouTube
 * 2. YouTube devuelve el link (https://youtube.com/watch?v=ABC123)
 * 3. n8n llama a esta función con el link
 * 4. Esta función actualiza Firestore
 * 5. El video se activa automáticamente en la web
 */
exports.youtubeUploadCallback = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Signature, X-VYT-Source');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  
  try {
    // Validar firma del webhook
    const signature = req.headers['x-webhook-signature'];
    if (!signature) {
      console.error('❌ Webhook sin firma de seguridad');
      res.status(401).json({ error: 'Firma de seguridad requerida' });
      return;
    }
    
    // Validar que la firma sea correcta
    try {
      const isValid = validateWebhookSignature(req.body, signature, N8N_SECRET_TOKEN);
      if (!isValid) {
        console.error('❌ Firma de webhook inválida');
        res.status(401).json({ error: 'Firma inválida' });
        return;
      }
    } catch (error) {
      console.error('❌ Error validando firma:', error);
      res.status(401).json({ error: 'Error validando firma' });
      return;
    }
    
    // Extraer datos del payload
    const {
      participacion_id,
      youtube_link,
      youtube_video_id,
      upload_status,
      error_message,
      thumbnail_url,
      duration,
      upload_timestamp
    } = req.body;
    
    // Validar campos requeridos
    if (!participacion_id) {
      res.status(400).json({ error: 'participacion_id es requerido' });
      return;
    }
    
    console.log(`📥 Callback de n8n recibido para: ${participacion_id}`);
    console.log(`🎬 Estado: ${upload_status}, Link: ${youtube_link}`);
    
    // Preparar actualización
    const updateData = {
      youtube_upload_status: upload_status, // 'completed' o 'failed'
      youtube_callback_received: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (upload_status === 'completed' && youtube_link) {
      // Subida exitosa
      updateData.youtube_link = youtube_link;
      updateData.youtube_video_id = youtube_video_id;
      updateData.youtube_thumbnail = thumbnail_url || `https://img.youtube.com/vi/${youtube_video_id}/mqdefault.jpg`;
      updateData.video_duration = duration;
      updateData.video_activo = true; // IMPORTANTE: Habilita votación
      updateData.youtube_uploaded_at = upload_timestamp || admin.firestore.FieldValue.serverTimestamp();
      
      // Cambiar estado a 'activo' para que aparezca en ranking
      updateData.estado = 'activo';
      
    } else if (upload_status === 'failed') {
      // Subida fallida
      updateData.youtube_upload_error = error_message || 'Error desconocido';
      updateData.video_activo = false;
    }
    
    // Actualizar documento en Firestore
    await db.collection('participaciones').doc(participacion_id).update(updateData);
    
    console.log(`✅ Documento actualizado en Firestore: ${participacion_id}`);
    
    // Si la subida fue exitosa, enviar notificación al artista
    if (upload_status === 'completed') {
      const participacionDoc = await db.collection('participaciones').doc(participacion_id).get();
      const participacionData = participacionDoc.data();
      
      // Crear notificación para el artista
      await db.collection('notificaciones').add({
        userId: participacionData.uid,
        tipo: 'video_activo',
        titulo: '¡Tu video está en línea!',
        mensaje: `Tu video "${participacionData.cancion}" ya está publicado y los votos están habilitados. ¡Comparte tu link para recibir votos!`,
        leida: false,
        metadata: {
          youtube_link: youtube_link,
          participacion_id: participacion_id
        },
        fecha: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`📬 Notificación enviada al artista`);
    }
    
    // Log del evento
    await db.collection('system_logs').add({
      tipo: 'youtube_callback_received',
      participacion_id: participacion_id,
      upload_status: upload_status,
      youtube_link: youtube_link || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Responder a n8n
    res.status(200).json({
      success: true,
      message: 'Callback procesado correctamente',
      participacion_id: participacion_id,
      updated_fields: Object.keys(updateData)
    });
    
  } catch (error) {
    console.error('❌ Error procesando callback de n8n:', error);
    
    // Log del error
    await db.collection('system_logs').add({
      tipo: 'youtube_callback_error',
      error: error.message,
      stack: error.stack,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(500).json({
      success: false,
      error: 'Error interno procesando callback',
      message: error.message
    });
  }
});

// ===== ENDPOINT 3: RETRY MANUAL (Admin) =====

/**
 * FUNCIÓN ADMIN: Permite reintentar la subida de un video manualmente
 * Útil si el webhook falló o si se necesita re-procesar un video
 */
exports.retryYouTubeUpload = functions.https.onCall(async (data, context) => {
  // Validar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado');
  }
  
  // Validar que sea admin
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().admin) {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden reintentar subidas');
  }
  
  const { participacion_id } = data;
  
  if (!participacion_id) {
    throw new functions.https.HttpsError('invalid-argument', 'participacion_id es requerido');
  }
  
  try {
    console.log(`🔄 Reintentando subida para: ${participacion_id}`);
    
    // Obtener documento
    const participacionDoc = await db.collection('participaciones').doc(participacion_id).get();
    if (!participacionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participación no encontrada');
    }
    
    const participacionData = participacionDoc.data();
    
    // Preparar payload
    const payload = {
      participacion_id: participacion_id,
      artista_id: participacionData.uid,
      nombre_artista: participacionData.nombreArtista,
      email: participacionData.email,
      video_url_temporal: participacionData.videoURL,
      titulo_cancion: participacionData.cancion,
      genero: participacionData.genero,
      zona: participacionData.zona,
      provincia: participacionData.provincia,
      ciudad: participacionData.ciudad,
      timestamp: new Date().toISOString(),
      webhook_source: 'vyt-music-retry',
      retry_by: context.auth.email
    };
    
    const signature = generateWebhookSignature(payload, N8N_SECRET_TOKEN);
    
    // Enviar a n8n
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-VYT-Source': 'firebase-functions-retry'
      },
      timeout: 10000
    });
    
    // Actualizar estado
    await db.collection('participaciones').doc(participacion_id).update({
      youtube_upload_status: 'processing',
      youtube_retry_timestamp: admin.firestore.FieldValue.serverTimestamp(),
      youtube_retry_by: context.auth.email
    });
    
    console.log(`✅ Retry enviado a n8n: ${response.status}`);
    
    return {
      success: true,
      message: 'Reintento enviado a n8n',
      participacion_id: participacion_id
    };
    
  } catch (error) {
    console.error('❌ Error en retry:', error.message);
    throw new functions.https.HttpsError('internal', `Error: ${error.message}`);
  }
});

// ===== ENDPOINT 4: VERIFICAR ESTADO =====

/**
 * FUNCIÓN PÚBLICA: Permite verificar el estado de procesamiento de un video
 * Útil para mostrar progreso en tiempo real en la UI
 */
exports.checkYouTubeUploadStatus = functions.https.onCall(async (data, context) => {
  // Validar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado');
  }
  
  const { participacion_id } = data;
  
  if (!participacion_id) {
    throw new functions.https.HttpsError('invalid-argument', 'participacion_id es requerido');
  }
  
  try {
    const participacionDoc = await db.collection('participaciones').doc(participacion_id).get();
    
    if (!participacionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participación no encontrada');
    }
    
    const participacionData = participacionDoc.data();
    
    // Verificar que sea el dueño o admin
    const isOwner = participacionData.uid === context.auth.uid;
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const isAdmin = userDoc.exists && userDoc.data().admin;
    
    if (!isOwner && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para ver este video');
    }
    
    return {
      participacion_id: participacion_id,
      upload_status: participacionData.youtube_upload_status || 'pending',
      video_activo: participacionData.video_activo || false,
      youtube_link: participacionData.youtube_link || null,
      error: participacionData.youtube_upload_error || null,
      webhook_sent: participacionData.youtube_webhook_sent || null,
      callback_received: participacionData.youtube_callback_received || null
    };
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    throw new functions.https.HttpsError('internal', `Error: ${error.message}`);
  }
});

// ===== CONFIGURACIÓN DE VARIABLES DE ENTORNO =====

/**
 * Para configurar las variables de entorno:
 * 
 * firebase functions:config:set n8n.webhook_url="https://n8n.vyt-music.com/webhook/youtube-upload"
 * firebase functions:config:set n8n.secret_token="tu-token-super-secreto-aqui"
 * 
 * Para ver la configuración actual:
 * firebase functions:config:get
 */
