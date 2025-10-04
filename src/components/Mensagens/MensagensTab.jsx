import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, MessageCircle, Users, X } from 'lucide-react';
import ConversasList from './ConversasList';
import ChatArea from './ChatArea';
import NovaConversaModal from './NovaConversaModal';

const MensagensTab = () => {
  const { usuario } = useAuth();
  const [conversas, setConversas] = useState([]);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [funcionarios, setFuncionarios] = useState([]);

  // Calcular total de mensagens não lidas
  const totalUnread = conversas.reduce((total, conversa) => {
    return total + (conversa.naoLidas || 0);
  }, 0);

  // Carregar funcionários/usuários da mesma empresa/setor (ou todos se for admin)
  useEffect(() => {
    if (!usuario?.id) {
      console.log('MensagensTab: Usuário não definido');
      return;
    }

    // Administrador (nível 1) vê todos
    const isAdmin = usuario.nivel === 1;

    // Se não for admin e não tiver empresaId/setorId, não carrega
    if (!isAdmin && (!usuario.empresaId || !usuario.setorId)) {
      console.warn('MensagensTab: Usuário sem empresaId ou setorId', usuario);
      setFuncionarios([]);
      return;
    }

    const unsubscribers = [];

    // Carregar da coleção 'usuarios' (sistema novo)
    let qUsuarios;
    if (isAdmin) {
      qUsuarios = query(collection(db, 'usuarios'), where('ativo', '==', true));
    } else {
      qUsuarios = query(
        collection(db, 'usuarios'),
        where('empresaId', '==', usuario.empresaId),
        where('setorId', '==', usuario.setorId),
        where('ativo', '==', true)
      );
    }

    const unsubUsuarios = onSnapshot(qUsuarios, (snapshot) => {
      const usuarios = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          origem: 'usuarios'
        }))
        .filter(u => u.id !== usuario.id);

      // Carregar da coleção 'funcionarios' (sistema legado)
      let qFuncionarios;
      if (isAdmin) {
        qFuncionarios = query(collection(db, 'funcionarios'));
      } else {
        qFuncionarios = query(
          collection(db, 'funcionarios'),
          where('empresaId', '==', usuario.empresaId),
          where('setorId', '==', usuario.setorId)
        );
      }

      const unsubFuncionarios = onSnapshot(qFuncionarios, (snapshotFunc) => {
        const funcionariosLegado = snapshotFunc.docs
          .map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            origem: 'funcionarios'
          }))
          .filter(f => f.id !== usuario.id && !f.demitido);

        // Mesclar ambas as coleções, evitando duplicatas
        const todosUsuarios = [...usuarios];
        funcionariosLegado.forEach(func => {
          if (!todosUsuarios.find(u => u.id === func.id)) {
            todosUsuarios.push(func);
          }
        });

        setFuncionarios(todosUsuarios);
      }, (error) => {
        console.error('Erro ao carregar funcionários:', error);
        setFuncionarios(usuarios); // Usar apenas usuários se falhar
      });

      unsubscribers.push(unsubFuncionarios);
    }, (error) => {
      console.error('Erro ao carregar usuários:', error);
      setFuncionarios([]);
    });

    unsubscribers.push(unsubUsuarios);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [usuario]);

  // Carregar conversas do usuário (ou todas se for admin)
  useEffect(() => {
    if (!usuario?.id) {
      console.log('MensagensTab: Aguardando usuário para carregar conversas');
      setCarregando(false);
      return;
    }

    const isAdmin = usuario.nivel === 1;

    // Query diferente para admin vs usuário normal
    let q;
    if (isAdmin) {
      // Admin vê todas as conversas
      q = query(
        collection(db, 'conversas'),
        orderBy('ultimaAtualizacao', 'desc')
      );
    } else {
      // Usuário normal vê apenas suas conversas
      q = query(
        collection(db, 'conversas'),
        where('participantes', 'array-contains', usuario.id),
        orderBy('ultimaAtualizacao', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversasList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Buscar informações dos participantes
          const participantesInfo = await Promise.all(
            data.participantes
              .filter(id => id !== usuario.id)
              .map(async (participanteId) => {
                // Tentar buscar primeiro na coleção 'usuarios'
                const usuarioDoc = await getDocs(
                  query(collection(db, 'usuarios'), where('__name__', '==', participanteId))
                );
                
                if (!usuarioDoc.empty) {
                  const userData = usuarioDoc.docs[0].data();
                  return {
                    id: participanteId,
                    nome: userData.nome,
                    avatar: userData.photoURL || userData.avatar || null,
                    cargo: userData.cargo
                  };
                }
                
                // Se não encontrou em 'usuarios', buscar em 'funcionarios' (legado)
                const funcDoc = await getDocs(
                  query(collection(db, 'funcionarios'), where('__name__', '==', participanteId))
                );
                
                if (!funcDoc.empty) {
                  const funcData = funcDoc.docs[0].data();
                  return {
                    id: participanteId,
                    nome: funcData.nome,
                    avatar: funcData.photoURL || funcData.avatar || null,
                    cargo: funcData.cargo
                  };
                }
                
                // Se não encontrou em nenhuma, retornar placeholder
                console.warn(`Participante ${participanteId} não encontrado`);
                return {
                  id: participanteId,
                  nome: 'Usuário',
                  avatar: null,
                  cargo: 'N/A'
                };
              })
          );

          return {
            id: docSnap.id,
            ...data,
            participantesInfo: participantesInfo.filter(p => p !== null),
            naoLidas: data.naoLidas?.[usuario.id] || 0
          };
        })
      );

      setConversas(conversasList);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  // Criar nova conversa individual
  const criarConversaIndividual = async (funcionarioId) => {
    // Verificar se já existe conversa
    const conversaExistente = conversas.find(
      c => c.tipo === 'individual' && 
      c.participantes.includes(funcionarioId)
    );

    if (conversaExistente) {
      setConversaSelecionada(conversaExistente);
      setShowNovaConversa(false);
      return;
    }

    // Criar nova conversa
    const novaConversa = {
      tipo: 'individual',
      participantes: [usuario.id, funcionarioId],
      criadoPor: usuario.id,
      criadoEm: serverTimestamp(),
      ultimaAtualizacao: serverTimestamp(),
      ultimaMensagem: null,
      naoLidas: {
        [usuario.id]: 0,
        [funcionarioId]: 0
      }
    };

    const docRef = await addDoc(collection(db, 'conversas'), novaConversa);
    
    setShowNovaConversa(false);
    
    // Selecionar a nova conversa
    const conversaCompleta = {
      id: docRef.id,
      ...novaConversa,
      participantesInfo: funcionarios.filter(f => f.id === funcionarioId)
    };
    
    setConversaSelecionada(conversaCompleta);
  };

  // Criar grupo
  const criarGrupo = async (nome, participantesIds) => {
    const naoLidas = {};
    [usuario.id, ...participantesIds].forEach(id => {
      naoLidas[id] = 0;
    });

    const novoGrupo = {
      tipo: 'grupo',
      nome,
      participantes: [usuario.id, ...participantesIds],
      criadoPor: usuario.id,
      criadoEm: serverTimestamp(),
      ultimaAtualizacao: serverTimestamp(),
      ultimaMensagem: null,
      naoLidas
    };

    const docRef = await addDoc(collection(db, 'conversas'), novoGrupo);
    
    setShowNovaConversa(false);
    
    // Selecionar o novo grupo
    const grupoCompleto = {
      id: docRef.id,
      ...novoGrupo,
      participantesInfo: funcionarios.filter(f => participantesIds.includes(f.id))
    };
    
    setConversaSelecionada(grupoCompleto);
  };

  // Filtrar conversas pela busca
  const conversasFiltradas = conversas.filter(conversa => {
    if (!busca.trim()) return true;

    const textoBusca = busca.toLowerCase();
    
    if (conversa.tipo === 'grupo') {
      return conversa.nome?.toLowerCase().includes(textoBusca);
    } else {
      return conversa.participantesInfo.some(
        p => p.nome.toLowerCase().includes(textoBusca)
      );
    }
  });

  // Verificar se o usuário tem os dados necessários
  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar configuração (exceto para admin)
  if ((!usuario.empresaId || !usuario.setorId) && usuario.nivel !== 1) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Configuração Incompleta
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Para usar o sistema de mensagens, você precisa estar vinculado a uma empresa e setor.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Entre em contato com o administrador para completar seu cadastro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Lista de Conversas */}
      <div className={`${conversaSelecionada ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Mensagens
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowNovaConversa(true)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="Nova conversa"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {carregando ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                {busca ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {busca ? 'Tente buscar por outro termo' : 'Inicie uma nova conversa clicando no botão +'}
              </p>
            </div>
          ) : (
            <ConversasList
              conversas={conversasFiltradas}
              conversaSelecionada={conversaSelecionada}
              onSelectConversa={setConversaSelecionada}
              usuarioId={usuario.id}
            />
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className={`${conversaSelecionada ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-100 dark:bg-gray-900 h-full overflow-hidden`}>
        {conversaSelecionada ? (
          <ChatArea
            conversa={conversaSelecionada}
            usuario={usuario}
            onVoltar={() => setConversaSelecionada(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
            <MessageCircle className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecione uma conversa
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Escolha uma conversa da lista ou inicie uma nova
            </p>
          </div>
        )}
      </div>

      {/* Modal Nova Conversa */}
      {showNovaConversa && (
        <NovaConversaModal
          funcionarios={funcionarios}
          onClose={() => setShowNovaConversa(false)}
          onCriarIndividual={criarConversaIndividual}
          onCriarGrupo={criarGrupo}
        />
      )}
    </div>
  );
};

export default MensagensTab;
