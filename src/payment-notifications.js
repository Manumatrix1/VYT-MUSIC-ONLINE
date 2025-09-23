// Auto-incluir sistema de notificaciones en páginas de pago
(function() {
    // Crear script tag para cargar notificaciones
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
        import notifications from '../src/notifications.js';
        window.notifications = notifications;
        
        // Detectar tipo de página y mostrar notificación apropiada
        const urlParams = new URLSearchParams(window.location.search);
        const tipo = urlParams.get('tipo');
        const precio = urlParams.get('precio');
        
        if (window.location.pathname.includes('pago_exitoso')) {
            setTimeout(() => {
                const tipoTexto = tipo === 'vyt_money' ? 'VYT-MONEY' : 'Inscripción';
                notifications.paymentSuccess(precio, tipo);
            }, 1000);
        } else if (window.location.pathname.includes('pago_fallido')) {
            setTimeout(() => {
                notifications.paymentError('Tu pago no pudo ser procesado. Revisa los datos e intenta nuevamente.');
            }, 1000);
        } else if (window.location.pathname.includes('pago_pendiente')) {
            setTimeout(() => {
                notifications.info('Pago Pendiente', 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.');
            }, 1000);
        }
    `;
    document.head.appendChild(script);
})();