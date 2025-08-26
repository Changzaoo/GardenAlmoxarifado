import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useEmprestimos = () => {
  const [emprestimos, setEmprestimos] = useState([]);
  
  // Carregar dados ao inicializar
  useEffect(() => {
    let unsubscribe = () => {};

    const carregarEmprestimos = async () => {
      try {
        unsubscribe = onSnapshot(collection(db, 'emprestimos'), (snapshot) => {
          const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEmprestimos(lista);
        });
      } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        setEmprestimos([]);
      }
    };

    carregarEmprestimos();
    return () => unsubscribe();
  }, []);

  const adicionarEmprestimo = async (novoEmprestimo) => {
    try {
      // Adicionar ao Firestore
      const docRef = await addDoc(collection(db, 'emprestimos'), novoEmprestimo);
      
      // Retornar o empréstimo com o ID
      const emprestimoComId = { id: docRef.id, ...novoEmprestimo };
      return emprestimoComId;
    } catch (error) {
      console.error('Erro ao adicionar empréstimo:', error);
      throw error;
    }
  };

  const atualizarEmprestimo = async (id, dados) => {
    try {
      const emprestimoRef = doc(db, 'emprestimos', id);
      await updateDoc(emprestimoRef, dados);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar empréstimo:', error);
      throw error;
    }
  };

  const deletarEmprestimo = async (id) => {
    try {
      await deleteDoc(doc(db, 'emprestimos', id));
      return true;
    } catch (error) {
      console.error('Erro ao deletar empréstimo:', error);
      throw error;
    }
  };

  return {
    emprestimos,
    adicionarEmprestimo,
    atualizarEmprestimo,
    deletarEmprestimo
  };
};