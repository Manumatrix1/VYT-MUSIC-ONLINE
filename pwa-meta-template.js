/**
 * VYT MUSIC - Template HTML Base para PWA
 * Este es un snippet que puedes copiar al <head> de todas tus páginas HTML
 */

/*
COPIAR ESTO AL <HEAD> DE CADA PÁGINA HTML:
<!-- ==================================================== -->
<!-- PWA Meta Tags - VYT MUSIC -->
<!-- ==================================================== -->

<!-- Descripción y theme -->
<meta name="description" content="VYT Music - Plataforma de certámenes de canto online. Inscríbete, vota y gana premios.">
<meta name="theme-color" content="#00d9ff">

<!-- PWA Capabilities -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="VYT Music">

<!-- Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Icons -->
<link rel="icon" type="image/png" sizes="32x32" href="/images/icons/icon-32x32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/images/icons/icon-192x192.png">
<link rel="apple-touch-icon" href="/images/icons/icon-192x192.png">

<!-- ==================================================== -->
<!-- Fin PWA Meta Tags -->
<!-- ==================================================== -->


COPIAR ESTO ANTES DEL </BODY> DE CADA PÁGINA:
<!-- PWA Installer -->
<script src="/pwa-installer.js"></script>
*/

// Lista de archivos HTML que necesitan actualización
const HTML_FILES_TO_UPDATE = [
  'principal.html',
  'certamenes.html',
  'ranking.html',
  'inscripcion-unificada.html',
  'comprar-vyt-money.html',
  'perfil-artista.html',
  'crear-perfil-artista.html',
  'nosotros.html',
  'reglamento.html',
  'admin.html',
  'pagar-inscripcion.html',
  'pago/inscripcion-exitosa.html',
  'pago/inscripcion-fallida.html',
  'pago/pago_exitoso.html',
  'pago/pago_fallido.html'
];

// Meta tags completos
const PWA_META_TAGS = `
    <!-- PWA Meta Tags -->
    <meta name="description" content="VYT Music - Plataforma de certámenes de canto online. Inscríbete, vota y gana premios.">
    <meta name="theme-color" content="#00d9ff">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="VYT Music">
    
    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Icons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/icon-32x32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/images/icons/icon-192x192.png">
    <link rel="apple-touch-icon" href="/images/icons/icon-192x192.png">
`;

const PWA_SCRIPT = `
    <!-- PWA Installer -->
    <script src="/pwa-installer.js"></script>
`;

console.log('📋 Template de PWA Meta Tags preparado');
console.log('📁 Archivos que necesitan actualización:', HTML_FILES_TO_UPDATE.length);

module.exports = {
  PWA_META_TAGS,
  PWA_SCRIPT,
  HTML_FILES_TO_UPDATE
};
