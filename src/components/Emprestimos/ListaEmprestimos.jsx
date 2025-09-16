import React, { useState } from 'react';
import { Search, CheckCircle, Clock, Trash2, CircleDotDashed, Pencil, ArrowRightLeft, Edit } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import { doc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatarDataHora } from '../../utils/formatters';
import DevolucaoTerceirosModal from './DevolucaoTerceirosModal';
import DevolucaoParcialModal from './DevolucaoParcialModal';
import TransferenciaFerramentasModal from './TransferenciaFerramentasModal';
import EditarEmprestimoModal from './EditarEmprestimoModal';

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
  const [editingObservacao, setEditingObservacao] = useState(null);
  const [observacoesTemp, setObservacoesTemp] = useState({});
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false);
  const [emprestimoParaTransferencia, setEmprestimoParaTransferencia] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [emprestimoParaEditar, setEmprestimoParaEditar] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const { usuario } = useAuth();
  
  const temPermissaoEdicao = usuario && usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR;

  // Carrega a lista de funcionários quando necessário
  const carregarFuncionarios = async () => {
    try {
      const funcionariosRef = collection(db, 'funcionarios');
      const snapshot = await getDocs(funcionariosRef);
      const funcionariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

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
    setSelectedEmprestimo(emprestimo);
    setShowDevolucaoModal(true);
  };

  const handleDevolverFerramentasParcial = (emprestimo, ferramentasSelecionadas, devolvidoPorTerceiros) => {
    if (!emprestimo || !ferramentasSelecionadas.length) return;

    const ferramentasNaoDevolvidas = emprestimo.ferramentas.filter(
      f => !ferramentasSelecionadas.find(fs => fs.id === f.id)
    );

    // Se todas as ferramentas foram selecionadas, marca como totalmente devolvido
    if (ferramentasNaoDevolvidas.length === 0) {
      devolverFerramentas(emprestimo.id, atualizarDisponibilidade, devolvidoPorTerceiros);
    } else {
      // Se ainda há ferramentas não devolvidas, atualiza o registro mantendo apenas elas
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
      if (!selectedEmprestimo) {
        console.error('Nenhum empréstimo selecionado');
        return;
      }

      if (typeof devolverFerramentas !== 'function') {
        console.error('devolverFerramentas não é uma função');
        return;
      }

      // Realiza a devolução total do empréstimo
      console.log('Realizando devolução do empréstimo', selectedEmprestimo.id);
      await devolverFerramentas(selectedEmprestimo.id, atualizarDisponibilidade, devolvidoPorTerceiros);

      setSelectedEmprestimo(null);
      setShowDevolucaoModal(false);
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

  const handleEditarEmprestimo = (emprestimo) => {
    setEmprestimoParaEditar(emprestimo);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (emprestimoEditado) => {
    try {
      // Atualiza o empréstimo no Firestore
      const emprestimoRef = doc(db, 'emprestimos', emprestimoEditado.id);
      await updateDoc(emprestimoRef, {
        ferramentas: emprestimoEditado.ferramentas,
        dataAtualizacao: new Date()
      });

      // Atualiza a disponibilidade das ferramentas se necessário
      await atualizarDisponibilidade();

      // Fecha o modal
      setShowEditModal(false);
      setEmprestimoParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar edições do empréstimo:', error);
      alert('Erro ao salvar as alterações. Por favor, tente novamente.');
    }
  };

  const handleTransferirFerramentas = (emprestimo) => {
    console.log('Abrindo modal de transferência:', { emprestimo });
    setEmprestimoParaTransferencia(emprestimo);
    carregarFuncionarios();
    setShowTransferenciaModal(true);
  };

  const handleConfirmTransferencia = async ({ ferramentas, funcionarioDestino, observacao }) => {
    try {
      if (!emprestimoParaTransferencia || !funcionarioDestino || !ferramentas.length) {
        console.error('Dados inválidos para transferência');
        return;
      }

      // Remove as ferramentas selecionadas do empréstimo atual
      const ferramentasRestantes = emprestimoParaTransferencia.ferramentas.filter(
        f => !ferramentas.find(fs => fs.id === f.id)
      );

      // Atualiza o empréstimo original
      const emprestimoRef = doc(db, 'emprestimos', emprestimoParaTransferencia.id);
      await updateDoc(emprestimoRef, {
        ferramentas: ferramentasRestantes,
        ferramentasTransferidas: arrayUnion({
          ferramentas,
          funcionarioDestino,
          dataTransferencia: new Date().toISOString(),
          observacao
        })
      });

      // Cria um novo empréstimo para o funcionário destino
      const novoEmprestimo = {
        funcionarioId: funcionarioDestino,
        ferramentas,
        dataEmprestimo: new Date().toISOString(),
        status: 'emprestado',
        observacao: `Transferido de ${emprestimoParaTransferencia.nomeFuncionario}. ${observacao ? `Observação: ${observacao}` : ''}`,
        emprestimoOriginalId: emprestimoParaTransferencia.id
      };

      // TODO: Implementar criação do novo empréstimo usando a função apropriada do seu sistema
      // await criarEmprestimo(novoEmprestimo);

      setShowTransferenciaModal(false);
      setEmprestimoParaTransferencia(null);
    } catch (error) {
      console.error('Erro ao transferir ferramentas:', error);
    }
  };

  const temFerramentasEmprestadas = (emprestimo) => {
    return emprestimo.ferramentas && emprestimo.ferramentas.length > 0;
  };

  const handleStartEditObservacao = (emprestimo, e) => {
    e.stopPropagation();
    setEditingObservacao(emprestimo.id);
    setObservacoesTemp(prev => ({
      ...prev,
      [emprestimo.id]: emprestimo.observacao || ''
    }));
  };

  const handleObservacaoChange = (emprestimoId, value) => {
    setObservacoesTemp(prev => ({
      ...prev,
      [emprestimoId]: value
    }));
  };

  const handleSaveObservacao = async (emprestimo, e) => {
    e?.stopPropagation();
    if (!emprestimo || !temPermissaoEdicao) return;

    try {
      const novaObservacao = observacoesTemp[emprestimo.id];
      if (novaObservacao === emprestimo.observacao) {
        setEditingObservacao(null);
        return;
      }

      const emprestimoRef = doc(db, 'emprestimos', emprestimo.id);
      await updateDoc(emprestimoRef, {
        observacao: novaObservacao,
        ultimaAtualizacao: new Date().toISOString(),
        usuarioUltimaAtualizacao: usuario.email
      });

      setEditingObservacao(null);
    } catch (error) {
      console.error('Erro ao atualizar observação:', error);
    }
  };

  const handleCancelEdit = (emprestimoId, e) => {
    e.stopPropagation();
    setEditingObservacao(null);
    setObservacoesTemp(prev => {
      const newTemp = { ...prev };
      delete newTemp[emprestimoId];
      return newTemp;
    });
  };

  const handleKeyDown = (emprestimo, e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveObservacao(emprestimo, e);
    } else if (e.key === 'Escape') {
      handleCancelEdit(emprestimo.id, e);
    }
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
                            <div className="flex flex-col">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start ${
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
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatarDataHora(emprestimo.dataEmprestimo)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex gap-2">
                                {emprestimo.status === 'emprestado' && temFerramentasEmprestadas(emprestimo) && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditarEmprestimo(emprestimo);
                                      }}
                                      className="text-yellow-600 hover:text-yellow-800 p-1.5 transition-colors duration-200 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900"
                                      title="Editar empréstimo"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTransferirFerramentas(emprestimo);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 p-1.5 transition-colors duration-200 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                                      title="Transferir ferramentas"
                                    >
                                      <ArrowRightLeft className="w-4 h-4" />
                                    </button>
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
                                  </>
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
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
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

                            <div className="mt-2">
                              <div className="text-gray-600 dark:text-gray-300">
                                <span>Observações:</span>
                              </div>
                              {editingObservacao === emprestimo.id ? (
                                <div className="mt-1">
                                  <textarea
                                    value={observacoesTemp[emprestimo.id] || ''}
                                    onChange={(e) => handleObservacaoChange(emprestimo.id, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(emprestimo, e)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-y min-h-[60px]"
                                    placeholder="Digite suas observações aqui..."
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-2 mt-1">
                                    <button
                                      onClick={(e) => handleCancelEdit(emprestimo.id, e)}
                                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={(e) => handleSaveObservacao(emprestimo, e)}
                                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className={`mt-1 relative group ${temPermissaoEdicao ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded p-1 -m-1' : ''}`}
                                  onClick={(e) => {
                                    if (temPermissaoEdicao) {
                                      handleStartEditObservacao(emprestimo, e);
                                    }
                                  }}
                                >
                                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words min-h-[20px]">
                                    {emprestimo.observacao || <span className="text-gray-400">Clique para adicionar uma observação</span>}
                                  </p>
                                  {emprestimo.ultimaAtualizacao && (
                                    <div className="mt-1 text-xs text-gray-400">
                                      Última atualização: {formatarDataHora(emprestimo.ultimaAtualizacao)}
                                      {emprestimo.usuarioUltimaAtualizacao && (
                                        <span className="ml-1">por {emprestimo.usuarioUltimaAtualizacao}</span>
                                      )}
                                    </div>
                                  )}
                                  {temPermissaoEdicao && (
                                    <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              )}
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

      {showDevolucaoModal && selectedEmprestimo && (
        <DevolucaoTerceirosModal 
          emprestimo={selectedEmprestimo}
          onClose={() => {
            setShowDevolucaoModal(false);
            setSelectedEmprestimo(null);
          }}
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

      {showTransferenciaModal && emprestimoParaTransferencia && (
        <TransferenciaFerramentasModal 
          emprestimo={emprestimoParaTransferencia}
          funcionarios={funcionarios}
          onClose={() => {
            setShowTransferenciaModal(false);
            setEmprestimoParaTransferencia(null);
          }}
          onConfirm={handleConfirmTransferencia}
        />
      )}

      {showEditModal && emprestimoParaEditar && (
        <EditarEmprestimoModal
          emprestimo={emprestimoParaEditar}
          onClose={() => {
            setShowEditModal(false);
            setEmprestimoParaEditar(null);
          }}
          onSave={handleSaveEdit}
        />
      )}

    </div>
  );
};

export default ListaEmprestimos;