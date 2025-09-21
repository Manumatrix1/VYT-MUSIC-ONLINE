# 🏆 SISTEMA DE CERTÁMENES JERÁRQUICOS VYT-MUSIC
## Estructura de Rankings Múltiples y Pozos Distribuidos

### 🎯 **CONCEPTO GENERAL**

**Estructura Jerárquica:**
```
🇦🇷 NACIONAL
├── 🏛️ PROVINCIAL (Santa Fe, Córdoba, Buenos Aires, etc.)
│   ├── 🌍 REGIONAL (Norte, Centro, Sur)
│   │   ├── 🎵 CATEGORÍAS
│   │   │   ├── 🎸 Bandas
│   │   │   ├── 🎤 Solistas
│   │   │   ├── 💃 Cumbia
│   │   │   ├── 🎼 Folk
│   │   │   └── 🎊 Otros géneros
```

---

## 🏗️ **ESTRUCTURA DE BASE DE DATOS**

### **1. Certámenes Jerárquicos**

```javascript
// certamenes_estructura/
{
  id: "santa_fe_2024",
  nombre: "Certamen Santa Fe 2024",
  tipo: "provincial", // nacional | provincial | regional
  provincia: "Santa Fe",
  region: null, // para provinciales es null
  parent_certamen_id: "nacional_2024", // certamen padre
  children_certamen_ids: ["santa_fe_norte_2024", "santa_fe_centro_2024", "santa_fe_sur_2024"],
  
  // Configuración de categorías
  categorias_habilitadas: [
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
    top_clasificados: 20, // Top 20 van al jurado
    votos_minimos: 50,    // Mínimo votos para clasificar
    fecha_inicio_votacion: "2024-01-01",
    fecha_fin_votacion: "2024-12-31",
    fase_actual: "votacion_publica" // votacion_publica | evaluacion_jurado | finalizado
  },
  
  // Configuración de pozo
  pozo_config: {
    porcentaje_inscripciones: 0.3,  // 30% de inscripciones
    porcentaje_vyt_money: 0.1,      // 10% de VYT-MONEY
    distribucion_premios: [
      { posicion: 1, porcentaje: 0.5 },  // 50% para el 1er lugar
      { posicion: 2, porcentaje: 0.3 },  // 30% para el 2do lugar
      { posicion: 3, porcentaje: 0.2 }   // 20% para el 3er lugar
    ]
  },
  
  precio_inscripcion: 15000,
  activo: true,
  fecha_creacion: "2024-01-01",
  created_by: "admin_user_id"
}
```

### **2. Rankings Dinámicos**

```javascript
// rankings/
{
  id: "santa_fe_norte_bandas_2024",
  certamen_id: "santa_fe_norte_2024",
  categoria_id: "bandas",
  tipo_ranking: "publico", // publico | jurado | final
  
  participantes: [
    {
      participante_id: "participante_123",
      nombre_artista: "Los Rockeros del Norte",
      votos_publicos: 1250,
      puntuacion_jurado: null, // se llena en fase de jurado
      puntuacion_final: 1250,  // combinación de ambos
      posicion_actual: 1,
      clasificado_siguiente_fase: true,
      datos_participante: {
        provincia: "Santa Fe",
        region: "Norte",
        categoria: "bandas",
        video_principal: "youtube_id",
        foto_perfil: "url",
        descripcion: "Banda de rock del norte santafesino"
      }
    }
  ],
  
  estadisticas: {
    total_participantes: 45,
    total_votos: 15670,
    ultimo_update: "2024-09-17T10:30:00Z"
  },
  
  configuracion: {
    votos_por_vyt_money: 1,  // 1 VYT-MONEY = 1 voto
    maximo_votos_por_usuario: 10,
    peso_votos_publicos: 0.7,    // 70% votos públicos
    peso_votos_jurado: 0.3       // 30% votos jurado
  }
}
```

### **3. Sistema de Pozos Distribuidos**

```javascript
// pozos_certamenes/
{
  id: "pozo_santa_fe_2024",
  certamen_id: "santa_fe_2024",
  
  ingresos: {
    inscripciones: {
      total_recaudado: 450000,  // $450,000 de inscripciones
      porcentaje_al_pozo: 0.3,  // 30%
      monto_al_pozo: 135000
    },
    vyt_money: {
      total_gastado: 120000,   // $120,000 en VYT-MONEY
      porcentaje_al_pozo: 0.1, // 10%
      monto_al_pozo: 12000
    },
    patrocinios: {
      monto_patrocinios: 200000, // Patrocinadores externos
      monto_al_pozo: 200000
    }
  },
  
  pozo_total: 347000, // Suma de todos los aportes
  
  distribucion_por_categoria: {
    bandas: {
      participantes: 25,
      porcentaje_pozo: 0.4,  // 40% del pozo
      monto_categoria: 138800,
      distribucion_premios: [
        { posicion: 1, monto: 69400 },   // 50%
        { posicion: 2, monto: 41640 },   // 30%
        { posicion: 3, monto: 27760 }    // 20%
      ]
    },
    solistas: {
      participantes: 20,
      porcentaje_pozo: 0.35, // 35% del pozo
      monto_categoria: 121450,
      distribucion_premios: [
        { posicion: 1, monto: 60725 },
        { posicion: 2, monto: 36435 },
        { posicion: 3, monto: 24290 }
      ]
    },
    cumbia: {
      participantes: 15,
      porcentaje_pozo: 0.25, // 25% del pozo
      monto_categoria: 86750,
      distribucion_premios: [
        { posicion: 1, monto: 43375 },
        { posicion: 2, monto: 26025 },
        { posicion: 3, monto: 17350 }
      ]
    }
  },
  
  estado: "activo", // activo | distribuido | finalizado
  fecha_actualizacion: "2024-09-17T10:30:00Z"
}
```

