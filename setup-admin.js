/**
 * CONFIGURAR USUARIO ADMIN PARA VYT MUSIC
 * Ejecutar en la consola de Firebase (https://console.firebase.google.com)
 * O en la consola del navegador en admin.html
 */

async function crearUsuarioAdmin() {
    console.log('🔧 Iniciando configuración de admin...');
    
    const adminEmail = 'luciano21martinez@gmail.com';
    const adminPassword = '@Aaron31981842';
    
    try {
        // Verificar si Firebase está disponible
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
            throw new Error('Firebase no está cargado. Asegúrate de estar en admin.html o en la consola de Firebase.');
        }
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        console.log('1️⃣ Intentando crear usuario en Firebase Auth...');
        
        let user;
        try {
            // Intentar crear el usuario
            const userCredential = await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
            user = userCredential.user;
            console.log('✅ Usuario creado:', user.uid);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log('⚠️ Usuario ya existe, iniciando sesión...');
                const userCredential = await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
                user = userCredential.user;
                console.log('✅ Sesión iniciada:', user.uid);
            } else {
                throw error;
            }
        }
        
        console.log('2️⃣ Creando documento en /users/' + user.uid + '...');
        
        // Crear o actualizar documento de usuario con rol admin
        await db.collection('users').doc(user.uid).set({
            email: adminEmail,
            role: 'admin',
            isAdmin: true,
            firstName: 'Luciano',
            lastName: 'Martinez',
            userType: 'admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('✅ Documento de usuario creado con rol admin');
        
        console.log('3️⃣ Verificando permisos...');
        
        // Verificar que puede leer certámenes
        const testQuery = await db.collection('certamenes_provinciales').limit(1).get();
        console.log('✅ Puede leer certámenes:', testQuery.size, 'documentos');
        
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('✅ CONFIGURACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('Credenciales configuradas:');
        console.log('  Email:', adminEmail);
        console.log('  Password:', adminPassword);
        console.log('  UID:', user.uid);
        console.log('  Role: admin');
        console.log('');
        console.log('Ahora puedes:');
        console.log('1. Cerrar sesión si estás logueado');
        console.log('2. Recargar la página (Ctrl+Shift+R)');
        console.log('3. Iniciar sesión con las credenciales');
        console.log('');
        
        return user;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Detalles:', error);
        
        if (error.code === 'auth/weak-password') {
            console.log('💡 La contraseña debe tener al menos 6 caracteres');
        } else if (error.code === 'permission-denied') {
            console.log('💡 Necesitas ejecutar esto con permisos de admin o desde Firebase Console');
        }
        
        throw error;
    }
}

// Ejecutar automáticamente si se carga desde consola
console.log('');
console.log('═══════════════════════════════════════');
console.log('🔧 CONFIGURADOR DE ADMIN VYT MUSIC');
console.log('═══════════════════════════════════════');
console.log('');
console.log('Para configurar el usuario admin, ejecuta:');
console.log('');
console.log('  crearUsuarioAdmin()');
console.log('');
console.log('O simplemente copia y pega este archivo completo en la consola.');
console.log('');

// Auto-ejecutar si window.__AUTO_SETUP_ADMIN está definido
if (typeof window !== 'undefined' && window.__AUTO_SETUP_ADMIN) {
    crearUsuarioAdmin();
}
