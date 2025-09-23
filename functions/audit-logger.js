/**
 * Sistema de Audit y Logging para VYT-MUSIC-ONLINE
 * Registra actividades críticas y mantiene logs de seguridad
 */

const admin = require('firebase-admin');

// Inicializar Firestore si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Tipos de eventos de audit
const AUDIT_EVENTS = {
    // Autenticación
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_CREATED: 'user_created',
    ADMIN_CREATED: 'admin_created',
    AUTH_FAILED: 'auth_failed',
    
    // Pagos
    PAYMENT_CREATED: 'payment_created',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',
    PAYMENT_REFUNDED: 'payment_refunded',
    
    // Contenido
    VIDEO_UPLOADED: 'video_uploaded',
    VIDEO_APPROVED: 'video_approved',
    VIDEO_REJECTED: 'video_rejected',
    CONTENT_MODERATED: 'content_moderated',
    
    // Administración
    ADMIN_ACTION: 'admin_action',
    USER_BANNED: 'user_banned',
    USER_UNBANNED: 'user_unbanned',
    CONFIG_CHANGED: 'config_changed',
    
    // Seguridad
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    SECURITY_BREACH_ATTEMPT: 'security_breach_attempt',
    
    // Sistema
    SYSTEM_ERROR: 'system_error',
    BACKUP_CREATED: 'backup_created',
    BACKUP_RESTORED: 'backup_restored'
};

// Niveles de severidad
const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Registrar evento de audit
 * @param {string} eventType - Tipo de evento (usar AUDIT_EVENTS)
 * @param {Object} data - Datos del evento
 * @param {Object} context - Contexto del request (opcional)
 * @returns {Promise<string>} ID del log creado
 */
async function logAuditEvent(eventType, data, context = null) {
    try {
        const timestamp = new Date();
        
        // Obtener información del usuario si está disponible
        let userInfo = null;
        if (context && context.auth) {
            userInfo = {
                uid: context.auth.uid,
                email: context.auth.token.email || null,
                role: context.auth.token.admin ? 'admin' : 'user'
            };
        }
        
        // Obtener IP si está disponible
        let clientInfo = null;
        if (context && context.rawRequest) {
            clientInfo = {
                ip: context.rawRequest.ip || 
                    context.rawRequest.connection?.remoteAddress || 
                    'unknown',
                userAgent: context.rawRequest.headers?.['user-agent'] || 'unknown'
            };
        }
        
        // Determinar severidad basado en el tipo de evento
        const severity = getSeverityForEvent(eventType);
        
        const auditLog = {
            eventType,
            severity,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            timestampISO: timestamp.toISOString(),
            data: data || {},
            userInfo,
            clientInfo,
            session: {
                id: generateSessionId(),
                timestamp: timestamp.getTime()
            }
        };
        
        // Guardar en colección de audit
        const docRef = await db.collection('audit_logs').add(auditLog);
        
        // Log crítico también en consola
        if (severity === SEVERITY_LEVELS.CRITICAL || severity === SEVERITY_LEVELS.HIGH) {
            console.warn(`🚨 AUDIT [${severity.toUpperCase()}]: ${eventType}`, {
                id: docRef.id,
                user: userInfo?.email || 'anonymous',
                data: JSON.stringify(data)
            });
        }
        
        return docRef.id;
        
    } catch (error) {
        console.error('Error logging audit event:', error);
        // Intentar guardar en backup logger
        await fallbackLogger(eventType, data, error);
        throw error;
    }
}

/**
 * Determinar severidad basado en el tipo de evento
 * @param {string} eventType - Tipo de evento
 * @returns {string} Nivel de severidad
 */
function getSeverityForEvent(eventType) {
    const criticalEvents = [
        AUDIT_EVENTS.SECURITY_BREACH_ATTEMPT,
        AUDIT_EVENTS.ADMIN_CREATED,
        AUDIT_EVENTS.USER_BANNED,
        AUDIT_EVENTS.CONFIG_CHANGED
    ];
    
    const highEvents = [
        AUDIT_EVENTS.PAYMENT_FAILED,
        AUDIT_EVENTS.RATE_LIMIT_EXCEEDED,
        AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
        AUDIT_EVENTS.SYSTEM_ERROR
    ];
    
    const mediumEvents = [
        AUDIT_EVENTS.AUTH_FAILED,
        AUDIT_EVENTS.VIDEO_REJECTED,
        AUDIT_EVENTS.CONTENT_MODERATED,
        AUDIT_EVENTS.ADMIN_ACTION
    ];
    
    if (criticalEvents.includes(eventType)) return SEVERITY_LEVELS.CRITICAL;
    if (highEvents.includes(eventType)) return SEVERITY_LEVELS.HIGH;
    if (mediumEvents.includes(eventType)) return SEVERITY_LEVELS.MEDIUM;
    
    return SEVERITY_LEVELS.LOW;
}

