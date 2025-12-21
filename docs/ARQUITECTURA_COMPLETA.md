# 🎯 ARQUITECTURA COMPLETA - VYT MUSIC CERTÁMENES

## 📐 Visión General del Sistema

Sistema de certámenes musicales multi-fase con opcionalidad de eventos presenciales y votación paga. Escalable desde nivel regional hasta nacional.

---

## 🗺️ 1. SISTEMA DE ZONAS GEOGRÁFICAS

### Estructura Jerárquica
```
País (Argentina)
  └── Provincia (Santa Fe, Buenos Aires, Córdoba...)
       └── Región (Norte, Centro, Sur)
            └── Ciudad (Rosario, Rafaela, Reconquista...)
```

### Clasificación Automática
- **Input**: Ciudad + Provincia del artista
- **Output**: Región automática según base de datos
- **Ejemplo**: 
  - "Rosario, Santa Fe" → **Sur de Santa Fe**
  - "Santa Fe Capital" → **Centro de Santa Fe**
  - "Reconquista, Santa Fe" → **Norte de Santa Fe**

### Cupos por Nivel
```javascript
Regional (por región):
  - Norte:  Top 35 avanzan
  - Centro: Top 35 avanzan  
  - Sur:    Top 35 avanzan
  = 105 participantes pasan a PROVINCIAL

Provincial:
  - Top 30 de 105 avanzan a NACIONAL
  
Nacional:
  - Top 10 de todas las provincias
  - FINAL NACIONAL
```

---

## 🏆 2. SISTEMA DE FASES

### Fase 1: REGIONAL (Norte/Centro/Sur)

**Características:**
- ✅ Inscripción abierta (pago obligatorio)
- ✅ Votación pública (cuesta VYT Money)
- ✅ Duración: 30 días
- ✅ **OPCIONAL**: Evento presencial semifinal

**Flujo:**
1. Artista se inscribe en su región
2. Sube video
3. Admin aprueba/rechaza
4. Si aprueba → Artista paga $15,000
5. Video publicado en ranking regional
6. Fans votan (1000 VYT Money por voto)
7. Termina votación → Top 35 avanzan

**Opciones del Admin:**
```javascript
Modo ONLINE:
  - Solo ranking digital
  - Jurado ve top 30 online
  - Ganadores se anuncian por streaming

Modo PRESENCIAL:
  - Alquilar teatro/salón
  - Invitar top 30 a cantar en vivo
  - Vender entradas al público
  - Jurado presencial
  - Transmisión en streaming

Modo HÍBRIDO:
  - Semifinal presencial con top 15
  - Otros 15 quedan en ranking online
  - Final presencial con top 5
```

### Fase 2: PROVINCIAL

**Características:**
- ❌ NO hay nueva inscripción (entran los top 35 de cada región)
- ✅ Votación pública continúa
- ✅ Duración: 30 días
- ✅ **OPCIONAL**: Evento presencial final provincial

**Participantes:**
- 35 de Norte + 35 de Centro + 35 de Sur = **105 artistas**
- Votos regionales se mantienen o resetean (configurable)
- Top 30 más votados son evaluados por jurado

**Opciones del Admin:**
```javascript
Opción 1 - ONLINE:
  - Los 105 siguen ranqueando digitalmente
  - Jurado ve top 30 por video
  - Ganadores: 10 pasan a NACIONAL

Opción 2 - PRESENCIAL:
  - Evento grande con top 30 en vivo
  - Teatro de 500+ personas
  - Venta de entradas ($5,000 c/u)
  - Premios provinciales + clasificación nacional
```

### Fase 3: NACIONAL

**Características:**
- ❌ NO hay inscripción (solo ganadores provinciales)
- ✅ Votación pública final
- ✅ Duración: 45 días
- ✅ **Gran Final Presencial** (recomendado)

**Participantes:**
- 10 de Santa Fe + 10 de Córdoba + 10 de Buenos Aires... = **Top Nacional**
- Máxima visibilidad mediática
- Pozo millonario

**Recomendación:**
```javascript
FINAL NACIONAL PRESENCIAL:
  - Estadio Luna Park / Teatro Ópera / Similar
  - Capacidad: 2,000+ personas
  - Entradas: $15,000 - $50,000
  - Transmisión nacional
  - Jurado famoso
  - Premios grandes ($5M+)
```

---

## 💰 3. MODELO DE NEGOCIO

### Fuentes de Ingreso

