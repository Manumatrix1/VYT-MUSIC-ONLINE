/**
 * VYT MUSIC ONLINE - FIREBASE FUNCTIONS INDEX (MODULAR ARCHITECTURE)
 * Archivo principal que importa y re-exporta funciones d// 👨‍💼 FUNCIONES ADMINISTRATIVAS (8 funciones) - HABILITADO
exports.sendApprovalEmailAdmin = adminModule.sendApprovalEmail;
exports.sendRejectionEmailAdmin = adminModule.sendRejectionEmail;
exports.sendApprovalEmailHttp = adminModule.sendApprovalEmailHttp;
exports.sendRejectionEmailHttp = adminModule.sendRejectionEmailHttp;
exports.sendProfessionalRejectionEmail = adminModule.sendProfessionalRejectionEmail;
exports.getParticipantStats = adminModule.getParticipantStats;
exports.getPendingParticipants = adminModule.getPendingParticipants;
exports.updateParticipantStatus = adminModule.updateParticipantStatus;

// 💰 FUNCIONES DE VYT-MONEY Y POZO (8 funciones) - HABILITADO  
exports.voteWithVYTMoney = vytMoneyModule.voteWithVYTMoney;
exports.getVYTMoneyBalance = vytMoneyModule.getVYTMoneyBalance;
exports.configureVYTMoney = vytMoneyModule.configureVYTMoney;
exports.getPrizePoolStatus = vytMoneyModule.getPrizePoolStatus;
exports.contributeToPrizePool = vytMoneyModule.contributeToPrizePool;
exports.configurePrizePool = vytMoneyModule.configurePrizePool;
exports.getPrizePoolLeaderboard = vytMoneyModule.getPrizePoolLeaderboard;
exports.sendVYTMoneyPurchaseConfirmation = vytMoneyModule.sendVYTMoneyPurchaseConfirmation;
// exports.onPrizePoolUpdate = vytMoneyModule.onPrizePoolUpdate; // Comentado por problemas de deployment especializados
 * Refactorizado para resolver problemas de rendimiento y mantenibilidad
 */

const functions = require("firebase-functions");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

// ===== CONFIGURACIÓN GLOBAL =====

// Define environment variables
const gmailEmail = defineString("GMAIL_EMAIL");
const gmailPassword = defineString("GMAIL_PASSWORD");
const mercadopagoToken = defineString("MERCADOPAGO_TOKEN");
const siteUrl = defineString("SITE_URL", { default: "https://vytonlineprueva.web.app" });

// YouTube API configuration (COMENTADO PARA DEPLOYMENT)
/*
const youtubeClientId = defineSecret("YOUTUBE_CLIENT_ID");
const youtubeClientSecret = defineSecret("YOUTUBE_CLIENT_SECRET");
const youtubeRefreshToken = defineSecret("YOUTUBE_REFRESH_TOKEN");
*/

// Configuración de región global
setGlobalOptions({ region: "us-central1" });

// Inicializar Firebase Admin
admin.initializeApp();

// ===== IMPORTACIÓN DE MÓDULOS ESPECIALIZADOS =====

// Módulo de emails automatizados (versión optimizada)
const emailsModule = require('./emails-optimized');

// Módulo de pagos con MercadoPago (habilitado para testing)
const paymentsModule = require('./payments');

// Módulo de gestión de YouTube (placeholder)
const youtubeModule = require('./youtube');

// Módulo de sistema VYT-Money y pozo de premios
const vytMoneyModule = require('./vyt-money');

// Módulo de administración
const adminModule = require('./admin');

// Módulos temporalmente comentados para troubleshooting
/*
// Módulo de pagos con MercadoPago
const paymentsModule = require('./payments');

// Módulo de gestión de YouTube
const youtubeModule = require('./youtube');

// Módulo de sistema VYT-Money y pozo de premios
const vytMoneyModule = require('./vyt-money');

// Módulo de administración
const adminModule = require('./admin');
*/

// Módulos adicionales (temporalmente comentados para deployment)
// const perfilesArtistas = require('./perfiles-artistas');
// const moderacionContenido = require('./moderacion-contenido');
// const paymentsSystem = require('./payments-system');
// const comentariosModerados = require('./comentarios-moderados');

// Importar funciones de certámenes jerárquicos (temporalmente comentado)
// const certamenesJerarquicos = require('./certamenes-jerarquicos');

