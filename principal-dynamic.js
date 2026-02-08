// Importaciones optimizadas con lazy loading
import { db } from './firebase-config.module.js';

// Cache para datos frecuentemente accedidos
const dataCache = new Map();
const CACHE_DURATION = 300000; // 5 minutos

// Función para cargar Firebase de manera diferida
let firebaseModules = null;
const loadFirebaseModules = async () => {
    if (firebaseModules) return firebaseModules;
    
    const [firestoreModule, authModule] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js")
    ]);
    
    firebaseModules = {
        collection: firestoreModule.collection,
        getDocs: firestoreModule.getDocs,
        query: firestoreModule.query,
        orderBy: firestoreModule.orderBy,
        onSnapshot: firestoreModule.onSnapshot,
        doc: firestoreModule.doc,
        getDoc: firestoreModule.getDoc,
        limit: firestoreModule.limit,
        where: firestoreModule.where,
        getAuth: authModule.getAuth,
        onAuthStateChanged: authModule.onAuthStateChanged,
        signOut: authModule.signOut
    };
    
    return firebaseModules;
};

// Cargar notificaciones de manera diferida
let notificationsModule = null;
const loadNotifications = async () => {
    if (!notificationsModule) {
        try {
            notificationsModule = await import('./src/notifications.js');
            return notificationsModule.default || notificationsModule;
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar las notificaciones:', error);
            return null;
        }
    }
    return notificationsModule;
};

