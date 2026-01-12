// VYT-MUSIC: Avatar Guía (VYT-Guide)
// Asistente virtual con avatar animado de cantante
// Muestra mensajes de ayuda contextuales

class VYTGuide {
    constructor() {
        this.container = null;
        this.messages = this.getContextualMessages();
        this.currentMessageIndex = 0;
        this.isMinimized = false;
        this.autoPlayInterval = null;
        this.init();
    }

    init() {
        this.createGuide();
        this.setupEventListeners();
        this.startAutoPlay();
        this.detectPageContext();
    }

    createGuide() {
        this.container = document.createElement('div');
        this.container.id = 'vyt-guide';
        this.container.className = 'vyt-guide';
        
        this.container.innerHTML = `
            <div class="guide-avatar">
                <svg viewBox="0 0 100 100" class="avatar-svg">
                    <!-- Cabeza -->
                    <circle cx="50" cy="35" r="20" fill="#1ed760" opacity="0.9"/>
                    <!-- Micrófono -->
                    <rect x="45" y="55" width="10" height="25" rx="5" fill="#ffd700"/>
                    <circle cx="50" cy="55" r="8" fill="#ffd700"/>
                    <!-- Ondas de sonido -->
                    <path d="M 30 35 Q 25 35 20 35" stroke="#1ed760" stroke-width="2" fill="none" class="sound-wave wave-1"/>
                    <path d="M 70 35 Q 75 35 80 35" stroke="#1ed760" stroke-width="2" fill="none" class="sound-wave wave-2"/>
                    <path d="M 30 45 Q 23 45 16 45" stroke="#1ed760" stroke-width="2" fill="none" opacity="0.7" class="sound-wave wave-3"/>
                    <path d="M 70 45 Q 77 45 84 45" stroke="#1ed760" stroke-width="2" fill="none" opacity="0.7" class="sound-wave wave-4"/>
                </svg>
                <div class="avatar-glow"></div>
            </div>
            
            <div class="guide-bubble">
                <div class="bubble-content" id="guide-message">
                    ¡Hola! Soy tu guía en VYT Music 🎤
                </div>
                <button class="bubble-close" id="guide-close">
                    <i class="fas fa-times"></i>
                </button>
                <div class="bubble-arrow"></div>
            </div>
            
            <button class="guide-toggle" id="guide-toggle">
                <i class="fas fa-question-circle"></i>
            </button>
        `;
        
        this.addStyles();
        document.body.appendChild(this.container);
    }

