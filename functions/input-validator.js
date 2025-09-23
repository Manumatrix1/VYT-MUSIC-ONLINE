/**
 * Sistema de Validación y Sanitización para VYT-MUSIC-ONLINE
 * Previene XSS, injection attacks y valida datos de entrada
 */

const validator = require('validator');
const xss = require('xss');

// Configuración de XSS más estricta
const xssOptions = {
    allowList: {
        // Solo permitir tags muy básicos
        'p': [],
        'br': [],
        'strong': [],
        'em': [],
        'span': []
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    css: false, // No permitir CSS inline
    stripBlankChar: true
};

/**
 * Sanitizar string de entrada
 * @param {string} input - String a sanitizar
 * @param {Object} options - Opciones adicionales
 * @returns {string} String sanitizado
 */
function sanitizeString(input, options = {}) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    let sanitized = input;
    
    // Sanitización XSS
    sanitized = xss(sanitized, xssOptions);
    
    // Escape HTML básico
    sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    
    // Remover caracteres peligrosos
    sanitized = sanitized.replace(/[<>&"']/g, '');
    
    // Límite de longitud
    if (options.maxLength) {
        sanitized = sanitized.substring(0, options.maxLength);
    }
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
}

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {Object} Resultado de validación
 */
function validateEmail(email) {
    const result = {
        isValid: false,
        sanitized: '',
        errors: []
    };
    
    if (!email || typeof email !== 'string') {
        result.errors.push('Email es requerido');
        return result;
    }
    
    const sanitized = sanitizeString(email, { maxLength: 100 });
    result.sanitized = sanitized;
    
    if (!validator.isEmail(sanitized)) {
        result.errors.push('Formato de email inválido');
        return result;
    }
    
    // Verificar dominios sospechosos
    const suspiciousDomains = ['tempmail', 'guerrillamail', '10minutemail'];
    const domain = sanitized.split('@')[1];
    
    if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
        result.errors.push('Dominio de email no permitido');
        return result;
    }
    
    result.isValid = true;
    return result;
}

/**
 * Validar nombre de artista
 * @param {string} name - Nombre a validar
 * @returns {Object} Resultado de validación
 */
function validateArtistName(name) {
    const result = {
        isValid: false,
        sanitized: '',
        errors: []
    };
    
    if (!name || typeof name !== 'string') {
        result.errors.push('Nombre de artista es requerido');
        return result;
    }
    
    const sanitized = sanitizeString(name, { maxLength: 50 });
    result.sanitized = sanitized;
    
    if (sanitized.length < 2) {
        result.errors.push('Nombre debe tener al menos 2 caracteres');
        return result;
    }
    
    if (sanitized.length > 50) {
        result.errors.push('Nombre no puede exceder 50 caracteres');
        return result;
    }
    
    // Solo letras, números, espacios y algunos caracteres especiales
    if (!/^[a-zA-ZÀ-ÿ0-9\s\-._']+$/.test(sanitized)) {
        result.errors.push('Nombre contiene caracteres no permitidos');
        return result;
    }
    
    // Verificar palabras prohibidas
    const prohibitedWords = ['admin', 'test', 'null', 'undefined', 'script'];
    const lowerName = sanitized.toLowerCase();
    
    if (prohibitedWords.some(word => lowerName.includes(word))) {
        result.errors.push('Nombre contiene palabras no permitidas');
        return result;
    }
    
    result.isValid = true;
    return result;
}

/**
 * Validar URL de YouTube
 * @param {string} url - URL a validar
 * @returns {Object} Resultado de validación
 */
function validateYouTubeURL(url) {
    const result = {
        isValid: false,
        sanitized: '',
        videoId: null,
        errors: []
    };
    
    if (!url || typeof url !== 'string') {
        result.errors.push('URL de YouTube es requerida');
        return result;
    }
    
    const sanitized = sanitizeString(url, { maxLength: 200 });
    result.sanitized = sanitized;
    
    if (!validator.isURL(sanitized)) {
        result.errors.push('URL inválida');
        return result;
    }
    
    // Verificar que sea de YouTube
    if (!sanitized.includes('youtube.com') && !sanitized.includes('youtu.be')) {
        result.errors.push('Debe ser una URL de YouTube');
        return result;
    }
    
    // Extraer video ID
    const videoIdMatch = sanitized.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    
    if (!videoIdMatch) {
        result.errors.push('URL de YouTube inválida');
        return result;
    }
    
    result.videoId = videoIdMatch[1];
    result.isValid = true;
    return result;
}

/**
 * Validar datos de participante
 * @param {Object} data - Datos del participante
 * @returns {Object} Resultado de validación
 */
function validateParticipantData(data) {
    const result = {
        isValid: false,
        sanitized: {},
        errors: []
    };
    
    if (!data || typeof data !== 'object') {
        result.errors.push('Datos del participante son requeridos');
        return result;
    }
    
    // Validar nombre de artista
    const nameValidation = validateArtistName(data.nombre_artista);
    if (!nameValidation.isValid) {
        result.errors.push(...nameValidation.errors);
    } else {
        result.sanitized.nombre_artista = nameValidation.sanitized;
    }
    
    // Validar email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
        result.errors.push(...emailValidation.errors);
    } else {
        result.sanitized.email = emailValidation.sanitized;
    }
    
    // Validar URL de YouTube
    if (data.youtube_url) {
        const urlValidation = validateYouTubeURL(data.youtube_url);
        if (!urlValidation.isValid) {
            result.errors.push(...urlValidation.errors);
        } else {
            result.sanitized.youtube_url = urlValidation.sanitized;
            result.sanitized.video_id = urlValidation.videoId;
        }
    }
    
    // Validar otros campos opcionales
    if (data.telefono) {
        const phone = sanitizeString(data.telefono, { maxLength: 20 });
        if (!/^[\d\s\+\-\(\)]+$/.test(phone)) {
            result.errors.push('Teléfono contiene caracteres inválidos');
        } else {
            result.sanitized.telefono = phone;
        }
    }
    
    if (data.ciudad) {
        const city = sanitizeString(data.ciudad, { maxLength: 50 });
        if (!/^[a-zA-ZÀ-ÿ\s\-.']+$/.test(city)) {
            result.errors.push('Ciudad contiene caracteres inválidos');
        } else {
            result.sanitized.ciudad = city;
        }
    }
    
    if (data.provincia) {
        const province = sanitizeString(data.provincia, { maxLength: 50 });
        if (!/^[a-zA-ZÀ-ÿ\s\-.']+$/.test(province)) {
            result.errors.push('Provincia contiene caracteres inválidos');
        } else {
            result.sanitized.provincia = province;
        }
    }
    
    // Validar edad
    if (data.edad) {
        const age = parseInt(data.edad);
        if (isNaN(age) || age < 5 || age > 120) {
            result.errors.push('Edad debe estar entre 5 y 120 años');
        } else {
            result.sanitized.edad = age;
        }
    }
    
    result.isValid = result.errors.length === 0;
    return result;
}

/**
 * Validar y sanitizar datos de pago
 * @param {Object} data - Datos del pago
 * @returns {Object} Resultado de validación
 */
function validatePaymentData(data) {
    const result = {
        isValid: false,
        sanitized: {},
        errors: []
    };
    
    if (!data || typeof data !== 'object') {
        result.errors.push('Datos de pago son requeridos');
        return result;
    }
    
    // Validar tipo de pago
    const allowedTypes = ['inscripcion_online', 'inscripcion_presencial', 'vyt_money'];
    if (!allowedTypes.includes(data.type)) {
        result.errors.push('Tipo de pago inválido');
    } else {
        result.sanitized.type = data.type;
    }
    
    // Validar monto
    if (data.amount) {
        const amount = parseFloat(data.amount);
        if (isNaN(amount) || amount <= 0 || amount > 10000) {
            result.errors.push('Monto inválido (debe estar entre 0.01 y 10000)');
        } else {
            result.sanitized.amount = amount;
        }
    }
    
    // Validar currency
    if (data.currency && data.currency !== 'ARS') {
        result.errors.push('Moneda no soportada');
    } else {
        result.sanitized.currency = 'ARS';
    }
    
    result.isValid = result.errors.length === 0;
    return result;
}

/**
 * Detectar posibles ataques de injection
 * @param {string} input - Input a analizar
 * @returns {boolean} True si detecta ataque
 */
function detectInjectionAttack(input) {
    if (!input || typeof input !== 'string') {
        return false;
    }
    
    const maliciousPatterns = [
        // SQL Injection
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
        /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
        /(';|--|\|\||&&)/i,
        
        // XSS
        /<script[\s\S]*?>[\s\S]*?<\/script>/i,
        /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        
        // Command Injection
        /(;|\||\&\&|\|\||`)/,
        /\b(eval|exec|system|shell_exec)\s*\(/i,
        
        // Path Traversal
        /\.\./,
        /(\/etc\/passwd|\/windows\/system32)/i
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(input));
}

module.exports = {
    sanitizeString,
    validateEmail,
    validateArtistName,
    validateYouTubeURL,
    validateParticipantData,
    validatePaymentData,
    detectInjectionAttack,
    xssOptions
};