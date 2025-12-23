# 🧪 PLAN DE TESTING COMPLETO - VYT MUSIC
**Fecha:** 23 de diciembre de 2025  
**Estado:** Fixes implementados - Listo para testing

---

## ✅ FIXES IMPLEMENTADOS (Completado)

### Fix #1: Subida de Imágenes en Inscripción ✅
- ✅ crear-perfil-artista.html actualizado
- ✅ Subida a Storage implementada
- ✅ Validaciones agregadas
- ✅ Manejo de errores implementado

### Fix #2: Admin Fondos ✅
- ✅ admin.html actualizado
- ✅ Funciones de subida implementadas
- ✅ Event listeners configurados
- ✅ Previews en tiempo real

---

## 🧪 FASE DE TESTING

### 🔥 TEST 1: INSCRIPCIÓN CON FOTO (15 min)

**Objetivo:** Verificar que la foto se sube correctamente a Storage

**Pasos:**
1. Abrir: `https://vytmusic.web.app/crear-perfil-artista.html`
2. Completar formulario:
   - Email: test@vytmusic.com
   - WhatsApp: +54 9 11 1234-5678
   - Nombre: Juan
   - Apellido: Pérez
   - Fecha nacimiento: 01/01/2000
   - Nombre artístico: El Cantor Test
   - Seleccionar 2 géneros: Pop, Rock
   - Biografía: Artista de prueba para testing
   - Provincia: Buenos Aires
   - Ciudad: CABA
3. **IMPORTANTE:** Subir foto de perfil (usar imagen < 5MB)
4. Click "Crear mi Perfil de Artista"
5. Esperar pantalla de bienvenida
6. Redirige a perfil-artista.html

**Verificaciones:**
- [ ] Firebase Console > Storage > perfiles/ → Debe aparecer la imagen
- [ ] Firebase Console > Firestore > artist_profiles → Documento con foto_perfil URL
- [ ] perfil-artista.html muestra la foto cargada
- [ ] No hay errores en Console del navegador

**Resultado esperado:** ✅ Foto visible en perfil

**Si falla:**
- Revisar Console del navegador para errores
- Verificar permisos de Storage en Firebase
- Verificar que firebase-config.js esté cargado

---

### 🎥 TEST 2: INSCRIPCIÓN CON VIDEO (15 min)

**Objetivo:** Verificar subida de video

**Pasos:**
1. Crear nuevo perfil de artista
2. Subir video pequeño (< 20MB para test rápido)
3. Observar barra de progreso en Console
4. Completar inscripción

**Verificaciones:**
- [ ] Storage > videos/ → Debe aparecer el video
- [ ] Firestore > artist_profiles → video_url con URL
- [ ] perfil-artista.html muestra el video embebido

**Resultado esperado:** ✅ Video subido y visible

---

### 🎨 TEST 3: ADMIN FONDOS - INDEX (10 min)

**Objetivo:** Cambiar fondo de index.html

**Pasos:**
1. Login admin: `https://vytmusic.web.app/admin.html`
   - Email: admin@vyt.com
   - Password: vytonline
2. Ir a sección "Fondos"
3. En card "Página Principal":
   - Click "Cambiar Fondo"
   - Seleccionar imagen de prueba
4. Esperar mensaje de éxito
5. Abrir index.html en nueva pestaña

**Verificaciones:**
- [ ] Storage > fondos/ → Aparece index_[timestamp].jpg
- [ ] Firestore > configuracion_fondos/fondos → Campo "index" con URL
- [ ] Preview en admin actualizado
- [ ] index.html muestra nuevo fondo

**Resultado esperado:** ✅ Fondo cambiado exitosamente

---

### 🎨 TEST 4: ADMIN FONDOS - MÚLTIPLES (15 min)

**Objetivo:** Cambiar fondos de 3 páginas diferentes

**Pasos:**
1. En admin > Fondos
2. Cambiar fondo de:
   - Perfil de Artista
   - Login de Artista
   - Ranking
3. Verificar cada uno funciona

**Verificaciones:**
- [ ] Los 3 fondos suben correctamente
- [ ] Storage tiene las 3 imágenes
- [ ] Firestore tiene las 3 URLs
- [ ] Las 3 páginas muestran nuevos fondos

**Resultado esperado:** ✅ Todos los fondos funcionan

---

### 🔄 TEST 5: FLUJO COMPLETO E2E (30 min)

**Objetivo:** Verificar flujo completo de artista

**Pasos:**
1. **Inscripción:**
   - Crear perfil con foto
   - Verificar perfil creado

2. **Pago de Certamen:**
   - Ir a certamenes.html
   - Seleccionar certamen activo
   - Click "Inscribirse"
   - Pagar con tarjeta test de MercadoPago
   - Verificar pago aprobado

