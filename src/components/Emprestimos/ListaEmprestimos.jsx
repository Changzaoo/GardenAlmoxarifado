import React, { useState } from 'react';
import { Search, CheckCircle, Clock, Trash2, CircleDotDashed } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatarDataHora } from '../../utils/formatters';
import DevolucaoTerceirosModal from './DevolucaoTerceirosModal';
import DevolucaoParcialModal from './DevolucaoParcialModal';

const ListaEmprestimos = ({ 
  emprestimos = [], 
  devolverFerramentas = () => {},
  removerEmprestimo = () => {},
  atualizarDisponibilidade = () => true
}) => {
  const [filtroEmprestimos, setFiltroEmprestimos] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoje');
  const [filtroStatus, setFiltroStatus] = useState('emprestado');
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [showDevolucaoParcialModal, setShowDevolucaoParcialModal] = useState(false);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState(null);
  const [emprestimoParaDevolucaoParcial, setEmprestimoParaDevolucaoParcial] = useState(null);
  const [showConfirmacaoExclusao, setShowConfirmacaoExclusao] = useState(false);
  const [emprestimoParaExcluir, setEmprestimoParaExcluir] = useState(null);
  const [expandedEmployees, setExpandedEmployees] = useState(new Set());
  const { usuario } = useAuth();
  
  const temPermissaoEdicao = usuario && usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR;

  const toggleEmployee = (employee) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employee)) {
      newExpanded.delete(employee);
    } else {
      newExpanded.add(employee);
    }
    setExpandedEmployees(newExpanded);
  };

  const isWithinPeriod = (date, period) => {
    if (!date) return false;
    const today = new Date();
    const empDate = new Date(date);
    
    switch (period) {
      case 'hoje':
        return empDate.getDate() === today.getDate() &&
               empDate.getMonth() === today.getMonth() &&
               empDate.getFullYear() === today.getFullYear();
      case 'semana':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return empDate >= weekAgo;
      case 'mes':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return empDate >= monthAgo;
      default:
        return true;
    }
  };

  const emprestimosFiltrados = emprestimos
    .filter(emp => {
      if (!emp || !emp.dataEmprestimo) return false;
      
      if (!isWithinPeriod(emp.dataEmprestimo, filtroPeriodo)) return false;

      if (filtroStatus !== 'todos' && emp.status !== filtroStatus) return false;

      const funcionario = (emp.nomeFuncionario || emp.colaborador || '').toLowerCase();
      const ferramentas = emp.nomeFerramentas || [];
      const filtro = filtroEmprestimos.toLowerCase();
      
      return funcionario.includes(filtro) ||
             ferramentas.some(f => f.toLowerCase().includes(filtro));
    })
    .sort((a, b) => {
      const dataA = a?.dataEmprestimo ? new Date(a.dataEmprestimo) : new Date();
      const dataB = b?.dataEmprestimo ? new Date(b.dataEmprestimo) : new Date();
      return dataB - dataA;
    });

  const emprestimosPorFuncionario = emprestimosFiltrados.reduce((acc, emp) => {
    const funcionario = emp.nomeFuncionario || emp.colaborador || 'Sem nome';
    if (!acc[funcionario]) {
      acc[funcionario] = [];
    }
    acc[funcionario].push(emp);
    return acc;
  }, {});

  const handleDevolverFerramentas = (id) => {
    const emprestimo = emprestimos.find(e => e.id === id);
    if (!emprestimo) return;

    if (emprestimo.ferramentas?.length > 1) {
      setEmprestimoParaDevolucaoParcial(emprestimo);
      setShowDevolucaoParcialModal(true);
    } else {
      setSelectedEmprestimo(id);
      setShowDevolucaoModal(true);
    }
  };

  const handleDevolverFerramentasParcial = (emprestimo, ferramentasSelecionadas, devolvidoPorTerceiros) => {
    if (!emprestimo || !ferramentasSelecionadas.length) return;

    const ferramentasNaoDevolvidas = emprestimo.ferramentas.filter(
      f => !ferramentasSelecionadas.find(fs => fs.id === f.id)
    );

    if (ferramentasNaoDevolvidas.length === 0) {
      devolverFerramentas(emprestimo.id, atualizarDisponibilidade, devolvidoPorTerceiros);
    } else {
      const atualizacao = {
        ferramentas: ferramentasNaoDevolvidas,
        ferramentasParcialmenteDevolvidas: [
          ...(emprestimo.ferramentasParcialmenteDevolvidas || []),
          {
            ferramentas: ferramentasSelecionadas,
            dataDevolucao: new Date().toISOString(),
            devolvidoPorTerceiros
          }
        ]
      };
      
      if (typeof devolverFerramentas === 'function') {
        devolverFerramentas(emprestimo.id, atualizarDisponibilidade, devolvidoPorTerceiros, atualizacao);
      }
    }
    setShowDevolucaoParcialModal(false);
    setEmprestimoParaDevolucaoParcial(null);
  };

  const handleConfirmDevolucao = async (devolvidoPorTerceiros) => {
    try {
      if (typeof devolverFerramentas === 'function') {
        await devolverFerramentas(selectedEmprestimo, atualizarDisponibilidade, devolvidoPorTerceiros);
        setSelectedEmprestimo(null);
        setShowDevolucaoModal(false);
      }
    } catch (error) {
      console.error('Erro ao devolver ferramentas:', error);
    }
  };

  const handleRemoverEmprestimo = (emprestimo) => {
    setEmprestimoParaExcluir(emprestimo);
    setShowConfirmacaoExclusao(true);
  };

  const confirmarExclusao = () => {
    if (emprestimoParaExcluir) {
      removerEmprestimo(emprestimoParaExcluir.id, atualizarDisponibilidade);
    }
    setShowConfirmacaoExclusao(false);
    setEmprestimoParaExcluir(null);
  };

  const cancelarExclusao = () => {
    setShowConfirmacaoExclusao(false);
    setEmprestimoParaExcluir(null);
  };

  const temFerramentasEmprestadas = (emprestimo) => {
    return emprestimo.ferramentas && emprestimo.ferramentas.length > 0;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar colaborador/ferramenta..."
              value={filtroEmprestimos}
              onChange={(e) => setFiltroEmprestimos(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-sm border border-gray-300 dark:border-[#38444D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-[#253341] dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-300 dark:border-[#38444D] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-[#253341] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <option value="todos">Todos os status</option>
            <option value="emprestado">Não devolvidos</option>
            <option value="devolvido">Devolvidos</option>
          </select>
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="border border-gray-300 dark:border-[#38444D] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-[#253341] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Última semana</option>
            <option value="mes">Último mês</option>
            <option value="todos">Todo o período</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(emprestimosPorFuncionario).map(([funcionario, emprestimos]) => (
          <div 
            key={funcionario} 
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 ${
              expandedEmployees.has(funcionario) ? 'ring-2 ring-gray-300 dark:ring-gray-600' : ''
            }`}
            onClick={() => toggleEmployee(funcionario)}
          >
            <div className="cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {funcionario}
                </h3>
                <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  {expandedEmployees.has(funcionario) ? '▼' : '▶'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-md">
                    {emprestimos.length} empréstimo{emprestimos.length !== 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100 text-xs font-medium px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3" />
                    {emprestimos.filter(e => e.status === 'emprestado').length} ativos
                  </span>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100 text-xs font-medium px-2 py-0.5 rounded-md">
                    <CheckCircle className="w-3 h-3" />
                    {emprestimos.filter(e => e.status === 'devolvido').length} concluídos
                  </span>
                </div>
              </div>
            </div>
            
            {expandedEmployees.has(funcionario) && (
              <div className="bg-gray-50 dark:bg-gray-700/50 divide-y divide-gray-200 dark:divide-gray-600">
                <div className="max-h-[32rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div className="space-y-3 p-4 divide-y divide-gray-100 dark:divide-gray-600">
                    {emprestimos.map(emprestimo => (
                      <div key={emprestimo.id} className="bg-white dark:bg-gray-700/50 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 pt-4">
                        <div className="px-4 pb-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                emprestimo.status === 'emprestado'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              }`}>
                                {emprestimo.status === 'emprestado' ? (
                                  <><Clock className="w-3 h-3 inline mr-1" />Emprestado</>
                                ) : (
                                  <><CheckCircle className="w-3 h-3 inline mr-1" />Devolvido</>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatarDataHora(emprestimo.dataEmprestimo)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {emprestimo.status === 'emprestado' && temFerramentasEmprestadas(emprestimo) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDevolverFerramentas(emprestimo.id);
                                  }}
                                  className="text-green-600 hover:text-green-800 p-1.5 transition-colors duration-200 rounded-full hover:bg-green-100 dark:hover:bg-green-900"
                                  title="Marcar como devolvido"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              )}
                              {temPermissaoEdicao && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoverEmprestimo(emprestimo);
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1.5 transition-colors duration-200 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                                  title="Remover registro"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ferramentas:</h4>
                            <div className="space-y-1">
                              {Array.isArray(emprestimo?.ferramentas) ? (
                                emprestimo.ferramentas.map((ferramenta, idx) => {
                                  const ferramentaDevolvida = emprestimo.ferramentasParcialmenteDevolvidas?.some(
                                    devolucao => devolucao.ferramentas.some(f => f.id === ferramenta.id)
                                  );
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`flex items-center gap-2 text-sm ${
                                        ferramentaDevolvida ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
                                      }`}
                                    >
                                      <CircleDotDashed className={`w-3 h-3 ${ferramentaDevolvida ? 'text-gray-400' : ''}`} />
                                      <span className={ferramentaDevolvida ? 'line-through' : ''}>
                                        {ferramenta.nome}
                                        {ferramenta.quantidade > 1 && (
                                          <span className="text-gray-500 dark:text-gray-400 ml-1">({ferramenta.quantidade} unidades)</span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-sm text-gray-500">Sem ferramentas</div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                              <span>Devolução:</span>
                              <span>
                                {emprestimo.dataDevolucao ? (
                                  <div className="text-right">
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
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showDevolucaoModal && (
        <DevolucaoTerceirosModal 
          isOpen={showDevolucaoModal}
          onClose={() => setShowDevolucaoModal(false)}
          onConfirm={handleConfirmDevolucao}
        />
      )}

      {showDevolucaoParcialModal && emprestimoParaDevolucaoParcial && (
        <DevolucaoParcialModal
          isOpen={showDevolucaoParcialModal}
          onClose={() => {
            setShowDevolucaoParcialModal(false);
            setEmprestimoParaDevolucaoParcial(null);
          }}
          onConfirm={handleDevolverFerramentasParcial}
          emprestimo={emprestimoParaDevolucaoParcial}
        />
      )}

      {showConfirmacaoExclusao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirmar exclusão</h2>
            <p className="mb-6">Tem certeza que deseja remover este registro de empréstimo?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelarExclusao}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaEmprestimos;