// Inicialización optimizada del componente
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔥 principal-dynamic.js cargando de manera optimizada...');
    
    try {
        // Cargar módulos de Firebase de manera asíncrona
        const firebase = await loadFirebaseModules();
        const notifications = await loadNotifications();
        const auth = firebase.getAuth();
        
        console.log('✅ Módulos Firebase cargados');
        
        // Elementos del DOM - Solo cargar los que existen
        const elements = {
            blogPostsContainer: document.getElementById('blog-posts-container'),
            profileLink: document.getElementById('profile-link'),
            logoutButton: document.getElementById('logout-button'),
            mobileMenu: document.getElementById('mobile-menu'),
            mobileMenuOverlay: document.getElementById('mobile-menu-overlay'),
            hamburgerTrigger: document.getElementById('hamburger-menu-trigger'),
            pozoTextElement: document.getElementById('pozoText'),
            pozoBarElement: document.querySelector('.pozo-bar'),
            communityFeedList: document.getElementById('community-feed-list')
        };
        
        // Filtrar elementos que existen
        const existingElements = Object.fromEntries(
            Object.entries(elements).filter(([key, element]) => element !== null)
        );
        
        console.log('📱 Elementos encontrados:', Object.keys(existingElements));
        
        const allInternalLinks = document.querySelectorAll('.header-nav a[data-target], .bottom-nav a[data-target], .mobile-menu-link');
        const pages = document.querySelectorAll('.page');
        
        console.log('🔗 Enlaces encontrados:', allInternalLinks.length);
        console.log('📄 Páginas encontradas:', pages.length);
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    const dropdownLinks = document.querySelectorAll('.dropdown > a');
    const buyVytButtons = document.querySelectorAll('.buy-vyt-btn');
    const modoPaymentModal = document.getElementById('modo-payment-modal');
    const receiptUploadModal = document.getElementById('receipt-upload-modal');
    const modalVytAmount = document.getElementById('modal-vyt-amount');
    const modalPaymentAmount = document.getElementById('modal-payment-amount');
    const uploadReceiptBtn = document.getElementById('upload-receipt-btn');
    const closePaymentModalBtn = document.getElementById('close-payment-modal-btn');
    const closeReceiptModalBtn = document.getElementById('close-receipt-modal-btn');
    const submitReceiptBtn = document.getElementById('submit-receipt-btn');
    const receiptFileInput = document.getElementById('receipt-file-input');
    const receiptUploadStatus = document.getElementById('receipt-upload-status');

    let currentPurchase = { vyt: 0, amount: 0 };

    // ✅ Control de listeners - Guardar referencia para limpiar después
    let authUnsubscribe = null;

    // --- Lógica de Autenticación y Balance ---
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            profileLink.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            
            // Cargar balance del usuario
            await loadUserBalance(user.uid);
            
            // Mostrar elementos de usuario autenticado
            showUserElements();
            
            // Notificación de bienvenida
            const userName = user.displayName || user.email.split('@')[0];
            notifications.loginSuccess(userName);
        } else {
            profileLink.classList.remove('hidden');
            logoutButton.classList.add('hidden');
            
            // Ocultar elementos de usuario
            hideUserElements();
        }
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.reload();
        }).catch((error) => {
            console.error('Sign out error', error);
        });
    });

    // --- Lógica de Navegación ---
    function showPage(targetId) {
        console.log('📄 showPage llamado con targetId:', targetId);
        console.log('📄 Páginas disponibles:', pages.length);
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(targetId);
        console.log('📄 Página objetivo encontrada:', !!targetPage);
        if (targetPage) {
            targetPage.classList.add('active');
            document.querySelector('.main-content').scrollTop = 0;
            console.log('✅ Página activada:', targetId);
        } else {
            console.log('❌ No se encontró la página:', targetId);
        }
    }

    // Hacer showPage disponible globalmente
    window.showPage = showPage;

    // ✅ Cachear elementos para no buscar cada click
    const headerNavLinks = document.querySelectorAll('.header-nav-link');
    const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');
    
    allInternalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            console.log('🔗 Click en enlace detectado:', link.textContent);
            e.preventDefault();
            const targetId = link.dataset.target;
            console.log('🎯 Target ID:', targetId);
            
            allInternalLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            headerNavLinks.forEach(l => l.dataset.target === targetId ? l.classList.add('active') : l.classList.remove('active'));
            bottomNavLinks.forEach(l => l.dataset.target === targetId ? l.classList.add('active') : l.classList.remove('active'));

            if (mobileMenu.classList.contains('open')) {
                console.log('📱 Cerrando menú móvil...');
                toggleMobileMenu();
            }
            showPage(targetId);
        });
    });

    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const targetLink = document.querySelector(`a[data-target="${targetId}"]`);
        if (targetLink) {
            allInternalLinks.forEach(nav => nav.classList.remove('active'));
            targetLink.classList.add('active');
            showPage(targetId);
        }
    }

    // --- Lógica del Menú Hamburguesa ---
    function toggleMobileMenu() {
        console.log('🍔 toggleMobileMenu ejecutado');
        console.log('Menu actual:', mobileMenu?.classList.contains('open'));
        mobileMenu.classList.toggle('open');
        mobileMenuOverlay.classList.toggle('open');
        console.log('Menu después:', mobileMenu?.classList.contains('open'));
    }

    if (hamburgerTrigger) {
        hamburgerTrigger.addEventListener('click', (e) => {
            console.log('🔥 Click en hamburger detectado');
            e.preventDefault();
            toggleMobileMenu();
        });
        console.log('✅ Event listener agregado al hamburger');
    } else {
        console.log('❌ No se encontró hamburger-menu-trigger');
    }
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', toggleMobileMenu);
        console.log('✅ Event listener agregado al overlay');
    } else {
        console.log('❌ No se encontró mobile-menu-overlay');
    }

    // --- Carga de Contenido Dinámico ---
    async function loadBlogPosts() {
        if (!blogPostsContainer) return;
        blogPostsContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">Cargando posts...</p>';
        try {
            const q = query(collection(db, "blog"), orderBy("createdAt", "desc"), limit(6));
            const querySnapshot = await getDocs(q);
            blogPostsContainer.innerHTML = '';
            if (querySnapshot.empty) {
                blogPostsContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No hay posts disponibles.</p>';
                return;
            }
            querySnapshot.forEach((docItem) => {
                const post = docItem.data();
                const postElement = document.createElement('div');
                postElement.className = 'blog-post-card';
                const formattedDate = post.createdAt?.toDate().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }) || '';
                postElement.innerHTML = `
                    ${post.imagenUrl ? `<img src="${post.imagenUrl}" alt="${post.titulo}" class="w-full h-48 object-cover">` : ''}
                    <div class="blog-post-info">
                        <h4>${post.titulo}</h4>
                        <p class="date">${formattedDate}</p>
                        <p class="snippet">${post.contenido.substring(0, 100)}...</p>
                    </div>
                `;
                blogPostsContainer.appendChild(postElement);
            });
        } catch (error) {
            console.error("Error al cargar los posts del blog:", error);
            blogPostsContainer.innerHTML = '<p class="text-center text-red-500 col-span-full">Error al cargar los posts.</p>';
        }
    }

    async function loadBasesYCondiciones() {
        const onlineContainer = document.getElementById('bases-online-content');
        const presencialContainer = document.getElementById('bases-presencial-content');
        const renderBases = async (mode, container) => {
            if (!container) return;
            try {
                const docRef = doc(db, "bases_y_condiciones", mode);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.tipo === 'pdf' && data.url) {
                        container.innerHTML = `<embed src="${data.url}" type="application/pdf" width="100%" height="800px" />`;
                    } else if (data.tipo === 'texto' && data.contenido) {
                        container.innerHTML = data.contenido.replace(/\n/g, '<br>');
                    } else {
                        container.innerHTML = '<p>Contenido no disponible.</p>';
                    }
                }
            } catch (error) {
                console.error(`Error al cargar bases para ${mode}:`, error);
                container.innerHTML = '<p class="text-red-500">Error al cargar contenido.</p>';
            }
        };
        await renderBases('online', onlineContainer);
        await renderBases('presenciales', presencialContainer);
    }

    async function loadCommunityFeed() {
        if (!communityFeedList) return;
        communityFeedList.innerHTML = '<p class="text-gray-400">Cargando feed...</p>';
        try {
            const q = query(collection(db, "feed_comunitario"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            communityFeedList.innerHTML = '';
            if (querySnapshot.empty) {
                communityFeedList.innerHTML = '<p class="text-gray-500">Aún no hay nada en el feed.</p>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const post = doc.data();
                const postElement = document.createElement('div');
                postElement.className = 'bg-gray-800 p-6 rounded-lg border border-gray-700';
                postElement.innerHTML = `
                    <h3 class="text-xl font-bold mb-2">${post.titulo}</h3>
                    ${post.imagenUrl ? `<img src="${post.imagenUrl}" alt="Imagen del post" class="w-full h-auto object-cover rounded-lg mb-4">` : ''}
                    <p class="text-gray-300">${post.contenido}</p>
                    <p class="text-xs text-gray-500 mt-4">${new Date(post.createdAt.toDate()).toLocaleString()}</p>
                `;
                communityFeedList.appendChild(postElement);
            });
        } catch (error) {
            console.error("Error loading community feed:", error);
            communityFeedList.innerHTML = '<p class="text-red-500">Error al cargar el feed.</p>';
        }
    }

    // ✅ Control de onSnapshot listener
    let pozoUnsubscribe = null;
    function initPozoListener() {
        if (pozoUnsubscribe) {
            pozoUnsubscribe();
        }
        const pozoDocRef = doc(db, "estadisticas_generales", "resumen_certamen");
        pozoUnsubscribe = onSnapshot(pozoDocRef, (doc) => {
            if (doc.exists()) {
                const pozoActual = doc.data().pozo_total;
                if(pozoTextElement) pozoTextElement.textContent = `$ ${pozoActual.toLocaleString('es-AR')}`;
                const pozoObjetivo = 2000000;
                const porcentaje = Math.min(100, (pozoActual / pozoObjetivo) * 100);
                if(pozoBarElement) pozoBarElement.style.width = `${porcentaje}%`;
            }
        });
    }
    initPozoListener();

    // Iniciar carga de contenido

    loadBlogPosts();
    loadBasesYCondiciones();
    loadCommunityFeed();

    // --- Carga de bloques dinámicos para la página principal ---
    async function loadDynamicBlocks() {
        const blocksContainer = document.getElementById('dynamic-blocks-container');
        if (!blocksContainer) return;
        blocksContainer.innerHTML = '<p class="text-gray-500">Cargando contenido...</p>';
        try {
            const q = query(collection(db, "contenido_dinamico"), where("page_id", "==", "principal"), orderBy("orden", "asc"));
            const querySnapshot = await getDocs(q);
            blocksContainer.innerHTML = '';
            if (querySnapshot.empty) {
                blocksContainer.innerHTML = '<p class="text-gray-500">No hay bloques creados.</p>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const block = doc.data();
                let blockHTML = '';
                switch (block.tipo) {
                    case 'titulo':
                        blockHTML = `<h2 class='titulo-seccion'>${block.contenido.texto || ''}</h2>`;
                        break;
                    case 'parrafo':
                        blockHTML = `<p class='subtitulo-seccion'>${block.contenido.texto || ''}</p>`;
                        break;
                    case 'banner':
                        blockHTML = `<img src='${block.contenido.url}' alt='Banner' class='w-full rounded-lg mb-4' />`;
                        break;
                    case 'video':
                        const embedVideoUrl = getYouTubeEmbedUrl(block.contenido.url);
                        blockHTML = `<div class='video-wrapper mb-4'>${embedVideoUrl ? `<iframe width='100%' height='320' src='${embedVideoUrl}' frameborder='0' allowfullscreen></iframe>` : `<p class='text-red-500'>URL de YouTube no válida.</p>`}</div>`;
                        break;
                    case 'pdf':
                        blockHTML = `<embed src='${block.contenido.url}' type='application/pdf' width='100%' height='400px' />`;
                        break;
                    case 'blog':
                        blockHTML = `<div id='blog-posts-container'></div>`;
                        break;
                    case 'certamenes':
                        blockHTML = `<div id='certamenes-grid'></div>`;
                        break;
                    default:
                        blockHTML = `<div class='p-2'>Bloque desconocido</div>`;
                }
                const blockDiv = document.createElement('div');
                blockDiv.className = 'dynamic-block mb-6';
                blockDiv.innerHTML = blockHTML;
                blocksContainer.appendChild(blockDiv);
            });
        } catch (error) {
            console.error('Error al cargar bloques dinámicos:', error);
            blocksContainer.innerHTML = '<p class="text-red-500">Error al cargar el contenido dinámico.</p>';
        }
    }

    // --- Funciones de Balance de Usuario ---
    async function loadUserBalance(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                updateBalanceDisplay(userData.vyt_money_balance || 0);
                console.log('💰 Balance cargado:', userData.vyt_money_balance || 0);
            }
        } catch (error) {
            console.error('Error cargando balance:', error);
        }
    }

    function updateBalanceDisplay(balance, previousBalance = null) {
        // Actualizar balance en la página
        const balanceElements = [
            document.getElementById('currentBalance'),
            document.getElementById('userBalance'),
            document.getElementById('balance-amount')
        ];
        
        balanceElements.forEach(element => {
            if (element) {
                element.textContent = `${balance.toLocaleString()} VYT-MONEY`;
                
                // Agregar animación de actualización
                element.classList.add('balance-update');
                setTimeout(() => {
                    element.classList.remove('balance-update');
                }, 800);
            }
        });

        // Mostrar balance display si existe
        const balanceDisplay = document.getElementById('balanceDisplay');
        if (balanceDisplay) {
            balanceDisplay.style.display = 'block';
        }

        // Notificar cambio de balance si hay cambio
        if (previousBalance !== null && balance !== previousBalance) {
            const change = balance - previousBalance;
            notifications.balanceUpdated(balance, change);
        }
    }

    function showUserElements() {
        const userElements = document.querySelectorAll('.user-only');
        userElements.forEach(el => el.style.display = 'block');
    }

    function hideUserElements() {
        const userElements = document.querySelectorAll('.user-only');
        userElements.forEach(el => el.style.display = 'none');
        
        const balanceDisplay = document.getElementById('balanceDisplay');
        if (balanceDisplay) {
            balanceDisplay.style.display = 'none';
        }
    }

    // ✅ LIMPIEZA: Desuscribirse de listeners cuando se cierre la página
    window.addEventListener('beforeunload', () => {
        console.log('🧹 Limpiando listeners...');
        if (authUnsubscribe) {
            authUnsubscribe();
            console.log('✅ Auth listener limpiado');
        }
        if (pozoUnsubscribe) {
            pozoUnsubscribe();
            console.log('✅ Pozo listener limpiado');
        }
    }, { once: true });

    // Hacer funciones disponibles globalmente
    window.loadUserBalance = loadUserBalance;
    window.updateBalanceDisplay = updateBalanceDisplay;

    // Helper function to get YouTube embed URL
    function getYouTubeEmbedUrl(url) {
        if (!url) return '';
        let videoId = '';
        const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/s]{11})/i;
        const match = url.match(regExp);
        if (match && match[1]) {
            videoId = match[1];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }

    // Ejecutar la carga de bloques dinámicos al iniciar
    loadDynamicBlocks();
    
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        // Fallback en caso de error
        console.log('🔄 Intentando inicialización básica...');
    }
});