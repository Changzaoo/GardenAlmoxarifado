import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Building2, Briefcase, Plus, Edit2, Trash2, Save, X, Users, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { isAdmin as checkIsAdmin, hasManagementPermission } from '../../constants/permissoes';

const GerenciamentoUnificado = ({ usuarioAtual }) => {
  const [abaAtiva, setAbaAtiva] = useState('empresas');
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [horariosPersonalizados, setHorariosPersonalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  
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

  // Verificar permissões usando o sistema correto
  const isAdmin = checkIsAdmin(usuarioAtual?.nivel) || hasManagementPermission(usuarioAtual?.nivel);
  const isGerente = hasManagementPermission(usuarioAtual?.nivel) || 
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          Gerenciamento Unificado
        </h1>
        <p className="text-purple-100 mt-2">
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
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/50'
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
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/50'
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
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/50'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Clock className="w-5 h-5" />
            Horários Personalizados
          </button>
        )}
      </div>

      {/* Conteúdo das Abas */}
      {abaAtiva === 'empresas' && isAdmin && (
        <div className="space-y-6">
          {/* Formulário de Cadastro de Empresa */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-purple-600" />
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-bold shadow-lg transform hover:scale-105"
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
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todas as Empresas</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Formulário de Cadastro de Setor */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-purple-600" />
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-bold shadow-lg transform hover:scale-105"
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
          <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-purple-900/30 dark:via-indigo-900/30 dark:to-purple-800/30 rounded-xl p-6 shadow-xl border-2 border-purple-300 dark:border-purple-600">
            <h2 className="text-xl font-bold text-purple-900 dark:text-purple-200 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              {editando?.tipo === 'horario' ? 'Editar Horário Personalizado' : 'Criar Horário Personalizado'}
            </h2>
            <form onSubmit={editando?.tipo === 'horario' ? (e) => { e.preventDefault(); handleAtualizarHorario(editando.id); } : handleSubmitHorario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-purple-800 dark:text-purple-300 mb-2 uppercase tracking-wide">
                    Nome do Horário *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: A, B, C"
                    value={novoHorario.nome}
                    onChange={(e) => setNovoHorario({ ...novoHorario, nome: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border-2 border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                    maxLength="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-purple-800 dark:text-purple-300 mb-2 uppercase tracking-wide">
                    Período *
                  </label>
                  <input
                    type="text"
                    placeholder="08:00-17:00"
                    value={novoHorario.descricao}
                    onChange={(e) => setNovoHorario({ ...novoHorario, descricao: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-purple-800 dark:text-purple-300 mb-2 uppercase tracking-wide">
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
                    className="w-full px-4 py-2.5 border-2 border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
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
                      <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-lg text-lg shadow-md">
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
    </div>
  );
};

export default GerenciamentoUnificado;
