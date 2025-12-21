/**
 * 💰 SISTEMA DE CONFIGURACIÓN DE VYT MUSIC
 * 
 * Todos los valores económicos configurables desde el admin
 * Se guardan en Firestore: colección "configuracion_sistema"
 */

export const CONFIG_DEFAULT = {
    // ID del documento en Firestore
    id: 'config_principal',
    
    // 💵 COSTOS Y PRECIOS
    precios: {
        inscripcion_certamen: 15000,        // Pesos argentinos
        voto_vyt_money: 1000,               // Cantidad de VYT Money por voto
        vyt_money_precio_1000: 1500,        // Precio en pesos de 1000 VYT Money
        entrada_evento_default: 5000        // Precio sugerido para entradas
    },
    
    // 📊 DISTRIBUCIÓN DE INGRESOS
    distribucion: {
        inscripcion_pozo_pct: 30,           // % al pozo
        inscripcion_ganancia_pct: 70,       // % ganancia VYT
        
        voto_pozo_pct: 30,                  // % al pozo
        voto_ganancia_pct: 70,              // % ganancia VYT
        
        entrada_pozo_pct: 30,               // % al pozo
        entrada_costos_pct: 40,             // % costos evento
        entrada_ganancia_pct: 30            // % ganancia VYT
    },
    
    // 🏆 PREMIOS
    premios: {
        primer_lugar_pct: 50,               // % del pozo
        segundo_lugar_pct: 30,              // % del pozo
        tercer_lugar_pct: 20                // % del pozo
    },
    
    // 🎯 CUPOS POR FASE (pueden variar según provincia)
    cupos_default: {
        regional_avanza: 35,                // Top 35 de cada región avanzan
        provincial_avanza: 30,              // Top 30 de provincia avanzan
        nacional_finalistas: 10             // Top 10 nacional
    },
    
    // 💎 POZO INICIAL (Seed Money)
    pozo_inicial_default: 500000,          // Pesos para primer certamen
    
    // ⏰ TIMEOUTS Y LÍMITES
    timeouts: {
        pago_inscripcion_horas: 48,        // Horas para pagar después de aprobación
        duracion_votacion_dias: 30,        // Días de votación por defecto
        duracion_inscripcion_dias: 15      // Días de inscripción abierta
    },
    
    // 📧 NOTIFICACIONES
    emails: {
        habilitado: true,
        email_soporte: 'soporte@vytmusic.com',
        email_admin: 'admin@vytmusic.com'
    },
    
    // 🎨 BRANDING
    branding: {
        nombre_plataforma: 'VYT MUSIC',
        tagline: 'La Revolución Musical Argentina',
        color_primario: '#3B82F6',
        color_secundario: '#2DD4BF'
    },
    
    // 📊 ESTADOS
    sistema_activo: true,
    mantenimiento: false,
    mensaje_mantenimiento: 'Estamos mejorando la plataforma. Volvemos pronto.',
    
    // 🔄 METADATA
    actualizado_el: null,
    actualizado_por: null,
    version: '1.0.0'
};

/**
 * 📥 Cargar configuración desde Firestore
 */
export async function cargarConfiguracion(db) {
    try {
        const doc = await db.collection('configuracion_sistema')
            .doc('config_principal')
            .get();
        
        if (doc.exists) {
            console.log('✅ Configuración cargada desde Firestore');
            return doc.data();
        } else {
            console.warn('⚠️ No existe configuración, usando valores por defecto');
            return CONFIG_DEFAULT;
        }
    } catch (error) {
        console.error('❌ Error al cargar configuración:', error);
        return CONFIG_DEFAULT;
    }
}

/**
 * 💾 Guardar configuración en Firestore
 */
export async function guardarConfiguracion(db, config, adminUid) {
    try {
        await db.collection('configuracion_sistema')
            .doc('config_principal')
            .set({
                ...config,
                actualizado_el: new Date(),
                actualizado_por: adminUid
            }, { merge: true });
        
        console.log('✅ Configuración guardada exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar configuración:', error);
        return false;
    }
}

/**
 * 🔢 Calcular aportes al pozo según configuración
 */
export function calcularAportePozo(tipo, cantidad, config) {
    switch(tipo) {
        case 'inscripcion':
            return cantidad * config.precios.inscripcion_certamen * (config.distribucion.inscripcion_pozo_pct / 100);
        
        case 'voto':
            return cantidad * config.precios.vyt_money_precio_1000 * (config.distribucion.voto_pozo_pct / 100);
        
        case 'entrada':
            const precioEntrada = config.precios.entrada_evento_default;
            return cantidad * precioEntrada * (config.distribucion.entrada_pozo_pct / 100);
        
        default:
            return 0;
    }
}

/**
 * 💰 Calcular ganancias VYT según configuración
 */
