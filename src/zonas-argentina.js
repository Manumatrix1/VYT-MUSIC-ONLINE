/**
 * 🗺️ SISTEMA DE ZONAS GEOGRÁFICAS DE ARGENTINA
 * 
 * Estructura: Provincia → Región (Norte/Centro/Sur) → Ciudades
 * Uso: Clasificar automáticamente artistas por zona según su ciudad
 */

export const ZONAS_ARGENTINA = {
    'santa_fe': {
        nombre: 'Santa Fe',
        regiones: {
            norte: {
                nombre: 'Norte de Santa Fe',
                descripcion: 'Región norte de la provincia',
                ciudades: [
                    'Reconquista', 'Avellaneda', 'Malabrigo', 'Vera', 'Calchaquí',
                    'Tostado', 'Villa Ocampo', 'Florencia', 'San Javier', 'Romang',
                    'Lanteri', 'Tartagal', 'Garabato', 'Las Toscas', 'Berna'
                ],
                cupo_regional: 35, // Top 35 pasan a provincial
                color: '#FF6B6B' // Para UI
            },
            centro: {
                nombre: 'Centro de Santa Fe',
                descripcion: 'Región central con capital provincial',
                ciudades: [
                    'Santa Fe', 'Santo Tomé', 'Sauce Viejo', 'Recreo', 'San José del Rincón',
                    'Esperanza', 'Rafaela', 'Sunchales', 'San Carlos', 'Humboldt',
                    'San Cristóbal', 'Gálvez', 'San Jorge', 'Las Colonias', 'Franck',
                    'Angélica', 'Sa Pereyra', 'Frontera', 'San Vicente', 'Providencia'
                ],
                cupo_regional: 35,
                color: '#4ECDC4'
            },
            sur: {
                nombre: 'Sur de Santa Fe',
                descripcion: 'Región sur con Rosario',
                ciudades: [
                    'Rosario', 'Villa Gobernador Gálvez', 'Pérez', 'Funes', 'Roldán',
                    'Granadero Baigorria', 'Capitán Bermúdez', 'San Lorenzo', 'Puerto General San Martín',
                    'Casilda', 'Cañada de Gómez', 'Firmat', 'Venado Tuerto', 'Rufino',
                    'Armstrong', 'Las Parejas', 'Totoras', 'Carcarañá', 'Villa Constitución',
                    'Arroyo Seco', 'Alvear', 'Pueblo Esther', 'Soldini'
                ],
                cupo_regional: 35,
                color: '#FFE66D'
            }
        },
        cupo_provincial: 30, // Top 30 de 105 van a nacional
        cupo_nacional: 10    // Top 10 de provincia van a final nacional
    },
    
    'buenos_aires': {
        nombre: 'Buenos Aires',
        regiones: {
            norte: {
                nombre: 'Norte de Buenos Aires',
                descripcion: 'Conurbano Norte',
                ciudades: [
                    'San Isidro', 'Vicente López', 'San Fernando', 'Tigre', 'San Martín',
                    'Tres de Febrero', 'Hurlingham', 'Ituzaingó', 'Morón', 'La Matanza',
                    'Malvinas Argentinas', 'José C. Paz', 'San Miguel', 'Pilar', 'Escobar',
                    'Zárate', 'Campana', 'Exaltación de la Cruz'
                ],
                cupo_regional: 40,
                color: '#FF6B6B'
            },
            centro: {
                nombre: 'CABA y Gran Buenos Aires',
                descripcion: 'Ciudad Autónoma y zona metropolitana',
                ciudades: [
                    'CABA', 'Buenos Aires', 'Ciudad Autónoma de Buenos Aires',
                    'Avellaneda', 'Lanús', 'Lomas de Zamora', 'Quilmes', 'Berazategui',
                    'Florencio Varela', 'Almirante Brown', 'Esteban Echeverría',
                    'La Plata', 'Ensenada', 'Berisso', 'Brandsen', 'Magdalena'
                ],
                cupo_regional: 40,
                color: '#4ECDC4'
            },
            sur: {
                nombre: 'Sur de Buenos Aires',
                descripcion: 'Costa atlántica y zona sur',
                ciudades: [
                    'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría', 'Azul',
                    'Necochea', 'Miramar', 'Pinamar', 'Villa Gesell', 'San Clemente',
                    'Dolores', 'Chascomús', 'Rauch', 'Balcarce', 'General Pueyrredón',
                    'Coronel Dorrego', 'Tres Arroyos', 'González Chaves', 'San Cayetano'
                ],
                cupo_regional: 40,
                color: '#FFE66D'
            }
        },
        cupo_provincial: 35,
        cupo_nacional: 12
    },

    'cordoba': {
        nombre: 'Córdoba',
        regiones: {
            norte: {
                nombre: 'Norte de Córdoba',
                descripcion: 'Zona norte provincial',
                ciudades: [
                    'Deán Funes', 'Villa de María', 'San Francisco del Chañar',
                    'Villa Tulumba', 'Quilino', 'Cruz del Eje', 'Serrezuela',
                    'Villa de Soto', 'Capilla del Monte', 'Cosquín', 'La Cumbre'
                ],
                cupo_regional: 35,
                color: '#FF6B6B'
            },
            centro: {
                nombre: 'Centro de Córdoba',
                descripcion: 'Capital y área metropolitana',
                ciudades: [
                    'Córdoba', 'Villa Carlos Paz', 'Alta Gracia', 'Jesús María',
                    'Colonia Caroya', 'Villa Allende', 'Unquillo', 'Mendiolaza',
                    'La Calera', 'Saldán', 'Río Ceballos', 'Villa Nueva',
                    'Bell Ville', 'Río Cuarto', 'Villa María', 'San Francisco'
                ],
                cupo_regional: 35,
                color: '#4ECDC4'
            },
            sur: {
                nombre: 'Sur de Córdoba',
                descripcion: 'Zona sur provincial',
                ciudades: [
                    'Río Tercero', 'Almafuerte', 'Hernando', 'Las Varillas',
                    'Marcos Juárez', 'Laboulaye', 'General Deheza', 'Ucacha',
                    'Adelia María', 'Berrotarán', 'Las Perdices', 'Alejandro Roca'
                ],
                cupo_regional: 35,
                color: '#FFE66D'
            }
        },
        cupo_provincial: 30,
        cupo_nacional: 10
    },

    'mendoza': {
        nombre: 'Mendoza',
        regiones: {
            norte: {
                nombre: 'Norte de Mendoza',
                descripcion: 'Valle de Uco y zona norte',
                ciudades: [
                    'Lavalle', 'Las Heras', 'Uspallata', 'Villavicencio',
                    'Potrerillos', 'Cacheuta', 'Tupungato', 'Tunuyán', 'San Carlos'
                ],
                cupo_regional: 30,
                color: '#FF6B6B'
            },
            centro: {
                nombre: 'Gran Mendoza',
                descripcion: 'Capital y área metropolitana',
                ciudades: [
                    'Mendoza', 'Godoy Cruz', 'Las Heras', 'Luján de Cuyo',
                    'Maipú', 'Guaymallén', 'San Martín', 'Palmira', 'Chacras de Coria'
                ],
                cupo_regional: 30,
                color: '#4ECDC4'
            },
            sur: {
                nombre: 'Sur de Mendoza',
                descripcion: 'Zona sur provincial',
                ciudades: [
                    'San Rafael', 'General Alvear', 'Malargüe', 'La Consulta',
                    'Monte Comán', 'Bowen', 'Pareditas', 'Eugenio Bustos'
                ],
                cupo_regional: 30,
                color: '#FFE66D'
            }
        },
        cupo_provincial: 25,
        cupo_nacional: 8
    },

    'tucuman': {
        nombre: 'Tucumán',
        regiones: {
            norte: {
                nombre: 'Norte de Tucumán',
                descripcion: 'Zona norte provincial',
                ciudades: [
                    'Trancas', 'Burruyacú', 'El Cadillal', 'San Pedro de Colalao',
                    'Choromoro', 'Vipos', 'Taco Ralo'
                ],
                cupo_regional: 25,
                color: '#FF6B6B'
            },
            centro: {
                nombre: 'Gran San Miguel de Tucumán',
                descripcion: 'Capital y área metropolitana',
                ciudades: [
                    'San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Las Talitas',
                    'Banda del Río Salí', 'Alderetes', 'Famaillá', 'Monteros',
                    'Concepción', 'Aguilares', 'Simoca'
                ],
                cupo_regional: 25,
                color: '#4ECDC4'
            },
            sur: {
                nombre: 'Sur de Tucumán',
                descripcion: 'Zona sur provincial',
                ciudades: [
                    'Tafí del Valle', 'Amaicha del Valle', 'Acheral', 'Bella Vista',
                    'La Cocha', 'Graneros', 'Juan Bautista Alberdi'
                ],
                cupo_regional: 25,
                color: '#FFE66D'
            }
        },
        cupo_provincial: 20,
        cupo_nacional: 6
    }

    // 🔄 AGREGAR MÁS PROVINCIAS según necesidad
};

