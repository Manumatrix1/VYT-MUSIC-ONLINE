/**
 * Sistema Universal de Indicadores de Progreso
 * VYT Music Online - Progress Indicators
 */

class ProgressSystem {
    constructor() {
        this.activeProcesses = new Map();
        this.init();
    }

    init() {
        // Crear estilos CSS para los indicadores
        this.injectCSS();
        // Crear contenedor principal para overlays
        this.createMainContainer();
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Progress System Styles */
            .vyt-progress-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(5px);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .vyt-progress-overlay.show {
                opacity: 1;
            }

            .vyt-progress-modal {
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .vyt-progress-overlay.show .vyt-progress-modal {
                transform: scale(1);
            }

            .vyt-progress-icon {
                font-size: 48px;
                margin-bottom: 16px;
                animation: pulse 2s infinite;
            }

            .vyt-progress-title {
                font-size: 20px;
                font-weight: bold;
                color: #333;
                margin-bottom: 8px;
            }

            .vyt-progress-message {
                color: #666;
                margin-bottom: 24px;
                font-size: 14px;
            }

            .vyt-progress-bar {
                width: 100%;
                height: 8px;
                background: #e5e5e5;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 16px;
            }

            .vyt-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .vyt-progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                animation: shimmer 1.5s infinite;
            }

            .vyt-progress-steps {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px;
                margin-top: 16px;
            }

            .vyt-progress-step {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #e5e5e5;
                transition: all 0.3s ease;
            }

            .vyt-progress-step.active {
                background: #667eea;
                transform: scale(1.2);
            }

            .vyt-progress-step.completed {
                background: #10b981;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .vyt-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e5e5e5;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }

            /* Toast Notifications */
            .vyt-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 16px 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                border-left: 4px solid #667eea;
                max-width: 350px;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }

            .vyt-toast.show {
                transform: translateX(0);
            }

            .vyt-toast.success {
                border-left-color: #10b981;
            }

            .vyt-toast.error {
                border-left-color: #ef4444;
            }

            .vyt-toast.warning {
                border-left-color: #f59e0b;
            }

            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .vyt-progress-modal {
                    padding: 24px;
                    margin: 20px;
                }

                .vyt-progress-title {
                    font-size: 18px;
                }

                .vyt-toast {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createMainContainer() {
        this.container = document.createElement('div');
        this.container.id = 'vyt-progress-container';
        document.body.appendChild(this.container);
    }

    /**
     * Mostrar indicador de progreso
     * @param {string} processId - ID único del proceso
     * @param {Object} options - Configuración del indicador
     */
    show(processId, options = {}) {
        const config = {
            title: '⏳ Procesando...',
            message: 'Por favor espera un momento',
            icon: '🔄',
            showProgress: true,
            progress: 0,
            steps: null,
            currentStep: 0,
            ...options
        };

        // Si ya existe, actualizar
        if (this.activeProcesses.has(processId)) {
            return this.update(processId, config);
        }

        // Crear nuevo overlay
        const overlay = document.createElement('div');
        overlay.className = 'vyt-progress-overlay';
        overlay.innerHTML = this.createModalHTML(config);

        this.container.appendChild(overlay);
        this.activeProcesses.set(processId, { overlay, config });

        // Mostrar con animación
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    createModalHTML(config) {
        const progressBar = config.showProgress ? `
            <div class="vyt-progress-bar">
                <div class="vyt-progress-fill" style="width: ${config.progress}%"></div>
            </div>
        ` : '';

        const steps = config.steps ? `
            <div class="vyt-progress-steps">
                ${config.steps.map((step, index) => `
                    <div class="vyt-progress-step ${
                        index < config.currentStep ? 'completed' : 
                        index === config.currentStep ? 'active' : ''
                    }"></div>
                `).join('')}
            </div>
        ` : '';

        return `
            <div class="vyt-progress-modal">
                <div class="vyt-progress-icon">${config.icon}</div>
                <div class="vyt-progress-title">${config.title}</div>
                <div class="vyt-progress-message">${config.message}</div>
                ${progressBar}
                ${steps}
            </div>
        `;
    }

    /**
     * Actualizar progreso existente
     */
    update(processId, updates) {
        const process = this.activeProcesses.get(processId);
        if (!process) return;

        // Actualizar configuración
        Object.assign(process.config, updates);

        // Actualizar DOM
        const modal = process.overlay.querySelector('.vyt-progress-modal');
        modal.innerHTML = this.createModalHTML(process.config);
    }

    /**
     * Ocultar indicador de progreso
     */
    hide(processId, showSuccess = true) {
        const process = this.activeProcesses.get(processId);
        if (!process) return;

        if (showSuccess) {
            this.update(processId, {
                title: '✅ ¡Completado!',
                message: 'Proceso finalizado exitosamente',
                icon: '🎉',
                showProgress: false
            });

            setTimeout(() => {
                this.removeProcess(processId);
            }, 1500);
        } else {
            this.removeProcess(processId);
        }
    }

    removeProcess(processId) {
        const process = this.activeProcesses.get(processId);
        if (!process) return;

        process.overlay.classList.remove('show');
        setTimeout(() => {
            if (process.overlay.parentNode) {
                process.overlay.parentNode.removeChild(process.overlay);
            }
            this.activeProcesses.delete(processId);
        }, 300);
    }

    /**
     * Mostrar notificación toast
     */
    showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `vyt-toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">${icons[type] || icons.info}</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Mostrar
        setTimeout(() => toast.classList.add('show'), 10);

        // Ocultar automáticamente
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Progreso específico para registros
     */
    showRegistrationProgress() {
        this.show('registration', {
            title: '🎵 Creando tu cuenta',
            message: 'Configurando tu perfil de artista...',
            icon: '👤',
            steps: ['Validación', 'Cuenta', 'Perfil', 'Completado'],
            currentStep: 0
        });
    }

    /**
     * Progreso específico para inscripciones
     */
    showInscriptionProgress() {
        this.show('inscription', {
            title: '🏆 Procesando inscripción',
            message: 'Validando datos y procesando pago...',
            icon: '📝',
            steps: ['Datos', 'Validación', 'Pago', 'Confirmación'],
            currentStep: 0
        });
    }

    /**
     * Progreso específico para uploads
     */
    showUploadProgress() {
        this.show('upload', {
            title: '📁 Subiendo archivos',
            message: 'Procesando tu contenido...',
            icon: '☁️',
            showProgress: true,
            progress: 0
        });
    }
}

// Crear instancia global
window.ProgressSystem = ProgressSystem;
window.progressSystem = new ProgressSystem();

// Funciones de conveniencia global
window.showProgress = (id, options) => window.progressSystem.show(id, options);
window.updateProgress = (id, updates) => window.progressSystem.update(id, updates);
window.hideProgress = (id, showSuccess) => window.progressSystem.hide(id, showSuccess);
window.showToast = (message, type, duration) => window.progressSystem.showToast(message, type, duration);

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressSystem;
}