#### A. Inscripciones de Artistas
```
100 artistas × $15,000 = $1,500,000 por región
3 regiones × $1,500,000 = $4,500,000 por provincia (fase regional)
```

#### B. Votos del Público
```
1 voto = 1000 VYT Money
1000 VYT Money = $1,500 (precio de compra)
1 voto vale $1,000 (valor de uso interno)

Margen: $500 por voto (33% ganancia)

Ejemplo con 500 votos totales:
  - Recaudación: 500 × $1,500 = $750,000
  - Al pozo: 500 × $1,000 = $500,000
  - Ganancia VYT: $250,000
```

#### C. Entradas a Eventos Presenciales
```
Teatro 300 personas × $5,000 = $1,500,000
Distribución:
  - 30% al pozo: $450,000
  - 40% costos evento: $600,000 (alquiler, producción, etc.)
  - 30% ganancia VYT: $450,000
```

#### D. YouTube AdSense (Pasivo)
```
100 videos × 50,000 views promedio = 5,000,000 views totales
CPM Argentina: $1-3 USD
Ingreso estimado: $5,000 - $15,000 USD mensuales
```

### Cálculo de Pozo (Ejemplo Real)

**Certamen Regional Sur de Santa Fe:**
```
Inscripciones: 100 × $15,000        = $1,500,000
Votos: 800 × $1,000                 = $800,000
Entradas semifinal: 300 × $5,000×30% = $450,000
─────────────────────────────────────────────────
POZO TOTAL:                          $2,750,000

Distribución:
  🥇 1er lugar (50%): $1,375,000
  🥈 2do lugar (30%): $825,000
  🥉 3er lugar (20%): $550,000
```

**Ganancia VYT Music:**
```
Margen votos: $400,000
Entradas (30%): $450,000
YouTube AdSense: $10,000
Patrocinios locales: $200,000
─────────────────────────────
TOTAL NETO: $1,060,000
```

---

## 🔄 4. FLUJO COMPLETO DEL USUARIO

### 👤 Perspectiva: ARTISTA

```
1. REGISTRO
   ├─ Crear cuenta (email/password)
   ├─ Completar perfil con ciudad/provincia
   └─ Sistema detecta región automáticamente

2. INSCRIPCIÓN A CERTAMEN
   ├─ Ve certámenes de su región en certamenes.html
   ├─ Click "Quiero Participar"
   ├─ Sube video (máx 5 min)
   └─ Estado: "PENDIENTE DE APROBACIÓN"

3. EVALUACIÓN (Admin revisa)
   ├─ Admin ve video en admin.html
   ├─ Evalúa calidad técnica y artística
   └─ Decisión: APROBAR ✅ o RECHAZAR ❌

4. PAGO (Si fue aprobado)
   ├─ Recibe notificación: "¡Video aprobado!"
   ├─ Redirige a página de pago
   ├─ Paga $15,000 vía MercadoPago
   └─ Estado: "PARTICIPANDO" 🎵

5. RANKING Y VOTACIÓN
   ├─ Video publicado en ranking.html
   ├─ Aparece en ranking de su región
   ├─ Puede ver su posición en tiempo real
   └─ Comparte en redes para conseguir votos

6. PROMOCIÓN
   ├─ Artista difunde en Instagram/TikTok/Facebook
   ├─ Pide a fans que voten
   └─ Fans compran VYT Money y votan

7. CIERRE DE VOTACIÓN
   ├─ Termina período de 30 días
   ├─ Se congela el ranking
   └─ Espera decisión del jurado

8. JURADO (Si está en Top 30)
   ├─ Recibe invitación a fase de jurado
   ├─ Si es presencial: invitación al evento
   └─ Espera resultados

9. RESULTADOS
   ├─ Anuncio de ganadores
   ├─ Si está en Top 35: pasa a PROVINCIAL
   └─ Si gana: recibe premio en cuenta

10. SIGUIENTE FASE (Si clasificó)
    ├─ Automáticamente inscrito en provincial
    ├─ No paga nueva inscripción
    └─ Empieza nueva votación
```

### 💙 Perspectiva: FAN

