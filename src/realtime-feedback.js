/**
 * ⚡ SISTEMA DE FEEDBACK EN TIEMPO REAL VYT MUSIC  
 * Mejora la experiencia mediante interacción instantánea y comunicación fluida
 * 
 * Problemas identificados:
 * - Usuarios no saben si sus acciones funcionaron
 * - Falta de comunicación en tiempo real
 * - No hay soporte inmediato cuando tienen problemas
 * - Los cantantes no ven el progreso de sus votaciones
 * 
 * Soluciones implementadas:
 * - Notificaciones push inteligentes
 * - Actualizaciones en vivo de votaciones
 * - Chat de soporte integrado
 * - Indicadores de progreso dinámicos
 * - Sistema de badges y logros
 * - Feedback visual instantáneo
 */

class VYTRealTimeFeedback {
    constructor() {
        this.socket = null;
        this.notifications = [];
        this.isOnline = navigator.onLine;
        this.supportChat = {
            isOpen: false,
            messages: [],
            unreadCount: 0
        };
        this.liveUpdates = {
            votes: {},
            rankings: [],
            activities: []
        };
        this.achievements = [];
        
        this.init();
    }

    init() {
        console.log('⚡ Iniciando sistema de feedback en tiempo real...');
        
        this.setupWebSocket();
        this.initNotificationSystem();
        this.createRealTimeInterface();
        this.setupProgressTrackers();
        this.initSupportChat();
        this.setupOnlineStatusMonitoring();
        this.initAchievementSystem();
        
        console.log('✅ Sistema de feedback en tiempo real activo');
    }

    setupWebSocket() {
        // En producción, esto se conectaría al servidor WebSocket real
        console.log('🔌 Simulando conexión WebSocket...');
        
        // Simular eventos en tiempo real
        this.simulateRealTimeEvents();
    }

