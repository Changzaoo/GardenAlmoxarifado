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

          // Solicitar permissão para notificações
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Registrar para receber push notifications
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY' // Substitua pela sua chave VAPID pública
            });

          }
        })
        .catch(function(error) {

        });
    }

    const mensagensRef = collection(db, 'mensagens');
    const q = query(
      mensagensRef,
      where('destinatario.id', '==', usuario.id),
      where('lida', '==', false),
      where('deletada', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.length;

      setUnreadCount(count);
      
      // Atualiza o badge do app em dispositivos móveis
      if (isMobile && 'setAppBadge' in navigator) {
        navigator.setAppBadge(count).catch(console.error);
      }

      // Em dispositivos móveis, registra para notificações push se ainda não registrado
      if (isMobile && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {

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
                {/* Instagram-style notification dot with animation */}
                {!isOpen && unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#FF3040] animate-pulse" />
                  </div>
                )}
              </div>
              <span className="text-white font-medium">Mensagens</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatButton;
