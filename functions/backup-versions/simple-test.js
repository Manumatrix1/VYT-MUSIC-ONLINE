/**
 * SIMPLE TEST - MINIMAL FUNCTIONS FOR DEBUGGING HEALTHCHECK ISSUES
 * Testing minimal functions to identify healthcheck problems
 */

const { onCall, onRequest } = require('firebase-functions/v2/https');

// Función de prueba ultra simple
const simpleTest = onCall(async (request) => {
  return {
    success: true,
    message: 'Simple test working',
    timestamp: new Date().toISOString()
  };
});

// Función HTTP simple
const simpleHttp = onRequest(async (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Simple HTTP test working'
  });
});

// Exportar solo funciones básicas
module.exports = {
  simpleTest,
  simpleHttp
};