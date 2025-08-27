import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import { encryptData, decryptData, generateSecureId } from './crypto';

// Wrapper para coleções do Firebase com encriptação
export class SecureCollection {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  // Adicionar documento com encriptação
  async add(data) {
    try {
      const documentId = generateSecureId(this.collectionName);
      const encryptedData = encryptData(data, documentId);
      
      await addDoc(this.collectionRef, {
        ...encryptedData,
        id: documentId,
        createdAt: Date.now()
      });

      return documentId;
    } catch (error) {
      console.error(`Erro ao adicionar documento em ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Atualizar documento com encriptação
  async update(documentId, data) {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      const encryptedData = encryptData(data, documentId);
      
      await updateDoc(docRef, {
        ...encryptedData,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error(`Erro ao atualizar documento em ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Excluir documento
  async delete(documentId) {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Erro ao excluir documento em ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Buscar todos os documentos com decriptação
  async getAll() {
    try {
      const snapshot = await getDocs(this.collectionRef);
      return snapshot.docs.map(doc => {
        const encryptedData = doc.data();
        try {
          const decryptedData = decryptData(encryptedData, encryptedData.id);
          return {
            id: encryptedData.id,
            ...decryptedData
          };
        } catch (error) {
          console.error(`Erro ao decriptar documento ${doc.id}:`, error);
          return null;
        }
      }).filter(Boolean); // Remove documentos que falharam na decriptação
    } catch (error) {
      console.error(`Erro ao buscar documentos em ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Observar mudanças na coleção com decriptação automática
  onSnapshot(callback) {
    return onSnapshot(this.collectionRef, (snapshot) => {
      const documents = snapshot.docs.map(doc => {
        const encryptedData = doc.data();
        try {
          const decryptedData = decryptData(encryptedData, encryptedData.id);
          return {
            id: encryptedData.id,
            ...decryptedData
          };
        } catch (error) {
          console.error(`Erro ao decriptar documento ${doc.id}:`, error);
          return null;
        }
      }).filter(Boolean);
      
      callback(documents);
    });
  }

  // Buscar documento por ID com decriptação
  async getById(documentId) {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const encryptedData = docSnap.data();
        return decryptData(encryptedData, documentId);
      }
      
      return null;
    } catch (error) {
      console.error(`Erro ao buscar documento por ID em ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Buscar documentos com filtro
  async query(conditions) {
    try {
      const q = query(this.collectionRef, ...conditions);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const encryptedData = doc.data();
        try {
          const decryptedData = decryptData(encryptedData, encryptedData.id);
          return {
            id: encryptedData.id,
            ...decryptedData
          };
        } catch (error) {
          console.error(`Erro ao decriptar documento ${doc.id}:`, error);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error(`Erro ao consultar documentos em ${this.collectionName}:`, error);
      throw error;
    }
  }
}
