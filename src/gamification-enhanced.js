/**
 * VYT MUSIC - Sistema de Gamificación Interactiva
 * Proporciona feedback visual y lógica de interacción mejorada
 * Versión: 2026-01-12
 */

class VYTGamification {
    constructor() {
        this.animations = {
            click: 'vyt-click-pulse',
            success: 'vyt-success-bounce',
            error: 'vyt-error-shake',
            loading: 'vyt-loading-spin'
        };
        
        this.sounds = {
            click: null,
            success: null,
            error: null,
            vote: null
        };
        
        this.init();
    }

    /**
     * Inicializa el sistema de gamificación
     */
    init() {
        this.injectStyles();
        this.setupGlobalListeners();
        console.log('✅ VYT Gamification System inicializado');
    }

    /**
     * Inyecta los estilos CSS de animaciones
     */
    injectStyles() {
        if (document.getElementById('vyt-gamification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'vyt-gamification-styles';
        styles.textContent = `
            /* VYT Gamification Styles */
            
            @keyframes vyt-click-pulse {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }
            
            @keyframes vyt-success-bounce {
                0%, 100% { transform: translateY(0); }
                25% { transform: translateY(-10px); }
                75% { transform: translateY(-5px); }
            }
            
            @keyframes vyt-error-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            
            @keyframes vyt-loading-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes vyt-glow-pulse {
                0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
                50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.6); }
            }
            
            @keyframes vyt-confetti-fall {
                0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            
            .vyt-interactive {
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }
            
            .vyt-interactive:hover {
                transform: translateY(-2px);
                filter: brightness(1.1);
            }
            
            .vyt-interactive:active {
                transform: translateY(0);
                filter: brightness(0.9);
            }
            
            .vyt-btn-primary:not(:disabled) {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            
            .vyt-btn-primary:not(:disabled):hover {
                box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
                animation: vyt-glow-pulse 2s infinite;
            }
            
            .vyt-btn-success:not(:disabled) {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
            }
            
            .vyt-btn-danger:not(:disabled) {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
            }
            
            .vyt-btn-disabled,
            .vyt-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                filter: grayscale(0.5);
            }
            
            .vyt-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
            }
            
            .vyt-loading-overlay.active {
                opacity: 1;
                pointer-events: all;
            }
            
            .vyt-spinner {
                width: 60px;
                height: 60px;
                border: 5px solid rgba(255, 255, 255, 0.2);
                border-top-color: #ffd700;
                border-radius: 50%;
                animation: vyt-loading-spin 1s linear infinite;
            }
            
            .vyt-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                transform: translateX(400px);
                transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            
            .vyt-toast.show {
                transform: translateX(0);
            }
            
            .vyt-toast-success {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }
            
            .vyt-toast-error {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
            }
            
            .vyt-toast-info {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
            }
            
            .vyt-toast-warning {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
            }
            
            .vyt-ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: vyt-ripple-animation 0.6s ease-out;
                pointer-events: none;
            }
            
            @keyframes vyt-ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .vyt-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ef4444;
                color: white;
                font-size: 12px;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 20px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
            }
            
            .vyt-confetti {
                position: fixed;
                width: 10px;
                height: 10px;
                pointer-events: none;
                z-index: 9999;
            }
            
            /* Card hover effects */
            .vyt-card {
                transition: all 0.3s ease;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .vyt-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
                border-color: rgba(102, 126, 234, 0.5);
            }
            
            /* Progress bar */
            .vyt-progress {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
            }
            
            .vyt-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                transition: width 0.5s ease;
                position: relative;
            }
            
            .vyt-progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: vyt-progress-shimmer 2s infinite;
            }
            
            @keyframes vyt-progress-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Configura listeners globales
     */
    setupGlobalListeners() {
        // Agregar clase interactive a todos los botones y enlaces
        document.addEventListener('DOMContentLoaded', () => {
            this.enhanceButtons();
        });
        
        // Re-aplicar cuando se agreguen nuevos elementos
        const observer = new MutationObserver(() => {
            this.enhanceButtons();
        });
        
        // Solo observar si document.body existe
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            // Si body no existe aún, esperar a DOMContentLoaded
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
    }

    /**
     * Mejora botones con efectos interactivos
     */
    enhanceButtons() {
        const buttons = document.querySelectorAll('button:not(.vyt-enhanced), .btn:not(.vyt-enhanced)');
        
        buttons.forEach(btn => {
            if (!btn.classList.contains('vyt-enhanced')) {
                btn.classList.add('vyt-interactive', 'vyt-enhanced');
                
                // Agregar efecto ripple
                btn.addEventListener('click', (e) => {
                    this.createRipple(e, btn);
                    this.animateClick(btn);
                });
                
                // Console log para debugging (solo si no está deshabilitado)
                btn.addEventListener('click', () => {
                    if (!btn.disabled) {
                        console.log('🎯 Click en botón:', btn.textContent?.trim() || btn.getAttribute('aria-label'));
                    }
                });
            }
        });
    }

    /**
     * Crea efecto ripple en un elemento
     */
    createRipple(event, element) {
        const ripple = document.createElement('span');
        ripple.classList.add('vyt-ripple');
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Anima click en elemento
     */
    animateClick(element) {
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'vyt-click-pulse 0.3s ease';
        }, 10);
    }

    /**
     * Muestra loading overlay
     */
    showLoading(message = 'Cargando...') {
        let overlay = document.getElementById('vyt-loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'vyt-loading-overlay';
            overlay.className = 'vyt-loading-overlay';
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="vyt-spinner mx-auto mb-4"></div>
                    <p class="text-white text-lg font-semibold" id="vyt-loading-text">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        const textEl = overlay.querySelector('#vyt-loading-text');
        if (textEl) textEl.textContent = message;
        
        setTimeout(() => overlay.classList.add('active'), 10);
    }

    /**
     * Oculta loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('vyt-loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * Muestra toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `vyt-toast vyt-toast-${type}`;
        
        const icon = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        }[type] || 'ℹ️';
        
        toast.innerHTML = `
            <span style="font-size: 24px;">${icon}</span>
            <span style="flex: 1; font-weight: 500;">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    /**
     * Celebración con confetti
     */
    celebrate() {
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'vyt-confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-10px';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animation = `vyt-confetti-fall ${2 + Math.random() * 2}s linear`;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
        
        this.showToast('¡Felicitaciones! 🎉', 'success', 4000);
    }

    /**
     * Actualiza progress bar
     */
    updateProgress(elementId, percentage) {
        const progressBar = document.querySelector(`#${elementId} .vyt-progress-bar`);
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }

    /**
     * Agrega badge a un elemento
     */
    addBadge(element, count) {
        let badge = element.querySelector('.vyt-badge');
        
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'vyt-badge';
            element.style.position = 'relative';
            element.appendChild(badge);
        }
        
        badge.textContent = count > 99 ? '99+' : count;
        
        if (count === 0) {
            badge.remove();
        }
    }

    /**
     * Anima contador numérico
     */
    animateCounter(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === end) {
                clearInterval(timer);
            }
        }, stepTime);
    }
}

// Crear instancia global
window.vytGamification = new VYTGamification();

// Funciones helper globales para fácil acceso
window.showLoading = (msg) => window.vytGamification.showLoading(msg);
window.hideLoading = () => window.vytGamification.hideLoading();
window.showToast = (msg, type, duration) => window.vytGamification.showToast(msg, type, duration);
window.celebrate = () => window.vytGamification.celebrate();

console.log('🎮 VYT Gamification System cargado - Todos los botones ahora tienen feedback visual');
