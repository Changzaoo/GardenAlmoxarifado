import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase com validação de configuração
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
}

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
  try {
    await db.enablePersistence({
      synchronizeTabs: true
    });
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('Múltiplas abas abertas, persistência desabilitada');
    } else if (err.code === 'unimplemented') {
      console.warn('Navegador não suporta persistência');
    }
  }
};

// Inicializar persistência
initFirestore();

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