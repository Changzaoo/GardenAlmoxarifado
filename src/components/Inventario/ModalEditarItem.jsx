import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ModalEditarItem = ({ item, onSalvar, onFechar }) => {
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    quantidade: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        nome: item.nome,
        categoria: item.categoria,
        quantidade: item.quantidade,
      });
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(item.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#253341] rounded-2xl p-6 max-w-md w-full border border-[#38444D]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Editar Item</h2>
          <button
            onClick={onFechar}
            className="text-[#8899A6] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8899A6] mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-[#192734] border border-[#38444D] text-white placeholder-[#8899A6] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8899A6] mb-1">
              Categoria
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-[#192734] border border-[#38444D] text-white placeholder-[#8899A6] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              required
            >
              <option value="">Selecione uma categoria</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Equipamentos">Equipamentos</option>
              <option value="EPI">EPI</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8899A6] mb-1">
              Quantidade Total
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
              className="w-full bg-[#192734] border border-[#38444D] text-white placeholder-[#8899A6] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-[#8899A6] bg-[#192734] hover:bg-[#253341] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-lg transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarItem;
