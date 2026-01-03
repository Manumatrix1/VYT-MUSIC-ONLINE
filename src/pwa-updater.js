/**
 * PWA Auto-Updater
 * Detecta actualizaciones del Service Worker y notifica al usuario
 */

class PWAUpdater {
  constructor() {
    this.updateAvailable = false;
    this.registration = null;
    this.init();
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker no soportado');
      return;
    }

    try {
      // Registrar service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registrado');

      // Escuchar mensajes del service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log(`🔄 Nueva versión disponible: ${event.data.version}`);
          this.showUpdateNotification();
        }
      });

      // Detectar cuando hay un nuevo service worker esperando
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        console.log('🔍 Nueva versión detectada...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ Nueva versión instalada');
            this.updateAvailable = true;
            this.showUpdateNotification();
          }
        });
      });

      // Verificar actualizaciones cada 30 segundos
      setInterval(() => {
        this.registration.update();
      }, 30000);

      // Verificar inmediatamente
      this.registration.update();

    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
    }
  }

  showUpdateNotification() {
    // Evitar duplicados - si ya existe, no mostrar otra
    const existing = document.getElementById('pwa-update-notification');
    if (existing) {
      console.log('⚠️ Notificación ya existe, no duplicar');
      return;
    }

    // Crear notificación flotante
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 16px;
        animation: slideUp 0.3s ease-out;
        max-width: 90%;
        font-family: 'Roboto', sans-serif;
      ">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">
            🎉 Nueva versión disponible
          </div>
          <div style="font-size: 13px; opacity: 0.9;">
            Actualiza para ver las últimas mejoras
          </div>
        </div>
        <button onclick="window.PWAUpdater.applyUpdate()" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Actualizar
        </button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: none;
          padding: 8px;
          cursor: pointer;
          font-size: 18px;
          opacity: 0.7;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
          ✕
        </button>
      </div>
    `;

    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // Remover notificación anterior si existe
    const existing = document.getElementById('pwa-update-notification');
    if (existing) existing.remove();

    document.body.appendChild(notification);

    // Auto-remover después de 30 segundos si no se interactúa
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideUp 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 30000);
  }

  applyUpdate() {
    console.log('🔄 Aplicando actualización...');
    
    // Mostrar loading
    const notification = document.getElementById('pwa-update-notification');
    if (notification) {
      notification.innerHTML = `
        <div style="
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 99999;
          text-align: center;
          font-family: 'Roboto', sans-serif;
        ">
          <div style="font-size: 15px; font-weight: bold;">
            ⏳ Actualizando...
          </div>
        </div>
      `;
    }

    // Enviar mensaje al service worker para activar inmediatamente
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Recargar la página después de 500ms
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

// Inicializar automáticamente cuando carga la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PWAUpdater = new PWAUpdater();
  });
} else {
  window.PWAUpdater = new PWAUpdater();
}
