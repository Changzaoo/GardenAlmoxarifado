import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const NovoItem = ({ adicionarItem }) => {
  const [novoItem, setNovoItem] = useState({
    nome: '',
    quantidade: '',
    categoria: ''
  });

  const handleSubmit = () => {
    if (!novoItem.nome || !novoItem.quantidade || !novoItem.categoria) return;

    const sucesso = adicionarItem(novoItem);
    
    if (sucesso) {
      setNovoItem({ nome: '', quantidade: '', categoria: '' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-600 dark:border-gray-600">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Nome do item"
          value={novoItem.nome}
          onChange={(e) => setNovoItem({...novoItem, nome: e.target.value})}
          className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors"
        />
        <input
          type="number"
          min="1"
          placeholder="Quantidade"
          value={novoItem.quantidade}
          onChange={(e) => setNovoItem({...novoItem, quantidade: e.target.value})}
          className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors"
        />
        <select
          value={novoItem.categoria}
          onChange={(e) => setNovoItem({...novoItem, categoria: e.target.value})}
          className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none"
        >
          <option value="" className="bg-white dark:bg-gray-800">Selecione a categoria</option>
          <option value="Ferramentas" className="bg-white dark:bg-gray-800">Ferramentas</option>
          <option value="Equipamentos" className="bg-white dark:bg-gray-800">Equipamentos</option>
          <option value="EPI" className="bg-white dark:bg-gray-800">EPI</option>
          <option value="Outros" className="bg-white dark:bg-gray-800">Outros</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={!novoItem.nome || !novoItem.quantidade || !novoItem.categoria}
          className="bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors disabled:bg-[#38444D] disabled:text-gray-500 dark:text-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Adicionar Item
        </button>
      </div>
    </div>
  );
};

export default NovoItem;


