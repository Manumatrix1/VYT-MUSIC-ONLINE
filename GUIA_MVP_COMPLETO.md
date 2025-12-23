# 🚀 MVP Crítico Implementado - Sistema de Certamen

**Fecha:** 27 de Enero de 2025  
**Estado:** ✅ COMPLETO y DESPLEGADO

---

## 📋 Resumen de Implementación

Se completaron los **3 elementos críticos** necesarios para lanzar el certamen de Santa Fe:

### ✅ 1. Campo de Región en Inscripción
- **Archivo:** `inscripcion-unificada.html`
- **Ubicación:** Líneas 117-134 (HTML), 475-510 (JavaScript)
- **Funcionalidad:**
  - Selector dropdown con 3 opciones: Norte, Centro, Sur
  - Pre-selección automática basada en la ciudad detectada
  - Color coding por región (Norte: rojo, Centro: teal, Sur: verde)
  - Permite cambio manual si la detección automática falla
  - Los campos `region` y `codigoRegion` se guardan en Firestore (líneas 800-802)

### ✅ 2. Cálculo Automático del 40%
- **Archivo:** `functions/index.js` (líneas 496-653)
- **Función:** `calcularClasificados`
- **Endpoint:** `https://us-central1-vytonlineprueva.cloudfunctions.net/calcularClasificados`
- **Uso:**
  ```bash
  # Ejecutar desde Postman o código:
  POST https://us-central1-vytonlineprueva.cloudfunctions.net/calcularClasificados
  Content-Type: application/json
  
  {
    "certamenId": "santafe_2025",
    "fase": 2
  }
  ```
- **Qué hace:**
  1. Lee configuración (porcentaje de clasificación: 40%)
  2. Obtiene todos los participantes con estado "aprobado"
  3. Agrupa por región (norte/centro/sur)
  4. Ordena por votos (descendente)
  5. Calcula top 40% de cada región
  6. Actualiza estado a "semifinalista"
  7. Guarda histórico en `historial_clasificaciones`

### ✅ 3. Panel Básico de Jurado
- **Archivo:** `jurado.html`
- **URL:** `https://vytonlineprueva.web.app/jurado.html`
- **Características:**
  - Dashboard con estadísticas (total, evaluados, pendientes, progreso)
  - Lista de semifinalistas con filtros:
    - Por región (Norte/Centro/Sur)
    - Por estado (Pendientes/Evaluados)
    - Ordenar por nombre, votos o fecha
  - Modal de evaluación con:
    - Video de YouTube embebido
    - 4 criterios de evaluación (1-5 estrellas cada uno):
      * Técnica vocal
      * Interpretación y emoción
      * Presencia escénica
      * Calidad de producción
    - Campo de comentarios opcional
    - Puntuación total automática (máximo 20 puntos)
  - Guarda evaluaciones en colección `evaluaciones_jurado`
  - Permite editar evaluaciones previas

### ✅ 4. Página de Estado del Certamen (BONUS)
- **Archivo:** `estado-certamen.html`
- **URL:** `https://vytonlineprueva.web.app/estado-certamen.html`
- **Características:**
  - Countdown dinámico según la fase actual
  - Visualización de las 4 fases con estado (completada/activa/pendiente)
  - Barra de progreso global
  - Sección personalizada para participantes inscritos:
    - Votos recibidos
    - Posición regional
    - Badge de estado (Inscrito/Aprobado/Semifinalista/Finalista)
    - Mensaje contextual según fase actual
  - CTA para inscribirse o ver ranking

---

## 🎯 Cómo Usar el Sistema (Flujo Completo)

### **FASE 1: Inscripción**

1. **Los artistas se inscriben:**
   - URL: `https://vytonlineprueva.web.app/inscripcion-unificada.html`
   - Completan datos personales (detecta región automáticamente)
   - Suben link de YouTube
   - Realizan pago de inscripción

2. **Admin aprueba inscripciones:**
   - URL: `https://vytonlineprueva.web.app/admin.html`
   - Ve lista de inscripciones pendientes
   - Cambia estado de "pendiente" a "aprobado"

### **FASE 2: Clasificación (Votación Pública)**

1. **Los participantes comparten sus videos**
   - Pueden ver su estado en: `https://vytonlineprueva.web.app/estado-certamen.html`
   - Ven countdown para el cierre de votación

2. **El público vota:**
   - URL: `https://vytonlineprueva.web.app/ranking.html`
   - Cada voto suma puntos

3. **Al finalizar la fase, ejecutar cálculo del 40%:**
   ```bash
   # Desde Postman o terminal con curl:
   curl -X POST https://us-central1-vytonlineprueva.cloudfunctions.net/calcularClasificados \
     -H "Content-Type: application/json" \
     -d '{"certamenId":"santafe_2025","fase":2}'
   ```
   - Esto automáticamente:
     - Calcula el top 40% por región
     - Cambia estado a "semifinalista"
     - Guarda histórico

### **FASE 3: Jurado Evalúa Semifinalistas**

1. **Crear usuarios jurados:**
   - Manualmente agregar documentos en Firestore:
     ```
     Colección: jurados
     Documento: {userId del jurado}
     Datos: {
       nombre: "Juan Pérez",
       email: "juan@jurado.com",
       rol: "jurado",
       activo: true
     }
     ```

2. **Jurados evalúan:**
   - URL: `https://vytonlineprueva.web.app/jurado.html`
   - Login con cuenta de jurado
   - Ven todos los semifinalistas
   - Evalúan uno por uno (4 criterios, 5 estrellas c/u)
   - Dejan comentarios opcionales

