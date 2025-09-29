import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';

const ChatButton = ({ isOpen, onClick }) => {
  const { usuario } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();

  // Monitor de mensagens não lidas
  useEffect(() => {
    if (!usuario?.id) return;

    // Registrar service worker para notificações push
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(async function(registration) {
          console.log('Service Worker registrado com sucesso:', registration);
          
          // Solicitar permissão para notificações
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Registrar para receber push notifications
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY' // Substitua pela sua chave VAPID pública
            });
            console.log('Push Notification subscription:', subscription);
          }
        })
        .catch(function(error) {
          console.log('Erro ao registrar Service Worker:', error);
        });
    }

    console.log('Iniciando monitor de mensagens para usuário:', usuario.id);
    
    const mensagensRef = collection(db, 'mensagens');
    const q = query(
      mensagensRef,
      where('destinatario.id', '==', usuario.id),
      where('lida', '==', false),
      where('deletada', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.length;
      console.log('Mensagens não lidas encontradas:', count);
      setUnreadCount(count);
      
      // Atualiza o badge do app em dispositivos móveis
      if (isMobile && 'setAppBadge' in navigator) {
        navigator.setAppBadge(count).catch(console.error);
      }

      // Em dispositivos móveis, registra para notificações push se ainda não registrado
      if (isMobile && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
          console.log('Permissão de notificação:', permission);
        });
      }

      // Se houver novas mensagens e o app estiver em segundo plano, mostra notificação
      if (count > 0 && document.visibilityState === 'hidden') {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Nova mensagem', {
                body: `${msg.remetente.nome}: ${msg.conteudo}`,
                icon: '/logo.png',
                badge: '/logo.png',
                vibrate: [200, 100, 200],
                tag: 'chat-message',
                requireInteraction: true,
                renotify: true,
                silent: false, // Permite o som padrão do dispositivo
                actions: [
                  {
                    action: 'reply',
                    title: 'Responder',
                    icon: '/logo.png'
                  },
                  {
                    action: 'close',
                    title: 'Fechar',
                    icon: '/logo.png'
                  }
                ]
              });
            }
          }
        });
      }
    }, error => {
      console.error('Erro ao monitorar mensagens:', error);
    });

    return () => {
      console.log('Limpando monitor de mensagens');
      unsubscribe();
      if (isMobile && 'clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(console.error);
      }
    };
  }, [usuario?.id, isMobile]);

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className="relative inline-block">
        <button
          onClick={onClick}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl
            ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1D9BF0] hover:bg-[#1a8cd8]'}`}
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Fechar</span>
            </>
          ) : (
            <>
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-white" />
                {/* Instagram-style notification dot */}
                {!isOpen && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-[10px] h-[10px] rounded-full bg-[#FF3040] ring-2 ring-[#15202B]" />
                )}
              </div>
              <span className="text-white font-medium">Mensagens</span>
              {/* Message counter */}
              {unreadCount > 0 && (
                <div className="flex items-center justify-center bg-[#FF3040] text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatButton;