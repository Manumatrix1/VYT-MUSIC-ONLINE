# 🏗️ MAPEO VISUAL DEL SISTEMA VYT-MUSIC-ONLINE

**Fecha:** 27 de diciembre de 2025

---

## 📡 ARQUITECTURA GENERAL

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USUARIOS / CLIENTES                              │
└─────────────────┬──────────────────────────────────────┬──────────────────┘
                  │                                      │
                  ▼                                      ▼
        ┌─────────────────┐                   ┌─────────────────┐
        │   NAVEGADORES   │                   │   MOBILE APPS   │
        │   (Navegador)   │                   │   (Futuro)      │
        └────────┬────────┘                   └─────────────────┘
                 │
                 │ HTTPS
                 ▼
    ┌────────────────────────────────┐
    │  FIREBASE HOSTING (CDN Global) │
    │  (Sirve HTML, CSS, JS)         │
    └─────────┬──────────┬───────────┘
              │          │
          ┌───▼──┐   ┌───▼──┐
          │ CDN  │   │Cache │
          └───┬──┘   └───┬──┘
              │          │
              └─────┬────┘
                    │ HTTPS
                    ▼
    ┌─────────────────────────────────────────┐
    │    APLICACIÓN FRONTEND                  │
    │  (HTML + CSS + JavaScript modulares)    │
    │                                         │
    │  ├─ Páginas HTML (30+)                 │
    │  ├─ src/ (módulos JS reutilizables)   │
    │  ├─ CSS (estilos Tailwind)             │
    │  └─ assets/ (imágenes, videos)         │
    │                                         │
    │  Módulos principales:                   │
    │  • notifications.js                     │
    │  • modal.js                             │
    │  • countdown.js                         │
    │  • certamen-workflow.js                │
    │  • performance-utils.js                │
    └──────────────────┬──────────────────────┘
                       │
                       │ REST + Modular SDK
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌────────┐   ┌──────────┐   ┌───────────┐
   │ Auth   │   │Firestore │   │Storage    │
   │(Login) │   │(Datos)   │   │(Archivos) │
   └────────┘   └──────────┘   └───────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                 ┌─────▼─────┐
                 │  FIREBASE │
                 │  PROJECT  │
                 │vytonlinepru
                 │eva         │
                 └─────┬─────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    ┌────────┐   ┌──────────┐   ┌───────────┐
    │Functions│   │Firestore │  │Storage    │
    │(Backend)│   │(DB)      │  │(Archivos) │
    └────────┘   └──────────┘   └───────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                ┌──────▼────────┐
                │  INTEGRACIONES│
                ├────────────────┤
                │ • MercadoPago  │
                │ • YouTube API  │
                │ • Email (SMTP?)│
                └────────────────┘
