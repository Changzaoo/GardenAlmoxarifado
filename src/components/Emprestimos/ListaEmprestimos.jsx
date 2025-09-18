import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, Trash2, CircleDotDashed, Pencil, ArrowRightLeft, Edit, Package2, CircleUser } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import { doc, updateDoc, collection, getDocs, addDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatarDataHora } from '../../utils/formatters';
import DevolucaoTerceirosModal from './DevolucaoTerceirosModal';
import TransferenciaFerramentasModal from './TransferenciaFerramentasModal';
import EditarEmprestimoModal from './EditarEmprestimoModal';

// Enum for sorting options
const SORT_OPTIONS = {
  MOST_LOANS: 'MOST_LOANS',
  MOST_ACTIVE: 'MOST_ACTIVE',
  MOST_COMPLETED: 'MOST_COMPLETED',
  ALPHABETICAL: 'ALPHABETICAL'
};

const SORT_LABELS = {
  [SORT_OPTIONS.MOST_LOANS]: 'Mais Empréstimos',
  [SORT_OPTIONS.MOST_ACTIVE]: 'Mais Ativos',
  [SORT_OPTIONS.MOST_COMPLETED]: 'Mais Concluídos',
  [SORT_OPTIONS.ALPHABETICAL]: 'Ordem Alfabética'
};

