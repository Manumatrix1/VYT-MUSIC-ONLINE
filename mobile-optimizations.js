/**
 * VYT MUSIC - Optimizaciones para Móvil
 * CSS y JavaScript para mejorar la experiencia en dispositivos móviles
 */

// Detectar tipo de dispositivo
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Aplicar clase al body
if (isMobile) {
  document.body.classList.add('is-mobile');
}
if (isTablet) {
  document.body.classList.add('is-tablet');
}
if (isTouch) {
  document.body.classList.add('is-touch');
}

// Optimizaciones CSS para móvil
const mobileStyles = `
  <style id="mobile-optimizations">
    /* ===== OPTIMIZACIONES MÓVIL ===== */
    
    /* Touch target mínimo de 48px */
    .is-mobile button,
    .is-mobile a.btn,
    .is-mobile input[type="submit"],
    .is-mobile input[type="button"] {
      min-height: 48px;
      min-width: 48px;
      padding: 12px 20px;
    }
    
    /* Mejorar tipografía en móvil */
    .is-mobile body {
      font-size: 16px; /* Evita zoom automático en iOS */
      -webkit-text-size-adjust: 100%;
    }
    
    /* Inputs más grandes en móvil */
    .is-mobile input,
    .is-mobile textarea,
    .is-mobile select {
      font-size: 16px; /* Evita zoom en iOS */
      padding: 14px;
    }
    
    /* Navegación fija en bottom para móvil */
    @media (max-width: 768px) {
      .mobile-nav-bottom {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(18, 18, 18, 0.95);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: space-around;
        padding: 8px 0 max(8px, env(safe-area-inset-bottom));
        z-index: 1000;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
      }
      
      .mobile-nav-bottom a {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 11px;
        transition: all 0.2s;
      }
      
      .mobile-nav-bottom a.active,
      .mobile-nav-bottom a:hover {
        color: #00d9ff;
        transform: translateY(-2px);
      }
      
      .mobile-nav-bottom i {
        font-size: 24px;
        margin-bottom: 4px;
      }
      
      /* Añadir padding bottom al body para nav */
      body {
        padding-bottom: 80px;
      }
    }
    
    /* Gestos táctiles mejorados */
    .is-touch * {
      -webkit-tap-highlight-color: rgba(0, 217, 255, 0.2);
      -webkit-touch-callout: none;
    }
    
    /* Swipe gestures */
    .swipeable {
      touch-action: pan-y;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Loading states más visibles */
    .is-mobile .loading {
      font-size: 18px;
      padding: 20px;
    }
    
    /* Modales fullscreen en móvil */
    @media (max-width: 768px) {
      .modal {
        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        max-height: 100vh;
        margin: 0;
        border-radius: 0;
      }
    }
    
    /* Scroll suave */
    html {
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Pull to refresh en PWA */
    body {
      overscroll-behavior-y: contain;
    }
    
    /* Safe areas para notch */
    @supports (padding: max(0px)) {
      body {
        padding-left: max(0px, env(safe-area-inset-left));
        padding-right: max(0px, env(safe-area-inset-right));
      }
      
      .mobile-nav-bottom {
        padding-bottom: max(8px, env(safe-area-inset-bottom));
      }
    }
  </style>
`;

// Inyectar estilos
if (isMobile || isTablet) {
  document.head.insertAdjacentHTML('beforeend', mobileStyles);
}

