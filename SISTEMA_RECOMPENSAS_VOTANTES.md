# 🏅 Sistema de Recompensas para Votantes - VYT Music

## 🎯 Concepto de Gamificación

### **Filosofía del Sistema:**
Cada voto otorga una recompensa al votante, creando un ciclo de engagement que va más allá del simple apoyo al artista. Los votantes coleccionan premios que se muestran públicamente, generando estatus social y competencia sana.

## 🏆 Tipos de Premios Configurables

### **🌟 Premios por Voto Individual:**
```json
{
  "premios_por_voto": {
    "estrella_dorada": {
      "nombre": "Estrella Dorada",
      "icono": "⭐",
      "descripcion": "Por votar con 50+ VYT-MONEY",
      "condicion": "cantidad_VYT-MONEY >= 50",
      "rareza": "comun",
      "puntos": 10
    },
    "estandarte_musical": {
      "nombre": "Estandarte Musical",
      "icono": "🎵",
      "descripcion": "Por votar por un artista de tu provincia",
      "condicion": "misma_provincia_artista",
      "rareza": "poco_comun",
      "puntos": 25
    },
    "corazon_de_oro": {
      "nombre": "Corazón de Oro",
      "icono": "💛",
      "descripcion": "Por votar por un artista novel",
      "condicion": "artista_nueva_participacion",
      "rareza": "raro",
      "puntos": 50
    }
  }
}
```

### **🎖️ Logros por Acumulación:**
```json
{
  "logros_acumulativos": {
    "mecenas_musical": {
      "nombre": "Mecenas Musical",
      "icono": "👑",
      "descripcion": "Gastaste 1000+ VYT-MONEY en total",
      "condicion": "total_VYT-MONEY_gastado >= 1000",
      "premio_especial": "badge_exclusivo + 100_VYT-MONEY_bonus",
      "rareza": "legendario"
    },
    "descubridor_talentos": {
      "nombre": "Descubridor de Talentos",
      "icono": "🔍",
      "descripcion": "Votaste por 10 artistas diferentes",
      "condicion": "artistas_votados_unicos >= 10",
      "premio_especial": "titulo_perfil_especial",
      "rareza": "epico"
    },
    "fanatico_certamen": {
      "nombre": "Fanático del Certamen",
      "icono": "🎤",
      "descripcion": "Participaste en 3 certámenes seguidos",
      "condicion": "certamenes_participados >= 3",
      "premio_especial": "descuento_20_proximo_certamen",
      "rareza": "legendario"
    }
  }
}
```

## 🛠️ Implementación del Sistema

### **Backend: Gestión de Premios**
```javascript
// sistema-premios.js
exports.otorgarPremio = onRequest(async (req, res) => {
  const { userId, tipoVoto, cantidadVYT-MONEY, participanteId } = req.body;
  
  try {
    // Obtener configuración de premios
    const configPremios = await obtenerConfiguracionPremios();
    
    // Analizar qué premios aplican
    const premiosObtenidos = await analizarPremiosAplicables({
      userId,
      tipoVoto,
      cantidadVYT-MONEY,
      participanteId,
      configPremios
    });
    
    // Otorgar premios
    for (const premio of premiosObtenidos) {
      await otorgarPremioUsuario(userId, premio);
    }
    
    // Verificar logros acumulativos
    const logrosNuevos = await verificarLogrosAcumulativos(userId);
    
    res.status(200).json({
      success: true,
      premios_otorgados: premiosObtenidos,
      logros_nuevos: logrosNuevos,
      puntos_totales: await calcularPuntosTotales(userId)
    });
    
  } catch (error) {
    console.error('Error otorgando premio:', error);
    res.status(500).json({ error: error.message });
  }
});

async function analizarPremiosAplicables({ userId, cantidadVYT-MONEY, participanteId, configPremios }) {
  const premiosAplicables = [];
  
  // Obtener datos del usuario y participante
  const [usuarioData, participanteData] = await Promise.all([
    obtenerDatosUsuario(userId),
    obtenerDatosParticipante(participanteId)
  ]);
  
  // Evaluar cada premio configurado
  for (const [premiId, premio] of Object.entries(configPremios.premios_por_voto)) {
    if (await evaluarCondicionPremio(premio.condicion, {
      cantidadVYT-MONEY,
      usuarioData,
      participanteData
    })) {
      premiosAplicables.push({
        id: premiId,
        ...premio,
        fecha_obtencion: new Date()
      });
    }
  }
  
  return premiosAplicables;
}

async function evaluarCondicionPremio(condicion, contexto) {
  const { cantidadVYT-MONEY, usuarioData, participanteData } = contexto;
  
  switch (condicion) {
    case 'cantidad_VYT-MONEY >= 50':
      return cantidadVYT-MONEY >= 50;
      
    case 'misma_provincia_artista':
      return usuarioData.provincia === participanteData.provincia;
      
    case 'artista_nueva_participacion':
      const participacionesAnteriores = await contarParticipacionesArtista(participanteData.email);
      return participacionesAnteriores === 1; // Primera participación
      
    default:
      return false;
  }
}
```

