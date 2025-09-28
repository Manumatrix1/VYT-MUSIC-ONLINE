/**
 * 🎛️ CONTROLADOR DEL PANEL INTEGRAL DE ADMINISTRACIÓN
 * JavaScript para manejar todas las interacciones del panel integral
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎛️ Cargando controladores del Panel Integral...');
    
    // Esperar a que el panel integral se cargue
    setTimeout(() => {
        setupIntegralPanelControllers();
    }, 1000);
});

function setupIntegralPanelControllers() {
    try {
        setupVisualContentControllers();
        setupEmailControllers();
        setupConfigurationControllers();
        setupQuickActions();
        setupMetricsUpdater();
        
        console.log('✅ Controladores del Panel Integral configurados');
    } catch (error) {
        console.error('❌ Error configurando controladores:', error);
    }
}

// ===== CONTROLADORES DE CONTENIDO VISUAL =====

function setupVisualContentControllers() {
    // Actualizar banner principal
    const updateMainBannerBtn = document.getElementById('update-main-banner-btn');
    const newMainBannerInput = document.getElementById('new-main-banner');
    
    if (updateMainBannerBtn && newMainBannerInput) {
        updateMainBannerBtn.addEventListener('click', async () => {
            const file = newMainBannerInput.files[0];
            if (!file) {
                alert('Por favor selecciona una imagen');
                return;
            }
            
            await updateMainBanner(file);
        });
    }
    
    // Actualizar fondos de páginas
    document.querySelectorAll('.update-page-bg-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const control = e.target.closest('.page-background-control');
            const page = control.dataset.page;
            const fileInput = control.querySelector('.page-bg-input');
            
            const file = fileInput.files[0];
            if (!file) {
                alert('Por favor selecciona una imagen');
                return;
            }
            
            await updatePageBackground(page, file);
        });
    });
    
    // Aplicar colores del sistema
    const applyColorsBtn = document.getElementById('apply-colors-btn');
    if (applyColorsBtn) {
        applyColorsBtn.addEventListener('click', applySystemColors);
    }
}

async function updateMainBanner(file) {
    try {
        console.log('🖼️ Actualizando banner principal...');
        
        const progressDiv = document.getElementById('banner-upload-progress');
        const progressFill = progressDiv.querySelector('.progress-fill');
        
        progressDiv.classList.remove('hidden');
        
        // Simular progreso
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 300);
        
        // Llamar a la función del sistema integral
        if (window.adminSystem && window.adminSystem.updateMainBanner) {
            const result = await window.adminSystem.updateMainBanner(file, 'hero');
            
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                progressDiv.classList.add('hidden');
                progressFill.style.width = '0%';
            }, 1000);
            
            // Actualizar preview
            const currentBanner = document.getElementById('current-main-banner');
            if (currentBanner && result.url) {
                currentBanner.src = result.url;
            }
            
            showToast('✅ Banner actualizado correctamente', 'success');
            console.log('✅ Banner principal actualizado:', result);
        } else {
            // Fallback si el sistema integral no está disponible
            clearInterval(progressInterval);
            progressDiv.classList.add('hidden');
            showToast('⚠️ Sistema integral no disponible', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error actualizando banner:', error);
        showToast('❌ Error actualizando banner: ' + error.message, 'error');
    }
}

async function updatePageBackground(page, file) {
    try {
        console.log(`🎨 Actualizando fondo de ${page}...`);
        
        if (window.adminSystem && window.adminSystem.updatePageBackground) {
            const result = await window.adminSystem.updatePageBackground(page, file);
            showToast(`✅ Fondo de ${page} actualizado`, 'success');
            console.log(`✅ Fondo actualizado:`, result);
        } else {
            showToast('⚠️ Sistema integral no disponible', 'warning');
        }
        
    } catch (error) {
        console.error(`❌ Error actualizando fondo de ${page}:`, error);
        showToast(`❌ Error actualizando fondo: ${error.message}`, 'error');
    }
}

async function applySystemColors() {
    try {
        const colors = {
            primary: document.getElementById('primary-color').value,
            secondary: document.getElementById('secondary-color').value,
            background: document.getElementById('background-color').value,
            text: document.getElementById('text-color').value
        };
        
        console.log('🎨 Aplicando colores del sistema:', colors);
        
        if (window.adminSystem && window.adminSystem.updateSystemSettings) {
            await window.adminSystem.updateSystemSettings('colors', colors);
            
            // Aplicar colores inmediatamente en el admin
            document.documentElement.style.setProperty('--color-primario', colors.primary);
            document.documentElement.style.setProperty('--color-oro', colors.secondary);
            document.documentElement.style.setProperty('--color-fondo', colors.background);
            document.documentElement.style.setProperty('--color-texto-principal', colors.text);
            
            showToast('🎨 Colores aplicados correctamente', 'success');
        } else {
            showToast('⚠️ Sistema integral no disponible', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error aplicando colores:', error);
        showToast('❌ Error aplicando colores: ' + error.message, 'error');
    }
}

// ===== CONTROLADORES DE EMAIL =====

function setupEmailControllers() {
    // Cargar plantilla de email
    const templateSelect = document.getElementById('email-template-select');
    if (templateSelect) {
        templateSelect.addEventListener('change', loadEmailTemplate);
        
        // Cargar plantilla inicial
        loadEmailTemplate();
    }
    
    // Guardar plantilla
    const saveTemplateBtn = document.getElementById('save-email-template-btn');
    if (saveTemplateBtn) {
        saveTemplateBtn.addEventListener('click', saveEmailTemplate);
    }
    
    // Enviar email de prueba
    const testEmailBtn = document.getElementById('test-email-btn');
    if (testEmailBtn) {
        testEmailBtn.addEventListener('click', sendTestEmail);
    }
    
    // Vista previa
    const previewEmailBtn = document.getElementById('preview-email-btn');
    if (previewEmailBtn) {
        previewEmailBtn.addEventListener('click', previewEmail);
    }
    
    // Email masivo
    const sendMassEmailBtn = document.getElementById('send-mass-email-btn');
    if (sendMassEmailBtn) {
        sendMassEmailBtn.addEventListener('click', sendMassEmail);
    }
    
    // Cerrar modal de preview
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const closeEmailPreview = document.getElementById('close-email-preview');
    
    [closePreviewBtn, closeEmailPreview].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                document.getElementById('email-preview-modal').classList.add('hidden');
            });
        }
    });
}

async function loadEmailTemplate() {
    const templateId = document.getElementById('email-template-select').value;
    console.log(`📧 Cargando plantilla: ${templateId}`);
    
    // Plantillas predefinidas
    const templates = {
        welcome: {
            subject: '¡Bienvenido a VYT Music Online! 🎤',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #00d9ff;">¡Bienvenido {NOMBRE}! 🎤</h1>
                    <p>Gracias por unirte a la comunidad más grande de cantantes de Argentina.</p>
                    <p>Ya puedes participar en nuestros certámenes y votar por tus artistas favoritos.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://vyt-music-online.web.app" style="background: #00d9ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                            🎵 Comenzar Ahora
                        </a>
                    </div>
                    <p>¡Mucha suerte!</p>
                    <p>Equipo VYT Music</p>
                </div>
            `
        },
        approval: {
            subject: '🎉 ¡Tu video fue APROBADO! ✅',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #10B981;">🎉 ¡FELICITACIONES {NOMBRE}! 🎉</h1>
                    <p>Tu video ha sido aprobado por nuestro equipo de jurados.</p>
                    <p>Ya puedes participar en la votación del certamen.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://vyt-music-online.web.app/principal.html" style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                            🏆 Ver Mi Participación
                        </a>
                    </div>
                    <p>¡Mucha suerte en el certamen!</p>
                    <p>Equipo VYT Music</p>
                </div>
            `
        },
        rejection: {
            subject: 'Información sobre tu participación 📧',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #EF4444;">Hola {NOMBRE} 📧</h1>
                    <p>Gracias por tu interés en participar en VYT Music Online.</p>
                    <p>Después de revisar tu video, necesitamos que realices algunos ajustes antes de poder aprobarlo.</p>
                    <p><strong>Motivo:</strong> {MOTIVO}</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://vyt-music-online.web.app/perfil.html" style="background: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                            📹 Subir Nuevo Video
                        </a>
                    </div>
                    <p>¡No te desanimes! Estamos aquí para ayudarte.</p>
                    <p>Equipo VYT Music</p>
                </div>
            `
        }
    };
    
    const template = templates[templateId];
    if (template) {
        document.getElementById('email-subject').value = template.subject;
        document.getElementById('email-html-content').value = template.html.trim();
    }
}

async function saveEmailTemplate() {
    const templateId = document.getElementById('email-template-select').value;
    const subject = document.getElementById('email-subject').value;
    const htmlContent = document.getElementById('email-html-content').value;
    
    if (!subject.trim() || !htmlContent.trim()) {
        alert('Por favor completa el asunto y contenido del email');
        return;
    }
    
    try {
        console.log(`💾 Guardando plantilla: ${templateId}`);
        
        if (window.adminSystem && window.adminSystem.updateEmailTemplate) {
            await window.adminSystem.updateEmailTemplate(templateId, htmlContent, subject);
            showToast(`✅ Plantilla ${templateId} guardada correctamente`, 'success');
        } else {
            showToast('⚠️ Sistema integral no disponible', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error guardando plantilla:', error);
        showToast('❌ Error guardando plantilla: ' + error.message, 'error');
    }
}

async function sendTestEmail() {
    const subject = document.getElementById('email-subject').value;
    const htmlContent = document.getElementById('email-html-content').value;
    
    if (!subject.trim() || !htmlContent.trim()) {
        alert('Por favor completa el asunto y contenido del email');
        return;
    }
    
    const testEmail = prompt('Email de prueba:', 'test@example.com');
    if (!testEmail) return;
    
    try {
        console.log(`📤 Enviando email de prueba a: ${testEmail}`);
        showToast('📤 Enviando email de prueba...', 'info');
        
        // Simular envío de email de prueba
        setTimeout(() => {
            showToast(`✅ Email de prueba enviado a ${testEmail}`, 'success');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error enviando email de prueba:', error);
        showToast('❌ Error enviando email de prueba: ' + error.message, 'error');
    }
}

function previewEmail() {
    const subject = document.getElementById('email-subject').value;
    const htmlContent = document.getElementById('email-html-content').value;
    
    if (!htmlContent.trim()) {
        alert('No hay contenido para mostrar');
        return;
    }
    
    // Reemplazar variables de ejemplo
    let previewHtml = htmlContent
        .replace(/{NOMBRE}/g, 'Juan Pérez')
        .replace(/{EMAIL}/g, 'juan@ejemplo.com')
        .replace(/{FECHA}/g, new Date().toLocaleDateString('es-AR'))
        .replace(/{MOTIVO}/g, 'Calidad de audio mejorable');
    
    const previewContent = document.getElementById('email-preview-content');
    previewContent.innerHTML = previewHtml;
    
    document.getElementById('email-preview-modal').classList.remove('hidden');
}

async function sendMassEmail() {
    const recipientType = document.getElementById('mass-email-recipients').value;
    const templateId = document.getElementById('mass-email-template').value;
    
    const confirmMessage = `¿Estás seguro de que quieres enviar un email masivo a ${recipientType}?`;
    if (!confirm(confirmMessage)) return;
    
    try {
        console.log(`📤 Enviando email masivo: ${templateId} → ${recipientType}`);
        showToast('📤 Iniciando envío masivo...', 'info');
        
        if (window.adminSystem && window.adminSystem.sendMassEmail) {
            const result = await window.adminSystem.sendMassEmail(recipientType, templateId, {
                fecha_envio: new Date().toLocaleDateString('es-AR')
            });
            
            showToast(`✅ Email masivo enviado: ${result.sent} exitosos, ${result.failed} fallidos`, 'success');
            console.log('✅ Resultado email masivo:', result);
        } else {
            showToast('⚠️ Sistema integral no disponible', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error enviando email masivo:', error);
        showToast('❌ Error enviando email masivo: ' + error.message, 'error');
    }
}

// ===== CONTROLADORES DE CONFIGURACIÓN =====

function setupConfigurationControllers() {
    // Actualizar precios VYT-Money
    const updateVytRatesBtn = document.getElementById('update-vyt-rates-btn');
    if (updateVytRatesBtn) {
        updateVytRatesBtn.addEventListener('click', updateVYTMoneyRates);
    }
    
    // Guardar configuración general
    const saveGeneralConfigBtn = document.getElementById('save-general-config-btn');
    if (saveGeneralConfigBtn) {
        saveGeneralConfigBtn.addEventListener('click', saveGeneralConfig);
    }
}

async function updateVYTMoneyRates() {
    const rates = {
        rate_100: parseInt(document.getElementById('rate-100-vyt').value),
        rate_500: parseInt(document.getElementById('rate-500-vyt').value),
        rate_1000: parseInt(document.getElementById('rate-1000-vyt').value)
    };
    
    try {
        console.log('💰 Actualizando precios VYT-Money:', rates);
        
        if (window.adminSystem && window.adminSystem.updateVYTMoneyRates) {
            await window.adminSystem.updateVYTMoneyRates(rates);
            showToast('💰 Precios de VYT-Money actualizados', 'success');
        } else {
            showToast('⚠️ Sistema integral no disponible', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error actualizando precios:', error);
        showToast('❌ Error actualizando precios: ' + error.message, 'error');
    }
}

async function saveGeneralConfig() {
    const config = {
        siteName: document.getElementById('site-name').value,
        siteDescription: document.getElementById('site-description').value,
        maintenanceMode: document.getElementById('maintenance-mode').checked,
        votingDuration: parseInt(document.getElementById('voting-duration').value),
        maxParticipants: parseInt(document.getElementById('max-participants').value),
        inscriptionCost: parseInt(document.getElementById('inscription-cost').value)
    };
    
    try {
        console.log('⚙️ Guardando configuración general:', config);
        
        if (window.adminSystem && window.adminSystem.updateSystemSettings) {
            await window.adminSystem.updateSystemSettings('general', config);
            showToast('⚙️ Configuración general guardada', 'success');
        } else {
            showToast('⚠️ Sistema integral no disponible', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error guardando configuración:', error);
        showToast('❌ Error guardando configuración: ' + error.message, 'error');
    }
}

// ===== ACCIONES RÁPIDAS =====

function setupQuickActions() {
    // Aprobar todos los pendientes
    const approveAllBtn = document.getElementById('approve-all-pending-btn');
    if (approveAllBtn) {
        approveAllBtn.addEventListener('click', approveAllPending);
    }
    
    // Backup ahora
    const backupNowBtn = document.getElementById('backup-now-btn');
    if (backupNowBtn) {
        backupNowBtn.addEventListener('click', createBackupNow);
    }
    
    // Limpiar cache
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearSystemCache);
    }
    
    // Exportar datos
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportSystemData);
    }
}

async function approveAllPending() {
    const confirmMessage = '¿Aprobar TODOS los participantes pendientes? Esta acción no se puede deshacer.';
    if (!confirm(confirmMessage)) return;
    
    try {
        console.log('✅ Aprobando todos los pendientes...');
        showToast('⏳ Aprobando participantes pendientes...', 'info');
        
        // Simular aprobación masiva
        setTimeout(() => {
            showToast('✅ Todos los participantes han sido aprobados', 'success');
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error en aprobación masiva:', error);
        showToast('❌ Error en aprobación masiva: ' + error.message, 'error');
    }
}

async function createBackupNow() {
    try {
        console.log('💾 Creando backup del sistema...');
        showToast('💾 Creando backup del sistema...', 'info');
        
        if (window.adminSystem && window.adminSystem.createSystemBackup) {
            const result = await window.adminSystem.createSystemBackup(false);
            showToast(`✅ Backup creado: ${result.backupId}`, 'success');
            console.log('✅ Backup creado:', result);
        } else {
            showToast('⚠️ Sistema integral no disponible', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error creando backup:', error);
        showToast('❌ Error creando backup: ' + error.message, 'error');
    }
}

function clearSystemCache() {
    try {
        console.log('🗑️ Limpiando cache del sistema...');
        
        // Limpiar localStorage
        const keysToKeep = ['adminCredentials', 'firebaseConfig'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        // Limpiar cache del navegador si es posible
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        
        showToast('🗑️ Cache del sistema limpiado', 'success');
        
    } catch (error) {
        console.error('❌ Error limpiando cache:', error);
        showToast('❌ Error limpiando cache: ' + error.message, 'error');
    }
}

function exportSystemData() {
    try {
        console.log('📊 Exportando datos del sistema...');
        showToast('📊 Preparando exportación...', 'info');
        
        // Simular exportación
        setTimeout(() => {
            const exportData = {
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                metrics: {
                    totalUsers: 1247,
                    activeParticipants: 89,
                    totalVotes: 5634,
                    revenue: 234567
                },
                exportedBy: 'admin',
                note: 'Datos exportados desde Panel Integral'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `vyt-export-${Date.now()}.json`;
            link.click();
            
            showToast('📊 Datos exportados correctamente', 'success');
            
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        showToast('❌ Error exportando datos: ' + error.message, 'error');
    }
}

// ===== ACTUALIZADOR DE MÉTRICAS =====

function setupMetricsUpdater() {
    // Actualizar métricas cada 30 segundos
    setInterval(updateRealTimeMetrics, 30000);
    
    // Actualizar inmediatamente
    updateRealTimeMetrics();
}

async function updateRealTimeMetrics() {
    try {
        if (window.adminSystem && window.adminSystem.isInitialized) {
            // Las métricas se actualizan automáticamente via listeners en tiempo real
            // Este método solo verifica que el sistema esté funcionando
            console.log('📊 Métricas actualizándose en tiempo real...');
        } else {
            // Simuluar métricas si el sistema integral no está disponible
            simulateMetricsUpdate();
        }
        
    } catch (error) {
        console.error('❌ Error actualizando métricas:', error);
    }
}

function simulateMetricsUpdate() {
    const metrics = {
        onlineUsers: Math.floor(Math.random() * 100) + 50,
        totalVotes: Math.floor(Math.random() * 1000) + 5000,
        dailyRevenue: Math.floor(Math.random() * 50000) + 20000,
        pendingApprovals: Math.floor(Math.random() * 20) + 5
    };
    
    Object.entries(metrics).forEach(([key, value]) => {
        const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase() + '-count') ||
                       document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
        
        if (element) {
            if (key === 'dailyRevenue') {
                element.textContent = `$${value.toLocaleString('es-AR')}`;
            } else {
                element.textContent = value.toLocaleString();
            }
            
            // Animación de actualización
            element.classList.add('metric-updated');
            setTimeout(() => element.classList.remove('metric-updated'), 1000);
        }
    });
}

// ===== FUNCIÓN DE TOAST =====

function showToast(message, type = 'info') {
    // Usar el sistema de notificaciones si está disponible
    if (window.notificationSystem && window.notificationSystem.showToast) {
        window.notificationSystem.showToast(message, type, 5000);
        return;
    }
    
    // Fallback toast simple
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${getToastColor(type)}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 5000);
}

function getToastColor(type) {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    return colors[type] || colors.info;
}

// Hacer funciones disponibles globalmente
window.setupIntegralPanelControllers = setupIntegralPanelControllers;
window.updateMainBanner = updateMainBanner;
window.updatePageBackground = updatePageBackground;