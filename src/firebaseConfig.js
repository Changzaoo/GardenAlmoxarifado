import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { decrypt, decryptObject } from './utils/cryptoUtils';

// Configurações ofuscadas do Firebase
const encryptedConfig = {
  "_k": "WlpoYVN5QW5MbXRsaE9VVUFidFJjT2c2NGRYZENMYmx0dl9pRTRF", // apiKey
  "_d": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlYXBwLmNvbQ==", // authDomain
  "_p": "Z2FyZGVuLWMwYjUw", // projectId
  "_s": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlc3RvcmFnZS5hcHA=", // storageBucket
  "_m": "NDY3MzQ0MzU0OTk3", // messagingSenderId
  "_a": "MTo0NjczNDQzNTQ5OTc6d2ViOjNjMzM5N2UwMTc2MDYwYmIwYzk4ZmM=", // appId
  "_t": "Ry03TE1MOTNRRFRGCg==" // measurementId
};

// Função para recuperar configuração em tempo de execução
const getFirebaseConfig = () => {
  const config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || decrypt(encryptedConfig._k),
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || decrypt(encryptedConfig._d),
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || decrypt(encryptedConfig._p),
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || decrypt(encryptedConfig._s),
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || decrypt(encryptedConfig._m),
    appId: process.env.REACT_APP_FIREBASE_APP_ID || decrypt(encryptedConfig._a),
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || decrypt(encryptedConfig._t)
  };

  // Adicionar ruído para confundir análise estática
  Object.defineProperty(config, Symbol.for('firebase'), {
    value: new Date().getTime(),
    enumerable: false
  });

  return config;
};

// Inicializar Firebase com proteções
const initializeFirebase = () => {
  try {
    // Adicionar proteções anti-debugging
    const startTime = performance.now();
    const config = getFirebaseConfig();
    const endTime = performance.now();

    // Se demorar muito para executar, pode estar sendo debugado
    if (endTime - startTime > 100) {
      throw new Error('Debugging detected');
    }

    // Criar instância do app com configuração protegida
    const app = initializeApp(config);

    // Remover configuração da memória
    setTimeout(() => {
      config.apiKey = null;
      config.appId = null;
      Object.freeze(config);
    }, 0);

    return app;
  } catch (error) {
    console.error('Error initializing Firebase');
    window.location.reload();
    return null;
  }
};

const app = initializeFirebase();

// Inicializar Firestore com configurações otimizadas
export const db = getFirestore(app);

// CORREÇÃO DEFINITIVA: Habilitar persistência SEM sincronização multi-tab
// synchronizeTabs: false evita conflitos de estado que causam INTERNAL ASSERTION FAILED
let persistenceEnabled = false;
enableIndexedDbPersistence(db, {
  synchronizeTabs: false, // ✅ CORRIGIDO: false evita conflitos de estado
  forceOwnership: true // ✅ NOVO: Força esta aba a ser a dona do cache
}).then(() => {
  persistenceEnabled = true;

}).catch((err) => {
  if (err.code === 'failed-precondition') {

    // Continua funcionando sem persistência
  } else if (err.code === 'unimplemented') {

  } else {
    console.error('❌ Erro ao habilitar persistência:', err);
  }
});

// Expor flag de persistência para debug
export const isOfflinePersistenceEnabled = () => persistenceEnabled;

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

  }
}

export default app;