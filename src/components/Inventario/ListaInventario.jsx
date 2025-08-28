import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ItemCard from './ItemCard';
import ExportImportButtons from '../common/ExportImportButtons';
import { useToast } from '../ToastProvider';

const ListaInventario = ({ inventario, emprestimos, removerItem }) => {
  const [filtroInventario, setFiltroInventario] = useState('');
  const { showToast } = useToast();

  const inventarioFiltrado = inventario.filter(item =>
    item.nome.toLowerCase().includes(filtroInventario.toLowerCase()) ||
    item.categoria.toLowerCase().includes(filtroInventario.toLowerCase())
  );

  const handleRemoverItem = (id) => {
    removerItem(id, emprestimos);
  };

  return (
    <div className="bg-[#192734] rounded-2xl shadow-lg p-6 border border-[#38444D]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#8899A6]" />
          <input
            type="text"
            placeholder="Buscar por item ou categoria..."
            value={filtroInventario}
            onChange={(e) => setFiltroInventario(e.target.value)}
            className="pl-10 pr-4 py-2 bg-[#253341] border border-[#38444D] rounded-full text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
          />
        </div>
        <ExportImportButtons
          colecao="inventario"
          onSuccess={(message) => showToast(message, 'success')}
          onError={(message) => showToast(message, 'error')}
        />
        </div>
      </div>

      {/* Resumo por Categoria */}
      <div className="mb-6">
        <h3 className="font-medium text-[#1DA1F2] mb-3">Resumo por Categoria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {['Ferramentas', 'Equipamentos', 'EPI', 'Outros'].map(categoria => {
            const itensCategoria = inventarioFiltrado.filter(item => item.categoria === categoria);
            const totalItens = itensCategoria.reduce((acc, item) => acc + item.quantidade, 0);
            const disponiveis = itensCategoria.reduce((acc, item) => acc + item.disponivel, 0);
            const emUso = totalItens - disponiveis;
            
            return (
              <div key={categoria} className="bg-[#253341] p-4 rounded-2xl border border-[#38444D]">
                <div className="font-medium text-white mb-2">{categoria}</div>
                <div className="text-sm text-[#8899A6] space-y-1">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="text-white">{totalItens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponível:</span>
                    <span className="text-[#00BA7C]">{disponiveis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Em uso:</span>
                    <span className="text-[#1DA1F2]">{emUso}</span>
                  </div>
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