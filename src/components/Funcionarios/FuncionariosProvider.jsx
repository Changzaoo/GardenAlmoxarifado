import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const FuncionariosContext = createContext();

export const FuncionariosProvider = ({ children }) => {
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    const unsubscribers = [];

    // 1. Buscar funcionários da coleção 'funcionarios'
    const unsubscribeFuncionarios = onSnapshot(
      collection(db, 'funcionarios'), 
      (snapshot) => {
        const funcionariosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          origem: 'funcionarios' // Marcar origem
        }));
        
        // Filtrar apenas funcionários ativos (não demitidos)
        const funcionariosAtivos = funcionariosData.filter(func => !func.demitido);
        console.log('📋 Funcionários carregados da coleção "funcionarios":', funcionariosAtivos.length);
        
        // Atualizar estado parcialmente
        setFuncionarios(prev => {
          // Mesclar com usuários existentes
          const usuarios = prev.filter(f => f.origem === 'usuarios');
          return [...funcionariosAtivos, ...usuarios];
        });
      }, 
      (error) => {
        console.error('❌ Erro ao carregar funcionários:', error);
      }
    );
    unsubscribers.push(unsubscribeFuncionarios);

    // 2. Buscar usuários da coleção 'usuario' (NOVO!)
    const unsubscribeUsuarios = onSnapshot(
      collection(db, 'usuario'),
      (snapshot) => {
        const usuariosData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            nome: data.nome,
            email: data.email,
            username: data.email, // Usar email como username
            cargo: data.cargo || 'Funcionário',
            empresaId: data.empresaId,
            empresaNome: data.empresaNome,
            setorId: data.setorId,
            setorNome: data.setorNome,
            nivel: data.nivel,
            ativo: data.ativo !== false, // Considerar ativo por padrão
            origem: 'usuarios', // Marcar origem
            photoURL: data.photoURL || null
          };
        });
        
        // Filtrar apenas usuários ativos
        const usuariosAtivos = usuariosData.filter(user => user.ativo);
        console.log('👥 Usuários carregados da coleção "usuarios":', usuariosAtivos.length);
        
        // Atualizar estado parcialmente
        setFuncionarios(prev => {
          // Mesclar com funcionários existentes
          const funcionarios = prev.filter(f => f.origem === 'funcionarios');
          
          // Evitar duplicatas (mesmo email)
          const usuariosNaoLegacy = usuariosAtivos.filter(usuario => {
            return !funcionarios.some(func => 
              func.email === usuario.email || func.id === usuario.id
            );
          });
          
          const merged = [...funcionarios, ...usuariosNaoLegacy];
          console.log('✅ Total mesclado (funcionarios + usuarios):', merged.length);
          console.log('   - Da coleção "funcionarios":', funcionarios.length);
          console.log('   - Da coleção "usuarios":', usuariosNaoLegacy.length);
          
          return merged;
        });
      },
      (error) => {
        console.error('❌ Erro ao carregar usuários:', error);
      }
    );
    unsubscribers.push(unsubscribeUsuarios);

    // Cleanup: cancelar todas as subscrições
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
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
