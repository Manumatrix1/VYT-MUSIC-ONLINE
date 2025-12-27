# ✅ CHECKLIST DE VERIFICACIÓN DEL SISTEMA

**Fecha:** 27 de diciembre de 2025

---

## 🔍 VERIFICACIONES AUTOMÁTICAS

### Test 1: Verificar Firebase Config en consola

**Abre la consola JavaScript (F12) en cualquier página y ejecuta:**

```javascript
// Script de verificación de Firebase
console.log('=== VERIFICACIÓN FIREBASE ===');
console.log('API Key:', firebase.app().options.apiKey);
console.log('Project ID:', firebase.app().options.projectId);
console.log('Storage Bucket:', firebase.app().options.storageBucket);

// Verificación
const expectedApiKey = 'AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk';
const expectedProjectId = 'vytonlineprueva';

if (firebase.app().options.apiKey === expectedApiKey && 
    firebase.app().options.projectId === expectedProjectId) {
    console.log('✅ Firebase Config CORRECTO');
} else {
    console.log('❌ Firebase Config INCORRECTO');
    console.log('PROBLEMA: Config no coincide con proyecto principal');
}
```

**Resultado esperado:**
```
=== VERIFICACIÓN FIREBASE ===
API Key: AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk
Project ID: vytonlineprueva
Storage Bucket: vytonlineprueva.firebasestorage.app
✅ Firebase Config CORRECTO
```

**Si ves ❌:** Ese archivo HTML tiene config diferente. Ver AUDITORIA_FIREBASE_CONFIG.md

---

### Test 2: Verificar conexión a Firestore

**En la consola ejecuta:**

```javascript
console.log('=== VERIFICACIÓN FIRESTORE ===');

// Obtener referencia de Firestore
const db = firebase.firestore();

// Intentar lectura de prueba
db.collection('system_config').limit(1).get()
  .then(snapshot => {
    if (snapshot.empty) {
      console.log('⚠️ Firestore vacío o no inicializado');
    } else {
      console.log('✅ Conexión a Firestore OK');
      console.log('Documentos encontrados:', snapshot.size);
    }
  })
  .catch(error => {
    console.log('❌ Error conectando a Firestore:', error.message);
  });
```

**Resultado esperado:**
```
=== VERIFICACIÓN FIRESTORE ===
✅ Conexión a Firestore OK
Documentos encontrados: 3
```

**Si ves ❌:** Problema de conexión. Verificar autenticación y reglas de Firestore.

---

### Test 3: Verificar Storage

**En la consola ejecuta:**

```javascript
console.log('=== VERIFICACIÓN STORAGE ===');

const storage = firebase.storage();
const ref = storage.ref('test');

ref.getMetadata()
  .then(() => {
    console.log('⚠️ Prueba no concluyente');
  })
  .catch(error => {
    if (error.code === 'storage/object-not-found') {
      console.log('✅ Storage conectado (objeto test no existe, es normal)');
    } else {
      console.log('❌ Error en Storage:', error.message);
    }
  });
```

**Resultado esperado:**
```
=== VERIFICACIÓN STORAGE ===
✅ Storage conectado (objeto test no existe, es normal)
```

---

### Test 4: Verificar Autenticación

**En la consola ejecuta:**

```javascript
console.log('=== VERIFICACIÓN AUTENTICACIÓN ===');

const auth = firebase.auth();
const user = auth.currentUser;

if (user) {
  console.log('✅ Usuario autenticado');
  console.log('UID:', user.uid);
  console.log('Email:', user.email);
} else {
  console.log('ℹ️ Sin usuario autenticado (es normal si no has hecho login)');
  console.log('✅ Auth disponible y funcional');
}
```

**Resultado esperado:**
```
=== VERIFICACIÓN AUTENTICACIÓN ===
✅ Usuario autenticado
UID: abc123xyz
Email: usuario@example.com
```

O:

```
ℹ️ Sin usuario autenticado (es normal si no has hecho login)
✅ Auth disponible y funcional
```

---

## 📋 CHECKLIST MANUAL

### ✅ FUNCIONALIDADES A VERIFICAR

- [ ] **Inscripción**
  - [ ] Acceder a `inscripcion-unificada.html`
  - [ ] Completar formulario
  - [ ] Subir video (debe aparecer en Storage)
  - [ ] Datos guardan en Firestore

- [ ] **Admin Panel**
  - [ ] Acceder a `admin.html`
  - [ ] Login con credenciales admin
  - [ ] Ver participantes en lista
  - [ ] Crear participante test (opcional)
  - [ ] Cambiar estado de participante

- [ ] **Votación**
  - [ ] Acceder a `certamenes.html`
  - [ ] Ver lista de participantes
  - [ ] Poder votar
  - [ ] Ver voto registrado

- [ ] **Ranking**
  - [ ] Acceder a `ranking.html`
  - [ ] Ver actualización en tiempo real
  - [ ] Posiciones correctas

- [ ] **Perfil de Usuario**
  - [ ] Acceder a `perfil-artista.html`
  - [ ] Ver datos del usuario
  - [ ] Poder editar perfil (si está permitido)

- [ ] **Configuración**
  - [ ] Acceder a `configuracion-sistema.html`
  - [ ] Ver configuración actual
  - [ ] Poder cambiar configuración (si es admin)

---

## 🔐 VERIFICACIONES DE SEGURIDAD

### Test 1: Verificar Rate Limiting

**Ubicación:** `functions/index.js` línea 6

