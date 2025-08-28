import React, { useState } from 'react';
import { Search, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { formatarData, formatarDataHora } from '../../utils/dateUtils';
import DevolucaoTerceirosModal from './DevolucaoTerceirosModal';

const ListaEmprestimos = ({ 
  emprestimos = [], 
  devolverFerramentas, 
  removerEmprestimo,
  atualizarDisponibilidade 
}) => {
  const [filtroEmprestimos, setFiltroEmprestimos] = useState('');
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState(null);

  const emprestimosFiltrados = (emprestimos || [])
    .filter(emp => {
      if (!emp) return false;
      const funcionario = (emp.nomeFuncionario || emp.colaborador || '').toLowerCase();
      const ferramentas = emp.nomeFerramentas || [];
      const filtro = filtroEmprestimos.toLowerCase();
      
      return funcionario.includes(filtro) ||
             ferramentas.some(f => f.toLowerCase().includes(filtro));
    })
    .sort((a, b) => {
      // Ordena por data/hora de empréstimo mais recente
      const dataA = a?.dataEmprestimo ? new Date(a.dataEmprestimo) : new Date();
      const dataB = b?.dataEmprestimo ? new Date(b.dataEmprestimo) : new Date();
      return dataB - dataA;
    });

  const handleDevolverFerramentas = (id) => {
    setSelectedEmprestimo(id);
    setShowDevolucaoModal(true);
  };

  const handleConfirmDevolucao = (devolvidoPorTerceiros) => {
    devolverFerramentas(selectedEmprestimo, atualizarDisponibilidade, devolvidoPorTerceiros);
    setSelectedEmprestimo(null);
    setShowDevolucaoModal(false);
  };

  const handleRemoverEmprestimo = (id) => {
    removerEmprestimo(id, atualizarDisponibilidade);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
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
              <th className="text-left py-3 px-2">Colaborador</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Ações</th>
              <th className="text-left py-3 px-2">Ferramentas</th>
              <th className="text-left py-3 px-2">Retirada</th>
              <th className="text-left py-3 px-2">Devolução</th>
            </tr>
          </thead>
          <tbody>
            {emprestimosFiltrados.map(emprestimo => (
              <tr key={emprestimo.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <td className="py-3 px-2 font-medium">{emprestimo.nomeFuncionario || emprestimo.colaborador || '-'}</td>
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
                <td className="py-3 px-2 text-sm">
                  <div className="max-w-xs">
                    {Array.isArray(emprestimo?.ferramentas) ? (
                      emprestimo.ferramentas.map((ferramenta, idx) => (
                        <div key={idx} className="text-sm flex items-center gap-2 mb-1">
                          <span className="font-medium">{ferramenta.nome}</span>
                          {ferramenta.quantidade > 1 && (
                            <span className="text-gray-500">({ferramenta.quantidade} unidades)</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">Sem ferramentas</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-sm">
                  {formatarDataHora(emprestimo.dataEmprestimo)}
                </td>
                <td className="py-3 px-2 text-sm">
                  {emprestimo.dataDevolucao ? (
                    <div>
                      <div>{formatarDataHora(emprestimo.dataDevolucao)}</div>
                      {emprestimo.devolvidoPorTerceiros && (
                        <div className="text-xs text-orange-600 mt-1">
                          Devolvido por terceiros
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDevolucaoModal && (
        <DevolucaoTerceirosModal
          onClose={() => {
            setShowDevolucaoModal(false);
            setSelectedEmprestimo(null);
          }}
          onConfirm={handleConfirmDevolucao}
        />
      )}
    </div>
  );
};

export default ListaEmprestimos;