// Certámenes JS - Sistema completo de votación y rankings
import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp,
    increment,
    onSnapshot,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Variables globales
let certamenesData = [];
let rankingData = [];
let currentUser = null;
let userVotes = {};
let currentSection = 'home';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    setupNavigation();
    await loadAllData();
});

// Inicializar aplicación
async function initializeApp() {
    // Verificar usuario actual desde localStorage
    currentUser = localStorage.getItem('vyt_user_id') || generateUserId();
    localStorage.setItem('vyt_user_id', currentUser);
    
    // Cargar votos del usuario
    await loadUserVotes();
    
    console.log('App initialized for user:', currentUser);
}

// Generar ID único para usuario
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Configurar navegación
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            if (section) {
                switchSection(section);
                
                // Actualizar navegación activa
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });
}

// Cambiar sección
function switchSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.add('hidden');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
        currentSection = section;
        
        // Cargar datos específicos de la sección
        loadSectionData(section);
    }
}

// Cargar datos específicos por sección
async function loadSectionData(section) {
    switch (section) {
        case 'home':
            await loadFeaturedCertamenes();
            await loadTopParticipants();
            break;
        case 'rankings':
            await loadGeneralRanking();
            break;
        case 'certamenes':
            await loadCertamenesList();
            break;
        case 'provincial':
            await loadProvincialRankings();
            break;
        case 'nacional':
            await loadNacionalRanking();
            break;
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Filtro provincial
    const provinciaFilter = document.getElementById('provinciaFilter');
    if (provinciaFilter) {
        provinciaFilter.addEventListener('change', handleProvinciaFilter);
    }
    
    // Botones de acción
    const refreshBtn = document.getElementById('refreshRankings');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshAllRankings);
    }
    
    // Modales
    setupModalEventListeners();
    
    // Filtros rápidos
    setupQuickFilters();
}

// Configurar modales
function setupModalEventListeners() {
    // Modal de video
    const videoModal = document.getElementById('videoModal');
    const closeModal = document.getElementById('closeModal');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            closeVideoModal();
        });
    }
    
    // Modal de compartir
    const shareModal = document.getElementById('shareModal');
    const closeShareModal = document.getElementById('closeShareModal');
    
    if (closeShareModal) {
        closeShareModal.addEventListener('click', () => {
            shareModal.classList.add('hidden');
        });
    }
    
    // Opciones de compartir
    document.querySelectorAll('.share-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const platform = e.currentTarget.dataset.platform;
            handleShare(platform);
        });
    });
    
    // Cerrar modales con click fuera
    [videoModal, shareModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    });
}

// Configurar filtros rápidos
function setupQuickFilters() {
    document.querySelectorAll('[data-filter]').forEach(filter => {
        filter.addEventListener('click', (e) => {
            const filterType = e.currentTarget.dataset.filter;
            applyQuickFilter(filterType);
        });
    });
}

// Cargar todos los datos iniciales
async function loadAllData() {
    try {
        showLoading(true);
        
        // Cargar en paralelo
        await Promise.all([
            loadCertamenes(),
            loadProvincias(),
            loadFeaturedCertamenes(),
            loadTopParticipants()
        ]);
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Error al cargar los datos iniciales');
        showLoading(false);
    }
}

// Cargar certámenes
async function loadCertamenes() {
    try {
        const q = query(
            collection(db, "certamenes_provincias"),
            where("activo", "==", true),
            orderBy("fecha_inicio", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        certamenesData = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            certamenesData.push({
                id: doc.id,
                ...data,
                participantes_count: 0 // Se cargará después
            });
        });
        
        // Verificar si hay certámenes disponibles
        if (certamenesData.length === 0) {
            showEmptyState('certamenes');
        }
        
        // Cargar conteo de participantes para cada certamen
        await loadParticipantCounts();
        
        console.log('Certámenes loaded:', certamenesData.length);
        
    } catch (error) {
        console.error('Error loading certámenes:', error);
        throw error;
    }
}

