/**
 * VYT MUSIC - Dynamic Assets Manager
 * Gestión centralizada de multimedia dinámica desde JSON
 * NO bloquea el renderizado principal - Async First
 * Versión: 2026-01-12
 */

class VYTDynamicAssetsManager {
    constructor() {
        this.config = null;
        this.configUrl = '/src/vyt-assets-config.json';
        this.cacheKey = 'vyt_assets_cache_v1';
        this.currentSlide = 0;
        this.sliderInterval = null;
        this.isSliderActive = false;
        
        // No bloquear renderizado
        this.initAsync();
    }

    /**
     * Inicialización asíncrona - NO bloquea renderizado
     */
    async initAsync() {
        try {
            // Esperar a que el DOM esté listo
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Cargar config en paralelo con el resto de la página
            await this.loadConfig();
            
            // Aplicar assets de forma progresiva
            this.applyAssets();
            
            console.log('✅ VYT Dynamic Assets Manager inicializado');
        } catch (error) {
            console.error('❌ Error inicializando assets:', error);
            this.loadFallbackAssets();
        }
    }

    /**
     * Carga la configuración desde JSON con cache busting
     */
    async loadConfig() {
        try {
            // Intentar cargar desde localStorage primero (cache)
            const cached = this.getCachedConfig();
            if (cached && !this.shouldRefreshCache()) {
                this.config = cached;
                console.log('📦 Config cargada desde cache');
                return;
            }

            // Cargar desde servidor con cache busting
            const timestamp = Date.now();
            const response = await fetch(`${this.configUrl}?v=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            this.config = await response.json();
            
            // Guardar en cache
            this.setCachedConfig(this.config);
            
            console.log('🌐 Config cargada desde servidor');
        } catch (error) {
            console.error('Error cargando config:', error);
            
            // Intentar usar cache aunque esté vencido
            const cached = this.getCachedConfig();
            if (cached) {
                this.config = cached;
                console.warn('⚠️ Usando config cacheada (puede estar desactualizada)');
            } else {
                throw error;
            }
        }
    }

    /**
     * Obtiene config del cache
     */
    getCachedConfig() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;

            const data = JSON.parse(cached);
            return data.config;
        } catch (error) {
            console.error('Error leyendo cache:', error);
            return null;
        }
    }

    /**
     * Guarda config en cache
     */
    setCachedConfig(config) {
        try {
            const data = {
                config: config,
                timestamp: Date.now(),
                version: config._meta?.version || '1.0.0'
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error guardando cache:', error);
        }
    }

    /**
     * Verifica si debe refrescar el cache (cada 1 hora)
     */
    shouldRefreshCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return true;

            const data = JSON.parse(cached);
            const hourInMs = 60 * 60 * 1000;
            return (Date.now() - data.timestamp) > hourInMs;
        } catch (error) {
            return true;
        }
    }

    /**
     * Limpia el cache manualmente (útil para admin)
     */
    clearCache() {
        localStorage.removeItem(this.cacheKey);
        console.log('🗑️ Cache de assets limpiado');
    }

    /**
     * Recarga la configuración forzando refresh
     */
    async reloadConfig() {
        this.clearCache();
        await this.loadConfig();
        this.applyAssets();
        console.log('🔄 Config recargada exitosamente');
    }

    /**
     * Inicializa la grilla de certámenes estilo Spotify
     * Carga desde Firestore y renderiza con filtros
     */
    async initCertamenesGrid() {
        const container = document.getElementById('vyt-certamenes-grid');
        if (!container) {
            console.log('ℹ️ No se encontró contenedor de certámenes');
            return;
        }

        try {
            // Mostrar skeletons mientras carga
            this.showCertamenesSkeletons(container);

            // Verificar Firebase
            if (!firebase || !firebase.firestore) {
                throw new Error('Firebase no disponible');
            }

            const db = firebase.firestore();
            
            // Cargar certámenes de todas las colecciones
            const [nacionales, provinciales] = await Promise.all([
                db.collection('certamenes_nacionales').where('activo', '==', true).get(),
                db.collection('certamenes_provinciales').where('activo', '==', true).get()
            ]);

            // Combinar y mapear datos
            const certamenes = [];
            
            nacionales.forEach(doc => {
                certamenes.push({
                    id: doc.id,
                    ...doc.data(),
                    categoria: 'Nacional',
                    categoriaIcon: 'fa-globe-americas'
                });
            });

            provinciales.forEach(doc => {
                certamenes.push({
                    id: doc.id,
                    ...doc.data(),
                    categoria: 'Provincial',
                    categoriaIcon: 'fa-map-marked-alt'
                });
            });

            // Ordenar por fecha más reciente
            certamenes.sort((a, b) => {
                const dateA = a.fechaInicio?.toDate?.() || new Date(a.fechaInicio);
                const dateB = b.fechaInicio?.toDate?.() || new Date(b.fechaInicio);
                return dateB - dateA;
            });

            // Renderizar certámenes
            this.renderCertamenes(certamenes, container);

            // Inicializar chips de filtrado
            this.initFilterChips(certamenes);

            console.log(`✅ ${certamenes.length} certámenes cargados`);

        } catch (error) {
            console.error('❌ Error cargando certámenes:', error);
            this.showCertamenesError(container);
        }
    }

    /**
     * Muestra skeletons de carga
     */
    showCertamenesSkeletons(container) {
        const skeletonHTML = Array(6).fill('').map(() => `
            <div class="vyt-certamen-skeleton">
                <div class="vyt-skeleton-image"></div>
                <div class="vyt-skeleton-text" style="width: 80%"></div>
                <div class="vyt-skeleton-text" style="width: 60%"></div>
                <div class="vyt-skeleton-text" style="width: 40%"></div>
            </div>
        `).join('');
        
        container.innerHTML = skeletonHTML;
    }

    /**
     * Renderiza la grilla de certámenes
     */
    renderCertamenes(certamenes, container) {
        if (!certamenes || certamenes.length === 0) {
            container.innerHTML = `
                <div class="vyt-empty-state">
                    <i class="fas fa-music"></i>
                    <h3>No hay certámenes disponibles</h3>
                    <p>Vuelve pronto para descubrir nuevos certámenes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = certamenes.map(certamen => this.createCertamenCard(certamen)).join('');

        // Añadir event listeners
        container.querySelectorAll('.vyt-certamen-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Si clickeó el botón play, ir a inscripción
                if (e.target.closest('.vyt-play-button')) {
                    window.location.href = `/inscripcion-unificada.html?certamen=${card.dataset.id}`;
                } else {
                    // Si clickeó la tarjeta, ir a detalle
                    window.location.href = `/certamen-individual.html?id=${card.dataset.id}`;
                }
            });
        });
    }

    /**
     * Crea una tarjeta de certamen estilo Spotify
     */
    createCertamenCard(certamen) {
        const estado = this.calcularEstadoCertamen(certamen);
        const imagen = certamen.imagenPortada || this.getGradientImage(certamen.nombre);
        const participantes = certamen.participantes || 0;
        const votos = certamen.totalVotos || 0;

        return `
            <div class="vyt-certamen-card" data-id="${certamen.id}" data-categoria="${certamen.categoria}">
                <div class="vyt-certamen-image">
                    <img src="${imagen}" alt="${certamen.nombre}" loading="lazy">
                    <span class="vyt-certamen-badge ${estado.clase}">${estado.texto}</span>
                    <button class="vyt-play-button" title="Inscribirse">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </div>
                <div class="vyt-certamen-content">
                    <h3 class="vyt-certamen-name">${certamen.nombre}</h3>
                    <div class="vyt-certamen-info">
                        <div class="vyt-certamen-category">
                            <i class="fas ${certamen.categoriaIcon}"></i>
                            <span>${certamen.categoria}</span>
                        </div>
                        <div class="vyt-certamen-dates">
                            <i class="far fa-calendar-alt"></i>
                            <span>${this.formatearFecha(certamen.fechaInicio)}</span>
                        </div>
                    </div>
                    <div class="vyt-certamen-stats">
                        <div class="vyt-stat">
                            <i class="fas fa-users"></i>
                            <span>${participantes}</span>
                        </div>
                        <div class="vyt-stat">
                            <i class="fas fa-heart"></i>
                            <span>${votos}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Calcula el estado del certamen
     */
    calcularEstadoCertamen(certamen) {
        const ahora = new Date();
        const inicio = certamen.fechaInicio?.toDate?.() || new Date(certamen.fechaInicio);
        const fin = certamen.fechaFin?.toDate?.() || new Date(certamen.fechaFin);

        if (ahora >= inicio && ahora <= fin) {
            return { texto: 'En Curso', clase: 'en-curso' };
        } else if (ahora < inicio) {
            return { texto: 'Próximo', clase: 'proximo' };
        } else {
            return { texto: 'Finalizado', clase: 'finalizado' };
        }
    }

    /**
     * Genera imagen de gradiente como placeholder
     */
    getGradientImage(nombre) {
        // Crear gradiente basado en el nombre
        const hash = Array.from(nombre).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue1 = hash % 360;
        const hue2 = (hash + 120) % 360;
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:hsl(${hue1}, 70%25, 50%25)'/%3E%3Cstop offset='100%25' style='stop-color:hsl(${hue2}, 70%25, 50%25)'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23g)'/%3E%3C/svg%3E`;
    }

    /**
     * Formatea fecha de manera legible
     */
    formatearFecha(fecha) {
        if (!fecha) return 'Fecha no disponible';
        
        const date = fecha.toDate?.() || new Date(fecha);
        const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', opciones);
    }

    /**
     * Inicializa los chips de filtrado
     */
    initFilterChips(certamenes) {
        const chipsContainer = document.getElementById('vyt-filter-chips');
        if (!chipsContainer) return;

        // Obtener categorías únicas
        const categorias = ['Todos', ...new Set(certamenes.map(c => c.categoria))];

        // Crear chips
        chipsContainer.innerHTML = categorias.map(cat => {
            const icon = cat === 'Todos' ? 'fa-th' : 
                        cat === 'Nacional' ? 'fa-globe-americas' : 
                        cat === 'Provincial' ? 'fa-map-marked-alt' : 'fa-map-pin';
            
            const activeClass = cat === 'Todos' ? 'active' : '';
            
            return `
                <button class="vyt-chip ${activeClass}" data-filter="${cat}">
                    <i class="fas ${icon}"></i>
                    <span>${cat}</span>
                </button>
            `;
        }).join('');

        // Event listeners para filtrado
        chipsContainer.querySelectorAll('.vyt-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                // Actualizar chip activo
                chipsContainer.querySelectorAll('.vyt-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                // Filtrar tarjetas
                const filter = chip.dataset.filter;
                this.filterCertamenes(filter);

                // Efecto de gamificación
                if (window.showToast) {
                    showToast(`Mostrando: ${filter}`, 'info', 1500);
                }
            });
        });
    }

    /**
     * Filtra los certámenes por categoría
     */
    filterCertamenes(categoria) {
        const cards = document.querySelectorAll('.vyt-certamen-card');
        
        cards.forEach(card => {
            if (categoria === 'Todos' || card.dataset.categoria === categoria) {
                card.style.display = '';
                card.style.animation = 'fadeIn 0.5s ease';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * Muestra mensaje de error
     */
    showCertamenesError(container) {
        container.innerHTML = `
            <div class="vyt-empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar certámenes</h3>
                <p>Por favor, intenta recargar la página</p>
            </div>
        `;
    }

    /**
     * Aplica los assets de forma progresiva (no bloquea)
     */
    applyAssets() {
        if (!this.config) {
            console.warn('No hay config para aplicar');
            return;
        }

        // Aplicar en orden de prioridad sin bloquear
        requestAnimationFrame(() => {
            this.applyBranding();
            this.applySocialMedia();
        });

        // Slider y video después (lazy)
        setTimeout(() => {
            this.initBannerSlider();
            this.initVideoEmbeds();
            // Inicializar certámenes si estamos en la página correcta
            this.initCertamenesGrid();
        }, 100);
    }

    /**
     * Aplica branding (logo, colores)
     */
    applyBranding() {
        if (!this.config.branding) return;

        const { primaryColor, secondaryColor, accentColor } = this.config.branding;

        // Actualizar CSS variables
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary-color', primaryColor);
        }
        if (secondaryColor) {
            document.documentElement.style.setProperty('--accent-color', secondaryColor);
        }
    }

    /**
     * Inicializa el slider de banners
     */
    initBannerSlider() {
        const container = document.getElementById('vyt-banner-slider');
        if (!container) {
            console.log('ℹ️ No se encontró contenedor de slider');
            return;
        }

        const activeBanners = this.config.banners
            .filter(b => b.active)
            .sort((a, b) => a.order - b.order);

        if (activeBanners.length === 0) {
            console.warn('No hay banners activos');
            return;
        }

        // Renderizar slider
        container.innerHTML = this.renderSlider(activeBanners);

        // Iniciar animación
        this.currentSlide = 0;
        this.isSliderActive = true;

        // Setup controls
        this.setupSliderControls(activeBanners.length);

        // Auto-play si está habilitado
        if (this.config.sliderConfig?.autoplay) {
            this.startAutoplay();
        }

        // Preload primera imagen
        if (this.config.performance?.preloadFirstBanner && activeBanners[0]) {
            const img = new Image();
            img.src = activeBanners[0].imageUrl;
        }

        console.log('🎠 Slider inicializado con', activeBanners.length, 'banners');
    }

    /**
     * Renderiza el HTML del slider
     */
    renderSlider(banners) {
        return `
            <div class="vyt-slider-wrapper">
                <div class="vyt-slider-container">
                    ${banners.map((banner, index) => `
                        <div class="vyt-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <div class="vyt-slide-image" 
                                 style="background-image: url('${banner.imageUrl}');"
                                 loading="${index === 0 ? 'eager' : 'lazy'}">
                                <div class="vyt-slide-overlay" style="background: ${banner.overlayColor};"></div>
                                <div class="vyt-slide-content">
                                    <h2 class="vyt-slide-title" style="color: ${banner.textColor};">
                                        ${banner.title}
                                    </h2>
                                    <p class="vyt-slide-description" style="color: ${banner.textColor};">
                                        ${banner.description}
                                    </p>
                                    ${banner.linkUrl ? `
                                        <a href="${banner.linkUrl}" 
                                           class="vyt-slide-btn vyt-btn-primary">
                                            ${banner.linkText || 'Más información'}
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${banners.length > 1 && this.config.sliderConfig?.showArrows ? `
                    <button class="vyt-slider-arrow vyt-slider-prev" aria-label="Anterior">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="vyt-slider-arrow vyt-slider-next" aria-label="Siguiente">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                ` : ''}

                ${banners.length > 1 && this.config.sliderConfig?.showIndicators ? `
                    <div class="vyt-slider-indicators">
                        ${banners.map((_, index) => `
                            <button class="vyt-indicator ${index === 0 ? 'active' : ''}" 
                                    data-index="${index}"
                                    aria-label="Ir a slide ${index + 1}">
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Configura controles del slider
     */
    setupSliderControls(totalSlides) {
        // Botones prev/next
        const prevBtn = document.querySelector('.vyt-slider-prev');
        const nextBtn = document.querySelector('.vyt-slider-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Indicadores
        const indicators = document.querySelectorAll('.vyt-indicator');
        indicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
            });
        });

        // Pause on hover
        if (this.config.sliderConfig?.pauseOnHover) {
            const slider = document.querySelector('.vyt-slider-wrapper');
            slider.addEventListener('mouseenter', () => this.pauseAutoplay());
            slider.addEventListener('mouseleave', () => this.resumeAutoplay());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isSliderActive) return;
            
            if (e.key === 'ArrowLeft') {
                this.previousSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        });
    }

    /**
     * Navega al slide siguiente
     */
    nextSlide() {
        const slides = document.querySelectorAll('.vyt-slide');
        const totalSlides = slides.length;
        
        if (totalSlides === 0) return;

        this.goToSlide((this.currentSlide + 1) % totalSlides);
    }

    /**
     * Navega al slide anterior
     */
    previousSlide() {
        const slides = document.querySelectorAll('.vyt-slide');
        const totalSlides = slides.length;
        
        if (totalSlides === 0) return;

        this.goToSlide((this.currentSlide - 1 + totalSlides) % totalSlides);
    }

    /**
     * Va a un slide específico
     */
    goToSlide(index) {
        const slides = document.querySelectorAll('.vyt-slide');
        const indicators = document.querySelectorAll('.vyt-indicator');

        if (!slides.length) return;

        // Remover active de todos
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));

        // Activar el nuevo
        slides[index]?.classList.add('active');
        indicators[index]?.classList.add('active');

        this.currentSlide = index;

        // Usar gamificación para animación suave
        if (window.vytGamification) {
            slides[index]?.classList.add('vyt-fade-in');
        }
    }

    /**
     * Inicia autoplay del slider
     */
    startAutoplay() {
        if (this.sliderInterval) {
            clearInterval(this.sliderInterval);
        }

        const interval = this.config.sliderConfig?.interval || 5000;
        
        this.sliderInterval = setInterval(() => {
            this.nextSlide();
        }, interval);
    }

    /**
     * Pausa el autoplay
     */
    pauseAutoplay() {
        if (this.sliderInterval) {
            clearInterval(this.sliderInterval);
            this.sliderInterval = null;
        }
    }

    /**
     * Reanuda el autoplay
     */
    resumeAutoplay() {
        if (this.config.sliderConfig?.autoplay) {
            this.startAutoplay();
        }
    }

    /**
     * Inicializa videos embebidos de YouTube
     */
    initVideoEmbeds() {
        const containers = document.querySelectorAll('[data-vyt-video]');
        
        containers.forEach(container => {
            const videoKey = container.dataset.vytVideo;
            const videoConfig = this.config.videos?.[videoKey];

            if (!videoConfig || !videoConfig.active) {
                container.style.display = 'none';
                return;
            }

            // Verificar si debe mostrarse en esta página
            const currentPage = this.getCurrentPage();
            if (videoConfig.showInPages && !videoConfig.showInPages.includes(currentPage)) {
                container.style.display = 'none';
                return;
            }

            // Renderizar video embed
            container.innerHTML = this.renderVideoEmbed(videoConfig);
        });

        console.log('📺 Videos embebidos inicializados');
    }

    /**
     * Renderiza un embed de YouTube responsive
     */
    renderVideoEmbed(videoConfig) {
        const { youtubeId, title, description, autoplay } = videoConfig;

        return `
            <div class="vyt-video-wrapper">
                <div class="vyt-video-header">
                    <h3 class="vyt-video-title">${title}</h3>
                    <p class="vyt-video-description">${description}</p>
                </div>
                <div class="vyt-video-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${youtubeId}${autoplay ? '?autoplay=1' : ''}"
                        title="${title}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        loading="lazy">
                    </iframe>
                </div>
            </div>
        `;
    }

    /**
     * Aplica links de redes sociales
     */
    applySocialMedia() {
        const container = document.getElementById('vyt-social-media');
        if (!container) return;

        const enabledNetworks = Object.entries(this.config.redesSociales || {})
            .filter(([key, network]) => network.enabled)
            .map(([key, network]) => ({ key, ...network }));

        if (enabledNetworks.length === 0) return;

        container.innerHTML = `
            <div class="vyt-social-links">
                ${enabledNetworks.map(network => `
                    <a href="${network.url}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="vyt-social-link"
                       style="color: ${network.color};"
                       aria-label="${network.username}">
                        <i class="${network.icon}"></i>
                        <span class="vyt-social-username">${network.username}</span>
                        <span class="vyt-social-followers">${network.followers}</span>
                    </a>
                `).join('')}
            </div>
        `;

        console.log('📱 Redes sociales aplicadas');
    }

    /**
     * Obtiene la página actual
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page;
    }

    /**
     * Carga assets de fallback si falla la config
     */
    loadFallbackAssets() {
        console.warn('⚠️ Usando assets de fallback');
        
        // Configuración mínima de emergencia
        this.config = {
            banners: [],
            videos: {},
            redesSociales: {},
            branding: {},
            sliderConfig: {}
        };
    }

    /**
     * Destruye el slider (cleanup)
     */
    destroy() {
        this.pauseAutoplay();
        this.isSliderActive = false;
        this.currentSlide = 0;
    }
}

// Inicialización global NO bloqueante
window.vytAssetsManager = null;

// Iniciar después de que se cargue gamification
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.vytAssetsManager = new VYTDynamicAssetsManager();
        }, 50); // Pequeño delay para no bloquear
    });
} else {
    setTimeout(() => {
        window.vytAssetsManager = new VYTDynamicAssetsManager();
    }, 50);
}

// Exportar para uso en otros contextos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VYTDynamicAssetsManager;
}

console.log('📦 VYT Dynamic Assets Manager cargado (async)');
