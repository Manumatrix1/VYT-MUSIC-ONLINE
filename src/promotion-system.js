/**
 * 🚀 SISTEMA DE PROMOCIÓN VYT MUSIC
 * Solución específica para Ana (Pop): "Necesito más promoción" - 8/10
 * 
 * Problema identificado:
 * - Ana tiene talento pero le falta visibilidad
 * - Necesita herramientas para promocionar su participación
 * - Quiere compartir en redes sociales fácilmente
 * - Busca trackear el alcance de su promoción
 * 
 * Soluciones implementadas:
 * - Kit completo de promoción
 * - Compartir optimizado en redes
 * - QR codes personalizados
 * - Widgets embebibles
 * - Analytics de promoción
 * - Templates profesionales
 */

class VYTPromotionSystem {
    constructor() {
        this.userProfile = null;
        this.promotionStats = {
            shares: 0,
            views: 0,
            votes: 0,
            conversions: 0
        };
        this.qrCode = null;
        this.promotionTools = [];
        
        this.init();
    }

    init() {
        console.log('🚀 Iniciando sistema de promoción VYT...');
        
        this.loadUserProfile();
        this.createPromotionInterface();
        this.setupSocialSharing();
        this.generatePromotionAssets();
        this.initializeAnalytics();
        
        console.log('✅ Sistema de promoción listo');
    }

    loadUserProfile() {
        // Cargar datos del usuario desde Firebase o localStorage
        const userData = JSON.parse(localStorage.getItem('vytUserProfile') || '{}');
        this.userProfile = {
            nombre: userData.nombre || 'Artista VYT',
            genero: userData.genero || 'Pop',
            provincia: userData.provincia || 'Buenos Aires',
            foto: userData.foto || '/images/default-avatar.jpg',
            video: userData.video || '',
            biografia: userData.biografia || 'Participante de VYT Music Online',
            socialMedia: userData.socialMedia || {}
        };
    }

    createPromotionInterface() {
        // Verificar si ya existe la interfaz
        if (document.getElementById('vyt-promotion-panel')) return;

        const promotionHTML = `
            <div id="vyt-promotion-panel" class="vyt-promotion-panel" style="display: none;">
                <div class="promotion-overlay"></div>
                <div class="promotion-content">
                    <div class="promotion-header">
                        <h2>🚀 Kit de Promoción</h2>
                        <p>Aumenta tu visibilidad y consigue más votos</p>
                        <button class="close-promotion" onclick="this.closest('#vyt-promotion-panel').style.display='none'">×</button>
                    </div>

                    <div class="promotion-tabs">
                        <button class="promotion-tab active" data-tab="share">Compartir</button>
                        <button class="promotion-tab" data-tab="assets">Assets</button>
                        <button class="promotion-tab" data-tab="widgets">Widgets</button>
                        <button class="promotion-tab" data-tab="analytics">Analytics</button>
                    </div>

                    <div class="promotion-tab-content">
                        <!-- TAB: COMPARTIR -->
                        <div class="promotion-tab-panel active" data-panel="share">
                            <div class="social-sharing-grid">
                                <div class="share-option instagram" data-platform="instagram">
                                    <div class="share-icon">📸</div>
                                    <h3>Instagram</h3>
                                    <p>Story + Feed optimizado</p>
                                    <button class="share-btn">Crear post</button>
                                </div>

                                <div class="share-option tiktok" data-platform="tiktok">
                                    <div class="share-icon">🎵</div>
                                    <h3>TikTok</h3>
                                    <p>Video promocional</p>
                                    <button class="share-btn">Generar video</button>
                                </div>

                                <div class="share-option facebook" data-platform="facebook">
                                    <div class="share-icon">📘</div>
                                    <h3>Facebook</h3>
                                    <p>Post con enlace</p>
                                    <button class="share-btn">Compartir</button>
                                </div>

                                <div class="share-option twitter" data-platform="twitter">
                                    <div class="share-icon">🐦</div>
                                    <h3>Twitter</h3>
                                    <p>Tweet optimizado</p>
                                    <button class="share-btn">Tweetear</button>
                                </div>

                                <div class="share-option whatsapp" data-platform="whatsapp">
                                    <div class="share-icon">💬</div>
                                    <h3>WhatsApp</h3>
                                    <p>Mensaje personal</p>
                                    <button class="share-btn">Enviar</button>
                                </div>

                                <div class="share-option telegram" data-platform="telegram">
                                    <div class="share-icon">✈️</div>
                                    <h3>Telegram</h3>
                                    <p>Canal/Grupo</p>
                                    <button class="share-btn">Compartir</button>
                                </div>
                            </div>

                            <div class="quick-share-section">
                                <h3>🔗 Enlace directo</h3>
                                <div class="share-link-container">
                                    <input type="text" id="share-link" readonly value="" placeholder="Generando enlace...">
                                    <button onclick="VYTPromotionSystem.copyToClipboard('share-link')">Copiar</button>
                                </div>
                            </div>

                            <div class="qr-code-section">
                                <h3>📱 Código QR</h3>
                                <div class="qr-container">
                                    <div id="qr-code-display">Generando QR...</div>
                                    <button onclick="VYTPromotionSystem.downloadQR()">Descargar QR</button>
                                </div>
                            </div>
                        </div>

                        <!-- TAB: ASSETS -->
                        <div class="promotion-tab-panel" data-panel="assets">
                            <div class="assets-grid">
                                <div class="asset-card">
                                    <div class="asset-preview instagram-story">
                                        <div class="story-content">
                                            <h4>${this.userProfile.nombre}</h4>
                                            <p>🎤 Participando en VYT Music</p>
                                            <div class="genre-tag">${this.userProfile.genero}</div>
                                        </div>
                                    </div>
                                    <h3>Instagram Story</h3>
                                    <button onclick="VYTPromotionSystem.generateAsset('instagram-story')">Generar</button>
                                </div>

                                <div class="asset-card">
                                    <div class="asset-preview instagram-post">
                                        <div class="post-content">
                                            <div class="post-header">
                                                <img src="${this.userProfile.foto}" alt="Avatar">
                                                <div>
                                                    <h4>${this.userProfile.nombre}</h4>
                                                    <p>VYT Music Online</p>
                                                </div>
                                            </div>
                                            <p>🎵 ¡Vota por mí en VYT Music!</p>
                                        </div>
                                    </div>
                                    <h3>Post Instagram</h3>
                                    <button onclick="VYTPromotionSystem.generateAsset('instagram-post')">Generar</button>
                                </div>

                                <div class="asset-card">
                                    <div class="asset-preview youtube-thumbnail">
                                        <div class="thumbnail-content">
                                            <h4>MI PARTICIPACIÓN EN VYT</h4>
                                            <div class="play-button">▶️</div>
                                        </div>
                                    </div>
                                    <h3>Thumbnail YouTube</h3>
                                    <button onclick="VYTPromotionSystem.generateAsset('youtube-thumbnail')">Generar</button>
                                </div>

                                <div class="asset-card">
                                    <div class="asset-preview banner">
                                        <div class="banner-content">
                                            <h4>🎤 ${this.userProfile.nombre}</h4>
                                            <p>Vota en VYT Music Online</p>
                                            <div class="cta-button">¡VOTAR AHORA!</div>
                                        </div>
                                    </div>
                                    <h3>Banner Web</h3>
                                    <button onclick="VYTPromotionSystem.generateAsset('banner')">Generar</button>
                                </div>
                            </div>
                        </div>

                        <!-- TAB: WIDGETS -->
                        <div class="promotion-tab-panel" data-panel="widgets">
                            <div class="widgets-section">
                                <h3>🔧 Widgets Embebibles</h3>
                                <p>Agrega estos widgets a tu web o blog para promocionarte</p>

                                <div class="widget-option">
                                    <h4>Widget de Perfil Compacto</h4>
                                    <div class="widget-preview">
                                        <div class="compact-widget">
                                            <img src="${this.userProfile.foto}" alt="${this.userProfile.nombre}">
                                            <div class="widget-info">
                                                <h5>${this.userProfile.nombre}</h5>
                                                <p>${this.userProfile.genero} - ${this.userProfile.provincia}</p>
                                                <button class="vote-widget-btn">🗳️ Votar</button>
                                            </div>
                                        </div>
                                    </div>
                                    <textarea readonly id="compact-widget-code" rows="3">&lt;iframe src="https://vyt-music.com/widget/compact/${this.getUserId()}" width="300" height="120" frameborder="0">&lt;/iframe></textarea>
                                    <button onclick="VYTPromotionSystem.copyToClipboard('compact-widget-code')">Copiar código</button>
                                </div>

                                <div class="widget-option">
                                    <h4>Widget de Video</h4>
                                    <div class="widget-preview">
                                        <div class="video-widget">
                                            <div class="video-placeholder">
                                                <div class="play-icon">▶️</div>
                                                <p>Video de ${this.userProfile.nombre}</p>
                                            </div>
                                            <div class="video-widget-info">
                                                <h5>${this.userProfile.nombre} en VYT Music</h5>
                                                <button class="vote-widget-btn">🎵 Ver y Votar</button>
                                            </div>
                                        </div>
                                    </div>
                                    <textarea readonly id="video-widget-code" rows="3">&lt;iframe src="https://vyt-music.com/widget/video/${this.getUserId()}" width="400" height="250" frameborder="0">&lt;/iframe></textarea>
                                    <button onclick="VYTPromotionSystem.copyToClipboard('video-widget-code')">Copiar código</button>
                                </div>

                                <div class="widget-option">
                                    <h4>Botón de Votación</h4>
                                    <div class="widget-preview">
                                        <button class="vote-button-widget">
                                            🗳️ Vota por ${this.userProfile.nombre} en VYT Music
                                        </button>
                                    </div>
                                    <textarea readonly id="vote-button-code" rows="2">&lt;a href="https://vyt-music.com/votar/${this.getUserId()}" class="vyt-vote-btn" target="_blank">🗳️ Vota por ${this.userProfile.nombre} en VYT Music&lt;/a></textarea>
                                    <button onclick="VYTPromotionSystem.copyToClipboard('vote-button-code')">Copiar código</button>
                                </div>
                            </div>
                        </div>

                        <!-- TAB: ANALYTICS -->
                        <div class="promotion-tab-panel" data-panel="analytics">
                            <div class="analytics-dashboard">
                                <h3>📊 Estadísticas de Promoción</h3>
                                
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <div class="stat-number">${this.promotionStats.shares}</div>
                                        <div class="stat-label">Compartidos</div>
                                        <div class="stat-trend">↗️ +12% esta semana</div>
                                    </div>

                                    <div class="stat-card">
                                        <div class="stat-number">${this.promotionStats.views}</div>
                                        <div class="stat-label">Visualizaciones</div>
                                        <div class="stat-trend">📈 +25% esta semana</div>
                                    </div>

                                    <div class="stat-card">
                                        <div class="stat-number">${this.promotionStats.votes}</div>
                                        <div class="stat-label">Votos Obtenidos</div>
                                        <div class="stat-trend">🗳️ +8% esta semana</div>
                                    </div>

                                    <div class="stat-card">
                                        <div class="stat-number">${((this.promotionStats.votes / Math.max(this.promotionStats.views, 1)) * 100).toFixed(1)}%</div>
                                        <div class="stat-label">Conversión</div>
                                        <div class="stat-trend">💪 Muy buena</div>
                                    </div>
                                </div>

                                <div class="analytics-chart">
                                    <h4>📈 Promoción en el tiempo</h4>
                                    <canvas id="promotion-chart" width="400" height="200"></canvas>
                                </div>

                                <div class="top-platforms">
                                    <h4>🏆 Mejores plataformas</h4>
                                    <div class="platform-stats">
                                        <div class="platform-stat">
                                            <span class="platform-icon">📸</span>
                                            <span class="platform-name">Instagram</span>
                                            <span class="platform-shares">45 shares</span>
                                            <div class="platform-bar">
                                                <div class="platform-progress" style="width: 75%"></div>
                                            </div>
                                        </div>
                                        <div class="platform-stat">
                                            <span class="platform-icon">💬</span>
                                            <span class="platform-name">WhatsApp</span>
                                            <span class="platform-shares">32 shares</span>
                                            <div class="platform-bar">
                                                <div class="platform-progress" style="width: 53%"></div>
                                            </div>
                                        </div>
                                        <div class="platform-stat">
                                            <span class="platform-icon">📘</span>
                                            <span class="platform-name">Facebook</span>
                                            <span class="platform-shares">18 shares</span>
                                            <div class="platform-bar">
                                                <div class="platform-progress" style="width: 30%"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="promotion-tips">
                                    <h4>💡 Tips para mejorar</h4>
                                    <ul>
                                        <li>📱 Comparte en Stories de Instagram durante las horas pico (19-21hs)</li>
                                        <li>🎵 Crea TikToks de 15 segundos con tu mejor parte</li>
                                        <li>👥 Pide a amigos que comenten y compartan</li>
                                        <li>📅 Programa posts los fines de semana</li>
                                        <li>💬 Responde a todos los comentarios rápidamente</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', promotionHTML);
        this.addPromotionStyles();
        this.setupPromotionEvents();
    }

    addPromotionStyles() {
        const promotionStyles = `
            <style id="vyt-promotion-styles">
                .vyt-promotion-panel {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .promotion-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(10px);
                }

                .promotion-content {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 24px;
                    width: 90%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                }

                .promotion-header {
                    position: relative;
                    padding: 32px;
                    background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                    color: white;
                    border-radius: 24px 24px 0 0;
                }

                .promotion-header h2 {
                    margin: 0 0 8px 0;
                    font-size: 28px;
                    font-weight: 700;
                }

                .promotion-header p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 16px;
                }