// Mostrar estado vacío
function showEmptyState(type) {
    let container, message, icon;
    
    switch (type) {
        case 'certamenes':
            container = document.getElementById('certamenesList') || document.querySelector('.certamenes-grid') || document.getElementById('vyt-certamenes-grid');
            icon = 'fa-envelope';
            message = {
                title: '¡Próximamente!',
                subtitle: 'No hay certámenes activos en este momento.',
                action: 'Déjanos tu email y te avisaremos cuando haya novedades.',
                showEmailForm: true
            };
            break;
        case 'participantes':
            container = document.getElementById('participantesList');
            icon = 'fa-users';
            message = {
                title: 'Aún no hay participantes',
                subtitle: 'Sé el primero en inscribirte a este certamen',
                buttonText: 'Inscribirse Ahora',
                buttonLink: '/inscripcion-unificada.html'
            };
            break;
        case 'ranking':
            container = document.getElementById('rankingList');
            icon = 'fa-star';
            message = {
                title: 'El ranking está vacío',
                subtitle: 'Los votos determinarán el ranking pronto'
            };
            break;
        default:
            return;
    }
    
    if (container) {
        container.innerHTML = `
            <div class="empty-state text-center py-16 px-6 max-w-2xl mx-auto">
                <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-6">
                    <i class="fas ${icon} text-5xl text-blue-400"></i>
                </div>
                <h3 class="text-3xl font-bold text-white mb-4">${message.title}</h3>
                <p class="text-gray-300 text-lg mb-3">${message.subtitle}</p>
                ${message.action ? `<p class="text-gray-400 mb-8 text-base">${message.action}</p>` : ''}
                
                ${message.showEmailForm ? `
                    <div class="email-subscription-form max-w-md mx-auto">
                        <form id="emailSubscriptionForm" class="flex flex-col gap-4">
                            <div class="flex gap-2">
                                <input 
                                    type="email" 
                                    id="subscriberEmail" 
                                    placeholder="tu@email.com" 
                                    required
                                    class="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <button 
                                    type="submit" 
                                    class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                                >
                                    <i class="fas fa-paper-plane"></i>
                                    <span>Avisarme</span>
                                </button>
                            </div>
                            <p id="subscriptionMessage" class="text-sm text-green-400 hidden"></p>
                        </form>
                    </div>
                ` : ''}
                
                ${message.buttonText ? `
                    <a href="${message.buttonLink}" class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg mt-6">
                        <i class="fas ${icon}"></i>
                        ${message.buttonText}
                    </a>
                ` : ''}
            </div>
        `;
        
        // Agregar listener al formulario si existe
        if (message.showEmailForm) {
            const form = document.getElementById('emailSubscriptionForm');
            if (form) {
                form.addEventListener('submit', handleEmailSubscription);
            }
        }
    }
}


// Cargar conteo de participantes
async function loadParticipantCounts() {
    for (const certamen of certamenesData) {
        try {
            const participantesQuery = query(
                collection(db, "participantes_online"),
                where("certamen_id", "==", certamen.id),
                where("pago_completado", "==", true)
            );
            
            const snapshot = await getDocs(participantesQuery);
            certamen.participantes_count = snapshot.size;
            
        } catch (error) {
            console.error(`Error loading participants for ${certamen.id}:`, error);
            certamen.participantes_count = 0;
        }
    }
}