// ===== CONSTANTES DEL SISTEMA =====

// Estados de participantes
const PARTICIPANT_STATES = {
  PENDING_INITIAL_REVIEW: 'pending_initial_review',           // Video inicial recibido, pendiente de revisión
  INITIAL_APPROVED: 'initial_approved',                       // Video inicial aprobado, esperando pago y video final
  INITIAL_REJECTED: 'initial_rejected',                       // Video inicial rechazado
  PAYMENT_PENDING: 'payment_pending',                         // Aprobado inicial, esperando pago
  PAYMENT_CONFIRMED: 'payment_confirmed',                     // Pago confirmado, esperando video final
  FINAL_VIDEO_RECEIVED: 'final_video_received',               // Video final recibido, pendiente de aprobación final
  FINAL_APPROVED: 'final_approved',                           // Video final aprobado, listo para publicación
  FINAL_REJECTED: 'final_rejected',                           // Video final rechazado
  PUBLISHED: 'published',                                     // Video publicado en YouTube y web
  DISQUALIFIED: 'disqualified'                               // Descalificado por cualquier motivo
};

// Razones de rechazo
const REJECTION_REASONS = {
  POOR_AUDIO_QUALITY: 'poor_audio_quality',
  POOR_VIDEO_QUALITY: 'poor_video_quality',
  LOW_PRODUCTION: 'low_production',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  TECHNICAL_ISSUES: 'technical_issues',
  DOES_NOT_MEET_REQUIREMENTS: 'does_not_meet_requirements',
  OTHER: 'other'
};

// ===== RE-EXPORTACIÓN DE FUNCIONES DE MÓDULOS =====

// 📧 FUNCIONES DE EMAILS (10 funciones - versión completa restaurada)
exports.enviarCorreoInscripcionOnline = emailsModule.enviarCorreoInscripcionOnline;
exports.enviarCorreoInscripcionPresencial = emailsModule.enviarCorreoInscripcionPresencial;
exports.enviarCorreoAprobacion = emailsModule.enviarCorreoAprobacion;
exports.enviarCorreoAprobacionPresencial = emailsModule.enviarCorreoAprobacionPresencial;
exports.enviarCorreoRechazo = emailsModule.enviarCorreoRechazo;
exports.sendApprovalEmail = emailsModule.sendApprovalEmail;
exports.sendRejectionEmail = emailsModule.sendRejectionEmail;
exports.sendApprovalEmailHttp = emailsModule.sendApprovalEmailHttp;
exports.sendRejectionEmailHttp = emailsModule.sendRejectionEmailHttp;
exports.sendProfessionalRejectionEmail = emailsModule.sendProfessionalRejectionEmail;

// 💳 FUNCIONES DE PAGOS (6 funciones) - HABILITADO PARA TESTING
exports.recibirNotificacionPago = paymentsModule.recibirNotificacionPago;
exports.getPricingConfig = paymentsModule.getPricingConfig;
exports.createInscripcionOnlinePayment = paymentsModule.createInscripcionOnlinePayment;
exports.createInscripcionPresencialPayment = paymentsModule.createInscripcionPresencialPayment;
exports.createVYTMoneyPayment = paymentsModule.createVYTMoneyPayment;
exports.processPaymentNotification = paymentsModule.processPaymentNotification;

// 🎥 FUNCIONES DE YOUTUBE (7 funciones) - PLACEHOLDER HABILITADO
exports.getYouTubeVideo = youtubeModule.getYouTubeVideo;
exports.updateYouTubeVideo = youtubeModule.updateYouTubeVideo;
exports.deleteYouTubeVideo = youtubeModule.deleteYouTubeVideo;
exports.getAllYouTubeVideos = youtubeModule.getAllYouTubeVideos;
exports.processInitialVideo = youtubeModule.processInitialVideo;
exports.processPaymentAndFinalVideo = youtubeModule.processPaymentAndFinalVideo;
exports.processFinalApproval = youtubeModule.processFinalApproval;

