// Global nav shim to avoid 404s on pages that reference nav-global.js.
// Keeps behavior unchanged; navigation is still handled by navigation.js/navigation-component.js.
(function () {
    if (window.__vytNavGlobalLoaded) return;
    window.__vytNavGlobalLoaded = true;
    console.log('✅ nav-global.js cargado (shim)');
})();
