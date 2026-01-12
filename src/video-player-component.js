/**
 * VYT MUSIC - COMPONENTE DE VIDEO CON ESTADO
 * 
 * Muestra el video de YouTube solo cuando youtube_link existe
 * Mientras tanto, muestra mensaje "Procesando video en HD..."
 * 
 * Integración con sistema de votos VYT Money
 */

class VideoPlayerComponent {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.participacionId = null;
    this.videoData = null;
    this.checkInterval = null;
  }

  /**
   * Inicializar el componente con datos del artista
   */
  async init(participacionId) {
    this.participacionId = participacionId;
    await this.loadVideoData();
    this.render();
    
    // Si el video está procesándose, verificar cada 10 segundos
    if (this.videoData.youtube_upload_status === 'processing') {
      this.startStatusCheck();
    }
  }

  /**
   * Cargar datos del video desde Firestore
   */
  async loadVideoData() {
    try {
      const db = firebase.firestore();
      const doc = await db.collection('participaciones').doc(this.participacionId).get();
      
      if (!doc.exists) {
        throw new Error('Participación no encontrada');
      }
      
      this.videoData = {
        id: doc.id,
        ...doc.data()
      };
      
    } catch (error) {
      console.error('Error cargando datos del video:', error);
      this.videoData = null;
    }
  }

  /**
   * Verificar estado de procesamiento cada 10 segundos
   */
  startStatusCheck() {
    this.checkInterval = setInterval(async () => {
      await this.loadVideoData();
      
      // Si el video ya está activo, detener verificación y actualizar UI
      if (this.videoData.video_activo && this.videoData.youtube_link) {
        this.stopStatusCheck();
        this.render();
        this.showSuccessMessage();
      }
      
      // Si hubo error, detener y mostrar error
      if (this.videoData.youtube_upload_status === 'error') {
        this.stopStatusCheck();
        this.render();
      }
    }, 10000); // 10 segundos
  }

  /**
   * Detener verificación de estado
   */
  stopStatusCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Renderizar el componente según el estado
   */
  render() {
    if (!this.container || !this.videoData) {
      return;
    }

    // CASO 1: Video activo - Mostrar player de YouTube + botón de voto
    if (this.videoData.video_activo && this.videoData.youtube_link) {
      this.renderActiveVideo();
    }
    
    // CASO 2: Procesando - Mostrar mensaje de espera
    else if (this.videoData.youtube_upload_status === 'processing') {
      this.renderProcessingState();
    }
    
    // CASO 3: Error - Mostrar mensaje de error
    else if (this.videoData.youtube_upload_status === 'error') {
      this.renderErrorState();
    }
    
    // CASO 4: Pendiente de pago - Mostrar mensaje
    else if (this.videoData.estado === 'waiting_payment') {
      this.renderPendingPayment();
    }
    
    // CASO 5: Estado desconocido
    else {
      this.renderUnknownState();
    }
  }

  /**
   * Renderizar video activo con votación habilitada
   */
  renderActiveVideo() {
    const youtubeVideoId = this.extractYouTubeId(this.videoData.youtube_link);
    
    this.container.innerHTML = `
      <div class="video-player-active">
        <!-- Video de YouTube -->
        <div class="youtube-embed">
          <iframe
            width="100%"
            height="400"
            src="https://www.youtube.com/embed/${youtubeVideoId}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
        
        <!-- Información del video -->
        <div class="video-info">
          <h2 class="video-title">${this.videoData.cancion || 'Sin título'}</h2>
          <p class="artist-name">${this.videoData.nombreArtista || 'Artista'}</p>
          <div class="video-meta">
            <span class="genre"><i class="fas fa-music"></i> ${this.videoData.genero || 'Sin género'}</span>
            <span class="location"><i class="fas fa-map-marker-alt"></i> ${this.videoData.ciudad || ''}, ${this.videoData.provincia_nombre || ''}</span>
            <span class="zone-badge zone-${this.videoData.zona}">${this.videoData.zona_nombre || ''}</span>
          </div>
        </div>
        
        <!-- Stats del video -->
        <div class="video-stats">
          <div class="stat-item">
            <i class="fas fa-heart"></i>
            <span class="stat-value">${this.videoData.votos || 0}</span>
            <span class="stat-label">Votos</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-coins"></i>
            <span class="stat-value">${this.videoData.vyt_money_recibido || 0}</span>
            <span class="stat-label">VYT Money</span>
          </div>
          ${this.videoData.clasificado ? '<div class="badge-clasificado">🏆 Clasificado</div>' : ''}
          ${this.videoData.ready_for_next_round ? '<div class="badge-aspirante">🌟 Aspirante</div>' : ''}
        </div>
        
        <!-- Botón de votación -->
        <div class="voting-section">
          <button class="btn-vote" onclick="votarArtista('${this.videoData.id}')">
            <i class="fas fa-heart"></i> Votar con VYT Money
          </button>
          <p class="voting-info">💎 1 voto = 50 VYT Money</p>
        </div>
        
        <!-- Botón compartir -->
        <div class="share-section">
          <button class="btn-share" onclick="compartirVideo('${this.videoData.id}')">
            <i class="fas fa-share-alt"></i> Compartir
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado de procesamiento
   */
  renderProcessingState() {
    this.container.innerHTML = `
      <div class="video-player-processing">
        <div class="processing-animation">
          <div class="spinner"></div>
          <i class="fas fa-video processing-icon"></i>
        </div>
        
        <h3 class="processing-title">Procesando video en HD...</h3>
        
        <p class="processing-description">
          Tu video está siendo subido a YouTube. Este proceso puede tomar unos minutos.
        </p>
        
        <div class="processing-steps">
          <div class="step ${this.videoData.youtube_webhook_sent ? 'completed' : 'active'}">
            <i class="fas fa-check-circle"></i>
            <span>Pago confirmado</span>
          </div>
          <div class="step ${this.videoData.youtube_upload_status === 'processing' ? 'active' : ''}">
            <i class="fas fa-upload"></i>
            <span>Subiendo a YouTube</span>
          </div>
          <div class="step">
            <i class="fas fa-play-circle"></i>
            <span>Activando votación</span>
          </div>
        </div>
        
        <div class="processing-info">
          <p>💡 <strong>Mientras tanto:</strong></p>
          <ul>
            <li>✓ Completa tu perfil de artista</li>
            <li>✓ Prepara tu estrategia de difusión</li>
            <li>✓ Compra VYT Money para votar por otros</li>
          </ul>
        </div>
        
        <button class="btn-refresh" onclick="location.reload()">
          <i class="fas fa-sync-alt"></i> Actualizar estado
        </button>
      </div>
    `;
  }

  /**
   * Renderizar estado de error
   */
  renderErrorState() {
    this.container.innerHTML = `
      <div class="video-player-error">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        
        <h3 class="error-title">Error procesando video</h3>
        
        <p class="error-description">
          Hubo un problema al procesar tu video. Nuestro equipo técnico fue notificado.
        </p>
        
        <div class="error-details">
          <p><strong>Código de error:</strong> ${this.videoData.youtube_upload_error || 'UNKNOWN'}</p>
          <p><strong>Participación ID:</strong> ${this.participacionId}</p>
        </div>
        
        <div class="error-actions">
          <button class="btn-contact" onclick="contactarSoporte()">
            <i class="fas fa-headset"></i> Contactar Soporte
          </button>
          <button class="btn-refresh" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i> Reintentar
          </button>
        </div>
        
        <div class="error-info">
          <p>📧 También puedes enviarnos un email a soporte@vyt-music.com con tu código de participación.</p>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar pendiente de pago
   */
  renderPendingPayment() {
    this.container.innerHTML = `
      <div class="video-player-pending">
        <div class="pending-icon">
          <i class="fas fa-clock"></i>
        </div>
        
        <h3 class="pending-title">Esperando confirmación de pago</h3>
        
        <p class="pending-description">
          Una vez que tu pago sea confirmado, tu video será procesado automáticamente.
        </p>
        
        <div class="pending-actions">
          <a href="/pagar-inscripcion.html?id=${this.participacionId}" class="btn-payment">
            <i class="fas fa-credit-card"></i> Completar Pago
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado desconocido
   */
  renderUnknownState() {
    this.container.innerHTML = `
      <div class="video-player-unknown">
        <div class="unknown-icon">
          <i class="fas fa-question-circle"></i>
        </div>
        
        <h3 class="unknown-title">Estado desconocido</h3>
        
        <p class="unknown-description">
          No pudimos determinar el estado de tu video. Por favor, contacta a soporte.
        </p>
        
        <button class="btn-refresh" onclick="location.reload()">
          <i class="fas fa-sync-alt"></i> Actualizar
        </button>
      </div>
    `;
  }

  /**
   * Extraer ID de video de YouTube desde URL
   */
  extractYouTubeId(url) {
    if (!url) return null;
    
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  /**
   * Mostrar mensaje de éxito cuando el video se activa
   */
  showSuccessMessage() {
    // Crear toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>¡Tu video ya está activo! Los votos están habilitados.</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  /**
   * Cleanup al destruir el componente
   */
  destroy() {
    this.stopStatusCheck();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// ===== FUNCIONES AUXILIARES =====

/**
 * Votar por un artista con VYT Money
 */
async function votarArtista(participacionId) {
  const user = firebase.auth().currentUser;
  
  if (!user) {
    alert('Debes iniciar sesión para votar');
    window.location.href = '/login.html';
    return;
  }
  
  try {
    // Verificar saldo de VYT Money
    const db = firebase.firestore();
    const saldoDoc = await db.collection('user_vyt_money').doc(user.uid).get();
    const saldoActual = saldoDoc.exists ? saldoDoc.data().saldo : 0;
    
    const COSTO_VOTO = 50; // 1 voto = 50 VYT Money
    
    if (saldoActual < COSTO_VOTO) {
      if (confirm('No tienes suficiente VYT Money. ¿Deseas comprar más?')) {
        window.location.href = '/comprar-vyt-money.html';
      }
      return;
    }
    
    // Confirmar voto
    if (!confirm(`¿Votar por este artista? Costo: ${COSTO_VOTO} VYT Money`)) {
      return;
    }
    
    // Llamar a Cloud Function para registrar voto
    const functions = firebase.functions();
    const registrarVoto = functions.httpsCallable('registrarVoto');
    
    const result = await registrarVoto({
      participacion_id: participacionId,
      monto: COSTO_VOTO
    });
    
    if (result.data.success) {
      alert('¡Voto registrado exitosamente!');
      location.reload(); // Recargar para ver nuevo contador
    } else {
      alert('Error registrando voto: ' + result.data.error);
    }
    
  } catch (error) {
    console.error('Error votando:', error);
    alert('Error al votar. Intenta nuevamente.');
  }
}

/**
 * Compartir video en redes sociales
 */
async function compartirVideo(participacionId) {
  const db = firebase.firestore();
  const doc = await db.collection('participaciones').doc(participacionId).get();
  const data = doc.data();
  
  const shareData = {
    title: `${data.nombreArtista} - ${data.cancion}`,
    text: `🎤 Vota por ${data.nombreArtista}, representando a ${data.zona_nombre}, ${data.provincia_nombre}! Lo crees, lo creas. 🌟`,
    url: window.location.href
  };
  
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert('Link copiado al portapapeles');
    }
  } catch (error) {
    console.error('Error compartiendo:', error);
  }
}

/**
 * Contactar soporte
 */
function contactarSoporte() {
  window.location.href = 'mailto:soporte@vyt-music.com?subject=Error procesando video&body=Participación ID: ' + window.videoPlayerInstance.participacionId;
}

// Exportar para uso global
window.VideoPlayerComponent = VideoPlayerComponent;
window.votarArtista = votarArtista;
window.compartirVideo = compartirVideo;
window.contactarSoporte = contactarSoporte;
