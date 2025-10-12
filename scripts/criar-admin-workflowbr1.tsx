// Script para criar primeiro usuário admin no workflowbr1
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import CryptoJS from 'crypto-js';

const firebaseConfig = {
  apiKey: "AIzaSyC6IoQBbNZ1QCMNZAM79KRUJ-TRvWlnliY",
  authDomain: "workflowbr1.firebaseapp.com",
  projectId: "workflowbr1",
  storageBucket: "workflowbr1.firebasestorage.app",
  messagingSenderId: "207274549565",
  appId: "1:207274549565:web:4d7755e8424b74c6712554"
};

const app = initializeApp(firebaseConfig, "create-admin");
const db = getFirestore(app);

const APP_SECRET = 'W0rkFl0w@2024!S3cur3#K3y$2024*P@ssw0rd!H@sh';

const generateSecureSalt = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return salt;
};

const criarAdmin = async () => {
  try {
    const salt = generateSecureSalt();
    const hash = CryptoJS.SHA512('1533' + salt + APP_SECRET).toString();

    const adminData = {
      nome: 'Administrador',
      email: 'admin',
      senha: hash,
      salt: salt,
      version: 'v2',
      algorithm: 'SHA-512',
      nivel: 0,
      ativo: true,
      criadoEm: new Date().toISOString(),
      bancoDeDados: 'workflowbr1'
    };

    const docRef = await addDoc(collection(db, 'usuarios'), adminData);
    
    console.log('✅ Admin criado com sucesso!');
    console.log('📧 Email: admin');
    console.log('🔑 Senha: 1533');
    console.log('🆔 ID:', docRef.id);
    console.log('🔐 Hash:', hash);
    console.log('🧂 Salt:', salt);
    
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  }
};

criarAdmin();
