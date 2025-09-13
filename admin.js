import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { query, collection, where, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Elementos para el constructor visual
    const designArea = document.getElementById('constructor-design-area');
    const constructorPageSelect = document.getElementById('constructor-page-select');
    const blockBtns = document.querySelectorAll('.block-btn');
    let bloquesActuales = [];
    let bloqueIdCounter = 1;

    // Renderiza los bloques en el área de diseño con menú de edición y drag & drop
    function renderVistaPrevia(bloques) {
        if (!designArea) return;
        designArea.innerHTML = '';
        if (!bloques || bloques.length === 0) {
            designArea.innerHTML = '<p class="text-gray-500">Haz clic en un icono para agregar bloques al lienzo.</p>';
            return;
        }
        bloques.sort((a, b) => a.orden - b.orden);
        bloques.forEach((bloque, idx) => {
            let bloqueHTML = '';
            let menuEdicion = '';
            switch (bloque.tipo) {
                case 'texto':
                    menuEdicion = `<div class="menu-edicion p-2 bg-gray-800 rounded mb-2 flex flex-wrap gap-2">
                        <textarea data-edit="contenido" data-idx="${idx}" class="form-input w-full mb-2" rows="3" placeholder="Escribe tu texto aquí...">${bloque.contenido||'Texto de ejemplo'}</textarea>
                        <input type="color" value="${bloque.color || '#e6edf3'}" data-edit="color" data-idx="${idx}" title="Color">
                        <select data-edit="fuente" data-idx="${idx}"><option>Montserrat</option><option>Bebas Neue</option></select>
                        <input type="number" min="10" max="72" value="${parseInt(bloque.tamano)||16}" data-edit="tamano" data-idx="${idx}" style="width:60px" title="Tamaño">
                        <select data-edit="alineacion" data-idx="${idx}"><option value="left">Izq</option><option value="center">Centro</option><option value="right">Der</option></select>
                        <label><input type="checkbox" data-edit="negrita" data-idx="${idx}" ${bloque.negrita?'checked':''}>Negrita</label>
                        <button class="delete-block-btn bg-red-600 text-white px-2 rounded" data-idx="${idx}">Eliminar</button>
                    </div>`;
                    bloqueHTML = `<div class="p-2"><span style="color:${bloque.color||'#e6edf3'};font-size:${bloque.tamano||'16'}px;font-family:${bloque.fuente||'Montserrat'};text-align:${bloque.alineacion||'left'};font-weight:${bloque.negrita?'bold':'normal'};">${bloque.contenido||'Texto de ejemplo'}</span></div>`;
                    break;
                case 'imagen':
                    menuEdicion = `<div class="menu-edicion p-2 bg-gray-800 rounded mb-2 flex flex-wrap gap-2">
                        <input type="text" value="${bloque.url||''}" data-edit="url" data-idx="${idx}" placeholder="URL imagen">
                        <button class="delete-block-btn bg-red-600 text-white px-2 rounded" data-idx="${idx}">Eliminar</button>
                    </div>`;
                    bloqueHTML = `<div class="p-2"><img src="${bloque.url||''}" alt="Imagen" class="w-full rounded-lg" /></div>`;
                    break;
                case 'video':
                    menuEdicion = `<div class="menu-edicion p-2 bg-gray-800 rounded mb-2 flex flex-wrap gap-2">
                        <input type="text" value="${bloque.url||''}" data-edit="url" data-idx="${idx}" placeholder="URL video">
                        <button class="delete-block-btn bg-red-600 text-white px-2 rounded" data-idx="${idx}">Eliminar</button>
                    </div>`;
                    bloqueHTML = `<div class="p-2"><iframe width="100%" height="220" src="${bloque.url||''}" frameborder="0" allowfullscreen></iframe></div>`;
                    break;
                case 'pdf':
                    menuEdicion = `<div class="menu-edicion p-2 bg-gray-800 rounded mb-2 flex flex-wrap gap-2">
                        <input type="text" value="${bloque.url||''}" data-edit="url" data-idx="${idx}" placeholder="URL PDF">
                        <button class="delete-block-btn bg-red-600 text-white px-2 rounded" data-idx="${idx}">Eliminar</button>
                    </div>`;
                    bloqueHTML = `<div class="p-2"><embed src="${bloque.url||''}" type="application/pdf" width="100%" height="400px" /></div>`;
                    break;
                case 'banner':
                    menuEdicion = `<div class="menu-edicion p-2 bg-gray-800 rounded mb-2 flex flex-wrap gap-2">
                        <input type="text" value="${bloque.contenido||''}" data-edit="contenido" data-idx="${idx}" placeholder="Texto banner">
                        <button class="delete-block-btn bg-red-600 text-white px-2 rounded" data-idx="${idx}">Eliminar</button>
                    </div>`;
                    bloqueHTML = `<div class="p-2 bg-blue-900 text-white rounded-lg"><h2 class="font-bold text-xl">${bloque.contenido||'Banner'}</h2></div>`;
                    break;
                case 'boton':
                    menuEdicion = `<div class="menu-edicion p-2 bg-gray-800 rounded mb-2 flex flex-wrap gap-2">
                        <input type="text" value="${bloque.texto||'Botón'}" data-edit="texto" data-idx="${idx}" placeholder="Texto botón">
                        <input type="text" value="${bloque.url||''}" data-edit="url" data-idx="${idx}" placeholder="URL destino">
                        <button class="delete-block-btn bg-red-600 text-white px-2 rounded" data-idx="${idx}">Eliminar</button>
                    </div>`;
                    bloqueHTML = `<div class="p-2"><a href="${bloque.url||'#'}" class="btn btn-primario">${bloque.texto||'Botón'}</a></div>`;
                    break;
                case 'fondo':
                    menuEdicion = `<div class="menu-edicion p-2 bg-gray-800 rounded mb-2 flex flex-wrap gap-2">
                        <input type="color" value="${bloque.color||'#282828'}" data-edit="color" data-idx="${idx}" title="Color fondo">
                        <button class="delete-block-btn bg-red-600 text-white px-2 rounded" data-idx="${idx}">Eliminar</button>
                    </div>`;
                    bloqueHTML = `<div class="p-2" style="background:${bloque.color||'#282828'};height:60px;"></div>`;
                    break;
                default:
                    menuEdicion = '';
                    bloqueHTML = `<div class="p-2">Bloque desconocido</div>`;
            }
            designArea.innerHTML += `<div class="bloque-contenedor mb-4" draggable="true" data-idx="${idx}">${menuEdicion}${bloqueHTML}</div>`;
        });

        // Drag & Drop listeners (una vez renderizado)
        const contenedores = designArea.querySelectorAll('.bloque-contenedor');
        let dragSrcIdx = null;
        contenedores.forEach(el => {
            el.addEventListener('dragstart', (e) => {
                dragSrcIdx = Number(el.dataset.idx);
                e.dataTransfer.effectAllowed = 'move';
                el.classList.add('dragging');
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
            });
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            el.addEventListener('drop', async (e) => {
                e.preventDefault();
                const targetIdx = Number(el.dataset.idx);
                if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
                const moved = bloquesActuales.splice(dragSrcIdx, 1)[0];
                bloquesActuales.splice(targetIdx, 0, moved);
                for (let i = 0; i < bloquesActuales.length; i++) {
                    bloquesActuales[i].orden = i;
                    const bloqueDocId = bloquesActuales[i].id || bloquesActuales[i].docId;
                    if (bloqueDocId) {
                        try {
                            await updateDoc(doc(db, 'contenido_dinamico', String(bloqueDocId)), { orden: i });
                        } catch (err) {
                            console.error('Error actualizando orden:', err);
                        }
                    }
                }
                renderVistaPrevia(bloquesActuales);
            });
        });
    }
 // Evento para agregar bloque al hacer clic en icono
    blockBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tipo = btn.dataset.block;
            const nuevoBloque = {
                id: bloqueIdCounter++,
                tipo,
                orden: bloquesActuales.length,
                contenido: tipo==='texto'?'Texto de ejemplo':'',
                color: tipo==='fondo'? '#282828' : (tipo==='texto'? '#e6edf3' : undefined),
                fuente: 'Montserrat',
                tamano: 16,
                alineacion: 'left',
                negrita: false
            };
            bloquesActuales.push(nuevoBloque);
            renderVistaPrevia(bloquesActuales);
        });
    });

    // Evento para editar/eliminar bloque desde menú de edición
    if (designArea) {
        designArea.addEventListener('input', (e) => {
            const editType = e.target.dataset.edit;
            const idx = e.target.dataset.idx;
            if (editType && idx !== undefined) {
                const bloque = bloquesActuales[idx];
                if (!bloque) return;
                if (editType === 'color') bloque.color = e.target.value;
                if (editType === 'fuente') bloque.fuente = e.target.value;
                if (editType === 'tamano') bloque.tamano = e.target.value;
                if (editType === 'alineacion') bloque.alineacion = e.target.value;
                if (editType === 'negrita') bloque.negrita = e.target.checked;
                if (editType === 'contenido') bloque.contenido = e.target.value;
                if (editType === 'url') bloque.url = e.target.value;
                if (editType === 'texto') bloque.texto = e.target.value;
                renderVistaPrevia(bloquesActuales);
            }
        });

        designArea.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-block-btn')) {
                const idx = e.target.dataset.idx;
                bloquesActuales.splice(idx, 1);
                renderVistaPrevia(bloquesActuales);
            }
        });
    }
    // ... (all existing element gets)
    const loginErrorDiv = document.getElementById('login-error');

    // New elements for Visual Content
    const mainBannerForm = document.getElementById('main-banner-form');
    const mainBannerFileInput = document.getElementById('main-banner-file');
    const mainBannerPreview = document.getElementById('main-banner-preview');

    const certamenForm = document.getElementById('certamen-form');
    const certamenNombreInput = document.getElementById('certamen-nombre');
    const certamenesListDiv = document.getElementById('certamenes-list');

    // Modal de edición de certamen
    const editCertamenModal = document.getElementById('edit-certamen-modal');
    const editCertamenForm = document.getElementById('edit-certamen-form');
    const editCertamenIdInput = document.getElementById('edit-certamen-id');
    const editCertamenModalTitle = document.getElementById('edit-certamen-modal-title');
    const editCertamenCoverPreview = document.getElementById('edit-certamen-cover-preview');
    const editCertamenCoverFileInput = document.getElementById('edit-certamen-cover-file');
    const editCertamenVideoPreview = document.getElementById('edit-certamen-video-preview');
    const editCertamenVideoUrlInput = document.getElementById('edit-certamen-video-url');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');

    // Carousel elements
    const carouselForm = document.getElementById('carousel-form');
    const carouselFileInput = document.getElementById('carousel-file');
    const carouselItemsListDiv = document.getElementById('carousel-items-list');

    // Constructor Home elements
    const addBlockForm = document.getElementById('add-block-form');
    const blockTypeSelect = document.getElementById('block-type-select');
    const blockFieldsContainer = document.getElementById('block-fields-container');
    const blocksListContainer = document.getElementById('blocks-list-container');
    const pageSelector = document.getElementById('page-selector');
    const blockFileInput = document.getElementById('block-file-input');


    // Función para cargar bloques desde Firestore según la página seleccionada
    async function cargarBloquesDePagina(pagina) {
        const coleccion = `contenido_${pagina}`;
        const bloques = [];
        try {
            const q = query(collection(db, coleccion), orderBy('orden'));
            const snapshot = await getDocs(q);
            snapshot.forEach(docSnap => {
                bloques.push(docSnap.data());
            });
        } catch (err) {
            console.error('Error cargando bloques:', err);
        }
        bloquesActuales = bloques;
        renderVistaPrevia(bloquesActuales);
    }

    // Evento: cambiar página en el constructor
    if (constructorPageSelect) {
        constructorPageSelect.addEventListener('change', (e) => {
            const pagina = e.target.value;
            cargarBloquesDePagina(pagina);
        });
        // Cargar la página por defecto al iniciar
        cargarBloquesDePagina(constructorPageSelect.value);
    }

    // (Espacio reservado para futura lógica visual adicional)


    const homeVideoForm = document.getElementById('home-video-form');
    const homeVideoIdInput = document.getElementById('home-video-id');
    const homeVideoUrlInput = document.getElementById('home-video-url');
    const homeVideoTituloInput = document.getElementById('home-video-titulo');
    const homeVideoDescInput = document.getElementById('home-video-descripcion');
    const homeVideoCategoriaInput = document.getElementById('home-video-categoria');
    const homeVideoOrdenInput = document.getElementById('home-video-orden');
    const homeVideosListDiv = document.getElementById('home-videos-list');


    const hamburgerBtnBottom = document.getElementById('hamburger-btn-bottom');
    const sidebar = document.querySelector('.sidebar'); // Get the sidebar element
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (hamburgerBtnBottom && sidebar && sidebarOverlay) {
        hamburgerBtnBottom.addEventListener('click', () => {
            sidebar.classList.toggle('active-sidebar');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active-sidebar');
            sidebarOverlay.classList.remove('active');
        });

        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.addEventListener('click', (e) => {
                // Check if a link inside the menu was clicked
                if (e.target.closest('a')) {
                    sidebar.classList.remove('active-sidebar');
                    sidebarOverlay.classList.remove('active');
                }
            });
        }
    }

    // Existing element gets (added for clarity and use in showPage)
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginBtn = document.getElementById('login-btn');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    // Eliminada declaración duplicada de loginErrorDiv
    const logoutBtn = document.getElementById('logout-btn');
    const adminUserEmailSpan = document.getElementById('admin-user-email');

    // Elements for Prize Pool
    const pozoTotalSpan = document.getElementById('pozo-total');
    const pozoInput = document.getElementById('pozo-input');
    const updatePozoBtn = document.getElementById('update-pozo-btn');
    const pozoFormStatusDiv = document.getElementById('pozo-form-status');

    // Elements for Votes Chart
    const votosChartCanvas = document.getElementById('votosChart');

    // Function to show/hide pages and manage active navigation links
    function showPage(pageId) {
        console.log('Attempting to show page:', pageId);
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        const targetElement = document.getElementById(pageId);
        if (targetElement) {
            targetElement.classList.remove('hidden');
        } else {
            console.error('Element with ID', pageId, 'not found.');
        }

        document.querySelectorAll('.nav-menu a, .bottom-nav a').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-target="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // --- Prize Pool Logic ---
    const loadPozoAcumulado = async () => {
        try {
            const docRef = doc(db, "admin_settings", "settings");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                pozoTotalSpan.textContent = `$ ${data.pozoAcumulado ? data.pozoAcumulado.toLocaleString('es-AR') : '0'}`;
                pozoInput.value = data.pozoAcumulado || '';
            } else {
                pozoTotalSpan.textContent = '$ 0';
                pozoInput.value = '';
            }
        } catch (error) {
            console.error("Error loading prize pool:", error);
            pozoFormStatusDiv.textContent = 'Error al cargar el pozo de premios.';
            pozoFormStatusDiv.classList.remove('hidden');
            pozoFormStatusDiv.classList.add('alert-error');
        }
    };

    updatePozoBtn.addEventListener('click', async () => {
        const newPozo = parseFloat(pozoInput.value);
        if (isNaN(newPozo) || newPozo < 0) {
            pozoFormStatusDiv.textContent = 'Por favor, ingresa un valor numérico válido para el pozo.';
            pozoFormStatusDiv.classList.remove('hidden');
            pozoFormStatusDiv.classList.add('alert-error');
            return;
        }

        try {
            const docRef = doc(db, "admin_settings", "settings");
            await setDoc(docRef, { pozoAcumulado: newPozo }, { merge: true });
            pozoFormStatusDiv.textContent = 'Pozo de premios actualizado correctamente.';
            pozoFormStatusDiv.classList.remove('hidden');
            pozoFormStatusDiv.classList.remove('alert-error');
            pozoFormStatusDiv.classList.add('alert-success');
            loadPozoAcumulado(); // Refresh display
        } catch (error) {
            console.error("Error updating prize pool:", error);
            pozoFormStatusDiv.textContent = `Error al actualizar el pozo: ${error.message}`;
            pozoFormStatusDiv.classList.remove('hidden');
            pozoFormStatusDiv.classList.add('alert-error');
            pozoFormStatusDiv.classList.remove('alert-success');
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            adminUserEmailSpan.textContent = `Bienvenido, ${user.email}`;
            showPage('page-dashboard'); // Show dashboard after login
            loadMainBanner();
            loadCarouselItems();
            loadCertamenes();
            loadHomeVideos();
            loadBuilderBlocks(); // Changed to a more generic name
            loadInscVideos();
            setupRealtimeListeners(); // Assuming this is part of existing setup
            loadBasesYCondiciones();
            loadPozoAcumulado(); // Load prize pool on login
            initializeVotosChart(); // Initialize votes chart
            setupVotosRealtimeListener(); // Setup real-time votes listener
            updatePageDisplays(); // Initial call for page constructor
        } else {
            loginSection.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
        }
    }); // <-- Close onAuthStateChanged callback

    // Login Function
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = adminEmailInput.value;
            const password = adminPasswordInput.value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginErrorDiv.classList.add('hidden');
                // Mostrar dashboard tras login exitoso
                loginSection.classList.add('hidden');
                adminDashboard.classList.remove('hidden');
            } catch (error) {
                loginErrorDiv.textContent = `Error de inicio de sesión: ${error.message}`;
                loginErrorDiv.classList.remove('hidden');
                console.error("Login error:", error);
            }
        });
    }

    // Logout Function
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                // onAuthStateChanged will handle showing login section
            } catch (error) {
                console.error("Logout error:", error);
                alert("Error al cerrar sesión.");
            }
        });
    }

    // Navigation links
    document.querySelectorAll('.nav-menu a[data-target], .bottom-nav a[data-target]').forEach(link => {
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = e.currentTarget.dataset.target;
                showPage(targetPage);
            });
        }
    });

    // --- Votes Chart Logic ---
    let votosChart; // Declare chart variable globally within DOMContentLoaded scope

    const initializeVotosChart = () => {
        const ctx = votosChartCanvas.getContext('2d');
        votosChart = new Chart(ctx, {
            type: 'bar', // Or 'pie', 'doughnut', etc. based on preference
            data: {
                labels: ['Total Votos'], // Example label
                datasets: [{
                    label: 'Votos',
                    data: [0], // Initial data
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    };

    const setupVotosRealtimeListener = () => {
        const docRef = doc(db, "admin_settings", "settings"); // Assuming total votes are here
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const totalVotos = data.totalVotos || 0; // Assuming a 'totalVotos' field
                document.getElementById('stats-votos').textContent = totalVotos.toLocaleString('es-AR');

                if (votosChart) {
                    votosChart.data.datasets[0].data[0] = totalVotos;
                    votosChart.update();
                }
            } else {
                document.getElementById('stats-votos').textContent = '0';
                if (votosChart) {
                    votosChart.data.datasets[0].data[0] = 0;
                    votosChart.update();
                }
            }
        }, (error) => {
            console.error("Error getting real-time votes:", error);
            // Optionally display an error message on the dashboard
        });
    };

    // --- (all existing logic for other pages) ---

    // --- New Logic for Visual Content ---

    // --- Main Banner Logic ---
    const loadMainBanner = async () => {
        try {
            const docRef = doc(db, "contenido_visual", "banner_principal");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().imageUrl) {
                mainBannerPreview.innerHTML = `<img src="${docSnap.data().imageUrl}" alt="Banner Principal" class="max-h-60 rounded-lg object-contain">`;
            } else {
                mainBannerPreview.innerHTML = '<p class="text-gray-500">No hay un banner principal configurado.</p>';
            }
        } catch (error) {
            console.error("Error loading main banner:", error);
            mainBannerPreview.innerHTML = '<p class="text-red-500">Error al cargar el banner.</p>';
        }
    };

    mainBannerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = mainBannerFileInput.files[0];
        if (!file) {
            alert("Por favor, selecciona una imagen para el banner.");
            return;
        }

        try {
            const storageRef = ref(storage, `banners/principal_${Date.now()}_${file.name}`); // The path in storage
            const uploadTask = await uploadBytesResumable(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);

            const docRef = doc(db, "contenido_visual", "banner_principal");
            await setDoc(docRef, { imageUrl: imageUrl, updatedAt: serverTimestamp() });

            alert("Banner principal actualizado correctamente.");
            loadMainBanner();
            mainBannerForm.reset();
        } catch (error) {
            console.error("Error updating main banner:", error);
            alert("Error al actualizar el banner.");
        }
    });

    // --- Carousel Logic ---
    const loadCarouselItems = async () => {
        carouselItemsListDiv.innerHTML = '<p class="text-gray-500">Cargando...</p>';
        try {
            const q = query(collection(db, "carrusel_home"), orderBy("order", "asc"));
            const querySnapshot = await getDocs(q);
            carouselItemsListDiv.innerHTML = '';
            if (querySnapshot.empty) {
                carouselItemsListDiv.innerHTML = '<p class="text-gray-500">No hay imágenes en el carrusel.</p>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const item = doc.data();
                const itemDiv = document.createElement('div');
                itemDiv.className = 'artist-list-item';
                itemDiv.innerHTML = `
                    <div class="flex items-center gap-4">
                        <img src="${item.url}" alt="Carousel Item" class="w-24 h-12 object-cover rounded-md bg-gray-700">
                        <p class="text-xs text-gray-400 break-all">${item.url}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-red-600 text-white px-3 py-1 rounded-full text-sm delete-carousel-item-btn" data-id="${doc.id}">Eliminar</button>
                    </div>
                `;
                carouselItemsListDiv.appendChild(itemDiv);
            });
        } catch (error) {
            console.error("Error loading carousel items:", error);
            carouselItemsListDiv.innerHTML = '<p class="text-red-500">Error al cargar los ítems del carrusel.</p>';
        }
    };

    carouselForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = carouselFileInput.files[0];
        if (!file) {
            alert("Por favor, selecciona un archivo.");
            return;
        }

        try {
            const storageRef = ref(storage, `carousel/${Date.now()}_${file.name}`);
            await uploadBytesResumable(storageRef, file);
            const fileUrl = await getDownloadURL(storageRef);

            const docCountSnapshot = await getDocs(collection(db, "carrusel_home"));
            const newOrder = docCountSnapshot.size;

            const itemData = {
                url: fileUrl,
                type: file.type.startsWith('video') ? 'video' : 'image',
                order: newOrder,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "carrusel_home"), itemData);
            alert("Ítem añadido al carrusel.");
            carouselForm.reset();
            loadCarouselItems();
        } catch (error) {
            console.error("Error adding to carousel:", error);
            alert("Error al añadir el ítem al carrusel.");
        }
    });

    carouselItemsListDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-carousel-item-btn')) {
            const docId = e.target.dataset.id;
            if (confirm("¿Estás seguro de que quieres eliminar esta imagen del carrusel?")) {
                await deleteDoc(doc(db, "carrusel_home", docId));
                loadCarouselItems(); // Refresh the list
            }
        }
    });

    // --- Certamenes Logic ---
    const loadCertamenes = async () => {
        certamenesListDiv.innerHTML = '<p class="text-gray-500">Cargando certámenes...</p>';;
        try {
            const q = query(collection(db, "certamenes_online"), orderBy("orden", "asc"));
            const querySnapshot = await getDocs(q);
            certamenesListDiv.innerHTML = '';
            if (querySnapshot.empty) {
                certamenesListDiv.innerHTML = '<p class="text-gray-500">No hay certámenes creados.</p>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const certamen = doc.data();
                const item = document.createElement('div');
                item.className = 'artist-list-item';
                item.innerHTML = `
                    <div class="flex items-center gap-4">
                        <img src="${certamen.imageUrl || 'https://placehold.co/64x64/374151/9ca3af?text=VYT'}" alt="Portada" class="w-16 h-16 object-cover rounded-md bg-gray-700">
                        <div>
                            <p class="font-semibold">${certamen.name}</p>
                            <p class="text-xs text-gray-400">${certamen.descripcion || 'Sin descripción'}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-secundario px-3 py-1 text-sm edit-certamen-btn" data-id="${doc.id}">Editar</button>
                        <button class="bg-red-600 text-white px-3 py-1 rounded-full text-sm delete-certamen-btn" data-id="${doc.id}">Eliminar</button>
                    </div>
                `;
                certamenesListDiv.appendChild(item);
            });
        } catch (error) {
            console.error("Error loading certamenes:", error);
            certamenesListDiv.innerHTML = '<p class="text-red-500">Error al cargar los certámenes.</p>';
        }
    };

    certamenesListDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-certamen-btn')) {
            const docId = e.target.dataset.id;
            if (confirm("¿Estás seguro de que quieres eliminar este certamen? Esto podría afectar portadas asociadas.")) {
                await deleteDoc(doc(db, "certamenes_online", docId));
                loadCertamenes();
            }
        }
        if (e.target.classList.contains('edit-certamen-btn')) {
            // This is the new logic to open the modal
            const docId = e.target.dataset.id;
            const docRef = doc(db, "certamenes_online", docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                editCertamenIdInput.value = docId;
                editCertamenModalTitle.textContent = data.name;
                editCertamenCoverPreview.innerHTML = data.imageUrl ? `<img src="${data.imageUrl}" class="max-h-40 rounded-lg object-contain">` : '<p class="text-gray-500">Sin portada</p>';
                editCertamenVideoUrlInput.value = data.videoUrl || '';
                editCertamenVideoPreview.innerHTML = data.videoUrl ? `<iframe src="https://www.youtube.com/embed/${getYouTubeVideoId(data.videoUrl)}" class="w-full aspect-video rounded-lg"></iframe>` : '<p class="text-gray-500">Sin video</p>';
                editCertamenModal.classList.remove('hidden');
            }
        }
    });

    closeEditModalBtn.addEventListener('click', () => {
        editCertamenModal.classList.add('hidden');
    });

    editCertamenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const certamenId = editCertamenIdInput.value;
        const coverFile = editCertamenCoverFileInput.files[0];
        const videoUrl = editCertamenVideoUrlInput.value;

        const updates = {
            videoUrl: videoUrl || "" // Save empty string if cleared
        };

        try {
            if (coverFile) {
                const storageRef = ref(storage, `certamenes/portadas/${Date.now()}_${coverFile.name}`);
                await uploadBytesResumable(storageRef, coverFile);
                const imageUrl = await getDownloadURL(storageRef);
                updates.imageUrl = imageUrl;
            }

            const docRef = doc(db, "certamenes_online", certamenId);
            await updateDoc(docRef, updates);

            alert("Certamen actualizado correctamente.");
            editCertamenModal.classList.add('hidden');
            loadCertamenes();
        } catch (error) {
            console.error("Error al actualizar certamen:", error);
            alert("Error al actualizar certamen.");
        }
    }); // <-- cierre del event listener

    const loadHomeVideos = async () => {
        homeVideosListDiv.innerHTML = '<p class="text-gray-500">Cargando videos...</p>';
        try {
            const q = query(collection(db, "videos_home"), orderBy("orden"));
            const querySnapshot = await getDocs(q);
            homeVideosListDiv.innerHTML = '';
            if(querySnapshot.empty) {
                homeVideosListDiv.innerHTML = '<p class="text-gray-500">No hay videos de inicio cargados.</p>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const video = doc.data();
                const videoItem = document.createElement('div');
                videoItem.className = 'artist-list-item';
                videoItem.innerHTML = `
                    <div>
                        <p class="font-semibold">${video.titulo} <span class="text-xs text-gray-400">(${video.categoria || 'Sin categoría'})</span></p>
                        <a href="${video.url_youtube}" target="_blank" class="text-xs text-blue-400 break-words">${video.url_youtube}</a>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-red-600 text-white px-3 py-1 rounded-full text-sm delete-home-video-btn" data-id="${doc.id}">Eliminar</button>
                    </div>
                `;
                homeVideosListDiv.appendChild(videoItem);
            });
        } catch (error) {
            console.error("Error loading home videos: ", error);
            homeVideosListDiv.innerHTML = '<p class="text-red-500">Error al cargar los videos.</p>';
        }
    };

    // Función para guardar video de inicio
    async function saveHomeVideo(e) {
        e.preventDefault();
        const videoData = {
            url_youtube: homeVideoUrlInput.value,
            titulo: homeVideoTituloInput.value,
            descripcion: homeVideoDescInput.value,
            categoria: homeVideoCategoriaInput.value,
            orden: Number(homeVideoOrdenInput.value) || 0,
            createdAt: serverTimestamp()
        };
        try {
            await addDoc(collection(db, "videos_home"), videoData);
            alert('Video de inicio guardado correctamente');
            homeVideoForm.reset();
            loadHomeVideos();
        } catch (error) {
            console.error("Error saving home video: ", error);
            alert("Error al guardar el video.");
        }
    }

    const inscVideoForm = document.getElementById('insc-video-form');
    const inscVideoUrlInput = document.getElementById('insc-video-url');
    const inscVideoTipoInput = document.getElementById('insc-video-tipo');
    const inscVideosListDiv = document.getElementById('insc-videos-list');

    const deleteHomeVideo = async (id) => {
        if (confirm("¿Estás seguro de que quieres eliminar este video?")) {
            try {
                await deleteDoc(doc(db, "videos_home", id));
                alert('Video eliminado.');
                loadHomeVideos();
            } catch (error) {
                console.error("Error deleting home video: ", error);
                alert('Error al eliminar el video.');
            }
        }
    };

    // --- Inscription Video Logic ---
    const saveInscVideo = async (e) => {
        e.preventDefault();
        const videoData = {
            url_youtube: inscVideoUrlInput.value,
            tipo_certamen: inscVideoTipoInput.value,
            activo: true, // Always active when added
            createdAt: serverTimestamp()
        };

        try {
            const q = query(collection(db, "videos_inscripcion"), where("tipo_certamen", "==", videoData.tipo_certamen), where("activo", "==", true));
            const activeDocs = await getDocs(q);
            for (const docSnap of activeDocs.docs) {
                await updateDoc(doc(db, "videos_inscripcion", docSnap.id), { activo: false });
            }

            await addDoc(collection(db, "videos_inscripcion"), videoData);
            alert('Video de inscripción guardado correctamente');
            inscVideoForm.reset();
            loadInscVideos();
        } catch (error) {
            console.error("Error saving inscription video: ", error);
            alert("Error al guardar el video.");
        }
    };

    const loadInscVideos = async () => {
        inscVideosListDiv.innerHTML = '<p class="text-gray-500">Cargando videos...</p>';
        try {
            const q = query(collection(db, "videos_inscripcion"), where("activo", "==", true), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            inscVideosListDiv.innerHTML = '';
            if(querySnapshot.empty) {
                inscVideosListDiv.innerHTML = '<p class="text-gray-500">No hay videos de inscripción cargados.</p>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const video = doc.data();
                const videoItem = document.createElement('div');
                // Función para extraer el ID de video de YouTube de varios formatos de URL
                const getYouTubeVideoId = (url) => {
                    if (!url) return null;
                    let videoId = null;
                    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
                    const match = url.match(regex);
                    if (match && match[1]) {
                        videoId = match[1];
                    }
                    return videoId;
                };
                videoItem.className = `artist-list-item ${video.activo ? 'border-l-4 border-green-500' : 'opacity-50'}`;
                const youtubeVideoId = getYouTubeVideoId(video.url_youtube);
                const embedUrl = youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : '';

                console.log("Cargando video de inscripción:", video.url_youtube, "Tipo:", video.tipo_certamen, "Activo:", video.activo, "ID de YouTube:", youtubeVideoId);

                videoItem.innerHTML = `
                    <div>
                        <p class="font-semibold">Tipo: ${video.tipo_certamen.charAt(0).toUpperCase() + video.tipo_certamen.slice(1)}</p>
                        ${embedUrl ? `<iframe width="100%" height="200" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : `<p class="text-red-400 text-xs">URL de video no válida o no disponible.</p>`}
                        <p class="text-xs text-gray-400">Estado: ${video.activo ? 'Activo' : 'Inactivo'}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-red-600 text-white px-3 py-1 rounded-full text-sm delete-insc-video-btn" data-id="${doc.id}">Eliminar</button>
                    </div>
                `;
                inscVideosListDiv.appendChild(videoItem);
            });
        } catch (error) {
            console.error("Error loading inscription videos: ", error);
            inscVideosListDiv.innerHTML = '<p class="text-red-500">Error al cargar los videos.</p>';
        }
    };

    const deleteInscVideo = async (id) => {
        if (confirm("¿Estás seguro de que quieres eliminar este video?")) {
            try {
                await deleteDoc(doc(db, "videos_inscripcion", id));
                alert('Video eliminado.');
                loadInscVideos();
            } catch (error) {
                console.error("Error deleting inscription video: ", error);
                alert('Error al eliminar el video.');
            }
        }
    };

    // --- Home Page Builder Logic ---
    pageSelector.addEventListener('change', () => {
        loadBuilderBlocks();
    });


    blockTypeSelect.addEventListener('change', () => {
        const selectedType = blockTypeSelect.value;
        document.querySelectorAll('#block-fields-container .block-field').forEach(field => {
            field.classList.add('hidden');
        });

        if (selectedType === 'titulo') {
            document.querySelector('.block-field[data-type="titulo"]').classList.remove('hidden');
        } else if (selectedType === 'parrafo') {
            document.querySelector('.block-field[data-type="parrafo"]').classList.remove('hidden');
        } else if (selectedType === 'banner' || selectedType === 'pdf') {
            document.querySelector('.block-field[data-type="file-upload"]').classList.remove('hidden');
            blockFileInput.accept = selectedType === 'pdf' ? '.pdf' : 'image/*';
        } else if (selectedType === 'video') {
            document.querySelector('.block-field[data-type="video"]').classList.remove('hidden');
        }
    });

    addBlockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = blockTypeSelect.value;
        const pageId = pageSelector.value;
        const q = query(collection(db, "contenido_dinamico"), where("page_id", "==", pageId));
        const snapshot = await getDocs(q);
        const order = snapshot.size; // New block goes last

        let blockData = { page_id: pageId, tipo: type, orden: order, createdAt: serverTimestamp(), contenido: {}, estilos: {} };

        try {
            if (type === 'titulo') {
                blockData.contenido.texto = document.getElementById('block-titulo-texto').value;
            } else if (type === 'parrafo') {
                blockData.contenido.texto = document.getElementById('block-parrafo-texto').value;
            } else if (type === 'video') {
                blockData.contenido.url = document.getElementById('block-video-url').value;
            } else if (type === 'banner' || type === 'pdf') {
                const file = blockFileInput.files[0];
                if (!file) {
                    alert('Por favor, selecciona un archivo.');
                    return;
                }
                const storagePath = type === 'banner' ? 'home_builder/banners' : 'home_builder/pdfs';
                const storageRef = ref(storage, `${storagePath}/${Date.now()}_${file.name}`);
                await uploadBytesResumable(storageRef, file);
                blockData.contenido.url = await getDownloadURL(storageRef);
            }
            // For 'blog' and 'certamenes', content is implicit, no extra data needed on creation

            await addDoc(collection(db, "contenido_dinamico"), blockData);
            alert('Bloque añadido correctamente.');
            addBlockForm.reset();
            blockTypeSelect.dispatchEvent(new Event('change')); // Reset fields visibility
            loadBuilderBlocks();
        } catch (error) {
            console.error("Error adding block:", error);
            alert('Error al añadir el bloque.');
        }
    });

    const loadBuilderBlocks = async () => {
        const pageId = pageSelector.value;
        blocksListContainer.innerHTML = '<p class="text-gray-500">Cargando bloques...</p>';
        try {
            const q = query(collection(db, "contenido_dinamico"), where("page_id", "==", pageId), orderBy("orden", "asc"));
            const querySnapshot = await getDocs(q);
            blocksListContainer.innerHTML = '';
            if (querySnapshot.empty) {
                blocksListContainer.innerHTML = '<p class="text-gray-500">No hay bloques creados. ¡Añade el primero!</p>';
                return;
            }
            let blockElements = [];
            querySnapshot.forEach((doc) => {
                const block = doc.data();
                const blockDiv = document.createElement('div');
                blockDiv.className = 'artist-list-item';
                blockDiv.dataset.id = doc.id;
                blockDiv.dataset.order = block.orden;
                let contentPreview = '';
                switch (block.tipo) {
                    case 'titulo': contentPreview = `<p class="font-bold text-lg">${block.contenido.texto}</p>`; break;
                    case 'parrafo': contentPreview = `<p class="text-sm text-gray-400 truncate">${block.contenido.texto}</p>`; break;
                    case 'banner': contentPreview = `<img src="${block.contenido.url}" class="w-24 h-12 object-cover rounded-md">`; break;
                    case 'video': contentPreview = `<p class="text-xs text-blue-400 break-all">${block.contenido.url}</p>`; break;
                    case 'pdf': contentPreview = `<p class="text-xs text-red-400 break-all">${block.contenido.url}</p>`; break;
                    case 'blog': contentPreview = `<p class="text-sm text-gray-300">Carrusel de Novedades del Blog</p>`; break;
                    case 'certamenes': contentPreview = `<p class="text-sm text-gray-300">Grilla de Certámenes</p>`; break;
                }
                blockDiv.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="flex flex-col gap-1">
                            <button class="arrow-btn move-up" data-id="${doc.id}" data-order="${block.orden}">▲</button>
                            <button class="arrow-btn move-down" data-id="${doc.id}" data-order="${block.orden}">▼</button>
                        </div>
                        <div>
                            <p class="font-semibold text-cyan-400 uppercase text-xs">${block.tipo}</p>
                            ${contentPreview}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-red-600 text-white px-3 py-1 rounded-full text-sm delete-block-btn" data-id="${doc.id}">Eliminar</button>
                    </div>
                `;
                blockElements.push(blockDiv);
            });
            blockElements.forEach(el => blocksListContainer.appendChild(el));
        } catch (error) {
            // Solo mostrar el mensaje de error si realmente ocurre un fallo
            console.error("Error al cargar los bloques:", error);
            blocksListContainer.innerHTML = '<p class="text-red-500">Error al cargar los bloques.<br><span class="text-xs">' + (error.message || error) + '</span></p>';
        }
    };

    blocksListContainer.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;

        if (target.classList.contains('delete-block-btn')) {
            if (confirm('¿Estás seguro de que quieres eliminar este bloque?')) {
                await deleteDoc(doc(db, "contenido_dinamico", id));
                loadBuilderBlocks(); // Re-render and re-calculate order
            }
        }
        // Note: Reordering logic will be more complex, involving swapping 'orden' fields.
        // For simplicity in this implementation, reordering is not fully implemented with arrows.
        // A drag-and-drop library would be ideal here.
    });


    // --- Event Listeners for new forms ---
    certamenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const certamenData = {
            name: document.getElementById('certamen-nombre').value,
            descripcion: document.getElementById('certamen-descripcion').value,
            orden: Number(document.getElementById('certamen-orden').value) || 0,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "certamenes_online"), certamenData);
        alert("Certamen guardado.");
        certamenForm.reset();
        loadCertamenes(); // Refresh lists
    });

    homeVideoForm.addEventListener('submit', saveHomeVideo);
    inscVideoForm.addEventListener('submit', saveInscVideo);

    homeVideosListDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-home-video-btn')) {
            deleteHomeVideo(e.target.dataset.id);
        }
    });

    inscVideosListDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-insc-video-btn')) {
            deleteInscVideo(e.target.dataset.id);
        }
    });

    // Helper function to extract YouTube ID
    function getYouTubeVideoId(url) {
        if (!url) return null;
        let videoId = null;
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regex);
        if (match && match[1]) { videoId = match[1]; }
        return videoId;
    }

    // --- Logic for Participant Discount ---
    const applyDiscount = async (coleccion, docId) => {
        if(confirm("¿Estás seguro de que quieres aplicar el descuento a este participante?")) {
            try {
                const participantRef = doc(db, coleccion, docId);
                await updateDoc(participantRef, { descuento_aplicado: true });
                alert("Descuento aplicado correctamente.");
                // The listener will refresh the list automatically
            } catch (error) {
                console.error("Error applying discount: ", error);
                alert("Error al aplicar el descuento.");
            }
        }
    };

    // Modify the main click listener to include the new button
    document.addEventListener('click', async (e) => {
        // ... (existing approve, reject, delete logic)

        if (e.target.classList.contains('apply-discount-btn')) {
            const docId = e.target.dataset.id;
            const modalidad = e.target.dataset.modalidad;
            const coleccion = modalidad === 'online' ? "participantes_online" : "participantes_presenciales";
            applyDiscount(coleccion, docId);
        }
    });

    // --- Modify Participant Rendering in setupRealtimeListeners ---
    function setupRealtimeListeners() {
        // Modify how participants are rendered to include new fields
        const renderParticipant = (doc, data, modalidad) => {
            const isPrueba = data.tipo_inscripcion === 'prueba'; // Assuming this field will exist
            let extraInfo = ``;
            if (isPrueba) {
                extraInfo = `
                    <p class="text-xs text-yellow-400">Votos Gratuitos: ${data.votos_gratuitos || 0}</p>
                    <p class="text-xs ${data.descuento_aplicado ? 'text-green-400' : 'text-red-400'}">Descuento: ${data.descuento_aplicado ? 'Aplicado' : 'No Aplicado'}</p>
                `;
            }

            let actionButtons = `
                <button class="btn btn-primario px-3 py-1 text-sm approve-btn" data-id="${doc.id}" data-modalidad="${modalidad}">Aprobar</button>
                <button class="bg-red-600 text-white px-3 py-1 rounded-full text-sm reject-btn" data-id="${doc.id}" data-modalidad="${modalidad}">Rechazar</button>
                <button class="bg-gray-600 text-white px-3 py-1 rounded-full text-sm delete-btn" data-id="${doc.id}" data-modalidad="${modalidad}">Eliminar</button>
            `;

            if (data.aprobado) {
                actionButtons = `<button class="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm disapprove-btn" data-id="${doc.id}" data-modalidad="${modalidad}">Desaprobar</button>`;
            }

            if (isPrueba && !data.descuento_aplicado) {
                actionButtons += `<button class="btn btn-secundario px-3 py-1 text-sm apply-discount-btn" data-id="${doc.id}" data-modalidad="${modalidad}">Aplicar Descuento</button>`;
            }

            return `
                <div class="artist-info">
                    ${data.foto_url ? `<img src="${data.foto_url}" alt="Foto de ${data.nombre_artista}" class="artist-photo">` : ''}
                    <div>
                        <p class="font-semibold">${data.nombre_artista}</p>
                        <p class="text-xs text-gray-400">Modalidad: ${modalidad.charAt(0).toUpperCase() + modalidad.slice(1)}</p>
                        <p class="text-xs text-blue-400 break-words"><a href="${data.video_link}" target="_blank">Ver video</a></p>
                        ${extraInfo}
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">${actionButtons}</div>
            `;
        };

        // Refactor listeners to use the renderParticipant function
        const collections = ["participantes_online", "participantes_presenciales"];
        collections.forEach(col => {
            const modalidad = col.includes('online') ? 'online' : 'presencial';
            // Pending
            const pendingRef = query(collection(db, col), where("aprobado", "==", false));
            onSnapshot(pendingRef, snapshot => {
                const listEl = document.getElementById(`${col.replace('_', '-')}-list`);
                listEl.innerHTML = '';
                if (snapshot.empty) listEl.innerHTML = `<p class="text-gray-500">No hay inscripciones pendientes.</p>`;
                else snapshot.forEach(doc => {
                    const item = document.createElement('div');
                    item.className = 'artist-list-item';
                    item.innerHTML = renderParticipant(doc, doc.data(), modalidad);
                    listEl.appendChild(item);
                });
            });
            // Approved
            const approvedRef = query(collection(db, col), where("aprobado", "==", true));
            onSnapshot(approvedRef, snapshot => {
                const listEl = document.getElementById(`${col.replace('_', '-')}-aprobados-list`);
                listEl.innerHTML = '';
                if (snapshot.empty) listEl.innerHTML = `<p class="text-gray-500">No hay inscripciones aprobadas.</p>`;
                else snapshot.forEach(doc => {
                    const item = document.createElement('div');
                    item.className = 'artist-list-item';
                    item.innerHTML = renderParticipant(doc, doc.data(), modalidad);
                    listEl.appendChild(item);
                });
            });
        });
    } // <-- cierre de setupRealtimeListeners
    // Llamar a los listeners en el flujo principal
    setupRealtimeListeners();
    // Aquí puedes agregar lógica adicional si es necesario
});

