// DESREGISTRAR SERVICE WORKER TEMPORALMENTE
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Desregistrar todos los service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('🗑️ SW desregistrado');
    }
    
    // Limpiar caché
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('🗑️ Caché eliminado:', cacheName);
    }
    
    console.log('✅ Service Worker y caché limpiados');
  });
}
      })
      .catch(err => console.log('❌ SW error:', err));
    
    // Listener para mensajes del SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SW_UPDATED') {
        console.log(`📢 ${event.data.message}`);
        // Mostrar notificación temporal (opcional)
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-[9999] animate-fade-in';
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <i class="fas fa-check-circle text-xl"></i>
            <span class="font-semibold">Actualización aplicada ✨</span>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    });
  });
}

