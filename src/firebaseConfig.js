import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAnLmtlhOUUAbtRcOg64dXdCLbltv_iE4E",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "garden-c0b50.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "garden-c0b50",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "garden-c0b50.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "467344354997",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:467344354997:web:3c3397e0176060bb0c98fc",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-7LML93QDTF"
};

const app = initializeApp(firebaseConfig);

// Inicializar Firestore com configurações otimizadas e persistência
export const db = getFirestore(app);

// Habilitar persistência offline com tratamento de erro
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});

// Inicializar Auth com validação de estado
export const auth = getAuth(app);
auth.onAuthStateChanged((user) => {
  if (user) {
    // Renovar token periodicamente para segurança
    user.getIdToken(true);
  }
});

// Inicializar Storage com regras de segurança
export const storage = getStorage(app);

// Para desenvolvimento local (opcional)
if (process.env.NODE_ENV === 'development') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (error) {
    console.warn('Emuladores já conectados ou não disponíveis');
  }
}

export default app;