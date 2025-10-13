import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, CheckCircle, Clock, Trash2, CircleDotDashed, Pencil, ArrowRightLeft, Edit, Package2, CircleUser, Shield, FileText, MoreVertical, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO, PermissionChecker } from '../../constants/permissoes';
import { doc, updateDoc, collection, getDocs, addDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatarDataHora } from '../../utils/formatters';
import DevolucaoFerramentasModal from './DevolucaoFerramentasModal';
import DevolucaoAnimation from './DevolucaoAnimation';
import DevolucaoParticleAnimation from './DevolucaoParticleAnimation';
import TransferenciaFerramentasModal from './TransferenciaFerramentasModal';
import TransferenciaAnimation from './TransferenciaAnimation';
import EditarEmprestimoModal from './EditarEmprestimoModal';
import ComprovanteModal from '../Comprovantes/ComprovanteModal';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';

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
  atualizarDisponibilidade = () => true,
  funcionarios = [],
  readonly = false
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
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false);
  const [emprestimoParaTransferencia, setEmprestimoParaTransferencia] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [emprestimoParaEditar, setEmprestimoParaEditar] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [currentEmprestimoIndex, setCurrentEmprestimoIndex] = useState({});
  const [editingObservacoes, setEditingObservacoes] = useState(new Set());
  const [tempObservacoes, setTempObservacoes] = useState({});
  const dropdownRef = useRef(null);
  
  // Estados para animação de devolução
  const [showDevolucaoAnimation, setShowDevolucaoAnimation] = useState(false);
  const [dadosDevolucao, setDadosDevolucao] = useState(null);
  const [evaporatingCard, setEvaporatingCard] = useState(null); // ID do funcionário cujo card está evaporando
  
  // Estados para animação de transferência
  const [showTransferenciaAnimation, setShowTransferenciaAnimation] = useState(false);
  const [dadosTransferencia, setDadosTransferencia] = useState(null);
  
  // Estados para modal de comprovante
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [emprestimoParaComprovante, setEmprestimoParaComprovante] = useState(null);
  
  const { usuario } = useAuth();
  
  // ✅ Sistema reverso: Admin (0) <= Supervisor (2) = tem permissão
  const temPermissaoEdicao = usuario && usuario.nivel <= NIVEIS_PERMISSAO.SUPERVISOR;

  // Log de debug para verificar props
  useEffect(() => {
    console.log('📦 ListaEmprestimos - Props recebidas:', {
      emprestimosCount: emprestimos.length,
      temDevolverFerramentas: typeof devolverFerramentas === 'function',
      temRemoverEmprestimo: typeof removerEmprestimo === 'function',
      temAtualizarDisponibilidade: typeof atualizarDisponibilidade === 'function',
      funcionariosCount: funcionarios.length,
      readonly
    });
  }, [emprestimos.length, funcionarios.length]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Hook de permissões por setor
  const { canViewAllSectors } = useSectorPermissions();
  const isAdmin = canViewAllSectors;

  // Filtrar empréstimos por setor (se não for admin)
  const emprestimosPorSetor = useMemo(() => {
    if (isAdmin) {
      return emprestimos; // Admin vê todos os empréstimos
    }
    
    // Filtrar empréstimos onde o setorId corresponde ao setor do usuário
    return PermissionChecker.filterBySector(emprestimos, usuario);
  }, [emprestimos, usuario, isAdmin]);

  const emprestimosFiltrados = emprestimosPorSetor
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
    console.log('🔍 handleDevolverFerramentas chamado com ID:', id);
    console.log('📦 Empréstimos disponíveis:', emprestimos);
    
    if (!id || !Array.isArray(emprestimos)) {
      console.error('❌ ID inválido ou empréstimos não é um array:', { id, emprestimos });
      alert('Erro: ID inválido ou lista de empréstimos não disponível.');
      return;
    }
    
    const emprestimo = emprestimos.find(e => e.id === id);
    console.log('🔎 Empréstimo encontrado:', emprestimo);
    
    if (!emprestimo) {
      console.error('❌ Empréstimo não encontrado com o ID:', id);
      alert(`Erro: Empréstimo não encontrado (ID: ${id})`);
      return;
    }

    if (!Array.isArray(emprestimo.ferramentas)) {
      console.error('❌ Empréstimo sem array de ferramentas válido:', emprestimo);
      alert('Erro: Empréstimo sem ferramentas válidas.');
      return;
    }

    // Faz uma cópia profunda do empréstimo para evitar problemas de referência
    const emprestimoParaDevolver = JSON.parse(JSON.stringify(emprestimo));
    
    if (emprestimoParaDevolver.ferramentas.length === 0) {
      console.error('❌ Empréstimo sem ferramentas para devolver:', emprestimoParaDevolver);
      alert('Erro: Empréstimo sem ferramentas para devolver.');
      return;
    }

    console.log('✅ Abrindo modal de devolução com empréstimo:', emprestimoParaDevolver);
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

  const handleConfirmDevolucao = async ({ ferramentas, devolvidoPorTerceiros, emprestimoId }) => {
    try {
      console.log('🔍 handleConfirmDevolucao iniciado', { emprestimoId, ferramentas, devolvidoPorTerceiros });
      
      if (!emprestimoId || !ferramentas || ferramentas.length === 0) {
        console.error('❌ Dados inválidos para devolução', { emprestimoId, ferramentas });
        return;
      }

      // Fecha o modal
      setShowDevolucaoModal(false);
      
      const emprestimo = emprestimos.find(e => e.id === emprestimoId);
      if (!emprestimo) {
        console.error('❌ Empréstimo não encontrado', { emprestimoId, emprestimos });
        return;
      }

      console.log('✅ Empréstimo encontrado', { emprestimo });

      // Prepara os dados para a animação
      setDadosDevolucao({
        emprestimo,
        ferramentasDevolvidas: ferramentas,
        devolvidoPorTerceiros
      });

      // Inicia a animação de evaporação do card
      setEvaporatingCard(emprestimo.funcionario);
      setShowDevolucaoAnimation(true);
      
      console.log('🎬 Animação iniciada, aguardando 700ms...');
      
      // Após exatamente 700ms (duração da animação), remove o card visualmente
      setTimeout(() => {
        console.log('⏱️ 700ms passados, removendo card e processando devolução');
        setEvaporatingCard(null);
        setShowDevolucaoAnimation(false);
        
        // Processa a devolução no banco de dados em background
        // O usuário não verá mais o card, mas a exclusão continua
        finalizarDevolucaoBackground(emprestimo, ferramentas, devolvidoPorTerceiros);
      }, 700);
      
      return;
    } catch (error) {
      console.error('❌ Erro ao preparar devolução:', error);
      alert('Erro ao preparar a devolução. Por favor, tente novamente.');
    }
  };

  // Função que processa a devolução em background após a animação
  const finalizarDevolucaoBackground = async (emprestimoAtual, ferramentasDevolvidas, devolvidoPorTerceiros) => {
    try {
      console.log('🔄 finalizarDevolucaoBackground iniciado', { 
        emprestimoId: emprestimoAtual.id, 
        ferramentasDevolvidas, 
        devolvidoPorTerceiros 
      });

      if (!emprestimoAtual || !emprestimoAtual.id) {
        console.error('❌ Empréstimo inválido', { emprestimoAtual });
        return;
      }

      const emprestimoId = emprestimoAtual.id;
      const emprestimoRef = doc(db, 'emprestimos', emprestimoId);
      const dataDevolucao = new Date().toISOString();

      console.log('📊 Comparando ferramentas:', {
        devolvidas: ferramentasDevolvidas.length,
        total: emprestimoAtual.ferramentas.length
      });

      // Se todas as ferramentas foram selecionadas, faz devolução total
      if (ferramentasDevolvidas.length === emprestimoAtual.ferramentas.length) {
        console.log('🎯 Devolução TOTAL - chamando devolverFerramentas');
        
        if (typeof devolverFerramentas === 'function') {
          await devolverFerramentas(
            emprestimoId,
            atualizarDisponibilidade,
            devolvidoPorTerceiros
          );
          console.log('✅ Devolução total concluída com sucesso');
        } else {
          console.error('❌ Função devolverFerramentas não está disponível');
        }
      } else {
        console.log('🎯 Devolução PARCIAL - atualizando Firestore');
        
        // Devolução parcial - remove apenas as ferramentas selecionadas
        const ferramentasRestantes = emprestimoAtual.ferramentas.filter(
          ferramenta => {
            const nomeFerramenta = typeof ferramenta === 'object' ? ferramenta.nome : ferramenta;
            return !ferramentasDevolvidas.some(devolvida => {
              const nomeDevolvida = typeof devolvida === 'object' ? devolvida.nome : devolvida;
              return nomeFerramenta === nomeDevolvida;
            });
          }
        );

        console.log('📦 Ferramentas restantes:', ferramentasRestantes.length);

        // Adiciona as ferramentas devolvidas ao histórico
        const historico = ferramentasDevolvidas.map(f => ({
          ferramenta: typeof f === 'object' ? f.nome : f,
          dataDevolucao,
          devolvidoPorTerceiros
        }));

        console.log('💾 Atualizando Firestore com:', {
          ferramentasRestantes: ferramentasRestantes.length,
          historico: historico.length
        });

        await updateDoc(emprestimoRef, {
          ferramentas: ferramentasRestantes,
          historicoFerramentas: arrayUnion(...historico)
        });

        console.log('✅ Firestore atualizado com sucesso');

        // Atualiza a disponibilidade das ferramentas
        console.log('🔄 Atualizando disponibilidade...');
        await atualizarDisponibilidade();
        console.log('✅ Disponibilidade atualizada');
      }

      // Limpa os estados após conclusão
      console.log('🧹 Limpando estados...');
      setSelectedEmprestimo(null);
      setDadosDevolucao(null);
      console.log('✅ Devolução completamente finalizada!');
    } catch (error) {
      console.error('❌ Erro ao devolver ferramentas:', error);
      console.error('Stack trace:', error.stack);
      // Não mostra alert pois a animação já terminou e o card desapareceu
      console.error('⚠️ A devolução falhou, mas a interface foi atualizada. Verifique o console para mais detalhes.');
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

    // Faz uma cópia profunda do empréstimo para evitar referências
    const emprestimoParaEditar = JSON.parse(JSON.stringify(emprestimo));
    setEmprestimoParaEditar(emprestimoParaEditar);
    setShowEditModal(true);
  };

  const handleGerarComprovante = (emprestimo) => {

    setEmprestimoParaComprovante(emprestimo);
    setShowComprovanteModal(true);
  };

  const handleSaveEdit = async (emprestimoEditado) => {
    try {
      if (!emprestimoEditado || !emprestimoEditado.id) {
        throw new Error('Empréstimo inválido');
      }

      // Valida se todas as ferramentas têm as propriedades necessárias
      const ferramentasValidas = emprestimoEditado.ferramentas.every(ferramenta => 
        ferramenta.id && 
        ferramenta.nome && 
        typeof ferramenta.quantidade === 'number'
      );

      if (!ferramentasValidas) {
        throw new Error('Dados de ferramentas inválidos');
      }

      const dataAtualizacao = new Date().toISOString();

      // Preserva o histórico de edições
      const emprestimoAtualizado = {
        ...emprestimoEditado,
        dataAtualizacao,
        usuarioAtualizacao: usuario?.email || 'sistema',
        ferramentas: emprestimoEditado.ferramentas.map(ferramenta => ({
          id: ferramenta.id,
          nome: ferramenta.nome,
          quantidade: ferramenta.quantidade,
          codigo: ferramenta.codigo,
          descricao: ferramenta.descricao
        })),
        historicoEdicoes: [
          ...(emprestimoEditado.historicoEdicoes || []),
          {
            dataEdicao: dataAtualizacao,
            usuarioEdicao: usuario?.email || 'sistema',
            tipoEdicao: 'EDICAO_FERRAMENTAS'
          }
        ]
      };

      // Atualiza o empréstimo no Firestore
      const emprestimoRef = doc(db, 'emprestimos', emprestimoEditado.id);
      await updateDoc(emprestimoRef, emprestimoAtualizado);

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

    // Faz uma cópia profunda do empréstimo para evitar referências
    const emprestimoParaTransferir = JSON.parse(JSON.stringify(emprestimo));
    setEmprestimoParaTransferencia(emprestimoParaTransferir);
    carregarFuncionarios();
    setShowTransferenciaModal(true);
  };

  const handleConfirmTransferencia = async ({ ferramentas, funcionarioDestino, observacao }) => {
    try {
      if (!emprestimoParaTransferencia || !funcionarioDestino || !ferramentas.length) {
        console.error('Dados inválidos para transferência');
        return;
      }

      // Fecha o modal e prepara os dados para animação
      setShowTransferenciaModal(false);
      
      // Normaliza ferramentas para array de strings (apenas nomes)
      const ferramentasNormalizadas = ferramentas.map(f => 
        typeof f === 'object' && f !== null ? (f.nome || f.descricao || f.ferramenta || 'Ferramenta') : String(f || 'Ferramenta')
      );
      
      // Mostra a animação com os dados
      setDadosTransferencia({
        emprestimoOrigem: emprestimoParaTransferencia,
        funcionarioDestino,
        ferramentas: ferramentasNormalizadas, // Array de strings normalizadas
        ferramentasOriginais: ferramentas, // Mantém os objetos originais para processamento posterior
        observacao
      });
      setShowTransferenciaAnimation(true);
      
      // A transferência real será processada após a animação no finalizarTransferencia
      return;
    } catch (error) {
      console.error('Erro ao preparar transferência:', error);
      alert('Erro ao preparar a transferência. Por favor, tente novamente.');
    }
  };

  const finalizarTransferencia = async () => {
    try {
      if (!dadosTransferencia) return;

      const { emprestimoOrigem, funcionarioDestino, ferramentasOriginais, observacao } = dadosTransferencia;

      const dataTransferencia = new Date().toISOString();
      
      // Encontra e preserva os detalhes completos da ferramenta a ser transferida
      const ferramentaParaTransferir = emprestimoOrigem.ferramentas.find(
        f => f.id === ferramentasOriginais[0].id
      );

      if (!ferramentaParaTransferir) {
        throw new Error('Ferramenta não encontrada no empréstimo original');
      }

      // Remove a ferramenta selecionada do empréstimo atual
      const ferramentasRestantes = emprestimoOrigem.ferramentas.filter(
        f => f.id !== ferramentasOriginais[0].id
      );

      // Atualiza o empréstimo original
      const emprestimoRef = doc(db, 'emprestimos', emprestimoOrigem.id);
      await updateDoc(emprestimoRef, {
        ferramentas: ferramentasRestantes,
        ferramentasTransferidas: arrayUnion({
          ferramenta: ferramentaParaTransferir,
          funcionarioDestinoId: funcionarioDestino.id,
          funcionarioDestinoNome: funcionarioDestino.nome,
          dataTransferencia,
          observacao,
          usuarioTransferencia: usuario?.email || 'sistema'
        }),
        dataAtualizacao: dataTransferencia,
        usuarioAtualizacao: usuario?.email || 'sistema'
      });

      // Cria um novo registro de empréstimo para o funcionário destino
      const emprestimoDaTransferencia = {
        funcionarioId: funcionarioDestino.id,
        nomeFuncionario: funcionarioDestino.nome,
        ferramentas: [ferramentaParaTransferir], // Usa os detalhes completos da ferramenta
        dataEmprestimo: dataTransferencia,
        dataCriacao: dataTransferencia,
        status: 'emprestado',
        observacao: `Transferido de ${emprestimoOrigem.nomeFuncionario}. ${observacao ? `Observação: ${observacao}` : ''}`,
        emprestimoOriginalId: emprestimoOrigem.id,
        usuarioCriacao: usuario?.email || 'sistema',
        historicoTransferencias: [{
          dataTransferencia,
          funcionarioOrigemId: emprestimoOrigem.funcionarioId,
          funcionarioOrigemNome: emprestimoOrigem.nomeFuncionario,
          observacao
        }]
      };

      // Adiciona o novo empréstimo ao Firestore
      await addDoc(collection(db, 'emprestimos'), emprestimoDaTransferencia);

      // Atualiza a disponibilidade das ferramentas se necessário
      await atualizarDisponibilidade();

      // Limpa os estados após conclusão
      setEmprestimoParaTransferencia(null);
      setDadosTransferencia(null);
      setShowTransferenciaAnimation(false);
    } catch (error) {
      console.error('Erro ao transferir ferramentas:', error);
      alert('Erro ao transferir ferramentas. Por favor, tente novamente.');
      setShowTransferenciaAnimation(false);
      setDadosTransferencia(null);
    }
  };

  const temFerramentasEmprestadas = (emprestimo) => {
    return emprestimo.ferramentas && emprestimo.ferramentas.length > 0;
  };

  // Função para editar observações inline
  const handleStartEditObservacao = (emprestimoId, observacaoAtual) => {
    setEditingObservacoes(prev => new Set(prev).add(emprestimoId));
    setTempObservacoes(prev => ({ ...prev, [emprestimoId]: observacaoAtual || '' }));
  };

  const handleSaveObservacao = async (emprestimoId) => {
    try {
      const novaObservacao = tempObservacoes[emprestimoId] || '';
      const emprestimoRef = doc(db, 'emprestimos', emprestimoId);
      
      await updateDoc(emprestimoRef, {
        observacoes: novaObservacao,
        dataAtualizacao: new Date().toISOString(),
        usuarioAtualizacao: usuario?.email || 'sistema'
      });

      // Remove do estado de edição
      setEditingObservacoes(prev => {
        const newSet = new Set(prev);
        newSet.delete(emprestimoId);
        return newSet;
      });
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      alert('Erro ao salvar observação. Tente novamente.');
    }
  };

  const handleCancelEditObservacao = (emprestimoId) => {
    setEditingObservacoes(prev => {
      const newSet = new Set(prev);
      newSet.delete(emprestimoId);
      return newSet;
    });
    setTempObservacoes(prev => {
      const newTemp = { ...prev };
      delete newTemp[emprestimoId];
      return newTemp;
    });
  };

  // Função para enviar lembrete ao funcionário
  const handleEnviarLembrete = async (emprestimo) => {
    try {
      const notificacao = {
        tipo: 'lembrete_emprestimo',
        titulo: 'Lembrete de Devolução',
        mensagem: `Você ainda possui ${emprestimo.ferramentas?.length || 0} ferramenta(s) emprestada(s). Por favor, verifique a devolução.`,
        funcionarioId: emprestimo.funcionarioId,
        funcionarioNome: emprestimo.nomeFuncionario,
        emprestimoId: emprestimo.id,
        ferramentas: emprestimo.ferramentas?.map(f => f.nome || f) || [],
        dataEmprestimo: emprestimo.dataEmprestimo,
        dataCriacao: new Date().toISOString(),
        lida: false,
        remetente: usuario?.email || 'sistema',
        remetenteNome: usuario?.nome || 'Sistema'
      };

      // Salva a notificação no Firestore
      await addDoc(collection(db, 'notificacoes'), notificacao);

      // Tenta enviar notificação push se o service worker estiver registrado
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.pushManager) {
          try {
            await registration.showNotification('Lembrete de Devolução', {
              body: notificacao.mensagem,
              icon: '/logo.png',
              badge: '/logo.png',
              tag: `lembrete-${emprestimo.id}`,
              requireInteraction: true,
              data: {
                url: '/emprestimos',
                emprestimoId: emprestimo.id
              }
            });
          } catch (pushError) {
            console.log('Notificação push não disponível:', pushError);
          }
        }
      }

      alert(`Lembrete enviado para ${emprestimo.nomeFuncionario}!`);
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      alert('Erro ao enviar lembrete. Tente novamente.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Badge informativo para não-admins */}
      {!isAdmin && usuario?.setor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Visualização por setor:</strong> Você está vendo apenas os empréstimos do setor <strong>{usuario.setor}</strong>.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Buscar..."
              value={filtroEmprestimos}
              onChange={(e) => setFiltroEmprestimos(e.target.value)}
              className="h-[36px] w-full px-4 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-[36px] w-48 inline-flex items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
          >
            <option value="todos">Todos</option>
            <option value="emprestado">Não devolvidos</option>
            <option value="devolvido">Devolvidos</option>
          </select>
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="h-[36px] w-44 inline-flex items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
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
              className="h-[36px] inline-flex items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
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
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
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

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 shadow-xl border-2 border-blue-400/50 dark:border-blue-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-100 mb-2">Total de Empréstimos</p>
              <p className="text-4xl font-black text-white">{emprestimosFiltrados.length}</p>
            </div>
            <Package2 className="w-14 h-14 text-white/30" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-2xl p-6 shadow-xl border-2 border-amber-400/50 dark:border-amber-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-100 mb-2">Empréstimos Ativos</p>
              <p className="text-4xl font-black text-white">
                {emprestimosFiltrados.filter(e => e.status === 'emprestado').length}
              </p>
            </div>
            <Clock className="w-14 h-14 text-white/30" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-2xl p-6 shadow-xl border-2 border-emerald-400/50 dark:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100 mb-2">Devolvidos</p>
              <p className="text-4xl font-black text-white">
                {emprestimosFiltrados.filter(e => e.status === 'devolvido').length}
              </p>
            </div>
            <CheckCircle className="w-14 h-14 text-white/30" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {Object.entries(funcionariosOrdenados)
            .filter(([funcionario]) => evaporatingCard !== funcionario) // Remove card que está evaporando
            .map(([funcionario, emprestimos]) => {
            const emprestimoAtivo = emprestimos.some(e => e.status === 'emprestado');
            const totalFerramentas = emprestimos.reduce((acc, emp) => acc + (emp.ferramentas?.length || 0), 0);
            
            return (
              <motion.div
                key={funcionario}
                id={`emprestimo-card-${emprestimos[currentEmprestimoIndex[funcionario] || 0]?.id || funcionario}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: -50
                }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden h-[520px] flex flex-col ${
                  expandedEmployees.has(funcionario) 
                    ? 'ring-4 ring-blue-500/50 dark:ring-blue-400/60 border-blue-500 dark:border-blue-400' 
                    : emprestimoAtivo 
                      ? 'border-amber-400 dark:border-amber-600/80' 
                      : 'border-gray-200 dark:border-gray-700'
                }`}
              >
              <div 
                className="hover:bg-gradient-to-r hover:from-gray-50/50 dark:hover:from-gray-700/50 transition-all p-5 flex flex-col h-full"
              >
                {/* Cabeçalho Compacto */}
                <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {funcionarios.find(f => f.nome === funcionario)?.photoURL ? (
                      <img 
                        src={funcionarios.find(f => f.nome === funcionario)?.photoURL} 
                        alt={funcionario} 
                        className="w-14 h-14 rounded-full object-cover border-3 border-white dark:border-gray-700 shadow-lg"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center border-3 border-white dark:border-gray-700 shadow-lg">
                        <CircleUser className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info Compacta */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {funcionario}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {totalFerramentas} ferramenta{totalFerramentas !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {/* Badges em uma linha */}
                <div className="flex gap-2 mb-2 flex-shrink-0">
                  <div className="flex-1 bg-blue-100 dark:bg-blue-500/30 px-2 py-1.5 rounded-lg flex items-center justify-between border border-blue-200 dark:border-blue-400">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total</span>
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{emprestimos.length}</span>
                  </div>
                  <div className="flex-1 bg-amber-100 dark:bg-amber-500/30 px-2 py-1.5 rounded-lg flex items-center justify-between border border-amber-200 dark:border-amber-400">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Ativo</span>
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-100">{emprestimos.filter(e => e.status === 'emprestado').length}</span>
                  </div>
                </div>

                {/* Data e Hora do Empréstimo */}
                {(() => {
                  const currentIndex = currentEmprestimoIndex[funcionario] || 0;
                  const currentEmp = emprestimos[currentIndex];
                  return currentEmp ? (
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-3 flex-shrink-0 bg-gray-50 dark:bg-gray-700/30 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-medium">
                        {new Date(currentEmp.dataEmprestimo).toLocaleDateString('pt-BR')} às {new Date(currentEmp.dataEmprestimo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : null;
                })()}
                
                  {/* Conteúdo Principal - Flex-1 para preencher espaço */}
                  <div className="flex-1 overflow-y-auto mb-4">
                    {(() => {
                      const currentIndex = currentEmprestimoIndex[funcionario] || 0;
                      const currentEmp = emprestimos[currentIndex];
                      
                      if (!currentEmp) return null;
                      
                      return (
                        <div className="space-y-3">
                          {/* Navegação de Empréstimos */}
                          {emprestimos.length > 1 && (
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => setCurrentEmprestimoIndex(prev => ({
                                  ...prev,
                                  [funcionario]: Math.max(0, currentIndex - 1)
                                }))}
                                disabled={currentIndex === 0}
                                className={`p-2 rounded-lg transition-all ${
                                  currentIndex === 0
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                }`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              
                              <div className="text-center">
                                <div className="text-sm font-bold text-gray-800 dark:text-white">
                                  Empréstimo {currentIndex + 1} de {emprestimos.length}
                                </div>
                                <div className={`text-xs font-semibold mt-1 ${
                                  currentEmp.status === 'emprestado'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {currentEmp.status === 'emprestado' ? '● Ativo' : '● Devolvido'}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => setCurrentEmprestimoIndex(prev => ({
                                  ...prev,
                                  [funcionario]: Math.min(emprestimos.length - 1, currentIndex + 1)
                                }))}
                                disabled={currentIndex === emprestimos.length - 1}
                                className={`p-2 rounded-lg transition-all ${
                                  currentIndex === emprestimos.length - 1
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                }`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}
                          
                          {/* Ferramentas */}
                          <div>
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <Package2 className="w-4 h-4" />
                              <span>Ferramentas ({currentEmp.ferramentas?.length || 0})</span>
                            </div>
                            <div className="space-y-1.5">
                              {currentEmp.ferramentas?.map((ferr, idx) => (
                                <div key={idx} className="text-sm bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{ferr.nome}</span>
                                  {ferr.quantidade > 1 && (
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">x{ferr.quantidade}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Observações - Editável */}
                          <div>
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              💬 Observações
                            </div>
                            {editingObservacoes.has(currentEmp.id) ? (
                              <textarea
                                value={tempObservacoes[currentEmp.id] || ''}
                                onChange={(e) => setTempObservacoes(prev => ({ ...prev, [currentEmp.id]: e.target.value }))}
                                onBlur={() => handleSaveObservacao(currentEmp.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') handleCancelEditObservacao(currentEmp.id);
                                  if (e.key === 'Enter' && e.ctrlKey) handleSaveObservacao(currentEmp.id);
                                }}
                                autoFocus
                                className="w-full text-sm bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border-2 border-blue-500 dark:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows="3"
                                placeholder="Digite as observações... (Ctrl+Enter para salvar, Esc para cancelar)"
                              />
                            ) : (
                              <div 
                                onClick={() => handleStartEditObservacao(currentEmp.id, currentEmp.observacoes)}
                                className="text-sm bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 cursor-text hover:border-blue-400 dark:hover:border-blue-500 transition-colors min-h-[60px]"
                              >
                                {currentEmp.observacoes || <span className="text-gray-400 dark:text-gray-500 italic">Clique para adicionar observações...</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Botões de Ação - Fixos no Rodapé */}
                  <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-3">
                    {(() => {
                      const currentIndex = currentEmprestimoIndex[funcionario] || 0;
                      const currentEmp = emprestimos[currentIndex];
                      
                      if (!currentEmp) return null;
                      
                      return (
                        <div className="space-y-2">
                          {/* Botão Lembrar Funcionário */}
                          {currentEmp.status === 'emprestado' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnviarLembrete(currentEmp);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-xs font-semibold"
                            >
                              <Bell className="w-4 h-4" />
                              <span>Lembrar Funcionário</span>
                            </button>
                          )}
                          
                          {/* Grid de Ações */}
                          <div className="grid grid-cols-2 gap-2">
                            {currentEmp.status === 'emprestado' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🔘 Botão Devolver clicado! ID:', currentEmp.id);
                                  console.log('📋 Empréstimo atual:', currentEmp);
                                  handleDevolverFerramentas(currentEmp.id);
                                }}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-xs font-semibold"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Devolver</span>
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditarEmprestimo(currentEmp);
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-xs font-semibold"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Editar</span>
                            </button>
                            
                            {currentEmp.status === 'emprestado' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTransferirFerramentas(currentEmp);
                                }}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-xs font-semibold"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                                <span>Transferir</span>
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGerarComprovante(currentEmp);
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-xs font-semibold"
                            >
                              <FileText className="w-4 h-4" />
                              <span>PDF</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
              </div>
              
              {/* Lista de Empréstimos Expandida */}
              {expandedEmployees.has(funcionario) && (
                <div className="border-t-2 border-gray-100 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50">
                  <div className="max-h-[36rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                    <div className="p-4 space-y-3">
                      {emprestimos.map(emprestimo => (
                        <div 
                          key={emprestimo.id}
                          data-emprestimo-card-id={emprestimo.id}
                          className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border-l-4 overflow-hidden ${
                            emprestimo.status === 'emprestado'
                              ? 'border-l-amber-500 dark:border-l-amber-400'
                              : 'border-l-emerald-500 dark:border-l-emerald-400'
                          }`}
                        >
                          <div className="p-4">
                            {/* Cabeçalho do Empréstimo */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    emprestimo.status === 'emprestado'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                  }`}>
                                    {emprestimo.status === 'emprestado' ? (
                                      <><Clock className="w-3.5 h-3.5" />Em Andamento</>
                                    ) : (
                                      <><CheckCircle className="w-3.5 h-3.5" />Concluído</>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="font-medium">Empréstimo:</span>
                                  <span>{formatarDataHora(emprestimo.dataEmprestimo)}</span>
                                </div>
                              </div>
                              
                              {/* Menu Dropdown de Ações */}
                              {emprestimo.status === 'emprestado' && temFerramentasEmprestadas(emprestimo) && (
                                <div className="relative" ref={openDropdownId === emprestimo.id ? dropdownRef : null}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(openDropdownId === emprestimo.id ? null : emprestimo.id);
                                    }}
                                    className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                                    title="Mais ações"
                                  >
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
                                  
                                  {/* Dropdown Menu */}
                                  {openDropdownId === emprestimo.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[200px]">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditarEmprestimo(emprestimo);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full px-4 py-2 text-left flex items-center gap-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                      >
                                        <Edit className="w-4 h-4" />
                                        <span className="text-sm font-medium">Editar empréstimo</span>
                                      </button>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTransferirFerramentas(emprestimo);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full px-4 py-2 text-left flex items-center gap-3 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors"
                                      >
                                        <ArrowRightLeft className="w-4 h-4" />
                                        <span className="text-sm font-medium">Transferir ferramentas</span>
                                      </button>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleGerarComprovante(emprestimo);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full px-4 py-2 text-left flex items-center gap-3 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm font-medium">Gerar comprovante PDF</span>
                                      </button>
                                      
                                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDevolverFerramentas(emprestimo.id);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full px-4 py-2 text-left flex items-center gap-3 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">Devolver ferramentas</span>
                                      </button>
                                      
                                      {temPermissaoEdicao && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoverEmprestimo(emprestimo);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full px-4 py-2 text-left flex items-center gap-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          <span className="text-sm font-medium">Remover registro</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {emprestimo.status !== 'emprestado' && (
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGerarComprovante(emprestimo);
                                    }}
                                    className="p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-md transition-all duration-200"
                                    title="Gerar comprovante PDF"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  
                                  {temPermissaoEdicao && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoverEmprestimo(emprestimo);
                                      }}
                                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all duration-200"
                                      title="Remover registro"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Lista de Ferramentas */}
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Package2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  Ferramentas ({Array.isArray(emprestimo?.ferramentas) ? emprestimo.ferramentas.length : 0})
                                </h4>
                              </div>
                              <div className="space-y-2">
                                {Array.isArray(emprestimo?.ferramentas) && emprestimo.ferramentas.length > 0 ? (
                                  emprestimo.ferramentas.map((ferramenta, idx) => {
                                    const ferramentaDevolvida = emprestimo.status === 'devolvido';
                                    
                                    return (
                                      <div 
                                        key={idx} 
                                        className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                                          ferramentaDevolvida 
                                            ? 'bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-600/40' 
                                            : 'bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700/50 dark:to-gray-700/70 border border-gray-300 dark:border-gray-600'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 flex-1">
                                          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                                            ferramentaDevolvida ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                          }`} />
                                          <span className={`text-sm font-medium ${
                                            ferramentaDevolvida 
                                              ? 'text-emerald-700 dark:text-emerald-300 line-through' 
                                              : 'text-gray-800 dark:text-gray-100'
                                          }`}>
                                            {ferramenta.nome}
                                          </span>
                                        </div>
                                        {ferramenta.quantidade > 1 && (
                                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                                            ferramentaDevolvida
                                              ? 'bg-emerald-200 dark:bg-emerald-600/40 text-emerald-800 dark:text-emerald-200'
                                              : 'bg-blue-500 dark:bg-blue-600 text-white'
                                          }`}>
                                            {ferramenta.quantidade}x
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 italic p-2 text-center bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                    Nenhuma ferramenta registrada
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Informações de Devolução */}
                            <div className="mb-4">
                              {emprestimo.dataDevolucao ? (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                      Devolução Confirmada
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 ml-6">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatarDataHora(emprestimo.dataDevolucao)}
                                  </div>
                                  {emprestimo.devolvidoPorTerceiros && (
                                    <div className="mt-2 flex items-center gap-1.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded ml-6 w-fit">
                                      <Shield className="w-3 h-3" />
                                      Devolvido por terceiros
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                                    <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                                      Aguardando Devolução
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Seção de Observações */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Observações</span>
                              </div>
                              {editingObservacoes.has(emprestimo.id) ? (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700/30">
                                  <textarea
                                    value={tempObservacoes[emprestimo.id] || ''}
                                    onChange={(e) => setTempObservacoes(prev => ({ ...prev, [emprestimo.id]: e.target.value }))}
                                    onBlur={() => handleSaveObservacao(emprestimo.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') handleCancelEditObservacao(emprestimo.id);
                                      if (e.key === 'Enter' && e.ctrlKey) handleSaveObservacao(emprestimo.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full p-3 text-sm border-0 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-y min-h-[80px] shadow-inner"
                                    placeholder="Digite suas observações aqui... (Ctrl+Enter para salvar, Esc para cancelar)"
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <div 
                                  className={`relative group bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-600 ${
                                    temPermissaoEdicao ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (temPermissaoEdicao) {
                                      handleStartEditObservacao(emprestimo.id, emprestimo.observacoes);
                                    }
                                  }}
                                >
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words min-h-[40px]">
                                    {emprestimo.observacoes || (
                                      <span className="text-gray-400 dark:text-gray-500 italic flex items-center gap-2">
                                        <Pencil className="w-3.5 h-3.5" />
                                        {temPermissaoEdicao ? 'Clique para adicionar observações' : 'Sem observações'}
                                      </span>
                                    )}
                                  </p>
                                  {emprestimo.ultimaAtualizacao && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatarDataHora(emprestimo.ultimaAtualizacao)}
                                      {emprestimo.usuarioUltimaAtualizacao && (
                                        <span className="ml-1">• {emprestimo.usuarioUltimaAtualizacao}</span>
                                      )}
                                    </div>
                                  )}
                                  {temPermissaoEdicao && (
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg">
                                      <Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      {showDevolucaoModal && selectedEmprestimo && (
        <DevolucaoFerramentasModal 
          emprestimo={selectedEmprestimo}
          onClose={() => {
            setShowDevolucaoModal(false);
            setSelectedEmprestimo(null);
          }}
          onConfirm={handleConfirmDevolucao}
        />
      )}

      {showConfirmacaoExclusao && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirmar exclusão</h2>
            <p className="mb-6">Tem certeza que deseja remover este registro de empréstimo?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelarExclusao}
                className="h-[36px] px-4 text-gray-700 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="h-[36px] px-4 bg-red-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
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

      {/* Animação de Devolução - Minimalista com Partículas */}
      {showDevolucaoAnimation && dadosDevolucao && (
        <DevolucaoParticleAnimation
          emprestimo={dadosDevolucao.emprestimo}
          ferramentasDevolvidas={dadosDevolucao.ferramentasDevolvidas}
          cardElement={document.getElementById(`emprestimo-card-${dadosDevolucao.emprestimo.id}`)}
          onComplete={() => {}} // Callback vazio, a remoção é controlada por timeout
        />
      )}

      {/* Animação de Transferência */}
      {showTransferenciaAnimation && dadosTransferencia && (
        <TransferenciaAnimation
          emprestimoOrigem={dadosTransferencia.emprestimoOrigem}
          funcionarioDestino={dadosTransferencia.funcionarioDestino}
          ferramentas={dadosTransferencia.ferramentas}
          onComplete={finalizarTransferencia}
        />
      )}

      {/* Modal de Comprovante PDF */}
      {showComprovanteModal && emprestimoParaComprovante && (() => {
        const funcionario = funcionarios.find(f => f.id === emprestimoParaComprovante.funcionarioId) || {};
        return (
          <ComprovanteModal
            isOpen={showComprovanteModal}
            tipo={emprestimoParaComprovante.status === 'devolvido' ? 'devolucao' : 'emprestimo'}
            dados={{
              transacaoId: emprestimoParaComprovante.id?.substring(0, 13).toUpperCase() || 'N/A',
              id: emprestimoParaComprovante.id,
              data: emprestimoParaComprovante.dataEmprestimo,
              quantidade: emprestimoParaComprovante.ferramentas?.length || 0,
              ferramentas: emprestimoParaComprovante.ferramentas?.map(f => f.nome) || [],
              de: emprestimoParaComprovante.empresaNome || 'Almoxarifado',
              para: emprestimoParaComprovante.nomeFuncionario || funcionario.nome || 'N/A',
              deInfo: emprestimoParaComprovante.empresaNome || 'Almoxarifado WorkFlow',
              empresa: funcionario.empresa || emprestimoParaComprovante.empresaNome || 'N/A',
              setor: funcionario.setor || emprestimoParaComprovante.setorNome || 'N/A',
              cargo: funcionario.funcao || funcionario.cargo || 'N/A',
              status: emprestimoParaComprovante.status || 'emprestado',
              observacoes: emprestimoParaComprovante.observacoes
            }}
            onClose={() => {
              setShowComprovanteModal(false);
              setEmprestimoParaComprovante(null);
            }}
          />
        );
      })()}

      </div>
    </div>
  );
};

export default ListaEmprestimos;

