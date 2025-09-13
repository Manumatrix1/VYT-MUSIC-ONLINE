# Backup de Firestore

Este directorio está pensado para almacenar snapshots (exportaciones) de las colecciones principales de Firestore del proyecto.

## Colecciones incluidas por la función `exportarBackup`
- participantes_online
- participantes_presenciales
- configuracion
- contenido_home
- contenido_dinamico
- certamenes_online

## Obtener un backup rápido (vía función HTTPS)
Tras desplegar las functions:

1. Asegúrate de estar autenticado con Firebase CLI.
2. Despliega: `firebase deploy --only functions:exportarBackup`
3. Abre en el navegador:
   `https://us-central1-<TU_PROJECT_ID>.cloudfunctions.net/exportarBackup`

Si configuraste un token (variable de entorno `EXPORT_TOKEN`):
```
https://us-central1-<TU_PROJECT_ID>.cloudfunctions.net/exportarBackup?token=TU_TOKEN
```

Guarda el resultado como JSON dentro de este directorio, por ejemplo:
```
backup-2025-09-12.json
```

## Establecer token de seguridad opcional
Puedes definir una variable de entorno para proteger el endpoint:
```
firebase functions:config:set export.token="ALGO_SEGURO"
```
(En este código se usa `process.env.EXPORT_TOKEN`, puedes inyectarla via panel o build system.)

> IMPORTANTE: Este endpoint devuelve datos completos (incluyendo potencialmente emails). No publiques los JSON sin revisar.

## Alternativa: Export oficial de Firestore
Usa el comando oficial (requiere bucket en GCP):
```
gcloud firestore export gs://NOMBRE_BUCKET/backups/$(date +%Y-%m-%d)
```
Luego puedes descargar los archivos desde el bucket.

## Restauración manual parcial
Para restaurar manualmente un documento desde un backup JSON:
1. Abre la consola de Firestore.
2. Crea/edita el documento usando los campos del JSON.

Automatización completa de restauración no incluida para evitar sobrescrituras accidentales.

---
Mantén sólo las copias necesarias y evita subir datos sensibles si el repo es público.
