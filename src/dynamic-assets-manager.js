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
            this.showEmptyStateCertamenes(container);
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
     * Muestra empty state con opción de suscripción
     */
    showEmptyStateCertamenes(container) {
        const user = firebase?.auth()?.currentUser;
        const isLoggedIn = !!user;

        container.innerHTML = `
            <div class="vyt-empty-state-gamified" style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 65vh;
                text-align: center;
                padding: 20px;
                animation: fadeInScale 0.6s ease-out;
            ">
                <div style="max-width: 480px; position: relative;">
                    <!-- Badge COMING SOON animado -->
                    <div style="
                        display: inline-block;
                        background: linear-gradient(135deg, #f59e0b, #ef4444);
                        color: white;
                        font-weight: 700;
                        padding: 6px 18px;
                        border-radius: 50px;
                        font-size: 0.75rem;
                        letter-spacing: 1.5px;
                        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
                        animation: pulse 2s infinite;
                        margin-bottom: 25px;
                    ">
                        ⚡ PRÓXIMAMENTE
                    </div>
                    
                    <!-- Icono principal con efectos -->
                    <div style="
                        position: relative;
                        display: inline-block;
                        margin-bottom: 25px;
                    ">
                        <!-- Círculo de fondo con glow -->
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 120px;
                            height: 120px;
                            background: radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent);
                            border-radius: 50%;
                            animation: glow 3s ease-in-out infinite;
                        "></div>
                        
                        <!-- Icono micrófono 3D -->
                        <div style="
                            font-size: 70px;
                            filter: drop-shadow(0 8px 20px rgba(139, 92, 246, 0.5));
                            animation: float 3s ease-in-out infinite;
                            position: relative;
                            z-index: 2;
                        ">🎤</div>
                        
                        <!-- Partículas flotantes -->
                        <div style="
                            position: absolute;
                            top: 10%;
                            left: -20px;
                            font-size: 20px;
                            opacity: 0.7;
                            animation: sparkle1 2s infinite;
                        ">✨</div>
                        <div style="
                            position: absolute;
                            top: 25%;
                            right: -25px;
                            font-size: 18px;
                            opacity: 0.7;
                            animation: sparkle2 2.5s infinite;
                        ">⭐</div>
                        <div style="
                            position: absolute;
                            bottom: 15%;
                            left: -15px;
                            font-size: 16px;
                            opacity: 0.6;
                            animation: sparkle3 3s infinite;
                        ">🎵</div>
                    </div>
                    
                    <!-- Título llamativo -->
                    <h2 style="
                        font-size: clamp(1.75rem, 4vw, 2.25rem);
                        font-weight: 800;
                        background: linear-gradient(135deg, #fff, #a78bfa, #60a5fa);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        margin-bottom: 12px;
                        line-height: 1.3;
                    ">
                        Nuevos Certámenes en Camino
                    </h2>
                    
                    <p style="
                        font-size: 1rem;
                        color: rgba(255,255,255,0.85);
                        margin-bottom: 30px;
                        line-height: 1.6;
                        font-weight: 400;
                    ">
                        ${isLoggedIn 
                            ? 'Sé el primero en enterarte cuando lancemos nuevos certámenes' 
                            : 'Dejanos tu email y te avisamos antes que nadie'}
                    </p>
                    
                    <!-- Card de acción con glassmorphism -->
                    <div style="
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15));
                        backdrop-filter: blur(15px);
                        border-radius: 18px;
                        padding: 28px 24px;
                        border: 1.5px solid rgba(255, 255, 255, 0.2);
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1);
                    ">
                        ${isLoggedIn ? `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 10px;
                                margin-bottom: 18px;
                                padding: 12px;
                                background: rgba(16, 185, 129, 0.12);
                                border-radius: 10px;
                                border: 1px solid rgba(16, 185, 129, 0.25);
                            ">
                                <i class="fas fa-check-circle" style="color: #10b981; font-size: 1.1rem;"></i>
                                <span style="color: white; font-size: 0.9rem; font-weight: 500;">
                                    ${user.email}
                                </span>
                            </div>
                            <button id="btnSuscribirNuevos" onclick="suscribirseACertamenes()" style="
                                width: 100%;
                                background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                                color: white;
                                border: none;
                                padding: 16px 32px;
                                border-radius: 12px;
                                font-size: 1rem;
                                font-weight: 700;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
                                position: relative;
                                overflow: hidden;
                            ">
                                <span style="position: relative; z-index: 2;">
                                    <i class="fas fa-bell" style="margin-right: 8px; animation: ring 2s infinite;"></i>
                                    Avisarme de Nuevos Certámenes
                                </span>
                            </button>
                            <p id="mensajeSuscripcion" style="
                                color: #10b981;
                                margin-top: 15px;
                                display: none;
                                font-weight: 600;
                                font-size: 0.95rem;
                                animation: fadeIn 0.3s;
                            ">
                                <i class="fas fa-check-double"></i> ¡Listo! Te avisaremos por email
                            </p>
                        ` : `
                            <form id="emailSubscriptionForm" style="display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                    <input 
                                        type="email" 
                                        id="subscriberEmail" 
                                        placeholder="✉️ tu@email.com" 
                                        required
                                        style="
                                            flex: 1;
                                            min-width: 200px;
                                            padding: 14px 20px;
                                            border-radius: 12px;
                                            background: rgba(255,255,255,0.08);
                                            border: 1.5px solid rgba(255,255,255,0.25);
                                            color: white;
                                            font-size: 0.95rem;
                                            outline: none;
                                            transition: all 0.3s;
                                            font-weight: 400;
                                        "
                                    />
                                    <button 
                                        type="submit" 
                                        style="
                                            padding: 14px 28px;
                                            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                                            color: white;
                                            border: none;
                                            border-radius: 12px;
                                            font-size: 0.95rem;
                                            font-weight: 700;
                                            cursor: pointer;
                                            transition: all 0.3s ease;
                                            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
                                            white-space: nowrap;
                                        ">
                                        <i class="fas fa-paper-plane" style="margin-right: 6px;"></i>Avisarme
                                    </button>
                                </div>
                                <p id="subscriptionMessage" style="
                                    color: #10b981;
                                    margin: 0;
                                    display: none;
                                    font-weight: 600;
                                    font-size: 0.9rem;
                                    animation: fadeIn 0.3s;
                                "></p>
                            </form>
                        `}
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes glow {
                    0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.08); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                }
                @keyframes sparkle1 {
                    0%, 100% { opacity: 0.3; transform: translateY(0) rotate(0deg); }
                    50% { opacity: 1; transform: translateY(-10px) rotate(180deg); }
                }
                @keyframes sparkle2 {
                    0%, 100% { opacity: 0.4; transform: translateY(0) rotate(0deg) scale(1); }
                    50% { opacity: 1; transform: translateY(-15px) rotate(-180deg) scale(1.2); }
                }
                @keyframes sparkle3 {
                    0%, 100% { opacity: 0.5; transform: translateX(0); }
                    50% { opacity: 1; transform: translateX(-10px); }
                }
                @keyframes ring {
                    0%, 100% { transform: rotate(0deg); }
                    10%, 30% { transform: rotate(-10deg); }
                    20%, 40% { transform: rotate(10deg); }
                    50% { transform: rotate(0deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                #subscriberEmail:focus {
                    border-color: #8b5cf6;
                    background: rgba(255,255,255,0.15);
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
                }
                
                #btnSuscribirNuevos:hover,
                form button[type="submit"]:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 35px rgba(139, 92, 246, 0.6);
                }
                
                #btnSuscribirNuevos:active,
                form button[type="submit"]:active {
                    transform: translateY(0px);
                }
                
                /* Responsive */
                @media (max-width: 640px) {
                    form > div {
                        flex-direction: column;
                    }
                    form input,
                    form button {
                        width: 100%;
                    }
                }
            </style>
        `;
        
        // Agregar event listener si no está logueado
        if (!isLoggedIn) {
            setTimeout(() => {
                const form = document.getElementById('emailSubscriptionForm');
                if (form) {
                    form.addEventListener('submit', this.handleEmailSubscription.bind(this));
                }
            }, 100);
        }
    }

    /**
     * Maneja la suscripción de email
     */
    async handleEmailSubscription(e) {
        e.preventDefault();
        const email = document.getElementById('subscriberEmail').value;
        const message = document.getElementById('subscriptionMessage');
        
        try {
            // Guardar en Firestore
            const db = firebase.firestore();
            await db.collection('email_subscriptions').add({
                email: email,
                tipo: 'nuevos_certamenes',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                origen: 'certamenes_empty_state'
            });
            
            message.style.display = 'block';
            message.innerHTML = '<i class="fas fa-check"></i> ¡Listo! Te avisaremos cuando haya nuevos certámenes';
            document.getElementById('subscriberEmail').value = '';
            
            setTimeout(() => {
                message.style.display = 'none';
            }, 5000);
        } catch (error) {
            console.error('Error guardando suscripción:', error);
            message.style.display = 'block';
            message.style.color = '#ef4444';
            message.textContent = 'Error al suscribirse. Intenta de nuevo.';
        }
    }

    /**
     * Muestra mensaje de error
     */
    showCertamenesError(container) {
        container.innerHTML = `
            <div class="vyt-empty-state" style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 80px; color: #ef4444; margin-bottom: 20px;"></i>
                <h3 style="font-size: 2rem; color: white; margin-bottom: 15px;">Error al cargar certámenes</h3>
                <p style="color: rgba(255,255,255,0.7); font-size: 1.1rem; margin-bottom: 25px;">Por favor, intenta recargar la página</p>
                <button onclick="window.location.reload()" style="background: linear-gradient(135deg, #3B82F6, #2DD4BF); color: white; border: none; padding: 15px 30px; border-radius: 50px; font-size: 1rem; font-weight: 700; cursor: pointer;">
                    <i class="fas fa-redo" style="margin-right: 8px;"></i>Recargar Página
                </button>
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
            // Inicializar certamenes cuando Firebase este listo
            this.initCertamenesGridWhenReady();
        }, 100);
    }

    /**
     * Espera Firebase antes de cargar certamenes
     */
    initCertamenesGridWhenReady() {
        const tryInit = () => {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                this.initCertamenesGrid();
                return true;
            }
            return false;
        };

        if (tryInit()) return;

        if (typeof window !== 'undefined') {
            window.addEventListener('firebaseReady', () => {
                tryInit();
            }, { once: true });
        }

        setTimeout(() => {
            tryInit();
        }, 8000);
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
