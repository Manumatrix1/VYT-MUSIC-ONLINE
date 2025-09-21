# 🎬 Configuración de YouTube API para VYT Music

Esta guía te ayudará a configurar la integración automática con YouTube para que cuando apruebes participantes, sus videos se suban automáticamente a tu canal.

## 📋 Requisitos Previos

1. **Cuenta de YouTube/Google** donde quieres subir los videos
2. **Canal de YouTube** activo (VYT Music)
3. **Acceso a Google Cloud Console**

## 🚀 Paso a Paso

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre: `VYT-Music-YouTube-Integration`

### 2. Habilitar YouTube Data API v3

1. En Google Cloud Console, ve a **APIs y servicios > Biblioteca**
2. Busca "YouTube Data API v3"
3. Haz clic en **HABILITAR**

### 3. Configurar OAuth 2.0

1. Ve a **APIs y servicios > Credenciales**
2. Haz clic en **+ CREAR CREDENCIALES > ID de cliente OAuth 2.0**
3. Tipo de aplicación: **Aplicación web**
4. Nombre: `VYT Music Server`
5. URIs de redirección autorizados: `https://developers.google.com/oauthplayground`

### 4. Obtener Tokens de Acceso

1. Ve a [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. En configuración (⚙️), marca "Use your own OAuth credentials"
3. Ingresa tu **Client ID** y **Client Secret**
4. En "Step 1", busca "YouTube Data API v3"
5. Selecciona: `https://www.googleapis.com/auth/youtube.upload`
6. Haz clic en **Authorize APIs**
7. Autoriza el acceso a tu cuenta de YouTube
8. En "Step 2", haz clic en **Exchange authorization code for tokens**
9. **GUARDA** el `refresh_token` (lo necesitarás después)

### 5. Configurar Variables de Entorno en Firebase

Ejecuta estos comandos en tu terminal (reemplaza con tus valores):

```bash
# Navegar a la carpeta del proyecto
cd "c:\Users\lucia\Desktop\creacion web\vyt.web\vyt-web-online\VYT-MUSIC-ONLINE"

# Configurar secretos de YouTube
firebase functions:secrets:set YOUTUBE_CLIENT_ID
firebase functions:secrets:set YOUTUBE_CLIENT_SECRET
firebase functions:secrets:set YOUTUBE_REFRESH_TOKEN
```

**Valores que necesitas:**
- `YOUTUBE_CLIENT_ID`: Tu Client ID de Google Cloud Console
- `YOUTUBE_CLIENT_SECRET`: Tu Client Secret de Google Cloud Console  
- `YOUTUBE_REFRESH_TOKEN`: El refresh_token obtenido en el OAuth Playground

## 🔧 Prueba la Configuración

### 1. Desplegar las Funciones

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 2. Probar la Subida

1. Ve a tu panel de administración
2. Aprueba un participante que tenga video
3. Verifica que se suba automáticamente a YouTube

## 📊 Panel de Administración YouTube

Una vez configurado, tendrás acceso a:

### **Funciones Disponibles:**
- ✅ **Subida automática** cuando apruebes participantes
- ✅ **Gestionar videos** (editar títulos, descripciones)
- ✅ **Eliminar videos** del canal
- ✅ **Ver estadísticas** de visualizaciones y engagement
- ✅ **Lista completa** de todos los videos subidos

### **URLs de API:**
- `https://us-central1-vytonlineprueva.cloudfunctions.net/getYouTubeVideo?participantId=XXX`
- `https://us-central1-vytonlineprueva.cloudfunctions.net/getAllYouTubeVideos`
- `https://us-central1-vytonlineprueva.cloudfunctions.net/updateYouTubeVideo`
- `https://us-central1-vytonlineprueva.cloudfunctions.net/deleteYouTubeVideo`

## 🎯 Flujo Automático

```
Participante sube video → Admin aprueba → 
Video se sube a YouTube automáticamente → 
Se actualiza base de datos con ID de YouTube → 
Video aparece en página de certámenes
```

## 🔒 Seguridad

- Los tokens se almacenan como **secrets** encriptados en Firebase
- Solo usuarios autenticados pueden gestionar videos
- Todas las operaciones se registran en logs

## 🆘 Troubleshooting

### Error: "Invalid credentials"
- Verifica que los secretos estén configurados correctamente
- Regenera el refresh_token si es necesario

### Error: "API not enabled"
- Asegúrate de habilitar YouTube Data API v3 en Google Cloud Console

### Error: "Quota exceeded"
- YouTube tiene límites diarios de subida (puedes solicitar aumento)

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs en Firebase Console
2. Revisa la configuración de secretos
3. Confirma que el refresh_token sea válido

---

**🎤 ¡Una vez configurado, todos los videos aprobados se subirán automáticamente a tu canal VYT Music!**