    addStyles() {
        if (document.getElementById('vyt-guide-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'vyt-guide-styles';
        styles.textContent = `
            .vyt-guide {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 999;
                display: flex;
                align-items: flex-end;
                gap: 16px;
                transition: all 0.3s ease;
            }
            
            .vyt-guide.minimized .guide-avatar,
            .vyt-guide.minimized .guide-bubble {
                display: none;
            }
            
            .guide-avatar {
                position: relative;
                width: 80px;
                height: 80px;
                background: rgba(18, 18, 18, 0.9);
                border-radius: 50%;
                border: 3px solid #1ed760;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(30, 215, 96, 0.4);
                animation: float 3s ease-in-out infinite;
            }
            
            .avatar-svg {
                width: 70%;
                height: 70%;
            }
            
            .sound-wave {
                animation: pulse-wave 1.5s infinite;
            }
            
            .wave-1 { animation-delay: 0s; }
            .wave-2 { animation-delay: 0.1s; }
            .wave-3 { animation-delay: 0.2s; }
            .wave-4 { animation-delay: 0.3s; }
            
            @keyframes pulse-wave {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }
            
            .avatar-glow {
                position: absolute;
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
                background: radial-gradient(circle, rgba(30, 215, 96, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                animation: glow-pulse 2s infinite;
                pointer-events: none;
            }
            
            @keyframes glow-pulse {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.2); opacity: 1; }
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .guide-bubble {
                position: relative;
                background: rgba(18, 18, 18, 0.95);
                backdrop-filter: blur(20px);
                border: 2px solid #1ed760;
                border-radius: 16px;
                padding: 16px 20px;
                max-width: 300px;
                box-shadow: 0 8px 32px rgba(30, 215, 96, 0.3);
                animation: slideIn 0.5s ease;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            
            .bubble-content {
                color: #f5f5f5;
                font-size: 0.875rem;
                line-height: 1.5;
                font-weight: 500;
            }
            
            .bubble-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: transparent;
                border: none;
                color: #1ed760;
                cursor: pointer;
                font-size: 0.875rem;
                padding: 4px;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .bubble-close:hover {
                background: rgba(30, 215, 96, 0.2);
                transform: scale(1.1);
            }
            
            .bubble-arrow {
                position: absolute;
                left: -10px;
                bottom: 20px;
                width: 0;
                height: 0;
                border-top: 10px solid transparent;
                border-bottom: 10px solid transparent;
                border-right: 10px solid #1ed760;
            }
            
            .guide-toggle {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, #1ed760, #1db954);
                border: 2px solid #1ed760;
                color: white;
                font-size: 1.25rem;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(30, 215, 96, 0.4);
                transition: all 0.3s ease;
            }
            
            .guide-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(30, 215, 96, 0.6);
            }
            
            .vyt-guide.minimized .guide-toggle {
                background: rgba(30, 215, 96, 0.2);
            }
            
            /* Responsive móvil */
            @media (max-width: 768px) {
                .vyt-guide {
                    bottom: 80px; /* Sobre el bottom nav */
                    left: 16px;
                    right: 16px;
                    justify-content: space-between;
                }
                
                .guide-avatar {
                    width: 60px;
                    height: 60px;
                }
                
                .guide-bubble {
                    max-width: calc(100vw - 160px);
                    font-size: 0.8125rem;
                    padding: 12px 16px;
                }
                
                .guide-toggle {
                    width: 44px;
                    height: 44px;
                    font-size: 1.125rem;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    setupEventListeners() {
        const closeBtn = document.getElementById('guide-close');
        const toggleBtn = document.getElementById('guide-toggle');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.minimize());
        }
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            this.minimize();
        } else {
            this.maximize();
        }
    }

    minimize() {
        this.container.classList.add('minimized');
        this.isMinimized = true;
        this.stopAutoPlay();
        localStorage.setItem('vyt-guide-minimized', 'true');
    }

    maximize() {
        this.container.classList.remove('minimized');
        this.isMinimized = false;
        this.startAutoPlay();
        localStorage.setItem('vyt-guide-minimized', 'false');
    }

    showMessage(message) {
        const messageElement = document.getElementById('guide-message');
        if (!messageElement) return;
        
        // Animación de salida
        messageElement.style.opacity = '0';
        
        setTimeout(() => {
            messageElement.innerHTML = message;
            messageElement.style.opacity = '1';
        }, 300);
    }

    nextMessage() {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
        this.showMessage(this.messages[this.currentMessageIndex]);
    }

    startAutoPlay() {
        if (this.autoPlayInterval) return;
        
        // Cambiar mensaje cada 8 segundos
        this.autoPlayInterval = setInterval(() => {
            if (!this.isMinimized) {
                this.nextMessage();
            }
        }, 8000);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    detectPageContext() {
        const path = window.location.pathname;
        let contextMessages = [];
        
        if (path.includes('inscripcion')) {
            contextMessages = [
                '🎬 Paso 1: Sube tu video con tu mejor interpretación',
                '⏳ Paso 2: Espera la aprobación del equipo VYT',
                '💳 Paso 3: Recibirás el link de pago por email',
                '🌟 Paso 4: ¡Aparecerás en la web y ranking!'
            ];
        } else if (path.includes('perfil')) {
            contextMessages = [
                '📝 Estado: Video subido → Espera aprobación',
                '✅ Aprobado → Recibirás link de pago',
                '💰 Pago → Apareces en la web automáticamente',
                '🏆 Activo → Comienza a recibir votos'
            ];
        } else if (path.includes('ranking')) {
            contextMessages = [
                '🏆 Los votos se actualizan en tiempo real',
                '💎 Compra VYT Money para votar',
                '⭐ Cada voto cuenta para el ranking',
                '📈 Sigue el progreso de tus favoritos'
            ];
        } else if (path.includes('principal')) {
            contextMessages = [
                '🎵 Flujo VYT: Subir → Aprobar → Pagar → ¡En Vivo!',
                '⚡ Tu video será revisado en 24-48 horas',
                '💰 Gana hasta $ ' + (window.jackpotWidgetInstance?.targetValue?.toLocaleString('es-AR') || '1,500,000'),
                '🎤 ¡Inscríbete y muestra tu talento!'
            ];
        } else {
            contextMessages = this.getContextualMessages();
        }
        
        this.messages = contextMessages;
        this.currentMessageIndex = 0;
        this.showMessage(this.messages[0]);
    }

    getContextualMessages() {
        return [
            '🎤 Flujo completo: Video → Aprobación → Pago → ¡Web!',
            '⏱️ Revisión en 24-48 horas',
            '💳 Link de pago por email y WhatsApp',
            '🌟 Publicación automática tras pagar',
            '🏆 Comienza a recibir votos',
            '📊 Sigue tus estadísticas en tiempo real',
            '💫 Tu sueño está más cerca de lo que piensas'
        ];
    }

    destroy() {
        this.stopAutoPlay();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Instancia global
let vytGuideInstance = null;

function initVYTGuide() {
    if (vytGuideInstance) {
        console.log('✅ Guía VYT ya inicializada');
        return vytGuideInstance;
    }
    
    try {
        vytGuideInstance = new VYTGuide();
        console.log('🎤 Guía VYT inicializada');
        
        // Restaurar estado minimizado
        const savedState = localStorage.getItem('vyt-guide-minimized');
        if (savedState === 'true') {
            vytGuideInstance.minimize();
        }
        
        return vytGuideInstance;
    } catch (error) {
        console.error('❌ Error al inicializar guía VYT:', error);
        return null;
    }
}

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // No inicializar en admin
        if (!window.location.pathname.includes('admin')) {
            // Delay para que cargue después del jackpot widget
            setTimeout(() => initVYTGuide(), 500);
        }
    });
} else {
    if (!window.location.pathname.includes('admin')) {
        setTimeout(() => initVYTGuide(), 500);
    }
}

// Exportar
export { initVYTGuide, VYTGuide };