```
1. DESCUBRIMIENTO
   ├─ Entra a la web sin registrarse
   ├─ Ve ranking.html con artistas
   └─ Puede navegar libremente

2. VOTACIÓN
   ├─ Click "Votar" en su artista favorito
   ├─ Sistema pide login/registro
   └─ Verifica balance de VYT Money

3. COMPRA DE VYT MONEY
   ├─ Si no tiene: redirige a comprar-vyt-money.html
   ├─ Elige paquete (100, 500, 1000, 2000 tokens)
   ├─ Paga con MercadoPago
   └─ Tokens acreditados instantáneamente

4. CONFIRMAR VOTO
   ├─ Sistema descuenta 1000 VYT Money
   ├─ Voto se registra
   ├─ Contador del artista sube +1
   └─ Posición en ranking se actualiza

5. COMPARTIR
   ├─ Fan comparte en redes
   ├─ "¡Voté por [Artista]! Vos también podés votar"
   └─ Genera efecto viral

6. COMPRAR ENTRADA (Si hay evento presencial)
   ├─ Ve banner "Semifinal en Teatro Municipal"
   ├─ Click "Comprar Entrada"
   ├─ Paga con MercadoPago
   ├─ Recibe entrada con QR por email
   └─ Presenta QR en puerta del evento
```

### 🎭 Perspectiva: ADMIN/ORGANIZADOR

```
1. CREAR CERTAMEN
   ├─ Login en admin.html
   ├─ Sección "Crear Nuevo Certamen"
   ├─ Configurar:
   │   ├─ Nombre: "Certamen Santa Fe 2025"
   │   ├─ Fase: Regional / Provincial / Nacional
   │   ├─ Región: Norte / Centro / Sur (si es regional)
   │   ├─ Tipo: Online / Presencial / Híbrido
   │   ├─ Fechas de inscripción
   │   ├─ Fechas de votación
   │   ├─ Costo inscripción: $15,000
   │   ├─ Costo voto: 1000 VYT Money
   │   └─ Cupos: Top 35 avanzan, Top 30 ve jurado
   └─ Guardar como "Draft"

2. CONFIGURAR EVENTO PRESENCIAL (Opcional)
   ├─ Activar modo "Presencial"
   ├─ Agregar:
   │   ├─ Nombre lugar: "Teatro Municipal"
   │   ├─ Dirección completa
   │   ├─ Capacidad: 300 personas
   │   ├─ Fecha y hora
   │   ├─ Precio entrada: $5,000
   │   └─ Link streaming (opcional)
   └─ Guardar

3. PUBLICAR CERTAMEN
   ├─ Cambiar estado de "Draft" → "Inscripción Abierta"
   ├─ Certamen aparece en certamenes.html
   └─ Artistas pueden inscribirse

4. REVISAR INSCRIPCIONES
   ├─ Admin recibe notificaciones
   ├─ Ve lista de videos pendientes
   ├─ Para cada video:
   │   ├─ Reproduce y evalúa
   │   ├─ Verifica calidad técnica
   │   ├─ Verifica contenido apropiado
   │   └─ Decisión: APROBAR o RECHAZAR
   └─ Si aprueba: artista recibe notificación de pago

5. MONITOREAR PAGOS
   ├─ Dashboard con estado de pagos
   ├─ Ver quiénes pagaron inscripción
   ├─ Confirmar pagos de MercadoPago
   └─ Activar participación al confirmar

6. SEGUIR RANKING EN TIEMPO REAL
   ├─ Dashboard con ranking actualizado
   ├─ Gráficos de votos por día
   ├─ Pozo actualizado en tiempo real
   └─ Estadísticas de participación

7. CERRAR VOTACIÓN
   ├─ Al cumplirse 30 días (o manual)
   ├─ Sistema congela ranking
   ├─ Extrae top 30 automáticamente
   └─ Notifica a jurado

8. VISTA DE JURADO
   ├─ Admin con rol "Jurado" accede
   ├─ Ve solo top 30 artistas
   ├─ Puede ver videos y perfiles
   ├─ Puntúa cada artista (1-10)
   └─ Sistema calcula promedio

9. ANUNCIAR GANADORES
   ├─ Ingresa resultados del jurado
   ├─ Sistema calcula premios del pozo
   ├─ Publica ganadores en página
   ├─ Envía notificaciones
   └─ Transfiere premios

10. PROMOVER A SIGUIENTE FASE
    ├─ Marca top 35 como "Clasificados"
    ├─ Crea certamen provincial automáticamente
    ├─ Invita a clasificados
    └─ Ciclo reinicia
```

---

## 🛠️ 5. IMPLEMENTACIÓN TÉCNICA

### Base de Datos Firestore

