// Performance Optimization for VYT Music
// Este script optimiza el rendimiento de la página principal

class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.preloadCriticalResources();
        this.optimizeAnimations();
        this.setupIntersectionObserver();
        this.deferNonCriticalCSS();
    }

    // Lazy loading para imágenes y videos
    setupLazyLoading() {
        const lazyElements = document.querySelectorAll('img, video, iframe');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    if (element.dataset.src) {
                        element.src = element.dataset.src;
                        element.classList.remove('lazy');
                        element.classList.add('loaded');
                    }
                    
                    observer.unobserve(element);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        lazyElements.forEach(element => {
            if (element.src && !element.classList.contains('no-lazy')) {
                element.dataset.src = element.src;
                element.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNDNEM0QzQiLz48L3N2Zz4=';
                element.classList.add('lazy');
                imageObserver.observe(element);
            }
        });
    }

    // Precargar recursos críticos
    preloadCriticalResources() {
        const criticalResources = [
            'https://cdn.tailwindcss.com',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
            'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Roboto:wght@400;500&display=swap'
        ];

        criticalResources.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    // Optimizar animaciones para mejor rendimiento
    optimizeAnimations() {
        // Reducir animaciones en dispositivos con batería baja
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2) {
                    document.documentElement.classList.add('reduce-motion');
                }
            });
        }

        // Pausar animaciones en pestañas inactivas
        document.addEventListener('visibilitychange', () => {
            const animatedElements = document.querySelectorAll('[style*="animation"]');
            
            animatedElements.forEach(element => {
                if (document.hidden) {
                    element.style.animationPlayState = 'paused';
                } else {
                    element.style.animationPlayState = 'running';
                }
            });
        });
    }

    // Observador de intersección para animaciones bajo demanda
    setupIntersectionObserver() {
        const animatedElements = document.querySelectorAll('.card, .btn, .testimonial-card');
        
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in-view');
                } else {
                    entry.target.classList.remove('animate-in-view');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '20px'
        });

        animatedElements.forEach(element => {
            animationObserver.observe(element);
        });
    }

    // Defer non-critical CSS
    deferNonCriticalCSS() {
        const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
        
        nonCriticalCSS.forEach(link => {
            if (!link.dataset.critical) {
                link.media = 'print';
                link.addEventListener('load', () => {
                    link.media = 'all';
                });
            }
        });
    }

    // Optimizar JavaScript
    static deferScripts() {
        const scripts = document.querySelectorAll('script[data-defer]');
        
        window.addEventListener('load', () => {
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.src = script.dataset.src || script.src;
                newScript.async = true;
                document.body.appendChild(newScript);
            });
        });
    }

    // Comprimir y optimizar recursos
    static compressResources() {
        // Comprimir localStorage
        const compressData = (data) => {
            return JSON.stringify(data);
        };

        // Limpiar localStorage viejo
        const cleanOldStorage = () => {
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            Object.keys(localStorage).forEach(key => {
                const item = localStorage.getItem(key);
                try {
                    const parsed = JSON.parse(item);
                    if (parsed.timestamp && parsed.timestamp < oneWeekAgo) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Si no se puede parsear, mantener el item
                }
            });
        };

        cleanOldStorage();
    }

    // Monitorear métricas de rendimiento
    static measurePerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = performance.timing;
                    const metrics = {
                        loadTime: timing.loadEventEnd - timing.navigationStart,
                        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
                        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
                    };

                    console.log('🚀 VYT Music Performance Metrics:', metrics);
                    
                    // Enviar métricas a analytics (si está configurado)
                    if (window.gtag) {
                        Object.entries(metrics).forEach(([key, value]) => {
                            gtag('event', 'timing_complete', {
                                name: key,
                                value: Math.round(value)
                            });
                        });
                    }
                }, 1000);
            });
        }
    }
}

// CSS adicional para optimización
const optimizationCSS = `
    .lazy {
        opacity: 0.3;
        transition: opacity 0.3s;
    }
    
    .loaded {
        opacity: 1;
    }
    
    .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    .animate-in-view {
        animation-play-state: running;
    }
    
    /* Optimización para dispositivos móviles */
    @media (max-width: 768px) {
        .hero-section::before {
            display: none;
        }
        
        .card:hover {
            transform: none;
        }
        
        .btn:hover::before {
            display: none;
        }
    }
    
    /* Optimización para conexiones lentas */
    @media (prefers-reduced-data: reduce) {
        .hero-section::before,
        .card::before,
        .btn::before {
            display: none;
        }
        
        * {
            animation: none !important;
            transition: none !important;
        }
    }
`;

// Insertar CSS de optimización
const style = document.createElement('style');
style.textContent = optimizationCSS;
document.head.appendChild(style);

// Inicializar optimizador
document.addEventListener('DOMContentLoaded', () => {
    new PerformanceOptimizer();
    PerformanceOptimizer.compressResources();
    PerformanceOptimizer.measurePerformance();
    PerformanceOptimizer.deferScripts();
});

export default PerformanceOptimizer;