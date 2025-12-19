/**
 * VYT MUSIC - DYNAMIC BACKGROUND SYSTEM
 * Sistema centralizado para cargar fondos dinámicos desde localStorage
 * Administrador puede configurar imágenes de fondo para cada página
 */

function loadDynamicBackground() {
    console.log('🎨 [Dynamic Background] Iniciando carga de fondo dinámico...');
    try {
        const backgroundConfig = JSON.parse(localStorage.getItem('backgroundConfig') || '{}');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        console.log('📋 [Dynamic Background] Configuración disponible:', backgroundConfig);
        console.log('📄 [Dynamic Background] Página actual:', currentPage);
        
        if (backgroundConfig[currentPage] && backgroundConfig[currentPage].imageData) {
            console.log('✅ [Dynamic Background] Aplicando fondo personalizado para:', currentPage);
            
            const config = backgroundConfig[currentPage];
            
            // Aplicar CSS variables si existe
            if (config.imageData) {
                document.documentElement.style.setProperty('--dynamic-bg', `url('${config.imageData}')`);
            }
            
            // Aplicar directamente al body
            document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('${config.imageData}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundPosition = config.position || 'center top';
            document.body.style.backgroundRepeat = 'no-repeat';
            
            // Aplicar escalado si existe
            if (config.scale && config.scale !== 1) {
                document.body.style.backgroundSize = `${config.scale * 100}%`;
            }
            
            console.log('🎆 [Dynamic Background] Fondo aplicado exitosamente');
        } else {
            console.log('📝 [Dynamic Background] Sin configuración personalizada, usando fondo por defecto');
        }
    } catch (error) {
        console.error('❌ [Dynamic Background] Error cargando fondo dinámico:', error);
    }
}

// Auto-ejecutar al cargar el DOM
document.addEventListener('DOMContentLoaded', loadDynamicBackground);

// Exponer función globalmente para uso manual
window.loadDynamicBackground = loadDynamicBackground;