```javascript
// Colección: certamenes
{
  id: "cert_santafe_sur_2025",
  nombre: "Certamen Regional Sur de Santa Fe 2025",
  fase_actual: "REGIONAL",
  estado: "votacion",
  
  // Ubicación
  provincia: "santa_fe",
  region: "sur",  // null para provincial/nacional
  
  // Config
  tipo_fase: "hibrido",  // online | presencial | hibrido
  cupo_avanza: 35,
  cupo_jurado: 30,
  
  // Fechas
  fecha_inicio_inscripcion: Timestamp,
  fecha_fin_inscripcion: Timestamp,
  fecha_inicio_votacion: Timestamp,
  fecha_fin_votacion: Timestamp,
  
  // Costos
  costo_inscripcion: 15000,
  costo_voto: 1000,
  
  // Evento presencial
  evento_presencial: {
    nombre_lugar: "Teatro El Círculo",
    direccion: "Laprida 1235, Rosario",
    capacidad: 500,
    fecha: Timestamp,
    precio_entrada: 5000,
    entradas_vendidas: 287,
    tiene_streaming: true,
    url_streaming: "https://youtube.com/live/..."
  },
  
  // Pozo
  pozo: {
    inscripciones: 1500000,
    votos: 800000,
    entradas: 430500,
    total: 2730500
  },
  
  // Stats
  stats: {
    participantes_totales: 125,
    participantes_aprobados: 100,
    participantes_pagaron: 100,
    votos_totales: 800
  },
  
  // Ganadores
  ganadores: {
    primer_lugar: "user_abc123",
    segundo_lugar: "user_def456",
    tercer_lugar: "user_ghi789"
  }
}

// Colección: participantes_certamen
{
  id: "part_cert123_user456",
  certamen_id: "cert_santafe_sur_2025",
  user_id: "user_abc123",
  
  // Estado
  estado: "participando",  // pendiente | aprobado | rechazado | participando
  
  // Video
  video_url: "https://storage.googleapis.com/...",
  video_thumbnail: "...",
  
  // Pago
  pago_realizado: true,
  pago_monto: 15000,
  pago_fecha: Timestamp,
  payment_id: "MP-12345",
  
  // Ranking
  votos: 47,
  posicion: 12,
  posicion_anterior: 15,
  
  // Clasificación
  clasifico_siguiente_fase: false,
  invitado_evento_presencial: true,
  
  // Metadata
  inscrito_el: Timestamp,
  aprobado_el: Timestamp
}

// Colección: votos
{
  id: "voto_abc123",
  certamen_id: "cert_santafe_sur_2025",
  participante_id: "part_cert123_user456",
  votante_uid: "user_fan789",
  
  // Costo
  costo_vyt_money: 1000,
  
  // Metadata
  votado_el: Timestamp,
  ip_address: "181.x.x.x"
}

// Colección: entradas
{
  id: "entrada_abc123",
  certamen_id: "cert_santafe_sur_2025",
  evento_id: "evento_abc",
  comprador_uid: "user_fan456",
  
  // Entrada
  numero_entrada: "SNF-2025-001234",
  tipo: "general",
  precio: 5000,
  
  // QR y validación
  qr_code_url: "https://storage.googleapis.com/qr_abc.png",
  codigo_validacion: "VYT-CERT123-001234-XJ7K9-1735123456",
  usada: false,
  fecha_uso: null,
  
  // Pago
  estado_pago: "aprobado",
  payment_id: "MP-67890",
  
  // Metadata
  comprada_el: Timestamp
}
```

### Archivos JavaScript Clave

```
src/
├── zonas-argentina.js        ✅ CREADO
│   └── Detecta región automáticamente
│
├── certamen-workflow.js       ✅ CREADO
│   ├── Templates de certamen
│   ├── Lógica de fases
│   └── Cálculo de pozos
│
├── payment-handler.js         🔜 CREAR
│   ├── Pago de inscripción
│   ├── Compra de VYT Money
│   └── Compra de entradas
│
├── voting-system.js           🔜 CREAR
│   ├── Verificar balance VYT Money
│   ├── Registrar voto
│   └── Actualizar ranking
│
└── qr-generator.js            🔜 CREAR
    ├── Generar QR para entradas
    └── Validar en evento
```

---

## 📱 6. INTERFACES DE USUARIO

