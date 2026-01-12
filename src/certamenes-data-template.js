/**
 * VYT MUSIC - Estructura de Datos para Certámenes
 * 
 * IMPORTANTE: Este archivo contiene la estructura y ejemplos comentados.
 * Para subir certámenes reales, edita los datos aquí o usa el panel administrativo.
 * 
 * Versión: 2026-01-12
 */

// ============================================
// ESTRUCTURA DE UN CERTAMEN
// ============================================
/*
{
  id: "certamen_santa_fe_2026",           // ID único generado automáticamente
  nombre: "Certamen Provincial Santa Fe",  // Nombre del certamen
  descripcion: "Certamen de canto para toda la provincia de Santa Fe",
  tipo: "provincial",                      // "local", "provincial", "nacional"
  provincia: "Santa Fe",                   // Provincia específica
  ciudad: null,                            // Ciudad (solo para certámenes locales)
  
  // Fechas importantes
  fecha_inicio: new Date("2026-02-01"),   // Fecha de inicio del certamen
  fecha_fin: new Date("2026-03-15"),      // Fecha de cierre
  fecha_inscripcion_cierre: new Date("2026-01-25"),  // Último día para inscribirse
  
  // Configuración
  precio_inscripcion: 5000,                // Precio en pesos argentinos
  max_participantes: 100,                  // Límite de participantes (null = sin límite)
  categorias: [                            // Categorías habilitadas
    "Solista Masculino",
    "Solista Femenino",
    "Dúo",
    "Grupo"
  ],
  generos_permitidos: [                    // Géneros musicales permitidos
    "Pop",
    "Rock",
    "Folklórico",
    "Tango",
    "Cumbia",
    "Otro"
  ],
  
  // Estado y configuración
  estado: "activo",                        // "activo", "inactivo", "finalizado", "proximo"
  activo: true,                            // Booleano para filtros rápidos
  destacado: false,                        // Si aparece en la sección destacados
  
  // Votación
  votacion_habilitada: true,               // Si se puede votar
  tipo_votacion: "vyt_money",              // "vyt_money", "gratis", "mixto"
  costo_voto_vyt_money: 10,                // Cuánto cuesta 1 voto en VYT Money
  
  // Premios (array de objetos)
  premios: [
    {
      puesto: 1,
      descripcion: "Premio Principal",
      monto: 50000,                         // Monto en pesos
      adicional: "Grabación profesional"
    },
    {
      puesto: 2,
      descripcion: "Segundo Puesto",
      monto: 25000,
      adicional: "Sesión fotográfica"
    },
    {
      puesto: 3,
      descripcion: "Tercer Puesto",
      monto: 15000,
      adicional: null
    }
  ],
  
  // Multimedia
  imagen_url: "https://ejemplo.com/certamen-santa-fe.jpg",  // URL de la imagen
  video_promocional: null,                 // URL del video promocional (opcional)
  
  // Contador de participantes (se calcula automáticamente)
  participantes_count: 0,
  
  // Reglas específicas (opcional)
  reglas_especiales: [
    "El video debe ser grabación en vivo",
    "No se permiten autotunes o efectos de voz",
    "Duración máxima: 5 minutos"
  ],
  
  // Sponsors (opcional)
  sponsors: [
    {
      nombre: "Empresa Sponsor",
      logo_url: "https://ejemplo.com/logo.png"
    }
  ],
  
  // Metadata
  createdAt: new Date(),                   // Fecha de creación (automático)
  updatedAt: new Date(),                   // Última actualización (automático)
  createdBy: "admin_uid"                   // UID del admin que lo creó
}
*/

// ============================================
// ESTRUCTURA DE UN PARTICIPANTE
// ============================================
/*
{
  id: "participante_xyz123",               // ID único generado automáticamente
  
  // Datos personales
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@ejemplo.com",
  telefono: "+54 9 341 XXX-XXXX",
  fecha_nacimiento: new Date("1995-05-15"),
  dni: "12345678",
  
  // Datos artísticos
  nombre_artistico: "JuanP Music",
  provincia: "Santa Fe",
  ciudad: "Rosario",
  categoria: "Solista Masculino",
  generos: ["Pop", "Rock"],                // Array de géneros
  experiencia_previa: "Participé en varios festivales locales...",
  
  // Video de presentación
  video_link: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  titulo_cancion: "Mi Canción Original",
  autor_cancion: "Original",               // "Original", "Cover", "Tradicional"
  
  // Relación con certamen
  certamen_id: "certamen_santa_fe_2026",
  certamen_nombre: "Certamen Provincial Santa Fe",
  
  // Estado de pago
  pago_completado: true,                   // Si completó el pago de inscripción
  pago_id: "mp_payment_123456",            // ID de MercadoPago
  monto_pagado: 5000,
  fecha_pago: new Date(),
  
  // Votación y estadísticas
  votos_totales: 0,                        // Total de votos recibidos
  votos_gratis: 0,                         // Votos gratis (si aplica)
  votos_vyt_money: 0,                      // Votos con VYT Money
  reproducciones_youtube: 0,               // Views del video (actualizado periódicamente)
  
  // Estado
  estado: "activo",                        // "activo", "descalificado", "retirado"
  aprobado_por_admin: true,                // Si el admin aprobó la inscripción
  
  // Multimedia adicional
  foto_perfil_url: null,                   // URL de foto de perfil (opcional)
  redes_sociales: {
    instagram: "@juanpmusic",
    facebook: null,
    tiktok: null
  },
  
  // Metadata
  createdAt: new Date(),
  updatedAt: new Date(),
  uid: "firebase_auth_uid"                 // UID del usuario en Firebase Auth
}
*/

