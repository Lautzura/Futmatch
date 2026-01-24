
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * 🛠️ INSTRUCCIONES PARA CORREGIR EL ERROR DE PERMISOS:
 * 1. Ve a https://console.firebase.google.com/
 * 2. Entra en tu proyecto "futmatch-b0b36"
 * 3. Ve a "Firestore Database" -> Pestaña "Rules"
 * 4. Pega este código y dale a "Publish":
 * 
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /{document=**} {
 *       allow read, write: if request.auth != null;
 *     }
 *   }
 * }
 * 
 * 5. También ve a "Authentication" -> "Sign-in method" y activa "Anónimo" y "Google".
 */

const firebaseConfig = {
  apiKey: "AIzaSyAPjjE5MMqrDRyUu8C-K-468bX7spU-dxs",
  authDomain: "futmatch-b0b36.firebaseapp.com",
  projectId: "futmatch-b0b36",
  storageBucket: "futmatch-b0b36.firebasestorage.app",
  messagingSenderId: "672935976004",
  appId: "1:672935976004:web:e3a13f79f5b4f3537ab011",
  measurementId: "G-46S60YSRRR"
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "TU_API_KEY_AQUI";

let app;
let auth: any;
let db: any;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase inicializado.");
} catch (error) {
    console.error("Error inicializando Firebase:", error);
}

export { auth, db };
