import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ArrowLeft, Send, Image, Smile, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { notificarNovaMensagem } from '../../services/notificationService';

const ChatArea = ({ conversa, usuario, onVoltar }) => {
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [digitando, setDigitando] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  // Zerar contador imediatamente quando a conversa é aberta
  useEffect(() => {
    if (!conversa?.id || !usuario?.id) return;

    const zerarContador = async () => {
      try {
        const conversaRef = doc(db, 'conversas', conversa.id);
        await updateDoc(conversaRef, {
          [`naoLidas.${usuario.id}`]: 0
        });

      } catch (error) {
        console.error('❌ Erro ao zerar badge:', error);
      }
    };

    zerarContador();
  }, [conversa?.id, usuario?.id]);

  // Carregar mensagens
  useEffect(() => {
    if (!conversa?.id) {

      setCarregando(false);
      return;
    }

    const q = query(
      collection(db, 'mensagens'),
      where('conversaId', '==', conversa.id),
      where('status.deletada', '==', false),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMensagens(msgs);
      setCarregando(false);
    }, (error) => {
      console.error('Erro ao carregar mensagens:', error);
      setMensagens([]);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [conversa]);

  // Marcar mensagens como lidas quando a conversa é aberta
  useEffect(() => {
    if (!conversa?.id || !usuario?.id) return;

    const marcarComoLida = async () => {
      try {
        // Primeiro, zerar o contador na conversa imediatamente
        const conversaRef = doc(db, 'conversas', conversa.id);
        await updateDoc(conversaRef, {
          [`naoLidas.${usuario.id}`]: 0
        });

        // Depois, marcar as mensagens individuais como lidas
        const mensagensNaoLidas = mensagens.filter(
          msg => msg.remetenteId !== usuario.id && 
                 (!msg.status?.lida || msg.status.lida[usuario.id] === false)
        );

        if (mensagensNaoLidas.length === 0) return;

        const batch = writeBatch(db);
        
        mensagensNaoLidas.forEach(msg => {
          const msgRef = doc(db, 'mensagens', msg.id);
          batch.update(msgRef, {
            [`status.lida.${usuario.id}`]: true,
            'status.entregue': true
          });
        });

        await batch.commit();

      } catch (error) {
        console.error('❌ Erro ao marcar mensagens como lidas:', error);
      }
    };

    marcarComoLida();
  }, [mensagens, conversa?.id, usuario?.id]);

  // Enviar mensagem
  const enviarMensagem = async (conteudo, tipo = 'texto', metadata = null) => {
    if (!conteudo.trim() && tipo === 'texto') return;

    try {
      // Criar objeto de status de leitura
      const statusLida = {};
      conversa.participantes.forEach(participanteId => {
        statusLida[participanteId] = participanteId === usuario.id;
      });

      // Criar mensagem
      const novaMensagem = {
        conversaId: conversa.id,
        remetenteId: usuario.id,
        remetenteNome: usuario.nome || usuario.displayName || 'Usuário',
        conteudo,
        tipo,
        metadata,
        timestamp: serverTimestamp(),
        status: {
          entregue: true,
          lida: statusLida,
          deletada: false
        }
      };

      // Adicionar mensagem
      const mensagemDoc = await addDoc(collection(db, 'mensagens'), novaMensagem);

      // Atualizar última mensagem da conversa
      const conversaRef = doc(db, 'conversas', conversa.id);
      const updates = {
        ultimaMensagem: {
          conteudo,
          tipo,
          remetenteId: usuario.id,
          timestamp: serverTimestamp(),
          status: novaMensagem.status
        },
        ultimaAtualizacao: serverTimestamp()
      };

      // Incrementar contador de não lidas para outros participantes
      conversa.participantes.forEach(participanteId => {
        if (participanteId !== usuario.id) {
          updates[`naoLidas.${participanteId}`] = (conversa.naoLidas?.[participanteId] || 0) + 1;
        }
      });

      await updateDoc(conversaRef, updates);

      // 🔔 ENVIAR NOTIFICAÇÃO PUSH para todos os participantes (exceto o remetente)
      const nomeRemetente = usuario.nome || usuario.displayName || 'Alguém';
      conversa.participantes.forEach(async (participanteId) => {
        if (participanteId !== usuario.id) {
          try {
            await notificarNovaMensagem(
              participanteId,
              { id: mensagemDoc.id, texto: conteudo },
              nomeRemetente
            );

          } catch (error) {
            console.error(`❌ Erro ao notificar ${participanteId}:`, error);
          }
        }
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  // Nome da conversa
  const getNomeConversa = () => {
    if (conversa.tipo === 'grupo') {
      return conversa.nome;
    }
    return conversa.participantesInfo?.[0]?.nome || 'Usuário';
  };

  // Agrupar mensagens por data
  const agruparMensagensPorData = (mensagens) => {
    const grupos = {};
    
    mensagens.forEach(msg => {
      if (!msg.timestamp) return;
      
      const date = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!grupos[dateKey]) {
        grupos[dateKey] = {
          data: date,
          mensagens: []
        };
      }
      
      grupos[dateKey].mensagens.push(msg);
    });
    
    return Object.values(grupos).sort((a, b) => a.data - b.data);
  };

  const gruposMensagens = agruparMensagensPorData(mensagens);

  const formatarDataSeparador = (date) => {
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    if (format(date, 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd')) {
      return 'Hoje';
    } else if (format(date, 'yyyy-MM-dd') === format(ontem, 'yyyy-MM-dd')) {
      return 'Ontem';
    } else {
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-h-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 flex-shrink-0 shadow-sm min-h-0">
        <button
          onClick={onVoltar}
          className="md:hidden p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Avatar */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ring-2 ${
          conversa.tipo === 'grupo' 
            ? 'bg-gradient-to-br from-purple-500 to-pink-600 ring-purple-200 dark:ring-purple-900' 
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-blue-200 dark:ring-blue-900'
        } text-white font-bold text-lg overflow-hidden`}>
          {conversa.tipo === 'grupo' ? (
            conversa.nome?.charAt(0).toUpperCase()
          ) : conversa.participantesInfo?.[0]?.avatar ? (
            <img 
              src={conversa.participantesInfo[0].avatar} 
              alt={getNomeConversa()}
              className="w-full h-full object-cover"
            />
          ) : (
            getNomeConversa().charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">
            {getNomeConversa()}
          </h3>
          {conversa.tipo === 'grupo' && (
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {conversa.participantes.length} participantes
            </p>
          )}
          {digitando.length > 0 && (
            <p className="text-sm text-blue-500 font-medium animate-pulse">
              digitando...
            </p>
          )}
        </div>

        <button className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md">
          <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 min-h-0"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {carregando ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Nenhuma mensagem ainda
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Envie a primeira mensagem para iniciar a conversa
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {gruposMensagens.map((grupo, idx) => (
              <div key={idx}>
                {/* Separador de data */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {formatarDataSeparador(grupo.data)}
                    </span>
                  </div>
                </div>

                {/* Mensagens do dia */}
                <div className="space-y-2">
                  {grupo.mensagens.map((mensagem) => (
                    <MessageBubble
                      key={mensagem.id}
                      mensagem={mensagem}
                      isOwn={mensagem.remetenteId === usuario.id}
                      showAvatar={conversa.tipo === 'grupo'}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input de Mensagem */}
      <MessageInput onEnviar={enviarMensagem} />
    </div>
  );
};

export default ChatArea;
