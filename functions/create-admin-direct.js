// Script directo para crear admin usando Admin SDK
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function createAdminDirectly() {
  try {
    const email = 'luciano21martinez@gmail.com';
    const displayName = 'Luciano Martinez';
    
    console.log('🔄 Creando usuario administrador...');
    console.log('Email:', email);
    console.log('Nombre:', displayName);
    
    // Crear usuario en Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      emailVerified: true,
      displayName: displayName,
      password: 'TempPassword123!' // Contraseña temporal
    });

    console.log('✅ Usuario Auth creado con UID:', userRecord.uid);

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

    console.log('✅ Perfil guardado en Firestore');

    // Asignar claim personalizado
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    console.log('✅ Claims personalizados asignados');

    console.log('👑 ADMIN CREADO EXITOSAMENTE!');
    console.log('Email:', email);
    console.log('UID:', userRecord.uid);
    console.log('Contraseña temporal: TempPassword123!');
    console.log('');
    console.log('Ahora puedes:');
    console.log('1. Ir a login.html');
    console.log('2. Usar email:', email);
    console.log('3. Usar contraseña: TempPassword123!');
    console.log('4. Acceder al panel de admin');
    
    return {
      success: true,
      uid: userRecord.uid,
      email: email
    };

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar
createAdminDirectly()
  .then(result => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });