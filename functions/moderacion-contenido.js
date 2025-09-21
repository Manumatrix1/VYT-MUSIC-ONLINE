const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Sistema de Moderación Inteligente para VYT-MUSIC

// Función para validar contenido antes de publicación
exports.validarContenidoVideo = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { urlVideo, titulo, descripcion, tipoVideo, artistaId } = data;

        // 1. Verificar puntos de reputación del artista
        const perfilDoc = await admin.firestore().collection('perfiles_artistas').doc(artistaId).get();
        const perfilData = perfilDoc.data();
        const puntosReputacion = perfilData.puntosReputacion || 100; // Nuevos usuarios: 100 puntos

        // 2. Análisis automático del contenido
        const analisisIA = await analizarContenidoIA(urlVideo, titulo, descripcion);
        
        // 3. Verificar si es contenido musical válido
        const esMusical = await verificarContenidoMusical(urlVideo);
        
        // 4. Determinar estado de moderación
        let estadoModeracion = 'pendiente';
        let requiereRevision = false;
        let razonRechazo = null;

        // Filtros automáticos de rechazo
        if (!esMusical) {
            estadoModeracion = 'rechazado';
            razonRechazo = 'El contenido no es musical válido';
        } else if (analisisIA.contenidoExplicito) {
            estadoModeracion = 'rechazado';
            razonRechazo = 'Contenido explícito o inapropiado detectado';
        } else if (analisisIA.calidadAudio < 30) {
            estadoModeracion = 'rechazado';
            razonRechazo = 'Calidad de audio muy baja';
        } else if (analisisIA.duracion < 30 || analisisIA.duracion > 480) {
            estadoModeracion = 'rechazado';
            razonRechazo = 'Duración debe estar entre 30 segundos y 8 minutos';
        } 
        // Aprobación automática para usuarios confiables
        else if (puntosReputacion >= 200 && analisisIA.puntajeGeneral >= 70) {
            estadoModeracion = 'aprobado';
        } 
        // Requiere revisión manual
        else {
            estadoModeracion = 'pendiente';
            requiereRevision = true;
        }

        // 5. Guardar resultado de moderación
        const moderacionRef = await admin.firestore().collection('moderacion_contenido').add({
            videoId: null, // Se asignará cuando se cree el video
            artistaId,
            userId,
            urlVideo,
            titulo,
            descripcion,
            tipoVideo,
            estadoModeracion,
            puntajeIA: analisisIA.puntajeGeneral,
            razonRechazo,
            requiereRevision,
            fechaAnalisis: admin.firestore.FieldValue.serverTimestamp(),
            analisisCompleto: analisisIA,
            puntosArtistaAlMomento: puntosReputacion
        });

        // 6. Si requiere pago para competir, verificar VYT-MONEY
        if (tipoVideo === 'competition') {
            const costoCompetir = 500; // 500 VYT-MONEY
            const userDoc = await admin.firestore().collection('users').doc(userId).get();
            const saldoVYT = userDoc.data().vytMoney || 0;

            if (saldoVYT < costoCompetir) {
                throw new functions.https.HttpsError('failed-precondition', 
                    `Necesitas ${costoCompetir} VYT-MONEY para participar en certámenes`);
            }

            // Descontar VYT-MONEY si está aprobado
            if (estadoModeracion === 'aprobado') {
                await admin.firestore().collection('users').doc(userId).update({
                    vytMoney: admin.firestore.FieldValue.increment(-costoCompetir)
                });
            }
        }

        return {
            success: true,
            moderacionId: moderacionRef.id,
            estadoModeracion,
            requiereRevision,
            razonRechazo,
            puntajeIA: analisisIA.puntajeGeneral,
            message: estadoModeracion === 'aprobado' ? 
                'Video aprobado automáticamente' : 
                estadoModeracion === 'rechazado' ? 
                `Video rechazado: ${razonRechazo}` :
                'Video en cola de revisión manual'
        };

    } catch (error) {
        console.error('Error validando contenido:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para reportar contenido
exports.reportarContenido = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { videoId, razon, descripcionDetallada } = data;

        // Verificar que el usuario no reporte el mismo video múltiples veces
        const reporteExistente = await admin.firestore()
            .collection('reportes_contenido')
            .where('reporterId', '==', userId)
            .where('videoId', '==', videoId)
            .get();

        if (!reporteExistente.empty) {
            throw new functions.https.HttpsError('already-exists', 'Ya has reportado este video');
        }

        // Costo por reportar (para evitar spam de reportes)
        const costoReporte = 100; // 100 VYT-MONEY
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const saldoVYT = userDoc.data().vytMoney || 0;

        if (saldoVYT < costoReporte) {
            throw new functions.https.HttpsError('failed-precondition', 
                'Necesitas 100 VYT-MONEY para hacer un reporte (se devuelve si es válido)');
        }

        // Crear reporte
        const reporteRef = await admin.firestore().collection('reportes_contenido').add({
            videoId,
            reporterId: userId,
            razon,
            descripcionDetallada: descripcionDetallada || '',
            fechaReporte: admin.firestore.FieldValue.serverTimestamp(),
            estado: 'pendiente', // pendiente, validado, rechazado
            moderadorAsignado: null,
            fechaRevision: null,
            resolucion: null
        });

        // Descontar VYT temporalmente
        await admin.firestore().collection('users').doc(userId).update({
            vytMoney: admin.firestore.FieldValue.increment(-costoReporte)
        });

        // Verificar si el video tiene múltiples reportes
        const totalReportes = await admin.firestore()
            .collection('reportes_contenido')
            .where('videoId', '==', videoId)
            .get();

        if (totalReportes.size >= 3) {
            // Escalamiento automático: poner video en revisión urgente
            await admin.firestore().collection('moderacion_contenido')
                .where('videoId', '==', videoId)
                .get()
                .then(snapshot => {
                    if (!snapshot.empty) {
                        const doc = snapshot.docs[0];
                        doc.ref.update({
                            prioridadRevision: 'alta',
                            motivoAlta: 'Múltiples reportes recibidos'
                        });
                    }
                });
        }

        return {
            success: true,
            reporteId: reporteRef.id,
            message: 'Reporte enviado. Se revisará en las próximas 24 horas.',
            vytsDebitados: costoReporte
        };

    } catch (error) {
        console.error('Error procesando reporte:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para que moderadores revisen contenido
exports.revisarContenidoPendiente = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        // Verificar que es un moderador
        const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
        if (!userDoc.data().esModerador) {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos de moderador');
        }

        const { moderacionId, decision, comentarios } = data; // decision: 'aprobar', 'rechazar'

        const moderacionRef = admin.firestore().collection('moderacion_contenido').doc(moderacionId);
        const moderacionDoc = await moderacionRef.get();

        if (!moderacionDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Contenido no encontrado');
        }

        const moderacionData = moderacionDoc.data();
        
        // Actualizar estado de moderación
        const actualizaciones = {
            estadoModeracion: decision === 'aprobar' ? 'aprobado' : 'rechazado',
            moderadorId: context.auth.uid,
            fechaRevision: admin.firestore.FieldValue.serverTimestamp(),
            comentariosModerador: comentarios || ''
        };

        if (decision === 'rechazar') {
            actualizaciones.razonRechazo = comentarios || 'Rechazado por moderador';
        }

        await moderacionRef.update(actualizaciones);

        // Actualizar puntos de reputación del artista
        const cambio = decision === 'aprobar' ? 20 : -50;
        await admin.firestore().collection('perfiles_artistas').doc(moderacionData.artistaId).update({
            puntosReputacion: admin.firestore.FieldValue.increment(cambio)
        });

        // Si fue rechazado y había pagado, devolver VYT-MONEY
        if (decision === 'rechazar' && moderacionData.tipoVideo === 'competition') {
            await admin.firestore().collection('users').doc(moderacionData.userId).update({
                vytMoney: admin.firestore.FieldValue.increment(500) // Devolver costo de competir
            });
        }

        // Notificar al artista
        await notificarArtista(moderacionData.userId, decision, comentarios);

        return {
            success: true,
            decision,
            message: `Contenido ${decision === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`
        };

    } catch (error) {
        console.error('Error revisando contenido:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para procesar strikes por mal comportamiento
exports.procesarStrike = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const { artistaId, motivo, severidad } = data; // severidad: 'leve', 'moderado', 'grave'

        const strikeData = {
            artistaId,
            moderadorId: context.auth.uid,
            motivo,
            severidad,
            fechaStrike: admin.firestore.FieldValue.serverTimestamp(),
            activo: true
        };

        // Crear strike
        await admin.firestore().collection('strikes_artistas').add(strikeData);

        // Contar strikes activos
        const strikesActivos = await admin.firestore()
            .collection('strikes_artistas')
            .where('artistaId', '==', artistaId)
            .where('activo', '==', true)
            .get();

        const totalStrikes = strikesActivos.size;
        let accion = null;
        let duracionSuspension = 0;

        // Aplicar consecuencias según número de strikes
        if (totalStrikes >= 5) {
            // Expulsión permanente
            await admin.firestore().collection('perfiles_artistas').doc(artistaId).update({
                suspendido: true,
                tipoSuspension: 'permanente',
                fechaSuspension: admin.firestore.FieldValue.serverTimestamp(),
                motivoSuspension: 'Demasiados strikes acumulados'
            });
            accion = 'expulsion_permanente';
        } else if (totalStrikes >= 3) {
            // Suspensión temporal
            duracionSuspension = severidad === 'grave' ? 30 : severidad === 'moderado' ? 14 : 7;
            const fechaVencimiento = new Date();
            fechaVencimiento.setDate(fechaVencimiento.getDate() + duracionSuspension);

            await admin.firestore().collection('perfiles_artistas').doc(artistaId).update({
                suspendido: true,
                tipoSuspension: 'temporal',
                fechaSuspension: admin.firestore.FieldValue.serverTimestamp(),
                fechaVencimientoSuspension: fechaVencimiento,
                motivoSuspension: `${totalStrikes} strikes acumulados`
            });
            accion = 'suspension_temporal';
        } else {
            // Solo advertencia
            accion = 'advertencia';
        }

        // Reducir puntos de reputación
        const reduccionPuntos = severidad === 'grave' ? -100 : severidad === 'moderado' ? -50 : -20;
        await admin.firestore().collection('perfiles_artistas').doc(artistaId).update({
            puntosReputacion: admin.firestore.FieldValue.increment(reduccionPuntos)
        });

        return {
            success: true,
            totalStrikes,
            accion,
            duracionSuspension,
            message: `Strike aplicado. Total: ${totalStrikes}/5`
        };

    } catch (error) {
        console.error('Error procesando strike:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para obtener cola de moderación
exports.obtenerColaModeración = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        // Verificar permisos de moderador
        const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
        if (!userDoc.data().esModerador) {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos de moderador');
        }

        const { limite = 20, prioridad = 'todas' } = data;

        let query = admin.firestore().collection('moderacion_contenido')
            .where('estadoModeracion', '==', 'pendiente')
            .orderBy('fechaAnalisis', 'asc')
            .limit(limite);

        if (prioridad === 'alta') {
            query = query.where('prioridadRevision', '==', 'alta');
        }

        const contenidoPendiente = await query.get();

        const cola = [];
        for (const doc of contenidoPendiente.docs) {
            const data = doc.data();
            
            // Obtener información del artista
            const perfilDoc = await admin.firestore().collection('perfiles_artistas').doc(data.artistaId).get();
            const perfil = perfilDoc.data();

            // Obtener reportes si los hay
            const reportes = await admin.firestore()
                .collection('reportes_contenido')
                .where('videoId', '==', data.videoId)
                .get();

            cola.push({
                id: doc.id,
                ...data,
                artista: {
                    nombre: perfil.nombreArtistico,
                    puntosReputacion: perfil.puntosReputacion
                },
                totalReportes: reportes.size,
                reportes: reportes.docs.map(r => r.data())
            });
        }

        return {
            success: true,
            cola,
            total: cola.length
        };

    } catch (error) {
        console.error('Error obteniendo cola de moderación:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Funciones auxiliares

async function analizarContenidoIA(urlVideo, titulo, descripcion) {
    // Simulación de análisis de IA - en producción usar APIs reales
    return {
        puntajeGeneral: Math.floor(Math.random() * 40) + 60, // 60-100
        contenidoExplicito: false,
        calidadAudio: Math.floor(Math.random() * 30) + 70, // 70-100
        duracion: Math.floor(Math.random() * 300) + 120, // 2-7 minutos
        esMusical: true,
        detecciones: {
            texto_inapropiado: false,
            audio_claro: true,
            video_estable: true
        }
    };
}

async function verificarContenidoMusical(urlVideo) {
    // Verificar que el video contenga música usando YouTube API o análisis de audio
    // Por ahora retornar true, implementar análisis real en producción
    return true;
}

async function notificarArtista(userId, decision, comentarios) {
    // Enviar notificación al artista sobre la decisión de moderación
    const notificacion = {
        userId,
        tipo: 'moderacion_video',
        titulo: decision === 'aprobar' ? '✅ Video Aprobado' : '❌ Video Rechazado',
        mensaje: decision === 'aprobar' ? 
            'Tu video ha sido aprobado y ya está público' : 
            `Tu video fue rechazado: ${comentarios}`,
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        leida: false
    };

    await admin.firestore().collection('notificaciones').add(notificacion);
}

// Función programada para limpiar strikes antiguos (DISABLED for now)
// TODO: Implementar con Scheduler v2 cuando sea necesario
/* 
/* 
exports.limpiarStrikesAntiaguos = functions.pubsub.schedule('0 0 * * 0') // Cada domingo
    .onRun(async (context) => {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 90); // 90 días atrás

        const strikesAntiguos = await admin.firestore()
            .collection('strikes_artistas')
            .where('fechaStrike', '<', fechaLimite)
            .where('severidad', 'in', ['leve', 'moderado'])
            .get();

        const batch = admin.firestore().batch();
        strikesAntiguos.forEach(doc => {
            batch.update(doc.ref, { activo: false });
        });

        await batch.commit();
        console.log(`${strikesAntiguos.size} strikes antiguos marcados como inactivos`);
    });
*/

module.exports = {
    validarContenidoVideo: exports.validarContenidoVideo,
    reportarContenido: exports.reportarContenido,
    revisarContenidoPendiente: exports.revisarContenidoPendiente,
    procesarStrike: exports.procesarStrike,
    obtenerColaModeración: exports.obtenerColaModeración,
    limpiarStrikesAntiaguos: exports.limpiarStrikesAntiaguos
};