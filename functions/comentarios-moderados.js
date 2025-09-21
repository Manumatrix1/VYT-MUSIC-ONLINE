const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Sistema de Comentarios Moderados para VYT-MUSIC

// Función para crear comentario con moderación automática
exports.crearComentario = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { 
            objetoId, // ID del perfil de artista, video, etc.
            tipoObjeto, // 'artista', 'video', 'certamen'
            contenido,
            calificacion = null // 1-5 estrellas (opcional)
        } = data;

        // Validaciones básicas
        if (!objetoId || !tipoObjeto || !contenido.trim()) {
            throw new functions.https.HttpsError('invalid-argument', 'Datos obligatorios faltantes');
        }

        if (contenido.length > 500) {
            throw new functions.https.HttpsError('invalid-argument', 'Comentario muy largo (máx. 500 caracteres)');
        }

        // Análisis de sentimiento y contenido negativo
        const analisisSentimiento = await analizarSentimientoComentario(contenido);
        
        let estadoModeracion = 'pendiente';
        let razonPendiente = null;

        // Filtros automáticos de contenido negativo
        if (analisisSentimiento.esNegativo) {
            estadoModeracion = 'pendiente';
            razonPendiente = 'Contenido potencialmente negativo detectado';
        } else if (analisisSentimiento.contieneInsultos) {
            estadoModeracion = 'rechazado';
            razonPendiente = 'Lenguaje inapropiado detectado';
        } else if (analisisSentimiento.esSpam) {
            estadoModeracion = 'rechazado';
            razonPendiente = 'Contenido identificado como spam';
        } else if (analisisSentimiento.puntajeSentimiento >= 0.7) {
            // Comentario positivo - aprobación automática
            estadoModeracion = 'aprobado';
        }

        // Verificar si el usuario tiene permisos para comentar
        const permisoComentario = await verificarPermisoComentario(userId, objetoId, tipoObjeto);
        if (!permisoComentario.permitido) {
            throw new functions.https.HttpsError('permission-denied', permisoComentario.razon);
        }

        const comentarioData = {
            userId,
            objetoId,
            tipoObjeto,
            contenido: contenido.trim(),
            calificacion,
            estadoModeracion,
            razonPendiente,
            fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
            fechaAprobacion: estadoModeracion === 'aprobado' ? admin.firestore.FieldValue.serverTimestamp() : null,
            analisisSentimiento: {
                puntaje: analisisSentimiento.puntajeSentimiento,
                esPositivo: analisisSentimiento.esPositivo,
                confianza: analisisSentimiento.confianza
            },
            reportado: false,
            likes: 0,
            respuestas: 0
        };

        // Guardar comentario
        const comentarioRef = await admin.firestore().collection('comentarios').add(comentarioData);

        // Si requiere moderación, notificar al administrador
        if (estadoModeracion === 'pendiente') {
            await notificarModerador('comentario_pendiente', {
                comentarioId: comentarioRef.id,
                contenido: contenido.substring(0, 100) + '...',
                razon: razonPendiente
            });
        }

        // Si es una reseña con estrellas, actualizar calificación promedio
        if (calificacion && estadoModeracion === 'aprobado') {
            await actualizarCalificacionPromedio(objetoId, tipoObjeto, calificacion);
        }

        return {
            success: true,
            comentarioId: comentarioRef.id,
            estadoModeracion,
            message: estadoModeracion === 'aprobado' ? 
                'Comentario publicado exitosamente' : 
                estadoModeracion === 'pendiente' ?
                'Comentario enviado a revisión. Se publicará pronto.' :
                'Comentario rechazado por contenido inapropiado'
        };

    } catch (error) {
        console.error('Error creando comentario:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para moderar comentarios pendientes
exports.moderarComentario = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        // Verificar que es administrador
        const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
        if (!userDoc.data().esAdministrador) {
            throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden moderar');
        }

        const { comentarioId, decision, comentarioModerador = '' } = data; // decision: 'aprobar', 'rechazar'

        const comentarioRef = admin.firestore().collection('comentarios').doc(comentarioId);
        const comentarioDoc = await comentarioRef.get();

        if (!comentarioDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Comentario no encontrado');
        }

        const comentarioData = comentarioDoc.data();
        
        const actualizaciones = {
            estadoModeracion: decision === 'aprobar' ? 'aprobado' : 'rechazado',
            moderadorId: context.auth.uid,
            fechaModeracion: admin.firestore.FieldValue.serverTimestamp(),
            comentarioModerador
        };

        if (decision === 'aprobar') {
            actualizaciones.fechaAprobacion = admin.firestore.FieldValue.serverTimestamp();
            
            // Si tiene calificación, actualizar promedio
            if (comentarioData.calificacion) {
                await actualizarCalificacionPromedio(
                    comentarioData.objetoId, 
                    comentarioData.tipoObjeto, 
                    comentarioData.calificacion
                );
            }
        }

        await comentarioRef.update(actualizaciones);

        // Notificar al usuario sobre la decisión
        await notificarUsuario(comentarioData.userId, {
            tipo: 'comentario_moderado',
            decision,
            comentarioModerador
        });

        return {
            success: true,
            decision,
            message: `Comentario ${decision === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`
        };

    } catch (error) {
        console.error('Error moderando comentario:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para obtener comentarios aprobados
exports.obtenerComentarios = functions.https.onCall(async (data, context) => {
    try {
        const { objetoId, tipoObjeto, limite = 20, offset = 0 } = data;

        let query = admin.firestore().collection('comentarios')
            .where('objetoId', '==', objetoId)
            .where('tipoObjeto', '==', tipoObjeto)
            .where('estadoModeracion', '==', 'aprobado')
            .orderBy('fechaAprobacion', 'desc')
            .limit(limite);

        if (offset > 0) {
            const lastDoc = await admin.firestore().collection('comentarios')
                .orderBy('fechaAprobacion', 'desc')
                .limit(offset)
                .get();
            
            if (!lastDoc.empty) {
                query = query.startAfter(lastDoc.docs[lastDoc.docs.length - 1]);
            }
        }

        const comentariosSnapshot = await query.get();
        const comentarios = [];

        for (const doc of comentariosSnapshot.docs) {
            const comentarioData = doc.data();
            
            // Obtener información del usuario
            const userDoc = await admin.firestore().collection('users').doc(comentarioData.userId).get();
            const userData = userDoc.data();

            comentarios.push({
                id: doc.id,
                ...comentarioData,
                usuario: {
                    nombre: userData.displayName || userData.email,
                    avatar: userData.photoURL || '',
                    verificado: userData.verificado || false
                }
            });
        }

        // Obtener estadísticas de calificación si aplica
        let estadisticasCalificacion = null;
        if (tipoObjeto === 'artista') {
            estadisticasCalificacion = await obtenerEstadisticasCalificacion(objetoId);
        }

        return {
            success: true,
            comentarios,
            estadisticasCalificacion,
            total: comentarios.length
        };

    } catch (error) {
        console.error('Error obteniendo comentarios:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para crear reseña con estrellas (solo para participantes aprobados)
exports.crearResenaArtista = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { artistaId, calificacion, comentario, experiencia } = data; // experiencia: 'participante', 'publico', 'colaborador'

        // Validaciones
        if (!artistaId || !calificacion || calificacion < 1 || calificacion > 5) {
            throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos');
        }

        // Verificar que el usuario está autorizado para hacer reseñas
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        if (!userData.puedeHacerResenas) {
            throw new functions.https.HttpsError('permission-denied', 
                'Solo participantes y colaboradores autorizados pueden hacer reseñas');
        }

        // Verificar que no ha hecho reseña previamente
        const resenaExistente = await admin.firestore()
            .collection('resenas_artistas')
            .where('userId', '==', userId)
            .where('artistaId', '==', artistaId)
            .get();

        if (!resenaExistente.empty) {
            throw new functions.https.HttpsError('already-exists', 'Ya has hecho una reseña de este artista');
        }

        const resenaData = {
            userId,
            artistaId,
            calificacion,
            comentario: comentario || '',
            experiencia,
            fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
            verificada: userData.verificado || false,
            likes: 0
        };

        // Análisis de sentimiento del comentario
        if (comentario) {
            const analisis = await analizarSentimientoComentario(comentario);
            resenaData.sentimientoPositivo = analisis.esPositivo;
            resenaData.requiereRevision = analisis.esNegativo;
            
            // Si es negativo, enviar a moderación
            if (analisis.esNegativo) {
                await notificarModerador('resena_requiere_revision', {
                    resenaId: 'temp',
                    artistaId,
                    comentario: comentario.substring(0, 100) + '...'
                });
            }
        }

        const resenaRef = await admin.firestore().collection('resenas_artistas').add(resenaData);

        // Actualizar estadísticas del artista
        await actualizarEstadisticasArtista(artistaId);

        return {
            success: true,
            resenaId: resenaRef.id,
            message: 'Reseña creada exitosamente'
        };

    } catch (error) {
        console.error('Error creando reseña:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para obtener cola de comentarios pendientes (admin)
exports.obtenerComentariosPendientes = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        // Verificar permisos de administrador
        const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
        if (!userDoc.data().esAdministrador) {
            throw new functions.https.HttpsError('permission-denied', 'Solo administradores');
        }

        const comentariosPendientes = await admin.firestore()
            .collection('comentarios')
            .where('estadoModeracion', '==', 'pendiente')
            .orderBy('fechaCreacion', 'asc')
            .limit(50)
            .get();

        const cola = [];
        for (const doc of comentariosPendientes.docs) {
            const data = doc.data();
            
            // Obtener info del usuario
            const userDoc = await admin.firestore().collection('users').doc(data.userId).get();
            const usuario = userDoc.data();

            cola.push({
                id: doc.id,
                ...data,
                usuario: {
                    nombre: usuario.displayName || usuario.email,
                    email: usuario.email
                }
            });
        }

        return {
            success: true,
            cola,
            total: cola.length
        };

    } catch (error) {
        console.error('Error obteniendo comentarios pendientes:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Funciones auxiliares

async function analizarSentimientoComentario(contenido) {
    // Lista de palabras/frases negativas en español
    const palabrasNegativas = [
        'malo', 'horrible', 'pésimo', 'terrible', 'odio', 'detesto',
        'basura', 'porquería', 'asco', 'repugnante', 'patético',
        'idiota', 'estúpido', 'tonto', 'imbécil', 'pendejo'
    ];

    const palabrasPositivas = [
        'excelente', 'fantástico', 'increíble', 'genial', 'maravilloso',
        'hermoso', 'talentoso', 'brillante', 'espectacular', 'perfecto',
        'me encanta', 'me gusta', 'felicidades', 'bravo', 'aplausos'
    ];

    const contenidoLower = contenido.toLowerCase();
    
    // Detectar insultos directos
    const contieneInsultos = palabrasNegativas.some(palabra => 
        contenidoLower.includes(palabra)
    );

    // Contar palabras positivas vs negativas
    const palabrasPositivasCount = palabrasPositivas.filter(palabra => 
        contenidoLower.includes(palabra)
    ).length;

    const palabrasNegativasCount = palabrasNegativas.filter(palabra => 
        contenidoLower.includes(palabra)
    ).length;

    // Detectar spam (repetición excesiva)
    const esSpam = /(.)\1{4,}/.test(contenido) || // Caracteres repetidos
                   contenido.split(' ').filter(word => word === contenido.split(' ')[0]).length > 3;

    // Calcular puntaje de sentimiento (0-1, donde 1 es muy positivo)
    let puntajeSentimiento = 0.5; // Neutral por defecto
    
    if (palabrasPositivasCount > palabrasNegativasCount) {
        puntajeSentimiento = 0.7 + (palabrasPositivasCount * 0.1);
    } else if (palabrasNegativasCount > palabrasPositivasCount) {
        puntajeSentimiento = 0.3 - (palabrasNegativasCount * 0.1);
    }

    puntajeSentimiento = Math.max(0, Math.min(1, puntajeSentimiento));

    return {
        puntajeSentimiento,
        esPositivo: puntajeSentimiento >= 0.6,
        esNegativo: puntajeSentimiento <= 0.4 || palabrasNegativasCount > 0,
        contieneInsultos,
        esSpam,
        confianza: palabrasPositivasCount + palabrasNegativasCount > 0 ? 0.8 : 0.5
    };
}

async function verificarPermisoComentario(userId, objetoId, tipoObjeto) {
    // Verificar si el usuario puede comentar en este objeto
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Usuarios suspendidos no pueden comentar
    if (userData.suspendido) {
        return { permitido: false, razon: 'Usuario suspendido' };
    }

    // Verificar límite de comentarios por día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const comentariosHoy = await admin.firestore()
        .collection('comentarios')
        .where('userId', '==', userId)
        .where('fechaCreacion', '>=', hoy)
        .get();

    if (comentariosHoy.size >= 10) { // Máximo 10 comentarios por día
        return { permitido: false, razon: 'Límite diario de comentarios alcanzado' };
    }

    return { permitido: true };
}

async function actualizarCalificacionPromedio(objetoId, tipoObjeto, nuevaCalificacion) {
    // Actualizar la calificación promedio del objeto
    const resenas = await admin.firestore()
        .collection('comentarios')
        .where('objetoId', '==', objetoId)
        .where('tipoObjeto', '==', tipoObjeto)
        .where('estadoModeracion', '==', 'aprobado')
        .where('calificacion', '>', 0)
        .get();

    if (!resenas.empty) {
        let totalCalificacion = 0;
        let cantidadResenas = 0;

        resenas.forEach(doc => {
            const data = doc.data();
            if (data.calificacion) {
                totalCalificacion += data.calificacion;
                cantidadResenas++;
            }
        });

        const promedio = totalCalificacion / cantidadResenas;

        // Actualizar en la colección correspondiente
        if (tipoObjeto === 'artista') {
            await admin.firestore().collection('perfiles_artistas').doc(objetoId).update({
                'estadisticas.calificacionPromedio': promedio,
                'estadisticas.totalResenas': cantidadResenas
            });
        }
    }
}

async function notificarModerador(tipo, data) {
    // Enviar notificación a moderadores
    const notificacion = {
        tipo,
        data,
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        procesada: false
    };

    await admin.firestore().collection('notificaciones_moderador').add(notificacion);
}

async function notificarUsuario(userId, notificacionData) {
    // Enviar notificación al usuario
    const notificacion = {
        userId,
        ...notificacionData,
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        leida: false
    };

    await admin.firestore().collection('notificaciones_usuario').add(notificacion);
}

async function obtenerEstadisticasCalificacion(objetoId) {
    const resenas = await admin.firestore()
        .collection('comentarios')
        .where('objetoId', '==', objetoId)
        .where('calificacion', '>', 0)
        .where('estadoModeracion', '==', 'aprobado')
        .get();

    if (resenas.empty) {
        return {
            promedio: 0,
            total: 0,
            distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }

    let total = 0;
    const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    resenas.forEach(doc => {
        const calificacion = doc.data().calificacion;
        total += calificacion;
        distribucion[calificacion]++;
    });

    return {
        promedio: total / resenas.size,
        total: resenas.size,
        distribucion
    };
}

async function actualizarEstadisticasArtista(artistaId) {
    const estadisticas = await obtenerEstadisticasCalificacion(artistaId);
    
    await admin.firestore().collection('perfiles_artistas').doc(artistaId).update({
        'estadisticas.calificacionPromedio': estadisticas.promedio,
        'estadisticas.totalResenas': estadisticas.total
    });
}

module.exports = {
    crearComentario: exports.crearComentario,
    moderarComentario: exports.moderarComentario,
    obtenerComentarios: exports.obtenerComentarios,
    crearResenaArtista: exports.crearResenaArtista,
    obtenerComentariosPendientes: exports.obtenerComentariosPendientes
};