// Cargar provincias
async function loadProvincias() {
    try {
        const provincias = [
            "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba",
            "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
            "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
            "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
            "Santiago del Estero", "Tierra del Fuego", "Tucumán", "CABA"
        ];
        
        const provinciaFilter = document.getElementById('provinciaFilter');
        if (provinciaFilter) {
            provinciaFilter.innerHTML = '<option value="">Todas las Provincias</option>' +
                provincias.map(prov => `<option value="${prov}">${prov}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error loading provinces:', error);
    }
}

// Cargar certámenes destacados
async function loadFeaturedCertamenes() {
    try {
        const container = document.getElementById('featuredCertamenes');
        if (!container) return;
        
        const featured = certamenesData
            .filter(c => c.destacado || c.participantes_count > 10)
            .slice(0, 6);
        
        if (featured.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-microphone text-6xl text-gray-600 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-400 mb-2">No hay certámenes destacados</h3>
                    <p class="text-gray-500">Pronto se habilitarán nuevas convocatorias</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = featured.map(certamen => createCertamenCard(certamen)).join('');
        
    } catch (error) {
        console.error('Error loading featured certámenes:', error);
    }
}

// Crear tarjeta de certamen
function createCertamenCard(certamen) {
    const precio = certamen.precio_inscripcion || 0;
    const fechaInicio = certamen.fecha_inicio?.toDate ? 
        certamen.fecha_inicio.toDate().toLocaleDateString('es-AR') :
        new Date(certamen.fecha_inicio).toLocaleDateString('es-AR');
    
    return `
        <div class="certamen-card rounded-lg p-6 cursor-pointer" onclick="openCertamenDetail('${certamen.id}')">
            <div class="relative mb-4 overflow-hidden rounded-lg">
                <img src="${certamen.imagen_url || '/api/placeholder/300/200'}" 
                     alt="${certamen.nombre}" 
                     class="w-full h-40 object-cover transition-transform duration-300 hover:scale-110"
                     onerror="this.src='/api/placeholder/300/200'">
                <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <button class="play-btn">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="absolute top-2 right-2">
                    <span class="bg-spotify-green px-2 py-1 rounded-full text-xs font-semibold text-white">
                        ${certamen.provincia}
                    </span>
                </div>
                <div class="absolute top-2 left-2">
                    <span class="bg-red-500 px-2 py-1 rounded-full text-xs font-semibold text-white">
                        <i class="fas fa-fire mr-1"></i>
                        ACTIVO
                    </span>
                </div>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2 hover:text-spotify-green transition-colors">
                ${certamen.nombre}
            </h3>
            <p class="text-spotify-light-gray text-sm mb-3 line-clamp-2">
                ${certamen.descripcion || 'Participa en este emocionante certamen musical'}
            </p>
            <div class="flex items-center justify-between mb-3">
                <div class="text-sm">
                    <span class="text-spotify-green font-semibold">$${precio.toLocaleString('es-AR')}</span>
                    <span class="text-spotify-light-gray ml-1">inscripción</span>
                </div>
                <div class="text-xs text-spotify-light-gray">
                    <i class="fas fa-users mr-1"></i>
                    ${certamen.participantes_count} participantes
                </div>
            </div>
            <div class="pt-3 border-t border-gray-700">
                <div class="flex items-center justify-between text-xs text-spotify-light-gray">
                    <span><i class="fas fa-calendar mr-1"></i>${fechaInicio}</span>
                    <span class="text-spotify-green font-semibold">
                        ${certamen.estado === 'activo' ? 'VOTACIÓN ABIERTA' : 'PRÓXIMAMENTE'}
                    </span>
                </div>
            </div>
        </div>
    `;
}

// Cargar top participantes
async function loadTopParticipants() {
    try {
        const container = document.getElementById('topParticipants');
        if (!container) return;
        
        // Query para obtener participantes con más votos
        const q = query(
            collection(db, "participantes_online"),
            where("pago_completado", "==", true),
            orderBy("votos_totales", "desc"),
            limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const participants = [];
        
        querySnapshot.forEach((doc) => {
            participants.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        if (participants.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-trophy text-4xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400">No hay participantes disponibles</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = participants.map((participant, index) => 
            createParticipantRow(participant, index + 1)
        ).join('');
        
    } catch (error) {
        console.error('Error loading top participants:', error);
        const container = document.getElementById('topParticipants');
        if (container) {
            container.innerHTML = '<p class="text-red-400 text-center py-4">Error al cargar participantes</p>';
        }
    }
}

// Crear fila de participante
function createParticipantRow(participant, position) {
    const videoId = extractYouTubeVideoId(participant.video_link);
    const thumbnailUrl = videoId ? 
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 
        '/api/placeholder/120/90';
    
    let positionDisplay = position;
    let positionClass = 'text-spotify-light-gray';
    
    if (position === 1) {
        positionDisplay = '<i class="fas fa-crown text-yellow-400"></i>';
        positionClass = 'text-yellow-400';
    } else if (position === 2) {
        positionDisplay = '<i class="fas fa-medal text-gray-400"></i>';
        positionClass = 'text-gray-400';
    } else if (position === 3) {
        positionDisplay = '<i class="fas fa-medal text-orange-400"></i>';
        positionClass = 'text-orange-400';
    }
    
    const hasVoted = userVotes[participant.id];
    
    return `
        <div class="participant-row rounded-lg p-4 flex items-center space-x-4">
            <div class="w-8 text-center ${positionClass} font-bold">
                ${positionDisplay}
            </div>
            <div class="relative group cursor-pointer" onclick="openVideoModal('${participant.id}')">
                <img src="${thumbnailUrl}" 
                     alt="Video thumbnail" 
                     class="w-16 h-12 object-cover rounded"
                     onerror="this.src='/api/placeholder/120/90'">
                <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                    <i class="fas fa-play text-white text-sm"></i>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-white truncate">${participant.nombre} ${participant.apellido}</h4>
                <p class="text-sm text-spotify-light-gray truncate">${participant.provincia} • ${participant.certamen_nombre || 'Certamen'}</p>
                <div class="flex items-center space-x-4 mt-1">
                    <span class="text-xs text-spotify-light-gray">
                        <i class="fas fa-heart text-red-500 mr-1"></i>
                        ${participant.votos_totales || 0} votos
                    </span>
                    <span class="text-xs text-spotify-light-gray">
                        <i class="fas fa-eye mr-1"></i>
                        ${participant.reproducciones_youtube || 0} views
                    </span>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button 
                    class="vote-btn px-3 py-1 rounded-full text-sm ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}" 
                    onclick="handleVote('${participant.id}')"
                    ${hasVoted ? 'disabled' : ''}
                >
                    <i class="fas fa-heart mr-1"></i>
                    ${hasVoted ? 'Votado' : 'Votar'}
                </button>
                <button class="share-btn px-3 py-1 rounded-full text-sm" onclick="openShareModal('${participant.id}')">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `;
}

// Abrir detalle de certamen
async function openCertamenDetail(certamenId) {
    try {
        const certamen = certamenesData.find(c => c.id === certamenId);
        if (!certamen) return;
        
        // Cambiar a sección de certámenes y cargar participantes
        switchSection('certamenes');
        await loadCertamenParticipants(certamenId);
        
    } catch (error) {
        console.error('Error opening certamen detail:', error);
    }
}

// Cargar participantes de un certamen
async function loadCertamenParticipants(certamenId) {
    try {
        const q = query(
            collection(db, "participantes_online"),
            where("certamen_id", "==", certamenId),
            where("pago_completado", "==", true),
            orderBy("votos_totales", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const participants = [];
        
        querySnapshot.forEach((doc) => {
            participants.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Mostrar participantes en la sección de certámenes
        const container = document.getElementById('certamenesList');
        if (container) {
            const certamen = certamenesData.find(c => c.id === certamenId);
            container.innerHTML = `
                <div class="bg-spotify-black rounded-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-white">${certamen.nombre}</h3>
                            <p class="text-spotify-light-gray">${certamen.provincia} • ${participants.length} participantes</p>
                        </div>
                        <button class="vote-btn px-4 py-2 rounded-full" onclick="loadAllData()">
                            <i class="fas fa-arrow-left mr-2"></i>
                            Volver
                        </button>
                    </div>
                    <div class="space-y-3">
                        ${participants.map((p, i) => createParticipantRow(p, i + 1)).join('')}
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading certamen participants:', error);
    }
}

// Manejar votación
async function handleVote(participantId) {
    try {
        // Verificar si ya votó
        if (userVotes[participantId]) {
            showNotification('Ya has votado por este participante', 'warning');
            return;
        }
        
        // Verificar límite de votos diarios (máximo 10 votos por día)
        const today = new Date().toDateString();
        const todayVotes = Object.values(userVotes).filter(vote => 
            new Date(vote.timestamp).toDateString() === today
        ).length;
        
        if (todayVotes >= 10) {
            showNotification('Has alcanzado el límite de 10 votos por día', 'warning');
            return;
        }
        
        showLoading(true);
        
        // Registrar voto
        const voteData = {
            user_id: currentUser,
            participant_id: participantId,
            timestamp: serverTimestamp(),
            ip: await getUserIP()
        };
        
        // Guardar voto en Firestore
        await setDoc(doc(db, "votos", `${currentUser}_${participantId}`), voteData);
        
        // Actualizar conteo de votos del participante
        await updateDoc(doc(db, "participantes_online", participantId), {
            votos_totales: increment(1),
            ultima_actualizacion: serverTimestamp()
        });
        
        // Actualizar cache local
        userVotes[participantId] = voteData;
        localStorage.setItem('vyt_user_votes', JSON.stringify(userVotes));
        
        showNotification('¡Voto registrado correctamente!', 'success');
        
        // Recargar rankings
        await refreshAllRankings();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error voting:', error);
        showNotification('Error al registrar el voto', 'error');
        showLoading(false);
    }
}

// Cargar votos del usuario
async function loadUserVotes() {
    try {
        // Intentar cargar desde localStorage primero
        const cached = localStorage.getItem('vyt_user_votes');
        if (cached) {
            userVotes = JSON.parse(cached);
        }
        
        // Cargar desde Firestore para sincronizar
        const q = query(
            collection(db, "votos"),
            where("user_id", "==", currentUser)
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            userVotes[data.participant_id] = data;
        });
        
        // Actualizar localStorage
        localStorage.setItem('vyt_user_votes', JSON.stringify(userVotes));
        
    } catch (error) {
        console.error('Error loading user votes:', error);
    }
}

// Obtener IP del usuario (simplificado)
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// Abrir modal de video
async function openVideoModal(participantId) {
    try {
        const modal = document.getElementById('videoModal');
        if (!modal) return;
        
        // Buscar participante
        const participant = await getParticipantById(participantId);
        if (!participant) return;
        
        // Actualizar contenido del modal
        document.getElementById('videoTitle').textContent = 
            `${participant.nombre} ${participant.apellido}`;
        
        const videoContainer = document.getElementById('videoContainer');
        const videoId = extractYouTubeVideoId(participant.video_link);
        
        if (videoId) {
            videoContainer.innerHTML = `
                <iframe 
                    class="w-full h-full rounded" 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
            `;
        } else {
            videoContainer.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gray-800 rounded">
                    <p class="text-gray-400">Video no disponible</p>
                </div>
            `;
        }
        
        // Actualizar información del participante
        const participantInfo = document.getElementById('participantInfo');
        participantInfo.innerHTML = `
            <div class="text-white">
                <p class="font-semibold">${participant.nombre} ${participant.apellido}</p>
                <p class="text-sm text-spotify-light-gray">${participant.provincia} • ${participant.votos_totales || 0} votos</p>
            </div>
        `;
        
        // Configurar botones del modal
        const modalVoteBtn = document.getElementById('modalVoteBtn');
        const modalShareBtn = document.getElementById('modalShareBtn');
        
        modalVoteBtn.onclick = () => handleVote(participantId);
        modalShareBtn.onclick = () => openShareModal(participantId);
        
        if (userVotes[participantId]) {
            modalVoteBtn.disabled = true;
            modalVoteBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Votado';
            modalVoteBtn.classList.add('opacity-50');
        }
        
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error opening video modal:', error);
    }
}

// Cerrar modal de video
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.classList.add('hidden');
        // Detener video
        const videoContainer = document.getElementById('videoContainer');
        videoContainer.innerHTML = '';
    }
}

// Obtener participante por ID
async function getParticipantById(participantId) {
    try {
        const docRef = doc(db, "participantes_online", participantId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting participant:', error);
        return null;
    }
}

// Abrir modal de compartir
function openShareModal(participantId) {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Configurar datos para compartir
        modal.dataset.participantId = participantId;
    }
}

// Manejar compartir
async function handleShare(platform) {
    try {
        const modal = document.getElementById('shareModal');
        const participantId = modal.dataset.participantId;
        
        if (!participantId) return;
        
        const participant = await getParticipantById(participantId);
        if (!participant) return;
        
        const shareText = `¡Vota por ${participant.nombre} ${participant.apellido} en VYT Music! 🎵`;
        const shareUrl = `${window.location.origin}/certamenes.html?participant=${participantId}`;
        
        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`);
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
                break;
            case 'copy':
                await navigator.clipboard.writeText(shareUrl);
                showNotification('¡Enlace copiado al portapapeles!', 'success');
                break;
        }
        
        modal.classList.add('hidden');
        
    } catch (error) {
        console.error('Error sharing:', error);
        showNotification('Error al compartir', 'error');
    }
}