/**
 * 🔍 Función: Detectar región automáticamente según ciudad
 */
export function detectarRegion(ciudad, provincia) {
    const prov = ZONAS_ARGENTINA[provincia.toLowerCase().replace(/ /g, '_')];
    if (!prov) return null;

    // Normalizar ciudad (quitar acentos, lowercase)
    const ciudadNormalizada = ciudad
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    for (const [codigoRegion, region] of Object.entries(prov.regiones)) {
        const encontrada = region.ciudades.find(c => {
            const cNormalizada = c
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
            return cNormalizada.includes(ciudadNormalizada) || 
                   ciudadNormalizada.includes(cNormalizada);
        });

        if (encontrada) {
            return {
                provincia: prov.nombre,
                codigoProvincia: provincia.toLowerCase().replace(/ /g, '_'),
                region: region.nombre,
                codigoRegion: codigoRegion,
                cupoRegional: region.cupo_regional,
                cupoProvincial: prov.cupo_provincial,
                cupoNacional: prov.cupo_nacional,
                color: region.color
            };
        }
    }

    // Si no encuentra, asignar a "centro" por defecto
    return {
        provincia: prov.nombre,
        codigoProvincia: provincia.toLowerCase().replace(/ /g, '_'),
        region: prov.regiones.centro.nombre,
        codigoRegion: 'centro',
        cupoRegional: prov.regiones.centro.cupo_regional,
        cupoProvincial: prov.cupo_provincial,
        cupoNacional: prov.cupo_nacional,
        color: prov.regiones.centro.color
    };
}

