@echo off
echo ========================================
echo  CONFIGURAR FIREBASE AUTHENTICATION
echo ========================================
echo.
echo Este script te ayudara a configurar:
echo  1. Google Sign-In
echo  2. Facebook Login
echo.
echo IMPORTANTE: Necesitas acceso a Firebase Console
echo.
pause

echo.
echo ========================================
echo  PASO 1: GOOGLE SIGN-IN
echo ========================================
echo.
echo 1. Abriendo Firebase Console...
start https://console.firebase.google.com/project/vytonlineprueva/authentication/providers
echo.
echo 2. Instrucciones:
echo    - En la lista, busca "Google"
echo    - Haz clic en "Google"
echo    - Activa el toggle "Habilitar"
echo    - Nombre publico: VYT Music
echo    - Correo de soporte: (tu email)
echo    - Guarda los cambios
echo.
pause

echo.
echo ========================================
echo  PASO 2: FACEBOOK LOGIN
echo ========================================
echo.
echo 1. Primero, necesitas crear una App de Facebook
echo 2. Abriendo Facebook Developers...
start https://developers.facebook.com/apps/create/
echo.
echo Instrucciones completas en: CONFIGURAR-AUTH-SOCIAL.md
echo.
pause

echo.
echo ========================================
echo  VERIFICACION
echo ========================================
echo.
echo Para probar que funciona:
echo.
echo 1. Abriendo pagina de login...
start https://vytonlineprueva.web.app/login.html
echo.
echo 2. Prueba hacer login con Google
echo 3. Si configuraste Facebook, pruebal tambien
echo.
echo ========================================
echo  LISTO!
echo ========================================
echo.
echo Revisa CONFIGURAR-AUTH-SOCIAL.md para mas detalles
echo.
pause
