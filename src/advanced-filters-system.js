/**
 * Sistema de Filtros Avanzados - VYT Music Online
 * Filtros inteligentes por provincia, modalidad, género musical y fechas
 */

class AdvancedFiltersSystem {
    constructor() {
        this.filters = {
            province: 'all',
            modality: 'all',
            genre: 'all',
            dateRange: 'all',
            priceRange: 'all',
            ageCategory: 'all'
        };
        this.originalResults = [];
        this.filteredResults = [];
        this.filterContainer = null;
        this.init();
    }

    init() {
        this.injectCSS();
        this.createFilterSystem();
        this.setupEventListeners();
        this.loadInitialData();
        console.log('🔍 Sistema de Filtros Avanzados iniciado');
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Advanced Filters System Styles */
            .advanced-filters-container {
                background: white;
                border-radius: 20px;
                padding: 25px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 2px solid #f1f5f9;
                transition: all 0.3s ease;
            }

            .advanced-filters-container:hover {
                border-color: #667eea;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }

            .filters-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f1f5f9;
            }

            .filters-title {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 20px;
                font-weight: 600;
                color: #1e293b;
                margin: 0;
            }

            .filters-icon {
                font-size: 24px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }

            .filters-toggle {
                background: none;
                border: none;
                font-size: 18px;
                color: #667eea;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                transition: all 0.3s ease;
            }

            .filters-toggle:hover {
                background: rgba(102, 126, 234, 0.1);
                transform: rotate(180deg);
            }

            .filters-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .filters-content.expanded {
                max-height: 500px;
            }

            .filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }

            .filter-group {
                background: #f8fafc;
                border-radius: 12px;
                padding: 15px;
                border: 1px solid #e5e7eb;
                transition: all 0.3s ease;
            }

