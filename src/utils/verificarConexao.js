import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export const verificarConexaoFirebase = async () => {
  try {
    // Tenta fazer uma leitura simples para verificar a conexão
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o Firebase:', error);
    return false;
  }
};
