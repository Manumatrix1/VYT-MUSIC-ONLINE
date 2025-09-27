/**
 * SISTEMA DE NOTIFICACIONES VYT MUSIC
 * Maneja notificaciones locales y envío de emails
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.loadStoredNotifications();
        this.isInitialized = true;
        console.log('📧 Sistema de notificaciones inicializado');
    }

    createNotificationContainer() {
        // Crear contenedor de notificaciones si no existe
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            container.style.cssText = `
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
    }

    // Mostrar notificación toast
    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const toast = document.createElement('div');
        const id = 'toast_' + Date.now();
        
        const colors = {
            success: 'bg-green-500 border-green-400 text-white',
            error: 'bg-red-500 border-red-400 text-white', 
            warning: 'bg-yellow-500 border-yellow-400 text-black',
            info: 'bg-blue-500 border-blue-400 text-white'
        };

        const icons = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.id = id;
        toast.className = `${colors[type]} px-4 py-3 rounded-lg border-l-4 shadow-lg animate-slide-in`;
        toast.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="text-lg">${icons[type]}</span>
                    <span class="font-medium">${message}</span>
                </div>
                <button onclick="notificationSystem.closeToast('${id}')" 
                        class="ml-4 text-lg hover:opacity-70 transition-opacity">×</button>
            </div>
        `;

        container.appendChild(toast);

        // Auto-cerrar después del tiempo especificado
        setTimeout(() => {
            this.closeToast(id);
        }, duration);

        // Agregar estilos CSS si no existen
        this.addNotificationStyles();
    }

    closeToast(id) {
        const toast = document.getElementById(id);
        if (toast) {
            toast.style.animation = 'slide-out 0.3s ease-in-out';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    addNotificationStyles() {
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slide-out {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Notificaciones específicas del sistema
    videoApproved(artistName, certamenName) {
        this.showToast(
            `🎉 Video de ${artistName} aprobado para ${certamenName}`,
            'success',
            7000
        );
        
        // También enviar email (simulado por ahora)
        this.sendEmailNotification({
            type: 'video_approved',
            artistName,
            certamenName
        });
    }

    videoRejected(artistName, certamenName, reason = '') {
        this.showToast(
            `❌ Video de ${artistName} rechazado para ${certamenName}`,
            'error',
            8000
        );

        this.sendEmailNotification({
            type: 'video_rejected', 
            artistName,
            certamenName,
            reason
        });
    }

    paymentSuccess(amount, type = 'inscription') {
        const message = type === 'vyt_money' 
            ? `💰 VYT-MONEY comprado: $${amount}`
            : `💳 Pago exitoso: $${amount}`;
            
        this.showToast(message, 'success', 6000);
    }

    registrationComplete(artistName) {
        this.showToast(
            `🎤 ¡Bienvenido ${artistName}! Registro completado`,
            'success',
            5000
        );

        this.sendEmailNotification({
            type: 'registration_complete',
            artistName
        });
    }

    // Simular envío de emails (por ahora solo log)
    async sendEmailNotification(data) {
        console.log('📧 Enviando email:', data);
        
        // En producción, esto llamaría a Firebase Functions
        const emailData = {
            timestamp: new Date().toISOString(),
            ...data
        };

        // Guardar en localStorage para el admin
        const emailLog = JSON.parse(localStorage.getItem('emailNotifications') || '[]');
        emailLog.push(emailData);
        localStorage.setItem('emailNotifications', JSON.stringify(emailLog));

        // Simular éxito
        setTimeout(() => {
            this.showToast('📧 Email enviado correctamente', 'info', 3000);
        }, 1000);
    }

    // Cargar notificaciones almacenadas
    loadStoredNotifications() {
        const stored = localStorage.getItem('userNotifications');
        if (stored) {
            this.notifications = JSON.parse(stored);
        }
    }

    // Agregar notificación persistente
    addNotification(title, message, type = 'info') {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        };

        this.notifications.unshift(notification);
        
        // Mostrar toast
        this.showToast(`${title}: ${message}`, type);
        
        // Guardar
        localStorage.setItem('userNotifications', JSON.stringify(this.notifications));
    }

    // Marcar como leída
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            localStorage.setItem('userNotifications', JSON.stringify(this.notifications));
        }
    }

    // Obtener no leídas
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    // Limpiar notificaciones antiguas
    cleanup(daysOld = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        
        this.notifications = this.notifications.filter(
            n => new Date(n.timestamp) > cutoff
        );
        
        localStorage.setItem('userNotifications', JSON.stringify(this.notifications));
    }
}

// Crear instancia global
window.notificationSystem = new NotificationSystem();

// Export para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}