```

---

## 📁 ESTRUCTURA DE CARPETAS DETALLADA

```
VYT-MUSIC-ONLINE/
│
├── 📄 PÁGINAS HTML PRINCIPALES (30+)
│   ├── index.html                    (Inicio)
│   ├── principal.html                (Página principal)
│   ├── login-artista.html            (Login para artistas)
│   ├── register.html                 (Registro)
│   ├── reset-password.html           (Recuperar contraseña)
│   │
│   ├── inscripcion-unificada.html    (Inscripción online/presencial)
│   ├── inscripcion-certamen.html     (Inscripción específica)
│   ├── pagar-inscripcion.html        (Pago de inscripción)
│   │
│   ├── certamenes.html               (Listado de certámenes)
│   ├── certamen-individual.html      (Detalle de certamen)
│   ├── ranking.html                  (Rankings con votación)
│   │
│   ├── admin.html                    ⚠️ GRANDE (3700 líneas)
│   ├── jurado.html                   (Panel de jurado)
│   ├── estado-certamen.html          (Estado actual)
│   │
│   ├── perfil-artista.html           (Perfil del usuario)
│   ├── crear-perfil-artista.html     (Crear perfil)
│   ├── perfil-simple.html            (Perfil simplificado)
│   │
│   ├── comprar-vyt-money.html        (Compra de moneda virtual)
│   ├── configuracion-sistema.html    (Configuración general)
│   ├── nosotros.html                 (Información)
│   ├── reglamento.html               (Términos y condiciones)
│   │
│   └── ... (15 páginas más de testing/debug)
│
├── 📁 /src (Módulos JavaScript reutilizables)
│   │
│   ├── 🔐 AUTENTICACIÓN Y SEGURIDAD
│   │   └── (incorporado en archivos principales)
│   │
│   ├── 🎨 UI/UX COMPONENTS
│   │   ├── modal.js                  (Sistema de modales)
│   │   ├── notifications.js          (Notificaciones)
│   │   ├── notification-system.js    (Sistema extendido)
│   │   ├── countdown.js              (Contador regresivo)
│   │   ├── dynamic-background.js     (Fondos dinámicos)
│   │   └── navigation.js             (Sistema de navegación)
│   │
│   ├── 📊 DATOS Y FLUJOS
│   │   ├── provinces.js              (Datos de provincias)
│   │   ├── zonas-argentina.js        (Datos de zonas)
│   │   ├── certamen-workflow.js      (Flujo de certamenes)
│   │   ├── inscription-handler.js    (Manejo inscripciones)
│   │   ├── inscription-validator.js  (Validación)
│   │   ├── configuracion-sistema.js  (Config del sistema)
│   │   └── payment-notifications.js  (Notificaciones de pago)
│   │
│   └── ⚙️ PERFORMANCE Y UTILIDADES
│       ├── performance-utils.js      (Utilidades de optimización)
│       ├── performance-optimizer.js  (Optimizador avanzado)
│       ├── input.css                 (Entrada de Tailwind)
│       └── navigation-styles.css     (Estilos nav)
│
├── 📁 /functions (Backend Firebase Functions)
│   │
│   ├── 📋 ARCHIVOS PRINCIPALES
│   │   ├── index.js                  ⚠️ VERSIÓN MÍNIMA V1
│   │   └── package.json              (Dependencias)
│   │
│   ├── 🔧 MÓDULOS FUNCIONALES
│   │   ├── firestore-init.js         (Inicialización DB)
│   │   ├── admin.js                  (Funciones admin)
│   │   ├── payments.js               (Procesamiento pagos)
│   │   ├── payment-config.js         (Config de pagos)
│   │   ├── payments-system.js        (Sistema de pagos)
│   │   │
│   │   ├── vyt-money.js              (Sistema VYT Money)
│   │   ├── perfiles-artistas.js      (Gestión de perfiles)
│   │   ├── certamenes-jerarquicos.js (Certamenes jerárquicos)
│   │   │
│   │   ├── email-triggers.js         (Triggers de email)
│   │   ├── emails.js                 (Plantillas email)
│   │   ├── moderacion-contenido.js   (Moderación)
│   │   ├── comentarios-moderados.js  (Comentarios)
│   │   │
│   │   ├── audit-logger.js           (Auditoría)
│   │   ├── rate-limiter.js           (❌ COMENTADO)
│   │   ├── input-validator.js        (Validación)
│   │   ├── youtube.js                (Integración YouTube)
│   │   └── backup-system.js          (Sistema de backup)
│   │
│   ├── 📁 /backup-versions (Versiones anteriores)
│   └── 📁 /node_modules (Dependencias instaladas)
│
├── 📁 /pago (Vistas de resultado de pago)
│   ├── pago_exitoso.html             (Pago exitoso)
│   ├── pago_fallido.html             (Pago fallido)
│   ├── pago_pendiente.html           (Pago pendiente)
│   ├── inscripcion-exitosa.html      (Inscripción exitosa)
│   ├── inscripcion-fallida.html      (Inscripción fallida)
│   └── inscripcion-pendiente.html    (Inscripción pendiente)
│
├── 🎨 ARCHIVOS CSS (Estilos)
│   ├── style.css                     (Estilos globales)
│   ├── home-styles.css               (Estilos página inicio)
│   ├── admin-styles.css              (Estilos admin)
│   ├── desktop-styles.css            (Estilos responsive)
│   ├── gamification-styles.css       (Estilos gamificación)
│   ├── navegacion-simple.css         (Estilos navegación)
│   ├── icon-control.css              (Control de iconos)
│   ├── force-black-nav.css           (Forzar nav negra)
│   └── tailwind.config.js            (Config de Tailwind)
│
├── 📄 ARCHIVOS DE CONFIGURACIÓN
│   ├── firebase-config.js            ✅ PRINCIPAL (usar esto)
│   ├── firebase.json                 (Config Firebase Hosting)
│   ├── firestore.rules               (Reglas de Firestore)
│   ├── storage.rules                 (Reglas de Storage)
│   ├── firestore.indexes.json        (Índices de Firestore)
│   ├── .firebaserc                   (Proyectos Firebase)
│   ├── package.json                  (Dependencias raíz)
│   ├── tailwind.config.js            (Config Tailwind)
│   └── .env                          (Variables de entorno)
│
├── 📊 ARCHIVOS JAVASCRIPT PRINCIPALES
│   ├── main.js                       (Lógica principal)
│   ├── principal-dynamic.js          (Página principal dinámica)
│   ├── admin.js                      (Admin - ⚠️ MONOLÍTICO)
│   ├── certamenes.js                 (Gestión certamenes)
│   ├── gamification.js               (Sistema gamificación)
│   └── load-firebase.js              (Carga de Firebase)
│
├── 📁 /assets (Recursos)
│   ├── /images                       (Imágenes)
│   ├── /videos                       (Videos)
│   └── /icons                        (Iconos)
│
├── 📁 /data-backup (Respaldos de datos)
│   └── backup-vyt-online-2025-09-12.json
│
├── 📁 /docs (Documentación)
│   ├── ARQUITECTURA_COMPLETA.md
│   └── ... (otras docs)
│
├── 📁 /.github (Configuración GitHub)
│   └── copilot-instructions.md       (Instrucciones para IA)
│
├── 📁 /.vscode (Config VS Code)
├── 📁 /.git (Repositorio Git)
├── 📁 ./node_modules (Dependencias raíz)
│
├── 📄 DOCUMENTACIÓN DEL PROYECTO
│   ├── README.md                     ❌ VACÍO
│   ├── ANALISIS_SISTEMA_COMPLETO.md  (Análisis anterior)
│   ├── REPORTE_CRITICO_FIREBASE.md   (Reporte de estado)
│   ├── CHANGELOG_2025-09-26.md       (Registro de cambios)
│   ├── SECURITY_ASSESSMENT_REPORT.md (Evaluación de seguridad)
│   ├── GUIA_MVP_COMPLETO.md          (Guía MVP)
│   ├── GUIA_TESTING_COMPLETA.md      (Guía de testing)
│   ├── DEPLOYMENT.md                 (Guía de deployment)
│   │
│   ├── ANALISIS_SISTEMA_DETALLADO_2025-12-27.md        ✅ NUEVO
│   ├── PLAN_ACCION_INMEDIATO.md                         ✅ NUEVO
│   ├── AUDITORIA_FIREBASE_CONFIG.md                     ✅ NUEVO
│   └── RESUMEN_EJECUTIVO_ANALISIS.md                    ✅ NUEVO
│
└── 🚀 SCRIPTS DE DEPLOYMENT
    ├── deploy.ps1                    (Deploy general)
    ├── deploy-complete.ps1           (Deploy completo)
    ├── deploy-fix-iconos.ps1         (Fix específico)
    ├── deploy.sh                     (Deploy en bash)
    ├── ABRIR-ADMIN.bat               (Acceso rápido admin)
    ├── SERVIDOR-ADMIN.bat            (Iniciar servidor)
    └── ... (otros scripts)
