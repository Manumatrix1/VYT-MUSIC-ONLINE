/**
 * 🎵 VYT MUSIC - Manejador de Formularios de Inscripción
 * Sistema completo para manejar inscripciones online y presenciales
 */

class InscriptionFormHandler {
    constructor(formType = 'online') {
        this.formType = formType;
        this.validator = new InscriptionValidator();
        this.validationUI = new ValidationUI(this.validator);
        this.certamenes = [];
        this.selectedCertamen = null;
        this.isSubmitting = false;
        this.currentUser = null;

        this.init();
    }

    /**
     * Inicializar el manejador
     */
    async init() {
        await this.loadCertamenes();
        this.setupEventListeners();
        this.setupRealTimeValidation();
        this.loadBasesYCondiciones();
        this.checkUserAuth();
    }

    /**
     * Verificar autenticación del usuario
     */
    checkUserAuth() {
        if (typeof auth !== 'undefined') {
            onAuthStateChanged(auth, (user) => {
                this.currentUser = user;
                this.updateUserInfo(user);
            });
        }
    }

    /**
     * Actualizar información del usuario logueado
     * @param {Object} user - Usuario autenticado
     */
    updateUserInfo(user) {
        if (user && user.email) {
            const emailInput = document.getElementById('email');
            const confirmEmailInput = document.getElementById('confirm-email');
            
            if (emailInput && !emailInput.value) {
                emailInput.value = user.email;
                if (confirmEmailInput) {
                    confirmEmailInput.value = user.email;
                }
            }
        }
    }

    /**
     * Cargar certámenes disponibles
     */
    async loadCertamenes() {
        try {
            const certamenesRef = collection(db, 'certamenes');
            const snapshot = await getDocs(certamenesRef);
            
            this.certamenes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(certamen => certamen.activo !== false);

            this.populateCertamenSelect();
        } catch (error) {
            console.error('Error cargando certámenes:', error);
            this.showNotification('Error al cargar los certámenes disponibles', 'error');
        }
    }

    /**
     * Poblar el select de certámenes
     */
    populateCertamenSelect() {
        const certamenSelect = document.getElementById('certamen');
        if (!certamenSelect) return;

        certamenSelect.innerHTML = '<option value="">Seleccioná el certamen de tu provincia...</option>';

        this.certamenes.forEach(certamen => {
            const option = document.createElement('option');
            option.value = certamen.id;
            option.textContent = `${certamen.nombre} - ${certamen.provincia} ($${certamen.precio})`;
            option.dataset.certamen = JSON.stringify(certamen);
            certamenSelect.appendChild(option);
        });
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        const form = document.getElementById(this.formType === 'online' ? 'form-online' : 'form-presencial');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Listener para selección de certamen
        const certamenSelect = document.getElementById('certamen');
        if (certamenSelect) {
            certamenSelect.addEventListener('change', (e) => this.handleCertamenSelection(e));
        }

        // Listener para validación de emails en tiempo real
        const confirmEmailInput = document.getElementById('confirm-email');
        if (confirmEmailInput) {
            confirmEmailInput.addEventListener('input', () => this.validateEmailMatch());
        }

        // Listener para preview de foto
        const fotoInput = document.getElementById('foto');
        if (fotoInput) {
            fotoInput.addEventListener('change', (e) => this.handleFilePreview(e));
        }

        // Listener para validación de video
        const videoInput = document.getElementById('video');
        if (videoInput) {
            videoInput.addEventListener('blur', () => this.validateVideoURL());
        }
    }

