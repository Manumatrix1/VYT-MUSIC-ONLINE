/**
 * Sistema de Integración con Redes Sociales - VYT Music Online
 * Facilita el compartir participaciones, resultados y promoción
 */

class SocialIntegrationSystem {
    constructor() {
        this.socialButtons = [];
        this.shareData = {};
        this.init();
    }

    init() {
        this.injectCSS();
        this.createSocialButtons();
        this.setupEventListeners();
        this.detectShareableContent();
        console.log('📱 Sistema de Redes Sociales iniciado');
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Social Integration System Styles */
            .social-share-widget {
                background: white;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                margin: 20px 0;
                border: 2px solid #f1f5f9;
                transition: all 0.3s ease;
            }

            .social-share-widget:hover {
                border-color: #667eea;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }

            .social-share-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 15px;
                color: #1e293b;
            }

            .social-share-icon {
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

            .social-share-title {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }

            .social-share-buttons {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            .social-btn {
                border: none;
                border-radius: 12px;
                padding: 12px 16px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
                min-width: 120px;
                justify-content: center;
                position: relative;
                overflow: hidden;
            }

            .social-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                transition: left 0.5s ease;
            }

            .social-btn:hover::before {
                left: 100%;
            }

            .social-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            .social-btn-facebook {
                background: #1877f2;
                color: white;
            }

            .social-btn-instagram {
                background: linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d);
                color: white;
            }

            .social-btn-tiktok {
                background: #000000;
                color: white;
            }

            .social-btn-whatsapp {
                background: #25d366;
                color: white;
            }

            .social-btn-twitter {
                background: #1da1f2;
                color: white;
            }

            .social-btn-telegram {
                background: #0088cc;
                color: white;
            }

            .social-btn-copy {
                background: #6b7280;
                color: white;
            }

            .social-btn-copy.copied {
                background: #10b981;
            }

            /* Floating Share Button */
            .social-floating-btn {
                position: fixed;
                bottom: 140px;
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                z-index: 1000;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .social-floating-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
            }

            .social-floating-menu {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: white;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 1001;
                opacity: 0;
                visibility: hidden;
                transform: scale(0.8) translateY(20px);
                transition: all 0.3s ease;
                min-width: 250px;
            }

            .social-floating-menu.show {
                opacity: 1;
                visibility: visible;
                transform: scale(1) translateY(0);
            }

            .social-floating-menu::before {
                content: '';
                position: absolute;
                bottom: -10px;
                right: 30px;
                width: 0;
                height: 0;
                border: 10px solid transparent;
                border-top-color: white;
            }

            .social-floating-title {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 15px 0;
                text-align: center;
            }

            .social-floating-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }

            .social-floating-buttons .social-btn {
                min-width: auto;
                padding: 10px;
                font-size: 12px;
            }

            /* Share Modal */
            .social-share-modal {
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
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .social-share-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .social-share-modal-content {
                background: white;
                border-radius: 20px;
                max-width: 500px;
                width: 100%;
                padding: 30px;
                position: relative;
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s ease;
                text-align: center;
            }

            .social-share-modal.show .social-share-modal-content {
                transform: scale(1) translateY(0);
            }

            .social-share-modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                color: #64748b;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                transition: all 0.2s ease;
            }

            .social-share-modal-close:hover {
                background: #f1f5f9;
                color: #1e293b;
            }

            .social-share-preview {
                background: #f8fafc;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                text-align: left;
            }