```

---

## 🔄 FLUJOS DE DATOS PRINCIPALES

### FLUJO 1: INSCRIPCIÓN

```
Usuario
  │
  └──► inscripcion-unificada.html
       │
       ├─► Selecciona modalidad (Online/Presencial)
       │
       ├─► Completa formulario
       │   └─► Validación (inscription-validator.js)
       │
       ├─► Sube video
       │   └─► Firebase Storage
       │
       └─► Guarda datos
           └─► Firestore: participantes_certamen

Admin
  │
  └──► admin.html
       │
       ├─► Ve participante en "Pendientes"
       │
       ├─► Aprueba/Rechaza
       │   └─► Firestore: estado = aprobado
       │
       └─► Marca para pago
           └─► Redirige a MercadoPago
```

### FLUJO 2: VOTACIÓN

```
Usuario anónimo
  │
  └──► certamenes.html o ranking.html
       │
       ├─► Sistema genera User ID (localStorage)
       │
       ├─► Usuario vota
       │   └─► POST a functions
       │
       └─► Voto guardado
           └─► Firestore: votos collection

Analytics
  │
  └─► Principal-dynamic.js
      │
      ├─► onSnapshot() en ranking
      │
      └─► Actualiza en tiempo real
          └─► UI refleja nuevo ranking
