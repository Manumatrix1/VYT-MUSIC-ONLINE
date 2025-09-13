// Script para importar datos desde un backup JSON a Firestore
// Requiere Node.js y el archivo de credenciales de servicio (Admin SDK)
// Uso: node import-firestore-local.js backup-vyt-online-2025-09-12.json

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Cambia el nombre si tu archivo de credenciales es diferente
const serviceAccount = require("./vyt-online-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Utilidad para importar una colección
async function importCollection(colName, docs) {
  for (const doc of docs) {
    const { id, ...data } = doc;
    await db.collection(colName).doc(id).set(data, { merge: true });
    console.log(`Importado documento ${id} en ${colName}`);
  }
}

async function main() {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error("Debes indicar el archivo JSON de backup como argumento.");
    process.exit(1);
  }
  const backup = JSON.parse(fs.readFileSync(path.join(__dirname, fileName), "utf8"));
  const collections = backup.collections || {};
  for (const colName of Object.keys(collections)) {
    console.log(`Importando colección: ${colName}`);
    await importCollection(colName, collections[colName]);
  }
  console.log("Importación completa.");
  process.exit(0);
}

main().catch(err => {
  console.error("Error importando Firestore:", err);
  process.exit(1);
});
