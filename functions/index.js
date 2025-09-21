/**
 * VYT MUSIC ONLINE - FIREBASE FUNCTIONS INDEX (DEBUG VERSION)
 * Versión de debug para resolver problemas de healthcheck
 */

const { onCall, onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

// Configuración de región global
setGlobalOptions({ region: "us-central1" });

// Función de prueba simple
const debugTest = onCall(async (request) => {
  return {
    success: true,
    message: 'Debug test successful',
    timestamp: new Date().toISOString()
  };
});

// Función HTTP simple
const debugHttp = onRequest(async (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Debug HTTP successful'
  });
});

// Función de health check básica
const healthCheck = onCall(async (request) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'System is operational'
  };
});

// Exportar funciones de debug
exports.debugTest = debugTest;
exports.debugHttp = debugHttp;
exports.healthCheck = healthCheck;

console.log('VYT Music Online - Debug version loaded');
console.log('Testing minimal functions to resolve healthcheck issues');