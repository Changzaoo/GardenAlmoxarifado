import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Suas configurações do Firebase (obtenha no console)
const firebaseConfig = {
  apiKey: "AIzaSyAnLmtlhOUUAbtRcOg64dXdCLbltv_iE4E",
  authDomain: "garden-c0b50.firebaseapp.com",
  projectId: "garden-c0b50",
  storageBucket: "garden-c0b50.firebasestorage.app",
  messagingSenderId: "467344354997",
  appId: "1:467344354997:web:3c3397e0176060bb0c98fc",
  measurementId: "G-7LML93QDTF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Auth (para futuro uso)
export const auth = getAuth(app);

// Para desenvolvimento local (opcional)
if (process.env.NODE_ENV === 'development' && !db._settings?.host?.includes('firestore.googleapis.com')) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (error) {
    console.warn('Emuladores já conectados ou não disponíveis');
  }
}

export default app;