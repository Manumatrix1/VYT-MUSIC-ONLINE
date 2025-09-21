const functions = require("firebase-functions");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer");
const { defineSecret, defineString } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { google } = require('googleapis');
const multer = require('multer');
const FormData = require('form-data');
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

// Importar funciones de certámenes jerárquicos
const certamenesJerarquicos = require('./certamenes-jerarquicos');

// Import additional modules (now enabled for production)
const perfilesArtistas = require('./perfiles-artistas');
const moderacionContenido = require('./moderacion-contenido');
const paymentsSystem = require('./payments-system');
const comentariosModerados = require('./comentarios-moderados');

// Define environment variables
const gmailEmail = defineString("GMAIL_EMAIL");
const gmailPassword = defineString("GMAIL_PASSWORD");
const mercadopagoToken = defineString("MERCADOPAGO_TOKEN");
const siteUrl = defineString("SITE_URL", { default: "https://vytonlineprueva.web.app" });

// YouTube API configuration
const youtubeClientId = defineSecret("YOUTUBE_CLIENT_ID");
const youtubeClientSecret = defineSecret("YOUTUBE_CLIENT_SECRET");
const youtubeRefreshToken = defineSecret("YOUTUBE_REFRESH_TOKEN");

// Participant Status Management System
const PARTICIPANT_STATES = {
  PENDING_INITIAL_REVIEW: 'pending_initial_review',           // Video inicial recibido, pendiente de revisión
  INITIAL_APPROVED: 'initial_approved',                       // Video inicial aprobado, esperando pago y video final
  INITIAL_REJECTED: 'initial_rejected',                       // Video inicial rechazado
  PAYMENT_PENDING: 'payment_pending',                         // Aprobado inicial, esperando pago
  PAYMENT_CONFIRMED: 'payment_confirmed',                     // Pago confirmado, esperando video final
  FINAL_VIDEO_RECEIVED: 'final_video_received',               // Video final recibido, pendiente de aprobación final
  FINAL_APPROVED: 'final_approved',                           // Video final aprobado, listo para publicación
  FINAL_REJECTED: 'final_rejected',                           // Video final rechazado
  PUBLISHED: 'published',                                     // Video publicado en YouTube y web
  DISQUALIFIED: 'disqualified'                               // Descalificado por cualquier motivo
};

const REJECTION_REASONS = {
  POOR_AUDIO_QUALITY: 'poor_audio_quality',
  POOR_VIDEO_QUALITY: 'poor_video_quality',
  LOW_PRODUCTION: 'low_production',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  TECHNICAL_ISSUES: 'technical_issues',
  DOES_NOT_MEET_REQUIREMENTS: 'does_not_meet_requirements',
  OTHER: 'other'
};

setGlobalOptions({ region: "us-central1" });

admin.initializeApp();

let transporter;

// YouTube API helper functions
async function getYouTubeAuth() {
  const oauth2Client = new google.auth.OAuth2(
    youtubeClientId.value(),
    youtubeClientSecret.value(),
    'urn:ietf:wg:oauth:2.0:oob' // for server applications
  );

  oauth2Client.setCredentials({
    refresh_token: youtubeRefreshToken.value()
  });

  return oauth2Client;
}

async function uploadVideoToYouTube(videoUrl, participantData) {
  try {
    const auth = await getYouTubeAuth();
    const youtube = google.youtube({ version: 'v3', auth });

    // Download video from URL (assuming it's a direct video URL)
    const response = await fetch(videoUrl);
    const videoBuffer = await response.buffer();

    const title = `${participantData.nombre} ${participantData.apellido} - ${participantData.provincia} | VYT Music Certamen`;
    const description = `
🎤 Participante del Certamen VYT Music
👤 Artista: ${participantData.nombre} ${participantData.apellido}
📍 Provincia: ${participantData.provincia}
🎵 Canción: ${participantData.cancion || 'No especificada'}

¡Vota por tu participante favorito en ${siteUrl.value()}/certamenes.html!

#VYTMusic #CertamenDeCanto #${participantData.provincia} #TalentoArgentino
    `.trim();

    const videoMetadata = {
      snippet: {
        title: title,
        description: description,
        tags: ['VYT Music', 'Certamen', 'Canto', participantData.provincia, 'Argentina', 'Talento'],
        categoryId: '10', // Music category
        defaultLanguage: 'es',
        defaultAudioLanguage: 'es'
      },
      status: {
        privacyStatus: 'public',
        publishAt: null // Publish immediately
      }
    };

    const uploadResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: videoMetadata,
      media: {
        body: videoBuffer
      }
    });

    console.log(`Video uploaded successfully. YouTube ID: ${uploadResponse.data.id}`);
    return uploadResponse.data.id;

  } catch (error) {
    console.error('Error uploading video to YouTube:', error);
    throw error;
  }
}

async function updateVideoMetadata(youtubeVideoId, updates) {
  try {
    const auth = await getYouTubeAuth();
    const youtube = google.youtube({ version: 'v3', auth });

    await youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: youtubeVideoId,
        snippet: updates
      }
    });

    console.log(`Video metadata updated for YouTube ID: ${youtubeVideoId}`);
  } catch (error) {
    console.error('Error updating video metadata:', error);
    throw error;
  }
}

async function deleteVideoFromYouTube(youtubeVideoId) {
  try {
    const auth = await getYouTubeAuth();
    const youtube = google.youtube({ version: 'v3', auth });

    await youtube.videos.delete({
      id: youtubeVideoId
    });

    console.log(`Video deleted from YouTube: ${youtubeVideoId}`);
  } catch (error) {
    console.error('Error deleting video from YouTube:', error);
    throw error;
  }
}

// Enviar correo al inscribirse (participante online)
exports.enviarCorreoInscripcionOnline = onDocumentCreated(
  "participantes_online/{participantId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    const data = snapshot.data();
    if (!data.email) return null;
    try {
      if (!transporter) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailEmail.value(),
            pass: gmailPassword.value(),
          },
        });
      }
      const mailOptions = {
        from: `VYT Music <${gmailEmail.value()}>`,
        to: data.email,
        subject: "📢 ¡Felicitaciones! 🎤✨ Tu video ya fue recibido",
  html: `
<h2>📢 ¡Felicitaciones! 🎤✨</h2>
<p>Tu video ya fue recibido y en este momento está siendo evaluado por nuestro equipo de jurados. 🙌</p>
<p>👉 Muy pronto te enviaremos los resultados y los próximos pasos para continuar con tu inscripción.<br>
Mientras tanto, ¡te invitamos a estar atent@ a tu correo y a nuestras notificaciones!</p>
<p>Gracias por animarte a ser parte del certamen. 💫</p>
<p><a href="${siteUrl.value()}/principal.html" style="color:#2563eb;text-decoration:underline;font-weight:bold;">Volver a la página principal</a></p>
<p>El equipo de VYT Music</p>
  `
      };
      await transporter.sendMail(mailOptions);
      console.log(`Correo de inscripción enviado a: ${data.email}`);
    } catch (error) {
      console.error("Error enviando correo de inscripción:", error);
    }
    return null;
  }
);

// Enviar correo al inscribirse (participante presencial)
exports.enviarCorreoInscripcionPresencial = onDocumentCreated(
  "participantes_presenciales/{participantId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    const data = snapshot.data();
    if (!data.email) return null;
    try {
      if (!transporter) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailEmail.value(),
            pass: gmailPassword.value(),
          },
        });
      }
      const mailOptions = {
        from: `VYT Music <${gmailEmail.value()}>`,
        to: data.email,
        subject: "📢 ¡Felicitaciones! 🎤✨ Tu video ya fue recibido",
  html: `
<h2>📢 ¡Felicitaciones! 🎤✨</h2>
<p>Tu video ya fue recibido y en este momento está siendo evaluado por nuestro equipo de jurados. 🙌</p>
<p>👉 Muy pronto te enviaremos los resultados y los próximos pasos para continuar con tu inscripción.<br>
Mientras tanto, ¡te invitamos a estar atent@ a tu correo y a nuestras notificaciones!</p>
<p>Gracias por animarte a ser parte del certamen. 💫</p>
<p><a href="${siteUrl.value()}/principal.html" style="color:#2563eb;text-decoration:underline;font-weight:bold;">Volver a la página principal</a></p>
<p>El equipo de VYT Music</p>
  `
      };
      await transporter.sendMail(mailOptions);
      console.log(`Correo de inscripción enviado a: ${data.email}`);
    } catch (error) {
      console.error("Error enviando correo de inscripción:", error);
    }
    return null;
  }
);

// --- Backup / Export utilities ---
const EXPORT_COLLECTIONS = [
  'participantes_online',
  'participantes_presenciales',
  'configuracion',
  'contenido_home',
  'contenido_dinamico',
  'certamenes_online'
];

