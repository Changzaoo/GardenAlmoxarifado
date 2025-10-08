import React, { useState } from 'react';
import { Search, SortAsc, SortDesc, Filter, Package, ListFilter } from 'lucide-react';
import ItemCard from './ItemCard';
import { useToast } from '../ToastProvider';
import ModalEditarItem from './ModalEditarItem';

const ListaInventario = ({ 
  inventario, 
  emprestimos, 
  removerItem, 
  atualizarItem, 
  obterDetalhesEmprestimos,
  ferramentasDanificadas = [],
  ferramentasPerdidas = []
}) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 max-w-7xl mx-auto">
      {/* Título da Seção */}
      <div className="mb-4">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <ListFilter className="w-4 h-4" />
          Filtros e Busca
        </h2>
      </div>

      {/* Header com Busca e Filtros */}
      <div className="mb-6 space-y-4">
        {/* Busca, Categoria e Ordenação - Desktop: mesma linha | Mobile: empilhado */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Barra de Busca */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome ou categoria..."
              value={filtroInventario}
              onChange={(e) => setFiltroInventario(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
            />
          </div>

          {/* Filtro de Categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="h-12 lg:h-10 px-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm text-gray-700 dark:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer lg:w-auto"
          >
            <option value="">Todas as categorias</option>
            <option value="Ferramentas">🔧 Ferramentas</option>
            <option value="Equipamentos">⚙️ Equipamentos</option>
            <option value="EPI">🦺 EPI</option>
            <option value="Outros">📋 Outros</option>
          </select>

          {/* Botões de Ordenação - Sempre na mesma linha */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ordenar:</span>
            
            <button
              onClick={() => setOrdenacao('nome-asc')}
              className={`group relative h-10 px-3 rounded-xl transition-all duration-200 ${
                ordenacao === 'nome-asc' 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
              title="Ordenar por nome (A-Z)"
            >
              <SortAsc className="w-4 h-4" />
            </button>

            <button
              onClick={() => setOrdenacao('nome-desc')}
              className={`group relative h-10 px-3 rounded-xl transition-all duration-200 ${
                ordenacao === 'nome-desc' 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
              title="Ordenar por nome (Z-A)"
            >
              <SortDesc className="w-4 h-4" />
            </button>

            <button
              onClick={() => setOrdenacao(ordenacao === 'qtd-asc' ? 'qtd-desc' : 'qtd-asc')}
              className={`group relative h-10 px-3 rounded-xl transition-all duration-200 ${
                ordenacao.startsWith('qtd-') 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
              title="Ordenar por quantidade"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      {inventarioOrdenado.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
            <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {filtroInventario || filtroCategoria ? 'Nenhum resultado encontrado' : 'Inventário vazio'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {filtroInventario || filtroCategoria 
              ? 'Tente ajustar os filtros de busca ou limpar os filtros ativos' 
              : 'Comece adicionando o primeiro item ao seu inventário'}
          </p>
          {(filtroInventario || filtroCategoria) && (
            <button
              onClick={() => {
                setFiltroInventario('');
                setFiltroCategoria('');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {inventarioOrdenado.map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onRemover={handleRemoverItem}
              onEditar={() => setItemParaEditar(item)}
              detalhesEmprestimos={obterDetalhesEmprestimos(item.nome)}
              ferramentasDanificadas={ferramentasDanificadas}
              ferramentasPerdidas={ferramentasPerdidas}
            />
          ))}
        </div>
      )}

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

