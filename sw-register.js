// Registro SIMPLE de Service Worker - Sin auto-updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-simple.js')
      .then(() => console.log('✅ SW registrado'))
      .catch(err => console.log('❌ SW error:', err));
  });
}
