/**
 * VYT MUSIC - PWA INSTALLER
 * Sistema de instalación de Progressive Web App
 * con prompt personalizado y detección de plataforma
 */

(function() {
  'use strict';

  let deferredPrompt;
  let isInstalled = false;

  // Detectar si ya está instalado
  function checkIfInstalled() {
    // Verificar si se ejecuta en modo standalone (instalado)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled = true;
      console.log('✅ PWA: App ya instalada (standalone mode)');
      return true;
    }
    
    // Verificar en iOS
    if (window.navigator.standalone === true) {
      isInstalled = true;
      console.log('✅ PWA: App ya instalada (iOS standalone)');
      return true;
    }
    
    return false;
  }

  // Registrar Service Worker
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker-pwa.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
          
          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 3600000);
          
          // Manejar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification();
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Error registrando Service Worker:', error);
        });
    } else {
      console.warn('⚠️ Service Worker no soportado en este navegador');
    }
  }

  // Mostrar notificación de actualización
  function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #00d9ff, #667eea);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 16px;
        max-width: 90%;
        animation: slideUp 0.3s ease-out;
      ">
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">
            🎉 Nueva versión disponible
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            Hay una actualización de VYT Music
          </div>
        </div>
        <button id="pwa-reload-btn" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          white-space: nowrap;
        ">
          Actualizar
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    document.getElementById('pwa-reload-btn').addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Detectar plataforma
  function detectPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/android/i.test(userAgent)) {
      return 'android';
    }
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'ios';
    }
    
    return 'desktop';
  }

  // Crear botón de instalación
  function createInstallButton() {
    if (isInstalled) return;
    if (!deferredPrompt) return;
    
    const installBtn = document.getElementById('pwa-install-btn');
    if (!installBtn) return;
    
    installBtn.style.display = 'flex';
    installBtn.addEventListener('click', showInstallPrompt);
  }

  // Mostrar prompt de instalación personalizado
  function showInstallPrompt() {
    const platform = detectPlatform();
    
    if (platform === 'ios') {
      showIOSInstructions();
      return;
    }
    
    if (!deferredPrompt) {
      console.warn('⚠️ Prompt de instalación no disponible');
      return;
    }
    
    // Mostrar el prompt nativo
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalar la PWA');
        trackInstallation('accepted');
      } else {
        console.log('❌ Usuario rechazó instalar la PWA');
        trackInstallation('dismissed');
      }
      
      deferredPrompt = null;
    });
  }

  // Mostrar instrucciones para iOS
  function showIOSInstructions() {
    const modal = document.createElement('div');
    modal.id = 'ios-install-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      " onclick="this.remove()">
        <div style="
          background: white;
          border-radius: 20px;
          padding: 32px;
          max-width: 400px;
          text-align: center;
        " onclick="event.stopPropagation()">
          <h2 style="
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
          ">
            📱 Instalar VYT Music
          </h2>
          
          <div style="text-align: left; color: #666; line-height: 1.6;">
            <p style="margin-bottom: 16px;">
              Para instalar esta app en tu iPhone o iPad:
            </p>
            
            <ol style="padding-left: 20px; margin-bottom: 20px;">
              <li style="margin-bottom: 12px;">
                Toca el botón <strong>Compartir</strong> 
                <span style="font-size: 20px;">⎋</span> en Safari
              </li>
              <li style="margin-bottom: 12px;">
                Desplázate y selecciona 
                <strong>"Agregar a pantalla de inicio"</strong>
              </li>
              <li>
                Confirma tocando <strong>"Agregar"</strong>
              </li>
            </ol>
          </div>
          
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: linear-gradient(135deg, #00d9ff, #667eea);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
          ">
            Entendido
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  // Crear banner de instalación flotante
  function showInstallBanner() {
    if (isInstalled) return;
    
    // No mostrar si ya se mostró antes en esta sesión
    if (sessionStorage.getItem('pwa-banner-shown')) return;
    
    // Esperar 5 segundos antes de mostrar
    setTimeout(() => {
      const banner = document.createElement('div');
      banner.id = 'pwa-install-banner';
      banner.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 90%;
          animation: slideUp 0.3s ease-out;
        ">
          <div style="flex: 1;">
            <div style="font-weight: bold; margin-bottom: 4px;">
              📱 Instalar VYT Music
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
              Úsala como una app nativa
            </div>
          </div>
          <button id="pwa-banner-install-btn" style="
            background: white;
            color: #667eea;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            white-space: nowrap;
          ">
            Instalar
          </button>
          <button id="pwa-banner-close-btn" style="
            background: transparent;
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
          ">
            ✕
          </button>
        </div>
        
        <style>
          @keyframes slideUp {
            from {
              transform: translate(-50%, 100px);
              opacity: 0;
            }
            to {
              transform: translateX(-50%);
              opacity: 1;
            }
          }
        </style>
      `;
      
      document.body.appendChild(banner);
      
      // Marcar como mostrado en esta sesión
      sessionStorage.setItem('pwa-banner-shown', 'true');
      
      // Event listeners
      document.getElementById('pwa-banner-install-btn').addEventListener('click', () => {
        showInstallPrompt();
        banner.remove();
      });
      
      document.getElementById('pwa-banner-close-btn').addEventListener('click', () => {
        banner.remove();
      });
      
      // Auto-ocultar después de 15 segundos
      setTimeout(() => {
        if (banner.parentElement) {
          banner.style.animation = 'slideDown 0.3s ease-out';
          setTimeout(() => banner.remove(), 300);
        }
      }, 15000);
    }, 5000);
  }

  // Tracking de instalación (analytics)
  function trackInstallation(action) {
    // Aquí puedes integrar con Google Analytics o Firebase Analytics
    console.log('📊 PWA Install:', action);
    
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: action,
        value: 1
      });
    }
  }

  // Escuchar evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    console.log('✅ PWA: Prompt de instalación disponible');
    
    // Mostrar botón de instalación si existe
    createInstallButton();
    
    // Mostrar banner después de un tiempo
    showInstallBanner();
  });

  // Escuchar cuando se instala la app
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA: App instalada exitosamente');
    trackInstallation('installed');
    deferredPrompt = null;
    isInstalled = true;
    
    // Ocultar banner si está visible
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
  });

  // Inicializar al cargar la página
  function init() {
    console.log('🚀 PWA Installer inicializando...');
    
    // Verificar si ya está instalado
    isInstalled = checkIfInstalled();
    
    // Registrar Service Worker
    registerServiceWorker();
    
    // Si no está instalado, preparar instalación
    if (!isInstalled) {
      console.log('📱 App no instalada, preparando prompt...');
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exportar funciones globales
  window.VYT_PWA = {
    install: showInstallPrompt,
    isInstalled: () => isInstalled,
    platform: detectPlatform()
  };

})();