// Function to send approval email with payment link
exports.enviarCorreoAprobacion = onDocumentUpdated(
  "participantes_online/{participantId}",
  async (event) => {
    const change = event.data;
    if (!change) {
      return null;
    }

    const newValue = change.after.data();
    const previousValue = change.before.data();
    const participantId = event.params.participantId;

    // Trigger only when participant is approved for the first time
    if (previousValue && !previousValue.aprobado && newValue.aprobado) {
      try {
        // --- 1. Initialize services ---
        if (!transporter) {
          transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: gmailEmail.value(),
              pass: gmailPassword.value(),
            },
          });
        }
        const mercadopagoClient = new MercadoPagoConfig({ accessToken: mercadopagoToken.value() });

        // --- 2. Upload video to YouTube (if video URL exists) ---
        let youtubeVideoId = null;
        if (newValue.video_url) {
          try {
            console.log(`Uploading video to YouTube for participant: ${participantId}`);
            youtubeVideoId = await uploadVideoToYouTube(newValue.video_url, newValue);
            
            // Update participant record with YouTube video ID
            await admin.firestore()
              .collection('participantes_online')
              .doc(participantId)
              .update({
                youtube_video_id: youtubeVideoId,
                youtube_uploaded: true,
                youtube_upload_date: admin.firestore.FieldValue.serverTimestamp()
              });
            
            console.log(`Video uploaded to YouTube successfully. ID: ${youtubeVideoId}`);
          } catch (youtubeError) {
            console.error('Error uploading to YouTube:', youtubeError);
            // Continue with the rest of the process even if YouTube upload fails
          }
        }

        // --- 3. Get inscription price from Firestore ---
        const priceDoc = await admin.firestore().collection('configuracion').doc('precios').get();
        const inscripcionPrice = priceDoc.data()?.inscripcion || 30000;        // --- 3. Create Mercado Pago Preference ---
        const preference = new Preference(mercadopagoClient);
        const preferenceData = {
          body: {
            items: [
              {
                id: participantId,
                title: "Inscripción al Certamen VYT Music",
                quantity: 1,
                unit_price: inscripcionPrice,
                currency_id: "ARS",
              },
            ],
            payer: {
              name: newValue.nombre_artista,
              email: newValue.email,
            },
            back_urls: {
              success: `${siteUrl.value()}/pago/pago_exitoso.html`,
              failure: `${siteUrl.value()}/pago/pago_fallido.html`,
              pending: `${siteUrl.value()}/pago/pago_pendiente.html`,
            },
            auto_return: "approved",
            external_reference: participantId, // Link payment to participant
            notification_url: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/recibirNotificacionPago`,
          },
        };

        const mpResponse = await preference.create(preferenceData);
        const paymentLink = mpResponse.init_point;

        // --- 4. Send Email with Payment Link ---
        const mailOptions = {
          from: `VYT Music <${gmailEmail.value()}>`,
          to: newValue.email,
          subject: "¡Has sido pre-seleccionado en VYT Music!",
          html: `<h1>¡Felicidades, ${newValue.nombre_artista}!</h1>
  <p>Tu video ha pasado la etapa de casting.</p>
  <p>Para convertirte en participante oficial del certamen, por favor completa los siguientes pasos:</p>
  <ol>
    <li>Realiza el pago de la inscripción de $${inscripcionPrice} ARS haciendo clic aquí: <a href="${paymentLink}" target="_blank">PAGAR INSCRIPCIÓN</a></li>
    <li>Envíanos el enlace de tu video final para el concurso respondiendo a este correo.</li>
  </ol>
  <p>¡Mucho éxito!</p>
  <p>El equipo de VYT Music</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Approval email with payment link sent to: ${newValue.email}`);

      } catch (error) {
        console.error("Error processing approval and payment link creation:", error);
      }
    }
    return null;
  }
);

// Function to send approval email for presencial participants
exports.enviarCorreoAprobacionPresencial = onDocumentUpdated(
  "participantes_presenciales/{participantId}",
  async (event) => {
    const change = event.data;
    if (!change) {
      return null;
    }

    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Trigger only when participant is approved for the first time
    if (previousValue && !previousValue.aprobado && newValue.aprobado) {
      try {
        if (!transporter) {
          transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: gmailEmail.value(),
              pass: gmailPassword.value(),
            },
          });
        }

        const mailOptions = {
          from: `VYT Music <${gmailEmail.value()}>`,
          to: newValue.email,
          subject: "🎉 ¡Felicitaciones! Tu inscripción ha sido APROBADA ✅",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #28a745; text-align: center; margin-bottom: 30px;">🎉 ¡APROBADO! 🎉</h1>
                
                <p style="font-size: 18px; color: #333; line-height: 1.6;">¡Hola <strong>${newValue.nombre_artista}</strong>!</p>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  ¡Excelentes noticias! 🌟 Tu inscripción para el certamen VYT Music ha sido <strong style="color: #28a745;">APROBADA</strong> por nuestro equipo de jurados.
                </p>
                
                <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                  <h3 style="color: #28a745; margin-top: 0;">📋 Detalles de tu inscripción:</h3>
                  <p style="margin: 5px 0;"><strong>Modalidad:</strong> Presencial</p>
                  <p style="margin: 5px 0;"><strong>Nombre artístico:</strong> ${newValue.nombre_artista}</p>
                  <p style="margin: 5px 0;"><strong>Estado:</strong> ✅ Aprobado</p>
                </div>
                
                <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <h3 style="color: #856404; margin-top: 0;">📝 Próximos pasos:</h3>
                  <ul style="color: #856404; line-height: 1.8;">
                    <li>Mantente atento a tu correo para más información sobre el concurso</li>
                    <li>Sigue nuestras redes sociales para actualizaciones</li>
                    <li>Prepárate para las siguientes etapas del certamen</li>
                  </ul>
                </div>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  ¡Gracias por ser parte de VYT Music! 🎤✨
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${siteUrl.value()}/principal.html" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    🏠 Volver a la página principal
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 14px; text-align: center;">
                  El equipo de VYT Music<br>
                  <small>Este correo se envió automáticamente, no responder a este mensaje.</small>
                </p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de aprobación enviado a participante presencial: ${newValue.email}`);
      } catch (error) {
        console.error("Error enviando correo de aprobación presencial:", error);
      }
    }
    return null;
  }
);

// Webhook to receive payment notifications from Mercado Pago
exports.recibirNotificacionPago = onRequest({ cors: true }, async (req, res) => {
  console.log("Webhook received from Mercado Pago");

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { type, data } = req.body;

  if (type === 'payment') {
    try {
      const mercadopagoClient = new MercadoPagoConfig({ accessToken: mercadopagoToken.value() });
      const payment = await new Payment(mercadopagoClient).get({ id: data.id });

      if (payment && payment.status === 'approved') {
        const participantId = payment.external_reference;
        if (participantId) {
          const participantRef = admin.firestore().collection('participantes_online').doc(participantId);
          await participantRef.update({
            pago_confirmado: true,
            fecha_pago: new Date().toISOString(),
            monto_pago: payment.transaction_amount,
            payment_id: payment.id
          });
          console.log(`Payment confirmed for participant: ${participantId}`);
        } else {
          console.error("Error: external_reference (participantId) not found in payment notification.");
        }
      }
    } catch (error) {
      console.error("Error processing Mercado Pago notification:", error);
      res.status(500).send('Error processing notification');
      return;
    }
  }

  res.status(200).send('Notification received');
});

// Function to send rejection email
exports.enviarCorreoRechazo = onDocumentUpdated(
  "participantes_online/{participantId}",
  async (event) => {
    const change = event.data;
    if (!change) {
      return null;
    }

    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Trigger only when participant is rejected for the first time
    if (previousValue && !previousValue.rechazado && newValue.rechazado) {
      try {
        // --- Initialize services ---
        if (!transporter) {
          transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: gmailEmail.value(),
              pass: gmailPassword.value(),
            },
          });
        }

        // --- Get rejection template from Firestore ---
        const templateRef = admin.firestore().collection('configuracion').doc('plantilla_rechazo');
        const templateSnap = await templateRef.get();
        const templateData = templateSnap.data() || {};

        const subjectTemplate = templateData.asunto || "Información sobre tu postulación a VYT Music";
        const contentTemplate = templateData.contenido || `<h1>Hola, [nombre_artista]</h1>
<p>Te agradecemos tu interés y el tiempo que has dedicado para participar en VYT Music.</p>
<p>En esta ocasión, tu video no ha sido seleccionado para continuar en el certamen. El motivo es el siguiente:</p>
<p><strong>[motivo_rechazo]</strong></p>
<p>Te animamos a que sigas persiguiendo tus sueños y no dejes de hacer música. ¡Esperamos verte en futuras ediciones!</p>
<p>Saludos cordiales,</p>
<p>El equipo de VYT Music</p>`;

        // --- Personalize Email ---
        const subject = subjectTemplate.replace('[nombre_artista]', newValue.nombre_artista);
        const html = contentTemplate
          .replace('[nombre_artista]', newValue.nombre_artista)
          .replace('[motivo_rechazo]', newValue.motivo_rechazo || 'No se ha especificado un motivo.');


        // --- Send Email ---
        const mailOptions = {
          from: `VYT Music <${gmailEmail.value()}>`,
          to: newValue.email,
          subject: subject,
          html: html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Rejection email sent to: ${newValue.email}`);

      } catch (error) {
        console.error("Error sending rejection email:", error);
      }
    }
    return null;
  }
);

// --- HTTP Function: Export Firestore data as JSON ---
exports.exportarBackup = onRequest({ cors: true }, async (req, res) => {
  try {
    // Optional: Simple token auth via query ?token=... (add environment rule in production)
    const token = req.query.token;
    const expected = process.env.EXPORT_TOKEN || undefined;
    if (expected && token !== expected) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const db = admin.firestore();
    const resultado = {};
    for (const col of EXPORT_COLLECTIONS) {
      const snap = await db.collection(col).get();
      resultado[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify({
      exportedAt: new Date().toISOString(),
      project: process.env.GCLOUD_PROJECT,
      collections: resultado
    }, null, 2));
  } catch (err) {
    console.error('Error exportando backup:', err);
    res.status(500).json({ error: 'Error exportando backup', detalle: String(err) });
  }
});

// --- Callable Functions for Admin Actions ---

// Function to send approval email when admin manually approves a participant
exports.sendApprovalEmail = onCall({ 
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5000",
    "http://localhost:5000"
  ]
}, async (request) => {
  const { participantId, modalidad } = request.data;
  
  if (!participantId || !modalidad) {
    throw new functions.https.HttpsError('invalid-argument', 'ParticipantId and modalidad are required');
  }

  try {
    const collectionName = modalidad === 'online' ? 'participantes_online' : 'participantes_presenciales';
    const participantDoc = await admin.firestore().collection(collectionName).doc(participantId).get();
    
    if (!participantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participant not found');
    }

    const data = participantDoc.data();
    
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value(),
        },
      });
    }

    const mailOptions = {
      from: `VYT Music <${gmailEmail.value()}>`,
      to: data.email,
      subject: "🎉 ¡Felicitaciones! Tu inscripción ha sido APROBADA ✅",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #28a745; text-align: center; margin-bottom: 30px;">🎉 ¡APROBADO! 🎉</h1>
            
            <p style="font-size: 18px; color: #333; line-height: 1.6;">¡Hola <strong>${data.nombre_artista}</strong>!</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              ¡Excelentes noticias! 🌟 Tu inscripción para el certamen VYT Music ha sido <strong style="color: #28a745;">APROBADA</strong> por nuestro equipo de jurados.
            </p>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin-top: 0;">📋 Detalles de tu inscripción:</h3>
              <p style="margin: 5px 0;"><strong>Modalidad:</strong> ${modalidad.charAt(0).toUpperCase() + modalidad.slice(1)}</p>
              <p style="margin: 5px 0;"><strong>Nombre artístico:</strong> ${data.nombre_artista}</p>
              <p style="margin: 5px 0;"><strong>Estado:</strong> ✅ Aprobado</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">📝 Próximos pasos:</h3>
              <ul style="color: #856404; line-height: 1.8;">
                <li>Mantente atento a tu correo para más información sobre el concurso</li>
                <li>Sigue nuestras redes sociales para actualizaciones</li>
                <li>Prepárate para las siguientes etapas del certamen</li>
              </ul>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              ¡Gracias por ser parte de VYT Music! 🎤✨
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${siteUrl.value()}/principal.html" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🏠 Volver a la página principal
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; text-align: center;">
              El equipo de VYT Music<br>
              <small>Este correo se envió automáticamente, no responder a este mensaje.</small>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de aprobación manual enviado a: ${data.email}`);
    
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw new functions.https.HttpsError('internal', 'Error sending email: ' + error.message);
  }
});

