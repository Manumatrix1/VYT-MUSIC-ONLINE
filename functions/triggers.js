/**
 * 🎯 VYT MUSIC - TRIGGERS AUTOMÁTICOS DE FIRESTORE
 * Se ejecutan automáticamente cuando cambia la base de datos
 * 
 * EVENTOS:
 * 1. Nueva inscripción → Email de bienvenida
 * 2. Pago confirmado → Email de confirmación
 * 3. Video aprobado → Email de aprobación
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// ⚠️ NOTA: Las credenciales deben estar en Firebase Functions Config
// Para configurar: firebase functions:config:set gmail.email="..." gmail.password="..."
// Por ahora, usamos valores por defecto que deberán ser configurados
const gmailEmail = process.env.GMAIL_EMAIL || 'luciano21martinez@gmail.com';
const gmailPassword = process.env.GMAIL_PASSWORD || 'wwhm qqei uxxz ciwl';
const siteUrl = process.env.SITE_URL || 'https://vytonlineprueva.web.app';

let transporter = null;

/**
 * Obtener o crear transporter de nodemailer
 */
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailEmail,
                pass: gmailPassword
            }
        });
        console.log('📧 Transporter de email configurado:', gmailEmail);
    }
    return transporter;
}

// ================================================================
// 🎯 TRIGGER 1: NUEVA INSCRIPCIÓN
// ================================================================

