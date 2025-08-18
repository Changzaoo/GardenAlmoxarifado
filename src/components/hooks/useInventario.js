import { useState } from 'react';
import { inventarioInicial } from '../../data/inventarioInicial';

export const useInventario = () => {
  const [inventario, setInventario] = useState(inventarioInicial);

  const adicionarItem = (novoItem) => {
    if (!novoItem.nome || !novoItem.quantidade || !novoItem.categoria) return false;

    const novoId = Math.max(...inventario.map(i => i.id), 0) + 1;
    const item = {
      id: novoId,
      nome: novoItem.nome,
      quantidade: parseInt(novoItem.quantidade),
      disponivel: parseInt(novoItem.quantidade),
      categoria: novoItem.categoria
    };

    setInventario(prev => [...prev, item]);
    return true;
  };

  const removerItem = (id, emprestimos, setEmprestimos) => {
    const item = inventario.find(i => i.id === id);
    if (!item) return;

    setInventario(prev => prev.filter(item => item.id !== id));
    
    // Remover empréstimos relacionados
    if (setEmprestimos) {
      setEmprestimos(prev => prev.filter(emp => 
        !emp.ferramentas.includes(item.nome)
      ));
    }
  };

  const atualizarDisponibilidade = (ferramentas, operacao) => {
    setInventario(prev => prev.map(item => {
      const quantidadeAfetada = ferramentas.filter(f => f === item.nome).length;
      
      if (quantidadeAfetada === 0) return item;
      
      if (operacao === 'remover') {
        return { ...item, disponivel: Math.max(0, item.disponivel - quantidadeAfetada) };
      } else if (operacao === 'adicionar') {
        return { ...item, disponivel: Math.min(item.quantidade, item.disponivel + quantidadeAfetada) };
      }
      
      return item;
    }));
  };

  const editarItem = (id, dadosAtualizados) => {
    setInventario(prev => prev.map(item => 
      item.id === id ? { ...item, ...dadosAtualizados } : item
    ));
  };

  return {
    inventario,
    adicionarItem,
    removerItem,
    atualizarDisponibilidade,
    editarItem,
    setInventario
  };
};