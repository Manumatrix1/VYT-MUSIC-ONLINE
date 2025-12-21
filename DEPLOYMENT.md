# 🚀 Guía de Despliegue VYT Music

## 📋 Resumen del Sistema

**Dos ambientes separados:**
- 🧪 **Desarrollo**: https://vytonlineprueva.web.app
- 🚀 **Producción**: https://vyt-online.web.app

## 🔄 Workflow de Trabajo

### 1. Desarrollo (pruebas y cambios)
```bash
# Hacer cambios en el código local
# Desplegar a desarrollo para probar
npm run deploy:hosting:dev
```
**URL para probar**: https://vytonlineprueva.web.app

### 2. Producción (cuando TODO funciona)
```bash
# Solo cuando esté 100% probado y funcional
npm run deploy:hosting:prod
```
**URL de usuarios**: https://vyt-online.web.app

## 📊 Bases de Datos

- **Desarrollo**: Firestore proyecto `desarrollo` (datos de prueba)
- **Producción**: Firestore proyecto `produccion` (datos reales)

Las bases de datos están **separadas**, los cambios en desarrollo NO afectan producción.

## ⚠️ IMPORTANTE

1. **Siempre** trabaja primero en desarrollo
2. **Prueba exhaustivamente** antes de subir a producción
3. **NO uses** Netlify (está desactivado para evitar confusión)
4. **Git** es solo para control de versiones, no afecta el hosting

## 🎯 URLs Oficiales

| Ambiente | URL | Proyecto Firebase |
|----------|-----|-------------------|
| 🧪 DEV | https://vytonlineprueva.web.app | `desarrollo` |
| 🚀 PROD | https://vyt-online.web.app | `produccion` |
| ❌ ~~Netlify~~ | ~~https://vytmusic-online.netlify.app~~ | **Desactivado** |

---
**Última actualización**: 21 de diciembre de 2025