exports.onNewInscription = functions.firestore
    .document('participantes_online/{inscriptionId}')
    .onCreate(async (snap, context) => {
        const inscription = snap.data();
        const inscriptionId = context.params.inscriptionId;

        console.log('🆕 Nueva inscripción detectada:', {
            id: inscriptionId,
            email: inscription.email,
            nombre: inscription.nombre_artista
        });

        // Verificar que no sea una inscripción de prueba ya procesada
        if (inscription.email_bienvenida_enviado) {
            console.log('⏭️ Email de bienvenida ya enviado, saltando...');
            return null;
        }

        try {
            const mailOptions = {
                from: `VYT Music <${gmailEmail}>`,
                to: inscription.email,
                subject: '🎤 ¡Bienvenido a VYT Music! - Inscripción Recibida',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                            .info-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
                            .footer { text-align: center; color: #888; margin-top: 30px; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🎤 ¡Bienvenido a VYT Music!</h1>
                            </div>
                            <div class="content">
                                <h2>¡Hola ${inscription.nombre_artista || inscription.nombre}!</h2>
                                <p>Tu inscripción ha sido <strong>recibida con éxito</strong>.</p>
                                
                                <div class="info-box">
                                    <h3 style="margin-top: 0;">📋 Detalles de tu inscripción:</h3>
                                    <p><strong>Nombre artístico:</strong> ${inscription.nombre_artista}</p>
                                    <p><strong>Email:</strong> ${inscription.email}</p>
                                    <p><strong>Certamen:</strong> ${inscription.certamen_nombre || 'A definir'}</p>
                                    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                
                                <h3>📱 Próximos pasos:</h3>
                                <ol style="line-height: 2;">
                                    <li><strong>Completa el pago</strong> de tu inscripción (${inscription.precio_certamen ? '$' + inscription.precio_certamen : 'Valor a confirmar'})</li>
                                    <li><strong>Sube tu video</strong> de participación</li>
                                    <li><strong>Espera la aprobación</strong> de nuestro equipo</li>
                                    <li>¡Prepárate para brillar! ⭐</li>
                                </ol>
                                
                                ${!inscription.pago_completado ? `
                                <div style="text-align: center;">
                                    <a href="${siteUrl}/pagar-inscripcion.html?id=${inscriptionId}" class="button">
                                        💳 Ir a pagar ahora
                                    </a>
                                </div>
                                ` : ''}
                                
                                <p style="margin-top: 30px;">Si tienes alguna duda, no dudes en contactarnos.</p>
                                <p>¡Gracias por ser parte de VYT Music! 🎵✨</p>
                            </div>
                            <div class="footer">
                                <p>VYT Music - Plataforma de Certámenes de Canto</p>
                                <p>${siteUrl}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            await getTransporter().sendMail(mailOptions);
            console.log('✅ Email de bienvenida enviado a:', inscription.email);

            // Marcar como enviado en Firestore
            await event.data.ref.update({
                email_bienvenida_enviado: true,
                fecha_email_bienvenida: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, email: inscription.email };

        } catch (error) {
            console.error('❌ Error enviando email de bienvenida:', error);
            
            // Registrar error pero no fallar
            await event.data.ref.update({
                email_bienvenida_error: error.message,
                fecha_email_bienvenida_error: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: false, error: error.message };
        }
    });

// ================================================================
// 🎯 TRIGGER 2: PAGO CONFIRMADO
// ================================================================

exports.onPaymentConfirmed = functions.firestore
    .document('participantes_online/{inscriptionId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const inscriptionId = context.params.inscriptionId;

        // Solo procesar si el estado cambió a "pago_confirmado"
        if (before.estado === 'pago_confirmado' || after.estado !== 'pago_confirmado') {
            return null; // No hacer nada
        }

        // Verificar que no se haya enviado ya el email
        if (after.email_pago_enviado) {
            console.log('⏭️ Email de pago ya enviado, saltando...');
            return null;
        }

        console.log('💰 Pago confirmado detectado:', {
            id: inscriptionId,
            email: after.email,
            monto: after.monto_pago
        });

        try {
            const mailOptions = {
                from: `VYT Music <${gmailEmail}>`,
                to: after.email,
                subject: '✅ Pago Confirmado - Ya eres participante oficial de VYT Music',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                            .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                            .success-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
                            .footer { text-align: center; color: #888; margin-top: 30px; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🎉 ¡Pago Confirmado!</h1>
                            </div>
                            <div class="content">
                                <h2>¡Felicitaciones ${after.nombre_artista || after.nombre}!</h2>
                                <p>Tu pago ha sido <strong>confirmado exitosamente</strong>. Ya eres participante oficial de VYT Music.</p>
                                
                                <div class="success-box">
                                    <h3 style="margin-top: 0;">💳 Detalles del pago:</h3>
                                    <p><strong>Monto:</strong> $${after.monto_pago || after.precio_certamen || 'N/A'}</p>
                                    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                    <p><strong>Estado:</strong> ✅ Confirmado</p>
                                </div>
                                
                                <h3>📱 Próximos pasos:</h3>
                                <ol style="line-height: 2;">
                                    <li><strong>Sube tu video</strong> de participación</li>
                                    <li><strong>Espera la aprobación</strong> de nuestro equipo de jurados</li>
                                    <li><strong>Promociona</strong> tu participación en redes sociales</li>
                                    <li>¡Prepárate para brillar en el escenario! 🌟</li>
                                </ol>
                                
                                <div style="text-align: center;">
                                    <a href="${siteUrl}/subir-video.html" class="button">
                                        🎥 Subir mi video ahora
                                    </a>
                                </div>
                                
                                <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 5px;">
                                    <strong>💡 Consejo:</strong> Asegúrate de que tu video cumpla con todos los requisitos del reglamento para una aprobación rápida.
                                </p>
                                
                                <p style="margin-top: 30px;">¡Gracias por confiar en VYT Music! 🎵✨</p>
                            </div>
                            <div class="footer">
                                <p>VYT Music - Plataforma de Certámenes de Canto</p>
                                <p>${siteUrl}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            await getTransporter().sendMail(mailOptions);
            console.log('✅ Email de pago confirmado enviado a:', after.email);

            // Marcar como enviado
            await change.after.ref.update({
                email_pago_enviado: true,
                fecha_email_pago: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, email: after.email };

        } catch (error) {
            console.error('❌ Error enviando email de pago confirmado:', error);
            
            await change.after.ref.update({
                email_pago_error: error.message,
                fecha_email_pago_error: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: false, error: error.message };
        }
    });

// ================================================================
// 🎯 TRIGGER 3: VIDEO APROBADO
// ================================================================

exports.onVideoApproved = functions.firestore
    .document('participantes_online/{inscriptionId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const inscriptionId = context.params.inscriptionId;

        // Solo procesar si cambió de NO aprobado a aprobado
        if (before.video_aprobado === true || after.video_aprobado !== true) {
            return null;
        }

        // Verificar que no se haya enviado ya el email
        if (after.email_aprobacion_enviado) {
            console.log('⏭️ Email de aprobación ya enviado, saltando...');
            return null;
        }

        console.log('🎉 Video aprobado detectado:', {
            id: inscriptionId,
            email: after.email,
            artista: after.nombre_artista
        });

        try {
            const mailOptions = {
                from: `VYT Music <${gmailEmail}>`,
                to: after.email,
                subject: '🎉 ¡Tu video ha sido APROBADO! - VYT Music',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                            .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                            .celebration-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
                            .tips-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                            .footer { text-align: center; color: #888; margin-top: 30px; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🎉 ¡FELICITACIONES!</h1>
                            </div>
                            <div class="content">
                                <h2>¡Hola ${after.nombre_artista || after.nombre}!</h2>
                                
                                <div class="celebration-box">
                                    <h2 style="margin-top: 0; font-size: 24px;">✨ TU VIDEO HA SIDO APROBADO ✨</h2>
                                    <p style="font-size: 18px; margin: 0;">Ya estás participando oficialmente en VYT Music</p>
                                </div>
                                
                                <p>Nuestro equipo de jurados ha revisado tu video y ha sido <strong>aprobado exitosamente</strong>.</p>
                                
                                <h3>🌟 Ahora puedes:</h3>
                                <ul style="line-height: 2;">
                                    <li>✅ Ver tu video en la plataforma</li>
                                    <li>✅ Compartirlo en redes sociales</li>
                                    <li>✅ Invitar a tus fans a votar por ti</li>
                                    <li>✅ Competir por el premio del certamen</li>
                                </ul>
                                
                                <div style="text-align: center;">
                                    <a href="${siteUrl}/mi-participacion.html" class="button">
                                        🎬 Ver mi participación
                                    </a>
                                </div>
                                
                                <div class="tips-box">
                                    <h3 style="margin-top: 0;">💡 Consejos para destacar:</h3>
                                    <ul>
                                        <li>Comparte tu video en Facebook, Instagram y WhatsApp</li>
                                        <li>Invita a tus amigos y familiares a votar</li>
                                        <li>Usa los hashtags #VYTMusic #${after.certamen_nombre?.replace(/\s+/g, '')}</li>
                                        <li>¡Entre más votos, mejor posición en el ranking!</li>
                                    </ul>
                                </div>
                                
                                <p style="margin-top: 30px; text-align: center; font-size: 18px;">
                                    <strong>¡Mucha suerte! 🍀</strong><br>
                                    Que tu talento brille en VYT Music ⭐
                                </p>
                            </div>
                            <div class="footer">
                                <p>VYT Music - Plataforma de Certámenes de Canto</p>
                                <p>${siteUrl}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            await getTransporter().sendMail(mailOptions);
            console.log('✅ Email de aprobación enviado a:', after.email);

            // Marcar como enviado
            await change.after.ref.update({
                email_aprobacion_enviado: true,
                fecha_email_aprobacion: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, email: after.email };

        } catch (error) {
            console.error('❌ Error enviando email de aprobación:', error);
            
            await change.after.ref.update({
                email_aprobacion_error: error.message,
                fecha_email_aprobacion_error: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: false, error: error.message };
        }
    });

console.log('✅ Triggers automáticos cargados correctamente');