const ListaEmprestimos = ({ 
  emprestimos = [], 
  devolverFerramentas = () => {},
  removerEmprestimo = () => {},
  atualizarDisponibilidade = () => true
}) => {
  const [filtroEmprestimos, setFiltroEmprestimos] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoje');
  const [filtroStatus, setFiltroStatus] = useState('emprestado');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.ALPHABETICAL);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const filtrarEmprestimo = (emp) => {
    if (!emp || !emp.dataEmprestimo) return false;

    // Filtra por período
    if (!isWithinPeriod(emp.dataEmprestimo, filtroPeriodo)) return false;

    // Filtra por status
    if (filtroStatus !== 'todos' && emp.status !== filtroStatus) return false;

    // Filtra por texto
    if (filtroEmprestimos) {
      const searchTerm = filtroEmprestimos.toLowerCase();
      const funcionario = (emp.nomeFuncionario || emp.colaborador || '').toLowerCase();
      const ferramentas = emp.nomeFerramentas || [];

      return funcionario.includes(searchTerm) ||
             ferramentas.some(f => f.toLowerCase().includes(searchTerm));
    }

    return true;
  };
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState(null);
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

  // Função para ordenar os empréstimos
  const sortEmprestimos = (emprestimos) => {
    const clone = [...emprestimos];
    
    switch (sortBy) {
      case SORT_OPTIONS.MOST_LOANS:
        return clone.sort((a, b) => b.ferramentas.length - a.ferramentas.length);
      
      case SORT_OPTIONS.MOST_ACTIVE:
        return clone.sort((a, b) => {
          const aActive = a.status === 'emprestado' ? 1 : 0;
          const bActive = b.status === 'emprestado' ? 1 : 0;
          return bActive - aActive;
        });
      
      case SORT_OPTIONS.MOST_COMPLETED:
        return clone.sort((a, b) => {
          const aCompleted = a.status === 'devolvido' ? 1 : 0;
          const bCompleted = b.status === 'devolvido' ? 1 : 0;
          return bCompleted - aCompleted;
        });
      
      case SORT_OPTIONS.ALPHABETICAL:
        return clone.sort((a, b) => {
          const nameA = (a.nomeFuncionario || a.colaborador || '').toLowerCase();
          const nameB = (b.nomeFuncionario || b.colaborador || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      default:
        return clone;
    }
  };

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
    .filter(filtrarEmprestimo)
    .sort((a, b) => {
      const dataA = a?.dataEmprestimo ? new Date(a.dataEmprestimo) : new Date();
      const dataB = b?.dataEmprestimo ? new Date(b.dataEmprestimo) : new Date();
      return dataB - dataA;
    });

  // Agrupa empréstimos por funcionário
  const emprestimosPorFuncionario = emprestimosFiltrados.reduce((acc, emp) => {
    const funcionario = emp.nomeFuncionario || emp.colaborador || 'Sem nome';
    if (!acc[funcionario]) {
      acc[funcionario] = {
        emprestimos: [],
        totalEmprestimos: 0,
        emprestimosAtivos: 0,
        emprestimosDevolvidos: 0
      };
    }
    acc[funcionario].emprestimos.push(emp);
    acc[funcionario].totalEmprestimos += emp.ferramentas.length;
    acc[funcionario].emprestimosAtivos += emp.status === 'emprestado' ? 1 : 0;
    acc[funcionario].emprestimosDevolvidos += emp.status === 'devolvido' ? 1 : 0;
    return acc;
  }, {});

  // Ordena os funcionários com base no critério selecionado
  const funcionariosOrdenados = Object.entries(emprestimosPorFuncionario)
    .sort(([funcA, dataA], [funcB, dataB]) => {
      switch (sortBy) {
        case SORT_OPTIONS.MOST_LOANS:
          return dataB.totalEmprestimos - dataA.totalEmprestimos;
        case SORT_OPTIONS.MOST_ACTIVE:
          return dataB.emprestimosAtivos - dataA.emprestimosAtivos;
        case SORT_OPTIONS.MOST_COMPLETED:
          return dataB.emprestimosDevolvidos - dataA.emprestimosDevolvidos;
        case SORT_OPTIONS.ALPHABETICAL:
          return funcA.localeCompare(funcB);
        default:
          return 0;
      }
    })
    .reduce((acc, [funcionario, data]) => {
      acc[funcionario] = data.emprestimos;
      return acc;
    }, {});

  const handleDevolverFerramentas = (id) => {
    if (!id || !Array.isArray(emprestimos)) {
      console.error('ID inválido ou empréstimos não é um array:', { id, emprestimos });
      return;
    }
    
    const emprestimo = emprestimos.find(e => e.id === id);
    if (!emprestimo) {
      console.error('Empréstimo não encontrado com o ID:', id);
      return;
    }

    if (!Array.isArray(emprestimo.ferramentas)) {
      console.error('Empréstimo sem array de ferramentas válido:', emprestimo);
      return;
    }

    // Faz uma cópia profunda do empréstimo para evitar problemas de referência
    const emprestimoParaDevolver = JSON.parse(JSON.stringify(emprestimo));
    
    if (emprestimoParaDevolver.ferramentas.length === 0) {
      console.error('Empréstimo sem ferramentas para devolver:', emprestimoParaDevolver);
      return;
    }

    console.log('Abrindo modal de devolução para empréstimo:', emprestimoParaDevolver);
    setSelectedEmprestimo(emprestimoParaDevolver);
    setShowDevolucaoModal(true);
  };

  const handleDevolverFerramentasParcial = async (emprestimo, ferramentaSelecionada, devolvidoPorTerceiros) => {
    if (!emprestimo || !ferramentaSelecionada || !ferramentaSelecionada.length) return;

    try {
      const emprestimoRef = doc(db, 'emprestimos', emprestimo.id);
      const dataDevolucao = new Date().toISOString();
      
      // Remove a ferramenta devolvida do empréstimo original
      const ferramentasNaoDevolvidas = emprestimo.ferramentas.filter(
        f => f.id !== ferramentaSelecionada[0].id
      );

      // Cria um novo documento na coleção de empréstimos parcialmente devolvidos
      const devolucaoParcialRef = collection(db, 'emprestimos_parciais');
      await addDoc(devolucaoParcialRef, {
        emprestimoOriginalId: emprestimo.id,
        funcionarioId: emprestimo.funcionarioId,
        nomeFuncionario: emprestimo.nomeFuncionario,
        ferramenta: ferramentaSelecionada[0],
        dataDevolucao,
        devolvidoPorTerceiros,
        dataEmprestimo: emprestimo.dataEmprestimo
      });

      // Se não há mais ferramentas, marca o empréstimo como totalmente devolvido
      if (ferramentasNaoDevolvidas.length === 0) {
        await updateDoc(emprestimoRef, {
          ferramentas: [],
          status: 'devolvido',
          dataDevolucao,
          devolvidoPorTerceiros,
          historicoFerramentas: arrayUnion(...emprestimo.ferramentas.map(f => ({
            ...f,
            dataDevolucao,
            devolvidoPorTerceiros
          })))
        });
      } else {
        // Atualiza o empréstimo original removendo apenas a ferramenta devolvida
        await updateDoc(emprestimoRef, {
          ferramentas: ferramentasNaoDevolvidas,
          historicoFerramentas: arrayUnion({
            ...ferramentaSelecionada[0],
            dataDevolucao,
            devolvidoPorTerceiros
          })
        });
      }
      
      // Atualiza a disponibilidade das ferramentas
      await atualizarDisponibilidade();


    } catch (error) {
      console.error('Erro ao devolver ferramentas:', error);
      alert('Erro ao devolver ferramentas. Por favor, tente novamente.');
    }
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
      console.log('Realizando devolução do empréstimo:', {
        id: selectedEmprestimo.id,
        devolvidoPorTerceiros
      });
      
      await devolverFerramentas(
        selectedEmprestimo.id,
        atualizarDisponibilidade,
        devolvidoPorTerceiros
      );

      // Limpa os estados após a devolução bem-sucedida
      setSelectedEmprestimo(null);
      setShowDevolucaoModal(false);
    } catch (error) {
      console.error('Erro ao devolver ferramentas:', error);
      alert('Erro ao devolver as ferramentas. Por favor, tente novamente.');
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

      // Remove a ferramenta selecionada do empréstimo atual
      const ferramentasRestantes = emprestimoParaTransferencia.ferramentas.filter(
        f => f.id !== ferramentas[0].id
      );

      // Atualiza o empréstimo original
      const emprestimoRef = doc(db, 'emprestimos', emprestimoParaTransferencia.id);
      await updateDoc(emprestimoRef, {
        ferramentas: ferramentasRestantes,
        ferramentasTransferidas: arrayUnion({
          ferramentas: [ferramentas[0]], // Agora transferimos apenas uma ferramenta
          funcionarioDestino,
          dataTransferencia: new Date().toISOString(),
          observacao
        })
      });

      // Cria um novo empréstimo para o funcionário destino
      const novoEmprestimo = {
        funcionarioId: funcionarioDestino,
        ferramentas: [ferramentas[0]], // Agora transferimos apenas uma ferramenta
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
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="     Buscar..."
              value={filtroEmprestimos}
              onChange={(e) => setFiltroEmprestimos(e.target.value)}
              className="h-[36px] w-full px-4 pl-8 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-[#38444D] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-[36px] w-48 inline-flex items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-[#38444D] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
          >
            <option value="todos">Todos</option>
            <option value="emprestado">Não devolvidos</option>
            <option value="devolvido">Devolvidos</option>
          </select>
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="h-[36px] w-44 inline-flex items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-[#38444D] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Última semana</option>
            <option value="mes">Último mês</option>
            <option value="todos">Todo período</option>
          </select>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="h-[36px] inline-flex items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-[#38444D] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
            >
              <span>Ordenar por: {SORT_LABELS[sortBy]}</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSortDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    {Object.entries(SORT_LABELS).map(([option, label]) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setShowSortDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          sortBy === option
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(funcionariosOrdenados).map(([funcionario, emprestimos]) => (
          <div 
            key={funcionario} 
            className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-lg shadow p-4 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700/50 ${
              expandedEmployees.has(funcionario) ? 'ring-2 ring-blue-100 dark:ring-blue-500/30' : ''
            }`}
            onClick={() => toggleEmployee(funcionario)}
          >
            <div className="cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {funcionarios.find(f => f.nome === funcionario)?.photoURL ? (
                    <img 
                      src={funcionarios.find(f => f.nome === funcionario)?.photoURL} 
                      alt={funcionario} 
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <CircleUser className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {funcionario}
                  </h3>
                </div>
                <button className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  <Package2 className="w-4 h-4" />
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
              <div className="bg-gray-50/50 dark:bg-gray-700/30 divide-y divide-gray-200/50 dark:divide-gray-600/30 mt-4 rounded-lg">
                <div className="max-h-[32rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div className="space-y-3 p-4 divide-y divide-gray-100/50 dark:divide-gray-600/30">
                    {emprestimos.map(emprestimo => (
                      <div key={emprestimo.id} className="bg-white/80 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden hover:shadow-md hover:bg-white dark:hover:bg-gray-700/50 transition-all duration-200 pt-4">
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
                                      className="h-[36px] w-[36px] flex items-center justify-center text-yellow-500 hover:text-yellow-600 transition-colors duration-200 rounded-lg border border-yellow-200 dark:border-yellow-500/20 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 dark:text-yellow-400 dark:hover:text-yellow-300"
                                      title="Editar empréstimo"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTransferirFerramentas(emprestimo);
                                      }}
                                      className="h-[36px] w-[36px] flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors duration-200 rounded-lg border border-blue-200 dark:border-blue-500/20 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300"
                                      title="Transferir ferramentas"
                                    >
                                      <ArrowRightLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDevolverFerramentas(emprestimo.id);
                                      }}
                                      className="h-[36px] w-[36px] flex items-center justify-center text-green-500 hover:text-green-600 transition-colors duration-200 rounded-lg border border-green-200 dark:border-green-500/20 hover:bg-green-50 dark:hover:bg-green-500/10 dark:text-green-400 dark:hover:text-green-300"
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
                                    className="h-[36px] w-[36px] flex items-center justify-center text-red-500 hover:text-red-600 transition-colors duration-200 rounded-lg border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300"
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
                                  const ferramentaDevolvida = emprestimo.status === 'devolvido';
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`flex items-center justify-between text-sm ${
                                        ferramentaDevolvida ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <CircleDotDashed className={`w-3 h-3 ${ferramentaDevolvida ? 'text-gray-400' : ''}`} />
                                        <span className={ferramentaDevolvida ? 'line-through' : ''}>
                                          {ferramenta.nome}
                                          {ferramenta.quantidade > 1 && (
                                            <span className="text-gray-500 dark:text-gray-400 ml-1">({ferramenta.quantidade} unidades)</span>
                                          )}
                                        </span>
                                      </div>

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



      {showConfirmacaoExclusao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirmar exclusão</h2>
            <p className="mb-6">Tem certeza que deseja remover este registro de empréstimo?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelarExclusao}
                className="h-[36px] px-4 text-gray-700 bg-white border border-gray-300 dark:border-[#38444D] hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="h-[36px] px-4 bg-red-600 text-white border border-gray-300 dark:border-[#38444D] rounded-lg hover:bg-red-700 transition-colors duration-200"
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

    </div>
  );
};

export default ListaEmprestimos;