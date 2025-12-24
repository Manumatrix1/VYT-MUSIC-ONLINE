# 🧪 GUÍA DE TESTING PASO A PASO - EJECUCIÓN
**Fecha:** 23 de diciembre de 2025  
**URL Base:** https://vytonlineprueva.web.app

---

## ✅ VERIFICACIÓN PREVIA DE CÓDIGO

### Código Implementado Correctamente:
- ✅ crear-perfil-artista.html: 2 llamadas a firebase.storage()
- ✅ admin.html: 9 llamadas a subirFondoPagina()
- ✅ Event listeners configurados para 8 inputs
- ✅ Validaciones implementadas
- ✅ Manejo de errores presente

**Estado:** 🟢 Código listo para testing

---

## 🧪 TEST #1: INSCRIPCIÓN CON FOTO (15 minutos)

### Preparación:
1. Abre: https://vytonlineprueva.web.app/crear-perfil-artista.html
2. Abre Console del navegador (F12)
3. Prepara una imagen de prueba (< 5MB)

### Ejecución Paso a Paso:

**PASO 1: Completar Datos Personales**
```
Email: test001@vytmusic.com
WhatsApp: +54 9 11 1234-5678
Nombre: Juan
Apellido: Test
Fecha Nacimiento: 01/01/2000
DNI: (dejar vacío)
```
**✅ Verificar:** Campos se completan correctamente

**PASO 2: Datos Artísticos**
```
Nombre Artístico: El Cantor Test 001
Géneros: Marcar "Pop" y "Rock"
Biografía: Artista de prueba para testing del sistema VYT Music
```
**✅ Verificar:** Géneros se seleccionan visualmente

**PASO 3: Subir Foto**
```
1. Click en input de foto
2. Seleccionar imagen de prueba
3. Esperar preview (si existe)
```
**✅ Verificar:** No hay errores en Console

**PASO 4: Datos de Ubicación**
```
Provincia: Buenos Aires
Ciudad: CABA
Código Postal: 1000
```

**PASO 5: Enviar Formulario**
```
1. Click "Crear mi Perfil de Artista"
2. Observar Console del navegador
```

**✅ BUSCAR EN CONSOLE:**
```
📸 Subiendo foto a Firebase Storage...
✅ Foto subida exitosamente: https://firebasestorage...
📝 Firebase no disponible, guardando solo localmente  (O)
✅ Perfil guardado en Firebase (artist_profiles) con foto: https://...
```

**PASO 6: Verificar Redirect**
```
Debe redirigir a: perfil-artista.html
Esperar: 3 segundos (barra de progreso)
```

---

### Verificación en Firebase Console:

**1. Storage**
```
1. Ir a: https://console.firebase.google.com/project/vytonlineprueva/storage
2. Navegar a: gs://vytmusic-online.appspot.com/perfiles/
3. Buscar: archivo con timestamp_nombreimagen.jpg
```
**✅ Debe existir:** Imagen subida con nombre único

**2. Firestore**
```
1. Ir a: https://console.firebase.google.com/project/vytonlineprueva/firestore
2. Collection: artist_profiles
3. Buscar documento recién creado
4. Verificar campos:
   - email: test001@vytmusic.com
   - foto_perfil: https://firebasestorage.googleapis.com/...
   - fotoURL: https://firebasestorage.googleapis.com/...
   - nombreArtistico: El Cantor Test 001
```
**✅ Debe tener:** foto_perfil con URL válida

**3. Perfil de Artista**
```
1. Si redirigió a perfil-artista.html
2. Verificar que muestra:
   - Foto de perfil visible
   - Nombre artístico
   - Datos personales
```
**✅ Debe mostrar:** Foto cargada desde Storage

---

### Resultado del Test #1:

**TEST PASADO ✅ SI:**
- [ ] Foto se subió a Storage
- [ ] URL guardada en Firestore
- [ ] Perfil muestra la foto
- [ ] No hay errores en Console

**TEST FALLIDO ❌ SI:**
- [ ] Error en Console al subir
- [ ] Storage vacío
- [ ] Firestore sin foto_perfil
- [ ] Perfil no muestra foto

**Issues encontrados:**
```
[Documentar aquí cualquier error]
```

---

## 🎨 TEST #2: ADMIN FONDOS (10 minutos)

### Preparación:
1. Abre: https://vytonlineprueva.web.app/admin.html
2. Login con:
   - Email: admin@vyt.com
   - Password: vytonline
3. Ir a sección "Fondos"
4. Preparar imagen de fondo (< 5MB, 1920x1080 recomendado)

### Ejecución Paso a Paso:

