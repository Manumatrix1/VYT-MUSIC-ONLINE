@echo off
echo ========================================
echo  LIMPIEZA TOTAL DE CACHE - VYT MUSIC
echo ========================================
echo.
echo Este script va a:
echo  1. Cerrar TODOS los navegadores
echo  2. Borrar TODA la cache de Edge
echo  3. Borrar TODA la cache de Chrome  
echo  4. Limpiar archivos temporales
echo  5. Abrir Edge en modo INCOGNITO SIN CACHE
echo.
echo ADVERTENCIA: Perderas todas las sesiones abiertas
echo.
pause
echo.
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0BORRAR-CACHE-TOTAL.ps1'"
