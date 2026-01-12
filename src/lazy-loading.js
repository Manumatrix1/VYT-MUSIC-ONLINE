/**
 * VYT MUSIC - LAZY LOADING SYSTEM
 * 
 * Carga diferida de imágenes y recursos pesados
 * Mejora el rendimiento inicial de la página
 * 
 * USO:
 * <img data-src="imagen.jpg" class="lazy-load" alt="...">
 */

(function() {
    'use strict';

    // Configuración
    const config = {
        rootMargin: '50px', // Cargar 50px antes de entrar al viewport
        threshold: 0.01,
        loadingClass: 'lazy-loading',
        loadedClass: 'lazy-loaded',
        errorClass: 'lazy-error'
    };

    /**
     * Carga una imagen individual
     */
    function loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (!src) return;

        // Añadir clase de carga
        img.classList.add(config.loadingClass);

        // Crear imagen temporal para precargar
        const tempImg = new Image();

        tempImg.onload = function() {
            // Aplicar la imagen real
            img.src = src;
            if (srcset) {
                img.srcset = srcset;
            }

            // Remover data attributes
            delete img.dataset.src;
            delete img.dataset.srcset;

            // Actualizar clases
            img.classList.remove(config.loadingClass);
            img.classList.add(config.loadedClass);

            // Disparar evento personalizado
            img.dispatchEvent(new CustomEvent('lazyloaded', {
                detail: { src: src }
            }));

            // Analytics tracking
            if (window.trackCustomEvent) {
                window.trackCustomEvent('lazy_load', {
                    image_path: src,
                    load_time: performance.now()
                });
            }
        };

        tempImg.onerror = function() {
            img.classList.remove(config.loadingClass);
            img.classList.add(config.errorClass);
            console.error('Error cargando imagen lazy:', src);
        };

        // Iniciar carga
        tempImg.src = src;
        if (srcset) {
            tempImg.srcset = srcset;
        }
    }

    /**
     * Carga un background-image
     */
    function loadBackground(element) {
        const bg = element.dataset.bg;
        if (!bg) return;

        element.classList.add(config.loadingClass);

        // Precargar imagen
        const tempImg = new Image();
        tempImg.onload = function() {
            element.style.backgroundImage = `url('${bg}')`;
            delete element.dataset.bg;
            element.classList.remove(config.loadingClass);
            element.classList.add(config.loadedClass);
        };

        tempImg.onerror = function() {
            element.classList.remove(config.loadingClass);
            element.classList.add(config.errorClass);
        };

        tempImg.src = bg;
    }

    /**
     * Carga un iframe (videos de YouTube, etc)
     */
    function loadIframe(iframe) {
        const src = iframe.dataset.src;
        if (!src) return;

        iframe.classList.add(config.loadingClass);
        iframe.src = src;
        delete iframe.dataset.src;

        iframe.onload = function() {
            iframe.classList.remove(config.loadingClass);
            iframe.classList.add(config.loadedClass);
        };
    }

    /**
     * Inicializar Intersection Observer
     */
    function initLazyLoading() {
        // Verificar soporte de IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver no soportado, cargando todas las imágenes...');
            loadAllImages();
            return;
        }

        // Crear observer
        const observer = new IntersectionObserver(function(entries, self) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;

                    // Determinar tipo de elemento
                    if (element.tagName === 'IMG') {
                        loadImage(element);
                    } else if (element.dataset.bg) {
                        loadBackground(element);
                    } else if (element.tagName === 'IFRAME') {
                        loadIframe(element);
                    }

                    // Dejar de observar este elemento
                    self.unobserve(element);
                }
            });
        }, {
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        // Observar todas las imágenes lazy
        const lazyImages = document.querySelectorAll('img[data-src], [data-bg], iframe[data-src]');
        lazyImages.forEach(img => observer.observe(img));

        console.log(`🖼️ Lazy loading inicializado: ${lazyImages.length} elementos`);
    }

    /**
     * Fallback para navegadores sin IntersectionObserver
     */
    function loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(loadImage);

        const lazyBackgrounds = document.querySelectorAll('[data-bg]');
        lazyBackgrounds.forEach(loadBackground);

        const lazyIframes = document.querySelectorAll('iframe[data-src]');
        lazyIframes.forEach(loadIframe);
    }

    /**
     * Precarga de imágenes críticas
     */
    function preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('img[data-critical="true"]');
        
        criticalImages.forEach(img => {
            const src = img.dataset.src;
            if (src) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = src;
                document.head.appendChild(link);
            }
        });
    }

    /**
     * Cargar imágenes en hover (para previews)
     */
    function enableHoverPreload() {
        const hoverElements = document.querySelectorAll('[data-hover-preload]');
        
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                const img = element.querySelector('img[data-src]');
                if (img) {
                    loadImage(img);
                }
            }, { once: true });
        });
    }

    /**
     * Utilidad: Convertir imagen normal a lazy
     */
    window.convertToLazy = function(selector) {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
            if (img.src && !img.dataset.src) {
                img.dataset.src = img.src;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
                img.classList.add('lazy-load');
            }
        });
        initLazyLoading();
    };

    /**
     * API pública
     */
    window.VYTLazyLoad = {
        init: initLazyLoading,
        loadImage: loadImage,
        loadAllImages: loadAllImages,
        preloadCritical: preloadCriticalImages,
        enableHoverPreload: enableHoverPreload
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            preloadCriticalImages();
            initLazyLoading();
            enableHoverPreload();
        });
    } else {
        preloadCriticalImages();
        initLazyLoading();
        enableHoverPreload();
    }

    // CSS inline para placeholder
    const style = document.createElement('style');
    style.textContent = `
        img[data-src], [data-bg] {
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }
        
        img.lazy-loaded, [data-bg].lazy-loaded {
            opacity: 1;
        }
        
        img.lazy-loading, [data-bg].lazy-loading {
            background: linear-gradient(
                90deg,
                #f0f0f0 25%,
                #e0e0e0 50%,
                #f0f0f0 75%
            );
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        img.lazy-error {
            opacity: 0.3;
            filter: grayscale(100%);
        }
    `;
    document.head.appendChild(style);

})();
