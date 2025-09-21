// Sistema Jerárquico VYT Music - Integración completa con Firebase
// Este archivo extiende admin.js con el sistema jerárquico

import { auth, db, storage, functions } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc, getDoc, onSnapshot, setDoc, addDoc, deleteDoc, query, orderBy, where, serverTimestamp, writeBatch, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

class SistemaJerarquico {
    constructor() {
        this.initialized = false;
        this.certamenes = new Map();
        this.participantes = new Map();
        this.duelos = new Map();
        this.vytMoney = {
            circulation: 0,
            conversionRate: 30,
            users: 0
        };
    }

    async init() {
        if (this.initialized) return;
        
        try {
            console.log('🚀 Inicializando Sistema Jerárquico VYT Music...');
            
            // Cargar datos iniciales
            await this.loadCertamenesJerarquicos();
            await this.loadParticipantes();
            await this.loadDuelos();
            await this.loadVYTMoney();
            
            this.setupRealTimeListeners();
            this.initialized = true;
            
            console.log('✅ Sistema Jerárquico inicializado correctamente');
            this.updateDashboardStats();
            
        } catch (error) {
            console.error('❌ Error inicializando sistema jerárquico:', error);
        }
    }

    // === GESTIÓN DE CERTÁMENES JERÁRQUICOS ===
    async loadCertamenesJerarquicos() {
        try {
            const snapshot = await getDocs(collection(db, 'certamenes_estructura'));
            this.certamenes.clear();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.certamenes.set(doc.id, {
                    id: doc.id,
                    ...data,
                    timestamp: data.fecha_creacion || new Date()
                });
            });
            
