// Service worker: keeps the app's own files on the phone so it opens without internet.
// Entries are never cached here (they live encrypted in the phone's app storage).
const VERSION = 'dhanam-shell-1.2.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './css/app.css', './js/app.js','./js/auth.js','./js/bio.js','./js/cats.js','./js/charts.js','./js/config.js','./js/crypto.js','./js/db.js','./js/fmt.js','./js/graph.js','./js/i18n.js','./js/store.js','./js/sync.js','./js/ui.js','./js/vault.js','./js/views.js','./js/voice.js','./js/xlsx.js','./js/zip.js',
  './vendor/msal-browser-3.30.0.min.js', './fonts/NotoSansTamil-tamil.woff2', './fonts/NotoSansTamil-latin.woff2', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('dhanam-shell-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).catch(() => caches.match('./index.html'))));
});
