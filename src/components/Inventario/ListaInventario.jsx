import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ItemCard from './ItemCard';

const ListaInventario = ({ inventario, emprestimos, removerItem }) => {
  const [filtroInventario, setFiltroInventario] = useState('');

  const inventarioFiltrado = inventario.filter(item =>
    item.nome.toLowerCase().includes(filtroInventario.toLowerCase()) ||
    item.categoria.toLowerCase().includes(filtroInventario.toLowerCase())
  );

  const handleRemoverItem = (id) => {
    removerItem(id, emprestimos);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Inventário Completo</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por item ou categoria..."
            value={filtroInventario}
            onChange={(e) => setFiltroInventario(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Resumo por Categoria */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Resumo por Categoria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {['Ferramentas', 'Equipamentos', 'EPI', 'Outros'].map(categoria => {
            const itensCategoria = inventarioFiltrado.filter(item => item.categoria === categoria);
            const totalItens = itensCategoria.reduce((acc, item) => acc + item.quantidade, 0);
            const disponiveis = itensCategoria.reduce((acc, item) => acc + item.disponivel, 0);
            const emUso = totalItens - disponiveis;
            
            return (
              <div key={categoria} className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800">{categoria}</div>
                <div className="text-sm text-gray-600">
                  <div>Total: {totalItens}</div>
                  <div>Disponível: {disponiveis}</div>
                  <div>Em uso: {emUso}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {inventarioFiltrado
          .sort((a, b) => {
            // Busca o último empréstimo de cada item
            const ultimoEmprestimoA = emprestimos
              .filter(e => e.ferramentas.includes(a.nome))
              .sort((e1, e2) => new Date(e2.dataRetirada) - new Date(e1.dataRetirada))[0];
            const ultimoEmprestimoB = emprestimos
              .filter(e => e.ferramentas.includes(b.nome))
              .sort((e1, e2) => new Date(e2.dataRetirada) - new Date(e1.dataRetirada))[0];
            const dataA = ultimoEmprestimoA ? new Date(ultimoEmprestimoA.dataRetirada) : new Date(0);
            const dataB = ultimoEmprestimoB ? new Date(ultimoEmprestimoB.dataRetirada) : new Date(0);
            // Ordena por empréstimo mais recente
            if (dataA > dataB) return -1;
            if (dataA < dataB) return 1;
            // Se igual, ordena por categoria e nome
            return a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome);
          })
          .map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onRemover={handleRemoverItem}
            />
          ))}
      </div>
    </div>
  );
};

export default ListaInventario;