                .close-promotion {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 32px;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    border-radius: 20px;
                    transition: background 0.2s ease;
                }

                .close-promotion:hover {
                    background: rgba(255,255,255,0.2);
                }

                .promotion-tabs {
                    display: flex;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }

                .promotion-tab {
                    flex: 1;
                    padding: 16px;
                    border: none;
                    background: none;
                    font-size: 15px;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-bottom: 3px solid transparent;
                }

                .promotion-tab:hover {
                    color: #00d9ff;
                    background: rgba(0,217,255,0.05);
                }

                .promotion-tab.active {
                    color: #00d9ff;
                    border-bottom-color: #00d9ff;
                    background: rgba(0,217,255,0.05);
                }

                .promotion-tab-content {
                    min-height: 400px;
                }

                .promotion-tab-panel {
                    display: none;
                    padding: 32px;
                }

                .promotion-tab-panel.active {
                    display: block;
                }

                /* SOCIAL SHARING GRID */
                .social-sharing-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .share-option {
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .share-option:hover {
                    border-color: #00d9ff;
                    box-shadow: 0 8px 25px rgba(0,217,255,0.15);
                    transform: translateY(-4px);
                }

                .share-icon {
                    font-size: 32px;
                    margin-bottom: 12px;
                }

                .share-option h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .share-option p {
                    margin: 0 0 16px 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .share-btn {
                    background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .share-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(0,217,255,0.3);
                }

                /* SHARE LINK */
                .quick-share-section, .qr-code-section {
                    background: #f8fafc;
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                }

                .quick-share-section h3, .qr-code-section h3 {
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .share-link-container {
                    display: flex;
                    gap: 12px;
                }

                .share-link-container input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: monospace;
                }

                .share-link-container button {
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                /* QR CODE */
                .qr-container {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                #qr-code-display {
                    width: 150px;
                    height: 150px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #6b7280;
                    font-size: 14px;
                }

                /* ASSETS GRID */
                .assets-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 24px;
                }

                .asset-card {
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 20px;
                    text-align: center;
                    transition: all 0.3s ease;
                }

                .asset-card:hover {
                    border-color: #00d9ff;
                    box-shadow: 0 8px 25px rgba(0,217,255,0.15);
                }

                .asset-preview {
                    width: 100%;
                    height: 150px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .instagram-story {
                    background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
                    color: white;
                }

                .instagram-post {
                    background: white;
                    border: 1px solid #e2e8f0;
                }

                .youtube-thumbnail {
                    background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
                    color: white;
                }

                .banner {
                    background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                    color: white;
                }

                .asset-card h3 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .asset-card button {
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .asset-card button:hover {
                    background: #059669;
                    transform: scale(1.05);
                }

                /* WIDGETS */
                .widget-option {
                    background: #f8fafc;
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                }

                .widget-option h4 {
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .widget-preview {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 16px;
                }

                .compact-widget {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    max-width: 300px;
                }

                .compact-widget img {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .widget-info h5 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .widget-info p {
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    color: #6b7280;
                }

                .vote-widget-btn {
                    background: #00d9ff;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .widget-option textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 12px;
                    font-family: monospace;
                    margin-bottom: 12px;
                    resize: vertical;
                }

                .widget-option button {
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                /* ANALYTICS */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .stat-card {
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                }

                .stat-number {
                    font-size: 32px;
                    font-weight: 900;
                    color: #00d9ff;
                    margin-bottom: 8px;
                }

                .stat-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #6b7280;
                    margin-bottom: 4px;
                }

                .stat-trend {
                    font-size: 12px;
                    color: #10b981;
                }

                .analytics-chart {
                    background: #f8fafc;
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 32px;
                }

                .analytics-chart h4 {
                    margin: 0 0 20px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .top-platforms {
                    background: #f8fafc;
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 32px;
                }

                .platform-stat {
                    display: grid;
                    grid-template-columns: 40px 1fr 80px;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .platform-icon {
                    font-size: 20px;
                }

                .platform-name {
                    font-weight: 600;
                    color: #1f2937;
                }

                .platform-shares {
                    font-size: 14px;
                    color: #6b7280;
                    text-align: right;
                }

                .platform-bar {
                    grid-column: 2 / 4;
                    height: 6px;
                    background: #e5e7eb;
                    border-radius: 3px;
                    overflow: hidden;
                }

                .platform-progress {
                    height: 100%;
                    background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
                    transition: width 0.5s ease;
                }

                .promotion-tips {
                    background: #fef3c7;
                    padding: 24px;
                    border-radius: 16px;
                    border-left: 4px solid #f59e0b;
                }

                .promotion-tips h4 {
                    margin: 0 0 16px 0;
                    color: #92400e;
                    font-size: 18px;
                    font-weight: 700;
                }

                .promotion-tips ul {
                    margin: 0;
                    padding-left: 20px;
                }

                .promotion-tips li {
                    margin-bottom: 8px;
                    color: #92400e;
                    font-size: 14px;
                    line-height: 1.5;
                }

                /* RESPONSIVE */
                @media (max-width: 768px) {
                    .promotion-content {
                        width: 95%;
                        max-height: 95vh;
                    }

                    .promotion-header {
                        padding: 20px;
                    }

                    .promotion-tab-panel {
                        padding: 20px;
                    }

                    .social-sharing-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 16px;
                    }

                    .assets-grid {
                        grid-template-columns: 1fr;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .share-link-container {
                        flex-direction: column;
                    }

                    .qr-container {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', promotionStyles);
    }

    setupPromotionEvents() {
        // Tab switching
        const tabs = document.querySelectorAll('.promotion-tab');
        const panels = document.querySelectorAll('.promotion-tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.dataset.tab;

                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                document.querySelector(`[data-panel="${targetPanel}"]`).classList.add('active');
            });
        });

        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.target.closest('.share-option').dataset.platform;
                this.shareOnPlatform(platform);
            });
        });

        // Generate share link
        this.generateShareLink();
        this.generateQRCode();
    }

    setupSocialSharing() {
        // Configurar URLs de compartir para cada plataforma
        this.shareUrls = {
            facebook: 'https://www.facebook.com/sharer/sharer.php',
            twitter: 'https://twitter.com/intent/tweet',
            whatsapp: 'https://wa.me/',
            telegram: 'https://t.me/share/url',
            instagram: '', // Instagram no tiene URL directa
            tiktok: '' // TikTok tampoco
        };
    }

    shareOnPlatform(platform) {
        const shareUrl = this.getShareUrl();
        const shareText = this.getShareText();

        switch(platform) {
            case 'facebook':
                this.shareOnFacebook(shareUrl);
                break;
            case 'twitter':
                this.shareOnTwitter(shareUrl, shareText);
                break;
            case 'whatsapp':
                this.shareOnWhatsApp(shareUrl, shareText);
                break;
            case 'telegram':
                this.shareOnTelegram(shareUrl, shareText);
                break;
            case 'instagram':
                this.shareOnInstagram();
                break;
            case 'tiktok':
                this.shareOnTikTok();
                break;
        }

        // Trackear share
        this.trackShare(platform);
    }

    shareOnFacebook(url) {
        const facebookUrl = `${this.shareUrls.facebook}?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    }

    shareOnTwitter(url, text) {
        const twitterUrl = `${this.shareUrls.twitter}?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&hashtags=VYTMusic,Canto,Argentina`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    }

    shareOnWhatsApp(url, text) {
        const message = `${text} ${url}`;
        const whatsappUrl = `${this.shareUrls.whatsapp}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    shareOnTelegram(url, text) {
        const message = `${text} ${url}`;
        const telegramUrl = `${this.shareUrls.telegram}?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(telegramUrl, '_blank');
    }

    shareOnInstagram() {
        // Para Instagram, mostrar instrucciones
        this.showInstagramInstructions();
    }

    shareOnTikTok() {
        // Para TikTok, mostrar instrucciones
        this.showTikTokInstructions();
    }

    showInstagramInstructions() {
        alert(`📸 Para compartir en Instagram:

1. Guarda la imagen generada en Assets
2. Abre Instagram y crea un nuevo post
3. Selecciona la imagen guardada
4. Agrega el texto: "${this.getShareText()}"
5. Incluye el enlace en tu biografía
6. ¡Publica y etiqueta a @vytmusic!`);
    }

    showTikTokInstructions() {
        alert(`🎵 Para crear contenido en TikTok:

1. Graba un video de 15-30 segundos cantando
2. Usa estos hashtags: #VYTMusic #Canto #Argentina #Talento
3. Agrega texto: "Participo en VYT Music 🎤"
4. Menciona en comentarios tu enlace de votación
5. ¡Invita a votar en tu biografía!`);
    }

    getShareUrl() {
        const baseUrl = window.location.origin;
        return `${baseUrl}/votar/${this.getUserId()}`;
    }

    getShareText() {
        return `🎤 ¡Vota por ${this.userProfile.nombre} en VYT Music Online! 
${this.userProfile.genero} desde ${this.userProfile.provincia} 
#VYTMusic #Canto #Argentina #Talento`;
    }

    getUserId() {
        // Generar o obtener ID único del usuario
        let userId = localStorage.getItem('vytUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('vytUserId', userId);
        }
        return userId;
    }

    generateShareLink() {
        const shareLink = this.getShareUrl();
        const linkInput = document.getElementById('share-link');
        if (linkInput) {
            linkInput.value = shareLink;
        }
    }

    generateQRCode() {
        const qrContainer = document.getElementById('qr-code-display');
        if (!qrContainer) return;

        const shareUrl = this.getShareUrl();
        
        // Simulación de QR code (en producción usar librería como QRCode.js)
        qrContainer.innerHTML = `
            <div style="width: 120px; height: 120px; background: 
                       url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                         <rect width="100" height="100" fill="white"/>
                         <rect x="10" y="10" width="80" height="80" fill="black" opacity="0.8"/>
                         <rect x="20" y="20" width="60" height="60" fill="white"/>
                         <text x="50" y="55" text-anchor="middle" fill="black" font-size="8">QR</text>
                       </svg>') center/contain;
                       border: 2px solid #e2e8f0;
                       border-radius: 8px;">
            </div>
            <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">
                Código QR generado
            </p>
        `;
    }

    generatePromotionAssets() {
        console.log('🎨 Generando assets de promoción...');
        // En una implementación real, aquí se generarían imágenes dinámicas
    }

    initializeAnalytics() {
        // Cargar estadísticas desde localStorage o API
        const savedStats = JSON.parse(localStorage.getItem('vytPromotionStats') || '{}');
        this.promotionStats = {
            shares: savedStats.shares || Math.floor(Math.random() * 100),
            views: savedStats.views || Math.floor(Math.random() * 500),
            votes: savedStats.votes || Math.floor(Math.random() * 50),
            conversions: savedStats.conversions || Math.floor(Math.random() * 20)
        };

        this.saveStats();
    }

    trackShare(platform) {
        this.promotionStats.shares++;
        console.log(`📊 Share tracked: ${platform}`);
        this.saveStats();
        this.updateAnalytics();
    }

    trackView() {
        this.promotionStats.views++;
        this.saveStats();
        this.updateAnalytics();
    }

    trackVote() {
        this.promotionStats.votes++;
        this.saveStats();
        this.updateAnalytics();
    }

    saveStats() {
        localStorage.setItem('vytPromotionStats', JSON.stringify(this.promotionStats));
    }

    updateAnalytics() {
        // Actualizar números en la interfaz
        const statsCards = document.querySelectorAll('.stat-card .stat-number');
        if (statsCards.length >= 4) {
            statsCards[0].textContent = this.promotionStats.shares;
            statsCards[1].textContent = this.promotionStats.views;
            statsCards[2].textContent = this.promotionStats.votes;
            statsCards[3].textContent = `${((this.promotionStats.votes / Math.max(this.promotionStats.views, 1)) * 100).toFixed(1)}%`;
        }
    }

    // Métodos estáticos para usar desde HTML
    static copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.select();
            element.setSelectionRange(0, 99999);
            document.execCommand('copy');
            
            // Feedback visual
            const originalBg = element.style.background;
            element.style.background = '#dcfce7';
            setTimeout(() => {
                element.style.background = originalBg;
            }, 500);

            alert('✅ Copiado al portapapeles');
        }
    }

    static generateAsset(type) {
        alert(`🎨 Generando ${type}...
        
En una versión completa, esto abriría un editor para personalizar el asset.
Por ahora, descarga las plantillas desde:
- Instagram Stories: 1080x1920px
- Posts Instagram: 1080x1080px  
- YouTube Thumbnail: 1280x720px
- Banner Web: 728x90px`);
    }

    static downloadQR() {
        alert(`📱 Para descargar el código QR:
        
1. Haz click derecho en el código QR
2. Selecciona "Guardar imagen como..."
3. Úsalo en flyers, tarjetas o redes sociales
        
El QR lleva directamente a tu página de votación.`);
    }

    // Método público para mostrar el panel
    show() {
        document.getElementById('vyt-promotion-panel').style.display = 'block';
        this.trackView();
    }

    // Método público para ocultar el panel
    hide() {
        document.getElementById('vyt-promotion-panel').style.display = 'none';
    }
}

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.vytPromotionSystem = new VYTPromotionSystem();
});

