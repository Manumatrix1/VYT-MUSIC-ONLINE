// Script para inicializar la base de datos de VYT Music Online
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA9r6VUBdZ9V_4VX4DlQ1kXw0nQhZBj8mQ",
  authDomain: "vytonlineprueva.firebaseapp.com",
  projectId: "vytonlineprueva",
  storageBucket: "vytonlineprueva.appspot.com",
  messagingSenderId: "529567866036",
  appId: "1:529567866036:web:8bfa7e3f4f1d2a5c6e7a9b"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function initializeDatabase() {
  console.log('🚀 Iniciando inicialización de base de datos...');
  
  try {
    // Llamar a la función de inicialización
    const initializeFirestoreStructure = httpsCallable(functions, 'initializeFirestoreStructure');
    const result = await initializeFirestoreStructure();
    
    console.log('✅ Base de datos inicializada exitosamente:', result.data);
    
    // Verificar con estadísticas
    const getSystemStats = httpsCallable(functions, 'getSystemStats');
    const stats = await getSystemStats();
    
    console.log('📊 Estadísticas del sistema:', stats.data);
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

// Ejecutar inicialización
initializeDatabase();