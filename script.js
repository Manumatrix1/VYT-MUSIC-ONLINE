document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelectorAll('.nav-menu a'); // Todos los enlaces del sidebar
    const navLinksInternal = document.querySelectorAll('.nav-menu a[data-target]'); // Enlaces SPA del sidebar
    const dropdownLinks = document.querySelectorAll('.dropdown > a');
    const pages = document.querySelectorAll('.page');
    const sidebarLogo = document.querySelector('.sidebar-logo');
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-bar a'); // Enlaces de la barra inferior

    // --- Funciones de Utilidad ---

    // Función para mostrar una página interna y ocultar las demás
    function showPage(targetId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.add('active');
            document.querySelector('.main-content').scrollTop = 0; // Desplazar al inicio del contenido
        }
        // Cierra el sidebar en móvil después de navegar
        if (window.innerWidth < 1024) { // Usa 1024px como breakpoint para móvil/escritorio
            sidebar.classList.remove('open');
        }
    }

    // Función para actualizar el estado 'active' de los enlaces de navegación
    function updateActiveNav(targetId) {
        // Desactivar todos los enlaces del sidebar
        navLinksInternal.forEach(nav => nav.classList.remove('active'));
        // Desactivar todos los enlaces de la barra inferior
        mobileNavLinks.forEach(nav => nav.classList.remove('active'));

        // Activar el enlace correspondiente en el sidebar (si existe y es interno)
        const sidebarActiveLink = document.querySelector(`.nav-menu a[data-target="${targetId}"]`);
        if (sidebarActiveLink) {
            sidebarActiveLink.classList.add('active');
        }

        // Activar el enlace correspondiente en la barra inferior (si existe y es interno)
        const mobileNavActiveLink = document.querySelector(`.mobile-nav-bar a[data-target="${targetId}"]`);
        if (mobileNavActiveLink) {
            mobileNavActiveLink.classList.add('active');
        }
    }


    // --- Manejo de la Navegación SPA ---

    // Toggle del menú de hamburguesa en móvil
    // Se asegura de que menuToggle exista antes de añadir el event listener
    if (menuToggle) { 
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Manejar clics en los enlaces de navegación de la barra lateral (sidebar)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.dataset.target) { // Es un enlace interno (SPA)
                e.preventDefault(); 
                const targetId = link.dataset.target;

                updateActiveNav(targetId); // Actualiza ambos navs
                showPage(targetId);

                // Cierra cualquier dropdown abierto en el sidebar
                document.querySelectorAll('.dropdown.open').forEach(dropdown => {
                    dropdown.classList.remove('open');
                });

            }
            // Si no tiene data-target, es un enlace href y el navegador lo manejará (recarga la página)
        });
    });

    // Manejar clics en los enlaces de la barra de navegación inferior (mobile-nav-bar)
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.dataset.target) { // Es un enlace interno (SPA)
                e.preventDefault();
                const targetId = link.dataset.target;
                updateActiveNav(targetId); // Actualiza ambos navs
                showPage(targetId);
            }
            // Si no tiene data-target, es un enlace href y el navegador lo manejará (recarga la página)
        });
    });


    // Manejar el clic en el logo de la barra lateral para ir a Inicio
    sidebarLogo.addEventListener('click', (e) => {
        e.preventDefault();
        updateActiveNav('page-inicio');
        showPage('page-inicio');
    });

    // Manejar clics en los botones del Hero para ir a secciones específicas
    heroButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (button.dataset.target) { // Es un enlace interno (SPA)
                e.preventDefault();
                const targetId = button.dataset.target;
                updateActiveNav(targetId);
                showPage(targetId);
            }
            // Si no tiene data-target, es un enlace href y el navegador lo manejará
        });
    });

    // Manejar dropdowns en la barra lateral
    dropdownLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const parentDropdown = link.closest('.dropdown');
            if (parentDropdown) {
                parentDropdown.classList.toggle('open');
            }
        });
    });

    // --- Lógica para Comprar VYT (Modal de Pago MODO y Subida de Comprobante) ---
    const buyVytButtons = document.querySelectorAll('.buy-vyt-btn');
    const modoPaymentModal = document.getElementById('modo-payment-modal');
    const receiptUploadModal = document.getElementById('receipt-upload-modal');
    const modalVytAmount = document.getElementById('modal-vyt-amount');
    const modalPaymentAmount = document.getElementById('modal-payment-amount');
    const modoAlias = document.getElementById('modo-alias'); // Alias fijo por ahora
    const uploadReceiptBtn = document.getElementById('upload-receipt-btn');
    const closePaymentModalBtn = document.getElementById('close-payment-modal-btn');
    const receiptFileInput = document.getElementById('receipt-file-input');
    const submitReceiptBtn = document.getElementById('submit-receipt-btn');
    const receiptUploadStatus = document.getElementById('receipt-upload-status');
    const closeReceiptModalBtn = document.getElementById('close-receipt-modal-btn');

    let currentPurchase = {
        vyt: 0,
        amount: 0
    };

    buyVytButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentPurchase.vyt = button.dataset.vyt;
            currentPurchase.amount = button.dataset.amount;

            modalVytAmount.textContent = currentPurchase.vyt;
            modalPaymentAmount.textContent = `$${currentPurchase.amount} ARS`;
            modoPaymentModal.classList.add('visible');
        });
    });

    uploadReceiptBtn.addEventListener('click', () => {
        modoPaymentModal.classList.remove('visible');
        receiptUploadModal.classList.add('visible');
    });

    closePaymentModalBtn.addEventListener('click', () => {
        modoPaymentModal.classList.remove('visible');
    });

    closeReceiptModalBtn.addEventListener('click', () => {
        receiptUploadModal.classList.remove('visible');
        receiptFileInput.value = ''; // Limpiar input de archivo
        receiptUploadStatus.classList.add('hidden');
    });

    submitReceiptBtn.addEventListener('click', async () => {
        const file = receiptFileInput.files[0];
        if (!file) {
            receiptUploadStatus.textContent = 'Por favor, selecciona un archivo.';
            receiptUploadStatus.className = 'text-sm mt-2 text-red-400';
            receiptUploadStatus.classList.remove('hidden');
            return;
        }

        receiptUploadStatus.textContent = 'Subiendo comprobante...';
        receiptUploadStatus.className = 'text-sm mt-2 text-yellow-400';
        receiptUploadStatus.classList.remove('hidden');

        // Simulación de subida de archivo (en un entorno real, usarías Firebase Storage)
        setTimeout(() => {
            receiptUploadStatus.textContent = 'Comprobante subido exitosamente. ¡Gracias por tu compra!';
            receiptUploadStatus.className = 'text-sm mt-2 text-green-400';
            receiptFileInput.value = ''; // Limpiar input de archivo
            // Aquí podrías cerrar el modal después de un tiempo o redirigir
            setTimeout(() => {
                receiptUploadModal.classList.remove('visible');
                receiptUploadStatus.classList.add('hidden');
            }, 3000);
        }, 2000);
    });

    // --- Integración de Firebase (para la generación de bio con IA - FUTURO) ---
    // NOTA: Esta sección está comentada y es solo un placeholder.
    // Para que funcione, necesitarías configurar Firebase y la función de IA.
    /*
    import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
    const functions = getFunctions(app); // 'app' de tu inicialización de Firebase

    const generateBioBtn = document.getElementById('generate-bio-btn');
    const artistNameInputBio = document.getElementById('artist-name-bio');
    const artistGenreInputBio = document.getElementById('artist-genre-bio');
    const bioOutput = document.getElementById('bio-output');
    const bioStatus = document.getElementById('bio-status');

    if (generateBioBtn) {
        generateBioBtn.addEventListener('click', async () => {
            const artistName = artistNameInputBio.value;
            const artistGenre = artistGenreInputBio.value;

            if (!artistName || !artistGenre) {
                bioStatus.textContent = 'Por favor, ingresa el nombre y género del artista.';
                bioStatus.className = 'text-sm mt-2 text-red-400';
                return;
            }

            bioStatus.textContent = 'Generando biografía con IA...';
            bioStatus.className = 'text-sm mt-2 text-yellow-400';
            bioOutput.textContent = '';
            generateBioBtn.disabled = true;
            generateBioBtn.innerHTML = '<span class="spinner"></span> Generando...';

            try {
                // Simulación de llamada a función de IA (reemplazar con la llamada real a la API de Gemini)
                // const generateArtistBio = httpsCallable(functions, 'generateArtistBio');
                // const result = await generateArtistBio({ name: artistName, genre: artistGenre });
                // const generatedText = result.data.bio;

                // Simulación de respuesta de IA
                const simulatedBio = `[Bio generada por IA para ${artistName}, género ${artistGenre}] ${artistName} es un/a talentoso/a artista de ${artistGenre} que ha cautivado al público con su estilo único y letras profundas. Su música es una fusión de ritmos vibrantes y melodías pegadizas, creando una experiencia auditiva inolvidable.`;
                
                bioOutput.textContent = simulatedBio;
                bioStatus.textContent = 'Biografía generada.';
                bioStatus.className = 'text-sm mt-2 text-green-400';

            } catch (error) {
                console.error("Error al generar biografía:", error);
                bioStatus.textContent = `Error al generar biografía: ${error.message}`;
                bioStatus.className = 'text-sm mt-2 text-red-400';
            } finally {
                generateBioBtn.disabled = false;
                generateBioBtn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m7 0V5a2 2 0 012-2h2a2 2 0 012 2v6m-6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v6"></path></svg> Generar Biografía';
            }
        });
    }
    */
});