**PASO 1: Cambiar Fondo de Index**
```
1. En card "Página Principal"
2. Click botón "Cambiar Fondo"
3. Seleccionar imagen
4. Observar mensaje "Subiendo imagen..."
5. Esperar mensaje "✅ Fondo actualizado exitosamente"
```

**✅ BUSCAR EN CONSOLE:**
```
📤 Subiendo fondo de index...
✅ Fondo subido: https://firebasestorage...
✅ URL guardada en Firestore para index
```

**PASO 2: Verificar Preview**
```
El preview en el admin debe actualizarse automáticamente
```
**✅ Debe mostrar:** Nueva imagen en el preview

**PASO 3: Verificar Cambio en Index**
```
1. Abrir nueva pestaña
2. Ir a: https://vytonlineprueva.web.app/index.html
3. Recargar (Ctrl + F5)
```
**✅ Debe mostrar:** Nuevo fondo visible

---

### Verificación en Firebase Console:

**1. Storage**
```
1. Ir a Storage
2. Navegar a: fondos/
3. Buscar: index_[timestamp].jpg (o .png)
```
**✅ Debe existir:** Imagen con nombre único

**2. Firestore**
```
1. Collection: configuracion_fondos
2. Document: fondos
3. Campo: index
4. Valor: https://firebasestorage.googleapis.com/...
```
**✅ Debe tener:** URL del fondo de index

---

### PASO 4: Probar 2 Fondos Más (Opcional)

**Cambiar fondo de:**
- Perfil de Artista
- Ranking

**✅ Verificar para cada uno:**
- Storage tiene la imagen
- Firestore tiene la URL
- La página muestra el nuevo fondo

---

### Resultado del Test #2:

**TEST PASADO ✅ SI:**
- [ ] Imagen se subió a Storage
- [ ] URL guardada en Firestore
- [ ] Preview actualizado en admin
- [ ] Index muestra nuevo fondo
- [ ] No hay errores en Console

**TEST FALLIDO ❌ SI:**
- [ ] Error al subir
- [ ] Storage vacío
- [ ] Firestore sin actualizar
- [ ] Index no muestra cambio

**Issues encontrados:**
```
[Documentar aquí cualquier error]
```

---

## 🔄 TEST #3: FLUJO E2E COMPLETO (30 minutos)

### Objetivo: Verificar todo el flujo de usuario

**FLUJO:**
```
Inscripción → Pago → Comprar VYT → Votar → Ranking
```

### PARTE A: Inscripción (Ya testeado)
✅ Usar el artista creado en Test #1

### PARTE B: Pagar Inscripción a Certamen

**PASO 1: Ir a Certámenes**
```
1. Abrir: https://vytonlineprueva.web.app/certamenes.html
2. Verificar que hay certámenes activos
```
**✅ Si NO hay certámenes:**
```
1. Ir a admin.html > Certámenes
2. Crear certamen de prueba:
   - Nombre: Test Certamen 2025
   - Provincia: Buenos Aires
   - Precio: $1500
   - Fecha inicio: Hoy
   - Fecha fin: +30 días
   - Estado: Activo
```

**PASO 2: Inscribirse al Certamen**
```
1. Click "Inscribirse" en el certamen
2. Debe redirigir a página de pago MercadoPago
```

**PASO 3: Pagar con Tarjeta Test**
```
Tarjeta: 5031 7557 3453 0604
Vencimiento: 11/25
CVV: 123
Nombre: APRO
```

**⚠️ IMPORTANTE:**
```
Si MercadoPago no está en modo TEST, usar tarjeta real
o saltar este paso y marcar manualmente pago_aprobado=true en Firestore
```

**PASO 4: Verificar Pago Aprobado**
```
1. Ir a Firestore > inscripciones
2. Buscar inscripción del artista
3. Verificar: pago_aprobado = true
```

**SI WEBHOOK FALLA:**
```
Actualizar manualmente en Firestore:
1. Encontrar documento de inscripción
2. Editar campo: pago_aprobado = true
3. Editar campo: estado = "activo"
```

---

### PARTE C: Comprar VYT Money

**PASO 1: Ir a Comprar VYT**
```
URL: https://vytonlineprueva.web.app/comprar-vyt-money.html
```

**PASO 2: Seleccionar Pack**
```
Elegir: 1,000 VYT por $1,500
```

**PASO 3: Pagar**
```
Usar misma tarjeta test o saltar paso
```

**PASO 4: Verificar Balance**
```
1. Firestore > users > [uid del usuario]
2. Campo: vytMoney o balance
3. Debe tener: 1000 (o el monto comprado)
```

**SI NO HAY USERS:**
```
Crear manualmente:
Collection: users
Document: [crear con ID del auth]
Campos:
  - vytMoney: 1000
  - email: test001@vytmusic.com
```

---

### PARTE D: Votar por Artista

