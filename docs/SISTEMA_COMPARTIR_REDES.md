# 📱 Sistema de Compartir en Redes Sociales - VYT Music

## 🎯 Objetivos del Sistema

### **Viralización Inteligente:**
- **Fácil compartición** con un solo click
- **Contenido personalizado** por red social
- **Tracking de compartidos** para analytics
- **Incentivos** para quien comparte

## 🛠️ Implementación Técnica

### **URLs y APIs por Plataforma:**

```javascript
// compartir-redes.js
class SistemaCompartir {
  constructor(videoData) {
    this.videoData = videoData;
    this.baseUrl = 'https://vytonlineprueva.web.app';
    this.trackingEnabled = true;
  }

  // 📘 Facebook
  compartirFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.getVideoUrl())}&quote=${encodeURIComponent(this.getTextoFacebook())}`;
    this.abrirVentanaCompartir(url, 'facebook');
  }

  getTextoFacebook() {
    return `🎵 ¡Vota por ${this.videoData.artista} en VYT Music! 
    
${this.videoData.descripcion}

#VYTMusic #TalentoArgentino #CertamenMusical`;
  }

  // 📸 Instagram (Web Intent)
  compartirInstagram() {
    // Instagram no tiene web intent directo, pero podemos:
    // 1. Copiar texto al clipboard
    // 2. Abrir Instagram Web
    // 3. Mostrar instrucciones
    
    const texto = this.getTextoInstagram();
    this.copiarAlClipboard(texto);
    
    // Abrir Instagram
    window.open('https://instagram.com', '_blank');
    
    // Mostrar modal con instrucciones
    this.mostrarInstruccionesInstagram(texto);
  }

  getTextoInstagram() {
    return `🎵 ¡Escucha a ${this.videoData.artista} en VYT Music!

${this.videoData.descripcion}

🗳️ Vota en: ${this.getVideoUrl()}

#VYTMusic #TalentoArgentino #Musica #Certamen #${this.videoData.genero.replace(' ', '')}`;
  }

  // 🐦 Twitter/X
  compartirTwitter() {
    const texto = this.getTextoTwitter();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(this.getVideoUrl())}`;
    this.abrirVentanaCompartir(url, 'twitter');
  }

  getTextoTwitter() {
    return `🎵 ¡Vota por ${this.videoData.artista} en @VYTMusic! 

${this.videoData.descripcion.substring(0, 100)}...

#VYTMusic #TalentoArgentino`;
  }

  // 🎵 TikTok
  compartirTikTok() {
    // TikTok no tiene API web directa, estrategia alternativa:
    const texto = this.getTextoTikTok();
    this.copiarAlClipboard(texto);
    
    // Intentar abrir app móvil o web
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.open('https://www.tiktok.com/', '_blank');
    } else {
      window.open('https://www.tiktok.com/', '_blank');
    }
    
    this.mostrarInstruccionesTikTok(texto);
  }

  getTextoTikTok() {
    return `🎵 ¡Check out ${this.videoData.artista}! 

Vote at: ${this.getVideoUrl()}

#VYTMusic #TalentoArgentino #Musica #FYP #Viral`;
  }

  // 💚 WhatsApp
  compartirWhatsApp() {
    const texto = this.getTextoWhatsApp();
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    this.abrirVentanaCompartir(url, 'whatsapp');
  }

  getTextoWhatsApp() {
    return `🎵 *${this.videoData.artista} - VYT Music*

${this.videoData.descripcion}

¡Votá por este talento increíble! 🗳️
${this.getVideoUrl()}

#VYTMusic #TalentoArgentino`;
  }

  // 💼 LinkedIn
  compartirLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.getVideoUrl())}`;
    this.abrirVentanaCompartir(url, 'linkedin');
  }

  // 📧 Email
  compartirEmail() {
    const asunto = `🎵 Vota por ${this.videoData.artista} en VYT Music`;
    const cuerpo = this.getTextoEmail();
    const url = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = url;
    this.trackCompartir('email');
  }

  getTextoEmail() {
    return `Hola!

Te invito a escuchar y votar por ${this.videoData.artista} en el certamen VYT Music.

${this.videoData.descripcion}

Puedes ver el video y votar aquí:
${this.getVideoUrl()}

¡Gracias por apoyar el talento argentino!

