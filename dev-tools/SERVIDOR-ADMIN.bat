@echo off
echo 🌐 Iniciando VYT Music Admin en servidor local...
echo 📂 Carpeta: %cd%
echo 🔗 URL: http://localhost:8000/admin-facebook-style.html
echo.
echo ⚠️  IMPORTANTE: Deja esta ventana abierta mientras uses el admin
echo ❌ Para cerrar el servidor: Ctrl+C
echo.
python -m http.server 8000
pause