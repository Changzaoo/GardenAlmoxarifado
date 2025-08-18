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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Novo Item no Inventário</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Nome do item"
          value={novoItem.nome}
          onChange={(e) => setNovoItem({...novoItem, nome: e.target.value})}
          className="form-input"
        />
        <input
          type="number"
          min="1"
          placeholder="Quantidade"
          value={novoItem.quantidade}
          onChange={(e) => setNovoItem({...novoItem, quantidade: e.target.value})}
          className="form-input"
        />
        <select
          value={novoItem.categoria}
          onChange={(e) => setNovoItem({...novoItem, categoria: e.target.value})}
          className="form-select"
        >
          <option value="">Selecione a categoria</option>
          <option value="Ferramentas">Ferramentas</option>
          <option value="Equipamentos">Equipamentos</option>
          <option value="EPI">EPI</option>
          <option value="Outros">Outros</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={!novoItem.nome || !novoItem.quantidade || !novoItem.categoria}
          className="btn-primary flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Adicionar Item
        </button>
      </div>
    </div>
  );
};

export default NovoItem;