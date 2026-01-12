// VYT-MUSIC: Sistema de Avatares con DiceBear API
// Genera avatares automáticos cuando el usuario no tiene fotoUrl
// Estilos: 'adventurer' y 'micah' (aleatorio)

class AvatarHelper {
    constructor() {
        this.styles = ['adventurer', 'micah'];
        this.apiBase = 'https://api.dicebear.com/7.x';
        this.cache = new Map(); // Cache para evitar regenerar avatares
    }

    /**
     * Obtiene el avatar del usuario (fotoUrl o genera uno automático)
     * @param {Object} userData - Datos del usuario (debe contener uid y fotoUrl opcional)
     * @param {Number} size - Tamaño del avatar en píxeles (default: 200)
     * @returns {String} URL del avatar
     */
    getAvatar(userData, size = 200) {
        // Si el usuario ya tiene foto, usarla
        if (userData.fotoUrl || userData.foto_url) {
            return userData.fotoUrl || userData.foto_url;
        }

        // Si ya está en cache, devolver
        const cacheKey = `${userData.uid}_${size}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Generar avatar usando DiceBear
        const avatarUrl = this.generateAvatar(userData.uid, size);
        this.cache.set(cacheKey, avatarUrl);
        
        return avatarUrl;
    }

    /**
     * Genera URL de avatar con DiceBear
     * @param {String} seed - Semilla para generar avatar consistente (usar uid)
     * @param {Number} size - Tamaño en píxeles
     * @returns {String} URL del avatar generado
     */
    generateAvatar(seed, size = 200) {
        // Seleccionar estilo basado en el hash del seed
        const styleIndex = this.hashCode(seed) % this.styles.length;
        const style = this.styles[styleIndex];
        
        // Construir URL con parámetros
        const params = new URLSearchParams({
            seed: seed,
            size: size,
            backgroundColor: '121212', // Negro VYT
            backgroundType: 'solid'
        });
        
        return `${this.apiBase}/${style}/svg?${params.toString()}`;
    }

    /**
     * Hash simple para seleccionar estilo consistentemente
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Actualiza un elemento IMG con el avatar correcto
     * @param {HTMLImageElement} imgElement - Elemento img a actualizar
     * @param {Object} userData - Datos del usuario
     * @param {Number} size - Tamaño del avatar
     */
    setAvatarToElement(imgElement, userData, size = 200) {
        if (!imgElement) {
            console.warn('⚠️ Elemento de imagen no proporcionado');
            return;
        }

        const avatarUrl = this.getAvatar(userData, size);
        imgElement.src = avatarUrl;
        imgElement.alt = userData.nombre_artista || userData.nombre || 'Avatar';
        
        // Añadir clase para estilos
        imgElement.classList.add('avatar-image');
        
        // Manejar error de carga
        imgElement.onerror = () => {
            console.warn('⚠️ Error al cargar avatar, usando fallback');
            imgElement.src = this.getFallbackAvatar(size);
        };
    }

    /**
     * Avatar fallback en caso de error
     */
    getFallbackAvatar(size = 200) {
        // SVG simple con icono de usuario
        const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#121212"/>
                <circle cx="100" cy="80" r="40" fill="#1ed760"/>
                <path d="M 100 130 Q 70 130 50 160 L 150 160 Q 130 130 100 130" fill="#1ed760"/>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Genera HTML completo para un avatar con wrapper
     * @param {Object} userData - Datos del usuario
     * @param {Object} options - Opciones de configuración
     * @returns {String} HTML del avatar
     */
    generateAvatarHTML(userData, options = {}) {
        const {
            size = 200,
            showName = true,
            wrapperClass = 'avatar-wrapper',
            imageClass = 'avatar-image',
            nameClass = 'avatar-name'
        } = options;

        const avatarUrl = this.getAvatar(userData, size);
        const name = userData.nombre_artista || userData.nombre || 'Artista';
        
        return `
            <div class="${wrapperClass}">
                <img 
                    src="${avatarUrl}" 
                    alt="${name}"
                    class="${imageClass}"
                    onerror="this.src='${this.getFallbackAvatar(size)}'"
                />
                ${showName ? `<span class="${nameClass}">${name}</span>` : ''}
            </div>
        `;
    }

    /**
     * Añade estilos CSS base para avatares (llamar una sola vez)
     */
    static addBaseStyles() {
        if (document.getElementById('avatar-helper-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'avatar-helper-styles';
        styles.textContent = `
            .avatar-wrapper {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }
            
            .avatar-image {
                border-radius: 50%;
                border: 3px solid #1ed760;
                box-shadow: 0 4px 12px rgba(30, 215, 96, 0.3);
                object-fit: cover;
                transition: all 0.3s ease;
            }
            
            .avatar-image:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(30, 215, 96, 0.5);
            }
            
            .avatar-name {
                font-size: 0.875rem;
                font-weight: 600;
                color: #f5f5f5;
                text-align: center;
            }
            
            /* Variantes de tamaño */
            .avatar-small {
                width: 48px;
                height: 48px;
                border-width: 2px;
            }
            
            .avatar-medium {
                width: 80px;
                height: 80px;
            }
            
            .avatar-large {
                width: 120px;
                height: 120px;
            }
            
            .avatar-xlarge {
                width: 200px;
                height: 200px;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Batch update: actualiza múltiples avatares en una lista
     * Útil para grillas de participantes
     * @param {Array} userList - Array de objetos con datos de usuarios
     * @param {String} containerSelector - Selector del contenedor
     * @param {Function} cardRenderer - Función para renderizar cada card
     */
    renderAvatarGrid(userList, containerSelector, cardRenderer) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn('⚠️ Contenedor no encontrado:', containerSelector);
            return;
        }

        // Limpiar contenedor
        container.innerHTML = '';

        if (!userList || userList.length === 0) {
            container.innerHTML = '<p class="text-gray-400">No hay participantes disponibles</p>';
            return;
        }

        // Renderizar cada card
        userList.forEach(userData => {
            const avatarUrl = this.getAvatar(userData, 200);
            const cardHTML = cardRenderer({ ...userData, avatarUrl });
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    /**
     * Limpia la cache de avatares
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache de avatares limpiada');
    }
}

// Instancia global singleton
const avatarHelper = new AvatarHelper();

// Añadir estilos base al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AvatarHelper.addBaseStyles();
    });
} else {
    AvatarHelper.addBaseStyles();
}

// Exportar instancia y clase
export { avatarHelper, AvatarHelper };
export default avatarHelper;
