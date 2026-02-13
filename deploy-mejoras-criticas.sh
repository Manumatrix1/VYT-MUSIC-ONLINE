#!/bin/bash

# 🚀 DEPLOY RÁPIDO - MEJORAS CRÍTICAS VYT MUSIC
# Ejecutar desde la raíz del proyecto
# 
# chmod +x deploy-mejoras-criticas.sh
# ./deploy-mejoras-criticas.sh

set -e # Salir si hay error

echo "🚀 VYT MUSIC - Deploy de Mejoras Críticas"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "firebase.json" ]; then
    echo "${RED}❌ Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Preguntar proyecto
echo "${YELLOW}¿En qué proyecto deseas deployar?${NC}"
echo "1) desarrollo (vytonlineprueva)"
echo "2) produccion"
read -p "Selecciona (1 o 2): " project_choice

if [ "$project_choice" = "1" ]; then
    PROJECT="desarrollo"
elif [ "$project_choice" = "2" ]; then
    PROJECT="produccion"
    echo "${RED}⚠️  ADVERTENCIA: Deploying a PRODUCCIÓN${NC}"
    read -p "¿Estás seguro? (escribe 'SI' para continuar): " confirm
    if [ "$confirm" != "SI" ]; then
        echo "❌ Deploy cancelado"
        exit 0
    fi
else
    echo "${RED}❌ Opción inválida${NC}"
    exit 1
fi

echo ""
echo "${GREEN}📦 Proyecto seleccionado: $PROJECT${NC}"
echo ""

# 1. Backup
echo "📦 Paso 1/5: Creando backup de Firestore..."
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
echo "   Fecha: $BACKUP_DATE"
# Nota: Este comando requiere permisos de Storage Admin
firebase firestore:backup "gs://vytonlineprueva.appspot.com/backups/$BACKUP_DATE" --project $PROJECT || {
    echo "${YELLOW}⚠️  No se pudo crear backup automático. Continuar? (s/n)${NC}"
    read -p "> " continue_without_backup
    if [ "$continue_without_backup" != "s" ]; then
        exit 1
    fi
}

echo "${GREEN}✅ Backup completado (o saltado)${NC}"
echo ""

# 2. Deploy Functions
echo "🔧 Paso 2/5: Desplegando Cloud Functions..."
cd functions

# Verificar que los archivos existen
if [ ! -f "admin-claims.js" ] || [ ! -f "vyt-money-audit.js" ]; then
    echo "${RED}❌ Error: Archivos de functions no encontrados${NC}"
    echo "   Verifica que admin-claims.js y vyt-money-audit.js existan"
    exit 1
fi

# Deploy solo de las nuevas functions
firebase deploy \
    --only functions:setAdminClaim,functions:getUserClaims,functions:refreshUserToken,functions:listAdmins,functions:migrateAdminClaims,functions:adjustUserBalance,functions:getAuditLogs,functions:getUserAuditTrail,functions:exportAuditLogs \
    --project $PROJECT

cd ..

echo "${GREEN}✅ Functions desplegadas${NC}"
echo ""

# 3. Migrar Admin Claims
echo "👥 Paso 3/5: Migrando Admin Claims..."
read -p "¿Ejecutar migración de admin claims? (s/n): " migrate_claims

if [ "$migrate_claims" = "s" ]; then
    echo "   Ejecutando migración..."
    
    # Verificar service account key
    if [ ! -f "functions/.serviceAccountKey.json" ]; then
        echo "${RED}❌ Error: Service Account Key no encontrado${NC}"
        echo "   Descarga desde Firebase Console y guarda en functions/.serviceAccountKey.json"
        exit 1
    fi
    
    node -e "
    const admin = require('firebase-admin');
    const serviceAccount = require('./functions/.serviceAccountKey.json');
    
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    
    (async () => {
      try {
        const db = admin.firestore();
        const admins = await db.collection('users').where('role', '==', 'admin').get();
        
        console.log(\`📊 Migrando \${admins.size} administradores...\`);
        
        for (const doc of admins.docs) {
          await admin.auth().setCustomUserClaims(doc.id, {
            admin: true,
            role: 'admin',
            migratedAt: Date.now()
          });
          console.log(\`✅ \${doc.data().email}\`);
        }
        
        console.log('✅ Migración completada');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    })();
    " || {
        echo "${RED}❌ Error en migración de claims${NC}"
        exit 1
    }
else
    echo "${YELLOW}⚠️  Migración de claims saltada${NC}"
fi

echo ""

# 4. Deploy Rules
echo "🛡️  Paso 4/5: Actualizando Firestore Rules..."
firebase deploy --only firestore:rules --project $PROJECT

echo "${GREEN}✅ Rules actualizadas${NC}"
echo ""

# 5. Normalizar Datos
echo "📊 Paso 5/5: Normalizar campos de base de datos..."
read -p "¿Ejecutar normalización de datos? (s/n): " normalize_data

if [ "$normalize_data" = "s" ]; then
    if [ ! -f "scripts/normalize-database-fields.js" ]; then
        echo "${RED}❌ Error: Script de normalización no encontrado${NC}"
        exit 1
    fi
    
    if [ ! -f "functions/.serviceAccountKey.json" ]; then
        echo "${RED}❌ Error: Service Account Key no encontrado${NC}"
        exit 1
    fi
    
    node scripts/normalize-database-fields.js || {
        echo "${RED}❌ Error en normalización${NC}"
        exit 1
    }
else
    echo "${YELLOW}⚠️  Normalización de datos saltada${NC}"
    echo "   Ejecuta manualmente: node scripts/normalize-database-fields.js"
fi

echo ""
echo "${GREEN}=========================================="
echo "✅ DEPLOY COMPLETADO EXITOSAMENTE"
echo "==========================================${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verificar functions en Firebase Console"
echo "   2. Probar ajustes VYT Money en admin panel"
echo "   3. Verificar que audit logs se crean"
echo "   4. Monitorear errores por 48 horas"
echo ""
echo "📚 Documentación:"
echo "   - IMPLEMENTACION-MEJORAS-CRITICAS.md"
echo "   - RESUMEN-EJECUTIVO-MEJORAS.md"
echo ""
echo "🎉 ¡Sistema actualizado y más robusto!"