// Crear navegación móvil bottom si no existe
function createMobileNav() {
  if (!isMobile) return;
  
  // Solo en páginas principales
  const mainPages = ['index.html', 'principal.html', 'certamenes.html', 'ranking.html', 'perfil-artista.html'];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  if (!mainPages.includes(currentPage)) return;
  
  // Verificar si ya existe
  if (document.querySelector('.mobile-nav-bottom')) return;
  
  const nav = document.createElement('nav');
  nav.className = 'mobile-nav-bottom';
  nav.innerHTML = `
    <a href="/index.html" class="${currentPage === 'index.html' ? 'active' : ''}">
      <i class="fas fa-home"></i>
      <span>Inicio</span>
    </a>
    <a href="/certamenes.html" class="${currentPage === 'certamenes.html' ? 'active' : ''}">
      <i class="fas fa-trophy"></i>
      <span>Certámenes</span>
    </a>
    <a href="/inscripcion-unificada.html">
      <i class="fas fa-plus-circle"></i>
      <span>Inscribir</span>
    </a>
    <a href="/ranking.html" class="${currentPage === 'ranking.html' ? 'active' : ''}">
      <i class="fas fa-chart-line"></i>
      <span>Ranking</span>
    </a>
    <a href="/perfil-artista.html" class="${currentPage === 'perfil-artista.html' ? 'active' : ''}">
      <i class="fas fa-user"></i>
      <span>Perfil</span>
    </a>
  `;
  
  document.body.appendChild(nav);
}

// Optimizar imágenes para móvil
function optimizeImages() {
  if (!isMobile) return;
  
  const images = document.querySelectorAll('img[data-src-mobile]');
  images.forEach(img => {
    img.src = img.dataset.srcMobile;
  });
}

// Lazy loading de imágenes
function lazyLoadImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Mejorar performance de scroll
let ticking = false;
function optimizeScroll() {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      // Tu código de scroll aquí
      ticking = false;
    });
    ticking = true;
  }
}

// Prevenir zoom en inputs (iOS)
function preventIOSZoom() {
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (!input.style.fontSize || parseInt(input.style.fontSize) < 16) {
        input.style.fontSize = '16px';
      }
    });
  }
}

// Manejar orientación
function handleOrientation() {
  const isLandscape = window.innerWidth > window.innerHeight;
  document.body.classList.toggle('landscape', isLandscape);
  document.body.classList.toggle('portrait', !isLandscape);
}

// Vibration feedback para touch (si está disponible)
function vibrateOnTouch(element, duration = 10) {
  if ('vibrate' in navigator) {
    element.addEventListener('touchstart', () => {
      navigator.vibrate(duration);
    });
  }
}

// Detectar gestos swipe
function addSwipeGesture(element, onSwipeLeft, onSwipeRight) {
  let touchStartX = 0;
  let touchEndX = 0;
  
  element.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  element.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diff < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  }
}

// Añadir botón "Instalar App" si PWA no está instalada
function addInstallButton() {
  if (!isMobile) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return; // Ya instalada
  
  const installBtn = document.createElement('button');
  installBtn.id = 'pwa-install-btn';
  installBtn.className = 'fixed bottom-20 right-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2';
  installBtn.style.display = 'none';
  installBtn.innerHTML = `
    <i class="fas fa-download"></i>
    <span>Instalar App</span>
  `;
  
  document.body.appendChild(installBtn);
}

// Inicializar optimizaciones
function init() {
  console.log('📱 Optimizaciones móvil cargadas');
  console.log('   Dispositivo:', isMobile ? 'Móvil' : isTablet ? 'Tablet' : 'Desktop');
  console.log('   Touch:', isTouch ? 'Sí' : 'No');
  
  createMobileNav();
  optimizeImages();
  lazyLoadImages();
  preventIOSZoom();
  handleOrientation();
  addInstallButton();
  
  // Event listeners
  window.addEventListener('scroll', optimizeScroll, { passive: true });
  window.addEventListener('orientationchange', handleOrientation);
  
  // Añadir swipe a elementos específicos
  const swipeableElements = document.querySelectorAll('.swipeable');
  swipeableElements.forEach(el => {
    addSwipeGesture(
      el,
      () => console.log('Swipe left'),
      () => console.log('Swipe right')
    );
  });
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Exportar funciones
window.VYT_Mobile = {
  isMobile,
  isTablet,
  isTouch,
  addSwipeGesture,
  vibrateOnTouch
};
