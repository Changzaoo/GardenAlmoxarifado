// 🔥 Firebase Configuration - WorkflowBR1
// Configuração do banco de dados principal para criação de novos usuários

import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Configuração do Firebase WorkflowBR1
const firebaseConfig = {
  apiKey: "AIzaSyC6IoQBbNZ1QCMNZAM79KRUJ-TRvWlnliY",
  authDomain: "workflowbr1.firebaseapp.com",
  projectId: "workflowbr1",
  storageBucket: "workflowbr1.firebasestorage.app",
  messagingSenderId: "207274549565",
  appId: "1:207274549565:web:4d7755e8424b74c6712554",
  measurementId: "G-TYRLWERZMS"
};

// Inicializar Firebase
const appWorkflowBR1 = initializeApp(firebaseConfig, "workflowbr1");
const dbWorkflowBR1 = getFirestore(appWorkflowBR1);
const storage = getStorage(appWorkflowBR1);

// Habilitar persistência com sincronização multi-tab
enableIndexedDbPersistence(dbWorkflowBR1, {
  synchronizeTabs: true // Permite múltiplas abas abertas
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[WorkflowBR1] Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('[WorkflowBR1] The current browser does not support persistence.');
  }
});

// Inicializar Analytics (apenas em produção)
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  analytics = getAnalytics(appWorkflowBR1);
}

export { appWorkflowBR1, dbWorkflowBR1, storage, analytics };
export default dbWorkflowBR1;
