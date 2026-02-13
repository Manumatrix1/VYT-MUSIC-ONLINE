# ============================================
# SPRINT 3 - OPTIMIZACIÓN DE IMÁGENES VYT MUSIC
# ============================================
# Convierte imágenes a WebP, genera versiones responsive
# Comprime automáticamente para mejorar performance
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VYT MUSIC - OPTIMIZACIÓN DE IMÁGENES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si existe Sharp/ImageMagick (npm sharp es mejor opción)
$nodeExists = Get-Command node -ErrorAction SilentlyContinue

if (-not $nodeExists) {
    Write-Host "⚠️  Node.js no encontrado. Instalando dependencias..." -ForegroundColor Yellow
    Write-Host "Ejecuta manualmente: npm install sharp --save-dev" -ForegroundColor Yellow
    exit 1
}

# Crear script Node.js para optimización
$optimizeScript = @"
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración de calidad y tamaños
const config = {
    quality: 80,
    sizes: {
        thumbnail: 300,
        medium: 800,
        full: 1920
    }
};

// Directorios a procesar
const directories = [
    './img',
    './images',
    './assets',
    './src/assets'
];

async function optimizeImage(inputPath, outputDir) {
    const filename = path.basename(inputPath, path.extname(inputPath));
    const stats = fs.statSync(inputPath);
    
    console.log(\`🔄 Procesando: \${filename}\`);
    
    try {
        // Generar versiones responsive
        await Promise.all([
            // Thumbnail WebP
            sharp(inputPath)
                .resize(config.sizes.thumbnail, null, { fit: 'inside' })
                .webp({ quality: config.quality })
                .toFile(path.join(outputDir, \`\${filename}-thumb.webp\`)),
            
            // Medium WebP
            sharp(inputPath)
                .resize(config.sizes.medium, null, { fit: 'inside' })
                .webp({ quality: config.quality })
                .toFile(path.join(outputDir, \`\${filename}-medium.webp\`)),
            
            // Full WebP
            sharp(inputPath)
                .resize(config.sizes.full, null, { fit: 'inside' })
                .webp({ quality: config.quality })
                .toFile(path.join(outputDir, \`\${filename}-full.webp\`)),
            
            // Original WebP (sin resize)
            sharp(inputPath)
                .webp({ quality: config.quality })
                .toFile(path.join(outputDir, \`\${filename}.webp\`))
        ]);
        
        const newStats = fs.statSync(path.join(outputDir, \`\${filename}.webp\`));
        const reduction = ((stats.size - newStats.size) / stats.size * 100).toFixed(2);
        
        console.log(\`✅ \${filename}: \${(stats.size / 1024).toFixed(2)} KB → \${(newStats.size / 1024).toFixed(2)} KB (-\${reduction}%)\`);
        
        return {
            original: stats.size,
            optimized: newStats.size,
            reduction: reduction
        };
    } catch (error) {
        console.error(\`❌ Error procesando \${filename}: \${error.message}\`);
        return null;
    }
}

async function processDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.log(\`⏭️  Directorio no existe: \${dir}\`);
        return [];
    }
    
    const outputDir = path.join(dir, 'optimized');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const files = fs.readdirSync(dir);
    const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png)$/i.test(file) && !file.startsWith('.')
    );
    
    console.log(\`\n📁 Procesando \${dir} (\${imageFiles.length} imágenes)...\n\`);
    
    const results = [];
    for (const file of imageFiles) {
        const result = await optimizeImage(
            path.join(dir, file),
            outputDir
        );
        if (result) results.push(result);
    }
    
    return results;
}

async function main() {
    console.log('🚀 Iniciando optimización de imágenes VYT Music...\n');
    
    let totalResults = [];
    
    for (const dir of directories) {
        const results = await processDirectory(dir);
        totalResults = [...totalResults, ...results];
    }
    
    if (totalResults.length > 0) {
        const totalOriginal = totalResults.reduce((sum, r) => sum + r.original, 0);
        const totalOptimized = totalResults.reduce((sum, r) => sum + r.optimized, 0);
        const totalReduction = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(2);
        
        console.log(\`\n========================================\`);
        console.log(\`📊 RESUMEN DE OPTIMIZACIÓN\`);
        console.log(\`========================================\`);
        console.log(\`Imágenes procesadas: \${totalResults.length}\`);
        console.log(\`Tamaño original: \${(totalOriginal / 1024 / 1024).toFixed(2)} MB\`);
        console.log(\`Tamaño optimizado: \${(totalOptimized / 1024 / 1024).toFixed(2)} MB\`);
        console.log(\`Reducción total: -\${totalReduction}%\`);
        console.log(\`Espacio liberado: \${((totalOriginal - totalOptimized) / 1024 / 1024).toFixed(2)} MB\`);
        console.log(\`========================================\n\`);
        
        // Generar reporte HTML
        const report = \`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Optimización - VYT Music</title>
    <style>
        body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #58a6ff; }
        .stats { background: #f6f8fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d0d7de; }
        .success { color: #2ea043; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🚀 Reporte de Optimización de Imágenes</h1>
    <p>Fecha: \${new Date().toLocaleDateString('es-AR')}</p>
    
    <div class="stats">
        <div class="stat-item">
            <span>Imágenes procesadas:</span>
            <strong>\${totalResults.length}</strong>
        </div>
        <div class="stat-item">
            <span>Tamaño original:</span>
            <span>\${(totalOriginal / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div class="stat-item">
            <span>Tamaño optimizado:</span>
            <span class="success">\${(totalOptimized / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div class="stat-item">
            <span>Reducción total:</span>
            <span class="success">-\${totalReduction}%</span>
        </div>
        <div class="stat-item">
            <span>Espacio liberado:</span>
            <span class="success">\${((totalOriginal - totalOptimized) / 1024 / 1024).toFixed(2)} MB</span>
        </div>
    </div>
    
    <h2>📝 Próximos pasos</h2>
    <ul>
        <li>Las imágenes optimizadas están en carpetas <code>/optimized</code></li>
        <li>Actualizar referencias HTML a las versiones WebP</li>
        <li>Implementar lazy-loading con <code>loading="lazy"</code></li>
        <li>Agregar srcset responsive para diferentes resoluciones</li>
    </ul>
</body>
</html>
        \`;
        
        fs.writeFileSync('reporte-optimizacion.html', report);
        console.log('📄 Reporte generado: reporte-optimizacion.html\n');
    } else {
        console.log('⚠️  No se encontraron imágenes para procesar.\n');
    }
}

main().catch(console.error);
"@

# Guardar script de optimización
$optimizeScript | Out-File -FilePath "optimize-images.js" -Encoding UTF8

Write-Host "✅ Script de optimización creado: optimize-images.js" -ForegroundColor Green
Write-Host ""

# Verificar si Sharp está instalado
Write-Host "🔍 Verificando dependencias..." -ForegroundColor Cyan

$packageJsonExists = Test-Path "package.json"

if ($packageJsonExists) {
    Write-Host "✅ package.json encontrado" -ForegroundColor Green
    
    # Verificar si sharp está instalado
    $sharpInstalled = npm list sharp 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Sharp ya está instalado" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Ejecutando optimización..." -ForegroundColor Cyan
        Write-Host ""
        node optimize-images.js
    } else {
        Write-Host "📦 Instalando Sharp..." -ForegroundColor Yellow
        npm install sharp --save-dev
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Sharp instalado correctamente" -ForegroundColor Green
            Write-Host ""
            Write-Host "🚀 Ejecutando optimización..." -ForegroundColor Cyan
            Write-Host ""
            node optimize-images.js
        } else {
            Write-Host "❌ Error instalando Sharp" -ForegroundColor Red
            Write-Host "Ejecuta manualmente: npm install sharp --save-dev" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "⚠️  package.json no encontrado. Creando..." -ForegroundColor Yellow
    
    $packageJson = @"
{
  "name": "vyt-music-online",
  "version": "1.0.0",
  "description": "VYT Music Online - Optimización de imágenes",
  "scripts": {
    "optimize-images": "node optimize-images.js"
  },
  "devDependencies": {
    "sharp": "^0.33.0"
  }
}
"@
    
    $packageJson | Out-File -FilePath "package.json" -Encoding UTF8
    
    Write-Host "✅ package.json creado" -ForegroundColor Green
    Write-Host "📦 Instalando Sharp..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Ejecutando optimización..." -ForegroundColor Cyan
        Write-Host ""
        node optimize-images.js
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Para ejecutar nuevamente: npm run optimize-images" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
