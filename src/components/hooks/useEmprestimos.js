import { useState, useEffect } from 'react';
import { historicoInicial } from '../../data/historicoInicial';
import { ref, set, onValue } from 'firebase/database';
import { encryptData, decryptData } from '../../services/encryptionService';
import { db } from '../../firebaseConfig'; 

export const useEmprestimos = () => {
  const [emprestimos, setEmprestimos] = useState([]);
  
  // Carregar dados ao inicializar
  useEffect(() => {
    const emprestimosRef = ref(db, 'emprestimos');
    onValue(emprestimosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEmprestimos(decryptData(data));
      } else {
        setEmprestimos(historicoInicial);
      }
    });
  }, []);

  const adicionarEmprestimo = (novoEmprestimo, atualizarInventario) => {
  if (!novoEmprestimo.colaborador || novoEmprestimo.ferramentas.length === 0) return;

  const lista = Array.isArray(emprestimos) ? emprestimos : [];
  const novoId = Math.max(...lista.map(e => e.id), 0) + 1;
    const emprestimo = {
      id: novoId,
      colaborador: novoEmprestimo.colaborador,
      ferramentas: [...novoEmprestimo.ferramentas],
      dataRetirada: novoEmprestimo.dataRetirada,
      horaRetirada: novoEmprestimo.horaRetirada,
      dataDevolucao: null,
      horaDevolucao: null,
      status: 'emprestado',
      responsavel: 'vinicius'
    };

    setEmprestimos(prev => [...prev, emprestimo]);
    
    // Atualizar disponibilidade no inventário
    atualizarInventario(novoEmprestimo.ferramentas, 'remover');
    
    return emprestimo;
  };

  const devolverFerramentas = (id, atualizarInventario) => {
    const emprestimo = emprestimos.find(e => e.id === id);
    if (!emprestimo) return;
    
    const agora = new Date();
    
    setEmprestimos(prev => prev.map(emp => 
      emp.id === id 
        ? { 
            ...emp, 
            dataDevolucao: agora.toISOString().split('T')[0], 
            horaDevolucao: agora.toTimeString().slice(0, 5),
            status: 'devolvido' 
          }
        : emp
    ));

    // Atualizar disponibilidade no inventário
    atualizarInventario(emprestimo.ferramentas, 'adicionar');
  };

  const removerEmprestimo = (id, atualizarInventario) => {
    const emprestimo = emprestimos.find(e => e.id === id);
    if (!emprestimo) return;
    
    // Se estava emprestado, devolver para o estoque
    if (emprestimo.status === 'emprestado') {
      atualizarInventario(emprestimo.ferramentas, 'adicionar');
    }
    
    setEmprestimos(prev => prev.filter(emp => emp.id !== id));
  };

  return {
    emprestimos,
    adicionarEmprestimo,
    devolverFerramentas,
    removerEmprestimo,
    setEmprestimos
  };
};