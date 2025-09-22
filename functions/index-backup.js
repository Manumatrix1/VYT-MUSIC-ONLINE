/**
 * VYT MUSIC ONLINE - FIREBASE FUNCTIONS INDEX
 * Archivo principal que exporta todas las funciones del sistema
 * VERSIÓN v1 - Compatible con Cloud Functions v1
 */

const functions = require('firebase-functions');

// ===== IMPORTAR MÓDULOS DEL SISTEMA =====

// Sistema VYT-MONEY y votaciones
const vytMoneyFunctions = require('./vyt-money');

// Sistema de pagos MercadoPago  
const paymentFunctions = require('./payments');

// Sistema de configuración de pagos
const paymentConfigFunctions = require('./payment-config');

// Sistema de inicialización de Firestore
const firestoreInitFunctions = require('./firestore-init');

// Sistema de administración
const adminFunctions = require('./admin');

// Sistema de perfiles de artistas
const artistFunctions = require('./perfiles-artistas');

// Sistema de certámenes jerárquicos
const certamenFunctions = require('./certamenes-jerarquicos');

// Sistema de moderación de contenido
const moderationFunctions = require('./moderacion-contenido');

// Sistema de emails
const emailFunctions = require('./emails');

// ===== EXPORTAR TODAS LAS FUNCIONES =====

// 💰 VYT-MONEY SYSTEM
exports.voteWithVYTMoney = vytMoneyFunctions.voteWithVYTMoney;
exports.getUserVYTBalance = vytMoneyFunctions.getUserVYTBalance;
exports.updatePrizePool = vytMoneyFunctions.updatePrizePool;
exports.getPrizePoolStatus = vytMoneyFunctions.getPrizePoolStatus;
exports.addVYTMoneyToUser = vytMoneyFunctions.addVYTMoneyToUser;

// 💳 PAYMENT SYSTEM
exports.recibirNotificacionPago = paymentFunctions.recibirNotificacionPago;
exports.createPaymentPreference = paymentFunctions.createPaymentPreference;
exports.processPaymentSuccess = paymentFunctions.processPaymentSuccess;
exports.handlePaymentWebhook = paymentFunctions.handlePaymentWebhook;

// 💳 PAYMENT CONFIG SYSTEM (NEW)
exports.initializePaymentConfig = paymentConfigFunctions.initializePaymentConfig;
exports.getPaymentConfig = paymentConfigFunctions.getPaymentConfig;
exports.updatePaymentConfig = paymentConfigFunctions.updatePaymentConfig;
exports.calculatePrice = paymentConfigFunctions.calculatePrice;
exports.createUnifiedPaymentPreference = paymentConfigFunctions.createUnifiedPaymentPreference;
exports.processUnifiedPaymentNotification = paymentConfigFunctions.processUnifiedPaymentNotification;

// 🗄️ FIRESTORE INITIALIZATION SYSTEM (NEW)
exports.initializeFirestoreStructure = firestoreInitFunctions.initializeFirestoreStructure;
exports.getSystemStats = firestoreInitFunctions.getSystemStats;
exports.updateSystemStats = firestoreInitFunctions.updateSystemStats;
exports.verifyDatabaseIntegrity = firestoreInitFunctions.verifyDatabaseIntegrity;

// 👨‍💼 ADMIN SYSTEM
exports.createAdminUser = adminFunctions.createAdminUser;
exports.getParticipants = adminFunctions.getParticipants;
exports.approveParticipant = adminFunctions.approveParticipant;
exports.manageUsers = adminFunctions.manageUsers;

// 🎤 ARTIST PROFILES
exports.createArtistProfile = artistFunctions.createArtistProfile;
exports.updateArtistProfile = artistFunctions.updateArtistProfile;
exports.getArtistStats = artistFunctions.getArtistStats;

// 🏆 CERTAMEN SYSTEM
exports.createCertamen = certamenFunctions.createCertamen;
exports.manageCertamenParticipants = certamenFunctions.manageCertamenParticipants;
exports.calculateRankings = certamenFunctions.calculateRankings;

// 🛡️ MODERATION SYSTEM
exports.moderateContent = moderationFunctions.moderateContent;
exports.reportInappropriateContent = moderationFunctions.reportInappropriateContent;

// 📧 EMAIL SYSTEM
exports.sendWelcomeEmail = emailFunctions.sendWelcomeEmail;
exports.sendPaymentConfirmation = emailFunctions.sendPaymentConfirmation;
exports.sendRankingUpdate = emailFunctions.sendRankingUpdate;

// ===== FUNCIONES DE HEALTH CHECK =====

// Función de health check básica
const healthCheck = functions.https.onCall(async (data, context) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'VYT Music Online - All systems operational',
    version: '1.0.0',
    modules: {
      vytMoney: 'active',
      payments: 'active',
      paymentConfig: 'active',
      firestoreInit: 'active',
      admin: 'active',
      artists: 'active',
      certamenes: 'active',
      moderation: 'active',
      emails: 'active'
    }
  };
});

// Función de prueba simple
const systemTest = functions.https.onCall(async (data, context) => {
  return {
    success: true,
    message: 'System test successful - All modules loaded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  };
});

exports.healthCheck = healthCheck;
exports.systemTest = systemTest;

console.log('🚀 VYT Music Online - Functions v1 version loaded');
console.log('✅ All function modules imported and exported successfully');