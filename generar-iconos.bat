@echo off
echo =========================================
echo   VYT MUSIC - GENERADOR DE ICONOS PWA
echo =========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Verificando Sharp...
npm list sharp >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Sharp no instalado, usando metodo placeholder
    node generate-pwa-icons.js --placeholder
    goto :manual
) else (
    echo [INFO] Sharp encontrado, generando iconos de alta calidad...
    node generate-pwa-icons.js
)

:manual
echo.
echo =========================================
echo   OPCION MANUAL (recomendado)
echo =========================================
echo.
echo Si prefieres iconos de MAXIMA calidad:
echo.
echo 1. Abre: https://realfavicongenerator.net/
echo 2. Sube tu logo (images/logo.png)
echo 3. Descarga el paquete
echo 4. Extrae en /images/icons/
echo.
echo Tamanos necesarios:
echo - 32x32, 72x72, 96x96, 128x128
echo - 144x144, 152x152, 192x192, 384x384, 512x512
echo.

pause
