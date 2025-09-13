import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { useNotificationSetup } from '../hooks/useNotificationSetup';
import { useAuth } from '../hooks/useAuth';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { usuario } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { requestPermission, isSupported } = useNotificationSetup();

  const handleNewNotification = (notification) => {
    setNotifications(prev => {
      // Verifica se a notificação já existe
      const exists = prev.some(n => n.id === notification.id);
      if (!exists) {
        // Adiciona a nova notificação ao início do array
        const newNotifications = [notification, ...prev];
        // Atualiza o contador de não lidas
        setUnreadCount(count => count + 1);
        return newNotifications;
      }
      return prev;
    });
  };

  const markAsRead = async (notificationId) => {
    try {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, lida: true }
            : notification
        )
      );
      setUnreadCount(count => Math.max(0, count - 1));

      // Atualiza o status no Firestore dependendo do tipo de notificação
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        const collectionName = notification.tipo === 'legal' ? 'legal' :
                             notification.tipo === 'tarefa' ? 'tarefas' :
                             notification.tipo === 'mensagem' ? 'mensagens' :
                             notification.tipo === 'transferencia' ? 'transferencias' : null;
        
        if (collectionName) {
          const docRef = doc(db, collectionName, notificationId);
          if (notification.tipo === 'legal') {
            await updateDoc(docRef, {
              visualizadoPor: arrayUnion(usuario.id)
            });
          } else {
            await updateDoc(docRef, { lida: true });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

  // Solicitar permissão para notificações quando o usuário fizer login
  useEffect(() => {
    if (usuario && isSupported) {
      requestPermission();
    }
  }, [usuario, isSupported]);

  useEffect(() => {
    if (!usuario?.id) return;

    const unsubscribe = [];

    // Inscreve-se para notificações de documentos legais
    const legalQuery = query(
      collection(db, 'legal'),
      orderBy('dataCriacao', 'desc'),
      where('visualizadoPor', 'not-in', [usuario.id])
    );

    // Inscreve-se para notificações de tarefas
    const tarefasQuery = query(
      collection(db, 'tarefas'),
      where('mencionados', 'array-contains', usuario.id),
      where('visualizadoPor', 'not-in', [usuario.id])
    );

    // Inscreve-se para notificações de mensagens
    const mensagensQuery = query(
      collection(db, 'mensagens'),
      where('destinatario', '==', usuario.id),
      where('lida', '==', false)
    );

    // Inscreve-se para notificações de estoque baixo
    const estoqueQuery = query(
      collection(db, 'inventario'),
      where('quantidadeAtual', '<=', 5)  // Notifica quando quantidade estiver baixa
    );

    // Inscreve-se para notificações de transferências
    const transferenciasQuery = query(
      collection(db, 'transferencias'),
      where('destinatario', '==', usuario.id),
      where('status', '==', 'pendente')
    );

    // Listener para documentos legais
    unsubscribe.push(
      onSnapshot(legalQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = {
              id: change.doc.id,
              tipo: 'legal',
              titulo: 'Novo documento legal',
              mensagem: `Um novo documento legal requer sua atenção`,
              data: change.doc.data().dataCriacao,
              lida: false
            };
            handleNewNotification(notification);
          }
        });
      })
    );

    // Listener para tarefas
    unsubscribe.push(
      onSnapshot(tarefasQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const tarefa = change.doc.data();
            const notification = {
              id: change.doc.id,
              tipo: 'tarefa',
              titulo: 'Nova tarefa atribuída',
              mensagem: `Você foi mencionado na tarefa: ${tarefa.titulo}`,
              data: tarefa.dataCriacao,
              lida: false
            };
            handleNewNotification(notification);
          }
        });
      })
    );

    // Listener para mensagens
    unsubscribe.push(
      onSnapshot(mensagensQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const mensagem = change.doc.data();
            const notification = {
              id: change.doc.id,
              tipo: 'mensagem',
              titulo: 'Nova mensagem',
              mensagem: `Nova mensagem de ${mensagem.remetenteName}`,
              data: mensagem.dataCriacao,
              lida: false
            };
            handleNewNotification(notification);
          }
        });
      })
    );

    // Listener para estoque baixo
    unsubscribe.push(
      onSnapshot(estoqueQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const item = change.doc.data();
            const notification = {
              id: change.doc.id,
              tipo: 'estoque',
              titulo: 'Estoque Baixo',
              mensagem: `O item ${item.nome} está com estoque baixo (${item.quantidadeAtual} unidades)`,
              data: serverTimestamp(),
              lida: false
            };
            handleNewNotification(notification);
          }
        });
      })
    );

    // Listener para transferências
    unsubscribe.push(
      onSnapshot(transferenciasQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const transferencia = change.doc.data();
            const notification = {
              id: change.doc.id,
              tipo: 'transferencia',
              titulo: 'Nova transferência pendente',
              mensagem: `Você tem uma nova transferência pendente de ${transferencia.remetenteName}`,
              data: transferencia.dataCriacao,
              lida: false
            };
            handleNewNotification(notification);
          }
        });
      })
    );

    // Cleanup function
    return () => {
      unsubscribe.forEach(unsub => unsub());
    };
      where('lida', '==', false)
    );

    // Inscreve-se para notificações de estoque baixo
    const estoqueQuery = query(
      collection(db, 'inventario'),
      where('quantidadeAtual', '<=', 5)  // Notifica quando quantidade estiver baixa
    );

    // Inscreve-se para notificações de transferências
    const transferenciasQuery = query(
      collection(db, 'transferencias'),
      where('destinatario', '==', usuario.id),
      where('status', '==', 'pendente')
    );
      where('lida', '==', false)
    );

    // Inscreve-se para notificações de ferramentas
    const ferramentasQuery = query(
      collection(db, 'inventario'),
      where('responsavel', '==', usuario.id),
      orderBy('dataAtualizacao', 'desc')
    );

    const unsubscribeLegal = onSnapshot(legalQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const doc = change.doc.data();
          // Só notifica se o documento foi criado por outra pessoa
          if (doc.criadoPor !== usuario.nome) {
            addNotification({
              tipo: 'legal',
              titulo: 'Novo documento legal',
              mensagem: `${doc.titulo} - Versão ${doc.versao}`,
              data: doc.dataCriacao,
              id: change.doc.id
            });
          }
        }
      });
    });

    const unsubscribeTarefas = onSnapshot(tarefasQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const doc = change.doc.data();
          addNotification({
            tipo: 'tarefa',
            titulo: 'Você foi mencionado em uma tarefa',
            mensagem: doc.descricao,
            data: doc.dataCriacao,
            id: change.doc.id
          });
        }
      });
    });

    const unsubscribeMensagens = onSnapshot(mensagensQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const doc = change.doc.data();
          addNotification({
            tipo: 'mensagem',
            titulo: 'Nova mensagem',
            mensagem: doc.conteudo,
            data: doc.dataCriacao,
            id: change.doc.id
          });
        }
      });
    });

    const unsubscribeFerramentas = onSnapshot(ferramentasQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const doc = change.doc.data();
          addNotification({
            tipo: 'ferramenta',
            titulo: 'Nova ferramenta atribuída',
            mensagem: `${doc.nome} foi adicionada ao seu inventário`,
            data: doc.dataAtualizacao,
            id: change.doc.id
          });
        }
      });
    });

    return () => {
      unsubscribeLegal();
      unsubscribeTarefas();
      unsubscribeMensagens();
      unsubscribeFerramentas();
    };
  }, [usuario?.id, usuario?.nome]);

  const addNotification = async (notification) => {
    // Verifica se a notificação já existe
    const existingNotification = notifications.find(n => n.id === notification.id);
    if (existingNotification) return;

    // Adiciona timestamp e status
    const newNotification = {
      ...notification,
      timestamp: Date.now(),
      lida: false,
      mostrada: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    try {
      // Envia notificação push se suportado pelo navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        await navigator.serviceWorker.ready;
        
        const options = {
          body: notification.mensagem,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: notification.id,
          renotify: true,
          data: {
            url: window.location.origin + '/notifications',
            notificationId: notification.id
          },
          actions: [
            {
              action: 'view',
              title: 'Ver'
            },
            {
              action: 'dismiss',
              title: 'Ignorar'
            }
          ]
        };

        await navigator.serviceWorker.getRegistration()
          .then(registration => registration.showNotification(notification.titulo, options));
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Atualiza no Firestore baseado no tipo da notificação
      const collectionName = getCollectionByType(notification.tipo);
      if (collectionName) {
        const docRef = doc(db, collectionName, notificationId);
        await updateDoc(docRef, {
          visualizadoPor: arrayUnion(usuario.id),
          dataVisualizacao: serverTimestamp()
        });
      }

      // Atualiza estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, lida: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Array de promessas para atualização no Firestore
      const updatePromises = notifications
        .filter(notif => !notif.lida)
        .map(async (notification) => {
          const collectionName = getCollectionByType(notification.tipo);
          if (collectionName) {
            const docRef = doc(db, collectionName, notification.id);
            return updateDoc(docRef, {
              visualizadoPor: arrayUnion(usuario.id),
              dataVisualizacao: serverTimestamp()
            });
          }
        });

      await Promise.all(updatePromises);

      // Atualiza estado local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, lida: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
    }
  };

  // Função auxiliar para determinar a collection baseada no tipo
  const getCollectionByType = (tipo) => {
    switch (tipo) {
      case 'legal':
        return 'legal';
      case 'tarefa':
        return 'tarefas';
      case 'mensagem':
        return 'mensagens';
      case 'ferramenta':
        return 'inventario';
      default:
        return null;
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
