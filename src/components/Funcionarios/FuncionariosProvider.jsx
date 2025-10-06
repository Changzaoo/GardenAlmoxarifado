import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const FuncionariosContext = createContext();

export const FuncionariosProvider = ({ children }) => {
  const [funcionarios, setFuncionarios] = useState([]);

  // Função auxiliar para normalizar nome (remove acentos, espaços extras, lowercase)
  const normalizarNome = (nome) => {
    if (!nome) return '';
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, ' ') // Remove espaços extras
      .trim();
  };

  // Função para unificar funcionários por email ou nome
  const unificarFuncionarios = (funcionariosLista, usuariosLista, usuariosSingularLista) => {
    const todosUsuarios = new Map(); // Chave: ID principal
    const emailIndex = new Map(); // Índice: email -> ID principal
    const nomeIndex = new Map(); // Índice: nome normalizado -> ID principal

    // Valores padrão para empresa e setor
    const EMPRESA_PADRAO = {
      id: 'zendaya',
      nome: 'Zendaya'
    };
    const SETOR_PADRAO = {
      id: 'jardim',
      nome: 'Jardim'
    };

    // Função para encontrar ID principal baseado em email ou nome
    const encontrarIdPrincipal = (email, nome) => {
      if (email) {
        const emailNorm = email.toLowerCase().trim();
        if (emailIndex.has(emailNorm)) {
          return emailIndex.get(emailNorm);
        }
      }
      
      if (nome) {
        const nomeNorm = normalizarNome(nome);
        if (nomeNorm && nomeIndex.has(nomeNorm)) {
          return nomeIndex.get(nomeNorm);
        }
      }
      
      return null;
    };

    // Função para adicionar/mesclar funcionário
    const adicionarFuncionario = (docId, data, origem) => {
      const email = (data.email || '').toLowerCase().trim();
      const nome = data.nome || data.displayName || '';
      const userId = data.userId || docId;
      
      // Verificar se já existe com mesmo email ou nome
      const idExistente = encontrarIdPrincipal(email, nome);
      const idFinal = idExistente || userId;
      
      // Preparar dados normalizados
      const dadosNormalizados = {
        nome: nome || email?.split('@')[0] || 'Funcionário',
        email: email || '',
        username: data.username || email || '',
        cargo: data.cargo || data.nivel || 'Funcionário',
        empresaId: data.empresaId || EMPRESA_PADRAO.id,
        empresaNome: data.empresaNome || EMPRESA_PADRAO.nome,
        setorId: data.setorId || SETOR_PADRAO.id,
        setorNome: data.setorNome || SETOR_PADRAO.nome,
        nivel: data.nivel || 'funcionario',
        ativo: data.ativo !== false && !data.demitido,
        photoURL: data.photoURL || data.avatar || null,
        telefone: data.telefone || '',
        dataCriacao: data.dataCriacao || data.createdAt || new Date(),
        ...data
      };
      
      if (todosUsuarios.has(idFinal)) {
        // Mesclar dados existentes
        const usuarioExistente = todosUsuarios.get(idFinal);
        
        todosUsuarios.set(idFinal, {
          ...usuarioExistente,
          // Priorizar valores não vazios
          nome: dadosNormalizados.nome || usuarioExistente.nome,
          email: dadosNormalizados.email || usuarioExistente.email,
          username: dadosNormalizados.username || usuarioExistente.username,
          cargo: dadosNormalizados.cargo || usuarioExistente.cargo,
          empresaId: usuarioExistente.empresaId || dadosNormalizados.empresaId,
          empresaNome: usuarioExistente.empresaNome || dadosNormalizados.empresaNome,
          setorId: usuarioExistente.setorId || dadosNormalizados.setorId,
          setorNome: usuarioExistente.setorNome || dadosNormalizados.setorNome,
          photoURL: dadosNormalizados.photoURL || usuarioExistente.photoURL,
          nivel: usuarioExistente.nivel || dadosNormalizados.nivel,
          ativo: dadosNormalizados.ativo && usuarioExistente.ativo,
          // Manter registro de origens
          origens: [...new Set([...(usuarioExistente.origens || []), origem])],
          idsRelacionados: [...new Set([...(usuarioExistente.idsRelacionados || []), docId, userId])]
        });
        
        console.log(`🔗 Mesclando "${nome || email}" (${origem}) com ID ${idFinal}`);
      } else {
        // Novo funcionário
        todosUsuarios.set(idFinal, {
          id: idFinal,
          ...dadosNormalizados,
          origens: [origem],
          idsRelacionados: [docId, userId].filter(Boolean)
        });
        
        // Indexar
        if (email) emailIndex.set(email, idFinal);
        if (nome) {
          const nomeNorm = normalizarNome(nome);
          if (nomeNorm) nomeIndex.set(nomeNorm, idFinal);
        }
        
        console.log(`➕ Novo funcionário "${nome || email}" (${origem}) com ID ${idFinal}`);
      }
    };

    // Processar cada coleção
    funcionariosLista.forEach(func => adicionarFuncionario(func.id, func, 'funcionarios'));
    usuariosLista.forEach(user => adicionarFuncionario(user.id, user, 'usuarios'));
    usuariosSingularLista.forEach(user => adicionarFuncionario(user.id, user, 'usuario'));

    // Converter para array e filtrar apenas ativos
    const resultado = Array.from(todosUsuarios.values()).filter(f => f.ativo);
    
    console.log(`✅ Total de funcionários únicos unificados: ${resultado.length}`);
    console.log(`   📋 Todos com empresa: ${EMPRESA_PADRAO.nome}`);
    console.log(`   🏢 Todos com setor: ${SETOR_PADRAO.nome}`);
    
    return resultado;
  };

  useEffect(() => {
    const unsubscribers = [];
    let funcionariosCache = [];
    let usuariosCache = [];
    let usuarioSingularCache = [];

    const atualizarFuncionarios = () => {
      const unificados = unificarFuncionarios(
        funcionariosCache, 
        usuariosCache, 
        usuarioSingularCache
      );
      setFuncionarios(unificados);
    };

    // 1️⃣ Buscar da coleção 'funcionarios'
    const unsubscribeFuncionarios = onSnapshot(
      collection(db, 'funcionarios'), 
      (snapshot) => {
        funcionariosCache = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`📋 Carregados ${funcionariosCache.length} documentos de "funcionarios"`);
        atualizarFuncionarios();
      }, 
      (error) => {
        console.error('❌ Erro ao carregar funcionários:', error);
      }
    );
    unsubscribers.push(unsubscribeFuncionarios);

    // 2️⃣ Buscar da coleção 'usuarios' (PLURAL)
    const unsubscribeUsuarios = onSnapshot(
      collection(db, 'usuarios'),
      (snapshot) => {
        usuariosCache = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`👥 Carregados ${usuariosCache.length} documentos de "usuarios" (plural)`);
        atualizarFuncionarios();
      },
      (error) => {
        console.error('❌ Erro ao carregar usuários (plural):', error);
      }
    );
    unsubscribers.push(unsubscribeUsuarios);

    // 3️⃣ Buscar da coleção 'usuario' (SINGULAR - legado)
    const unsubscribeUsuarioSingular = onSnapshot(
      collection(db, 'usuario'),
      (snapshot) => {
        usuarioSingularCache = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`👤 Carregados ${usuarioSingularCache.length} documentos de "usuario" (singular)`);
        atualizarFuncionarios();
      },
      (error) => {
        console.error('❌ Erro ao carregar usuário (singular):', error);
      }
    );
    unsubscribers.push(unsubscribeUsuarioSingular);

    // Cleanup
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
