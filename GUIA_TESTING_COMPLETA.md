# 🎯 GUÍA COMPLETA DE TESTING - VYT-MUSIC-ONLINE

## 🌐 **URL BASE:** https://vytonlineprueva.web.app

---

## 📋 **PARTE 1: PÁGINAS PRINCIPALES** (Para usuarios normales)

### 1️⃣ **PÁGINA DE INICIO** ⭐ PRINCIPAL
**URL:** https://vytonlineprueva.web.app
**QUÉ PROBAR:**
- ✅ Logo y diseño visual
- ✅ Countdown (contador regresivo de 7 días)
- ✅ Botón "Soy de Rosario" → lleva a inscripción presencial
- ✅ Botón "Otra Provincia" → abre modal de provincias
- ✅ Botón "Modo Fan" → lleva a página principal
- ✅ Modal de provincias funciona correctamente

### 2️⃣ **INSCRIPCIÓN PRESENCIAL** 
**URL:** https://vytonlineprueva.web.app/inscripcion_presencial.html
**QUÉ PROBAR:**
- ✅ Formulario de datos personales
- ✅ Validación de campos obligatorios
- ✅ Botón "Pagar Inscripción" → redirige a MercadoPago
- ✅ Precio mostrado correctamente

### 3️⃣ **INSCRIPCIÓN ONLINE**
**URL:** https://vytonlineprueva.web.app/inscripcion_online.html
**QUÉ PROBAR:**
- ✅ Formulario con datos del artista
- ✅ Campo de provincia seleccionable
- ✅ URL de YouTube obligatoria
- ✅ Validación de email y teléfono
- ✅ Botón de pago funcional

### 4️⃣ **PÁGINA PRINCIPAL** (Dashboard)
**URL:** https://vytonlineprueva.web.app/principal.html
**QUÉ PROBAR:**
- ✅ Balance de VYT-MONEY en tiempo real
- ✅ Botón "Comprar VYT-MONEY"
- ✅ Lista de participantes/artistas
- ✅ Sistema de votación
- ✅ Notificaciones toast
- ✅ Información de usuario (CONCURSO.CANTO)

### 5️⃣ **LOGIN/REGISTRO**
**URL:** https://vytonlineprueva.web.app/login.html
**QUÉ PROBAR:**
- ✅ Formulario de login
- ✅ Formulario de registro
- ✅ Validación de emails
- ✅ Recuperación de contraseña
- ✅ Autenticación con Firebase
- ✅ Redirección después del login

### 6️⃣ **COMPRAR VYT-MONEY**
**URL:** https://vytonlineprueva.web.app/comprar-vyt-money.html
**QUÉ PROBAR:**
- ✅ Calculadora de precio
- ✅ Botones de cantidad predefinida
- ✅ Redirección a MercadoPago
- ✅ Actualización de balance después del pago

---

## 🛡️ **PARTE 2: PANEL DE ADMINISTRACIÓN** (Solo para admins)

### 7️⃣ **PANEL ADMIN** ⭐ CRÍTICO
**URL:** https://vytonlineprueva.web.app/admin.html
**CREDENCIALES:** Usar cuenta de administrador
**QUÉ PROBAR:**
- ✅ Autenticación de admin
- ✅ Lista de participantes online
- ✅ Lista de participantes presenciales
- ✅ Botones Aprobar/Rechazar
- ✅ Estadísticas del sistema
- ✅ Gestión de usuarios
- ✅ Configuración de precios

---

## 💰 **PARTE 3: FLUJOS DE PAGO** (Con MercadoPago)

### 8️⃣ **PAGO EXITOSO**
**URL:** https://vytonlineprueva.web.app/pago/pago_exitoso.html
**QUÉ PROBAR:**
- ✅ Diseño de confirmación
- ✅ Información del pago procesado
- ✅ Botones de navegación

### 9️⃣ **PAGO FALLIDO**
**URL:** https://vytonlineprueva.web.app/pago/pago_fallido.html
**QUÉ PROBAR:**
- ✅ Mensaje de error claro
- ✅ Opciones para reintentar

### 🔟 **PAGO PENDIENTE**
**URL:** https://vytonlineprueva.web.app/pago/pago_pendiente.html
**QUÉ PROBAR:**
- ✅ Información de espera
- ✅ Instrucciones para el usuario

---

