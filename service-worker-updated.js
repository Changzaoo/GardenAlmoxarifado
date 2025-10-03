/**
 * 🔄 Service Worker Atualizado
 * Sistema de cache inteligente e atualização automática
 */

const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `garden-workflow-v${CACHE_VERSION}`;

// Arquivos essenciais para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker versão:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Força ativação imediata
        return self.skipWaiting();
      })
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker versão:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Remove caches antigos
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Assume controle imediatamente
        return self.clients.claim();
      })
      .then(() => {
        // Notifica clientes sobre nova versão
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION
            });
          });
        });
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições non-GET
  if (request.method !== 'GET') return;
  
  // Ignorar Firebase e APIs externas
  if (
    url.origin.includes('firebaseapp.com') ||
    url.origin.includes('googleapis.com') ||
    url.origin.includes('ipapi.co') ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  event.respondWith(
    // Estratégia: Network First com fallback para cache
    fetch(request)
      .then((response) => {
        // Clona resposta para cache
        const responseClone = response.clone();
        
        // Adiciona ao cache
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // Se network falhar, tenta cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Se não houver cache, retorna página offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Verificar atualizações periodicamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Força verificação de atualização
    fetch('/version.json?' + Date.now(), { cache: 'no-cache' })
      .then((response) => response.json())
      .then((data) => {
        event.source.postMessage({
          type: 'UPDATE_CHECK_RESULT',
          version: data.version,
          current: CACHE_VERSION
        });
      })
      .catch((error) => {
        console.error('[SW] Erro ao verificar atualização:', error);
      });
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(
      fetch('/version.json?' + Date.now())
        .then((response) => response.json())
        .then((data) => {
          if (data.version !== CACHE_VERSION) {
            // Notifica sobre atualização disponível
            self.registration.showNotification('Atualização Disponível', {
              body: `Nova versão ${data.version} disponível!`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'update-available'
            });
          }
        })
    );
  }
});
