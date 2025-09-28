/**
 * Sistema de Mensajes de Error User-Friendly
 * VYT Music Online - Error Handling System
 */

class ErrorHandlingSystem {
    constructor() {
        this.errorDictionary = this.createErrorDictionary();
        this.init();
    }

    init() {
        this.injectCSS();
        this.setupGlobalErrorHandling();
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Error System Styles */
            .vyt-error-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10001;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .vyt-error-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .vyt-error-content {
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s ease;
                border-top: 5px solid #ef4444;
            }

            .vyt-error-modal.show .vyt-error-content {
                transform: scale(1) translateY(0);
            }

            .vyt-error-icon {
                font-size: 64px;
                margin-bottom: 16px;
                color: #ef4444;
                animation: shake 0.5s ease-in-out;
            }

            .vyt-error-title {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 12px;
            }

            .vyt-error-message {
                color: #666;
                margin-bottom: 20px;
                line-height: 1.5;
                font-size: 16px;
            }

            .vyt-error-solution {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 20px;
                text-align: left;
            }

            .vyt-error-solution h4 {
                color: #28a745;
                margin-bottom: 8px;
                font-size: 16px;
                font-weight: bold;
            }

            .vyt-error-solution ul {
                margin: 8px 0;
                padding-left: 20px;
                color: #555;
            }

            .vyt-error-solution li {
                margin-bottom: 4px;
                font-size: 14px;
            }

            .vyt-error-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .vyt-error-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                display: inline-block;
                font-size: 14px;
            }

            .vyt-error-btn-primary {
                background: #667eea;
                color: white;
            }

            .vyt-error-btn-primary:hover {
                background: #5a67d8;
                transform: translateY(-1px);
            }

            .vyt-error-btn-secondary {
                background: #f7fafc;
                color: #4a5568;
                border: 1px solid #e2e8f0;
            }

            .vyt-error-btn-secondary:hover {
                background: #edf2f7;
            }

            .vyt-error-btn-danger {
                background: #fed7d7;
                color: #c53030;
                border: 1px solid #feb2b2;
            }

            .vyt-error-btn-danger:hover {
                background: #fbb6ce;
            }

            /* Inline Error Styles */
            .vyt-field-error {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }

