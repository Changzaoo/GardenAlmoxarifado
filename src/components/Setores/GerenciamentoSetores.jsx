import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  // Cache para evitar recarregamentos desnecessários
  const cacheRef = useRef({
    lastUpdate: null,
    ttl: 5 * 60 * 1000 // 5 minutos de cache
  });

  // Estados para dados financeiros
  const [inventario, setInventario] = useState([]);
  const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
  const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);

  // Estados de modais
  const [modalSetor, setModalSetor] = useState(false);
  const [modalHorario, setModalHorario] = useState(false);
  const [modalTransferencia, setModalTransferencia] = useState(false);
  const [modalTarefa, setModalTarefa] = useState(false);
  const [modalEditarFuncionario, setModalEditarFuncionario] = useState(false);
  const [modalCriarFuncionario, setModalCriarFuncionario] = useState(false);
  const [modalExcluirFuncionario, setModalExcluirFuncionario] = useState(false);
  const [funcionarioTransferencia, setFuncionarioTransferencia] = useState(null);
  const [funcionarioTarefa, setFuncionarioTarefa] = useState(null);
  const [funcionarioEdicao, setFuncionarioEdicao] = useState(null);
  const [funcionarioExclusao, setFuncionarioExclusao] = useState(null);
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
  const [formFuncionario, setFormFuncionario] = useState({ nome: '', cargo: '' });
  const [formNovoFuncionario, setFormNovoFuncionario] = useState({ 
    nome: '', 
    cargo: '', 
    telefone: '',
    status: 'ativo'
  });
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

  // Função para invalidar cache
  const invalidarCache = () => {
    cacheRef.current.lastUpdate = null;
  };

  // Função para carregar dados financeiros - otimizada
  const carregarDadosFinanceiros = async () => {
    try {
      // Carregar todas as collections financeiras em paralelo
      const [inventarioSnap, danificadasSnap, perdidasSnap] = await Promise.all([
        getDocs(collection(db, 'inventario')),
        getDocs(collection(db, 'ferramentas_danificadas')),
        getDocs(collection(db, 'ferramentas_perdidas'))
      ]);

      const inventarioData = inventarioSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const danificadasData = danificadasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const perdidasData = perdidasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setInventario(inventarioData);
      setFerramentasDanificadas(danificadasData);
      setFerramentasPerdidas(perdidasData);

      return { inventarioData, danificadasData, perdidasData };
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      return { inventarioData: [], danificadasData: [], perdidasData: [] };
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

  // Função utilitária para gerar URL de avatar padrão
  const getAvatarUrl = (nome) => {
    if (!nome) return null;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=3b82f6&color=fff&size=200&bold=true`;
  };

  // Função para carregar funcionários - otimizada
  const carregarFuncionarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'funcionarios'));
      const funcionariosData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Se não tiver foto, gerar uma com base no nome
          fotoPerfil: data.fotoPerfil || getAvatarUrl(data.nome)
        };
      });
      setFuncionarios(funcionariosData);
      return funcionariosData;
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast.error('Erro ao carregar funcionários');
      return [];
    }
  };

  // Função para carregar tarefas - otimizada
  const carregarTarefas = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'tarefas'));
      const tarefasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTarefas(tarefasData);
      return tarefasData;
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      return [];
    }
  };

  // Função para carregar pontos - otimizada
  const carregarPontos = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'pontos'));
      const pontosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPontos(pontosData);
      return pontosData;
    } catch (error) {
      console.error('Erro ao carregar pontos:', error);
      return [];
    }
  };

  // Função para carregar avaliações - otimizada
  const carregarAvaliacoes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'avaliacoes'));
      const avaliacoesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvaliacoes(avaliacoesData);
      return avaliacoesData;
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      return [];
    }
  };

  // Função para carregar registros de ponto - otimizada
  const carregarRegistrosPonto = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'registros_ponto'));
      const registrosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistrosPonto(registrosData);
      return registrosData;
    } catch (error) {
      console.error('Erro ao carregar registros de ponto:', error);
      return [];
    }
  };

  // Carregar dados iniciais com otimização
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoading(true);
      const startTime = Date.now();
      const minLoadingTime = 800; // Tempo mínimo de loading (800ms)
      
      try {
        console.log('🚀 Iniciando carregamento de dados...');
        
        // Carregar todos os dados em paralelo para máxima performance
        const loadingPromises = [
          carregarDadosFinanceiros().then(() => console.log('✓ Dados financeiros carregados')),
          carregarSetores().then(() => console.log('✓ Setores carregados')),
          carregarFuncionarios().then(() => console.log('✓ Funcionários carregados')),
          carregarTarefas().then(() => console.log('✓ Tarefas carregadas')),
          carregarPontos().then(() => console.log('✓ Pontos carregados')),
          carregarAvaliacoes().then(() => console.log('✓ Avaliações carregadas')),
          carregarRegistrosPonto().then(() => console.log('✓ Registros de ponto carregados'))
        ];

        await Promise.all(loadingPromises);

        // Calcular tempo decorrido
        const elapsedTime = Date.now() - startTime;
        console.log(`⚡ Dados carregados em ${elapsedTime}ms`);
        
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        // Se carregou muito rápido, aguardar o tempo mínimo para evitar flash
        if (remainingTime > 0) {
          console.log(`⏱️ Aguardando ${remainingTime}ms para transição suave...`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        console.log('✅ Carregamento completo!');
      } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
        toast.error('Erro ao carregar dados. Tente novamente.');
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

  // Funções de carregamento - otimizadas
  const carregarSetores = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'setores'));
      const setoresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const setoresAtivos = setoresData.filter(s => s.ativo !== false);
      setSetores(setoresAtivos);
      return setoresAtivos;
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      toast.error('Erro ao carregar setores');
      return [];
    }
  };

  const carregarHorarios = async (setorId) => {
    try {
      const snapshot = await getDocs(collection(db, 'horarios_personalizados'));
      const horariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filtrar horários do setor - otimizado
      const horariosSetor = horariosData.filter(h => h.setorId === setorId && h.ativo !== false);
      setHorarios(horariosSetor);
      return horariosSetor;
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários');
      return [];
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
      invalidarCache();
      // Recarregar apenas setores e dados financeiros em paralelo
      await Promise.all([
        carregarSetores(),
        carregarDadosFinanceiros()
      ]);
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
      invalidarCache();
      // Recarregar apenas setores e dados financeiros em paralelo
      await Promise.all([
        carregarSetores(),
        carregarDadosFinanceiros()
      ]);
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

  // Função para abrir modal de edição de funcionário
  const abrirModalEditarFuncionario = (funcionario) => {
    setFuncionarioEdicao(funcionario);
    setFormFuncionario({
      nome: funcionario.nome || '',
      cargo: funcionario.cargo || ''
    });
    setModalEditarFuncionario(true);
  };

  // Função para atualizar dados do funcionário
  const handleAtualizarFuncionario = async (e) => {
    e.preventDefault();
    
    if (!funcionarioEdicao) {
      toast.warning('Funcionário não selecionado');
      return;
    }

    if (!formFuncionario.nome.trim()) {
      toast.warning('Nome é obrigatório');
      return;
    }

    try {
      const funcionarioRef = doc(db, 'funcionarios', funcionarioEdicao.id);
      await updateDoc(funcionarioRef, {
        nome: formFuncionario.nome.trim(),
        cargo: formFuncionario.cargo.trim(),
        dataAtualizacao: serverTimestamp(),
        atualizadoPor: usuarioAtual?.nome || usuarioAtual?.email
      });

      toast.success('Funcionário atualizado com sucesso!');
      setModalEditarFuncionario(false);
      setFuncionarioEdicao(null);
      setFormFuncionario({ nome: '', cargo: '' });
      await carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      toast.error('Erro ao atualizar funcionário');
    }
  };

  // Função para abrir modal de criar funcionário
  const abrirModalCriarFuncionario = () => {
    if (!setorSelecionado) {
      toast.warning('Selecione um setor primeiro');
      return;
    }
    setFormNovoFuncionario({ 
      nome: '', 
      cargo: '', 
      telefone: '',
      status: 'ativo'
    });
    setModalCriarFuncionario(true);
  };

  // Função para criar novo funcionário
  const handleCriarFuncionario = async (e) => {
    e.preventDefault();
    
    if (!setorSelecionado) {
      toast.warning('Selecione um setor primeiro');
      return;
    }

    if (!formNovoFuncionario.nome.trim()) {
      toast.warning('Nome é obrigatório');
      return;
    }

    try {
      // Gerar avatar padrão com as iniciais
      const iniciais = formNovoFuncionario.nome.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const coresAvatar = [
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(formNovoFuncionario.nome) + '&background=3b82f6&color=fff&size=200&bold=true',
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(formNovoFuncionario.nome) + '&background=06b6d4&color=fff&size=200&bold=true',
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(formNovoFuncionario.nome) + '&background=8b5cf6&color=fff&size=200&bold=true',
      ];
      const avatarUrl = coresAvatar[Math.floor(Math.random() * coresAvatar.length)];

      await addDoc(collection(db, 'funcionarios'), {
        nome: formNovoFuncionario.nome.trim(),
        cargo: formNovoFuncionario.cargo.trim(),
        telefone: formNovoFuncionario.telefone.trim(),
        setor: setorSelecionado.nome,
        setorNome: setorSelecionado.nome,
        setorId: setorSelecionado.id,
        status: formNovoFuncionario.status,
        fotoPerfil: avatarUrl,
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp(),
        criadoPor: usuarioAtual?.nome || usuarioAtual?.email
      });

      toast.success('Funcionário criado com sucesso!');
      setModalCriarFuncionario(false);
      setFormNovoFuncionario({ 
        nome: '', 
        cargo: '', 
        telefone: '',
        status: 'ativo'
      });
      await carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      toast.error('Erro ao criar funcionário');
    }
  };

  // Função para abrir modal de excluir funcionário
  const abrirModalExcluirFuncionario = (funcionario) => {
    setFuncionarioExclusao(funcionario);
    setModalExcluirFuncionario(true);
  };

  // Função para excluir funcionário
  const handleExcluirFuncionario = async () => {
    if (!funcionarioExclusao) {
      toast.warning('Funcionário não selecionado');
      return;
    }

    try {
      await deleteDoc(doc(db, 'funcionarios', funcionarioExclusao.id));
      toast.success('Funcionário excluído com sucesso!');
      setModalExcluirFuncionario(false);
      setFuncionarioExclusao(null);
      await carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      toast.error('Erro ao excluir funcionário');
    }
  };

  // Função para calcular estatísticas do funcionário - otimizada com cache
  const calcularEstatisticasFuncionario = useMemo(() => {
    // Criar um cache de estatísticas para evitar recálculos
    const statsCache = new Map();
    
    return (funcionarioId) => {
      // Verificar se já está no cache
      if (statsCache.has(funcionarioId)) {
        return statsCache.get(funcionarioId);
      }

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

      // Empréstimos ativos
      const emprestimosAtivos = 0;

      const stats = {
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

      // Armazenar no cache
      statsCache.set(funcionarioId, stats);
      return stats;
    };
  }, [pontos, avaliacoes, tarefas, registrosPonto]); // Recalcular apenas quando esses dados mudarem

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
    setFormFuncionario({ nome: '', cargo: '' });
    setModalSetor(false);
    setModalHorario(false);
    setModalEditarFuncionario(false);
    setFuncionarioEdicao(null);
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-800 dark:via-blue-900 dark:to-blue-950 rounded-2xl p-6 sm:p-8 shadow-xl animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl"></div>
            <div className="flex-1">
              <div className="h-8 bg-white/20 rounded-lg w-3/4 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/10 rounded-xl p-4 h-24"></div>
            ))}
          </div>
        </div>

        {/* Setores Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl h-32"></div>
            ))}
          </div>
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
            Carregando dados...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Aguarde enquanto organizamos tudo para você
          </p>
        </div>
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
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 md:mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                      Funcionários do Setor
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      {/* Botão Novo Funcionário */}
                      {isAdmin && (
                        <button
                          onClick={abrirModalCriarFuncionario}
                          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg hover:shadow-xl min-h-[44px]"
                          title="Adicionar Funcionário"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="font-semibold hidden sm:inline">Novo Funcionário</span>
                          <span className="font-semibold sm:hidden">Novo</span>
                        </button>
                      )}
                      
                      {/* Toggle Visualização */}
                      <div className="flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => setVisualizacao('card')}
                          className={`p-1.5 md:p-2 rounded-md transition-all ${
                            visualizacao === 'card'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title="Visualização em Cards"
                        >
                          <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                          onClick={() => setVisualizacao('lista')}
                          className={`p-1.5 md:p-2 rounded-md transition-all ${
                            visualizacao === 'lista'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title="Visualização em Lista"
                        >
                          <List className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filtros e Ordenação */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                    {/* Filtro por Nome */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={filtroNome}
                        onChange={(e) => setFiltroNome(e.target.value)}
                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Filtro por Status */}
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="todos">Todos os status</option>
                      <option value="ativo">Ativos</option>
                      <option value="inativo">Inativos</option>
                    </select>

                    {/* Ordenação */}
                    <div className="relative">
                      <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                      <select
                        value={ordenacao}
                        onChange={(e) => setOrdenacao(e.target.value)}
                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="alfabetica">Ordem Alfabética</option>
                        <option value="pontos">Maior Pontuação</option>
                        <option value="avaliacao">Melhor Avaliação</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 space-y-3">
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
                            <div className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                              {/* Foto */}
                              <SafeImage
                                src={funcionario.fotoPerfil}
                                alt={funcionario.nome}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border-2 border-blue-300 dark:border-blue-600 flex-shrink-0"
                                fallback={
                                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center border-2 border-blue-300 dark:border-blue-600">
                                    <User className="w-7 h-7 md:w-8 md:h-8 text-white" />
                                  </div>
                                }
                              />
                              
                              {/* Informações Principais */}
                              <div className="flex-1 min-w-0 w-full">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">{funcionario.nome}</h4>
                                    {funcionario.cargo && (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Briefcase className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">{funcionario.cargo}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Badge de Status */}
                                  {funcionario.status && (
                                    <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                      funcionario.status === 'ativo' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {funcionario.status === 'ativo' ? '✓ Ativo' : '✗ Inativo'}
                                    </span>
                                  )}
                                </div>

                                {/* Informações de Contato */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
                                  {funcionario.email && (
                                    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                      <Mail className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                                      <span className="truncate">{funcionario.email}</span>
                                    </div>
                                  )}
                                  {funcionario.telefone && (
                                    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                      <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                                      <span className="truncate">{funcionario.telefone}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Estatísticas em Grid Horizontal - Responsivo */}
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-1.5 md:p-2 border border-teal-200 dark:border-teal-800">
                                    <div className="flex items-center gap-1 md:gap-1.5">
                                      <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-medium truncate">Pontos</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">{stats.pontos}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-1.5 md:p-2 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-1 md:gap-1.5">
                                      <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate">Aval.</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">{stats.avaliacaoMedia}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-1.5 md:p-2 border border-rose-200 dark:border-rose-800">
                                    <div className="flex items-center gap-1 md:gap-1.5">
                                      <AlertOctagon className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium truncate">Horas-</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">{stats.horasNegativas}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 md:p-2 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-1 md:gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">Tarefas</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">{stats.tarefasConcluidas}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1.5 md:p-2 border border-purple-200 dark:border-purple-800 col-span-3 sm:col-span-1">
                                    <div className="flex items-center gap-1 md:gap-1.5">
                                      <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate">Emprés.</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">{stats.emprestimosAtivos || 0}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Botões de Ação - Responsivo */}
                              <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                                <button
                                  onClick={() => abrirModalEditarFuncionario(funcionario)}
                                  className="flex-1 sm:flex-none min-h-[44px] p-2.5 md:p-3 bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-xl transition-all flex items-center justify-center gap-2"
                                  title="Editar Funcionário"
                                >
                                  <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                                  <span className="sm:hidden text-sm font-medium">Editar</span>
                                </button>
                                <button
                                  onClick={() => abrirModalTarefa(funcionario)}
                                  className="flex-1 sm:flex-none min-h-[44px] p-2.5 md:p-3 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl transition-all flex items-center justify-center gap-2"
                                  title="Criar Tarefa"
                                >
                                  <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
                                  <span className="sm:hidden text-sm font-medium">Tarefa</span>
                                </button>
                                {isAdmin && (
                                  <>
                                    <button
                                      onClick={() => abrirModalTransferencia(funcionario)}
                                      className="flex-1 sm:flex-none min-h-[44px] p-2.5 md:p-3 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl transition-all flex items-center justify-center gap-2"
                                      title="Transferir de setor"
                                    >
                                      <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5" />
                                      <span className="sm:hidden text-sm font-medium">Transferir</span>
                                    </button>
                                    <button
                                      onClick={() => abrirModalExcluirFuncionario(funcionario)}
                                      className="flex-1 sm:flex-none min-h-[44px] p-2.5 md:p-3 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-600 dark:text-red-400 rounded-xl transition-all flex items-center justify-center gap-2"
                                      title="Excluir Funcionário"
                                    >
                                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                      <span className="sm:hidden text-sm font-medium">Excluir</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Visualização em Card - Responsiva
                      return (
                        <div
                          key={funcionario.id}
                          className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-700 dark:border-gray-600"
                        >
                          {/* Header com Foto e Nome */}
                          <div className="p-3 md:p-4 border-b border-gray-700 dark:border-gray-600 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                              <SafeImage
                                src={funcionario.fotoPerfil}
                                alt={funcionario.nome}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover border-2 border-cyan-500 dark:border-cyan-400 flex-shrink-0"
                                fallback={
                                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center border-2 border-cyan-500 dark:border-cyan-400">
                                    <User className="w-6 h-6 md:w-7 md:h-7 text-white" />
                                  </div>
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base md:text-lg font-bold text-white truncate">{funcionario.nome}</h4>
                                {funcionario.cargo && (
                                  <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                                    <Briefcase className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400" />
                                    <span className="text-xs md:text-sm text-cyan-400 font-medium truncate">{funcionario.cargo}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Badge de Status */}
                            {funcionario.status && (
                              <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${
                                funcionario.status === 'ativo' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              }`}>
                                {funcionario.status === 'ativo' ? '✓ Ativo' : '✗ Inativo'}
                              </span>
                            )}
                          </div>

                          {/* Estatísticas Detalhadas - Grid Responsivo */}
                          <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                            {/* Pontos */}
                            <div className="bg-gradient-to-r from-teal-900/40 to-teal-800/40 rounded-xl md:rounded-2xl p-3 md:p-4 border border-teal-700/50 hover:border-teal-600/50 transition-all">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-600/30 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Award className="w-5 h-5 md:w-6 md:h-6 text-teal-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-teal-400 uppercase tracking-wider">Pontos</p>
                                  <p className="text-xl md:text-2xl font-bold text-white truncate">{stats.pontos} <span className="text-xs md:text-sm text-teal-400">pts</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Avaliação */}
                            <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-xl md:rounded-2xl p-3 md:p-4 border border-amber-700/50 hover:border-amber-600/50 transition-all">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-600/30 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Star className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Avaliação</p>
                                  <p className="text-xl md:text-2xl font-bold text-white truncate">{stats.avaliacaoMedia} <span className="text-xs md:text-sm text-amber-400">⭐</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Horas Negativas */}
                            <div className="bg-gradient-to-r from-rose-900/40 to-red-900/40 rounded-xl md:rounded-2xl p-3 md:p-4 border border-rose-700/50 hover:border-rose-600/50 transition-all">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-600/30 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                                  <AlertOctagon className="w-5 h-5 md:w-6 md:h-6 text-rose-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-rose-400 uppercase tracking-wider">Horas Negativas</p>
                                  <p className="text-2xl font-bold text-white">{stats.horasNegativas || '0h 0m'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Tarefas */}
                            <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-xl md:rounded-2xl p-3 md:p-4 border border-blue-700/50 hover:border-blue-600/50 transition-all">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/30 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Tarefas</p>
                                  <p className="text-xl md:text-2xl font-bold text-white truncate">{stats.tarefasConcluidas} <span className="text-xs md:text-sm text-blue-400">concluídas</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Empréstimos */}
                            <div className="bg-gradient-to-r from-purple-900/40 to-violet-900/40 rounded-xl md:rounded-2xl p-3 md:p-4 border border-purple-700/50 hover:border-purple-600/50 transition-all md:col-span-2">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600/30 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">Empréstimos</p>
                                  <p className="text-xl md:text-2xl font-bold text-white truncate">{stats.emprestimosAtivos || 0} <span className="text-xs md:text-sm text-purple-400">ativos</span></p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer com Botões de Ação - Responsivo */}
                          <div className="p-3 md:p-4 border-t border-gray-700 dark:border-gray-600 flex gap-2">
                            <button
                              onClick={() => abrirModalEditarFuncionario(funcionario)}
                              className="min-h-[44px] py-2.5 px-3 md:px-4 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => abrirModalTarefa(funcionario)}
                              className="flex-1 min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                              <ClipboardList className="w-4 h-4" />
                              <span className="text-sm md:text-base">Criar Tarefa</span>
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => abrirModalTransferencia(funcionario)}
                                  className="min-h-[44px] py-2.5 px-3 md:px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center"
                                  title="Transferir"
                                >
                                  <ArrowRightLeft className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => abrirModalExcluirFuncionario(funcionario)}
                                  className="min-h-[44px] py-2.5 px-3 md:px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-gray-900 [&>option]:dark:text-white [&>option:hover]:bg-blue-50 [&>option:hover]:dark:bg-gray-600"
                  required
                >
                  <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Selecione o setor de destino</option>
                  {setores
                    .filter(s => s.id !== setorSelecionado?.id)
                    .map(setor => (
                      <option key={setor.id} value={setor.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-600">
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

      {/* Modal Editar Funcionário */}
      {modalEditarFuncionario && funcionarioEdicao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Edit2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Editar Funcionário
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Atualizar informações de <strong>{funcionarioEdicao.nome}</strong>
              </p>
            </div>
            
            <form onSubmit={handleAtualizarFuncionario} className="p-6 space-y-4">
              {/* Foto do Funcionário */}
              <div className="flex justify-center mb-2">
                <SafeImage
                  src={funcionarioEdicao.fotoPerfil}
                  alt={funcionarioEdicao.nome}
                  className="w-24 h-24 rounded-full object-cover border-4 border-cyan-300 dark:border-cyan-600 shadow-lg"
                  fallback={
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center border-4 border-cyan-300 dark:border-cyan-600 shadow-lg">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  }
                />
              </div>

              {/* Nome do Funcionário */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formFuncionario.nome}
                  onChange={(e) => setFormFuncionario({...formFuncionario, nome: e.target.value})}
                  placeholder="Digite o nome completo"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formFuncionario.cargo}
                  onChange={(e) => setFormFuncionario({...formFuncionario, cargo: e.target.value})}
                  placeholder="Digite o cargo (ex: Jardineiro, Supervisor)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Informações do Setor */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Informações Atuais</p>
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Setor:</span> {setorSelecionado?.nome}</p>
                  <p><span className="font-medium">Status:</span> {funcionarioEdicao.status === 'ativo' ? '✓ Ativo' : '✗ Inativo'}</p>
                </div>
              </div>

              {/* Botões */}
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
                  className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Funcionário */}
      {modalCriarFuncionario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
              <div className="flex items-center gap-3 mb-2">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Novo Funcionário
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adicionar funcionário ao setor <strong>{setorSelecionado?.nome}</strong>
              </p>
            </div>
            
            <form onSubmit={handleCriarFuncionario} className="p-6 space-y-4">
              {/* Nome do Funcionário */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formNovoFuncionario.nome}
                  onChange={(e) => setFormNovoFuncionario({...formNovoFuncionario, nome: e.target.value})}
                  placeholder="Digite o nome completo"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formNovoFuncionario.cargo}
                  onChange={(e) => setFormNovoFuncionario({...formNovoFuncionario, cargo: e.target.value})}
                  placeholder="Ex: Jardineiro, Supervisor, Porteiro"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formNovoFuncionario.telefone}
                  onChange={(e) => setFormNovoFuncionario({...formNovoFuncionario, telefone: e.target.value})}
                  placeholder="(11) 98765-4321"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Status Inicial
                </label>
                <select
                  value={formNovoFuncionario.status}
                  onChange={(e) => setFormNovoFuncionario({...formNovoFuncionario, status: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="ativo">✓ Ativo</option>
                  <option value="inativo">✗ Inativo</option>
                </select>
              </div>

              {/* Informações do Setor */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Setor de Alocação</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">{setorSelecionado?.nome}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  O funcionário será automaticamente vinculado a este setor
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalCriarFuncionario(false);
                    setFormNovoFuncionario({ 
                      nome: '', 
                      cargo: '', 
                      telefone: '',
                      status: 'ativo'
                    });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Criar Funcionário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir Funcionário */}
      {modalExcluirFuncionario && funcionarioExclusao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Confirmar Exclusão
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Esta ação não pode ser desfeita
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Informações do Funcionário */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <SafeImage
                    src={funcionarioExclusao.fotoPerfil}
                    alt={funcionarioExclusao.nome}
                    className="w-16 h-16 rounded-full object-cover border-2 border-red-300 dark:border-red-600"
                    fallback={
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center border-2 border-red-300 dark:border-red-600">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{funcionarioExclusao.nome}</p>
                    {funcionarioExclusao.cargo && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{funcionarioExclusao.cargo}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Setor: {funcionarioExclusao.setor || funcionarioExclusao.setorNome}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviso */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                      Tem certeza que deseja excluir este funcionário?
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      Todos os dados relacionados (tarefas, pontos, avaliações) permanecerão no sistema, mas o funcionário será removido permanentemente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalExcluirFuncionario(false);
                    setFuncionarioExclusao(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExcluirFuncionario}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciamentoSetores;
