/**
 * VYT-MONEY MINIMAL - Solo funciones críticas sin dependencias pesadas
 * Versión ultra-ligera para evitar container timeout
 */

const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

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

console.log('✅ VYT Money MINIMAL functions loaded (lightweight version)');
