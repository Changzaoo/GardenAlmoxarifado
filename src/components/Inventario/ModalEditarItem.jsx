import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ModalEditarItem = ({ item, onSalvar, onFechar }) => {
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    quantidade: 0,
    disponivel: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        nome: item.nome,
        categoria: item.categoria,
        quantidade: item.quantidade,
        disponivel: item.disponivel || 0,
      });
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(item.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-600 dark:border-gray-600">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Editar Item</h2>
          <button
            onClick={onFechar}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Categoria
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
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
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Quantidade Total
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
              className="w-full bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Quantidade Disponível
            </label>
            <input
              type="number"
              min="0"
              max={formData.quantidade}
              value={formData.disponivel}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                const limitedValue = Math.min(value, formData.quantidade);
                setFormData({ ...formData, disponivel: limitedValue });
              }}
              className="w-full bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 dark:bg-gray-800 hover:bg-white dark:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] hover:bg-blue-600 dark:hover:bg-[#1a8cd8] text-gray-900 dark:text-white rounded-lg transition-colors"
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