### **4. Sistema de Jurado**

```javascript
// evaluaciones_jurado/
{
  id: "evaluacion_santa_fe_norte_bandas",
  certamen_id: "santa_fe_norte_2024",
  categoria_id: "bandas",
  fase: "evaluacion_top_20",
  
  participantes_evaluados: [
    {
      participante_id: "participante_123",
      votos_publicos: 1250,
      posicion_ranking_publico: 1,
      
      evaluaciones_jurado: [
        {
          jurado_id: "jurado_001",
          nombre_jurado: "Carlos Músico",
          criterios: {
            calidad_musical: 9,    // 1-10
            originalidad: 8,       // 1-10
            performance: 9,        // 1-10
            produccion: 7          // 1-10
          },
          puntuacion_total: 33,    // Suma de criterios
          comentarios: "Excelente propuesta musical, gran técnica"
        },
        {
          jurado_id: "jurado_002",
          nombre_jurado: "Ana Productora",
          criterios: {
            calidad_musical: 8,
            originalidad: 9,
            performance: 8,
            produccion: 9
          },
          puntuacion_total: 34,
          comentarios: "Muy original, buena producción"
        }
      ],
      
      promedio_jurado: 33.5,
      puntuacion_final: 1283.5, // Combinación ponderada
      posicion_final: 1,
      clasificado: true
    }
  ],
  
  configuracion_jurado: {
    numero_jurados: 5,
    puntuacion_maxima: 40, // 4 criterios x 10 puntos
    peso_en_puntuacion_final: 0.3,
    fecha_inicio_evaluacion: "2024-11-01",
    fecha_fin_evaluacion: "2024-11-15"
  }
}
```

---

## 🎯 **FLUJO DE FUNCIONAMIENTO**

### **Fase 1: Inscripción y Votación Pública**
1. Artistas se inscriben en su zona y categoría
2. El público vota con VYT-MONEY
3. Se genera ranking en tiempo real
4. Se acumula pozo según configuración

### **Fase 2: Clasificación al Jurado**
1. Top 20 de cada categoría/zona pasan al jurado
2. Jurados evalúan según criterios establecidos
3. Se combina votación pública + jurado
4. Se define ranking final

### **Fase 3: Clasificación Jerárquica**
1. Ganadores regionales compiten a nivel provincial
2. Ganadores provinciales compiten a nivel nacional
3. En cada nivel se mantiene la división por categorías

### **Fase 4: Distribución de Premios**
1. Pozos se distribuyen según configuración
2. Premios por categoría y nivel
3. Transparencia total en la distribución

---

## 🔧 **CONFIGURACIONES FLEXIBLES**

### **Por Certamen:**
- Categorías habilitadas
- Número de clasificados al jurado
- Porcentaje de pozo por fuente
- Distribución de premios
- Fechas de cada fase

### **Por Categoría:**
- Porcentaje del pozo total
- Criterios de evaluación específicos
- Número de premios
- Requisitos especiales

### **Por Nivel Jerárquico:**
- Número de clasificados al siguiente nivel
- Peso de votos públicos vs jurado
- Distribución geográfica

---

## 📊 **BENEFICIOS DEL SISTEMA**

✅ **Justicia Geográfica:** Cada zona tiene su oportunidad
✅ **Justicia por Género:** Cada estilo musical compite en su categoría
✅ **Transparencia:** Rankings y pozos públicos en tiempo real
✅ **Escalabilidad:** Fácil agregar nuevas zonas/categorías
✅ **Engagement:** Votación continua mantiene interés
✅ **Profesionalismo:** Evaluación por jurados expertos
✅ **Incentivo Económico:** Pozos atractivos por nivel

---

Este sistema permite que un artista de cumbia del norte de Santa Fe compita justamente:
1. Primero contra otros de cumbia del norte
2. Luego contra ganadores de cumbia de centro y sur de Santa Fe
3. Finalmente contra ganadores de cumbia de otras provincias
4. Siempre manteniendo la posibilidad de seguir sumando votos públicos

¿Te parece bien esta estructura? ¿Qué ajustes te gustaría hacer antes de implementarla?