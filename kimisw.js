// празен service-worker – просто регистриран, за да удовлетвори PWA
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());