/**
 * Generar ID de sesión único
 * @returns {string} ID de sesión
 */
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Logger de respaldo para cuando falla el logging principal
 * @param {string} eventType - Tipo de evento
 * @param {Object} data - Datos del evento
 * @param {Error} originalError - Error original
 */
async function fallbackLogger(eventType, data, originalError) {
    try {
        console.error(`FALLBACK AUDIT LOG: ${eventType}`, {
            data,
            originalError: originalError.message,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        // Si hasta el fallback falla, al menos intentar log básico
        console.error('Critical: All logging systems failed', err);
    }
}

/**
 * Obtener logs de audit con filtros
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Array>} Array de logs
 */
async function getAuditLogs(filters = {}) {
    try {
        let query = db.collection('audit_logs');
        
        // Aplicar filtros
        if (filters.eventType) {
            query = query.where('eventType', '==', filters.eventType);
        }
        
        if (filters.severity) {
            query = query.where('severity', '==', filters.severity);
        }
        
        if (filters.userId) {
            query = query.where('userInfo.uid', '==', filters.userId);
        }
        
        if (filters.startDate) {
            query = query.where('timestamp', '>=', filters.startDate);
        }
        
        if (filters.endDate) {
            query = query.where('timestamp', '<=', filters.endDate);
        }
        
        // Ordenar por timestamp descendente
        query = query.orderBy('timestamp', 'desc');
        
        // Limitar resultados
        const limit = filters.limit || 100;
        query = query.limit(limit);
        
        const snapshot = await query.get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error('Error getting audit logs:', error);
        throw error;
    }
}

/**
 * Limpiar logs antiguos (más de 90 días)
 * @returns {Promise<number>} Número de logs eliminados
 */
async function cleanupOldLogs() {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const oldLogsQuery = db.collection('audit_logs')
            .where('timestamp', '<', ninetyDaysAgo)
            .limit(500); // Procesar en lotes
        
        const snapshot = await oldLogsQuery.get();
        
        if (snapshot.empty) {
            return 0;
        }
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        console.log(`Cleaned up ${snapshot.size} old audit logs`);
        return snapshot.size;
        
    } catch (error) {
        console.error('Error cleaning up old logs:', error);
        throw error;
    }
}

/**
 * Generar reporte de seguridad
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @returns {Promise<Object>} Reporte de seguridad
 */
async function generateSecurityReport(startDate, endDate) {
    try {
        const filters = { startDate, endDate, limit: 1000 };
        const logs = await getAuditLogs(filters);
        
        const report = {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            summary: {
                totalEvents: logs.length,
                criticalEvents: 0,
                highSeverityEvents: 0,
                authFailures: 0,
                rateLimitExceeded: 0,
                suspiciousActivity: 0
            },
            eventsByType: {},
            eventsBySeverity: {},
            topUsers: {},
            topIPs: {},
            recommendations: []
        };
        
        // Analizar logs
        logs.forEach(log => {
            // Contar por tipo
            report.eventsByType[log.eventType] = 
                (report.eventsByType[log.eventType] || 0) + 1;
            
            // Contar por severidad
            report.eventsBySeverity[log.severity] = 
                (report.eventsBySeverity[log.severity] || 0) + 1;
            
            // Contadores específicos
            if (log.severity === SEVERITY_LEVELS.CRITICAL) {
                report.summary.criticalEvents++;
            }
            if (log.severity === SEVERITY_LEVELS.HIGH) {
                report.summary.highSeverityEvents++;
            }
            if (log.eventType === AUDIT_EVENTS.AUTH_FAILED) {
                report.summary.authFailures++;
            }
            if (log.eventType === AUDIT_EVENTS.RATE_LIMIT_EXCEEDED) {
                report.summary.rateLimitExceeded++;
            }
            if (log.eventType === AUDIT_EVENTS.SUSPICIOUS_ACTIVITY) {
                report.summary.suspiciousActivity++;
            }
            
            // Análisis de usuarios
            if (log.userInfo && log.userInfo.email) {
                report.topUsers[log.userInfo.email] = 
                    (report.topUsers[log.userInfo.email] || 0) + 1;
            }
            
            // Análisis de IPs
            if (log.clientInfo && log.clientInfo.ip) {
                report.topIPs[log.clientInfo.ip] = 
                    (report.topIPs[log.clientInfo.ip] || 0) + 1;
            }
        });
        
        // Generar recomendaciones
        if (report.summary.authFailures > 10) {
            report.recommendations.push('Alto número de fallos de autenticación detectados');
        }
        if (report.summary.rateLimitExceeded > 5) {
            report.recommendations.push('Múltiples violaciones de rate limiting');
        }
        if (report.summary.criticalEvents > 0) {
            report.recommendations.push('Eventos críticos requieren revisión inmediata');
        }
        
        return report;
        
    } catch (error) {
        console.error('Error generating security report:', error);
        throw error;
    }
}

module.exports = {
    logAuditEvent,
    getAuditLogs,
    cleanupOldLogs,
    generateSecurityReport,
    AUDIT_EVENTS,
    SEVERITY_LEVELS
};