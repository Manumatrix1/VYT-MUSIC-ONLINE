// Optimización: Carga diferida de componentes
const loadComponent = async (modulePath) => {
    try {
        const module = await import(modulePath);
        return module;
    } catch (error) {
        console.warn(`⚠️ No se pudo cargar el componente: ${modulePath}`, error);
        return null;
    }
};

// Importar configuración de Firebase de manera diferida
let firebaseImports = null;
const initializeFirebase = async () => {
    if (firebaseImports) return firebaseImports;
    
    const [
        { auth, db },
        authMethods,
        firestoreMethods
    ] = await Promise.all([
        import('./firebase-config.module.js'),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
    ]);
    
    firebaseImports = {
        auth,
        db,
        createUserWithEmailAndPassword: authMethods.createUserWithEmailAndPassword,
        signInWithEmailAndPassword: authMethods.signInWithEmailAndPassword,
        signOut: authMethods.signOut,
        onAuthStateChanged: authMethods.onAuthStateChanged,
        sendPasswordResetEmail: authMethods.sendPasswordResetEmail,
        setPersistence: authMethods.setPersistence,
        browserLocalPersistence: authMethods.browserLocalPersistence,
        browserSessionPersistence: authMethods.browserSessionPersistence,
        doc: firestoreMethods.doc,
        setDoc: firestoreMethods.setDoc,
        getDoc: firestoreMethods.getDoc,
        query: firestoreMethods.query,
        where: firestoreMethods.where,
        collection: firestoreMethods.collection,
        getDocs: firestoreMethods.getDocs
    };
    
    return firebaseImports;
};

// Función optimizada para verificar si el usuario está inscrito con caché
const MAX_CACHE_SIZE = 50;  // ✅ Límite de tamaño de caché
let inscriptionCache = new Map();

