# ========================================
# BORRADOR TOTAL DE CACHE - VYT MUSIC
# ========================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " LIMPIEZA TOTAL DE CACHE VYT MUSIC" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. CERRAR TODOS LOS NAVEGADORES
Write-Host "[1/6] Cerrando navegadores..." -ForegroundColor Green
$browsers = @('chrome', 'msedge', 'firefox', 'iexplore', 'opera', 'brave')
foreach ($browser in $browsers) {
    $processes = Get-Process -Name $browser -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "  - Cerrando $browser ($($processes.Count) procesos)..." -ForegroundColor Yellow
        Stop-Process -Name $browser -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
}
Write-Host "  [OK] Navegadores cerrados" -ForegroundColor Green
Write-Host ""

# 2. ESPERAR A QUE SE CIERREN COMPLETAMENTE
Write-Host "[2/6] Esperando cierre completo..." -ForegroundColor Green
Start-Sleep -Seconds 2
Write-Host "  [OK] Listo" -ForegroundColor Green
Write-Host ""

# 3. LIMPIAR CACHE DE MICROSOFT EDGE
Write-Host "[3/6] Limpiando cache de Microsoft Edge..." -ForegroundColor Green
$edgePaths = @(
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\GPUCache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Service Worker",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\IndexedDB",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Local Storage"
)

foreach ($path in $edgePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Path "$path\*" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  - Borrado: $path" -ForegroundColor Yellow
        } catch {
            Write-Host "  - Saltando: $path (en uso)" -ForegroundColor DarkGray
        }
    }
}
Write-Host "  [OK] Cache de Edge limpiada" -ForegroundColor Green
Write-Host ""

# 4. LIMPIAR CACHE DE GOOGLE CHROME
Write-Host "[4/6] Limpiando cache de Google Chrome..." -ForegroundColor Green
$chromePaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\GPUCache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\IndexedDB",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Local Storage"
)

foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Path "$path\*" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  - Borrado: $path" -ForegroundColor Yellow
        } catch {
            Write-Host "  - Saltando: $path (en uso)" -ForegroundColor DarkGray
        }
    }
}
Write-Host "  [OK] Cache de Chrome limpiada" -ForegroundColor Green
Write-Host ""

# 5. LIMPIAR TEMP DE WINDOWS
Write-Host "[5/6] Limpiando archivos temporales de Windows..." -ForegroundColor Green
$tempPaths = @(
    "$env:TEMP\*",
    "$env:LOCALAPPDATA\Temp\*"
)

foreach ($path in $tempPaths) {
    try {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
    } catch {
        # Silenciar errores de archivos en uso
    }
}
Write-Host "  [OK] Archivos temporales limpiados" -ForegroundColor Green
Write-Host ""

# 6. ABRIR NAVEGADOR EN MODO ESPECIAL
Write-Host "[6/6] Abriendo navegador en modo sin cache..." -ForegroundColor Green
$url = "https://vyt-online.web.app/admin.html"

# Intentar abrir Edge primero (porque es el que usa el usuario)
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (Test-Path $edgePath) {
    Write-Host "  - Abriendo Microsoft Edge (modo sin cache)..." -ForegroundColor Yellow
    Start-Process -FilePath $edgePath -ArgumentList "--inprivate", "--disable-cache", "--disable-application-cache", "--disk-cache-size=1", $url
    Write-Host "  [OK] Edge abierto en modo InPrivate SIN CACHE" -ForegroundColor Green
} else {
    # Fallback a Chrome si Edge no está disponible
    $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    if (Test-Path $chromePath) {
        Write-Host "  - Abriendo Google Chrome (modo sin cache)..." -ForegroundColor Yellow
        Start-Process -FilePath $chromePath -ArgumentList "--incognito", "--disable-cache", "--disable-application-cache", "--disk-cache-size=1", $url
        Write-Host "  [OK] Chrome abierto en modo Incognito SIN CACHE" -ForegroundColor Green
    } else {
        # Fallback a comando genérico
        Write-Host "  - Abriendo navegador predeterminado..." -ForegroundColor Yellow
        Start-Process $url
        Write-Host "  [OK] Navegador abierto" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " LIMPIEZA COMPLETA!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciales de acceso:" -ForegroundColor White
Write-Host "  Email: luciano21martinez@gmail.com" -ForegroundColor Yellow
Write-Host "  Pass:  @Aaron31981842" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: El navegador se abrio en modo INCOGNITO con cache DESHABILITADA" -ForegroundColor Cyan
Write-Host "Presiona F12 para abrir la consola y ver los logs" -ForegroundColor Cyan
Write-Host ""
pause
