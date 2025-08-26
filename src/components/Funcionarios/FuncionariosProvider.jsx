import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const FuncionariosContext = createContext();

export const FuncionariosProvider = ({ children }) => {
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    // Buscar funcionários do Firestore
    const unsubscribe = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
      const funcionariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Funcionários carregados do Firestore:', funcionariosData);
      setFuncionarios(funcionariosData);
    }, (error) => {
      console.error('Erro ao carregar funcionários:', error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FuncionariosContext.Provider value={{ funcionarios }}>
      {children}
    </FuncionariosContext.Provider>
  );
};

export const useFuncionarios = () => {
  const context = useContext(FuncionariosContext);
  if (!context) {
    throw new Error('useFuncionarios deve ser usado dentro de um FuncionariosProvider');
  }
  return context;
};