            .social-share-preview-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 8px 0;
            }

            .social-share-preview-description {
                color: #64748b;
                margin: 0 0 12px 0;
                line-height: 1.5;
            }

            .social-share-preview-url {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 14px;
                color: #667eea;
                font-family: monospace;
                margin: 8px 0;
            }

            .social-share-custom-message {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                resize: vertical;
                font-size: 14px;
                margin: 15px 0;
                min-height: 80px;
                box-sizing: border-box;
            }

            .social-share-custom-message:focus {
                border-color: #667eea;
                outline: none;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            /* Share Success Animation */
            .social-success-animation {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #10b981;
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                z-index: 10001;
                opacity: 0;
                animation: shareSuccess 2s ease-out forwards;
            }

            @keyframes shareSuccess {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                20% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.1);
                }
                80% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
            }

            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .social-share-widget {
                    margin: 15px 0;
                    padding: 15px;
                }

                .social-share-buttons {
                    grid-template-columns: repeat(2, 1fr);
                    display: grid;
                }

                .social-btn {
                    min-width: auto;
                    padding: 10px 12px;
                    font-size: 13px;
                }

                .social-floating-btn {
                    bottom: 20px;
                    right: 15px;
                    width: 50px;
                    height: 50px;
                    font-size: 20px;
                }

                .social-floating-menu {
                    bottom: 80px;
                    right: 15px;
                    left: 15px;
                    width: auto;
                    min-width: auto;
                }

                .social-floating-menu::before {
                    right: 40px;
                }

                .social-share-modal-content {
                    margin: 0 10px;
                    padding: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createSocialButtons() {
        // Crear botón flotante principal
        this.createFloatingButton();
        
        // Buscar contenido para agregar widgets
        this.insertShareWidgets();
    }

    createFloatingButton() {
        const floatingBtn = document.createElement('button');
        floatingBtn.className = 'social-floating-btn';
        floatingBtn.innerHTML = '📱';
        floatingBtn.title = 'Compartir en redes sociales';
        
        const floatingMenu = document.createElement('div');
        floatingMenu.className = 'social-floating-menu';
        floatingMenu.innerHTML = `
            <h3 class="social-floating-title">📱 Compartir VYT Music</h3>
            <div class="social-floating-buttons">
                <a class="social-btn social-btn-whatsapp" href="#" data-platform="whatsapp">
                    💬 WhatsApp
                </a>
                <a class="social-btn social-btn-facebook" href="#" data-platform="facebook">
                    👥 Facebook
                </a>
                <a class="social-btn social-btn-instagram" href="#" data-platform="instagram">
                    📸 Instagram
                </a>
                <a class="social-btn social-btn-tiktok" href="#" data-platform="tiktok">
                    🎵 TikTok
                </a>
                <a class="social-btn social-btn-twitter" href="#" data-platform="twitter">
                    🐦 Twitter
                </a>
                <button class="social-btn social-btn-copy" data-action="copy">
                    📋 Copiar Link
                </button>
            </div>
        `;
        
        document.body.appendChild(floatingBtn);
        document.body.appendChild(floatingMenu);
        
        // Event listeners
        floatingBtn.addEventListener('click', () => {
            this.updateShareData();
            floatingMenu.classList.toggle('show');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!floatingBtn.contains(e.target) && !floatingMenu.contains(e.target)) {
                floatingMenu.classList.remove('show');
            }
        });
        
        // Setup share buttons
        this.setupShareButtons(floatingMenu);
    }

    insertShareWidgets() {
        const targets = [
            '.certamen-card',
            '.artist-profile',
            '.ranking-item',
            '.result-card',
            '.participation-card'
        ];

        targets.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => this.addShareWidget(el));
        });

        // Si no hay targets específicos, añadir widget general
        if (document.querySelectorAll('.social-share-widget').length === 0) {
            this.addGeneralShareWidget();
        }
    }

    addShareWidget(container) {
        const widget = document.createElement('div');
        widget.className = 'social-share-widget';
        widget.innerHTML = `
            <div class="social-share-header">
                <div class="social-share-icon">📱</div>
                <h3 class="social-share-title">Compartir en redes sociales</h3>
            </div>
            <div class="social-share-buttons">
                <a class="social-btn social-btn-whatsapp" href="#" data-platform="whatsapp">
                    💬 WhatsApp
                </a>
                <a class="social-btn social-btn-facebook" href="#" data-platform="facebook">
                    👥 Facebook
                </a>
                <a class="social-btn social-btn-instagram" href="#" data-platform="instagram">
                    📸 Instagram
                </a>
                <button class="social-btn social-btn-copy" data-action="copy">
                    📋 Copiar Link
                </button>
            </div>
        `;
        
        container.appendChild(widget);
        this.setupShareButtons(widget);
    }

    addGeneralShareWidget() {
        const mainContent = document.querySelector('main, .main-content, .content, body');
        if (mainContent) {
            const widget = document.createElement('div');
            widget.className = 'social-share-widget';
            widget.style.margin = '30px auto';
            widget.style.maxWidth = '600px';
            
            widget.innerHTML = `
                <div class="social-share-header">
                    <div class="social-share-icon">📱</div>
                    <h3 class="social-share-title">¡Comparte VYT Music con tus amigos!</h3>
                </div>
                <div class="social-share-buttons">
                    <a class="social-btn social-btn-whatsapp" href="#" data-platform="whatsapp">
                        💬 WhatsApp
                    </a>
                    <a class="social-btn social-btn-facebook" href="#" data-platform="facebook">
                        👥 Facebook
                    </a>
                    <a class="social-btn social-btn-instagram" href="#" data-platform="instagram">
                        📸 Instagram
                    </a>
                    <a class="social-btn social-btn-tiktok" href="#" data-platform="tiktok">
                        🎵 TikTok
                    </a>
                    <a class="social-btn social-btn-twitter" href="#" data-platform="twitter">
                        🐦 Twitter
                    </a>
                    <button class="social-btn social-btn-copy" data-action="copy">
                        📋 Copiar Link
                    </button>
                </div>
            `;
            
            mainContent.appendChild(widget);
            this.setupShareButtons(widget);
        }
    }

    setupShareButtons(container) {
        const shareButtons = container.querySelectorAll('[data-platform], [data-action]');
        
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const platform = btn.getAttribute('data-platform');
                const action = btn.getAttribute('data-action');
                
                if (platform) {
                    this.shareOnPlatform(platform, btn);
                } else if (action === 'copy') {
                    this.copyToClipboard(btn);
                }
            });
        });
    }

    updateShareData() {
        // Detectar contenido actual
        this.shareData = {
            url: window.location.href,
            title: this.getPageTitle(),
            description: this.getPageDescription(),
            image: this.getPageImage(),
            hashtags: this.getRelevantHashtags()
        };
    }

    getPageTitle() {
        // Intentar obtener título específico del contenido
        const titleSelectors = [
            'h1',
            '.page-title',
            '.certamen-title',
            '.artist-name',
            'title'
        ];
        
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return `${element.textContent.trim()} | VYT Music Online`;
            }
        }
        
        return 'VYT Music Online - Certámenes Musicales';
    }

    getPageDescription() {
        const descriptionSelectors = [
            'meta[name="description"]',
            '.page-description',
            '.certamen-description',
            'p'
        ];
        
        for (const selector of descriptionSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const content = element.getAttribute ? element.getAttribute('content') : element.textContent;
                if (content && content.trim() && content.length > 20) {
                    return content.trim().substring(0, 160) + '...';
                }
            }
        }
        
        return '🎵 Participa en los certámenes musicales más importantes de Argentina. Premios reales, jurado profesional y oportunidades únicas para artistas.';
    }

    getPageImage() {
        const imageSelectors = [
            'meta[property="og:image"]',
            '.featured-image img',
            '.artist-photo img',
            '.certamen-image img',
            'img'
        ];
        
        for (const selector of imageSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const src = element.getAttribute ? 
                    (element.getAttribute('content') || element.getAttribute('src')) : 
                    element.src;
                
                if (src && !src.includes('data:')) {
                    return new URL(src, window.location.href).href;
                }
            }
        }
        
        return 'https://vytmusic.com/images/vyt-og-image.jpg'; // Imagen por defecto
    }

    getRelevantHashtags() {
        const currentPage = window.location.pathname.toLowerCase();
        let hashtags = ['#VYTMusic', '#CertamenMusical', '#Argentina'];
        
        if (currentPage.includes('certamen')) {
            hashtags.push('#CertamenOnline', '#MúsicaArgentina');
        } else if (currentPage.includes('perfil') || currentPage.includes('artista')) {
            hashtags.push('#ArtistaEmergente', '#Talento');
        } else if (currentPage.includes('ranking') || currentPage.includes('resultado')) {
            hashtags.push('#Resultados', '#Ranking');
        }
        
        return hashtags.join(' ');
    }

    shareOnPlatform(platform, button) {
        this.updateShareData();
        
        const shareUrls = {
            whatsapp: () => {
                const message = `🎵 *${this.shareData.title}*\n\n${this.shareData.description}\n\n${this.shareData.url}\n\n${this.shareData.hashtags}`;
                return `https://wa.me/?text=${encodeURIComponent(message)}`;
            },
            
            facebook: () => {
                return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareData.url)}&quote=${encodeURIComponent(this.shareData.title + ' - ' + this.shareData.description)}`;
            },
            
            twitter: () => {
                const text = `${this.shareData.title}\n\n${this.shareData.description}\n\n${this.shareData.hashtags}`;
                return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.shareData.url)}`;
            },
            
            instagram: () => {
                // Instagram no permite links directos, mostramos instrucciones
                this.showInstagramInstructions();
                return null;
            },
            
            tiktok: () => {
                // TikTok tampoco permite links directos
                this.showTikTokInstructions();
                return null;
            },
            
            telegram: () => {
                const message = `🎵 ${this.shareData.title}\n\n${this.shareData.description}\n\n${this.shareData.url}\n\n${this.shareData.hashtags}`;
                return `https://t.me/share/url?url=${encodeURIComponent(this.shareData.url)}&text=${encodeURIComponent(message)}`;
            }
        };
        
        const shareUrl = shareUrls[platform] ? shareUrls[platform]() : null;
        
        if (shareUrl) {
            // Abrir en nueva ventana
            const width = 600;
            const height = 400;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            
            window.open(
                shareUrl,
                'share',
                `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );
            
            this.showSuccessMessage(`Compartido en ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
        }
    }

    showInstagramInstructions() {
        const modal = document.createElement('div');
        modal.className = 'social-share-modal';
        modal.innerHTML = `
            <div class="social-share-modal-content">
                <button class="social-share-modal-close">&times;</button>
                <h3>📸 Compartir en Instagram</h3>
                <p>Instagram no permite enlaces directos desde navegadores web. Para compartir:</p>
                <ol style="text-align: left; color: #64748b; line-height: 1.6;">
                    <li>Copia el enlace con el botón "Copiar Link"</li>
                    <li>Abre la app de Instagram en tu celular</li>
                    <li>Crea una nueva Story o publicación</li>
                    <li>Pega el enlace en tu biografía o como texto</li>
                    <li>Usa estos hashtags: <code>${this.shareData.hashtags}</code></li>
                </ol>
                <div class="social-share-buttons" style="margin-top: 20px;">
                    <button class="social-btn social-btn-copy" data-action="copy-modal">
                        📋 Copiar Link
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Event listeners
        const closeBtn = modal.querySelector('.social-share-modal-close');
        const copyBtn = modal.querySelector('[data-action="copy-modal"]');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(copyBtn);
            setTimeout(() => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }, 1000);
        });
    }

    showTikTokInstructions() {
        const modal = document.createElement('div');
        modal.className = 'social-share-modal';
        modal.innerHTML = `
            <div class="social-share-modal-content">
                <button class="social-share-modal-close">&times;</button>
                <h3>🎵 Compartir en TikTok</h3>
                <p>Para compartir VYT Music en TikTok:</p>
                <ol style="text-align: left; color: #64748b; line-height: 1.6;">
                    <li>Copia el enlace con el botón "Copiar Link"</li>
                    <li>Abre TikTok en tu celular</li>
                    <li>Crea un video sobre tu participación</li>
                    <li>Pega el enlace en tu biografía</li>
                    <li>Usa estos hashtags: <code>${this.shareData.hashtags}</code></li>
                </ol>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <strong>💡 Idea:</strong> Graba un video cantando y menciona VYT Music para conseguir más seguidores
                </div>
                <div class="social-share-buttons" style="margin-top: 20px;">
                    <button class="social-btn social-btn-copy" data-action="copy-modal">
                        📋 Copiar Link
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Event listeners
        const closeBtn = modal.querySelector('.social-share-modal-close');
        const copyBtn = modal.querySelector('[data-action="copy-modal"]');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(copyBtn);
            setTimeout(() => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }, 1000);
        });
    }

    async copyToClipboard(button) {
        this.updateShareData();
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(this.shareData.url);
            } else {
                // Fallback para navegadores más antiguos
                const textArea = document.createElement('textarea');
                textArea.value = this.shareData.url;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            // Visual feedback
            const originalText = button.textContent;
            button.textContent = '✅ Copiado!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
            
            this.showSuccessMessage('¡Enlace copiado al portapapeles!');
            
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            this.showSuccessMessage('Error al copiar. Intenta seleccionar manualmente.');
        }
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'social-success-animation';
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 2000);
    }

    detectShareableContent() {
        // Detectar automáticamente contenido compartible
        const shareableElements = document.querySelectorAll('.certamen-card, .artist-profile, .ranking-item');
        
        shareableElements.forEach((element, index) => {
            // Añadir botón de compartir discreto
            const quickShareBtn = document.createElement('button');
            quickShareBtn.className = 'social-quick-share';
            quickShareBtn.innerHTML = '📱';
            quickShareBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(102, 126, 234, 0.9);
                color: white;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                z-index: 100;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            if (element.style.position !== 'absolute' && element.style.position !== 'relative') {
                element.style.position = 'relative';
            }
            
            element.appendChild(quickShareBtn);
            
            // Show/hide on hover
            element.addEventListener('mouseenter', () => quickShareBtn.style.opacity = '1');
            element.addEventListener('mouseleave', () => quickShareBtn.style.opacity = '0');
            
            // Click handler
            quickShareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.updateShareData();
                this.shareOnPlatform('whatsapp');
            });
        });
    }

    setupEventListeners() {
        // Escuchar cambios de página para actualizar contenido
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                this.createSocialButtons();
            }, 500);
        });
        
        // Detectar contenido dinámico
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    setTimeout(() => {
                        this.detectShareableContent();
                    }, 100);
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // API pública
    shareCustom(data) {
        this.shareData = { ...this.shareData, ...data };
        return this.shareData;
    }

    static init() {
        return new SocialIntegrationSystem();
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.socialIntegrationSystem = SocialIntegrationSystem.init();
});

// Export
window.SocialIntegrationSystem = SocialIntegrationSystem;