## 🔧 **PARTE 4: FUNCIONES TÉCNICAS** (Para desarrollador)

### 1️⃣1️⃣ **HEALTH CHECK**
**URL:** https://healthcheck-argiroqkia-uc.a.run.app
**QUÉ PROBAR:**
- ✅ Respuesta JSON con status "healthy"
- ✅ Timestamp actual
- ✅ Versión del sistema

### 1️⃣2️⃣ **FIRESTORE INIT**
**URL:** https://initializefirestorestructure-argiroqkia-uc.a.run.app
**QUÉ PROBAR:**
- ✅ Inicialización de colecciones
- ✅ Respuesta de configuración

---

## 🎮 **PARTE 5: FUNCIONALIDADES AVANZADAS**

### 1️⃣3️⃣ **SISTEMA DE NOTIFICACIONES**
**DONDE:** En principal.html después de acciones
**QUÉ PROBAR:**
- ✅ Notificaciones toast aparecen
- ✅ 4 tipos: success, error, warning, info
- ✅ Auto-close después de 5 segundos
- ✅ Botón de cerrar manual

### 1️⃣4️⃣ **BALANCE EN TIEMPO REAL**
**DONDE:** En principal.html, esquina superior derecha
**QUÉ PROBAR:**
- ✅ Carga inicial del balance
- ✅ Actualización después de compras
- ✅ Sincronización automática

### 1️⃣5️⃣ **SISTEMA DE SEGURIDAD**
**QUÉ PROBAR:**
- ✅ Headers de seguridad en navegador (F12 → Network)
- ✅ Rate limiting (intentar muchas requests rápidas)
- ✅ Validación XSS (intentar código malicioso en forms)

---

## 📱 **PARTE 6: RESPONSIVE DESIGN**

**QUÉ PROBAR EN DIFERENTES DISPOSITIVOS:**
- ✅ **Desktop** (1920x1080)
- ✅ **Tablet** (768x1024)
- ✅ **Mobile** (375x667)

**Usar F12 → Device Toggle para simular dispositivos**

---

## 🧪 **PLAN DE TESTING SUGERIDO**

### **DÍA 1: Testing Básico**
1. Página de inicio (index.html)
2. Navegación entre páginas
3. Formularios de inscripción
4. Login/Registro

### **DÍA 2: Testing de Pagos**
1. Compra de VYT-MONEY (usar tarjetas de prueba)
2. Inscripciones con pago
3. Páginas de resultado de pago

### **DÍA 3: Testing Admin**
1. Panel de administración
2. Gestión de participantes
3. Aprobaciones/Rechazos

### **DÍA 4: Testing Avanzado**
1. Funcionalidades en tiempo real
2. Sistema de notificaciones
3. Seguridad y performance

---

## 💳 **TARJETAS DE PRUEBA MERCADOPAGO**

**Para testing de pagos SIN DINERO REAL:**

### Tarjeta APROBADA:
- **Número:** 4507 9900 0000 0087
- **CVV:** 123
- **Vencimiento:** 12/25

### Tarjeta RECHAZADA:
- **Número:** 4509 9900 0000 0087
- **CVV:** 123
- **Vencimiento:** 12/25

---

## 📊 **CHECKLIST DE CALIDAD**

### ✅ **FUNCIONALIDAD** (Lo que ya completamos)
- [x] Navegación fluida
- [x] Formularios operativos
- [x] Pagos integrados
- [x] Autenticación funcional
- [x] Panel admin operativo

### 🎨 **DISEÑO** (Para que evalúes)
- [ ] Colores y tipografías
- [ ] Espaciado y layout
- [ ] Imágenes y logos
- [ ] Animaciones y transiciones
- [ ] Responsive design

### 🚀 **PERFORMANCE** (Ya optimizado)
- [x] Carga rápida de páginas
- [x] Optimización de imágenes
- [x] Headers de seguridad
- [x] Rate limiting implementado

---

## 🎯 **OBJETIVO DE ESTA GUÍA**

Esta guía te permite:
1. **Probar cada funcionalidad** sistemáticamente
2. **Evaluar el diseño** de cada página
3. **Verificar la experiencia de usuario**
4. **Identificar mejoras** o cambios necesarios

**¡Ahora puedes explorar todo el sistema de forma organizada!** 🚀

---

*Guía creada para testing completo de VYT-MUSIC-ONLINE*  
*Todas las URLs están en producción y listas para usar*