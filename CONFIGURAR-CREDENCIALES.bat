@echo off
echo ==========================================
echo   CONFIGURAR CREDENCIALES - VYT MUSIC
echo ==========================================
echo.
echo Este script configurara las credenciales necesarias
echo para MercadoPago y Gmail en Firebase Functions.
echo.
echo IMPORTANTE: Necesitas tener:
echo 1. Access Token de MercadoPago
echo 2. Public Key de MercadoPago
echo 3. Email de Gmail
echo 4. App Password de Gmail (16 caracteres)
echo.
pause
echo.

REM Solicitar credenciales MercadoPago
echo [1/5] MERCADOPAGO ACCESS TOKEN
echo.
echo Obtenerlo en: https://mercadopago.com.ar/developers
echo Tu cuenta ^> Credenciales ^> Access Token de Produccion
echo.
set /p MP_TOKEN="Pega tu Access Token (APP_USR-...): "
echo.

echo [2/5] MERCADOPAGO PUBLIC KEY
echo.
set /p MP_PUBLIC_KEY="Pega tu Public Key (APP_USR-...): "
echo.

REM Solicitar credenciales Gmail
echo [3/5] GMAIL EMAIL
echo.
set /p GMAIL_EMAIL="Ingresa tu email de Gmail: "
echo.

echo [4/5] GMAIL APP PASSWORD
echo.
echo Generarlo en: https://myaccount.google.com/apppasswords
echo Cuenta Google ^> Seguridad ^> Verificacion en 2 pasos ^> Contrasenas de aplicaciones
echo.
set /p GMAIL_PASSWORD="Pega tu App Password (16 caracteres sin espacios): "
echo.

echo [5/5] SITE URL
echo.
set /p SITE_URL="URL del sitio (Enter para default vytonlineprueva.web.app): "
if "%SITE_URL%"=="" set SITE_URL=https://vytonlineprueva.web.app
echo.

REM Configurar en Firebase (desarrollo)
echo.
echo ==========================================
echo   CONFIGURANDO FIREBASE (desarrollo)
echo ==========================================
echo.

firebase functions:config:set mercadopago.token="%MP_TOKEN%" --project desarrollo
firebase functions:config:set mercadopago.public_key="%MP_PUBLIC_KEY%" --project desarrollo
firebase functions:config:set gmail.email="%GMAIL_EMAIL%" --project desarrollo
firebase functions:config:set gmail.password="%GMAIL_PASSWORD%" --project desarrollo
firebase functions:config:set site.url="%SITE_URL%" --project desarrollo

echo.
echo ==========================================
echo   VERIFICANDO CONFIGURACION
echo ==========================================
echo.

firebase functions:config:get --project desarrollo

echo.
echo ==========================================
echo   CONFIGURACION COMPLETADA
echo ==========================================
echo.
echo Las credenciales estan configuradas en Firebase Functions.
echo.
echo SIGUIENTE PASO:
echo 1. Actualizar PUBLIC_KEY en comprar-vyt-money.html
echo 2. Actualizar PUBLIC_KEY en pagar-inscripcion.html
echo 3. Deploy de functions: firebase deploy --only functions --project desarrollo
echo.
pause
