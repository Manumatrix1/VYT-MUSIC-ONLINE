// VYT-MUSIC: Widget de Pozo Dinámico con Contador Animado
// Diseño: Cristal Neón, Sticky en Desktop, Barra Superior en Móvil
// Lectura en tiempo real desde Firebase

import { db } from '../firebase-config.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

class JackpotWidget {
    constructor() {
        this.currentValue = 0;
        this.targetValue = 0;
        this.animationFrame = null;
        this.container = null;
        
        // FASE 11: Estado del usuario y etapa
        this.userStatus = null; // 'clasificado', 'aspirante', 'visitante'
        this.etapaActual = null;
        this.userZona = null;
        
        this.init();
    }

    init() {
        this.createWidget();
        this.setupRealtimeListener();
        this.loadUserStatus(); // FASE 11: Cargar estado de usuario
        this.setupResponsive();
    }

    createWidget() {
        // Crear contenedor del widget
        this.container = document.createElement('div');
        this.container.id = 'jackpot-widget';
        this.container.className = 'jackpot-widget';
        
        this.container.innerHTML = `
            <div class="jackpot-content">
                <div class="jackpot-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="jackpot-info">
                    <div class="jackpot-label" id="jackpot-label">Pozo Acumulado</div>
                    <div class="jackpot-amount" id="jackpot-counter">
                        <span class="currency">$</span>
                        <span class="value">0</span>
                    </div>
                    <div class="jackpot-context" id="jackpot-context"></div>
                </div>
                <div class="jackpot-glow"></div>
            </div>
            <button class="jackpot-minimize" id="jackpot-minimize">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // Agregar estilos inline para evitar dependencias externas
        this.addStyles();
        
        // Agregar al body
        document.body.appendChild(this.container);
        
        // Setup minimize toggle
        this.setupMinimizeToggle();
    }

    addStyles() {
        if (document.getElementById('jackpot-widget-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'jackpot-widget-styles';
        styles.textContent = `
            /* Widget Pozo - Desktop (Sticky Lateral) */
            .jackpot-widget {
                position: fixed;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 1000;
                background: rgba(18, 18, 18, 0.85);
                backdrop-filter: blur(20px);
                border: 2px solid #1ed760;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 8px 32px rgba(30, 215, 96, 0.3),
                            inset 0 0 20px rgba(30, 215, 96, 0.1);
                transition: all 0.3s ease;
                min-width: 200px;
            }
            
            .jackpot-widget.minimized {
                transform: translateY(-50%) translateX(calc(100% - 40px));
                padding: 12px;
                min-width: 40px;
            }
            
            .jackpot-widget.minimized .jackpot-content {
                opacity: 0;
                pointer-events: none;
            }
            
            .jackpot-widget.minimized .jackpot-minimize i {
                transform: rotate(180deg);
            }
            
            .jackpot-content {
                position: relative;
                text-align: center;
                transition: opacity 0.3s ease;
            }
            
            .jackpot-icon {
                font-size: 2.5rem;
                color: #ffd700;
                margin-bottom: 12px;
                animation: pulse 2s infinite;
                filter: drop-shadow(0 0 10px #ffd700);
            }
            
            .jackpot-label {
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #1ed760;
                font-weight: 700;
                margin-bottom: 8px;
            }
            
            .jackpot-amount {
                font-size: 1.75rem;
                font-weight: 900;
                color: #ffffff;
                font-family: 'Bebas Neue', 'Montserrat', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            }
            
            .jackpot-amount .currency {
                font-size: 1.25rem;
                color: #1ed760;
            }
            
            .jackpot-context {
                margin-top: 8px;
                font-size: 0.7rem;
                color: rgba(255, 255, 255, 0.7);
                text-align: center;
                line-height: 1.3;
                max-width: 180px;
                margin-left: auto;
                margin-right: auto;
            }
            
            .jackpot-context.clasificado {
                color: #ffd700;
                font-weight: 600;
            }
            
            .jackpot-context.aspirante {
                color: #1ed760;
                font-weight: 600;
            }
            
            .jackpot-glow {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 150%;
                height: 150%;
                background: radial-gradient(circle, rgba(30, 215, 96, 0.2) 0%, transparent 70%);
                pointer-events: none;
                animation: glow 3s infinite;
            }
            
            .jackpot-minimize {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(30, 215, 96, 0.2);
                border: 1px solid #1ed760;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #1ed760;
                font-size: 0.75rem;
                transition: all 0.3s ease;
            }
            
            .jackpot-minimize:hover {
                background: rgba(30, 215, 96, 0.4);
                transform: scale(1.1);
            }
            
            .jackpot-minimize i {
                transition: transform 0.3s ease;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @keyframes glow {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            
            /* Responsive: Móvil - Barra Superior */
            @media (max-width: 768px) {
                .jackpot-widget {
                    position: fixed;
                    top: 60px;
                    left: 0;
                    right: 0;
                    bottom: auto;
                    transform: none;
                    border-radius: 0;
                    border-left: none;
                    border-right: none;
                    padding: 12px 16px;
                    min-width: auto;
                }
                
                .jackpot-widget.minimized {
                    transform: translateY(-100%);
                }
                
                .jackpot-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                }
                
                .jackpot-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0;
                }
                
                .jackpot-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .jackpot-label {
                    font-size: 0.625rem;
                    margin-bottom: 0;
                    white-space: nowrap;
                }
                
                .jackpot-amount {
                    font-size: 1.25rem;
                }
                
                .jackpot-amount .currency {
                    font-size: 1rem;
                }
                
                .jackpot-minimize {
                    top: 50%;
                    transform: translateY(-50%);
                    right: 12px;
                }
                
                .jackpot-widget.minimized .jackpot-minimize i {
                    transform: rotate(90deg);
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    setupMinimizeToggle() {
        const minimizeBtn = document.getElementById('jackpot-minimize');
        if (!minimizeBtn) return;
        
        minimizeBtn.addEventListener('click', () => {
            this.container.classList.toggle('minimized');
            
            // Guardar estado en localStorage
            const isMinimized = this.container.classList.contains('minimized');
            localStorage.setItem('jackpot-minimized', isMinimized);
        });
        
        // Restaurar estado guardado
        const savedState = localStorage.getItem('jackpot-minimized');
        if (savedState === 'true') {
            this.container.classList.add('minimized');
        }
    }

    setupRealtimeListener() {
        // Escuchar cambios en tiempo real del pozo acumulado
        const pozoDocRef = doc(db, "estadisticas_generales", "resumen_certamen");
        
        onSnapshot(pozoDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.targetValue = data.pozo_total || 0;
                this.animateCounter();
            } else {
                console.warn('⚠️ Documento de estadísticas no encontrado');
                // Valor por defecto para demo
                this.targetValue = 0;
                this.updateDisplay(0);
            }
        }, (error) => {
            console.error('❌ Error en listener del pozo:', error);
        });
        
        // FASE 11: Escuchar cambios en etapa actual
        const etapaDocRef = doc(db, "system_config", "etapa_actual");
        onSnapshot(etapaDocRef, (docSnap) => {
            if (docSnap.exists()) {
                this.etapaActual = docSnap.data();
                this.updateContextMessage();
            }
        }, (error) => {
            console.log('ℹ️ No hay etapa activa configurada');
        });
    }
    
    async loadUserStatus() {
        try {
            // Importar auth dinámicamente
            const { auth } = await import('../firebase-config.js');
            const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            const { collection, query, where, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    // Usuario autenticado, buscar su participación
                    const participacionesRef = collection(db, 'participaciones');
                    const q = query(
                        participacionesRef,
                        where('uid', '==', user.uid),
                        where('estado', '==', 'activo'),
                        limit(1)
                    );
                    
                    const snapshot = await getDocs(q);
                    
                    if (!snapshot.empty) {
                        const participacion = snapshot.docs[0].data();
                        
                        if (participacion.clasificado) {
                            this.userStatus = 'clasificado';
                            this.userZona = participacion.zona;
                        } else if (participacion.ready_for_next_round) {
                            this.userStatus = 'aspirante';
                            this.userZona = participacion.zona;
                        } else {
                            this.userStatus = 'participante';
                            this.userZona = participacion.zona;
                        }
                    } else {
                        // Usuario sin participación activa
                        this.userStatus = 'visitante';
                    }
                } else {
                    // Usuario no autenticado
                    this.userStatus = 'visitante';
                }
                
                this.updateContextMessage();
            });
        } catch (error) {
            console.log('ℹ️ Estado de usuario no detectado, modo visitante');
            this.userStatus = 'visitante';
            this.updateContextMessage();
        }
    }
    
    updateContextMessage() {
        const contextElement = this.container.querySelector('#jackpot-context');
        const labelElement = this.container.querySelector('#jackpot-label');
        if (!contextElement || !labelElement) return;
        
        let message = '';
        let className = '';
        
        // Determinar mensaje según estado del usuario
        if (this.userStatus === 'clasificado' && this.etapaActual) {
            labelElement.textContent = '🏆 Compites por';
            message = `${this.etapaActual.nombre || 'Etapa Actual'}`;
            if (this.userZona) {
                message += ` - ${this.capitalizeZona(this.userZona)}`;
            }
            className = 'clasificado';
            
        } else if (this.userStatus === 'aspirante' && this.etapaActual) {
            labelElement.textContent = '🌟 Próxima Etapa';
            message = `¡Sigue sumando para ${this.capitalizeZona(this.userZona)}!`;
            className = 'aspirante';
            
        } else if (this.etapaActual) {
            // Visitante o participante sin clasificar
            labelElement.textContent = 'Pozo Actual';
            message = `${this.etapaActual.nombre || 'Etapa Actual'}`;
            className = '';
            
        } else {
            // Sin etapa configurada
            labelElement.textContent = 'Pozo Acumulado';
            message = '';
            className = '';
        }
        
        contextElement.textContent = message;
        contextElement.className = `jackpot-context ${className}`;
    }
    