**PASO 1: Ir a Certamen Individual**
```
URL: https://vytonlineprueva.web.app/certamen-individual.html?id=[ID_CERTAMEN]
```

**PASO 2: Encontrar Artista**
```
Buscar: El Cantor Test 001
```

**PASO 3: Votar**
```
1. Click botón "Votar"
2. Confirmar con VYT Money
3. Observar actualización
```

**✅ Verificar:**
- [ ] VYT Money se resta
- [ ] Contador de votos aumenta
- [ ] Se ve actualización en tiempo real

---

### PARTE E: Ver en Ranking

**PASO 1: Ir a Ranking**
```
URL: https://vytonlineprueva.web.app/ranking.html
```

**✅ Verificar:**
- [ ] Artista aparece en la lista
- [ ] Tiene 1 voto (o los votos dados)
- [ ] Foto visible
- [ ] Datos correctos

---

### Resultado del Test #3:

**TEST PASADO ✅ SI:**
- [ ] Inscripción funciona
- [ ] Pago se registra
- [ ] VYT Money se compra
- [ ] Votación funciona
- [ ] Ranking se actualiza

**TEST FALLIDO ❌ SI:**
- [ ] Algún paso no funciona
- [ ] Datos no se sincronizan
- [ ] Errores en Console

**Issues encontrados:**
```
[Documentar aquí cualquier error]
```

---

## 📊 TEST #4: SISTEMA DE POZO (20 minutos)

### Pre-requisito: Configuración guardada

**PASO 1: Verificar Configuración**
```
1. Ir a: https://vytonlineprueva.web.app/configuracion-sistema.html
2. Verificar valores:
   - Precio inscripción: $1,500
   - % Inscripción al pozo: 30%
   - Precio VYT Money (1000): $1,500
   - Costo voto: 1000 tokens
   - % Votos al pozo: 30%
   - Distribución premios: 50/30/20
```

**PASO 2: Calcular Manualmente**
```
Con datos del Test #3:
- 1 inscripción pagada: $1,500 × 30% = $450
- 1 voto dado: $1.50 × 30% = $0.45
- Pozo total: $450.45

Premios:
- 1º: $450.45 × 50% = $225.23
- 2º: $450.45 × 30% = $135.14
- 3º: $450.45 × 20% = $90.09
```

**PASO 3: Ver en Estado Certamen**
```
1. Ir a: https://vytonlineprueva.web.app/estado-certamen.html
2. Verificar "Pozo Acumulado"
3. Comparar con cálculo manual
```

**✅ Debe mostrar:**
- Pozo total: ~$450
- 1º lugar: ~$225
- 2º lugar: ~$135
- 3º lugar: ~$90

**PASO 4: Ver en Admin**
```
1. Login admin
2. Ver dashboard "Pozo del Certamen"
3. Verificar cálculos
```

---

### Resultado del Test #4:

**TEST PASADO ✅ SI:**
- [ ] Cálculo correcto en estado-certamen
- [ ] Cálculo correcto en admin
- [ ] Números coinciden con manual

**TEST FALLIDO ❌ SI:**
- [ ] Cálculos incorrectos
- [ ] No se actualiza
- [ ] Errores de redondeo grandes

---

## 📋 RESUMEN DE RESULTADOS

### Tests Ejecutados:
- [ ] TEST #1: Inscripción con foto
- [ ] TEST #2: Admin fondos
- [ ] TEST #3: Flujo E2E completo
- [ ] TEST #4: Sistema de pozo

### Puntaje General:
```
Tests pasados: ___ / 4
Porcentaje: ____%
```

### Issues Críticos Encontrados:
```
1. [Descripción del issue]
   - Archivo afectado:
   - Error:
   - Fix propuesto:

2. [Descripción del issue]
   - Archivo afectado:
   - Error:
   - Fix propuesto:
```

### Issues Menores Encontrados:
```
1. [Descripción]
2. [Descripción]
```

---

## ✅ APROBACIÓN FINAL

**¿Sistema listo para lanzamiento?**

- [ ] **SÍ** - Todos los tests críticos pasaron
- [ ] **NO** - Hay issues críticos que resolver
- [ ] **PARCIAL** - Funcional pero con mejoras pendientes

**Próximos pasos:**
```
[Documentar plan de acción]
```

---

## 🎯 COMENZAR TESTING AHORA

**Pasos inmediatos:**
1. ✅ Abrir: https://vytonlineprueva.web.app/crear-perfil-artista.html
2. ✅ Seguir TEST #1 paso a paso
3. ✅ Documentar resultados en esta guía
4. ✅ Continuar con TEST #2
5. ✅ Reportar issues encontrados

**Tiempo estimado total:** 1 hora 15 minutos

**¡Empezamos con TEST #1!** 🚀
