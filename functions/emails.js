/**
 * EMAILS MODULE - CLEAN VERS      if (!transporter) {
        transporter = nodemail      if (!transporter) {
        transporter = nodemailer.createTransporter({
          service: "gmail",
          auth: {
            user: gmailEmail,
            pass: gmailPassword,
          },
        });
      }
      
      const mailOptions = {
        from: `VYT Music <${gmailEmail}>`,
        to: data.email,
        subject: "📢 ¡Felicitaciones! Tu inscripción presencial fue recibida",porter({
          service: "gmail",
          auth: {
            user: gmailEmail,
            pass: gmailPassword,
          },
        });
      }
      
      const mailOptions = {
        from: `VYT Music <${gmailEmail}>`,lo especializado para el sistema de emails automatizados
 * Sin dependencias de YouTube para evitar problemas de deployment
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall } = require('firebase-functions/v2/https');

// Configuración de constantes - Acceso corregido
const gmailEmail = functions.config().email?.user || 'luciano21martinez@gmail.com';
const gmailPassword = functions.config().email?.pass || 'wwhm qqei uxxz ciwl';
const siteUrl = 'https://vytonlineprueva.web.app';

// Variable global para el transporter
let transporter = null;

// ===== FUNCIONES DE EMAILS =====

/**
 * Enviar correo al inscribirse (participante online) - CALLABLE
 */
exports.enviarEmailInscripcionOnline = onCall(async (request) => {
    const { email, nombre } = request.data;
    if (!email) throw new Error('Email requerido');
    
    try {
      if (!transporter) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailEmail,
            pass: gmailPassword,
          },
        });
      }
      
      const mailOptions = {
        from: `VYT Music <${gmailEmail}>`,
        to: email,
        subject: "📢 ¡Felicitaciones! 🎤✨ Tu video ya fue recibido",
        html: `
          <h2>📢 ¡Felicitaciones! 🎤✨</h2>
          <p>Hola ${nombre || 'Participante'}, tu video ya fue recibido y en este momento está siendo evaluado por nuestro equipo de jurados. 🙌</p>
          <p>👉 Muy pronto te enviaremos los resultados y los próximos pasos para continuar con tu inscripción.<br>
          Mientras tanto, ¡te invitamos a estar atent@ a tu correo y a nuestras notificaciones!</p>
          <p>Gracias por animarte a ser parte del certamen. 💫</p>
          <p><a href="${siteUrl}/principal.html" style="color:#2563eb;text-decoration:underline;font-weight:bold;">Volver a la página principal</a></p>
          <p>El equipo de VYT Music</p>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Correo de inscripción online enviado a: ${email}`);
      return { success: true, message: 'Email enviado correctamente' };
    } catch (error) {
      console.error("Error enviando correo:", error);
      throw new Error('Error enviando email');
    }
});

/**
 * Enviar correo al inscribirse (participante presencial) - CALLABLE
 */
exports.enviarEmailInscripcionPresencial = onCall(async (request) => {
    const { email, nombre } = request.data;
    if (!email) throw new Error('Email requerido');
    
    try {
      if (!transporter) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailEmail,
            pass: gmailPassword,
          },
        });
      }
      
      const mailOptions = {
        from: `VYT Music <${gmailEmail}>`,
        to: email,
        subject: "📢 ¡Felicitaciones! Tu inscripción presencial fue recibida",
        html: `
          <h2>📢 ¡Felicitaciones!</h2>
          <p>Hola ${nombre || 'Participante'}, tu inscripción presencial ya fue recibida y está siendo evaluada por nuestro equipo. 🙌</p>
          <p>👉 Muy pronto te enviaremos los resultados y próximos pasos.</p>
          <p>Gracias por ser parte del certamen VYT Music. 💫</p>
          <p><a href="${siteUrl}/principal.html" style="color:#2563eb;text-decoration:underline;font-weight:bold;">Volver a la página principal</a></p>
          <p>El equipo de VYT Music</p>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Correo de inscripción presencial enviado a: ${email}`);
      return { success: true, message: 'Email enviado correctamente' };
    } catch (error) {
      console.error("Error enviando correo:", error);
      throw new Error('Error enviando email');
    }
});

/**
 * Enviar correo de aprobación (online)
 */