// Function to send rejection email when admin manually rejects a participant
exports.sendRejectionEmail = onCall({ 
  cors: [
    "https://manumatrix1.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5000",
    "http://localhost:5000"
  ]
}, async (request) => {
  const { participantId, modalidad } = request.data;
  
  if (!participantId || !modalidad) {
    throw new functions.https.HttpsError('invalid-argument', 'ParticipantId and modalidad are required');
  }

  try {
    const collectionName = modalidad === 'online' ? 'participantes_online' : 'participantes_presenciales';
    const participantDoc = await admin.firestore().collection(collectionName).doc(participantId).get();
    
    if (!participantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participant not found');
    }

    const data = participantDoc.data();
    
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value(),
        },
      });
    }

    const mailOptions = {
      from: `VYT Music <${gmailEmail.value()}>`,
      to: data.email,
      subject: "📩 Resultado de tu inscripción - VYT Music",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #dc3545; text-align: center; margin-bottom: 30px;">📩 Resultado de Evaluación</h1>
            
            <p style="font-size: 18px; color: #333; line-height: 1.6;">Hola <strong>${data.nombre_artista}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Gracias por tu interés en participar en el certamen VYT Music. 🎤
            </p>
            
            <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="color: #721c24; font-size: 16px; line-height: 1.6; margin: 0;">
                Después de evaluar tu inscripción, lamentamos informarte que en esta ocasión no podrás continuar en el proceso del certamen.
              </p>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #bee5eb;">
              <h3 style="color: #0c5460; margin-top: 0;">💡 Te animamos a:</h3>
              <ul style="color: #0c5460; line-height: 1.8;">
                <li>Seguir practicando y perfeccionando tu talento</li>
                <li>Estar atento a futuras convocatorias</li>
                <li>Seguir nuestras redes sociales para más oportunidades</li>
                <li>No desanimarte, ¡cada experiencia es aprendizaje!</li>
              </ul>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Agradecemos tu participación y te deseamos mucho éxito en tus proyectos musicales. 🌟
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${siteUrl.value()}/principal.html" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🏠 Volver a la página principal
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; text-align: center;">
              El equipo de VYT Music<br>
              <small>Este correo se envió automáticamente, no responder a este mensaje.</small>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de rechazo manual enviado a: ${data.email}`);
    
    return { success: true, message: 'Rejection email sent successfully' };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw new functions.https.HttpsError('internal', 'Error sending email: ' + error.message);
  }
});

// --- HTTP Functions for Admin Actions (Alternative to callable functions) ---

// HTTP function to send approval email
exports.sendApprovalEmailHttp = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { participantId, modalidad } = req.body;
  
  if (!participantId || !modalidad) {
    res.status(400).json({ error: 'ParticipantId and modalidad are required' });
    return;
  }

  try {
    const collectionName = modalidad === 'online' ? 'participantes_online' : 'participantes_presenciales';
    const participantDoc = await admin.firestore().collection(collectionName).doc(participantId).get();
    
    if (!participantDoc.exists) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    const data = participantDoc.data();
    
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value(),
        },
      });
    }

    const mailOptions = {
      from: `VYT Music <${gmailEmail.value()}>`,
      to: data.email,
      subject: "🎉 ¡Felicitaciones! Tu inscripción ha sido APROBADA ✅",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #28a745; text-align: center; margin-bottom: 30px;">🎉 ¡APROBADO! 🎉</h1>
            
            <p style="font-size: 18px; color: #333; line-height: 1.6;">¡Hola <strong>${data.nombre_artista}</strong>!</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              ¡Excelentes noticias! 🌟 Tu inscripción para el certamen VYT Music ha sido <strong style="color: #28a745;">APROBADA</strong> por nuestro equipo de jurados.
            </p>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin-top: 0;">📋 Detalles de tu inscripción:</h3>
              <p style="margin: 5px 0;"><strong>Modalidad:</strong> ${modalidad.charAt(0).toUpperCase() + modalidad.slice(1)}</p>
              <p style="margin: 5px 0;"><strong>Nombre artístico:</strong> ${data.nombre_artista}</p>
              <p style="margin: 5px 0;"><strong>Estado:</strong> ✅ Aprobado</p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              ¡Gracias por ser parte de VYT Music! 🎤✨
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${siteUrl.value()}/principal.html" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🏠 Volver a la página principal
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; text-align: center;">
              El equipo de VYT Music<br>
              <small>Este correo se envió automáticamente, no responder a este mensaje.</small>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de aprobación HTTP enviado a: ${data.email}`);
    
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending approval email HTTP:', error);
    res.status(500).json({ error: 'Error sending email: ' + error.message });
  }
});

// HTTP function to send rejection email
exports.sendRejectionEmailHttp = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { participantId, modalidad } = req.body;
  
  if (!participantId || !modalidad) {
    res.status(400).json({ error: 'ParticipantId and modalidad are required' });
    return;
  }

  try {
    const collectionName = modalidad === 'online' ? 'participantes_online' : 'participantes_presenciales';
    const participantDoc = await admin.firestore().collection(collectionName).doc(participantId).get();
    
    if (!participantDoc.exists) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    const data = participantDoc.data();
    
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value(),
        },
      });
    }

    const mailOptions = {
      from: `VYT Music <${gmailEmail.value()}>`,
      to: data.email,
      subject: "📩 Resultado de tu inscripción - VYT Music",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #dc3545; text-align: center; margin-bottom: 30px;">📩 Resultado de Evaluación</h1>
            
            <p style="font-size: 18px; color: #333; line-height: 1.6;">Hola <strong>${data.nombre_artista}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Gracias por tu interés en participar en el certamen VYT Music. 🎤
            </p>
            
            <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="color: #721c24; font-size: 16px; line-height: 1.6; margin: 0;">
                Después de evaluar tu inscripción, lamentamos informarte que en esta ocasión no podrás continuar en el proceso del certamen.
              </p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Agradecemos tu participación y te deseamos mucho éxito en tus proyectos musicales. 🌟
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${siteUrl.value()}/principal.html" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🏠 Volver a la página principal
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; text-align: center;">
              El equipo de VYT Music<br>
              <small>Este correo se envió automáticamente, no responder a este mensaje.</small>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de rechazo HTTP enviado a: ${data.email}`);
    
    res.status(200).json({ success: true, message: 'Rejection email sent successfully' });
  } catch (error) {
    console.error('Error sending rejection email HTTP:', error);
    res.status(500).json({ error: 'Error sending email: ' + error.message });
  }
});

// HTTP function to send professional rejection email with feedback
exports.sendProfessionalRejectionEmail = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { participantId, modalidad } = req.body;
  
  if (!participantId || !modalidad) {
    res.status(400).json({ error: 'ParticipantId and modalidad are required' });
    return;
  }

  try {
    const collectionName = modalidad === 'online' ? 'participantes_online' : 'participantes_presenciales';
    const participantDoc = await admin.firestore().collection(collectionName).doc(participantId).get();
    
    if (!participantDoc.exists) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    const data = participantDoc.data();
    
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value(),
        },
      });
    }

    const mailOptions = {
      from: `VYT Music <${gmailEmail.value()}>`,
      to: data.email,
      subject: "Novedades sobre tu participación en nuestro certamen",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Novedades sobre tu participación en nuestro certamen</h1>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hola <strong>${data.nombre_artista}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Agradecemos mucho tu tiempo, esfuerzo y el deseo de participar en nuestro certamen. Valoramos tu interés y las ganas que le pusiste a tu video.
            </p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Después de una cuidadosa revisión, lamentamos informarte que tu material no fue seleccionado en esta oportunidad. Nuestro objetivo es ayudarte a alcanzar tu máximo potencial, y creemos que, con algunas mejoras, puedes lograr un resultado mucho más impactante.
            </p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">📋 Motivos principales de rechazo:</h3>
              <ul style="color: #856404; line-height: 1.8;">
                <li><strong>Mala grabación de audio o video:</strong> La calidad del sonido o la imagen no cumplen con los estándares mínimos para el certamen.</li>
                <li><strong>Poca producción:</strong> El video podría beneficiarse de una mejor edición, ambientación o concepto visual.</li>
                <li><strong>Elección de canción incorrecta:</strong> La canción elegida no se ajusta bien a tus habilidades vocales o al género que manejas.</li>
                <li><strong>Faltante de técnica vocal:</strong> Es necesario trabajar en aspectos de la técnica para destacar tu voz de la mejor manera.</li>
              </ul>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #bee5eb;">
              <p style="color: #0c5460; font-size: 16px; line-height: 1.6; margin: 0;">
                <strong>💡 Piensa que este es el material que podría impulsarte a la fama.</strong> Si consideras que puedes mejorar estos puntos, te animamos a que nos envíes nuevamente tu material con las correcciones adecuadas.
              </p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Te deseamos mucho éxito y esperamos poder ver tu talento en una futura edición.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #333; font-size: 16px; font-weight: bold;">Saludos cordiales,</p>
              <p style="color: #666; font-size: 14px;">Luciano Martinez / VYT-Music Certamen Online</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${siteUrl.value()}/principal.html" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🏠 Volver a la página principal
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; text-align: center;">
              El equipo de VYT Music<br>
              <small>Este correo se envió automáticamente, no responder a este mensaje.</small>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de rechazo profesional enviado a: ${data.email}`);
    
    res.status(200).json({ success: true, message: 'Professional rejection email sent successfully' });
  } catch (error) {
    console.error('Error sending professional rejection email:', error);
    res.status(500).json({ error: 'Error sending email: ' + error.message });
  }
});

