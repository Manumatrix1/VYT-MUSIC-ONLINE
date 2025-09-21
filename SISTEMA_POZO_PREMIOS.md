# 🏆 Sistema de Pozo de Premios Dinámico - VYT Music

## 💰 Modelo Económico

### **Fuentes de Ingresos al Pozo:**
1. **Inscripciones de Artistas**: [% configurable] → Pozo
2. **Compras de BitMoney**: [% configurable] → Pozo  
3. **Donaciones Directas**: 100% → Pozo
4. **Patrocinios**: [% configurable] → Pozo

### **Distribución de Premios:**
- 🥇 **1er Lugar**: 50% del pozo
- 🥈 **2do Lugar**: 30% del pozo
- 🥉 **3er Lugar**: 15% del pozo
- 🎁 **Premio del Público**: 5% del pozo

## 🛠️ Implementación Técnica

### **Backend: Gestión del Pozo**
```javascript
// pozo-premios.js
exports.actualizarPozo = onRequest(async (req, res) => {
  const { tipo, monto, certamenId } = req.body;
  
  try {
    const pozoRef = db.collection('pozo_premios').doc(certamenId);
    const configRef = db.collection('configuracion').doc('pozo_config');
    
    // Obtener configuración actual
    const config = await configRef.get();
    const porcentajes = config.data();
    
    let montoAlPozo = 0;
    
    switch(tipo) {
      case 'inscripcion':
        montoAlPozo = monto * (porcentajes.porcentaje_inscripciones / 100);
        break;
      case 'votacion':
        montoAlPozo = monto * (porcentajes.porcentaje_votaciones / 100);
        break;
      case 'donacion':
        montoAlPozo = monto; // 100% al pozo
        break;
      case 'patrocinio':
        montoAlPozo = monto * (porcentajes.porcentaje_patrocinios / 100);
        break;
    }
    
    // Actualizar pozo
    await pozoRef.update({
      total_pozo: admin.firestore.FieldValue.increment(montoAlPozo),
      [`aporte_${tipo}s`]: admin.firestore.FieldValue.increment(montoAlPozo),
      ultima_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
      historico_aportes: admin.firestore.FieldValue.arrayUnion({
        tipo,
        monto: montoAlPozo,
        fecha: new Date(),
        origen: req.body.origen || 'sistema'
      })
    });
    
    // Broadcast en tiempo real
    await broadcastPozoUpdate(certamenId, montoAlPozo);
    
    res.status(200).json({ 
      success: true, 
      montoAgregado: montoAlPozo,
      nuevoTotal: await obtenerTotalPozo(certamenId)
    });
    
  } catch (error) {
    console.error('Error updating pozo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función para broadcast en tiempo real
async function broadcastPozoUpdate(certamenId, incremento) {
  const mensaje = {
    tipo: 'pozo_actualizado',
    certamen_id: certamenId,
    incremento: incremento,
    timestamp: Date.now()
  };
  
  // Enviar a todos los usuarios conectados
  await db.collection('notificaciones_tiempo_real').add(mensaje);
}
```

