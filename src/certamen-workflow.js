/**
 * 🏆 SISTEMA DE FASES DE CERTÁMENES VYT MUSIC
 * 
 * Flujo: Regional → Provincial → Nacional
 * Modalidades: Online, Presencial, Híbrido
 */

export const TIPOS_FASE = {
    ONLINE: 'online',
    PRESENCIAL: 'presencial',
    HIBRIDO: 'hibrido'
};

export const ESTADOS_CERTAMEN = {
    DRAFT: 'draft',                    // Borrador (admin configurando)
    INSCRIPCION_ABIERTA: 'inscripcion_abierta',  // Recibiendo inscripciones
    EVALUACION: 'evaluacion',          // Admin revisando videos
    VOTACION: 'votacion',              // Público votando
    CERRADO: 'cerrado',                // Votación cerrada
    JURADO: 'jurado',                  // Jurado evaluando top N
    FINALIZADO: 'finalizado'           // Ganadores anunciados
};

export const FASES_CERTAMEN = {
    REGIONAL: {
        nombre: 'Regional',
        nivel: 1,
        descripcion: 'Competencia a nivel regional (Norte/Centro/Sur)',
        cupo_default: 35,
        avanza_a: 'PROVINCIAL',
        config: {
            permite_inscripcion: true,
            permite_votacion: true,
            requiere_pago_inscripcion: true,
            puede_ser_presencial: true,  // ✅ Puede hacer semifinal presencial
            duracion_votacion_dias: 30,
            min_participantes: 10
        }
    },
    
    PROVINCIAL: {
        nombre: 'Provincial',
        nivel: 2,
        descripcion: 'Competencia a nivel provincial (todas las regiones)',
        cupo_default: 30,
        avanza_a: 'NACIONAL',
        config: {
            permite_inscripcion: false,  // Solo entran los top de regionales
            permite_votacion: true,
            requiere_pago_inscripcion: false, // Ya pagaron en regional
            puede_ser_presencial: true,  // ✅ Puede hacer final provincial presencial
            duracion_votacion_dias: 30,
            min_participantes: 50
        }
    },
    
    NACIONAL: {
        nombre: 'Nacional',
        nivel: 3,
        descripcion: 'Competencia a nivel nacional (todas las provincias)',
        cupo_default: 10,
        avanza_a: null,  // Es la fase final
        config: {
            permite_inscripcion: false,  // Solo entran los ganadores provinciales
            permite_votacion: true,
            requiere_pago_inscripcion: false,
            puede_ser_presencial: true,  // ✅ Gran Final Nacional presencial
            duracion_votacion_dias: 45,
            min_participantes: 20
        }
    }
};

/**
 * 📝 Estructura de Firestore para Certamen Completo
 */
export const CERTAMEN_TEMPLATE = {
    // Información básica
    nombre: '',
    descripcion: '',
    imagen_url: '',
    
    // Fase actual
    fase_actual: 'REGIONAL',  // REGIONAL | PROVINCIAL | NACIONAL
    estado: 'draft',          // draft | inscripcion_abierta | votacion | cerrado | jurado | finalizado
    
    // Ubicación geográfica
    provincia: '',            // Ej: 'santa_fe'
    region: null,             // null para provincial/nacional, 'norte'/'centro'/'sur' para regional
    
    // Configuración de fase
    tipo_fase: 'online',      // online | presencial | hibrido
    
    // Cupos y reglas
    cupo_avanza: 35,          // Cuántos avanzan a la siguiente fase
    cupo_jurado: 30,          // Cuántos artistas ve el jurado
    
    // Fechas
    fecha_inicio_inscripcion: null,
    fecha_fin_inscripcion: null,
    fecha_inicio_votacion: null,
    fecha_fin_votacion: null,
    fecha_evento_presencial: null,  // Si tipo_fase = presencial/hibrido
    
    // Costos e ingresos
    costo_inscripcion: 15000,       // Pesos argentinos (30% al pozo, 70% ganancia VYT)
    costo_voto: 1000,               // VYT Money por voto (equivale a $1,500 pesos: 30% al pozo, 70% ganancia)
    pozo_inicial: 500000,           // Seed money: pozo base con el que inicia el certamen
    
    // Evento presencial (si aplica)
    evento_presencial: null,  // Ver EVENTO_PRESENCIAL_TEMPLATE
    
    // Pozo de premios
    pozo: {
        inicial: 500000,          // Pozo base inicial (configurable)
        inscripciones: 0,         // 30% de cada inscripción ($4,500 por artista)
        votos: 0,                 // 30% de cada voto ($450 por voto)
        entradas: 0,              // 30% de cada entrada (si hay evento presencial)
        total: 500000,            // inicial + inscripciones + votos + entradas
        distribucion: {
            primer_lugar: 0.50,   // 50%
            segundo_lugar: 0.30,  // 30%
            tercer_lugar: 0.20    // 20%
        }
    },
    
    // Ganancias VYT Music (privado, NO mostrar al público)
    ganancias_vyt: {
        inscripciones: 0,         // 70% de cada inscripción ($10,500 por artista)
        votos: 0,                 // 70% de cada voto ($1,050 por voto)
        entradas: 0,              // 30% de cada entrada (el otro 40% es costos)
        total: 0
    },
    
    // Estadísticas
    stats: {
        participantes_totales: 0,
        participantes_aprobados: 0,
        participantes_pagaron: 0,
        votos_totales: 0,
        entradas_vendidas: 0
    },
    
    // Ganadores (después de que el jurado decida)
    ganadores: {
        primer_lugar: null,   // user_id del ganador
        segundo_lugar: null,
        tercer_lugar: null
    },
    
    // Metadata
    creado_por: '',           // uid del admin
    creado_el: null,          // timestamp
    actualizado_el: null      // timestamp
};

