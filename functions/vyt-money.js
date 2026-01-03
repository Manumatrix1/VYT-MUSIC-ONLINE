/**
 * VYT-MONEY SYSTEM MODULE
 * Módulo especializado para el sistema de moneda virtual VYT-MONEY
 * Incluye votaciones, balance, pozo de premios y configuración
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Lazy-load nodemailer solo cuando se necesita (para emails)
let nodemailer;
const getNodemailer = () => {
  if (!nodemailer) {
    nodemailer = require('nodemailer');
  }
  return nodemailer;
};

// Configuración de constantes
const gmailEmail = functions.config().gmail?.email || { value: () => 'test@gmail.com' };
const gmailPassword = functions.config().gmail?.password || { value: () => 'test_password' };
const siteUrl = functions.config().site?.url || { value: () => 'https://vyt-music-online.web.app' };

const { onCall } = require('firebase-functions/v2/https');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');

// ===== SISTEMA VYT-MONEY =====

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
    
    // Lazy-load nodemailer solo cuando se envía email
    const nodemailer = getNodemailer();
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

// Exportar función auxiliar para confirmación de compra
exports.sendVYTMoneyPurchaseConfirmation = sendVYTMoneyPurchaseConfirmation;