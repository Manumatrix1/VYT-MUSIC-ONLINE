# ===== SCRIPT OPTIMIZACIÓN VS CODE =====
# Limpia caché y cierra procesos pesados

Write-Host "Optimizando VS Code..." -ForegroundColor Cyan

# 1. Cerrar VS Code
Write-Host "`nCerrando VS Code..." -ForegroundColor Yellow
Get-Process code -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Limpiar caché VS Code
Write-Host "`nLimpiando cache VS Code..." -ForegroundColor Yellow
$vscodeCache = "$env:APPDATA\Code\Cache"
$vscodeCacheData = "$env:APPDATA\Code\CachedData"
$vscodeGPU = "$env:APPDATA\Code\GPUCache"

if (Test-Path $vscodeCache) {
    Remove-Item -Path "$vscodeCache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cache limpiado" -ForegroundColor Green
}

if (Test-Path $vscodeCacheData) {
    Remove-Item -Path "$vscodeCacheData\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "CachedData limpiado" -ForegroundColor Green
}

if (Test-Path $vscodeGPU) {
    Remove-Item -Path "$vscodeGPU\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "GPUCache limpiado" -ForegroundColor Green
}

# 3. Limpiar workspace storage
Write-Host "`nLimpiando workspace storage..." -ForegroundColor Yellow
$workspaceStorage = "$env:APPDATA\Code\User\workspaceStorage"
if (Test-Path $workspaceStorage) {
    Get-ChildItem $workspaceStorage -Directory | ForEach-Object {
        $workspace = $_
        if ((Get-Date) - $workspace.LastWriteTime -gt (New-TimeSpan -Days 7)) {
            Remove-Item $workspace.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Workspace storage limpiado" -ForegroundColor Green
}

# 4. Limpiar archivos temporales del proyecto
Write-Host "`nLimpiando archivos temporales..." -ForegroundColor Yellow
$projectPath = $PSScriptRoot

# Limpiar logs
Get-ChildItem -Path $projectPath -Filter "*.log" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "Logs eliminados" -ForegroundColor Green

# Limpiar cache Firebase
if (Test-Path "$projectPath\.firebase") {
    Get-ChildItem -Path "$projectPath\.firebase" -Filter "*.cache" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "Firebase cache limpiado" -ForegroundColor Green
}

# 5. Optimizar Git
Write-Host "`nOptimizando Git..." -ForegroundColor Yellow
Set-Location $projectPath
git gc --aggressive --prune=now 2>$null
Write-Host "Git optimizado" -ForegroundColor Green

# 6. Verificar memoria disponible
Write-Host "`nEstado del sistema:" -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
$totalRAM = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$freeRAM = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$usedRAM = $totalRAM - $freeRAM
Write-Host "  RAM Total: $totalRAM GB" -ForegroundColor White
Write-Host "  RAM Usada: $usedRAM GB" -ForegroundColor White
Write-Host "  RAM Libre: $freeRAM GB" -ForegroundColor Green

# 7. Crear archivo de configuración de lanzamiento optimizado
Write-Host "`nCreando launcher optimizado..." -ForegroundColor Yellow
$launcherPath = "$projectPath\ABRIR-VSCODE-OPTIMIZADO.bat"
$batContent = "@echo off`r`necho Abriendo VS Code con configuracion optimizada...`r`ncode --disable-gpu --max-memory=2048 `"$projectPath`""
$batContent | Out-File -FilePath $launcherPath -Encoding ASCII -Force
Write-Host "Launcher creado: ABRIR-VSCODE-OPTIMIZADO.bat" -ForegroundColor Green

Write-Host "`nOPTIMIZACION COMPLETA" -ForegroundColor Green
Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "1. Ejecuta: ABRIR-VSCODE-OPTIMIZADO.bat" -ForegroundColor White
Write-Host "2. En VS Code, presiona Ctrl+Shift+P" -ForegroundColor White
Write-Host "3. Escribe: 'Developer: Reload Window'" -ForegroundColor White
Write-Host "4. Si sigue lento, desactiva extensiones innecesarias" -ForegroundColor White

Write-Host "`nPresiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

