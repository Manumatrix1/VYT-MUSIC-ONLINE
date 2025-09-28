/**
 * 📱 OPTIMIZACIÓN MÓVIL VYT MUSIC
 * Solución específica para Diego (Urban): "Complicado en móvil" - 3/10
 * 
 * Problemas identificados en móvil:
 * - Formularios difíciles de usar
 * - Botones muy pequeños
 * - Carga lenta en 3G
 * - Navegación confusa
 * - Inputs que no se ven bien
 * 
 * Soluciones implementadas:
 * - Formularios rediseñados para touch
 * - Botones más grandes y accesibles
 * - Optimización de carga progresiva
 * - Navegación simplificada
 * - UI específica para mobile
 */

class VYTMobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isSlowConnection = this.detectSlowConnection();
        this.touchDevice = 'ontouchstart' in window;
        this.optimizationsApplied = false;
        
        if (this.isMobile) {
            this.init();
        }
    }

    init() {
        console.log('📱 Iniciando optimizaciones móviles para VYT...');
        
        this.applyMobileCSS();
        this.optimizeForms();
        this.improveNavigation();
        this.optimizePerformance();
        this.setupTouchGestures();
        this.addMobileHelpers();
        
        this.optimizationsApplied = true;
        console.log('✅ Optimizaciones móviles aplicadas');
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    detectSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return connection.effectiveType === 'slow-2g' || 
                   connection.effectiveType === '2g' || 
                   connection.effectiveType === '3g';
        }
        return false;
    }

    applyMobileCSS() {
        const mobileStyles = `
            /* === OPTIMIZACIONES MÓVILES VYT MUSIC === */
            
            @media (max-width: 768px) {
                /* Formularios más amigables para touch */
                input, select, textarea {
                    min-height: 48px !important;
                    font-size: 16px !important; /* Evita zoom en iOS */
                    padding: 12px 16px !important;
                    border-radius: 8px !important;
                    border: 2px solid #e2e8f0 !important;
                    background: white !important;
                    margin-bottom: 16px !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    -webkit-appearance: none !important;
                    appearance: none !important;
                }

                input:focus, select:focus, textarea:focus {
                    border-color: #00d9ff !important;
                    box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.1) !important;
                    outline: none !important;
                    transform: scale(1.02) !important;
                    transition: all 0.2s ease !important;
                }

                /* Botones más grandes y táctiles */
                .btn, button, .button, input[type="submit"] {
                    min-height: 48px !important;
                    padding: 14px 24px !important;
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    border-radius: 12px !important;
                    touch-action: manipulation !important;
                    -webkit-tap-highlight-color: transparent !important;
                    transition: all 0.2s ease !important;
                }

                .btn:active, button:active {
                    transform: scale(0.98) !important;
                }

                /* Navegación móvil mejorada */
                .bottom-navigation {
                    height: 70px !important;
                    padding: 8px !important;
                }

                .bottom-nav-item {
                    min-width: 60px !important;
                    min-height: 54px !important;
                    border-radius: 12px !important;
                }

                .bottom-nav-item i {
                    font-size: 24px !important;
                    margin-bottom: 4px !important;
                }

                .bottom-nav-item span {
                    font-size: 11px !important;
                    font-weight: 600 !important;
                }

                /* Header más compacto */
                .header-nav {
                    padding: 8px 12px !important;
                }

                /* Cards más grandes */
                .card, .participant-card, .certamen-card {
                    padding: 20px !important;
                    margin-bottom: 16px !important;
                    border-radius: 16px !important;
                }

                /* Texto más legible */
                body, p, span {
                    font-size: 15px !important;
                    line-height: 1.5 !important;
                }

                h1 { font-size: 28px !important; }
                h2 { font-size: 24px !important; }
                h3 { font-size: 20px !important; }

                /* Espaciado mejorado */
                .container, .max-w-7xl {
                    padding: 0 16px !important;
                }

                /* Modal móvil optimizado */
                .modal-content {
                    margin: 20px !important;
                    max-width: calc(100% - 40px) !important;
                    max-height: calc(100vh - 40px) !important;
                    border-radius: 16px !important;
                }

                /* Subida de archivos mejorada */
                .file-upload-area {
                    padding: 40px 20px !important;
                    border: 3px dashed #00d9ff !important;
                    border-radius: 16px !important;
                    text-align: center !important;
                    background: linear-gradient(135deg, rgba(0,217,255,0.05) 0%, rgba(102,126,234,0.05) 100%) !important;
                }

                .file-upload-area.dragover {
                    background: linear-gradient(135deg, rgba(0,217,255,0.1) 0%, rgba(102,126,234,0.1) 100%) !important;
                    transform: scale(1.02) !important;
                }

                /* Loading states más claros */
                .loading, .spinner {
                    font-size: 18px !important;
                    padding: 20px !important;
                }

                /* Error messages más visibles */
                .error, .error-message {
                    padding: 16px !important;
                    font-size: 15px !important;
                    border-radius: 12px !important;
                    margin: 16px 0 !important;
                }

                /* Success messages */
                .success, .success-message {
                    padding: 16px !important;
                    font-size: 15px !important;
                    border-radius: 12px !important;
                    margin: 16px 0 !important;
                }

                /* Video player optimizado */
                video {
                    width: 100% !important;
                    max-height: 60vh !important;
                    border-radius: 12px !important;
                }

                /* Tablas responsive */
                table {
                    font-size: 14px !important;
                }

                /* Formularios de pago */
                .payment-form {
                    padding: 20px !important;
                }

                .payment-option {
                    padding: 16px !important;
                    margin-bottom: 12px !important;
                    border-radius: 12px !important;
                    min-height: 56px !important;
                }

                /* VYT Money cards */
                .vyt-money-card {
                    padding: 20px !important;
                    margin-bottom: 16px !important;
                    border-radius: 16px !important;
                }

                /* Profile cards */
                .profile-card {
                    padding: 20px !important;
                    border-radius: 16px !important;
                }

                /* Votación más fácil */
                .vote-btn {
                    min-height: 52px !important;
                    font-size: 16px !important;
                    font-weight: bold !important;
                    border-radius: 26px !important;
                }

                /* Ranking más claro */
                .ranking-item {
                    padding: 16px !important;
                    margin-bottom: 12px !important;
                    border-radius: 12px !important;
                }

                /* Footer mejorado */
                .footer {
                    padding: 40px 20px !important;
                    margin-bottom: 80px !important; /* Espacio para nav bottom */
                }
            }

            /* === OPTIMIZACIONES PARA CONEXIONES LENTAS === */
            .vyt-slow-connection {
                /* Reducir animaciones */
                *, *::before, *::after {
                    animation-duration: 0.1s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0.1s !important;
                }

                /* Simplificar estilos */
                .glassmorphism {
                    backdrop-filter: none !important;
                    background: rgba(255,255,255,0.95) !important;
                }

                /* Lazy loading más agresivo */
                img {
                    loading: lazy !important;
                }
            }

            /* === HELPER CLASSES MÓVILES === */
            .mobile-only {
                display: none !important;
            }

            @media (max-width: 768px) {
                .mobile-only {
                    display: block !important;
                }
                
                .desktop-only {
                    display: none !important;
                }
            }

            /* === FLOATING HELP BUTTON === */
            .vyt-mobile-help {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                border-radius: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
                box-shadow: 0 4px 16px rgba(0,217,255,0.3);
                z-index: 1000;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .vyt-mobile-help:active {
                transform: scale(0.95);
            }

            /* === TOAST NOTIFICATIONS MÓVILES === */
            .vyt-mobile-toast {
                position: fixed;
                bottom: 100px;
                left: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                box-shadow: 0 4px 16px rgba(16,185,129,0.3);
                z-index: 10000;
                transform: translateY(100px);
                transition: transform 0.3s ease;
            }

            .vyt-mobile-toast.show {
                transform: translateY(0);
            }

            .vyt-mobile-toast.error {
                background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                box-shadow: 0 4px 16px rgba(239,68,68,0.3);
            }

            .vyt-mobile-toast.warning {
                background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
                box-shadow: 0 4px 16px rgba(245,158,11,0.3);
            }

            /* === PROGRESSIVE WEB APP STYLES === */
            @media (display-mode: standalone) {
                .pwa-header {
                    padding-top: env(safe-area-inset-top);
                }

                .bottom-navigation {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            }
        `;

        this.injectCSS(mobileStyles, 'vyt-mobile-optimizations');
    }

    injectCSS(css, id) {
        if (document.getElementById(id)) return;
        
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
    }

    optimizeForms() {
        console.log('📝 Optimizando formularios para móvil...');

        // Mejorar inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // Evitar zoom en iOS
            if (input.type !== 'range' && input.type !== 'checkbox') {
                input.style.fontSize = '16px';
            }

            // Agregar placeholder más descriptivos
            if (!input.placeholder && input.name) {
                const placeholders = {
                    'email': 'tu@email.com',
                    'nombre': 'Tu nombre completo',
                    'telefono': '+54 11 1234-5678',
                    'provincia': 'Selecciona tu provincia',
                    'password': 'Contraseña segura'
                };
                
                if (placeholders[input.name]) {
                    input.placeholder = placeholders[input.name];
                }
            }

            // Auto-capitalización y autocomplete apropiados
            if (input.type === 'email') {
                input.autocomplete = 'email';
                input.autocapitalize = 'none';
            } else if (input.name === 'nombre') {
                input.autocomplete = 'name';
                input.autocapitalize = 'words';
            }
        });

        // Mejorar file inputs
        this.enhanceFileInputs();
        
        // Agregar validación visual
        this.addFormValidation();
    }

    enhanceFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            // Crear área de drag & drop mejorada
            const wrapper = document.createElement('div');
            wrapper.className = 'vyt-mobile-file-upload';
            wrapper.innerHTML = `
                <div class="file-upload-area" style="
                    padding: 40px 20px;
                    border: 3px dashed #00d9ff;
                    border-radius: 16px;
                    text-align: center;
                    background: linear-gradient(135deg, rgba(0,217,255,0.05) 0%, rgba(102,126,234,0.05) 100%);
                    cursor: pointer;
                ">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #00d9ff; margin-bottom: 16px;"></i>
                    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">
                        📹 Toca para subir tu video
                    </p>
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">
                        Máximo 3 minutos • MP4, AVI, MOV
                    </p>
                    <div class="upload-progress" style="display: none; margin-top: 16px;">
                        <div style="background: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
                            <div class="progress-bar" style="height: 100%; background: #00d9ff; width: 0%; transition: width 0.3s ease;"></div>
                        </div>
                        <p class="progress-text" style="margin-top: 8px; font-size: 14px; color: #6b7280;">Subiendo...</p>
                    </div>
                </div>
            `;

            input.style.display = 'none';
            input.parentNode.insertBefore(wrapper, input);

            // Eventos
            wrapper.querySelector('.file-upload-area').addEventListener('click', () => {
                input.click();
            });

            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const area = wrapper.querySelector('.file-upload-area');
                    area.innerHTML = `
                        <i class="fas fa-check-circle" style="font-size: 32px; color: #10B981; margin-bottom: 16px;"></i>
                        <p style="font-size: 16px; font-weight: 600; color: #10B981; margin-bottom: 8px;">
                            ✅ Video seleccionado
                        </p>
                        <p style="font-size: 14px; color: #6b7280; margin: 0;">
                            ${file.name}
                        </p>
                        <button type="button" onclick="this.closest('.vyt-mobile-file-upload').querySelector('input').value=''; this.closest('.vyt-mobile-file-upload').innerHTML=''; location.reload();" 
                                style="margin-top: 12px; background: none; border: 1px solid #e5e7eb; padding: 8px 16px; border-radius: 8px; font-size: 14px; color: #6b7280;">
                            Cambiar video
                        </button>
                    `;
                }
            });
        });
    }

    addFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
                let isValid = true;

                inputs.forEach(input => {
                    if (!input.value.trim()) {
                        this.showFieldError(input, 'Este campo es obligatorio');
                        isValid = false;
                    } else {
                        this.clearFieldError(input);
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                    this.showMobileToast('Por favor completa todos los campos obligatorios', 'error');
                }
            });
        });
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        input.style.borderColor = '#EF4444';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'vyt-field-error';
        errorDiv.style.cssText = `
            color: #EF4444;
            font-size: 14px;
            margin-top: 4px;
            margin-bottom: 8px;
        `;
        errorDiv.textContent = message;
        
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }

    clearFieldError(input) {
        input.style.borderColor = '#e2e8f0';
        const error = input.parentNode.querySelector('.vyt-field-error');
        if (error) {
            error.remove();
        }
    }

    improveNavigation() {
        console.log('🧭 Mejorando navegación móvil...');

        // Hacer botones de navegación más grandes
        const navButtons = document.querySelectorAll('.bottom-nav-item, .nav-item, .header-nav a');
        navButtons.forEach(btn => {
            btn.style.minHeight = '44px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
        });

        // Mejorar el hamburger menu
        this.enhanceHamburgerMenu();

        // Agregar gestos de swipe
        this.addSwipeGestures();
    }

    enhanceHamburgerMenu() {
        const hamburger = document.querySelector('.hamburger, .menu-toggle, #hamburger-menu-trigger');
        const menu = document.querySelector('.mobile-menu, .nav-menu');

        if (hamburger && menu) {
            // Hacer el botón más grande
            hamburger.style.cssText = `
                width: 44px !important;
                height: 44px !important;
                padding: 8px !important;
                border-radius: 8px !important;
                background: rgba(255,255,255,0.1) !important;
                backdrop-filter: blur(10px) !important;
            `;

            // Mejorar el menú
            menu.style.cssText = `
                backdrop-filter: blur(20px) !important;
                background: rgba(0,0,0,0.9) !important;
            `;

            // Agregar animación de apertura suave
            hamburger.addEventListener('click', () => {
                menu.style.transform = 'translateX(0)';
                menu.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        }
    }

    addSwipeGestures() {
        let startX = 0;
        let currentX = 0;
        let isSwipeDetected = false;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        document.addEventListener('touchmove', (e) => {
            if (!startX) return;
            currentX = e.touches[0].clientX;
            const diffX = startX - currentX;

            if (Math.abs(diffX) > 30 && !isSwipeDetected) {
                isSwipeDetected = true;
                
                if (diffX > 0) {
                    // Swipe left - siguiente
                    this.handleSwipeLeft();
                } else {
                    // Swipe right - anterior
                    this.handleSwipeRight();
                }
            }
        });

        document.addEventListener('touchend', () => {
            startX = 0;
            currentX = 0;
            isSwipeDetected = false;
        });
    }

    handleSwipeLeft() {
        // Implementar navegación con swipe
        const currentPage = window.location.pathname;
        const pages = ['index.html', 'inscripcion_unificada.html', 'principal.html', 'perfil.html'];
        const currentIndex = pages.findIndex(page => currentPage.includes(page));
        
        if (currentIndex >= 0 && currentIndex < pages.length - 1) {
            // window.location.href = pages[currentIndex + 1];
            this.showMobileToast('Desliza hacia la derecha para volver', 'info');
        }
    }

    handleSwipeRight() {
        // Volver atrás
        if (window.history.length > 1) {
            window.history.back();
        }
    }

    optimizePerformance() {
        console.log('⚡ Optimizando performance móvil...');

        if (this.isSlowConnection) {
            document.body.classList.add('vyt-slow-connection');
            this.optimizeForSlowConnection();
        }

        // Lazy loading agresivo
        this.implementLazyLoading();
        
        // Preload crítico
        this.preloadCriticalResources();

        // Service Worker para cache
        this.registerServiceWorker();
    }

    optimizeForSlowConnection() {
        console.log('🐌 Optimizando para conexión lenta...');

        // Reducir calidad de imágenes
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && !img.dataset.optimized) {
                // Implementar compresión de imágenes si es posible
                img.loading = 'lazy';
                img.dataset.optimized = 'true';
            }
        });

        // Simplificar animaciones
        const style = document.createElement('style');
        style.textContent = `
            .vyt-slow-connection * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
        `;
        document.head.appendChild(style);

        // Mostrar indicador de conexión lenta
        this.showMobileToast('Conexión lenta detectada. Optimizando experiencia...', 'warning');
    }

    implementLazyLoading() {
        // Intersction Observer para lazy loading
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }

    preloadCriticalResources() {
        // Preload CSS y JS críticos
        const criticalResources = [
            '/src/navigation-styles.css',
            '/firebase-config.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('✅ Service Worker registrado para cache');
                })
                .catch(error => {
                    console.log('⚠️ Error registrando Service Worker:', error);
                });
        }
    }

    setupTouchGestures() {
        console.log('👆 Configurando gestos táctiles...');

        // Mejorar feedback táctil
        const touchElements = document.querySelectorAll('button, .btn, a, .clickable');
        touchElements.forEach(element => {
            element.style.webkitTapHighlightColor = 'transparent';
            element.style.touchAction = 'manipulation';

            element.addEventListener('touchstart', () => {
                element.style.opacity = '0.7';
            });

            element.addEventListener('touchend', () => {
                element.style.opacity = '1';
            });
        });

        // Pull to refresh (simple)
        this.setupPullToRefresh();
    }

    setupPullToRefresh() {
        let startY = 0;
        let isRefreshing = false;

        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && !isRefreshing) {
                const currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;

                if (pullDistance > 100) {
                    this.showMobileToast('Suelta para actualizar', 'info');
                }
            }
        });

        document.addEventListener('touchend', (e) => {
            if (window.scrollY === 0 && !isRefreshing) {
                const currentY = e.changedTouches[0].clientY;
                const pullDistance = currentY - startY;

                if (pullDistance > 100) {
                    this.performRefresh();
                }
            }
        });
    }

    performRefresh() {
        this.showMobileToast('Actualizando...', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    addMobileHelpers() {
        console.log('🔧 Agregando helpers móviles...');

        // Botón de ayuda flotante
        const helpButton = document.createElement('button');
        helpButton.className = 'vyt-mobile-help';
        helpButton.innerHTML = '?';
        helpButton.onclick = () => {
            if (window.vytOnboarding) {
                window.vytOnboarding.startOnboarding();
            } else {
                this.showMobileToast('Toca dos veces cualquier elemento para obtener ayuda', 'info');
            }
        };
        
        document.body.appendChild(helpButton);

        // Detección de doble tap para ayuda contextual
        this.setupDoubleTapHelp();
    }

    setupDoubleTapHelp() {
        let lastTapTime = 0;
        
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
            
            if (tapLength < 500 && tapLength > 0) {
                // Doble tap detectado
                const element = e.target;
                this.showContextualHelp(element);
            }
            
            lastTapTime = currentTime;
        });
    }

    showContextualHelp(element) {
        const helpMessages = {
            'input': 'Toca aquí para escribir. El teclado se abrirá automáticamente.',
            'button': 'Toca este botón para continuar.',
            'select': 'Toca para ver las opciones disponibles.',
            'a': 'Este enlace te llevará a otra página.',
            'video': 'Toca para reproducir el video.',
            'img': 'Imagen del participante o contenido.'
        };

        const tagName = element.tagName.toLowerCase();
        const message = helpMessages[tagName] || 'Elemento interactivo. Toca para usar.';

        this.showMobileToast(`💡 ${message}`, 'info');
    }

    showMobileToast(message, type = 'info') {
        // Remover toast anterior si existe
        const existingToast = document.querySelector('.vyt-mobile-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `vyt-mobile-toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Mostrar con animación
        setTimeout(() => toast.classList.add('show'), 100);

        // Ocultar después de 4 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Método público para forzar optimizaciones
    forceOptimization() {
        if (!this.optimizationsApplied) {
            this.init();
        }
    }

    // Método para verificar si las optimizaciones están activas
    isOptimized() {
        return this.optimizationsApplied;
    }
}

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.vytMobileOptimizer = new VYTMobileOptimizer();
});

// Hacer disponible globalmente
window.VYTMobileOptimizer = VYTMobileOptimizer;

console.log('📱 VYT Mobile Optimizer loaded successfully!');