exports.enviarCorreoAprobacion = onCall(async (request) => {
  try {
    const { participantId } = request.data;
    
    if (!participantId) {
      throw new functions.https.HttpsError('invalid-argument', 'ParticipantId es requerido');
    }

    const participantDoc = await admin.firestore().collection('participantes_online').doc(participantId).get();
    
    if (!participantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participante no encontrado');
    }

    const data = participantDoc.data();
    
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail,
          pass: gmailPassword,
        },
      });
    }

    const mailOptions = {
      from: `VYT Music <${gmailEmail}>`,
      to: data.email,
      subject: "🎉 ¡APROBADO! Tu video inicial ha sido aceptado ✅",
      html: `
        <h1>🎉 ¡FELICITACIONES! 🎉</h1>
        <p>¡Hola <strong>${data.nombre_artista}</strong>!</p>
        <p>¡Excelentes noticias! Tu video inicial ha sido <strong>APROBADO</strong> por nuestro equipo de jurados. 🌟</p>
        <p>Ahora debes completar el pago para continuar con tu participación en el certamen.</p>
        <p><a href="${siteUrl}/principal.html" style="background-color:#007bff;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">Realizar Pago</a></p>
        <p>¡Gracias por ser parte de VYT Music! 🎤✨</p>
        <p>El equipo de VYT Music</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de aprobación enviado a: ${data.email}`);
    
    return { success: true, message: 'Email enviado correctamente' };
  } catch (error) {
    console.error('Error enviando correo de aprobación:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Enviar correo de aprobación (presencial)
 */
exports.enviarCorreoAprobacionPresencial = onCall(async (request) => {
  try {
    const { participantId } = request.data;
    
    if (!participantId) {
      throw new functions.https.HttpsError('invalid-argument', 'ParticipantId es requerido');
    }

    const participantDoc = await admin.firestore().collection('participantes_presenciales').doc(participantId).get();
    
    if (!participantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participante no encontrado');
    }

    const data = participantDoc.data();
    
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail,
          pass: gmailPassword,
        },
      });
    }

    const mailOptions = {
      from: `VYT Music <${gmailEmail}>`,
      to: data.email,
      subject: "🎉 ¡APROBADO! Tu inscripción presencial ha sido aceptada ✅",
      html: `
        <h1>🎉 ¡FELICITACIONES! 🎉</h1>
        <p>¡Hola <strong>${data.nombre_artista}</strong>!</p>
        <p>¡Excelentes noticias! Tu inscripción presencial ha sido <strong>APROBADA</strong>. 🌟</p>
        <p>Te contactaremos pronto con más detalles sobre las audiciones presenciales.</p>
        <p><a href="${siteUrl}/principal.html" style="background-color:#007bff;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">Ver Detalles</a></p>
        <p>¡Gracias por ser parte de VYT Music! 🎤✨</p>
        <p>El equipo de VYT Music</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de aprobación presencial enviado a: ${data.email}`);
    
    return { success: true, message: 'Email enviado correctamente' };
  } catch (error) {
    console.error('Error enviando correo de aprobación presencial:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Enviar correo de rechazo
 */
exports.enviarCorreoRechazo = onCall(async (request) => {
  try {
    const { participantId, modalidad } = request.data;
    
    if (!participantId || !modalidad) {
      throw new functions.https.HttpsError('invalid-argument', 'ParticipantId y modalidad son requeridos');
    }

    const collectionName = modalidad === 'online' ? 'participantes_online' : 'participantes_presenciales';
    const participantDoc = await admin.firestore().collection(collectionName).doc(participantId).get();
    
    if (!participantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participante no encontrado');
    }

    const data = participantDoc.data();
    
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail,
          pass: gmailPassword,
        },
      });
    }

    const mailOptions = {
      from: `VYT Music <${gmailEmail}>`,
      to: data.email,
      subject: "📩 Resultado de tu inscripción - VYT Music",
      html: `
        <h1>📩 Resultado de Evaluación</h1>
        <p>Hola <strong>${data.nombre_artista}</strong>,</p>
        <p>Gracias por tu interés en participar en el certamen VYT Music. 🎤</p>
        <p>Después de evaluar tu inscripción, lamentamos informarte que en esta ocasión no podrás continuar en el proceso.</p>
        <p>Te animamos a seguir practicando y estar atento a futuras convocatorias. 🌟</p>
        <p><a href="${siteUrl}/principal.html" style="background-color:#007bff;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">Volver al inicio</a></p>
        <p>El equipo de VYT Music</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de rechazo enviado a: ${data.email}`);
    
    return { success: true, message: 'Email de rechazo enviado' };
  } catch (error) {
    console.error('Error enviando correo de rechazo:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Funciones adicionales (placeholders para compatibilidad)
 */
exports.sendApprovalEmail = exports.enviarCorreoAprobacion;
exports.sendRejectionEmail = exports.enviarCorreoRechazo;
exports.sendApprovalEmailHttp = exports.enviarCorreoAprobacion;
exports.sendRejectionEmailHttp = exports.enviarCorreoRechazo;
exports.sendProfessionalRejectionEmail = exports.enviarCorreoRechazo;
