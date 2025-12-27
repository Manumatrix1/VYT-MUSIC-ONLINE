# VYT-MUSIC-ONLINE: Guía para Agentes de IA

Plataforma web de certamen de canto online. Inscripciones, votación (VYT Money), panel administrativo. Firebase + Vanilla JS + Tailwind CSS.

## Arquitectura

**Three-tier:** Frontend (HTML/JS raíz) → Firebase Functions (Node.js 20) ↔ Firestore (DB)

- **Hosting:** Raíz (`.` en firebase.json) - HTML, JS, CSS, assets públicos
- **Backend:** `functions/` Node.js, modelos: `index.js` (health, init), `payments.js` (MercadoPago), `vyt-money.js` (saldo), `admin.js` (CRUD)
- **DB:** Firestore con reglas en `firestore.rules`
- **Proyectos:** `desarrollo` y `produccion` en `.firebaserc`

## Patrones Críticos de Código

### Firebase SDK (Dual)
- **HTML pages:** Cargan Firebase v8 CDN
- **main.js:** Import dinámico v10+ desde gstatic.com/firebasejs/10.12.2
- **Pattern:** Lazy cache en variable módulo

### Componentes JS en src/
- NO son módulos ES6 importables, se cargan sin type=module en HTML
- Exportan con export pero accesibles vía window (scope global)
- Excepto: payment-notifications.js y modal.js (sí importan dinámicamente)

### Backend Functions (Node.js)
- Patrón 1: onRequest(async (req,res) => {...}) - HTTP pública, CORS manual
- Patrón 2: onCall() - requiere Firebase client SDK
- Admin init: admin.initializeApp() llamado una sola vez
- Estructura: functions/index.js re-exporta desde otros módulos

### Firestore Estructura
```
/users/{userId}              → User profile (privado)
/artist_profiles/{id}        → Public artist data
/certamenes_provinciales/{id} → Contests
/participantes_online/{id}   → Inscriptions
/user_vyt_money/{userId}     → VYT Money balance
/system_config/pricing       → Pricing config
/tests/{docId}               → Test data
```

## Flujos de Usuario

### Inscripción Certamen
1. inscripcion-unificada.html - form con zona selección
2. Carga: src/zonas-argentina.js, src/inscription-validator.js
3. src/inscription-handler.js valida + crea doc
4. Redirect → pagar-inscripcion.html (MercadoPago)
5. Post-pago → pago/inscripcion-exitosa.html

### Admin (CRUD Certamenes)
- admin.html + admin.js (Firebase v8)
- Requiere auth + custom claim admin=true
- Backend: functions/admin.js con validación isAdmin()

### Compra VYT Money (Votación)
- comprar-vyt-money.html → MercadoPago
- functions/vyt-money.js actualiza /user_vyt_money/{uid}
- Balance usado en votación

## Estilos

- Tailwind v4.1.13: input.css compilado a style.css
- Variables CSS: :root con --primary-color, --accent-color, --bg-dark
- Contextos: admin-styles.css, home-styles.css, desktop-styles.css
- Reusables en src/: navigation-styles.css, gamification-styles.css

## Deploy

```bash
npm install
npm run deploy:dev
firebase deploy --only functions --project desarrollo
npm run deploy:prod
firebase serve
firebase emulators:start --only functions
```

## Gotchas

1. Dual Firebase SDK: v8 en HTML, v10 en main.js - imports no mezclables
2. Global scope: src/*.js NO son módulos, accesibles globalmente
3. CORS en onRequest: Siempre setear headers manuales
4. Rutas relativas: pago/ → ../firebase-config.js, no /firebase-config.js
5. Admin init: Una sola vez en functions/index.js, antes de queries
6. Test collections: tests/, test_conexion/, test_inscripciones/ permisivos
7. Node.js: Functions require Node 20

## Archivos Clave

- firebase-config.js: Config API keys + init (v8)
- firestore.rules: Reglas acceso DB
- firebase.json: Headers CSP, rewrites SPA
- tailwind.config.js: Theme + content paths
- main.js: Entry point lazy-load Firebase v10
- functions/input-validator.js: Validación backend