// ============================================
// ESTRUCTURA DE VOTACIÓN
// ============================================
/*
{
  id: "voto_xyz",                          // ID único generado automáticamente
  
  participante_id: "participante_xyz123",
  certamen_id: "certamen_santa_fe_2026",
  
  // Votante
  votante_uid: "firebase_user_uid",        // UID del usuario que vota
  votante_email: "votante@ejemplo.com",
  
  // Detalles del voto
  cantidad_votos: 5,                       // Cuántos votos dio en esta transacción
  tipo_voto: "vyt_money",                  // "vyt_money", "gratis"
  vyt_money_gastado: 50,                   // Cuánto VYT Money gastó
  
  // Metadata
  timestamp: new Date(),                   // Fecha y hora del voto
  ip_address: "192.168.1.1",               // IP del votante (opcional, para prevenir fraude)
  
  // Validación
  validado: true,                          // Si el voto fue validado (anti-fraude)
  motivo_invalidacion: null                // Si fue invalidado, el motivo
}
*/

// ============================================
// EJEMPLOS DE CERTÁMENES REALES
// ============================================

/**
 * IMPORTANTE: Estos son ejemplos de estructura.
 * Para agregar certámenes reales:
 * 
 * OPCIÓN 1: Usar el Panel Administrativo (admin.html)
 * OPCIÓN 2: Usar Firebase Console directamente
 * OPCIÓN 3: Usar el script init-database.js
 */

const ejemploCertamenes = [
  // ===== CERTAMEN NACIONAL =====
  {
    nombre: "Certamen Nacional VYT MUSIC 2026",
    descripcion: "El certamen más importante de canto de toda Argentina. Los mejores artistas de cada provincia compiten por el premio mayor.",
    tipo: "nacional",
    provincia: null,  // Nacional no tiene provincia específica
    ciudad: null,
    fecha_inicio: new Date("2026-03-01"),
    fecha_fin: new Date("2026-05-31"),
    fecha_inscripcion_cierre: new Date("2026-02-20"),
    precio_inscripcion: 8000,
    max_participantes: 300,
    categorias: ["Solista Masculino", "Solista Femenino", "Dúo", "Grupo"],
    generos_permitidos: ["Pop", "Rock", "Folklórico", "Tango", "Cumbia", "Balada", "Otro"],
    estado: "proximo",
    activo: false,
    destacado: true,
    votacion_habilitada: false,
    tipo_votacion: "vyt_money",
    costo_voto_vyt_money: 10,
    premios: [
      { puesto: 1, descripcion: "Primer Premio Nacional", monto: 200000, adicional: "Contrato discográfico + Gira nacional" },
      { puesto: 2, descripcion: "Segundo Premio Nacional", monto: 100000, adicional: "Grabación profesional EP" },
      { puesto: 3, descripcion: "Tercer Premio Nacional", monto: 50000, adicional: "Videoclip profesional" }
    ],
    imagen_url: null,
    participantes_count: 0,
    reglas_especiales: [
      "Solo pueden participar los ganadores de certámenes provinciales",
      "Video en alta definición (1080p mínimo)",
      "Presentación original obligatoria"
    ]
  },

  // ===== CERTAMEN PROVINCIAL EJEMPLO =====
  {
    nombre: "Certamen Provincial Santa Fe 2026",
    descripcion: "Certamen de canto para todos los artistas de la provincia de Santa Fe. El ganador clasifica al Nacional.",
    tipo: "provincial",
    provincia: "Santa Fe",
    ciudad: null,
    fecha_inicio: new Date("2026-02-01"),
    fecha_fin: new Date("2026-03-15"),
    fecha_inscripcion_cierre: new Date("2026-01-25"),
    precio_inscripcion: 5000,
    max_participantes: 100,
    categorias: ["Solista Masculino", "Solista Femenino", "Dúo"],
    generos_permitidos: ["Pop", "Rock", "Folklórico", "Cumbia", "Otro"],
    estado: "proximo",
    activo: false,
    destacado: false,
    votacion_habilitada: false,
    tipo_votacion: "vyt_money",
    costo_voto_vyt_money: 10,
    premios: [
      { puesto: 1, descripcion: "Ganador Provincial", monto: 50000, adicional: "Clasificación al Nacional + Entrevista Radio" },
      { puesto: 2, descripcion: "Segundo Puesto", monto: 25000, adicional: "Sesión fotográfica profesional" },
      { puesto: 3, descripcion: "Tercer Puesto", monto: 15000, adicional: null }
    ],
    imagen_url: null,
    participantes_count: 0
  },

  // ===== CERTAMEN LOCAL EJEMPLO =====
  {
    nombre: "Certamen Local Rosario 2026",
    descripcion: "Certamen exclusivo para artistas de la ciudad de Rosario y alrededores.",
    tipo: "local",
    provincia: "Santa Fe",
    ciudad: "Rosario",
    fecha_inicio: new Date("2026-01-15"),
    fecha_fin: new Date("2026-02-10"),
    fecha_inscripcion_cierre: new Date("2026-01-10"),
    precio_inscripcion: 3000,
    max_participantes: 50,
    categorias: ["Solista Masculino", "Solista Femenino"],
    generos_permitidos: ["Pop", "Rock", "Tango", "Folklórico", "Otro"],
    estado: "proximo",
    activo: false,
    destacado: false,
    votacion_habilitada: false,
    tipo_votacion: "vyt_money",
    costo_voto_vyt_money: 5,  // Más barato para certámenes locales
    premios: [
      { puesto: 1, descripcion: "Ganador Local", monto: 20000, adicional: "Show en vivo en Festival de Rosario" },
      { puesto: 2, descripcion: "Segundo Puesto", monto: 10000, adicional: null },
      { puesto: 3, descripcion: "Tercer Puesto", monto: 5000, adicional: null }
    ],
    imagen_url: null,
    participantes_count: 0
  }
];

