# 🚀 PLAN DE ACCIÓN INMEDIATO - VYT-MUSIC-ONLINE

**Fecha:** 27 de diciembre de 2025  
**Responsable:** Equipo de desarrollo

---

## 📌 TAREAS URGENTES (PRÓXIMAS 24 HORAS)

### ✅ TAREA 1: Crear Participante Test

**Estado:** LISTO PARA HACER

**Pasos:**
1. Abre `crear-test-participante.html` en navegador local
2. Haz clic en "Crear Participante TEST"
3. Se creará automáticamente en Firestore con datos de ejemplo
4. Copia el ID generado
5. Abre `admin.html` y verifica que aparezca en "Pendientes de revisión"

**Validación:** ✅ Participante visible en admin.html

**Tiempo:** 5-10 minutos

---

### ✅ TAREA 2: Verificar Configuración de Firebase (CRÍTICA)

**Status:** ⚠️ ENCONTRADO PROBLEMA - NECESITA FIX INMEDIATO

**Problema identificado:**
```
Hay múltiples configuraciones de Firebase diferentes:

ARCHIVO                          | API KEY (primeros 20 caracteres)
================================|================================
firebase-config.js (CORRECTO)    | AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6O...
admin.html (¿CORRECTO?)          | (usa firebase.initializeApp en script)
check-content.html (❌ DIFERENTE) | AIzaSyBpZ6zFtJlsKy6a5TJdZvN-yJGmWh...
init-database.js (❌ DIFERENTE)   | AIzaSyA9r6VUBdZ9V_4VX4DlQ1kXw0nQhZBj...
```

**ACCIÓN INMEDIATA:**

a) **Auditoría completa:**
```bash
# En PowerShell, buscar todas las ocurrencias de "apiKey"
grep -r "apiKey" --include="*.html" --include="*.js" .
```

b) **Identificar archivos problemáticos:**
- [ ] check-content.html → ¿POR QUÉ apiKey diferente?
- [ ] init-database.js → ¿POR QUÉ apiKey diferente?
- [ ] Otros archivos con config duplicada

c) **Unificar:**
- [ ] Usar SOLO `firebase-config.js` en todos los archivos
- [ ] Eliminar todas las configs hardcodeadas inline
- [ ] Crear `firebase-config-central.js` como fuente única de verdad

**Validación:** 
```javascript
// En consola del navegador:
console.log(firebase.app().options)
// Debe mostrar projectId: "vytonlineprueva" SIEMPRE
```

**Tiempo:** 1-2 horas

---

### ✅ TAREA 3: Reactivar Rate Limiting (SEGURIDAD CRÍTICA)

**Problema:** Rate limiting está comentado en `functions/index.js`

**Código actual:**
```javascript
// const { withRateLimit } = require('./rate-limiter'); // COMENTADO TEMPORALMENTE
```

**ACCIÓN:**

1. Abre `functions/index.js`
2. Descomenta la línea:
```javascript
const { withRateLimit } = require('./rate-limiter');
```

3. Envuelve las funciones vulnerables:
```javascript
// ANTES:
exports.processPayment = functions.https.onCall(async (request) => {
  // ... lógica
});

// DESPUÉS:
exports.processPayment = withRateLimit(functions.https.onCall(async (request) => {
  // ... lógica
}), { maxRequests: 5, windowMs: 60000 });
```

4. Hace el mismo con:
   - [ ] healthCheck
   - [ ] initializeFirestoreStructure
   - [ ] Cualquier endpoint que acepte requests públicas

5. Deploy a Firebase:
```bash
cd functions
npm install
firebase deploy --only functions
```

**Validación:** Verificar que rate-limiter.js existe y funciona

**Tiempo:** 1-2 horas (incluyendo deploy)

---

### ✅ TAREA 4: Crear Esquema de Firestore (DOCUMENTACIÓN)

**Crear archivo:** `docs/firestore-schema.md`

**Contenido obligatorio:**

