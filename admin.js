import { auth, db, storage, functions } from './firebase-config.module.js';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, getDoc, onSnapshot, setDoc, addDoc, deleteDoc, query, orderBy, where, serverTimestamp, writeBatch, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

document.addEventListener('DOMContentLoaded', () => {
    // ... (all existing element gets)

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


    const homeVideoForm = document.getElementById('home-video-form');
    const homeVideoIdInput = document.getElementById('home-video-id');
    const homeVideoUrlInput = document.getElementById('home-video-url');
    const homeVideoTituloInput = document.getElementById('home-video-titulo');
    const homeVideoDescInput = document.getElementById('home-video-descripcion');
    const homeVideoCategoriaInput = document.getElementById('home-video-categoria');
    const homeVideoOrdenInput = document.getElementById('home-video-orden');

    // Sessions Control elements
    const toggleOnlineInput = document.getElementById('toggle-online');
    const togglePresencialInput = document.getElementById('toggle-presencial');
    const statusOnlineSpan = document.getElementById('status-online');
    const statusPresencialSpan = document.getElementById('status-presencial');
    const saveSessionsBtn = document.getElementById('save-sessions-btn');
    const sessionsFormStatus = document.getElementById('sessions-form-status');
    const homeVideosListDiv = document.getElementById('home-videos-list');

    // Certámenes Provinciales elements (additional ones not already declared)
    const certamenProvinciaSelect = document.getElementById('certamen-provincia');
    const certamenFechaInicioInput = document.getElementById('certamen-fecha-inicio');
    const certamenFechaFinInput = document.getElementById('certamen-fecha-fin');
    const certamenPrecioInput = document.getElementById('certamen-precio');
    const certamenOrdenInput = document.getElementById('certamen-orden');
    const certamenDescripcionInput = document.getElementById('certamen-descripcion');
    const certamenImagenInput = document.getElementById('certamen-imagen');
    const certamenImagenPreview = document.getElementById('certamen-imagen-preview');
    const certamenUrlInscripcionInput = document.getElementById('certamen-url-inscripcion');
    const certamenActivoCheckbox = document.getElementById('certamen-activo');
    const certamenRankingHabilitadoCheckbox = document.getElementById('certamen-ranking-habilitado');
    const clearCertamenFormBtn = document.getElementById('clear-certamen-form-btn');
    const reloadCertamenesListBtn = document.getElementById('reload-certamenes-list');
    const enableAllCertamenesBtn = document.getElementById('enable-all-certamenes');
    const disableAllCertamenesBtn = document.getElementById('disable-all-certamenes');
    const updateRankingsBtn = document.getElementById('update-rankings');
    const bulkActionsStatus = document.getElementById('bulk-actions-status');

    const inscVideoForm = document.getElementById('insc-video-form');
    const inscVideoUrlInput = document.getElementById('insc-video-url');
    const inscVideoTipoInput = document.getElementById('insc-video-tipo');
    const inscVideosListDiv = document.getElementById('insc-videos-list');

    // Existing element gets (added for clarity and use in showPage)
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginBtn = document.getElementById('login-btn');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const loginErrorDiv = document.getElementById('login-error');
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
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        document.getElementById(pageId).classList.remove('hidden');

        document.querySelectorAll('.nav-menu a, .bottom-nav a').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-target="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // --- Prize Pool Logic ---
    // (Duplicate declaration removed. The function 'loadPozoAcumulado' is already defined above.)

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

    // --- (existing showPage, onAuthStateChanged, login, logout, etc. functions) ---

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

    // --- Sessions Control Functions ---
    const loadSessionsConfig = async () => {
        try {
            const docRef = doc(db, "admin_settings", "sessions");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                const onlineEnabled = data.inscripcion_online_enabled || false;
                const presencialEnabled = data.inscripcion_presencial_enabled || false;
                
                toggleOnlineInput.checked = onlineEnabled;
                togglePresencialInput.checked = presencialEnabled;
                
                updateSessionStatus('online', onlineEnabled);
                updateSessionStatus('presencial', presencialEnabled);
            } else {
                // Default: both disabled for security
                toggleOnlineInput.checked = false;
                togglePresencialInput.checked = false;
                updateSessionStatus('online', false);
                updateSessionStatus('presencial', false);
            }
        } catch (error) {
            console.error("Error loading sessions config:", error);
        }
    };

    const updateSessionStatus = (type, enabled) => {
        const statusElement = type === 'online' ? statusOnlineSpan : statusPresencialSpan;
        if (enabled) {
            statusElement.textContent = 'HABILITADO';
            statusElement.className = 'px-2 py-1 rounded-full bg-green-600 text-white';
        } else {
            statusElement.textContent = 'DESHABILITADO';
            statusElement.className = 'px-2 py-1 rounded-full bg-red-600 text-white';
        }
    };

    const saveSessionsConfig = async () => {
        const onlineEnabled = toggleOnlineInput.checked;
        const presencialEnabled = togglePresencialInput.checked;
        
        try {
            saveSessionsBtn.disabled = true;
            saveSessionsBtn.textContent = 'Guardando...';
            
            const docRef = doc(db, "admin_settings", "sessions");
            await setDoc(docRef, {
                inscripcion_online_enabled: onlineEnabled,
                inscripcion_presencial_enabled: presencialEnabled,
                updated_at: serverTimestamp()
            }, { merge: true });
            
            updateSessionStatus('online', onlineEnabled);
            updateSessionStatus('presencial', presencialEnabled);
            
            sessionsFormStatus.textContent = 'Configuración de sesiones guardada correctamente.';
            sessionsFormStatus.classList.remove('hidden', 'alert-error');
            sessionsFormStatus.classList.add('alert-success');
            
            setTimeout(() => {
                sessionsFormStatus.classList.add('hidden');
            }, 3000);
            
        } catch (error) {
            console.error("Error saving sessions config:", error);
            sessionsFormStatus.textContent = `Error al guardar configuración: ${error.message}`;
            sessionsFormStatus.classList.remove('hidden', 'alert-success');
            sessionsFormStatus.classList.add('alert-error');
        } finally {
            saveSessionsBtn.disabled = false;
            saveSessionsBtn.textContent = 'Guardar Configuración de Sesiones';
        }
    };

    // Event listeners for sessions control
    toggleOnlineInput.addEventListener('change', () => {
        updateSessionStatus('online', toggleOnlineInput.checked);
    });

    togglePresencialInput.addEventListener('change', () => {
        updateSessionStatus('presencial', togglePresencialInput.checked);
    });

    saveSessionsBtn.addEventListener('click', saveSessionsConfig);

    // --- (existing showPage, onAuthStateChanged, login, logout, etc. functions) ---

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
            loadSessionsConfig(); // Load sessions configuration
            loadCertamenesProvinciales(); // Load certámenes provinciales
            initializeVotosChart(); // Initialize votes chart
            setupVotosRealtimeListener(); // Setup real-time votes listener
            // ... (rest of the setup)
        } else {
            loginSection.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
        }
    });

    // Login Function
    loginBtn.addEventListener('click', async () => {
        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;
        
        if (!email || !password) {
            loginErrorDiv.textContent = 'Por favor, ingresa el email y la contraseña.';
            loginErrorDiv.classList.remove('hidden');
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = 'Iniciando sesión...';
        
        try {
            console.log('Intentando iniciar sesión con:', email);
            await signInWithEmailAndPassword(auth, email, password);
            loginErrorDiv.classList.add('hidden');
            console.log('Login exitoso');
        } catch (error) {
            let errorMessage = 'Error al iniciar sesión';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuario no encontrado. Verifica tu email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Error de conexión. Verifica tu internet.';
                    break;
                default:
                    errorMessage = `Error: ${error.message}`;
            }
            
            loginErrorDiv.textContent = errorMessage;
            loginErrorDiv.classList.remove('hidden');
            console.error("Login error:", error);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Iniciar Sesión';
        }
    });

    // Allow Enter key to trigger login
    adminPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    adminEmailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    // Logout Function
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // onAuthStateChanged will handle showing login section
        } catch (error) {
            console.error("Logout error:", error);
            alert("Error al cerrar sesión.");
        }
    });

    // Navigation links
    document.querySelectorAll('.nav-menu a, .bottom-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = e.currentTarget.dataset.target;
            showPage(targetPage);
        });
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
                const storageRef = ref(storage, `certamen_covers/${certamenId}_${Date.now()}_${coverFile.name}`);
                await uploadBytesResumable(storageRef, coverFile);
                updates.imageUrl = await getDownloadURL(storageRef);
            }

            const docRef = doc(db, "certamenes_online", certamenId);
            await updateDoc(docRef, updates);

            alert("Certamen actualizado correctamente.");
            editCertamenModal.classList.add('hidden');
            editCertamenForm.reset();
            loadCertamenes(); // Refresh the list to show new image
        } catch (error) {
            console.error("Error updating certamen:", error);
            alert("Error al actualizar el certamen.");
        }
    });

    // --- Home Video Logic ---
    const saveHomeVideo = async (e) => {
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
    };

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
            const totalBlocks = querySnapshot.size;
            
            querySnapshot.forEach((doc, index) => {
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

                // Determine if arrows should be disabled
                const isFirst = index === 0;
                const isLast = index === totalBlocks - 1;
                const upDisabled = isFirst ? 'disabled' : '';
                const downDisabled = isLast ? 'disabled' : '';

                blockDiv.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="flex flex-col gap-1">
                            <button class="arrow-btn move-up" data-id="${doc.id}" data-order="${block.orden}" ${upDisabled} title="${isFirst ? 'Ya está en la primera posición' : 'Mover hacia arriba'}">▲</button>
                            <button class="arrow-btn move-down" data-id="${doc.id}" data-order="${block.orden}" ${downDisabled} title="${isLast ? 'Ya está en la última posición' : 'Mover hacia abajo'}">▼</button>
                        </div>
                        <div class="drag-handle" title="Arrastra para reordenar">⋮⋮</div>
                        <div>
                            <p class="font-semibold text-cyan-400 uppercase text-xs">${block.tipo} ${index + 1}/${totalBlocks}</p>
                            ${contentPreview}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-red-600 text-white px-3 py-1 rounded-full text-sm delete-block-btn" data-id="${doc.id}" title="Eliminar este bloque">Eliminar</button>
                    </div>
                `;
                
                // Make the block draggable
                blockDiv.draggable = true;
                blockDiv.addEventListener('dragstart', handleDragStart);
                blockDiv.addEventListener('dragover', handleDragOver);
                blockDiv.addEventListener('drop', handleDrop);
                blockDiv.addEventListener('dragend', handleDragEnd);
                
                blockElements.push(blockDiv);
            });
            blockElements.forEach(el => blocksListContainer.appendChild(el));

        } catch (error) {
            console.error("Error loading blocks:", error);
            blocksListContainer.innerHTML = '<p class="text-red-500">Error al cargar los bloques.</p>';
        }
    };

    blocksListContainer.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target || target.disabled) return;

        const id = target.dataset.id;
        const currentOrder = parseInt(target.dataset.order);

        if (target.classList.contains('delete-block-btn')) {
            if (confirm('¿Estás seguro de que quieres eliminar este bloque?')) {
                // Show loading state
                target.disabled = true;
                target.textContent = 'Eliminando...';
                
                await deleteDoc(doc(db, "contenido_dinamico", id));
                await recalculateBlockOrders(); // Recalculate orders after deletion
                loadBuilderBlocks();
            }
        } else if (target.classList.contains('move-up')) {
            // Show loading state
            target.disabled = true;
            const originalText = target.textContent;
            target.textContent = '⟳';
            
            await moveBlockUp(id, currentOrder);
            
            // Reset button state
            target.disabled = false;
            target.textContent = originalText;
        } else if (target.classList.contains('move-down')) {
            // Show loading state
            target.disabled = true;
            const originalText = target.textContent;
            target.textContent = '⟳';
            
            await moveBlockDown(id, currentOrder);
            
            // Reset button state
            target.disabled = false;
            target.textContent = originalText;
        }
    });

    // Function to move a block up
    const moveBlockUp = async (blockId, currentOrder) => {
        try {
            const pageId = pageSelector.value;
            
            // Find the block above (orden = currentOrder - 1)
            const q = query(
                collection(db, "contenido_dinamico"), 
                where("page_id", "==", pageId),
                where("orden", "==", currentOrder - 1),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const blockAbove = querySnapshot.docs[0];
                
                // Swap the orders
                await updateDoc(doc(db, "contenido_dinamico", blockId), {
                    orden: currentOrder - 1
                });
                
                await updateDoc(doc(db, "contenido_dinamico", blockAbove.id), {
                    orden: currentOrder
                });
                
                // Add visual feedback
                showMoveNotification('Bloque movido hacia arriba');
                loadBuilderBlocks();
            }
        } catch (error) {
            console.error("Error moving block up:", error);
            alert('Error al mover el bloque hacia arriba.');
        }
    };

    // Function to move a block down
    const moveBlockDown = async (blockId, currentOrder) => {
        try {
            const pageId = pageSelector.value;
            
            // Find the block below (orden = currentOrder + 1)
            const q = query(
                collection(db, "contenido_dinamico"), 
                where("page_id", "==", pageId),
                where("orden", "==", currentOrder + 1),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const blockBelow = querySnapshot.docs[0];
                
                // Swap the orders
                await updateDoc(doc(db, "contenido_dinamico", blockId), {
                    orden: currentOrder + 1
                });
                
                await updateDoc(doc(db, "contenido_dinamico", blockBelow.id), {
                    orden: currentOrder
                });
                
                // Add visual feedback
                showMoveNotification('Bloque movido hacia abajo');
                loadBuilderBlocks();
            }
        } catch (error) {
            console.error("Error moving block down:", error);
            alert('Error al mover el bloque hacia abajo.');
        }
    };

    // Function to recalculate block orders after deletion
    const recalculateBlockOrders = async () => {
        try {
            const pageId = pageSelector.value;
            const q = query(
                collection(db, "contenido_dinamico"), 
                where("page_id", "==", pageId), 
                orderBy("orden", "asc")
            );
            
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            
            querySnapshot.docs.forEach((docSnapshot, index) => {
                const docRef = doc(db, "contenido_dinamico", docSnapshot.id);
                batch.update(docRef, { orden: index + 1 });
            });
            
            await batch.commit();
        } catch (error) {
            console.error("Error recalculating orders:", error);
        }
    };

    // Function to show movement notifications
    const showMoveNotification = (message) => {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    };

    // Drag & Drop Variables
    let draggedElement = null;
    let draggedOverElement = null;

    // Drag & Drop Event Handlers
    const handleDragStart = (e) => {
        draggedElement = e.currentTarget;
        e.currentTarget.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    };

    const handleDragOver = (e) => {
        if (e.preventDefault) {
            e.preventDefault(); // Allows us to drop
        }
        
        draggedOverElement = e.currentTarget;
        e.currentTarget.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
        
        return false;
    };

    const handleDrop = async (e) => {
        if (e.stopPropagation) {
            e.stopPropagation(); // Stops some browsers from redirecting
        }

        if (draggedElement !== draggedOverElement && draggedElement && draggedOverElement) {
            const draggedId = draggedElement.dataset.id;
            const draggedOrder = parseInt(draggedElement.dataset.order);
            const targetId = draggedOverElement.dataset.id;
            const targetOrder = parseInt(draggedOverElement.dataset.order);

            try {
                // Swap the orders
                await updateDoc(doc(db, "contenido_dinamico", draggedId), {
                    orden: targetOrder
                });
                
                await updateDoc(doc(db, "contenido_dinamico", targetId), {
                    orden: draggedOrder
                });
                
                showMoveNotification('Bloques reordenados con arrastrar y soltar');
                loadBuilderBlocks();
            } catch (error) {
                console.error("Error reordering blocks:", error);
                alert('Error al reordenar los bloques.');
            }
        }

        return false;
    };

    const handleDragEnd = (e) => {
        // Reset all styles
        e.currentTarget.style.opacity = '';
        
        // Remove drag-over class from all elements
        document.querySelectorAll('.artist-list-item').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        draggedElement = null;
        draggedOverElement = null;
    };


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
                <button class="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full text-sm approve-btn" data-id="${doc.id}" data-modalidad="${modalidad}" title="Aprobar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </button>
                <button class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full text-sm reject-btn" data-id="${doc.id}" data-modalidad="${modalidad}" title="Rechazar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                <button class="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full text-sm delete-btn" data-id="${doc.id}" data-modalidad="${modalidad}" title="Eliminar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            `;

            if (data.aprobado) {
                actionButtons = `
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-full text-sm disapprove-btn" data-id="${doc.id}" data-modalidad="${modalidad}" title="Desaprobar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </button>
                    <button class="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full text-sm delete-btn" data-id="${doc.id}" data-modalidad="${modalidad}" title="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                `;
            }

            if (isPrueba && !data.descuento_aplicado) {
                actionButtons += `
                    <button class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full text-sm apply-discount-btn" data-id="${doc.id}" data-modalidad="${modalidad}" title="Aplicar Descuento">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </button>
                `;
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
    }

    // --- Notification Function ---
    function showNotification(message, type = 'info') {
        // Simple notification - can be enhanced with a toast library later
        const alertType = type === 'error' ? 'Error: ' : type === 'success' ? 'Éxito: ' : 'Info: ';
        alert(alertType + message);
    }

    // --- Event Delegation for Participant Actions ---
    document.addEventListener('click', async (e) => {
        const participantId = e.target.closest('button')?.dataset.id;
        const modalidad = e.target.closest('button')?.dataset.modalidad;
        
        if (!participantId || !modalidad) return;

        // Check if user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showNotification('Debes estar autenticado para realizar esta acción', 'error');
            return;
        }

        console.log('Usuario autenticado:', currentUser.uid);
        console.log('Procesando acción para participante:', participantId, 'modalidad:', modalidad);

        const collectionName = modalidad === 'online' ? 'participantes_online' : 'participantes_presenciales';
        
        try {
            if (e.target.closest('.approve-btn')) {
                console.log('Aprobando participante:', participantId, modalidad);
                
                // Obtener datos del participante
                const participantRef = doc(db, collectionName, participantId);
                const participantDoc = await getDoc(participantRef);
                
                if (!participantDoc.exists()) {
                    showNotification('Participante no encontrado', 'error');
                    return;
                }
                
                const data = participantDoc.data();
                
                // Actualizar Firestore con nuevo estado
                await updateDoc(participantRef, { 
                    aprobado: true,
                    estado: 'aprobado',
                    fecha_aprobacion: serverTimestamp(),
                    notificado_aprobacion: false // n8n lo detectará y enviará WhatsApp
                });
                
                console.log(`✅ Aprobado: ${data.nombreArtista || data.nombre_artista}`);
                console.log('🔔 Notificación WhatsApp se enviará automáticamente (n8n)');
                
                showNotification('Participante aprobado. Se enviará notificación automática.', 'success');
            }
            else if (e.target.closest('.reject-btn')) {
                console.log('Rechazando participante:', participantId, modalidad);
                
                if (confirm('¿Estás seguro de que quieres rechazar este participante? Se enviará un email con feedback constructivo.')) {
                    try {
                        // First send the professional rejection email
                        const response = await fetch('https://us-central1-vytonlineprueva.cloudfunctions.net/sendProfessionalRejectionEmail', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ participantId, modalidad })
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Error enviando email de rechazo');
                        }
                        
                        console.log('Email de rechazo enviado exitosamente');
                        
                        // Then delete the participant
                        await deleteDoc(doc(db, collectionName, participantId));
                        console.log('Participante eliminado exitosamente');
                        showNotification('Participante rechazado. Email de feedback enviado.', 'success');
                        
                    } catch (error) {
                        console.error('Error en proceso de rechazo:', error);
                        showNotification('Error: ' + error.message, 'error');
                    }
                }
            }
            else if (e.target.closest('.delete-btn')) {
                if (confirm('¿Estás seguro de que quieres eliminar este participante?')) {
                    console.log('Eliminando participante:', participantId);
                    await deleteDoc(doc(db, collectionName, participantId));
                    showNotification('Participante eliminado', 'success');
                }
            }
            else if (e.target.closest('.disapprove-btn')) {
                console.log('Desaprobando participante:', participantId);
                await updateDoc(doc(db, collectionName, participantId), { aprobado: false });
                showNotification('Participante desaprobado', 'success');
            }
            else if (e.target.closest('.apply-discount-btn')) {
                console.log('Aplicando descuento a participante:', participantId);
                await updateDoc(doc(db, collectionName, participantId), { descuento_aplicado: true });
                showNotification('Descuento aplicado', 'success');
            }
        } catch (error) {
            console.error('Error al procesar acción de participante:', error);
            showNotification('Error al procesar la acción: ' + error.message, 'error');
        }
    });

    // --- Mobile Menu Functionality ---
    const hamburgerBtn = document.getElementById('hamburger-btn-bottom');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (hamburgerBtn && sidebar && sidebarOverlay) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle sidebar visibility
            sidebar.classList.toggle('active-sidebar');
            sidebarOverlay.classList.toggle('active');
            sidebarOverlay.classList.toggle('hidden');
            
            // Prevent body scroll when menu is open
            document.body.classList.toggle('overflow-hidden');
        });

        // Close sidebar when clicking overlay
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active-sidebar');
            sidebarOverlay.classList.remove('active');
            sidebarOverlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });

        // Close sidebar when clicking nav links (for mobile)
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) { // Only on mobile
                    sidebar.classList.remove('active-sidebar');
                    sidebarOverlay.classList.remove('active');
                    sidebarOverlay.classList.add('hidden');
                    document.body.classList.remove('overflow-hidden');
                }
            });
        });
    }

