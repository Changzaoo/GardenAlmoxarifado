import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import mensagensService from '../services/mensagensService';
import {
  USER_STATUS,
  MESSAGE_TYPE,
  LIMITS,
  UI_CONFIG,
  NOTIFICATION_SOUNDS
} from '../constants/mensagensConstants';
import { toast } from 'react-toastify';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { listenerManager, QUERY_LIMITS } from '../utils/memoryOptimization';

/**
 * Hook customizado para gerenciar mensagens em tempo real
 * Centraliza toda a lógica de negócio do sistema de chat
 */
export const useMensagens = () => {
  const { usuario } = useAuth();
  const [conversas, setConversas] = useState([]);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(!usuario?.id);
  const [enviando, setEnviando] = useState(false);
  const [digitando, setDigitando] = useState({});
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  
  const unsubscribeConversas = useRef(null);
  const unsubscribeMensagens = useRef(null);
  const unsubscribeNotificacoes = useRef(null);
  const unsubscribeGlobalListeners = useRef({}); // Listeners globais de todas as conversas
  const typingTimeoutRef = useRef(null);
  const conversaAtivaRef = useRef(null); // Ref para evitar loop de dependencia
  const conversasBackupRef = useRef([]); // Backup das conversas para prevenir perda
  const ultimasMensagensCache = useRef({}); // Cache das últimas mensagens por conversa

  // ==================== NOTIFICAÇÕES ====================

  /**
   * Configura listener para notificações de mensagens
   */
  const setupMessageNotificationListener = useCallback((userId) => {

    try {
      const { collection, query, where, orderBy, onSnapshot } = require('firebase/firestore');
      const { db } = require('../firebaseConfig');
      
      const notificacoesRef = collection(db, 'notificacoes');
      const q = query(
        notificacoesRef,
        where('usuarioId', '==', userId),
        where('tipo', '==', 'mensagem'),
        where('lida', '==', false),
        orderBy('timestamp', 'desc')
      );

      unsubscribeNotificacoes.current = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificacao = change.doc.data();
            handleNewMessageNotification(notificacao);
          }
        });
      });

    } catch (error) {
      console.error('❌ Erro ao configurar listener de notificações:', error);
    }
  }, []);

  /**
   * Cria listeners globais para TODAS as conversas (OTIMIZADO para entrega instantânea)
   */
  const setupGlobalMessageListeners = useCallback((conversas) => {
    console.log('🌍 Configurando listeners globais para', conversas.length, 'conversas');

    conversas.forEach(conversa => {
      // Se já existe listener para essa conversa, não criar outro
      if (unsubscribeGlobalListeners.current[conversa.id]) {
        return;
      }

      // ⚡ OTIMIZAÇÃO: Listener otimizado para recebimento instantâneo
      const mensagensRef = collection(db, 'conversas', conversa.id, 'mensagens');
      const q = query(
        mensagensRef,
        orderBy('timestampCliente', 'desc'), // ⚡ Usar timestampCliente em vez de timestamp
        limit(1) // Apenas última mensagem
      );

      const unsubscribe = onSnapshot(
        q,
        {
          // ⚡ includeMetadataChanges para atualizações instantâneas do cache local
          includeMetadataChanges: false // false para evitar duplicatas
        },
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const novaMensagem = { id: change.doc.id, ...change.doc.data() };
              
              // Verificar se é uma mensagem nova (não está no cache)
              const ultimaMensagemId = ultimasMensagensCache.current[conversa.id];
              
              if (ultimaMensagemId !== novaMensagem.id) {
                console.log('📬 NOVA MENSAGEM recebida:', novaMensagem.id, 'na conversa:', conversa.id);

                // Atualizar cache
                ultimasMensagensCache.current[conversa.id] = novaMensagem.id;
                
                // Se não for do usuário atual
                if (novaMensagem.remetenteId !== usuario.id) {
                  // ⚡ ATUALIZAÇÃO INSTANTÂNEA da lista de conversas
                  setConversas(prevConversas => {
                    const conversaIndex = prevConversas.findIndex(c => c.id === conversa.id);
                    if (conversaIndex === -1) return prevConversas;
                    
                    const novasConversas = [...prevConversas];
                    const conversaAtualizada = {
                      ...novasConversas[conversaIndex],
                      ultimaMensagem: novaMensagem.textoOriginal || novaMensagem.texto,
                      atualizadaEm: novaMensagem.timestampLocal || new Date(novaMensagem.timestampCliente || Date.now()),
                      // Incrementar não lidas apenas se não estiver na conversa ativa
                      naoLidas: conversaAtivaRef.current?.id === conversa.id 
                        ? 0 
                        : (novasConversas[conversaIndex].naoLidas || 0) + 1
                    };
                    
                    // Remover do lugar atual e adicionar no topo (conversa mais recente)
                    novasConversas.splice(conversaIndex, 1);
                    novasConversas.unshift(conversaAtualizada);

                    // Atualizar total de não lidas
                    const total = novasConversas.reduce((acc, conv) => acc + (conv.naoLidas || 0), 0);
                    setTotalNaoLidas(total);

                    return novasConversas;
                  });
                  
                  // ⚡ Se não estiver na conversa ativa, tocar som e mostrar notificação
                  if (conversaAtivaRef.current?.id !== conversa.id) {
                    // Tocar som de notificação
                    playNotificationSound();
                    
                    // Enviar notificação push
                    sendPushNotification({
                      remetente: novaMensagem.remetenteNome || 'Nova Mensagem',
                      mensagem: novaMensagem.textoOriginal || novaMensagem.texto,
                      conversaId: conversa.id,
                      timestamp: novaMensagem.timestampLocal || new Date()
                    });

                    console.log('🔔 Notificação enviada para mensagem:', novaMensagem.id);
                  } else {
                    console.log('🔇 Usuário está na conversa ativa, sem notificação');
                  }
                }
              }
            }
          });
        },
        (error) => {
          console.error('❌ Erro no listener global da conversa', conversa.id, ':', error);
        }
      );

      // Armazenar unsubscribe
      unsubscribeGlobalListeners.current[conversa.id] = unsubscribe;
    });

    // Limpar listeners de conversas que não existem mais
    Object.keys(unsubscribeGlobalListeners.current).forEach(conversaId => {
      if (!conversas.find(c => c.id === conversaId)) {
        console.log('🧹 Removendo listener da conversa:', conversaId);
        unsubscribeGlobalListeners.current[conversaId]();
        delete unsubscribeGlobalListeners.current[conversaId];
        delete ultimasMensagensCache.current[conversaId];
      }
    });

  }, [usuario?.id]);

  /**
   * Toca som de notificação
   */
  const playNotificationSound = useCallback(() => {
    try {
      // Criar ou reutilizar áudio
      const audio = new Audio('/sounds/notification.wav');
      audio.volume = 0.6; // Volume ajustável
      audio.playbackRate = 1.0;
      
      // Tocar som
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Som de notificação reproduzido');
          })
          .catch(error => {
            console.warn('⚠️ Erro ao reproduzir som:', error.message);
            // Ignorar erro silenciosamente
          });
      }
    } catch (error) {
      console.warn('⚠️ Erro ao criar áudio de notificação:', error);
    }
  }, []);

  /**
   * Envia notificação push
   */
  const sendPushNotification = useCallback(({ remetente, mensagem, conversaId, timestamp }) => {
    try {
      // Verificar se está na conversa ativa
      if (conversaAtivaRef.current?.id === conversaId) {
        console.log('🔇 Usuário já está na conversa, sem notificação');
        return;
      }

      // Verificar se está na página de mensagens e janela ativa
      const isOnMessagesPage = window.location.hash.includes('#/mensagens') || 
                              window.location.pathname.includes('/mensagens');
      const isWindowActive = document.hasFocus() && !document.hidden;

      // Se está na página e janela ativa, apenas mostrar toast
      if (isOnMessagesPage && isWindowActive) {
        toast.info(`💬 ${remetente}: ${mensagem}`, {
          autoClose: 4000,
          position: 'top-right',
          onClick: () => {
            if (conversaId) {
              const conversaAtual = conversas.find(c => c.id === conversaId);
              if (conversaAtual) {
                setConversaAtiva(conversaAtual);
                conversaAtivaRef.current = conversaAtual;
              }
            }
          }
        });
        return;
      }

      // Verificar permissão de notificação
      if (!('Notification' in window)) {
        console.warn('⚠️ Navegador não suporta notificações');
        return;
      }

      if (Notification.permission !== 'granted') {
        console.log('🔔 Permissão de notificação não concedida');
        return;
      }

      // NOTIFICAÇÃO PUSH NATIVA
      // Tentar usar Service Worker (melhor para persistência)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((registration) => {
            if (registration.showNotification) {
              return registration.showNotification(remetente || 'Nova Mensagem', {
                body: mensagem.substring(0, 100) + (mensagem.length > 100 ? '...' : ''),
                icon: '/logo192.png',
                badge: '/logo192.png',
                tag: `msg-${conversaId}`,
                data: {
                  conversaId,
                  url: `/#/mensagens?conversa=${conversaId}`,
                  timestamp: timestamp?.toDate?.() || new Date()
                },
                requireInteraction: false,
                vibrate: [200, 100, 200], // Padrão de vibração
                silent: false,
                actions: [
                  {
                    action: 'open',
                    title: '📖 Abrir'
                  },
                  {
                    action: 'close',
                    title: '✖️ Fechar'
                  }
                ]
              });
            } else {
              // Fallback para notificação básica
              return showBasicNotification(remetente, mensagem, conversaId);
            }
          })
          .then(() => {
            console.log('✅ Notificação push enviada');
          })
          .catch((error) => {
            console.error('❌ Erro ao enviar notificação via SW:', error);
            // Fallback para notificação básica
            showBasicNotification(remetente, mensagem, conversaId);
          });
      } else {
        // Notificação básica do navegador
        showBasicNotification(remetente, mensagem, conversaId);
      }

      // Toast como backup visual
      toast.info(`💬 ${remetente}: ${mensagem.substring(0, 50)}${mensagem.length > 50 ? '...' : ''}`, {
        autoClose: 5000,
        position: 'top-right',
        onClick: () => {
          window.focus();
          if (conversaId) {
            window.location.hash = `#/mensagens?conversa=${conversaId}`;
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao enviar notificação push:', error);
    }

    // Função helper para notificação básica
    function showBasicNotification(remetente, mensagem, conversaId) {
      try {
        const notification = new Notification(remetente || 'Nova Mensagem', {
          body: mensagem.substring(0, 100),
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: `msg-${conversaId}`,
          requireInteraction: false,
          vibrate: [200, 100, 200],
          data: { conversaId }
        });

        notification.onclick = () => {
          window.focus();
          window.location.hash = conversaId 
            ? `#/mensagens?conversa=${conversaId}`
            : '#/mensagens';
          notification.close();
        };

        // Auto-fechar após 10 segundos
        setTimeout(() => {
          try {
            notification.close();
          } catch (e) {
            // Ignorar
          }
        }, 10000);

        console.log('✅ Notificação básica exibida');
      } catch (error) {
        console.error('❌ Erro ao criar notificação básica:', error);
      }
    }
  }, [conversas]);

  /**
   * Manipula notificação de nova mensagem
   */
  const handleNewMessageNotification = useCallback((notificacao) => {

    const { titulo, mensagem, remetente, dados } = notificacao;
    const conversaId = dados?.conversaId;

    // Tocar som de notificação
    playNotificationSound();

    // Enviar notificação push
    sendPushNotification({
      remetente: remetente || titulo || 'Nova Mensagem',
      mensagem: mensagem || 'Você recebeu uma nova mensagem',
      conversaId,
      timestamp: notificacao.timestamp || new Date()
    });

  }, [playNotificationSound, sendPushNotification]);

  // ==================== INICIALIZACAO ====================

  useEffect(() => {
    if (!usuario) {

      setLoading(false);
      return;
    }

    if (!usuario.id) {
      console.error('ERRO CRITICO: Usuario sem campo "id"!');
      console.error('Usuario recebido:', usuario);
      toast.error('Erro: Usuario sem ID. Faca logout e login novamente.');
      setLoading(false);
      return;
    }

    // Tentar recuperar backup do localStorage
    try {
      const backup = localStorage.getItem('conversas_backup');
      if (backup) {
        const conversasBackup = JSON.parse(backup);
        if (conversasBackup && conversasBackup.length > 0) {

          conversasBackupRef.current = conversasBackup;
          setConversas(conversasBackup); // Mostrar imediatamente
        }
      }
    } catch (e) {

    }

    // Atualizar status para online ao montar
    mensagensService.updateUserStatus(usuario.id, USER_STATUS.ONLINE).catch(err => {
      console.error('Erro ao atualizar status:', err);
    });

    // Escutar notificações de novas mensagens
    setupMessageNotificationListener(usuario.id);

    // Escutar conversas do usuario
    setLoading(true);

    unsubscribeConversas.current = mensagensService.listenToConversations(
      usuario.id,
      (novasConversas) => {

        // PROTECAO: Se novasConversas for vazio mas backup tem conversas, usar backup
        if (novasConversas.length === 0 && conversasBackupRef.current.length > 0) {

          novasConversas = conversasBackupRef.current;
        }
        
        // Atualizar backup
        if (novasConversas.length > 0) {

          conversasBackupRef.current = novasConversas;
          // Salvar tambem no localStorage como ultima linha de defesa
          try {
            localStorage.setItem('conversas_backup', JSON.stringify(novasConversas));
          } catch (e) {

          }
        }
        
        // Filtrar conversas deletadas para o usuário atual
        const conversasFiltradas = novasConversas.filter(conversa => {
          // Se a conversa foi deletada para este usuário, não mostrar
          if (conversa.deletadaPara && conversa.deletadaPara[usuario.id]) {
            return false;
          }
          return true;
        });

        console.trace('Stack trace do callback');

        setConversas(conversasFiltradas);
        setLoading(false);
        atualizarTotalNaoLidas(conversasFiltradas);
        
        // Configurar listeners globais para todas as conversas
        setupGlobalMessageListeners(novasConversas);

      }
    );

    // Atualizar status para offline ao desmontar
    return () => {

      if (unsubscribeConversas.current) {

        unsubscribeConversas.current();
        unsubscribeConversas.current = null;
      }
      if (unsubscribeMensagens.current) {

        unsubscribeMensagens.current();
        unsubscribeMensagens.current = null;
      }
      if (unsubscribeNotificacoes.current) {

        unsubscribeNotificacoes.current();
        unsubscribeNotificacoes.current = null;
      }
      // Limpar listeners globais
      if (unsubscribeGlobalListeners.current) {

        Object.values(unsubscribeGlobalListeners.current).forEach(unsubscribe => {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        });
        unsubscribeGlobalListeners.current = {};
      }
      if (usuario?.id) {
        mensagensService.updateUserStatus(usuario.id, USER_STATUS.OFFLINE);
      }
    };
  }, [usuario?.id, setupMessageNotificationListener, setupGlobalMessageListeners]);

  // Sincronizar ref com estado
  useEffect(() => {
    conversaAtivaRef.current = conversaAtiva;
  }, [conversaAtiva]);

  // MONITOR: Rastrear mudanças no totalNaoLidas
  useEffect(() => {

  }, [totalNaoLidas]);

  // MONITOR: Rastrear TODAS as mudancas no estado conversas
  useEffect(() => {

    console.trace('Stack trace da mudanca');

    // ALERTA CRITICO: Se conversas ficarem vazias mas backup tem dados
    if (conversas.length === 0 && conversasBackupRef.current.length > 0) {
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('ALERTA CRITICO: CONVERSAS FORAM PERDIDAS!');
      console.error('Estado atual: 0 conversas');
      console.error('Backup tem:', conversasBackupRef.current.length, 'conversas');
      console.error('RESTAURANDO DO BACKUP AUTOMATICAMENTE...');
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      
      // Restaurar do backup
      setTimeout(() => {

        setConversas(conversasBackupRef.current);
      }, 100);
    }
  }, [conversas]);

  // ==================== CONVERSAS ====================

  /**
   * Seleciona uma conversa para abrir
   */
  const selecionarConversa = useCallback((conversa) => {

    console.trace('Stack trace da chamada:');

    // Se for a mesma conversa, nao fazer nada
    if (conversaAtivaRef.current?.id === conversa.id) {

      return;
    }

    // Parar de escutar mensagens antigas
    if (unsubscribeMensagens.current) {

      unsubscribeMensagens.current();
      unsubscribeMensagens.current = null;
    }

    // Atualizar ref antes de atualizar estado

    conversaAtivaRef.current = conversa;

    setConversaAtiva(conversa);
    
    // ATUALIZAR CONTADOR LOCALMENTE (UX instantâneo)
    const naoLidasAntes = conversa.naoLidas || 0;
    if (naoLidasAntes > 0) {

      setConversas(prevConversas => {
        return prevConversas.map(c => {
          if (c.id === conversa.id) {
            return { ...c, naoLidas: 0 };
          }
          return c;
        });
      });
      
      // Atualizar total de não lidas
      setTotalNaoLidas(prev => Math.max(0, prev - naoLidasAntes));

    }
    
    // ZERAR CONTADOR NO FIREBASE (em background)

    mensagensService.clearUnreadCount(conversa.id, usuario.id).catch(err => {
      console.error('Erro ao zerar contador:', err);
    });

    // MARCAR NOTIFICAÇÕES COMO LIDAS
    marcarNotificacoesComoLidas(conversa.id);
    
    // NAO limpar mensagens - sera feito pelo listener

    // Escutar mensagens da nova conversa

    unsubscribeMensagens.current = mensagensService.listenToMessages(
      conversa.id,
      usuario.id,
      LIMITS.MESSAGES_PER_PAGE,
      (novasMensagens) => {

        setMensagens(novasMensagens);

        // Marcar como lidas
        const mensagensNaoLidas = novasMensagens
          .filter(msg => 
            msg.remetenteId !== usuario.id && 
            !msg.leitaPor?.includes(usuario.id)
          )
          .map(msg => msg.id);

        if (mensagensNaoLidas.length > 0) {
          marcarComoLidas(conversa.id, mensagensNaoLidas);
        }
      }
    );
  }, [usuario?.id]); // Removido conversaAtiva das dependencias!

  /**
   * Cria ou abre conversa com outro usuario
   */
  const iniciarConversa = useCallback(async (outroUsuarioId) => {
    try {
      const conversa = await mensagensService.getOrCreateConversation(
        usuario.id,
        outroUsuarioId
      );
      selecionarConversa(conversa);
      return conversa;
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error('Nao foi possivel iniciar a conversa');
      throw error;
    }
  }, [usuario?.id, selecionarConversa]);

  /**
   * Cria um grupo
   */
  const criarGrupo = useCallback(async (nome, descricao, participantes, imagemUrl) => {
    try {
      const grupo = await mensagensService.createGroup(
        usuario.id,
        nome,
        descricao,
        participantes,
        imagemUrl
      );
      toast.success('Grupo criado com sucesso!');
      return grupo;
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast.error('Nao foi possivel criar o grupo');
      throw error;
    }
  }, [usuario?.id]);

  /**
   * Atualiza configuracoes da conversa
   */
  const atualizarConfiguracoesConversa = useCallback(async (conversaId, settings) => {
    try {
      await mensagensService.updateConversationSettings(conversaId, usuario.id, settings);
      toast.success('Configuracoes atualizadas!');
    } catch (error) {
      console.error('Erro ao atualizar configuracoes:', error);
      toast.error('Nao foi possivel atualizar as configuracoes');
    }
  }, [usuario?.id]);

  // ==================== MENSAGENS ====================

  /**
   * Envia uma mensagem de texto (OPTIMISTIC UI - atualização instantânea)
   */
  const enviarMensagem = useCallback(async (conversaId, texto) => {
    if (!texto.trim()) return;
    
    const textoTrimmed = texto.trim();
    const mensagemTemporaria = {
      id: `temp-${Date.now()}`,
      texto: textoTrimmed,
      remetenteId: usuario.id,
      tipo: MESSAGE_TYPE.TEXTO,
      status: 'enviando',
      timestamp: new Date(),
      timestampCliente: Date.now(),
      encrypted: false,
      editada: false,
      deletada: false,
      leitaPor: [usuario.id],
      entregueA: [usuario.id],
      conversaId,
      isTemporary: true
    };

    // ⚡ OPTIMISTIC UPDATE: Adicionar mensagem imediatamente na UI
    setMensagens(prev => [...prev, mensagemTemporaria]);

    // ⚡ OPTIMISTIC UPDATE: Atualizar lista de conversas imediatamente
    setConversas(prevConversas => {
      const conversaIndex = prevConversas.findIndex(c => c.id === conversaId);
      if (conversaIndex === -1) return prevConversas;
      
      const novasConversas = [...prevConversas];
      const conversaAtualizada = {
        ...novasConversas[conversaIndex],
        ultimaMensagem: textoTrimmed.substring(0, 50),
        atualizadaEm: new Date(),
      };
      
      // Mover para o topo
      novasConversas.splice(conversaIndex, 1);
      novasConversas.unshift(conversaAtualizada);

      return novasConversas;
    });
    
    setEnviando(true);
    try {
      // Enviar para o servidor
      const mensagemEnviada = await mensagensService.sendMessage(
        conversaId,
        usuario.id,
        textoTrimmed,
        MESSAGE_TYPE.TEXTO
      );
      
      // ✅ Substituir mensagem temporária pela real
      setMensagens(prev => 
        prev.map(msg => 
          msg.id === mensagemTemporaria.id 
            ? { ...mensagemEnviada, status: MESSAGE_STATUS.ENVIADA }
            : msg
        )
      );

      console.log('✅ Mensagem enviada com sucesso:', mensagemEnviada.id);
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // ❌ Marcar mensagem como erro
      setMensagens(prev => 
        prev.map(msg => 
          msg.id === mensagemTemporaria.id 
            ? { ...msg, status: 'erro', error: error.message }
            : msg
        )
      );
      
      toast.error('Não foi possível enviar a mensagem. Clique para tentar novamente.', {
        onClick: () => {
          // Retry: remover mensagem com erro e tentar novamente
          setMensagens(prev => prev.filter(msg => msg.id !== mensagemTemporaria.id));
          enviarMensagem(conversaId, textoTrimmed);
        }
      });
    } finally {
      setEnviando(false);
    }
  }, [usuario?.id]);

  /**
   * Envia arquivo
   */
  const enviarArquivo = useCallback(async (conversaId, file, tipo) => {
    setEnviando(true);
    try {
      const url = await mensagensService.uploadFile(file, tipo);
      await mensagensService.sendMessage(
        conversaId,
        usuario.id,
        url,
        tipo,
        url
      );
      
      // ATUALIZAR LISTA DE CONVERSAS LOCALMENTE (UX instantâneo)

      setConversas(prevConversas => {
        const conversaIndex = prevConversas.findIndex(c => c.id === conversaId);
        if (conversaIndex === -1) return prevConversas;
        
        const novasConversas = [...prevConversas];
        const tipoEmoji = tipo === MESSAGE_TYPE.IMAGEM ? '🖼️' : 
                         tipo === MESSAGE_TYPE.AUDIO ? '🎵' : 
                         tipo === MESSAGE_TYPE.VIDEO ? '🎥' : '📎';
        const conversaAtualizada = {
          ...novasConversas[conversaIndex],
          ultimaMensagem: `${tipoEmoji} ${tipo}`,
          atualizadaEm: new Date(),
        };
        
        // Mover para o topo
        novasConversas.splice(conversaIndex, 1);
        novasConversas.unshift(conversaAtualizada);

        return novasConversas;
      });
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Nao foi possivel enviar o arquivo');
    } finally {
      setEnviando(false);
    }
  }, [usuario?.id]);

  /**
   * Deleta mensagem
   */
  const deletarMensagem = useCallback(async (conversaId, mensagemId) => {
    try {
      await mensagensService.deleteMessage(conversaId, mensagemId);
      toast.success('Mensagem deletada!');
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      toast.error('Nao foi possivel deletar a mensagem');
    }
  }, []);

  /**
   * Apaga mensagem apenas para o usuario atual
   */
  const apagarParaMim = useCallback(async (conversaId, mensagemId) => {
    try {
      await mensagensService.deleteMessageForMe(conversaId, mensagemId, usuario.id);
      toast.success('Mensagem apagada para voce');
    } catch (error) {
      console.error('Erro ao apagar mensagem para mim:', error);
      toast.error('Nao foi possivel apagar a mensagem');
    }
  }, [usuario?.id]);

  /**
   * Apaga mensagem para todos os participantes
   */
  const apagarParaTodos = useCallback(async (conversaId, mensagemId) => {
    try {
      await mensagensService.deleteMessageForEveryone(conversaId, mensagemId, usuario.id);
      toast.success('Mensagem apagada para todos');
    } catch (error) {
      console.error('Erro ao apagar mensagem para todos:', error);
      toast.error(error.message || 'Nao foi possivel apagar a mensagem');
    }
  }, [usuario?.id]);

  /**
   * Edita mensagem
   */
  const editarMensagem = useCallback(async (conversaId, mensagemId, novoTexto) => {
    try {
      await mensagensService.editMessage(conversaId, mensagemId, novoTexto);
      toast.success('Mensagem editada!');
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      toast.error('Nao foi possivel editar a mensagem');
    }
  }, []);

  /**
   * Apaga conversa apenas para o usuário atual
   * A conversa continua existindo para outros participantes
   */
  const apagarConversa = useCallback(async (conversaId) => {
    try {
      await mensagensService.deleteConversationForUser(conversaId, usuario.id);
      
      // Remove conversa do estado local
      setConversas(prev => prev.filter(c => c.id !== conversaId));
      
      // Se a conversa apagada era a ativa, limpa seleção
      if (conversaAtiva?.id === conversaId) {
        setConversaAtiva(null);
        setMensagens([]);
      }
      
      toast.success('Conversa apagada');
    } catch (error) {
      console.error('Erro ao apagar conversa:', error);
      toast.error('Não foi possível apagar a conversa');
    }
  }, [usuario?.id, conversaAtiva]);

  /**
   * Marca mensagens como lidas
   */
  const marcarComoLidas = useCallback(async (conversaId, mensagemIds) => {
    try {
      await mensagensService.markAsRead(conversaId, usuario.id, mensagemIds);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, [usuario?.id]);

  /**
   * Carrega mensagens antigas (paginacao)
   */
  const carregarMensagensAntigas = useCallback(async () => {
    if (!conversaAtiva) return;
    // Implementar paginacao aqui

  }, [conversaAtiva]);

  /**
   * Atualiza indicador de digitacao
   */
  const atualizarDigitacao = useCallback((conversaId, isTyping) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      mensagensService.setTyping(conversaId, usuario.id, true);
      typingTimeoutRef.current = setTimeout(() => {
        mensagensService.setTyping(conversaId, usuario.id, false);
      }, 3000);
    } else {
      mensagensService.setTyping(conversaId, usuario.id, false);
    }
  }, [usuario?.id]);

  /**
   * Verifica se conversa esta bloqueada
   */
  const verificarBloqueio = useCallback(async (conversaId) => {
    try {
      return await mensagensService.isConversationBlocked(conversaId, usuario.id);
    } catch (error) {
      console.error('Erro ao verificar bloqueio:', error);
      return false;
    }
  }, [usuario?.id]);

  /**
   * Obtem outro participante da conversa (para DM)
   */
  const getOutroParticipante = useCallback((conversa) => {
    if (!conversa || conversa.tipo === 'grupo') return null;
    return conversa.participantes?.find(p => p !== usuario.id) || null;
  }, [usuario?.id]);

  /**
   * Formata timestamp para exibicao
   */
  const formatarTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Menos de 1 minuto
    if (diff < 60000) return 'Agora';
    
    // Menos de 1 hora
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}min`;
    }
    
    // Menos de 24 horas
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    }
    
    // Menos de 7 dias
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d`;
    }
    
    // Mais de 7 dias - mostrar data
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }, []);

  /**
   * Atualiza total de mensagens nao lidas
   */
  const atualizarTotalNaoLidas = useCallback((conversas) => {
    const total = conversas.reduce((acc, conv) => acc + (conv.naoLidas || 0), 0);

    setTotalNaoLidas(total);
  }, []);

  /**
   * Busca informacoes de um participante
   */
  const buscarInfoParticipante = useCallback(async (participanteId) => {
    try {
      const info = await mensagensService.getUserInfo(participanteId);
      return info;
    } catch (error) {
      console.error('Erro ao buscar info do participante:', error);
      return null;
    }
  }, []);

  /**
   * Marca notificações de uma conversa como lidas
   */
  const marcarNotificacoesComoLidas = useCallback(async (conversaId) => {
    try {
      const { collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');
      const { db } = require('../firebaseConfig');
      
      const notificacoesRef = collection(db, 'notificacoes');
      const q = query(
        notificacoesRef,
        where('usuarioId', '==', usuario.id),
        where('tipo', '==', 'mensagem'),
        where('dados.conversaId', '==', conversaId),
        where('lida', '==', false)
      );

      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(docSnap => 
        updateDoc(doc(db, 'notificacoes', docSnap.id), { lida: true })
      );

      await Promise.all(promises);

    } catch (error) {
      console.error('❌ Erro ao marcar notificações como lidas:', error);
    }
  }, [usuario?.id]);

  // Retornar todos os estados e funcoes
  return {
    // Estados
    conversas,
    conversaAtiva,
    mensagens,
    loading,
    enviando,
    digitando,
    totalNaoLidas,
    
    // Funcoes de conversas
    selecionarConversa,
    iniciarConversa,
    criarGrupo,
    atualizarConfiguracoesConversa,
    apagarConversa,
    
    // Funcoes de mensagens
    enviarMensagem,
    enviarArquivo,
    deletarMensagem,
    apagarParaMim,
    apagarParaTodos,
    editarMensagem,
    marcarComoLidas,
    carregarMensagensAntigas,
    
    // Funcoes auxiliares
    atualizarDigitacao,
    verificarBloqueio,
    getOutroParticipante,
    buscarInfoParticipante,
    formatarTimestamp,
  };
};