export function calcularGananciaVYT(tipo, cantidad, config) {
    switch(tipo) {
        case 'inscripcion':
            return cantidad * config.precios.inscripcion_certamen * (config.distribucion.inscripcion_ganancia_pct / 100);
        
        case 'voto':
            return cantidad * config.precios.vyt_money_precio_1000 * (config.distribucion.voto_ganancia_pct / 100);
        
        case 'entrada':
            const precioEntrada = config.precios.entrada_evento_default;
            return cantidad * precioEntrada * (config.distribucion.entrada_ganancia_pct / 100);
        
        default:
            return 0;
    }
}

/**
 * 🎁 Calcular distribución de premios
 */
export function calcularPremios(pozoTotal, config) {
    return {
        primer_lugar: pozoTotal * (config.premios.primer_lugar_pct / 100),
        segundo_lugar: pozoTotal * (config.premios.segundo_lugar_pct / 100),
        tercer_lugar: pozoTotal * (config.premios.tercer_lugar_pct / 100)
    };
}

/**
 * 🔍 Validar configuración antes de guardar
 */
export function validarConfiguracion(config) {
    const errores = [];
    
    // Validar que porcentajes de inscripción sumen 100%
    const sumaInscripcion = config.distribucion.inscripcion_pozo_pct + 
                           config.distribucion.inscripcion_ganancia_pct;
    if (sumaInscripcion !== 100) {
        errores.push(`Inscripción: Los porcentajes deben sumar 100% (actual: ${sumaInscripcion}%)`);
    }
    
    // Validar que porcentajes de voto sumen 100%
    const sumaVoto = config.distribucion.voto_pozo_pct + 
                    config.distribucion.voto_ganancia_pct;
    if (sumaVoto !== 100) {
        errores.push(`Votos: Los porcentajes deben sumar 100% (actual: ${sumaVoto}%)`);
    }
    
    // Validar que porcentajes de entrada sumen 100%
    const sumaEntrada = config.distribucion.entrada_pozo_pct + 
                       config.distribucion.entrada_costos_pct + 
                       config.distribucion.entrada_ganancia_pct;
    if (sumaEntrada !== 100) {
        errores.push(`Entradas: Los porcentajes deben sumar 100% (actual: ${sumaEntrada}%)`);
    }
    
    // Validar que premios sumen 100%
    const sumaPremios = config.premios.primer_lugar_pct + 
                       config.premios.segundo_lugar_pct + 
                       config.premios.tercer_lugar_pct;
    if (sumaPremios !== 100) {
        errores.push(`Premios: Los porcentajes deben sumar 100% (actual: ${sumaPremios}%)`);
    }
    
    // Validar que precios sean positivos
    if (config.precios.inscripcion_certamen <= 0) {
        errores.push('El precio de inscripción debe ser mayor a 0');
    }
    
    if (config.precios.voto_vyt_money <= 0) {
        errores.push('El costo de voto debe ser mayor a 0');
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * 🎨 Formatear precio en pesos argentinos
 */
export function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(valor);
}

/**
 * 📊 Generar resumen de configuración para mostrar en admin
 */
export function generarResumenConfig(config) {
    return {
        inscripcion: {
            precio: formatearPrecio(config.precios.inscripcion_certamen),
            al_pozo: formatearPrecio(config.precios.inscripcion_certamen * config.distribucion.inscripcion_pozo_pct / 100),
            ganancia: formatearPrecio(config.precios.inscripcion_certamen * config.distribucion.inscripcion_ganancia_pct / 100)
        },
        voto: {
            costo_tokens: config.precios.voto_vyt_money,
            precio: formatearPrecio(config.precios.vyt_money_precio_1000),
            al_pozo: formatearPrecio(config.precios.vyt_money_precio_1000 * config.distribucion.voto_pozo_pct / 100),
            ganancia: formatearPrecio(config.precios.vyt_money_precio_1000 * config.distribucion.voto_ganancia_pct / 100)
        },
        entrada: {
            precio: formatearPrecio(config.precios.entrada_evento_default),
            al_pozo: formatearPrecio(config.precios.entrada_evento_default * config.distribucion.entrada_pozo_pct / 100),
            costos: formatearPrecio(config.precios.entrada_evento_default * config.distribucion.entrada_costos_pct / 100),
            ganancia: formatearPrecio(config.precios.entrada_evento_default * config.distribucion.entrada_ganancia_pct / 100)
        }
    };
}

// Exportar para uso en HTML sin módulos
if (typeof window !== 'undefined') {
    window.CONFIG_DEFAULT = CONFIG_DEFAULT;
    window.cargarConfiguracion = cargarConfiguracion;
    window.guardarConfiguracion = guardarConfiguracion;
    window.calcularAportePozo = calcularAportePozo;
    window.calcularGananciaVYT = calcularGananciaVYT;
    window.calcularPremios = calcularPremios;
    window.validarConfiguracion = validarConfiguracion;
    window.formatearPrecio = formatearPrecio;
    window.generarResumenConfig = generarResumenConfig;
}
