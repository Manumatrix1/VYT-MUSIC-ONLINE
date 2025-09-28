/**
 * Sistema de Información Legal - VYT Music Online
 * Términos de uso, privacidad y condiciones accesibles
 */

class LegalInfoSystem {
    constructor() {
        this.currentModal = null;
        this.legalData = {};
        this.init();
    }

    init() {
        this.injectCSS();
        this.loadLegalContent();
        this.createLegalButtons();
        this.setupEventListeners();
        console.log('⚖️ Sistema de Información Legal iniciado');
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Legal Info System Styles */
            .legal-info-btn {
                background: linear-gradient(135deg, #64748b, #475569);
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 20px;
                font-weight: 500;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                text-decoration: none;
                opacity: 0.8;
            }

            .legal-info-btn:hover {
                opacity: 1;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(100, 116, 139, 0.3);
            }

            .legal-footer {
                background: #f8fafc;
                border-top: 1px solid #e5e7eb;
                padding: 30px 20px 20px;
                margin-top: 50px;
                text-align: center;
            }

            .legal-footer-content {
                max-width: 1200px;
                margin: 0 auto;
            }

            .legal-footer-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 15px 0;
            }

            .legal-footer-links {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 20px;
                margin-bottom: 20px;
            }

            .legal-footer-text {
                color: #64748b;
                font-size: 14px;
                line-height: 1.6;
                margin: 15px 0;
            }

            .legal-modal {
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

            .legal-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .legal-modal-content {
                background: white;
                border-radius: 20px;
                max-width: 800px;
                width: 100%;
                margin: 0 auto;
                position: relative;
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s ease;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
            }

            .legal-modal.show .legal-modal-content {
                transform: scale(1) translateY(0);
            }

            .legal-modal-header {
                background: linear-gradient(135deg, #64748b, #475569);
                color: white;
                padding: 30px;
                border-radius: 20px 20px 0 0;
                text-align: center;
                position: relative;
                flex-shrink: 0;
            }

            .legal-modal-close {
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

            .legal-modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }

            .legal-modal-title {
                font-size: 28px;
                margin: 0 0 10px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .legal-modal-subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin: 0;
            }

            .legal-tabs {
                display: flex;
                background: #f8fafc;
                border-bottom: 1px solid #e5e7eb;
                flex-shrink: 0;
            }

            .legal-tab {
                flex: 1;
                background: none;
                border: none;
                padding: 20px;
                font-size: 14px;
                font-weight: 600;
                color: #64748b;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-width: 120px;
            }

            .legal-tab:hover {
                color: #64748b;
                background: rgba(100, 116, 139, 0.05);
            }

            .legal-tab.active {
                color: #64748b;
                background: white;
            }

            .legal-tab.active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: #64748b;
            }

            .legal-content {
                flex: 1;
                overflow-y: auto;
                padding: 40px;
            }

            .legal-section {
                margin-bottom: 40px;
            }

            .legal-section-title {
                font-size: 22px;
                font-weight: bold;
                color: #1e293b;
                margin: 0 0 20px 0;
                display: flex;
                align-items: center;
                gap: 10px;
                padding-bottom: 10px;
                border-bottom: 2px solid #64748b;
            }

            .legal-subsection {
                margin-bottom: 30px;
                background: #f8fafc;
                border-radius: 12px;
                padding: 25px;
                border-left: 4px solid #64748b;
            }

            .legal-subsection-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 15px 0;
            }

            .legal-text {
                color: #475569;
                line-height: 1.8;
                margin: 0 0 15px 0;
                font-size: 15px;
            }

            .legal-list {
                margin: 15px 0;
                padding-left: 25px;
                color: #475569;
            }

            .legal-list li {
                margin-bottom: 10px;
                line-height: 1.6;
            }

            .legal-highlight {
                background: linear-gradient(120deg, rgba(100, 116, 139, 0.1), rgba(71, 85, 105, 0.1));
                padding: 3px 8px;
                border-radius: 4px;
                font-weight: 600;
                color: #64748b;
            }

            .legal-important {
                background: #fef2f2;
                border: 2px solid #fecaca;
                border-radius: 12px;
                padding: 20px;
                margin: 25px 0;
                position: relative;
            }

            .legal-important::before {
                content: '⚠️';
                position: absolute;
                top: -10px;
                left: 20px;
                background: white;
                padding: 0 8px;
                font-size: 20px;
            }

            .legal-important-title {
                font-weight: 600;
                color: #dc2626;
                margin: 0 0 10px 0;
            }

            .legal-important-text {
                color: #7f1d1d;
                margin: 0;
            }

            .legal-contact-box {
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border: 2px solid #e5e7eb;
                border-radius: 16px;
                padding: 25px;
                text-align: center;
                margin-top: 30px;
            }

            .legal-contact-box h3 {
                color: #1e293b;
                margin: 0 0 15px 0;
                font-size: 20px;
            }

            .legal-contact-box p {
                color: #64748b;
                margin: 0 0 20px 0;
            }

            .legal-contact-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 20px;
                text-align: left;
            }

