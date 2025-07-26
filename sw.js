// sw.js – Service Worker за CX-Calc (PWA + офлайн)
const CACHE_NAME = 'cx-calc-v1';
const OFFLINE_PAGE = 'index.html';

// Активи за кеширане – редактирай списъка според файловете в проекта
const ASSETS = [
  OFFLINE_PAGE,
  'style.css',
  'calc.js',
  'history.js',
  'status.js',
  'fontcalc.js',
  'CalculatorF.png',
  'CalcFav.png',
  'Calc32.png',
  'Calc48.png',
  'Calc120.png',
  'Calc192.png',
  'Calc512.png',
  'manifest.webmanifest'
];

// 1. Инсталирай SW и кеширай всички статични ресурси
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Опит за кеширане на статични ресурси...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()) // активирай SW веднага
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
      .then(() => self.clients.claim()) // поеми контрол над всички клиенти
  );
});

// 3. Прехващай мрежови заявки
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропусни cross-origin заявки (напр. Google Fonts)
  if (url.origin !== location.origin) return;

  // Опитай се за мрежата, ако не успее – върни кешираното
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) return response; // върни от кеша
        return fetch(request)          // опитай мрежата
          .then(resp => {
            // кеширай динамично само успешни GET отговори
            if (resp.ok && request.method === 'GET') {
              const clone = resp.clone();
              caches.open(CACHE_NAME).then(c => c.put(request, clone));
            }
            return resp;
          });
      })
      .catch(() => {
        // Ако няма нищо в кеша и мрежата липсва, върни офлайн страницата
        return caches.match(OFFLINE_PAGE);
      })
  );
});