// Extraer ID de video de YouTube
function extractYouTubeVideoId(url) {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

// Utilidades
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading(show) {
    // Implementar indicador de carga global
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.classList.toggle('hidden', !show);
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación toast
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
        type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
        type === 'warning' ? 'bg-yellow-600' :
        'bg-blue-600'
    } text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${
                type === 'success' ? 'check-circle' :
                type === 'error' ? 'times-circle' :
                type === 'warning' ? 'exclamation-triangle' :
                'info-circle'
            }"></i>
            <span>${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showError(message) {
    showNotification(message, 'error');
}

// Funciones de ranking y búsqueda (continuación del desarrollo)
async function refreshAllRankings() {
    try {
        showLoading(true);
        await Promise.all([
            loadTopParticipants(),
            loadGeneralRanking(),
            loadSectionData(currentSection)
        ]);
        showNotification('Rankings actualizados', 'success');
        showLoading(false);
    } catch (error) {
        console.error('Error refreshing rankings:', error);
        showError('Error al actualizar rankings');
        showLoading(false);
    }
}

async function loadGeneralRanking() {
    // Implementar carga de ranking general
    console.log('Loading general ranking...');
}

async function loadCertamenesList() {
    // Implementar lista completa de certámenes
    console.log('Loading certámenes list...');
}

async function loadProvincialRankings() {
    // Implementar rankings provinciales
    console.log('Loading provincial rankings...');
}

async function loadNacionalRanking() {
    // Implementar ranking nacional
    console.log('Loading nacional ranking...');
}

function handleSearch(event) {
    // Implementar búsqueda
    console.log('Searching:', event.target.value);
}

function handleProvinciaFilter(event) {
    // Implementar filtro provincial
    console.log('Province filter:', event.target.value);
}

function applyQuickFilter(filterType) {
    // Implementar filtros rápidos
    console.log('Quick filter:', filterType);
}

// Manejar suscripción de email
async function handleEmailSubscription(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('subscriberEmail');
    const messageEl = document.getElementById('subscriptionMessage');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!emailInput || !emailInput.value) {
        return;
    }
    
    const email = emailInput.value.trim().toLowerCase();
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (messageEl) {
            messageEl.textContent = '❌ Por favor ingresa un email válido';
            messageEl.classList.remove('hidden', 'text-green-400');
            messageEl.classList.add('text-red-400');
        }
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }
    
    try {
        // Guardar email en Firestore
        await setDoc(doc(db, 'email_subscribers', email), {
            email: email,
            subscribed_at: serverTimestamp(),
            source: 'certamenes_empty_state',
            active: true
        }, { merge: true });
        
        // Mostrar mensaje de éxito
        if (messageEl) {
            messageEl.textContent = '✅ ¡Listo! Te avisaremos cuando haya novedades';
            messageEl.classList.remove('hidden', 'text-red-400');
            messageEl.classList.add('text-green-400');
        }
        
        // Limpiar input
        emailInput.value = '';
        
        // Resetear botón después de 2 segundos
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Avisarme</span>';
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error saving email subscription:', error);
        
        if (messageEl) {
            messageEl.textContent = '❌ Hubo un error. Intenta nuevamente';
            messageEl.classList.remove('hidden', 'text-green-400');
            messageEl.classList.add('text-red-400');
        }
        
        // Rehabilitar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Avisarme</span>';
        }
    }
}

// Exportar funciones necesarias para uso global
window.openCertamenDetail = openCertamenDetail;
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.handleVote = handleVote;
window.openShareModal = openShareModal;
window.handleShare = handleShare;