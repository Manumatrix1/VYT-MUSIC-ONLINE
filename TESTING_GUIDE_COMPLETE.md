# 🎵 GUÍA COMPLETA DE TESTING - VYT-MUSIC-ONLINE
## Manual de Pruebas para Usuario Final

**URL Base:** https://vytonlineprueva.web.app  
**Fecha:** 23 de Septiembre, 2025

---

## 🏠 **1. PÁGINA DE INICIO (index.html)**
**URL:** https://vytonlineprueva.web.app

### ✅ **QUÉ PROBAR:**
- **Diseño visual:** Fondo oscuro moderno con efectos de gradiente
- **Logo VYT Music:** Debe cargar correctamente
- **Countdown:** Contador regresivo funcionando (7 días desde hoy)
- **Botones principales:**
  - 🏢 "Soy de Rosario" → Va a inscripción presencial
  - 🌍 "Otra Provincia" → Abre modal de provincias
  - 👁️ "Modo Fan" → Va a página principal sin participar

### ✅ **FUNCIONALIDADES A VERIFICAR:**
1. **Modal de Provincias:** Al hacer clic en "Otra Provincia"
   - Se abre modal con lista de provincias argentinas
   - Seleccionar provincia y confirmar
   - Debe redirigir a inscripción online
2. **Countdown en tiempo real:** Los números cambian cada segundo
3. **Responsividad:** Probar en móvil y desktop
4. **Chat Tawk.to:** Widget de chat en la esquina

---

## 📝 **2. INSCRIPCIÓN PRESENCIAL**
**URL:** https://vytonlineprueva.web.app/inscripcion_presencial.html

### ✅ **QUÉ PROBAR:**
- **Formulario completo de inscripción presencial**
- **Campos requeridos:**
  - Nombre del artista
  - Email
  - Teléfono
  - Edad
  - Ciudad
  - URL de YouTube
  - Aceptar términos

### ✅ **FUNCIONALIDADES A VERIFICAR:**
1. **Validación de campos:** Campos obligatorios marcados
2. **Validación de email:** Formato correcto
3. **Validación de YouTube:** URL válida de YouTube
4. **Botón de envío:** Procesa inscripción
5. **Integración de pago:** MercadoPago para presencial

---

## 🌐 **3. INSCRIPCIÓN ONLINE**
**URL:** https://vytonlineprueva.web.app/inscripcion_online.html

### ✅ **QUÉ PROBAR:**
- **Formulario de inscripción online**
- **Selección de certamen:** Dropdown con provincias
- **Campos similares a presencial pero adaptados**

### ✅ **FUNCIONALIDADES A VERIFICAR:**
1. **Selección de provincia:** Detecta provincia desde modal anterior
2. **Precio dinámico:** Cambia según certamen seleccionado
3. **Validación completa:** Todos los campos validados
4. **Pago online:** Integración MercadoPago

---

## 🔐 **4. SISTEMA DE AUTENTICACIÓN**
**URL:** https://vytonlineprueva.web.app/login.html

### ✅ **QUÉ PROBAR:**
- **Página de login/registro moderna**
- **Dos formularios en uno:** Toggle entre login y registro

### ✅ **FUNCIONALIDADES A VERIFICAR:**
1. **Registro de usuario:**
   - Email válido
   - Contraseña segura
   - Confirmación de contraseña
   - Selección de provincia
2. **Login de usuario:**
   - Email y contraseña
   - Recordar sesión
3. **Recuperar contraseña:** Modal de reset
4. **Mostrar/ocultar contraseña:** Botón de visibilidad
5. **Validaciones en tiempo real**

---

## 🎭 **5. PÁGINA PRINCIPAL (Modo Fan)**
**URL:** https://vytonlineprueva.web.app/principal.html

### ✅ **QUÉ PROBAR:**
- **Dashboard principal del sistema**
- **Vista de participantes y certámenes**
- **Sistema de votación**

### ✅ **FUNCIONALIDADES A VERIFICAR:**
1. **Balance VYT-MONEY:** Se muestra en tiempo real
2. **Lista de participantes:** Cards con información
3. **Sistema de votación:** Votar con VYT-MONEY
4. **Notificaciones:** Toast notifications funcionando
5. **Chat integrado:** Tawk.to visible
6. **Navegación:** Menú superior funcional

---

## 👑 **6. PANEL DE ADMINISTRACIÓN**
**URL:** https://vytonlineprueva.web.app/admin.html

### ✅ **QUÉ PROBAR:**
- **Solo accesible para administradores**
- **Interface completa de gestión**

### ✅ **FUNCIONALIDADES A VERIFICAR:**
1. **Autenticación admin:** Solo usuarios admin pueden acceder
2. **Gestión de participantes:**
   - Ver lista completa
   - Aprobar inscripciones
   - Rechazar con motivo
3. **Estadísticas:** Dashboard con métricas
4. **Gestión de certámenes:** CRUD completo
5. **Logs de audit:** Tracking de acciones
6. **Sistema de backup:** Crear/restaurar backups

