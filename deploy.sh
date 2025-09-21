#!/bin/bash

# Script para deploys automáticos según el branch
# Uso: ./deploy.sh [tipo]
# tipos: all, functions, hosting

BRANCH=$(git branch --show-current)
DEPLOY_TYPE=${1:-all}

echo "🔍 Branch actual: $BRANCH"
echo "📦 Tipo de deploy: $DEPLOY_TYPE"

if [ "$BRANCH" = "main" ]; then
    echo "🚀 Desplegando a PRODUCCIÓN (vyt-online)..."
    if [ "$DEPLOY_TYPE" = "all" ]; then
        npm run deploy:prod
    elif [ "$DEPLOY_TYPE" = "functions" ]; then
        npm run deploy:functions:prod
    elif [ "$DEPLOY_TYPE" = "hosting" ]; then
        npm run deploy:hosting:prod
    fi
elif [ "$BRANCH" = "prueva-online" ]; then
    echo "🧪 Desplegando a DESARROLLO (vytonlineprueva)..."
    if [ "$DEPLOY_TYPE" = "all" ]; then
        npm run deploy:dev
    elif [ "$DEPLOY_TYPE" = "functions" ]; then
        npm run deploy:functions:dev
    elif [ "$DEPLOY_TYPE" = "hosting" ]; then
        npm run deploy:hosting:dev
    fi
else
    echo "❌ Branch no reconocido. Solo se puede deployar desde 'main' o 'prueva-online'"
    exit 1
fi

echo "✅ Deploy completado!"