3. **Comprar VYT Money:**
   - Ir a comprar-vyt-money.html
   - Comprar 1000 VYT ($1500)
   - Pagar con tarjeta test
   - Verificar balance actualizado

4. **Votar:**
   - Ir a certamen-individual.html
   - Buscar artista
   - Click "Votar"
   - Verificar que resta VYT
   - Verificar que suma voto

5. **Ranking:**
   - Ir a ranking.html
   - Verificar artista aparece
   - Verificar votos correctos

**Verificaciones:**
- [ ] Inscripción guardada en Firestore
- [ ] Pago registrado correctamente
- [ ] VYT Money actualizado
- [ ] Voto sumado al artista
- [ ] Ranking muestra datos correctos

**Resultado esperado:** ✅ Todo el flujo funciona

---

### 📊 TEST 6: SISTEMA DE POZO (20 min)

**Objetivo:** Verificar cálculo del pozo dinámico

**Pre-requisitos:**
- Tener configuración guardada en configuracion-sistema.html

**Pasos:**
1. Abrir configuracion-sistema.html
2. Verificar configuración:
   - Precio inscripción: $1,500
   - Inscripción al pozo: 30%
   - Precio VYT: $1,500
   - Votos al pozo: 30%
   - Premios: 50/30/20
3. Inscribir 5 artistas ($7,500 total)
4. Comprar 5,000 votos ($7,500 total)
5. Abrir estado-certamen.html
6. Verificar cálculo:
   - Ingresos inscripciones: $7,500 × 30% = $2,250
   - Ingresos votos: $7,500 × 30% = $2,250
   - Pozo total: $4,500
   - 1º: $2,250 (50%)
   - 2º: $1,350 (30%)
   - 3º: $900 (20%)

**Verificaciones:**
- [ ] Cálculo correcto en estado-certamen.html
- [ ] Cálculo correcto en admin.html
- [ ] Se actualiza en tiempo real

**Resultado esperado:** ✅ Pozo calculado correctamente

---

### 🎯 TEST 7: JURADO (15 min)

**Objetivo:** Verificar evaluación de jurado

**Pre-requisitos:**
- Tener certamen en Fase 3
- Tener semifinalistas

**Pasos:**
1. Abrir jurado.html?certamen=ID_CERTAMEN
2. Verificar carga de semifinalistas
3. Evaluar 3 participantes:
   - Dar puntajes (1-10)
   - Guardar evaluaciones
4. Verificar actualización en Firestore

**Verificaciones:**
- [ ] Carga semifinalistas correctamente
- [ ] Guarda calificaciones
- [ ] Calcula top 3 correctamente
- [ ] Marca ganadores

**Resultado esperado:** ✅ Jurado funcional

---

## 📋 CHECKLIST FINAL PRE-LANZAMIENTO

### Firebase & Backend
- [ ] Storage reglas configuradas correctamente
- [ ] Firestore reglas permiten lectura/escritura necesaria
- [ ] Cloud Functions deployadas
- [ ] Webhooks MercadoPago funcionando

### Funcionalidades Críticas
- [ ] Inscripción con foto funciona
- [ ] Inscripción con video funciona
- [ ] Admin fondos funciona
- [ ] Sistema de pagos funciona
- [ ] Sistema de votos funciona
- [ ] Cálculo de pozo correcto
- [ ] Jurado funciona

### UX/UI
- [ ] No hay datos ficticios visibles
- [ ] Mensajes de error claros
- [ ] Loading states visibles
- [ ] Responsive en móvil
- [ ] Performance aceptable (Lighthouse > 80)

### Seguridad
- [ ] Firestore rules revisadas
- [ ] Storage rules revisadas
- [ ] No hay API keys expuestas
- [ ] HTTPS forzado

### Legal & SEO
- [ ] Términos y condiciones
- [ ] Política de privacidad
- [ ] Meta tags completos
- [ ] Sitemap actualizado

---

## 🚨 ISSUES ENCONTRADOS

### Issue #1: [Descripción]
**Archivo:** [nombre]  
**Error:** [descripción]  
**Fix:** [solución]  
**Estado:** [ ] Pendiente / [ ] Resuelto

### Issue #2: [Descripción]
**Archivo:** [nombre]  
**Error:** [descripción]  
**Fix:** [solución]  
**Estado:** [ ] Pendiente / [ ] Resuelto

---

## ✅ APROBACIÓN FINAL

- [ ] Todos los tests pasaron
- [ ] Todos los issues resueltos
- [ ] Performance aceptable
- [ ] Sin errores críticos en Console
- [ ] Listo para lanzamiento

**Fecha de aprobación:** _____________  
**Aprobado por:** _____________

---

## 🚀 SIGUIENTE PASO

Después de completar todos los tests:
1. Documentar issues encontrados
2. Resolver issues críticos
3. Re-testear fixes
4. Deploy final
5. Anunciar soft launch

**¿Listo para empezar el testing?** 🎯
