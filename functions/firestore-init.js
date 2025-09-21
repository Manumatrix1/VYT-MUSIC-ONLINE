// init-firestore-structure.js - Script para inicializar la estructura de Firestore
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

/**
 * Inicializar la estructura completa de Firestore
 * Solo puede ser ejecutado por administradores
 */
const initializeFirestoreStructure = onCall(async (request) => {
  try {
    // Verificar autenticación de admin
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    // Verificar que sea admin (opcional para primera ejecución)
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (userDoc.exists() && userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden inicializar la estructura');
    }

    const batch = admin.firestore().batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // ===== CONFIGURACIÓN DE PAGOS =====
    
    // Configuración VYT-MONEY
    const vytMoneyConfigRef = admin.firestore().collection('payment_config').doc('vyt_money');
    batch.set(vytMoneyConfigRef, {
      precio_por_100: 100,
      moneda: 'ARS',
      activo: true,
      descuentos: {
        500: 5,   // 5% descuento por 500 VYT-MONEY
        1000: 10, // 10% descuento por 1000 VYT-MONEY
        2000: 15  // 15% descuento por 2000 VYT-MONEY
      },
      created_at: timestamp,
      updated_at: timestamp
    });

    // Configuración inscripciones online
    const onlineConfigRef = admin.firestore().collection('payment_config').doc('inscripcion_online');
    batch.set(onlineConfigRef, {
      precio_base: 15000,
      moneda: 'ARS',
      activo: true,
      descuento_temprano: 20,
      created_at: timestamp,
      updated_at: timestamp
    });

    // Configuración inscripciones presenciales
    const presencialConfigRef = admin.firestore().collection('payment_config').doc('inscripcion_presencial');
    batch.set(presencialConfigRef, {
      precio_base: 25000,
      moneda: 'ARS',
      activo: true,
      descuento_temprano: 15,
      created_at: timestamp,
      updated_at: timestamp
    });

    // Configuración de votos
    const votesConfigRef = admin.firestore().collection('payment_config').doc('votes');
    batch.set(votesConfigRef, {
      precio_por_voto: 10,
      paquetes: {
        basico: { votos: 10, precio_vyt: 90 },
        medio: { votos: 50, precio_vyt: 400 },
        premium: { votos: 100, precio_vyt: 700 }
      },
      created_at: timestamp,
      updated_at: timestamp
    });

    // ===== CONFIGURACIÓN GENERAL VYT-MONEY =====
    
    const vytMoneyGeneralRef = admin.firestore().collection('vyt_money_config').doc('general');
    batch.set(vytMoneyGeneralRef, {
      precio_por_100_vyt_money: 100,
      moneda: 'ARS',
      activo: true,
      bonus_primer_compra: 10, // 10% extra en primera compra
      limite_diario_votos: 1000,
      premio_pool_percentage: 80, // 80% del total recaudado va al pozo
      created_at: timestamp,
      updated_at: timestamp
    });

    // ===== CERTÁMENES INICIALES =====
    
    // Certamen Nacional (ejemplo)
    const certamenNacionalRef = admin.firestore().collection('certamenes_provinciales').doc('nacional-2024');
    batch.set(certamenNacionalRef, {
      nombre: 'VYT Music Nacional 2024',
      provincia: 'Nacional',
      precio: 15000,
      activo: true,
      fecha_inicio: new Date('2024-03-01'),
      fecha_fin: new Date('2024-12-31'),
      fecha_limite_inscripcion: new Date('2024-11-30'),
      descripcion: 'Certamen nacional de VYT Music 2024',
      premio_pool: 0,
      total_participantes: 0,
      total_votos: 0,
      categoria: 'nacional',
      tipo: 'online',
      etapa_actual: 'inscripciones',
      etapas: {
        inscripciones: {
          inicio: new Date('2024-03-01'),
          fin: new Date('2024-11-30'),
          activa: true
        },
        votacion: {
          inicio: new Date('2024-12-01'),
          fin: new Date('2024-12-20'),
          activa: false
        },
        final: {
          inicio: new Date('2024-12-21'),
          fin: new Date('2024-12-31'),
          activa: false
        }
      },
      created_at: timestamp,
      updated_at: timestamp
    });

    // ===== CONFIGURACIÓN DEL SISTEMA =====
    
    const systemConfigRef = admin.firestore().collection('system_config').doc('general');
    batch.set(systemConfigRef, {
      site_name: 'VYT Music Online',
      site_url: 'https://vytonlineprueva.web.app',
      contact_email: 'contacto@vytmusic.com',
      social_links: {
        instagram: '@vytmusic',
        youtube: '@vytmusic',
        facebook: 'VYT Music',
        tiktok: '@vytmusic'
      },
      features: {
        registro_abierto: true,
        inscripciones_online: true,
        inscripciones_presencial: true,
        votaciones_activas: true,
        compra_vyt_money: true,
        sistema_moderacion: true
      },
      limites: {
        max_votos_por_dia: 1000,
        max_participaciones_por_usuario: 5,
        min_vyt_money_compra: 100,
        max_vyt_money_compra: 10000
      },
      created_at: timestamp,
      updated_at: timestamp
    });

    // ===== CONFIGURACIÓN DE MODERACIÓN =====
    
    const moderationConfigRef = admin.firestore().collection('moderation_config').doc('general');
    batch.set(moderationConfigRef, {
      auto_moderation: true,
      palabras_prohibidas: [
        'spam', 'fake', 'bot', 'hack', 'cheat'
      ],
      limite_reportes_auto_suspension: 5,
      tiempo_suspension_temporal: 24, // horas
      revision_manual_requerida: true,
      notificar_admins_reportes: true,
      created_at: timestamp,
      updated_at: timestamp
    });

    // ===== ROLES Y PERMISOS =====
    
    const rolesConfigRef = admin.firestore().collection('roles_config').doc('permissions');
    batch.set(rolesConfigRef, {
      roles: {
        admin: {
          name: 'Administrador',
          permissions: ['all'],
          description: 'Acceso completo al sistema'
        },
        moderator: {
          name: 'Moderador',
          permissions: ['moderate_content', 'view_reports', 'manage_users'],
          description: 'Puede moderar contenido y gestionar usuarios'
        },
        artist: {
          name: 'Artista',
          permissions: ['create_profile', 'participate', 'vote'],
          description: 'Puede participar en certámenes y votar'
        },
        fan: {
          name: 'Fan',
          permissions: ['vote', 'comment'],
          description: 'Puede votar y comentar'
        }
      },
      default_role: 'fan',
      created_at: timestamp,
      updated_at: timestamp
    });

    // ===== ESTADÍSTICAS INICIALES =====
    
    const statsRef = admin.firestore().collection('system_stats').doc('general');
    batch.set(statsRef, {
      total_users: 0,
      total_artists: 0,
      total_votes: 0,
      total_vyt_money_circulation: 0,
      total_certamenes: 1,
      total_revenue: 0,
      last_updated: timestamp,
      created_at: timestamp
    });

    // ===== CATEGORÍAS DE CERTÁMENES =====
    
    const categoriasRef = admin.firestore().collection('certamen_categories').doc('principales');
    batch.set(categoriasRef, {
      categorias: {
        pop: { name: 'Pop', color: '#FF6B6B', icon: '🎵' },
        rock: { name: 'Rock', color: '#4ECDC4', icon: '🎸' },
        folk: { name: 'Folklore', color: '#45B7D1', icon: '🪕' },
        urban: { name: 'Urbano', color: '#96CEB4', icon: '🎤' },
        electronic: { name: 'Electrónica', color: '#FFEAA7', icon: '🎛️' },
        jazz: { name: 'Jazz', color: '#DDA0DD', icon: '🎺' },
        blues: { name: 'Blues', color: '#98D8C8', icon: '🎷' },
        country: { name: 'Country', color: '#F7DC6F', icon: '🤠' }
      },
      activas: ['pop', 'rock', 'folk', 'urban'],
      created_at: timestamp,
      updated_at: timestamp
    });

    // Ejecutar batch
    await batch.commit();

    // Crear usuario admin si no existe
    if (!userDoc.exists()) {
      await admin.firestore().collection('users').doc(request.auth.uid).set({
        email: request.auth.token.email,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'VYT',
        userType: 'admin',
        vyt_money_balance: 1000, // Balance inicial de admin
        verified: true,
        created_at: timestamp,
        lastLogin: timestamp,
        profile: {
          avatar: null,
          bio: 'Administrador del sistema VYT Music',
          location: 'Argentina'
        },
        stats: {
          votes_given: 0,
          votes_received: 0,
          competitions_joined: 0,
          total_spent: 0
        }
      });
    }

    return {
      success: true,
      message: 'Estructura de Firestore inicializada correctamente',
      collections_created: [
        'payment_config',
        'vyt_money_config', 
        'certamenes_provinciales',
        'system_config',
        'moderation_config',
        'roles_config',
        'system_stats',
        'certamen_categories'
      ],
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error initializing Firestore structure:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Obtener estadísticas del sistema
 */
const getSystemStats = onCall(async (request) => {
  try {
    const statsDoc = await admin.firestore().collection('system_stats').doc('general').get();
    
    if (!statsDoc.exists()) {
      return {
        total_users: 0,
        total_artists: 0,
        total_votes: 0,
        total_vyt_money_circulation: 0,
        total_certamenes: 0,
        total_revenue: 0,
        message: 'Estadísticas no inicializadas'
      };
    }
    
    return statsDoc.data();
    
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Actualizar estadísticas del sistema
 */
const updateSystemStats = onCall(async (request) => {
  try {
    const batch = admin.firestore().batch();
    
    // Contar usuarios
    const usersSnapshot = await admin.firestore().collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    // Contar artistas
    const artistsSnapshot = await admin.firestore().collection('users').where('userType', '==', 'artist').get();
    const totalArtists = artistsSnapshot.size;
    
    // Contar votos
    const votesSnapshot = await admin.firestore().collection('votes').get();
    const totalVotes = votesSnapshot.size;
    
    // Calcular VYT-MONEY en circulación
    let totalVYTMoney = 0;
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      totalVYTMoney += userData.vyt_money_balance || 0;
    });
    
    // Contar certámenes
    const certamenesSnapshot = await admin.firestore().collection('certamenes_provinciales').get();
    const totalCertamenes = certamenesSnapshot.size;
    
    // Actualizar estadísticas
    const statsRef = admin.firestore().collection('system_stats').doc('general');
    batch.set(statsRef, {
      total_users: totalUsers,
      total_artists: totalArtists,
      total_votes: totalVotes,
      total_vyt_money_circulation: totalVYTMoney,
      total_certamenes: totalCertamenes,
      last_updated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    await batch.commit();
    
    return {
      success: true,
      stats: {
        total_users: totalUsers,
        total_artists: totalArtists,
        total_votes: totalVotes,
        total_vyt_money_circulation: totalVYTMoney,
        total_certamenes: totalCertamenes
      }
    };
    
  } catch (error) {
    console.error('Error updating system stats:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Verificar integridad de la base de datos
 */
const verifyDatabaseIntegrity = onCall(async (request) => {
  try {
    const issues = [];
    
    // Verificar colecciones esenciales
    const essentialCollections = [
      'users', 'payment_config', 'vyt_money_config', 'system_config'
    ];
    
    for (const collection of essentialCollections) {
      const snapshot = await admin.firestore().collection(collection).limit(1).get();
      if (snapshot.empty) {
        issues.push(`Colección '${collection}' está vacía o no existe`);
      }
    }
    
    // Verificar usuarios sin balance VYT-MONEY
    const usersSnapshot = await admin.firestore().collection('users').get();
    let usersWithoutBalance = 0;
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.vyt_money_balance === undefined) {
        usersWithoutBalance++;
      }
    });
    
    if (usersWithoutBalance > 0) {
      issues.push(`${usersWithoutBalance} usuarios sin balance VYT-MONEY inicializado`);
    }
    
    // Verificar configuración de pagos
    const paymentConfigDoc = await admin.firestore().collection('payment_config').doc('vyt_money').get();
    if (!paymentConfigDoc.exists()) {
      issues.push('Configuración de pagos VYT-MONEY no encontrada');
    }
    
    return {
      integrity_check: issues.length === 0 ? 'PASSED' : 'ISSUES_FOUND',
      issues: issues,
      total_issues: issues.length,
      checked_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error verifying database integrity:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = {
  initializeFirestoreStructure,
  getSystemStats,
  updateSystemStats,
  verifyDatabaseIntegrity
};