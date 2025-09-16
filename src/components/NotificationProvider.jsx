import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp, addDoc } from 'firebase/firestore';
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
  const [isInstalled, setIsInstalled] = useState(false);
  const { requestPermission, isSupported } = useNotificationSetup();

  // Verifica se o app está instalado como PWA
  const updateAppBadge = (count) => {
    if (isInstalled && 'setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch((error) => {
          console.error('Erro ao atualizar badge:', error);
        });
      } else {
        navigator.clearAppBadge().catch((error) => {
          console.error('Erro ao limpar badge:', error);
        });
      }
    }
  };

  useEffect(() => {
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone ||
          document.referrer.includes('android-app://')) {
        setIsInstalled(true);
      }
    };

    checkInstallation();
    const handleBeforeInstall = () => setIsInstalled(false);
    const handleInstalled = () => setIsInstalled(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  // Atualiza o badge quando o número de notificações não lidas muda
  useEffect(() => {
    updateAppBadge(unreadCount);
  }, [unreadCount, isInstalled]);

  // Monitor de novas tarefas e empréstimos
  useEffect(() => {
    if (!usuario?.id) return;

    // Monitor de tarefas
    const tarefasRef = collection(db, 'tarefas');
    const tarefasQuery = query(
      tarefasRef,
      where('funcionariosIds', 'array-contains', usuario.nome),
      orderBy('dataCriacao', 'desc')
    );

    let lastTaskDate = new Date();

    const unsubscribeTarefas = onSnapshot(tarefasQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const tarefa = { id: change.doc.id, ...change.doc.data() };
          const tarefaDate = tarefa.dataCriacao?.toDate() || new Date();

          if (tarefaDate > lastTaskDate) {
            showNativeNotification(tarefa, 'task');
            
            const notificationData = {
              tipo: 'tarefa',
              titulo: `Nova tarefa atribuída: ${tarefa.titulo}`,
              conteudo: tarefa.descricao || 'Sem descrição',
              dataNotificacao: new Date(),
              lida: false,
              tarefaId: tarefa.id,
              destinatarioId: usuario.id
            };

            handleNewNotification(notificationData);
          }
        }
      });

      lastTaskDate = new Date();
    });

    // Monitor de empréstimos
    const emprestimosRef = collection(db, 'emprestimos');
    const emprestimosQuery = query(
      emprestimosRef,
      where('funcionario', '==', usuario.nome),
      where('status', '==', 'emprestado')
    );

    const unsubscribeEmprestimos = onSnapshot(emprestimosQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const emprestimo = { id: change.doc.id, ...change.doc.data() };
          
          // Notificação imediata do empréstimo
          showNativeNotification({
            titulo: 'Ferramenta(s) em seu nome',
            conteudo: `Você possui ${emprestimo.ferramentas.length} ferramenta(s) em seu nome.`,
            emprestimo
          }, 'loan');

          const notificationData = {
            tipo: 'emprestimo',
            titulo: 'Ferramenta(s) em seu nome',
            conteudo: `Você possui ${emprestimo.ferramentas.length} ferramenta(s) em seu nome.`,
            dataNotificacao: new Date(),
            lida: false,
            emprestimoId: emprestimo.id,
            destinatarioId: usuario.id
          };

          handleNewNotification(notificationData);

          // Agenda notificação para 24h depois
          setTimeout(() => {
            if (emprestimo.status === 'emprestado') {
              showNativeNotification({
                titulo: 'Lembrete de Devolução',
                conteudo: `Você ainda possui ${emprestimo.ferramentas.length} ferramenta(s) pendente(s) de devolução.`,
                emprestimo
              }, 'loan-reminder');

              const reminderData = {
                tipo: 'emprestimo-lembrete',
                titulo: 'Lembrete de Devolução',
                conteudo: `Você ainda possui ${emprestimo.ferramentas.length} ferramenta(s) pendente(s) de devolução.`,
                dataNotificacao: new Date(),
                lida: false,
                emprestimoId: emprestimo.id,
                destinatarioId: usuario.id
              };

              handleNewNotification(reminderData);
            }
          }, 24 * 60 * 60 * 1000); // 24 horas
        }
      });
    });

    return () => {
      unsubscribeTarefas();
      unsubscribeEmprestimos();
    };
  }, [usuario?.id, usuario?.nome]);

  const showNativeNotification = async (notificationData, type = 'message') => {
    if (!isSupported || !isInstalled) return;

    try {
      const permission = await requestPermission();
      if (permission === 'granted') {
        let title, body, tag;

        switch (type) {
          case 'task':
            title = 'Nova Tarefa Atribuída';
            body = `${notificationData.titulo}\n${notificationData.descricao || ''}`;
            tag = 'task';
            break;
          case 'loan':
            title = 'Ferramentas em Seu Nome';
            body = notificationData.conteudo;
            tag = 'loan';
            break;
          case 'loan-reminder':
            title = '⚠️ Lembrete de Devolução';
            body = notificationData.conteudo;
            tag = 'loan-reminder';
            break;
          default:
            title = 'Nova Mensagem';
            body = notificationData.conteudo;
            tag = 'message';
        }

        const options = {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          tag,
          requireInteraction: type === 'task', // Tarefas requerem interação do usuário
          data: notificationData
        };

        // Criar e mostrar a notificação
        const notification = new Notification(title, options);

        // Se for mobile e o app estiver instalado, tocar o som padrão
        if (isInstalled && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          try {
            const audio = new Audio();
            audio.play();
          } catch (error) {
            console.log('Erro ao tocar som:', error);
          }
        }

        // Adicionar listener de clique na notificação
        notification.onclick = () => {
          window.focus();
          switch (type) {
            case 'task':
              // Navegar para a aba de tarefas
              window.location.href = '/tarefas';
              break;
            case 'loan':
            case 'loan-reminder':
              // Navegar para a aba de empréstimos
              window.location.href = '/emprestimos';
              break;
            default:
              // Navegar para a página inicial
              window.location.href = '/';
          }
        };
      }
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
    }
  };

  const handleNewNotification = async (notification) => {
    // Adiciona a notificação ao Firestore primeiro
    try {
      const notificacoesRef = collection(db, 'notificacoes');
      const notificationData = {
        ...notification,
        dataNotificacao: serverTimestamp(),
        lida: false
      };

      // Adiciona a notificação ao Firestore
      await addDoc(notificacoesRef, notificationData);

      setNotifications(prev => {
        // Verifica se a notificação já existe
        const exists = prev.some(n => n.id === notification.id);
        if (!exists) {
          // Se for uma notificação de mensagem ou tarefa, mostra a notificação nativa
          if (notification.tipo === 'mensagem' || notification.tipo === 'tarefa') {
            showNativeNotification(notification, notification.tipo);
          }

          // Adiciona a nova notificação ao início do array
          const newNotifications = [notification, ...prev];
          
          // Atualiza o contador de não lidas e o badge
          const newUnreadCount = unreadCount + 1;
          setUnreadCount(newUnreadCount);
          updateAppBadge(newUnreadCount);
          
          return newNotifications;
        }
        return prev;
      });
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
    }
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
      
      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);
      updateAppBadge(newUnreadCount);

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