### A. certamenes.html (Página Pública)
```html
<!-- Filtros -->
<select id="filtro-provincia">
  <option>Todas las provincias</option>
  <option>Santa Fe</option>
  <option>Córdoba</option>
  ...
</select>

<select id="filtro-fase">
  <option>Todas las fases</option>
  <option>Regional</option>
  <option>Provincial</option>
  <option>Nacional</option>
</select>

<!-- Card de certamen -->
<div class="certamen-card">
  <h3>Certamen Regional Sur de Santa Fe 2025</h3>
  <p>📍 Rosario, Santa Fe</p>
  <p>🎭 Fase: Regional (Sur)</p>
  <p>⏰ Inscripción: Hasta 31/01/2025</p>
  <p>💰 Pozo actual: $2,730,500</p>
  
  <!-- Si hay evento presencial -->
  <div class="evento-badge">
    🎪 Semifinal Presencial
    📅 15/02/2025 - Teatro El Círculo
    🎟️ Entradas desde $5,000
  </div>
  
  <button class="btn-primary">Quiero Participar</button>
  <button class="btn-secondary">Ver Ranking</button>
</div>
```

### B. ranking.html (Ranking con Votación)
```html
<!-- Podio Top 3 -->
<div class="podio">
  <div class="segundo-lugar">
    🥈 #2 - María González
    ❤️ 245 votos
    <button class="votar-btn">Votar (1000 VYT)</button>
  </div>
  
  <div class="primer-lugar">
    🥇 #1 - Juan Pérez
    ❤️ 312 votos
    <button class="votar-btn">Votar (1000 VYT)</button>
  </div>
  
  <div class="tercer-lugar">
    🥉 #3 - Laura Martínez
    ❤️ 198 votos
    <button class="votar-btn">Votar (1000 VYT)</button>
  </div>
</div>

<!-- Resto del ranking -->
<div class="ranking-list">
  <!-- Artista #4 -->
  <div class="ranking-item">
    <span class="posicion">#4</span>
    <img src="..." class="avatar">
    <div class="info">
      <h4>Carlos Rodríguez</h4>
      <p>Rosario, Santa Fe</p>
    </div>
    <div class="stats">
      <span>❤️ 156 votos</span>
      <span class="tendencia">↑ +12</span>
    </div>
    <button class="votar-btn">Votar</button>
  </div>
  
  <!-- Más artistas... -->
</div>

<!-- Cupo para próxima fase -->
<div class="cupo-info">
  ⚠️ Solo los Top 35 avanzan a la fase provincial
  Quedan 7 días de votación
</div>
```

### C. admin.html - Sección Crear Certamen
```html
<div class="crear-certamen">
  <h2>Crear Nuevo Certamen</h2>
  
  <!-- Paso 1: Información Básica -->
  <div class="paso">
    <h3>1. Información Básica</h3>
    <input type="text" placeholder="Nombre del certamen">
    <textarea placeholder="Descripción"></textarea>
    <input type="file" accept="image/*" placeholder="Imagen de portada">
  </div>
  
  <!-- Paso 2: Ubicación y Fase -->
  <div class="paso">
    <h3>2. Ubicación y Fase</h3>
    
    <select id="fase">
      <option>Regional</option>
      <option>Provincial</option>
      <option>Nacional</option>
    </select>
    
    <select id="provincia">
      <option>Santa Fe</option>
      <option>Córdoba</option>
      ...
    </select>
    
    <!-- Solo si es Regional -->
    <select id="region">
      <option>Norte</option>
      <option>Centro</option>
      <option>Sur</option>
    </select>
  </div>
  
  <!-- Paso 3: Modalidad -->
  <div class="paso">
    <h3>3. Modalidad del Certamen</h3>
    
    <label>
      <input type="radio" name="tipo" value="online" checked>
      <div class="opcion-card">
        <h4>💻 Solo Online</h4>
        <p>Ranking digital y jurado online. Sin evento presencial.</p>
      </div>
    </label>
    
    <label>
      <input type="radio" name="tipo" value="presencial">
      <div class="opcion-card">
        <h4>🎭 Presencial</h4>
        <p>Evento en vivo con venta de entradas. Incluye streaming.</p>
      </div>
    </label>
    
    <label>
      <input type="radio" name="tipo" value="hibrido">
      <div class="opcion-card">
        <h4>🔄 Híbrido</h4>
        <p>Combina ranking online con semifinal/final presencial.</p>
      </div>
    </label>
  </div>
  
  <!-- Paso 4: Configurar Evento (si eligió presencial/híbrido) -->
  <div class="paso evento-config" style="display:none">
    <h3>4. Configurar Evento Presencial</h3>
    
    <input type="text" placeholder="Nombre del lugar (ej: Teatro Municipal)">
    <input type="text" placeholder="Dirección completa">
    <input type="number" placeholder="Capacidad (cantidad de butacas)">
    <input type="datetime-local" placeholder="Fecha y hora">
    <input type="number" placeholder="Precio entrada ($)">
    
    <label>
      <input type="checkbox" id="tiene-streaming">
      Transmitir por streaming
    </label>
    <input type="url" placeholder="URL del streaming (YouTube Live, etc.)">
  </div>
  
  <!-- Paso 5: Fechas -->
  <div class="paso">
    <h3>5. Fechas del Certamen</h3>
    
    <label>Inicio de inscripciones</label>
    <input type="date">
    
    <label>Fin de inscripciones</label>
    <input type="date">
    
    <label>Inicio de votación</label>
    <input type="date">
    
    <label>Fin de votación</label>
    <input type="date">
  </div>
  
  <!-- Paso 6: Costos y Cupos -->
  <div class="paso">
    <h3>6. Costos y Cupos</h3>
    
    <label>Costo de inscripción ($)</label>
    <input type="number" value="15000">
    
    <label>Costo de voto (VYT Money)</label>
    <input type="number" value="1000">
    
    <label>Top cuántos avanzan a siguiente fase</label>
    <input type="number" value="35">
    
    <label>Top cuántos ve el jurado</label>
    <input type="number" value="30">
  </div>
  
  <!-- Botones -->
  <div class="acciones">
    <button class="btn-secondary">Guardar como Borrador</button>
    <button class="btn-primary">Publicar Certamen</button>
  </div>
</div>
```

