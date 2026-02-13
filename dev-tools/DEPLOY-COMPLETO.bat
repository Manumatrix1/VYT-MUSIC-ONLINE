@echo off
echo ==========================================
echo   VYT MUSIC - DEPLOY COMPLETO
echo ==========================================
echo.

REM Colores
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%RESET% Node.js no instalado
    pause
    exit /b 1
)

REM Verificar Firebase CLI
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%RESET% Firebase CLI no instalado
    echo Instalar: npm install -g firebase-tools
    pause
    exit /b 1
)

echo %YELLOW%[INFO]%RESET% Verificando login Firebase...
firebase login:list
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%[INFO]%RESET% Iniciando sesion...
    firebase login
)

echo.
echo ==========================================
echo   PASO 1: GENERAR ICONOS PWA
echo ==========================================
echo.
echo %YELLOW%[?]%RESET% ¿Ya generaste los iconos PWA?
echo    1) Si, continuar con deploy
echo    2) No, generar ahora
echo    3) Cancelar
echo.
choice /c 123 /n /m "Opcion: "

if %ERRORLEVEL%==3 (
    echo %RED%[CANCELADO]%RESET% Deploy cancelado
    pause
    exit /b 0
)

if %ERRORLEVEL%==2 (
    echo %YELLOW%[INFO]%RESET% Generando iconos placeholder...
    node generate-pwa-icons.js --placeholder
    echo.
    echo %YELLOW%[!]%RESET% IMPORTANTE: Reemplaza los iconos con versiones de alta calidad
    echo     https://realfavicongenerator.net/
    echo.
    pause
)

echo.
echo ==========================================
echo   PASO 2: SELECCIONAR ENTORNO
echo ==========================================
echo.
echo    1) Desarrollo (vytonlineprueva)
echo    2) Produccion (vyt-online)
echo    3) Cancelar
echo.
choice /c 123 /n /m "Entorno: "

if %ERRORLEVEL%==3 (
    echo %RED%[CANCELADO]%RESET% Deploy cancelado
    pause
    exit /b 0
)

if %ERRORLEVEL%==1 (
    set "PROJECT=desarrollo"
    set "URL=https://vytonlineprueva.web.app"
)

if %ERRORLEVEL%==2 (
    set "PROJECT=produccion"
    set "URL=https://vyt-online.web.app"
    echo.
    echo %RED%[!]%RESET% ATENCION: Deploy a PRODUCCION
    echo %YELLOW%[!]%RESET% Asegurate de haber testeado en desarrollo
    echo.
    pause
)

echo.
echo %GREEN%[OK]%RESET% Entorno seleccionado: %PROJECT%
echo.

echo ==========================================
echo   PASO 3: COMPILAR ASSETS
echo ==========================================
echo.

REM Verificar si existe package.json
if exist package.json (
    echo %YELLOW%[INFO]%RESET% Instalando dependencias...
    call npm install
    
    REM Compilar Tailwind si existe script
    npm run build:css >nul 2>nul
    if %ERRORLEVEL%==0 (
        echo %GREEN%[OK]%RESET% Tailwind CSS compilado
    )
)

echo.
echo ==========================================
echo   PASO 4: DEPLOY FIREBASE
echo ==========================================
echo.

echo %YELLOW%[1/4]%RESET% Deploying Firestore Rules...
firebase deploy --only firestore:rules --project %PROJECT%
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%RESET% Fallo en Firestore Rules
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Firestore Rules deployed

echo.
echo %YELLOW%[2/4]%RESET% Deploying Storage Rules...
firebase deploy --only storage --project %PROJECT%
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%RESET% Fallo en Storage Rules
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Storage Rules deployed

echo.
echo %YELLOW%[3/4]%RESET% Deploying Cloud Functions...
echo    (Esto puede tardar 3-5 minutos)
firebase deploy --only functions --project %PROJECT%
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%RESET% Fallo en Functions
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Functions deployed

echo.
echo %YELLOW%[4/4]%RESET% Deploying Hosting...
firebase deploy --only hosting --project %PROJECT%
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%RESET% Fallo en Hosting
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Hosting deployed

echo.
echo ==========================================
echo   DEPLOY EXITOSO
echo ==========================================
echo.
echo %GREEN%[OK]%RESET% Sistema desplegado correctamente
echo.
echo URL: %URL%
echo Proyecto: %PROJECT%
echo.
echo PROXIMOS PASOS:
echo.
echo 1. Abre la URL en tu navegador
echo 2. En movil, espera 5 segundos para ver el banner de instalacion
echo 3. Instala la PWA
echo 4. Prueba funcionalidad offline (modo avion)
echo 5. Verifica VYT Money funciona
echo 6. Test inscripcion y votacion
echo.
echo MOBILE TESTING:
echo - Android: Chrome ^> Banner "Agregar a inicio"
echo - iOS: Safari ^> Compartir ^> "Agregar a inicio"
echo.
echo %YELLOW%[!]%RESET% Ver logs en tiempo real:
echo     firebase functions:log --project %PROJECT%
echo.

REM Abrir URL en navegador
echo %YELLOW%[?]%RESET% ¿Abrir URL en navegador?
choice /c SN /n /m "[S/N]: "
if %ERRORLEVEL%==1 (
    start %URL%
)

echo.
echo %GREEN%[FINALIZADO]%RESET% Deploy completado
echo.
pause