// YouTube Management Functions for Admin Panel

// Get YouTube videos for a participant
exports.getYouTubeVideo = onRequest(async (req, res) => {
  try {
    const { participantId } = req.query;
    
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    const participantDoc = await admin.firestore()
      .collection('participantes_online')
      .doc(participantId)
      .get();

    if (!participantDoc.exists) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const data = participantDoc.data();
    
    if (!data.youtube_video_id) {
      return res.status(404).json({ error: 'No YouTube video found for this participant' });
    }

    // Get video details from YouTube
    const auth = await getYouTubeAuth();
    const youtube = google.youtube({ version: 'v3', auth });

    const videoResponse = await youtube.videos.list({
      part: ['snippet', 'statistics'],
      id: [data.youtube_video_id]
    });

    if (videoResponse.data.items.length === 0) {
      return res.status(404).json({ error: 'Video not found on YouTube' });
    }

    const videoData = videoResponse.data.items[0];
    
    res.status(200).json({
      success: true,
      video: {
        id: videoData.id,
        title: videoData.snippet.title,
        description: videoData.snippet.description,
        publishedAt: videoData.snippet.publishedAt,
        thumbnails: videoData.snippet.thumbnails,
        statistics: videoData.statistics,
        url: `https://www.youtube.com/watch?v=${videoData.id}`
      },
      participant: {
        id: participantId,
        name: `${data.nombre} ${data.apellido}`,
        provincia: data.provincia
      }
    });

  } catch (error) {
    console.error('Error getting YouTube video:', error);
    res.status(500).json({ error: 'Error getting video: ' + error.message });
  }
});

// Update YouTube video metadata
exports.updateYouTubeVideo = onRequest(async (req, res) => {
  try {
    const { participantId, title, description } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    const participantDoc = await admin.firestore()
      .collection('participantes_online')
      .doc(participantId)
      .get();

    if (!participantDoc.exists) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const data = participantDoc.data();
    
    if (!data.youtube_video_id) {
      return res.status(404).json({ error: 'No YouTube video found for this participant' });
    }

    // Update video on YouTube
    await updateVideoMetadata(data.youtube_video_id, {
      title: title || data.title,
      description: description || data.description
    });

    // Update participant record
    await admin.firestore()
      .collection('participantes_online')
      .doc(participantId)
      .update({
        youtube_title: title,
        youtube_description: description,
        youtube_updated: admin.firestore.FieldValue.serverTimestamp()
      });

    res.status(200).json({ 
      success: true, 
      message: 'Video metadata updated successfully'
    });

  } catch (error) {
    console.error('Error updating YouTube video:', error);
    res.status(500).json({ error: 'Error updating video: ' + error.message });
  }
});

// Delete YouTube video
exports.deleteYouTubeVideo = onRequest(async (req, res) => {
  try {
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    const participantDoc = await admin.firestore()
      .collection('participantes_online')
      .doc(participantId)
      .get();

    if (!participantDoc.exists) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const data = participantDoc.data();
    
    if (!data.youtube_video_id) {
      return res.status(404).json({ error: 'No YouTube video found for this participant' });
    }

    // Delete video from YouTube
    await deleteVideoFromYouTube(data.youtube_video_id);

    // Update participant record
    await admin.firestore()
      .collection('participantes_online')
      .doc(participantId)
      .update({
        youtube_video_id: admin.firestore.FieldValue.delete(),
        youtube_uploaded: false,
        youtube_deleted: true,
        youtube_deleted_date: admin.firestore.FieldValue.serverTimestamp()
      });

    res.status(200).json({ 
      success: true, 
      message: 'Video deleted successfully from YouTube'
    });

  } catch (error) {
    console.error('Error deleting YouTube video:', error);
    res.status(500).json({ error: 'Error deleting video: ' + error.message });
  }
});