            .filter-group:hover {
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.05);
            }

            .filter-label {
                font-size: 14px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 10px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .filter-select {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                font-size: 14px;
                color: #1e293b;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .filter-select:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                outline: none;
            }

            .filter-select:hover {
                border-color: #667eea;
            }

            .filter-input {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                font-size: 14px;
                color: #1e293b;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .filter-input:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                outline: none;
            }

            .filter-range {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .filter-range input {
                flex: 1;
                min-width: 0;
            }

            .filter-range-separator {
                color: #64748b;
                font-weight: 500;
            }

            .filters-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }

            .filter-btn {
                padding: 12px 20px;
                border: none;
                border-radius: 25px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 120px;
                justify-content: center;
            }

            .filter-btn-primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }

            .filter-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .filter-btn-secondary {
                background: #f1f5f9;
                color: #64748b;
                border: 1px solid #e5e7eb;
            }

            .filter-btn-secondary:hover {
                background: #e5e7eb;
                color: #1e293b;
            }

            .filter-btn-clear {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }

            .filter-btn-clear:hover {
                background: #fee2e2;
                border-color: #fca5a5;
            }

            .active-filters {
                margin: 15px 0;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .active-filter-tag {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                animation: filterSlideIn 0.3s ease;
            }

            .active-filter-remove {
                background: rgba(255, 255, 255, 0.3);
                border: none;
                color: white;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .active-filter-remove:hover {
                background: rgba(255, 255, 255, 0.5);
                transform: rotate(90deg);
            }

            @keyframes filterSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-10px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
            }

            .results-container {
                margin-top: 30px;
            }

            .results-header {
                display: flex;
                align-items: center;
                justify-content: between;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8fafc;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
            }

            .results-count {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
            }

            .results-count-number {
                color: #667eea;
                font-size: 24px;
            }

            .results-sort {
                margin-left: auto;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .results-sort select {
                padding: 8px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background: white;
                font-size: 14px;
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
            }

            .result-card {
                background: white;
                border-radius: 16px;
                padding: 20px;
                border: 2px solid #f1f5f9;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .result-card:hover {
                border-color: #667eea;
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }

            .result-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: linear-gradient(135deg, #667eea, #764ba2);
            }

            .result-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 10px 0;
            }

            .result-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 15px;
            }

            .result-meta-item {
                background: #f1f5f9;
                color: #64748b;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }

            .result-description {
                color: #64748b;
                line-height: 1.6;
                margin-bottom: 15px;
                font-size: 14px;
            }

            .result-actions {
                display: flex;
                gap: 10px;
            }

            .result-btn {
                flex: 1;
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }

            .result-btn-primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }

            .result-btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }

            .result-btn-secondary {
                background: #f1f5f9;
                color: #64748b;
            }

            .result-btn-secondary:hover {
                background: #e5e7eb;
                color: #1e293b;
            }

            .no-results {
                text-align: center;
                padding: 60px 20px;
                color: #64748b;
            }

            .no-results-icon {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.5;
            }

            .no-results h3 {
                font-size: 24px;
                color: #1e293b;
                margin: 0 0 10px 0;
            }

            .no-results p {
                font-size: 16px;
                margin: 0 0 20px 0;
            }

            .no-results-suggestions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }

            .no-results-suggestion {
                background: #f1f5f9;
                color: #667eea;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .no-results-suggestion:hover {
                background: rgba(102, 126, 234, 0.1);
                transform: translateY(-1px);
            }

            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .advanced-filters-container {
                    margin: 15px 0;
                    padding: 20px;
                }

                .filters-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .filter-range {
                    flex-direction: column;
                    gap: 8px;
                }

                .filter-range-separator {
                    display: none;
                }

                .filters-actions {
                    flex-direction: column;
                }

                .filter-btn {
                    min-width: auto;
                    width: 100%;
                }

                .results-header {
                    flex-direction: column;
                    gap: 15px;
                    align-items: stretch;
                }

                .results-sort {
                    margin-left: 0;
                }

                .results-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .result-meta {
                    flex-direction: column;
                    gap: 8px;
                }

                .result-actions {
                    flex-direction: column;
                }
            }

            /* Animation for filter changes */
            .results-container {
                opacity: 1;
                transition: opacity 0.3s ease;
            }

            .results-container.filtering {
                opacity: 0.6;
            }

            .result-card {
                animation: resultSlideIn 0.5s ease forwards;
            }

            @keyframes resultSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Loading States */
            .filter-loading {
                position: relative;
                opacity: 0.7;
            }

            .filter-loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                border: 2px solid #667eea;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                transform: translate(-50%, -50%);
            }

            @keyframes spin {
                to {
                    transform: translate(-50%, -50%) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    createFilterSystem() {
        // Buscar contenedor apropiado
        const targets = [
            '.certamenes-section',
            '.search-section',
            '.main-content',
            'main',
            'body'
        ];

        let container = null;
        for (const selector of targets) {
            container = document.querySelector(selector);
            if (container) break;
        }

        if (!container) {
            console.warn('No se encontró contenedor para los filtros');
            return;
        }

        // Crear estructura de filtros
        this.filterContainer = document.createElement('div');
        this.filterContainer.className = 'advanced-filters-container';
        this.filterContainer.innerHTML = this.createFilterHTML();

        // Insertar al principio del contenedor
        container.insertBefore(this.filterContainer, container.firstChild);

        // Configurar event listeners
        this.setupFilterEventListeners();

        // Expandir automáticamente
        setTimeout(() => {
            const content = this.filterContainer.querySelector('.filters-content');
            if (content) {
                content.classList.add('expanded');
            }
        }, 500);
    }

    createFilterHTML() {
        return `
            <div class="filters-header">
                <h3 class="filters-title">
                    <div class="filters-icon">🔍</div>
                    Filtros Avanzados
                </h3>
                <button class="filters-toggle" title="Mostrar/Ocultar filtros">🔽</button>
            </div>
            
            <div class="filters-content expanded">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label class="filter-label">📍 Provincia</label>
                        <select class="filter-select" data-filter="province">
                            <option value="all">Todas las provincias</option>
                            <option value="buenos-aires">Buenos Aires</option>
                            <option value="cordoba">Córdoba</option>
                            <option value="santa-fe">Santa Fe</option>
                            <option value="mendoza">Mendoza</option>
                            <option value="tucuman">Tucumán</option>
                            <option value="entre-rios">Entre Ríos</option>
                            <option value="salta">Salta</option>
                            <option value="misiones">Misiones</option>
                            <option value="chaco">Chaco</option>
                            <option value="corrientes">Corrientes</option>
                            <option value="santiago-del-estero">Santiago del Estero</option>
                            <option value="jujuy">Jujuy</option>
                            <option value="rio-negro">Río Negro</option>
                            <option value="formosa">Formosa</option>
                            <option value="neuquen">Neuquén</option>
                            <option value="chubut">Chubut</option>
                            <option value="san-luis">San Luis</option>
                            <option value="catamarca">Catamarca</option>
                            <option value="la-rioja">La Rioja</option>
                            <option value="san-juan">San Juan</option>
                            <option value="la-pampa">La Pampa</option>
                            <option value="santa-cruz">Santa Cruz</option>
                            <option value="tierra-del-fuego">Tierra del Fuego</option>
                            <option value="caba">CABA</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">🎯 Modalidad</label>
                        <select class="filter-select" data-filter="modality">
                            <option value="all">Todas las modalidades</option>
                            <option value="online">Online</option>
                            <option value="presencial">Presencial</option>
                            <option value="hibrido">Híbrido</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">🎵 Género Musical</label>
                        <select class="filter-select" data-filter="genre">
                            <option value="all">Todos los géneros</option>
                            <option value="pop">Pop</option>
                            <option value="rock">Rock</option>
                            <option value="folklore">Folklore</option>
                            <option value="tango">Tango</option>
                            <option value="cumbia">Cumbia</option>
                            <option value="reggaeton">Reggaetón</option>
                            <option value="indie">Indie</option>
                            <option value="jazz">Jazz</option>
                            <option value="blues">Blues</option>
                            <option value="electronica">Electrónica</option>
                            <option value="clasica">Clásica</option>
                            <option value="rap">Rap/Hip-Hop</option>
                            <option value="balada">Balada</option>
                            <option value="cuarteto">Cuarteto</option>
                            <option value="tropical">Tropical</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">📅 Período</label>
                        <select class="filter-select" data-filter="dateRange">
                            <option value="all">Todos los períodos</option>
                            <option value="current">Inscripciones abiertas</option>
                            <option value="upcoming">Próximamente</option>
                            <option value="this-month">Este mes</option>
                            <option value="next-month">Próximo mes</option>
                            <option value="this-quarter">Este trimestre</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">💰 Rango de Precio</label>
                        <select class="filter-select" data-filter="priceRange">
                            <option value="all">Todos los precios</option>
                            <option value="free">Gratuitos</option>
                            <option value="low">$0 - $2,000</option>
                            <option value="mid">$2,001 - $5,000</option>
                            <option value="high">$5,001+</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">👥 Categoría de Edad</label>
                        <select class="filter-select" data-filter="ageCategory">
                            <option value="all">Todas las edades</option>
                            <option value="infantil">Infantil (6-12 años)</option>
                            <option value="juvenil">Juvenil (13-17 años)</option>
                            <option value="adulto">Adulto (18-35 años)</option>
                            <option value="abierto">Abierto (36+ años)</option>
                        </select>
                    </div>
                </div>

                <div class="active-filters"></div>

                <div class="filters-actions">
                    <button class="filter-btn filter-btn-primary" data-action="apply">
                        🔍 Aplicar Filtros
                    </button>
                    <button class="filter-btn filter-btn-secondary" data-action="save">
                        💾 Guardar Búsqueda
                    </button>
                    <button class="filter-btn filter-btn-clear" data-action="clear">
                        🗑️ Limpiar Filtros
                    </button>
                </div>
            </div>

            <div class="results-container">
                <div class="results-header">
                    <div class="results-count">
                        <span class="results-count-number">0</span> certámenes encontrados
                    </div>
                    <div class="results-sort">
                        <label>Ordenar por:</label>
                        <select data-sort="date">
                            <option value="date">Fecha</option>
                            <option value="price">Precio</option>
                            <option value="popularity">Popularidad</option>
                            <option value="alphabetical">A-Z</option>
                        </select>
                    </div>
                </div>
                <div class="results-grid"></div>
            </div>
        `;
    }

    setupFilterEventListeners() {
        if (!this.filterContainer) return;

        // Toggle de filtros
        const toggle = this.filterContainer.querySelector('.filters-toggle');
        const content = this.filterContainer.querySelector('.filters-content');
        
        toggle.addEventListener('click', () => {
            content.classList.toggle('expanded');
            toggle.style.transform = content.classList.contains('expanded') ? 
                'rotate(180deg)' : 'rotate(0deg)';
        });

        // Filtros individuales
        const filterInputs = this.filterContainer.querySelectorAll('.filter-select');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateFilters();
                this.applyFilters();
            });
        });

        // Botones de acción
        const actionButtons = this.filterContainer.querySelectorAll('[data-action]');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                this.handleFilterAction(action);
            });
        });

        // Ordenamiento
        const sortSelect = this.filterContainer.querySelector('[data-sort]');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortResults(sortSelect.value);
            });
        }
    }

    updateFilters() {
        const filterInputs = this.filterContainer.querySelectorAll('.filter-select');
        
        filterInputs.forEach(input => {
            const filterType = input.getAttribute('data-filter');
            this.filters[filterType] = input.value;
        });

        this.updateActiveFilters();
    }

    updateActiveFilters() {
        const activeFiltersContainer = this.filterContainer.querySelector('.active-filters');
        activeFiltersContainer.innerHTML = '';

        Object.keys(this.filters).forEach(filterType => {
            const value = this.filters[filterType];
            if (value && value !== 'all') {
                const tag = this.createActiveFilterTag(filterType, value);
                activeFiltersContainer.appendChild(tag);
            }
        });
    }

    createActiveFilterTag(filterType, value) {
        const tag = document.createElement('div');
        tag.className = 'active-filter-tag';
        
        const labels = {
            province: '📍',
            modality: '🎯',
            genre: '🎵',
            dateRange: '📅',
            priceRange: '💰',
            ageCategory: '👥'
        };

        const readableValues = {
            // Provincias
            'buenos-aires': 'Buenos Aires',
            'cordoba': 'Córdoba',
            'santa-fe': 'Santa Fe',
            // ... más valores
            // Modalidades
            'online': 'Online',
            'presencial': 'Presencial',
            'hibrido': 'Híbrido',
            // Géneros
            'pop': 'Pop',
            'rock': 'Rock',
            'folklore': 'Folklore',
            // ... más valores
        };

        const readableValue = readableValues[value] || value;
        
        tag.innerHTML = `
            <span>${labels[filterType]} ${readableValue}</span>
            <button class="active-filter-remove" data-remove="${filterType}">×</button>
        `;

        // Event listener para remover filtro
        const removeBtn = tag.querySelector('.active-filter-remove');
        removeBtn.addEventListener('click', () => {
            this.removeFilter(filterType);
        });

        return tag;
    }

    removeFilter(filterType) {
        this.filters[filterType] = 'all';
        
        // Actualizar el select correspondiente
        const select = this.filterContainer.querySelector(`[data-filter="${filterType}"]`);
        if (select) {
            select.value = 'all';
        }

        this.updateActiveFilters();
        this.applyFilters();
    }

    handleFilterAction(action) {
        switch (action) {
            case 'apply':
                this.applyFilters();
                break;
            case 'save':
                this.saveSearch();
                break;
            case 'clear':
                this.clearAllFilters();
                break;
        }
    }

    applyFilters() {
        this.showLoading();
        
        // Simular delay de búsqueda
        setTimeout(() => {
            this.filterResults();
            this.renderResults();
            this.hideLoading();
        }, 500);
    }

    filterResults() {
        // Datos de ejemplo para demostrar funcionalidad
        this.filteredResults = this.generateSampleResults().filter(result => {
            // Aplicar filtros
            if (this.filters.province !== 'all' && result.province !== this.filters.province) {
                return false;
            }
            
            if (this.filters.modality !== 'all' && result.modality !== this.filters.modality) {
                return false;
            }
            
            if (this.filters.genre !== 'all' && result.genre !== this.filters.genre) {
                return false;
            }
            
            if (this.filters.priceRange !== 'all') {
                const price = result.price;
                switch (this.filters.priceRange) {
                    case 'free':
                        if (price > 0) return false;
                        break;
                    case 'low':
                        if (price > 2000) return false;
                        break;
                    case 'mid':
                        if (price <= 2000 || price > 5000) return false;
                        break;
                    case 'high':
                        if (price <= 5000) return false;
                        break;
                }
            }
            
            return true;
        });
    }

    generateSampleResults() {
        // Datos de ejemplo que simularían venir de una API
        return [
            {
                id: 1,
                title: 'Certamen Nacional de Pop 2025',
                province: 'buenos-aires',
                modality: 'online',
                genre: 'pop',
                price: 2500,
                ageCategory: 'adulto',
                date: '2025-02-15',
                description: 'El certamen más importante de música pop en Argentina. Participa desde casa y compite con los mejores.',
                status: 'open'
            },
            {
                id: 2,
                title: 'Festival de Folklore Cordobés',
                province: 'cordoba',
                modality: 'presencial',
                genre: 'folklore',
                price: 1500,
                ageCategory: 'all',
                date: '2025-03-10',
                description: 'Celebra nuestras tradiciones musicales en el corazón de Córdoba.',
                status: 'upcoming'
            },
            {
                id: 3,
                title: 'Rock Joven Santa Fe',
                province: 'santa-fe',
                modality: 'hibrido',
                genre: 'rock',
                price: 3000,
                ageCategory: 'juvenil',
                date: '2025-02-28',
                description: 'Para las nuevas generaciones del rock argentino.',
                status: 'open'
            },
            {
                id: 4,
                title: 'Tango Porteño Virtual',
                province: 'caba',
                modality: 'online',
                genre: 'tango',
                price: 2000,
                ageCategory: 'adulto',
                date: '2025-03-05',
                description: 'El tango clásico en formato virtual. Para verdaderos apasionados.',
                status: 'open'
            },
            {
                id: 5,
                title: 'Certamen Infantil de Canto',
                province: 'mendoza',
                modality: 'online',
                genre: 'pop',
                price: 0,
                ageCategory: 'infantil',
                date: '2025-04-01',
                description: 'Concurso gratuito para los más pequeños. ¡Sin costo de inscripción!',
                status: 'upcoming'
            }
        ];
    }

    renderResults() {
        const resultsGrid = this.filterContainer.querySelector('.results-grid');
        const resultsCount = this.filterContainer.querySelector('.results-count-number');
        
        // Actualizar contador
        resultsCount.textContent = this.filteredResults.length;
        
        if (this.filteredResults.length === 0) {
            resultsGrid.innerHTML = this.createNoResultsHTML();
            return;
        }

        // Renderizar resultados
        resultsGrid.innerHTML = this.filteredResults.map(result => `
            <div class="result-card">
                <h3 class="result-title">${result.title}</h3>
                <div class="result-meta">
                    <span class="result-meta-item">📍 ${this.getProvinceName(result.province)}</span>
                    <span class="result-meta-item">🎯 ${this.getModalityName(result.modality)}</span>
                    <span class="result-meta-item">🎵 ${this.getGenreName(result.genre)}</span>
                    <span class="result-meta-item">💰 ${result.price === 0 ? 'Gratuito' : '$' + result.price.toLocaleString()}</span>
                </div>
                <p class="result-description">${result.description}</p>
                <div class="result-actions">
                    <button class="result-btn result-btn-primary">Ver Detalles</button>
                    <button class="result-btn result-btn-secondary">Inscribirse</button>
                </div>
            </div>
        `).join('');
    }

    createNoResultsHTML() {
        return `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No encontramos certámenes</h3>
                <p>No hay certámenes que coincidan con tus filtros actuales</p>
                <div class="no-results-suggestions">
                    <span class="no-results-suggestion" onclick="advancedFilters.suggestFilter('province', 'all')">
                        📍 Todas las provincias
                    </span>
                    <span class="no-results-suggestion" onclick="advancedFilters.suggestFilter('genre', 'all')">
                        🎵 Todos los géneros
                    </span>
                    <span class="no-results-suggestion" onclick="advancedFilters.suggestFilter('modality', 'online')">
                        🎯 Solo online
                    </span>
                    <span class="no-results-suggestion" onclick="advancedFilters.clearAllFilters()">
                        🗑️ Limpiar filtros
                    </span>
                </div>
            </div>
        `;
    }

    getProvinceName(code) {
        const names = {
            'buenos-aires': 'Buenos Aires',
            'cordoba': 'Córdoba',
            'santa-fe': 'Santa Fe',
            'caba': 'CABA',
            'mendoza': 'Mendoza'
            // ... más provincias
        };
        return names[code] || code;
    }

    getModalityName(code) {
        const names = {
            'online': 'Online',
            'presencial': 'Presencial',
            'hibrido': 'Híbrido'
        };
        return names[code] || code;
    }

    getGenreName(code) {
        const names = {
            'pop': 'Pop',
            'rock': 'Rock',
            'folklore': 'Folklore',
            'tango': 'Tango'
        };
        return names[code] || code;
    }

    clearAllFilters() {
        // Reset all filters
        Object.keys(this.filters).forEach(key => {
            this.filters[key] = 'all';
        });

        // Reset all selects
        const selects = this.filterContainer.querySelectorAll('.filter-select');
        selects.forEach(select => {
            select.value = 'all';
        });

        this.updateActiveFilters();
        this.applyFilters();
    }

    suggestFilter(filterType, value) {
        this.filters[filterType] = value;
        const select = this.filterContainer.querySelector(`[data-filter="${filterType}"]`);
        if (select) {
            select.value = value;
        }
        this.updateActiveFilters();
        this.applyFilters();
    }

    saveSearch() {
        const searchData = {
            filters: { ...this.filters },
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        localStorage.setItem('vyt_saved_search', JSON.stringify(searchData));
        
        if (window.showToast) {
            showToast('🔖 Búsqueda guardada correctamente', 'success', 3000);
        } else {
            alert('Búsqueda guardada correctamente');
        }
    }

    loadSavedSearch() {
        const savedSearch = localStorage.getItem('vyt_saved_search');
        if (savedSearch) {
            try {
                const searchData = JSON.parse(savedSearch);
                this.filters = { ...searchData.filters };
                
                // Actualizar selects
                Object.keys(this.filters).forEach(filterType => {
                    const select = this.filterContainer.querySelector(`[data-filter="${filterType}"]`);
                    if (select) {
                        select.value = this.filters[filterType];
                    }
                });
                
                this.updateActiveFilters();
                this.applyFilters();
            } catch (e) {
                console.error('Error loading saved search:', e);
            }
        }
    }

    showLoading() {
        const resultsContainer = this.filterContainer.querySelector('.results-container');
        resultsContainer.classList.add('filtering');
    }

    hideLoading() {
        const resultsContainer = this.filterContainer.querySelector('.results-container');
        resultsContainer.classList.remove('filtering');
    }

    sortResults(sortBy) {
        switch (sortBy) {
            case 'date':
                this.filteredResults.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'price':
                this.filteredResults.sort((a, b) => a.price - b.price);
                break;
            case 'alphabetical':
                this.filteredResults.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'popularity':
                // Simular popularidad
                this.filteredResults.sort(() => Math.random() - 0.5);
                break;
        }
        
        this.renderResults();
    }

    loadInitialData() {
        // Cargar datos iniciales
        setTimeout(() => {
            this.applyFilters();
        }, 100);

        // Intentar cargar búsqueda guardada
        setTimeout(() => {
            if (localStorage.getItem('vyt_saved_search')) {
                if (confirm('¿Quieres cargar tu búsqueda guardada?')) {
                    this.loadSavedSearch();
                }
            }
        }, 2000);
    }

    setupEventListeners() {
        // Escuchar cambios de URL
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                if (!document.querySelector('.advanced-filters-container')) {
                    this.createFilterSystem();
                }
            }, 500);
        });
    }

    // API pública
    static init() {
        return new AdvancedFiltersSystem();
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.advancedFilters = AdvancedFiltersSystem.init();
});

// Global function for suggestions
window.advancedFilters = window.advancedFilters || {};

// Export
window.AdvancedFiltersSystem = AdvancedFiltersSystem;