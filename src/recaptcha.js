/**
 * ================================================================
 * VYT MUSIC - Google reCAPTCHA v3
 * Protección contra bots en formularios
 * Fecha: 9 de Enero 2026
 * ================================================================
 */

// Configuración reCAPTCHA v3
// TODO: Reemplazar con tu Site Key real
const RECAPTCHA_SITE_KEY = '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// Cargar reCAPTCHA v3 dinámicamente
(function() {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    document.head.appendChild(script);
})();

// API Principal
  // ================================================================
  // CONFIGURACIÓN RECAPTCHA V3
  // ================================================================
  
  // Función para ejecutar reCAPTCHA y obtener token
  async function executeRecaptcha(action) {
    try {
      const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: action });
      return token;
    } catch (error) {
      console.error('Error ejecutando reCAPTCHA:', error);
      return null;
    }
  }

  // ================================================================
  // FUNCIONES DE VALIDACIÓN POR FORMULARIO
  // ================================================================

  // Validar formulario de login
  window.validateLoginForm = async function(event) {
    event.preventDefault();
    
    const token = await executeRecaptcha('login');
    if (!token) {
      showNotification('Error de seguridad. Por favor, intenta nuevamente.', 'error');
      return false;
    }
    
    // Agregar token al formulario
    const form = event.target;
    let tokenInput = form.querySelector('input[name="recaptcha_token"]');
    if (!tokenInput) {
      tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'recaptcha_token';
      form.appendChild(tokenInput);
    }
    tokenInput.value = token;
    
    return true;
  };

  // Validar formulario de registro
  window.validateRegisterForm = async function(event) {
    event.preventDefault();
    
    const token = await executeRecaptcha('register');
    if (!token) {
      showNotification('Error de seguridad. Por favor, intenta nuevamente.', 'error');
      return false;
    }
    
    // Agregar token al formulario
    const form = event.target;
    let tokenInput = form.querySelector('input[name="recaptcha_token"]');
    if (!tokenInput) {
      tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'recaptcha_token';
      form.appendChild(tokenInput);
    }
    tokenInput.value = token;
    
    return true;
  };

  // Validar formulario de inscripción
  window.validateInscriptionForm = async function(event) {
    event.preventDefault();
    
    const token = await executeRecaptcha('inscription');
    if (!token) {
      showNotification('Error de seguridad. Por favor, intenta nuevamente.', 'error');
      return false;
    }
    
    // Agregar token al formulario
    const form = event.target;
    let tokenInput = form.querySelector('input[name="recaptcha_token"]');
    if (!tokenInput) {
      tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'recaptcha_token';
      form.appendChild(tokenInput);
    }
    tokenInput.value = token;
    
    return true;
  };

  // Validar formulario de contacto
  window.validateContactForm = async function(event) {
    event.preventDefault();
    
    const token = await executeRecaptcha('contact');
    if (!token) {
      showNotification('Error de seguridad. Por favor, intenta nuevamente.', 'error');
      return false;
    }
    
    const form = event.target;
    let tokenInput = form.querySelector('input[name="recaptcha_token"]');
    if (!tokenInput) {
      tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'recaptcha_token';
      form.appendChild(tokenInput);
    }
    tokenInput.value = token;
    
    return true;
  };

  // ================================================================
  // FUNCIÓN GENÉRICA PARA CUALQUIER ACCIÓN
  // ================================================================
  
  window.getRecaptchaToken = async function(action) {
    return await executeRecaptcha(action);
  };

  // ================================================================
  // INTEGRACIÓN CON FIREBASE FUNCTIONS
  // ================================================================
  
  // Ejemplo de uso con Firebase Functions
  window.submitFormWithRecaptcha = async function(formData, functionName, action = 'submit') {
    // Obtener token de reCAPTCHA
    const token = await executeRecaptcha(action);
    
    if (!token) {
      throw new Error('No se pudo obtener el token de reCAPTCHA');
    }
    
    // Agregar token a los datos
    formData.recaptcha_token = token;
    
    // Llamar a Firebase Function
    try {
      const result = await firebase.functions().httpsCallable(functionName)(formData);
      return result.data;
    } catch (error) {
      console.error('Error en función:', error);
      throw error;
    }
  };

  // ================================================================
  // BACKEND VALIDATION (Para Firebase Functions)
  // ================================================================
  
  /**
   * CÓDIGO PARA FIREBASE FUNCTIONS (functions/index.js):
   * 
   * const axios = require('axios');
   * 
   * async function verifyRecaptcha(token) {
   *   const secretKey = 'TU_SECRET_KEY_AQUI';
   *   
   *   try {
   *     const response = await axios.post(
   *       `https://www.google.com/recaptcha/api/siteverify`,
   *       null,
   *       {
   *         params: {
   *           secret: secretKey,
   *           response: token
   *         }
   *       }
   *     );
   *     
   *     return response.data.success && response.data.score >= 0.5;
   *   } catch (error) {
   *     console.error('Error verificando reCAPTCHA:', error);
   *     return false;
   *   }
   * }
   * 
   * // Usar en tus functions:
   * exports.miFunction = functions.https.onCall(async (data, context) => {
   *   const isValid = await verifyRecaptcha(data.recaptcha_token);
   *   
   *   if (!isValid) {
   *     throw new functions.https.HttpsError('permission-denied', 'reCAPTCHA validation failed');
   *   }
   *   
   *   // Continuar con la lógica...
   * });
   */

  console.log('✅ reCAPTCHA v3 inicializado');

/**
 * ================================================================
 * INSTRUCCIONES DE IMPLEMENTACIÓN:
 * 
 * 1. Obtener claves de reCAPTCHA v3:
 *    https://www.google.com/recaptcha/admin/create
 * 
 * 2. Reemplazar las XXXXX con tus claves reales
 * 
 * 3. Agregar en formularios:
 *    <form onsubmit="return validateLoginForm(event)">
 * 
 * 4. Instalar axios en functions:
 *    cd functions
 *    npm install axios
 * 
 * 5. Agregar validación backend en Firebase Functions
 * 
 * 6. Monitorear en Google reCAPTCHA Admin Console
 * 
 * ================================================================
 */
