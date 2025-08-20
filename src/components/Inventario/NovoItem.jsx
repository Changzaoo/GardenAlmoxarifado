import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../AlmoxarifadoJardim';

const NovoItem = ({ adicionarItem }) => {
  const { classes } = useTheme();
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
    <div className={`${classes.card} p-6`}>
      <h2 className={`text-xl font-bold ${classes.textPrimary} mb-4`}>
        Novo Item no Inventário
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Nome do item"
          value={novoItem.nome}
          onChange={(e) => setNovoItem({...novoItem, nome: e.target.value})}
          className={`px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
          style={{ '--tw-ring-color': '#bd9967' }}
        />
        <input
          type="number"
          min="1"
          placeholder="Quantidade"
          value={novoItem.quantidade}
          onChange={(e) => setNovoItem({...novoItem, quantidade: e.target.value})}
          className={`px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
          style={{ '--tw-ring-color': '#bd9967' }}
        />
        <select
          value={novoItem.categoria}
          onChange={(e) => setNovoItem({...novoItem, categoria: e.target.value})}
          className={`px-3 py-2 ${classes.formSelect} focus:ring-2 focus:border-transparent`}
          style={{ '--tw-ring-color': '#bd9967' }}
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
          className={`${classes.buttonPrimary} flex items-center justify-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{ 
            backgroundColor: (!novoItem.nome || !novoItem.quantidade || !novoItem.categoria) ? undefined : '#bd9967'
          }}
        >
          <Plus className="w-4 h-4" />
          Adicionar Item
        </button>
      </div>
    </div>
  );
};

export default NovoItem;