/**
 * AUTH GUARD - Sistema de protección de rutas
 * Redirige automáticamente a login si el usuario no está autenticado
 */

class AuthGuard {
  constructor() {
    this.publicPages = [
      'index.html',
      'login.html',
      'register.html',
      'registro-visitante.html',
      'nosotros.html'
    ];
    
    this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
    this.checkInterval = null;
  }

  /**
   * Verificar si la página actual es pública
   */
  isPublicPage() {
    return this.publicPages.some(page => 
      this.currentPage.includes(page) || this.currentPage === '' || this.currentPage === '/'
    );
  }

  /**
   * Iniciar guardián de autenticación
   */
  init() {
    // Si es página pública, no hacer nada
    if (this.isPublicPage()) {
      console.log('🔓 Página pública - Auth Guard desactivado');
      return;
    }

    console.log('🔒 Auth Guard activado para:', this.currentPage);

    // Verificar autenticación inmediatamente
    this.checkAuth();

    // Verificar cada 2 segundos si el usuario sigue autenticado
    this.checkInterval = setInterval(() => {
      this.checkAuth();
    }, 2000);
  }

  /**
   * Verificar estado de autenticación
   */
  checkAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn('⚠️ Firebase Auth no disponible aún');
      return;
    }

    const user = firebase.auth().currentUser;

    if (!user) {
      console.log('🚫 Usuario no autenticado - Redirigiendo a login');
      this.redirectToLogin();
    } else {
      console.log('✅ Usuario autenticado:', user.email);
    }
  }

  /**
   * Redirigir a página de login
   */
  redirectToLogin() {
    // Guardar la página actual para volver después del login
    sessionStorage.setItem('redirect_after_login', window.location.href);
    
    // Redirigir a login
    window.location.href = '/index.html';
  }

  /**
   * Redirigir a página guardada después del login
   */
  static redirectAfterLogin() {
    const savedRedirect = sessionStorage.getItem('redirect_after_login');
    
    if (savedRedirect && !savedRedirect.includes('index.html')) {
      sessionStorage.removeItem('redirect_after_login');
      window.location.href = savedRedirect;
    } else {
      window.location.href = '/principal.html';
    }
  }

  /**
   * Detener verificación
   */
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Inicializar Auth Guard automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.authGuard = new AuthGuard();
    window.authGuard.init();
  });
} else {
  window.authGuard = new AuthGuard();
  window.authGuard.init();
}

// Verificar cuando Firebase Auth esté listo
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged((user) => {
    if (!user && window.authGuard && !window.authGuard.isPublicPage()) {
      console.log('🔐 Auth cambió - Usuario deslogueado');
      window.authGuard.redirectToLogin();
    }
  });
}

// Exportar para uso global
window.AuthGuard = AuthGuard;
