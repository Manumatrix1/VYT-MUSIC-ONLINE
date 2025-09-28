/**
 * 🎯 SISTEMA DE ONBOARDING GUIADO VYT MUSIC
 * Solución específica para la confusión reportada por María y Carlos
 * 
 * Problemas identificados:
 * - María: "Funcionó pero confuso" 
 * - Carlos: "Bonito pero complejo"
 * 
 * Soluciones implementadas:
 * - Tour interactivo paso a paso
 * - Tooltips contextuales
 * - Indicadores de progreso
 * - Explicaciones claras en cada paso
 */

class VYTOnboardingSystem {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.progressBar = null;
        this.userType = 'new'; // new, returning, experienced
        this.completedSteps = JSON.parse(localStorage.getItem('vyt_onboarding_completed') || '[]');
        
        this.init();
    }

    init() {
        console.log('🎯 Iniciando Sistema de Onboarding VYT...');
        this.createOnboardingElements();
        this.detectUserContext();
        this.setupEventListeners();
        
        // Auto-start para usuarios nuevos
        setTimeout(() => {
            if (this.shouldShowOnboarding()) {
                this.startOnboarding();
            }
        }, 2000);
    }

    detectUserContext() {
        // Detectar si el usuario es nuevo
        const hasVisited = localStorage.getItem('vyt_has_visited');
        const hasAccount = localStorage.getItem('vyt_user_data');
        
        if (!hasVisited) {
            this.userType = 'new';
            localStorage.setItem('vyt_has_visited', 'true');
        } else if (!hasAccount) {
            this.userType = 'returning';
        } else {
            this.userType = 'experienced';
        }
        
        console.log(`👤 Tipo de usuario detectado: ${this.userType}`);
    }

    shouldShowOnboarding() {
        // Solo mostrar para usuarios nuevos o que no completaron
        return this.userType === 'new' || this.completedSteps.length < 3;
    }

    createOnboardingElements() {
        // Crear overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'vyt-onboarding-overlay';
        this.overlay.className = 'vyt-onboarding-overlay';
        
        // Crear tooltip principal
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'vyt-onboarding-tooltip';
        this.tooltip.className = 'vyt-onboarding-tooltip';
        
        // Crear barra de progreso
        this.progressBar = document.createElement('div');
        this.progressBar.id = 'vyt-onboarding-progress';
        this.progressBar.className = 'vyt-onboarding-progress';
        
        // Estilos dinámicos
        this.injectStyles();
        
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.tooltip);
        document.body.appendChild(this.progressBar);
    }

    injectStyles() {
        const styles = `
            .vyt-onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9998;
                display: none;
                backdrop-filter: blur(2px);
            }

            .vyt-onboarding-overlay.active {
                display: block;
                animation: fadeIn 0.3s ease-out;
            }

            .vyt-onboarding-tooltip {
                position: fixed;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                max-width: 350px;
                z-index: 9999;
                display: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .vyt-onboarding-tooltip.active {
                display: block;
                animation: slideInUp 0.4s ease-out;
            }

            .vyt-onboarding-tooltip h3 {
                margin: 0 0 10px 0;
                font-size: 18px;
                font-weight: bold;
            }

            .vyt-onboarding-tooltip p {
                margin: 0 0 15px 0;
                font-size: 14px;
                line-height: 1.5;
                opacity: 0.9;
            }

            .vyt-onboarding-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 20px;
            }

            .vyt-onboarding-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
                font-size: 13px;
            }

            .vyt-onboarding-btn.primary {
                background: white;
                color: #667eea;
            }

            .vyt-onboarding-btn.secondary {
                background: transparent;
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
            }

            .vyt-onboarding-btn:hover {
                transform: translateY(-1px);
                shadow: 0 4px 12px rgba(0,0,0,0.2);
            }

            .vyt-onboarding-progress {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 10px 15px;
                border-radius: 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 10000;
                display: none;
                font-size: 12px;
                font-weight: 600;
                color: #667eea;
            }

            .vyt-onboarding-progress.active {
                display: block;
                animation: slideInDown 0.3s ease-out;
            }

            .vyt-step-highlight {
                position: relative;
                z-index: 9999;
                box-shadow: 0 0 0 4px #667eea, 0 0 0 8px rgba(102, 126, 234, 0.3);
                border-radius: 8px;
                animation: pulse 2s infinite;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes pulse {
                0%, 100% { box-shadow: 0 0 0 4px #667eea, 0 0 0 8px rgba(102, 126, 234, 0.3); }
                50% { box-shadow: 0 0 0 6px #667eea, 0 0 0 12px rgba(102, 126, 234, 0.2); }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .vyt-onboarding-tooltip {
                    max-width: 280px;
                    padding: 15px;
                }
                
                .vyt-onboarding-progress {
                    top: 10px;
                    right: 10px;
                    padding: 8px 12px;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    setupEventListeners() {
        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.endOnboarding();
            }
        });

        // Botón de ayuda flotante
        this.createHelpButton();
    }

    createHelpButton() {
        const helpBtn = document.createElement('button');
        helpBtn.innerHTML = '🎯 Tour Guiado';
        helpBtn.className = 'vyt-help-button';
        helpBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
        `;

        helpBtn.addEventListener('mouseenter', () => {
            helpBtn.style.transform = 'translateY(-2px)';
            helpBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        });

        helpBtn.addEventListener('mouseleave', () => {
            helpBtn.style.transform = 'translateY(0)';
            helpBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
        });

        helpBtn.addEventListener('click', () => {
            this.startOnboarding();
        });

        document.body.appendChild(helpBtn);
    }

    startOnboarding() {
        console.log('🎯 Iniciando tour guiado...');
        
        this.isActive = true;
        this.currentStep = 0;
        
        this.overlay.classList.add('active');
        this.progressBar.classList.add('active');
        
        // Determinar pasos según la página
        this.steps = this.getStepsForCurrentPage();
        this.totalSteps = this.steps.length;
        
        if (this.steps.length > 0) {
            this.showStep(0);
        }
    }

    getStepsForCurrentPage() {
        const pathname = window.location.pathname;
        const page = pathname.split('/').pop().replace('.html', '') || 'index';
        
        const stepsByPage = {
            index: this.getIndexSteps(),
            'inscripcion_unificada': this.getInscriptionSteps(),
            'perfil': this.getProfileSteps(),
            'principal': this.getPrincipalSteps(),
            'login': this.getLoginSteps()
        };
        
        return stepsByPage[page] || this.getGenericSteps();
    }

    getIndexSteps() {
        return [
            {
                target: 'hero-section, .hero-content, h1',
                title: '🎤 ¡Bienvenido a VYT Music!',
                content: 'Esta es la plataforma de canto online #1 de Argentina. Aquí puedes participar en certámenes, votar por artistas y ganar premios increíbles.',
                position: 'center'
            },
            {
                target: '.inscripcion-btn, .btn-primary, [href*="inscripcion"]',
                title: '📝 Tu Primer Paso: Inscribirse',
                content: 'Haz clic aquí para registrarte y crear tu perfil de artista. Es rápido, fácil y ¡totalmente seguro!',
                position: 'top'
            },
            {
                target: '.certamen-section, .info-cards, .feature-cards',
                title: '🏆 Cómo Funcionan los Certámenes',
                content: 'Los certámenes duran 15 días. Subes tu video, otros votan, ¡y puedes ganar grandes premios! Todo es transparente y justo.',
                position: 'top'
            },
            {
                target: '.navigation, .bottom-nav, .header-nav',
                title: '🧭 Navegación Fácil',
                content: 'Usa esta navegación para moverte por la plataforma. Todo está a un clic de distancia.',
                position: 'bottom'
            }
        ];
    }

    getInscriptionSteps() {
        return [
            {
                target: '.form-container, .inscripcion-form',
                title: '📋 Formulario de Inscripción',
                content: 'Completa este formulario con tus datos. No te preocupes, es súper simple y tus datos están protegidos.',
                position: 'top'
            },
            {
                target: 'input[type="email"], #email',
                title: '📧 Tu Email',
                content: 'Usa un email que revises seguido. Te enviaremos actualizaciones importantes sobre tu participación.',
                position: 'bottom'
            },
            {
                target: 'select, .provincia-select',
                title: '📍 Tu Provincia',
                content: 'Selecciona tu provincia. Los certámenes están organizados por región para ser más justos.',
                position: 'top'
            },
            {
                target: '.video-upload, input[type="file"]',
                title: '🎬 Subir Tu Video',
                content: 'Aquí subes tu video cantando. Tip: usa buena iluminación y audio claro. ¡Máximo 3 minutos!',
                position: 'top'
            },
            {
                target: '.submit-btn, button[type="submit"]',
                title: '🚀 ¡Enviar Inscripción!',
                content: 'Una vez que completes todo, haz clic aquí. Revisaremos tu video en máximo 48 horas.',
                position: 'top'
            }
        ];
    }

    getPrincipalSteps() {
        return [
            {
                target: '.certamen-card, .participant-card',
                title: '👥 Aquí Están los Participantes',
                content: 'Estos son los artistas compitiendo. Puedes votar por tus favoritos usando VYT-Money.',
                position: 'top'
            },
            {
                target: '.vote-btn, .votar-btn',
                title: '🗳️ Cómo Votar',
                content: 'Cada voto cuesta VYT-Money. Mientras más votos des, más posibilidades de ganar tiene el artista.',
                position: 'top'
            },
            {
                target: '.vyt-money, .balance',
                title: '💰 Tu Balance VYT-Money',
                content: 'Aquí ves cuánto VYT-Money tienes. Puedes comprar más para seguir votando.',
                position: 'bottom'
            },
            {
                target: '.ranking, .leaderboard',
                title: '🏆 Ranking en Vivo',
                content: 'El ranking se actualiza en tiempo real. ¡Los primeros lugares se llevan los mejores premios!',
                position: 'top'
            }
        ];
    }

    getLoginSteps() {
        return [
            {
                target: '.login-form, #loginForm',
                title: '🔐 Iniciar Sesión',
                content: 'Ingresa con tu email y contraseña. Si olvidaste tu contraseña, puedes recuperarla fácilmente.',
                position: 'top'
            },
            {
                target: '.register-link, .create-account',
                title: '👤 ¿Primera Vez?',
                content: 'Si es tu primera vez, crea una cuenta nueva. Es gratis y toma solo 2 minutos.',
                position: 'top'
            }
        ];
    }

    getProfileSteps() {
        return [
            {
                target: '.profile-info, .artist-info',
                title: '🎤 Tu Perfil de Artista',
                content: 'Aquí está toda tu información. Puedes editarla cuando quieras.',
                position: 'top'
            },
            {
                target: '.video-section, .my-videos',
                title: '📹 Tus Videos',
                content: 'Aquí aparecen todos los videos que has subido y su estado de aprobación.',
                position: 'top'
            },
            {
                target: '.stats, .estadisticas',
                title: '📊 Tus Estadísticas',
                content: 'Revisa cuántos votos tienes, tu posición en el ranking y tu progreso.',
                position: 'top'
            }
        ];
    }

    getGenericSteps() {
        return [
            {
                target: 'body',
                title: '🎵 Navegando por VYT Music',
                content: 'Esta plataforma es fácil de usar. Si necesitas ayuda, siempre puedes hacer clic en el botón de "Tour Guiado".',
                position: 'center'
            }
        ];
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.endOnboarding();
            return;
        }

        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;

        // Actualizar progreso
        this.updateProgress();

        // Encontrar elemento target
        const targetElement = this.findTargetElement(step.target);
        
        if (targetElement) {
            this.highlightElement(targetElement);
            this.showTooltip(step, targetElement);
        } else {
            // Si no encuentra el elemento, mostrar tooltip centrado
            this.showCenteredTooltip(step);
        }

        // Scroll hacia el elemento si es necesario
        if (targetElement) {
            this.scrollToElement(targetElement);
        }
    }

    findTargetElement(selector) {
        const selectors = selector.split(', ');
        
        for (const sel of selectors) {
            const element = document.querySelector(sel.trim());
            if (element) {
                return element;
            }
        }
        
        return null;
    }

    highlightElement(element) {
        // Remover highlight anterior
        document.querySelectorAll('.vyt-step-highlight').forEach(el => {
            el.classList.remove('vyt-step-highlight');
        });

        // Agregar highlight al elemento actual
        element.classList.add('vyt-step-highlight');
    }

    showTooltip(step, targetElement) {
        const rect = targetElement.getBoundingClientRect();
        
        this.tooltip.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.content}</p>
            <div class="vyt-onboarding-controls">
                <button class="vyt-onboarding-btn secondary" onclick="window.vytOnboarding.skipOnboarding()">
                    Saltar Tour
                </button>
                <div>
                    ${this.currentStep > 0 ? `<button class="vyt-onboarding-btn secondary" onclick="window.vytOnboarding.previousStep()">Anterior</button>` : ''}
                    <button class="vyt-onboarding-btn primary" onclick="window.vytOnboarding.nextStep()">
                        ${this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        `;

        // Posicionar tooltip
        this.positionTooltip(step.position || 'bottom', rect);
        
        this.tooltip.classList.add('active');
    }

    showCenteredTooltip(step) {
        this.tooltip.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.content}</p>
            <div class="vyt-onboarding-controls">
                <button class="vyt-onboarding-btn secondary" onclick="window.vytOnboarding.skipOnboarding()">
                    Saltar Tour
                </button>
                <div>
                    ${this.currentStep > 0 ? `<button class="vyt-onboarding-btn secondary" onclick="window.vytOnboarding.previousStep()">Anterior</button>` : ''}
                    <button class="vyt-onboarding-btn primary" onclick="window.vytOnboarding.nextStep()">
                        ${this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        `;

        // Centrar tooltip
        this.tooltip.style.top = '50%';
        this.tooltip.style.left = '50%';
        this.tooltip.style.transform = 'translate(-50%, -50%)';
        
        this.tooltip.classList.add('active');
    }

    positionTooltip(position, targetRect) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 15;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
                
            case 'bottom':
                top = targetRect.bottom + 15;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
                
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - 15;
                break;
                
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + 15;
                break;
                
            default: // center
                top = viewportHeight / 2 - tooltipRect.height / 2;
                left = viewportWidth / 2 - tooltipRect.width / 2;
        }
        
        // Ajustar si se sale de la pantalla
        if (left < 10) left = 10;
        if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        if (top < 10) top = 10;
        if (top + tooltipRect.height > viewportHeight - 10) {
            top = viewportHeight - tooltipRect.height - 10;
        }
        
        this.tooltip.style.top = top + 'px';
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.transform = 'none';
    }

    scrollToElement(element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isVisible) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }

    updateProgress() {
        this.progressBar.textContent = `Paso ${this.currentStep + 1} de ${this.totalSteps}`;
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.completeOnboarding();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    skipOnboarding() {
        if (confirm('¿Seguro que quieres saltar el tour? Te ayudará a entender mejor la plataforma.')) {
            this.endOnboarding();
        }
    }

    completeOnboarding() {
        // Marcar como completado
        const completedSteps = [...this.completedSteps];
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        
        if (!completedSteps.includes(currentPage)) {
            completedSteps.push(currentPage);
            localStorage.setItem('vyt_onboarding_completed', JSON.stringify(completedSteps));
        }

        // Mostrar mensaje de completado
        this.showCompletionMessage();
        
        setTimeout(() => {
            this.endOnboarding();
        }, 3000);
    }

    showCompletionMessage() {
        this.tooltip.innerHTML = `
            <h3>🎉 ¡Tour Completado!</h3>
            <p>Ahora ya sabes cómo usar VYT Music. Si tienes dudas, siempre puedes repetir el tour desde el botón de ayuda.</p>
            <div class="vyt-onboarding-controls">
                <button class="vyt-onboarding-btn primary" onclick="window.vytOnboarding.endOnboarding()">
                    ¡Perfecto, Entendido!
                </button>
            </div>
        `;

        // Centrar mensaje
        this.tooltip.style.top = '50%';
        this.tooltip.style.left = '50%';
        this.tooltip.style.transform = 'translate(-50%, -50%)';
    }

    endOnboarding() {
        this.isActive = false;
        
        // Remover highlights
        document.querySelectorAll('.vyt-step-highlight').forEach(el => {
            el.classList.remove('vyt-step-highlight');
        });

        // Ocultar elementos
        this.overlay.classList.remove('active');
        this.tooltip.classList.remove('active');
        this.progressBar.classList.remove('active');

        console.log('✅ Tour de onboarding finalizado');
    }

    // Métodos públicos para casos específicos
    showContextualHelp(selector, message) {
        const element = document.querySelector(selector);
        if (!element) return;

        const helpTooltip = document.createElement('div');
        helpTooltip.className = 'vyt-contextual-help';
        helpTooltip.innerHTML = `
            <div style="background: #667eea; color: white; padding: 10px 15px; border-radius: 8px; font-size: 13px; max-width: 250px;">
                ${message}
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; float: right; cursor: pointer;">×</button>
            </div>
        `;

        const rect = element.getBoundingClientRect();
        helpTooltip.style.position = 'fixed';
        helpTooltip.style.top = (rect.bottom + 10) + 'px';
        helpTooltip.style.left = rect.left + 'px';
        helpTooltip.style.zIndex = '10000';

        document.body.appendChild(helpTooltip);

        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (helpTooltip.parentElement) {
                helpTooltip.remove();
            }
        }, 5000);
    }

    // Reiniciar onboarding (para testing)
    resetOnboarding() {
        localStorage.removeItem('vyt_onboarding_completed');
        localStorage.removeItem('vyt_has_visited');
        this.completedSteps = [];
        this.userType = 'new';
        console.log('🔄 Onboarding reiniciado');
    }
}

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.vytOnboarding = new VYTOnboardingSystem();
});

// Hacer disponible globalmente
window.VYTOnboardingSystem = VYTOnboardingSystem;

// Exportar para uso con módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VYTOnboardingSystem;
}

console.log('🎯 VYT Onboarding System loaded successfully!');