```markdown
# 📊 Esquema de Firestore - VYT Music Online

## Colección: participantes_certamen

### Estructura:
```json
{
  "document_id": "test_1234567890",
  "nombre": "string",
  "email": "string",
  "cancion": "string",
  "artista_original": "string",
  "estado": "pendiente_revision|aprobado|rechazado",
  "certamen_id": "string",
  "fecha_inscripcion": "timestamp",
  "pais": "string",
  "provincia": "string",
  "ciudad": "string",
  "edad": "number",
  "url_video": "string (Firebase Storage path)",
  "precio": "number",
  "metodo_pago": "mercadopago|transferencia",
  "pago_estado": "pendiente|completado|fallido",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Índices recomendados:
- [ ] `estado` (ascending)
- [ ] `certamen_id, estado` (compound)
- [ ] `fecha_inscripcion` (descending)

---

## Colección: usuarios

### Estructura:
```json
{
  "document_id": "uid_de_firebase",
  "email": "string",
  "nombre": "string",
  "role": "usuario|admin|jurado",
  "perfil_artista": {
    "bio": "string",
    "avatar_url": "string",
    "redes_sociales": {}
  },
  "estadisticas": {
    "votos_dados": "number",
    "votos_recibidos": "number",
    "certamenes_participados": "number",
    "balance_vyt_money": "number"
  },
  "created_at": "timestamp"
}
```

---

## [CONTINUAR CON OTRAS COLECCIONES...]
```

**Tiempo:** 2-3 horas

---

## 📋 TAREAS ESTA SEMANA

### TAREA 5: Verificar y Documentar Flujos de Pago

**Responsable:** Alguien con acceso a MercadoPago

**Checklist:**
- [ ] Completar inscripción de participante
- [ ] Ver opción "Aprobar + Pagar" en admin
- [ ] Ejecutar pago test en MercadoPago Sandbox
- [ ] Verificar webhook en `functions/index.js`
- [ ] Confirmar que estado cambia a "pagado"

**Documento:** Grabar pasos exactos en `docs/FLUJO-PAGO.md`

---

### TAREA 6: Crear README.md Completo

**Estructura:**
```markdown
# VYT Music Online - Certamen de Canto Online

## 🎯 Descripción
[Descripción breve del proyecto]

## 📦 Requisitos
- Node.js 18+
- Firebase CLI
- Navegador moderno

## 🚀 Instalación

### 1. Clonar repositorio
git clone ...

### 2. Instalar dependencias
npm install
cd functions && npm install && cd ..

### 3. Configurar Firebase
firebase init
firebase login

### 4. Iniciar en desarrollo
firebase emulators:start

### 5. Abrir en navegador
http://localhost:5000

## 📚 Documentación
- [Arquitectura](docs/ARQUITECTURA.md)
- [Esquema Firestore](docs/firestore-schema.md)
- [Flujos de negocio](docs/FLUJOS.md)
- [API Functions](docs/API.md)

## 🔧 Desarrollo

### Estructura
[Explicar estructura de carpetas]

### Scripts principales
[Listar comandos npm]

## 🚀 Deployment
firebase deploy

## 📞 Soporte
[Contacto, issues, etc]
```

**Tiempo:** 2-3 horas

---

### TAREA 7: Iniciar Refactorización de admin.js

**Antes de empezar:**
- [ ] Hacer backup: `cp admin.js admin.js.backup-2025-12-27`
- [ ] Crear rama git: `git checkout -b refactor/split-admin`

**Plan:**
1. Analizar admin.js y agrupar código por responsabilidad
2. Crear carpeta: `admin/`
3. Extraer módulos:
   - [ ] `admin/auth.js` (200 líneas)
   - [ ] `admin/participants.js` (400 líneas)
   - [ ] `admin/competitions.js` (300 líneas)
   - [ ] `admin/payments.js` (200 líneas)
   - [ ] `admin/content.js` (400 líneas)
   - [ ] `admin/analytics.js` (200 líneas)
   - [ ] `admin/sessions.js` (100 líneas)
   - [ ] `admin/index.js` (100 líneas - orquestador)

4. Crear archivo: `admin-refactored.html` (versión nueva)
5. Testing comparativo
6. Migración gradual o cutover

**Tiempo:** 12-15 horas

---

## 🎯 CHECKLIST FINAL

### Esta semana:
- [ ] Crear participante test ✅
- [ ] Auditoría de configuración Firebase
- [ ] Unificar config Firebase
- [ ] Reactivar rate limiting
- [ ] Documentar esquema Firestore
- [ ] Completar flujo de pago
- [ ] Escribir README

### Próxima semana:
- [ ] Iniciar refactorización admin.js
- [ ] Crear tests básicos
- [ ] Mejorar Functions
- [ ] Configurar CI/CD

---

## 📊 MATRIZ DE RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|-----------|
| Config Firebase inconsistente causa datos dispersos | 🔴 Alta | 🔴 Crítico | ✅ HACER HOY |
| Rate limiting off permite spam/DDoS | 🔴 Alta | 🔴 Crítico | ✅ HACER HOY |
| admin.js monolítico imposible de mantener | 🟠 Media | 🔴 Crítico | ✅ HACER ESTA SEMANA |
| Pagos fallidos por datos inconsistentes | 🟠 Media | 🟠 Crítico | ✅ VERIFICAR HOY |
| Falta de testing causa regresiones | 🟠 Media | 🟠 Alto | HACER PRÓX. 2 SEMANAS |

---

**Plan actualizado:** 27 de diciembre de 2025  
**Próxima revisión:** 30 de diciembre de 2025
