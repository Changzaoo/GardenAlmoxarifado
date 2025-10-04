import React, { useState, useEffect } from 'react';
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
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('MensagensMain - Conversas do hook MUDARAM');
    console.log('Quantidade:', conversas.length);
    console.log('IDs:', conversas.map(c => c.id));
    console.log('Loading:', loading);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  }, [conversas, loading]);

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

    return () => {
      if (notificationManager) {
        notificationManager.cleanup();
      }
    };
  }, [usuario?.id]);

  const handleSelectConversa = (conversa) => {
    console.log('🖱️ MensagensMain.handleSelectConversa chamado para:', conversa.id);
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

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Lista de conversas - Desktop sempre visível, Mobile condicional */}
      <div className={`
        w-full lg:w-96 border-r border-gray-200 dark:border-gray-700
        ${showChat ? 'hidden lg:block' : 'block'}
      `}>
        <ListaConversas
          onSelectConversa={handleSelectConversa}
          conversaSelecionada={conversaAtiva}
          onNovaConversa={() => setShowNovaConversa(true)}
          onOpenNotificationSettings={() => setShowNotificationSettings(true)}
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
        flex-1 
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
