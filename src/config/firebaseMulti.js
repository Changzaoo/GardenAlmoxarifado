import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { decrypt } from '../utils/cryptoUtils';

// ====================================
// CONFIGURAÇÃO SIMPLIFICADA
// ====================================

console.log('🚀 Inicializando Firebase...');

// Configuração do banco principal (encriptada)
const primaryConfig = {
  apiKey: decrypt("WlpoYVN5QW5MbXRsaE9VVUFidFJjT2c2NGRYZENMYmx0dl9pRTRF"),
  authDomain: decrypt("Z2FyZGVuLWMwYjUwLmZpcmViYXNlYXBwLmNvbQ=="),
  projectId: decrypt("Z2FyZGVuLWMwYjUw"),
  storageBucket: decrypt("Z2FyZGVuLWMwYjUwLmZpcmViYXNlc3RvcmFnZS5hcHA="),
  messagingSenderId: decrypt("NDY3MzQ0MzU0OTk3"),
  appId: decrypt("MTo0NjczNDQzNTQ5OTc6d2ViOjNjMzM5N2UwMTc2MDYwYmIwYzk4ZmM="),
  measurementId: decrypt("Ry03TE1MOTNRRFRGCg==")
};

// Inicializar app principal
const app = initializeApp(primaryConfig, 'primary');

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { app };

// Habilitar persistência
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('⚠️ Múltiplas abas abertas');
  } else if (err.code === 'unimplemented') {
    console.warn('⚠️ Navegador não suporta persistência');
  }
});

console.log('✅ Firebase inicializado com sucesso!');

// Exports para compatibilidade
export const primaryDb = db;
export const primaryAuth = auth;
export const primaryStorage = storage;
export const primaryApp = app;

// Exports de bancos secundários (placeholders por enquanto)
export const backupDb = db;
export const backupAuth = auth;
export const backupStorage = storage;
export const backupApp = app;

export const workflowbr1Db = db;
export const workflowbr1Auth = auth;
export const workflowbr1Storage = storage;
export const workflowbr1App = app;

// Lista de bancos de dados (vazia por enquanto)
export const firebaseDatabases = [
  {
    id: 'primary',
    name: 'Garden Principal',
    description: 'Banco de dados principal',
    enabled: true,
    priority: 1
  }
];

// Função para adicionar banco (placeholder)
export const addFirebaseDatabase = (config) => {
  console.warn('addFirebaseDatabase não implementado na versão simplificada');
  return null;
};

// Maps vazios para compatibilidade
export const initializedDbs = new Map([['primary', db]]);
export const initializedApps = new Map([['primary', app]]);
export const initializedAuths = new Map([['primary', auth]]);
export const initializedStorages = new Map([['primary', storage]]);

// Mock do dbManager para não quebrar código existente
export const dbManager = {
  getActiveDb: () => db,
  getActiveAuth: () => auth,
  getActiveStorage: () => storage,
  getActiveApp: () => app,
  switchToDatabase: (id) => console.log(`Switching to ${id} (not implemented yet)`),
  getAllDatabases: () => firebaseDatabases,
  getInfo: () => ({
    activeDatabase: 'primary',
    totalDatabases: 1,
    enabledDatabases: 1,
    rotationSequence: ['primary'],
    lastRotation: null,
    needsRotation: false
  }),
  addListener: (callback) => {
    return () => {}; // unsubscribe function
  }
};

export default db;
