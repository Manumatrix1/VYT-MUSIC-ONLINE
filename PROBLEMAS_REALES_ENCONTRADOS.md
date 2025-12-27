# 🚨 PROBLEMAS ENCONTRADOS EN EL CÓDIGO - CAUSA DE CUELGUES

## Archivo: principal-dynamic.js (línea 250+)

### ❌ PROBLEMA 1: `onSnapshot` SIN LIMPIAR
**Línea ~250:**
```javascript
const pozoDocRef = doc(db, "estadisticas_generales", "resumen_certamen");
onSnapshot(pozoDocRef, (doc) => {
    // ... actualizar UI
});
// ❌ NUNCA SE DESUSCRIBE - SE EJECUTA CADA VEZ QUE SE CARGA LA PÁGINA
```

**Por qué es problema:**
- Cada vez que cargas `principal.html`, se crea un `onSnapshot`
- Si recargas 100 veces = 100 listeners activos
- Cada uno escucha cambios en Firestore = 100 requests/segundo
- **RESULTADO: Sistema se congela**

**Solución:**
```javascript
let pozoUnsubscribe = null;

function initPozoListener() {
    // Si ya existe un listener, desuscribirse
    if (pozoUnsubscribe) {
        pozoUnsubscribe();
    }
    
    const pozoDocRef = doc(db, "estadisticas_generales", "resumen_certamen");
    // ✅ Guardar para poder desuscribirse después
    pozoUnsubscribe = onSnapshot(pozoDocRef, (doc) => {
        if (doc.exists()) {
            const pozoActual = doc.data().pozo_total;
            if(pozoTextElement) pozoTextElement.textContent = `$ ${pozoActual.toLocaleString('es-AR')}`;
            const pozoObjetivo = 2000000;
            const porcentaje = Math.min(100, (pozoActual / pozoObjetivo) * 100);
            if(pozoBarElement) pozoBarElement.style.width = `${porcentaje}%`;
        }
    });
}

// ✅ LIMPIAR al descargar la página
window.addEventListener('beforeunload', () => {
    if (pozoUnsubscribe) {
        pozoUnsubscribe();
    }
});
```

---

### ❌ PROBLEMA 2: `onAuthStateChanged` SIN CONTROL
**Línea ~100:**
```javascript
onAuthStateChanged(auth, async (user) => {
    // ... código largo
});
// ❌ SE EJECUTA CADA VEZ QUE ALGUIEN INICIA SESIÓN (puede ser 100s de veces)
```

**Por qué es problema:**
- `onAuthStateChanged` es un listener también
- Si se llama múltiples veces sin limpiar = múltiples listeners
- Cada uno ejecuta `loadUserBalance()` = múltiples queries

**Solución:**
```javascript
let authUnsubscribe = null;

function initAuthListener() {
    // ✅ Si ya existe, desuscribirse primero
    if (authUnsubscribe) {
        authUnsubscribe();
    }
    
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        // ... código
    });
}

// ✅ LIMPIAR
window.addEventListener('beforeunload', () => {
    if (authUnsubscribe) {
        authUnsubscribe();
    }
});
```

---

### ❌ PROBLEMA 3: Múltiples `loadXXX()` sin verificar si ya se ejecutaron
**Líneas ~410-412:**
```javascript
loadBlogPosts();
loadBasesYCondiciones();
loadCommunityFeed();
loadDynamicBlocks();
// ❌ Se ejecutan CADA VEZ sin verificar si ya se cargaron
```

**Por qué es problema:**
- Cada función hace una query a Firestore
- Si la página se carga 100 veces = 400 queries
- Si son lentas = se acumulan en la cola

**Solución:**
```javascript
// ✅ Control de carga
const loadedData = {
    blogPosts: false,
    bases: false,
    feed: false,
    blocks: false
};

// Solo cargar si no se han cargado
if (!loadedData.blogPosts) {
    loadBlogPosts();
    loadedData.blogPosts = true;
}
if (!loadedData.bases) {
    loadBasesYCondiciones();
    loadedData.bases = true;
}
// etc...
```

---

### ❌ PROBLEMA 4: `querySelector` y `forEach` en CADA evento
**Línea ~155:**
```javascript
allInternalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        document.querySelectorAll(`.header-nav-link[data-target="${targetId}"]`).forEach(l => l.classList.add('active'));
        // ❌ 3 querySelectorAll CADA VEZ QUE HACES CLICK
    });
});
```

**Por qué es problema:**
- `querySelectorAll` busca por todo el DOM (lento)
- Se ejecuta CADA click
- Si tienes 1000 clicks = 3000 búsquedas en DOM

**Solución:**
```javascript
// ✅ Cache los elementos al inicio
const headerNavLinks = document.querySelectorAll('.header-nav-link');
const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');

allInternalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Usar referencias cacheadas
        headerNavLinks.forEach(l => l.classList.remove('active'));
        bottomNavLinks.forEach(l => l.classList.remove('active'));
        // ... resto del código
    });
});
```

---

## 📊 RESUMEN DE PROBLEMAS

| Problema | Línea | Tipo | Severidad |
|----------|-------|------|-----------|
| `onSnapshot` sin limpiar | ~250 | Memory leak | 🔴 CRÍTICO |
| `onAuthStateChanged` sin control | ~100 | Memory leak | 🔴 CRÍTICO |
| `loadXXX()` sin verificar carga | ~410 | Múltiples queries | 🟠 ALTO |
| `querySelector` en cada click | ~155 | Performance | 🟡 MEDIO |

---

## ✅ SOLUCIONES RÁPIDAS

### Opción A: Arreglarlo HOY (30 min)
1. Añadir limpieza a `onSnapshot` (línea ~250)
2. Controlar `onAuthStateChanged` (línea ~100)
3. Caché de elementos DOM (línea ~155)

### Opción B: Arreglarlo completo (1-2 horas)
Además de A:
1. Refactorizar `loadXXX()` funciones
2. Implementar Service Worker para caché
3. Usar memoization en queries

---

## 🎯 CUÁL ES EL CUELGUE QUE VES

**Si se cuelga después de 10 segundos:** onSnapshot acumulados  
**Si se cuelga al hacer click:** querySelectorAll repetidos  
**Si memoria crece infinitamente:** onAuthStateChanged sin limpiar  
**Si se congela al cargar:** Múltiples loadXXX() simultáneos  

---

## 📝 Siguiente paso

¿Quieres que arregle estos problemas AHORA?

Si dices **SÍ**, en 20 minutos tendrás:
- ✅ onSnapshot limpio
- ✅ onAuthStateChanged controlado  
- ✅ Elementos cacheados
- ✅ Nuevo deploy

Y el sistema debería funcionar sin cuelgues.
