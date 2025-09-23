/**
 * Sistema de Rate Limiting para VYT-MUSIC-ONLINE
 * Previene ataques DDoS y abuso de APIs
 */

const admin = require('firebase-admin');

// Cache en memoria para tracking de requests
const requestCache = new Map();

// Configuración de límites
const RATE_LIMITS = {
    // Acciones críticas (pagos, votaciones)
    critical: {
        windowMs: 60000, // 1 minuto
        maxRequests: 5,  // 5 requests por minuto
        blockDuration: 300000 // 5 minutos de bloqueo
    },
    // Autenticación
    auth: {
        windowMs: 300000, // 5 minutos
        maxRequests: 10,  // 10 intentos por 5 minutos
        blockDuration: 900000 // 15 minutos de bloqueo
    },
    // APIs generales
    general: {
        windowMs: 60000, // 1 minuto
        maxRequests: 30, // 30 requests por minuto
        blockDuration: 60000 // 1 minuto de bloqueo
    },
    // Subida de contenido
    upload: {
        windowMs: 300000, // 5 minutos
        maxRequests: 3,   // 3 subidas por 5 minutos
        blockDuration: 600000 // 10 minutos de bloqueo
    }
};

/**
 * Middleware de Rate Limiting
 * @param {string} type - Tipo de límite (critical, auth, general, upload)
 * @param {string} identifier - Identificador único (IP, UID, etc.)
 * @returns {Object} Estado del rate limiting
 */
function checkRateLimit(type, identifier) {
    const now = Date.now();
    const config = RATE_LIMITS[type] || RATE_LIMITS.general;
    const key = `${type}:${identifier}`;
    
    // Obtener datos del cache
    let userData = requestCache.get(key);
    
    if (!userData) {
        userData = {
            requests: [],
            blockedUntil: null
        };
    }
    
    // Verificar si está bloqueado
    if (userData.blockedUntil && now < userData.blockedUntil) {
        return {
            allowed: false,
            blocked: true,
            blockedUntil: userData.blockedUntil,
            message: 'Demasiados intentos. Inténtelo más tarde.',
            retryAfter: Math.ceil((userData.blockedUntil - now) / 1000)
        };
    }
    
    // Limpiar requests antiguos
    userData.requests = userData.requests.filter(
        timestamp => now - timestamp < config.windowMs
    );
    
    // Verificar límite
    if (userData.requests.length >= config.maxRequests) {
        userData.blockedUntil = now + config.blockDuration;
        requestCache.set(key, userData);
        
        // Log del bloqueo
        console.warn(`Rate limit exceeded for ${key}. Blocked until ${new Date(userData.blockedUntil)}`);
        
        return {
            allowed: false,
            blocked: true,
            blockedUntil: userData.blockedUntil,
            message: 'Límite de requests excedido. Usuario bloqueado temporalmente.',
            retryAfter: Math.ceil(config.blockDuration / 1000)
        };
    }
    
    // Agregar request actual
    userData.requests.push(now);
    userData.blockedUntil = null;
    requestCache.set(key, userData);
    
    return {
        allowed: true,
        blocked: false,
        remaining: config.maxRequests - userData.requests.length,
        resetTime: now + config.windowMs
    };
}

/**
 * Obtener identificador único del request
 * @param {Object} request - Request de Firebase Function
 * @returns {string} Identificador único
 */
function getRequestIdentifier(request) {
    // Preferir UID de usuario autenticado
    if (request.auth && request.auth.uid) {
        return `uid:${request.auth.uid}`;
    }
    
    // Fallback a IP (si está disponible)
    const ip = request.rawRequest?.ip || 
               request.rawRequest?.connection?.remoteAddress ||
               'unknown';
    
    return `ip:${ip}`;
}

/**
 * Wrapper para aplicar rate limiting a Cloud Functions
 * @param {string} type - Tipo de límite
 * @param {Function} handler - Función original
 * @returns {Function} Función con rate limiting aplicado
 */
function withRateLimit(type, handler) {
    return async (request, response) => {
        try {
            const identifier = getRequestIdentifier(request);
            const limitResult = checkRateLimit(type, identifier);
            
            if (!limitResult.allowed) {
                console.warn(`Rate limit blocked request from ${identifier} for ${type}`);
                
                // Headers de rate limiting
                response.set({
                    'X-RateLimit-Limit': RATE_LIMITS[type].maxRequests,
                    'X-RateLimit-Remaining': 0,
                    'X-RateLimit-Reset': limitResult.blockedUntil,
                    'Retry-After': limitResult.retryAfter
                });
                
                return response.status(429).json({
                    error: 'Too Many Requests',
                    message: limitResult.message,
                    retryAfter: limitResult.retryAfter,
                    type: 'RATE_LIMIT_EXCEEDED'
                });
            }
            
            // Headers informativos
            response.set({
                'X-RateLimit-Limit': RATE_LIMITS[type].maxRequests,
                'X-RateLimit-Remaining': limitResult.remaining,
                'X-RateLimit-Reset': limitResult.resetTime
            });
            
            // Ejecutar función original
            return await handler(request, response);
            
        } catch (error) {
            console.error('Rate limiter error:', error);
            // En caso de error, permitir el request para no romper funcionalidad
            return await handler(request, response);
        }
    };
}

/**
 * Limpiar cache periódicamente para liberar memoria
 */
function cleanupCache() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hora
    
    for (const [key, userData] of requestCache.entries()) {
        // Eliminar entradas muy antiguas
        if (userData.blockedUntil && now > userData.blockedUntil + maxAge) {
            requestCache.delete(key);
        }
        
        // Eliminar entradas sin bloqueo y sin requests recientes
        if (!userData.blockedUntil && userData.requests.length === 0) {
            requestCache.delete(key);
        }
        
        // Limpiar requests antiguos
        userData.requests = userData.requests.filter(
            timestamp => now - timestamp < maxAge
        );
    }
}

// Limpiar cache cada 15 minutos
setInterval(cleanupCache, 900000);

/**
 * Obtener estadísticas de rate limiting
 * @returns {Object} Estadísticas del sistema
 */
function getRateLimitStats() {
    const stats = {
        totalEntries: requestCache.size,
        blockedUsers: 0,
        activeUsers: 0,
        cacheSize: requestCache.size
    };
    
    const now = Date.now();
    
    for (const [key, userData] of requestCache.entries()) {
        if (userData.blockedUntil && now < userData.blockedUntil) {
            stats.blockedUsers++;
        } else {
            stats.activeUsers++;
        }
    }
    
    return stats;
}

module.exports = {
    checkRateLimit,
    withRateLimit,
    getRequestIdentifier,
    getRateLimitStats,
    RATE_LIMITS
};