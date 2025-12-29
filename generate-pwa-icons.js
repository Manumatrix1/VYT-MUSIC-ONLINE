/**
 * GENERADOR DE ICONOS PWA
 * Script para crear iconos en múltiples tamaños desde una imagen base
 * 
 * REQUISITOS:
 * - Node.js instalado
 * - npm install sharp (para redimensionar imágenes)
 * 
 * USO:
 * 1. Coloca tu logo en: images/logo-original.png (mínimo 512x512)
 * 2. Ejecuta: node generate-pwa-icons.js
 * 3. Los iconos se generarán en: images/icons/
 */

const fs = require('fs');
const path = require('path');

// Si no tienes sharp instalado, puedes usar este método alternativo
// con canvas para navegadores o usa un servicio online

const ICON_SIZES = [
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// OPCIÓN 1: Usando Sharp (recomendado)
async function generateIconsWithSharp() {
  try {
    const sharp = require('sharp');
    const inputFile = path.join(__dirname, 'images', 'logo-original.png');
    const outputDir = path.join(__dirname, 'images', 'icons');

    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🎨 Generando iconos PWA...\n');

    for (const icon of ICON_SIZES) {
      const outputPath = path.join(outputDir, icon.name);
      
      await sharp(inputFile)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 217, b: 255, alpha: 1 } // Color theme
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${icon.name} (${icon.size}x${icon.size})`);
    }

    console.log('\n🎉 ¡Iconos generados exitosamente!');
    console.log(`📁 Ubicación: ${outputDir}`);

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Sharp no está instalado.');
      console.log('\n📦 Instálalo con: npm install sharp');
      console.log('O usa el método alternativo (ver abajo)');
    } else {
      console.error('❌ Error generando iconos:', error);
    }
  }
}

// OPCIÓN 2: Método manual (sin dependencias)
function showManualInstructions() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 MÉTODO MANUAL PARA GENERAR ICONOS PWA');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('🌐 OPCIÓN A: Usar generador online (MÁS FÁCIL)');
  console.log('   1. Ve a: https://realfavicongenerator.net/');
  console.log('   2. Sube tu logo (images/logo-original.png)');
  console.log('   3. Configura:');
  console.log('      - iOS: Sí, con color de fondo #00d9ff');
  console.log('      - Android: Sí, con color de fondo #00d9ff');
  console.log('      - Windows: Opcional');
  console.log('   4. Descarga el paquete');
  console.log('   5. Extrae todos los iconos a: images/icons/\n');
  
  console.log('🎨 OPCIÓN B: Usar Photoshop/GIMP/Figma');
  console.log('   1. Abre tu logo en el editor');
  console.log('   2. Exporta en estos tamaños:');
  
  ICON_SIZES.forEach(icon => {
    console.log(`      - ${icon.size}x${icon.size} → ${icon.name}`);
  });
  
  console.log('   3. Guarda todos en: images/icons/\n');
  
  console.log('💡 OPCIÓN C: Usar ImageMagick (línea de comandos)');
  console.log('   Instala ImageMagick y ejecuta:');
  console.log('   ```');
  ICON_SIZES.forEach(icon => {
    console.log(`   magick convert images/logo-original.png -resize ${icon.size}x${icon.size} images/icons/${icon.name}`);
  });
  console.log('   ```\n');
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

// OPCIÓN 3: Generar SVG placeholder temporal
function generatePlaceholderIcons() {
  const outputDir = path.join(__dirname, 'images', 'icons');
  
  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 Generando iconos placeholder (SVG)...\n');

  ICON_SIZES.forEach(icon => {
    const svg = `
<svg width="${icon.size}" height="${icon.size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#00d9ff"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${icon.size / 5}" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
    VYT
  </text>
</svg>`.trim();

    const outputPath = path.join(outputDir, icon.name.replace('.png', '.svg'));
    fs.writeFileSync(outputPath, svg);
    console.log(`✅ ${icon.name.replace('.png', '.svg')} (placeholder)`);
  });

  console.log('\n⚠️  IMPORTANTE: Estos son placeholders temporales (SVG)');
  console.log('📝 Reemplázalos con iconos PNG reales antes de producción');
  console.log(`📁 Ubicación: ${outputDir}\n`);
}

// Ejecutar
console.log('\n🚀 VYT MUSIC - Generador de Iconos PWA\n');
console.log('Selecciona un método:\n');
console.log('1. Generar con Sharp (requiere: npm install sharp)');
console.log('2. Ver instrucciones manuales');
console.log('3. Generar placeholders SVG temporales\n');

// Si se ejecuta con argumento
const arg = process.argv[2];

if (arg === '--sharp' || arg === '1') {
  generateIconsWithSharp();
} else if (arg === '--manual' || arg === '2') {
  showManualInstructions();
} else if (arg === '--placeholder' || arg === '3') {
  generatePlaceholderIcons();
} else {
  console.log('💡 Ejecuta con:');
  console.log('   node generate-pwa-icons.js --sharp');
  console.log('   node generate-pwa-icons.js --manual');
  console.log('   node generate-pwa-icons.js --placeholder\n');
  
  // Por defecto, mostrar instrucciones manuales
  showManualInstructions();
}

module.exports = {
  generateIconsWithSharp,
  generatePlaceholderIcons,
  showManualInstructions
};
