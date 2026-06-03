// Service worker mínimo — habilita que el prode sea "instalable" (PWA).
// No cachea nada (passthrough): siempre trae la versión más nueva del servidor.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* passthrough */ });
