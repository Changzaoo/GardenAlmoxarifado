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
        unsubscribe = emprestimosCollection.onSnapshot((lista) => {
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

  // Adicionar novo empréstimo
  const adicionarEmprestimo = async (novoEmprestimo) => {
    try {
      const id = await emprestimosCollection.add({
        ...novoEmprestimo,
        dataRetirada: new Date().toISOString().split('T')[0],
        horaRetirada: new Date().toLocaleTimeString(),
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
        dataDevolucao: new Date().toISOString().split('T')[0],
        horaDevolucao: new Date().toLocaleTimeString()
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
        dataDevolucao: new Date().toISOString().split('T')[0],
        horaDevolucao: new Date().toLocaleTimeString()
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