    /**
     * Configurar validación en tiempo real
     */
    setupRealTimeValidation() {
        const inputs = [
            'nombre', 'email', 'whatsapp', 'telefono', 'edad'
        ];

        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('blur', () => this.validateField(inputId, input.value));
            }
        });
    }

    /**
     * Validar un campo específico
     * @param {string} fieldId - ID del campo
     * @param {string} value - Valor a validar
     */
    validateField(fieldId, value) {
        this.validator.clear();
        let isValid = true;

        switch (fieldId) {
            case 'nombre':
                isValid = this.validator.validateArtistName(value);
                break;
            case 'email':
                isValid = this.validator.validateEmail(value);
                break;
            case 'whatsapp':
            case 'telefono':
                isValid = this.validator.validateWhatsApp(value);
                break;
            case 'edad':
                isValid = this.validator.validateAge(parseInt(value));
                break;
        }

        this.showFieldValidation(fieldId, isValid, this.validator.getErrors()[0]);
    }

    /**
     * Mostrar validación de campo individual
     * @param {string} fieldId - ID del campo
     * @param {boolean} isValid - Si es válido
     * @param {string} errorMessage - Mensaje de error
     */
    showFieldValidation(fieldId, isValid, errorMessage) {
        const field = document.getElementById(fieldId);
        const container = field?.parentElement;
        
        if (!container) return;

        // Remover mensajes previos
        const prevError = container.querySelector('.field-error');
        if (prevError) prevError.remove();

        // Actualizar estilos del campo
        field.classList.remove('border-red-500', 'border-green-500');
        
        if (field.value.trim()) { // Solo mostrar validación si hay contenido
            if (isValid) {
                field.classList.add('border-green-500');
            } else {
                field.classList.add('border-red-500');
                if (errorMessage) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'field-error text-red-400 text-xs mt-1';
                    errorDiv.textContent = errorMessage;
                    container.appendChild(errorDiv);
                }
            }
        }
    }

    /**
     * Validar coincidencia de emails
     */
    validateEmailMatch() {
        const email = document.getElementById('email')?.value;
        const confirmEmail = document.getElementById('confirm-email')?.value;
        const errorElement = document.getElementById('email-error');

        if (confirmEmail && email !== confirmEmail) {
            errorElement.style.display = 'block';
            document.getElementById('confirm-email').classList.add('border-red-500');
        } else {
            errorElement.style.display = 'none';
            document.getElementById('confirm-email').classList.remove('border-red-500');
        }
    }

    /**
     * Validar URL de video
     */
    validateVideoURL() {
        const videoInput = document.getElementById('video');
        if (!videoInput?.value) return;

        this.validator.clear();
        const result = this.validator.validateVideoURL(videoInput.value);
        
        this.showFieldValidation('video', result.valid, this.validator.getErrors()[0]);
        
        if (result.valid && result.platform) {
            this.showVideoPreview(videoInput.value, result.platform);
        }
    }

    /**
     * Mostrar preview del video
     * @param {string} url - URL del video
     * @param {string} platform - Plataforma del video
     */
    showVideoPreview(url, platform) {
        let previewContainer = document.getElementById('video-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'video-preview';
            previewContainer.className = 'mt-4 p-4 bg-gray-800 rounded-lg';
            document.getElementById('video').parentElement.appendChild(previewContainer);
        }

        const platformIcons = {
            youtube: '📺',
            tiktok: '🎵',
            instagram: '📸',
            facebook: '📘'
        };

        previewContainer.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-2xl">${platformIcons[platform] || '🎥'}</span>
                <div>
                    <p class="text-green-400 font-medium">Video detectado: ${platform.toUpperCase()}</p>
                    <p class="text-gray-400 text-sm">El enlace es válido y será procesado</p>
                </div>
            </div>
        `;
    }

    /**
     * Manejar selección de certamen
     * @param {Event} event - Evento de cambio
     */
    handleCertamenSelection(event) {
        const selectedOption = event.target.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.certamen) {
            this.selectedCertamen = JSON.parse(selectedOption.dataset.certamen);
            this.showCertamenInfo();
        } else {
            this.selectedCertamen = null;
            this.hideCertamenInfo();
        }
    }

    /**
     * Mostrar información del certamen seleccionado
     */
    showCertamenInfo() {
        const infoContainer = document.getElementById('certamen-info');
        if (!infoContainer || !this.selectedCertamen) return;

        const { nombre, provincia, precio, descripcion, imagen } = this.selectedCertamen;

        infoContainer.innerHTML = `
            <div class="flex items-center space-x-4">
                ${imagen ? `<img src="${imagen}" alt="${nombre}" class="w-16 h-16 rounded-lg object-cover">` : 
                          `<div class="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">🎵</div>`}
                <div class="flex-1">
                    <h4 class="font-semibold text-white text-lg">${nombre}</h4>
                    <p class="text-gray-300 text-sm">${provincia}</p>
                    <p class="text-cyan-400 font-bold">$${precio} ARS</p>
                    ${descripcion ? `<p class="text-gray-400 text-xs mt-1">${descripcion}</p>` : ''}
                </div>
                <div class="text-right">
                    <div class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                        ✓ Disponible
                    </div>
                </div>
            </div>
        `;

        infoContainer.classList.remove('hidden');
    }

    /**
     * Ocultar información del certamen
     */
    hideCertamenInfo() {
        const infoContainer = document.getElementById('certamen-info');
        if (infoContainer) {
            infoContainer.classList.add('hidden');
        }
    }

    /**
     * Manejar preview de archivo
     * @param {Event} event - Evento de cambio de archivo
     */
    handleFilePreview(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar archivo
        this.validator.clear();
        const isValid = this.validator.validateImageFile(file);
        
        this.showFieldValidation('foto', isValid, this.validator.getErrors()[0]);

        if (isValid) {
            this.createImagePreview(file);
        }
    }

    /**
     * Crear preview de imagen
     * @param {File} file - Archivo de imagen
     */
    createImagePreview(file) {
        let previewContainer = document.getElementById('photo-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'photo-preview';
            previewContainer.className = 'mt-4';
            document.getElementById('foto').parentElement.appendChild(previewContainer);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `
                <div class="bg-gray-800 p-4 rounded-lg">
                    <p class="text-green-400 text-sm mb-2">✓ Foto cargada correctamente</p>
                    <img src="${e.target.result}" alt="Preview" class="w-32 h-32 object-cover rounded-lg border-2 border-gray-600">
                    <p class="text-gray-400 text-xs mt-2">Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Cargar bases y condiciones
     */
    async loadBasesYCondiciones() {
        try {
            const docRef = doc(db, `bases_y_condiciones_${this.formType}`, `texto_${this.formType}`);
            const docSnap = await getDoc(docRef);
            
            const container = document.getElementById('bases-text-container');
            if (!container) return;

            if (docSnap.exists()) {
                container.innerHTML = docSnap.data().contenido.replace(/\n/g, '<br>');
            } else {
                container.innerHTML = '<p class="text-gray-400">No se encontraron las bases y condiciones. Por favor, contacta al administrador.</p>';
            }
        } catch (error) {
            console.error('Error cargando bases y condiciones:', error);
            const container = document.getElementById('bases-text-container');
            if (container) {
                container.innerHTML = '<p class="text-red-400">Error al cargar las bases y condiciones.</p>';
            }
        }
    }

    /**
     * Manejar envío del formulario
     * @param {Event} event - Evento de envío
     */
    async handleFormSubmit(event) {
        event.preventDefault();

        if (this.isSubmitting) {
            this.showNotification('Ya se está procesando tu inscripción, por favor espera...', 'warning');
            return;
        }

        this.isSubmitting = true;
        this.updateSubmitButton(true);

        try {
            const formData = this.collectFormData();
            const validation = this.validateForm(formData);

            if (!validation.isValid) {
                this.validationUI.displayErrors(validation.errors);
                if (validation.warnings.length > 0) {
                    this.validationUI.displayWarnings(validation.warnings);
                }
                return;
            }

            this.validationUI.clearMessages();
            
            // Si hay advertencias, mostrarlas pero continuar
            if (validation.warnings.length > 0) {
                this.validationUI.displayWarnings(validation.warnings);
            }

            await this.submitForm(formData);

        } catch (error) {
            console.error('Error en envío del formulario:', error);
            this.showNotification('Ocurrió un error inesperado. Por favor, intenta nuevamente.', 'error');
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton(false);
        }
    }

    /**
     * Recopilar datos del formulario
     * @returns {Object} Datos del formulario
     */
    collectFormData() {
        const formData = {
            acceptsTerms: document.getElementById('acepta-bases')?.checked || false,
            esPrueba: document.getElementById('inscripcion-prueba')?.checked || false
        };

        if (this.formType === 'online') {
            formData.nombre = document.getElementById('nombre')?.value || '';
            formData.email = document.getElementById('email')?.value || '';
            formData.confirmEmail = document.getElementById('confirm-email')?.value || '';
            formData.whatsapp = document.getElementById('whatsapp')?.value || '';
            formData.provincia = document.getElementById('provincia')?.value || '';
            formData.video = document.getElementById('video')?.value || '';
            formData.foto = document.getElementById('foto')?.files[0] || null;
            formData.certamenId = this.selectedCertamen?.id || '';
        } else {
            formData.nombre = document.getElementById('nombre')?.value || '';
            formData.edad = document.getElementById('edad')?.value || '';
            formData.email = document.getElementById('email')?.value || '';
            formData.confirmEmail = document.getElementById('confirm-email')?.value || '';
            formData.telefono = document.getElementById('telefono')?.value || '';
            formData.video = document.getElementById('video')?.value || '';
        }

        return formData;
    }

    /**
     * Validar formulario
     * @param {Object} formData - Datos del formulario
     * @returns {Object} Resultado de validación
     */
    validateForm(formData) {
        if (this.formType === 'online') {
            return this.validator.validateOnlineForm({
                ...formData,
                certamenId: this.selectedCertamen?.id
            });
        } else {
            return this.validator.validatePresencialForm(formData);
        }
    }

    /**
     * Enviar formulario
     * @param {Object} formData - Datos validados del formulario
     */
    async submitForm(formData) {
        // 🔥 PASO 1: VALIDACIÓN DE AUTENTICACIÓN (CRÍTICO)
        
        // 1.1 Verificar que el usuario esté logueado
        if (!this.currentUser) {
            this.showNotification('⚠️ Debes iniciar sesión para inscribirte', 'error');
            console.warn('❌ Intento de inscripción sin autenticación');
            
            // Guardar URL actual para volver después del login
            localStorage.setItem('redirectAfterLogin', window.location.href);
            
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        console.log('✅ Usuario autenticado:', this.currentUser.uid);

        // 1.2 Verificar que tenga perfil de artista creado (solo para inscripciones online)
        if (this.formType === 'online') {
            try {
                this.showNotification('Verificando tu perfil de artista...', 'info');
                
                const artistProfileRef = doc(db, 'artist_profiles', this.currentUser.uid);
                const artistProfileSnap = await getDoc(artistProfileRef);
                
                if (!artistProfileSnap.exists()) {
                    this.showNotification('⚠️ Primero debes crear tu perfil de artista', 'error');
                    console.warn('❌ Usuario sin perfil de artista:', this.currentUser.uid);
                    
                    setTimeout(() => {
                        window.location.href = '/crear-perfil-artista.html';
                    }, 2500);
                    return;
                }

                const artistData = artistProfileSnap.data();
                
                // Verificar que el perfil esté completo
                if (!artistData.profileComplete) {
                    this.showNotification('⚠️ Debes completar tu perfil de artista antes de inscribirte', 'error');
                    console.warn('❌ Perfil de artista incompleto:', this.currentUser.uid);
                    
                    setTimeout(() => {
                        window.location.href = '/crear-perfil-artista.html';
                    }, 2500);
                    return;
                }

                console.log('✅ Perfil de artista verificado:', artistData.artistName || artistData.nombre_artista);

            } catch (error) {
                console.error('❌ Error verificando perfil de artista:', error);
                this.showNotification('Error al verificar tu perfil. Intenta nuevamente.', 'error');
                return;
            }
        }

        // 1.3 Todo OK - Procesar inscripción
        console.log('✅ Validaciones completadas - Procesando inscripción...');
        this.showNotification('Procesando tu inscripción...', 'info');

        if (this.formType === 'online') {
            await this.submitOnlineForm(formData);
        } else {
            await this.submitPresencialForm(formData);
        }
    }

    /**
     * Enviar formulario online
     * @param {Object} formData - Datos del formulario
     */
    async submitOnlineForm(formData) {
        let fotoUrl = null;

        // Subir foto si existe
        if (formData.foto) {
            try {
                const storageRef = ref(storage, `fotos_online/${Date.now()}_${formData.foto.name}`);
                await uploadBytes(storageRef, formData.foto);
                fotoUrl = await getDownloadURL(storageRef);
            } catch (error) {
                console.error('Error subiendo foto:', error);
                throw new Error('Error al subir la foto. Por favor, intenta con una imagen más pequeña.');
            }
        }

        // Preparar documento
        const inscripcionDoc = {
            nombre_artista: formData.nombre,
            email: formData.email,
            whatsapp: formData.whatsapp,
            provincia: formData.provincia,
            video_link: formData.video,
            foto_url: fotoUrl,
            certamen_id: this.selectedCertamen.id,
            certamen_nombre: this.selectedCertamen.nombre,
            precio_certamen: this.selectedCertamen.precio,
            estado: 'pendiente',  // ✅ String estandarizado
            aprobado: false,      // Mantener para compatibilidad
            pago_completado: formData.esPrueba,
            tipo_inscripcion: formData.esPrueba ? 'prueba' : 'completa',
            votos_gratuitos: 0,
            descuento_aplicado: false,
            codigo_invitacion: this.generateUniqueCode(),
            reproducciones_youtube: 0,
            ranking_provincial: 0,
            ranking_general: 0,
            createdAt: serverTimestamp(),
            uid: this.currentUser?.uid || null
        };

        // Guardar en Firestore
        const docRef = await addDoc(collection(db, "participantes_online"), inscripcionDoc);

        // Procesar pago o mostrar confirmación
        if (!formData.esPrueba) {
            await this.processPayment(docRef.id, formData);
        } else {
            this.showSuccessModal();
            this.resetForm();
        }
    }

    /**
     * Enviar formulario presencial
     * @param {Object} formData - Datos del formulario
     */
    async submitPresencialForm(formData) {
        const inscripcionDoc = {
            nombre_artista: formData.nombre,
            edad: parseInt(formData.edad),
            email: formData.email,
            telefono: formData.telefono,
            video_link: formData.video,
            estado: 'pendiente',  // ✅ String estandarizado
            aprobado: false,      // Mantener para compatibilidad
            tipo_inscripcion: formData.esPrueba ? 'prueba' : 'completa',
            votos_gratuitos: 0,
            descuento_aplicado: false,
            codigo_invitacion: this.generateUniqueCode(),
            createdAt: serverTimestamp(),
            uid: this.currentUser?.uid || null
        };

        // Guardar en Firestore (colección SINGULAR)
        await addDoc(collection(db, "participantes_presencial"), inscripcionDoc);

        this.showSuccessModal();
        this.resetForm();
    }

    /**
     * Procesar pago con MercadoPago
     * @param {string} inscripcionId - ID de la inscripción
     * @param {Object} formData - Datos del formulario
     */
    async processPayment(inscripcionId, formData) {
        const paymentData = {
            title: `VYT Music - ${this.selectedCertamen.nombre}`,
            quantity: 1,
            price: this.selectedCertamen.precio,
            currency_id: 'ARS',
            description: `Inscripción al certamen ${this.selectedCertamen.nombre} - ${formData.provincia}`,
            external_reference: inscripcionId,
            payer_email: formData.email,
            back_urls: {
                success: `${window.location.origin}/pago/pago_exitoso.html?ref=${inscripcionId}`,
                failure: `${window.location.origin}/pago/pago_fallido.html?ref=${inscripcionId}`,
                pending: `${window.location.origin}/pago/pago_pendiente.html?ref=${inscripcionId}`
            }
        };

        // Por ahora redirigir a página de pago pendiente
        // En el futuro aquí se integraría con la API de MercadoPago
        window.location.href = `./pago/pago_pendiente.html?ref=${inscripcionId}&precio=${this.selectedCertamen.precio}&certamen=${encodeURIComponent(this.selectedCertamen.nombre)}`;
    }

    /**
     * Generar código único
     * @returns {string} Código único
     */
    generateUniqueCode() {
        return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    }

    /**
     * Actualizar botón de envío
     * @param {boolean} isLoading - Si está cargando
     */
    updateSubmitButton(isLoading) {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
            submitBtn.classList.add('opacity-75');
        } else {
            submitBtn.disabled = false;
            const originalText = this.formType === 'online' ? 'Finalizar Inscripción' : 'Confirmar mi lugar';
            submitBtn.innerHTML = originalText;
            submitBtn.classList.remove('opacity-75');
        }
    }

    /**
     * Mostrar modal de éxito
     */
    showSuccessModal() {
        const modal = document.getElementById('confirm-modal');
        if (modal) {
            modal.classList.add('visible');
        }
    }

    /**
     * Resetear formulario
     */
    resetForm() {
        const form = document.getElementById(this.formType === 'online' ? 'form-online' : 'form-presencial');
        if (form) {
            form.reset();
        }
        
        this.selectedCertamen = null;
        this.hideCertamenInfo();
        this.validationUI.clearMessages();
        
        // Limpiar previews
        ['photo-preview', 'video-preview'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
    }

    /**
     * Mostrar notificación
     * @param {string} message - Mensaje
     * @param {string} type - Tipo (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500/20 border-green-500/50 text-green-200',
            error: 'bg-red-500/20 border-red-500/50 text-red-200',
            warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
            info: 'bg-blue-500/20 border-blue-500/50 text-blue-200'
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        // Crear o actualizar notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `${colors[type]} border p-4 rounded-lg mb-2 flex items-center space-x-3 transform transition-all duration-300 translate-x-full opacity-0`;
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 100);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

/**
 * 🚀 Sistema de Redirección Inteligente para Enlaces de Inscripción
 * Redirige usuarios según su estado de autenticación e inscripción
 */

// Función para verificar si el usuario está inscrito
async function checkUserInscriptionStatus(userId) {
    try {
        // Importar dinámicamente
        const { db } = await import('../firebase-config.module.js');
        const { query, where, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        
        // Buscar en participantes_online
        const q = query(collection(db, 'participantes_online'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return {
                isInscribed: true,
                inscriptionData: querySnapshot.docs[0].data(),
                inscriptionId: querySnapshot.docs[0].id
            };
        }
        
        return { isInscribed: false };
    } catch (error) {
        console.error('Error verificando inscripción:', error);
        return { isInscribed: false };
    }
}

// Función para manejar clics en enlaces de inscripción
async function handleSmartInscriptionClick(event, targetUrl = 'inscripcion-unificada.html') {
    try {
        const { auth } = await import('../firebase-config.module.js');
        const user = auth.currentUser;
        
        if (!user) {
            // Usuario no autenticado - redirigir a login
            event.preventDefault();
            window.location.href = 'login.html';
            return;
        }
        
        // Usuario autenticado - verificar inscripción
        event.preventDefault();
        const inscriptionStatus = await checkUserInscriptionStatus(user.uid);
        
        if (inscriptionStatus.isInscribed) {
            // Usuario ya inscrito - redirigir a perfil
            console.log('✅ Usuario ya inscrito, redirigiendo a perfil');
            window.location.href = 'perfil.html';
        } else {
            // Usuario no inscrito - proceder a inscripción
            console.log('📝 Usuario no inscrito, procediendo a inscripción');
            window.location.href = targetUrl;
        }
    } catch (error) {
        console.error('Error en redirección inteligente:', error);
        // Fallback - proceder normalmente
        window.location.href = targetUrl;
    }
}

// Inicializar manejadores para enlaces de inscripción
function initializeSmartInscriptionHandlers() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupSmartHandlers);
    } else {
        setupSmartHandlers();
    }
}

function setupSmartHandlers() {
    // Buscar todos los enlaces que apuntan a inscripción
    const inscriptionLinks = document.querySelectorAll('a[href*="inscripcion"]');
    
    inscriptionLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Solo manejar enlaces a inscripción unificada u online
        if (href && (href.includes('inscripcion-unificada') || href.includes('inscripcion_online'))) {
            // Remover event listeners existentes
            link.removeEventListener('click', handleSmartInscriptionClick);
            
            // Agregar nuevo event listener
            link.addEventListener('click', (event) => {
                handleSmartInscriptionClick(event, 'inscripcion-unificada.html');
            });
        }
    });
    
    console.log(`🔗 Configurados ${inscriptionLinks.length} enlaces inteligentes de inscripción`);
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.InscriptionFormHandler = InscriptionFormHandler;
    window.initializeSmartInscriptionHandlers = initializeSmartInscriptionHandlers;
    window.handleSmartInscriptionClick = handleSmartInscriptionClick;
    window.checkUserInscriptionStatus = checkUserInscriptionStatus;
}