// ‍💼 FUNCIONES ADMINISTRATIVAS (8 funciones) - HABILITADO
exports.sendApprovalEmailAdmin = adminModule.sendApprovalEmail;
exports.sendRejectionEmailAdmin = adminModule.sendRejectionEmail;
exports.sendApprovalEmailHttp = adminModule.sendApprovalEmailHttp;
exports.sendRejectionEmailHttp = adminModule.sendRejectionEmailHttp;
exports.sendProfessionalRejectionEmail = adminModule.sendProfessionalRejectionEmail;
exports.getParticipantStats = adminModule.getParticipantStats;
exports.getPendingParticipants = adminModule.getPendingParticipants;
exports.updateParticipantStatus = adminModule.updateParticipantStatus;

// 💰 FUNCIONES DE VYT-MONEY Y POZO (8 funciones) - HABILITADO
exports.voteWithVYTMoney = vytMoneyModule.voteWithVYTMoney;
exports.getVYTMoneyBalance = vytMoneyModule.getVYTMoneyBalance;
exports.configureVYTMoney = vytMoneyModule.configureVYTMoney;
exports.getPrizePoolStatus = vytMoneyModule.getPrizePoolStatus;
exports.contributeToPrizePool = vytMoneyModule.contributeToPrizePool;
exports.configurePrizePool = vytMoneyModule.configurePrizePool;
exports.getPrizePoolLeaderboard = vytMoneyModule.getPrizePoolLeaderboard;
exports.sendVYTMoneyPurchaseConfirmation = vytMoneyModule.sendVYTMoneyPurchaseConfirmation;
// exports.onPrizePoolUpdate = vytMoneyModule.onPrizePoolUpdate; // Comentado temporalmente

// ===== FUNCIONES CORE MANTENIDAS EN INDEX =====

/**
 * Función de utilidad para verificar estado del sistema
 */
exports.healthCheck = onCall(async (request) => {
  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      modules: {
        emails: 'loaded',
        payments: 'loaded',
        youtube: 'placeholder (functional)',
        vytMoney: 'loaded',
        admin: 'loaded'
      },
      participant_states: Object.keys(PARTICIPANT_STATES).length,
      rejection_reasons: Object.keys(REJECTION_REASONS).length,
      message: 'VYT Music Online system is running correctly'
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

/**
 * Función para obtener información del sistema
 */
exports.getSystemInfo = onCall(async (request) => {
  try {
    const db = admin.firestore();
    
    // Obtener estadísticas básicas
    const participantesOnline = await db.collection('participantes_online').get();
    const participantesPresencial = await db.collection('participantes_presenciales').get();
    const users = await db.collection('users').get();
    
    return {
      success: true,
      info: {
        totalParticipantesOnline: participantesOnline.size,
        totalParticipantesPresencial: participantesPresencial.size,
        totalUsers: users.size,
        lastUpdated: new Date().toISOString(),
        moduleArchitecture: 'modular',
        version: '2.0.0'
      }
    };
    
  } catch (error) {
    console.error('Error getting system info:', error);
    return { success: false, error: error.message };
  }
});

// ===== EXPORTACIONES DE CERTÁMENES JERÁRQUICOS =====
// (Temporalmente comentado para deployment - descomentar cuando esté listo)
/*
exports.createCertamenJerarquico = certamenesJerarquicos.createCertamenJerarquico;
exports.createRanking = certamenesJerarquicos.createRanking;
exports.votarEnCertamenJerarquico = certamenesJerarquicos.votarEnCertamenJerarquico;
exports.createEvaluacionJurado = certamenesJerarquicos.createEvaluacionJurado;
exports.evaluarParticipante = certamenesJerarquicos.evaluarParticipante;
exports.promoverGanadores = certamenesJerarquicos.promoverGanadores;
exports.getEstructuraCertamenes = certamenesJerarquicos.getEstructuraCertamenes;
exports.getEstadoPozo = certamenesJerarquicos.getEstadoPozo;
exports.getRankingCategoria = certamenesJerarquicos.getRankingCategoria;
*/

// ===== EXPORTAR CONSTANTES PARA USO EXTERNO =====
exports.PARTICIPANT_STATES = PARTICIPANT_STATES;
exports.REJECTION_REASONS = REJECTION_REASONS;

console.log('VYT Music Online - Firebase Functions initialized with modular architecture');
console.log(`Loaded modules: emails-optimized, payments, youtube-placeholder, vyt-money, admin`);
console.log(`Total functions exported: 38+ (OPTIMIZED MODULAR ARCHITECTURE)`);
console.log(`Architecture: Modular (TIMEOUT ISSUES RESOLVED)`);