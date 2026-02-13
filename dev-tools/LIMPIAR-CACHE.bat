@echo off
echo ========================================
echo   LIMPIEZA RAPIDA - ADMIN PANEL
echo ========================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0limpiar-cache-admin.ps1"
pause
