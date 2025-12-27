# 🔍 INSTRUCCIONES PARA DIAGNOSTICAR EL CUELGUE

Si aún está lento, necesitamos encontrar **dónde exactamente** está el problema. Puede ser:

1. **Del navegador** (memory leak, listeners acumulados)
2. **Del código** (loop infinito, query pesada)
3. **De la PC** (sin RAM, CPU al 100%, disco lleno)
4. **De la conexión** (Internet lenta)

---

## 🔧 PASO 1: Verificar Recursos de la PC

### En Windows:
1. Abre **Task Manager** (`Ctrl + Shift + Esc`)
2. Ve a pestaña **Performance**
3. Mira:
   - **CPU:** ¿Está al 100%?
   - **Memoria:** ¿Cuánta % está usando?
   - **Disco:** ¿Está en rojo?

### En PowerShell (copia y pega):
```powershell
# Ver memoria disponible
Get-ComputerInfo | Select-Object CsPhyicallyInstalledMemory, CsTotalPhysicalMemory

# Ver procesos con más RAM
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name, WorkingSet

# Ver disco
Get-Volume | Select-Object DriveLetter, SizeRemaining, Size
```

**Si ves:**
- RAM < 500MB disponible → Problema de PC
- CPU > 80% → Algo está bloqueando
- Disco < 5GB → Espacio insuficiente

---

## 🌐 PASO 2: Diagnóstico en el Navegador

### Opción A: Rápida (Console)
1. Abre la app en Chrome
2. Presiona `F12` (DevTools)
3. Ve a pestaña **Console**
4. Copia y pega TODO esto:

```javascript
console.log('=== DIAGNÓSTICO RÁPIDO ===');
console.log('Memoria:', ((performance.memory?.usedJSHeapSize || 0) / 1048576).toFixed(2), 'MB');
console.log('Cache:', window.inscriptionCache?.size || 0);
console.log('Timers:', window.activeIntervals?.length || 0);
console.log('Firebase:', typeof firebase !== 'undefined' ? '✅' : '❌');
console.log('URL:', window.location.href);
```

5. Presiona Enter
6. **Copia el resultado** y envíame

### Opción B: Detallada (Archivo)
1. Abre: [diagnostico-navegador.js](diagnostico-navegador.js)
2. Copia TODO el contenido
3. En Chrome DevTools Console, pega TODO
4. Presiona Enter
5. **Espera 30 segundos**
6. Lee el resultado y cópiamelo

---

## ⏱️ PASO 3: Test de Rendimiento

En DevTools Console, pega esto:

```javascript
// Test qué está lento
console.time('Firebase Health');
fetch('https://healthcheck-argiroqkia-uc.a.run.app')
  .then(r => r.json())
  .then(d => {
    console.timeEnd('Firebase Health');
    console.log('Firebase Status:', d.status);
  })
  .catch(e => console.error('Firebase ERROR:', e.message));

// Test de memoria
console.time('Operaciones DOM');
const div = document.createElement('div');
for (let i = 0; i < 10000; i++) {
  div.innerHTML += 'x';
}
console.timeEnd('Operaciones DOM');
```

Esto te dirá:
- Si Firebase es lento
- Si el DOM es lento

---

## 🚨 PASO 4: Identificar el Cuello de Botella

**Si la memoria crece mucho:**
- Hay fuga de memoria
- Los timers/listeners no se están limpiando bien
- Solución: Revisar función que abre la página

**Si Firebase es muy lento (>2000ms):**
- Problema de conexión Internet
- O servidor Firebase sobrecarag ado
- Solución: Usar emulator local o optimizar índices

**Si el DOM es lento:**
- Demasiadas operaciones en JavaScript
- Solución: Usar setTimeout para dividir trabajo

**Si recursos PC son altos:**
- Cierra otras aplicaciones
- Reinicia navegador
- Reinicia PC

---

## 📝 CHECKLIST - Qué Revisar AHORA

- [ ] ¿Cuánta RAM/CPU usa Chrome en Task Manager?
- [ ] ¿DevTools Console muestra errores rojos?
- [ ] ¿Cuánto tarda en cargar cada página?
- [ ] ¿Funciona mejor en otro navegador (Firefox/Edge)?
- [ ] ¿Funciona mejor en otra PC?
- [ ] ¿Funciona mejor en versión anterior de la app?

---

## 🎯 CASOS COMUNES

### Caso 1: "Se cuelga después de 5 minutos"
- **Causa:** Memory leak
- **Solución:** Seguir PASO 2, encontrar qué creceMemoria
- **Ubicación:** Probablemente en `main.js` o `src/`

### Caso 2: "Lento desde el inicio"
- **Causa:** Archivo pesado o query initial lenta
- **Solución:** Seguir PASO 3, identificar Firebase vs DOM
- **Ubicación:** Probablemente en `principal-dynamic.js` o `index.html`

### Caso 3: "Lento pero sin errores"
- **Causa:** Bloqueos silenciosos (setTimeout mal implementados)
- **Solución:** Revisar Network en DevTools
- **Ubicación:** `src/performance-optimizer.js`

### Caso 4: "Lento solo la primera vez"
- **Causa:** Carga inicial de recurso grande
- **Solución:** Revisar si imágenes/videos no están lazy-loaded
- **Ubicación:** `src/dynamic-background.js`

---

## 💬 QUÉ DECIRME PARA ARREGLARLO

Cuando ejecutes el diagnóstico, envíame:

1. **Memoria después 30 seg:** X MB (aumentó o disminuyó?)
2. **Tiempo Firebase Health:** X ms
3. **Tiempo operaciones DOM:** X ms
4. **Errores en Console:** (copiar rojo)
5. **Qué página exacta se cuelga:** (ej: index.html, perfil.html)
6. **Cuándo se cuelga:** (al cargar, después de 5min, al hacer click)

Con eso, puedo arreglarlo en 10 minutos.

---

## 🆘 Si NADA de esto ayuda...

Posible que sea problema de:
1. **Servidor Firebase caído** → Revisar https://status.firebase.google.com/
2. **Índices Firestore faltantes** → Deploy automático debería crearlos
3. **Rate limiting** → Si haces 1000 requests/segundo
4. **PC sin recursos** → Necesitas más RAM o cerrar aplicaciones

**Ejecuta ahora el diagnóstico y envíame los resultados** 👇