// ============================================
// FUNCIONES AUXILIARES PARA ADMINS
// ============================================

/**
 * Valida que un objeto certamen tenga todos los campos requeridos
 */
function validarCertamen(certamen) {
  const camposRequeridos = [
    'nombre', 'descripcion', 'tipo', 'fecha_inicio', 'fecha_fin',
    'fecha_inscripcion_cierre', 'precio_inscripcion', 'categorias',
    'generos_permitidos', 'estado'
  ];
  
  const camposFaltantes = camposRequeridos.filter(campo => !certamen[campo]);
  
  if (camposFaltantes.length > 0) {
    console.error('Campos faltantes:', camposFaltantes);
    return false;
  }
  
  // Validar fechas
  if (certamen.fecha_inscripcion_cierre >= certamen.fecha_inicio) {
    console.error('La fecha de cierre de inscripción debe ser anterior a la fecha de inicio');
    return false;
  }
  
  if (certamen.fecha_inicio >= certamen.fecha_fin) {
    console.error('La fecha de inicio debe ser anterior a la fecha de fin');
    return false;
  }
  
  // Validar tipo
  if (!['local', 'provincial', 'nacional'].includes(certamen.tipo)) {
    console.error('Tipo de certamen inválido. Debe ser: local, provincial o nacional');
    return false;
  }
  
  return true;
}

/**
 * Calcula el estado automático de un certamen basado en las fechas
 */
function calcularEstadoCertamen(certamen) {
  const ahora = new Date();
  const fechaInicio = new Date(certamen.fecha_inicio);
  const fechaFin = new Date(certamen.fecha_fin);
  const fechaCierre = new Date(certamen.fecha_inscripcion_cierre);
  
  if (ahora < fechaCierre) {
    return 'inscripcion_abierta';
  } else if (ahora >= fechaCierre && ahora < fechaInicio) {
    return 'inscripcion_cerrada';
  } else if (ahora >= fechaInicio && ahora <= fechaFin) {
    return 'activo';
  } else {
    return 'finalizado';
  }
}

// ============================================
// EXPORTAR PARA USO EN OTROS MÓDULOS
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ejemploCertamenes,
    validarCertamen,
    calcularEstadoCertamen
  };
}

// ============================================
// INSTRUCCIONES PARA EL ADMINISTRADOR
// ============================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║  VYT MUSIC - Guía de Gestión de Certámenes                ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📋 PARA CREAR CERTÁMENES REALES:                          ║
║                                                            ║
║  1. Acceder al Panel Administrativo (admin.html)          ║
║     - Login con cuenta de administrador                   ║
║     - Ir a sección "Certámenes"                           ║
║     - Click en "Crear Nuevo Certamen"                     ║
║                                                            ║
║  2. Usar Firebase Console                                 ║
║     - Acceder a Firestore Database                        ║
║     - Colección: certamenes_provinciales                  ║
║     - Agregar documento con estructura de este archivo    ║
║                                                            ║
║  3. Ejecutar script de inicialización                     ║
║     - node init-database.js                               ║
║     - Modificar los datos de ejemplo en el script         ║
║                                                            ║
║  ⚠️  IMPORTANTE:                                           ║
║  - NO dejar certámenes con estado="activo" sin fecha      ║
║  - Verificar precios en pesos argentinos actualizados     ║
║  - Configurar premios y sponsors antes de publicar        ║
║  - Subir imágenes de buena calidad (recomendado 1200x600)║
║                                                            ║
║  📊 Colecciones Firestore:                                 ║
║  - certamenes_provinciales (datos de certámenes)          ║
║  - participantes_online (inscripciones)                   ║
║  - votos (votaciones)                                     ║
║  - user_vyt_money (saldo de usuarios)                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