---

## ⚡ 7. PRÓXIMOS PASOS

### Sprint 1: Sistema de Zonas (2-3 días)
- [x] Crear base de datos de zonas ✅
- [ ] Modificar inscripción para detectar región automáticamente
- [ ] Agregar filtro de zonas en certamenes.html
- [ ] Actualizar perfil de artista con región

### Sprint 2: Pago de Inscripción (2-3 días)
- [ ] Crear flujo: aprobación → notificación → página de pago
- [ ] Integrar MercadoPago para inscripciones
- [ ] Estado "Pendiente de pago" en participantes
- [ ] Timeout: si no paga en 48hs → rechazado

### Sprint 3: Votación con VYT Money (2 días)
- [ ] Modificar botón "Votar" en ranking.html
- [ ] Verificar balance de VYT Money del usuario
- [ ] Descontar tokens y registrar voto
- [ ] Actualizar ranking en tiempo real
- [ ] Modal "Comprar VYT Money" si no tiene suficiente

### Sprint 4: Sistema de Fases (3 días)
- [x] Crear templates de certámenes ✅
- [ ] Admin puede crear certamen con configuración completa
- [ ] Lógica de promoción a siguiente fase
- [ ] Top N automático según configuración

### Sprint 5: Eventos Presenciales (3-4 días)
- [ ] Formulario configuración de evento en admin
- [ ] Sistema de venta de entradas
- [ ] Generación de QR codes
- [ ] Página de evento con detalles
- [ ] Validación de entradas en puerta

### Sprint 6: Cálculo de Pozo (1 día)
- [ ] Widget de pozo en tiempo real
- [ ] Mostrar en certamenes.html y admin.html
- [ ] Desglose: inscripciones + votos + entradas

### Sprint 7: Sistema de Roles (2 días)
- [ ] Agregar campo "rol" en users
- [ ] Middleware de permisos
- [ ] Vista jurado con solo top N
- [ ] Vista organizador regional

### Sprint 8: Testing y Refinamiento (3 días)
- [ ] Pruebas end-to-end
- [ ] Optimizar performance
- [ ] Ajustar UI/UX
- [ ] Documentación final

---

## 🎯 FECHA OBJETIVO: 15 de Enero 2026

Con trabajo dedicado de 4-6 horas diarias, el sistema completo estará funcionando para mediados de enero, a tiempo para lanzar el primer certamen en febrero.

---

## 📞 CONTACTO Y SOPORTE

Para dudas sobre la implementación:
- Revisar este documento
- Consultar código en `src/zonas-argentina.js` y `src/certamen-workflow.js`
- Testear en ambiente de desarrollo antes de producción

**¡Vamos a hacer historia en la industria musical argentina! 🚀🎤🇦🇷**
