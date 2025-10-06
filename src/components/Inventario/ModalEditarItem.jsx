import React, { useState, useEffect } from 'react';
import { X, Package, Tag, Hash, CheckCircle, DollarSign } from 'lucide-react';

const ModalEditarItem = ({ item, onSalvar, onFechar }) => {
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    quantidade: 0,
    disponivel: 0,
    valorUnitario: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        nome: item.nome,
        categoria: item.categoria,
        quantidade: item.quantidade,
        disponivel: item.disponivel || 0,
        valorUnitario: item.valorUnitario || '',
      });
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(item.id, formData);
  };

  const valorTotal = formData.valorUnitario && formData.quantidade 
    ? (parseFloat(formData.valorUnitario) * parseInt(formData.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-24 md:pb-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-gray-200 dark:border-gray-700 overflow-hidden animate-slideUp max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-sky-500 dark:to-sky-600 px-6 py-5 border-b border-sky-600 dark:border-sky-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Editar Item</h2>
                <p className="text-sky-100 text-sm">Atualize as informações do item</p>
              </div>
            </div>
            <button
              onClick={onFechar}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nome do Item */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              <Package className="w-4 h-4 text-blue-500" />
              Nome do Item
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              placeholder="Digite o nome do item"
              required
            />
          </div>

          {/* Categoria */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              <Tag className="w-4 h-4 text-purple-500" />
              Categoria
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
              required
            >
              <option value="">Selecione uma categoria</option>
              <option value="Plantas & Mudas">🌱 Plantas & Mudas</option>
              <option value="Sementes">🌾 Sementes</option>
              <option value="Fertilizantes & Adubos">Fertilizantes & Adubos</option>
              <option value="Terra & Substratos">Terra & Substratos</option>
              <option value="Vasos & Recipientes">Vasos & Recipientes</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Equipamentos">Equipamentos</option>
              <option value="Insumos">Insumos</option>
              <option value="EPI">EPI</option>
            </select>
          </div>

          {/* Grid de Quantidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                <Hash className="w-4 h-4 text-orange-500" />
                Quantidade Total
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder="0"
                required
              />
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
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
                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Valor Unitário */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Valor Unitário
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600 dark:text-green-400">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.valorUnitario}
                onChange={(e) => setFormData({ ...formData, valorUnitario: e.target.value })}
                className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl pl-4 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Card de Valor Total */}
          {formData.valorUnitario && parseFloat(formData.valorUnitario) > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-300 dark:border-green-700 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">Valor Total do Estoque</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{formData.quantidade} unidade(s)</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{valorTotal}</p>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onFechar}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarItem;