async function checkUserInscription(userId) {
    // Verificar caché primero
    if (inscriptionCache.has(userId)) {
        const cached = inscriptionCache.get(userId);
        const now = Date.now();
        // Cache válido por 5 minutos
        if (now - cached.timestamp < 300000) {
            return cached.data;
        }
    }

    try {
        const firebase = await initializeFirebase();
        
        // Buscar en participantes_online con límite para optimizar
        const q = firebase.query(
            firebase.collection(firebase.db, 'participantes_online'), 
            firebase.where('userId', '==', userId)
        );
        const querySnapshot = await firebase.getDocs(q);
        
        const result = querySnapshot.empty ? 
            { isInscribed: false } : 
            {
                isInscribed: true,
                inscriptionData: querySnapshot.docs[0].data(),
                inscriptionId: querySnapshot.docs[0].id
            };
        
        // ✅ Guardar en caché con límite de tamaño
        if (inscriptionCache.size >= MAX_CACHE_SIZE) {
            // Eliminar entrada más antigua si se alcanza el límite
            const firstKey = inscriptionCache.keys().next().value;
            inscriptionCache.delete(firstKey);
            console.log('🗑️ Cache limpiado - límite alcanzado');
        }
        
        inscriptionCache.set(userId, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    } catch (error) {
        console.error('Error verificando inscripción:', error);
        return { isInscribed: false };
    }
}

// ✅ Limpiar cache y listeners al cambiar página
window.addEventListener('beforeunload', () => {
    inscriptionCache.clear();
    console.log('🧹 Cache limpiado al cambiar página');
}, { once: true });

// Función para redirigir según estado de inscripción
async function redirectBasedOnInscription(user) {
    const inscriptionStatus = await checkUserInscription(user.uid);
    
    if (inscriptionStatus.isInscribed) {
        // Usuario ya inscrito - redirigir a perfil
        window.location.href = 'perfil.html';
    } else {
        // Usuario no inscrito - redirigir a inscripción unificada
        window.location.href = 'inscripcion-unificada.html';
    }
}

// Hacer funciones disponibles globalmente
window.checkUserInscription = checkUserInscription;
window.redirectBasedOnInscription = redirectBasedOnInscription;

// Inicialización optimizada con carga diferida
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando carga optimizada...');
    
    // Cargar componentes básicos de manera asíncrona
    const [countdown, modal] = await Promise.all([
        loadComponent('./src/countdown.js'),
        loadComponent('./src/modal.js')
    ]);
    
    // Inicializar componentes si se cargaron correctamente
    if (countdown && countdown.initializeCountdown) {
        countdown.initializeCountdown();
    }
    
    if (modal && modal.initializeModal) {
        modal.initializeModal();
    }
    
    console.log('✅ Componentes básicos cargados');
    // const authModalMessage = document.getElementById('auth-modal-message');
    // const loginFormContainer = document.getElementById('login-form-container');
    // const registerFormContainer = document.getElementById('register-form-container');
    // const loginEmailInput = document.getElementById('login-email');
    // const loginPasswordInput = document.getElementById('login-password');
    // const loginSubmitBtn = document.getElementById('login-submit-btn');
    // const registerEmailInput = document.getElementById('register-email');
    // const registerPasswordInput = document.getElementById('register-password');
    // const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    // const registerProvinciaSelect = document.getElementById('register-provincia'); // Nueva referencia
    // const registerSubmitBtn = document.getElementById('register-submit-btn');
    // const authModalCloseBtn = document.getElementById('auth-modal-close-btn');

    // References for login.html forms
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const togglePasswordVisibilityButtons = document.querySelectorAll('.toggle-password-visibility');

    // Forgot Password Modal elements - MOVED INSIDE DOMContentLoaded
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const forgotPasswordModalCloseBtn = document.getElementById('forgot-password-modal-close-btn');
    const forgotPasswordModalEmailInput = document.getElementById('forgot-password-email-input');
    const forgotPasswordModalMessage = document.getElementById('forgot-password-modal-message');
    const forgotPasswordModalSubmitBtn = document.getElementById('forgot-password-modal-submit-btn');


    // Set countdown target date (7 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    
    // Initialize countdown only if countdown elements exist
    if (document.getElementById('days')) {
        initializeCountdown(targetDate);
    }

    // Initialize modal only if modal elements exist
    if (document.getElementById('modal-provincia-select')) {
        initializeModal();
    }

    // Only execute authentication logic if elements exist (i.e., on login.html)
    if (showLoginBtn && showRegisterBtn && loginForm && registerForm) {
        // Toggle forms
        showLoginBtn.addEventListener('click', () => {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            showLoginBtn.classList.add('bg-[#2bb7d1]', 'text-black');
            showLoginBtn.classList.remove('bg-gray-700', 'text-gray-300');
            showRegisterBtn.classList.remove('bg-[#2bb7d1]', 'text-black');
            showRegisterBtn.classList.add('bg-gray-700', 'text-gray-300');
            loginError.style.display = 'none';
            registerError.style.display = 'none';
        });

        showRegisterBtn.addEventListener('click', () => {
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            showRegisterBtn.classList.add('bg-[#2bb7d1]', 'text-black');
            showRegisterBtn.classList.remove('bg-gray-700', 'text-gray-300');
            showLoginBtn.classList.remove('bg-[#2bb7d1]', 'text-black');
            showLoginBtn.classList.add('bg-gray-700', 'text-gray-300');
            loginError.style.display = 'none';
            registerError.style.display = 'none';
        });

        // Auto-completar email si "recordarme" estaba marcado
        const rememberedEmail = localStorage.getItem('vyt_remember_email');
        const rememberMeChecked = localStorage.getItem('vyt_remember_me') === 'true';
        
        if (rememberedEmail && rememberMeChecked) {
            const emailInput = loginForm['login-email'];
            const rememberCheckbox = loginForm['remember-me'];
            
            if (emailInput) emailInput.value = rememberedEmail;
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }

        // Login functionality
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.style.display = 'none';

            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            const rememberMe = loginForm['remember-me'] ? loginForm['remember-me'].checked : false;

            try {
                // Configurar persistencia basada en checkbox "recordarme"
                if (rememberMe) {
                    // Persistencia local (30 días)
                    await setPersistence(auth, browserLocalPersistence);
                } else {
                    // Solo durante la sesión
                    await setPersistence(auth, browserSessionPersistence);
                }
                
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Guardar preferencia de recordarme
                if (rememberMe) {
                    localStorage.setItem('vyt_remember_me', 'true');
                    localStorage.setItem('vyt_remember_email', email);
                } else {
                    localStorage.removeItem('vyt_remember_me');
                    localStorage.removeItem('vyt_remember_email');
                }
                
                // Redirigir basado en el estado de inscripción del usuario
                await redirectBasedOnInscription(user); 
            } catch (error) {
                console.error("Error al iniciar sesión:", error.message);
                let errorMessage = 'Error al iniciar sesión.';
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = 'Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'El formato del correo electrónico es inválido.';
                } else {
                    errorMessage = 'Error al iniciar sesión: ' + error.message;
                }
                loginError.textContent = errorMessage;
                loginError.style.display = 'block';
            }
        });

        // Forgot Password functionality
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', async (e) => {
                e.preventDefault();
                forgotPasswordModal.classList.add('visible'); // Show the custom modal
                forgotPasswordModalMessage.textContent = ''; // Clear previous messages
                forgotPasswordModalEmailInput.value = ''; // Clear previous email
            });
        }

        // Close Forgot Password Modal
        if (forgotPasswordModalCloseBtn) {
            forgotPasswordModalCloseBtn.addEventListener('click', () => {
                forgotPasswordModal.classList.remove('visible');
            });
        }

        // Submit Forgot Password Email
        if (forgotPasswordModalSubmitBtn) {
            forgotPasswordModalSubmitBtn.addEventListener('click', async () => {
                const email = forgotPasswordModalEmailInput.value;
                if (!email) {
                    forgotPasswordModalMessage.textContent = 'Por favor, ingresa tu correo electrónico.';
                    forgotPasswordModalMessage.style.display = 'block';
                    return;
                }
                forgotPasswordModalMessage.textContent = ''; // Clear previous messages

                try {
                    await sendPasswordResetEmail(auth, email);
                    forgotPasswordModalMessage.textContent = 'Se ha enviado un correo electrónico para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada.';
                    forgotPasswordModalMessage.style.color = '#4CAF50'; // Green color for success
                    forgotPasswordModalMessage.style.display = 'block';
                    // Optionally hide modal after a delay or on user action
                    // setTimeout(() => { forgotPasswordModal.classList.remove('visible'); }, 3000);
                } catch (error) {
                    console.error("Error al enviar correo de restablecimiento:", error.message);
                    let errorMessage = "Error al enviar el correo de restablecimiento.";
                    if (error.code === 'auth/invalid-email') {
                        errorMessage = 'El formato del correo electrónico es inválido.';
                    } else if (error.code === 'auth/user-not-found') {
                        errorMessage = 'No se encontró ningún usuario con ese correo electrónico.';
                    }
                    forgotPasswordModalMessage.textContent = errorMessage + " Por favor, inténtalo de nuevo.";
                    forgotPasswordModalMessage.style.color = '#ff4d4d'; // Red color for error
                    forgotPasswordModalMessage.style.display = 'block';
                }
            });
        }


        // Toggle password visibility
        togglePasswordVisibilityButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const passwordInput = document.getElementById(targetId);
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                } else {
                    passwordInput.type = 'password';
                }
            });
        });

        // Register functionality
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerError.style.display = 'none';

            const email = registerForm['register-email'].value;
            const password = registerForm['register-password'].value;
            const confirmPassword = registerForm['confirm-password'].value;

            if (password !== confirmPassword) {
                registerError.textContent = 'Las contraseñas no coinciden.';
                registerError.style.display = 'block';
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create a user document in Firestore
                await setDoc(doc(db, "artistas", user.uid), {
                    email: user.email,
                    createdAt: new Date(),
                    // You can add more fields here later, like nombre_artista, foto_url, frase_identificativa
                });

                // Para usuarios nuevos, redirigir siempre a inscripción
                window.location.href = 'inscripcion-unificada.html'; 
            } catch (error) {
                console.error("Error al registrarse:", error.message);
                let errorMessage = 'Error al registrarse.';
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'Esta cuenta ya está registrada. Por favor, inicia sesión.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'El formato del correo electrónico es inválido.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
                } else {
                    errorMessage = 'Error al registrarse: ' + error.message;
                }
                registerError.textContent = errorMessage;
                registerError.style.display = 'block';
            }
        });
    }
});