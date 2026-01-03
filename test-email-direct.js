/**
 * Test directo de envío de email sin triggers
 * Usa las credenciales de Gmail configuradas en Firebase
 */

const nodemailer = require('nodemailer');

// Configuración de Gmail desde Firebase config
const GMAIL_EMAIL = 'luciano21martinez@gmail.com';
const GMAIL_PASSWORD = 'wwhm qqei uxxz ciwl'; // App Password de Gmail

console.log('📧 Iniciando test de email directo...\n');

// Crear transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_PASSWORD
  }
});

// Configurar email de prueba
const mailOptions = {
  from: `VYT Music Test <${GMAIL_EMAIL}>`,
  to: GMAIL_EMAIL, // Enviamos a nosotros mismos
  subject: '🧪 Test de Email - VYT Music System',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">🧪 Test de Email Exitoso</h1>
      <p>Este es un email de prueba del sistema VYT Music.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>✅ Sistema Verificado:</h3>
        <ul>
          <li><strong>Nodemailer:</strong> Funcionando ✅</li>
          <li><strong>Gmail SMTP:</strong> Conectado ✅</li>
          <li><strong>Credenciales:</strong> Válidas ✅</li>
          <li><strong>Timestamp:</strong> ${new Date().toLocaleString('es-AR')}</li>
        </ul>
      </div>
      
      <p><strong>Si recibís este email, el sistema de envío está 100% operativo.</strong></p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <p style="color: #6b7280; font-size: 12px;">
        Este es un email automático de prueba del sistema VYT Music.<br>
        Fecha: ${new Date().toISOString()}
      </p>
    </div>
  `
};

// Enviar email
console.log('📤 Enviando email a:', GMAIL_EMAIL);

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ ERROR al enviar email:', error);
    console.error('Detalles:', error.message);
    process.exit(1);
  } else {
    console.log('\n✅ EMAIL ENVIADO EXITOSAMENTE!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📬 Response:', info.response);
    console.log('\n🔍 Revisa tu inbox en:', GMAIL_EMAIL);
    console.log('💡 Busca en SPAM si no aparece en bandeja principal\n');
    process.exit(0);
  }
});