Saludos,
Un fanático de VYT Music`;
  }

  // 📋 Copiar Link
  copiarLink() {
    this.copiarAlClipboard(this.getVideoUrl());
    this.mostrarToast('🔗 Link copiado al clipboard');
    this.trackCompartir('copy_link');
  }

  // 🛠️ Métodos auxiliares
  getVideoUrl() {
    return `${this.baseUrl}/certamenes.html?video=${this.videoData.id}`;
  }

  abrirVentanaCompartir(url, plataforma) {
    const ventana = window.open(
      url,
      `compartir_${plataforma}`,
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );
    
    if (ventana) {
      this.trackCompartir(plataforma);
    }
  }

  async copiarAlClipboard(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = texto;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }

  mostrarInstruccionesInstagram(texto) {
    const modal = this.crearModal(`
      <h3>📸 Compartir en Instagram</h3>
      <p>El texto se copió automáticamente. Ahora:</p>
      <ol>
        <li>Crea una nueva publicación en Instagram</li>
        <li>Pega el texto copiado</li>
        <li>Agrega una foto o video</li>
        <li>¡Publica!</li>
      </ol>
      <div class="texto-copiado">
        <strong>Texto copiado:</strong><br>
        <code>${texto}</code>
      </div>
    `);
    this.mostrarModal(modal);
  }

  mostrarInstruccionesTikTok(texto) {
    const modal = this.crearModal(`
      <h3>🎵 Compartir en TikTok</h3>
      <p>El texto se copió automáticamente. Sugerencias:</p>
      <ul>
        <li>Crea un video reaccionando al artista</li>
        <li>Haz un dueto con el video original</li>
        <li>Comparte tu opinión sobre el talento</li>
        <li>Usa los hashtags copiados</li>
      </ul>
      <div class="texto-copiado">
        <strong>Hashtags y texto:</strong><br>
        <code>${texto}</code>
      </div>
    `);
    this.mostrarModal(modal);
  }

  crearModal(contenido) {
    const modal = document.createElement('div');
    modal.className = 'modal-compartir';
    modal.innerHTML = `
      <div class="modal-contenido">
        ${contenido}
        <button onclick="this.closest('.modal-compartir').remove()" class="btn-cerrar">
          Cerrar
        </button>
      </div>
    `;
    return modal;
  }

  mostrarModal(modal) {
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('visible'), 10);
  }

  mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast-compartir';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async trackCompartir(plataforma) {
    if (!this.trackingEnabled) return;
    
    try {
      await fetch('/api/track-compartir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: this.videoData.id,
          plataforma: plataforma,
          timestamp: Date.now(),
          user_agent: navigator.userAgent
        })
      });
    } catch (error) {
      console.log('Error tracking share:', error);
    }
  }
}
```

### **HTML del Widget de Compartir:**
```html
<!-- widget-compartir.html -->
<div class="widget-compartir" data-video-id="${videoId}">
  <h4 class="compartir-titulo">📱 Compartir y Apoyar</h4>
  
  <div class="botones-compartir">
    <button class="btn-compartir facebook" onclick="compartir.compartirFacebook()">
      <i class="fab fa-facebook-f"></i>
      <span>Facebook</span>
    </button>
    
    <button class="btn-compartir instagram" onclick="compartir.compartirInstagram()">
      <i class="fab fa-instagram"></i>
      <span>Instagram</span>
    </button>
    
    <button class="btn-compartir twitter" onclick="compartir.compartirTwitter()">
      <i class="fab fa-twitter"></i>
      <span>Twitter</span>
    </button>
    
    <button class="btn-compartir tiktok" onclick="compartir.compartirTikTok()">
      <i class="fab fa-tiktok"></i>
      <span>TikTok</span>
    </button>
    
    <button class="btn-compartir whatsapp" onclick="compartir.compartirWhatsApp()">
      <i class="fab fa-whatsapp"></i>
      <span>WhatsApp</span>
    </button>
    
    <button class="btn-compartir linkedin" onclick="compartir.compartirLinkedIn()">
      <i class="fab fa-linkedin-in"></i>
      <span>LinkedIn</span>
    </button>
    
    <button class="btn-compartir email" onclick="compartir.compartirEmail()">
      <i class="fas fa-envelope"></i>
      <span>Email</span>
    </button>
    
    <button class="btn-compartir copy-link" onclick="compartir.copiarLink()">
      <i class="fas fa-link"></i>
      <span>Copiar Link</span>
    </button>
  </div>
  
  <div class="compartir-stats">
    <span class="stat-item">
      <i class="fas fa-share"></i>
      <span id="total-compartidos">0</span> compartidos
    </span>
  </div>
</div>
```

