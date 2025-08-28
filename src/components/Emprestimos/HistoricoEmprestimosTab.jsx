import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, Filter, Trash2, AlertTriangle, ToolCase } from 'lucide-react';
import { formatarData, formatarDataHora } from '../../utils/dateUtils';
import { useEmprestimos } from '../../hooks/useEmprestimos';
import DevolucaoTerceirosModal from './DevolucaoTerceirosModal';

const HistoricoEmprestimosTab = ({
  emprestimos,
  devolverFerramentas,
  removerEmprestimo,
  atualizarDisponibilidade
}) => {
  const [filtros, setFiltros] = useState({
    busca: '',
    status: 'todos',
    dataInicio: '',
  });
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);

  // Debug dos dados
  useEffect(() => {
    console.log('Empréstimos carregados:', emprestimos);
  }, [emprestimos]);

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
    if (window.confirm('Tem certeza que deseja remover este empréstimo?')) {
      removerEmprestimo(id);
    }
  };

  const emprestimosFiltrados = React.useMemo(() => {
    if (!emprestimos || !Array.isArray(emprestimos)) return [];
    
    console.log('Iniciando filtragem de empréstimos:', {
      total: emprestimos.length,
      filtros
    });
    return emprestimos.filter(emp => {
        if (!emp) return false;
        
        try {
          // Filtro de busca
          const funcionario = (emp.nomeFuncionario || emp.colaborador || '').toLowerCase();
          const ferramentas = emp.ferramentas || [];
          const filtro = (filtros.busca || '').toLowerCase();
          const observacoes = (emp.observacoes || '').toLowerCase();
          
          // Busca em funcionários, ferramentas e observações
          const matchBusca = !filtro || 
            funcionario.includes(filtro) || 
            observacoes.includes(filtro) ||
            (Array.isArray(ferramentas) && ferramentas.some(f => {
              const nomeFerramenta = typeof f === 'string' ? f : (f?.nome || '');
              return nomeFerramenta.toLowerCase().includes(filtro);
            }));

          // Filtro de status
          const matchStatus = filtros.status === 'todos' || 
            (emp.status || 'emprestado') === filtros.status;

          // Filtro de data
          const matchData = !filtros.dataInicio || (
            emp.dataEmprestimo && new Date(emp.dataEmprestimo) >= new Date(filtros.dataInicio)
          );
        
          return matchBusca && matchStatus && matchData;
        } catch (error) {
          console.error('Erro ao filtrar empréstimo:', error, emp);
          return false;
        }
      })
      .sort((a, b) => {
        // Ordenar por data, mais recente primeiro
        return new Date(b.dataEmprestimo) - new Date(a.dataEmprestimo);
      });
  }, [emprestimos, filtros]);

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFiltros && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  placeholder="Buscar por funcionário ou ferramenta..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="emprestado">Emprestados</option>
                <option value="devolvido">Devolvidos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Empréstimos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Colaborador</th>
                <th className="text-left py-3 px-2">Ferramentas</th>
                <th className="text-left py-3 px-2">Retirada</th>
                <th className="text-left py-3 px-2">Previsão</th>
                <th className="text-left py-3 px-2">Devolução</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {emprestimosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    Nenhum empréstimo encontrado
                  </td>
                </tr>
              ) : (
                emprestimosFiltrados.map(emprestimo => (
                  <tr key={emprestimo.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{emprestimo.nomeFuncionario || emprestimo.colaborador || '-'}</td>
                    <td className="py-3 px-2">
                      <div className="max-w-xs">
                        {(() => {
                          const ferramentas = emprestimo?.ferramentas || [];
                          if (!Array.isArray(ferramentas) || ferramentas.length === 0) {
                            return <div className="text-sm text-gray-500">Sem ferramentas</div>;
                          }

                          return ferramentas.map((ferramenta, idx) => {
                            const nomeFerramenta = typeof ferramenta === 'string' ? ferramenta : ferramenta?.nome;
                            const quantidade = typeof ferramenta === 'string' ? 1 : ferramenta?.quantidade;
                            const codigo = typeof ferramenta === 'string' ? null : ferramenta?.codigo;
                            
                            if (!nomeFerramenta) return null;
                            
                            return (
                              <div key={idx} className="text-sm flex items-center gap-2 mb-1">
                                <span className="font-medium">{nomeFerramenta}</span>
                                {quantidade > 1 && (
                                  <span className="text-gray-500">({quantidade} unidades)</span>
                                )}
                                {codigo && (
                                  <span className="text-xs text-gray-400">#{codigo}</span>
                                )}
                              </div>
                            );
                          });
                        })()}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {emprestimo.dataEmprestimo ? formatarDataHora(emprestimo.dataEmprestimo) : 'Data não registrada'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {emprestimo.dataPrevista ? formatarData(emprestimo.dataPrevista) : '-'}
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
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emprestimo.status === 'emprestado'
                        ? emprestimo.dataPrevista && new Date(emprestimo.dataPrevista) < new Date()
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {emprestimo.status === 'emprestado' ? (
                        emprestimo.dataPrevista && new Date(emprestimo.dataPrevista) < new Date() ? (
                          <><AlertTriangle className="w-3 h-3 inline mr-1" />Atrasado</>
                        ) : (
                          <><Clock className="w-3 h-3 inline mr-1" />Emprestado</>
                        )
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
                ))
              )}
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
    </div>
  );
};

export default HistoricoEmprestimosTab;
