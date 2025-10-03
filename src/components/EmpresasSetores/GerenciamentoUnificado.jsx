import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Building2, Briefcase, Plus, Edit2, Trash2, Save, X, Users, Clock, BarChart3, Star, CheckCircle, AlertTriangle, DollarSign, Package, TrendingUp, Award, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

const GerenciamentoUnificado = ({ usuarioAtual }) => {
  const [abaAtiva, setAbaAtiva] = useState('empresas');
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [horariosPersonalizados, setHorariosPersonalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  
  // Estados para estatísticas do setor
  const [setorSelecionadoStats, setSetorSelecionadoStats] = useState('');
  const [estatisticas, setEstatisticas] = useState({
    funcionarios: [],
    inventario: [],
    tarefas: [],
    avaliacoes: [],
    loading: false
  });
  
  // Estados para controlar empresas expandidas
  const [empresasExpandidas, setEmpresasExpandidas] = useState({});
  
  // Função para toggle de empresa expandida
  const toggleEmpresa = (empresaId) => {
    setEmpresasExpandidas(prev => ({
      ...prev,
      [empresaId]: !prev[empresaId]
    }));
  };
  
  // Estados para nova empresa
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    ativo: true
  });

  // Estados para novo setor
  const [novoSetor, setNovoSetor] = useState({
    nome: '',
    empresaId: '',
    empresaNome: '',
    descricao: '',
    responsavel: '',
    ativo: true
  });

  // Estados para novo horário
  const [novoHorario, setNovoHorario] = useState({
    nome: '',
    descricao: '',
    setorId: '',
    setorNome: '',
    empresaId: '',
    criadoPor: '',
    ativo: true
  });

  // Verificar permissões
  const isAdmin = usuarioAtual?.nivel === 4;
  const isGerente = usuarioAtual?.nivel === 3 || 
                    usuarioAtual?.cargo?.toLowerCase().includes('gerente') ||
                    usuarioAtual?.cargo?.toLowerCase().includes('supervisor') ||
                    usuarioAtual?.cargo?.toLowerCase().includes('encarregado');
  
  const empresaUsuario = usuarioAtual?.empresaId || '';
  const setorUsuario = usuarioAtual?.setorId || '';

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (abaAtiva === 'setores' && empresaSelecionada) {
      carregarSetoresPorEmpresa(empresaSelecionada);
    } else if (abaAtiva === 'setores') {
      carregarSetores();
    }
  }, [abaAtiva, empresaSelecionada]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarEmpresas(),
        carregarSetores(),
        carregarHorarios()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarEmpresas = async () => {
    try {
      const empresasRef = collection(db, 'empresas');
      const snapshot = await getDocs(empresasRef);
      const empresasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filtrar empresas baseado nas permissões
      if (isAdmin) {
        setEmpresas(empresasData.filter(e => e.ativo !== false));
      } else if (isGerente && empresaUsuario) {
        setEmpresas(empresasData.filter(e => e.id === empresaUsuario && e.ativo !== false));
        setEmpresaSelecionada(empresaUsuario);
      } else {
        setEmpresas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar empresas');
    }
  };

  const carregarSetores = async () => {
    try {
      const setoresRef = collection(db, 'setores');
      let snapshot;
      
      // Filtrar setores baseado nas permissões
      if (isAdmin) {
        snapshot = await getDocs(setoresRef);
      } else if (isGerente && empresaUsuario) {
        const q = query(setoresRef, where('empresaId', '==', empresaUsuario));
        snapshot = await getDocs(q);
      } else {
        setSetores([]);
        return;
      }

      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSetores(setoresData.filter(s => s.ativo !== false));
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      toast.error('Erro ao carregar setores');
    }
  };

  const carregarSetoresPorEmpresa = async (empresaId) => {
    try {
      const setoresRef = collection(db, 'setores');
      const q = query(setoresRef, where('empresaId', '==', empresaId));
      const snapshot = await getDocs(q);
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSetores(setoresData.filter(s => s.ativo !== false));
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      toast.error('Erro ao carregar setores');
    }
  };

  const carregarHorarios = async () => {
    try {
      const horariosRef = collection(db, 'horarios_personalizados');
      let snapshot;
      
      // Filtrar horários baseado nas permissões
      if (isAdmin) {
        snapshot = await getDocs(horariosRef);
      } else if (isGerente && setorUsuario) {
        const q = query(horariosRef, where('setorId', '==', setorUsuario));
        snapshot = await getDocs(q);
      } else {
        setHorariosPersonalizados([]);
        return;
      }

      const horariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setHorariosPersonalizados(horariosData.filter(h => h.ativo !== false));
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários');
    }
  };

  // Carregar estatísticas do setor
  const carregarEstatisticasSetor = async (setorId) => {
    if (!setorId) return;

    try {
      setEstatisticas(prev => ({ ...prev, loading: true }));

      console.log('🔍 Carregando estatísticas para setor:', setorId);

      // Buscar dados em paralelo (incluindo ferramentas danificadas e perdidas)
      const [
        funcionariosSnap, 
        inventarioSnap, 
        tarefasSnap, 
        avaliacoesSnap,
        danificadasSnap,
        perdidasSnap
      ] = await Promise.all([
        getDocs(query(collection(db, 'funcionarios'), where('setorId', '==', setorId))),
        getDocs(collection(db, 'inventario')), // Inventário = Jardim
        getDocs(collection(db, 'tarefas')), // Tarefas não tem setorId direto
        getDocs(collection(db, 'avaliacoes')), // Avaliações não tem setorId direto
        getDocs(collection(db, 'ferramentas_danificadas')), // Ferramentas danificadas
        getDocs(collection(db, 'ferramentas_perdidas')) // Ferramentas perdidas
      ]);

      // Processar funcionários
      const funcionariosData = funcionariosSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(f => !f.demitido && f.setorId === setorId);

      const funcionariosIds = new Set(funcionariosData.map(f => f.id));

      console.log('👥 Funcionários do setor:', funcionariosData.length);

      // Processar inventário
      // NOTA: TODO inventário pertence ao "Jardim" por padrão
      const setorInfo = setores.find(s => s.id === setorId);
      const setorNome = setorInfo?.nome || '';
      
      let inventarioData = inventarioSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => {
          // Se o setor for "Jardim", mostrar TODOS os itens do inventário
          if (setorNome === 'Jardim' || setorId === 'jardim') {
            return true;
          }
          // Para outros setores, verificar se o item tem setor específico
          return item.setor === setorNome || 
                 item.setorId === setorId ||
                 item.setorNome === setorNome;
        });

      // Processar ferramentas danificadas (filter by sector name)
      const danificadasData = danificadasSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => {
          // Se for Jardim, mostrar TODAS as danificadas
          if (setorNome === 'Jardim' || setorId === 'jardim') {
            return true;
          }
          return item.setor === setorNome || item.setorNome === setorNome;
        });

      // Processar ferramentas perdidas (filter by sector name)
      const perdidasData = perdidasSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => {
          // Se for Jardim, mostrar TODAS as perdidas
          if (setorNome === 'Jardim' || setorId === 'jardim') {
            return true;
          }
          return item.setor === setorNome || item.setorNome === setorNome;
        });

      // Adicionar flags danificado/perdido aos itens do inventário existentes
      inventarioData = inventarioData.map(item => {
        const danificado = danificadasData.some(d => 
          d.nomeItem === item.nome || d.itemId === item.id
        );
        const perdido = perdidasData.some(p => 
          p.nomeItem === item.nome || p.itemId === item.id
        );
        return { ...item, danificado, perdido };
      });

      // Adicionar itens danificados que não estão no inventário
      danificadasData.forEach(d => {
        if (!inventarioData.find(i => i.nome === d.nomeItem || i.id === d.itemId)) {
          inventarioData.push({
            id: d.id,
            nome: d.nomeItem || 'Item desconhecido',
            categoria: d.categoria || 'Sem categoria',
            quantidade: 1,
            preco: d.custoReparacao || d.custoEstimado || 0,
            danificado: true,
            perdido: false,
            setor: setorNome,
            _origem: 'danificadas'
          });
        }
      });

      // Adicionar itens perdidos que não estão no inventário
      perdidasData.forEach(p => {
        if (!inventarioData.find(i => i.nome === p.nomeItem || i.id === p.itemId)) {
          inventarioData.push({
            id: p.id,
            nome: p.nomeItem || 'Item desconhecido',
            categoria: p.categoria || 'Sem categoria',
            quantidade: 1,
            preco: p.valorEstimado || 0,
            danificado: false,
            perdido: true,
            setor: setorNome,
            _origem: 'perdidas'
          });
        }
      });

      console.log('📦 Itens do inventário:', inventarioData.length);
      console.log('🔧 Itens danificados encontrados:', danificadasData.length);
      console.log('❌ Itens perdidos encontrados:', perdidasData.length);

      // Processar tarefas (filtrar por funcionários do setor)
      const tarefasData = tarefasSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(tarefa => {
          // Tarefa tem `funcionarioId` ou `colaboradorId`
          const funcId = tarefa.funcionarioId || tarefa.colaboradorId;
          return funcId && funcionariosIds.has(funcId);
        });

      console.log('✅ Tarefas do setor:', tarefasData.length);

      // Processar avaliações (filtrar por funcionários do setor)
      const avaliacoesData = avaliacoesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(avaliacao => {
          // Avaliação tem `funcionarioId`
          return avaliacao.funcionarioId && funcionariosIds.has(avaliacao.funcionarioId);
        });

      console.log('⭐ Avaliações do setor:', avaliacoesData.length);

      setEstatisticas({
        funcionarios: funcionariosData,
        inventario: inventarioData,
        tarefas: tarefasData,
        avaliacoes: avaliacoesData,
        loading: false
      });

      console.log('✅ Estatísticas carregadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas do setor');
      setEstatisticas(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (setorSelecionadoStats) {
      carregarEstatisticasSetor(setorSelecionadoStats);
    }
  }, [setorSelecionadoStats]);

  // CRUD Empresas
  const handleSubmitEmpresa = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.warning('Apenas administradores podem cadastrar empresas');
      return;
    }

    if (!novaEmpresa.nome.trim()) {
      toast.warning('Nome da empresa é obrigatório');
      return;
    }

    try {
      const empresasRef = collection(db, 'empresas');
      await addDoc(empresasRef, {
        ...novaEmpresa,
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });

      toast.success('Empresa cadastrada com sucesso!');
      setNovaEmpresa({
        nome: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
        ativo: true
      });
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      toast.error('Erro ao cadastrar empresa');
    }
  };

  const handleAtualizarEmpresa = async (empresaId) => {
    if (!isAdmin) {
      toast.warning('Apenas administradores podem editar empresas');
      return;
    }

    if (!novaEmpresa.nome.trim()) {
      toast.warning('Nome da empresa é obrigatório');
      return;
    }

    try {
      const empresaRef = doc(db, 'empresas', empresaId);
      await updateDoc(empresaRef, {
        ...novaEmpresa,
        dataAtualizacao: serverTimestamp()
      });

      toast.success('Empresa atualizada com sucesso!');
      handleCancelar();
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast.error('Erro ao atualizar empresa');
    }
  };

  const handleExcluirEmpresa = async (empresaId) => {
    if (!isAdmin) {
      toast.warning('Apenas administradores podem excluir empresas');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir esta empresa? Todos os setores vinculados serão afetados.')) {
      return;
    }

    try {
      const empresaRef = doc(db, 'empresas', empresaId);
      await deleteDoc(empresaRef);
      toast.success('Empresa excluída com sucesso!');
      carregarEmpresas();
      carregarSetores();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast.error('Erro ao excluir empresa');
    }
  };

  // CRUD Setores
  const handleSubmitSetor = async (e) => {
    e.preventDefault();
    
    if (!novoSetor.nome.trim()) {
      toast.warning('Nome do setor é obrigatório');
      return;
    }

    if (!novoSetor.empresaId) {
      toast.warning('Selecione uma empresa');
      return;
    }

    try {
      const setoresRef = collection(db, 'setores');
      const empresa = empresas.find(e => e.id === novoSetor.empresaId);
      
      await addDoc(setoresRef, {
        ...novoSetor,
        empresaNome: empresa?.nome || '',
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });

      toast.success('Setor cadastrado com sucesso!');
      setNovoSetor({
        nome: '',
        empresaId: isGerente ? empresaUsuario : '',
        empresaNome: '',
        descricao: '',
        responsavel: '',
        ativo: true
      });
      carregarSetores();
    } catch (error) {
      console.error('Erro ao cadastrar setor:', error);
      toast.error('Erro ao cadastrar setor');
    }
  };

  const handleAtualizarSetor = async (setorId) => {
    if (!novoSetor.nome.trim()) {
      toast.warning('Nome do setor é obrigatório');
      return;
    }

    try {
      const setorRef = doc(db, 'setores', setorId);
      const empresa = empresas.find(e => e.id === novoSetor.empresaId);
      
      await updateDoc(setorRef, {
        ...novoSetor,
        empresaNome: empresa?.nome || '',
        dataAtualizacao: serverTimestamp()
      });

      toast.success('Setor atualizado com sucesso!');
      handleCancelar();
      carregarSetores();
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      toast.error('Erro ao atualizar setor');
    }
  };

  const handleExcluirSetor = async (setorId) => {
    if (!window.confirm('Tem certeza que deseja excluir este setor? Todos os horários personalizados vinculados serão afetados.')) {
      return;
    }

    try {
      const setorRef = doc(db, 'setores', setorId);
      await deleteDoc(setorRef);
      toast.success('Setor excluído com sucesso!');
      carregarSetores();
      carregarHorarios();
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast.error('Erro ao excluir setor');
    }
  };

  // CRUD Horários Personalizados
  const handleSubmitHorario = async (e) => {
    e.preventDefault();
    
    if (!novoHorario.nome.trim()) {
      toast.warning('Nome do horário é obrigatório');
      return;
    }

    if (!novoHorario.descricao.trim()) {
      toast.warning('Período do horário é obrigatório');
      return;
    }

    if (!novoHorario.setorId) {
      toast.warning('Selecione um setor');
      return;
    }

    try {
      const horariosRef = collection(db, 'horarios_personalizados');
      const setor = setores.find(s => s.id === novoHorario.setorId);
      const empresa = empresas.find(e => e.id === novoHorario.empresaId);
      
      await addDoc(horariosRef, {
        ...novoHorario,
        setorNome: setor?.nome || '',
        empresaNome: empresa?.nome || '',
        criadoPor: usuarioAtual?.nome || usuarioAtual?.email || '',
        criadoPorId: usuarioAtual?.id || '',
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });

      toast.success(`Horário ${novoHorario.nome} criado com sucesso!`);
      setNovoHorario({
        nome: '',
        descricao: '',
        setorId: isGerente ? setorUsuario : '',
        setorNome: '',
        empresaId: isGerente ? empresaUsuario : '',
        criadoPor: '',
        ativo: true
      });
      carregarHorarios();
    } catch (error) {
      console.error('Erro ao criar horário:', error);
      toast.error('Erro ao criar horário');
    }
  };

  const handleAtualizarHorario = async (horarioId) => {
    if (!novoHorario.nome.trim() || !novoHorario.descricao.trim()) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const horarioRef = doc(db, 'horarios_personalizados', horarioId);
      const setor = setores.find(s => s.id === novoHorario.setorId);
      const empresa = empresas.find(e => e.id === novoHorario.empresaId);
      
      await updateDoc(horarioRef, {
        ...novoHorario,
        setorNome: setor?.nome || '',
        empresaNome: empresa?.nome || '',
        dataAtualizacao: serverTimestamp()
      });

      toast.success('Horário atualizado com sucesso!');
      handleCancelar();
      carregarHorarios();
    } catch (error) {
      console.error('Erro ao atualizar horário:', error);
      toast.error('Erro ao atualizar horário');
    }
  };

  const handleExcluirHorario = async (horarioId) => {
    if (!window.confirm('Tem certeza que deseja excluir este horário?')) {
      return;
    }

    try {
      const horarioRef = doc(db, 'horarios_personalizados', horarioId);
      await deleteDoc(horarioRef);
      toast.success('Horário excluído com sucesso!');
      carregarHorarios();
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast.error('Erro ao excluir horário');
    }
  };

  const handleEditar = (tipo, item) => {
    setEditando({ tipo, id: item.id });
    
    if (tipo === 'empresa') {
      setNovaEmpresa({
        nome: item.nome || '',
        cnpj: item.cnpj || '',
        endereco: item.endereco || '',
        telefone: item.telefone || '',
        email: item.email || '',
        ativo: item.ativo !== false
      });
    } else if (tipo === 'setor') {
      setNovoSetor({
        nome: item.nome || '',
        empresaId: item.empresaId || '',
        empresaNome: item.empresaNome || '',
        descricao: item.descricao || '',
        responsavel: item.responsavel || '',
        ativo: item.ativo !== false
      });
    } else if (tipo === 'horario') {
      setNovoHorario({
        nome: item.nome || '',
        descricao: item.descricao || '',
        setorId: item.setorId || '',
        setorNome: item.setorNome || '',
        empresaId: item.empresaId || '',
        criadoPor: item.criadoPor || '',
        ativo: item.ativo !== false
      });
    }
  };

  const handleCancelar = () => {
    setEditando(null);
    setNovaEmpresa({
      nome: '',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      ativo: true
    });
    setNovoSetor({
      nome: '',
      empresaId: isGerente ? empresaUsuario : '',
      empresaNome: '',
      descricao: '',
      responsavel: '',
      ativo: true
    });
    setNovoHorario({
      nome: '',
      descricao: '',
      setorId: isGerente ? setorUsuario : '',
      setorNome: '',
      empresaId: isGerente ? empresaUsuario : '',
      criadoPor: '',
      ativo: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filtrar setores para seleção de horários
  const setoresFiltrados = isGerente && empresaUsuario 
    ? setores.filter(s => s.empresaId === empresaUsuario)
    : setores;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          Gerenciamento Unificado
        </h1>
        <p className="text-blue-100 mt-2">
          {isAdmin ? 'Gerencie empresas, setores e horários personalizados' : 'Gerencie setores e horários do seu setor'}
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        {isAdmin && (
          <button
            onClick={() => setAbaAtiva('empresas')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-md transform hover:scale-105 ${
              abaAtiva === 'empresas'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/50'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Empresas
          </button>
        )}
        <button
          onClick={() => setAbaAtiva('setores')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-md transform hover:scale-105 ${
            abaAtiva === 'setores'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/50'
              : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Setores
        </button>
        {(isAdmin || isGerente) && (
          <button
            onClick={() => setAbaAtiva('horarios')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-md transform hover:scale-105 ${
              abaAtiva === 'horarios'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/50'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Clock className="w-5 h-5" />
            Horários Personalizados
          </button>
        )}
        {(isAdmin || isGerente) && (
          <button
            onClick={() => setAbaAtiva('estatisticas')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-md transform hover:scale-105 ${
              abaAtiva === 'estatisticas'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/50'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Estatísticas
          </button>
        )}
      </div>

      {/* Conteúdo das Abas */}
      {abaAtiva === 'empresas' && isAdmin && (
        <div className="space-y-6">
          {/* Formulário de Cadastro de Empresa */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-blue-200 dark:border-blue-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-600" />
              {editando?.tipo === 'empresa' ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
            </h2>
            <form onSubmit={editando?.tipo === 'empresa' ? (e) => { e.preventDefault(); handleAtualizarEmpresa(editando.id); } : handleSubmitEmpresa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    value={novaEmpresa.nome}
                    onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={novaEmpresa.cnpj}
                    onChange={(e) => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={novaEmpresa.telefone}
                    onChange={(e) => setNovaEmpresa({ ...novaEmpresa, telefone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={novaEmpresa.email}
                    onChange={(e) => setNovaEmpresa({ ...novaEmpresa, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={novaEmpresa.endereco}
                    onChange={(e) => setNovaEmpresa({ ...novaEmpresa, endereco: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg transform hover:scale-105"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {editando?.tipo === 'empresa' ? 'Atualizar' : 'Cadastrar'}
                </button>
                {editando?.tipo === 'empresa' && (
                  <button
                    type="button"
                    onClick={handleCancelar}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-bold"
                  >
                    <X className="w-5 h-5 inline mr-2" />
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de Empresas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Empresas Cadastradas ({empresas.length})
            </h2>
            <div className="space-y-3">
              {empresas.map(empresa => (
                <div
                  key={empresa.id}
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {empresa.nome}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {empresa.cnpj && <span className="mr-4">📋 {empresa.cnpj}</span>}
                      {empresa.telefone && <span className="mr-4">📞 {empresa.telefone}</span>}
                      {empresa.email && <span>📧 {empresa.email}</span>}
                    </div>
                    {empresa.endereco && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        📍 {empresa.endereco}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar('empresa', empresa)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md transform hover:scale-105"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExcluirEmpresa(empresa.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md transform hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {empresas.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhuma empresa cadastrada ainda
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'setores' && (
        <div className="space-y-6">
          {/* Filtro por Empresa (apenas para admin) */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Filtrar por Empresa
              </label>
              <select
                value={empresaSelecionada}
                onChange={(e) => setEmpresaSelecionada(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Empresas</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Formulário de Cadastro de Setor */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-blue-200 dark:border-blue-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-600" />
              {editando?.tipo === 'setor' ? 'Editar Setor' : 'Cadastrar Novo Setor'}
            </h2>
            <form onSubmit={editando?.tipo === 'setor' ? (e) => { e.preventDefault(); handleAtualizarSetor(editando.id); } : handleSubmitSetor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Setor *
                  </label>
                  <input
                    type="text"
                    value={novoSetor.nome}
                    onChange={(e) => setNovoSetor({ ...novoSetor, nome: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Empresa *
                  </label>
                  <select
                    value={novoSetor.empresaId}
                    onChange={(e) => setNovoSetor({ ...novoSetor, empresaId: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isGerente}
                  >
                    <option value="">Selecione uma empresa</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={novoSetor.responsavel}
                    onChange={(e) => setNovoSetor({ ...novoSetor, responsavel: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={novoSetor.descricao}
                    onChange={(e) => setNovoSetor({ ...novoSetor, descricao: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg transform hover:scale-105"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {editando?.tipo === 'setor' ? 'Atualizar' : 'Cadastrar'}
                </button>
                {editando?.tipo === 'setor' && (
                  <button
                    type="button"
                    onClick={handleCancelar}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-bold"
                  >
                    <X className="w-5 h-5 inline mr-2" />
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de Setores */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Setores Cadastrados ({setores.length})
            </h2>
            <div className="space-y-3">
              {setores.map(setor => (
                <div
                  key={setor.id}
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {setor.nome}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="mr-4">🏢 {setor.empresaNome}</span>
                      {setor.responsavel && <span className="mr-4">👤 {setor.responsavel}</span>}
                    </div>
                    {setor.descricao && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        📝 {setor.descricao}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar('setor', setor)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md transform hover:scale-105"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExcluirSetor(setor.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md transform hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {setores.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum setor cadastrado ainda
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'horarios' && (isAdmin || isGerente) && (
        <div className="space-y-6">
          {/* Formulário de Cadastro de Horário */}
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-100 dark:from-blue-900/30 dark:via-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 shadow-xl border-2 border-blue-300 dark:border-blue-600">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              {editando?.tipo === 'horario' ? 'Editar Horário Personalizado' : 'Criar Horário Personalizado'}
            </h2>
            <form onSubmit={editando?.tipo === 'horario' ? (e) => { e.preventDefault(); handleAtualizarHorario(editando.id); } : handleSubmitHorario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">
                    Nome do Horário *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: A, B, C"
                    value={novoHorario.nome}
                    onChange={(e) => setNovoHorario({ ...novoHorario, nome: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    maxLength="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">
                    Período *
                  </label>
                  <input
                    type="text"
                    placeholder="08:00-17:00"
                    value={novoHorario.descricao}
                    onChange={(e) => setNovoHorario({ ...novoHorario, descricao: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">
                    Setor *
                  </label>
                  <select
                    value={novoHorario.setorId}
                    onChange={(e) => {
                      const setor = setoresFiltrados.find(s => s.id === e.target.value);
                      setNovoHorario({ 
                        ...novoHorario, 
                        setorId: e.target.value,
                        empresaId: setor?.empresaId || ''
                      });
                    }}
                    className="w-full px-4 py-2.5 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    required
                    disabled={isGerente && setorUsuario}
                  >
                    <option value="">Selecione...</option>
                    {setoresFiltrados.map(setor => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nome} ({setor.empresaNome})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg hover:shadow-blue-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  ➕ {editando?.tipo === 'horario' ? 'Atualizar Horário' : 'Criar Horário Personalizado'}
                </button>
                {editando?.tipo === 'horario' && (
                  <button
                    type="button"
                    onClick={handleCancelar}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-bold"
                  >
                    <X className="w-5 h-5 inline mr-2" />
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de Horários Personalizados */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Horários Personalizados ({horariosPersonalizados.length})
            </h2>
            <div className="space-y-3">
              {horariosPersonalizados.map(horario => (
                <div
                  key={horario.id}
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg text-lg shadow-md">
                        {horario.nome}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {horario.descricao}
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="mr-4">🏢 {horario.empresaNome}</span>
                          <span className="mr-4">📦 {horario.setorNome}</span>
                          {horario.criadoPor && <span>👤 {horario.criadoPor}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar('horario', horario)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md transform hover:scale-105"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExcluirHorario(horario.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md transform hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {horariosPersonalizados.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum horário personalizado criado ainda
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aba de Estatísticas */}
      {abaAtiva === 'estatisticas' && (isAdmin || isGerente) && (
        <div className="space-y-6">
          {/* Lista de Empresas com Setores Expansíveis */}
          <div className="space-y-3">
            {empresas.map(empresa => {
              const setoresDaEmpresa = setores.filter(s => s.empresaId === empresa.id);
              const isExpanded = empresasExpandidas[empresa.id];

              return (
                <div key={empresa.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                  {/* Header da Empresa */}
                  <div
                    onClick={() => toggleEmpresa(empresa.id)}
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border-b-2 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-blue-600 transition-transform" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-blue-600 transition-transform" />
                      )}
                      <Building2 className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {empresa.nome}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {setoresDaEmpresa.length} {setoresDaEmpresa.length === 1 ? 'setor' : 'setores'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {empresa.cnpj && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
                          CNPJ: {empresa.cnpj}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Setores da Empresa (Expandível) */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 space-y-2">
                      {setoresDaEmpresa.length > 0 ? (
                        setoresDaEmpresa.map(setor => (
                          <div
                            key={setor.id}
                            onClick={() => setSetorSelecionadoStats(setor.id)}
                            className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all border-2 ${
                              setorSelecionadoStats === setor.id
                                ? 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-900/40 border-blue-500 shadow-md'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Briefcase className={`w-6 h-6 ${
                                setorSelecionadoStats === setor.id
                                  ? 'text-blue-600'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`} />
                              <div>
                                <h4 className={`font-bold ${
                                  setorSelecionadoStats === setor.id
                                    ? 'text-blue-900 dark:text-blue-200'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {setor.nome}
                                </h4>
                                {setor.responsavel && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    👤 {setor.responsavel}
                                  </p>
                                )}
                                {setor.descricao && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {setor.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                            {setorSelecionadoStats === setor.id && (
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600 animate-pulse" />
                                <span className="text-sm font-bold text-blue-600">
                                  Visualizando
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          Nenhum setor cadastrado nesta empresa
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {empresas.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Nenhuma empresa cadastrada
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Cadastre empresas na aba "Empresas" para visualizar estatísticas
                </p>
              </div>
            )}
          </div>

          {/* Divisor Visual */}
          {setorSelecionadoStats && (
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <BarChart3 className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Estatísticas Detalhadas</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
            </div>
          )}

          {estatisticas.loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!estatisticas.loading && setorSelecionadoStats && (() => {
            const setorInfo = setoresFiltrados.find(s => s.id === setorSelecionadoStats);
            const funcionariosAtivos = estatisticas.funcionarios.filter(f => !f.demitido);
            
            // Cálculos de avaliações
            const avaliacoesValidas = estatisticas.avaliacoes.filter(a => a.estrelas > 0);
            const mediaAvaliacoes = avaliacoesValidas.length > 0
              ? (avaliacoesValidas.reduce((sum, a) => sum + a.estrelas, 0) / avaliacoesValidas.length).toFixed(1)
              : 0;
            
            // Top 3 funcionários por avaliação
            const funcionariosPorAvaliacao = funcionariosAtivos.map(func => {
              const avaliacoesFuncionario = estatisticas.avaliacoes.filter(a => a.funcionarioId === func.id && a.estrelas > 0);
              const mediaFunc = avaliacoesFuncionario.length > 0
                ? avaliacoesFuncionario.reduce((sum, a) => sum + a.estrelas, 0) / avaliacoesFuncionario.length
                : 0;
              return {
                ...func,
                mediaAvaliacao: mediaFunc,
                totalAvaliacoes: avaliacoesFuncionario.length
              };
            }).filter(f => f.totalAvaliacoes > 0)
              .sort((a, b) => b.mediaAvaliacao - a.mediaAvaliacao)
              .slice(0, 3);
            
            // Cálculos de inventário
            const itensQuebrados = estatisticas.inventario.filter(item => item.danificado === true);
            const itensPerdidos = estatisticas.inventario.filter(item => item.perdido === true);
            const custoTotal = estatisticas.inventario.reduce((sum, item) => {
              const preco = parseFloat(item.preco) || 0;
              const quantidade = parseInt(item.quantidade) || 0;
              return sum + (preco * quantidade);
            }, 0);
            const custoPerdas = [...itensQuebrados, ...itensPerdidos].reduce((sum, item) => {
              const preco = parseFloat(item.preco) || 0;
              const quantidade = parseInt(item.quantidade) || 1;
              return sum + (preco * quantidade);
            }, 0);
            
            // Cálculos de tarefas
            const tarefasConcluidas = estatisticas.tarefas.filter(t => t.concluida === true).length;
            const tarefasPendentes = estatisticas.tarefas.filter(t => !t.concluida).length;
            const tarefasUrgentes = estatisticas.tarefas.filter(t => !t.concluida && t.prioridade === 'urgente').length;
            
            // Tarefas por funcionário
            const tarefasPorFuncionario = {};
            estatisticas.tarefas.forEach(tarefa => {
              const funcId = tarefa.funcionarioId;
              if (!tarefasPorFuncionario[funcId]) {
                tarefasPorFuncionario[funcId] = {
                  total: 0,
                  concluidas: 0,
                  pendentes: 0
                };
              }
              tarefasPorFuncionario[funcId].total++;
              if (tarefa.concluida) {
                tarefasPorFuncionario[funcId].concluidas++;
              } else {
                tarefasPorFuncionario[funcId].pendentes++;
              }
            });

            return (
              <>
                {/* Header com informações do setor */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    📊 Estatísticas - {setorInfo?.nome}
                  </h2>
                  <p className="text-blue-100">
                    {setorInfo?.empresaNome}
                    {setorInfo?.responsavel && ` • Responsável: ${setorInfo.responsavel}`}
                  </p>
                </div>

                {/* Cards de Resumo Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Funcionários */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{funcionariosAtivos.length}</span>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Funcionários Ativos</h3>
                  </div>

                  {/* Média de Avaliações */}
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Star className="w-8 h-8 opacity-80 fill-white" />
                      <span className="text-3xl font-bold">{mediaAvaliacoes}</span>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Média de Avaliações</h3>
                    <p className="text-xs opacity-75 mt-1">{avaliacoesValidas.length} avaliações</p>
                  </div>

                  {/* Custo do Inventário */}
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Package className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">
                        {custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Valor do Inventário</h3>
                    <p className="text-xs opacity-75 mt-1">{estatisticas.inventario.length} itens</p>
                  </div>

                  {/* Perdas */}
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <AlertTriangle className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">
                        {custoPerdas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Perdas e Danos</h3>
                    <p className="text-xs opacity-75 mt-1">
                      {itensQuebrados.length} quebrados, {itensPerdidos.length} perdidos
                    </p>
                  </div>
                </div>

                {/* Seção de Avaliações */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-500" />
                    🏆 Top 3 Funcionários por Avaliação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {funcionariosPorAvaliacao.map((func, index) => (
                      <div
                        key={func.id}
                        className={`rounded-xl p-5 border-2 ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400 dark:from-yellow-900/20 dark:to-yellow-800/20'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400 dark:from-gray-700/20 dark:to-gray-600/20'
                            : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400 dark:from-orange-900/20 dark:to-orange-800/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`text-3xl font-bold ${
                            index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">{func.nome}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{func.cargo}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.round(func.mediaAvaliacao)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-2xl font-bold text-gray-800 dark:text-white">
                            {func.mediaAvaliacao.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {func.totalAvaliacoes} avaliação{func.totalAvaliacoes !== 1 ? 'ões' : ''}
                        </p>
                      </div>
                    ))}
                    {funcionariosPorAvaliacao.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                        Nenhuma avaliação registrada ainda
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção de Inventário - Itens Danificados/Perdidos */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    Itens Danificados e Perdidos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Itens Quebrados */}
                    <div>
                      <h4 className="font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                        🔧 Itens Danificados ({itensQuebrados.length})
                      </h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {itensQuebrados.length > 0 ? (
                          itensQuebrados.map(item => (
                            <div
                              key={item.id}
                              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-bold text-gray-900 dark:text-white">{item.nome}</h5>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Código: {item.codigo || 'N/A'}
                                  </p>
                                </div>
                                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                  {parseFloat(item.preco || 0).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  })}
                                </span>
                              </div>
                              {item.observacoes && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                  📝 {item.observacoes}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            Nenhum item danificado
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Itens Perdidos */}
                    <div>
                      <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                        🔍 Itens Perdidos ({itensPerdidos.length})
                      </h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {itensPerdidos.length > 0 ? (
                          itensPerdidos.map(item => (
                            <div
                              key={item.id}
                              className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-bold text-gray-900 dark:text-white">{item.nome}</h5>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Código: {item.codigo || 'N/A'}
                                  </p>
                                </div>
                                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                  {parseFloat(item.preco || 0).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  })}
                                </span>
                              </div>
                              {item.observacoes && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                  📝 {item.observacoes}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            Nenhum item perdido
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção de Tarefas */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Tarefas da Equipe
                  </h3>
                  
                  {/* Resumo das Tarefas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
                      <div className="flex items-center justify-between">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                          {tarefasConcluidas}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300 mt-2">
                        Tarefas Concluídas
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700">
                      <div className="flex items-center justify-between">
                        <Clock className="w-8 h-8 text-blue-600" />
                        <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                          {tarefasPendentes}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mt-2">
                        Tarefas Pendentes
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border-2 border-red-300 dark:border-red-700">
                      <div className="flex items-center justify-between">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                        <span className="text-3xl font-bold text-red-700 dark:text-red-400">
                          {tarefasUrgentes}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300 mt-2">
                        Tarefas Urgentes
                      </p>
                    </div>
                  </div>

                  {/* Lista de Tarefas por Funcionário */}
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-white mb-3">
                      Tarefas por Funcionário
                    </h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {funcionariosAtivos
                        .filter(func => tarefasPorFuncionario[func.id])
                        .sort((a, b) => {
                          const statsA = tarefasPorFuncionario[a.id];
                          const statsB = tarefasPorFuncionario[b.id];
                          return statsB.total - statsA.total;
                        })
                        .map(func => {
                          const stats = tarefasPorFuncionario[func.id];
                          const percentualConclusao = ((stats.concluidas / stats.total) * 100).toFixed(0);
                          
                          return (
                            <div
                              key={func.id}
                              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h5 className="font-bold text-gray-900 dark:text-white">{func.nome}</h5>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{func.cargo}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {stats.total}
                                  </span>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">tarefas</p>
                                </div>
                              </div>
                              
                              {/* Barra de Progresso */}
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  <span>Progresso</span>
                                  <span className="font-bold">{percentualConclusao}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                                    style={{ width: `${percentualConclusao}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-green-100 dark:bg-green-900/30 rounded px-2 py-1 text-center">
                                  <span className="font-bold text-green-700 dark:text-green-400">
                                    ✓ {stats.concluidas}
                                  </span>
                                  <span className="text-green-600 dark:text-green-500 ml-1">concluídas</span>
                                </div>
                                <div className="bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1 text-center">
                                  <span className="font-bold text-blue-700 dark:text-blue-400">
                                    ⏳ {stats.pendentes}
                                  </span>
                                  <span className="text-blue-600 dark:text-blue-500 ml-1">pendentes</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {Object.keys(tarefasPorFuncionario).length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          Nenhuma tarefa registrada ainda
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {!setorSelecionadoStats && !estatisticas.loading && empresas.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-12 text-center border-2 border-dashed border-blue-300 dark:border-blue-700">
              <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-2">
                👆 Selecione um setor para visualizar estatísticas
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                Clique na empresa acima para expandir e escolher um setor
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm">
                <Building2 className="w-4 h-4" />
                <span>→</span>
                <Briefcase className="w-4 h-4" />
                <span>→</span>
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GerenciamentoUnificado;


