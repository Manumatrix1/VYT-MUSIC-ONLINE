# 🔍 AUDITORÍA DE CONFIGURACIONES FIREBASE

**Fecha:** 27 de diciembre de 2025

---

## 📊 TABLA DE CONFIGURACIONES ENCONTRADAS

| Archivo | API Key | Project ID | Status |
|---------|---------|-----------|--------|
| `firebase-config.js` | AIzaSyB_LRm... | vytonlineprueva | ✅ PRINCIPAL |
| `admin.html` | AIzaSyAWOnR... | ¿? | ⚠️ DIFERENTE |
| `check-content.html` | AIzaSyBpZ6z... | ¿? | ⚠️ DIFERENTE |
| `init-database.js` | AIzaSyA9r6V... | vytonlineprueva | ⚠️ DIFERENTE |
| `login-artista.html` | AIzaSyB_LRm... | vytonlineprueva | ✅ OK |
| `test-tarea4-simple.html` | AIzaSyB_LRm... | vytonlineprueva | ✅ OK |
| `crear-test-participante.html` | AIzaSyB_LRm... | vytonlineprueva | ✅ OK |
| `firebase-debug.html` | AIzaSyB_LRm... | vytonlineprueva | ✅ OK |
| `configuracion-sistema.html` | AIzaSyB_LRm... | vytonlineprueva | ✅ OK |

---

## 🔴 PROBLEMAS CRÍTICOS ENCONTRADOS

### Problema 1: admin.html usa API Key DIFERENTE

**Archivo:** `admin.html`  
**Línea:** 17  
**API Key:** `AIzaSyAWOnR2xjr-UkJYUPiSUUcxF7Y5y3JXU8Y`  

**¿Por qué es un problema?**
- Podría conectar a OTRO proyecto Firebase
- Los datos de participantes/certámenes podrían estar en OTRO proyecto
- Admin puede no ver los datos correctos

**Solución recomendada:**
```javascript
// Cambiar de:
apiKey: "AIzaSyAWOnR2xjr-UkJYUPiSUUcxF7Y5y3JXU8Y",

// A:
apiKey: "AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk",
```

---

### Problema 2: check-content.html usa API Key DIFERENTE

**Archivo:** `check-content.html`  
**Línea:** 82  
**API Key:** `AIzaSyBpZ6zFtJlsKy6a5TJdZvN-yJGmWhkszGA`  

**¿Por qué es un problema?**
- Claramente es un proyecto DIFERENTE
- Probablemente es un proyecto de testing/desarrollo obsoleto

**Solución:**
- [ ] Verificar si este archivo se usa
- [ ] Si no se usa: ELIMINAR
- [ ] Si se usa: ACTUALIZAR con API key correcta

---

### Problema 3: init-database.js usa API Key DIFERENTE

**Archivo:** `init-database.js`  
**Línea:** 7  
**API Key:** `AIzaSyA9r6VUBdZ9V_4VX4DlQ1kXw0nQhZBj8mQ`  

**¿Por qué es un problema?**
- Este archivo inicializa la base de datos
- Si usa OTRO proyecto, inicializa la BD del proyecto equivocado
- Los datos críticos pueden estar fragmentados

**Solución:**
```javascript
// Cambiar de:
const firebaseConfig = {
  apiKey: "AIzaSyA9r6VUBdZ9V_4VX4DlQ1kXw0nQhZBj8mQ",
  ...
};

// A: Importar desde firebase-config.js
import { firebaseConfig } from './firebase-config.js';
```

---

## 📋 ARCHIVOS A REVISAR

### ✅ ARCHIVOS CORRECTO (usan API key principal)
```
✅ firebase-config.js
✅ login-artista.html
✅ test-tarea4-simple.html
✅ crear-test-participante.html
✅ firebase-debug.html
✅ configuracion-sistema.html
```

### ⚠️ ARCHIVOS A CORREGIR (usan API keys diferentes)
```
❌ admin.html → Usar config principal
❌ check-content.html → ELIMINAR o ACTUALIZAR
❌ init-database.js → Importar de firebase-config.js
```

---

## 🔧 PLAN DE CORRECCIÓN

### PASO 1: Actualizar admin.html

