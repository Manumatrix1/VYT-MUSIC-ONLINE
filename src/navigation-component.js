/**
 * VYT MUSIC - Sistema de Navegación Unificado
 * Componente centralizado para Header y Menú Hamburguesa
 * Versión: 2026-01-12
 */

class VYTNavigationComponent {
    constructor(options = {}) {
        this.currentPage = this.detectCurrentPage();
        this.isAuthenticated = false;
        this.userType = null;
        this.userName = null;
        this.socialConfig = null; // Config de redes sociales desde JSON
        
        // Opciones personalizables
        this.options = {
            showAuth: options.showAuth !== false, // Por defecto true
            transparent: options.transparent || false,
            showLogo: options.showLogo !== false,
            ...options
        };
        
        this.init();
    }

    /**
     * Detecta la página actual basándose en la URL
     */
    detectCurrentPage() {
        const path = window.location.pathname || '';
        const parts = path.split('/').filter(Boolean);
        return parts.length > 0 ? parts[parts.length - 1] : 'index.html';
    }

    /**
     * Verifica si Firebase esta listo
     */
    isFirebaseReady() {
        return (
            typeof firebase !== 'undefined' &&
            firebase.apps &&
            firebase.apps.length > 0 &&
            typeof firebase.auth === 'function'
        );
    }

    /**
     * Espera a Firebase con timeout
     */
    async waitForFirebaseReady(timeout = 8000) {
        if (this.isFirebaseReady()) return true;

        if (typeof window !== 'undefined' && typeof window.waitForFirebase === 'function') {
            try {
                await window.waitForFirebase(timeout);
                return this.isFirebaseReady();
            } catch (error) {
                return false;
            }
        }

        return new Promise((resolve) => {
            let resolved = false;
            const timer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve(false);
                }
            }, timeout);

