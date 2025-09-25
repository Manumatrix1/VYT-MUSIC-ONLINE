
// Configuración optimizada de Firebase para VYT Music
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getAnalytics, isSupported as isAnalyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFunctions, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

// Configuración optimizada
const firebaseConfig = {
    apiKey: "AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk",
    authDomain: "vytonlineprueva.firebaseapp.com",
    projectId: "vytonlineprueva",
    storageBucket: "vytonlineprueva.firebasestorage.app",
    messagingSenderId: "175483939728",
    appId: "1:175483939728:web:230294acca9221d1d1a115",
    measurementId: "G-PWRTMBH631"
};

// Inicializar app de Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase con configuración optimizada
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Configurar Analytics solo si es soportado (mejor rendimiento)
let analytics = null;
isAnalyticsSupported().then((supported) => {
    if (supported) {
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js")
            .then((analyticsModule) => {
                analytics = analyticsModule.getAnalytics(app);
                console.log('✅ Analytics inicializado');
            });
    } else {
        console.log('⚠️ Analytics no soportado en este navegador');
    }
}).catch(err => {
    console.warn('Analytics no disponible:', err);
});

// Configuraciones de rendimiento
// Configurar persistencia offline para Firestore
if ('indexedDB' in window) {
    console.log('🔄 Habilitando persistencia offline...');
}

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
