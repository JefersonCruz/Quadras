
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth"; // Added GoogleAuthProvider
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB6l66mg1YBrpekOLGtSzdsIIlyXsM0ziU", // Sua API Key do ANODE Lite
  authDomain: "anode-lite.firebaseapp.com", // Seu Auth Domain do ANODE Lite
  projectId: "anode-lite", // Seu Project ID do ANODE Lite
  storageBucket: "anode-lite.appspot.com", // CORRIGIDO: Standard format
  messagingSenderId: "468146694907", // Seu Messaging Sender ID do ANODE Lite
  appId: "1:468146694907:web:aa60f4e32503ef70401e5e" // Seu App ID do ANODE Lite
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const googleProvider = new GoogleAuthProvider(); // Added GoogleAuthProvider instance

export { app, auth, db, storage, googleProvider }; // Exported googleProvider