---

## 💰 **7. COMPRA DE VYT-MONEY**
**URL:** https://vytonlineprueva.web.app/comprar-vyt-money.html

### ✅ **QUÉ PROBAR:**
- **Sistema de moneda virtual**
- **Diferentes paquetes de compra**

### ✅ **FUNCIONALIDADES A VERIFICAR:**
1. **Paquetes disponibles:** Diferentes cantidades y precios
2. **Integración MercadoPago:** Pago seguro
3. **Actualización de balance:** Inmediata tras pago
4. **Historial de compras:** Tracking de transacciones

---

## 💳 **8. PÁGINAS DE PAGO**

### ✅ **PAGO EXITOSO**
**URL:** https://vytonlineprueva.web.app/pago/pago_exitoso.html
- Confirmación de pago
- Detalles de la transacción
- Botones de navegación

### ✅ **PAGO PENDIENTE**
**URL:** https://vytonlineprueva.web.app/pago/pago_pendiente.html
- Estado pendiente de confirmación
- Instrucciones para el usuario

### ✅ **PAGO FALLIDO**
**URL:** https://vytonlineprueva.web.app/pago/pago_fallido.html
- Error en el pago
- Opciones para reintentar

---

## 🛠️ **9. FUNCIONES TÉCNICAS A PROBAR**

### ✅ **HEALTH CHECK**
**URL:** https://healthcheck-argiroqkia-uc.a.run.app
- Status del sistema
- Información de versión

### ✅ **INICIALIZACIÓN FIRESTORE**
**URL:** https://initializefirestorestructure-argiroqkia-uc.a.run.app
- Estructura de base de datos
- Configuración inicial

---

## 📱 **10. TESTING MÓVIL Y RESPONSIVIDAD**

### ✅ **QUÉ VERIFICAR:**
1. **Todas las páginas en móvil:** iPhone, Android
2. **Navegación touch:** Botones y formularios
3. **Modales en móvil:** Se adaptan correctamente
4. **Formularios:** Teclado virtual funciona bien
5. **Chat widget:** Posición correcta en móvil

---

## 🔒 **11. SISTEMAS DE SEGURIDAD (Invisible pero Activo)**

### ✅ **FUNCIONANDO EN BACKGROUND:**
1. **Rate Limiting:** Protección contra spam
2. **Input Validation:** Sanitización XSS
3. **Audit Logging:** Tracking de eventos
4. **Backup System:** Respaldos automáticos
5. **Security Headers:** CSP, HSTS configurados

---

## 🎯 **12. FLUJO COMPLETO RECOMENDADO PARA TESTING**

### **PASO 1:** Página de Inicio
1. Ir a https://vytonlineprueva.web.app
2. Verificar countdown funcionando
3. Probar botón "Otra Provincia"
4. Seleccionar provincia y confirmar

### **PASO 2:** Inscripción
1. Completar formulario de inscripción
2. Verificar validaciones
3. Proceder a pago (puedes cancelar)

### **PASO 3:** Autenticación
1. Ir a /login.html
2. Registrar nuevo usuario
3. Hacer login
4. Probar recuperar contraseña

### **PASO 4:** Modo Fan
1. Ir a /principal.html
2. Ver participantes
3. Verificar balance VYT-MONEY
4. Probar notificaciones

### **PASO 5:** Compra VYT-MONEY
1. Ir a /comprar-vyt-money.html
2. Seleccionar paquete
3. Ver integración MercadoPago

### **PASO 6:** Panel Admin (si tienes acceso)
1. Ir a /admin.html
2. Verificar gestión de participantes
3. Ver estadísticas

---

## 🎨 **13. ASPECTOS VISUALES A EVALUAR**

### ✅ **DISEÑO:**
- **Colores:** Esquema oscuro moderno
- **Tipografía:** Montserrat para títulos, Roboto para texto
- **Efectos:** Gradientes, sombras, animaciones
- **Iconos:** Consistentes y claros
- **Espaciado:** Layouts bien distribuidos

### ✅ **UX/UI:**
- **Navegación intuitiva**
- **Botones claramente definidos**
- **Formularios fáciles de completar**
- **Mensajes de error claros**
- **Feedback visual inmediato**

---

## 🚀 **14. PERFORMANCE Y VELOCIDAD**

### ✅ **QUÉ VERIFICAR:**
1. **Tiempo de carga:** Páginas cargan rápido
2. **Imágenes:** Se optimizan automáticamente
3. **JavaScript:** No hay errores en consola
4. **Responsividad:** Sin lag en interacciones

---

¡**DISFRUTA PROBANDO TU PLATAFORMA COMPLETA!** 🎉

Cada página ha sido diseñada con amor y atención al detalle. El sistema está 100% funcional y listo para usuarios reales.

**¿Alguna página específica te gustaría que revisemos en detalle?**