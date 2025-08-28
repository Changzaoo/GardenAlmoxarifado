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
    <div className="bg-[#192734] rounded-2xl shadow-sm p-6 border border-[#38444D]">
      <h2 className="text-xl font-bold text-[#1DA1F2] mb-4">Novo Item no Inventário</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Nome do item"
          value={novoItem.nome}
          onChange={(e) => setNovoItem({...novoItem, nome: e.target.value})}
          className="w-full bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors"
        />
        <input
          type="number"
          min="1"
          placeholder="Quantidade"
          value={novoItem.quantidade}
          onChange={(e) => setNovoItem({...novoItem, quantidade: e.target.value})}
          className="w-full bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors"
        />
        <select
          value={novoItem.categoria}
          onChange={(e) => setNovoItem({...novoItem, categoria: e.target.value})}
          className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
        >
          <option value="" className="bg-[#192734]">Selecione a categoria</option>
          <option value="Ferramentas" className="bg-[#192734]">Ferramentas</option>
          <option value="Equipamentos" className="bg-[#192734]">Equipamentos</option>
          <option value="EPI" className="bg-[#192734]">EPI</option>
          <option value="Outros" className="bg-[#192734]">Outros</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={!novoItem.nome || !novoItem.quantidade || !novoItem.categoria}
          className="bg-[#1DA1F2] text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#1a91da] transition-colors disabled:bg-[#38444D] disabled:text-[#8899A6] disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Adicionar Item
        </button>
      </div>
    </div>
  );
};

export default NovoItem;