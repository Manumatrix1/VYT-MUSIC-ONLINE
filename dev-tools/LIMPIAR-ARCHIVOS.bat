@echo off
echo ==========================================
echo   VYT MUSIC - LIMPIEZA DE ARCHIVOS
echo ==========================================
echo.

REM Crear carpetas
echo [1/3] Creando carpetas...
if not exist "_OLD" mkdir "_OLD"
if not exist "_TESTING" mkdir "_TESTING"

REM Mover archivos duplicados
echo [2/3] Moviendo archivos duplicados a _OLD...
if exist "inscripcion_online.html" move "inscripcion_online.html" "_OLD\" >nul 2>&1
if exist "inscripcion_presencial.html" move "inscripcion_presencial.html" "_OLD\" >nul 2>&1
if exist "principal-simple.html" move "principal-simple.html" "_OLD\" >nul 2>&1
if exist "perfil-simple.html" move "perfil-simple.html" "_OLD\" >nul 2>&1
if exist "perfil-artista-demo.html" move "perfil-artista-demo.html" "_OLD\" >nul 2>&1
if exist "crear-perfil-simple.html" move "crear-perfil-simple.html" "_OLD\" >nul 2>&1
if exist "certamenes_fixed.html" move "certamenes_fixed.html" "_OLD\" >nul 2>&1
if exist "registro-simple.html" move "registro-simple.html" "_OLD\" >nul 2>&1

REM Mover archivos de testing
echo [3/3] Moviendo archivos de testing a _TESTING...
if exist "testing-hub.html" move "testing-hub.html" "_TESTING\" >nul 2>&1
if exist "check-content.html" move "check-content.html" "_TESTING\" >nul 2>&1
if exist "consultar-datos.html" move "consultar-datos.html" "_TESTING\" >nul 2>&1
if exist "firebase-debug.html" move "firebase-debug.html" "_TESTING\" >nul 2>&1
if exist "init-database.html" move "init-database.html" "_TESTING\" >nul 2>&1
if exist "crear-test-participante.html" move "crear-test-participante.html" "_TESTING\" >nul 2>&1
if exist "diagnostico-navegador.js" move "diagnostico-navegador.js" "_TESTING\" >nul 2>&1
if exist "demanda-geografica.html" move "demanda-geografica.html" "_TESTING\" >nul 2>&1
if exist "configuracion-sistema.html" move "configuracion-sistema.html" "_TESTING\" >nul 2>&1
if exist "estado-certamen.html" move "estado-certamen.html" "_TESTING\" >nul 2>&1
if exist "jurado.html" move "jurado.html" "_TESTING\" >nul 2>&1
if exist "fan-mode.html" move "fan-mode.html" "_TESTING\" >nul 2>&1

echo.
echo ==========================================
echo   LIMPIEZA COMPLETADA
echo ==========================================
echo.
echo Archivos duplicados movidos a: _OLD\
echo Archivos de testing movidos a: _TESTING\
echo.
echo IMPORTANTE:
echo - Los archivos en _OLD pueden eliminarse en 1 mes
echo - Los archivos en _TESTING son utiles para desarrollo
echo - Probar navegacion del sitio antes de eliminar
echo.
pause
