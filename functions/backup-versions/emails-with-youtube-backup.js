// emails.js - Módulo separado para todas las funciones de correo electrónico
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const { defineString } = require("firebase-functions/params");
const { MercadoPagoConfig, Preference } = require("mercadopago");

// Define environment variables
const gmailEmail = defineString("GMAIL_EMAIL");
const gmailPassword = defineString("GMAIL_PASSWORD");
const mercadopagoToken = defineString("MERCADOPAGO_TOKEN");
const siteUrl = defineString("SITE_URL", { default: "https://vytonlineprueva.web.app" });

// Global transporter instance
let transporter = null;

// YouTube API helper functions (needed for approval emails)
const { google } = require('googleapis');
const { defineSecret } = require("firebase-functions/params");

// YouTube API configuration
const youtubeClientId = defineSecret("YOUTUBE_CLIENT_ID");
const youtubeClientSecret = defineSecret("YOUTUBE_CLIENT_SECRET");
const youtubeRefreshToken = defineSecret("YOUTUBE_REFRESH_TOKEN");

// YouTube authentication helper
async function getYouTubeAuth() {
  const oauth2Client = new google.auth.OAuth2(
    youtubeClientId.value(),
    youtubeClientSecret.value(),
    'urn:ietf:wg:oauth:2.0:oob'
  );

  oauth2Client.setCredentials({
    refresh_token: youtubeRefreshToken.value()
  });

  return oauth2Client;
}

// Upload video to YouTube helper function
async function uploadVideoToYouTube(videoUrl, participantData) {
  try {
    const auth = await getYouTubeAuth();
    const youtube = google.youtube({ version: 'v3', auth });

    // For now, we'll store the video URL and create a placeholder on YouTube
    // In a full implementation, you'd download the video and upload it
    const videoTitle = `${participantData.nombre_artista} - VYT Music Certamen`;
    const videoDescription = `Participación de ${participantData.nombre_artista} en el certamen VYT Music.\n\nVideo original: ${videoUrl}`;

    // This is a placeholder - in real implementation you'd need to handle video upload
    // For now, we'll just return a placeholder ID
    console.log(`YouTube upload requested for: ${videoTitle}`);
    return 'placeholder-video-id';
  } catch (error) {
    console.error('Error uploading to YouTube:', error);
    throw error;
  }
}

// Enviar correo al inscribirse (participante online)
const enviarCorreoInscripcionOnline = onDocumentCreated(
  "participantes_online/{participantId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    const data = snapshot.data();
    if (!data.email) return null;
    try {
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
const enviarCorreoInscripcionPresencial = onDocumentCreated(
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

// Function to send approval email with payment link
const enviarCorreoAprobacion = onDocumentUpdated(
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
        const inscripcionPrice = priceDoc.data()?.inscripcion || 30000;
        
        // --- 4. Create Mercado Pago Preference ---
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

        // --- 5. Send Email with Payment Link ---
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
const enviarCorreoAprobacionPresencial = onDocumentUpdated(
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

// Function to send rejection email
const enviarCorreoRechazo = onDocumentUpdated(
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

// Function to send approval email when admin manually approves a participant
const sendApprovalEmail = onCall({ 
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
const sendRejectionEmail = onCall({ 
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

// HTTP function to send approval email
const sendApprovalEmailHttp = onRequest({ cors: true }, async (req, res) => {
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
const sendRejectionEmailHttp = onRequest({ cors: true }, async (req, res) => {
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
const sendProfessionalRejectionEmail = onRequest({ cors: true }, async (req, res) => {
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

// Export all email functions
module.exports = {
  enviarCorreoInscripcionOnline,
  enviarCorreoInscripcionPresencial,
  enviarCorreoAprobacion,
  enviarCorreoAprobacionPresencial,
  enviarCorreoRechazo,
  sendApprovalEmail,
  sendRejectionEmail,
  sendApprovalEmailHttp,
  sendRejectionEmailHttp,
  sendProfessionalRejectionEmail
};