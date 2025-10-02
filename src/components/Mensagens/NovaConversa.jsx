import React, { useState, useEffect } from 'react';
import { X, Search, Users, MessageCircle, ChevronRight, Check, User } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { toast } from 'react-toastify';

/**
 * NovaConversa - Modal para iniciar conversas 1:1 ou criar grupos
 */
const NovaConversa = ({ isOpen, onClose, onIniciarConversa, onCriarGrupo, usuarioAtual }) => {
  const [etapa, setEtapa] = useState('tipo'); // 'tipo', 'selecionar-usuarios', 'detalhes-grupo'
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [usuariosSelecionados, setUsuariosSelecionados] = useState([]);
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descricaoGrupo, setDescricaoGrupo] = useState('');

  // Carregar usuários do sistema
  useEffect(() => {
    if (isOpen) {
      carregarUsuarios();
    } else {
      // Reset ao fechar
      setEtapa('tipo');
      setBusca('');
      setUsuariosSelecionados([]);
      setNomeGrupo('');
      setDescricaoGrupo('');
    }
  }, [isOpen]);

  // Filtrar usuários por busca
  useEffect(() => {
    if (!busca.trim()) {
      setUsuariosFiltrados(usuarios);
      return;
    }

    const termo = busca.toLowerCase();
    const filtrados = usuarios.filter(u => 
      u.nome?.toLowerCase().includes(termo) ||
      u.email?.toLowerCase().includes(termo) ||
      u.setor?.toLowerCase().includes(termo)
    );
    setUsuariosFiltrados(filtrados);
  }, [busca, usuarios]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      console.log('👥 Carregando usuários do sistema...');
      console.log('👤 Usuário atual:', usuarioAtual?.id);
      
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('ativo', '==', true));
      const snapshot = await getDocs(q);
      
      console.log('📊 Total de usuários encontrados:', snapshot.size);
      
      const listaUsuarios = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(u => u.id !== usuarioAtual.id); // Remover usuário atual

      console.log('✅ Usuários disponíveis (sem o atual):', listaUsuarios.length);
      console.log('📋 Lista:', listaUsuarios.map(u => ({ id: u.id, nome: u.nome })));
      
      setUsuarios(listaUsuarios);
      setUsuariosFiltrados(listaUsuarios);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      console.error('Detalhes:', error.message);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarTipo = (tipo) => {
    if (tipo === 'individual') {
      setEtapa('selecionar-usuarios');
    } else {
      setEtapa('selecionar-usuarios');
    }
  };

  const toggleUsuarioSelecionado = (usuario) => {
    if (etapa === 'selecionar-usuarios' && usuariosSelecionados.length === 0) {
      // Modo individual - selecionar apenas um
      if (usuarios.find(u => u.id === usuario.id)) {
        handleIniciarConversaIndividual(usuario);
      }
    } else {
      // Modo grupo - seleção múltipla
      setUsuariosSelecionados(prev => {
        const jaExiste = prev.find(u => u.id === usuario.id);
        if (jaExiste) {
          return prev.filter(u => u.id !== usuario.id);
        }
        return [...prev, usuario];
      });
    }
  };

  const isUsuarioSelecionado = (usuarioId) => {
    return usuariosSelecionados.some(u => u.id === usuarioId);
  };

  const handleIniciarConversaIndividual = async (usuario) => {
    try {
      setLoading(true);
      await onIniciarConversa(usuario.id);
      onClose();
      toast.success(`Conversa iniciada com ${usuario.nome}`);
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error('Erro ao iniciar conversa');
    } finally {
      setLoading(false);
    }
  };

  const handleProximaEtapa = () => {
    if (usuariosSelecionados.length < 2) {
      toast.warning('Selecione pelo menos 2 participantes para criar um grupo');
      return;
    }
    setEtapa('detalhes-grupo');
  };

  const handleCriarGrupo = async () => {
    if (!nomeGrupo.trim()) {
      toast.warning('Digite um nome para o grupo');
      return;
    }

    if (nomeGrupo.length < 3) {
      toast.warning('O nome do grupo deve ter no mínimo 3 caracteres');
      return;
    }

    if (usuariosSelecionados.length < 2) {
      toast.warning('Selecione pelo menos 2 participantes');
      return;
    }

    try {
      setLoading(true);
      const participantesIds = usuariosSelecionados.map(u => u.id);
      await onCriarGrupo(nomeGrupo, descricaoGrupo, participantesIds);
      onClose();
      toast.success('Grupo criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast.error('Erro ao criar grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    if (etapa === 'detalhes-grupo') {
      setEtapa('selecionar-usuarios');
    } else if (etapa === 'selecionar-usuarios') {
      setEtapa('tipo');
      setUsuariosSelecionados([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {etapa === 'tipo' && 'Nova Conversa'}
              {etapa === 'selecionar-usuarios' && usuariosSelecionados.length === 0 && 'Selecionar Contato'}
              {etapa === 'selecionar-usuarios' && usuariosSelecionados.length > 0 && 'Selecionar Participantes'}
              {etapa === 'detalhes-grupo' && 'Detalhes do Grupo'}
            </h2>
            {etapa === 'selecionar-usuarios' && usuariosSelecionados.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {usuariosSelecionados.length} participante(s) selecionado(s)
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Etapa 1: Escolher tipo */}
          {etapa === 'tipo' && (
            <div className="space-y-4">
              <button
                onClick={() => handleSelecionarTipo('individual')}
                className="w-full p-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-between transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">Conversa Individual</h3>
                    <p className="text-blue-100 text-sm">Falar com um colega</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6" />
              </button>

              <button
                onClick={() => handleSelecionarTipo('grupo')}
                className="w-full p-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl flex items-center justify-between transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">Novo Grupo</h3>
                    <p className="text-green-100 text-sm">Criar grupo com múltiplos participantes</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Etapa 2: Selecionar usuários */}
          {etapa === 'selecionar-usuarios' && (
            <div>
              {/* Busca */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou setor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              {/* Lista de usuários */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-3">Carregando usuários...</p>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {busca ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {usuariosFiltrados.map((usuario) => {
                    const selecionado = isUsuarioSelecionado(usuario.id);
                    return (
                      <button
                        key={usuario.id}
                        onClick={() => toggleUsuarioSelecionado(usuario)}
                        className={`w-full p-4 rounded-lg flex items-center gap-3 transition-all ${
                          selecionado
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                          selecionado ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'
                        }`}>
                          {usuario.nome?.charAt(0).toUpperCase() || '?'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {usuario.nome || 'Sem nome'}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {usuario.setor || usuario.email || 'Sem informações'}
                          </p>
                        </div>

                        {/* Checkbox */}
                        {usuariosSelecionados.length > 0 && (
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selecionado
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selecionado && <Check className="w-4 h-4 text-white" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Etapa 3: Detalhes do grupo */}
          {etapa === 'detalhes-grupo' && (
            <div className="space-y-6">
              {/* Nome do grupo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Grupo *
                </label>
                <input
                  type="text"
                  value={nomeGrupo}
                  onChange={(e) => setNomeGrupo(e.target.value)}
                  placeholder="Ex: Equipe de Desenvolvimento"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {nomeGrupo.length}/50 caracteres
                </p>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={descricaoGrupo}
                  onChange={(e) => setDescricaoGrupo(e.target.value)}
                  placeholder="Descreva o propósito do grupo..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {descricaoGrupo.length}/200 caracteres
                </p>
              </div>

              {/* Participantes selecionados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Participantes ({usuariosSelecionados.length})
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {usuariosSelecionados.map((usuario) => (
                      <div key={usuario.id} className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
                          {usuario.nome?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-gray-900 dark:text-white">{usuario.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          {etapa !== 'tipo' && (
            <button
              onClick={handleVoltar}
              disabled={loading}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
            >
              Voltar
            </button>
          )}

          {etapa === 'selecionar-usuarios' && usuariosSelecionados.length >= 2 && (
            <button
              onClick={handleProximaEtapa}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Próximo
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {etapa === 'detalhes-grupo' && (
            <button
              onClick={handleCriarGrupo}
              disabled={loading || !nomeGrupo.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Criar Grupo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovaConversa;