// Get all YouTube videos for admin dashboard
exports.getAllYouTubeVideos = onRequest(async (req, res) => {
  try {
    const participantsSnapshot = await admin.firestore()
      .collection('participantes_online')
      .where('youtube_uploaded', '==', true)
      .get();

    const videos = [];
    
    for (const doc of participantsSnapshot.docs) {
      const data = doc.data();
      if (data.youtube_video_id) {
        videos.push({
          participantId: doc.id,
          name: `${data.nombre} ${data.apellido}`,
          provincia: data.provincia,
          youtubeId: data.youtube_video_id,
          uploadDate: data.youtube_upload_date,
          url: `https://www.youtube.com/watch?v=${data.youtube_video_id}`
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      videos: videos,
      total: videos.length
    });

  } catch (error) {
    console.error('Error getting all YouTube videos:', error);
    res.status(500).json({ error: 'Error getting videos: ' + error.message });
  }
});

// ===============================
// SISTEMA DE GESTIÓN POR ETAPAS
// ===============================

// ETAPA 1: Procesamiento de video inicial
exports.processInitialVideo = onRequest(async (req, res) => {
  try {
    const { participantId, action, rejectionReason, rejectionComment } = req.body;
    
    if (!participantId || !action) {
      return res.status(400).json({ error: 'Participant ID and action are required' });
    }

    const participantRef = admin.firestore().collection('participantes_online').doc(participantId);
    const participantDoc = await participantRef.get();

    if (!participantDoc.exists) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const participantData = participantDoc.data();

    if (action === 'approve_initial') {
      // Aprobar video inicial
      await participantRef.update({
        status: PARTICIPANT_STATES.INITIAL_APPROVED,
        initial_approved_date: admin.firestore.FieldValue.serverTimestamp(),
        reviewed_by: req.body.reviewedBy || 'admin'
      });

      // Enviar correo de aprobación inicial
      await sendInitialApprovalEmail(participantData, participantId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Initial video approved successfully',
        nextStep: 'Participant notified to submit payment and final video'
      });

    } else if (action === 'reject_initial') {
      // Rechazar video inicial
      await participantRef.update({
        status: PARTICIPANT_STATES.INITIAL_REJECTED,
        rejection_reason: rejectionReason || REJECTION_REASONS.OTHER,
        rejection_comment: rejectionComment || '',
        initial_rejected_date: admin.firestore.FieldValue.serverTimestamp(),
        reviewed_by: req.body.reviewedBy || 'admin'
      });

      // Enviar correo de rechazo inicial
      await sendInitialRejectionEmail(participantData, rejectionReason, rejectionComment);
      
      res.status(200).json({ 
        success: true, 
        message: 'Initial video rejected successfully',
        nextStep: 'Participant notified of rejection and can resubmit'
      });
    }

  } catch (error) {
    console.error('Error processing initial video:', error);
    res.status(500).json({ error: 'Error processing video: ' + error.message });
  }
});

// ETAPA 2: Verificación de pago y video final
exports.processPaymentAndFinalVideo = onRequest(async (req, res) => {
  try {
    const { participantId, action, paymentConfirmed, finalVideoUrl } = req.body;
    
    const participantRef = admin.firestore().collection('participantes_online').doc(participantId);
    const participantDoc = await participantRef.get();

    if (!participantDoc.exists) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const participantData = participantDoc.data();

    if (action === 'confirm_payment') {
      await participantRef.update({
        status: PARTICIPANT_STATES.PAYMENT_CONFIRMED,
        payment_confirmed: true,
        payment_confirmed_date: admin.firestore.FieldValue.serverTimestamp()
      });

      // Enviar correo de confirmación de pago
      await sendPaymentConfirmationEmail(participantData);
      
      res.status(200).json({ 
        success: true, 
        message: 'Payment confirmed successfully'
      });

    } else if (action === 'receive_final_video') {
      await participantRef.update({
        status: PARTICIPANT_STATES.FINAL_VIDEO_RECEIVED,
        final_video_url: finalVideoUrl,
        final_video_received_date: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notificar al admin que hay un video final para revisar
      await notifyAdminFinalVideoReceived(participantData, participantId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Final video received successfully'
      });
    }

  } catch (error) {
    console.error('Error processing payment and final video:', error);
    res.status(500).json({ error: 'Error processing: ' + error.message });
  }
});

// ETAPA 3: Aprobación final y publicación
exports.processFinalApproval = onRequest(async (req, res) => {
  try {
    const { participantId, action, rejectionReason, rejectionComment } = req.body;
    
    const participantRef = admin.firestore().collection('participantes_online').doc(participantId);
    const participantDoc = await participantRef.get();

    if (!participantDoc.exists) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const participantData = participantDoc.data();

    if (action === 'approve_final') {
      // Aprobar video final
      await participantRef.update({
        status: PARTICIPANT_STATES.FINAL_APPROVED,
        final_approved: true,
        final_approved_date: admin.firestore.FieldValue.serverTimestamp(),
        ready_for_publication: true
      });

      // Subir automáticamente a YouTube
      let youtubeVideoId = null;
      if (participantData.final_video_url) {
        try {
          youtubeVideoId = await uploadVideoToYouTube(participantData.final_video_url, participantData);
          await participantRef.update({
            youtube_video_id: youtubeVideoId,
            youtube_uploaded: true,
            status: PARTICIPANT_STATES.PUBLISHED,
            published_date: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (youtubeError) {
          console.error('YouTube upload failed:', youtubeError);
          // Continuar sin YouTube, marcar para subida manual
          await participantRef.update({
            youtube_upload_failed: true,
            youtube_error: youtubeError.message
          });
        }
      }

      // Enviar correo de aprobación final
      await sendFinalApprovalEmail(participantData, youtubeVideoId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Final video approved and published successfully',
        youtubeVideoId: youtubeVideoId
      });

    } else if (action === 'reject_final') {
      await participantRef.update({
        status: PARTICIPANT_STATES.FINAL_REJECTED,
        final_rejection_reason: rejectionReason,
        final_rejection_comment: rejectionComment,
        final_rejected_date: admin.firestore.FieldValue.serverTimestamp()
      });

      // Enviar correo de rechazo final
      await sendFinalRejectionEmail(participantData, rejectionReason, rejectionComment);
      
      res.status(200).json({ 
        success: true, 
        message: 'Final video rejected successfully'
      });
    }

  } catch (error) {
    console.error('Error processing final approval:', error);
    res.status(500).json({ error: 'Error processing final approval: ' + error.message });
  }
});

// ===============================
// FUNCIONES DE CORREO ESPECÍFICAS
// ===============================

async function sendInitialApprovalEmail(participantData, participantId) {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });
  }

  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: participantData.email,
    subject: "🎉 ¡Felicitaciones! Tu video inicial fue APROBADO - Siguientes pasos",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4a90e2; font-size: 28px; margin: 0;">🎉 ¡FELICITACIONES!</h1>
            <h2 style="color: #333; font-size: 22px; margin: 10px 0;">Tu video inicial fue APROBADO</h2>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="color: #155724; font-size: 16px; margin: 0;">
              <strong>✅ ¡Excelente noticia ${participantData.nombre}!</strong><br>
              Tu video inicial ha pasado nuestra evaluación y cumple con los estándares del certamen.
            </p>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">📋 PRÓXIMOS PASOS OBLIGATORIOS:</h3>
            <ol style="color: #856404; line-height: 1.8;">
              <li><strong>💰 Realizar el pago de inscripción</strong></li>
              <li><strong>🎬 Enviar tu video FINAL</strong> (el que se publicará en la web)</li>
              <li><strong>📄 Enviar comprobante de pago</strong></li>
            </ol>
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="color: #0c5460; margin-top: 0;">💡 INSTRUCCIONES PARA EL VIDEO FINAL:</h3>
            <ul style="color: #0c5460; line-height: 1.6;">
              <li>Debe ser de <strong>máxima calidad</strong> (el que quieres que vean todos)</li>
              <li>Formato recomendado: <strong>MP4, 1080p mínimo</strong></li>
              <li>Audio claro y sin interferencias</li>
              <li>Duración máxima: <strong>5 minutos</strong></li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl.value()}/inscripcion_online.html?step=payment&id=${participantId}" 
               style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
              💳 REALIZAR PAGO Y ENVIAR VIDEO FINAL
            </a>
          </div>

          <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="color: #721c24; font-size: 14px; margin: 0;">
              <strong>⏰ IMPORTANTE:</strong> Tienes <strong>7 días</strong> para completar estos pasos. 
              Después de este tiempo, tu lugar podrá ser ocupado por otro participante.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #333; font-size: 16px; font-weight: bold;">¡Estamos emocionados de verte en la competencia!</p>
            <p style="color: #666; font-size: 14px;">Equipo VYT Music</p>
          </div>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Initial approval email sent to: ${participantData.email}`);
}

async function sendInitialRejectionEmail(participantData, rejectionReason, rejectionComment) {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });
  }

  const reasonTexts = {
    [REJECTION_REASONS.POOR_AUDIO_QUALITY]: "Calidad de audio insuficiente",
    [REJECTION_REASONS.POOR_VIDEO_QUALITY]: "Calidad de video insuficiente", 
    [REJECTION_REASONS.LOW_PRODUCTION]: "Necesita mejor producción",
    [REJECTION_REASONS.INAPPROPRIATE_CONTENT]: "Contenido inapropiado",
    [REJECTION_REASONS.TECHNICAL_ISSUES]: "Problemas técnicos",
    [REJECTION_REASONS.DOES_NOT_MEET_REQUIREMENTS]: "No cumple con los requisitos",
    [REJECTION_REASONS.OTHER]: "Otros motivos"
  };

  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: participantData.email,
    subject: "📝 Sobre tu participación en VYT Music - Oportunidad de mejora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e74c3c; font-size: 24px; margin: 0;">VYT Music Certamen</h1>
            <h2 style="color: #333; font-size: 20px; margin: 10px 0;">Sobre tu participación</h2>
          </div>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hola <strong>${participantData.nombre}</strong>,
          </p>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Agradecemos mucho tu tiempo, esfuerzo y el deseo de participar en nuestro certamen. 
            Valoramos tu interés y las ganas que le pusiste a tu video.
          </p>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; font-size: 16px; line-height: 1.6; margin: 0;">
              En esta ocasión, tu video no ha sido seleccionado para continuar en el certamen. 
              El motivo principal es: <strong>${reasonTexts[rejectionReason] || rejectionReason}</strong>
            </p>
            ${rejectionComment ? `<p style="color: #856404; font-size: 14px; margin-top: 10px;"><em>"${rejectionComment}"</em></p>` : ''}
          </div>

          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">💡 Aspectos a mejorar para futuras participaciones:</h3>
            <ul style="color: #155724; line-height: 1.6;">
              <li><strong>Calidad de audio:</strong> Audio claro, sin ruidos de fondo, bien ecualizado</li>
              <li><strong>Calidad de video:</strong> Resolución mínima 1080p, buena iluminación</li>
              <li><strong>Producción:</strong> Edición profesional, concepto visual atractivo</li>
              <li><strong>Performance:</strong> Interpretación convincente y profesional</li>
            </ul>
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p style="color: #0c5460; font-size: 16px; line-height: 1.6; margin: 0;">
              <strong>💡 ¡No te desanimes!</strong> Este es el material que podría impulsarte a la fama. 
              Si consideras que puedes mejorar estos puntos, te animamos a que nos envíes nuevamente tu material con las correcciones adecuadas.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl.value()}/inscripcion_online.html" 
               style="background: linear-gradient(135deg, #17a2b8, #007bff); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);">
              🔄 ENVIAR NUEVO VIDEO
            </a>
          </div>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Te deseamos mucho éxito y esperamos poder ver tu talento en una futura edición.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #333; font-size: 16px; font-weight: bold;">Saludos cordiales,</p>
            <p style="color: #666; font-size: 14px;">Equipo VYT Music</p>
          </div>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Initial rejection email sent to: ${participantData.email}`);
}

