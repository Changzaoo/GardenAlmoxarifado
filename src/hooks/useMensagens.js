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
    console.log('🔔 Configurando listener de notificações...');
    
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

      console.log('✅ Listener de notificações configurado');
    } catch (error) {
      console.error('❌ Erro ao configurar listener de notificações:', error);
    }
  }, []);

  /**
   * Cria listeners globais para todas as conversas (receber mensagens em tempo real)
   */
  const setupGlobalMessageListeners = useCallback((conversas) => {
    console.log('🌐 Configurando listeners globais para', conversas.length, 'conversas');

    conversas.forEach(conversa => {
      // Se já existe listener para essa conversa, não criar outro
      if (unsubscribeGlobalListeners.current[conversa.id]) {
        return;
      }

      console.log('👂 Criando listener global para conversa:', conversa.id);

      // Criar listener apenas para a última mensagem (otimização)
      const mensagensRef = collection(db, 'conversas', conversa.id, 'mensagens');
      const q = query(
        mensagensRef,
        orderBy('timestamp', 'desc'),
        limit(1) // Apenas última mensagem
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const novaMensagem = { id: change.doc.id, ...change.doc.data() };
            
            // Verificar se é uma mensagem nova (não está no cache)
            const ultimaMensagemId = ultimasMensagensCache.current[conversa.id];
            
            if (ultimaMensagemId !== novaMensagem.id) {
              console.log('📩 NOVA MENSAGEM RECEBIDA em tempo real!', conversa.id);
              console.log('De:', novaMensagem.remetenteId);
              console.log('Texto preview:', novaMensagem.textoOriginal || novaMensagem.texto?.substring(0, 30));
              
              // Atualizar cache
              ultimasMensagensCache.current[conversa.id] = novaMensagem.id;
              
              // Se não for do usuário atual e não estiver na conversa ativa
              if (novaMensagem.remetenteId !== usuario.id) {
                // FORÇAR ATUALIZAÇÃO DA LISTA DE CONVERSAS
                console.log('🔄 Forçando atualização da lista de conversas...');
                
                // Atualizar o estado das conversas para triggerar re-render
                setConversas(prevConversas => {
                  // Encontrar a conversa que recebeu a mensagem
                  const conversaIndex = prevConversas.findIndex(c => c.id === conversa.id);
                  if (conversaIndex === -1) return prevConversas;
                  
                  // Criar nova array com a conversa atualizada
                  const novasConversas = [...prevConversas];
                  const conversaAtualizada = {
                    ...novasConversas[conversaIndex],
                    ultimaMensagem: novaMensagem.textoOriginal || novaMensagem.texto,
                    atualizadaEm: novaMensagem.timestamp,
                    // Incrementar não lidas apenas se não estiver na conversa ativa
                    naoLidas: conversaAtivaRef.current?.id === conversa.id 
                      ? 0 
                      : (novasConversas[conversaIndex].naoLidas || 0) + 1
                  };
                  
                  // Remover do lugar atual e adicionar no topo
                  novasConversas.splice(conversaIndex, 1);
                  novasConversas.unshift(conversaAtualizada);
                  
                  console.log('✅ Lista de conversas atualizada! Nova ordem:', novasConversas.map(c => c.id));
                  
                  // Atualizar total de não lidas
                  const total = novasConversas.reduce((acc, conv) => acc + (conv.naoLidas || 0), 0);
                  setTotalNaoLidas(total);
                  console.log('🔔 Total de não lidas atualizado para:', total);
                  
                  return novasConversas;
                });
                
                // Tocar som se não estiver na conversa
                if (conversaAtivaRef.current?.id !== conversa.id) {
                  try {
                    const audio = new Audio('/sounds/notification.mp3');
                    audio.volume = 0.3;
                    audio.play().catch(e => console.log('Som não disponível'));
                  } catch (e) {
                    // Ignorar
                  }
                }
              }
            }
          }
        });
      });

      // Armazenar unsubscribe
      unsubscribeGlobalListeners.current[conversa.id] = unsubscribe;
    });

    // Limpar listeners de conversas que não existem mais
    Object.keys(unsubscribeGlobalListeners.current).forEach(conversaId => {
      if (!conversas.find(c => c.id === conversaId)) {
        console.log('🧹 Limpando listener obsoleto:', conversaId);
        unsubscribeGlobalListeners.current[conversaId]();
        delete unsubscribeGlobalListeners.current[conversaId];
        delete ultimasMensagensCache.current[conversaId];
      }
    });

  }, [usuario?.id]);

  /**
   * Manipula notificação de nova mensagem
   */
  const handleNewMessageNotification = useCallback((notificacao) => {
    console.log('🔔 Nova notificação de mensagem:', notificacao);

    const { titulo, mensagem, remetente, dados } = notificacao;
    const conversaId = dados?.conversaId;

    // Verificar se usuário está na conversa ativa
    if (conversaAtivaRef.current?.id === conversaId) {
      console.log('🔕 Usuário já está nesta conversa, não mostrar notificação');
      return;
    }

    // Verificar se está na página de mensagens e janela ativa
    const isOnMessagesPage = window.location.hash.includes('#/mensagens') || 
                            window.location.pathname.includes('/mensagens');
    const isWindowActive = document.hasFocus() && !document.hidden;

    if (isOnMessagesPage && isWindowActive) {
      console.log('🔕 Usuário está na página de mensagens ativa, apenas toast');
      toast.info(`${remetente}: ${mensagem}`, {
        icon: '💬',
        autoClose: 4000,
        onClick: () => {
          // Navegar para a conversa
          if (conversaId) {
            window.location.hash = `#/mensagens?conversa=${conversaId}`;
          }
        }
      });
      return;
    }

    // NOTIFICAÇÃO NATIVA (funciona em desktop e mobile)
    if ('Notification' in window && Notification.permission === 'granted') {
      // Tentar usar Service Worker para notificação (melhor para mobile)
      if ('serviceWorker' in navigator && navigator.serviceWorker) {
        console.log('📱 Enviando notificação via Service Worker...');
        
        navigator.serviceWorker.ready.then((registration) => {
          if (!registration || !registration.showNotification) {
            console.warn('⚠️ Registration.showNotification não disponível');
            showWebNotification(remetente, mensagem, conversaId);
            return;
          }
          
          registration.showNotification(remetente || titulo || 'Nova Mensagem', {
            body: mensagem,
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: `msg-${conversaId}`,
            data: {
              conversaId,
              url: conversaId ? `/#/mensagens?conversa=${conversaId}` : '/#/mensagens',
              timestamp: Date.now()
            },
            requireInteraction: false,
            vibrate: [200, 100, 200],
            actions: [
              {
                action: 'open',
                title: '📖 Abrir'
              }
            ],
            silent: false
          }).then(() => {
            console.log('✅ Notificação enviada via Service Worker');
          }).catch(err => {
            console.error('❌ Erro ao enviar notificação via SW:', err);
            // Fallback para notificação web normal
            showWebNotification(remetente, mensagem, conversaId);
          });
        }).catch(err => {
          console.error('❌ Service Worker não disponível:', err);
          // Fallback para notificação web normal
          showWebNotification(remetente, mensagem, conversaId);
        });
      } else {
        // Fallback: Notificação web normal (desktop)
        showWebNotification(remetente, mensagem, conversaId);
      }

      // Tocar som
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Som não disponível'));
      } catch (e) {
        // Ignorar erro de som
      }
    }

    // Toast sempre (backup visual)
    toast.info(`${remetente}: ${mensagem}`, {
      icon: '💬',
      autoClose: 5000,
      onClick: () => {
        if (conversaId) {
          window.location.hash = `#/mensagens?conversa=${conversaId}`;
        }
      }
    });

    // Função helper para notificação web (fallback)
    function showWebNotification(remetente, mensagem, conversaId) {
      console.log('🌐 Mostrando notificação web (fallback)...');
      const notification = new Notification(remetente || 'Nova Mensagem', {
        body: mensagem,
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
      setTimeout(() => notification.close(), 10000);
    }

  }, []);

  // ==================== INICIALIZACAO ====================

  useEffect(() => {
    if (!usuario) {
      console.log('Nenhum usuario logado');
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

    console.log('useMensagens: Inicializando para usuario:', usuario.id);
    console.log('Nome:', usuario.nome);
    console.log('Email:', usuario.email);

    // Tentar recuperar backup do localStorage
    try {
      const backup = localStorage.getItem('conversas_backup');
      if (backup) {
        const conversasBackup = JSON.parse(backup);
        if (conversasBackup && conversasBackup.length > 0) {
          console.log('RECUPERANDO', conversasBackup.length, 'conversas do backup');
          conversasBackupRef.current = conversasBackup;
          setConversas(conversasBackup); // Mostrar imediatamente
        }
      }
    } catch (e) {
      console.warn('Nao foi possivel recuperar backup:', e);
    }

    // Atualizar status para online ao montar
    mensagensService.updateUserStatus(usuario.id, USER_STATUS.ONLINE).catch(err => {
      console.error('Erro ao atualizar status:', err);
    });

    // Escutar notificações de novas mensagens
    setupMessageNotificationListener(usuario.id);

    // Escutar conversas do usuario
    setLoading(true);
    console.log('=================================================');
    console.log('CRIANDO LISTENER DE CONVERSAS para usuario:', usuario.id);
    console.log('=================================================');
    
    unsubscribeConversas.current = mensagensService.listenToConversations(
      usuario.id,
      (novasConversas) => {
        console.log('=================================================');
        console.log('CALLBACK DE CONVERSAS EXECUTADO');
        console.log('Quantidade:', novasConversas.length);
        console.log('IDs das conversas:', novasConversas.map(c => c.id));
        console.log('Conversas completas:', novasConversas);
        
        // PROTECAO: Se novasConversas for vazio mas backup tem conversas, usar backup
        if (novasConversas.length === 0 && conversasBackupRef.current.length > 0) {
          console.warn('ALERTA: Listener retornou array vazio mas backup tem conversas!');
          console.warn('Backup tem', conversasBackupRef.current.length, 'conversas');
          console.warn('USANDO BACKUP ao inves de limpar!');
          novasConversas = conversasBackupRef.current;
        }
        
        // Atualizar backup
        if (novasConversas.length > 0) {
          console.log('Atualizando backup com', novasConversas.length, 'conversas');
          conversasBackupRef.current = novasConversas;
          // Salvar tambem no localStorage como ultima linha de defesa
          try {
            localStorage.setItem('conversas_backup', JSON.stringify(novasConversas));
          } catch (e) {
            console.warn('Nao foi possivel salvar backup no localStorage:', e);
          }
        }
        
        console.log('Chamando setConversas com', novasConversas.length, 'conversas');
        console.trace('Stack trace do callback');
        console.log('=================================================');
        
        setConversas(novasConversas);
        setLoading(false);
        atualizarTotalNaoLidas(novasConversas);
        
        // Configurar listeners globais para todas as conversas
        setupGlobalMessageListeners(novasConversas);
        
        console.log('setConversas EXECUTADO');
        console.log('setLoading(false) EXECUTADO');
      }
    );
    
    console.log('Listener de conversas CRIADO e ARMAZENADO no ref');

    // Atualizar status para offline ao desmontar
    return () => {
      console.log('Limpeza do useMensagens hook');
      if (unsubscribeConversas.current) {
        console.log('Desconectando listener de conversas');
        unsubscribeConversas.current();
        unsubscribeConversas.current = null;
      }
      if (unsubscribeMensagens.current) {
        console.log('Desconectando listener de mensagens');
        unsubscribeMensagens.current();
        unsubscribeMensagens.current = null;
      }
      if (unsubscribeNotificacoes.current) {
        console.log('Desconectando listener de notificações');
        unsubscribeNotificacoes.current();
        unsubscribeNotificacoes.current = null;
      }
      // Limpar listeners globais
      if (unsubscribeGlobalListeners.current) {
        console.log('Desconectando listeners globais de mensagens');
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
    console.log('🔔🔔🔔 TOTAL NÃO LIDAS MUDOU:', totalNaoLidas);
  }, [totalNaoLidas]);

  // MONITOR: Rastrear TODAS as mudancas no estado conversas
  useEffect(() => {
    console.log('###############################################');
    console.log('ESTADO CONVERSAS MUDOU!');
    console.log('Quantidade atual:', conversas.length);
    console.log('IDs:', conversas.map(c => c.id));
    console.log('Backup tem:', conversasBackupRef.current.length);
    console.trace('Stack trace da mudanca');
    console.log('###############################################');
    
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
        console.log('Restaurando conversas do backup...');
        setConversas(conversasBackupRef.current);
      }, 100);
    }
  }, [conversas]);

  // ==================== CONVERSAS ====================

  /**
   * Seleciona uma conversa para abrir
   */
  const selecionarConversa = useCallback((conversa) => {
    console.log('===============================================');
    console.log('selecionarConversa CHAMADO');
    console.log('Conversa solicitada:', conversa.id);
    console.log('Conversa ativa no ref:', conversaAtivaRef.current?.id);
    console.log('Conversa ativa no state:', conversaAtiva?.id);
    console.trace('Stack trace da chamada:');
    console.log('===============================================');
    
    // Se for a mesma conversa, nao fazer nada
    if (conversaAtivaRef.current?.id === conversa.id) {
      console.log('Mesma conversa ja esta ativa, IGNORANDO');
      console.log('===============================================');
      return;
    }
    
    console.log('Conversa diferente, procedendo...');
    
    // Parar de escutar mensagens antigas
    if (unsubscribeMensagens.current) {
      console.log('Desconectando listener de mensagens anterior');
      unsubscribeMensagens.current();
      unsubscribeMensagens.current = null;
    }

    // Atualizar ref antes de atualizar estado
    console.log('Atualizando conversaAtivaRef.current para:', conversa.id);
    conversaAtivaRef.current = conversa;
    
    console.log('Chamando setConversaAtiva');
    setConversaAtiva(conversa);
    
    // ATUALIZAR CONTADOR LOCALMENTE (UX instantâneo)
    const naoLidasAntes = conversa.naoLidas || 0;
    if (naoLidasAntes > 0) {
      console.log('🔔 Atualizando contador local instantaneamente...');
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
      console.log('✅ Contador local atualizado! Decrementado:', naoLidasAntes);
    }
    
    // ZERAR CONTADOR NO FIREBASE (em background)
    console.log('🔔 Zerando contador no Firebase...');
    mensagensService.clearUnreadCount(conversa.id, usuario.id).catch(err => {
      console.error('Erro ao zerar contador:', err);
    });

    // MARCAR NOTIFICAÇÕES COMO LIDAS
    marcarNotificacoesComoLidas(conversa.id);
    
    // NAO limpar mensagens - sera feito pelo listener
    console.log('AGUARDANDO mensagens do listener (nao limpando array)');

    // Escutar mensagens da nova conversa
    console.log('Criando listener de mensagens para conversa:', conversa.id);
    
    unsubscribeMensagens.current = mensagensService.listenToMessages(
      conversa.id,
      usuario.id,
      LIMITS.MESSAGES_PER_PAGE,
      (novasMensagens) => {
        console.log('=================================================');
        console.log('CALLBACK DO LISTENER EXECUTADO');
        console.log('Para conversa:', conversa.id);
        console.log('Quantidade de mensagens:', novasMensagens.length);
        console.log('IDs:', novasMensagens.map(m => m.id));
        console.log('FORCANDO setMensagens com', novasMensagens.length, 'mensagens');
        setMensagens(novasMensagens);
        console.log('setMensagens EXECUTADO COM SUCESSO');
        console.log('=================================================');
        
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
   * Envia uma mensagem de texto
   */
  const enviarMensagem = useCallback(async (conversaId, texto) => {
    if (!texto.trim()) return;
    
    setEnviando(true);
    try {
      const mensagemEnviada = await mensagensService.sendMessage(
        conversaId,
        usuario.id,
        texto,
        MESSAGE_TYPE.TEXTO
      );
      
      // ATUALIZAR LISTA DE CONVERSAS LOCALMENTE (UX instantâneo)
      console.log('📤 Mensagem enviada! Atualizando lista de conversas...');
      setConversas(prevConversas => {
        const conversaIndex = prevConversas.findIndex(c => c.id === conversaId);
        if (conversaIndex === -1) return prevConversas;
        
        const novasConversas = [...prevConversas];
        const conversaAtualizada = {
          ...novasConversas[conversaIndex],
          ultimaMensagem: texto.substring(0, 50),
          atualizadaEm: new Date(),
        };
        
        // Mover para o topo
        novasConversas.splice(conversaIndex, 1);
        novasConversas.unshift(conversaAtualizada);
        
        console.log('✅ Lista atualizada após envio!');
        return novasConversas;
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Nao foi possivel enviar a mensagem');
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
      console.log('📤 Arquivo enviado! Atualizando lista de conversas...');
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
        
        console.log('✅ Lista atualizada após envio de arquivo!');
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
    console.log('Carregando mensagens antigas...');
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
    console.log('🔔 Total de não lidas atualizado:', total);
    console.log('📊 Conversas com não lidas:', conversas.filter(c => c.naoLidas > 0).map(c => ({
      id: c.id,
      nome: c.nome,
      naoLidas: c.naoLidas
    })));
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
      console.log('✅ Notificações marcadas como lidas');
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
