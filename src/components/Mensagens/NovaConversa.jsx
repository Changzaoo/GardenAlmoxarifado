import React, { useState, useEffect } from 'react';
import { X, Users, User, Search, Loader } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const NovaConversa = ({ isOpen, onClose, onIniciarConversa, onCriarGrupo, usuarioAtual }) => {
  const [tipo, setTipo] = useState('individual'); // 'individual' ou 'grupo'
  const [busca, setBusca] = useState('');
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descricaoGrupo, setDescricaoGrupo] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null); // Para modal de perfil

  // Carregar lista de usuários
  useEffect(() => {
    if (isOpen) {
      carregarUsuarios();
    }
  }, [isOpen]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando usuários para Nova Conversa...');
      
      const todosUsuarios = new Map(); // Chave: userId principal
      const emailIndex = new Map(); // Índice: email -> userId principal
      const nomeIndex = new Map(); // Índice: nome normalizado -> userId principal
      
      // Função auxiliar para normalizar nome (remove acentos, espaços extras, lowercase)
      const normalizarNome = (nome) => {
        if (!nome) return '';
        return nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/\s+/g, ' ') // Remove espaços extras
          .trim();
      };
      
      // Função auxiliar para encontrar userId principal baseado em email ou nome
      const encontrarUserIdPrincipal = (email, nome) => {
        // Prioridade 1: Buscar por email
        if (email) {
          const emailNormalizado = email.toLowerCase().trim();
          if (emailIndex.has(emailNormalizado)) {
            return emailIndex.get(emailNormalizado);
          }
        }
        
        // Prioridade 2: Buscar por nome normalizado
        if (nome) {
          const nomeNormalizado = normalizarNome(nome);
          if (nomeNormalizado && nomeIndex.has(nomeNormalizado)) {
            return nomeIndex.get(nomeNormalizado);
          }
        }
        
        return null;
      };
      
      // Função auxiliar para adicionar/mesclar usuário
      const adicionarUsuario = (docId, data, origem) => {
        const email = (data.email || '').toLowerCase().trim();
        const nome = data.nome || data.displayName || '';
        const userId = data.userId || docId;
        
        // Verificar se já existe usuário com mesmo email ou nome
        const userIdExistente = encontrarUserIdPrincipal(email, nome);
        const userIdFinal = userIdExistente || userId;
        
        // Se já existe, fazer merge dos dados
        if (todosUsuarios.has(userIdFinal)) {
          const usuarioExistente = todosUsuarios.get(userIdFinal);
          
          todosUsuarios.set(userIdFinal, {
            ...usuarioExistente,
            // Mesclar dados, priorizando valores não vazios
            nome: data.nome || usuarioExistente.nome,
            email: email || usuarioExistente.email,
            cargo: data.cargo || data.nivel || usuarioExistente.cargo,
            photoURL: data.photoURL || data.avatar || usuarioExistente.photoURL,
            displayName: data.displayName || usuarioExistente.displayName,
            // Manter registro de todas as origens
            origens: [...(usuarioExistente.origens || [origem]), origem],
            // Manter todos os IDs relacionados
            idsRelacionados: Array.from(new Set([
              ...(usuarioExistente.idsRelacionados || [usuarioExistente.id]),
              docId,
              userId
            ]))
          });
          
          console.log(`🔗 Mesclando usuário "${nome || email}" (${origem}) com ID existente ${userIdFinal}`);
        } else {
          // Novo usuário
          todosUsuarios.set(userIdFinal, {
            id: userIdFinal,
            nome: nome || email?.split('@')[0] || 'Sem nome',
            email: email,
            cargo: data.cargo || data.nivel || '',
            photoURL: data.photoURL || data.avatar || null,
            displayName: data.displayName || nome,
            origens: [origem],
            idsRelacionados: Array.from(new Set([docId, userId])),
            ...data
          });
          
          // Indexar por email
          if (email) {
            emailIndex.set(email, userIdFinal);
          }
          
          // Indexar por nome normalizado
          if (nome) {
            const nomeNormalizado = normalizarNome(nome);
            if (nomeNormalizado) {
              nomeIndex.set(nomeNormalizado, userIdFinal);
            }
          }
          
          console.log(`➕ Novo usuário "${nome || email}" (${origem}) com ID ${userIdFinal}`);
        }
      };
      
      // 1️⃣ Buscar na coleção "usuarios" (PLURAL)
      try {
        const usuariosRef = collection(db, 'usuarios');
        const usuariosSnapshot = await getDocs(usuariosRef);
        console.log(`✅ Encontrados ${usuariosSnapshot.size} documentos na coleção "usuarios"`);
        
        usuariosSnapshot.docs.forEach(doc => {
          if (doc.id !== usuarioAtual?.id) {
            adicionarUsuario(doc.id, doc.data(), 'usuarios');
          }
        });
      } catch (error) {
        console.error('❌ Erro ao buscar na coleção "usuarios":', error);
      }
      
      // 2️⃣ Buscar na coleção "funcionarios"
      try {
        const funcionariosRef = collection(db, 'funcionarios');
        const funcionariosSnapshot = await getDocs(funcionariosRef);
        console.log(`✅ Encontrados ${funcionariosSnapshot.size} documentos na coleção "funcionarios"`);
        
        funcionariosSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const userId = data.userId || doc.id;
          if (userId !== usuarioAtual?.id) {
            adicionarUsuario(doc.id, data, 'funcionarios');
          }
        });
      } catch (error) {
        console.error('❌ Erro ao buscar na coleção "funcionarios":', error);
      }
      
      // 3️⃣ Buscar na coleção "usuario" (SINGULAR - legado)
      try {
        const usuarioRef = collection(db, 'usuario');
        const usuarioSnapshot = await getDocs(usuarioRef);
        console.log(`✅ Encontrados ${usuarioSnapshot.size} documentos na coleção "usuario" (singular)`);
        
        usuarioSnapshot.docs.forEach(doc => {
          if (doc.id !== usuarioAtual?.id) {
            adicionarUsuario(doc.id, doc.data(), 'usuario');
          }
        });
      } catch (error) {
        console.error('❌ Erro ao buscar na coleção "usuario":', error);
      }
      
      const usuariosArray = Array.from(todosUsuarios.values());
      console.log(`✅ Total de usuários únicos carregados: ${usuariosArray.length}`);
      console.log('👥 Usuários unificados:', usuariosArray.map(u => ({
        nome: u.nome,
        email: u.email,
        origens: u.origens,
        ids: u.idsRelacionados
      })));
      
      setUsuarios(usuariosArray);
    } catch (error) {
      console.error('❌ Erro geral ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar alfabeticamente
  const usuariosFiltrados = usuarios
    .filter(u =>
      u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      (typeof u.cargo === 'string' && u.cargo.toLowerCase().includes(busca.toLowerCase())) ||
      u.email?.toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a, b) => {
      const nomeA = (a.nome || a.email || '').toLowerCase();
      const nomeB = (b.nome || b.email || '').toLowerCase();
      return nomeA.localeCompare(nomeB);
    });

  const toggleSelecionado = (userId) => {
    setSelecionados(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCriar = () => {
    if (tipo === 'individual' && selecionados.length === 1) {
      onIniciarConversa(selecionados[0]);
      handleClose();
    } else if (tipo === 'grupo' && nomeGrupo.trim() && selecionados.length >= 2) {
      onCriarGrupo(nomeGrupo, descricaoGrupo, selecionados);
      handleClose();
    }
  };

  const handleClose = () => {
    setTipo('individual');
    setBusca('');
    setNomeGrupo('');
    setDescricaoGrupo('');
    setSelecionados([]);
    setPerfilSelecionado(null);
    onClose();
  };

  // Formatar data de entrada no sistema
  const formatarDataEntrada = (timestamp) => {
    if (!timestamp) return 'Data não disponível';
    
    try {
      let data;
      if (timestamp.toDate) {
        data = timestamp.toDate();
      } else if (timestamp.seconds) {
        data = new Date(timestamp.seconds * 1000);
      } else {
        data = new Date(timestamp);
      }
      
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const mes = meses[data.getMonth()];
      const ano = data.getFullYear();
      
      return `${mes}/${ano}`;
    } catch (error) {
      return 'Data não disponível';
    }
  };

  const podeConfirmar = 
    (tipo === 'individual' && selecionados.length === 1) ||
    (tipo === 'grupo' && nomeGrupo.trim() && selecionados.length >= 2);

  // ⚠️ RENDERIZAÇÃO CONDICIONAL - DEPOIS de todos os hooks para evitar erro "fewer hooks than expected"
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Nova Conversa
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tipo de conversa */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTipo('individual');
                setSelecionados([]);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                tipo === 'individual'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Individual
            </button>
            <button
              onClick={() => {
                setTipo('grupo');
                setSelecionados([]);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                tipo === 'grupo'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Grupo
            </button>
          </div>
        </div>

        {/* Nome e descrição do grupo (apenas para grupos) */}
        {tipo === 'grupo' && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <input
              type="text"
              placeholder="Nome do grupo *"
              value={nomeGrupo}
              onChange={(e) => setNomeGrupo(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Descrição do grupo (opcional)"
              value={descricaoGrupo}
              onChange={(e) => setDescricaoGrupo(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {/* Busca */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contador de selecionados */}
          {selecionados.length > 0 && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {selecionados.length} {tipo === 'grupo' ? 'participante(s)' : 'usuário'} selecionado(s)
              {tipo === 'grupo' && selecionados.length < 2 && (
                <span className="text-red-500 ml-2">
                  (mínimo 2 participantes)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Lista de usuários */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {busca ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {usuariosFiltrados.map((usuario) => {
                const isSelecionado = selecionados.includes(usuario.id);
                const podeSelecionar = tipo === 'grupo' || selecionados.length === 0 || isSelecionado;

                return (
                  <div
                    key={usuario.id}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      isSelecionado
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                    } ${!podeSelecionar ? 'opacity-50' : ''}`}
                  >
                    {/* Avatar - CLICÁVEL para ver perfil */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPerfilSelecionado(usuario);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelecionado ? 'bg-blue-500' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      } text-white font-semibold flex-shrink-0 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer`}
                      title="Ver perfil"
                    >
                      {usuario.photoURL ? (
                        <img 
                          src={usuario.photoURL} 
                          alt={usuario.nome}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        usuario.nome?.charAt(0).toUpperCase() || usuario.email?.charAt(0).toUpperCase() || '?'
                      )}
                    </button>

                    {/* Info - CLICÁVEL para selecionar */}
                    <button
                      onClick={() => podeSelecionar && toggleSelecionado(usuario.id)}
                      disabled={!podeSelecionar}
                      className="flex-1 text-left min-w-0"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {usuario.nome || usuario.email || `Usuário ${usuario.id.substring(0, 8)}`}
                      </h4>
                      {(usuario.cargo || usuario.email) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {usuario.cargo || usuario.email}
                        </p>
                      )}
                    </button>

                    {/* Checkbox */}
                    {podeSelecionar && (
                      <button
                        onClick={() => toggleSelecionado(usuario.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelecionado
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelecionado && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCriar}
            disabled={!podeConfirmar}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tipo === 'individual' ? 'Iniciar Conversa' : 'Criar Grupo'}
          </button>
        </div>
      </div>

      {/* Modal de Perfil do Usuário */}
      {perfilSelecionado && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => setPerfilSelecionado(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com botão fechar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Perfil do Usuário
              </h3>
              <button
                onClick={() => setPerfilSelecionado(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Conteúdo do Perfil */}
            <div className="p-6">
              {/* Foto de Perfil Grande */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-3">
                  {perfilSelecionado.photoURL ? (
                    <img 
                      src={perfilSelecionado.photoURL} 
                      alt={perfilSelecionado.nome}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    perfilSelecionado.nome?.charAt(0).toUpperCase() || 
                    perfilSelecionado.email?.charAt(0).toUpperCase() || 
                    '?'
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                  {perfilSelecionado.nome || perfilSelecionado.email || 'Usuário'}
                </h2>
              </div>

              {/* Informações do Perfil */}
              <div className="space-y-4">
                {/* Cargo */}
                {perfilSelecionado.cargo && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                        Cargo
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {perfilSelecionado.cargo}
                      </p>
                    </div>
                  </div>
                )}

                {/* Empresa/Setor */}
                {(perfilSelecionado.empresa || perfilSelecionado.setor) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                        {perfilSelecionado.empresa && perfilSelecionado.setor ? 'Empresa / Setor' : perfilSelecionado.empresa ? 'Empresa' : 'Setor'}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {perfilSelecionado.empresa && perfilSelecionado.setor 
                          ? `${perfilSelecionado.empresa} / ${perfilSelecionado.setor}`
                          : perfilSelecionado.empresa || perfilSelecionado.setor}
                      </p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {perfilSelecionado.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                        Email
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {perfilSelecionado.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Data de Entrada */}
                {(perfilSelecionado.dataCriacao || perfilSelecionado.createdAt || perfilSelecionado.dataEntrada) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                        No sistema desde
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatarDataEntrada(perfilSelecionado.dataCriacao || perfilSelecionado.createdAt || perfilSelecionado.dataEntrada)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Nível/Permissão */}
                {perfilSelecionado.nivel && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                        Nível de Acesso
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {perfilSelecionado.nivel}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer com botão de ação */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setPerfilSelecionado(null);
                  if (!selecionados.includes(perfilSelecionado.id) && tipo === 'individual') {
                    toggleSelecionado(perfilSelecionado.id);
                  }
                }}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
              >
                {selecionados.includes(perfilSelecionado.id) 
                  ? 'Usuário Selecionado' 
                  : tipo === 'individual' 
                    ? 'Iniciar Conversa' 
                    : 'Adicionar ao Grupo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovaConversa;
