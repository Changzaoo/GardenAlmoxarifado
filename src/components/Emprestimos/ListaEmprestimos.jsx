import React, { useState } from 'react';
import { Search, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { formatarData } from '../../utils/dateUtils';

const ListaEmprestimos = ({ 
  emprestimos, 
  devolverFerramentas, 
  removerEmprestimo,
  atualizarDisponibilidade 
}) => {
  const [filtroEmprestimos, setFiltroEmprestimos] = useState('');

  const emprestimosFiltrados = Array.isArray(emprestimos)
    ? emprestimos.filter(emp =>
        emp.colaborador.toLowerCase().includes(filtroEmprestimos.toLowerCase()) ||
        emp.ferramentas.some(f => f.toLowerCase().includes(filtroEmprestimos.toLowerCase()))
      )
    : [];

  const handleDevolverFerramentas = (id) => {
    devolverFerramentas(id, atualizarDisponibilidade);
  };

  const handleRemoverEmprestimo = (id) => {
    removerEmprestimo(id, atualizarDisponibilidade);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Histórico de Empréstimos</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou ferramenta..."
            value={filtroEmprestimos}
            onChange={(e) => setFiltroEmprestimos(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2">ID</th>
              <th className="text-left py-3 px-2">Colaborador</th>
              <th className="text-left py-3 px-2">Ferramentas</th>
              <th className="text-left py-3 px-2">Retirada</th>
              <th className="text-left py-3 px-2">Devolução</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {emprestimosFiltrados.sort((a, b) => b.id - a.id).map(emprestimo => (
              <tr key={emprestimo.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-2 font-mono text-sm">#{emprestimo.id}</td>
                <td className="py-3 px-2 font-medium">{emprestimo.colaborador}</td>
                <td className="py-3 px-2">
                  <div className="max-w-xs">
                    {emprestimo.ferramentas.length > 2 ? (
                      <div className="text-sm">
                        <div>{emprestimo.ferramentas.slice(0, 2).join(', ')}</div>
                        <div className="text-gray-500">
                          +{emprestimo.ferramentas.length - 2} outras
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        {emprestimo.ferramentas.join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-sm">
                  <div>{formatarData(emprestimo.dataRetirada)}</div>
                  <div className="text-gray-500">{emprestimo.horaRetirada}</div>
                </td>
                <td className="py-3 px-2 text-sm">
                  {emprestimo.dataDevolucao ? (
                    <div>
                      <div>{formatarData(emprestimo.dataDevolucao)}</div>
                      <div className="text-gray-500">{emprestimo.horaDevolucao}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    emprestimo.status === 'emprestado'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {emprestimo.status === 'emprestado' ? (
                      <><Clock className="w-3 h-3 inline mr-1" />Emprestado</>
                    ) : (
                      <><CheckCircle className="w-3 h-3 inline mr-1" />Devolvido</>
                    )}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-2">
                    {emprestimo.status === 'emprestado' && (
                      <button
                        onClick={() => handleDevolverFerramentas(emprestimo.id)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Marcar como devolvido"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoverEmprestimo(emprestimo.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remover registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListaEmprestimos;