/**
 * Sistema de Optimización Móvil
 * VYT Music Online - Mobile Experience Enhancement
 */

class MobileOptimization {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.touchDevice = 'ontouchstart' in window;
        this.init();
    }

    init() {
        if (this.isMobile || this.touchDevice) {
            this.injectMobileCSS();
            this.setupMobileEnhancements();
            this.optimizeForms();
            this.setupTouchInteractions();
            this.improveNavigation();
            this.setupMobileKeyboard();
        }
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    detectTablet() {
        return /iPad|Android|Tablet/i.test(navigator.userAgent) && window.innerWidth >= 768;
    }

    injectMobileCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile-First Optimizations */
            
            /* Touch-friendly buttons */
            .btn, button, [role="button"], .mobile-touch-target {
                min-height: 44px !important;
                min-width: 44px !important;
                padding: 12px 20px !important;
                border-radius: 12px !important;
                font-size: 16px !important;
                font-weight: 500 !important;
                position: relative !important;
                overflow: hidden !important;
                transform: translateZ(0) !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            /* Touch feedback */
            .btn:active, button:active, [role="button"]:active {
                transform: scale(0.98) !important;
                transition: transform 0.1s !important;
            }

            /* Ripple effect for touch */
            .mobile-ripple {
                position: relative;
                overflow: hidden;
            }

            .mobile-ripple::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
            }

            .mobile-ripple:active::before {
                width: 300px;
                height: 300px;
            }

            /* Mobile-optimized form controls */
            @media (max-width: 768px) {
                input, select, textarea {
                    font-size: 16px !important; /* Prevents iOS zoom */
                    padding: 16px !important;
                    border-radius: 12px !important;
                    border: 2px solid #e2e8f0 !important;
                    transition: all 0.2s ease !important;
                    -webkit-appearance: none !important;
                    background-color: #fafafa !important;
                }

                input:focus, select:focus, textarea:focus {
                    border-color: #667eea !important;
                    background-color: white !important;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
                    transform: scale(1.02) !important;
                }

                /* File input improvements */
                input[type="file"] {
                    padding: 20px !important;
                    background: linear-gradient(135deg, #667eea, #764ba2) !important;
                    color: white !important;
                    border: none !important;
                    text-align: center !important;
                }

                /* Better dropdown styling */
                select {
                    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M7 10l5 5 5-5z"/></svg>') !important;
                    background-repeat: no-repeat !important;
                    background-position: right 12px center !important;
                    background-size: 20px !important;
                    padding-right: 40px !important;
                }
            }

            /* Mobile navigation improvements */
            @media (max-width: 768px) {
                .mobile-nav-bottom {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    border-top: 1px solid #e2e8f0;
                    padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    z-index: 1000;
                    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                }

                .mobile-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 8px;
                    text-decoration: none;
                    color: #6b7280;
                    transition: all 0.2s;
                    border-radius: 12px;
                    min-width: 60px;
                }

                .mobile-nav-item.active {
                    color: #667eea;
                    background: rgba(102, 126, 234, 0.1);
                }

                .mobile-nav-icon {
                    font-size: 20px;
                }

                .mobile-nav-text {
                    font-size: 10px;
                    font-weight: 500;
                }

                /* Header adjustments for mobile */
                .mobile-header {
                    position: sticky;
                    top: 0;
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 999;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .mobile-header h1 {
                    font-size: 18px !important;
                    margin: 0 !important;
                }

                .mobile-back-btn {
                    background: none;
                    border: none;
                    font-size: 18px;
                    padding: 8px;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #667eea;
                }
            }

            /* Swipe gestures */
            .swipe-container {
                touch-action: pan-y pinch-zoom;
                position: relative;
                overflow: hidden;
            }

            .swipe-item {
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Pull to refresh */
            .pull-to-refresh {
                position: relative;
                overflow: hidden;
            }

            .pull-to-refresh::before {
                content: '↓ Desliza para actualizar';
                position: absolute;
                top: -50px;
                left: 50%;
                transform: translateX(-50%);
                background: #667eea;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                transition: all 0.3s;
                opacity: 0;
            }

            .pull-to-refresh.pulling::before {
                top: 10px;
                opacity: 1;
            }

            /* Mobile-optimized cards */
            @media (max-width: 768px) {
                .card, .certamen-card {
                    margin-bottom: 16px !important;
                    border-radius: 16px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                    overflow: hidden !important;
                }

                .card-header {
                    padding: 16px !important;
                    background: linear-gradient(135deg, #667eea, #764ba2) !important;
                    color: white !important;
                    font-weight: 600 !important;
                }

                .card-content {
                    padding: 16px !important;
                }
            }

            /* Loading optimizations for mobile */
            @media (max-width: 768px) {
                .mobile-skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 8px;
                }

                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            }

            /* Safe area handling for newer phones */
            @supports (padding: env(safe-area-inset-top)) {
                .mobile-header {
                    padding-top: calc(12px + env(safe-area-inset-top));
                }

                .mobile-nav-bottom {
                    padding-bottom: calc(8px + env(safe-area-inset-bottom));
                }
            }

            /* Improved modal for mobile */
            @media (max-width: 768px) {
                .modal, .vyt-progress-modal, .vyt-error-content {
                    width: 95% !important;
                    max-height: 90vh !important;
                    margin: 20px auto !important;
                    border-radius: 20px !important;
                    max-width: none !important;
                }

                .modal-header {
                    padding: 20px 20px 10px !important;
                    position: sticky !important;
                    top: 0 !important;
                    background: white !important;
                    border-radius: 20px 20px 0 0 !important;
                }

                .modal-body {
                    padding: 10px 20px 20px !important;
                    max-height: calc(90vh - 140px) !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
            }

            /* Better scrollbars on mobile */
            ::-webkit-scrollbar {
                width: 4px;
            }

            ::-webkit-scrollbar-track {
                background: transparent;
            }

            ::-webkit-scrollbar-thumb {
                background: rgba(102, 126, 234, 0.3);
                border-radius: 2px;
            }

            /* Haptic feedback simulation */
            .haptic-feedback:active {
                animation: hapticBuzz 0.1s;
            }

            @keyframes hapticBuzz {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-1px); }
                75% { transform: translateX(1px); }
            }
        `;
        document.head.appendChild(style);
    }

    setupMobileEnhancements() {
        // Agregar meta viewport optimizado
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
            );
        }

        // Prevenir zoom en inputs en iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.style.fontSize === '' || parseInt(input.style.fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            });
        }

        // Agregar clases para detección de dispositivo
        document.body.classList.add(this.isMobile ? 'mobile-device' : 'desktop-device');
        if (this.touchDevice) document.body.classList.add('touch-device');
        if (this.isTablet) document.body.classList.add('tablet-device');
    }

    optimizeForms() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Mejorar inputs
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                // Agregar atributos optimizados para móvil
                if (input.type === 'email') {
                    input.setAttribute('inputmode', 'email');
                    input.setAttribute('autocomplete', 'email');
                }
                if (input.type === 'tel' || input.name.includes('phone')) {
                    input.setAttribute('inputmode', 'tel');
                    input.setAttribute('autocomplete', 'tel');
                }
                if (input.name.includes('name')) {
                    input.setAttribute('autocomplete', 'name');
                }

                // Mejorar UX de validación
                input.addEventListener('blur', () => {
                    this.validateInputMobile(input);
                });

                input.addEventListener('input', () => {
                    this.clearMobileError(input);
                });
            });

            // Mejorar botones de submit
            const submitBtns = form.querySelectorAll('[type="submit"], .submit-btn');
            submitBtns.forEach(btn => {
                btn.classList.add('mobile-touch-target', 'haptic-feedback');
                
                btn.addEventListener('click', () => {
                    // Simular feedback háptico
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                });
            });
        });
    }

    setupTouchInteractions() {
        // Agregar ripple effect a botones
        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
        buttons.forEach(button => {
            if (!button.classList.contains('no-ripple')) {
                button.classList.add('mobile-ripple');
            }
        });

        // Setup swipe gestures para carruseles
        this.setupSwipeGestures();

        // Setup pull to refresh
        this.setupPullToRefresh();
    }

    setupSwipeGestures() {
        const swipeContainers = document.querySelectorAll('.swipe-container, .certamen-carousel');
        
        swipeContainers.forEach(container => {
            let startX, startY, distX, distY;
            let threshold = 50; // Minimum distance for swipe
            
            container.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
            }, { passive: true });

            container.addEventListener('touchmove', (e) => {
                if (!startX || !startY) return;
                
                const touch = e.touches[0];
                distX = touch.clientX - startX;
                distY = touch.clientY - startY;
                
                // Prevent vertical scroll if horizontal swipe
                if (Math.abs(distX) > Math.abs(distY)) {
                    e.preventDefault();
                }
            }, { passive: false });

            container.addEventListener('touchend', () => {
                if (Math.abs(distX) > threshold && Math.abs(distX) > Math.abs(distY)) {
                    if (distX > 0) {
                        this.triggerSwipeRight(container);
                    } else {
                        this.triggerSwipeLeft(container);
                    }
                }
                startX = startY = distX = distY = 0;
            });
        });
    }

    setupPullToRefresh() {
        if (window.scrollY === 0) {
            let startY, currentY;
            
            document.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
            }, { passive: true });
            
            document.addEventListener('touchmove', (e) => {
                currentY = e.touches[0].clientY;
                const diff = currentY - startY;
                
                if (diff > 80 && window.scrollY === 0) {
                    document.body.classList.add('pull-to-refresh', 'pulling');
                }
            }, { passive: true });
            
            document.addEventListener('touchend', () => {
                if (document.body.classList.contains('pulling')) {
                    this.triggerRefresh();
                }
                document.body.classList.remove('pull-to-refresh', 'pulling');
            });
        }
    }

    improveNavigation() {
        // Crear navegación inferior para móviles
        if (this.isMobile && !document.querySelector('.mobile-nav-bottom')) {
            this.createBottomNavigation();
        }

        // Mejorar header móvil
        this.optimizeMobileHeader();

        // Agregar botón de "volver"
        this.addBackButton();
    }

    createBottomNavigation() {
        const navItems = [
            { icon: '🏠', text: 'Inicio', href: 'principal.html' },
            { icon: '🏆', text: 'Certámenes', href: 'certamenes.html' },
            { icon: '📝', text: 'Inscribir', href: 'inscripcion_unificada.html' },
            { icon: '👤', text: 'Perfil', href: 'perfil-artista.html' }
        ];

        const nav = document.createElement('nav');
        nav.className = 'mobile-nav-bottom';
        
        navItems.forEach(item => {
            const link = document.createElement('a');
            link.href = item.href;
            link.className = 'mobile-nav-item haptic-feedback';
            
            // Marcar como activo si es la página actual
            if (window.location.pathname.includes(item.href.replace('.html', ''))) {
                link.classList.add('active');
            }
            
            link.innerHTML = `
                <span class="mobile-nav-icon">${item.icon}</span>
                <span class="mobile-nav-text">${item.text}</span>
            `;
            
            link.addEventListener('click', () => {
                if (navigator.vibrate) navigator.vibrate(30);
            });
            
            nav.appendChild(link);
        });

        document.body.appendChild(nav);
        
        // Agregar padding bottom al contenido
        document.body.style.paddingBottom = '80px';
    }

    optimizeMobileHeader() {
        const existingHeader = document.querySelector('header, .header, nav');
        if (existingHeader && this.isMobile) {
            existingHeader.classList.add('mobile-header');
            
            // Simplificar el contenido del header para móvil
            const title = existingHeader.querySelector('h1, .title, .logo');
            if (title) {
                title.style.fontSize = '18px';
                title.style.fontWeight = 'bold';
            }
        }
    }

    addBackButton() {
        if (this.isMobile && window.location.pathname !== '/principal.html' && window.location.pathname !== '/') {
            const header = document.querySelector('.mobile-header');
            if (header) {
                const backBtn = document.createElement('button');
                backBtn.className = 'mobile-back-btn haptic-feedback';
                backBtn.innerHTML = '←';
                backBtn.onclick = () => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    window.history.back();
                };
                
                header.insertBefore(backBtn, header.firstChild);
            }
        }
    }

    setupMobileKeyboard() {
        // Ajustar viewport cuando aparece el teclado
        if (this.isMobile) {
            let originalHeight = window.innerHeight;
            
            window.addEventListener('resize', () => {
                const currentHeight = window.innerHeight;
                const heightDifference = originalHeight - currentHeight;
                
                if (heightDifference > 150) {
                    // Teclado visible
                    document.body.classList.add('keyboard-open');
                    
                    // Scroll al input activo
                    const activeInput = document.activeElement;
                    if (activeInput && activeInput.tagName === 'INPUT') {
                        setTimeout(() => {
                            activeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                    }
                } else {
                    // Teclado oculto
                    document.body.classList.remove('keyboard-open');
                }
            });
        }
    }

    // Utility methods
    validateInputMobile(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'Este campo es obligatorio';
        } else if (input.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Email no válido';
        } else if (input.type === 'tel' && value && !this.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Teléfono no válido';
        }

        if (!isValid) {
            this.showMobileError(input, errorMessage);
        } else {
            this.clearMobileError(input);
        }

        return isValid;
    }

    showMobileError(input, message) {
        input.classList.add('error');
        let errorDiv = input.parentNode.querySelector('.mobile-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'mobile-error';
            input.parentNode.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
    }

    clearMobileError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentNode.querySelector('.mobile-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    triggerSwipeLeft(container) {
        const event = new CustomEvent('swipeLeft', { detail: { container } });
        container.dispatchEvent(event);
    }

    triggerSwipeRight(container) {
        const event = new CustomEvent('swipeRight', { detail: { container } });
        container.dispatchEvent(event);
    }

    triggerRefresh() {
        showToast('🔄 Actualizando...', 'info', 2000);
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPhone(phone) {
        return /^[\+]?[0-9\s\-\(\)]{8,15}$/.test(phone);
    }

    // Public API
    static init() {
        return new MobileOptimization();
    }
}

// Auto-initialize on mobile devices
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimization = MobileOptimization.init();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimization;
}

window.MobileOptimization = MobileOptimization;