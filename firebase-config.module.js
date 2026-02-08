// Firebase v10 modular config for ES module usage.
// Keep separate from firebase-config.js (v8 global) to avoid breaking existing pages.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const firebaseConfig = {
    apiKey: "AIzaSyB_LRm2DUhQXwlaCFGc4pqzWs6OiMdRqlk",
    authDomain: "vytonlineprueva.firebaseapp.com",
    projectId: "vytonlineprueva",
    storageBucket: "vytonlineprueva.firebasestorage.app",
    messagingSenderId: "175483939728",
    appId: "1:175483939728:web:230294acca9221d1d1a115",
    measurementId: "G-PWRTMBH631"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, auth, db, storage, functions };
