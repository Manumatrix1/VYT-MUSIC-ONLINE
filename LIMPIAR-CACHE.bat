@echo off
echo ========================================
echo  LIMPIAR CACHE COMPLETO - VYT MUSIC
echo ========================================
echo.
echo Este script te guiara para limpiar el cache
echo y ver los cambios nuevos del sistema.
echo.
pause

echo.
echo PASO 1: Abriendo pagina de cleanup...
start https://vytonlineprueva.web.app/cleanup.html
echo.
echo INSTRUCCIONES:
echo 1. Espera a que cargue cleanup.html
echo 2. Haz click en "Limpiar Todo"
echo 3. Cierra TODAS las pestanas de Chrome
echo.
pause

echo.
echo PASO 2: Limpiando cache de Chrome manualmente...
echo.
echo INSTRUCCIONES:
echo 1. Abre Chrome DevTools (F12)
echo 2. Click derecho en el boton de recargar
echo 3. Selecciona "Vaciar cache y volver a cargar de forma forzada"
echo.
echo O simplemente:
echo - Windows: Ctrl + Shift + R
echo - O: Ctrl + F5
echo.
pause

echo.
echo PASO 3: Abriendo la app...
start https://vytonlineprueva.web.app/login.html
echo.
echo Ahora deberia ver los cambios:
echo - Login usa auth-handler.js
echo - Redirige a perfil.html (visitante) o perfil-artista.html (artista)
echo - No mas errores en consola
echo.
echo PARA VERIFICAR QUE FUNCIONA:
echo 1. Abre DevTools (F12)
echo 2. Ve a la pestana Console
echo 3. Deberia ver: "auth-handler.js cargado"
echo 4. NO deberia ver: "authHandler is undefined"
echo.
pause

echo.
echo ========================================
echo  Si AUN no ves cambios:
echo ========================================
echo.
echo 1. Desinstala la PWA del telefono
echo 2. En Chrome, ve a: chrome://serviceworker-internals
echo 3. Busca "vytonlineprueva" y dale "Unregister"
echo 4. Cierra TODO Chrome
echo 5. Abre nuevamente
echo.
pause
