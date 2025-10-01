import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { usuario } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const processedNotifications = useRef(new Set());

  // Inicializar áudio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.wav');
    audioRef.current.volume = 0.5;
  }, []);

  // Função para tocar som
  const playNotificationSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Erro ao tocar som de notificação:', err);
      });
    }
  }, [soundEnabled]);

  // Função para enviar push notification
  const sendPushNotification = useCallback(async (title, body) => {
    // Mobile - Capacitor
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
      try {
        const { LocalNotifications } = window.Capacitor.Plugins;
        const permission = await LocalNotifications.requestPermissions();
        
        if (permission.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [{
              title,
              body,
              id: Date.now(),
              sound: 'notification.mp3',
              schedule: { at: new Date(Date.now() + 100) },
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#EF4444'
            }]
          });
        }
      } catch (error) {
        console.error('Erro ao enviar notificação push:', error);
      }
    } 
    // Desktop - Web Notifications API
    else if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'workflow-notification',
          requireInteraction: false
        });
      } catch (error) {
        console.error('Erro ao criar notificação desktop:', error);
      }
    }
  }, []);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Monitorar notificações do usuário
  useEffect(() => {
    if (!usuario?.id) return;

    console.log('NotificationProvider: Monitorando notificações para', usuario.id);

    const q = query(
      collection(db, 'notificacoes'),
      where('usuarioId', '==', usuario.id),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.lida).length);

      // Detectar novas notificações não processadas
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const notif = { id: change.doc.id, ...change.doc.data() };
          
          // Verificar se é uma notificação nova (criada nos últimos 5 segundos)
          const isNew = notif.timestamp?.toDate && 
                       (Date.now() - notif.timestamp.toDate().getTime()) < 5000;
          
          // Verificar se já foi processada
          if (isNew && !processedNotifications.current.has(notif.id) && !notif.lida) {
            console.log('NotificationProvider: Nova notificação detectada!', notif);
            
            // Marcar como processada
            processedNotifications.current.add(notif.id);
            
            // Tocar som
            playNotificationSound();
            
            // Enviar push notification
            sendPushNotification(notif.titulo, notif.mensagem);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [usuario, playNotificationSound, sendPushNotification]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notificacoes', notificationId), {
        lida: true
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.lida);
      await Promise.all(
        unreadNotifications.map(n => 
          updateDoc(doc(db, 'notificacoes', n.id), { lida: true })
        )
      );
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // Função helper para criar notificação (será usada por outros componentes)
  const createNotification = async (usuarioId, tipo, titulo, mensagem, dados = {}) => {
    try {
      await addDoc(collection(db, 'notificacoes'), {
        usuarioId,
        tipo,
        titulo,
        mensagem,
        lida: false,
        timestamp: serverTimestamp(),
        dados
      });
      console.log('Notificação criada:', { usuarioId, tipo, titulo });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    soundEnabled,
    toggleSound,
    createNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
