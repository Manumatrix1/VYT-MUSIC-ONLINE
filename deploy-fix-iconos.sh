#!/bin/bash

# 🚀 VYT MUSIC - Deploy con Fix de Iconos
# Script mejorado para desplegar sin problemas de iconos

echo "🎵 VYT MUSIC - Deploy con fix de iconos"
echo "======================================="

# Verificar que los archivos críticos existen
if [ ! -f "icon-control.css" ]; then
    echo "❌ Error: Archivo icon-control.css no encontrado"
    exit 1
fi

if [ ! -f "tailwind.config.js" ]; then
    echo "❌ Error: Archivo tailwind.config.js no encontrado"
    exit 1
fi

echo "✅ Archivos de configuración verificados"

# Verificar configuración de Firebase
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json no encontrado"
    exit 1
fi

echo "✅ Configuración de Firebase verificada"

# Limpiar cache si existe
if [ -d ".firebase" ]; then
    rm -rf .firebase
    echo "🧹 Cache de Firebase limpiado"
fi

# Build y deploy
echo "🚀 Iniciando deploy..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy exitoso!"
    echo "🎯 Los iconos deberían verse correctamente ahora"
    echo "📋 Cambios aplicados:"
    echo "   - Configuración de Tailwind corregida"
    echo "   - Control estricto de iconos CSS"
    echo "   - Archivo icon-control.css global"
    echo "   - Reset de tamaños descontrolados"
    echo ""
else
    echo "❌ Error en el deploy"
    exit 1
fi