### **Frontend: Sistema de Notificaciones de Premios**
```javascript
// notificaciones-premios.js
class NotificacionesPremios {
  constructor() {
    this.colaPremios = [];
    this.mostrandoPremio = false;
    this.sonidos = new SistemaAudio();
  }

  async mostrarPremioObtenido(premio) {
    this.colaPremios.push(premio);
    if (!this.mostrandoPremio) {
      await this.procesarColaPremios();
    }
  }

  async procesarColaPremios() {
    while (this.colaPremios.length > 0) {
      this.mostrandoPremio = true;
      const premio = this.colaPremios.shift();
      await this.animarPremio(premio);
      await this.esperar(1500); // Pausa entre premios
    }
    this.mostrandoPremio = false;
  }

  async animarPremio(premio) {
    // Crear modal de premio
    const modal = this.crearModalPremio(premio);
    document.body.appendChild(modal);
    
    // Sonido de logro
    this.sonidos.reproducir('premio_obtenido');
    
    // Animación de entrada
    modal.style.animation = 'premio-aparicion 0.5s ease-out forwards';
    
    // Esperar y animar salida
    await this.esperar(2000);
    modal.style.animation = 'premio-desaparicion 0.5s ease-in forwards';
    
    await this.esperar(500);
    modal.remove();
    
    // Actualizar colección del usuario
    this.actualizarColeccionUsuario(premio);
  }

  crearModalPremio(premio) {
    const modal = document.createElement('div');
    modal.className = 'premio-modal';
    modal.innerHTML = `
      <div class="premio-contenido">
        <div class="premio-icono">${premio.icono}</div>
        <h3 class="premio-titulo">¡${premio.nombre}!</h3>
        <p class="premio-descripcion">${premio.descripcion}</p>
        <div class="premio-puntos">+${premio.puntos} puntos</div>
        <div class="premio-brillos">
          ${'✨'.repeat(5)}
        </div>
      </div>
    `;
    
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      border: 3px solid #fff;
      min-width: 300px;
    `;
    
    return modal;
  }

  actualizarColeccionUsuario(premio) {
    // Agregar el premio a la colección visible del usuario
    const coleccion = document.getElementById('coleccion-premios-usuario');
    if (coleccion) {
      const premioElement = document.createElement('div');
      premioElement.className = 'premio-coleccionado';
      premioElement.innerHTML = `
        <span class="premio-icono-mini">${premio.icono}</span>
        <span class="premio-nombre-mini">${premio.nombre}</span>
      `;
      coleccion.appendChild(premioElement);
    }
  }

  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### **CSS para Animaciones de Premios**
```css
/* animaciones-premios.css */
@keyframes premio-aparicion {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(-180deg);
    opacity: 0;
  }
  70% {
    transform: translate(-50%, -50%) scale(1.1) rotate(10deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes premio-desaparicion {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
}

.premio-contenido {
  position: relative;
  overflow: hidden;
}

.premio-icono {
  font-size: 4rem;
  margin-bottom: 15px;
  animation: icono-brillo 2s ease-in-out infinite;
}

@keyframes icono-brillo {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.1); filter: brightness(1.3); }
}

.premio-brillos {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.premio-brillos::before {
  content: attr(data-brillos);
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  animation: brillos-flotantes 3s linear infinite;
}

@keyframes brillos-flotantes {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Colección de premios del usuario */
.coleccion-premios-usuario {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.premio-coleccionado {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  padding: 8px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  border: 2px solid #fff;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  animation: premio-nuevo 0.5s ease-out;
}

@keyframes premio-nuevo {
  0% { transform: scale(0); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.premio-icono-mini {
  font-size: 1.2rem;
}

/* Rareza de premios */
.premio-comun { border-color: #cccccc; }
.premio-poco-comun { border-color: #00ff00; }
.premio-raro { border-color: #0080ff; }
.premio-epico { border-color: #8000ff; }
.premio-legendario { border-color: #ff8000; }
```