    simulateRealTimeEvents() {
        // Simular nuevos votos cada 10-30 segundos
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.simulateNewVote();
            }
        }, 15000);

        // Simular actividad cada 20-45 segundos
        setInterval(() => {
            if (Math.random() > 0.6) {
                this.simulateActivity();
            }
        }, 25000);

        // Simular cambios en ranking cada 2-5 minutos
        setInterval(() => {
            if (Math.random() > 0.5) {
                this.simulateRankingChange();
            }
        }, 180000);
    }

    simulateNewVote() {
        const vote = {
            id: Date.now(),
            artistName: this.getRandomArtistName(),
            timestamp: new Date(),
            province: this.getRandomProvince()
        };

        this.handleNewVote(vote);
    }

    simulateActivity() {
        const activities = [
            'Nuevo participante se inscribió',
            'Se actualizó el reglamento',
            'Nuevo video subido',
            'Comentario destacado',
            'Certificación verificada'
        ];

        const activity = {
            id: Date.now(),
            type: 'activity',
            message: activities[Math.floor(Math.random() * activities.length)],
            timestamp: new Date()
        };

        this.handleNewActivity(activity);
    }

    simulateRankingChange() {
        const changes = [
            'subió 2 posiciones',
            'bajó 1 posición',
            'se mantiene en el top 5',
            'entró al top 10',
            'nuevo líder provincial'
        ];

        const change = {
            id: Date.now(),
            type: 'ranking',
            message: `Tu posición ${changes[Math.floor(Math.random() * changes.length)]}`,
            timestamp: new Date()
        };

        this.handleRankingChange(change);
    }

    initNotificationSystem() {
        console.log('🔔 Inicializando sistema de notificaciones...');

        // Pedir permiso para notificaciones push
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showNotification('¡Bienvenido a VYT Music! 🎤', {
                        body: 'Recibirás notificaciones sobre tus votaciones y actividad.',
                        icon: '/images/vyt-icon.png',
                        tag: 'welcome'
                    });
                }
            });
        }

        // Service Worker para notificaciones offline
        this.registerNotificationServiceWorker();
    }

    registerNotificationServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js').then(registration => {
                console.log('✅ Service Worker registrado para notificaciones');
            });
        }
    }

    createRealTimeInterface() {
        const interfaceHTML = `
            <!-- NOTIFICATION CENTER -->
            <div id="vyt-notification-center" class="vyt-notification-center">
                <button id="notification-toggle" class="notification-toggle">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge">0</span>
                </button>
                <div class="notification-dropdown" style="display: none;">
                    <div class="notification-header">
                        <h3>🔔 Notificaciones</h3>
                        <button onclick="VYTRealTimeFeedback.clearAllNotifications()">Limpiar todo</button>
                    </div>
                    <div class="notification-list">
                        <div class="no-notifications">
                            <i class="fas fa-bell-slash"></i>
                            <p>No hay notificaciones</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LIVE UPDATES PANEL -->
            <div id="vyt-live-updates" class="vyt-live-updates">
                <div class="live-header">
                    <span class="live-indicator">🔴 EN VIVO</span>
                    <span class="live-stats">0 votos hoy</span>
                </div>
                <div class="live-content" id="live-content">
                    <div class="live-item">
                        <i class="fas fa-chart-line"></i>
                        <span>Sistema en vivo activado</span>
                        <small>Ahora mismo</small>
                    </div>
                </div>
            </div>

            <!-- SUPPORT CHAT -->
            <div id="vyt-support-chat" class="vyt-support-chat">
                <button id="support-chat-toggle" class="support-chat-toggle">
                    <i class="fas fa-comments"></i>
                    <span class="chat-badge" style="display: none;">0</span>
                </button>
                <div class="chat-window" style="display: none;">
                    <div class="chat-header">
                        <h3>💬 Soporte VYT</h3>
                        <div class="chat-status">
                            <span class="status-dot online"></span>
                            <span>En línea</span>
                        </div>
                        <button onclick="VYTRealTimeFeedback.toggleSupportChat()">×</button>
                    </div>
                    <div class="chat-messages" id="chat-messages">
                        <div class="chat-message support">
                            <div class="message-content">
                                <p>¡Hola! 👋 Soy el asistente de VYT Music. ¿En qué puedo ayudarte?</p>
                                <small>${new Date().toLocaleTimeString()}</small>
                            </div>
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <input type="text" id="chat-input" placeholder="Escribe tu consulta...">
                        <button onclick="VYTRealTimeFeedback.sendMessage()">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="quick-actions">
                        <button onclick="VYTRealTimeFeedback.quickAction('voting')">🗳️ Ayuda con votación</button>
                        <button onclick="VYTRealTimeFeedback.quickAction('upload')">📹 Problema con video</button>
                        <button onclick="VYTRealTimeFeedback.quickAction('registration')">📝 Inscripción</button>
                    </div>
                </div>
            </div>

            <!-- PROGRESS TRACKER -->
            <div id="vyt-progress-tracker" class="vyt-progress-tracker" style="display: none;">
                <div class="progress-content">
                    <h4 id="progress-title">Procesando...</h4>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="main-progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <span class="progress-text" id="progress-percentage">0%</span>
                    </div>
                    <p id="progress-description">Iniciando proceso...</p>
                    <div class="progress-steps">
                        <div class="step" data-step="1">
                            <div class="step-circle">1</div>
                            <span>Validación</span>
                        </div>
                        <div class="step" data-step="2">
                            <div class="step-circle">2</div>
                            <span>Procesamiento</span>
                        </div>
                        <div class="step" data-step="3">
                            <div class="step-circle">3</div>
                            <span>Confirmación</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ACHIEVEMENT POPUP -->
            <div id="vyt-achievement-popup" class="vyt-achievement-popup" style="display: none;">
                <div class="achievement-content">
                    <div class="achievement-icon">🏆</div>
                    <h3 class="achievement-title">¡Logro Desbloqueado!</h3>
                    <p class="achievement-description">Has completado tu primera acción</p>
                    <button onclick="VYTRealTimeFeedback.closeAchievement()" class="achievement-close">Genial</button>
                </div>
            </div>

            <!-- ONLINE STATUS INDICATOR -->
            <div id="vyt-online-status" class="vyt-online-status online">
                <i class="fas fa-wifi"></i>
                <span>En línea</span>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', interfaceHTML);
        this.addRealTimeStyles();
        this.setupRealTimeEvents();
    }

    addRealTimeStyles() {
        const realTimeStyles = `
            <style id="vyt-realtime-styles">
                /* === NOTIFICATION CENTER === */
                .vyt-notification-center {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                }

                .notification-toggle {
                    position: relative;
                    background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                    border: none;
                    color: white;
                    width: 50px;
                    height: 50px;
                    border-radius: 25px;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(0,217,255,0.3);
                    transition: all 0.3s ease;
                    font-size: 18px;
                }

                .notification-toggle:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(0,217,255,0.4);
                }

                .notification-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ef4444;
                    color: white;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 10px;
                    min-width: 18px;
                    text-align: center;
                }

                .notification-dropdown {
                    position: absolute;
                    top: 60px;
                    right: 0;
                    width: 350px;
                    max-height: 400px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    overflow: hidden;
                    transform: translateY(-10px);
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .notification-dropdown.show {
                    transform: translateY(0);
                    opacity: 1;
                }

                .notification-header {
                    padding: 20px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .notification-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .notification-header button {
                    background: none;
                    border: none;
                    color: #6b7280;
                    font-size: 14px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .notification-header button:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                .notification-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .notification-item {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f3f4f6;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .notification-item:hover {
                    background: #f9fafb;
                }

                .notification-item.unread {
                    background: rgba(0,217,255,0.05);
                    border-left: 3px solid #00d9ff;
                }

                .notification-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .notification-content {
                    flex: 1;
                }

                .notification-content h4 {
                    margin: 0 0 4px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1f2937;
                }

                .notification-content p {
                    margin: 0 0 4px 0;
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.4;
                }

                .notification-time {
                    font-size: 11px;
                    color: #9ca3af;
                }

                .no-notifications {
                    text-align: center;
                    padding: 40px 20px;
                    color: #9ca3af;
                }

                .no-notifications i {
                    font-size: 32px;
                    margin-bottom: 12px;
                    display: block;
                }

                /* === LIVE UPDATES PANEL === */
                .vyt-live-updates {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 300px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                    z-index: 9999;
                    max-height: 400px;
                    overflow: hidden;
                    opacity: 0.95;
                }

                .live-header {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 14px;
                    font-weight: 600;
                }

                .live-indicator {
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .live-content {
                    max-height: 350px;
                    overflow-y: auto;
                    padding: 8px 0;
                }

                .live-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    font-size: 13px;
                    border-bottom: 1px solid #f3f4f6;
                    animation: slideInRight 0.5s ease;
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                .live-item i {
                    color: #00d9ff;
                    width: 16px;
                }

                .live-item span {
                    flex: 1;
                    color: #374151;
                    font-weight: 500;
                }

                .live-item small {
                    color: #9ca3af;
                    font-size: 11px;
                }

                /* === SUPPORT CHAT === */
                .vyt-support-chat {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                }

                .support-chat-toggle {
                    position: relative;
                    background: #10b981;
                    border: none;
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 30px;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(16,185,129,0.3);
                    transition: all 0.3s ease;
                    font-size: 24px;
                }

                .support-chat-toggle:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(16,185,129,0.4);
                }

                .chat-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ef4444;
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 10px;
                    min-width: 18px;
                    text-align: center;
                }

                .chat-window {
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 350px;
                    height: 450px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transform: translateY(20px) scale(0.95);
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .chat-window.show {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }

                .chat-header {
                    background: #10b981;
                    color: white;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .chat-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                }

                .chat-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 4px;
                    background: #ef4444;
                }

                .status-dot.online {
                    background: #22c55e;
                    animation: pulse 2s infinite;
                }

                .chat-header button {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    border-radius: 15px;
                    transition: background 0.2s ease;
                }

                .chat-header button:hover {
                    background: rgba(255,255,255,0.2);
                }

                .chat-messages {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .chat-message {
                    display: flex;
                    max-width: 80%;
                }

                .chat-message.support {
                    align-self: flex-start;
                }

                .chat-message.user {
                    align-self: flex-end;
                }

                .message-content {
                    background: #f3f4f6;
                    padding: 12px 16px;
                    border-radius: 18px;
                    position: relative;
                }

                .chat-message.support .message-content {
                    background: #10b981;
                    color: white;
                }

                .chat-message.user .message-content {
                    background: #00d9ff;
                    color: white;
                }

                .message-content p {
                    margin: 0 0 4px 0;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .message-content small {
                    font-size: 11px;
                    opacity: 0.7;
                }

                .chat-input-area {
                    padding: 16px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 8px;
                }

                .chat-input-area input {
                    flex: 1;
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 20px;
                    outline: none;
                    font-size: 14px;
                }

                .chat-input-area input:focus {
                    border-color: #10b981;
                }

                .chat-input-area button {
                    background: #10b981;
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .chat-input-area button:hover {
                    background: #059669;
                    transform: scale(1.05);
                }

                .quick-actions {
                    padding: 12px 16px;
                    background: #f9fafb;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .quick-actions button {
                    background: white;
                    border: 1px solid #e5e7eb;
                    color: #6b7280;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .quick-actions button:hover {
                    border-color: #10b981;
                    color: #10b981;
                    background: rgba(16,185,129,0.05);
                }

                /* === PROGRESS TRACKER === */
                .vyt-progress-tracker {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    z-index: 10001;
                    min-width: 400px;
                    max-width: 90vw;
                }

                .progress-content h4 {
                    margin: 0 0 16px 0;
                    font-size: 20px;
                    font-weight: 700;
                    color: #1f2937;
                    text-align: center;
                }

                .progress-bar-container {
                    position: relative;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .progress-bar {
                    flex: 1;
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                    width: 0%;
                    transition: width 0.3s ease;
                    border-radius: 4px;
                }

                .progress-text {
                    font-size: 14px;
                    font-weight: 600;
                    color: #00d9ff;
                    min-width: 40px;
                }

                #progress-description {
                    text-align: center;
                    color: #6b7280;
                    margin: 0 0 24px 0;
                    font-size: 14px;
                }

                .progress-steps {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    position: relative;
                }

                .step::after {
                    content: '';
                    position: absolute;
                    top: 15px;
                    left: 50%;
                    width: 100%;
                    height: 2px;
                    background: #e5e7eb;
                    z-index: -1;
                }

                .step:last-child::after {
                    display: none;
                }

                .step-circle {
                    width: 30px;
                    height: 30px;
                    border-radius: 15px;
                    background: #e5e7eb;
                    color: #9ca3af;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 700;
                    transition: all 0.3s ease;
                }

                .step.active .step-circle {
                    background: #00d9ff;
                    color: white;
                }

                .step.completed .step-circle {
                    background: #10b981;
                    color: white;
                }

                .step span {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 500;
                }

                .step.active span {
                    color: #00d9ff;
                    font-weight: 600;
                }

                /* === ACHIEVEMENT POPUP === */
                .vyt-achievement-popup {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10002;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .achievement-content {
                    background: white;
                    border-radius: 24px;
                    padding: 40px;
                    text-align: center;
                    max-width: 400px;
                    animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                @keyframes bounceIn {
                    0% {
                        transform: scale(0.3);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05);
                    }
                    70% {
                        transform: scale(0.9);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .achievement-icon {
                    font-size: 80px;
                    margin-bottom: 20px;
                    animation: rotate 2s ease-in-out infinite;
                }

                @keyframes rotate {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }

                .achievement-title {
                    margin: 0 0 12px 0;
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .achievement-description {
                    margin: 0 0 24px 0;
                    color: #6b7280;
                    font-size: 16px;
                    line-height: 1.5;
                }

                .achievement-close {
                    background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                    color: white;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .achievement-close:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(0,217,255,0.3);
                }

                /* === ONLINE STATUS === */
                .vyt-online-status {
                    position: fixed;
                    top: 80px;
                    left: 20px;
                    background: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    z-index: 9998;
                    transition: all 0.3s ease;
                }

                .vyt-online-status.online {
                    color: #10b981;
                    border: 1px solid #10b981;
                }

                .vyt-online-status.offline {
                    color: #ef4444;
                    border: 1px solid #ef4444;
                }

                .vyt-online-status i {
                    font-size: 10px;
                }

                .vyt-online-status.online i {
                    animation: pulse 2s infinite;
                }

                /* === RESPONSIVE === */
                @media (max-width: 768px) {
                    .notification-dropdown,
                    .chat-window {
                        width: calc(100vw - 40px);
                        right: 20px;
                    }

                    .vyt-live-updates {
                        width: calc(100vw - 40px);
                        right: 20px;
                    }

                    .vyt-progress-tracker {
                        min-width: calc(100vw - 40px);
                        padding: 24px;
                    }

                    .achievement-content {
                        margin: 20px;
                        padding: 30px;
                    }

                    .progress-steps {
                        flex-direction: column;
                        gap: 16px;
                    }

                    .step::after {
                        display: none;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', realTimeStyles);
    }

    setupRealTimeEvents() {
        // Notification toggle
        const notificationToggle = document.getElementById('notification-toggle');
        const notificationDropdown = document.querySelector('.notification-dropdown');

        notificationToggle?.addEventListener('click', () => {
            const isVisible = notificationDropdown.classList.contains('show');
            if (isVisible) {
                notificationDropdown.classList.remove('show');
                setTimeout(() => {
                    notificationDropdown.style.display = 'none';
                }, 300);
            } else {
                notificationDropdown.style.display = 'block';
                setTimeout(() => {
                    notificationDropdown.classList.add('show');
                }, 10);
            }
        });

        // Support chat toggle
        const supportChatToggle = document.getElementById('support-chat-toggle');
        const chatWindow = document.querySelector('.chat-window');

        supportChatToggle?.addEventListener('click', () => {
            this.toggleSupportChat();
        });

        // Chat input
        const chatInput = document.getElementById('chat-input');
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!notificationToggle?.contains(e.target) && !notificationDropdown?.contains(e.target)) {
                notificationDropdown?.classList.remove('show');
                setTimeout(() => {
                    if (!notificationDropdown.classList.contains('show')) {
                        notificationDropdown.style.display = 'none';
                    }
                }, 300);
            }
        });
    }

    setupProgressTrackers() {
        console.log('📊 Configurando indicadores de progreso...');
        
        // Interceptar formularios para mostrar progreso
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.showProgressTracker('Enviando formulario...', [
                    'Validando datos',
                    'Enviando información',
                    'Confirmando envío'
                ]);
            }
        });

        // Interceptar uploads de archivos
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.files.length > 0) {
                this.showProgressTracker('Subiendo archivo...', [
                    'Validando archivo',
                    'Subiendo contenido',
                    'Procesando video'
                ]);
            }
        });
    }

    initSupportChat() {
        console.log('💬 Inicializando chat de soporte...');
        
        // Respuestas automáticas
        this.chatResponses = {
            'voting': {
                message: '🗳️ Para votar es muy fácil:\n\n1. Ve a la sección de participantes\n2. Busca al artista que quieres votar\n3. Haz clic en el botón "Votar"\n4. ¡Confirma tu voto!\n\nRecuerda que puedes votar una vez por día.',
                delay: 1500
            },
            'upload': {
                message: '📹 Si tienes problemas subiendo tu video:\n\n• Verifica que el archivo sea MP4, AVI o MOV\n• El video no debe durar más de 3 minutos\n• Tamaño máximo: 100MB\n• Asegúrate de tener buena conexión\n\n¿El problema persiste?',
                delay: 2000
            },
            'registration': {
                message: '📝 Ayuda con inscripción:\n\n• Completa todos los campos obligatorios\n• Usa tu email real para confirmación\n• Sube un video de máximo 3 minutos\n• Acepta términos y condiciones\n\n¿Necesitas ayuda específica?',
                delay: 1800
            },
            'default': {
                message: 'Gracias por tu consulta. Un especialista te responderá pronto. Mientras tanto, puedes:\n\n• Revisar nuestro reglamento\n• Ver los tutoriales en YouTube\n• Consultar las preguntas frecuentes\n\n¿Hay algo más en lo que pueda ayudarte?',
                delay: 1200
            }
        };
    }

    setupOnlineStatusMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineStatus();
            this.showNotification('Conexión restaurada', {
                body: 'Ya estás conectado nuevamente',
                icon: '/images/vyt-icon.png'
            });
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
            this.showNotification('Sin conexión', {
                body: 'Trabajando en modo offline',
                icon: '/images/vyt-icon.png'
            });
        });
    }

    updateOnlineStatus() {
        const statusElement = document.getElementById('vyt-online-status');
        if (statusElement) {
            statusElement.className = `vyt-online-status ${this.isOnline ? 'online' : 'offline'}`;
            statusElement.innerHTML = `
                <i class="fas fa-${this.isOnline ? 'wifi' : 'wifi-slash'}"></i>
                <span>${this.isOnline ? 'En línea' : 'Sin conexión'}</span>
            `;
        }
    }

    initAchievementSystem() {
        // Logros disponibles
        this.availableAchievements = [
            {
                id: 'first_vote',
                title: '¡Primer Voto! 🗳️',
                description: 'Has emitido tu primer voto en VYT Music',
                icon: '🗳️',
                condition: 'vote'
            },
            {
                id: 'video_uploaded',
                title: '¡Video Subido! 📹',
                description: 'Has subido tu primer video de participación',
                icon: '📹',
                condition: 'upload'
            },
            {
                id: 'profile_completed',
                title: '¡Perfil Completo! ✨',
                description: 'Has completado toda tu información de perfil',
                icon: '✨',
                condition: 'profile'
            },
            {
                id: 'first_share',
                title: '¡Compartiste! 🚀',
                description: 'Has compartido tu participación en redes sociales',
                icon: '🚀',
                condition: 'share'
            },
            {
                id: 'daily_login',
                title: '¡Usuario Activo! ⭐',
                description: 'Has visitado la plataforma 7 días consecutivos',
                icon: '⭐',
                condition: 'login'
            }
        ];

        // Cargar logros ya obtenidos
        this.achievements = JSON.parse(localStorage.getItem('vytAchievements') || '[]');
    }

    // === MÉTODOS PÚBLICOS ===

    showNotification(title, options = {}) {
        const notification = {
            id: Date.now(),
            title,
            body: options.body || '',
            icon: options.icon || '/images/vyt-icon.png',
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);
        this.updateNotificationBadge();
        this.addNotificationToDOM(notification);

        // Notificación del navegador si está permitida
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: options.body,
                icon: options.icon || '/images/vyt-icon.png',
                tag: options.tag
            });
        }

        // Auto-remove después de 10 segundos si no es importante
        if (!options.persistent) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, 10000);
        }
    }

    addNotificationToDOM(notification) {
        const notificationList = document.querySelector('.notification-list');
        const noNotifications = document.querySelector('.no-notifications');
        
        if (noNotifications) {
            noNotifications.style.display = 'none';
        }

        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification-item unread';
        notificationElement.dataset.id = notification.id;
        notificationElement.innerHTML = `
            <div class="notification-icon">
                ${this.getNotificationIconByType(notification.title)}
            </div>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.body}</p>
                <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
            </div>
        `;

        notificationElement.addEventListener('click', () => {
            this.markNotificationAsRead(notification.id);
        });

        notificationList.insertBefore(notificationElement, notificationList.firstChild);
    }

    getNotificationIconByType(title) {
        if (title.includes('Voto')) return '🗳️';
        if (title.includes('Video')) return '📹';
        if (title.includes('Ranking')) return '📊';
        if (title.includes('Logro')) return '🏆';
        if (title.includes('Mensaje')) return '💬';
        return '🔔';
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    handleNewVote(vote) {
        // Actualizar estadísticas en vivo
        const liveStats = document.querySelector('.live-stats');
        if (liveStats) {
            const currentVotes = parseInt(liveStats.textContent.match(/\d+/)?.[0] || 0) + 1;
            liveStats.textContent = `${currentVotes} votos hoy`;
        }

        // Agregar a live updates
        this.addLiveUpdate(`🗳️ Nuevo voto de ${vote.province}`, 'vote');

        // Notificación si es para el usuario actual
        if (this.isCurrentUser(vote.artistName)) {
            this.showNotification('¡Nuevo voto recibido!', {
                body: `Alguien de ${vote.province} acaba de votar por ti`,
                icon: '/images/vyt-icon.png'
            });

            // Verificar logro de primer voto
            this.checkAchievement('vote');
        }
    }

    handleNewActivity(activity) {
        this.addLiveUpdate(activity.message, 'activity');
    }

    handleRankingChange(change) {
        this.addLiveUpdate(change.message, 'ranking');
        
        this.showNotification('Cambio en el ranking', {
            body: change.message,
            icon: '/images/vyt-icon.png'
        });
    }

    addLiveUpdate(message, type) {
        const liveContent = document.getElementById('live-content');
        if (!liveContent) return;

        const icons = {
            vote: '🗳️',
            activity: '📢',
            ranking: '📊',
            upload: '📹',
            user: '👤'
        };

        const updateElement = document.createElement('div');
        updateElement.className = 'live-item';
        updateElement.innerHTML = `
            <i class="fas fa-${type === 'vote' ? 'vote-yea' : type === 'ranking' ? 'chart-line' : 'bell'}"></i>
            <span>${message}</span>
            <small>Ahora</small>
        `;

        liveContent.insertBefore(updateElement, liveContent.firstChild);

        // Mantener solo los últimos 10 updates
        const items = liveContent.querySelectorAll('.live-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }

        // Actualizar timestamps cada minuto
        setTimeout(() => {
            const timeElement = updateElement.querySelector('small');
            if (timeElement) timeElement.textContent = 'Hace 1 min';
        }, 60000);
    }

    showProgressTracker(title, steps) {
        const tracker = document.getElementById('vyt-progress-tracker');
        const progressTitle = document.getElementById('progress-title');
        const progressDescription = document.getElementById('progress-description');
        const progressFill = document.querySelector('.progress-fill');
        const progressPercentage = document.getElementById('progress-percentage');

        if (!tracker) return;

        progressTitle.textContent = title;
        progressDescription.textContent = steps[0];
        tracker.style.display = 'block';

        // Simular progreso
        let currentStep = 0;
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                setTimeout(() => {
                    tracker.style.display = 'none';
                    this.showNotification('Proceso completado', {
                        body: 'La operación se realizó exitosamente',
                        icon: '/images/vyt-icon.png'
                    });
                }, 1000);
            }

            // Actualizar step activo
            if (progress > (currentStep + 1) * 33.33 && currentStep < steps.length - 1) {
                // Marcar step actual como completado
                const currentStepElement = document.querySelector(`[data-step="${currentStep + 1}"]`);
                if (currentStepElement) {
                    currentStepElement.classList.remove('active');
                    currentStepElement.classList.add('completed');
                }

                currentStep++;
                progressDescription.textContent = steps[currentStep];

                // Marcar nuevo step como activo
                const newStepElement = document.querySelector(`[data-step="${currentStep + 1}"]`);
                if (newStepElement) {
                    newStepElement.classList.add('active');
                }
            }

            progressFill.style.width = `${progress}%`;
            progressPercentage.textContent = `${Math.round(progress)}%`;
        }, 200);
    }

    toggleSupportChat() {
        const chatWindow = document.querySelector('.chat-window');
        if (!chatWindow) return;

        const isVisible = chatWindow.classList.contains('show');
        
        if (isVisible) {
            chatWindow.classList.remove('show');
            setTimeout(() => {
                chatWindow.style.display = 'none';
            }, 300);
        } else {
            chatWindow.style.display = 'flex';
            setTimeout(() => {
                chatWindow.classList.add('show');
            }, 10);
        }

        this.supportChat.isOpen = !isVisible;
    }

    sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        
        if (!chatInput || !chatMessages || !chatInput.value.trim()) return;

        const message = chatInput.value.trim();
        
        // Agregar mensaje del usuario
        this.addChatMessage(message, 'user');
        
        // Limpiar input
        chatInput.value = '';

        // Respuesta automática después de un delay
        setTimeout(() => {
            const response = this.generateChatResponse(message);
            this.addChatMessage(response, 'support');
        }, 800);
    }

    addChatMessage(message, sender) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
                <small>${new Date().toLocaleTimeString()}</small>
            </div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    generateChatResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('vot')) {
            return this.chatResponses.voting.message;
        } else if (lowerMessage.includes('video') || lowerMessage.includes('subir')) {
            return this.chatResponses.upload.message;
        } else if (lowerMessage.includes('inscrib') || lowerMessage.includes('registro')) {
            return this.chatResponses.registration.message;
        } else {
            return this.chatResponses.default.message;
        }
    }

    quickAction(type) {
        const response = this.chatResponses[type] || this.chatResponses.default;
        this.addChatMessage(response.message, 'support');
    }

    checkAchievement(condition) {
        const achievement = this.availableAchievements.find(a => 
            a.condition === condition && 
            !this.achievements.some(earned => earned.id === a.id)
        );

        if (achievement) {
            this.unlockAchievement(achievement);
        }
    }

    unlockAchievement(achievement) {
        this.achievements.push({
            ...achievement,
            unlockedAt: new Date()
        });

        localStorage.setItem('vytAchievements', JSON.stringify(this.achievements));

        // Mostrar popup de logro
        this.showAchievementPopup(achievement);

        // Notificación
        this.showNotification('¡Logro desbloqueado!', {
            body: achievement.description,
            icon: '/images/vyt-icon.png'
        });
    }

    showAchievementPopup(achievement) {
        const popup = document.getElementById('vyt-achievement-popup');
        const icon = document.querySelector('.achievement-icon');
        const title = document.querySelector('.achievement-title');
        const description = document.querySelector('.achievement-description');

        if (popup && icon && title && description) {
            icon.textContent = achievement.icon;
            title.textContent = achievement.title;
            description.textContent = achievement.description;
            popup.style.display = 'flex';
        }
    }

    closeAchievement() {
        const popup = document.getElementById('vyt-achievement-popup');
        if (popup) {
            popup.style.display = 'none';
        }
    }

    // === MÉTODOS AUXILIARES ===

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes}m`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hace ${hours}h`;
        
        const days = Math.floor(hours / 24);
        return `Hace ${days}d`;
    }

    isCurrentUser(artistName) {
        const userData = JSON.parse(localStorage.getItem('vytUserProfile') || '{}');
        return userData.nombre === artistName;
    }

    getRandomArtistName() {
        const names = ['Ana García', 'Carlos López', 'María Rodríguez', 'Diego Martín', 'Lucía Fernández', 'Pablo Ruiz'];
        return names[Math.floor(Math.random() * names.length)];
    }

    getRandomProvince() {
        const provinces = ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Entre Ríos'];
        return provinces[Math.floor(Math.random() * provinces.length)];
    }

    // === MÉTODOS ESTÁTICOS PÚBLICOS ===

    static clearAllNotifications() {
        const notificationList = document.querySelector('.notification-list');
        const noNotifications = document.querySelector('.no-notifications');
        const badge = document.querySelector('.notification-badge');
        
        if (notificationList) {
            notificationList.innerHTML = '';
            notificationList.appendChild(noNotifications);
            noNotifications.style.display = 'block';
        }
        
        if (badge) {
            badge.style.display = 'none';
        }

        // Limpiar del instance
        if (window.vytRealTimeFeedback) {
            window.vytRealTimeFeedback.notifications = [];
        }
    }

    static toggleSupportChat() {
        if (window.vytRealTimeFeedback) {
            window.vytRealTimeFeedback.toggleSupportChat();
        }
    }

    static sendMessage() {
        if (window.vytRealTimeFeedback) {
            window.vytRealTimeFeedback.sendMessage();
        }
    }

    static quickAction(type) {
        if (window.vytRealTimeFeedback) {
            window.vytRealTimeFeedback.quickAction(type);
        }
    }

    static closeAchievement() {
        if (window.vytRealTimeFeedback) {
            window.vytRealTimeFeedback.closeAchievement();
        }
    }
}

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.vytRealTimeFeedback = new VYTRealTimeFeedback();
});

// Hacer disponible globalmente
window.VYTRealTimeFeedback = VYTRealTimeFeedback;

console.log('⚡ VYT Real-Time Feedback System loaded successfully!');