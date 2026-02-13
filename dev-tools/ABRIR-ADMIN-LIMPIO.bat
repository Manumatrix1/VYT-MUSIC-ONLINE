@echo off
echo ========================================
echo  ABRIENDO ADMIN.HTML SIN CACHE
echo ========================================
echo.
echo Cerrando Chrome/Edge...
taskkill /F /IM chrome.exe 2>nul
taskkill /F /IM msedge.exe 2>nul
timeout /t 2 >nul
echo.
echo Abriendo admin.html con cache busting...
start "" chrome.exe --disable-cache --disable-application-cache --disk-cache-size=1 "%~dp0admin.html?nocache=%random%"
if errorlevel 1 start "" msedge.exe --disable-cache --disable-application-cache --disk-cache-size=1 "%~dp0admin.html?nocache=%random%"
echo.
echo IMPORTANTE:
echo 1. Presiona F12 para abrir DevTools
echo 2. Ve a Application ^> Storage ^> Clear site data
echo 3. Click en "Incognito" o usa: Ctrl+Shift+N
echo.
echo Credenciales:
echo Email: luciano21martinez@gmail.com
echo Pass: @Aaron31981842
echo.
pause
