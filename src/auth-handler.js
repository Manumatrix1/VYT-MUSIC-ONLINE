// Sistema de Autenticación VYT Music
// Maneja login con Email/Password, Google y Facebook
// Diferencia entre usuarios Artista y Visitante

class AuthHandler {
    constructor() {
        this.user = null;
        this.userType = null; // 'artista' o 'visitante'
        this.initialized = false;
    }

    // Inicializar listener de autenticación
    async init() {
        if (!firebase || !firebase.auth) {
            console.error('Firebase Auth no disponible');
            return;
        }

        // Persistir la sesion para evitar logins repetidos
        try {
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } catch (error) {
            console.warn('⚠️ No se pudo configurar persistencia de sesion:', error);
        }

        firebase.auth().onAuthStateChanged(async (user) => {
            this.user = user;
            if (user) {
                await this.loadUserProfile();
                this.updateUIForLoggedUser();
            } else {
                this.updateUIForGuest();
            }
            this.initialized = true;
        });
    }

    // Cargar perfil del usuario desde Firestore
    async loadUserProfile() {
        try {
            const userDoc = await db.collection('users').doc(this.user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.userType = userData.userType || 'visitante';
                
                // Guardar en localStorage para acceso rápido
                localStorage.setItem('userType', this.userType);
                localStorage.setItem('userName', userData.displayName || this.user.displayName);
            } else {
                // Usuario nuevo - necesita seleccionar tipo
                this.userType = null;
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
        }
    }

    // Login con Email y Password
    async loginWithEmail(email, password) {
        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Login con Google
    async loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        try {
            // Usar redirect para evitar bloqueos de popup/CSP
            await firebase.auth().signInWithRedirect(provider);
            return { success: true, redirecting: true };
        } catch (error) {
            const fallbackErrors = [
                'auth/operation-not-supported-in-this-environment',
                'auth/web-storage-unsupported'
            ];

            if (fallbackErrors.includes(error.code)) {
                try {
                    const result = await firebase.auth().signInWithPopup(provider);
                    return { success: true, user: result.user };
                } catch (popupError) {
                    console.error('Error login Google (popup):', popupError);
                    return { success: false, error: this.getErrorMessage(popupError) };
                }
            }

            console.error('Error login Google:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Manejar resultado del redirect de Google
    async handleRedirectResult() {
        try {
            const result = await firebase.auth().getRedirectResult();
            
            if (result.user) {
                console.log('✅ Login exitoso con Google:', result.user.email);
                
                // Si es usuario nuevo, preguntar tipo
                if (result.additionalUserInfo?.isNewUser) {
                    await this.showUserTypeSelector(result.user);
                }
                
                return { success: true, user: result.user };
            }
            
            return { success: false, noResult: true };
        } catch (error) {
            console.error('Error redirect result:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Login con Facebook
    async loginWithFacebook() {
        try {
            const provider = new firebase.auth.FacebookAuthProvider();
            provider.addScope('email');
            provider.addScope('public_profile');

            // Usar redirect para evitar bloqueos de popup/CSP
            await firebase.auth().signInWithRedirect(provider);
            return { success: true, redirecting: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Registro con Email y Password
    async registerWithEmail(email, password, userType, displayName) {
        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Actualizar perfil
            await result.user.updateProfile({ displayName });
            
            // Crear documento en Firestore
            await this.createUserDocument(result.user, userType, displayName);
            
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Crear documento de usuario en Firestore
    async createUserDocument(user, userType, displayName) {
        try {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName || user.displayName || 'Usuario',
                userType: userType, // 'artista' o 'visitante'
                photoURL: user.photoURL || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: user.emailVerified
            };

            await db.collection('users').doc(user.uid).set(userData, { merge: true });
            
            // Si es artista, crear perfil de artista vacío
            if (userType === 'artista') {
                await db.collection('artist_profiles').doc(user.uid).set({
                    userId: user.uid,
                    artistName: displayName || user.displayName,
                    profileComplete: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }

            this.userType = userType;
        } catch (error) {
            console.error('Error creando documento de usuario:', error);
            throw error;
        }
    }

    // Mostrar selector de tipo de usuario (para nuevos usuarios de redes sociales)
    async showUserTypeSelector(user) {
        // Verificar si hay tipo de usuario guardado temporalmente (desde página de registro)
        const tempUserType = localStorage.getItem('tempUserType');
        if (tempUserType) {
            localStorage.removeItem('tempUserType');
            await this.createUserDocument(user, tempUserType, user.displayName);
            return tempUserType;
        }

        return new Promise((resolve) => {
            // Crear modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl p-8 max-w-md w-full">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">¡Bienvenido a VYT Music! 🎵</h2>
                    <p class="text-gray-600 mb-6">¿Cómo quieres usar la plataforma?</p>
                    
                    <div class="space-y-4">
                        <button id="selectArtista" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105">
                            <i class="fas fa-microphone mr-2"></i>
                            Soy Artista
                            <p class="text-sm font-normal mt-1 opacity-90">Participo en certámenes</p>
                        </button>
                        
                        <button id="selectVisitante" class="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105">
                            <i class="fas fa-star mr-2"></i>
                            Soy Visitante
                            <p class="text-sm font-normal mt-1 opacity-90">Voto y sigo certámenes</p>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);

            // Handlers
            document.getElementById('selectArtista').onclick = async () => {
                await this.createUserDocument(user, 'artista', user.displayName);
                modal.remove();
                resolve('artista');
            };

            document.getElementById('selectVisitante').onclick = async () => {
                await this.createUserDocument(user, 'visitante', user.displayName);
                modal.remove();
                resolve('visitante');
            };
        });
    }

    // Logout
    async logout() {
        try {
            await firebase.auth().signOut();
            localStorage.removeItem('userType');
            localStorage.removeItem('userName');
            this.user = null;
            this.userType = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Actualizar UI según estado de autenticación
    updateUIForLoggedUser() {
        // Navigation component maneja su propia actualización via onAuthStateChanged
        console.log('✅ UI actualizado para usuario logueado');

        // Ocultar botones de login
        const loginButtons = document.querySelectorAll('.login-required');
        loginButtons.forEach(btn => btn.classList.add('hidden'));

        // Mostrar botones de usuario logueado
        const userButtons = document.querySelectorAll('.user-logged');
        userButtons.forEach(btn => btn.classList.remove('hidden'));
    }

    updateUIForGuest() {
        // Navigation component maneja su propia actualización
        console.log('ℹ️ UI actualizado para visitante');

        // Mostrar botones de login
        const loginButtons = document.querySelectorAll('.login-required');
        loginButtons.forEach(btn => btn.classList.remove('hidden'));

        // Ocultar botones de usuario
        const userButtons = document.querySelectorAll('.user-logged');
        userButtons.forEach(btn => btn.classList.add('hidden'));
    }

    // Verificar si usuario puede inscribirse (debe ser artista con perfil completo)
    canInscribirse() {
        if (!this.user) return false;
        if (this.userType !== 'artista') return false;
        // Aquí se puede agregar validación de perfil completo
        return true;
    }

    // Mensajes de error en español
    getErrorMessage(error) {
        const messages = {
            'auth/email-already-in-use': 'Este correo ya está registrado',
            'auth/invalid-email': 'Correo electrónico inválido',
            'auth/operation-not-allowed': 'Operación no permitida',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
            'auth/user-not-found': 'No existe una cuenta con este correo',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/popup-closed-by-user': 'Ventana de login cerrada',
            'auth/cancelled-popup-request': 'Solicitud cancelada',
            'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método de login'
        };

        return messages[error.code] || `Error: ${error.message}`;
    }

    // Helpers
    isLoggedIn() {
        return this.user !== null;
    }

    isArtista() {
        return this.userType === 'artista';
    }

    isVisitante() {
        return this.userType === 'visitante';
    }
}

// Crear instancia global
window.authHandler = new AuthHandler();

// Función para inicializar cuando Firebase esté listo
function initAuthHandler() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        console.log('✅ Firebase detectado, inicializando AuthHandler...');
        window.authHandler.init();
    } else {
        console.log('⏳ Esperando a Firebase...');
        setTimeout(initAuthHandler, 100);
    }
}

// Escuchar evento de Firebase listo
window.addEventListener('firebaseReady', () => {
    console.log('🔥 Evento firebaseReady recibido');
    initAuthHandler();
});

// Intentar inicializar inmediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAuthHandler, 500);
    });
} else {
    setTimeout(initAuthHandler, 500);
}

console.log('📦 auth-handler.js cargado, esperando Firebase...');
