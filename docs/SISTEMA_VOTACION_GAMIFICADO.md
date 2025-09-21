# 🎮 Sistema de Votación Gamificado - VYT Music

## 🎯 Experiencia de Usuario

### **Flujo de Votación Interactivo:**
1. **Selección del Artista**: Click en video → Modal con info del artista
2. **Selección de VYT-MONEY**: Slider para elegir cantidad a apostar (mín: 10, máx: balance)
3. **Confirmación Visual**: Preview del voto + impacto en ranking
4. **Animación**: "Moneditas cayendo" + efectos de sonido + confetti
5. **Recompensa Inmediata**: Premio otorgado + actualización de perfil

## 🛠️ Implementación Técnica

### **Componente Votación**
```javascript
// votacion-component.js
class VotacionGameficada {
  constructor(participanteId) {
    this.participanteId = participanteId;
    this.animacionActiva = false;
    this.sonidosActivados = true;
  }

  async realizarVoto(cantidadVYT-MONEY) {
    // 1. Validar balance del usuario
    const balance = await this.validarBalance(cantidadVYT-MONEY);
    if (!balance.suficiente) {
      return this.mostrarModalComprarVYT-MONEY();
    }

    // 2. Procesar voto en backend
    const resultado = await this.procesarVoto({
      participante_id: this.participanteId,
      cantidad_VYT-MONEY: cantidadVYT-MONEY,
      user_id: this.getCurrentUserId()
    });

    // 3. Activar animaciones
    await this.activarAnimacionVoto(cantidadVYT-MONEY);
    
    // 4. Otorgar premio al votante
    await this.otorgarPremioVotante(resultado.premio);
    
    // 5. Actualizar rankings en tiempo real
    this.actualizarRankingTiempoReal();
  }

  async activarAnimacionVoto(cantidad) {
    this.animacionActiva = true;
    
    // Animación de moneditas cayendo
    this.crearAnimacionMoneditas(cantidad);
    
    // Efectos de sonido
    if (this.sonidosActivados) {
      this.reproducirSonidoVoto();
    }
    
    // Confetti effect
    this.activarConfetti();
    
    // Feedback háptico (móviles)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Esperar que termine la animación
    await this.esperarAnimacion(2000);
    this.animacionActiva = false;
  }

  crearAnimacionMoneditas(cantidad) {
    const container = document.getElementById('animation-container');
    
    // Crear múltiples moneditas según la cantidad
    const numMoneditas = Math.min(cantidad / 2, 50); // Máx 50 moneditas
    
    for (let i = 0; i < numMoneditas; i++) {
      setTimeout(() => {
        const moneda = this.crearElementoMoneda();
        container.appendChild(moneda);
        this.animarCaidaMoneda(moneda);
      }, i * 50); // Espaciar las moneditas
    }
  }

  crearElementoMoneda() {
    const moneda = document.createElement('div');
    moneda.className = 'VYT-MONEY-coin animate-fall';
    moneda.innerHTML = '🪙';
    moneda.style.cssText = `
      position: absolute;
      font-size: 24px;
      pointer-events: none;
      z-index: 9999;
      left: ${Math.random() * window.innerWidth}px;
      top: -50px;
      animation: fall-and-bounce 2s ease-out forwards;
    `;
    return moneda;
  }
}
```

### **CSS Animaciones**
```css
/* animaciones-votacion.css */
@keyframes fall-and-bounce {
  0% {
    transform: translateY(-50px) rotate(0deg);
    opacity: 1;
  }
  70% {
    transform: translateY(calc(100vh + 50px)) rotate(720deg);
    opacity: 1;
  }
  100% {
    transform: translateY(calc(100vh + 100px)) rotate(720deg);
    opacity: 0;
  }
}

@keyframes pulse-vote-button {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
}

.vote-button-active {
  animation: pulse-vote-button 0.6s;
  background: linear-gradient(45deg, #FFD700, #FFA500);
}

@keyframes confetti-explosion {
  0% { transform: scale(0) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(180deg); opacity: 0; }
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  animation: confetti-explosion 1s ease-out forwards;
}
```

## 🎵 Sistema de Sonidos

### **Biblioteca de Efectos:**
```javascript
// sonidos-votacion.js
class SistemaAudio {
  constructor() {
    this.sonidos = {
      voto_exitoso: new Audio('/sounds/coin-drop.mp3'),
      premio_obtenido: new Audio('/sounds/achievement.mp3'),
      ranking_subida: new Audio('/sounds/level-up.mp3'),
      compra_VYT-MONEY: new Audio('/sounds/purchase-success.mp3'),
      error: new Audio('/sounds/error-beep.mp3')
    };
    
    // Precargar todos los sonidos
    Object.values(this.sonidos).forEach(audio => {
      audio.preload = 'auto';
      audio.volume = 0.3; // Volumen moderado
    });
  }

  reproducir(tipo) {
    if (this.sonidos[tipo] && !this.sonidos[tipo].muted) {
      this.sonidos[tipo].currentTime = 0; // Reiniciar si ya está reproduciéndose
      this.sonidos[tipo].play().catch(e => console.log('Audio blocked:', e));
    }
  }
}
```

## 📊 Analytics y Gamificación

### **Métricas en Tiempo Real:**
- Votos por segundo
- VYT-MONEY gastado por minuto
- Ranking de artistas actualizado
- Actividad de usuarios conectados

### **Elementos Visuales:**
- Barras de progreso animadas
- Contadores que crecen visualmente
- Badges y achievements
- Leaderboards interactivos
