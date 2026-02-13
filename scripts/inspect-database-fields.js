/**
 * 🔍 INSPECCIÓN DE CAMPOS DE BASE DE DATOS
 * Script para ver qué campos existen actualmente en cada colección
 */

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
  projectId: 'vytonlineprueva'
});

const db = admin.firestore();

async function inspectCollection(collectionName) {
  console.log(`\n📂 ${collectionName}:`);
  console.log('═'.repeat(60));
  
  const snapshot = await db.collection(collectionName).limit(3).get();
  
  if (snapshot.empty) {
    console.log('   ⚠️  Colección vacía');
    return;
  }
  
  snapshot.docs.forEach((doc, index) => {
    console.log(`\n   📄 Documento ${index + 1} (${doc.id}):`);
    const data = doc.data();
    const fields = Object.keys(data).sort();
    
    fields.forEach(field => {
      const value = data[field];
      const type = typeof value;
      const preview = type === 'string' ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"` :
                      type === 'number' ? value :
                      type === 'boolean' ? value :
                      Array.isArray(value) ? `Array[${value.length}]` :
                      value === null ? 'null' :
                      'Object';
      
      console.log(`      ${field}: ${preview}`);
    });
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 INSPECCIÓN DE CAMPOS - VYT MUSIC ONLINE              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const collections = [
    'participantes_online',
    'certamenes_provinciales',
    'artist_profiles'
  ];
  
  for (const collectionName of collections) {
    await inspectCollection(collectionName);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Inspección completada\n');
  
  process.exit(0);
}

main().catch(console.error);
