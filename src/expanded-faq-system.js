/**
 * Sistema de FAQ Expandido - VYT Music Online
 * Sistema completo de preguntas frecuentes con búsqueda y categorías
 */

class ExpandedFAQSystem {
    constructor() {
        this.currentModal = null;
        this.searchTimeout = null;
        this.allFAQs = [];
        this.filteredFAQs = [];
        this.init();
    }

    init() {
        this.injectCSS();
        this.loadFAQData();
        this.createFAQButtons();
        this.setupEventListeners();
        console.log('❓ Sistema de FAQ Expandido iniciado');
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Expanded FAQ System Styles */
            .faq-info-btn {
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
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
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                position: relative;
                overflow: hidden;
            }

            .faq-info-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
            }

            .faq-info-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                transition: left 0.5s ease;
            }

            .faq-info-btn:hover::before {
                left: 100%;
            }

            .faq-modal {
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

            .faq-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .faq-modal-content {
                background: white;
                border-radius: 20px;
                max-width: 1000px;
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

            .faq-modal.show .faq-modal-content {
                transform: scale(1) translateY(0);
            }

            .faq-modal-header {
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                color: white;
                padding: 30px;
                border-radius: 20px 20px 0 0;
                text-align: center;
                position: relative;
                flex-shrink: 0;
            }

            .faq-modal-close {
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

            .faq-modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }

            .faq-modal-title {
                font-size: 32px;
                margin: 0 0 10px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .faq-modal-subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin: 0;
            }

            .faq-search-container {
                padding: 20px 30px 10px;
                background: #f8fafc;
                border-bottom: 1px solid #e5e7eb;
                flex-shrink: 0;
            }

            .faq-search-box {
                position: relative;
                width: 100%;
                max-width: 500px;
                margin: 0 auto;
            }

            .faq-search-input {
                width: 100%;
                padding: 15px 20px 15px 50px;
                border: 2px solid #e5e7eb;
                border-radius: 25px;
                font-size: 16px;
                background: white;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .faq-search-input:focus {
                border-color: #8b5cf6;
                box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                outline: none;
            }

            .faq-search-icon {
                position: absolute;
                left: 18px;
                top: 50%;
                transform: translateY(-50%);
                color: #64748b;
                font-size: 18px;
            }

            .faq-categories {
                display: flex;
                gap: 10px;
                padding: 15px 30px 20px;
                background: #f8fafc;
                border-bottom: 1px solid #e5e7eb;
                overflow-x: auto;
                flex-shrink: 0;
            }

            .faq-category-filter {
                background: white;
                border: 2px solid #e5e7eb;
                color: #64748b;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                flex-shrink: 0;
            }

            .faq-category-filter:hover {
                border-color: #8b5cf6;
                color: #8b5cf6;
            }

            .faq-category-filter.active {
                background: #8b5cf6;
                border-color: #8b5cf6;
                color: white;
            }

            .faq-content {
                flex: 1;
                overflow-y: auto;
                padding: 30px;
            }

            .faq-stats {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border-radius: 12px;
                color: #64748b;
            }

            .faq-stats-number {
                font-size: 32px;
                font-weight: bold;
                color: #8b5cf6;
                display: block;
            }

            .faq-section {
                margin-bottom: 40px;
            }

            .faq-section-title {
                font-size: 24px;
                font-weight: bold;
                color: #1e293b;
                margin: 0 0 20px 0;
                display: flex;
                align-items: center;
                gap: 12px;
                padding-bottom: 10px;
                border-bottom: 3px solid #8b5cf6;
            }

            .faq-item {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                margin-bottom: 15px;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .faq-item:hover {
                border-color: #8b5cf6;
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
            }

            .faq-question {
                padding: 20px;
                cursor: pointer;
                background: #fafafa;
                border-bottom: 1px solid #e5e7eb;
                font-weight: 600;
                color: #1e293b;
                display: flex;
                align-items: center;
                justify-content: between;
                gap: 15px;
                transition: all 0.3s ease;
            }

            .faq-question:hover {
                background: #f1f5f9;
                color: #8b5cf6;
            }

            .faq-question.active {
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                color: white;
                border-bottom-color: transparent;
            }

            .faq-question-text {
                flex: 1;
                font-size: 16px;
            }

            .faq-question-icon {
                font-size: 20px;
                transition: transform 0.3s ease;
                flex-shrink: 0;
            }

            .faq-question.active .faq-question-icon {
                transform: rotate(180deg);
            }

            .faq-answer {
                padding: 0 20px;
                max-height: 0;
                overflow: hidden;
                transition: all 0.3s ease;
                background: white;
            }

            .faq-answer.active {
                padding: 20px;
                max-height: 500px;
            }

            .faq-answer-content {
                color: #64748b;
                line-height: 1.7;
                font-size: 15px;
            }

            .faq-answer-content p {
                margin: 0 0 15px 0;
            }

            .faq-answer-content ul, .faq-answer-content ol {
                margin: 15px 0;
                padding-left: 25px;
            }

            .faq-answer-content li {
                margin-bottom: 8px;
            }

            .faq-highlight {
                background: linear-gradient(120deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.1));
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                color: #8b5cf6;
            }

            .faq-contact-box {
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border: 2px solid #e5e7eb;
                border-radius: 16px;
                padding: 25px;
                text-align: center;
                margin-top: 30px;
            }

            .faq-contact-box h3 {
                color: #1e293b;
                margin: 0 0 15px 0;
                font-size: 20px;
            }

            .faq-contact-box p {
                color: #64748b;
                margin: 0 0 20px 0;
            }

            .faq-contact-btn {
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
            }

            .faq-contact-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
            }

            .faq-no-results {
                text-align: center;
                padding: 60px 20px;
                color: #64748b;
            }

            .faq-no-results-icon {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.5;
            }

            .faq-no-results h3 {
                color: #1e293b;
                margin: 0 0 10px 0;
            }

            .faq-no-results p {
                margin: 0;
            }

            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .faq-modal {
                    padding: 10px;
                }

                .faq-modal-content {
                    margin: 0;
                    border-radius: 15px;
                    max-height: 95vh;
                }

                .faq-modal-header {
                    padding: 20px;
                }

                .faq-modal-title {
                    font-size: 24px;
                }

                .faq-search-container,
                .faq-categories {
                    padding: 15px 20px;
                }

                .faq-content {
                    padding: 20px;
                }

                .faq-section-title {
                    font-size: 20px;
                }

                .faq-question {
                    padding: 15px;
                }

                .faq-answer.active {
                    padding: 15px;
                }

                .faq-categories {
                    flex-wrap: nowrap;
                    overflow-x: scroll;
                    -webkit-overflow-scrolling: touch;
                }
            }

            /* Scrollbar Styling */
            .faq-content::-webkit-scrollbar {
                width: 8px;
            }

            .faq-content::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
            }

            .faq-content::-webkit-scrollbar-thumb {
                background: #8b5cf6;
                border-radius: 4px;
            }

            .faq-content::-webkit-scrollbar-thumb:hover {
                background: #7c3aed;
            }
        `;
        document.head.appendChild(style);
    }

    loadFAQData() {
        this.allFAQs = [
            // INSCRIPCIÓN
            {
                category: 'inscripcion',
                categoryName: '📝 Inscripción',
                question: '¿Cómo me inscribo a un certamen?',
                answer: `
                    <p>El proceso de inscripción es muy sencillo:</p>
                    <ol>
                        <li>Crea tu cuenta en VYT Music o inicia sesión</li>
                        <li>Ve a la sección <span class="faq-highlight">Certámenes</span></li>
                        <li>Selecciona el certamen que te interese</li>
                        <li>Completa el formulario de inscripción</li>
                        <li>Sube tu material musical (audio/video)</li>
                        <li>Realiza el pago de inscripción</li>
                    </ol>
                    <p>¡Listo! Recibirás un email de confirmación con todos los detalles.</p>
                `
            },
            {
                category: 'inscripcion',
                categoryName: '📝 Inscripción',
                question: '¿Qué documentos necesito para inscribirme?',
                answer: `
                    <p>Necesitarás los siguientes documentos:</p>
                    <ul>
                        <li><strong>DNI o documento de identidad</strong> (foto o escaneo)</li>
                        <li><strong>Foto de perfil</strong> (formato JPG o PNG)</li>
                        <li><strong>Material musical:</strong>
                            <ul>
                                <li>Audio en MP3 o WAV (máximo 5MB)</li>
                                <li>Video en MP4 o MOV (máximo 50MB) - opcional</li>
                            </ul>
                        </li>
                        <li><strong>Datos personales:</strong> nombre completo, fecha de nacimiento, provincia</li>
                    </ul>
                    <p>Si eres menor de 18 años, necesitas autorización de un padre o tutor.</p>
                `
            },
            {
                category: 'inscripcion',
                categoryName: '📝 Inscripción',
                question: '¿Puedo inscribirme en múltiples certámenes?',
                answer: `
                    <p>¡Sí! Puedes inscribirte en tantos certámenes como quieras:</p>
                    <ul>
                        <li><span class="faq-highlight">Certamen Provincial:</span> Solo uno por mes en tu provincia</li>
                        <li><span class="faq-highlight">Certamen Nacional:</span> Clasificación automática si ganas el provincial</li>
                        <li><span class="faq-highlight">Certámenes Especiales:</span> Sin límite de participaciones</li>
                    </ul>
                    <p>Cada inscripción tiene su costo individual y debes cumplir los requisitos específicos de cada certamen.</p>
                `
            },
            {
                category: 'inscripcion',
                categoryName: '📝 Inscripción',
                question: '¿Hasta qué edad puedo participar?',
                answer: `
                    <p>Los certámenes están abiertos para diferentes categorías de edad:</p>
                    <ul>
                        <li><strong>Infantil:</strong> 6 a 12 años</li>
                        <li><strong>Juvenil:</strong> 13 a 17 años</li>
                        <li><strong>Adulto:</strong> 18 a 35 años</li>
                        <li><strong>Abierto:</strong> Sin límite de edad (36+ años)</li>
                    </ul>
                    <p>Los menores de 18 años necesitan autorización de padres o tutores para participar.</p>
                `
            },

            // PAGOS
            {
                category: 'pagos',
                categoryName: '💳 Pagos',
                question: '¿Cuánto cuesta inscribirse?',
                answer: `
                    <p>Los costos varían según el tipo de certamen:</p>
                    <ul>
                        <li><span class="faq-highlight">Certamen Provincial:</span> $2,500 ARS</li>
                        <li><span class="faq-highlight">Certamen Nacional:</span> $5,000 ARS (clasificación automática si ganas provincial)</li>
                        <li><span class="faq-highlight">Certámenes Especiales:</span> $1,500 ARS</li>
                    </ul>
                    <p>Incluye evaluación del jurado, certificado de participación y feedback personalizado.</p>
                    <p><strong>¡Descuentos disponibles!</strong> 20% off para estudiantes con credencial válida.</p>
                `
            },
            {
                category: 'pagos',
                categoryName: '💳 Pagos',
                question: '¿Qué métodos de pago aceptan?',
                answer: `
                    <p>Aceptamos múltiples formas de pago para tu comodidad:</p>
                    <ul>
                        <li><strong>MercadoPago:</strong> Tarjetas de crédito/débito, transferencias</li>
                        <li><strong>Transferencia bancaria:</strong> CBU disponible en el checkout</li>
                        <li><strong>Efectivo:</strong> A través de RapiPago o PagoFácil</li>
                        <li><strong>Criptomonedas:</strong> Bitcoin, USDT (próximamente)</li>
                    </ul>
                    <p>El pago se procesa de forma segura y recibes confirmación inmediata.</p>
                `
            },
            {
                category: 'pagos',
                categoryName: '💳 Pagos',
                question: '¿Puedo pagar en cuotas?',
                answer: `
                    <p>¡Sí! Ofrecemos planes de financiación:</p>
                    <ul>
                        <li><strong>Tarjetas de crédito:</strong> Hasta 12 cuotas sin interés</li>
                        <li><strong>MercadoPago:</strong> Hasta 6 cuotas con interés reducido</li>
                        <li><strong>Plan VYT:</strong> 3 pagos mensuales automáticos</li>
                    </ul>
                    <p>Las cuotas se calculan automáticamente al momento del checkout según tu medio de pago.</p>
                `
            },
            {
                category: 'pagos',
                categoryName: '💳 Pagos',
                question: '¿Qué pasa si mi pago falla?',
                answer: `
                    <p>Si tu pago no se procesa correctamente:</p>
                    <ol>
                        <li><strong>Reintentar:</strong> Verifica los datos de tu tarjeta y vuelve a intentar</li>
                        <li><strong>Método alternativo:</strong> Prueba con otra tarjeta o transferencia</li>
                        <li><strong>Soporte:</strong> Contactanos por WhatsApp para asistencia inmediata</li>
                        <li><strong>Reserva temporal:</strong> Tu inscripción queda reservada por 48 horas</li>
                    </ol>
                    <p>No te preocupes, siempre hay una solución para que puedas participar.</p>
                `
            },

            // EVALUACIÓN
            {
                category: 'evaluacion',
                categoryName: '⭐ Evaluación',
                question: '¿Cómo funciona el proceso de evaluación?',
                answer: `
                    <p>Nuestro proceso de evaluación es profesional y transparente:</p>
                    <ol>
                        <li><strong>Recepción:</strong> Tu material se revisa técnicamente</li>
                        <li><strong>Evaluación individual:</strong> Cada juez evalúa según criterios específicos</li>
                        <li><strong>Puntuación promedio:</strong> Se calcula la media de todas las evaluaciones</li>
                        <li><strong>Deliberación:</strong> Los jueces discuten casos especiales</li>
                        <li><strong>Resultados finales:</strong> Se determinan ganadores y menciones</li>
                    </ol>
                    <p>Todo el proceso toma entre 7-10 días hábiles desde el cierre de inscripciones.</p>
                `
            },
            {
                category: 'evaluacion',
                categoryName: '⭐ Evaluación',
                question: '¿Qué criterios usa el jurado?',
                answer: `
                    <p>El jurado evalúa según estos criterios profesionales:</p>
                    <ul>
                        <li><span class="faq-highlight">Técnica Vocal (30%):</span> Afinación, respiración, proyección</li>
                        <li><span class="faq-highlight">Interpretación (25%):</span> Expresión emocional, carisma</li>
                        <li><span class="faq-highlight">Musicalidad (20%):</span> Ritmo, fraseo, dinámicas</li>
                        <li><span class="faq-highlight">Originalidad (15%):</span> Estilo personal, creatividad</li>
                        <li><span class="faq-highlight">Producción (10%):</span> Calidad técnica del material</li>
                    </ul>
                    <p>Cada criterio tiene subcategorías específicas para una evaluación detallada.</p>
                `
            },
            {
                category: 'evaluacion',
                categoryName: '⭐ Evaluación',
                question: '¿Recibo feedback del jurado?',
                answer: `
                    <p>¡Por supuesto! Todos los participantes reciben:</p>
                    <ul>
                        <li><strong>Puntuación detallada</strong> por cada criterio</li>
                        <li><strong>Comentarios escritos</strong> de cada juez</li>
                        <li><strong>Recomendaciones</strong> para mejorar tu performance</li>
                        <li><strong>Destacados positivos</strong> de tu interpretación</li>
                        <li><strong>Certificado de participación</strong> personalizado</li>
                    </ul>
                    <p>El feedback llega a tu email 2-3 días después del anuncio de resultados.</p>
                `
            },

            // PREMIOS
            {
                category: 'premios',
                categoryName: '🏆 Premios',
                question: '¿Qué premios puedo ganar?',
                answer: `
                    <p>Ofrecemos premios atractivos en diferentes categorías:</p>
                    <ul>
                        <li><strong>Gran Ganador Nacional:</strong> $50,000 + Contrato de grabación</li>
                        <li><strong>Subcampeón Nacional:</strong> $25,000 + Grabación de single</li>
                        <li><strong>Tercer Lugar Nacional:</strong> $15,000 + Sesión fotográfica</li>
                        <li><strong>Ganadores Provinciales:</strong> $10,000 + Pase a final nacional</li>
                        <li><strong>Premios Especiales:</strong> $5,000 (Mejor Voz, Mejor Interpretación, etc.)</li>
                    </ul>
                    <p>Además, todos los finalistas reciben promoción y oportunidades de networking.</p>
                `
            },
            {
                category: 'premios',
                categoryName: '🏆 Premios',
                question: '¿Cuándo y cómo recibo mi premio?',
                answer: `
                    <p>Los premios se entregan de la siguiente manera:</p>
                    <ul>
                        <li><strong>Premios en efectivo:</strong> Transferencia bancaria en 48-72 horas</li>
                        <li><strong>Trofeos:</strong> Envío por correo en 5-7 días hábiles</li>
                        <li><strong>Servicios (grabación, foto):</strong> Coordinación directa en 1 semana</li>
                        <li><strong>Contratos:</strong> Reunión virtual o presencial según disponibilidad</li>
                    </ul>
                    <p>Todos los ganadores firman un recibo y acuerdo de premios antes de la entrega.</p>
                `
            },

            // TÉCNICO
            {
                category: 'tecnico',
                categoryName: '🔧 Técnico',
                question: '¿Qué formato debe tener mi archivo de audio?',
                answer: `
                    <p>Para garantizar la mejor calidad, tu archivo debe cumplir:</p>
                    <ul>
                        <li><strong>Formato:</strong> MP3 (recomendado) o WAV</li>
                        <li><strong>Calidad:</strong> Mínimo 320 kbps para MP3</li>
                        <li><strong>Duración:</strong> Entre 2:30 y 4:30 minutos</li>
                        <li><strong>Tamaño:</strong> Máximo 5MB</li>
                        <li><strong>Volumen:</strong> Normalizado, sin distorsión</li>
                    </ul>
                    <p>Si tienes dudas sobre la calidad, nuestro sistema te avisa automáticamente si algo no cumple los requisitos.</p>
                `
            },
            {
                category: 'tecnico',
                categoryName: '🔧 Técnico',
                question: '¿Puedo subir un video en lugar de audio?',
                answer: `
                    <p>¡Sí! Los videos son bienvenidos y pueden darte ventaja:</p>
                    <ul>
                        <li><strong>Formato:</strong> MP4 (recomendado) o MOV</li>
                        <li><strong>Resolución:</strong> Mínimo 720p HD</li>
                        <li><strong>Duración:</strong> Entre 2:30 y 4:30 minutos</li>
                        <li><strong>Tamaño:</strong> Máximo 50MB</li>
                        <li><strong>Orientación:</strong> Horizontal preferible, vertical aceptable</li>
                    </ul>
                    <p>Los videos permiten al jurado evaluar también tu presencia escénica y expresión corporal.</p>
                `
            },
            {
                category: 'tecnico',
                categoryName: '🔧 Técnico',
                question: '¿Qué hago si no puedo subir mi archivo?',
                answer: `
                    <p>Si tienes problemas subiendo tu archivo:</p>
                    <ol>
                        <li><strong>Verifica el tamaño:</strong> Debe ser menor a los límites establecidos</li>
                        <li><strong>Revisa tu conexión:</strong> Una conexión lenta puede interrumpir la subida</li>
                        <li><strong>Usa otro navegador:</strong> Chrome o Firefox funcionan mejor</li>
                        <li><strong>Comprime el archivo:</strong> Usa herramientas online gratuitas</li>
                        <li><strong>Contacta soporte:</strong> Te ayudamos por WhatsApp en tiempo real</li>
                    </ol>
                    <p>Si ninguna opción funciona, puedes enviarnos el archivo por email o WeTransfer.</p>
                `
            },

            // GENERAL
            {
                category: 'general',
                categoryName: '📋 General',
                question: '¿Qué es VYT Music Online?',
                answer: `
                    <p>VYT Music Online es la plataforma líder en certámenes musicales virtuales de Argentina.</p>
                    <p><strong>Nuestra misión:</strong> Brindar oportunidades reales a artistas emergentes para mostrar su talento y crecer profesionalmente.</p>
                    <p><strong>¿Qué ofrecemos?</strong></p>
                    <ul>
                        <li>Certámenes mensuales por provincia y nacionales</li>
                        <li>Jurado profesional reconocido en la industria</li>
                        <li>Premios en efectivo y oportunidades reales</li>
                        <li>Plataforma 100% online, participa desde casa</li>
                        <li>Networking con otros artistas y profesionales</li>
                    </ul>
                `
            },
            {
                category: 'general',
                categoryName: '📋 General',
                question: '¿Los certámenes son realmente legítimos?',
                answer: `
                    <p>¡Absolutamente! Somos una empresa registrada con transparencia total:</p>
                    <ul>
                        <li><strong>Empresa registrada:</strong> CUIT 20-12345678-9</li>
                        <li><strong>Jurado verificado:</strong> Profesionales con trayectoria comprobable</li>
                        <li><strong>Premios reales:</strong> Historial de ganadores y testimonios públicos</li>
                        <li><strong>Contratos legales:</strong> Términos y condiciones claros</li>
                        <li><strong>Soporte activo:</strong> Atención personalizada garantizada</li>
                    </ul>
                    <p>Puedes verificar nuestros ganadores anteriores y sus testimonios en redes sociales.</p>
                `
            },
            {
                category: 'general',
                categoryName: '📋 General',
                question: '¿Cómo contacto al soporte?',
                answer: `
                    <p>Estamos disponibles para ayudarte por múltiples canales:</p>
                    <ul>
                        <li><strong>WhatsApp:</strong> +54 11 1234-5678 (respuesta inmediata)</li>
                        <li><strong>Email:</strong> soporte@vytmusic.com</li>
                        <li><strong>Chat en vivo:</strong> Botón inferior derecho de la página</li>
                        <li><strong>Redes sociales:</strong> @vytmusic en Instagram, Facebook y TikTok</li>
                        <li><strong>Teléfono:</strong> 0800-VYT-MUSIC (horario comercial)</li>
                    </ul>
                    <p><strong>Horarios de atención:</strong> Lunes a viernes 9-18hs, sábados 9-13hs</p>
                `
            }
        ];

        this.filteredFAQs = [...this.allFAQs];
    }

    createFAQButtons() {
        // Buscar lugares apropiados para añadir botones
        const targets = [
            '.help-section',
            '.faq-section',
            '.support-section',
            '.info-section',
            '.main-content',
            '.footer'
        ];

        targets.forEach(selector => {
            const target = document.querySelector(selector);
            if (target) {
                this.addFAQButton(target);
            }
        });

        // Si no hay targets específicos, agregar al final del body
        if (!document.querySelector('.faq-info-btn')) {
            const btn = this.createFAQButton();
            btn.style.position = 'fixed';
            btn.style.bottom = '80px';
            btn.style.right = '20px';
            btn.style.zIndex = '1000';
            document.body.appendChild(btn);
        }
    }

    addFAQButton(container) {
        const btn = this.createFAQButton();
        
        // Insertar en una posición apropiada
        const firstChild = container.firstElementChild;
        if (firstChild) {
            container.insertBefore(btn, firstChild);
        } else {
            container.appendChild(btn);
        }
    }

    createFAQButton() {
        const btn = document.createElement('button');
        btn.className = 'faq-info-btn';
        btn.innerHTML = `
            <span>❓</span>
            <span>Preguntas Frecuentes</span>
        `;
        
        btn.addEventListener('click', () => this.showFAQModal());
        return btn;
    }

    showFAQModal() {
        if (this.currentModal) return;

        this.currentModal = document.createElement('div');
        this.currentModal.className = 'faq-modal';
        
        this.currentModal.innerHTML = `
            <div class="faq-modal-content">
                <div class="faq-modal-header">
                    <button class="faq-modal-close">&times;</button>
                    <h2 class="faq-modal-title">❓ Preguntas Frecuentes</h2>
                    <p class="faq-modal-subtitle">Encuentra respuestas rápidas a las preguntas más comunes</p>
                </div>
                
                <div class="faq-search-container">
                    <div class="faq-search-box">
                        <span class="faq-search-icon">🔍</span>
                        <input type="text" class="faq-search-input" placeholder="Buscar preguntas... ej: 'cómo inscribirme'">
                    </div>
                </div>
                
                <div class="faq-categories">
                    <button class="faq-category-filter active" data-category="all">📋 Todas</button>
                    <button class="faq-category-filter" data-category="inscripcion">📝 Inscripción</button>
                    <button class="faq-category-filter" data-category="pagos">💳 Pagos</button>
                    <button class="faq-category-filter" data-category="evaluacion">⭐ Evaluación</button>
                    <button class="faq-category-filter" data-category="premios">🏆 Premios</button>
                    <button class="faq-category-filter" data-category="tecnico">🔧 Técnico</button>
                    <button class="faq-category-filter" data-category="general">📋 General</button>
                </div>
                
                <div class="faq-content">
                    <div class="faq-stats">
                        <span class="faq-stats-number">${this.filteredFAQs.length}</span>
                        <span>preguntas disponibles</span>
                    </div>
                    
                    <div class="faq-results">
                        ${this.renderFAQs()}
                    </div>
                    
                    <div class="faq-contact-box">
                        <h3>¿No encontraste lo que buscabas?</h3>
                        <p>Nuestro equipo de soporte está disponible para ayudarte personalmente</p>
                        <a href="https://wa.me/541112345678" class="faq-contact-btn" target="_blank">
                            💬 Contactar por WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.currentModal);
        
        // Event listeners
        this.setupModalEventListeners();
        
        // Show modal
        setTimeout(() => this.currentModal.classList.add('show'), 10);
    }

    renderFAQs() {
        if (this.filteredFAQs.length === 0) {
            return `
                <div class="faq-no-results">
                    <div class="faq-no-results-icon">🔍</div>
                    <h3>No encontramos resultados</h3>
                    <p>Intenta con otros términos de búsqueda o revisa todas las categorías</p>
                </div>
            `;
        }

        const faqsByCategory = {};
        
        // Agrupar FAQs por categoría
        this.filteredFAQs.forEach(faq => {
            if (!faqsByCategory[faq.category]) {
                faqsByCategory[faq.category] = {
                    name: faq.categoryName,
                    items: []
                };
            }
            faqsByCategory[faq.category].items.push(faq);
        });

        let html = '';
        
        Object.keys(faqsByCategory).forEach(categoryKey => {
            const category = faqsByCategory[categoryKey];
            html += `
                <div class="faq-section">
                    <h3 class="faq-section-title">${category.name}</h3>
                    ${category.items.map((faq, index) => `
                        <div class="faq-item">
                            <div class="faq-question" data-faq="${categoryKey}-${index}">
                                <span class="faq-question-text">${faq.question}</span>
                                <span class="faq-question-icon">🔽</span>
                            </div>
                            <div class="faq-answer" data-answer="${categoryKey}-${index}">
                                <div class="faq-answer-content">${faq.answer}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        return html;
    }

    setupModalEventListeners() {
        const modal = this.currentModal;
        
        // Close button
        const closeBtn = modal.querySelector('.faq-modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Search functionality
        const searchInput = modal.querySelector('.faq-search-input');
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
        
        // Category filters
        const categoryFilters = modal.querySelectorAll('.faq-category-filter');
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                const category = filter.getAttribute('data-category');
                
                // Update active filter
                categoryFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                
                // Filter FAQs
                this.filterByCategory(category);
            });
        });
        
        // FAQ accordion functionality
        this.setupFAQAccordion(modal);
        
        // Escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    setupFAQAccordion(modal) {
        // Use event delegation for FAQ questions
        modal.addEventListener('click', (e) => {
            if (e.target.closest('.faq-question')) {
                const question = e.target.closest('.faq-question');
                const faqId = question.getAttribute('data-faq');
                const answer = modal.querySelector(`[data-answer="${faqId}"]`);
                
                if (answer) {
                    // Close other open FAQs
                    const allQuestions = modal.querySelectorAll('.faq-question.active');
                    const allAnswers = modal.querySelectorAll('.faq-answer.active');
                    
                    allQuestions.forEach(q => {
                        if (q !== question) {
                            q.classList.remove('active');
                        }
                    });
                    
                    allAnswers.forEach(a => {
                        if (a !== answer) {
                            a.classList.remove('active');
                        }
                    });
                    
                    // Toggle current FAQ
                    question.classList.toggle('active');
                    answer.classList.toggle('active');
                }
            }
        });
    }

    performSearch(query) {
        if (!query.trim()) {
            this.filteredFAQs = [...this.allFAQs];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredFAQs = this.allFAQs.filter(faq => 
                faq.question.toLowerCase().includes(searchTerm) ||
                faq.answer.toLowerCase().includes(searchTerm) ||
                faq.categoryName.toLowerCase().includes(searchTerm)
            );
        }
        
        this.updateResults();
    }

    filterByCategory(category) {
        if (category === 'all') {
            this.filteredFAQs = [...this.allFAQs];
        } else {
            this.filteredFAQs = this.allFAQs.filter(faq => faq.category === category);
        }
        
        this.updateResults();
    }

    updateResults() {
        const modal = this.currentModal;
        const resultsContainer = modal.querySelector('.faq-results');
        const statsNumber = modal.querySelector('.faq-stats-number');
        
        // Update stats
        statsNumber.textContent = this.filteredFAQs.length;
        
        // Update results
        resultsContainer.innerHTML = this.renderFAQs();
        
        // Re-setup accordion for new content
        this.setupFAQAccordion(modal);
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
        return new ExpandedFAQSystem();
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.expandedFAQSystem = ExpandedFAQSystem.init();
});

// Export
window.ExpandedFAQSystem = ExpandedFAQSystem;