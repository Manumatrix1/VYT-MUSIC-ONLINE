/**
 * Generador de iconos PWA desde 1.2 Logo.svg
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_LOGO = path.join(__dirname, 'images', 'icons', '1.2 Logo.svg');
const OUTPUT_DIR = path.join(__dirname, 'images', 'icons');

const ICONS = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'web-app-manifest-192x192.png', size: 192 },
  { name: 'web-app-manifest-512x512.png', size: 512 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 }
];

async function generateIcons() {
  console.log('🎨 Generando iconos desde:', INPUT_LOGO);
  console.log('📁 Directorio de salida:', OUTPUT_DIR);
  console.log('');

  for (const icon of ICONS) {
    const outputPath = path.join(OUTPUT_DIR, icon.name);
    
    try {
      await sharp(INPUT_LOGO)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparente
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Error generando ${icon.name}:`, error.message);
    }
  }

  console.log('\n🎉 Iconos generados exitosamente!');
}

generateIcons().catch(console.error);
