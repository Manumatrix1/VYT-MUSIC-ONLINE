# VYT MUSIC - Sprint 2: Limpieza de Archivos Obsoletos
# Fecha: 9 de Enero 2026

Write-Host "`n=== SPRINT 2: LIMPIEZA DE ARCHIVOS OBSOLETOS ===" -ForegroundColor Cyan
Write-Host "Identificando archivos innecesarios...`n" -ForegroundColor Yellow

$archivosObsoletos = @(
    "certamenes-OLD.html",
    "certamenes-backup.html",
    "cleanup.html",
    "login-redirect.html",
    "backup-vyt-online-2025-09-12.json"
)

$carpetasObsoletas = @(
    "DOCS_Y_BACKUPS"
)

Write-Host "ARCHIVOS A ELIMINAR:" -ForegroundColor Red
foreach ($archivo in $archivosObsoletos) {
    if (Test-Path $archivo) {
        $size = (Get-Item $archivo).Length / 1KB
        Write-Host "  - $archivo ($([math]::Round($size, 2)) KB)" -ForegroundColor Gray
    }
}

Write-Host "`nCARPETAS A ELIMINAR:" -ForegroundColor Red
foreach ($carpeta in $carpetasObsoletas) {
    if (Test-Path $carpeta) {
        Write-Host "  - $carpeta/" -ForegroundColor Gray
    }
}

Write-Host "`n¿Deseas continuar con la limpieza? (S/N): " -ForegroundColor Yellow -NoNewline
$respuesta = Read-Host

if ($respuesta -eq "S" -or $respuesta -eq "s") {
    Write-Host "`nEliminando archivos..." -ForegroundColor Green
    
    foreach ($archivo in $archivosObsoletos) {
        if (Test-Path $archivo) {
            Remove-Item $archivo -Force
            Write-Host "  Eliminado: $archivo" -ForegroundColor Green
        }
    }
    
    foreach ($carpeta in $carpetasObsoletas) {
        if (Test-Path $carpeta) {
            Remove-Item $carpeta -Recurse -Force
            Write-Host "  Eliminada carpeta: $carpeta/" -ForegroundColor Green
        }
    }
    
    Write-Host "`nLimpieza completada!" -ForegroundColor Green
    Write-Host "Espacio liberado: ~500 KB`n" -ForegroundColor Cyan
} else {
    Write-Host "`nLimpieza cancelada.`n" -ForegroundColor Yellow
}