async function sendPaymentConfirmationEmail(participantData) {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });
  }

  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: participantData.email,
    subject: "✅ ¡Pago confirmado! Ya puedes enviar tu video final",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745; font-size: 28px; margin: 0;">✅ ¡PAGO CONFIRMADO!</h1>
            <h2 style="color: #333; font-size: 22px; margin: 10px 0;">Tu inscripción está casi completa</h2>
          </div>

          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="color: #155724; font-size: 16px; margin: 0;">
              <strong>🎉 ¡Perfecto ${participantData.nombre}!</strong><br>
              Hemos confirmado tu pago y tu plaza en el certamen está oficialmente reservada.
            </p>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">🎬 ÚLTIMO PASO - VIDEO FINAL:</h3>
            <p style="color: #856404; margin-bottom: 15px;">
              Ahora envía tu <strong>video FINAL</strong> - este es el que se publicará en nuestra web y canal de YouTube si quedas seleccionado.
            </p>
            <ul style="color: #856404; line-height: 1.6;">
              <li><strong>Calidad profesional</strong> - La mejor que puedas lograr</li>
              <li><strong>Formato:</strong> MP4, mínimo 1080p</li>
              <li><strong>Audio:</strong> Claro y sin ruidos</li>
              <li><strong>Duración:</strong> Máximo 5 minutos</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl.value()}/inscripcion_online.html?step=final_video" 
               style="background: linear-gradient(135deg, #007bff, #6610f2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);">
              🎬 ENVIAR VIDEO FINAL
            </a>
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="color: #0c5460; margin-top: 0;">📅 ¿Qué sigue después?</h3>
            <ul style="color: #0c5460; line-height: 1.6;">
              <li>Revisaremos tu video final</li>
              <li>Te notificaremos si queda seleccionado</li>
              <li>Si es aprobado, se publicará automáticamente</li>
              <li>¡El público podrá votar por tu talento!</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #333; font-size: 16px; font-weight: bold;">¡Estás a un paso de brillar en VYT Music!</p>
            <p style="color: #666; font-size: 14px;">Equipo VYT Music</p>
          </div>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Payment confirmation email sent to: ${participantData.email}`);
}

async function sendFinalApprovalEmail(participantData, youtubeVideoId) {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });
  }

  const youtubeUrl = youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : null;

  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: participantData.email,
    subject: "🌟 ¡FELICITACIONES! Tu video ha sido PUBLICADO en VYT Music",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); padding: 20px; border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ff6b6b; font-size: 32px; margin: 0;">🌟 ¡FELICITACIONES!</h1>
            <h2 style="color: #333; font-size: 24px; margin: 10px 0;">¡Tu video ha sido PUBLICADO!</h2>
          </div>

          <div style="background: #d4edda; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; text-align: center;">
            <p style="color: #155724; font-size: 18px; margin: 0; font-weight: bold;">
              🎊 ¡Tu talento ya está ONLINE y visible para todo el mundo! 🎊
            </p>
          </div>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            <strong>¡Increíble ${participantData.nombre}!</strong> Tu video final ha sido aprobado y ahora forma parte oficial del certamen VYT Music.
          </p>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">🔥 ¡YA PUEDES VERLO ONLINE!</h3>
            <div style="text-align: center; margin: 15px 0;">
              <a href="${siteUrl.value()}/certamenes.html" 
                 style="background: linear-gradient(135deg, #ff6b6b, #ffa500); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin: 5px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
                🌐 VER EN LA WEB
              </a>
              ${youtubeUrl ? `
              <a href="${youtubeUrl}" 
                 style="background: linear-gradient(135deg, #ff0000, #ff4444); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; margin: 5px; box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);">
                📺 VER EN YOUTUBE
              </a>` : ''}
            </div>
          </div>

          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="color: #0056b3; margin-top: 0;">🗳️ ¡AHORA COMIENZA LA VOTACIÓN!</h3>
            <ul style="color: #0056b3; line-height: 1.8;">
              <li><strong>El público puede votar por tu video</strong></li>
              <li><strong>Comparte el link con tus amigos y familia</strong></li>
              <li><strong>Cuantos más votos, mejores posibilidades</strong></li>
              <li><strong>Síguenos en redes para actualizaciones</strong></li>
            </ul>
          </div>

          <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; text-align: center;">
            <p style="color: #721c24; font-size: 16px; margin: 0; font-weight: bold;">
              💡 CONSEJO: ¡Comparte tu video en redes sociales para conseguir más votos!
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <h3 style="color: #333;">🎵 ¡COMPARTE TU ÉXITO! 🎵</h3>
            <p style="color: #666; font-size: 14px;">
              "¡Mi video ya está en VYT Music! 🌟 Vota por mí en: ${siteUrl.value()}/certamenes.html"
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #333; font-size: 18px; font-weight: bold;">¡Mucha suerte y que gane el mejor talento!</p>
            <p style="color: #666; font-size: 14px;">Equipo VYT Music</p>
          </div>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Final approval email sent to: ${participantData.email}`);
}

