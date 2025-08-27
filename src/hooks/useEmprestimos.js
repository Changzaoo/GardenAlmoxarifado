import React, { useState, useEffect } from 'react';
import { SecureCollection } from '../utils/secureFirebase';

const emprestimosCollection = new SecureCollection('emprestimos');

export const useEmprestimos = () => {
  const [emprestimos, setEmprestimos] = useState([]);
  
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
            const emprestimosValidos = lista.filter(emp => {
              const valido = emp && emp.id && (emp.nomeFuncionario || emp.colaborador);
              if (!valido) {
                console.warn('Empréstimo inválido encontrado:', emp);
              }
              return valido;
            });
            console.log('Empréstimos válidos:', emprestimosValidos);
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

  return {
    emprestimos,
    adicionarEmprestimo,
    devolverFerramentas,
    removerEmprestimo,
    marcarDevolucaoPorTerceiros,
    atualizarDisponibilidade
  };
};