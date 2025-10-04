const CACHE_NAME = 'garden-almoxarifado-v1';
const VERSION_CACHE = 'version-cache-v1';
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
  console.log('[SW] Instalando nova versão...');
  e.waitUntil(
    Promise.all([
      // Cache dos assets principais
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(ASSETS).catch(err => {
          console.warn('[SW] Erro ao cachear alguns assets:', err);
          return Promise.resolve();
        });
      }),
      // Cache do arquivo de versão
      caches.open(VERSION_CACHE).then(cache => {
        return cache.add('/version.json').catch(err => {
          console.warn('[SW] Erro ao cachear version.json:', err);
          return Promise.resolve();
        });
      })
    ]).then(() => {
      console.log('[SW] Instalação concluída, ativando...');
      return self.skipWaiting();
    })
  );
});

// Ativar service worker
self.addEventListener('activate', (e) => {
  console.log('[SW] Ativando nova versão...');
  e.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME && cache !== VERSION_CACHE) {
              console.log('[SW] Removendo cache antigo:', cache);
              return caches.delete(cache);
            }
          })
        );
      }),
      // Tomar controle de todos os clientes imediatamente
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Ativação concluída');
      // Notificar todos os clientes sobre a atualização
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            cacheName: CACHE_NAME
          });
        });
      });
    })
  );
});

// Cache estratégico com Network First para version.json
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Para version.json, sempre buscar na rede primeiro
  if (url.pathname.includes('version.json')) {
    e.respondWith(
      fetch(e.request, {
        cache: 'no-store'
      })
        .then(response => {
          // Atualizar cache com nova versão
          caches.open(VERSION_CACHE).then(cache => {
            cache.put(e.request, response.clone());
          });
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Para outros recursos, Network First com fallback para cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cachear respostas válidas
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
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
  console.log('[SW] Notificação clicada:', event.action);
  
  event.notification.close();
  
  // Limpar badge se abrir mensagens
  if (badgeCount > 0) {
    badgeCount = Math.max(0, badgeCount - 1);
    if (self.registration.setAppBadge) {
      if (badgeCount === 0) {
        self.registration.clearAppBadge();
      } else {
        self.registration.setAppBadge(badgeCount);
      }
    }
  }
  
  const urlToOpen = event.notification.data?.url || '/#/mensagens';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Verificar se já existe uma janela aberta
        for (let client of windowClients) {
          if (client.url.includes('mensagens') && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              conversaId: event.notification.data?.conversaId
            });
            return client.focus();
          }
        }
        
        // Abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
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