    capitalizeZona(zona) {
        if (!zona) return '';
        return zona.charAt(0).toUpperCase() + zona.slice(1);
    }

    animateCounter() {
        // Cancelar animación anterior si existe
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const duration = 1500; // 1.5 segundos
        const startTime = performance.now();
        const startValue = this.currentValue;
        const difference = this.targetValue - startValue;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (easeOutCubic)
            const eased = 1 - Math.pow(1 - progress, 3);
            
            this.currentValue = startValue + (difference * eased);
            this.updateDisplay(this.currentValue);
            
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.currentValue = this.targetValue;
                this.updateDisplay(this.targetValue);
            }
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }

    updateDisplay(value) {
        const valueElement = this.container.querySelector('.jackpot-amount .value');
        if (!valueElement) return;
        
        // Formatear con separadores de miles
        const formatted = Math.round(value).toLocaleString('es-AR');
        valueElement.textContent = formatted;
        
        // Efecto de "ding" cuando llega al valor target
        if (value === this.targetValue && value > 0) {
            this.playDingEffect();
        }
    }

    playDingEffect() {
        // Añadir clase para animación visual
        const icon = this.container.querySelector('.jackpot-icon');
        if (!icon) return;
        
        icon.style.animation = 'none';
        setTimeout(() => {
            icon.style.animation = 'pulse 2s infinite';
        }, 10);
        
        // Efecto de flash en el glow
        const glow = this.container.querySelector('.jackpot-glow');
        if (glow) {
            glow.style.animation = 'none';
            setTimeout(() => {
                glow.style.animation = 'glow 3s infinite';
            }, 10);
        }
    }

    setupResponsive() {
        // Ajustar comportamiento según tamaño de pantalla
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleResize = (e) => {
            if (e.matches) {
                // Móvil: quitar minimizado por defecto
                this.container.classList.remove('minimized');
            }
        };
        
        mediaQuery.addListener(handleResize);
        handleResize(mediaQuery);
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Inicializar widget cuando el DOM esté listo
let jackpotWidgetInstance = null;

function initJackpotWidget() {
    // Solo crear una instancia
    if (jackpotWidgetInstance) {
        console.log('✅ Widget de pozo ya inicializado');
        return jackpotWidgetInstance;
    }
    
    try {
        jackpotWidgetInstance = new JackpotWidget();
        console.log('🏆 Widget de Pozo Dinámico inicializado');
        return jackpotWidgetInstance;
    } catch (error) {
        console.error('❌ Error al inicializar widget de pozo:', error);
        return null;
    }
}

// Auto-inicializar en páginas específicas
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Solo inicializar en páginas públicas, no en admin
        if (!window.location.pathname.includes('admin')) {
            initJackpotWidget();
        }
    });
} else {
    if (!window.location.pathname.includes('admin')) {
        initJackpotWidget();
    }
}

// Exportar para uso manual
export { initJackpotWidget, JackpotWidget };
