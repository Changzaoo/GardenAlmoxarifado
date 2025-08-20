const CACHE_NAME = 'garden-almoxarifado-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.*.js',
  '/static/css/main.*.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request))
  );
});