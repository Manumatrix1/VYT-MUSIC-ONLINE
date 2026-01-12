/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎭 PANEL DE JURADO - VYT-MUSIC
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Gestión de evaluación técnica de jurado para artistas clasificados.
 * 
 * Características:
 * - Filtro por zona (Norte, Sur, Oeste)
 * - Solo muestra top 30 clasificados de cada zona
 * - Formulario de evaluación (puntaje 1-10 + comentario)
 * - Feedback constructivo guardado en Firestore
 * - Notificación al artista cuando es evaluado
 * 
 * @author GitHub Copilot
 * @version 1.0.0
 * @date 12 de Enero 2026
 */

class JuradoPanel {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentZona = 'todas';
        this.clasificados = [];
        
        // Categorías de evaluación
        this.categorias = [
            { id: 'vocal', nombre: 'Técnica Vocal', icon: '🎤' },
            { id: 'interpretacion', nombre: 'Interpretación', icon: '🎭' },
            { id: 'presencia', nombre: 'Presencia Escénica', icon: '⭐' },
            { id: 'originalidad', nombre: 'Originalidad', icon: '💡' }
        ];
        
        console.log('🎭 JuradoPanel inicializado');
    }
    
    /**
     * Inicializa Firebase y carga clasificados
     */
    async init(firebaseDb, firebaseAuth) {
        this.db = firebaseDb;
        this.auth = firebaseAuth;
        
        await this.loadClasificados();
        this.setupEventListeners();
    }
    
    /**
     * Carga artistas clasificados (top 30 por zona)
     */
    async loadClasificados(zona = 'todas') {
        try {
            console.log(`📊 Cargando clasificados de zona: ${zona}`);
            
            let query = this.db.collection('participaciones')
                .where('estado', '==', 'activo')
                .where('clasificado', '==', true);
            
            // Filtro por zona si no es "todas"
            if (zona !== 'todas') {
                query = query.where('zona', '==', zona);
            }
            
            // Ordenar por posición
            query = query.orderBy('posicion_zona', 'asc').limit(30);
            
            const snapshot = await query.get();
            
            this.clasificados = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`✅ Cargados ${this.clasificados.length} clasificados`);
            
            this.renderClasificados();
            
        } catch (error) {
            console.error('❌ Error cargando clasificados:', error);
            this.showToast('Error al cargar clasificados', 'error');
        }
    }
    
    /**
     * Renderiza la lista de clasificados
     */
    renderClasificados() {
        const container = document.getElementById('clasificados-container');
        if (!container) return;
        
        if (this.clasificados.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <h3>No hay clasificados en esta zona</h3>
                    <p>Los clasificados aparecerán aquí cuando se publiquen los resultados</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.clasificados.map(artista => this.createClasificadoCard(artista)).join('');
    }
    
    /**
     * Crea card de artista clasificado
     */
    createClasificadoCard(artista) {
        const hasFeedback = artista.feedback_jurado && artista.feedback_jurado.puntaje;
        const puntaje = hasFeedback ? artista.feedback_jurado.puntaje : 0;
        const comentario = hasFeedback ? artista.feedback_jurado.comentario : '';
        
        return `
            <div class="clasificado-card" data-id="${artista.id}">
                <div class="card-header">
                    <div class="posicion-badge">#${artista.posicion_zona || '?'}</div>
                    <div class="zona-badge zona-${artista.zona || 'sur'}">
                        📍 Zona ${this.capitalizeZona(artista.zona)}
                    </div>
                </div>
                
                <div class="card-content">
                    <div class="video-thumbnail">
                        <img src="${this.getThumbnail(artista.videoUrl)}" 
                             alt="${artista.nombreArtista}"
                             onerror="this.src='/assets/placeholder-video.jpg'">
                        <div class="play-overlay">
                            <a href="${artista.videoUrl}" target="_blank" class="play-btn">
                                ▶
                            </a>
                        </div>
                    </div>
                    
                    <div class="artista-info">
                        <h3 class="artista-nombre">${artista.nombreArtista}</h3>
                        <p class="cancion-titulo">"${artista.tituloCancion || artista.titulo || 'Sin título'}"</p>
                        
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-icon">💎</span>
                                <span class="stat-value">${artista.votos || 0}</span>
                                <span class="stat-label">Votos</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">💰</span>
                                <span class="stat-value">$${(artista.vyt_money_recibido || 0).toLocaleString('es-AR')}</span>
                                <span class="stat-label">VYT Money</span>
                            </div>
                            ${hasFeedback ? `
                                <div class="stat-item">
                                    <span class="stat-icon">⭐</span>
                                    <span class="stat-value">${puntaje.toFixed(1)}/10</span>
                                    <span class="stat-label">Tu Evaluación</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="evaluation-form" id="form-${artista.id}">
                    <h4>📝 Evaluación del Jurado</h4>
                    
                    <div class="form-group">
                        <label for="puntaje-${artista.id}">Puntaje General (1-10):</label>
                        <div class="score-input">
                            <input type="number" 
                                   id="puntaje-${artista.id}" 
                                   class="score-input-field"
                                   min="1" 
                                   max="10" 
                                   step="0.1" 
                                   value="${puntaje || 5}"
                                   placeholder="7.5">
                            <span class="score-display">/10</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="categoria-${artista.id}">Categoría Principal:</label>
                        <select id="categoria-${artista.id}" class="categoria-select">
                            ${this.categorias.map(cat => `
                                <option value="${cat.id}" ${hasFeedback && artista.feedback_jurado.categoria === cat.id ? 'selected' : ''}>
                                    ${cat.icon} ${cat.nombre}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="comentario-${artista.id}">Comentario Técnico:</label>
                        <textarea id="comentario-${artista.id}" 
                                  class="comentario-textarea"
                                  maxlength="500" 
                                  rows="4"
                                  placeholder="Ej: Buena técnica vocal. Mejorar afinación en el puente. Presencia escénica correcta.">${comentario}</textarea>
                        <div class="char-counter">
                            <span id="counter-${artista.id}">0</span>/500 caracteres
                        </div>
                    </div>
                    
                    ${hasFeedback ? `
                        <div class="feedback-metadata">
                            <small>
                                Evaluado el ${this.formatDate(artista.feedback_jurado.fecha)}
                                por ${artista.feedback_jurado.evaluadoPor || 'Jurado'}
                            </small>
                        </div>
                    ` : ''}
                    
                    <div class="form-actions">
                        <button class="btn-save" 
                                onclick="juradoPanelInstance.saveFeedback('${artista.id}')">
                            💾 ${hasFeedback ? 'Actualizar' : 'Guardar'} Evaluación
                        </button>
                        ${hasFeedback ? `
                            <button class="btn-view" 
                                    onclick="juradoPanelInstance.viewFeedbackHistory('${artista.id}')">
                                📊 Ver Historial
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Guarda feedback del jurado en Firestore
     */
    async saveFeedback(artistaId) {
        try {
            const puntaje = parseFloat(document.getElementById(`puntaje-${artistaId}`).value);
            const comentario = document.getElementById(`comentario-${artistaId}`).value.trim();
            const categoria = document.getElementById(`categoria-${artistaId}`).value;
            
            // Validaciones
            if (!puntaje || puntaje < 1 || puntaje > 10) {
                this.showToast('El puntaje debe estar entre 1 y 10', 'warning');
                return;
            }
            
            if (!comentario || comentario.length < 10) {
                this.showToast('El comentario debe tener al menos 10 caracteres', 'warning');
                return;
            }
            
            // Obtener usuario actual
            const currentUser = this.auth.currentUser;
            if (!currentUser) {
                this.showToast('Debes estar autenticado', 'error');
                return;
            }
            
            this.showLoading('Guardando evaluación...');
            
            // Preparar datos de feedback
            const feedback = {
                puntaje: puntaje,
                comentario: comentario,
                categoria: categoria,
                evaluadoPor: currentUser.email,
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Guardar en Firestore
            await this.db.collection('participaciones').doc(artistaId).update({
                feedback_jurado: feedback,
                ultima_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Feedback guardado:', artistaId);
            
            this.hideLoading();
            this.showToast('✅ Evaluación guardada exitosamente', 'success', 3000);
            
            // Enviar notificación al artista (opcional)
            await this.notifyArtist(artistaId, puntaje, comentario);
            
            // Recargar datos
            await this.loadClasificados(this.currentZona);
            
        } catch (error) {
            console.error('❌ Error guardando feedback:', error);
            this.hideLoading();
            this.showToast('Error al guardar evaluación: ' + error.message, 'error');
        }
    }
    
    /**
     * Notifica al artista que fue evaluado
     */
    async notifyArtist(artistaId, puntaje, comentario) {
        try {
            // Obtener datos del artista
            const artistaDoc = await this.db.collection('participaciones').doc(artistaId).get();
            const artistaData = artistaDoc.data();
            
            // Crear notificación en Firestore
            await this.db.collection('notificaciones').add({
                userId: artistaData.uid,
                tipo: 'feedback_jurado',
                titulo: '🎭 Evaluación del Jurado',
                mensaje: `Has sido evaluado con ${puntaje}/10. Revisa tu panel para ver el comentario completo.`,
                leida: false,
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                metadata: {
                    participacionId: artistaId,
                    puntaje: puntaje
                }
            });
            
            console.log('📧 Notificación enviada al artista');
            
        } catch (error) {
            console.warn('⚠️ Error enviando notificación:', error);
            // No fallar si la notificación falla
        }
    }
    
    /**
     * Ver historial de feedback de un artista
     */
    async viewFeedbackHistory(artistaId) {
        // TODO: Implementar modal con historial de evaluaciones
        console.log('📊 Ver historial de:', artistaId);
        this.showToast('Funcionalidad de historial próximamente', 'info');
    }
    
    /**
     * Obtiene thumbnail de YouTube
     */
    getThumbnail(videoUrl) {
        if (!videoUrl) return '/assets/placeholder-video.jpg';
        
        // Extraer ID de YouTube
        const videoId = this.extractYouTubeId(videoUrl);
        if (!videoId) return '/assets/placeholder-video.jpg';
        
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    /**
     * Extrae ID de video de YouTube
     */
    extractYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }
    
    /**
     * Capitaliza nombre de zona
     */
    capitalizeZona(zona) {
        if (!zona) return 'Sur';
        return zona.charAt(0).toUpperCase() + zona.slice(1);
    }
    
    /**
     * Formatea fecha
     */
    formatDate(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filtro por zona
        const zonaButtons = document.querySelectorAll('.zona-filter-btn');
        zonaButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const zona = e.target.dataset.zona;
                this.filterByZona(zona);
            });
        });
        
        // Contador de caracteres en textareas
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('comentario-textarea')) {
                const id = e.target.id.replace('comentario-', '');
                const counter = document.getElementById(`counter-${id}`);
                if (counter) {
                    counter.textContent = e.target.value.length;
                }
            }
        });
        
        // Validación de puntaje
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('score-input-field')) {
                let value = parseFloat(e.target.value);
                if (value < 1) e.target.value = 1;
                if (value > 10) e.target.value = 10;
            }
        });
    }
    
    /**
     * Filtrar por zona
     */
    async filterByZona(zona) {
        this.currentZona = zona;
        
        // Actualizar botones activos
        document.querySelectorAll('.zona-filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.zona === zona) {
                btn.classList.add('active');
            }
        });
        
        // Recargar datos
        await this.loadClasificados(zona);
    }
    
    /**
     * Mostrar loading
     */
    showLoading(message = 'Cargando...') {
        const loadingEl = document.getElementById('loading-overlay');
        if (loadingEl) {
            loadingEl.querySelector('.loading-text').textContent = message;
            loadingEl.style.display = 'flex';
        }
    }
    
    /**
     * Ocultar loading
     */
    hideLoading() {
        const loadingEl = document.getElementById('loading-overlay');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
    
    /**
     * Mostrar toast
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JuradoPanel };
} else {
    window.JuradoPanel = JuradoPanel;
}

// Instancia global
let juradoPanelInstance = null;

// Auto-inicialización cuando Firebase esté listo
window.addEventListener('firebaseReady', () => {
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth) {
        juradoPanelInstance = new JuradoPanel();
        juradoPanelInstance.init(firebase.firestore(), firebase.auth());
        
        // Exponer globalmente
        window.juradoPanelInstance = juradoPanelInstance;
    }
});

console.log('🎭 Módulo JuradoPanel cargado');
