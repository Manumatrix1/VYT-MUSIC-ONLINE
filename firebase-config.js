
// Configuración de Firebase para VYT Music (versión mejorada)
// Uso de Firebase v8 para máxima compatibilidad

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk",
    authDomain: "vytonlineprueva.firebaseapp.com",
    projectId: "vytonlineprueva",
    storageBucket: "vytonlineprueva.firebasestorage.app",
    messagingSenderId: "175483939728",
    appId: "1:175483939728:web:230294acca9221d1d1a115",
    measurementId: "G-PWRTMBH631"
};

// Variables globales para Firebase
let app, auth, db, storage, analytics;
let firebaseInitialized = false;

// Función de inicialización mejorada
function initializeFirebase() {
    try {
        // Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase no está disponible');
            return false;
        }

        // Verificar que no esté ya inicializado
        if (firebaseInitialized) {
            console.log('ℹ️ Firebase ya está inicializado');
            return true;
        }

        console.log('🔄 Inicializando Firebase...');

        // Inicializar app de Firebase
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase App inicializado');
        } else {
            app = firebase.app();
            console.log('✅ Firebase App ya existía');
        }
        
        // Inicializar servicios
        try {
            auth = firebase.auth();
            console.log('✅ Firebase Auth inicializado');
        } catch (authError) {
            console.error('❌ Error al inicializar Auth:', authError);
        }

        try {
            db = firebase.firestore();
            console.log('✅ Firestore inicializado');

            // Configurar persistencia para Firestore
            db.enablePersistence().catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn('⚠️ Persistencia no disponible (múltiples pestañas)');
                } else if (err.code == 'unimplemented') {
                    console.warn('⚠️ Persistencia no soportada por el navegador');
                } else {
                    console.warn('⚠️ Error de persistencia:', err);
                }
            });
        } catch (dbError) {
            console.error('❌ Error al inicializar Firestore:', dbError);
        }

        try {
            storage = firebase.storage();
            console.log('✅ Firebase Storage inicializado');
        } catch (storageError) {
            console.error('❌ Error al inicializar Storage:', storageError);
        }
        
        // Analytics (opcional)
        try {
            if (typeof firebase.analytics !== 'undefined') {
                analytics = firebase.analytics();
                console.log('✅ Analytics inicializado');
            }
        } catch (analyticsError) {
            console.warn('⚠️ Analytics no disponible:', analyticsError);
        }
        
        firebaseInitialized = true;
        console.log('🎉 Firebase inicializado completamente');
        
        // Disparar evento personalizado para notificar que Firebase está listo
        window.dispatchEvent(new CustomEvent('firebaseReady', { 
            detail: { auth, db, storage, analytics } 
        }));
        
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        return false;
    }
}

// Función de retry para la inicialización
function attemptFirebaseInit(retries = 3) {
    if (typeof firebase !== 'undefined') {
        return initializeFirebase();
    }
    
    if (retries > 0) {
        console.log(`🔄 Reintentando inicialización de Firebase... (${retries} intentos restantes)`);
        setTimeout(() => attemptFirebaseInit(retries - 1), 1000);
    } else {
        console.error('❌ No se pudo inicializar Firebase después de varios intentos');
        // Disparar evento de error
        window.dispatchEvent(new CustomEvent('firebaseError', { 
            detail: { message: 'Firebase no pudo ser inicializado' }
        }));
    }
}

// Inicialización automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(attemptFirebaseInit, 500);
    });
} else {
    setTimeout(attemptFirebaseInit, 500);
}

// Función para verificar el estado de Firebase
function checkFirebaseStatus() {
    return {
        available: typeof firebase !== 'undefined',
        initialized: firebaseInitialized,
        app: !!app,
        auth: !!auth,
        db: !!db,
        storage: !!storage,
        analytics: !!analytics
    };
}

// Exponer función de estado globalmente
window.checkFirebaseStatus = checkFirebaseStatus;

// Función helper para esperar a que Firebase esté listo
function waitForFirebase(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (firebaseInitialized) {
            resolve({ auth, db, storage, analytics });
            return;
        }

        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout esperando Firebase'));
        }, timeout);

        window.addEventListener('firebaseReady', (event) => {
            clearTimeout(timeoutId);
            resolve(event.detail);
        }, { once: true });

        window.addEventListener('firebaseError', (event) => {
            clearTimeout(timeoutId);
            reject(new Error(event.detail.message));
        }, { once: true });
    });
}

// Exponer función de espera globalmente
window.waitForFirebase = waitForFirebase;

console.log('📝 Firebase config cargado - esperando inicialización...');

// Función para manejar estado de red
let isOnline = navigator.onLine;
window.addEventListener('online', async () => {
    if (!isOnline) {
        console.log('🌐 Conexión restaurada, habilitando Firestore...');
        try {
            await enableNetwork(db);
            isOnline = true;
        } catch (error) {
            console.error('Error habilitando red:', error);
        }
    }
});

window.addEventListener('offline', async () => {
    if (isOnline) {
        console.log('📡 Sin conexión, usando modo offline...');
        try {
            await disableNetwork(db);
            isOnline = false;
        } catch (error) {
            console.error('Error deshabilitando red:', error);
        }
    }
});

// Función de utilidad para verificar conexión
const checkConnection = () => isOnline;

export { 
    app, 
    auth, 
    db, 
    storage, 
    analytics, 
    functions, 
    checkConnection 
};
