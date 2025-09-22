/**
 * EMAILS MODULE - OPTIMIZED VERSION
 * Módulo especializado para el sistema de emails automatizados
 * Versión optimizada para evitar timeouts de inicialización
 */

const { onCall, onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Función para crear configuración de email diferida (lazy loading)
function createEmailTransporter() {
  const nodemailer = require('nodemailer');
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL || 'test@gmail.com',
      pass: process.env.GMAIL_PASSWORD || 'test_password'
    }
  });
}

// Función utilitaria para enviar emails
async function sendEmailOptimized(to, subject, htmlContent) {
  try {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_EMAIL || 'noreply@vyt-music-online.com',
      to,
      subject,
      html: htmlContent
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// 📧 FUNCIONES DE EMAILS OPTIMIZADAS

const enviarCorreoInscripcionOnline = onCall(async (request) => {
  const { email, nombre, categoriaParticipacion } = request.data;
  
  const htmlContent = `
    <h2>¡Inscripción Exitosa - VYT Music Online!</h2>
    <p>Hola ${nombre},</p>
    <p>Tu inscripción para la categoría <strong>${categoriaParticipacion}</strong> ha sido registrada exitosamente.</p>
    <p>¡Gracias por participar!</p>
  `;
  
  await sendEmailOptimized(email, 'Inscripción Exitosa - VYT Music Online', htmlContent);
  return { success: true, message: 'Email enviado correctamente' };
});

const enviarCorreoInscripcionPresencial = onCall(async (request) => {
  const { email, nombre, categoriaParticipacion } = request.data;
  
  const htmlContent = `
    <h2>¡Inscripción Presencial Exitosa - VYT Music Online!</h2>
    <p>Hola ${nombre},</p>
    <p>Tu inscripción presencial para la categoría <strong>${categoriaParticipacion}</strong> ha sido registrada.</p>
    <p>¡Te esperamos!</p>
  `;
  
  await sendEmailOptimized(email, 'Inscripción Presencial - VYT Music Online', htmlContent);
  return { success: true, message: 'Email enviado correctamente' };
});

const enviarCorreoAprobacion = onCall(async (request) => {
  const { email, nombre } = request.data;
  
  const htmlContent = `
    <h2>¡Felicitaciones! Tu participación ha sido aprobada</h2>
    <p>Hola ${nombre},</p>
    <p>Tu participación en VYT Music Online ha sido <strong>aprobada</strong>.</p>
    <p>¡Mucha suerte en el certamen!</p>
  `;
  
  await sendEmailOptimized(email, 'Participación Aprobada - VYT Music Online', htmlContent);
  return { success: true, message: 'Email de aprobación enviado' };
});

const enviarCorreoAprobacionPresencial = onCall(async (request) => {
  const { email, nombre } = request.data;
  
  const htmlContent = `
    <h2>¡Participación Presencial Aprobada!</h2>
    <p>Hola ${nombre},</p>
    <p>Tu participación presencial ha sido aprobada.</p>
    <p>¡Nos vemos en el evento!</p>
  `;
  
  await sendEmailOptimized(email, 'Participación Presencial Aprobada', htmlContent);
  return { success: true, message: 'Email de aprobación enviado' };
});

const enviarCorreoRechazo = onCall(async (request) => {
  const { email, nombre, motivo } = request.data;
  
  const htmlContent = `
    <h2>Actualización sobre tu participación</h2>
    <p>Hola ${nombre},</p>
    <p>Lamentamos informarte que tu participación no pudo ser aprobada.</p>
    <p><strong>Motivo:</strong> ${motivo || 'No especificado'}</p>
    <p>¡Esperamos verte en futuras ediciones!</p>
  `;
  
  await sendEmailOptimized(email, 'Actualización de participación - VYT Music Online', htmlContent);
  return { success: true, message: 'Email de rechazo enviado' };
});

const sendApprovalEmail = onCall(async (request) => {
  const { email, nombre } = request.data;
  
  const htmlContent = `
    <h2>🎉 Approval Notification - VYT Music Online</h2>
    <p>Hello ${nombre},</p>
    <p>Your participation has been <strong>approved</strong>!</p>
    <p>Good luck in the competition!</p>
  `;
  
  await sendEmailOptimized(email, 'Approval Notification - VYT Music Online', htmlContent);
  return { success: true, message: 'Approval email sent' };
});

const sendRejectionEmail = onCall(async (request) => {
  const { email, nombre, reason } = request.data;
  
  const htmlContent = `
    <h2>Participation Update - VYT Music Online</h2>
    <p>Hello ${nombre},</p>
    <p>We regret to inform you that your participation could not be approved.</p>
    <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
    <p>We hope to see you in future editions!</p>
  `;
  
  await sendEmailOptimized(email, 'Participation Update - VYT Music Online', htmlContent);
  return { success: true, message: 'Rejection email sent' };
});

const sendApprovalEmailHttp = onRequest(async (req, res) => {
  try {
    const { email, nombre } = req.body;
    
    const htmlContent = `
      <h2>🎉 HTTP Approval - VYT Music Online</h2>
      <p>Hello ${nombre},</p>
      <p>Your participation has been approved via HTTP!</p>
    `;
    
    await sendEmailOptimized(email, 'HTTP Approval - VYT Music Online', htmlContent);
    res.status(200).json({ success: true, message: 'Approval email sent via HTTP' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const sendRejectionEmailHttp = onRequest(async (req, res) => {
  try {
    const { email, nombre, reason } = req.body;
    
    const htmlContent = `
      <h2>HTTP Rejection Notification - VYT Music Online</h2>
      <p>Hello ${nombre},</p>
      <p>Your participation could not be approved.</p>
      <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
    `;
    
    await sendEmailOptimized(email, 'HTTP Rejection - VYT Music Online', htmlContent);
    res.status(200).json({ success: true, message: 'Rejection email sent via HTTP' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const sendProfessionalRejectionEmail = onCall(async (request) => {
  const { email, nombre, reason } = request.data;
  
  const htmlContent = `
    <h2>Professional Category Update - VYT Music Online</h2>
    <p>Dear ${nombre},</p>
    <p>Your application for the professional category requires review.</p>
    <p><strong>Details:</strong> ${reason || 'Additional documentation needed'}</p>
    <p>Please contact our support team for more information.</p>
  `;
  
  await sendEmailOptimized(email, 'Professional Category Update - VYT Music Online', htmlContent);
  return { success: true, message: 'Professional rejection email sent' };
});

// Exportar todas las funciones
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