```

### FLUJO 3: PAGOS

```
Usuario
  │
  └──► pagar-inscripcion.html
       │
       ├─► Ingresa datos de tarjeta
       │
       └─► Envía a MercadoPago
           │
           └──► MercadoPago procesa pago
                │
                └──► SUCCESS o FAILURE
                    │
                    └──► Webhook → functions/payments.js
                        │
                        ├─► Actualiza Firestore
                        │
                        └─► Redirige a /pago/pago_exitoso.html
```

---

## 🔑 COMPONENTES CRÍTICOS

```
TIER 1: FUNDACIONALES
├── firebase-config.js           ✅ Configuración
├── Firebase Auth                ✅ Autenticación
└── Firestore                    ✅ Base de datos

TIER 2: FUNCIONALIDADES CORE
├── inscripcion-unificada.html   ✅ Inscripción
├── admin.html                   ✅ Administración
├── certamenes.js                ✅ Votación
└── functions/index.js           ✅ Backend

TIER 3: FUNCIONALIDADES ADICIONALES
├── payments.js                  ⚠️ Pagos (no probado)
├── vyt-money.js                 ⚠️ VYT Money
├── moderacion-contenido.js      ⚠️ Moderación
└── email-triggers.js            ⚠️ Emails

TIER 4: OPTIMIZACIONES
├── performance-utils.js         ✅ Performance
├── notifications.js             ✅ Notificaciones
└── countdown.js                 ✅ UI Components
```

---

## 📊 DISTRIBUCIÓN DE CÓDIGO

```
TOTAL LÍNEAS DE CÓDIGO: ~50,000+

Frontend:     ~25,000 líneas (50%)
├── HTML: ~8,000
├── CSS: ~5,000
└── JavaScript: ~12,000

Backend:      ~15,000 líneas (30%)
├── Functions: ~12,000
└── Config: ~3,000

Tests:           0 líneas (0%)  ❌ MISSING
Documentación: ~10,000 líneas (20%)

