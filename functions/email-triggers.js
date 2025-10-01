/**
 * EMAIL TRIGGERS MODULE
 * Triggers automáticos para enviar emails en eventos específicos
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');

// Configuración de constantes
const gmailEmail = functions.config().gmail?.email || { value: () => 'luciano21martinez@gmail.com' };
const gmailPassword = functions.config().gmail?.password || { value: () => 'wwhm qqei uxxz ciwl' };
const siteUrl = functions.config().site?.url || { value: () => 'https://vytonlineprueva.web.app' };

// Variable global para el transporter
let transporter = null;

// Función para inicializar el transporter
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });
  }
  return transporter;
}

/**
 * TRIGGER: Email de bienvenida al crear perfil de artista
 */
exports.emailPerfilArtistaCreado = onDocumentCreated(
  "artist_profiles/{profileId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    
    const data = snapshot.data();
    console.log('📧 Enviando email de bienvenida a artista:', data);
    
    try {
      const transporter = getTransporter();
      
      const mailOptions = {
        from: `VYT Music <${gmailEmail.value()}>`,
        to: data.email || data.user_email,
        subject: "🎉 ¡Bienvenido/a a VYT Music! Tu perfil de artista ha sido creado",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">🎉 ¡Bienvenido/a a VYT Music!</h1>
            <p>Hola <strong>${data.nombreArtistico || data.nombre_artista}</strong>,</p>
            
            <p>¡Felicitaciones! Tu perfil de artista ha sido creado exitosamente en VYT Music. 🎤✨</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Detalles de tu perfil:</h3>
              <ul>
                <li><strong>Nombre artístico:</strong> ${data.nombreArtistico || data.nombre_artista}</li>
                <li><strong>Género musical:</strong> ${data.generoMusical || data.genero_musical}</li>
                <li><strong>Ciudad:</strong> ${data.ciudad}</li>
                <li><strong>Provincia:</strong> ${data.provincia}</li>
              </ul>
            </div>
            
            <p>🎯 <strong>Próximos pasos:</strong></p>
            <ul>
              <li>Completa tu perfil con más información</li>
              <li>Participa en certámenes activos</li>
              <li>Conecta con otros artistas</li>
              <li>Compra VYTMoney para votar por tus artistas favoritos</li>
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl.value()}/perfil-artista.html" 
                 style="background-color:#2563eb;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">
                Ver mi Perfil
              </a>
            </p>
            
            <p>¡Bienvenido/a a la comunidad VYT Music! 🌟</p>
            <p>El equipo de VYT Music</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              VYT Music - Tu plataforma musical online<br>
              <a href="${siteUrl.value()}">${siteUrl.value()}</a>
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email de bienvenida enviado a: ${data.email || data.user_email}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      return null;
    }
  }
);

/**
 * TRIGGER: Email de confirmación al crear usuario
 */
exports.emailUsuarioCreado = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    
    const data = snapshot.data();
    const userId = event.params.userId;
    
    console.log('📧 Enviando email de confirmación a usuario:', data);
    
    try {
      const transporter = getTransporter();
      
      const mailOptions = {
        from: `VYT Music <${gmailEmail.value()}>`,
        to: data.email,
        subject: "✅ Cuenta creada exitosamente - VYT Music",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">✅ ¡Cuenta creada exitosamente!</h1>
            <p>Hola <strong>${data.firstName || data.nombre} ${data.lastName || data.apellido}</strong>,</p>
            
            <p>¡Bienvenido/a a VYT Music! Tu cuenta ha sido creada exitosamente. 🎉</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3>🎵 ¿Qué puedes hacer ahora?</h3>
              <ul>
                <li>✨ Crear tu perfil de artista</li>
                <li>🎤 Participar en certámenes musicales</li>
                <li>💰 Comprar VYTMoney para votar</li>
                <li>📊 Ver rankings de artistas</li>
                <li>🌟 Descubrir nuevos talentos</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl.value()}/principal.html" 
                 style="background-color:#10b981;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">
                Explorar VYT Music
              </a>
            </p>
            
            <p>¡Gracias por unirte a nuestra comunidad musical! 🎶</p>
            <p>El equipo de VYT Music</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              VYT Music - Tu plataforma musical online<br>
              <a href="${siteUrl.value()}">${siteUrl.value()}</a>
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email de confirmación enviado a: ${data.email}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error enviando email de confirmación:', error);
      return null;
    }
  }
);

/**
 * TRIGGER: Email de confirmación de compra VYTMoney
 */
