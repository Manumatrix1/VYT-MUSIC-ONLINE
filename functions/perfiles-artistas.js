const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Función para crear perfil de artista
exports.crearPerfilArtista = functions.https.onCall(async (data, context) => {
    try {
        // Verificar autenticación
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const {
            nombreArtistico,
            generoMusical,
            ciudad,
            provincia,
            biografia,
            redesSociales,
            tipoSuscripcion = 'gratuito'
        } = data;

        // Validaciones
        if (!nombreArtistico || !generoMusical || !ciudad || !provincia) {
            throw new functions.https.HttpsError('invalid-argument', 'Datos obligatorios faltantes');
        }

        const perfilData = {
            userId,
            nombreArtistico,
            generoMusical,
            ciudad,
            provincia,
            biografia: biografia || '',
            redesSociales: redesSociales || {},
            tipoSuscripcion,
            fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
            activo: true,
            verificado: false,
            estadisticas: {
                totalVideos: 0,
                totalReproducciones: 0,
                totalSeguidores: 0,
                totalVotos: 0,
                totalVytMoneyGanado: 0
            },
            configuracion: {
                perfilPublico: true,
                permitirContacto: true,
                mostrarEstadisticas: true
            }
        };

        // Verificar límites según suscripción
        const limitesSubscripcion = {
            gratuito: { maxVideos: 3, analytics: false, destacado: false },
            premium: { maxVideos: -1, analytics: true, destacado: true } // -1 = ilimitado
        };

        perfilData.limites = limitesSubscripcion[tipoSuscripcion];

        // Guardar en Firestore
        const perfilRef = await admin.firestore().collection('perfiles_artistas').add(perfilData);

        // Actualizar el documento del usuario
        await admin.firestore().collection('users').doc(userId).update({
            tienePerfilArtista: true,
            perfilArtistaId: perfilRef.id,
            tipoUsuario: 'artista'
        });

        return {
            success: true,
            perfilId: perfilRef.id,
            message: 'Perfil de artista creado exitosamente'
        };

    } catch (error) {
        console.error('Error creando perfil artista:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para actualizar perfil de artista
exports.actualizarPerfilArtista = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { perfilId, actualizaciones } = data;

        // Verificar que el perfil pertenece al usuario
        const perfilDoc = await admin.firestore().collection('perfiles_artistas').doc(perfilId).get();
        
        if (!perfilDoc.exists || perfilDoc.data().userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para actualizar este perfil');
        }

        // Campos permitidos para actualización
        const camposPermitidos = [
            'nombreArtistico', 'generoMusical', 'ciudad', 'provincia', 
            'biografia', 'redesSociales', 'configuracion'
        ];

        const actualizacionesValidas = {};
        Object.keys(actualizaciones).forEach(campo => {
            if (camposPermitidos.includes(campo)) {
                actualizacionesValidas[campo] = actualizaciones[campo];
            }
        });

        actualizacionesValidas.fechaActualizacion = admin.firestore.FieldValue.serverTimestamp();

        await admin.firestore().collection('perfiles_artistas').doc(perfilId).update(actualizacionesValidas);

        return {
            success: true,
            message: 'Perfil actualizado exitosamente'
        };

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para subir video al portafolio
exports.subirVideoPortafolio = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const {
            perfilId,
            titulo,
            descripcion,
            categoria,
            urlVideo,
            thumbnail,
            tipoVideo = 'portfolio', // 'portfolio' o 'competition'
            visibilidad = 'publico', // 'publico', 'privado', 'no_listado'
            programado = null
        } = data;

        // Verificar perfil del artista
        const perfilDoc = await admin.firestore().collection('perfiles_artistas').doc(perfilId).get();
        
        if (!perfilDoc.exists || perfilDoc.data().userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos');
        }

        const perfilData = perfilDoc.data();

        // Verificar límites de suscripción
        if (perfilData.limites.maxVideos !== -1) {
            const videosCount = await admin.firestore()
                .collection('videos_portfolio')
                .where('artistaId', '==', perfilId)
                .where('activo', '==', true)
                .get();

            if (videosCount.size >= perfilData.limites.maxVideos) {
                throw new functions.https.HttpsError('resource-exhausted', 
                    `Límite de videos alcanzado para suscripción ${perfilData.tipoSuscripcion}`);
            }
        }

        const videoData = {
            artistaId: perfilId,
            userId,
            titulo,
            descripcion: descripcion || '',
            categoria,
            urlVideo,
            thumbnail: thumbnail || '',
            tipoVideo,
            visibilidad,
            programado,
            fechaSubida: admin.firestore.FieldValue.serverTimestamp(),
            activo: true,
            estadisticas: {
                reproducciones: 0,
                likes: 0,
                comentarios: 0,
                compartidos: 0
            },
            metadata: {
                duracion: 0,
                calidad: 'HD',
                tamaño: 0
            }
        };

        // Guardar video
        const videoRef = await admin.firestore().collection('videos_portfolio').add(videoData);

        // Actualizar estadísticas del perfil
        await admin.firestore().collection('perfiles_artistas').doc(perfilId).update({
            'estadisticas.totalVideos': admin.firestore.FieldValue.increment(1),
            fechaUltimoVideo: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            videoId: videoRef.id,
            message: 'Video subido exitosamente'
        };

    } catch (error) {
        console.error('Error subiendo video:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para seguir/dejar de seguir artista
exports.seguirArtista = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { perfilArtistaId, accion } = data; // accion: 'seguir' o 'dejar_seguir'

        const seguimientoRef = admin.firestore()
            .collection('seguimientos')
            .doc(`${userId}_${perfilArtistaId}`);

        const seguimientoDoc = await seguimientoRef.get();
        const yaSigue = seguimientoDoc.exists;

        if (accion === 'seguir' && !yaSigue) {
            // Crear seguimiento
            await seguimientoRef.set({
                seguidorId: userId,
                artistaId: perfilArtistaId,
                fechaSeguimiento: admin.firestore.FieldValue.serverTimestamp(),
                activo: true
            });

            // Incrementar contador de seguidores
            await admin.firestore().collection('perfiles_artistas').doc(perfilArtistaId).update({
                'estadisticas.totalSeguidores': admin.firestore.FieldValue.increment(1)
            });

            return { success: true, message: 'Ahora sigues a este artista', siguiendo: true };

        } else if (accion === 'dejar_seguir' && yaSigue) {
            // Eliminar seguimiento
            await seguimientoRef.delete();

            // Decrementar contador de seguidores
            await admin.firestore().collection('perfiles_artistas').doc(perfilArtistaId).update({
                'estadisticas.totalSeguidores': admin.firestore.FieldValue.increment(-1)
            });

            return { success: true, message: 'Has dejado de seguir a este artista', siguiendo: false };
        }

        return { success: false, message: 'No se realizaron cambios' };

    } catch (error) {
        console.error('Error en seguimiento:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para votar por artista (con VYT-MONEY)
exports.votarPorArtista = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { perfilArtistaId, cantidadVyts, videoId = null } = data;

        // Verificar saldo del usuario
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const saldoActual = userDoc.data().vytMoney || 0;

        if (saldoActual < cantidadVyts) {
            throw new functions.https.HttpsError('failed-precondition', 'Saldo insuficiente de VYT-MONEY');
        }

        // Calcular peso del voto según cantidad
        const pesoVoto = calcularPesoVoto(cantidadVyts);
        const valorPozoVyt = cantidadVyts * 20; // $20 pesos por VYT

        const batch = admin.firestore().batch();

        // Registrar voto
        const votoRef = admin.firestore().collection('votos_artistas').doc();
        batch.set(votoRef, {
            votanteId: userId,
            artistaId: perfilArtistaId,
            videoId,
            cantidadVyts,
            pesoVoto,
            valorPozo: valorPozoVyt,
            fechaVoto: admin.firestore.FieldValue.serverTimestamp(),
            tipo: videoId ? 'video_especifico' : 'artista_general'
        });

        // Descontar VYTs del usuario
        const userRef = admin.firestore().collection('users').doc(userId);
        batch.update(userRef, {
            vytMoney: admin.firestore.FieldValue.increment(-cantidadVyts)
        });

        // Actualizar estadísticas del artista
        const perfilRef = admin.firestore().collection('perfiles_artistas').doc(perfilArtistaId);
        batch.update(perfilRef, {
            'estadisticas.totalVotos': admin.firestore.FieldValue.increment(pesoVoto),
            'estadisticas.totalVytMoneyGanado': admin.firestore.FieldValue.increment(valorPozoVyt)
        });

        // Actualizar ranking del artista
        await actualizarRankingArtista(perfilArtistaId, pesoVoto);

        await batch.commit();

        return {
            success: true,
            message: `Voto registrado con ${cantidadVyts} VYTs`,
            pesoVoto,
            nuevoSaldo: saldoActual - cantidadVyts
        };

    } catch (error) {
        console.error('Error votando por artista:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para gestionar suscripción premium
exports.gestionarSuscripcionPremium = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { accion, perfilId } = data; // accion: 'activar', 'pausar', 'cancelar'

        const perfilRef = admin.firestore().collection('perfiles_artistas').doc(perfilId);
        const perfilDoc = await perfilRef.get();

        if (!perfilDoc.exists || perfilDoc.data().userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos');
        }

        const ahora = new Date();
        let actualizaciones = {};

        switch (accion) {
            case 'activar':
                actualizaciones = {
                    tipoSuscripcion: 'premium',
                    fechaActivacionPremium: admin.firestore.FieldValue.serverTimestamp(),
                    fechaVencimientoPremium: new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 días
                    limites: {
                        maxVideos: -1,
                        analytics: true,
                        destacado: true
                    }
                };
                break;

            case 'pausar':
                actualizaciones = {
                    suscripcionPausada: true,
                    fechaPausa: admin.firestore.FieldValue.serverTimestamp()
                };
                break;

            case 'cancelar':
                actualizaciones = {
                    tipoSuscripcion: 'gratuito',
                    fechaCancelacion: admin.firestore.FieldValue.serverTimestamp(),
                    limites: {
                        maxVideos: 3,
                        analytics: false,
                        destacado: false
                    }
                };
                break;
        }

        await perfilRef.update(actualizaciones);

        return {
            success: true,
            message: `Suscripción ${accion === 'activar' ? 'activada' : accion === 'pausar' ? 'pausada' : 'cancelada'} exitosamente`
        };

    } catch (error) {
        console.error('Error gestionando suscripción:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Función para obtener analytics del artista
exports.obtenerAnalyticsArtista = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { perfilId, periodo = '30d' } = data; // '7d', '30d', '90d', '1y'

        // Verificar permisos
        const perfilDoc = await admin.firestore().collection('perfiles_artistas').doc(perfilId).get();
        
        if (!perfilDoc.exists || perfilDoc.data().userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos');
        }

        const perfilData = perfilDoc.data();

        // Verificar si tiene acceso a analytics
        if (!perfilData.limites.analytics) {
            throw new functions.https.HttpsError('failed-precondition', 'Necesitas suscripción Premium para acceder a analytics');
        }

        // Calcular fechas
        const fechaFin = new Date();
        const diasAtras = periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : 365;
        const fechaInicio = new Date(fechaFin.getTime() - diasAtras * 24 * 60 * 60 * 1000);

        // Obtener datos de analytics
        const [reproducciones, votos, seguidores, ingresos] = await Promise.all([
            obtenerReproducciones(perfilId, fechaInicio, fechaFin),
            obtenerVotos(perfilId, fechaInicio, fechaFin),
            obtenerSeguidores(perfilId, fechaInicio, fechaFin),
            obtenerIngresos(perfilId, fechaInicio, fechaFin)
        ]);

        return {
            success: true,
            analytics: {
                periodo,
                fechaInicio: fechaInicio.toISOString(),
                fechaFin: fechaFin.toISOString(),
                resumen: {
                    totalReproducciones: reproducciones.total,
                    totalVotos: votos.total,
                    nuevosSeguidores: seguidores.nuevos,
                    ingresosTotales: ingresos.total
                },
                graficos: {
                    reproducciones: reproducciones.diarios,
                    votos: votos.diarios,
                    seguidores: seguidores.diarios,
                    ingresos: ingresos.diarios
                },
                topVideos: await obtenerTopVideos(perfilId, fechaInicio, fechaFin),
                demograficos: await obtenerDemograficos(perfilId, fechaInicio, fechaFin)
            }
        };

    } catch (error) {
        console.error('Error obteniendo analytics:', error);
        throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
});

// Funciones auxiliares
function calcularPesoVoto(cantidadVyts) {
    // Algoritmo de peso progresivo
    if (cantidadVyts <= 10) return cantidadVyts;
    if (cantidadVyts <= 50) return 10 + (cantidadVyts - 10) * 1.5;
    if (cantidadVyts <= 100) return 70 + (cantidadVyts - 50) * 2;
    return 170 + (cantidadVyts - 100) * 2.5;
}

async function actualizarRankingArtista(perfilArtistaId, pesoVoto) {
    // Actualizar ranking en tiempo real
    const rankingRef = admin.firestore().collection('rankings_artistas').doc(perfilArtistaId);
    
    await rankingRef.set({
        artistaId: perfilArtistaId,
        puntajeTotal: admin.firestore.FieldValue.increment(pesoVoto),
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

async function obtenerReproducciones(perfilId, fechaInicio, fechaFin) {
    // Implementar lógica de analytics de reproducciones
    return { total: 0, diarios: [] };
}

async function obtenerVotos(perfilId, fechaInicio, fechaFin) {
    // Implementar lógica de analytics de votos
    return { total: 0, diarios: [] };
}

async function obtenerSeguidores(perfilId, fechaInicio, fechaFin) {
    // Implementar lógica de analytics de seguidores
    return { nuevos: 0, diarios: [] };
}

async function obtenerIngresos(perfilId, fechaInicio, fechaFin) {
    // Implementar lógica de analytics de ingresos
    return { total: 0, diarios: [] };
}

async function obtenerTopVideos(perfilId, fechaInicio, fechaFin) {
    // Implementar lógica para obtener videos más populares
    return [];
}

async function obtenerDemograficos(perfilId, fechaInicio, fechaFin) {
    // Implementar lógica para obtener datos demográficos
    return {};
}