DESGLOSE DEL FRONTEND:
admin.js:              3,700 líneas ⚠️ MONOLÍTICO
principal-dynamic.js:    800 líneas
main.js:                 370 líneas
certamenes.js:           600 líneas
Otros JS:             ~3,500 líneas
```

---

## 🎯 MATRIZ DE RESPONSABILIDADES

| Componente | Responsable | Status | Riesgo |
|-----------|-------------|--------|--------|
| Firebase Config | MÚLTIPLES ARCHIVOS | ⚠️ INCONSISTENTE | 🔴 CRÍTICO |
| Inscripciones | inscripcion-*.html + admin.js | ✅ OK | ✅ BAJO |
| Votación | certamenes.js | ✅ OK | ✅ BAJO |
| Pagos | functions/payments.js | ⚠️ NO PROBADO | 🟠 MEDIO |
| Admin | admin.js (3700 líneas) | ⚠️ FUNCIONAL | 🔴 CRÍTICO |
| Autenticación | firebase.auth() | ✅ OK | ✅ BAJO |
| Storage | firebase.storage() | ✅ OK | ✅ BAJO |
| Notificaciones | notifications.js | ✅ OK | ✅ BAJO |

---

## 💾 BASE DE DATOS (Firestore)

```
vytonlineprueva (PROJECT)
│
├── 📦 participantes_certamen
│   └── [doc]: ID → nombre, email, estado, video, etc
│
├── 📦 participantes_online
│   └── [doc]: ID → datos de inscripción online
│
├── 📦 usuarios / users
│   └── [doc]: UID → email, perfil, estadísticas
│
├── 📦 certamenes
│   └── [doc]: ID → nombre, fecha, estado, premios
│
├── 📦 certamenes_provinciales
│   └── [doc]: ID → provincia, fecha, participantes
│
├── 📦 system_config
│   ├── [doc] pricing → precios de inscripción, VYT Money
│   ├── [doc] general → nombre sitio, estado, mantenimiento
│   └── [doc] ... (otras configs)
│
├── 📦 system_stats
│   └── [doc] global → total usuarios, pagos, votos
│
├── 📦 votos / votes
│   └── [doc]: ID → usuario, participante, timestamp
│
├── 📦 rankings
│   └── [doc]: ID → participante, votos, posición
│
├── 📦 payment_logs
│   └── [doc]: ID → monto, estado, timestamp, método
│
├── 📦 background_configs
│   └── [doc]: pageName → imageData, position, scale
│
├── 📦 payment_config
│   └── [doc]: ... (config de pagos)
│
├── 📦 vyt_money_config
│   └── [doc]: ... (config de VYT Money)
│
└── 📦 ... (otras colecciones)

STORAGE:
gs://vytonlineprueva.appspot.com/
├── /participantes/{participante_id}/video.mp4
├── /participantes/{participante_id}/thumbnail.jpg
├── /usuarios/{uid}/avatar.jpg
├── /certamenes/{certamen_id}/cover.jpg
└── ... (otros archivos)
```

---

## 🚨 PUNTOS DE VULNERABILIDAD

```
┌─────────────────────────────────────────┐
│  1. CONFIGURACIONES FIREBASE MÚLTIPLES  │
│     Status: 🔴 CRÍTICO                  │
│     Ubicación: admin.html, init-db, etc │
│     Acción: FIX HOY                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  2. RATE LIMITING DESACTIVADO           │
│     Status: 🔴 CRÍTICO                  │
│     Ubicación: functions/index.js       │
│     Acción: FIX HOY                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  3. ADMIN.JS MONOLÍTICO                 │
│     Status: 🔴 CRÍTICO (largo plazo)    │
│     Ubicación: admin.js (3700 líneas)   │
│     Acción: REFACTOR ESTA SEMANA        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  4. SIN TESTING                         │
│     Status: 🟠 ALTO                     │
│     Ubicación: en todas partes          │
│     Acción: CREAR PRÓXIMAS 2 SEMANAS    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  5. DOCUMENTACIÓN INSUFICIENTE          │
│     Status: 🟠 ALTO                     │
│     Ubicación: README.md vacío          │
│     Acción: COMPLETAR ESTA SEMANA       │
└─────────────────────────────────────────┘
```

---

**Mapeo visual completado:** 27 de diciembre de 2025
