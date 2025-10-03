const CACHE_NAME = 'workflow-v2-loading-screen'; // Atualizado para forçar novo cache
const ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.*.js',
  '/static/css/main.*.css'
];

// Estado das notificações pendentes
let pendingNotifications = [];
let badgeCount = 0;

// Instalar service worker
self.addEventListener('install', (e) => {
  console.log('[SW] Instalando...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ativar service worker
self.addEventListener('activate', (e) => {
  console.log('[SW] Ativando...');
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache estratégico
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request))
  );
});

// === NOTIFICAÇÕES PUSH ===

// Receber mensagem push do Firebase
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event.data ? event.data.text() : 'sem dados');
  
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const data = payload.notification || payload.data || {};
    
    const notificationTitle = data.title || 'Nova Mensagem 💬';
    const notificationBody = data.body || 'Você recebeu uma nova mensagem';
    const notificationIcon = data.icon || '/logo192.png';
    const conversaId = data.conversaId || null;
    
    // Incrementar badge
    badgeCount++;
    if (self.registration.setAppBadge) {
      self.registration.setAppBadge(badgeCount).catch(err => 
        console.log('[SW] Badge não suportado:', err)
      );
    }
    
    // Armazenar notificação pendente
    pendingNotifications.push({
      id: Date.now(),
      title: notificationTitle,
      body: notificationBody,
      timestamp: new Date().toISOString(),
      conversaId
    });
    
    // Limitar histórico a 50 notificações
    if (pendingNotifications.length > 50) {
      pendingNotifications = pendingNotifications.slice(-50);
    }
    
    // Opções da notificação
    const notificationOptions = {
      body: notificationBody,
      icon: notificationIcon,
      badge: '/logo192.png',
      tag: conversaId ? `msg-${conversaId}` : `msg-${Date.now()}`,
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
          title: '📖 Abrir',
          icon: '/icons/open.png'
        },
        {
          action: 'reply',
          title: '✍️ Responder',
          icon: '/icons/reply.png'
        }
      ],
      // Som customizado (se suportado)
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
    
  } catch (error) {
    console.error('[SW] Erro ao processar push:', error);
  }
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event.action, event.notification.data);
  
  event.notification.close();
  
  // Limpar badge se abrir mensagens
  if (badgeCount > 0) {
    badgeCount = Math.max(0, badgeCount - 1);
    if (self.registration.setAppBadge) {
      if (badgeCount === 0) {
        self.registration.clearAppBadge().catch(err => console.log('[SW] Erro ao limpar badge:', err));
      } else {
        self.registration.setAppBadge(badgeCount).catch(err => console.log('[SW] Erro ao atualizar badge:', err));
      }
    }
  }
  
  const conversaId = event.notification.data?.conversaId;
  const urlToOpen = conversaId 
    ? `${self.location.origin}/#/mensagens?conversa=${conversaId}`
    : `${self.location.origin}/#/mensagens`;
  
  console.log('[SW] Abrindo URL:', urlToOpen);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        console.log('[SW] Janelas abertas:', windowClients.length);
        
        // Verificar se já existe uma janela aberta com a app
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('[SW] Focando janela existente e navegando...');
            
            // Enviar mensagem para o cliente navegar
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              conversaId: conversaId,
              action: 'navigate'
            });
            
            // Focar janela
            return client.focus().then(() => {
              // Navegar para a conversa
              return client.navigate(urlToOpen).catch(err => {
                console.error('[SW] Erro ao navegar:', err);
                // Se falhar, tentar via postMessage
                client.postMessage({
                  type: 'NAVIGATE_TO_CONVERSA',
                  conversaId: conversaId
                });
              });
            });
          }
        }
        
        // Se não encontrou janela aberta, abrir nova
        console.log('[SW] Abrindo nova janela...');
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(err => {
        console.error('[SW] Erro ao processar clique na notificação:', err);
      })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada');
  // Opcional: registrar analytics
});

// Sincronização em segundo plano
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Função para sincronizar mensagens offline
async function syncMessages() {
  try {
    console.log('[SW] Sincronizando mensagens...');
    // Aqui você pode adicionar lógica para sincronizar mensagens pendentes
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Erro ao sincronizar:', error);
    return Promise.reject(error);
  }
}

// Comunicação com o cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data.type === 'CLEAR_BADGE') {
    badgeCount = 0;
    if (self.registration.clearAppBadge) {
      self.registration.clearAppBadge();
    }
  }
  
  if (event.data.type === 'UPDATE_BADGE') {
    badgeCount = event.data.count || 0;
    if (self.registration.setAppBadge) {
      self.registration.setAppBadge(badgeCount);
    }
  }
  
  if (event.data.type === 'GET_PENDING_NOTIFICATIONS') {
    event.ports[0].postMessage({
      notifications: pendingNotifications,
      count: pendingNotifications.length
    });
  }
});