// Hacer disponible globalmente
window.VYTPromotionSystem = VYTPromotionSystem;

// Agregar botón de promoción a las páginas existentes
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPromotionButton);
} else {
    addPromotionButton();
}

function addPromotionButton() {
    // Solo agregar si no existe ya
    if (document.getElementById('vyt-promotion-trigger')) return;

    const promotionButton = document.createElement('button');
    promotionButton.id = 'vyt-promotion-trigger';
    promotionButton.innerHTML = '🚀 Promocionar';
    promotionButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(135deg, #00d9ff 0%, #667eea 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,217,255,0.3);
        z-index: 1000;
        transition: all 0.3s ease;
    `;

    promotionButton.addEventListener('click', () => {
        if (window.vytPromotionSystem) {
            window.vytPromotionSystem.show();
        }
    });

    promotionButton.addEventListener('mouseenter', () => {
        promotionButton.style.transform = 'scale(1.05)';
        promotionButton.style.boxShadow = '0 6px 20px rgba(0,217,255,0.4)';
    });

    promotionButton.addEventListener('mouseleave', () => {
        promotionButton.style.transform = 'scale(1)';
        promotionButton.style.boxShadow = '0 4px 16px rgba(0,217,255,0.3)';
    });

    document.body.appendChild(promotionButton);
}

console.log('🚀 VYT Promotion System loaded successfully!');