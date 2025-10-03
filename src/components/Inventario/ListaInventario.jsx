import React, { useState } from 'react';
import { Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import ItemCard from './ItemCard';
import { useToast } from '../ToastProvider';
import ModalEditarItem from './ModalEditarItem';

const ListaInventario = ({ inventario, emprestimos, removerItem, atualizarItem, obterDetalhesEmprestimos }) => {
  const [filtroInventario, setFiltroInventario] = useState('');
  const [itemParaEditar, setItemParaEditar] = useState(null);
  const [ordenacao, setOrdenacao] = useState('nome-asc'); // nome-asc, nome-desc, qtd-asc, qtd-desc, valor-asc, valor-desc
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const { showToast } = useToast();

  // Aplica os filtros
  const inventarioFiltrado = inventario.filter(item => {
    const matchTexto = item.nome.toLowerCase().includes(filtroInventario.toLowerCase()) ||
                      item.categoria.toLowerCase().includes(filtroInventario.toLowerCase());
    const matchCategoria = !filtroCategoria || item.categoria === filtroCategoria;
    return matchTexto && matchCategoria;
  });

  // Aplica a ordenação
  const inventarioOrdenado = [...inventarioFiltrado].sort((a, b) => {
    switch (ordenacao) {
      case 'nome-asc':
        return a.nome.localeCompare(b.nome);
      case 'nome-desc':
        return b.nome.localeCompare(a.nome);
      case 'qtd-asc':
        return a.quantidade - b.quantidade;
      case 'qtd-desc':
        return b.quantidade - a.quantidade;
      case 'valor-asc':
        const valorTotalA = (parseFloat(a.valorUnitario) || 0) * (parseInt(a.quantidade) || 0);
        const valorTotalB = (parseFloat(b.valorUnitario) || 0) * (parseInt(b.quantidade) || 0);
        return valorTotalA - valorTotalB;
      case 'valor-desc':
        const valorTotalA2 = (parseFloat(a.valorUnitario) || 0) * (parseInt(a.quantidade) || 0);
        const valorTotalB2 = (parseFloat(b.valorUnitario) || 0) * (parseInt(b.quantidade) || 0);
        return valorTotalB2 - valorTotalA2;
      default:
        return 0;
    }
  });

  const handleRemoverItem = (id) => {
    removerItem(id, emprestimos);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por item..."
              value={filtroInventario}
              onChange={(e) => setFiltroInventario(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 font-medium shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
            >
              <option value="">Todas as categorias</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Equipamentos">Equipamentos</option>
              <option value="EPI">EPI</option>
              <option value="Outros">Outros</option>
            </select>

            <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-gray-50 dark:bg-gray-800 shadow-sm">
              <button
                onClick={() => setOrdenacao('nome-asc')}
                className={`p-2 rounded-md transition-all duration-200 ${ordenacao === 'nome-asc' ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-md scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'}`}
                title="Ordenar por nome (A-Z)"
              >
                <SortAsc className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOrdenacao('nome-desc')}
                className={`p-2 rounded-md transition-all duration-200 ${ordenacao === 'nome-desc' ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-md scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'}`}
                title="Ordenar por nome (Z-A)"
              >
                <SortDesc className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOrdenacao(ordenacao === 'qtd-asc' ? 'qtd-desc' : 'qtd-asc')}
                className={`p-2 rounded-md transition-all duration-200 ${ordenacao.startsWith('qtd-') ? 'bg-purple-500 dark:bg-purple-600 text-white shadow-md scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'}`}
                title="Ordenar por quantidade"
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOrdenacao(ordenacao === 'valor-desc' ? 'valor-asc' : 'valor-desc')}
                className={`p-2 rounded-md transition-all duration-200 ${ordenacao.startsWith('valor-') ? 'bg-green-500 dark:bg-green-600 text-white shadow-md scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'}`}
                title="Ordenar por valor total"
              >
                💰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventarioOrdenado.map(item => (
          <ItemCard 
            key={item.id} 
            item={item} 
            onRemover={handleRemoverItem}
            onEditar={() => setItemParaEditar(item)}
            detalhesEmprestimos={obterDetalhesEmprestimos(item.nome)}
          />
        ))}
      </div>

      {itemParaEditar && (
        <ModalEditarItem
          item={itemParaEditar}
          onFechar={() => setItemParaEditar(null)}
          onSalvar={async (id, dados) => {
            try {
              await atualizarItem(id, dados);
              showToast('Item atualizado com sucesso!', 'success');
              setItemParaEditar(null);
            } catch (error) {
              console.error('Erro ao atualizar item:', error);
              showToast(error.message || 'Erro ao atualizar item', 'error');
            }
          }}
        />
      )}
    </div>
  );
};

export default ListaInventario;