            .vyt-error-text {
                color: #ef4444;
                font-size: 12px;
                margin-top: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .vyt-error-text::before {
                content: "⚠️";
                font-size: 14px;
            }

            /* Success States */
            .vyt-field-success {
                border-color: #10b981 !important;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
            }

            .vyt-success-text {
                color: #10b981;
                font-size: 12px;
                margin-top: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .vyt-success-text::before {
                content: "✅";
                font-size: 14px;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .vyt-error-content {
                    padding: 24px;
                    margin: 20px;
                }

                .vyt-error-title {
                    font-size: 20px;
                }

                .vyt-error-message {
                    font-size: 14px;
                }

                .vyt-error-buttons {
                    flex-direction: column;
                }

                .vyt-error-btn {
                    width: 100%;
                    padding: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createErrorDictionary() {
        return {
            // Firebase Auth Errors
            'auth/email-already-in-use': {
                title: '📧 Email ya registrado',
                message: 'Ya existe una cuenta con este correo electrónico.',
                solutions: [
                    'Inicia sesión con tu cuenta existente',
                    'Usa un correo electrónico diferente',
                    '¿Olvidaste tu contraseña? Puedes recuperarla'
                ],
                actions: [
                    { text: 'Ir al Login', action: () => window.location.href = 'login-artista.html', type: 'primary' },
                    { text: 'Recuperar Contraseña', action: () => window.location.href = 'reset-password.html', type: 'secondary' },
                    { text: 'Intentar Nuevo Email', action: () => this.closeModal(), type: 'secondary' }
                ]
            },
            'auth/weak-password': {
                title: '🔒 Contraseña muy débil',
                message: 'Tu contraseña debe ser más segura para proteger tu cuenta.',
                solutions: [
                    'Usa al menos 8 caracteres',
                    'Incluye mayúsculas y minúsculas',
                    'Agrega números y símbolos especiales',
                    'Evita palabras comunes o datos personales'
                ],
                actions: [
                    { text: 'Crear Nueva Contraseña', action: () => this.closeModal(), type: 'primary' }
                ]
            },
            'auth/invalid-email': {
                title: '📧 Email inválido',
                message: 'El formato del correo electrónico no es correcto.',
                solutions: [
                    'Verifica que tenga el formato: nombre@dominio.com',
                    'Revisa que no falten letras o símbolos',
                    'No uses espacios en blanco'
                ],
                actions: [
                    { text: 'Corregir Email', action: () => this.closeModal(), type: 'primary' }
                ]
            },
            'auth/user-not-found': {
                title: '👤 Usuario no encontrado',
                message: 'No encontramos una cuenta con este correo electrónico.',
                solutions: [
                    'Verifica que hayas escrito bien tu email',
                    'Crea una cuenta nueva si no tienes una',
                    'Prueba con otro correo electrónico que uses'
                ],
                actions: [
                    { text: 'Crear Cuenta', action: () => window.location.href = 'register.html', type: 'primary' },
                    { text: 'Intentar Otro Email', action: () => this.closeModal(), type: 'secondary' }
                ]
            },
            'auth/wrong-password': {
                title: '🔑 Contraseña incorrecta',
                message: 'La contraseña que ingresaste no es correcta.',
                solutions: [
                    'Verifica que no tengas activado Bloq Mayús',
                    'Asegúrate de escribir la contraseña completa',
                    'Recupera tu contraseña si no la recuerdas'
                ],
                actions: [
                    { text: 'Intentar de Nuevo', action: () => this.closeModal(), type: 'primary' },
                    { text: 'Recuperar Contraseña', action: () => window.location.href = 'reset-password.html', type: 'secondary' }
                ]
            },

            // Network Errors
            'network-error': {
                title: '🌐 Error de conexión',
                message: 'No pudimos conectar con nuestros servidores.',
                solutions: [
                    'Verifica tu conexión a internet',
                    'Intenta recargar la página',
                    'Si el problema persiste, espera unos minutos e intenta de nuevo'
                ],
                actions: [
                    { text: 'Reintentar', action: () => window.location.reload(), type: 'primary' },
                    { text: 'Verificar Conexión', action: () => this.checkConnection(), type: 'secondary' }
                ]
            },

            // Payment Errors
            'payment-failed': {
                title: '💳 Error en el pago',
                message: 'No pudimos procesar tu pago. Tu dinero está seguro.',
                solutions: [
                    'Verifica que tu tarjeta tenga fondos suficientes',
                    'Confirma que los datos de la tarjeta sean correctos',
                    'Intenta con otro método de pago',
                    'Contacta con tu banco si el problema persiste'
                ],
                actions: [
                    { text: 'Intentar de Nuevo', action: () => this.closeModal(), type: 'primary' },
                    { text: 'Contactar Soporte', action: () => this.openSupport(), type: 'secondary' }
                ]
            },

            // File Upload Errors
            'upload-failed': {
                title: '📁 Error al subir archivo',
                message: 'No pudimos subir tu archivo. Vamos a intentarlo de nuevo.',
                solutions: [
                    'Verifica que tu archivo sea menor a 10MB',
                    'Usa formatos compatibles (JPG, PNG, MP4)',
                    'Asegúrate de tener buena conexión a internet',
                    'Intenta con un archivo diferente'
                ],
                actions: [
                    { text: 'Subir Otro Archivo', action: () => this.closeModal(), type: 'primary' },
                    { text: 'Ver Formatos Compatibles', action: () => this.showFileFormats(), type: 'secondary' }
                ]
            },

            // Form Validation Errors
            'required-field': {
                title: '📝 Campos obligatorios',
                message: 'Algunos campos importantes están vacíos.',
                solutions: [
                    'Revisa los campos marcados en rojo',
                    'Completa toda la información requerida',
                    'Los campos con * son obligatorios'
                ],
                actions: [
                    { text: 'Completar Formulario', action: () => this.closeModal(), type: 'primary' }
                ]
            },

            // Generic Error
            'generic': {
                title: '😟 Algo salió mal',
                message: 'Ocurrió un error inesperado, pero nuestro equipo ya está trabajando en solucionarlo.',
                solutions: [
                    'Intenta recargar la página',
                    'Verifica tu conexión a internet',
                    'Si el problema persiste, contáctanos'
                ],
                actions: [
                    { text: 'Recargar Página', action: () => window.location.reload(), type: 'primary' },
                    { text: 'Contactar Soporte', action: () => this.openSupport(), type: 'secondary' }
                ]
            }
        };
    }

    setupGlobalErrorHandling() {
        // Capturar errores JavaScript
        window.addEventListener('error', (event) => {
            console.error('JavaScript Error:', event.error);
            this.handleGenericError(event.error.message);
        });

        // Capturar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            this.handleFirebaseError(event.reason);
        });
    }

    /**
     * Mostrar error de Firebase/Auth
     */
    handleFirebaseError(error) {
        const errorCode = error?.code || 'generic';
        const errorConfig = this.errorDictionary[errorCode] || this.errorDictionary['generic'];
        this.showErrorModal(errorConfig);
    }

    /**
     * Mostrar error genérico
     */
    handleGenericError(message) {
        const errorConfig = {
            ...this.errorDictionary['generic'],
            message: message || 'Ocurrió un error inesperado'
        };
        this.showErrorModal(errorConfig);
    }

    /**
     * Mostrar error de red
     */
    handleNetworkError() {
        this.showErrorModal(this.errorDictionary['network-error']);
    }

    /**
     * Mostrar error de pago
     */
    handlePaymentError(details) {
        const errorConfig = {
            ...this.errorDictionary['payment-failed'],
            message: details || this.errorDictionary['payment-failed'].message
        };
        this.showErrorModal(errorConfig);
    }

    /**
     * Mostrar modal de error principal
     */
    showErrorModal(errorConfig) {
        // Crear modal si no existe
        let modal = document.getElementById('vyt-error-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'vyt-error-modal';
            modal.className = 'vyt-error-modal';
            document.body.appendChild(modal);
        }

        // Generar contenido
        modal.innerHTML = `
            <div class="vyt-error-content">
                <div class="vyt-error-icon">😟</div>
                <h2 class="vyt-error-title">${errorConfig.title}</h2>
                <p class="vyt-error-message">${errorConfig.message}</p>
                
                ${errorConfig.solutions ? `
                    <div class="vyt-error-solution">
                        <h4>💡 ¿Cómo solucionarlo?</h4>
                        <ul>
                            ${errorConfig.solutions.map(solution => `<li>${solution}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="vyt-error-buttons">
                    ${errorConfig.actions.map(action => `
                        <button class="vyt-error-btn vyt-error-btn-${action.type}" onclick="errorSystem.executeAction('${action.text}')">
                            ${action.text}
                        </button>
                    `).join('')}
                    <button class="vyt-error-btn vyt-error-btn-secondary" onclick="errorSystem.closeModal()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        // Guardar acciones para ejecutar
        this.currentActions = errorConfig.actions;

        // Mostrar modal
        modal.classList.add('show');

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    /**
     * Ejecutar acción del modal
     */
    executeAction(actionText) {
        const action = this.currentActions?.find(a => a.text === actionText);
        if (action && action.action) {
            action.action();
        }
        this.closeModal();
    }

    /**
     * Cerrar modal de error
     */
    closeModal() {
        const modal = document.getElementById('vyt-error-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    /**
     * Validación inline de campos
     */
    validateField(field, validationType) {
        const validationRules = {
            email: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) ? null : 'Ingresa un email válido (ej: nombre@gmail.com)';
            },
            password: (value) => {
                if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
                if (!/[A-Z]/.test(value)) return 'Incluye al menos una mayúscula';
                if (!/[0-9]/.test(value)) return 'Incluye al menos un número';
                return null;
            },
            required: (value) => {
                return value.trim() ? null : 'Este campo es obligatorio';
            },
            phone: (value) => {
                const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
                return phoneRegex.test(value) ? null : 'Ingresa un teléfono válido';
            }
        };

        const rule = validationRules[validationType];
        if (!rule) return;

        const error = rule(field.value);
        this.showFieldError(field, error);
        
        return !error;
    }

    showFieldError(field, errorMessage) {
        // Remover errores anteriores
        this.clearFieldError(field);

        if (errorMessage) {
            field.classList.add('vyt-field-error');
            field.classList.remove('vyt-field-success');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'vyt-error-text';
            errorDiv.textContent = errorMessage;
            
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        } else {
            field.classList.add('vyt-field-success');
            field.classList.remove('vyt-field-error');
            
            const successDiv = document.createElement('div');
            successDiv.className = 'vyt-success-text';
            successDiv.textContent = 'Perfecto';
            
            field.parentNode.insertBefore(successDiv, field.nextSibling);
        }
    }

    clearFieldError(field) {
        field.classList.remove('vyt-field-error', 'vyt-field-success');
        const errorText = field.parentNode.querySelector('.vyt-error-text, .vyt-success-text');
        if (errorText) {
            errorText.parentNode.removeChild(errorText);
        }
    }

    // Funciones auxiliares
    checkConnection() {
        if (navigator.onLine) {
            showToast('✅ Tu conexión a internet funciona correctamente', 'success');
        } else {
            showToast('❌ No hay conexión a internet', 'error');
        }
    }

    openSupport() {
        if (window.Tawk_API) {
            window.Tawk_API.toggle();
        } else {
            window.open('mailto:soporte@vytmusic.com?subject=Solicitud de Ayuda');
        }
    }

    showFileFormats() {
        const modal = {
            title: '📁 Formatos de archivo compatibles',
            message: 'Estos son los formatos que puedes subir:',
            solutions: [
                'Imágenes: JPG, PNG, GIF (máximo 5MB)',
                'Videos: MP4, MOV, AVI (máximo 100MB)',
                'Audio: MP3, WAV, M4A (máximo 50MB)'
            ],
            actions: [
                { text: 'Entendido', action: () => this.closeModal(), type: 'primary' }
            ]
        };
        this.showErrorModal(modal);
    }
}

// Crear instancia global
window.ErrorHandlingSystem = ErrorHandlingSystem;
window.errorSystem = new ErrorHandlingSystem();

// Funciones de conveniencia global
window.handleFirebaseError = (error) => window.errorSystem.handleFirebaseError(error);
window.handleGenericError = (message) => window.errorSystem.handleGenericError(message);
window.handleNetworkError = () => window.errorSystem.handleNetworkError();
window.handlePaymentError = (details) => window.errorSystem.handlePaymentError(details);
window.validateField = (field, type) => window.errorSystem.validateField(field, type);

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandlingSystem;
}