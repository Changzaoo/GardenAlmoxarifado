import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';

export const TarefasContext = createContext();

export const TarefasProvider = ({ children }) => {
  const { usuario } = useAuth();
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar tarefas
  useEffect(() => {
    if (!usuario?.id) return;

    let q;
    if (usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR) {
      // Supervisores veem todas as tarefas
      q = query(collection(db, 'tarefas'));
    } else {
      // Funcionários veem apenas suas tarefas e as tarefas onde são responsáveis
      q = query(
        collection(db, 'tarefas'),
        where('responsaveis', 'array-contains', usuario.nome)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tarefasData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Função auxiliar para converter data
        const converterData = (campo) => {
          if (!campo) return null;
          if (typeof campo === 'string') return campo;
          if (campo.toDate) return campo.toDate().toISOString();
          if (campo instanceof Date) return campo.toISOString();
          return null;
        };

        return {
          id: doc.id,
          ...data,
          dataCriacao: converterData(data.dataCriacao),
          dataAtualizacao: converterData(data.dataAtualizacao),
          dataConclusao: converterData(data.dataConclusao),
          prazo: converterData(data.prazo),
          responsaveis: data.responsaveis || []
        };
      });
      setTarefas(tarefasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  // Adicionar nova tarefa
  const adicionarTarefa = async (novaTarefa) => {
    if (!usuario?.id) return;
    
    try {
      // Processa as datas antes de enviar para o Firestore
      // Função auxiliar para converter data antes de salvar
      const converterDataParaSalvar = (data) => {
        if (!data) return null;
        if (data instanceof Date) return data;
        if (typeof data === 'string') return new Date(data);
        return null;
      };

      const tarefa = {
        ...novaTarefa,
        criadorId: usuario.id,
        criadorNome: usuario.nome,
        status: 'pendente',
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        // Se tiver prazo, converte para Date
        ...(novaTarefa.prazo ? { prazo: converterDataParaSalvar(novaTarefa.prazo) } : {})
      };

      await addDoc(collection(db, 'tarefas'), tarefa);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      return false;
    }
  };

  // Atualizar status da tarefa
  const atualizarTarefa = async (tarefaId, novoStatus) => {
    try {
      const tarefaRef = doc(db, 'tarefas', tarefaId);
      await updateDoc(tarefaRef, {
        status: novoStatus,
        dataAtualizacao: new Date(),
        ...(novoStatus === 'concluida' ? { dataConclusao: new Date() } : {})
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return false;
    }
  };

  // Remover tarefa
  const removerTarefa = async (tarefaId) => {
    try {
      await updateDoc(doc(db, 'tarefas', tarefaId), {
        status: 'cancelada',
        dataAtualizacao: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
      return false;
    }
  };

  return (
    <TarefasContext.Provider value={{
      tarefas,
      loading,
      adicionarTarefa,
      atualizarTarefa,
      removerTarefa
    }}>
      {children}
    </TarefasContext.Provider>
  );
};

export const useTarefas = () => {
  const context = useContext(TarefasContext);
  if (!context) {
    throw new Error('useTarefas deve ser usado dentro de um TarefasProvider');
  }
  return context;
};