/**
 * 🎭 Estructura para Evento Presencial
 */
export const EVENTO_PRESENCIAL_TEMPLATE = {
    // Información del evento
    nombre_evento: '',        // Ej: "Semifinal Regional Norte - Santa Fe"
    tipo: '',                 // 'semifinal' | 'final'
    
    // Ubicación
    nombre_lugar: '',         // Ej: "Teatro Municipal"
    direccion: '',
    ciudad: '',
    provincia: '',
    capacidad: 0,            // Cantidad de butacas
    
    // Fecha y hora
    fecha: null,             // timestamp
    hora_inicio: '',         // "20:00"
    hora_fin: '',            // "23:00"
    
    // Entradas
    precio_entrada: 0,       // Pesos argentinos
    entradas_disponibles: 0,
    entradas_vendidas: 0,
    
    // Streaming
    tiene_streaming: false,
    url_streaming: '',       // YouTube Live, etc.
    
    // Participantes que actuarán
    artistas_invitados: [],  // Array de user_ids (top N del ranking)
    
    // Jurado
    jurado: [],              // Array de {nombre, foto, bio}
    
    // Premios locales (además del pozo principal)
    premios_adicionales: [], // Array de {nombre, descripcion, valor}
    
    // Estado
    estado: 'planificado',   // planificado | confirmado | en_curso | finalizado
    
    // Metadata
    creado_el: null,
    actualizado_el: null
};

/**
 * 🎟️ Estructura para Entrada Vendida
 */
export const ENTRADA_TEMPLATE = {
    // Relaciones
    certamen_id: '',
    evento_id: '',
    comprador_uid: '',
    
    // Información de la entrada
    numero_entrada: '',      // Ej: "SNF-2025-001234"
    tipo: 'general',         // general | vip | preferencial
    precio: 0,
    
    // QR y validación
    qr_code: '',            // URL de la imagen QR
    codigo_validacion: '',  // Hash único para validar
    usada: false,
    fecha_uso: null,
    validada_por: null,     // uid del staff que validó
    
    // Pago
    metodo_pago: '',        // mercadopago | transferencia
    estado_pago: '',        // pendiente | aprobado | rechazado
    payment_id: '',         // ID de MercadoPago
    
    // Metadata
    comprada_el: null,
    actualizada_el: null
};

/**
 * 🔄 Funciones de Workflow del Certamen
 */

export class CertamenWorkflow {
    
    /**
     * Verificar si un artista puede avanzar a la siguiente fase
     */
    static puedeAvanzar(participante, certamen) {
        const fase = FASES_CERTAMEN[certamen.fase_actual];
        
        // Verificar posición en ranking
        if (participante.posicion > certamen.cupo_avanza) {
            return {
                puede: false,
                razon: `Necesitas estar en el Top ${certamen.cupo_avanza}`
            };
        }
        
        // Verificar pago (si es regional)
        if (fase.config.requiere_pago_inscripcion && !participante.pago_aprobado) {
            return {
                puede: false,
                razon: 'Debes pagar la inscripción primero'
            };
        }
        
        return { puede: true };
    }
    
    /**
     * Promover artistas a la siguiente fase
     */
    static async promoverAFaseSiguiente(db, certamen_id, top_participantes) {
        const certamen = await db.collection('certamenes').doc(certamen_id).get();
        const data = certamen.data();
        const faseActual = FASES_CERTAMEN[data.fase_actual];
        
        if (!faseActual.avanza_a) {
            throw new Error('Esta es la fase final, no hay siguiente fase');
        }
        
        // Crear nuevo certamen para la siguiente fase
        const nuevoCertamen = {
            ...CERTAMEN_TEMPLATE,
            nombre: `${data.nombre} - ${faseActual.avanza_a}`,
            fase_actual: faseActual.avanza_a,
            provincia: data.provincia,
            region: null, // Provincial/Nacional no tienen región
            participantes_invitados: top_participantes.map(p => p.uid),
            certamen_padre: certamen_id,
            fecha_inicio_votacion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 días
            creado_el: new Date()
        };
        
        return nuevoCertamen;
    }
    
