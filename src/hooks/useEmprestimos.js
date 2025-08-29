import React, { useState, useEffect } from 'react';
import { SecureCollection } from '../utils/secureFirebase';
import { useToast } from '../components/ToastProvider';

const emprestimosCollection = new SecureCollection('emprestimos');

export const useEmprestimos = () => {
  const [emprestimos, setEmprestimos] = useState([]);
  const { showToast } = useToast();
  
  // Carregar dados ao inicializar
  useEffect(() => {
    let unsubscribe = () => {};

    const carregarEmprestimos = () => {
      try {
        console.log('Iniciando carregamento de empréstimos...');
        unsubscribe = emprestimosCollection.onSnapshot((lista) => {
          console.log('Empréstimos carregados (brutos):', lista);
          if (Array.isArray(lista)) {
            // Garantir que cada item tenha as propriedades necessárias
            const emprestimosValidos = lista.map(emp => {
              // Garantir que todos os campos necessários existam
              return {
                id: emp.id || '',
                nomeFuncionario: emp.nomeFuncionario || emp.colaborador || 'Não identificado',
                ferramentas: emp.ferramentas || [],
                dataEmprestimo: emp.dataEmprestimo || new Date().toISOString(),
                dataDevolucao: emp.dataDevolucao || null,
                status: emp.status || 'emprestado',
                devolvidoPorTerceiros: emp.devolvidoPorTerceiros || false,
                observacoes: emp.observacoes || '',
                ...emp // Manter outros campos que possam existir
              };
            });
            console.log('Empréstimos processados:', emprestimosValidos);
            setEmprestimos(emprestimosValidos);
          } else {
            console.error('Lista de empréstimos não é um array:', lista);
            setEmprestimos([]);
          }
        });
      } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        setEmprestimos([]);
      }
    };

    carregarEmprestimos();
    return () => unsubscribe();
  }, []);

  // Adicionar novo empréstimo
  const adicionarEmprestimo = async (novoEmprestimo) => {
    try {
      const id = await emprestimosCollection.add({
        ...novoEmprestimo,
        dataEmprestimo: new Date().toISOString(),
        status: 'emprestado'
      });
      return { id, ...novoEmprestimo };
    } catch (error) {
      console.error('Erro ao adicionar empréstimo:', error);
      throw error;
    }
  };

  // Devolver ferramentas
  const devolverFerramentas = async (emprestimoId, callback) => {
    try {
      const emprestimo = emprestimos.find(e => e.id === emprestimoId);
      if (!emprestimo) throw new Error('Empréstimo não encontrado');

      await emprestimosCollection.update(emprestimoId, {
        ...emprestimo,
        status: 'devolvido',
        dataDevolucao: new Date().toISOString()
      });

      if (callback) callback();
      return true;
    } catch (error) {
      console.error('Erro ao devolver ferramentas:', error);
      throw error;
    }
  };

  // Remover empréstimo
  const removerEmprestimo = async (emprestimoId, callback) => {
    try {
      await emprestimosCollection.delete(emprestimoId);
      if (callback) callback();
      return true;
    } catch (error) {
      console.error('Erro ao remover empréstimo:', error);
      throw error;
    }
  };

  // Marcar devolução por terceiros
  const marcarDevolucaoPorTerceiros = async (emprestimoId) => {
    try {
      const emprestimo = emprestimos.find(e => e.id === emprestimoId);
      if (!emprestimo) throw new Error('Empréstimo não encontrado');

      await emprestimosCollection.update(emprestimoId, {
        ...emprestimo,
        devolvidoPorTerceiros: true,
        status: 'devolvido',
        dataDevolucao: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Erro ao marcar devolução por terceiros:', error);
      throw error;
    }
  };

  // Atualizar disponibilidade (callback para outras operações)
  const atualizarDisponibilidade = async () => {
    // Esta função pode ser implementada se necessário
    return true;
  };

  // Devolver ferramentas parcialmente
  const devolverFerramentasParcial = async (emprestimoId, ferramentasDevolvidas, devolvidoPorTerceiros = false) => {
    try {
      const emprestimo = emprestimos.find(e => e.id === emprestimoId);
      if (!emprestimo) {
        showToast('Empréstimo não encontrado', 'error');
        return;
      }

      // Filtra as ferramentas que permanecerão emprestadas
      const ferramentasRestantes = emprestimo.ferramentas.filter(ferr => 
        !ferramentasDevolvidas.some(fd => 
          (typeof fd === 'string' ? fd === ferr : fd.nome === ferr.nome)
        )
      );

      if (ferramentasRestantes.length === 0) {
        // Se todas as ferramentas foram devolvidas, marca o empréstimo como concluído
        await emprestimosCollection.update(emprestimoId, {
          ...emprestimo,
          status: 'devolvido',
          dataDevolucao: new Date().toISOString(),
          devolvidoPorTerceiros,
          ferramentas: []
        });
        showToast('Todas as ferramentas foram devolvidas com sucesso', 'success');
      } else {
        // Atualiza o empréstimo mantendo apenas as ferramentas não devolvidas
        await emprestimosCollection.update(emprestimoId, {
          ...emprestimo,
          ferramentas: ferramentasRestantes,
          devolvidoPorTerceiros
        });
        showToast('Ferramentas selecionadas foram devolvidas com sucesso', 'success');
      }
    } catch (error) {
      console.error('Erro ao devolver ferramentas:', error);
      showToast('Erro ao devolver ferramentas. Tente novamente.', 'error');
    }
  };

  return {
    emprestimos,
    adicionarEmprestimo,
    devolverFerramentas,
    removerEmprestimo,
    marcarDevolucaoPorTerceiros,
    devolverFerramentasParcial,
    atualizarDisponibilidade
  };
};