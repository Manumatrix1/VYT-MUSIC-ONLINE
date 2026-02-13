#!/usr/bin/env pwsh
# LIMPIEZA RÁPIDA DE CACHÉ PARA ADMIN.HTML

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  LIMPIEZA RÁPIDA - ADMIN PANEL" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Cerrar navegadores
Write-Host "1. Cerrando navegadores..." -ForegroundColor Yellow
Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "msedge" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 2. Limpiar localStorage y caché de Chrome
Write-Host "2. Limpiando caché de Chrome..." -ForegroundColor Yellow
$chromePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default"
if (Test-Path $chromePath) {
    Remove-Item "$chromePath\Local Storage\leveldb\*" -Force -ErrorAction SilentlyContinue
    Remove-Item "$chromePath\Session Storage\*" -Force -ErrorAction SilentlyContinue
    Remove-Item "$chromePath\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Caché de Chrome limpiado" -ForegroundColor Green
}

# 3. Limpiar localStorage y caché de Edge
Write-Host "3. Limpiando caché de Edge..." -ForegroundColor Yellow
$edgePath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default"
if (Test-Path $edgePath) {
    Remove-Item "$edgePath\Local Storage\leveldb\*" -Force -ErrorAction SilentlyContinue
    Remove-Item "$edgePath\Session Storage\*" -Force -ErrorAction SilentlyContinue
    Remove-Item "$edgePath\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Caché de Edge limpiado" -ForegroundColor Green
}

Start-Sleep -Seconds 1

# 4. Abrir admin.html en modo incógnito
Write-Host "4. Abriendo admin.html en modo incógnito..." -ForegroundColor Yellow
$adminPath = Join-Path $PSScriptRoot "admin.html"
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()

# Intentar Chrome primero
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (Test-Path $chromePath) {
    Start-Process $chromePath -ArgumentList "--incognito", "--disable-cache", "$adminPath?v=$timestamp"
    Write-Host "   ✓ Chrome abierto en modo incógnito" -ForegroundColor Green
} else {
    # Intentar Edge
    Start-Process "msedge.exe" -ArgumentList "-inprivate", "$adminPath?v=$timestamp"
    Write-Host "   ✓ Edge abierto en modo incógnito" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  ✓ LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "CREDENCIALES:" -ForegroundColor Cyan
Write-Host "  Email: luciano21martinez@gmail.com" -ForegroundColor White
Write-Host "  Pass:  @Aaron31981842" -ForegroundColor White
Write-Host ""
Write-Host "Presiona F12 y ve a Console para ver los logs de login" -ForegroundColor Yellow
Write-Host ""
