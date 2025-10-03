import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import ListaConversas from './ListaConversas';
import JanelaChat from './JanelaChat';
import NovaConversa from './NovaConversa';
import NotificationSettings from './NotificationSettings';
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
    apagarConversa,
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
  
  // Ref para armazenar a função de seleção de forma estável
  const handleSelectRef = useRef(null);

  // MONITOR: Rastrear mudancas nas conversas vindas do hook
  useEffect(() => {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('MensagensMain - Conversas do hook MUDARAM');
    console.log('Quantidade:', conversas.length);
    console.log('IDs:', conversas.map(c => c.id));
    console.log('Loading:', loading);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  }, [conversas, loading]);

  // Função handler para selecionar conversa (usando useCallback para estabilidade)
  const handleSelectConversa = useCallback((conversa) => {
    if (!selecionarConversa) {
      console.error('❌ selecionarConversa não está disponível');
      return;
    }
    console.log('🖱️ MensagensMain.handleSelectConversa chamado para:', conversa.id);
    selecionarConversa(conversa);
    setShowChat(true);
  }, [selecionarConversa]);

  // Atualizar a ref sempre que a função mudar
  useEffect(() => {
    handleSelectRef.current = handleSelectConversa;
  }, [handleSelectConversa]);

  // Verificar se há uma conversa na URL ao carregar (de notificação)
  useEffect(() => {
    if (!loading && conversas.length > 0 && selecionarConversa) {
      const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
      const conversaIdFromUrl = urlParams.get('conversa');
      
      if (conversaIdFromUrl && !conversaAtiva) {
        console.log('🔗 Conversa da URL detectada:', conversaIdFromUrl);
        
        const conversa = conversas.find(c => c.id === conversaIdFromUrl);
        if (conversa) {
          console.log('✅ Abrindo conversa da notificação:', conversa.nome);
          handleSelectConversa(conversa);
        } else {
          console.warn('⚠️ Conversa não encontrada:', conversaIdFromUrl);
        }
      }
    }
  }, [loading, conversas, conversaAtiva, handleSelectConversa, selecionarConversa]);

  // Inicializar sistema avançado de notificações
  useEffect(() => {
    if (usuario?.id) {
      notificationManager.initialize(usuario.id)
        .then(result => {
          console.log('✅ Sistema de notificações inicializado:', result);
          if (result.permission === 'granted') {
            console.log('🔔 Permissão de notificações concedida');
          } else {
            console.log('🔕 Permissão de notificações:', result.permission);
          }
        })
        .catch(err => {
          console.error('❌ Erro ao inicializar notificações:', err);
        });
    }

    // Listener para mensagens do Service Worker (clique em notificação)
    const handleServiceWorkerMessage = (event) => {
      console.log('📨 Mensagem do Service Worker:', event.data);
      
      if (event.data.type === 'NOTIFICATION_CLICKED' || event.data.type === 'NAVIGATE_TO_CONVERSA') {
        const conversaId = event.data.conversaId;
        
        if (conversaId) {
          console.log('🎯 Navegando para conversa:', conversaId);
          
          // Encontrar a conversa
          const conversa = conversas.find(c => c.id === conversaId);
          
          if (conversa) {
            // Selecionar conversa usando a ref
            if (handleSelectRef.current) {
              handleSelectRef.current(conversa);
            }
          } else {
            console.warn('⚠️ Conversa não encontrada:', conversaId);
            // Tentar recarregar conversas
            window.location.hash = `#/mensagens?conversa=${conversaId}`;
          }
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if (notificationManager) {
        notificationManager.cleanup();
      }
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [usuario?.id, conversas]);

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

  return (
    <div className="h-full flex bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Lista de conversas - Desktop sempre visível, Mobile condicional */}
      <div className={`
        w-full lg:w-96 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col
        ${showChat ? 'hidden lg:flex' : 'flex'}
      `}>
        <ListaConversas
          onSelectConversa={handleSelectConversa}
          conversaSelecionada={conversaAtiva}
          onNovaConversa={() => setShowNovaConversa(true)}
          onOpenNotificationSettings={() => setShowNotificationSettings(true)}
          onDeleteConversa={apagarConversa}
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

      {/* Janela de chat - Desktop sempre visível, Mobile condicional */}
      <div className={`
        flex-1 h-full flex flex-col
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
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Sistema de Mensagens
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
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
