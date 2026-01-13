/**
 * CERTAMENES-LOADER.JS - Carga dinámica de certámenes desde Firestore
 * Con manejo de estados vacíos
 */

class CertamenesLoader {
  constructor() {
    this.certamenes = [];
    this.loading = false;
    this.container = null;
  }

  /**
   * Inicializar carga de certámenes
   */
  async init(containerSelector = '.certamenes-grid') {
    this.container = document.querySelector(containerSelector);
    
    if (!this.container) {
      console.warn('⚠️ Contenedor de certámenes no encontrado');
      return;
    }

    await this.loadCertamenes();
  }

  /**
   * Cargar certámenes desde Firestore
   */
  async loadCertamenes() {
    this.loading = true;
    this.renderLoading();

    try {
      if (typeof firebase === 'undefined' || !firebase.firestore) {
        throw new Error('Firebase Firestore no disponible');
      }

      const db = firebase.firestore();
      
      // Query para certámenes activos
      const snapshot = await db.collection('certamenes_provinciales')
        .where('activo', '==', true)
        .orderBy('fecha_inicio', 'desc')
        .limit(20)
        .get();

      if (snapshot.empty) {
        console.log('📭 No hay certámenes activos');
        this.renderEmpty();
        return;
      }

      this.certamenes = [];
      snapshot.forEach(doc => {
        this.certamenes.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ ${this.certamenes.length} certámenes cargados`);
      this.render();

    } catch (error) {
      console.error('❌ Error cargando certámenes:', error);
      this.renderError(error.message);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Renderizar loading
   */
  renderLoading() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
        <div class="spinner" style="width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #00d9ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <p style="margin-top: 1rem; color: rgba(255,255,255,0.7);">Cargando certámenes...</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  /**
   * Renderizar estado vacío
   */
  renderEmpty() {
    if (!this.container) return;

    // Usar EmptyStateHandler si está disponible
    if (typeof EmptyStateHandler !== 'undefined') {
      this.container.style.gridColumn = '1 / -1';
      EmptyStateHandler.renderNoCertamenes(this.container);
    } else {
      // Fallback manual
      this.container.innerHTML = `
        <div class="empty-state no-certamenes" style="grid-column: 1 / -1;">
          <div class="empty-state-icon bell" style="font-size: 4rem; margin-bottom: 1.5rem;">🔔</div>
          <h2 class="empty-state-title" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem;">
            ¡No hay certámenes disponibles!
          </h2>
          <p class="empty-state-message" style="font-size: 1rem; color: rgba(255, 255, 255, 0.8); margin-bottom: 1.5rem;">
            Actualmente no hay certámenes activos, pero estamos preparando algo increíble.
          </p>
          <p class="empty-state-submessage" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); font-style: italic;">
            Quedate atento, pronto te notificaremos cuando haya nuevos certámenes.
          </p>
          <div class="empty-state-action" style="margin-top: 1.5rem;">
            <a href="/principal.html" class="btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.75rem 2rem; border-radius: 25px; text-decoration: none; display: inline-block;">
              🏠 Volver al inicio
            </a>
          </div>
        </div>
      `;
    }
  }

  /**
   * Renderizar error
   */
  renderError(errorMessage) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="text-align: center; padding: 3rem; grid-column: 1 / -1; background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.3); border-radius: 12px;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Error al cargar certámenes</h3>
        <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem;">${errorMessage}</p>
        <button onclick="window.location.reload()" style="background: linear-gradient(135deg, #3B82F6, #2DD4BF); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer;">
          🔄 Reintentar
        </button>
      </div>
    `;
  }

  /**
   * Renderizar certámenes
   */
  render() {
    if (!this.container || this.certamenes.length === 0) {
      this.renderEmpty();
      return;
    }

    this.container.innerHTML = this.certamenes.map((certamen, index) => `
      <div class="certamen-card card-3d fade-in-up" data-id="${certamen.id}" style="animation-delay: ${index * 0.1}s;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          ${certamen.imagen_url ? 
            `<img src="${certamen.imagen_url}" alt="${certamen.nombre}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover;">` :
            `<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem;">🎵</div>`
          }
          <div style="flex: 1;">
            <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 4px;">${certamen.nombre}</h3>
            <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
              <i class="fas fa-map-marker-alt"></i> ${certamen.provincia || 'Nacional'}
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
          <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px;">Premio</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: #FFD700;">
              💰 $${certamen.premio?.toLocaleString() || 'TBD'}
            </div>
          </div>
          <div style="background: rgba(45, 212, 191, 0.1); padding: 12px; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px;">Participantes</div>
            <div style="font-size: 1.25rem; font-weight: bold;">
              👥 ${certamen.participantes_count || 0}
            </div>
          </div>
        </div>

        ${certamen.descripcion ? 
          `<p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 16px; line-height: 1.6;">${certamen.descripcion}</p>` :
          ''
        }

        <div style="display: flex; gap: 12px;">
          <a href="/inscripcion-unificada.html?certamen=${certamen.id}" 
             class="btn-primary" 
             style="flex: 1; justify-content: center;">
            <i class="fas fa-microphone"></i>
            Inscribirme
          </a>
          <a href="/certamen-individual.html?id=${certamen.id}" 
             class="btn-primary" 
             style="flex: 1; justify-content: center; background: linear-gradient(135deg, #6B7280, #4B5563);">
            <i class="fas fa-info-circle"></i>
            Ver más
          </a>
        </div>
      </div>
    `).join('');

    // Trigger fade-in animations
    setTimeout(() => {
      const cards = this.container.querySelectorAll('.certamen-card');
      cards.forEach(card => card.classList.add('visible'));
    }, 100);
  }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que Firebase esté listo
    const initLoader = setInterval(() => {
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        clearInterval(initLoader);
        window.certamenesLoader = new CertamenesLoader();
        window.certamenesLoader.init();
      }
    }, 500);
  });
} else {
  const initLoader = setInterval(() => {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      clearInterval(initLoader);
      window.certamenesLoader = new CertamenesLoader();
      window.certamenesLoader.init();
    }
  }, 500);
}

// Exportar para uso global
window.CertamenesLoader = CertamenesLoader;
