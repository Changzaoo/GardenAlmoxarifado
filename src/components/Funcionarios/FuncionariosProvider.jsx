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
      // Filtrar apenas funcionários ativos (não demitidos)
      const funcionariosAtivos = funcionariosData.filter(func => !func.demitido);
      console.log('Funcionários ativos carregados do Firestore:', funcionariosAtivos);
      setFuncionarios(funcionariosAtivos);
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