            console.log(`📋 Cargados ${this.certamenes.size} certámenes jerárquicos`);
            this.renderCertamenesList();
            
        } catch (error) {
            console.error('❌ Error cargando certámenes:', error);
            // Cargar datos mock si no hay conexión
            this.loadMockCertamenes();
        }
    }

    async createCertamenJerarquico(data) {
        try {
            const certamenId = `${data.provincia || 'nacional'}_${data.tipo}_${new Date().getFullYear()}`;
            
            const certamenData = {
                id: certamenId,
                nombre: data.nombre,
                tipo: data.tipo, // nacional | provincial | regional
                provincia: data.provincia || null,
                region: data.region || null,
                parent_certamen_id: data.parentId || null,
                children_certamen_ids: [],
                
                // Configuración de categorías por defecto
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
                    top_clasificados: 20,
                    votos_minimos: 50,
                    fecha_inicio_votacion: new Date().toISOString().split('T')[0],
                    fecha_fin_votacion: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                    fase_actual: "votacion_publica"
                },
                
                // Configuración de pozo
                pozo_config: {
                    monto_inicial: parseInt(data.pozo) || 100000,
                    porcentaje_inscripciones: 0.3,
                    porcentaje_vyt_money: 0.1,
                    distribucion_premios: [
                        { posicion: 1, porcentaje: 0.5 },
                        { posicion: 2, porcentaje: 0.3 },
                        { posicion: 3, porcentaje: 0.2 }
                    ]
                },
                
                precio_inscripcion: parseInt(data.precio) || 15000,
                activo: true,
                fecha_creacion: serverTimestamp(),
                created_by: auth.currentUser?.uid || 'admin',
                
                // Estadísticas
                stats: {
                    participantes_inscritos: 0,
                    votos_totales: 0,
                    ingresos_totales: 0,
                    pozo_actual: parseInt(data.pozo) || 100000
                }
            };

            await setDoc(doc(db, 'certamenes_estructura', certamenId), certamenData);
            
            // Actualizar cache local
            this.certamenes.set(certamenId, certamenData);
            
            console.log(`✅ Certamen ${data.tipo} "${data.nombre}" creado exitosamente`);
            this.renderCertamenesList();
            this.updateDashboardStats();
            
            return certamenId;
            
        } catch (error) {
            console.error('❌ Error creando certamen:', error);
            throw error;
        }
    }

    // === GESTIÓN DE PARTICIPANTES ===
    async loadParticipantes() {
        try {
            const snapshot = await getDocs(collection(db, 'participantes'));
            this.participantes.clear();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.participantes.set(doc.id, {
                    id: doc.id,
                    ...data
                });
            });
            
            console.log(`👥 Cargados ${this.participantes.size} participantes`);
            this.renderParticipantesList();
            
        } catch (error) {
            console.error('❌ Error cargando participantes:', error);
            this.loadMockParticipantes();
        }
    }

    async aprobarParticipante(participanteId) {
        try {
            await updateDoc(doc(db, 'participantes', participanteId), {
                estado: 'aprobado',
                fecha_aprobacion: serverTimestamp(),
                aprobado_por: auth.currentUser?.uid || 'admin'
            });
            
            console.log(`✅ Participante ${participanteId} aprobado`);
            this.loadParticipantes();
            
        } catch (error) {
            console.error('❌ Error aprobando participante:', error);
        }
    }

    // === GESTIÓN DE DUELOS ===
    async loadDuelos() {
        try {
            const snapshot = await getDocs(collection(db, 'duelos'));
            this.duelos.clear();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.duelos.set(doc.id, {
                    id: doc.id,
                    ...data
                });
            });
            
            console.log(`⚔️ Cargados ${this.duelos.size} duelos`);
            this.renderDuelosList();
            
        } catch (error) {
            console.error('❌ Error cargando duelos:', error);
            this.loadMockDuelos();
        }
    }

    async createDuelo(data) {
        try {
            const dueloId = `duelo_${Date.now()}`;
            
            const dueloData = {
                id: dueloId,
                participante1_id: data.participante1,
                participante2_id: data.participante2,
                fecha_inicio: new Date(data.fechaInicio),
                duracion_horas: parseInt(data.duracion),
                fecha_fin: new Date(new Date(data.fechaInicio).getTime() + parseInt(data.duracion) * 60 * 60 * 1000),
                
                estado: 'programado', // programado | activo | finalizado | cancelado
                
                votos: {
                    participante1: 0,
                    participante2: 0,
                    total: 0
                },
                
                configuracion: {
                    votos_maximos_por_usuario: 1,
                    permitir_cambio_voto: false,
                    recompensa_vyt_por_voto: 10
                },
                
                fecha_creacion: serverTimestamp(),
                creado_por: auth.currentUser?.uid || 'admin'
            };

            await setDoc(doc(db, 'duelos', dueloId), dueloData);
            
            this.duelos.set(dueloId, dueloData);
            
            console.log(`✅ Duelo "${dueloId}" creado exitosamente`);
            this.renderDuelosList();
            
            return dueloId;
            
        } catch (error) {
            console.error('❌ Error creando duelo:', error);
            throw error;
        }
    }

    // === GESTIÓN VYT MONEY ===
    async loadVYTMoney() {
        try {
            const docRef = doc(db, 'sistema_config', 'vyt_money');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                this.vytMoney = docSnap.data();
            } else {
                // Crear configuración inicial
                this.vytMoney = {
                    circulation: 2450000,
                    conversionRate: 30,
                    users: 1247,
                    totalGenerated: 2450000,
                    totalSpent: 0,
                    rewardRates: {
                        vote: 10,
                        share: 25,
                        participate: 100
                    }
                };
                
                await setDoc(docRef, this.vytMoney);
            }
            
            console.log('💰 Configuración VYT Money cargada');
            this.updateVYTMoneyDisplay();
            
        } catch (error) {
            console.error('❌ Error cargando VYT Money:', error);
        }
    }

    async updateConversionRate(newRate) {
        try {
            this.vytMoney.conversionRate = parseFloat(newRate);
            
            await updateDoc(doc(db, 'sistema_config', 'vyt_money'), {
                conversionRate: this.vytMoney.conversionRate,
                lastUpdated: serverTimestamp()
            });
            
            console.log(`💱 Tasa de conversión actualizada: ${newRate} ARS por VYT`);
            this.updateVYTMoneyDisplay();
            
        } catch (error) {
            console.error('❌ Error actualizando tasa:', error);
        }
    }

    // === LISTENERS EN TIEMPO REAL ===
    setupRealTimeListeners() {
        // Listener para certámenes
        onSnapshot(collection(db, 'certamenes_estructura'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    this.certamenes.set(change.doc.id, {
                        id: change.doc.id,
                        ...change.doc.data()
                    });
                }
                if (change.type === 'removed') {
                    this.certamenes.delete(change.doc.id);
                }
            });
            
            this.renderCertamenesList();
            this.updateDashboardStats();
        });

        // Listener para participantes
        onSnapshot(collection(db, 'participantes'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    this.participantes.set(change.doc.id, {
                        id: change.doc.id,
                        ...change.doc.data()
                    });
                }
                if (change.type === 'removed') {
                    this.participantes.delete(change.doc.id);
                }
            });
            
            this.renderParticipantesList();
        });

        console.log('👂 Listeners en tiempo real configurados');
    }

    // === RENDERIZADO ===
    renderCertamenesList() {
        const container = document.getElementById('certamenes-list');
        if (!container) return;
        
        if (this.certamenes.size === 0) {
            container.innerHTML = '<p class="text-gray-500">No hay certámenes creados aún.</p>';
            return;
        }
        
        const html = Array.from(this.certamenes.values())
            .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
            .map(certamen => this.renderCertamenCard(certamen))
            .join('');
            
        container.innerHTML = html;
    }

    renderCertamenCard(certamen) {
        const tipoBadge = {
            'nacional': '🇦🇷 Nacional',
            'provincial': '🏛️ Provincial', 
            'regional': '🌍 Regional'
        }[certamen.tipo] || certamen.tipo;
        
        const colorClass = {
            'nacional': 'bg-blue-50 border-blue-200',
            'provincial': 'bg-green-50 border-green-200',
            'regional': 'bg-yellow-50 border-yellow-200'
        }[certamen.tipo] || 'bg-gray-50 border-gray-200';
        
        return `
            <div class="flex justify-between items-center p-4 ${colorClass} rounded-lg border">
                <div>
                    <h3 class="font-semibold text-gray-900">${tipoBadge} ${certamen.nombre}</h3>
                    <p class="text-sm text-gray-600">
                        Pozo: $${(certamen.stats?.pozo_actual || certamen.pozo_config?.monto_inicial || 0).toLocaleString()} • 
                        ${certamen.stats?.participantes_inscritos || 0} participantes
                    </p>
                    ${certamen.provincia ? `<p class="text-xs text-gray-500">📍 ${certamen.provincia}</p>` : ''}
                </div>
                <div class="space-x-2">
                    <button class="btn-secondary text-sm" onclick="sistemaJerarquico.editCertamen('${certamen.id}')">
                        ✏️ Editar
                    </button>
                    <button class="btn-primary text-sm" onclick="sistemaJerarquico.viewCertamen('${certamen.id}')">
                        👁️ Ver
                    </button>
                </div>
            </div>
        `;
    }

    renderParticipantesList() {
        const pendientes = document.getElementById('inscripciones-pendientes');
        const aprobados = document.getElementById('participantes-aprobados');
        
        if (!pendientes || !aprobados) return;
        
        const participantesPendientes = Array.from(this.participantes.values())
            .filter(p => p.estado === 'pendiente');
            
        const participantesAprobados = Array.from(this.participantes.values())
            .filter(p => p.estado === 'aprobado');
        
        // Pendientes
        if (participantesPendientes.length === 0) {
            pendientes.innerHTML = '<p class="text-gray-500">No hay inscripciones pendientes.</p>';
        } else {
            pendientes.innerHTML = participantesPendientes
                .map(p => this.renderParticipantePendiente(p))
                .join('');
        }
        
        // Aprobados
        if (participantesAprobados.length === 0) {
            aprobados.innerHTML = '<p class="text-gray-500">No hay participantes aprobados.</p>';
        } else {
            aprobados.innerHTML = participantesAprobados
                .map(p => this.renderParticipanteAprobado(p))
                .join('');
        }
    }

    renderParticipantePendiente(participante) {
        return `
            <div class="p-3 bg-yellow-50 rounded border border-yellow-200">
                <div class="font-medium">${participante.nombre}</div>
                <div class="text-sm text-gray-600">
                    Categoría: ${participante.categoria} • ${participante.provincia || 'Sin provincia'}
                </div>
                <div class="mt-2 space-x-2">
                    <button class="btn-primary text-xs" onclick="sistemaJerarquico.aprobarParticipante('${participante.id}')">
                        ✅ Aprobar
                    </button>
                    <button class="btn-secondary text-xs" onclick="sistemaJerarquico.rechazarParticipante('${participante.id}')">
                        ❌ Rechazar
                    </button>
                </div>
            </div>
        `;
    }

    renderParticipanteAprobado(participante) {
        return `
            <div class="p-3 bg-green-50 rounded border border-green-200">
                <div class="font-medium">${participante.nombre}</div>
                <div class="text-sm text-gray-600">
                    Categoría: ${participante.categoria} • ${participante.provincia || 'Sin provincia'}
                </div>
                <div class="text-xs text-green-600 mt-1">
                    ✅ Aprobado • ${participante.pago_confirmado ? 'Pago confirmado' : 'Pendiente pago'}
                </div>
            </div>
        `;
    }

    renderDuelosList() {
        const container = document.getElementById('duelos-activos');
        if (!container) return;
        
        const duelosActivos = Array.from(this.duelos.values())
            .filter(d => d.estado === 'activo' || d.estado === 'programado');
            
        if (duelosActivos.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No hay duelos activos.</p>';
            return;
        }
        
        container.innerHTML = duelosActivos
            .map(duelo => this.renderDueloCard(duelo))
            .join('');
    }

    renderDueloCard(duelo) {
        const totalVotos = duelo.votos.total || 0;
        const votos1 = duelo.votos.participante1 || 0;
        const votos2 = duelo.votos.participante2 || 0;
        
        const porcentaje1 = totalVotos > 0 ? Math.round((votos1 / totalVotos) * 100) : 50;
        const porcentaje2 = totalVotos > 0 ? Math.round((votos2 / totalVotos) * 100) : 50;
        
        const estadoBadge = duelo.estado === 'activo' ? 
            '<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">🔴 En Vivo</span>' :
            '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">⏰ Programado</span>';
        
        return `
            <div class="p-4 border border-gray-200 rounded-lg">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-semibold">${this.getParticipanteName(duelo.participante1_id)} vs ${this.getParticipanteName(duelo.participante2_id)}</h3>
                    ${estadoBadge}
                </div>
                <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="text-center">
                        <div class="font-medium text-blue-600">${this.getParticipanteName(duelo.participante1_id)}</div>
                        <div class="text-xl font-bold">${votos1.toLocaleString()} votos</div>
                        <div class="bg-blue-200 h-2 rounded-full">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${porcentaje1}%"></div>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="font-medium text-red-600">${this.getParticipanteName(duelo.participante2_id)}</div>
                        <div class="text-xl font-bold">${votos2.toLocaleString()} votos</div>
                        <div class="bg-red-200 h-2 rounded-full">
                            <div class="bg-red-600 h-2 rounded-full" style="width: ${porcentaje2}%"></div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-center text-sm text-gray-600">
                    <span>⏰ ${this.getTimeRemaining(duelo)}</span>
                    <div class="space-x-2">
                        <button class="btn-secondary text-xs" onclick="sistemaJerarquico.pausarDuelo('${duelo.id}')">
                            ⏸️ Pausar
                        </button>
                        <button class="btn-primary text-xs" onclick="sistemaJerarquico.viewDuelo('${duelo.id}')">
                            👁️ Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // === UTILIDADES ===
    getParticipanteName(id) {
        const participante = this.participantes.get(id);
        return participante ? participante.nombre : 'Participante Desconocido';
    }

    getTimeRemaining(duelo) {
        if (duelo.estado === 'programado') {
            const inicio = new Date(duelo.fecha_inicio);
            const ahora = new Date();
            if (inicio > ahora) {
                const diff = inicio - ahora;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                return `Inicia en ${hours} horas`;
            }
        }
        
        const fin = new Date(duelo.fecha_fin);
        const ahora = new Date();
        if (fin > ahora) {
            const diff = fin - ahora;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            return `Termina en ${hours} horas`;
        }
        
        return 'Finalizado';
    }

    updateDashboardStats() {
        // Actualizar estadísticas del dashboard
        const totalPozoNacional = Array.from(this.certamenes.values())
            .filter(c => c.tipo === 'nacional')
            .reduce((sum, c) => sum + (c.stats?.pozo_actual || 0), 0);
            
        const totalProvinciales = Array.from(this.certamenes.values())
            .filter(c => c.tipo === 'provincial').length;
            
        const totalParticipantes = this.participantes.size;
        
        // Actualizar elementos del DOM
        this.updateStatElement('stats-nacional', `$${totalPozoNacional.toLocaleString()}`);
        this.updateStatElement('stats-provincial', totalProvinciales);
        this.updateStatElement('stats-participantes', totalParticipantes.toLocaleString());
        this.updateStatElement('stats-vyt-money', `₩${this.vytMoney.circulation.toLocaleString()}`);
    }

    updateVYTMoneyDisplay() {
        const conversionInput = document.getElementById('conversion-rate');
        if (conversionInput) {
            conversionInput.value = this.vytMoney.conversionRate;
        }
    }

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // === DATOS MOCK PARA DESARROLLO ===
    loadMockCertamenes() {
        console.log('📋 Cargando certámenes mock...');
        
        const mockCertamenes = [
            {
                id: 'nacional_2024',
                nombre: 'Certamen Nacional 2024',
                tipo: 'nacional',
                provincia: null,
                stats: { pozo_actual: 5000000, participantes_inscritos: 1247 },
                fecha_creacion: new Date()
            },
            {
                id: 'santa_fe_2024',
                nombre: 'Certamen Santa Fe 2024',
                tipo: 'provincial',
                provincia: 'Santa Fe',
                stats: { pozo_actual: 100000, participantes_inscritos: 127 },
                fecha_creacion: new Date()
            }
        ];
        
        mockCertamenes.forEach(certamen => {
            this.certamenes.set(certamen.id, certamen);
        });
        
        this.renderCertamenesList();
    }

    loadMockParticipantes() {
        console.log('👥 Cargando participantes mock...');
        
        const mockParticipantes = [
            {
                id: 'p1',
                nombre: 'María González',
                categoria: 'Solista',
                provincia: 'Santa Fe Norte',
                estado: 'pendiente'
            },
            {
                id: 'p2', 
                nombre: 'Carlos Ruiz',
                categoria: 'Banda',
                provincia: 'Córdoba Centro',
                estado: 'aprobado',
                pago_confirmado: true
            }
        ];
        
        mockParticipantes.forEach(participante => {
            this.participantes.set(participante.id, participante);
        });
        
        this.renderParticipantesList();
    }

    loadMockDuelos() {
        console.log('⚔️ Cargando duelos mock...');
        
        const mockDuelos = [
            {
                id: 'duelo_1',
                participante1_id: 'p1',
                participante2_id: 'p2', 
                estado: 'activo',
                votos: { participante1: 3421, participante2: 1842, total: 5263 },
                fecha_fin: new Date(Date.now() + 23 * 60 * 60 * 1000) // 23 horas
            }
        ];
        
        mockDuelos.forEach(duelo => {
            this.duelos.set(duelo.id, duelo);
        });
        
        this.renderDuelosList();
    }

    // === MÉTODOS DE ACCIÓN ===
    editCertamen(id) {
        console.log(`✏️ Editando certamen: ${id}`);
        // Implementar modal de edición
    }

    viewCertamen(id) {
        console.log(`👁️ Viendo certamen: ${id}`);
        // Implementar vista detallada
    }

    rechazarParticipante(id) {
        console.log(`❌ Rechazando participante: ${id}`);
        // Implementar rechazo
    }

    pausarDuelo(id) {
        console.log(`⏸️ Pausando duelo: ${id}`);
        // Implementar pausa
    }

    viewDuelo(id) {
        console.log(`👁️ Viendo duelo: ${id}`);
        // Implementar vista detallada
    }
}

// Instancia global
window.sistemaJerarquico = new SistemaJerarquico();

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el usuario haga login antes de inicializar
    setTimeout(() => {
        if (document.getElementById('admin-interface') && !document.getElementById('admin-interface').classList.contains('hidden')) {
            window.sistemaJerarquico.init();
        }
    }, 1000);
});

// Exportar para uso en otros archivos
export default SistemaJerarquico;