3. **Ver evaluaciones:**
   - Admin puede consultar `evaluaciones_jurado` en Firestore
   - Calcular promedio de puntuaciones para determinar finalistas

### **FASE 4: Final Provincial**

1. **Seleccionar finalistas:**
   - Admin revisa puntuaciones del jurado
   - Cambia estado de los mejores a "finalista"

2. **Evento final:**
   - Si es presencial: configurar en `configuracion-sistema.html` → Tab "Certamen"
   - Si es online: organizar streaming

---

## 📊 Estructura de Datos en Firestore

### Colección: `inscripciones`
```javascript
{
  userId: "abc123",
  userEmail: "artista@email.com",
  categoria: "Juvenil",
  generos: ["Pop", "Rock"],
  tituloCancion: "Mi Canción",
  videoURL: "https://youtube.com/...",
  modalidad: "online",
  
  // NUEVO: Datos de región
  provincia: "Santa Fe",
  ciudad: "Rosario",
  region: "Sur de Santa Fe",
  codigoRegion: "sur",
  codigoProvincia: "SF",
  
  nombreArtista: "Juan Pérez",
  fechaInscripcion: timestamp,
  
  // Estados: "pendiente" → "aprobado" → "semifinalista" → "finalista"
  estado: "semifinalista",
  fase_actual: 3,
  
  votos: 150,
  posicion_regional: 5
}
```

### Colección: `evaluaciones_jurado`
```javascript
{
  juradoId: "jurado123",
  participanteId: "participante456",
  
  // Puntuaciones (1-5 cada una)
  tecnica: 4,
  interpretacion: 5,
  presencia: 4,
  produccion: 3,
  puntuacionTotal: 16,
  
  comentarios: "Excelente interpretación...",
  fechaEvaluacion: timestamp
}
```

### Colección: `historial_clasificaciones`
```javascript
{
  certamenId: "santafe_2025",
  fase: 2,
  fecha: timestamp,
  porcentaje: 40,
  totalClasificados: 48,
  resultados: {
    norte: {
      total: 45,
      clasificados: 18,
      listado: [...]
    },
    centro: {
      total: 55,
      clasificados: 22,
      listado: [...]
    },
    sur: {
      total: 20,
      clasificados: 8,
      listado: [...]
    }
  }
}
```

---

## 🔧 Configuración del Certamen

**URL Admin:** `https://vytonlineprueva.web.app/configuracion-sistema.html`

### Tab "Certamen" - Configuración crítica:

1. **Información básica:**
   - Nombre del certamen
   - Provincia
   - Descripción

2. **Fases (con fechas):**
   - Fase 1: Inscripción (inicio y fin)
   - Fase 2: Clasificación (inicio y fin)
   - Fase 3: Jurado (inicio y fin)
   - Fase 4: Final (fecha del evento)

3. **División geográfica:**
   - ☑ Norte
   - ☑ Centro
   - ☑ Sur
   - (Desactivar regiones si no se usan)

4. **Porcentaje de clasificación:**
   - Por defecto: 40%
   - Se aplica a cada región individualmente

5. **Modalidades:**
   - Semifinal: Evaluación directa o Duelos
   - Final: Online (streaming) o Presencial (con entradas)

**Importante:** Guardar cambios antes de lanzar el certamen.

---

## ✅ Checklist para Lanzar Santa Fe

- [x] Configurar certamen en `configuracion-sistema.html`
- [x] Establecer fechas de las 4 fases
- [x] Activar regiones (Norte/Centro/Sur)
- [x] Verificar que inscripción guarda región correctamente
- [x] Probar cálculo del 40% en modo test
- [x] Crear usuarios jurados en Firestore
- [x] Probar panel de jurado con video de prueba
- [x] Configurar precios y premios (otros tabs del admin)
- [ ] **Promocionar el certamen en redes**
- [ ] **Recibir inscripciones**
- [ ] **Ejecutar el resto del flujo**

---

## 🚨 Tareas Post-Lanzamiento

### Corto Plazo (1-2 semanas):
1. Implementar sistema de duelos visual (opcional)
2. Mejorar ranking en tiempo real
3. Agregar notificaciones por email (cambio de fase, clasificación, etc.)
4. Dashboard de analytics para el admin

### Mediano Plazo (1 mes):
1. Sistema de pagos automático (MercadoPago integración completa)
2. Multi-provincia simultánea
3. Sistema de streaming en vivo
4. App móvil nativa

### Largo Plazo (3 meses):
1. Competencia nacional con ganadores provinciales
2. Sistema de sponsors y publicidad
3. Marketplace de servicios para artistas
4. Gamificación avanzada

---

## 📞 Soporte Técnico

**Archivos Clave:**
- Inscripción: `inscripcion-unificada.html`
- Admin: `admin.html`
- Configuración: `configuracion-sistema.html`
- Jurado: `jurado.html`
- Estado: `estado-certamen.html`
- Functions: `functions/index.js`

**Logs:**
- Functions: Firebase Console → Functions
- Hosting: Firebase Console → Hosting
- Database: Firebase Console → Firestore Database

**Backup recomendado:**
- Exportar Firestore antes de cada fase crítica
- Guardar evaluaciones del jurado en JSON local

---

## 🎉 Sistema Listo para Producción

**El MVP está completo y funcional.** Ahora podés:
1. Configurar el certamen
2. Abrir inscripciones
3. Recibir participantes
4. Calcular clasificados
5. Evaluar con el jurado
6. Realizar la final

**¡Éxito con el lanzamiento de Santa Fe!** 🚀🎤