            .legal-contact-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }

            .legal-contact-item strong {
                color: #1e293b;
                display: block;
                margin-bottom: 5px;
            }

            .legal-date-info {
                background: #f0f9ff;
                border: 2px solid #bae6fd;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }

            .legal-date-info strong {
                color: #0369a1;
                display: block;
                font-size: 16px;
                margin-bottom: 5px;
            }

            .legal-date-info span {
                color: #0c4a6e;
                font-size: 14px;
            }

            .legal-version-info {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.9);
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                color: #64748b;
                border: 1px solid #e5e7eb;
                backdrop-filter: blur(10px);
            }

            /* Quick Access Buttons */
            .legal-quick-access {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                border-radius: 25px;
                padding: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                border: 1px solid #e5e7eb;
                display: flex;
                gap: 5px;
                z-index: 999;
            }

            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .legal-modal {
                    padding: 10px;
                }

                .legal-modal-content {
                    margin: 0;
                    border-radius: 15px;
                    max-height: 95vh;
                }

                .legal-modal-header {
                    padding: 20px;
                }

                .legal-modal-title {
                    font-size: 24px;
                }

                .legal-tabs {
                    flex-wrap: wrap;
                }

                .legal-tab {
                    padding: 15px 10px;
                    font-size: 13px;
                    min-width: 100px;
                }

                .legal-content {
                    padding: 25px 20px;
                }

                .legal-section-title {
                    font-size: 20px;
                }

                .legal-subsection {
                    padding: 20px 15px;
                }

                .legal-contact-info {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .legal-footer-links {
                    flex-direction: column;
                    gap: 15px;
                }

                .legal-quick-access {
                    position: relative;
                    bottom: auto;
                    left: auto;
                    transform: none;
                    justify-content: center;
                    margin: 20px auto;
                    flex-wrap: wrap;
                }

                .legal-version-info {
                    position: relative;
                    bottom: auto;
                    left: auto;
                    margin: 20px auto;
                    text-align: center;
                }
            }

            /* Scrollbar Styling */
            .legal-content::-webkit-scrollbar {
                width: 8px;
            }

            .legal-content::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
            }

            .legal-content::-webkit-scrollbar-thumb {
                background: #64748b;
                border-radius: 4px;
            }

            .legal-content::-webkit-scrollbar-thumb:hover {
                background: #475569;
            }
        `;
        document.head.appendChild(style);
    }

    loadLegalContent() {
        this.legalData = {
            terms: {
                title: '📋 Términos y Condiciones',
                lastUpdated: '15 de Enero de 2025',
                sections: [
                    {
                        title: '1. Aceptación de los Términos',
                        content: `
                            <p>Al utilizar VYT Music Online, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestro servicio.</p>
                            <div class="legal-important">
                                <div class="legal-important-title">Importante:</div>
                                <div class="legal-important-text">Estos términos constituyen un acuerdo legal entre tú y VYT Music Online. Al participar en nuestros certámenes, confirmas que has leído, entendido y aceptado estos términos.</div>
                            </div>
                        `
                    },
                    {
                        title: '2. Descripción del Servicio',
                        content: `
                            <p>VYT Music Online es una plataforma que organiza certámenes musicales virtuales y presenciales en Argentina. Nuestros servicios incluyen:</p>
                            <ul class="legal-list">
                                <li><span class="legal-highlight">Organización de certámenes</span> por provincia y a nivel nacional</li>
                                <li><span class="legal-highlight">Evaluación profesional</span> por jurado especializado</li>
                                <li><span class="legal-highlight">Entrega de premios</span> en efectivo y oportunidades profesionales</li>
                                <li><span class="legal-highlight">Plataforma online</span> para inscripciones y participación</li>
                                <li><span class="legal-highlight">Networking</span> entre artistas y profesionales de la industria</li>
                            </ul>
                        `
                    },
                    {
                        title: '3. Elegibilidad y Registro',
                        content: `
                            <p>Para participar en nuestros certámenes debes cumplir los siguientes requisitos:</p>
                            <ul class="legal-list">
                                <li>Ser mayor de 6 años (menores requieren autorización parental)</li>
                                <li>Residir en Argentina o tener documentación argentina válida</li>
                                <li>Proporcionar información veraz y actualizada</li>
                                <li>Aceptar las condiciones específicas de cada certamen</li>
                                <li>Cumplir con los plazos de inscripción establecidos</li>
                            </ul>
                            <div class="legal-important">
                                <div class="legal-important-title">Menores de Edad:</div>
                                <div class="legal-important-text">Los participantes menores de 18 años deben contar con autorización escrita de padre, madre o tutor legal.</div>
                            </div>
                        `
                    },
                    {
                        title: '4. Proceso de Inscripción y Pagos',
                        content: `
                            <p>El proceso de inscripción incluye:</p>
                            <ul class="legal-list">
                                <li><strong>Registro de cuenta:</strong> Creación de perfil con datos personales</li>
                                <li><strong>Selección de certamen:</strong> Elección del certamen deseado</li>
                                <li><strong>Subida de material:</strong> Audio/video según requerimientos</li>
                                <li><strong>Pago de inscripción:</strong> Según tarifas publicadas</li>
                                <li><strong>Confirmación:</strong> Recibo de confirmación vía email</li>
                            </ul>
                            <p><span class="legal-highlight">Los pagos son procesados de forma segura</span> a través de MercadoPago y otros medios autorizados. Una vez procesado el pago, las inscripciones no son reembolsables salvo cancelación del certamen por nuestra parte.</p>
                        `
                    },
                    {
                        title: '5. Derechos de Propiedad Intelectual',
                        content: `
                            <div class="legal-important">
                                <div class="legal-important-title">Muy Importante:</div>
                                <div class="legal-important-text">Al participar, garantizas que tienes todos los derechos sobre el material musical enviado y nos otorgas licencia para utilizarlo con fines promocionales del certamen.</div>
                            </div>
                            <p>Respecto a los derechos de propiedad intelectual:</p>
                            <ul class="legal-list">
                                <li><strong>Tu material:</strong> Mantienes todos los derechos sobre tu música</li>
                                <li><strong>Nuestra licencia:</strong> Nos otorgas derecho a usar tu material para promoción del certamen</li>
                                <li><strong>Restricciones:</strong> No podemos comercializar tu música sin tu autorización expresa</li>
                                <li><strong>Duración:</strong> La licencia es válida durante y 12 meses después del certamen</li>
                            </ul>
                        `
                    },
                    {
                        title: '6. Reglas de Conducta',
                        content: `
                            <p>Todos los participantes deben mantener una conducta apropiada:</p>
                            <ul class="legal-list">
                                <li>Respetar a otros participantes, jurados y organizadores</li>
                                <li>No enviar contenido ofensivo, discriminatorio o inapropiado</li>
                                <li>No intentar manipular el proceso de votación o evaluación</li>
                                <li>Proporcionar información veraz en todo momento</li>
                                <li>Cumplir con las fechas y plazos establecidos</li>
                            </ul>
                            <p><span class="legal-highlight">El incumplimiento de estas reglas puede resultar en descalificación</span> y prohibición de participar en futuros certámenes.</p>
                        `
                    }
                ]
            },
            privacy: {
                title: '🔒 Política de Privacidad',
                lastUpdated: '15 de Enero de 2025',
                sections: [
                    {
                        title: '1. Información que Recopilamos',
                        content: `
                            <p>Recopilamos la siguiente información de nuestros usuarios:</p>
                            <div class="legal-subsection">
                                <div class="legal-subsection-title">📝 Información Personal</div>
                                <ul class="legal-list">
                                    <li>Nombre completo y fecha de nacimiento</li>
                                    <li>Documento de identidad (DNI)</li>
                                    <li>Dirección de email y teléfono</li>
                                    <li>Provincia de residencia</li>
                                    <li>Información de pago (procesada por terceros)</li>
                                </ul>
                            </div>
                            <div class="legal-subsection">
                                <div class="legal-subsection-title">🎵 Información Artística</div>
                                <ul class="legal-list">
                                    <li>Material musical (audio/video)</li>
                                    <li>Fotografías de perfil</li>
                                    <li>Información sobre experiencia musical</li>
                                    <li>Género musical preferido</li>
                                </ul>
                            </div>
                        `
                    },
                    {
                        title: '2. Cómo Usamos tu Información',
                        content: `
                            <p>Utilizamos tu información personal para:</p>
                            <ul class="legal-list">
                                <li><strong>Administrar certámenes:</strong> Procesar inscripciones y gestionar participaciones</li>
                                <li><strong>Comunicación:</strong> Enviarte actualizaciones sobre certámenes y resultados</li>
                                <li><strong>Evaluación:</strong> Permitir que el jurado evalúe tu participación</li>
                                <li><strong>Pagos:</strong> Procesar pagos de inscripción y entrega de premios</li>
                                <li><strong>Mejoras:</strong> Analizar el uso de la plataforma para mejorar nuestros servicios</li>
                                <li><strong>Marketing:</strong> Enviarte información sobre nuevos certámenes (puedes darte de baja)</li>
                            </ul>
                            <div class="legal-important">
                                <div class="legal-important-title">Nunca vendemos tu información</div>
                                <div class="legal-important-text">No vendemos, alquilamos o compartimos tu información personal con terceros para fines comerciales.</div>
                            </div>
                        `
                    },
                    {
                        title: '3. Protección de Datos',
                        content: `
                            <p>Implementamos medidas de seguridad para proteger tu información:</p>
                            <div class="legal-subsection">
                                <div class="legal-subsection-title">🔐 Medidas Técnicas</div>
                                <ul class="legal-list">
                                    <li>Encriptación SSL/TLS para todas las conexiones</li>
                                    <li>Servidores seguros con acceso restringido</li>
                                    <li>Copias de seguridad regulares y cifradas</li>
                                    <li>Monitoreo continuo de seguridad</li>
                                </ul>
                            </div>
                            <div class="legal-subsection">
                                <div class="legal-subsection-title">👥 Medidas Administrativas</div>
                                <ul class="legal-list">
                                    <li>Acceso limitado solo a personal autorizado</li>
                                    <li>Capacitación regular en protección de datos</li>
                                    <li>Auditorías de seguridad periódicas</li>
                                    <li>Políticas estrictas de manejo de datos</li>
                                </ul>
                            </div>
                        `
                    },
                    {
                        title: '4. Tus Derechos',
                        content: `
                            <p>Como usuario, tienes los siguientes derechos sobre tus datos:</p>
                            <ul class="legal-list">
                                <li><span class="legal-highlight">Acceso:</span> Solicitar una copia de toda tu información personal</li>
                                <li><span class="legal-highlight">Rectificación:</span> Corregir información incorrecta o incompleta</li>
                                <li><span class="legal-highlight">Eliminación:</span> Solicitar la eliminación de tus datos personales</li>
                                <li><span class="legal-highlight">Portabilidad:</span> Recibir tus datos en formato estructurado</li>
                                <li><span class="legal-highlight">Oposición:</span> Oponerte al procesamiento de tus datos para marketing</li>
                                <li><span class="legal-highlight">Limitación:</span> Limitar el procesamiento en ciertas circunstancias</li>
                            </ul>
                            <p>Para ejercer estos derechos, contacta nuestro equipo de privacidad en <strong>privacidad@vytmusic.com</strong></p>
                        `
                    }
                ]
            },
            contest: {
                title: '🏆 Condiciones del Certamen',
                lastUpdated: '15 de Enero de 2025',
                sections: [
                    {
                        title: '1. Estructura de Certámenes',
                        content: `
                            <p>VYT Music Online organiza diferentes tipos de certámenes:</p>
                            <div class="legal-subsection">
                                <div class="legal-subsection-title">🎯 Certámenes Provinciales</div>
                                <ul class="legal-list">
                                    <li>Uno por mes en cada provincia argentina</li>
                                    <li>Participación limitada a residentes de la provincia</li>
                                    <li>Modalidades: online, presencial o híbrido</li>
                                    <li>El ganador clasifica automáticamente al nacional</li>
                                </ul>
                            </div>
                            <div class="legal-subsection">
                                <div class="legal-subsection-title">🏆 Certamen Nacional</div>
                                <ul class="legal-list">
                                    <li>Finalistas de certámenes provinciales</li>
                                    <li>Se realiza trimestralmente</li>
                                    <li>Incluye todas las categorías de edad</li>
                                    <li>Premios más importantes del año</li>
                                </ul>
                            </div>
                        `
                    },
                    {
                        title: '2. Proceso de Evaluación',
                        content: `
                            <p>La evaluación se realiza de manera profesional y transparente:</p>
                            <div class="legal-subsection">
                                <div class="legal-subsection-title">👨‍⚖️ Jurado Profesional</div>
                                <ul class="legal-list">
                                    <li>Mínimo 4 jueces por certamen</li>
                                    <li>Profesionales reconocidos de la industria musical</li>
                                    <li>Evaluación independiente de cada juez</li>
                                    <li>Promedio ponderado para puntuación final</li>
                                </ul>
                            </div>
                            <div class="legal-subsection">
                                <div class="legal-subsection-title">📊 Criterios de Evaluación</div>
                                <ul class="legal-list">
                                    <li><strong>Técnica vocal (30%):</strong> Afinación, respiración, proyección</li>
                                    <li><strong>Interpretación (25%):</strong> Expresión emocional, carisma</li>
                                    <li><strong>Musicalidad (20%):</strong> Ritmo, fraseo, dinámicas</li>
                                    <li><strong>Originalidad (15%):</strong> Estilo personal, creatividad</li>
                                    <li><strong>Producción (10%):</strong> Calidad técnica del material</li>
                                </ul>
                            </div>
                        `
                    },
                    {
                        title: '3. Premios y Reconocimientos',
                        content: `
                            <div class="legal-important">
                                <div class="legal-important-title">Garantía de Premios</div>
                                <div class="legal-important-text">Todos los premios anunciados son reales y serán entregados según las condiciones establecidas.</div>
                            </div>
                            <p>Los premios incluyen:</p>
                            <ul class="legal-list">
                                <li><span class="legal-highlight">Premios en efectivo:</span> Desde $10,000 hasta $50,000</li>
                                <li><span class="legal-highlight">Oportunidades profesionales:</span> Contratos de grabación, giras promocionales</li>
                                <li><span class="legal-highlight">Servicios incluidos:</span> Videoclips, sesiones fotográficas, EPK digital</li>
                                <li><span class="legal-highlight">Reconocimientos:</strong> Trofeos, certificados, promoción en medios</li>
                                <li><span class="legal-highlight">Networking:</strong> Acceso a eventos exclusivos y contactos de la industria</li>
                            </ul>
                        `
                    },
                    {
                        title: '4. Obligaciones de los Participantes',
                        content: `
                            <p>Al participar en nuestros certámenes, te comprometes a:</p>
                            <ul class="legal-list">
                                <li><strong>Originalidad:</strong> El material presentado debe ser de tu autoría o tener los derechos correspondientes</li>
                                <li><strong>Calidad técnica:</strong> Cumplir con los requisitos mínimos de audio/video</li>
                                <li><strong>Disponibilidad:</strong> Estar disponible para actividades relacionadas si resultas ganador</li>
                                <li><strong>Promoción:</strong> Permitir el uso de tu imagen y material para promoción del certamen</li>
                                <li><strong>Veracidad:</strong> Toda la información proporcionada debe ser verdadera</li>
                            </ul>
                        `
                    }
                ]
            }
        };
    }

    createLegalButtons() {
        // Crear footer legal
        this.createLegalFooter();
        
        // Crear acceso rápido
        this.createQuickAccess();
        
        // Crear indicador de versión
        this.createVersionInfo();
    }

    createLegalFooter() {
        const footer = document.createElement('div');
        footer.className = 'legal-footer';
        footer.innerHTML = `
            <div class="legal-footer-content">
                <h3 class="legal-footer-title">Información Legal</h3>
                <div class="legal-footer-links">
                    <button class="legal-info-btn" data-legal="terms">
                        ⚖️ Términos y Condiciones
                    </button>
                    <button class="legal-info-btn" data-legal="privacy">
                        🔒 Política de Privacidad
                    </button>
                    <button class="legal-info-btn" data-legal="contest">
                        🏆 Condiciones del Certamen
                    </button>
                </div>
                <div class="legal-footer-text">
                    <strong>VYT Music Online</strong> - Plataforma de Certámenes Musicales<br>
                    CUIT: 20-12345678-9 | Buenos Aires, Argentina<br>
                    <em>Al usar nuestros servicios, aceptas nuestros términos y condiciones</em>
                </div>
            </div>
        `;
        
        document.body.appendChild(footer);
        this.setupButtonListeners(footer);
    }

    createQuickAccess() {
        const quickAccess = document.createElement('div');
        quickAccess.className = 'legal-quick-access';
        quickAccess.innerHTML = `
            <button class="legal-info-btn" data-legal="terms" title="Términos y Condiciones">
                ⚖️
            </button>
            <button class="legal-info-btn" data-legal="privacy" title="Política de Privacidad">
                🔒
            </button>
            <button class="legal-info-btn" data-legal="contest" title="Condiciones del Certamen">
                🏆
            </button>
        `;
        
        document.body.appendChild(quickAccess);
        this.setupButtonListeners(quickAccess);
    }

    createVersionInfo() {
        const versionInfo = document.createElement('div');
        versionInfo.className = 'legal-version-info';
        versionInfo.innerHTML = `v2.1.0 | Actualizado: ${new Date().toLocaleDateString('es-AR')}`;
        
        document.body.appendChild(versionInfo);
    }

    setupButtonListeners(container) {
        const buttons = container.querySelectorAll('[data-legal]');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const legalType = btn.getAttribute('data-legal');
                this.showLegalModal(legalType);
            });
        });
    }

    showLegalModal(legalType) {
        if (this.currentModal) return;

        const legalData = this.legalData[legalType];
        if (!legalData) return;

        this.currentModal = document.createElement('div');
        this.currentModal.className = 'legal-modal';
        
        this.currentModal.innerHTML = `
            <div class="legal-modal-content">
                <div class="legal-modal-header">
                    <button class="legal-modal-close">&times;</button>
                    <h2 class="legal-modal-title">${legalData.title}</h2>
                    <p class="legal-modal-subtitle">Información legal actualizada y accesible</p>
                    <div class="legal-date-info">
                        <strong>Última actualización</strong>
                        <span>${legalData.lastUpdated}</span>
                    </div>
                </div>
                
                <div class="legal-tabs">
                    <button class="legal-tab active" data-tab="terms">📋 Términos</button>
                    <button class="legal-tab" data-tab="privacy">🔒 Privacidad</button>
                    <button class="legal-tab" data-tab="contest">🏆 Certámenes</button>
                </div>
                
                <div class="legal-content">
                    ${this.renderLegalContent(legalType)}
                    ${this.createContactBox()}
                </div>
            </div>
        `;

        document.body.appendChild(this.currentModal);
        
        // Event listeners
        this.setupModalEventListeners();
        
        // Show modal
        setTimeout(() => this.currentModal.classList.add('show'), 10);
    }

    renderLegalContent(legalType) {
        const data = this.legalData[legalType];
        if (!data) return '';

        return data.sections.map(section => `
            <div class="legal-section">
                <h3 class="legal-section-title">${section.title}</h3>
                ${section.content}
            </div>
        `).join('');
    }

    createContactBox() {
        return `
            <div class="legal-contact-box">
                <h3>¿Tienes dudas legales?</h3>
                <p>Nuestro equipo legal está disponible para resolver cualquier consulta</p>
                <div class="legal-contact-info">
                    <div class="legal-contact-item">
                        <strong>📧 Email Legal</strong>
                        legal@vytmusic.com
                    </div>
                    <div class="legal-contact-item">
                        <strong>🔒 Privacidad</strong>
                        privacidad@vytmusic.com
                    </div>
                    <div class="legal-contact-item">
                        <strong>📞 Teléfono</strong>
                        +54 11 1234-5678
                    </div>
                    <div class="legal-contact-item">
                        <strong>⏰ Horarios</strong>
                        Lun-Vie 9:00-18:00
                    </div>
                </div>
            </div>
        `;
    }

    setupModalEventListeners() {
        const modal = this.currentModal;
        
        // Close button
        const closeBtn = modal.querySelector('.legal-modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Tab switching
        const tabs = modal.querySelectorAll('.legal-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update content
                const content = modal.querySelector('.legal-content');
                content.innerHTML = this.renderLegalContent(targetTab) + this.createContactBox();
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
        return new LegalInfoSystem();
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.legalInfoSystem = LegalInfoSystem.init();
});

// Export
window.LegalInfoSystem = LegalInfoSystem;