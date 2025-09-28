/**
 * Sistema de Información de Premios y Jurado - VYT Music Online
 * Responde a la necesidad de más transparencia sobre premios y evaluación
 */

class PrizesInfoSystem {
    constructor() {
        this.currentModal = null;
        this.init();
    }

    init() {
        this.injectCSS();
        this.createInfoButtons();
        this.setupEventListeners();
        console.log('🏆 Sistema de Información de Premios iniciado');
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Prizes Info System Styles */
            .prizes-info-btn {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                position: relative;
                overflow: hidden;
            }

            .prizes-info-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
            }

            .prizes-info-btn:active {
                transform: translateY(-1px);
            }

            .prizes-info-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                transition: left 0.5s ease;
            }

            .prizes-info-btn:hover::before {
                left: 100%;
            }

            .prizes-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                padding: 20px;
                box-sizing: border-box;
            }

            .prizes-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .prizes-modal-content {
                background: white;
                border-radius: 20px;
                max-width: 900px;
                width: 100%;
                margin: 0 auto;
                position: relative;
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s ease;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            }

            .prizes-modal.show .prizes-modal-content {
                transform: scale(1) translateY(0);
            }

            .prizes-modal-header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 30px;
                border-radius: 20px 20px 0 0;
                text-align: center;
                position: relative;
            }

            .prizes-modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 24px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .prizes-modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }

            .prizes-modal-title {
                font-size: 32px;
                margin: 0 0 10px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .prizes-modal-subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin: 0;
            }

            .prizes-tabs {
                display: flex;
                background: #f8fafc;
                padding: 0;
                margin: 0;
                border-bottom: 1px solid #e5e7eb;
            }

            .prizes-tab {
                flex: 1;
                background: none;
                border: none;
                padding: 20px;
                font-size: 16px;
                font-weight: 600;
                color: #64748b;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }

            .prizes-tab:hover {
                color: #667eea;
                background: rgba(102, 126, 234, 0.05);
            }

            .prizes-tab.active {
                color: #667eea;
                background: white;
            }

            .prizes-tab.active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: linear-gradient(90deg, #667eea, #764ba2);
            }

            .prizes-tab-content {
                padding: 40px;
                display: none;
            }

            .prizes-tab-content.active {
                display: block;
            }

            .prize-category {
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border-radius: 16px;
                padding: 30px;
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }

            .prize-category::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 5px;
                height: 100%;
                background: linear-gradient(135deg, #667eea, #764ba2);
            }

            .prize-category-title {
                font-size: 24px;
                font-weight: bold;
                color: #1e293b;
                margin: 0 0 15px 0;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .prize-category-description {
                color: #64748b;
                margin-bottom: 25px;
                font-size: 16px;
                line-height: 1.6;
            }

            .prize-list {
                display: grid;
                gap: 20px;
            }

            .prize-item {
                background: white;
                border-radius: 12px;
                padding: 25px;
                display: flex;
                align-items: center;
                gap: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                transition: all 0.3s ease;
            }

            .prize-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
            }

            .prize-position {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                font-weight: bold;
                font-size: 18px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .prize-position.first {
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
            }

            .prize-position.second {
                background: linear-gradient(135deg, #94a3b8, #64748b);
            }

            .prize-position.third {
                background: linear-gradient(135deg, #f97316, #ea580c);
            }

            .prize-details {
                flex: 1;
            }

            .prize-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 8px 0;
            }

            .prize-value {
                font-size: 24px;
                font-weight: bold;
                color: #059669;
                margin: 0 0 8px 0;
            }

            .prize-description {
                color: #64748b;
                margin: 0;
            }

            .judge-profile {
                background: white;
                border-radius: 16px;
                padding: 30px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                transition: all 0.3s ease;
            }

            .judge-profile:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
            }

            .judge-header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
            }

            .judge-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea, #764ba2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: white;
                flex-shrink: 0;
            }

            .judge-info h3 {
                font-size: 20px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 5px 0;
            }

            .judge-title {
                color: #667eea;
                font-weight: 500;
                margin: 0 0 8px 0;
            }

            .judge-specialties {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .judge-specialty {
                background: rgba(102, 126, 234, 0.1);
                color: #667eea;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
            }

            .judge-bio {
                color: #64748b;
                line-height: 1.6;
                margin-top: 15px;
            }

            .criteria-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 25px;
                margin-top: 30px;
            }

            .criteria-item {
                background: white;
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                transition: all 0.3s ease;
            }

            .criteria-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
            }

            .criteria-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }

            .criteria-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 10px 0;
            }

            .criteria-weight {
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
                margin: 0 0 10px 0;
            }

            .criteria-description {
                color: #64748b;
                font-size: 14px;
                margin: 0;
            }

            .timeline-container {
                position: relative;
                padding: 30px 0;
            }

            .timeline-line {
                position: absolute;
                left: 30px;
                top: 0;
                bottom: 0;
                width: 3px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 2px;
            }

            .timeline-item {
                position: relative;
                padding-left: 80px;
                margin-bottom: 40px;
            }

            .timeline-marker {
                position: absolute;
                left: 18px;
                top: 10px;
                width: 24px;
                height: 24px;
                background: white;
                border: 3px solid #667eea;
                border-radius: 50%;
            }

            .timeline-content {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }

            .timeline-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 8px 0;
            }

            .timeline-date {
                color: #667eea;
                font-weight: 500;
                margin: 0 0 10px 0;
            }

            .timeline-description {
                color: #64748b;
                margin: 0;
            }

            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .prizes-modal-content {
                    margin: 10px;
                    max-height: 95vh;
                }

                .prizes-modal-header {
                    padding: 20px;
                }

                .prizes-modal-title {
                    font-size: 24px;
                }

                .prizes-tabs {
                    flex-direction: column;
                }

                .prizes-tab {
                    padding: 15px;
                }

                .prizes-tab-content {
                    padding: 20px;
                }

                .prize-category {
                    padding: 20px;
                }

                .prize-item {
                    flex-direction: column;
                    text-align: center;
                    gap: 15px;
                }

                .judge-header {
                    flex-direction: column;
                    text-align: center;
                }

                .criteria-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .timeline-item {
                    padding-left: 60px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createInfoButtons() {
        // Buscar lugares apropiados para añadir botones
        const targets = [
            '.certamenes-section',
            '.prizes-section', 
            '.awards-section',
            '.main-content',
            '.hero-section',
            '.certamen-info'
        ];

        targets.forEach(selector => {
            const target = document.querySelector(selector);
            if (target) {
                this.addInfoButton(target);
            }
        });

        // Si no hay targets específicos, agregar al final del body
        if (!document.querySelector('.prizes-info-btn')) {
            const btn = this.createInfoButton();
            btn.style.position = 'fixed';
            btn.style.bottom = '20px';
            btn.style.right = '20px';
            btn.style.zIndex = '1000';
            document.body.appendChild(btn);
        }
    }

    addInfoButton(container) {
        const btn = this.createInfoButton();
        
        // Insertar en una posición apropiada
        const firstChild = container.firstElementChild;
        if (firstChild) {
            container.insertBefore(btn, firstChild);
        } else {
            container.appendChild(btn);
        }
    }

    createInfoButton() {
        const btn = document.createElement('button');
        btn.className = 'prizes-info-btn';
        btn.innerHTML = `
            <span>🏆</span>
            <span>Premios y Jurado</span>
        `;
        
        btn.addEventListener('click', () => this.showPrizesModal());
        return btn;
    }

    showPrizesModal() {
        if (this.currentModal) return;

        this.currentModal = document.createElement('div');
        this.currentModal.className = 'prizes-modal';
        
        this.currentModal.innerHTML = `
            <div class="prizes-modal-content">
                <div class="prizes-modal-header">
                    <button class="prizes-modal-close">&times;</button>
                    <h2 class="prizes-modal-title">🏆 Premios y Jurado VYT</h2>
                    <p class="prizes-modal-subtitle">Conoce todo sobre nuestros premios, jurado profesional y proceso de evaluación</p>
                </div>
                
                <div class="prizes-tabs">
                    <button class="prizes-tab active" data-tab="prizes">🎁 Premios</button>
                    <button class="prizes-tab" data-tab="judges">👥 Jurado</button>
                    <button class="prizes-tab" data-tab="criteria">📊 Criterios</button>
                    <button class="prizes-tab" data-tab="timeline">📅 Cronograma</button>
                </div>
                
                <div class="prizes-tab-content active" data-content="prizes">
                    ${this.createPrizesContent()}
                </div>
                
                <div class="prizes-tab-content" data-content="judges">
                    ${this.createJudgesContent()}
                </div>
                
                <div class="prizes-tab-content" data-content="criteria">
                    ${this.createCriteriaContent()}
                </div>
                
                <div class="prizes-tab-content" data-content="timeline">
                    ${this.createTimelineContent()}
                </div>
            </div>
        `;

        document.body.appendChild(this.currentModal);
        
        // Event listeners
        this.setupModalEventListeners();
        
        // Show modal
        setTimeout(() => this.currentModal.classList.add('show'), 10);
    }

    createPrizesContent() {
        return `
            <div class="prize-category">
                <h3 class="prize-category-title">🥇 Certamen Nacional Online</h3>
                <p class="prize-category-description">Nuestro certamen principal con participantes de todo el país</p>
                
                <div class="prize-list">
                    <div class="prize-item">
                        <div class="prize-position first">1°</div>
                        <div class="prize-details">
                            <h4 class="prize-title">Gran Ganador Nacional</h4>
                            <div class="prize-value">$50,000 + Trofeo</div>
                            <p class="prize-description">Contrato de grabación + Gira promocional + Videoclip profesional</p>
                        </div>
                    </div>
                    
                    <div class="prize-item">
                        <div class="prize-position second">2°</div>
                        <div class="prize-details">
                            <h4 class="prize-title">Subcampeón Nacional</h4>
                            <div class="prize-value">$25,000 + Trofeo</div>
                            <p class="prize-description">Grabación de single + Promoción en redes + Mentoría artística</p>
                        </div>
                    </div>
                    
                    <div class="prize-item">
                        <div class="prize-position third">3°</div>
                        <div class="prize-details">
                            <h4 class="prize-title">Tercer Lugar Nacional</h4>
                            <div class="prize-value">$15,000 + Trofeo</div>
                            <p class="prize-description">Sesión fotográfica profesional + EPK digital + Networking</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="prize-category">
                <h3 class="prize-category-title">🎯 Certámenes Provinciales</h3>
                <p class="prize-category-description">Competencias por provincia con premios específicos para cada región</p>
                
                <div class="prize-list">
                    <div class="prize-item">
                        <div class="prize-position first">1°</div>
                        <div class="prize-details">
                            <h4 class="prize-title">Ganador Provincial</h4>
                            <div class="prize-value">$10,000 + Trofeo</div>
                            <p class="prize-description">Pase directo a la final nacional + Promoción local</p>
                        </div>
                    </div>
                    
                    <div class="prize-item">
                        <div class="prize-position second">2°</div>
                        <div class="prize-details">
                            <h4 class="prize-title">Subcampeón Provincial</h4>
                            <div class="prize-value">$5,000 + Medalla</div>
                            <p class="prize-description">Oportunidad de repechaje + Material promocional</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="prize-category">
                <h3 class="prize-category-title">🌟 Premios Especiales</h3>
                <p class="prize-category-description">Reconocimientos adicionales otorgados por categorías específicas</p>
                
                <div class="prize-list">
                    <div class="prize-item">
                        <div class="prize-position">🎤</div>
                        <div class="prize-details">
                            <h4 class="prize-title">Mejor Voz</h4>
                            <div class="prize-value">$5,000 + Reconocimiento</div>
                            <p class="prize-description">Clases magistrales con coach vocal reconocido</p>
                        </div>
                    </div>
                    
                    <div class="prize-item">
                        <div class="prize-position">🎵</div>
                        <div class="prize-details">
                            <h4 class="prize-title">Mejor Interpretación</h4>
                            <div class="prize-value">$5,000 + Reconocimiento</div>
                            <p class="prize-description">Masterclass de interpretación + Material educativo</p>
                        </div>
                    </div>
                    
                    <div class="prize-item">
                        <div class="prize-position">👥</div>
                        <div class="prize-details">
                            <h4 class="prize-title">Premio del Público</h4>
                            <div class="prize-value">$3,000 + Reconocimiento</div>
                            <p class="prize-description">Basado en votos del público + Promoción especial</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createJudgesContent() {
        return `
            <div class="judge-profile">
                <div class="judge-header">
                    <div class="judge-avatar">🎭</div>
                    <div class="judge-info">
                        <h3>María González</h3>
                        <div class="judge-title">Directora Musical y Productora</div>
                        <div class="judge-specialties">
                            <span class="judge-specialty">Pop</span>
                            <span class="judge-specialty">Rock</span>
                            <span class="judge-specialty">Indie</span>
                        </div>
                    </div>
                </div>
                <p class="judge-bio">Con más de 15 años de experiencia en la industria musical, María ha trabajado con artistas nacionales e internacionales. Graduada del Berklee College of Music, es reconocida por su expertise en técnica vocal y producción musical.</p>
            </div>

            <div class="judge-profile">
                <div class="judge-header">
                    <div class="judge-avatar">🎸</div>
                    <div class="judge-info">
                        <h3>Carlos Mendoza</h3>
                        <div class="judge-title">Músico y Arreglista</div>
                        <div class="judge-specialties">
                            <span class="judge-specialty">Folklore</span>
                            <span class="judge-specialty">Tango</span>
                            <span class="judge-specialty">Jazz</span>
                        </div>
                    </div>
                </div>
                <p class="judge-bio">Reconocido guitarrista y arreglista con 3 premios Gardel. Carlos aporta su vasta experiencia en géneros tradicionales argentinos y su conocimiento profundo de la armonía musical.</p>
            </div>

            <div class="judge-profile">
                <div class="judge-header">
                    <div class="judge-avatar">🎹</div>
                    <div class="judge-info">
                        <h3>Ana Rodríguez</h3>
                        <div class="judge-title">Coach Vocal y Pedagoga Musical</div>
                        <div class="judge-specialties">
                            <span class="judge-specialty">Técnica Vocal</span>
                            <span class="judge-specialty">Performance</span>
                            <span class="judge-specialty">Educación</span>
                        </div>
                    </div>
                </div>
                <p class="judge-bio">Profesora de canto con certificación internacional y más de 20 años formando artistas. Ana es experta en técnica vocal, expresión escénica y desarrollo artístico integral.</p>
            </div>

            <div class="judge-profile">
                <div class="judge-header">
                    <div class="judge-avatar">🎺</div>
                    <div class="judge-info">
                        <h3>Luis Fernández</h3>
                        <div class="judge-title">Productor y Director de A&R</div>
                        <div class="judge-specialties">
                            <span class="judge-specialty">Producción</span>
                            <span class="judge-specialty">A&R</span>
                            <span class="judge-specialty">Industria</span>
                        </div>
                    </div>
                </div>
                <p class="judge-bio">Ex-director de A&R de sellos multinacionales, Luis tiene un ojo experto para identificar talento y potencial comercial. Ha sido responsable del lanzamiento de múltiples artistas exitosos.</p>
            </div>
        `;
    }

    createCriteriaContent() {
        return `
            <div class="criteria-grid">
                <div class="criteria-item">
                    <div class="criteria-icon">🎤</div>
                    <h4 class="criteria-title">Técnica Vocal</h4>
                    <div class="criteria-weight">30%</div>
                    <p class="criteria-description">Afinación, control de respiración, proyección, manejo de registros y limpieza vocal</p>
                </div>

                <div class="criteria-item">
                    <div class="criteria-icon">🎭</div>
                    <h4 class="criteria-title">Interpretación</h4>
                    <div class="criteria-weight">25%</div>
                    <p class="criteria-description">Expresión emocional, conexión con la canción, carisma y presencia escénica</p>
                </div>

                <div class="criteria-item">
                    <div class="criteria-icon">🎵</div>
                    <h4 class="criteria-title">Musicalidad</h4>
                    <div class="criteria-weight">20%</div>
                    <p class="criteria-description">Ritmo, fraseo, dinámicas y comprensión musical general</p>
                </div>

                <div class="criteria-item">
                    <div class="criteria-icon">⭐</div>
                    <h4 class="criteria-title">Originalidad</h4>
                    <div class="criteria-weight">15%</div>
                    <p class="criteria-description">Estilo personal, creatividad en la interpretación y propuesta artística única</p>
                </div>

                <div class="criteria-item">
                    <div class="criteria-icon">🎬</div>
                    <h4 class="criteria-title">Producción</h4>
                    <div class="criteria-weight">10%</div>
                    <p class="criteria-description">Calidad del audio/video, puesta en escena y presentación general</p>
                </div>
            </div>

            <div style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 16px;">
                <h3 style="text-align: center; color: #1e293b; margin-bottom: 20px;">📋 Proceso de Evaluación</h3>
                <ol style="color: #64748b; line-height: 1.8; padding-left: 20px;">
                    <li><strong>Evaluación Individual:</strong> Cada juez evalúa independientemente según los criterios establecidos</li>
                    <li><strong>Puntuación Promedio:</strong> Se calcula el promedio de las puntuaciones de todos los jueces</li>
                    <li><strong>Deliberación:</strong> Los jueces discuten casos especiales y empates</li>
                    <li><strong>Selección Final:</strong> Se determinan los ganadores y menciones especiales</li>
                    <li><strong>Feedback:</strong> Cada participante recibe comentarios constructivos del jurado</li>
                </ol>
            </div>
        `;
    }

    createTimelineContent() {
        return `
            <div class="timeline-container">
                <div class="timeline-line"></div>
                
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">📝 Período de Inscripciones</h4>
                        <div class="timeline-date">1-15 de cada mes</div>
                        <p class="timeline-description">Los artistas pueden inscribirse en los certámenes disponibles. Envío de materiales y documentación requerida.</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">🎵 Fase de Audiciones</h4>
                        <div class="timeline-date">16-25 de cada mes</div>
                        <p class="timeline-description">Evaluación inicial de todas las participaciones. Selección de finalistas por provincia.</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">🏆 Evaluación del Jurado</h4>
                        <div class="timeline-date">26-28 de cada mes</div>
                        <p class="timeline-description">Los jueces profesionales evalúan a los finalistas según los criterios establecidos.</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">📊 Votación del Público</h4>
                        <div class="timeline-date">26-30 de cada mes</div>
                        <p class="timeline-description">El público puede votar por sus artistas favoritos para el Premio del Público.</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">🎉 Anuncio de Resultados</h4>
                        <div class="timeline-date">Último día del mes</div>
                        <p class="timeline-description">Publicación oficial de ganadores, entrega de premios y feedback personalizado.</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">🌟 Actividades Post-Certamen</h4>
                        <div class="timeline-date">Primeros días del mes siguiente</div>
                        <p class="timeline-description">Inicio de beneficios para ganadores, preparación para el certamen nacional y actividades promocionales.</p>
                    </div>
                </div>
            </div>
        `;
    }

    setupModalEventListeners() {
        const modal = this.currentModal;
        
        // Close button
        const closeBtn = modal.querySelector('.prizes-modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Tab switching
        const tabs = modal.querySelectorAll('.prizes-tab');
        const contents = modal.querySelectorAll('.prizes-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                contents.forEach(c => c.classList.remove('active'));
                const targetContent = modal.querySelector(`[data-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
        
        // Escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    closeModal() {
        if (!this.currentModal) return;
        
        this.currentModal.classList.remove('show');
        setTimeout(() => {
            if (this.currentModal.parentNode) {
                this.currentModal.parentNode.removeChild(this.currentModal);
            }
            this.currentModal = null;
        }, 300);
    }

    setupEventListeners() {
        // Escuchar cambios de página
        window.addEventListener('popstate', () => {
            if (this.currentModal) {
                this.closeModal();
            }
        });
    }

    // API pública
    static init() {
        return new PrizesInfoSystem();
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.prizesInfoSystem = PrizesInfoSystem.init();
});

// Export
window.PrizesInfoSystem = PrizesInfoSystem;