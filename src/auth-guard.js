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
      'nosotros.html',
      'certamenes.html',
      'certamenes-nuevos.html',
      'ranking.html',
      'LIMPIAR-TODO.html'
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

    // Esperar a Firebase antes de iniciar checks para evitar app/no-app
    this.waitForFirebaseThenStart();
  }

  /**
   * Verifica si Firebase ya esta listo
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
   * Espera Firebase y luego arranca el check de autenticacion
   */
  waitForFirebaseThenStart() {
    const tryStart = () => {
      if (!this.isFirebaseReady()) {
        return false;
      }

      // Usar onAuthStateChanged en lugar de polling
      this.setupAuthListener();

      return true;
    };

    if (tryStart()) return;

    if (typeof window !== 'undefined') {
      window.addEventListener('firebaseReady', () => {
        tryStart();
      }, { once: true });
    }

    // Fallback por si el evento no llega
    setTimeout(() => {
      tryStart();
    }, 10000);
  }

  /**
   * Configurar listener de autenticación (NO hace polling)
   */
  setupAuthListener() {
    if (!this.isFirebaseReady()) {
      console.warn('⚠️ Firebase Auth no disponible');
      return;
    }

    // Listener único - Firebase notifica cambios automáticamente
    firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        console.log('🚫 Usuario no autenticado - Redirigiendo a login');
        this.redirectToLogin();
      } else {
        console.log('✅ Usuario autenticado:', user.email);
      }
    });
  }

  /**
   * Redirigir a página de login
   */
  redirectToLogin() {
    // Evitar loops infinitos
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      return; // Ya estamos en index
    }

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
    // Limpieza si es necesaria
    console.log('🛑 Auth Guard destruido');
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

// Exportar para uso global
window.AuthGuard = AuthGuard;
