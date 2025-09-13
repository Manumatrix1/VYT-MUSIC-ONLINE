# Guía para agentes de IA en VYT-MUSIC-ONLINE

Este proyecto es una plataforma web para la gestión de un certamen de canto online. La estructura y los flujos principales están orientados a la administración de usuarios, inscripciones, pagos y visualización de información relevante.

## Arquitectura y componentes clave
- **Archivos HTML**: Cada vista principal (admin, blog, inscripción, login, perfil, principal, pago) tiene su propio archivo HTML en la raíz.
- **JS principal**: La lógica de la aplicación está distribuida en archivos JS en la raíz (`main.js`, `principal-dynamic.js`, etc.) y en `src/` para componentes reutilizables (`countdown.js`, `modal.js`, `provinces.js`).
- **Estilos**: Los estilos están en archivos CSS separados por contexto (`admin-styles.css`, `home-styles.css`, `style.css`) y se usa Tailwind (`tailwind.config.js`).
- **Backend Functions**: La carpeta `functions/` contiene lógica de backend para Firebase Functions, con su propio `package.json`.
- **Integraciones**: Se utiliza Firebase para autenticación, base de datos y hosting. El archivo `firebase-config.js` contiene la configuración.
- **Pagos**: La carpeta `pago/` contiene vistas para el flujo de pago exitoso, fallido y pendiente.

## Flujos y convenciones
- **Inscripción**: Dos flujos diferenciados (`inscripcion_online.html` y `inscripcion_presencial.html`).
- **Administración**: `admin.html` y `admin.js` gestionan el panel de administración.
- **Pagos**: El estado del pago se refleja en las vistas de la carpeta `pago/`.
- **Estilos y clases**: Se emplean clases de Tailwind y variables CSS personalizadas (ver `:root` en los estilos).
- **Firebase Functions**: El backend se desarrolla en `functions/index.js`. Instalar dependencias con `npm install` dentro de la carpeta `functions/`.

## Comandos y workflows
- **Desarrollo local**: Usar `firebase serve` o `firebase emulators:start` para pruebas locales.
- **Despliegue**: `firebase deploy` para publicar cambios.
- **Instalación de dependencias**: Ejecutar `npm install` en la raíz y en `functions/` si se modifican dependencias.

## Ejemplo de patrón
- Para agregar una nueva vista, crear el HTML en la raíz y el JS asociado en la misma carpeta o en `src/` si es reutilizable.
- Para lógica de backend, modificar o agregar funciones en `functions/index.js`.

## Archivos clave
- `firebase-config.js`: Configuración de Firebase.
- `functions/index.js`: Lógica de backend.
- `main.js`, `principal-dynamic.js`: Lógica principal de la web.
- `src/`: Componentes JS reutilizables.
- `pago/`: Vistas de pago.

## Notas
- Mantener la coherencia en el uso de clases y estilos.
- Seguir la estructura de carpetas para nuevas funcionalidades.
- Revisar el README para información general.

---
¿Falta algún flujo, integración o convención importante? Indica detalles específicos para mejorar esta guía.