### **Frontend: Contador Visual del Pozo**
```javascript
// contador-pozo.js
class ContadorPozo {
  constructor(certamenId) {
    this.certamenId = certamenId;
    this.totalActual = 0;
    this.animandoIncremento = false;
    this.inicializarListener();
  }

  inicializarListener() {
    // Escuchar cambios en tiempo real
    db.collection('pozo_premios')
      .doc(this.certamenId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const nuevoTotal = doc.data().total_pozo;
          this.animarCambioPozo(this.totalActual, nuevoTotal);
          this.totalActual = nuevoTotal;
        }
      });
  }

  animarCambioPozo(desde, hasta) {
    if (this.animandoIncremento) return;
    
    this.animandoIncremento = true;
    const incremento = hasta - desde;
    
    if (incremento > 0) {
      // Mostrar notificación de incremento
      this.mostrarIncrementoVisual(incremento);
      
      // Animar el contador principal
      this.animarContador(desde, hasta, 2000);
      
      // Efectos visuales especiales
      this.activarEfectosVisuales(incremento);
    }
    
    setTimeout(() => {
      this.animandoIncremento = false;
    }, 2500);
  }

  animarContador(desde, hasta, duracion) {
    const elemento = document.getElementById('contador-pozo');
    const inicio = Date.now();
    
    const animar = () => {
      const transcurrido = Date.now() - inicio;
      const progreso = Math.min(transcurrido / duracion, 1);
      
      // Easing function para suavizar la animación
      const valorActual = desde + (hasta - desde) * this.easeOutCubic(progreso);
      
      elemento.textContent = this.formatearMonto(Math.floor(valorActual));
      
      if (progreso < 1) {
        requestAnimationFrame(animar);
      }
    };
    
    animar();
  }

  mostrarIncrementoVisual(incremento) {
    const incrementoElement = document.createElement('div');
    incrementoElement.className = 'incremento-pozo';
    incrementoElement.textContent = `+$${this.formatearMonto(incremento)}`;
    incrementoElement.style.cssText = `
      position: absolute;
      top: -30px;
      right: 0;
      color: #00ff88;
      font-weight: bold;
      font-size: 18px;
      animation: incremento-float 3s ease-out forwards;
      z-index: 1000;
    `;
    
    document.getElementById('pozo-container').appendChild(incrementoElement);
    
    setTimeout(() => {
      incrementoElement.remove();
    }, 3000);
  }

  activarEfectosVisuales(incremento) {
    // Efecto de brillo en el contador
    const contador = document.getElementById('contador-pozo');
    contador.classList.add('brillo-dorado');
    
    setTimeout(() => {
      contador.classList.remove('brillo-dorado');
    }, 1000);
    
    // Partículas doradas
    if (incremento > 1000) { // Para incrementos grandes
      this.crearParticulasDoradas();
    }
  }

  crearParticulasDoradas() {
    const container = document.getElementById('pozo-container');
    
    for (let i = 0; i < 15; i++) {
      const particula = document.createElement('div');
      particula.className = 'particula-dorada';
      particula.innerHTML = '✨';
      particula.style.cssText = `
        position: absolute;
        font-size: 16px;
        pointer-events: none;
        animation: particula-explosion 2s ease-out forwards;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        animation-delay: ${i * 0.1}s;
      `;
      
      container.appendChild(particula);
      
      setTimeout(() => {
        particula.remove();
      }, 2000);
    }
  }

  formatearMonto(monto) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(monto);
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
}
```

### **CSS para Efectos Visuales del Pozo**
```css
/* efectos-pozo.css */
#contador-pozo {
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FF6347);
  background-size: 300% 300%;
  animation: gradient-shift 3s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
}

.brillo-dorado {
  animation: brillo-intenso 1s ease-out !important;
}

@keyframes brillo-intenso {
  0% { filter: brightness(1) drop-shadow(0 0 10px gold); }
  50% { filter: brightness(1.5) drop-shadow(0 0 20px gold); }
  100% { filter: brightness(1) drop-shadow(0 0 10px gold); }
}

@keyframes incremento-float {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-50px) scale(1.2);
    opacity: 0;
  }
}

@keyframes particula-explosion {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(-50% + ${Math.random() * 200 - 100}px), 
      calc(-50% + ${Math.random() * 200 - 100}px)
    ) scale(1.5) rotate(360deg);
    opacity: 0;
  }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.pozo-info-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border: 2px solid #FFD700;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.pozo-info-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.1), transparent);
  animation: brillar-borde 3s linear infinite;
  z-index: 0;
}

@keyframes brillar-borde {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## 🎛️ Panel de Configuración Admin

### **Interface para Gestionar Porcentajes:**
```html
<!-- admin-pozo-config.html -->
<div class="pozo-config-panel">
  <h3>⚙️ Configuración del Pozo de Premios</h3>
  
  <div class="config-grid">
    <div class="config-item">
      <label>% Inscripciones → Pozo:</label>
      <input type="range" id="porcentaje-inscripciones" min="0" max="50" value="15">
      <span class="valor-actual">15%</span>
    </div>
    
    <div class="config-item">
      <label>% Votaciones → Pozo:</label>
      <input type="range" id="porcentaje-votaciones" min="0" max="30" value="10">
      <span class="valor-actual">10%</span>
    </div>
    
    <div class="config-item">
      <label>% Patrocinios → Pozo:</label>
      <input type="range" id="porcentaje-patrocinios" min="0" max="80" value="60">
      <span class="valor-actual">60%</span>
    </div>
  </div>
  
  <button class="btn-guardar-config">💾 Guardar Configuración</button>
</div>
```

## 📈 Dashboard del Pozo

### **Métricas Visibles:**
- **Total Acumulado**: Monto principal con animación
- **Aportes por Fuente**: Gráfico de torta en tiempo real
- **Crecimiento Diario**: Línea temporal
- **Proyección**: Estimación basada en tendencia
- **Últimas Contribuciones**: Feed en vivo