## 📊 Panel Admin - Configuración de Premios

### **Interface de Gestión:**
```html
<!-- admin-premios-config.html -->
<div class="premios-admin-panel">
  <h3>🏆 Configuración de Premios y Logros</h3>
  
  <div class="tabs-container">
    <div class="tab active" data-tab="premios-voto">Premios por Voto</div>
    <div class="tab" data-tab="logros-acumulativos">Logros Acumulativos</div>
    <div class="tab" data-tab="estadisticas">Estadísticas</div>
  </div>
  
  <div class="tab-content" id="premios-voto">
    <button class="btn-agregar-premio">+ Nuevo Premio</button>
    <div class="premios-lista" id="lista-premios-voto">
      <!-- Premios dinámicos -->
    </div>
  </div>
  
  <div class="tab-content hidden" id="logros-acumulativos">
    <button class="btn-agregar-logro">+ Nuevo Logro</button>
    <div class="logros-lista" id="lista-logros">
      <!-- Logros dinámicos -->
    </div>
  </div>
  
  <div class="tab-content hidden" id="estadisticas">
    <div class="stats-grid">
      <div class="stat-card">
        <h4>Premios Otorgados Hoy</h4>
        <div class="stat-numero" id="premios-hoy">0</div>
      </div>
      <div class="stat-card">
        <h4>Premio Más Popular</h4>
        <div class="stat-contenido" id="premio-popular">-</div>
      </div>
    </div>
  </div>
</div>

<!-- Modal para crear/editar premio -->
<div id="modal-crear-premio" class="modal">
  <div class="modal-contenido">
    <h4>Configurar Premio</h4>
    <form id="form-premio">
      <input type="text" placeholder="Nombre del premio" required>
      <input type="text" placeholder="Ícono (emoji)" required>
      <textarea placeholder="Descripción" required></textarea>
      <select name="condicion" required>
        <option value="">Seleccionar condición</option>
        <option value="cantidad_VYT-MONEY >= 50">VYT-MONEY >= 50</option>
        <option value="misma_provincia_artista">Misma provincia del artista</option>
        <option value="artista_nueva_participacion">Artista novel</option>
      </select>
      <input type="number" placeholder="Puntos otorgados" min="1" required>
      <select name="rareza" required>
        <option value="comun">Común</option>
        <option value="poco_comun">Poco Común</option>
        <option value="raro">Raro</option>
        <option value="epico">Épico</option>
        <option value="legendario">Legendario</option>
      </select>
      <button type="submit">Guardar Premio</button>
    </form>
  </div>
</div>
```

## 🎮 Ejemplos de Premios Configurables

### **💡 Ideas de Premios que Puedes Configurar:**

**Por Cantidad de VYT-MONEY:**
- 🥉 "Apoyo Bronce" (10-49 VYT-MONEY)
- 🥈 "Apoyo Plata" (50-99 VYT-MONEY) 
- 🥇 "Apoyo Oro" (100+ VYT-MONEY)

**Por Comportamiento:**
- 🌟 "Descubridor" (Votar por artista con menos votos)
- 💝 "Fiel Seguidor" (Votar por el mismo artista 3 veces)
- 🎯 "Estratega" (Votar por los 3 primeros del ranking)

**Por Geografía:**
- 🏠 "Orgullo Local" (Votar por artista de tu ciudad)
- 🌎 "Viajero Musical" (Votar por artistas de 5 provincias diferentes)

**Por Timing:**
- ⚡ "Votante Temprano" (Votar en las primeras 24hs)
- 🔥 "Último Momento" (Votar en las últimas 2hs)

Este sistema crea un ecosistema completo donde votar es solo el comienzo de una experiencia gamificada memorable! 🎵✨
