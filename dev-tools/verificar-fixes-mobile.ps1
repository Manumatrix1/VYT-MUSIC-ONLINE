# VYT MUSIC - Script de Verificación de Fixes Mobile
# Valida que los cambios de UX se hayan aplicado correctamente
# Fecha: 16 Enero 2026

Write-Host "🕵️ AUDITORÍA DE FIXES MOBILE VYT-MUSIC" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$errores = 0
$warnings = 0
$exitos = 0

# Función para verificar contenido en archivo
function Test-FileContent {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$TestName
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match $Pattern) {
            Write-Host "✅ $TestName" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $TestName" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "⚠️ $TestName - Archivo no encontrado: $FilePath" -ForegroundColor Yellow
        return $null
    }
}

Write-Host "📋 VERIFICANDO ARCHIVOS CRÍTICOS..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar style.css
Write-Host "1️⃣ Verificando style.css" -ForegroundColor White
$result = Test-FileContent -FilePath "style.css" -Pattern "flex-direction:\s*row" -TestName "Fix de tarjetas mobile (flex-direction: row)"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

$result = Test-FileContent -FilePath "style.css" -Pattern "@media\s*\(min-width:\s*768px\)" -TestName "Media queries responsive"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

$result = Test-FileContent -FilePath "style.css" -Pattern "object-fit:\s*cover" -TestName "Imágenes con object-fit"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

Write-Host ""

# 2. Verificar mobile-fixes.css
Write-Host "2️⃣ Verificando mobile-fixes.css" -ForegroundColor White
$result = Test-FileContent -FilePath "mobile-fixes.css" -Pattern "min-height:\s*44px" -TestName "Touch targets (44px mínimo)"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

$result = Test-FileContent -FilePath "mobile-fixes.css" -Pattern "safe-area-inset" -TestName "Soporte para notch de iPhone"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

$result = Test-FileContent -FilePath "mobile-fixes.css" -Pattern "orientation:\s*landscape" -TestName "Soporte modo landscape"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

Write-Host ""

# 3. Verificar index.html
Write-Host "3️⃣ Verificando index.html" -ForegroundColor White
$result = Test-FileContent -FilePath "index.html" -Pattern "body::before" -TestName "Overlay de fondo (body::before)"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

$result = Test-FileContent -FilePath "index.html" -Pattern "backdrop-filter:\s*blur" -TestName "Efecto blur en fondo"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

$result = Test-FileContent -FilePath "index.html" -Pattern "#loginModal" -TestName "Estilos del modal de login"
if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }

Write-Host ""

# 4. Verificar icon-standards.css
Write-Host "4️⃣ Verificando icon-standards.css" -ForegroundColor White
if (Test-Path "src/icon-standards.css") {
    Write-Host "✅ Archivo icon-standards.css existe" -ForegroundColor Green
    $exitos++
    
    $result = Test-FileContent -FilePath "src/icon-standards.css" -Pattern "\.vyt-icon" -TestName "Clase base .vyt-icon definida"
    if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }
    
    $result = Test-FileContent -FilePath "src/icon-standards.css" -Pattern "\.icon-home::before" -TestName "Iconos de navegación mapeados"
    if ($result -eq $true) { $exitos++ } elseif ($result -eq $false) { $errores++ } else { $warnings++ }
} else {
    Write-Host "⚠️ Archivo icon-standards.css NO EXISTE - Crear desde FIXES-CSS-MOBILE.css" -ForegroundColor Yellow
    $warnings++
}

Write-Host ""

# 5. Verificar Font Awesome en páginas
Write-Host "5️⃣ Verificando Font Awesome en páginas HTML" -ForegroundColor White
$htmlFiles = @("index.html", "certamenes.html", "perfil.html", "ranking.html")
$faPattern = "font-awesome/6\.4\.0"

foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match $faPattern) {
            Write-Host "✅ $file tiene Font Awesome 6.4.0" -ForegroundColor Green
            $exitos++
        } else {
            Write-Host "❌ $file NO tiene Font Awesome o versión incorrecta" -ForegroundColor Red
            $errores++
        }
    } else {
        Write-Host "⚠️ $file no encontrado" -ForegroundColor Yellow
        $warnings++
    }
}

Write-Host ""

# 6. Verificar navigation-component.js
Write-Host "6️⃣ Verificando uso de navigation-component.js" -ForegroundColor White
$htmlFiles = @("index.html", "certamenes.html", "ranking.html", "nosotros.html")
$navPattern = "navigation-component\.js"

foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match $navPattern) {
            Write-Host "✅ $file usa navigation-component.js" -ForegroundColor Green
            $exitos++
        } else {
            Write-Host "⚠️ $file NO usa navigation-component.js" -ForegroundColor Yellow
            $warnings++
        }
    }
}

Write-Host ""

# 7. Verificar archivos de backup
Write-Host "7️⃣ Verificando backups de seguridad" -ForegroundColor White
$backupFiles = @("style.css.backup", "mobile-fixes.css.backup", "index.html.backup")

foreach ($file in $backupFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Backup existe: $file" -ForegroundColor Green
        $exitos++
    } else {
        Write-Host "⚠️ NO existe backup: $file - Crear con: cp $($file.Replace('.backup','')) $file" -ForegroundColor Yellow
        $warnings++
    }
}

Write-Host ""

# 8. Verificar tamaño de archivos (detectar si están vacíos o corruptos)
Write-Host "8️⃣ Verificando integridad de archivos" -ForegroundColor White
$criticalFiles = @(
    @{Path="style.css"; MinSize=10KB},
    @{Path="mobile-fixes.css"; MinSize=5KB},
    @{Path="index.html"; MinSize=20KB}
)

foreach ($fileInfo in $criticalFiles) {
    if (Test-Path $fileInfo.Path) {
        $size = (Get-Item $fileInfo.Path).Length
        if ($size -gt $fileInfo.MinSize) {
            Write-Host "✅ $($fileInfo.Path) tiene tamaño válido ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
            $exitos++
        } else {
            Write-Host "❌ $($fileInfo.Path) sospechosamente pequeño ($([math]::Round($size/1KB, 2)) KB) - Podría estar corrupto" -ForegroundColor Red
            $errores++
        }
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE AUDITORÍA" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Éxitos:   $exitos" -ForegroundColor Green
Write-Host "⚠️ Warnings: $warnings" -ForegroundColor Yellow
Write-Host "❌ Errores:  $errores" -ForegroundColor Red
Write-Host ""

# Calcular score
$total = $exitos + $warnings + $errores
$score = if ($total -gt 0) { [math]::Round(($exitos / $total) * 100, 0) } else { 0 }

Write-Host "🎯 Score de Implementación: $score%" -ForegroundColor $(
    if ($score -ge 90) { "Green" }
    elseif ($score -ge 70) { "Yellow" }
    else { "Red" }
)

Write-Host ""

# Recomendaciones
if ($errores -gt 0) {
    Write-Host "🔴 CRÍTICO: Hay $errores errores que deben corregirse" -ForegroundColor Red
    Write-Host "   1. Revisa AUDITORIA-UX-MOBILE-2026.md" -ForegroundColor White
    Write-Host "   2. Aplica cambios de FIXES-CSS-MOBILE.css" -ForegroundColor White
    Write-Host "   3. Ejecuta este script nuevamente" -ForegroundColor White
} elseif ($warnings -gt 0) {
    Write-Host "🟡 HAY MEJORAS PENDIENTES: $warnings warnings" -ForegroundColor Yellow
    Write-Host "   - Sistema funcional pero puede optimizarse" -ForegroundColor White
    Write-Host "   - Revisa los warnings arriba para detalles" -ForegroundColor White
} else {
    Write-Host "🟢 ¡PERFECTO! Todos los fixes implementados correctamente" -ForegroundColor Green
    Write-Host "   Sistema listo para testing en dispositivos reales" -ForegroundColor White
}

Write-Host ""

# Testing siguiente paso
if ($score -ge 70) {
    Write-Host "📱 SIGUIENTE PASO: Testing en dispositivos" -ForegroundColor Cyan
    Write-Host "   1. Ejecutar: firebase serve" -ForegroundColor White
    Write-Host "   2. Abrir en móvil: http://$(hostname):5000" -ForegroundColor White
    Write-Host "   3. Probar:" -ForegroundColor White
    Write-Host "      - Certámenes (tarjetas en lista)" -ForegroundColor White
    Write-Host "      - Modal de login (legibilidad)" -ForegroundColor White
    Write-Host "      - Navegación (iconos consistentes)" -ForegroundColor White
    Write-Host "      - Botones (mínimo 44px táctil)" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Script completado" -ForegroundColor Cyan
Write-Host ""

# Salir con código según resultado
if ($errores -gt 0) {
    exit 1
} else {
    exit 0
}
