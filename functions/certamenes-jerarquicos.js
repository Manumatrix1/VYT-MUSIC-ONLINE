/**
 * 🏆 SISTEMA DE CERTÁMENES JERÁRQUICOS VYT-MUSIC
 * 
 * Funciones para manejar:
 * - Estructura jerárquica (Nacional > Provincial > Regional)
 * - Categorías musicales (Bandas, Solistas, Cumbia, etc.)
 * - Rankings múltiples por zona y categoría
 * - Sistema de pozos distribuidos
 * - Evaluación por jurado
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');

// =====================================
// 🏗️ GESTIÓN DE ESTRUCTURA JERÁRQUICA
// =====================================

/**
 * Crear certamen con estructura jerárquica
 */
exports.createCertamenJerarquico = onCall(async (request) => {
  try {
    const { certamenData, configuracion } = request.data;
    
    // Validar permisos de admin
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    const certamenId = `${certamenData.provincia.toLowerCase().replace(/\s+/g, '_')}_${certamenData.tipo}_${new Date().getFullYear()}`;
    
    const certamen = {
      id: certamenId,
      nombre: certamenData.nombre,
      tipo: certamenData.tipo, // nacional | provincial | regional
      provincia: certamenData.provincia,
      region: certamenData.region || null,
      parent_certamen_id: certamenData.parent_certamen_id || null,
      children_certamen_ids: [],
      
      // Categorías habilitadas
      categorias_habilitadas: configuracion.categorias || [
        {
          id: "bandas",
          nombre: "Bandas",
          descripcion: "Grupos musicales de 2 o más integrantes",
          activo: true,
          ranking_habilitado: true
        },
        {
          id: "solistas", 
          nombre: "Solistas",
          descripcion: "Artistas individuales",
          activo: true,
          ranking_habilitado: true
        },
        {
          id: "cumbia",
          nombre: "Cumbia",
          descripcion: "Género cumbia y derivados",
          activo: true,
          ranking_habilitado: true
        }
      ],
      
      // Configuración de rankings
      ranking_config: {
        top_clasificados: configuracion.top_clasificados || 20,
        votos_minimos: configuracion.votos_minimos || 50,
        fecha_inicio_votacion: configuracion.fecha_inicio_votacion,
        fecha_fin_votacion: configuracion.fecha_fin_votacion,
        fase_actual: "votacion_publica"
      },
      
      // Configuración de pozo
      pozo_config: {
        porcentaje_inscripciones: configuracion.porcentaje_inscripciones || 0.3,
        porcentaje_vyt_money: configuracion.porcentaje_vyt_money || 0.1,
        distribucion_premios: configuracion.distribucion_premios || [
          { posicion: 1, porcentaje: 0.5 },
          { posicion: 2, porcentaje: 0.3 },
          { posicion: 3, porcentaje: 0.2 }
        ]
      },
      
      precio_inscripcion: certamenData.precio_inscripcion || 15000,
      activo: true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      created_by: request.auth.uid
    };
    
    // Guardar en Firestore
    await admin.firestore().collection('certamenes_estructura').doc(certamenId).set(certamen);
    
    // Si tiene certamen padre, agregarlo a la lista de hijos
    if (certamen.parent_certamen_id) {
      await admin.firestore().collection('certamenes_estructura').doc(certamen.parent_certamen_id).update({
        children_certamen_ids: admin.firestore.FieldValue.arrayUnion(certamenId)
      });
    }
    
    // Crear estructura de pozo inicial
    await initializePozoCertamen(certamenId, certamen.categorias_habilitadas, certamen.pozo_config);
    
    return { success: true, certamen_id: certamenId, message: 'Certamen creado exitosamente' };
    
  } catch (error) {
    console.error('Error creating certamen jerárquico:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Inicializar estructura de pozo para un certamen
 */
async function initializePozoCertamen(certamenId, categorias, pozoConfig) {
  const pozoData = {
    id: `pozo_${certamenId}`,
    certamen_id: certamenId,
    
    ingresos: {
      inscripciones: {
        total_recaudado: 0,
        porcentaje_al_pozo: pozoConfig.porcentaje_inscripciones,
        monto_al_pozo: 0
      },
      vyt_money: {
        total_gastado: 0,
        porcentaje_al_pozo: pozoConfig.porcentaje_vyt_money,
        monto_al_pozo: 0
      },
      patrocinios: {
        monto_patrocinios: 0,
        monto_al_pozo: 0
      }
    },
    
    pozo_total: 0,
    
    distribucion_por_categoria: {},
    
    estado: "activo",
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
    fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp()
  };
  
  // Inicializar distribución por categoría
  categorias.forEach(categoria => {
    if (categoria.activo) {
      pozoData.distribucion_por_categoria[categoria.id] = {
        participantes: 0,
        porcentaje_pozo: 1 / categorias.filter(c => c.activo).length, // Distribución equitativa inicial
        monto_categoria: 0,
        distribucion_premios: pozoConfig.distribucion_premios.map(premio => ({
          posicion: premio.posicion,
          porcentaje: premio.porcentaje,
          monto: 0
        }))
      };
    }
  });
  
  await admin.firestore().collection('pozos_certamenes').doc(pozoData.id).set(pozoData);
}

// =====================================
// 📊 GESTIÓN DE RANKINGS MÚLTIPLES
// =====================================

/**
 * Crear ranking para una combinación certamen-categoría
 */
exports.createRanking = onCall(async (request) => {
  try {
    const { certamen_id, categoria_id, configuracion } = request.data;
    
    const rankingId = `${certamen_id}_${categoria_id}`;
    
    const ranking = {
      id: rankingId,
      certamen_id: certamen_id,
      categoria_id: categoria_id,
      tipo_ranking: "publico",
      
      participantes: [],
      
      estadisticas: {
        total_participantes: 0,
        total_votos: 0,
        ultimo_update: admin.firestore.FieldValue.serverTimestamp()
      },
      
      configuracion: {
        votos_por_vyt_money: configuracion?.votos_por_vyt_money || 1,
        maximo_votos_por_usuario: configuracion?.maximo_votos_por_usuario || 10,
        peso_votos_publicos: configuracion?.peso_votos_publicos || 0.7,
        peso_votos_jurado: configuracion?.peso_votos_jurado || 0.3
      },
      
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('rankings').doc(rankingId).set(ranking);
    
    return { success: true, ranking_id: rankingId };
    
  } catch (error) {
    console.error('Error creating ranking:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Votar por un artista en un certamen/categoría específica
 */
exports.votarEnCertamenJerarquico = onCall(async (request) => {
  try {
    const { 
      participante_id, 
      certamen_id, 
      categoria_id, 
      cantidad_vyt_money, 
      user_id 
    } = request.data;
    
    if (!participante_id || !certamen_id || !categoria_id || !cantidad_vyt_money || !user_id) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos incompletos');
    }
    
    const rankingId = `${certamen_id}_${categoria_id}`;
    
    // Verificar balance del usuario
    const userDoc = await admin.firestore().collection('users').doc(user_id).get();
    const userData = userDoc.data();
    const currentBalance = userData?.vyt_money_balance || 0;
    
    if (currentBalance < cantidad_vyt_money) {
      throw new functions.https.HttpsError('failed-precondition', 'Balance insuficiente de VYT-MONEY');
    }
    
    // Verificar límites de votación
    const rankingDoc = await admin.firestore().collection('rankings').doc(rankingId).get();
    const rankingData = rankingDoc.data();
    const maxVotos = rankingData?.configuracion?.maximo_votos_por_usuario || 10;
    
    // Verificar votos previos del usuario para este participante
    const votosQuery = await admin.firestore()
      .collection('votos_certamenes')
      .where('user_id', '==', user_id)
      .where('participante_id', '==', participante_id)
      .where('certamen_id', '==', certamen_id)
      .get();
    
    const totalVotosPrevios = votosQuery.docs.reduce((total, doc) => total + (doc.data().cantidad_votos || 0), 0);
    
    if (totalVotosPrevios + cantidad_vyt_money > maxVotos) {
      throw new functions.https.HttpsError('failed-precondition', `Máximo ${maxVotos} votos por participante`);
    }
    
    // Ejecutar transacción para votar
    await admin.firestore().runTransaction(async (transaction) => {
      // Descontar VYT-MONEY del usuario
      transaction.update(admin.firestore().collection('users').doc(user_id), {
        vyt_money_balance: currentBalance - cantidad_vyt_money
      });
      
      // Registrar el voto
      const votoRef = admin.firestore().collection('votos_certamenes').doc();
      transaction.set(votoRef, {
        user_id: user_id,
        participante_id: participante_id,
        certamen_id: certamen_id,
        categoria_id: categoria_id,
        cantidad_votos: cantidad_vyt_money,
        fecha_voto: admin.firestore.FieldValue.serverTimestamp(),
        tipo_voto: 'publico'
      });
      
      // Actualizar ranking
      const rankingRef = admin.firestore().collection('rankings').doc(rankingId);
      const rankingDoc = await transaction.get(rankingRef);
      
      if (rankingDoc.exists()) {
        const data = rankingDoc.data();
        const participantes = data.participantes || [];
        
        // Buscar participante en el ranking
        const participanteIndex = participantes.findIndex(p => p.participante_id === participante_id);
        
        if (participanteIndex >= 0) {
          // Actualizar votos del participante existente
          participantes[participanteIndex].votos_publicos += cantidad_vyt_money;
          participantes[participanteIndex].puntuacion_final = 
            (participantes[participanteIndex].votos_publicos * (rankingData?.configuracion?.peso_votos_publicos || 0.7)) +
            ((participantes[participanteIndex].puntuacion_jurado || 0) * (rankingData?.configuracion?.peso_votos_jurado || 0.3));
        }
        
        // Reordenar por puntuación
        participantes.sort((a, b) => b.puntuacion_final - a.puntuacion_final);
        
        // Actualizar posiciones
        participantes.forEach((p, index) => {
          p.posicion_actual = index + 1;
          p.clasificado_siguiente_fase = index < (rankingData?.ranking_config?.top_clasificados || 20);
        });
        
        transaction.update(rankingRef, {
          participantes: participantes,
          'estadisticas.total_votos': admin.firestore.FieldValue.increment(cantidad_vyt_money),
          'estadisticas.ultimo_update': admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    
    // Actualizar pozo del certamen
    await updatePozoConVoto(certamen_id, cantidad_vyt_money);
    
    return { success: true, message: 'Voto registrado exitosamente' };
    
  } catch (error) {
    console.error('Error voting in certamen jerárquico:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Actualizar pozo del certamen con votos de VYT-MONEY
 */
async function updatePozoConVoto(certamenId, cantidadVytMoney) {
  const pozoId = `pozo_${certamenId}`;
  const pozoRef = admin.firestore().collection('pozos_certamenes').doc(pozoId);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const pozoDoc = await transaction.get(pozoRef);
    
    if (pozoDoc.exists()) {
      const data = pozoDoc.data();
      const porcentajeVytMoney = data.ingresos.vyt_money.porcentaje_al_pozo;
      const aporteAlPozo = cantidadVytMoney * porcentajeVytMoney;
      
      transaction.update(pozoRef, {
        'ingresos.vyt_money.total_gastado': admin.firestore.FieldValue.increment(cantidadVytMoney),
        'ingresos.vyt_money.monto_al_pozo': admin.firestore.FieldValue.increment(aporteAlPozo),
        'pozo_total': admin.firestore.FieldValue.increment(aporteAlPozo),
        'fecha_actualizacion': admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
}

// =====================================
// 👨‍⚖️ SISTEMA DE JURADO
// =====================================

/**
 * Crear evaluación de jurado para los clasificados
 */
exports.createEvaluacionJurado = onCall(async (request) => {
  try {
    const { certamen_id, categoria_id, configuracion_jurado } = request.data;
    
    // Verificar permisos de admin
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    const evaluacionId = `evaluacion_${certamen_id}_${categoria_id}`;
    const rankingId = `${certamen_id}_${categoria_id}`;
    
    // Obtener top clasificados del ranking público
    const rankingDoc = await admin.firestore().collection('rankings').doc(rankingId).get();
    const rankingData = rankingDoc.data();
    
    if (!rankingData) {
      throw new functions.https.HttpsError('not-found', 'Ranking no encontrado');
    }
    
    const topClasificados = rankingData.participantes
      .filter(p => p.clasificado_siguiente_fase)
      .map(p => ({
        participante_id: p.participante_id,
        votos_publicos: p.votos_publicos,
        posicion_ranking_publico: p.posicion_actual,
        evaluaciones_jurado: [],
        promedio_jurado: 0,
        puntuacion_final: p.votos_publicos,
        posicion_final: p.posicion_actual,
        clasificado: true
      }));
    
    const evaluacion = {
      id: evaluacionId,
      certamen_id: certamen_id,
      categoria_id: categoria_id,
      fase: "evaluacion_top_clasificados",
      
      participantes_evaluados: topClasificados,
      
      configuracion_jurado: {
        numero_jurados: configuracion_jurado?.numero_jurados || 5,
        puntuacion_maxima: configuracion_jurado?.puntuacion_maxima || 40,
        criterios_evaluacion: configuracion_jurado?.criterios || [
          { nombre: "calidad_musical", peso: 0.25, descripcion: "Técnica y calidad musical" },
          { nombre: "originalidad", peso: 0.25, descripcion: "Originalidad y creatividad" },
          { nombre: "performance", peso: 0.25, descripcion: "Interpretación y escena" },
          { nombre: "produccion", peso: 0.25, descripcion: "Calidad de producción" }
        ],
        peso_en_puntuacion_final: configuracion_jurado?.peso_jurado || 0.3,
        fecha_inicio_evaluacion: configuracion_jurado?.fecha_inicio,
        fecha_fin_evaluacion: configuracion_jurado?.fecha_fin
      },
      
      estado: "pendiente", // pendiente | en_proceso | completado
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('evaluaciones_jurado').doc(evaluacionId).set(evaluacion);
    
    // Cambiar fase del certamen
    await admin.firestore().collection('certamenes_estructura').doc(certamen_id).update({
      'ranking_config.fase_actual': 'evaluacion_jurado'
    });
    
    return { success: true, evaluacion_id: evaluacionId, clasificados: topClasificados.length };
    
  } catch (error) {
    console.error('Error creating evaluación jurado:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Registrar evaluación de un jurado
 */
exports.evaluarParticipante = onCall(async (request) => {
  try {
    const { 
      evaluacion_id, 
      participante_id, 
      jurado_id, 
      nombre_jurado, 
      criterios, 
      comentarios 
    } = request.data;
    
    // Verificar permisos de jurado
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    // Calcular puntuación total
    const puntuacionTotal = Object.values(criterios).reduce((sum, puntos) => sum + puntos, 0);
    
    const evaluacionJurado = {
      jurado_id: jurado_id,
      nombre_jurado: nombre_jurado,
      criterios: criterios,
      puntuacion_total: puntuacionTotal,
      comentarios: comentarios,
      fecha_evaluacion: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Actualizar evaluación
    const evaluacionRef = admin.firestore().collection('evaluaciones_jurado').doc(evaluacion_id);
    
    await admin.firestore().runTransaction(async (transaction) => {
      const evaluacionDoc = await transaction.get(evaluacionRef);
      const data = evaluacionDoc.data();
      
      const participantes = data.participantes_evaluados.map(p => {
        if (p.participante_id === participante_id) {
          // Reemplazar evaluación si ya existe del mismo jurado
          const evaluacionesExistentes = p.evaluaciones_jurado.filter(e => e.jurado_id !== jurado_id);
          evaluacionesExistentes.push(evaluacionJurado);
          
          // Calcular promedio
          const promedio = evaluacionesExistentes.reduce((sum, e) => sum + e.puntuacion_total, 0) / evaluacionesExistentes.length;
          
          // Calcular puntuación final combinada
          const pesoPublico = data.configuracion_jurado.peso_en_puntuacion_final;
          const pesoJurado = 1 - pesoPublico;
          const puntuacionFinal = (p.votos_publicos * pesoPublico) + (promedio * pesoJurado);
          
          return {
            ...p,
            evaluaciones_jurado: evaluacionesExistentes,
            promedio_jurado: promedio,
            puntuacion_final: puntuacionFinal
          };
        }
        return p;
      });
      
      // Reordenar por puntuación final
      participantes.sort((a, b) => b.puntuacion_final - a.puntuacion_final);
      
      // Actualizar posiciones finales
      participantes.forEach((p, index) => {
        p.posicion_final = index + 1;
      });
      
      transaction.update(evaluacionRef, {
        participantes_evaluados: participantes,
        fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    return { success: true, message: 'Evaluación registrada exitosamente' };
    
  } catch (error) {
    console.error('Error evaluating participant:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// =====================================
// 🏆 GESTIÓN DE CLASIFICACIONES
// =====================================

/**
 * Promover ganadores al siguiente nivel jerárquico
 */
exports.promoverGanadores = onCall(async (request) => {
  try {
    const { certamen_origen_id, certamen_destino_id, numero_clasificados } = request.data;
    
    // Verificar permisos de admin
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    // Obtener evaluaciones finalizadas del certamen origen
    const evaluacionesQuery = await admin.firestore()
      .collection('evaluaciones_jurado')
      .where('certamen_id', '==', certamen_origen_id)
      .where('estado', '==', 'completado')
      .get();
    
    const ganadoresPorCategoria = {};
    
    // Procesar cada evaluación (una por categoría)
    for (const evaluacionDoc of evaluacionesQuery.docs) {
      const evaluacion = evaluacionDoc.data();
      const categoria = evaluacion.categoria_id;
      
      // Obtener top clasificados
      const ganadores = evaluacion.participantes_evaluados
        .slice(0, numero_clasificados)
        .map(p => ({
          ...p,
          certamen_origen: certamen_origen_id,
          nivel_anterior: 'regional' // o el nivel que corresponda
        }));
      
      ganadoresPorCategoria[categoria] = ganadores;
      
      // Crear/actualizar ranking en certamen destino
      const rankingDestinoId = `${certamen_destino_id}_${categoria}`;
      const rankingDestinoRef = admin.firestore().collection('rankings').doc(rankingDestinoId);
      
      await admin.firestore().runTransaction(async (transaction) => {
        const rankingDestinoDoc = await transaction.get(rankingDestinoRef);
        
        if (rankingDestinoDoc.exists()) {
          // Agregar ganadores al ranking existente
          const rankingData = rankingDestinoDoc.data();
          const participantesExistentes = rankingData.participantes || [];
          
          ganadores.forEach(ganador => {
            // Verificar que no esté ya en el ranking
            if (!participantesExistentes.find(p => p.participante_id === ganador.participante_id)) {
              participantesExistentes.push({
                participante_id: ganador.participante_id,
                votos_publicos: ganador.votos_publicos,
                puntuacion_jurado: ganador.promedio_jurado,
                puntuacion_final: ganador.puntuacion_final,
                posicion_actual: participantesExistentes.length + 1,
                clasificado_siguiente_fase: false,
                datos_participante: {
                  ...ganador.datos_participante,
                  certamen_origen: certamen_origen_id,
                  posicion_anterior: ganador.posicion_final
                }
              });
            }
          });
          
          // Reordenar por puntuación
          participantesExistentes.sort((a, b) => b.puntuacion_final - a.puntuacion_final);
          
          // Actualizar posiciones
          participantesExistentes.forEach((p, index) => {
            p.posicion_actual = index + 1;
          });
          
          transaction.update(rankingDestinoRef, {
            participantes: participantesExistentes,
            'estadisticas.total_participantes': participantesExistentes.length,
            'estadisticas.ultimo_update': admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Crear nuevo ranking con los ganadores
          const nuevoRanking = {
            id: rankingDestinoId,
            certamen_id: certamen_destino_id,
            categoria_id: categoria,
            tipo_ranking: "publico",
            
            participantes: ganadores.map((ganador, index) => ({
              participante_id: ganador.participante_id,
              votos_publicos: ganador.votos_publicos,
              puntuacion_jurado: ganador.promedio_jurado,
              puntuacion_final: ganador.puntuacion_final,
              posicion_actual: index + 1,
              clasificado_siguiente_fase: false,
              datos_participante: {
                ...ganador.datos_participante,
                certamen_origen: certamen_origen_id,
                posicion_anterior: ganador.posicion_final
              }
            })),
            
            estadisticas: {
              total_participantes: ganadores.length,
              total_votos: ganadores.reduce((sum, g) => sum + g.votos_publicos, 0),
              ultimo_update: admin.firestore.FieldValue.serverTimestamp()
            },
            
            configuracion: {
              votos_por_vyt_money: 1,
              maximo_votos_por_usuario: 10,
              peso_votos_publicos: 0.7,
              peso_votos_jurado: 0.3
            },
            
            fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
          };
          
          transaction.set(rankingDestinoRef, nuevoRanking);
        }
      });
    }
    
    return { 
      success: true, 
      message: 'Ganadores promovidos exitosamente',
      ganadores_por_categoria: Object.keys(ganadoresPorCategoria).reduce((acc, cat) => {
        acc[cat] = ganadoresPorCategoria[cat].length;
        return acc;
      }, {})
    };
    
  } catch (error) {
    console.error('Error promoting winners:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// =====================================
// 📊 FUNCIONES DE CONSULTA
// =====================================

/**
 * Obtener estructura completa de certámenes
 */
exports.getEstructuraCertamenes = onCall(async (request) => {
  try {
    const certamenesSnapshot = await admin.firestore().collection('certamenes_estructura').get();
    const certamenes = {};
    
    certamenesSnapshot.forEach(doc => {
      const data = doc.data();
      certamenes[doc.id] = data;
    });
    
    // Organizar por jerarquía
    const estructura = {
      nacional: {},
      provinciales: {},
      regionales: {}
    };
    
    Object.values(certamenes).forEach(certamen => {
      switch (certamen.tipo) {
        case 'nacional':
          estructura.nacional[certamen.id] = certamen;
          break;
        case 'provincial':
          if (!estructura.provinciales[certamen.provincia]) {
            estructura.provinciales[certamen.provincia] = {};
          }
          estructura.provinciales[certamen.provincia][certamen.id] = certamen;
          break;
        case 'regional':
          if (!estructura.regionales[certamen.provincia]) {
            estructura.regionales[certamen.provincia] = {};
          }
          estructura.regionales[certamen.provincia][certamen.id] = certamen;
          break;
      }
    });
    
    return estructura;
    
  } catch (error) {
    console.error('Error getting estructura certámenes:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Obtener estado del pozo de un certamen
 */
exports.getEstadoPozo = onCall(async (request) => {
  try {
    const { certamen_id } = request.data;
    const pozoId = `pozo_${certamen_id}`;
    
    const pozoDoc = await admin.firestore().collection('pozos_certamenes').doc(pozoId).get();
    
    if (!pozoDoc.exists()) {
      throw new functions.https.HttpsError('not-found', 'Pozo no encontrado');
    }
    
    return pozoDoc.data();
    
  } catch (error) {
    console.error('Error getting estado pozo:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Obtener ranking de una categoría específica
 */
exports.getRankingCategoria = onCall(async (request) => {
  try {
    const { certamen_id, categoria_id, limite } = request.data;
    const rankingId = `${certamen_id}_${categoria_id}`;
    
    const rankingDoc = await admin.firestore().collection('rankings').doc(rankingId).get();
    
    if (!rankingDoc.exists()) {
      throw new functions.https.HttpsError('not-found', 'Ranking no encontrado');
    }
    
    const ranking = rankingDoc.data();
    
    if (limite) {
      ranking.participantes = ranking.participantes.slice(0, limite);
    }
    
    return ranking;
    
  } catch (error) {
    console.error('Error getting ranking categoría:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});