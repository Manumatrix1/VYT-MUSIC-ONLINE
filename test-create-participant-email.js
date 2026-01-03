/**
 * SCRIPT DE TESTING COMPLETO - VYT MUSIC
 * Crea participante de prueba y envía email de confirmación
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Necesitarás este archivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestParticipant() {
  try {
    console.log('🎭 Creando participante de prueba...');
    
    const testData = {
      // Datos básicos
      nombre: 'Test',
      apellido: 'Artista',
      nombre_artista: 'Test Singer 2026',
      dni: '12345678',
      email: 'luciano21martinez@gmail.com', // Tu email para recibir la confirmación
      telefono: '+5491112345678',
      fecha_nacimiento: '1995-01-15',
      
      // Ubicación
      provincia: 'Buenos Aires',
      ciudad: 'Rosario',
      direccion: 'Calle Test 123',
      
      // Detalles artísticos
      genero_musical: 'Pop',
      experiencia_previa: 'Artista de prueba para testing del sistema',
      redes_sociales: {
        instagram: '@testartista',
        facebook: 'testartista',
        youtube: '@testartista',
        tiktok: '@testartista'
      },
      
      // Video
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_youtube_id: 'dQw4w9WgXcQ',
      
      // URLs
      fotoURL: 'https://via.placeholder.com/400x400/667eea/ffffff?text=Test+Artist',
      
      // Estado
      estado: 'pendiente_pago', // Para triggear el email
      tipo_certamen: 'online',
      certamen_id: 'test_certamen_2026',
      
      // Metadata
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      
      // Estadísticas iniciales
      votos_totales: 0,
      total_votos_vyt_money: 0,
      reproducciones_youtube: 0,
      pago_completado: false,
      aprobado_admin: false
    };
    
    // Crear documento
    const docRef = await db.collection('participantes_online').add(testData);
    console.log('✅ Participante creado con ID:', docRef.id);
    
    // Crear perfil de artista asociado
    const artistProfile = {
      uid: 'test_uid_' + Date.now(),
      email: testData.email,
      nombre_artista: testData.nombre_artista,
      nombre: testData.nombre,
      apellido: testData.apellido,
      genero_musical: testData.genero_musical,
      provincia: testData.provincia,
      ciudad: testData.ciudad,
      fotoURL: testData.fotoURL,
      video_url: testData.video_url,
      redes_sociales: testData.redes_sociales,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      participante_id: docRef.id
    };
    
    const profileRef = await db.collection('artist_profiles').add(artistProfile);
    console.log('✅ Perfil de artista creado con ID:', profileRef.id);
    
    // TRIGGER: El email se enviará automáticamente por el trigger de Firestore
    // emailPerfilArtistaCreado detectará el nuevo documento y enviará el email
    
    console.log('\n📧 Email será enviado automáticamente por el trigger de Firebase');
    console.log('Revisa tu inbox en:', testData.email);
    
    return {
      participante_id: docRef.id,
      profile_id: profileRef.id,
      email: testData.email
    };
    
  } catch (error) {
    console.error('❌ Error creando participante:', error);
    throw error;
  }
}

async function cleanupTestData(participante_id, profile_id) {
  try {
    console.log('\n🧹 Limpiando datos de prueba...');
    
    if (participante_id) {
      await db.collection('participantes_online').doc(participante_id).delete();
      console.log('✅ Participante eliminado');
    }
    
    if (profile_id) {
      await db.collection('artist_profiles').doc(profile_id).delete();
      console.log('✅ Perfil eliminado');
    }
    
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  }
}

// Ejecutar
(async () => {
  try {
    const result = await createTestParticipant();
    
    console.log('\n✅ PRUEBA COMPLETADA');
    console.log('Participante ID:', result.participante_id);
    console.log('Profile ID:', result.profile_id);
    console.log('Email enviado a:', result.email);
    
    // Preguntar si quiere limpiar los datos
    console.log('\n⚠️  Para limpiar los datos de prueba, ejecuta:');
    console.log(`node cleanup-test.js ${result.participante_id} ${result.profile_id}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
})();

module.exports = { createTestParticipant, cleanupTestData };