            window.addEventListener('firebaseReady', () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    resolve(true);
                }
            }, { once: true });
        });
    }

    /**
     * Inicializa el sistema de navegación
     */
    async init() {
        // Renderizar UI inmediatamente (sin esperar Firebase)
        this.injectStyles();
        this.createHeader();
        this.createHamburgerMenu();
        this.createFooter();
        this.setupEventListeners();
        console.log('✅ VYT Navigation Component - UI renderizado');
        
        // Cargar datos async (sin bloquear)
        await Promise.all([
            this.checkAuthentication(),
            this.loadSocialConfig()
        ]);
        
        // Actualizar UI con datos de autenticación
        this.updateAuthUI();
        console.log('✅ VYT Navigation Component - Datos cargados');
    }

    /**
     * Carga configuración de redes sociales desde JSON
     */
    async loadSocialConfig() {
        try {
            const cacheKey = 'vyt_assets_cache_v1';
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const data = JSON.parse(cached);
                if (data.config && data.config.redesSociales) {
                    this.socialConfig = data.config.redesSociales;
                    console.log('✅ Redes sociales cargadas desde cache');
                    return;
                }
            }

            // Si no hay cache, cargar desde JSON
            const response = await fetch('/src/vyt-assets-config.json?t=' + Date.now());
            const config = await response.json();
            
            if (config.redesSociales) {
                this.socialConfig = config.redesSociales;
                console.log('✅ Redes sociales cargadas desde JSON');
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar las redes sociales:', error);
            this.socialConfig = null;
        }
    }

    /**
     * Verifica el estado de autenticación
     */
    async checkAuthentication() {
        // Verificar si existe Firebase Auth
        if (!this.isFirebaseReady()) {
            const ready = await this.waitForFirebaseReady();
            if (!ready) return;
        }

        return new Promise((resolve) => {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    this.isAuthenticated = true;
                    this.userName = user.displayName || user.email;
                    
                    // Obtener tipo de usuario desde Firestore
                    try {
                        const db = firebase.firestore();
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        if (userDoc.exists) {
                            this.userType = userDoc.data().userType || 'visitante';
                        }
                    } catch (error) {
                        console.warn('No se pudo obtener tipo de usuario:', error);
                    }
                }
                resolve();
            });
        });
    }

    /**
     * Actualiza la UI con los datos de autenticación
     */
    updateAuthUI() {
        // Aquí se actualizaría la UI si fuera necesario
        // Por ahora, el header ya se renderizó con valores por defecto
        console.log('🔄 Auth UI actualizado:', this.isAuthenticated);
    }

    /**
     * Actualiza menú para visitante no logueado
     */
    updateMenuForGuest() {
        console.log('🔄 Menú actualizado para visitante');
        this.isAuthenticated = false;
        this.updateAuthUI();
    }

    /**
     * Inyecta los estilos CSS necesarios
     */
    injectStyles() {
        if (document.getElementById('vyt-navigation-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'vyt-navigation-styles';
        styles.textContent = `
            /* VYT Navigation Component Styles */
            .vyt-header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
            }

            .vyt-header.transparent {
                background: rgba(0, 0, 0, 0.7);
            }

            .vyt-header-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .vyt-logo {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                text-decoration: none;
                color: white;
                font-weight: bold;
                font-size: 1.25rem;
                transition: opacity 0.3s;
            }

            .vyt-logo:hover {
                opacity: 0.8;
            }

            .vyt-logo img {
                height: 40px;
                width: auto;
            }

            .vyt-nav-links {
                display: none;
                gap: 2rem;
                align-items: center;
            }

            @media (min-width: 768px) {
                .vyt-nav-links {
                    display: flex;
                }
            }

            .vyt-nav-link {
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                font-weight: 500;
                transition: color 0.3s;
                position: relative;
            }

            .vyt-nav-link:hover {
                color: #ffd700;
            }

            .vyt-nav-link.active {
                color: #ffd700;
            }

            .vyt-nav-link.active::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 0;
                right: 0;
                height: 2px;
                background: #ffd700;
            }

            .vyt-header-actions {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .vyt-btn {
                padding: 0.5rem 1.5rem;
                border-radius: 8px;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s;
                border: none;
                cursor: pointer;
                font-size: 0.95rem;
            }

            .vyt-btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .vyt-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
            }

            .vyt-btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .vyt-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .vyt-hamburger-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.3s;
            }

            @media (min-width: 768px) {
                .vyt-hamburger-btn {
                    display: none;
                }
            }

            .vyt-hamburger-btn:hover {
                color: #ffd700;
            }

            /* Menú Hamburguesa */
            .vyt-hamburger-menu {
                position: fixed;
                top: 0;
                right: -100%;
                width: 320px;
                max-width: 90vw;
                height: 100vh;
                background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
                z-index: 2000;
                transition: right 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                overflow-y: auto;
                box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
            }

            .vyt-hamburger-menu.active {
                right: 0;
            }

            .vyt-hamburger-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 1999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
            }

            .vyt-hamburger-overlay.active {
                opacity: 1;
                pointer-events: all;
            }

            .vyt-menu-header {
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .vyt-menu-header h3 {
                font-size: 1.25rem;
                font-weight: bold;
                color: white;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .vyt-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                transition: color 0.3s;
            }

            .vyt-close-btn:hover {
                color: #ffd700;
            }

            .vyt-menu-body {
                padding: 1.5rem;
            }

            .vyt-menu-section {
                margin-bottom: 2rem;
            }

            .vyt-menu-section h4 {
                font-size: 0.875rem;
                font-weight: 700;
                color: rgba(255, 255, 255, 0.6);
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 1rem;
            }

            .vyt-menu-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.875rem;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                transition: all 0.3s;
                margin-bottom: 0.5rem;
            }

            .vyt-menu-item:hover {
                background: rgba(255, 215, 0, 0.1);
                color: #ffd700;
                transform: translateX(5px);
            }

            .vyt-menu-item i {
                width: 24px;
                text-align: center;
                font-size: 1.125rem;
            }

            .vyt-menu-item.active {
                background: rgba(255, 215, 0, 0.15);
                color: #ffd700;
            }

            /* User Info */
            .vyt-user-info {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 1rem;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .vyt-user-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
            }

            .vyt-user-details {
                flex: 1;
            }

            .vyt-user-name {
                font-weight: 600;
                color: white;
                margin-bottom: 0.25rem;
            }

            .vyt-user-type {
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.6);
                text-transform: capitalize;
            }

            /* Responsive */
            @media (max-width: 767px) {
                .vyt-header-container {
                    padding: 0.75rem 1rem;
                }

                .vyt-logo {
                    font-size: 1.125rem;
                }

                .vyt-logo img {
                    height: 35px;
                }

                .vyt-btn {
                    display: none;
                }
            }

            /* Espaciado para el body */
            body.vyt-nav-active {
                padding-top: 70px;
            }

            /* Footer Unificado */
            .vyt-footer {
                background: linear-gradient(180deg, #0f0f1e 0%, #000000 100%);
                padding: 3rem 1rem 2rem;
                margin-top: 4rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .vyt-footer-content {
                max-width: 1200px;
                margin: 0 auto;
                text-align: center;
            }

            .vyt-footer-logo {
                margin-bottom: 2rem;
            }

            .vyt-footer-logo img {
                filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.3));
            }

            .vyt-footer-text {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
                margin-top: 2rem;
            }

            .vyt-footer .vyt-social-icons-container {
                padding: 1rem 0;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Crea el header principal
     */
    createHeader() {
        // Remover header existente si existe
        const existingHeader = document.getElementById('vyt-main-header');
        if (existingHeader) {
            existingHeader.remove();
        }

        const header = document.createElement('header');
        header.id = 'vyt-main-header';
        header.className = `vyt-header ${this.options.transparent ? 'transparent' : ''}`;

        header.innerHTML = `
            <div class="vyt-header-container">
                ${this.options.showLogo ? `
                    <a href="/index.html" class="vyt-logo">
                        <img src="https://i.ibb.co/Ldwq7cNx/logo-blanco.png" alt="VYT Music">
                        <span>VYT MUSIC</span>
                    </a>
                ` : '<div></div>'}

                <nav class="vyt-nav-links">
                    <a href="/index.html" class="vyt-nav-link ${this.currentPage === 'index' ? 'active' : ''}">
                        <i class="fas fa-home"></i> Inicio
                    </a>
                    <a href="/certamenes.html" class="vyt-nav-link ${this.currentPage === 'certamenes' ? 'active' : ''}">
                        <i class="fas fa-trophy"></i> Certámenes
                    </a>
                    <a href="/ranking.html" class="vyt-nav-link ${this.currentPage === 'ranking' ? 'active' : ''}">
                        <i class="fas fa-ranking-star"></i> Ranking
                    </a>
                    <a href="/reglamento.html" class="vyt-nav-link ${this.currentPage === 'reglamento' ? 'active' : ''}">
                        <i class="fas fa-file-contract"></i> Reglamento
                    </a>
                    <a href="/nosotros.html" class="vyt-nav-link ${this.currentPage === 'nosotros' ? 'active' : ''}">
                        <i class="fas fa-info-circle"></i> Nosotros
                    </a>
                </nav>

                <div class="vyt-header-actions">
                    ${this.renderAuthButtons()}
                    <button class="vyt-hamburger-btn" id="vyt-open-menu" aria-label="Abrir menú">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.insertBefore(header, document.body.firstChild);
        document.body.classList.add('vyt-nav-active');
    }

    /**
     * Renderiza los botones de autenticación
     */
    renderAuthButtons() {
        if (!this.options.showAuth) return '';

        if (this.isAuthenticated) {
            return `
                <a href="/perfil-artista.html" class="vyt-btn vyt-btn-secondary" style="display: none;">
                    <i class="fas fa-user"></i> Perfil
                </a>
            `;
        } else {
            return `
                <a href="/inscripcion-unificada.html" class="vyt-btn vyt-btn-primary">
                    <i class="fas fa-microphone"></i> Inscribirse
                </a>
                <a href="/login.html" class="vyt-btn vyt-btn-secondary" style="display: none;">
                    <i class="fas fa-sign-in-alt"></i> Ingresar
                </a>
            `;
        }
    }

    /**
     * Crea el menú hamburguesa
     */
    createHamburgerMenu() {
        // Remover menú existente si existe
        const existingMenu = document.getElementById('vyt-hamburger-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const existingOverlay = document.getElementById('vyt-hamburger-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.id = 'vyt-hamburger-overlay';
        overlay.className = 'vyt-hamburger-overlay';
        document.body.appendChild(overlay);

        // Crear menú
        const menu = document.createElement('div');
        menu.id = 'vyt-hamburger-menu';
        menu.className = 'vyt-hamburger-menu';

        menu.innerHTML = `
            <div class="vyt-menu-header">
                <h3><i class="fas fa-music"></i> VYT MUSIC</h3>
                <button class="vyt-close-btn" id="vyt-close-menu" aria-label="Cerrar menú">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="vyt-menu-body">
                ${this.isAuthenticated ? `
                    <div class="vyt-user-info">
                        <div class="vyt-user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="vyt-user-details">
                            <div class="vyt-user-name">${this.userName || 'Usuario'}</div>
                            <div class="vyt-user-type">${this.userType || 'Visitante'}</div>
                        </div>
                    </div>
                ` : ''}

                <div class="vyt-menu-section">
                    <h4>Navegación</h4>
                    <a href="/index.html" class="vyt-menu-item ${this.currentPage === 'index' ? 'active' : ''}">
                        <i class="fas fa-home"></i>
                        <span>Inicio</span>
                    </a>
                    <a href="/certamenes.html" class="vyt-menu-item ${this.currentPage === 'certamenes' ? 'active' : ''}">
                        <i class="fas fa-trophy"></i>
                        <span>Certámenes</span>
                    </a>
                    <a href="/ranking.html" class="vyt-menu-item ${this.currentPage === 'ranking' ? 'active' : ''}">
                        <i class="fas fa-ranking-star"></i>
                        <span>Ranking de Artistas</span>
                    </a>
                    <a href="/comprar-vyt-money.html" class="vyt-menu-item">
                        <i class="fas fa-coins"></i>
                        <span>Comprar VYT Money</span>
                    </a>
                </div>

                <div class="vyt-menu-section">
                    <h4>Información</h4>
                    <a href="/reglamento.html" class="vyt-menu-item ${this.currentPage === 'reglamento' ? 'active' : ''}">
                        <i class="fas fa-file-contract"></i>
                        <span>Bases y Reglamento</span>
                    </a>
                    <a href="/nosotros.html" class="vyt-menu-item ${this.currentPage === 'nosotros' ? 'active' : ''}">
                        <i class="fas fa-info-circle"></i>
                        <span>Sobre Nosotros</span>
                    </a>
                </div>

                ${this.isAuthenticated ? `
                    <div class="vyt-menu-section">
                        <h4>Mi Cuenta</h4>
                        ${this.userType === 'artista' ? `
                            <a href="/perfil-artista.html" class="vyt-menu-item">
                                <i class="fas fa-user"></i>
                                <span>Mi Perfil de Artista</span>
                            </a>
                            <a href="/inscripcion-unificada.html" class="vyt-menu-item">
                                <i class="fas fa-microphone"></i>
                                <span>Inscribirse a Certamen</span>
                            </a>
                        ` : `
                            <a href="/crear-perfil-artista.html" class="vyt-menu-item">
                                <i class="fas fa-user-plus"></i>
                                <span>Crear Perfil de Artista</span>
                            </a>
                        `}
                        <a href="#" class="vyt-menu-item" id="vyt-logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Cerrar Sesión</span>
                        </a>
                    </div>
                ` : `
                    <div class="vyt-menu-section">
                        <h4>Cuenta</h4>
                        <a href="/inscripcion-unificada.html" class="vyt-menu-item">
                            <i class="fas fa-microphone"></i>
                            <span>Inscribirse a Certamen</span>
                        </a>
                        <a href="/login.html" class="vyt-menu-item">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>Iniciar Sesión</span>
                        </a>
                        <a href="/register.html" class="vyt-menu-item">
                            <i class="fas fa-user-plus"></i>
                            <span>Crear Cuenta</span>
                        </a>
                    </div>
                `}

                <!-- Redes Sociales al final del menú -->
                ${this.renderSocialIcons()}
            </div>
        `;

        document.body.appendChild(menu);
    }

    /**
     * Renderiza iconos de redes sociales (solo si existen en JSON)
     */
    renderSocialIcons() {
        if (!this.socialConfig) return '';

        const socialNetworks = [];
        const config = this.socialConfig;

        // Mapeo de redes sociales con sus iconos y clases
        const socialMap = {
            instagram: { icon: 'fab fa-instagram', class: 'instagram' },
            tiktok: { icon: 'fab fa-tiktok', class: 'tiktok' },
            facebook: { icon: 'fab fa-facebook-f', class: 'facebook' },
            youtube: { icon: 'fab fa-youtube', class: 'youtube' },
            twitter: { icon: 'fab fa-x-twitter', class: 'x-twitter' }
        };

        // Construir array de redes activas
        for (const [network, data] of Object.entries(socialMap)) {
            if (config[network] && config[network].activo && config[network].url) {
                socialNetworks.push({
                    url: config[network].url,
                    icon: data.icon,
                    class: data.class,
                    name: network.charAt(0).toUpperCase() + network.slice(1)
                });
            }
        }

        if (socialNetworks.length === 0) return '';

        return `
            <div class="vyt-social-separator"></div>
            <div class="vyt-menu-section">
                <h4 class="vyt-social-title">Síguenos</h4>
                <div class="vyt-social-icons-container">
                    ${socialNetworks.map(social => `
                        <a href="${social.url}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="vyt-social-icon ${social.class}"
                           title="${social.name}"
                           aria-label="Visitar ${social.name}">
                            <i class="${social.icon}"></i>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Crea el footer con redes sociales
     */
    createFooter() {
        // Verificar si ya existe un footer
        let footer = document.getElementById('vyt-footer');
        if (footer) {
            footer.remove();
        }

        // Crear footer solo si hay redes sociales
        if (!this.socialConfig) return;

        footer = document.createElement('footer');
        footer.id = 'vyt-footer';
        footer.className = 'vyt-footer';

        const socialNetworks = [];
        const config = this.socialConfig;

        const socialMap = {
            instagram: { icon: 'fab fa-instagram', class: 'instagram' },
            tiktok: { icon: 'fab fa-tiktok', class: 'tiktok' },
            facebook: { icon: 'fab fa-facebook-f', class: 'facebook' },
            youtube: { icon: 'fab fa-youtube', class: 'youtube' },
            twitter: { icon: 'fab fa-x-twitter', class: 'x-twitter' }
        };

        for (const [network, data] of Object.entries(socialMap)) {
            if (config[network] && config[network].activo && config[network].url) {
                socialNetworks.push({
                    url: config[network].url,
                    icon: data.icon,
                    class: data.class,
                    name: network.charAt(0).toUpperCase() + network.slice(1)
                });
            }
        }

        if (socialNetworks.length === 0) return;

        footer.innerHTML = `
            <div class="vyt-footer-content">
                <div class="vyt-footer-logo">
                    <img src="https://i.ibb.co/Ldwq7cNx/logo-blanco.png" alt="VYT Music" height="50">
                </div>
                <div class="vyt-social-icons-container">
                    ${socialNetworks.map(social => `
                        <a href="${social.url}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="vyt-social-icon ${social.class}"
                           title="${social.name}"
                           aria-label="Visitar ${social.name}">
                            <i class="${social.icon}"></i>
                        </a>
                    `).join('')}
                </div>
                <p class="vyt-footer-text">
                    © ${new Date().getFullYear()} VYT Music. Todos los derechos reservados.
                </p>
            </div>
        `;

        document.body.appendChild(footer);
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        const openBtn = document.getElementById('vyt-open-menu');
        const closeBtn = document.getElementById('vyt-close-menu');
        const overlay = document.getElementById('vyt-hamburger-overlay');
        const menu = document.getElementById('vyt-hamburger-menu');
        const logoutBtn = document.getElementById('vyt-logout-btn');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.openMenu());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMenu());
        }

        if (overlay) {
            overlay.addEventListener('click', () => this.closeMenu());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('active')) {
                this.closeMenu();
            }
        });
    }

    /**
     * Abre el menú hamburguesa
     */
    openMenu() {
        const menu = document.getElementById('vyt-hamburger-menu');
        const overlay = document.getElementById('vyt-hamburger-overlay');
        
        if (menu && overlay) {
            menu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Cierra el menú hamburguesa
     */
    closeMenu() {
        const menu = document.getElementById('vyt-hamburger-menu');
        const overlay = document.getElementById('vyt-hamburger-overlay');
        
        if (menu && overlay) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Maneja el cierre de sesión
     */
    async handleLogout() {
        if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
            try {
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    await firebase.auth().signOut();
                }
                window.location.href = '/index.html';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert('Hubo un error al cerrar sesión. Por favor intenta nuevamente.');
            }
        }
    }
}

// Inicialización automática cuando el DOM esté listo (NO esperar Firebase)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.vytNavigation = new VYTNavigationComponent();
    });
} else {
    window.vytNavigation = new VYTNavigationComponent();
}

// Exportar para uso en otros contextos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VYTNavigationComponent;
}