/**
 * 📊 Función: Obtener todas las provincias disponibles
 */
export function obtenerProvinciasDisponibles() {
    return Object.entries(ZONAS_ARGENTINA).map(([codigo, data]) => ({
        codigo,
        nombre: data.nombre,
        regiones: Object.keys(data.regiones).length,
        cupoProvincial: data.cupo_provincial,
        cupoNacional: data.cupo_nacional
    }));
}

/**
 * 🎯 Función: Obtener regiones de una provincia
 */
export function obtenerRegiones(provincia) {
    const prov = ZONAS_ARGENTINA[provincia.toLowerCase().replace(/ /g, '_')];
    if (!prov) return [];

    return Object.entries(prov.regiones).map(([codigo, region]) => ({
        codigo,
        nombre: region.nombre,
        descripcion: region.descripcion,
        ciudades: region.ciudades.length,
        cupoRegional: region.cupo_regional,
        color: region.color
    }));
}

/**
 * ✅ Función: Validar si una ciudad existe en el sistema
 */
export function validarCiudad(ciudad, provincia) {
    const region = detectarRegion(ciudad, provincia);
    return region !== null;
}

// Exportar como módulo global para HTML sin módulos
if (typeof window !== 'undefined') {
    window.ZONAS_ARGENTINA = ZONAS_ARGENTINA;
    window.detectarRegion = detectarRegion;
    window.obtenerProvinciasDisponibles = obtenerProvinciasDisponibles;
    window.obtenerRegiones = obtenerRegiones;
    window.validarCiudad = validarCiudad;
}
