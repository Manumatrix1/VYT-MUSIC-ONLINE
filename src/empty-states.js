/**
 * EMPTY STATES HANDLER - Sistema de estados vacíos
 * Reemplaza mensajes de error técnicos con diseños limpios
 */

class EmptyStateHandler {
  /**
   * Renderizar estado vacío: No hay certámenes
   */
  static renderNoCertamenes(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state no-certamenes">
        <div class="empty-state-icon bell"></div>
        <h2 class="empty-state-title">¡No hay certámenes disponibles!</h2>
        <p class="empty-state-message">
          Actualmente no hay certámenes activos, pero estamos preparando algo increíble.
        </p>
        <p class="empty-state-submessage">
          Quedate atento, pronto te notificaremos cuando haya nuevos certámenes.
        </p>
        <div class="empty-state-action">
          <a href="/principal.html" class="btn">
            🏠 Volver al inicio
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado vacío: No hay resultados de búsqueda
   */
  static renderNoResults(container, searchTerm = '') {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state no-results">
        <div class="empty-state-icon search"></div>
        <h2 class="empty-state-title">No encontramos resultados</h2>
        <p class="empty-state-message">
          ${searchTerm ? `No hay coincidencias para "${searchTerm}"` : 'No hay resultados para tu búsqueda'}
        </p>
        <p class="empty-state-submessage">
          Intenta con otros términos o explora todos los certámenes disponibles.
        </p>
        <div class="empty-state-action">
          <button class="btn" onclick="location.reload()">
            🔄 Ver todos los certámenes
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado vacío: Sin participantes
   */
  static renderNoParticipantes(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon music"></div>
        <h2 class="empty-state-title">Aún no hay participantes</h2>
        <p class="empty-state-message">
          Sé el primero en inscribirte y competir por el premio.
        </p>
        <div class="empty-state-action">
          <a href="/inscripcion-unificada.html" class="btn">
            🎤 Inscribirme ahora
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado vacío: Sin votos
   */
  static renderNoVotos(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state no-votes">
        <div class="empty-state-icon trophy"></div>
        <h2 class="empty-state-title">¡Este artista necesita tu apoyo!</h2>
        <p class="empty-state-message">
          Sé el primero en votar y ayúdalo a llegar a la cima.
        </p>
        <div class="empty-state-action">
          <a href="/comprar-vyt-money.html" class="btn">
            💰 Comprar VYT Money
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado genérico personalizado
   */
  static renderCustom(container, options = {}) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;

    const {
      icon = 'bell',
      title = '¡Ups!',
      message = 'No hay información disponible',
      submessage = '',
      actionText = 'Volver',
      actionLink = '/principal.html',
      className = ''
    } = options;

    container.innerHTML = `
      <div class="empty-state ${className}">
        <div class="empty-state-icon ${icon}"></div>
        <h2 class="empty-state-title">${title}</h2>
        <p class="empty-state-message">${message}</p>
        ${submessage ? `<p class="empty-state-submessage">${submessage}</p>` : ''}
        ${actionText && actionLink ? `
          <div class="empty-state-action">
            <a href="${actionLink}" class="btn">${actionText}</a>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Interceptar errores de carga de datos
   */
  static interceptError(errorMessage, container) {
    console.warn('⚠️ Error interceptado por EmptyStateHandler:', errorMessage);
    
    // Si el error es de red o base de datos, mostrar mensaje apropiado
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      this.renderCustom(container, {
        icon: 'search',
        title: 'Error de conexión',
        message: 'No pudimos cargar los datos. Verifica tu conexión a internet.',
        submessage: '',
        actionText: '🔄 Reintentar',
        actionLink: 'javascript:location.reload()'
      });
    } else if (errorMessage.includes('certamen') || errorMessage.includes('contest')) {
      this.renderNoCertamenes(container);
    } else {
      this.renderCustom(container, {
        icon: 'bell',
        title: 'Algo salió mal',
        message: 'Estamos trabajando para solucionarlo.',
        submessage: 'Intenta nuevamente en unos minutos.',
        actionText: '🏠 Volver al inicio',
        actionLink: '/principal.html'
      });
    }
  }
}

// Exportar para uso global
window.EmptyStateHandler = EmptyStateHandler;
