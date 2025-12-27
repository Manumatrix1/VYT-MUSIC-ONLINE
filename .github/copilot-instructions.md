# VYT-MUSIC-ONLINE: Guía para Agentes de IA

Plataforma web de certamen de canto online con inscripciones, votación y panel administrativo. Firebase + Vanilla JS con Tailwind CSS.

## Arquitectura de Alto Nivel

**Three-tier:** Frontend (HTML/JS) → Firebase Functions (Node.js) ↔ Firestore (DB)

- **Hosting público:** Todo raíz (`.` en firebase.json) - incluye HTML, JS, CSS, assets
- **Backend serverless:** `functions/` (Node.js 20, firebase-functions v6.4+)
- **DB:** Firestore con rules en `firestore.rules` (usuario solo lee/escribe sus docs)
- **Pagos:** Integración MercadoPago en backend (`functions/payments.js`)

## Patrones de Código Críticos

### Firebase Imports (Lado cliente)
- **Versión mixta:** Firebase v8 en HTML (`<script>` tags), pero `main.js` usa v10+ (`gstatic.com/firebasejs/10.12.2`)
- **Lazy loading en main.js:** Importa módulos dinámicamente con `import()` para optimización
- **Configuración:** `firebase-config.js` exporta app, auth, db globales + init function

```javascript
// Patrón: defer imports y cachear en variable
const initializeFirebase = async () => {
  if (firebaseImports) return firebaseImports;
  const [auth, firestore] = await Promise.all([...]);
  return firebaseImports = { auth, db, ... };
};
```

### Frontend Auth
- Archivos HTML distintos cargan Firebase v8 CDN + `firebase-config.js`
- `onAuthStateChanged()` usado en `principal-dynamic.js` y `inscription-handler.js`
- Auth listeners redirigen a login si no autenticado

### Backend Functions
- **Dos patrones:** `onRequest()` (HTTP público con CORS headers) y `onCall()` (requiere cliente SDK)
- **Rutas:** `functions/index.js` es main, módulos especializados: `vyt-money.js`, `payments.js`, `perfiles-artistas.js`
- **Validación:** `functions/input-validator.js` y `functions/rate-limiter.js` (comentado en production)
- **Admin:** `admin.initializeApp()` needed; Firestore FieldValue.serverTimestamp() para auditoría

### Firestore Structure
```plaintext
/users/{userId}          → Perfil usuario (privado)
/artist_profiles/{id}    → Datos públicos del artista
/certamenes_provinciales/{id} → Certámenes (lectura pública)
/inscriptions/{id}       → Datos de inscripción (private)
/system_config/pricing   → Precios de inscripción y VYT Money
```

**Rules:** isAdmin() helper checks custom claim `admin=true`

## Componentes Reutilizables (src/)

| Archivo | Propósito | Exporta |
|---------|-----------|---------|
| `countdown.js` | Timer visual para certamen | `initializeCountdown(date)` |
| `modal.js` | UI modal genérico | `initializeModal()` |
| `provinces.js` | Provincias Argentina | Data y helpers |
| `zonas-argentina.js` | Zonas geográficas | `ZONAS_ARGENTINA`, `detectarRegion()` |
| `certamen-workflow.js` | Estados/fases certamen | `CertamenWorkflow` class, `FASES_CERTAMEN` |
| `notification-system.js` | Toast/alerts | `NotificationSystem` class |
| `inscription-handler.js` | Lógica de inscripción | Event listeners, form submit |
| `inscription-validator.js` | Validación de datos | `validateFormData()`, `validateEmail()` |

Todos exportan con `export` ES6 pero se cargan en HTML vía `<script src="src/file.js"></script>` (sin `type=module`), así accesibles globalmente.

## Flujos Clave

### Inscripción
1. Usuario llena `inscripcion-unificada.html` (carga `zonas-argentina.js`, `inscription-validator.js`)
2. `inscription-handler.js` valida y crea doc en `/inscriptions/` + `/users/{uid}`
3. Redirect → `pagar-inscripcion.html` (MercadoPago)
4. Post-pago: `pago/inscripcion-exitosa.html` o `inscripcion-fallida.html`

### Admin Panel
- `admin.html` + `admin.js` (Firebase v8)
- Admin users (custom claim `admin=true`) pueden CRUD certamenes, ver estadísticas
- Backend: `functions/admin.js` con `isAdmin()` checks

### Votación (VYT Money)
- Usuario compra "VYT Money" via `comprar-vyt-money.html` → MercadoPago
- `functions/vyt-money.js` maneja balance y transferencias
- Firestore: `/user_vyt_money/{userId}` stores balance

## Estilos

- **Tailwind:** v4.1.13 (input.css, tailwind.config.js)
- **Estilos custom CSS:** Variables en `:root` (primary-color, accent-color, bg-dark)
- **Por contexto:** `admin-styles.css`, `home-styles.css`, `style.css`, `desktop-styles.css`
- **CSS reusable:** `navigation-styles.css`, `gamification-styles.css` (en src/)

## Deploy & CI/CD

- **Comando:** `firebase deploy` (all), `firebase deploy --only functions`, `firebase deploy --only hosting`
- **npm scripts:** `deploy:dev`, `deploy:prod` con `--project` flag (desarrollo/produccion)
- **firebase.json:** CSP headers, security headers, rewrites (SPA support)
- **Emulator:** `firebase emulators:start --only functions` (local dev)

## Gotchas & Convenciones

1. **Firebase SDK versioning:** Mezcla de v8 (HTML) y v10 (JS modules) → cuidado con imports
2. **CORS:** Backend debe setear headers en onRequest functions
3. **Relative paths:** Sub-carpeta `pago/` refiere `../firebase-config.js`
4. **Admin auth:** `functions/index.js` requiere `admin.initializeApp()` antes de queries
5. **Lazy loading:** `main.js` carga Firebase modules dinámicamente para performance
6. **Auth persistence:** `setPersistence()` used en algunos flows
7. **Global scope:** Componentes en `src/` accesibles globalmente (no module bundler)

## Comandos Útiles

```bash
npm install                          # Root + functions/
firebase serve                       # Local server (port 5000)
firebase emulators:start --only functions # Backend local
firebase deploy --project desarrollo # Dev environment
firebase deploy --only functions     # Solo funciones
```
