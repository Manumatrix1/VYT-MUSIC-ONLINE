/**
 * Sistema de Optimización de Performance
 * VYT Music Online - Performance & Speed Optimization
 */

class PerformanceOptimization {
    constructor() {
        this.isSlowConnection = this.detectSlowConnection();
        this.imageCache = new Map();
        this.lazyImages = [];
        this.observer = null;
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.optimizeImages();
        this.setupConnectionAwareness();
        this.implementCaching();
        this.optimizeAssets();
        this.setupPreloading();
        this.monitorPerformance();
    }

    detectSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            return connection.effectiveType === 'slow-2g' || 
                   connection.effectiveType === '2g' || 
                   connection.saveData === true;
        }
        return false;
    }

    setupLazyLoading() {
        // Lazy loading para imágenes
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // Aplicar lazy loading a imágenes existentes
        document.addEventListener('DOMContentLoaded', () => {
            this.initLazyImages();
        });

        // Observer para nuevas imágenes dinámicas
        this.setupDynamicImageObserver();
    }

    initLazyImages() {
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        
        images.forEach(img => {
            // Agregar placeholder si no existe
            if (!img.src || img.src === '') {
                img.src = this.createPlaceholder(img.width || 300, img.height || 200);
                img.classList.add('lazy-loading');
            }
            
            // Agregar al observer
            if (img.dataset.src) {
                this.observer.observe(img);
            }
        });

        // Lazy loading para iframes (videos, maps)
        const iframes = document.querySelectorAll('iframe[data-src]');
        iframes.forEach(iframe => {
            this.observer.observe(iframe);
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Crear imagen temporal para precarga
        const tempImage = new Image();
        
        tempImage.onload = () => {
            // Aplicar transición suave
            img.style.transition = 'opacity 0.3s ease';
            img.style.opacity = '0';
            
            setTimeout(() => {
                img.src = src;
                img.style.opacity = '1';
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
                
                // Remover data-src
                img.removeAttribute('data-src');
            }, 50);
        };
        
        tempImage.onerror = () => {
            img.src = this.createErrorPlaceholder();
            img.classList.add('lazy-error');
        };
        
        // Si es conexión lenta, comprimir imagen
        if (this.isSlowConnection) {
            tempImage.src = this.getOptimizedImageUrl(src);
        } else {
            tempImage.src = src;
        }
    }

    createPlaceholder(width = 300, height = 200) {
        // Crear SVG placeholder
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#e0e0e0;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)">
                    <animate attributeName="fill" values="url(#grad);#f5f5f5;url(#grad)" dur="1.5s" repeatCount="indefinite"/>
                </rect>
                <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle" dy="5">
                    🖼️ Cargando...
                </text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    createErrorPlaceholder() {
        const svg = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f8f8" stroke="#ddd" stroke-width="1"/>
                <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">
                    ❌ Error al cargar imagen
                </text>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    getOptimizedImageUrl(src) {
        // Si la imagen está en Firebase Storage, agregar parámetros de optimización
        if (src.includes('firebasestorage.googleapis.com')) {
            const url = new URL(src);
            url.searchParams.set('alt', 'media');
            // Reducir calidad para conexiones lentas
            if (this.isSlowConnection) {
                // Simular compresión - en producción usar servicio de optimización
                return url.toString();
            }
        }
        
        // Para otras imágenes, retornar URL original
        return src;
    }

    optimizeImages() {
        // Comprimir imágenes automáticamente antes de upload
        const fileInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                const compressedFiles = await Promise.all(
                    files.map(file => this.compressImage(file))
                );
                
                // Reemplazar archivos con versiones comprimidas
                const dt = new DataTransfer();
                compressedFiles.forEach(file => dt.items.add(file));
                input.files = dt.files;
                
                // Mostrar preview optimizado
                this.showImagePreview(input, compressedFiles[0]);
            });
        });
    }

    async compressImage(file, quality = 0.8, maxWidth = 1200) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calcular nuevas dimensiones
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Dibujar imagen redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a blob comprimido
                canvas.toBlob((blob) => {
                    // Crear nuevo archivo con nombre original
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    showImagePreview(input, file) {
        const preview = input.parentNode.querySelector('.image-preview') || 
                       this.createPreviewContainer(input);
        
        const img = preview.querySelector('img') || document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.cssText = `
            max-width: 200px;
            max-height: 200px;
            border-radius: 8px;
            object-fit: cover;
        `;
        
        if (!img.parentNode) {
            preview.appendChild(img);
        }
        
        // Mostrar información de compresión
        const info = preview.querySelector('.compression-info') || 
                    document.createElement('div');
        info.className = 'compression-info';
        info.innerHTML = `
            <small style="color: #10b981;">
                ✅ Optimizada: ${(file.size / 1024 / 1024).toFixed(1)}MB
            </small>
        `;
        
        if (!info.parentNode) {
            preview.appendChild(info);
        }
    }

    createPreviewContainer(input) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.style.cssText = `
            margin-top: 8px;
            padding: 12px;
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
            text-align: center;
        `;
        
        input.parentNode.insertBefore(preview, input.nextSibling);
        return preview;
    }

    setupConnectionAwareness() {
        // Adaptar comportamiento según conexión
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            const updateConnectionStatus = () => {
                this.isSlowConnection = connection.effectiveType === 'slow-2g' || 
                                      connection.effectiveType === '2g' || 
                                      connection.saveData === true;
                
                // Actualizar interfaz según conexión
                if (this.isSlowConnection) {
                    this.enableLowBandwidthMode();
                } else {
                    this.disableLowBandwidthMode();
                }
            };
            
            connection.addEventListener('change', updateConnectionStatus);
            updateConnectionStatus();
        }
    }

    enableLowBandwidthMode() {
        document.body.classList.add('low-bandwidth-mode');
        
        // Mostrar notificación
        if (window.showToast) {
            showToast('📶 Conexión lenta detectada. Optimizando experiencia...', 'info', 4000);
        }
        
        // Reducir calidad de imágenes
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            if (!img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
                img.src = this.getOptimizedImageUrl(img.src);
            }
        });
        
        // Deshabilitar animaciones no críticas
        const style = document.createElement('style');
        style.id = 'low-bandwidth-styles';
        style.textContent = `
            .low-bandwidth-mode * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            .low-bandwidth-mode .non-critical-animation {
                animation: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    disableLowBandwidthMode() {
        document.body.classList.remove('low-bandwidth-mode');
        
        // Restaurar imágenes originales
        const images = document.querySelectorAll('img[data-original-src]');
        images.forEach(img => {
            img.src = img.dataset.originalSrc;
            delete img.dataset.originalSrc;
        });
        
        // Remover estilos de bajo ancho de banda
        const lowBandwidthStyles = document.getElementById('low-bandwidth-styles');
        if (lowBandwidthStyles) {
            lowBandwidthStyles.remove();
        }
    }

    implementCaching() {
        // Cache de respuestas de API
        if ('caches' in window) {
            this.setupServiceWorkerCache();
        }
        
        // Cache en memoria para datos frecuentes
        this.setupMemoryCache();
    }

    setupServiceWorkerCache() {
        // Registrar service worker si no existe
        if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
            this.createServiceWorker();
        }
    }

    createServiceWorker() {
        const swCode = `
            const CACHE_NAME = 'vyt-music-v1';
            const urlsToCache = [
                '/',
                '/principal.html',
                '/certamenes.html',
                '/perfil-artista.html',
                '/style.css',
                '/main.js',
                '/src/progress-system.js',
                '/src/error-handling-system.js',
                '/src/mobile-optimization.js'
            ];

            self.addEventListener('install', (event) => {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.addAll(urlsToCache))
                );
            });

            self.addEventListener('fetch', (event) => {
                event.respondWith(
                    caches.match(event.request)
                        .then((response) => {
                            if (response) {
                                return response;
                            }
                            return fetch(event.request);
                        })
                );
            });
        `;
        
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swUrl)
            .then(() => console.log('Service Worker registrado'))
            .catch(err => console.log('Error registrando Service Worker:', err));
    }

    setupMemoryCache() {
        // Cache para respuestas de Firebase
        this.dataCache = new Map();
        
        // Interceptar llamadas a Firebase
        this.interceptFirebaseCalls();
    }

    interceptFirebaseCalls() {
        // Cache para getDocs calls
        if (window.getDocs) {
            const originalGetDocs = window.getDocs;
            window.getDocs = async (query) => {
                const cacheKey = this.generateCacheKey(query);
                
                if (this.dataCache.has(cacheKey)) {
                    const cached = this.dataCache.get(cacheKey);
                    if (Date.now() - cached.timestamp < 30000) { // 30 segundos cache
                        return cached.data;
                    }
                }
                
                const result = await originalGetDocs(query);
                this.dataCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
                
                return result;
            };
        }
    }

    generateCacheKey(query) {
        // Generar clave única para la query
        return JSON.stringify({
            path: query._query?.path?.segments || [],
            filters: query._query?.filters || [],
            orderBy: query._query?.orderBy || []
        });
    }

    optimizeAssets() {
        // Minificar CSS inline
        const styles = document.querySelectorAll('style');
        styles.forEach(style => {
            style.textContent = this.minifyCSS(style.textContent);
        });
        
        // Optimizar fuentes
        this.optimizeFonts();
        
        // Prefetch recursos críticos
        this.prefetchCriticalResources();
    }

    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios
            .replace(/\s+/g, ' ') // Reducir espacios
            .replace(/;\s*}/g, '}') // Remover punto y coma antes de }
            .trim();
    }

    optimizeFonts() {
        // Font display swap para mejorar FCP
        const fontLinks = document.querySelectorAll('link[rel="stylesheet"][href*="fonts"]');
        fontLinks.forEach(link => {
            link.href += '&display=swap';
        });
        
        // Preload fuentes críticas
        const criticalFonts = [
            'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2'
        ];
        
        criticalFonts.forEach(fontUrl => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.href = fontUrl;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    prefetchCriticalResources() {
        const criticalResources = [
            '/certamenes.html',
            '/perfil-artista.html',
            '/inscripcion_unificada.html'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    setupPreloading() {
        // Precargar contenido cuando el usuario hace hover
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.dataset.preloaded) {
                link.dataset.preloaded = 'true';
                this.preloadPage(link.href);
            }
        });
    }

    preloadPage(url) {
        // Solo precargar páginas internas
        if (!url.includes(window.location.origin)) return;
        
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }

    setupDynamicImageObserver() {
        // Observer para nuevas imágenes que se añadan dinámicamente
        const imgObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Buscar imágenes en el nodo añadido
                        const images = node.querySelectorAll ? 
                                      node.querySelectorAll('img[data-src]') : [];
                        
                        if (node.tagName === 'IMG' && node.dataset.src) {
                            images.push(node);
                        }
                        
                        images.forEach(img => {
                            if (!img.src) {
                                img.src = this.createPlaceholder(img.width || 300, img.height || 200);
                            }
                            this.observer.observe(img);
                        });
                    }
                });
            });
        });
        
        imgObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    monitorPerformance() {
        // Monitorear métricas de performance
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
                
                // Reportar métricas si es > 2.5s
                if (lastEntry.startTime > 2500) {
                    this.reportSlowPerformance('LCP', lastEntry.startTime);
                }
            });
            
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
        }
    }

    reportSlowPerformance(metric, value) {
        // En producción, reportar a analytics
        console.warn(`Performance issue detected: ${metric} = ${value}ms`);
        
        // Mostrar sugerencia al usuario si es muy lento
        if (value > 4000 && window.showToast) {
            showToast('📱 Conexión lenta detectada. Activando modo optimizado...', 'info');
            this.enableLowBandwidthMode();
        }
    }

    // API pública
    static init() {
        return new PerformanceOptimization();
    }

    // Utilidades públicas
    clearCache() {
        this.dataCache.clear();
        this.imageCache.clear();
        
        if ('caches' in window) {
            caches.delete('vyt-music-v1');
        }
        
        showToast('🧹 Cache limpiado', 'success');
    }

    getCacheStats() {
        return {
            dataCache: this.dataCache.size,
            imageCache: this.imageCache.size,
            isSlowConnection: this.isSlowConnection
        };
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimization = PerformanceOptimization.init();
});

// Global utilities
window.clearPerformanceCache = () => window.performanceOptimization?.clearCache();
window.getPerformanceStats = () => window.performanceOptimization?.getCacheStats();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimization;
}

window.PerformanceOptimization = PerformanceOptimization;