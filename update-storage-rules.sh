#!/bin/bash

# Script para actualizar Storage Rules en Firebase
# Ejecutar con: bash update-storage-rules.sh

echo "🔥 Actualizando Storage Rules..."

# Cambiar al directorio del proyecto
cd "c:\Users\lucia\Desktop\creacion web\vyt.web\vyt-web-online\VYT-MUSIC-ONLINE"

# Método 1: Usar Firebase CLI directamente con archivo
echo "📤 Método 1: Deploy directo..."
firebase deploy --only storage

# Si el método 1 falla, usar método 2
if [ $? -ne 0 ]; then
  echo "⚠️ Método 1 falló. Intentando método alternativo..."
  
  # Método 2: Copiar reglas manualmente a la consola
  echo ""
  echo "📋 COPIAR ESTAS REGLAS MANUALMENTE:"
  echo "================================================"
  cat storage.rules
  echo "================================================"
  echo ""
  echo "👉 Ir a: https://console.firebase.google.com/project/vytonlineprueva/storage/rules"
  echo "👉 Pegar las reglas de arriba"
  echo "👉 Click en 'Publicar'"
fi

echo ""
echo "✅ Listo! Las reglas de Storage deben estar actualizadas."
