// Script para exportar colecciones Firestore a un archivo JSON
// Requiere Node.js y el archivo de credenciales de servicio (Admin SDK)
// Guarda el resultado en la raíz del proyecto

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Cambia el nombre si tu archivo de credenciales es diferente
const serviceAccount = require("./vyt-online-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Colecciones a exportar (puedes agregar/quitar)
const collections = [
  "participantes_online",
  "participantes_presenciales",
  "configuracion",
  "contenido_home",
  "contenido_dinamico",
  "certamenes_online"
];

async function exportCollections() {
  const resultado = {};
  for (const col of collections) {
    const snap = await db.collection(col).get();
    resultado[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Exportados ${resultado[col].length} documentos de ${col}`);
  }
  const fileName = `backup-vyt-online-${new Date().toISOString().slice(0,10)}.json`;
  fs.writeFileSync(path.join(__dirname, fileName), JSON.stringify({
    exportedAt: new Date().toISOString(),
    project: serviceAccount.project_id,
    collections: resultado
  }, null, 2), "utf8");
  console.log(`Backup guardado en ${fileName}`);
  process.exit(0);
}

exportCollections().catch(err => {
  console.error("Error exportando Firestore:", err);
  process.exit(1);
});