### **CSS para el Widget:**
```css
/* widget-compartir.css */
.widget-compartir {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
  color: white;
}

.compartir-titulo {
  text-align: center;
  margin-bottom: 15px;
  font-size: 1.2rem;
  font-weight: bold;
}

.botones-compartir {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.btn-compartir {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-compartir i {
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.btn-compartir:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

/* Colores específicos por plataforma */
.btn-compartir.facebook { background: #3b5998; }
.btn-compartir.instagram { background: linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d); }
.btn-compartir.twitter { background: #1da1f2; }
.btn-compartir.tiktok { background: #000000; }
.btn-compartir.whatsapp { background: #25d366; }
.btn-compartir.linkedin { background: #0077b5; }
.btn-compartir.email { background: #dd4b39; }
.btn-compartir.copy-link { background: #6c757d; }

.compartir-stats {
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.3);
  padding-top: 10px;
  font-size: 0.9rem;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Modal de instrucciones */
.modal-compartir {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-compartir.visible {
  opacity: 1;
}

.modal-contenido {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.texto-copiado {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  border-left: 4px solid #007bff;
}

.texto-copiado code {
  background: none;
  padding: 0;
  color: #333;
  font-size: 0.9rem;
  white-space: pre-wrap;
}

.btn-cerrar {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
  float: right;
}

/* Toast de confirmación */
.toast-compartir {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #28a745;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transform: translateX(400px);
  transition: transform 0.3s ease;
  z-index: 10001;
}

.toast-compartir.visible {
  transform: translateX(0);
}

/* Responsive */
@media (max-width: 768px) {
  .botones-compartir {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .btn-compartir {
    padding: 10px 6px;
    font-size: 0.8rem;
  }
  
  .btn-compartir i {
    font-size: 1.3rem;
  }
}
```

## 📊 Backend: Tracking de Compartidos

### **API para Tracking:**
```javascript
// track-compartir.js
exports.trackCompartir = onRequest(async (req, res) => {
  const { video_id, plataforma, timestamp, user_agent } = req.body;
  
  try {
    // Registrar compartido
    await db.collection('compartidos').add({
      video_id,
      plataforma,
      timestamp: new Date(timestamp),
      user_agent,
      ip: req.ip,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Actualizar contador del video
    await db.collection('videos_stats').doc(video_id).update({
      [`compartidos_${plataforma}`]: admin.firestore.FieldValue.increment(1),
      total_compartidos: admin.firestore.FieldValue.increment(1)
    });
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de compartidos
exports.getCompartidosStats = onRequest(async (req, res) => {
  const { video_id } = req.query;
  
  try {
    const statsDoc = await db.collection('videos_stats').doc(video_id).get();
    
    if (statsDoc.exists) {
      res.status(200).json(statsDoc.data());
    } else {
      res.status(200).json({
        total_compartidos: 0,
        compartidos_facebook: 0,
        compartidos_instagram: 0,
        compartidos_twitter: 0,
        compartidos_tiktok: 0,
        compartidos_whatsapp: 0,
        compartidos_linkedin: 0,
        compartidos_email: 0,
        compartidos_copy_link: 0
      });
    }
    
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## 🎁 Incentivos para Compartir

### **Sistema de Recompensas:**
- **VYT-MONEY Bonus**: +10 VYT-MONEY por cada compartido
- **Badges Especiales**: "Influencer Musical", "Viral Maker"
- **Multiplicadores**: Compartir aumenta el peso de tu voto x1.5

### **Gamificación del Compartir:**
- **Challenge Semanal**: "Comparte 5 videos y gana 100 VYT-MONEY"
- **Leaderboard**: Top usuarios que más comparten
- **Premios Especiales**: Merchandising para top sharers

Este sistema convierte cada video en contenido viral potencial, expandiendo exponencialmente el alcance del certamen! 🚀📱
