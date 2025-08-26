// sw.js – Service Worker за CX-Calc (PWA + офлайн)
const CACHE_NAME = 'cx-calc-1.3.5'; // Версия на кеша, редактирай при промяна на ресурсите
// Важно: промени версията при всяка промяна на кешираните ресурси!
// Това ще принуди браузъра да изтегли новия кеш и да активира новия SW.
const OFFLINE_PAGE = new URL('index.html', self.location).href;

// Активи за кеширане – редактирай списъка според файловете в проекта
const ASSETS = [
  OFFLINE_PAGE,
  'style.css',
  'mainnAll.js',
  'click.wav',
  'Calculator0.png',
  'CalculatorA.png',
  'CalcFav.png',
  'Calc32.png',
  'Calc48.png',
  'Calc120.png',
  'Calc144.png',
  'Calc192.png',
  'Calc512.png',
  'K123.png',
  'K456.png',
  'K789.png',
  'M123.png',
  'BS.png',
  'C.png',
  'Switch.png',
  'Settings.png',
  'Paste.png',
  'Plus.png',
  'Help.png',
  'Eq.png',
  'manifest.webmanifest'
].map(path => new URL(path, self.location).href);

// 1. Инсталирай SW и кеширай всички статични ресурси
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Опит за кеширане на статични ресурси...');
        // Заменяме addAll с индивидуални add заявки, за да не се провали цялата инсталация, ако един ресурс липсва.
        const cachePromises = ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            // Логваме грешка за конкретния ресурс, но не прекъсваме инсталацията.
            console.warn(`SW: Неуспешно кеширане на ресурс: ${asset}`, err);
          });
        });
        // Изчакваме всички индивидуални опити за кеширане да приключат.
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // активирай SW веднага
      .catch(error => {
        console.error('SW: Критична грешка по време на инсталация:', error);
      })
  );
});

// 2. Активирай нов SW и изтрий стари кешове
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                // Изтриваме старите кешове
                return Promise.all(
                    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
                );
            })
            .then(() => self.clients.claim()) // Поемаме контрол веднага
            .then(() => {
                // Уведомяваме всички клиенти за новата версия.
                // Това е вътре в waitUntil, за да се гарантира, че ще се изпълни.
                return self.clients.matchAll().then(clients => {
                    const match = CACHE_NAME.match(/cx-calc-([^']+)/);
                    const version = match ? match[1] : 'N/A';
                    clients.forEach(client => client.postMessage({ type: 'NEW_VERSION_AVAILABLE', version: version }));
                });
            })
    );
});

// 3. Прехващай мрежови заявки
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Пропусни cross-origin заявки
    if (url.origin !== location.origin) return;

    // Навигация (index.html) – network-first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(resp => {
                    const clone = resp.clone();
                    // caches.open(CACHE_NAME).then(c => c.put('/index.html', clone));
                    // caches.open(CACHE_NAME).then(c => c.put(request.url, clone));
                    const cleanURL = new URL(request.url);
                    cleanURL.search = '';
                    cleanURL.hash = '';
                    caches.open(CACHE_NAME).then(c => c.put(cleanURL.href, clone));
                    return resp;
                })
                //.catch(() => caches.match('/index.html'))
                //.catch(() => caches.match(event.request.url))
                .catch(() => {
                  const cleanURL = new URL(request.url);
                  cleanURL.search = '';
                  cleanURL.hash = '';
                  return caches.match(cleanURL.href);
                })
        );
        return;
    }

    // Изображения – cache-first
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) return response;
                    return fetch(request)
                        .then(resp => {
                            if (resp.ok) {
                                const clone = resp.clone();
                                caches.open(CACHE_NAME).then(c => c.put(request, clone));
                            }
                            return resp;
                        });
                })
        );
        return;
    }

    // CSS и JS – cache-first
    if (['style', 'script'].includes(request.destination)) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) return response;
                    return fetch(request)
                        .then(resp => {
                            if (resp.ok) {
                                const clone = resp.clone();
                                caches.open(CACHE_NAME).then(c => c.put(request, clone));
                            }
                            return resp;
                        });
                })
        );
        return;
    }

    // Всичко останало – network-fallback
    event.respondWith(
        fetch(request)
            .then(resp => {
                if (resp.ok && request.method === 'GET') {
                    const clone = resp.clone();
                    caches.open(CACHE_NAME).then(c => c.put(request, clone));
                }
                return resp;
            })
            .catch(() => caches.match(request).then(r => r || caches.match(OFFLINE_PAGE)))
    );
});

// 4. Слушай за съобщения от клиента (напр. за пропускане на изчакването)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