    /**
     * Calcular pozo en tiempo real
     * 
     * DISTRIBUCIÓN DE INGRESOS:
     * - Inscripciones: 30% al pozo, 70% ganancia VYT
     * - Votos: 30% al pozo, 70% ganancia VYT
     * - Entradas: 30% al pozo, 40% costos evento, 30% ganancia VYT
     */
    static calcularPozo(certamen, participantes, votos) {
        // INSCRIPCIONES: Solo 30% va al pozo
        const inscripciones_totales = participantes.filter(p => p.pago_aprobado).length * certamen.costo_inscripcion;
        const pozo_inscripciones = inscripciones_totales * 0.30;
        const ganancia_inscripciones = inscripciones_totales * 0.70;
        
        // VOTOS: Solo 30% va al pozo (1000 VYT Money = $1,500 pesos)
        const votos_totales = votos.length * 1500; // Precio de compra de VYT Money
        const pozo_votos = votos_totales * 0.30;
        const ganancia_votos = votos_totales * 0.70;
        
        // ENTRADAS PRESENCIALES: 30% al pozo, resto para costos y ganancia
        let pozo_entradas = 0;
        let ganancia_entradas = 0;
        let costos_entradas = 0;
        if (certamen.evento_presencial && certamen.evento_presencial.entradas_vendidas) {
            const entradas_totales = certamen.evento_presencial.entradas_vendidas * 
                                    certamen.evento_presencial.precio_entrada;
            pozo_entradas = entradas_totales * 0.30;
            costos_entradas = entradas_totales * 0.40; // Alquiler, producción, etc.
            ganancia_entradas = entradas_totales * 0.30;
        }
        
        // POZO INICIAL (Seed Money configurado por admin)
        const pozo_inicial = certamen.pozo_inicial || 0;
        
        // POZO TOTAL = Inicial + Aportes
        const total = pozo_inicial + pozo_inscripciones + pozo_votos + pozo_entradas;
        
        return {
            // Desglose del pozo
            pozo_inicial: pozo_inicial,
            inscripciones: pozo_inscripciones,
            votos: pozo_votos,
            entradas: pozo_entradas,
            total: total,
            
            // Distribución de premios
            primer_lugar: total * certamen.pozo.distribucion.primer_lugar,
            segundo_lugar: total * certamen.pozo.distribucion.segundo_lugar,
            tercer_lugar: total * certamen.pozo.distribucion.tercer_lugar,
            
            // Ganancias VYT Music (NO se muestran públicamente)
            ganancia_vyt_inscripciones: ganancia_inscripciones,
            ganancia_vyt_votos: ganancia_votos,
            ganancia_vyt_entradas: ganancia_entradas,
            ganancia_vyt_total: ganancia_inscripciones + ganancia_votos + ganancia_entradas,
            
            // Costos operativos
            costos_evento: costos_entradas
        };
    }
    
    /**
     * Generar código QR para entrada
     */
    static generarCodigoEntrada(certamen_id, evento_id, numero) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        return `VYT-${certamen_id.substring(0, 6)}-${numero}-${random}-${timestamp}`.toUpperCase();
    }
}

/**
 * 📊 Función: Obtener configuración de fase
 */
export function obtenerConfigFase(fase) {
    return FASES_CERTAMEN[fase] || null;
}

/**
 * ✅ Función: Validar transición de estado
 */
export function puedeTransicionarA(estadoActual, estadoNuevo) {
    const transicionesValidas = {
        'draft': ['inscripcion_abierta'],
        'inscripcion_abierta': ['evaluacion', 'draft'],
        'evaluacion': ['votacion', 'inscripcion_abierta'],
        'votacion': ['cerrado'],
        'cerrado': ['jurado'],
        'jurado': ['finalizado'],
        'finalizado': []
    };
    
    return transicionesValidas[estadoActual]?.includes(estadoNuevo) || false;
}

// Exportar para uso en HTML
if (typeof window !== 'undefined') {
    window.TIPOS_FASE = TIPOS_FASE;
    window.ESTADOS_CERTAMEN = ESTADOS_CERTAMEN;
    window.FASES_CERTAMEN = FASES_CERTAMEN;
    window.CERTAMEN_TEMPLATE = CERTAMEN_TEMPLATE;
    window.EVENTO_PRESENCIAL_TEMPLATE = EVENTO_PRESENCIAL_TEMPLATE;
    window.ENTRADA_TEMPLATE = ENTRADA_TEMPLATE;
    window.CertamenWorkflow = CertamenWorkflow;
    window.obtenerConfigFase = obtenerConfigFase;
    window.puedeTransicionarA = puedeTransicionarA;
}
