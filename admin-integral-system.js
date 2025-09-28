/**
 * 🎛️ SISTEMA DE GESTIÓN INTEGRAL - VYT MUSIC ADMIN
 * Módulo que conecta TODOS los componentes del sistema con el panel de administración
 * 
 * FUNCIONALIDADES:
 * - Gestión de contenido visual (banners, fondos)
 * - Control de emails y notificaciones
 * - Configuración de parámetros del sistema
 * - Moderación en tiempo real
 * - Analytics y métricas
 * - Backup y restauración
 */

import { auth, db, storage, functions } from '../firebase-config.js';
import { 
    collection, getDocs, doc, updateDoc, getDoc, onSnapshot, 
    setDoc, addDoc, deleteDoc, query, orderBy, where, 
    serverTimestamp, writeBatch, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

class AdminIntegralSystem {
    constructor() {
        this.isInitialized = false;
        this.realTimeListeners = new Map();
        this.notificationSystem = null;
        this.metricsCache = new Map();
        this.init();
    }

    async init() {
        console.log('🎛️ Iniciando Sistema de Gestión Integral...');
        
        try {
            await this.initializeNotificationSystem();
            await this.setupRealTimeListeners();
            await this.loadSystemConfig();
            await this.initializeMetrics();
            
            this.isInitialized = true;
            console.log('✅ Sistema de Gestión Integral inicializado');
            
            // Notificar que el admin está online
            this.notifyAdminOnline();
        } catch (error) {
            console.error('❌ Error inicializando sistema integral:', error);
        }
    }

    // ===== GESTIÓN DE CONTENIDO VISUAL =====
    
    async updateMainBanner(file, position = 'hero') {
        try {
            console.log('🖼️ Actualizando banner principal...');
            
            // Subir nueva imagen
            const storageRef = ref(storage, `banners/${position}_${Date.now()}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            const snapshot = await uploadTask;
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Actualizar configuración del sitio
            await updateDoc(doc(db, 'site_config', 'visual'), {
                [`${position}_banner`]: {
                    url: downloadURL,
                    updatedAt: serverTimestamp(),
                    updatedBy: auth.currentUser.uid,
                    filename: file.name
                }
            });
            
            // Notificar usuarios sobre el cambio
            this.broadcastUpdate('banner_updated', {
                position,
                newUrl: downloadURL
            });
            
            console.log('✅ Banner actualizado correctamente');
            return { success: true, url: downloadURL };
            
        } catch (error) {
            console.error('❌ Error actualizando banner:', error);
            throw error;
        }
    }

    async updatePageBackground(page, file) {
        try {
            console.log(`🎨 Actualizando fondo de ${page}...`);
            
            const storageRef = ref(storage, `backgrounds/${page}_${Date.now()}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            const snapshot = await uploadTask;
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Actualizar CSS dinámicamente
            await this.updatePageStyles(page, {
                backgroundImage: `url(${downloadURL})`,
                updatedAt: new Date().toISOString()
            });
            
            console.log(`✅ Fondo de ${page} actualizado`);
            return { success: true, url: downloadURL };
            
        } catch (error) {
            console.error(`❌ Error actualizando fondo de ${page}:`, error);
            throw error;
        }
    }

    async updatePageStyles(page, styles) {
        // Actualizar estilos en tiempo real
        const styleDoc = doc(db, 'page_styles', page);
        await setDoc(styleDoc, {
            ...styles,
            lastModified: serverTimestamp(),
            modifiedBy: auth.currentUser.uid
        }, { merge: true });
        
        // Aplicar cambios inmediatamente en todas las sesiones activas
        this.broadcastUpdate('styles_updated', { page, styles });
    }

    // ===== GESTIÓN DE EMAILS Y NOTIFICACIONES =====
    
    async updateEmailTemplate(templateId, htmlContent, subject) {
        try {
            console.log(`📧 Actualizando plantilla de email: ${templateId}...`);
            
            const templateDoc = doc(db, 'email_templates', templateId);
            await setDoc(templateDoc, {
                html: htmlContent,
                subject: subject,
                version: Date.now(),
                lastModified: serverTimestamp(),
                modifiedBy: auth.currentUser.uid,
                isActive: true
            });
            
            console.log(`✅ Plantilla ${templateId} actualizada`);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error actualizando plantilla:', error);
            throw error;
        }
    }

    async sendMassEmail(recipientType, templateId, customData = {}) {
        try {
            console.log(`📤 Enviando email masivo a ${recipientType}...`);
            
            const sendMassEmailFunction = httpsCallable(functions, 'sendMassEmail');
            const result = await sendMassEmailFunction({
                recipientType, // 'all_users', 'participants', 'approved_only'
                templateId,
                customData,
                senderId: auth.currentUser.uid
            });
            
            console.log('✅ Email masivo enviado:', result.data);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error enviando email masivo:', error);
            throw error;
        }
    }

    async setupWelcomeEmailFlow(emailConfig) {
        try {
            console.log('📩 Configurando flujo de emails de bienvenida...');
            
            await setDoc(doc(db, 'email_flows', 'welcome_sequence'), {
                ...emailConfig,
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser.uid
            });
            
            console.log('✅ Flujo de bienvenida configurado');
            
        } catch (error) {
            console.error('❌ Error configurando flujo de emails:', error);
            throw error;
        }
    }

    // ===== CONFIGURACIÓN DEL SISTEMA =====
    
    async updateSystemSettings(category, settings) {
        try {
            console.log(`⚙️ Actualizando configuración: ${category}...`);
            
            const configDoc = doc(db, 'system_config', category);
            await updateDoc(configDoc, {
                ...settings,
                lastModified: serverTimestamp(),
                modifiedBy: auth.currentUser.uid
            });
            
            // Aplicar cambios en tiempo real
            this.broadcastUpdate('config_updated', { category, settings });
            
            console.log(`✅ Configuración ${category} actualizada`);
            
        } catch (error) {
            console.error('❌ Error actualizando configuración:', error);
            throw error;
        }
    }

    async updateVYTMoneyRates(newRates) {
        try {
            console.log('💰 Actualizando tasas de VYT-Money...');
            
            const updateRatesFunction = httpsCallable(functions, 'updateVYTMoneyRates');
            const result = await updateRatesFunction(newRates);
            
            // Actualizar cache local
            this.metricsCache.set('vyt_money_rates', newRates);
            
            // Notificar usuarios sobre cambios de precio
            this.notifyPriceUpdate(newRates);
            
            console.log('✅ Tasas actualizadas:', result.data);
            
        } catch (error) {
            console.error('❌ Error actualizando tasas:', error);
            throw error;
        }
    }

    async updateCertamenSettings(certamenId, settings) {
        try {
            console.log(`🏆 Actualizando configuración del certamen ${certamenId}...`);
            
            const certamenDoc = doc(db, 'certamenes_config', certamenId);
            await updateDoc(certamenDoc, {
                ...settings,
                lastModified: serverTimestamp(),
                modifiedBy: auth.currentUser.uid
            });
            
            console.log('✅ Configuración de certamen actualizada');
            
        } catch (error) {
            console.error('❌ Error actualizando certamen:', error);
            throw error;
        }
    }

    // ===== MODERACIÓN EN TIEMPO REAL =====
    
    async setupContentModeration() {
        console.log('🛡️ Configurando moderación en tiempo real...');
        
        // Listener para nuevos participantes
        const participantsListener = onSnapshot(
            query(collection(db, 'participantes_online'), where('status', '==', 'pending')),
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.handleNewParticipant(change.doc);
                    }
                });
            }
        );
        
        this.realTimeListeners.set('participants_moderation', participantsListener);
        
        // Listener para reportes de contenido
        const reportsListener = onSnapshot(
            collection(db, 'content_reports'),
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.handleContentReport(change.doc);
                    }
                });
            }
        );
        
        this.realTimeListeners.set('content_reports', reportsListener);
    }

    async approveParticipant(participantId, moderationType = 'online') {
        try {
            console.log(`✅ Aprobando participante: ${participantId}...`);
            
            const approveFunction = httpsCallable(functions, 'approveParticipantAdmin');
            const result = await approveFunction({
                participantId,
                moderationType,
                moderatorId: auth.currentUser.uid
            });
            
            // Actualizar métricas
            this.updateModerationMetrics('approved');
            
            console.log('✅ Participante aprobado:', result.data);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error aprobando participante:', error);
            throw error;
        }
    }

    async rejectParticipant(participantId, reason, moderationType = 'online') {
        try {
            console.log(`❌ Rechazando participante: ${participantId}...`);
            
            const rejectFunction = httpsCallable(functions, 'rejectParticipantAdmin');
            const result = await rejectFunction({
                participantId,
                reason,
                moderationType,
                moderatorId: auth.currentUser.uid
            });
            
            // Actualizar métricas
            this.updateModerationMetrics('rejected');
            
            console.log('❌ Participante rechazado:', result.data);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error rechazando participante:', error);
            throw error;
        }
    }

    // ===== ANALYTICS Y MÉTRICAS =====
    
    async initializeMetrics() {
        console.log('📊 Inicializando sistema de métricas...');
        
        // Listener para métricas en tiempo real
        const metricsListener = onSnapshot(
            doc(db, 'system_metrics', 'realtime'),
            (snapshot) => {
                if (snapshot.exists()) {
                    const metrics = snapshot.data();
                    this.updateMetricsDisplay(metrics);
                    this.metricsCache.set('realtime', metrics);
                }
            }
        );
        
        this.realTimeListeners.set('metrics', metricsListener);
        
        // Cargar métricas históricas
        await this.loadHistoricalMetrics();
    }

    async updateMetricsDisplay(metrics) {
        try {
            // Actualizar contadores en el admin
            const elements = {
                onlineUsers: document.getElementById('online-users-count'),
                totalVotes: document.getElementById('total-votes-count'),
                dailyRevenue: document.getElementById('daily-revenue'),
                pendingApprovals: document.getElementById('pending-approvals'),
                activeParticipants: document.getElementById('active-participants'),
                vytMoneyCirculation: document.getElementById('vyt-money-circulation')
            };
            
            Object.entries(elements).forEach(([key, element]) => {
                if (element && metrics[key] !== undefined) {
                    element.textContent = this.formatMetricValue(key, metrics[key]);
                    
                    // Agregar animación de actualización
                    element.classList.add('metric-updated');
                    setTimeout(() => element.classList.remove('metric-updated'), 1000);
                }
            });
            
        } catch (error) {
            console.error('❌ Error actualizando métricas:', error);
        }
    }

    formatMetricValue(type, value) {
        switch (type) {
            case 'dailyRevenue':
                return `$${value.toLocaleString('es-AR')}`;
            case 'vytMoneyCirculation':
                return `${value.toLocaleString()} VYT`;
            case 'onlineUsers':
            case 'totalVotes':
            case 'pendingApprovals':
            case 'activeParticipants':
                return value.toLocaleString();
            default:
                return value;
        }
    }

    // ===== BACKUP Y RESTAURACIÓN =====
    
    async createSystemBackup(includeMedia = false) {
        try {
            console.log('💾 Creando backup del sistema...');
            
            const backupFunction = httpsCallable(functions, 'createSystemBackup');
            const result = await backupFunction({
                includeMedia,
                requestedBy: auth.currentUser.uid,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Backup creado:', result.data);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error creando backup:', error);
            throw error;
        }
    }

    async restoreFromBackup(backupId) {
        try {
            console.log(`🔄 Restaurando desde backup: ${backupId}...`);
            
            const restoreFunction = httpsCallable(functions, 'restoreSystemBackup');
            const result = await restoreFunction({
                backupId,
                requestedBy: auth.currentUser.uid
            });
            
            console.log('✅ Sistema restaurado:', result.data);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error restaurando backup:', error);
            throw error;
        }
    }

    // ===== NOTIFICACIONES Y COMUNICACIÓN =====
    
    async initializeNotificationSystem() {
        // Cargar sistema de notificaciones
        try {
            const notificationModule = await import('../notification-system.js');
            this.notificationSystem = new notificationModule.NotificationSystem();
            console.log('✅ Sistema de notificaciones cargado');
        } catch (error) {
            console.warn('⚠️ No se pudo cargar el sistema de notificaciones:', error);
        }
    }

    async broadcastUpdate(updateType, data) {
        try {
            console.log(`📡 Enviando actualización: ${updateType}`);
            
            const broadcastFunction = httpsCallable(functions, 'broadcastSystemUpdate');
            await broadcastFunction({
                updateType,
                data,
                timestamp: serverTimestamp(),
                adminId: auth.currentUser.uid
            });
            
        } catch (error) {
            console.error('❌ Error enviando broadcast:', error);
        }
    }

    notifyAdminOnline() {
        console.log('👨‍💼 Admin conectado al sistema');
        if (this.notificationSystem) {
            this.notificationSystem.showToast(
                '👋 Bienvenido Admin - Sistema operativo',
                'success',
                3000
            );
        }
    }

    // ===== UTILIDADES =====
    
    async setupRealTimeListeners() {
        await this.setupContentModeration();
        // Otros listeners se pueden agregar aquí
    }

    async loadSystemConfig() {
        try {
            const configSnapshot = await getDocs(collection(db, 'system_config'));
            const config = {};
            
            configSnapshot.forEach((doc) => {
                config[doc.id] = doc.data();
            });
            
            this.systemConfig = config;
            console.log('⚙️ Configuración del sistema cargada');
            
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
        }
    }

    async loadHistoricalMetrics() {
        try {
            const metricsSnapshot = await getDocs(
                query(
                    collection(db, 'historical_metrics'),
                    orderBy('timestamp', 'desc'),
                    limit(30)
                )
            );
            
            const historicalData = [];
            metricsSnapshot.forEach((doc) => {
                historicalData.push(doc.data());
            });
            
            this.metricsCache.set('historical', historicalData);
            console.log('📈 Métricas históricas cargadas');
            
        } catch (error) {
            console.error('❌ Error cargando métricas históricas:', error);
        }
    }

    handleNewParticipant(participantDoc) {
        const participant = participantDoc.data();
        console.log('🆕 Nuevo participante pendiente:', participant.nombre_artista);
        
        if (this.notificationSystem) {
            this.notificationSystem.showToast(
                `🎤 Nuevo participante: ${participant.nombre_artista}`,
                'info',
                5000
            );
        }
        
        // Actualizar contador de pendientes
        this.updatePendingCount();
    }

    handleContentReport(reportDoc) {
        const report = reportDoc.data();
        console.log('🚨 Nuevo reporte de contenido:', report);
        
        if (this.notificationSystem) {
            this.notificationSystem.showToast(
                '🚨 Nuevo reporte de contenido',
                'warning',
                7000
            );
        }
    }

    updateModerationMetrics(action) {
        const today = new Date().toISOString().split('T')[0];
        const metrics = this.metricsCache.get('moderation') || {};
        
        if (!metrics[today]) {
            metrics[today] = { approved: 0, rejected: 0 };
        }
        
        metrics[today][action]++;
        this.metricsCache.set('moderation', metrics);
        
        // Actualizar en Firestore
        this.updateSystemSettings('moderation_metrics', metrics);
    }

    async updatePendingCount() {
        try {
            const pendingQuery = query(
                collection(db, 'participantes_online'),
                where('status', '==', 'pending')
            );
            
            const snapshot = await getDocs(pendingQuery);
            const count = snapshot.size;
            
            const element = document.getElementById('pending-approvals');
            if (element) {
                element.textContent = count;
                
                // Highlight si hay muchos pendientes
                if (count > 10) {
                    element.classList.add('high-priority');
                } else {
                    element.classList.remove('high-priority');
                }
            }
            
        } catch (error) {
            console.error('❌ Error actualizando contador de pendientes:', error);
        }
    }

    notifyPriceUpdate(newRates) {
        if (this.notificationSystem) {
            this.notificationSystem.showToast(
                '💰 Precios de VYT-Money actualizados',
                'success',
                4000
            );
        }
    }

    // Cleanup function
    destroy() {
        console.log('🧹 Limpiando sistema integral...');
        
        // Desconectar todos los listeners
        this.realTimeListeners.forEach((unsubscribe) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this.realTimeListeners.clear();
        this.metricsCache.clear();
        this.isInitialized = false;
        
        console.log('✅ Sistema integral limpiado');
    }
}

// Hacer disponible globalmente
window.AdminIntegralSystem = AdminIntegralSystem;

// Auto-inicialización en admin.html
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar en páginas de admin
    if (window.location.pathname.includes('admin') || 
        document.getElementById('admin-dashboard')) {
        
        console.log('🎛️ Inicializando Sistema Integral de Admin...');
        window.adminSystem = new AdminIntegralSystem();
    }
});

export default AdminIntegralSystem;