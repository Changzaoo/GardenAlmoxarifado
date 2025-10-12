import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import initialSyncService from '../../services/initialSyncService';

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

      }
    };

    // Processar cada coleção
    funcionariosLista.forEach(func => adicionarFuncionario(func.id, func, 'funcionarios'));
    usuariosLista.forEach(user => adicionarFuncionario(user.id, user, 'usuarios'));
    usuariosSingularLista.forEach(user => adicionarFuncionario(user.id, user, 'usuario'));

    // Converter para array e filtrar apenas ativos E não-administradores
    const resultado = Array.from(todosUsuarios.values()).filter(f => {
      // Filtrar apenas ativos
      if (!f.ativo) return false;
      
      // Filtrar administradores
      // Verifica por nível numérico (0 = ADMIN) ou string ('admin', 'administrador')
      const nivelNumerico = typeof f.nivel === 'number' ? f.nivel : null;
      const nivelString = typeof f.nivel === 'string' ? f.nivel.toLowerCase() : '';
      
      // Cargo pode ser string ou objeto, então precisamos tratar ambos os casos
      let cargoNormalizado = '';
      if (typeof f.cargo === 'string') {
        cargoNormalizado = f.cargo.toLowerCase();
      } else if (f.cargo && typeof f.cargo === 'object' && f.cargo.nome) {
        cargoNormalizado = f.cargo.nome.toLowerCase();
      }
      
      const isAdmin = nivelNumerico === NIVEIS_PERMISSAO.ADMIN || 
                      nivelString === 'admin' || 
                      nivelString === 'administrador' ||
                      cargoNormalizado.includes('admin') ||
                      cargoNormalizado.includes('administrador');
      
      if (isAdmin) {

        return false;
      }
      
      return true;
    });

    return resultado;
  };

  useEffect(() => {
    // Listeners em tempo real para as três coleções
    const unsubscribeFuncionarios = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
      const funcionariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Atualizar quando houver mudanças
      const unsubscribeUsuarios = onSnapshot(collection(db, 'usuarios'), (usuariosSnapshot) => {
        const usuariosData = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const unsubscribeUsuario = onSnapshot(collection(db, 'usuario'), (usuarioSnapshot) => {
          const usuarioData = usuarioSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Unificar todas as três coleções
          const unificados = unificarFuncionarios(funcionariosData, usuariosData, usuarioData);
          setFuncionarios(unificados);
        });
        
        return unsubscribeUsuario;
      });
      
      return unsubscribeUsuarios;
    });

    return () => {
      unsubscribeFuncionarios();
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
