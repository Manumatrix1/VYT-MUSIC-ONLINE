/**
 * Sistema de Integración Principal - VYT Music Online
 * Conecta todos los sistemas de optimización de UX
 */

class VYTSystemIntegration {
    constructor() {
        this.systems = {};
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Cargar todos los sistemas de optimización
            await this.loadSystems();
            
            // Integrar con el sistema existente
            this.integrateWithExistingSystems();
            
            // Setup de eventos globales
            this.setupGlobalEvents();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            console.log('🎵 VYT Systems Integration: Inicializado correctamente');
            
            // Notificar éxito si hay sistema de toast
            if (window.showToast) {
                setTimeout(() => {
                    showToast('✨ Experiencia optimizada cargada', 'success', 2000);
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error inicializando VYT Systems:', error);
            this.handleInitializationError(error);
        }
    }

    async loadSystems() {
        // Los sistemas se cargan automáticamente con sus scripts
        // Aquí validamos que estén disponibles
        
        const systemChecks = [
            { name: 'ProgressSystem', check: () => window.progressSystem },
            { name: 'ErrorHandling', check: () => window.errorSystem },
            { name: 'MobileOptimization', check: () => window.mobileOptimization },
            { name: 'PerformanceOptimization', check: () => window.performanceOptimization }
        ];

        // Esperar a que todos los sistemas estén listos
        for (const system of systemChecks) {
            let attempts = 0;
            while (!system.check() && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (system.check()) {
                this.systems[system.name] = system.check();
                console.log(`✅ ${system.name} cargado`);
            } else {
                console.warn(`⚠️ ${system.name} no disponible`);
            }
        }
    }

    integrateWithExistingSystems() {
        // Integrar con Firebase Auth
        this.integrateWithFirebaseAuth();
        
        // Integrar con formularios existentes
        this.integrateWithForms();
        
        // Integrar con sistema de pagos
        this.integrateWithPayments();
        
        // Integrar con uploads
        this.integrateWithUploads();
        
        // Integrar con navegación
        this.integrateWithNavigation();
    }

    integrateWithFirebaseAuth() {
        if (typeof initializeFirebase === 'function') {
            // Interceptar errores de autenticación
            const originalAuth = window.signInWithEmailAndPassword;
            if (originalAuth) {
                window.signInWithEmailAndPassword = async (...args) => {
                    try {
                        // Mostrar progreso
                        if (this.systems.ProgressSystem) {
                            showProgress('auth-login', {
                                title: '🔐 Iniciando sesión',
                                message: 'Verificando credenciales...',
                                icon: '👤'
                            });
                        }
                        
                        const result = await originalAuth.apply(this, args);
                        
                        // Ocultar progreso con éxito
                        if (this.systems.ProgressSystem) {
                            hideProgress('auth-login', true);
                        }
                        
                        return result;
                        
                    } catch (error) {
                        // Ocultar progreso
                        if (this.systems.ProgressSystem) {
                            hideProgress('auth-login', false);
                        }
                        
                        // Mostrar error amigable
                        if (this.systems.ErrorHandling) {
                            handleFirebaseError(error);
                        }
                        
                        throw error;
                    }
                };
            }
        }
    }

    integrateWithForms() {
        // Mejorar todos los formularios del sistema
        document.addEventListener('submit', async (e) => {
            const form = e.target;
            if (!form.tagName === 'FORM') return;
            
            // Determinar tipo de formulario
            const formType = this.detectFormType(form);
            
            // Aplicar mejoras específicas
            this.enhanceFormSubmission(form, formType, e);
        });

        // Mejorar validación de campos en tiempo real
        document.addEventListener('input', (e) => {
            const field = e.target;
            if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA' || field.tagName === 'SELECT') {
                this.enhanceFieldValidation(field);
            }
        });
    }

    detectFormType(form) {
        const action = form.action || form.getAttribute('action') || '';
        const id = form.id || '';
        const classes = form.className || '';
        
        if (action.includes('login') || id.includes('login') || classes.includes('login')) {
            return 'login';
        }
        if (action.includes('register') || id.includes('register') || classes.includes('register')) {
            return 'register';
        }
        if (action.includes('inscripcion') || id.includes('inscripcion') || classes.includes('inscripcion')) {
            return 'inscription';
        }
        if (action.includes('pago') || id.includes('payment') || classes.includes('payment')) {
            return 'payment';
        }
        
        return 'generic';
    }

    enhanceFormSubmission(form, formType, event) {
        // Prevenir submit múltiple
        if (form.dataset.submitting === 'true') {
            event.preventDefault();
            return;
        }
        
        form.dataset.submitting = 'true';
        
        // Mostrar indicador de progreso apropiado
        const progressConfig = this.getProgressConfigForForm(formType);
        if (this.systems.ProgressSystem && progressConfig) {
            showProgress(formType + '-submit', progressConfig);
        }
        
        // Agregar timeout de seguridad
        setTimeout(() => {
            form.dataset.submitting = 'false';
            if (this.systems.ProgressSystem) {
                hideProgress(formType + '-submit', false);
            }
        }, 30000); // 30 segundos timeout
        
        // Interceptar resultado
        this.interceptFormResult(form, formType);
    }

    getProgressConfigForForm(formType) {
        const configs = {
            login: {
                title: '🔐 Iniciando sesión',
                message: 'Verificando tus credenciales...',
                icon: '👤',
                steps: ['Validación', 'Autenticación', 'Redirección']
            },
            register: {
                title: '📝 Creando cuenta',
                message: 'Configurando tu perfil de artista...',
                icon: '🎵',
                steps: ['Validación', 'Creación', 'Perfil', 'Completado']
            },
            inscription: {
                title: '🏆 Procesando inscripción',
                message: 'Registrando tu participación...',
                icon: '📋',
                steps: ['Datos', 'Validación', 'Pago', 'Confirmación']
            },
            payment: {
                title: '💳 Procesando pago',
                message: 'Validando información de pago...',
                icon: '💰',
                steps: ['Validación', 'Procesamiento', 'Confirmación']
            }
        };
        
        return configs[formType];
    }

    enhanceFieldValidation(field) {
        if (!this.systems.ErrorHandling) return;
        
        // Determinar tipo de validación
        let validationType = 'required';
        
        if (field.type === 'email') validationType = 'email';
        else if (field.type === 'password') validationType = 'password';
        else if (field.type === 'tel') validationType = 'phone';
        
        // Aplicar validación
        validateField(field, validationType);
    }

    integrateWithPayments() {
        // Interceptar procesos de pago para mostrar progreso
        if (window.MercadoPago || window.mp) {
            this.enhancePaymentFlow();
        }
    }

    enhancePaymentFlow() {
        // Hook para cuando se inicia un pago
        const originalCreatePayment = window.createPayment || function() {};
        window.createPayment = async (...args) => {
            try {
                // Mostrar progreso de pago
                if (this.systems.ProgressSystem) {
                    showProgress('payment-process', {
                        title: '💳 Procesando pago',
                        message: 'Conectando con MercadoPago...',
                        icon: '💰',
                        steps: ['Conexión', 'Validación', 'Procesamiento', 'Confirmación'],
                        currentStep: 0
                    });
                }
                
                const result = await originalCreatePayment.apply(this, args);
                
                // Actualizar progreso
                if (this.systems.ProgressSystem) {
                    updateProgress('payment-process', {
                        currentStep: 2,
                        message: 'Pago en procesamiento...'
                    });
                }
                
                return result;
                
            } catch (error) {
                // Ocultar progreso
                if (this.systems.ProgressSystem) {
                    hideProgress('payment-process', false);
                }
                
                // Mostrar error de pago
                if (this.systems.ErrorHandling) {
                    handlePaymentError(error.message);
                }
                
                throw error;
            }
        };
    }

    integrateWithUploads() {
        // Mejorar todos los uploads de archivos
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file') {
                this.enhanceFileUpload(e.target);
            }
        });
    }

    enhanceFileUpload(input) {
        const files = input.files;
        if (!files || files.length === 0) return;
        
        // Mostrar progreso de upload
        if (this.systems.ProgressSystem) {
            showProgress('file-upload', {
                title: '📁 Subiendo archivo',
                message: `Procesando ${files[0].name}...`,
                icon: '☁️',
                showProgress: true,
                progress: 0
            });
            
            // Simular progreso (en producción usar evento real de Firebase)
            this.simulateUploadProgress();
        }
    }

    simulateUploadProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 95) progress = 95;
            
            updateProgress('file-upload', {
                progress: Math.round(progress),
                message: `Subiendo... ${Math.round(progress)}%`
            });
            
            if (progress >= 95) {
                clearInterval(interval);
                setTimeout(() => {
                    updateProgress('file-upload', {
                        progress: 100,
                        message: '¡Archivo subido exitosamente!'
                    });
                    setTimeout(() => {
                        hideProgress('file-upload', true);
                    }, 1000);
                }, 500);
            }
        }, 200);
    }

    integrateWithNavigation() {
        // Mejorar transiciones entre páginas
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && this.shouldEnhanceNavigation(link)) {
                this.enhancePageTransition(link, e);
            }
        });
    }

    shouldEnhanceNavigation(link) {
        const href = link.href;
        // Solo mejorar enlaces internos
        return href && 
               href.includes(window.location.origin) && 
               !href.includes('#') && 
               !link.target === '_blank';
    }

    enhancePageTransition(link, event) {
        // Solo aplicar en desktop o tablets
        if (window.mobileOptimization && window.mobileOptimization.isMobile) {
            return; // El sistema móvil maneja esto
        }
        
        event.preventDefault();
        
        // Mostrar indicador de carga de página
        if (this.systems.ProgressSystem) {
            showProgress('page-transition', {
                title: '🔄 Cargando página',
                message: 'Un momento por favor...',
                icon: '📄',
                showProgress: false
            });
        }
        
        // Navegar después de un breve delay
        setTimeout(() => {
            window.location.href = link.href;
        }, 300);
    }

    interceptFormResult(form, formType) {
        // Esta función se ejecutaría después del submit
        // En la implementación real, se integraría con los handlers existentes
        
        form.addEventListener('formSuccess', () => {
            form.dataset.submitting = 'false';
            if (this.systems.ProgressSystem) {
                hideProgress(formType + '-submit', true);
            }
        });
        
        form.addEventListener('formError', (e) => {
            form.dataset.submitting = 'false';
            if (this.systems.ProgressSystem) {
                hideProgress(formType + '-submit', false);
            }
            if (this.systems.ErrorHandling) {
                handleGenericError(e.detail.message);
            }
        });
    }

    setupGlobalEvents() {
        // Manejar errores globales no capturados
        window.addEventListener('unhandledrejection', (e) => {
            if (this.systems.ErrorHandling) {
                handleFirebaseError(e.reason);
            }
        });
        
        // Manejar pérdida de conexión
        window.addEventListener('offline', () => {
            if (window.showToast) {
                showToast('📶 Sin conexión a internet', 'error', 5000);
            }
        });
        
        window.addEventListener('online', () => {
            if (window.showToast) {
                showToast('🌐 Conexión restablecida', 'success', 3000);
            }
        });
        
        // Teclas rápidas para testing
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + D = Debug info
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                this.showDebugInfo();
            }
            
            // Ctrl/Cmd + Shift + C = Clear caches
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                this.clearAllCaches();
            }
        });
    }

    showDebugInfo() {
        const info = {
            systems: Object.keys(this.systems),
            performance: window.getPerformanceStats ? getPerformanceStats() : 'N/A',
            mobile: window.mobileOptimization ? {
                isMobile: mobileOptimization.isMobile,
                isTablet: mobileOptimization.isTablet,
                touchDevice: mobileOptimization.touchDevice
            } : 'N/A',
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                saveData: navigator.connection.saveData
            } : 'N/A'
        };
        
        console.table(info);
        
        if (window.showToast) {
            showToast('🔍 Debug info en consola', 'info', 2000);
        }
    }

    clearAllCaches() {
        if (window.clearPerformanceCache) {
            clearPerformanceCache();
        }
        
        // Limpiar localStorage de datos temporales
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('vyt_temp_') || key.includes('_cache')) {
                localStorage.removeItem(key);
            }
        });
        
        if (window.showToast) {
            showToast('🧹 Todos los caches limpiados', 'success', 2000);
        }
    }

    handleInitializationError(error) {
        console.error('VYT Integration Error:', error);
        
        // Mostrar notificación discreta
        if (window.showToast) {
            showToast('⚠️ Algunas optimizaciones no se cargaron', 'warning', 4000);
        }
        
        // Intentar inicialización parcial
        this.initializeBasicFallbacks();
    }

    initializeBasicFallbacks() {
        // Fallbacks básicos si los sistemas avanzados fallan
        
        // Fallback para indicadores de progreso
        if (!this.systems.ProgressSystem) {
            window.showProgress = (id, config) => {
                console.log(`Progress: ${config.title} - ${config.message}`);
            };
            window.hideProgress = (id) => {
                console.log(`Progress finished: ${id}`);
            };
        }
        
        // Fallback para manejo de errores
        if (!this.systems.ErrorHandling) {
            window.handleFirebaseError = (error) => {
                alert(`Error: ${error.message || error}`);
            };
        }
    }

    // API pública
    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            systems: Object.keys(this.systems),
            systemCount: Object.keys(this.systems).length
        };
    }

    restartSystems() {
        this.isInitialized = false;
        this.systems = {};
        this.init();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.vytIntegration = new VYTSystemIntegration();
});

// Export
window.VYTSystemIntegration = VYTSystemIntegration;