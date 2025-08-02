// Calc-1-sw.js – Service Worker за CX-Calc-1 (PWA + офлайн)
const CACHE_NAME = 'cx-calc-1-v1';
const OFFLINE_PAGE = 'index.html';

// Активи за кеширане – файловете, нужни за работа на приложението
const ASSETS = [
  OFFLINE_PAGE,
  'Calc-1.json',
  'Calc-1-Fav.png',
  'Calc-1-144.png',
  'Calc-1-192.png',
  'Calc-1-512.png'
  // Ако добавите външни CSS или JS файлове, включете ги тук
];

// 1. Инсталирай SW и кеширай всички статични ресурси
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Опит за кеширане на статични ресурси...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()) // Активирай SW веднага
      .catch(error => {
        console.error('SW: Неуспешно кеширане на ресурси по време на инсталация:', error);
      })
  );
});

// 2. Активирай нов SW и изтрий стари кешове
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // Поеми контрол над всички клиенти
  );
});

// 3. Прехващай мрежови заявки (стратегия "Cache first, then network")
self.addEventListener('fetch', event => {
  // Заявките, които не са GET, се пропускат, тъй като не могат да бъдат кеширани.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match(OFFLINE_PAGE))
  );
});