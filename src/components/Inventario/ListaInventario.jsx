import React, { useState } from 'react';
import { Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import ItemCard from './ItemCard';
import { useToast } from '../ToastProvider';
import ModalEditarItem from './ModalEditarItem';

const ListaInventario = ({ inventario, emprestimos, removerItem, atualizarItem, obterDetalhesEmprestimos }) => {
  const [filtroInventario, setFiltroInventario] = useState('');
  const [itemParaEditar, setItemParaEditar] = useState(null);
  const [ordenacao, setOrdenacao] = useState('nome-asc'); // nome-asc, nome-desc, qtd-asc, qtd-desc
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
              className="w-full h-10 pl-10 pr-4 border border-gray-300 dark:border-[#38444D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-[#253341] dark:text-white dark:placeholder-gray-500"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border border-gray-300 dark:border-[#38444D] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-[#253341] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <option value="">Todas as categorias</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Equipamentos">Equipamentos</option>
              <option value="EPI">EPI</option>
              <option value="Outros">Outros</option>
            </select>

            <div className="flex items-center gap-2 border border-gray-300 dark:border-[#38444D] rounded-lg p-1 bg-white dark:bg-[#253341]">
              <button
                onClick={() => setOrdenacao('nome-asc')}
                className={`p-2 rounded-lg transition-colors ${ordenacao === 'nome-asc' ? 'bg-[#1D9BF0] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Ordenar por nome (A-Z)"
              >
                <SortAsc className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOrdenacao('nome-desc')}
                className={`p-2 rounded-lg transition-colors ${ordenacao === 'nome-desc' ? 'bg-[#1D9BF0] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Ordenar por nome (Z-A)"
              >
                <SortDesc className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOrdenacao(ordenacao === 'qtd-asc' ? 'qtd-desc' : 'qtd-asc')}
                className={`p-2 rounded-lg transition-colors ${ordenacao.startsWith('qtd-') ? 'bg-[#1D9BF0] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Ordenar por quantidade"
              >
                <Filter className="w-4 h-4" />
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