/**
 * EMAILS MODULE - MINIMAL VERSION FOR TESTING
 * Versión mínima para probar deployment sin dependencias pesadas
 */

const { onCall, onRequest } = require('firebase-functions/v2/https');

// Función de prueba simple
const testEmailFunction = onCall(async (request) => {
  try {
    return {
      success: true,
      message: 'Email module test successful',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Test function error:', error);
    throw new Error('Test function failed');
  }
});

// Función HTTP simple
const healthCheckEmail = onRequest(async (req, res) => {
  res.status(200).json({
    status: 'ok',
    module: 'emails-minimal',
    message: 'Email module is running'
  });
});

// Exportar solo funciones mínimas
module.exports = {
  testEmailFunction,
  healthCheckEmail
};