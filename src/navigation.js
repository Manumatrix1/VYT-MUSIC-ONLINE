// Sistema de Navegación Moderno para VYT Music
// Estilo app móvil (Facebook, Spotify, Instagram)

class VYTNavigation {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('principal') || path === '/') return 'principal';
        if (path.includes('certamen')) return 'certamenes';
        if (path.includes('ranking') || path.includes('resultados')) return 'ranking';
        if (path.includes('inscripcion')) return 'inscripcion';
        if (path.includes('perfil')) return 'perfil';
        return 'principal';
    }

    init() {
        this.createBottomNavigation();
        this.createHamburgerMenu();
        this.setupEventListeners();
    }

    createBottomNavigation() {
        const bottomNav = document.createElement('nav');
        bottomNav.className = 'bottom-navigation';
        bottomNav.innerHTML = `
            <div class="bottom-nav-container">
                <a href="/principal.html" class="nav-item ${this.currentPage === 'principal' ? 'active' : ''}" data-page="principal">
                    <div class="nav-icon">
                        <i class="fas fa-home"></i>
                    </div>
                    <span class="nav-label">Inicio</span>
                </a>
                
                <a href="/certamenes.html" class="nav-item ${this.currentPage === 'certamenes' ? 'active' : ''}" data-page="certamenes">
                    <div class="nav-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <span class="nav-label">Certámenes</span>
                </a>
                
                <a href="/inscripcion-unificada.html" class="nav-item ${this.currentPage === 'inscripcion' ? 'active' : ''}" data-page="inscripcion">
                    <div class="nav-icon">
                        <i class="fas fa-pen-to-square"></i>
                    </div>
                    <span class="nav-label">Inscribirse</span>
                </a>
                
                <a href="/ranking.html" class="nav-item ${this.currentPage === 'ranking' ? 'active' : ''}" data-page="ranking">
                    <div class="nav-icon">
                        <i class="fas fa-ranking-star"></i>
                    </div>
                    <span class="nav-label">Ranking</span>
                </a>
                
                <a href="/perfil-artista.html" class="nav-item ${this.currentPage === 'perfil' ? 'active' : ''}" data-page="perfil">
                    <div class="nav-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <span class="nav-label">Perfil</span>
                </a>
                
                <button class="nav-item hamburger-trigger" id="hamburger-btn">
                    <div class="nav-icon">
                        <i class="fas fa-bars"></i>
                    </div>
                    <span class="nav-label">Menú</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(bottomNav);
    }

    createHamburgerMenu() {
        const hamburgerMenu = document.createElement('div');
        hamburgerMenu.className = 'hamburger-menu';
        hamburgerMenu.id = 'hamburger-menu';
        hamburgerMenu.innerHTML = `
            <div class="hamburger-overlay"></div>
            <div class="hamburger-content">
                <div class="hamburger-header">
                    <h3><i class="fas fa-music"></i> VYT Music</h3>
                    <button class="close-hamburger" id="close-hamburger">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="hamburger-body">
                    <div class="menu-section">
                        <h4>Principal</h4>
                        <a href="/crear-perfil-artista.html" class="menu-item">
                            <i class="fas fa-user-plus"></i>
                            <span>Crear Perfil de Artista</span>
                        </a>
                        <a href="/reglamento.html" class="menu-item">
                            <i class="fas fa-file-alt"></i>
                            <span>Bases y Reglamento</span>
                        </a>
                    </div>
                    
                    <div class="menu-section">
                        <h4>Mi Cuenta</h4>
                        <a href="/perfil-artista.html" class="menu-item">
                            <i class="fas fa-user-circle"></i>
                            <span>Perfil de Artista</span>
                        </a>
                        <a href="/login-artista.html" class="menu-item">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>Iniciar Sesión</span>
                        </a>
                    </div>
                    
                    <div class="menu-section">
                        <h4>VYT Money</h4>
                        <a href="/comprar-vyt-money.html" class="menu-item">
                            <i class="fas fa-coins"></i>
                            <span>Comprar VYT Money</span>
                        </a>
                    </div>
                    
                    <div class="menu-section">
                        <h4>Información</h4>
                        <a href="/nosotros.html" class="menu-item">
                            <i class="fas fa-info-circle"></i>
                            <span>Sobre Nosotros</span>
                        </a>
                        <a href="/index.html" class="menu-item">
                            <i class="fas fa-arrow-left"></i>
                            <span>Volver al Inicio</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(hamburgerMenu);
    }

    setupEventListeners() {
        // Hamburger menu toggle
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const closeBtn = document.getElementById('close-hamburger');
        const overlay = hamburgerMenu.querySelector('.hamburger-overlay');

        hamburgerBtn?.addEventListener('click', () => {
            hamburgerMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeMenu = () => {
            hamburgerMenu.classList.remove('active');
            document.body.style.overflow = '';
        };

        closeBtn?.addEventListener('click', closeMenu);
        overlay?.addEventListener('click', closeMenu);

        // ESC key to close menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && hamburgerMenu.classList.contains('active')) {
                closeMenu();
            }
        });

        // Bottom navigation highlighting
        const navItems = document.querySelectorAll('.bottom-navigation .nav-item[data-page]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
}

// Auto-initialize navigation if we're not on excluded pages
function initNavigation() {
    const excludedPages = ['index.html', 'admin.html', 'admin-', 'debug-', 'init-', 'reset-'];
    const currentPath = window.location.pathname;
    
    const shouldShowNav = !excludedPages.some(page => 
        currentPath.includes(page) || currentPath === '/' && !currentPath.includes('principal')
    );

    if (shouldShowNav) {
        new VYTNavigation();
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}