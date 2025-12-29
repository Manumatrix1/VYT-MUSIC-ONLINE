/**
 * ADMIN MANAGEMENT MODULE
 * Módulo especializado para funciones administrativas del sistema VYT Music
 * Incluye gestión de participantes, aprobaciones, rechazos y moderación
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Configuración de constantes
const gmailEmail = functions.config().gmail?.email || { value: () => 'test@gmail.com' };
const gmailPassword = functions.config().gmail?.password || { value: () => 'test_password' };
const siteUrl = functions.config().site?.url || { value: () => 'https://vyt-music-online.web.app' };

const { onCall, onRequest } = require('firebase-functions/v2/https');

// Variable global para el transporter de emails
let transporter = null;

// ===== FUNCIONES ADMINISTRATIVAS DE PARTICIPANTES =====

/**
 * Función para enviar email de aprobación manual por admin
 */
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
            
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h3 style="color: #004085; margin-top: 0;">📱 Próximos pasos:</h3>
              <ul style="color: #004085; line-height: 1.8;">
                <li>Revisa tu perfil de participante</li>
                <li>Mantente atento a las actualizaciones del certamen</li>
                <li>Promociona tu participación en redes sociales</li>
                <li>¡Prepárate para brillar! ⭐</li>
              </ul>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              ¡Gracias por ser parte de VYT Music! 🎤✨
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${siteUrl.value()}/principal.html" 
                 style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
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

/**
 * Función para enviar email de rechazo manual por admin
 */
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
              <a href="${siteUrl.value()}/principal.html" 
                 style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
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

// ===== FUNCIONES HTTP PARA ADMINISTRACIÓN =====

/**
 * Función HTTP para enviar email de aprobación
 */
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
              <a href="${siteUrl.value()}/principal.html" 
                 style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
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

/**
 * Función HTTP para enviar email de rechazo
 */
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
              <a href="${siteUrl.value()}/principal.html" 
                 style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
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

/**
 * Función HTTP para enviar email profesional de rechazo con feedback
 */
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
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin-top: 0;">🌟 Recomendaciones para mejorar:</h3>
              <ul style="color: #155724; line-height: 1.8;">
                <li>Invierte en mejor equipo de grabación (micrófono, cámara)</li>
                <li>Considera trabajar con un productor musical</li>
                <li>Elige una canción que destaque tu rango vocal</li>
                <li>Toma clases de técnica vocal</li>
                <li>Crea un concepto visual más atractivo</li>
              </ul>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Creemos en tu talento y esperamos verte brillar en futuras oportunidades. ¡No te rindas y sigue persiguiendo tus sueños! 🌟
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${siteUrl.value()}/principal.html" 
                 style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
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

// ===== FUNCIONES AUXILIARES ADMINISTRATIVAS =====

/**
 * Función para obtener estadísticas de participantes
 */
exports.getParticipantStats = onCall(async (request) => {
  try {
    const db = admin.firestore();
    
    // Obtener conteos de participantes online
    const onlineSnapshot = await db.collection('participantes_online').limit(100).get();
    const onlineCount = onlineSnapshot.size;
    
    // Obtener conteos de participantes presenciales
    const presencialSnapshot = await db.collection('participantes_presenciales').limit(100).get();
    const presencialCount = presencialSnapshot.size;
    
    // Obtener participantes aprobados
    const onlineApprovedSnapshot = await db.collection('participantes_online')
      .where('estado', '==', 'aprobado').get();
    const presencialApprovedSnapshot = await db.collection('participantes_presenciales')
      .where('estado', '==', 'aprobado').get();
    
    return {
      success: true,
      stats: {
        total: onlineCount + presencialCount,
        online: onlineCount,
        presencial: presencialCount,
        approved: onlineApprovedSnapshot.size + presencialApprovedSnapshot.size,
        onlineApproved: onlineApprovedSnapshot.size,
        presencialApproved: presencialApprovedSnapshot.size
      }
    };
    
  } catch (error) {
    console.error('Error getting participant stats:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Función para obtener lista de participantes pendientes de aprobación
 */
exports.getPendingParticipants = onCall(async (request) => {
  try {
    const db = admin.firestore();
    const { modalidad, limit = 50 } = request.data;
    
    let query = null;
    if (modalidad === 'online') {
      query = db.collection('participantes_online').where('estado', '==', 'pendiente');
    } else if (modalidad === 'presencial') {
      query = db.collection('participantes_presenciales').where('estado', '==', 'pendiente');
    } else {
      // Obtener ambos (más complejo, requiere múltiples queries)
      const onlineSnapshot = await db.collection('participantes_online')
        .where('estado', '==', 'pendiente').limit(limit).get();
      const presencialSnapshot = await db.collection('participantes_presenciales')
        .where('estado', '==', 'pendiente').limit(limit).get();
      
      const participants = [];
      
      onlineSnapshot.docs.forEach(doc => {
        participants.push({
          id: doc.id,
          modalidad: 'online',
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        });
      });
      
      presencialSnapshot.docs.forEach(doc => {
        participants.push({
          id: doc.id,
          modalidad: 'presencial',
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        });
      });
      
      return { success: true, participants };
    }
    
    const snapshot = await query.limit(limit).get();
    const participants = snapshot.docs.map(doc => ({
      id: doc.id,
      modalidad,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    return { success: true, participants };
    
  } catch (error) {
    console.error('Error getting pending participants:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Función para actualizar estado de participante
 */
exports.updateParticipantStatus = onCall(async (request) => {
  try {
    const { participantId, modalidad, estado, notas } = request.data;
    
    if (!participantId || !modalidad || !estado) {
      throw new functions.https.HttpsError('invalid-argument', 'Faltan datos requeridos');
    }
    
    const collectionName = modalidad === 'online' ? 'participantes_online' : 'participantes_presenciales';
    const participantRef = admin.firestore().collection(collectionName).doc(participantId);
    
    const updateData = {
      estado,
      fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (notas) {
      updateData.notas_admin = notas;
    }
    
    await participantRef.update(updateData);
    
    return { success: true, message: 'Estado actualizado correctamente' };
    
  } catch (error) {
    console.error('Error updating participant status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});