exports.emailCompraVYTMoney = onDocumentCreated(
  "vyt_money_purchases/{purchaseId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    
    const data = snapshot.data();
    console.log('📧 Enviando email de compra VYTMoney:', data);
    
    try {
      const transporter = getTransporter();
      
      const mailOptions = {
        from: `VYT Music <${gmailEmail.value()}>`,
        to: data.email || data.user_email,
        subject: "💰 Compra de VYTMoney - Confirmación de pedido",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">💰 Compra de VYTMoney</h1>
            <p>Hola <strong>${data.user_name || 'Cliente'}</strong>,</p>
            
            <p>Hemos recibido tu pedido de compra de VYTMoney. 🎉</p>
            
            <div style="background: #fefbf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3>📋 Detalles de tu compra:</h3>
              <ul>
                <li><strong>Cantidad VYTMoney:</strong> ${data.cantidad_vyt_money || data.amount} VYT</li>
                <li><strong>Precio:</strong> $${data.precio || data.total} ARS</li>
                <li><strong>ID de compra:</strong> ${event.params.purchaseId}</li>
                <li><strong>Estado:</strong> ${data.status === 'pending' ? 'Pendiente de pago' : data.status}</li>
                <li><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</li>
              </ul>
            </div>
            
            ${data.status === 'pending' ? `
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>💳 Completa tu pago</h3>
                <p>Para completar tu compra, realiza el pago usando el enlace que te proporcionamos.</p>
                <p>Una vez confirmado el pago, tu VYTMoney estará disponible inmediatamente en tu cuenta.</p>
              </div>
            ` : ''}
            
            <p>🎯 <strong>¿Para qué usar tu VYTMoney?</strong></p>
            <ul>
              <li>🗳️ Votar por tus artistas favoritos</li>
              <li>🏆 Participar en el pozo de premios</li>
              <li>⭐ Dar propinas a artistas destacados</li>
              <li>🎫 Acceder a contenido exclusivo</li>
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl.value()}/principal.html" 
                 style="background-color:#f59e0b;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">
                Ver mi Balance
              </a>
            </p>
            
            <p>¡Gracias por tu compra! 💫</p>
            <p>El equipo de VYT Music</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              VYT Music - Tu plataforma musical online<br>
              <a href="${siteUrl.value()}">${siteUrl.value()}</a>
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email de compra VYTMoney enviado a: ${data.email || data.user_email}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error enviando email de compra VYTMoney:', error);
      return null;
    }
  }
);

/**
 * TRIGGER: Email cuando se confirma un pago (cualquier tipo)
 */
exports.emailPagoConfirmado = onDocumentUpdated(
  "payments/{paymentId}",
  async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    
    // Solo enviar email si el estado cambió a 'approved'
    if (beforeData.status !== 'approved' && afterData.status === 'approved') {
      console.log('📧 Enviando email de pago confirmado:', afterData);
      
      try {
        const transporter = getTransporter();
        
        let subject = "";
        let content = "";
        
        switch (afterData.type) {
          case 'vyt_money':
            subject = "✅ ¡Pago confirmado! Tu VYTMoney ya está disponible";
            content = `
              <h1 style="color: #10b981;">✅ ¡Pago confirmado!</h1>
              <p>¡Excelentes noticias! Tu pago ha sido procesado exitosamente. 🎉</p>
              <p>Tu VYTMoney (${afterData.cantidad_vyt_money || afterData.amount} VYT) ya está disponible en tu cuenta.</p>
              <p>¡Ya puedes usarlo para votar por tus artistas favoritos! 🗳️</p>
            `;
            break;
            
          case 'inscripcion_online':
            subject = "✅ ¡Pago confirmado! Tu inscripción está completa";
            content = `
              <h1 style="color: #10b981;">✅ ¡Inscripción confirmada!</h1>
              <p>¡Felicitaciones! Tu pago ha sido procesado y tu inscripción al certamen está completa. 🎤</p>
              <p>Ahora eres oficialmente parte del certamen VYT Music.</p>
              <p>¡Te deseamos mucha suerte! 🌟</p>
            `;
            break;
            
          default:
            subject = "✅ Pago confirmado - VYT Music";
            content = `
              <h1 style="color: #10b981;">✅ ¡Pago confirmado!</h1>
              <p>Tu pago ha sido procesado exitosamente. ¡Gracias! 🎉</p>
            `;
        }
        
        const mailOptions = {
          from: `VYT Music <${gmailEmail.value()}>`,
          to: afterData.email || afterData.user_email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${content}
              
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>📋 Detalles del pago:</h3>
                <ul>
                  <li><strong>ID de pago:</strong> ${afterData.payment_id || event.params.paymentId}</li>
                  <li><strong>Monto:</strong> $${afterData.amount || afterData.total} ARS</li>
                  <li><strong>Estado:</strong> Aprobado ✅</li>
                  <li><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</li>
                </ul>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl.value()}/principal.html" 
                   style="background-color:#10b981;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">
                  Ir a VYT Music
                </a>
              </p>
              
              <p>¡Gracias por confiar en nosotros! 💫</p>
              <p>El equipo de VYT Music</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                VYT Music - Tu plataforma musical online<br>
                <a href="${siteUrl.value()}">${siteUrl.value()}</a>
              </p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de pago confirmado enviado a: ${afterData.email || afterData.user_email}`);
        return { success: true };
        
      } catch (error) {
        console.error('❌ Error enviando email de pago confirmado:', error);
        return null;
      }
    }
    
    return null;
  }
);

console.log('📧 Email triggers module loaded');