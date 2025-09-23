// Sistema de Notificaciones Toast para VYT-MUSIC
class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Crear contenedor de notificaciones
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.container);

        // Agregar estilos CSS
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                min-width: 300px;
                max-width: 400px;
                padding: 1rem;
                border-radius: 0.75rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: white;
                font-weight: 500;
                transform: translateX(100%);
                transition: all 0.4s ease;
                border: 1px solid rgba(255,255,255,0.2);
                position: relative;
                overflow: hidden;
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }

            .notification-success {
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9));
            }

            .notification-error {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
            }

            .notification-info {
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
            }

            .notification-warning {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
            }

            .notification-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }

            .notification-content {
                flex: 1;
            }

            .notification-title {
                font-weight: 600;
                font-size: 0.9rem;
                margin-bottom: 0.25rem;
            }

            .notification-message {
                font-size: 0.8rem;
                opacity: 0.9;
                line-height: 1.4;
            }

            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .notification-close:hover {
                opacity: 1;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255,255,255,0.3);
                transition: width linear;
            }

            @media (max-width: 640px) {
                #notification-container {
                    top: 1rem;
                    right: 1rem;
                    left: 1rem;
                }
                
                .notification {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(type, title, message, duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || 'ℹ️'}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">×</button>
            <div class="notification-progress"></div>
        `;

        this.container.appendChild(notification);

        // Mostrar notificación
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Configurar auto-close
        const progressBar = notification.querySelector('.notification-progress');
        const closeBtn = notification.querySelector('.notification-close');
        
        let startTime = Date.now();
        let animationId;

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            progressBar.style.width = `${100 - progress}%`;

            if (progress < 100) {
                animationId = requestAnimationFrame(updateProgress);
            } else {
                this.hide(notification);
            }
        };

        if (duration > 0) {
            updateProgress();
        }

        // Botón cerrar
        closeBtn.addEventListener('click', () => {
            if (animationId) cancelAnimationFrame(animationId);
            this.hide(notification);
        });

        // Auto-remove en móvil con swipe
        let startX = 0;
        notification.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        notification.addEventListener('touchmove', (e) => {
            const currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            if (diff > 50) {
                if (animationId) cancelAnimationFrame(animationId);
                this.hide(notification);
            }
        });

        return notification;
    }

    hide(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }

    // Métodos de conveniencia
    success(title, message, duration) {
        return this.show('success', title, message, duration);
    }

    error(title, message, duration) {
        return this.show('error', title, message, duration);
    }

    info(title, message, duration) {
        return this.show('info', title, message, duration);
    }

    warning(title, message, duration) {
        return this.show('warning', title, message, duration);
    }

    // Notificaciones específicas para VYT-MUSIC
    balanceUpdated(newBalance, change) {
        const changeText = change > 0 ? `+${change}` : change;
        this.success(
            '💰 Balance Actualizado',
            `Tu nuevo balance: ${newBalance.toLocaleString()} VYT-MONEY (${changeText})`
        );
    }

    paymentSuccess(amount, type) {
        const typeText = type === 'vyt_money' ? 'VYT-MONEY' : 'Inscripción';
        this.success(
            '✅ Pago Exitoso',
            `${typeText} comprado por $${amount}. ¡Gracias por tu compra!`
        );
    }

    paymentError(message) {
        this.error(
            '❌ Error de Pago',
            message || 'No pudimos procesar tu pago. Intenta nuevamente.'
        );
    }

    voteSubmitted(artistName, amount) {
        this.success(
            '🗳️ Voto Registrado',
            `Votaste por ${artistName} con ${amount} VYT-MONEY`
        );
    }

    loginSuccess(userName) {
        this.success(
            '👋 ¡Bienvenido!',
            `Hola ${userName}, ya puedes participar en los certámenes`
        );
    }

    connectionError() {
        this.error(
            '🌐 Sin Conexión',
            'Verifica tu conexión a internet e intenta nuevamente'
        );
    }
}

// Crear instancia global
const notifications = new NotificationSystem();

// Hacer disponible globalmente
window.notifications = notifications;

export default notifications;