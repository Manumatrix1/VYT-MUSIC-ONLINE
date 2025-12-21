import { auth, db, storage, functions } from './firebase-config.js';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, getDoc, onSnapshot, setDoc, addDoc, deleteDoc, query, orderBy, where, serverTimestamp, writeBatch, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginBtn = document.getElementById('login-btn');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const loginErrorDiv = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const adminUserEmailSpan = document.getElementById('admin-user-email');

    // Función para mostrar secciones
    function showPage(pageId) {
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(pageId + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    // Función para renderizar participante
    function renderParticipant(doc, data, collectionName, isApproved = false) {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-card bg-white border border-gray-200 p-4 rounded-lg shadow-sm mb-4';
        
        // Extraer ID de YouTube del video
        function getYouTubeVideoId(url) {
            if (!url) return null;
            const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const match = url.match(regex);
            return match ? match[1] : null;
        }

        const videoId = getYouTubeVideoId(data.video_link || data.videoLink);
        const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

        participantDiv.innerHTML = `
            <!-- Foto del participante (centrada en móvil) -->
            <div class="participant-info text-center md:text-left mb-4">
                <div class="participant-image-container flex justify-center md:justify-start mb-3">
                    ${data.foto_url || data.fotoUrl ? 
                        `<img src="${data.foto_url || data.fotoUrl}" alt="Foto" class="participant-image w-20 h-20 md:w-16 md:h-16 rounded-full object-cover border-4 border-blue-200">` : 
                        '<div class="participant-image w-20 h-20 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">👤</div>'
                    }
                </div>
                
                <!-- Información del participante -->
                <h4 class="font-bold text-lg md:text-xl text-gray-800 mb-2">${data.nombre_artista || data.nombreArtista || 'Sin nombre'}</h4>
                <p class="text-gray-600 mb-1 text-sm md:text-base">📧 ${data.email || data.correo || 'Sin email'}</p>
                <p class="text-sm text-blue-600 font-medium mb-2">📍 ${collectionName.includes('online') ? 'Online' : 'Presencial'}</p>
            </div>
            
            <!-- Video de casting -->
            ${data.video_link || data.videoLink ? `
                <div class="mb-4">
                    <p class="text-sm font-medium text-gray-700 mb-2 text-center md:text-left">🎥 Video de casting:</p>
                    <div class="flex flex-col md:flex-row items-center gap-3">
                        ${thumbnailUrl ? 
                            `<img src="${thumbnailUrl}" alt="Video thumbnail" class="participant-video w-full md:w-32 h-40 md:h-20 rounded object-cover border cursor-pointer" onclick="window.open('${data.video_link || data.videoLink}', '_blank')">` :
                            '<div class="w-full md:w-32 h-40 md:h-20 bg-gray-200 rounded flex items-center justify-center">🎥</div>'
                        }
                        <a href="${data.video_link || data.videoLink}" target="_blank" 
                           class="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-3 md:py-2 rounded font-medium transition-colors text-center">
                            ▶️ Ver Video Completo
                        </a>
                    </div>
                </div>
            ` : '<p class="text-red-500 mb-4 text-center md:text-left">⚠️ Sin video de casting</p>'}
            
            <!-- Información adicional -->
            <div class="text-center md:text-left mb-4">
                <p class="text-xs text-gray-400">ID: ${doc.id}</p>
                <p class="text-xs text-gray-400">Colección: ${collectionName}</p>
                ${data.fecha_inscripcion ? `<p class="text-xs text-gray-400">Inscrito: ${new Date(data.fecha_inscripcion.seconds * 1000).toLocaleDateString()}</p>` : ''}
            </div>
            
            <!-- Botones de acción -->
                <div class="flex flex-col gap-2">
                    ${!isApproved ? `
                        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2" 
                                onclick="aprobarParticipante('${doc.id}', '${collectionName}')" title="Aprobar participante">
                            ✅ Aprobar
                        </button>
                        <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2" 
                                onclick="rechazarParticipante('${doc.id}', '${collectionName}')" title="Rechazar participante">
                            ❌ Rechazar
                        </button>
                    ` : `
                        <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2" 
                                onclick="desaprobarParticipante('${doc.id}', '${collectionName}')" title="Desaprobar y mover a pendientes">
                            � Desaprobar
                        </button>
                        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2" 
                                onclick="verDetalles('${doc.id}', '${collectionName}')" title="Ver detalles completos">
                            👁️ Detalles
                        </button>
                    `}
                </div>
            </div>
        `;
        
        return participantDiv;
    }

    // Cargar participantes online
    window.loadParticipantesOnline = function() {
        console.log('Cargando participantes online...');
        
        const pendientesElement = document.getElementById('participantes-online-pendientes');
        const aprobadosElement = document.getElementById('participantes-online-aprobados');
        
        if (!pendientesElement || !aprobadosElement) {
            console.error('Elementos no encontrados');
            return;
        }

        // Cargar participantes pendientes (no aprobados)
        const pendientesRef = query(collection(db, 'participantes_online'), where("aprobado", "==", false));
        onSnapshot(pendientesRef, snapshot => {
            pendientesElement.innerHTML = '';
            if (snapshot.empty) {
                pendientesElement.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-2">✅</div>
                        <p class="font-medium">No hay participantes online pendientes</p>
                    </div>
                `;
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const participantDiv = renderParticipant(doc, data, 'participantes_online', false);
                    pendientesElement.appendChild(participantDiv);
                });
            }
        });

        // Cargar participantes aprobados
        const aprobadosRef = query(collection(db, 'participantes_online'), where("aprobado", "==", true));
        onSnapshot(aprobadosRef, snapshot => {
            aprobadosElement.innerHTML = '';
            if (snapshot.empty) {
                aprobadosElement.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-2">👥</div>
                        <p class="font-medium">No hay participantes online aprobados</p>
                    </div>
                `;
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const participantDiv = renderParticipant(doc, data, 'participantes_online', true);
                    aprobadosElement.appendChild(participantDiv);
                });
            }
        });
    };

    // Cargar participantes presenciales
    window.loadParticipantesPresenciales = function() {
        console.log('Cargando participantes presenciales...');
        
        const pendientesElement = document.getElementById('participantes-presenciales-pendientes');
        const aprobadosElement = document.getElementById('participantes-presenciales-aprobados');
        
        if (!pendientesElement || !aprobadosElement) {
            console.error('Elementos no encontrados');
            return;
        }

        // Cargar participantes pendientes (no aprobados)
        const pendientesRef = query(collection(db, 'participantes_presenciales'), where("aprobado", "==", false));
        onSnapshot(pendientesRef, snapshot => {
            pendientesElement.innerHTML = '';
            if (snapshot.empty) {
                pendientesElement.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-2">✅</div>
                        <p class="font-medium">No hay participantes presenciales pendientes</p>
                    </div>
                `;
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const participantDiv = renderParticipant(doc, data, 'participantes_presenciales', false);
                    pendientesElement.appendChild(participantDiv);
                });
            }
        });

        // Cargar participantes aprobados
        const aprobadosRef = query(collection(db, 'participantes_presenciales'), where("aprobado", "==", true));
        onSnapshot(aprobadosRef, snapshot => {
            aprobadosElement.innerHTML = '';
            if (snapshot.empty) {
                aprobadosElement.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-2">👥</div>
                        <p class="font-medium">No hay participantes presenciales aprobados</p>
                    </div>
                `;
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const participantDiv = renderParticipant(doc, data, 'participantes_presenciales', true);
                    aprobadosElement.appendChild(participantDiv);
                });
            }
        });
    };

    // Funciones de acción
    window.aprobarParticipante = async function(participantId, collectionName) {
        if (!confirm('¿Estás seguro de que quieres aprobar este participante?')) return;
        
        // Efecto visual en el botón
        const buttonElement = event.target.closest('button');
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '⏳ Aprobando...';
        buttonElement.disabled = true;
        
        try {
            await updateDoc(doc(db, collectionName, participantId), { 
                aprobado: true,
                fecha_aprobacion: serverTimestamp()
            });
            
            // Mostrar notificación de éxito
            showNotification('✅ Participante aprobado exitosamente', 'success');
            
            // No necesitamos recargar nada - onSnapshot se encarga automáticamente
            
        } catch (error) {
            console.error('Error al aprobar:', error);
            showNotification('❌ Error al aprobar participante', 'error');
            
            // Restaurar botón en caso de error
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }
    };

    window.rechazarParticipante = async function(participantId, collectionName) {
        const motivo = prompt('Motivo del rechazo (opcional):') || 'No especificado';
        if (!confirm('¿Estás seguro de que quieres rechazar este participante?')) return;
        
        // Efecto visual en el botón
        const buttonElement = event.target.closest('button');
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '⏳ Rechazando...';
        buttonElement.disabled = true;
        
        try {
            await updateDoc(doc(db, collectionName, participantId), { 
                aprobado: false,
                rechazado: true,
                motivo_rechazo: motivo,
                fecha_rechazo: serverTimestamp()
            });
            
            showNotification('❌ Participante rechazado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al rechazar:', error);
            showNotification('❌ Error al rechazar participante', 'error');
            
            // Restaurar botón en caso de error
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }
    };

    window.desaprobarParticipante = async function(participantId, collectionName) {
        // Confirmación de seguridad
        if (!confirm('⚠️ ¿Estás seguro de que quieres DESAPROBAR a este participante?\n\nEsto lo moverá de "Aprobados" a "Pendientes" automáticamente.')) return;
        
        // Encontrar el botón que se clickeó para mostrar estado de carga
        const buttonElement = event.target.closest('button');
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '⏳ Procesando...';
        buttonElement.disabled = true;
        
        try {
            // Actualizar el documento en Firestore
            await updateDoc(doc(db, collectionName, participantId), { 
                aprobado: false,
                fecha_desaprobacion: serverTimestamp(),
                motivo_desaprobacion: 'Desaprobado por administrador'
            });
            
            // Mostrar notificación de éxito
            showNotification('� Participante desaprobado exitosamente. Se movió a "Pendientes"', 'success');
            
            // Los listeners onSnapshot se encargan automáticamente de:
            // 1. Remover de la lista de "Aprobados"
            // 2. Agregarlo a la lista de "Pendientes"
            // No necesitamos recargar nada manualmente
            
        } catch (error) {
            console.error('Error al desaprobar:', error);
            showNotification('❌ Error al desaprobar participante', 'error');
            
            // Restaurar botón en caso de error
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }
    };

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm transition-all duration-300 transform translate-x-full`;
        
        // Aplicar colores según el tipo
        switch(type) {
            case 'success':
                notification.classList.add('bg-green-500');
                break;
            case 'error':
                notification.classList.add('bg-red-500');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-500');
                break;
            default:
                notification.classList.add('bg-blue-500');
        }
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    ✕
                </button>
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    window.verDetalles = async function(participantId, collectionName) {
        try {
            const docRef = doc(db, collectionName, participantId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                const detalles = JSON.stringify(data, null, 2);
                alert(`Detalles del participante:\n\n${detalles}`);
            } else {
                alert('No se encontró el participante');
            }
        } catch (error) {
            console.error('Error al obtener detalles:', error);
            alert('Error al obtener detalles');
        }
    };

    // Autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            if (adminUserEmailSpan) {
                adminUserEmailSpan.textContent = `Bienvenido, ${user.email}`;
            }
            
            // Cargar participantes automáticamente
            setTimeout(() => {
                loadParticipantesOnline();
                loadParticipantesPresenciales();
            }, 500);
            
        } else {
            loginSection.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
        }
    });

    // Login
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = adminEmailInput.value;
            const password = adminPasswordInput.value;
            
            if (!email || !password) {
                if (loginErrorDiv) {
                    loginErrorDiv.textContent = 'Por favor, ingresa email y contraseña';
                    loginErrorDiv.classList.remove('hidden');
                }
                return;
            }
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                if (loginErrorDiv) {
                    loginErrorDiv.classList.add('hidden');
                }
            } catch (error) {
                console.error('Error de login:', error);
                if (loginErrorDiv) {
                    loginErrorDiv.textContent = 'Error de autenticación: ' + error.message;
                    loginErrorDiv.classList.remove('hidden');
                }
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth);
        });
    }

    // Hacer showPage global
    window.showPage = showPage;

    // ====== SISTEMA DE EDITOR DE CONTENIDO ======
    
    // Elementos del editor
    const pageSelector = document.getElementById('page-selector');
    const loadPageContentBtn = document.getElementById('load-page-content');
    const previewPageBtn = document.getElementById('preview-page');
    const contentEditorPanel = document.getElementById('content-editor-panel');
    const editorWelcome = document.getElementById('editor-welcome');
    const pageInfo = document.getElementById('page-info');

    // Datos de páginas disponibles
    const pagesInfo = {
        principal: {
            name: 'Página Principal',
            file: 'principal.html',
            description: 'Contenido principal del sitio, banners, videos destacados'
        },
        inscripcion: {
            name: 'Página de Inscripción',
            file: 'inscripcion_online.html',
            description: 'Formularios de inscripción y información de certámenes'
        },
        certamenes: {
            name: 'Página de Certámenes',
            file: 'certamenes-galeria.html',
            description: 'Galería de certámenes y eventos'
        },
        reglamento: {
            name: 'Reglamento',
            file: 'reglamento.html',
            description: 'Reglas y normativas del certamen'
        },
        sponsors: {
            name: 'Sponsors',
            file: 'sponsors.html',
            description: 'Patrocinadores y colaboradores'
        },
        perfil: {
            name: 'Perfil Artista',
            file: 'perfil.html',
            description: 'Página de perfil de artistas'
        },
        blog: {
            name: 'Blog/Noticias',
            file: 'blog.html',
            description: 'Noticias y artículos del blog'
        }
    };

    // Función para cargar contenido de página
    async function loadPageContent() {
        const selectedPage = pageSelector.value;
        if (!selectedPage) {
            alert('Por favor selecciona una página');
            return;
        }

        try {
            // Mostrar información de la página
            const pageData = pagesInfo[selectedPage];
            pageInfo.querySelector('p').textContent = `📄 ${pageData.name}: ${pageData.description}`;
            pageInfo.classList.remove('hidden');

            // Cargar contenido existente de Firestore
            const pageDoc = await getDoc(doc(db, 'paginas_contenido', selectedPage));
            
            if (pageDoc.exists()) {
                const content = pageDoc.data();
                populateEditor(content);
            } else {
                // Crear estructura vacía
                const emptyContent = {
                    banner: { title: '', subtitle: '', imageUrl: '' },
                    gallery: [],
                    videos: [],
                    textBlocks: [],
                    lastModified: new Date(),
                    page: selectedPage
                };
                populateEditor(emptyContent);
            }

            // Mostrar editor y ocultar mensaje de bienvenida
            contentEditorPanel.classList.remove('hidden');
            editorWelcome.classList.add('hidden');

        } catch (error) {
            console.error('Error cargando contenido:', error);
            alert('Error al cargar el contenido de la página');
        }
    }

    // Función para poblar el editor con datos
    function populateEditor(content) {
        // Banner
        document.getElementById('page-banner-title').value = content.banner?.title || '';
        document.getElementById('page-banner-subtitle').value = content.banner?.subtitle || '';
        document.getElementById('page-banner-url').value = content.banner?.imageUrl || '';

        // Limpiar listas
        document.getElementById('gallery-items').innerHTML = '';
        document.getElementById('video-items').innerHTML = '';
        document.getElementById('text-blocks').innerHTML = '';

        // Cargar galería
        if (content.gallery && content.gallery.length > 0) {
            content.gallery.forEach((item, index) => {
                addGalleryItemToDOM(item, index);
            });
        }

        // Cargar videos
        if (content.videos && content.videos.length > 0) {
            content.videos.forEach((item, index) => {
                addVideoItemToDOM(item, index);
            });
        }

        // Cargar bloques de texto
        if (content.textBlocks && content.textBlocks.length > 0) {
            content.textBlocks.forEach((item, index) => {
                addTextBlockToDOM(item, index);
            });
        }
    }

    // Función para agregar item de galería al DOM
    function addGalleryItemToDOM(item, index) {
        const galleryItems = document.getElementById('gallery-items');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'relative group';
        itemDiv.innerHTML = `
            <img src="${item.url}" alt="${item.title}" class="w-full h-32 object-cover rounded border">
            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onclick="removeGalleryItem(${index})" class="bg-red-500 text-white px-2 py-1 rounded text-xs">
                    🗑️ Eliminar
                </button>
            </div>
            <p class="text-xs mt-1 text-gray-600">${item.title}</p>
        `;
        galleryItems.appendChild(itemDiv);
    }

    // Función para agregar video al DOM
    function addVideoItemToDOM(item, index) {
        const videoItems = document.getElementById('video-items');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'border rounded p-3 bg-gray-50';
        
        // Extraer ID de YouTube para thumbnail
        const videoId = extractYouTubeId(item.url);
        const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
        
        itemDiv.innerHTML = `
            <div class="flex gap-3">
                ${thumbnail ? `<img src="${thumbnail}" alt="Video" class="w-20 h-15 object-cover rounded">` : '📹'}
                <div class="flex-1">
                    <h4 class="font-medium">${item.title}</h4>
                    <p class="text-sm text-gray-600">${item.description}</p>
                    <a href="${item.url}" target="_blank" class="text-blue-500 text-xs">🔗 Ver video</a>
                </div>
                <button onclick="removeVideoItem(${index})" class="bg-red-500 text-white px-2 py-1 rounded text-xs h-fit">
                    🗑️
                </button>
            </div>
        `;
        videoItems.appendChild(itemDiv);
    }

    // Función para agregar bloque de texto al DOM
    function addTextBlockToDOM(item, index) {
        const textBlocks = document.getElementById('text-blocks');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'border rounded p-3 bg-gray-50';
        
        const typeEmojis = {
            paragraph: '📝',
            heading: '📑',
            list: '📋',
            quote: '💭',
            info: 'ℹ️'
        };
        
        itemDiv.innerHTML = `
            <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span>${typeEmojis[item.type] || '📝'}</span>
                        <strong>${item.title || 'Bloque de texto'}</strong>
                        <span class="text-xs text-gray-500">(${item.type})</span>
                    </div>
                    <p class="text-sm text-gray-700">${item.content.substring(0, 150)}${item.content.length > 150 ? '...' : ''}</p>
                </div>
                <button onclick="removeTextBlock(${index})" class="bg-red-500 text-white px-2 py-1 rounded text-xs">
                    🗑️
                </button>
            </div>
        `;
        textBlocks.appendChild(itemDiv);
    }

    // Función para extraer ID de YouTube
    function extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    // Función para guardar contenido
    async function savePageContent() {
        const selectedPage = pageSelector.value;
        if (!selectedPage) {
            alert('No hay página seleccionada');
            return;
        }

        try {
            const content = {
                page: selectedPage,
                banner: {
                    title: document.getElementById('page-banner-title').value,
                    subtitle: document.getElementById('page-banner-subtitle').value,
                    imageUrl: document.getElementById('page-banner-url').value
                },
                gallery: getCurrentGalleryItems(),
                videos: getCurrentVideoItems(),
                textBlocks: getCurrentTextBlocks(),
                lastModified: serverTimestamp(),
                publishedBy: auth.currentUser.email
            };

            await setDoc(doc(db, 'paginas_contenido', selectedPage), content);
            
            showSaveStatus('✅ Contenido guardado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error guardando contenido:', error);
            showSaveStatus('❌ Error al guardar contenido', 'error');
        }
    }

    // Función para mostrar estado de guardado
    function showSaveStatus(message, type) {
        const saveStatus = document.getElementById('save-status');
        saveStatus.className = `mt-3 p-3 rounded ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        saveStatus.querySelector('p').textContent = message;
        saveStatus.classList.remove('hidden');
        
        setTimeout(() => {
            saveStatus.classList.add('hidden');
        }, 3000);
    }

    // Funciones auxiliares para obtener datos actuales
    function getCurrentGalleryItems() {
        // Implementar lógica para obtener items de galería actual
        return [];
    }

    function getCurrentVideoItems() {
        // Implementar lógica para obtener videos actuales
        return [];
    }

    function getCurrentTextBlocks() {
        // Implementar lógica para obtener bloques de texto actuales
        return [];
    }

    // Event listeners del editor
    if (loadPageContentBtn) {
        loadPageContentBtn.addEventListener('click', loadPageContent);
    }

    if (previewPageBtn) {
        previewPageBtn.addEventListener('click', () => {
            const selectedPage = pageSelector.value;
            if (selectedPage && pagesInfo[selectedPage]) {
                window.open(pagesInfo[selectedPage].file, '_blank');
            }
        });
    }

    const savePageContentBtn = document.getElementById('save-page-content');
    if (savePageContentBtn) {
        savePageContentBtn.addEventListener('click', savePageContent);
    }

    // Hacer funciones globales
    window.loadPageContent = loadPageContent;
    window.savePageContent = savePageContent;
    window.removeGalleryItem = function(index) { /* Implementar */ };
    window.removeVideoItem = function(index) { /* Implementar */ };
    window.removeTextBlock = function(index) { /* Implementar */ };
});