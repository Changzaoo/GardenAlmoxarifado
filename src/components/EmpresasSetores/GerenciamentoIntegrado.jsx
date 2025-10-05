import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Building2, Briefcase, Clock, Plus, Edit2, Trash2, Save, X, ChevronRight, AlertTriangle, Mail, Phone, MapPin, User, FileText, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { isAdmin as checkIsAdmin, hasManagementPermission } from '../../constants/permissoes';

const GerenciamentoIntegrado = ({ usuarioAtual }) => {
  // Estados principais
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [setorSelecionado, setSetorSelecionado] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);

  // Estados de modais
  const [modalEmpresa, setModalEmpresa] = useState(false);
  const [modalSetor, setModalSetor] = useState(false);
  const [modalHorario, setModalHorario] = useState(false);

  // Estados de formulário
  const [formEmpresa, setFormEmpresa] = useState({ nome: '', cnpj: '', endereco: '', telefone: '', email: '', ativo: true });
  const [formSetor, setFormSetor] = useState({ nome: '', descricao: '', responsavel: '', ativo: true });
  const [formHorario, setFormHorario] = useState({ nome: '', descricao: '', ativo: true });

  // Verificar permissões
  const isAdmin = checkIsAdmin(usuarioAtual?.nivel) || hasManagementPermission(usuarioAtual?.nivel);

  // Carregar dados iniciais
  useEffect(() => {
    carregarEmpresas();
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      carregarSetores(empresaSelecionada.id);
    } else {
      setSetores([]);
      setSetorSelecionado(null);
    }
  }, [empresaSelecionada]);

  useEffect(() => {
    if (setorSelecionado) {
      carregarHorarios(setorSelecionado.id);
    } else {
      setHorarios([]);
    }
  }, [setorSelecionado]);

  // Funções de carregamento
  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const empresasRef = collection(db, 'empresas');
      const snapshot = await getDocs(empresasRef);
      const empresasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmpresas(empresasData.filter(e => e.ativo !== false));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const carregarSetores = async (empresaId) => {
    try {
      const setoresRef = collection(db, 'setores');
      const q = query(setoresRef, where('empresaId', '==', empresaId));
      const snapshot = await getDocs(q);
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
      const q = query(horariosRef, where('setorId', '==', setorId));
      const snapshot = await getDocs(q);
      const horariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHorarios(horariosData.filter(h => h.ativo !== false));
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários');
    }
  };

  // CRUD Empresas
  const handleSubmitEmpresa = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.warning('Apenas administradores podem gerenciar empresas');
      return;
    }

    if (!formEmpresa.nome.trim()) {
      toast.warning('Nome da empresa é obrigatório');
      return;
    }

    try {
      if (editando?.tipo === 'empresa') {
        await updateDoc(doc(db, 'empresas', editando.id), {
          ...formEmpresa,
          dataAtualizacao: serverTimestamp()
        });
        toast.success('Empresa atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'empresas'), {
          ...formEmpresa,
          dataCriacao: serverTimestamp(),
          dataAtualizacao: serverTimestamp()
        });
        toast.success('Empresa cadastrada com sucesso!');
      }
      setModalEmpresa(false);
      handleCancelar();
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar empresa');
    }
  };

  const handleExcluirEmpresa = async (empresaId) => {
    if (!isAdmin) return;
    if (!window.confirm('Tem certeza? Todos os setores e horários desta empresa serão perdidos.')) return;

    try {
      await deleteDoc(doc(db, 'empresas', empresaId));
      toast.success('Empresa excluída com sucesso!');
      if (empresaSelecionada?.id === empresaId) {
        setEmpresaSelecionada(null);
      }
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast.error('Erro ao excluir empresa');
    }
  };

  // CRUD Setores
  const handleSubmitSetor = async (e) => {
    e.preventDefault();
    if (!empresaSelecionada) {
      toast.warning('Selecione uma empresa primeiro');
      return;
    }

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
          empresaId: empresaSelecionada.id,
          empresaNome: empresaSelecionada.nome,
          dataCriacao: serverTimestamp(),
          dataAtualizacao: serverTimestamp()
        });
        toast.success('Setor cadastrado com sucesso!');
      }
      setModalSetor(false);
      handleCancelar();
      carregarSetores(empresaSelecionada.id);
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
      carregarSetores(empresaSelecionada.id);
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
          empresaId: empresaSelecionada.id,
          empresaNome: empresaSelecionada.nome,
          criadoPor: usuarioAtual?.nome || 'Sistema',
          dataCriacao: serverTimestamp(),
          dataAtualizacao: serverTimestamp()
        });
        toast.success('Horário cadastrado com sucesso!');
      }
      setModalHorario(false);
      handleCancelar();
      carregarHorarios(setorSelecionado.id);
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
      carregarHorarios(setorSelecionado.id);
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast.error('Erro ao excluir horário');
    }
  };

  // Funções auxiliares
  const handleEditar = (item, tipo) => {
    setEditando({ ...item, tipo });
    if (tipo === 'empresa') {
      setFormEmpresa(item);
      setModalEmpresa(true);
    } else if (tipo === 'setor') {
      setFormSetor(item);
      setModalSetor(true);
    } else if (tipo === 'horario') {
      setFormHorario(item);
      setModalHorario(true);
    }
  };

  const handleCancelar = () => {
    setEditando(null);
    setFormEmpresa({ nome: '', cnpj: '', endereco: '', telefone: '', email: '', ativo: true });
    setFormSetor({ nome: '', descricao: '', responsavel: '', ativo: true });
    setFormHorario({ nome: '', descricao: '', ativo: true });
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return 'N/A';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          Gerenciamento Unificado
        </h1>
        <p className="text-purple-100 mt-2">
          Gerencie empresas, setores e horários personalizados
        </p>
      </div>

      {/* Breadcrumb de Navegação Hierárquica */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Building2 className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {empresaSelecionada ? empresaSelecionada.nome : 'Selecione uma empresa'}
          </span>
          {empresaSelecionada && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {setorSelecionado ? setorSelecionado.nome : 'Selecione um setor'}
              </span>
            </>
          )}
          {setorSelecionado && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">Horários</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Empresas */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-purple-600" />
                Empresas ({empresas.length})
              </h2>
              {isAdmin && (
                <button
                  onClick={() => {
                    handleCancelar();
                    setModalEmpresa(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-bold shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Nova
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {empresas.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma empresa cadastrada</p>
                </div>
              ) : (
                empresas.map((empresa) => (
                  <div
                    key={empresa.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                      empresaSelecionada?.id === empresa.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
                    onClick={() => setEmpresaSelecionada(empresa)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{empresa.nome}</h3>
                        
                        {empresa.cnpj && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <FileText className="w-4 h-4" />
                            <span>CNPJ: {empresa.cnpj}</span>
                          </div>
                        )}
                        
                        {empresa.telefone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <Phone className="w-4 h-4" />
                            <span>{empresa.telefone}</span>
                          </div>
                        )}
                        
                        {empresa.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{empresa.email}</span>
                          </div>
                        )}
                        
                        {empresa.endereco && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs">{empresa.endereco}</span>
                          </div>
                        )}
                        
                        {empresa.dataCriacao && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-2">
                            <Calendar className="w-3 h-3" />
                            <span>Cadastrado em {formatarData(empresa.dataCriacao)}</span>
                          </div>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditar(empresa, 'empresa');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExcluirEmpresa(empresa.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
        </div>

        {/* Coluna 2: Setores */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Setores ({setores.length})
              </h2>
              {empresaSelecionada && (
                <button
                  onClick={() => {
                    handleCancelar();
                    setModalSetor(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-bold shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Novo
                </button>
              )}
            </div>

            {!empresaSelecionada ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Selecione uma empresa primeiro</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {setores.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum setor cadastrado</p>
                  </div>
                ) : (
                  setores.map((setor) => (
                    <div
                      key={setor.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                        setorSelecionado?.id === setor.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => setSetorSelecionado(setor)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{setor.nome}</h3>
                          
                          {setor.descricao && (
                            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <FileText className="w-4 h-4 mt-0.5" />
                              <span className="text-xs">{setor.descricao}</span>
                            </div>
                          )}
                          
                          {setor.responsavel && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <User className="w-4 h-4" />
                              <span>Responsável: {setor.responsavel}</span>
                            </div>
                          )}
                          
                          {setor.dataCriacao && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-2">
                              <Calendar className="w-3 h-3" />
                              <span>Cadastrado em {formatarData(setor.dataCriacao)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditar(setor, 'setor');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExcluirSetor(setor.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 3: Horários */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-green-200 dark:border-green-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-green-600" />
                Horários ({horarios.length})
              </h2>
              {setorSelecionado && (
                <button
                  onClick={() => {
                    handleCancelar();
                    setModalHorario(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Novo
                </button>
              )}
            </div>

            {!setorSelecionado ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Selecione um setor primeiro</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {horarios.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum horário cadastrado</p>
                  </div>
                ) : (
                  horarios.map((horario) => (
                    <div
                      key={horario.id}
                      className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-all hover:shadow-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{horario.nome}</h3>
                          
                          {horario.descricao && (
                            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <FileText className="w-4 h-4 mt-0.5" />
                              <span className="text-xs">{horario.descricao}</span>
                            </div>
                          )}
                          
                          {horario.criadoPor && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <User className="w-4 h-4" />
                              <span>Criado por: {horario.criadoPor}</span>
                            </div>
                          )}
                          
                          {horario.dataCriacao && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-2">
                              <Calendar className="w-3 h-3" />
                              <span>Cadastrado em {formatarData(horario.dataCriacao)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleEditar(horario, 'horario')}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExcluirHorario(horario.id)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Empresa */}
      {modalEmpresa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-7 h-7" />
                  {editando?.tipo === 'empresa' ? 'Editar Empresa' : 'Nova Empresa'}
                </h2>
                <button
                  onClick={() => {
                    setModalEmpresa(false);
                    handleCancelar();
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmitEmpresa} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formEmpresa.nome}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formEmpresa.cnpj}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, cnpj: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formEmpresa.telefone}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, telefone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formEmpresa.email}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formEmpresa.endereco}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, endereco: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-bold shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editando?.tipo === 'empresa' ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalEmpresa(false);
                    handleCancelar();
                  }}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Setor */}
      {modalSetor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-7 h-7" />
                  {editando?.tipo === 'setor' ? 'Editar Setor' : 'Novo Setor'}
                </h2>
                <button
                  onClick={() => {
                    setModalSetor(false);
                    handleCancelar();
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-blue-100 mt-2">Empresa: {empresaSelecionada?.nome}</p>
            </div>
            
            <form onSubmit={handleSubmitSetor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Setor *
                </label>
                <input
                  type="text"
                  value={formSetor.nome}
                  onChange={(e) => setFormSetor({ ...formSetor, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formSetor.descricao}
                  onChange={(e) => setFormSetor({ ...formSetor, descricao: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formSetor.responsavel}
                  onChange={(e) => setFormSetor({ ...formSetor, responsavel: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-bold shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editando?.tipo === 'setor' ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalSetor(false);
                    handleCancelar();
                  }}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Horário */}
      {modalHorario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-7 h-7" />
                  {editando?.tipo === 'horario' ? 'Editar Horário' : 'Novo Horário Personalizado'}
                </h2>
                <button
                  onClick={() => {
                    setModalHorario(false);
                    handleCancelar();
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-green-100 mt-2">
                Empresa: {empresaSelecionada?.nome} • Setor: {setorSelecionado?.nome}
              </p>
            </div>
            
            <form onSubmit={handleSubmitHorario} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Horário *
                </label>
                <input
                  type="text"
                  value={formHorario.nome}
                  onChange={(e) => setFormHorario({ ...formHorario, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  autoFocus
                  placeholder="Ex: Turno Noturno, Horário Especial"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formHorario.descricao}
                  onChange={(e) => setFormHorario({ ...formHorario, descricao: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="4"
                  placeholder="Descreva os detalhes do horário personalizado..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editando?.tipo === 'horario' ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalHorario(false);
                    handleCancelar();
                  }}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciamentoIntegrado;
