/**
 * NAV-GLOBAL.JS - Sistema centralizado de navegación
 * Menú hamburguesa + Bottom Nav unificado para toda la app
 */

class GlobalNavigation {
  constructor() {
    this.currentUser = null;
    this.userType = null;
    this.initialized = false;
  }

  /**
   * Inicializar navegación global
   */
  async init() {
    await this.loadUserData();
    this.render();
    this.setupEventListeners();
    this.setActivePage();
    this.initialized = true;
    console.log('✅ Navegación global inicializada');
  }

  /**
   * Cargar datos del usuario
   */
  async loadUserData() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) {
        this.currentUser = user;
        // Intentar obtener userType de localStorage o Firestore
        this.userType = localStorage.getItem('userType') || 'visitante';
      }
    }
  }

  /**
   * Renderizar menú completo
   */
  render() {
    this.renderHamburger();
    this.renderBottomNav();
  }

  /**
   * Renderizar menú hamburguesa (desktop/tablet)
   */
  renderHamburger() {
    const header = document.querySelector('header');
    if (!header) return;

    // Verificar si ya existe
    if (document.querySelector('.hamburger-menu')) return;

    const hamburgerHTML = `
      <div class="hamburger-menu">
        <button class="hamburger-button" aria-label="Abrir menú">
          <i class="fas fa-bars"></i>
        </button>
        <nav class="hamburger-dropdown" style="display: none;">
          <ul>
            <li><a href="/principal.html"><i class="fas fa-home"></i> Inicio</a></li>
            <li><a href="/certamenes.html"><i class="fas fa-trophy"></i> Certámenes</a></li>
            <li><a href="/ranking.html"><i class="fas fa-chart-line"></i> Ranking</a></li>
            <li><a href="/comprar-vyt-money.html"><i class="fas fa-wallet"></i> VYT Money</a></li>
            <li><a href="/perfil.html"><i class="fas fa-user"></i> Mi Perfil</a></li>
            ${this.userType === 'artista' ? '<li><a href="/perfil-artista.html"><i class="fas fa-microphone"></i> Perfil Artista</a></li>' : ''}
            <li class="separator"></li>
            <li><a href="#" class="logout-link"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a></li>
          </ul>
        </nav>
      </div>
    `;

    header.insertAdjacentHTML('afterbegin', hamburgerHTML);
  }

  /**
   * Renderizar Bottom Navigation (mobile)
   */
  renderBottomNav() {
    // Verificar si ya existe
    if (document.querySelector('.bottom-nav-global')) return;

    const bottomNavHTML = `
      <nav class="bottom-nav-global">
        <a href="/principal.html" class="nav-item" data-page="principal">
          <i class="fas fa-home"></i>
          <span>Inicio</span>
        </a>
        <a href="/certamenes.html" class="nav-item" data-page="certamenes">
          <i class="fas fa-trophy"></i>
          <span>Certámenes</span>
        </a>
        <a href="/comprar-vyt-money.html" class="nav-item" data-page="vyt-money">
          <i class="fas fa-wallet"></i>
          <span>VYT Money</span>
        </a>
        <a href="/perfil.html" class="nav-item" data-page="perfil">
          <i class="fas fa-user"></i>
          <span>Perfil</span>
        </a>
      </nav>
    `;

    document.body.insertAdjacentHTML('beforeend', bottomNavHTML);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Hamburger toggle
    const hamburgerButton = document.querySelector('.hamburger-button');
    const hamburgerDropdown = document.querySelector('.hamburger-dropdown');

    if (hamburgerButton && hamburgerDropdown) {
      hamburgerButton.addEventListener('click', () => {
        const isVisible = hamburgerDropdown.style.display === 'block';
        hamburgerDropdown.style.display = isVisible ? 'none' : 'block';
      });

      // Cerrar al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.hamburger-menu')) {
          hamburgerDropdown.style.display = 'none';
        }
      });
    }

    // Logout
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.logout();
      });
    }
  }

  /**
   * Marcar página activa
   */
  setActivePage() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'principal';
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      const page = item.dataset.page;
      if (page === currentPage) {
        item.classList.add('active');
      }
    });
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      try {
        await firebase.auth().signOut();
        localStorage.clear();
        window.location.href = '/index.html';
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Intenta nuevamente.');
      }
    }
  }
}

// CSS para navegación global
const navGlobalStyles = `
  <style>
    /* ===== HAMBURGER MENU ===== */
    .hamburger-menu {
      position: relative;
      z-index: 1000;
    }

    .hamburger-button {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      display: none;
    }

    @media (min-width: 769px) {
      .hamburger-button {
        display: block;
      }
    }

    .hamburger-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      background: #0a0a0f;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      min-width: 200px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .hamburger-dropdown ul {
      list-style: none;
      margin: 0;
      padding: 0.5rem 0;
    }

    .hamburger-dropdown li {
      margin: 0;
    }

    .hamburger-dropdown li.separator {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0.5rem 0;
    }

    .hamburger-dropdown a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      transition: all 0.2s;
    }

    .hamburger-dropdown a:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #00d9ff;
    }

    .hamburger-dropdown i {
      width: 20px;
      text-align: center;
    }

    /* ===== BOTTOM NAV ===== */
    .bottom-nav-global {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #0a0a0f;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-around;
      padding: 0.5rem 0;
      z-index: 999;
      display: none;
    }

    @media (max-width: 768px) {
      .bottom-nav-global {
        display: flex;
      }

      /* Agregar padding al body para que el contenido no quede debajo */
      body {
        padding-bottom: 80px;
      }
    }

    .bottom-nav-global .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      padding: 0.5rem 1rem;
      transition: all 0.2s;
      flex: 1;
      max-width: 100px;
    }

    .bottom-nav-global .nav-item i {
      font-size: 1.5rem;
    }

    .bottom-nav-global .nav-item span {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .bottom-nav-global .nav-item.active {
      color: #00d9ff;
    }

    .bottom-nav-global .nav-item:hover {
      color: #00d9ff;
      background: rgba(0, 217, 255, 0.1);
    }

    /* Safe area para dispositivos con notch */
    @supports (padding: env(safe-area-inset-bottom)) {
      .bottom-nav-global {
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
  </style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', navGlobalStyles);

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.globalNav = new GlobalNavigation();
    window.globalNav.init();
  });
} else {
  window.globalNav = new GlobalNavigation();
  window.globalNav.init();
}

// Exportar para uso global
window.GlobalNavigation = GlobalNavigation;
