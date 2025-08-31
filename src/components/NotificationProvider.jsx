import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
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

  useEffect(() => {
    if (!usuario?.id) return;

    // Inscreve-se para notificações de documentos legais
    const legalQuery = query(
      collection(db, 'legal'),
      orderBy('dataCriacao', 'desc')
    );

    // Inscreve-se para notificações de tarefas
    const tarefasQuery = query(
      collection(db, 'tarefas'),
      where('mencionados', 'array-contains', usuario.id),
      where('lida', '==', false)
    );

    // Inscreve-se para notificações de mensagens
    const mensagensQuery = query(
      collection(db, 'mensagens'),
      where('destinatario', '==', usuario.id),
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

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    // Envia notificação push se suportado pelo navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.titulo, {
        body: notification.mensagem,
        icon: '/logo.png'
      });
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, lida: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, lida: true }))
    );
    setUnreadCount(0);
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
