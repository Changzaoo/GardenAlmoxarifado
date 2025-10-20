import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ListaConversas from './ListaConversas';
import JanelaChat from './JanelaChat';
import NovaConversa from './NovaConversa';
import NotificationSettings from './NotificationSettings';
import FloatingChatHeads from './FloatingChatHeads';
import { useMensagens } from '../../hooks/useMensagens';
import { useAuth } from '../../hooks/useAuth';
import notificationManager from '../../services/notificationManager';

/**
 * MensagensMain - Componente principal do sistema de mensagens
 * Layout responsivo com lista de conversas e janela de chat
 */
const MensagensMain = () => {
  const { usuario } = useAuth();
  const hookMensagens = useMensagens();
  const { 
    conversaAtiva,
    conversas,
    loading,
    selecionarConversa, 
    iniciarConversa, 
    criarGrupo,
    mensagens,
    enviando,
    enviarMensagem,
    enviarArquivo,
    deletarMensagem,
    apagarParaMim,
    apagarParaTodos,
    editarMensagem,
    carregarMensagensAntigas,
    atualizarDigitacao,
    verificarBloqueio,
    getOutroParticipante,
    buscarInfoParticipante,
    formatarTimestamp
  } = hookMensagens;
  const [showChat, setShowChat] = useState(false);
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // MONITOR: Rastrear mudancas nas conversas vindas do hook
  useEffect(() => {

  }, [conversas, loading]);

  // Verificar query params para abrir conversa via notificação
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conversaId = params.get('conversa');
    
    if (conversaId && conversas.length > 0) {
      const conversa = conversas.find(c => c.id === conversaId);
      if (conversa) {
        // Abrir chat head flutuante
        setTimeout(() => {
          if (window.openFloatingChat) {
            window.openFloatingChat(conversaId);
          } else {
            // Fallback: abrir conversa normalmente
            selecionarConversa(conversaId);
            setShowChat(true);
          }
        }, 500);
        
        // Limpar query param
        window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
      }
    }
  }, [conversas, selecionarConversa]);

  // Escutar mensagens do Service Worker
  useEffect(() => {
    const handleSWMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED' && event.data?.conversaId) {
        const conversaId = event.data.conversaId;
        
        // Abrir chat head flutuante
        setTimeout(() => {
          if (window.openFloatingChat) {
            window.openFloatingChat(conversaId);
          } else {
            // Fallback: abrir conversa normalmente
            selecionarConversa(conversaId);
            setShowChat(true);
          }
        }, 300);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [selecionarConversa]);

  // Inicializar sistema avançado de notificações
  useEffect(() => {
    if (usuario?.id) {
      // Solicitar permissão de notificação
      requestNotificationPermission();

      // Inicializar gerenciador de notificações
      notificationManager.initialize(usuario.id)
        .then(result => {
          console.log('🔔 Sistema de notificações:', result);
          
          if (result.permission === 'granted') {
            console.log('✅ Notificações push ativadas');
          } else if (result.permission === 'denied') {
            console.log('❌ Notificações push bloqueadas');
          } else {
            console.log('⚠️ Permissão de notificações pendente');
          }
        })
        .catch(err => {
          console.error('❌ Erro ao inicializar notificações:', err);
        });
    }

    return () => {
      if (notificationManager) {
        notificationManager.cleanup();
      }
    };
  }, [usuario?.id]);

  /**
   * Solicita permissão para notificações
   */
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('⚠️ Este navegador não suporta notificações');
      return;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Permissão de notificação já concedida');
      return;
    }

    if (Notification.permission === 'denied') {
      console.warn('❌ Permissão de notificação negada. Ative nas configurações do navegador.');
      return;
    }

    // Solicitar permissão
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Permissão de notificação concedida!');
        
        // Mostrar notificação de teste
        new Notification('Notificações Ativadas! 🔔', {
          body: 'Você receberá notificações de novas mensagens',
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'notification-enabled'
        });
      } else {
        console.log('⚠️ Permissão de notificação negada pelo usuário');
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
    }
  };

  const handleSelectConversa = (conversa) => {

    console.trace('📍 Stack trace da chamada:'); // Ver de onde veio a chamada
    selecionarConversa(conversa);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  const handleIniciarConversa = async (outroUsuarioId) => {
    const conversa = await iniciarConversa(outroUsuarioId);
    if (conversa) {
      selecionarConversa(conversa);
      setShowChat(true);
    }
  };

  const handleCriarGrupo = async (nome, descricao, participantesIds) => {
    const grupo = await criarGrupo(nome, descricao, participantesIds);
    if (grupo) {
      selecionarConversa(grupo);
      setShowChat(true);
    }
  };

  const handleDeleteConversa = async (conversaId, tipo) => {
    if (!usuario?.id) return;

    try {
      const { doc, updateDoc, arrayUnion, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebaseConfig');

      const conversaRef = doc(db, 'conversas', conversaId);

      if (tipo === 'self') {
        // Apagar apenas para o usuário atual
        await updateDoc(conversaRef, {
          [`deletadaPara.${usuario.id}`]: true
        });

      } else if (tipo === 'all') {
        // Apagar para todos (apenas conversas individuais)
        await deleteDoc(conversaRef);

      }

      // Se era a conversa ativa, limpar
      if (conversaAtiva?.id === conversaId) {
        selecionarConversa(null);
        setShowChat(false);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar conversa:', error);
      alert('Erro ao deletar conversa. Tente novamente.');
    }
  };

  return (
    <div className="h-full flex bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Lista de conversas - Desktop sempre visível, Mobile condicional */}
      <div className={`
        w-full lg:w-80 xl:w-96 border-r border-gray-200 dark:border-gray-700 h-full flex-shrink-0
        ${showChat ? 'hidden lg:block' : 'block'}
      `}>
        <ListaConversas
          onSelectConversa={handleSelectConversa}
          conversaSelecionada={conversaAtiva}
          onNovaConversa={() => setShowNovaConversa(true)}
          onOpenNotificationSettings={() => setShowNotificationSettings(true)}
          onDeleteConversa={handleDeleteConversa}
          conversas={conversas}
          loading={loading}
          formatarTimestamp={formatarTimestamp}
        />
      </div>

      {/* Modal Nova Conversa */}
      <NovaConversa
        isOpen={showNovaConversa}
        onClose={() => setShowNovaConversa(false)}
        onIniciarConversa={handleIniciarConversa}
        onCriarGrupo={handleCriarGrupo}
        usuarioAtual={usuario}
      />

      {/* Modal Configurações de Notificações */}
      {showNotificationSettings && (
        <NotificationSettings
          onClose={() => setShowNotificationSettings(false)}
        />
      )}

      {/* Conversas Flutuantes (Chat Heads) - Estilo Messenger */}
      <FloatingChatHeads />

      {/* Janela de chat - Desktop sempre visível, Mobile condicional */}
      <div className={`
        flex-1 h-full
        ${!showChat ? 'hidden lg:flex' : 'flex'}
      `}>
        {conversaAtiva ? (
          <JanelaChat
            conversa={conversaAtiva}
            onBack={handleBackToList}
            mensagens={mensagens}
            enviando={enviando}
            enviarMensagem={enviarMensagem}
            enviarArquivo={enviarArquivo}
            deletarMensagem={deletarMensagem}
            apagarParaMim={apagarParaMim}
            apagarParaTodos={apagarParaTodos}
            editarMensagem={editarMensagem}
            carregarMensagensAntigas={carregarMensagensAntigas}
            atualizarDigitacao={atualizarDigitacao}
            verificarBloqueio={verificarBloqueio}
            getOutroParticipante={getOutroParticipante}
            buscarInfoParticipante={buscarInfoParticipante}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Sistema de Mensagens
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MensagensMain;