**Archivo:** `admin.html` (línea ~17)

**Cambio:**
```javascript
// ACTUAL (INCORRECTO):
const firebaseConfig = {
    apiKey: "AIzaSyAWOnR2xjr-UkJYUPiSUUcxF7Y5y3JXU8Y",
    authDomain: "vytonlineprueva.firebaseapp.com",
    projectId: "vytonlineprueva",
    ...
};

// NUEVO (CORRECTO):
const firebaseConfig = {
    apiKey: "AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk",
    authDomain: "vytonlineprueva.firebaseapp.com",
    projectId: "vytonlineprueva",
    storageBucket: "vytonlineprueva.firebasestorage.app",
    messagingSenderId: "175483939728",
    appId: "1:175483939728:web:230294acca9221d1d1a115"
};
```

**Verificación:**
```javascript
// En consola del navegador después del cambio:
firebase.app().options.apiKey
// Debe mostrar: "AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk"
```

---

### PASO 2: Eliminar o Corregir check-content.html

**Opción A: Eliminar (RECOMENDADO si no se usa)**
```bash
rm check-content.html
```

**Opción B: Corregir (si se usa)**
```javascript
// Cambiar línea 82 de:
apiKey: "AIzaSyBpZ6zFtJlsKy6a5TJdZvN-yJGmWhkszGA",

// A:
apiKey: "AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk",
```

---

### PASO 3: Actualizar init-database.js

**Archivo:** `init-database.js` (línea ~7)

**Cambio:**
```javascript
// ACTUAL (INCORRECTO):
const firebaseConfig = {
  apiKey: "AIzaSyA9r6VUBdZ9V_4VX4DlQ1kXw0nQhZBj8mQ",
  authDomain: "vytonlineprueva.firebaseapp.com",
  projectId: "vytonlineprueva",
  ...
};

// NUEVO (CORRECTO):
const firebaseConfig = {
  apiKey: "AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk",
  authDomain: "vytonlineprueva.firebaseapp.com",
  projectId: "vytonlineprueva",
  storageBucket: "vytonlineprueva.firebasestorage.app",
  messagingSenderId: "175483939728",
  appId: "1:175483939728:web:230294acca9221d1d1a115"
};
```

---

## ✅ VALIDACIÓN FINAL

Después de hacer los cambios, ejecutar esta validación en consola del navegador:

```javascript
// Script de validación
const apiKey = firebase.app().options.apiKey;
const projectId = firebase.app().options.projectId;

console.log('🔍 Validación de Firebase Config:');
console.log('API Key:', apiKey);
console.log('Project ID:', projectId);

if (apiKey === 'AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk' && 
    projectId === 'vytonlineprueva') {
    console.log('✅ CONFIG CORRECTA');
} else {
    console.error('❌ CONFIG INCORRECTA - Verifica firebase-config.js');
}
```

**Resultado esperado:**
```
🔍 Validación de Firebase Config:
API Key: AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk
Project ID: vytonlineprueva
✅ CONFIG CORRECTA
```

---

## 📊 CHECKLIST DE CORRECCIÓN

- [ ] Actualizar `admin.html` con API key correcta
- [ ] Corregir o eliminar `check-content.html`
- [ ] Actualizar `init-database.js` con API key correcta
- [ ] Ejecutar validación en consola
- [ ] Verificar que admin.html carga datos correctamente
- [ ] Verificar que participantes test se ve en admin
- [ ] Hacer commit a git: `Fixing Firebase config inconsistencies`

---

## 🚨 IMPACTO SI NO SE CORRIGE

| Riesgo | Probabilidad | Impacto |
|--------|--------------|---------|
| Admin no ve participantes | 🔴 Alta | 🔴 Crítico |
| Inicialización de BD en proyecto equivocado | 🔴 Alta | 🔴 Crítico |
| Datos fragmentados en múltiples proyectos | 🟠 Media | 🔴 Crítico |
| Pagos no se procesen correctamente | 🟠 Media | 🔴 Crítico |
| Sistema completamente roto en producción | 🟠 Media | 🔴 CATASTRÓFICO |

---

**Auditoría completada:** 27 de diciembre de 2025