async function sendFinalRejectionEmail(participantData, rejectionReason, rejectionComment) {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });
  }

  const reasonTexts = {
    [REJECTION_REASONS.POOR_AUDIO_QUALITY]: "Calidad de audio insuficiente",
    [REJECTION_REASONS.POOR_VIDEO_QUALITY]: "Calidad de video insuficiente", 
    [REJECTION_REASONS.LOW_PRODUCTION]: "Necesita mejor producción",
    [REJECTION_REASONS.INAPPROPRIATE_CONTENT]: "Contenido inapropiado",
    [REJECTION_REASONS.TECHNICAL_ISSUES]: "Problemas técnicos",
    [REJECTION_REASONS.DOES_NOT_MEET_REQUIREMENTS]: "No cumple con los requisitos finales",
    [REJECTION_REASONS.OTHER]: "Otros motivos"
  };

  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: participantData.email,
    subject: "📝 Sobre tu video final - VYT Music",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e74c3c; font-size: 24px; margin: 0;">VYT Music Certamen</h1>
            <h2 style="color: #333; font-size: 20px; margin: 10px 0;">Resultado de evaluación final</h2>
          </div>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hola <strong>${participantData.nombre}</strong>,
          </p>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Agradecemos tu participación y el esfuerzo que pusiste en tu video final.
          </p>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; font-size: 16px; line-height: 1.6; margin: 0;">
              Después de evaluar tu video final, lamentamos informarte que no podrá ser publicado en esta edición del certamen. 
              El motivo principal es: <strong>${reasonTexts[rejectionReason] || rejectionReason}</strong>
            </p>
            ${rejectionComment ? `<p style="color: #856404; font-size: 14px; margin-top: 10px;"><em>"${rejectionComment}"</em></p>` : ''}
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="color: #0c5460; margin-top: 0;">💰 Sobre tu pago:</h3>
            <p style="color: #0c5460; font-size: 16px; line-height: 1.6;">
              Entendemos tu frustración. Estamos considerando las opciones para manejar esta situación de la manera más justa posible. 
              Te contactaremos pronto con información sobre el proceso.
            </p>
          </div>

          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">🌟 Para futuras oportunidades:</h3>
            <ul style="color: #155724; line-height: 1.6;">
              <li>Tu video inicial fue aprobado, lo que demuestra tu talento</li>
              <li>Considera trabajar en los aspectos mencionados</li>
              <li>Mantente atento a futuras convocatorias</li>
              <li>Tu experiencia en este proceso te hará más fuerte</li>
            </ul>
          </div>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Sabemos que tienes talento y esperamos verte en futuras ediciones con material que cumpla todos los estándares.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #333; font-size: 16px; font-weight: bold;">Saludos cordiales,</p>
            <p style="color: #666; font-size: 14px;">Equipo VYT Music</p>
          </div>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Final rejection email sent to: ${participantData.email}`);
}

async function notifyAdminFinalVideoReceived(participantData, participantId) {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });
  }

  const adminEmail = gmailEmail.value(); // O puedes tener un email específico para admin

  const mailOptions = {
    from: `VYT Music <${gmailEmail.value()}>`,
    to: adminEmail,
    subject: `🎬 Nuevo video final recibido - ${participantData.nombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">🎬 Nuevo Video Final para Revisar</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Información del Participante:</h3>
          <ul>
            <li><strong>Nombre:</strong> ${participantData.nombre}</li>
            <li><strong>Email:</strong> ${participantData.email}</li>
            <li><strong>Nombre Artístico:</strong> ${participantData.nombre_artista || 'No especificado'}</li>
            <li><strong>ID:</strong> ${participantId}</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${siteUrl.value()}/admin.html?section=participants&id=${participantId}" 
             style="background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            🔍 REVISAR EN ADMIN
          </a>
        </div>

        <p><strong>Estado:</strong> Video final recibido - Pendiente de revisión</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Admin notification sent for participant: ${participantId}`);
}

// =====================================================
// 💰 SISTEMA DE PAGOS MÚLTIPLES VYT-MUSIC
// =====================================================

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

/**
 * Crear preferencia de pago para comprar VYT-MONEY
 */
exports.createVYTMoneyPayment = onCall(async (request) => {
  try {
    const { cantidad_vyt_money, user_id, user_email } = request.data;
    
    if (!cantidad_vyt_money || !user_id || !user_email) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos incompletos');
    }

    // Obtener configuración actual de VYT-MONEY
    const configDoc = await admin.firestore().collection('vyt_money_config').doc('general').get();
    const config = configDoc.exists ? configDoc.data() : {
      precio_por_100_vyt_money: 50,
      moneda: 'ARS',
      activo: true
    };

    if (!config.activo) {
      throw new functions.https.HttpsError('failed-precondition', 'Las compras de VYT-MONEY están deshabilitadas temporalmente');
    }

    // Calcular precio
    const precio_total = (cantidad_vyt_money / 100) * config.precio_por_100_vyt_money;

    // Crear cliente de MercadoPago
    const client = new MercadoPagoConfig({ 
      accessToken: mercadopagoToken.value() 
    });
    const preference = new Preference(client);

    // Crear preferencia de pago
    const preferenceData = {
      items: [
        {
          title: `${cantidad_vyt_money} VYT-MONEY`,
          description: `Compra de ${cantidad_vyt_money} VYT-MONEY para votar en VYT Music`,
          quantity: 1,
          currency_id: config.moneda,
          unit_price: precio_total
        }
      ],
      payer: {
        email: user_email
      },
      back_urls: {
        success: `${siteUrl.value()}/pago/pago_exitoso.html?type=vyt_money&amount=${cantidad_vyt_money}`,
        failure: `${siteUrl.value()}/pago/pago_fallido.html?type=vyt_money`,
        pending: `${siteUrl.value()}/pago/pago_pendiente.html?type=vyt_money`
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        type: 'vyt_money_purchase',
        user_id: user_id,
        cantidad_vyt_money: cantidad_vyt_money,
        timestamp: Date.now()
      })
    };

    const result = await preference.create({ body: preferenceData });

    // Guardar transacción pendiente
    await admin.firestore().collection('vyt_money_transactions').add({
      user_id: user_id,
      cantidad_vyt_money: cantidad_vyt_money,
      precio_total: precio_total,
      moneda: config.moneda,
      preference_id: result.id,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      mercadopago_data: result
    });

    return {
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    };

  } catch (error) {
    console.error('Error creating VYT-MONEY payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

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
            await processVYTMoneyPaymentConfirmed(external_reference, paymentData);
            break;
          case 'inscripcion_online':
            await processInscripcionOnlinePaymentConfirmed(external_reference, paymentData);
            break;
          case 'inscripcion_presencial':
            await processInscripcionPresencialPaymentConfirmed(external_reference, paymentData);
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

/**
 * Procesar pago confirmado de VYT-MONEY
 */
async function processVYTMoneyPaymentConfirmed(external_reference, paymentData) {
  const { user_id, cantidad_vyt_money } = external_reference;
  
  try {
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
    await sendVYTMoneyPurchaseConfirmation(user_id, cantidad_vyt_money);
    
    console.log(`VYT-MONEY purchase confirmed: ${cantidad_vyt_money} for user ${user_id}`);
  } catch (error) {
    console.error('Error processing VYT-MONEY payment:', error);
  }
}

/**
 * Procesar pago confirmado de inscripción online
 */
async function processInscripcionOnlinePaymentConfirmed(external_reference, paymentData) {
  const { certamen_id, participante_data, precio } = external_reference;
  
  try {
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
    
    // Obtener datos del certamen para las notificaciones
    const certamenDoc = await admin.firestore().collection('certamenes_provinciales').doc(certamen_id).get();
    const certamen = certamenDoc.data();
    
    // Enviar notificaciones específicas
    await sendInscripcionOnlineConfirmationEmail(participante_data, certamen, precio);
    await notifyAdminNewInscripcionOnline(participanteRef.id, participante_data, certamen);
    
    console.log(`Online inscription confirmed: ${participante_data.nombre_artista} - Certamen: ${certamen.nombre}`);
  } catch (error) {
    console.error('Error processing online inscription payment:', error);
  }
}

/**
 * Procesar pago confirmado de inscripción presencial
 */
async function processInscripcionPresencialPaymentConfirmed(external_reference, paymentData) {
  const { participante_data, precio } = external_reference;
  
  try {
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
    await sendInscripcionPresencialConfirmationEmail(participante_data, precio);
    await notifyAdminNewInscripcionPresencial(participanteRef.id, participante_data);
    
    console.log(`Presencial inscription confirmed: ${participante_data.nombre_artista}`);
  } catch (error) {
    console.error('Error processing presencial inscription payment:', error);
  }
}

/**
 * Enviar confirmación de inscripción online
 */
async function sendInscripcionOnlineConfirmationEmail(participanteData, certamen, precio) {
  try {
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
  } catch (error) {
    console.error('Error sending online inscription confirmation email:', error);
  }
}

/**
 * Enviar confirmación de inscripción presencial
 */
async function sendInscripcionPresencialConfirmationEmail(participanteData, precio) {
  try {
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
  } catch (error) {
    console.error('Error sending presencial inscription confirmation email:', error);
  }
}

/**
 * Notificar admin sobre nueva inscripción online
 */
async function notifyAdminNewInscripcionOnline(participanteId, participanteData, certamen) {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value()
      }
    });
    
    const mailOptions = {
      from: `VYT Music <${gmailEmail.value()}>`,
      to: gmailEmail.value(),
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
  } catch (error) {
    console.error('Error sending admin notification for online inscription:', error);
  }
}

/**
 * Notificar admin sobre nueva inscripción presencial
 */
async function notifyAdminNewInscripcionPresencial(participanteId, participanteData) {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value()
      }
    });
    
    const mailOptions = {
      from: `VYT Music <${gmailEmail.value()}>`,
      to: gmailEmail.value(),
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
  } catch (error) {
    console.error('Error sending admin notification for presencial inscription:', error);
  }
}

/**
 * Votar por un artista usando VYT-MONEY
 */
exports.voteWithVYTMoney = onCall(async (request) => {
  try {
    const { artista_id, cantidad_vyt_money, user_id } = request.data;
    
    if (!artista_id || !cantidad_vyt_money || !user_id || cantidad_vyt_money <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos de voto inválidos');
    }

    // Verificar balance del usuario
    const userDoc = await admin.firestore().collection('users').doc(user_id).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
    }

    const userData = userDoc.data();
    const currentBalance = userData.vyt_money_balance || 0;

    if (currentBalance < cantidad_vyt_money) {
      throw new functions.https.HttpsError('failed-precondition', 'Saldo insuficiente de VYT-MONEY');
    }

    // Obtener configuración del pozo
    const configDoc = await admin.firestore().collection('vyt_money_config').doc('general').get();
    const config = configDoc.exists ? configDoc.data() : { porcentaje_pozo_votaciones: 10 };

    // Calcular contribución al pozo
    const precio_unitario_vyt = config.precio_por_100_vyt_money / 100;
    const valor_monetario = cantidad_vyt_money * precio_unitario_vyt;
    const contribucion_pozo = (valor_monetario * config.porcentaje_pozo_votaciones) / 100;

    // Transacción para procesar el voto
    await admin.firestore().runTransaction(async (transaction) => {
      // Actualizar balance del usuario
      transaction.update(userDoc.ref, {
        vyt_money_balance: currentBalance - cantidad_vyt_money,
        total_vyt_money_spent: (userData.total_vyt_money_spent || 0) + cantidad_vyt_money
      });

      // Actualizar votos del artista
      const artistaRef = admin.firestore().collection('participantes').doc(artista_id);
      const artistaDoc = await transaction.get(artistaRef);
      
      if (artistaDoc.exists) {
        const artistaData = artistaDoc.data();
        transaction.update(artistaRef, {
          total_votos_vyt_money: (artistaData.total_votos_vyt_money || 0) + cantidad_vyt_money,
          total_votos_count: (artistaData.total_votos_count || 0) + 1,
          valor_monetario_votos: (artistaData.valor_monetario_votos || 0) + valor_monetario
        });
      }

      // Registrar el voto
      const votoRef = admin.firestore().collection('votos_vyt_money').doc();
      transaction.set(votoRef, {
        user_id: user_id,
        artista_id: artista_id,
        cantidad_vyt_money: cantidad_vyt_money,
        valor_monetario: valor_monetario,
        contribucion_pozo: contribucion_pozo,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip_address: request.rawRequest?.ip || 'unknown'
      });

      // Actualizar pozo de premios
      const pozoRef = admin.firestore().collection('pozo_premios').doc('general');
      const pozoDoc = await transaction.get(pozoRef);
      
      if (pozoDoc.exists) {
        transaction.update(pozoRef, {
          total_pozo: (pozoDoc.data().total_pozo || 0) + contribucion_pozo,
          contribuciones_votaciones: (pozoDoc.data().contribuciones_votaciones || 0) + contribucion_pozo,
          ultima_actualizacion: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        transaction.set(pozoRef, {
          total_pozo: contribucion_pozo,
          contribuciones_votaciones: contribucion_pozo,
          contribuciones_inscripciones: 0,
          ultima_actualizacion: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    return {
      success: true,
      nuevo_balance: currentBalance - cantidad_vyt_money,
      contribucion_pozo: contribucion_pozo,
      message: `Voto registrado: ${cantidad_vyt_money} VYT-MONEY`
    };

  } catch (error) {
    console.error('Error processing VYT-MONEY vote:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Obtener balance de VYT-MONEY del usuario
 */
exports.getVYTMoneyBalance = onCall(async (request) => {
  try {
    const { user_id } = request.data;
    
    if (!user_id) {
      throw new functions.https.HttpsError('invalid-argument', 'User ID requerido');
    }

    const userDoc = await admin.firestore().collection('users').doc(user_id).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
    }

    const userData = userDoc.data();
    
    return {
      balance: userData.vyt_money_balance || 0,
      total_purchased: userData.total_vyt_money_purchased || 0,
      total_spent: userData.total_vyt_money_spent || 0,
      last_purchase: userData.last_vyt_money_purchase || null
    };

  } catch (error) {
    console.error('Error getting VYT-MONEY balance:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Configurar precios y parámetros de VYT-MONEY (Admin)
 */
exports.configureVYTMoney = onCall(async (request) => {
  try {
    const { config } = request.data;
    
    // Verificar que el usuario es admin (agregar verificación de rol aquí)
    
    await admin.firestore().collection('vyt_money_config').doc('general').set({
      ...config,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, message: 'Configuración de VYT-MONEY actualizada' };

  } catch (error) {
    console.error('Error configuring VYT-MONEY:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Enviar email de confirmación de compra de VYT-MONEY
 */
async function sendVYTMoneyPurchaseConfirmation(userId, cantidadVYTMoney) {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value()
      }
    });

    const mailOptions = {
      from: gmailEmail.value(),
      to: userData.email,
      subject: '✅ Compra de VYT-MONEY Confirmada - VYT Music',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; overflow: hidden;">
          <div style="padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 2.5rem;">💰 ¡Compra Exitosa!</h1>
            <p style="font-size: 1.2rem; margin: 10px 0;">Tu VYT-MONEY está listo para usar</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; margin: 20px;">
            <h2>📊 Detalles de la Compra</h2>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>VYT-MONEY Adquirido:</strong> ${cantidadVYTMoney}</p>
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${userData.nombre || userData.email}</p>
              <p style="margin: 5px 0;"><strong>Estado:</strong> ✅ CONFIRMADO</p>
            </div>
          </div>

          <div style="text-align: center; padding: 20px;">
            <a href="${siteUrl.value()}/principal.html" 
               style="background: #FFD700; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 1.1rem;">
              🎵 ¡VOTAR AHORA!
            </a>
          </div>

          <div style="text-align: center; padding: 20px; font-size: 0.9rem; opacity: 0.8;">
            <p>¡Ahora puedes apoyar a tus artistas favoritos y contribuir al pozo de premios!</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`VYT-MONEY purchase confirmation sent to: ${userData.email}`);

  } catch (error) {
    console.error('Error sending VYT-MONEY confirmation email:', error);
  }
}

// ===== SISTEMA DE POZO DINÁMICO =====

/**
 * Función para obtener el estado actual del pozo de premios
 * Incluye múltiples pozos (Nacional, Provinciales, Especiales)
 */
exports.getPrizePoolStatus = onCall(async (request) => {
  try {
    const db = admin.firestore();
    const poolsCollection = db.collection('prizePools');
    
    // Obtener todos los pozos activos
    const poolsSnapshot = await poolsCollection.where('active', '==', true).get();
    const pools = {};
    
    for (const doc of poolsSnapshot.docs) {
      const poolData = doc.data();
      const poolId = doc.id;
      
      // Calcular estadísticas en tiempo real
      const stats = await calculatePoolStats(poolId);
      
      pools[poolId] = {
        ...poolData,
        ...stats,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };
    }
    
    return { success: true, pools };
    
  } catch (error) {
    console.error('Error getting prize pool status:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Función para contribuir al pozo de premios
 * Se ejecuta automáticamente cuando hay votos, compras, etc.
 */
exports.contributeToPrizePool = onCall(async (request) => {
  try {
    const { poolId, amount, source, userId, metadata } = request.data;
    
    if (!poolId || !amount || !source) {
      throw new Error('Faltan datos requeridos: poolId, amount, source');
    }
    
    const db = admin.firestore();
    const batch = db.batch();
    
    // Referencia al pozo
    const poolRef = db.collection('prizePools').doc(poolId);
    const poolDoc = await poolRef.get();
    
    if (!poolDoc.exists) {
      throw new Error(`Pool ${poolId} no existe`);
    }
    
    const poolData = poolDoc.data();
    const contributionAmount = calculateContribution(amount, source, poolData.configuration);
    
    // Actualizar el pozo
    batch.update(poolRef, {
      currentAmount: admin.firestore.FieldValue.increment(contributionAmount),
      totalContributions: admin.firestore.FieldValue.increment(contributionAmount),
      lastContribution: admin.firestore.FieldValue.serverTimestamp(),
      [`sources.${source}`]: admin.firestore.FieldValue.increment(contributionAmount)
    });
    
    // Registrar la contribución individual
    const contributionRef = db.collection('prizePoolContributions').doc();
    batch.set(contributionRef, {
      poolId,
      amount,
      contributionAmount,
      source,
      userId: userId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: metadata || {}
    });
    
    // Actualizar estadísticas del usuario si está logueado
    if (userId) {
      const userStatsRef = db.collection('userPrizePoolStats').doc(userId);
      batch.set(userStatsRef, {
        totalContributions: admin.firestore.FieldValue.increment(contributionAmount),
        lastContribution: admin.firestore.FieldValue.serverTimestamp(),
        [`pools.${poolId}`]: admin.firestore.FieldValue.increment(contributionAmount)
      }, { merge: true });
    }
    
    await batch.commit();
    
    // Disparar evento para actualizaciones en tiempo real
    await triggerPrizePoolUpdate(poolId, contributionAmount, source);
    
    return { 
      success: true, 
      contributionAmount,
      newTotal: poolData.currentAmount + contributionAmount
    };
    
  } catch (error) {
    console.error('Error contributing to prize pool:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Función para configurar un nuevo pozo de premios
 * Solo administradores pueden crear/modificar pozos
 */
exports.configurePrizePool = onCall(async (request) => {
  try {
    const { 
      poolId, 
      name, 
      description, 
      goalAmount, 
      category, 
      startDate, 
      endDate, 
      configuration,
      isAdmin 
    } = request.data;
    
    // Verificar permisos de administrador (implementar verificación real)
    if (!isAdmin) {
      throw new Error('No tienes permisos para configurar pozos de premios');
    }
    
    const db = admin.firestore();
    const poolRef = db.collection('prizePools').doc(poolId);
    
    const poolData = {
      name,
      description,
      category: category || 'general',
      goalAmount: goalAmount || 1000000,
      currentAmount: 0,
      totalContributions: 0,
      participantCount: 0,
      startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
      endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
      active: true,
      configuration: {
        voteContribution: 0.1, // 10% de votos va al pozo
        purchaseContribution: 0.05, // 5% de compras va al pozo
        shareContribution: 100, // $100 por compartir
        sponsorContribution: 1.0, // 100% de sponsors va al pozo
        ...configuration
      },
      sources: {
        votes: 0,
        purchases: 0,
        shares: 0,
        sponsors: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await poolRef.set(poolData);
    
    console.log(`Prize pool ${poolId} configured successfully`);
    return { success: true, poolId };
    
  } catch (error) {
    console.error('Error configuring prize pool:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Función para obtener el ranking de contribuciones
 */
exports.getPrizePoolLeaderboard = onCall(async (request) => {
  try {
    const { poolId, limit = 50 } = request.data;
    const db = admin.firestore();
    
    const leaderboardSnapshot = await db.collection('userPrizePoolStats')
      .where(`pools.${poolId}`, '>', 0)
      .orderBy(`pools.${poolId}`, 'desc')
      .limit(limit)
      .get();
    
    const leaderboard = [];
    
    for (const doc of leaderboardSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      // Obtener información básica del usuario
      const userDoc = await db.collection('users').doc(userId).get();
      const userInfo = userDoc.data();
      
      leaderboard.push({
        userId,
        username: userInfo?.nombre || userInfo?.email || 'Usuario',
        contribution: userData.pools[poolId],
        totalContributions: userData.totalContributions,
        position: leaderboard.length + 1
      });
    }
    
    return { success: true, leaderboard };
    
  } catch (error) {
    console.error('Error getting prize pool leaderboard:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Trigger automático cuando se actualiza el pozo
 * Envía notificaciones push a usuarios interesados
 */
exports.onPrizePoolUpdate = onDocumentUpdated('prizePools/{poolId}', async (event) => {
  try {
    const { poolId } = event.params;
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    
    const amountDifference = afterData.currentAmount - beforeData.currentAmount;
    
    if (amountDifference > 0) {
      console.log(`Prize pool ${poolId} increased by $${amountDifference}`);
      
      // Enviar notificaciones push (implementar)
      await sendPrizePoolNotifications(poolId, amountDifference, afterData);
      
      // Actualizar métricas en tiempo real
      await updateRealTimeMetrics(poolId, afterData);
    }
    
  } catch (error) {
    console.error('Error processing prize pool update:', error);
  }
});

// ===== FUNCIONES AUXILIARES =====

async function calculatePoolStats(poolId) {
  const db = admin.firestore();
  
  // Obtener contribuciones recientes
  const recentContributions = await db.collection('prizePoolContributions')
    .where('poolId', '==', poolId)
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  // Obtener conteo de participantes únicos
  const participantSnapshot = await db.collection('prizePoolContributions')
    .where('poolId', '==', poolId)
    .where('userId', '!=', null)
    .get();
  
  const uniqueParticipants = new Set();
  participantSnapshot.docs.forEach(doc => {
    const userId = doc.data().userId;
    if (userId) uniqueParticipants.add(userId);
  });
  
  return {
    participantCount: uniqueParticipants.size,
    recentContributions: recentContributions.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }))
  };
}

function calculateContribution(amount, source, configuration) {
  const rates = {
    vote: configuration.voteContribution,
    purchase: configuration.purchaseContribution,
    share: configuration.shareContribution,
    sponsor: configuration.sponsorContribution
  };
  
  if (source === 'share') {
    return configuration.shareContribution; // Cantidad fija por compartir
  }
  
  const rate = rates[source] || 0.1;
  return Math.round(amount * rate);
}

async function triggerPrizePoolUpdate(poolId, amount, source) {
  // Aquí se pueden disparar eventos en tiempo real
  // Por ejemplo, usando Firebase Realtime Database o Cloud Messaging
  console.log(`Prize pool ${poolId} updated: +$${amount} from ${source}`);
}

async function sendPrizePoolNotifications(poolId, amount, poolData) {
  // Implementar notificaciones push
  console.log(`Sending notifications for prize pool ${poolId} update: +$${amount}`);
}

async function updateRealTimeMetrics(poolId, poolData) {
  // Actualizar métricas en tiempo real
  console.log(`Updating real-time metrics for pool ${poolId}`);
}

// =====================================
// 🏆 EXPORTACIONES CERTÁMENES JERÁRQUICOS
// =====================================

// Exportar funciones de certámenes jerárquicos (temporalmente comentado para deployment)
/*
exports.createCertamenJerarquico = certamenesJerarquicos.createCertamenJerarquico;
exports.createRanking = certamenesJerarquicos.createRanking;
exports.votarEnCertamenJerarquico = certamenesJerarquicos.votarEnCertamenJerarquico;
exports.createEvaluacionJurado = certamenesJerarquicos.createEvaluacionJurado;
exports.evaluarParticipante = certamenesJerarquicos.evaluarParticipante;
exports.promoverGanadores = certamenesJerarquicos.promoverGanadores;
exports.getEstructuraCertamenes = certamenesJerarquicos.getEstructuraCertamenes;
exports.getEstadoPozo = certamenesJerarquicos.getEstadoPozo;
exports.getRankingCategoria = certamenesJerarquicos.getRankingCategoria;
*/
