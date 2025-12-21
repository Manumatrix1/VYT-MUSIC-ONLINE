const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function createAdmin() {
  try {
    console.log('👑 Creando usuario administrador...');
    
    const email = 'luciano21martinez@gmail.com';
    const displayName = 'Luciano Martinez';
    
    // Crear usuario en Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      emailVerified: true,
      displayName: displayName,
      password: 'Admin123456' // Contraseña temporal
    });

    console.log(`✅ Usuario Auth creado con UID: ${userRecord.uid}`);

    // Crear perfil en Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: displayName,
      role: 'admin',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      vyt_money_balance: 0,
      total_votes: 0,
      status: 'active'
    });

    console.log('📝 Perfil guardado en Firestore');

    // Asignar claim personalizado
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    console.log('🔑 Claims personalizados asignados');

    console.log(`👑 ADMIN CREADO EXITOSAMENTE!`);
    console.log(`Email: ${email}`);
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Contraseña temporal: Admin123456`);
    console.log(`🚀 Ya puedes acceder al panel de admin!`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creando admin:', error);
    process.exit(1);
  }
}

createAdmin();