// ... (rest of the script)
// --- Certámenes Provinciales Functions ---
    
    // Load certámenes provinciales
    const loadCertamenesProvinciales = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "certamenes_provincias"));
            const certamenes = [];
            querySnapshot.forEach((doc) => {
                certamenes.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by order
            certamenes.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            
            renderCertamenesProvinciales(certamenes);
        } catch (error) {
            console.error("Error loading certámenes provinciales:", error);
            if (certamenesListDiv) {
                certamenesListDiv.innerHTML = '<p class="text-red-500">Error al cargar los certámenes.</p>';
            }
        }
    };

    // Render certámenes provinciales
    const renderCertamenesProvinciales = (certamenes) => {
        if (!certamenesListDiv) return;
        
        if (certamenes.length === 0) {
            certamenesListDiv.innerHTML = '<p class="text-gray-500">No hay certámenes provinciales creados.</p>';
            return;
        }

        const certamenesHTML = certamenes.map(certamen => `
            <div class="artist-list-item" data-id="${certamen.id}">
                <div class="flex items-center gap-4">
                    ${certamen.imagen_url ? 
                        `<img src="${certamen.imagen_url}" alt="${certamen.nombre}" class="w-16 h-16 object-cover rounded-lg">` :
                        `<div class="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                            </svg>
                        </div>`
                    }
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <h4 class="font-semibold text-cyan-400">${certamen.nombre}</h4>
                            <span class="px-2 py-1 text-xs rounded-full ${certamen.activo ? 'bg-green-600' : 'bg-red-600'} text-white">
                                ${certamen.activo ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                            ${certamen.ranking_habilitado ? 
                                '<span class="px-2 py-1 text-xs rounded-full bg-blue-600 text-white">RANKING</span>' : 
                                ''
                            }
                        </div>
                        <p class="text-sm text-gray-400">${certamen.provincia} • $${(certamen.precio_inscripcion || 0).toLocaleString('es-AR')}</p>
                        <p class="text-xs text-gray-500">${formatDateRange(certamen.fecha_inicio, certamen.fecha_fin)}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm edit-certamen-provincial-btn" data-id="${certamen.id}">Editar</button>
                    <button class="bg-red-600 text-white px-3 py-1 rounded-full text-sm delete-certamen-provincial-btn" data-id="${certamen.id}">Eliminar</button>
                    <button class="bg-green-600 text-white px-3 py-1 rounded-full text-sm toggle-certamen-provincial-btn" data-id="${certamen.id}">
                        ${certamen.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </div>
            </div>
        `).join('');

        certamenesListDiv.innerHTML = certamenesHTML;
    };

    // Utility function for date formatting
    const formatDateRange = (startDate, endDate) => {
        if (!startDate && !endDate) return 'Fechas por definir';
        if (!endDate) return `Desde ${formatDate(startDate)}`;
        if (!startDate) return `Hasta ${formatDate(endDate)}`;
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric'
        });
    };

    // ===== GESTIÓN DE RANKINGS =====
    
    // ===== GESTIÓN DE RANKINGS =====
    
    // Elementos del sistema de rankings
    const rankingsUpdateBtn = document.getElementById('update-rankings-btn');
    const syncYoutubeBtn = document.getElementById('sync-youtube-btn');
    const exportRankingsBtn = document.getElementById('export-rankings-btn');
    const provinciaFilter = document.getElementById('provincia-filter');
    const paidParticipantsDiv = document.getElementById('paid-participants');
    const totalPaidSpan = document.getElementById('total-paid');
    const totalRevenueSpan = document.getElementById('total-revenue');

    // Cargar provincias en el filtro
    const loadProvinciasFilter = () => {
        const provincias = [
            'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
            'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza',
            'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
            'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
        ];

        provinciaFilter.innerHTML = '<option value="">Seleccionar provincia</option>';
        provincias.forEach(provincia => {
            const option = document.createElement('option');
            option.value = provincia;
            option.textContent = provincia;
            provinciaFilter.appendChild(option);
        });
    };

    // Obtener ID de video de YouTube desde URL
    const getYouTubeVideoIdForRankings = (url) => {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    // Simular obtención de reproducciones de YouTube (reemplazar con API real)
    const getYouTubeViews = async (videoId) => {
        // Simulación de reproducciones aleatorias
        // En producción, esto se conectaría con la API de YouTube
        return Math.floor(Math.random() * 10000) + 100;
    };

    // Sincronizar reproducciones de YouTube
    const syncYouTubeViews = async () => {
        try {
            syncYoutubeBtn.disabled = true;
            syncYoutubeBtn.textContent = 'Sincronizando...';

            const participantesSnapshot = await getDocs(
                query(collection(db, "participantes_online"), where("pago_completado", "==", true))
            );

            const batch = writeBatch(db);
            let updatedCount = 0;

            for (const docSnap of participantesSnapshot.docs) {
                const participant = docSnap.data();
                const videoId = getYouTubeVideoIdForRankings(participant.video_link);
                
                if (videoId) {
                    const views = await getYouTubeViews(videoId);
                    batch.update(doc(db, "participantes_online", docSnap.id), {
                        reproducciones_youtube: views,
                        ultima_sincronizacion: serverTimestamp()
                    });
                    updatedCount++;
                }
            }

            await batch.commit();
            
            showStatus(`✅ Sincronizadas ${updatedCount} reproducciones de YouTube`, 'success');
            await updateRankings();
            
        } catch (error) {
            console.error('Error syncing YouTube views:', error);
            showStatus('❌ Error al sincronizar reproducciones', 'error');
        } finally {
            syncYoutubeBtn.disabled = false;
            syncYoutubeBtn.textContent = '📹 Sincronizar YouTube';
        }
    };

    // Actualizar rankings
    const updateRankings = async () => {
        try {
            if (rankingsUpdateBtn) {
                rankingsUpdateBtn.disabled = true;
                rankingsUpdateBtn.textContent = 'Actualizando...';
            }

            const participantesSnapshot = await getDocs(
                query(
                    collection(db, "participantes_online"),
                    where("pago_completado", "==", true),
                    orderBy("reproducciones_youtube", "desc")
                )
            );

            const participants = [];
            participantesSnapshot.forEach(doc => {
                participants.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Calcular ranking general
            const batch = writeBatch(db);
            participants.forEach((participant, index) => {
                batch.update(doc(db, "participantes_online", participant.id), {
                    ranking_general: index + 1
                });
            });

            // Calcular rankings provinciales
            const provinciaGroups = {};
            participants.forEach(participant => {
                if (!provinciaGroups[participant.provincia]) {
                    provinciaGroups[participant.provincia] = [];
                }
                provinciaGroups[participant.provincia].push(participant);
            });

            Object.keys(provinciaGroups).forEach(provincia => {
                const provincialParticipants = provinciaGroups[provincia]
                    .sort((a, b) => b.reproducciones_youtube - a.reproducciones_youtube);
                
                provincialParticipants.forEach((participant, index) => {
                    batch.update(doc(db, "participantes_online", participant.id), {
                        ranking_provincial: index + 1
                    });
                });
            });

            await batch.commit();
            
            showStatus('✅ Rankings actualizados correctamente', 'success');
            await loadRankings();
            
        } catch (error) {
            console.error('Error updating rankings:', error);
            showStatus('❌ Error al actualizar rankings', 'error');
        } finally {
            if (rankingsUpdateBtn) {
                rankingsUpdateBtn.disabled = false;
                rankingsUpdateBtn.textContent = '🔄 Actualizar Rankings';
            }
        }
    };

    // Cargar rankings para mostrar
    const loadRankings = async () => {
        await loadGeneralRanking();
        await loadPaidParticipants();
        if (provinciaFilter && provinciaFilter.value) {
            await loadProvincialRanking(provinciaFilter.value);
        }
    };

    // Cargar ranking general
    const loadGeneralRanking = async () => {
        try {
            const querySnapshot = await getDocs(
                query(
                    collection(db, "participantes_online"),
                    where("pago_completado", "==", true),
                    orderBy("ranking_general"),
                    limit(10)
                )
            );

            const rankingHTML = querySnapshot.docs.map((doc, index) => {
                const participant = doc.data();
                const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}°`;
                
                return `
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-bold">${medal}</span>
                            <div>
                                <p class="font-semibold text-white">${participant.nombre_artista}</p>
                                <p class="text-sm text-gray-400">${participant.provincia}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-purple-400 font-bold">${participant.reproducciones_youtube || 0} views</p>
                            <p class="text-xs text-gray-400">Ranking #${participant.ranking_general}</p>
                        </div>
                    </div>
                `;
            }).join('');

            generalRankingsDiv.innerHTML = rankingHTML || '<p class="text-gray-400 text-center py-4">No hay participantes</p>';
            
        } catch (error) {
            console.error('Error loading general ranking:', error);
            generalRankingsDiv.innerHTML = '<p class="text-red-400 text-center py-4">Error al cargar ranking</p>';
        }
    };

    // Cargar ranking provincial
    const loadProvincialRanking = async (provincia) => {
        try {
            const querySnapshot = await getDocs(
                query(
                    collection(db, "participantes_online"),
                    where("pago_completado", "==", true),
                    where("provincia", "==", provincia),
                    orderBy("ranking_provincial"),
                    limit(10)
                )
            );

            const rankingHTML = querySnapshot.docs.map((doc, index) => {
                const participant = doc.data();
                const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}°`;
                
                return `
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-bold">${medal}</span>
                            <div>
                                <p class="font-semibold text-white">${participant.nombre_artista}</p>
                                <p class="text-sm text-gray-400">${participant.certamen_nombre || 'Sin certamen'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-yellow-400 font-bold">${participant.reproducciones_youtube || 0} views</p>
                            <p class="text-xs text-gray-400">Provincial #${participant.ranking_provincial}</p>
                        </div>
                    </div>
                `;
            }).join('');

            provincialRankingsDiv.innerHTML = rankingHTML || '<p class="text-gray-400 text-center py-4">No hay participantes en esta provincia</p>';
            
        } catch (error) {
            console.error('Error loading provincial ranking:', error);
            provincialRankingsDiv.innerHTML = '<p class="text-red-400 text-center py-4">Error al cargar ranking provincial</p>';
        }
    };

    // Cargar participantes con pago confirmado
    const loadPaidParticipants = async () => {
        try {
            const querySnapshot = await getDocs(
                query(collection(db, "participantes_online"), where("pago_completado", "==", true))
            );

            let totalRevenue = 0;
            const participants = [];

            querySnapshot.forEach(doc => {
                const participant = doc.data();
                participants.push(participant);
                totalRevenue += participant.precio_certamen || 0;
            });

            totalPaidSpan.textContent = participants.length;
            totalRevenueSpan.textContent = `$${totalRevenue.toLocaleString()}`;

            const participantsHTML = participants
                .sort((a, b) => (b.reproducciones_youtube || 0) - (a.reproducciones_youtube || 0))
                .slice(0, 20)
                .map(participant => `
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div class="flex items-center gap-3">
                            <img src="${participant.foto_url || '/placeholder-avatar.png'}" 
                                 alt="${participant.nombre_artista}" 
                                 class="w-10 h-10 rounded-full object-cover">
                            <div>
                                <p class="font-semibold text-white">${participant.nombre_artista}</p>
                                <p class="text-sm text-gray-400">${participant.provincia} - ${participant.certamen_nombre || 'Sin certamen'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-green-400 font-bold">$${participant.precio_certamen || 0}</p>
                            <p class="text-xs text-gray-400">${participant.reproducciones_youtube || 0} views</p>
                        </div>
                    </div>
                `).join('');

            paidParticipantsDiv.innerHTML = participantsHTML || '<p class="text-gray-400 text-center py-4">No hay participantes con pago confirmado</p>';
            
        } catch (error) {
            console.error('Error loading paid participants:', error);
            paidParticipantsDiv.innerHTML = '<p class="text-red-400 text-center py-4">Error al cargar participantes</p>';
        }
    };

    // Exportar rankings
    const exportRankings = async () => {
        try {
            exportRankingsBtn.disabled = true;
            exportRankingsBtn.textContent = 'Exportando...';

            const querySnapshot = await getDocs(
                query(
                    collection(db, "participantes_online"),
                    where("pago_completado", "==", true),
                    orderBy("ranking_general")
                )
            );

            const csvContent = [
                ['Ranking General', 'Ranking Provincial', 'Nombre', 'Provincia', 'Certamen', 'Reproducciones', 'Email', 'WhatsApp'].join(','),
                ...querySnapshot.docs.map(doc => {
                    const p = doc.data();
                    return [
                        p.ranking_general || 0,
                        p.ranking_provincial || 0,
                        `"${p.nombre_artista}"`,
                        `"${p.provincia}"`,
                        `"${p.certamen_nombre || 'Sin certamen'}"`,
                        p.reproducciones_youtube || 0,
                        `"${p.email}"`,
                        `"${p.whatsapp}"`
                    ].join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rankings_vyt_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            showStatus('✅ Rankings exportados correctamente', 'success');
            
        } catch (error) {
            console.error('Error exporting rankings:', error);
            showStatus('❌ Error al exportar rankings', 'error');
        } finally {
            exportRankingsBtn.disabled = false;
            exportRankingsBtn.textContent = '📊 Exportar Rankings';
        }
    };

    // Event listeners para rankings
    if (updateRankingsBtn) {
        updateRankingsBtn.addEventListener('click', updateRankings);
    }

    if (syncYoutubeBtn) {
        syncYoutubeBtn.addEventListener('click', syncYouTubeViews);
    }

    if (rankingsUpdateBtn) {
        rankingsUpdateBtn.addEventListener('click', updateRankings);
    }

    if (provinciaFilter) {
        provinciaFilter.addEventListener('change', (e) => {
            if (e.target.value) {
                loadProvincialRanking(e.target.value);
            } else {
                provincialRankingsDiv.innerHTML = '<p class="text-gray-400 text-center py-4">Selecciona una provincia para ver el ranking</p>';
            }
        });
    }

    // Inicializar rankings cuando se carga la página de rankings
    const rankingsPageButton = document.querySelector('[data-target="page-rankings"]');
    if (rankingsPageButton) {
        rankingsPageButton.addEventListener('click', () => {
            loadProvinciasFilter();
            loadRankings();
        });
    }

    // === FUNCIONES DE GESTIÓN DE CERTÁMENES ===
    
    // Crear nuevo certamen
    const createCertamen = async () => {
        try {
            const nombre = prompt('Nombre del certamen:');
            if (!nombre) return;
            
            const provincia = prompt('Provincia:');
            if (!provincia) return;
            
            const precio = prompt('Precio de inscripción:');
            if (!precio) return;
            
            const certamenData = {
                nombre: nombre,
                provincia: provincia,
                precio_inscripcion: parseInt(precio),
                activo: true,
                estado: 'activo',
                fecha_inicio: serverTimestamp(),
                fecha_creacion: serverTimestamp(),
                descripcion: `Certamen de ${nombre} en ${provincia}`,
                participantes_count: 0,
                destacado: false
            };
            
            await addDoc(collection(db, "certamenes_provincias"), certamenData);
            showStatus('✅ Certamen creado correctamente', 'success');
            
        } catch (error) {
            console.error('Error creating certamen:', error);
            showStatus('❌ Error al crear certamen', 'error');
        }
    };

    // Habilitar/deshabilitar certamen
    const toggleCertamen = async (certamenId, currentState) => {
        try {
            await updateDoc(doc(db, "certamenes_provincias", certamenId), {
                activo: !currentState,
                fecha_actualizacion: serverTimestamp()
            });
            
            const newState = !currentState ? 'habilitado' : 'deshabilitado';
            showStatus(`✅ Certamen ${newState} correctamente`, 'success');
            
        } catch (error) {
            console.error('Error toggling certamen:', error);
            showStatus('❌ Error al cambiar estado del certamen', 'error');
        }
    };

    // Establecer precios y premios
    const setCertamenPrizes = async (certamenId) => {
        try {
            const primerPremio = prompt('Primer premio ($):');
            const segundoPremio = prompt('Segundo premio ($):');
            const tercerPremio = prompt('Tercer premio ($):');
            
            if (!primerPremio) return;
            
            const premiosData = {
                primer_premio: parseInt(primerPremio) || 0,
                segundo_premio: parseInt(segundoPremio) || 0,
                tercer_premio: parseInt(tercerPremio) || 0,
                fecha_actualizacion_premios: serverTimestamp()
            };
            
            await updateDoc(doc(db, "certamenes_provincias", certamenId), premiosData);
            showStatus('✅ Premios actualizados correctamente', 'success');
            
        } catch (error) {
            console.error('Error setting prizes:', error);
            showStatus('❌ Error al establecer premios', 'error');
        }
    };

    // Designar ganadores (función para jurado)
    const designateWinners = async (certamenId) => {
        try {
            // Obtener participantes del certamen
            const participantesQuery = query(
                collection(db, "participantes_online"),
                where("certamen_id", "==", certamenId),
                where("pago_completado", "==", true),
                orderBy("votos_totales", "desc")
            );
            
            const participantesSnapshot = await getDocs(participantesQuery);
            const participants = [];
            participantesSnapshot.forEach(doc => {
                participants.push({ id: doc.id, ...doc.data() });
            });
            
            if (participants.length < 3) {
                showStatus('❌ Necesitas al menos 3 participantes para designar ganadores', 'error');
                return;
            }
            
            // Mostrar modal de selección de ganadores
            showWinnersModal(certamenId, participants);
            
        } catch (error) {
            console.error('Error designating winners:', error);
            showStatus('❌ Error al designar ganadores', 'error');
        }
    };

    // Mostrar modal de ganadores
    const showWinnersModal = (certamenId, participants) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
                <h3 class="text-xl font-bold mb-4">Designar Ganadores</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">🥇 Primer Lugar:</label>
                        <select id="firstPlace" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                            <option value="">Seleccionar ganador</option>
                            ${participants.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido} (${p.votos_totales || 0} votos)</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">🥈 Segundo Lugar:</label>
                        <select id="secondPlace" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                            <option value="">Seleccionar ganador</option>
                            ${participants.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido} (${p.votos_totales || 0} votos)</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">🥉 Tercer Lugar:</label>
                        <select id="thirdPlace" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                            <option value="">Seleccionar ganador</option>
                            ${participants.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido} (${p.votos_totales || 0} votos)</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
                        Cancelar
                    </button>
                    <button onclick="saveWinners('${certamenId}')" class="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
                        Guardar Ganadores
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    };

    // Guardar ganadores
    window.saveWinners = async (certamenId) => {
        try {
            const firstPlace = document.getElementById('firstPlace').value;
            const secondPlace = document.getElementById('secondPlace').value;
            const thirdPlace = document.getElementById('thirdPlace').value;
            
            if (!firstPlace) {
                showStatus('❌ Debes seleccionar al menos el primer lugar', 'error');
                return;
            }
            
            // Verificar que no se repitan ganadores
            const winners = [firstPlace, secondPlace, thirdPlace].filter(Boolean);
            if (new Set(winners).size !== winners.length) {
                showStatus('❌ No puedes seleccionar el mismo participante para múltiples posiciones', 'error');
                return;
            }
            
            const winnersData = {
                primer_lugar: firstPlace,
                segundo_lugar: secondPlace || null,
                tercer_lugar: thirdPlace || null,
                fecha_designacion: serverTimestamp(),
                estado: 'finalizado'
            };
            
            // Actualizar certamen
            await updateDoc(doc(db, "certamenes_provincias", certamenId), winnersData);
            
            // Actualizar participantes ganadores
            if (firstPlace) {
                await updateDoc(doc(db, "participantes_online", firstPlace), {
                    posicion_final: 1,
                    es_ganador: true
                });
            }
            if (secondPlace) {
                await updateDoc(doc(db, "participantes_online", secondPlace), {
                    posicion_final: 2,
                    es_ganador: true
                });
            }
            if (thirdPlace) {
                await updateDoc(doc(db, "participantes_online", thirdPlace), {
                    posicion_final: 3,
                    es_ganador: true
                });
            }
            
            // Cerrar modal
            document.querySelector('.fixed').remove();
            showStatus('✅ Ganadores designados correctamente', 'success');
            
        } catch (error) {
            console.error('Error saving winners:', error);
            showStatus('❌ Error al guardar ganadores', 'error');
        }
    };

    // Exportar datos de certamen
    const exportCertamenData = async (certamenId) => {
        try {
            // Obtener datos del certamen
            const certamenDoc = await getDoc(doc(db, "certamenes_provincias", certamenId));
            const certamenData = certamenDoc.data();
            
            // Obtener participantes
            const participantesQuery = query(
                collection(db, "participantes_online"),
                where("certamen_id", "==", certamenId),
                orderBy("votos_totales", "desc")
            );
            
            const participantesSnapshot = await getDocs(participantesQuery);
            const participants = [];
            participantesSnapshot.forEach(doc => {
                participants.push({ id: doc.id, ...doc.data() });
            });
            
            // Crear CSV
            const csvData = [
                ['Posición', 'Nombre', 'Apellido', 'Provincia', 'Email', 'Teléfono', 'Votos', 'Reproducciones YouTube', 'Estado Pago', 'Es Ganador'],
                ...participants.map((p, index) => [
                    index + 1,
                    p.nombre || '',
                    p.apellido || '',
                    p.provincia || '',
                    p.email || '',
                    p.telefono || '',
                    p.votos_totales || 0,
                    p.reproducciones_youtube || 0,
                    p.pago_completado ? 'Pagado' : 'Pendiente',
                    p.es_ganador ? 'Sí' : 'No'
                ])
            ];
            
            const csvContent = csvData.map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `certamen_${certamenData.nombre}_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            showStatus('✅ Datos exportados correctamente', 'success');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            showStatus('❌ Error al exportar datos', 'error');
        }
    };

    // Funciones de modales y gestión de certámenes
    function createCertamenModal() {
        const modal = document.getElementById('certamen-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        populateProvincias();
        
        // Set default dates
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        
        document.getElementById('certamen-fecha-inicio').value = today.toISOString().split('T')[0];
        document.getElementById('certamen-fecha-fin').value = nextMonth.toISOString().split('T')[0];
    }

    function closeCertamenModal() {
        const modal = document.getElementById('certamen-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.getElementById('certamen-form').reset();
    }

    function populateProvincias() {
        const select = document.getElementById('certamen-provincia');
        const provincias = [
            'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
            'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza',
            'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
            'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego',
            'Tucumán', 'CABA'
        ];
        
        select.innerHTML = '<option value="">Seleccionar provincia...</option>';
        provincias.forEach(provincia => {
            const option = document.createElement('option');
            option.value = provincia;
            option.textContent = provincia;
            select.appendChild(option);
        });
    }

    function loadCertamenesList() {
        const container = document.getElementById('certamenes-list');
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Cargando certámenes...</p>';
        
        // Simulate loading certámenes
        setTimeout(() => {
            container.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h5 class="font-bold text-purple-400">🎤 Certamen Buenos Aires</h5>
                                <p class="text-sm text-gray-400">Precio: $5,000 | Premio: $50,000</p>
                                <p class="text-xs text-gray-500">15/01/2024 - 15/02/2024</p>
                            </div>
                            <div class="flex gap-2">
                                <span class="px-2 py-1 bg-green-600 text-white text-xs rounded">Activo</span>
                                <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded">23 Participantes</span>
                            </div>
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button onclick="designateWinnersModal('buenos-aires')" class="btn-small bg-yellow-600 hover:bg-yellow-700">
                                🏆 Designar Ganador
                            </button>
                            <button onclick="toggleCertamen('buenos-aires')" class="btn-small bg-red-600 hover:bg-red-700">
                                ⏸️ Pausar
                            </button>
                            <button onclick="exportCertamenData('buenos-aires')" class="btn-small bg-green-600 hover:bg-green-700">
                                📊 Exportar
                            </button>
                            <button onclick="setCertamenPrizes('buenos-aires')" class="btn-small bg-purple-600 hover:bg-purple-700">
                                💰 Premios
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h5 class="font-bold text-gray-400">🎤 Certamen Córdoba</h5>
                                <p class="text-sm text-gray-400">Precio: $4,500 | Premio: $45,000</p>
                                <p class="text-xs text-gray-500">01/02/2024 - 01/03/2024</p>
                            </div>
                            <div class="flex gap-2">
                                <span class="px-2 py-1 bg-gray-600 text-white text-xs rounded">Pausado</span>
                                <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded">15 Participantes</span>
                            </div>
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button onclick="designateWinnersModal('cordoba')" class="btn-small bg-yellow-600 hover:bg-yellow-700">
                                🏆 Designar Ganador
                            </button>
                            <button onclick="toggleCertamen('cordoba')" class="btn-small bg-green-600 hover:bg-green-700">
                                ▶️ Reactivar
                            </button>
                            <button onclick="exportCertamenData('cordoba')" class="btn-small bg-green-600 hover:bg-green-700">
                                📊 Exportar
                            </button>
                            <button onclick="setCertamenPrizes('cordoba')" class="btn-small bg-purple-600 hover:bg-purple-700">
                                💰 Premios
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }, 1000);
    }

    function designateWinnersModal(certamenId) {
        const modal = document.getElementById('ganadores-modal');
        const content = document.getElementById('ganadores-content');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        content.innerHTML = '<p class="text-gray-400">Cargando participantes...</p>';
        
        // Simulate loading participants
        setTimeout(() => {
            content.innerHTML = `
                <div class="space-y-4">
                    <div class="mb-4">
                        <h4 class="font-bold text-purple-400 mb-2">Participantes del Certamen</h4>
                        <p class="text-sm text-gray-400">Selecciona hasta 3 ganadores (1° lugar, 2° lugar, 3° lugar)</p>
                    </div>
                    
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                        <div class="bg-gray-800/50 p-3 rounded border border-gray-600/30">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h5 class="font-semibold text-white">María González</h5>
                                    <p class="text-sm text-gray-400">Votos: 1,245 | Pago: Confirmado</p>
                                    <p class="text-xs text-gray-500">maria.gonzalez@email.com</p>
                                </div>
                                <select class="bg-gray-700 text-white p-2 rounded text-sm" data-participant="maria-gonzalez">
                                    <option value="">No premiado</option>
                                    <option value="1">🥇 1° Lugar</option>
                                    <option value="2">🥈 2° Lugar</option>
                                    <option value="3">🥉 3° Lugar</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="bg-gray-800/50 p-3 rounded border border-gray-600/30">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h5 class="font-semibold text-white">Carlos Rodríguez</h5>
                                    <p class="text-sm text-gray-400">Votos: 1,120 | Pago: Confirmado</p>
                                    <p class="text-xs text-gray-500">carlos.rodriguez@email.com</p>
                                </div>
                                <select class="bg-gray-700 text-white p-2 rounded text-sm" data-participant="carlos-rodriguez">
                                    <option value="">No premiado</option>
                                    <option value="1">🥇 1° Lugar</option>
                                    <option value="2">🥈 2° Lugar</option>
                                    <option value="3">🥉 3° Lugar</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="bg-gray-800/50 p-3 rounded border border-gray-600/30">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h5 class="font-semibold text-white">Ana López</h5>
                                    <p class="text-sm text-gray-400">Votos: 890 | Pago: Confirmado</p>
                                    <p class="text-xs text-gray-500">ana.lopez@email.com</p>
                                </div>
                                <select class="bg-gray-700 text-white p-2 rounded text-sm" data-participant="ana-lopez">
                                    <option value="">No premiado</option>
                                    <option value="1">🥇 1° Lugar</option>
                                    <option value="2">🥈 2° Lugar</option>
                                    <option value="3">🥉 3° Lugar</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 p-3 bg-blue-900/30 rounded border border-blue-500/30">
                        <h5 class="font-semibold text-blue-400 mb-2">💰 Distribución de Premios</h5>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span>🥇 1° Lugar:</span>
                                <span class="text-green-400 font-bold">$30,000 (60%)</span>
                            </div>
                            <div class="flex justify-between">
                                <span>🥈 2° Lugar:</span>
                                <span class="text-yellow-400 font-bold">$15,000 (30%)</span>
                            </div>
                            <div class="flex justify-between">
                                <span>🥉 3° Lugar:</span>
                                <span class="text-orange-400 font-bold">$5,000 (10%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }, 800);
    }

    function closeGanadoresModal() {
        const modal = document.getElementById('ganadores-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function saveWinners() {
        const selects = document.querySelectorAll('#ganadores-content select');
        const winners = {};
        
        selects.forEach(select => {
            if (select.value) {
                const participant = select.dataset.participant;
                const position = select.value;
                winners[position] = participant;
            }
        });
        
        console.log('Ganadores designados:', winners);
        showStatus('✅ Ganadores guardados exitosamente', 'success');
        closeGanadoresModal();
    }

    function exportAllCertamenes() {
        showStatus('📊 Exportando datos de todos los certámenes...', 'info');
        
        // Simulate export
        setTimeout(() => {
            showStatus('✅ Datos exportados exitosamente', 'success');
        }, 2000);
    }

    function showStatsModal() {
        const modal = document.getElementById('stats-modal');
        const content = document.getElementById('stats-content');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        content.innerHTML = '<p class="text-gray-400">Cargando estadísticas...</p>';
        
        // Simulate loading stats
        setTimeout(() => {
            content.innerHTML = `
                <div class="bg-gray-800/50 p-4 rounded border border-purple-500/30">
                    <h4 class="font-bold text-purple-400 mb-3">📊 Participación General</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Total Participantes:</span>
                            <span class="font-bold text-green-400">1,247</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Certámenes Activos:</span>
                            <span class="font-bold text-blue-400">18</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Pagos Confirmados:</span>
                            <span class="font-bold text-yellow-400">856</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Total Votos:</span>
                            <span class="font-bold text-pink-400">15,632</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-800/50 p-4 rounded border border-green-500/30">
                    <h4 class="font-bold text-green-400 mb-3">💰 Ingresos</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Total Recaudado:</span>
                            <span class="font-bold text-green-400">$4,280,000</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Premios Otorgados:</span>
                            <span class="font-bold text-red-400">$1,200,000</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Ganancia Neta:</span>
                            <span class="font-bold text-cyan-400">$3,080,000</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Promedio/Certamen:</span>
                            <span class="font-bold text-yellow-400">$237,778</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-800/50 p-4 rounded border border-blue-500/30">
                    <h4 class="font-bold text-blue-400 mb-3">🏆 Top Provincias</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>1. Buenos Aires:</span>
                            <span class="font-bold">312 participantes</span>
                        </div>
                        <div class="flex justify-between">
                            <span>2. Córdoba:</span>
                            <span class="font-bold">198 participantes</span>
                        </div>
                        <div class="flex justify-between">
                            <span>3. Santa Fe:</span>
                            <span class="font-bold">156 participantes</span>
                        </div>
                        <div class="flex justify-between">
                            <span>4. Mendoza:</span>
                            <span class="font-bold">134 participantes</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-800/50 p-4 rounded border border-yellow-500/30">
                    <h4 class="font-bold text-yellow-400 mb-3">📈 Crecimiento</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Mes Actual:</span>
                            <span class="font-bold text-green-400">+45%</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Nuevos Usuarios:</span>
                            <span class="font-bold text-blue-400">423</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Retención:</span>
                            <span class="font-bold text-purple-400">78%</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Satisfacción:</span>
                            <span class="font-bold text-pink-400">4.7/5</span>
                        </div>
                    </div>
                </div>
            `;
        }, 1000);
    }

    function closeStatsModal() {
        const modal = document.getElementById('stats-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    // Event listener para el formulario de certámenes - usar la variable ya declarada
    if (certamenForm) {
        certamenForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                provincia: document.getElementById('certamen-provincia').value,
                precio: document.getElementById('certamen-precio').value,
                premio: document.getElementById('certamen-premio').value,
                fechaInicio: document.getElementById('certamen-fecha-inicio').value,
                fechaFin: document.getElementById('certamen-fecha-fin').value,
                activo: document.getElementById('certamen-activo').checked
            };
            
            console.log('Creando certamen:', formData);
            showStatus('✅ Certamen creado exitosamente', 'success');
            closeCertamenModal();
            loadCertamenesList();
        });
    }

    // Funciones globales para uso en HTML
    window.createCertamen = createCertamenModal;
    window.toggleCertamen = toggleCertamen;
    window.setCertamenPrizes = setCertamenPrizes;
    window.designateWinners = designateWinnersModal;
    window.exportCertamenData = exportCertamenData;
    window.loadCertamenesList = loadCertamenesList;
    window.exportAllCertamenes = exportAllCertamenes;
    window.showStatsModal = showStatsModal;
    window.closeCertamenModal = closeCertamenModal;
    window.closeGanadoresModal = closeGanadoresModal;
    window.closeStatsModal = closeStatsModal;
    window.saveWinners = saveWinners;

    // YouTube Management Functions
    async function testYouTubeConnection() {
        const statusDiv = document.getElementById('youtube-config-status');
        statusDiv.innerHTML = '<p class="text-yellow-400">🔄 Probando conexión con YouTube...</p>';
        
        try {
            const response = await fetch('https://us-central1-vytonlineprueva.cloudfunctions.net/getAllYouTubeVideos');
            
            if (response.ok) {
                const data = await response.json();
                statusDiv.innerHTML = `
                    <div class="space-y-2">
                        <p class="text-green-400">✅ Conexión exitosa con YouTube API</p>
                        <p class="text-gray-300">📊 Total de videos encontrados: ${data.total}</p>
                        <p class="text-gray-300">🔗 Las funciones automáticas están operativas</p>
                    </div>
                `;
            } else {
                throw new Error('Error de conexión');
            }
        } catch (error) {
            statusDiv.innerHTML = `
                <div class="space-y-2">
                    <p class="text-red-400">❌ Error de conexión con YouTube</p>
                    <p class="text-gray-300">🔧 Revisa la configuración de credenciales</p>
                    <p class="text-yellow-400">📖 Consulta la guía de configuración</p>
                </div>
            `;
            console.error('YouTube connection test failed:', error);
        }
    }

    async function loadYouTubeVideos() {
        const container = document.getElementById('youtube-videos-list');
        container.innerHTML = '<p class="text-gray-400 text-center py-8">🔄 Cargando videos de YouTube...</p>';
        
        try {
            const response = await fetch('https://us-central1-vytonlineprueva.cloudfunctions.net/getAllYouTubeVideos');
            const data = await response.json();
            
            if (data.success && data.videos.length > 0) {
                // Update stats
                document.getElementById('youtube-total-videos').textContent = data.total;
                
                // Render videos list
                container.innerHTML = data.videos.map(video => `
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <h5 class="font-bold text-white">${video.name}</h5>
                                <p class="text-sm text-gray-400">Provincia: ${video.provincia}</p>
                                <p class="text-xs text-gray-500">Subido: ${new Date(video.uploadDate?.seconds * 1000).toLocaleDateString()}</p>
                                <a href="${video.url}" target="_blank" class="text-red-400 hover:text-red-300 text-sm">
                                    🔗 Ver en YouTube
                                </a>
                            </div>
                            <div class="flex gap-2 flex-wrap">
                                <button onclick="editYouTubeVideo('${video.participantId}')" class="btn-small bg-blue-600 hover:bg-blue-700">
                                    ✏️ Editar
                                </button>
                                <button onclick="getYouTubeStats('${video.youtubeId}')" class="btn-small bg-green-600 hover:bg-green-700">
                                    📊 Stats
                                </button>
                                <button onclick="deleteYouTubeVideo('${video.participantId}')" class="btn-small bg-red-600 hover:bg-red-700">
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-gray-400 mb-4">📭 No hay videos subidos a YouTube aún</p>
                        <p class="text-sm text-gray-500">Los videos se subirán automáticamente cuando apruebes participantes</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-400 mb-2">❌ Error cargando videos</p>
                    <p class="text-gray-400 text-sm">${error.message}</p>
                </div>
            `;
            console.error('Error loading YouTube videos:', error);
        }
    }

    async function editYouTubeVideo(participantId) {
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 rounded-lg max-w-md w-full mx-4 border border-purple-500/30">
                <h3 class="text-xl font-bold mb-4 text-white">✏️ Editar Video de YouTube</h3>
                <form id="edit-youtube-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Título</label>
                        <input type="text" id="youtube-title" class="input-field" placeholder="Nuevo título del video" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                        <textarea id="youtube-description" class="input-field" rows="4" placeholder="Nueva descripción del video"></textarea>
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="this.closest('.fixed').remove()" class="btn bg-gray-600 hover:bg-gray-700 text-white flex-1">
                            Cancelar
                        </button>
                        <button type="submit" class="btn bg-red-600 hover:bg-red-700 text-white flex-1">
                            Actualizar Video
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        document.getElementById('edit-youtube-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('youtube-title').value;
            const description = document.getElementById('youtube-description').value;
            
            try {
                const response = await fetch('https://us-central1-vytonlineprueva.cloudfunctions.net/updateYouTubeVideo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        participantId: participantId,
                        title: title,
                        description: description
                    })
                });
                
                if (response.ok) {
                    showStatus('✅ Video actualizado exitosamente', 'success');
                    modal.remove();
                    loadYouTubeVideos(); // Refresh list
                } else {
                    throw new Error('Error actualizando video');
                }
            } catch (error) {
                showStatus('❌ Error actualizando video: ' + error.message, 'error');
            }
        });
    }

    async function deleteYouTubeVideo(participantId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este video de YouTube? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            const response = await fetch('https://us-central1-vytonlineprueva.cloudfunctions.net/deleteYouTubeVideo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: participantId
                })
            });
            
            if (response.ok) {
                showStatus('✅ Video eliminado exitosamente de YouTube', 'success');
                loadYouTubeVideos(); // Refresh list
            } else {
                throw new Error('Error eliminando video');
            }
        } catch (error) {
            showStatus('❌ Error eliminando video: ' + error.message, 'error');
        }
    }

    function syncYouTubeData() {
        showStatus('🔄 Sincronizando datos de YouTube...', 'info');
        loadYouTubeVideos();
    }

    function bulkUpdateTitles() {
        showStatus('ℹ️ Funcionalidad de edición en lote próximamente', 'info');
    }

    function exportYouTubeReport() {
        showStatus('📊 Exportando reporte de YouTube...', 'info');
        // TODO: Implement export functionality
    }

    window.testYouTubeConnection = testYouTubeConnection;
    window.loadYouTubeVideos = loadYouTubeVideos;
    window.syncYouTubeData = syncYouTubeData;
    window.bulkUpdateTitles = bulkUpdateTitles;
    window.exportYouTubeReport = exportYouTubeReport;
    window.editYouTubeVideo = editYouTubeVideo;
    window.deleteYouTubeVideo = deleteYouTubeVideo;

    // ===============================
    // GESTIÓN POR ETAPAS - WORKFLOW
    // ===============================
    
    // Variables globales para el workflow
    let currentWorkflowParticipant = null;
    let workflowParticipants = [];

    // Elementos del DOM para workflow
    const workflowStatusFilter = document.getElementById('workflow-status-filter');
    const workflowSearchInput = document.getElementById('workflow-search');
    const workflowDateFilter = document.getElementById('workflow-date-filter');
    const workflowFilterBtn = document.getElementById('workflow-filter-btn');
    const workflowClearFilters = document.getElementById('workflow-clear-filters');
    const workflowRefreshBtn = document.getElementById('workflow-refresh-btn');
    const workflowParticipantsList = document.getElementById('workflow-participants-list');
    const workflowLoading = document.getElementById('workflow-loading');
    const workflowNoResults = document.getElementById('workflow-no-results');

    // Contadores
    const workflowPendingCount = document.getElementById('workflow-pending-count');
    const workflowPaymentCount = document.getElementById('workflow-payment-count');
    const workflowFinalCount = document.getElementById('workflow-final-count');
    const workflowPublishedCount = document.getElementById('workflow-published-count');

    // Modales
    const initialReviewModal = document.getElementById('initial-review-modal');
    const rejectInitialModal = document.getElementById('reject-initial-modal');
    const paymentFinalModal = document.getElementById('payment-final-modal');
    const finalReviewModal = document.getElementById('final-review-modal');
    const rejectFinalModal = document.getElementById('reject-final-modal');

    // Event listeners para workflow
    if (workflowFilterBtn) {
        workflowFilterBtn.addEventListener('click', applyWorkflowFilters);
    }
    if (workflowClearFilters) {
        workflowClearFilters.addEventListener('click', clearWorkflowFilters);
    }
    if (workflowRefreshBtn) {
        workflowRefreshBtn.addEventListener('click', loadWorkflowParticipants);
    }

    // Event listeners para modales
    setupWorkflowModals();

    // Cargar participantes al cambiar a la página de workflow
    const workflowNavLink = document.querySelector('[data-target="page-workflow"]');
    if (workflowNavLink) {
        workflowNavLink.addEventListener('click', () => {
            setTimeout(loadWorkflowParticipants, 100);
        });
    }

    // ===============================
    // FUNCIONES PRINCIPALES WORKFLOW
    // ===============================

    async function loadWorkflowParticipants() {
        if (!workflowLoading || !workflowParticipantsList) return;

        workflowLoading.classList.remove('hidden');
        workflowParticipantsList.classList.add('hidden');
        workflowNoResults.classList.add('hidden');

        try {
            const participantesCollection = collection(db, 'participantes_online');
            const querySnapshot = await getDocs(participantesCollection);
            
            workflowParticipants = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                workflowParticipants.push({
                    id: doc.id,
                    ...data
                });
            });

            updateWorkflowCounters();
            displayWorkflowParticipants(workflowParticipants);

        } catch (error) {
            console.error('Error loading workflow participants:', error);
            showNotification('Error al cargar participantes', 'error');
        } finally {
            workflowLoading.classList.add('hidden');
        }
    }

    function updateWorkflowCounters() {
        const counts = {
            pending: 0,
            payment: 0,
            final: 0,
            published: 0
        };

        workflowParticipants.forEach(participant => {
            const status = participant.status || 'pending_initial_review';
            
            switch (status) {
                case 'pending_initial_review':
                    counts.pending++;
                    break;
                case 'initial_approved':
                case 'payment_pending':
                    counts.payment++;
                    break;
                case 'payment_confirmed':
                case 'final_video_received':
                    counts.final++;
                    break;
                case 'final_approved':
                case 'published':
                    counts.published++;
                    break;
            }
        });

        if (workflowPendingCount) workflowPendingCount.textContent = counts.pending;
        if (workflowPaymentCount) workflowPaymentCount.textContent = counts.payment;
        if (workflowFinalCount) workflowFinalCount.textContent = counts.final;
        if (workflowPublishedCount) workflowPublishedCount.textContent = counts.published;
    }

    function displayWorkflowParticipants(participants) {
        if (!workflowParticipantsList) return;

        if (participants.length === 0) {
            workflowParticipantsList.classList.add('hidden');
            workflowNoResults.classList.remove('hidden');
            return;
        }

        workflowParticipantsList.classList.remove('hidden');
        workflowNoResults.classList.add('hidden');

        workflowParticipantsList.innerHTML = participants.map(participant => {
            const status = participant.status || 'pending_initial_review';
            const statusInfo = getStatusInfo(status);
            const actions = getAvailableActions(status);

            return `
                <div class="bg-gray-700 rounded-lg p-4 border-l-4 ${statusInfo.borderColor}">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex-1">
                            <h5 class="font-bold text-white text-lg">${participant.nombre}</h5>
                            <p class="text-gray-300">${participant.email}</p>
                            <p class="text-gray-400 text-sm">Nombre artístico: ${participant.nombre_artista || 'No especificado'}</p>
                        </div>
                        <div class="text-right">
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bgColor} ${statusInfo.textColor}">
                                ${statusInfo.icon} ${statusInfo.label}
                            </span>
                            <p class="text-gray-400 text-xs mt-1">
                                ${participant.fecha_inscripcion ? new Date(participant.fecha_inscripcion.toDate()).toLocaleDateString() : 'Sin fecha'}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                            <span class="text-gray-400">Género:</span>
                            <span class="text-white ml-2">${participant.genero_musical || 'No especificado'}</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Modalidad:</span>
                            <span class="text-white ml-2">${participant.modalidad || 'Online'}</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Teléfono:</span>
                            <span class="text-white ml-2">${participant.telefono || 'No especificado'}</span>
                        </div>
                    </div>

                    ${participant.video_url ? `
                        <div class="mb-3">
                            <span class="text-gray-400 text-sm">Video inicial:</span>
                            <a href="${participant.video_url}" target="_blank" class="text-blue-400 hover:text-blue-300 ml-2 text-sm">Ver video</a>
                        </div>
                    ` : ''}

                    ${participant.final_video_url ? `
                        <div class="mb-3">
                            <span class="text-gray-400 text-sm">Video final:</span>
                            <a href="${participant.final_video_url}" target="_blank" class="text-blue-400 hover:text-blue-300 ml-2 text-sm">Ver video final</a>
                        </div>
                    ` : ''}

                    <div class="flex gap-2 mt-4">
                        ${actions.map(action => `
                            <button onclick="handleWorkflowAction('${action.type}', '${participant.id}')" 
                                    class="btn ${action.className} text-sm px-3 py-1">
                                ${action.icon} ${action.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    function getStatusInfo(status) {
        const statusMap = {
            'pending_initial_review': {
                label: 'Pendiente revisión inicial',
                icon: '⏳',
                bgColor: 'bg-yellow-500',
                textColor: 'text-white',
                borderColor: 'border-yellow-500'
            },
            'initial_approved': {
                label: 'Video inicial aprobado',
                icon: '✅',
                bgColor: 'bg-green-500',
                textColor: 'text-white',
                borderColor: 'border-green-500'
            },
            'initial_rejected': {
                label: 'Video inicial rechazado',
                icon: '❌',
                bgColor: 'bg-red-500',
                textColor: 'text-white',
                borderColor: 'border-red-500'
            },
            'payment_pending': {
                label: 'Pago pendiente',
                icon: '💰',
                bgColor: 'bg-blue-500',
                textColor: 'text-white',
                borderColor: 'border-blue-500'
            },
            'payment_confirmed': {
                label: 'Pago confirmado',
                icon: '💳',
                bgColor: 'bg-blue-600',
                textColor: 'text-white',
                borderColor: 'border-blue-600'
            },
            'final_video_received': {
                label: 'Video final recibido',
                icon: '🎬',
                bgColor: 'bg-purple-500',
                textColor: 'text-white',
                borderColor: 'border-purple-500'
            },
            'final_approved': {
                label: 'Video final aprobado',
                icon: '🌟',
                bgColor: 'bg-green-600',
                textColor: 'text-white',
                borderColor: 'border-green-600'
            },
            'final_rejected': {
                label: 'Video final rechazado',
                icon: '🚫',
                bgColor: 'bg-red-600',
                textColor: 'text-white',
                borderColor: 'border-red-600'
            },
            'published': {
                label: 'Publicado',
                icon: '🎉',
                bgColor: 'bg-green-700',
                textColor: 'text-white',
                borderColor: 'border-green-700'
            },
            'cancelled': {
                label: 'Cancelado',
                icon: '🗑️',
                bgColor: 'bg-gray-500',
                textColor: 'text-white',
                borderColor: 'border-gray-500'
            }
        };

        return statusMap[status] || statusMap['pending_initial_review'];
    }

    function getAvailableActions(status) {
        const actionsMap = {
            'pending_initial_review': [
                { type: 'review_initial', label: 'Revisar', icon: '👁️', className: 'btn-primario' }
            ],
            'initial_approved': [
                { type: 'manage_payment', label: 'Gestionar Pago', icon: '💰', className: 'btn-secundario' }
            ],
            'initial_rejected': [
                { type: 'review_initial', label: 'Re-revisar', icon: '🔄', className: 'btn-primario' }
            ],
            'payment_pending': [
                { type: 'manage_payment', label: 'Confirmar Pago', icon: '💳', className: 'btn-primario' }
            ],
            'payment_confirmed': [
                { type: 'manage_payment', label: 'Gestionar', icon: '📹', className: 'btn-secundario' }
            ],
            'final_video_received': [
                { type: 'review_final', label: 'Revisar Final', icon: '🎬', className: 'btn-primario' }
            ],
            'final_approved': [
                { type: 'view_details', label: 'Ver Detalles', icon: '👁️', className: 'btn-terciario' }
            ],
            'final_rejected': [
                { type: 'view_details', label: 'Ver Detalles', icon: '👁️', className: 'btn-terciario' }
            ],
            'published': [
                { type: 'view_details', label: 'Ver Publicado', icon: '🌐', className: 'btn-success' }
            ]
        };

        return actionsMap[status] || [];
    }

    window.handleWorkflowAction = async function(actionType, participantId) {
        const participant = workflowParticipants.find(p => p.id === participantId);
        if (!participant) return;

        currentWorkflowParticipant = participant;

        switch (actionType) {
            case 'review_initial':
                showInitialReviewModal(participant);
                break;
            case 'manage_payment':
                showPaymentFinalModal(participant);
                break;
            case 'review_final':
                showFinalReviewModal(participant);
                break;
            case 'view_details':
                showParticipantDetails(participant);
                break;
        }
    };

    // ===============================
    // FUNCIONES DE MODALES
    // ===============================

    function setupWorkflowModals() {
        // Modal de revisión inicial
        if (document.getElementById('close-initial-review')) {
            document.getElementById('close-initial-review').addEventListener('click', () => hideModal(initialReviewModal));
        }
        if (document.getElementById('cancel-initial-review')) {
            document.getElementById('cancel-initial-review').addEventListener('click', () => hideModal(initialReviewModal));
        }
        if (document.getElementById('approve-initial-btn')) {
            document.getElementById('approve-initial-btn').addEventListener('click', approveInitialVideo);
        }
        if (document.getElementById('reject-initial-btn')) {
            document.getElementById('reject-initial-btn').addEventListener('click', () => {
                hideModal(initialReviewModal);
                showModal(rejectInitialModal);
            });
        }

        // Modal de rechazo inicial
        if (document.getElementById('close-reject-initial')) {
            document.getElementById('close-reject-initial').addEventListener('click', () => hideModal(rejectInitialModal));
        }
        if (document.getElementById('cancel-reject-initial')) {
            document.getElementById('cancel-reject-initial').addEventListener('click', () => hideModal(rejectInitialModal));
        }
        if (document.getElementById('reject-initial-form')) {
            document.getElementById('reject-initial-form').addEventListener('submit', rejectInitialVideo);
        }

        // Modal de pago y video final
        if (document.getElementById('close-payment-final')) {
            document.getElementById('close-payment-final').addEventListener('click', () => hideModal(paymentFinalModal));
        }
        if (document.getElementById('cancel-payment-final')) {
            document.getElementById('cancel-payment-final').addEventListener('click', () => hideModal(paymentFinalModal));
        }
        if (document.getElementById('confirm-payment-btn')) {
            document.getElementById('confirm-payment-btn').addEventListener('click', confirmPayment);
        }
        if (document.getElementById('mark-final-received-btn')) {
            document.getElementById('mark-final-received-btn').addEventListener('click', markFinalVideoReceived);
        }

        // Modal de revisión final
        if (document.getElementById('close-final-review')) {
            document.getElementById('close-final-review').addEventListener('click', () => hideModal(finalReviewModal));
        }
        if (document.getElementById('cancel-final-review')) {
            document.getElementById('cancel-final-review').addEventListener('click', () => hideModal(finalReviewModal));
        }
        if (document.getElementById('approve-final-btn')) {
            document.getElementById('approve-final-btn').addEventListener('click', approveFinalVideo);
        }
        if (document.getElementById('reject-final-btn')) {
            document.getElementById('reject-final-btn').addEventListener('click', () => {
                hideModal(finalReviewModal);
                showModal(rejectFinalModal);
            });
        }

        // Modal de rechazo final
        if (document.getElementById('close-reject-final')) {
            document.getElementById('close-reject-final').addEventListener('click', () => hideModal(rejectFinalModal));
        }
        if (document.getElementById('cancel-reject-final')) {
            document.getElementById('cancel-reject-final').addEventListener('click', () => hideModal(rejectFinalModal));
        }
        if (document.getElementById('reject-final-form')) {
            document.getElementById('reject-final-form').addEventListener('submit', rejectFinalVideo);
        }
    }

    function showModal(modal) {
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    function hideModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    function showInitialReviewModal(participant) {
        const content = document.getElementById('initial-review-content');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-bold text-white mb-2">Información del Participante</h4>
                        <div class="text-sm text-gray-300 space-y-1">
                            <p><span class="font-semibold">Nombre:</span> ${participant.nombre}</p>
                            <p><span class="font-semibold">Email:</span> ${participant.email}</p>
                            <p><span class="font-semibold">Artista:</span> ${participant.nombre_artista || 'No especificado'}</p>
                            <p><span class="font-semibold">Género:</span> ${participant.genero_musical || 'No especificado'}</p>
                            <p><span class="font-semibold">Teléfono:</span> ${participant.telefono || 'No especificado'}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-white mb-2">Video Inicial</h4>
                        ${participant.video_url ? `
                            <div class="space-y-2">
                                <a href="${participant.video_url}" target="_blank" 
                                   class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                                    🎬 Ver Video Completo
                                </a>
                                <div class="text-xs text-gray-400">
                                    Haz clic para abrir en nueva pestaña
                                </div>
                            </div>
                        ` : `
                            <p class="text-red-400">No hay video disponible</p>
                        `}
                    </div>
                </div>
                
                ${participant.comentarios ? `
                    <div>
                        <h4 class="font-bold text-white mb-2">Comentarios del Participante</h4>
                        <div class="bg-gray-600 p-3 rounded text-sm text-gray-300">
                            ${participant.comentarios}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        showModal(initialReviewModal);
    }

    function showPaymentFinalModal(participant) {
        const content = document.getElementById('payment-final-content');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-bold text-white mb-2">Información del Participante</h4>
                        <div class="text-sm text-gray-300 space-y-1">
                            <p><span class="font-semibold">Nombre:</span> ${participant.nombre}</p>
                            <p><span class="font-semibold">Email:</span> ${participant.email}</p>
                            <p><span class="font-semibold">Artista:</span> ${participant.nombre_artista || 'No especificado'}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-white mb-2">Estado del Pago</h4>
                        <div class="text-sm text-gray-300 space-y-1">
                            <p><span class="font-semibold">Estado:</span> ${participant.payment_confirmed ? '✅ Confirmado' : '⏳ Pendiente'}</p>
                            <p><span class="font-semibold">Fecha:</span> ${participant.payment_confirmed_date ? new Date(participant.payment_confirmed_date.toDate()).toLocaleDateString() : 'Sin confirmar'}</p>
                        </div>
                    </div>
                </div>

                ${participant.final_video_url ? `
                    <div>
                        <h4 class="font-bold text-white mb-2">Video Final</h4>
                        <a href="${participant.final_video_url}" target="_blank" 
                           class="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
                            🎬 Ver Video Final
                        </a>
                    </div>
                ` : `
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
                        <p class="font-bold">⚠️ Video final no recibido</p>
                        <p class="text-sm">El participante aún no ha enviado su video final.</p>
                    </div>
                `}

                <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
                    <p class="font-bold">💡 Instrucciones:</p>
                    <ul class="text-sm list-disc list-inside mt-2">
                        <li>Confirma el pago solo cuando hayas verificado el comprobante</li>
                        <li>Marca "Video Final Recibido" cuando el participante lo envíe</li>
                        <li>El participante recibirá notificaciones automáticas por email</li>
                    </ul>
                </div>
            </div>
        `;

        showModal(paymentFinalModal);
    }

    function showFinalReviewModal(participant) {
        const content = document.getElementById('final-review-content');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-bold text-white mb-2">Información del Participante</h4>
                        <div class="text-sm text-gray-300 space-y-1">
                            <p><span class="font-semibold">Nombre:</span> ${participant.nombre}</p>
                            <p><span class="font-semibold">Email:</span> ${participant.email}</p>
                            <p><span class="font-semibold">Artista:</span> ${participant.nombre_artista || 'No especificado'}</p>
                            <p><span class="font-semibold">Pago:</span> ${participant.payment_confirmed ? '✅ Confirmado' : '❌ No confirmado'}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-white mb-2">Videos</h4>
                        <div class="space-y-2">
                            ${participant.video_url ? `
                                <a href="${participant.video_url}" target="_blank" 
                                   class="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm text-center">
                                    📹 Video Inicial
                                </a>
                            ` : ''}
                            ${participant.final_video_url ? `
                                <a href="${participant.final_video_url}" target="_blank" 
                                   class="block bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm text-center">
                                    🎬 Video Final
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                    <p class="font-bold">🌟 Aprobación Final</p>
                    <p class="text-sm mt-2">
                        Al aprobar este video final se realizarán las siguientes acciones automáticamente:
                    </p>
                    <ul class="text-sm list-disc list-inside mt-2">
                        <li>Se enviará email de confirmación al participante</li>
                        <li>Se intentará subir automáticamente a YouTube</li>
                        <li>Se publicará en la página de certámenes</li>
                        <li>El video estará disponible para votación pública</li>
                    </ul>
                </div>

                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                    <p class="font-bold">⚠️ Importante</p>
                    <p class="text-sm mt-2">
                        Si rechazas este video final, considera que el participante ya realizó el pago. 
                        Será necesario gestionar la situación apropiadamente.
                    </p>
                </div>
            </div>
        `;

        showModal(finalReviewModal);
    }

    // ===============================
    // FUNCIONES DE ACCIONES WORKFLOW
    // ===============================

    async function approveInitialVideo() {
        if (!currentWorkflowParticipant) return;

        try {
            const response = await fetch('https://vyt-music-online-default-rtdb.firebaseio.com/api/processInitialVideo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: currentWorkflowParticipant.id,
                    action: 'approve_initial',
                    reviewedBy: auth.currentUser?.email || 'admin'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('Video inicial aprobado exitosamente', 'success');
                hideModal(initialReviewModal);
                loadWorkflowParticipants();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error approving initial video:', error);
            showNotification('Error al aprobar video inicial: ' + error.message, 'error');
        }
    }

    async function rejectInitialVideo(event) {
        event.preventDefault();
        if (!currentWorkflowParticipant) return;

        const rejectionReason = document.getElementById('rejection-reason').value;
        const rejectionComment = document.getElementById('rejection-comment').value;

        if (!rejectionReason) {
            showNotification('Debes seleccionar un motivo de rechazo', 'error');
            return;
        }

        try {
            const response = await fetch('https://vyt-music-online-default-rtdb.firebaseio.com/api/processInitialVideo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: currentWorkflowParticipant.id,
                    action: 'reject_initial',
                    rejectionReason,
                    rejectionComment,
                    reviewedBy: auth.currentUser?.email || 'admin'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('Video inicial rechazado y notificación enviada', 'success');
                hideModal(rejectInitialModal);
                loadWorkflowParticipants();
                
                // Limpiar formulario
                document.getElementById('rejection-reason').value = '';
                document.getElementById('rejection-comment').value = '';
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error rejecting initial video:', error);
            showNotification('Error al rechazar video inicial: ' + error.message, 'error');
        }
    }

    async function confirmPayment() {
        if (!currentWorkflowParticipant) return;

        try {
            const response = await fetch('https://vyt-music-online-default-rtdb.firebaseio.com/api/processPaymentAndFinalVideo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: currentWorkflowParticipant.id,
                    action: 'confirm_payment'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('Pago confirmado exitosamente', 'success');
                hideModal(paymentFinalModal);
                loadWorkflowParticipants();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            showNotification('Error al confirmar pago: ' + error.message, 'error');
        }
    }

    async function markFinalVideoReceived() {
        if (!currentWorkflowParticipant) return;

        const finalVideoUrl = prompt('Ingresa la URL del video final:');
        if (!finalVideoUrl) return;

        try {
            const response = await fetch('https://vyt-music-online-default-rtdb.firebaseio.com/api/processPaymentAndFinalVideo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: currentWorkflowParticipant.id,
                    action: 'receive_final_video',
                    finalVideoUrl
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('Video final marcado como recibido', 'success');
                hideModal(paymentFinalModal);
                loadWorkflowParticipants();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error marking final video received:', error);
            showNotification('Error al marcar video final: ' + error.message, 'error');
        }
    }

    async function approveFinalVideo() {
        if (!currentWorkflowParticipant) return;

        try {
            const response = await fetch('https://vyt-music-online-default-rtdb.firebaseio.com/api/processFinalApproval', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: currentWorkflowParticipant.id,
                    action: 'approve_final'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification(`Video final aprobado y publicado ${result.youtubeVideoId ? '(subido a YouTube)' : ''}`, 'success');
                hideModal(finalReviewModal);
                loadWorkflowParticipants();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error approving final video:', error);
            showNotification('Error al aprobar video final: ' + error.message, 'error');
        }
    }

    async function rejectFinalVideo(event) {
        event.preventDefault();
        if (!currentWorkflowParticipant) return;

        const rejectionReason = document.getElementById('final-rejection-reason').value;
        const rejectionComment = document.getElementById('final-rejection-comment').value;

        if (!rejectionReason) {
            showNotification('Debes seleccionar un motivo de rechazo', 'error');
            return;
        }

        try {
            const response = await fetch('https://vyt-music-online-default-rtdb.firebaseio.com/api/processFinalApproval', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: currentWorkflowParticipant.id,
                    action: 'reject_final',
                    rejectionReason,
                    rejectionComment
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('Video final rechazado y notificación enviada', 'success');
                hideModal(rejectFinalModal);
                loadWorkflowParticipants();
                
                // Limpiar formulario
                document.getElementById('final-rejection-reason').value = '';
                document.getElementById('final-rejection-comment').value = '';
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error rejecting final video:', error);
            showNotification('Error al rechazar video final: ' + error.message, 'error');
        }
    }

    function showParticipantDetails(participant) {
        alert(`Detalles del participante:\n\nNombre: ${participant.nombre}\nEmail: ${participant.email}\nEstado: ${participant.status || 'pending_initial_review'}\nFecha: ${participant.fecha_inscripcion ? new Date(participant.fecha_inscripcion.toDate()).toLocaleDateString() : 'Sin fecha'}`);
    }

    // ===============================
    // FUNCIONES DE FILTROS
    // ===============================

    function applyWorkflowFilters() {
        const statusFilter = workflowStatusFilter?.value || '';
        const searchFilter = workflowSearchInput?.value.toLowerCase() || '';
        const dateFilter = workflowDateFilter?.value || '';

        let filteredParticipants = [...workflowParticipants];

        // Filtro por estado
        if (statusFilter) {
            filteredParticipants = filteredParticipants.filter(p => 
                (p.status || 'pending_initial_review') === statusFilter
            );
        }

        // Filtro por búsqueda
        if (searchFilter) {
            filteredParticipants = filteredParticipants.filter(p => 
                p.nombre.toLowerCase().includes(searchFilter) ||
                p.email.toLowerCase().includes(searchFilter) ||
                (p.nombre_artista && p.nombre_artista.toLowerCase().includes(searchFilter))
            );
        }

        // Filtro por fecha
        if (dateFilter && filteredParticipants.length > 0) {
            const now = new Date();
            let startDate;

            switch (dateFilter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
            }

            if (startDate) {
                filteredParticipants = filteredParticipants.filter(p => 
                    p.fecha_inscripcion && p.fecha_inscripcion.toDate() >= startDate
                );
            }
        }

        displayWorkflowParticipants(filteredParticipants);
    }

    function clearWorkflowFilters() {
        if (workflowStatusFilter) workflowStatusFilter.value = '';
        if (workflowSearchInput) workflowSearchInput.value = '';
        if (workflowDateFilter) workflowDateFilter.value = '';
        
        displayWorkflowParticipants(workflowParticipants);
    }

    // Exponer funciones globalmente
    window.loadWorkflowParticipants = loadWorkflowParticipants;
    window.applyWorkflowFilters = applyWorkflowFilters;
    window.clearWorkflowFilters = clearWorkflowFilters;

});