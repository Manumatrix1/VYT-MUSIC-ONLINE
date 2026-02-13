# VYT MUSIC - Validador de Coherencia Visual
# Verifica design-tokens.css y logos

Write-Host "`nVYT MUSIC - VALIDADOR DE COHERENCIA" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$total = 0
$conTokens = 0
$logoOK = 0
$logoViejo = 0

Get-ChildItem -Filter *.html | Where-Object { $_.Name -notlike "*backup*" -and $_.Name -notlike "*OLD*" } | ForEach-Object {
    $total++
    $contenido = Get-Content $_.FullName -Raw
    $nombre = $_.Name.PadRight(40)
    
    $tieneTokens = $contenido -match 'design-tokens\.css'
    $logoNuevo = $contenido -match 'Ldwq7cNx/logo-blanco'
    $logoAntiguo = $contenido -match 'TcFydZg/1-2-Logo'
    
    if ($tieneTokens) { $conTokens++ }
    if ($logoNuevo) { $logoOK++ }
    if ($logoAntiguo) { $logoViejo++ }
    
    $estado = ""
    $color = "Red"
    
    if ($tieneTokens -and $logoNuevo) {
        $estado = "OK COMPLETO"
        $color = "Green"
    } elseif ($tieneTokens) {
        $estado = "OK Tokens / Revisar Logo"
        $color = "Yellow"
    } elseif ($logoNuevo) {
        $estado = "Falta Tokens / OK Logo"
        $color = "Yellow"
    } else {
        $estado = "PENDIENTE"
        $color = "Red"
    }
    
    Write-Host "$nombre | $estado" -ForegroundColor $color
}

$porcentaje = [math]::Round(($conTokens / $total) * 100)

Write-Host "`n====================================`n" -ForegroundColor Cyan
Write-Host "RESUMEN:" -ForegroundColor Yellow
Write-Host "  Total paginas: $total"
Write-Host "  Con design-tokens.css: $conTokens de $total ($porcentaje%)"
Write-Host "  Logo correcto: $logoOK"
Write-Host "  Logo viejo: $logoViejo`n"

Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "  1. Implementar tokens en $($total - $conTokens) paginas"
Write-Host "  2. Actualizar $logoViejo logos viejos`n"
