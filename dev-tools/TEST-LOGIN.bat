@echo off
echo ========================================
echo  TEST DE LOGIN VYT MUSIC
echo ========================================
echo.
echo Este archivo te ayudara a probar el login localmente
echo.
echo Credenciales:
echo   Email: luciano21martinez@gmail.com
echo   Pass:  @Aaron31981842
echo.
pause
echo.
echo Abriendo test-login.html...
start "" chrome.exe --new-window "%~dp0test-login.html"
if errorlevel 1 start "" msedge.exe --new-window "%~dp0test-login.html"
echo.
echo Instrucciones:
echo 1. Ingresa la contrasena: @Aaron31981842
echo 2. Click en "Iniciar Sesion"
echo 3. Observa los mensajes en el recuadro gris
echo 4. Si funciona, el admin.html tiene un problema diferente
echo.
pause
