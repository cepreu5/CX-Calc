// sw.js – Service Worker за CX-Calc (PWA + офлайн)
const CACHE_NAME = 'cx-calc-v1';
const OFFLINE_PAGE = '/CX-Calc/index.html';

// Активи за кеширане – редактирай списъка според файловете в проекта
const ASSETS = [
  OFFLINE_PAGE,
  '/CX-Calc/style.css',
  '/CX-Calc/calc.js',
  '/CX-Calc/history.js',
  '/CX-Calc/status.js',
  '/CX-Calc/fontcalc.js',
  '/CX-Calc/CalculatorF.png',
  '/CX-Calc/CalcFav.png',
  '/CX-Calc/Calc32.png',
  '/CX-Calc/Calc48.png',
  '/CX-Calc/Calc120.png',
  '/CX-Calc/Calc192.png',
  '/CX-Calc/Calc512.png',
  '/CX-Calc/manifest.webmanifest'
];

// 1. Инсталирай SW и кеширай всички статични ресурси
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // активирай SW веднага
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

