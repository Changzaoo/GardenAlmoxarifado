import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Briefcase, Clock, Plus, Edit2, Trash2, Save, X, AlertTriangle, User, Users, FileText, Calendar, DollarSign, Package, AlertOctagon, TrendingUp, ArrowRightLeft, Star, Award, CheckCircle, Filter, SortAsc, ClipboardList, Timer, Info, Grid3X3, List, Mail, MapPin, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import { isAdmin as checkIsAdmin, hasManagementPermission } from '../../constants/permissoes';
import SafeImage from '../common/SafeImage';

const GerenciamentoSetores = ({ usuarioAtual }) => {
  // Estados principais
  const [setorSelecionado, setSetorSelecionado] = useState(null);
  const [setores, setSetores] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);

  // Estados para dados financeiros
  const [inventario, setInventario] = useState([]);
  const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
  const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);

  // Estados de modais
  const [modalSetor, setModalSetor] = useState(false);
  const [modalHorario, setModalHorario] = useState(false);
  const [modalTransferencia, setModalTransferencia] = useState(false);
  const [modalTarefa, setModalTarefa] = useState(false);
  const [funcionarioTransferencia, setFuncionarioTransferencia] = useState(null);
  const [funcionarioTarefa, setFuncionarioTarefa] = useState(null);
  const [setorDestinoId, setSetorDestinoId] = useState('');
  
  // Estado para visualização (lista ou card)
  const [visualizacao, setVisualizacao] = useState('card'); // 'card' ou 'lista'

  // Estados de filtros e ordenação
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('alfabetica');

  // Estados de dados adicionais
  const [tarefas, setTarefas] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [registrosPonto, setRegistrosPonto] = useState([]);

  // Estados de formulário
  const [formSetor, setFormSetor] = useState({ nome: '', descricao: '', responsavel: '', ativo: true });
  const [formHorario, setFormHorario] = useState({ nome: '', descricao: '', ativo: true });
  const [formTarefa, setFormTarefa] = useState({ 
    titulo: '', 
    descricao: '', 
    tipo: 'diaria', 
    prioridade: 'media',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    status: 'pendente'
  });

  // Verificar permissões
  const isAdmin = checkIsAdmin(usuarioAtual?.nivel) || hasManagementPermission(usuarioAtual?.nivel);

  // Função para carregar dados financeiros
  const carregarDadosFinanceiros = async () => {
    try {
      const inventarioRef = collection(db, 'inventario');
      const inventarioSnap = await getDocs(inventarioRef);
      const inventarioData = inventarioSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventario(inventarioData);

      const danificadasRef = collection(db, 'ferramentas_danificadas');
      const danificadasSnap = await getDocs(danificadasRef);
      const danificadasData = danificadasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFerramentasDanificadas(danificadasData);

      const perdidasRef = collection(db, 'ferramentas_perdidas');
      const perdidasSnap = await getDocs(perdidasRef);
      const perdidasData = perdidasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFerramentasPerdidas(perdidasData);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    }
  };

  // Função para calcular valores do setor
  const calcularValoresSetor = (setorId, setorNome) => {
    const itensSetor = inventario.filter(item => 
      item.setorId === setorId || item.setorNome === setorNome
    );

    const valorBruto = itensSetor.reduce((sum, item) => {
      const valor = parseFloat(item.valorUnitario || 0);
      const qtd = parseInt(item.quantidade || 0);
      return sum + (valor * qtd);
    }, 0);

    const danificadasSetor = ferramentasDanificadas.filter(d => 
      itensSetor.some(i => i.nome.toLowerCase().trim() === d.nomeItem?.toLowerCase().trim())
    );
    const valorDanificadas = danificadasSetor.reduce((sum, d) => sum + (parseFloat(d.valorEstimado) || 0), 0);

    const perdidasSetor = ferramentasPerdidas.filter(p => 
      itensSetor.some(i => i.nome.toLowerCase().trim() === p.nomeItem?.toLowerCase().trim())
    );
    const valorPerdidas = perdidasSetor.reduce((sum, p) => sum + (parseFloat(p.valorEstimado) || 0), 0);

    return {
      valorBruto,
      valorDanificadas,
      valorPerdidas,
      valorLiquido: valorBruto - valorDanificadas - valorPerdidas,
      totalItens: itensSetor.length,
      quantidadeTotal: itensSetor.reduce((sum, item) => sum + parseInt(item.quantidade || 0), 0)
    };
  };

  // Função para carregar funcionários
  const carregarFuncionarios = async () => {
    try {
      const funcionariosRef = collection(db, 'funcionarios');
      const snapshot = await getDocs(funcionariosRef);
      const funcionariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast.error('Erro ao carregar funcionários');
    }
  };

  // Função para carregar tarefas
  const carregarTarefas = async () => {
    try {
      const tarefasRef = collection(db, 'tarefas');
      const snapshot = await getDocs(tarefasRef);
      const tarefasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTarefas(tarefasData);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  // Função para carregar pontos
  const carregarPontos = async () => {
    try {
      const pontosRef = collection(db, 'pontos');
      const snapshot = await getDocs(pontosRef);
      const pontosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPontos(pontosData);
    } catch (error) {
      console.error('Erro ao carregar pontos:', error);
    }
  };

  // Função para carregar avaliações
  const carregarAvaliacoes = async () => {
    try {
      const avaliacoesRef = collection(db, 'avaliacoes');
      const snapshot = await getDocs(avaliacoesRef);
      const avaliacoesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvaliacoes(avaliacoesData);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  // Função para carregar registros de ponto
  const carregarRegistrosPonto = async () => {
    try {
      const pontosRef = collection(db, 'registros_ponto');
      const snapshot = await getDocs(pontosRef);
      const registrosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistrosPonto(registrosData);
    } catch (error) {
      console.error('Erro ao carregar registros de ponto:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoading(true);
      try {
        await Promise.all([
          carregarDadosFinanceiros(),
          carregarSetores(),
          carregarFuncionarios(),
          carregarTarefas(),
          carregarPontos(),
          carregarAvaliacoes(),
          carregarRegistrosPonto()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    if (setorSelecionado) {
      carregarHorarios(setorSelecionado.id);
    } else {
      setHorarios([]);
    }
  }, [setorSelecionado]);

  // Funções de carregamento
  const carregarSetores = async () => {
    try {
      const setoresRef = collection(db, 'setores');
      const snapshot = await getDocs(setoresRef);
      const setoresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSetores(setoresData.filter(s => s.ativo !== false));
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      toast.error('Erro ao carregar setores');
    }
  };

  const carregarHorarios = async (setorId) => {
    try {
      const horariosRef = collection(db, 'horarios_personalizados');
      const snapshot = await getDocs(horariosRef);
      const horariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filtrar horários do setor
      const horariosSetor = horariosData.filter(h => h.setorId === setorId && h.ativo !== false);
      setHorarios(horariosSetor);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários');
    }
  };

  // CRUD Setores
  const handleSubmitSetor = async (e) => {
    e.preventDefault();

    if (!formSetor.nome.trim()) {
      toast.warning('Nome do setor é obrigatório');
      return;
    }

    try {
      if (editando?.tipo === 'setor') {
        await updateDoc(doc(db, 'setores', editando.id), {
          ...formSetor,
          dataAtualizacao: serverTimestamp()
        });
        toast.success('Setor atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'setores'), {
          ...formSetor,
          dataCriacao: serverTimestamp(),
          dataAtualizacao: serverTimestamp()
        });
        toast.success('Setor cadastrado com sucesso!');
      }
      setModalSetor(false);
      handleCancelar();
      await carregarSetores();
      await carregarDadosFinanceiros();
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      toast.error('Erro ao salvar setor');
    }
  };

  const handleExcluirSetor = async (setorId) => {
    if (!window.confirm('Tem certeza? Todos os horários deste setor serão perdidos.')) return;

    try {
      await deleteDoc(doc(db, 'setores', setorId));
      toast.success('Setor excluído com sucesso!');
      if (setorSelecionado?.id === setorId) {
        setSetorSelecionado(null);
      }
      await carregarSetores();
      await carregarDadosFinanceiros();
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast.error('Erro ao excluir setor');
    }
  };

  // CRUD Horários
  const handleSubmitHorario = async (e) => {
    e.preventDefault();
    if (!setorSelecionado) {
      toast.warning('Selecione um setor primeiro');
      return;
    }

    if (!formHorario.nome.trim()) {
      toast.warning('Nome do horário é obrigatório');
      return;
    }

    try {
      if (editando?.tipo === 'horario') {
        await updateDoc(doc(db, 'horarios_personalizados', editando.id), {
          ...formHorario,
          dataAtualizacao: serverTimestamp()
        });
        toast.success('Horário atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'horarios_personalizados'), {
          ...formHorario,
          setorId: setorSelecionado.id,
          setorNome: setorSelecionado.nome,
          dataCriacao: serverTimestamp(),
          dataAtualizacao: serverTimestamp()
        });
        toast.success('Horário cadastrado com sucesso!');
      }
      setModalHorario(false);
      handleCancelar();
      await carregarHorarios(setorSelecionado.id);
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      toast.error('Erro ao salvar horário');
    }
  };

  const handleExcluirHorario = async (horarioId) => {
    if (!window.confirm('Tem certeza que deseja excluir este horário?')) return;

    try {
      await deleteDoc(doc(db, 'horarios_personalizados', horarioId));
      toast.success('Horário excluído com sucesso!');
      await carregarHorarios(setorSelecionado.id);
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast.error('Erro ao excluir horário');
    }
  };

  // Função para transferir funcionário
  const handleTransferirFuncionario = async () => {
    if (!funcionarioTransferencia || !setorDestinoId) {
      toast.warning('Selecione um setor de destino');
      return;
    }

    try {
      const setorDestino = setores.find(s => s.id === setorDestinoId);
      if (!setorDestino) {
        toast.error('Setor de destino inválido');
        return;
      }

      // Atualizar funcionário com novo setor
      await updateDoc(doc(db, 'funcionarios', funcionarioTransferencia.id), {
        setor: setorDestino.nome,
        setorNome: setorDestino.nome,
        setorId: setorDestino.id,
        dataAtualizacao: serverTimestamp()
      });

      toast.success(`${funcionarioTransferencia.nome} transferido para ${setorDestino.nome}!`);
      setModalTransferencia(false);
      setFuncionarioTransferencia(null);
      setSetorDestinoId('');
      await carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao transferir funcionário:', error);
      toast.error('Erro ao transferir funcionário');
    }
  };

  const abrirModalTransferencia = (funcionario) => {
    setFuncionarioTransferencia(funcionario);
    setSetorDestinoId('');
    setModalTransferencia(true);
  };

  // Função para criar tarefa
  const handleCriarTarefa = async (e) => {
    e.preventDefault();
    if (!funcionarioTarefa) {
      toast.warning('Funcionário não selecionado');
      return;
    }

    try {
      await addDoc(collection(db, 'tarefas'), {
        ...formTarefa,
        funcionarioId: funcionarioTarefa.id,
        funcionarioNome: funcionarioTarefa.nome,
        setorId: setorSelecionado?.id,
        setorNome: setorSelecionado?.nome,
        dataCriacao: serverTimestamp(),
        criadoPor: usuarioAtual?.nome || usuarioAtual?.email
      });

      toast.success('Tarefa criada com sucesso!');
      setModalTarefa(false);
      setFuncionarioTarefa(null);
      setFormTarefa({ 
        titulo: '', 
        descricao: '', 
        tipo: 'diaria', 
        prioridade: 'media',
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: '',
        status: 'pendente'
      });
      await carregarTarefas();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    }
  };

  const abrirModalTarefa = (funcionario) => {
    setFuncionarioTarefa(funcionario);
    setModalTarefa(true);
  };

  // Função para calcular estatísticas do funcionário
  const calcularEstatisticasFuncionario = (funcionarioId) => {
    // Pontos
    const pontosFuncionario = pontos.filter(p => p.funcionarioId === funcionarioId);
    const totalPontos = pontosFuncionario.reduce((sum, p) => sum + (parseInt(p.pontos) || 0), 0);

    // Avaliações
    const avaliacoesFuncionario = avaliacoes.filter(a => a.funcionarioId === funcionarioId);
    const mediaAvaliacoes = avaliacoesFuncionario.length > 0
      ? avaliacoesFuncionario.reduce((sum, a) => sum + (parseFloat(a.nota) || 0), 0) / avaliacoesFuncionario.length
      : 0;

    // Tarefas
    const tarefasFuncionario = tarefas.filter(t => t.funcionarioId === funcionarioId);
    const tarefasPendentes = tarefasFuncionario.filter(t => t.status === 'pendente').length;
    const tarefasConcluidas = tarefasFuncionario.filter(t => t.status === 'concluida').length;

    // Registros de ponto (últimos 30 dias)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    const registrosFuncionario = registrosPonto.filter(r => {
      if (r.funcionarioId !== funcionarioId) return false;
      const dataRegistro = r.data?.toDate ? r.data.toDate() : new Date(r.data);
      return dataRegistro >= dataLimite;
    });

    // Calcular horas trabalhadas
    const horasTrabalhadas = registrosFuncionario.reduce((sum, r) => {
      if (r.horasTrabalhadas) return sum + parseFloat(r.horasTrabalhadas);
      return sum;
    }, 0);

    // Calcular horas negativas (diferença entre horas esperadas e trabalhadas)
    const horasNegativasMinutos = registrosFuncionario.reduce((sum, r) => {
      if (r.horasNegativas) return sum + parseFloat(r.horasNegativas);
      return sum;
    }, 0);
    const horasNeg = Math.floor(Math.abs(horasNegativasMinutos) / 60);
    const minutosNeg = Math.floor(Math.abs(horasNegativasMinutos) % 60);

    // Empréstimos ativos (simulado - você pode adicionar uma collection real)
    const emprestimosAtivos = 0; // TODO: Implementar busca de empréstimos quando a collection existir

    return {
      pontos: totalPontos,
      avaliacaoMedia: mediaAvaliacoes.toFixed(1),
      tarefasPendentes,
      tarefasConcluidas,
      tarefasTotal: tarefasFuncionario.length,
      horasTrabalhadas: horasTrabalhadas.toFixed(1),
      horasNegativas: `${horasNeg}h ${minutosNeg}m`,
      emprestimosAtivos,
      registrosPonto: registrosFuncionario.length
    };
  };

  // Função para filtrar e ordenar funcionários
  const filtrarEOrdenarFuncionarios = (funcionariosLista) => {
    let resultado = [...funcionariosLista];

    // Aplicar filtro de nome
    if (filtroNome) {
      resultado = resultado.filter(f => 
        f.nome?.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    // Aplicar filtro de status
    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(f => f.status === filtroStatus);
    }

    // Aplicar ordenação
    switch (ordenacao) {
      case 'alfabetica':
        resultado.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        break;
      case 'pontos':
        resultado.sort((a, b) => {
          const pontosA = calcularEstatisticasFuncionario(a.id).pontos;
          const pontosB = calcularEstatisticasFuncionario(b.id).pontos;
          return pontosB - pontosA;
        });
        break;
      case 'avaliacao':
        resultado.sort((a, b) => {
          const avalA = parseFloat(calcularEstatisticasFuncionario(a.id).avaliacaoMedia);
          const avalB = parseFloat(calcularEstatisticasFuncionario(b.id).avaliacaoMedia);
          return avalB - avalA;
        });
        break;
      default:
        break;
    }

    return resultado;
  };

  // Funções auxiliares
  const handleEditar = (item, tipo) => {
    setEditando({ ...item, tipo });
    if (tipo === 'setor') {
      setFormSetor({ nome: item.nome, descricao: item.descricao || '', responsavel: item.responsavel || '', ativo: item.ativo !== false });
      setModalSetor(true);
    } else if (tipo === 'horario') {
      setFormHorario({ nome: item.nome, descricao: item.descricao || '', ativo: item.ativo !== false });
      setModalHorario(true);
    }
  };

  const handleCancelar = () => {
    setEditando(null);
    setFormSetor({ nome: '', descricao: '', responsavel: '', ativo: true });
    setFormHorario({ nome: '', descricao: '', ativo: true });
    setModalSetor(false);
    setModalHorario(false);
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-800 dark:via-blue-900 dark:to-blue-950 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Gerenciamento de Setores</h1>
            <p className="text-blue-100">Organize e gerencie os setores do sistema</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold mb-1">Total de Setores</p>
                <p className="text-3xl font-bold text-white">{setores.length}</p>
                <p className="text-xs text-blue-200 mt-1">{setores.length === 1 ? '1 ativo' : `${setores.length} ativos`}</p>
              </div>
              <Briefcase className="w-12 h-12 text-white/40" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold mb-1">Total de Horários</p>
                <p className="text-3xl font-bold text-white">{horarios.length}</p>
                <p className="text-xs text-blue-200 mt-1">Em todos os setores</p>
              </div>
              <Clock className="w-12 h-12 text-white/40" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold mb-1">Itens no Inventário</p>
                <p className="text-3xl font-bold text-white">{inventario.length}</p>
                <p className="text-xs text-blue-200 mt-1">Total de itens</p>
              </div>
              <Package className="w-12 h-12 text-white/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Setores */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Setores
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setModalSetor(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-semibold">Novo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
              {setores.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 font-semibold">Nenhum setor cadastrado</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Clique em "Novo" para adicionar</p>
                </div>
              ) : (
                setores.map(setor => {
                  const isSelected = setorSelecionado?.id === setor.id;
                  const valores = calcularValoresSetor(setor.id, setor.nome);

                  return (
                    <div
                      key={setor.id}
                      onClick={() => setSetorSelecionado(setor)}
                      className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 shadow-xl scale-105'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                              <Briefcase className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                            </div>
                            <h3 className={`text-lg font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                              {setor.nome}
                            </h3>
                          </div>

                          {setor.descricao && (
                            <p className={`text-sm mb-2 ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                              {setor.descricao}
                            </p>
                          )}

                          {setor.responsavel && (
                            <div className={`flex items-center gap-2 text-sm ${isSelected ? 'text-white/95' : 'text-gray-700 dark:text-gray-300'}`}>
                              <User className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                              <span className="font-semibold">{setor.responsavel}</span>
                            </div>
                          )}

                          {/* Informações Financeiras */}
                          <div className={`mt-3 pt-3 border-t ${isSelected ? 'border-white/20' : 'border-gray-200 dark:border-gray-600'} space-y-1`}>
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold ${isSelected ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                Valor Total:
                              </span>
                              <span className={`font-bold ${isSelected ? 'text-white' : 'text-green-600 dark:text-green-400'}`}>
                                {formatarMoeda(valores.valorLiquido)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold ${isSelected ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                Itens:
                              </span>
                              <span className={`font-bold ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                                {valores.totalItens} ({valores.quantidadeTotal} un.)
                              </span>
                            </div>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditar(setor, 'setor');
                              }}
                              className={`p-2 rounded-xl transition-all ${
                                isSelected
                                  ? 'bg-white/20 hover:bg-white/30 text-white'
                                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              }`}
                              title="Editar setor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExcluirSetor(setor.id);
                              }}
                              className={`p-2 rounded-xl transition-all ${
                                isSelected
                                  ? 'bg-red-500/30 hover:bg-red-500/50 text-white'
                                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400'
                              }`}
                              title="Excluir setor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Coluna 2 e 3: Detalhes do Setor e Horários */}
        <div className="lg:col-span-2 space-y-6">
          {!setorSelecionado ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Selecione um setor primeiro</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Escolha uma empresa na coluna anterior para visualizar os detalhes e configurar horários
              </p>
            </div>
          ) : (
            <>
              {/* Detalhes do Setor */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/20 rounded-2xl">
                        <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{setorSelecionado.nome}</h2>
                        {setorSelecionado.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{setorSelecionado.descricao}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(() => {
                    const valores = calcularValoresSetor(setorSelecionado.id, setorSelecionado.nome);
                    
                    return (
                      <>
                        {/* Card: Valor Líquido Total */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border-2 border-green-200 dark:border-green-800">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">VALOR LÍQUIDO TOTAL</p>
                              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatarMoeda(valores.valorLiquido)}</p>
                            </div>
                            <div className="p-2.5 bg-green-500/20 rounded-xl">
                              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-700 dark:text-green-300 font-semibold">Valor Bruto</span>
                              <span className="text-green-600 dark:text-green-400 font-bold">{formatarMoeda(valores.valorBruto)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-red-700 dark:text-red-300 font-semibold flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3" />
                                Danificadas
                              </span>
                              <span className="text-red-600 dark:text-red-400 font-bold">- {formatarMoeda(valores.valorDanificadas)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-orange-700 dark:text-orange-300 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Perdidas
                              </span>
                              <span className="text-orange-600 dark:text-orange-400 font-bold">- {formatarMoeda(valores.valorPerdidas)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card: Itens */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">ITENS NO INVENTÁRIO</p>
                              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{valores.totalItens}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">{valores.quantidadeTotal} unidades</p>
                            </div>
                            <div className="p-2.5 bg-blue-500/20 rounded-xl">
                              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </div>

                        {/* Card: Funcionários */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border-2 border-green-200 dark:border-green-800">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">FUNCIONÁRIOS</p>
                              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {funcionarios.filter(f => 
                                  f.setor?.toLowerCase().trim() === setorSelecionado.nome?.toLowerCase().trim() ||
                                  f.setorNome?.toLowerCase().trim() === setorSelecionado.nome?.toLowerCase().trim()
                                ).length}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">no setor</p>
                            </div>
                            <div className="p-2.5 bg-green-500/20 rounded-xl">
                              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </div>

                        {/* Informações Adicionais */}
                        {setorSelecionado.responsavel && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Responsável</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{setorSelecionado.responsavel}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {setorSelecionado.dataCriacao && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Cadastrado em</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatarData(setorSelecionado.dataCriacao)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Horários Personalizados */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Horários Personalizados
                    </h3>
                    {isAdmin && (
                      <button
                        onClick={() => setModalHorario(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg hover:shadow-xl"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="font-semibold">Novo Horário</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {horarios.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 font-semibold">Nenhum horário configurado</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Clique em "Novo Horário" para adicionar</p>
                    </div>
                  ) : (
                    horarios.map(horario => (
                      <div
                        key={horario.id}
                        className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{horario.nome}</h4>
                              {horario.descricao && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{horario.descricao}</p>
                              )}
                              {horario.dataCriacao && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Cadastrado em {formatarData(horario.dataCriacao)}
                                </p>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditar(horario, 'horario')}
                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all"
                                title="Editar horário"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExcluirHorario(horario.id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-all"
                                title="Excluir horário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Funcionários do Setor */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Funcionários do Setor
                    </h3>
                    
                    {/* Toggle Visualização */}
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => setVisualizacao('card')}
                        className={`p-2 rounded-md transition-all ${
                          visualizacao === 'card'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        title="Visualização em Cards"
                      >
                        <Grid3X3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setVisualizacao('lista')}
                        className={`p-2 rounded-md transition-all ${
                          visualizacao === 'lista'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        title="Visualização em Lista"
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Filtros e Ordenação */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Filtro por Nome */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={filtroNome}
                        onChange={(e) => setFiltroNome(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Filtro por Status */}
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="todos">Todos os status</option>
                      <option value="ativo">Ativos</option>
                      <option value="inativo">Inativos</option>
                    </select>

                    {/* Ordenação */}
                    <div className="relative">
                      <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={ordenacao}
                        onChange={(e) => setOrdenacao(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="alfabetica">Ordem Alfabética</option>
                        <option value="pontos">Maior Pontuação</option>
                        <option value="avaliacao">Melhor Avaliação</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {(() => {
                    let funcionariosDoSetor = funcionarios.filter(func => 
                      func.setor?.toLowerCase().trim() === setorSelecionado?.nome?.toLowerCase().trim() ||
                      func.setorNome?.toLowerCase().trim() === setorSelecionado?.nome?.toLowerCase().trim()
                    );

                    // Aplicar filtros e ordenação
                    funcionariosDoSetor = filtrarEOrdenarFuncionarios(funcionariosDoSetor);

                    if (funcionariosDoSetor.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400 font-semibold">
                            {filtroNome || filtroStatus !== 'todos' 
                              ? 'Nenhum funcionário encontrado com esses filtros' 
                              : 'Nenhum funcionário neste setor'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            {filtroNome || filtroStatus !== 'todos'
                              ? 'Tente ajustar os filtros de busca'
                              : 'Vincule funcionários através da página de Funcionários'}
                          </p>
                        </div>
                      );
                    }

                    return funcionariosDoSetor.map(funcionario => {
                      const stats = calcularEstatisticasFuncionario(funcionario.id);
                      
                      // Visualização em Lista
                      if (visualizacao === 'lista') {
                        return (
                          <div
                            key={funcionario.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
                          >
                            <div className="p-4 flex items-center gap-4">
                              {/* Foto */}
                              <SafeImage
                                src={funcionario.fotoPerfil}
                                alt={funcionario.nome}
                                className="w-16 h-16 rounded-xl object-cover border-2 border-blue-300 dark:border-blue-600 flex-shrink-0"
                                fallback={
                                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center border-2 border-blue-300 dark:border-blue-600">
                                    <User className="w-8 h-8 text-white" />
                                  </div>
                                }
                              />
                              
                              {/* Informações Principais */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">{funcionario.nome}</h4>
                                    {funcionario.cargo && (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{funcionario.cargo}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Badge de Status */}
                                  {funcionario.status && (
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                      funcionario.status === 'ativo' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {funcionario.status === 'ativo' ? '✓ Ativo' : '✗ Inativo'}
                                    </span>
                                  )}
                                </div>

                                {/* Informações de Contato */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                  {funcionario.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <Mail className="w-3.5 h-3.5" />
                                      <span className="truncate">{funcionario.email}</span>
                                    </div>
                                  )}
                                  {funcionario.telefone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <Phone className="w-3.5 h-3.5" />
                                      <span>{funcionario.telefone}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Estatísticas em Grid Horizontal */}
                                <div className="grid grid-cols-5 gap-3">
                                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-2 border border-teal-200 dark:border-teal-800">
                                    <div className="flex items-center gap-1.5">
                                      <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                      <div>
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Pontos</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.pontos}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-1.5">
                                      <Star className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                      <div>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Aval.</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.avaliacaoMedia}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2 border border-rose-200 dark:border-rose-800">
                                    <div className="flex items-center gap-1.5">
                                      <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                      <div>
                                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Horas-</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.horasNegativas}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      <div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Tarefas</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.tarefasConcluidas}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-1.5">
                                      <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      <div>
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Emprés.</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.emprestimosAtivos || 0}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Botões de Ação */}
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                <button
                                  onClick={() => abrirModalTarefa(funcionario)}
                                  className="p-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl transition-all"
                                  title="Criar Tarefa"
                                >
                                  <ClipboardList className="w-5 h-5" />
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => abrirModalTransferencia(funcionario)}
                                    className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all"
                                    title="Transferir de setor"
                                  >
                                    <ArrowRightLeft className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Visualização em Card
                      return (
                        <div
                          key={funcionario.id}
                          className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-700 dark:border-gray-600"
                        >
                          {/* Header com Foto e Nome */}
                          <div className="p-4 border-b border-gray-700 dark:border-gray-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <SafeImage
                                src={funcionario.fotoPerfil}
                                alt={funcionario.nome}
                                className="w-14 h-14 rounded-xl object-cover border-2 border-cyan-500 dark:border-cyan-400 flex-shrink-0"
                                fallback={
                                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center border-2 border-cyan-500 dark:border-cyan-400">
                                    <User className="w-7 h-7 text-white" />
                                  </div>
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-bold text-white truncate">{funcionario.nome}</h4>
                                {funcionario.cargo && (
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                                    <span className="text-sm text-cyan-400 font-medium">{funcionario.cargo}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Badge de Status */}
                            {funcionario.status && (
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                funcionario.status === 'ativo' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              }`}>
                                {funcionario.status === 'ativo' ? '✓ Ativo' : '✗ Inativo'}
                              </span>
                            )}
                          </div>

                          {/* Estatísticas Detalhadas */}
                          <div className="p-4 space-y-3">
                            {/* Pontos */}
                            <div className="bg-gradient-to-r from-teal-900/40 to-teal-800/40 rounded-2xl p-4 border border-teal-700/50 hover:border-teal-600/50 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Award className="w-6 h-6 text-teal-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-teal-400 uppercase tracking-wider">Pontos</p>
                                  <p className="text-2xl font-bold text-white">{stats.pontos} <span className="text-sm text-teal-400">pts</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Avaliação */}
                            <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-2xl p-4 border border-amber-700/50 hover:border-amber-600/50 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-amber-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Star className="w-6 h-6 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Avaliação</p>
                                  <p className="text-2xl font-bold text-white">{stats.avaliacaoMedia} <span className="text-sm text-amber-400">⭐</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Horas Negativas */}
                            <div className="bg-gradient-to-r from-rose-900/40 to-red-900/40 rounded-2xl p-4 border border-rose-700/50 hover:border-rose-600/50 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-rose-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <AlertOctagon className="w-6 h-6 text-rose-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-rose-400 uppercase tracking-wider">Horas Negativas</p>
                                  <p className="text-2xl font-bold text-white">{stats.horasNegativas || '0h 0m'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Tarefas */}
                            <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl p-4 border border-blue-700/50 hover:border-blue-600/50 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Tarefas</p>
                                  <p className="text-2xl font-bold text-white">{stats.tarefasConcluidas} <span className="text-sm text-blue-400">concluídas</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Empréstimos */}
                            <div className="bg-gradient-to-r from-purple-900/40 to-violet-900/40 rounded-2xl p-4 border border-purple-700/50 hover:border-purple-600/50 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Package className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">Empréstimos</p>
                                  <p className="text-2xl font-bold text-white">{stats.emprestimosAtivos || 0} <span className="text-sm text-purple-400">ativos</span></p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer com Botões de Ação */}
                          <div className="p-4 border-t border-gray-700 dark:border-gray-600 flex gap-2">
                            <button
                              onClick={() => abrirModalTarefa(funcionario)}
                              className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                              <ClipboardList className="w-4 h-4" />
                              Criar Tarefa
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => abrirModalTransferencia(funcionario)}
                                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg"
                                title="Transferir"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Setor */}
      {modalSetor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editando ? 'Editar Setor' : 'Novo Setor'}
              </h3>
            </div>
            <form onSubmit={handleSubmitSetor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Setor *
                </label>
                <input
                  type="text"
                  value={formSetor.nome}
                  onChange={(e) => setFormSetor({ ...formSetor, nome: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  placeholder="Ex: Vendas, RH, TI..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formSetor.descricao}
                  onChange={(e) => setFormSetor({ ...formSetor, descricao: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows="3"
                  placeholder="Descrição do setor..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formSetor.responsavel}
                  onChange={(e) => setFormSetor({ ...formSetor, responsavel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4" />
                  {editando ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Horário */}
      {modalHorario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editando ? 'Editar Horário' : 'Novo Horário'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Para o setor: {setorSelecionado?.nome}</p>
            </div>
            <form onSubmit={handleSubmitHorario} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Horário *
                </label>
                <input
                  type="text"
                  value={formHorario.nome}
                  onChange={(e) => setFormHorario({ ...formHorario, nome: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  placeholder="Ex: Turno Manhã, Comercial, Noturno..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formHorario.descricao}
                  onChange={(e) => setFormHorario({ ...formHorario, descricao: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows="3"
                  placeholder="Descrição do horário (ex: 08:00 às 17:00)..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4" />
                  {editando ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transferência */}
      {modalTransferencia && funcionarioTransferencia && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <ArrowRightLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Transferir Funcionário
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transferir <strong>{funcionarioTransferencia.nome}</strong> para outro setor
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Informações do Funcionário */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <SafeImage
                    src={funcionarioTransferencia.fotoPerfil}
                    alt={funcionarioTransferencia.nome}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-300 dark:border-blue-600"
                    fallback={
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center border-2 border-blue-300 dark:border-blue-600">
                        <User className="w-7 h-7 text-white" />
                      </div>
                    }
                  />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{funcionarioTransferencia.nome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Setor atual: <span className="font-semibold">{setorSelecionado?.nome}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Seletor de Setor de Destino */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Novo Setor *
                </label>
                <select
                  value={setorDestinoId}
                  onChange={(e) => setSetorDestinoId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Selecione o setor de destino</option>
                  {setores
                    .filter(s => s.id !== setorSelecionado?.id)
                    .map(setor => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nome}
                      </option>
                    ))}
                </select>
              </div>

              {/* Aviso */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Atenção</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Esta ação irá transferir o funcionário permanentemente para o novo setor.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalTransferencia(false);
                    setFuncionarioTransferencia(null);
                    setSetorDestinoId('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleTransferirFuncionario}
                  disabled={!setorDestinoId}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transferir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Tarefa */}
      {modalTarefa && funcionarioTarefa && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Criar Tarefa
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nova tarefa para <strong>{funcionarioTarefa.nome}</strong>
              </p>
            </div>
            
            <form onSubmit={handleCriarTarefa} className="p-6 space-y-4">
              {/* Informações do Funcionário */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <SafeImage
                    src={funcionarioTarefa.fotoPerfil}
                    alt={funcionarioTarefa.nome}
                    className="w-14 h-14 rounded-full object-cover border-2 border-green-300 dark:border-green-600"
                    fallback={
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center border-2 border-green-300 dark:border-green-600">
                        <User className="w-7 h-7 text-white" />
                      </div>
                    }
                  />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{funcionarioTarefa.nome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {funcionarioTarefa.cargo || 'Cargo não definido'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Título da Tarefa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  value={formTarefa.titulo}
                  onChange={(e) => setFormTarefa({...formTarefa, titulo: e.target.value})}
                  placeholder="Ex: Revisar documentação do projeto"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formTarefa.descricao}
                  onChange={(e) => setFormTarefa({...formTarefa, descricao: e.target.value})}
                  placeholder="Descreva os detalhes da tarefa..."
                  rows="4"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Tipo e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Tarefa *
                  </label>
                  <select
                    value={formTarefa.tipo}
                    onChange={(e) => setFormTarefa({...formTarefa, tipo: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="diaria">📅 Diária</option>
                    <option value="semanal">📆 Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Prioridade *
                  </label>
                  <select
                    value={formTarefa.prioridade}
                    onChange={(e) => setFormTarefa({...formTarefa, prioridade: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="baixa">🟢 Baixa</option>
                    <option value="media">🟡 Média</option>
                    <option value="alta">🔴 Alta</option>
                  </select>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    value={formTarefa.dataInicio}
                    onChange={(e) => setFormTarefa({...formTarefa, dataInicio: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Data de Término *
                  </label>
                  <input
                    type="date"
                    value={formTarefa.dataFim}
                    onChange={(e) => setFormTarefa({...formTarefa, dataFim: e.target.value})}
                    min={formTarefa.dataInicio}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Info sobre recorrência */}
              {formTarefa.tipo && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Tarefa {formTarefa.tipo === 'diaria' ? 'Diária' : 'Semanal'}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {formTarefa.tipo === 'diaria' 
                          ? 'Esta tarefa será criada todos os dias no período selecionado.'
                          : 'Esta tarefa será criada toda semana no período selecionado.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalTarefa(false);
                    setFuncionarioTarefa(null);
                    setFormTarefa({
                      titulo: '',
                      descricao: '',
                      tipo: 'diaria',
                      prioridade: 'media',
                      dataInicio: new Date().toISOString().split('T')[0],
                      dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <CheckCircle className="w-4 h-4" />
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciamentoSetores;