**Buscar:**
```javascript
const { withRateLimit } = require('./rate-limiter');
```

**Status:**
- [ ] ✅ DESCOMENTADA (Correcto)
- [ ] ❌ COMENTADA (Necesita fix)

**Si está comentada:**
→ Ver: PLAN_ACCION_INMEDIATO.md → TAREA 3

---

### Test 2: Verificar Firestore Rules

**Ubicación:** `firestore.rules`

**Debe contener reglas de seguridad. Buscar:**
- [ ] Autenticación requerida
- [ ] Permisos por rol (admin vs usuario)
- [ ] Validación de datos

**Si está vacío:** Riesgo de seguridad crítico.

---

### Test 3: Verificar Storage Rules

**Ubicación:** `storage.rules`

**Debe contener reglas. Buscar:**
- [ ] Solo usuarios autenticados pueden subir
- [ ] Tamaño máximo de archivo
- [ ] Tipos de archivo permitidos

**Si está vacío:** Riesgo de seguridad crítico.

---

## 📊 VERIFICACIONES DE BASE DE DATOS

### Test 1: Verificar colecciones principales

**Abre Firebase Console → Firestore Database**

**Debes ver estas colecciones:**
- [ ] `system_config` (configuración)
- [ ] `system_stats` (estadísticas)
- [ ] `participantes_certamen` (participantes)
- [ ] `usuarios` (usuarios)
- [ ] `certamenes` (certámenes)
- [ ] `votos` (votos)
- [ ] `payment_logs` (registros de pago)

**Si falta alguna:** Ejecutar `init-database.js` para inicializar

---

### Test 2: Verificar integridad de datos

**En Firebase Console:**

Para `participantes_certamen`:
- [ ] Documentos tienen campos: nombre, email, estado
- [ ] Estado tiene valores válidos (pendiente_revision, aprobado, rechazado)
- [ ] created_at es timestamp

Para `usuarios`:
- [ ] Documentos tienen: email, nombre, role
- [ ] role es válido (usuario, admin, jurado)

---

## 🚀 VERIFICACIONES DE DEPLOYMENT

### Test 1: Verificar Firebase Hosting

**Ejecuta en terminal:**

```bash
firebase hosting:channel:list
```

**Debe mostrar canales activos**

### Test 2: Verificar Functions

**Ejecuta en terminal:**

```bash
firebase functions:list
```

**Debe listar funciones desplegadas**

### Test 3: Verificar estado general

**Ejecuta en terminal:**

```bash
firebase status
```

**Debe mostrar estado de todos los servicios**

---

## 📈 MATRIZ DE VERIFICACIÓN

| Componente | Test | Resultado | Status |
|-----------|------|-----------|--------|
| Firebase Config | Consola JS | Debe mostrar key correcta | ✅ o ❌ |
| Firestore | Consola JS | Debe conectar y leer | ✅ o ❌ |
| Storage | Consola JS | Debe estar disponible | ✅ o ❌ |
| Auth | Consola JS | Debe funcionar | ✅ o ❌ |
| Inscripción | Formulario | Debe guardar en DB | ✅ o ❌ |
| Admin | Login | Debe funcionar | ✅ o ❌ |
| Votación | Click | Debe registrar voto | ✅ o ❌ |
| Rate Limit | Código | Debe estar activo | ✅ o ❌ |

---

## 🎯 ACCIONES BASADAS EN RESULTADOS

### Si todo está ✅:
→ Sistema listo para desarrollo/testing

### Si hay ❌ en Firebase Config:
→ Ir a: AUDITORIA_FIREBASE_CONFIG.md

### Si hay ❌ en Rate Limiting:
→ Ir a: PLAN_ACCION_INMEDIATO.md → TAREA 3

### Si hay ❌ en múltiples áreas:
→ Ir a: PLAN_ACCION_INMEDIATO.md → Seguir plan completo

---

## 📝 REPORTE DE VERIFICACIÓN

**Usa este template para documentar tus verificaciones:**

```
=== REPORTE DE VERIFICACIÓN ===
Fecha: [HOY]
Testeador: [NOMBRE]

VERIFICACIONES AUTOMÁTICAS:
□ Firebase Config: ✅/❌
□ Firestore: ✅/❌
□ Storage: ✅/❌
□ Auth: ✅/❌

VERIFICACIONES MANUALES:
□ Inscripción: ✅/❌
□ Admin: ✅/❌
□ Votación: ✅/❌
□ Ranking: ✅/❌

VERIFICACIONES DE SEGURIDAD:
□ Rate Limiting: ✅/❌
□ Firestore Rules: ✅/❌
□ Storage Rules: ✅/❌

VERIFICACIONES DE BD:
□ Colecciones: ✅/❌
□ Datos: ✅/❌

RESULTADO FINAL:
□ Todo OK - Sistema listo
□ Problemas encontrados - Necesita fixes

PRÓXIMAS ACCIONES:
[Listar]
```

---

## 🔗 REFERENCIAS

- [AUDITORIA_FIREBASE_CONFIG.md](AUDITORIA_FIREBASE_CONFIG.md) - Si hay problemas de config
- [PLAN_ACCION_INMEDIATO.md](PLAN_ACCION_INMEDIATO.md) - Plan de estabilización
- [RESUMEN_EJECUTIVO_ANALISIS.md](RESUMEN_EJECUTIVO_ANALISIS.md) - Contexto general

---

**Checklist de verificación completado:** 27 de diciembre de 2025

Usa este archivo para verificar que todo funciona correctamente ANTES de hacer cambios.
