/**
 * VYT-MONEY MINIMAL - Solo funciones críticas sin dependencias pesadas
 * Versión ultra-ligera para evitar container timeout
 */

const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Lazy-load dependencias pesadas solo cuando se necesitan
let MercadoPagoConfig, Preference, nodemailer;

const loadMercadoPago = () => {
  if (!MercadoPagoConfig) {
    const mercadopago = require('mercadopago');
    MercadoPagoConfig = mercadopago.MercadoPagoConfig;
    Preference = mercadopago.Preference;
  }
  return { MercadoPagoConfig, Preference };
};

const loadNodemailer = () => {
  if (!nodemailer) {
    nodemailer = require('nodemailer');
  }
  return nodemailer;
};

// Config de Firebase
const mercadopagoToken = functions.config().mercadopago?.token;
const gmailEmail = functions.config().gmail?.email;
const gmailPassword = functions.config().gmail?.password;
const siteUrl = functions.config().site?.url || 'https://vytonlineprueva.web.app';

/**
 * Votar por un artista usando VYT-MONEY (versión minimal)
 */
exports.voteWithVYTMoney = onCall(async (request) => {
  try {
    const { artista_id, cantidad_vyt_money, user_id } = request.data;
    
    if (!artista_id || !cantidad_vyt_money || !user_id || cantidad_vyt_money <= 0) {
      throw new Error('Datos de voto inválidos');
    }

    const db = admin.firestore();
    
    // Verificar balance del usuario
    const userDoc = await db.collection('users').doc(user_id).get();
    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data();
    const currentBalance = userData.vyt_money_balance || 0;

    if (currentBalance < cantidad_vyt_money) {
      throw new Error('Saldo insuficiente de VYT-MONEY');
    }

    // Obtener configuración del pozo (valores por defecto si no existe)
    let config = { 
      porcentaje_pozo_votaciones: 10,
      precio_por_100_vyt_money: 1000 
    };
    
    try {
      const configDoc = await db.collection('vyt_money_config').doc('general').get();
      if (configDoc.exists) {
        config = { ...config, ...configDoc.data() };
      }
    } catch (err) {
      console.log('Config no encontrada, usando defaults');
    }

    // Calcular contribución al pozo
    const precio_unitario_vyt = config.precio_por_100_vyt_money / 100;
    const valor_monetario = cantidad_vyt_money * precio_unitario_vyt;
    const contribucion_pozo = (valor_monetario * config.porcentaje_pozo_votaciones) / 100;

    // Transacción para procesar el voto
    const result = await db.runTransaction(async (transaction) => {
      // Actualizar balance del usuario
      transaction.update(userDoc.ref, {
        vyt_money_balance: currentBalance - cantidad_vyt_money,
        total_vyt_money_spent: (userData.total_vyt_money_spent || 0) + cantidad_vyt_money,
        last_vote_timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Actualizar votos del artista
      const artistaRef = db.collection('participantes_online').doc(artista_id);
      const artistaDoc = await transaction.get(artistaRef);
      
      if (artistaDoc.exists) {
        const artistaData = artistaDoc.data();
        transaction.update(artistaRef, {
          total_votos_vyt_money: (artistaData.total_votos_vyt_money || 0) + cantidad_vyt_money,
          total_votos_count: (artistaData.total_votos_count || 0) + 1,
          valor_monetario_votos: (artistaData.valor_monetario_votos || 0) + valor_monetario,
          ultima_actualizacion: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Registrar el voto
      const votoRef = db.collection('votos_vyt_money').doc();
      transaction.set(votoRef, {
        user_id: user_id,
        artista_id: artista_id,
        cantidad_vyt_money: cantidad_vyt_money,
        valor_monetario: valor_monetario,
        contribucion_pozo: contribucion_pozo,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Actualizar pozo de premios
      const pozoRef = db.collection('pozo_premios').doc('general');
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
      
      return {
        nuevo_balance: currentBalance - cantidad_vyt_money,
        contribucion_pozo: contribucion_pozo
      };
    });

    return {
      success: true,
      nuevo_balance: result.nuevo_balance,
      contribucion_pozo: result.contribucion_pozo,
      message: `Voto registrado: ${cantidad_vyt_money} VYT-MONEY`
    };

  } catch (error) {
    console.error('Error processing VYT-MONEY vote:', error);
    throw new Error(error.message || 'Error al procesar voto');
  }
});

/**
 * Obtener balance de VYT-MONEY del usuario (versión minimal)
 */
exports.getVYTMoneyBalance = onCall(async (request) => {
  try {
    const { user_id } = request.data;
    
    if (!user_id) {
      throw new Error('User ID requerido');
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(user_id).get();
    
    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data();
    
    return {
      success: true,
      balance: userData.vyt_money_balance || 0,
      total_purchased: userData.total_vyt_money_purchased || 0,
      total_spent: userData.total_vyt_money_spent || 0,
      last_purchase: userData.last_vyt_money_purchase || null,
      last_vote: userData.last_vote_timestamp || null
    };

  } catch (error) {
    console.error('Error getting VYT-MONEY balance:', error);
    throw new Error(error.message || 'Error al obtener balance');
  }
});

/**
 * Obtener estado del pozo de premios (versión minimal)
 */
exports.getPrizePoolStatus = onCall(async (request) => {
  try {
    const db = admin.firestore();
    const pozoDoc = await db.collection('pozo_premios').doc('general').get();
    
    if (!pozoDoc.exists) {
      return {
        success: true,
        total_pozo: 0,
        contribuciones_votaciones: 0,
        contribuciones_inscripciones: 0
      };
    }

    const data = pozoDoc.data();
    return {
      success: true,
      total_pozo: data.total_pozo || 0,
      contribuciones_votaciones: data.contribuciones_votaciones || 0,
      contribuciones_inscripciones: data.contribuciones_inscripciones || 0,
      ultima_actualizacion: data.ultima_actualizacion || null
    };

  } catch (error) {
    console.error('Error getting prize pool status:', error);
    throw new Error(error.message || 'Error al obtener estado del pozo');
  }
});

/**
 * Crear pago de VYT-MONEY con MercadoPago (lazy-load)
 */
exports.createVYTMoneyPayment = onCall(async (request) => {
  try {
    const { cantidad, user_id, user_email, user_name } = request.data;
    
    if (!cantidad || !user_id || !user_email) {
      throw new Error('Datos incompletos para el pago');
    }

    console.log(`💰 Creando pago VYT-MONEY: ${cantidad} para usuario ${user_email}`);

    const db = admin.firestore();

    // Obtener configuración de precios
    const configDoc = await db.collection('payment_config').doc('vyt_money').get();
    const config = configDoc.exists ? configDoc.data() : {
      precio_por_100: 50,
      moneda: 'ARS',
      activo: true
    };

    if (!config.activo) {
      throw new Error('Las compras de VYT-MONEY están deshabilitadas temporalmente');
    }

    // Calcular precio
    const precio_total = Math.ceil((cantidad / 100) * config.precio_por_100);

    console.log(`💵 Precio: ${cantidad} VYT-MONEY = $${precio_total} ${config.moneda}`);

    // Lazy-load MercadoPago solo cuando se necesita
    const { MercadoPagoConfig: MPConfig, Preference: MPPreference } = loadMercadoPago();
    
    const client = new MPConfig({ accessToken: mercadopagoToken });
    const preference = new MPPreference(client);

    // Crear preferencia de pago
    const preferenceData = {
      items: [{
        title: `${cantidad} VYT-MONEY`,
        description: `Compra de ${cantidad.toLocaleString()} VYT-MONEY para votar en VYT Music`,
        quantity: 1,
        currency_id: config.moneda,
        unit_price: precio_total
      }],
      payer: {
        email: user_email,
        name: user_name || user_email.split('@')[0]
      },
      back_urls: {
        success: `${siteUrl}/pago/pago_exitoso.html?type=vyt_money&amount=${cantidad}`,
        failure: `${siteUrl}/pago/pago_fallido.html?type=vyt_money`,
        pending: `${siteUrl}/pago/pago_pendiente.html?type=vyt_money`
      },
      auto_return: "approved",
      external_reference: user_id,
      notification_url: `${siteUrl}/recibirPago`,
      metadata: {
        tipo_compra: 'vyt_money',
        user_id: user_id,
        user_email: user_email,
        cantidad_vyt_money: cantidad
      }
    };

    const result = await preference.create({ body: preferenceData });

    // Guardar transacción pendiente
    await db.collection('vyt_money_transactions').add({
      user_id: user_id,
      cantidad_vyt_money: cantidad,
      precio_total: precio_total,
      moneda: config.moneda,
      preference_id: result.id,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      mercadopago_data: result
    });

    return {
      success: true,
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    };

  } catch (error) {
    console.error('Error creating VYT-MONEY payment:', error);
    throw new Error(error.message || 'Error al crear pago');
  }
});

/**
 * Enviar email de confirmación de compra VYT-MONEY (lazy-load)
 */
exports.sendVYTMoneyConfirmation = onCall(async (request) => {
  try {
    const { user_id, cantidad_vyt_money } = request.data;
    
    if (!user_id || !cantidad_vyt_money) {
      throw new Error('Datos incompletos');
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(user_id).get();
    
    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data();
    
    // Lazy-load nodemailer solo cuando se envía email
    const nodemailerModule = loadNodemailer();
    const transporter = nodemailerModule.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailPassword
      }
    });

    const mailOptions = {
      from: `VYT Music <${gmailEmail}>`,
      to: userData.email,
      subject: `💰 ¡Compra de VYT-MONEY Confirmada! - ${cantidad_vyt_money} VYT-MONEY`,
      html: `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; font-family: Arial, sans-serif;">
          <div style="background: white; border-radius: 15px; padding: 30px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #667eea; text-align: center; margin-bottom: 20px;">💰 ¡Compra Confirmada!</h1>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <h2 style="color: #333; margin-bottom: 10px;">Nuevo balance de VYT-MONEY</h2>
              <div style="font-size: 36px; font-weight: bold; color: #667eea; margin: 15px 0;">
                ${userData.vyt_money_balance || 0} VYT-MONEY
              </div>
              <p style="color: #666; margin: 0;">¡Acabas de recibir ${cantidad_vyt_money} VYT-MONEY!</p>
            </div>
            
            <div style="background: #e8f4ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #0066cc; margin: 0; text-align: center;">
                <strong>¡Ahora puedes votar por tus artistas favoritos!</strong>
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/principal.html" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                ¡Comenzar a Votar!
              </a>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Email enviado correctamente'
    };

  } catch (error) {
    console.error('Error sending VYT-MONEY confirmation email:', error);
    throw new Error(error.message || 'Error al enviar email');
  }
});

console.log('✅ VYT Money MINIMAL functions loaded (5 functions with lazy-load)');
