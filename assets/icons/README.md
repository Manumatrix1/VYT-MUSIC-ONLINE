# 🎨 Iconos Personalizados VYT MUSIC

Esta carpeta está diseñada para que puedas cargar tus iconos personalizados creados en Canva.

## 📋 Cómo usar tus iconos de Canva

### 1️⃣ **Crear iconos en Canva**
- Ve a Canva y crea un diseño personalizado
- Tamaño recomendado: **128x128 píxeles** (cuadrado)
- Fondo transparente para mejores resultados
- Usa los colores de la marca: azules (#3b82f6, #2563eb, #1e40af)

### 2️⃣ **Exportar desde Canva**
- Descarga como **PNG** con fondo transparente
- Nómbralos de forma descriptiva: `microphone-blue.png`, `music-note.png`, etc.

### 3️⃣ **Subir a la carpeta**
- Guarda tus iconos en esta carpeta: `/assets/icons/`
- Nombres recomendados:
  - `microphone-custom.png`
  - `music-note-custom.png`
  - `stage-custom.png`
  - `guitar-custom.png`
  - `piano-custom.png`

### 4️⃣ **Usar en el código**
Agregar al archivo `custom-icons.css`:

```css
.custom-icon-microphone {
    background-image: url('../assets/icons/microphone-custom.png');
}
```

Usar en HTML:
```html
<div class="custom-icon custom-icon-lg custom-icon-microphone"></div>
```

## 🎯 **Iconos Sugeridos para VYT MUSIC**

- **🎤 Micrófono**: Para secciones de participación
- **🎵 Nota musical**: Para categorías musicales
- **🎯 Target/Diana**: Para modalidades
- **🏆 Premio/Copa**: Para certámenes
- **👥 Personas cantando**: Para comunidad
- **📱 Dispositivo móvil**: Para online
- **🎪 Escenario**: Para presencial
- **💫 Estrella brillante**: Para talento
- **🎸 Instrumentos**: Para géneros específicos

## 🌈 **Colores de Marca VYT**
- Azul principal: `#3b82f6`
- Azul oscuro: `#2563eb`  
- Azul profundo: `#1e40af`
- Azul marino: `#1e3a8a`
- Blanco: `#ffffff`
- Dorado (acentos): `#fbbf24`

## ✨ **Ejemplos de Uso**

### Icono simple:
```html
<span class="custom-icon custom-icon-md custom-icon-microphone"></span>
```

### Icono con contenedor y efectos:
```html
<div class="icon-container">
    <div class="custom-icon custom-icon-lg custom-icon-microphone custom-icon-animated"></div>
</div>
```

### Icono como botón:
```html
<button class="icon-container hover:scale-110">
    <div class="custom-icon custom-icon-microphone"></div>
</button>
```

## 📝 **Instrucciones de Implementación**

1. Crea tus iconos en Canva
2. Descárgalos como PNG transparente
3. Súbelos a `/assets/icons/`
4. Edita `/assets/custom-icons.css` para agregarlos
5. Úsalos en el HTML con las clases CSS correspondientes

¡Tus iconos personalizados harán que VYT MUSIC se vea increíble! 🚀